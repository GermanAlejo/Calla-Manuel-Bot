import { Composer } from "grammy";
import type { Context, NextFunction } from "grammy";

import type { HashFiles } from "../utils/common";

import { gifFiles, helpText, log, voiceFiles, scheduleMessage } from "../utils/common";
import { getBotState, setBotState } from "../utils/state";
import { AUDIO, GIFS } from "../utils/constants/files";
import { ERRORS } from "../utils/constants/errors";
import { BotState, ShutUpContext } from "../types/squadTypes";

export const memberCommands = new Composer<ShutUpContext & BotState>();

// Reacts to /start commands
memberCommands.command('start', async (ctx: ShutUpContext, next: NextFunction) => {
    log.info("Start Command...");
    const chatId: number | undefined = ctx.chat?.id;
    if(chatId) {
        scheduleMessage(ctx, chatId, "Feliz hora coño");
    }
    if (getBotState()) {
        log.info("Bot is already active");
        await ctx.reply('El Manue ya esta siendo callado');
    } else {
        log.info("Activating Bot to ignore");
        setBotState(true)
        await ctx.reply('Ahora mandaremos callar al Manue...');
    }
    return next();
});

// Reacts to /help commands
memberCommands.command('help', async (ctx: ShutUpContext) => {
    log.info("Help Command...");
    await ctx.reply(helpText, { parse_mode: "Markdown" });
});

memberCommands.command('stop', async (ctx: ShutUpContext) => {
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

memberCommands.command('horaespecial', async (ctx: ShutUpContext) => {
    log.info("Es la hora coño?");
    await ctx.reply('La hora coño es a las 16.58');
});

memberCommands.command('imbeciles', async (ctx: ShutUpContext) => {
    log.info("Sending Audio...");
    const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AUDIO.IMBECILES);
    if (!audio) {
        log.error("Error mandando audio");
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw new Error();
    }
    await ctx.replyWithVoice(audio.value);
});

memberCommands.command('putamadre', async (ctx: ShutUpContext) => {
    log.info("Sending Audio...");
    const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AUDIO.PUTA_MADRE);
    if (!audio) {
        log.error("Error mandando audio");
        log.trace('Error in: ' + __filename + '- Located: ' + __dirname);
        throw new Error();
    }
    await ctx.replyWithVoice(audio.value);
});

memberCommands.command('callamanuel', async (ctx: ShutUpContext) => {
    log.info("Mandando callar a manuel...");
    await callaManuel(ctx);
});

memberCommands.command('fernando', async (ctx: ShutUpContext) => {
    log.info("Sending Audio...");
    const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AUDIO.FERNANDO);
    if (!audio) {
        log.error("Error mandando audio");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    await ctx.replyWithVoice(audio.value);
});

memberCommands.command('alechupa', async (ctx: ShutUpContext) => {
    log.info("Mandando gif de Ale...");
    const gif: HashFiles | undefined = gifFiles.find(g => g.key === GIFS.ALE_CHUPA);
    if (!gif) {
        log.error("Error mandando gif");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    await ctx.replyWithAnimation(gif.value);
});

async function callaManuel(ctx: Context) {
    if (!ctx) {
        log.error("Error con contexto de audios.");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    const randomNumber = Math.floor(Math.random() * 2) + 1;
    let reply: HashFiles | undefined;
    if (randomNumber == 1) {
        reply = voiceFiles.find(v => v.key === AUDIO.CALLA_MANUEL_1);
    } else if (randomNumber == 2) {
        reply = voiceFiles.find(v => v.key === AUDIO.CALLA_MANUEL_2);
    }

    if (!reply) {
        log.error("Error con contexto de audios.");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error();
    }
    await ctx.replyWithAudio(reply.value);
}
