import { ChatMember } from "grammy/types";
import { isBuenosDiasTime, log, TimeComparatorEnum } from "../utils/common";
import { Context } from "grammy";
import { getBotState } from "../utils/state";
import { ErrorEnum, SaludosEnum, InsultosEnum } from "../utils/enums";
import { GroupData, MyChatMember } from "../types/squadTypes";
import { loadGroupData, saveGroupData } from "../middlewares/jsonHandler";

export async function paTiMiCola(ctx: Context) {
    try {
        if (getBotState()) {
            const member: ChatMember = await ctx.getAuthor();
            const userName: string | undefined = member.user.username;
            await ctx.reply("Pa ti mi cola @" + userName);
            await ctx.react("🤡");
        } else {
            log.info("Bot desactivado");
        }
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
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
                if (isTime == TimeComparatorEnum.tardeCode) {
                    await ctx.reply(SaludosEnum.buenasTardes + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(InsultosEnum.tardeInsulto + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ErrorEnum.errorReadingUser);
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                throw new Error(ErrorEnum.errorReadingUser);
            }
        } else {
            log.info("Bot desactivado");
        }
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
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
                if (isTime == TimeComparatorEnum.nocheCode) {
                    await ctx.reply(SaludosEnum.buenasNoches + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(InsultosEnum.nocheInsulto + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ErrorEnum.errorReadingUser);
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                throw new Error(ErrorEnum.errorReadingUser);
            }
        } else {
            log.info("Bot desactivado");
        }
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export async function buenosDias(ctx: Context) {
    try {
        if (getBotState()) {
            const userName: string | undefined = (await ctx.getAuthor()).user.username;
            const chatId: string | undefined = await ctx.chatId?.toString();
            if (userName && chatId) {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = +isBuenosDiasTime(currentTime);
                if (isTime == TimeComparatorEnum.mananaCode) {
                    await updateSaludos(userName, chatId);
                    await ctx.reply(SaludosEnum.buenosDias + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(InsultosEnum.mananaInsulto + " @" + userName);
                    await ctx.react("🤡");
                }

            } else {
                log.error(ErrorEnum.errorReadingUser);
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                throw new Error(ErrorEnum.errorReadingUser);
            }
        } else {
            log.info("Bot desactivado");
        }
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

async function updateSaludos(username: string, chatId: string) {
    if (username) {
        const squadData: GroupData | undefined = await loadGroupData(chatId);
        if(squadData) {
            const user: MyChatMember | undefined = squadData.chatMembers.find((m) => m.username === username);
            if (user && user.greetingCount >= 0) {
                log.info("Saludo registrado");
                user.greetingCount++;
                return await saveGroupData(chatId, squadData);
            }
            log.error("Error registrando saludo");
            return;
        }
    }
}
