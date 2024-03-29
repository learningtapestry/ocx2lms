import { docs_v1 } from "googleapis";
import {
  extractHtml,
  extractRawText,
  parseKeyValueTable,
} from "./googleDocument";
import {
  Activity,
  ActivityMetadata,
  ActivityMetadataKeys,
  DocumentMetadataKeys,
  OdellDocument,
  MaterialReference,
  MaterialReferences,
  MetadataTable,
  MetadataTableType,
  StudentContent,
  TeacherContent,
  DocumentMetadata,
  RubricReference,
  RubricReferences,
  OcxDocument,
} from "./odellTypes";
import log from "./log";
import { splitCommaSepValues } from "./util";

type ContentState = null | "STUDENT_CONTENT" | "TEACHER_CONTENT";

const prettyJson = (obj: any) => JSON.stringify(obj, null, 4);

const parseActivityIds = (tag: string) => {
  return (tag.split("teacher-activity:")[1] || "")
    .replace(/\s/g, "")
    .replace("]", "")
    .split(",");
};

function parseDocumentMetadata(
  document: docs_v1.Schema$Document,
  tableElement: docs_v1.Schema$Table
) {
  return parseKeyValueTable(
    document,
    tableElement.tableRows.slice(1),
    DocumentMetadataKeys
  );
}

function parseActivityMetadata(
  document: docs_v1.Schema$Document,
  tableElement: docs_v1.Schema$Table
) {
  return parseKeyValueTable(
    document,
    tableElement.tableRows.slice(1),
    ActivityMetadataKeys
  );
}

function parseMaterialIds(texts: string) {
  texts = texts?.trim();
  if (!texts?.length) {
    return [];
  }

  return texts
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t?.length);
}

function parseMaterialReferences(
  document: docs_v1.Schema$Document,
  tableElement: docs_v1.Schema$Table
) {
  const materials: MaterialReference[] = [];

  for (const row of tableElement.tableRows.slice(2)) {
    const materialId = extractRawText(row.tableCells[0].content);
    const accessType = extractRawText(row.tableCells[1].content);
    const locations = splitCommaSepValues(
      extractRawText(row.tableCells[2].content)
    );

    if (materialId.length === 0) {
      continue;
    }

    materials.push({
      id: materialId,
      accessType,
      locations,
    });
  }

  return {
    materials,
  };
}

function parseRubricReferences(
  document: docs_v1.Schema$Document,
  tableElement: docs_v1.Schema$Table
) {
  const rubrics: RubricReference[] = [];

  for (const row of tableElement.tableRows.slice(2)) {
    const rubricId = extractRawText(row.tableCells[0].content);
    const url = extractRawText(row.tableCells[1].content);

    if (rubricId.length === 0 || url.length === 0) {
      continue;
    }

    const spreadsheetId = url
      .trim()
      .replace("https://docs.google.com/spreadsheets/d/", "")
      .split("/")[0];

    rubrics.push({
      rubric_id: rubricId,
      url,
      spreadsheetId,
    });
  }

  return {
    rubrics,
  };
}

function parseTable(
  document: docs_v1.Schema$Document,
  tableElement: docs_v1.Schema$Table
): MetadataTable {
  let type: MetadataTableType;
  let metadata:
    | DocumentMetadata
    | ActivityMetadata
    | MaterialReferences
    | RubricReferences;

  const tableTitle = extractRawText(
    tableElement.tableRows[0].tableCells[0].content
  );

  if (tableTitle == "document-metadata") {
    type = "document";
    metadata = parseDocumentMetadata(
      document,
      tableElement
    ) as DocumentMetadata;
  } else if (tableTitle == "activity-metadata") {
    type = "activity";
    metadata = parseActivityMetadata(
      document,
      tableElement
    ) as ActivityMetadata;
  } else if (tableTitle == "[materials]") {
    type = "materials";
    metadata = parseMaterialReferences(document, tableElement);
  } else if (tableTitle == "rubrics") {
    type = "rubric";
    metadata = parseRubricReferences(document, tableElement);
  }

  if (type && metadata) {
    return {
      type,
      metadata,
    };
  }

  return null;
}

export default async function parseDocument(
  document: docs_v1.Schema$Document,
  ocxLibrary: OcxDocument[] = null
): Promise<OdellDocument> {
  let documentMetadata: DocumentMetadata = null;
  const activities: Activity[] = [];
  let contentState: ContentState = null;
  let currentActivity: Activity = null;
  let currentContentBlock: docs_v1.Schema$StructuralElement[] = [];
  let currentContentActivityIds: string[] = [];
  let contentAdditionalActivities: Array<{
    type: ContentState;
    activityId: string;
    additionalIds: string[];
    content: StudentContent | TeacherContent;
  }> = [];

  for (const element of document.body.content) {
    if (element.paragraph) {
      const rawText = extractRawText([element]);
      // We're not currently parsing content.
      if (!contentState) {
        if (rawText == "[student]") {
          contentState = "STUDENT_CONTENT";
          log("Begin student content");
        } else if (rawText.startsWith("[teacher]")) {
          contentState = "TEACHER_CONTENT";
          log("Begin teacher content");
        }
        continue;
      }
      // We're parsing content.
      if (rawText == "[student:end]" || rawText == "[teacher:end]") {
        const translatedContent = extractHtml(document, currentContentBlock);

        const content = {
          content: translatedContent,
        };

        if (contentState == "STUDENT_CONTENT") {
          currentActivity.studentContents.push(content);
        } else {
          currentActivity.teacherContents.push(content);
        }

        if (currentContentActivityIds.length) {
          contentAdditionalActivities.push({
            activityId: currentActivity.metadata.activity,
            additionalIds: currentContentActivityIds,
            content,
            type: contentState,
          });
        }

        log(prettyJson(translatedContent));

        contentState = null;
        currentContentBlock = [];
        currentContentActivityIds = [];

        log("End content");
        continue;
      }
      if (rawText.startsWith("[teacher-activity:")) {
        currentContentActivityIds = parseActivityIds(rawText);
        continue;
      }
    } else if (element.table) {
      if (!contentState) {
        const table = parseTable(document, element.table);
        if (!table) {
          log("Couldn't parse table");
          continue;
        }
        log(prettyJson(table));
        if (table.type == "activity") {
          currentActivity = {
            metadata: table.metadata as ActivityMetadata,
            materials: [],
            studentContents: [],
            teacherContents: [],
          };
          currentActivity.metadata.textsAsMaterialIds = parseMaterialIds(
            currentActivity.metadata.texts
          );
          activities.push(currentActivity);
        } else if (table.type == "materials" && currentActivity) {
          currentActivity.materials.push(
            ...(table.metadata as MaterialReferences).materials
          );
        } else if (table.type == "document") {
          documentMetadata = table.metadata as DocumentMetadata;
        } else if (table.type == "rubric") {
          documentMetadata.rubrics = table.metadata as RubricReferences;
        }
      }
    }
    if (contentState) {
      currentContentBlock.push(element);
    }
  }

  for (const contentDetails of contentAdditionalActivities) {
    for (const id of contentDetails.additionalIds) {
      const additionalActivity = activities.find(
        (a) =>
          a.metadata.activity == id &&
          a.metadata.activity != contentDetails.activityId
      );
      if (!additionalActivity) {
        continue;
      }
      if (contentDetails.type == "STUDENT_CONTENT") {
        additionalActivity.studentContents.push(contentDetails.content);
      } else {
        additionalActivity.teacherContents.push(contentDetails.content);
      }
    }
  }

  return {
    metadata: documentMetadata,
    activities: activities,
  };
}
