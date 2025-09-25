import type { MiddlewareFn, NextFunction } from "grammy";

import type { ShutUpContext } from "../types/squadTypes";
import { log } from "./common";

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
    if (!ctx.session) {
        log.warn("botStatusMiddleware: session is undefined");
        return next();
    }
    ctx.session.isBotActive = isBotActive;
    return next();
}
