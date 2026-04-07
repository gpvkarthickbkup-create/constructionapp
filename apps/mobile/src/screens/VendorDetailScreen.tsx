import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, payColor } from '../helpers';

export function VendorDetailScreen({ vendorId, back, dark }: { vendorId: string; back: () => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const r = await api.get(`/vendors/${vendorId}/detail`);
      setData(r.data?.data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changePaymentStatus = async (expenseId: string, status: string) => {
    try {
      await api.put(`/expenses/${expenseId}`, { paymentStatus: status });
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: C.danger, fontSize: 15, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const v = data?.vendor || data || {};
  const exps = data?.recentExpenses || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={back} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        {/* Vendor Info */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366F1' + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#6366F1', fontSize: 24, fontWeight: '700' }}>{(v.name || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={{ color: txt, fontSize: 20, fontWeight: '700' }}>{v.name}</Text>
          <Text style={{ color: C.sub, marginTop: 4, fontSize: 14, textTransform: 'capitalize' }}>{v.type || 'General'}</Text>
          {v.mobile ? <Text style={{ color: C.sub, marginTop: 2, fontSize: 14 }}>{v.mobile}</Text> : null}
          {v.vendorCode ? <Text style={{ color: C.sub, marginTop: 2, fontSize: 12 }}>Code: {v.vendorCode}</Text> : null}
        </View>

        {/* Stat Cards */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[
            { l: 'Paid', v: data?.totalPaid || 0, cl: C.success },
            { l: 'Pending', v: data?.totalPending || 0, cl: C.danger },
            { l: 'Total', v: data?.totalAmount || 0, cl: C.primary },
          ].map((it, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
              <Text style={{ color: C.sub, fontSize: 11, fontWeight: '500' }}>{it.l}</Text>
              <Text style={{ color: it.cl, fontSize: 15, fontWeight: '700', marginTop: 4 }}>{fmt(it.v)}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: C.sub, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 16 }}>{amtWords(data?.totalAmount || 0)}</Text>

        {/* Recent Expenses with payment status change */}
        {exps.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 12 }}>Recent Expenses</Text>
            {exps.map((exp: any) => (
              <View key={exp.id} style={{ backgroundColor: card, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '600' }}>{exp.itemName}</Text>
                    <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{exp.site?.siteName || ''}</Text>
                  </View>
                  <Text style={{ color: txt, fontWeight: '700' }}>{fmt(exp.totalAmount)}</Text>
                </View>
                {/* Payment status selector */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  {['paid', 'partially_paid', 'unpaid'].map(ps => (
                    <TouchableOpacity key={ps} onPress={() => changePaymentStatus(exp.id, ps)} style={{ flex: 1, paddingVertical: 6, borderRadius: 16, backgroundColor: exp.paymentStatus === ps ? (payColor[ps] || C.sub) + '20' : inputBg, alignItems: 'center', borderWidth: 1, borderColor: exp.paymentStatus === ps ? payColor[ps] || C.sub : border }}>
                      <Text style={{ color: exp.paymentStatus === ps ? payColor[ps] || C.sub : C.sub, fontWeight: '600', fontSize: 10, textTransform: 'capitalize' }}>{ps.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
