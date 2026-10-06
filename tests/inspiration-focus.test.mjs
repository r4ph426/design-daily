import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceSource,tidyTags,fitImage} from '../src/inspiration/focus.js';

test('the focus link prefers the original reference, preserves meaningful URL parameters and rejects unsafe candidates',()=>{
 const item={originalUrl:'https://savee.com/i/abc/',providerRefs:[{sourceUrl:'javascript:alert(1)'},{sourceUrl:'http://127.0.0.1/internal'},{sourceUrl:'https://www.example.com/work?id=42&utm_source=savee'}]};
 assert.deepEqual(referenceSource(item),{href:'https://www.example.com/work?id=42',label:'example.com'});
 assert.deepEqual(referenceSource({originalUrl:item.originalUrl}),{href:'https://savee.com/i/abc/',label:'savee.com'});
 assert.equal(referenceSource({originalUrl:'file:///private/file'}),null);
});
test('optional tags normalise input and duplicates without changing existing spelling',()=>{
 assert.deepEqual(tidyTags(['#Motion',' motion ','   ','UI   patterns','ui patterns']),['Motion','UI patterns']);
 assert.equal(tidyTags(Array.from({length:20},(_,i)=>`tag${i}`)).length,12);
});
test('focus fits portrait, landscape and long screenshots without cropping',()=>{
 assert.deepEqual(fitImage(1600,800,1000,600),{width:1000,height:500});
 assert.deepEqual(fitImage(800,3200,1000,600),{width:150,height:600});
 assert.deepEqual(fitImage(400,600,366,700),{width:366,height:549});
});
