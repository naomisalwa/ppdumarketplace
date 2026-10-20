import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

function SellerDashboard() {
  const [data, setData] =
    useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // =========================
  // FETCH DASHBOARD
  // =========================

  const fetchDashboard =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/seller/dashboard"
          );

        setData(
          response.data
            .data || null
        );
      } catch (error) {
        console.error(
          "Seller Dashboard Error:",
          error
        );

        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal mengambil dashboard Mitra Penjual."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        Memuat dashboard...
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
        {error}
      </div>
    );
  }

  const productSummary =
    data?.product_summary ||
    {};

  const orderSummary =
    data?.order_summary ||
    {};

  const recentProducts =
    data?.recent_products ||
    [];

  const cards = [
    {
      title:
        "Produk Aktif",
      value:
        productSummary
          .approved_products ||
        0,
    },

    {
      title:
        "Menunggu Review",
      value:
        productSummary
          .pending_products ||
        0,
    },

    {
      title:
        "Produk Ditolak",
      value:
        productSummary
          .rejected_products ||
        0,
    },

    {
      title:
        "Pesanan Baru",
      value:
        orderSummary
          .new_orders ||
        0,
    },

    {
      title:
        "Sedang Diproses",
      value:
        orderSummary
          .processing_orders ||
        0,
    },

    {
      title:
        "Pesanan Selesai",
      value:
        orderSummary
          .completed_orders ||
        0,
    },
  ];

  return (
    <div>
      {/* HEADER */}

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Mitra Penjual
        </h1>

        <p className="text-gray-500 mt-1">
          Pantau produk dan
          pesanan Anda.
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {cards.map(
          (card) => (
            <div
              key={
                card.title
              }
              className="bg-white border rounded-xl p-5"
            >
              <p className="text-sm text-gray-500">
                {
                  card.title
                }
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {
                  card.value
                }
              </p>
            </div>
          )
        )}
      </div>

      {/* RECENT PRODUCTS */}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Produk Terbaru
          </h2>
        </div>

        {recentProducts.length ===
        0 ? (
          <div className="p-6 text-gray-500">
            Belum ada produk
            yang diajukan.
          </div>
        ) : (
          <div className="divide-y">
            {recentProducts.map(
              (product) => (
                <div
                  key={
                    product.id
                  }
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {
                          product.name
                        }
                      </p>

                      <p className="text-sm text-gray-500">
                        {
                          product.category_name
                        }
                        {" • "}
                        {
                          product.subcategory_name
                        }
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={
                      product.approval_status
                    }
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================
// STATUS BADGE
// =========================

function StatusBadge({
  status,
}) {
  const labels = {
    pending:
      "Menunggu Persetujuan",

    approved:
      "Disetujui",

    rejected:
      "Ditolak",
  };

  const styles = {
    pending:
      "bg-yellow-100 text-yellow-700",

    approved:
      "bg-green-100 text-green-700",

    rejected:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ||
        status}
    </span>
  );
}

export default SellerDashboard;