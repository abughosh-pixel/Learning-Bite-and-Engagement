import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync(new URL('../data.json',import.meta.url),'utf8'));
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const nestedSum=o=>Object.values(o).reduce((n,v)=>n+(typeof v==='number'?v:nestedSum(v)),0);
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
assert.equal(data.distinctLearners,data.uniqueLearners.length);
assert.equal(new Set(data.uniqueLearners.map(p=>p.id)).size,data.distinctLearners);
assert.equal(new Set(data.uniqueLearners.map(p=>norm(p.name))).size,data.distinctLearners);
for(const key of ['sessions','clusters','functions','businessUnits','grades','seniority'])assert.equal(sum(data[key]),data.total,key);
for(const key of ['clusterSession','unitSession','clusterUnitSession','clusterFunctionSession'])assert.equal(nestedSum(data[key]),data.total,key);
for(const [cluster,n] of Object.entries(data.clusters)){
  assert.equal(sum(data.clusterSession[cluster]),n);
  assert.equal(nestedSum(data.clusterFunctionSession[cluster]),n);
  assert.equal(nestedSum(data.clusterUnitSession[cluster]),n);
  for(const [session,count] of Object.entries(data.clusterSession[cluster])){
    assert.equal(Object.values(data.clusterFunctionSession[cluster]).reduce((n,o)=>n+(o[session]||0),0),count,`${cluster}/${session}/function`);
    assert.equal(Object.values(data.clusterUnitSession[cluster]).reduce((n,o)=>n+(o[session]||0),0),count,`${cluster}/${session}/unit`);
  }
}
for(const [session,n] of Object.entries(data.sessions)){
  assert.equal(Object.values(data.clusterSession).reduce((n,o)=>n+(o[session]||0),0),n,session);
  const t=data.topics.find(t=>t.detailKey===session);assert(t,session);assert.equal(t.detailed,n);assert.equal(t.sessionAttendance,Math.max(t.originalSessionAttendance,n));
}
for(const [fun,n] of Object.entries(data.functions))assert.equal(Object.values(data.clusterFunctionSession).reduce((n,o)=>n+nestedSum(o[fun]||{}),0),n,fun);
for(const [unit,n] of Object.entries(data.businessUnits))assert.equal(sum(data.unitSession[unit]),n,unit);
assert.equal(data.uniqueLearners.reduce((n,p)=>n+p.occurrences,0),data.total);
for(const p of data.uniqueLearners){assert.equal(new Set(p.sessions).size,p.sessions.length,p.name);assert.equal(p.occurrences,p.sessions.length);assert(p.sessions.every(s=>data.sessions[s]>0));}
assert.equal(data.knownAttendance,3131);
assert.equal(data.total,2610);
assert.equal(data.distinctLearners,572);
const person=name=>{const matches=data.uniqueLearners.filter(p=>p.name===name);assert.equal(matches.length,1,name);return matches[0];};
for(const name of ['Tamara Elias Marar','Shadi Haddad']){
  const p=person(name);assert.equal(p.sessions.length,39);assert.equal(p.occurrences,39);assert.equal(p.topLearnerEligible,false);
  assert(!data.topLearners.some(p=>p.name===name));
}
assert.equal(person('Mina Atef Fawzy Habib').sessions.length,5);
assert(!data.uniqueLearners.some(p=>p.name==='Mena Atef'));
assert.equal(person('Arwa Salah Sanad Al Sammour').sessions.length,5);
assert.equal(person('Tasnim Faisal Ahmad Al Kderat').sessions.length,2);
assert(!data.uniqueLearners.some(p=>['Arwa AlSammour','Tasnim AlKderat','Mohammad Suleiman Mousa Abu Dawood'].includes(p.name)));
const mousa=person('Mousa Abu Dawoud');assert.equal(mousa.cluster,'Jordan');assert.equal(mousa.country,'Jordan');assert.equal(mousa.grade,14);assert.equal(mousa.position,'Planning Engineer');assert.equal(mousa.occurrences,3);
const amr=person('AMR YOUSSEF MAHMOUD MOHAMED');assert.equal(amr.cluster,'Egypt');assert.equal(amr.function,'Finance');assert.equal(amr.grade,16);assert.equal(amr.businessUnit,'Fine');assert.equal(amr.occurrences,5);
assert.equal(person('Jalal Nassar').cluster,'UAE and Lower Gulf');
assert.equal(person('Jalal Nassar').grade,16);
assert.equal(person('Reda Taher').function,'ATH');
assert.equal(person('Emad Abdallah').position,'Planning Lead');
assert.equal(person('Emad Abdallah').grade,15);
assert.equal(person('Mohamed Ibrahim').grade,15);
assert.equal(person('Yousef Fareed Mohammad Shehadeh').grade,13);
assert.equal(person('Mohamed Mousa').function,'ATH');
assert.equal(person('Tamara Karim Shukri Ajlouni').position,'HR Senior Manager');
assert.equal(data.topLearners.length,10);
const exclusions=new Set(data.topLearnerExclusions);
for(const p of data.topLearners){assert(!exclusions.has(p.name.toLowerCase()));assert.deepEqual(p.sessions,person(p.name).sessions);}
assert(data.topLearners.every((p,i,a)=>i===0||p.sessions.length<=a[i-1].sessions.length));
assert.equal(data.topics.filter(t=>t.sessionAttendance!=null).length,39);
assert.equal(data.topics.filter(t=>t.sessionAttendance==null).length,4);
assert.equal(data.topics.reduce((n,t)=>n+(t.sessionAttendance||0),0),data.knownAttendance);
assert.equal(Object.values(data.themes).reduce((n,t)=>n+t.attendance,0),data.knownAttendance);
for(const [theme,t] of Object.entries(data.themes))assert.equal(data.topics.filter(p=>p.theme===theme).reduce((n,p)=>n+(p.sessionAttendance||0),0),t.attendance);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const [i,m] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries())new vm.Script(m[1],{filename:`inline-script-${i}`});
console.log(JSON.stringify({result:'PASS',learners:data.distinctLearners,namedOccurrences:data.total,distinctPersonTopics:data.uniqueLearners.reduce((n,p)=>n+p.sessions.length,0),allAttendeeTotal:data.knownAttendance,completedSessions:39,upcomingSessions:4,administratorsExcluded:true,rollupsReconciled:true}));
