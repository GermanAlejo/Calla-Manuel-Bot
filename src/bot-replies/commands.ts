import { BLOCKED_USERNAME, helpText, log } from "../utils/common";
import { Bot, Context, InputFile } from "grammy";
import { getBotState, setBotState } from "../utils/state";

export function runCommands(bot: Bot) {

    bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "help", description: "Show help text" },
        { command: "stop", description: "Stop the bot"},
        { command: "settings", description: "Open settings" },
        { command: "imbeciles", description: "Manda un audio para los imbecil a todos"},
        { command: "putamadre", description: "Manda un audio y se caga en tu puta madre"},
        { command: "callamanuel", description: "Manda callar al Manuel"},
        { command: "alechupa", description: "El Ale la chupa"}
    ])
    .then(() => log.info("commands description set"))
    .catch((err: Error) => {
        log.trace(err);
        log.error(err);
        throw new Error();
    });

    // Reacts to /start commands
    bot.command('start', async (ctx: Context) => {
        log.info("Start Command...");
        if (getBotState()) {
            log.info("Bot is already active");
            await ctx.reply('El Manue ya esta siendo callado');
        } else {
            log.info("Activating Bot to ignore");
            setBotState(true)
            await ctx.reply('Ahora mandaremos callar al Manue...');
        }
    });
    // Reacts to /help commands
    bot.command('help', async (ctx: Context) => {
        log.info("Help Command...");
        await ctx.reply(helpText, {parse_mode: "Markdown"});
    });
    bot.command('stop', async (ctx: Context) => {
        log.info("Stop Command...");
        if (getBotState()) {
            log.info("Stopping bot...");
            setBotState(false);
            await ctx.reply('El Manue ya no sera callado...');
        } else {
            log.info("Bot is already stopped");
            await ctx.reply('El manue ya es escuchado');
        }
    });
    bot.command('settings', async (ctx: Context) => {
        log.info("setting command called");
        await ctx.reply('this is the settings commands');
    });
    bot.command('imbeciles', async (ctx: Context) => {
        log.info("Sending Audio...");
        await ctx.replyWithVoice(new InputFile("media/imbeciles.ogg"));
    });
    bot.command('putamadre', async (ctx: Context) => {
        log.info("Sending Audio...");
        await ctx.replyWithVoice(new InputFile("media/putaMadre.ogg"));
    });
    bot.command('callamanuel', async (ctx: Context) => {
        log.info("Mandando callar a manuel...");
        await ctx.reply('CALLATE @' + BLOCKED_USERNAME);
    });
    bot.command('alechupa', async (ctx: Context) => {
        log.info("Mandando gif de Ale...");
        await ctx.replyWithAnimation(new InputFile("media/ale_chupa.gif"));
    });

}