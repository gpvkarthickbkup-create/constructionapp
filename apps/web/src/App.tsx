import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import SitesListPage from '@/pages/sites/SitesListPage';
import SiteDetailPage from '@/pages/sites/SiteDetailPage';
import ExpensesListPage from '@/pages/expenses/ExpensesListPage';
import AddExpensePage from '@/pages/expenses/AddExpensePage';
import VendorsListPage from '@/pages/vendors/VendorsListPage';
import VendorDetailPage from '@/pages/vendors/VendorDetailPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AddSitePage from '@/pages/sites/AddSitePage';
import EditSitePage from '@/pages/sites/EditSitePage';
import AddVendorPage from '@/pages/vendors/AddVendorPage';
import CustomersPage from '@/pages/customers/CustomersPage';
// import BankPage from '@/pages/bank/BankPage'; // Removed
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage';
import LandsListPage from '@/pages/land/LandsListPage';
import LandDetailPage from '@/pages/land/LandDetailPage';
import AddLandPage from '@/pages/land/AddLandPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import UsersPage from '@/pages/users/UsersPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import AdminPage from '@/pages/admin/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, fetchMe, refreshTenant, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, []);

  // Periodically refresh tenant data (every 2 minutes) to pick up lockedModules changes
  // Also refresh when tab becomes visible again
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      refreshTenant();
    }, 2 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTenant();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading Datalytics Construction...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/landing" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected App */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="sites" element={<SitesListPage />} />
          <Route path="sites/new" element={<AddSitePage />} />
          <Route path="sites/:id" element={<SiteDetailPage />} />
          <Route path="sites/:id/edit" element={<EditSitePage />} />
          <Route path="expenses" element={<ExpensesListPage />} />
          <Route path="expenses/add" element={<AddExpensePage />} />
          <Route path="vendors" element={<VendorsListPage />} />
          <Route path="vendors/new" element={<AddVendorPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="lands" element={<LandsListPage />} />
          <Route path="lands/new" element={<AddLandPage />} />
          <Route path="lands/:id" element={<LandDetailPage />} />
          {/* Bank removed */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
