import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useHydrationStore = create((set, get) => ({
  todayIntake: 0,
  dailyGoal: 2500,
  
  addWater: async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('hydration_logs').insert({
      user_id: user.id,
      amount_ml: amount,
      logged_at: new Date().toISOString(),
    });
    
    set({ todayIntake: get().todayIntake + amount });
  },
  
  fetchTodayIntake: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('hydration_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .gte('logged_at', today.toISOString());
      
    const total = data?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
    set({ todayIntake: total });
  },
}));