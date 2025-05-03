import { Bot, session } from "grammy";
import type { Api, RawApi } from "grammy";

import config from './utils/config';
import { allCommands, log, prepareMediaFiles } from './utils/common';
import { memberCommands } from "./bot-replies/commands";
import { setBotState, botStatusMiddleware } from "./utils/state";
import { requestRateLimitMiddleware, userIgnoredFilterMiddleware, groupUserStatusMiddleware } from "./middlewares/middleware";
import { runBotResponses, runBotSalutations } from "./middlewares/helpers";
import { ERRORS } from "./utils/constants/errors";
import { GENERAL } from "./utils/constants/messages";
import { ShutUpContext, BotState } from "./types/squadTypes";
import { adminCommands } from "./bot-replies/admin";
import { persistenceMiddleware, sessionInitializerMiddleware, storage } from "./middlewares/fileAdapter";
import { conversations, createConversation } from "@grammyjs/conversations";
import { startNewDebt } from "./bot-replies/conversations";

// Create a bot object
const shutUpBot: Bot<ShutUpContext & BotState> = new Bot<ShutUpContext & BotState>(config.botToken); // <-- place your bot token in this string

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
  log.info("Setting media files");
  prepareMediaFiles();
  log.info("Running salutations");
  runBotSalutations(shutUpBot);
  log.info("Running responses");
  runBotResponses(shutUpBot);
} catch (err) {
  log.error(err);
  log.trace(ERRORS.TRACE(__filename, __dirname));
  throw err;
}

async function startBot(bot: Bot<ShutUpContext & BotState, Api<RawApi>>) {
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
    // Configurar sesión con serialización/deserialización para Dates
    //bot.use(
    //  session({
    //    initial: undefined,
    //    storage: storage,
    //  })
    //);
    bot.use(session({ storage }));
    //order matters, load first initializer
    bot.use(sessionInitializerMiddleware);//middleware to initialize session
    bot.use(persistenceMiddleware);
    //inititalizes plugin
    bot.use(conversations());
    //register conversation handler
    bot.use(createConversation(startNewDebt));
    bot.use(rateLimitMiddleware);
    bot.use(botStatusMiddleware);
    //bot.on('message', userIgnoredFilterMiddleware);
    bot.on('chat_member', groupUserStatusMiddleware);
    bot.use(adminCommands);
    bot.use(memberCommands);
    // Start the bot (using long polling)
    await bot.start();
    bot.api.setMyCommands(allCommands);
  } catch (err) {
    log.error("Error starting bot...");
    throw err;
  }
}

