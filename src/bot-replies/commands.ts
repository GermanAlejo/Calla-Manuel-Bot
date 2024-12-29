import { AudioNames, gifFiles, GifNames, helpText, log, voiceFiles, HashFiles, scheduleMessage } from "../utils/common";
import { Bot, Context } from "grammy";
import { getBotState, setBotState } from "../utils/state";
import { checkAdminMiddleware } from "../middlewares/middleware";

export function runCommands(bot: Bot) {
    bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "help", description: "Show help text" },
        { command: "stop", description: "Stop the bot" },
        { command: "horaespecial", description: "Saber la hora coño" },
        { command: "imbeciles", description: "Manda un audio para los imbecil a todos" },
        { command: "putamadre", description: "Manda un audio y se caga en tu puta madre" },
        { command: "callamanuel", description: "Manda callar al Manuel" },
        { command: "alechupa", description: "El Ale la chupa" }
    ])
        .then(() => log.info("commands description set"))
        .catch((err: Error) => {
            log.trace(err);
            log.error(err);
            throw new Error();
        });

    // Reacts to /start commands
    bot.command('start', checkAdminMiddleware, async (ctx: Context) => {
        log.info("Start Command...");
        const chatId: number | undefined = ctx.chat?.id;
        if (!chatId) {
            log.warn("Not a group??");
        } else {
            scheduleMessage(bot, chatId, "Feliz hora coño");
        }
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
        await ctx.reply(helpText, { parse_mode: "Markdown" });
    });
    bot.command('stop', checkAdminMiddleware, async (ctx: Context) => {
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
    bot.command('horaespecial', async (ctx) => {
        log.info("Es la hora coño?");
        await ctx.reply('La hora coño es a las 16.58');
    });
    //bot.command('settings', async (ctx: Context) => {
    //    log.info("setting command called");
    //    await ctx.reply('this is the settings commands');
    //});
    bot.command('imbeciles', async (ctx: Context) => {
        log.info("Sending Audio...");
        const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AudioNames.imbeciles);
        if (!audio) {
            log.error("Error mandando audio");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        await ctx.replyWithVoice(audio.value);
    });
    bot.command('putamadre', async (ctx: Context) => {
        log.info("Sending Audio...");
        const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AudioNames.putaMadre);
        if (!audio) {
            log.error("Error mandando audio");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        await ctx.replyWithVoice(audio.value);
    });
    bot.command('callamanuel', async (ctx: Context) => {
        log.info("Mandando callar a manuel...");
        await callaManuel(ctx);
    });
    bot.command('alechupa', async (ctx: Context) => {
        log.info("Mandando gif de Ale...");
        const gif: HashFiles | undefined = gifFiles.find(g => g.key === GifNames.aleChupa);
        if (!gif) {
            log.error("Error mandando gif");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        await ctx.replyWithAnimation(gif.value);
    });
}

async function callaManuel(ctx: Context) {
    if (!ctx) {
        log.error("Error con contexto de audios.");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    const randomNumber = Math.floor(Math.random() * 2) + 1;
    let reply: HashFiles | undefined;
    if (randomNumber == 1) {
        reply = voiceFiles.find(v => v.key === AudioNames.callaManuel1);
    } else if (randomNumber == 2) {
        reply = voiceFiles.find(v => v.key === AudioNames.callaManuel2);
    }
    
    if (!reply) {
        log.error("Error con contexto de audios.");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    await ctx.replyWithAudio(reply.value);
}
