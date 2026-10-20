import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

// =====================================================
// FORMAT RUPIAH
// =====================================================

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// =====================================================
// TRANSACTIONS
// =====================================================

function Transactions() {
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
    user = null;
  }

  const role =
    user?.role || "";

  const userId =
    Number(user?.id || 0);

  const isCashier =
    role === "kasir" ||
    role === "super_admin";

  const isSeller =
    role === "seller";

  const isBuyer =
    role === "anggota" ||
    role === "seller";

  // ===================================================
  // PRODUCT STATE
  // ===================================================

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  // ===================================================
  // MEMBER STATE
  // ===================================================

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    memberSearch,
    setMemberSearch,
  ] = useState("");

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState("");

  // ===================================================
  // CART
  // ===================================================

  const [
    cart,
    setCart,
  ] = useState([]);

  // ===================================================
  // SHIFT
  // ===================================================

  const [
    currentShift,
    setCurrentShift,
  ] = useState(null);

  const [
    shiftLoading,
    setShiftLoading,
  ] = useState(false);

  // ===================================================
  // PAYMENT QUEUE
  // ===================================================

  const [
    pendingTransactions,
    setPendingTransactions,
  ] = useState([]);

  const [
    selectedPending,
    setSelectedPending,
  ] = useState(null);

  const [
    pendingDetailLoading,
    setPendingDetailLoading,
  ] = useState(false);

  // ===================================================
  // CREATED TRANSACTION
  // ===================================================

  const [
    createdTransaction,
    setCreatedTransaction,
  ] = useState(null);

  const [
    cashReceived,
    setCashReceived,
  ] = useState("");

  // ===================================================
  // UI
  // ===================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState("transaction");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts =
    async () => {
      const response =
        await api.get(
          "/products"
        );

      setProducts(
        response.data.data ||
          []
      );
    };

  // ===================================================
  // FETCH MEMBERS
  // ===================================================

  const fetchMembers =
    async () => {
      if (!isCashier) {
        return;
      }

      const response =
        await api.get(
          "/auth/members"
        );

      setMembers(
        response.data.data ||
          []
      );
    };

  // ===================================================
  // FETCH CURRENT SHIFT
  // ===================================================

  const fetchCurrentShift =
    async () => {
      if (!isCashier) {
        return;
      }

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
        setCurrentShift(null);
      }
    };

  // ===================================================
  // OPEN SHIFT
  // ===================================================

  const handleOpenShift =
    async () => {
      try {
        setShiftLoading(true);
        setError("");
        setMessage("");

        const response =
          await api.post(
            "/finance/shift/open"
          );

        setMessage(
          response.data.message ||
            "Shift berhasil dibuka."
        );

        await fetchCurrentShift();
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Gagal membuka shift."
        );
      } finally {
        setShiftLoading(false);
      }
    };

  // ===================================================
  // FETCH PENDING
  // ===================================================

  const fetchPendingTransactions =
    async () => {
      if (!isCashier) {
        return;
      }

      const response =
        await api.get(
          "/transactions/pending"
        );

      setPendingTransactions(
        response.data.data ||
          []
      );
    };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const jobs = [
            fetchProducts(),
          ];

          if (isCashier) {
            jobs.push(
              fetchMembers()
            );

            jobs.push(
              fetchCurrentShift()
            );

            jobs.push(
              fetchPendingTransactions()
            );
          }

          await Promise.all(
            jobs
          );
        } catch (error) {
          console.error(
            "Load Transaction Page Error:",
            error
          );

          setError(
            error.response?.data
              ?.message ||
              "Gagal memuat halaman transaksi."
          );
        } finally {
          setLoading(false);
        }
      };

    loadData();
  }, []);

  // ===================================================
  // MEMBER SEARCH
  // ===================================================

  const filteredMembers =
    useMemo(() => {
      const keyword =
        memberSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return members;
      }

      return members.filter(
        (member) =>
          [
            member.name,
            member.email,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          )
      );
    }, [
      members,
      memberSearch,
    ]);

  const selectedMember =
    useMemo(
      () =>
        members.find(
          (member) =>
            String(member.id) ===
            String(
              selectedMemberId
            )
        ) || null,
      [
        members,
        selectedMemberId,
      ]
    );

  // ===================================================
  // PRODUCT SEARCH
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const keyword =
        productSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return products;
      }

      return products.filter(
        (product) =>
          [
            product.name,
            product.brand,
            product.category_name,
            product.subcategory_name,
            product.seller_name,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          )
      );
    }, [
      products,
      productSearch,
    ]);

  // ===================================================
  // GROUP PRODUCTS BY CATEGORY
  // ===================================================

  const groupedProducts =
    useMemo(() => {
      return filteredProducts.reduce(
        (
          groups,
          product
        ) => {
          const category =
            product.category_name ||
            "Tanpa Kategori";

          if (
            !groups[category]
          ) {
            groups[category] =
              [];
          }

          groups[category].push(
            product
          );

          return groups;
        },
        {}
      );
    }, [filteredProducts]);

  // ===================================================
  // CHECK SELLER OWN PRODUCT
  // ===================================================

  const isOwnProduct = (
    product
  ) => {
    return (
      isSeller &&
      product.owner_type ===
        "seller" &&
      Number(
        product.seller_id
      ) === userId
    );
  };

  // ===================================================
  // CART ADD
  // ===================================================

  const addToCart = (
    product
  ) => {
    setError("");
    setMessage("");

    if (
      createdTransaction
    ) {
      setError(
        "Selesaikan transaksi sebelumnya terlebih dahulu."
      );

      return;
    }

    if (
      isOwnProduct(product)
    ) {
      setError(
        "Anda tidak dapat membeli produk milik sendiri."
      );

      return;
    }

    const stock =
      Number(
        product.stock_qty
      );

    if (stock <= 0) {
      setError(
        `Stok "${product.name}" habis.`
      );

      return;
    }

    setCart((prev) => {
      const existing =
        prev.find(
          (item) =>
            item.product_id ===
            product.id
        );

      if (existing) {
        if (
          existing.quantity >=
          stock
        ) {
          return prev;
        }

        return prev.map(
          (item) =>
            item.product_id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        );
      }

      return [
        ...prev,
        {
          product_id:
            product.id,

          name:
            product.name,

          sale_price:
            Number(
              product.sale_price
            ),

          stock_qty:
            stock,

          quantity: 1,

          owner_type:
            product.owner_type,

          seller_id:
            product.seller_id,

          seller_name:
            product.seller_name,
        },
      ];
    });
  };

  // ===================================================
  // CHANGE QUANTITY
  // ===================================================

  const changeQuantity = (
    productId,
    newQuantity
  ) => {
    const quantity =
      Number(newQuantity);

    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.product_id !==
            productId
          ) {
            return item;
          }

          if (
            quantity <= 0
          ) {
            return null;
          }

          return {
            ...item,
            quantity:
              Math.min(
                quantity,
                item.stock_qty
              ),
          };
        })
        .filter(Boolean)
    );
  };

  // ===================================================
  // REMOVE CART ITEM
  // ===================================================

  const removeFromCart = (
    productId
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.product_id !==
          productId
      )
    );
  };

  // ===================================================
  // CLEAR CART
  // ===================================================

  const clearCart = () => {
    setCart([]);
  };

  // ===================================================
  // CART TOTAL
  // ===================================================

  const cartTotal =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.sale_price
            ) *
              Number(
                item.quantity
              ),
          0
        ),
      [cart]
    );

  // ===================================================
  // CREATE TRANSACTION
  // ===================================================

  const handleCreateTransaction =
    async () => {
      try {
        setError("");
        setMessage("");

        if (
          cart.length === 0
        ) {
          setError(
            "Keranjang masih kosong."
          );

          return;
        }

        if (
          isCashier &&
          !selectedMemberId
        ) {
          setError(
            "Pilih anggota pembeli terlebih dahulu."
          );

          return;
        }

        setSubmitting(true);

        const payload = {
          items:
            cart.map(
              (item) => ({
                product_id:
                  item.product_id,

                quantity:
                  item.quantity,
              })
            ),
        };

        if (isCashier) {
          payload.member_id =
            Number(
              selectedMemberId
            );
        }

        const response =
          await api.post(
            "/transactions",
            payload
          );

        const transaction =
          response.data.data;

        setCreatedTransaction(
          transaction
        );

        setMessage(
          response.data.message ||
            "Transaksi berhasil dibuat."
        );

        setCart([]);

        if (isCashier) {
          await fetchPendingTransactions();
        }
      } catch (error) {
        console.error(
          "Create Transaction Error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Gagal membuat transaksi."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ===================================================
  // CLOSE CREATED TRANSACTION
  // ===================================================

  const closeCreatedTransaction =
    () => {
      setCreatedTransaction(
        null
      );

      setSelectedMemberId(
        ""
      );

      setMemberSearch("");
      setMessage("");
      setError("");

      fetchProducts();
    };

  // ===================================================
  // OPEN PENDING TRANSACTION
  // ===================================================

  const openPendingTransaction =
    async (
      transactionId
    ) => {
      try {
        setPendingDetailLoading(
          true
        );

        setError("");
        setMessage("");

        const response =
          await api.get(
            `/transactions/${transactionId}`
          );

        setSelectedPending(
          response.data.data ||
            null
        );

        setCashReceived("");
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Gagal mengambil detail transaksi."
        );
      } finally {
        setPendingDetailLoading(
          false
        );
      }
    };

  // ===================================================
  // CLOSE PENDING
  // ===================================================

  const closePendingTransaction =
    () => {
      setSelectedPending(
        null
      );

      setCashReceived("");
      setError("");
      setMessage("");
    };

  // ===================================================
  // PAYMENT TOTAL
  // ===================================================

  const paymentTotal =
    Number(
      selectedPending
        ?.total_amount || 0
    );

  const changeAmount =
    Math.max(
      0,
      Number(
        cashReceived || 0
      ) - paymentTotal
    );

  // ===================================================
  // PAY TRANSACTION
  // ===================================================

  const handlePayTransaction =
    async () => {
      if (!selectedPending) {
        return;
      }

      try {
        setSubmitting(true);
        setError("");
        setMessage("");

        const cash =
          Number(
            cashReceived
          );

        if (
          !Number.isFinite(
            cash
          ) ||
          cash <
            paymentTotal
        ) {
          setError(
            "Uang yang diterima kurang dari total pembayaran."
          );

          return;
        }

        const response =
          await api.post(
            `/transactions/${selectedPending.id}/pay`,
            {
              payment_method:
                "cash",

              cash_received:
                cash,
            }
          );

        setMessage(
          response.data.message ||
            "Pembayaran berhasil."
        );

        setSelectedPending(
          null
        );

        setCashReceived("");

        await Promise.all([
          fetchProducts(),
          fetchPendingTransactions(),
        ]);
      } catch (error) {
        console.error(
          "Payment Error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Gagal memproses pembayaran."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6">
        Memuat halaman transaksi...
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Transaksi
        </h1>

        <p className="text-gray-500 mt-1">
          {isCashier
            ? "Buat transaksi dan proses pembayaran anggota."
            : "Pilih produk yang ingin Anda beli."}
        </p>
      </div>

      {/* =================================================
          MESSAGE
      ================================================== */}

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

      {/* =================================================
          CASHIER SHIFT
      ================================================== */}

      {isCashier && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Shift Kasir
              </p>

              {currentShift ? (
                <>
                  <p className="font-semibold text-green-700 mt-1">
                    Shift Aktif
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Saldo Awal:{" "}
                    {formatRupiah(
                      currentShift.opening_balance
                    )}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-red-600 mt-1">
                  Shift Belum Dibuka
                </p>
              )}
            </div>

            {!currentShift && (
              <button
                onClick={
                  handleOpenShift
                }
                disabled={
                  shiftLoading
                }
                className="px-5 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {shiftLoading
                  ? "Membuka..."
                  : "Buka Shift"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* =================================================
          CASHIER TABS
      ================================================== */}

      {isCashier && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() =>
              setActiveTab(
                "transaction"
              )
            }
            className={`px-5 py-3 rounded-lg font-medium ${
              activeTab ===
              "transaction"
                ? "bg-gray-900 text-white"
                : "bg-white border text-gray-700"
            }`}
          >
            Transaksi Baru
          </button>

          <button
            onClick={() => {
              setActiveTab(
                "payment"
              );

              fetchPendingTransactions();
            }}
            className={`px-5 py-3 rounded-lg font-medium ${
              activeTab ===
              "payment"
                ? "bg-gray-900 text-white"
                : "bg-white border text-gray-700"
            }`}
          >
            Antrean Pembayaran
            {pendingTransactions.length >
              0 && (
              <span className="ml-2">
                (
                {
                  pendingTransactions.length
                }
                )
              </span>
            )}
          </button>
        </div>
      )}

      {/* =================================================
          TRANSACTION PAGE
      ================================================== */}

      {(!isCashier ||
        activeTab ===
          "transaction") && (
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">

          {/* =============================================
              LEFT SIDE
          ============================================== */}

          <div className="space-y-6">

            {/* ===========================================
                MEMBER SELECTION
            ============================================ */}

            {isCashier && (
              <div className="bg-white border rounded-xl p-5">
                <h2 className="font-semibold text-lg mb-4">
                  Pilih Anggota
                </h2>

                <input
                  type="text"
                  value={
                    memberSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setMemberSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Cari nama atau email anggota..."
                  className="w-full border rounded-lg px-4 py-3 mb-4"
                />

                {selectedMember ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            selectedMember.name
                          }
                        </p>

                        <p className="text-sm text-gray-500">
                          {
                            selectedMember.email
                          }
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedMemberId(
                            ""
                          );

                          setMemberSearch(
                            ""
                          );
                        }}
                        className="text-sm text-red-600"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-auto divide-y border rounded-lg">
                    {filteredMembers.length ===
                    0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        Anggota tidak ditemukan.
                      </div>
                    ) : (
                      filteredMembers.map(
                        (
                          member
                        ) => (
                          <button
                            type="button"
                            key={
                              member.id
                            }
                            onClick={() =>
                              setSelectedMemberId(
                                String(
                                  member.id
                                )
                              )
                            }
                            className="w-full text-left p-4 hover:bg-gray-50"
                          >
                            <p className="font-medium">
                              {
                                member.name
                              }
                            </p>

                            <p className="text-sm text-gray-500">
                              {
                                member.email
                              }
                            </p>
                          </button>
                        )
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===========================================
                SELLER INFORMATION
            ============================================ */}

            {isSeller && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                Anda login sebagai{" "}
                <strong>
                  Mitra Penjual
                </strong>
                . Anda tetap dapat membeli produk lain seperti Anggota, tetapi produk milik Anda sendiri tidak dapat dibeli.
              </div>
            )}

            {/* ===========================================
                PRODUCT SECTION
            ============================================ */}

            <div className="bg-white border rounded-xl overflow-hidden">

              <div className="p-5 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">
                      Pilih Produk
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Produk ditampilkan berdasarkan kategori.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={
                      productSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setProductSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Cari nama produk, merek, kategori, atau subkategori..."
                    className="border rounded-lg px-4 py-3 md:w-96"
                  />
                </div>
              </div>

              {/* =========================================
                  CATEGORY GROUPS
              ========================================== */}

              <div className="p-5 space-y-8">

                {Object.keys(
                  groupedProducts
                ).length === 0 ? (
                  <div className="text-gray-500 py-6 text-center">
                    Produk tidak ditemukan.
                  </div>
                ) : (
                  Object.entries(
                    groupedProducts
                  )
                    .sort(
                      (
                        [categoryA],
                        [categoryB]
                      ) =>
                        categoryA.localeCompare(
                          categoryB,
                          "id"
                        )
                    )
                    .map(
                      ([
                        category,
                        categoryProducts,
                      ]) => (
                        <section
                          key={
                            category
                          }
                        >
                          {/* CATEGORY HEADER */}

                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                              {
                                category
                              }
                            </h3>

                            <span className="text-sm text-gray-500">
                              {
                                categoryProducts.length
                              }{" "}
                              produk
                            </span>
                          </div>

                          {/* PRODUCT GRID */}

                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryProducts.map(
                              (
                                product
                              ) => {
                                const ownProduct =
                                  isOwnProduct(
                                    product
                                  );

                                const outOfStock =
                                  Number(
                                    product.stock_qty
                                  ) <=
                                  0;

                                const disabled =
                                  ownProduct ||
                                  outOfStock ||
                                  Boolean(
                                    createdTransaction
                                  );

                                return (
                                  <div
                                    key={
                                      product.id
                                    }
                                    className={`border rounded-xl overflow-hidden ${
                                      disabled
                                        ? "opacity-70"
                                        : "hover:shadow-sm"
                                    }`}
                                  >
                                    {/* IMAGE */}

                                    <div className="h-40 bg-gray-100 overflow-hidden relative">

                                      {product.image_url ? (
                                        <img
                                          src={
                                            product.image_url
                                          }
                                          alt={
                                            product.name
                                          }
                                          className="w-full h-full object-cover"
                                          onError={(
                                            event
                                          ) => {
                                            event.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                                          Tidak ada gambar
                                        </div>
                                      )}

                                      {/* STOCK */}

                                      <span className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-md text-xs font-medium">
                                        Stok{" "}
                                        {
                                          product.stock_qty
                                        }
                                      </span>
                                    </div>

                                    {/* CONTENT */}

                                    <div className="p-4">

                                      {/* SELLER OWN PRODUCT */}

                                      {ownProduct && (
                                        <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                          Produk milik Anda
                                        </div>
                                      )}

                                      {/* NAME */}

                                      <h4 className="font-semibold text-gray-900">
                                        {
                                          product.name
                                        }
                                      </h4>

                                      {/* BRAND */}

                                      {product.brand && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {
                                            product.brand
                                          }
                                        </p>
                                      )}

                                      {/* SUBCATEGORY */}

                                      {product.subcategory_name && (
                                        <span className="inline-block mt-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">
                                          {
                                            product.subcategory_name
                                          }
                                        </span>
                                      )}

                                      {/* SELLER */}

                                      {product.owner_type ===
                                        "seller" &&
                                        product.seller_name && (
                                          <p className="text-xs text-gray-500 mt-2">
                                            Dijual oleh{" "}
                                            <strong>
                                              {
                                                product.seller_name
                                              }
                                            </strong>
                                          </p>
                                        )}

                                      {/* PRICE */}

                                      <p className="font-bold text-lg mt-3">
                                        {formatRupiah(
                                          product.sale_price
                                        )}
                                      </p>

                                      {/* BUTTON */}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          addToCart(
                                            product
                                          )
                                        }
                                        disabled={
                                          disabled
                                        }
                                        className="w-full mt-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                      >
                                        {ownProduct
                                          ? "Produk Milik Anda"
                                          : outOfStock
                                          ? "Stok Habis"
                                          : "Tambah ke Keranjang"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </section>
                      )
                    )
                )}
              </div>
            </div>
          </div>

          {/* =============================================
              CART
          ============================================== */}

          <div>
            <div className="bg-white border rounded-xl sticky top-6 overflow-hidden">

              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">
                      Keranjang
                    </h2>

                    <p className="text-sm text-gray-500">
                      {
                        cart.length
                      }{" "}
                      jenis produk
                    </p>
                  </div>

                  {cart.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        clearCart
                      }
                      className="text-sm text-red-600"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>

              {cart.length ===
              0 ? (
                <div className="p-6 text-gray-500 text-center">
                  Keranjang masih kosong.
                </div>
              ) : (
                <div className="divide-y max-h-[420px] overflow-auto">

                  {cart.map(
                    (item) => (
                      <div
                        key={
                          item.product_id
                        }
                        className="p-4"
                      >
                        <div className="flex justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">
                              {
                                item.name
                              }
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              {formatRupiah(
                                item.sale_price
                              )}
                            </p>

                            {item.owner_type ===
                              "seller" &&
                              item.seller_name && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Mitra:{" "}
                                  {
                                    item.seller_name
                                  }
                                </p>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.product_id
                              )
                            }
                            className="text-red-500 text-sm"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">

                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item.product_id,
                                  item.quantity -
                                    1
                                )
                              }
                              className="w-9 h-9 hover:bg-gray-100"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="1"
                              max={
                                item.stock_qty
                              }
                              value={
                                item.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                changeQuantity(
                                  item.product_id,
                                  event.target
                                    .value
                                )
                              }
                              className="w-12 h-9 text-center border-x outline-none"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item.product_id,
                                  item.quantity +
                                    1
                                )
                              }
                              className="w-9 h-9 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>

                          <p className="font-semibold">
                            {formatRupiah(
                              Number(
                                item.sale_price
                              ) *
                                Number(
                                  item.quantity
                                )
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* CART TOTAL */}

              <div className="p-5 border-t bg-gray-50">

                <div className="flex items-center justify-between mb-5">
                  <span className="font-medium">
                    Total
                  </span>

                  <span className="text-xl font-bold">
                    {formatRupiah(
                      cartTotal
                    )}
                  </span>
                </div>

                {isCashier &&
                  selectedMember && (
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <p className="text-xs text-gray-500">
                        Pembeli
                      </p>

                      <p className="font-medium">
                        {
                          selectedMember.name
                        }
                      </p>
                    </div>
                  )}

                {isBuyer && (
                  <div className="mb-4 p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500">
                      Pembeli
                    </p>

                    <p className="font-medium">
                      {
                        user?.name
                      }
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    handleCreateTransaction
                  }
                  disabled={
                    submitting ||
                    cart.length ===
                      0 ||
                    Boolean(
                      createdTransaction
                    ) ||
                    (isCashier &&
                      !selectedMemberId)
                  }
                  className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {submitting
                    ? "Memproses..."
                    : "Buat Transaksi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          PAYMENT QUEUE
      ================================================== */}

      {isCashier &&
        activeTab ===
          "payment" && (
          <div className="grid xl:grid-cols-[1fr_420px] gap-6">

            {/* QUEUE */}

            <div className="bg-white border rounded-xl overflow-hidden">

              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">
                    Antrean Pembayaran
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Transaksi yang belum dibayar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    fetchPendingTransactions
                  }
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Refresh
                </button>
              </div>

              {pendingTransactions.length ===
              0 ? (
                <div className="p-6 text-gray-500">
                  Tidak ada antrean pembayaran.
                </div>
              ) : (
                <div className="divide-y">

                  {pendingTransactions.map(
                    (
                      transaction
                    ) => (
                      <button
                        type="button"
                        key={
                          transaction.id
                        }
                        onClick={() =>
                          openPendingTransaction(
                            transaction.id
                          )
                        }
                        className="w-full text-left p-5 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <p className="font-semibold">
                              Transaksi #
                              {
                                transaction.id
                              }
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              {
                                transaction.member_name
                              }
                            </p>

                            <p className="text-sm text-gray-500">
                              {
                                transaction.total_items
                              }{" "}
                              item
                            </p>
                          </div>

                          <p className="font-bold">
                            {formatRupiah(
                              transaction.total_amount
                            )}
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* PAYMENT PANEL */}

            <PaymentPanel
              transaction={
                selectedPending
              }
              loading={
                pendingDetailLoading
              }
              cashReceived={
                cashReceived
              }
              setCashReceived={
                setCashReceived
              }
              paymentTotal={
                paymentTotal
              }
              changeAmount={
                changeAmount
              }
              submitting={
                submitting
              }
              onPay={
                handlePayTransaction
              }
              onClose={
                closePendingTransaction
              }
            />
          </div>
        )}

      {/* =================================================
          CREATED TRANSACTION MODAL
      ================================================== */}

      {createdTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl w-full max-w-md p-6">

            <div className="text-center">

              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ✓
              </div>

              <h2 className="text-xl font-bold">
                Transaksi Berhasil Dibuat
              </h2>

              <p className="text-gray-500 mt-2">
                Transaksi menunggu pembayaran.
              </p>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-4 space-y-3">

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  ID Transaksi
                </span>

                <strong>
                  #
                  {
                    createdTransaction.transaction_id
                  }
                </strong>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Pembeli
                </span>

                <strong className="text-right">
                  {
                    createdTransaction.member_name
                  }
                </strong>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Total
                </span>

                <strong>
                  {formatRupiah(
                    createdTransaction.total_amount
                  )}
                </strong>
              </div>
            </div>

            {isBuyer && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                Silakan lakukan pembayaran melalui kasir. Pesanan produk Mitra Penjual akan diteruskan kepada penjual setelah pembayaran berhasil.
              </div>
            )}

            <button
              type="button"
              onClick={
                closeCreatedTransaction
              }
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg font-semibold"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// PAYMENT PANEL
// =====================================================

function PaymentPanel({
  transaction,
  loading,
  cashReceived,
  setCashReceived,
  paymentTotal,
  changeAmount,
  submitting,
  onPay,
  onClose,
}) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6">
        Memuat detail transaksi...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-lg">
          Pembayaran
        </h2>

        <p className="text-gray-500 mt-3">
          Pilih transaksi dari antrean untuk memproses pembayaran.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">
            Pembayaran #
            {
              transaction.id
            }
          </h2>

          <p className="text-sm text-gray-500">
            {
              transaction.member_name
            }
          </p>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="text-gray-500"
        >
          Tutup
        </button>
      </div>

      {/* ITEMS */}

      <div className="divide-y max-h-72 overflow-auto">
        {transaction.items?.map(
          (item) => (
            <div
              key={
                item.id
              }
              className="p-4"
            >
              <div className="flex justify-between gap-4">

                <div>
                  <p className="font-medium">
                    {
                      item.product_name
                    }
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {
                      item.quantity
                    }{" "}
                    ×{" "}
                    {formatRupiah(
                      item.unit_price
                    )}
                  </p>

                  {item.owner_type ===
                    "seller" &&
                    item.seller_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Mitra:{" "}
                        {
                          item.seller_name
                        }
                      </p>
                    )}
                </div>

                <p className="font-semibold">
                  {formatRupiah(
                    item.subtotal
                  )}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* PAYMENT */}

      <div className="p-5 border-t">

        <div className="flex justify-between mb-5">
          <span className="font-medium">
            Total Pembayaran
          </span>

          <span className="text-xl font-bold">
            {formatRupiah(
              paymentTotal
            )}
          </span>
        </div>

        <label className="block text-sm font-medium mb-2">
          Uang Diterima
        </label>

        <input
          type="number"
          min="0"
          value={
            cashReceived
          }
          onChange={(
            event
          ) =>
            setCashReceived(
              event.target.value
            )
          }
          placeholder="Masukkan nominal uang..."
          className="w-full border rounded-lg px-4 py-3"
        />

        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <div className="flex justify-between">
            <span className="text-gray-500">
              Kembalian
            </span>

            <strong>
              {formatRupiah(
                changeAmount
              )}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={
            onPay
          }
          disabled={
            submitting ||
            Number(
              cashReceived ||
                0
            ) <
              paymentTotal
          }
          className="w-full mt-5 py-3 bg-gray-900 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500"
        >
          {submitting
            ? "Memproses..."
            : "Bayar Transaksi"}
        </button>
      </div>
    </div>
  );
}

export default Transactions;