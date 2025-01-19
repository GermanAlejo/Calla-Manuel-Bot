let isBotActive = true;

export function setBotState(newState: boolean) {
    isBotActive = newState;
}

export function getBotState(): boolean {
    return isBotActive;
}
