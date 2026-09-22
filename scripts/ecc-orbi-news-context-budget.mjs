#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const files=[
  ['always-instructions','AGENTS.md'],
  ['discoverable-skill','.agents/skills/orbi-news-verification-review/SKILL.md'],
  ['discoverable-skill','.agents/skills/orbi-news-publication-authority-review/SKILL.md'],
  ['discoverable-skill','.agents/skills/orbi-news-agent-harness/SKILL.md'],
  ['config-reference','.orbi/ecc-profile.json'],
  ['config-reference','.orbi/repository-adapter.json'],
  ['config-reference','.orbi/orbi-news-agent-observation-v1.schema.json']
];

const estimate=(text)=>Math.ceil(Math.max(text.length/4,text.trim().split(/\s+/).length*1.3));

let persistent=0;
let discoverable=0;
let config=0;
const rows=[];

for(const [kind,relative] of files){
  const full=path.join(root,relative);
  if(!fs.existsSync(full)) throw new Error(`CONTEXT_BUDGET_FILE_MISSING:${relative}`);
  const text=fs.readFileSync(full,'utf8');
  const tokens=estimate(text);
  const lines=text.split(/\r?\n/).length;
  rows.push({kind,path:relative,lines,estimatedTokens:tokens});
  if(kind==='always-instructions') persistent+=tokens;
  if(kind==='discoverable-skill') discoverable+=tokens;
  if(kind==='config-reference') config+=tokens;
}

const report={
  schemaVersion:'orbi.news.context-budget.v1',
  loadingModel:{
    alwaysInstructions:'persistent',
    discoverableSkills:'conditional',
    configReferences:'on-demand'
  },
  totals:{
    persistentEstimateTokens:persistent,
    discoverableIfAllLoadedTokens:discoverable,
    configIfAllLoadedTokens:config
  },
  files:rows
};

if(process.argv.includes('--json')) console.log(JSON.stringify(report,null,2));
else{
  for(const row of rows){
    console.log(`${row.kind}\t${row.lines} lines\t~${row.estimatedTokens} tokens\t${row.path}`);
  }
  console.log(`persistent_estimate\t~${persistent}`);
  console.log(`discoverable_if_all_loaded\t~${discoverable}`);
  console.log(`config_if_all_loaded\t~${config}`);
}
