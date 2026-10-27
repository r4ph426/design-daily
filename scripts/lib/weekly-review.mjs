import {applyWeeklyReview} from './weekly.mjs';

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
      return applyWeeklyReview(previous,review,sources,now);
    } catch(error) {
      const reason=error instanceof SyntaxError?'The review is not valid JSON.':error.message;
      warn(`Weekly review validation rejected attempt ${attempt}/3: ${reason}`);
      if(attempt===3)throw new Error(`Weekly review failed validation after 3 attempts; previous edition retained. ${reason}`);
      repair={validationError:reason,rejectedReview:review||null};
    }
  }
}
