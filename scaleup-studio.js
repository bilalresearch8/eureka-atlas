'use strict';
// Eureka Atlas v21: deterministic, offline, source-transparent electrochemical scale-up.
const ATLAS_FARADAY=96485.33212; // C/mol e−; CODATA/NIST 2022 recommended
const ATLAS_H2_KG_PER_MOL=0.00201588;
const ATLAS_CO_KG_PER_MOL=0.0280101;
const ATLAS_CO2_KG_PER_MOL=0.0440095;
const ATLAS_LI_KG_PER_MMOL=0.00000694;
const ATLAS_LCE_KG_PER_KG_LI=73.89/(2*6.94);

function atlasScaleNumber(obj,key,min,max){
  const raw=obj[key];
  if(raw===null||raw===undefined||String(raw).trim()==='')throw Error(key.replace(/_/g,' ')+' is required.');
  const n=Number(raw);
  if(!Number.isFinite(n)||n<min||n>max)throw Error(key.replace(/_/g,' ')+' must be between '+min+' and '+max+'.');
  return n;
}
function atlasScaleOptional(obj,key,min,max){
  if(obj[key]===null||obj[key]===undefined||String(obj[key]).trim()==='')return null;
  return atlasScaleNumber(obj,key,min,max);
}
function atlasScaleGas(v,product){
  const j=atlasScaleNumber(v,'current_density_A_cm2',0,50);
  const area=atlasScaleNumber(v,'cell_area_cm2',0.001,10000000);
  const cells=atlasScaleNumber(v,'series_cells',1,100000);
  if(!Number.isInteger(cells))throw Error('series cells must be a whole number.');
  const voltage=atlasScaleNumber(v,'cell_voltage_V',0.01,50);
  const fraction=atlasScaleNumber(v,'faradaic_efficiency_percent',0,100)/100;
  const uptime=atlasScaleNumber(v,'uptime_percent',0,100)/100;
  const targetKgDay=atlasScaleOptional(v,'target_kg_day',0.000001,1e9);
  const bop=atlasScaleOptional(v,'additional_bop_kwh_kg',0,1e6);
  const molecularMass=product==='h2'?ATLAS_H2_KG_PER_MOL:ATLAS_CO_KG_PER_MOL;
  const current=j*area;
  const ratedKw=current*cells*voltage/1000;
  const idealKgDay=current*cells*86400*uptime*molecularMass/(2*ATLAS_FARADAY);
  const productKgDay=idealKgDay*fraction;
  const energyKwhDay=ratedKw*24*uptime;
  const stackKwhKg=productKgDay>0?energyKwhDay/productKgDay:null;
  const systemKwhKg=stackKwhKg!==null&&bop!==null?stackKwhKg+bop:null;
  const requiredArea=targetKgDay!==null&&productKgDay>0?area*targetKgDay/productKgDay:null;
  const result={
    mode:product,inputs:{...v},ratedStackKw:ratedKw,currentA:current,
    idealKgDay,productKgDay,energyKwhDay,stackKwhKg,systemKwhKg,
    requiredAreaCm2:requiredArea,faradaicEfficiency:fraction,uptime
  };
  if(product==='co'){
    const use=atlasScaleOptional(v,'single_pass_CO2_use_percent',0.0001,100);
    result.co2StoichiometricKgDay=productKgDay*ATLAS_CO2_KG_PER_MOL/ATLAS_CO_KG_PER_MOL;
    result.co2SinglePassInletKgDay=use!==null?result.co2StoichiometricKgDay/(use/100):null;
  }
  return result;
}
function atlasScaleLithium(v){
  const flux=atlasScaleNumber(v,'li_flux_mmol_m2_h',0,1e9);
  const area=atlasScaleNumber(v,'membrane_area_m2',0.001,1e9);
  const feedFlow=atlasScaleNumber(v,'feed_flow_L_h',0,1e10);
  const feedLi=atlasScaleNumber(v,'feed_li_mg_L',0,1e8);
  const targetRecovery=atlasScaleNumber(v,'target_recovery_percent',0,100)/100;
  const uptime=atlasScaleNumber(v,'uptime_percent',0,100)/100;
  const feedKgDay=feedFlow*feedLi*24*uptime/1e6;
  const fluxCeilingKgDay=flux*area*24*uptime*ATLAS_LI_KG_PER_MMOL;
  const desiredKgDay=feedKgDay*targetRecovery;
  const deliverableKgDay=Math.min(desiredKgDay,fluxCeilingKgDay);
  const requiredMembraneAreaM2=flux>0&&uptime>0?
    desiredKgDay/(flux*24*uptime*ATLAS_LI_KG_PER_MMOL):
    (desiredKgDay===0?0:null);
  const maximumRecoveryPercent=feedKgDay>0?100*Math.min(1,fluxCeilingKgDay/feedKgDay):null;
  return {
    mode:'lithium',inputs:{...v},feedKgDay,fluxCeilingKgDay,desiredKgDay,
    deliverableKgDay,requiredMembraneAreaM2,maximumRecoveryPercent,
    lceEquivalentKgDay:deliverableKgDay*ATLAS_LCE_KG_PER_KG_LI,
    uptime,targetRecovery
  };
}
function atlasScaleCalculate(mode,inputs){
  if(mode==='h2'||mode==='co')return atlasScaleGas(inputs,mode);
  if(mode==='lithium')return atlasScaleLithium(inputs);
  throw Error('Unknown electrochemical pathway.');
}
function atlasScaleFmt(n,digits=3){
  if(n===null||n===undefined||!Number.isFinite(n))return 'Not calculable';
  if(n===0)return '0';
  if(Math.abs(n)>=1e7||Math.abs(n)<0.0001)return n.toExponential(3);
  return n.toLocaleString('en-US',{maximumFractionDigits:digits});
}
function atlasScaleBarData(r){
  if(r.mode==='lithium')return [
    {name:'Lithium in feed',value:r.feedKgDay},
    {name:'Membrane flux ceiling',value:r.fluxCeilingKgDay},
    {name:'Recoverable at requested fraction',value:r.deliverableKgDay}
  ];
  return [
    {name:'100% Faradaic efficiency',value:r.idealKgDay},
    {name:'At measured FE',value:r.productKgDay}
  ];
}
function atlasScaleFieldMarkup(mode){
  const f={h2:[
    ['current_density_A_cm2','Current density','A/cm²','1.5','0','50'],
    ['cell_area_cm2','Active area per cell','cm²','100','0.001','10000000'],
    ['series_cells','Identical cells in series','count','10','1','100000'],
    ['cell_voltage_V','Average operating cell voltage','V','1.9','0.01','50'],
    ['faradaic_efficiency_percent','H₂ Faradaic efficiency','%','95','0','100'],
    ['uptime_percent','Operating uptime','%','90','0','100'],
    ['target_kg_day','Optional H₂ production target','kg/day','','0.000001','1000000000'],
    ['additional_bop_kwh_kg','Optional measured BoP electrical use','kWh/kg H₂','','0','1000000']
  ],co:[
    ['current_density_A_cm2','Total current density','A/cm²','0.3','0','50'],
    ['cell_area_cm2','Active area per cell','cm²','100','0.001','10000000'],
    ['series_cells','Identical cells in series','count','10','1','100000'],
    ['cell_voltage_V','Average full-cell voltage','V','3.2','0.01','50'],
    ['faradaic_efficiency_percent','CO Faradaic efficiency','%','85','0','100'],
    ['uptime_percent','Operating uptime','%','90','0','100'],
    ['target_kg_day','Optional CO production target','kg/day','','0.000001','1000000000'],
    ['single_pass_CO2_use_percent','Optional measured single-pass CO₂ utilization','%','','0.0001','100']
  ],lithium:[
    ['li_flux_mmol_m2_h','Measured net lithium flux','mmol Li/(m²·h)','250','0','1000000000'],
    ['membrane_area_m2','Effective membrane area','m²','10','0.001','1000000000'],
    ['feed_flow_L_h','Feed volumetric flow','L/h','500','0','10000000000'],
    ['feed_li_mg_L','Feed dissolved lithium concentration','mg Li/L','100','0','100000000'],
    ['target_recovery_percent','Target Li recovery','%','80','0','100'],
    ['uptime_percent','Operating uptime','%','90','0','100']
  ]};
  return (f[mode]||[]).map(([id,label,unit,defaultValue,min,max])=>
    '<label class="scale-field"><span>'+label+'</span><div><input id="scale_'+id+'" name="'+id+'" type="number" step="any" min="'+min+'" max="'+max+'" value="'+defaultValue+'" placeholder="Not supplied" '+(defaultValue===''?'':'required')+'><small>'+unit+'</small></div></label>').join('');
}
function atlasScaleReportMarkup(r){
  const isLi=r.mode==='lithium';
  const stat=isLi?[
    ['Li input',atlasScaleFmt(r.feedKgDay)+' kg/day'],
    ['Flux-limited ceiling',atlasScaleFmt(r.fluxCeilingKgDay)+' kg/day'],
    ['Recoverable Li',atlasScaleFmt(r.deliverableKgDay)+' kg/day'],
    ['Required membrane area',atlasScaleFmt(r.requiredMembraneAreaM2)+' m²'],
    ['Maximum flux-limited recovery',atlasScaleFmt(r.maximumRecoveryPercent)+' %'],
    ['LCE mass equivalent',atlasScaleFmt(r.lceEquivalentKgDay)+' kg/day']
  ]:[
    ['Stack electrical rating',atlasScaleFmt(r.ratedStackKw)+' kW'],
    ['Current per series cell',atlasScaleFmt(r.currentA)+' A'],
    ['Product mass',atlasScaleFmt(r.productKgDay)+' kg/day'],
    ['Stack electricity',atlasScaleFmt(r.energyKwhDay)+' kWh/day'],
    ['Stack electric intensity',atlasScaleFmt(r.stackKwhKg)+' kWh/kg'],
    ['Area per cell for optional target',r.requiredAreaCm2===null?'Not requested / FE or uptime zero':atlasScaleFmt(r.requiredAreaCm2)+' cm²']
  ];
  if(!isLi&&r.systemKwhKg!==null)stat.push(['Stack + entered BoP intensity',atlasScaleFmt(r.systemKwhKg)+' kWh/kg']);
  if(r.mode==='co')stat.push(['Stoichiometric CO₂ consumed',atlasScaleFmt(r.co2StoichiometricKgDay)+' kg/day'],
    ['Single-pass CO₂ inlet requirement',r.co2SinglePassInletKgDay===null?'Not reported':atlasScaleFmt(r.co2SinglePassInletKgDay)+' kg/day']);
  const cards=stat.map(([label,value])=>'<div class="scale-stat"><span>'+label+'</span><strong>'+value+'</strong></div>').join('');
  const series=atlasScaleBarData(r),max=Math.max(0,...series.map(x=>x.value));
  const bars=series.map(({name,value})=>
    '<div class="scale-bar-row"><div class="scale-bar-caption"><b>'+name+'</b><span>'+atlasScaleFmt(value)+' kg/day</span></div><div class="scale-track"><span style="width:'+(max>0?Math.min(100,Math.max(0,value/max*100)):0).toFixed(2)+'%"></span></div></div>').join('');
  const note=isLi
    ?'Calculated using the user-supplied net Li flux, a constant dissolved-Li feed concentration and uptime. Assumes flux remains stable over the entire active area. No selectivity, competing ions, fouling, energy use, membrane replacement, product purification, or economics are inferred. Lithium carbonate equivalent is a mass conversion, not an actual product yield.'
    :'Calculated from Faraday’s law for '+(r.mode==='h2'?'H₂ (2 electrons per mole)':'CO (2 electrons per mole)')+'. Series cells increase total production and electrical load; current through each cell remains the same. Stack-only electrical use excludes compression, pumps, separation, auxiliaries, thermal management, and capital costs. Only the explicitly entered Faradaic efficiency and uptime reduce product output; CO₂ feed utilization does not follow from Faradaic efficiency.';
  return '<div class="scale-metrics">'+cards+'</div><div class="scale-chart"><h4>Mass throughput · daily basis</h4>'+bars+'</div><p class="scale-caveat">'+note+'</p>';
}
function atlasScaleExport(r){
  return {
    app:'Eureka Atlas',release:'v21',generated_at:new Date().toISOString(),
    evidence_level:'Engineering calculation; every operating input is user-provided and unverified',
    product_basis:r.mode==='lithium'?'kg of elemental lithium; LCE is mass equivalent':r.mode==='h2'?'kg H2':'kg CO',
    constants:{faraday_C_per_mol:ATLAS_FARADAY,H2_kg_per_mol:ATLAS_H2_KG_PER_MOL,CO_kg_per_mol:ATLAS_CO_KG_PER_MOL,Li_kg_per_mmol:ATLAS_LI_KG_PER_MMOL,lce_per_li:ATLAS_LCE_KG_PER_KG_LI},
    calculation:r,
    references:['https://physics.nist.gov/cuu/Constants/','https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis'],
    caveat:'Not a lifecycle, technoeconomic, pilot-qualified, or independently verified performance assessment.'
  };
}
function initAtlasScaleStudio(){
  const panel=document.getElementById('scaleStudio');
  if(!panel)return;
  const mode=panel.querySelector('#scalePathway'),fields=panel.querySelector('#scaleFields'),error=panel.querySelector('#scaleError'),out=panel.querySelector('#scaleOutput');
  const exportBtn=panel.querySelector('#scaleExport');
  let last=null;
  function fieldsForMode(){
    fields.innerHTML=atlasScaleFieldMarkup(mode.value);
    error.textContent='';out.innerHTML='<p class="scale-placeholder">Enter measured operating values, then calculate a first-principles material and electricity balance.</p>';
    last=null;exportBtn.disabled=true;
  }
  function calc(){
    const values={};
    for(const input of fields.querySelectorAll('input'))values[input.name]=input.value;
    error.textContent='';
    try{
      const result=atlasScaleCalculate(mode.value,values);
      last=result;exportBtn.disabled=false;
      out.innerHTML=atlasScaleReportMarkup(result);
    }catch(e){last=null;exportBtn.disabled=true;error.textContent=String(e.message||'Invalid input');out.innerHTML='<p class="scale-placeholder">Correct the indicated input. No estimate was generated.</p>';}
  }
  panel.querySelector('#scaleCalculate').addEventListener('click',calc);
  mode.addEventListener('change',fieldsForMode);
  fields.addEventListener('input',()=>{if(last){last=null;exportBtn.disabled=true;error.textContent='Inputs changed — recalculate before exporting.';}});
  exportBtn.addEventListener('click',()=>{
    if(!last)return;
    const data=JSON.stringify(atlasScaleExport(last),null,2);
    const blob=new Blob([data],{type:'application/json'});
    const a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download='eureka-atlas-scaleup-'+last.mode+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  fieldsForMode();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAtlasScaleStudio);
  else initAtlasScaleStudio();
}
