import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatCurrency, amountToWords, categoryIcons } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Package, Users, Truck, Wrench, Percent, HelpCircle,
  Save, ChevronDown, ChevronUp, CheckCircle2, IndianRupee, Search,
  Store, Plus,
} from 'lucide-react';

const EXPENSE_TYPES = [
  { key: 'material', label: 'Material', labelTa: '\u0BAA\u0BCA\u0BB0\u0BC1\u0BB3\u0BCD', icon: Package, color: '#f26f31' },
  { key: 'labor', label: 'Labor', labelTa: '\u0B95\u0BC2\u0BB2\u0BBF', icon: Users, color: '#ACA9A9' },
  { key: 'transport', label: 'Transport', labelTa: '\u0BAA\u0BCB\u0B95\u0BCD\u0B95\u0BC1\u0BB5\u0BB0\u0BA4\u0BCD\u0BA4\u0BC1', icon: Truck, color: '#c9531a' },
  { key: 'rental', label: 'Rental', labelTa: '\u0BB5\u0BBE\u0B9F\u0B95\u0BC8', icon: Wrench, color: '#7A7878' },
  { key: 'commission', label: 'Commission', labelTa: '\u0B95\u0BAE\u0BBF\u0BB7\u0BA9\u0BCD', icon: Percent, color: '#8B5CF6' },
  { key: 'miscellaneous', label: 'Other', labelTa: '\u0B87\u0BA4\u0BB0', icon: HelpCircle, color: '#6B7280' },
];

const UNITS = ['unit', 'bag', 'kg', 'ton', 'cft', 'sqft', 'nos', 'trip', 'day', 'hr', 'lot', 'lump', 'meter', 'litre', 'bundle', 'piece'];

const vendorTypeIcon: Record<string, string> = {
  supplier: '\u{1F4E6}',
  labor_contractor: '\u{1F477}',
  transporter: '\u{1F69B}',
  broker: '\u{1F4BC}',
  engineer: '\u{1F527}',
  other: '\u{1F4CB}',
};

export default function AddExpensePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSiteId = searchParams.get('siteId') || '';

  const [sites, setSites] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showNewVendorInput, setShowNewVendorInput] = useState(false);

  // Simple form state
  const [siteId, setSiteId] = useState(preselectedSiteId);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState('material');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('nos');
  const [rate, setRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paymentType, setPaymentType] = useState('cash');
  const [vendorName, setVendorName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [gstPercent, setGstPercent] = useState('0');

  // Auto-calculate GST
  const gstAmount = (parseFloat(totalAmount) || 0) * (parseFloat(gstPercent) || 0) / 100;
  const grandTotal = (parseFloat(totalAmount) || 0) + gstAmount;

  // Auto-calculate total
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    setTotalAmount(String(q * r));
  }, [quantity, rate]);

  // Fetch sites, vendors, categories
  useEffect(() => {
    api.get('/sites', { params: { limit: 100 } }).then(r => setSites(r.data.data || [])).catch(() => {});
    api.get('/vendors', { params: { limit: 200 } }).then(r => setVendors(r.data.data || [])).catch(() => {});
    api.get('/users/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  // Filter categories by selected expense type
  const filteredCategories = categories.filter(c => c.type === expenseType);

  const selectedSite = sites.find(s => s.id === siteId);
  const selectedVendor = vendors.find(v => v.id === vendorId);

  // Filter vendors by search
  const filteredVendors = vendors.filter(v => {
    if (!vendorSearch) return true;
    const term = vendorSearch.toLowerCase();
    return v.name?.toLowerCase().includes(term) || v.type?.toLowerCase().includes(term);
  });

  const handleSubmit = async (addAnother = false) => {
    if (!siteId) { toast.error(t('expenses.selectSiteError', 'Please select a site')); return; }
    if (!itemName.trim()) { toast.error(t('expenses.itemNameError', 'Please enter item name')); return; }
    if (!rate) { toast.error(t('expenses.rateError', 'Please enter rate')); return; }
    if (!vendorId && !vendorName.trim()) { toast.error(t('expenses.vendorRequiredError', 'Please select or add a vendor')); return; }

    setSubmitting(true);
    try {
      const total = parseFloat(totalAmount) || 0;
      const paid = paymentStatus === 'paid' ? total : parseFloat(paidAmount) || 0;

      await api.post('/expenses', {
        siteId,
        expenseDate,
        expenseType,
        itemName: itemName.trim(),
        quantity: parseFloat(quantity) || 1,
        unit,
        rate: parseFloat(rate) || 0,
        totalAmount: total,
        gstPercent: parseFloat(gstPercent) || 0,
        gstAmount,
        grandTotal,
        paymentStatus,
        paidAmount: paid,
        paymentType: paymentStatus !== 'unpaid' ? paymentType : undefined,
        vendorId: vendorId || undefined,
        vendorName: !vendorId && vendorName ? vendorName.trim() : undefined,
        billNumber: billNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      toast.success(t('expenses.expenseCreated'));

      if (addAnother) {
        setItemName('');
        setQuantity('1');
        setRate('');
        setTotalAmount('');
        setBillNumber('');
        setRemarks('');
        setPaidAmount('');
        setGstPercent('0');
      } else {
        navigate('/app/expenses');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const isTamil = i18n.language === 'ta';

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">{t('expenses.addExpense')}</h1>
      </div>

      {/* Selected Site Banner */}
      {selectedSite && (
        <div className="flex items-center gap-3 rounded-xl bg-[#f26f31]/10 border border-[#f26f31]/20 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f26f31] text-white text-xs font-bold">
            {selectedSite.siteCode?.slice(-4) || 'SITE'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{selectedSite.siteName}</p>
            <p className="text-xs text-muted-foreground">{selectedSite.clientName || selectedSite.siteCode}</p>
          </div>
          <button onClick={() => setSiteId('')} className="text-xs text-muted-foreground hover:text-foreground">
            {t('common.edit', 'Change')}
          </button>
        </div>
      )}

      {/* Site Selection (if not selected) */}
      {!siteId && (
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">
              {t('expenses.site')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sites.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSiteId(s.id)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:border-[#f26f31] hover:bg-[#f26f31]/5 transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                    {s.siteCode?.slice(-4)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.siteName}</p>
                    <p className="text-xs text-muted-foreground">{s.clientName || s.projectType}</p>
                  </div>
                </button>
              ))}
              {sites.length === 0 && (
                <p className="col-span-2 text-center text-sm text-muted-foreground py-6">
                  {t('sites.noSites', 'No sites found.')} <button onClick={() => navigate('/app/sites/new')} className="text-[#f26f31] font-medium">{t('sites.addSite', 'Create one')}</button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form (only show when site is selected) */}
      {siteId && (
        <>
          {/* Essential Fields */}
          <Card>
            <CardContent className="p-4 space-y-4">

              {/* Date + Type Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.expenseDate')}</label>
                  <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.expenseType')}</label>
                  <select
                    value={expenseType}
                    onChange={e => setExpenseType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                  >
                    {EXPENSE_TYPES.map(et => (
                      <option key={et.key} value={et.key}>{isTamil ? et.labelTa : et.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item / Category — Icon Chips */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  {t('expenses.itemName')} <span className="text-red-500">*</span>
                </label>
                {filteredCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map(c => {
                      const icon = categoryIcons[c.name] || '📋';
                      const isSelected = itemName === c.name;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setItemName(c.name)}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all',
                            isSelected
                              ? 'border-[#f26f31] bg-[#f26f31] text-white shadow-md'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-[#f26f31]/40 hover:bg-orange-50'
                          )}
                        >
                          <span className="text-lg">{icon}</span>
                          <span>{isTamil && c.nameTa ? c.nameTa : c.name}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setItemName('__custom__')}
                      className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm text-muted-foreground hover:border-gray-400"
                    >
                      + {t('common.custom', 'Custom')}
                    </button>
                  </div>
                ) : (
                  <Input
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder="e.g., UltraTech Cement 53 Grade"
                    className="h-11 rounded-xl"
                  />
                )}
                {itemName === '__custom__' && (
                  <Input
                    value=""
                    onChange={e => setItemName(e.target.value)}
                    placeholder="Enter custom item name"
                    className="h-10 rounded-xl mt-2"
                    autoFocus
                  />
                )}
              </div>

              {/* Qty + Unit + Rate = Total */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.quantity')}</label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-11 rounded-xl text-center" min="0" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.unit')}</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {t('expenses.rate')} <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="₹" className="h-11 rounded-xl" min="0" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.totalAmount')}</label>
                  <div className="flex h-11 items-center rounded-xl bg-[#f26f31]/10 border border-[#f26f31]/20 px-3">
                    <IndianRupee className="h-3.5 w-3.5 text-[#f26f31] mr-1" />
                    <span className="font-bold text-[#f26f31]">{totalAmount ? formatCurrency(parseFloat(totalAmount)) : '₹0'}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              {totalAmount && parseFloat(totalAmount) > 0 && (
                <p className="text-xs italic text-muted-foreground bg-gray-50 rounded-lg px-3 py-2">
                  💬 {amountToWords(parseFloat(totalAmount))}
                </p>
              )}

              {/* Payment Status -- 3 simple buttons */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('expenses.paymentStatus')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'paid', label: t('expenses.paymentStatuses.paid'), icon: '\u2705', color: 'border-green-400 bg-green-50 text-green-700' },
                    { key: 'partially_paid', label: t('expenses.paymentStatuses.partially_paid'), icon: '\u23F3', color: 'border-amber-400 bg-amber-50 text-amber-700' },
                    { key: 'unpaid', label: t('expenses.paymentStatuses.unpaid'), icon: '\u274C', color: 'border-red-400 bg-red-50 text-red-700' },
                  ].map(ps => (
                    <button
                      key={ps.key}
                      type="button"
                      onClick={() => setPaymentStatus(ps.key)}
                      className={cn(
                        'rounded-xl border-2 py-2.5 text-sm font-medium transition-all',
                        paymentStatus === ps.key ? ps.color : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      )}
                    >
                      <span className="mr-1">{ps.icon}</span>
                      {ps.label}
                    </button>
                  ))}
                </div>
                {paymentStatus === 'partially_paid' && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                      placeholder="Paid amount ₹"
                      className="h-10 rounded-xl"
                      min="0"
                    />
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Vendor Selection - MANDATORY - Outside collapsed section */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Store className="h-5 w-5 text-[#f26f31]" />
                {t('expenses.vendor')} <span className="text-red-500">*</span>
              </label>

              {/* Selected vendor banner */}
              {selectedVendor && (
                <div className="flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-200 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white font-bold text-sm">
                    {(selectedVendor.name || 'V').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedVendor.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{vendorTypeIcon[selectedVendor.type] || '\u{1F4CB}'}</span>
                      {t(`vendors.types.${selectedVendor.type || 'other'}`)}
                    </p>
                  </div>
                  <button
                    onClick={() => { setVendorId(''); setVendorName(''); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('common.edit', 'Change')}
                  </button>
                </div>
              )}

              {/* Vendor chips (when no vendor selected and not showing new vendor input) */}
              {!vendorId && !showNewVendorInput && (
                <>
                  {vendors.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={vendorSearch}
                        onChange={e => setVendorSearch(e.target.value)}
                        placeholder={t('common.search') + ' ' + t('expenses.vendor') + '...'}
                        className="pl-9 h-10 rounded-xl text-sm"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {filteredVendors.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setVendorId(v.id); setVendorName(''); setVendorSearch(''); }}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all hover:border-[#f26f31] hover:bg-[#f26f31]/5',
                          vendorId === v.id ? 'border-[#f26f31] bg-[#f26f31]/10' : 'border-gray-200'
                        )}
                      >
                        <span className="text-base leading-none">{vendorTypeIcon[v.type] || '\u{1F4CB}'}</span>
                        <span className="font-medium truncate max-w-[150px]">{v.name}</span>
                      </button>
                    ))}
                  </div>

                  {vendors.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">No vendors yet. Type a name below:</p>
                      <Input
                        value={vendorName}
                        onChange={e => setVendorName(e.target.value)}
                        placeholder="Enter vendor / supplier name"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  )}

                  {vendors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewVendorInput(true)}
                      className="flex items-center gap-2 text-sm font-medium text-[#f26f31] hover:underline mt-1"
                    >
                      <Plus className="h-4 w-4" />
                      {t('vendors.addVendor', 'Add new vendor')}
                    </button>
                  )}
                </>
              )}

              {/* New vendor name input */}
              {!vendorId && showNewVendorInput && (
                <div className="space-y-2">
                  <Input
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    placeholder={t('vendors.vendorName', 'New vendor name')}
                    className="h-11 rounded-xl"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setShowNewVendorInput(false); setVendorName(''); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('common.cancel', 'Cancel')} - {t('common.select', 'Select')} {t('expenses.vendor', 'existing vendor')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* More Details (collapsed by default) */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm text-muted-foreground hover:border-gray-400 hover:text-foreground transition-colors"
          >
            {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMore ? t('common.close', 'Hide details') : t('expenses.moreDetails', 'Add more details (bill no., remarks)')}
          </button>

          {showMore && (
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Payment Type + Bill */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.paymentType')}</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      {['cash', 'upi', 'bank', 'credit', 'cheque'].map(pt => (
                        <option key={pt} value={pt}>{t(`expenses.paymentTypes.${pt}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('expenses.billNumber')}</label>
                    <Input value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="Bill no." className="h-10 rounded-xl" />
                  </div>
                </div>

                {/* GST Fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('reports.gstPercent', 'GST %')}</label>
                    <select
                      value={gstPercent}
                      onChange={e => setGstPercent(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                    >
                      {['0', '5', '12', '18', '28'].map(g => (
                        <option key={g} value={g}>{g}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('reports.gstAmount', 'GST Amount')}</label>
                    <div className="flex h-10 items-center rounded-xl bg-gray-50 border border-gray-200 px-3">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium text-gray-600">{gstAmount > 0 ? formatCurrency(gstAmount) : '₹0'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('reports.grandTotal', 'Grand Total')}</label>
                    <div className="flex h-10 items-center rounded-xl bg-[#f26f31]/10 border border-[#f26f31]/20 px-3">
                      <IndianRupee className="h-3.5 w-3.5 text-[#f26f31] mr-1" />
                      <span className="font-bold text-[#f26f31]">{grandTotal > 0 ? formatCurrency(grandTotal) : '₹0'}</span>
                    </div>
                  </div>
                </div>
                {grandTotal > 0 && parseFloat(gstPercent) > 0 && (
                  <p className="text-xs italic text-muted-foreground bg-gray-50 rounded-lg px-3 py-2">
                    {t('reports.grandTotal', 'Grand Total')} {t('customers.amountInWords', 'in words')}: {amountToWords(grandTotal)}
                  </p>
                )}

                {/* Remarks */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('common.remarks')}</label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 h-12 rounded-xl bg-[#f26f31] hover:bg-[#e05a20] text-white font-semibold text-base shadow-lg"
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? t('common.loading', 'Loading...') : t('common.save')}
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              variant="outline"
              className="h-12 rounded-xl font-medium"
            >
              {t('expenses.saveAndAddAnother')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
