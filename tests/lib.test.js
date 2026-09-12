const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  isHeicFile,
  outputName,
  formatBytes,
  jpegQuality,
  browserSupported,
} = require("../js/lib.js");

test("isHeicFile accepts common iPhone extensions and MIME types", () => {
  assert.equal(isHeicFile({ name: "IMG_1234.HEIC", type: "" }), true);
  assert.equal(isHeicFile({ name: "photo.heif", type: "application/octet-stream" }), true);
  assert.equal(isHeicFile({ name: "no-ext", type: "image/heic" }), true);
  assert.equal(isHeicFile({ name: "shot.jpg", type: "image/jpeg" }), false);
  assert.equal(isHeicFile(null), false);
});

test("outputName swaps HEIC/HEIF for jpg or png", () => {
  assert.equal(outputName("IMG_0001.HEIC", "jpg"), "IMG_0001.jpg");
  assert.equal(outputName("scan.heif", "png"), "scan.png");
  assert.equal(outputName("weird/name:ok.HEIC", "jpg"), "weird_name_ok.jpg");
  assert.equal(outputName("", "png"), "image.png");
});

test("formatBytes and jpegQuality stay in range", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(jpegQuality(92), 0.92);
  assert.equal(jpegQuality(5), 0.1);
  assert.equal(jpegQuality(140), 1);
});

test("browserSupported requires WASM and blob URLs", () => {
  assert.equal(
    browserSupported({
      WebAssembly: {},
      Blob: function Blob() {},
      URL: { createObjectURL: function () {} },
      FileReader: function FileReader() {},
    }),
    true
  );
  assert.equal(browserSupported({}), false);
});
