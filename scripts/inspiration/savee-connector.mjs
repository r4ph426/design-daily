// Import read-only Savee MCP responses into the existing private owner database.
// This bridge never reads connector credentials or writes to Savee.
import {readFileSync,mkdirSync,chmodSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {cleanUrl} from '../../src/inspiration/model.js';
import {InspirationDatabase} from './database.mjs';

export function parseSaveePage(text) {
  if(typeof text!=='string'||text.length>2_000_000)throw new Error('Invalid Savee connector page.');
  const count=Number(text.match(/^(\d+) saves?:/m)?.[1]);
  if(!Number.isInteger(count)||count<0||count>100)throw new Error('Unrecognised Savee listing.');
  const cursor=text.match(/More results are available\. To get the next page, call this tool again with cursor: (\S+)/)?.[1]||null;
  if(!cursor&&!/End of results\./.test(text))throw new Error('Savee page is missing its pagination result.');
  const blocks=[...text.matchAll(/^\d+\. ([\s\S]*?)(?=^\d+\. |^More results are available\.|^End of results\.|$(?![\s\S]))/gm)];
  const records=blocks.map(match=>{
    const block=match[1],lines=block.split('\n'),title=lines.shift().trim();
    const id=block.match(/^   id: ([a-f\d]{24})\s*$/m)?.[1];
    const raw=block.match(/^   savee: (https:\/\/savee\.com\/i\/[\w-]+\/)\s*$/m)?.[1];
    const media=block.match(/^   (image|video) (\d+)×(\d+): (https?:\/\/\S+)\s*$/m);
    if(!id||!raw||!title)throw new Error('Incomplete Savee reference. No records were imported.');
    const url=cleanUrl(raw),source=block.match(/^   source: (https?:\/\/\S+)\s*$/m)?.[1];
    const description=lines.filter(line=>!/^   /.test(line)).join('\n').trim();
    const dimensions=media?`${media[2]} × ${media[3]} px.`:'';
    const context=description||[dimensions,media?.[1]==='video'?'Savee video reference.':'Savee image reference.'].filter(Boolean).join(' ');
    const asset=media?cleanUrl(media[4]):null;
    return {originalUrl:url,title,origin:'savee',context:'Imported from your connected Savee account. The connector does not expose the original save date; the import week is used unless an earlier date is already recorded.',provider:{provider:'savee',id,collection:'saves',updatedAt:null,url,title,description:context,tags:[],image:media?.[1]==='image'?asset:null,sourceUrl:source?cleanUrl(source):null,savedAt:null,...(media?.[1]==='video'?{video:asset}:{})}};
  });
  if(records.length!==count)throw new Error('Savee page count did not match parsed references. No records were imported.');
  return {records,cursor};
}

export function importSaveeConnector(database,batch,{now=new Date().toISOString(),expectedAccount='ael_rough'}={}) {
  if(batch?.account!==expectedAccount)throw new Error('Connected Savee account does not match the configured owner.');
  if(batch.complete!==true||!Array.isArray(batch.pages)||!batch.pages.length||batch.pages.length>200)throw new Error('A complete paginated Savee snapshot is required.');
  const records=[],cursors=new Set(),ids=new Set();
  for(let index=0;index<batch.pages.length;index++){
    const parsed=parseSaveePage(batch.pages[index]);
    if(!!parsed.cursor!==(index<batch.pages.length-1))throw new Error('Incomplete Savee pagination. No records were imported.');
    if(parsed.cursor){if(cursors.has(parsed.cursor))throw new Error('Repeated Savee cursor.');cursors.add(parsed.cursor);}
    for(const record of parsed.records){if(ids.has(record.provider.id))throw new Error('Repeated Savee reference across pages. Retry the snapshot.');ids.add(record.provider.id);records.push(record);}
  }
  const counts=database.importProvider(records);
  database.set('saveeSync',{status:'complete',transport:'codex-connector',account:expectedAccount,lastSuccess:now,...counts,total:records.length,originalSaveDatesAvailable:false,error:null,detail:'Imported through the connected Savee account. Recurring refreshes require the Codex automation to run on this computer. Original save dates are not supplied by this connector; new references use their import week. Existing dates and personal organisation are preserved.'});
  return {...counts,total:records.length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const file=process.argv[2];if(!file)throw new Error('Usage: node scripts/inspiration/savee-connector.mjs PRIVATE_BATCH_JSON');
  const root=process.cwd(),dbFile=path.join(root,'.private','inspiration.sqlite');mkdirSync(path.dirname(dbFile),{recursive:true,mode:0o700});
  const db=new InspirationDatabase(dbFile);db.db.exec('PRAGMA busy_timeout=5000');chmodSync(dbFile,0o600);
  try{const batch=JSON.parse(readFileSync(file,'utf8'));console.log(JSON.stringify(importSaveeConnector(db,batch)));}finally{db.close();}
}
