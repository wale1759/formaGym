// Return only known error categories, never driver messages or connection strings.
export function databaseDiagnostics(error) {
  const errors = [error];
  if (error.reason?.servers instanceof Map) {
    for (const server of error.reason.servers.values()) {
      if (server.error) errors.push(server.error);
    }
  }
  for (const current of [...errors]) {
    if (current.cause) errors.push(current.cause);
  }
  const messages = errors.map(current => String(current.message || '')).join(' ');
  const safeCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE']);
  return {
    dnsFailure: /ENOTFOUND|EAI_AGAIN|querySrv|DNS/i.test(messages),
    tlsFailure: /TLS|SSL|certificate/i.test(messages),
    timedOut: /timed? ?out|timeout/i.test(messages),
    authenticationFailure: /bad auth|authentication failed/i.test(messages),
    networkCodes: [...new Set(errors.map(current => current.code).filter(code => safeCodes.has(code)))],
  };
}
