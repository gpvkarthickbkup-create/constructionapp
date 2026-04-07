import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { PrintHeader, PrintFooter } from '@/components/common/PrintButton';
import {
  Building2,
  Layers,
  UserCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Printer,
  Filter,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

type ReportType = 'site-wise' | 'category-wise' | 'vendor-wise' | 'pending-payments' | 'budget-vs-actual' | 'monthly-spending' | 'date-wise' | 'gst-report' | null;

const reportCards = [
  { type: 'site-wise' as ReportType, icon: Building2, titleKey: 'reports.siteWiseExpense', desc: 'Total expense breakdown for each construction site.' },
  { type: 'category-wise' as ReportType, icon: Layers, titleKey: 'reports.materialWise', desc: 'Spending by material, labor, and other categories.' },
  { type: 'vendor-wise' as ReportType, icon: UserCircle, titleKey: 'reports.vendorWise', desc: 'Payments and pending dues per vendor.' },
  { type: 'pending-payments' as ReportType, icon: Clock, titleKey: 'reports.pendingPayment', desc: 'All unpaid and partially paid expense entries.' },
  { type: 'budget-vs-actual' as ReportType, icon: BarChart3, titleKey: 'reports.budgetVsActual', desc: 'Compare estimated budgets vs actual spend.' },
  { type: 'monthly-spending' as ReportType, icon: CalendarDays, titleKey: 'reports.monthlySpending', desc: 'Monthly spending trends across all sites.' },
  { type: 'date-wise' as ReportType, icon: Calendar, titleKey: 'reports.dateWiseExpense', desc: 'Daily expense log within a date range.' },
  { type: 'gst-report' as ReportType, icon: FileText, titleKey: 'reports.gstReport', desc: 'View GST charges on all expenses' },
];

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'partially_paid': return 'warning' as const;
    case 'unpaid': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [sites, setSites] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    fetchSitesForFilter();
  }, []);

  const fetchSitesForFilter = async () => {
    try {
      const res = await api.get('/sites', { params: { page: 1, limit: 100 } });
      setSites(res.data.data || []);
    } catch {
      // silent
    }
  };

  const fetchReport = async (type: ReportType) => {
    if (!type) return;
    setLoading(true);
    setReportData([]);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (siteFilter) params.siteId = siteFilter;

      let endpoint = '';
      switch (type) {
        case 'site-wise': endpoint = '/reports/site-wise'; break;
        case 'category-wise': endpoint = '/reports/category-wise'; break;
        case 'vendor-wise': endpoint = '/reports/vendor-wise'; break;
        case 'pending-payments': endpoint = '/reports/pending-payments'; break;
        case 'budget-vs-actual': endpoint = '/reports/budget-vs-actual'; break;
        case 'monthly-spending':
          endpoint = '/reports/monthly-spending';
          params.year = yearFilter;
          break;
        case 'date-wise': endpoint = '/reports/date-wise'; break;
        case 'gst-report': endpoint = '/reports/date-wise'; break;
      }

      const res = await api.get(endpoint, { params });
      let data = res.data.data || [];
      if (type === 'gst-report') {
        data = data.filter((row: any) => (row.gstPercent && row.gstPercent > 0) || (row.gstAmount && row.gstAmount > 0));
      }
      setReportData(data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport) {
      fetchReport(activeReport);
    }
  }, [activeReport]);

  const handleGenerate = () => {
    if (activeReport) fetchReport(activeReport);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    setActiveReport(null);
    setReportData([]);
  };

  // ============ REPORT HUB VIEW ============
  if (!activeReport) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {t('reports.title', 'Reports')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('reports.generate', 'Generate detailed reports for your construction projects')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.type}
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border-0 shadow-md group overflow-hidden"
                onClick={() => setActiveReport(report.type)}
              >
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-[#f26f31] transition-colors duration-200">
                        <Icon className="h-5 w-5 text-[#f26f31] group-hover:text-white transition-colors duration-200" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-50 group-hover:text-[#f26f31] transition-colors">
                          {t(report.titleKey)}
                        </h3>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-[#f26f31] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{report.desc}</p>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-[#f26f31] to-[#c9531a] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ============ ACTIVE REPORT VIEW ============
  const activeReportConfig = reportCards.find((r) => r.type === activeReport);
  const showSiteFilter = ['date-wise', 'category-wise', 'gst-report'].includes(activeReport);
  const showYearFilter = activeReport === 'monthly-spending';
  const showDateFilter = activeReport !== 'monthly-spending';

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PrintHeader />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-xl h-10 w-10 hover:bg-orange-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {activeReportConfig ? t(activeReportConfig.titleKey) : ''}
            </h1>
            <p className="text-sm text-muted-foreground">{activeReportConfig?.desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-9">
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {t('common.print', 'Print')}
          </Button>
          <Button variant="outline" size="sm" disabled className="rounded-xl h-9 opacity-50">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {t('reports.exportPDF', 'PDF')}
          </Button>
          <Button variant="outline" size="sm" disabled className="rounded-xl h-9 opacity-50">
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            {t('reports.exportExcel', 'Excel')}
          </Button>
          <Button variant="outline" size="sm" disabled className="rounded-xl h-9 opacity-50">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('reports.exportCSV', 'CSV')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground mr-1 self-center">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{t('common.filters', 'Filters')}</span>
          </div>
          {showDateFilter && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('common.from', 'From')}</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-44 h-10 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('common.to', 'To')}</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-44 h-10 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                />
              </div>
            </>
          )}
          {showYearFilter && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('common.year', 'Year')}</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/20 focus:border-[#f26f31]"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
          {showSiteFilter && sites.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('expenses.site', 'Site')}</label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/20 focus:border-[#f26f31]"
              >
                <option value="">{t('common.all', 'All')} {t('sites.title', 'Sites')}</option>
                {sites.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.siteName}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="h-10 px-6 bg-[#f26f31] hover:bg-[#c9531a] rounded-xl text-white shadow-md shadow-[#f26f31]/20 self-end"
          >
            {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('reports.generate', 'Generate')}
          </Button>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-0">
            <div className="space-y-0">
              <div className="h-12 animate-pulse bg-muted/50 rounded-t-xl" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn('h-12 animate-pulse', i % 2 === 0 ? 'bg-muted/20' : 'bg-muted/30')} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : reportData.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-[#f26f31]/40" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('reports.noReportData', 'No data found')}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
              {t('reports.noReportDataDesc', 'Try adjusting your filters or date range to find results.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">

              {/* ========== SITE-WISE ========== */}
              {activeReport === 'site-wise' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sites.siteName', 'Site Name')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sites.siteCode', 'Code')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.status', 'Status')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('sites.estimatedBudget', 'Budget')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('dashboard.totalSpend', 'Total Spend')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('expenses.paidAmount', 'Paid')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('expenses.dueAmount', 'Due')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.count', 'Entries')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => (
                      <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                        <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.site?.siteName || row.siteName || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{row.site?.siteCode || row.siteCode || '-'}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={row.site?.status === 'active' || row.status === 'active' ? 'info' : (row.site?.status || row.status) === 'completed' ? 'success' : 'secondary'} className="text-xs">
                            {row.site?.status || row.status || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.site?.estimatedBudget || row.estimatedBudget || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(row.totalAmount || row.totalSpend || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-green-600">{formatCurrency(row.paidAmount || row.paid || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-red-600">{formatCurrency(row.dueAmount || row.pendingPayments || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{row.entryCount || row.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={3}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.site?.estimatedBudget || r.estimatedBudget || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || r.totalSpend || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-green-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.paidAmount || r.paid || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.dueAmount || r.pendingPayments || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{reportData.reduce((s: number, r: any) => s + (r.entryCount || r.count || 0), 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== CATEGORY-WISE ========== */}
              {activeReport === 'category-wise' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.categoryColor', 'Color')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.categoryName', 'Category')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.categoryNameTa', 'Tamil Name')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.type', 'Type')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Total Amount')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.quantity', 'Quantity')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.count', 'Entries')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => (
                      <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                        <td className="px-4 py-3.5">
                          <div className="h-4 w-4 rounded-full shadow-sm border border-white" style={{ backgroundColor: row.category?.color || row.color || '#ACA9A9' }} />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.category?.name || row.categoryName || row.name || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{row.category?.nameTa || row.nameTa || '-'}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="capitalize text-xs font-medium">{row.category?.type || row.type || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(row.totalAmount || row.total || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{row.totalQuantity || row.quantity || 0}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{row.entryCount || row.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={4}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || r.total || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{reportData.reduce((s: number, r: any) => s + (r.totalQuantity || r.quantity || 0), 0)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{reportData.reduce((s: number, r: any) => s + (r.entryCount || r.count || 0), 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== VENDOR-WISE ========== */}
              {activeReport === 'vendor-wise' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('vendors.vendorName', 'Vendor')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('vendors.vendorCode', 'Code')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.type', 'Type')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.mobile', 'Mobile')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Total')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('vendors.totalPaid', 'Paid')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('vendors.totalPending', 'Due')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.count', 'Entries')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => (
                      <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                        <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.vendor?.name || row.vendorName || row.name || '-'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{row.vendor?.vendorCode || row.vendorCode || '-'}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="capitalize text-xs font-medium">{row.vendor?.type || row.type || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{row.vendor?.mobile || row.mobile || '-'}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(row.totalAmount || row.total || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-green-600">{formatCurrency(row.paidAmount || row.paid || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-red-600">{formatCurrency(row.dueAmount || row.pending || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{row.entryCount || row.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={4}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || r.total || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-green-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.paidAmount || r.paid || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.dueAmount || r.pending || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{reportData.reduce((s: number, r: any) => s + (r.entryCount || r.count || 0), 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== PENDING PAYMENTS ========== */}
              {activeReport === 'pending-payments' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.expenseNumber', '#')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.date', 'Date')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.site', 'Site')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.vendor', 'Vendor')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.itemName', 'Item')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Total')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('expenses.dueAmount', 'Due')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.paymentStatus', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => (
                      <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                        <td className="px-4 py-3.5 font-medium font-mono text-xs text-[#f26f31]">{row.expenseNumber || '-'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">{row.expenseDate ? formatDate(row.expenseDate) : row.date ? formatDate(row.date) : '-'}</td>
                        <td className="px-4 py-3.5">{row.site?.siteName || row.siteName || '-'}</td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p>{row.vendor?.name || row.vendorName || '-'}</p>
                            {(row.vendor?.mobile || row.vendorMobile) && (
                              <p className="text-xs text-muted-foreground">{row.vendor?.mobile || row.vendorMobile}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{row.itemName || '-'}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.totalAmount || 0)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-red-600">{formatCurrency(row.dueAmount || 0)}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={paymentBadgeVariant(row.paymentStatus)} className="text-xs">
                            {t(`expenses.paymentStatuses.${row.paymentStatus}`, row.paymentStatus || '-')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={5}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-red-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.dueAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5" />
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== BUDGET VS ACTUAL ========== */}
              {activeReport === 'budget-vs-actual' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sites.siteName', 'Site')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sites.siteCode', 'Code')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.status', 'Status')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('sites.estimatedBudget', 'Budget')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.actualTotal', 'Actual Total')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.actualMaterial', 'Material')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.actualLabor', 'Labor')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.actualOther', 'Other')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.variance', 'Variance')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('sites.budgetUsed', '% Used')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => {
                      const budget = row.estimatedBudget || 0;
                      const actualTotal = row.actual?.total || row.totalSpend || row.actualTotal || 0;
                      const varianceTotal = row.variance?.total ?? (budget - actualTotal);
                      const pctUsed = row.budgetUsedPercent ?? (budget > 0 ? Math.round((actualTotal / budget) * 100) : 0);
                      return (
                        <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.siteName || '-'}</td>
                          <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{row.siteCode || '-'}</td>
                          <td className="px-4 py-3.5">
                            <Badge variant={row.status === 'active' ? 'info' : row.status === 'completed' ? 'success' : 'secondary'} className="text-xs">
                              {row.status || '-'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(budget)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(actualTotal)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.actual?.material || row.materialSpend || row.actualMaterial || 0)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.actual?.labor || row.laborSpend || row.actualLabor || 0)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.actual?.other || row.otherSpend || row.actualOther || 0)}</td>
                          <td className={cn('px-4 py-3.5 text-right tabular-nums font-semibold', varianceTotal >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {varianceTotal >= 0 ? '+' : ''}{formatCurrency(varianceTotal)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={cn(
                              'inline-flex items-center gap-1 font-semibold',
                              pctUsed > 100 ? 'text-red-600' : pctUsed >= 80 ? 'text-yellow-600' : 'text-green-600'
                            )}>
                              {pctUsed > 100 && <TrendingUp className="h-3 w-3" />}
                              {pctUsed}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={3}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.estimatedBudget || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.actual?.total || r.totalSpend || r.actualTotal || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.actual?.material || r.materialSpend || r.actualMaterial || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.actual?.labor || r.laborSpend || r.actualLabor || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.actual?.other || r.otherSpend || r.actualOther || 0), 0))}</td>
                      <td className="px-4 py-3.5" colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== MONTHLY SPENDING ========== */}
              {activeReport === 'monthly-spending' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('reports.month', 'Month')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Total')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('dashboard.totalMaterialSpend', 'Material')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('dashboard.totalLaborSpend', 'Labor')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('sites.otherCost', 'Other')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => {
                      const monthName = row.month || (row.monthNumber ? MONTHS[(row.monthNumber - 1) % 12] : '-');
                      return (
                        <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{monthName}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(row.total || row.totalAmount || 0)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.material || row.materialAmount || 0)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.labor || row.laborAmount || 0)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(row.other || row.otherAmount || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50">{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.total || r.totalAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.material || r.materialAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.labor || r.laborAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.other || r.otherAmount || 0), 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== DATE-WISE ========== */}
              {activeReport === 'date-wise' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.date', 'Date')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.expenseNumber', '#')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.site', 'Site')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.vendor', 'Vendor')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.categoryName', 'Category')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.itemName', 'Item')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.type', 'Type')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('expenses.quantity', 'Qty')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Amount')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.paymentStatus', 'Status')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.createdBy', 'Created By')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => (
                      <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">{row.expenseDate ? formatDate(row.expenseDate) : row.date ? formatDate(row.date) : '-'}</td>
                        <td className="px-4 py-3.5 font-medium font-mono text-xs text-[#f26f31]">{row.expenseNumber || '-'}</td>
                        <td className="px-4 py-3.5">{row.site?.siteName || row.siteName || '-'}</td>
                        <td className="px-4 py-3.5">{row.vendor?.name || row.vendorName || '-'}</td>
                        <td className="px-4 py-3.5">{row.category?.name || row.categoryName || '-'}</td>
                        <td className="px-4 py-3.5">{row.itemName || '-'}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="text-xs capitalize font-medium">{row.expenseType || row.type || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{row.quantity || '-'}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(row.totalAmount || 0)}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={paymentBadgeVariant(row.paymentStatus)} className="text-xs">
                            {t(`expenses.paymentStatuses.${row.paymentStatus}`, row.paymentStatus || '-')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">{row.creator?.firstName || row.createdBy || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={8}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5" colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ========== GST REPORT ========== */}
              {activeReport === 'gst-report' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.date', 'Date')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.expenseNumber', 'Expense #')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.itemName', 'Item')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('common.total', 'Total Amount')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.gstPercent', 'GST %')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.gstAmount', 'GST Amount')}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('reports.grandTotal', 'Grand Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row: any, idx: number) => {
                      const totalAmt = row.totalAmount || 0;
                      const gstPct = row.gstPercent || 0;
                      const gstAmt = row.gstAmount || (totalAmt * gstPct / 100);
                      const grandTotal = totalAmt + gstAmt;
                      return (
                        <tr key={idx} className={cn('border-b last:border-0 transition-colors hover:bg-orange-50/30', idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10')}>
                          <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">{row.expenseDate ? formatDate(row.expenseDate) : row.date ? formatDate(row.date) : '-'}</td>
                          <td className="px-4 py-3.5 font-medium font-mono text-xs text-[#f26f31]">{row.expenseNumber || '-'}</td>
                          <td className="px-4 py-3.5">{row.itemName || '-'}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(totalAmt)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums">{gstPct}%</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-blue-600 font-semibold">{formatCurrency(gstAmt)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(grandTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:bg-muted/30">
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-50" colSpan={3}>{t('common.total', 'Total')}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0))}</td>
                      <td className="px-4 py-3.5" />
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-blue-600">{formatCurrency(reportData.reduce((s: number, r: any) => s + (r.gstAmount || (r.totalAmount || 0) * (r.gstPercent || 0) / 100), 0))}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold">{formatCurrency(reportData.reduce((s: number, r: any) => { const t = r.totalAmount || 0; const g = r.gstAmount || (t * (r.gstPercent || 0) / 100); return s + t + g; }, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

            </div>
          </CardContent>
        </Card>
      )}

      <PrintFooter />
    </div>
  );
}
