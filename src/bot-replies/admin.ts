import type { NextFunction } from "grammy";
import { Composer } from "grammy";

import type { ShutUpContext } from "../types/squadTypes";
import { isGroupSession } from "../types/squadTypes";
import { botHasAdminRights, log } from "../utils/common";
import { checkAdminMiddleware } from "../middlewares/middleware";
import { getBotState } from "../utils/state";

export const adminCommands = new Composer<ShutUpContext>();

adminCommands.command('setfuerabros', checkAdminMiddleware, async (ctx: ShutUpContext, next: NextFunction) => {
    if (!isGroupSession(ctx.session)) {
        log.warn("Not a group");
        return next();
    }
    if (!getBotState()) {
        log.info("Bot is deactivated");
        return next();
    }
    log.info("Setting bro reply status - initiating new conversation");
    await ctx.conversation.enter("setBroLevelConversation");
});

adminCommands.command('setlevel', checkAdminMiddleware, async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("setting the level of response...");
    try {
        // validate session
        const session = ctx.session;
        if (!isGroupSession(session)) {
            log.warn("Not in group - this functionality is not available");
            await ctx.reply("❌ Este comando solo funciona en chats grupales.");
            return next();
        }

        if (!getBotState()) {
            log.info("Bot is deactivated");
            return next();
        }
        //if no rights then cancel
        if (!botHasAdminRights(ctx)) {
            log.info("Skipping due to admin rights");
            log.warn("BOT HAS NO ADMIN RIGHTS");
            return await ctx.api.sendMessage(session.groupData.id, "NO PUEDO HACER ESO PORQUE NO SOY ADMIN IMBECIL");
        }

        log.info("Setting ignore Manuel status - initiaing new conversation");
        await ctx.conversation.enter("setIgnoreManuelLevel");
    } catch (err) {
        log.error(err);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error("Error in set level command for ignored user");
    }
});

