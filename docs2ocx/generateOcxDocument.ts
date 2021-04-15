import { flatten } from "lodash";
import { findDocumentIds, writeOcxDocument } from "./lcmsQueries";
import { lessonToHtml, materialToHtml } from "./odellToHtml";
import { lessonToOer, materialToOer } from "./odellToOer";
import { lessonPath, materialPath } from "./paths";
import { readLesson, readMaterial } from "./readOdellDocument";

export async function generateDocument(documentId: string) {
  const lesson = await readLesson(documentId);

  if (lesson.metadata.type == "progressive") {
    return;
  }

  const resolvedMaterials = flatten(
    lesson.activities.map((a) => a.materials.filter((m) => m.resolvedMaterial))
  );
  for (const materialReference of resolvedMaterials) {
    const material = await readMaterial(materialReference.id);
    if (!material) {
      continue;
    }

    const ocx = materialToOer(materialReference);

    await writeOcxDocument(
      material.documentId,
      "material",
      materialPath(materialReference, null, null),
      ocx,
      materialToHtml(materialReference, ocx)
    );
  }

  const ocx = lessonToOer(lesson);

  await writeOcxDocument(
    documentId,
    "lesson",
    lessonPath(lesson, null, null),
    ocx,
    lessonToHtml(lesson, ocx)
  );
}

export async function generateAllDocuments() {
  const documentIds = await findDocumentIds();
  for (const documentId of documentIds) {
    await generateDocument(documentId);
  }
}
