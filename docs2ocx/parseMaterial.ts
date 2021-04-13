import { docs_v1 } from "googleapis";
import { extractHtml, parseKeyValueTable } from "./googleDocument";
import {
  MaterialDocument,
  MaterialMetadata,
  MaterialMetadataKeys,
} from "./odellTypes";

export default async function parseMaterial(
  document: docs_v1.Schema$Document
): Promise<MaterialDocument> {
  let metadata: MaterialMetadata = null;
  let parsingContent = false;
  let contentBlock: docs_v1.Schema$StructuralElement[] = [];

  for (const element of document.body.content) {
    if (element.paragraph) {
      if (metadata && !parsingContent) {
        parsingContent = true;
      }
    } else if (element.table) {
      if (parsingContent) {
        continue;
      }
      const table = parseKeyValueTable(
        document,
        element.table.tableRows.slice(1),
        MaterialMetadataKeys
      );
      if (!table) {
        continue;
      }
      metadata = table as MaterialMetadata;
    }
    if (parsingContent) {
      contentBlock.push(element);
    }
  }
  const content = extractHtml(document, contentBlock);

  if (!metadata) {
    return null;
  }

  return {
    documentId: document.documentId,
    metadata,
    content: { content },
  };
}
