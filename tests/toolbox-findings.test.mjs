import test from 'node:test';
import assert from 'node:assert/strict';
import {recentToolboxFindings,toolboxFindingWindow} from '../shared/toolbox-findings.mjs';
const now = new Date('2026-10-08T12:00:00Z');
const finding=(title,foundOn)=>({title,foundOn,url:`https://example.com/${title}`});
test('seven Berlin calendar days include both boundaries and exclude future, old and undated findings',()=>{
 const findings=[finding('old','2026-10-01'),finding('first','2026-10-02'),finding('last','2026-10-08'),finding('future','2026-10-09'),finding('undated',undefined)];
 assert.deepEqual(recentToolboxFindings({findings},now).map(f=>f.title),['last','first']);
 assert.equal(recentToolboxFindings({findings},new Date('2026-10-16T12:00:00Z')).length,0);
});
test('same-day editorial order remains stable, with at most three unique tools',()=>{
 const first=finding('first','2026-10-07');
 const findings=[first,{...first},finding('second','2026-10-07'),finding('third','2026-10-07'),finding('fourth','2026-10-07')];
 assert.deepEqual(recentToolboxFindings({findings},now).map(f=>[f.title,f.id]),[['first','01'],['second','02'],['third','03']]);
});
test('the date window follows Berlin midnight, including daylight-saving offsets',()=>{
 assert.equal(toolboxFindingWindow(new Date('2026-10-07T22:30:00Z')).end,'2026-10-08');
 assert.equal(toolboxFindingWindow(new Date('2026-10-26T23:30:00Z')).end,'2026-10-27');
});

test('distinct findings can share the same release-notes source',()=>{
 const findings=[{...finding('Agent','2026-10-07'),url:'https://example.com/releases'},{...finding('Motion','2026-10-07'),url:'https://example.com/releases'}];
 assert.equal(recentToolboxFindings({findings},now).length,2);
});
