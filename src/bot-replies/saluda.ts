import type { ChatMember } from "grammy/types";
import type { Context } from "grammy";

import { isBuenosDiasTime, log, shouldBroBeDeleted } from "../utils/common";
import { getBotState } from "../utils/state";
import type { GroupData, MyChatMember } from "../types/squadTypes";
import { loadGroupData, saveGroupData } from "../middlewares/jsonHandler";
import { ERRORS } from "../utils/constants/errors";
import { CodeEnum } from "../utils/enums";
import { GENERAL, INSULTOS, SALUDOS } from "../utils/constants/messages";

export async function noBroHere(ctx: Context) {
    try {
        if(getBotState())  {
            const member: ChatMember = await ctx.getAuthor();
            const memberId: string = await member.user.id.toString();
            const chatId: string | undefined = ctx.chat?.id.toString();
            if(!chatId) {
                log.warn("No group chat available");
                if(memberId) {
                    log.info("Just replying to the message");
                    return await ctx.reply("VAS Y LE DICES BRO A TU PADRE IMBECIL, @" + member.user.username);
                }
                return;//do next outside
            } else if(shouldBroBeDeleted(chatId)) {
                //delete mesage
                log.info("Deleting Bro message");
                await ctx.reply("Palabra prohibida, @" + member.user.username + " esto es un chat español no la digas mas");
                return await ctx.deleteMessage();
            } else {
                //just reply to the message
                log.info("Just replying to the message");
                return await ctx.reply("VAS Y LE DICES BRO A TU PADRE IMBECIL, @" + member.user.username);
            }
        } else {
            log.info(GENERAL.BOT_DESACTIVADO);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_REPLY_BRO);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function paTiMiCola(ctx: Context) {
    try {
        if (getBotState()) {
            const member: ChatMember = await ctx.getAuthor();
            const userName: string | undefined = member.user.username;
            await ctx.reply("Pa ti mi cola @" + userName);
            await ctx.react("🤡");
        } else {
            log.info(GENERAL.BOT_DESACTIVADO);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenasTardes(ctx: Context) {
    try {
        if (getBotState()) {
            const userName: string | undefined = (await ctx.getAuthor()).user.username;
            if (userName) {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = isBuenosDiasTime(currentTime);
                if (isTime == CodeEnum.tardeCode) {
                    await ctx.reply(SALUDOS.BUENAS_TARDES + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(INSULTOS.TARDE_INSULTO + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ERRORS.ERROR_READING_USER);
                log.trace(ERRORS.TRACE(__filename, __dirname));
                throw new Error(ERRORS.ERROR_READING_USER);
            }
        } else {
            log.info(GENERAL.BOT_DESACTIVADO);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenasNoches(ctx: Context) {
    try {
        if (getBotState()) {
            const userName: string | undefined = (await ctx.getAuthor()).user.username;
            if (userName) {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = isBuenosDiasTime(currentTime);
                if (isTime == CodeEnum.nocheCode) {
                    await ctx.reply(SALUDOS.BUENAS_NOCHES + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(INSULTOS.NOCHE_INSULTO + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ERRORS.ERROR_READING_USER);
                log.trace(ERRORS.TRACE(__filename, __dirname));
                throw new Error(ERRORS.ERROR_READING_USER);
            }
        } else {
            log.info(GENERAL.BOT_DESACTIVADO);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_NOCHE);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenosDias(ctx: Context) {
    try {
        if (getBotState()) {
            const userName: string | undefined = (await ctx.getAuthor()).user.username;
            const chatId: string | undefined = ctx.chatId?.toString();
            if (userName && chatId) {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = +isBuenosDiasTime(currentTime);
                if (isTime == CodeEnum.holaCode) {
                    updateSaludos(userName, chatId);
                    await ctx.reply(SALUDOS.BUENOS_DIAS + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(INSULTOS.MANANA_INSULTO + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ERRORS.ERROR_READING_USER);
                log.trace(ERRORS.TRACE(__filename, __dirname));
                throw new Error(ERRORS.ERROR_READING_USER);
            }
        } else {
            log.info(GENERAL.BOT_DESACTIVADO);
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

function updateSaludos(username: string, chatId: string) {
    if (username && chatId) {
        const squadData: GroupData | undefined = loadGroupData(chatId);
        if(squadData) {
            const user: MyChatMember | undefined = squadData.chatMembers.find((m) => m.username === username);
            if (user && user.greetingCount >= 0) {
                log.info(GENERAL.SALUDO_REGISTRADO);
                user.greetingCount++;
                return saveGroupData(chatId, squadData);
            }
            log.error(ERRORS.ERROR_REGISTRANDO_SALUDO);
            return;
        }
    }
}
