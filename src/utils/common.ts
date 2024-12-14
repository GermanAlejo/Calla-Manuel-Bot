import { Context } from 'grammy';
import config from './config';
import { Logger } from "tslog";

export const log = new Logger();

// Save in local var the locked user
export const BLOCKED_USERNAME: string | undefined = (config.userToBeShout);

export const ignoreUser: boolean = false;

export const manuelFilter = (ctx: Context) => ctx.from?.username === BLOCKED_USERNAME;

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
- */settings*: Accede a la configuración.
- */imbeciles*: Llama imbecil a todo el mundo
- */putamadre*: Se caga en la puta madre
- */alechupa*: Quieres ver al Ale chupar? 😉

Ademas tengo las siguientes funciones:
1. Contesto a saludos y buenos dias.
2. Mando callar al Manuel.
3. Contare los buenos dias.

`;

export enum SaludosEnum {
    buenosDias = "Buenos Dias",
    buenasTardes = "Buenas Tardes",
    buenasNoches = "Buenas Noches"
}

//Sustituir por un array de insultos y sacar uno aleatorio
export enum InsultosEnum {
    mananaInsulto = "IMBECIL NO ES POR LA MAÑANA",
    tardeInsulto = "IMBECIL NO ES POR LA TARDE",
    nocheInsulto = "ES QUE ERES TONTO NO ES DE NOCHE"
}

export enum ErrorEnum {
    launchError = 'Error Launching Bot',
    noSelectedUser = 'No User Selected to Taunt',
    errorReadingUser = 'Error reading/replying to user',
    errorInTime = 'Error, time not acounted for',
    errorInBuenosDias = 'Error dando los buenos dias',
    errorInTardes = "Error en las buenas tardes",
    errorInNoche = "Error en las buenas noaches"
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

export function checkUser(user: string | undefined): boolean | Error {
    if (!config.userToBeShout) {
        throw new Error(ErrorEnum.noSelectedUser);
    }
    if (user !== config.userToBeShout) {
        return false;
    }
    return true;
}
