import { flatten } from "lodash";
import { findDocumentIds, writeOcxDocument } from "./lcmsQueries";
import { lessonToHtml, materialToHtml } from "./odellToHtml";
import { lessonPath, materialPath } from "./paths";
import { readLesson, readMaterial } from "./readOdellDocument";

export default async function generateAllDocuments() {
  const documentIds = await findDocumentIds();
  for (const documentId of documentIds) {
    const lesson = await readLesson(documentId);

    if (lesson.metadata.type == "progressive") {
      continue;
    }

    const resolvedMaterials = flatten(
      lesson.activities.map((a) =>
        a.materials.filter((m) => m.resolvedMaterial)
      )
    );
    for (const materialReference of resolvedMaterials) {
      const material = await readMaterial(materialReference.id);
      if (!material) {
        continue;
      }

      await writeOcxDocument(
        material.documentId,
        "material",
        materialPath(materialReference, null, null),
        material,
        materialToHtml(materialReference)
      );
    }

    await writeOcxDocument(
      documentId,
      "document",
      lessonPath(lesson, null, null),
      lesson,
      lessonToHtml(lesson)
    );
  }
}
