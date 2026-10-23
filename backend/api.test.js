import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import handler, {app} from './index.js';
let server,base;
before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('health endpoint is available',async()=>{const response=await fetch(`${base}/api/health`);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ok'});});
test('invalid email is rejected without persistence',async()=>{for(const route of ['bookings','orders','memberships','contacts','subscriptions']){const response=await fetch(`${base}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'invalid'})});assert.equal(response.status,400);}});
test('incomplete booking and empty order are rejected',async()=>{for(const route of ['bookings','orders']){const response=await fetch(`${base}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',items:[]})});assert.equal(response.status,400);}});
test('unknown API route returns JSON 404',async()=>{const response=await fetch(`${base}/api/missing`);assert.equal(response.status,404);assert.deepEqual(await response.json(),{error:'Endpoint not found'});});

test('Vercel default export exposes the Express request handler',()=>{assert.equal(handler,app);assert.equal(typeof handler,'function');});
