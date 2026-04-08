import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Image, BackHandler, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SitesScreen } from './screens/SitesScreen';
import { SiteDetailScreen } from './screens/SiteDetailScreen';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { VendorsScreen } from './screens/VendorsScreen';
import { VendorDetailScreen } from './screens/VendorDetailScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { ClientDetailScreen } from './screens/ClientDetailScreen';
import { LandsScreen } from './screens/LandsScreen';
import { LandDetailScreen } from './screens/LandDetailScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { C, API_HOST } from './helpers';

// ─── MainApp ──────────────────────────────────────────────────────
function MainApp({ dark, toggleDark, lang, toggleLang }: { dark: boolean; toggleDark: () => void; lang: string; toggleLang: () => void }) {
  const tenant = useAuthStore(s => s.tenant);
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState<string | null>(null);
  const [screenParams, setScreenParams] = useState<any>({});
  const [moreView, setMoreView] = useState<string | null>(null);

  const bg = dark ? C.bgDark : C.bg;
  const txt = dark ? C.textDark : C.text;

  const nav = (s: string, p?: any) => {
    setScreen(s);
    setScreenParams(p || {});
  };

  const goBack = () => {
    setScreen(null);
    setScreenParams({});
  };

  // Android back button — smart navigation
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      // If on detail screen → go back to list
      if (screen) { goBack(); return true; }
      // If on More sub-view → go back to More menu
      if (moreView) { setMoreView(null); return true; }
      // If not on home tab → go to home
      if (tab !== 'home') { setTab('home'); return true; }
      // On home tab → double tap to exit
      if (backPressedOnce) return false; // exit app
      setBackPressedOnce(true);
      Alert.alert('', 'Press back again to exit');
      setTimeout(() => setBackPressedOnce(false), 2000);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [screen, moreView, tab, backPressedOnce]);

  const renderScreen = () => {
    if (screen === 'siteDetail') return <SiteDetailScreen siteId={screenParams.siteId} back={goBack} nav={nav} dark={dark} />;
    if (screen === 'addExpense') return <AddExpenseScreen preselectedSiteId={screenParams.preselectedSiteId} back={goBack} dark={dark} />;
    if (screen === 'vendorDetail') return <VendorDetailScreen vendorId={screenParams.vendorId} back={goBack} dark={dark} />;
    if (screen === 'clientDetail') return <ClientDetailScreen clientId={screenParams.clientId} back={goBack} dark={dark} />;
    if (screen === 'landDetail') return <LandDetailScreen landId={screenParams.landId} back={goBack} dark={dark} />;
    if (screen === 'lands') return <LandsScreen nav={nav} dark={dark} />;
    return null;
  };

  const renderMoreView = () => {
    if (moreView === 'vendors') return <VendorsScreen nav={nav} dark={dark} />;
    if (moreView === 'clients') return <ClientsScreen nav={nav} dark={dark} />;
    if (moreView === 'lands') return <LandsScreen nav={nav} dark={dark} />;
    if (moreView === 'reports') return <ReportsScreen dark={dark} />;
    if (moreView === 'settings') return <SettingsScreen dark={dark} toggleDark={toggleDark} lang={lang} toggleLang={toggleLang} />;
    return null;
  };

  const renderTab = () => {
    if (tab === 'home') return <HomeScreen nav={nav} onSwitchTab={setTab} dark={dark} />;
    if (tab === 'sites') return <SitesScreen nav={nav} dark={dark} />;
    if (tab === 'history') return <ExpensesScreen dark={dark} />;
    if (tab === 'more') {
      if (moreView) return renderMoreView();
      // More menu
      const items = [
        { label: 'Vendors', icon: '🛠️', key: 'vendors' },
        { label: 'Clients', icon: '👥', key: 'clients' },
        { label: 'Lands', icon: '🏘️', key: 'lands' },
        { label: 'Reports', icon: '📊', key: 'reports' },
        { label: 'Settings', icon: '⚙️', key: 'settings' },
      ];
      return (
        <View style={{ flex: 1, backgroundColor: bg, padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: txt, marginBottom: 20 }}>More</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {items.map(it => (
              <TouchableOpacity key={it.key} onPress={() => setMoreView(it.key)} style={{ width: '48%', backgroundColor: dark ? C.cardDark : C.card, padding: 28, borderRadius: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: dark ? C.borderDark : C.border }}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>{it.icon}</Text>
                <Text style={{ color: txt, fontWeight: '600', fontSize: 15 }}>{it.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return <HomeScreen nav={nav} onSwitchTab={setTab} dark={dark} />;
  };

  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'sites', label: 'Sites', icon: '🏗️' },
    { key: 'add', label: '', icon: '+' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'more', label: 'More', icon: '⋯' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={{ backgroundColor: dark ? C.cardDark : '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 50 : 36, paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: dark ? C.borderDark : C.border }}>
        {tenant?.logo ? (
          <Image source={{ uri: tenant.logo.startsWith('/') ? `${API_HOST}${tenant.logo}` : tenant.logo }} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 10 }} />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{(tenant?.companyName || 'D')[0]}</Text>
          </View>
        )}
        <Text style={{ color: txt, fontSize: 18, fontWeight: '700', flex: 1 }}>{tenant?.companyName || 'Datalytics Construction'}</Text>
        {(screen || moreView) && (
          <TouchableOpacity onPress={() => { if (screen) goBack(); else setMoreView(null); }} style={{ paddingVertical: 4, paddingHorizontal: 12 }}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {screen ? renderScreen() : renderTab()}
      </View>

      {/* Bottom Tabs */}
      {!screen && (
        <View style={{ flexDirection: 'row', backgroundColor: dark ? C.cardDark : '#FFFFFF', borderTopWidth: 1, borderTopColor: dark ? C.borderDark : C.border, paddingBottom: Platform.OS === 'ios' ? 20 : 8, height: 60 + (Platform.OS === 'ios' ? 20 : 8) }}>
          {tabs.map(t => {
            if (t.key === 'add') return (
              <TouchableOpacity key={t.key} onPress={() => nav('addExpense')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginTop: -20, elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '400', marginTop: -1 }}>+</Text>
                </View>
              </TouchableOpacity>
            );
            const isActive = tab === t.key;
            return (
              <TouchableOpacity key={t.key} onPress={() => { setTab(t.key); setMoreView(null); }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
                <Text style={{ fontSize: 18 }}>{t.icon}</Text>
                <Text style={{ color: isActive ? C.primary : C.sub, fontWeight: isActive ? '600' : '400', fontSize: 10, marginTop: 2 }}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const isAuth = useAuthStore(s => s.isAuthenticated);
  const [ready, setReady] = useState(false);
  const loadToken = useAuthStore(s => s.loadToken);

  useEffect(() => { loadToken().finally(() => setReady(true)); }, []);

  if (!ready) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  if (!isAuth) return <LoginScreen />;

  return (
    <MainApp
      dark={dark}
      toggleDark={() => setDark(d => !d)}
      lang={lang}
      toggleLang={() => setLang(l => l === 'en' ? 'ta' : 'en')}
    />
  );
}
