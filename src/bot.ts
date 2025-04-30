import { Bot} from "grammy";

import config from './utils/config';
import { log, prepareMediaFiles } from './utils/common';
import { runCommands } from "./bot-replies/commands";
import { setBotState } from "./utils/state";
import { botStatusMiddleware, joinGroupMiddleware, requestRateLimitMiddleware, runBotResponses, runBotSalutations, userDetectedMiddleware, userFilterMiddleware, userStatusMiddleware } from "./middlewares/middleware";
import { ERRORS } from "./utils/constants/errors";
import { GENERAL } from "./utils/constants/messages";
import { ShutUpContext } from "./types/squadTypes";
import { conversations, createConversation } from "@grammyjs/conversations";
import { startNewDebt } from "./bot-replies/conversations";

// Create a bot object
const shutUpBot: Bot<ShutUpContext> = new Bot<ShutUpContext>(config.botToken); // <-- place your bot token in this string

startBot(shutUpBot)
    .then(() => {
        log.info(GENERAL.BOT_DESACTIVADO);
    })
    .catch(err => {
        log.error(err);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw err;
    });

try {
    prepareMediaFiles();
    runCommands(shutUpBot);
    runBotSalutations(shutUpBot);
    runBotResponses(shutUpBot);
} catch (err) {
    log.error(err);
    log.trace(ERRORS.TRACE(__filename, __dirname));
    throw err;
}

async function startBot(bot: Bot<ShutUpContext>) {
    try {
        if (bot instanceof Error) {
            throw new Error(ERRORS.LAUNCH_ERROR);
        }
        setBotState(true);
        log.info(GENERAL.BOT_START);
        const rateLimitMiddleware = requestRateLimitMiddleware({
            limit: 4, // Máximo 8 solicitudes
            timeWindow: 3000, // Ventana de tiempo de 5 segundos
            onLimitExceeded: () => {
                log.warn(GENERAL.BOT_MAX_REQUESTS);
                //comment this to reduce spam in groups
                //await ctx.reply("🚫 Por favor, espera antes de enviar más solicitudes.");
            }
        });
        //inititalizes plugin
        bot.use(conversations());
        //register conversation handler
        bot.use(createConversation(startNewDebt));
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

