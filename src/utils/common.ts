import config from './config';
import { Logger } from "tslog";

export const log = new Logger();

export const buenosDiasRegex: RegExp[] = [
    /\bbuen(?:os|as|o|a)\s*(?:d(i|í)as)\b/i, 
    /\bbuen(?:as|a)\s*(?:tardes)\b/i, 
    /\bbuen(?:as|a)\s*(?:noches)\b/i,
    /hola/i
];

export enum SaludosEnum {
    buenosDias = "Buenos Dias",
    buenasTardes = "Buenas Tardes",
    BuenasNoches = "Buenas Noches"
}

//Sustituir por un array de insultos y sacar uno aleatorio
export enum InsultosEnum{
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
    manana = 7,
    tarde = 13,
    noche = 20
}

export enum DayPeriodsEnum {
    manana = 0,
    tarde = 1,
    noche = 2,
    hola = 3
}

/**
 * Compares current hour time to check day period
 * 
 * @param saludoTime current hour time in number format
 * 
 * @returns 
 */
export function isBuenosDiasTime(saludoTime: number): number {
    log.info("--isBuenosDiasTime--");
    let dayPeriod: number;
    if(saludoTime >= TimeComparatorEnum.manana && saludoTime < TimeComparatorEnum.tarde) {
        //mañana
        log.info("In the morning");
        dayPeriod = DayPeriodsEnum.manana;
    } else if (saludoTime >= TimeComparatorEnum.tarde && saludoTime < TimeComparatorEnum.noche) {
        //tarde
        log.info("Es por la tarde");
        dayPeriod = DayPeriodsEnum.tarde;
    } else if (saludoTime >= TimeComparatorEnum.noche && saludoTime < TimeComparatorEnum.manana) {
        //noche
        log.info("Es de noche");
        dayPeriod = DayPeriodsEnum.noche;
    } else {
        log.error(ErrorEnum.errorInTime);
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw new Error(ErrorEnum.errorInTime);
    }
    return dayPeriod;
}

export function checkUser(user: string | undefined) {
    if (!config.userToBeShout) {
        throw new Error(ErrorEnum.noSelectedUser);
    }
    if (user !== config.userToBeShout) {
        return false;
    }
    return true;
}