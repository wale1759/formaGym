import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';
const base='https://frontend-balwjfnpr-sanmiafolabi1759-1000s-projects.vercel.app';
const project=JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','npx.cmd --yes vercel api /v9/projects/frontend --scope sanmiafolabi1759-1000s-projects'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const secret=Object.entries(project.protectionBypass||{}).find(([,value])=>value.scope==='automation-bypass')?.[0];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const context=await browser.newContext();await context.route(base+'/**',route=>route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':secret}}));const page=await context.newPage();await page.goto(base+'/#Shop',{waitUntil:'domcontentloaded'});await page.locator('.product .rating').first().waitFor();console.log(JSON.stringify({shopRatingText:(await page.locator('.product .rating').first().textContent()).trim()}));}finally{await browser.close();}
