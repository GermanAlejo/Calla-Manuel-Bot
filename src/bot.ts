import { Bot } from "grammy";
import config from './utils/config';

// Create a bot object
const bot = new Bot(config.BOT_TOKEN); // <-- place your bot token in this string

// Register listeners to handle messages
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));

// Start the bot (using long polling)
bot.start();