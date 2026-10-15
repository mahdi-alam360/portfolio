import artifact from './artifact.json' with {type:'json'};
export function predict(features) {
  const m=artifact.model;
  const z=features.reduce((v,x,j)=>v+m.weights[j]*(x-m.mean[j])/m.scale[j],m.bias);
  const probability=1/(1+Math.exp(-Math.max(-30,Math.min(30,z))));
  return {probability,predicted_class:Number(probability>=.5),threshold:.5,model_version:artifact.version};
}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function handleModel(request) {
  if(request.method==='GET') return json({status:'ready',...artifact});
  if(request.method!=='POST') return json({error:'Use GET or POST'},405);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'Use application/json'},415);
  const body=await request.text();
  if(body.length>2048) return json({error:'Request too large'},413);
  let data; try {data=JSON.parse(body);} catch {return json({error:'Invalid JSON'},400);}
  const x=data?.features;
  if(!Array.isArray(x)||x.length!==4||!x.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=-3&&v<=3)) return json({error:'features must contain four finite numbers between -3 and 3'},400);
  return json(predict(x));
}
