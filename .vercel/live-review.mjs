import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const state = JSON.parse(fs.readFileSync('.vercel/preview-state.json', 'utf8'));
const frontend = state.frontend.url;
const backend = state.backend.url;
assert.equal(state.backend.database, 'forma_fitness_preview');
const project = JSON.parse(execFileSync('cmd.exe', ['/d','/s','/c','npx.cmd --yes vercel api /v9/projects/frontend --scope sanmiafolabi1759-1000s-projects'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const bypass = Object.entries(project.protectionBypass || {}).find(([, value]) => value.scope === 'automation-bypass')?.[0];
assert.ok(bypass, 'An existing automation bypass is needed for the protected frontend.');
const runId = randomUUID();
const password = randomBytes(24).toString('base64url');
const accounts = [];
const results = [];
const browserErrors = [];
const browser = await chromium.launch({channel:'chrome',headless:true});
let context;
const report = (check, details) => { results.push({check,...details}); console.log(JSON.stringify({check,...details})); };
async function openContext() {
 const created = await browser.newContext({viewport:{width:1440,height:1000}});
 await created.route(frontend + '/**', route => route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':bypass}}));
 return created;
}
try {
 context = await openContext();
 const page = await context.newPage();
 page.on('pageerror', error => browserErrors.push(error.message));
 const badResponses=[];
 page.on('response',response=>{if(response.url().startsWith(frontend) && response.status()>=500)badResponses.push({url:response.url().split('?')[0],status:response.status()});});
 for(const route of ['Home','Membership','Equipment','Shop','Workouts','Nutrition','Bookings','Signin','Signup']) {
  await page.goto(frontend + '/#' + route, {waitUntil:'domcontentloaded'});
  assert.ok(await page.locator('header .logo').waitFor().then(()=>true));
  assert.ok(await page.locator('main').waitFor().then(()=>true));
  report('public-screen',{route,status:'rendered'});
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(frontend+'/#Membership',{waitUntil:'domcontentloaded'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.getByRole('button',{name:'Toggle navigation'}).click();
 assert.equal(await page.locator('#primary-navigation').getAttribute('class'),'open');
 report('mobile-navigation',{status:'passed'});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(frontend+'/#Signup',{waitUntil:'domcontentloaded'});
 const email = 'preview-review-' + runId + '@example.com';
 await page.getByLabel('Full name',{exact:true}).fill('Preview Review Member');
 await page.getByLabel('Email address',{exact:true}).first().fill(email);
 await page.locator('#signup-password').fill(password);
 await page.locator('#signup-confirmPassword').fill(password);
 await page.locator('input[name="acceptTerms"]').check();
 const signupResponsePromise=page.waitForResponse(response=>response.url()===frontend+'/api/signup'&&response.request().method()==='POST');
 await page.locator('form').filter({has:page.locator('#signup-password')}).getByRole('button',{name:/Create|Sign up/i}).click();
 const signupResponse=await signupResponsePromise;
 assert.equal(signupResponse.status(),201);
 const member=await signupResponse.json();
 accounts.push({id:member.id,email});
 fs.writeFileSync('.vercel/live-review-cleanup.json',JSON.stringify({database:state.backend.database,accounts}));
 await page.waitForURL('**/#Dashboard');
 await page.getByRole('heading',{name:/Welcome back/}).waitFor();
 const cookie=(await context.cookies(frontend+'/api/member/session')).find(cookie=>cookie.name==='forma_member');
 assert.ok(cookie?.httpOnly&&cookie.secure&&cookie.sameSite==='Strict');
 assert.equal(cookie.path,'/api');
 report('browser-signup-cookie',{status:'passed',httpOnly:cookie.httpOnly,secure:cookie.secure,sameSite:cookie.sameSite,path:cookie.path});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:/Welcome back/}).waitFor();
 report('session-refresh',{status:'passed'});
 const request = async (path, options={}) => {
  const response = await page.evaluate(async ({path,options})=>{
   const response = await fetch(path,options); return {status:response.status,body:await response.json()};
  },{path,options});
  return response;
 };
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const membership=await request('/api/member/memberships',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'Starter',billing:'monthly',startDate:today,quotedPrice:15000,email:'someone-else@example.com',userId:'someone-else'})});
 assert.equal(membership.status,201);
 const dashboard=await request('/api/member/dashboard');
 assert.equal(dashboard.status,200);
 assert.ok(dashboard.body.memberships.some(plan=>plan.id===membership.body.id&&plan.status==='pending'));
 assert.equal(dashboard.body.user.id,member.id);
 assert.equal((await request('/api/admin/activity')).status,401);
 assert.equal((await request('/api/member/instructors')).status,403);
 report('member-access-and-request',{status:'passed',identity:'session-derived',membershipStatus:'pending',adminAccess:401,instructorAccess:403});
 const otherEmail='preview-review-other-'+runId+'@example.com';
 const otherResponse=await fetch(backend+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Preview Other Member',email:otherEmail,password,confirmPassword:password,acceptTerms:true})});
 assert.equal(otherResponse.status,201);
 const other=await otherResponse.json();accounts.push({id:other.id,email:otherEmail});
 fs.writeFileSync('.vercel/live-review-cleanup.json',JSON.stringify({database:state.backend.database,accounts}));
 const otherCookie=otherResponse.headers.getSetCookie().find(value=>value.startsWith('forma_member=')&&!value.startsWith('forma_member=;')).split(';')[0];
 const otherDashboard=await fetch(backend+'/api/member/dashboard',{headers:{Cookie:otherCookie}});
 assert.equal(otherDashboard.status,200);
 assert.equal((await otherDashboard.json()).memberships.length,0);
 report('two-member-isolation',{status:'passed'});
 await page.locator('header').getByRole('button',{name:'Sign out',exact:true}).click();
 await page.waitForURL('**/#Signin');
 assert.equal((await request('/api/member/session')).status,401);
 await page.locator('#signin-email').fill(email);
 await page.locator('#signin-password').fill(password);
 await page.locator('form').filter({has:page.locator('#signin-password')}).getByRole('button',{name:'Sign in',exact:true}).click();
 await page.waitForURL('**/#Dashboard');
 await page.getByRole('heading',{name:/Welcome back/}).waitFor();
 report('browser-logout-login',{status:'passed'});
 for(const path of ['/api/unknown-review-route','/.env','/backend/.env']){
  const response=await fetch(backend+path);const body=await response.text();
  assert.ok(!body.includes('MONGODB_URI=')&&!body.includes('ADMIN_PASSWORD=')&&!body.includes('stack:'));
  report('error-and-secret-exposure',{path,status:response.status,secretLeak:false});
 }
 assert.deepEqual(browserErrors,[]);
 assert.deepEqual(badResponses,[]);
 report('browser-runtime',{pageErrors:browserErrors.length,serverErrors:badResponses.length});
} finally {
 await context?.close(); await browser.close();
 if(accounts.length) {
  // Proven cleanup mechanism runs inside the authorized preview database.
  execFileSync(process.execPath,['.vercel/cleanup-preview.mjs'],{stdio:['ignore','pipe','pipe'],timeout:180000});
  const cleanupOutput=execFileSync(process.execPath,['.vercel/perform-cleanup.mjs'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180000});
  console.log(cleanupOutput.trim());
  report('preview-test-cleanup',{status:'passed',accounts:accounts.length});
 }
 fs.writeFileSync('.vercel/live-review-results.json',JSON.stringify({results,browserErrors},null,2));
}
