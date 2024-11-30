import { Api, Bot, Context, RawApi } from "grammy";
import config from './utils/config';
import { log, ErrorEnum, buenosDiasRegex, DayPeriodsEnum } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { buenosDias, buenasTardes, buenasNoches, paTiMiCola, generalSaludo } from "./bot-replies/saluda";

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
            bot.on(":text").hears(buenosDiasRegex[DayPeriodsEnum.manana], async (ctx) => await buenosDias(ctx));
            bot.on(":text").hears(buenosDiasRegex[DayPeriodsEnum.tarde], async (ctx) => await buenasTardes(ctx));
            bot.on(":text").hears(buenosDiasRegex[DayPeriodsEnum.noche], async (ctx) => await buenasNoches(ctx));
            bot.on(":text").hears(buenosDiasRegex[DayPeriodsEnum.hola], async (ctx) => await paTiMiCola(ctx));
        } else {
            bot.on(":text").hears(buenosDiasRegex, async (ctx) => await generalSaludo(ctx));//change this funcion
        }
    } catch (err) {
        log.error(ErrorEnum.errorReadingUser);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorReadingUser);
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
