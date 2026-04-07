import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, inpS } from '../helpers';

export function ClientDetailScreen({ clientId, back, dark }: { clientId: string; back: () => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [payAmt, setPayAmt] = useState('');
  const [payType, setPayType] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError('');
      const r = await api.get(`/customers/${clientId}`);
      setData(r.data?.data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const recordPay = async () => {
    if (!payAmt || parseFloat(payAmt) <= 0) return Alert.alert('Enter amount');
    setPaying(true);
    try {
      await api.post(`/customers/${clientId}/collections`, {
        amount: parseFloat(payAmt),
        paymentType: payType,
        reference: payRef.trim() || undefined,
      });
      setPayAmt(''); setPayRef('');
      Alert.alert('Payment recorded');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
    } finally {
      setPaying(false);
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

  const cl = data?.customer || data || {};
  const collections = data?.collections || cl.collections || [];
  const totalCollected = data?.totalCollected || cl.totalCollected || 0;

  // Receipt view
  if (receiptId) {
    const payment = collections.find((p: any) => (p.id || p._id) === receiptId);
    if (payment) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: bg }}>
          <View style={{ padding: 20 }}>
            <TouchableOpacity onPress={() => setReceiptId(null)} style={{ marginBottom: 16 }}>
              <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: card, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: txt, marginBottom: 8 }}>Payment Receipt</Text>
              <View style={{ width: 60, height: 2, backgroundColor: C.primary, marginBottom: 20 }} />
              <Text style={{ color: C.sub, fontSize: 13, marginBottom: 4 }}>Client</Text>
              <Text style={{ color: txt, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>{cl.name}</Text>
              <Text style={{ color: C.success, fontSize: 32, fontWeight: '800' }}>{fmt(payment.amount)}</Text>
              <Text style={{ color: C.sub, fontSize: 13, fontStyle: 'italic', marginTop: 4, marginBottom: 20 }}>{amtWords(payment.amount)}</Text>
              {[
                { l: 'Payment Type', v: (payment.paymentType || '').toUpperCase() },
                { l: 'Reference', v: payment.reference || '-' },
                { l: 'Date', v: payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-GB') : '-' },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                  <Text style={{ color: C.sub, fontSize: 14 }}>{r.l}</Text>
                  <Text style={{ color: txt, fontSize: 14, fontWeight: '500' }}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      );
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={back} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        {/* Client Info */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: C.primary, fontSize: 24, fontWeight: '700' }}>{(cl.name || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={{ color: txt, fontSize: 20, fontWeight: '700' }}>{cl.name}</Text>
          {cl.mobile ? <Text style={{ color: C.sub, marginTop: 4, fontSize: 14 }}>{cl.mobile}</Text> : null}
          {cl.email ? <Text style={{ color: C.sub, marginTop: 2, fontSize: 14 }}>{cl.email}</Text> : null}
        </View>

        {/* Total Collected */}
        <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ color: C.sub, fontSize: 12 }}>Total Collected</Text>
          <Text style={{ color: C.success, fontSize: 22, fontWeight: '700', marginTop: 4 }}>{fmt(totalCollected)}</Text>
          <Text style={{ color: C.sub, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{amtWords(totalCollected)}</Text>
        </View>

        {/* Record Payment */}
        <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border, marginBottom: 20 }}>
          <Text style={{ color: txt, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Record Payment</Text>
          <TextInput placeholder="Amount" value={payAmt} onChangeText={setPayAmt} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
          {payAmt ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8, fontStyle: 'italic' }}>{amtWords(parseFloat(payAmt) || 0)}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {['cash', 'upi', 'bank', 'cheque'].map(t => (
              <TouchableOpacity key={t} onPress={() => setPayType(t)} style={{ flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: payType === t ? C.primary : inputBg, alignItems: 'center', borderWidth: 1, borderColor: payType === t ? C.primary : border }}>
                <Text style={{ color: payType === t ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput placeholder="Reference (optional)" value={payRef} onChangeText={setPayRef} style={inpS(dark)} placeholderTextColor={C.sub} />
          <TouchableOpacity onPress={recordPay} disabled={paying} style={{ backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{paying ? 'Saving...' : 'Save Payment'}</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History */}
        {collections.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 12 }}>Payment History</Text>
            {collections.map((p: any, i: number) => (
              <TouchableOpacity key={p.id || i} onPress={() => setReceiptId(p.id || p._id)} style={{ backgroundColor: card, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: txt, fontWeight: '600' }}>{fmt(p.amount)}</Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{p.paymentType} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : ''}</Text>
                </View>
                <Text style={{ color: C.success, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' }}>{p.paymentType}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
