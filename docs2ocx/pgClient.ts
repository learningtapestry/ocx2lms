import { Client, Pool } from "pg";
import config from "./config";

const pool = new Pool({
  user: config.postgresqlUsername,
  password: config.postgresqlPassword,
  host: config.postgresqlAddress,
  database: config.postgresqlDatabase,
});

async function getClient() {
  const client = await pool.connect();
  return client;
}

export default getClient;
