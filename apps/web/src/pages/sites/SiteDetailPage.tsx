import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatCurrency, formatDate, cn, expenseTypeColors, amountToWords } from '@/lib/utils';
import { SitePlaceholder } from '@/components/common/Placeholders';
import { toast } from 'sonner';
import PrintButton, { PrintHeader, PrintFooter } from '@/components/common/PrintButton';
import {
  ArrowLeft, Edit3, Check,
  IndianRupee,
  Package,
  Users,
  Layers,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Plus,
  BarChart3,
  Target,
  Wallet,
} from 'lucide-react';

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'info' as const;
    case 'completed': return 'success' as const;
    case 'on_hold': return 'warning' as const;
    default: return 'secondary' as const;
  }
};

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'partially_paid': return 'warning' as const;
    case 'unpaid': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

export default function SiteDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docCaption, setDocCaption] = useState('');
  const [docType, setDocType] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteSite = async () => {
    if (!confirm('Are you sure you want to delete this site? This cannot be undone.')) return;
    try {
      await api.delete(`/sites/${id}`);
      toast.success('Site deleted');
      navigate('/app/sites');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const changeStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await api.put(`/sites/${id}`, { status: newStatus });
      toast.success(t('sites.siteUpdated'));
      const res = await api.get(`/sites/${id}/dashboard`);
      setData(res.data.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setChangingStatus(false);
    }
  };

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await api.get(`/sites/${id}/dashboard`);
        setData(res.data.data);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/sites')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const site = data.site;
  const summary = data.summary;

  // Financial calculations
  const customerEstimate = site.customerEstimate || 0;
  const builderEstimate = site.builderEstimate || site.estimatedBudget || 0;
  const saleAmount = site.saleAmount || 0;
  const actualSpent = summary.totalCost || 0;
  const profitLoss = saleAmount > 0 ? saleAmount - actualSpent : 0;
  const profitMarginPercent = saleAmount > 0 ? (profitLoss / saleAmount) * 100 : 0;
  const budgetUsedPercent = builderEstimate > 0 ? Math.round((actualSpent / builderEstimate) * 100) : 0;
  const budgetRemaining = builderEstimate - actualSpent;
  const isOverBudget = actualSpent > builderEstimate && builderEstimate > 0;
  const totalSqft = site.totalSqft || 0;
  const estimatedCostPerSqft = site.builderRatePerSqft || (totalSqft > 0 ? builderEstimate / totalSqft : 0);
  const actualCostPerSqft = totalSqft > 0 ? actualSpent / totalSqft : 0;
  const costPerSqftVariance = actualCostPerSqft - estimatedCostPerSqft;

  const budgetBarColor =
    budgetUsedPercent > 100
      ? 'bg-red-500'
      : budgetUsedPercent >= 80
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PrintHeader />

      {/* Back + Print */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/sites')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
        <PrintButton />
      </div>

      {/* Budget Overrun Alert */}
      {isOverBudget && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Budget Exceeded!</p>
            <p className="text-sm text-red-600">
              Builder Budget: {formatCurrency(builderEstimate)} | Actual Spent: {formatCurrency(actualSpent)} ({budgetUsedPercent}%)
            </p>
          </div>
        </div>
      )}

      {/* Site Header */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden sm:block">
                {site.coverImage ? (
                  <img src={site.coverImage} alt={site.siteName} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <SitePlaceholder size="sm" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{site.siteName}</h1>
                  <Badge variant={statusBadgeVariant(site.status)}>
                    {t(site.status === 'active' ? 'common.active' : `sites.${site.status === 'on_hold' ? 'onHold' : site.status}`)}
                  </Badge>
                  <Badge variant="outline">{t(`sites.projectTypes.${site.projectType}`)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {site.siteCode} &middot; {site.clientName} {site.clientMobile && `· ${site.clientMobile}`}
                </p>
                {site.address && (
                  <p className="text-sm text-muted-foreground mt-0.5">{site.address}</p>
                )}
                {totalSqft > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                      {totalSqft.toLocaleString('en-IN')} Sq.ft
                    </span>
                    {site.customerRatePerSqft > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
                        Customer: {formatCurrency(site.customerRatePerSqft)}/sqft
                      </span>
                    )}
                    {site.builderRatePerSqft > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 border border-orange-200">
                        Builder: {formatCurrency(site.builderRatePerSqft)}/sqft
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 no-print">
              <Button
                size="sm"
                className="bg-[#f26f31] hover:bg-[#c9531a] text-white rounded-xl"
                onClick={() => navigate(`/app/sites/${id}/expenses/add`)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Expense
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#f26f31] text-[#f26f31] hover:bg-[#f26f31]/10 rounded-xl"
                onClick={() => navigate(`/app/sites/${id}/edit`)}
              >
                <Edit3 className="mr-1 h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50 rounded-xl"
                onClick={deleteSite}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {t('common.delete')}
              </Button>
              <select
                value={site.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={changingStatus}
                className="h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="planning">{t('sites.planning')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="on_hold">{t('sites.onHold')}</option>
                <option value="completed">{t('sites.completed')}</option>
                <option value="cancelled">{t('sites.cancelled')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Customer Estimate */}
        {customerEstimate > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer Estimate</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(customerEstimate)}</p>
              <p className="text-xs text-green-600/70 italic mt-1">{amountToWords(customerEstimate)}</p>
            </CardContent>
          </Card>
        )}

        {/* Builder Estimate */}
        {builderEstimate > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <Wallet className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Builder Estimate</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(builderEstimate)}</p>
              <p className="text-xs text-orange-600/70 italic mt-1">{amountToWords(builderEstimate)}</p>
            </CardContent>
          </Card>
        )}

        {/* Sale Amount */}
        {saleAmount > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sale Amount</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(saleAmount)}</p>
              <p className="text-xs text-blue-600/70 italic mt-1">{amountToWords(saleAmount)}</p>
            </CardContent>
          </Card>
        )}

        {/* Actual Spent */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', isOverBudget ? 'bg-red-50' : 'bg-purple-50')}>
                <BarChart3 className={cn('h-5 w-5', isOverBudget ? 'text-red-600' : 'text-purple-600')} />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actual Spent</p>
            </div>
            <p className={cn('text-2xl font-bold', isOverBudget ? 'text-red-700' : 'text-purple-700')}>{formatCurrency(actualSpent)}</p>
            <p className={cn('text-xs italic mt-1', isOverBudget ? 'text-red-600/70' : 'text-purple-600/70')}>{amountToWords(actualSpent)}</p>
          </CardContent>
        </Card>

        {/* Profit / Loss */}
        {saleAmount > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50')}>
                  {profitLoss >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {profitLoss >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <p className={cn('text-2xl font-bold', profitLoss >= 0 ? 'text-green-700' : 'text-red-700')}>
                {formatCurrency(Math.abs(profitLoss))}
              </p>
              <p className={cn('text-xs italic mt-1', profitLoss >= 0 ? 'text-green-600/70' : 'text-red-600/70')}>
                {amountToWords(Math.abs(profitLoss))}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profit Margin */}
        {saleAmount > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', profitMarginPercent >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
                  <TrendingUp className={cn('h-5 w-5', profitMarginPercent >= 0 ? 'text-emerald-600' : 'text-red-600')} />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit Margin</p>
              </div>
              <p className={cn('text-2xl font-bold', profitMarginPercent >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                {profitMarginPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sale Amount - Actual Spent</p>
            </CardContent>
          </Card>
        )}

        {/* Pending Payments */}
        {summary.pendingPayments > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Payments</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.pendingPayments)}</p>
              <p className="text-xs text-red-600/70 italic mt-1">{amountToWords(summary.pendingPayments)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Progress */}
      {builderEstimate > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Budget Progress</h3>
              <span className={cn('text-sm font-bold', isOverBudget ? 'text-red-600' : 'text-green-600')}>
                {budgetUsedPercent}% used
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Builder Budget</span>
              <span className="font-semibold">
                {formatCurrency(actualSpent)} / {formatCurrency(builderEstimate)}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn('h-full rounded-full transition-all', budgetBarColor)}
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Spent: {amountToWords(actualSpent)}</span>
              <span className={cn(isOverBudget ? 'text-red-600 font-semibold' : 'text-green-600')}>
                {isOverBudget
                  ? `Over by ${formatCurrency(Math.abs(budgetRemaining))}`
                  : `Remaining: ${formatCurrency(budgetRemaining)}`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Breakdown */}
      {actualSpent > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <Package className="h-5 w-5 text-[#f26f31]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Material Cost</p>
                  <p className="text-xs text-muted-foreground">
                    {actualSpent > 0 ? ((summary.materialCost / actualSpent) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-[#f26f31]">{formatCurrency(summary.materialCost || 0)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Labor Cost</p>
                  <p className="text-xs text-muted-foreground">
                    {actualSpent > 0 ? ((summary.laborCost / actualSpent) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.laborCost || 0)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <Layers className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Other Cost</p>
                  <p className="text-xs text-muted-foreground">
                    {actualSpent > 0 ? ((summary.otherCost / actualSpent) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-700">{formatCurrency(summary.otherCost || 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost per SQFT Analysis */}
      {totalSqft > 0 && actualSpent > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Cost per Sq.ft Analysis</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
                <p className="text-xs text-orange-700 font-medium uppercase tracking-wider mb-1">Estimated Cost/Sqft</p>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(estimatedCostPerSqft)}</p>
                <p className="text-xs text-orange-600/70">per sq.ft (builder rate)</p>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                <p className="text-xs text-purple-700 font-medium uppercase tracking-wider mb-1">Actual Cost/Sqft</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(actualCostPerSqft)}</p>
                <p className="text-xs text-purple-600/70">per sq.ft (actual spent)</p>
              </div>
              <div className={cn('rounded-xl border p-4', costPerSqftVariance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')}>
                <p className={cn('text-xs font-medium uppercase tracking-wider mb-1', costPerSqftVariance > 0 ? 'text-red-700' : 'text-green-700')}>
                  Variance
                </p>
                <p className={cn('text-xl font-bold', costPerSqftVariance > 0 ? 'text-red-700' : 'text-green-700')}>
                  {costPerSqftVariance > 0 ? '+' : ''}{formatCurrency(costPerSqftVariance)}
                </p>
                <p className={cn('text-xs', costPerSqftVariance > 0 ? 'text-red-600/70' : 'text-green-600/70')}>
                  {costPerSqftVariance > 0 ? 'Over estimated rate' : 'Under estimated rate'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Cost Items */}
      {data.topItems?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('sites.topCostItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topItems.map((item: any, i: number) => {
                const itemAmount = item._sum?.totalAmount || 0;
                const pctOfTotal = actualSpent > 0 ? ((itemAmount / actualSpent) * 100).toFixed(1) : '0';
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{item.itemName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatCurrency(itemAmount)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({pctOfTotal}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('sites.recentExpenses')}</CardTitle>
          <Button
            size="sm"
            className="bg-[#f26f31] hover:bg-[#c9531a] text-white rounded-xl no-print"
            onClick={() => navigate(`/app/sites/${id}/expenses/add`)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {(!data.recentExpenses || data.recentExpenses.length === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('expenses.noExpenses')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t('common.date')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('expenses.expenseNumber')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('expenses.itemName')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('expenses.expenseType')}</th>
                    <th className="pb-2 pr-4 font-medium text-right">{t('common.amount')}</th>
                    <th className="pb-2 pr-4 font-medium">{t('expenses.paymentStatus')}</th>
                    <th className="pb-2 font-medium">{t('expenses.vendor')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentExpenses.map((exp: any, index: number) => (
                    <tr key={exp.id} className={cn('border-b last:border-0 hover:bg-muted/50 transition-colors', index % 2 === 1 && 'bg-muted/20')}>
                      <td className="py-2.5 pr-4">{formatDate(exp.expenseDate)}</td>
                      <td className="py-2.5 pr-4 font-medium">{exp.expenseNumber}</td>
                      <td className="py-2.5 pr-4">{exp.itemName}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: expenseTypeColors[exp.expenseType] || '#6B7280' }}
                          />
                          {t(`expenses.types.${exp.expenseType}`)}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(exp.totalAmount)}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={paymentBadgeVariant(exp.paymentStatus)}>
                          {t(`expenses.paymentStatuses.${exp.paymentStatus}`)}
                        </Badge>
                      </td>
                      <td className="py-2.5">{exp.vendor?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents & Plans */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#f26f31]" />
            {t('sites.documents', 'Documents & Plans')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Form */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap mb-6 p-4 bg-gray-50 rounded-xl no-print">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingDoc(true);
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('caption', docCaption || file.name);
                  formData.append('imageType', docType);
                  await api.post(`/sites/${id}/documents`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  toast.success(t('sites.documentUploaded', 'Document uploaded'));
                  setDocCaption('');
                  setDocType('general');
                  const res = await api.get(`/sites/${id}/dashboard`);
                  setData(res.data.data);
                } catch {
                  toast.error(t('sites.uploadFailed', 'Upload failed'));
                } finally {
                  setUploadingDoc(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('sites.caption', 'Caption')}</label>
              <Input
                value={docCaption}
                onChange={(e) => setDocCaption(e.target.value)}
                placeholder="Document name..."
                className="w-52 h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('common.type', 'Type')}</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-background px-3 text-sm"
              >
                <option value="general">General</option>
                <option value="layout">Plan / Layout</option>
                <option value="progress">Progress</option>
                <option value="cover">Cover</option>
              </select>
            </div>
            <Button
              size="sm"
              className="h-10 px-5 bg-[#f26f31] hover:bg-[#c9531a] rounded-xl text-white"
              disabled={uploadingDoc}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingDoc ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
              {t('common.uploadFile', 'Upload')}
            </Button>
          </div>

          {/* Document Grid */}
          {(!site.siteImages || site.siteImages.length === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('sites.noDocuments', 'No documents uploaded yet')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {site.siteImages.map((img: any) => {
                const isPdf = img.imageUrl?.toLowerCase().endsWith('.pdf');
                const imgSrc = img.imageUrl?.startsWith('/') ? `${api.defaults.baseURL?.replace('/api', '')}${img.imageUrl}` : img.imageUrl;
                return (
                  <div key={img.id} className="group relative rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    {isPdf ? (
                      <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-32 bg-red-50">
                        <FileText className="h-10 w-10 text-red-500" />
                        <span className="text-xs text-red-600 mt-1 font-medium">PDF</span>
                      </a>
                    ) : (
                      <a href={imgSrc} target="_blank" rel="noopener noreferrer">
                        <img src={imgSrc} alt={img.caption || 'Document'} className="h-32 w-full object-cover" />
                      </a>
                    )}
                    <button
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 no-print"
                      title="Delete document"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this?'))) return;
                        try {
                          await api.delete(`/sites/${id}/documents/${img.id}`);
                          toast.success(t('sites.documentDeleted', 'Document deleted'));
                          const res = await api.get(`/sites/${id}/dashboard`);
                          setData(res.data.data);
                        } catch {
                          toast.error(t('sites.deleteFailed', 'Delete failed'));
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 truncate">{img.caption || 'Untitled'}</p>
                      <Badge variant="outline" className="text-[10px] mt-1 capitalize">{img.imageType || 'general'}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PrintFooter />
    </div>
  );
}
