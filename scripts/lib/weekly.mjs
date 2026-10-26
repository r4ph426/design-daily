import {createHash} from 'node:crypto';
import {canonicalUrl, itemId, slugify} from './crawler.mjs';
import {validateCategoryRecord} from '../../src/taxonomy.js';

export const berlinDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function weekWindow(now = new Date()) {
  const date=berlinDay(now), d=new Date(`${date}T12:00:00Z`), weekday=d.getUTCDay();
  d.setUTCDate(d.getUTCDate()-((weekday+6)%7));
  const start=d.toISOString().slice(0,10); d.setUTCDate(d.getUTCDate()+4);
  return {start,end:d.toISOString().slice(0,10),date,weekday};
}
export function publisher(url) {return new URL(url).hostname.toLowerCase().replace(/^www\./,'');}
export function mergeInventory(previous, incoming, now=new Date()) {
  const inventory=new Map((previous||[]).map(s=>[canonicalUrl(s.url),s]));
  for(const item of incoming){
    const url=canonicalUrl(item.url); if(!url)continue;
    const existing=inventory.get(url);
    inventory.set(url,{id:itemId({url}),url,title:item.title,source:item.source,sourceKind:item.sourceKind||'web crawl',publishedAt:item.publishedAt||null,firstCollectedAt:existing?.firstCollectedAt||now.toISOString()});
  }
  return [...inventory.values()].slice(-200);
}
export function articleText(html) {
  const region=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if(!region)return ''; // Homepage and navigation text cannot establish article evidence.
  return region.replace(/<(script|style|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
}
export function passages(text) {
  return (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[]).map(s=>s.trim()).filter(s=>s.length>=30).slice(0,100).map((text,i)=>({id:`p${i}`,text:text.slice(0,220)}));
}
const str={type:'string'}, arr={type:'array',items:str};
const signalProperties={sourceId:str,passageId:str,happened:str,changes:str,verdict:{type:'string',enum:['Must read','Read','Track']},role:{type:'string',enum:['Supports','Challenges','Context']}};
const questionProperties={existingId:str,editorialTitle:str,question:str,answer:str,why:str,category:{type:'string',enum:['UI','UX','Process','Culture']},tags:{type:'array',items:{type:'string',enum:['UI','UX','Process','Culture']}},aiLens:{type:'boolean'},change:{type:'string',enum:['New','Unchanged','Evidence added','Answer revised','Correction']},changeReason:str,uncertainty:str,signals:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,required:Object.keys(signalProperties),properties:signalProperties}}};
export const weeklySchema={type:'object',additionalProperties:false,required:['headline','summary','questions'],properties:{headline:str,summary:str,questions:{type:'array',maxItems:4,items:{type:'object',additionalProperties:false,required:Object.keys(questionProperties),properties:questionProperties}}}};

export function applyWeeklyReview(previous, review, sources, now=new Date()) {
  const window=weekWindow(now), same=previous?.weekStart===window.start;
  if(!Array.isArray(review?.questions)||review.questions.length>4)throw new Error('A weekly review may contain at most four questions.');
  const sourceMap=new Map(sources.map(s=>[s.id,s])), old=previous?.cadence==='weekly'?previous.questions:[], seen=new Set();
  const questions=review.questions.map((proposal,index)=>{
    validateCategoryRecord(proposal,`Weekly question ${index+1}`);
    const prior=proposal.existingId?old.find(q=>q.id===proposal.existingId):null;
    if(proposal.existingId&&!prior)throw new Error('Unknown existing weekly question.');
    const id=prior?.id || String(Math.max(0,...old.map(q=>Number(q.id)||0))+index+1).padStart(2,'0');
    if(seen.has(id))throw new Error('Duplicate weekly question identity.');seen.add(id);
    if(!proposal.signals?.length||proposal.signals.length>12)throw new Error('A question needs inspectable evidence.');
    const urls=new Set();
    const signals=proposal.signals.map(signal=>{
      const source=sourceMap.get(signal.sourceId),passage=source?.passages.find(p=>p.id===signal.passageId);
      if(!passage||!source.text.includes(passage.text))throw new Error('Question lacks a verified source passage.');
      if(urls.has(source.url))throw new Error('Repeated citation is not additional evidence.');urls.add(source.url);
      if(!['Supports','Challenges','Context'].includes(signal.role))throw new Error('Invalid evidence role.');
      const existing=prior?.signals.find(s=>s.url===source.url);
      return {source:source.source,title:source.title,kind:'Web',timing:source.publishedAt?source.publishedAt.slice(0,10):'Date unavailable',publishedAt:source.publishedAt,firstCollectedAt:existing?.firstCollectedAt||source.firstCollectedAt,sourceId:source.id,url:source.url,happened:signal.happened,changes:signal.changes,verdict:signal.verdict,role:signal.role,evidence:passage.text};
    });
    // Keep earlier evidence when an article becomes temporarily unavailable.
    for(const signal of prior?.signals||[])if(!urls.has(signal.url))signals.push(signal);
    const publishers=new Set(signals.map(s=>publisher(s.url)));
    const changed=!prior||['answer','question','why','uncertainty','editorialTitle'].some(k=>proposal[k]!==prior[k]);
    const newEvidence=signals.some(s=>!prior?.signals.some(p=>p.url===s.url));
    if(prior&&proposal.change==='Unchanged'&&(changed||newEvidence))throw new Error('An unchanged question cannot silently change.');
    if(prior&&proposal.answer!==prior.answer&&!['Answer revised','Correction'].includes(proposal.change))throw new Error('Changed answers must be explicitly identified.');
    if(prior&&changed&&!newEvidence&&proposal.change!=='Correction')throw new Error('Answer changes need new evidence or an explicit correction.');
    if((changed||newEvidence)&&!proposal.changeReason.trim())throw new Error('Material changes need an explanation.');
    if(!prior&&proposal.change!=='New')throw new Error('New questions must be identified as new.');
    if(publishers.size<2&&!proposal.uncertainty.trim())throw new Error('Single-publisher questions must state their evidence limits.');
    const entry={at:now.toISOString(),kind:proposal.change,reason:proposal.changeReason,before:prior?.answer||null,after:proposal.answer,sourceIds:signals.map(s=>s.sourceId).filter(Boolean)};
    const history=[...(prior?.history||[])];
    if(changed||newEvidence)history.push(entry);
    return {id,threadId:prior?.threadId||`${window.start}:${slugify(proposal.question)}`,slug:prior?.slug||slugify(proposal.question),category:proposal.category,tags:proposal.tags,aiLens:proposal.aiLens,editorialTitle:proposal.editorialTitle,question:proposal.question,answer:proposal.answer,why:proposal.why,uncertainty:proposal.uncertainty,counts:{total:signals.length,web:signals.length,newsletters:0},publisherCount:publishers.size,firstSeen:prior?.firstSeen||window.date,lastUpdatedAt:changed||newEvidence?now.toISOString():prior.lastUpdatedAt,signals,further:[],history};
  });
  if(!questions.length && same && old.length)throw new Error('An empty review cannot erase the existing edition.');
  const retired=[...(same?previous.retiredQuestions||[]:[]),...(same?old.filter(q=>!seen.has(q.id)):[])];
  const state={schemaVersion:2,cadence:'weekly',weekStart:window.start,weekEnd:window.end,date:window.start,editionNumber:same?previous.editionNumber:String(Number(previous?.editionNumber||0)+1).padStart(3,'0'),displayDate:`Week of ${window.start}`,headline:review.headline,summary:review.summary,questions,retiredQuestions:[...new Map(retired.filter(q=>!questions.some(active=>active.slug===q.slug)).map(q=>[q.slug,q])).values()],generatedAt:now.toISOString(),lastCollectedAt:now.toISOString(),crawlCompletedAt:new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).format(now),finalizedAt:same?previous.finalizedAt||null:null};
  state.revision=createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0,12);
  return state;
}
