/** Shared helpers for HEIC Save As. Safe to require from Node tests. */

const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

function isHeicFile(file) {
  if (!file) return false;
  const name = String(file.name || "");
  const type = String(file.type || "").toLowerCase();
  return HEIC_EXT.test(name) || HEIC_TYPES.has(type);
}

function outputName(originalName, format) {
  const ext = format === "png" ? "png" : "jpg";
  const base = String(originalName || "image").replace(HEIC_EXT, "");
  const cleaned = base.replace(/[\\/:*?"<>|]+/g, "_").trim() || "image";
  return cleaned.endsWith("." + ext) ? cleaned : cleaned + "." + ext;
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return n + " B";
  const units = ["KB", "MB", "GB"];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  const digits = value >= 10 || i === 0 ? 0 : 1;
  return value.toFixed(digits) + " " + units[i];
}

function jpegQuality(sliderValue) {
  const n = Number(sliderValue);
  if (!Number.isFinite(n)) return 0.92;
  return Math.min(1, Math.max(0.1, n / 100));
}

function browserSupported(globalObj) {
  const g = globalObj || (typeof globalThis !== "undefined" ? globalThis : {});
  return Boolean(
    g.WebAssembly &&
      g.Blob &&
      g.URL &&
      typeof g.URL.createObjectURL === "function" &&
      typeof g.FileReader === "function"
  );
}

function uniqueKey(file, index) {
  return [file && file.name, file && file.size, file && file.lastModified, index].join(":");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isHeicFile,
    outputName,
    formatBytes,
    jpegQuality,
    browserSupported,
    uniqueKey,
  };
}
