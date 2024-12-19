import { Api, Bot, Context, RawApi } from "grammy";
import config from './utils/config';
import { log, prepareMediaFiles } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { setBotState } from "./utils/state";
import { botStatusMiddleware, initializeBotDataMiddleware, runBotSalutations, userDetectedMiddleware, userFilterMiddleware, userStatusMiddleware } from "./middlewares/middleware";
import { ErrorEnum } from "./utils/enums";

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
    prepareMediaFiles();
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
} catch (err) {
    log.error(err);
    log.trace("Error in bot.ts");
    throw err;
}

async function startBot(bot: Bot<Context, Api<RawApi>>) {
    try {
        if (bot instanceof Error) {
            throw new Error(ErrorEnum.launchError);
        }
        setBotState(true);
        log.info("Starting Bot server");
        bot.use(botStatusMiddleware);
        bot.use(userFilterMiddleware);
        bot.use(initializeBotDataMiddleware);
        bot.on('chat_member', userStatusMiddleware);
        bot.on('message', userDetectedMiddleware);
        // Start the bot (using long polling)
        await bot.start();
    } catch (err) {
        throw err;
    }
}

