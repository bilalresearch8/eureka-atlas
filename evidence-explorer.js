'use strict';
// Eureka Atlas v22: explicit-measurement visualization. Neither DOI validation nor AI extraction
// is proof that a plotted numerical value was measured as asserted.
const ATLAS_EVIDENCE_STORE='eurekaAtlasEvidenceV22';
const ATLAS_EVIDENCE_MAX=120;
const ATLAS_EVIDENCE_METRICS=[
  {id:'density',label:'Geometric current density',unit:'A/cm²',aliases:['current density','geometric current density'],units:{'A/cm2':1,'mA/cm2':0.001},max:1e6},
  {id:'partial_density',label:'Partial current density',unit:'mA/cm²',aliases:['partial current density'],units:{'mA/cm2':1,'A/cm2':1000},max:1e9},
  {id:'fe',label:'Faradaic efficiency',unit:'%',aliases:['faradaic efficiency'],units:{'%':1},max:100},
  {id:'ce',label:'Coulombic efficiency',unit:'%',aliases:['coulombic efficiency'],units:{'%':1},max:100},
  {id:'duration',label:'Operating durability',unit:'h',aliases:['durability','stability','operating lifetime','continuous operation'],units:{h:1,hours:1,hour:1,day:24,days:24},max:1e8},
  {id:'voltage',label:'Cell voltage',unit:'V',aliases:['cell voltage','stack voltage'],units:{V:1,mV:0.001},max:1000},
  {id:'specific_energy',label:'Specific energy (battery cell)',unit:'Wh/kg',aliases:['specific energy','energy density'],units:{'Wh/kg':1,'kWh/kg':1000},max:1e6},
  {id:'areal_capacity',label:'Areal capacity',unit:'mAh/cm²',aliases:['areal capacity','areal discharge capacity'],units:{'mAh/cm2':1,'Ah/cm2':1000},max:1e6},
  {id:'h2_energy',label:'Stack electrical energy / H₂',unit:'kWh/kg H₂',aliases:['specific energy consumption','stack electricity consumption'],units:{'kWh/kgH2':1,'Wh/kgH2':0.001},max:1e6},
  {id:'recovery',label:'Metal recovery efficiency',unit:'%',aliases:['recovery efficiency','metal recovery','recovery yield'],units:{'%':1},max:100},
  {id:'loading',label:'Catalyst loading',unit:'mg/cm²',aliases:['catalyst loading','pgm loading'],units:{'mg/cm2':1,'g/cm2':1000},max:1e9}
];
const ATLAS_EVIDENCE_METRIC_FAMILIES={
 density:['hydrogen','carbon','fuel','surface','other'],
 partial_density:['carbon','other'],
 fe:['hydrogen','carbon','fuel','recovery','other'],
 ce:['battery','other'],
 duration:['hydrogen','carbon','battery','fuel','recovery','surface','other'],
 voltage:['hydrogen','carbon','battery','fuel','surface','other'],
 specific_energy:['battery','other'],
 areal_capacity:['battery','other'],
 h2_energy:['hydrogen'],
 recovery:['recovery','other'],
 loading:['hydrogen','carbon','fuel','surface','other']
};
function atlasEvidenceMetricAllowed(metricId,family){
  return !!ATLAS_EVIDENCE_METRIC_FAMILIES[metricId]?.includes(family);
}
const ATLAS_EVIDENCE_FAMILIES={
 hydrogen:'Water electrolysis / H₂',
 carbon:'CO₂ electroreduction',
 battery:'Batteries / storage',
 fuel:'Fuel cells',
 recovery:'Metal / mineral extraction',
 surface:'Electrodeposition / anodizing',
 other:'Other electrochemistry'
};
const ATLAS_EVIDENCE_CONFIGS={
 stack:'Full stack / system',
 device:'Full cell / complete device',
 half:'Half-cell',
 three:'Three-electrode',
 electrode:'Electrode / catalyst only',
 reactor:'Flow reactor / module',
 unknown:'Not specified'
};
const ATLAS_EVIDENCE_BASES={
 geometric:'Geometric area',
 ecsa:'ECSA-normalized area',
 mass:'Active mass',
 device:'Packaged device / total mass',
 feed:'Feed / product mass',
 other:'Other / unknown'
};
let atlasEvidenceRecords=[];
let atlasEvidenceSelection='';

function atlasEvidenceClean(v,max=240){return String(v??'').trim().slice(0,max);}
function atlasEvidenceParseNumber(value){
  const str=String(value??'').trim();
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(str))return null;
  const number=Number(str);
  return Number.isFinite(number)&&number>=0&&number<=1e10?number:null;
}
function atlasEvidenceCleanUnit(unit){
  return String(unit||'').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'}[c]))
    .replace(/H₂/g,'H2').replace(/−/g,'-')
    .replace(/\b(mAh|Ah|mA|A|mg|g)\s*(?:·|⋅|\s)\s*cm\s*(?:-2|\^-2)\b/gi,'$1/cm2')
    .replace(/[·⋅]/g,'').replace(/\s+/g,'')
    .replace(/cm\^-?2/gi,'cm2').replace(/cm-2/gi,'cm2').trim();
}
function atlasEvidenceCanonicalValue(metricId,value,sourceUnit){
  const spec=ATLAS_EVIDENCE_METRICS.find(x=>x.id===metricId);
  const number=atlasEvidenceParseNumber(value);
  if(!spec||number===null)return null;
  const rawUnit=atlasEvidenceCleanUnit(sourceUnit||spec.unit);
  const matched=Object.entries(spec.units).find(([unit])=>atlasEvidenceCleanUnit(unit).toLowerCase()===rawUnit.toLowerCase());
  if(!matched)return null;
  const converted=number*matched[1];
  return Number.isFinite(converted)&&converted>=0&&converted<=spec.max?converted:null;
}
function atlasEvidenceDoi(v){
  const s=atlasEvidenceClean(v,170).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi\s*:\s*/i,'').replace(/[.,;]+$/,'').toLowerCase();
  return /^10\.\d{4,9}\/[a-z0-9._;()/:+-]+$/i.test(s)?s:'';
}
function atlasEvidenceSameTitle(a,b){
  const clean=t=>String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const x=clean(a),y=clean(b);if(!x||!y)return false;
  if(x===y)return true;
  const terms=t=>new Set(t.split(' ').filter(w=>w.length>=4));
  const left=terms(x),right=terms(y);
  if(left.size<3||right.size<3)return false;
  let common=0;for(const w of left)if(right.has(w))common++;
  return common>=3&&common/Math.max(left.size,right.size)>=0.8;
}
function atlasEvidenceProtocol(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
function atlasEvidenceComparable(a,b){
  if(!a||!b||a.metric!==b.metric||a.family!==b.family)return false;
  if(!a.configuration||!b.configuration||a.configuration==='unknown'||b.configuration==='unknown')return false;
  if(!a.basis||!b.basis||a.basis==='other'||b.basis==='other')return false;
  if(!atlasEvidenceProtocol(a.conditions)||!atlasEvidenceProtocol(b.conditions))return false;
  return a.configuration===b.configuration&&a.basis===b.basis&&atlasEvidenceProtocol(a.conditions)===atlasEvidenceProtocol(b.conditions);
}
function atlasEvidenceValidate(v){
  if(!v||!ATLAS_EVIDENCE_METRICS.some(m=>m.id===v.metric)||!Object.hasOwn(ATLAS_EVIDENCE_FAMILIES,v.family)||!atlasEvidenceMetricAllowed(v.metric,v.family))return null;
  const spec=ATLAS_EVIDENCE_METRICS.find(m=>m.id===v.metric);
  const number=atlasEvidenceParseNumber(v.value);
  if(number===null||number>spec.max)return null;
  const doi=atlasEvidenceDoi(v.doi);
  if(!doi)return null;
  const config=Object.hasOwn(ATLAS_EVIDENCE_CONFIGS,v.configuration)?v.configuration:'unknown';
  const basis=Object.hasOwn(ATLAS_EVIDENCE_BASES,v.basis)?v.basis:'other';
  const source= v.provenance==='ai'?'ai':'user';
  return {
    id:atlasEvidenceClean(v.id,180)||('manual:'+doi+':'+v.metric+':'+number),
    family:v.family,metric:v.metric,value:number,doi,
    title:atlasEvidenceClean(v.title,230)||doi,
    journal:atlasEvidenceClean(v.journal,100),date:atlasEvidenceClean(v.date,12),
    configuration:config,basis,conditions:atlasEvidenceClean(v.conditions,300),
    location:atlasEvidenceClean(v.location,160),
    provenance:source,
    verifiedIdentity:v.verifiedIdentity===true,
    checkedAt:atlasEvidenceClean(v.checkedAt,32)
  };
}
function atlasEvidenceFormat(n){
  return Number(n).toLocaleString('en-US',{maximumFractionDigits:5});
}
function atlasEvidenceAdd(record){
  const item=atlasEvidenceValidate(record);
  if(!item)throw Error('A valid DOI, metric, nonnegative numerical value and technology are required.');
  const i=atlasEvidenceRecords.findIndex(x=>x.id===item.id);
  if(i>=0)atlasEvidenceRecords.splice(i,1);
  atlasEvidenceRecords.unshift(item);
  atlasEvidenceRecords=atlasEvidenceRecords.slice(0,ATLAS_EVIDENCE_MAX);
  atlasEvidenceSave();
  return item;
}
function atlasEvidenceSave(){
  try{localStorage.setItem(ATLAS_EVIDENCE_STORE,JSON.stringify(atlasEvidenceRecords));}
  catch{atlasEvidenceNotice('Browser storage unavailable. Export JSON to preserve your observations.');}
}
function atlasEvidenceLoad(){
  try{
    const data=JSON.parse(localStorage.getItem(ATLAS_EVIDENCE_STORE)||'[]');
    atlasEvidenceRecords=(Array.isArray(data)?data:[]).slice(0,ATLAS_EVIDENCE_MAX).map(atlasEvidenceValidate).filter(Boolean);
  }catch{atlasEvidenceRecords=[];}
}
function atlasEvidenceNotice(text){
  const el=document.getElementById('evidenceNotice');
  if(el)el.textContent=text;
}
async function atlasEvidenceVerifyDoi(item){
  try{
    const r=await fetchRetry('https://api.crossref.org/works/'+encodeURIComponent(item.doi),null,15000,1);
    const paper=r?.message||{};
    if(atlasEvidenceDoi(paper.DOI)!==item.doi||paper.type&&paper.type!=='journal-article')return false;
    if(!atlasEvidenceSameTitle(item.title,paper.title?.[0]))return false;
    const stored=atlasEvidenceRecords.find(x=>x.id===item.id);
    if(!stored)return false;
    stored.title=atlasEvidenceClean(paper.title?.[0]||stored.title,230);
    stored.journal=atlasEvidenceClean(paper['container-title']?.[0]||'',100);
    stored.date=typeof authoritativePublicationDate==='function'?authoritativePublicationDate(paper):'';
    stored.verifiedIdentity=true;
    stored.checkedAt=new Date().toISOString().slice(0,10);
    atlasEvidenceSave();
    atlasEvidenceRender();
    return true;
  }catch{return false;}
}
function atlasEvidenceBuildNode(tag,textValue,className){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(textValue!==undefined&&textValue!==null)el.textContent=String(textValue);
  return el;
}
function atlasEvidenceRecordRow(item,anchor,max){
  const spec=ATLAS_EVIDENCE_METRICS.find(m=>m.id===item.metric);
  const compare=atlasEvidenceComparable(item,anchor);
  const row=atlasEvidenceBuildNode('button',null,'evidence-plot-row'+(item.id===atlasEvidenceSelection?' selected':''));
  row.type='button';row.dataset.evidenceId=item.id;
  const head=atlasEvidenceBuildNode('span',null,'evidence-plot-head');
  const title=atlasEvidenceBuildNode('span',item.title,'evidence-plot-paper');
  const val=atlasEvidenceBuildNode('b',atlasEvidenceFormat(item.value)+' '+spec.unit,'evidence-plot-value');
  head.append(title,val);
  const track=atlasEvidenceBuildNode('span',null,'evidence-track');
  const bar=atlasEvidenceBuildNode('span',null,'evidence-bar'+(compare?' comparable':''));
  bar.style.width=Math.max(1.5,100*item.value/Math.max(max,1e-8))+'%';
  track.append(bar);
  const sub=atlasEvidenceBuildNode('span',(item.id===anchor?.id?'Comparison anchor':compare?'Same declared protocol':'Protocol match not established')+' · '+(item.provenance==='ai'?'AI-extracted':'User transcribed'),'evidence-plot-sub');
  row.append(head,track,sub);
  row.addEventListener('click',()=>{atlasEvidenceSelection=item.id;atlasEvidenceRender();});
  return row;
}
function atlasEvidenceSelected(){
  const panel=document.getElementById('evidenceExplorer');
  const family=panel?.querySelector('#evidenceFamily')?.value||'hydrogen';
  const metric=panel?.querySelector('#evidenceMetric')?.value||'density';
  return atlasEvidenceRecords.filter(x=>x.family===family&&x.metric===metric).slice(0,12);
}
function atlasEvidenceRender(){
  const panel=document.getElementById('evidenceExplorer');
  if(!panel)return;
  const metric=panel.querySelector('#evidenceMetric').value;
  const spec=ATLAS_EVIDENCE_METRICS.find(x=>x.id===metric)||ATLAS_EVIDENCE_METRICS[0];
  const records=atlasEvidenceSelected();
  panel.querySelector('#evidenceUnit').textContent='Measured value ('+spec.unit+')';
  const selector=panel.querySelector('#evidenceAnchor');
  const old=selector.value;
  selector.replaceChildren();
  for(const record of records){
    const option=document.createElement('option');
    option.value=record.id;option.textContent=record.title.slice(0,68);
    selector.append(option);
  }
  if(records.some(x=>x.id===old))selector.value=old;
  selector.disabled=records.length===0;
  const anchor=records.find(x=>x.id===selector.value)||records[0];
  const count=records.filter(x=>atlasEvidenceComparable(x,anchor)).length;
  panel.querySelector('#evidenceSummary').textContent=records.length
    ?records.length+' observations displayed · '+count+' in the same declared protocol as the anchor (including anchor). This is not independent test-condition validation.'
    :'No observations for this domain and metric. Add a cited measurement below or import saved deep-analysis evidence.';
  const plot=panel.querySelector('#evidencePlot');
  plot.replaceChildren();
  if(!records.length){
    plot.append(atlasEvidenceBuildNode('p','The chart is intentionally empty until source-linked measurements are available. No numerical benchmarks are fabricated.','evidence-placeholder'));
  }else{
    const max=Math.max(1e-9,...records.map(x=>x.value));
    for(const record of records)plot.append(atlasEvidenceRecordRow(record,anchor,max));
    plot.append(atlasEvidenceBuildNode('p','Bar lengths share the selected metric and unit. Bars do not imply equivalent materials, operating conditions, uncertainty, or industrial readiness.','evidence-chart-foot'));
  }
  const item=records.find(x=>x.id===atlasEvidenceSelection)||anchor;
  const detail=panel.querySelector('#evidenceDetail');
  detail.replaceChildren();
  if(item){
    const header=atlasEvidenceBuildNode('h3',item.title);
    const source=atlasEvidenceBuildNode('a','Open DOI source');
    source.href='https://doi.org/'+item.doi;source.target='_blank';source.rel='noopener noreferrer';
    const provenance=atlasEvidenceBuildNode('p',(item.verifiedIdentity?'Crossref DOI/title identity checked':'DOI identity unchecked')+' · '+(item.provenance==='ai'?'AI-extracted value; NOT independently verified':'Researcher-transcribed value; NOT independently verified'),'evidence-provenance');
    const info=atlasEvidenceBuildNode('dl',null,'evidence-properties');
    const entries=[
      ['Reported result',atlasEvidenceFormat(item.value)+' '+spec.unit],
      ['Cell configuration',ATLAS_EVIDENCE_CONFIGS[item.configuration]],
      ['Normalization basis',ATLAS_EVIDENCE_BASES[item.basis]],
      ['Declared test conditions',item.conditions||'Not provided'],
      ['Evidence location',item.location||'Not provided'],
      ['Journal / online date',[item.journal,item.date].filter(Boolean).join(' · ')||'Not checked'],
      ['Like-for-like status',atlasEvidenceComparable(item,anchor)?'Same user-declared protocol; not experimentally verified':'Not established']
    ];
    for(const [key,value] of entries){info.append(atlasEvidenceBuildNode('dt',key),atlasEvidenceBuildNode('dd',value));}
    const actions=atlasEvidenceBuildNode('div',null,'evidence-detail-actions');
    const verify=atlasEvidenceBuildNode('button',item.verifiedIdentity?'Recheck DOI identity':'Verify DOI identity','ghost small');verify.type='button';
    verify.addEventListener('click',async()=>{verify.disabled=true;const success=await atlasEvidenceVerifyDoi(item);atlasEvidenceNotice(success?'Crossref confirmed bibliographic identity only; the measured value remains unverified.':'Unable to verify the DOI now. Your observation remains available.');verify.disabled=false;});
    const remove=atlasEvidenceBuildNode('button','Remove observation','ghost small');remove.type='button';
    remove.addEventListener('click',()=>{if(!confirm('Remove this observation from local Evidence Plots?'))return;atlasEvidenceRecords=atlasEvidenceRecords.filter(x=>x.id!==item.id);atlasEvidenceSelection='';atlasEvidenceSave();atlasEvidenceRender();});
    actions.append(verify,remove);detail.append(header,source,provenance,info,actions);
  }else detail.append(atlasEvidenceBuildNode('p','Select a plotted observation to inspect its citation, operating conditions, and evidence status.'));
  panel.querySelector('#evidenceTotal').textContent=atlasEvidenceRecords.length+' saved locally';
}
function atlasEvidenceAddFromForm(){
  const panel=document.getElementById('evidenceExplorer');
  const get=id=>panel.querySelector('#'+id)?.value||'';
  const value=atlasEvidenceCanonicalValue(get('evidenceMetric'),get('evidenceValue'),ATLAS_EVIDENCE_METRICS.find(x=>x.id===get('evidenceMetric')).unit);
  if(value===null)throw Error('Enter a valid nonnegative measurement in the displayed units.');
  const doi=atlasEvidenceDoi(get('evidenceDOI'));
  if(!doi)throw Error('Enter a valid source DOI (10.xxxx/...).');
  const title=atlasEvidenceClean(get('evidenceTitle'),230);
  if(!title)throw Error('Enter the published paper title.');
  const loc=atlasEvidenceClean(get('evidenceLocation'),160);
  if(!loc)throw Error('Enter an exact evidence location (page, figure or table).');
  const conditions=atlasEvidenceClean(get('evidenceConditions'),300);
  if(!conditions)throw Error('State the key experimental conditions and protocol to enable comparison.');
  const id='manual:'+doi+':'+get('evidenceFamily')+':'+get('evidenceMetric')+':'+value+':'+atlasEvidenceProtocol(loc);
  const result=atlasEvidenceAdd({id,metric:get('evidenceMetric'),family:get('evidenceFamily'),value,doi,title,location:loc,conditions,
    configuration:get('evidenceConfiguration'),basis:get('evidenceBasis'),provenance:'user'});
  atlasEvidenceSelection=result.id;
  atlasEvidenceRender();
  return result;
}
function atlasEvidenceTopicFamily(topic){
  if(/(?:batter|supercapacitor)/i.test(topic))return 'battery';
  if(/fuel cells/i.test(topic))return 'fuel';
  if(/critical minerals|rare earth|precious metals/i.test(topic))return 'recovery';
  if(/anodiz|electroplat|protective coatings/i.test(topic))return 'surface';
  return 'other';
}
function atlasEvidenceExtractRecord(p,field,metric,family){
  if(!p||p.recordType==='patent')return null;
  if(atlasEvidenceTopicFamily(p.topic||'')!==family)return null;
  const term=String(field.metric||'').toLowerCase();
  if(!metric.aliases.some(w=>term.includes(w)))return null;
  if(metric.id==='density'&&/partial current density/.test(term))return null;
  const doi=atlasEvidenceDoi(p.doi);
  if(!doi||!field.sourceUrl&&!field.evidenceLocation)return null;
  const value=atlasEvidenceCanonicalValue(metric.id,field.value,field.unit);
  if(value===null)return null;
  const basisText=(field.measurementBasis||'').toLowerCase();
  const config=/three[- ]electrode/.test(basisText)?'three':/half[- ]cell/.test(basisText)?'half':/stack/.test(basisText)?'stack':/full[- ]cell|pouch|device/.test(basisText)?'device':'unknown';
  const basis=/ecsa/.test(basisText)?'ecsa':/geometric/.test(basisText)?'geometric':/active.mass/.test(basisText)?'mass':'other';
  return atlasEvidenceValidate({
    id:'ai:'+doi+':'+metric.id+':'+value+':'+atlasEvidenceClean(field.evidenceLocation||field.sourceUrl,100),
    title:p.title,doi,metric:metric.id,family,value,configuration:config,basis,
    conditions:field.testConditions||'',location:field.evidenceLocation||'',provenance:'ai',
    verifiedIdentity:!!p.doi&&/Crossref/i.test(p.source||''),journal:p.journalName,date:p.date
  });
}
function atlasEvidenceImport(){
  const metricId=document.getElementById('evidenceMetric').value;
  const family=document.getElementById('evidenceFamily').value;
  const metric=ATLAS_EVIDENCE_METRICS.find(x=>x.id===metricId);
  const saved=(typeof paperDatabase!=='undefined'&&Array.isArray(paperDatabase)?paperDatabase:[]);
  const current=(typeof currentResults!=='undefined'&&Array.isArray(currentResults)?currentResults:[]);
  const known=new Map();
  for(const p of [...saved,...current])if(p&&p.doi)known.set(atlasEvidenceDoi(p.doi),p);
  let count=0;
  const existing=new Set(atlasEvidenceRecords.map(x=>x.id));
  for(const p of known.values()){
    for(const field of Array.isArray(p.quantitativeEvidence)?p.quantitativeEvidence:[]){
      const item=atlasEvidenceExtractRecord(p,field,metric,family);
      if(item&&!existing.has(item.id)){
        if(atlasEvidenceRecords.length>=ATLAS_EVIDENCE_MAX)break;
        atlasEvidenceRecords.push(item);existing.add(item.id);count++;
      }
    }
  }
  if(count)atlasEvidenceSave();
  atlasEvidenceRender();
  atlasEvidenceNotice(count?count+' AI-extracted records imported. Their numerical values have NOT been independently verified.':'No exact unit-compatible quantitative results were available for this topic and metric. Run deep analysis or add a cited measurement manually.');
}
function atlasEvidenceExport(){
  const data={schema_version:1,generated_at:new Date().toISOString(),warning:'All values are researcher-transcribed or AI-extracted; Crossref checks DOI identity, not numerical results. Like-for-like tags are declarations, not independent experimental verification.',records:atlasEvidenceRecords};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download='eureka-atlas-evidence-plots-'+new Date().toISOString().slice(0,10)+'.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
function initAtlasEvidenceExplorer(){
  const panel=document.getElementById('evidenceExplorer');if(!panel)return;
  const metric=panel.querySelector('#evidenceMetric');
  const family=panel.querySelector('#evidenceFamily');
  function fillMetrics(){
    const prev=metric.value;
    metric.replaceChildren();
    for(const m of ATLAS_EVIDENCE_METRICS.filter(x=>atlasEvidenceMetricAllowed(x.id,family.value))){
      const option=document.createElement('option');option.value=m.id;option.textContent=m.label+' ('+m.unit+')';metric.append(option);
    }
    if([...metric.options].some(o=>o.value===prev))metric.value=prev;
    atlasEvidenceSelection='';atlasEvidenceRender();
  }
  atlasEvidenceLoad();fillMetrics();
  family.addEventListener('change',fillMetrics);
  for(const id of ['evidenceMetric','evidenceAnchor'])panel.querySelector('#'+id).addEventListener('change',()=>{atlasEvidenceSelection='';atlasEvidenceRender();});
  panel.querySelector('#evidenceAdd').addEventListener('click',()=>{
    try{const row=atlasEvidenceAddFromForm();atlasEvidenceNotice('Observation saved locally. DOI identity is not checked yet; the numeric value is researcher-transcribed.');atlasEvidenceVerifyDoi(row);}
    catch(e){atlasEvidenceNotice(e.message);}
  });
  panel.querySelector('#evidenceImport').addEventListener('click',atlasEvidenceImport);
  panel.querySelector('#evidenceExport').addEventListener('click',atlasEvidenceExport);
  panel.querySelector('#evidenceClear').addEventListener('click',()=>{if(!confirm('Delete all locally saved Evidence Plot observations?'))return;atlasEvidenceRecords=[];atlasEvidenceSelection='';atlasEvidenceSave();atlasEvidenceRender();atlasEvidenceNotice('Local evidence observations cleared.');});
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAtlasEvidenceExplorer);
  else initAtlasEvidenceExplorer();
}
