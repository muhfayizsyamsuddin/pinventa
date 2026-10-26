# Pinventa — Implementation Plan (MVP)

## 1. Arsitektur
Sederhana: **Next.js adalah aplikasi sekaligus sumber kebenaran data; n8n menjalankan AI Agent.**

- **Next.js (App Router, TypeScript, Tailwind):** UI, API route, perhitungan skor deterministik, ekspor CSV, akses Supabase (hanya sisi server).
- **n8n:** satu workflow dengan node AI Agent (model OpenRouter) dan tool: geocode, pencarian Overpass, fetch website, simpan hasil. Dipicu lewat webhook; progres dikirim balik lewat callback.
- **Supabase PostgreSQL:** runs, businesses, evidence, scores, emails, log langkah.
- **OpenRouter:** LLM untuk ekstraksi, penalaran, dan draf email; hanya dipanggil dari n8n (API key tidak keluar dari n8n).
- **Overpass/OSM:** discovery. Geocoding memakai layanan yang **masih harus diverifikasi** di Fase 0, atau alternatif pemilihan koordinat manual.

Prinsip: LLM mengusulkan, kode memvalidasi. Skor dihitung di Next.js; output LLM divalidasi skema (mis. zod); field tanpa `source_url` dibuang.

## 2. Struktur Folder
```
pinventa/
├─ docs/                  PRD.md, IMPLEMENTATION_PLAN.md, VALIDATION_LOG.md (hasil Fase 0)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                     New Search
│  │  ├─ runs/[id]/page.tsx           Run Progress + Leads List
│  │  ├─ leads/[id]/page.tsx          Lead Detail
│  │  ├─ settings/page.tsx            Bobot + katalog layanan (read-only)
│  │  └─ api/
│  │     ├─ runs/route.ts                  buat run, picu n8n
│  │     ├─ runs/[id]/callback/route.ts    n8n mengirim langkah/hasil (shared secret)
│  │     └─ runs/[id]/export/route.ts      CSV
│  ├─ lib/ supabase.ts, scoring.ts, status.ts, csv.ts, schemas.ts, n8n.ts
│  └─ components/
├─ config/  services.json (katalog MAXY), industries.json, scoring.json
├─ fixtures/demo/                     HANYA data demo, berlabel jelas
├─ n8n/workflow.json                  workflow hasil ekspor (tanpa secret)
├─ supabase/migrations/001_init.sql
├─ tests/
└─ .env.example
```

## 3. Alur Data
1. Browser → `POST /api/runs` (lokasi, radius, industri). Next.js memvalidasi, menyimpan `runs(status=queued)`, lalu memanggil webhook n8n dengan `run_id`, parameter, dan callback secret.
2. n8n: **geocode** → lat/lon (hasil dicatat lewat callback). Jika gagal/ambigu → gunakan titik koordinat manual dari pengguna; jika tetap tidak ada, run `failed` beserta alasan.
3. n8n: **query Overpass** berdasarkan pemetaan industri→tag OSM dan radius. Agent menghapus duplikat. *Keputusan:* jika <10 hasil, coba sekali dengan radius diperluas (tercatat) atau laporkan jumlah sebenarnya.
4. n8n: untuk tiap bisnis, agent memutuskan apakah perlu **fetch website** (hanya jika URL ada dan akses diizinkan), lalu mengekstrak fakta kontak/layanan beserta `source_url`. *Keputusan:* tidak ada website → kontak "Not found", lewati.
5. n8n → `POST /api/runs/:id/callback` untuk setiap langkah dan data bisnis/evidence. Next.js memvalidasi lalu menulis ke Supabase (n8n tidak menulis database langsung, agar validasi terpusat).
6. n8n: OpenRouter menghasilkan sub-skor + alasan, pilihan layanan (dari katalog yang dikirim di payload), dan draf email untuk prospek teratas.
7. Next.js menghitung total skor tertimbang, menentukan **status** lewat `status.ts` (lihat bagian 4), dan menutup run sebagai `completed|partial|failed`.
8. UI melakukan polling status (tanpa websocket). Route export membuat CSV dari Supabase.

Env: `OPENROUTER_API_KEY` (hanya n8n), `N8N_WEBHOOK_URL`, `CALLBACK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (hanya server).

## 4. Model Database Minimal
- **runs**: id, location_text, lat, lon, radius_m, industry, status, error, created_at
- **businesses**: id, run_id, osm_id, name, address, industry, website, phone, email, email_source_url, lat, lon, `review_status` (`new|sales_review_ready|needs_verification|needs_research|rejected`), `email_ready` boolean, completeness, `data_origin` (`live|demo`), missing_fields jsonb
- **evidence**: id, business_id, field, value, source_url, source_type (`osm|website|other`), retrieved_at
- **scores**: business_id, fit, opportunity, contact, quality (0–100), total, reasons jsonb
- **recommendations**: id, business_id, service_id, reason, evidence_ids
- **emails**: id, business_id, subject, body, edited_body, `email_ready_label` (`email_ready|needs_verification`), created_at
- **run_steps**: id, run_id, ts, tool, input_summary, result_summary, decision, error

**Aturan status (dihitung di `status.ts`, bukan oleh LLM):**
- `sales_review_ready`: nama + alamat + industri + ≥1 evidence + skor dapat dihitung. Email tidak wajib.
- `email_ready = true`: hanya jika `sales_review_ready` **dan** `email` terisi dengan `email_source_url` dari sumber publik (bukan pribadi, bukan tebakan).
- `needs_verification`: `sales_review_ready` tetapi `email_ready = false`. Disimpan dan dinilai, **tidak dihitung** sebagai Email-Ready lead.
- Kriteria resmi 4 menghitung `sales_review_ready` (termasuk `needs_verification`); metrik Email-Ready dilaporkan terpisah sebagai aturan bisnis internal I1 (PRD 7B).

Constraint: setiap fakta kontak yang tidak null harus punya baris evidence.

## 5. Tugas Prioritas

### Fase 0 — Validasi teknis (WAJIB selesai sebelum pengembangan penuh)
Tujuan: membuktikan atau menyangkal asumsi. Tidak ada layanan yang dianggap berfungsi sebelum tercatat di `docs/VALIDATION_LOG.md` (tanggal, query/endpoint, hasil nyata, kesimpulan, alternatif). **Jangan mengisi hasil sebelum benar-benar menjalankan uji.**

| Uji | Yang diperiksa | Jika gagal / data kurang → dokumentasikan alternatif (tanpa mengarang) |
|---|---|---|
| **T0.1 Discovery OSM/Overpass** | Jalankan query nyata untuk beberapa industri/area Singapore: jumlah bisnis unik, cakupan tag `website`/`phone`/`email`/alamat, waktu respons, perilaku rate limit | Perbesar radius, ganti industri/area, coba instance Overpass lain (cek ketentuannya), atau sumber tambahan yang diizinkan (dikonfirmasi dulu). Jika tetap <10, laporkan jumlah sebenarnya |
| **T0.2 Geocoding** | Uji layanan geocoding (mis. Nominatim) untuk nama tempat Singapore: akurasi, ambiguitas, kebijakan penggunaan (User-Agent, rate) | Pemilihan koordinat manual (input lat/lon atau pilih titik di peta), atau penyedia geocoding lain setelah cek ketentuannya |
| **T0.3 OpenRouter & tool calling** | Dari n8n: panggil model (gratis/murah), uji output JSON terstruktur, **uji apakah model terpilih benar-benar mendukung tool calling di node AI Agent**, batas rate | Ganti model; jika tool calling tidak andal, ubah desain: n8n mengurutkan tool secara eksplisit dan LLM hanya dipakai untuk ekstraksi/keputusan dengan output terstruktur (tetap tampilkan keputusan di log) |
| **T0.4 Website resmi** | Untuk ±10 bisnis sampel: cek robots.txt dan syarat penggunaan, coba fetch halaman kontak/beranda dari n8n, catat blokir/timeout/konten dinamis | Hanya halaman publik yang diizinkan; jika diblokir, tandai "Not found"; sumber lain hanya jika diizinkan. Jangan menebak email |
| **T0.5 Hosting & koneksi n8n** | Tentukan n8n cloud vs self-hosted; uji webhook Next.js → n8n dan callback n8n → Next.js dari lingkungan nyata (bukan hanya localhost); uji koneksi Supabase | Gunakan tunnel (mis. untuk dev) atau deploy Next.js lebih awal; jika callback tidak bisa, gunakan n8n menulis hasil ke Supabase dengan validasi tambahan, atau polling |

**Gerbang keputusan Fase 0:** tinjau `VALIDATION_LOG.md` bersama tim. Putuskan (a) lanjut, (b) sesuaikan desain/alternatif, atau (c) pakai data demo berlabel hanya sebagai cadangan demo, bukan sebagai klaim hasil live. Khusus: jika OSM menghasilkan <5 prospek Siap Ditinjau Sales di area/industri uji, tentukan fallback sebelum Fase 1.

### Fase 1 — Walking skeleton
- T1 Repo, migrasi Supabase, env, deploy kerangka.
- T2 Form New Search → runs API → webhook n8n → callback → Run Progress menampilkan langkah.
- T3 Hasil discovery tersimpan dan tampil (data live).

### Fase 2 — Fitur wajib
- T4 Enrichment dengan evidence + link sumber.
- T5 Skor (`scoring.ts`) + alasan; status (`status.ts`): Siap Ditinjau Sales / Needs Verification / Email-Ready.
- T6 Rekomendasi layanan dari katalog.
- T7 Draf email (≥3 prospek teratas) dengan label Email-Ready/Needs Verification.
- T8 Layar Lead Detail; ekspor CSV (kolom `email_ready`, `review_status`).
- T9 Penanganan error: status partial/failed, tampilan "Not found".

### Fase 3 — Polesan (jika waktu ada)
- Toggle mode demo (fixture dengan badge DEMO), README, skrip demo, ekspor Google Sheets.

## 6. Tanggung Jawab
| Orang | Tanggung jawab |
|---|---|
| **Backend developer** | Uji Fase 0 dan `VALIDATION_LOG.md`, skema Supabase, API Next.js, workflow n8n, kode skor/status, CSV, test, deployment |
| **Marketing A (konten Sales)** | `services.json` (katalog MAXY + kapan tiap layanan relevan), daftar industri dan tag OSM yang diinginkan, gaya/template email beserta batasannya, review draf email |
| **Marketing B (kualifikasi/QA)** | Rubrik skor per komponen, persetujuan definisi Siap Ditinjau Sales vs Email-Ready (dicocokkan dengan study case resmi), verifikasi manual 10 prospek terhadap sumbernya, masukan copy/UI, skrip demo dan checklist penerimaan |

Kedua marketing juga menguji run live dan mencatat masalah di GitHub Issues. Bantuan Tailwind UI dari rekan yang mampu hanya jika ada; jangan diasumsikan.

## 7. Test Esensial
- **Unit:** bobot skor berjumlah 100 dan perhitungan total benar; aturan status (`sales_review_ready`, `needs_verification`, `email_ready`) termasuk kasus tanpa email dan email tanpa `source_url`; deduplikasi; escaping CSV; validasi skema menolak output LLM tanpa sumber.
- **Integrasi:** endpoint callback menolak secret salah; siklus run queued→completed/partial/failed.
- **Failure injection:** timeout Overpass, hasil nol, geocoding gagal, website 403/timeout, JSON LLM tidak valid, n8n mati: semuanya menampilkan error tanpa data karangan.
- **Uji akseptansi manual:** satu run live di area padat untuk memeriksa 10 acceptance criteria resmi (PRD 7A) dan aturan internal I1–I8 (PRD 7B), jika datanya tersedia; cek 5 prospek terhadap link sumber.
- **Pemisahan nyata/demo:** baris demo berlabel di UI dan CSV.

## 8. Definition of Done
- Fase 0 selesai dan terdokumentasi di `VALIDATION_LOG.md` dengan hasil nyata.
- 10 acceptance criteria resmi (PRD 7A) didemonstrasikan dalam satu run live dan dicatat di checklist (tanggal + run id); aturan internal I1–I8 (PRD 7B) dicek di checklist yang sama dan ditandai sebagai bukan kriteria resmi. Kriteria yang tidak terpenuhi karena data tidak tersedia dicatat jujur beserta alasannya.
- Tidak ada fakta tanpa `source_url`; data hilang tampil "Not found".
- Prospek tanpa email terverifikasi berstatus Needs Verification dan tidak masuk hitungan Email-Ready.
- Test di atas lulus; `.env.example` dan README berisi langkah setup; tidak ada secret di repo; JSON workflow n8n diekspor.
- Data demo berlabel jelas dan tidak dipakai untuk klaim hasil live.
- Dapat dijalankan teman tim dari README (lokal atau deploy).

## 9. Risiko Teknis
| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Data OSM jarang**: banyak bisnis tanpa website/telepon/email (belum terverifikasi untuk Singapore) | <5 prospek Siap Ditinjau Sales, sedikit Email-Ready | T0.1 mengukur cakupan; pilih industri/area terbaik; enrichment website; gerbang keputusan Fase 0 |
| **Batas/timeout Overpass publik** | Discovery gagal | Batas radius, timeout, satu retry, cache per run; instance alternatif (cek ketentuannya) |
| **Kebijakan geocoding** (Nominatim publik dibatasi) | Request diblokir | Volume rendah, User-Agent valid, cek kebijakan; koordinat manual atau penyedia lain |
| **Tool calling model tidak andal** (belum terverifikasi) | AI Agent tidak memakai tool dengan benar | T0.3; ganti model atau urutan tool eksplisit di n8n |
| **Batas free-tier** (OpenRouter, n8n cloud, Supabase) | Run macet saat demo | Uji di Fase 0; batasi bisnis per run (mis. ≤15); uji demo sebelumnya; fixture demo berlabel sebagai cadangan |
| **Halusinasi LLM** | Fakta karangan | Validasi skema, wajib evidence, skor deterministik, placeholder di email, review marketing |
| **Email salah dianggap terverifikasi** | Outreach ke alamat keliru | Email wajib punya `source_url`; dilarang menebak; status Needs Verification |
| **Lisensi data**: OSM berlisensi ODbL (atribusi/share-alike untuk database turunan); website punya ketentuan sendiri; data kontak terkait PDPA | Risiko hukum/kepatuhan | Tampilkan "© OpenStreetMap contributors"; hanya halaman publik dan patuhi robots.txt; simpan hanya kontak bisnis beserta sumber; **konfirmasi kewajiban ODbL dan PDPA dengan penyelenggara/MAXY** sebelum outreach nyata; anggap ini prototipe internal |
| **Fetch website rapuh** | Kontak tidak ditemukan | Best-effort, catat kegagalan, jangan menyimpulkan |
| **Koneksi n8n ↔ Next.js** (localhost tidak terjangkau) | Callback gagal | Putuskan hosting di T0.5; tunnel atau deploy lebih awal |
| **Scope creep** | Tenggat terlewat | Semua di luar PRD bagian 6 ditunda |
