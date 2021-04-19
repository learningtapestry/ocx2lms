import { DocumentTypes } from "./odellTypes";
import { flatten } from "lodash";
import { findDocumentIds, writeOcxDocument } from "./lcmsQueries";
import { documentToHtml, materialToHtml } from "./odellToHtml";
import { documentToOer, materialToOer } from "./odellToOer";
import { lessonPath, materialPath, unitPath } from "./paths";
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

    const ocx = materialToOer(materialReference);

    await writeOcxDocument(
      material.documentId,
      "material",
      materialPath(materialReference, null, null),
      ocx,
      materialToHtml(materialReference, ocx)
    );
  }

  const docType: DocumentTypes = document.metadata.type;

  const ocx = documentToOer(document);

  let path;

  if (docType == "lesson") {
    path = lessonPath(document, null, null);
  } else if (docType == "overview") {
    path = unitPath(document, null, null);
  } else if (docType == "progressive") {
    path = unitPath(document, null, "_progressive");
  } else if (docType == "texts") {
    path = unitPath(document, null, "_texts");
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
