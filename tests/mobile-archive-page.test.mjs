import test from 'node:test';
import assert from 'node:assert/strict';
import { mobileArchivePage } from '../src/archive-reading-window.js';
const records = Array.from({ length: 60 }, (_, key) => ({ key }));
test('mobile archive stays bounded to eight questions and pages the full history', () => {
  assert.deepEqual(mobileArchivePage(records).records.map(r => r.key), [0,1,2,3,4,5,6,7]);
  const final = mobileArchivePage(records, { page: 8 });
  assert.equal(final.pages, 8);
  assert.deepEqual(final.records.map(r => r.key), [56,57,58,59]);
});
test('shared older questions open their containing page', () => {
  const result = mobileArchivePage(records, { selectedIndex: 58 });
  assert.equal(result.page, 8);
  assert.ok(result.records.some(r => r.key === 58));
});
test('filtering clamps pages, including empty and invalid requests', () => {
  assert.equal(mobileArchivePage(records.slice(0, 3), { page: 8 }).page, 1);
  assert.deepEqual(mobileArchivePage([], { page: -1 }).records, []);
  assert.equal(mobileArchivePage(records, { page: 'invalid' }).page, 1);
});
