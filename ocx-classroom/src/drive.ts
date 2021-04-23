import type { Session } from "src/types";
import { Readable } from "stream";
import { drive_v3 } from "googleapis";
import { google } from "googleapis";
import { getAccessToken } from "src/authUtils";

export async function googleDrive(session: Session) {
  let auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  let accessToken = await getAccessToken(session.user);
  auth.setCredentials({ access_token: accessToken });
  return new drive_v3.Drive({ auth });
}

export async function createFolder(session: Session, name: string) {
  const drive = await googleDrive(session);
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder"
    },
    fields: "id"
  });
  return folder.data.id;
}

export async function htmlToGoogleDoc(
  session: Session,
  folderId: string,
  fileName: string,
  html: string
) {
  const drive = await googleDrive(session);
  var htmlMedia = {
    mimeType: "text/html",
    body: Readable.from(html)
  };
  const htmlFile = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: "application/vnd.google-apps.document"
    },
    media: htmlMedia,
    fields: "id"
  });
  return htmlFile.data.id;
}
