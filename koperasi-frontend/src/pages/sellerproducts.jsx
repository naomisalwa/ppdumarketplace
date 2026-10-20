import {
  useEffect,
  useMemo,
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

const emptyForm = {
  name: "",
  category_id: "",
  subcategory_id: "",
  brand: "",
  image_url: "",
  sale_price: "",
  stock_qty: "",
  description: "",
};

function SellerProducts() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    subcategories,
    setSubcategories,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

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

  const [
    search,
    setSearch,
  ] = useState("");

  // =========================
  // FETCH PRODUCTS
  // =========================

  const fetchProducts =
    async () => {
      const response =
        await api.get(
          "/seller/products"
        );

      setProducts(
        response.data.data ||
        []
      );
    };

  // =========================
  // FETCH CATEGORIES
  // =========================

  const fetchCategories =
    async () => {
      const response =
        await api.get(
          "/products/categories"
        );

      setCategories(
        response.data.data ||
        []
      );
    };

  // =========================
  // FETCH SUBCATEGORIES
  // =========================

  const fetchSubcategories =
    async (
      categoryId
    ) => {
      if (!categoryId) {
        setSubcategories(
          []
        );

        return;
      }

      const response =
        await api.get(
          `/products/subcategories?category_id=${categoryId}`
        );

      setSubcategories(
        response.data.data ||
        []
      );
    };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);
          setError("");

          await Promise.all([
            fetchProducts(),
            fetchCategories(),
          ]);
        } catch (error) {
          setError(
            error.response
              ?.data
              ?.message ||
              "Gagal mengambil data."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadData();
  }, []);

  // =========================
  // INPUT CHANGE
  // =========================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      name ===
      "category_id"
    ) {
      setForm(
        (prev) => ({
          ...prev,
          category_id:
            value,

          subcategory_id:
            "",
        })
      );

      fetchSubcategories(
        value
      );
    }
  };

  // =========================
  // RESET
  // =========================

  const resetForm = () => {
    setForm(emptyForm);

    setEditingProduct(
      null
    );

    setSubcategories(
      []
    );
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSubmitting(true);
        setError("");
        setMessage("");

        const payload = {
          name:
            form.name,

          subcategory_id:
            Number(
              form.subcategory_id
            ),

          brand:
            form.brand,

          image_url:
            form.image_url,

          sale_price:
            Number(
              form.sale_price
            ),

          stock_qty:
            Number(
              form.stock_qty
            ),

          description:
            form.description,
        };

        let response;

        if (
          editingProduct
        ) {
          response =
            await api.put(
              `/seller/products/${editingProduct.id}`,
              payload
            );
        } else {
          response =
            await api.post(
              "/seller/products",
              payload
            );
        }

        setMessage(
          response.data
            .message
        );

        resetForm();

        await fetchProducts();
      } catch (error) {
        setError(
          error.response
            ?.data
            ?.message ||
            "Gagal menyimpan produk."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // =========================
  // EDIT
  // =========================

  const handleEdit =
    async (product) => {
      if (
        product.approval_status ===
        "approved"
      ) {
        return;
      }

      setEditingProduct(
        product
      );

      setForm({
        name:
          product.name ||
          "",

        category_id:
          String(
            product.category_id ||
              ""
          ),

        subcategory_id:
          String(
            product.subcategory_id ||
              ""
          ),

        brand:
          product.brand ||
          "",

        image_url:
          product.image_url ||
          "",

        sale_price:
          product.sale_price ||
          "",

        stock_qty:
          product.stock_qty ??
          "",

        description:
          product.description ||
          "",
      });

      await fetchSubcategories(
        product.category_id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // SEARCH
  // =========================

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
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
            product.approval_status,
          ].some((value) =>
            String(
              value || ""
            )
              .toLowerCase()
              .includes(
                keyword
              )
          )
      );
    }, [
      products,
      search,
    ]);

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6">
        Memuat produk...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Produk Saya
        </h1>

        <p className="text-gray-500 mt-1">
          Ajukan produk untuk
          dijual melalui koperasi.
        </p>
      </div>

      {/* =====================
          FORM
      ====================== */}

      <div className="bg-white border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-5">
          {editingProduct
            ? "Edit & Ajukan Ulang Produk"
            : "Ajukan Produk Baru"}
        </h2>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="grid md:grid-cols-2 gap-5"
        >
          <FormInput
            label="Nama Produk"
            name="name"
            value={
              form.name
            }
            onChange={
              handleChange
            }
            required
          />

          <FormInput
            label="Merek"
            name="brand"
            value={
              form.brand
            }
            onChange={
              handleChange
            }
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Kategori
            </label>

            <select
              name="category_id"
              value={
                form.category_id
              }
              onChange={
                handleChange
              }
              required
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="">
                Pilih kategori
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Subkategori
            </label>

            <select
              name="subcategory_id"
              value={
                form.subcategory_id
              }
              onChange={
                handleChange
              }
              required
              disabled={
                !form.category_id
              }
              className="w-full border rounded-lg px-4 py-3 disabled:bg-gray-100"
            >
              <option value="">
                Pilih subkategori
              </option>

              {subcategories.map(
                (
                  subcategory
                ) => (
                  <option
                    key={
                      subcategory.id
                    }
                    value={
                      subcategory.id
                    }
                  >
                    {
                      subcategory.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <FormInput
            label="Harga Jual"
            name="sale_price"
            type="number"
            min="1"
            value={
              form.sale_price
            }
            onChange={
              handleChange
            }
            required
          />

          <FormInput
            label="Stok"
            name="stock_qty"
            type="number"
            min="0"
            value={
              form.stock_qty
            }
            onChange={
              handleChange
            }
            required
          />

          <div className="md:col-span-2">
            <FormInput
              label="URL / Path Gambar"
              name="image_url"
              value={
                form.image_url
              }
              onChange={
                handleChange
              }
              placeholder="/products/nama-file.jpg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Deskripsi
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              rows="4"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={
                submitting
              }
              className="px-5 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : editingProduct
                ? "Ajukan Ulang"
                : "Ajukan Produk"}
            </button>

            {editingProduct && (
              <button
                type="button"
                onClick={
                  resetForm
                }
                className="px-5 py-3 border rounded-lg"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* =====================
          PRODUCT LIST
      ====================== */}

      <div className="bg-white border rounded-xl">
        <div className="p-5 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="font-semibold text-lg">
              Daftar Produk
            </h2>

            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Cari produk..."
              className="border rounded-lg px-4 py-2 md:w-72"
            />
          </div>
        </div>

        {filteredProducts.length ===
        0 ? (
          <div className="p-6 text-gray-500">
            Belum ada produk.
          </div>
        ) : (
          <div className="divide-y">
            {filteredProducts.map(
              (product) => (
                <div
                  key={
                    product.id
                  }
                  className="p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
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
                        <h3 className="font-semibold text-gray-900">
                          {
                            product.name
                          }
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
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
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <StatusBadge
                        status={
                          product.approval_status
                        }
                      />

                      {product.approval_status ===
                        "rejected" &&
                        product.rejection_reason && (
                          <div className="mt-3 text-sm text-red-600 max-w-md">
                            <strong>
                              Alasan:
                            </strong>{" "}
                            {
                              product.rejection_reason
                            }
                          </div>
                        )}

                      {product.approval_status !==
                        "approved" && (
                        <button
                          onClick={() =>
                            handleEdit(
                              product
                            )
                          }
                          className="mt-3 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Edit Produk
                        </button>
                      )}
                    </div>
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

function FormInput({
  label,
  ...props
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <input
        {...props}
        className="w-full border rounded-lg px-4 py-3"
      />
    </div>
  );
}

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

export default SellerProducts;