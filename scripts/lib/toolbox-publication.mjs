import {createHash} from 'node:crypto';
import {canonicalToolUrl,validateToolboxData} from './toolbox.mjs';

const editable=['description','recommendation','access','setup'];
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
  return {subject:`design / daily · ${heading} · ${log.date}`,text:lines.join('\n')};
}

export async function sendToolboxEmail(message,env=process.env,request=fetch){
  const {RESEND_API_KEY,TOOLBOX_EMAIL_FROM,TOOLBOX_EMAIL_TO}=env;
  if(!RESEND_API_KEY||!TOOLBOX_EMAIL_FROM||!TOOLBOX_EMAIL_TO)throw new Error('Configure RESEND_API_KEY, TOOLBOX_EMAIL_FROM and TOOLBOX_EMAIL_TO repository secrets to deliver the Toolbox log.');
  const to=TOOLBOX_EMAIL_TO.split(',').map(s=>s.trim()).filter(Boolean);
  if(!to.length||to.length>10||to.some(s=>!/^\S+@\S+\.\S+$/.test(s))||/[\r\n]/.test(TOOLBOX_EMAIL_FROM))throw new Error('Invalid Toolbox email configuration.');
  const key=createHash('sha256').update(JSON.stringify({to,...message})).digest('hex');
  const response=await request('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${RESEND_API_KEY}`,'content-type':'application/json','Idempotency-Key':`toolbox-${key}`},body:JSON.stringify({from:TOOLBOX_EMAIL_FROM,to,...message}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Toolbox email delivery failed (HTTP ${response.status}). Check the sender domain and repository secrets.`);
  const result=await response.json();if(!result.id)throw new Error('Email provider did not confirm acceptance.');
  return true;
}
