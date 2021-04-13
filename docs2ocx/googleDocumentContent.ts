export = GoogleDocumentContent;

declare namespace GoogleDocumentContent {
  namespace DefaultConverters {
    interface Converters {
      blockquote: string;
      code: CodeInput;
      h1: string | string[];
      h2: string | string[];
      h3: string | string[];
      h4: string | string[];
      h5: string | string[];
      h6: string | string[];
      img: ImgInput;
      ol: string[];
      p: string;
      table: TableInput;
      ul: string[];
    }

    interface ImgInput {
      alt: string;
      title: string;
      source: string;
    }

    interface CodeInput {
      language?: string;
      content: string | string[];
    }

    interface TableInput {
      headers: string[];
      rows: string[][];
    }
  }

  type GoogleDocumentContent = {
    [TConverter in keyof DefaultConverters.Converters]?: DefaultConverters.Converters[TConverter];
  };
}
