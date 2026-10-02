export const OLDER_QUESTION_BATCH = 20;

export function archiveReadingWindow(records, { now = new Date(), query = "", date = "any", olderCount = 0, selectedIndex = -1 } = {}) {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 29);
  const recentCount = records.filter((record) => new Date(`${record.dateISO}T12:00:00`) >= cutoff).length;
  // A deliberate search or date range retrieves all matches, including older editions.
  const initialCount = query.trim() || date !== "any" ? records.length : Math.max(recentCount, OLDER_QUESTION_BATCH);
  return Math.min(records.length, Math.max(initialCount + olderCount, selectedIndex + 1));
}

// Mobile keeps a bounded list and resolves a shared question to its own page.
export const MOBILE_QUESTION_PAGE_SIZE = 8;
export function mobileArchivePage(records, { page = 1, selectedIndex = -1 } = {}) {
  const pages = Math.max(1, Math.ceil(records.length / MOBILE_QUESTION_PAGE_SIZE));
  const requested = selectedIndex >= 0 ? Math.floor(selectedIndex / MOBILE_QUESTION_PAGE_SIZE) + 1 : Math.floor(Number(page)) || 1;
  const current = Math.min(pages, Math.max(1, requested));
  const start = (current - 1) * MOBILE_QUESTION_PAGE_SIZE;
  return { page: current, pages, start, end: Math.min(records.length, start + MOBILE_QUESTION_PAGE_SIZE), records: records.slice(start, start + MOBILE_QUESTION_PAGE_SIZE) };
}
