import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Loader2,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Hash,
  Briefcase,
} from 'lucide-react';

const VENDOR_TYPES = ['supplier', 'labor_contractor', 'engineer', 'broker', 'transporter', 'other'];

export default function AddVendorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    vendorCode: '',
    type: 'supplier',
    mobile: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (value: string) => {
    updateField('name', value);
    if (!form.vendorCode || form.vendorCode === generateCode(form.name)) {
      updateField('vendorCode', generateCode(value));
    }
  };

  const generateCode = (name: string) => {
    return 'V-' + name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t('vendors.nameRequired', 'Vendor name is required'));
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        vendorCode: form.vendorCode.trim() || undefined,
        type: form.type,
        mobile: form.mobile.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      await api.post('/vendors', body);
      toast.success(t('vendors.vendorCreated', 'Vendor created successfully'));
      navigate('/app/vendors');
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('common.error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/vendors')}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('vendors.addVendor', 'Add Vendor')}</h1>
          <p className="text-sm text-muted-foreground">{t('vendors.addVendorDesc', 'Add a new vendor or contractor')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Info */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              {t('vendors.vendorDetails', 'Vendor Details')}
            </h2>
          </div>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('vendors.vendorName', 'Vendor Name')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('vendors.vendorNamePlaceholder', 'e.g., Kumar Suppliers')}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              {/* Vendor Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('vendors.vendorCode', 'Vendor Code')}
                </label>
                <Input
                  value={form.vendorCode}
                  onChange={(e) => updateField('vendorCode', e.target.value.toUpperCase())}
                  placeholder={t('vendors.vendorCodePlaceholder', 'Auto-generated')}
                  className="h-11 rounded-xl font-mono"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('common.type', 'Type')}
                </label>
                <select
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                >
                  {VENDOR_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {t(`vendors.types.${vt}`, vt.replace('_', ' '))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('common.mobile', 'Mobile')}
                </label>
                <Input
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', e.target.value)}
                  placeholder="9876543210"
                  className="h-11 rounded-xl"
                  type="tel"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#ACA9A9]" />
                  {t('common.email', 'Email')}
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="vendor@example.com"
                  className="h-11 rounded-xl"
                  type="email"
                />
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
                  placeholder={t('vendors.addressPlaceholder', 'Vendor address')}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* GST Number */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">{t('vendors.gstNumber', 'GST Number')}</label>
                <Input
                  value={form.gstNumber}
                  onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>
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
              placeholder={t('vendors.notesPlaceholder', 'Any additional notes about this vendor...')}
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
            onClick={() => navigate('/app/vendors')}
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
            {t('vendors.createVendor', 'Create Vendor')}
          </Button>
        </div>
      </form>
    </div>
  );
}
