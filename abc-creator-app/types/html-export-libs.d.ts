declare module "html2pdf.js" {
  type Html2PdfWorker = {
    set: (options: Record<string, unknown>) => Html2PdfWorker;
    from: (source: HTMLElement | string) => Html2PdfWorker;
    save: () => Promise<void>;
  };

  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}

declare module "html-docx-js" {
  type DocxOptions = {
    orientation?: "portrait" | "landscape";
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
      header?: number;
      footer?: number;
      gutter?: number;
    };
  };

  const htmlDocx: {
    asBlob: (html: string, options?: DocxOptions) => Blob;
  };

  export default htmlDocx;
}
