import { Bot } from "grammy";
import type { Api, RawApi } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import config from './utils/config';
import { allCommands, log, prepareMediaFiles } from './utils/common';
import { memberCommands } from "./bot-replies/commands";
import { botStatusMiddleware } from "./utils/state";
import { requestRateLimitMiddleware, groupUserStatusMiddleware, userFilterMiddleware } from "./middlewares/middleware";
import { runBotResponses, runBotSalutations } from "./middlewares/helpers";
import { ERRORS } from "./utils/constants/errors";
import { GENERAL } from "./utils/constants/messages";
import type { ShutUpContext } from "./types/squadTypes";
import { adminCommands } from "./bot-replies/admin";
import { sessionInitializerMiddleware } from "./middlewares/fileAdapter";
import { changeDebtorState, newDebtConversation, setBroLevelConversation, setIgnoreManuelLevel } from "./bot-replies/conversations/conversations";

// Create a bot object
const shutUpBot = new Bot<ShutUpContext>(config.botToken); // <-- place your bot token in this string

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

async function startBot(bot: Bot<ShutUpContext, Api<RawApi>>) {
  try {
    if (bot instanceof Error) {
      throw new Error(ERRORS.LAUNCH_ERROR);
    }
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
    // Configurar sesión
    //order matters, load first initializer
    bot.use(sessionInitializerMiddleware);//middleware to initialize session
    //inititalizes plugin
    bot.use(conversations());
    //register conversation handler
    bot.use(createConversation(newDebtConversation));
    bot.use(createConversation(changeDebtorState));
    bot.use(createConversation(setIgnoreManuelLevel));
    bot.use(createConversation(setBroLevelConversation));
    bot.use(rateLimitMiddleware);
    bot.use(botStatusMiddleware);
    bot.on('message', userFilterMiddleware);
    bot.on('chat_member', groupUserStatusMiddleware);
    bot.use(adminCommands);
    bot.use(memberCommands);
    // Start the bot (using long polling)
    await bot.api.setMyCommands(allCommands);
    await bot.start();
  } catch (err) {
    log.error("Error starting bot...");
    throw err;
  }
}

