const STRINGS = {
  zh: {
    site_title: "香港學界桌上遊戲設計比賽決賽暨成果展",
    site_subtitle: "Hong Kong Schools Boardgame Design Competition Final and Project Showcase",
    logout: "登出",
    lang_zh: "中",
    lang_en: "EN",
    game_played: "已玩",
    game_not_played: "未玩",
    api: {
      login_required: "請先掃描 QR Code 登入"
    },
    home: {
      title: "參賽作品投票",
      badge: "投票",
      intro: "歡迎所有來賓參與，一同支持學生創意桌上遊戲作品。",
      about_title: "活動簡介",
      about_body:
        "「香港學界桌上遊戲設計比賽決賽暨香港桌遊教學及生涯規劃展 2026」匯聚中學及大專組入圍作品，歡迎來賓親身試玩並投票。",
      how_title: "參與方式",
      step1: "<strong>124B 登記及投票室</strong>：辦理入場登記（投票前必須完成）",
      step2: "<strong>123B / 123C / 124A 展區</strong>：試玩至少 {{min}} 款參賽作品",
      step3: "掃描你的 QR Code，查看進度並填寫問卷投票",
      notice: "須完成登記，並試玩至少 {{min}} 款參賽作品，方可參與投票。建議先到 124B 登記，再前往展區試玩。",
      scan_login: "掃描 QR Code 登入",
      entries_title: "參賽作品"
    },
    u: {
      title: "掃描登入",
      heading: "掃描 QR Code 登入",
      desc: "請使用相機掃描你的 QR Code 以查看個人資料與遊戲進度。",
      camera: "相機掃描",
      start_scan: "開始掃描",
      stop_scan: "關閉鏡頭",
      scan_hint: "按「開始掃描」啟動相機",
      ios_hint: "如 iOS 未授權相機，請到 Safari 設定允許相機。",
      scan_fail: "無法辨識 QR Code 內容，請再試一次。",
      scan_success: "掃描成功，正在登入...",
      invalid_qr: "無效的 QR Code",
      session_save_fail: "登入狀態儲存失敗，請再試一次"
    },
    scanner: {
      align_qr: "請對準 QR Code...",
      lib_load_fail: "掃描程式載入失敗，請重新整理頁面。",
      no_camera: "找不到相機",
      camera_busy: "相機正在啟動中，請稍候再試。",
      iframe_camera_denied: "iframe 內無法使用相機。請按「在新視窗開啟」後再掃描。",
      camera_fail: "相機啟動失敗：{{msg}}",
      iframe_title: "此頁面正在 iframe 內顯示",
      iframe_body: "掃描 QR 需要相機權限。若無法啟動相機，請在新視窗開啟此頁。",
      iframe_open_new: "在新視窗開啟",
      staff_fail: "失敗：{{error}}",
      staff_success: "掃描成功！",
      staff_duplicated: "（此用戶已記錄）"
    },
    survey: {
      title: "問卷投票",
      back: "← 返回我的資料",
      heading: "你喜歡那個遊戲？",
      desc: "可按組別展開，點選喜歡的遊戲。全部組別合共最多可投 {{max}} 票。",
      voted_locked: "你已投票，不能更改。",
      selected_count: "{{count}} 已選",
      selected_summary: "已選 {{count}} / {{max}} 票",
      submit: "提交投票",
      submitting: "提交中...",
      select_at_least_one: "請至少選擇一個遊戲",
      max_votes: "最多只能選擇 {{max}} 票",
      max_votes_alert: "最多只能選擇 {{max}} 票。",
      confirm_under_max: "你選擇不足三票，是否確定要送出？",
      confirm_final: "是否確認選擇？（結果一經送出恕不能更改）",
      submit_fail: "提交失敗：{{error}}",
      already_voted: "你已投票，不能更改。",
      success_title: "投票成功",
      success_body: "你已投票，不能更改。",
      success_back: "返回我的資料"
    },
    profile: {
      title: "我的資料",
      personal: "個人資料",
      profile_error: "無法取得資料：{{error}}",
      name: "姓名",
      company: "公司",
      progress: "進度",
      played_count: "已玩 {{played}} / {{total}}",
      survey_hint: "完成 {{min}} 個遊戲後可填問卷。",
      survey: "問卷",
      survey_not_eligible: "未達資格（需完成 {{min}} 個遊戲）。",
      survey_voted: "已投票（{{count}} 項）",
      survey_locked: "你已投票，不能更改。",
      survey_fill: "填寫問卷",
      played_games: "已玩遊戲"
    }
  },
  en: {
    site_title: "Hong Kong Schools Boardgame Design Competition Final and Project Showcase",
    site_subtitle: "香港學界桌上遊戲設計比賽決賽暨成果展",
    logout: "Log out",
    lang_zh: "中",
    lang_en: "EN",
    game_played: "Played",
    game_not_played: "Not played",
    api: {
      login_required: "Please scan your QR code to sign in first"
    },
    home: {
      title: "Vote for Entries",
      badge: "Voting",
      intro: "All guests are welcome to support students' creative board game projects.",
      about_title: "About the Event",
      about_body:
        "The Hong Kong Schools Boardgame Design Competition Final and Board Game Education & Career Planning Expo 2026 brings together shortlisted secondary and tertiary entries. Guests are invited to try the games and vote.",
      how_title: "How to Participate",
      step1: "<strong>Room 124B Registration & Voting</strong>: Complete check-in (required before voting)",
      step2: "<strong>Rooms 123B / 123C / 124A</strong>: Try at least {{min}} shortlisted games",
      step3: "Scan your QR code to view progress and complete the survey to vote",
      notice:
        "Check-in and playing at least {{min}} games are required to vote. We recommend registering at 124B first, then visiting the exhibition areas.",
      scan_login: "Scan QR Code to Sign In",
      entries_title: "Entries"
    },
    u: {
      title: "Scan to Sign In",
      heading: "Scan QR Code to Sign In",
      desc: "Use your camera to scan your QR code and view your profile and game progress.",
      camera: "Camera Scan",
      start_scan: "Start Scanning",
      stop_scan: "Stop Camera",
      scan_hint: "Tap \"Start Scanning\" to open the camera",
      ios_hint: "If camera access is blocked on iOS, allow camera in Safari settings.",
      scan_fail: "Could not read the QR code. Please try again.",
      scan_success: "Scan successful. Signing in...",
      invalid_qr: "Invalid QR code",
      session_save_fail: "Could not save sign-in state. Please try again."
    },
    scanner: {
      align_qr: "Align with the QR code...",
      lib_load_fail: "Scanner failed to load. Please refresh the page.",
      no_camera: "No camera found",
      camera_busy: "Camera is starting. Please wait and try again.",
      iframe_camera_denied: "Camera is unavailable inside an iframe. Tap \"Open in new window\" to scan.",
      camera_fail: "Failed to start camera: {{msg}}",
      iframe_title: "This page is shown inside an iframe",
      iframe_body: "Scanning requires camera access. If the camera cannot start, open this page in a new window.",
      iframe_open_new: "Open in new window",
      staff_fail: "Failed: {{error}}",
      staff_success: "Scan successful!",
      staff_duplicated: "(Already recorded)"
    },
    survey: {
      title: "Survey & Vote",
      back: "← Back to my profile",
      heading: "Which games do you like?",
      desc: "Expand each group and tap to select your favourites. You may cast up to {{max}} votes in total.",
      voted_locked: "You have already voted. Changes are not allowed.",
      selected_count: "{{count}} selected",
      selected_summary: "{{count}} / {{max}} votes selected",
      submit: "Submit vote",
      submitting: "Submitting...",
      select_at_least_one: "Please select at least one game",
      max_votes: "You can select at most {{max}} votes",
      max_votes_alert: "You can select at most {{max}} votes.",
      confirm_under_max: "You selected fewer than 3 votes. Submit anyway?",
      confirm_final: "Confirm your selection? (Votes cannot be changed once submitted)",
      submit_fail: "Submission failed: {{error}}",
      already_voted: "You have already voted. Changes are not allowed.",
      success_title: "Vote submitted",
      success_body: "You have voted. Changes are not allowed.",
      success_back: "Back to my profile"
    },
    profile: {
      title: "My Profile",
      personal: "Profile",
      profile_error: "Could not load profile: {{error}}",
      name: "Name",
      company: "Company",
      progress: "Progress",
      played_count: "Played {{played}} / {{total}}",
      survey_hint: "Complete {{min}} games to unlock the survey.",
      survey: "Survey",
      survey_not_eligible: "Not eligible yet ({{min}} games required).",
      survey_voted: "Voted ({{count}} selected)",
      survey_locked: "You have voted. Changes are not allowed.",
      survey_fill: "Take Survey",
      played_games: "Games Played"
    }
  }
};

const CATEGORY_LABELS = {
  中學組1: { zh: "中學組1", en: "Secondary Group 1" },
  中學組2: { zh: "中學組2", en: "Secondary Group 2" },
  大專組: { zh: "大專組", en: "Tertiary Group" }
};

function normalizeLang(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "en" || v.startsWith("en-")) return "en";
  if (v === "zh" || v.startsWith("zh")) return "zh";
  return null;
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
}

function interpolate(text, vars) {
  if (!text || !vars) return text;
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ""
  );
}

function t(lang, key, vars) {
  const l = normalizeLang(lang) || "zh";
  const text = getByPath(STRINGS[l], key) ?? getByPath(STRINGS.zh, key) ?? key;
  return interpolate(text, vars);
}

function getCategoryLabel(categoryKey, lang) {
  const l = normalizeLang(lang) || "zh";
  return CATEGORY_LABELS[categoryKey]?.[l] || categoryKey;
}

function getScannerStrings(lang) {
  return {
    alignQr: t(lang, "scanner.align_qr"),
    libLoadFail: t(lang, "scanner.lib_load_fail"),
    noCamera: t(lang, "scanner.no_camera"),
    cameraBusy: t(lang, "scanner.camera_busy"),
    iframeCameraDenied: t(lang, "scanner.iframe_camera_denied"),
    cameraFail: t(lang, "scanner.camera_fail"),
    iframeTitle: t(lang, "scanner.iframe_title"),
    iframeBody: t(lang, "scanner.iframe_body"),
    iframeOpenNew: t(lang, "scanner.iframe_open_new"),
    staffFail: t(lang, "scanner.staff_fail"),
    staffSuccess: t(lang, "scanner.staff_success"),
    staffDuplicated: t(lang, "scanner.staff_duplicated")
  };
}

module.exports = {
  STRINGS,
  CATEGORY_LABELS,
  normalizeLang,
  t,
  getCategoryLabel,
  getScannerStrings
};
