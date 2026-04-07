import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  Users,
  X,
  FileText,
  StickyNote,
  Loader2,
} from 'lucide-react';

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Add customer form
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', { params: { page, search } });
      const resData = res.data.data || res.data;
      setCustomers(resData.data || resData || []);
      setPagination(resData.pagination || null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      toast.error(t('common.requiredFields'));
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/customers', form);
      toast.success(t('customers.customerCreated'));
      setForm({ name: '', mobile: '', email: '', address: '', gstNumber: '', notes: '' });
      setShowAddForm(false);
      fetchCustomers();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#f26f31', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f26f31]/10">
            <Users className="h-5 w-5 text-[#f26f31]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('customers.title')}</h1>
            <p className="text-sm text-[#ACA9A9]">{t('customers.title')}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-[#f26f31] hover:bg-[#f26f31]/90 text-white shadow-lg shadow-[#f26f31]/20 h-12 px-6 text-base font-semibold rounded-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#ACA9A9]" />
        <Input
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
        />
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-[#f26f31]" />
                  {t('customers.addCustomer')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="h-4 w-4 text-[#f26f31]" />
                    {t('customers.name')} *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.namePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="h-4 w-4 text-[#f26f31]" />
                    {t('customers.mobile')} *
                  </label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.mobilePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {t('customers.email')}
                  </label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.emailPlaceholder')}
                    type="email"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="h-4 w-4 text-red-400" />
                    {t('customers.address')}
                  </label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.addressPlaceholder')}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <FileText className="h-4 w-4 text-purple-500" />
                    {t('customers.gstNumber')}
                  </label>
                  <Input
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.gstPlaceholder')}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <StickyNote className="h-4 w-4 text-yellow-500" />
                    {t('customers.notes')}
                  </label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('customers.notesPlaceholder')}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-[#f26f31]/20"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-5 w-5" />
                  )}
                  {t('customers.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 mb-4">
            <User className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('customers.noCustomers')}</h3>
          <p className="text-sm text-[#ACA9A9] max-w-sm mb-6">{t('customers.noCustomersDesc')}</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-12 px-6 text-base rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('customers.addCustomer')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: any) => {
            const firstLetter = (customer.name || 'C').charAt(0).toUpperCase();
            const avatarColor = getAvatarColor(customer.name || '');

            return (
              <Card
                key={customer.id}
                className="border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group overflow-hidden"
                onClick={() => navigate(`/app/customers/${customer.id}`)}
              >
                <div className="h-1 transition-colors" style={{ backgroundColor: avatarColor }} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-xl shadow-md"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {firstLetter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#f26f31] transition-colors">
                        {customer.name}
                      </h3>

                      {customer.mobile && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-[#f26f31]" />
                          <span>{customer.mobile}</span>
                        </div>
                      )}

                      {customer.email && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}

                      {customer.address && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-red-400" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-10 px-4 rounded-xl"
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-[#ACA9A9] px-3">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="h-10 px-4 rounded-xl"
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
