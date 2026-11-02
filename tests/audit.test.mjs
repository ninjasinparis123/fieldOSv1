import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit,RULES} from '../src/audit.mjs';
test('twelve checks',()=>assert.equal(RULES.length,12));
test('unknown never certified',()=>{const r=audit({});assert.equal(r.coverage.unknown,12);assert.equal(r.readiness,'unverified');});
test('all-yes only self-reported',()=>{const r=audit(Object.fromEntries(RULES.map(x=>[x.id,'yes'])));assert.equal(r.checked_percent,100);assert.match(r.verification,/SELF_REPORTED/);});
test('no improves findings',()=>{const r=audit({permissions:'no'});assert.equal(r.top_findings[0].id,'permissions');});
test('invalid answer rejected',()=>assert.throws(()=>audit({permissions:'overwrite'}),/Invalid value/));
test('private fields ignored',()=>assert.equal(JSON.stringify(audit({api_key:'SECRET',permissions:'yes'})).includes('SECRET'),false));
