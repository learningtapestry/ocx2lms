import { docs_v1 } from "googleapis";
import getGoogleClient from "./googleClient";
import { findDocumentId } from "./lcmsQueries";
import parseDocument from "./parseDocument";
import parseMaterial from "./parseMaterial";
import readRubricSheet from "./readRubricSheet";

export async function readDocument(documentId) {
  const client = await getGoogleClient();
  const docs = new docs_v1.Docs({ auth: client });

  const getDocumentResponse = await docs.documents.get({
    documentId,
  });
  const document = getDocumentResponse.data;
  const lesson = await parseDocument(document);

  for (const activity of lesson.activities) {
    for (const textId of activity.metadata.textsAsMaterialIds) {
      activity.materials.push({
        id: textId,
        locations: ["LMS"],
        accessType: "text",
      });
    }

    for (const material of activity.materials) {
      material.resolvedMaterial = await readMaterialDocument(material.id);
    }
  }

  if (lesson.metadata.rubrics) {
    for (const rubric of lesson.metadata.rubrics.rubrics) {
      const spreadsheetId = rubric.url
        .trim()
        .replace("https://docs.google.com/spreadsheets/d/", "")
        .split("/")[0];
      rubric.resolvedRubric = await readRubricSheet(spreadsheetId);
    }
  }

  return lesson;
}

export async function readMaterialDocument(materialId: string) {
  const documentId = await findDocumentId(materialId);

  if (!documentId) {
    return null;
  }

  const googleClient = await getGoogleClient();
  const docs = new docs_v1.Docs({ auth: googleClient });

  const getDocumentResponse = await docs.documents.get({
    documentId,
  });

  const document = getDocumentResponse.data;
  const material = await parseMaterial(document);
  return material;
}
