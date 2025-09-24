import { FileAdapter } from "@grammyjs/storage-file";
import type { Middleware, NextFunction } from "grammy";
import type { Chat, User } from "grammy/types";

import type { BotSession, GroupSession, MyChatMember, PrivateSession, PrivateUser, ShutUpContext } from "../types/squadTypes";
import { isChatMember, isPrivateUser } from "../types/squadTypes";
import { log } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";


export const storage = new FileAdapter<BotSession>({
    dirName: "./data/sessions.json",
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

//This is a middlware fuction to handle persistance
export const persistenceMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("In persistence middleware");

    const chatId = ctx.chat?.id;

    if (!chatId) {
        log.error("Invalid id");
        return next()
    };

    // Guardar automáticamente si es nueva sesión
    if (!ctx.session) {
        log.info("New session saved");
        await storage.write(chatId.toString(), ctx.session);
    }

    await next();

    // Actualizar persistencia después de modificaciones
    log.info("Updating session...");
    await storage.write(chatId.toString(), ctx.session);
};

//This function is in charge of initializing the session
export const sessionInitializerMiddleware: Middleware<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    try {
        log.info("Search for session");
        const chat = await ctx.getChat();
        const chatId = chat.id.toString();

        if (!chat) {
            log.error("Error getting chat");
            return next();
        }
        // Verificar si ya existe en persistencia
        const existingSession = await storage.read(chatId);
        if (existingSession) {
            log.info("Session exists, returning it");
            ctx.session = existingSession;
        } else {
            log.info("Session does not exists, creating new one");
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
            blockedUser: undefined,
            isBroDeleted: false,
            broReplyLevel: "responder",
            userBlockLevel: "Bajo",
            commandOnlyAdmins: true,
            specialHour: undefined,
            chatMembers: []
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
        if (data.chatType === "group" && isChatMember(user)) {
            log.info("Saving new Member to group");
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
        if (data.chatType !== "group") {
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
