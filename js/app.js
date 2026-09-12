(function () {
  "use strict";

  var lib = window.HeicSaveAsLib;
  var items = [];
  var converting = false;

  var els = {
    drop: document.getElementById("drop"),
    picker: document.getElementById("picker"),
    files: document.getElementById("files"),
    status: document.getElementById("status"),
    banner: document.getElementById("unsupported"),
    qualityWrap: document.getElementById("quality-wrap"),
    quality: document.getElementById("quality"),
    qualityValue: document.getElementById("quality-value"),
    saveAll: document.getElementById("save-all"),
    clear: document.getElementById("clear"),
  };

  function format() {
    var checked = document.querySelector('input[name="format"]:checked');
    return checked && checked.value === "png" ? "png" : "jpg";
  }

  function quality() {
    return lib.jpegQuality(els.quality.value);
  }

  function setStatus(message, kind) {
    els.status.textContent = message;
    els.status.className = "status" + (kind ? " " + kind : "");
  }

  function mimeFor(fmt) {
    return fmt === "png" ? "image/png" : "image/jpeg";
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2500);
  }

  function revokePreview(item) {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
      item.previewUrl = "";
    }
  }

  function libraryReady() {
    return typeof window.heic2any === "function";
  }

  function showUnsupported(reason) {
    els.banner.hidden = false;
    els.banner.textContent = reason;
    els.drop.setAttribute("aria-disabled", "true");
    els.picker.disabled = true;
    els.saveAll.disabled = true;
  }

  function checkEnvironment() {
    if (!lib.browserSupported(window)) {
      showUnsupported(
        "This browser cannot convert HEIC here. HEIC Save As needs WebAssembly, Blob URLs, and a current Chrome, Edge, Firefox, or Safari."
      );
      return false;
    }
    if (!libraryReady()) {
      showUnsupported(
        "The converter library did not load. Check the network (heic2any from jsDelivr) and try again. Nothing is uploaded."
      );
      return false;
    }
    els.banner.hidden = true;
    return true;
  }

  function syncQualityVisibility() {
    var png = format() === "png";
    els.qualityWrap.hidden = png;
    els.quality.disabled = png;
    els.qualityValue.textContent = String(els.quality.value);
  }

  function render() {
    els.files.innerHTML = "";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "file";
      li.dataset.id = item.id;

      var thumb;
      if (item.previewUrl) {
        thumb = document.createElement("img");
        thumb.className = "thumb";
        thumb.alt = "Preview of " + item.file.name;
        thumb.src = item.previewUrl;
      } else {
        thumb = document.createElement("div");
        thumb.className = "thumb placeholder";
        thumb.textContent = "HEIC";
      }

      var body = document.createElement("div");
      var name = document.createElement("div");
      name.className = "file-name";
      name.textContent = item.file.name;
      var meta = document.createElement("div");
      meta.className = "file-meta";
      var stateClass = item.error ? "bad" : item.blob ? "good" : "";
      meta.innerHTML =
        lib.formatBytes(item.file.size) +
        ' · <span class="' +
        stateClass +
        '">' +
        item.state +
        "</span>";
      body.appendChild(name);
      body.appendChild(meta);

      var actions = document.createElement("div");
      actions.className = "file-actions";

      var save = document.createElement("button");
      save.type = "button";
      save.className = "primary";
      save.textContent = "Save as";
      save.disabled = !item.blob;
      save.addEventListener("click", function () {
        downloadBlob(item.blob, item.outName);
      });

      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        removeItem(item.id);
      });

      actions.appendChild(save);
      actions.appendChild(remove);
      li.appendChild(thumb);
      li.appendChild(body);
      li.appendChild(actions);
      els.files.appendChild(li);
    });

    var readyCount = items.filter(function (item) {
      return item.blob;
    }).length;
    els.saveAll.disabled = readyCount === 0 || converting;
    els.clear.disabled = items.length === 0 || converting;
  }

  function removeItem(id) {
    var next = [];
    items.forEach(function (item) {
      if (item.id === id) revokePreview(item);
      else next.push(item);
    });
    items = next;
    render();
    if (!items.length) {
      setStatus("Drop iPhone .heic / .heif files. Conversion stays in this browser.");
    }
  }

  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;

    var added = 0;
    var skipped = 0;
    incoming.forEach(function (file, index) {
      if (!lib.isHeicFile(file)) {
        skipped += 1;
        return;
      }
      items.push({
        id: lib.uniqueKey(file, items.length + index) + ":" + Date.now(),
        file: file,
        state: "Queued",
        blob: null,
        previewUrl: "",
        outName: lib.outputName(file.name, format()),
        error: "",
      });
      added += 1;
    });

    if (!added && skipped) {
      setStatus("Those files are not .heic / .heif. iPhone photos are the usual input.", "error");
      return;
    }
    if (skipped) {
      setStatus("Added " + added + ", skipped " + skipped + " non-HEIC file(s).");
    }
    render();
    convertQueue();
  }

  async function convertOne(item) {
    var fmt = format();
    item.outName = lib.outputName(item.file.name, fmt);
    item.state = "Converting…";
    item.error = "";
    revokePreview(item);
    render();

    var result = await window.heic2any({
      blob: item.file,
      toType: mimeFor(fmt),
      quality: fmt === "png" ? 1 : quality(),
    });
    var blob = Array.isArray(result) ? result[0] : result;
    if (!blob) throw new Error("Converter returned an empty result.");
    item.blob = blob;
    item.previewUrl = URL.createObjectURL(blob);
    item.state = "Ready · " + lib.formatBytes(blob.size);
  }

  async function convertQueue() {
    if (converting) return;
    if (!checkEnvironment()) return;
    converting = true;
    els.saveAll.disabled = true;
    els.clear.disabled = true;

    var fmt = format();
    var q = Math.round(quality() * 100);
    setStatus(
      "Converting in this tab" +
        (fmt === "jpg" ? " to JPG at " + q + "% quality" : " to PNG") +
        ". Files never leave the device."
    );

    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      try {
        await convertOne(item);
      } catch (err) {
        item.blob = null;
        item.error = err && err.message ? err.message : String(err);
        item.state = "Could not convert — " + item.error;
      }
      render();
    }

    converting = false;
    var ok = items.filter(function (it) { return it.blob; }).length;
    var bad = items.length - ok;
    if (!items.length) {
      setStatus("Drop iPhone .heic / .heif files. Conversion stays in this browser.");
    } else if (bad && ok) {
      setStatus(ok + " ready, " + bad + " failed. Save the ones that converted.", "error");
    } else if (bad) {
      setStatus("Could not convert. Try another iPhone HEIC, or a current Chromium / Firefox / Safari.", "error");
    } else {
      setStatus(ok === 1 ? "Ready. Save as downloads the converted file." : ok + " files ready. Save as each, or save all.");
    }
    render();
  }

  async function saveAll() {
    var ready = items.filter(function (item) { return item.blob; });
    if (!ready.length) return;

    if (ready.length === 1 || typeof window.JSZip !== "function") {
      ready.forEach(function (item) {
        downloadBlob(item.blob, item.outName);
      });
      setStatus(ready.length === 1 ? "Download started." : "Started a download for each file.");
      return;
    }

    setStatus("Packing a zip…");
    try {
      var zip = new window.JSZip();
      var used = Object.create(null);
      ready.forEach(function (item) {
        var name = item.outName;
        if (used[name]) {
          var i = 2;
          var stem = name.replace(/\.(jpg|png)$/i, "");
          var ext = name.slice(stem.length);
          while (used[stem + "-" + i + ext]) i += 1;
          name = stem + "-" + i + ext;
        }
        used[name] = true;
        zip.file(name, item.blob);
      });
      var packed = await zip.generateAsync({ type: "blob" });
      downloadBlob(packed, "heic-save-as.zip");
      setStatus("Zip download started.");
    } catch (err) {
      ready.forEach(function (item) {
        downloadBlob(item.blob, item.outName);
      });
      setStatus("Zip failed, so each file downloaded on its own.", "error");
    }
  }

  function onDrop(event) {
    event.preventDefault();
    els.drop.classList.remove("is-over");
    if (event.dataTransfer && event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  }

  els.drop.addEventListener("click", function () {
    if (!els.picker.disabled) els.picker.click();
  });
  els.drop.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!els.picker.disabled) els.picker.click();
    }
  });
  els.drop.addEventListener("dragover", function (event) {
    event.preventDefault();
    els.drop.classList.add("is-over");
  });
  els.drop.addEventListener("dragleave", function () {
    els.drop.classList.remove("is-over");
  });
  els.drop.addEventListener("drop", onDrop);
  els.picker.addEventListener("change", function (event) {
    addFiles(event.target.files);
    els.picker.value = "";
  });

  document.querySelectorAll('input[name="format"]').forEach(function (input) {
    input.addEventListener("change", function () {
      syncQualityVisibility();
      if (items.length) convertQueue();
    });
  });

  els.quality.addEventListener("input", function () {
    els.qualityValue.textContent = String(els.quality.value);
  });
  els.quality.addEventListener("change", function () {
    if (items.length && format() === "jpg") convertQueue();
  });

  els.saveAll.addEventListener("click", saveAll);
  els.clear.addEventListener("click", function () {
    items.forEach(revokePreview);
    items = [];
    render();
    setStatus("Cleared. Drop iPhone .heic / .heif files when you are ready.");
  });

  window.addEventListener("load", function () {
    syncQualityVisibility();
    render();
    if (checkEnvironment()) {
      setStatus("Drop iPhone .heic / .heif files. Conversion stays in this browser.");
    }
  });
})();
