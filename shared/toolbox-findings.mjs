// Findings have their own discovery dates, independent of collection review dates.
const dayMs = 86400000;
export function toolboxFindingWindow(now = new Date()) {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const start = new Date(Date.parse(end + 'T12:00:00Z') - 6 * dayMs).toISOString().slice(0, 10);
  const format = date => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date + 'T12:00:00Z'));
  return { start, end, label: `${format(start)} – ${format(end)}` };
}
export function recentToolboxFindings(data, now = new Date()) {
  const { start, end } = toolboxFindingWindow(now);
  const seen = new Set();
  return (data.findings || data.weeklySignals || [])
    .filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f.foundOn || '') && f.foundOn >= start && f.foundOn <= end)
    .sort((a, b) => b.foundOn.localeCompare(a.foundOn))
    .filter(f => { const key = `${f.title}\n${f.url}`; if (seen.has(key)) return false; seen.add(key); return true; })
    .slice(0, 3).map((f, index) => ({ ...f, id: String(index + 1).padStart(2, '0') }));
}
