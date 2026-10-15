import test from 'node:test';
import assert from 'node:assert/strict';
import {handleModel} from './handler.mjs';
import artifact from './artifact.json' with {type:'json'};
const post=(data,headers={'content-type':'application/json'})=>handleModel(new Request('http://localhost/api/model-lab',{method:'POST',headers,body:typeof data==='string'?data:JSON.stringify(data)}));
test('metadata includes model provenance and evaluation',async()=>{
  const r=await handleModel(new Request('http://localhost/api/model-lab'));const a=await r.json();
  assert.equal(r.status,200);assert.equal(a.version,artifact.version);assert.equal(a.metrics.test_count,200);assert.match(a.limitations,/Synthetic/);
});
test('inference agrees with exported logistic model',async()=>{
  const x=[1,-1,.5,0],m=artifact.model;const z=m.bias+x.reduce((s,v,j)=>s+m.weights[j]*(v-m.mean[j])/m.scale[j],0);
  const r=await post({features:x}),a=await r.json();assert.equal(r.status,200);assert.ok(Math.abs(a.probability-1/(1+Math.exp(-z)))<1e-12);assert.equal(a.model_version,artifact.version);
});
for(const [name,data] of [['missing',{}],['wrong dimension',{features:[1]}],['string',{features:['1',0,0,0]}],['range',{features:[4,0,0,0]}],['null',{features:[null,0,0,0]}],['malformed','{']]) test(`reject ${name}`,async()=>assert.equal((await post(data)).status,400));
test('payload cap',async()=>assert.equal((await post(' '.repeat(2049))).status,413));
test('content type',async()=>assert.equal((await post('{}',{})).status,415));
test('method',async()=>assert.equal((await handleModel(new Request('http://localhost',{method:'DELETE'}))).status,405));
