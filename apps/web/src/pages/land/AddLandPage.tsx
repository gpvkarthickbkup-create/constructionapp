import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatCurrency, amountToWords } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
} from 'lucide-react';

const AREA_UNITS = ['sqft', 'acres', 'cents', 'grounds'];
const OWNERSHIP_TYPES = ['self_owned', 'partnership', 'leased'];
const DTCP_STATUSES = ['pending', 'approved', 'rejected', 'not_required'];

export default function AddLandPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    landName: '',
    landCode: '',
    totalArea: '',
    areaUnit: 'sqft',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    surveyNumber: '',
    address: '',
    purchaseDate: '',
    purchaseCost: '',
    currentValue: '',
    ownershipType: 'self_owned',
    dtcpStatus: 'pending',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.landName.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/lands', {
        ...form,
        totalArea: parseFloat(form.totalArea) || 0,
        purchaseCost: parseFloat(form.purchaseCost) || 0,
        currentValue: parseFloat(form.currentValue) || 0,
      });
      toast.success('Land created successfully');
      navigate(`/app/lands/${res.data.data.id}`);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/lands')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('land.addLand')}</h1>
          <p className="text-sm text-muted-foreground">Fill in the land details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#f26f31]" />
              Land Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('land.landName')} *</label>
                <Input name="landName" value={form.landName} onChange={handleChange} placeholder="e.g., Green Valley Layout" className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('land.landCode')}</label>
                <Input name="landCode" value={form.landCode} onChange={handleChange} placeholder="Auto-generated" className="rounded-xl" />
                <p className="text-xs text-muted-foreground mt-1">Leave blank for auto-generation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1 block">{t('land.totalArea')} *</label>
                <Input name="totalArea" type="number" step="0.01" value={form.totalArea} onChange={handleChange} placeholder="e.g., 10000" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit</label>
                <select name="areaUnit" value={form.areaUnit} onChange={handleChange} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30">
                  {AREA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t('land.surveyNumber')}</label>
              <Input name="surveyNumber" value={form.surveyNumber} onChange={handleChange} placeholder="e.g., 123/4A" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input name="city" value={form.city} onChange={handleChange} placeholder="e.g., Chennai" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">District</label>
                <Input name="district" value={form.district} onChange={handleChange} placeholder="e.g., Kancheepuram" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">State</label>
                <Input name="state" value={form.state} onChange={handleChange} className="rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t('common.address')}</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address of the land"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Details */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-[#f26f31]" />
              Purchase Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Purchase Date</label>
                <Input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">💰 {t('land.purchaseCost')}</label>
                <Input name="purchaseCost" type="number" step="0.01" value={form.purchaseCost} onChange={handleChange} placeholder="₹ Purchase Cost" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">📈 Expected Sale Value</label>
                <Input name="currentValue" type="number" step="0.01" value={form.currentValue} onChange={handleChange} placeholder="₹ Expected Sale / Market Value" className="rounded-xl" />
              </div>
            </div>

            {/* Estimated Profit */}
            {(parseFloat(form.purchaseCost) > 0 && parseFloat(form.currentValue) > 0) && (() => {
              const cost = parseFloat(form.purchaseCost) || 0;
              const sale = parseFloat(form.currentValue) || 0;
              const profit = sale - cost;
              const margin = sale > 0 ? Math.round((profit / sale) * 100) : 0;
              return (
                <div className={`rounded-xl p-4 flex items-center justify-between ${profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">📊 Estimated Profit</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
                    <p className="text-xs text-muted-foreground italic">{amountToWords(Math.abs(profit))}</p>
                  </div>
                  <div className={`text-right px-4 py-2 rounded-lg ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin}%</p>
                    <p className="text-xs text-muted-foreground">margin</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ownership Type</label>
                <select name="ownershipType" value={form.ownershipType} onChange={handleChange} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30">
                  {OWNERSHIP_TYPES.map(o => (
                    <option key={o} value={o}>
                      {o === 'self_owned' ? 'Self Owned' : o === 'partnership' ? 'Partnership' : 'Leased'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">DTCP Status</label>
                <select name="dtcpStatus" value={form.dtcpStatus} onChange={handleChange} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30">
                  {DTCP_STATUSES.map(d => (
                    <option key={d} value={d}>
                      {d === 'not_required' ? 'Not Required' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#f26f31]" />
              {t('common.notes')}
            </h2>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the land..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/app/lands')} className="rounded-xl">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting} className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl shadow-md">
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
