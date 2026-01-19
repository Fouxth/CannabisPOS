import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "./components/layout/MainLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Bills from "./pages/Bills";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Promotions from "./pages/Promotions";
import TenantDashboard from "./pages/admin/TenantDashboard";
import TenantDetails from "./pages/admin/TenantDetails";
import TenantUsers from "./pages/admin/TenantUsers";
import TenantActivity from "./pages/admin/TenantActivity";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// Component to handle root redirect
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

// Protected Route for Admin
function AdminRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="cannabispos-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<TenantDashboard />} />
                <Route path="/admin/tenants/:id" element={<TenantDetails />} />
                <Route path="/admin/tenants/:id/users" element={<TenantUsers />} />
                <Route path="/admin/activity" element={<TenantActivity />} />
              </Route>
            </Route>

            {/* Main App Routes */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/promotions" element={<Promotions />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
