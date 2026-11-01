'use strict';
// Verbatim 2026 US DOE technical target values; do not conflate technologies or stack/system bases.
// Sources: https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis
//          https://www.energy.gov/cmei/fuels/technical-targets-liquid-alkaline-electrolysis
//          https://www.energy.gov/cmei/fuels/technical-targets-high-temperature-electrolysis
const ATLAS_DOE_REFERENCES={
  pem:{
    name:'Low-temperature PEM electrolysis',
    url:'https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis',
    entries:[
      {id:'current',name:'Stack current density at 1.8 V/cell',value:3,unit:'A/cm²',direction:'higher',basis:'Stack performance measured at 1.8 V per cell; current density normalized to geometric active area'},
      {id:'stackEnergy',name:'Stack electricity consumption',value:48,unit:'kWh/kg H₂',direction:'lower',basis:'Stack electrical energy per kilogram hydrogen, LHV-based; not system energy'},
      {id:'systemEnergy',name:'System electricity consumption',value:51,unit:'kWh/kg H₂',direction:'lower',basis:'Complete system electrical energy per kilogram hydrogen, LHV-based'},
      {id:'lifetime',name:'Stack lifetime',value:80000,unit:'operating h',direction:'higher',basis:'End-of-life 10% stack voltage loss, measured at the same current density; operational duty must match'},
      {id:'degradation',name:'Average stack voltage degradation',value:2.3,unit:'mV/1,000 h',direction:'lower',basis:'Stack voltage degradation at rated current density, over relevant duty cycles'},
      {id:'pgm',name:'Total platinum-group-metal loading',value:0.5,unit:'mg/cm²',direction:'lower',basis:'Both electrodes combined; geometric active area, not individual catalyst layer'}
    ]
  },
  alkaline:{
    name:'Liquid alkaline electrolysis',
    url:'https://www.energy.gov/cmei/fuels/technical-targets-liquid-alkaline-electrolysis',
    entries:[
      {id:'current',name:'Stack current density at 1.8 V/cell',value:1.0,unit:'A/cm²',direction:'higher',basis:'Stack performance measured at 1.8 V per cell; geometric active area'},
      {id:'stackEnergy',name:'Stack electricity consumption',value:48,unit:'kWh/kg H₂',direction:'lower',basis:'Stack electrical energy per kilogram hydrogen, LHV basis'},
      {id:'systemEnergy',name:'System electricity consumption',value:52,unit:'kWh/kg H₂',direction:'lower',basis:'Complete system electrical energy per kilogram hydrogen, LHV basis'},
      {id:'lifetime',name:'Stack lifetime',value:80000,unit:'operating h',direction:'higher',basis:'Stack end-of-life and duty cycle as defined in the DOE target methodology'},
      {id:'degradation',name:'Average stack voltage degradation',value:2.3,unit:'mV/1,000 h',direction:'lower',basis:'Comparable stack voltage decay under representative operation'}
    ]
  },
  soec:{
    name:'High-temperature solid-oxide electrolysis',
    url:'https://www.energy.gov/cmei/fuels/technical-targets-high-temperature-electrolysis',
    entries:[
      {id:'current',name:'Stack current density at 1.28 V/cell',value:1.2,unit:'A/cm²',direction:'higher',basis:'High-temperature stack performance at 1.28 V per cell; thermal input must be accounted for separately'},
      {id:'stackEnergy',name:'Stack electricity consumption',value:34,unit:'kWh/kg H₂',direction:'lower',basis:'High-temperature stack electricity only; NOT total electricity-plus-heat input'},
      {id:'lifetime',name:'Stack lifetime',value:40000,unit:'operating h',direction:'higher',basis:'High-temperature stack durability under equivalent duty and end-of-life criteria'},
      {id:'degradation',name:'Average stack voltage degradation',value:3.2,unit:'mV/1,000 h',direction:'lower',basis:'High-temperature stack voltage degradation; temperature and steam feed are material conditions'}
    ]
  }
};
function atlasRefValue(value){
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0&&n<=1e9?n:null;
}
function atlasRefCompare(measured,entry,attested,citation){
  const number=atlasRefValue(measured);
  if(number===null)return {state:'empty',label:'Enter a measured value; no conclusion is possible.'};
  if(!attested||!String(citation||'').trim())return {state:'unknown',label:'Numerical visualization only. No condition match or evidence location has been established.'};
  const meets=entry.direction==='higher'?number>=entry.value:number<=entry.value;
  return {state:meets?'ahead':'behind',label:(meets?'Numerically meets':'Numerically falls short of')+' the 2026 DOE reference, assuming the user-confirmed identical reporting basis. This is not independent qualification.'};
}
function atlasReferencePercent(measured,entry){
  const n=atlasRefValue(measured);
  if(n===null||!Number.isFinite(entry?.value)||entry.value<=0)return null;
  return 100*n/entry.value;
}
function atlasFormatMetric(value){return Number(value).toLocaleString('en-US',{maximumFractionDigits:3});}
function atlasBuildReferenceChart(panel,entry,measured){
  const chart=panel.querySelector('#industrialRefBars');
  chart.replaceChildren();
  const points=[{name:'Your measured result',value:measured,kind:'measured'},{name:'DOE 2026 target',value:entry.value,kind:'reference'}];
  const top=Math.max(entry.value,Number(measured)||0,1e-12);
  for(const item of points){
    const line=document.createElement('div');line.className='industrial-ref-line';
    const header=document.createElement('div');header.className='industrial-ref-line-label';
    const left=document.createElement('span');left.textContent=item.name;
    const right=document.createElement('strong');right.textContent=item.value===null?'Not provided':atlasFormatMetric(item.value)+' '+entry.unit;
    header.append(left,right);
    const track=document.createElement('div');track.className='industrial-ref-track';
    const bar=document.createElement('div');bar.className='industrial-ref-fill '+item.kind;
    bar.style.width=(item.value===null?0:Math.min(100,100*item.value/top))+'%';
    track.appendChild(bar);line.append(header,track);chart.appendChild(line);
  }
  chart.setAttribute('aria-label','Measured result and DOE target, both in '+entry.unit+'. '+(measured===null?'No measured value entered.':'Measured '+atlasFormatMetric(measured)+', DOE '+atlasFormatMetric(entry.value)));
}
function initIndustrialReferences(){
  const panel=document.getElementById('industrialExplorer');
  if(!panel)return;
  const tech=panel.querySelector('#industrialTech'),metric=panel.querySelector('#industrialMetric');
  const input=panel.querySelector('#industrialMeasured'),attest=panel.querySelector('#industrialAttest'),citation=panel.querySelector('#industrialCitation');
  const note=panel.querySelector('#industrialRefStatus'),standard=panel.querySelector('#industrialRefBasis');
  const table=panel.querySelector('#industrialReferenceTable'),link=panel.querySelector('#industrialOfficialSource'),ratio=panel.querySelector('#industrialRatio');
  let currentKey='';
  const render=()=>{
    const data=ATLAS_DOE_REFERENCES[tech.value]||ATLAS_DOE_REFERENCES.pem;
    if(currentKey!==tech.value){
      currentKey=tech.value;metric.replaceChildren();
      for(const entry of data.entries){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name;metric.appendChild(option);}
      input.value='';citation.value='';attest.checked=false;
    }
    const entry=data.entries.find(x=>x.id===metric.value)||data.entries[0];
    link.href=data.url;link.textContent='Official DOE technical target source';
    standard.textContent='Target basis: '+entry.basis;
    panel.querySelector('#industrialUnit').textContent='Enter '+entry.unit;
    table.replaceChildren();
    for(const e of data.entries){
      const tr=document.createElement('tr');
      for(const item of [e.name,atlasFormatMetric(e.value)+' '+e.unit,e.basis]){
        const td=document.createElement('td');td.textContent=item;tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    const value=atlasRefValue(input.value);
    atlasBuildReferenceChart(panel,entry,value);
    const response=atlasRefCompare(input.value,entry,attest.checked,citation.value);
    note.textContent=response.label;note.className='industrial-ref-status '+response.state;
    const percentage=atlasReferencePercent(value,entry);
    ratio.textContent=percentage===null?'No ratio calculated.':atlasFormatMetric(percentage)+'% of the DOE numerical target (direction: '+(entry.direction==='higher'?'higher is better':'lower is better')+').';
  };
  tech.addEventListener('change',render);
  metric.addEventListener('change',()=>{input.value='';citation.value='';attest.checked=false;render();});
  input.addEventListener('input',render);
  citation.addEventListener('input',render);
  attest.addEventListener('change',render);
  render();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initIndustrialReferences);
  else initIndustrialReferences();
}
