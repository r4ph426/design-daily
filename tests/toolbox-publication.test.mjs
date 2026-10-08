import test from 'node:test';
import assert from 'node:assert/strict';
import {applyToolboxReview,toolboxEmail,sendToolboxEmail,deliverToolboxDaily,sourcePassages,resolveToolboxEvidence} from '../scripts/lib/toolbox-publication.mjs';

const tool={id:'01',title:'Test skill',type:'Skill',categories:['UI'],practices:['Review'],description:'Design checks.',recommendation:'Inspect one screen.',access:'Open source',setup:'Install the skill',verdict:'Best practice',confidence:'High',reviewed:'28 Sep 2026',source:'example.com',url:'https://example.com/skill'};
const before={weekLabel:'Week 40',weeklySignals:[{id:'01',title:tool.title,url:tool.url,summary:tool.recommendation,verdict:tool.verdict,source:tool.source}],tools:[tool]};
const evidence='The skill now supports keyboard navigation checks.';
const sources=[{id:'source-1',url:tool.url,text:evidence},{id:'source-2',url:'https://example.com/new',text:evidence}];
const proposal={sourceId:'source-1',evidence,...tool,description:'Design and keyboard checks.'};
const now=new Date('2026-10-12T03:00:00Z');
test('automatic updates preserve editorial verdicts, IDs and URLs and record before/after fields',()=>{
 const r=applyToolboxReview(before,{proposals:[{...proposal,verdict:'Useful now',id:'hacked',url:'https://attacker.example'}]},sources,now);
 assert.equal(r.after.tools[0].verdict,'Best practice');assert.equal(r.after.tools[0].id,'01');assert.equal(r.after.tools[0].url,tool.url);
 assert.equal(r.changes[0].fields[0].before,tool.description);assert.equal(r.changes[0].fields[0].after,proposal.description);assert.match(r.after.weekLabel,/Last 7 days/);
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
 const env={BREVO_API_KEY:'secret-fixture',TOOLBOX_EMAIL_FROM:'sender@example.com',TOOLBOX_EMAIL_TO:'one@example.com,two@example.com'},calls=[];
 const request=async(url,init)=>{calls.push({url,init});return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};};
 const message={subject:'Monday update',text:'Change log'};
 await sendToolboxEmail(message,env,request);await sendToolboxEmail(message,env,request);
 assert.deepEqual(JSON.parse(calls[0].init.body).to,[{email:'one@example.com'},{email:'two@example.com'}]);assert.equal(JSON.parse(calls[0].init.body).headers['Idempotency-Key'],JSON.parse(calls[1].init.body).headers['Idempotency-Key']);
 await assert.rejects(sendToolboxEmail(message,{},request),/repository secrets/);
 await assert.rejects(sendToolboxEmail(message,env,async()=>({ok:false,status:403,text:async()=>env.BREVO_API_KEY})),e=>!e.message.includes(env.BREVO_API_KEY)&&/403/.test(e.message));
});
const emailEnv={BREVO_API_KEY:'secret-fixture',TOOLBOX_EMAIL_FROM:'hello@example.com',TOOLBOX_EMAIL_TO:'one@example.com,two@example.com'};
const emailMessage={subject:'Monday update',text:'Verified changes'};
test('Brevo payload uses verified sender, reply address, two recipients and blocks redirects',async()=>{
 await sendToolboxEmail(emailMessage,emailEnv,async(url,init)=>{
  assert.equal(url,'https://api.brevo.com/v3/smtp/email');assert.equal(init.redirect,'error');assert.equal(init.headers['api-key'],'secret-fixture');
  const body=JSON.parse(init.body);assert.equal(body.sender.email,emailEnv.TOOLBOX_EMAIL_FROM);assert.equal(body.replyTo.email,emailEnv.TOOLBOX_EMAIL_FROM);assert.equal(body.textContent,emailMessage.text);assert.ok(!init.body.includes('secret-fixture'));
  return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};
 });
});
test('daily guard persists before POST and prevents changed-content duplicates on reruns',async()=>{
 let state={},calls=0;const order=[];
 const persist=async s=>{state=s;order.push(s['2026-10-12'].status);};
 const request=async()=>{calls++;order.push('post');return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};};
 const options=()=>({day:'2026-10-12',state,persist,request,env:emailEnv});
 assert.equal(await deliverToolboxDaily(emailMessage,options()),'accepted');
 assert.deepEqual(order,['sending','post','accepted']);
 assert.equal(await deliverToolboxDaily({...emailMessage,text:'changed'},options()),'already-accepted');assert.equal(calls,1);
 assert.equal(await deliverToolboxDaily(emailMessage,{...options(),day:'2026-10-13'}),'accepted');assert.equal(calls,2);
 assert.ok(!JSON.stringify(state).includes('@'));
});
test('uncertain API outcomes block retries and never expose errors containing secrets',async()=>{
 for(const request of [async()=>{throw new Error(emailEnv.BREVO_API_KEY);},async()=>({status:503}),async()=>({status:302}),async()=>({status:201,json:async()=>({})}),async()=>({status:201,json:async()=>{throw new Error('private');}})]){
  let state={};const persist=async s=>{state=s;};const options=()=>({day:'2026-10-12',state,persist,request,env:emailEnv});
  await assert.rejects(deliverToolboxDaily(emailMessage,options()),e=>e.ambiguous&&!e.message.includes(emailEnv.BREVO_API_KEY));
  assert.equal(state['2026-10-12'].status,'uncertain');
  await assert.rejects(deliverToolboxDaily(emailMessage,options()),/reconcile/);
 }
});
test('failed checkpoints prevent POST; accepted-send checkpoint failure remains blocked',async()=>{
 let calls=0,state={};const request=async()=>{calls++;return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};};
 await assert.rejects(deliverToolboxDaily(emailMessage,{day:'2026-10-12',env:emailEnv,request,persist:async()=>{throw new Error('git failure');}}),/git failure/);assert.equal(calls,0);
 const persist=async s=>{if(s['2026-10-12'].status==='accepted')throw new Error('git failure');state=s;};
 await assert.rejects(deliverToolboxDaily(emailMessage,{day:'2026-10-12',env:emailEnv,request,persist}),/git failure/);assert.equal(state['2026-10-12'].status,'sending');
 await assert.rejects(deliverToolboxDaily(emailMessage,{day:'2026-10-12',state,env:emailEnv,request,persist}),/reconcile/);assert.equal(calls,1);
});
test('explicit Brevo rejection allows retry but missing/invalid configuration never POSTs',async()=>{
 let state={},calls=0;const persist=async s=>{state=s;};const options=()=>({day:'2026-10-12',state,persist,env:emailEnv});
 await assert.rejects(deliverToolboxDaily(emailMessage,{...options(),request:async()=>{calls++;return {status:403};}}),/403/);assert.equal(state['2026-10-12'].status,'rejected');
 await deliverToolboxDaily(emailMessage,{...options(),request:async()=>{calls++;return {status:201,json:async()=>({messageId:'fixture@brevo.test'})};}});assert.equal(calls,2);
 for(const env of [{},{...emailEnv,TOOLBOX_EMAIL_FROM:'name <hello@example.com>'},{...emailEnv,TOOLBOX_EMAIL_TO:'one@example.com\nprivate'}])await assert.rejects(sendToolboxEmail(emailMessage,env,async()=>{throw new Error('must not POST');}),/configuration|repository secrets/);
});
test('malformed durable state fails closed',async()=>{
 for(const state of [null,[],{bad:{status:'accepted'}},{'2026-10-12':{status:'unknown'}}])await assert.rejects(deliverToolboxDaily(emailMessage,{day:'2026-10-12',state,persist:async()=>{throw new Error('must not persist');},env:emailEnv}),/Invalid Toolbox delivery state/);
});

test('generated reviews select exact original passages by source-scoped IDs',()=>{
 const text=('Original source description with meaningful evidence. ').repeat(150);
 const passages=sourcePassages(text);assert.ok(passages.length>1);
 assert.ok(passages.every(p=>p.text.length>=20&&p.text.length<=350&&text.includes(p.text)));
 const source={id:'source-a',text,passages};
 const result=resolveToolboxEvidence({proposals:[{sourceId:source.id,evidenceId:passages[1].id,evidence:'invented quotation'}]},[source]);
 assert.equal(result.proposals[0].evidence,passages[1].text);
 for(const p of [{sourceId:'unknown',evidenceId:passages[0].id},{sourceId:source.id,evidenceId:'invented'}])assert.throws(()=>resolveToolboxEvidence({proposals:[p]},[source]),/verified source passage/);
 assert.deepEqual(resolveToolboxEvidence({proposals:[]},[source]),{proposals:[]});
});

 test('collection copy updates preserve the dated editorial findings without refreshing discovery dates',()=>{
  const input={...before,findings:[{...before.weeklySignals[0],foundOn:'2026-10-09'}]};
  const result=applyToolboxReview(input,{proposals:[proposal]},sources,now);
  assert.deepEqual(result.after.findings,input.findings);
  assert.equal(result.after.weeklySignals[0].foundOn,'2026-10-09');
 });
 test('new discoveries get their own date and do not duplicate on re-review',()=>{
  const p={...proposal,sourceId:'source-2',title:'New skill'};
  const result=applyToolboxReview(before,{proposals:[p]},sources,now);
  assert.equal(result.after.findings.at(-1).foundOn,'2026-10-12');
  const again=applyToolboxReview(result.after,{proposals:[{...p,description:'Changed description.'}]},sources,new Date('2026-10-13T12:00:00Z'));
  assert.equal(again.after.findings.length,result.after.findings.length);
  assert.equal(again.after.findings.at(-1).foundOn,'2026-10-12');
 });
