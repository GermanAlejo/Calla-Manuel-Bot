import * as fs from "fs";
import * as path from "path";
import { InputFile } from 'grammy';
import type { Bot, Context } from 'grammy';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

import { getBotState } from './state';
import { ErrorEnum } from './enums';
import { loadGroupDataStore } from '../middlewares/jsonHandler';

export const log: Logger<ILogObj> = new Logger({
    type: "pretty",
    prettyLogTimeZone: "local"
});

const horaconoMin: number = 58;
const horaconoHora: number = 16;

//Move this to a config/env file
export const CREATOR_NAME: string = "VengadorAnal";
export const CROCANTI_NAME: string = "ElCrocanti";
export const MIGUE_NAME: string = "Miguesg95";
export const MANUEL_NAME: string = "@Gondor56";

export const MUTED_TIME: number = 30000;
export const voiceFiles: HashFiles[] = [];
export const gifFiles: HashFiles[] = [];

export const buenosDiasRegex: RegExp[] = [
    /\bbuen(?:os|as|o|a)\s*(?:d(i|í)as)\b/i,
    /\bbuen(?:as|a)\s*(?:tardes)\b/i,
    /\bbuen(?:as|a)\s*(?:noches)\b/i,
    /hola/i
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

`;

export interface HashFiles {
    key: string;
    value: InputFile;
}

export enum AudioNames {
    callaManuel1 = "calla_manuel_1",
    callaManuel2 = "calla_manuel_2",
    imbeciles = "imbeciles",
    putaMadre = "putaMadre",
    fernando = "fernando"
}

export enum GifNames {
    aleChupa = "ale_chupa"
}

//this enum should be revisited
export enum TimeComparatorEnum {
    mananaTime = 7,
    tardeTime = 12,
    nocheTime = 20,
    onceNocheTime = 23,
    mediaNocheTime = 0, //use for mañana as well
    tardeCode = 1,
    nocheCode = 2,
    holaCode = 3
}

export async function getUserIgnore(chatId: string): Promise<number> {
    const data = loadGroupDataStore();
    return data[chatId].isUserBlocked;
}

export async function loadIgnoreUserName(chatId: string): Promise<string | undefined> {
    const data = loadGroupDataStore();
    return data[chatId].blockedUser;
}

/**
 * Compares current hour time to check day period
 * 
 * @param saludoTime current hour time in number format
 * 
 * @returns 
 */
export function isBuenosDiasTime(saludoTime: number): TimeComparatorEnum {
    log.info("--isBuenosDiasTime--");
    let dayPeriod: number;
    if (saludoTime >= TimeComparatorEnum.mananaTime && saludoTime < TimeComparatorEnum.tardeTime) {
        //mañana
        log.info("In the morning");
        dayPeriod = TimeComparatorEnum.mediaNocheTime;
    } else if (saludoTime >= TimeComparatorEnum.tardeTime && saludoTime < TimeComparatorEnum.nocheTime) {
        //tarde
        log.info("Es por la tarde");
        dayPeriod = TimeComparatorEnum.tardeCode;
    } else if ((saludoTime >= TimeComparatorEnum.nocheTime && saludoTime < TimeComparatorEnum.onceNocheTime) ||
        (saludoTime >= TimeComparatorEnum.mediaNocheTime && saludoTime < TimeComparatorEnum.mananaTime)) {
        //noche
        log.info("Es de noche");
        dayPeriod = TimeComparatorEnum.nocheCode;
    } else {
        log.error(ErrorEnum.errorInTime);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInTime);
    }
    return dayPeriod;
}

export async function botHasAdminRights(ctx: Context): Promise<boolean> {
    try {
        const chatId = ctx.chat?.id;
        log.info("Checking if bot is admin")
        if (chatId) {
            const botMember = await ctx.api.getMe();
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.find((a) => a.user.id === botMember.id);
            if (isAdmin) {
                log.info("Bot is admin");
                return true;
            } else {
                log.warn("Bot is not admin this will lead to errors");
                return false;
            }
        }
        return false;
    } catch (err) {
        log.error(err);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error("Value not recognized");
    }
}

export function prepareMediaFiles() {
    if (getBotState()) {
        const mediaFolderPath = getMediaDir();
        console.log("abs path: " + mediaFolderPath);
        if (!fs.existsSync(mediaFolderPath)) {
            log.error("La carpeta " + mediaFolderPath + " no existe.");
            log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
            throw new Error();
        }
        fs.readdir(mediaFolderPath, (err, files) => {
            if (err) {
                log.error("Error leyendo carpeta media");
                log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
                throw err;
            }
            files.forEach(f => {
                const fileExt = path.extname(f);
                const filePath = path.join(mediaFolderPath, f);
                if (fileExt === ".ogg" || fileExt === ".mp3") {
                    const fName: string = path.parse(f).name;
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(filePath + f)
                    };
                    voiceFiles.push(newFile);
                } else if (fileExt === ".gif") {
                    const fName: string = path.parse(f).name;
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(filePath + f)
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
    console.log("ROOT: " + projectRoot);
    console.log("MEDIA: " + path.join(projectRoot, 'media'));
    const mediaPath = path.join(projectRoot, 'media');
    const is = fs.existsSync(path.join(projectRoot, 'media'));
    //Lets read the directory and make sure it exits
    if(!fs.existsSync(mediaPath)) {
        log.info("Path to media does not exist, let's create it");
        //create folder
        fs.mkdirSync(mediaPath);
        log.info("Path created in: " + mediaPath);
    } else {
        log.info("Path to media exist");
    }
    console.log("EXISTS: " + is);
    return mediaPath;
}

export function scheduleMessage(bot: Bot, chatId: number, message: string) {
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
        // Envía el mensaje
        await bot.api.sendMessage(chatId, message);
        log.info("Sending Message");
        // Luego, usa setInterval para repetirlo diariamente
        setInterval(async () => {
            log.info("Setting interval for next day");
            await bot.api.sendMessage(chatId, message);
        }, 24 * 60 * 60 * 1000); // Cada 24 horas
    }, delay);
}

