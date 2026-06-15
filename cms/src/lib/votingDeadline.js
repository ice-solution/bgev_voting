const { config } = require("./config");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toGmt8Ms(y, mo, d, hh, mm, ss = 0) {
  if (![y, mo, d, hh, mm, ss].every((n) => Number.isFinite(n))) return null;
  return Date.UTC(y, mo - 1, d, hh - 8, mm, ss);
}

function parseGmt8DeadlineParts(dateStr, timeStr) {
  const date = String(dateStr || "").trim();
  const dm = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dm) return null;

  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const timeParts = String(timeStr || "15:00").trim().split(":");
  const hh = Number(timeParts[0] ?? 15);
  const mm = Number(timeParts[1] ?? 0);
  const ss = Number(timeParts[2] ?? 0);
  const deadlineMs = toGmt8Ms(y, mo, d, hh, mm, ss);
  if (deadlineMs == null) return null;

  return {
    date: `${dm[1]}-${dm[2]}-${dm[3]}`,
    time: `${pad2(hh)}:${pad2(mm)}${ss ? `:${pad2(ss)}` : ""}`,
    deadlineMs
  };
}

function parseVoteDeadline(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  // 2026-06-15 15:00 / 2026-06-15T15:00 / 2026-06-15 15:30:00
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return parseGmt8DeadlineParts(`${m[1]}-${m[2]}-${m[3]}`, `${m[4]}:${m[5]}${m[6] ? `:${m[6]}` : ""}`);
  }

  // 只填日期 → 預設 15:00
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return parseGmt8DeadlineParts(s, "15:00");
  }

  return null;
}

function getVoteDeadlineConfig() {
  if (config.voteDeadline) {
    const parsed = parseVoteDeadline(config.voteDeadline);
    if (parsed) {
      return { ...parsed, configured: true, raw: config.voteDeadline };
    }
  }

  // 舊設定相容：VOTE_DEADLINE_DATE + VOTE_DEADLINE_TIME
  if (config.voteDeadlineDate) {
    const parsed = parseGmt8DeadlineParts(config.voteDeadlineDate, config.voteDeadlineTime);
    if (parsed) {
      return { ...parsed, configured: true, raw: `${config.voteDeadlineDate} ${config.voteDeadlineTime}` };
    }
  }

  return {
    configured: false,
    date: "",
    time: "",
    deadlineMs: null,
    raw: ""
  };
}

function isVotingOpen(nowMs = Date.now()) {
  const cfg = getVoteDeadlineConfig();
  if (!cfg.configured || cfg.deadlineMs == null) return true;
  return nowMs < cfg.deadlineMs;
}

function formatDeadlineDate(dateStr, lang) {
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (lang === "en") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d} ${months[mo - 1]} ${y}`;
  }
  return `${y}年${mo}月${d}日`;
}

function getVotingStatus(lang = "zh") {
  const cfg = getVoteDeadlineConfig();
  return {
    open: isVotingOpen(),
    configured: cfg.configured,
    date: cfg.date,
    time: cfg.time,
    dateLabel: cfg.configured ? formatDeadlineDate(cfg.date, lang) : ""
  };
}

module.exports = {
  isVotingOpen,
  getVotingStatus,
  getVoteDeadlineConfig,
  formatDeadlineDate,
  parseVoteDeadline,
  parseGmt8DeadlineParts
};
