import {
  GoogleDocumentContent,
  DefaultConverters,
} from "./googleDocumentContent";

const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];
const texts = ["p", "blockquote"];
const lists = ["ol", "ul"];

export default function documentContentToHtml(
  json: GoogleDocumentContent[]
): string {
  const html = [];

  for (const elm of json) {
    // Headings
    for (const heading of headings) {
      const headingContent = elm[heading];
      if (headingContent) {
        html.push(`<${heading}>${headingContent}</${heading}>`);
        continue;
      }
    }

    // Simple strings
    for (const text of texts) {
      const textContent = elm[text] as string;

      if (textContent) {
        html.push(`<${text}>${replaceTags(textContent)}</${text}>`);
        continue;
      }
    }

    // Code
    const codeContent = elm.code;
    if (codeContent) {
      if (Array.isArray(codeContent.content)) {
        html.push(`<code>${codeContent.content.join("\n")}</code>`);
      } else {
        html.push(`<code>${codeContent.content}</code>`);
      }
      continue;
    }

    // Lists
    for (const list of lists) {
      const listContent = elm[list];
      if (listContent) {
        html.push(`<${list}>`);
        for (const li of listContent) {
          html.push(`<li>${li}</li>`);
        }
        html.push(`</${list}>`);
        continue;
      }
    }

    // Images
    const imgContent = elm.img;
    if (imgContent) {
      html.push(
        `<img src="${imgContent.source}" alt="${imgContent.alt}" title="${imgContent.title}" />`
      );
      continue;
    }

    if (elm.table) {
      html.push(buildTable(elm.table));
      continue;
    }
  }

  return html.join("\n");
}

const buildTable = (table: DefaultConverters.TableInput) => {
  const html = [];
  html.push("<table>");
  html.push("<thead>");
  html.push("<tr>");
  for (const header of table.headers) {
    html.push(`<th>${header}</th>`);
  }
  html.push("</tr>");
  html.push("</thead>");
  html.push("<tbody>");
  for (const row of table.rows) {
    html.push("<tr>");
    for (const cell of row) {
      html.push(`<td>${cell}</td>`);
    }
    html.push("</tr>");
  }
  html.push("</tbody>");
  html.push("</table>");
  return html.join("\n");
};

const replaceTags = (str: string) => {
  return str.replace("[page-break]", "<br />");
};
