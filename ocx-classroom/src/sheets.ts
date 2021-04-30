import type { Session } from "src/types";
import { google, sheets_v4 } from "googleapis";
import { getAccessToken } from "src/authUtils";
import { googleDrive } from "./drive";

function rubricToCells(rubric: any) {
  const cells: string[][] = [
    ["It is recommended that you do not edit rubrics in spreadsheet format"],
    ["v1.0-s"]
  ];
  for (const criterion of rubric["asn:hasCriterion"]) {
    cells.push([criterion["name"]]);
    if (criterion["description"]) {
      cells.push([criterion["description"]]);
    }
    const levelPoints = [];
    const levelTitles = [];
    const levelDescriptions = [];
    let i = 1;
    for (const level of criterion["asn:hasLevel"]) {
      levelPoints[i] = level["asn:score"];
      if (level["asn:benchmark"]) {
        levelTitles[i] = level["asn:benchmark"];
      }
      if (level["description"]) {
        levelDescriptions[i] = level["description"];
      }
      i++;
    }
    cells.push(levelPoints);
    if (levelTitles.length) {
      cells.push(levelTitles);
    }
    if (levelDescriptions.length) {
      cells.push(levelDescriptions);
    }
  }
  return cells;
}

export async function googleSheets(session: Session) {
  let accessToken = await getAccessToken(session.user);
  let auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: accessToken });
  return new sheets_v4.Sheets({ auth });
}

export async function ocxRubricToGoogleSheet(
  session: Session,
  rubric: any,
  folderId: string
): Promise<string> {
  const sheets = await googleSheets(session);
  const drive = await googleDrive(session);

  // Parse the OCX rubric
  const cells = rubricToCells(rubric);

  // Create the spreadsheet
  const createResponse = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: rubric["@id"]
      },
      sheets: [
        {
          properties: {
            title: rubric["name"]
          }
        }
      ]
    },
    fields: "spreadsheetId"
  });
  const spreadsheetId = createResponse.data.spreadsheetId;

  // Insert data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: rubric["name"],
    valueInputOption: "RAW",
    requestBody: {
      values: cells
    }
  });

  // Move to appropriate folder
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: folderId,
    removeParents: "root"
  });

  return spreadsheetId;
}
