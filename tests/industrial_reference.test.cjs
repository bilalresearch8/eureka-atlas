'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const industrialSource=fs.readFileSync(path.join(root,'benchmark-targets.js'),'utf8');
const fallbackSource=fs.readFileSync(path.join(root,'benchmark-fallback.js'),'utf8');
new vm.Script(industrialSource,{filename:'benchmark-targets.js'});
const ctx={};
vm.runInNewContext(industrialSource+'\nglobalThis.refs={ATLAS_DOE_REFERENCES,atlasRefValue,atlasRefCompare,atlasReferencePercent};',ctx);
const {ATLAS_DOE_REFERENCES,atlasRefValue,atlasRefCompare,atlasReferencePercent}=ctx.refs;

assert.equal(ATLAS_DOE_REFERENCES.pem.entries.find(x=>x.id==='current').value,3);
assert.equal(ATLAS_DOE_REFERENCES.alkaline.entries.find(x=>x.id==='current').value,1);
assert.equal(ATLAS_DOE_REFERENCES.soec.entries.find(x=>x.id==='current').value,1.2);
assert.equal(ATLAS_DOE_REFERENCES.pem.entries.find(x=>x.id==='lifetime').value,80000);
assert.equal(ATLAS_DOE_REFERENCES.pem.entries.find(x=>x.id==='pgm').value,0.5);
assert.equal(ATLAS_DOE_REFERENCES.soec.entries.find(x=>x.id==='stackEnergy').value,34);
for(const key of Object.keys(ATLAS_DOE_REFERENCES)){
  const t=ATLAS_DOE_REFERENCES[key];
  assert.ok(/^https:\/\/www\.energy\.gov\//.test(t.url));
  assert.ok(t.entries.length>=4);
  for(const entry of t.entries){
    assert.ok(Number.isFinite(entry.value)&&entry.value>0);
    assert.ok(entry.unit&&entry.basis&&['higher','lower'].includes(entry.direction));
  }
}

const power=ATLAS_DOE_REFERENCES.pem.entries.find(x=>x.id==='current');
const pgm=ATLAS_DOE_REFERENCES.pem.entries.find(x=>x.id==='pgm');
assert.equal(atlasRefValue(''),null);
assert.equal(atlasRefValue(' '),null);
assert.equal(atlasRefValue(-1),null);
assert.equal(atlasRefValue('Infinity'),null);
assert.equal(atlasRefValue(2.5),2.5);
assert.equal(atlasRefCompare('',power,true,'Fig 2').state,'empty');
assert.equal(atlasRefCompare(3.5,power,false,'Fig 2').state,'unknown','No automatic pass without declared conditions');
assert.equal(atlasRefCompare(3.5,power,true,'').state,'unknown','No pass without evidence location');
assert.equal(atlasRefCompare(3.5,power,true,'Fig 2').state,'ahead','Provisional, explicitly attested');
assert.equal(atlasRefCompare(2.9,power,true,'Fig 2').state,'behind');
assert.equal(atlasRefCompare(.3,pgm,true,'Fig 3').state,'ahead','Lower PGM better');
assert.equal(atlasRefCompare(.7,pgm,true,'Fig 3').state,'behind');
assert.equal(atlasReferencePercent(1.5,power),50);

const fallbackContext={
  URL,
  CONTACT_EMAIL:'test@example.com',
  normalizeDoi:v=>String(v||'').toLowerCase().replace(/^https?:\/\/doi\.org\//,'').trim(),
  authoritativePublicationDate:item=>{
    const p=item['published-online']?.['date-parts']?.[0];
    return p?.length===3?p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[2]).padStart(2,'0'):'';
  },
  fetchRetry:async()=>({message:{items:[]}})
};
vm.runInNewContext(fallbackSource+'\nglobalThis.windows={atlasCrossrefPublicationWindow,atlasSearchCrossrefPeers};',fallbackContext);
const w=fallbackContext.windows;
const asOf=new Date('2026-11-01T16:00:00Z');
assert.equal(w.atlasCrossrefPublicationWindow(12,asOf).from,'2025-11-01');
assert.equal(w.atlasCrossrefPublicationWindow(12,asOf).to,'2026-11-01');
assert.equal(w.atlasCrossrefPublicationWindow(1,new Date('2026-03-31T11:00:00Z')).from,'2026-02-28','Month-end clamps');
assert.equal(w.atlasCrossrefPublicationWindow(1,new Date('2024-03-31T11:00:00Z')).from,'2024-02-29','Leap month-end clamps');
assert.equal(w.atlasCrossrefPublicationWindow(900,asOf).months,120,'Horizon bounded');

(async()=>{
  const urls=[];
  fallbackContext.fetchRetry=async url=>{urls.push(url);return {message:{items:[]}};};
  await w.atlasSearchCrossrefPeers('Continuous electrochemical carbon dioxide reduction',8,'',12);
  assert.ok(urls.length===1);
  const u=new URL(urls[0]);
  assert.match(u.searchParams.get('filter'),/from-pub-date:/);
  assert.match(u.searchParams.get('filter'),/until-pub-date:/);
  assert.match(u.searchParams.get('filter'),/type:journal-article/);
  console.log('PASS: DOE source data, conservative target comparisons, month-end-safe horizons, strict query filters and stateless code syntax.');
})().catch(e=>{console.error(e);process.exitCode=1;});
