import test from 'node:test';
import assert from 'node:assert/strict';
import {applyToolboxReview,toolboxEmail,sendToolboxEmail} from '../scripts/lib/toolbox-publication.mjs';

const tool={id:'01',title:'Test skill',type:'Skill',categories:['UI'],practices:['Review'],description:'Design checks.',recommendation:'Inspect one screen.',access:'Open source',setup:'Install the skill',verdict:'Best practice',confidence:'High',reviewed:'28 Sep 2026',source:'example.com',url:'https://example.com/skill'};
const before={weekLabel:'Week 40',weeklySignals:[{id:'01',title:tool.title,url:tool.url,summary:tool.recommendation,verdict:tool.verdict,source:tool.source}],tools:[tool]};
const evidence='The skill now supports keyboard navigation checks.';
const sources=[{id:'source-1',url:tool.url,text:evidence},{id:'source-2',url:'https://example.com/new',text:evidence}];
const proposal={sourceId:'source-1',evidence,...tool,description:'Design and keyboard checks.'};
const now=new Date('2026-10-12T03:00:00Z');
test('automatic updates preserve editorial verdicts, IDs and URLs and record before/after fields',()=>{
 const r=applyToolboxReview(before,{proposals:[{...proposal,verdict:'Useful now',id:'hacked',url:'https://attacker.example'}]},sources,now);
 assert.equal(r.after.tools[0].verdict,'Best practice');assert.equal(r.after.tools[0].id,'01');assert.equal(r.after.tools[0].url,tool.url);
 assert.equal(r.changes[0].fields[0].before,tool.description);assert.equal(r.changes[0].fields[0].after,proposal.description);assert.match(r.after.weekLabel,/Week 42/);
 assert.deepEqual(before.tools[0],tool);
});
test('new entries default to Watching, use stable identities and do not duplicate on re-review',()=>{
 const p={...proposal,sourceId:'source-2',title:'New skill',verdict:'Best practice'};
 const r=applyToolboxReview(before,{proposals:[p]},sources,now);const added=r.after.tools[1];assert.equal(added.verdict,'Watching');assert.match(added.recommendation,/not yet team-tested/);
 const again=applyToolboxReview(r.after,{proposals:[{...p,recommendation:added.recommendation}]},sources,now);
 assert.equal(again.after.tools.length,2);assert.equal(again.changes.length,0);assert.equal(again.after.tools[1].id,added.id);
});
test('missing evidence, hallucinated source IDs, repeated sources and invalid taxonomy block publication',()=>{
 for(const proposals of [[{...proposal,evidence:'invented text that was not fetched'}],[{...proposal,sourceId:'unknown'}],[proposal,proposal],[{...proposal,sourceId:'source-2',type:'Other'}]])assert.throws(()=>applyToolboxReview(before,{proposals},sources,now));
});
test('a no-op does not pretend existing data was freshly reviewed',()=>{
 assert.deepEqual(applyToolboxReview(before,{proposals:[]},sources,now).after,before);
});
test('email includes source, before/after and correction links; no-change and failure logs are honest',()=>{
 const changes=applyToolboxReview(before,{proposals:[proposal]},sources,now).changes;
 const m=toolboxEmail({date:'2026-10-12',changes,warnings:['A source was unavailable']},{commit:'abc'});
 assert.match(m.text,/Before: Design checks/);assert.match(m.text,/After: Design and keyboard/);assert.match(m.text,/CHECK:/);assert.match(m.text,/commit\/abc/);
 assert.match(toolboxEmail({date:'today',changes:[]},{status:'unchanged'}).text,/no material changes/);
 assert.match(toolboxEmail({date:'today',changes:[]},{status:'failed'}).subject,/failed/);
});
test('email delivers to both configured recipients with stable idempotency and never leaks provider errors',async()=>{
 const env={RESEND_API_KEY:'secret-fixture',TOOLBOX_EMAIL_FROM:'Toolbox <sender@example.com>',TOOLBOX_EMAIL_TO:'one@example.com,two@example.com'},calls=[];
 const request=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>({id:'email-fixture'})};};
 const message={subject:'Monday update',text:'Change log'};
 await sendToolboxEmail(message,env,request);await sendToolboxEmail(message,env,request);
 assert.deepEqual(JSON.parse(calls[0].init.body).to,['one@example.com','two@example.com']);assert.equal(calls[0].init.headers['Idempotency-Key'],calls[1].init.headers['Idempotency-Key']);
 await assert.rejects(sendToolboxEmail(message,{},request),/repository secrets/);
 await assert.rejects(sendToolboxEmail(message,env,async()=>({ok:false,status:403,text:async()=>env.RESEND_API_KEY})),e=>!e.message.includes(env.RESEND_API_KEY)&&/403/.test(e.message));
});
