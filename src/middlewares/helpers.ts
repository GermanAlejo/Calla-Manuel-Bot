import type { Bot } from "grammy";
import type { User } from "grammy/types";

import { isGroupSession, isPrivateSession } from "../types/squadTypes";
import type { GroupData, PrivateUser, MyChatMember, ShutUpContext } from "../types/squadTypes";
import { noBroHere, buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "../bot-replies/saluda";
import { botHasAdminRights, broRegex, buenosDiasRegex, log } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";
import { GENERAL } from "../utils/constants/messages";
import { CodeEnum } from "../utils/enums";
import { getBotState } from "../utils/state";
import { removeMemberFromPersistance, saveNewUserToPersistance, updateUserInPersistance } from "./fileAdapter";
import { IGNORE_STATES } from "../utils/constants/general";

export function runBotResponses(bot: Bot<ShutUpContext>) {
    try {
        if (!getBotState()) {
            log.error(GENERAL.BOT_DESACTIVADO);
            return;
        }
        return bot.hears(broRegex, async (ctx: ShutUpContext) => noBroHere(ctx));;
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export function runBotSalutations(bot: Bot<ShutUpContext>) {
    try {
        if (buenosDiasRegex.length > 1 && getBotState()) {
            bot.hears(buenosDiasRegex[CodeEnum.mediaNocheCode], async (ctx: ShutUpContext) => await buenosDias(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.tardeCode], async (ctx: ShutUpContext) => await buenasTardes(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.nocheCode], async (ctx: ShutUpContext) => await buenasNoches(ctx));
            bot.hears(buenosDiasRegex[CodeEnum.holaCode], async (ctx: ShutUpContext) => await paTiMiCola(ctx));
        }
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function filterIgnoredUser(ctx: ShutUpContext, userIgnored: string, level: string) {
    try {
        log.info("User to be ignored found");
        switch (level) {
            case IGNORE_STATES.low:
                log.info("Low lever not affectig user, doing nothing");
                break;
            case IGNORE_STATES.medium:
                log.info("Mid level ignore, replying to user...");
                log.info("Blocking user: " + userIgnored);
                await ctx.reply("CALLATE MANUEL @" + userIgnored); //Hay que probar esto otra vez
                break;
            case IGNORE_STATES.high:
                //this requires checking
                log.info("Highest level, deleting user...");
                if (await botHasAdminRights(ctx)) {
                    await ctx.reply("CALLATE MANUEL @" + userIgnored); //Hay que probar esto otra vez
                    await ctx.deleteMessage();
                    break;
                }
                log.warn("Bot does not have admin rights");
                await ctx.reply("CALLATE MANUEL @" + userIgnored); //Hay que probar esto otra vez
                break;
            default:
                log.warn("Error filtering ignored user...");
                break;
        }
    } catch (err) {
        log.error("Error filtering ignored user");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

/**
 * This function is to ensure detecting users in private chats
 * 
 * @param ctx 
 * @param user 
 */
export async function saveNewUser(ctx: ShutUpContext, user: User, newStatus: "left" | "kicked" | "creator" | "administrator" | "member" | "restricted") {
    log.info("Saving new user to session");
    try {
        const chatId = ctx.chat?.id;
        if (!chatId) {
            log.error("Error getting chatId");
            throw new Error("Error getting chatId when saving user");
        }
        if (isGroupSession(ctx.session)) {
            log.info("Saving new user to group");
            const newUser: MyChatMember = {
                id: user.id,
                status: newStatus,
                username: user.username || "unknown",
                greetingCount: 0,
                joinedAt: "",
                isAdmin: false
            }
            ctx.session.groupData.chatMembers.push(newUser);
            //save changes to persistance here
            await saveNewUserToPersistance(chatId, newUser);
        } else if (isPrivateSession(ctx.session)) {
            log.info("Saving new alone user");
            const newUser: PrivateUser = {
                id: user.id,
                firstInteraction: "",
                username: user.username
            }
            ctx.session.userData = newUser;
            //save changes to persistance
            await saveNewUserToPersistance(chatId, newUser);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function handleNewUser(ctx: ShutUpContext, user: User, groupData: GroupData, newStatus: "left" | "kicked" | "creator" | "administrator" | "member" | "restricted") {
    try {
        //Comprobar si existe el usuario 
        const existingMember = groupData.chatMembers.find((m) => m.username === user.username);
        if (existingMember) {
            log.warn("User was already in persistance");
            return;
        }
        log.info("User was not saved in persistance, saving...");
        await saveNewUser(ctx, user, newStatus);
        return;
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function handleUserLeaves(user: User, groupData: GroupData, chatId: number) {
    try {
        //Comprobar si existe y eliminarlo de la session 
        const updatedMembers = groupData.chatMembers.filter(m => m.username === user.username);
        //guardar cambios en la persistencia
        await removeMemberFromPersistance(chatId, user.id);
        return updatedMembers;
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function updateAdminPriviledges(groupData: GroupData, userId: number, chatId: number, willAdmin: boolean) {
    try {
        log.info("Changing admin rights to: " + willAdmin);
        const user = groupData.chatMembers.find(m => m.id === userId);
        if (!user) {
            log.error("User not found in session");
            throw new Error("User not found");
        }
        user.isAdmin = willAdmin;
        await updateUserInPersistance(chatId, user);
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export function isNewUserEvent(newStatus: string, oldStatus: string): boolean {
    if(!newStatus || !oldStatus) {
        log.error("Statuses empty");
        throw new Error("One or more statuses are undefined");
    }
    return (oldStatus === "left" || oldStatus === "kicked" || oldStatus === "creator") &&
            (newStatus === "member" || newStatus === "administrator" || newStatus === "creator");
}

export function isUserLeaving(newStatus: string, oldStatus: string): boolean {
    if(!newStatus || !oldStatus) {
        log.error("Statuses empty");
        throw new Error("One or more statuses are undefined");
    }
    return (newStatus === "left" || newStatus === "kicked") && (oldStatus === "member" || oldStatus === "administrator" || oldStatus === "creator");    
}