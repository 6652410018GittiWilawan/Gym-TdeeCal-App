"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { Dumbbell, XCircle, PlusCircle, Search, Calendar } from 'lucide-react';

// กำหนด type สำหรับข้อมูลโปรไฟล์
interface UserProfile {
  full_name: string;
  gender: string;
  profile_pic_url: string;
  age: number;
  tdee: number;
  user_weight: number;
  user_height: number;
  carb_g: number;
  protein_g: number;
  fat_g: number;
}

//กำหนด type สำหรับข้อมูลอาหาร
interface FoodData {
  id: number;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// [ใหม่] เพิ่ม interface สำหรับ Program
interface ProgramItem {
  id: number;
  exercise_name: string;
  weight_kg: number;
  sets: number;
  reps: string;
  day_of_week?: number;
}

// [ใหม่] Interface สำหรับ Workout Progress
interface WorkoutProgress {
  id: number;
  user_id: string;
  exercise_name: string;
  weight_kg: number;
  sets: number;
  reps: string;
  body_weight: number;
  workout_date: string;
  week_start_date: string; // วันที่เริ่มต้นของสัปดาห์ (วันจันทร์)
  day_of_week: number;
}

// [ใหม่] Interface สำหรับ Weekly Progress Summary
interface WeeklyProgress {
  week_start_date: string;
  workouts: WorkoutProgress[];
  body_weight_avg?: number;
}

// Helper function: คำนวณวันเริ่มต้นของสัปดาห์ (วันจันทร์)
const getWeekStartDate = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

// Helper function: คำนวณ Day of Week (1=จันทร์, 7=อาทิตย์)
const getDayOfWeek = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [foodLogs, setFoodLogs] = useState<FoodData[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);

  // [ใหม่] State สำหรับ Program
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  
  // [ใหม่] State สำหรับ Day Selector
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  });

  // [ใหม่] State สำหรับ Workout Progress
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // [ใหม่] State สำหรับบันทึก Progress
  const [editingExercise, setEditingExercise] = useState<ProgramItem | null>(null);
  const [progressWeight, setProgressWeight] = useState('');
  const [progressReps, setProgressReps] = useState('');
  const [progressSets, setProgressSets] = useState('');
  const [progressBodyWeight, setProgressBodyWeight] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodHistory, setFoodHistory] = useState<FoodData[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // [Memo 1] สำหรับกรองอาหารใน *หน้าหลัก*
  const filteredFoodLogs = useMemo(() => {
    if (!searchQuery) {
      return foodLogs;
    }
    return foodLogs.filter((food) =>
      (food.food_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foodLogs, searchQuery]);

  // [Memo 2] สำหรับกรองอาหารใน *Modal*
  const filteredFoodHistory = useMemo(() => {
    if (!modalSearch) {
      return foodHistory;
    }
    return foodHistory.filter((food) =>
      (food.food_name || '').toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [foodHistory, modalSearch]);

  // [Function] เปิด Modal และดึงประวัติอาหาร
  const openFoodModal = async () => {
    setIsModalOpen(true);
    setModalLoading(true);
    setModalSearch(''); 

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้");

      const { data, error } = await supabase
        .from('food_log')
        .select('id, food_name, calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .order('eaten_on', { ascending: false });

      if (error) throw error;

      if (data) {
        const uniqueFoods = Array.from(
          new Map(data.map((item) => [item.food_name, item])).values()
        );
        setFoodHistory(uniqueFoods);
      }
    } catch (err: any) {
      console.error("Error fetching food history:", err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // [Function] สำหรับเพิ่มอาหารจากประวัติลงใน Log ของวันนี้
  const handleAddFoodFromHistory = async (food: FoodData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้");

      const newLogEntry = {
        user_id: user.id,
        eaten_on: new Date().toISOString().split('T')[0],
        food_name: food.food_name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      };

      const { data: newFoodLog, error } = await supabase
        .from('food_log')
        .insert(newLogEntry)
        .select()
        .single();
      
      if (error) throw error;

      if (newFoodLog) {
        setFoodLogs((currentLogs) => [newFoodLog, ...currentLogs]); 
        setTotalCalories((currentTotal) => currentTotal + (newFoodLog.calories || 0));
        setTotalProtein((currentTotal) => currentTotal + (newFoodLog.protein || 0));
        setTotalCarbs((currentTotal) => currentTotal + (newFoodLog.carbs || 0));
        setTotalFat((currentTotal) => currentTotal + (newFoodLog.fat || 0));
      }

      setIsModalOpen(false);

    } catch (err: any) {
      console.error("Error adding food log:", err.message);
      alert("ไม่สามารถเพิ่มอาหารได้: " + err.message);
    }
  };

  // [Function] สำหรับลบรายการอาหารออกจาก State
  const handleRemoveFoodItem = (id: number) => {
    const itemToRemove = foodLogs.find((item) => item.id === id);
    if (!itemToRemove) return;
    
    setTotalCalories((currentTotal) => currentTotal - (itemToRemove.calories || 0));
    setTotalProtein((currentTotal) => currentTotal - (itemToRemove.protein || 0));
    setTotalCarbs((currentTotal) => currentTotal - (itemToRemove.carbs || 0));
    setTotalFat((currentTotal) => currentTotal - (itemToRemove.fat || 0));

    setFoodLogs((currentLogs) =>
      currentLogs.filter((item) => item.id !== id)
    );
  };

  // [ใหม่] ฟังก์ชันเปิด Modal สำหรับบันทึก Progress
  const handleOpenProgressModal = (exercise: ProgramItem) => {
    setEditingExercise(exercise);
    setProgressWeight(exercise.weight_kg.toString());
    setProgressSets(exercise.sets.toString());
    setProgressReps(exercise.reps);
    setProgressBodyWeight(userProfile?.user_weight?.toString() || '');
    setIsProgressModalOpen(true);
  };

  // [ใหม่] ฟังก์ชันบันทึก Progress
  const handleSaveProgress = async () => {
    if (!editingExercise) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้");

      const workoutDate = new Date();
      const weekStart = getWeekStartDate(workoutDate);
      const dayOfWeek = getDayOfWeek(workoutDate);

      const progressData = {
        user_id: user.id,
        exercise_name: editingExercise.exercise_name,
        weight_kg: parseFloat(progressWeight) || 0,
        sets: parseInt(progressSets) || 0,
        reps: progressReps || '',
        body_weight: parseFloat(progressBodyWeight) || 0,
        workout_date: workoutDate.toISOString().split('T')[0],
        week_start_date: weekStart,
        day_of_week: dayOfWeek
      };

      const { error: progressError } = await supabase
        .from('workout_progress')
        .insert(progressData);

      if (progressError) {
        console.error("Supabase error details:", progressError);
        throw new Error(progressError.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบว่าได้สร้างตาราง workout_progress ใน Database แล้ว");
      }

      // [ใหม่] อัปเดตข้อมูลใน program_items (weight_kg, sets, reps)
      const { error: programUpdateError } = await supabase
        .from('program_items')
        .update({
          weight_kg: parseFloat(progressWeight) || 0,
          sets: parseInt(progressSets) || 0,
          reps: progressReps || ''
        })
        .eq('id', editingExercise.id);

      if (programUpdateError) {
        console.error("Error updating program item:", programUpdateError);
        // ไม่ throw error เพราะ progress บันทึกสำเร็จแล้ว
      }

      // [ใหม่] อัปเดตน้ำหนักตัวใน Profile ถ้ามีการกรอกน้ำหนักตัว
      if (progressBodyWeight && parseFloat(progressBodyWeight) > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ user_weight: parseFloat(progressBodyWeight) })
          .eq('id', user.id);

        if (profileError) {
          console.error("Error updating profile weight:", profileError);
          // ไม่ throw error เพราะ progress บันทึกสำเร็จแล้ว
        } else {
          // อัปเดต state ของ userProfile
          if (userProfile) {
            setUserProfile({
              ...userProfile,
              user_weight: parseFloat(progressBodyWeight)
            });
          }
        }
      }

      alert("บันทึกความคืบหน้าเรียบร้อย!");
      setIsProgressModalOpen(false);
      setEditingExercise(null);
      
      // Refresh data
      const [progressDataNew, profileDataNew, programDataNew] = await Promise.all([
        supabase
          .from('workout_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('workout_date', { ascending: false }),
        supabase
          .from('profiles')
          .select('full_name, gender, profile_pic_url, age, tdee, user_weight, user_height, carb_g, protein_g, fat_g')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('program_items')
          .select('id, exercise_name, weight_kg, sets, reps, day_of_week')
          .eq('user_id', user.id)
          .eq('day_of_week', selectedDay)
          .order('id', { ascending: true })
      ]);

      if (progressDataNew.data) {
        setWorkoutProgress(progressDataNew.data);
        
        // จัดกลุ่มตามสัปดาห์
        const groupedByWeek = progressDataNew.data.reduce((acc, workout) => {
          const weekStart = workout.week_start_date;
          if (!acc[weekStart]) {
            acc[weekStart] = [];
          }
          acc[weekStart].push(workout);
          return acc;
        }, {} as Record<string, WorkoutProgress[]>);
        
          const weeklyData: WeeklyProgress[] = Object.entries(groupedByWeek).map((entry) => {
            const [weekStart, workouts] = entry as [string, WorkoutProgress[]];
            const bodyWeights = workouts.map((w: WorkoutProgress) => w.body_weight).filter((w: number) => w > 0);
            const avgBodyWeight = bodyWeights.length > 0 
              ? bodyWeights.reduce((sum: number, w: number) => sum + w, 0) / bodyWeights.length 
              : undefined;
            
            return {
              week_start_date: weekStart,
              workouts: workouts.sort((a: WorkoutProgress, b: WorkoutProgress) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()),
              body_weight_avg: avgBodyWeight
            };
          }).sort((a: WeeklyProgress, b: WeeklyProgress) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
        
        setWeeklyProgress(weeklyData);
      }

      // อัปเดต profile ถ้ามีข้อมูลใหม่
      if (profileDataNew.data) {
        setUserProfile(profileDataNew.data);
      }

      // อัปเดต program items ถ้ามีข้อมูลใหม่
      if (programDataNew.data) {
        setProgramItems(programDataNew.data);
      }
    } catch (err: unknown) {
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Error saving progress:", err);
      console.error("Error message:", errorMessage);
      
      // แสดง error message ที่ชัดเจนขึ้น
      if (errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
        alert("❌ ไม่พบตาราง workout_progress ใน Database\n\nกรุณา:\n1. เปิด Supabase Dashboard\n2. ไปที่ SQL Editor\n3. รัน SQL script เพื่อสร้างตาราง workout_progress");
      } else if (errorMessage.includes("permission") || errorMessage.includes("policy")) {
        alert("❌ ไม่มีสิทธิ์ในการบันทึกข้อมูล\n\nกรุณาตรวจสอบ RLS Policies ใน Supabase");
      } else {
        alert("❌ ไม่สามารถบันทึกความคืบหน้าได้\n\n" + errorMessage);
      }
    }
  };

  // [ใหม่] ฟังก์ชันเปิด Modal สำหรับดูประวัติ
  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(authError?.message || "ไม่พบผู้ใช้งาน กรุณาล็อกอิน");
        }


        // [อัปเดต] เพิ่ม programResponse และ progressResponse
        const [profileResponse, foodResponse, programResponse, progressResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, gender, profile_pic_url, age, tdee, user_weight, user_height, carb_g, protein_g, fat_g')
            .eq('id', user.id)
            .maybeSingle(),
            
          supabase
            .from('food_log')
            .select('id, food_name, calories, protein, carbs, fat')
            .eq('user_id', user.id)
            .eq('eaten_on', new Date().toISOString().split('T')[0])
            .order('id', { ascending: false }),
          
          // [ใหม่] ดึงข้อมูล Program ของวันที่เลือก
          supabase
            .from('program_items')
            .select('id, exercise_name, weight_kg, sets, reps, day_of_week')
            .eq('user_id', user.id)
            .eq('day_of_week', selectedDay)
            .order('id', { ascending: true }),
          
          // [ใหม่] ดึงข้อมูล Progress ทั้งหมด
          supabase
            .from('workout_progress')
            .select('*')
            .eq('user_id', user.id)
            .order('workout_date', { ascending: false })
        ]);

        if (profileResponse.error) throw new Error(`Profile Error: ${profileResponse.error.message}`);
        if (profileResponse.data) setUserProfile(profileResponse.data);
        
        if (foodResponse.error) throw new Error(`Food Log Error: ${foodResponse.error.message}`);
        
        if (foodResponse.data) {
          const calculatedTotal = foodResponse.data.reduce(
            (sum, item) => sum + (item.calories || 0),
            0
          );
          const calculatedProtein = foodResponse.data.reduce(
            (sum, item) => sum + (item.protein || 0), 0
          );
          const calculatedCarbs = foodResponse.data.reduce(
            (sum, item) => sum + (item.carbs || 0), 0
          );
          const calculatedFat = foodResponse.data.reduce(
            (sum, item) => sum + (item.fat || 0), 0
          );

          setFoodLogs(foodResponse.data);
          setTotalCalories(calculatedTotal);
          setTotalProtein(calculatedProtein);
          setTotalCarbs(calculatedCarbs);
          setTotalFat(calculatedFat);
        }

        // [ใหม่] ประมวลผล Program
        if (programResponse.error) {
          throw new Error(`Program Error: ${programResponse.error.message}`);
        }
        if (programResponse.data) {
          setProgramItems(programResponse.data);
        }

        // [ใหม่] ประมวลผล Progress
        if (progressResponse.error) {
          console.error("Progress Error:", progressResponse.error.message);
        } else if (progressResponse.data) {
          setWorkoutProgress(progressResponse.data);
          
          // จัดกลุ่มตามสัปดาห์
          const groupedByWeek = progressResponse.data.reduce((acc, workout) => {
            const weekStart = workout.week_start_date;
            if (!acc[weekStart]) {
              acc[weekStart] = [];
            }
            acc[weekStart].push(workout);
            return acc;
          }, {} as Record<string, WorkoutProgress[]>);
          
          const weeklyData: WeeklyProgress[] = Object.entries(groupedByWeek).map((entry) => {
            const [weekStart, workouts] = entry as [string, WorkoutProgress[]];
            const bodyWeights = workouts.map((w: WorkoutProgress) => w.body_weight).filter((w: number) => w > 0);
            const avgBodyWeight = bodyWeights.length > 0 
              ? bodyWeights.reduce((sum: number, w: number) => sum + w, 0) / bodyWeights.length 
              : undefined;
            
            return {
              week_start_date: weekStart,
              workouts: workouts.sort((a: WorkoutProgress, b: WorkoutProgress) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()),
              body_weight_avg: avgBodyWeight
            };
          }).sort((a: WeeklyProgress, b: WeeklyProgress) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
          
          setWeeklyProgress(weeklyData);
        }

      } catch (err: unknown) {
        let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.error("Error fetching data:", errorMessage);
        setError("ไม่สามารถโหลดข้อมูล Dashboard ได้: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData()
  }, [selectedDay]);

  // [ใหม่] คำนวณ Progress Metrics สำหรับกราฟ (ต้องอยู่ก่อน early returns)
  const progressData = useMemo(() => {
    if (!workoutProgress.length || !userProfile) {
      return [
        { subject: 'Weight Loss', value: 0 },
        { subject: 'Gain Strength', value: 0 },
        { subject: 'Endurance', value: 0 },
      ];
    }

    // คำนวณ Weight Loss: เปรียบเทียบน้ำหนักตัวแรกกับล่าสุด
    const sortedByDate = [...workoutProgress].sort((a, b) => 
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    );
    const firstWeight = sortedByDate.find(w => w.body_weight > 0)?.body_weight || userProfile.user_weight;
    const lastWeight = [...workoutProgress]
      .filter(w => w.body_weight > 0)
      .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())[0]?.body_weight || userProfile.user_weight;
    
    const weightChange = firstWeight - lastWeight;
    const weightLossScore = Math.min(100, Math.max(0, (weightChange / firstWeight) * 100 * 10)); // คะแนน 0-100

    // คำนวณ Gain Strength: เปรียบเทียบน้ำหนักที่ยกเฉลี่ย
    const strengthExercises = ['Bench Press', 'Squat', 'Deadlift', 'Press', 'Row'];
    const strengthWorkouts = workoutProgress.filter(w => 
      strengthExercises.some(ex => w.exercise_name.toLowerCase().includes(ex.toLowerCase()))
    );
    
    if (strengthWorkouts.length === 0) {
      return [
        { subject: 'Weight Loss', value: Math.round(weightLossScore) },
        { subject: 'Gain Strength', value: 0 },
        { subject: 'Endurance', value: 0 },
      ];
    }

    const sortedStrength = [...strengthWorkouts].sort((a, b) => 
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    );
    const firstWeek = sortedStrength.slice(0, Math.min(5, sortedStrength.length));
    const lastWeek = sortedStrength.slice(-Math.min(5, sortedStrength.length));
    
    const firstAvgWeight = firstWeek.reduce((sum, w) => sum + w.weight_kg, 0) / firstWeek.length;
    const lastAvgWeight = lastWeek.reduce((sum, w) => sum + w.weight_kg, 0) / lastWeek.length;
    
    const strengthGain = firstAvgWeight > 0 ? ((lastAvgWeight - firstAvgWeight) / firstAvgWeight) * 100 : 0;
    const strengthScore = Math.min(100, Math.max(0, strengthGain * 2)); // คะแนน 0-100

    // คำนวณ Endurance: ดูจากจำนวน reps และ sets ที่เพิ่มขึ้น
    const enduranceWorkouts = workoutProgress.filter(w => {
      const reps = parseInt(w.reps.split('-')[0]) || 0;
      return reps >= 10; // Endurance exercises usually have 10+ reps
    });

    if (enduranceWorkouts.length === 0) {
      return [
        { subject: 'Weight Loss', value: Math.round(weightLossScore) },
        { subject: 'Gain Strength', value: Math.round(strengthScore) },
        { subject: 'Endurance', value: 0 },
      ];
    }

    const sortedEndurance = [...enduranceWorkouts].sort((a, b) => 
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    );
    const firstEndurance = sortedEndurance.slice(0, Math.min(5, sortedEndurance.length));
    const lastEndurance = sortedEndurance.slice(-Math.min(5, sortedEndurance.length));
    
    const firstAvgVolume = firstEndurance.reduce((sum, w) => {
      const reps = parseInt(w.reps.split('-')[0]) || 0;
      return sum + (w.sets * reps);
    }, 0) / firstEndurance.length;
    
    const lastAvgVolume = lastEndurance.reduce((sum, w) => {
      const reps = parseInt(w.reps.split('-')[0]) || 0;
      return sum + (w.sets * reps);
    }, 0) / lastEndurance.length;
    
    const enduranceGain = firstAvgVolume > 0 ? ((lastAvgVolume - firstAvgVolume) / firstAvgVolume) * 100 : 0;
    const enduranceScore = Math.min(100, Math.max(0, enduranceGain * 2)); // คะแนน 0-100

    return [
      { subject: 'Weight Loss', value: Math.round(weightLossScore) },
      { subject: 'Gain Strength', value: Math.round(strengthScore) },
      { subject: 'Endurance', value: Math.round(enduranceScore) },
    ];
  }, [workoutProgress, userProfile]);

  // ... (ส่วน Loading, Error) ...
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-blue-400 text-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        กำลังโหลด Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-xl">
        Error: {error}
      </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400 text-xl">
        ไม่พบข้อมูลผู้ใช้
      </div>
    );
  }

  // [คำนวณส่วนต่าง]
  const remainingProtein = (userProfile.protein_g || 0) - totalProtein;
  const remainingCarbs = (userProfile.carb_g || 0) - totalCarbs;
  const remainingFat = (userProfile.fat_g || 0) - totalFat;
  const remainingCalories = (userProfile.tdee || 0) - totalCalories;

  // UI หลักของ Dashboard
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ... (ส่วน Header) ... */}
      <header className="bg-gray-900 p-4 shadow-lg flex justify-between items-center">
        <div >
          <a href="#" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-blue-500" />
            <span className="text-white text-2xl font-bold">SAU Gymbro</span>
          </a>
        </div>
        <nav className="flex space-x-4"> 
          <a href="/Program" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Program</a>
          <a href="/Addfood" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Add Food</a>
          <a href="/UpdateProfile" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Update Profile</a>
        </nav>
      </header>

      {/* ส่วนเนื้อหาหลัก */}
      <div className="flex flex-1 overflow-hidden">

        {/* ... (ส่วน Sidebar ซ้าย: Profile) ... */}
        <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6">
          {/* ... (รูปโปรไฟล์และชื่อ) ... */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              <img src={userProfile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white">{userProfile.full_name}</h2>
          </div>

          {/* ... (ข้อมูลผู้ใช้) ... */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Gender:</span>
              <span>{userProfile.gender}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Age:</span>
              <span>{userProfile.age}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">weight:</span>
              <span>{userProfile.user_weight} kg</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">height:</span>
              <span>{userProfile.user_height} cm</span>
            </div>
            
            {/* แสดง Tdee แบบ 3 บรรทัด */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Tdee:</span>
              <div className="flex flex-col items-end text-sm">
                <span className="text-blue-400">{userProfile.tdee} kcal (เป้าหมาย)</span>
                <span className="text-gray-400">กินไปแล้ว {totalCalories.toFixed(0)} kcal</span>
                <span className={remainingCalories >= 0 ? "text-blue-400" : "text-green-400"}>
                  {remainingCalories >= 0
                    ? `(ขาดอีก ${remainingCalories.toFixed(0)} kcal)`
                    : `(เกิน ${Math.abs(remainingCalories).toFixed(0)} kcal)`
                  }
                </span>
              </div>
            </div>
            
            {/* Protein */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Protein:</span>
              <div className="flex flex-col items-end text-sm">
                <span className="text-red-500">{userProfile.protein_g} g (เป้าหมาย)</span>
                <span className="text-gray-400">กินไปแล้ว {totalProtein.toFixed(0)} g</span>
                <span className={remainingProtein >= 0 ? "text-red-500" : "text-green-400"}>
                  {remainingProtein >= 0
                    ? `ขาดอีก ${remainingProtein.toFixed(0)} g`
                    : `เกิน ${Math.abs(remainingProtein).toFixed(0)} g`
                  }
                </span>
              </div>
            </div>

            {/* Carbs */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Carbs:</span>
              <div className="flex flex-col items-end text-sm">
                <span className="text-orange-400">{userProfile.carb_g} g (เป้าหมาย)</span>
                <span className="text-gray-400">กินไปแล้ว {totalCarbs.toFixed(0)} g</span>
                <span className={remainingCarbs >= 0 ? "text-orange-400" : "text-green-400"}>
                  {remainingCarbs >= 0
                    ? `ขาดอีก ${remainingCarbs.toFixed(0)} g`
                    : `เกิน ${Math.abs(remainingCarbs).toFixed(0)} g`
                  }
                </span>
              </div>
            </div>

            {/* Fat */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Fat:</span>
              <div className="flex flex-col items-end text-sm">
                <span className="text-yellow-400">{userProfile.fat_g} g (เป้าหมาย)</span>
                <span className="text-gray-400">กินไปแล้ว {totalFat.toFixed(0)} g</span>
                <span className={remainingFat >= 0 ? "text-yellow-400" : "text-green-400"}>
                  {remainingFat >= 0
                    ? `ขาดอีก ${remainingFat.toFixed(0)} g`
                    : `เกิน ${Math.abs(remainingFat).toFixed(0)} g`
                  }
                </span>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">-</span>
            </div>
          </div>

          {/* ... (ส่วน Progress Chart) ... */}
          <div className="mt-6 border-t border-gray-700 pt-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Your Progress</h3>
            <p className="text-sm text-gray-400 text-center mb-4">(ข้อมูลทั้ง 7 วัน)</p>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fill: '#D1D5DB', fontSize: 12, fontFamily: 'var(--font-kanit)' }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    label={{ value: 'คะแนน', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #4B5563',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`${value}%`, 'คะแนน']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {progressData.map((entry, index) => {
                      let color = '#3B82F6'; // default blue
                      if (entry.subject === 'Weight Loss') color = '#10B981'; // green
                      else if (entry.subject === 'Gain Strength') color = '#EF4444'; // red
                      else if (entry.subject === 'Endurance') color = '#F59E0B'; // orange
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-gray-300">Weight Loss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-gray-300">Gain Strength</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-gray-300">Endurance</span>
              </div>
            </div>
          </div>
        </aside>

        {/* [อัปเดต] Panel กลาง: Your Program */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 bg-gray-950 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Your Program</h1>
              <div className="flex items-center gap-4">
                {/* [ใหม่] Day Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-white font-semibold">เลือกวัน:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>จันทร์ (Day 1)</option>
                    <option value={2}>อังคาร (Day 2)</option>
                    <option value={3}>พุธ (Day 3)</option>
                    <option value={4}>พฤหัสบดี (Day 4)</option>
                    <option value={5}>ศุกร์ (Day 5)</option>
                    <option value={6}>เสาร์ (Day 6)</option>
                    <option value={7}>อาทิตย์ (Day 7)</option>
                  </select>
                </div>
                {/* [ใหม่] ปุ่มดูประวัติ */}
                <button
                  onClick={handleOpenHistoryModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                >
                  <Calendar size={20} />
                  ดูประวัติความคืบหน้า
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-800 min-h-[70vh] space-y-4">
              
              {/* หัวตารางโปรแกรม */}
              <div className="grid grid-cols-4 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-center">Sets x Reps</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {/* [อัปเดต] รายการท่าออกกำลังกาย */}
              {loading ? (
                <div className="text-center text-gray-500 pt-10">Loading program...</div>
              ) : programItems.length > 0 ? (
                programItems.map((item) => (
                  // ตรวจสอบว่าเป็นวันพักหรือไม่
                  item.exercise_name === "--- REST DAY ---" ? (
                    <div key={item.id} className="text-center text-gray-400 py-4 font-semibold text-lg">
                      (Rest Day)
                    </div>
                  ) : (
                    // แสดงท่าออกกำลังกาย
                    <div key={item.id} className="grid grid-cols-4 gap-4 px-4 py-3 text-white border-b border-gray-800 items-center">
                      <span className="col-span-1 font-semibold">{item.exercise_name}</span>
                      <span className="col-span-1 text-center">{item.weight_kg} kg</span>
                      <span className="col-span-1 text-center">{item.sets} x {item.reps}</span>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => handleOpenProgressModal(item)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-sm transition-colors"
                        >
                          บันทึกความคืบหน้า
                        </button>
                      </div>
                    </div>
                  )
                ))
              ) : (
                // ถ้าไม่มีข้อมูล
                <div className="text-center text-gray-500 pt-10">
                  (ยังไม่มีโปรแกรมที่บันทึกไว้สำหรับวันนี้)
                </div>
              )}

            </div>
          </div>

          {/* ... (รายการอาหาร Meal Per Day) ... */}
          <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Meal Per Day</h3>
                <button
                  onClick={openFoodModal}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="เพิ่มอาหารจากประวัติ"
                >
                  <PlusCircle size={24} />
                </button>
              </div>

              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-500" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหารายการอาหาร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                {filteredFoodLogs.length > 0 ? (
                  filteredFoodLogs.map((food) => (
                    <div
                      key={food.id}
                      className="bg-gray-800 p-3 rounded-md flex justify-between items-center shadow"
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-200 truncate" title={food.food_name}>
                          {food.food_name}
                        </span>
                        <div className="text-sm space-x-2 mt-1">
                          <span className="font-medium text-red-500">P{food.protein}</span>
                          <span className="font-medium text-orange-400">C{food.carbs}</span>
                          <span className="font-medium text-yellow-400">F{food.fat}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2  ml-2">
                        <span className="text-blue-400 font-semibold">{food.calories} kcal</span>
                        <button
                          onClick={() => handleRemoveFoodItem(food.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors rounded-full"
                          aria-label="Remove item"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 pt-10">
                    {searchQuery
                      ? 'ไม่พบรายการที่ค้นหา'
                      : '(ยังไม่มีข้อมูลอาหารสำหรับวันนี้)'}
                  </div>
                )}
              </div>

              {/* ... (สรุปแคลอรีรวม) ... */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-400">{totalCalories.toFixed(0)} kcal</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* ... (โค้ด Modal เพิ่มอาหาร) ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h4 className="text-lg font-bold">เลือกอาหารจากประวัติ</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-500" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาประวัติอาหาร..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalLoading ? (
                <div className="text-center text-gray-400">กำลังโหลด...</div>
              ) : filteredFoodHistory.length > 0 ? (
                filteredFoodHistory.map((food) => (
                  <div
                    key={`${food.id}-${food.food_name}`} 
                    className="bg-gray-800 p-3 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <span className="text-gray-200">{food.food_name}</span>
                      <div className="text-xs space-x-2 mt-1">
                        <span className="font-medium text-red-500">โปรตีน {food.protein}</span>
                        <span className="font-medium text-orange-400">คาร์บ {food.carbs}</span>
                        <span className="font-medium text-yellow-400">ไขมัน {food.fat}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFoodFromHistory(food)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-semibold"
                    >
                      เพิ่ม
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">
                  {modalSearch ? 'ไม่พบรายการที่ค้นหา' : 'ไม่พบประวัติอาหาร'}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* [ใหม่] Modal สำหรับบันทึก Progress */}
      {isProgressModalOpen && editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h4 className="text-lg font-bold text-white">บันทึกความคืบหน้า: {editingExercise.exercise_name}</h4>
              <button onClick={() => setIsProgressModalOpen(false)} className="text-gray-500 hover:text-white">
                <XCircle size={22} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">น้ำหนักที่ยก (kg)</label>
                <input
                  type="number"
                  value={progressWeight}
                  onChange={(e) => setProgressWeight(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">จำนวน Sets</label>
                <input
                  type="number"
                  value={progressSets}
                  onChange={(e) => setProgressSets(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">จำนวน Reps</label>
                <input
                  type="text"
                  value={progressReps}
                  onChange={(e) => setProgressReps(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10-12"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">น้ำหนักตัว (kg)</label>
                <input
                  type="number"
                  value={progressBodyWeight}
                  onChange={(e) => setProgressBodyWeight(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProgress}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                >
                  บันทึก
                </button>
                <button
                  onClick={() => setIsProgressModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [ใหม่] Modal สำหรับดูประวัติความคืบหน้า */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h4 className="text-xl font-bold text-white">ประวัติความคืบหน้า</h4>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-white">
                <XCircle size={22} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {weeklyProgress.length > 0 ? (
                <div className="space-y-6">
                  {weeklyProgress.map((week) => {
                    const weekStart = new Date(week.week_start_date);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    return (
                      <div key={week.week_start_date} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                          <h5 className="text-lg font-bold text-white">
                            สัปดาห์: {weekStart.toLocaleDateString('th-TH')} - {weekEnd.toLocaleDateString('th-TH')}
                          </h5>
                          {week.body_weight_avg && (
                            <span className="text-blue-400 font-semibold">
                              น้ำหนักตัวเฉลี่ย: {week.body_weight_avg.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {week.workouts.map((workout) => (
                            <div key={workout.id} className="bg-gray-900 p-3 rounded-md grid grid-cols-5 gap-4 text-sm">
                              <span className="text-white font-semibold">{workout.exercise_name}</span>
                              <span className="text-gray-300">น้ำหนัก: {workout.weight_kg} kg</span>
                              <span className="text-gray-300">Sets: {workout.sets}</span>
                              <span className="text-gray-300">Reps: {workout.reps}</span>
                              <span className="text-gray-300">น้ำหนักตัว: {workout.body_weight} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  ยังไม่มีประวัติความคืบหน้า
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}