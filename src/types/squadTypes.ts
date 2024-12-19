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
}

//// Ejemplo de uso:
//const chatConfig: ChatConfig = {
//    blockedUser: "nombreUsuarioBloqueado",
//    adminUsers: ["adminUsuario1", "adminUsuario2"],
//    chatId: 123456789,
//    specialHour: "15:30",
//    chatMembers: [
//        { username: "miembro1", greetingCount: 5 },
//        { username: "miembro2", greetingCount: 3 },
//        { username: "miembro3", greetingCount: 7 }
//    ]
//};

