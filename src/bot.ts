import { Api, Bot, Context, RawApi } from "grammy";
import config from './utils/config';
import { log, ErrorEnum, buenosDiasRegex, TimeComparatorEnum } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { buenosDias, buenasTardes, buenasNoches, paTiMiCola } from "./bot-replies/saluda";

// Create a bot object
const shutUpBot: Bot | Error = new Bot(config.botToken); // <-- place your bot token in this string

startBot(shutUpBot)
    .then(() => {
        log.info("Process ended...");
        log.info("Shutting Bot Server...");
    })
    .catch(e => {
        log.trace(e);
        log.error(e);
    });
try {
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
    //shutUpBot.use(isManuel);
} catch (err) {
    log.error(err);
    log.trace("Error in bot.ts");
    throw err;
}

//async function isManuel(ctx: Context, next: NextFunction): Promise<boolean> {
//    log.info("This is the user to be ignored");
//    return ((await ctx.getAuthor()).user.username == config.userToBeShout);
//}

function runBotSalutations(bot: Bot) {
    try {
        if (buenosDiasRegex.length > 1) {
            bot.on(":text").hears(buenosDiasRegex[TimeComparatorEnum.mananaCode], async (ctx: Context) => await buenosDias(ctx));
            bot.on(":text").hears(buenosDiasRegex[TimeComparatorEnum.tardeCode], async (ctx: Context) => await buenasTardes(ctx));
            bot.on(":text").hears(buenosDiasRegex[TimeComparatorEnum.nocheCode], async (ctx: Context) => await buenasNoches(ctx));
            bot.on(":text").hears(buenosDiasRegex[TimeComparatorEnum.holaCode], async (ctx: Context) => await paTiMiCola(ctx));
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
