import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarDate,weekFor,shiftWeek,referenceDate,weekRange,weeklyArchive} from '../src/inspiration/weeks.js';
const item=(id,capturedAt,extra={})=>({id,capturedAt,kind:'reference',...extra});
test('Monday rollover follows Berlin calendar time',()=>{
 assert.equal(weekFor('2026-10-04T21:59:59Z').key,'2026-09-28');
 assert.equal(weekFor('2026-10-04T22:00:00Z').key,'2026-10-05');
 assert.equal(calendarDate('2026-10-05'),'2026-10-05');
});
test('ISO weeks and date ranges remain correct across year boundaries',()=>{
 assert.deepEqual(weekFor('2021-01-01'),{key:'2020-12-28',number:53,year:2020,end:'2021-01-03'});
 assert.equal(weekFor('2026-12-31').number,53);
 assert.equal(weekRange(weekFor('2021-01-01')),'28 Dec 2020 – 3 Jan 2021');
});
test('navigation uses calendar weeks through daylight saving changes',()=>{
 assert.equal(shiftWeek('2026-03-23',1).key,'2026-03-30');
 assert.equal(shiftWeek('2026-10-19',1).key,'2026-10-26');
 assert.equal(shiftWeek('2026-10-26',-1).key,'2026-10-19');
});
test('imported references use original save time, captures use capture time',()=>{
 const ref=item('one','2026-10-05T14:00:00Z',{providerRefs:[{savedAt:'invalid'},{savedAt:'2026-10-01T12:00:00Z'},{savedAt:'2026-10-03T12:00:00Z'}]});
 assert.equal(referenceDate(ref),'2026-10-01');
 assert.equal(referenceDate(item('two','2026-10-05T14:00:00Z')),'2026-10-05');
 assert.equal(referenceDate(item('three',null)),null);
 assert.equal(calendarDate('2026-02-30'),null);
 assert.equal(calendarDate(null),null);
});
test('current Monday is empty with historical imports, archive retains real unique records',()=>{
 const records=[item('one','2026-10-01T12:00:00Z'),item('one','2026-10-01T12:00:00Z'),item('source','2026-10-05T12:00:00Z',{kind:'source'}),item('archive','2026-10-05T12:00:00Z',{archived:true}),item('bad',null)];
 const archive=weeklyArchive(records,'2026-10-05');
 assert.equal(archive.weeks[0].items.length,0);
 assert.equal(archive.groups.get('2026-09-28').length,1);
 assert.equal(archive.weeks.length,4);
 assert.equal(archive.weeks[1].items[0],records[0]);
});
test('metadata sync cannot move a saved reference into the current week',()=>{
 const original=item('one','2026-10-05T12:00:00Z',{providerRefs:[{savedAt:'2026-09-29T12:00:00Z'}]});
 const changed={...original,title:'Changed title',updatedAt:'2026-10-12T12:00:00Z'};
 assert.equal(weeklyArchive([changed],'2026-10-12').groups.get('2026-09-28')[0].id,'one');
});
test('new captures append in capture order and old weeks remain reachable',()=>{
 const records=[item('newer','2026-10-06T12:00:00Z'),item('old','2026-08-03T12:00:00Z'),item('first','2026-10-05T12:00:00Z',{enrichment:'failed'})];
 const archive=weeklyArchive(records,'2026-10-06');
 assert.deepEqual(archive.weeks[0].items.map(i=>i.id),['first','newer']);
 assert.equal(archive.weeks.at(-1).key,'2026-08-03');
 assert.equal(archive.weeks[0].items[0].enrichment,'failed');
});
