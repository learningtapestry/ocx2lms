import {
  DocumentTypes,
  MaterialDocument,
  OdellDocument,
  RubricReference,
  OcxDocument,
  OcxMaterial,
  OcxRubric,
} from "./odellTypes";
import { flatten } from "lodash";
import { findDocuments, writeOcxDocument } from "./lcmsQueries";
import { documentToHtml, materialToHtml, rubricToHtml } from "./odellToHtml";
import { documentToOcx, materialToOcx, rubricToOcx } from "./odellToOcx";
import { lessonPath, materialPath, rubricPath, unitPath } from "./paths";
import { readDocument, readMaterialDocument } from "./readOdellDocument";

export async function generateDocument(
  documentId: string,
  ocxLibrary: OcxDocument[] = null
): Promise<OcxDocument> {
  const document = await readDocument(documentId, ocxLibrary);
  const documentMaterials: OcxMaterial[] = [];
  const documentRubrics: OcxRubric[] = [];

  const resolvedMaterials = flatten(
    document.activities.map((a) =>
      a.materials.filter((m) => m.resolvedMaterial)
    )
  );
  for (const materialReference of resolvedMaterials) {
    const material = await readMaterialDocument(
      materialReference.id,
      ocxLibrary
    );
    if (!material) {
      continue;
    }

    const ocx = materialToOcx(materialReference);
    const html = materialToHtml(material, ocx);

    documentMaterials.push({
      document: material,
      ocx,
      html,
    });

    await writeOcxDocument(
      material.documentId,
      "material",
      materialPath(materialReference, null, null),
      ocx,
      html
    );
  }

  for (const rubric of document.metadata.rubrics?.rubrics || []) {
    const ocx = rubricToOcx(rubric);
    const html = rubricToHtml(rubric, ocx);

    documentRubrics.push({ rubric, ocx, html });

    await writeOcxDocument(
      rubric.url,
      "rubric",
      rubricPath(document, rubric, null, null),
      ocx,
      html
    );
  }

  const ocx = await documentToOcx(document);
  const docType: DocumentTypes = document.metadata.type;
  const html = documentToHtml(document, ocx);

  let path;
  if (docType == "lesson") {
    path = lessonPath(document, null, null);
  } else if (docType == "unit") {
    path = unitPath(document, null, null);
  }

  await writeOcxDocument(documentId, docType, path, ocx, html);

  return {
    document,
    ocx,
    html,
    rubrics: documentRubrics,
    materials: documentMaterials,
  };
}

export async function generateAllDocuments() {
  const documents = await findDocuments();

  const ocxLibrary = [];
  const pendingUnits = [];

  for (const document of documents) {
    if (document.type == "unit") {
      pendingUnits.push(document);
    } else {
      const ocxDocument = await generateDocument(document.file_id);
      ocxLibrary.push(ocxDocument);
    }
  }

  for (const pendingUnit of pendingUnits) {
    await generateDocument(pendingUnit.file_id, ocxLibrary);
  }
}
