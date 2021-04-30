import { GCRubricSheet, GCRubricCriterion } from "./classroomTypes";
import { sheets_v4 } from "googleapis";
import getGoogleClient from "./googleClient";

export default async function readRubricSheet(spreadsheetId: string) {
  const auth = await getGoogleClient();
  const sheets = new sheets_v4.Sheets({ auth });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const title = spreadsheet.data.sheets[0].properties.title;
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: title,
  });

  const rubric: GCRubricSheet = { title, criterions: [] };
  let state:
    | "start"
    | "criterionTitle"
    | "criterionDescription"
    | "levelTitle"
    | "levelPoint"
    | "levelDescription" = "start";
  let currentCriterion: GCRubricCriterion = null;

  for (const row of values.data.values.slice(2)) {
    let col0 = row[0] as string;
    if (col0) {
      if (
        ["start", "levelPoint", "levelTitle", "levelDescription"].includes(
          state
        )
      ) {
        if (currentCriterion) {
          rubric.criterions.push(currentCriterion);
        }
        state = "criterionTitle";
        currentCriterion = { title: col0, levels: [] };
      } else if (state == "criterionTitle") {
        state = "criterionDescription";
        currentCriterion.description = col0;
      } else {
        throw new Error(
          "Unknown state - we expected a criterion title or description"
        );
      }
    } else {
      // No col 0
      let col1 = row[1] as string;
      if (col1) {
        if (state == "criterionTitle" || state == "criterionDescription") {
          state = "levelPoint";
          for (const points of row.slice(1)) {
            currentCriterion.levels.push({
              points: parseInt(points),
            });
          }
        } else if (state == "levelPoint") {
          state = "levelTitle";
          const levelTitles = row.slice(1);
          for (let i = 0; i < levelTitles.length; i++) {
            currentCriterion.levels[i].title = levelTitles[i];
          }
        } else if (state == "levelTitle") {
          state = "levelDescription";
          const levelDescriptions = row.slice(1);
          for (let i = 0; i < levelDescriptions.length; i++) {
            currentCriterion.levels[i].description = levelDescriptions[i];
          }
        } else {
          throw new Error(
            "Unknown state - we expected a level point, title, or description"
          );
        }
      } else {
        // No col 0, no col 1
        throw new Error(
          "Unknown state - we expected a level point, title, or description"
        );
      }
    }
  }
  if (currentCriterion) {
    rubric.criterions.push(currentCriterion);
  }

  return rubric;
}
