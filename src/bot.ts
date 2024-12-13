import { Api, Bot, Context, NextFunction, RawApi } from "grammy";
import config from './utils/config';
import { log, ErrorEnum, buenosDiasRegex, TimeComparatorEnum, ignoreUser, BLOCKED_USERNAME, manuelFilter } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "./bot-replies/saluda";

// Create a bot object
const shutUpBot: Bot | Error = new Bot(config.botToken); // <-- place your bot token in this string

startBot(shutUpBot);

try {
    if (BLOCKED_USERNAME) {
        shutUpBot.filter(manuelFilter).on("message", (ctx: Context, next: NextFunction) => {
            if (ctx.from?.username === BLOCKED_USERNAME && ignoreUser) {
                log.info("Blocking user: " + BLOCKED_USERNAME);
                ctx.reply("CALLATE MANUEL @" + BLOCKED_USERNAME);
                return;
            }
            log.info("No user being ignored...");
            return next();
        });
    }
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
} catch (err) {
    log.error(err);
    log.trace("Error in bot.ts");
    throw err;
}

function runBotSalutations(bot: Bot) {
    try {
        if (buenosDiasRegex.length > 1) {
            bot.hears(buenosDiasRegex[TimeComparatorEnum.mananaCode], async (ctx: Context) => await buenosDias(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.tardeCode], async (ctx: Context) => await buenasTardes(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.nocheCode], async (ctx: Context) => await buenasNoches(ctx));
            bot.hears(buenosDiasRegex[TimeComparatorEnum.holaCode], async (ctx: Context) => await paTiMiCola(ctx));
        }
    } catch (err) {
        log.error(ErrorEnum.errorReadingUser);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

async function startBot(bot: Bot<Context, Api<RawApi>>) {
    try {
        if (bot instanceof Error) {
            throw new Error(ErrorEnum.launchError);
        }
        log.info("Starting Bot server");
        // Start the bot (using long polling)
        await bot.start();
    } catch (err) {
        throw err;
    }
}
