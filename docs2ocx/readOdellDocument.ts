import { docs_v1 } from "googleapis";
import getGoogleClient from "./googleClient";
import { findDocumentId } from "./lcmsQueries";
import parseDocument from "./parseDocument";
import parseMaterial from "./parseMaterial";

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
