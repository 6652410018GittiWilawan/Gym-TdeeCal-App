"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, XCircle, ChevronDown } from 'lucide-react';

// 1. กำหนด Type
interface ProgramItem {
  id: number;
  user_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight_kg: number;
  day_of_week: number;
  muscle_group: string;
}

// 2. Array สำหรับ Dropdown
const muscleGroups = [
  { id: 'chest', name: 'อก (Chest)' },
  { id: 'quads', name: 'ขาหน้า (Quads)' },
  { id: 'back', name: 'หลัง (Back)' },
  { id: 'lats', name: 'ปีก (Lats)' },
  { id: 'hamstrings', name: 'ขาหลัง (Hamstrings)' },
  { id: 'glutes', name: 'ก้น (Glutes)' },
  { id: 'shoulders', name: 'ไหล่ (Shoulders)' },
  { id: 'biceps', name: 'แขนหน้า (Biceps)' },
  { id: 'triceps', name: 'แขนหลัง (Triceps)' },
  { id: 'calves', name: 'น่อง (Calves)' },
  { id: 'abs', name: 'ท้อง (Abs)' },
  { id: 'rest', name: 'Rest Day' },
];

// 3. สร้างรายการท่าออกกำลังกายสำหรับ Dropdown
const exerciseLists: Record<string, string[]> = {
  chest: ['Bench Press', 'Incline Dumbbell Press', 'Dips', 'Cable Fly', 'Dumbbell Fly', 'Push Up'],
  quads: ['Squat', 'Leg Press', 'Lunge', 'Leg Extension', 'Goblet Squat'],
  back: ['Deadlift', 'Bent Over Row', 'T-Bar Row', 'Seated Cable Row'],
  lats: ['Lat Pulldown', 'Pull Up', 'Chin Up', 'Straight Arm Pulldown', 'Dumbbell Row'],
  hamstrings: ['Romanian Deadlift', 'Lying Leg Curl', 'Seated Leg Curl', 'Good Morning'],
  glutes: ['Hip Thrust', 'Squat', 'Glute Bridge', 'Lunge', 'Bulgarian Split Squat'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Arnold Press'],
  biceps: ['Bicep Curl', 'Hammer Curl', 'Incline Dumbbell Curl', 'Preacher Curl'],
  triceps: ['Tricep Pushdown', 'Skullcrusher', 'Close Grip Bench Press', 'Overhead Extension', 'Dips'],
  calves: ['Calf Raise (Standing)', 'Calf Raise (Seated)'],
  abs: ['Crunches', 'Leg Raise', 'Plank', 'Russian Twist', 'Cable Crunch'],
  rest: [], // ไม่มีท่าสำหรับวันพัก
};

const REST_DAY_NAME = "--- REST DAY ---";

export default function ProgramPage() {
  const router = useRouter();

  const [openDay, setOpenDay] = useState<number | null>(1);
  const [allExercises, setAllExercises] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มเพิ่มท่า
  const [newMuscleGroup, setNewMuscleGroup] = useState('chest');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newWeight, setNewWeight] = useState('');

  // State สำหรับการ "แก้ไข"
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ProgramItem | null>(null);

  const days = [1, 2, 3, 4, 5, 6, 7];

  // 5. ฟังก์ชันดึงข้อมูล
  const getUserAndFetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('program_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching all exercises:", error);
      return [];
    }
    return data || [];
  }, []);

  // 6. useEffect - ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      const data = await getUserAndFetchAll();
      if (!cancelled) {
        setAllExercises(data);
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [getUserAndFetchAll]);

  // 7. useMemo สำหรับ "จัดกลุ่ม" (ไม่จำเป็นต้องแก้ไข)
  const groupedExercises = useMemo(() => {
    return allExercises.reduce((acc, ex) => {
      const day = ex.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(ex);
      return acc;
    }, {} as Record<number, ProgramItem[]>);
  }, [allExercises]);

  // 8. ฟังก์ชัน CRUD

  // [แก้ไข] ฟังก์ชันนี้ถูกปรับเพื่อให้ใช้ฟังก์ชัน Save ในการ Update
  const handleUpdateExercise = useCallback(async () => {
    if (!editingId || !editFormData) return;

    // ตรวจสอบว่ามีท่าออกกำลังกายหรือไม่ หากไม่มี จะไม่ยอมให้บันทึก
    if (!editFormData.exercise_name) {
      alert("กรุณาเลือกท่าออกกำลังกายก่อนบันทึกการแก้ไข");
      return;
    }

    const dataToUpdate = {
      // ใช้ค่าจากฟอร์มที่กำลังแก้ไข หากเป็นค่าว่างจะใช้ค่า Default
      exercise_name: editFormData.exercise_name,
      sets: parseInt(String(editFormData.sets)) || 3,
      reps: editFormData.reps || '10-12', // หาก reps เป็นค่าว่างจะใช้ '10-12'
      weight_kg: parseInt(String(editFormData.weight_kg)) || 0,
      muscle_group: editFormData.muscle_group
    };

    const { error } = await supabase.from('program_items').update(dataToUpdate).eq('id', editingId);

    if (error) alert(error.message);
    else {
      setEditingId(null); setEditFormData(null);
      await getUserAndFetchAll(); // ดึงข้อมูลใหม่
    }
  }, [editingId, editFormData, getUserAndFetchAll]);

  // [NEW/MODIFIED] ฟังก์ชันสำหรับปุ่ม Finish (ใช้แทน Save/Return)
  // หากมีรายการที่กำลังแก้ไขอยู่ จะทำการ Save ก่อน จากนั้นจึงกลับไป Dashboard
  const handleFinish = async () => {
    if (editingId) {
      await handleUpdateExercise(); // พยายามบันทึกก่อน
    }
    // ไม่ว่าจะบันทึกหรือไม่สำเร็จ (หากไม่สำเร็จ error จะถูก alert ออกไปแล้ว)
    // เราจะปิดโหมดแก้ไขและกลับไป Dashboard
    setEditingId(null);
    setEditFormData(null);
    router.push('/Dashboard');
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('program_items').delete().eq('id', id);
    if (error) alert(error.message);
    else getUserAndFetchAll();
  };

  const handleAddExercise = async () => {
    if (openDay === null) {
      alert("กรุณาเปิดวันที่ต้องการเพิ่มท่าก่อนครับ");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newExerciseName) {
      alert("กรุณาเลือกท่าออกกำลังกาย");
      return;
    }
    const newExercise = {
      user_id: user.id, exercise_name: newExerciseName,
      sets: parseInt(newSets) || 3, reps: newReps || '10-12',
      weight_kg: parseInt(newWeight) || 0,
      day_of_week: openDay,
      muscle_group: newMuscleGroup,
    };
    const { error } = await supabase.from('program_items').insert(newExercise);
    if (error) alert(error.message);
    else {
      setNewExerciseName(''); setNewSets('');
      setNewReps(''); setNewWeight('');
      setNewMuscleGroup('chest');
      getUserAndFetchAll();
    }
  };

  const handleAddRestDay = async (day: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const exercisesForDay = groupedExercises[day] || [];
    const exerciseIdsToDelete = exercisesForDay.map(ex => ex.id);

    // 1. ลบรายการเดิมทั้งหมดสำหรับวันนี้
    if (exerciseIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('program_items')
        .delete()
        .in('id', exerciseIdsToDelete);

      if (deleteError) {
        alert(deleteError.message);
        setLoading(false);
        return;
      }
    }

    // 2. เพิ่มรายการ Rest Day
    const restExercise = {
      user_id: user.id,
      exercise_name: REST_DAY_NAME,
      sets: 0,
      reps: '0',
      weight_kg: 0,
      day_of_week: day,
      muscle_group: 'rest',
    };
    const { error: insertError } = await supabase.from('program_items').insert(restExercise);

    if (insertError) alert(insertError.message);

    await getUserAndFetchAll();
  };

  // [ใหม่] ฟังก์ชันสำหรับ Push/Pull/Legs Program
  const handlePushPullLegs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("กรุณาล็อกอินก่อนใช้งาน");
      return;
    }

    if (!confirm("คุณต้องการแทนที่โปรแกรมปัจจุบันด้วย Push/Pull/Legs หรือไม่?")) {
      return;
    }

    setLoading(true);

    try {
      // ลบโปรแกรมเดิมทั้งหมด
      const { error: deleteError } = await supabase
        .from('program_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // กำหนดโปรแกรม Push/Pull/Legs
      const pushPullLegsProgram = [
        // Day 1 - Push
        { user_id: user.id, exercise_name: 'Incline Bench Press', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 1, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 1, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'Seated Dumbbell Press', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 1, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Lateral Raises', sets: 3, reps: '12-15', weight_kg: 0, day_of_week: 1, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: '(Weighted) Dips', sets: 4, reps: '8', weight_kg: 0, day_of_week: 1, muscle_group: 'triceps' },
        
        // Day 2 - Pull
        { user_id: user.id, exercise_name: 'Bent Over Row', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 2, muscle_group: 'back' },
        { user_id: user.id, exercise_name: 'One Arm Dumbbell Row', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 2, muscle_group: 'back' },
        { user_id: user.id, exercise_name: '(Weighted) Chin Up', sets: 4, reps: '8', weight_kg: 0, day_of_week: 2, muscle_group: 'lats' },
        { user_id: user.id, exercise_name: 'Lat Pull Down', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 2, muscle_group: 'lats' },
        { user_id: user.id, exercise_name: 'Wide Grip Bicep Curl', sets: 3, reps: '12', weight_kg: 0, day_of_week: 2, muscle_group: 'biceps' },
        
        // Day 3 - Legs
        { user_id: user.id, exercise_name: 'Front Squat', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 3, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Leg Extensions', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 3, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'RDL', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 3, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Leg Curls', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 3, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Seated Calf Raise', sets: 4, reps: '8-10', weight_kg: 0, day_of_week: 3, muscle_group: 'calves' },
        { user_id: user.id, exercise_name: 'Standing Calf Raise', sets: 4, reps: '12-15', weight_kg: 0, day_of_week: 3, muscle_group: 'calves' },
        
        // Day 4 - Rest
        { user_id: user.id, exercise_name: REST_DAY_NAME, sets: 0, reps: '0', weight_kg: 0, day_of_week: 4, muscle_group: 'rest' },
        
        // Day 5 - Push
        { user_id: user.id, exercise_name: 'Incline Dumbbell Press', sets: 3, reps: '12', weight_kg: 0, day_of_week: 5, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'Machine Shoulder Press', sets: 3, reps: '10', weight_kg: 0, day_of_week: 5, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Cable Lateral Raise', sets: 3, reps: '12', weight_kg: 0, day_of_week: 5, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Seated Cable Row', sets: 3, reps: '10', weight_kg: 0, day_of_week: 5, muscle_group: 'back' },
        { user_id: user.id, exercise_name: 'Wide Grip Lat Pull Down', sets: 3, reps: '12', weight_kg: 0, day_of_week: 5, muscle_group: 'lats' },
        
        // Day 6 - Legs
        { user_id: user.id, exercise_name: 'Front Squat', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 6, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Leg Extensions', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 6, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'RDL', sets: 4, reps: '6-8', weight_kg: 0, day_of_week: 6, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Leg Curls', sets: 3, reps: '10-12', weight_kg: 0, day_of_week: 6, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Seated Calf Raise', sets: 4, reps: '8-10', weight_kg: 0, day_of_week: 6, muscle_group: 'calves' },
        { user_id: user.id, exercise_name: 'Standing Calf Raise', sets: 4, reps: '12-15', weight_kg: 0, day_of_week: 6, muscle_group: 'calves' },
        
        // Day 7 - Rest
        { user_id: user.id, exercise_name: REST_DAY_NAME, sets: 0, reps: '0', weight_kg: 0, day_of_week: 7, muscle_group: 'rest' },
      ];

      const { error: insertError } = await supabase
        .from('program_items')
        .insert(pushPullLegsProgram);

      if (insertError) throw insertError;

      alert("เพิ่มโปรแกรม Push/Pull/Legs เรียบร้อยแล้ว!");
      await getUserAndFetchAll();
    } catch (err: unknown) {
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Error adding Push/Pull/Legs program:", errorMessage);
      alert("เกิดข้อผิดพลาด: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // [ใหม่] ฟังก์ชันสำหรับ Upper/Lower Program
  const handleUpperLower = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("กรุณาล็อกอินก่อนใช้งาน");
      return;
    }

    if (!confirm("คุณต้องการแทนที่โปรแกรมปัจจุบันด้วย Upper/Lower หรือไม่?")) {
      return;
    }

    setLoading(true);

    try {
      // ลบโปรแกรมเดิมทั้งหมด
      const { error: deleteError } = await supabase
        .from('program_items')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // กำหนดโปรแกรม Upper/Lower
      const upperLowerProgram = [
        // Day 1 - Upper
        { user_id: user.id, exercise_name: 'Incline Press', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'Cable Fly', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'T-bar row', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'back' },
        { user_id: user.id, exercise_name: 'Lat Pulldown', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'lats' },
        { user_id: user.id, exercise_name: 'Shoulder Press', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Lateral Raise', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Preacher Curl', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'biceps' },
        { user_id: user.id, exercise_name: 'Tricep extension', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 1, muscle_group: 'triceps' },
        
        // Day 2 - Lower
        { user_id: user.id, exercise_name: 'Leg Press', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 2, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Leg Curl', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 2, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Leg Extension', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 2, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Leg Lunge', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 2, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Calves Raise Seated', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 2, muscle_group: 'calves' },
        
        // Day 3 - Rest
        { user_id: user.id, exercise_name: REST_DAY_NAME, sets: 0, reps: '0', weight_kg: 0, day_of_week: 3, muscle_group: 'rest' },
        
        // Day 4 - Upper
        { user_id: user.id, exercise_name: 'Incline Press', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'Cable Fly', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'chest' },
        { user_id: user.id, exercise_name: 'T-bar row', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'back' },
        { user_id: user.id, exercise_name: 'Lat Pulldown', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'lats' },
        { user_id: user.id, exercise_name: 'Shoulder Press', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Lateral Raise', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'shoulders' },
        { user_id: user.id, exercise_name: 'Preacher Curl', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'biceps' },
        { user_id: user.id, exercise_name: 'Tricep extension', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 4, muscle_group: 'triceps' },
        
        // Day 5 - Lower
        { user_id: user.id, exercise_name: 'Deadlift', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 5, muscle_group: 'back' },
        { user_id: user.id, exercise_name: 'Leg Curl', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 5, muscle_group: 'hamstrings' },
        { user_id: user.id, exercise_name: 'Leg Extension', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 5, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Leg Lunge', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 5, muscle_group: 'quads' },
        { user_id: user.id, exercise_name: 'Calves Raise Seated', sets: 2, reps: '4-8', weight_kg: 0, day_of_week: 5, muscle_group: 'calves' },
        
        // Day 6 - Rest
        { user_id: user.id, exercise_name: REST_DAY_NAME, sets: 0, reps: '0', weight_kg: 0, day_of_week: 6, muscle_group: 'rest' },
        
        // Day 7 - Rest
        { user_id: user.id, exercise_name: REST_DAY_NAME, sets: 0, reps: '0', weight_kg: 0, day_of_week: 7, muscle_group: 'rest' },
      ];

      const { error: insertError } = await supabase
        .from('program_items')
        .insert(upperLowerProgram);

      if (insertError) throw insertError;

      alert("เพิ่มโปรแกรม Upper/Lower เรียบร้อยแล้ว!");
      await getUserAndFetchAll();
    } catch (err: unknown) {
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Error adding Upper/Lower program:", errorMessage);
      alert("เกิดข้อผิดพลาด: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // 9. ฟังก์ชันสำหรับ Logic "แก้ไข" (Update)
  const handleRowClick = (exercise: ProgramItem) => {
    // หากกดซ้ำที่แถวเดิม จะเป็นการยกเลิกการแก้ไข
    if (editingId === exercise.id) {
      setEditingId(null);
      setEditFormData(null);
      return;
    }

    if (exercise.exercise_name === REST_DAY_NAME) return;
    setEditingId(exercise.id);
    setEditFormData(exercise);
  };

  // [แก้ไข] ปรับปรุง handleEditFormChange เพื่อให้ Sets และ Weight ถูกแปลงเป็น number ทันที
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editFormData) return;

    const { name, value } = e.target;
    let newFormData = { ...editFormData };

    if (name === 'muscle_group') {
      newFormData = { ...newFormData, [name]: value, exercise_name: '' }; // ล้างชื่อท่าเมื่อเปลี่ยนกลุ่มกล้ามเนื้อ
    } else if (name === 'sets' || name === 'weight_kg') {
      // แปลงเป็น number เมื่อมีการเปลี่ยนแปลง
      newFormData = { ...newFormData, [name]: parseInt(value) || 0 };
    } else {
      newFormData = { ...newFormData, [name]: value };
    }

    setEditFormData(newFormData);
  };

  // อัปเดต State เมื่อ MuscleGroup เปลี่ยน (สำหรับฟอร์ม "เพิ่ม")
  const handleMuscleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewMuscleGroup(e.target.value);
    setNewExerciseName('');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-950 text-white p-6 gap-6">

      {/* ============ แผงด้านซ้าย (Recommend) ============ */}
      {/* [แก้ไข] ลบปุ่ม Save/Return ออก และแทนที่ด้วย Finish */}
      <div className="flex-1 lg:max-w-sm p-6 bg-gray-900 rounded-lg shadow-inner border border-gray-800 flex flex-col items-center">

        <h3 className="text-lg font-bold text-white mb-3">recommend workout</h3>
        <div className="space-y-3 w-full mb-8">
          <button 
            onClick={handlePushPullLegs}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
          >
            Push/Pull/Legs
          </button>
          <button 
            onClick={handleUpperLower}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
          >
            Upper/Lower
          </button>
        </div>

        {/* ปุ่ม Finish (แทน Save/Return) */}
        <div className="w-full mt-auto">
          <button
            onClick={handleFinish}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors bg-blue-600 hover:bg-blue-500`}
          >
            Finish
          </button>
          {editingId && (
            <p className='text-sm text-yellow-400 text-center mt-2'>
              **รายการที่แก้ไขอยู่จะถูกบันทึกโดยอัตโนมัติ**
            </p>
          )}
        </div>

      </div>

      {/* ============ แผงด้านขวา (Program Manager) ============ */}
      <div className="flex-1 lg:grow-2">
        <h1 className="text-3xl font-bold mb-6">Your Program</h1>

        {/* 1. แถวสำหรับ "Add Exercise" */}
        <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3 mb-4">
          <select
            value={newMuscleGroup}
            onChange={handleMuscleGroupChange}
            className="bg-gray-700 p-2 rounded text-white flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {muscleGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>

          <select
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            className="bg-gray-700 p-2 rounded w-1/3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!exerciseLists[newMuscleGroup] || exerciseLists[newMuscleGroup].length === 0}
          >
            <option value="">{exerciseLists[newMuscleGroup]?.length > 0 ? 'เลือกท่า...' : '(ไม่มีท่า)'}</option>
            {(exerciseLists[newMuscleGroup] || []).map((exercise) => (
              <option key={exercise} value={exercise}>{exercise}</option>
            ))}
          </select>

          <input value={newSets} onChange={(e) => setNewSets(e.target.value)} type="number" className="bg-gray-700 p-2 rounded w-[70px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sets" />
          <input value={newReps} onChange={(e) => setNewReps(e.target.value)} className="bg-gray-700 p-2 rounded w-[90px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Reps" />
          <input value={newWeight} onChange={(e) => setNewWeight(e.target.value)} type="number" className="bg-gray-700 p-2 rounded w-[70px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kg" />

          <button onClick={handleAddExercise} className="text-blue-500 hover:text-blue-400 p-2" title="Add exercise">
            <PlusCircle size={24} />
          </button>
        </div>

        {/* 2. รายการ Accordion ของแต่ละวัน */}
        <div className="space-y-3">
          {loading ? (<div className="text-gray-400">Loading...</div>) : (
            days.map((day) => {
              const exercisesForDay = (groupedExercises[day] || []).sort((a, b) => a.id - b.id);
              const isDayOpen = openDay === day;

              return (
                <div key={day} className="bg-gray-800 rounded-lg">
                  {/* === หัวข้อ Accordion === */}
                  <button
                    onClick={() => setOpenDay(isDayOpen ? null : day)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-700 rounded-lg"
                  >
                    <span className="text-xl font-bold text-white">Day {day}</span>
                    <ChevronDown
                      className={`text-white transition-transform ${isDayOpen ? 'rotate-180' : ''}`}
                      size={24}
                    />
                  </button>

                  {/* === เนื้อหา (จะแสดงเมื่อ isDayOpen) === */}
                  {isDayOpen && (
                    <div className="p-4 space-y-3 border-t border-gray-700">

                      {/* 2.1 รายการท่าออกกำลังกาย */}
                      {exercisesForDay.length > 0 ? (
                        exercisesForDay.map((ex) => {
                          const isEditing = editingId === ex.id;

                          if (ex.exercise_name === REST_DAY_NAME) {
                            return (
                              <div key={ex.id} className="bg-gray-900 p-3 rounded-lg flex items-center justify-between border border-gray-700">
                                <span className="font-semibold text-gray-400">{REST_DAY_NAME}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(ex.id); }} className="text-red-500 hover:text-red-400 p-2" title="Delete rest day">
                                  <XCircle size={24} />
                                </button>
                              </div>
                            );
                          }

                          // [แก้ไข] ปรับปรุงขนาดของ input/select ในโหมดแก้ไขให้ตรงกับโหมดดู
                          return (
                            <div
                              key={ex.id}
                              onClick={() => handleRowClick(ex)}
                              className={`bg-gray-900 p-3 rounded-lg flex items-center gap-3 border ${isEditing ? 'border-blue-500' : 'border-gray-700'
                                } ${isEditing ? '' : 'cursor-pointer hover:border-blue-500'}`}
                            >
                              {/* Muscle Group */}
                              <select
                                name="muscle_group"
                                value={isEditing && editFormData ? editFormData.muscle_group : ex.muscle_group}
                                disabled={!isEditing}
                                onChange={handleEditFormChange}
                                className={`p-2 rounded text-white flex-1 ${isEditing ? 'bg-gray-600' : 'bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              >
                                {isEditing ? (
                                  muscleGroups.filter(g => g.id !== 'rest').map((group) => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                  ))
                                ) : (
                                  <option value={ex.muscle_group}>
                                    {muscleGroups.find(g => g.id === ex.muscle_group)?.name || ex.muscle_group}
                                  </option>
                                )}
                              </select>

                              {/* Exercise Name */}
                              <select
                                name="exercise_name"
                                value={isEditing && editFormData ? editFormData.exercise_name : ex.exercise_name}
                                disabled={!isEditing}
                                onChange={handleEditFormChange}
                                className={`p-2 rounded w-1/3 text-white ${isEditing ? 'bg-gray-600' : 'bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              >
                                {isEditing ? (
                                  <>
                                    <option value="">
                                      {exerciseLists[editFormData?.muscle_group || '']?.length > 0 ? 'เลือกท่า...' : '(ไม่มีท่า)'}
                                    </option>
                                    {(exerciseLists[editFormData?.muscle_group || ''] || []).map((exercise) => (
                                      <option key={exercise} value={exercise}>{exercise}</option>
                                    ))}
                                  </>
                                ) : (
                                  <option value={ex.exercise_name}>{ex.exercise_name}</option>
                                )}
                              </select>

                              {/* Sets / Reps / Weight */}
                              <input name="sets" value={isEditing && editFormData ? editFormData.sets : ex.sets} disabled={!isEditing} onChange={handleEditFormChange} type="number" className={`p-2 rounded w-[70px] text-white ${isEditing ? 'bg-gray-600' : 'bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                              <input name="reps" value={isEditing && editFormData ? editFormData.reps : ex.reps} disabled={!isEditing} onChange={handleEditFormChange} className={`p-2 rounded w-[90px] text-white ${isEditing ? 'bg-gray-600' : 'bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                              <input name="weight_kg" value={isEditing && editFormData ? editFormData.weight_kg : ex.weight_kg} disabled={!isEditing} onChange={handleEditFormChange} type="number" className={`p-2 rounded w-[70px] text-white ${isEditing ? 'bg-gray-600' : 'bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />

                              <button onClick={(e) => { e.stopPropagation(); handleDelete(ex.id); }} className="text-red-500 hover:text-red-400 p-2" title="Delete exercise">
                                <XCircle size={24} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-center">(ยังไม่มีโปรแกรมสำหรับวันนี้)</p>
                      )}

                      {/* 2.2 ปุ่ม RestDay */}
                      <button
                        onClick={() => handleAddRestDay(day)}
                        className="w-full py-2 mt-2 rounded-md font-semibold bg-red-800 text-white hover:bg-red-700"
                      >
                        Set as Rest Day
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}