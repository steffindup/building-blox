// Brain Trail math, checked against the US Common Core grade it is meant for: node --test tests/math.test.mjs
// Generates thousands of puzzles for every grade and step and checks each against what that grade covers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/build/index.html', import.meta.url), 'utf8');
const code = html.slice(html.indexOf('const MATH_GRADES='), html.indexOf('var mq=null'));
const M = new Function('clamp', 'brickIcon', 'curPlayer', 'gameStore', 'gameStoreSet', 'playersSave', 'renderWho', 'trail', 'game', 'window',
  code + '\nreturn {MATH_GRADES,MATH_TOPICS,gradeFor,makePuzzle,puzzleChoices,rungOf,gradeOfRung,stepOfRung,rungLimits,mathRung,levelStep};')(
  (v, a, b) => Math.max(a, Math.min(b, v)), () => 'x.png', () => ({}), () => ({}), () => {}, () => {}, () => {}, 'brain', null, {});
const N = 3000;
// What each grade may use (first grade a thing appears in Common Core) and how big answers may get
const FIRST = { times: 3, divide: 3, parens: 5, fraction: 5, percent: 6, power: 6, variable: 6, negative: 7, root: 8 };
const MAX_ANSWER = { '-1': 10, 0: 10, 1: 100, 2: 999, 3: 999, 4: 9999, 5: 99000 };
const uses = (q) => ({
  times: /×/.test(q), divide: /÷/.test(q), parens: /\(/.test(q), fraction: /\d\/\d/.test(q), percent: /%/.test(q),
  power: /[²³⁴⁵⁶^]|power of/.test(q), variable: /\dx\b|\bx\b/.test(q), negative: /(^|[\s(])−\d/.test(q), root: /[√∛]/.test(q),
});

test('age maps to the US school grade, from the time of the school year', () => {
  const oct = new Date(2026, 9, 15), apr = new Date(2027, 3, 15), jul = new Date(2027, 6, 1);
  assert.equal(M.gradeFor(8, oct), 3); assert.equal(M.gradeFor(8, apr), 2); assert.equal(M.gradeFor(8, jul), 2);
  assert.equal(M.gradeFor(6, oct), 1); assert.equal(M.gradeFor(10, oct), 5); assert.equal(M.gradeFor(13, oct), 8);
  assert.equal(M.gradeFor(4, oct), -1); assert.equal(M.gradeFor(5, oct), 0); assert.equal(M.gradeFor(15, oct), 8);
  assert.equal(M.gradeFor(null, oct), 2, 'no age: 2nd grade');
});

test('later levels get harder inside the grade, never above it; adapting stays within one grade up, two down', () => {
  for (let g = -1; g <= 8; g++) {
    for (let lvl = 0; lvl < 14; lvl++) assert.equal(M.gradeOfRung(M.mathRung(g, lvl, 0)), g, `grade ${g} level ${lvl + 1}`);
    assert.deepEqual([0, 1, 2].map((s) => M.stepOfRung(M.mathRung(g, [0, 5, 10][s], 0))), [0, 1, 2]);
    const L = M.rungLimits(g);
    assert.ok(M.gradeOfRung(L.hi) <= Math.min(8, g + 1) && M.stepOfRung(L.hi) === (g + 1 > 8 ? M.stepOfRung(L.hi) : 0), `top for grade ${g}`);
    assert.ok(M.gradeOfRung(L.lo) >= Math.max(-1, g - 2));
    assert.ok(M.mathRung(g, 13, 99) <= L.hi && M.mathRung(g, 0, -99) >= L.lo);
    for (let lvl = 0; lvl < 14; lvl++) assert.equal(M.gradeOfRung(M.mathRung(g, lvl, 3)), g, `grade ${g} level ${lvl + 1}: adapting up stays in the grade until it has stepped up`);
    assert.ok(M.gradeOfRung(M.mathRung(g, 13, 3, true)) <= Math.min(8, g + 1));
  }
});

test('5th grade: fractions of numbers come up at every step, not only the hardest', () => {
  for (let s = 0; s < 3; s++) { let n = 0; for (let i = 0; i < 600; i++) if (/\d\/\d+ of \d+/.test(M.makePuzzle(M.rungOf(5, s)).q)) n++;
    assert.ok(n > 600 * 0.15, `step ${s + 1}: ${n} of 600 were fractions of numbers`); }
});

for (let rung = 0; rung < 30; rung++) {
  const g = Math.floor(rung / 3) - 1, s = rung % 3;
  test(`${M.MATH_GRADES[g + 1]}, step ${s + 1}: ${N} puzzles stay within the grade`, () => {
    const seen = new Set();
    for (let i = 0; i < N; i++) {
      const P = M.makePuzzle(rung), q = P.q;
      seen.add(q + '=' + P.a);
      assert.equal(typeof q, 'string'); assert.ok(q.length > 3, q);
      assert.ok(Number.isInteger(P.a), `${q} → ${P.a} is not a whole number`);
      assert.ok(P.hint && !/brackets|times by|maths/i.test(P.hint), `US wording in the hint: ${P.hint}`);
      if (g < 7) assert.ok(P.a >= 0, `${q} → ${P.a}: negative answers start in 7th grade`);
      if (MAX_ANSWER[g] != null) assert.ok(P.a <= MAX_ANSWER[g], `${q} → ${P.a} is too big for ${M.MATH_GRADES[g + 1]}`);
      const u = uses(q);
      for (const [k, first] of Object.entries(FIRST)) if (u[k]) assert.ok(g >= first, `"${q}" uses ${k}, which starts in grade ${first}`);
      // numbers in the question stay in range for the youngest grades
      const nums = (q.match(/\d+/g) || []).map(Number);
      if (g <= 0) assert.ok(nums.every((n) => n <= 10), `${q}: numbers to 10 in ${M.MATH_GRADES[g + 1]}`);
      if (g === 1) assert.ok(nums.every((n) => n <= 100), `${q}: numbers to 100 in 1st grade`);
      if (g === 3 && s < 2 && u.times) assert.ok(nums.every((n) => n <= 10), `${q}: facts within 10 × 10`);
      if (g === 3 && s < 2 && u.divide) assert.ok(P.a <= 10, `${q}: division facts within 100`);
      // the youngest pick from choices: the answer is there, four different numbers, none negative
      assert.equal(!!P.choice, g <= 1);
      if (P.choice) { const c = M.puzzleChoices(P.a); assert.ok(c.includes(P.a) && new Set(c).size === c.length && c.length >= 3 && c.every((n) => n >= 0), `${q}: ${c}`); }
    }
    assert.ok(seen.size >= 2, 'more than one kind of puzzle');
  });
}
