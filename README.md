# Dokumentasi Jawaban Diskusi & Hasil Pengujian
**Proyek:** Multi-Tier Document Request Approval System  
**Dokumen Referensi:** `TEST-BRIEF.md` (Bagian 7 & Bagian 8)  
**Tanggal:** 3 November 2026  

---
## 7. Pertanyaan Diskusi (WAJIB dijawab, dikirim bersama submission)

1. Race condition

Kalau dua klik masuk hampir bersamaan, risikonya aksi terproses dua kali atau dua keputusan saling menimpa, sehingga status akhir dokumen tidak cocok dengan log. Saya menanganinya dengan tiga lapis. Pertama, seluruh proses approve/reject dibungkus satu transaksi database. Kedua, baris approval instance dikunci dengan SELECT ... FOR UPDATE, jadi request kedua menunggu yang pertama selesai lalu membaca kondisi terbaru. Ketiga, update step memakai syarat WHERE status = 'pending' dan jumlah baris yang berubah dicek. Kalau hasilnya 0, berarti sudah ada yang memproses lebih dulu, dan request ditolak dengan error. Di frontend tombol juga saya nonaktifkan saat loading, tapi itu hanya untuk kenyamanan. Pengamannya tetap di backend dan database.

2. Self-approval

Tidak boleh, bahkan kalau requester memang terdaftar sebagai approver di step tersebut. Alasannya prinsip pemisahan tugas: orang yang mengajukan tidak boleh jadi orang yang menyetujui, kalau tidak, proses approval kehilangan fungsinya. Di server, ada pengecekan di usecase yang menolak aksi jika user yang login sama dengan requester. Request milik sendiri juga tidak muncul di inbox, dan di halaman detail tombol approve/reject diganti pesan bahwa self-approval tidak diizinkan.

3. Setelah rejected

Request yang sudah rejected tidak saya ubah atau saya reset, karena riwayat penolakannya adalah bukti audit. Sebagai gantinya, requester menekan tombol “Revise & Resubmit” di halaman detail. Form terbuka dengan data lama sudah terisi, lalu saat dikirim sistem membuat request baru yang melewati alur submit biasa, lengkap dengan snapshot approver dari awal lagi. Karena tidak mengubah tabel yang sudah ada, keterkaitan dengan request lama saya simpan lewat penanda revisi di judul (misalnya [Rev-1]), referensi ID request lama di deskripsi, dan satu catatan di log bahwa ini pengajuan ulang dari dokumen sebelumnya.

4. Satu kolom yang akan saya ubah

Saya akan menambah category_id di tabel approval_workflows. Sekarang hubungan category ke approval line lewat tabel perantara, padahal aturan bisnisnya satu category hanya punya satu alur aktif. Dengan kolom langsung, join berkurang dan saya bisa memasang unique constraint supaya database sendiri yang menjamin tidak ada dua alur aktif untuk category yang sama, tidak hanya mengandalkan kode aplikasi. Alternatifnya, saya akan menambah parent_request_id di tabel request untuk melacak riwayat revisi dengan rapi.
---

## 8. Bukti Tangkapan Layar / Screenshots

Seluruh berkas gambar tersimpan di folder:  
`submission/screenshots/`

| No | Nama Berkas | Keterangan & Deskripsi Bukti |
|:---:|:---|:---|
| 1 | `01_submit_request_sdm_3step.png` | **Modal Submit Request SDM (3-Step):** Menampilkan form pengajuan dokumen kategori Sumber Daya Manusia (SDM) yang terikat pada workflow approval 3 langkah. |
| 2 | `02_submit_request_it_2step.png` | **Modal Submit Request IT (2-Step):** Menampilkan form pengajuan dokumen kategori Teknologi Informasi (IT) yang terikat pada workflow approval 2 langkah. |
| 3 | `03_my_requests_list_steps.png` | **Tabel My Document Requests (Step Indikator):** Menampilkan daftar dokumen yang diajukan beserta status awal: SDM (`Step 1 of 3`) dan IT (`Step 1 of 2`). |
| 4 | `04_approver1_inbox.png` | **Approval Inbox Approver 1:** Menampilkan inbox akun `approver1` yang memuat tugas persetujuan untuk kedua dokumen di Step 1. |
| 5 | `05_reject_modal_with_comment.png` | **Modal Penolakan dengan Komentar Wajib:** Menampilkan dialog aksi penolakan dokumen SDM lengkap dengan catatan revisi wajib (*mandatory comment*). |
| 6 | `06_approver2_inbox_next_step.png` | **Approval Inbox Approver 2:** Menampilkan inbox akun `approver2`, membuktikan dokumen IT telah berhasil naik ke Step 2 (`Step 2 of 2`) setelah disetujui di Step 1. |
| 7 | `07_requests_final_status.png` | **Tabel My Requests (Status Akhir):** Menampilkan status final kedua dokumen di akun requester: IT berstatus **Approved** (*All Steps Complete*) dan SDM berstatus **Rejected** (*Approval Stopped*). |
| 8 | `08_detail_approved_timeline_audit.png` | **Timeline Audit Dokumen IT (Approved):** Halaman detail dokumen IT menampilkan riwayat approval lengkap dari Step 1 (Approver One) hingga Step 2 (Approver Two) beserta catatan persetujuan masing-masing. |
| 9 | `09_detail_rejected_timeline_audit.png` | **Timeline Audit Dokumen SDM (Rejected):** Halaman detail dokumen SDM menampilkan status Rejected, stepper terhenti di Step 1, dan catatan penolakan dari Approver One. |

---

## Panduan Menjalankan Aplikasi & Reproduksi

### 1. Prasyarat Sistem
- **Node.js:** Versi >= 20.x
- **Package Manager:** `pnpm`
- **Database:** PostgreSQL (sudah aktif di port 5432)

### 2. Konfigurasi Lingkungan (`.env`)
Pastikan variabel lingkungan pada berkas `.env` sudah sesuai:
```env
DB_DIALECT=postgresql
POSTGRES_URL=postgresql://postgres:password@localhost:5432/db_skeleton
COOKIE_SECURE=false
AUTH_MODE=local
AUTH_SECRET=secret-bebas-apa-saja-1234567890
NEXTAUTH_SECRET=secret-bebas-apa-saja-1234567890
APP_URL=http://localhost:3003
AUTH_URL=http://localhost:3003
NEXTAUTH_URL=http://localhost:3003
```

### 3. Instalasi Dependensi & Inisialisasi Database
```bash
# 1. Install dependencies
pnpm install

# 2. Sinkronisasi skema ke database
pnpm db:push

# 3. Jalankan seeding user, role, permission, category, dan approval line
pnpm db:seed
```

### 4. Menjalankan Server Aplikasi
```bash
pnpm dev
```
Aplikasi berjalan pada: `http://localhost:3003`

### 5. Kredensial Akun Pengujian
| Akun | Username | Password | Role / Peran |
|:---|:---|:---|:---|
| **Admin** | `admin` | `admin123` | Super Admin / Requester Pengaju Dokumen |
| **Approver 1** | `approver1` | `approver123` | Approver Level 1 (SDM & IT) |
| **Approver 2** | `approver2` | `approver123` | Approver Level 2 (SDM & IT) |
| **Approver 3** | `approver3` | `approver123` | Approver Level 3 (SDM) |
| **Viewer** | `viewer` | `viewer123` | Pengguna Read-Only |

