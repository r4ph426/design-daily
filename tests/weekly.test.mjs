import {checkWeeklyMail} from '../scripts/lib/weekly-mail-check.mjs';
import {searchCandidates} from '../scripts/lib/weekly-research.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWeeklyReview,articleText,mergeInventory,passages,weekWindow,weeklySchema} from '../scripts/lib/weekly.mjs';
import {weeklyEmail} from '../scripts/lib/weekly-email.mjs';
import {deliverToolboxDaily} from '../scripts/lib/toolbox-publication.mjs';
const monday=new Date('2026-10-26T10:00:00Z'),tuesday=new Date('2026-10-27T10:00:00Z');
const makeSource=(id='a',host='one.example')=>({id,url:`https://${host}/article`,title:'Original study',source:host,publishedAt:'2026-10-26T08:00:00Z',firstCollectedAt:monday.toISOString(),text:'The original research observes a measurable change in task performance.',passages:[{id:'p0',text:'The original research observes a measurable change in task performance.'}]});
const source=makeSource();
const proposal=()=>({existingId:'',editorialTitle:'Design **decisions**',question:'Which design decisions need stronger evidence?',answer:'The working answer is provisional.',why:'This affects research decisions.',category:'UX',tags:['UX'],aiLens:false,change:'New',changeReason:'A new original study raises the question.',uncertainty:'Only one publisher is available; independent evidence is still needed.',signals:[{sourceId:'a',passageId:'p0',happened:'The study reports a result.',changes:'The consequence remains bounded.',verdict:'Read',role:'Supports'}]});
const review=q=>({headline:'Design decisions need **stronger evidence** before becoming weekly conclusions',summary:'Evidence is developing. The answer remains provisional.',questions:[q]});
const initial=()=>applyWeeklyReview({editionNumber:'032'},review(proposal()),[source],monday);
test('Berlin week boundaries survive DST, Sunday and Friday',()=>{
 assert.deepEqual(weekWindow(new Date('2026-10-25T23:30:00Z')),{start:'2026-10-26',end:'2026-10-30',date:'2026-10-26',weekday:1});
 assert.equal(weekWindow(new Date('2026-10-25T00:30:00Z')).start,'2026-10-19');
 assert.equal(weekWindow(new Date('2026-10-30T07:00:00Z')).end,'2026-10-30');
});
test('weekly review keeps identity, edition and original answer on a no-change rerun',()=>{
 const first=initial(),p={...proposal(),existingId:'01',change:'Unchanged',changeReason:''};
 const next=applyWeeklyReview(first,review(p),[source],tuesday);
 assert.equal(next.editionNumber,first.editionNumber);assert.equal(next.questions[0].slug,first.questions[0].slug);assert.equal(next.questions[0].history.length,1);assert.equal(next.revision,first.revision);
});
test('new sources and changed conclusions record different events and before/after',()=>{
 const first=initial(),other=makeSource('b','two.example'),p={...proposal(),existingId:'01',change:'Evidence added',changeReason:'An independent study corroborates the narrow finding.'};
 p.signals.push({...p.signals[0],sourceId:'b'});
 const second=applyWeeklyReview(first,review(p),[source,other],tuesday);
 assert.equal(second.questions[0].publisherCount,2);assert.equal(second.questions[0].history.at(-1).kind,'Evidence added');
 p.change='Answer revised';p.answer='The answer is now narrower.';
 const third=applyWeeklyReview(first,review(p),[source,other],tuesday);
 assert.equal(third.questions[0].history.at(-1).before,first.questions[0].answer);assert.equal(third.questions[0].history.at(-1).after,p.answer);assert.equal(third.questions[0].slug,first.questions[0].slug);
});
test('unknown citations, invented passages and duplicate citations fail closed',()=>{
 for(const mutate of [p=>p.signals[0].sourceId='unknown',p=>p.signals[0].passageId='invented',p=>p.signals.push({...p.signals[0]})]){const p=proposal();mutate(p);assert.throws(()=>applyWeeklyReview(null,review(p),[source],monday));}
});
test('answers cannot change silently or without new evidence, except explicit correction',()=>{
 const first=initial(),p={...proposal(),existingId:'01',answer:'A different answer.',change:'Unchanged'};
 assert.throws(()=>applyWeeklyReview(first,review(p),[source],tuesday),/silently/);
 p.change='Answer revised';assert.throws(()=>applyWeeklyReview(first,review(p),[source],tuesday),/new evidence/);
 p.change='Correction';p.changeReason='The previous answer overstated this study.';assert.equal(applyWeeklyReview(first,review(p),[source],tuesday).questions[0].history.at(-1).kind,'Correction');
});
test('an unavailable source is retained and removed questions keep their shareable archive identity',()=>{
 const first=initial(),other=makeSource('b','two.example'),p={...proposal(),existingId:'01',change:'Evidence added',changeReason:'Added independent evidence.',signals:[{...proposal().signals[0],sourceId:'b'}]};
 const next=applyWeeklyReview(first,review(p),[other],tuesday);assert.equal(next.questions[0].signals.length,2);
 const replacement={...proposal(),question:'A distinct, stronger question?'};
 const changed=applyWeeklyReview(first,review(replacement),[source],tuesday);assert.equal(changed.retiredQuestions[0].slug,first.questions[0].slug);
});
test('week rollover increments once and preserves a returning thread across editions',()=>{
 const first=initial(),p={...proposal(),existingId:'01',change:'Unchanged',changeReason:''};
 const next=applyWeeklyReview(first,review(p),[source],new Date('2026-11-02T08:00:00Z'));
 assert.equal(Number(next.editionNumber),Number(first.editionNumber)+1);assert.equal(next.questions[0].threadId,first.questions[0].threadId);assert.equal(next.weekStart,'2026-11-02');
});
test('source inventory deduplicates canonical URLs and never stores raw email text',()=>{
 const first=mergeInventory([],[{...source,url:'https://one.example/article?utm_source=mail',excerpt:'private inbox content',gmailMessageId:'private-id'}],monday);
 const next=mergeInventory(first,[source],tuesday);assert.equal(next.length,1);assert.equal(next[0].firstCollectedAt,monday.toISOString());assert.ok(!JSON.stringify(next).includes('private'));
});
test('homepage chrome is not an article and passages are bounded original text',()=>{
 assert.equal(articleText('<html><nav>Lots of navigation</nav></html>'),'');
 const body=articleText('<article><header>Menu</header><p>Original article evidence about design decisions.</p></article>');assert.ok(!body.includes('Menu'));
 assert.ok(passages('Original article evidence about design decisions.')[0].text.length<=220);
});
test('weekly email has current answers, dated evolution, limits, full source links and no invented fourth question',()=>{
 const e=initial(),message=weeklyEmail(e);assert.ok(message.text.includes(e.questions[0].answer));assert.ok(message.text.includes('Only 1 question'));assert.ok(message.text.includes('Still open'));assert.ok(message.text.includes(source.url));assert.ok(message.html.includes('role="presentation"'));assert.ok(!/<script|display:grid/.test(message.html));
 const unsafe=structuredClone(e);unsafe.questions[0].question='<script>bad</script>';unsafe.questions[0].signals[0].url='javascript:alert(1)';const mail=weeklyEmail(unsafe);assert.ok(!mail.html.includes('<script>'));assert.ok(!mail.html.includes('href="javascript:'));
});
test('weekly email cannot duplicate an accepted week or retry an uncertain send',async()=>{
 const message=weeklyEmail(initial());let sent=0;
 const env={BREVO_API_KEY:'fixture-key',TOOLBOX_EMAIL_FROM:'from@example.com',TOOLBOX_EMAIL_TO:'to@example.com'};
 const options={day:'2026-10-26',env,persist:async()=>{},request:async()=>{sent++;return {status:201,json:async()=>({messageId:'accepted@brevo.test'})};}};
 assert.equal(await deliverToolboxDaily(message,{...options,state:{'2026-10-26':{status:'accepted'}}}),'already-accepted');assert.equal(sent,0);
 await assert.rejects(()=>deliverToolboxDaily(message,{...options,state:{'2026-10-26':{status:'uncertain'}}}),/uncertain/);
 const checkpoints=[];await deliverToolboxDaily(message,{...options,persist:async state=>checkpoints.push(state['2026-10-26'].status)});assert.deepEqual(checkpoints,['sending','accepted']);assert.equal(sent,1);
});
test('the active publication workflow uses weekly collection and Friday mail reuses the existing recipient',()=>{
 const publish=readFileSync(new URL('../.github/workflows/publish.yml',import.meta.url),'utf8'),mail=readFileSync(new URL('../.github/workflows/weekly-email.yml',import.meta.url),'utf8');
 assert.ok(publish.includes('node scripts/weekly-crawl.mjs'));assert.ok(!publish.includes('run: pnpm run crawl\n'));assert.ok(mail.includes('cron: "0 8 * * 5"'));assert.ok(mail.includes('timezone: "Europe/Berlin"'));assert.ok(mail.includes('secrets.TOOLBOX_EMAIL_TO'));assert.ok(mail.includes('group: design-daily-pages'));
});

test('targeted research accepts actual citation annotations, never generated URLs or snippets as reporting',()=>{
 const candidates=searchCandidates({output:[{content:[{text:'https://invented.example/',annotations:[{type:'url_citation',url:'https://original.example/research',title:'Original research'},{type:'url_citation',url:'http://127.0.0.1/private',title:'Unsafe'}]}]}]},monday);
 assert.equal(candidates.length,1);assert.equal(candidates[0].publishedAt,null);assert.equal(candidates[0].url,'https://original.example/research');assert.ok(!JSON.stringify(candidates).includes('invented'));
});

test('mail preflight checks the configured active sender without sending or exposing addresses',async()=>{
 const env={BREVO_API_KEY:'fixture-key',TOOLBOX_EMAIL_FROM:'sender@example.com',TOOLBOX_EMAIL_TO:'recipient@example.com'};let count=0;
 const result=await checkWeeklyMail(env,async(url,init)=>{count++;assert.equal(url,'https://api.brevo.com/v3/senders');assert.equal(init.method,undefined);return {ok:true,json:async()=>({senders:[{email:'sender@example.com',active:true}]})};});
 assert.equal(result.ready,true);assert.equal(result.recipientCount,1);assert.equal(count,1);assert.ok(!JSON.stringify(result).includes('@'));
 await assert.rejects(()=>checkWeeklyMail({...env,TOOLBOX_EMAIL_TO:''}),/configuration/);
});

test('generation schema constrains category tags to the same four-value vocabulary',()=>{
 assert.deepEqual(weeklySchema.properties.questions.items.properties.tags.items.enum,['UI','UX','Process','Culture']);
});

test('invalid unchanged review is repaired with feedback before publication',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const first=initial(),snapshot=structuredClone(first),feedback=[],warnings=[];
 const invalid={...proposal(),existingId:'01',change:'Unchanged',answer:'An unsupported stylistic rewrite.'};
 const repaired={...proposal(),existingId:'01',change:'Unchanged',changeReason:''};
 const next=await reviewWithRetry(first,[source],tuesday,async repair=>{
   feedback.push(repair);return JSON.stringify(review(feedback.length===1?invalid:repaired));
 },{warn:message=>warnings.push(message)});
 assert.equal(feedback.length,2);assert.equal(feedback[0],null);
 assert.match(feedback[1].validationError,/Question 01; changed fields: answer; new evidence: false/);
 assert.deepEqual(feedback[1].rejectedReview,review(invalid));
 assert.equal(next.questions[0].answer,first.questions[0].answer);
 assert.equal(next.revision,first.revision);assert.deepEqual(first,snapshot);
 assert.equal(warnings.length,1);assert.ok(!warnings[0].includes(invalid.answer));
});

test('repair can add verified evidence with an explicit dated answer revision',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const first=initial(),other=makeSource('b','two.example');let calls=0;
 const p={...proposal(),existingId:'01',change:'Unchanged',answer:'The answer is now narrower.',signals:[...proposal().signals,{...proposal().signals[0],sourceId:'b'}]};
 const next=await reviewWithRetry(first,[source,other],tuesday,async()=>{
   calls++;return JSON.stringify(review(calls===1?p:{...p,change:'Answer revised',changeReason:'Independent evidence narrows the conclusion.'}));
 },{warn:()=>{}});
 assert.equal(calls,2);assert.equal(next.questions[0].history.at(-1).kind,'Answer revised');
 assert.equal(next.questions[0].history.at(-1).before,first.questions[0].answer);
 assert.equal(next.questions[0].publisherCount,2);
});

test('repeated invalid citations stop after three attempts without mutating the edition',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const first=initial(),snapshot=structuredClone(first);let calls=0;
 const p={...proposal(),existingId:'01',change:'Unchanged'};p.signals[0].passageId='invented';
 await assert.rejects(()=>reviewWithRetry(first,[source],tuesday,async()=>{calls++;return JSON.stringify(review(p));},{warn:()=>{}}),/after 3 attempts; previous edition retained.*verified source passage/);
 assert.equal(calls,3);assert.deepEqual(first,snapshot);
});

test('malformed JSON is retried without logging output and transport failures are not retried',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const warnings=[];let calls=0;
 await reviewWithRetry(null,[source],monday,async repair=>{
   calls++;if(calls===1)return 'not-json-private-text';
   assert.equal(repair.validationError,'The review is not valid JSON.');return JSON.stringify(review(proposal()));
 },{warn:message=>warnings.push(message)});
 assert.equal(calls,2);assert.ok(!warnings.join('').includes('private-text'));
 calls=0;
 await assert.rejects(()=>reviewWithRetry(null,[source],monday,async()=>{calls++;throw new Error('HTTP 429');},{warn:()=>{}}),/HTTP 429/);
 assert.equal(calls,1);
});

test('generation identifiers are constrained to current evidence without mutating the base schema',async()=>{
 const {weeklySchemaForSources}=await import('../scripts/lib/weekly.mjs');
 const dynamic=weeklySchemaForSources([source]);
 const props=dynamic.properties.questions.items.properties.signals.items.properties;
 assert.deepEqual(props.sourceId.enum,['a']);assert.deepEqual(props.passageId.enum,['p0']);
 assert.equal(weeklySchema.properties.questions.items.properties.signals.items.properties.sourceId.enum,undefined);
});

test('citation validation identifies unknown sources and mismatched passage IDs for repair',()=>{
 const p=proposal();p.signals[0].sourceId='old-citation';
 assert.throws(()=>applyWeeklyReview(null,review(p),[source],monday),/sourceId "old-citation".*not in the current sources array/);
 p.signals[0].sourceId='a';p.signals[0].passageId='p99';
 assert.throws(()=>applyWeeklyReview(null,review(p),[source],monday),/passageId "p99".*valid passage IDs: p0/);
});

test('unchanged text with additional citations is deterministically recorded as evidence added',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const first=initial(),snapshot=structuredClone(first),other=makeSource('b','two.example');let calls=0;
 const p={...proposal(),existingId:'01',change:'Unchanged',changeReason:'Nothing changed.',signals:[...proposal().signals,{...proposal().signals[0],sourceId:'b'}]};
 const input=review(p),inputSnapshot=structuredClone(input);
 const next=await reviewWithRetry(first,[source,other],tuesday,async()=>{calls++;return JSON.stringify(input);},{warn:()=>{}});
 assert.equal(calls,1);assert.deepEqual(first,snapshot);assert.deepEqual(input,inputSnapshot);
 const q=next.questions[0],event=q.history.at(-1);
 for(const key of ['answer','question','why','uncertainty','editorialTitle'])assert.equal(q[key],first.questions[0][key]);
 assert.equal(event.kind,'Evidence added');assert.equal(event.before,event.after);
 assert.ok(event.reason.includes(other.url));assert.ok(!event.reason.includes('Nothing changed'));
 assert.equal(q.publisherCount,2);assert.equal(q.history.length,2);assert.equal(q.lastUpdatedAt,tuesday.toISOString());
});

test('evidence classification does not bypass passage validation or unchanged text checks',async()=>{
 const {reviewWithRetry}=await import('../scripts/lib/weekly-review.mjs');
 const first=initial(),other=makeSource('b','two.example');
 for(const mode of ['invalid-passage','text-drift']){
   const p={...proposal(),existingId:'01',change:'Unchanged',signals:[...proposal().signals,{...proposal().signals[0],sourceId:'b'}]};
   if(mode==='invalid-passage')p.signals[1].passageId='invented';else p.answer='An unsupported rewrite.';
   await assert.rejects(()=>reviewWithRetry(first,[source,other],tuesday,async()=>JSON.stringify(review(p)),{warn:()=>{}}),mode==='invalid-passage'?/verified source passage/:/unchanged question cannot silently change/);
 }
});
