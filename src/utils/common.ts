import { Logger } from "tslog";

export const log = new Logger();

export enum ErrorConstants {
    launchError = 'Error Launching Bot',
    noSelectedUser = 'No User Selected to Taunt'
}