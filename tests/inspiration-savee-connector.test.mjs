import test from 'node:test';
import assert from 'node:assert/strict';
import {InspirationDatabase} from '../scripts/inspiration/database.mjs';
import {parseSaveePage,importSaveeConnector} from '../scripts/inspiration/savee-connector.mjs';
const page=(end='End of results.')=>`2 saves:\n\n1. Poster reference\nA grounded description.\n   savee: https://savee.com/i/abcdefg/\n   source: https://example.com/poster?utm_source=savee&variant=blue\n   image 1200×1600: https://cdn.example.com/poster.avif\n   private\n   id: 0123456789abcdef01234567\n\n2. Motion reference\n   savee: https://savee.com/i/hijklmn/\n   video 640×945: https://cdn.example.com/motion.mp4\n   id: 123456789abcdef012345678\n\n${end}`;
test('connector parser retains separate visual IDs, metadata, source parameters and video context',()=>{
 const result=parseSaveePage(page());assert.equal(result.records.length,2);assert.equal(result.cursor,null);assert.equal(result.records[0].provider.description,'A grounded description.');assert.equal(result.records[0].provider.sourceUrl,'https://example.com/poster?variant=blue');assert.equal(result.records[1].provider.image,null);assert.equal(result.records[1].provider.video,'https://cdn.example.com/motion.mp4');assert.equal(result.records[1].provider.savedAt,null);
});
test('repeated connector snapshots are idempotent and preserve personal organisation and dates',()=>{
 const db=new InspirationDatabase(':memory:'),batch={account:'ael_rough',complete:true,pages:[page()]};
 assert.deepEqual(importSaveeConnector(db,batch),{added:2,changed:0,total:2});const item=db.all()[0];db.put({...item,note:'Use its composition',tags:['branding'],projects:['Project'],favourite:true,inspirationDate:'2026-09-01'});
 assert.deepEqual(importSaveeConnector(db,batch),{added:0,changed:0,total:2});assert.equal(db.all()[0].note,'Use its composition');assert.equal(db.all()[0].inspirationDate,'2026-09-01');
 const updated={...batch,pages:[page().replace('A grounded description.','New provider context.')]};assert.equal(importSaveeConnector(db,updated).changed,1);assert.deepEqual(db.all()[0].projects,['Project']);assert.equal(db.all()[0].favourite,true);assert.equal(db.get('saveeSync').transport,'codex-connector');db.close();
});
test('incomplete pagination, count mismatch, account mismatch and unsafe URLs fail before database writes',()=>{
 const db=new InspirationDatabase(':memory:');for(const batch of [{account:'other',complete:true,pages:[page()]},{account:'ael_rough',complete:false,pages:[page()]},{account:'ael_rough',complete:true,pages:[page('More results are available. To get the next page, call this tool again with cursor: opaque-next')]},{account:'ael_rough',complete:true,pages:[page().replace('2 saves:','3 saves:')]},{account:'ael_rough',complete:true,pages:[page().replace('https://cdn.example.com/poster.avif','http://127.0.0.1/private')]}])assert.throws(()=>importSaveeConnector(db,batch));assert.equal(db.all().length,0);assert.equal(db.get('saveeSync'),null);db.close();
});
