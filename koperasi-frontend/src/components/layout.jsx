import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

function Layout() {
  const navigate =
    useNavigate();

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

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/");
  };

  // =========================
  // MENU
  // =========================

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      roles: [
        "super_admin",
        "kasir",
        "anggota",
        "seller",
      ],
    },

    {
      label: "Transaksi",
      path: "/transactions",
      roles: [
        "super_admin",
        "kasir",
        "anggota",
        "seller",
      ],
    },

    {
      label:
        "Riwayat Transaksi",
      path:
        "/transaction-history",
      roles: [
        "super_admin",
        "kasir",
        "anggota",
        "seller",
      ],
    },

    {
      label:
        "Kelola Produk",
      path: "/products",
      roles: [
        "super_admin",
      ],
    },

    {
      label:
        "Pengajuan Produk Mitra",
      path:
        "/seller-product-approval",
      roles: [
        "super_admin",
      ],
    },

    {
      label: "Stok",
      path: "/stock",
      roles: [
        "super_admin",
        "kasir",
      ],
    },

    {
      label:
        "Riwayat Pengadaan",
      path: "/procurement",
      roles: [
        "super_admin",
      ],
    },

    {
      label: "Keuangan",
      path: "/finance",
      roles: [
        "super_admin",
      ],
    },

    {
      label:
        "Produk Saya",
      path: "/seller-products",
      roles: [
        "seller",
      ],
    },

    {
      label:
        "Daftar Pesanan",
      path: "/seller-orders",
      roles: [
        "seller",
      ],
    },

    {
      label:
        "Keuangan Saya",
      path: "/seller-finance",
      roles: [
        "seller",
      ],
    },
  ];

  const visibleMenu =
    menuItems.filter(
      (item) =>
        item.roles.includes(
          role
        )
    );

  const roleLabel = {
    super_admin:
      "Super Admin",

    kasir:
      "Kasir",

    anggota:
      "Anggota",

    seller:
      "Mitra Penjual",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* =====================
            SIDEBAR
        ====================== */}

        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-6 py-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">
              Koperasi
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Management System
            </p>
          </div>

          {/* USER INFO */}

          <div className="px-6 py-5 border-b">
            <p className="text-sm text-gray-500">
              Login sebagai
            </p>

            <p className="font-semibold text-gray-900 mt-1">
              {user?.name ||
                "-"}
            </p>

            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
              {roleLabel[
                role
              ] || role}
            </span>
          </div>

          {/* MENU */}

          <nav className="flex-1 px-4 py-5 space-y-2">
            {visibleMenu.map(
              (item) => (
                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  className={( {
                    isActive,
                  }) =>
                    [
                      "block px-4 py-3 rounded-lg text-sm font-medium transition",
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100",
                    ].join(
                      " "
                    )
                  }
                >
                  {
                    item.label
                  }
                </NavLink>
              )
            )}
          </nav>

          {/* LOGOUT */}

          <div className="p-4 border-t">
            <button
              onClick={
                handleLogout
              }
              className="w-full px-4 py-3 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* =====================
            CONTENT
        ====================== */}

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

export default Layout;