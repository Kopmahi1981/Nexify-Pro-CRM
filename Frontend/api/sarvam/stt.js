import { IncomingForm } from "formidable";
import { readFileSync } from "node:fs";
import { sarvamRequest } from "./client.js";
import { methodNotAllowed, badRequest, serverError } from "./utils.js";

// Sarvam REST STT (saaras:v3, synchronous /transcribe) accepts audio up to 30s.
// Primary enforcement of the 30s cap lives client-side in the VoiceRecorder.
// On the backend we enforce a coarse file-size guard (16 MB) so runaway /
// unsupported requests are rejected before ever reaching Sarvam.
const MAX_FILE_BYTES = 16 * 1024 * 1024; // comfortably above any 30s WebM, well below abuse.

// The frontend emits bare codes (en, hi, te, mr); Sarvam wants BCP-47 locales.
// Anything else is rejected so an unsupported request never reaches Sarvam.
const LANGUAGE_CODE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  mr: "mr-IN",
};

// Parse multipart form using formidable. Files land in formidable's temp dir
// (filepath) so we can stream them to Sarvam without buffering all audio in
// memory. bodyParser:false in Vercel gives us the raw stream for this.
function parseForm(req) {
  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: MAX_FILE_BYTES,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// formidable v3 (with multiples:false) may return files.file as an
// array-like collection (keys ['0']); normalize to a single file object.
function normalizeFile(file) {
  if (!file) return undefined;
  if (Array.isArray(file)) return file[0];
  // array-like (has numeric '0' key but is not a real Array)
  if (typeof file === "object" && "0" in file && "filepath" in file === false) {
    return file["0"];
  }
  return file;
}

// Convert a formidable file object into a value Node 24's FormData/undici can
// append as a file part. formidable v3 stages uploads to a temp file
// (file.filepath); we read those bytes into a Buffer and wrap in a Blob with
// the original filename + MIME type preserved. We NEVER pass a filesystem
// path or the formidable object directly to Sarvam. (Files are capped at
// MAX_FILE_BYTES by formidable, so this in-memory read is bounded and safe.)
function toFormDataFile(file) {
  const buf = readFileSync(file.filepath);
  return {
    blob: new Blob([buf], { type: file.mimetype || "audio/webm" }),
    name: file.originalFilename || "recording.webm",
    size: file.size,
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch {
    // formidable throws on oversize / malformed multipart.
    return badRequest(res, "Failed to parse multipart request.");
  }

  const file = normalizeFile(files.file);

  // Validate that an audio file was actually provided.
  if (!file) {
    return badRequest(res, "Audio File is required.");
  }

  // Map + validate language code. formidable may return a field as a string
  // or an array (e.g. language_code could be ["en"]); normalize to a string.
  const rawLang = Array.isArray(fields.language_code)
    ? fields.language_code[0]
    : (fields.language_code || "");
  const normalizedLang = String(rawLang || "")
    .trim()
    .toLowerCase();
  const language_code = LANGUAGE_CODE_MAP[normalizedLang];
  if (!language_code) {
    return badRequest(
      res,
      `Unsupported language_code: ${normalizedLang || "(missing)"}. Supported: en, hi, te, mr.`
    );
  }

  // Coarse backend guard for Sarvam's 30s REST audio duration limit.
  // The precise 30s cap is enforced client-side in the VoiceRecorder.
  if (file.size > MAX_FILE_BYTES) {
    return badRequest(
      res,
      `Audio file is too large (${Math.round(file.size / 1024)} KB). Sarvam REST STT supports a maximum of 30 seconds of audio.`
    );
  }

  // Build the outgoing multipart request to Sarvam from the temp file's
  // bytes, preserving the original filename + MIME type (WebM is forwarded
  // as-is — no conversion, no FFmpeg).
  const f = toFormDataFile(file);

  const outgoing = new FormData();
  outgoing.append("file", f.blob, { filename: f.name });
  outgoing.append("language_code", language_code);
  outgoing.append("model", "saaras:v3");
  outgoing.append("mode", "transcribe");

  try {
    // sarvamRequest (client.js) injects api-subscription-key server-side and,
    // because isFormData:true, omits Content-Type so the multipart boundary
    // is generated correctly by fetch/undici. The key never leaves the server.
    const result = await sarvamRequest("/speech-to-text", {
      method: "POST",
      isFormData: true,
      body: outgoing,
    });

    const transcript =
      result && typeof result.transcript === "string"
        ? result.transcript.trim()
        : "";

    return res.status(200).json({
      status: "success",
      requestId: result && result.request_id ? result.request_id : undefined,
      transcript,
      language:
        result && result.language_code ? result.language_code : language_code,
      raw: result,
    });
  } catch (error) {
    // Safe non-200 error to the caller. Never echo Sarvam's body (which could
    // reflect internals). Log server-side only.
    return serverError(res, error);
  }
}
