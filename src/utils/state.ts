import { log } from "./common";
import { ShutUpContext } from "../types/squadTypes";
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

export const botStatusMiddleware: MiddlewareFn<ShutUpContext> = async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("Iyecting global state to context");
    ctx.session.isBotActive = isBotActive;
    return next();
}
