#!/usr/bin/env node
import fs from 'node:fs';

const file=process.argv[2];
const fail=(m)=>{console.error(`INVALID: ${m}`);process.exitCode=1;};
const nonEmpty=(v)=>typeof v==='string'&&v.trim().length>0;
const allowedTop=new Set(['schemaVersion','status','summary','nextActions','artifacts','evidence','authorityImpact','humanApprovalRequired','externalEvidenceRequired','recovery']);
const statuses=new Set(['success','warning','error']);
const evidenceKinds=new Set(['git','test','ci','file','artifact','runtime','external']);
const verification=new Set(['verified','observed','unverified']);
const authorityKeys=[
  'productionActivationProfile','runtimeEnabled','autonomyLevel',
  'automationToggles','killSwitches','canonicalFactualClaims',
  'webPublication','socialPublication','secretOrProviderConfig'
];

if(!file) fail('usage: node scripts/validate-orbi-news-agent-observation.mjs <observation.json>');
let value;
if(file){
  try{value=JSON.parse(fs.readFileSync(file,'utf8'));}
  catch(e){fail(`cannot parse JSON: ${e.message}`);}
}

if(value&&process.exitCode!==1){
  if(typeof value!=='object'||Array.isArray(value)) fail('top-level value must be an object');
  for(const k of Object.keys(value)) if(!allowedTop.has(k)) fail(`unknown top-level field: ${k}`);
  if(value.schemaVersion!=='orbi.news.agent.observation.v1') fail('schemaVersion must be orbi.news.agent.observation.v1');
  if(!statuses.has(value.status)) fail('invalid status');
  if(!nonEmpty(value.summary)) fail('summary must be non-empty');
  for(const k of ['nextActions','artifacts','evidence']) if(!Array.isArray(value[k])) fail(`${k} must be an array`);
  if(Array.isArray(value.nextActions)&&value.nextActions.some(x=>!nonEmpty(x))) fail('nextActions entries must be non-empty strings');
  if(Array.isArray(value.artifacts)&&value.artifacts.some(x=>!nonEmpty(x))) fail('artifacts entries must be non-empty strings');

  if(Array.isArray(value.evidence)) for(const e of value.evidence){
    if(!e||typeof e!=='object'||Array.isArray(e)){fail('evidence entries must be objects');continue;}
    for(const k of Object.keys(e)) if(!['kind','reference','verification'].includes(k)) fail(`unknown evidence field: ${k}`);
    if(!evidenceKinds.has(e.kind)) fail('invalid evidence.kind');
    if(!nonEmpty(e.reference)) fail('evidence.reference must be non-empty');
    if(!verification.has(e.verification)) fail('invalid evidence.verification');
  }

  const a=value.authorityImpact;
  if(!a||typeof a!=='object'||Array.isArray(a)) fail('authorityImpact must be an object');
  else{
    for(const k of Object.keys(a)) if(!authorityKeys.includes(k)) fail(`unknown authorityImpact field: ${k}`);
    for(const k of authorityKeys) if(typeof a[k]!=='boolean') fail(`authorityImpact.${k} must be boolean`);
  }

  for(const k of ['humanApprovalRequired','externalEvidenceRequired']){
    if(k in value&&typeof value[k]!=='boolean') fail(`${k} must be boolean`);
  }

  if(value.status==='error'){
    const r=value.recovery;
    if(!r||typeof r!=='object'||Array.isArray(r)) fail('error observations require recovery');
    else{
      for(const k of Object.keys(r)) if(!['rootCauseHint','safeRetry','stopCondition'].includes(k)) fail(`unknown recovery field: ${k}`);
      for(const k of ['rootCauseHint','safeRetry','stopCondition']) if(!nonEmpty(r[k])) fail(`recovery.${k} must be non-empty`);
    }
  }

  if(process.exitCode!==1) console.log('VALID orbi.news.agent.observation.v1');
}
