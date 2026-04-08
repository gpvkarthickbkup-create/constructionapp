import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  Users,
  MapPin,
  Receipt,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  totalUsers: number;
  totalSites: number;
  totalExpenses: number;
}

interface Subscription {
  plan: { displayName: string; price: number };
  status: string;
  endDate: string;
}

interface Tenant {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  mobile: string;
  status: string;
  lockedModules: string;
  notes: string;
  createdAt: string;
  subscription: Subscription;
  _count: { users: number; sites: number; expenses: number };
}

interface Plan {
  id: string;
  displayName: string;
  price: number;
}

interface ModuleItem {
  key: string;
  label: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        STATUS_COLORS[status] || 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4">
      <div
        className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Overview Tab ────────────────────────────────────────────────────

function OverviewTab({
  stats,
  recentTenants,
  loading,
}: {
  stats: PlatformStats | null;
  recentTenants: Tenant[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#f26f31]" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Companies', value: stats.totalTenants, icon: Building2, color: '#f26f31' },
    { label: 'Active', value: stats.activeTenants, icon: CheckCircle2, color: '#10b981' },
    { label: 'Trial', value: stats.trialTenants, icon: Clock, color: '#3b82f6' },
    { label: 'Expired', value: stats.expiredTenants, icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#8b5cf6' },
    { label: 'Total Sites', value: stats.totalSites, icon: MapPin, color: '#06b6d4' },
    { label: 'Total Expenses', value: stats.totalExpenses, icon: Receipt, color: '#ec4899' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Registrations
          </h3>
        </div>
        {recentTenants.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No recent registrations
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentTenants.slice(0, 10).map((t) => (
              <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t.companyName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.ownerName} &middot; {t.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-gray-400">{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module Lock Panel ───────────────────────────────────────────────

function ModuleLockPanel({
  tenant,
  modules,
  onSave,
  onClose,
}: {
  tenant: Tenant;
  modules: ModuleItem[];
  onSave: (tenantId: string, locked: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const currentLocked = (tenant.lockedModules || '').split(',').filter(Boolean);
  const [locked, setLocked] = useState<string[]>(currentLocked);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setLocked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(tenant.id, locked);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Lock Modules
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{tenant.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-2">
          <p className="text-xs text-gray-400 mb-3">
            Checked modules will be <strong>locked</strong> (disabled) for this company.
          </p>
          {modules.map((m) => (
            <label
              key={m.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={locked.includes(m.key)}
                onChange={() => toggle(m.key)}
                className="h-4 w-4 rounded border-gray-300 text-[#f26f31] focus:ring-[#f26f31]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {m.label}
              </span>
              {locked.includes(m.key) ? (
                <Lock className="h-3.5 w-3.5 text-red-400" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </label>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#f26f31] hover:bg-[#e05e22] rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Company Detail Inline ───────────────────────────────────────────

function CompanyDetailInline({
  tenant,
  modules,
  plans,
  onStatusChange,
  onModuleSave,
  onSubscriptionUpdate,
}: {
  tenant: Tenant;
  modules: ModuleItem[];
  plans: Plan[];
  onStatusChange: (id: string, status: string) => Promise<void>;
  onModuleSave: (id: string, locked: string[]) => Promise<void>;
  onSubscriptionUpdate: (id: string, planId: string, endDate: string) => Promise<void>;
}) {
  const currentLocked = (tenant.lockedModules || '').split(',').filter(Boolean);
  const [locked, setLocked] = useState<string[]>(currentLocked);
  const [savingModules, setSavingModules] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  // Custom pricing
  const [customPrice, setCustomPrice] = useState('');
  const [pricingNotes, setPricingNotes] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  // Password reset
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPw, setResettingPw] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  // Load tenant users + pricing on mount
  useEffect(() => {
    api.get(`/admin/tenants/${tenant.id}/users`).then(r => setTenantUsers(r.data?.data || [])).catch(() => {});
    try { const n = JSON.parse(tenant.notes || '{}'); setCustomPrice(n.customPrice || ''); setPricingNotes(n.notes || ''); } catch {}
  }, [tenant.id]);

  const handleSavePrice = async () => {
    setSavingPrice(true);
    try {
      await api.patch(`/admin/tenants/${tenant.id}/pricing`, { customPrice: parseFloat(customPrice) || 0, notes: pricingNotes });
      toast.success('Pricing saved');
    } catch { toast.error('Failed'); }
    finally { setSavingPrice(false); }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) { toast.error('Select user and enter new password'); return; }
    setResettingPw(true);
    try {
      await api.patch(`/admin/tenants/${tenant.id}/reset-password`, { userId: selectedUserId, newPassword });
      toast.success('Password reset!');
      setNewPassword('');
    } catch { toast.error('Failed'); }
    finally { setResettingPw(false); }
  };

  const toggleModule = (key: string) => {
    setLocked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleModuleSave = async () => {
    setSavingModules(true);
    try {
      await onModuleSave(tenant.id, locked);
    } finally {
      setSavingModules(false);
    }
  };

  const handleStatusToggle = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await onStatusChange(tenant.id, newStatus);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!extendDate) {
      toast.error('Please select a new end date');
      return;
    }
    setUpdatingSubscription(true);
    try {
      await onSubscriptionUpdate(tenant.id, selectedPlan, extendDate);
    } finally {
      setUpdatingSubscription(false);
    }
  };

  return (
    <tr>
      <td colSpan={10} className="p-0">
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Company Info
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tenant.companyName}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Owner:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{tenant.ownerName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{tenant.email}</span>
                </p>
                <p>
                  <span className="text-gray-500">Mobile:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{tenant.mobile}</span>
                </p>
                <p>
                  <span className="text-gray-500">Registered:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatDate(tenant.createdAt)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500">Users: {tenant._count.users}</span>
                <span className="text-xs text-gray-500">Sites: {tenant._count.sites}</span>
                <span className="text-xs text-gray-500">
                  Expenses: {tenant._count.expenses}
                </span>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Subscription
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Plan:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tenant.subscription?.plan?.displayName || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Price:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {tenant.subscription?.plan?.price != null
                      ? `₹${tenant.subscription.plan.price.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Status:</span>{' '}
                  <StatusBadge status={tenant.subscription?.status || tenant.status} />
                </p>
                <p>
                  <span className="text-gray-500">Expires:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {tenant.subscription?.endDate
                      ? formatDate(tenant.subscription.endDate)
                      : 'N/A'}
                  </span>
                </p>
              </div>

              {/* Extend Subscription */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <p className="text-xs font-medium text-gray-500">Update Subscription</p>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Same plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName} - ₹{p.price}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleExtendSubscription}
                  disabled={updatingSubscription}
                  className="w-full px-3 py-1.5 text-xs font-medium text-white bg-[#f26f31] hover:bg-[#e05e22] rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {updatingSubscription && <Loader2 className="h-3 w-3 animate-spin" />}
                  Extend / Update Subscription
                </button>
              </div>

              {/* Status Actions */}
              <div className="mt-3 flex items-center gap-2">
                {tenant.status !== 'active' && (
                  <button
                    onClick={() => handleStatusToggle('active')}
                    disabled={changingStatus}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
                  >
                    Activate
                  </button>
                )}
                {tenant.status !== 'suspended' && (
                  <button
                    onClick={() => handleStatusToggle('suspended')}
                    disabled={changingStatus}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>

            {/* Module Lock */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Module Access
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Check to <strong>lock</strong> (disable) a module for this company.
              </p>
              <div className="space-y-1.5">
                {modules.map((m) => (
                  <label
                    key={m.key}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={locked.includes(m.key)}
                      onChange={() => toggleModule(m.key)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[#f26f31] focus:ring-[#f26f31]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {m.label}
                    </span>
                    {locked.includes(m.key) ? (
                      <Lock className="h-3 w-3 text-red-400" />
                    ) : (
                      <Unlock className="h-3 w-3 text-emerald-400" />
                    )}
                  </label>
                ))}
              </div>
              <button
                onClick={handleModuleSave}
                disabled={savingModules}
                className="mt-4 w-full px-3 py-1.5 text-xs font-medium text-white bg-[#f26f31] hover:bg-[#e05e22] rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {savingModules ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save Module Settings
              </button>
            </div>
          </div>

          {/* Custom Pricing + Password Reset Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Custom Pricing */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">💰 Custom Pricing</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monthly Amount (₹)</label>
                  <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="e.g., 2499" className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                  <input value={pricingNotes} onChange={e => setPricingNotes(e.target.value)} placeholder="e.g., Paid till March 2027" className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm" />
                </div>
                <button onClick={handleSavePrice} disabled={savingPrice} className="bg-[#f26f31] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d4551a] disabled:opacity-50">
                  {savingPrice ? 'Saving...' : '💾 Save Pricing'}
                </button>
              </div>
            </div>

            {/* Password Reset */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔑 Reset User Password</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Select User</label>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm">
                    <option value="">-- Select User --</option>
                    {tenantUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                  <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm" />
                </div>
                <button onClick={handleResetPassword} disabled={resettingPw} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                  {resettingPw ? 'Resetting...' : '🔑 Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Companies Tab ───────────────────────────────────────────────────

function CompaniesTab({
  tenants,
  pagination,
  loading,
  search,
  statusFilter,
  modules,
  plans,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onStatusChange,
  onModuleSave,
  onSubscriptionUpdate,
}: {
  tenants: Tenant[];
  pagination: Pagination | null;
  loading: boolean;
  search: string;
  statusFilter: string;
  modules: ModuleItem[];
  plans: Plan[];
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onModuleSave: (id: string, locked: string[]) => Promise<void>;
  onSubscriptionUpdate: (id: string, planId: string, endDate: string) => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [moduleLockTarget, setModuleLockTarget] = useState<Tenant | null>(null);

  const statusOptions = ['all', 'active', 'trial', 'expired', 'suspended'];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, owner, email..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30 focus:border-[#f26f31]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#f26f31] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Mobile
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Users
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Sites
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#f26f31] mx-auto" />
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                tenants.map((t, idx) => (
                  <>
                    <tr
                      key={t.id}
                      className={`${
                        idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                      } hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {t.companyName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {t.ownerName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        {t.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                        {t.mobile}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {t.subscription?.plan?.displayName || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                        {t._count.users}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                        {t._count.sites}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden xl:table-cell">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === t.id ? null : t.id)
                            }
                            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            {expandedId === t.id ? (
                              <>
                                <ChevronUp className="h-3 w-3" /> Close
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" /> Details
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              onStatusChange(
                                t.id,
                                t.status === 'active' ? 'suspended' : 'active'
                              )
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                              t.status === 'active'
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {t.status === 'active' ? (
                              <>
                                <XCircle className="h-3 w-3" /> Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setModuleLockTarget(t)}
                            className="px-2.5 py-1 text-xs font-medium text-[#f26f31] bg-[#f26f31]/10 rounded-md hover:bg-[#f26f31]/20 transition-colors flex items-center gap-1"
                          >
                            <Lock className="h-3 w-3" /> Modules
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === t.id && (
                      <CompanyDetailInline
                        key={`detail-${t.id}`}
                        tenant={t}
                        modules={modules}
                        plans={plans}
                        onStatusChange={onStatusChange}
                        onModuleSave={onModuleSave}
                        onSubscriptionUpdate={onSubscriptionUpdate}
                      />
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
              total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const startPage = Math.max(
                  1,
                  Math.min(pagination.page - 2, pagination.totalPages - 4)
                );
                const p = startPage + i;
                if (p > pagination.totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      p === pagination.page
                        ? 'bg-[#f26f31] text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Module Lock Modal */}
      {moduleLockTarget && (
        <ModuleLockPanel
          tenant={moduleLockTarget}
          modules={modules}
          onSave={onModuleSave}
          onClose={() => setModuleLockTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────

const DEFAULT_MODULES: ModuleItem[] = [
  { key: 'sites', label: 'Sites' },
  { key: 'lands', label: 'Land' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'clients', label: 'Clients' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Users' },
  { key: 'notifications', label: 'Notifications' },
];

export default function AdminPage() {
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'overview' | 'companies'>('overview');

  // Overview state
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Companies state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Reference data
  const [modules, setModules] = useState<ModuleItem[]>(DEFAULT_MODULES);
  const [plans, setPlans] = useState<Plan[]>([]);

  // ─ Fetch functions ─

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/admin/tenants/stats/overview');
      setStats(data.data || data);
    } catch (err) {
      toast.error('Failed to load platform stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTenants = useCallback(
    async (p = page, s = search, f = statusFilter) => {
      setTenantsLoading(true);
      try {
        const params: Record<string, string | number> = { page: p, limit: 20 };
        if (s) params.search = s;
        if (f && f !== 'all') params.status = f;
        const { data } = await api.get('/admin/tenants', { params });
        setTenants(data.data || []);
        setPagination(data.pagination || null);
      } catch (err) {
        toast.error('Failed to load companies');
      } finally {
        setTenantsLoading(false);
      }
    },
    [page, search, statusFilter]
  );

  const fetchModules = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/tenants/modules/list');
      if (Array.isArray(data.data) && data.data.length > 0) {
        setModules(data.data);
      }
    } catch {
      // use defaults
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/tenants/plans/all');
      setPlans(data.data || []);
    } catch {
      // ignore
    }
  }, []);

  // ─ Effects ─

  useEffect(() => {
    fetchStats();
    fetchModules();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (tab === 'companies') {
      fetchTenants(page, search, statusFilter);
    }
  }, [tab, page, statusFilter]);

  // Debounced search
  useEffect(() => {
    if (tab !== 'companies') return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchTenants(1, search, statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ─ Actions ─

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/tenants/${id}/status`, { status });
      toast.success(`Company ${status === 'active' ? 'activated' : 'suspended'}`);
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModuleSave = async (id: string, locked: string[]) => {
    try {
      await api.patch(`/admin/tenants/${id}/modules`, {
        lockedModules: locked.join(','),
      });
      toast.success('Module settings saved');
      fetchTenants();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save module settings');
    }
  };

  const handleSubscriptionUpdate = async (id: string, planId: string, endDate: string) => {
    try {
      const payload: Record<string, string> = { endDate, status: 'active' };
      if (planId) payload.planId = planId;
      await api.patch(`/admin/tenants/${id}/subscription`, payload);
      toast.success('Subscription updated');
      fetchTenants();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update subscription');
    }
  };

  // ─ Guard ─

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-gray-300" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Access Denied</h2>
        <p className="text-sm text-gray-500">
          You do not have super admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#f26f31]" />
            Super Admin
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all companies and platform settings
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            if (tab === 'companies') fetchTenants();
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'overview'
              ? 'border-[#f26f31] text-[#f26f31]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('companies')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'companies'
              ? 'border-[#f26f31] text-[#f26f31]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Companies
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <OverviewTab stats={stats} recentTenants={tenants.length > 0 ? tenants : []} loading={statsLoading} />
      )}
      {tab === 'companies' && (
        <CompaniesTab
          tenants={tenants}
          pagination={pagination}
          loading={tenantsLoading}
          search={search}
          statusFilter={statusFilter}
          modules={modules}
          plans={plans}
          onSearchChange={setSearch}
          onStatusFilterChange={(s) => {
            setStatusFilter(s);
            setPage(1);
          }}
          onPageChange={setPage}
          onStatusChange={handleStatusChange}
          onModuleSave={handleModuleSave}
          onSubscriptionUpdate={handleSubscriptionUpdate}
        />
      )}
    </div>
  );
}
