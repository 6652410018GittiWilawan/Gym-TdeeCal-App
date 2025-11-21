"use client";

import React, { useState, useEffect, useMemo } from 'react';
// ไม่ต้องใช้ recharts แล้ว ใช้แสดงตัวเลขแทน
import { supabase } from '@/lib/supabaseClient';
import { Dumbbell, XCircle, PlusCircle, Search, Calendar } from 'lucide-react';
import Image from 'next/image';

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

// Helper function: หา muscle group จาก exercise name (ใช้ข้อมูลจาก program_items หรือ fallback ไปที่ exercise list)
const getMuscleGroupFromExercise = (exerciseName: string, allProgramItems?: Array<{exercise_name: string, muscle_group: string}>): string | null => {
  // ถ้ามีข้อมูลจาก program_items ให้ใช้ก่อน
  if (allProgramItems && allProgramItems.length > 0) {
    const found = allProgramItems.find(item => 
      item.exercise_name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (found) return found.muscle_group;
  }

  // Fallback: ใช้ exercise list
  const exerciseLists: Record<string, string[]> = {
    chest: ['Bench Press', 'Incline Dumbbell Press', 'Dips', 'Cable Fly', 'Dumbbell Fly', 'Push Up', 'Incline Bench Press', 'Incline Press', 'Dumbbell Bench Press'],
    back: ['Deadlift', 'Bent Over Row', 'T-Bar Row', 'Seated Cable Row', 'T-bar row'],
    lats: ['Lat Pulldown', 'Pull Up', 'Chin Up', 'Straight Arm Pulldown', 'Dumbbell Row', 'Lat Pull Down', 'One Arm Dumbbell Row', 'Wide Grip Lat Pull Down'],
    shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Arnold Press', 'Seated Dumbbell Press', 'Machine Shoulder Press', 'Cable Lateral Raise', 'Shoulder Press'],
    quads: ['Squat', 'Leg Press', 'Lunge', 'Leg Extension', 'Goblet Squat', 'Front Squat', 'Leg Extensions', 'Leg Lunge', 'Leg Extension'],
    hamstrings: ['Romanian Deadlift', 'Lying Leg Curl', 'Seated Leg Curl', 'Good Morning', 'RDL', 'Leg Curls', 'Leg Curl'],
    glutes: ['Hip Thrust', 'Glute Bridge', 'Bulgarian Split Squat'],
    calves: ['Calf Raise (Standing)', 'Calf Raise (Seated)', 'Seated Calf Raise', 'Standing Calf Raise', 'Calves Raise Seated'],
    biceps: ['Bicep Curl', 'Hammer Curl', 'Incline Dumbbell Curl', 'Preacher Curl', 'Wide Grip Bicep Curl'],
    triceps: ['Tricep Pushdown', 'Skullcrusher', 'Close Grip Bench Press', 'Overhead Extension', 'Dips', 'Weighted Dips', 'Tricep extension'],
  };

  const lowerCaseName = exerciseName.toLowerCase();
  for (const [group, exercises] of Object.entries(exerciseLists)) {
    if (exercises.some(ex => lowerCaseName.includes(ex.toLowerCase()))) {
      return group;
    }
  }
  return null;
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
  const [allProgramItems, setAllProgramItems] = useState<Array<{exercise_name: string, muscle_group: string}>>([]);
  
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
      const [progressDataNew, profileDataNew, programDataNew, allProgramDataNew] = await Promise.all([
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
          .select('id, exercise_name, weight_kg, sets, reps, day_of_week, muscle_group')
          .eq('user_id', user.id)
          .eq('day_of_week', selectedDay)
          .order('id', { ascending: true }),
        supabase
          .from('program_items')
          .select('exercise_name, muscle_group')
          .eq('user_id', user.id)
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

      // อัปเดต all program items
      if (allProgramDataNew.data) {
        setAllProgramItems(allProgramDataNew.data);
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


        // [อัปเดต] เพิ่ม programResponse, allProgramResponse และ progressResponse
        const [profileResponse, foodResponse, programResponse, allProgramResponse, progressResponse] = await Promise.all([
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
            .select('id, exercise_name, weight_kg, sets, reps, day_of_week, muscle_group')
            .eq('user_id', user.id)
            .eq('day_of_week', selectedDay)
            .order('id', { ascending: true }),
          
          // [ใหม่] ดึงข้อมูล Program ทั้งหมดเพื่อหา muscle_group
          supabase
            .from('program_items')
            .select('exercise_name, muscle_group')
            .eq('user_id', user.id),
          
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

        // [ใหม่] ประมวลผล All Program Items (สำหรับหา muscle_group)
        if (allProgramResponse.error) {
          console.error("All Program Error:", allProgramResponse.error.message);
        } else if (allProgramResponse.data) {
          setAllProgramItems(allProgramResponse.data);
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

  // [ใหม่] คำนวณ Progress Metrics (ต้องอยู่ก่อน early returns)
  const progressData = useMemo(() => {
    if (!workoutProgress.length || !userProfile) {
      return {
        weightLoss: 0,
        weightGain: 0,
        chestStrength: 0,
        backStrength: 0,
        shoulderStrength: 0,
        legStrength: 0,
        armStrength: 0,
      };
    }

    // คำนวณ Weight Loss และ Weight Gain: เปรียบเทียบน้ำหนักตัวแรกกับล่าสุด
    const sortedByDate = [...workoutProgress].sort((a, b) => 
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    );
    const firstWeight = sortedByDate.find(w => w.body_weight > 0)?.body_weight || userProfile.user_weight;
    const lastWeight = [...workoutProgress]
      .filter(w => w.body_weight > 0)
      .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())[0]?.body_weight || userProfile.user_weight;
    
    const weightChange = firstWeight - lastWeight;
    const weightLoss = weightChange > 0 ? Math.round(weightChange) : 0;
    const weightGain = weightChange < 0 ? Math.round(Math.abs(weightChange)) : 0;

    // คำนวณ Strength แต่ละส่วน: น้ำหนักรวมทั้งหมด (weight_kg * sets) และหาร 2
    const calculateStrength = (muscleGroups: string[]): number => {
      const relevantWorkouts = workoutProgress.filter(w => {
        const group = getMuscleGroupFromExercise(w.exercise_name, allProgramItems);
        return group && muscleGroups.includes(group);
      });
      
      if (relevantWorkouts.length === 0) return 0;
      
      // คำนวณน้ำหนักรวมทั้งหมด (weight_kg * sets) และหาร 2
      const totalWeight = relevantWorkouts.reduce((sum, w) => {
        return sum + (w.weight_kg * w.sets);
      }, 0);
      
      return Math.round(totalWeight / 2);
    };

    const chestStrength = calculateStrength(['chest']);
    const backStrength = calculateStrength(['back', 'lats']);
    const shoulderStrength = calculateStrength(['shoulders']);
    const legStrength = calculateStrength(['quads', 'hamstrings', 'glutes', 'calves']);
    const armStrength = calculateStrength(['biceps', 'triceps']);

    return {
      weightLoss,
      weightGain,
      chestStrength,
      backStrength,
      shoulderStrength,
      legStrength,
      armStrength,
    };
  }, [workoutProgress, userProfile, allProgramItems]);

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
      <header className="bg-gray-900 p-2 sm:p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <div>
          <a href="#" className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="text-white text-xl sm:text-2xl font-bold">SAU Gymbro</span>
          </a>
        </div>
        <nav className="flex flex-wrap gap-2 sm:gap-4 justify-center"> 
          <a href="/Program" className="py-1.5 px-2 sm:py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold text-sm sm:text-base">Program</a>
          <a href="/Addfood" className="py-1.5 px-2 sm:py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold text-sm sm:text-base">Add Food</a>
          <a href="/UpdateProfile" className="py-1.5 px-2 sm:py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold text-sm sm:text-base">Update Profile</a>
        </nav>
      </header>

      {/* ส่วนเนื้อหาหลัก */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* ... (ส่วน Sidebar ซ้าย: Profile) ... */}
        <aside className="w-full lg:w-80 bg-gray-900 p-4 sm:p-6 shadow-xl flex flex-col space-y-4 sm:space-y-6 max-h-[50vh] lg:max-h-none overflow-y-auto lg:overflow-y-auto">
          {/* ... (รูปโปรไฟล์และชื่อ) ... */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg relative">
              <Image 
                src={userProfile.profile_pic_url} 
                alt="Profile" 
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white text-center">{userProfile.full_name}</h2>
          </div>

          {/* ... (ข้อมูลผู้ใช้) ... */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Gender:</span>
              <span>{userProfile.gender}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Age:</span>
              <span>{userProfile.age}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">weight:</span>
              <span>{userProfile.user_weight} kg</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">height:</span>
              <span>{userProfile.user_height} cm</span>
            </div>
            
            {/* แสดง Tdee แบบ 3 บรรทัด */}
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Tdee:</span>
              <div className="flex flex-col items-end text-xs sm:text-sm">
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
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Protein:</span>
              <div className="flex flex-col items-end text-xs sm:text-sm">
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
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Carbs:</span>
              <div className="flex flex-col items-end text-xs sm:text-sm">
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
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Fat:</span>
              <div className="flex flex-col items-end text-xs sm:text-sm">
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
            <div className="flex justify-between items-center text-gray-300 text-sm sm:text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">-</span>
            </div>
          </div>

          {/* ... (ส่วน Progress) ... */}
          <div className="mt-4 sm:mt-6 border-t border-gray-700 pt-4 sm:pt-6 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">Your Progress</h3>
            <p className="text-xs sm:text-sm text-gray-400 text-center mb-3 sm:mb-4">(ข้อมูลทั้ง 7 วัน)</p>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Weight Loss & Weight Gain */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Weight Loss</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{progressData.weightLoss} kg</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Weight Gain</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">{progressData.weightGain} kg</div>
                </div>
              </div>

              {/* Strength Metrics */}
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Chest Strength</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{progressData.chestStrength} kg</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Back Strength</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">{progressData.backStrength} kg</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Shoulder Strength</div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-400">{progressData.shoulderStrength} kg</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Leg Strength</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-400">{progressData.legStrength} kg</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Arm Strength</div>
                  <div className="text-xl sm:text-2xl font-bold text-pink-400">{progressData.armStrength} kg</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* [อัปเดต] Panel กลาง: Your Program */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-3 sm:p-6 bg-gray-950 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Program</h1>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {/* [ใหม่] Day Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-white font-semibold text-sm sm:text-base">เลือกวัน:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors text-sm sm:text-base"
                >
                  <Calendar size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">ดูประวัติความคืบหน้า</span>
                  <span className="sm:hidden">ประวัติ</span>
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-3 sm:p-6 rounded-lg shadow-inner border border-gray-800 min-h-[50vh] sm:min-h-[70vh] space-y-3 sm:space-y-4">
              
              {/* หัวตารางโปรแกรม */}
              <div className="hidden sm:grid grid-cols-4 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700 text-sm">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-center">Sets x Reps</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {/* [อัปเดต] รายการท่าออกกำลังกาย */}
              {loading ? (
                <div className="text-center text-gray-500 pt-10 text-sm sm:text-base">Loading program...</div>
              ) : programItems.length > 0 ? (
                programItems.map((item) => (
                  // ตรวจสอบว่าเป็นวันพักหรือไม่
                  item.exercise_name === "--- REST DAY ---" ? (
                    <div key={item.id} className="text-center text-gray-400 py-4 font-semibold text-base sm:text-lg">
                      (Rest Day)
                    </div>
                  ) : (
                    // แสดงท่าออกกำลังกาย - Mobile: แสดงแบบ card, Desktop: แสดงแบบตาราง
                    <div key={item.id} className="sm:grid sm:grid-cols-4 sm:gap-4 sm:px-4 sm:py-3 sm:text-white sm:border-b sm:border-gray-800 sm:items-center">
                      {/* Mobile View */}
                      <div className="sm:hidden bg-gray-800 p-3 rounded-lg mb-2 space-y-2">
                        <div className="font-semibold text-white text-sm">{item.exercise_name}</div>
                        <div className="flex justify-between items-center text-xs text-gray-300">
                          <span>Weight: {item.weight_kg} kg</span>
                          <span>Sets x Reps: {item.sets} x {item.reps}</span>
                        </div>
                        <button
                          onClick={() => handleOpenProgressModal(item)}
                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-xs transition-colors"
                        >
                          บันทึกความคืบหน้า
                        </button>
                      </div>
                      {/* Desktop View */}
                      <span className="hidden sm:block col-span-1 font-semibold">{item.exercise_name}</span>
                      <span className="hidden sm:block col-span-1 text-center">{item.weight_kg} kg</span>
                      <span className="hidden sm:block col-span-1 text-center">{item.sets} x {item.reps}</span>
                      <div className="hidden sm:block col-span-1 text-center">
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
                <div className="text-center text-gray-500 pt-10 text-sm sm:text-base">
                  (ยังไม่มีโปรแกรมที่บันทึกไว้สำหรับวันนี้)
                </div>
              )}

            </div>
          </div>

          {/* ... (รายการอาหาร Meal Per Day) ... */}
          <aside className="w-full lg:w-80 bg-gray-900 p-4 sm:p-6 shadow-xl flex flex-col space-y-4 sm:space-y-6 overflow-hidden max-h-[50vh] lg:max-h-none">
            <div className="flex flex-col flex-1 min-h-0">

              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Meal Per Day</h3>
                <button
                  onClick={openFoodModal}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="เพิ่มอาหารจากประวัติ"
                >
                  <PlusCircle size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="relative mb-3 sm:mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหารายการอาหาร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                {filteredFoodLogs.length > 0 ? (
                  filteredFoodLogs.map((food) => (
                    <div
                      key={food.id}
                      className="bg-gray-800 p-2 sm:p-3 rounded-md flex justify-between items-center shadow"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-gray-200 truncate text-sm sm:text-base" title={food.food_name}>
                          {food.food_name}
                        </span>
                        <div className="text-xs sm:text-sm space-x-2 mt-1">
                          <span className="font-medium text-red-500">P{food.protein}</span>
                          <span className="font-medium text-orange-400">C{food.carbs}</span>
                          <span className="font-medium text-yellow-400">F{food.fat}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 ml-2 shrink-0">
                        <span className="text-blue-400 font-semibold text-xs sm:text-sm">{food.calories} kcal</span>
                        <button
                          onClick={() => handleRemoveFoodItem(food.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors rounded-full"
                          aria-label="Remove item"
                        >
                          <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 pt-10 text-sm sm:text-base">
                    {searchQuery
                      ? 'ไม่พบรายการที่ค้นหา'
                      : '(ยังไม่มีข้อมูลอาหารสำหรับวันนี้)'}
                  </div>
                )}
              </div>

              {/* ... (สรุปแคลอรีรวม) ... */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-base sm:text-lg font-bold">
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[80vh]">
            
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
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
                            <div key={workout.id} className="bg-gray-900 p-2 sm:p-3 rounded-md grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <span className="text-white font-semibold col-span-1 sm:col-span-1">{workout.exercise_name}</span>
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