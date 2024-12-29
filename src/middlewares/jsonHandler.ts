import { log } from "../utils/common";
import { ChatConfig } from "../types/squadTypes";
import * as fs from "fs";
import { access } from "fs/promises";

const filePath: string = "src/data/squadData.json";

async function checkDataExists(): Promise<boolean> {
    try {
        await access(filePath); // Si no lanza error, el archivo existe
        return true;
    } catch {
        return false; // Si lanza error, el archivo no existe
    }
}

export async function inizializeSquadData(chatId: number): Promise<void> {
    if(!checkDataExists()) {
        const initialData: ChatConfig = {
            adminUsers: [],
            blockedUser: undefined,
            chatId: chatId,
            chatMembers:  [],
            ignoreUser: false,
            onlyAdminCommands: true
          };
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }
}

export async function readSquadData(): Promise<ChatConfig> {
    try {
        log.info("Reading JSON...");
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data) as ChatConfig;
    } catch (err) {
        log.error("Error reading JSON");
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        throw err;
    }
}

export async function writeSquadData(chatData: ChatConfig): Promise<void> {
    try {
        log.info("Writting in JSON...");
        fs.writeFileSync(filePath, JSON.stringify(chatData, null, 2));
    } catch (err) {
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        log.error("Error writting in json");
        throw err;
    }
}

export async function updateJson<ChatConfig>(changes: Partial<ChatConfig>): Promise<void> {
    try {
        log.info("Updatting in JSON...");
        const currentData = await readSquadData(); // Leer datos actuales
        const updatedData = { ...currentData, ...changes }; // Mezclar los cambios con los datos actuales
        await writeSquadData(updatedData); // Escribir los datos actualizados
    } catch (err) {
        log.trace('Error in: ' + __filename + '-Located: ' + __dirname);
        log.error("Error updating in json");
        throw err;
    }
}

