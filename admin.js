(function () {
  var bar = document.createElement("div");
  bar.id = "admin-bar";
  var adminLabel = document.createElement("span");
  adminLabel.id = "admin-badge";
  adminLabel.textContent = "ADMIN";
  bar.appendChild(adminLabel);
  document.body.appendChild(bar);

  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "#admin-bar{position:fixed;top:10px;right:12px;z-index:2000;display:flex;gap:6px;align-items:center;font-family:sans-serif}",
    "#admin-badge{background:#d4af37;color:#000;font-weight:700;font-size:11px;letter-spacing:.12em;padding:4px 14px;border-radius:3px;pointer-events:none}",
    ".shelf-svg svg g{cursor:pointer!important}",
    ".shelf-svg svg g:hover{filter:drop-shadow(0 0 4px rgba(212,175,55,.5))}",

    "#adm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:3000;display:none;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px}",
    "#adm-overlay.open{display:flex}",

    "#adm-modal{background:#1a1a1a;border:1px solid #333;border-radius:8px;width:100%;max-width:620px;padding:28px 24px 24px;position:relative;color:#e0e0e0;font-family:sans-serif}",

    ".adm-title{font-family:'Fredericka the Great',serif;color:#d4af37;font-size:1.25rem;margin:0 0 20px;letter-spacing:.08em}",
    ".adm-close{position:absolute;top:10px;right:14px;background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;line-height:1;padding:4px}",
    ".adm-close:hover{color:#fff}",

    ".adm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",

    ".adm-field{margin-bottom:14px}",
    ".adm-field label{display:block;font-size:.78rem;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}",
    ".adm-field input,.adm-field textarea,.adm-field select{width:100%;background:#111;border:1px solid #333;border-radius:4px;padding:8px 10px;color:#e0e0e0;font:inherit;font-size:.9rem;box-sizing:border-box}",
    ".adm-field textarea{min-height:64px;resize:vertical}",
    ".adm-field input:focus,.adm-field textarea:focus,.adm-field select:focus{outline:none;border-color:#d4af37}",

    ".adm-img-section{margin-bottom:18px}",
    ".adm-img-section h3{font-size:.82rem;color:#d4af37;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px}",

    ".adm-main-area{display:flex;gap:14px;align-items:flex-start}",
    ".adm-main-preview{width:140px;height:100px;object-fit:cover;border-radius:4px;background:#222;border:1px solid #333;flex-shrink:0}",
    ".adm-main-controls{display:flex;flex-direction:column;gap:8px}",

    ".adm-page-row{display:flex;gap:10px;align-items:center;margin-bottom:10px;padding:8px;background:#111;border-radius:6px;border:1px solid #222}",
    ".adm-page-num{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#d4af37;color:#000;font-weight:700;font-size:.82rem;border-radius:50%;flex-shrink:0}",
    ".adm-page-preview{width:100px;height:70px;object-fit:cover;border-radius:4px;background:#222;border:1px solid #333;flex-shrink:0}",
    ".adm-page-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}",
    ".adm-page-name{font-size:.8rem;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",

    ".adm-upload-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:#222;border:1px solid #444;border-radius:4px;color:#ccc;font-size:.8rem;cursor:pointer;transition:border-color .15s,color .15s}",
    ".adm-upload-btn:hover{border-color:#d4af37;color:#d4af37}",
    ".adm-upload-btn input{display:none}",

    ".adm-rm-btn{background:none;border:1px solid #555;color:#999;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:.76rem;flex-shrink:0}",
    ".adm-rm-btn:hover{border-color:#c00;color:#c00}",

    ".adm-add-page{background:none;border:1px dashed #444;color:#888;padding:8px 12px;border-radius:4px;cursor:pointer;font-size:.82rem;width:100%;text-align:center;margin-top:4px}",
    ".adm-add-page:hover{border-color:#d4af37;color:#d4af37}",

    ".adm-actions{display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #2a2a2a}",
    ".adm-btn{padding:8px 20px;border:none;border-radius:4px;cursor:pointer;font-size:.86rem;font-weight:600;letter-spacing:.02em}",
    ".adm-btn-save{background:#d4af37;color:#000}",
    ".adm-btn-save:hover{background:#e5c048}",
    ".adm-btn-save:disabled{opacity:.5;cursor:default}",
    ".adm-btn-del{background:none;border:1px solid #c00;color:#c00}",
    ".adm-btn-del:hover{background:#c00;color:#fff}",
    ".adm-btn-cancel{background:none;border:1px solid #444;color:#888}",
    ".adm-btn-cancel:hover{border-color:#888;color:#ccc}",

    ".adm-svg-current{display:flex;gap:10px;margin-bottom:14px;align-items:stretch}",
    ".adm-svg-current-preview{width:40px;flex-shrink:0;background:#181818;border:1px solid #333;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden}",
    ".adm-svg-current-preview svg{width:24px;height:auto}",
    ".adm-svg-current textarea{flex:1;background:#111;border:1px solid #333;border-radius:4px;padding:8px 10px;color:#888;font-family:'Courier New',monospace;font-size:.76rem;resize:vertical;min-height:54px;box-sizing:border-box}",

    ".adm-view-row{display:flex;gap:6px;align-items:center}",
    ".adm-view-row select{flex:1}",
    ".adm-view-new-btn{width:32px;height:32px;background:#222;border:1px solid #d4af37;color:#d4af37;border-radius:4px;cursor:pointer;font-size:1.1rem;font-weight:700;line-height:1;flex-shrink:0;display:flex;align-items:center;justify-content:center}",
    ".adm-view-new-btn:hover{background:#d4af37;color:#000}",

    "#adm-view-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:3500;display:none;align-items:center;justify-content:center;overflow-y:auto;padding:40px 16px}",
    "#adm-view-overlay.open{display:flex}",
    "#adm-view-modal{background:#1a1a1a;border:1px solid #333;border-radius:8px;width:100%;max-width:520px;padding:24px;color:#e0e0e0;font-family:sans-serif}",
    "#adm-view-modal h3{font-family:'Fredericka the Great',serif;color:#d4af37;font-size:1.1rem;margin:0 0 16px;letter-spacing:.08em}",
    ".adm-view-field{margin-bottom:12px}",
    ".adm-view-field label{display:block;font-size:.75rem;color:#888;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em}",
    ".adm-view-field input{width:100%;background:#111;border:1px solid #333;border-radius:4px;padding:8px 10px;color:#e0e0e0;font:inherit;font-size:.9rem;box-sizing:border-box}",
    ".adm-view-field input:focus,.adm-view-field textarea:focus{outline:none;border-color:#d4af37}",
    ".adm-view-field textarea{width:100%;min-height:100px;background:#111;border:1px solid #333;border-radius:4px;padding:8px 10px;color:#e0e0e0;font-family:'Courier New',monospace;font-size:.82rem;resize:vertical;box-sizing:border-box}",
    ".adm-view-hint{font-size:.72rem;color:#666;margin-top:4px}",
    ".adm-view-preview-box{background:#181818;border:1px solid #333;border-radius:4px;height:80px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;overflow:hidden}",
    ".adm-view-preview-box svg{height:60px;width:auto}",
    ".adm-view-actions{display:flex;gap:8px}",
    ".adm-view-status{margin-top:8px;font-size:.78rem;min-height:1em}",
    ".adm-view-status.error{color:#ff4444}",
    ".adm-view-status.ok{color:#4caf50}",

    ".adm-status{margin-top:10px;font-size:.8rem;min-height:1.2em}",
    ".adm-status.error{color:#ff4444}",
    ".adm-status.ok{color:#4caf50}"
  ].join("\n");
  document.head.appendChild(styleEl);

  var overlay = document.createElement("div");
  overlay.id = "adm-overlay";
  overlay.innerHTML = [
    '<div id="adm-modal">',
    '  <button class="adm-close" id="adm-x" type="button">&times;</button>',
    '  <h2 class="adm-title" id="adm-title">Edit Book</h2>',
    '  <div class="adm-row">',
    '    <div class="adm-field"><label for="adm-id">ID</label><input id="adm-id" type="text"/></div>',
    '    <div class="adm-field"><label for="adm-cat">Category</label><input id="adm-cat" type="text"/></div>',
    '  </div>',
    '  <div class="adm-field"><label for="adm-ttl">Title</label><input id="adm-ttl" type="text"/></div>',
    '  <div class="adm-field"><label for="adm-desc">Description</label><textarea id="adm-desc"></textarea></div>',
    '  <div class="adm-field"><label for="adm-view">Book View (SVG Style)</label><div class="adm-view-row"><select id="adm-view"></select><button type="button" class="adm-view-new-btn" id="adm-view-new" title="Create new view">+</button></div></div>',
    '  <div class="adm-svg-current"><div class="adm-svg-current-preview" id="adm-svg-preview"></div><textarea id="adm-svg-code" readonly></textarea></div>',
    '  <div class="adm-img-section">',
    '    <h3>Main Image</h3>',
    '    <div class="adm-main-area">',
    '      <img class="adm-main-preview" id="adm-main-prev" src="" alt=""/>',
    '      <div class="adm-main-controls">',
    '        <label class="adm-upload-btn">Choose file<input id="adm-main-file" type="file" accept="image/*"/></label>',
    '        <span id="adm-main-name" class="adm-page-name">No image</span>',
    '        <button class="adm-rm-btn" id="adm-main-clear" type="button">Clear</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div class="adm-img-section">',
    '    <h3>Page Images</h3>',
    '    <div id="adm-pages"></div>',
    '    <button class="adm-add-page" id="adm-add-page" type="button">+ Add Page</button>',
    '  </div>',
    '  <div class="adm-actions">',
    '    <button class="adm-btn adm-btn-save" id="adm-save" type="button">Save</button>',
    '    <button class="adm-btn adm-btn-del" id="adm-del" type="button">Delete</button>',
    '    <button class="adm-btn adm-btn-cancel" id="adm-cancel" type="button">Cancel</button>',
    '  </div>',
    '  <div class="adm-status" id="adm-status"></div>',
    '</div>'
  ].join("");
  document.body.appendChild(overlay);

  var viewOverlay = document.createElement("div");
  viewOverlay.id = "adm-view-overlay";
  viewOverlay.innerHTML = [
    '<div id="adm-view-modal">',
    '  <h3 id="adm-view-modal-title">New Book View</h3>',
    '  <div class="adm-view-field"><label for="adm-vn">Name</label><input id="adm-vn" type="text" placeholder="e.g. Crimson"/></div>',
    '  <div class="adm-view-field"><label for="adm-vsvg">SVG Template</label><textarea id="adm-vsvg" placeholder="Paste SVG elements here (uses 10×100 coordinate space)"></textarea><div class="adm-view-hint">Coordinate space: width=10, height=100. Use rects, paths, circles etc.</div></div>',
    '  <div class="adm-view-preview-box" id="adm-view-preview"></div>',
    '  <div class="adm-view-actions">',
    '    <button class="adm-btn adm-btn-save" id="adm-view-save" type="button">Save View</button>',
    '    <button class="adm-btn adm-btn-cancel" id="adm-view-cancel" type="button">Cancel</button>',
    '  </div>',
    '  <div class="adm-view-status" id="adm-view-status"></div>',
    '</div>'
  ].join("");
  document.body.appendChild(viewOverlay);

  var el = {
    overlay: overlay,
    title: document.getElementById("adm-title"),
    id: document.getElementById("adm-id"),
    cat: document.getElementById("adm-cat"),
    ttl: document.getElementById("adm-ttl"),
    desc: document.getElementById("adm-desc"),
    view: document.getElementById("adm-view"),
    mainPrev: document.getElementById("adm-main-prev"),
    mainFile: document.getElementById("adm-main-file"),
    mainName: document.getElementById("adm-main-name"),
    mainClear: document.getElementById("adm-main-clear"),
    pages: document.getElementById("adm-pages"),
    addPage: document.getElementById("adm-add-page"),
    saveBtn: document.getElementById("adm-save"),
    delBtn: document.getElementById("adm-del"),
    cancelBtn: document.getElementById("adm-cancel"),
    status: document.getElementById("adm-status"),
    viewNewBtn: document.getElementById("adm-view-new"),
    svgPreview: document.getElementById("adm-svg-preview"),
    svgCode: document.getElementById("adm-svg-code")
  };

  var viewEl = {
    overlay: viewOverlay,
    title: document.getElementById("adm-view-modal-title"),
    name: document.getElementById("adm-vn"),
    svgInput: document.getElementById("adm-vsvg"),
    preview: document.getElementById("adm-view-preview"),
    saveBtn: document.getElementById("adm-view-save"),
    cancelBtn: document.getElementById("adm-view-cancel"),
    status: document.getElementById("adm-view-status")
  };

  var data = null;
  var editOrigId = "";
  var mainImg = { file: null, path: "", blobUrl: "" };
  var pageImgs = [];

  function loadData() {
    return fetch("/api/books-data").then(function (r) { return r.json(); }).then(function (d) {
      data = d;
      populateViewDropdown();
    });
  }

  function populateViewDropdown() {
    var views = (data && Array.isArray(data.bookViews)) ? data.bookViews : [];
    var current = el.view.value;
    el.view.innerHTML = "";
    for (var i = 0; i < views.length; i++) {
      var opt = document.createElement("option");
      opt.value = views[i].id;
      opt.textContent = views[i].name || views[i].id;
      el.view.appendChild(opt);
    }
    if (current && el.view.querySelector('option[value="' + current + '"]')) {
      el.view.value = current;
    }
  }

  function showCurrentViewSvg() {
    var viewId = el.view.value;
    var views = (data && Array.isArray(data.bookViews)) ? data.bookViews : [];
    var found = null;
    for (var i = 0; i < views.length; i++) {
      if (views[i].id === viewId) { found = views[i]; break; }
    }
    var svgStr = found && found.svg ? found.svg : "";
    el.svgCode.value = svgStr;
    if (svgStr) {
      el.svgPreview.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 100">' + svgStr + '</svg>';
    } else {
      el.svgPreview.innerHTML = "";
    }
  }

  el.view.addEventListener("change", showCurrentViewSvg);

  function updateViewPreview() {
    var raw = viewEl.svgInput.value.trim();
    if (!raw) {
      viewEl.preview.innerHTML = "";
      return;
    }
    viewEl.preview.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 100">' + raw + '</svg>';
  }

  function openViewModal() {
    viewEl.title.textContent = "New Book View";
    viewEl.name.value = "";
    viewEl.svgInput.value = "";
    viewEl.status.textContent = "";
    viewEl.status.className = "adm-view-status";
    viewEl.saveBtn.disabled = false;
    updateViewPreview();
    viewOverlay.classList.add("open");
    viewEl.name.focus();
  }

  function closeViewModal() {
    viewOverlay.classList.remove("open");
  }

  function saveNewView() {
    var name = viewEl.name.value.trim();
    var svgContent = viewEl.svgInput.value.trim();
    if (!name) {
      viewEl.status.textContent = "Name is required";
      viewEl.status.className = "adm-view-status error";
      return;
    }
    if (!svgContent) {
      viewEl.status.textContent = "SVG is required";
      viewEl.status.className = "adm-view-status error";
      return;
    }
    var id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id) {
      viewEl.status.textContent = "Invalid name";
      viewEl.status.className = "adm-view-status error";
      return;
    }

    viewEl.saveBtn.disabled = true;
    viewEl.status.textContent = "Saving...";
    viewEl.status.className = "adm-view-status";

    fetch("/api/book-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, name: name, svg: svgContent })
    })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Save failed"); return j; }); })
      .then(function () {
        viewEl.status.textContent = "Saved!";
        viewEl.status.className = "adm-view-status ok";
        return loadData();
      })
      .then(function () {
        el.view.value = id;
        setTimeout(closeViewModal, 400);
      })
      .catch(function (err) {
        viewEl.status.textContent = String(err.message || err);
        viewEl.status.className = "adm-view-status error";
        viewEl.saveBtn.disabled = false;
      });
  }

  viewEl.svgInput.addEventListener("input", updateViewPreview);
  viewEl.saveBtn.addEventListener("click", saveNewView);
  viewEl.cancelBtn.addEventListener("click", closeViewModal);
  viewOverlay.addEventListener("click", function (e) { if (e.target === viewOverlay) closeViewModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && viewOverlay.classList.contains("open")) {
      e.stopPropagation();
      closeViewModal();
    }
  }, true);
  el.viewNewBtn.addEventListener("click", openViewModal);

  function findBook(bookId) {
    if (!data || !Array.isArray(data.categories)) return null;
    for (var c = 0; c < data.categories.length; c++) {
      var cat = data.categories[c];
      if (!Array.isArray(cat.books)) continue;
      for (var b = 0; b < cat.books.length; b++) {
        if (cat.books[b] && cat.books[b].id === bookId) return cat.books[b];
      }
    }
    return null;
  }

  function suggestId(category, slotIndex) {
    if (slotIndex !== undefined && slotIndex !== null) {
      return category + "-" + String(Number(slotIndex) + 1).padStart(3, "0");
    }
    var max = 0;
    if (data && Array.isArray(data.categories)) {
      for (var c = 0; c < data.categories.length; c++) {
        var cat = data.categories[c];
        if (cat.id !== category || !Array.isArray(cat.books)) continue;
        for (var b = 0; b < cat.books.length; b++) {
          var m = cat.books[b].id && cat.books[b].id.match(new RegExp("^" + category + "-(\\d+)$"));
          if (m) max = Math.max(max, parseInt(m[1], 10));
        }
      }
    }
    return category + "-" + String(max + 1).padStart(3, "0");
  }

  function setStatus(msg, type) {
    el.status.textContent = msg;
    el.status.className = "adm-status" + (type ? " " + type : "");
  }

  function resolveImgPath(src) {
    if (!src) return "";
    if (src.startsWith("blob:") || src.startsWith("http") || src.startsWith("/")) return src;
    return "/" + src;
  }

  function showPreview(img, src) {
    var resolved = resolveImgPath(src);
    if (resolved) {
      img.src = resolved;
      img.style.display = "";
    } else {
      img.src = "";
      img.style.display = "none";
    }
  }

  function setMainImage(file, existingPath) {
    if (mainImg.blobUrl) URL.revokeObjectURL(mainImg.blobUrl);
    if (file) {
      var url = URL.createObjectURL(file);
      mainImg = { file: file, path: "", blobUrl: url };
      showPreview(el.mainPrev, url);
      el.mainName.textContent = file.name;
    } else if (existingPath) {
      mainImg = { file: null, path: existingPath, blobUrl: "" };
      showPreview(el.mainPrev, existingPath);
      el.mainName.textContent = existingPath.split("/").pop();
    } else {
      mainImg = { file: null, path: "", blobUrl: "" };
      showPreview(el.mainPrev, "");
      el.mainName.textContent = "No image";
    }
  }

  function renderPages() {
    el.pages.innerHTML = "";
    for (var i = 0; i < pageImgs.length; i++) {
      el.pages.appendChild(createPageRow(i));
    }
  }

  function createPageRow(index) {
    var pg = pageImgs[index];
    var row = document.createElement("div");
    row.className = "adm-page-row";

    var num = document.createElement("span");
    num.className = "adm-page-num";
    num.textContent = String(index + 1);

    var preview = document.createElement("img");
    preview.className = "adm-page-preview";
    var src = pg.blobUrl || resolveImgPath(pg.path) || "";
    if (src) { preview.src = src; } else { preview.style.display = "none"; }
    preview.onerror = function () { this.style.display = "none"; };

    var info = document.createElement("div");
    info.className = "adm-page-info";

    var label = document.createElement("label");
    label.className = "adm-upload-btn";
    label.textContent = pg.file || pg.path ? "Replace" : "Choose file";
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    (function (idx, lbl, prev) {
      fileInput.addEventListener("change", function () {
        if (!this.files || !this.files[0]) return;
        var f = this.files[0];
        if (pageImgs[idx].blobUrl) URL.revokeObjectURL(pageImgs[idx].blobUrl);
        var url = URL.createObjectURL(f);
        pageImgs[idx] = { file: f, path: "", blobUrl: url };
        prev.src = url;
        prev.style.display = "";
        lbl.firstChild.textContent = "Replace";
        var nameEl = lbl.parentElement.querySelector(".adm-page-name");
        if (nameEl) nameEl.textContent = f.name;
      });
    })(index, label, preview);
    label.appendChild(fileInput);

    var nameSpan = document.createElement("span");
    nameSpan.className = "adm-page-name";
    nameSpan.textContent = pg.file ? pg.file.name : (pg.path ? pg.path.split("/").pop() : "Empty slot");

    info.appendChild(label);
    info.appendChild(nameSpan);

    var rm = document.createElement("button");
    rm.className = "adm-rm-btn";
    rm.type = "button";
    rm.textContent = "Remove";
    (function (idx) {
      rm.addEventListener("click", function () {
        if (pageImgs[idx].blobUrl) URL.revokeObjectURL(pageImgs[idx].blobUrl);
        pageImgs.splice(idx, 1);
        renderPages();
      });
    })(index);

    row.appendChild(num);
    row.appendChild(preview);
    row.appendChild(info);
    row.appendChild(rm);
    return row;
  }

  function openModal(book, category, suggestedId) {
    pageImgs.forEach(function (p) { if (p.blobUrl) URL.revokeObjectURL(p.blobUrl); });
    pageImgs = [];

    if (book) {
      editOrigId = book.id;
      el.title.textContent = "Edit Book";
      el.id.value = book.id;
      el.cat.value = book.category || category;
      el.ttl.value = book.title || "";
      el.desc.value = book.description || "";
      el.view.value = book.style || "obsidian";
      showCurrentViewSvg();
      setMainImage(null, book.mainImage || "");
      if (Array.isArray(book.pageImages)) {
        pageImgs = book.pageImages.map(function (p) { return { file: null, path: p, blobUrl: "" }; });
      }
      el.delBtn.style.display = "";
    } else {
      editOrigId = "";
      el.title.textContent = "Create Book";
      el.id.value = suggestedId || (category ? suggestId(category) : "");
      el.cat.value = category || "";
      el.ttl.value = "";
      el.desc.value = "";
      el.view.value = "obsidian";
      showCurrentViewSvg();
      setMainImage(null, "");
      el.delBtn.style.display = "none";
    }

    renderPages();
    setStatus("", "");
    el.saveBtn.disabled = false;
    overlay.classList.add("open");
  }

  function closeModal() {
    overlay.classList.remove("open");
    editOrigId = "";
  }

  function uploadFile(bookId, file, type, index) {
    var form = new FormData();
    form.append("type", type);
    if (index !== undefined) form.append("index", String(index));
    form.append("file", file);
    return fetch("/api/books/" + encodeURIComponent(bookId) + "/upload", {
      method: "POST",
      body: form
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Upload failed"); return j; }); });
  }

  function saveBook() {
    var bookId = el.id.value.trim();
    var title = el.ttl.value.trim();
    var category = el.cat.value.trim();
    var description = el.desc.value.trim();

    if (!bookId) { setStatus("ID is required", "error"); return; }
    if (!title) { setStatus("Title is required", "error"); return; }
    if (!category) { setStatus("Category is required", "error"); return; }

    el.saveBtn.disabled = true;
    setStatus("Uploading images...", "");

    var uploads = [];

    if (mainImg.file) {
      uploads.push(
        uploadFile(bookId, mainImg.file, "main").then(function (r) { mainImg.path = r.path; })
      );
    }

    pageImgs.forEach(function (pg, i) {
      if (pg.file) {
        uploads.push(
          uploadFile(bookId, pg.file, "page", i + 1).then(function (r) { pg.path = r.path; })
        );
      }
    });

    Promise.all(uploads).then(function () {
      setStatus("Saving book data...", "");

      var mainImagePath = mainImg.path || "";
      var pageImagePaths = pageImgs.map(function (pg) { return pg.path; }).filter(Boolean);

      var payload = {
        id: bookId,
        title: title,
        category: category,
        description: description,
        style: el.view.value,
        mainImage: mainImagePath,
        pageImages: pageImagePaths
      };

      var isEdit = Boolean(editOrigId);
      var url = isEdit ? "/api/books/" + encodeURIComponent(editOrigId) : "/api/books";
      var method = isEdit ? "PUT" : "POST";

      return fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || "Save failed");
          return j;
        });
      });
    }).then(function () {
      setStatus("Saved!", "ok");
      loadData();
      renderShelves();
      setTimeout(closeModal, 500);
    }).catch(function (err) {
      setStatus(String(err.message || err), "error");
      el.saveBtn.disabled = false;
    });
  }

  function deleteBook() {
    if (!editOrigId) return;
    if (!confirm('Delete book "' + editOrigId + '"?')) return;

    setStatus("Deleting...", "");
    fetch("/api/books/" + encodeURIComponent(editOrigId), { method: "DELETE" })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Delete failed"); return j; }); })
      .then(function () {
        setStatus("Deleted!", "ok");
        loadData();
        renderShelves();
        setTimeout(closeModal, 500);
      })
      .catch(function (err) { setStatus(String(err.message || err), "error"); });
  }

  document.getElementById("adm-x").addEventListener("click", closeModal);
  el.cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      e.stopPropagation();
      closeModal();
    }
  }, true);

  el.mainFile.addEventListener("change", function () {
    if (this.files && this.files[0]) setMainImage(this.files[0], "");
  });

  el.mainClear.addEventListener("click", function () {
    setMainImage(null, "");
    el.mainFile.value = "";
  });

  el.addPage.addEventListener("click", function () {
    var bookId = el.id.value.trim();
    var idx = pageImgs.length + 1;
    var defaultPath = bookId ? "assets/" + bookId + ".page." + idx + ".png" : "";
    pageImgs.push({ file: null, path: defaultPath, blobUrl: "" });
    renderPages();
  });

  el.saveBtn.addEventListener("click", saveBook);
  el.delBtn.addEventListener("click", deleteBook);

  function onShelfSvgClick(e, category) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();

    var bookTarget = e.target.closest("[data-book-id]");
    var bookId = bookTarget ? bookTarget.getAttribute("data-book-id") : null;

    var ready = data ? Promise.resolve() : loadData();
    ready.then(function () {
      openModal(bookId ? findBook(bookId) : null, category, bookId);
    });
  }

  function attachSvgHandlers() {
    document.querySelectorAll(".shelf-card").forEach(function (card) {
      var category = card.dataset.categoryKey || "";
      card.querySelectorAll("svg").forEach(function (svg) {
        if (svg._admBound) return;
        svg._admBound = true;
        svg.addEventListener("click", function (e) { onShelfSvgClick(e, category); }, true);
      });
      if (!card._admFallback) {
        card._admFallback = true;
        card.addEventListener("click", function (e) {
          if (e.target.closest("svg")) return;
          e.stopPropagation();
          e.preventDefault();
          var ready = data ? Promise.resolve() : loadData();
          ready.then(function () { openModal(null, category); });
        });
      }
    });
  }

  var shelvesEl = document.getElementById("shelves");
  new MutationObserver(function () { setTimeout(attachSvgHandlers, 60); }).observe(shelvesEl, { childList: true, subtree: true });
  setTimeout(attachSvgHandlers, 300);

  loadData();
})();

(function () {
  var mainStyle = document.createElement("style");
  mainStyle.textContent = [
    ".admin-top-btn{background:#1a1a2e;border:1px solid #4a9eff;color:#4a9eff;font-size:11px;padding:4px 10px;border-radius:3px;cursor:pointer;font-family:sans-serif;letter-spacing:.06em;transition:background .15s,color .15s}",
    ".admin-top-btn:hover{background:#4a9eff;color:#fff}",
    "#adm-text-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:3000;display:none;align-items:center;justify-content:center}",
    "#adm-text-overlay.open{display:flex}",
    "#adm-text-modal{background:#1a1a1a;border:1px solid #333;border-radius:8px;width:100%;max-width:540px;padding:28px 24px 24px;position:relative;color:#e0e0e0;font-family:sans-serif}",
    "#adm-text-modal h2{font-family:'Fredericka the Great',serif;color:#4a9eff;font-size:1.25rem;margin:0 0 16px;letter-spacing:.08em}",
    "#adm-text-modal textarea{width:100%;min-height:120px;background:#111;border:1px solid #333;border-radius:4px;padding:10px;color:#e0e0e0;font:inherit;font-size:.95rem;resize:vertical;box-sizing:border-box}",
    "#adm-text-modal textarea:focus{outline:none;border-color:#4a9eff}",
    ".adm-text-actions{display:flex;gap:10px;margin-top:16px}",
    ".adm-text-btn-save{padding:8px 20px;border:none;border-radius:4px;cursor:pointer;font-size:.86rem;font-weight:600;background:#4a9eff;color:#fff}",
    ".adm-text-btn-save:hover{background:#3a8eef}",
    ".adm-text-btn-cancel{padding:8px 20px;border:1px solid #444;border-radius:4px;cursor:pointer;font-size:.86rem;background:none;color:#888}",
    ".adm-text-btn-cancel:hover{border-color:#888;color:#ccc}",
    ".adm-text-status{margin-top:10px;font-size:.8rem;min-height:1.2em}",
    ".adm-text-status.ok{color:#4caf50}",
    ".adm-text-status.error{color:#ff4444}"
  ].join("\n");
  document.head.appendChild(mainStyle);

  var textOverlay = document.createElement("div");
  textOverlay.id = "adm-text-overlay";
  textOverlay.innerHTML = [
    '<div id="adm-text-modal">',
    '  <h2 id="adm-text-title">Edit Text</h2>',
    '  <textarea id="adm-text-input"></textarea>',
    '  <div class="adm-text-actions">',
    '    <button class="adm-text-btn-save" id="adm-text-save" type="button">Save</button>',
    '    <button class="adm-text-btn-cancel" id="adm-text-cancel" type="button">Cancel</button>',
    '  </div>',
    '  <div class="adm-text-status" id="adm-text-status"></div>',
    '</div>'
  ].join("");
  document.body.appendChild(textOverlay);

  var textInput = document.getElementById("adm-text-input");
  var textSaveBtn = document.getElementById("adm-text-save");
  var textCancelBtn = document.getElementById("adm-text-cancel");
  var textTitle = document.getElementById("adm-text-title");
  var textStatusEl = document.getElementById("adm-text-status");
  var textCallback = null;

  function openTextEdit(title, currentValue, cb) {
    textTitle.textContent = title;
    textInput.value = currentValue;
    textCallback = cb;
    textStatusEl.textContent = "";
    textStatusEl.className = "adm-text-status";
    textOverlay.classList.add("open");
    textInput.focus();
  }

  function closeTextEdit() {
    textOverlay.classList.remove("open");
    textCallback = null;
  }

  textSaveBtn.addEventListener("click", function () {
    if (textCallback) textCallback(textInput.value);
  });
  textCancelBtn.addEventListener("click", closeTextEdit);
  textOverlay.addEventListener("click", function (e) {
    if (e.target === textOverlay) closeTextEdit();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && textOverlay.classList.contains("open")) {
      e.stopPropagation();
      closeTextEdit();
    }
  }, true);

  var fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  var fileCb = null;

  var pdfInput = document.createElement("input");
  pdfInput.type = "file";
  pdfInput.accept = "application/pdf,.pdf";
  pdfInput.style.display = "none";
  document.body.appendChild(pdfInput);
  var pdfCb = null;

  fileInput.addEventListener("change", function () {
    if (this.files && this.files[0] && fileCb) fileCb(this.files[0]);
    this.value = "";
  });

  pdfInput.addEventListener("change", function () {
    if (this.files && this.files[0] && pdfCb) pdfCb(this.files[0]);
    this.value = "";
  });

  function openFilePicker(cb) {
    fileCb = cb;
    fileInput.click();
  }

  function openPdfPicker(cb) {
    pdfCb = cb;
    pdfInput.click();
  }

  function uploadMainImage(field, file, onDone) {
    var form = new FormData();
    form.append("file", file);
    fetch("/api/main/upload/" + encodeURIComponent(field), { method: "POST", body: form })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) onDone(d.path);
      })
      .catch(function () {});
  }

  function updateMainField(field, value, onDone) {
    var body = {};
    body[field] = value;
    fetch("/api/main-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok && onDone) onDone();
      })
      .catch(function () {});
  }

  function uploadCvFile(file, onDone) {
    var form = new FormData();
    form.append("file", file);
    fetch("/api/main/upload-cv", { method: "POST", body: form })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Upload failed"); return d; }); })
      .then(function (d) {
        if (d.ok && onDone) onDone(d.path);
      })
      .catch(function () {});
  }

  function updateCategoryTitle(catId, newTitle, onDone) {
    fetch("/api/categories/" + encodeURIComponent(catId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok && onDone) onDone();
      })
      .catch(function () {});
  }

  function toWhatsappHref(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.indexOf("http://") === 0 || raw.indexOf("https://") === 0) return raw;
    var digits = raw.replace(/\D/g, "");
    return digits ? ("https://wa.me/" + digits) : raw;
  }

  var headerImg = document.querySelector(".hero-header");
  var logo = document.querySelector(".floor-logo-left");
  var floorImg = document.getElementById("floor");
  var tattooOverlay = document.querySelector(".tattoo-overlay");
  var defaultPanel = document.querySelector(".default-panel");
  var descriptions = defaultPanel ? defaultPanel.querySelectorAll(".contacts-description") : [];
  var connectPanel = document.querySelector(".connect-panel");
  var contactLinks = connectPanel ? connectPanel.querySelectorAll(".contact-link") : [];
  var cvButton = connectPanel ? connectPanel.querySelector(".download-cv") : null;
  var socialLinks = connectPanel ? connectPanel.querySelectorAll(".social-icon") : [];

  if (cvButton) {
    cvButton.textContent = "Update CV";
  }

  var adminBar = document.getElementById("admin-bar");
  function makeAdminBtn(label, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-top-btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  if (adminBar) {
    adminBar.appendChild(makeAdminBtn("ACTION PHOTO", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openFilePicker(function (file) {
        uploadMainImage("tattooOverlay", file, function (p) {
          if (tattooOverlay) tattooOverlay.src = "/" + p;
        });
      });
    }));
    adminBar.appendChild(makeAdminBtn("HEADER", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openFilePicker(function (file) {
        uploadMainImage("headerImage", file, function (p) {
          if (headerImg) headerImg.src = "/" + p;
        });
      });
    }));
    adminBar.appendChild(makeAdminBtn("LOGO", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openFilePicker(function (file) {
        uploadMainImage("logo", file, function (p) {
          if (logo) logo.src = "/" + p;
        });
      });
    }));
    adminBar.appendChild(makeAdminBtn("FLOOR", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openFilePicker(function (file) {
        uploadMainImage("footerImage", file, function (p) {
          if (floorImg) floorImg.src = "/" + p;
        });
      });
    }));
  }

  if (descriptions[0]) {
    descriptions[0].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openTextEdit("Edit Description", descriptions[0].textContent.trim(), function (val) {
        updateMainField("description", val.trim(), function () {
          descriptions[0].textContent = val.trim();
          closeTextEdit();
        });
      });
    });
  }

  if (descriptions[1]) {
    descriptions[1].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openTextEdit("Edit Description 2", descriptions[1].textContent.trim(), function (val) {
        updateMainField("description2", val.trim(), function () {
          descriptions[1].textContent = val.trim();
          closeTextEdit();
        });
      });
    });
  }

  if (contactLinks[0]) {
    contactLinks[0].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var currentEmail = contactLinks[0].textContent.trim();
      openTextEdit("Edit Email", currentEmail, function (val) {
        var nextEmail = val.trim();
        updateMainField("email", nextEmail, function () {
          contactLinks[0].textContent = nextEmail;
          contactLinks[0].href = "mailto:" + nextEmail;
          closeTextEdit();
        });
      });
    });
  }

  if (contactLinks[1]) {
    contactLinks[1].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var currentWhatsapp = contactLinks[1].textContent.trim();
      openTextEdit("Edit WhatsApp Number", currentWhatsapp, function (val) {
        var nextWhatsapp = val.trim();
        updateMainField("whatsapp", nextWhatsapp, function () {
          contactLinks[1].textContent = nextWhatsapp;
          contactLinks[1].href = toWhatsappHref(nextWhatsapp);
          closeTextEdit();
        });
      });
    });
  }

  if (cvButton) {
    cvButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPdfPicker(function (file) {
        uploadCvFile(file, function (path) {
          cvButton.setAttribute("href", "/" + path + "?v=" + Date.now());
          cvButton.textContent = "Update CV";
        });
      });
    });
  }

  if (socialLinks[0]) {
    socialLinks[0].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var currentInstagram = socialLinks[0].getAttribute("href") || "";
      openTextEdit("Edit Instagram Link", currentInstagram, function (val) {
        var nextInstagram = val.trim();
        updateMainField("instagram", nextInstagram, function () {
          socialLinks[0].setAttribute("href", nextInstagram);
          closeTextEdit();
        });
      });
    });
  }

  if (socialLinks[1]) {
    socialLinks[1].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var currentSocial1 = socialLinks[1].getAttribute("href") || "";
      openTextEdit("Edit Social Link 1", currentSocial1, function (val) {
        var nextSocial1 = val.trim();
        updateMainField("socialLink1", nextSocial1, function () {
          socialLinks[1].setAttribute("href", nextSocial1);
          closeTextEdit();
        });
      });
    });
  }

  if (socialLinks[2]) {
    socialLinks[2].addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var currentSocial2 = socialLinks[2].getAttribute("href") || "";
      openTextEdit("Edit Social Link 2", currentSocial2, function (val) {
        var nextSocial2 = val.trim();
        updateMainField("socialLink2", nextSocial2, function () {
          socialLinks[2].setAttribute("href", nextSocial2);
          closeTextEdit();
        });
      });
    });
  }

  var headerSectionsEl = document.getElementById("header-sections");
  if (headerSectionsEl) {
    headerSectionsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".header-section-title");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var catKey = btn.dataset.categoryKey;
      var currentTitle = btn.textContent.trim();
      openTextEdit("Edit Section Title", currentTitle, function (val) {
        var newTitle = val.trim();
        if (!newTitle) return;
        updateCategoryTitle(catKey, newTitle, function () {
          btn.textContent = newTitle;
          closeTextEdit();
        });
      });
    });

  }
})();
