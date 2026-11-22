'use strict';
// v23: deterministic reporting and comparability audit. These checks inspect the
// SAVED summaries only; a missing item is not proof the underlying paper omits it.
const ATLAS_AUDIT_CONDITION_HINTS={
  hydrogen:[
    ['temperature',/(?:temperature|°\s?c|kelvin|\b\d+(?:\.\d+)?\s?k\b)/i],
    ['electrolyte or membrane identity',/(?:electrolyte|membrane|k[o0]h|naoh|h2so4|h₂so₄|pem|aem|acidic|alkaline|water)/i],
    ['electrode area or catalyst loading',/(?:active area|electrode area|cm2|cm²|loading|mg\s*\/\s*cm)/i]
  ],
  carbon:[
    ['CO₂ feed composition',/(?:co2|co₂|carbon dioxide|feed|flue gas)/i],
    ['electrolyte and reactor environment',/(?:electrolyte|catholyte|anolyte|khco3|khco₃|koh|naoh|mea|flow.cell|gas.diffusion)/i],
    ['applied potential or current density',/(?:\bvolt|voltage|potential|rhe|v\s*vs\.?|current|ma\s*\/\s*cm|a\s*\/\s*cm)/i]
  ],
  battery:[
    ['C-rate or cycling current',/(?:c.rate|\b\d+(?:\.\d+)?\s*c\b|current|ma\s*\/\s*g|a\s*\/\s*kg)/i],
    ['active-material loading or electrode thickness',/(?:loading|mg\s*\/\s*cm|thickness|µm|micron|areal capacity)/i],
    ['temperature or electrolyte',/(?:temperature|°\s?c|kelvin|electrolyte|lifp6|lipf6|salt|solvent)/i]
  ],
  fuel:[
    ['feed and operating pressure',/(?:feed|oxygen|air|hydrogen|o2|o₂|pressure|bar|atm|psi)/i],
    ['temperature',/(?:temperature|°\s?c|kelvin|\b\d+(?:\.\d+)?\s*k\b)/i],
    ['catalyst loading or electrode area',/(?:loading|mg\s*\/\s*cm|electrode area|active area|cm²|cm2)/i]
  ],
  recovery:[
    ['inlet concentration or feed chemistry',/(?:concentration|brine|feed|mol\/l|mg\/l|ppm|salinity|ph\b)/i],
    ['flow or cycle throughput',/(?:flow|throughput|l\/h|ml\/min|cycle|capacity)/i],
    ['selectivity or co-ion context',/(?:selectiv|li\/mg|li:mg|competition|co.ion|impurity|recovery)/i]
  ],
  surface:[
    ['electrolyte or bath composition',/(?:electrolyte|bath|sulfuric|phosphoric|sulphuric|h2so4|h₂so₄|mol\/l|wt%|mass%)/i],
    ['temperature',/(?:temperature|°\s?c|kelvin|\b\d+(?:\.\d+)?\s*k\b)/i],
    ['current density or applied voltage',/(?:current density|ma\s*\/\s*cm|a\s*\/\s*cm|voltage|potential|\bvolt)/i]
  ]
};
function atlasEvidenceAudit(item,anchor){
  if(!item)return null;
  const missing=[];
  if(!item.verifiedIdentity)missing.push('Crossref DOI/title identity not checked');
  if(!item.location)missing.push('Exact figure, table, or page citation not captured');
  if(!item.configuration||item.configuration==='unknown')missing.push('Cell / device configuration not captured');
  if(!item.basis||item.basis==='other')missing.push('Normalization denominator not captured');
  const protocol=atlasEvidenceProtocol(item.conditions);
  if(!protocol)missing.push('Operating conditions not captured');
  for(const [name,pattern] of ATLAS_AUDIT_CONDITION_HINTS[item.family]||[]){
    if(!pattern.test(protocol))missing.push(name+' not identifiable in saved condition summary');
  }
  const blockers=[];
  const isAnchor=!!anchor&&item.id===anchor.id;
  if(anchor&&!isAnchor){
    if(item.family!==anchor.family)blockers.push('Different electrochemical system');
    if(item.metric!==anchor.metric)blockers.push('Different metric or denominator');
    if(item.configuration==='unknown'||anchor.configuration==='unknown'||!item.configuration||!anchor.configuration)
      blockers.push('Cell configuration unspecified for at least one study');
    else if(item.configuration!==anchor.configuration)blockers.push('Different cell / device configuration');
    if(item.basis==='other'||anchor.basis==='other'||!item.basis||!anchor.basis)
      blockers.push('Normalization basis unspecified for at least one study');
    else if(item.basis!==anchor.basis)blockers.push('Different normalization basis');
    if(!protocol||!atlasEvidenceProtocol(anchor.conditions))blockers.push('Test protocol not recorded for at least one study');
    else if(protocol!==atlasEvidenceProtocol(anchor.conditions))blockers.push('Saved operating-protocol descriptions differ');
  }
  const candidate=!!anchor&&!isAnchor&&atlasEvidenceComparable(item,anchor);
  return {
    id:item.id,doi:item.doi,title:item.title,location:item.location||'',
    value:item.value,metric:item.metric,family:item.family,provenance:item.provenance,
    identity_checked:item.verifiedIdentity===true,
    status:isAnchor?'anchor':candidate?'declared-protocol candidate':'not established',
    blockers,reporting_gaps:missing,
    interpretation:'Reporting gaps refer only to captured summaries; matching text does not verify experimental comparability or measured values.'
  };
}
function atlasEvidenceAuditRender(records,anchor){
  if(typeof document==='undefined')return;
  const panel=document.getElementById('evidenceExplorer');
  const list=panel?.querySelector('#evidenceAuditRows');
  const summary=panel?.querySelector('#evidenceAuditSummary');
  const exportButton=panel?.querySelector('#evidenceAuditExport');
  if(!list||!summary)return;
  const audited=records.map(record=>atlasEvidenceAudit(record,anchor));
  const matched=audited.filter(x=>x.status==='declared-protocol candidate').length;
  const checked=audited.filter(x=>x.identity_checked).length;
  summary.textContent=records.length
    ?records.length+' visible studies · '+matched+' candidate matches to the reference · '+checked+' Crossref identity checks. No numeric measurements are independently validated.'
    :'Add observations to generate a provenance and condition-matching audit. No results are inferred.';
  list.replaceChildren();
  if(exportButton)exportButton.disabled=!records.length;
  for(const audit of audited){
    const row=document.createElement('button');row.type='button';row.className='evidence-audit-row';
    row.dataset.evidenceId=audit.id;
    const heading=document.createElement('span');heading.className='evidence-audit-heading';
    const name=document.createElement('strong');name.textContent=audit.title;
    const state=document.createElement('span');state.textContent=audit.status==='anchor'?'Reference':audit.status==='declared-protocol candidate'?'Candidate protocol match':'Not established';
    state.className='evidence-audit-state';
    heading.append(name,state);
    const note=document.createElement('span');note.className='evidence-audit-note';
    const blockers=audit.blockers.length?audit.blockers.join(' · '):'No declared configuration/basis/protocol mismatch detected';
    note.textContent=(audit.status==='anchor'?'Anchor selected':blockers)+' · '+audit.reporting_gaps.length+' reporting prompts';
    row.append(heading,note);
    row.addEventListener('click',()=>{
      atlasEvidenceSelection=audit.id;
      const plot=panel.querySelector('#evidencePlot');
      atlasEvidenceRender();
      const chosen=[...plot.querySelectorAll('[data-evidence-id]')].find(x=>x.dataset.evidenceId===audit.id);
      if(chosen)chosen.focus({preventScroll:true});
    });
    list.append(row);
  }
  const selected=records.find(x=>x.id===atlasEvidenceSelection)||anchor;
  const detail=panel.querySelector('#evidenceDetail');
  const existing=detail?.querySelector('.evidence-audit-detail');
  if(existing)existing.remove();
  if(selected&&detail){
    const audit=atlasEvidenceAudit(selected,anchor);
    const section=document.createElement('section');section.className='evidence-audit-detail';
    const h=document.createElement('h4');h.textContent='Evidence audit · saved data only';
    const p=document.createElement('p');p.textContent=audit.status==='declared-protocol candidate'
      ?'Matching declarations are screening leads—not proof of matched testing, valid numerical extraction, or industrial readiness.'
      :audit.status==='anchor'?'Reference record for declared-condition matching.':'Current evidence is insufficient to establish an equivalent protocol.';
    section.append(h,p);
    if(audit.blockers.length||audit.reporting_gaps.length){
      const listNode=document.createElement('ul');
      for(const msg of audit.blockers) {
        const li=document.createElement('li');li.textContent='Comparison blocker: '+msg;listNode.append(li);
      }
      for(const msg of audit.reporting_gaps) {
        const li=document.createElement('li');li.textContent='Check source: '+msg;listNode.append(li);
      }
      section.append(listNode);
    }else{
      const full=document.createElement('p');full.textContent='No reporting prompts were detected by the keyword screen; measurements are still unverified.';section.append(full);
    }
    detail.append(section);
  }
}
function atlasEvidenceAuditExport(){
  const visible=atlasEvidenceSelected();
  if(!visible.length)return;
  const selector=document.getElementById('evidenceAnchor');
  const anchor=visible.find(x=>x.id===selector?.value)||visible[0];
  const payload={
    schema_version:1,generated_at:new Date().toISOString(),reference_doi:anchor.doi,
    warning:'This is a deterministic missing-information and declared-condition screen of locally saved descriptions, NOT independent verification of paper results or industry targets.',
    audits:visible.map(x=>atlasEvidenceAudit(x,anchor))
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download='eureka-atlas-evidence-audit-'+new Date().toISOString().slice(0,10)+'.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
function initAtlasEvidenceAudit(){
  const button=document.getElementById('evidenceAuditExport');
  if(button)button.addEventListener('click',atlasEvidenceAuditExport);
}
