import { AudioNames, gifFiles, GifNames, helpText, log, voiceFiles, HashFiles, scheduleMessage, MUTED_TIME, botHasAdminRights } from "../utils/common";
import { Bot, Context, NextFunction } from "grammy";
import { getBotState, setBotState } from "../utils/state";
import { checkAdminMiddleware } from "../middlewares/middleware";
import { loadGroupData, saveGroupData } from "../middlewares/jsonHandler";

export function runCommands(bot: Bot) {
    bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "help", description: "Show help text" },
        { command: "stop", description: "Stop the bot" },
        { command: "horaespecial", description: "Saber la hora coño" },
        { command: "imbeciles", description: "Manda un audio para los imbecil a todos" },
        { command: "putamadre", description: "Manda un audio y se caga en tu puta madre" },
        { command: "callamanuel", description: "Manda callar al Manuel" },
        { command: "alechupa", description: "El Ale la chupa" },
        { command: "fernando", description: "DA LA CARA FERNANDO"},
        { command: "setlevel", description: "Permite controlar la reaccion del bot a Manuel, uso /setlevel {0-2}" }
    ])
        .then(() => log.info("commands description set"))
        .catch((err: Error) => {
            log.trace(err);
            log.error(err);
            throw new Error();
        });

    // Reacts to /start commands
    bot.command('start', checkAdminMiddleware, async (ctx: Context, next: NextFunction) => {
        log.info("Start Command...");
        const chatId: number | undefined = ctx.chat?.id;
        if (!chatId) {
            log.warn("Not a group??");
            return next();
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
        return next();
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
    bot.command('fernando', async (ctx: Context) => {
        log.info("Sending Audio...");
        const audio: HashFiles | undefined = voiceFiles.find(v => v.key === AudioNames.fernando);
        if (!audio) {
            log.error("Error mandando audio");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        await ctx.replyWithVoice(audio.value);
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
    bot.command('setlevel', checkAdminMiddleware, async (ctx: Context) => {
        1
        const level = ctx.match;
        log.info("setting the level of response...");
        if (typeof level === 'string') {
            const value: number = parseInt(level);
            const chatId = ctx.chat?.id.toString();
            if (chatId) {
                if (value >= 0 && value < 3) {
                    log.info("value selected: " + value);
                    const data = await loadGroupData(chatId);
                    if (data) {
                        data.isUserBlocked = value;
                        if (value === 2) {
                            if (await botHasAdminRights(ctx)) {
                                log.info("setting timer to unmute manuel");
                                //temporizador
                                setTimeout(async () => {
                                    const updatedData = await loadGroupData(chatId);
                                    if (updatedData && updatedData.isUserBlocked === 2) {
                                        log.info("User is muted, unmmuting after " + MUTED_TIME);
                                        updatedData.isUserBlocked = 1;
                                        await saveGroupData(chatId, updatedData);
                                    }
                                }, MUTED_TIME);
                            } else {
                                log.info("Skipping due to admin rights");
                                const updatedData = await loadGroupData(chatId);
                                if (updatedData) {
                                    updatedData.isUserBlocked = 1;
                                    await saveGroupData(chatId, updatedData);
                                }
                                return ctx.api.sendMessage(chatId, "NO PUEDO HACER ESO PORQUE NO SOY ADMIN IMBECIL");
                            }

                        }
                        await printLevel(ctx, value);
                        await saveGroupData(chatId, data);
                    }
                } else {
                    log.warn("Value setted not valid!");
                    ctx.reply("Imbecil solo valores entre 0 y 2 incluidos");
                }
            }
        }
    });
}

async function printLevel(ctx: Context, value: number) {
    try {
        switch (value) {
            case 0:
                log.info("Low lever not affectig user, doing nothing");
                return ctx.reply("Ahora no se mandara callar al Manue, ¿Estas seguro? Tu sabras...");
            case 1:
                log.info("Mid level ignore, replying to user...");
                return ctx.reply("El Manuel sera mandado a callar, sabia decision");
            case 2:
                //this requires checking
                log.info("Highest level, deleting user...");
                return ctx.reply("El Manuel no podra hablar, por fin");
            default:
                log.error("Value not valid");
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                break;
        }
    } catch (err) {
        log.error(err);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error("Error setting level");
    }
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
