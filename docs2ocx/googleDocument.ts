import { HtmlMetadataKeys } from "./odellTypes";
import documentContentToHtml from "./documentContentToHtml";
import extractDocumentContent from "./extractDocumentContent";
import { docs_v1 } from "googleapis";

export function extractHtml(
  document: docs_v1.Schema$Document,
  content: docs_v1.Schema$StructuralElement[]
) {
  return documentContentToHtml(extractDocumentContent(document, content));
}

export function extractRawText(
  contentBlocks: docs_v1.Schema$StructuralElement[]
) {
  const textEntries = [];

  for (const element of contentBlocks) {
    element.paragraph.elements[0];

    if (!element.paragraph) {
      return;
    }

    for (const textElement of element.paragraph.elements) {
      textEntries.push(textElement.textRun.content);
    }
  }

  return textEntries.join("\n").trim();
}

export function parseKeyValueTable(
  document: docs_v1.Schema$Document,
  tableRows: docs_v1.Schema$TableRow[],
  keyLookup: Record<string, string>
) {
  const metadata = {};

  for (const row of tableRows) {
    const key = extractRawText(row.tableCells[0].content).replace(/\s/g, "");
    const value = HtmlMetadataKeys.includes(key)
      ? extractHtml(document, row.tableCells[1].content)
      : extractRawText(row.tableCells[1].content);
    const metadataKey = keyLookup[key];

    if (!metadataKey) {
      continue;
    }

    metadata[metadataKey] = value;
  }

  return metadata;
}
