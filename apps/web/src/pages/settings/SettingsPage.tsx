import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Layers,
  CreditCard,
  Info,
  Phone,
  Mail,
  MapPin,
  Check,
  Save,
  Loader2,
  User,
  FileText,
  Image,
  Calendar,
  Plus,
  X,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

type SettingsTab = 'company' | 'subscription' | 'language' | 'theme' | 'categories' | 'about';

interface Category {
  id: string;
  name: string;
  nameTa: string;
  type: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface CompanyForm {
  companyName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string;
  logo: string;
}

const tabs: { key: SettingsTab; icon: typeof Building2; labelKey: string }[] = [
  { key: 'company', icon: Building2, labelKey: 'settings.companyDetails' },
  { key: 'subscription', icon: CreditCard, labelKey: 'settings.subscription' },
  { key: 'language', icon: Globe, labelKey: 'settings.language' },
  { key: 'theme', icon: Monitor, labelKey: 'settings.theme' },
  { key: 'categories', icon: Layers, labelKey: 'settings.expenseCategories' },
  { key: 'about', icon: Info, labelKey: 'settings.about' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { tenant, user, setLanguage, fetchMe, theme, toggleTheme } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // Company form state
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    companyName: '',
    ownerName: '',
    mobile: '',
    email: '',
    address: '',
    gstNumber: '',
    logo: '',
  });
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameTa, setNewCatNameTa] = useState('');
  const [newCatType, setNewCatType] = useState('material');
  const [newCatColor, setNewCatColor] = useState('#f26f31');
  const [savingCategory, setSavingCategory] = useState(false);

  const currentLang = i18n.language || 'en';

  // Load company data on mount
  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await api.get('/users/company');
      const data = res.data.data || res.data;
      setCompanyForm({
        companyName: data.companyName || '',
        ownerName: data.ownerName || '',
        mobile: data.mobile || '',
        email: data.email || user?.email || '',
        address: data.address || '',
        gstNumber: data.gstNumber || '',
        logo: data.logo || '',
      });
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch {
      // Use store data as fallback
      setCompanyForm((prev) => ({
        ...prev,
        companyName: tenant?.companyName || '',
        email: user?.email || '',
      }));
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await api.put('/users/company', {
        companyName: companyForm.companyName,
        ownerName: companyForm.ownerName,
        mobile: companyForm.mobile,
        address: companyForm.address,
        gstNumber: companyForm.gstNumber,
        logo: companyForm.logo,
      });
      toast.success(t('settings.companySaved', 'Company details saved successfully'));
      // Refresh auth store so sidebar/header updates immediately
      fetchMe();
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setSavingCompany(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/users/categories');
      setCategories(res.data.data || []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    toast.success(t('settings.languageChanged', 'Language updated'));
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error(t('settings.categoryNameRequired', 'Category name is required'));
      return;
    }
    setSavingCategory(true);
    try {
      await api.post('/users/categories', {
        name: newCatName.trim(),
        nameTa: newCatNameTa.trim() || undefined,
        type: newCatType,
        color: newCatColor,
      });
      toast.success(t('settings.categoryAdded', 'Category added successfully'));
      setNewCatName('');
      setNewCatNameTa('');
      setNewCatType('material');
      setNewCatColor('#f26f31');
      setShowAddCategory(false);
      fetchCategories();
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setSavingCategory(false);
    }
  };

  const updateField = (field: keyof CompanyForm, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  // Subscription helpers
  const planName = subscription?.plan?.displayName || subscription?.plan?.name || t('settings.freePlan', 'Free Plan');
  const planPrice = subscription?.plan?.price;
  const subStatus = subscription?.status || tenant?.status || 'active';
  const endDate = subscription?.endDate;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.subtitle', 'Manage your application preferences')}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Tabs */}
        <div className="lg:w-60 shrink-0">
          <Card className="shadow-md border-0 overflow-hidden">
            <CardContent className="p-2">
              <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left',
                        activeTab === tab.key
                          ? 'bg-[#f26f31] text-white shadow-md shadow-[#f26f31]/20'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {t(tab.labelKey, tab.key)}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* ===== COMPANY PROFILE ===== */}
          {activeTab === 'company' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <Building2 className="h-5 w-5" />
                  {t('settings.companyDetails', 'Company Profile')}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {t('settings.companyProfileDesc', 'Update your company information')}
                </p>
              </div>
              <CardContent className="p-6">
                {loadingCompany ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-11 animate-pulse rounded-xl bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Company Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('settings.companyName', 'Company Name')}
                        </label>
                        <Input
                          value={companyForm.companyName}
                          onChange={(e) => updateField('companyName', e.target.value)}
                          placeholder={t('settings.companyNamePlaceholder', 'Enter company name')}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                        />
                      </div>

                      {/* Owner Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('settings.ownerName', 'Owner Name')}
                        </label>
                        <Input
                          value={companyForm.ownerName}
                          onChange={(e) => updateField('ownerName', e.target.value)}
                          placeholder={t('settings.ownerNamePlaceholder', 'Enter owner name')}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                        />
                      </div>

                      {/* Mobile */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('settings.mobile', 'Mobile')}
                        </label>
                        <Input
                          value={companyForm.mobile}
                          onChange={(e) => updateField('mobile', e.target.value)}
                          placeholder={t('settings.mobilePlaceholder', '+91 98765 43210')}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                        />
                      </div>

                      {/* Email (readonly) */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('common.email', 'Email')}
                        </label>
                        <div className="flex h-11 items-center rounded-xl border border-gray-100 bg-gray-50 dark:bg-muted/30 px-4 text-sm text-muted-foreground">
                          {companyForm.email || '-'}
                        </div>
                      </div>

                      {/* GST Number */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('settings.gstNumber', 'GST Number')}
                        </label>
                        <Input
                          value={companyForm.gstNumber}
                          onChange={(e) => updateField('gstNumber', e.target.value)}
                          placeholder={t('settings.gstPlaceholder', 'Enter GST number')}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#f26f31] focus:ring-[#f26f31]/20"
                        />
                      </div>

                      {/* Logo Upload */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Image className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('settings.companyLogo', 'Company Logo')}
                        </label>
                        <div className="flex items-center gap-4">
                          {companyForm.logo ? (
                            <div className="relative">
                              <img src={companyForm.logo} alt="Logo" className="h-16 w-16 rounded-xl object-contain border" />
                              <button
                                type="button"
                                onClick={() => updateField('logo', '')}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                              >×</button>
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                              <Image className="h-6 w-6" />
                            </div>
                          )}
                          <div>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[#f26f31] text-white px-4 py-2 text-sm font-medium hover:bg-[#c9531a] transition-colors">
                              📷 Upload Logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const res = await api.post('/upload/single', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                    updateField('logo', res.data.data.url);
                                    toast.success(t('settings.logoUploaded', 'Logo uploaded'));
                                  } catch { toast.error(t('settings.uploadFailed', 'Upload failed')); }
                                }}
                              />
                            </label>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG (max 2MB)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address (full width) */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {t('settings.address', 'Address')}
                      </label>
                      <textarea
                        value={companyForm.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder={t('settings.addressPlaceholder', 'Enter company address')}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm focus:border-[#f26f31] focus:outline-none focus:ring-2 focus:ring-[#f26f31]/20 resize-none"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <Button
                        onClick={handleSaveCompany}
                        disabled={savingCompany}
                        className="h-11 px-8 rounded-xl bg-[#f26f31] hover:bg-[#c9531a] text-white shadow-md shadow-[#f26f31]/20 transition-all hover:shadow-lg"
                      >
                        {savingCompany ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {t('common.save', 'Save Changes')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== SUBSCRIPTION ===== */}
          {activeTab === 'subscription' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <CreditCard className="h-5 w-5" />
                  {t('settings.subscription', 'Subscription')}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {t('settings.subscriptionDesc', 'Your current plan and billing')}
                </p>
              </div>
              <CardContent className="p-6">
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-orange-50/60 to-amber-50/40 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        {t('settings.currentPlan', 'Current Plan')}
                      </p>
                      <h3 className="mt-1.5 text-2xl font-bold text-[#f26f31]">{planName}</h3>
                      {planPrice != null && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatCurrency(planPrice)} / {t('settings.month', 'month')}
                        </p>
                      )}
                    </div>
                    <Badge variant={subStatus === 'active' ? 'success' : 'warning'} className="text-xs capitalize">
                      {subStatus}
                    </Badge>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">{t('common.status', 'Status')}</p>
                      <p className="mt-1 text-base font-semibold capitalize">{subStatus}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">{t('settings.expiryDate', 'Expiry Date')}</p>
                      <p className="mt-1 text-base font-semibold">
                        {endDate ? formatDate(endDate) : t('settings.noExpiry', 'No expiry')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">{t('settings.daysRemaining', 'Days Remaining')}</p>
                      <p className={cn(
                        'mt-1 text-base font-semibold',
                        daysRemaining !== null && daysRemaining <= 7 ? 'text-red-600' : daysRemaining !== null && daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'
                      )}>
                        {daysRemaining !== null ? `${daysRemaining} ${t('settings.days', 'days')}` : '--'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  {t('settings.subscriptionNote', 'Contact support to upgrade your plan or manage billing.')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ===== LANGUAGE ===== */}
          {activeTab === 'language' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <Globe className="h-5 w-5" />
                  {t('settings.language', 'Language')}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {t('settings.languageDesc', 'Select your preferred language for the interface.')}
                </p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
                  {/* English */}
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md',
                      currentLang === 'en'
                        ? 'border-[#f26f31] bg-orange-50/60 shadow-md shadow-[#f26f31]/10'
                        : 'border-gray-100 hover:border-[#f26f31]/40'
                    )}
                  >
                    {currentLang === 'en' && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#f26f31] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                      EN
                    </div>
                    <div>
                      <p className="text-base font-semibold">English</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Default language</p>
                    </div>
                  </button>

                  {/* Tamil */}
                  <button
                    onClick={() => handleLanguageChange('ta')}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md',
                      currentLang === 'ta'
                        ? 'border-[#f26f31] bg-orange-50/60 shadow-md shadow-[#f26f31]/10'
                        : 'border-gray-100 hover:border-[#f26f31]/40'
                    )}
                  >
                    {currentLang === 'ta' && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#f26f31] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-2xl font-bold text-green-600">
                      TA
                    </div>
                    <div>
                      <p className="text-base font-semibold">Tamil</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Interface in Tamil</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== THEME ===== */}
          {activeTab === 'theme' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <Monitor className="h-5 w-5" />
                  {t('settings.theme', 'Theme')}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {t('settings.themeDesc', 'Choose your preferred appearance.')}
                </p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
                  {/* Light Mode */}
                  <button
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md',
                      theme === 'light'
                        ? 'border-[#f26f31] bg-orange-50/60 shadow-md shadow-[#f26f31]/10'
                        : 'border-gray-100 dark:border-gray-700 hover:border-[#f26f31]/40'
                    )}
                  >
                    {theme === 'light' && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#f26f31] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
                      <Sun className="h-7 w-7 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{t('settings.lightMode', 'Light Mode')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.lightModeDesc', 'Default bright appearance')}</p>
                    </div>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md',
                      theme === 'dark'
                        ? 'border-[#f26f31] bg-orange-50/60 dark:bg-[#f26f31]/10 shadow-md shadow-[#f26f31]/10'
                        : 'border-gray-100 dark:border-gray-700 hover:border-[#f26f31]/40'
                    )}
                  >
                    {theme === 'dark' && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#f26f31] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <Moon className="h-7 w-7 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{t('settings.darkMode', 'Dark Mode')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.darkModeDesc', 'Easy on the eyes at night')}</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== EXPENSE CATEGORIES ===== */}
          {activeTab === 'categories' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <Layers className="h-5 w-5" />
                  {t('settings.expenseCategories', 'Expense Categories')}
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  {t('settings.categoriesDesc', 'All expense categories configured for your account')}
                </p>
              </div>
              <CardContent className="p-0">
                {loadingCategories ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center">
                      <Layers className="h-7 w-7 text-[#f26f31]/40" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      {t('settings.noCategories', 'No categories found')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/80 dark:bg-muted/30 text-left">
                          <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('settings.categoryColor', 'Color')}
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('settings.categoryName', 'Name')}
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('settings.categoryNameTa', 'Tamil Name')}
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('common.type', 'Type')}
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('common.status', 'Status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, idx) => (
                          <tr
                            key={cat.id}
                            className={cn(
                              'border-b last:border-0 transition-colors hover:bg-orange-50/30',
                              idx % 2 === 1 && 'bg-gray-50/40 dark:bg-muted/10'
                            )}
                          >
                            <td className="px-6 py-4">
                              <div
                                className="h-5 w-5 rounded-full shadow-sm border border-white"
                                style={{ backgroundColor: cat.color || '#ACA9A9' }}
                              />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{cat.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{cat.nameTa || '-'}</td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="capitalize text-xs font-medium">
                                {cat.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={cat.isActive ? 'success' : 'secondary'}>
                                {cat.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Category Section */}
                <div className="p-4 border-t border-gray-100">
                  {!showAddCategory ? (
                    <Button
                      onClick={() => setShowAddCategory(true)}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-dashed border-2 border-gray-300 hover:border-[#f26f31] hover:bg-[#f26f31]/5 text-muted-foreground hover:text-[#f26f31] transition-all"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('settings.addCategory', 'Add Category')}
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-[#f26f31]/20 bg-orange-50/30 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Plus className="h-4 w-4 text-[#f26f31]" />
                          {t('settings.addCategory', 'Add Category')}
                        </h4>
                        <button onClick={() => setShowAddCategory(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t('settings.categoryName', 'Name')} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="e.g., Cement"
                            className="h-10 rounded-xl"
                          />
                        </div>

                        {/* Tamil Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t('settings.categoryNameTa', 'Tamil Name')}
                          </label>
                          <Input
                            value={newCatNameTa}
                            onChange={(e) => setNewCatNameTa(e.target.value)}
                            placeholder="e.g., சிமெண்ட்"
                            className="h-10 rounded-xl"
                          />
                        </div>

                        {/* Type */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t('common.type', 'Type')}
                          </label>
                          <select
                            value={newCatType}
                            onChange={(e) => setNewCatType(e.target.value)}
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26f31]/30"
                          >
                            {['material', 'labor', 'commission', 'transport', 'rental', 'miscellaneous'].map((tp) => (
                              <option key={tp} value={tp}>{tp.charAt(0).toUpperCase() + tp.slice(1)}</option>
                            ))}
                          </select>
                        </div>

                        {/* Color Swatches */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t('settings.categoryColor', 'Color')}
                          </label>
                          <div className="flex items-center gap-2 h-10">
                            {['#f26f31', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewCatColor(c)}
                                className={cn(
                                  'h-7 w-7 rounded-full border-2 transition-all',
                                  newCatColor === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddCategory(false)}
                          className="rounded-xl"
                        >
                          {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                          onClick={handleAddCategory}
                          disabled={savingCategory || !newCatName.trim()}
                          size="sm"
                          className="rounded-xl bg-[#f26f31] hover:bg-[#c9531a] text-white shadow-md"
                        >
                          {savingCategory ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {t('settings.addCategory', 'Add Category')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== ABOUT ===== */}
          {activeTab === 'about' && (
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-5 rounded-t-xl">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <Info className="h-5 w-5" />
                  {t('settings.about', 'About')}
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* App identity */}
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#f26f31] to-[#c9531a] flex items-center justify-center shadow-lg shadow-[#f26f31]/20">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Datalytics Construction</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.appDescription', 'Construction Cost Tracking & Management')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50/80 dark:bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">{t('settings.version', 'Version')}</p>
                    <p className="mt-1 text-base font-semibold">1.0.0</p>
                  </div>
                  <div className="rounded-xl bg-gray-50/80 dark:bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">{t('settings.supportEmail', 'Support Email')}</p>
                    <p className="mt-1 text-base font-semibold">support@datalytics.app</p>
                  </div>
                  <div className="rounded-xl bg-gray-50/80 dark:bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">{t('settings.supportPhone', 'Support Phone')}</p>
                    <p className="mt-1 text-base font-semibold">+91 98765 43210</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 text-xs text-muted-foreground">
                  <p>{t('settings.copyright', 'Copyright 2026 Datalytics Construction. All rights reserved.')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
