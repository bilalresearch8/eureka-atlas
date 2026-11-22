'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'evidence-explorer.js'),'utf8');
const css=fs.readFileSync(path.join(root,'evidence-explorer.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

new vm.Script(source,{filename:'evidence-explorer.js'});
new vm.Script(sw,{filename:'sw.js'});
const ctx={};
vm.runInNewContext(source+"\nglobalThis.testHooks={atlasEvidenceParseNumber,atlasEvidenceCleanUnit,atlasEvidenceCanonicalValue,atlasEvidenceDoi,atlasEvidenceSameTitle,atlasEvidenceProtocol,atlasEvidenceComparable,atlasEvidenceValidate,atlasEvidenceTopicFamily,atlasEvidenceExtractRecord,atlasEvidenceMetricAllowed,ATLAS_EVIDENCE_METRICS};",ctx);
const f=ctx.testHooks;
const numeric=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,a+' != '+b);

numeric(f.atlasEvidenceCanonicalValue('density','1200','mA/cm²'),1.2);
numeric(f.atlasEvidenceCanonicalValue('density','2.4','A/cm²'),2.4);
numeric(f.atlasEvidenceCanonicalValue('partial_density','0.3','A/cm²'),300);
numeric(f.atlasEvidenceCanonicalValue('voltage','1800','mV'),1.8);
numeric(f.atlasEvidenceCanonicalValue('duration','2','days'),48);
numeric(f.atlasEvidenceCanonicalValue('specific_energy','0.25','kWh/kg'),250);
numeric(f.atlasEvidenceCanonicalValue('areal_capacity','0.005','Ah/cm²'),5);
numeric(f.atlasEvidenceCanonicalValue('h2_energy','49000','Wh/kg H₂'),49);
assert.equal(f.atlasEvidenceCanonicalValue('density',2.4,'A/cm²'),2.4);
assert.equal(f.atlasEvidenceCanonicalValue('density',2.4,'A/g'),null,'area and mass normalization cannot be equated');
assert.equal(f.atlasEvidenceCanonicalValue('fe',101,'%'),null,'FE over 100% rejected');
assert.equal(f.atlasEvidenceCanonicalValue('recovery',-1,'%'),null,'negative values rejected');
assert.equal(f.atlasEvidenceCanonicalValue('duration','2-3','h'),null,'range not silently converted to scalar');
assert.equal(f.atlasEvidenceCanonicalValue('duration','~3','h'),null,'approximation not silently converted to exact scalar');
assert.equal(f.atlasEvidenceCanonicalValue('duration','NaN','h'),null);
assert.equal(f.atlasEvidenceCanonicalValue('duration','1e999','h'),null);
assert.ok(f.ATLAS_EVIDENCE_METRICS.some(m=>m.id==='ce'),'CE separate from FE');
assert.equal(f.atlasEvidenceMetricAllowed('specific_energy','hydrogen'),false,'battery-specific energy not an H2 metric');
assert.equal(f.atlasEvidenceMetricAllowed('h2_energy','battery'),false,'H2 stack electricity not a battery metric');
assert.equal(f.atlasEvidenceMetricAllowed('ce','battery'),true);
assert.equal(f.atlasEvidenceMetricAllowed('partial_density','carbon'),true);

assert.equal(f.atlasEvidenceDoi('https://doi.org/10.1038/s41563-026-02783-4'),'10.1038/s41563-026-02783-4');
assert.equal(f.atlasEvidenceDoi('javascript:alert(1)'),'');
assert.equal(f.atlasEvidenceDoi('arxiv:2602.08183'),'');
assert.equal(f.atlasEvidenceSameTitle('Durable cobalt based alkaline water electrolysis at high current density',
 'Durable cobalt-based alkaline water electrolysis at high current density'),true);
assert.equal(f.atlasEvidenceSameTitle('Durable cobalt based alkaline water electrolysis at high current density',
 'A totally unrelated organic electrosynthesis study'),false);
assert.equal(f.atlasEvidenceSameTitle('Random short','Completely different'),false);

const anchor={
 id:'a',metric:'density',family:'hydrogen',doi:'10.1038/s41563-026-02783-4',value:1.0,
 title:'Published measurement',configuration:'stack',basis:'geometric',
 conditions:'80 °C; 6 M NaOH; current density 1 A/cm²',location:'Fig 2',provenance:'user'
};
const near={...anchor,id:'b',value:2,conditions:' 80 °C;   6 M NaOH; current density 1 A/cm² '};
assert.equal(f.atlasEvidenceComparable(anchor,near),true,'text-identical declared protocols are a comparison candidate');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,configuration:'three'}),false,'three electrode vs stack mismatch');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,basis:'ecsa'}),false,'geometric vs ECSA mismatch');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,family:'carbon'}),false,'unlike reactions cannot be compared');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,metric:'partial_density'}),false,'partial and total current mismatch');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,conditions:'25 °C; 1 M KOH'}),false,'conditions mismatch');
assert.equal(f.atlasEvidenceComparable(anchor,{...near,conditions:''}),false,'missing conditions no comparison');
assert.equal(f.atlasEvidenceComparable({...anchor,configuration:'unknown'},{...near,configuration:'unknown'}),false,'unknown configuration not comparable');
assert.equal(f.atlasEvidenceComparable({...anchor,basis:'other'},{...near,basis:'other'}),false,'unknown normalization not comparable');
assert.equal(f.atlasEvidenceValidate(anchor).doi,anchor.doi);
assert.equal(f.atlasEvidenceValidate({...anchor,doi:'invalid'}),null);
assert.equal(f.atlasEvidenceValidate({...anchor,metric:'specific_energy'}),null,'incompatible domain/metric rejected');

assert.equal(f.atlasEvidenceTopicFamily('Batteries'),'battery');
assert.equal(f.atlasEvidenceTopicFamily('Fuel Cells'),'fuel');
assert.equal(f.atlasEvidenceTopicFamily('Critical Minerals Recovery (Li, Ni, Co)'),'recovery');
assert.equal(f.atlasEvidenceTopicFamily('Anodizing'),'surface');
const p={recordType:'paper',doi:anchor.doi,title:anchor.title,topic:'Fuel Cells',
 journalName:'Nature Materials',date:'2026-11-12',source:'Crossref exact journal',
 quantitativeEvidence:[{metric:'Current density',value:'1200',unit:'mA cm⁻²',
 measurementBasis:'geometric full cell',testConditions:'80C 6M KOH',evidenceLocation:'Figure 2'}]};
const density=f.ATLAS_EVIDENCE_METRICS.find(m=>m.id==='density');
const imported=f.atlasEvidenceExtractRecord(p,p.quantitativeEvidence[0],density,'fuel');
assert.ok(imported);
numeric(imported.value,1.2);
assert.equal(imported.provenance,'ai');
assert.equal(imported.verifiedIdentity,true,'DOI metadata known; numerical result remains AI-extracted');
assert.equal(f.atlasEvidenceExtractRecord(p,{...p.quantitativeEvidence[0],metric:'Partial current density'},density,'fuel'),null,'partial current excluded from generic density');
assert.equal(f.atlasEvidenceExtractRecord(p,{...p.quantitativeEvidence[0],unit:'mol/L'},density,'fuel'),null);
assert.equal(f.atlasEvidenceExtractRecord(p,{...p.quantitativeEvidence[0],value:'1.2 ± 0.1'},density,'fuel'),null);
assert.equal(f.atlasEvidenceExtractRecord(p,p.quantitativeEvidence[0],density,'hydrogen'),null,'topic mismatch');
assert.match(html,/id="evidenceExplorer"/);
for(const id of ['evidencePlot','evidenceDetail','evidenceFamily','evidenceMetric','evidenceAdd',
 'evidenceImport','evidenceExport','evidenceDOI','evidenceLocation','evidenceConditions','evidenceAnchor'])
  assert.ok(html.includes('id="'+id+'"'),id);
assert.match(html,/const APP_VERSION='23'/);
assert.match(html,/evidence-explorer\.js/);
assert.match(html,/evidence-explorer\.css/);
assert.match(css,/\.evidence-plot-row/);
assert.match(sw,/eureka-atlas-v23-20261122-shell/);
assert.match(sw,/evidence-explorer\.js/);
assert.match(sw,/evidence-explorer\.css/);
console.log('PASS: evidence normalization, uncertainty rejection, reaction and basis segregation, strict citation/protocol gates, source provenance, chart UI and service-worker shell.');
