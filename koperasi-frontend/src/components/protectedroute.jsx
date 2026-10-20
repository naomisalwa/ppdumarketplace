import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const token =
    localStorage.getItem("token");

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

  // =========================
  // BELUM LOGIN
  // =========================

  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // =========================
  // ROLE TIDAK SESUAI
  // =========================

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
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

export default ProtectedRoute;