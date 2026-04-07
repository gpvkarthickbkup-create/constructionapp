import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, amountToWords } from '@/lib/utils';
import { SitePlaceholder, EmptyState } from '@/components/common/Placeholders';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MapPin,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  IndianRupee,
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'planning', 'active', 'on_hold', 'completed'];

const statusLabels: Record<string, string> = {
  planning: 'sites.planning',
  active: 'common.active',
  on_hold: 'sites.onHold',
  completed: 'sites.completed',
  cancelled: 'sites.cancelled',
};

const PROJECT_TYPE_OPTIONS = ['all', 'house', 'villa', 'apartment', 'commercial', 'renovation', 'interior', 'other'];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'info' as const;
    case 'completed': return 'success' as const;
    case 'on_hold': return 'warning' as const;
    case 'cancelled': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const statusDotColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'completed': return 'bg-emerald-500';
    case 'on_hold': return 'bg-yellow-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

export default function SitesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sites, setSites] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (search) params.search = search;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.projectType = typeFilter;
        const res = await api.get('/sites', { params });
        setSites(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('sites.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {t('common.results')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/sites/new')}
          className="bg-[#f26f31] hover:bg-[#c9531a] shadow-md"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('sites.addSite')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search') + '...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? t('common.all') + ' ' + t('common.status') : t(statusLabels[s] || s)}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
            >
              {PROJECT_TYPE_OPTIONS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt === 'all' ? t('common.all') + ' ' + t('sites.projectType') : t(`sites.projectTypes.${pt}`)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-36 animate-pulse bg-gradient-to-br from-orange-50 to-orange-100" />
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        /* Empty State */
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={<SitePlaceholder size="lg" />}
              title={t('sites.noSites')}
              description={t('sites.noSitesDesc')}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Site Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site: any) => {
              const budget = site.estimatedBudget || 0;
              return (
                <Card
                  key={site.id}
                  className="cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group border-0 shadow-md"
                  onClick={() => navigate(`/app/sites/${site.id}`)}
                >
                  {/* Cover Image / Gradient Placeholder */}
                  <div className="relative h-36 bg-gradient-to-br from-[#f26f31]/10 via-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                    {site.coverImage && site.coverImage.trim() !== '' ? (
                      <img src={site.coverImage} alt={site.siteName} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <SitePlaceholder size="lg" className="opacity-60 group-hover:opacity-80 transition-opacity" />
                    )}
                    {/* Status badge overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge variant={statusBadgeVariant(site.status)} className="shadow-sm">
                        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full inline-block', statusDotColor(site.status))} />
                        {t(statusLabels[site.status] || site.status)}
                      </Badge>
                    </div>
                    {/* Site code overlay */}
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-mono text-white">
                        {site.siteCode}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Site name */}
                    <h3 className="font-bold text-base truncate group-hover:text-[#f26f31] transition-colors">
                      {site.siteName}
                    </h3>

                    {/* Info rows */}
                    <div className="mt-3 space-y-2">
                      {/* Client */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0 text-[#ACA9A9]" />
                        <span className="truncate">{site.clientName || '-'}</span>
                      </div>

                      {/* Project type pill */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize rounded-lg">
                          {t(`sites.projectTypes.${site.projectType}`, site.projectType)}
                        </Badge>
                        {site.startDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(site.startDate)}
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      {site.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ACA9A9]" />
                          <span className="truncate">{site.address}</span>
                        </div>
                      )}
                      {/* SQFT info */}
                      {site.totalSqft > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>📐</span>
                          <span>{site.totalSqft} Sq.ft</span>
                          {site.ratePerSqft > 0 && <span>@ ₹{site.ratePerSqft}/sqft</span>}
                        </div>
                      )}
                    </div>

                    {/* Budget section */}
                    {/* Budget + Spent */}
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('sites.estimatedBudget')}</p>
                          <p className="text-sm font-bold text-[#f26f31]">{formatCurrency(budget)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.totalSpend', 'Spent')}</p>
                          <p className="text-sm font-bold text-gray-700">{formatCurrency(site.totalSpent || 0)}</p>
                        </div>
                      </div>
                      {budget > 0 && (() => {
                        const pct = Math.round(((site.totalSpent || 0) / budget) * 100);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-medium text-muted-foreground">{pct}% used</span>
                              <span className={cn('text-[10px] font-bold', pct > 100 ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-green-500')}>
                                {pct > 100 ? '⚠️ Over budget' : pct > 80 ? '⏳ Nearing limit' : '✅ Within budget'}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all',
                                  pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'
                                )}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Dashboard Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/sites/${site.id}`); }}
                      className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#f26f31] text-white py-2.5 text-sm font-semibold hover:bg-[#d4551a] transition-colors"
                    >
                      📊 View Dashboard
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
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
                        'h-8 w-8 rounded-lg text-sm font-medium transition-all',
                        page === pageNum
                          ? 'bg-[#f26f31] text-white shadow-sm'
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-1 text-muted-foreground">...</span>
                )}
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
          )}
        </>
      )}
    </div>
  );
}
