import * as fs from "fs";
import path from "path";

import type { GroupData, GroupDataStore } from "../types/squadTypes";
import { log } from "../utils/common";

const dataFile: string = path.join(__dirname, "data"); 

export function loadGroupData(chatId: string): GroupData | undefined {
    try {
        log.info("Reading JSON...");
        const dataStore = loadGroupDataStore();
        if (dataStore[chatId]) {
            return dataStore[chatId];
        } else {
            log.warn(`Group data for chatId: ${chatId} not found.`);
            return undefined;
        }
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export function saveGroupData(chatId: string, data: GroupData): void {
    try {
        log.info("Writting JSON...");
        const dataStore = loadGroupDataStore(); // Load the existing data store
        dataStore[chatId] = data; // Update or add the group data
        saveGroupDataStore(dataStore); // Save the updated data store
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export function loadGroupDataStore(): GroupDataStore {
    try {
        log.info("Reading JSON...");
        if (!fs.existsSync(dataFile)) {
            log.warn("File does not exists creating new file");
            fs.writeFileSync(dataFile, JSON.stringify({}));
        }
        log.info("File found, reading file...");
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data) as GroupDataStore; // Cast explícito al tipo
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export function saveGroupDataStore(data: GroupDataStore): void {
    try {
        log.info("Writting JSON...");
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export function updateGroupData(chatId: string, updates: Partial<GroupData>): void {
    try {
        log.info("Updating data from chat: " + chatId);
        const data = loadGroupDataStore();
        if (!data[chatId]) {
            //create the chat if it does not exists maybe move this to different function
            data[chatId] = {
                blockedUser: undefined,
                isUserBlocked: 1,
                commandOnlyAdmins: true,
                adminUsers: [],
                specialHour: undefined,
                chatMembers: []
            };
        }
        data[chatId] = { ...data[chatId], ...updates };
        saveGroupDataStore(data);
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}