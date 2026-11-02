# NIRAYA POS - Fitur Sidebar

Dokumen ini berisi daftar fitur berdasarkan struktur navigasi sidebar pada aplikasi NIRAYA POS.

## Struktur Navigasi

### Dashboard
| Menu | Route | Status | Deskripsi |
|---|---|---|---|
| Dashboard | `/dashboard` | Implemented | Halaman utama dengan ringkasan bisnis, metrik, grafik revenue, transaksi terbaru, dan produk terlaris |

### Platform

#### Sales
| Menu | Route | Status | Deskripsi |
|---|---|---|---|
| POS | `/pos` | Implemented | Interface kasir untuk pemrosesan penjualan (katalog produk, keranjang, dan checkout) |
| Transactions | `/transactions` | Not Implemented | Riwayat transaksi, detail transaksi, dan pencarian transaksi |
| Customers | `/customers` | Not Implemented | Manajemen data pelanggan dan riwayat pembelian |

#### Management
| Menu | Route | Status | Deskripsi |
|---|---|---|---|
| Products | `/products` | Not Implemented | Manajemen katalog produk, harga jual, SKU, dan informasi produk |
| Categories | `/categories` | Not Implemented | Manajemen kategori produk |
| Inventory | `/inventory` | Not Implemented | Manajemen stok, peringatan stok rendah, dan penyesuaian stok |

#### Analytics
| Menu | Route | Status | Deskripsi |
|---|---|---|---|
| Reports | `/reports` | Not Implemented | Laporan penjualan, analitik bisnis, dan ekspor data |

### Additional

| Menu | Route | Status | Deskripsi |
|---|---|---|---|
| Administration | `#` | Not Implemented | Administrasi sistem |
| Staff Management | `/staff` | Not Implemented | Manajemen staf/karyawan dan pengaturan hak akses |
| Settings | `/settings` | Not Implemented | Pengaturan toko, metode pembayaran, pajak, dan konfigurasi bisnis |
| Help & Support | `/help` | Not Implemented | Bantuan, FAQ, dan dukungan |

## Fitur yang Sudah Diimplementasi

- Dashboard dengan statistik, grafik, dan ringkasan bisnis
- Point of Sale (POS) dengan katalog produk, keranjang, dan checkout
- Struktur sidebar dengan grup navigasi
- Dukungan tema Light/Dark
- Layout responsive

## Catatan

- `Implemented` = Telah tersedia dan dapat diakses
- `Not Implemented` = Belum tersedia, route belum terhubung atau halaman belum dibuat
- Menu dengan route `#` belum memiliki halaman yang terhubung
