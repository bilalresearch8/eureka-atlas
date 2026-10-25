'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'benchmark-fallback.js'),'utf8');
new vm.Script(source,{filename:'benchmark-fallback.js'});
const target={
  DOI:'10.1234/target-2026',
  type:'journal-article',
  title:['Durable selective electrochemical lithium extraction from brines'],
  'container-title':['Journal of Electrochemical Research'],
  'published-online':{'date-parts':[[2026,10,20]]}
};
const peer={
  DOI:'10.1234/peer-2026',
  type:'journal-article',
  title:['Continuous electrochemical lithium extraction from brines with selective membranes'],
  'container-title':['Energy Materials Journal'],
  'published-online':{'date-parts':[[2026,9,21]]}
};
const irrelevant={
  DOI:'10.1234/irrelevant-2026',
  type:'journal-article',
  title:['Catalytic synthesis of sustainable polymers'],
  'container-title':['Chemistry Letters'],
  'published-online':{'date-parts':[[2026,10,12]]}
};
const invalidDate={...peer,DOI:'10.1234/partial-2026','published-online':{'date-parts':[[2026,10]]}};
let doiRequests=0,searchRequests=0;
const ctx={
  URL,CONTACT_EMAIL:'test@example.com',
  normalizeDoi:v=>String(v||'').toLowerCase().replace(/^https?:\/\/doi\.org\//,'').trim(),
  authoritativePublicationDate:it=>{
    const p=it['published-online']?.['date-parts']?.[0];
    return p?.length===3?p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[2]).padStart(2,'0'):'';
  },
  fetchRetry:async url=>{
    if(url.includes('/works/10.1234%2Ftarget-2026')){doiRequests++;return {message:target};}
    if(url.includes('/works?')){searchRequests++;return {message:{items:[target,peer,irrelevant,invalidDate]}};}
    throw new Error('Unexpected request: '+url);
  }
};
vm.runInNewContext(source+'\nglobalThis.testHooks={atlasExtractDOI,atlasRelatedness,atlasMetadataBenchmark,atlasCrossrefDOI,atlasEvidenceGuard,atlasCrossrefIdentity,atlasSafeUrl};',ctx);
const h=ctx.testHooks;
(async()=>{
  assert.equal(h.atlasExtractDOI('https://doi.org/10.1234/target-2026.'),'10.1234/target-2026');
  assert.equal(h.atlasExtractDOI('no DOI found'),'');
  assert.equal(h.atlasCrossrefIdentity(invalidDate),null,'a month-only record cannot claim an exact date');
  assert.ok(h.atlasRelatedness(target.title[0],peer.title[0])>0.32);
  assert.equal(h.atlasRelatedness(target.title[0],irrelevant.title[0]),0);
  const schema={metrics:['Lithium recovery (%)','Separation factor','Energy consumption (kWh/kg)'],industrial:['Continuous throughput','Energy intensity']};
  const first=await h.atlasMetadataBenchmark('DOI: 10.1234/target-2026',schema,8,null,'Gemini quota reached');
  assert.equal(first.fallback,true);
  assert.equal(first.analysis_mode,'Crossref metadata-only fallback');
  assert.equal(first.target.doi,'10.1234/target-2026');
  assert.equal(first.comparators.length,1);
  assert.equal(first.comparators[0].doi,'10.1234/peer-2026');
  assert.equal(first.comparators[0].measurements_verified,false);
  assert.equal(first.verdict.scientific_benchmark_position,null,'a metadata-only result cannot assert a score');
  assert.equal(first.metric_comparison[0].sota_best,'Not verified');
  assert.equal(first.metric_comparison[0].status,'unknown');
  assert.equal(first.industrial_gap[0].status,'unknown');
  assert.equal(doiRequests,1);
  await h.atlasCrossrefDOI('10.1234/target-2026');
  assert.equal(doiRequests,1,'a verified DOI record is cached within the tab');
  await h.atlasMetadataBenchmark('10.1234/target-2026',schema,8);
  assert.equal(searchRequests,1,'query metadata is cached within the tab');
  const claimed={metric_comparison:[
    {metric:'Lithium recovery (%)',sota_best:'98%',sota_source_doi:'10.1234/peer-2026',sota_conditions:'lab conditions',status:'ahead',comparability:'yes',industrial_target:'90%'},
    {metric:'Energy consumption (kWh/kg)',sota_best:'5',sota_source_doi:'10.1234/invented',sota_conditions:'industrial',status:'ahead',comparability:'yes'}
  ]};
  const guarded=h.atlasEvidenceGuard(claimed,[{doi:'10.1234/peer-2026',identity_verified:true,metrics:[]}]);
  assert.equal(guarded.metric_comparison[0].sota_best,'Not source-linked','DOI identity is not numeric performance verification');
  assert.equal(guarded.metric_comparison[0].status,'unknown');
  assert.equal(guarded.metric_comparison[1].sota_source_doi,'');
  assert.equal(guarded.metric_comparison[0].industrial_target,'No authoritative target verified');
  assert.equal(h.atlasSafeUrl('javascript:alert(1)'),'');
  const partial=await h.atlasMetadataBenchmark('',schema,8,{title:target.title[0],metrics:[
    {metric:'Lithium recovery (%)',value:'78',unit:'%',evidence_location:'Page 4 Figure 3'}
  ]},'Gemini rate-limited after reading the PDF');
  assert.match(partial.metric_comparison[0].target_value,/78.*PDF AI extraction/,'previously extracted PDF target values remain labeled');
  const noDocument=await h.atlasMetadataBenchmark('',schema,8,null,'Quota');
  assert.equal(noDocument.verdict.scientific_benchmark_position,null);
  console.log('PASS: DOI verification, strict dates, cached metadata, numerical evidence guards, quota fallback and partial-PDF preservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
