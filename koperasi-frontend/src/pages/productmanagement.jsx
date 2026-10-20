import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

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

const getTodayString = () => {
  const now = new Date();

  const year = now.getFullYear();
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

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("products");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("success");

  // =========================
  // CATEGORY FORM
  // =========================

  const [categoryName, setCategoryName] =
    useState("");

  // =========================
  // SUBCATEGORY FORM
  // =========================

  const [subcategoryForm, setSubcategoryForm] =
    useState({
      name: "",
      category_id: "",
    });

  // =========================
  // PRODUCT FORM
  // =========================

  const [editingProductId, setEditingProductId] =
    useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    subcategory_id: "",
    brand: "",
    image_url: "",
    sale_price: "",
  });

  // =========================
  // PROCUREMENT FORM
  // =========================

  const [procurementForm, setProcurementForm] =
    useState({
      product_id: "",
      quantity: "",
      purchase_price: "",
      sale_price: "",
      expired_date: "",
      supplier_name: "",
    });

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [
        productResponse,
        categoryResponse,
        subcategoryResponse,
      ] = await Promise.all([
        api.get("/products"),
        api.get("/products/categories"),
        api.get("/products/subcategories"),
      ]);

      setProducts(
        productResponse.data.data || []
      );

      setCategories(
        categoryResponse.data.data || []
      );

      setSubcategories(
        subcategoryResponse.data.data || []
      );
    } catch (error) {
      console.error(
        "Fetch Product Management Error:",
        error
      );

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Gagal mengambil data master produk."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // CATEGORY
  // =========================

  const handleCreateCategory = async (
    event
  ) => {
    event.preventDefault();

    if (!categoryName.trim()) return;

    try {
      setSubmitting(true);
      setMessage("");

      const response = await api.post(
        "/products/categories",
        {
          name: categoryName.trim(),
        }
      );

      setMessageType("success");
      setMessage(
        response.data.message ||
          "Kategori berhasil ditambahkan."
      );

      setCategoryName("");

      await fetchData();
    } catch (error) {
      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Gagal menambahkan kategori."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // SUBCATEGORY
  // =========================

  const handleCreateSubcategory = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const response = await api.post(
        "/products/subcategories",
        {
          name: subcategoryForm.name,
          category_id:
            subcategoryForm.category_id,
        }
      );

      setMessageType("success");

      setMessage(
        response.data.message ||
          "Subkategori berhasil ditambahkan."
      );

      setSubcategoryForm({
        name: "",
        category_id: "",
      });

      await fetchData();
    } catch (error) {
      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Gagal menambahkan subkategori."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // PRODUCT FORM
  // =========================

  const resetProductForm = () => {
    setEditingProductId(null);

    setProductForm({
      name: "",
      category_id: "",
      subcategory_id: "",
      brand: "",
      image_url: "",
      sale_price: "",
    });
  };

  const filteredSubcategories = useMemo(() => {
    if (!productForm.category_id) {
      return subcategories;
    }

    return subcategories.filter(
      (item) =>
        Number(item.category_id) ===
        Number(productForm.category_id)
    );
  }, [
    subcategories,
    productForm.category_id,
  ]);

  const handleProductCategoryChange = (
    categoryId
  ) => {
    setProductForm((current) => ({
      ...current,
      category_id: categoryId,
      subcategory_id: "",
    }));
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.id);

    setProductForm({
      name: product.name || "",
      category_id:
        String(product.category_id || ""),
      subcategory_id:
        String(product.subcategory_id || ""),
      brand: product.brand || "",
      image_url: product.image_url || "",
      sale_price:
        String(product.sale_price || ""),
    });

    setActiveTab("products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmitProduct = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const payload = {
        name: productForm.name,
        subcategory_id:
          productForm.subcategory_id,
        brand: productForm.brand,
        image_url: productForm.image_url,
        sale_price:
          Number(productForm.sale_price),
      };

      let response;

      if (editingProductId) {
        response = await api.put(
          `/products/${editingProductId}`,
          payload
        );
      } else {
        response = await api.post(
          "/products",
          payload
        );
      }

      setMessageType("success");

      setMessage(
        response.data.message ||
          (editingProductId
            ? "Produk berhasil diperbarui."
            : "Produk berhasil ditambahkan.")
      );

      resetProductForm();

      await fetchData();
    } catch (error) {
      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Gagal menyimpan produk."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // PROCUREMENT
  // =========================

  const handleProcurementProductChange = (
    productId
  ) => {
    const selectedProduct = products.find(
      (product) =>
        Number(product.id) ===
        Number(productId)
    );

    setProcurementForm((current) => ({
      ...current,
      product_id: productId,
      sale_price:
        selectedProduct?.sale_price || "",
    }));
  };

  const handleAddProcurement = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const payload = {
        product_id:
          procurementForm.product_id,

        quantity: Number(
          procurementForm.quantity
        ),

        purchase_price: Number(
          procurementForm.purchase_price
        ),

        sale_price: Number(
          procurementForm.sale_price
        ),

        expired_date:
          procurementForm.expired_date ||
          null,

        supplier_name:
          procurementForm.supplier_name,
      };

      const response = await api.post(
        "/procurement",
        payload
      );

      setMessageType("success");

      setMessage(
        response.data.message ||
          "Barang berhasil diterima."
      );

      setProcurementForm({
        product_id: "",
        quantity: "",
        purchase_price: "",
        sale_price: "",
        expired_date: "",
        supplier_name: "",
      });

      await fetchData();
    } catch (error) {
      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Gagal menambahkan stok."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // FILTER PRODUCT TABLE
  // =========================

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.name
          ?.toLowerCase()
          .includes(keyword) ||
        product.brand
          ?.toLowerCase()
          .includes(keyword) ||
        product.category_name
          ?.toLowerCase()
          .includes(keyword) ||
        product.subcategory_name
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [products, search]);

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Kelola Produk
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Kelola kategori, subkategori,
          master produk, dan barang masuk.
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* TAB */}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {[
            {
              id: "products",
              label: "Master Produk",
            },
            {
              id: "procurement",
              label: "Barang Masuk",
            },
            {
              id: "categories",
              label: "Kategori",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================
          MASTER PRODUCT
      ========================= */}

      {activeTab === "products" && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              {editingProductId
                ? "Edit Produk"
                : "Tambah Produk Baru"}
            </h2>

            <form
              onSubmit={handleSubmitProduct}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama Produk
                </label>

                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        name: event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Merk
                </label>

                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(event) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        brand:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kategori
                </label>

                <select
                  required
                  value={
                    productForm.category_id
                  }
                  onChange={(event) =>
                    handleProductCategoryChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Pilih kategori
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Subkategori
                </label>

                <select
                  required
                  value={
                    productForm.subcategory_id
                  }
                  onChange={(event) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        subcategory_id:
                          event.target.value,
                      })
                    )
                  }
                  disabled={
                    !productForm.category_id
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">
                    Pilih subkategori
                  </option>

                  {filteredSubcategories.map(
                    (subcategory) => (
                      <option
                        key={
                          subcategory.id
                        }
                        value={
                          subcategory.id
                        }
                      >
                        {subcategory.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Harga Jual
                </label>

                <input
                  type="number"
                  required
                  min="0"
                  value={
                    productForm.sale_price
                  }
                  onChange={(event) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        sale_price:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  URL Gambar
                </label>

                <input
                  type="text"
                  value={
                    productForm.image_url
                  }
                  onChange={(event) =>
                    setProductForm(
                      (current) => ({
                        ...current,
                        image_url:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Opsional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingProductId
                      ? "Simpan Perubahan"
                      : "Tambah Produk"}
                </button>

                {editingProductId && (
                  <button
                    type="button"
                    onClick={
                      resetProductForm
                    }
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* PRODUCT TABLE */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">
                    Daftar Produk
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredProducts.length}{" "}
                    produk
                  </p>
                </div>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Cari produk..."
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Memuat produk...
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
                        Harga
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                        Stok
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(
                      (product) => (
                        <tr key={product.id}>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {product.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {product.brand ||
                                "Tanpa merk"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              product.category_name
                            }
                            <p className="text-xs text-slate-400">
                              {
                                product.subcategory_name
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold">
                            {formatRupiah(
                              product.sale_price
                            )}
                          </td>

                          <td className="px-5 py-4 text-center font-bold">
                            {product.stock_qty}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                startEditProduct(
                                  product
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* =========================
          PROCUREMENT
      ========================= */}

      {activeTab === "procurement" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Barang Masuk
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Masukkan barang yang baru dibeli
            untuk menambah stok.
          </p>

          <form
            onSubmit={handleAddProcurement}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Produk
              </label>

              <select
                required
                value={
                  procurementForm.product_id
                }
                onChange={(event) =>
                  handleProcurementProductChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">
                  Pilih produk
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — Stok{" "}
                    {product.stock_qty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Jumlah Barang
              </label>

              <input
                type="number"
                required
                min="1"
                value={
                  procurementForm.quantity
                }
                onChange={(event) =>
                  setProcurementForm(
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

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Supplier
              </label>

              <input
                type="text"
                value={
                  procurementForm.supplier_name
                }
                onChange={(event) =>
                  setProcurementForm(
                    (current) => ({
                      ...current,
                      supplier_name:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Harga Beli / Barang
              </label>

              <input
                type="number"
                required
                min="0"
                value={
                  procurementForm.purchase_price
                }
                onChange={(event) =>
                  setProcurementForm(
                    (current) => ({
                      ...current,
                      purchase_price:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Harga Jual / Barang
              </label>

              <input
                type="number"
                required
                min="0"
                value={
                  procurementForm.sale_price
                }
                onChange={(event) =>
                  setProcurementForm(
                    (current) => ({
                      ...current,
                      sale_price:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tanggal Kedaluwarsa
              </label>

              <input
                type="date"
                min={getTodayString()}
                value={
                  procurementForm.expired_date
                }
                onChange={(event) =>
                  setProcurementForm(
                    (current) => ({
                      ...current,
                      expired_date:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-slate-400">
                Kosongkan jika produk tidak
                memiliki tanggal kedaluwarsa.
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
              >
                {submitting
                  ? "Memproses..."
                  : "Terima Barang"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================
          CATEGORY
      ========================= */}

      {activeTab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* CATEGORY */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-800">
              Kategori
            </h2>

            <form
              onSubmit={
                handleCreateCategory
              }
              className="mt-4 flex gap-2"
            >
              <input
                type="text"
                required
                value={categoryName}
                onChange={(event) =>
                  setCategoryName(
                    event.target.value
                  )
                }
                placeholder="Nama kategori"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />

              <button
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tambah
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {categories.map(
                (category) => (
                  <div
                    key={category.id}
                    className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {category.name}
                  </div>
                )
              )}
            </div>
          </section>

          {/* SUBCATEGORY */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-800">
              Subkategori
            </h2>

            <form
              onSubmit={
                handleCreateSubcategory
              }
              className="mt-4 space-y-3"
            >
              <select
                required
                value={
                  subcategoryForm.category_id
                }
                onChange={(event) =>
                  setSubcategoryForm(
                    (current) => ({
                      ...current,
                      category_id:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
              >
                <option value="">
                  Pilih kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

              <input
                type="text"
                required
                value={
                  subcategoryForm.name
                }
                onChange={(event) =>
                  setSubcategoryForm(
                    (current) => ({
                      ...current,
                      name:
                        event.target.value,
                    })
                  )
                }
                placeholder="Nama subkategori"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />

              <button
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tambah Subkategori
              </button>
            </form>

            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">
              {subcategories.map(
                (subcategory) => (
                  <div
                    key={subcategory.id}
                    className="rounded-lg bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      {subcategory.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        subcategory.category_name
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;