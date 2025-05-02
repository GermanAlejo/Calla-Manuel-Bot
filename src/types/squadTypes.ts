import type { Context, SessionFlavor } from "grammy";

import { Conversation, ConversationFlavor } from "@grammyjs/conversations";

export type ShutUpContext = ConversationFlavor<Context>;
export type ShutUpConversationContext = Context;
export type ShutUpConversation = Conversation<ShutUpContext, ShutUpConversationContext>;

export interface PrivateUser {
    id: number;
    username?: string;
    firstInteraction: Date;
}

export interface MyChatMember {
    id: number;
    username: string;
    status: "member" | "left" | "kicked" | "administrator"; //this field possible values match grammys
    greetingCount: number;
    joinedAt?: Date;
}

export interface Debt {
    name: string;
    debtors: MyChatMember[];
}

export interface GroupData {
    blockedUser: string | undefined; // username
    isBroDeleted: boolean; //indica si se debe responder/ignorar al usuario
    broReplyLevel: "responder" | "borrar";
    userBlockLevel: "Bajo" | "Medio" | "Alto"; // Indica si algún usuario está bloqueado
    commandOnlyAdmins: boolean; // Si solo los administradores pueden usar comandos
    specialHour: string | undefined; // Hora especial en formato "HH:mm", o null si no está configurada
    chatMembers: MyChatMember[];
}

export interface BaseSession {
    chatType: "private" | "group";
    createdAt: Date;
}

export interface GroupSession extends BaseSession {
    chatType: "group";
    groupData: GroupData;
}

export interface PrivateSession extends BaseSession {
    chatType: "private";
    userData: PrivateUser;
}

export type BotSession = 
  | (PrivateSession & { chatType: "private" })
  | (GroupSession & { chatType: "group" });

// Extender el contexto de Grammy con la sesión
export type ShutUpContext = Context & SessionFlavor<BotSession>;

export interface BotState {
    isBotActive: boolean;
}

export interface RateLimitOptions {
    limit: number; // Máximo de solicitudes permitidas
    timeWindow: number; // Ventana de tiempo en milisegundos
    onLimitExceeded?: (ctx: Context) => Promise<void> | void; // Callback para manejar cuando el límite se excede
}
