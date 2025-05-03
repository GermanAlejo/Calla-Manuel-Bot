import { IGNORE_STATES } from "../utils/constants/general";
import { BotState, GroupData, ShutUpContext } from "../types/squadTypes";
import { Composer, NextFunction } from "grammy";
import { botHasAdminRights, log, MUTED_TIME } from "../utils/common";
import { ERRORS } from "../utils/constants/errors";
import { checkAdminMiddleware } from "../middlewares/middleware";
import { isGroupSession } from "../middlewares/helpers";

export const adminCommands = new Composer<ShutUpContext & BotState>();

adminCommands.command('fuerabros', checkAdminMiddleware, async (ctx: ShutUpContext) => {
    if(!isGroupSession(ctx.session)) {
        log.warn("Not a group");
        return;
    }
    log.info("Setting bro reply status");
    const groupData: GroupData = ctx.session.groupData;
    if (groupData.isBroDeleted) {
        groupData.isBroDeleted = false;
        await ctx.reply("Pues nada venga hablad como oligofrenicos...");
    } else {
        groupData.isBroDeleted = true;
        await ctx.reply("Se acabo eso de hablar como subnormales, de nada!");
    }
});

//Lets use this function to set the bros response as well
//TODO: change this to a conversation
adminCommands.command('setlevel', checkAdminMiddleware, async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("setting the level of response...");
    try {
        if (!isGroupSession(ctx.session)) {
            log.warn("Not a group");
            return next();
        }
        const groupData: GroupData = ctx.session.groupData;
        //si es falso no debemos responder
        if (!groupData.isBroDeleted) {
            log.info("Function is deactivated");
            return next();
        }
        const level = ctx.match;
        if (!level) {
            log.error("Error getting level");
            return next();
        }
        if (typeof level === 'string') {
            if (level === IGNORE_STATES.low || level === IGNORE_STATES.medium || level === IGNORE_STATES.high) {
                log.info("value selected: " + level);
                if (await botHasAdminRights(ctx)) {
                    log.info("setting timer to unmute manuel");
                    //temporizador
                    setTimeout(() => {
                        if (groupData.userBlockLevel === IGNORE_STATES.high) {
                            log.info("User is muted, unmmuting after " + MUTED_TIME);
                            groupData.userBlockLevel = IGNORE_STATES.low;
                        }
                    }, MUTED_TIME);
                    await printLevel(ctx, level);
                } else {
                    log.info("Skipping due to admin rights");
                    log.warn("BOT HAS NO ADMIN RIGHTS");
                    groupData.userBlockLevel = IGNORE_STATES.low;
                    return await ctx.api.sendMessage((await ctx.getChat()).id, "NO PUEDO HACER ESO PORQUE NO SOY ADMIN IMBECIL");
                }
            } else {
                log.warn("Value setted not valid!");
                await ctx.reply("Imbecil sno has introducido un valor valido");
            }
        }
    } catch (err) {
        log.error(ERRORS.NO_SELECTED_USER);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error("Error setting level of response");
    }
});


async function printLevel(ctx: ShutUpContext, value: string) {
    try {
        switch (value) {
            case IGNORE_STATES.low:
                log.info("Low lever not affectig user, doing nothing");
                return ctx.reply("Ahora no se mandara callar al Manue, ¿Estas seguro? Tu sabras...");
            case IGNORE_STATES.medium:
                log.info("Mid level ignore, replying to user...");
                return ctx.reply("El Manuel sera mandado a callar, sabia decision");
            case IGNORE_STATES.high:
                //this requires checking
                log.info("Highest level, deleting user...");
                return ctx.reply("El Manuel no podra hablar, por fin");
            default:
                log.error("Value not valid");
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                break;
        }
    } catch (err) {
        log.error(err);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error("Error setting level");
    }
}