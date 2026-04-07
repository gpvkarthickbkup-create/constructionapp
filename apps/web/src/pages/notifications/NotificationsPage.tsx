import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellOff,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCheck,
} from 'lucide-react';

type FilterTab = 'all' | 'unread';

const notificationTypeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  subscription_expiry: { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  payment_reminder: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  budget_overrun: { icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
  no_activity: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // No notifications data yet - showing empty state
  const notifications: any[] = [];
  const unreadCount = 0;

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('notifications.title', 'Notifications')}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? t('notifications.unreadCount', '{{count}} unread', { count: unreadCount })
              : t('notifications.allCaughtUp', 'You are all caught up')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="rounded-xl gap-2">
            <CheckCheck className="h-4 w-4" />
            {t('notifications.markAllRead', 'Mark All Read')}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'all'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('notifications.all', 'All')}
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'unread'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('notifications.unread', 'Unread')}
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#f26f31] text-white text-xs">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List or Empty State */}
      {filteredNotifications.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
                <Bell className="h-12 w-12 text-[#f26f31]/40" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t('notifications.noNotifications', 'No notifications yet')}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {t('notifications.noNotificationsDesc', 'When there are updates about your sites, budgets, or payments, they will appear here.')}
            </p>

            {/* Notification types preview */}
            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-md">
              {Object.entries(notificationTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3 border border-dashed border-muted-foreground/20',
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(`notifications.types.${type}`, type.replace(/_/g, ' '))}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification: any) => {
            const typeConfig = notificationTypeConfig[notification.type] || {
              icon: Bell,
              color: 'text-gray-600',
              bg: 'bg-gray-50',
            };
            const Icon = typeConfig.icon;

            return (
              <Card
                key={notification.id}
                className={cn(
                  'shadow-sm border-0 transition-all hover:shadow-md cursor-pointer',
                  !notification.read && 'border-l-4 border-l-[#f26f31]'
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', typeConfig.bg)}>
                    <Icon className={cn('h-5 w-5', typeConfig.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-[#f26f31] shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notification.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
