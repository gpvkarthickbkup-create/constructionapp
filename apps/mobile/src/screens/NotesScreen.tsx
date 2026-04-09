import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { C, inpS } from '../helpers';

const CATEGORIES = [
  { key: 'general', label: '📝 General', color: '#6B7280' },
  { key: 'expense', label: '💰 Expense', color: '#f26f31' },
  { key: 'material', label: '📦 Material', color: '#3B82F6' },
  { key: 'labor', label: '👷 Labor', color: '#F59E0B' },
  { key: 'payment', label: '💳 Payment', color: '#10B981' },
  { key: 'reminder', label: '⏰ Reminder', color: '#EF4444' },
];

export function NotesScreen({ nav, dark }: { nav: (s: string, p?: any) => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/notes');
      setNotes(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveNote = async () => {
    if (!content.trim()) return Alert.alert('Error', 'Write something first');
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/notes/${editId}`, { title: title.trim(), content: content.trim(), category });
      } else {
        await api.post('/notes', { title: title.trim(), content: content.trim(), category });
      }
      setShowAdd(false);
      setContent('');
      setTitle('');
      setCategory('general');
      setEditId(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/notes/${id}`); load(); } catch { Alert.alert('Error', 'Failed'); }
      }},
    ]);
  };

  const pinNote = async (id: string, pinned: boolean) => {
    try { await api.put(`/notes/${id}`, { isPinned: !pinned }); load(); } catch {}
  };

  const editNote = (note: any) => {
    setEditId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategory(note.category || 'general');
    setShowAdd(true);
  };

  const convertToExpense = (note: any) => {
    Alert.alert('Convert to Expense', 'This will open Add Expense with this note\'s details. Continue?', [
      { text: 'Cancel' },
      { text: 'Convert', onPress: async () => {
        try { await api.post(`/notes/${note.id}/convert`, {}); } catch {}
        nav('addExpense', { preselectedNote: note.content });
      }},
    ]);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: C.danger, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const catColor = (cat: string) => CATEGORIES.find(c => c.key === cat)?.color || '#6B7280';
  const catLabel = (cat: string) => CATEGORIES.find(c => c.key === cat)?.label || '📝 General';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '800', color: txt }}>📒 Quick Notes</Text>
          <TouchableOpacity onPress={() => { setShowAdd(!showAdd); setEditId(null); setContent(''); setTitle(''); }} style={{ backgroundColor: showAdd ? inputBg : C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 }}>
            <Text style={{ color: showAdd ? txt : '#fff', fontWeight: '600' }}>{showAdd ? '✕ Cancel' : '✏️ New Note'}</Text>
          </TouchableOpacity>
        </View>

        {/* Add/Edit Note */}
        {showAdd && (
          <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
            <TextInput
              placeholder="Title (optional)"
              value={title}
              onChangeText={setTitle}
              style={[inpS(dark), { marginBottom: 8 }]}
              placeholderTextColor={C.sub}
            />
            <TextInput
              placeholder="Write your note here... ✍️"
              value={content}
              onChangeText={setContent}
              style={[inpS(dark), { height: 120, textAlignVertical: 'top' }]}
              placeholderTextColor={C.sub}
              multiline
            />
            {/* Category */}
            <Text style={{ color: C.sub, fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 6 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, backgroundColor: category === c.key ? c.color : inputBg, borderWidth: 1, borderColor: category === c.key ? c.color : border }}>
                  <Text style={{ color: category === c.key ? '#fff' : txt, fontSize: 12, fontWeight: '600' }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={saveNote} disabled={saving} style={{ backgroundColor: C.primary, padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{saving ? 'Saving...' : editId ? '💾 Update Note' : '💾 Save Note'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📒</Text>
            <Text style={{ color: C.sub, fontSize: 15 }}>No notes yet</Text>
            <Text style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Jot down quick notes from the field!</Text>
          </View>
        ) : notes.map((note: any) => (
          <View key={note.id} style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: border, borderLeftWidth: 4, borderLeftColor: catColor(note.category) }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {note.isPinned && <Text style={{ fontSize: 14, marginRight: 4 }}>📌</Text>}
              <Text style={{ color: catColor(note.category), fontSize: 11, fontWeight: '600', flex: 1 }}>{catLabel(note.category)}</Text>
              <Text style={{ color: C.sub, fontSize: 11 }}>{new Date(note.createdAt).toLocaleDateString('en-GB')}</Text>
              {note.isConverted && <Text style={{ color: C.success, fontSize: 10, fontWeight: '700', marginLeft: 6 }}>✅ Converted</Text>}
            </View>

            {/* Title */}
            {note.title && <Text style={{ color: txt, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{note.title}</Text>}

            {/* Content */}
            <Text style={{ color: txt, fontSize: 14, lineHeight: 20 }}>{note.content}</Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <TouchableOpacity onPress={() => pinNote(note.id, note.isPinned)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: inputBg }}>
                <Text style={{ color: txt, fontSize: 11, fontWeight: '600' }}>{note.isPinned ? '📌 Unpin' : '📌 Pin'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => editNote(note)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: inputBg }}>
                <Text style={{ color: txt, fontSize: 11, fontWeight: '600' }}>✏️ Edit</Text>
              </TouchableOpacity>
              {!note.isConverted && (
                <TouchableOpacity onPress={() => convertToExpense(note)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.primary + '18' }}>
                  <Text style={{ color: C.primary, fontSize: 11, fontWeight: '600' }}>💰 → Expense</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteNote(note.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.danger + '18' }}>
                <Text style={{ color: C.danger, fontSize: 11, fontWeight: '600' }}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
