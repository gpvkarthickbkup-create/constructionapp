import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Layers,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'acquired', 'developing', 'developed', 'selling', 'sold_out'];

const statusLabels: Record<string, string> = {
  acquired: 'Acquired',
  developing: 'Developing',
  developed: 'Developed',
  selling: 'Selling',
  sold_out: 'Sold Out',
};

const statusBadgeColor = (status: string) => {
  switch (status) {
    case 'acquired': return 'secondary' as const;
    case 'developing': return 'warning' as const;
    case 'developed': return 'info' as const;
    case 'selling': return 'info' as const;
    case 'sold_out': return 'success' as const;
    default: return 'secondary' as const;
  }
};

const dtcpBadge = (status: string) => {
  switch (status) {
    case 'approved': return { variant: 'success' as const, label: 'DTCP Approved' };
    case 'pending': return { variant: 'warning' as const, label: 'DTCP Pending' };
    case 'rejected': return { variant: 'destructive' as const, label: 'DTCP Rejected' };
    default: return { variant: 'secondary' as const, label: 'No DTCP' };
  }
};

export default function LandsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lands, setLands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchLands = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (search) params.search = search;
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/lands', { params });
        setLands(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchLands();
  }, [page, search, statusFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('land.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {t('common.results')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/lands/new')}
          className="bg-[#f26f31] hover:bg-[#c9531a] shadow-md"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('land.addLand')}
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
                  {s === 'all' ? t('common.all') + ' ' + t('common.status') : statusLabels[s] || s}
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
              <div className="h-32 animate-pulse bg-gradient-to-br from-green-50 to-emerald-100" />
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lands.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#f26f31]/10 flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-[#f26f31]" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No lands added yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first land to start tracking plots and sales</p>
            <Button onClick={() => navigate('/app/lands/new')} className="bg-[#f26f31] hover:bg-[#c9531a]">
              <Plus className="mr-1.5 h-4 w-4" /> {t('land.addLand')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Land Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lands.map((land: any) => {
              const plots = land.plots || [];
              const totalPlots = plots.length;
              const availablePlots = plots.filter((p: any) => p.status === 'available').length;
              const totalValue = plots.reduce((s: number, p: any) => s + (p.totalPrice || 0), 0);
              const dtcp = dtcpBadge(land.dtcpStatus);

              return (
                <Card
                  key={land.id}
                  className="cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group border-0 shadow-md"
                  onClick={() => navigate(`/app/lands/${land.id}`)}
                >
                  {/* Gradient Header */}
                  <div className="relative h-28 bg-gradient-to-br from-[#f26f31]/10 via-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                    <MapPin className="h-12 w-12 text-[#f26f31]/30 group-hover:text-[#f26f31]/50 transition-all" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <Badge variant={statusBadgeColor(land.status)} className="shadow-sm text-xs">
                        {statusLabels[land.status] || land.status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-mono text-white">
                        {land.landCode}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-bold text-base truncate group-hover:text-[#f26f31] transition-colors">
                      {land.landName}
                    </h3>

                    <div className="mt-3 space-y-2">
                      {land.city && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{land.city}{land.district ? `, ${land.district}` : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>{land.totalArea} {land.areaUnit}</span>
                        {land.surveyNumber && <span className="text-xs">| S.No: {land.surveyNumber}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={dtcp.variant} className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {dtcp.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Plot & Value Summary */}
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('land.plots')}</p>
                          <p className="text-sm font-bold text-[#f26f31]">{availablePlots} / {totalPlots} {t('land.available')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('common.total')} Value</p>
                          <p className="text-sm font-bold text-gray-700">{formatCurrency(totalValue)}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/lands/${land.id}`); }}
                      className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#f26f31] text-white py-2.5 text-sm font-semibold hover:bg-[#d4551a] transition-colors"
                    >
                      View Dashboard
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
                {t('common.previous')}
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
                {totalPages > 5 && <span className="px-1 text-muted-foreground">...</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl"
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
