import type { Context, Middleware, MiddlewareFn, NextFunction } from "grammy";

import { ERRORS } from "../utils/constants/errors";
import { GroupData, GroupSession, MyChatMember, PrivateSession, RateLimitOptions, ShutUpContext } from "../types/squadTypes";
import {
    log,
    botHasAdminRights
} from "../utils/common";
import { ChatMember, User } from "grammy/types";
import { IGNORE_STATES } from "../utils/constants/general";
import { isGroupSession, saveNewUser } from "./helpers";

export const sessionInitializerMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("Initializing session...");
        //session is not initialized
        if (!ctx.session.chatType) {
            const chat = await ctx.getChat();
            const isGroup = chat.type === "group" || chat.type === "supergroup";

            if (isGroup) {
                ctx.session = {
                    chatType: "group",
                    createdAt: new Date(),
                    groupData: {
                        blockedUser: undefined,
                        isBroDeleted: false,
                        broReplyLevel: "responder",
                        userBlockLevel: "Bajo",
                        commandOnlyAdmins: true,
                        specialHour: undefined,
                        chatMembers: []
                    }
                } satisfies GroupSession;
            } else {
                if (!ctx.from) {
                    throw new Error("No user information in private chat");
                }

                ctx.session = {
                    chatType: "private",
                    createdAt: new Date(),
                    userData: {
                        id: ctx.from!.id,
                        username: ctx.from?.username,
                        firstInteraction: new Date()
                    }
                } satisfies PrivateSession;
            }
        }
    } catch (err) {
        log.error("Error initializing session");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
    return next();
};

export const botStatusSetterMiddleware: MiddlewareFn<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("Bot status middleware");
    if (ctx.message?.text?.startsWith("/") && (ctx.message.text !== '/start')) {
        return await ctx.reply("🔴 Bot desactivado. Usa /start para reactivar.");
    } else if (ctx.message?.text?.match(/^\/(start|stop)/)) {
        return next();
    }
    return next();
};

export const checkAdminMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        if(!isGroupSession(ctx.session)) {
            log.warn("Not a group");
            return next();
        }
        log.info("Checking if admin middleware");
        const groupData: GroupData = ctx.session.groupData;
        if (!groupData.commandOnlyAdmins) {
            //we cancel as this function is deactivated
            return next();
        }
        //last user that send a message
        const caller: User | undefined = ctx.from;
        if (!caller || !caller.username) {
            log.error("No user found");
            return next();
        }
        let user: MyChatMember | undefined = groupData.chatMembers.find((m) => m.username === caller.username);
        //if it does not exists save it
        if (!user) {
            log.error("User is not in session");
            saveNewUser(ctx, caller);
            return next();
        }
        if (user.status === "administrator") {
            log.info("User has admin rights");
            //do nothing allow to continue
            return next();
        } else {
            log.info("This user has no admin rights");
            return ctx.reply(`Idiota tu no tienes permiso para usar este comando!`);
        }
    } catch (err) {
        log.error(err);
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        return next();
    }
}

export const userIgnoredFilterMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("User filter middleware");
        if(!isGroupSession(ctx.session)) {
            log.warn("Not a group");
            return next();
        }
        const groupData = ctx.session.groupData;
        const userIgnored: string | undefined = groupData.blockedUser;
        const level: string = groupData.userBlockLevel;
        if (userIgnored && ctx.from?.username === userIgnored) {
            switch (level) {
                case IGNORE_STATES.low:
                    log.info("Low lever not affectig user, doing nothing");
                    return next();
                case IGNORE_STATES.medium:
                    log.info("Mid level ignore, replying to user...");
                    log.info("Blocking user: " + userIgnored);
                    return await ctx.reply("CALLATE MANUEL @" + userIgnored); //Hay que probar esto otra vez
                case IGNORE_STATES.high:
                    if (await botHasAdminRights(ctx)) {
                        //this requires checking
                        log.info("Highest level, deleting user...");
                        await ctx.reply("CALLATE MANUEL @" + userIgnored); //Hay que probar esto otra vez
                        return await ctx.deleteMessage();
                    }
                    log.warn("Bot does not have admin rights");
                    return next();
                default:
                    log.error("Error filering user...");
                    log.trace(ERRORS.TRACE(__filename, __dirname));
                    throw new Error("Value not recognized");
            }
        }
        log.info("No user being ignored...");
        return next();
    } catch (err) {
        log.error(err);
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        return next();
    }
};

/**
 * This function is called whenever a user enters/leaves the group or when his status in the group changes
 * 
 * @param ctx 
 * @param next 
 * @returns 
 */
export const groupUserStatusMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("User status middleware");
    try {
        if(!isGroupSession(ctx.session)) {
            log.warn("Not a group");
            return next();
        }
        const groupData = ctx.session.groupData;
        const newMember: ChatMember | undefined = ctx.chatMember?.new_chat_member;
        if (!newMember) {
            log.error("Empty member in context");
            return next();
        }

        const newUser: User | undefined = newMember.user;
        if (!newUser) {
            log.error("Empty user in context");
            return next();
        }

        //user joins or is promoted to admin
        if (newMember?.status === 'member' || newMember.status === 'administrator') {
            //Comprobar si existe el usuario
            const existingMember = groupData.chatMembers.find((m) => {
                m.username === newUser.username;
            });

            //it is new
            if (existingMember) {
                existingMember.status = existingMember.status;
                existingMember.greetingCount = 0;
                existingMember.joinedAt = new Date();
            } else {
                groupData.chatMembers.push({
                    username: newUser.username || "unknown",
                    status: newMember.status,
                    greetingCount: 0,
                    id: newUser.id,
                    joinedAt: new Date()
                });
            }

            log.info(`${newUser.username} ha entrado al grupo.`);
            return await ctx.reply(`¡Vaya otro imbecil, @${newUser.username}!`);
            //user left the chat
        } else if (newMember.status === 'left') {
            const memberIndex = groupData.chatMembers.findIndex((m) => m.username === newUser.username);
            if (memberIndex !== -1) {
                log.info(`${newUser.username} ha dejado el grupo. 😢`);
                groupData.chatMembers[memberIndex].status = newMember.status;
                return await ctx.reply(`Adiós @${newUser.username} `);
            }
        } else if (newMember.status === 'kicked') { //user is kicked
            const memberIndex = groupData.chatMembers.findIndex((m) => m.username === newUser.username);
            if (memberIndex !== -1) {
                log.info(`${newUser.username} ha sido kickeado.`);
                groupData.chatMembers[memberIndex].status = newMember.status;
                return await ctx.reply(`Adiós @${newUser.username}, vete a tomar por culo!`);
            }
        }
        return next();
    } catch (err) {
        log.error(err)
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        return next();
    }
};

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
            return next();
        }
        return next();
    };
}

function saveNewUser(username: string | undefined, chatId: string) {
    if (username) {
        const squadData: GroupData | undefined = loadGroupData(chatId);
        if (squadData) {
            squadData.chatMembers.forEach(member => {
                if (member.username === username) return;
            });
            const newMember: MyChatMember = {
                username: username,
                greetingCount: 0
            }
            squadData.chatMembers.push(newMember);
            saveGroupData(chatId, squadData);
        }
    }
}

function delUser(username: string | undefined, chatId: string) {
    if (username) {
        const squadData: GroupData | undefined = loadGroupData(chatId);
        if (squadData) {
            const newUserList = squadData.chatMembers.filter(member => member.username !== username);
            updateGroupData(chatId, { chatMembers: newUserList });
        }
    }
}

export function runBotResponses(bot: Bot<ShutUpContext>) {
    try {
        if(getBotState()) {
            bot.hears(broRegex, async (ctx: Context) => {
                await noBroHere(ctx);
                return;
            });
        }
        return;
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export function runBotSalutations(bot: Bot<ShutUpContext>) {
    try {
        if (buenosDiasRegex.length > 1 && getBotState()) {
            bot.hears(buenosDiasRegex[CodeEnum.mediaNocheCode], async (ctx: Context) => await buenosDias(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.tardeCode], async (ctx: Context) => await buenasTardes(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.nocheCode], async (ctx: Context) => await buenasNoches(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.holaCode], async (ctx: Context) => await paTiMiCola(ctx));
        }
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

