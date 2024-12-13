import { BLOCKED_USERNAME, log } from "../utils/common";
import { Bot, Context, InputFile } from "grammy";

export function runCommands(bot: Bot) {
    // Reacts to /start commands
    bot.command('start', async (ctx: Context) => {
        log.info("Start Command...");
        await ctx.reply('this is the start command');
    });
    // Reacts to /help commands
    bot.command('help', async (ctx: Context) => {
        log.info("Help Command...");
        await ctx.reply('this is the help command');
    });
    bot.on('message').command('stop', async (ctx: Context) => {
        log.info("Stop Command...");
        await ctx.reply('This is the stop command');
    });
    bot.on('message').command('imbeciles', async (ctx: Context) => {
        log.info("Sending Audio...");
        await ctx.replyWithVoice(new InputFile("media/imbeciles.ogg"));
    });
    bot.on('message').command('putaMadre', async (ctx: Context) => {
        log.info("Sending Audio...");
        await ctx.replyWithVoice(new InputFile("media/putaMadre.ogg"));
    });
    bot.on('message').command('callaManuel', async (ctx: Context) => {
        log.info("Mandando callar a manuel...");
        await ctx.reply('CALLATE @' + BLOCKED_USERNAME);
    });
    
}