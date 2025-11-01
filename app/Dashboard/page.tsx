"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; 
// --- 1. เพิ่ม Import สำหรับกราฟ (Recharts) ---
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

// --- (ตัวอย่าง) สร้าง Client ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- จบตัวอย่าง ---


// --- Interface (เหมือนเดิม) ---
// เราดึงแค่ 3 อย่างนี้จาก DB
interface UserProfile {
  full_name: string;
  gender: string;
  profile_pic_url: string; 
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- useEffect (เหมือนเดิมทุกประการ) ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(authError?.message || "ไม่พบผู้ใช้งาน กรุณาล็อกอิน");
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, gender, profile_pic_url') 
          .eq('id', user.id)
          .maybeSingle(); 

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (data) {
          setUserProfile(data);
        } 
        // ถ้าไม่เจอ data (เป็น null) UI จะแสดง "ไม่พบข้อมูลผู้ใช้" (ถูกต้องแล้ว)

      } catch (err: any) {
        console.error("Error fetching user profile:", err.message);
        setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []); 

  // --- Loading, Error, !userProfile (เหมือนเดิม) ---
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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header (เหมือนเดิม) */}
      <header className="bg-gray-900 p-4 shadow-lg flex justify-end items-center">
        <nav className="flex space-x-4">
          <a href="/Tdeecal" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Tdee calculator</a>
          <a href="/Program" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Program</a>
          <a href="/Addfood" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Add Food</a>
          <a href="/UpdateProfile" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Update Profile</a>
        </nav>
      </header>

      {/* Main Content Area - (เหมือนเดิม) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* === 2. Sidebar (ซ้าย) - เพิ่มข้อมูล placeholder === */}
        <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6">
          {/* รูปโปรไฟล์ (ดึงข้อมูลจริง) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              <img src={userProfile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white">{userProfile.full_name}</h2>
          </div>

          {/* ข้อมูลผู้ใช้ (ดึงข้อมูลจริง + placeholder) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Gender:</span>
              <span>{userProfile.gender}</span>
            </div>
            {/* --- เพิ่มส่วนนี้กลับมา แต่ใช้ค่า placeholder --- */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Age:</span>
              <span>-</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Tdee:</span>
              <span className="text-blue-400">- kcal</span>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">-</span>
            </div>
            {/* --- สิ้นสุดส่วน placeholder --- */}
          </div>
          
          {/* --- กราฟ 5 เหลี่ยม (Radar Chart) - เพิ่มกลับมา --- */}
          <div className="mt-6 border-t border-gray-700 pt-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Your Progress</h3>
            <div className="w-full h-64"> 
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="80%" 
                  data={[]} // <--- ใช้ข้อมูลว่าง
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

        {/* === 3. Main Panel (กลาง) - เพิ่มตารางกลับมา === */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* ส่วน Program (ตรงกลาง) */}
          <div className="flex-1 p-6 bg-gray-950 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Your Program</h1>
            <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-800 min-h-[70vh] space-y-4">
              
              {/* --- ส่วนหัวตาราง (มีแค่หัว) --- */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-right">Sets x Reps</span>
              </div>

              {/* --- รายการท่าออกกำลังกาย (ว่าง) --- */}
              <div className="text-center text-gray-500 pt-10">
                (ยังไม่มีโปรแกรมที่บันทึกไว้)
              </div>
              {/* เราจะวน loop ข้อมูลจริงตรงนี้ในอนาคต */}
              
            </div>
          </div>

          {/* === 4. Meal Per Day (ขวา) - เพิ่มกลับมา === */}
          <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">
              <h3 className="text-xl font-bold text-white mb-4">Meal Per Day</h3>
              
              {/* พื้นที่เลื่อนได้ */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                
                {/* --- รายการอาหาร (ว่าง) --- */}
                <div className="text-center text-gray-500 pt-10">
                  (ยังไม่มีข้อมูลอาหารสำหรับวันนี้)
                </div>
                {/* เราจะวน loop ข้อมูลจริงตรงนี้ในอนาคต */}

              </div>

              {/* Total Calories (แสดง 0) */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-400">0 kcal</span>
                </div>
              </div>
            </div>
          </aside>
          
        </main>
      </div>
    </div>
  );
}