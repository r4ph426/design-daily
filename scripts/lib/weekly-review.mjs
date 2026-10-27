import {applyWeeklyReview} from './weekly.mjs';

// The model's "Unchanged" can describe an unchanged answer while its citations
// add evidence. Classify that objective difference before strict validation.
// Text drift and invalid citations still fail in applyWeeklyReview.
export function classifyEvidenceAdditions(previous,review,sources) {
  if(previous?.cadence!=='weekly'||!Array.isArray(review?.questions))return review;
  const sourceMap=new Map(sources.map(s=>[s.id,s]));
  return {...review,questions:review.questions.map(proposal=>{
    const prior=previous.questions.find(q=>q.id===proposal.existingId);
    if(!prior||proposal.change!=='Unchanged'||!['answer','question','why','uncertainty','editorialTitle'].every(k=>proposal[k]===prior[k]))return proposal;
    const added=[...new Map((proposal.signals||[]).map(s=>sourceMap.get(s.sourceId)).filter(s=>s&&!prior.signals.some(p=>p.url===s.url)).map(s=>[s.url,s])).values()];
    if(!added.length)return proposal;
    return {...proposal,change:'Evidence added',changeReason:`Answer retained verbatim. Added verified citations: ${added.map(s=>s.url).join(', ')}.`};
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
      return applyWeeklyReview(previous,classifyEvidenceAdditions(previous,review,sources),sources,now);
    } catch(error) {
      const reason=error instanceof SyntaxError?'The review is not valid JSON.':error.message;
      warn(`Weekly review validation rejected attempt ${attempt}/3: ${reason}`);
      if(attempt===3)throw new Error(`Weekly review failed validation after 3 attempts; previous edition retained. ${reason}`);
      repair={validationError:reason,rejectedReview:review||null};
    }
  }
}
