import { config as loadEnv } from "dotenv";

loadEnv();

const config = {
  baseOcxPath: process.env.BASE_OCX_PATH,
  googleCredentialsPath: process.env.GOOGLE_CREDENTIALS_PATH,
  googleTokenPath: process.env.GOOGLE_TOKEN_PATH,
  postgresqlAddress: process.env.POSTGRESQL_ADDRESS,
  postgresqlDatabase: process.env.POSTGRESQL_DATABASE,
  postgresqlPassword: process.env.POSTGRESQL_PASSWORD,
  postgresqlUsername: process.env.POSTGRESQL_USERNAME,
};

export default config;
