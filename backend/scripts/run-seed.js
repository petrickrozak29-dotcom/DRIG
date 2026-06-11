(async () => {
  try {
    const base = process.env.API_URL || 'http://localhost:4000';
    console.log('[SEED] Using API base:', base);

    console.log('[SEED] Logging in as developer...');
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'developermagelang45@gmail.com', password: 'potensimagelang45#' })
    });

    const loginBody = await loginRes.json();
    if (!loginRes.ok) {
      console.error('[SEED] Failed to login as developer', loginRes.status, loginBody);
      process.exitCode = 1;
      return;
    }

    const token = loginBody.token;
    console.log('[SEED] Developer token length:', token ? token.length : 'none');

    console.log('[SEED] Calling /api/seed/run...');
    const res = await fetch(`${base}/api/seed/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const body = await res.json();
    if (!res.ok) {
      console.error('[SEED] Seed run failed', res.status, body);
      process.exitCode = 1;
      return;
    }

    console.log('[SEED] Seed run successful:', body);
    process.exitCode = 0;
  } catch (err) {
    console.error('[SEED] ERROR', err);
    process.exitCode = 1;
  }
})();
