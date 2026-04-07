import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  HardHat,
  Building2,
  Package,
  BarChart3,
  FileBarChart,
  Smartphone,
  Languages,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const featureIcons = [Building2, Package, BarChart3, FileBarChart, Smartphone, Languages];

const plans = [
  {
    nameKey: 'subscription.plans.basic',
    price: '999',
    periodKey: 'subscription.perMonth',
    featureKeys: [
      'subscription.features.upTo3Sites',
      'subscription.features.1User',
      'subscription.features.basicReports',
      'subscription.features.emailSupport',
    ],
    popular: false,
  },
  {
    nameKey: 'subscription.plans.standard',
    price: '2,499',
    periodKey: 'subscription.perMonth',
    featureKeys: [
      'subscription.features.upTo15Sites',
      'subscription.features.5Users',
      'subscription.features.advancedReports',
      'subscription.features.prioritySupport',
      'subscription.features.exportPdfExcel',
      'subscription.features.vendorManagement',
    ],
    popular: true,
  },
  {
    nameKey: 'subscription.plans.premium',
    price: '4,999',
    periodKey: 'subscription.perMonth',
    featureKeys: [
      'subscription.features.unlimitedSites',
      'subscription.features.unlimitedUsers',
      'subscription.features.allReports',
      'subscription.features.dedicatedSupport',
      'subscription.features.apiAccess',
      'subscription.features.customBranding',
      'subscription.features.auditLogs',
    ],
    popular: false,
  },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
    { title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
    { title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{t('common.appName')}</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.features')}
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.pricing')}
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.contact')}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => navigate('/login')}>
              {t('auth.login')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f26f31] via-[#e05a20] to-[#c9531a] py-20 sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-orange-100 sm:text-xl">
            {t('landing.heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-white text-[#f26f31] hover:bg-orange-50 shadow-xl px-8"
              onClick={() => navigate('/login')}
            >
              {t('landing.startFreeTrial')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8"
              onClick={() => navigate('/login')}
            >
              {t('landing.viewDemo')}
            </Button>
          </div>
          <p className="mt-4 text-sm text-orange-200">{t('landing.free14Days')}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.features')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              {t('common.tagline')}
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <Card key={index} className="border-0 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                      <Icon className="h-6 w-6 text-[#f26f31]" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.pricing')}</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {t('landing.free14Days')}
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.nameKey}
                className={`relative transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-2 border-[#f26f31] shadow-xl ring-1 ring-[#f26f31]/20'
                    : 'border shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#f26f31] px-4 py-1 text-xs font-semibold text-white">
                    {t('subscription.mostPopular')}
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold">{t(plan.nameKey)}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold">{t('common.currency')}{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">{t(plan.periodKey)}</span>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.featureKeys.map((featureKey) => (
                      <li key={featureKey} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        {t(featureKey)}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => navigate('/login')}
                  >
                    {t('landing.startFreeTrial')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t('landing.readyToStart')}
          </h2>
          <p className="mt-3 text-orange-100">{t('landing.free14Days')}</p>
          <Button
            size="lg"
            className="mt-8 bg-white text-[#f26f31] hover:bg-orange-50 px-8 shadow-xl"
            onClick={() => navigate('/login')}
          >
            {t('landing.startFreeTrial')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-gray-900 py-12 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <HardHat className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">{t('common.appName')}</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} {t('common.appName')}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
