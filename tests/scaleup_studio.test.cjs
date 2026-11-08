'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'scaleup-studio.js'),'utf8');
const css=fs.readFileSync(path.join(root,'scaleup-studio.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
new vm.Script(js,{filename:'scaleup-studio.js'});
new vm.Script(sw,{filename:'sw.js'});
const ctx={};
vm.runInNewContext(js+'\nglobalThis.__scale={atlasScaleCalculate,atlasScaleGas,atlasScaleLithium,atlasScaleBarData,atlasScaleReportMarkup,ATLAS_FARADAY,ATLAS_LCE_KG_PER_KG_LI};',ctx);
const m=ctx.__scale;
const close=(got,expected,tol=1e-8)=>assert.ok(Math.abs(got-expected)<=tol*Math.max(1,Math.abs(expected)),got+' != '+expected);
const base={current_density_A_cm2:1,cell_area_cm2:100,series_cells:1,cell_voltage_V:1.8,faradaic_efficiency_percent:100,uptime_percent:100};
const h=m.atlasScaleCalculate('h2',base);
close(h.currentA,100);
close(h.ratedStackKw,0.18);
close(h.idealKgDay,100*86400*0.00201588/(2*96485.33212));
close(h.productKgDay,h.idealKgDay);
close(h.energyKwhDay,4.32);
close(h.stackKwhKg,2*96485.33212*1.8/(3.6e6*0.00201588),1e-9);
assert.ok(h.stackKwhKg>47&&h.stackKwhKg<49,'Faraday prediction near DOE PEM 2026 48 kWh/kg at 1.8 V, 100% FE');
const h2=m.atlasScaleCalculate('h2',{...base,series_cells:4,faradaic_efficiency_percent:50,uptime_percent:75,target_kg_day:1,additional_bop_kwh_kg:5});
close(h2.productKgDay,h.idealKgDay*4*.5*.75);
close(h2.energyKwhDay,h.energyKwhDay*4*.75);
close(h2.stackKwhKg,2*h.stackKwhKg);
close(h2.systemKwhKg,h2.stackKwhKg+5);
close(h2.requiredAreaCm2,100/h2.productKgDay);
const co=m.atlasScaleCalculate('co',{...base,cell_voltage_V:3.2,faradaic_efficiency_percent:85,single_pass_CO2_use_percent:25});
close(co.productKgDay,100*86400*0.0280101/(2*96485.33212)*.85);
close(co.co2StoichiometricKgDay,co.productKgDay*0.0440095/0.0280101);
close(co.co2SinglePassInletKgDay,co.co2StoichiometricKgDay*4);
assert.ok(co.stackKwhKg>0);
const li=m.atlasScaleCalculate('lithium',{li_flux_mmol_m2_h:250,membrane_area_m2:10,feed_flow_L_h:500,feed_li_mg_L:100,target_recovery_percent:80,uptime_percent:90});
close(li.feedKgDay,1.08);
close(li.fluxCeilingKgDay,250*10*24*.9*0.00000694);
close(li.desiredKgDay,0.864);
close(li.deliverableKgDay,li.fluxCeilingKgDay);
close(li.requiredMembraneAreaM2,0.864/(250*24*.9*0.00000694));
close(li.lceEquivalentKgDay,li.deliverableKgDay*73.89/(2*6.94));
const enough=m.atlasScaleCalculate('lithium',{li_flux_mmol_m2_h:250,membrane_area_m2:40,feed_flow_L_h:500,feed_li_mg_L:100,target_recovery_percent:80,uptime_percent:90});
close(enough.deliverableKgDay,0.864);
const limited=m.atlasScaleCalculate('lithium',{li_flux_mmol_m2_h:1,membrane_area_m2:1,feed_flow_L_h:500,feed_li_mg_L:100,target_recovery_percent:80,uptime_percent:90});
close(limited.deliverableKgDay,limited.fluxCeilingKgDay);
assert.ok(limited.maximumRecoveryPercent<1);
const zero=m.atlasScaleCalculate('h2',{...base,faradaic_efficiency_percent:0});
close(zero.productKgDay,0);assert.equal(zero.stackKwhKg,null);
for(const invalid of [
  {...base,series_cells:1.5},
  {...base,faradaic_efficiency_percent:101},
  {...base,cell_voltage_V:-3},
  {...base,current_density_A_cm2:''},
  {...base,current_density_A_cm2:'NaN'}
]) assert.throws(()=>m.atlasScaleCalculate('h2',invalid));
assert.throws(()=>m.atlasScaleCalculate('lithium',{li_flux_mmol_m2_h:-1,membrane_area_m2:10,feed_flow_L_h:500,feed_li_mg_L:100,target_recovery_percent:80,uptime_percent:90}));
assert.throws(()=>m.atlasScaleCalculate('unknown',base));
assert.ok(m.atlasScaleReportMarkup(li).includes('mass conversion, not an actual product yield'));
assert.equal(m.atlasScaleBarData(h).length,2);
assert.equal(m.atlasScaleBarData(li).length,3);
for(const id of ['scaleStudio','scalePathway','scaleFields','scaleError','scaleOutput','scaleCalculate','scaleExport']) assert.ok(html.includes('id="'+id+'"'),id);
assert.match(html,/scaleup-studio\.js/);assert.match(html,/scaleup-studio\.css/);
assert.match(sw,/eureka-atlas-v21-20261108-shell/);
assert.match(sw,/scaleup-studio\.js/);assert.match(sw,/scaleup-studio\.css/);
assert.match(css,/\.scale-metrics/);
console.log('PASS: First-principles H2/CO/Li balances, units, FE/uptime, area scaling, physical edge cases, UI hooks, cache integration.');
