
export const IGNORE_STATES = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto"
} as const;

export const BRO_STATES = {
  reply: "responder",
  delete: "borrar"
}

export const HOURS = {
    mananaTime: 7,
    tardeTime: 12,
    nocheTime: 20,
    onceNocheTime: 23,
    mediaNocheTime: 0, //use for mañana as well
  } as const;
  
  // Type for all valid hour numbers (0–23)
 //type Hour = 0 | 1 | 2 | ... | 23; // As above
 //
 //// Get the type of HOURS values
 //type HourName = keyof typeof HOURS; // "Midnight" | "Noon" | "Max"
  
  // Usage
  //const currentHour: Hour = HOURS.Noon; // 12 (type: 12)