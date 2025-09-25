import { isBuenosDiasTime, log } from "../utils/common";
import type { Debt, GroupData, ShutUpContext } from "../types/squadTypes";
import { ERRORS } from "../utils/constants/errors";
import { CodeEnum } from "../utils/enums";
import { INSULTOS, SALUDOS } from "../utils/constants/messages";
import { BRO_STATES } from "../utils/constants/general";

export async function paTiMiCola(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const userName: string | undefined = ctx.from?.username;
        await ctx.reply("Pa ti mi cola @" + userName);
        await ctx.react("🤡");
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenasTardes(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const userName: string | undefined = ctx.from?.username;
        const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
        const isTime: number = isBuenosDiasTime(currentTime);
        if (isTime == CodeEnum.tardeCode) {
            await ctx.reply(SALUDOS.BUENAS_TARDES + " @" + userName);
            await ctx.react("❤‍🔥");
        } else {
            await ctx.reply(INSULTOS.TARDE_INSULTO + " @" + userName);
            await ctx.react("🤡");
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenasNoches(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const userName: string | undefined = ctx.from?.username;
        if (!userName) {
            log.warn("user not found");
            throw new Error("Error getting context user in salutations");
        }
        const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
        const isTime: number = isBuenosDiasTime(currentTime);
        if (isTime == CodeEnum.nocheCode) {
            await ctx.reply(SALUDOS.BUENAS_NOCHES + " @" + userName);
            await ctx.react("❤‍🔥");
        } else {
            await ctx.reply(INSULTOS.NOCHE_INSULTO + " @" + userName);
            await ctx.react("🤡");
        }

    } catch (err) {
        log.error(ERRORS.ERROR_IN_NOCHE);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function buenosDias(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const username: string | undefined = ctx.from?.username;
        if (!username) {
            log.warn("user not found");
            throw new Error("Error getting context user in salutations");
        }

        //if we are in a group chat we search for the user in the array and update
        if (ctx.session.chatType === "group") {
            const groupData: GroupData = ctx.session.groupData;
            updateSaludos(username, groupData);
        }
        const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
        const isTime: number = +isBuenosDiasTime(currentTime);
        if (isTime == CodeEnum.holaCode) {
            await ctx.reply(SALUDOS.BUENOS_DIAS + " @" + username);
            await ctx.react("❤‍🔥");
        } else {
            await ctx.reply(INSULTOS.MANANA_INSULTO + " @" + username);
            await ctx.react("🤡");
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function noBroHere(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const username: string | undefined = ctx.from?.username;
        if (!username) {
            log.warn("user not found");
            throw new Error("Error getting context user in bro salutations");
        }
        if (ctx.session.chatType === "group") {
            log.info("Group Chat");
            const groupData: GroupData = ctx.session.groupData;
            if (!groupData.isBroDeleted) {
                log.warn("This function is deactivated");
                return;
            }
            const level = groupData.broReplyLevel;
            if (level === BRO_STATES.reply) {
                log.info("Just replying to the message");
                return await ctx.reply("VAS Y LE DICES BRO A TU PADRE IMBECIL, @" + username);
            } else if (level === BRO_STATES.delete) {
                //delete mesage
                log.info("Deleting Bro message");
                await ctx.reply("Palabra prohibida, @" + username + " esto es un chat español no la digas mas");
                return await ctx.deleteMessage();
            }
        } else {
            log.info("Private chat");
            log.info("Just replying to the message");
            return await ctx.reply("VAS Y LE DICES BRO A TU PADRE IMBECIL, @" + username);
        }

    } catch (err) {
        log.error(ERRORS.ERROR_REPLY_BRO);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

/**
 * This function will update the count if salutations for the user, only works for group chats
 * @param username 
 * @param chatId 
 * @param groupData 
 */
function updateSaludos(username: string, groupData: GroupData) {
    //search for user in group data & update
    const user = groupData.chatMembers.find(u => u.username === username);
    if (!user) {
        log.error("Could not find user in salutations");
        throw new Error("Could not find user in salutations");
    }
    user.greetingCount++;
}

export async function debtReminder(ctx: ShutUpContext, debt: Debt) {
    try {
        log.info("Setting reminder for new debt");
        const chatId = ctx.chatId;
        if(!chatId) {
            log.error("Chat not found in context");
            throw new Error("Could not schedule message");
        }
        //TODO: Check this debt does not exists for this group
        const message: string = 
        `La cuenta!:\n` + 
        debt.debtors.forEach(m => m)
        + "Bizums rapiditos!";

        log.info("Sending first message");
        ctx.api.sendMessage(chatId, message);

        log.info("Setting delay of 24h");
        setInterval(async () => {
            log.info("Setting interval for next day");
            await ctx.api.sendMessage(chatId, message);
        }, 24 * 60 * 60 * 1000); // Cada 24 horas
    } catch (err) {
        log.error(ERRORS.ERROR_REPLY_BRO);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}