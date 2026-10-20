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

function SellerProductApproval() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    status,
    setStatus,
  ] = useState(
    "pending"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // =========================
  // FETCH
  // =========================

  const fetchProducts =
    async (
      selectedStatus =
        status
    ) => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/seller/admin/product-submissions?status=${selectedStatus}`
          );

        setProducts(
          response.data.data ||
          []
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal mengambil pengajuan produk."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProducts(
      status
    );
  }, [status]);

  // =========================
  // APPROVE
  // =========================

  const approveProduct =
    async (product) => {
      const confirmed =
        window.confirm(
          `Setujui produk "${product.name}" dari ${product.seller_name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/seller/admin/product-submissions/${product.id}/approve`
          );

        setMessage(
          response.data
            .message
        );

        await fetchProducts(
          status
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal menyetujui produk."
        );
      }
    };

  // =========================
  // REJECT
  // =========================

  const rejectProduct =
    async (product) => {
      const reason =
        window.prompt(
          `Masukkan alasan penolakan untuk "${product.name}":`
        );

      if (
        reason === null
      ) {
        return;
      }

      if (
        !reason.trim()
      ) {
        setError(
          "Alasan penolakan wajib diisi."
        );

        return;
      }

      try {
        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/seller/admin/product-submissions/${product.id}/reject`,
            {
              reason:
                reason.trim(),
            }
          );

        setMessage(
          response.data
            .message
        );

        await fetchProducts(
          status
        );
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal menolak produk."
        );
      }
    };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Pengajuan Produk Mitra
        </h1>

        <p className="text-gray-500 mt-1">
          Review produk yang
          diajukan oleh Mitra
          Penjual.
        </p>
      </div>

      {message && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* FILTER */}

      <div className="mb-5 flex gap-2 flex-wrap">
        <StatusButton
          label="Menunggu"
          value="pending"
          active={
            status ===
            "pending"
          }
          onClick={() =>
            setStatus(
              "pending"
            )
          }
        />

        <StatusButton
          label="Disetujui"
          value="approved"
          active={
            status ===
            "approved"
          }
          onClick={() =>
            setStatus(
              "approved"
            )
          }
        />

        <StatusButton
          label="Ditolak"
          value="rejected"
          active={
            status ===
            "rejected"
          }
          onClick={() =>
            setStatus(
              "rejected"
            )
          }
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            Memuat data...
          </div>
        ) : products.length ===
          0 ? (
          <div className="p-6 text-gray-500">
            Tidak ada produk
            pada status ini.
          </div>
        ) : (
          <div className="divide-y">
            {products.map(
              (product) => (
                <div
                  key={
                    product.id
                  }
                  className="p-6"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
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
                        <h3 className="font-semibold text-lg">
                          {
                            product.name
                          }
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Mitra:{" "}
                          <strong>
                            {
                              product.seller_name
                            }
                          </strong>
                        </p>

                        <p className="text-sm text-gray-500">
                          {
                            product.seller_email
                          }
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          {
                            product.category_name
                          }
                          {" • "}
                          {
                            product.subcategory_name
                          }
                        </p>

                        <p className="font-semibold mt-2">
                          {formatRupiah(
                            product.sale_price
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          Stok:{" "}
                          {
                            product.stock_qty
                          }
                        </p>

                        {product.description && (
                          <p className="text-sm text-gray-600 mt-3 max-w-2xl">
                            {
                              product.description
                            }
                          </p>
                        )}

                        {product.rejection_reason && (
                          <p className="text-sm text-red-600 mt-3">
                            <strong>
                              Alasan penolakan:
                            </strong>{" "}
                            {
                              product.rejection_reason
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {status ===
                      "pending" && (
                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() =>
                            rejectProduct(
                              product
                            )
                          }
                          className="px-5 py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50"
                        >
                          Tolak
                        </button>

                        <button
                          onClick={() =>
                            approveProduct(
                              product
                            )
                          }
                          className="px-5 py-3 bg-gray-900 text-white rounded-lg font-medium"
                        >
                          Setujui
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`px-4 py-2 rounded-lg text-sm font-medium ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white border text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

export default SellerProductApproval;