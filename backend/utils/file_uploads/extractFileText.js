const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

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
    const pdf = await pdfParse(buffer);
    return capText(normalizeText(pdf?.text || ""));
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return capText(normalizeText(result?.value || ""));
  }

  if (mimetype === "application/msword") {
    // .doc parsing usually requires external tooling; keep it explicit.
    throw new Error(
      "DOC files are not supported for text extraction. Please convert to DOCX.",
    );
  }

  throw new Error("Unsupported file type");
};

module.exports = {
  extractFileText,
};
