import { Context } from "grammy";

export interface MyChatMember {
    username: string;
    greetingCount: number;
}

export interface ChatConfig {
    blockedUser: string | undefined;
    ignoreUser: boolean;
    adminUsers: string[];
    chatId: number;
    chatMembers: MyChatMember[];
    onlyAdminCommands: boolean;
}

export interface RateLimitOptions {
    limit: number; // Máximo de solicitudes permitidas
    timeWindow: number; // Ventana de tiempo en milisegundos
    onLimitExceeded?: (ctx: Context) => Promise<void> | void; // Callback para manejar cuando el límite se excede
  }
