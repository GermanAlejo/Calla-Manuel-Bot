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


