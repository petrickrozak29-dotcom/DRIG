Ringkasan Perbaikan & Tindakan

- Migrasi Prisma:
  - Menambahkan kolom `publishedAt` pada model `Submission` dan menerapkan migrasi lokal.
  - Reset `dev.db` dan menerapkan semua migration untuk development.
- Backend:
  - Menambahkan `storageService` (S3 optional) untuk penyimpanan gambar.
  - Menambahkan `logger` (JSON-line) dan perbaikan pada routes `uploads`.
  - Memperbesar `express.json` limit menjadi 100mb untuk terima payload besar/base64.
  - Perbaikan `submissionService` untuk set `publishedAt` ketika status `APPROVED` dan fallback saat kolom belum ada.
- Frontend:
  - Normalisasi URL gambar agar selalu absolute (rewrite `/uploads/` → full URL).
  - Menambahkan helper API-first di `frontend/lib/magelang-data.ts`.
  - Menambahkan Playwright E2E test untuk alur submit → approve → tampil.
- Testing & CI:
  - Unit tests backend: 10 suites, 94 tests — lulus.
  - Playwright E2E: satu smoke test (submission create→approve→visible) — lulus lokal.
  - Browsers diinstall via Playwright and tests run headless in CI-compatible mode.

Sisa Tindakan / Rekomendasi:
- CI: dorong (push) perubahan ini ke GitHub dan verifikasi GitHub Actions (Playwright + Jest) menjalankan cleanly.
- Production:
  - Terapkan migrasi ke database produksi (Postgres Railway) menggunakan `prisma migrate deploy` setelah backup.
  - Konfigurasi storage produksi: set `S3_*` env vars (Bucket, Region, Key, Secret atau Spaces endpoint).
  - Jangan simpan file `dev.db`, logs, atau test artifacts di repo; pastikan `.gitignore` sesuai.
- Keamanan & Observability:
  - Setup secrets di Railway / Vercel, tambahkan Sentry atau logging terpusat jika perlu.
- Tambahan Tes:
  - Tambahkan E2E tambahan untuk alur upload image (large payload), redirect login & resume, dan notifikasi.

Perintah yang dijalankan (ringkasan):

- `npx prisma migrate reset --force --skip-seed` (reset dev.db & apply migrations)
- `npx prisma migrate dev --name add_publishedAt --create-only` (generate migration)
- `npx prisma migrate dev` (apply pending migrations)
- `npx prisma generate` (regenerate client)
- `npm run test` di `backend` (Jest)
- `npx playwright install --with-deps` dan `npx playwright test` di `frontend` (E2E)

Jika Anda setuju, saya akan commit dan push migration baru (`backend/prisma/migrations/20260612023938_add_published_at`) dan laporan ini ke `main`.