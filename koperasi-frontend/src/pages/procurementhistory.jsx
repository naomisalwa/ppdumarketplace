import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const ProcurementHistory = () => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // =========================
  // FETCH HISTORY
  // =========================

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get(
        "/procurement/history"
      );

      setHistory(response.data.data || []);
    } catch (error) {
      console.error(
        "Fetch Procurement History Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Gagal mengambil sejarah belanja."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredHistory = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return history;
    }

    return history.filter((item) => {
      return (
        item.product_name
          ?.toLowerCase()
          .includes(keyword) ||
        item.brand
          ?.toLowerCase()
          .includes(keyword) ||
        item.supplier_name
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [history, search]);

  // =========================
  // SUMMARY
  // =========================

  const summary = useMemo(() => {
    return history.reduce(
      (result, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const purchasePrice =
          Number(item.purchase_price) || 0;

        result.totalProcurement += 1;
        result.totalItems += quantity;

        result.totalSpending +=
          quantity * purchasePrice;

        return result;
      },
      {
        totalProcurement: 0,
        totalItems: 0,
        totalSpending: 0,
      }
    );
  }, [history]);

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sejarah Belanja
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Riwayat pengadaan dan barang masuk
            koperasi.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading
            ? "Memuat..."
            : "Refresh Data"}
        </button>
      </div>

      {/* ERROR */}

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Pengadaan
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {summary.totalProcurement}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Barang Masuk
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {summary.totalItems}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Belanja
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatRupiah(
              summary.totalSpending
            )}
          </p>
        </div>
      </div>

      {/* SEARCH */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="procurement-search"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cari Sejarah Belanja
        </label>

        <input
          id="procurement-search"
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Cari produk, merk, atau supplier..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* TABLE */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-800">
            Riwayat Pengadaan
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredHistory.length} data
            ditampilkan
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Memuat sejarah belanja...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium text-slate-600">
              Belum ada sejarah belanja.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Data pengadaan barang akan
              ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tanggal
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Produk
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Jumlah
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Harga Beli
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Harga Jual
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Belanja
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kedaluwarsa
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(
                  (item) => {
                    const quantity =
                      Number(item.quantity) ||
                      0;

                    const purchasePrice =
                      Number(
                        item.purchase_price
                      ) || 0;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            item.purchase_date
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.product_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.brand ||
                              "Tanpa merk"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.supplier_name ||
                            "-"}
                        </td>

                        <td className="px-5 py-4 text-center text-sm font-semibold text-slate-800">
                          {quantity}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-600">
                          {formatRupiah(
                            purchasePrice
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-600">
                          {formatRupiah(
                            item.sale_price
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-800">
                          {formatRupiah(
                            quantity *
                              purchasePrice
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {item.expired_date ? (
                            <span className="font-medium text-slate-700">
                              {formatDate(
                                item.expired_date
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProcurementHistory;