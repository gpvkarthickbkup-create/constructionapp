import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, C } from '../helpers';

type ReportType = 'site-wise' | 'category-wise' | 'vendor-wise' | 'pending-payments' | null;

const reportCards = [
  { type: 'site-wise' as ReportType, icon: '🏗️', title: 'Site-wise Expense', desc: 'Total breakdown per site' },
  { type: 'category-wise' as ReportType, icon: '📊', title: 'Category-wise', desc: 'By material, labor, etc.' },
  { type: 'vendor-wise' as ReportType, icon: '👤', title: 'Vendor-wise', desc: 'Payments per vendor' },
  { type: 'pending-payments' as ReportType, icon: '⏳', title: 'Pending Payments', desc: 'Unpaid & partial entries' },
];

export function ReportsScreen({ dark }: { dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async (type: ReportType) => {
    if (!type) return;
    setLoading(true);
    setReportData([]);
    setError('');
    try {
      let endpoint = '';
      switch (type) {
        case 'site-wise': endpoint = '/reports/site-wise'; break;
        case 'category-wise': endpoint = '/reports/category-wise'; break;
        case 'vendor-wise': endpoint = '/reports/vendor-wise'; break;
        case 'pending-payments': endpoint = '/reports/pending-payments'; break;
      }
      const r = await api.get(endpoint);
      setReportData(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const selectReport = (type: ReportType) => {
    setActiveReport(type);
    fetchReport(type);
  };

  // Report selector
  if (!activeReport) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: txt, marginBottom: 20 }}>Reports</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {reportCards.map(rc => (
              <TouchableOpacity key={rc.type} onPress={() => selectReport(rc.type)} style={{ width: '48%', backgroundColor: card, padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{rc.icon}</Text>
                <Text style={{ color: txt, fontWeight: '600', fontSize: 14, textAlign: 'center' }}>{rc.title}</Text>
                <Text style={{ color: C.sub, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{rc.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentCard = reportCards.find(r => r.type === activeReport);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReport(activeReport); }} />}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={() => setActiveReport(null)} style={{ marginBottom: 16 }}>
            <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back to Reports</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '700', color: txt, marginBottom: 16 }}>{currentCard?.icon} {currentCard?.title}</Text>

          {loading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>
          ) : error ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <Text style={{ color: C.danger, fontSize: 14, marginBottom: 12 }}>{error}</Text>
              <TouchableOpacity onPress={() => fetchReport(activeReport)} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : reportData.length === 0 ? (
            <Text style={{ color: C.sub, fontSize: 14, textAlign: 'center', paddingTop: 40 }}>No data</Text>
          ) : (
            <View>
              {activeReport === 'site-wise' && reportData.map((item: any, i: number) => (
                <View key={i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.siteName || item.site?.siteName || '-'}</Text>
                    <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>{fmt(item.totalAmount || item._sum?.totalAmount || 0)}</Text>
                  </View>
                  {item.expenseCount ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{item.expenseCount} expenses</Text> : null}
                </View>
              ))}

              {activeReport === 'category-wise' && reportData.map((item: any, i: number) => (
                <View key={i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{item.expenseType || item.category || '-'}</Text>
                    <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>{fmt(item.totalAmount || item._sum?.totalAmount || 0)}</Text>
                  </View>
                  {item._count ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{item._count} items</Text> : null}
                </View>
              ))}

              {activeReport === 'vendor-wise' && reportData.map((item: any, i: number) => (
                <View key={i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.vendorName || item.vendor?.name || '-'}</Text>
                    <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>{fmt(item.totalAmount || item._sum?.totalAmount || 0)}</Text>
                  </View>
                  {item.pendingAmount ? <Text style={{ color: C.warning, fontSize: 12, marginTop: 4 }}>Pending: {fmt(item.pendingAmount)}</Text> : null}
                </View>
              ))}

              {activeReport === 'pending-payments' && reportData.map((item: any, i: number) => (
                <View key={i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: txt, fontSize: 14, fontWeight: '600' }}>{item.itemName || '-'}</Text>
                      <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{item.site?.siteName || ''}{item.vendor?.name ? ` · ${item.vendor.name}` : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: C.danger, fontSize: 14, fontWeight: '700' }}>{fmt(item.totalAmount || 0)}</Text>
                      <View style={{ backgroundColor: (item.paymentStatus === 'unpaid' ? C.danger : C.warning) + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: item.paymentStatus === 'unpaid' ? C.danger : C.warning, textTransform: 'capitalize' }}>{(item.paymentStatus || '').replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
