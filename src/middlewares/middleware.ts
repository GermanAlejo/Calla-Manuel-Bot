import { Bot, Context, Middleware, MiddlewareFn, NextFunction } from "grammy";
import { getBotState, setBotState } from "../utils/state";
import { buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "../bot-replies/saluda";
import { buenosDiasRegex, TimeComparatorEnum, log, BLOCKED_USERNAME, ignoreUser } from "../utils/common";
import { ErrorEnum } from "../utils/enums";
import { loadGroupData, loadGroupDataStore, saveGroupData, saveGroupDataStore, updateGroupData } from "./jsonHandler";
import { GroupData, GroupDataStore, MyChatMember, RateLimitOptions } from "../types/squadTypes";

// la funcion guarda solo 1 grupo sobreescribiendo los que ya han sido gruardados
export const joinGroupMiddleware: Middleware<Context> = async (ctx: Context, next: NextFunction) => {

    const chatGroup = ctx.chat;
    const myChatMember = ctx.myChatMember;
    if (chatGroup && myChatMember) {
        if (myChatMember?.new_chat_member.status === 'member') {
            log.info("Bot joined a new group with id: " + chatGroup?.id);
            log.info("Nueva peticion de chat");
            const newGroupData: GroupData = {
                adminUsers: [],
                blockedUser: "",
                isUserBlocked: false,
                commandOnlyAdmins: true,
                specialHour: "16.58",
                chatMembers: []
            }
            const myStore: GroupDataStore = await loadGroupDataStore();
            if(!myStore[chatGroup.id.toString()]) {
                myStore[chatGroup.id.toString()] = newGroupData;
                await saveGroupDataStore(myStore);
            }
        }
    }
    return next();
}

export const botStatusMiddleware: MiddlewareFn<Context> = async (ctx: Context, next: NextFunction) => {
    log.info("Bot status middleware");
    if (!getBotState()) {
        log.info("El bot esta desactivado");
        if (ctx.message?.text?.startsWith("/") && (ctx.message.text !== '/start')) {
            return ctx.reply("El bot esta desactivado usa el comando /start para activarlo");
        } else if (ctx.message?.text?.startsWith("/") && (ctx.message.text === '/start')) {
            setBotState(true);
            return ctx.reply("Bot activado");
        }
    }
    return next();
};

export const userFilterMiddleware: Middleware<Context> = async (ctx: Context, next: NextFunction) => {
    log.info("User filter middleware");
    if (ctx.from?.username === BLOCKED_USERNAME && ignoreUser) {
        log.info("Blocking user: " + BLOCKED_USERNAME);
        return ctx.reply("CALLATE MANUEL @" + BLOCKED_USERNAME); //Hay que probar esto otra vez
    }
    log.info("No user being ignored...");
    return next();
};

export const userDetectedMiddleware: Middleware<Context> = async (ctx: Context, next: NextFunction) => {
    log.info("User detected middleware");
    const username = ctx.from?.username || ctx.from?.first_name;
    const chatId = ctx.chatId?.toString();
    if (username && chatId) {
        const data: GroupDataStore = await loadGroupDataStore();
        const chatData: GroupData = data[chatId];
        if (chatData) {
            const userExists = chatData.chatMembers.some((m: MyChatMember) => m.username === username);
            if (!userExists) {
                log.info("User detected");
                const newMember: MyChatMember = {
                    username: username,
                    greetingCount: 0
                }
                chatData.chatMembers.push(newMember);
                await updateGroupData(chatId, chatData);
            }
        }
        return next();
    }
};

export const userStatusMiddleware: Middleware<Context> = async (ctx: Context, next: NextFunction) => {
    log.info("User status middleware");
    if (ctx.chat?.type === "group") {
        const chatId: string | undefined = ctx.chatId?.toString();
        if (chatId) {
            // Verificamos si el mensaje fue enviado por un usuario nuevo
            if (ctx.message?.new_chat_members) {
                ctx.message.new_chat_members.forEach(async (newUser) => {
                    log.info(`${newUser.username} ha entrado al grupo.`);
                    await saveNewUser(newUser.username, chatId);
                    await ctx.reply(`¡Vaya otro imbecil, @${newUser.username}!`);
                });
            }
            // Detectamos cuando un usuario sale
            if (ctx.message?.left_chat_member) {
                const leftUser = ctx.message.left_chat_member;
                log.info(`${leftUser.username} ha dejado el grupo.`);
                await delUser(leftUser.username, chatId);
                return ctx.reply(`Adiós @${leftUser.username}, vete a tomar por culo`);
            }
        }
    }
    return next();
};

export const checkAdminMiddleware: Middleware<Context> = async (ctx: Context, next: NextFunction) => {
    const chatId: string | undefined = ctx.chatId?.toString();
    if (chatId) {
        const data: GroupData | undefined = await loadGroupData(chatId);
        if (data) {
            const admins: string[] = data.adminUsers;
            const isAdminActive: boolean = data.commandOnlyAdmins;
            const caller: string | undefined = ctx.from?.username;
            if (!isAdminActive) {
                return next();
            }
            if (admins && caller) {
                if (!admins.includes(caller)) {
                    log.info("This user has no admin rights");
                    return ctx.reply(`Idiota tu no tienes permiso para usar este comando!`);
                }
            }
        }
    } else {
        log.error("Chat ID not found");
    }
    return next();
}

export const requestRateLimitMiddleware = (options: RateLimitOptions): MiddlewareFn => {
    const userRequests: Record<number, { count: number; lastRequest: number }> = {};
    log.info("Executing requests Middleware...");

    return async (ctx: Context, next: NextFunction) => {
        const isCommand = ctx.message?.text?.charAt(0);
        if (isCommand !== '/') {
            log.warn("The request is not a command!");
            return next();
        }
        const userId = ctx.from?.id;
        if (!userId) {
            log.error("The user does not exists");
            return next();
        }

        const now = Date.now();
        const userData = userRequests[userId] || { count: 0, lastRequest: 0 };

        // Reiniciar contador si ha pasado la ventana de tiempo
        if (now - userData.lastRequest > options.timeWindow) {
            log.info("The user is in the windows time, reseting time window");
            userRequests[userId] = { count: 1, lastRequest: now };
            return next();
        }

        // Incrementar contador y validar límites
        userData.count += 1;
        userData.lastRequest = now;

        if (userData.count > options.limit) {
            if (options.onLimitExceeded) {
                log.info("awaiting limit exceed callback...");
                await options.onLimitExceeded(ctx);
            } else {
                log.warn("Limit of requests reached by user");
                await ctx.reply("⚠️ Has alcanzado el límite de solicitudes. Intenta nuevamente más tarde.");
            }
            return;
        }

        return next();
    };
}

async function saveNewUser(username: string | undefined, chatId: string) {
    if (username) {
        const squadData: GroupData | undefined = await loadGroupData(chatId);
        if (squadData) {
            squadData.chatMembers.forEach(member => {
                if (member.username === username) return;
            });
            const newMember: MyChatMember = {
                username: username,
                greetingCount: 0
            }
            squadData.chatMembers.push(newMember);
            await saveGroupData(chatId, squadData);
        }
    }
}

async function delUser(username: string | undefined, chatId: string) {
    if (username) {
        const squadData: GroupData | undefined = await loadGroupData(chatId);
        if (squadData) {
            const newUserList = squadData.chatMembers.filter(member => member.username !== username);
            await updateGroupData(chatId, { chatMembers: newUserList });
        }
    }
}

export function runBotSalutations(bot: Bot) {
    try {
        if (buenosDiasRegex.length > 1 && getBotState()) {
            bot.hears(buenosDiasRegex[TimeComparatorEnum.mananaCode], async (ctx: Context) => await buenosDias(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.tardeCode], async (ctx: Context) => await buenasTardes(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.nocheCode], async (ctx: Context) => await buenasNoches(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.holaCode], async (ctx: Context) => await paTiMiCola(ctx));
        }
    } catch (err) {
        log.error(ErrorEnum.errorReadingUser);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

