
export const ERRORS = {
    LAUNCH_ERROR: 'Error Launching Bot',
    NO_SELECTED_USER: 'No User Selected to Taunt',
    ERROR_READING_USER: 'Error reading/replying to user',
    ERROR_IN_TIME: 'Error, time not acounted for',
    ERROR_IN_BUENOS_DIAS: 'Error dando los buenos dias',
    ERROR_IN_TARDES: 'Error en las buenas tardes',
    ERROR_IN_NOCHE: 'Error en las buenas noaches',
    VALUE_NOT_RECOGNIZED: 'Value not recognized',
    ERROR_READ_FOLDER: "Error leyendo carpeta media",
    TRACE: (file: string, located: string) => `Error in: ${file} - Located: ${located} `,
    ERROR_REGISTRANDO_SALUDO: "Error registrando saludo",
    ERROR_REPLY_BRO: "Error replying/deleting bro message"
} as const

