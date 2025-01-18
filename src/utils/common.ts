import { Bot, Context, InputFile } from 'grammy';
import config from './config';
import { ILogObj, Logger } from "tslog";
import { getBotState } from './state';
import * as fs from "fs";
import * as path from "path";
import { ErrorEnum } from './enums';
import { loadGroupDataStore } from '../middlewares/jsonHandler';

export const log: Logger<ILogObj> = new Logger({
    type: "pretty",
    prettyLogTimeZone: "local"
});

// Save in local var the locked user
export const BLOCKED_USERNAME: string | undefined = (config.userToBeShout);

const horaconoMin: number = 58;
const horaconoHora: number = 16;

export const manuelFilter = (ctx: Context) => ctx.from?.username === BLOCKED_USERNAME;

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

- */start*: Inicia el bot.
- */stop*: Detiene el bot.
- */help*: Muestra este mensaje de ayuda.
- */imbeciles*: Llama imbecil a todo el mundo
- */putamadre*: Se caga en la puta madre
- */horaespecial*: Por si se te ha olvidado cuando es la hora coño
- */callamanuel*: Mandare callar al manuel
- */alechupa*: Quieres ver al Ale chupar? 😉

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
    putaMadre = "putaMadre"
}

export enum GifNames {
    aleChupa = "ale_chupa"
}

export enum TimeComparatorEnum {
    mananaTime = 7,
    tardeTime = 12,
    nocheTime = 20,
    onceNocheTime = 23,
    mediaNocheTime = 0,
    mananaCode = 0,
    tardeCode = 1,
    nocheCode = 2,
    holaCode = 3
}

export async function isUserIgnore(chatId: string): Promise<boolean> {
    const data = await loadGroupDataStore();
    return data[chatId].isUserBlocked;
}

export async function loadIgnoreUserName(chatId: string): Promise<string | undefined> {
    const data = await loadGroupDataStore();
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
        dayPeriod = TimeComparatorEnum.mananaCode;
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

export function prepareMediaFiles() {
    if (getBotState()) {
        const mediaFolderPath = "media";
        if (!fs.existsSync(mediaFolderPath)) {
            log.error("La carpeta no existe.");
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
                if (fileExt === ".ogg") {
                    const fName: string = path.parse(f).name;
                    // new InputFile("media/ale_chupa.gif");
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(mediaFolderPath + "/" + f)
                    };
                    voiceFiles.push(newFile);
                } else if (fileExt === ".gif") {
                    const fName: string = path.parse(f).name;
                    // new InputFile("media/ale_chupa.gif");
                    const newFile: HashFiles = {
                        key: fName,
                        value: new InputFile(mediaFolderPath + "/" + f)
                    };
                    gifFiles.push(newFile);
                }
            })
        });
    }
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
        setInterval(() => {
            log.info("Setting interval for next day");
            bot.api.sendMessage(chatId, message);
        }, 24 * 60 * 60 * 1000); // Cada 24 horas
    }, delay);
}

