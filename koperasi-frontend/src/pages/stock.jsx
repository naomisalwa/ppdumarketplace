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
  ).format(Number(value) || 0);
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
    }
  ).format(new Date(value));
};

const getReasonLabel = (reason) => {
  switch (reason) {
    case "expired":
      return "Kedaluwarsa";

    case "damaged":
      return "Rusak";

    case "correction":
      return "Koreksi";

    default:
      return reason || "-";
  }
};

// =====================================================
// COMPONENT
// =====================================================

function Stock() {
  // ===================================================
  // USER
  // ===================================================

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

  const role =
    user?.role || "";

  const isSuperAdmin =
    role === "super_admin";

  // ===================================================
  // STATE
  // ===================================================

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    expiredProducts,
    setExpiredProducts,
  ] = useState([]);

  const [
    adjustmentHistory,
    setAdjustmentHistory,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    stockFilter,
    setStockFilter,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingExpired,
    setLoadingExpired,
  ] = useState(false);

  const [
    loadingAdjustment,
    setLoadingAdjustment,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("success");

  // ===================================================
  // EXPIRED MODAL
  // ===================================================

  const [
    selectedExpiredProduct,
    setSelectedExpiredProduct,
  ] = useState(null);

  const [
    expiredQuantity,
    setExpiredQuantity,
  ] = useState("");

  const [
    expiredNote,
    setExpiredNote,
  ] = useState("");

  // ===================================================
  // MANUAL ADJUSTMENT
  // ===================================================

  const [
    adjustmentForm,
    setAdjustmentForm,
  ] = useState({
    product_id: "",
    quantity: "",
    reason: "damaged",
    note: "",
  });

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            "/products"
          );

        const allProducts =
          response.data.data ||
          [];

        // ===============================================
        // MENU STOK HANYA UNTUK PRODUK KOPERASI
        //
        // Produk Mitra memiliki stok milik Mitra
        // dan tidak boleh di-adjust oleh sistem stok
        // koperasi.
        // ===============================================

        const cooperativeProducts =
          allProducts.filter(
            (product) =>
              !product.owner_type ||
              product.owner_type ===
                "koperasi"
          );

        setProducts(
          cooperativeProducts
        );
      } catch (error) {
        console.error(
          "Fetch Stock Products Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengambil data stok."
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // FETCH EXPIRED / EXPIRY ALERTS
  // ===================================================

  const fetchExpiredProducts =
    async () => {
      if (!isSuperAdmin) {
        return;
      }

      try {
        setLoadingExpired(
          true
        );

        const response =
          await api.get(
            "/products/expired-alerts"
          );

        setExpiredProducts(
          response.data.data ||
            []
        );
      } catch (error) {
        console.error(
          "Fetch Expired Products Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengambil peringatan kedaluwarsa."
        );
      } finally {
        setLoadingExpired(
          false
        );
      }
    };

  // ===================================================
  // FETCH ADJUSTMENT HISTORY
  // ===================================================

  const fetchAdjustmentHistory =
    async () => {
      if (!isSuperAdmin) {
        return;
      }

      try {
        setLoadingAdjustment(
          true
        );

        const response =
          await api.get(
            "/stock/adjustments"
          );

        setAdjustmentHistory(
          response.data.data ||
            []
        );
      } catch (error) {
        console.error(
          "Fetch Adjustment History Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengambil riwayat adjustment stok."
        );
      } finally {
        setLoadingAdjustment(
          false
        );
      }
    };

  // ===================================================
  // FETCH ALL
  // ===================================================

  const fetchAllData =
    async () => {
      setMessage("");

      await fetchProducts();

      if (isSuperAdmin) {
        await Promise.all([
          fetchExpiredProducts(),
          fetchAdjustmentHistory(),
        ]);
      }
    };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchAllData();
  }, [role]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {
      let totalStock = 0;
      let emptyStock = 0;
      let lowStock = 0;

      products.forEach(
        (product) => {
          const stock =
            Number(
              product.stock_qty
            ) || 0;

          totalStock += stock;

          if (stock === 0) {
            emptyStock += 1;
          } else if (
            stock <= 5
          ) {
            lowStock += 1;
          }
        }
      );

      return {
        totalProducts:
          products.length,

        totalStock,

        emptyStock,

        lowStock,
      };
    }, [products]);

  // ===================================================
  // EXPIRED SUMMARY
  // ===================================================

  const expiredSummary =
    useMemo(() => {
      const expired =
        expiredProducts.filter(
          (item) =>
            Number(
              item.days_remaining
            ) < 0
        );

      const nearExpiry =
        expiredProducts.filter(
          (item) => {
            const days =
              Number(
                item.days_remaining
              );

            return (
              days >= 0 &&
              days <= 30
            );
          }
        );

      const expiredQty =
        expired.reduce(
          (total, item) =>
            total +
            Number(
              item.remaining_qty ||
                0
            ),
          0
        );

      return {
        expiredCount:
          expired.length,

        expiredQty,

        nearExpiryCount:
          nearExpiry.length,
      };
    }, [expiredProducts]);

  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const stock =
            Number(
              product.stock_qty
            ) || 0;

          const matchesSearch =
            !keyword ||
            String(
              product.name ||
                ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              product.brand ||
                ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              product.category_name ||
                ""
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              product.subcategory_name ||
                ""
            )
              .toLowerCase()
              .includes(keyword);

          let matchesStock =
            true;

          if (
            stockFilter ===
            "available"
          ) {
            matchesStock =
              stock > 0;
          }

          if (
            stockFilter ===
            "low"
          ) {
            matchesStock =
              stock > 0 &&
              stock <= 5;
          }

          if (
            stockFilter ===
            "empty"
          ) {
            matchesStock =
              stock === 0;
          }

          return (
            matchesSearch &&
            matchesStock
          );
        }
      );
    }, [
      products,
      search,
      stockFilter,
    ]);

  // ===================================================
  // STOCK STATUS
  // ===================================================

  const getStockStatus = (
    stockValue
  ) => {
    const stock =
      Number(stockValue) ||
      0;

    if (stock === 0) {
      return {
        label:
          "Habis",

        className:
          "bg-red-50 text-red-700",
      };
    }

    if (stock <= 5) {
      return {
        label:
          "Stok Rendah",

        className:
          "bg-yellow-50 text-yellow-700",
      };
    }

    return {
      label:
        "Tersedia",

      className:
        "bg-green-50 text-green-700",
    };
  };

  // ===================================================
  // EXPIRY STATUS
  // ===================================================

  const getExpiryStatus = (
    daysRemaining
  ) => {
    const days =
      Number(
        daysRemaining
      );

    if (days < 0) {
      return {
        label:
          "Kedaluwarsa",

        className:
          "bg-red-50 text-red-700",
      };
    }

    if (days === 0) {
      return {
        label:
          "Kedaluwarsa Hari Ini",

        className:
          "bg-red-50 text-red-700",
      };
    }

    if (days <= 30) {
      return {
        label:
          `${days} hari lagi`,

        className:
          "bg-yellow-50 text-yellow-700",
      };
    }

    return {
      label:
        `${days} hari lagi`,

      className:
        "bg-green-50 text-green-700",
    };
  };

  // ===================================================
  // OPEN EXPIRED MODAL
  // ===================================================

  const openExpiredAdjustment =
    (item) => {
      setSelectedExpiredProduct(
        item
      );

      setExpiredQuantity(
        String(
          Number(
            item.remaining_qty
          ) || 0
        )
      );

      setExpiredNote(
        "Barang kedaluwarsa dikeluarkan dari stok."
      );
    };

  // ===================================================
  // CLOSE EXPIRED MODAL
  // ===================================================

  const closeExpiredAdjustment =
    () => {
      setSelectedExpiredProduct(
        null
      );

      setExpiredQuantity(
        ""
      );

      setExpiredNote(
        ""
      );
    };

  // ===================================================
  // REMOVE EXPIRED
  // ===================================================

  const handleRemoveExpired =
    async (event) => {
      event.preventDefault();

      if (
        !selectedExpiredProduct
      ) {
        return;
      }

      const quantity =
        Number(
          expiredQuantity
        );

      const maxExpired =
        Number(
          selectedExpiredProduct
            .remaining_qty
        ) || 0;

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Jumlah barang kedaluwarsa tidak valid."
        );

        return;
      }

      if (
        quantity >
        maxExpired
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          `Jumlah maksimal yang dapat dikeluarkan adalah ${maxExpired}.`
        );

        return;
      }

      if (
        Number(
          selectedExpiredProduct
            .days_remaining
        ) >= 0
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Batch ini belum kedaluwarsa dan tidak dapat dikeluarkan dengan alasan kedaluwarsa."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setMessage("");

        const response =
          await api.post(
            "/stock/adjustments",
            {
              product_id:
                selectedExpiredProduct
                  .product_id,

              quantity,

              reason:
                "expired",

              note:
                expiredNote,
            }
          );

        setMessageType(
          "success"
        );

        setMessage(
          response.data.message ||
            "Barang kedaluwarsa berhasil dikeluarkan dari stok."
        );

        closeExpiredAdjustment();

        await fetchAllData();
      } catch (error) {
        console.error(
          "Remove Expired Stock Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal mengeluarkan barang kedaluwarsa dari stok."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // ===================================================
  // MANUAL ADJUSTMENT
  // ===================================================

  const handleManualAdjustment =
    async (event) => {
      event.preventDefault();

      const quantity =
        Number(
          adjustmentForm
            .quantity
        );

      if (
        !adjustmentForm
          .product_id
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Pilih produk terlebih dahulu."
        );

        return;
      }

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Jumlah adjustment tidak valid."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setMessage("");

        const response =
          await api.post(
            "/stock/adjustments",
            {
              product_id:
                Number(
                  adjustmentForm
                    .product_id
                ),

              quantity,

              reason:
                adjustmentForm
                  .reason,

              note:
                adjustmentForm
                  .note,
            }
          );

        setMessageType(
          "success"
        );

        setMessage(
          response.data.message ||
            "Adjustment stok berhasil."
        );

        setAdjustmentForm({
          product_id: "",
          quantity: "",
          reason:
            "damaged",
          note: "",
        });

        await fetchAllData();
      } catch (error) {
        console.error(
          "Manual Adjustment Error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.response?.data
            ?.message ||
            "Gagal melakukan adjustment stok."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // ===================================================
  // USER FALLBACK
  // ===================================================

  if (!user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Data pengguna tidak
        ditemukan. Silakan
        logout kemudian login
        kembali.
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Stok Barang
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pantau stok produk
            milik koperasi.
          </p>
        </div>

        <button
          type="button"
          onClick={
            fetchAllData
          }
          disabled={
            loading ||
            loadingExpired ||
            loadingAdjustment
          }
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading
            ? "Memuat..."
            : "Refresh Data"}
        </button>

      </div>

      {/* =================================================
          MESSAGE
      ================================================== */}

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

      {/* =================================================
          SUMMARY
      ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Jenis Produk"
          value={
            summary.totalProducts
          }
        />

        <SummaryCard
          title="Total Stok"
          value={
            summary.totalStock
          }
          valueClassName="text-blue-600"
        />

        <SummaryCard
          title="Stok Rendah"
          value={
            summary.lowStock
          }
          subtitle="1–5 barang"
          valueClassName="text-yellow-600"
        />

        <SummaryCard
          title="Stok Habis"
          value={
            summary.emptyStock
          }
          valueClassName="text-red-600"
        />

      </div>

      {/* =================================================
          EXPIRED ALERT
          SUPER ADMIN ONLY
      ================================================== */}

      {isSuperAdmin && (
        <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">

          <div className="border-b border-red-100 bg-red-50 px-5 py-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-red-700">
                  Peringatan Kedaluwarsa
                </h2>

                <p className="mt-1 text-sm text-red-600">
                  Monitoring batch
                  procurement yang
                  masih memiliki stok.
                </p>
              </div>

              <div className="text-sm text-red-700">
                <strong>
                  {
                    expiredSummary.expiredQty
                  }
                </strong>{" "}
                barang telah
                kedaluwarsa
              </div>

            </div>
          </div>

          {/* MINI SUMMARY */}

          <div className="grid gap-3 border-b p-4 sm:grid-cols-2">

            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs text-red-600">
                Batch Kedaluwarsa
              </p>

              <p className="mt-1 text-xl font-bold text-red-700">
                {
                  expiredSummary.expiredCount
                }
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-yellow-700">
                Kedaluwarsa ≤ 30 Hari
              </p>

              <p className="mt-1 text-xl font-bold text-yellow-700">
                {
                  expiredSummary.nearExpiryCount
                }
              </p>
            </div>

          </div>

          {loadingExpired ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Memuat data
              kedaluwarsa...
            </div>
          ) : expiredProducts.length ===
            0 ? (
            <div className="py-12 text-center">

              <p className="font-medium text-green-600">
                Tidak ada batch
                kedaluwarsa.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Belum ada batch
                aktif dengan tanggal
                kedaluwarsa.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Produk
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Sisa Batch
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Tanggal Expired
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {expiredProducts.map(
                    (item) => {
                      const expiryStatus =
                        getExpiryStatus(
                          item.days_remaining
                        );

                      const alreadyExpired =
                        Number(
                          item.days_remaining
                        ) < 0;

                      return (
                        <tr
                          key={
                            item.procurement_id
                          }
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-800">
                              {
                                item.product_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                item.brand ||
                                "Tanpa merk"
                              }
                            </p>

                          </td>

                          <td className="px-5 py-4 text-center font-bold text-slate-800">
                            {Number(
                              item.remaining_qty
                            ) || 0}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              item.expired_date
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiryStatus.className}`}
                            >
                              {
                                expiryStatus.label
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-center">

                            {alreadyExpired ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openExpiredAdjustment(
                                    item
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                Keluarkan
                                dari Stok
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Belum expired
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
      )}

      {/* =================================================
          MANUAL ADJUSTMENT
      ================================================== */}

      {isSuperAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <h2 className="font-bold text-slate-800">
              Adjustment Stok Manual
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Digunakan untuk
              mengurangi stok barang
              rusak atau koreksi stok.
            </p>
          </div>

          <form
            onSubmit={
              handleManualAdjustment
            }
            className="mt-5 grid gap-4 md:grid-cols-2"
          >

            {/* PRODUCT */}

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Produk
              </label>

              <select
                required
                value={
                  adjustmentForm.product_id
                }
                onChange={(
                  event
                ) =>
                  setAdjustmentForm(
                    (current) => ({
                      ...current,

                      product_id:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
              >

                <option value="">
                  Pilih produk
                </option>

                {products
                  .filter(
                    (product) =>
                      Number(
                        product.stock_qty
                      ) > 0
                  )
                  .map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {
                          product.name
                        }{" "}
                        — Stok{" "}
                        {
                          product.stock_qty
                        }
                      </option>
                    )
                  )}

              </select>
            </div>

            {/* QUANTITY */}

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Jumlah
              </label>

              <input
                type="number"
                min="1"
                required
                value={
                  adjustmentForm.quantity
                }
                onChange={(
                  event
                ) =>
                  setAdjustmentForm(
                    (current) => ({
                      ...current,

                      quantity:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />

            </div>

            {/* REASON */}

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Alasan
              </label>

              <select
                value={
                  adjustmentForm.reason
                }
                onChange={(
                  event
                ) =>
                  setAdjustmentForm(
                    (current) => ({
                      ...current,

                      reason:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
              >

                <option value="damaged">
                  Barang Rusak
                </option>

                <option value="correction">
                  Koreksi Stok
                </option>

              </select>
            </div>

            {/* NOTE */}

            <div>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Catatan
              </label>

              <input
                type="text"
                value={
                  adjustmentForm.note
                }
                onChange={(
                  event
                ) =>
                  setAdjustmentForm(
                    (current) => ({
                      ...current,

                      note:
                        event.target.value,
                    })
                  )
                }
                placeholder="Contoh: kemasan rusak"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />

            </div>

            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-300"
              >
                {submitting
                  ? "Memproses..."
                  : "Kurangi Stok"}
              </button>

            </div>

          </form>
        </section>
      )}

      {/* =================================================
          FILTER
      ================================================== */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">

          <div>

            <label
              htmlFor="stock-search"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Cari Produk
            </label>

            <input
              id="stock-search"
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Nama, merek, kategori..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          <div>

            <label
              htmlFor="stock-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Status Stok
            </label>

            <select
              id="stock-filter"
              value={
                stockFilter
              }
              onChange={(
                event
              ) =>
                setStockFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
            >

              <option value="all">
                Semua
              </option>

              <option value="available">
                Tersedia
              </option>

              <option value="low">
                Stok Rendah
              </option>

              <option value="empty">
                Habis
              </option>

            </select>

          </div>

        </div>
      </section>

      {/* =================================================
          STOCK TABLE
      ================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">

          <h2 className="font-bold text-slate-800">
            Daftar Stok
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {
              filteredProducts.length
            }{" "}
            produk koperasi
            ditampilkan
          </p>

        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Memuat data stok...
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="py-16 text-center">

            <p className="font-medium text-slate-600">
              Produk tidak
              ditemukan.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Coba ubah
              pencarian atau
              filter stok.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-slate-200">

              <thead className="bg-slate-50">
                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Produk
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Kategori
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Harga Jual
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Stok
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredProducts.map(
                  (product) => {
                    const stockStatus =
                      getStockStatus(
                        product.stock_qty
                      );

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-800">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              product.brand ||
                              "Tanpa merek"
                            }
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-sm text-slate-700">
                            {
                              product.category_name ||
                              "-"
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              product.subcategory_name ||
                              "-"
                            }
                          </p>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-700">
                          {formatRupiah(
                            product.sale_price
                          )}
                        </td>

                        <td className="px-5 py-4 text-center text-lg font-bold text-slate-800">
                          {Number(
                            product.stock_qty
                          ) || 0}
                        </td>

                        <td className="px-5 py-4 text-center">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                          >
                            {
                              stockStatus.label
                            }
                          </span>

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

      {/* =================================================
          ADJUSTMENT HISTORY
      ================================================== */}

      {isSuperAdmin && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <h2 className="font-bold text-slate-800">
              Riwayat Adjustment
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Riwayat barang
              kedaluwarsa, rusak,
              dan koreksi stok.
            </p>

          </div>

          {loadingAdjustment ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Memuat riwayat...
            </div>
          ) : adjustmentHistory.length ===
            0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Belum ada adjustment
              stok.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Produk
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Jumlah
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Alasan
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Catatan
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Oleh
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {adjustmentHistory.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-800">
                            {
                              item.product_name ||
                              "-"
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {
                              item.brand ||
                              "Tanpa merek"
                            }
                          </p>

                        </td>

                        <td className="px-5 py-4 text-center font-bold text-red-600">
                          -
                          {Number(
                            item.quantity
                          ) || 0}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {getReasonLabel(
                            item.reason ||
                              item.adjustment_reason
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {
                            item.note ||
                            "-"
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {
                            item.created_by_name ||
                            "-"
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>

            </div>
          )}

        </section>
      )}

      {/* =================================================
          EXPIRED MODAL
      ================================================== */}

      {selectedExpiredProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 p-5">

              <h2 className="text-lg font-bold text-slate-800">
                Keluarkan Barang
                Kedaluwarsa
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  selectedExpiredProduct.product_name
                }
              </p>

            </div>

            <form
              onSubmit={
                handleRemoveExpired
              }
              className="space-y-4 p-5"
            >

              <div className="rounded-lg bg-red-50 p-4">

                <div className="flex justify-between text-sm">

                  <span className="text-red-600">
                    Stok Batch
                  </span>

                  <span className="font-bold text-red-700">
                    {Number(
                      selectedExpiredProduct.remaining_qty
                    ) || 0}
                  </span>

                </div>

                <div className="mt-2 flex justify-between text-sm">

                  <span className="text-slate-500">
                    Tanggal Expired
                  </span>

                  <span className="font-semibold text-slate-700">
                    {formatDate(
                      selectedExpiredProduct.expired_date
                    )}
                  </span>

                </div>

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jumlah yang
                  Dikeluarkan
                </label>

                <input
                  type="number"
                  required
                  min="1"
                  max={
                    Number(
                      selectedExpiredProduct.remaining_qty
                    ) || 0
                  }
                  value={
                    expiredQuantity
                  }
                  onChange={(
                    event
                  ) =>
                    setExpiredQuantity(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-red-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Catatan
                </label>

                <textarea
                  rows="3"
                  value={
                    expiredNote
                  }
                  onChange={(
                    event
                  ) =>
                    setExpiredNote(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-red-500"
                />

              </div>

              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                >
                  {submitting
                    ? "Memproses..."
                    : "Keluarkan dari Stok"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeExpiredAdjustment
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  subtitle,
  valueClassName =
    "text-slate-800",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClassName}`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}

    </div>
  );
}

export default Stock;