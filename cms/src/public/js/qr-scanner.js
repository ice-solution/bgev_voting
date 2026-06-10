(function () {
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

  function formatCameraError(err) {
    const msg = err && err.message ? err.message : String(err || "");
    if (/already under transition/i.test(msg)) {
      return "相機正在啟動中，請稍候再試。";
    }
    if (isInIframe() && /permission|denied|notallowed|security/i.test(msg)) {
      return "iframe 內無法使用相機。請按「在新視窗開啟」後再掃描。";
    }
    return "相機啟動失敗: " + msg;
  }

  function mountIframeNotice(containerId) {
    if (!isInIframe()) return;
    const el = document.getElementById(containerId);
    if (!el) return;
    el.classList.remove("hidden");
    el.innerHTML =
      '<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">' +
      '<div class="font-medium">此頁面正在 iframe 內顯示</div>' +
      '<p class="mt-1 text-xs leading-relaxed">掃描 QR 需要相機權限。若無法啟動相機，請在新視窗開啟此頁。</p>' +
      '<button type="button" id="btnOpenNewWindow" class="mt-2 w-full rounded-lg bg-[#4a2c1a] px-3 py-2 text-xs font-medium text-white">在新視窗開啟</button>' +
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
      onDecoded
    } = opts;

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
          showMsg("掃描程式載入失敗，請重新整理頁面。", "error");
          return;
        }
        if (!qr) qr = new Html5Qrcode(mountId);
        const devices = await Html5Qrcode.getCameras();
        if (!devices || !devices.length) {
          showMsg("找不到相機", "error");
          return;
        }

        updateScanUi(true);
        showMsg("請對準 QR Code...", "info");
        processing = false;

        const qrboxSize = Math.min(280, Math.floor(window.innerWidth - 64));
        await qr.start(
          devices[0].id,
          { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
          async (decodedText) => {
            if (processing || decoded) return;
            processing = true;
            decoded = true;
            await stopCamera(true);
            await onDecoded(decodedText);
          }
        );
        scanning = true;
      } catch (e) {
        showMsg(formatCameraError(e), "error");
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
