"""Deterministic synthetic-data experiment. Python standard library only."""
import hashlib, json, math, random
from pathlib import Path

def samples(seed, n):
    rng=random.Random(seed); rows=[]
    for _ in range(n):
        x=[rng.uniform(-3,3) for _ in range(4)]
        y=int(1.2*x[0]-.9*x[1]+.6*x[2]+.3*x[3]+rng.gauss(0,.8)>0)
        rows.append((x,y))
    return rows

def fit(rows):
    mean=[sum(x[j] for x,y in rows)/len(rows) for j in range(4)]
    scale=[math.sqrt(sum((x[j]-mean[j])**2 for x,y in rows)/len(rows)) for j in range(4)]
    w=[0.0]*4; bias=0.0
    for _ in range(300):
        grad=[0.0]*4; gb=0.0
        for x,y in rows:
            z=[(x[j]-mean[j])/scale[j] for j in range(4)]
            error=1/(1+math.exp(-max(-30,min(30,sum(a*b for a,b in zip(w,z))+bias))))-y
            for j in range(4): grad[j]+=error*z[j]
            gb+=error
        w=[w[j]-.15*(grad[j]/len(rows)+.01*w[j]) for j in range(4)]
        bias-=.15*gb/len(rows)
    return dict(mean=mean,scale=scale,weights=w,bias=bias)

def probability(model,x):
    score=model['bias']+sum(w*(v-m)/s for w,v,m,s in zip(model['weights'],x,model['mean'],model['scale']))
    return 1/(1+math.exp(-max(-30,min(30,score))))

def build():
    train=samples(20261015,600); test=samples(20261016,200)
    model=fit(train)
    tp=tn=fp=fn=0
    for x,y in test:
        pred=int(probability(model,x)>=.5)
        tp+=pred==1 and y==1; tn+=pred==0 and y==0
        fp+=pred==1 and y==0; fn+=pred==0 and y==1
    majority=int(sum(y for x,y in train)>=len(train)/2)
    metrics=dict(accuracy=(tp+tn)/len(test),baseline_accuracy=sum(y==majority for x,y in test)/len(test),confusion=dict(tp=tp,tn=tn,fp=fp,fn=fn),train_count=len(train),test_count=len(test))
    artifact=dict(schema_version=1,features=['temperature','vibration','load','pressure'],input_range=[-3,3],model=model,metrics=metrics,training_seed=20261015,test_seed=20261016,limitations='Synthetic independent samples only; no real sensor validation, temporal validation, calibration guarantee, or operational safety use.')
    artifact['version']=hashlib.sha256(json.dumps(artifact,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16]
    return artifact

if __name__=='__main__':
    path=Path(__file__).parent/'artifact.json'
    path.write_text(json.dumps(build(),indent=2)+'\n')
    print(path.read_text())
