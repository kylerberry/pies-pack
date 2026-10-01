import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PANES, batchTasks, planTabLayout } from '../src/pies-fanout/core.js';

test('planTabLayout keeps small batches in one row of at most three columns', () => {
  assert.deepEqual(planTabLayout(['a']), { cols: 1, top: ['a'], bottom: [] });
  assert.deepEqual(planTabLayout(['a', 'b']), { cols: 2, top: ['a', 'b'], bottom: [] });
  assert.deepEqual(planTabLayout(['a', 'b', 'c']), { cols: 3, top: ['a', 'b', 'c'], bottom: [] });
});

test('planTabLayout splits larger batches into two balanced rows', () => {
  const four = planTabLayout(['a', 'b', 'c', 'd']);
  assert.equal(four.cols, 2);
  assert.deepEqual(four.top, ['a', 'b']);
  assert.deepEqual(four.bottom, ['c', 'd']);

  const five = planTabLayout(['a', 'b', 'c', 'd', 'e']);
  assert.equal(five.cols, 3);
  assert.deepEqual(five.top, ['a', 'b', 'c']);
  assert.deepEqual(five.bottom, ['d', 'e']);

  const six = planTabLayout(['a', 'b', 'c', 'd', 'e', 'f']);
  assert.equal(six.cols, 3);
  assert.deepEqual(six.top, ['a', 'b', 'c']);
  assert.deepEqual(six.bottom, ['d', 'e', 'f']);
});

test('every bottom pane has a top column to split from, up to MAX_PANES per tab', () => {
  for (let count = 1; count <= MAX_PANES; count++) {
    const tasks = Array.from({ length: count }, (_, i) => `t${i}`);
    const layout = planTabLayout(tasks);
    assert.ok(layout.cols <= 3);
    assert.ok(layout.bottom.length <= layout.top.length);
    assert.equal(layout.top.length + layout.bottom.length, count);
  }
});

test('planTabLayout rejects empty and oversize batches', () => {
  assert.throws(() => planTabLayout([]), /non-empty/);
  assert.throws(
    () => planTabLayout(Array.from({ length: MAX_PANES + 1 }, (_, i) => `t${i}`)),
    /at most 6/,
  );
});

test('batchTasks chunks launches into MAX_PANES tabs', () => {
  const batches = batchTasks(Array.from({ length: 14 }, (_, i) => `t${i}`));
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [6, 6, 2],
  );
  assert.deepEqual(batchTasks(['only']), [['only']]);
});
