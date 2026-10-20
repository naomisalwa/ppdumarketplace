import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const formatRupiah = (
  value
) =>
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );

const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleString(
    "id-ID"
  );
};

function SellerOrders() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  // =========================
  // FETCH ORDERS
  // =========================

  const fetchOrders =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            "/seller/orders"
          );

        setOrders(
          response.data.data ||
          []
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal mengambil daftar pesanan."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================
  // DETAIL
  // =========================

  const openOrder =
    async (orderId) => {
      try {
        setDetailLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/seller/orders/${orderId}`
          );

        setSelectedOrder(
          response.data.data
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal mengambil detail pesanan."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // =========================
  // UPDATE STATUS
  // =========================

  const updateStatus =
    async (
      orderId,
      status
    ) => {
      try {
        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/seller/orders/${orderId}/status`,
            {
              status,
            }
          );

        setMessage(
          response.data
            .message
        );

        await fetchOrders();

        await openOrder(
          orderId
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal memperbarui status."
        );
      }
    };

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6">
        Memuat pesanan...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Daftar Pesanan
        </h1>

        <p className="text-gray-500 mt-1">
          Kelola pesanan
          produk yang Anda
          jual.
        </p>
      </div>

      {message && (
        <div className="mb-5 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-6">

        {/* ORDER LIST */}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-semibold">
              Pesanan Masuk
            </h2>
          </div>

          {orders.length ===
          0 ? (
            <div className="p-6 text-gray-500">
              Belum ada pesanan.
            </div>
          ) : (
            <div className="divide-y">
              {orders.map(
                (order) => (
                  <button
                    key={
                      order.id
                    }
                    onClick={() =>
                      openOrder(
                        order.id
                      )
                    }
                    className="w-full text-left p-5 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          Pesanan #
                          {
                            order.id
                          }
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Pembeli:{" "}
                          {
                            order.buyer_name
                          }
                        </p>

                        <p className="text-sm text-gray-500">
                          {
                            order.total_items
                          }{" "}
                          item
                        </p>

                        <p className="font-semibold mt-2">
                          {formatRupiah(
                            order.total_amount
                          )}
                        </p>
                      </div>

                      <OrderStatus
                        status={
                          order.status
                        }
                      />
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* DETAIL */}

        <div className="bg-white border rounded-xl">
          <div className="p-5 border-b">
            <h2 className="font-semibold">
              Detail Pesanan
            </h2>
          </div>

          {detailLoading ? (
            <div className="p-6">
              Memuat detail...
            </div>
          ) : !selectedOrder ? (
            <div className="p-6 text-gray-500">
              Pilih pesanan
              untuk melihat
              detail.
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-5">
                <p className="text-sm text-gray-500">
                  Pembeli
                </p>

                <p className="font-semibold">
                  {
                    selectedOrder.buyer_name
                  }
                </p>

                <p className="text-sm text-gray-500">
                  {
                    selectedOrder.buyer_email
                  }
                </p>
              </div>

              <div className="mb-5">
                <p className="text-sm text-gray-500">
                  Tanggal Pesanan
                </p>

                <p>
                  {formatDate(
                    selectedOrder.created_at
                  )}
                </p>
              </div>

              <div className="mb-6">
                <OrderStatus
                  status={
                    selectedOrder.status
                  }
                />
              </div>

              <div className="border rounded-lg divide-y mb-6">
                {selectedOrder.items?.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="p-4 flex justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">
                          {
                            item.product_name
                          }
                        </p>

                        <p className="text-sm text-gray-500">
                          {
                            item.quantity
                          }{" "}
                          ×{" "}
                          {formatRupiah(
                            item.unit_price
                          )}
                        </p>
                      </div>

                      <p className="font-semibold">
                        {formatRupiah(
                          item.subtotal
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>

              <OrderAction
                order={
                  selectedOrder
                }
                onUpdate={
                  updateStatus
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderAction({
  order,
  onUpdate,
}) {
  if (
    order.status === "new"
  ) {
    return (
      <button
        onClick={() =>
          onUpdate(
            order.id,
            "processing"
          )
        }
        className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium"
      >
        Proses Pesanan
      </button>
    );
  }

  if (
    order.status ===
    "processing"
  ) {
    return (
      <button
        onClick={() =>
          onUpdate(
            order.id,
            "shipped"
          )
        }
        className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium"
      >
        Tandai Sudah Dikirim
      </button>
    );
  }

  if (
    order.status ===
    "shipped"
  ) {
    return (
      <button
        onClick={() =>
          onUpdate(
            order.id,
            "completed"
          )
        }
        className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium"
      >
        Tandai Selesai
      </button>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-green-50 text-green-700 text-center font-medium">
      Pesanan selesai.
    </div>
  );
}

function OrderStatus({
  status,
}) {
  const labels = {
    new:
      "Pesanan Baru",

    processing:
      "Sedang Diproses",

    shipped:
      "Sudah Dikirim",

    completed:
      "Selesai",
  };

  const styles = {
    new:
      "bg-blue-100 text-blue-700",

    processing:
      "bg-yellow-100 text-yellow-700",

    shipped:
      "bg-purple-100 text-purple-700",

    completed:
      "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ||
        status}
    </span>
  );
}

export default SellerOrders;