# Pinventa — Validation Log (Fase 0)

> **Aturan dokumen ini:** semua status awal adalah **Not Tested**. Kolom "Hasil aktual" hanya boleh diisi dari pengujian yang benar-benar dijalankan, lengkap dengan tanggal dan bukti (output/screenshot/file mentah). Jangan menulis Pass berdasarkan asumsi atau dokumentasi. Jangan menaruh API key, URL privat, atau data pribadi di file ini.

Terakhir diperbarui: 2026-10-27 (pencocokan study case selesai; **hanya V1 Overpass yang sudah dijalankan**; V2–V6 belum diuji).

## Ringkasan Status
| # | Pengujian | Prioritas | Status |
|---|---|---|---|
| V1 | Overpass API: bisnis nyata di area target | **1** | **Pass** (koneksi & eksekusi query) / **Partial** (kecukupan & relevansi data untuk prospek MAXY) |
| V2 | OpenRouter: panggilan model + tool calling | **2** | Not Tested |
| V3 | Penentuan koordinat tanpa API berbayar | 3 | Not Tested |
| V4 | n8n: workflow + hasil kembali via webhook | 4 | Not Tested |
| V5 | Supabase: koneksi database | 5 | Not Tested |
| V6 | Website resmi: informasi tambahan dari sumber yang diizinkan | 6 | Not Tested |

---

## A. Pencocokan 10 Acceptance Criteria dengan Study Case Resmi

Sumber: `docs/reference/Study Case Hackathon DCB 28.pdf` (15 halaman, teks diekstrak untuk dibaca). Acceptance criteria resmi ada di bagian 4 dan 5 PDF. Perhatikan: **PDF menomori dua kriteria terakhir sama-sama "9"**; PRD memakai 9 dan 10. Nomor 10 hanyalah penomoran ulang, bukan perbedaan makna.

| # PRD | Kriteria resmi (PDF) | Kriteria PRD 7A | Hasil |
|---|---|---|---|
| 1 | Pengguna memilih titik lokasi, radius, dan target industri | Menerima lokasi, radius, dan industri target | Sesuai. Lihat catatan D1 |
| 2 | Agent menemukan minimal 10 bisnis unik dari area yang dipilih | ...minimal 10 bisnis nyata yang unik, **jika tersedia** | **Berbeda redaksi (D2)** |
| 3 | Enrichment atas 10 bisnis dan menampilkan sumber data | Memperkaya 10 bisnis dan menampilkan referensi sumber | Sesuai |
| 4 | Minimal 5 lead dengan data cukup untuk dinilai dan disiapkan bagi review sales | Minimal 5 prospek dengan informasi cukup untuk tinjauan Sales | Sesuai |
| 5 | AI Lead Score beserta reasoning berbasis bukti | Skor yang dapat dijelaskan, bobot 30/25/25/20 | Sesuai; bobot berasal dari FR-04. Lihat D3 |
| 6 | Merekomendasikan solusi MAXY yang sesuai | Merekomendasikan layanan MAXY yang relevan | Sesuai |
| 7 | Minimal 3 personalized outreach email drafts | Minimal 3 draf email outreach personal berbahasa Inggris | Sesuai; bahasa Inggris dari FR-05 |
| 8 | Ekspor ke Google Sheets atau CSV | Ekspor ke CSV atau Google Sheets | Sesuai |
| 9 | Sistem menangani data tidak tersedia tanpa informasi palsu | Menangani data hilang dan error tanpa mengarang | Sesuai (PRD menambah "error", selaras dengan aturan pada bagian 8 PDF) |
| 10 (PDF: "9" kedua) | Workflow agent yang memakai tools dan mengambil keputusan berdasarkan hasil langkah sebelumnya | Idem | Sesuai |

### Perbedaan & temuan yang perlu keputusan tim
Tidak ada perubahan makna kriteria resmi yang dilakukan dalam pencocokan ini; poin berikut hanya dicatat.

- **D1 — Input lokasi.** FR-01 menyebut input via pin/klik peta, nama lokasi/alamat, atau lat/lon, serta input **jumlah prospek yang diinginkan**, dan **menampilkan lokasi bisnis di peta**. PRD belum memuat jumlah prospek maupun tampilan peta. Keputusan: tambahkan input jumlah prospek dan minimal tampilan lokasi (peta atau tautan peta) ke PRD? Peta interaktif penuh termasuk bonus di PDF.
- **D2 — "jika tersedia" di kriteria 2.** Versi resmi tidak memuat frasa ini; frasa berasal dari brief awal tim. Resmi: *minimal 10 bisnis unik*. Jika OSM tidak menghasilkan 10, kriteria resmi tidak terpenuhi, bukan dianggap lolos. Karena itu **V1 menjadi gerbang keputusan** (lihat alternatif di V1). Rekomendasi: hapus frasa "jika tersedia" dari PRD 7A setelah tim setuju.
- **D3 — Kategori skor.** FR-04 mendefinisikan 80–100 High-Priority, 60–79 Medium-Priority, <60 Low-Priority/Requires Research, dan setiap skor harus punya penjelasan yang dapat diaudit. PRD belum memuat kategori ini.
- **D4 — Aturan Needs Verification adalah resmi.** PDF (bagian 5) menyatakan lead tanpa email kerja terverifikasi boleh masuk database sebagai *Needs Verification* tetapi tidak dihitung email-ready lead. Di PRD aturan ini sebelumnya diberi label "aturan internal I1". **Koreksi pelabelan diterapkan di PRD** (aturan bersumber dari study case; bukan salah satu dari 10 nomor AC).
- **D5 — Status database resmi.** FR-06 menyarankan status: Discovered, Researching, Needs Verification, Qualified, Ready for Review, Approved for Outreach, Rejected. PRD/skema memakai `new|sales_review_ready|needs_verification|needs_research|rejected`. Perlu dipetakan atau diganti agar selaras. Pemisahan Siap Ditinjau Sales / Email-Ready / Needs Verification tetap dipertahankan.
- **D6 — Field enrichment & Verification Status.** FR-02 mewajibkan Company Name, Category, Address, **Maps Location/Place Reference**, dan **Source Reference untuk setiap data enrichment**; ada field opsional (website, telepon, email, decision maker + posisi, LinkedIn/corporate profile, deskripsi) serta **Verification Status: Verified / Partial / Not Found**. PRD/skema belum punya field decision maker, deskripsi, maupun Verification Status tiga nilai. Larangan membuat email, nama decision maker, dan pain point palsu berlaku.
- **D7 — Mandatory MVP.** Bagian 5 PDF meminta: penyimpanan hasil enrichment yang diizinkan, status research/qualification, **status outreach**, **duplicate detection**, **timestamp dan sumber data**, serta **filter berdasarkan industri, prioritas, dan kesiapan kontak**. PRD memuat sebagian (dedup, timestamp/sumber); status outreach dan filter prioritas/kesiapan kontak perlu dipastikan.
- **D8 — Struktur email (FR-05).** 4 bagian: personalized opening, observed gap/peluang berbukti, solusi MAXY paling relevan, CTA discovery meeting 10–15 menit. Draf harus ditinjau manusia.
- **D9 — Analisis (FR-03).** Agent harus membedakan *observed facts* dari *potential opportunities*; dugaan masalah internal tidak boleh disajikan sebagai fakta.
- **D10 — Sumber data lokasi.** PDF menyebut Google Places API "atau provider data lokasi resmi lainnya" dan mensyaratkan data nyata untuk live demo (data simulasi hanya untuk testing, berlabel) serta kepatuhan pada ketentuan sumber data. **Belum terverifikasi** apakah OpenStreetMap/Overpass dapat diterima sebagai "provider lain" oleh panitia. Perlu konfirmasi ke penyelenggara dan pertimbangan ODbL.
- **D11 — Fitur bonus (PDF bagian 6)** mencakup multi-agent, chat, peta interaktif, CRM, dll. Tetap di luar cakupan MVP sesuai instruksi tim.
- **D12 — Jadwal.** Pengerjaan 26–28 Okt 2026, showcase 29 Okt 2026 (demo maks. 7 menit + 5 menit Q&A). Validasi teknis perlu selesai sangat cepat.

Tindak lanjut: tim menjawab D1, D2, D5–D7 sebelum PRD diubah lebih lanjut.

---

## B. Checklist Pengujian

Format status: **Not Tested / Pass / Fail**. Isi tanggal, bukti, dan hasil aktual saat pengujian dijalankan.

### V1 — Overpass API (Prioritas 1)
- **Pertanyaan:** Apakah bisnis nyata dapat ditemukan di area target (contoh dari study case: radius 3 km dari Raffles Place, Singapore)?
- **Status:**
  - Koneksi dan eksekusi query Overpass: **PASS**
  - Kecukupan serta relevansi data untuk target prospek MAXY: **PARTIAL**
  - Alasan PARTIAL: (1) lima hasil belum diverifikasi manual (langkah 6 belum dilakukan); (2) kelengkapan data kontak masih rendah; (3) pengulangan untuk industri/area lain dan radius 1 km/5 km (langkah 5) belum dicatat; (4) stabilitas pada beberapa kali percobaan belum dicatat.
- **Langkah pengujian:**
  1. Tetapkan titik uji dan koordinatnya dari sumber yang dapat dicek (jangan percaya angka dari dokumen ini tanpa verifikasi di peta).
  2. Kirim query Overpass ke endpoint publik (`POST`) untuk objek berkategori kantor/profesional dalam radius 3 km, dengan `User-Agent` yang jelas. Catat endpoint, waktu, dan durasi respons.
  3. Simpan respons mentah (JSON) sebagai bukti.
  4. Hitung: jumlah elemen, jumlah bernama unik (setelah deduplikasi), dan berapa yang punya tag `website`, `phone`, `email`, `addr:*`.
  5. Ulangi untuk ≥2 industri/area lain dan ≥1 radius berbeda (1 km dan 5 km).
  6. Verifikasi manual 5 bisnis acak di peta/sumber lain: apakah benar-benar ada?
  7. Catat error, timeout, kode HTTP 429/504, dan batas yang terlihat.
- **Kriteria Pass (usulan):** ≥10 bisnis nyata unik bernama pada setidaknya satu kombinasi area+industri target, 5 sampel terkonfirmasi ada, dan permintaan stabil dalam beberapa kali percobaan. Cakupan website/telepon/email dicatat apa adanya (tidak jadi syarat Pass).
- **Hasil aktual (dicatat 2026-10-27, dari pengujian yang dijalankan tim):**

  | Item | Nilai |
  |---|---|
  | Lokasi query | Raffles Place, Singapore |
  | Koordinat pusat | latitude 1.283477, longitude 103.851760 |
  | Radius | 3000 meter |
  | Query awal `office` | 300 objek. **Angka ini terpotong batas output 300**, bukan jumlah total sebenarnya di area tersebut |
  | Query kategori terarah | 42 objek bernama |
  | Nama unik (berdasarkan nama perusahaan) | 41 |
  | Duplikat terdeteksi | Boston Consulting Group muncul dua kali (selisih 42 vs 41) |
  | Objek dengan website | 14 |
  | Objek dengan telepon | 10 |
  | Objek dengan email | 2 |

  Catatan interpretasi:
  - **Hitungan website, telepon, dan email dapat saling tumpang tindih** (satu objek bisa punya lebih dari satu). Angka-angka itu **tidak boleh dijumlahkan** dan tidak menunjukkan jumlah objek yang punya kontak lengkap.
  - 41 nama unik berarti **41 kandidat bisnis dari data OpenStreetMap**, **bukan** 41 prospek terverifikasi. Belum ada yang diverifikasi keberadaan, relevansi industri, atau kelayakan kontaknya; lima hasil yang belum dicek manual adalah bagian dari ini.
  - Hanya 2 objek yang memiliki email. Belum dicek apakah itu email kerja bisnis atau memenuhi aturan Email-Ready (PRD bagian 5). Jumlah lead email-ready dari data ini **belum dapat diklaim**.
  - Kecukupan terhadap kriteria resmi 2 (minimal 10 bisnis unik): secara jumlah nama unik hasil query terarah melampaui 10, tetapi karena verifikasi manual belum selesai, kriteria ini **belum dinyatakan terpenuhi**.
  - Kecukupan terhadap kriteria resmi 4 (≥5 lead dengan data cukup untuk review Sales) **belum dinilai**, karena enrichment belum diuji.
- **Bukti / tanggal:** 2026-10-27. Respons mentah tersimpan di `docs/validation/raw/` dan dipertahankan sebagai bukti:
  - `overpass_office_3km.json` (query awal `office`, 300 objek)
  - `overpass_targeted_3km.json` (query kategori terarah)
  - `overpass_targeted_3km_preview.csv` (pratinjau hasil query terarah)
- **Tindak lanjut V1:**
  - Verifikasi manual minimal 5 hasil (nama, alamat, kategori) di peta/sumber lain lalu catat hasilnya di sini.
  - Ulangi untuk radius 1 km dan 5 km serta ≥1 area/industri lain; catat stabilitas dan error (429/504).
  - Catat kelengkapan data kontak per objek (bukan hanya hitungan terpisah), termasuk berapa objek yang punya website tetapi tanpa email, sebagai masukan V6.
  - Hapus duplikat (mis. Boston Consulting Group) di logika deduplikasi; sebagai acuan uji kasus nyata.
- **Alternatif jika gagal / data kurang** (hanya dijalankan jika terbukti perlu; jangan mengarang):
  - Ubah kombinasi tag/industri, perbesar radius, atau pilih area lain yang lebih padat.
  - Coba instance Overpass lain setelah membaca ketentuan penggunaannya.
  - Sumber data lokasi lain yang **diizinkan** (mis. Google Places) hanya setelah ketentuan lisensi/penyimpanannya dibaca dan disetujui tim; lihat D10.
  - Jika tetap <10, laporkan jumlah sebenarnya dan hasil tidak ditandai lolos untuk kriteria resmi 2.

### V2 — OpenRouter: panggilan model & tool calling (Prioritas 2)
- **Pertanyaan:** Apakah model yang dipilih dapat dipanggil dan mendukung tool calling?
- **Status:** Partial
- **Model dipilih:** _(isi ID model setelah dipilih; jangan diasumsikan mendukung tool calling)_
- **Langkah pengujian:**
  1. Buat API key OpenRouter; simpan sebagai environment variable, bukan di file/repo.
  2. Ambil daftar model dan filter yang mengklaim dukungan `tools`; catat bahwa itu **klaim metadata**, bukan bukti.
  3. Panggilan sederhana (tanpa tools): periksa respons, latensi, dan error/limit.
  4. Panggilan dengan definisi tool sederhana (mis. fungsi pencarian bisnis dengan argumen `industry`); periksa apakah respons berisi `tool_calls` dengan argumen JSON valid.
  5. Kirim balik hasil tool palsu bertanda uji, lalu periksa apakah model memberi jawaban akhir yang konsisten.
  6. Ulangi 3–5 kali untuk melihat konsistensi; catat rate limit/error.
  7. Uji output JSON terstruktur untuk ekstraksi (tanpa mengarang field yang tidak ada di input).
- **Kriteria Pass (usulan):** pemanggilan berhasil dan `tool_calls` valid muncul pada mayoritas percobaan, serta tidak ada kegagalan sistematis.
- **Hasil aktual:**
  - Tes request teks menggunakan openrouter/free: berhasil. Model yang digunakan adalah nvidia/nemotron-3-ultra-550b-a55b:free.
  - Model berhasil memberikan respons, tetapi tidak mengikuti instruksi untuk membalas dengan teks persis PINVENTA_API_TEST_OK.
  - Tes tool calling pada model pertama menghasilkan JSON menyerupai pemanggilan fungsi di dalam content, bukan tool_calls terstruktur. Status: Partial.
  - Tes menggunakan xingchen-agi/xing4.0-29b-a4b:free gagal dengan HTTP 429 Too Many Requests. Percobaan ulang setelah menunggu 60 detik juga menghasilkan HTTP 429.
  - Validitas dasar API key telah teruji melalui request teks yang berhasil. Kemampuan tool calling untuk model gratis belum tervalidasi.
- **Bukti / tanggal:** 26 Oktober 2026
- **Kesimpulan:** Koneksi teks OpenRouter berhasil, tetapi dukungan tool calling dalam konfigurasi yang diuji belum lulus. Penyebab spesifik HTTP 429 belum terkonfirmasi.
- **Alternatif jika gagal:**
  Untuk MVP, jalankan fungsi Discover dan pengambilan data bisnis melalui backend secara eksplisit. Gunakan LLM untuk analisis dan pembuatan draf outreach. Pengujian model dengan tool calling dapat dilanjutkan setelah fitur inti berjalan.

### V3 — Penentuan koordinat tanpa API berbayar
- **Status:** Not Tested
- **Langkah pengujian:**
  1. Uji input langsung lat/lon (tanpa API apa pun) sebagai jalur utama yang paling pasti.
  2. Uji layanan geocoding gratis (mis. Nominatim) untuk beberapa nama lokasi/alamat Singapore; baca kebijakan penggunaannya dulu (User-Agent, batas request, larangan bulk).
  3. Bandingkan koordinat hasil dengan peta untuk 3–5 lokasi.
  4. Uji kemungkinan pemilihan titik di peta (klik) sebagai alternatif.
- **Kriteria Pass (usulan):** minimal satu jalur tanpa biaya yang akurat dan sesuai ketentuan penggunaan.
- **Hasil aktual:** _(kosong)_
- **Alternatif jika gagal:** input lat/lon manual saja; pemilihan titik di peta; layanan geocoding lain setelah ketentuannya dicek.

### V4 — n8n: workflow & webhook
- **Status:** Not Tested
- **Langkah pengujian:**
  1. Tentukan n8n cloud atau self-hosted; catat batasan paket.
  2. Buat workflow uji: Webhook → langkah sederhana → respons JSON.
  3. Panggil webhook dari komputer lokal; catat respons dan durasi.
  4. Uji panggilan balik (callback) dari n8n ke URL aplikasi yang dapat dijangkau (bukan sekadar localhost; mis. tunnel atau deployment).
  5. Uji node AI Agent dengan kredensial OpenRouter setelah V2 lulus.
  6. Periksa batas waktu eksekusi dan penanganan error.
- **Kriteria Pass (usulan):** webhook dipanggil, workflow berjalan, dan hasil kembali ke pemanggil; callback ke aplikasi berhasil.
- **Hasil aktual:** _(kosong)_
- **Alternatif jika gagal:** polling status dari aplikasi ke n8n; n8n menulis langsung ke database; deploy aplikasi lebih awal atau pakai tunnel.

### V5 — Supabase
- **Status:** Not Tested
- **Langkah pengujian:**
  1. Buat project Supabase; simpan URL dan key di environment variable, jangan di repo.
  2. Buat tabel uji sederhana; lakukan insert dan select dari komputer lokal.
  3. Uji akses dari lingkungan yang akan dipakai (server aplikasi, n8n).
  4. Catat batas paket gratis dan perilaku pause/project idle.
- **Kriteria Pass (usulan):** koneksi, insert, dan select berhasil dari komponen yang akan memakainya.
- **Hasil aktual:** _(kosong)_
- **Alternatif jika gagal:** database PostgreSQL lain (mis. Neon, yang disebut di study case) atau CSV/Google Sheets sebagai penyimpanan sementara.

### V6 — Website resmi (sumber diizinkan)
- **Status:** Not Tested
- **Langkah pengujian:**
  1. Ambil 10 bisnis dari hasil V1 yang punya URL website.
  2. Baca `robots.txt` dan syarat penggunaan masing-masing situs.
  3. Hanya untuk halaman publik yang diizinkan, ambil beranda/halaman kontak dari lingkungan yang akan dipakai (n8n).
  4. Catat apa yang berhasil diekstrak (email, telepon, deskripsi) beserta `source_url`, serta kegagalan (blokir, timeout, konten dinamis).
  5. Pastikan tidak ada email/nama yang ditebak; tandai "Not Found" untuk yang tidak ada.
- **Kriteria Pass (usulan):** informasi tambahan yang dapat ditelusuri ke halaman publik berhasil diperoleh untuk sebagian bisnis, tanpa melanggar ketentuan situs.
- **Hasil aktual:** _(kosong)_
- **Alternatif jika gagal:** tandai Needs Verification / Not Found; tidak bypass proteksi (dilarang di study case); sumber profesional publik lain hanya jika diizinkan.

---

## C. Gerbang Keputusan Fase 0
Setelah V1 dan V2 selesai (lalu V3–V6), isi:
- Lanjut / sesuaikan desain / gunakan fallback: _(kosong)_
- Keputusan atas D1–D12: _(kosong)_
- Tanggal & peserta keputusan: _(kosong)_
