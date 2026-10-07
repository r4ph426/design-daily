import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicReference,publishReferences,readPublicFeed} from '../src/inspiration/publicFeed.js';
import {weeklyArchive} from '../src/inspiration/weeks.js';
const record={id:'private-local-id',title:'Reference',originalUrl:'https://savee.com/i/example/',capturedAt:'2020-01-01T00:00:00Z',note:'PRIVATE NOTE',projects:['PRIVATE PROJECT'],tags:['PRIVATE TAG'],context:'PRIVATE CONTEXT',providerRefs:[{provider:'savee',id:'stable-id',url:'https://savee.com/i/example/',image:'https://images.example.com/photo.jpg',sourceUrl:'https://example.com/source',token:'SECRET'}]};
test('publication exposes only approved visual/source fields and a confirmed week',()=>{
 const publicItem=publicReference(record,'2026-10-05');const serialized=JSON.stringify(publicItem);
 for(const privateValue of ['private-local-id','PRIVATE NOTE','PRIVATE PROJECT','PRIVATE TAG','PRIVATE CONTEXT','SECRET','2020-01-01'])assert.ok(!serialized.includes(privateValue));
 assert.equal(publicItem.id,'savee-stable-id');assert.equal(publicItem.inspirationDate,'2026-10-05');assert.equal(publicItem.image,record.providerRefs[0].image);
 assert.throws(()=>publicReference(record,'2026-10-07'),/Monday/);
 assert.throws(()=>publicReference({...record,providerRefs:[{...record.providerRefs[0],image:'https://127.0.0.1/private'}]},'2026-10-05'),/Private/);
});
test('republication is idempotent and preserves previous weekly pages',()=>{
 const first=publishReferences([record],{weekKey:'2026-10-05'});
 const again=publishReferences([record],{weekKey:'2026-10-05',previous:first});assert.equal(again.items.length,1);
 const next=publishReferences([{...record,providerRefs:[{...record.providerRefs[0],id:'next-id',video:'https://images.example.com/motion.mp4',image:null}],image:null}],{weekKey:'2026-10-12',previous:again});
 assert.equal(next.items.length,2);assert.equal(readPublicFeed(next)[1].video,'https://images.example.com/motion.mp4');
 assert.equal(weeklyArchive(readPublicFeed(next),'2026-10-12').groups.get('2026-10-05').length,1);
});
test('published snapshots contain only public previews and valid weekly references',()=>{
 const feed=JSON.parse(readFileSync('public/data/inspiration.json','utf8'));const items=readPublicFeed(feed);
 assert.ok(items.length>0);
 assert.ok(items.every(i=>i.note===''&&i.projects.length===0&&i.tags.length===0));
 assert.ok(items.every(i=>(!i.image||i.image.startsWith('https:'))&&(!i.video||i.video.startsWith('https:'))));
 assert.ok(items.every(i=>i.providerRefs.length===1&&i.id===`savee-${i.providerRefs[0].id}`));
});
