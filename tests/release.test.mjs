// The app's release file (mobile/store/release.json) and the version each build carries. See mobile/scripts/release.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildVersion, problems, compare, next, projectVersion, readRelease, RELEASE_FILE } from '../mobile/scripts/release.mjs';

test('versions compare and step as numbers, not as text', () => {
  assert.equal(compare('1.1.10', '1.1.9'), 1); assert.equal(compare('1.2', '1.2.0'), 0); assert.equal(compare('1.1.5', '1.2'), -1);
  assert.equal(next('1.1.5'), '1.1.6'); assert.equal(next('1.1.9'), '1.1.10'); assert.equal(next('1.2'), '1.2.1');
});

test('an ordinary build keeps the project version until that version has been sent for review, then moves to the next', () => {
  assert.equal(buildVersion('1.1.5', null), '1.1.5');
  assert.equal(buildVersion('1.1.5', { version: '1.1.4', whats_new: 'x' }), '1.1.5');   // an older release changes nothing
  assert.equal(buildVersion('1.1.5', { version: '1.1.5', whats_new: 'x' }), '1.1.6');
  assert.equal(buildVersion('1.1.5', { version: '1.1.7', whats_new: 'x' }), '1.1.8');
  assert.equal(buildVersion('1.1.5', { version: 'soon' }), '1.1.5');                    // a broken file changes nothing
});

test('a release file is refused with a plain reason when it cannot be sent', () => {
  const ok = { version: '1.1.5', whats_new: 'Four new special pieces in Bibi\'s Weekly Bloppit.' };
  assert.deepEqual(problems(ok, '1.1.5'), []);
  assert.deepEqual(problems({ ...ok, replace_waiting: true }, '1.1.5'), []);
  assert.match(problems(null, '1.1.5')[0], /missing/);
  assert.match(problems({ ...ok, version: '1.1.4' }, '1.1.5')[0], /older/);
  assert.match(problems({ ...ok, version: 'v1.1.5' }, '1.1.5')[0], /must look like/);
  assert.match(problems({ ...ok, whats_new: '' }, '1.1.5')[0], /too short/);
  assert.match(problems({ ...ok, whats_new: 'x'.repeat(4001) }, '1.1.5')[0], /4,000/);
  assert.match(problems({ ...ok, replace_waiting: 'yes' }, '1.1.5')[0], /true or false/);
});

test('the release file in the repo, if there is one, can be sent, and the project has a version', () => {
  const v = projectVersion('mobile/ios/App/App.xcodeproj/project.pbxproj');
  assert.match(v, /^\d+\.\d+(\.\d+)?$/);
  if (fs.existsSync(RELEASE_FILE)) {
    const rel = readRelease();
    // a release already sent may be older than the project once the project moves on; it must still be well formed
    assert.deepEqual(problems(rel, rel && rel.version || v), []);
  }
});
