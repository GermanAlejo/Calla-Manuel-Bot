import { Api, Bot, Context, RawApi } from "grammy";
import config from './utils/config';
import { ChatMember } from "grammy/types";
import { log, ErrorConstants } from './utils/common';

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

function shoutToUser(bot: Bot<Context, Api<RawApi>>) {
    try {
        // Register listeners to handle messages
        bot.on(':text').hears(/(buenos\sd(i|í)as)/i, async (ctx) => {
            const user: ChatMember = await ctx.getAuthor();
            if (user.user.username) {
                const userName: string = user.user.username;
                if (checkUser(userName)) {
                    log.info('Chosen User Found: ' + userName);
                    await ctx.reply("CALLATE @" + userName);
                    //await bot.api.sendMessage();
                } else {
                    log.info('Replying to random user: ' + userName);
                    await ctx.reply("Buenos Dias @" + userName);
                    await ctx.react("❤‍🔥");
                }
            }
        });
        // Match some text (exact match)
        //bot.hears('hola', ctx => ctx.reply('And grammY loves you! <3'));
    } catch (err) {
        log.trace(err);
        log.error(err);
    }
}

function checkUser(user: string | undefined) {
    if (!config.userToBeShout) {
        throw new Error(ErrorConstants.noSelectedUser);
    }
    if (user !== config.userToBeShout) {
        return false;
    }
    return true;
}

async function startBot(bot: Bot<Context, Api<RawApi>>) {
    try {
        if (bot instanceof Error) {
            throw new Error(ErrorConstants.launchError);
        }
        log.info("Starting Bot server");
        // Start the bot (using long polling)
        await bot.start();
        shoutToUser(bot);
    } catch (err) {
        throw err;
    }
}