import { isBuenosDiasTime, log } from "../utils/common";
import { isGroupSession, type Debt, type GroupData, type ShutUpContext } from "../types/squadTypes";
import { ERRORS } from "../utils/constants/errors";
import { CodeEnum } from "../utils/enums";
import { INSULTOS, SALUDOS } from "../utils/constants/messages";
import { BRO_STATES } from "../utils/constants/general";
import { updateUserInPersistance } from "../middlewares/fileAdapter";
import { getBotState } from "../utils/state";

export async function paTiMiCola(ctx: ShutUpContext) {
    try {
        if (!ctx.session) {
            log.error("Session no inicializada");
            throw new Error("Error in buenos dias");
        }
        const userName: string | undefined = ctx.from?.username || ctx.from?.first_name;
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
        const userName: string | undefined = ctx.from?.username || ctx.from?.first_name;
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
        const userName: string | undefined = ctx.from?.username || ctx.from?.first_name;
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

        const username: string | undefined = ctx.from?.username || ctx.from?.first_name;
        if (!username) {
            log.warn("user not found");
            throw new Error("Error getting context user in salutations");
        }

        const currentTime: number = new Date().getHours();//FORMAT: 2024-11-29T18:47:42.539
        const isTime: number = +isBuenosDiasTime(currentTime);
        if (isTime == CodeEnum.holaCode) {
            await ctx.reply(SALUDOS.BUENOS_DIAS + " @" + username);
            await ctx.react("❤‍🔥");
            //if we are in a group chat we search for the user in the array and update the count
            if (ctx.session.chatType === "group") {
                const groupData: GroupData = ctx.session.groupData;
                await updateSaludos(username, groupData);
            }
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
        const username: string | undefined = ctx.from?.username || ctx.from?.first_name;
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
async function updateSaludos(username: string, groupData: GroupData) {
    //search for user in group data & update
    const user = groupData.chatMembers.find(u => u.username === username);
    if (!user) {
        log.warn("Could not find user in salutations");
        return;
    }
    user.greetingCount++;
    //update persistance
    await updateUserInPersistance(groupData.id, user);
}

/**
 * This functions checks if the session is a group and calculates who from the members array has the hightest count for
 * number of greetingCount parameter, then replys from the context.
 * 
 * @param ctx The context of the command invocation.
 * @returns A promise that resolves once the conversation ends. In case of error,
 *          the error object is returned.
 * @throws 
 */
export async function salutationsCheck(ctx: ShutUpContext) {
    try {
        // First check this is group
        //check for session
        const session = ctx.session;
        if (!session) {
            log.error("Session no inicializada");
            throw new Error("Error checking salutations");
        }
        if (!isGroupSession(session)) {
            log.warn("This is not a group - Skip without error");
            return;
        }
        // check if bot is active
        if (!getBotState()) {
            log.info("Bot is not active this function is deactivated");
            return;
        }

        log.info("Sending daily reminder for salutations");
        const groupData = session.groupData;
        //now check for group
        const members = groupData.chatMembers;
        if (members.length < 2) {
            log.info("Not enough members to do the calculation");
            return ctx.reply("No hay registratos el numero de usuarios necesarios para poder calcular los buenos dias");
        }
        //order the array from highest to lowest
        members.sort((m1, m2) => {
            if (m1.greetingCount > m2.greetingCount) return -1;
            if (m1.greetingCount < m2.greetingCount) return 1;
            return 0;
        });
        //now let's form a string
        let resString = "¿Quien da los buenos días?\n";
        let i = 1;
        members.forEach(m => {
            resString = resString.concat(i + ". " + m.username + " ha dados los buenos días: " + m.greetingCount + " días\n");
            i++;
        });
        resString = resString.concat(`Enorabuena ${members[0].username}!. Verguenza deberia darte: ${members[members.length - 1].username}`);

        // now send the message and finish
        return ctx.reply(resString);
    } catch (err) {
        log.error(ERRORS.ERROR_REPLY_BRO);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}

export async function debtReminder(ctx: ShutUpContext, debt: Debt) {
    try {
        log.info("Setting reminder for new debt");
        const chatId = ctx.chatId;
        if (!chatId) {
            log.error("Chat not found in context");
            throw new Error("Could not schedule message");
        }

        //prepare message
        const message: string =
            `La cuenta de ${debt.name}!:\n` +
            debt.debtors.forEach(m => m)
            + "Bizums rapiditos!";

        log.info("Sending first message");
        ctx.api.sendMessage(chatId, message);

        log.info("Setting delay of 24h");
        setInterval(async () => {
            log.info("Setting interval for next day");
            await ctx.api.sendMessage(chatId, message);
        }, 12 * 60 * 60 * 1000); // Cada 12 horas
    } catch (err) {
        log.error(ERRORS.ERROR_REPLY_BRO);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}