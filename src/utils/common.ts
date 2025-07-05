import * as fs from "fs";
import * as path from "path";
import { InputFile } from 'grammy';
import type { Context } from 'grammy';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

import type { ShutUpContext } from "../types/squadTypes";
import config from './config';
import { getBotState } from './state';
import { CodeEnum } from './enums';
import { HOURS } from "./constants/general";
import { ERRORS } from "./constants/errors";
import { GENERAL } from "./constants/messages";
import { BotCommand } from "grammy/types";

export const log: Logger<ILogObj> = new Logger({
    type: "pretty",
    prettyLogTimeZone: "local"
});

const horaconoMin: number = 58; // Hora coño storadge
const horaconoHora: number = 16; // Hora coño storadge

//Move this to a config/env file
export const CREATOR_NAME: string = config.creatorName;// read admin username
export const CROCANTI_NAME: string = config.firstAdmin;// read admin username
export const MIGUE_NAME: string = config.secondAdmin;// read admin username
export const MANUEL_NAME: string = config.manuelUser;// read selected username

export const MUTED_TIME: number = 30000; //Muted for 30 seconds
export const voiceFiles: HashFiles[] = []; //List to store voice files
export const gifFiles: HashFiles[] = []; //List to store gifs files

//This regex could turn into structure if needed
export const broRegex: RegExp = /\bbr[0oòóôõöøōñ]\w*/i;

//Array with a list of all needed regex for detecting the "saludos"
export const buenosDiasRegex: RegExp[] = [
    /\bbuen(?:os|as|o|a)\s*(?:d(i|í)(as|a|ass|aa))\b/i,
    /\bbuen(?:as|a)\s*(?:tardes)\b/i,
    /\bbuen(?:as|a)\s*(?:noches)\b/i,
    /hola/i
];

export const allCommands: BotCommand[] = [
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help text" },
    { command: "stop", description: "Stop the bot" },
    { command: "horaespecial", description: "Saber la hora coño" },
    { command: "imbeciles", description: "Manda un audio para los imbecil a todos" },
    { command: "putamadre", description: "Manda un audio y se caga en tu puta madre" },
    { command: "callamanuel", description: "Manda callar al Manuel" },
    { command: "alechupa", description: "El Ale la chupa" },
    { command: "fernando", description: "DA LA CARA FERNANDO" },
    { command: "setlevel", description: "Permite controlar la reaccion del bot a Manuel, uso /setlevel {0-2}" },
    { command: "fuerabros", description: "Elimina todos los mensajes con bros en el grupo" },
    { command: "crearnuevadeuda", description: "Crea una deuda y permite su personalizacion"}

];

export const helpText = `
*Bot para callar al Manue* 
Vaya imbecil que no sabes ni usar un bot... 😒

Aquí tienes una lista de comandos disponibles:

- */start*: Inicia el bot. (admin)
- */stop*: Detiene el bot.
- */help*: Muestra este mensaje de ayuda.
- */imbeciles*: Llama imbecil a todo el mundo
- */putamadre*: Se caga en la puta madre
- */horaespecial*: Por si se te ha olvidado cuando es la hora coño
- */callamanuel*: Mandare callar al manuel
- */alechupa*: Quieres ver al Ale chupar? 😉
- */fernando*: DA LA CARA FERNANDO
- */setlevel* [0-2]: Permite controlar la reaccion del bot a Manuel, por si llora (admin)

Los comandos para iniciar y parar el bot solo pueden ser usados por los admins

Ademas tengo las siguientes funciones:
1. Contesto a saludos y buenos dias.
2. Mando callar al Manuel.
3. Contare los buenos dias.
4. El bot no permite el uso de la palabra prohibida...

`;

export interface HashFiles {
    key: string;
    value: InputFile;
}

/**
 * Compares current hour time to check day period
 * 
 * @param saludoTime current hour time in number format
 * 
 * @returns 
 */
export function isBuenosDiasTime(saludoTime: number): CodeEnum {
    log.info("--isBuenosDiasTime--");
    let dayPeriod: number;
    if (saludoTime >= HOURS.mananaTime && saludoTime < HOURS.tardeTime) {
        //mañana
        log.info(GENERAL.IN_MORNING);
        dayPeriod = HOURS.mediaNocheTime;
    } else if (saludoTime >= HOURS.tardeTime && saludoTime < HOURS.nocheTime) {
        //tarde
        log.info(GENERAL.TARDE);
        dayPeriod = CodeEnum.tardeCode;
    } else if ((saludoTime >= HOURS.nocheTime && saludoTime < HOURS.onceNocheTime) ||
        (saludoTime >= HOURS.mediaNocheTime && saludoTime < HOURS.mananaTime)) {
        //noche
        log.info(GENERAL.NOCHE);
        dayPeriod = CodeEnum.nocheCode;
    } else {
        log.error(ERRORS.ERROR_IN_TIME);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ERRORS.ERROR_IN_TIME);
    }
    return dayPeriod;
}

export async function botHasAdminRights(ctx: Context): Promise<boolean> {
    try {
        const chatId = ctx.chat?.id;
        log.info(GENERAL.CHECK_ADMIN)
        if (chatId) {
            const botMember = await ctx.api.getMe();
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.find((a) => a.user.id === botMember.id);
            if (isAdmin) {
                log.info(GENERAL.BOT_IS_ADMIN);
                return true;
            } else {
                log.warn(GENERAL.BOT_IS_NOT_ADMIN);
                return false;
            }
        }
        return false;
    } catch (err) {
        log.error(err);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ERRORS.VALUE_NOT_RECOGNIZED);
    }
}

export function prepareMediaFiles() {
    if (getBotState()) {
        const mediaFolderPath = getMediaDir();
        if (!fs.existsSync(mediaFolderPath)) {
            log.error("La carpeta " + mediaFolderPath + " no existe.");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        fs.readdir(mediaFolderPath, (err, files) => {
            if (err) {
                log.error(ERRORS.ERROR_READ_FOLDER);
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                throw err;
            }
            files.forEach(f => {
                const fileExt = path.extname(f);
                const filePath = path.join(mediaFolderPath, f); //This is full name
                if (fileExt === ".ogg" || fileExt === ".mp3") {
                    const fName: string = path.parse(f).name;
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(filePath)
                    };
                    voiceFiles.push(newFile);
                } else if (fileExt === ".gif") {
                    const fName: string = path.parse(f).name;
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(filePath)
                    };
                    gifFiles.push(newFile);
                }
            })
        });
    }
}

function getMediaDir() {
    // Navigate up to the project root (adjust based on this file's depth)
    const projectRoot = path.resolve(__dirname, '..', '..');
    const mediaPath = path.join(projectRoot, 'media');
    //Lets read the directory and make sure it exits
    if (!fs.existsSync(mediaPath)) {
        log.info("Path to media does not exist, let's create it");
        //create folder
        fs.mkdirSync(mediaPath);
        log.info("Path created in: " + mediaPath);
    } else {
        log.info("Path to media exist");
    }
    return mediaPath;
}

export function scheduleMessage(ctx: ShutUpContext, message: string) {
    // Calcula el tiempo hasta la hora específica
    const now = new Date();
    const targetTime = new Date();
    log.info("Setting hora coño...");

    targetTime.setHours(horaconoHora, horaconoMin, 0, 0);

    // Si la hora ya pasó hoy, programa para mañana
    if (targetTime.getTime() <= now.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime.getTime() - now.getTime();
    log.info("Setting a delay of: " + delay);

    // Usa setTimeout para programar el primer mensaje
    setTimeout(async () => {
        const chatId = ctx.chat?.id;
        if(!chatId) {
            log.error("Chat not found in context");
            throw new Error("Could not schedule message");
        }
        // Envía el mensaje
        await ctx.api.sendMessage(chatId, message);
        log.info("Sending Message");
        // Luego, usa setInterval para repetirlo diariamente
        setInterval(async () => {
            log.info("Setting interval for next day");
            await ctx.api.sendMessage(chatId, message);
        }, 24 * 60 * 60 * 1000); // Cada 24 horas
    }, delay);
}

