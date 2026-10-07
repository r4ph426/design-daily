import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {publishReferences} from '../../src/inspiration/publicFeed.js';

// Only explicitly approved local IDs can enter the public snapshot. No automatic backfill.
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,all)=>index%2?pairs:[...pairs,[value,all[index+1]]],[]));
if(!args['--database']||!args['--approved']||!args['--week']||!args['--output'])throw new Error('Provide --database, --approved (JSON array of approved local IDs), --week (Monday), and --output.');
const ids=JSON.parse(readFileSync(args['--approved'],'utf8'));
if(!Array.isArray(ids)||!ids.length||ids.length>1000||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw new Error('An explicit, unique approval list is required.');
const db=new DatabaseSync(args['--database'],{readOnly:true});
try{
  const records=ids.map(id=>{const row=db.prepare('SELECT record FROM items WHERE id=?').get(id);if(!row)throw new Error('An approved record is unavailable.');return JSON.parse(row.record);});
  const previous=existsSync(args['--output'])?JSON.parse(readFileSync(args['--output'],'utf8')):{items:[]};
  const feed=publishReferences(records,{weekKey:args['--week'],previous});
  writeFileSync(args['--output'],JSON.stringify(feed,null,2)+'\n');
  console.log(JSON.stringify({published:records.length,total:feed.items.length,week:args['--week']}));
}finally{db.close();}
