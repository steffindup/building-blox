// Sending a version to App Store review without App Store Connect (Steff, 18 Nov 2026).
//
// A release is one small file, mobile/store/release.json:
//   { "version": "1.1.5", "whats_new": "…what App Store players read under What's New…", "replace_waiting": false }
// Pushing a commit that changes that file starts Codemagic's "iOS to App Store review" workflow (codemagic.yaml): it
// builds that version, submits it for review with the What's New text, and Apple releases it when it is approved.
// "replace_waiting": true lets it take the place of a version that is still waiting for review (off unless asked:
// we never touch a build in review by accident).
//
// Every other app build goes to TestFlight as before. Once a version has been sent for review, those builds move on
// to the next version by themselves (1.1.5 sent → TestFlight builds are 1.1.6), so nobody has to bump it by hand.
//
//   node mobile/scripts/release.mjs build-version <project.pbxproj>   the version an ordinary build should carry
//   node mobile/scripts/release.mjs check <project.pbxproj>           is release.json fit to send? prints its version
//   node mobile/scripts/release.mjs whats-new | replace-waiting       parts of release.json, for the workflow
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASE_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'release.json');
const VERSION = /^\d+\.\d+(\.\d+)?$/;

export const parts = v => String(v).split('.').map(Number).concat(0, 0).slice(0, 3);
export function compare(a, b) { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; }
export function next(v) { const [a, b, c] = parts(v); return `${a}.${b}.${c + 1}`; }

// The version an ordinary (TestFlight) build carries: the project's own, unless that one has already been sent for
// review, in which case the one after it.
export function buildVersion(projectVersion, release) {
  return release && VERSION.test(release.version || '') && compare(release.version, projectVersion) >= 0 ? next(release.version) : projectVersion;
}

// What is wrong with a release file, as a list of plain sentences (empty when it can be sent).
export function problems(release, projectVersion) {
  const out = [];
  if (!release || typeof release !== 'object') return ['release.json is missing or is not a JSON object.'];
  if (!VERSION.test(release.version || '')) out.push('"version" must look like 1.1.5.');
  else if (compare(release.version, projectVersion) < 0) out.push(`"version" (${release.version}) is older than the app's version (${projectVersion}).`);
  const w = release.whats_new;
  if (typeof w !== 'string' || w.trim().length < 10) out.push('"whats_new" is missing or too short.');
  else if (w.length > 4000) out.push('"whats_new" is longer than the 4,000 characters Apple allows.');
  if ('replace_waiting' in release && typeof release.replace_waiting !== 'boolean') out.push('"replace_waiting" must be true or false.');
  return out;
}

export function readRelease(file = RELEASE_FILE) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
export function projectVersion(pbxproj) {
  const m = fs.readFileSync(pbxproj, 'utf8').match(/MARKETING_VERSION = ([0-9.]+);/);
  if (!m) throw new Error('No MARKETING_VERSION in ' + pbxproj);
  return m[1];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, pbx] = process.argv.slice(2), rel = readRelease();
  if (cmd === 'build-version') console.log(buildVersion(projectVersion(pbx), rel));
  else if (cmd === 'check') {
    const bad = problems(rel, projectVersion(pbx));
    if (bad.length) { console.error('This release cannot be sent:\n- ' + bad.join('\n- ')); process.exit(1); }
    console.log(rel.version);
  }
  else if (cmd === 'whats-new') process.stdout.write(rel ? String(rel.whats_new).trim() : '');
  else if (cmd === 'replace-waiting') console.log(rel && rel.replace_waiting === true ? 'yes' : 'no');
  else { console.error('Usage: release.mjs build-version|check <project.pbxproj> | whats-new | replace-waiting'); process.exit(2); }
}
