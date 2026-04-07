import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Building2, FileBarChart, TrendingUp, IndianRupee,
  Clock, AlertTriangle, Users, HardHat, CalendarDays,
  Package, ArrowRight, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const BRAND = '#f26f31';
const SECONDARY = '#ACA9A9';

const EXPENSE_TYPE_COLORS: Record<string, string> = {
  material: '#f26f31',
  labor: '#ACA9A9',
  commission: '#8B5CF6',
  transport: '#c9531a',
  rental: '#7A7878',
  miscellaneous: '#D4D2D2',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1400px] mx-auto">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[106px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[380px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => toast.error(t('common.error')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return null;

  const stats = data.stats || {};
  const charts = data.charts || {};
  const budgetOverrunSites = data.budgetOverrunSites || [];

  /* ---------- Quick Actions ---------- */
  const quickActions = [
    {
      title: t('dashboard.addExpense'),
      description: t('dashboard.addExpenseDesc', { defaultValue: 'Record a new site expense' }),
      icon: Plus,
      to: '/app/expenses/add',
      color: '#f26f31',
      bg: 'bg-orange-50',
    },
    {
      title: t('dashboard.addSite'),
      description: t('dashboard.addSiteDesc', { defaultValue: 'Set up a new construction site' }),
      icon: Building2,
      to: '/app/sites',
      color: '#8B5CF6',
      bg: 'bg-purple-50',
    },
    {
      title: t('dashboard.viewReports'),
      description: t('dashboard.viewReportsDesc', { defaultValue: 'Analyze costs and progress' }),
      icon: FileBarChart,
      to: '/app/reports',
      color: '#10B981',
      bg: 'bg-emerald-50',
    },
  ];

  /* ---------- Stat Cards ---------- */
  const statCards = [
    { label: t('dashboard.totalSites'), value: stats.totalSites ?? 0, icon: Building2, color: '#f26f31', bg: 'bg-orange-50' },
    { label: t('dashboard.activeSites'), value: stats.activeSites ?? 0, icon: HardHat, color: '#10B981', bg: 'bg-emerald-50' },
    { label: t('dashboard.totalSpend'), value: formatCurrency(stats.totalSpend ?? 0), icon: IndianRupee, color: '#8B5CF6', bg: 'bg-purple-50' },
    { label: t('dashboard.totalMaterialSpend'), value: formatCurrency(stats.materialSpend ?? 0), icon: Package, color: '#f26f31', bg: 'bg-orange-50' },
    { label: t('dashboard.totalLaborSpend'), value: formatCurrency(stats.laborSpend ?? 0), icon: Users, color: '#F59E0B', bg: 'bg-amber-50' },
    { label: t('dashboard.totalPendingPayments'), value: formatCurrency(stats.pendingPayments ?? 0), icon: Clock, color: '#EF4444', bg: 'bg-red-50' },
    { label: t('dashboard.thisMonthSpend'), value: formatCurrency(stats.thisMonthSpend ?? 0), icon: CalendarDays, color: '#6366F1', bg: 'bg-indigo-50' },
    { label: t('dashboard.todaySpend'), value: formatCurrency(stats.todaySpend ?? 0), icon: TrendingUp, color: '#14B8A6', bg: 'bg-teal-50' },
  ];

  /* ---------- Chart Data ---------- */
  const categoryData = (charts.categoryBreakdown || []).map((c: any) => ({
    name: c.expenseType || 'other',
    value: c._sum?.totalAmount ?? 0,
    fill: EXPENSE_TYPE_COLORS[c.expenseType] || SECONDARY,
  }));

  const topSitesData = (charts.topCostSites || [])
    .filter((s: any) => s.site)
    .map((s: any) => ({
      name: s.site.siteName,
      amount: s._sum?.totalAmount ?? 0,
    }));

  const monthlyTrend = charts.monthlyTrend || [];
  const budgetVsActual = charts.budgetVsActual || [];

  const fmtShort = (v: any) => {
    const n = Number(v) || 0;
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return String(n);
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1400px] mx-auto">

      {/* ===== Welcome Section ===== */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {user?.firstName ?? ''}
        </h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* ===== Quick Action Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="group">
              <div className="relative flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', action.bg)}>
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ===== Stat Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Thin colored top border */}
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl" style={{ backgroundColor: card.color }} />

              <div className="flex items-center gap-4">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', card.bg)}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Charts 2x2 Grid ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Monthly Trend — Area Chart */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.monthlyTrend')}</h3>
          </div>
          <div className="px-6 pb-6">
            {monthlyTrend.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={fmtShort}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Amount']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={BRAND}
                    fill="url(#brandGradient)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: BRAND, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown — Donut */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.categoryBreakdown')}</h3>
          </div>
          <div className="px-6 pb-6">
            {categoryData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {categoryData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v) || 0), '']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 justify-center">
                  {categoryData.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.fill }}
                      />
                      <span className="text-muted-foreground capitalize">
                        {String(t(`expenses.types.${c.name}`))}
                      </span>
                      <span className="font-semibold text-foreground">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Cost Sites — Horizontal Bars */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.topCostSites')}</h3>
          </div>
          <div className="px-6 pb-6">
            {topSitesData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSitesData} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={fmtShort}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Spent']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill={BRAND} radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Budget vs Actual — Grouped Vertical Bars */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.budgetVsActual')}</h3>
          </div>
          <div className="px-6 pb-6">
            {budgetVsActual.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={budgetVsActual} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="siteName"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={fmtShort}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v) || 0), '']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="budget" name="Budget" fill={BRAND} radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="actual" name="Actual" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Custom Legend for Budget vs Actual */}
                <div className="mt-3 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: BRAND }} />
                    <span className="text-muted-foreground">Budget</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-muted-foreground">Actual</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== Budget Overrun Section ===== */}
      {budgetOverrunSites.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">
              {t('dashboard.allWithinBudget', { defaultValue: 'All sites are within budget' })}
            </p>
            <p className="text-xs text-emerald-600/80 mt-0.5">
              {t('dashboard.noBudgetOverruns', { defaultValue: 'No budget overruns detected' })}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 p-6 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t('dashboard.budgetOverrunSites')}</h3>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {budgetOverrunSites.map((item: any) => (
              <Link
                key={item.id}
                to={`/app/sites/${item.id}`}
                className="group flex items-center justify-between rounded-lg border border-red-100 bg-red-50/40 p-4 transition-all hover:bg-red-50 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.siteName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Budget: {formatCurrency(item.estimatedBudget)} &middot; Spent: {formatCurrency(item.actualSpend)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-sm font-bold text-red-600">+{item.overrunPercent}%</span>
                  <ArrowRight className="h-4 w-4 text-red-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
