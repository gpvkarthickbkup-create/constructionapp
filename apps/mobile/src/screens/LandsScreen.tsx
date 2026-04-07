import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, inpS } from '../helpers';

export function LandsScreen({ nav, dark }: { nav: (s: string, p?: any) => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ landName: '', totalArea: '', city: '', district: '', surveyNumber: '', purchaseCost: '', currentValue: '' });

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/lands');
      setLands(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const purchaseCost = parseFloat(form.purchaseCost) || 0;
  const expectedSale = parseFloat(form.currentValue) || 0;
  const expectedProfit = expectedSale - purchaseCost;

  const addLand = async () => {
    if (!form.landName.trim()) return Alert.alert('Error', 'Land name required');
    setAdding(true);
    try {
      await api.post('/lands', {
        landName: form.landName.trim(),
        totalArea: parseFloat(form.totalArea) || 0,
        areaUnit: 'sqft',
        city: form.city.trim(),
        district: form.district.trim(),
        surveyNumber: form.surveyNumber.trim(),
        purchaseCost,
        currentValue: expectedSale,
      });
      setShowAdd(false);
      setForm({ landName: '', totalArea: '', city: '', district: '', surveyNumber: '', purchaseCost: '', currentValue: '' });
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
    } finally {
      setAdding(false);
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

  const statusColor: Record<string, string> = { acquired: C.sub, developing: C.warning, developed: '#6366F1', selling: C.primary, sold_out: C.success };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: txt }}>Lands</Text>
            <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ backgroundColor: showAdd ? inputBg : C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 }}>
              <Text style={{ color: showAdd ? txt : '#fff', fontWeight: '600', fontSize: 14 }}>{showAdd ? 'Cancel' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>

          {showAdd && (
            <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <TextInput placeholder="Land Name *" value={form.landName} onChangeText={v => setForm({ ...form, landName: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Total Area (sqft)" value={form.totalArea} onChangeText={v => setForm({ ...form, totalArea: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput placeholder="City" value={form.city} onChangeText={v => setForm({ ...form, city: v })} style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
                <TextInput placeholder="District" value={form.district} onChangeText={v => setForm({ ...form, district: v })} style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
              </View>
              <TextInput placeholder="Survey Number" value={form.surveyNumber} onChangeText={v => setForm({ ...form, surveyNumber: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Purchase Cost" value={form.purchaseCost} onChangeText={v => setForm({ ...form, purchaseCost: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Expected Sale Value" value={form.currentValue} onChangeText={v => setForm({ ...form, currentValue: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />

              {(purchaseCost > 0 || expectedSale > 0) && (
                <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 12, marginBottom: 10 }}>
                  <Text style={{ color: expectedProfit >= 0 ? C.success : C.danger, fontSize: 14, fontWeight: '600' }}>Expected Profit: {fmt(expectedProfit)}</Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{amtWords(Math.abs(expectedProfit))}</Text>
                </View>
              )}

              <TouchableOpacity onPress={addLand} disabled={adding} style={{ backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{adding ? 'Adding...' : 'Add Land'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {lands.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><Text style={{ color: C.sub, fontSize: 14 }}>No lands</Text></View>
          ) : lands.map(land => (
            <TouchableOpacity key={land.id || land._id} onPress={() => nav('landDetail', { landId: land.id || land._id })} style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: txt, fontSize: 16, fontWeight: '600', flex: 1 }} numberOfLines={1}>{land.landName}</Text>
                <View style={{ backgroundColor: (statusColor[land.status] || C.sub) + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor[land.status] || C.sub, textTransform: 'capitalize' }}>{land.status}</Text>
                </View>
              </View>
              <Text style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{land.landCode}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {land.totalArea ? <Text style={{ color: C.sub, fontSize: 12 }}>📐 {land.totalArea} sqft</Text> : null}
                {land.city ? <Text style={{ color: C.sub, fontSize: 12 }}>📍 {land.city}</Text> : null}
                {land.totalPlots ? <Text style={{ color: C.sub, fontSize: 12 }}>🏘️ {land.totalPlots} plots</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: border }}>
                <Text style={{ color: C.primary, fontSize: 14, fontWeight: '600' }}>Cost: {fmt(land.purchaseCost || 0)}</Text>
                <Text style={{ color: C.success, fontSize: 14, fontWeight: '600' }}>Value: {fmt(land.currentValue || 0)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
