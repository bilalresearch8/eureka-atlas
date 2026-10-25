'use strict';

const ELECTROCHEM_BENCHMARK_SCHEMAS={
  battery:{label:'Batteries / electrochemical storage',metrics:['Specific capacity (mAh g⁻¹)','Areal capacity (mAh cm⁻²)','Specific energy (Wh kg⁻¹)','Volumetric energy (Wh L⁻¹)','Coulombic efficiency (%)','Capacity retention and cycle count','Fast-charge rate / time','Electrode loading (mg cm⁻²)','Electrolyte-to-capacity ratio (g Ah⁻¹)','N/P ratio','Operating temperature','Cell format and active area'],industrial:['Practical loading and inactive mass','Cycle/calendar life','Formation and manufacturing yield','Safety / thermal propagation','Materials cost and supply risk','Pack-level energy and power','Fast-charge capability','Recycling / end-of-life']},
  electrolyzer:{label:'Water electrolysis / H₂',metrics:['Current density (A cm⁻²)','Cell voltage (V)','Overpotential (mV)','Faradaic efficiency (%)','Energy efficiency (%)','Specific energy (kWh kg-H₂⁻¹)','Catalyst loading (mg cm⁻²)','Stability (h)','Degradation rate','Active area (cm² or m²)','Operating pressure','Operating temperature'],industrial:['Stack current density','Lifetime and degradation','PGM / critical-material intensity','Balance-of-plant energy','Gas purity and crossover','Pressure operation','Manufacturing yield','Levelized hydrogen cost drivers']},
  co2rr:{label:'CO₂ electrolysis / CO₂RR',metrics:['Faradaic efficiency (%)','Partial current density (mA cm⁻²)','Total current density (A cm⁻²)','Cell voltage (V)','Energy efficiency (%)','Single-pass conversion (%)','Carbon efficiency (%)','Product concentration','Stability (h)','Catalyst loading (mg cm⁻²)','Active area','CO₂ utilization'],industrial:['Single-pass conversion and recycle load','Product separation energy','Carbonate loss / carbon efficiency','Stack voltage and current density','Lifetime / flooding / salt management','Catalyst and membrane cost','Product purity','Continuous operation and scale']},
  fuelcell:{label:'Fuel cells',metrics:['Peak power density (W cm⁻²)','Current density at rated voltage','Mass activity (A mg-PGM⁻¹)','PGM loading (mg cm⁻²)','Specific power','Durability (h)','Voltage decay rate','Fuel utilization (%)','Active area','Operating temperature','Operating pressure','Efficiency (%)'],industrial:['Stack power density','PGM intensity','Lifetime / start-stop durability','Water and thermal management','Contaminant tolerance','Manufacturing yield','Balance-of-plant cost','System efficiency']},
  flowbattery:{label:'Redox flow batteries',metrics:['Energy density (Wh L⁻¹)','Current density (mA cm⁻²)','Round-trip efficiency (%)','Coulombic efficiency (%)','Voltage efficiency (%)','Capacity retention (%)','Cycle count','Electrolyte concentration','Membrane area resistance','Power density','Operating temperature','Electrolyte cost'],industrial:['Electrolyte cost and stability','Membrane selectivity / crossover','Pump and balance-of-plant losses','Tank and system energy density','Long-duration cycle life','Materials availability','Maintenance','LCOS drivers']},
  electrocatalysis:{label:'Electrocatalysis — general',metrics:['Overpotential (mV)','Current density (mA cm⁻²)','Tafel slope (mV dec⁻¹)','Faradaic efficiency (%)','Mass activity','Specific activity','Turnover frequency','Catalyst loading','Stability (h)','Retention (%)','Electrochemically active surface area','Energy efficiency (%)'],industrial:['High-current-density operation','Catalyst loading / critical materials','Durability and degradation mode','Mass transport','Electrode / MEA manufacturability','Electrolyte management','Product separation','Stack integration']},
  corrosion:{label:'Corrosion / electrodeposition / anodizing',metrics:['Corrosion current density','Corrosion potential','Polarization resistance','Coating thickness','Deposition rate','Current efficiency (%)','Adhesion strength','Hardness','Roughness','Porosity','Salt-spray lifetime','Bath temperature / chemistry'],industrial:['Line throughput','Bath lifetime and control','Uniformity on complex geometry','Adhesion / residual stress','Wastewater and drag-out','Energy intensity','EHS / hazardous chemistry','Cost per area or part']},
  general:{label:'General electrochemical study',metrics:['Primary performance metric','Current density','Voltage / overpotential','Efficiency / selectivity','Stability / durability','Material loading','Active area / scale','Temperature','Pressure','Throughput / productivity','Energy intensity','Cost-relevant material intensity'],industrial:['Scale demonstrated','Durability','Throughput','Energy efficiency','Materials cost','Safety / EHS','Manufacturability','System integration']}
};
let benchmarkPdf=null;
let lastBenchmarkResult=null;

function benchmarkSchema(){return ELECTROCHEM_BENCHMARK_SCHEMAS[document.getElementById('benchmarkDomain')?.value]||ELECTROCHEM_BENCHMARK_SCHEMAS.general;}
function benchmarkStatusClass(v){const s=String(v||'unknown').toLowerCase();if(/ahead|green|strong|meets|pass/.test(s))return 'ahead';if(/near|amber|partial|close/.test(s))return 'near';if(/behind|red|weak|fail|gap/.test(s))return 'behind';return 'unknown';}
function benchmarkEscape(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function benchmarkNumber(v,fallback='—'){if(v===null||v===undefined||v==='')return fallback;const n=Number(v);return Number.isFinite(n)?String(Math.round(n)):fallback;}
function benchmarkSelectedStudy(){
  if(typeof selectedResultKeys==='undefined'||!selectedResultKeys.size)return null;
  const picked=(typeof currentResults!=='undefined'?currentResults:[]).filter(x=>x.recordType!=='patent'&&selectedResultKeys.has(paperKey(x)));
  return picked[0]||null;
}
function benchmarkUseSelected(){
  const p=benchmarkSelectedStudy();
  if(!p){toast('Select one research paper in the results table first.','warn');return;}
  const box=document.getElementById('benchmarkStudy');
  box.value=[p.title,p.doi?('DOI: '+p.doi):'',p.journalName,p.date,p.abstract||''].filter(Boolean).join('\n');
  toast('Selected paper loaded into Benchmark Lab.','success');
  document.getElementById('benchmark-lab')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function benchmarkAttachPdf(file){
  if(!file)return;
  const status=document.getElementById('benchmarkPdfStatus');
  if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){toast('Choose a PDF file.','warn');return;}
  if(file.size>50*1024*1024){toast('PDFs are limited to 50 MB.','warn');return;}
  status.textContent='Reading '+file.name+'…';status.className='benchmark-file-status';
  try{
    benchmarkPdf={name:file.name,size:file.size,base64:await readPdfBase64(file)};
    status.textContent='Attached: '+benchmarkPdf.name+' · '+formatBytes(benchmarkPdf.size);
    status.className='benchmark-file-status attached';
    document.getElementById('benchmarkRemovePdf').hidden=false;
  }catch(e){benchmarkPdf=null;status.textContent='PDF could not be attached: '+e.message;status.className='benchmark-file-status';}
}
function benchmarkRemovePdf(){
  benchmarkPdf=null;
  document.getElementById('benchmarkPdf').value='';
  document.getElementById('benchmarkPdfStatus').textContent='No PDF attached.';
  document.getElementById('benchmarkPdfStatus').className='benchmark-file-status';
  document.getElementById('benchmarkRemovePdf').hidden=true;
}
function benchmarkTargetPrompt(study,schema){
  return `Extract a strict electrochemical benchmark profile from this study. Domain: ${schema.label}. Study text: ${study}. Required metric ontology: ${JSON.stringify(schema.metrics)}. Return ONLY JSON with: title, doi, system_description, cell_or_reactor_configuration, scale_demonstrated, and metrics (array; each object metric, value, unit, test_conditions, comparator, evidence_location, uncertainty, status reported|not_reported). Never estimate missing values. Preserve the reporting basis and denominator exactly. Flag three_electrode, half_cell, coin_cell, geometric_vs_ECSA_normalization, catalyst_loading, active_area, temperature, pressure, electrolyte, feed_composition, and other conditions whenever relevant.`;
}
function benchmarkWebPrompt(target,schema,horizon,count){
  return `Act as an electrochemical benchmarking committee for a principal investigator and an industrial R&D director. Compare the TARGET study against the strongest genuinely comparable peer-reviewed literature and industrial reality.

TARGET PROFILE:
${JSON.stringify(target)}

DOMAIN:
${schema.label}

METRIC ONTOLOGY:
${JSON.stringify(schema.metrics)}

INDUSTRIAL READINESS DIMENSIONS:
${JSON.stringify(schema.industrial)}

Search the live web and authoritative publisher/DOI pages. Search roughly the last ${horizon} months for current state of the art, while allowing an older seminal benchmark only when it remains the actual benchmark. Retrieve at most ${count} primary-research comparators. Comparators MUST have a DOI, exact title, exact journal, exact publication date, source URL, and numeric values with units and test conditions. Do not compare unlike bases as if they were equivalent: geometric vs ECSA area, three-electrode vs full cell, half-cell vs full cell, catalyst-only vs packaged device, low loading vs practical loading, different temperatures/pressures/feed concentrations, or different denominators. Mark those comparisons partial or invalid.

Also find industrial targets only from authoritative sources such as standards bodies, DOE/NREL/IEA or equivalent national labs/agencies, OEM/manufacturer technical specifications, or credible industry roadmaps. Never invent an industrial threshold.

Return ONLY one JSON object:
{
 "target": {...},
 "comparators":[{"title":"","doi":"","journal":"","publication_date":"","source_url":"","why_comparable":"","metrics":[{"metric":"","value":"","unit":"","test_conditions":"","evidence_location":"","source_url":""}]}],
 "metric_comparison":[{"metric":"","target_value":"","sota_best":"","sota_source_doi":"","sota_conditions":"","comparability":"yes|partial|no","gap":"","industrial_target":"","industrial_source_url":"","status":"ahead|near|behind|unknown"}],
 "industrial_gap":[{"dimension":"","status":"green|amber|red|unknown","target_evidence":"","state_of_art":"","industrial_expectation":"","gap":"","next_validation":""}],
 "verdict":{"scientific_benchmark_position":0,"industrial_readiness":0,"evidence_completeness":0,"confidence":"low|medium|high","one_sentence":""},
 "missing_evidence":[],
 "next_experiments":[{"priority":1,"experiment":"","success_criterion":"","why_it_matters":""}],
 "source_urls":[]
}
Every numeric claim must carry a source URL or evidence location. If evidence is missing, use "Not reported" or "No authoritative target found". JSON only.`;
}
async function benchmarkVerifyComparator(c){
  const doi=normalizeDoi(c?.doi||'');
  if(!/^10\.\d{4,9}\/\S+$/i.test(doi)||!c?.title)return null;
  try{
    const data=await fetchRetry('https://api.crossref.org/works/'+encodeURIComponent(doi),null,22000,1);
    const it=data?.message;
    if(!it||normalizeDoi(it.DOI)!==doi||!titleMatchesAuthority(c.title,it.title?.[0]))return null;
    const journal=it['container-title']?.[0]||'';
    const date=authoritativePublicationDate(it);
    if(!journal||!exactISODate(date))return null;
    if(c.journal&&canonicalJournal(c.journal)!==canonicalJournal(journal))return null;
    if(c.publication_date&&exactISODate(c.publication_date)!==date)return null;
    return {...c,title:it.title?.[0]||c.title,doi,journal,publication_date:date,
      source_url:'https://doi.org/'+doi,identity_verified:true,measurements_verified:false,
      evidence_level:'Crossref verified bibliographic identity; measurements require full-source verification'};
  }catch{return null;}
}
function benchmarkMetricSources(result){
  const urls=new Set(result?.source_urls||[]);
  for(const c of result?.comparators||[]){if(c.source_url)urls.add(c.source_url);for(const m of c.metrics||[])if(m.source_url)urls.add(m.source_url);}
  for(const m of result?.metric_comparison||[])if(m.industrial_source_url)urls.add(m.industrial_source_url);
  return [...urls].map(atlasSafeUrl).filter(Boolean).slice(0,40);
}
function renderBenchmarkResult(result){
  const out=document.getElementById('benchmarkOutput');
  const v=result.verdict||{},metrics=result.metric_comparison||[],gaps=result.industrial_gap||[],missing=result.missing_evidence||[],next=result.next_experiments||[],sources=benchmarkMetricSources(result);
  const verified=(result.comparators||[]).filter(x=>x.identity_verified).length;
  const modeNote=result.fallback
    ?`<div class="benchmark-fallback-banner" role="status"><b>Metadata-only mode · no AI required</b><p>${benchmarkEscape(result.notice||'Crossref paper identities retrieved; quantitative comparison is not available.')}</p>${(result.warnings||[]).length?`<p>${(result.warnings||[]).map(benchmarkEscape).join(' · ')}</p>`:''}<a href="https://aistudio.google.com/usage?tab=rate-limit" target="_blank" rel="noopener">Check Gemini quotas ↗</a></div>`
    :`<div class="benchmark-ai-disclaimer"><b>AI-assisted evidence:</b> Crossref verifies DOI/title/journal/date identity, not the numerical measurements. Source-linked values must be checked in each paper's figure or table before citation or engineering decisions.</div>`;
  out.innerHTML=`
    ${modeNote}
    <div class="benchmark-summary">
      <div class="benchmark-kpi"><b>${benchmarkNumber(v.scientific_benchmark_position)}</b><span>Scientific benchmark /100 · AI estimate</span></div>
      <div class="benchmark-kpi"><b>${benchmarkNumber(v.industrial_readiness)}</b><span>Industrial readiness /100 · AI estimate</span></div>
      <div class="benchmark-kpi"><b>${benchmarkNumber(v.evidence_completeness)}</b><span>Evidence completeness /100 · AI estimate</span></div>
      <div class="benchmark-kpi"><b>${verified}</b><span>Crossref-verified comparators</span></div>
    </div>
    <div class="benchmark-verdict"><b>Benchmark verdict · ${benchmarkEscape(String(v.confidence||'unknown').toUpperCase())} confidence</b><p>${benchmarkEscape(v.one_sentence||'No verdict returned.')}</p></div>
    <div class="benchmark-section"><h3>Metric-by-metric state-of-the-art comparison</h3><p class="benchmark-mode-caption">Numerical values are source-linked AI extractions, not validated by Crossref. A dash means insufficient evidence, not zero.</p>
      <div class="benchmark-table-wrap"><table class="benchmark-table"><thead><tr><th>Metric</th><th>Your study</th><th>Source-linked literature</th><th>Comparability</th><th>Gap</th><th>Industrial target</th><th>Status</th></tr></thead><tbody>
      ${metrics.length?metrics.map(m=>`<tr><td><b>${benchmarkEscape(m.metric)}</b></td><td>${benchmarkEscape(m.target_value||'Not reported')}</td><td>${benchmarkEscape(m.sota_best||'Not reported')}<div class="evidence-location">${benchmarkEscape(m.evidence_status||'Evidence not independently audited')}</div>${m.sota_source_doi?`<div class="evidence-location">DOI: ${benchmarkEscape(m.sota_source_doi)}</div>`:''}<div class="evidence-location">${benchmarkEscape(m.sota_conditions||'')}</div></td><td>${benchmarkEscape(m.comparability||'unknown')}</td><td>${benchmarkEscape(m.gap||'Not quantified')}</td><td>${benchmarkEscape(m.industrial_target||'No authoritative target found')}${m.industrial_source_url?`<div><a href="${benchmarkEscape(m.industrial_source_url)}" target="_blank" rel="noopener">target source ↗</a></div>`:''}</td><td><span class="benchmark-status ${benchmarkStatusClass(m.status)}">${benchmarkEscape(m.status||'unknown')}</span></td></tr>`).join(''):`<tr><td colspan="7">No comparable quantitative metrics were verified.</td></tr>`}
      </tbody></table></div>
    </div>
    <div class="benchmark-section"><h3>Industrialization gap matrix</h3><div class="benchmark-gap-grid">
      ${gaps.length?gaps.map(g=>`<article class="benchmark-gap"><header><b>${benchmarkEscape(g.dimension)}</b><span class="benchmark-status ${benchmarkStatusClass(g.status)}">${benchmarkEscape(g.status||'unknown')}</span></header><p><strong>Your evidence:</strong> ${benchmarkEscape(g.target_evidence||'Not reported')}</p><p><strong>Industrial expectation:</strong> ${benchmarkEscape(g.industrial_expectation||'Not established')}</p><p><strong>Gap:</strong> ${benchmarkEscape(g.gap||'Unknown')}</p><p><strong>Next validation:</strong> ${benchmarkEscape(g.next_validation||'Not specified')}</p></article>`).join(''):'<div class="benchmark-empty"><b>No industrial gap matrix returned.</b></div>'}
    </div></div>
    <div class="benchmark-section"><h3>Missing evidence that weakens the paper</h3><ul class="benchmark-list">${missing.length?missing.map(x=>`<li>${benchmarkEscape(typeof x==='string'?x:JSON.stringify(x))}</li>`).join(''):'<li>No explicit missing-evidence list returned.</li>'}</ul></div>
    <div class="benchmark-section"><h3>Highest-value next experiments</h3><ol class="benchmark-list">${next.length?next.sort((a,b)=>(a.priority||99)-(b.priority||99)).map(x=>`<li><b>${benchmarkEscape(x.experiment||'Experiment')}</b> — success: ${benchmarkEscape(x.success_criterion||'Not specified')}. ${benchmarkEscape(x.why_it_matters||'')}</li>`).join(''):'<li>No experiment plan returned.</li>'}</ol></div>
    <div class="benchmark-section"><h3>Bibliographic comparator set</h3><p class="benchmark-mode-caption">Crossref verification establishes paper identity only. Relatedness is not proof of matched experimental conditions.</p><div class="benchmark-table-wrap"><table class="benchmark-table"><thead><tr><th>Paper</th><th>Journal / date</th><th>DOI</th><th>Why comparable</th><th>Identity</th></tr></thead><tbody>
      ${(result.comparators||[]).length?(result.comparators||[]).map(c=>`<tr><td>${c.source_url?`<a href="${benchmarkEscape(c.source_url)}" target="_blank" rel="noopener"><b>${benchmarkEscape(c.title)}</b></a>`:`<b>${benchmarkEscape(c.title)}</b>`}</td><td>${benchmarkEscape(c.journal||'')}<div class="evidence-location">${benchmarkEscape(c.publication_date||'')}</div></td><td>${benchmarkEscape(c.doi||'')}</td><td>${benchmarkEscape(c.why_comparable||'')}</td><td><span class="benchmark-status ${c.identity_verified?'green':'unknown'}">${c.identity_verified?'Crossref verified':'excluded / unverified'}</span></td></tr>`).join(''):'<tr><td colspan="5">No comparator papers survived identity verification.</td></tr>'}
    </tbody></table></div></div>
    <div class="benchmark-section"><h3>Evidence sources</h3><div class="benchmark-sources">${sources.length?sources.map(u=>`<a href="${benchmarkEscape(u)}" target="_blank" rel="noopener">${benchmarkEscape(u)}</a>`).join(''):'No source URLs returned.'}</div></div>
  `;
}
async function runBenchmarkLab(){
  const run=document.getElementById('runBenchmark');
  const study=document.getElementById('benchmarkStudy').value.trim();
  if(!study&&!benchmarkPdf){toast('Paste a DOI/title/abstract or attach a study PDF.','warn');return;}
  const schema=benchmarkSchema(),horizon=Number(document.getElementById('benchmarkHorizon').value)||36;
  const count=Math.max(3,Math.min(12,Number(document.getElementById('benchmarkCount').value)||8));
  const hasAI=!!document.getElementById('geminiKey')?.value.trim();
  run.disabled=true;const old=run.textContent;run.textContent='Building benchmark…';setStatus('Benchmarking','running');
  const out=document.getElementById('benchmarkOutput');
  // Keep the previous verified result on screen until a new result is available.
  if(!lastBenchmarkResult)out.innerHTML='<div class="benchmark-empty"><b>Checking source records…</b>Comparing only what the accessible evidence can actually establish.</div>';
  let target={study_text:study},result=null;
  try{
    if(!hasAI){
      result=await atlasMetadataBenchmark(study||benchmarkPdf?.name||'',schema,count,target,'Gemini API key not supplied');
    }else{
      if(benchmarkPdf){
        const r=await callGeminiDocument(benchmarkTargetPrompt(study||benchmarkPdf.name,schema),benchmarkPdf,{model:document.getElementById('geminiModel').value,timeout:160000});
        target=parseJsonLoose(r.text);
      }
      const prompt=benchmarkWebPrompt(target,schema,horizon,count);
      const r=await callGeminiInteraction(prompt,{tools:['google_search','url_context'],model:document.getElementById('geminiModel').value,timeout:160000});
      const parsed=parseJsonLoose(r.text),raw=Array.isArray(parsed)?parsed[0]:parsed;
      if(!raw||typeof raw!=='object')throw new Error('No structured benchmark was returned.');
      const candidates=Array.isArray(raw.comparators)?raw.comparators:[];
      const verified=[];let cursor=0;
      async function worker(){
        while(cursor<candidates.length){
          const c=candidates[cursor++],v=await benchmarkVerifyComparator(c);
          if(v)verified.push(v);
        }
      }
      await Promise.all(Array.from({length:Math.min(3,candidates.length||1)},worker));
      raw.source_urls=Array.from(new Set([...(raw.source_urls||[]),...(r.urls||[])]));
      result=atlasEvidenceGuard(raw,verified);
    }
  }catch(e){
    const reason=e?.geminiQuota?'Gemini quota reached (HTTP 429)':String(e?.message||'AI analysis unavailable').slice(0,180);
    try{
      result=await atlasMetadataBenchmark(study||benchmarkPdf?.name||'',schema,count,target,reason);
      if(e?.retryAfterSeconds)result.warnings.push('Google suggested retrying after approximately '+e.retryAfterSeconds+' seconds; project limits can last longer.');
    }catch(fallbackError){
      if(lastBenchmarkResult){
        renderBenchmarkResult(lastBenchmarkResult);
        out.insertAdjacentHTML('afterbegin','<div class="benchmark-fallback-banner" role="alert"><b>New comparison unavailable</b><p>Previous results preserved. '+benchmarkEscape(String(fallbackError.message).slice(0,160))+'</p></div>');
      }else out.innerHTML='<div class="benchmark-empty"><b>Neither live AI nor Crossref metadata is reachable.</b>No results were fabricated. Retry the same study after connectivity or API access is restored.</div>';
      toast('Could not retrieve a new benchmark.','warn');
    }
  }finally{
    if(result){
      lastBenchmarkResult=result;
      renderBenchmarkResult(result);
      toast(result.fallback
        ?'Metadata snapshot ready; numerical claims are intentionally unverified.'
        :'Scientific comparison ready. Check numerical evidence at the linked sources.',
        result.fallback?'warn':'success');
    }
    run.disabled=false;run.textContent=old;setStatus('Ready','done');
  }
}
function downloadBenchmarkJson(){
  if(!lastBenchmarkResult){toast('Run a benchmark first.','warn');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(lastBenchmarkResult,null,2)],{type:'application/json'}));a.download='eureka-atlas-benchmark-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);
}
function initBenchmarkLab(){
  document.getElementById('benchmarkUseSelected')?.addEventListener('click',benchmarkUseSelected);
  document.getElementById('benchmarkPdf')?.addEventListener('change',e=>benchmarkAttachPdf(e.target.files?.[0]));
  document.getElementById('benchmarkRemovePdf')?.addEventListener('click',benchmarkRemovePdf);
  document.getElementById('runBenchmark')?.addEventListener('click',runBenchmarkLab);
  document.getElementById('benchmarkExport')?.addEventListener('click',downloadBenchmarkJson);
  document.getElementById('benchmarkClear')?.addEventListener('click',()=>{lastBenchmarkResult=null;document.getElementById('benchmarkStudy').value='';benchmarkRemovePdf();document.getElementById('benchmarkOutput').innerHTML='<div class="benchmark-empty"><b>No benchmark has run yet.</b>Load a study, choose the electrochemical domain, and compare it against verified state-of-the-art papers and industrial requirements.</div>';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBenchmarkLab);else initBenchmarkLab();
