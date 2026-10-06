const DAY = 86400000;
const berlin = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'});
export function calendarDate(value = new Date()) {
  if (value === null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(+date) && date.toISOString().slice(0,10) === value ? value : null;
  }
  const date = new Date(value);
  if (!Number.isFinite(+date)) return null;
  const parts = Object.fromEntries(berlin.formatToParts(date).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function weekFor(value = new Date()) {
  const key = calendarDate(value);
  if (!key) return null;
  const monday = new Date(`${key}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay()+6)%7);
  const thursday = new Date(+monday+3*DAY);
  const year = thursday.getUTCFullYear();
  const january = new Date(Date.UTC(year,0,4,12));
  january.setUTCDate(january.getUTCDate() - (january.getUTCDay()+6)%7);
  return {key:monday.toISOString().slice(0,10),number:1+Math.round((monday-january)/(7*DAY)),year,end:new Date(+monday+6*DAY).toISOString().slice(0,10)};
}
export function shiftWeek(key, direction) { return weekFor(new Date(+new Date(`${key}T12:00:00Z`)+direction*7*DAY)); }
export function referenceDate(item) {
  const imported = (item.providerRefs||[]).map(p=>p.savedAt).filter(value=>value && Number.isFinite(Date.parse(value))).sort((a,b)=>Date.parse(a)-Date.parse(b))[0];
  const value = item.inspirationDate || imported || item.capturedAt;
  return value ? calendarDate(value) : null;
}
export function weekRange(week, includeYear=true) {
  const format = date=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
  const startYear=week.key.slice(0,4), endYear=week.end.slice(0,4);
  return `${format(week.key)}${includeYear&&startYear!==endYear?` ${startYear}`:''} – ${format(week.end)}${includeYear?` ${endYear}`:''}`;
}
export function weeklyArchive(items, today=new Date()) {
  const current=weekFor(today);
  if (!current) throw new RangeError('A valid calendar date is required.');
  const references=items.filter(i=>i.kind!=='source'&&!i.archived);
  const groups=new Map();
  const seen=new Set();
  for (const item of references) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const date=referenceDate(item); if(!date)continue;
    const week=weekFor(date); if(!week)continue;
    if(!groups.has(week.key))groups.set(week.key,[]);
    groups.get(week.key).push(item);
  }
  for(const group of groups.values())group.sort((a,b)=>referenceDate(a).localeCompare(referenceDate(b))||(a.capturedAt||'').localeCompare(b.capturedAt||'')||a.id.localeCompare(b.id));
  const oldest=[...groups.keys()].filter(key=>key<=current.key).sort()[0]||current.key;
  const weeks=[];
  let week=current;
  while(week.key>=oldest || weeks.length<4) { weeks.push({...week,items:groups.get(week.key)||[]});week=shiftWeek(week.key,-1); }
  return {current,weeks,groups};
}
