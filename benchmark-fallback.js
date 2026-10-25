'use strict';
// Eureka Atlas v19: metadata-only scientific fallback and evidence guards.
// Crossref verifies paper identity, not values inside a paper.
const atlasMetadataCache = new Map();
const atlasStopwords = new Set('the and with from this that into using based through via role effects effect enhanced improved study studies novel approach method methods material materials electrochemical electrochemistry performance high low for on off a an of in to by or is are at under over toward towards investigation analysis development'.split(' '));
function atlasExtractDOI(value){
  const m=String(value||'').match(/10\.\d{4,9}\/[^\s<>"']+/i);
  return m?normalizeDoi(m[0].replace(/[.,;:)\]}]+$/g,'')):'';
}
function atlasFirstTitle(value){
  const line=String(value||'').split(/\r?\n/).map(x=>x.trim()).find(x=>x.length>=15&&!/^doi\s*:/i.test(x))||'';
  return line.replace(/^title\s*:\s*/i,'').slice(0,180);
}
function atlasTitleTerms(s){
  return new Set(String(s||'').toLowerCase().replace(/<[^>]*>/g,' ').replace(/[^a-z0-9]+/g,' ').split(' ').filter(x=>x.length>3&&!atlasStopwords.has(x)&&!/\d{4}/.test(x)));
}
function atlasRelatedness(target,candidate){
  const a=atlasTitleTerms(target),b=atlasTitleTerms(candidate);
  if(a.size<2||b.size<2)return 0;
  let shared=0;for(const word of a)if(b.has(word))shared++;
  return shared>=2?shared/Math.min(a.size,b.size):0;
}
function atlasSafeUrl(v){
  try{const u=new URL(String(v||''));return u.protocol==='https:'?u.href:'';}catch{return '';}
}
function atlasCrossrefIdentity(item){
  const doi=atlasExtractDOI(item?.DOI||'');
  const title=String(item?.title?.[0]||'').trim();
  if(!doi||!title||item.type&&item.type!=='journal-article')return null;
  const officialDate=authoritativePublicationDate(item);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(officialDate||''))return null;
  return {
    title,doi,journal:String(item['container-title']?.[0]||''),
    publication_date:officialDate,source_url:'https://doi.org/'+doi,
    why_comparable:'Title-keyword proximity only; methods and numerical performance not assessed.',
    metrics:[],identity_verified:true,measurements_verified:false,
    evidence_level:'Crossref bibliographic metadata only'
  };
}
async function atlasCrossrefDOI(doi){
  const key='doi:'+doi;
  if(atlasMetadataCache.has(key))return atlasMetadataCache.get(key);
  const data=await fetchRetry('https://api.crossref.org/works/'+encodeURIComponent(doi),null,17000,1);
  if(normalizeDoi(data?.message?.DOI||'')!==doi)throw Error('DOI metadata did not match the requested identifier.');
  const result=atlasCrossrefIdentity(data.message);
  if(result)atlasMetadataCache.set(key,result);
  return result;
}
async function atlasSearchCrossrefPeers(title,count,targetDoi){
  if(atlasTitleTerms(title).size<2)return [];
  const q=new URL('https://api.crossref.org/works');
  q.searchParams.set('query.title',title.slice(0,160));
  q.searchParams.set('filter','type:journal-article');
  q.searchParams.set('rows',String(Math.min(60,Math.max(25,count*6))));
  q.searchParams.set('mailto',CONTACT_EMAIL);
  const key='query:'+title.toLowerCase()+':'+count;
  let records=atlasMetadataCache.get(key);
  if(!records){
    const data=await fetchRetry(q.toString(),null,21000,1);
    records=(data.message?.items||[]).map(atlasCrossrefIdentity).filter(Boolean);
    atlasMetadataCache.set(key,records);
  }
  return records
    .filter(r=>r.doi!==targetDoi&&!/(?:^review\b|\breview of\b|\bperspective\b|\beditorial\b)/i.test(r.title))
    .map(r=>({...r,similarity:atlasRelatedness(title,r.title)}))
    .filter(r=>r.similarity>=0.32)
    .sort((a,b)=>b.similarity-a.similarity||String(b.publication_date).localeCompare(String(a.publication_date)))
    .slice(0,count);
}
function atlasKnownTargetMetric(target,metric){
  for(const item of Array.isArray(target?.metrics)?target.metrics:[]){
    if(String(item.metric||'').toLowerCase()!==String(metric).toLowerCase())continue;
    if(!item.value||!item.unit||!item.evidence_location||!/\d/.test(String(item.value)))continue;
    return String(item.value)+' '+String(item.unit)+' [PDF AI extraction: '+String(item.evidence_location)+'; not independently checked]';
  }
  return 'Not independently verified';
}
function atlasEvidenceGuard(raw,comparators){
  const verified=new Map(comparators.filter(c=>c.identity_verified).map(c=>[normalizeDoi(c.doi),c]));
  const result={...raw,comparators,analysis_mode:'AI-assisted; comparator DOI/title/date verified, numeric measurements are source-linked AI extractions, not independently remeasured'};
  result.metric_comparison=(Array.isArray(raw.metric_comparison)?raw.metric_comparison:[]).map(row=>{
    const m={...row},doi=normalizeDoi(m.sota_source_doi||''),paper=verified.get(doi);
    const evidence=(paper?.metrics||[]).find(e=>String(e.metric||'').toLowerCase()===String(m.metric||'').toLowerCase()&&/\d/.test(String(e.value||''))&&e.unit&&e.test_conditions&&e.evidence_location&&atlasSafeUrl(e.source_url||paper.source_url));
    if(!paper||!evidence||!m.sota_conditions||!/\d/.test(String(m.sota_best||''))){
      m.sota_best='Not source-linked';m.sota_source_doi='';m.sota_conditions='';
      m.gap='Not quantified';m.comparability='unknown';m.status='unknown';
      m.evidence_status='Measurement not independently corroborated';
    }else{
      m.evidence_status='AI-extracted; source location supplied (not independently remeasured)';
      if(String(m.comparability||'').toLowerCase()!=='yes'){
        m.gap='Not comparable without matched methods';m.status='unknown';
      }
    }
    if(!atlasSafeUrl(m.industrial_source_url)){
      m.industrial_target='No authoritative target verified';
      m.industrial_source_url='';
      if(String(m.status).toLowerCase()!=='unknown')m.status='unknown';
    }
    return m;
  });
  result.source_urls=Array.from(new Set([...(raw.source_urls||[]),...comparators.map(c=>c.source_url)].map(atlasSafeUrl).filter(Boolean)));
  return result;
}
async function atlasMetadataBenchmark(study,schema,count,targetProfile=null,reason=''){
  const seed=String(study||'').trim();
  const suppliedDoi=atlasExtractDOI(seed)||atlasExtractDOI(targetProfile?.doi||'');
  const target={...(targetProfile||{})};
  let title=String(target.title||'').trim()||atlasFirstTitle(seed);
  const warnings=[];
  if(suppliedDoi){
    try{
      const official=await atlasCrossrefDOI(suppliedDoi);
      if(official){
        title=official.title;
        target.title=official.title;target.doi=official.doi;target.journal=official.journal;
        target.publication_date=official.publication_date;target.source_url=official.source_url;
        target.identity_verified=true;
      }else warnings.push('The target DOI lacked a complete, exact-date Crossref record.');
    }catch(e){warnings.push('Target DOI metadata was unreachable: '+String(e.message).slice(0,120));}
  }
  target.title=title||'Unidentified study';
  let comparators=[];
  if(title&&atlasTitleTerms(title).size>=2){
    try{comparators=await atlasSearchCrossrefPeers(title,count,target.doi||'');}
    catch(e){warnings.push('Crossref comparator search unavailable: '+String(e.message).slice(0,120));}
  }else warnings.push('Add a DOI or a distinctive paper title to search related literature.');
  const reasonText=reason?'AI analysis was unavailable: '+reason+'. ':'';
  const notice=reasonText+'Bibliographic identities are Crossref-sourced. No competing performance measurements, ranking or industrial numeric targets were independently established.';
  const metrics=schema.metrics.slice(0,12).map(metric=>({
    metric,target_value:atlasKnownTargetMetric(target,metric),
    sota_best:'Not verified',sota_source_doi:'',sota_conditions:'',
    comparability:'unknown',gap:'Not quantified',
    industrial_target:'No authoritative numerical target verified',
    industrial_source_url:'',status:'unknown',evidence_status:'Metadata only'
  }));
  const industrial=(schema.industrial||[]).map(d=>({
    dimension:d,status:'unknown',target_evidence:'Not assessed from full text',
    state_of_art:'Not independently established',industrial_expectation:'Requires sourced domain-specific specification',
    gap:'Unknown',next_validation:'Extract and verify the study’s corresponding measurement under commercial operating conditions.'
  }));
  const summary=comparators.length?
    String(comparators.length)+' related papers have verified DOI/title/date metadata. Their performance metrics are deliberately not inferred from bibliographic records.':
    'No sufficiently related, exact-date Crossref comparator records were retrieved. No performance ranking is asserted.';
  return {
    analysis_mode:'Crossref metadata-only fallback',fallback:true,notice,warnings,target,comparators,
    metric_comparison:metrics,industrial_gap:industrial,
    verdict:{scientific_benchmark_position:null,industrial_readiness:null,evidence_completeness:null,confidence:'not scored',one_sentence:summary},
    missing_evidence:[
      'A full-text, condition-matched extraction of the target and comparator measurements is still required.',
      'Industrial energy, throughput, lifetime, material-intensity and cost targets require authoritative documentation.',
      'For PDF-only uploads, add a DOI/title or paste the abstract when the AI document reader is unavailable.'
    ],
    next_experiments:[],
    source_urls:[target.source_url,...comparators.map(c=>c.source_url)].filter(Boolean)
  };
}
