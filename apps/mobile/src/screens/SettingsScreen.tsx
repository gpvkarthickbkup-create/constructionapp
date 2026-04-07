import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { C } from '../helpers';

export function SettingsScreen({ dark, toggleDark, lang, toggleLang }: { dark: boolean; toggleDark: () => void; lang: string; toggleLang: () => void }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const user = useAuthStore(s => s.user);
  const tenant = useAuthStore(s => s.tenant);
  const logout = useAuthStore(s => s.logout);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 20 }}>Settings</Text>

        {/* Profile */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={{ color: txt, fontSize: 18, fontWeight: '700' }}>{user?.name || 'User'}</Text>
          <Text style={{ color: C.sub, marginTop: 4, fontSize: 14 }}>{user?.email || ''}</Text>
          <View style={{ backgroundColor: C.primary + '18', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
            <Text style={{ color: C.primary, fontWeight: '600', fontSize: 12 }}>{user?.role || 'user'}</Text>
          </View>
        </View>

        {/* Company */}
        {tenant?.companyName && (
          <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
            <Text style={{ color: C.sub, fontSize: 12 }}>Company</Text>
            <Text style={{ color: txt, fontWeight: '700', fontSize: 16, marginTop: 4 }}>{tenant.companyName}</Text>
          </View>
        )}

        {/* Settings */}
        <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
          {/* Dark Mode */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: txt, fontSize: 15 }}>Dark Mode</Text>
            <TouchableOpacity onPress={toggleDark} style={{ backgroundColor: dark ? C.primary : inputBg, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 }}>
              <Text style={{ color: dark ? '#fff' : txt, fontWeight: '600' }}>{dark ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          {/* Language */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: txt, fontSize: 15 }}>Language</Text>
            <View style={{ flexDirection: 'row', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: border }}>
              <TouchableOpacity onPress={lang === 'ta' ? toggleLang : undefined} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: lang === 'en' ? C.primary : 'transparent' }}>
                <Text style={{ color: lang === 'en' ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lang === 'en' ? toggleLang : undefined} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: lang === 'ta' ? C.primary : 'transparent' }}>
                <Text style={{ color: lang === 'ta' ? '#fff' : txt, fontWeight: '600', fontSize: 13 }}>TA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout }])} style={{ borderWidth: 1.5, borderColor: C.danger, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: C.danger, fontWeight: '700', fontSize: 15 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
