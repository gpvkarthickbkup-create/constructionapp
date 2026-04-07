import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { cn, formatCurrency, formatDate, expenseTypeColors, amountToWords } from '@/lib/utils';
import { VendorPlaceholder } from '@/components/common/Placeholders';
import { toast } from 'sonner';
import PrintButton, { PrintHeader, PrintFooter } from '@/components/common/PrintButton';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  Truck,
  Package,
  HardHat,
  Briefcase,
  Wrench,
  Receipt,
  TrendingUp,
  StickyNote,
} from 'lucide-react';

const vendorTypeIcons: Record<string, any> = {
  transporter: Truck,
  supplier: Package,
  labor_contractor: HardHat,
  broker: Briefcase,
  engineer: Wrench,
};

const vendorTypeEmoji: Record<string, string> = {
  transporter: '\uD83D\uDE9B',
  supplier: '\uD83D\uDCE6',
  labor_contractor: '\uD83D\uDC77',
  broker: '\uD83D\uDCBC',
  engineer: '\uD83D\uDD27',
};

export default function VendorDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuthStore();

  const fetchVendor = async () => {
    try {
      const res = await api.get(`/vendors/${id}/detail`);
      setData(res.data.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  const changePaymentStatus = async (expenseId: string, newStatus: string, totalAmount: number) => {
    try {
      await api.put(`/expenses/${expenseId}`, {
        paymentStatus: newStatus,
        paidAmount: newStatus === 'paid' ? totalAmount : newStatus === 'unpaid' ? 0 : undefined,
      });
      toast.success(t('common.updated', 'Updated'));
      await fetchVendor();
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <VendorPlaceholder size="lg" />
        <p className="mt-4 text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/vendors')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const { vendor, totalPaid, totalAmount, totalPending, siteAllocation, recentExpenses } = data;
  const vendorType = vendor.type || vendor.vendorType || 'supplier';
  const TypeIcon = vendorTypeIcons[vendorType] || Package;
  const typeEmoji = vendorTypeEmoji[vendorType] || '\uD83D\uDCE6';
  const firstLetter = (vendor.name || 'V').charAt(0).toUpperCase();

  const printStatement = () => {
    const w = window.open('', '_blank', 'width=900,height=900');
    if (!w) return;
    const logoUrl = tenant?.logo ? (tenant.logo.startsWith('/') ? window.location.origin + tenant.logo : tenant.logo) : '';
    const rows = (recentExpenses || []).map((exp: any) => {
      const amt = exp.totalAmount || exp.amount || 0;
      const paid = exp.paidAmount || (exp.paymentStatus === 'paid' ? amt : 0);
      const pending = amt - paid;
      const status = exp.paymentStatus || 'unpaid';
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${formatDate(exp.date || exp.expenseDate || exp.createdAt)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${exp.expenseNumber || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${exp.itemName || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${exp.site?.siteName || exp.siteName || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">\u20B9${Math.round(amt).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#16a34a">\u20B9${Math.round(paid).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#dc2626">\u20B9${Math.round(pending).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize">${status.replace('_', ' ')}</td>
      </tr>`;
    }).join('');
    w.document.write(`<html><head><title>Vendor Payment Statement</title><style>
      body { font-family: Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; color: #333; }
      .header { text-align: center; border-bottom: 3px solid #f26f31; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { height: 48px; width: 48px; object-fit: contain; margin: 0 auto 8px; }
      .company { color: #f26f31; font-size: 22px; font-weight: bold; }
      .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
      .title { font-size: 18px; font-weight: 800; color: #f26f31; text-align: center; margin: 20px 0 16px; letter-spacing: 2px; }
      .vendor-info { display: flex; gap: 30px; margin-bottom: 20px; font-size: 14px; }
      .vendor-info span { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #f26f31; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
      th.right { text-align: right; }
      .total-row td { font-weight: 800; font-size: 14px; border-top: 2px solid #f26f31; padding-top: 12px; }
      .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; border-top: 1px dashed #ddd; padding-top: 12px; }
    </style></head><body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
        <div class="company">${tenant?.companyName || 'Datalytics Construction'}</div>
        <div class="subtitle">${tenant?.address || ''}</div>
        <div class="subtitle">${tenant?.mobile ? 'Ph: ' + tenant.mobile : ''}</div>
      </div>
      <div class="title">VENDOR PAYMENT STATEMENT</div>
      <div class="vendor-info">
        <div>Vendor: <span>${vendor.name}</span></div>
        <div>Type: <span>${t('vendors.types.' + vendorType)}</span></div>
        ${vendor.mobile ? `<div>Mobile: <span>${vendor.mobile}</span></div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Expense #</th>
            <th>Item</th>
            <th>Site</th>
            <th class="right">Amount</th>
            <th class="right">Paid</th>
            <th class="right">Pending</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="4" style="padding:12px">TOTAL</td>
            <td style="padding:12px;text-align:right;color:#f26f31">\u20B9${Math.round(totalAmount || 0).toLocaleString('en-IN')}</td>
            <td style="padding:12px;text-align:right;color:#16a34a">\u20B9${Math.round(totalPaid || 0).toLocaleString('en-IN')}</td>
            <td style="padding:12px;text-align:right;color:#dc2626">\u20B9${Math.round(totalPending || 0).toLocaleString('en-IN')}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Powered by Datalytics AI Global</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PrintHeader />

      {/* Back Button */}
      <div className="flex items-center justify-between no-print">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/vendors')}
          className="hover:bg-[#f26f31]/10 hover:text-[#f26f31] transition-all"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={printStatement}
            className="hover:bg-[#f26f31]/10 hover:text-[#f26f31]"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            {t('vendors.printStatement', 'Print Statement')}
          </Button>
          <PrintButton />
        </div>
      </div>

      {/* Vendor Header Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-2 bg-gradient-to-r from-[#f26f31] to-[#f26f31]/60" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f26f31] to-[#f26f31]/80 shadow-lg shadow-[#f26f31]/20">
              <span className="text-3xl font-bold text-white">{firstLetter}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                <Badge className="bg-[#f26f31]/10 text-[#f26f31] border-[#f26f31]/20 hover:bg-[#f26f31]/15 gap-1.5 px-3 py-1 text-sm">
                  <TypeIcon className="h-3.5 w-3.5" />
                  <span>{typeEmoji}</span>
                  {t(`vendors.types.${vendorType}`)}
                </Badge>
              </div>

              {vendor.vendorCode && (
                <p className="text-sm text-[#ACA9A9] mb-3 font-mono">{vendor.vendorCode}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {vendor.mobile && (
                  <a
                    href={`tel:${vendor.mobile}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f26f31] transition-colors bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <Phone className="h-4 w-4 text-[#f26f31]" />
                    <span className="font-medium">{vendor.mobile}</span>
                  </a>
                )}
                {vendor.email && (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f26f31] transition-colors bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>{vendor.email}</span>
                  </a>
                )}
                {vendor.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>{vendor.address}</span>
                  </div>
                )}
                {vendor.gstNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">GST: {vendor.gstNumber}</span>
                  </div>
                )}
              </div>

              {vendor.notes && (
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 bg-yellow-50 rounded-lg px-3 py-2">
                  <StickyNote className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{vendor.notes}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Paid */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <div className="h-1 bg-green-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {t('vendors.totalPaid')}
              </p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid || 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Pending */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <div className="h-1 bg-red-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <Clock className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('vendors.totalPending')}
              </p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending || 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <div className="h-1 bg-[#f26f31]" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f26f31]/10">
              <IndianRupee className="h-7 w-7 text-[#f26f31]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                {t('common.total')}
              </p>
              <p className="text-2xl font-bold text-[#f26f31]">{formatCurrency(totalAmount || 0)}</p>
              {totalAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1 italic">{amountToWords(totalAmount)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Allocation */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#f26f31]" />
            {t('vendors.siteAllocation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!siteAllocation || siteAllocation.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {siteAllocation.map((alloc: any, index: number) => {
                const allocAmount = alloc._sum?.totalAmount || alloc.totalAmount || 0;
                const maxAmount = Math.max(...siteAllocation.map((a: any) => a._sum?.totalAmount || a.totalAmount || 0));
                const percentage = maxAmount > 0 ? (allocAmount / maxAmount) * 100 : 0;
                const siteName = alloc.site?.siteName || alloc.siteName || t('common.unknown');
                const siteCode = alloc.site?.siteCode || alloc.siteCode || '';
                const siteId = alloc.site?.id || alloc.siteId;

                return (
                  <div
                    key={siteId || `alloc-${index}`}
                    className={`group rounded-xl border border-gray-100 p-4 transition-all ${siteId ? 'cursor-pointer hover:border-[#f26f31]/30 hover:bg-[#f26f31]/5' : ''}`}
                    {...(siteId ? { onClick: () => navigate(`/app/sites/${siteId}`) } : {})}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#ACA9A9] group-hover:text-[#f26f31] transition-colors" />
                        <span className="font-semibold text-gray-800 group-hover:text-[#f26f31] transition-colors">
                          {siteName}
                        </span>
                        {siteCode && (
                          <span className="text-xs text-[#ACA9A9] font-mono">({siteCode})</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900">{formatCurrency(allocAmount)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f26f31] to-[#f26f31]/70 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#f26f31]" />
            {t('vendors.expenseHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentExpenses || recentExpenses.length === 0 ? (
            <div className="py-10 text-center">
              <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-[#ACA9A9] uppercase tracking-wide">
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('common.date')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {t('expenses.site')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {t('expenses.category')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      <span className="flex items-center gap-1 justify-end">
                        <IndianRupee className="h-3 w-3" />
                        {t('common.amount')}
                      </span>
                    </th>
                    <th className="pb-3 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('expenses.paymentStatus')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((exp: any, idx: number) => {
                    const expType = exp.expenseType || exp.category?.name || '';
                    const siteName = exp.site?.siteName || exp.siteName || '';
                    const status = exp.paymentStatus || 'unpaid';

                    return (
                      <tr
                        key={exp.id}
                        className={cn('border-b last:border-0 hover:bg-gray-50 transition-colors', idx % 2 === 1 && 'bg-muted/20')}
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-600">
                          {formatDate(exp.date || exp.expenseDate || exp.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-[#ACA9A9]" />
                            <span className="font-medium text-gray-800">{siteName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: expenseTypeColors[expType] || '#6B7280' }}
                            />
                            <span>{t(`expenses.types.${expType}`)}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-bold text-gray-900">
                          {formatCurrency(exp.totalAmount || exp.amount || 0)}
                        </td>
                        <td className="py-3">
                          <select
                            value={status}
                            onChange={(e) => changePaymentStatus(exp.id, e.target.value, exp.totalAmount || exp.amount || 0)}
                            className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30 ${
                              status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : status === 'partially_paid'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="paid">{t('expenses.paymentStatuses.paid')}</option>
                            <option value="partially_paid">{t('expenses.paymentStatuses.partially_paid')}</option>
                            <option value="unpaid">{t('expenses.paymentStatuses.unpaid')}</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PrintFooter />
    </div>
  );
}
