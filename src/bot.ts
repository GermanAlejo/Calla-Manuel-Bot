import { Bot } from "grammy";
import config from './utils/config';
import { ChatMember } from "grammy/types";

// Create a bot object
const bot: Bot = new Bot(config.BOT_TOKEN); // <-- place your bot token in this string

startBot(bot);
shoutToUser(bot);

async function shoutToUser(bot: Bot) {
    // Register listeners to handle messages
    bot.on(':text').hears(/(buenos\sd(i|í)as)/i, async (ctx) => {
        const user: ChatMember = await ctx.getAuthor();
        if (user.user.username) {
            const userName: string = user.user.username;
            if (await checkUser(userName)) {
                ctx.reply("CALLATE @" + userName);
                //await bot.api.sendMessage();
            } else {
                ctx.reply("Buenos Dias @" + userName);
                ctx.react("❤‍🔥");
            }
        }
    });
    // Match some text (exact match)
    bot.hears('hola', ctx => ctx.reply('And grammY loves you! <3'));
}

async function checkUser(user: string | undefined) {
    if (!config.USER_TO_BE_SHOUT) {
        return new Error("No User Selected");
    }
    if(user !== config.USER_TO_BE_SHOUT) {
        return false;
    }
    return true;
}

async function startBot(bot: Bot) {
    // Start the bot (using long polling)
    bot.start();
}