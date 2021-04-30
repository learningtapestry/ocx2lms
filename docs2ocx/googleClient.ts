import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import { authorize } from "./authorize";
import config from "./config";

let client = null;

async function getClient(): Promise<OAuth2Client> {
  if (client) {
    return client;
  }

  const content = fs.readFileSync(config.googleCredentialsPath, "utf8");
  const credentials = JSON.parse(content);
  client = await authorize(credentials, config.googleTokenPath);
  return client;
}

export default getClient;
