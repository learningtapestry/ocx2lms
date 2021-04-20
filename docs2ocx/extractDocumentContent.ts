// Ref. https://github.com/cedricdelpoux/gatsby-source-google-docs/
import { docs_v1 } from "googleapis";
import { get, repeat } from "lodash";
import { GoogleDocumentContent } from "./googleDocumentContent";

// If the table has only one cell
// and the monospace font "Consolas" is applied everywhere
const isCodeBlocks = (table) => {
  const hasOneCell = table.rows === 1 && table.columns === 1;

  if (!hasOneCell) {
    return false;
  }

  const firstRow = table.tableRows[0];
  const firstCell = firstRow.tableCells[0];
  const hasMonospaceFont = firstCell.content.every(({ paragraph }) =>
    paragraph.elements.every(({ textRun }) => {
      const content = textRun.content
        .replace(/\n/g, "")
        .replace(/\x0B/g, "") //eslint-disable-line no-control-regex
        .trim();
      const isEmpty = content === "";
      const fontFamily = get(textRun, [
        "textStyle",
        "weightedFontFamily",
        "fontFamily",
      ]);
      const hasConsolasFont = fontFamily === "Consolas";

      return isEmpty || hasConsolasFont;
    })
  );

  return hasMonospaceFont;
};

// If the table has only one cell
// and the content is surrounded by smart quotes: “quote”
const isQuote = (table) => {
  const hasOneCell = table.rows === 1 && table.columns === 1;

  if (!hasOneCell) {
    return false;
  }

  const firstRow = table.tableRows[0];
  const firstCell = firstRow.tableCells[0];
  const {
    0: firstContent,
    [firstCell.content.length - 1]: lastContent,
  } = firstCell.content;
  const startText = firstContent.paragraph.elements[0].textRun.content;
  const lastText = lastContent.paragraph.elements[0].textRun.content;
  const startsWithQuote = startText.replace(/\n/g, "").startsWith("“");
  const endsWithQuote = lastText.replace(/\n/g, "").endsWith("”");

  return startsWithQuote && endsWithQuote;
};

const HORIZONTAL_TAB_CHAR = "\x09";
const GOOGLE_DOCS_INDENT = 18;

const DEFAULT_OPTIONS = {
  DEFAULT_OPTIONS: {
    createPages: false,
    debug: false,
    demoteHeadings: true,
    folder: undefined,
    imagesOptions: undefined,
    pageContext: [],
    skipCodes: false,
    skipFootnotes: false,
    skipHeadings: false,
    skipImages: false,
    skipLists: false,
    skipQuotes: false,
    skipTables: false,
  },
  DEFAULT_TEMPLATE: "page",
};

class GoogleDocument {
  document: docs_v1.Schema$Document;
  links: {};
  properties = {};
  cover: any;
  elements = [];
  headings = [];
  footnotes = {};
  related = [];
  options = DEFAULT_OPTIONS.DEFAULT_OPTIONS;
  bodyFontSize: any;
  content: docs_v1.Schema$StructuralElement[] = null;

  constructor({ document, properties = {}, links = {}, content = null }) {
    this.document = document;
    this.links = links;
    this.properties = properties;

    if (content) {
      this.content = content;
    } else {
      this.content = this.document.body.content;
    }

    // Keep the class scope in loops
    this.formatText = this.formatText.bind(this);
    this.normalizeElement = this.normalizeElement.bind(this);
  }

  formatText(el, { withBold = true, inlineImages = false } = {}) {
    if (el.inlineObjectElement) {
      const image = this.getImage(el);
      if (image) {
        if (inlineImages) {
          return `<img src="${image.source}" alt="${image.alt}" title="${image.title}" />`;
        }
        this.elements.push({
          type: "img",
          value: image,
        });
      }
    }

    if (!el.textRun || !el.textRun.content || !el.textRun.content.trim()) {
      return "";
    }

    let before = "";
    let text = el.textRun.content.replace(/\n$/, "");
    let after = "";

    const contentMatch = text.match(/^(\s*)(\S+(?:[ \t\v]*\S+)*)(\s*)$/);
    if (contentMatch) {
      before = contentMatch[1];
      text = contentMatch[2];
      after = contentMatch[3];
    }

    const {
      backgroundColor,
      baselineOffset,
      bold,
      fontSize,
      foregroundColor,
      italic,
      link,
      strikethrough,
      underline,
      weightedFontFamily,
    } = el.textRun.textStyle;

    const inlineCode =
      weightedFontFamily && weightedFontFamily.fontFamily === "Consolas";

    if (inlineCode) {
      if (this.options.skipCodes) return text;

      return "<code>" + text + "</code>";
    }

    const styles = [];

    text = text.replace(/\*/g, "\\*"); // Prevent * to be bold
    text = text.replace(/_/g, "\\_"); // Prevent _ to be italic

    if (baselineOffset === "SUPERSCRIPT") {
      text = `<sup>${text}</sup>`;
    }

    if (baselineOffset === "SUBSCRIPT") {
      text = `<sub>${text}</sub>`;
    }

    if (underline && !link) {
      text = `<u>${text}</u>`;
    }

    if (italic) {
      text = `<em>${text}</em>`;
    }

    if (bold && withBold) {
      text = `<strong>${text}</strong>`;
    }

    if (strikethrough) {
      text = `<s>${text}</s>`;
    }

    if (fontSize) {
      const em = (fontSize.magnitude / this.bodyFontSize).toFixed(2);
      styles.push(`font-size:${em}em`);
    }

    if (get(foregroundColor, ["color", "rgbColor"]) && !link) {
      const { rgbColor } = foregroundColor.color;
      const red = Math.round((rgbColor.red || 0) * 255);
      const green = Math.round((rgbColor.green || 0) * 255);
      const blue = Math.round((rgbColor.blue || 0) * 255);
      styles.push(`color:rgb(${red}, ${green}, ${blue})`);
    }

    if (get(backgroundColor, ["color", "rgbColor"]) && !link) {
      const { rgbColor } = backgroundColor.color;
      const red = Math.round((rgbColor.red || 0) * 255);
      const green = Math.round((rgbColor.green || 0) * 255);
      const blue = Math.round((rgbColor.blue || 0) * 255);
      styles.push(`background-color:rgb(${red}, ${green}, ${blue})`);
    }

    if (styles.length > 0) {
      text = `<span style='${styles.join(";")}'>${text}</span>`;
    }
    if (link) {
      return `${before}<a href="${link.url}">${text}</a>${after}`;
    }

    return before + text + after;
  }

  getBodyFontSize() {
    let fontSize = 11;

    const documentStyles = get(this.document, ["namedStyles", "styles"]);

    if (!documentStyles) return fontSize;

    const normalTextStyle = documentStyles.find(
      (style) => style.namedStyleType === "NORMAL_TEXT"
    );

    return get(normalTextStyle, "textStyle.fontSize.magnitude", fontSize);
  }

  getImage(el) {
    if (this.options.skipImages) return;

    const { inlineObjects } = this.document;

    if (!inlineObjects || !el.inlineObjectElement) {
      return;
    }

    const inlineObject = inlineObjects[el.inlineObjectElement.inlineObjectId];
    const embeddedObject = inlineObject.inlineObjectProperties.embeddedObject;

    return {
      source: embeddedObject.imageProperties.contentUri,
      title: embeddedObject.title || "",
      alt: embeddedObject.description || "",
    };
  }

  processCover() {
    const { headers, documentStyle } = this.document;
    const firstPageHeaderId = get(documentStyle, ["firstPageHeaderId"]);

    if (!firstPageHeaderId) {
      return;
    }

    const headerElement = get(headers[firstPageHeaderId], [
      "content",
      0,
      "paragraph",
      "elements",
      0,
    ]);

    const image = this.getImage(headerElement);

    if (image) {
      this.cover = {
        image: image.source,
        title: image.title,
        alt: image.alt,
      };
    }
  }

  getTableCellContent(content) {
    return content
      .map(({ paragraph }) => paragraph.elements.map(this.formatText).join(""))
      .join("")
      .replace(/\n/g, "<br/>"); // Replace newline characters by <br/> to avoid multi-paragraphs
  }

  indentText(text, level) {
    return `${repeat(HORIZONTAL_TAB_CHAR, level)}${text}`;
  }

  stringifyContent(tagContent) {
    return tagContent.join("").replace(/\n$/, "");
  }

  appendToList({ list, listItem, elementLevel = null, level }) {
    const lastItem = list[list.length - 1];

    if (listItem.level > level) {
      if (typeof lastItem === "object") {
        this.appendToList({
          list: lastItem.value,
          listItem,
          elementLevel,
          level: level + 1,
        });
      } else {
        list.push({
          type: listItem.tag,
          value: [listItem.text],
        });
      }
    } else {
      list.push(listItem.text);
    }
  }

  getListTag(listId, level) {
    const glyph = get(this.document, [
      "lists",
      listId,
      "listProperties",
      "nestingLevels",
      level,
      "glyphType",
    ]);

    return glyph ? "ol" : "ul";
  }

  processList(paragraph, index) {
    if (this.options.skipLists) return;

    const prevListId = get(this.document, [
      "body",
      "content",
      index - 1,
      "paragraph",
      "bullet",
      "listId",
    ]);
    const isPrevList = prevListId === paragraph.bullet.listId;
    const prevList = get(this.elements, [this.elements.length - 1, "value"]);
    const text = this.stringifyContent(
      paragraph.elements.map((el) =>
        this.formatText(el, { inlineImages: true })
      )
    );

    if (isPrevList && Array.isArray(prevList)) {
      const { nestingLevel } = paragraph.bullet;

      if (nestingLevel) {
        this.appendToList({
          list: prevList,
          listItem: {
            text,
            level: nestingLevel,
            tag: this.getListTag(paragraph.bullet.listId, prevList.length),
          },
          level: 0,
        });
      } else {
        prevList.push(text);
      }
    } else {
      this.elements.push({
        type: this.getListTag(paragraph.bullet.listId, 0),
        value: [text],
      });
    }
  }

  processParagraph(paragraph, index) {
    const headings = [];
    const tags = {
      HEADING_1: "h1",
      HEADING_2: "h2",
      HEADING_3: "h3",
      HEADING_4: "h4",
      HEADING_5: "h5",
      HEADING_6: "h6",
      NORMAL_TEXT: "p",
      SUBTITLE: "h2",
      TITLE: "h1",
    };
    const tagType = paragraph.paragraphStyle.namedStyleType;
    const tag = tags[tagType];

    // Lists
    if (paragraph.bullet) {
      this.processList(paragraph, index);
      return;
    }

    let tagContentArray = [];

    paragraph.elements.forEach((el) => {
      if (el.pageBreak) {
        return;
      }

      // <hr />
      else if (el.horizontalRule) {
        tagContentArray.push("<hr/>");
      }

      // Footnotes
      else if (el.footnoteReference) {
        if (this.options.skipFootnotes) return;

        tagContentArray.push(`[^${el.footnoteReference.footnoteNumber}]`);
        this.footnotes[el.footnoteReference.footnoteId] =
          el.footnoteReference.footnoteNumber;
      }

      // Headings
      else if (tag !== "p") {
        if (this.options.skipHeadings) return;

        const text = this.formatText(el, {
          withBold: false,
        });

        if (text) {
          headings.push({
            tag,
            text,
          });
          tagContentArray.push(text);
        }
      }

      // Texts
      else {
        const text = this.formatText(el);

        if (text) {
          tagContentArray.push(text);
        }
      }
    });

    if (tagContentArray.length === 0) return;

    let content = this.stringifyContent(tagContentArray);
    let tagIndentLevel = 0;

    if (paragraph.paragraphStyle.indentStart) {
      const { magnitude } = paragraph.paragraphStyle.indentStart;
      tagIndentLevel = Math.round(magnitude / GOOGLE_DOCS_INDENT);
    }

    if (tagIndentLevel > 0) {
      content = this.indentText(content, tagIndentLevel);
    }

    this.elements.push({
      type: tag,
      value: content,
    });

    headings.forEach((heading) => {
      this.headings.push({ ...heading, index: this.elements.length - 1 });
    });
  }

  processQuote(table) {
    if (this.options.skipQuotes) return;

    const firstRow = table.tableRows[0];
    const firstCell = firstRow.tableCells[0];
    const quote = this.getTableCellContent(firstCell.content);
    const blockquote = quote.replace(/“|”/g, ""); // Delete smart-quotes

    this.elements.push({ type: "blockquote", value: blockquote });
  }

  processCode(table) {
    if (this.options.skipCodes) return;

    const firstRow = table.tableRows[0];
    const firstCell = firstRow.tableCells[0];
    const codeContent = firstCell.content
      .map(({ paragraph }) =>
        paragraph.elements.map((el) => el.textRun.content).join("")
      )
      .join("")
      .replace(/\x0B/g, "\n") //eslint-disable-line no-control-regex
      .replace(/^\n|\n$/g, "")
      .split("\n");

    if (codeContent.length === 1 && codeContent[0] === "") return;

    let lang = null;
    const langMatch = codeContent[0].match(/^\s*lang:\s*(.*)$/);

    if (langMatch) {
      codeContent.shift();
      lang = langMatch[1];
    }

    this.elements.push({
      type: "code",
      value: {
        language: lang,
        content: codeContent,
      },
    });
  }

  processTable(table) {
    if (this.options.skipTables) return;

    const [thead, ...tbody] = table.tableRows;

    this.elements.push({
      type: "table",
      value: {
        headers: thead.tableCells.map(({ content }) =>
          this.getTableCellContent(content)
        ),
        rows: tbody.map((row) =>
          row.tableCells.map(({ content }) => this.getTableCellContent(content))
        ),
      },
    });
  }

  processFootnotes() {
    if (this.options.skipFootnotes) return;

    const footnotes = [];
    const documentFootnotes = this.document.footnotes;

    if (!documentFootnotes) return;

    Object.entries(documentFootnotes).forEach(([, value]) => {
      const paragraphElements = (value as any).content[0].paragraph.elements;
      const tagContentArray = paragraphElements.map(this.formatText);
      const tagContentString = this.stringifyContent(tagContentArray);

      footnotes.push({
        type: "footnote",
        value: {
          number: this.footnotes[(value as any).footnoteId],
          text: tagContentString,
        },
      });
    });

    footnotes.sort(
      (footnote1, footnote2) =>
        parseInt(footnote1.value.number) - parseInt(footnote2.value.number)
    );

    this.elements.push(...footnotes);
  }

  processDemoteHeadings() {
    this.headings.forEach((heading) => {
      const levelevel = Number(heading.tag.substring(1));
      const newLevel = levelevel < 6 ? levelevel + 1 : levelevel;
      this.elements[heading.index] = {
        type: "h" + newLevel,
        value: heading.text,
      };
    });
  }

  processInternalLinks() {
    if (Object.keys(this.links).length > 0) {
      const elementsStringified = JSON.stringify(this.elements);

      const elementsStringifiedWithRelativePaths = elementsStringified.replace(
        /https:\/\/docs.google.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)(?:\/edit|\/preview)?/g,
        (match, id) => {
          this.related.push(id);
          return this.links[id] || match;
        }
      );

      this.elements = JSON.parse(elementsStringifiedWithRelativePaths);
    }
  }

  normalizeElement(element) {
    if (element.type && element.value) {
      return { [element.type]: this.normalizeElement(element.value) };
    }

    if (Array.isArray(element)) {
      return element.map(this.normalizeElement);
    }

    return element;
  }

  process(): GoogleDocumentContent[] {
    this.bodyFontSize = this.getBodyFontSize();

    this.processCover();

    this.content.forEach(
      ({ paragraph, table, sectionBreak, tableOfContents }, i) => {
        // Unsupported elements
        if (sectionBreak || tableOfContents) {
          return;
        }

        if (table) {
          // Quotes
          if (isQuote(table)) {
            this.processQuote(table);
          }

          // Code Blocks
          else if (isCodeBlocks(table)) {
            this.processCode(table);
          }

          // Tables
          else {
            this.processTable(table);
          }
        }

        // Paragraphs
        else {
          this.processParagraph(paragraph, i);
        }
      }
    );

    // Footnotes
    this.processFootnotes();

    // h1 -> h2, h2 -> h3, ...
    if (this.options.demoteHeadings === true) {
      this.processDemoteHeadings();
    }

    this.processInternalLinks();

    return this.elements.map(this.normalizeElement);
  }
}

const extractDocumentContent = (
  document: docs_v1.Schema$Document,
  content: docs_v1.Schema$StructuralElement[] = null
) => {
  const processor = new GoogleDocument({
    document,
    content,
  });
  return processor.process();
};

export default extractDocumentContent;
