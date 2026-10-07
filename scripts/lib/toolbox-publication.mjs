import {renderToolboxEmail} from './toolbox-email.mjs';
import {createHash} from 'node:crypto';
import {canonicalToolUrl,validateToolboxData} from './toolbox.mjs';

const editable=['description','recommendation','access','setup'];
// Passage text comes from fetched source data, never from generated quotations.
export function sourcePassages(text){
  const passages=[];
  for(let start=0;start<text.length;){
    let end=Math.min(start+350,text.length);
    if(end<text.length){const space=text.lastIndexOf(' ',end);if(space>start+150)end=space;}
    const passage=text.slice(start,end).trim();
    if(passage.length>=20)passages.push({id:`passage-${passages.length}`,text:passage});
    start=end;
  }
  return passages;
}
export function resolveToolboxEvidence(review,sources){
  if(!Array.isArray(review?.proposals)||review.proposals.length>10)throw new Error('Invalid Toolbox review batch.');
  return {proposals:review.proposals.map(proposal=>{
    const source=sources.find(s=>s.id===proposal.sourceId);
    const passage=source?.passages?.find(p=>p.id===proposal.evidenceId);
    if(!passage||!source.text.includes(passage.text))throw new Error('Review lacks a verified source passage.');
    return {...proposal,evidence:passage.text};
  })};
}

export function applyToolboxReview(before,review,sources,now=new Date()) {
  validateToolboxData(before);
  if(!Array.isArray(review.proposals)||review.proposals.length>10)throw new Error('Invalid Toolbox review batch.');
  const after=structuredClone(before),changes=[],warnings=[],seen=new Set();
  const sourceMap=new Map(sources.map(s=>[s.id,s]));
  const reviewed=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',day:'numeric',month:'short',year:'numeric'}).format(now);
  for(const proposal of review.proposals){
    const source=sourceMap.get(proposal.sourceId);
    if(!source||typeof proposal.evidence!=='string'||proposal.evidence.length<20||proposal.evidence.length>400||!source.text.includes(proposal.evidence))throw new Error('Review lacks a verified source passage.');
    const key=canonicalToolUrl(source.url);
    if(seen.has(key))throw new Error('Repeated source in review.');seen.add(key);
    const existing=after.tools.find(t=>canonicalToolUrl(t.url)===key);
    const fields={};
    for(const field of editable){
      const value=proposal[field];
      if(typeof value!=='string'||!value.trim()||value.length>800||/[\u0000-\u001f]/.test(value))throw new Error('Invalid review text.');
      fields[field]=value.trim();
    }
    if(existing){
      const diff=editable.filter(field=>existing[field]!==fields[field]).map(field=>({field,before:existing[field],after:fields[field]}));
      if(!diff.length)continue;
      Object.assign(existing,fields,{reviewed});
      changes.push({kind:'changed',id:existing.id,title:existing.title,url:existing.url,fields:diff,evidence:proposal.evidence});
    }else{
      if(changes.filter(c=>c.kind==='new').length>=3)throw new Error('Too many new Toolbox entries.');
      if(typeof proposal.title!=='string'||!proposal.title.trim()||proposal.title.length>100)throw new Error('Invalid tool name.');
      const tool={id:`auto-${createHash('sha256').update(key).digest('hex').slice(0,12)}`,title:proposal.title.trim(),type:proposal.type,categories:proposal.categories,practices:proposal.practices,...fields,verdict:'Watching',confidence:'Medium',reviewed,source:new URL(source.url).hostname,url:source.url};
      tool.recommendation=`Source-reviewed; not yet team-tested. ${tool.recommendation}`;
      after.tools.push(tool);changes.push({kind:'new',id:tool.id,title:tool.title,url:tool.url,entry:tool,evidence:proposal.evidence});
    }
  }
  validateToolboxData(after);
  if(changes.length){
    const d=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T12:00:00Z');
    d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
    const week=Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7);
    after.weekLabel=`Week ${week} · Source-reviewed ${reviewed}`;
    const picks=changes.map(c=>after.tools.find(t=>t.id===c.id));
    const remaining=before.weeklySignals.filter(s=>!picks.some(t=>t.title===s.title));
    after.weeklySignals=[...picks.map(t=>({title:t.title,verdict:t.verdict,summary:t.recommendation,source:t.source,url:t.url})),...remaining].slice(0,3).map((s,i)=>({...s,id:String(i+1).padStart(2,'0')}));
  }
  return {after,changes,warnings};
}

export function toolboxEmail(log,{status='published',commit='',runUrl=''}={}){
  const heading=status==='failed'?'Toolbox refresh failed':status==='unchanged'?'Toolbox: no published changes':'Toolbox update';
  const lines=[`${heading} · ${log.date}`,'',status==='published'?'The changes below were published automatically.':status==='unchanged'?'The review found no material changes to publish.':'Publication or delivery needs attention.','',...log.changes.flatMap(c=>[`${c.kind==='new'?'NEW':'CHANGED'}: ${c.title}`,c.url,...(c.fields||[]).flatMap(f=>[`${f.field}:`,`Before: ${f.before}`,`After: ${f.after}`]),...(c.entry?[`Verdict: ${c.entry.verdict}`,c.entry.recommendation]:[]),`Source passage: ${c.evidence}`,'']),...(log.warnings||[]).map(w=>`CHECK: ${w}`),'New entries are source-reviewed, not team-tested. Existing editorial verdicts were preserved.','',`Live Toolbox: https://r4ph426.github.io/design-daily/#/toolbox`,...(commit?[`Commit: https://github.com/r4ph426/design-daily/commit/${commit}`]:[]),...(runUrl?[`Run: ${runUrl}`]:[]),'Reply with the tool name and correction, or revert the linked commit.'];
  return {subject:`design / daily · ${heading} · ${log.date}`,text:lines.join('\n'),html:renderToolboxEmail(log,{status,commit,runUrl})};
}

export async function sendToolboxEmail(message,env=process.env,request=fetch,onSending=async()=>{}){
  const {BREVO_API_KEY,TOOLBOX_EMAIL_FROM,TOOLBOX_EMAIL_TO}=env;
  if(!BREVO_API_KEY||!TOOLBOX_EMAIL_FROM||!TOOLBOX_EMAIL_TO)throw new Error('Configure BREVO_API_KEY, TOOLBOX_EMAIL_FROM and TOOLBOX_EMAIL_TO repository secrets to deliver the Toolbox log.');
  const address=/^[^\s<>@,]+@[^\s<>@,]+\.[^\s<>@,]+$/;
  const to=[...new Set(TOOLBOX_EMAIL_TO.split(',').map(s=>s.trim()).filter(Boolean))];
  if(!address.test(TOOLBOX_EMAIL_FROM)||!to.length||to.length>10||to.some(s=>!address.test(s))||/\s/.test(BREVO_API_KEY))throw new Error('Invalid Toolbox email configuration.');
  const key=createHash('sha256').update(JSON.stringify({from:TOOLBOX_EMAIL_FROM,to,...message})).digest('hex');
  await onSending(); // Persist before the first POST; a failed checkpoint prevents sending.
  let response;
  try{
    response=await request('https://api.brevo.com/v3/smtp/email',{method:'POST',redirect:'error',headers:{'api-key':BREVO_API_KEY,'content-type':'application/json',accept:'application/json'},body:JSON.stringify({sender:{email:TOOLBOX_EMAIL_FROM,name:'design / daily'},replyTo:{email:TOOLBOX_EMAIL_FROM},to:to.map(email=>({email})),subject:message.subject,...(message.html?{htmlContent:message.html}:{textContent:message.text}),tags:['design-daily-toolbox'],headers:{'Idempotency-Key':`toolbox-${key}`}}),signal:AbortSignal.timeout(20000)});
  }catch{throw Object.assign(new Error('Brevo acceptance is uncertain. Check transactional logs before retrying.'),{ambiguous:true});}
  if(response.status!==201){
    const rejected=[400,401,402,403,404,405,413,415,422,429].includes(response.status);
    throw Object.assign(new Error(rejected?`Brevo rejected the Toolbox email (HTTP ${response.status}). Check sender verification, API key and account quota.`:`Brevo acceptance is uncertain (HTTP ${response.status}). Check transactional logs before retrying.`),{ambiguous:!rejected});
  }
  let result;
  try{result=await response.json();}catch{}
  if(typeof result?.messageId!=='string'||!/^<?[A-Za-z0-9_.+\-]{1,160}@[A-Za-z0-9.-]{1,90}>?$/.test(result.messageId))throw Object.assign(new Error('Brevo acceptance is uncertain (invalid acknowledgement). Check transactional logs before retrying.'),{ambiguous:true});
  return true;
}

export async function deliverToolboxDaily(message,{day,state={},persist,env=process.env,request=fetch}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||typeof persist!=='function')throw new Error('A dated durable delivery store is required.');
  if(!state||Array.isArray(state)||typeof state!=='object'||Object.entries(state).some(([date,record])=>!/^\d{4}-\d{2}-\d{2}$/.test(date)||!record||!['sending','uncertain','rejected','accepted'].includes(record.status)))throw new Error('Invalid Toolbox delivery state. Inspect it before retrying.');
  const previous=state[day];
  if(previous?.status==='accepted')return 'already-accepted';
  if(['sending','uncertain'].includes(previous?.status))throw new Error('Prior Toolbox delivery is uncertain. Check Brevo transactional logs and reconcile the delivery state before retrying.');
  let checkpointed=false;
  try{
    await sendToolboxEmail(message,env,request,async()=>{
      await persist({...state,[day]:{status:'sending'}});
      checkpointed=true;
    });
  }catch(error){
    if(checkpointed)await persist({...state,[day]:{status:error.ambiguous?'uncertain':'rejected'}});
    throw error;
  }
  await persist({...state,[day]:{status:'accepted'}});
  return 'accepted';
}
