import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const validator=path.resolve('scripts/validate-orbi-news-agent-observation.mjs');
const base={
  schemaVersion:'orbi.news.agent.observation.v1',
  status:'success',
  summary:'News engineering verification completed.',
  nextActions:['Record evidence.'],
  artifacts:['docs/ecc/ORBI_NEWS_ECC_P6_AGENT_HARNESS.md'],
  evidence:[{kind:'ci',reference:'workflow-run:example',verification:'verified'}],
  authorityImpact:{
    productionActivationProfile:false,
    runtimeEnabled:false,
    autonomyLevel:false,
    automationToggles:false,
    killSwitches:false,
    canonicalFactualClaims:false,
    webPublication:false,
    socialPublication:false,
    secretOrProviderConfig:false
  },
  humanApprovalRequired:false,
  externalEvidenceRequired:false
};
const withFile=(value,fn)=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'orbi-news-agent-'));
  const file=path.join(dir,'observation.json');
  fs.writeFileSync(file,JSON.stringify(value,null,2));
  try{return fn(file);}finally{fs.rmSync(dir,{recursive:true,force:true});}
};

test('accepts valid News observation',()=>withFile(base,file=>{
  const out=execFileSync(process.execPath,[validator,file],{encoding:'utf8'});
  assert.match(out,/VALID orbi\.news\.agent\.observation\.v1/);
}));

test('requires recovery for error observations',()=>withFile({...base,status:'error'},file=>{
  const r=spawnSync(process.execPath,[validator,file],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/error observations require recovery/);
}));

test('accepts explicit safe recovery',()=>withFile({
  ...base,
  status:'error',
  recovery:{
    rootCauseHint:'Publication evidence unavailable.',
    safeRetry:'Retry after obtaining new verified external evidence.',
    stopCondition:'Stop before publication or activation authority would be crossed.'
  }
},file=>{
  assert.match(execFileSync(process.execPath,[validator,file],{encoding:'utf8'}),/VALID/);
}));

test('rejects unknown top-level authority widening',()=>withFile({...base,autoPublish:true},file=>{
  const r=spawnSync(process.execPath,[validator,file],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/unknown top-level field/);
}));

test('requires every authority domain to be explicit boolean',()=>withFile({
  ...base,
  authorityImpact:{...base.authorityImpact,webPublication:'no'}
},file=>{
  const r=spawnSync(process.execPath,[validator,file],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/authorityImpact\.webPublication must be boolean/);
}));
