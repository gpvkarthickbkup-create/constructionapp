import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatCurrency, formatDate, amountToWords } from '@/lib/utils';
import { toast } from 'sonner';
import PrintButton, { PrintHeader, PrintFooter } from '@/components/common/PrintButton';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  User,
  IndianRupee,
  Calendar,
  CreditCard,
  FileText,
  StickyNote,
  Receipt,
  CheckCircle2,
  Banknote,
  Smartphone,
  Landmark,
  PenLine,
  Loader2,
  Plus,
  Hash,
  TrendingUp,
  Clock,
  Printer,
} from 'lucide-react';

const paymentTypeIcons: Record<string, any> = {
  cash: Banknote,
  upi: Smartphone,
  bank: Landmark,
  cheque: PenLine,
};


export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { tenant } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);

  const [collectionForm, setCollectionForm] = useState({
    amount: '',
    collectionDate: new Date().toISOString().split('T')[0],
    paymentType: 'cash',
    reference: '',
    receiptNumber: '',
    notes: '',
  });

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      const resData = res.data.data || res.data;
      setData(resData);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionForm.amount || Number(collectionForm.amount) <= 0) {
      toast.error(t('customers.enterAmount'));
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        amount: Number(collectionForm.amount),
        collectionDate: collectionForm.collectionDate,
        paymentType: collectionForm.paymentType,
        reference: collectionForm.reference,
        receiptNumber: collectionForm.receiptNumber || `RCP-${Date.now().toString(36).toUpperCase()}`,
        notes: collectionForm.notes,
      };
      await api.post(`/customers/${id}/collections`, payload);

      toast.success(t('customers.collectionRecorded'));
      setCollectionForm({
        amount: '',
        collectionDate: new Date().toISOString().split('T')[0],
        paymentType: 'cash',
        reference: '',
        receiptNumber: '',
        notes: '',
      });
      fetchCustomer();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-44 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 mb-4">
          <User className="h-12 w-12 text-gray-300" />
        </div>
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/customers')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const customer = data.customer || data;
  const collections = data.collections || [];
  const totalCollected = data.totalCollected || 0;
  const firstLetter = (customer.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PrintHeader />

      {/* Back Button */}
      <div className="flex items-center justify-between no-print">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/customers')}
          className="hover:bg-[#f26f31]/10 hover:text-[#f26f31] transition-all"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-9 hover:bg-[#f26f31]/10 hover:text-[#f26f31]"
          onClick={() => {
            const w = window.open('', '_blank', 'width=800,height=900');
            if (!w) return;
            const rows = collections.map((col: any) =>
              `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${formatDate(col.collectionDate || col.date || col.createdAt)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${col.receiptNumber || '-'}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">\u20B9${Math.round(col.amount).toLocaleString('en-IN')}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:uppercase">${col.paymentType || '-'}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${col.reference || '-'}</td>
              </tr>`
            ).join('');
            w.document.write(`<html><head><title>Client Payment Statement</title><style>
              body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; color: #333; }
              .header { text-align: center; border-bottom: 3px solid #f26f31; padding-bottom: 16px; margin-bottom: 20px; }
              .company { color: #f26f31; font-size: 22px; font-weight: bold; }
              .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
              .title { font-size: 18px; font-weight: 800; color: #f26f31; text-align: center; margin: 20px 0 16px; letter-spacing: 2px; }
              .client-info { display: flex; gap: 30px; margin-bottom: 20px; font-size: 14px; }
              .client-info span { font-weight: 600; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th { background: #f26f31; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              th.right { text-align: right; }
              .total-row td { font-weight: 800; font-size: 16px; border-top: 2px solid #f26f31; padding-top: 12px; }
              .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; border-top: 1px dashed #ddd; padding-top: 12px; }
            </style></head><body>
              <div class="header">
                ${tenant?.logo ? `<img src="${tenant.logo.startsWith('/') ? window.location.origin + tenant.logo : tenant.logo}" style="height:48px;width:48px;object-fit:contain;margin:0 auto 8px;display:block" />` : ''}
                <div class="company">${tenant?.companyName || 'Datalytics Construction'}</div>
                <div class="subtitle">${tenant?.address || ''}</div>
                <div class="subtitle">${tenant?.mobile ? 'Ph: ' + tenant.mobile : ''}</div>
              </div>
              <div class="title">CLIENT PAYMENT STATEMENT</div>
              <div class="client-info">
                <div>Client: <span>${customer.name}</span></div>
                ${customer.mobile ? `<div>Mobile: <span>${customer.mobile}</span></div>` : ''}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receipt No</th>
                    <th class="right">Amount</th>
                    <th>Payment Type</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <tr class="total-row">
                    <td colspan="2" style="padding:12px">TOTAL</td>
                    <td style="padding:12px;text-align:right;color:#f26f31">\u20B9${Math.round(totalCollected).toLocaleString('en-IN')}</td>
                    <td colspan="2"></td>
                  </tr>
                </tbody>
              </table>
              <div class="footer">Powered by Datalytics AI Global</div>
            </body></html>`);
            w.document.close();
            w.print();
          }}
        >
          <Printer className="mr-1.5 h-4 w-4" />
          {t('customers.printStatement', 'Print Statement')}
        </Button>
      </div>

      {/* Customer Header */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-2 bg-gradient-to-r from-[#f26f31] to-[#f26f31]/60" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f26f31] to-[#f26f31]/80 shadow-lg shadow-[#f26f31]/20">
              <span className="text-3xl font-bold text-white">{firstLetter}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{customer.name}</h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {customer.mobile && (
                  <a
                    href={`tel:${customer.mobile}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f26f31] transition-colors bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <Phone className="h-4 w-4 text-[#f26f31]" />
                    <span className="font-medium text-base">{customer.mobile}</span>
                  </a>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f26f31] transition-colors bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>{customer.email}</span>
                  </a>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.gstNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">GST: {customer.gstNumber}</span>
                  </div>
                )}
              </div>

              {customer.notes && (
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 bg-yellow-50 rounded-lg px-3 py-2">
                  <StickyNote className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Collected Stat */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 bg-green-500" />
        <CardContent className="flex items-center gap-5 p-6">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-50">
            <IndianRupee className="h-8 w-8 text-green-600" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {t('customers.totalCollected')}
            </p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
            {totalCollected > 0 && (
              <p className="text-sm text-gray-500 mt-1 italic">
                {t('customers.amountInWords')}: {amountToWords(totalCollected)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Form */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#f26f31]" />
            {t('customers.recordPayment')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCollection} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  {t('customers.amount')} *
                </label>
                <Input
                  type="number"
                  value={collectionForm.amount}
                  onChange={(e) => setCollectionForm({ ...collectionForm, amount: e.target.value })}
                  className="h-14 text-xl font-bold rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                  placeholder="0"
                  min="1"
                  required
                />
                {collectionForm.amount && Number(collectionForm.amount) > 0 && (
                  <p className="text-xs italic text-muted-foreground bg-gray-50 rounded-lg px-3 py-1.5 mt-1.5">
                    {amountToWords(Number(collectionForm.amount))}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar className="h-4 w-4 text-[#f26f31]" />
                  {t('customers.collectionDate')}
                </label>
                <Input
                  type="date"
                  value={collectionForm.collectionDate}
                  onChange={(e) => setCollectionForm({ ...collectionForm, collectionDate: e.target.value })}
                  className="h-14 text-base rounded-xl"
                />
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 text-[#f26f31]" />
                {t('customers.paymentType')}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['cash', 'upi', 'bank', 'cheque'] as const).map((type) => {
                  const Icon = paymentTypeIcons[type];
                  const isSelected = collectionForm.paymentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCollectionForm({ ...collectionForm, paymentType: type })}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                        isSelected
                          ? 'border-[#f26f31] bg-[#f26f31]/10 text-[#f26f31]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{t(`customers.paymentTypes.${type}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Reference */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Hash className="h-4 w-4 text-[#ACA9A9]" />
                  {t('customers.reference')}
                </label>
                <Input
                  value={collectionForm.reference}
                  onChange={(e) => setCollectionForm({ ...collectionForm, reference: e.target.value })}
                  className="h-12 text-base rounded-xl"
                  placeholder={t('customers.referencePlaceholder')}
                />
              </div>

              {/* Receipt Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  {t('customers.receiptNumber')}
                </label>
                <Input
                  value={collectionForm.receiptNumber}
                  onChange={(e) => setCollectionForm({ ...collectionForm, receiptNumber: e.target.value })}
                  className="h-12 text-base rounded-xl"
                  placeholder={t('customers.autoGenerated')}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <StickyNote className="h-4 w-4 text-yellow-500" />
                {t('customers.notes')}
              </label>
              <Input
                value={collectionForm.notes}
                onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                className="h-12 text-base rounded-xl"
                placeholder={t('customers.notesPlaceholder')}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-green-600/20"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              {t('customers.recordPayment')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Collections History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#f26f31]" />
            {t('customers.collections')}
            {collections.length > 0 && (
              <Badge className="bg-[#f26f31]/10 text-[#f26f31] ml-2">{collections.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto mb-3">
                <Receipt className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm text-muted-foreground">{t('customers.noCollections')}</p>

            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-[#ACA9A9] uppercase tracking-wide">
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('customers.collectionDate')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium text-right">
                      <span className="flex items-center gap-1 justify-end">
                        <IndianRupee className="h-3 w-3" />
                        {t('customers.amount')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {t('customers.paymentType')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        {t('customers.receiptNumber')}
                      </span>
                    </th>
                    <th className="pb-3 pr-4 font-medium">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {t('customers.reference')}
                      </span>
                    </th>
                    <th className="pb-3 font-medium no-print">
                      <span className="flex items-center gap-1">
                        <Printer className="h-3 w-3" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col: any, index: number) => {
                    const PayIcon = paymentTypeIcons[col.paymentType] || CreditCard;
                    return (
                      <tr
                        key={col.id || index}
                        className={`border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${index % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => setShowReceipt(col)}
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#ACA9A9]" />
                            {formatDate(col.collectionDate || col.date || col.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-bold text-green-600 text-base">
                            {formatCurrency(col.amount)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <PayIcon className="h-4 w-4 text-[#f26f31]" />
                            <span className="font-medium">{t(`customers.paymentTypes.${col.paymentType}`)}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {col.receiptNumber || '-'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{col.reference || '-'}</td>
                        <td className="py-3 no-print">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-[#f26f31]/10 hover:text-[#f26f31]"
                            onClick={(e) => { e.stopPropagation(); setShowReceipt(col); }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
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

      {/* Receipt Preview Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReceipt(null)}>
          <Card className="w-full max-w-md border-0 shadow-2xl" id="receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="h-2 bg-gradient-to-r from-[#f26f31] to-[#f26f31]/60" />
            <CardContent className="p-6">
              {/* Receipt Header */}
              <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-[#f26f31]">{tenant?.companyName || t('common.appName')}</h2>
                <h3 className="text-base font-semibold text-gray-700 mt-1">{t('customers.receipt')}</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-dashed">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Receipt className="h-4 w-4" />
                    {t('customers.receiptNumber')}
                  </span>
                  <span className="font-mono font-bold">{showReceipt.receiptNumber || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {t('common.date')}
                  </span>
                  <span className="font-medium">{formatDate(showReceipt.collectionDate || showReceipt.date || showReceipt.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed">
                  <span className="flex items-center gap-2 text-gray-500">
                    <User className="h-4 w-4" />
                    {t('customers.receivedFrom')}
                  </span>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dashed">
                  <span className="flex items-center gap-2 text-gray-500">
                    <CreditCard className="h-4 w-4" />
                    {t('customers.paymentType')}
                  </span>
                  <span className="font-medium">{t(`customers.paymentTypes.${showReceipt.paymentType}`)}</span>
                </div>
                {showReceipt.reference && (
                  <div className="flex items-center justify-between py-2 border-b border-dashed">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Hash className="h-4 w-4" />
                      {t('customers.reference')}
                    </span>
                    <span className="font-medium">{showReceipt.reference}</span>
                  </div>
                )}
                {showReceipt.notes && (
                  <div className="flex items-center justify-between py-2 border-b border-dashed">
                    <span className="flex items-center gap-2 text-gray-500">
                      <StickyNote className="h-4 w-4" />
                      {t('customers.notes')}
                    </span>
                    <span className="font-medium">{showReceipt.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 bg-green-50 rounded-xl px-4 mt-4">
                  <span className="flex items-center gap-2 text-green-700 font-semibold">
                    <IndianRupee className="h-5 w-5" />
                    {t('common.amount')}
                  </span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(showReceipt.amount)}</span>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 mt-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('customers.amountInWords')}</p>
                  <p className="text-sm font-medium text-gray-700 italic">{amountToWords(showReceipt.amount)}</p>
                </div>
              </div>

              {/* Powered by footer */}
              <div className="text-center mt-6 pt-4 border-t border-dashed">
                <p className="text-xs text-gray-400">Powered by Datalytics AI Global</p>
              </div>

              <div className="flex gap-3 mt-4 no-print">
                <Button
                  className="flex-1 bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-12 rounded-xl font-semibold"
                  onClick={() => {
                    const w = window.open('', '_blank', 'width=400,height=600');
                    if (!w) return;
                    w.document.write(`<html><head><title>Receipt</title><style>
                      body { font-family: Arial, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; }
                      .header { text-align: center; border-bottom: 2px solid #f26f31; padding-bottom: 12px; }
                      .title { color: #f26f31; font-size: 18px; font-weight: bold; }
                      .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                      .label { color: #666; font-size: 13px; }
                      .value { font-weight: 600; font-size: 14px; }
                      .amount { font-size: 24px; font-weight: 800; color: #f26f31; text-align: center; padding: 16px 0; }
                      .words { font-style: italic; color: #666; text-align: center; font-size: 12px; }
                      .footer { text-align: center; margin-top: 20px; color: #999; font-size: 11px; border-top: 1px dashed #ddd; padding-top: 12px; }
                    </style></head><body>
                      <div class="header">
                        ${tenant?.logo ? `<img src="${tenant.logo.startsWith('/') ? window.location.origin + tenant.logo : tenant.logo}" style="height:40px;width:40px;object-fit:contain;margin:0 auto 6px;display:block" />` : ''}
                        <div class="title">${tenant?.companyName || 'Datalytics Construction'}</div>
                        <div style="font-size:12px;color:#666">${tenant?.address || ''}</div>
                        <div style="font-size:12px;color:#666">${tenant?.mobile ? 'Ph: ' + tenant.mobile : ''}</div>
                      </div>
                      <h2 style="text-align:center;color:#f26f31;margin:16px 0">PAYMENT RECEIPT</h2>
                      <div class="field"><span class="label">Receipt No.</span><span class="value">${showReceipt.receiptNumber || '-'}</span></div>
                      <div class="field"><span class="label">Date</span><span class="value">${formatDate(showReceipt.collectionDate || showReceipt.date || showReceipt.createdAt)}</span></div>
                      <div class="field"><span class="label">Received From</span><span class="value">${customer?.name || '-'}</span></div>
                      <div class="amount">\u20B9${Math.round(showReceipt.amount).toLocaleString('en-IN')}</div>
                      <div class="words">${amountToWords(showReceipt.amount)}</div>
                      <div class="field"><span class="label">Payment Type</span><span class="value">${(showReceipt.paymentType || '-').toUpperCase()}</span></div>
                      ${showReceipt.reference ? `<div class="field"><span class="label">Reference</span><span class="value">${showReceipt.reference}</span></div>` : ''}
                      <div class="footer">Powered by Datalytics AI Global</div>
                    </body></html>`);
                    w.document.close();
                    w.print();
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t('customers.printReceipt')}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl font-semibold px-6"
                  onClick={() => setShowReceipt(null)}
                >
                  {t('common.close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
