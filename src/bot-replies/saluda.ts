import { ChatMember } from "grammy/types";
import { ErrorEnum, checkUser, isBuenosDiasTime, DayPeriodsEnum, SaludosEnum, InsultosEnum, log} from "../utils/common";

export async function paTiMiCola(ctx) {
    try {
        const userName: string | undefined = (await ctx.getAuthor()).user.username;
        await ctx.reply("Pa ti mi cola @" + userName);
        await ctx.react("🤡");
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInBuenosDias);
    }
}

export async function buenasTardes(ctx) {
    try {
        const userName: string | undefined = (await ctx.getAuthor()).user.username;
        if (userName) {
            if (checkUser(userName)) {
                log.info('Chosen User Found: ' + userName);
                await ctx.reply("CALLATE @" + userName);
            } else {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = isBuenosDiasTime(currentTime);
                if (isTime == DayPeriodsEnum.tarde) {
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
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInBuenosDias);
    }
}

export async function buenasNoches(ctx) {
    try {
        const userName: string | undefined = (await ctx.getAuthor()).user.username;
        if (userName) {
            if (checkUser(userName)) {
                log.info('Chosen User Found: ' + userName);
                await ctx.reply("CALLATE @" + userName);
            } else {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = isBuenosDiasTime(currentTime);
                if (isTime == DayPeriodsEnum.noche) {
                    await ctx.reply(SaludosEnum.BuenasNoches + " @" + userName);
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
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInBuenosDias);
    }
}

export async function buenosDias(ctx) {
    try {
        const userName: string | undefined = (await ctx.getAuthor()).user.username;
        if (userName) {
            if (checkUser(userName)) {
                log.info('Chosen User Found: ' + userName);
                await ctx.reply("CALLATE @" + userName);
            } else {
                const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
                const isTime: number = isBuenosDiasTime(currentTime);
                console.log("Time in buenos dias is: " + isTime)
                if (isTime == DayPeriodsEnum.manana) {
                    await ctx.reply(SaludosEnum.buenosDias + " @" + userName);
                    await ctx.react("❤‍🔥");
                } else {
                    await ctx.reply(InsultosEnum.mañanaInsulto + " @" + userName);
                    await ctx.react("🤡");
                }
            }
        } else {
            log.error(ErrorEnum.errorReadingUser);
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error(ErrorEnum.errorReadingUser);
        }
    } catch (err) {
        log.error(ErrorEnum.errorInBuenosDias);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInBuenosDias);
    }
}

export async function generalSaludo(ctx) {
    try {
        const user: ChatMember = await ctx.getAuthor();
        if (user.user.username) {
            const userName: string = user.user.username;
            if (checkUser(userName)) {
                log.info('Chosen User Found: ' + userName);
                await ctx.reply("CALLATE @" + userName);
            } else {
                const message: string | undefined = ctx.message?.text.toLowerCase() || "";
                if (message) {
                    log.info('Replying to random user: ' + userName);
                    if (message.includes("dias") || message.includes("días") || message.includes("dia") || message.includes("día")) {
                        await ctx.reply("Buenos Dias @" + userName);
                        await ctx.react("❤‍🔥");
                    } else if (message.includes("tardes") || message.includes("tarde")) {
                        await ctx.reply("Buenas Tardes @" + userName);
                        await ctx.react("👌");
                    } else if (message.includes("noche") || message.includes("noches")) {
                        await ctx.reply("Buenas Noches @" + userName);
                        await ctx.react("👻");
                    } else if (message.includes("buenas") || message.includes("buena")) {
                        await ctx.reply("Buenaaasss @" + userName);
                        await ctx.react("🔥");
                    } else if (message.includes("hola")) {
                        await ctx.reply("Pa ti mi cola @" + userName);
                        await ctx.react("🤡");
                    }
                } else {
                    log.error(ErrorEnum.errorReadingUser);
                    log.error('Error in: ' + __filename + '-Located: ' + __dirname);
                    throw new Error(ErrorEnum.errorReadingUser);
                }
            }
        }
    } catch (err) {
        log.error('Error in: ' + __filename + '-Located: ' + __dirname);
        log.error(err);
        throw new (err);
    }
}