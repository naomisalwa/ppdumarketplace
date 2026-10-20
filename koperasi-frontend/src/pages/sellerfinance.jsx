import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

// =========================================
// HELPERS
// =========================================

const formatRupiah = (value) => {
  const number =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }
  ).format(number);
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
};

const getOrderStatusLabel = (
  status
) => {
  const labels = {
    new: "Pesanan Baru",
    processing: "Diproses",
    shipped: "Dikirim",
    completed: "Selesai",
  };

  return (
    labels[status] ||
    status ||
    "-"
  );
};

// =========================================
// SUMMARY CARD
// =========================================

function SummaryCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =========================================
// SELLER FINANCE
// =========================================

function SellerFinance() {
  const [summary, setSummary] =
    useState({
      total_orders: 0,
      total_items_sold: 0,
      total_revenue: 0,
      today_revenue: 0,
      month_revenue: 0,
    });

  const [products, setProducts] =
    useState([]);

  const [sales, setSales] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =======================================
  // FETCH DATA
  // =======================================

  const fetchFinance = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryResponse,
        salesResponse,
      ] = await Promise.all([
        api.get(
          "/seller/finance/summary"
        ),
        api.get(
          "/seller/finance/sales"
        ),
      ]);

      const summaryData =
        summaryResponse.data?.data;

      const salesData =
        salesResponse.data?.data;

      setSummary(
        summaryData?.summary || {
          total_orders: 0,
          total_items_sold: 0,
          total_revenue: 0,
          today_revenue: 0,
          month_revenue: 0,
        }
      );

      setProducts(
        Array.isArray(
          summaryData?.products
        )
          ? summaryData.products
          : []
      );

      setSales(
        Array.isArray(salesData)
          ? salesData
          : []
      );
    } catch (err) {
      console.error(
        "Seller Finance Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data keuangan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  // =======================================
  // LOADING
  // =======================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            Memuat data keuangan...
          </p>
        </div>
      </div>
    );
  }

  // =======================================
  // PAGE
  // =======================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Keuangan Saya
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Ringkasan pendapatan dari
            produk yang Anda jual di
            Koperasi Assadiyah.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFinance}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Perbarui Data
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Pendapatan"
          value={formatRupiah(
            summary.total_revenue
          )}
          description="Seluruh penjualan yang sudah dibayar"
          icon="💰"
        />

        <SummaryCard
          title="Pendapatan Hari Ini"
          value={formatRupiah(
            summary.today_revenue
          )}
          description="Pendapatan hari ini"
          icon="📅"
        />

        <SummaryCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(
            summary.month_revenue
          )}
          description="Pendapatan bulan berjalan"
          icon="📈"
        />

        <SummaryCard
          title="Produk Terjual"
          value={
            Number(
              summary.total_items_sold
            ) || 0
          }
          description="Total unit produk terjual"
          icon="📦"
        />

        <SummaryCard
          title="Total Pesanan"
          value={
            Number(
              summary.total_orders
            ) || 0
          }
          description="Pesanan yang telah dibayar"
          icon="🧾"
        />
      </div>

      {/* PRODUCT REVENUE */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            Pendapatan per Produk
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Rekap penjualan untuk setiap
            produk milik Anda.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 font-medium text-gray-700">
              Belum ada penjualan
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Data akan muncul setelah
              produk Anda berhasil terjual
              dan pembayaran selesai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Produk
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Terjual
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pendapatan
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {products.map(
                  (product) => (
                    <tr
                      key={
                        product.product_id
                      }
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {
                            product.product_name
                          }
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {product.brand ||
                            "Tanpa merek"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                        {Number(
                          product.total_sold
                        ) || 0}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        {formatRupiah(
                          product.total_revenue
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SALES HISTORY */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            Riwayat Pendapatan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Rincian penjualan produk Anda
            yang sudah dibayar pembeli.
          </p>
        </div>

        {sales.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl">
              🧾
            </div>

            <p className="mt-3 font-medium text-gray-700">
              Belum ada riwayat pendapatan
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Transaksi yang telah dibayar
              akan ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Tanggal
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Transaksi
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pembeli
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Produk
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Qty
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Harga
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pendapatan
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {sales.map(
                  (sale, index) => (
                    <tr
                      key={`${sale.seller_order_id}-${sale.product_id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDate(
                          sale.paid_at
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        #
                        {
                          sale.transaction_id
                        }
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {sale.buyer_name ||
                          "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {
                            sale.product_name
                          }
                        </div>

                        <div className="text-xs text-gray-500">
                          {sale.brand ||
                            "Tanpa merek"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        {sale.quantity}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                        {formatRupiah(
                          sale.unit_price
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                        {formatRupiah(
                          sale.subtotal
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {getOrderStatusLabel(
                            sale.order_status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INFORMATION */}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-900">
          Informasi Keuangan
        </h3>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Halaman ini hanya menampilkan
          pendapatan dari produk milik Anda.
          Data keuangan koperasi dan Mitra
          Penjual lainnya tidak dapat
          diakses.
        </p>
      </div>

    </div>
  );
}

export default SellerFinance;