import { log } from "../utils/common";
import { Bot } from "grammy";

export function runCommands(bot: Bot) {
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
}