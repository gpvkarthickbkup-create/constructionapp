import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();
  const { user, theme, toggleTheme } = useAuthStore();

  return (
    <header className="h-14 border-b border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 sticky top-0 z-30 flex items-center justify-end px-6 no-print">
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-500" />}
        </button>
        <Link to="/app/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#f26f31] rounded-full ring-2 ring-white dark:ring-gray-900" />
        </Link>
        <div className="h-7 w-px bg-gray-200 dark:bg-gray-700" />
        <Link to="/app/settings" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#f26f31] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user ? getInitials(`${user.firstName} ${user.lastName || ''}`) : '?'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{user?.roles?.[0]?.displayName}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
