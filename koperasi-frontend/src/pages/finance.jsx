import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import api from "../services/api";

// =========================
// CHART CONFIG
// =========================

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// =========================
// HELPERS
// =========================

const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(
    new Date(`${value}T00:00:00`)
  );
};

const getTodayString = () => {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =========================
// COMPONENT
// =========================

const Finance = () => {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayString()
  );

  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    reportItems,
    setReportItems,
  ] = useState([]);

  const [
    topProducts,
    setTopProducts,
  ] = useState([]);

  const [
    currentShift,
    setCurrentShift,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    openingShift,
    setOpeningShift,
  ] = useState(false);

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("success");

  // =========================
  // FETCH FINANCE
  // =========================

  const fetchFinanceData =
    async (
      date = selectedDate
    ) => {
      try {
        setLoading(true);
        setMessage("");

        const [
          summaryResponse,
          reportResponse,
          topProductsResponse,
        ] =
          await Promise.all([
            api.get(
              "/finance/summary",
              {
                params: {
                  date,
                },
              }
            ),

            api.get(
              "/finance/daily-report",
              {
                params: {
                  date,
                },
              }
            ),

            api.get(
              "/finance/top-products",
              {
                params: {
                  date,
                },
              }
            ),
          ]);

        setSummary(
          summaryResponse
            .data
            .data || null
        );

        const reportData =
          reportResponse
            .data
            .data || {};

        setReport(
          reportData.header ||
            null
        );

        setReportItems(
          reportData.items || []
        );

        setTopProducts(
          topProductsResponse
            .data
            .data || []
        );
      } catch (error) {
        console.error(
          "Fetch Finance Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response
            ?.data
            ?.message ||
            "Gagal mengambil data keuangan."
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // CURRENT SHIFT
  // =========================

  const fetchCurrentShift =
    async () => {
      try {
        const response =
          await api.get(
            "/finance/shift/current"
          );

        setCurrentShift(
          response.data.data ||
            null
        );
      } catch (error) {
        console.error(
          "Fetch Current Shift Error:",
          error
        );
      }
    };

  // =========================
  // INITIAL LOAD / DATE CHANGE
  // =========================

  useEffect(() => {
    fetchFinanceData(
      selectedDate
    );

    fetchCurrentShift();
  }, [selectedDate]);

  // =========================
  // OPEN SHIFT
  // =========================

  const handleOpenShift =
    async () => {
      try {
        setOpeningShift(true);
        setMessage("");

        const response =
          await api.post(
            "/finance/shift/open"
          );

        setMessageType(
          "success"
        );

        setMessage(
          response.data.message ||
            "Shift berhasil dibuka."
        );

        await fetchCurrentShift();

        if (
          selectedDate ===
          getTodayString()
        ) {
          await fetchFinanceData(
            selectedDate
          );
        }
      } catch (error) {
        console.error(
          "Open Shift Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response
            ?.data
            ?.message ||
            "Gagal membuka shift."
        );
      } finally {
        setOpeningShift(false);
      }
    };

  // =========================
  // GENERATE REPORT
  // =========================

  const handleGenerateReport =
    async () => {
      try {
        setGenerating(true);
        setMessage("");

        const response =
          await api.post(
            "/finance/daily-report/generate",
            {
              date:
                selectedDate,
            }
          );

        setMessageType(
          "success"
        );

        setMessage(
          response.data.message ||
            "Laporan berhasil diperbarui."
        );

        await fetchFinanceData(
          selectedDate
        );
      } catch (error) {
        console.error(
          "Generate Finance Report Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response
            ?.data
            ?.message ||
            "Gagal memperbarui laporan."
        );
      } finally {
        setGenerating(false);
      }
    };

  // =========================
  // CHART DATA
  // =========================

  const chartData = {
    labels:
      topProducts.map(
        (product) =>
          product.product_name
      ),

    datasets: [
      {
        label:
          "Jumlah Terjual",

        data:
          topProducts.map(
            (product) =>
              Number(
                product.total_sold
              ) || 0
          ),
      },
    ],
  };

  // =========================
  // CHART OPTIONS
  // =========================

  const chartOptions = {
    responsive: true,

    maintainAspectRatio:
      false,

    plugins: {
      legend: {
        display: false,
      },

      title: {
        display: false,
      },

      tooltip: {
        callbacks: {
          afterLabel: (
            context
          ) => {
            const product =
              topProducts[
                context.dataIndex
              ];

            if (!product) {
              return "";
            }

            return `Pendapatan: ${formatRupiah(
              product.total_revenue
            )}`;
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,
        },
      },
    },
  };

  // =========================
  // DERIVED VALUES
  // =========================

  const totalSales =
    Number(
      summary?.total_sales
    ) || 0;

  const totalCost =
    Number(
      summary?.total_cost
    ) || 0;

  const totalProfit =
    Number(
      summary?.total_profit
    ) || 0;

  const openingBalance =
    Number(
      summary?.opening_balance
    ) || 0;

  const currentCashBalance =
    Number(
      summary?.current_cash_balance
    ) || 0;

  const totalItemsSold =
    Number(
      summary?.total_items_sold
    ) || 0;

  const legacyCostRows =
    Number(
      summary?.legacy_cost_rows
    ) || 0;

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Finance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Ringkasan keuangan,
            modal penjualan,
            profit, dan laporan
            penjualan koperasi.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

          <div>
            <label
              htmlFor="finance-date"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Tanggal Laporan
            </label>

            <input
              id="finance-date"
              type="date"
              value={
                selectedDate
              }
              onChange={(
                event
              ) =>
                setSelectedDate(
                  event.target
                    .value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={
              handleGenerateReport
            }
            disabled={
              generating ||
              loading
            }
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {generating
              ? "Memperbarui..."
              : "Refresh Laporan"}
          </button>

        </div>
      </div>

      {/* =========================
          MESSAGE
      ========================= */}

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            messageType ===
            "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* =========================
          SHIFT
      ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Shift Hari Ini
            </p>

            {currentShift ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                  <p className="text-lg font-bold text-green-600">
                    Shift Aktif
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Dibuka oleh{" "}
                  <strong>
                    {currentShift.opened_by_name ||
                      "-"}
                  </strong>{" "}
                  dengan saldo awal{" "}
                  <strong>
                    {formatRupiah(
                      currentShift.opening_balance
                    )}
                  </strong>
                  .
                </p>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />

                  <p className="text-lg font-bold text-yellow-600">
                    Belum Dibuka
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Saldo awal shift
                  adalah Rp100.000.
                </p>
              </>
            )}
          </div>

          {!currentShift && (
            <button
              type="button"
              onClick={
                handleOpenShift
              }
              disabled={
                openingShift
              }
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              {openingShift
                ? "Membuka..."
                : "Buka Shift"}
            </button>
          )}

        </div>
      </section>

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Memuat data
            keuangan...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Mohon tunggu.
          </p>
        </div>
      ) : (
        <>

          {/* =========================
              SUMMARY
          ========================= */}

          <section>

            <div className="mb-3">
              <h2 className="font-bold text-slate-800">
                Ringkasan{" "}
                {formatDate(
                  selectedDate
                )}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Ringkasan hasil
                transaksi yang telah
                dibayar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

              {/* SALDO AWAL */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Saldo Awal
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {formatRupiah(
                    openingBalance
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Saldo awal shift
                </p>
              </div>

              {/* PENJUALAN */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Penjualan
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {formatRupiah(
                    totalSales
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {totalItemsSold}{" "}
                  barang terjual
                </p>
              </div>

              {/* MODAL */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Modal Penjualan
                </p>

                <p className="mt-2 text-2xl font-bold text-orange-600">
                  {formatRupiah(
                    totalCost
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Berdasarkan modal
                  aktual FEFO
                </p>
              </div>

              {/* PROFIT */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Profit
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    totalProfit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatRupiah(
                    totalProfit
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Penjualan − modal
                </p>
              </div>

              {/* SALDO KAS */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Saldo Kas
                </p>

                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {formatRupiah(
                    currentCashBalance
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Saldo awal +
                  penjualan
                </p>
              </div>

            </div>

            {/* =========================
                LEGACY COST WARNING
            ========================= */}

            {legacyCostRows > 0 && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">

                <p className="text-sm font-semibold text-yellow-800">
                  Perhatian Data Modal
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Terdapat{" "}
                  <strong>
                    {legacyCostRows}
                  </strong>{" "}
                  detail transaksi lama
                  yang belum memiliki
                  rekaman modal FEFO.
                  Modal transaksi tersebut
                  masih menggunakan
                  estimasi berdasarkan
                  data procurement.
                </p>

              </div>
            )}

          </section>

          {/* =========================
              TOP PRODUCTS
          ========================= */}

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* CHART */}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div>
                <h2 className="font-bold text-slate-800">
                  Produk Terlaris
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Berdasarkan jumlah
                  produk terjual pada{" "}
                  {formatDate(
                    selectedDate
                  )}
                  .
                </p>
              </div>

              {topProducts.length ===
              0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                  Belum ada
                  penjualan.
                </div>
              ) : (
                <div className="mt-5 h-72">
                  <Bar
                    data={
                      chartData
                    }
                    options={
                      chartOptions
                    }
                  />
                </div>
              )}

            </div>

            {/* TOP 5 */}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-bold text-slate-800">
                Top 5 Produk
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Peringkat berdasarkan
                jumlah barang terjual.
              </p>

              <div className="mt-4 space-y-3">

                {topProducts.length ===
                0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Belum ada data.
                  </p>
                ) : (
                  topProducts.map(
                    (
                      product,
                      index
                    ) => (
                      <div
                        key={
                          product.product_id
                        }
                        className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {
                                product.product_name
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {Number(
                                product.total_sold
                              ) ||
                                0}{" "}
                              terjual
                            </p>
                          </div>

                        </div>

                        <p className="shrink-0 text-xs font-semibold text-slate-600">
                          {formatRupiah(
                            product.total_revenue
                          )}
                        </p>

                      </div>
                    )
                  )
                )}

              </div>
            </div>

          </section>

          {/* =========================
              DAILY REPORT
          ========================= */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-5 py-4">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-bold text-slate-800">
                    Detail Laporan
                    Harian
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      reportItems.length
                    }{" "}
                    produk tercatat
                    pada laporan.
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {formatDate(
                    selectedDate
                  )}
                </div>

              </div>
            </div>

            {reportItems.length ===
            0 ? (
              <div className="py-16 text-center">

                <p className="font-medium text-slate-600">
                  Belum ada data
                  penjualan.
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Detail laporan akan
                  muncul setelah
                  terdapat transaksi
                  yang telah dibayar.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-slate-200">

                  <thead className="bg-slate-50">
                    <tr>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Produk
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Terjual
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Harga Modal
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Harga Jual
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total Modal
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Penjualan
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Profit
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {reportItems.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-800">
                              {
                                item.product_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.brand ||
                                "Tanpa merk"}
                            </p>

                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4 text-center text-sm font-semibold text-slate-800">
                            {
                              item.quantity_sold
                            }
                          </td>

                          {/* PURCHASE PRICE */}

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-600">
                            {formatRupiah(
                              item.purchase_price
                            )}
                          </td>

                          {/* SALE PRICE */}

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-600">
                            {formatRupiah(
                              item.sale_price
                            )}
                          </td>

                          {/* TOTAL COST */}

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-orange-600">
                            {formatRupiah(
                              item.total_purchase_cost
                            )}
                          </td>

                          {/* SALES */}

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-blue-600">
                            {formatRupiah(
                              item.total_sales
                            )}
                          </td>

                          {/* PROFIT */}

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                              Number(
                                item.profit
                              ) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatRupiah(
                              item.profit
                            )}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                  {/* =========================
                      TOTAL
                  ========================= */}

                  <tfoot className="bg-slate-50">

                    <tr>

                      <td
                        colSpan="4"
                        className="px-5 py-4 text-right text-sm font-bold text-slate-700"
                      >
                        Total
                      </td>

                      {/* TOTAL COST */}

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-orange-600">
                        {formatRupiah(
                          report?.total_cost ??
                            totalCost
                        )}
                      </td>

                      {/* TOTAL SALES */}

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-blue-600">
                        {formatRupiah(
                          report?.total_sales
                        )}
                      </td>

                      {/* TOTAL PROFIT */}

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                          Number(
                            report?.total_profit
                          ) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatRupiah(
                          report?.total_profit
                        )}
                      </td>

                    </tr>

                  </tfoot>

                </table>

              </div>
            )}

          </section>

          {/* =========================
              REPORT INFORMATION
          ========================= */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="text-sm font-semibold text-blue-800">
              Informasi Laporan
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Laporan harian dibuat
              otomatis oleh sistem.
              Tombol{" "}
              <strong>
                Refresh Laporan
              </strong>{" "}
              dapat digunakan untuk
              menghitung ulang laporan
              pada tanggal yang dipilih.
              Modal penjualan untuk
              transaksi baru dihitung
              berdasarkan batch FEFO
              yang benar-benar keluar
              saat pembayaran.
            </p>

          </div>

        </>
      )}

    </div>
  );
};

export default Finance;