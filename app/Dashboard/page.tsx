"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Import component ของ Recharts สำหรับทำกราฟ
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import hopic from './images/hopic.png'
import { Dumbbell } from 'lucide-react';

// กำหนด type สำหรับข้อมูลโปรไฟล์
interface UserProfile {
  full_name: string;
  gender: string;
  profile_pic_url: string;
  age: number;
  tdee: number;
  user_weight: number;
  user_height: number;
}

//กำหนด type สำหรับข้อมูลอาหาร
interface FoodData {
  id: number;
  food_name: string;
  calories: number;
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // เพิ่ม State สำหรับเก็บข้อมูลอาหาร
  const [foodLogs, setFoodLogs] = useState<FoodData[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        // ดึงข้อมูล user ที่ login อยู่
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(authError?.message || "ไม่พบผู้ใช้งาน กรุณาล็อกอิน");
        }

        // ใช้ Promise.all เพื่อดึงข้อมูลโปรไฟล์และอาหารพร้อมกัน
        const [profileResponse, foodResponse] = await Promise.all([
          // ดึง Profile
          supabase
            .from('profiles')
            .select('full_name, gender, profile_pic_url, age, tdee, user_weight, user_height')
            .eq('id', user.id)
            .maybeSingle(),
            
          // ดึง Food Log ของ "วันนี้"
          supabase
            .from('food_log')
            .select('id, food_name, calories')
            .eq('user_id', user.id)
            .eq('eaten_on', new Date().toISOString().split('T')[0])
        ]);

        // ประมวลผล Profile
        if (profileResponse.error) {
          throw new Error(`Profile Error: ${profileResponse.error.message}`);
        }
        if (profileResponse.data) {
          setUserProfile(profileResponse.data);
        }
        
        // เพิ่มส่วนประมวลผล Food Log
        if (foodResponse.error) {
          throw new Error(`Food Log Error: ${foodResponse.error.message}`);
        }
        if (foodResponse.data) {
          // คำนวณแคลอรีรวม
          const calculatedTotal = foodResponse.data.reduce(
            (sum, item) => sum + item.calories,
            0
          );
          // อัปเดต State
          setFoodLogs(foodResponse.data);
          setTotalCalories(calculatedTotal);
        }

      } catch (err: any) {
        console.error("Error fetching data:", err.message);
        setError("ไม่สามารถโหลดข้อมูล Dashboard ได้: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData()
  }, []);

  // loading. error, not found

  // แสดงหน้า Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-blue-400 text-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        กำลังโหลด Dashboard...
      </div>
    );
  }

  // แสดงหน้า Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-xl">
        Error: {error}
      </div>
    );
  }

  // แสดงผลกรณีไม่พบข้อมูลโปรไฟล์
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400 text-xl">
        ไม่พบข้อมูลผู้ใช้
      </div>
    );
  }

  // UI หลักของ Dashboard
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header และเมนูนำทาง (เหมือนเดิม) */}
      <header className="bg-gray-900 p-4 shadow-lg flex justify-between items-center">
        <div className="flex-shrink-0">
          <a href="#" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-blue-500" />
            <span className="text-white text-2xl font-bold">SAU Gymbro</span>
          </a>
        </div>
        <nav className="flex space-x-4">
          <a href="/Tdeecal" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Tdee calculator</a>
          <a href="/Program" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Program</a>
          <a href="/Addfood" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Add Food</a>
          <a href="/UpdateProfile" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Update Profile</a>
        </nav>
      </header>

      {/* ส่วนเนื้อหาหลัก (แบ่งเป็น 3 คอลัมน์) */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar ซ้าย: ข้อมูลโปรไฟล์และกราฟ (เหมือนเดิม) */}
        <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6">
          {/* แสดงรูปโปรไฟล์และชื่อ */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              <img src={userProfile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white">{userProfile.full_name}</h2>
          </div>

          {/* แสดงข้อมูลผู้ใช้ (เหมือนเดิม) */}
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
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Tdee:</span>
              <span className="text-blue-400">{userProfile.tdee} kcal</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">-</span>
            </div>
          </div>

          {/* กราฟ Radar Chart (เหมือนเดิม) */}
          <div className="mt-6 border-t border-gray-700 pt-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Your Progress</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={[]} 
                >
                  <PolarGrid stroke="#4B5563" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#D1D5DB', fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Progress"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>

        {/* Panel กลาง: โปรแกรมออกกำลังกาย (เหมือนเดิม) */}
        <main className="flex-1 flex overflow-hidden">

          <div className="flex-1 p-6 bg-gray-950 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Your Program</h1>
            <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-800 min-h-[70vh] space-y-4">

              {/* หัวตารางโปรแกรม */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-right">Sets x Reps</span>
              </div>

              {/* รายการท่าออกกำลังกาย (ยังว่าง) */}
              <div className="text-center text-gray-500 pt-10">
                (ยังไม่มีโปรแกรมที่บันทึกไว้)
              </div>
              {/* TODO: วน loop แสดงข้อมูลจริงตรงนี้ */}

            </div>
          </div>

          {/* รายการอาหาร */}
          <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">
              <h3 className="text-xl font-bold text-white mb-4">Meal Per Day</h3>

              {/* พื้นที่สำหรับเลื่อนดูรายการอาหาร */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-2">

                {/* ส่วนวน Loop ข้อมูลอาหาร */}
                {foodLogs.length > 0 ? (
                  foodLogs.map((food) => (
                    <div 
                      key={food.id} 
                      className="bg-gray-800 p-3 rounded-md flex justify-between items-center shadow"
                    >
                      <span className="text-gray-200 truncate" title={food.food_name}>
                        {food.food_name}
                      </span>
                      <span className="text-blue-400 font-semibold flex-shrink-0 ml-2">
                        {food.calories} kcal
                      </span>
                    </div>
                  ))
                ) : (
                  // ถ้าไม่มีข้อมูล
                  <div className="text-center text-gray-500 pt-10">
                    (ยังไม่มีข้อมูลอาหารสำหรับวันนี้)
                  </div>
                )}

              </div>

              {/* สรุปแคลอรีรวม */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  {/* แสดงผลรวมแคลอรีจาก State */}
                  <span className="text-blue-400">{totalCalories} kcal</span>
                </div>
              </div>
            </div>
          </aside>

        </main>
      </div>
    </div>
  );
}