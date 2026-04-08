import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, typeEmoji, inpS } from '../helpers';

export function AddExpenseScreen({ preselectedSiteId, back, dark }: { preselectedSiteId?: string; back: () => void; dark: boolean }) {
  const txt = dark ? C.textDark : C.text;
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [step, setStep] = useState(preselectedSiteId ? 2 : 1);
  const [sites, setSites] = useState<any[]>([]);
  const [siteId, setSiteId] = useState(preselectedSiteId || '');
  const [expType, setExpType] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('nos');
  const [rate, setRate] = useState('');
  const [payStatus, setPayStatus] = useState('paid');
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/sites', { params: { limit: 100 } }).then(r => setSites(r.data?.data || [])).catch(() => {});
    api.get('/vendors').then(r => setVendors(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (expType) {
      api.get('/users/categories').then(r => {
        const all = r.data?.data || [];
        setCategories(all.filter((c: any) => c.type === expType || c.expenseType === expType));
      }).catch(() => setCategories([]));
    }
  }, [expType]);

  const types = ['material', 'labor', 'transport', 'rental', 'commission', 'miscellaneous'];
  const units = ['unit', 'nos', 'bag', 'kg', 'ton', 'cft', 'sqft', 'trip', 'day', 'hr', 'lot', 'lump', 'meter', 'litre', 'bundle', 'piece'];
  const total = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);

  const next = () => {
    if (step === 1 && !siteId) return Alert.alert('Select a site');
    if (step === 2 && !expType) return Alert.alert('Select type');
    if (step === 3 && !itemName.trim()) return Alert.alert('Enter item name');
    if (step === 4 && total <= 0) return Alert.alert('Enter valid qty and rate');
    if (step < 5) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1 && !(preselectedSiteId && step === 2)) {
      setStep(step - 1);
    } else {
      back();
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        siteId,
        expenseDate: new Date().toISOString(),
        expenseType: expType,
        itemName: itemName.trim(),
        quantity: parseFloat(qty) || 1,
        unit,
        rate: parseFloat(rate) || 0,
        totalAmount: total,
        paymentStatus: payStatus,
        paidAmount: payStatus === 'paid' ? total : payStatus === 'partially_paid' ? total / 2 : 0,
        vendorId: vendorId || undefined,
        billNumber: billNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      Alert.alert('Success', 'Expense added');
      back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const siteName = sites.find(s => (s.id || s._id) === siteId)?.siteName || '';
  const vendorName = vendors.find(v => (v.id || v._id) === vendorId)?.name || '';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={goBack} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← {step > 1 ? 'Previous' : 'Back'}</Text>
        </TouchableOpacity>

        {/* Step indicators */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <React.Fragment key={i}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i <= step ? C.primary : inputBg, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: i <= step ? '#fff' : C.sub, fontSize: 12, fontWeight: '700' }}>{i}</Text>
              </View>
              {i < 5 && <View style={{ width: 24, height: 2, backgroundColor: i < step ? C.primary : inputBg }} />}
            </React.Fragment>
          ))}
        </View>

        {/* Step 1: Site */}
        {step === 1 && (
          <View>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Select Site</Text>
            {sites.map(s => {
              const sel = siteId === (s.id || s._id);
              return (
                <TouchableOpacity key={s.id || s._id} onPress={() => setSiteId(s.id || s._id)} style={{ backgroundColor: sel ? C.primary + '12' : card, padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1.5, borderColor: sel ? C.primary : border, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? C.primary : C.sub, marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                    {sel && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary }} />}
                  </View>
                  <Text style={{ color: sel ? C.primary : txt, fontWeight: sel ? '600' : '400', fontSize: 15 }}>{s.siteName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Type */}
        {step === 2 && (
          <View>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Expense Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {types.map(t => {
                const sel = expType === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setExpType(t)} style={{ width: '31%', backgroundColor: sel ? C.primary + '12' : card, padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, borderColor: sel ? C.primary : border, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginBottom: 6 }}>{typeEmoji[t] || '📋'}</Text>
                    <Text style={{ color: sel ? C.primary : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Item — Searchable */}
        {step === 3 && (
          <View>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Select Item</Text>
            <TextInput
              placeholder="🔍 Search category..."
              value={itemSearch}
              onChangeText={setItemSearch}
              style={[inpS(dark), { marginBottom: 12 }]}
              placeholderTextColor={C.sub}
            />
            {categories.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories
                  .filter((cat: any) => {
                    if (!itemSearch) return true;
                    const name = (cat.name || cat.itemName || '').toLowerCase();
                    const nameTa = (cat.nameTa || '').toLowerCase();
                    return name.includes(itemSearch.toLowerCase()) || nameTa.includes(itemSearch.toLowerCase());
                  })
                  .map((cat: any, i: number) => {
                    const catName = cat.name || cat.itemName || '';
                    const selected = itemName === catName;
                    return (
                      <TouchableOpacity key={i} onPress={() => { setItemName(catName); setItemSearch(''); }}
                        style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: selected ? C.primary : inputBg, borderWidth: 1.5, borderColor: selected ? C.primary : border }}>
                        <Text style={{ color: selected ? '#fff' : txt, fontWeight: '600', fontSize: 14 }}>
                          {selected ? '✓ ' : ''}{catName}
                        </Text>
                        {cat.nameTa ? <Text style={{ color: selected ? '#fff' : C.sub, fontSize: 11, marginTop: 2 }}>{cat.nameTa}</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ) : (
              <Text style={{ color: C.sub, textAlign: 'center', marginTop: 20 }}>No categories found for this type</Text>
            )}
            {itemName ? (
              <View style={{ backgroundColor: C.primary + '15', padding: 12, borderRadius: 12, marginTop: 12 }}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>Selected: {itemName}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Step 4: Qty & Rate */}
        {step === 4 && (
          <View>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Quantity & Rate</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput placeholder="Qty" value={qty} onChangeText={setQty} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
              <TextInput placeholder="Rate" value={rate} onChangeText={setRate} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
            </View>
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {units.map(u => (
                <TouchableOpacity key={u} onPress={() => setUnit(u)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: unit === u ? C.primary : inputBg, borderWidth: 1, borderColor: unit === u ? C.primary : border }}>
                  <Text style={{ color: unit === u ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {total > 0 && (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: C.primary, fontSize: 28, fontWeight: '800' }}>{fmt(total)}</Text>
                <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }}>{amtWords(total)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 5: Payment & Save */}
        {step === 5 && (
          <View>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Payment & Save</Text>
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Payment Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['paid', 'partially_paid', 'unpaid'].map(ps => (
                <TouchableOpacity key={ps} onPress={() => setPayStatus(ps)} style={{ flex: 1, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: payStatus === ps ? C.primary : border, backgroundColor: payStatus === ps ? C.primary + '12' : card, alignItems: 'center' }}>
                  <Text style={{ color: payStatus === ps ? C.primary : txt, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{ps.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Vendor</Text>
            {vendors.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {vendors.map((v: any) => (
                  <TouchableOpacity key={v.id || v._id} onPress={() => setVendorId(vendorId === (v.id || v._id) ? '' : (v.id || v._id))} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: vendorId === (v.id || v._id) ? C.primary : inputBg, borderWidth: 1, borderColor: vendorId === (v.id || v._id) ? C.primary : border }}>
                    <Text style={{ color: vendorId === (v.id || v._id) ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TextInput placeholder="Bill Number (optional)" value={billNo} onChangeText={setBillNo} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Remarks (optional)" value={remarks} onChangeText={setRemarks} style={inpS(dark)} placeholderTextColor={C.sub} multiline />

            {/* Summary */}
            <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border, marginTop: 8 }}>
              <Text style={{ color: txt, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Summary</Text>
              {[
                { l: 'Site', v: siteName },
                { l: 'Type', v: expType },
                { l: 'Item', v: itemName },
                { l: 'Qty', v: `${qty} ${unit} x ${fmt(parseFloat(rate) || 0)}` },
                { l: 'Total', v: fmt(total) },
                { l: 'Payment', v: payStatus.replace('_', ' ') },
                { l: 'Vendor', v: vendorName || '-' },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 6 ? 1 : 0, borderBottomColor: border }}>
                  <Text style={{ color: C.sub, fontSize: 14 }}>{r.l}</Text>
                  <Text style={{ color: txt, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{r.v}</Text>
                </View>
              ))}
              <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>{amtWords(total)}</Text>
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={{ marginTop: 20 }}>
          {step < 5 ? (
            <TouchableOpacity onPress={next} style={{ backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={submit} disabled={submitting} style={{ backgroundColor: C.success, padding: 16, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{submitting ? 'Submitting...' : 'Submit Expense'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
