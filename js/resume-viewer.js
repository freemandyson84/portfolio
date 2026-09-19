// Renders resume.pdf as a scrollable series of canvases using PDF.js,
// with simple zoom controls. Falls back to a download link on failure.

(function () {
  var url = "resume.pdf";
  var area = document.getElementById("pdf-canvas-area");
  var status = document.getElementById("pdf-status");
  var zoomLevelEl = document.getElementById("zoom-level");
  var pageInfoEl = document.getElementById("page-info");
  var zoomInBtn = document.getElementById("zoom-in");
  var zoomOutBtn = document.getElementById("zoom-out");

  if (!area || typeof pdfjsLib === "undefined") {
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  var scale = 1.2;
  var baseScale = 1.2;
  var pdfDoc = null;

  function setStatus(message, isError) {
    area.innerHTML = "";
    var div = document.createElement("div");
    div.className = "pdf-status" + (isError ? " error" : "");
    div.innerHTML = message;
    area.appendChild(div);
  }

  function renderAllPages() {
    area.innerHTML = "";
    var renderQueue = Promise.resolve();

    var _loop = function (pageNum) {
      renderQueue = renderQueue.then(function () {
        return pdfDoc.getPage(pageNum).then(function (page) {
          var viewport = page.getViewport({ scale: scale });
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          area.appendChild(canvas);

          return page.render({ canvasContext: ctx, viewport: viewport }).promise;
        });
      });
    };

    for (var pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      _loop(pageNum);
    }

    return renderQueue;
  }

  function updateZoomLabel() {
    zoomLevelEl.textContent = Math.round((scale / baseScale) * 100) + "%";
  }

  zoomInBtn.addEventListener("click", function () {
    scale = Math.min(scale + 0.2, baseScale * 2.5);
    updateZoomLabel();
    renderAllPages();
  });

  zoomOutBtn.addEventListener("click", function () {
    scale = Math.max(scale - 0.2, baseScale * 0.5);
    updateZoomLabel();
    renderAllPages();
  });

  pdfjsLib
    .getDocument(url)
    .promise.then(function (doc) {
      pdfDoc = doc;
      pageInfoEl.textContent =
        doc.numPages + (doc.numPages === 1 ? " page" : " pages");
      updateZoomLabel();
      return renderAllPages();
    })
    .catch(function () {
      setStatus(
        'Couldn\'t load the resume preview. <a href="' +
          url +
          '">Download the PDF</a> instead.',
        true
      );
    });
})();