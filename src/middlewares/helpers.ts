import { BotSession, BotState, MyChatMember, PrivateUser, ShutUpContext } from "../types/squadTypes";
import { Bot } from "grammy";
import { noBroHere, buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "../bot-replies/saluda";
import { broRegex, buenosDiasRegex, log } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";
import { GENERAL } from "../utils/constants/messages";
import { CodeEnum } from "../utils/enums";
import { getBotState } from "../utils/state";
import { User } from "grammy/types";

export function isGroupSession(
    session: BotSession
  ): session is BotSession & { chatType: "group" } {
    return session.chatType === "group";
  }
  
  export function isPrivateSession(
    session: BotSession
  ): session is BotSession & { chatType: "private" } {
    return session.chatType === "private";
  }

export function runBotResponses(bot: Bot<ShutUpContext & BotState>) {
    try {
        if (getBotState()) {
            bot.hears(broRegex, async (ctx: ShutUpContext) => noBroHere(ctx));
        } else {
            log.error(GENERAL.BOT_DESACTIVADO);
        }
        return;
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export function runBotSalutations(bot: Bot<ShutUpContext & BotState>) {
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

/**
 * This function is to ensure detecting users in private chats
 * 
 * @param ctx 
 * @param user 
 */
export function saveNewUser(ctx: ShutUpContext, user: User) {
    log.info("Saving new user to session");
    try {
        if (isGroupSession(ctx.session)) {
            log.info("Saving new user to group");
            const newUser: MyChatMember = {
                id: user.id,
                status: "member",
                username: user.username || "unknown",
                greetingCount: 0,
                joinedAt: new Date()
            }
            ctx.session.groupData.chatMembers.push(newUser);
        } else if (isPrivateSession(ctx.session)) {
            log.info("Saving new alone user"); 
            const newUser: PrivateUser = {
                id: user.id,
                firstInteraction: new Date(),
                username: user.username
            }
            ctx.session.userData = newUser;
        }
    } catch (err) {
        log.error(ERRORS.ERROR_READING_USER);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}