import { Context } from "grammy";

export interface MyChatMember {
    username: string;
    greetingCount: number;
}

export interface GroupData {
    blockedUser: string | undefined; // username
    isUserBlocked: number; // Indica si algún usuario está bloqueado
    commandOnlyAdmins: boolean; // Si solo los administradores pueden usar comandos
    adminUsers: string[]; // Lista de usernames de administradores
    specialHour: string | undefined; // Hora especial en formato "HH:mm", o null si no está configurada
    chatMembers: MyChatMember[]
}

export type GroupDataStore = Record<string, GroupData>; // Clave: chatId, Valor: datos del grupo


export interface RateLimitOptions {
    limit: number; // Máximo de solicitudes permitidas
    timeWindow: number; // Ventana de tiempo en milisegundos
    onLimitExceeded?: (ctx: Context) => Promise<void> | void; // Callback para manejar cuando el límite se excede
}
