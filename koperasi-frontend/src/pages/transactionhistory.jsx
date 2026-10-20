import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

// =====================================================
// HELPERS
// =====================================================

const formatRupiah = (value) => {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value) || 0
  );
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
};

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

// =====================================================
// COMPONENT
// =====================================================

function TransactionHistory() {
  // ===================================================
  // USER FROM LOCAL STORAGE
  // ===================================================

  const userRaw =
    localStorage.getItem(
      "user"
    );

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

  const role =
    user?.role || "";

  const isPersonalUser =
    role === "anggota" ||
    role === "seller";

  // ===================================================
  // STATE
  // ===================================================

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

  const [
    searchName,
    setSearchName,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  // ===================================================
  // USER FALLBACK
  // ===================================================

  if (!user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Data pengguna tidak ditemukan.
        Silakan logout kemudian login kembali.
      </div>
    );
  }

  // ===================================================
  // FETCH TRANSACTIONS
  // ===================================================

  const fetchTransactions =
    async () => {
      try {
        setLoading(true);
        setMessage("");

        const response =
          await api.get(
            "/transactions"
          );

        setTransactions(
          response.data.data ||
            []
        );
      } catch (error) {
        console.error(
          "Fetch Transaction History Error:",
          error
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengambil riwayat transaksi."
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ===================================================
  // CLIENT-SIDE SEARCH
  //
  // Search hanya untuk kasir / super admin.
  // Anggota dan seller otomatis hanya melihat
  // transaksi milik sendiri dari backend.
  // ===================================================

  const filteredTransactions =
    useMemo(() => {
      if (
        isPersonalUser
      ) {
        return transactions;
      }

      const keyword =
        searchName
          .trim()
          .toLowerCase();

      if (!keyword) {
        return transactions;
      }

      return transactions.filter(
        (transaction) =>
          String(
            transaction.member_name ||
              ""
          )
            .toLowerCase()
            .includes(keyword)
      );
    }, [
      transactions,
      searchName,
      isPersonalUser,
    ]);

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();
  };

  const resetSearch = () => {
    setSearchName("");
  };

  // ===================================================
  // TRANSACTION DETAIL
  // ===================================================

  const openTransactionDetail =
    async (
      transactionId
    ) => {
      try {
        setLoadingDetail(
          true
        );

        setMessage("");

        setSelectedTransaction(
          null
        );

        const response =
          await api.get(
            `/transactions/${transactionId}`
          );

        setSelectedTransaction(
          response.data.data ||
            null
        );
      } catch (error) {
        console.error(
          "Fetch Transaction Detail Error:",
          error
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengambil detail transaksi."
        );
      } finally {
        setLoadingDetail(
          false
        );
      }
    };

  // ===================================================
  // CLOSE DETAIL
  // ===================================================

  const closeTransactionDetail =
    () => {
      setSelectedTransaction(
        null
      );
    };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Riwayat Transaksi
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {isPersonalUser
            ? `Lihat riwayat transaksi pembelian Anda sebagai ${getRoleLabel(
                role
              )}.`
            : "Lihat seluruh transaksi penjualan koperasi."}
        </p>
      </div>

      {/* =================================================
          MESSAGE / ERROR
      ================================================== */}

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {/* =================================================
          SEARCH
          HANYA KASIR & SUPER ADMIN
      ================================================== */}

      {!isPersonalUser && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <form
            onSubmit={
              handleSearch
            }
            className="flex flex-col gap-3 sm:flex-row"
          >

            <div className="flex-1">

              <label
                htmlFor="member-search"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Cari Nama Anggota
              </label>

              <input
                id="member-search"
                type="text"
                value={
                  searchName
                }
                onChange={(
                  event
                ) =>
                  setSearchName(
                    event.target
                      .value
                  )
                }
                placeholder="Masukkan nama anggota..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end gap-2">

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Cari
              </button>

              <button
                type="button"
                onClick={
                  resetSearch
                }
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>

            </div>
          </form>
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="border-b border-slate-200 px-5 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-800">
                Daftar Transaksi
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {
                  filteredTransactions.length
                }{" "}
                transaksi ditemukan
              </p>
            </div>

            <button
              type="button"
              onClick={
                fetchTransactions
              }
              disabled={
                loading
              }
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
            >
              Refresh
            </button>

          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Memuat riwayat transaksi...
          </div>
        ) : filteredTransactions.length ===
          0 ? (
          <div className="py-16 text-center">

            <p className="font-medium text-slate-600">
              Belum ada transaksi.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Transaksi akan muncul
              di sini setelah dibuat.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-slate-200">

              {/* =============================
                  TABLE HEAD
              ============================== */}

              <thead className="bg-slate-50">
                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ID
                  </th>

                  {!isPersonalUser && (
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Anggota
                    </th>
                  )}

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Waktu
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pembayaran
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Aksi
                  </th>

                </tr>
              </thead>

              {/* =============================
                  TABLE BODY
              ============================== */}

              <tbody className="divide-y divide-slate-100">

                {filteredTransactions.map(
                  (
                    transaction
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="transition hover:bg-slate-50"
                    >

                      {/* ID */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                        #
                        {
                          transaction.id
                        }
                      </td>

                      {/* MEMBER */}

                      {!isPersonalUser && (
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {
                            transaction.member_name ||
                            "-"
                          }
                        </td>
                      )}

                      {/* DATE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDateTime(
                          transaction.paid_at ||
                            transaction.created_at
                        )}
                      </td>

                      {/* TOTAL */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                        {formatRupiah(
                          transaction.total_amount
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <TransactionStatus
                          status={
                            transaction.status
                          }
                        />
                      </td>

                      {/* PAYMENT */}

                      <td className="px-5 py-4">

                        {transaction.status ===
                        "paid" ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium uppercase text-green-700">
                            {
                              transaction.payment_method ||
                              "cash"
                            }
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                            Menunggu
                          </span>
                        )}

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            openTransactionDetail(
                              transaction.id
                            )
                          }
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                        >
                          Detail
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          DETAIL MODAL
      ================================================== */}

      {(selectedTransaction ||
        loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {loadingDetail ? (
              <div className="p-12 text-center text-slate-500">
                Memuat detail transaksi...
              </div>
            ) : (
              <>

                {/* =======================================
                    MODAL HEADER
                ======================================== */}

                <div className="flex items-start justify-between border-b border-slate-200 p-6">

                  <div>

                    <h2 className="text-xl font-bold text-slate-800">
                      Detail Transaksi #
                      {
                        selectedTransaction.id
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(
                        selectedTransaction.paid_at ||
                          selectedTransaction.created_at
                      )}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      closeTransactionDetail
                    }
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Tutup
                  </button>

                </div>

                {/* =======================================
                    TRANSACTION INFO
                ======================================== */}

                <div className="grid gap-4 border-b border-slate-200 p-6 sm:grid-cols-2">

                  {/* BUYER */}

                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Pembeli
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        selectedTransaction.member_name ||
                        user.name
                      }
                    </p>
                  </div>

                  {/* STATUS */}

                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Status
                    </p>

                    <div className="mt-2">
                      <TransactionStatus
                        status={
                          selectedTransaction.status
                        }
                      />
                    </div>
                  </div>

                  {/* PAYMENT METHOD */}

                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Metode Pembayaran
                    </p>

                    <p className="mt-1 font-semibold uppercase text-slate-800">
                      {
                        selectedTransaction.payment_method ||
                        "-"
                      }
                    </p>
                  </div>

                  {/* CASHIER */}

                  {selectedTransaction.cashier_name && (
                    <div>
                      <p className="text-xs uppercase text-slate-400">
                        Kasir
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {
                          selectedTransaction.cashier_name
                        }
                      </p>
                    </div>
                  )}

                </div>

                {/* =======================================
                    ITEMS
                ======================================== */}

                <div className="p-6">

                  <h3 className="font-bold text-slate-800">
                    Produk Dibeli
                  </h3>

                  <div className="mt-4 space-y-3">

                    {selectedTransaction.items?.length >
                    0 ? (
                      selectedTransaction.items.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >

                            <div className="flex items-start justify-between gap-4">

                              <div>

                                <p className="font-semibold text-slate-800">
                                  {
                                    item.product_name
                                  }
                                </p>

                                {item.brand && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      item.brand
                                    }
                                  </p>
                                )}

                                {item.owner_type ===
                                  "seller" &&
                                  item.seller_name && (
                                    <p className="mt-2 text-xs text-blue-600">
                                      Dijual oleh{" "}
                                      <span className="font-semibold">
                                        {
                                          item.seller_name
                                        }
                                      </span>
                                    </p>
                                  )}

                              </div>

                              <p className="font-bold text-slate-800">
                                {formatRupiah(
                                  item.subtotal
                                )}
                              </p>

                            </div>

                            <div className="mt-3 flex justify-between text-sm text-slate-500">

                              <span>
                                {
                                  item.quantity
                                }{" "}
                                ×{" "}
                                {formatRupiah(
                                  item.unit_price
                                )}
                              </span>

                              <span>
                                Qty:{" "}
                                {
                                  item.quantity
                                }
                              </span>

                            </div>

                          </div>
                        )
                      )
                    ) : (
                      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                        Detail produk tidak
                        tersedia.
                      </div>
                    )}

                  </div>

                  {/* =====================================
                      TOTAL
                  ====================================== */}

                  <div className="mt-6 border-t border-slate-200 pt-4">

                    <div className="flex items-center justify-between">

                      <span className="font-semibold text-slate-600">
                        Total Pembayaran
                      </span>

                      <span className="text-xl font-bold text-blue-600">
                        {formatRupiah(
                          selectedTransaction.total_amount
                        )}
                      </span>

                    </div>
                  </div>

                </div>

              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================
// TRANSACTION STATUS BADGE
// =====================================================

function TransactionStatus({
  status,
}) {
  const labels = {
    pending:
      "Menunggu Pembayaran",

    paid:
      "Sudah Dibayar",

    cancelled:
      "Dibatalkan",
  };

  const styles = {
    pending:
      "bg-yellow-50 text-yellow-700",

    paid:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {labels[status] ||
        status ||
        "-"}
    </span>
  );
}

export default TransactionHistory;