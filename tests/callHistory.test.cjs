const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/callHistory.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
test('history uses server duration rather than the local clock', () => {
 assert.equal(exportsObject.callDuration({ duration_seconds: 23, connected_at: '2026-10-03T00:00:00Z', ended_at: '2026-10-03T00:59:00Z' }), 23);
 assert.equal(exportsObject.callDuration({ duration_seconds: 0, connected_at: null, ended_at: '2026-10-03T00:59:00Z' }), 0);
});
test('history preview has type, direction and terminal result for either participant', () => {
 const call={type:'video',caller_id:'a',callee_id:'b',reason:'completed'};
 assert.equal(exportsObject.callPreview(call,'a', key=>key), 'calls.video · calls.outgoing · calls.errors.completed');
 assert.equal(exportsObject.callPreview(call,'b', key=>key), 'calls.video · calls.received · calls.errors.completed');
});
