import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToolboxEmail,TOOLBOX_EMAIL_COLORS} from '../scripts/lib/toolbox-email.mjs';
import {toolboxEmail,sendToolboxEmail} from '../scripts/lib/toolbox-publication.mjs';
const log={date:'2026-10-07',changes:[{kind:'changed',title:'Changed tool',url:'https://example.com/changed',fields:[{field:'description',before:'Old capability',after:'New capability'}],evidence:'The source supports the new capability.'},{kind:'new',title:'New tool',url:'https://example.com/new',entry:{type:'Skill',description:'New description',recommendation:'Try one screen.',verdict:'Watching',access:'Account',setup:'Install skill'},evidence:'Original source evidence for the new skill.'}],warnings:['One source could not be verified']};
test('HTML preserves before/after, evidence, source checks and provenance while showing new entries first',()=>{
 const html=renderToolboxEmail(log,{commit:'abc',runUrl:'https://github.com/r4ph426/design-daily/actions/runs/123'});
 for(const text of ['Old capability','New capability','Original source evidence','One source could not be verified','Watching','Install skill','commit/abc','runs/123'])assert.ok(html.includes(text));
 assert.ok(html.indexOf('New tool')<html.indexOf('Changed tool'));
 assert.ok(html.includes(TOOLBOX_EMAIL_COLORS.coral));assert.ok(html.includes('role="presentation"'));assert.ok(!/<script|display:grid|display:flex|border-radius|box-shadow/.test(html));
});
test('source content is escaped and executable URL schemes are never linked',()=>{
 const unsafe=structuredClone(log);unsafe.changes[0].title='<img src=x onerror=alert(1)>';unsafe.changes[0].url='javascript:alert(1)';unsafe.changes[0].fields[0].after='</td><script>alert(1)</script>';
 const html=renderToolboxEmail(unsafe);
 assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('href="javascript:'));assert.ok(!html.includes('<script>'));
});
test('failure and no-change states remain honest and retain text rendering',()=>{
 const empty={date:log.date,changes:[],warnings:[]};
 assert.ok(renderToolboxEmail(empty,{status:'unchanged'}).includes('No changes this week.'));
 const failure=renderToolboxEmail(empty,{status:'failed'});assert.ok(failure.includes('A refresh needs attention.'));assert.ok(!failure.includes('Published update'));
 const email=toolboxEmail(log);assert.ok(email.html.startsWith('<!doctype html>'));assert.ok(email.text.includes('Before: Old capability'));assert.ok(email.text.includes('After: New capability'));
});
test('Brevo receives the styled HTML body instead of competing body types',async()=>{
 const message=toolboxEmail(log);
 await sendToolboxEmail(message,{BREVO_API_KEY:'fixture-key',TOOLBOX_EMAIL_FROM:'hello@example.com',TOOLBOX_EMAIL_TO:'one@example.com'},async(url,init)=>{
  const payload=JSON.parse(init.body);assert.equal(payload.htmlContent,message.html);assert.equal(payload.textContent,undefined);assert.ok(!init.body.includes('fixture-key'));
  return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};
 });
});
