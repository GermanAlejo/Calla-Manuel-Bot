import type { Context, Middleware, MiddlewareFn, NextFunction } from "grammy";
import type { User } from "grammy/types";

import config from '../utils/config';
import { ERRORS } from "../utils/constants/errors";
import type { GroupData, MyChatMember, RateLimitOptions, ShutUpContext } from "../types/squadTypes";
import { isGroupSession } from "../types/squadTypes";
import { log } from "../utils/common";
import { filterIgnoredUser, handleNewUser, handleUserLeaves, isNewUserEvent, isUserLeaving, updateAdminPriviledges } from "./helpers";
import { saveNewUserToPersistance } from "./fileAdapter";

/**
 * This function middleware should work with admin comands ensuring only admins can use them
 * @param ctx 
 * @param next 
 * @returns 
 */
export const checkAdminMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("Check Admin Middleware...");
        if (!isGroupSession(ctx.session)) {
            log.info("Not a group, we allow to use");
            return next();
        }
        log.info("Checking if admin middleware");
        const groupData: GroupData = ctx.session.groupData;
        if (!groupData.commandOnlyAdmins) {
            //we cancel as this function is deactivated
            log.info("Admin commands only is deactivated")
            return;
        }
        //last user that send a message
        const caller: User | undefined = ctx.from;
        if (!caller || !caller.username) {
            log.error("No user found");
            return;
        }
        const user: MyChatMember | undefined = groupData.chatMembers.find((m) => m.username === caller.username);
        //if it does not exists save it
        if (!user || user.status !== "administrator") {
            log.info("User has no admin rights or is not found");
            await ctx.reply(`❌ Idiota tu no tienes permiso para usar este comando! ❌`);
            return;
        }
        //allow middleware to continue
        return next();
    } catch (err) {
        log.error(err);
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw new Error("Unexpected error in admin middleware");
    }
}

/**
 * We will replace this middleware, so we check whether the user is to ignored or the creator, and act accordinly,
 * also if the user is not saved in persistance, save it
 * This middleware should ensure an ignore user cannot use the bot
 * @param ctx 
 * @param next 
 * @returns 
 */
export const userFilterMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("User filter middleware");
        if (!isGroupSession(ctx.session)) {
            log.warn("Not a group - continue");
            return next();
        }
        const chatId = ctx.chat?.id;
        if (!chatId) {
            log.error("Error with chat in filter");
            throw new Error("Error with chat in filter");
        }
        const caller = ctx.from;
        const groupData = ctx.session.groupData;
        const userIgnored: string | undefined = groupData.blockedUser || config.manuelUser;
        const level: string = groupData.userBlockLevel;

        if (!caller) {
            log.error("Error with user filter");
            throw new Error("Error in filter");
        }
        //set the status
        const status = (await ctx.getChatMember(caller?.id)).status;
        //check if user exists
        let user = groupData.chatMembers.find(u => u.id === caller.id);
        //if the user is not saved we save it, in other case we skip
        if (!user) {
            const userName = caller.username || caller.first_name;
            let isAdmin = false;
            //check if creator
            if (status === "creator" || userName === config.firstAdmin || userName === config.secondAdmin) {
                isAdmin = true;
            }

            user = {
                    id: caller.id,
                    status: status,
                    username: userName || "unknown",
                    greetingCount: 0,
                    joinedAt: "",
                    isAdmin: isAdmin
                }
            //save creator user
            await saveNewUserToPersistance(chatId, user);
        }

        //now we check if the user is the one to be ignored
        if (!userIgnored) {
            log.info("The blocked user is disabled/no user set");
            return next();
        }
        if (userIgnored === user.username) {
            return await filterIgnoredUser(ctx, userIgnored, level);
        }
        return next();
    } catch (err) {
        log.error("Error in user ignore middleware");
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        throw err;
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
    try {
        log.info("User status middleware");
        if (!isGroupSession(ctx.session)) {
            log.warn("Not a group");
            return;
        }
        const groupData = ctx.session.groupData;
        const chat = ctx.chat;
        const update = ctx.chatMember!;
        const user = update.new_chat_member.user;
        const oldStatus = update.old_chat_member.status;
        const newStatus = update.new_chat_member.status;

        if (!chat || chat.id) {
            log.error("Chat is undefined...");
            throw new Error("Chat is undefined");
        }

        //handle new user
        if (isNewUserEvent(newStatus, oldStatus)) {
            log.info("New user detected, saving new user");
            await handleNewUser(ctx, user, groupData, newStatus);
            log.info(`${user.username} ha entrado al grupo.`);
            return await ctx.reply(`¡Vaya otro imbecil, @${user.username}!`);
        }

        //User leaves the group
        if (isUserLeaving(newStatus, oldStatus)) {
            log.info("User leaved the group...");
            const newMembersList = await handleUserLeaves(user, groupData, chat?.id);
            //guardar en session lista actualizada
            ctx.session.groupData.chatMembers = newMembersList;
            log.info(`${user.username} ha dejado el grupo.`);
            return await ctx.reply(`👋 Adiós @${user.username} 😢`);
        }

        //change in status
        if (oldStatus !== newStatus) {
            log.info("Current user changed status");
            if (newStatus == "administrator") {
                log.info("User is not admin");
                await updateAdminPriviledges(groupData, user.id, chat.id, true);
                return await ctx.reply(`👑 @${user.username} es ahora administrador!`);
            } else if (oldStatus === "administrator") {
                log.info("User is admin no more");
                await updateAdminPriviledges(groupData, user.id, chat.id, false);
                return await ctx.reply(`😢 @${user.username} ya no es administrador`);
            }
        }
        return;
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
            log.info("The request is not a command!");
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

