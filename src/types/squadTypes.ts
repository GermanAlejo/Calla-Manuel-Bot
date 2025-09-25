import type { Context, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";

//tipo base de la session
export type BotSession =
    | (PrivateSession & { chatType: "private" })
    | (GroupSession & { chatType: "group" | "supergroup" });

// Extender el contexto de Grammy con la sesión
export type ShutUpContext = Context & SessionFlavor<BotSession> & ConversationFlavor<Context>;

//Tipo para conversaciones
//export type ShutUpConversationContext = ShutUpContext;
export type ShutUpConversation = Conversation<ShutUpContext, ShutUpContext>;

export interface PrivateUser {
    id: number;
    username?: string;
    firstInteraction?: string;
}

export interface MyChatMember {
    id: number;
    username: string;
    status:  "creator" | "administrator" | "member" | "restricted" | "left" | "kicked"; //this field possible values match grammys
    greetingCount: number;
    joinedAt?: string;
    isAdmin: boolean;
}

export interface Debt {
    name: string;
    debtors: string[];
}

export interface GroupData {
    blockedUser: string | undefined; // username
    isBroDeleted: boolean; //indica si se debe responder/ignorar al usuario
    broReplyLevel: "responder" | "borrar";
    userBlockLevel: "Bajo" | "Medio" | "Alto"; // Indica si algún usuario está bloqueado
    commandOnlyAdmins: boolean; // Si solo los administradores pueden usar comandos
    specialHour: string | undefined; // Hora especial en formato "HH:mm", o null si no está configurada
    chatMembers: MyChatMember[];
    currentDebts: Debt[];
}

export interface BaseSession {
    chatType: "private" | "group" | "supergroup";
    createdAt?: string;
    isBotActive: boolean;
}

export interface GroupSession extends BaseSession {
    chatType: "group" | "supergroup";
    groupData: GroupData;
}

export interface PrivateSession extends BaseSession {
    chatType: "private";
    userData: PrivateUser;
}

export interface RateLimitOptions {
    limit: number; // Máximo de solicitudes permitidas
    timeWindow: number; // Ventana de tiempo en milisegundos
    onLimitExceeded?: (ctx: Context) => Promise<void> | void; // Callback para manejar cuando el límite se excede
}

//TypeGuards
export function isGroupSession(session: BotSession | undefined): session is GroupSession {
    return session?.chatType === "group" || session?.chatType === "supergroup";
}

export function isPrivateSession(session: BotSession | undefined): session is PrivateSession {
    return session?.chatType === "private";
}

// Type guard para PrivateUser
export function isPrivateUser(obj: any): obj is PrivateUser {
    return (
        typeof obj === "object" &&
        typeof obj.id === "number" &&
        (typeof obj.username === "string" || obj.username === undefined) &&
        typeof obj.firstInteraction === "string"
    );
}

// Type guard para MyChatMember
export function isChatMember(obj: any): obj is MyChatMember {
    const validStatuses: string[] = ["member", "left", "kicked", "administrator", "owner", "creator"];
    return (
        typeof obj === "object" &&
        typeof obj.id === "number" &&
        typeof obj.username === "string" &&
        validStatuses.includes(obj.status) &&
        typeof obj.greetingCount === "number" &&
        (obj.joinedAt === undefined || typeof obj.joinedAt === "string") &&
        typeof obj.isAdmin === "boolean"
    );
}

//Type guard for debt
export function isDebt(obj: any): obj is Debt {
    return (
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        Array.isArray(obj.debtors) && obj.debtors.every((t: unknown) => typeof t === "string")
    );
}

