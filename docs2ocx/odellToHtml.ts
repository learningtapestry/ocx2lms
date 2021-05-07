import {
  OdellDocument,
  MaterialReference,
  RubricReference,
  MaterialDocument,
} from "./odellTypes";
import { snakeCase } from "lodash";
import { format } from "prettier";

const prettify = (content: string) => {
  try {
    return format(content, { parser: "html" });
  } catch {
    return content;
  }
};

export function materialToHtml(
  material: MaterialDocument,
  jsonLd: Record<string, any>
) {
  return prettify(`
  <!DOCTYPE html>
  <html>
    <head>
      <script type="application/ld+json">
        ${JSON.stringify(jsonLd, null, 2)}
      </script>
    </head>
    <body>
      <section id="Material_${snakeCase(material.id.toLocaleLowerCase())}">
        ${material.content?.content}
      </section>
    </body>
  </html>`);
}

export function rubricToHtml(
  rubric: RubricReference,
  jsonLd: Record<string, any>
) {
  return prettify(`
  <!DOCTYPE html>
  <html>
    <head>
      <script type="application/ld+json">
        ${JSON.stringify(jsonLd, null, 2)}
      </script>
    </head>
    <body>
    </body>
  </html>`);
}

export function documentToHtml(
  lesson: OdellDocument,
  jsonLd: Record<string, any>
) {
  const html = [];
  let i = 1;
  for (const activity of lesson.activities) {
    for (const material of activity.materials) {
      console.log(material.id);
    }

    if (activity.studentContents.length) {
      const allContent = activity.studentContents
        .map((c) => c.content)
        .join("\n");

      html.push(`<section id="Activity_${i}">${allContent}</section>`);
    }

    if (activity.teacherContents.length) {
      const allContent = activity.teacherContents
        .map((c) => c.content)
        .join("\n");

      html.push(
        `<section id="Activity_Teacher_${activity.metadata.activity}">${allContent}</section>`
      );
    }

    i++;
  }

  return prettify(`
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
          ${JSON.stringify(jsonLd, null, 2)}
        </script>
      </head>
      <body>
        ${html.join("\n")}
      </body>
    </html>
  `);
}
