(async () => {
  try {
    const base = process.env.API_URL || 'http://localhost:4000';
    console.log('[E2E] Using API base:', base);

    const now = Date.now();
    const title = `E2E Test Submission ${now}`;

    console.log('[E2E] Creating submission...');
    const createRes = await fetch(`${base}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: 'E2E test description',
        featureType: 'WISATA',
        categoryName: 'E2E Category',
        location: 'E2E Location'
      })
    });

    const created = await createRes.json();
    if (createRes.status !== 201) {
      console.error('[E2E] Failed to create submission', createRes.status, created);
      process.exitCode = 1;
      return;
    }

    const id = created.id;
    console.log('[E2E] Created submission id:', id);

    console.log('[E2E] Logging in as developer...');
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'developermagelang45@gmail.com', password: 'potensimagelang45#' })
    });

    const loginBody = await loginRes.json();
    if (!loginRes.ok) {
      console.error('[E2E] Failed to login as developer', loginRes.status, loginBody);
      process.exitCode = 1;
      return;
    }

    const token = loginBody.token;
    console.log('[E2E] Developer token length:', token ? token.length : 'none');

    console.log('[E2E] Approving submission...');
    const patchRes = await fetch(`${base}/api/submissions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'APPROVED' })
    });

    const patchBody = await patchRes.json();
    if (!patchRes.ok) {
      console.error('[E2E] Failed to approve submission', patchRes.status, patchBody);
      process.exitCode = 1;
      return;
    }

    console.log('[E2E] Approved submission:', patchBody.id || patchBody);

    console.log('[E2E] Fetching public tourism list...');
    const listRes = await fetch(`${base}/api/tourism`);
    const list = await listRes.json();
    if (!listRes.ok) {
      console.error('[E2E] Failed to fetch tourism', listRes.status, list);
      process.exitCode = 1;
      return;
    }

    const found = Array.isArray(list) ? list.find(i => i.id === id) : null;

    if (found) {
      console.log('[E2E] SUCCESS: approved submission is visible in public tourism list');
      console.log('[E2E] Item:', found);
      process.exitCode = 0;
      return;
    } else {
      console.error('[E2E] FAILURE: approved submission NOT found in public tourism list');
      console.error('[E2E] Full list length:', Array.isArray(list) ? list.length : 'unknown');
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    console.error('[E2E] ERROR', err);
    process.exitCode = 1;
    return;
  }
})();
