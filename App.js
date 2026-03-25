import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, FlatList, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  // App state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // New workout form
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: 'strength',
    duration: '',
    calories: ''
  });
  
  // New meal form
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  // Sample workout library
  const workoutLibrary = [
    { id: '1', name: '🏃‍♂️ Morning Run', type: 'cardio', duration: 30, calories: 300 },
    { id: '2', name: '💪 Push Day', type: 'strength', duration: 45, calories: 400 },
    { id: '3', name: '🦵 Leg Day', type: 'strength', duration: 50, calories: 450 },
    { id: '4', name: '🧘 Yoga Flow', type: 'mobility', duration: 30, calories: 150 },
    { id: '5', name: '🚴‍♀️ Cycling', type: 'cardio', duration: 40, calories: 350 },
    { id: '6', name: '🏋️ Pull Day', type: 'strength', duration: 45, calories: 420 },
  ];

  // Load data from storage
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem('workouts');
      if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
      
      const savedMeals = await AsyncStorage.getItem('meals');
      if (savedMeals) setMeals(JSON.parse(savedMeals));
      
      const savedWater = await AsyncStorage.getItem('waterIntake');
      if (savedWater) setWaterIntake(parseInt(savedWater));
      
      const savedStreak = await AsyncStorage.getItem('streak');
      if (savedStreak) setStreak(parseInt(savedStreak));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveWorkouts = async (newWorkouts) => {
    setWorkouts(newWorkouts);
    await AsyncStorage.setItem('workouts', JSON.stringify(newWorkouts));
  };

  const saveMeals = async (newMeals) => {
    setMeals(newMeals);
    await AsyncStorage.setItem('meals', JSON.stringify(newMeals));
  };

  const saveWater = async (amount) => {
    setWaterIntake(amount);
    await AsyncStorage.setItem('waterIntake', amount.toString());
  };

  const saveStreak = async (newStreak) => {
    setStreak(newStreak);
    await AsyncStorage.setItem('streak', newStreak.toString());
  };

  const addWorkout = async (workout) => {
    const newWorkouts = [...workouts, { ...workout, id: Date.now().toString(), date: new Date().toISOString() }];
    await saveWorkouts(newWorkouts);
    
    const today = new Date().toDateString();
    const lastWorkoutDate = await AsyncStorage.getItem('lastWorkoutDate');
    
    let newStreak = streak;
    if (lastWorkoutDate === today) {
      newStreak = streak;
    } else if (lastWorkoutDate === new Date(Date.now() - 86400000).toDateString()) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }
    
    await saveStreak(newStreak);
    await AsyncStorage.setItem('lastWorkoutDate', today);
    
    setShowAddWorkout(false);
    setNewWorkout({ name: '', type: 'strength', duration: '', calories: '' });
    Alert.alert('🎉 Workout Added!', You're on a  day streak!);
  };

  const addMeal = async (meal) => {
    const newMeals = [...meals, { ...meal, id: Date.now().toString(), date: new Date().toISOString() }];
    await saveMeals(newMeals);
    setShowAddMeal(false);
    setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    Alert.alert('🥗 Meal Logged!', 'Keep up the good nutrition!');
  };

  const addWater = async (amount) => {
    const newAmount = waterIntake + amount;
    await saveWater(newAmount);
    if (newAmount >= 2500) {
      Alert.alert('💧 Hydration Goal!', 'You reached your daily water goal!');
    }
  };

  const quickAddWorkout = (libraryWorkout) => {
    addWorkout({
      name: libraryWorkout.name,
      type: libraryWorkout.type,
      duration: libraryWorkout.duration,
      calories: libraryWorkout.calories
    });
  };

  const deleteWorkout = async (id) => {
    const newWorkouts = workouts.filter(w => w.id !== id);
    await saveWorkouts(newWorkouts);
  };

  const deleteMeal = async (id) => {
    const newMeals = meals.filter(m => m.id !== id);
    await saveMeals(newMeals);
  };

  const getTodayCalories = () => {
    const today = new Date().toDateString();
    const todayMeals = meals.filter(m => new Date(m.date).toDateString() === today);
    return todayMeals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0);
  };

  const getTodayWorkoutCalories = () => {
    const today = new Date().toDateString();
    const todayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === today);
    return todayWorkouts.reduce((sum, w) => sum + (parseInt(w.calories) || 0), 0);
  };

  const handleAuth = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!isLogin && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoggedIn(true);
    setUser({ email, name: name || email.split('@')[0] });
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUser(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  // Render Dashboard
  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak 🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.floor(waterIntake / 25)}%</Text>
          <Text style={styles.statLabel}>Water Goal</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Today's Summary</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>💧 Water: {waterIntake}ml / 2500ml</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: ${Math.min((waterIntake / 2500) * 100, 100)}% }]} />
          </View>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🔥 Calories Burned: {getTodayWorkoutCalories()} cal</Text>
          <Text style={styles.progressLabel}>🥗 Calories Eaten: {getTodayCalories()} cal</Text>
        </View>
        <Text style={styles.netCalories}>
          Net: {getTodayWorkoutCalories() - getTodayCalories()} calories
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddWorkout(true)}>
          <Text style={styles.actionBtnText}>➕ Add Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddMeal(true)}>
          <Text style={styles.actionBtnText}>🥗 Add Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => addWater(250)}>
          <Text style={styles.actionBtnText}>💧 +250ml Water</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.librarySection}>
        <Text style={styles.sectionTitle}>Quick Workouts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {workoutLibrary.map(workout => (
            <TouchableOpacity 
              key={workout.id} 
              style={styles.libraryCard}
              onPress={() => quickAddWorkout(workout)}
            >
              <Text style={styles.libraryName}>{workout.name}</Text>
              <Text style={styles.libraryDetail}>{workout.duration} min • {workout.calories} cal</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );

  // Render Workouts List
  const renderWorkouts = () => (
    <View style={styles.listContainer}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddWorkout(true)}>
        <Text style={styles.addButtonText}>+ Log Workout</Text>
      </TouchableOpacity>
      
      <FlatList
        data={[...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {item.type} • {item.duration} min • {item.calories} cal
              </Text>
              <Text style={styles.listItemDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteWorkout(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts yet. Add your first workout!</Text>
        }
      />
    </View>
  );

  // Render Meals List
  const renderMeals = () => (
    <View style={styles.listContainer}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMeal(true)}>
        <Text style={styles.addButtonText}>+ Log Meal</Text>
      </TouchableOpacity>
      
      <FlatList
        data={[...meals].sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {item.calories} cal • P:{item.protein}g • C:{item.carbs}g • F:{item.fat}g
              </Text>
              <Text style={styles.listItemDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteMeal(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No meals yet. Log your first meal!</Text>
        }
      />
    </View>
  );

  // Render Profile
  const renderProfile = () => (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileAvatar}>🏋️‍♂️</Text>
        <Text style={styles.profileName}>{user?.name || user?.email}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>
      
      <View style={styles.profileStats}>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>{workouts.length}</Text>
          <Text style={styles.profileStatLabel}>Total Workouts</Text>
        </View>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>{streak}</Text>
          <Text style={styles.profileStatLabel}>Current Streak</Text>
        </View>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatNumber}>{meals.length}</Text>
          <Text style={styles.profileStatLabel}>Meals Logged</Text>
        </View>
      </View>
      
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>🏆 Achievements</Text>
        {streak >= 7 && <Text style={styles.badge}>🔥 7 Day Streak Warrior</Text>}
        {workouts.length >= 10 && <Text style={styles.badge}>💪 10 Workouts Club</Text>}
        {waterIntake >= 2500 && <Text style={styles.badge}>💧 Hydration Master</Text>}
        {workouts.length === 0 && streak === 0 && <Text style={styles.noBadge}>Complete workouts to earn badges!</Text>}
      </View>
      
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Modals
  const renderAddWorkoutModal = () => (
    <Modal visible={showAddWorkout} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Log Workout</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Workout Name"
            placeholderTextColor="#666"
            value={newWorkout.name}
            onChangeText={text => setNewWorkout({...newWorkout, name: text})}
          />
          
          <View style={styles.modalRow}>
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Duration (min)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newWorkout.duration}
              onChangeText={text => setNewWorkout({...newWorkout, duration: text})}
            />
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Calories"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newWorkout.calories}
              onChangeText={text => setNewWorkout({...newWorkout, calories: text})}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddWorkout(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={() => addWorkout(newWorkout)}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddMealModal = () => (
    <Modal visible={showAddMeal} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Log Meal</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Meal Name"
            placeholderTextColor="#666"
            value={newMeal.name}
            onChangeText={text => setNewMeal({...newMeal, name: text})}
          />
          
          <View style={styles.modalRow}>
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Calories"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={text => setNewMeal({...newMeal, calories: text})}
            />
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Protein (g)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMeal.protein}
              onChangeText={text => setNewMeal({...newMeal, protein: text})}
            />
          </View>
          
          <View style={styles.modalRow}>
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Carbs (g)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMeal.carbs}
              onChangeText={text => setNewMeal({...newMeal, carbs: text})}
            />
            <TextInput
              style={[styles.modalInput, styles.halfInput]}
              placeholder="Fat (g)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newMeal.fat}
              onChangeText={text => setNewMeal({...newMeal, fat: text})}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddMeal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={() => addMeal(newMeal)}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Auth Screen
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>FitDiary</Text>
          <Text style={styles.subtitle}>Track fitness, meals & hydration</Text>
          
          {!isLogin && (
            <TextInput 
              style={styles.input} 
              placeholder="Full Name" 
              placeholderTextColor="#666"
              value={name} 
              onChangeText={setName} 
            />
          )}
          
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#666"
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor="#666"
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
          
          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switch}>
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main App with Tabs
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitDiary</Text>
        <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {['dashboard', 'workouts', 'meals', 'profile'].map(tab => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'dashboard' ? '📊' : tab === 'workouts' ? '💪' : tab === 'meals' ? '🥗' : '👤'}
            </Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <View style={styles.tabContent}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'workouts' && renderWorkouts()}
        {activeTab === 'meals' && renderMeals()}
        {activeTab === 'profile' && renderProfile()}
      </View>
      
      {/* Modals */}
      {renderAddWorkoutModal()}
      {renderAddMealModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a1f' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a78bfa', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 16, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#7c3aed', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  switch: { color: '#a78bfa', textAlign: 'center', marginTop: 20, fontSize: 14 },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#0f0a1f' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a78bfa', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { fontSize: 24, color: '#666' },
  tabTextActive: { color: '#a78bfa' },
  tabLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tabLabelActive: { color: '#a78bfa' },
  tabContent: { flex: 1, padding: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#a78bfa', marginTop: 4 },
  progressCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  progressRow: { marginBottom: 12 },
  progressLabel: { fontSize: 14, color: '#c4b5fd', marginBottom: 4 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 4 },
  netCalories: { fontSize: 14, color: '#fbbf24', marginTop: 8, textAlign: 'center' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: '#7c3aed', padding: 12, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  librarySection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  libraryCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginRight: 12, minWidth: 120 },
  libraryName: { color: '#fff', fontWeight: '600' },
  libraryDetail: { color: '#a78bfa', fontSize: 12, marginTop: 4 },
  listContainer: { flex: 1 },
  addButton: { backgroundColor: '#7c3aed', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  listItem: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center' },
  listItemContent: { flex: 1 },
  listItemTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listItemSubtitle: { color: '#a78bfa', fontSize: 12, marginTop: 4 },
  listItemDate: { color: '#666', fontSize: 10, marginTop: 4 },
  deleteBtn: { fontSize: 20, padding: 8 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  profileContainer: { flex: 1 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  profileAvatar: { fontSize: 60, marginBottom: 12 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileEmail: { fontSize: 14, color: '#a78bfa', marginTop: 4 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  profileStatItem: { alignItems: 'center' },
  profileStatNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  profileStatLabel: { fontSize: 12, color: '#a78bfa', marginTop: 4 },
  profileCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 24 },
  profileCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  badge: { backgroundColor: '#7c3aed', padding: 10, borderRadius: 8, marginBottom: 8, color: '#fff', textAlign: 'center' },
  noBadge: { color: '#666', textAlign: 'center' },
  signOutBtn: { backgroundColor: 'rgba(255,68,68,0.2)', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  signOutText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1a1a2e', margin: 20, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginBottom: 12, color: '#fff' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  modalButtons: { flexDirection: 'row', marginTop: 12 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#333', marginRight: 8, alignItems: 'center' },
  modalCancelText: { color: '#fff' },
  modalSave: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#7c3aed', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '600' },
});
