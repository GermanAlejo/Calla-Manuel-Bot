import { Logger } from "tslog";

export const log = new Logger();

export const buenosDiasRegex: RegExp = /\bbuen(?:os|as|a|o|a)\s*(?:días|tardes|noches|)\b/i; 

export enum ErrorConstants {
    launchError = 'Error Launching Bot',
    noSelectedUser = 'No User Selected to Taunt',
    errorReadingUser = 'Error reading/replying to user'
}