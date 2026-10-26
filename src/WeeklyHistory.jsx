import {HighlightedText} from './HighlightedText.jsx';
export function WeeklyHistory({question}) {
  if(!question.history?.length)return null;
  return <section className="reading-trail" aria-label="Question development history">
    <p className="reading-trail-eyebrow">This week</p>
    <h3>How the answer developed</h3>
    <ol>{[...question.history].reverse().map((update,index)=><li key={`${update.at}-${index}`}>
      <p className="reading-trail-meta">{new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(update.at))} · {update.kind}</p>
      <p>{update.reason}</p>
      {update.before&&update.before!==update.after&&<details><summary>Earlier answer</summary><p><HighlightedText text={update.before}/></p></details>}
    </li>)}</ol>
  </section>;
}
