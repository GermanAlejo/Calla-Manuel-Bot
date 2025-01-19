import * as fs from "fs";
import { GroupData, GroupDataStore } from "../types/squadTypes";
import { log } from "../utils/common";

const dataFile: string = "src/data/squadData.json";

export async function loadGroupData(chatId: string): Promise<GroupData | undefined> {
    try {
        log.info("Reading JSON...");
        const dataStore = await loadGroupDataStore();
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

export async function saveGroupData(chatId: string, data: GroupData): Promise<void> {
    try {
        log.info("Writting JSON...");
        const dataStore = await loadGroupDataStore(); // Load the existing data store
        dataStore[chatId] = data; // Update or add the group data
        await saveGroupDataStore(dataStore); // Save the updated data store
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export async function loadGroupDataStore(): Promise<GroupDataStore> {
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

export async function saveGroupDataStore(data: GroupDataStore): Promise<void> {
    try {
        log.info("Writting JSON...");
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export async function updateGroupData(chatId: string, updates: Partial<GroupData>): Promise<void> {
    try {
        log.info("Updating data from chat: " + chatId);
        const data = await loadGroupDataStore();
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
        await saveGroupDataStore(data);
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}