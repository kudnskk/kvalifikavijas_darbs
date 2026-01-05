const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const normalizeText = (text) => {
  if (typeof text !== "string") return "";
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
};

const capText = (text) => {
  const maxChars = Number(process.env.CHAT_FILE_MAX_CHARS) || 8000;
  if (!Number.isFinite(maxChars) || maxChars <= 0) return text;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
};

/**
 * Extracts plain text from an uploaded file (multer memoryStorage).
 * @param {{ mimetype: string, originalname: string, buffer: Buffer }} file
 */
const extractFileText = async (file) => {
  const mimetype = file?.mimetype;
  const buffer = file?.buffer;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("No file buffer provided");
  }

  if (mimetype === "text/plain") {
    return capText(normalizeText(buffer.toString("utf8")));
  }

  if (mimetype === "application/pdf") {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    return capText(normalizeText(result?.text || ""));
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return capText(normalizeText(result?.value || ""));
  }

  if (mimetype === "application/msword") {
    // doc file parsing not possible
    throw new Error(
      "DOC files are not supported for text extraction. Please convert to DOCX.",
    );
  }

  throw new Error("Unable to read this file, please choose another one");
};

module.exports = {
  extractFileText,
};
