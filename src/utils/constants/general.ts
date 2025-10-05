
export const IGNORE_STATES = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto"
} as const;

export const BRO_STATES = {
  reply: "responder",
  delete: "borrar",
  off: "off"
}

export const HOURS = {
    mananaTime: 7,
    tardeTime: 12,
    nocheTime: 20,
    onceNocheTime: 23,
    mediaNocheTime: 0, //use for mañana as well
  } as const;
  
//Timer variables
export const HORACONO_MIN: number = 58; // Hora coño storadge
export const HORACONO_HOUR: number = 16; // Hora coño storadge
export const BUENOSDIAS_MIN: number = 0;
export const BUENOSDIAS_HOUR: number = 10;

