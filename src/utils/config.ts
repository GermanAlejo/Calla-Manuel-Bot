import path from "path";
import dotenv from "dotenv";

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "../../", ".env") });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  botToken: string | undefined;
  creatorName: string | undefined;
  //adding specific admins
  firstAdmin: string | undefined;
  secondAdmin: string | undefined;
  manuelUser: string | undefined;
}

interface Config {
  botToken: string;
  creatorName: string;
  firstAdmin: string;
  secondAdmin: string;
  manuelUser: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    botToken: process.env.BOT_TOKEN,
    creatorName: process.env.CREATOR_NAME,
    firstAdmin: process.env.FIRST_ADMIN,
    secondAdmin: process.env.SECOND_ADMIN,
    manuelUser: process.env.MANUEL_USER
  };
};

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;