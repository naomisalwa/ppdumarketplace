import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

// =========================================
// COMPONENTS
// =========================================

import Layout from "./components/layout";

import ProtectedRoute from "./components/protectedroute";

// =========================================
// GENERAL PAGES
// =========================================

import Dashboard from "./pages/dashboard";

import Finance from "./pages/finance";

import ProcurementHistory from "./pages/procurementhistory";

import ProductManagement from "./pages/productmanagement";

import Stock from "./pages/stock";

import TransactionHistory from "./pages/transactionhistory";

import Transactions from "./pages/transactions";

// =========================================
// SELLER PAGES
// =========================================

import SellerDashboard from "./pages/sellerdashboard";

import SellerOrders from "./pages/sellerorders";

import SellerProductApproval from "./pages/sellerproductapproval";

import SellerProducts from "./pages/sellerproducts";

import SellerFinance from "./pages/sellerfinance";

// =========================================
// AUTH
// =========================================

import LoginSignup from "./pages/loginsignup";

// =========================================
// DASHBOARD ROUTER
// =========================================

function DashboardRouter() {
  const userRaw =
    localStorage.getItem(
      "user"
    );

  let user = null;

  try {
    user = userRaw
      ? JSON.parse(
          userRaw
        )
      : null;
  } catch (error) {
    user = null;
  }

  // Seller memiliki
  // dashboard khusus.

  if (
    user?.role ===
    "seller"
  ) {
    return (
      <SellerDashboard />
    );
  }

  // Role lainnya tetap
  // menggunakan Dashboard lama.

  return <Dashboard />;
}

// =========================================
// PUBLIC ROUTE
// =========================================

function PublicRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  const userRaw =
    localStorage.getItem(
      "user"
    );

  let user = null;

  try {
    user = userRaw
      ? JSON.parse(
          userRaw
        )
      : null;
  } catch (error) {
    user = null;
  }

  // Jika sudah login,
  // jangan tampilkan login lagi.

  if (
    token &&
    user
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

// =========================================
// APP
// =========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================
            LOGIN / SIGNUP
        ================================== */}

        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginSignup />
            </PublicRoute>
          }
        />

        {/* =================================
            PROTECTED AREA
        ================================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "super_admin",
                "kasir",
                "anggota",
                "seller",
              ]}
            >
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* =============================
              DASHBOARD
          ============================== */}

          <Route
            path="/dashboard"
            element={
              <DashboardRouter />
            }
          />

          {/* =============================
              TRANSACTIONS
          ============================== */}

          <Route
            path="/transactions"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                  "kasir",
                  "anggota",
                  "seller",
                ]}
              >
                <Transactions />
              </ProtectedRoute>
            }
          />

          {/* =============================
              TRANSACTION HISTORY
          ============================== */}

          <Route
            path="/transaction-history"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                  "kasir",
                  "anggota",
                  "seller",
                ]}
              >
                <TransactionHistory />
              </ProtectedRoute>
            }
          />

          {/* =============================
              PRODUCT MANAGEMENT
          ============================== */}

          <Route
            path="/products"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                ]}
              >
                <ProductManagement />
              </ProtectedRoute>
            }
          />

          {/* =============================
              STOCK
          ============================== */}

          <Route
            path="/stock"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                  "kasir",
                ]}
              >
                <Stock />
              </ProtectedRoute>
            }
          />

          {/* =============================
              PROCUREMENT
          ============================== */}

          <Route
            path="/procurement"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                ]}
              >
                <ProcurementHistory />
              </ProtectedRoute>
            }
          />

          {/* =============================
              FINANCE
          ============================== */}

          <Route
            path="/finance"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                ]}
              >
                <Finance />
              </ProtectedRoute>
            }
          />

          {/* =============================
              SELLER PRODUCTS
          ============================== */}

          <Route
            path="/seller-products"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "seller",
                ]}
              >
                <SellerProducts />
              </ProtectedRoute>
            }
          />

          {/* =============================
              SELLER ORDERS
          ============================== */}

          <Route
            path="/seller-orders"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "seller",
                ]}
              >
                <SellerOrders />
              </ProtectedRoute>
            }
          />

          {/* =============================
              SELLER FINANCE
          ============================== */}

          <Route
            path="/seller-finance"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "seller",
                ]}
              >
                <SellerFinance />
              </ProtectedRoute>
            }
          />

          {/* =============================
              ADMIN SELLER APPROVAL
          ============================== */}

          <Route
            path="/seller-product-approval"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "super_admin",
                ]}
              >
                <SellerProductApproval />
              </ProtectedRoute>
            }
          />

        </Route>

        {/* =================================
            FALLBACK
        ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;