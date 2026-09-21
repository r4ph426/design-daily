const TRACKING_PARAMETER = /^(utm_|mc_|ref$|referrer$|source$|fbclid$|gclid$)/i;

export function canonicalArticleUrl(rawUrl = "") {
  try {
    const value = rawUrl.trim();
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(candidate);
    if (!/^https?:$/.test(parsed.protocol)) return "";
    if (!parsed.hostname || (!parsed.hostname.includes(".") && !/^\[.*\]$/.test(parsed.hostname))) return "";
    if (/^(localhost|.+\.localhost)$/i.test(parsed.hostname)) return "";
    if (/^(127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(parsed.hostname)) return "";
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)) return "";
    const host = parsed.hostname.replace(/^\[|\]$/g, "");
    if (host === "::1" || host.startsWith("fd") || host.startsWith("fc") || host.startsWith("fe80:")) return "";

    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMETER.test(key)) parsed.searchParams.delete(key);
    }
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function zonedParts(date, timeZone) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "long",
    }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
}

function calendarDate(parts) {
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

function addCalendarDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function weekday(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" }).format(date);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function nextCrawlInfo(now = new Date(), options = {}) {
  const timeZone = options.timeZone || "Europe/Berlin";
  const crawlHour = options.crawlHour ?? 6;
  const crawlMinute = options.crawlMinute ?? 17;
  const parts = zonedParts(now, timeZone);
  const today = calendarDate(parts);
  const minutesNow = Number(parts.hour) * 60 + Number(parts.minute);
  const crawlMinutes = crawlHour * 60 + crawlMinute;
  let target = today;

  if (["Saturday", "Sunday"].includes(parts.weekday) || minutesNow >= crawlMinutes) {
    target = addCalendarDays(today, 1);
  }
  while (["Saturday", "Sunday"].includes(weekday(target))) {
    target = addCalendarDays(target, 1);
  }

  const differenceDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const targetWeekday = weekday(target);
  const relativeLabel = differenceDays === 0 ? "today" : differenceDays === 1 ? "tomorrow" : targetWeekday;
  const displayDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(target);

  return {
    date: isoDate(target),
    weekday: targetWeekday,
    relativeLabel,
    displayDate,
    scheduledTime: `${String(crawlHour).padStart(2, "0")}:${String(crawlMinute).padStart(2, "0")}`,
    timeZone,
  };
}

export function crawlPossessive(crawl) {
  const label = crawl?.relativeLabel || crawl?.weekday || "next";
  return `${label}${label.endsWith("s") ? "’" : "’s"}`;
}
