import * as fs from "fs";
import * as readline from "readline";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { load as loadYaml } from "js-yaml";

interface OAuth2Credentials {
  installed: {
    client_secret: string;
    client_id: string;
    redirect_uris: string[];
  };
}

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];

const readToken = (tokenFilePath: string) => {
  const token = fs.readFileSync(tokenFilePath, "utf-8");

  if (tokenFilePath.endsWith("yaml")) {
    const yamlContent = loadYaml(token) as any;
    const jsonContent = JSON.parse(yamlContent.default);
    return {
      token_type: "Bearer",
      access_token: jsonContent.access_token,
      refresh_token: jsonContent.refresh_token,
      scope: jsonContent.scope,
      expiry_date: jsonContent.expiration_time_millis,
    };
  } else {
    return JSON.parse(token);
  }
};

export async function authorize(
  credentials: OAuth2Credentials,
  tokenFilePath: string
) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    oAuth2Client.setCredentials(readToken(tokenFilePath));
  } catch (err) {
    await getNewToken(oAuth2Client, tokenFilePath);
  }

  return Promise.resolve(oAuth2Client);
}

async function getNewToken(oAuth2Client: OAuth2Client, tokenFilePath: string) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", async (code) => {
      rl.close();
      try {
        const token = (await oAuth2Client.getToken(code)).tokens;
        oAuth2Client.setCredentials(token);
        if (!tokenFilePath.endsWith("yaml")) {
          fs.writeFileSync(tokenFilePath, JSON.stringify(token));
        }
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });
  });
}
