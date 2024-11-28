import { Bot } from "grammy";
import config from './utils/config';

// Create a bot object
const bot: Bot = new Bot(config.BOT_TOKEN); // <-- place your bot token in this string
//const choosenUser: string | undefined = config.USER_TO_BE_SHOUT;

startBot(bot);
shoutToUser(bot);

async function shoutToUser(bot: Bot) {
    // Register listeners to handle messages
    bot.on("message:text", async (ctx) => {
        const user = (await ctx.getAuthor()).user.username;
        if (user == config.USER_TO_BE_SHOUT) {
            ctx.reply("CALLATE " + user);
        }
    });
}

//async function checkUser(user: string | undefined) {
//    if (!choosenUser) {
//        throw new Error("No User Selected");
//    }
//}

async function startBot(bot: Bot) {
    // Start the bot (using long polling)
    bot.start();
}