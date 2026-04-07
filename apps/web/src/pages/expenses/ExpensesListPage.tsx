import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, expenseTypeColors } from '@/lib/utils';
import { BillPlaceholder, EmptyState } from '@/components/common/Placeholders';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileText,
  Filter,
  Receipt,
} from 'lucide-react';

const expenseTypeEmoji: Record<string, string> = {
  material: '\u{1F4E6}',
  labor: '\u{1F477}',
  transport: '\u{1F69B}',
  rental: '\u2699\uFE0F',
  commission: '\u{1F4BC}',
  miscellaneous: '\u{1F4CB}',
};

const paymentStatusIcon: Record<string, string> = {
  paid: '\u2705',
  partially_paid: '\u23F3',
  unpaid: '\u274C',
};

const EXPENSE_TYPES = ['all', 'material', 'labor', 'commission', 'transport', 'rental', 'miscellaneous'];
const PAYMENT_STATUSES = ['all', 'paid', 'partially_paid', 'unpaid'];

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'partially_paid': return 'warning' as const;
    case 'unpaid': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

export default function ExpensesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Fetch sites for dropdown
  useEffect(() => {
    api.get('/sites', { params: { limit: 100 } })
      .then((res) => setSites(res.data.data || []))
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (search) params.search = search;
        if (siteFilter !== 'all') params.siteId = siteFilter;
        if (typeFilter !== 'all') params.expenseType = typeFilter;
        if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;

        const res = await api.get('/expenses', { params });
        setExpenses(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, siteFilter, typeFilter, paymentFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Receipt className="h-6 w-6 text-[#f26f31]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('expenses.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {total} {t('common.results')}
              </span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/app/expenses/add')}
          className="bg-[#f26f31] hover:bg-[#c9531a] shadow-md"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('expenses.addExpense')}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Search + Site dropdown */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search') + '...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <select
              value={siteFilter}
              onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30 min-w-[160px]"
            >
              <option value="all">{t('common.all')} {t('expenses.site')}</option>
              {sites.map((s: any) => (
                <option key={s.id} value={s.id}>{s.siteName}</option>
              ))}
            </select>
          </div>

          {/* Expense type pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Filter className="h-3 w-3" />
              {t('expenses.expenseType')}
            </div>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_TYPES.map((et) => (
                <button
                  key={et}
                  onClick={() => { setTypeFilter(et); setPage(1); }}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border',
                    typeFilter === et
                      ? 'bg-[#f26f31] text-white border-[#f26f31] shadow-sm'
                      : 'bg-background border-input hover:border-[#f26f31]/40 hover:bg-orange-50 text-muted-foreground'
                  )}
                >
                  {et === 'all' ? (
                    t('common.all')
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{expenseTypeEmoji[et] || ''}</span>
                      <span
                        className="h-2 w-2 rounded-full inline-block"
                        style={{ backgroundColor: expenseTypeColors[et] || '#6B7280' }}
                      />
                      {t(`expenses.types.${et}`)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment status pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <IndianRupee className="h-3 w-3" />
              {t('expenses.paymentStatus')}
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((ps) => {
                const colors: Record<string, string> = {
                  all: '',
                  paid: 'bg-green-500',
                  partially_paid: 'bg-amber-500',
                  unpaid: 'bg-red-500',
                };
                return (
                  <button
                    key={ps}
                    onClick={() => { setPaymentFilter(ps); setPage(1); }}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border',
                      paymentFilter === ps
                        ? 'bg-[#f26f31] text-white border-[#f26f31] shadow-sm'
                        : 'bg-background border-input hover:border-[#f26f31]/40 hover:bg-orange-50 text-muted-foreground'
                    )}
                  >
                    {ps === 'all' ? (
                      t('common.all')
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm leading-none">{paymentStatusIcon[ps] || ''}</span>
                        <span className={cn('h-2 w-2 rounded-full inline-block', colors[ps])} />
                        {t(`expenses.paymentStatuses.${ps}`)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="space-y-0">
              {/* Header skeleton */}
              <div className="h-12 border-b bg-muted/30" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b p-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted flex-1" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted flex-1" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : expenses.length === 0 ? (
        /* Empty State */
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={<BillPlaceholder size="lg" />}
              title={t('expenses.noExpenses')}
              description={t('expenses.noExpensesDesc')}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3.5">{t('common.date')}</th>
                      <th className="p-3.5">{t('expenses.expenseNumber')}</th>
                      <th className="p-3.5">{t('expenses.site')}</th>
                      <th className="p-3.5">{t('expenses.itemName')}</th>
                      <th className="p-3.5">{t('expenses.expenseType')}</th>
                      <th className="p-3.5">{t('common.category', 'Category')}</th>
                      <th className="p-3.5 text-right">{t('expenses.quantity')}</th>
                      <th className="p-3.5 text-right">{t('expenses.rate')}</th>
                      <th className="p-3.5 text-right">{t('common.amount')}</th>
                      <th className="p-3.5">{t('expenses.paymentStatus')}</th>
                      <th className="p-3.5">{t('expenses.vendor')}</th>
                      <th className="p-3.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp: any, index: number) => (
                      <tr
                        key={exp.id}
                        className={cn(
                          'border-b last:border-0 transition-colors',
                          index % 2 === 0 ? 'bg-white' : 'bg-muted/20',
                          exp.vendorId && 'cursor-pointer hover:bg-[#f26f31]/5'
                        )}
                        onClick={() => exp.vendorId && navigate(`/app/vendors/${exp.vendorId}`)}
                      >
                        <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-[#f26f31]">
                            {exp.expenseNumber}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-[160px]">
                          <div className="truncate font-medium">{exp.site?.siteName || '-'}</div>
                          <div className="truncate text-xs text-muted-foreground">{exp.site?.siteCode || ''}</div>
                        </td>
                        <td className="p-3.5 max-w-[180px] truncate font-medium">
                          {exp.itemName}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-base leading-none">{expenseTypeEmoji[exp.expenseType] || '\u{1F4CB}'}</span>
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: expenseTypeColors[exp.expenseType] || '#6B7280' }}
                            />
                            <span className="text-xs">{t(`expenses.types.${exp.expenseType}`)}</span>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-[120px] truncate text-xs text-muted-foreground">
                          {exp.category?.name || '-'}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap text-muted-foreground">
                          {exp.quantity} {t(`expenses.units.${exp.unit}`, exp.unit)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap text-muted-foreground">
                          {formatCurrency(exp.rate)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <span className="text-sm font-bold">{formatCurrency(exp.totalAmount)}</span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={paymentBadgeVariant(exp.paymentStatus)} className="text-[10px]">
                            <span className="mr-1">{paymentStatusIcon[exp.paymentStatus] || ''}</span>
                            {t(`expenses.paymentStatuses.${exp.paymentStatus}`)}
                          </Badge>
                        </td>
                        <td className="p-3.5 max-w-[150px]">
                          {exp.vendor?.name ? (
                            <span className="inline-flex items-center gap-1 text-[#f26f31] font-medium hover:underline">
                              {exp.vendor.name}
                              <span className="text-xs">→</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm('Delete this expense?')) return;
                              try {
                                await api.delete(`/expenses/${exp.id}`);
                                toast.success('Expense deleted');
                                setExpenses(expenses.filter((x: any) => x.id !== exp.id));
                                setTotal(t => t - 1);
                              } catch { toast.error('Failed to delete'); }
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {t('common.page', 'Page')} {page} / {totalPages} ({total} {t('common.results')})
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous', 'Prev')}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'h-8 w-8 rounded-lg text-xs font-medium transition-all',
                          page === pageNum
                            ? 'bg-[#f26f31] text-white shadow-sm'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl"
                >
                  {t('common.next', 'Next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
