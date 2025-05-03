import { log } from "./common";
import { ShutUpContext, BotState } from "../types/squadTypes";
import { MiddlewareFn, NextFunction } from "grammy";

let isBotActive = true;
let isHoraSet = false;

export function setBotState(newState: boolean) {
    isBotActive = newState;
}

export function getBotState(): boolean {
    return isBotActive;
}

export function setHoraState(newState: boolean) {
    isHoraSet = newState;
}

export function getHoraState(): boolean {
    return isHoraSet;
}

export const botStatusMiddleware: MiddlewareFn<ShutUpContext & BotState> = async (ctx: ShutUpContext & BotState, next: NextFunction) => {
    log.info("Iyecting global state to context");
    ctx.isBotActive = isBotActive;
    return next();
}
