# Pinventa — PRD (MVP)

> **Catatan sumber kriteria:** Acceptance criteria resmi adalah **10 kriteria dari study case MAXY** (bagian 7A). Teks resmi study case belum ada di repo; 10 kriteria tersebut dicatat sesuai versi yang diberikan tim, jadi **sebelum pengembangan, cocokkan dengan dokumen resmi** dan perbarui bila ada perbedaan. Aturan tambahan buatan tim proyek dipisahkan di bagian 7B dan **bukan** acceptance criteria resmi MAXY.

## 1. Masalah & Tujuan
**Masalah:** Tim sales MAXY Singapore mencari dan meriset prospek B2B secara manual lewat peta, website, dan spreadsheet. Prosesnya lambat, tidak konsisten, dan sulit menjelaskan "mengapa prospek ini?".

**Tujuan:** Dari lokasi, radius, dan industri target, Pinventa menemukan bisnis nyata di sekitar lokasi, memperkaya datanya dari sumber publik, menilai prospek dengan skor yang dapat dijelaskan, merekomendasikan layanan MAXY, membuat draf email outreach, dan mengekspor hasil ke CSV, **tanpa mengarang data**.

**Di luar cakupan MVP:** chatbot, arsitektur multi-agent, sinkronisasi CRM, pengiriman email otomatis, login/role kompleks, jadwal otomatis.

## 2. Pengguna Target
| Pengguna | Kebutuhan |
|---|---|
| Sales / BD MAXY Singapore | Daftar prospek singkat, beserta bukti sumber dan draf email, yang siap ditinjau |
| Tim digital marketing | Menentukan industri, rubrik skor, katalog layanan, dan gaya email; meninjau kualitas hasil |

## 3. Alur Pengguna Utama
1. Pengguna membuka **New Search**, mengisi lokasi, radius, industri, lalu submit.
2. Sistem membuat **Run**; AI Agent menemukan bisnis (Overpass), menghapus duplikat, dan memutuskan bisnis mana yang perlu diperkaya datanya.
3. Pengguna melihat **Run Progress** (log langkah: tool yang dipanggil, hasil, keputusan).
4. Pengguna membuka **Leads List**: diurutkan berdasarkan skor, dengan label kelengkapan data dan status.
5. Pengguna membuka **Lead Detail**: fakta beserta link sumber, rincian skor, rekomendasi layanan MAXY, draf email, daftar data yang hilang.
6. Pengguna mengedit draf dan mengubah status prospek.
7. Pengguna klik **Export CSV**.

## 4. Layar yang Dibutuhkan
1. **New Search**: lokasi (teks → koordinat, dengan konfirmasi tempat hasil geocoding atau pemilihan titik manual jika geocoding gagal), radius, industri (daftar tetap), submit.
2. **Run Progress**: status run dan log langkah AI Agent, termasuk error dan langkah yang dilewati.
3. **Leads List**: tabel nama, alamat, industri, skor, kelengkapan, status, badge asal data (`live`/`demo`); filter/sort; tombol export.
4. **Lead Detail**: field beserta sumbernya, rincian skor (4 komponen, bobot, alasan), layanan, draf email (bisa diedit), daftar data yang hilang.
5. **Settings (ringan)**: tampilan read-only bobot skor dan katalog layanan MAXY (edit lewat file config sudah cukup).

## 5. Status Prospek (Penting)
Pinventa membedakan dua hal yang **tidak boleh dicampur**:

| Status | Syarat | Dihitung untuk |
|---|---|---|
| **Siap Ditinjau Sales** | Nama bisnis + alamat + industri + minimal 1 bukti sumber (`source_url`) + informasi cukup untuk dinilai (skor dapat dihitung beserta alasannya). **Email kerja tidak wajib.** | Kriteria resmi 4 (≥5 prospek dengan informasi cukup untuk tinjauan Sales) |
| **Email-Ready** | Memenuhi semua syarat Siap Ditinjau Sales **ditambah** email kerja bisnis terverifikasi, yaitu tercantum di sumber publik (website resmi/tag OSM) dengan `source_url`, bukan alamat pribadi, dan bukan hasil tebakan/pola | Hanya penanda kesiapan outreach (aturan internal I1); **tidak** dipakai untuk memenuhi kriteria resmi 4 |
| **Needs Verification** | Siap Ditinjau Sales, tetapi email kerja tidak ditemukan atau belum terverifikasi | Boleh disimpan dan dinilai; **tidak boleh dihitung sebagai Email-Ready lead** |

Aturan:
- Email tidak boleh ditebak (mis. `info@domain`) atau diturunkan dari pola. Jika tidak ditemukan, tampilkan "Not found".
- "Terverifikasi" di MVP berarti **dapat ditelusuri ke sumber publik**. Uji deliverability email di luar cakupan.
- Draf email untuk prospek Needs Verification boleh dibuat (mis. untuk kriteria resmi 7), tetapi diberi label "Needs Verification — penerima belum terverifikasi" dan memakai placeholder penerima.
- Aturan bahwa lead tanpa email kerja terverifikasi boleh masuk database sebagai Needs Verification tetapi tidak dihitung email-ready **berasal dari study case resmi MAXY** (bagian 5 PDF). Detail definisi "terverifikasi" dan nama tiga status di PRD ini adalah **aturan bisnis internal** proyek, ditafsirkan dari kriteria resmi 4 dan 7. Lihat `docs/VALIDATION_LOG.md` bagian A (D4, D5).

## 6. Fitur Wajib
- **F1 Input pencarian:** lokasi, radius, industri divalidasi.
- **F2 Discovery:** query Overpass → ≥10 bisnis unik nyata bila tersedia; deduplikasi berdasarkan OSM id + nama/alamat ternormalisasi. Jika kurang dari 10, tampilkan jumlah sebenarnya, jangan mengisi dengan data palsu.
- **F3 Enrichment:** ≥10 bisnis diperkaya (tag OSM, halaman website resmi yang diizinkan, diambil lewat n8n); setiap fakta menyimpan `source_url` dan `retrieved_at`.
- **F4 Kualifikasi:** ≥5 prospek berstatus Siap Ditinjau Sales bila data tersedia. Status Email-Ready dilacak terpisah (lihat bagian 5).
- **F5 Skor yang dapat dijelaskan (bobot tetap):**
  - Industry & Customer Fit 30%
  - Digital/AI Opportunity 25%
  - Contact Readiness 25%
  - Data Quality & Evidence Confidence 20%

  Tiap komponen 0–100 dengan alasan yang merujuk bukti; total dihitung deterministik di kode. LLM hanya mengusulkan sub-skor dan alasan. Prospek tanpa email kerja otomatis mendapat Contact Readiness lebih rendah, bukan dibuang.
- **F6 Rekomendasi layanan:** dipilih dari katalog layanan MAXY (disediakan tim marketing), dengan bukti prospek yang mendasarinya. Tidak boleh ada layanan di luar katalog.
- **F7 Draf outreach:** ≥3 draf email personal berbahasa Inggris; hanya memakai fakta terverifikasi dari data prospek; gunakan placeholder (mis. `[contact name]`) bila tidak diketahui. Setiap draf diberi label Email-Ready atau Needs Verification.
- **F8 Ekspor:** CSV (nama, alamat, industri, website, telepon, email, status, flag `email_ready`, skor + 4 komponen, layanan, sumber, asal data, data yang hilang). Google Sheets opsional/belakangan.
- **F9 Data hilang & error:** nilai tidak diketahui = `null`/"Not found", tidak pernah ditebak. Tool yang gagal muncul sebagai error di log; run berakhir `completed`, `partial`, atau `failed` beserta alasan.
- **F10 AI Agent workflow:** AI Agent di n8n dengan tool (geocode, pencarian Overpass, fetch website, simpan data). Keputusan terlihat di log, mis. "tidak ada website → lewati scraping, turunkan skor kontak"; "<10 hasil → coba perluas radius sekali (maks 2× radius), tercatat di log".
- **Data nyata vs demo:** semua record punya `data_origin` = `live` | `demo`. Data demo berada di fixture terpisah, ditandai badge "DEMO" di UI dan CSV, dan tidak dicampur ke run live.

## 7. Kriteria Penerimaan

### 7A. Acceptance Criteria Resmi MAXY (10 kriteria)
Makna tiap kriteria mengikuti study case; kolom kanan hanya menjelaskan cara tim memverifikasinya.

| # | Kriteria resmi | Cara verifikasi (usulan tim) |
|---|---|---|
| 1 | Menerima lokasi, radius, dan industri target | Uji UI: input valid diterima, tidak valid ditolak |
| 2 | Menemukan minimal 10 bisnis nyata yang unik, jika tersedia | Run live di area padat; jika kurang dari 10, tampilkan jumlah sebenarnya dan alasan |
| 3 | Memperkaya 10 bisnis dan menampilkan referensi sumber | Cek manual 5 prospek terhadap link sumber |
| 4 | Minimal 5 prospek dengan informasi yang cukup untuk tinjauan Sales | Hitung prospek berstatus Siap Ditinjau Sales (bagian 5) |
| 5 | Skor yang dapat dijelaskan dengan bobot 30% / 25% / 25% / 20% | Unit test + tampilan rincian skor |
| 6 | Merekomendasikan layanan MAXY yang relevan | Cek UI per prospek |
| 7 | Menghasilkan minimal 3 draf email outreach personal berbahasa Inggris | Review tim marketing |
| 8 | Mengekspor hasil ke CSV atau Google Sheets | Unduh dan buka CSV |
| 9 | Menangani data hilang dan error tanpa mengarang informasi bisnis | Uji failure-injection |
| 10 | Mendemonstrasikan workflow AI Agent yang memakai tool dan keputusan berdasarkan hasil sebelumnya | Inspeksi log langkah run |

### 7B. Aturan Bisnis Internal & Kriteria Kualitas Proyek (bukan acceptance criteria resmi MAXY)
Dibuat oleh tim proyek untuk menjaga kualitas dan menafsirkan kriteria resmi. Boleh diubah tim tanpa mengubah 7A.

| # | Aturan internal | Terkait kriteria resmi | Cara verifikasi |
|---|---|---|---|
| I1 | Prospek tanpa email kerja terverifikasi berstatus Needs Verification dan **tidak** dihitung Email-Ready (aturan ini **bersumber dari study case resmi**, bagian 5 PDF; bukan salah satu dari 10 nomor kriteria) | 4, 7 | Query database + CSV |
| I2 | Data demo selalu berlabel `demo` dan tidak masuk ekspor live kecuali dipilih eksplisit | 8, 9 | Cek UI/CSV |
| I3 | Setiap prospek Siap Ditinjau Sales punya ≥1 layanan katalog beserta alasan berbasis bukti; tidak ada layanan di luar katalog | 6 | UI |
| I4 | Draf email hanya memakai fakta dari data prospek dan diberi label Email-Ready / Needs Verification | 7, 9 | Review marketing |
| I5 | Kolom CSV mencakup `review_status`, `email_ready`, `data_origin`, sumber, dan data yang hilang | 8 | Cek manual CSV |
| I6 | Total skor dihitung ulang di kode dan harus sama dengan yang tampil | 5 | Unit test |
| I7 | Setiap fakta kontak yang tidak null punya `source_url`; data hilang tampil "Not found" | 3, 9 | Cek UI + query database |
| I8 | Log run memuat ≥2 pemanggilan tool dan ≥1 keputusan yang merujuk hasil sebelumnya | 10 | Inspeksi log |

> **Belum terverifikasi:** perilaku API eksternal (cakupan/batas Overpass, geocoding, model OpenRouter, keberhasilan fetch website) tidak boleh dianggap berfungsi sebelum diuji di Fase 0 pada rencana implementasi.
