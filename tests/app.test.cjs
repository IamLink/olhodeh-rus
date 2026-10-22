const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server/index.cjs');

let directory, dbPath, server, base, cookie;
async function startServer() {
  server = createServer({ dbPath, host:'127.0.0.1', port:0 });
  base = await server.listen();
}
async function stopServer() { if (server) { await server.close(); server=null; } }
async function request(route, { method='GET', body, sessionCookie=cookie }={}) {
  const headers={};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(sessionCookie)headers.Cookie=sessionCookie;
  if(!['GET','HEAD'].includes(method))headers.Origin=base;
  const response=await fetch(`${base}/api${route}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  const result=(response.headers.get('content-type')||'').includes('application/json')?await response.json():await response.text();
  return {status:response.status,result};
}

before(async()=>{directory=fs.mkdtempSync(path.join(os.tmpdir(),'oh-app-test-'));dbPath=path.join(directory,'app.sqlite');await startServer();});
after(async()=>{await stopServer();if(directory)fs.rmSync(directory,{recursive:true,force:true});});

test('autenticação, CRUD básico, permissões e persistência SQLite',async()=>{
  let r=await request('/health');assert.equal(r.status,200);assert.equal(r.result.status,'ok');
  r=await request('/wellbeing');assert.equal(r.status,401);
  r=await request('/auth/status');assert.equal(r.result.needsSetup,true);
  r=await request('/auth/setup',{method:'POST',body:{username:'admin-test',password:'Senha-local-forte-2026!'}});assert.equal(r.status,201);assert.equal(r.result.user.role,'admin');
  r=await request('/astronauts',{method:'POST',body:{id:'AST-TEST',full_name:'Astronauta Fictício',mission:'Teste',return_date:'2026-01-01',status:'Acompanhamento'}});assert.equal(r.status,201);
  r=await request('/astronauts/AST-TEST',{method:'PUT',body:{full_name:'Astronauta Fictício Editado',mission:'Teste Revisado',return_date:'2026-01-02',status:'Em recuperação'}});assert.equal(r.status,200);assert.equal(r.result.full_name,'Astronauta Fictício Editado');
  r=await request('/astronauts',{method:'POST',body:{id:'AST-TEST',full_name:'Duplicado',mission:'Teste',return_date:'2026-01-01',status:'Acompanhamento'}});assert.equal(r.status,409);
  r=await request('/measurements',{method:'POST',body:{astronaut_id:'AST-TEST',indicator:'heart_rate',value:70,unit:'bpm',measured_at:'2026-01-02T10:00',origin:'manual',notes:'Demonstração'}});assert.equal(r.status,201);
  r=await request('/measurements',{method:'POST',body:{astronaut_id:'AST-TEST',indicator:'spo2',value:160,unit:'%',measured_at:'2026-01-02T10:00',origin:'manual'}});assert.equal(r.status,400);
  r=await request('/measurements?astronautId=AST-TEST&indicator=heart_rate&from=2026-01-02&to=2026-01-02');assert.equal(r.status,200);assert.equal(r.result.length,1);
  r=await request('/alerts/rules',{method:'POST',body:{name:'Regra de teste',indicator:'heart_rate',operator:'>',threshold:60,severity:'info',explanation:'Regra local de demonstração.'}});assert.equal(r.status,201);
  const ruleId=r.result.id;r=await request(`/alerts/rules/${ruleId}`,{method:'PUT',body:{name:'Regra revisada',indicator:'heart_rate',operator:'>',threshold:65,severity:'attention',explanation:'Limite fictício de teste.'}});assert.equal(r.status,200);assert.equal(r.result.name,'Regra revisada');
  r=await request('/alerts');assert.equal(r.status,200);assert.equal(r.result.length,1);assert.equal(r.result[0].measurement_id!==undefined,true);
  r=await request('/plans',{method:'POST',body:{astronaut_id:'AST-TEST',goals:'Objetivo fictício',plan:'Plano de exemplo',responsible:'Equipe de teste',status:'active'}});assert.equal(r.status,201);const planId=r.result.id;
  r=await request(`/plans/${planId}`,{method:'PUT',body:{astronaut_id:'AST-TEST',goals:'Objetivo revisto',plan:'Plano atualizado',responsible:'Equipe de teste',status:'paused'}});assert.equal(r.status,200);assert.equal(r.result.status,'paused');
  r=await request('/rehab',{method:'POST',body:{astronaut_id:'AST-TEST',activity:'Exercício fictício',duration_minutes:30,completed_at:'2026-01-02T12:00',professional:'Fisioterapeuta de teste'}});assert.equal(r.status,201);const sessionId=r.result.id;
  r=await request(`/rehab/${sessionId}`,{method:'PUT',body:{astronaut_id:'AST-TEST',activity:'Exercício revisado',duration_minutes:35,completed_at:'2026-01-02T12:30',professional:'Fisioterapeuta de teste'}});assert.equal(r.status,200);assert.equal(r.result.activity,'Exercício revisado');
  r=await request(`/rehab/${sessionId}`,{method:'DELETE'});assert.equal(r.status,200);
  r=await request('/sleep',{method:'POST',body:{astronaut_id:'AST-TEST',occurred_at:'2026-01-02T21:00',sleep_hours:7.5,sleep_quality:'Boa',hydration_liters:2,meals_per_day:4,professional:'Nutricionista de teste'}});assert.equal(r.status,201);const sleepId=r.result.id;
  r=await request(`/sleep/${sleepId}`,{method:'PUT',body:{astronaut_id:'AST-TEST',occurred_at:'2026-01-02T21:00',sleep_hours:8,sleep_quality:'Boa',hydration_liters:2.2,meals_per_day:4,professional:'Nutricionista de teste'}});assert.equal(r.status,200);assert.equal(r.result.sleep_hours,8);
  r=await request('/appointments',{method:'POST',body:{astronaut_id:'AST-TEST',type:'medical',scheduled_at:'2026-01-03T09:00',professional:'Profissional de teste',notes:'Consulta fictícia'}});assert.equal(r.status,201);const appointmentId=r.result.id;
  r=await request(`/appointments/${appointmentId}`,{method:'PUT',body:{astronaut_id:'AST-TEST',type:'medical',scheduled_at:'2026-01-03T10:00',professional:'Profissional de teste',notes:'Consulta atualizada'}});assert.equal(r.status,200);assert.equal(r.result.notes,'Consulta atualizada');
  r=await request(`/appointments/${appointmentId}`,{method:'PATCH',body:{status:'cancelled'}});assert.equal(r.status,200);assert.equal(r.result.status,'cancelled');
  r=await request('/reports/export?astronautId=AST-TEST&indicator=heart_rate');assert.equal(r.status,200);assert.match(r.result,/heart_rate/);
  r=await request('/backup/restore',{method:'POST',body:{format:'invalid'}});assert.equal(r.status,400);
  r=await request('/backup');assert.equal(r.status,200);assert.equal(r.result.format,'olho-de-horus-backup');
  const backup=r.result;r=await request('/backup/restore',{method:'POST',body:backup});assert.equal(r.status,200);assert.equal(r.result.restored.astronauts,1);
  r=await request('/users',{method:'POST',body:{username:'psico-test',password:'Senha-psicologia-2026!',role:'psychologist'}});assert.equal(r.status,201);
  await request('/auth/logout',{method:'POST'});
  r=await request('/auth/login',{method:'POST',body:{username:'psico-test',password:'Senha-psicologia-2026!'}});assert.equal(r.status,200);
  r=await request('/measurements');assert.equal(r.status,403);
  r=await request('/wellbeing',{method:'POST',body:{astronaut_id:'AST-TEST',occurred_at:'2026-01-02T11:00',stress:4,anxiety:'',mood:'Relato fictício',professional:'psico-test'}});assert.equal(r.status,201);
  r=await request(`/wellbeing/${r.result.id}`,{method:'PUT',body:{astronaut_id:'AST-TEST',occurred_at:'2026-01-02T11:30',stress:3,anxiety:'',mood:'Relato revisado',professional:'psico-test'}});assert.equal(r.status,200);assert.equal(r.result.stress,3);
  await request('/auth/logout',{method:'POST'});
  r=await request('/auth/login',{method:'POST',body:{username:'admin-test',password:'Senha-local-forte-2026!'}});assert.equal(r.status,200);
  r=await request('/users',{method:'POST',body:{username:'medico-test',password:'Senha-medica-ficticia-2026!',role:'physician'}});assert.equal(r.status,201);
  await request('/auth/logout',{method:'POST'});
  r=await request('/auth/login',{method:'POST',body:{username:'medico-test',password:'Senha-medica-ficticia-2026!'}});assert.equal(r.status,200);
  r=await request('/wellbeing');assert.equal(r.status,403);
  const userCookie=cookie;await stopServer();await startServer();cookie=null;
  r=await request('/auth/login',{method:'POST',body:{username:'admin-test',password:'Senha-local-forte-2026!'}});assert.equal(r.status,200);
  r=await request('/astronauts');assert.equal(r.status,200);assert.equal(r.result.length,1);assert.equal(r.result[0].id,'AST-TEST');
  r=await request('/measurements');assert.equal(r.status,200);assert.equal(r.result.length,1);
  r=await request('/astronauts/AST-TEST',{method:'DELETE'});assert.equal(r.status,200);
  r=await request('/astronauts');assert.equal(r.status,200);assert.equal(r.result.length,0);
  assert.ok(userCookie,'session was issued');
});

test('produção exige segredos, token de bootstrap e cookies seguros',async()=>{
  const previousSecret=process.env.APP_SESSION_SECRET,previousSetupToken=process.env.OH_SETUP_TOKEN,previousTrustProxy=process.env.TRUST_PROXY;
  const db=path.join(directory,'production.sqlite');
  try{
    delete process.env.APP_SESSION_SECRET;delete process.env.OH_SETUP_TOKEN;
    assert.throws(()=>createServer({dbPath:db,production:true}),/APP_SESSION_SECRET/);
    process.env.APP_SESSION_SECRET='segredo-ficticio-de-teste-com-mais-de-32-bytes';
    process.env.OH_SETUP_TOKEN='token-ficticio-de-bootstrap-com-mais-de-32-bytes';
    process.env.TRUST_PROXY='1';
    const productionServer=createServer({dbPath:db,host:'127.0.0.1',port:0,production:true});
    try{
      const productionBase=await productionServer.listen();
      let response=await fetch(`${productionBase}/api/auth/status`);let body=await response.json();
      assert.deepEqual(body,{needsSetup:true,setupTokenRequired:true});
      response=await fetch(`${productionBase}/api/auth/setup`,{method:'POST',headers:{'Content-Type':'application/json',Origin:productionBase},body:JSON.stringify({username:'admin-prod-test',password:'Senha-ficticia-prod-2026!'})});
      assert.equal(response.status,403);
      response=await fetch(`${productionBase}/api/auth/setup`,{method:'POST',headers:{'Content-Type':'application/json',Origin:productionBase,'X-Forwarded-Proto':'https'},body:JSON.stringify({username:'admin-prod-test',password:'Senha-ficticia-prod-2026!',setupToken:process.env.OH_SETUP_TOKEN})});
      assert.equal(response.status,201);assert.match(response.headers.get('set-cookie')||'',/; Secure/i);
      response=await fetch(`${productionBase}/api/health`);assert.equal(response.status,200);
    }finally{await productionServer.close();}
  }finally{
    if(previousSecret===undefined)delete process.env.APP_SESSION_SECRET;else process.env.APP_SESSION_SECRET=previousSecret;
    if(previousSetupToken===undefined)delete process.env.OH_SETUP_TOKEN;else process.env.OH_SETUP_TOKEN=previousSetupToken;
    if(previousTrustProxy===undefined)delete process.env.TRUST_PROXY;else process.env.TRUST_PROXY=previousTrustProxy;
  }
});
