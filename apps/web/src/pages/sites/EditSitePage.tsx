import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatCurrency, amountToWords } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  IndianRupee,
  Calendar,
  MapPin,
  User,
  FileText,
  Hash,
  Phone,
  Search,
  UserCheck,
  Camera,
  Upload,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const PROJECT_TYPES = ['house', 'villa', 'apartment', 'commercial', 'renovation', 'interior', 'other'];
const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

export default function EditSitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const [form, setForm] = useState({
    siteName: '',
    siteCode: '',
    clientName: '',
    clientMobile: '',
    address: '',
    projectType: 'house',
    startDate: '',
    expectedEndDate: '',
    status: 'planning',
    totalSqft: '',
    customerRatePerSqft: '',
    builderRatePerSqft: '',
    saleAmount: '',
    coverImage: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch site data + clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, clientsRes] = await Promise.all([
          api.get(`/sites/${id}`),
          api.get('/customers', { params: { limit: 200 } }),
        ]);
        const site = siteRes.data.data || siteRes.data;
        const clientsData = clientsRes.data.data?.data || clientsRes.data.data || [];
        setClients(clientsData);

        setForm({
          siteName: site.siteName || '',
          siteCode: site.siteCode || '',
          clientName: site.clientName || '',
          clientMobile: site.clientMobile || '',
          address: site.address || '',
          projectType: site.projectType || 'house',
          startDate: site.startDate ? site.startDate.split('T')[0] : '',
          expectedEndDate: site.expectedEndDate ? site.expectedEndDate.split('T')[0] : '',
          status: site.status || 'planning',
          totalSqft: site.totalSqft ? String(site.totalSqft) : '',
          customerRatePerSqft: site.customerRatePerSqft ? String(site.customerRatePerSqft) : '',
          builderRatePerSqft: site.builderRatePerSqft ? String(site.builderRatePerSqft) : '',
          saleAmount: site.saleAmount ? String(site.saleAmount) : '',
          coverImage: site.coverImage || '',
          notes: site.notes || '',
        });

        // Try to match client
        if (site.clientName) {
          const matched = clientsData.find((c: any) =>
            c.name === site.clientName || c.mobile === site.clientMobile
          );
          if (matched) setSelectedClientId(matched.id);
        }
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    updateField('clientName', client.name || '');
    updateField('clientMobile', client.mobile || '');
  };

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const term = clientSearch.toLowerCase();
    return c.name?.toLowerCase().includes(term) || c.mobile?.includes(term);
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateField('coverImage', res.data.data.url);
      toast.success(t('sites.imageUploaded', 'Image uploaded'));
    } catch {
      toast.error(t('sites.uploadFailed', 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#f26f31', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];
    return colors[(name || '').charCodeAt(0) % colors.length];
  };

  // SQFT-based estimation calculations
  const sqft = Number(form.totalSqft) || 0;
  const customerRate = Number(form.customerRatePerSqft) || 0;
  const builderRate = Number(form.builderRatePerSqft) || 0;
  const customerEstimate = sqft * customerRate;
  const builderEstimate = sqft * builderRate;
  const estimatedProfit = customerEstimate - builderEstimate;
  const profitMargin = customerEstimate > 0 ? (estimatedProfit / customerEstimate) * 100 : 0;
  const saleAmount = Number(form.saleAmount) || 0;
  const saleVariance = saleAmount > 0 && customerEstimate > 0 ? saleAmount - customerEstimate : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.siteName.trim()) {
      toast.error(t('sites.siteNameRequired', 'Site name is required'));
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        siteName: form.siteName.trim(),
        clientName: form.clientName.trim() || undefined,
        clientMobile: form.clientMobile.trim() || undefined,
        address: form.address.trim() || undefined,
        projectType: form.projectType,
        status: form.status,
        startDate: form.startDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
        totalSqft: sqft,
        customerRatePerSqft: customerRate,
        builderRatePerSqft: builderRate,
        customerEstimate: customerEstimate,
        builderEstimate: builderEstimate,
        saleAmount: saleAmount,
        estimatedProfit: estimatedProfit,
        estimatedBudget: builderEstimate || sqft * builderRate || Number(form.estimatedBudget) || 0,
        coverImage: form.coverImage.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      await api.put(`/sites/${id}`, body);
      toast.success(t('sites.siteUpdated', 'Site updated successfully'));
      navigate(`/app/sites/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('common.error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/app/sites/${id}`)}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('sites.editSite', 'Edit Site')}</h1>
          <p className="text-sm text-muted-foreground">{form.siteCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Choose Client Section */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t('sites.chooseClient', 'Choose Client')}
            </h2>
          </div>
          <CardContent className="p-6 space-y-4">
            {/* Selected client display */}
            {selectedClientId && (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: getAvatarColor(form.clientName) }}
                >
                  {(form.clientName || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{form.clientName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {form.clientMobile || '-'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientId('')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.edit', 'Change')}
                </button>
              </div>
            )}

            {/* Client search & selection */}
            {!selectedClientId && clients.length > 0 && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder={t('common.search') + '...'}
                    className="pl-9 h-10 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredClients.map((client: any) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client)}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:border-[#f26f31] hover:bg-[#f26f31]/5 transition-all"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm"
                        style={{ backgroundColor: getAvatarColor(client.name || '') }}
                      >
                        {(client.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.mobile || '-'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Manual client fields (always editable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.clientName', 'Client Name')}
                </label>
                <Input
                  value={form.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  placeholder={t('sites.clientNamePlaceholder', 'Client full name')}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('common.mobile', 'Mobile')}</label>
                <Input
                  value={form.clientMobile}
                  onChange={(e) => updateField('clientMobile', e.target.value)}
                  placeholder="9876543210"
                  className="h-11 rounded-xl"
                  type="tel"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('sites.siteDetails', 'Site Details')}
            </h2>
          </div>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Site Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.siteName', 'Site Name')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  placeholder={t('sites.siteNamePlaceholder', 'e.g., Lakshmi Nagar Villa')}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              {/* Site Code (readonly) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.siteCode', 'Site Code')}
                </label>
                <Input
                  value={form.siteCode}
                  readOnly
                  className="h-11 rounded-xl font-mono bg-muted cursor-not-allowed"
                />
              </div>

              {/* Project Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('sites.projectType', 'Project Type')}</label>
                <select
                  value={form.projectType}
                  onChange={(e) => updateField('projectType', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                >
                  {PROJECT_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {t(`sites.projectTypes.${pt}`, pt)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('common.address', 'Address')}
                </label>
                <Input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder={t('sites.addressPlaceholder', 'Full site address')}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('common.status', 'Status')}</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`sites.statuses.${s}`, s.replace('_', ' '))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.startDate', 'Start Date')}
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Expected End Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.expectedEndDate', 'Expected End Date')}
                </label>
                <Input
                  type="date"
                  value={form.expectedEndDate}
                  onChange={(e) => updateField('expectedEndDate', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Cover Image Upload */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('sites.coverImage', 'Cover Image')}
                </label>
                {form.coverImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={form.coverImage}
                      alt={t('sites.coverImage', 'Cover Image')}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateField('coverImage', '')}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#f26f31] hover:bg-[#f26f31]/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-[#f26f31] animate-spin" />
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f26f31]/10 mb-3">
                          <Upload className="h-7 w-7 text-[#f26f31]" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">{t('sites.uploadImage', 'Click to upload image')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('sites.dragDrop', 'or drag and drop')}</p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Area & Estimation Section */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Area &amp; Estimation
            </h2>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Total Area */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Total Area (Sq.ft)</label>
              <Input
                type="number"
                value={form.totalSqft}
                onChange={e => updateField('totalSqft', e.target.value)}
                placeholder="e.g., 1500"
                className="h-14 rounded-xl text-xl font-bold text-center"
                min="0"
              />
              {sqft > 0 && (
                <p className="text-xs text-muted-foreground text-center">{sqft.toLocaleString('en-IN')} sq.ft</p>
              )}
            </div>

            {/* Rate Inputs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rate per Sq.ft to Customer (INR)</label>
                <p className="text-xs text-muted-foreground">What you charge the customer</p>
                <Input
                  type="number"
                  value={form.customerRatePerSqft}
                  onChange={e => updateField('customerRatePerSqft', e.target.value)}
                  placeholder="e.g., 2500"
                  className="h-11 rounded-xl"
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rate per Sq.ft to Builder (INR)</label>
                <p className="text-xs text-muted-foreground">What it actually costs you</p>
                <Input
                  type="number"
                  value={form.builderRatePerSqft}
                  onChange={e => updateField('builderRatePerSqft', e.target.value)}
                  placeholder="e.g., 1800"
                  className="h-11 rounded-xl"
                  min="0"
                />
              </div>
            </div>

            {/* Auto-Calculated Values */}
            {sqft > 0 && (customerRate > 0 || builderRate > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto-Calculated Estimates</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {customerEstimate > 0 && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Customer Estimate</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(customerEstimate)}</p>
                      <p className="text-xs text-green-600 mt-1">{sqft.toLocaleString('en-IN')} sqft x {formatCurrency(customerRate)}/sqft</p>
                      <p className="text-xs text-green-600/70 italic mt-1">{amountToWords(customerEstimate)}</p>
                    </div>
                  )}

                  {builderEstimate > 0 && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="text-xs font-medium text-orange-700 uppercase tracking-wider mb-1">Builder Cost Estimate</p>
                      <p className="text-2xl font-bold text-orange-700">{formatCurrency(builderEstimate)}</p>
                      <p className="text-xs text-orange-600 mt-1">{sqft.toLocaleString('en-IN')} sqft x {formatCurrency(builderRate)}/sqft</p>
                      <p className="text-xs text-orange-600/70 italic mt-1">{amountToWords(builderEstimate)}</p>
                    </div>
                  )}
                </div>

                {customerEstimate > 0 && builderEstimate > 0 && (
                  <div className={`rounded-xl border p-4 ${estimatedProfit >= 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${estimatedProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          Estimated Profit
                        </p>
                        <p className={`text-2xl font-bold ${estimatedProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {formatCurrency(Math.abs(estimatedProfit))}
                          {estimatedProfit < 0 && ' (Loss)'}
                        </p>
                        <p className={`text-xs italic mt-1 ${estimatedProfit >= 0 ? 'text-blue-600/70' : 'text-red-600/70'}`}>
                          {amountToWords(Math.abs(estimatedProfit))}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${estimatedProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {estimatedProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                          <span className="text-xl font-bold">{profitMargin.toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Profit Margin</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sale Amount */}
            <div className="border-t pt-6 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[#f26f31]" />
                Final Sale Amount
              </p>
              <p className="text-xs text-muted-foreground">The final agreed price with the customer</p>
              <Input
                type="number"
                value={form.saleAmount}
                onChange={e => updateField('saleAmount', e.target.value)}
                placeholder="e.g., 4500000"
                className="h-14 rounded-xl text-xl font-bold text-center"
                min="0"
              />
              {saleAmount > 0 && (
                <p className="text-xs text-muted-foreground text-center italic">{amountToWords(saleAmount)}</p>
              )}
              {saleVariance !== 0 && saleAmount > 0 && (
                <div className={`rounded-lg p-3 text-sm ${saleVariance > 0 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {saleVariance > 0
                    ? `Sale is ${formatCurrency(saleVariance)} MORE than customer estimate`
                    : `Sale is ${formatCurrency(Math.abs(saleVariance))} LESS than customer estimate`
                  }
                </div>
              )}
            </div>

            {/* Summary */}
            {(builderEstimate > 0 || saleAmount > 0) && (
              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 p-5 border border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Project Summary</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {builderEstimate > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Builder Budget</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(builderEstimate)}</p>
                    </div>
                  )}
                  {saleAmount > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Sale Amount</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(saleAmount)}</p>
                    </div>
                  )}
                  {saleAmount > 0 && builderEstimate > 0 && (
                    <div className="col-span-2 border-t pt-3">
                      <p className="text-xs text-muted-foreground">Expected Profit (Sale - Builder Cost)</p>
                      <p className={`text-lg font-bold ${saleAmount - builderEstimate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(saleAmount - builderEstimate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('common.notes', 'Notes')}
            </h2>
          </div>
          <CardContent className="p-6">
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t('sites.notesPlaceholder', 'Any additional notes about this site...')}
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30 resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/app/sites/${id}`)}
            className="rounded-xl px-6"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl px-8 shadow-md"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('common.update', 'Update Site')}
          </Button>
        </div>
      </form>
    </div>
  );
}
