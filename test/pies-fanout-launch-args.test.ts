import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentArgs, normalizeLaunchInput } from '../src/pies-fanout/core.js';

const base = { userApproved: true, tasks: ['Fix login crash'] };

test('normalizeLaunchInput trims and drops empty tasks', () => {
  const options = normalizeLaunchInput(
    { ...base, tasks: ['  Fix login crash  ', '   ', '\tAdd audit log\t'] },
    { model: 'm' },
  );
  assert.deepEqual(options.tasks, ['Fix login crash', 'Add audit log']);
});

test('normalizeLaunchInput rejects missing approval, empty task lists, and oversize launches', () => {
  assert.throws(() => normalizeLaunchInput({ ...base, userApproved: false }, {}), /userApproved/);
  assert.throws(() => normalizeLaunchInput({ ...base, tasks: ['  '] }, {}), /non-empty task/);
  const many = Array.from({ length: 61 }, (_, i) => `task-${i}`);
  assert.throws(
    () => normalizeLaunchInput({ ...base, tasks: many }, { model: 'm' }),
    /at most 60/i,
  );
});

test('defaults match the wizard contract and direct forces operator authority', () => {
  const defaults = normalizeLaunchInput(base, { model: 'zai/glm-5.3', thinkingLevel: 'low' });
  assert.equal(defaults.protocol, 'pies');
  assert.equal(defaults.authority, 'operator');
  assert.equal(defaults.model, 'zai/glm-5.3');
  assert.equal(defaults.thinking, 'low');
  assert.equal(defaults.monitorIntervalMinutes, 10);

  const direct = normalizeLaunchInput(
    { ...base, protocol: 'direct', authority: 'agent' },
    { model: 'm' },
  );
  assert.equal(direct.authority, 'operator');
});

test('model must resolve from input or session', () => {
  assert.throws(() => normalizeLaunchInput(base, {}), /No active model/);
  const explicit = normalizeLaunchInput({ ...base, model: 'openai/gpt-5.6' }, {});
  assert.equal(explicit.model, 'openai/gpt-5.6');
});

test('custom protocol requires a prefix; other protocols ignore one', () => {
  assert.throws(
    () => normalizeLaunchInput({ ...base, protocol: 'custom' }, { model: 'm' }),
    /customPrefix/,
  );
  const custom = normalizeLaunchInput(
    { ...base, protocol: 'custom', customPrefix: ' /pstack ' },
    { model: 'm' },
  );
  assert.equal(custom.customPrefix, '/pstack');
  const pies = normalizeLaunchInput({ ...base, customPrefix: 'ignored' }, { model: 'm' });
  assert.equal(pies.customPrefix, 'ignored');
});

test('buildAgentArgs emits model and thinking flags in launch order', () => {
  assert.deepEqual(buildAgentArgs('zai/glm-5.3', 'high'), [
    '--model',
    'zai/glm-5.3',
    '--thinking',
    'high',
  ]);
});
