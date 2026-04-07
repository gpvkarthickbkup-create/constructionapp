import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { VendorPlaceholder, EmptyState } from '@/components/common/Placeholders';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  vendorCode: string;
  type: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string;
  notes: string;
  isActive: boolean;
}

interface VendorsResponse {
  vendors: Vendor[];
  total: number;
  page: number;
  totalPages: number;
}

const VENDOR_TYPES = ['all', 'supplier', 'labor_contractor', 'engineer', 'broker', 'transporter', 'other'];

const vendorTypeIcon: Record<string, string> = {
  supplier: '\u{1F4E6}',
  labor_contractor: '\u{1F477}',
  transporter: '\u{1F69B}',
  broker: '\u{1F4BC}',
  engineer: '\u{1F527}',
  other: '\u{1F4CB}',
};

const vendorTypeColor: Record<string, string> = {
  supplier: '#3B82F6',
  labor_contractor: '#F59E0B',
  transporter: '#c9531a',
  broker: '#8B5CF6',
  engineer: '#10B981',
  other: '#6B7280',
};

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case 'supplier': return 'info' as const;
    case 'labor_contractor': return 'warning' as const;
    case 'engineer': return 'secondary' as const;
    case 'transporter': return 'default' as const;
    default: return 'outline' as const;
  }
};

export default function VendorsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 12 };
        if (search) params.search = search;
        if (typeFilter !== 'all') params.type = typeFilter;
        const res = await api.get('/vendors', { params });
        setVendors(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter]);

  const getAvatarColor = (name: string) => {
    const colors = ['#f26f31', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];
    const index = (name || '').charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <VendorPlaceholder size="sm" className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('vendors.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {total} {t('common.results')}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/app/vendors/new')} className="bg-[#f26f31] hover:bg-[#c9531a] shadow-md h-12 px-6 text-base font-semibold rounded-xl">
          <Plus className="mr-1.5 h-5 w-5" />
          {t('vendors.addVendor')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('common.search') + '...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
        >
          {VENDOR_TYPES.map((vt) => (
            <option key={vt} value={vt}>
              {vt === 'all' ? t('common.all') + ' ' + t('common.type') : `${vendorTypeIcon[vt] || ''} ${t(`vendors.types.${vt}`)}`}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<VendorPlaceholder size="lg" />}
          title={t('vendors.noVendors')}
          description={t('vendors.noVendorsDesc')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => {
              const vType = vendor.type || 'other';
              const avatarColor = vendorTypeColor[vType] || getAvatarColor(vendor.name);
              const firstLetter = (vendor.name || 'V').charAt(0).toUpperCase();
              const typeEmoji = vendorTypeIcon[vType] || '\u{1F4CB}';

              return (
                <Card
                  key={vendor.id}
                  className="cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group border-0 shadow-md"
                  onClick={() => navigate(`/app/vendors/${vendor.id}`)}
                >
                  <div className="h-1 transition-colors" style={{ backgroundColor: avatarColor }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Large Avatar Circle */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-xl shadow-md"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {firstLetter}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate group-hover:text-[#f26f31] transition-colors">
                          {vendor.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">{vendor.vendorCode}</p>
                      </div>
                    </div>

                    {/* Vendor Type with Icon */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg leading-none">{typeEmoji}</span>
                      <Badge variant={typeBadgeVariant(vType)} className="text-xs">
                        {t(`vendors.types.${vType}`)}
                      </Badge>
                    </div>

                    {/* Mobile */}
                    {vendor.mobile && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-[#f26f31]" />
                        <span>{vendor.mobile}</span>
                      </div>
                    )}

                    {/* View Details Link */}
                    <div className="mt-4 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[#f26f31] group-hover:underline">
                        {t('common.viewDetails', 'View Details')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
