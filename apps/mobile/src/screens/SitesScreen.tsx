import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, C, inpS } from '../helpers';

export function SitesScreen({ nav, dark }: { nav: (s: string, p?: any) => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sqft, setSqft] = useState('');
  const [custRate, setCustRate] = useState('');
  const [buildRate, setBuildRate] = useState('');
  const [saleAmt, setSaleAmt] = useState('');
  const [budget, setBudget] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/sites');
      setSites(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (showAdd) api.get('/customers').then(r => setClients(r.data?.data || [])).catch(() => {});
  }, [showAdd]);

  const sqftNum = parseFloat(sqft) || 0;
  const custRateNum = parseFloat(custRate) || 0;
  const buildRateNum = parseFloat(buildRate) || 0;
  const customerEstimate = sqftNum * custRateNum;
  const builderEstimate = sqftNum * buildRateNum;

  const addSite = async () => {
    if (!selectedClient) return Alert.alert('Error', 'Select a client first.');
    if (!name.trim()) return Alert.alert('Error', 'Site name required');
    setAdding(true);
    try {
      await api.post('/sites', {
        siteName: name.trim(),
        clientName: selectedClient.name,
        clientMobile: selectedClient.mobile || undefined,
        address: address.trim(),
        totalSqft: sqftNum || undefined,
        customerRatePerSqft: custRateNum || undefined,
        builderRatePerSqft: buildRateNum || undefined,
        customerEstimate: customerEstimate || undefined,
        builderEstimate: builderEstimate || undefined,
        saleAmount: parseFloat(saleAmt) || undefined,
        estimatedBudget: parseFloat(budget) || builderEstimate || 0,
        projectType: 'house',
        status: 'planning',
      });
      setShowAdd(false);
      setName(''); setSelectedClient(null); setAddress(''); setSqft(''); setCustRate(''); setBuildRate(''); setSaleAmt(''); setBudget('');
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

  const filtered = sites.filter(s => (s.siteName || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: txt, marginBottom: 16 }}>Sites</Text>
          <TextInput placeholder="Search sites..." value={search} onChangeText={setSearch} style={{ backgroundColor: inputBg, color: txt, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15 }} placeholderTextColor={C.sub} />

          {showAdd && (
            <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: txt, marginBottom: 12 }}>New Site</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 6 }}>Select Client *</Text>
              {clients.length === 0 ? (
                <Text style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>No clients found. Add from More tab.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {clients.map((cl: any) => (
                    <TouchableOpacity key={cl.id} onPress={() => setSelectedClient(cl)} style={{ backgroundColor: selectedClient?.id === cl.id ? C.primary : inputBg, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: selectedClient?.id === cl.id ? C.primary : border }}>
                      <Text style={{ color: selectedClient?.id === cl.id ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>{selectedClient?.id === cl.id ? '✓ ' : ''}{cl.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {selectedClient && <Text style={{ color: C.success, fontSize: 12, marginBottom: 8 }}>Client: {selectedClient.name}</Text>}
              <TextInput placeholder="Site Name *" value={name} onChangeText={setName} style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Total Sqft" value={sqft} onChangeText={setSqft} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput placeholder="Customer Rate/sqft" value={custRate} onChangeText={setCustRate} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
                <TextInput placeholder="Builder Rate/sqft" value={buildRate} onChangeText={setBuildRate} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
              </View>
              {(customerEstimate > 0 || builderEstimate > 0) && (
                <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 12, marginBottom: 10 }}>
                  {customerEstimate > 0 && <Text style={{ color: txt, fontSize: 13 }}>Customer Estimate: {fmt(customerEstimate)}</Text>}
                  {builderEstimate > 0 && <Text style={{ color: txt, fontSize: 13, marginTop: 2 }}>Builder Estimate: {fmt(builderEstimate)}</Text>}
                </View>
              )}
              <TextInput placeholder="Sale Amount (optional - after confirmation)" value={saleAmt} onChangeText={setSaleAmt} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
              <TextInput placeholder="Estimated Budget" value={budget} onChangeText={setBudget} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                  <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addSite} disabled={adding} style={{ flex: 1, backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{adding ? 'Adding...' : 'Add Site'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {filtered.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><Text style={{ color: C.sub, fontSize: 14 }}>No sites found</Text></View>
          ) : filtered.map((site: any) => (
            <TouchableOpacity key={site.id} onPress={() => nav('siteDetail', { siteId: site.id })} style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: border, borderLeftWidth: 3, borderLeftColor: site.status === 'active' ? C.success : C.sub }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: txt, fontSize: 16, fontWeight: '600', flex: 1 }} numberOfLines={1}>{site.siteName}</Text>
                <View style={{ backgroundColor: site.status === 'active' ? C.success + '15' : inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: site.status === 'active' ? C.success : C.sub }}>{site.status}</Text>
                </View>
              </View>
              <Text style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{site.siteCode} · {site.projectType}</Text>
              {site.clientName ? <Text style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>👤 {site.clientName}</Text> : null}
              {site.address ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>📍 {site.address}</Text> : null}
              {site.totalSqft ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>📐 {site.totalSqft} sqft</Text> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: border }}>
                <Text style={{ color: C.primary, fontSize: 14, fontWeight: '600' }}>Budget: {fmt(site.estimatedBudget || 0)}</Text>
                <Text style={{ color: C.sub, fontSize: 14 }}>Spent: {fmt(site.totalSpent || 0)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {!showAdd && (
        <TouchableOpacity onPress={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
