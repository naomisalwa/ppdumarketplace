import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LoginSignup() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] =
    useState(true);

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "anggota",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // =========================================
  // HANDLE INPUT
  // =========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // RESET MESSAGE
  // =========================================

  const switchMode = () => {
    setIsLogin(
      (prev) => !prev
    );

    setError("");
    setMessage("");

    setForm({
      name: "",
      email: "",
      password: "",
      role: "anggota",
    });
  };

  // =========================================
  // SUBMIT
  // =========================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setLoading(true);
        setError("");
        setMessage("");

        // =====================================
        // LOGIN
        // =====================================

        if (isLogin) {
          const response =
            await api.post(
              "/auth/login",
              {
                email:
                  form.email,
                password:
                  form.password,
              }
            );

          const token =
            response.data.token;

          const user =
            response.data.user;

          if (
            !token ||
            !user
          ) {
            throw new Error(
              "Data login tidak lengkap."
            );
          }

          localStorage.setItem(
            "token",
            token
          );

          localStorage.setItem(
            "user",
            JSON.stringify(
              user
            )
          );

          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        // =====================================
        // SIGNUP
        // =====================================

        const response =
          await api.post(
            "/auth/signup",
            {
              name:
                form.name,
              email:
                form.email,
              password:
                form.password,
              role:
                form.role,
            }
          );

        setMessage(
          response.data
            .message ||
            "Registrasi berhasil."
        );

        setForm({
          name: "",
          email: form.email,
          password: "",
          role: "anggota",
        });

        setIsLogin(true);
      } catch (error) {
        console.error(
          "Authentication Error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Terjadi kesalahan."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="text-center mb-7">
          <h1 className="text-3xl font-bold text-gray-900">
            PP. Darul Ulum Market Place
          </h1>

          <p className="text-gray-500 mt-2">
            Management System
          </p>
        </div>

        {/* =====================================
            CARD
        ====================================== */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin
                ? "Masuk"
                : "Daftar Akun"}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              {isLogin
                ? "Masuk menggunakan akun Anda."
                : "Buat akun baru untuk menggunakan sistem koperasi."}
            </p>
          </div>

          {/* =====================================
              MESSAGE
          ====================================== */}

          {message && (
            <div className="mb-5 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* =====================================
              FORM
          ====================================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >

            {/* NAME */}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-500"
                />
              </div>
            )}

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="nama@email.com"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-500"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                placeholder={
                  isLogin
                    ? "Masukkan password"
                    : "Minimal 6 karakter"
                }
                required
                minLength="6"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-500"
              />
            </div>

            {/* =================================
                ROLE
            ================================== */}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Daftar Sebagai
                </label>

                <div className="space-y-3">

                  {/* ANGGOTA */}

                  <label
                    className={`block border rounded-xl p-4 cursor-pointer transition ${
                      form.role ===
                      "anggota"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="anggota"
                        checked={
                          form.role ===
                          "anggota"
                        }
                        onChange={
                          handleChange
                        }
                        className="mt-1"
                      />

                      <div>
                        <p className="font-semibold text-gray-900">
                          Anggota
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Berbelanja dan melakukan transaksi melalui koperasi.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* SELLER */}

                  <label
                    className={`block border rounded-xl p-4 cursor-pointer transition ${
                      form.role ===
                      "seller"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="seller"
                        checked={
                          form.role ===
                          "seller"
                        }
                        onChange={
                          handleChange
                        }
                        className="mt-1"
                      />

                      <div>
                        <p className="font-semibold text-gray-900">
                          Mitra Penjual
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Menjual produk melalui koperasi dan mengelola pesanan.
                        </p>
                      </div>
                    </div>
                  </label>

                </div>
              </div>
            )}

            {/* =================================
                SUBMIT
            ================================== */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Memproses..."
                : isLogin
                ? "Masuk"
                : "Daftar"}
            </button>
          </form>

          {/* =====================================
              SWITCH
          ====================================== */}

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              {isLogin
                ? "Belum memiliki akun?"
                : "Sudah memiliki akun?"}
            </p>

            <button
              type="button"
              onClick={
                switchMode
              }
              className="mt-2 font-semibold text-gray-900 hover:underline"
            >
              {isLogin
                ? "Daftar Sekarang"
                : "Kembali ke Login"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginSignup;