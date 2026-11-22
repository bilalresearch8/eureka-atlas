'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'evidence-explorer.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'evidence-audit.js'),'utf8');
new vm.Script(source,{filename:'evidence-audit bundle'});
const ctx={};
vm.runInNewContext(source+'\nglobalThis.h={atlasEvidenceAudit};',ctx);
const f=ctx.h;
const anchor={
 id:'1',family:'hydrogen',metric:'density',configuration:'stack',basis:'geometric',
 conditions:'80 °C; 6 M KOH; 1 cm² geometric electrode area',value:2,
 title:'DOI-linked electrolysis report',doi:'10.1234/study-1',location:'Fig. 2',verifiedIdentity:true,provenance:'user'
};
const audited=f.atlasEvidenceAudit(anchor,anchor);
assert.equal(audited.status,'anchor');
assert.equal(audited.reporting_gaps.length,0,'captured fields satisfy deterministic reporting prompts');
const peer={...anchor,id:'2',value:1.8,doi:'10.1234/study-2'};
assert.equal(f.atlasEvidenceAudit(peer,anchor).status,'declared-protocol candidate','same declared conditions only');
const other={...peer,configuration:'three',basis:'ecsa',conditions:'25 °C; 0.1 M H2SO4'};
const mismatched=f.atlasEvidenceAudit(other,anchor);
assert.equal(mismatched.status,'not established');
assert.ok(mismatched.blockers.some(x=>x.includes('configuration')));
assert.ok(mismatched.blockers.some(x=>x.includes('normalization')));
assert.ok(mismatched.blockers.some(x=>x.includes('protocol')));
const incomplete={...peer,verifiedIdentity:false,location:'',configuration:'unknown',basis:'other',conditions:''};
const gaps=f.atlasEvidenceAudit(incomplete,anchor);
assert.ok(gaps.reporting_gaps.some(x=>x.includes('Crossref')));
assert.ok(gaps.reporting_gaps.some(x=>x.includes('figure')));
assert.ok(gaps.reporting_gaps.some(x=>x.includes('denominator')));
assert.ok(gaps.reporting_gaps.some(x=>x.includes('temperature')));
const carbon={...anchor,id:'co',family:'carbon',metric:'partial_density',conditions:'25 °C; CO₂ feed; 1 M KHCO3; 200 mA/cm²',value:100};
const co=f.atlasEvidenceAudit(carbon,carbon);
assert.ok(!co.reporting_gaps.some(x=>x.includes('CO₂ feed')));
const battery={...anchor,id:'bat',family:'battery',metric:'ce',conditions:'1 C; loading 2 mg/cm²; 25 °C',value:99};
assert.equal(f.atlasEvidenceAudit(battery,battery).reporting_gaps.length,0);
assert.match(source,/reporting_gaps:missing/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/id="evidenceAuditRows"/);
assert.match(html,/id="evidenceAuditExport"/);
assert.match(html,/evidence-audit\.js/);
console.log('PASS: missing-evidence, domain condition hints, candidate-vs-blocked comparisons and audit UI.');
