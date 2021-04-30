import { DocumentTypes } from "./odellTypes";
import { flatten } from "lodash";
import { findDocumentIds, writeOcxDocument } from "./lcmsQueries";
import { documentToHtml, materialToHtml, rubricToHtml } from "./odellToHtml";
import { documentToOcx, materialToOcx, rubricToOcx } from "./odellToOcx";
import { lessonPath, materialPath, rubricPath, unitPath } from "./paths";
import { readDocument, readMaterialDocument } from "./readOdellDocument";

export async function generateDocument(documentId: string) {
  const document = await readDocument(documentId);

  const resolvedMaterials = flatten(
    document.activities.map((a) =>
      a.materials.filter((m) => m.resolvedMaterial)
    )
  );
  for (const materialReference of resolvedMaterials) {
    const material = await readMaterialDocument(materialReference.id);
    if (!material) {
      continue;
    }

    const ocx = materialToOcx(materialReference);

    await writeOcxDocument(
      material.documentId,
      "material",
      materialPath(materialReference, null, null),
      ocx,
      materialToHtml(materialReference, ocx)
    );
  }

  for (const rubric of document.metadata.rubrics?.rubrics || []) {
    const ocx = rubricToOcx(rubric);
    await writeOcxDocument(
      rubric.url,
      "rubric",
      rubricPath(document, rubric, null, null),
      ocx,
      rubricToHtml(rubric, ocx)
    );
  }

  const ocx = await documentToOcx(document);
  const docType: DocumentTypes = document.metadata.type;

  let path;
  if (docType == "lesson") {
    path = lessonPath(document, null, null);
  } else if (docType == "unit") {
    path = unitPath(document, null, null);
  }

  await writeOcxDocument(
    documentId,
    docType,
    path,
    ocx,
    documentToHtml(document, ocx)
  );
}

export async function generateAllDocuments() {
  const documentIds = await findDocumentIds();
  for (const documentId of documentIds) {
    await generateDocument(documentId);
  }
}
