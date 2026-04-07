import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { HardHat, Eye, EyeOff, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('common.required'));
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success(t('auth.loginSuccess'));
      navigate('/app');
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('auth.invalidCredentials');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('buildwise_lang', newLang);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blueprint px-4">
      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="absolute right-4 top-4"
      >
        <Globe className="mr-1.5 h-4 w-4" />
        {i18n.language === 'en' ? t('common.tamil') : t('common.english')}
      </Button>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <HardHat className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('common.appName')}</h1>
          <p className="text-sm text-muted-foreground">{t('common.tagline')}</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>{t('auth.loginTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('common.email')}</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('auth.password')}</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? t('common.loading') : t('auth.login')}
              </Button>
            </form>

            {/* Register link hidden — admin creates accounts */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
