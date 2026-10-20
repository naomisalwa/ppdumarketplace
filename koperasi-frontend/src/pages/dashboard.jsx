const getRoleLabel = (role) => {
  switch (role) {
    case "super_admin":
      return "Super Admin";

    case "kasir":
      return "Kasir";

    case "anggota":
      return "Anggota";

    case "seller":
      return "Mitra Penjual";

    default:
      return "Pengguna";
  }
};

function Dashboard() {
  // =========================================
  // GET USER FROM LOCAL STORAGE
  // =========================================

  const userRaw =
    localStorage.getItem("user");

  let user = null;

  try {
    user = userRaw
      ? JSON.parse(userRaw)
      : null;
  } catch (error) {
    console.error(
      "Gagal membaca data user:",
      error
    );

    user = null;
  }

  // =========================================
  // FALLBACK
  // =========================================

  if (!user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Data pengguna tidak ditemukan.
        Silakan logout kemudian login kembali.
      </div>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="space-y-6">

      {/* =====================================
          HEADER
      ====================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Selamat datang,{" "}
          <span className="font-semibold text-slate-700">
            {user.name}
          </span>
          . Anda masuk sebagai{" "}
          <span className="font-semibold">
            {getRoleLabel(
              user.role
            )}
          </span>
          .
        </p>
      </div>

      {/* =====================================
          ROLE INFO
      ====================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        {/* NAMA */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Nama Pengguna
          </p>

          <p className="mt-2 text-lg font-bold text-slate-800">
            {user.name}
          </p>
        </div>

        {/* ROLE */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Role
          </p>

          <p className="mt-2 text-lg font-bold text-blue-600">
            {getRoleLabel(
              user.role
            )}
          </p>
        </div>

        {/* STATUS */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Status
          </p>

          <p className="mt-2 text-lg font-bold text-green-600">
            Aktif
          </p>
        </div>
      </div>

      {/* =====================================
          MENU DESCRIPTION
      ====================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-800">
          Akses Fitur
        </h2>

        <div className="mt-4 space-y-3 text-sm text-slate-600">

          {/* SUPER ADMIN */}

          {user.role ===
            "super_admin" && (
            <>
              <p>
                • Mengakses seluruh fitur koperasi.
              </p>

              <p>
                • Mengelola transaksi,
                stok, riwayat transaksi,
                pengadaan, dan keuangan.
              </p>

              <p>
                • Mengelola master
                produk, kategori, dan
                subkategori.
              </p>

              <p>
                • Melakukan persetujuan
                terhadap produk yang
                diajukan Mitra Penjual.
              </p>
            </>
          )}

          {/* KASIR */}

          {user.role ===
            "kasir" && (
            <>
              <p>
                • Membuat transaksi
                untuk Anggota.
              </p>

              <p>
                • Melakukan proses
                pembayaran transaksi.
              </p>

              <p>
                • Melihat riwayat
                transaksi.
              </p>

              <p>
                • Melihat stok produk.
              </p>
            </>
          )}

          {/* ANGGOTA */}

          {user.role ===
            "anggota" && (
            <>
              <p>
                • Melihat produk yang
                tersedia di koperasi.
              </p>

              <p>
                • Membuat transaksi
                pembelian.
              </p>

              <p>
                • Melihat riwayat
                transaksi milik sendiri.
              </p>
            </>
          )}

          {/* SELLER */}

          {user.role ===
            "seller" && (
            <>
              <p>
                • Melihat dan membeli
                produk yang tersedia di
                koperasi.
              </p>

              <p>
                • Mengajukan produk
                untuk dijual melalui
                koperasi.
              </p>

              <p>
                • Memantau status
                persetujuan produk.
              </p>

              <p>
                • Melihat dan memproses
                pesanan produk milik
                sendiri.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;