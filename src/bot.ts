import { Bot} from "grammy";
import type { Api, Context, RawApi } from "grammy";

import config from './utils/config';
import { log, prepareMediaFiles } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { setBotState } from "./utils/state";
import { botStatusMiddleware, joinGroupMiddleware, requestRateLimitMiddleware, runBotSalutations, userDetectedMiddleware, userFilterMiddleware, userStatusMiddleware } from "./middlewares/middleware";
import { ErrorEnum } from "./utils/enums";

// Create a bot object
const shutUpBot: Bot | Error = new Bot(config.botToken); // <-- place your bot token in this string

startBot(shutUpBot)
    .then(() => {
        log.info("Bot Stopped");
    })
    .catch(err => {
        log.error(err);
        log.trace('Error in: ' + __filename + '- Located: ' + __dirname);
        throw err;
    });

try {
    prepareMediaFiles();
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
} catch (err) {
    log.error(err);
    log.trace('Error in: ' + __filename + '- Located: ' + __dirname);
    throw err;
}

async function startBot(bot: Bot<Context, Api<RawApi>>) {
    try {
        if (bot instanceof Error) {
            throw new Error(ErrorEnum.launchError);
        }
        setBotState(true);
        log.info("Starting Bot server");
        const rateLimitMiddleware = requestRateLimitMiddleware({
            limit: 4, // Máximo 8 solicitudes
            timeWindow: 3000, // Ventana de tiempo de 5 segundos
            onLimitExceeded: () => {
                log.warn("Solicitudes maximas alcanzadas!");
                //comment this to reduce spam in groups
                //await ctx.reply("🚫 Por favor, espera antes de enviar más solicitudes.");
            }
        });
        bot.use(rateLimitMiddleware);
        bot.use(botStatusMiddleware);
        bot.use(userFilterMiddleware);
        bot.on('chat_member', userStatusMiddleware);
        bot.on('my_chat_member', joinGroupMiddleware);
        bot.on('message', userDetectedMiddleware);
        // Start the bot (using long polling)
        await bot.start();
    } catch (err) {
        throw err;
    }
}

