import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [partnerProfile, setPartnerProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setHabits([]);
        setPartnerProfile(null);
      }
    });
  }, []);

  async function handleSignUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Ошибка', error.message);
    else if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, username: email.split('@')[0], xp: 0, coins: 0, streak: 0 }]);
      Alert.alert('Успех', 'Аккаунт создан!');
    }
    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Ошибка', error.message);
    setLoading(false);
  }

  async function fetchUserData(userId) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(prof);

    const { data: habs } = await supabase.from('habits').select('*').eq('user_id', userId);
    setHabits(habs || []);

    if (prof && prof.pair_id) {
      const { data: part } = await supabase.from('profiles').select('*').eq('pair_id', prof.pair_id).neq('id', userId).single();
      setPartnerProfile(part);
    }
  }

  async function addHabit() {
    if (!newHabitTitle.trim()) return;
    const { error } = await supabase.from('habits').insert([{ user_id: session.user.id, title: newHabitTitle, completed: false }]);
    if (error) Alert.alert('Ошибка', error.message);
    else {
      setNewHabitTitle('');
      fetchUserData(session.user.id);
    }
  }

  async function completeHabit(id, currentStatus) {
    const { error } = await supabase.from('habits').update({ completed: !currentStatus }).eq('id', id);
    if (!error) {
      const newXp = (profile.xp || 0) + (currentStatus ? -10 : 10);
      const newCoins = (profile.coins || 0) + (currentStatus ? -5 : 5);
      await supabase.from('profiles').update({ xp: newXp, coins: newCoins }).eq('id', session.user.id);
      fetchUserData(session.user.id);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authBox}>
          <Text style={styles.title}>⚔️ Life RPG</Text>
          <Text style={styles.subtitle}>Прокачай свою жизнь</Text>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Пароль" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.btnText}>Войти</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSec]} onPress={handleSignUp} disabled={loading}>
            <Text style={styles.btnText}>Регистрация</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Привет, {profile?.username || 'Герой'}!</Text>
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={styles.logout}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statText}>⭐ XP: {profile?.xp || 0}</Text>
          <Text style={styles.statText}>🪙 Монеты: {profile?.coins || 0}</Text>
          <Text style={styles.statText}>🔥 Стрик: {profile?.streak || 0} дн.</Text>
        </View>

        {partnerProfile && (
          <View style={styles.partnerCard}>
            <Text style={styles.partnerTitle}>👥 Напарник: {partnerProfile.username}</Text>
            <Text style={styles.statText}>XP напарника: {partnerProfile.xp || 0} | Стрик: {partnerProfile.streak || 0}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>🎯 Твои привычки и задачи:</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Новая привычка..." placeholderTextColor="#666" value={newHabitTitle} onChangeText={setNewHabitTitle} />
          <TouchableOpacity style={styles.addBtn} onPress={addHabit}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>

        {habits.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.habitItem, item.completed && styles.habitDone]} onPress={() => completeHabit(item.id, item.completed)}>
            <Text style={[styles.habitText, item.completed && styles.habitTextDone]}>{item.completed ? '✅ ' : '🔲 '}{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 20 },
  authBox: { flex: 1, justifyContent: 'center', marginTop: 100 },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  btn: { backgroundColor: '#6200ee', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnSec: { backgroundColor: '#333' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcome: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  logout: { color: '#ff5252', fontSize: 16 },
  statsCard: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  statText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  partnerCard: { backgroundColor: '#1a237e', padding: 15, borderRadius: 10, marginBottom: 20 },
  partnerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  sectionTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  inputRow: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  addBtn: { backgroundColor: '#03dac6', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 10 },
  habitItem: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  habitDone: { backgroundColor: '#1b5e20', borderColor: '#2e7d32' },
  habitText: { color: '#fff', fontSize: 16 },
  habitTextDone: { textDecorationLine: 'line-through', color: '#a5d6a7' }
});
