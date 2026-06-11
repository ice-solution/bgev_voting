(function () {
  const DEFAULT_I18N = {
    alignQr: "請對準 QR Code...",
    libLoadFail: "掃描程式載入失敗，請重新整理頁面。",
    noCamera: "找不到相機",
    cameraBusy: "相機正在啟動中，請稍候再試。",
    iframeCameraDenied: "iframe 內無法使用相機。請按「在新視窗開啟」後再掃描。",
    cameraFail: "相機啟動失敗：{{msg}}",
    iframeTitle: "此頁面正在 iframe 內顯示",
    iframeBody: "掃描 QR 需要相機權限。若無法啟動相機，請在新視窗開啟此頁。",
    iframeOpenNew: "在新視窗開啟"
  };

  function mergeI18n(custom) {
    return { ...DEFAULT_I18N, ...(custom || {}) };
  }

  function fillTemplate(text, vars) {
    if (!text) return "";
    return String(text).replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars && vars[key] != null ? String(vars[key]) : ""
    );
  }

  function isInIframe() {
    try {
      return window.self !== window.top;
    } catch (_) {
      return true;
    }
  }

  function openInNewWindow() {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  }

  function formatCameraError(err, i18n) {
    const msg = err && err.message ? err.message : String(err || "");
    if (/already under transition/i.test(msg)) {
      return i18n.cameraBusy;
    }
    if (isInIframe() && /permission|denied|notallowed|security/i.test(msg)) {
      return i18n.iframeCameraDenied;
    }
    return fillTemplate(i18n.cameraFail, { msg });
  }

  function pickBackCameraId(devices) {
    if (!devices || !devices.length) return null;
    const backPattern = /back|rear|environment|後置|背面/i;
    const frontPattern = /front|user|selfie|facetime|前置|前面/i;
    const back = devices.find((d) => backPattern.test(d.label || ""));
    if (back) return back.id;
    const notFront = devices.find((d) => !frontPattern.test(d.label || ""));
    if (notFront) return notFront.id;
    return devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
  }

  function mountIframeNotice(containerId, i18n) {
    const labels = mergeI18n(i18n);
    if (!isInIframe()) return;
    const el = document.getElementById(containerId);
    if (!el) return;
    el.classList.remove("hidden");
    el.innerHTML =
      '<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">' +
      '<div class="font-medium">' + labels.iframeTitle + "</div>" +
      '<p class="mt-1 text-xs leading-relaxed">' + labels.iframeBody + "</p>" +
      '<button type="button" id="btnOpenNewWindow" class="mt-2 w-full rounded-lg bg-[#4a2c1a] px-3 py-2 text-xs font-medium text-white">' +
      labels.iframeOpenNew +
      "</button>" +
      "</div>";
    const btn = document.getElementById("btnOpenNewWindow");
    if (btn) btn.addEventListener("click", openInNewWindow);
  }

  function createScanner(opts) {
    const {
      mountId,
      btnStart,
      btnStop,
      qrWrap,
      scanHint,
      showMsg,
      onDecoded,
      i18n: customI18n
    } = opts;
    const i18n = mergeI18n(customI18n);

    let qr = null;
    let scanning = false;
    let processing = false;
    let busy = false;
    let decoded = false;

    function updateScanUi(active) {
      if (btnStart) btnStart.classList.toggle("hidden", active);
      if (btnStop) btnStop.classList.toggle("hidden", !active);
      if (qrWrap) qrWrap.classList.toggle("hidden", !active);
      if (scanHint) scanHint.classList.toggle("hidden", active);
    }

    function setButtonsLocked(locked) {
      if (btnStart && !scanning) {
        btnStart.disabled = locked;
        btnStart.classList.toggle("opacity-50", locked);
        btnStart.classList.toggle("pointer-events-none", locked);
      }
      if (btnStop) {
        btnStop.disabled = locked;
        btnStop.classList.toggle("opacity-50", locked);
        btnStop.classList.toggle("pointer-events-none", locked);
      }
    }

    async function stopCamera(keepProcessing) {
      setButtonsLocked(true);
      if (qr) {
        try {
          await qr.stop();
          qr.clear();
        } catch (_) {}
      }
      scanning = false;
      if (!keepProcessing) processing = false;
      busy = false;
      updateScanUi(false);
      setButtonsLocked(false);
    }

    async function startCamera() {
      if (busy || scanning) return;
      busy = true;
      setButtonsLocked(true);

      try {
        if (typeof Html5Qrcode === "undefined") {
          showMsg(i18n.libLoadFail, "error");
          return;
        }
        if (!qr) qr = new Html5Qrcode(mountId);

        updateScanUi(true);
        showMsg(i18n.alignQr, "info");
        processing = false;

        const qrboxSize = Math.min(280, Math.floor(window.innerWidth - 64));
        const scanConfig = { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } };
        const onScan = async (decodedText) => {
          if (processing || decoded) return;
          processing = true;
          decoded = true;
          await stopCamera(true);
          await onDecoded(decodedText);
        };

        try {
          await qr.start({ facingMode: "environment" }, scanConfig, onScan);
        } catch (_) {
          const devices = await Html5Qrcode.getCameras();
          const cameraId = pickBackCameraId(devices);
          if (!cameraId) {
            showMsg(i18n.noCamera, "error");
            return;
          }
          await qr.start(cameraId, scanConfig, onScan);
        }
        scanning = true;
      } catch (e) {
        showMsg(formatCameraError(e, i18n), "error");
        scanning = false;
        processing = false;
        updateScanUi(false);
        if (qr) {
          try {
            await qr.stop();
            qr.clear();
          } catch (_) {}
        }
      } finally {
        busy = false;
        setButtonsLocked(false);
      }
    }

    if (btnStop) {
      btnStop.addEventListener("click", async () => {
        await stopCamera();
      });
    }
    if (btnStart) {
      btnStart.addEventListener("click", startCamera);
    }

    return { startCamera, stopCamera };
  }

  window.QrScanner = {
    isInIframe,
    openInNewWindow,
    formatCameraError,
    mountIframeNotice,
    createScanner
  };
})();
