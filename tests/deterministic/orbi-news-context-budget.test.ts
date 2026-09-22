import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const script=path.resolve('scripts/ecc-orbi-news-context-budget.mjs');

test('News context budget reports layered loading model',()=>{
  const out=execFileSync(process.execPath,[script,'--json'],{encoding:'utf8'});
  const report=JSON.parse(out);
  assert.equal(report.schemaVersion,'orbi.news.context-budget.v1');
  assert.equal(report.loadingModel.alwaysInstructions,'persistent');
  assert.equal(report.loadingModel.discoverableSkills,'conditional');
  assert.equal(report.loadingModel.configReferences,'on-demand');
  assert.equal(report.files.filter((x:any)=>x.kind==='discoverable-skill').length,3);
  assert.ok(report.totals.persistentEstimateTokens>0);
  assert.ok(report.totals.discoverableIfAllLoadedTokens>0);
  assert.ok(report.totals.configIfAllLoadedTokens>0);
});

test('News context budget does not classify project skills as persistent',()=>{
  const out=execFileSync(process.execPath,[script,'--json'],{encoding:'utf8'});
  const report=JSON.parse(out);
  for(const row of report.files.filter((x:any)=>x.path.includes('/skills/'))){
    assert.equal(row.kind,'discoverable-skill');
  }
});
