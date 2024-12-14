import { ChatMember } from "grammy/types";
import { ErrorEnum, checkUser, isBuenosDiasTime, SaludosEnum, InsultosEnum, log, TimeComparatorEnum } from "../utils/common";
import { Context } from "grammy";
import { getBotState } from "../utils/state";

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
                if (checkUser(userName)) {
                    log.info('Chosen User Found: ' + userName);
                    await ctx.reply("CALLATE @" + userName);
                } else {
                    const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                    const isTime: number = isBuenosDiasTime(currentTime);
                    if (isTime == TimeComparatorEnum.tardeCode) {
                        await ctx.reply(SaludosEnum.buenasTardes + " @" + userName);
                        await ctx.react("❤‍🔥");
                    } else {
                        await ctx.reply(InsultosEnum.tardeInsulto + " @" + userName);
                        await ctx.react("🤡");
                    }
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
                if (checkUser(userName)) {
                    log.info('Chosen User Found: ' + userName);
                    await ctx.reply("CALLATE @" + userName);
                } else {
                    const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                    const isTime: number = isBuenosDiasTime(currentTime);
                    if (isTime == TimeComparatorEnum.nocheCode) {
                        await ctx.reply(SaludosEnum.buenasNoches + " @" + userName);
                        await ctx.react("❤‍🔥");
                    } else {
                        await ctx.reply(InsultosEnum.nocheInsulto + " @" + userName);
                        await ctx.react("🤡");
                    }
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
            if (userName) {
                if (checkUser(userName)) {
                    log.info('Chosen User Found: ' + userName);
                    await ctx.reply("CALLATE @" + userName);
                } else {
                    const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                    const isTime: number = +isBuenosDiasTime(currentTime);
                    if (isTime == TimeComparatorEnum.mananaCode) {
                        await ctx.reply(SaludosEnum.buenosDias + " @" + userName);
                        await ctx.react("❤‍🔥");
                    } else {
                        await ctx.reply(InsultosEnum.mananaInsulto + " @" + userName);
                        await ctx.react("🤡");
                    }
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
