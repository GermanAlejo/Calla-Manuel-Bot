import type { MiddlewareFn, NextFunction } from "grammy";

import type { ShutUpContext } from "../types/squadTypes";
import { log } from "./common";
import { setPersisanceState } from "../middlewares/fileAdapter";

let isBotActive = true;
let isHoraSet = false;
let isBuenosDiasCheck = false;

export async function setBotState(newState: boolean, chatId: number | undefined) {
    isBotActive = newState;
    await setPersisanceState(newState, chatId);
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

export function setBuenosDiasCheckState(newState: boolean) {
    isBuenosDiasCheck = newState;
}

export function getBuenosDiasCheckState(): boolean {
    return isBuenosDiasCheck;
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
