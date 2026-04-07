import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Users,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  HardHat,
  LogOut,
  Globe,
  Store,
  UserCheck,
  Landmark,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const mainNavigation = [
  { key: 'dashboard', href: '/app', icon: LayoutDashboard },
  { key: 'sites', href: '/app/sites', icon: Building2 },
  { key: 'lands', href: '/app/lands', icon: MapPin },
  { key: 'expenses', href: '/app/expenses', icon: Receipt },
  { key: 'vendors', href: '/app/vendors', icon: Store },
  { key: 'clients', href: '/app/customers', icon: UserCheck },
  { key: 'reports', href: '/app/reports', icon: BarChart3 },
  { key: 'notifications', href: '/app/notifications', icon: Bell },
];

const secondaryNavigation = [
  { key: 'users', href: '/app/users', icon: Users },
  { key: 'settings', href: '/app/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { tenant, logout } = useAuthStore();

  const locked = (tenant?.lockedModules || '').split(',').filter(Boolean);
  const visibleMainNav = mainNavigation.filter(item => !locked.includes(item.key));
  const visibleSecondaryNav = secondaryNavigation.filter(item => !locked.includes(item.key));

  const isEn = i18n.language === 'en';

  const toggleLanguage = () => {
    const newLang = isEn ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('buildwise_lang', newLang);
  };

  const renderNavItem = (item: (typeof mainNavigation)[number]) => {
    const isActive =
      location.pathname === item.href ||
      (item.href !== '/app' && location.pathname.startsWith(item.href));

    return (
      <Link
        key={item.key}
        to={item.href}
        title={collapsed ? t(`nav.${item.key}`) : undefined}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'bg-[#f26f31]/8 text-[#f26f31]'
            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f26f31] rounded-r-full" />
        )}

        <item.icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
            isActive
              ? 'text-[#f26f31]'
              : 'text-gray-400 group-hover:text-gray-600'
          )}
          strokeWidth={isActive ? 2 : 1.75}
        />
        {!collapsed && (
          <span className="truncate">{t(`nav.${item.key}`)}</span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/80 transition-all duration-300 ease-in-out flex flex-col select-none',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {tenant?.logo ? (
            <img src={tenant.logo} alt="Logo" className="h-9 w-9 rounded-xl object-contain shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-[#f26f31] flex items-center justify-center shrink-0 shadow-sm shadow-[#f26f31]/20">
              <HardHat className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight truncate">
                {tenant?.companyName || t('common.appName')}
              </h1>
              <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                {t('common.poweredBy')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-2">
            Main
          </p>
        )}
        {visibleMainNav.map(renderNavItem)}

        {/* Section divider */}
        <div className={cn('py-3', collapsed ? 'px-1' : 'px-3')}>
          <div className="border-t border-gray-100 dark:border-gray-800" />
        </div>

        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-2">
            Admin
          </p>
        )}
        {visibleSecondaryNav.map(renderNavItem)}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 w-full transition-all duration-200 group'
          )}
          title={collapsed ? (isEn ? 'தமிழ்' : 'English') : undefined}
        >
          <Globe className="h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" strokeWidth={1.75} />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-gray-500">
                {isEn ? 'EN' : 'TA'}
              </span>
              <div className="relative h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200">
                <span
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200',
                    isEn ? 'left-0.5' : 'left-[18px]'
                  )}
                />
              </div>
              <span className="text-gray-400 text-[11px]">
                {isEn ? 'தமிழ்' : 'EN'}
              </span>
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200 group"
          title={collapsed ? t('auth.logout') : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-red-500 transition-colors duration-200" strokeWidth={1.75} />
          {!collapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-[72px] h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
          'flex items-center justify-center',
          'hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f26f31]/30'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-500" strokeWidth={2} />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-500" strokeWidth={2} />
        )}
      </button>
    </aside>
  );
}
