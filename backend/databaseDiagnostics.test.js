import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseDiagnostics } from './databaseDiagnostics.js';

test('database diagnostics classify nested connection failures without leaking secrets', () => {
 const secret = 'mongodb+srv://private-user:private-password@private-host/';
 const error = {message:'Server selection timed out',reason:{servers:new Map([['private-host',{error:{message:'TLS failed '+secret,cause:{code:'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR',message:'SSL alert'}}}]])}};
 const result=databaseDiagnostics(error);
 assert.equal(result.tlsFailure,true);
 assert.equal(result.timedOut,true);
 assert.deepEqual(result.networkCodes,['ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR']);
 assert.equal(JSON.stringify(result).includes('private'),false);
});

test('database diagnostics distinguish authentication and DNS failures', () => {
 assert.equal(databaseDiagnostics({message:'bad auth: authentication failed'}).authenticationFailure,true);
 const result=databaseDiagnostics({message:'querySrv ENOTFOUND',code:'ENOTFOUND'});
 assert.equal(result.dnsFailure,true);
 assert.equal(result.tlsFailure,false);
 assert.deepEqual(result.networkCodes,['ENOTFOUND']);
});
