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
