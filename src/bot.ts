import { Api, Bot, Context, NextFunction, RawApi } from "grammy";
import config from './utils/config';
import { log, ErrorEnum, buenosDiasRegex, TimeComparatorEnum, ignoreUser, BLOCKED_USERNAME, manuelFilter, prepareMediaFiles } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "./bot-replies/saluda";
import { getBotState, setBotState } from "./utils/state";

// Create a bot object
const shutUpBot: Bot | Error = new Bot(config.botToken); // <-- place your bot token in this string

startBot(shutUpBot)
    .then(() => {
        log.info("Bot Stopped");
    })
    .catch(err => {
        log.error(err);
        log.trace(err);
        throw new Error()
    });

try {
    //add state middleware
    shutUpBot.use(async (ctx: Context, next: NextFunction) => {
        if (!getBotState()) {
            log.info("El bot esta desactivado");
            if (ctx.message?.text?.startsWith("/") && (ctx.message.text !== '/start')) {
                return ctx.reply("El bot esta desactivado usa el comando /start para activarlo");
            } else if (ctx.message?.text?.startsWith("/") && (ctx.message.text === '/start')) {
                setBotState(true);
                return ctx.reply("Bot activado");
            }
        }
        return await next();
    });

    //add user filter middleware
    if (BLOCKED_USERNAME) {
        shutUpBot.filter(manuelFilter).on("message", (ctx: Context, next: NextFunction) => {
            if (ctx.from?.username === BLOCKED_USERNAME && ignoreUser) {
                log.info("Blocking user: " + BLOCKED_USERNAME);
                return ctx.reply("CALLATE MANUEL @" + BLOCKED_USERNAME); //Hay que probar esto otra vez
            }
            log.info("No user being ignored...");
            return next();
        });
    }
    
    prepareMediaFiles();
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
} catch (err) {
    log.error(err);
    log.trace("Error in bot.ts");
    throw err;
}

function runBotSalutations(bot: Bot) {
    try {
        if (buenosDiasRegex.length > 1 && getBotState()) {
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
        setBotState(true);
        log.info("Starting Bot server");
        // Start the bot (using long polling)
        await bot.start();
    } catch (err) {
        throw err;
    }
}

