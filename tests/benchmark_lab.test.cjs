'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const benchmark=fs.readFileSync(path.join(root,'benchmark-lab.js'),'utf8');
const css=fs.readFileSync(path.join(root,'benchmark-lab.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(x=>x[2].includes("'use strict';"));
assert.equal(scripts.length,1,'one inline application script');
new vm.Script(scripts[0][2],{filename:'index.html:inline'});
new vm.Script(benchmark,{filename:'benchmark-lab.js'});
new vm.Script(sw,{filename:'sw.js'});

assert.match(html,/const APP_VERSION='18'/);
assert.match(html,/id="benchmark-lab"/);
assert.match(html,/id="benchmarkStudy"/);
assert.match(html,/id="runBenchmark"/);
assert.match(html,/href="#benchmark-lab"/);
assert.match(html,/quantitative_evidence \(up to 12 additional decision-relevant measured results/);
assert.match(html,/function normalizeQuantitativeEvidence/);
assert.match(html,/Full quantitative evidence table/);
assert.match(html,/slice\(0,5\)/);

for(const key of ['battery','electrolyzer','co2rr','fuelcell','flowbattery','electrocatalysis','corrosion','general']){
  assert.ok(benchmark.includes(key+':{'), 'schema '+key);
}
assert.match(benchmark,/three-electrode vs full cell/i);
assert.match(benchmark,/geometric vs ECSA/i);
assert.match(benchmark,/half-cell vs full cell/i);
assert.match(benchmark,/Crossref/i);
assert.match(benchmark,/titleMatchesAuthority/);
assert.match(benchmark,/identity_verified:true/);
assert.match(benchmark,/industrial_gap/);
assert.match(benchmark,/metric_comparison/);
assert.match(benchmark,/next_experiments/);
assert.match(benchmark,/Never estimate missing values/i);
assert.match(css,/\.benchmark-table/);
assert.match(css,/\.benchmark-gap-grid/);
assert.match(sw,/eureka-atlas-v18-benchmark-shell/);
assert.match(sw,/benchmark-lab\.js/);
assert.match(sw,/benchmark-lab\.css/);

console.log('PASS: Eureka Atlas v18 Benchmark Lab, quantitative-evidence, syntax, and shell regression checks.');
