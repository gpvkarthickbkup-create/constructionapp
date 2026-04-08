import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, C } from '../helpers';

export function HomeScreen({ nav, onSwitchTab, dark, tenant }: { nav: (s: string, p?: any) => void; onSwitchTab: (t: string) => void; dark: boolean; tenant?: any }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [stats, setStats] = useState<any>(null);
  const [activeSites, setActiveSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/dashboard');
      const d = r.data?.data;
      setStats(d?.stats || {});
      setActiveSites(d?.activeSites || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: C.danger, fontSize: 15, textAlign: 'center', marginBottom: 12, fontWeight: '500' }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const items = [
    { label: 'Total Sites', val: stats?.totalSites ?? 0, icon: '🏗️' },
    { label: 'Active Sites', val: stats?.activeSites ?? 0, icon: '✅' },
    { label: 'Total Spend', val: fmt(stats?.totalSpend ?? 0), icon: '💰' },
    { label: 'Material', val: fmt(stats?.materialSpend ?? 0), icon: '📦' },
    { label: 'Labor', val: fmt(stats?.laborSpend ?? 0), icon: '👷' },
    { label: 'Pending', val: fmt(stats?.pendingPayments ?? 0), icon: '⏳' },
    { label: 'This Month', val: fmt(stats?.thisMonthSpend ?? 0), icon: '📅' },
    { label: 'Today', val: fmt(stats?.todaySpend ?? 0), icon: '📊' },
  ];

  const locked = (tenant?.lockedModules || '').split(',').filter(Boolean);
  const actions = [
    { label: '+ Expense', action: () => nav('addExpense'), key: 'expenses' },
    { label: 'Sites', action: () => onSwitchTab('sites'), key: 'sites' },
    { label: 'Clients', action: () => onSwitchTab('more'), key: 'clients' },
  ].filter(a => !locked.includes(a.key));

  // Budget overrun alerts
  const overruns = activeSites.filter((s: any) => s.estimatedBudget > 0 && (s.totalSpent || 0) > s.estimatedBudget);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: txt, marginBottom: 20 }}>Dashboard</Text>

        {/* Stat Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {items.map((it, i) => (
            <View key={i} style={{ width: '48%', backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}>
              <Text style={{ fontSize: 16, marginBottom: 6 }}>{it.icon}</Text>
              <Text style={{ color: txt, fontSize: 22, fontWeight: '700', marginBottom: 2 }}>{it.val}</Text>
              <Text style={{ color: C.sub, fontSize: 12, fontWeight: '500' }}>{it.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginTop: 8, marginBottom: 12 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {actions.map((a, i) => (
            <TouchableOpacity key={i} onPress={a.action} style={{ flex: 1, minWidth: '22%', backgroundColor: i === 0 ? C.primary : card, paddingVertical: 12, borderRadius: 24, alignItems: 'center', borderWidth: i === 0 ? 0 : 1, borderColor: border }}>
              <Text style={{ color: i === 0 ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget Overrun Alerts */}
        {overruns.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.danger, marginBottom: 12 }}>Budget Overrun Alerts</Text>
            {overruns.map((s: any) => {
              const over = (s.totalSpent || 0) - s.estimatedBudget;
              return (
                <TouchableOpacity key={s.id} onPress={() => nav('siteDetail', { siteId: s.id })} style={{ backgroundColor: C.danger + '10', padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: C.danger + '30' }}>
                  <Text style={{ color: txt, fontWeight: '600', fontSize: 14 }}>{s.siteName}</Text>
                  <Text style={{ color: C.danger, fontSize: 13, marginTop: 4, fontWeight: '600' }}>Over by {fmt(over)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Active Sites */}
        {activeSites.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 12 }}>Active Sites</Text>
            {activeSites.map((s: any) => {
              const pct = s.estimatedBudget > 0 ? Math.min(((s.totalSpent || 0) / s.estimatedBudget) * 100, 100) : 0;
              return (
                <TouchableOpacity key={s.id} onPress={() => nav('siteDetail', { siteId: s.id })} style={{ backgroundColor: card, padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: txt, fontWeight: '600', fontSize: 15, flex: 1 }} numberOfLines={1}>{s.siteName}</Text>
                    <Text style={{ color: C.sub, fontSize: 12 }}>{fmt(s.totalSpent || 0)} / {fmt(s.estimatedBudget || 0)}</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: inputBg, borderRadius: 2, marginTop: 10 }}>
                    <View style={{ height: 4, backgroundColor: pct > 90 ? C.danger : pct > 70 ? C.warning : C.primary, borderRadius: 2, width: `${pct}%` }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
