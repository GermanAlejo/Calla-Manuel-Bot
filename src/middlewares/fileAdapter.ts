import { FileAdapter } from "@grammyjs/storage-file";
import type { Middleware, NextFunction } from "grammy";
import type { Chat, User } from "grammy/types";

import type { BotSession, Debt, GroupData, GroupSession, MyChatMember, PrivateSession, PrivateUser, ShutUpContext } from "../types/squadTypes";
import { isChatMember, isDebt, isPrivateUser } from "../types/squadTypes";
import { log } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";
import config from "../utils/config";

export const storage = new FileAdapter<BotSession>({
    dirName: "./data/sessions",
    serializer: (data) => JSON.stringify(data, (_, value) => {
        // Convertir Dates a un formato serializable
        if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
        }
        return value;
    }, 2),//for pretty json formatting
    deserializer: (data) => JSON.parse(data, (_, value) => {
        // Reconstruir Dates desde el formato serializado
        if (value?.__type === "Date") {
            return new Date(value.value);
        }
        return value;
    })
});

//This function is in charge of initializing the session
export const sessionInitializerMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("Search for session");
        const chat = await ctx.getChat();

        if (!chat) {
            log.error("Error getting chat");
            return next();
        }

        const chatId = chat.id.toString();
        // Verificar si ya existe en persistencia
        const existingSession = await storage.read(chatId);
        if (!existingSession) {
            log.info(`Session does not exists, creating new one for chat ${chatId}`);
            // Crear nueva sesión según tipo de chat
            const chatType = chat.type;
            if (chatType != "private" && chatType != "group" && chatType != "supergroup") {
                log.error("Chat type not supported");
                return await next();
            }
            const newSession: BotSession = chat.type === "private"
                ? createPrivateSession(ctx.from!)
                : createGroupSession(chat);

            //save session
            ctx.session = newSession;
            await storage.write(chatId, ctx.session);
        }
        log.info("Session exists, returning it");
        ctx.session = existingSession;
        await next();
    } catch (err) {
        log.error(err);
        log.error("Error reading session");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        throw err;
    }
};


function createPrivateSession(user: User): BotSession {
    return {
        chatType: "private",
        createdAt: "",
        isBotActive: true,
        userData: {
            id: user.id,
            username: user.username,
            firstInteraction: "" //leave empty dates for the moment
        }
    } as PrivateSession;
}

function createGroupSession(chat: Chat.GroupChat | Chat.SupergroupChat): BotSession {
    return {
        chatType: chat.type,
        createdAt: "",
        isBotActive: true,
        groupData: {
            id: chat.id,
            blockedUser: config.manuelUser,
            isBroDeleted: false,
            broReplyLevel: "responder",
            userBlockLevel: "Bajo",
            commandOnlyAdmins: true,
            specialHour: undefined,
            chatMembers: [],
            currentDebts: []
        }
    } as GroupSession;
}

export async function updateUserInPersistance(chatId: number, user: PrivateUser | MyChatMember) {
    try {
        log.info("Saving new changes to persistance");
        const data = await storage.read(chatId.toString());
        if (data.chatType === "group" && isChatMember(user)) {
            const index = data.groupData.chatMembers.findIndex(u => u.id === user.id);
            if (index === -1) {
                log.error("user not found in data");
                throw new Error("User not found in persistance");
            }
            data.groupData.chatMembers[index] = user;
        } else if (data.chatType === "private" && isPrivateUser(user)) {
            data.userData = user;
        }
        await storage.write(chatId.toString(), data);
    } catch (err) {
        log.error(err);
        log.error("Error saving to persistance");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function saveNewUserToPersistance(chatId: number, user: PrivateUser | MyChatMember) {
    try {
        log.info("Saving new user to persistance");
        const data = await storage.read(chatId.toString());
        if (!data) {
            log.error("Session does not exist");
            throw new Error("Session does not exist");
        }
        if ((data.chatType === "group" || data.chatType === "supergroup") && isChatMember(user)) {
            log.info("Saving new Member to group");
            //if array is unasigned then initialize it empty
            //data.groupData.chatMembers ||= [];
            data.groupData.chatMembers.push(user);
        } else if (data.chatType === "private" && isPrivateUser(user)) {
            log.info("Saving new private chat");
            data.userData = user;
        }
        await storage.write(chatId.toString(), data);
    } catch (err) {
        log.error(err);
        log.error("Error saving to persistance");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}

export async function removeMemberFromPersistance(chatId: number, userId: number) {
    try {
        const data = await storage.read(chatId.toString());
        if (data.chatType !== "group" && data.chatType !== "supergroup") {
            log.error("Error - removing from private chat");
            throw new Error("Removing from private chat");
        }
        if (data?.groupData?.chatMembers) {
            // Filtrar y guardar
            data.groupData.chatMembers =
                data.groupData.chatMembers.filter(m => m.id !== userId);

            await storage.write(chatId.toString(), data);
        }
    } catch (error) {
        log.error(error);
        log.error("Error saving to persistance");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw error;
    }
}

export async function saveGroupDataToPersistance(chatId: number, groupData: GroupData) {
    try {
        const data = await storage.read(chatId.toString());
        if (data.chatType !== "group" && data.chatType !== "supergroup") {
            log.error("Error - removing from private chat");
            throw new Error("Removing from private chat");
        }
        if(data.groupData) {
            log.info("Updating group data to persistance");
            data.groupData = groupData;
            //modify file
            await storage.write(chatId.toString(), data);
        }
    } catch (error) {
        log.error(error);
        log.error("Error saving to persistance");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw error;
    }
}

export async function addDebtToPersistance(chatId: number | undefined, debt: Debt) {
    try {
        log.info("Saving new debt to persistance");
        if (!chatId) {
            log.error("Error: Not chat detected");
            return new Error("Error: Not chat detected");
        }
        const data = await storage.read(chatId.toString());
        if (data.chatType === "group" && isDebt(debt)) {
            log.info("Saving new Debt to group");
            data.groupData.currentDebts.push(debt);
        }
        await storage.write(chatId.toString(), data);
    } catch (err) {
        log.error(err);
        log.error("Error saving to persistance");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    }
}
