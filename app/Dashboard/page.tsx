"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
// Import component ของ Recharts สำหรับทำกราฟ
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import hopic from './images/hopic.png'
import { Dumbbell, XCircle, PlusCircle, Search } from 'lucide-react';

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

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // State สำหรับ Food Log (ของวันนี้)
  const [foodLogs, setFoodLogs] = useState<FoodData[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  
  // [ใหม่] State สำหรับเก็บยอดรวมสารอาหารที่กินแล้ว
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);

  // State สำหรับ Search Bar (ในหน้าหลัก)
  const [searchQuery, setSearchQuery] = useState('');

  // State สำหรับ Modal เพิ่มอาหาร
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodHistory, setFoodHistory] = useState<FoodData[]>([]); // เก็บประวัติอาหารทั้งหมด
  const [modalSearch, setModalSearch] = useState(''); // เก็บคำค้นหา *ใน* Modal
  const [modalLoading, setModalLoading] = useState(false);

  // State สำหรับ Loading/Error ของหน้า
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // [Memo 1] สำหรับกรองอาหารใน *หน้าหลัก* (ตาม searchQuery)
  const filteredFoodLogs = useMemo(() => {
    if (!searchQuery) {
      return foodLogs;
    }
    return foodLogs.filter((food) =>
      (food.food_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foodLogs, searchQuery]);

  // [Memo 2] สำหรับกรองอาหารใน *Modal* (ตาม modalSearch)
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

  const handleRemoveFoodItem = (id: number) => {
    const itemToRemove = foodLogs.find((item) => item.id === id);
    if (!itemToRemove) return;
    
    // อัปเดตยอดรวม
    setTotalCalories((currentTotal) => currentTotal - (itemToRemove.calories || 0));
    setTotalProtein((currentTotal) => currentTotal - (itemToRemove.protein || 0));
    setTotalCarbs((currentTotal) => currentTotal - (itemToRemove.carbs || 0));
    setTotalFat((currentTotal) => currentTotal - (itemToRemove.fat || 0));

    setFoodLogs((currentLogs) =>
      currentLogs.filter((item) => item.id !== id)
    );
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

        const [profileResponse, foodResponse] = await Promise.all([
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
            .order('id', { ascending: false })
        ]);

        if (profileResponse.error) throw new Error(`Profile Error: ${profileResponse.error.message}`);
        if (profileResponse.data) setUserProfile(profileResponse.data);
        
        if (foodResponse.error) throw new Error(`Food Log Error: ${foodResponse.error.message}`);
        
        if (foodResponse.data) {
          // คำนวณยอดรวมแคลอรี
          const calculatedTotal = foodResponse.data.reduce(
            (sum, item) => sum + (item.calories || 0),
            0
          );
          
          // [ใหม่] คำนวณยอดรวมสารอาหาร
          const calculatedProtein = foodResponse.data.reduce(
            (sum, item) => sum + (item.protein || 0), 0
          );
          const calculatedCarbs = foodResponse.data.reduce(
            (sum, item) => sum + (item.carbs || 0), 0
          );
          const calculatedFat = foodResponse.data.reduce(
            (sum, item) => sum + (item.fat || 0), 0
          );

          // อัปเดต State
          setFoodLogs(foodResponse.data);
          setTotalCalories(calculatedTotal);
          setTotalProtein(calculatedProtein);
          setTotalCarbs(calculatedCarbs);
          setTotalFat(calculatedFat);
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
  
  // [สำคัญ] ต้องมี check นี้ก่อน เพื่อให้ userProfile.protein_g ไม่เป็น null
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-400 text-xl">
        ไม่พบข้อมูลผู้ใช้
      </div>
    );
  }

  // [ใหม่] คำนวณส่วนต่าง (วางไว้ก่อน return)
  const remainingProtein = (userProfile.protein_g || 0) - totalProtein;
  const remainingCarbs = (userProfile.carb_g || 0) - totalCarbs;
  const remainingFat = (userProfile.fat_g || 0) - totalFat;


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
          <a href="/Tdeecal" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Tdee calculator</a>
          <a href="/Program" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Program</a>
          <a href="/Addfood" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Add Food</a>
          <a href="/UpdateProfile" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">Update Profile</a>
        </nav>
      </header>

      {/* ส่วนเนื้อหาหลัก */}
      <div className="flex flex-1 overflow-hidden">

        {/* ... (ส่วน Sidebar ซ้าย: Profile) ... */}
        <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6">
          {/* แสดงรูปโปรไฟล์และชื่อ */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
              <img src={userProfile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white">{userProfile.full_name}</h2>
          </div>

          {/* แสดงข้อมูลผู้ใช้  */}
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
            
            {/* แสดงสารอาหาร (แบบคำนวณส่วนต่าง) */}
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
            {/* แสดง Progress */}
            <div className="flex justify-between items-center text-gray-300 text-lg">
              <span className="font-semibold">Progress:</span>
              <span className="text-green-400">-</span>
            </div>
          </div>

          {/* ... (ส่วน Radar Chart) ... */}
          <div className="mt-6 border-t border-gray-700 pt-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Your Progress</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[]}>
                  <PolarGrid stroke="#4B5563" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#D1D5DB', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Progress" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>

        {/* ... (Panel กลาง: Your Program) ... */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 bg-gray-950 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Your Program</h1>
            <div className="bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-800 min-h-[70vh] space-y-4">
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-gray-400 font-semibold border-b border-gray-700">
                <span className="col-span-1">Exercise</span>
                <span className="col-span-1 text-center">Weight</span>
                <span className="col-span-1 text-right">Sets x Reps</span>
              </div>
              <div className="text-center text-gray-500 pt-10">
                (ยังไม่มีโปรแกรมที่บันทึกไว้)
              </div>
            </div>
          </div>

          {/* ... (รายการอาหาร Meal Per Day) ... */}
          <aside className="w-80 bg-gray-900 p-6 shadow-xl flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0">

              {/* Header และ ปุ่ม Add */}
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

              {/* Search Bar (สำหรับกรองหน้าหลัก) */}
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

              {/* พื้นที่สำหรับเลื่อนดูรายการอาหาร */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-2">

                {/* ใช้ filteredFoodLogs */}
                {filteredFoodLogs.length > 0 ? (
                  filteredFoodLogs.map((food) => (
                    <div
                      key={food.id}
                      className="bg-gray-800 p-3 rounded-md flex justify-between items-center shadow"
                    >
                      {/* แสดง P C F */}
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
                      {/* ปุ่มลบ และ แคลอรี */}
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
                  // แสดงผล
                  <div className="text-center text-gray-500 pt-10">
                    {searchQuery
                      ? 'ไม่พบรายการที่ค้นหา'
                      : '(ยังไม่มีข้อมูลอาหารสำหรับวันนี้)'}
                  </div>
                )}
              </div>

              {/* สรุปแคลอรีรวม */}
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

      {/* ... (โค้ดเพิ่มอาหาร) ... */}
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
    </div>
  );
}