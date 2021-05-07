import { docs_v1 } from "googleapis";
import { sortBy } from "lodash";
import { extractHtml, parseKeyValueTable } from "./googleDocument";
import {
  MaterialDocument,
  MaterialMetadata,
  MaterialMetadataKeys,
  OcxDocument,
} from "./odellTypes";
import * as matchAll from "string.prototype.matchall";

export default async function parseMaterial(
  document: docs_v1.Schema$Document,
  ocxLibrary: OcxDocument[] = null
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

  if (!metadata) {
    return null;
  }

  let content = extractHtml(document, contentBlock);
  if (
    metadata.material_type == "unit" &&
    metadata.type == "syllabus" &&
    ocxLibrary
  ) {
    content = renderSyllabus(metadata, content, ocxLibrary);
  }

  return {
    id: null,
    documentId: document.documentId,
    metadata,
    content: { content },
  };
}

function renderSyllabus(
  metadata: MaterialMetadata,
  content: string,
  ocxLibrary: OcxDocument[]
): string {
  const sectionLessons: Record<string, OcxDocument[]> = {};
  for (const ocxDocument of ocxLibrary) {
    const ocxMetadata = ocxDocument.document.metadata;
    if (ocxMetadata.grade != metadata.grade) {
      continue;
    }
    if (!sectionLessons[ocxMetadata.section]) {
      sectionLessons[ocxMetadata.section] = [];
    }
    sectionLessons[ocxMetadata.section].push(ocxDocument);
  }
  const referencedSections = matchAll(
    content,
    /\[section-lesson-details: ([0-9a-zA-Z ]+)\]/g
  );
  for (const match of Array.from(referencedSections)) {
    const section = match[1].trim();
    let lessons = sectionLessons[section];

    if (!lessons) {
      continue;
    }
    const lessonContents = [];
    lessons = sortBy(lessons, (l) => parseInt(l.document.metadata.lesson));
    for (const lesson of lessons) {
      const activityGradings: string[] = [];

      for (const activity of lesson.document.activities) {
        activityGradings.push(
          `
          <tr>
            <td>${activity.metadata.activity_title}</td>
            <td>${activity.metadata.assignment_group}</td>
            <td>${activity.metadata.total_points}</td>
            <td>${
              activity.metadata.rubric_id ? activity.metadata.rubric_id : "No"
            }</td>
          </tr>
          `
        );
      }

      lessonContents.push(`
        <div class="lesson">
          <p>
            Lesson ${lesson.document.metadata.lesson}: ${
        lesson.document.metadata.lesson_description
      }
          </p>
          <div class="lesson-look-fors">
            ${lesson.document.metadata.lesson_look_fors}
          </div>
          <div class="activity-grading">
            <table>
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Grading Category</th>
                  <th>Points</th>
                  <th>Grading Rubric</th>
                </tr>
              </thead>
              <tbody>
                ${activityGradings.join("\n")}
              </tbody>
            </table>
          </div>
        </div>
      `);
    }
    const matchLiteral = match[0]
      .replace(/\-/g, "\\-")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");
    const replRegexp = new RegExp(`<p>\\s*${matchLiteral}\\s*<\\/p>`);
    content = content.replace(replRegexp, lessonContents.join("\n"));
  }
  return content;
}
