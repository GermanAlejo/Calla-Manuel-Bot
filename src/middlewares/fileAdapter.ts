import { FileAdapter } from "@grammyjs/storage-file";
import { GroupSession, PrivateSession } from "../types/squadTypes";


export const storage = new FileAdapter<PrivateSession | GroupSession>({
    dirName: "./data/group_sessions.json", 
    serializer: (data) => JSON.stringify(data, (_, value) => {
        // Convertir Dates a un formato serializable
        if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
        }
        return value;
    }),
    deserializer: (data) => JSON.parse(data, (_, value) => {
        // Reconstruir Dates desde el formato serializado
        if (value?.__type === "Date") {
            return new Date(value.value);
        }
        return value;
    })
});