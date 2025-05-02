import { FileAdapter } from "@grammyjs/storage-file";
import { BotSession, GroupSession, PrivateSession, ShutUpContext } from "../types/squadTypes";
import { Middleware, NextFunction } from "grammy";
import { log } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";
import { Chat, User } from "grammy/types";


export const storage = new FileAdapter<BotSession>({
    dirName: "./data/sessions.json",
    serializer: (data) => JSON.stringify(data, (_, value) => {
        // Convertir Dates a un formato serializable
        if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
        }
        return value;
    }),
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
        log.info("Searach for session");
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
        }

        await next();
        await storage.write(chatId, ctx.session);
    } catch (err) {
        log.error(err);
        log.error("Error reading session");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        //this is so the bot does not break
        return next();
    }
};


function createPrivateSession(user: User): BotSession {
    return {
        chatType: "private",
        createdAt: new Date(),
        userData: {
            id: user.id,
            username: user.username,
            firstInteraction: new Date()
        }
    } as PrivateSession;
}

function createGroupSession(chat: Chat): BotSession {
    return {
        chatType: "group",
        createdAt: new Date(),
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
