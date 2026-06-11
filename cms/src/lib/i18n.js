const STRINGS = {
  zh: {
    site_title: "香港學界桌上遊戲設計比賽決賽暨成果展",
    site_subtitle: "Hong Kong Schools Boardgame Design Competition Final and Project Showcase",
    logout: "登出",
    lang_zh: "中",
    lang_en: "EN",
    game_played: "已玩",
    game_not_played: "未玩",
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
      survey_edit: "修改問卷",
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
      survey_edit: "Edit Survey",
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

module.exports = {
  STRINGS,
  CATEGORY_LABELS,
  normalizeLang,
  t,
  getCategoryLabel
};
