import {applyWeeklyReview} from './weekly.mjs';

// "Unchanged" is a carry-forward operation, not a request to rewrite stored
// editorial text. Repeated valid references count once; invalid references stay
// in the proposal so the full validator still rejects them.
export function normalizeWeeklyReview(previous,review,sources) {
  if(!Array.isArray(review?.questions))return review;
  const sourceMap=new Map(sources.map(s=>[s.id,s]));
  return {...review,questions:review.questions.map(proposal=>{
    const prior=previous?.cadence==='weekly'?previous.questions.find(q=>q.id===proposal.existingId):null;
    const unchanged=prior&&proposal.change==='Unchanged';
    const seen=new Set();
    const signals=(proposal.signals||[]).filter(signal=>{
      const source=sourceMap.get(signal.sourceId),passage=source?.passages.find(p=>p.id===signal.passageId);
      if(!passage||!source.text.includes(passage.text))return true;
      if(seen.has(source.url))return false;
      seen.add(source.url);return true;
    }).map(signal=>{
      const source=sourceMap.get(signal.sourceId),old=unchanged&&prior.signals.find(s=>s.url===source?.url);
      return old?{...signal,happened:old.happened,changes:old.changes,verdict:old.verdict,role:old.role}:signal;
    });
    if(!unchanged)return {...proposal,signals};
    const retained={...proposal,signals,changeReason:''};
    for(const key of ['answer','question','why','uncertainty','editorialTitle','category','tags','aiLens'])retained[key]=prior[key];
    const added=[...new Map(signals.map(s=>sourceMap.get(s.sourceId)).filter(s=>s&&!prior.signals.some(p=>p.url===s.url)).map(s=>[s.url,s])).values()];
    if(!added.length)return retained;
    return {...retained,change:'Evidence added',changeReason:`Answer retained verbatim. Added verified citations: ${added.map(s=>s.url).join(', ')}.`};
  })};
}

// Every attempt passes the same editorial validator. Nothing is saved until
// a complete review succeeds; retries do not repeat collection or publication.
export async function reviewWithRetry(previous, sources, now, generate, {warn=console.warn}={}) {
  let repair=null;
  for(let attempt=1;attempt<=3;attempt++){
    // Transport/API failures propagate rather than being called editorial errors.
    const output=await generate(repair);
    let review;
    try {
      review=JSON.parse(output);
      return applyWeeklyReview(previous,normalizeWeeklyReview(previous,review,sources),sources,now);
    } catch(error) {
      const reason=error instanceof SyntaxError?'The review is not valid JSON.':error.message;
      warn(`Weekly review validation rejected attempt ${attempt}/3: ${reason}`);
      if(attempt===3)throw new Error(`Weekly review failed validation after 3 attempts; previous edition retained. ${reason}`);
      repair={validationError:reason,rejectedReview:review||null};
    }
  }
}
