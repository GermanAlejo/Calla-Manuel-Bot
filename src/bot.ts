import { Api, Bot, Context, RawApi } from "grammy";
import config from './utils/config';
import { ChatMember } from "grammy/types";
import { log, ErrorConstants, buenosDiasRegex } from './utils/common';

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

shoutToUser(shutUpBot);

function shoutToUser(bot: Bot<Context, Api<RawApi>>) {
    try {
        // Register listeners to handle messages
        bot.on(':text').hears(buenosDiasRegex, async (ctx) => {
            const user: ChatMember = await ctx.getAuthor();
            if (user.user.username) {
                const userName: string = user.user.username;
                if (checkUser(userName)) {
                    log.info('Chosen User Found: ' + userName);
                    await ctx.reply("CALLATE @" + userName);
                    //await bot.api.sendMessage();
                } else {
                    const message: string | undefined = ctx.message?.text.toLowerCase() || "";
                    if (message) {
                        log.info('Replying to random user: ' + userName);
                        if (message.includes("dias") || message.includes("días") || message.includes("dia") || message.includes("día")) {
                            await ctx.reply("Buenos Dias @" + userName);
                            await ctx.react("❤‍🔥");
                        } else if(message.includes("tardes") || message.includes("tarde")) {
                            await ctx.reply("Buenas Tardes @" + userName);
                            await ctx.react("👌");
                        } else if (message.includes("noche") || message.includes("noches")) {
                            await ctx.reply("Buenas Noches @" + userName);
                            await ctx.react("👻");
                        } else if (message.includes("buenas") || message.includes("buena")) {
                            await ctx.reply("Buenaaasss @" + userName);
                            await ctx.react("🔥");
                        } else {
                            await ctx.reply("Hola @" + userName);
                            await ctx.react("❤‍🔥");
                        }
                    } else {
                        log.error(ErrorConstants.errorReadingUser);
                        log.error('Error in: ' + __filename + '-Located: ' + __dirname);
                        throw new Error(ErrorConstants.errorReadingUser)
                    }
                }
            }
        });
        bot.api.setMyCommands([
            { command: "start", description: "Start the bot" },
            { command: "help", description: "Show help text" },
            { command: "Stop", description: "Stop the bot" },
        ]);
        // Reacts to /start commands
        bot.on('message').command('start', async ctx => {
            await ctx.reply('this is the start command');
        });
        // Reacts to /help commands
        bot.on('message').command('help', async ctx => {
            await ctx.reply('this is the help command');
        });
        bot.on('message').command('stop', async ctx => {
            await ctx.reply('This is the stop command');
        });
        //Remove this
        bot.on('message').command('test', async ctx => {
            const user = (await ctx.getAuthor()).user;
            const testUserMessage = 'Found unexpected value: ' + JSON.stringify(user);
            log.info(testUserMessage);
            await ctx.reply('Check console for resuls...');
        });
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
    } catch (err) {
        throw err;
    }
}