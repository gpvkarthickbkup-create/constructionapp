import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

export default function PrintButton() {
  const { t } = useTranslation();
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
      <Printer className="mr-1.5 h-4 w-4" /> {t('common.print')}
    </Button>
  );
}

export function PrintHeader() {
  const { tenant } = useAuthStore();
  const { t } = useTranslation();
  return (
    <div className="hidden print:block mb-6 border-b pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logo && <img src={tenant.logo.startsWith('/') ? window.location.origin + tenant.logo : tenant.logo} alt="Logo" className="h-12 w-12 object-contain" />}
          <div>
            <h1 className="text-xl font-bold">{tenant?.companyName || t('common.appName')}</h1>
            <p className="text-xs text-gray-500">{tenant?.address || ''}</p>
            <p className="text-xs text-gray-500">{tenant?.mobile ? `Tel: ${tenant.mobile}` : ''}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

export function PrintFooter() {
  const { t } = useTranslation();
  return (
    <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-400">
      <p>{t('common.poweredBy')}</p>
    </div>
  );
}
