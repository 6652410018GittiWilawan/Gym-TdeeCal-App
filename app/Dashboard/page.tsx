"use client";
//อันนี้ทำอันสุดท้ายเพราะต้องเอาหลายๆข้อมูลมารวมกัน
import React, { useState, useEffect } from 'react';
// --- เพิ่ม import สำหรับกราฟ ---
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts'; // ใช้ recharts สำหรับกราฟ npm install recharts

// --- Database Connection ---
// คุณอาจจะต้อง import supabase client ของคุณที่นี่
// ตัวอย่าง: import { supabase } from '@/utils/supabaseClient';
// ---

// Interface สำหรับข้อมูล Progress กราฟ 5 เหลี่ยม
interface SkillProgress {
  subject: string;
  value: number; // ค่าพลัง (เช่น 1-100)
}

// Interface สำหรับข้อมูล Program
interface ProgramItem {
  exercise: string;
  sets: number;
  reps: string;
  weight: number; // <--- เพิ่มน้ำหนัก (Weight)
}

// Interface สำหรับข้อมูลผู้ใช้ (เพื่อให้ Type ปลอดภัย)
interface UserProfile {
  name: string;
  age: number;
  gender: string;
  tdee: number;
  progress: string; 
  profilePicUrl: string; 
  mealPerDay: { foodName: string; calories: number; }[];
  // --- อันนี้ใส่Database nakub ---
  program: ProgramItem[]; // <--- อัปเดต Interface
  skillProgress: SkillProgress[]; 
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // --- อันนี้ใส่Database nakub ---
    // โหลดข้อมูลผู้ใช้จาก Database เมื่อ Component ถูก Render ครั้งแรก
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');

        // จำลองการดึงข้อมูล (เพื่อแสดง UI)
        await new Promise(resolve => setTimeout(resolve, 1500)); // จำลองเวลาโหลด
        const mockData: UserProfile = {
          name: "สมศักดิ์",
          age: 28,
          gender: "ชาย",
          tdee: 2200, 
          progress: "ลดไขมัน 5kg",
          profilePicUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Pic",
          mealPerDay: [
            { foodName: "อกไก่ย่าง", calories: 300 },
            { foodName: "ข้าวกล้อง", calories: 200 },
            { foodName: "สลัดผัก", calories: 150 },
            { foodName: "เวย์โปรตีน", calories: 120 },
            { foodName: "ไข่ต้ม 2 ฟอง", calories: 140 },
            { foodName: "ปลาซาบะย่าง", calories: 250 },
          ],
          // --- อันนี้ใส่Database nakub --- (ข้อมูล Program จำลอง อัปเดตแล้ว)
          program: [
            { exercise: "Bench Press", sets: 3, reps: "8-12", weight: 60 },
            { exercise: "Squat", sets: 3, reps: "10-15", weight: 80 },
            { exercise: "Deadlift", sets: 1, reps: "5", weight: 100 },
            { exercise: "Lat Pulldown", sets: 3, reps: "10-12", weight: 40 },
          ],
          // --- อันนี้ใส่Database nakub --- (ข้อมูลกราฟ 5 เหลี่ยมจำลอง)
          skillProgress: [
            { subject: "Strength", value: 80 },
            { subject: "Endurance", value: 65 },
            { subject: "Mobility", value: 70 },
            { subject: "Consistency", value: 90 },
            { subject: "Nutrition", value: 75 },
          ]
        };
        setUserProfile(mockData);

      } catch (err: any) {
        console.error("Error fetching user profile:", err.message);
        setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // Run only once on component mount

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

  // --- คำนวณแคลอรี่รวม ---
  const totalCalories = userProfile.mealPerDay.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header - ด้านบนสุด (เหมือนเดิม) */}
      <header className="bg-gray-900 p-4 shadow-lg flex justify-end items-center">
        <nav className="flex space-x-4">
          <a href="/Tdeecal" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Tdee calculator</a>
          <a href="/Program" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Program</a>
          <a href="/Addfood" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Add Food</a>
          <a href="/UpdateProfile" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Update Profile</a>
        </nav>
      </header>

      {/* Main Content Area - แบ่งเป็น Sidebar และ Main Panel */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - ด้านซ้าย (ข้อมูลผู้ใช้ + กราฟ) */}
        <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6">
          {/* รูปโปรไฟล์ */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              <img src={userProfile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white">{userProfile.name}</h2>
          </div>

          {/* ข้อมูลผู้ใช้ */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Age:</span>
              <span>{userProfile.age}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Gender:</span>
              <span>{userProfile.gender}</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Tdee:</span>
              <span className="text-blue-400">{userProfile.tdee} kcal</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">{userProfile.progress}</span>
            </div>
          </div>
          
          {/* --- กราฟ 5 เหลี่ยม (Radar Chart) --- */}
          <div className="mt-6 border-t border-gray-700 pt-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Your Progress</h3>
            {/* --- อันนี้ใส่Database nakub --- */}
            {/* ข้อมูล 'skillProgress' ด้านล่างนี้ จะถูกดึงและคำนวณมาจาก Database */}
            <div className="w-full h-64"> 
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="80%" 
                  data={userProfile.skillProgress}
                >
                  <PolarGrid stroke="#4B5563" /> 
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#D1D5DB', fontSize: 12 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name={userProfile.name} 
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

        {/* Main Panel - (ถูกแบ่งเป็น 2 ส่วนย่อย: Program และ MealPerDay) */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* ส่วน Program (ตรงกลาง) */}
          <div className="flex-1 p-6 bg-gray-950 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Your Program</h1>
            <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-800 min-h-[70vh] space-y-4">
              
              {/* --- อันนี้ใส่Database nakub --- */}
              {/* ข้อมูล Program ด้านล่างนี้จะถูกดึงมาจาก Database ของผู้ใช้ */}
              
              {/* --- ส่วนหัวตาราง (เพิ่มใหม่) --- */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-right">Sets x Reps</span>
              </div>

              {/* --- รายการท่าออกกำลังกาย (อัปเดตแล้ว) --- */}
              {userProfile.program.map((item, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-md grid grid-cols-3 items-center gap-4">
                  {/* Column 1: Exercise Name */}
                  <span className="text-lg text-white font-semibold col-span-1">{item.exercise}</span>
                  
                  {/* Column 2: Weight */}
                  <span className="text-lg text-blue-300 text-center font-medium col-span-1">
                    {item.weight} kg
                  </span>

                  {/* Column 3: Sets x Reps */}
                  <span className="text-lg text-gray-300 text-right col-span-1">
                    {item.sets} sets x {item.reps} reps
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ส่วน Meal Per Day (ขวาสุด) - ย้ายมาจาก Sidebar */}
          <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">
              <h3 className="text-xl font-bold text-white mb-4">Meal Per Day</h3>
              
              {/* พื้นที่เลื่อนได้ */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                {/* --- อันนี้ใส่Database nakub --- */}
                {/* ข้อมูลมื้ออาหารนี้ (mealPerDay) จะถูกดึงมาจากตาราง 'foods' หรือ 'meals' ที่ผู้ใช้บันทึก (จากหน้า Add Food) */}
                {userProfile.mealPerDay.map((meal, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                    <span className="text-gray-200">{meal.foodName}</span>
                    <span className="text-blue-300 font-medium">{meal.calories} kcal</span>
                  </div>
                ))}
              </div>

              {/* Total Calories */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
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

