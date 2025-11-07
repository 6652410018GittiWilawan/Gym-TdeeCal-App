"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// อัปเดตไอคอนที่ import
import { Utensils, Flame, Calendar, Beef, Wheat, Droplet } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Addfood() {
  const router = useRouter();

  // เพิ่ม State สำหรับ macros
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState(""); // <-- เพิ่ม
  const [carbs, setCarbs] = useState("");     // <-- เพิ่ม
  const [fat, setFat] = useState("");         // <-- เพิ่ม
  
  const [eatenOn, setEatenOn] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = () => {
    router.push('/Dashboard'); 
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // อัปเดตการตรวจสอบข้อมูล
    if (!foodName || !calories || !protein || !carbs || !fat || !eatenOn) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    
    // แปลงค่าทั้งหมดเป็นตัวเลข
    const caloriesValue = parseInt(calories, 10);
    const proteinValue = parseInt(protein, 10); // <-- เพิ่ม
    const carbsValue = parseInt(carbs, 10);   // <-- เพิ่ม
    const fatValue = parseInt(fat, 10);       // <-- เพิ่ม

    // อัปเดตการตรวจสอบตัวเลข
    if (isNaN(caloriesValue) || caloriesValue < 0 ||
        isNaN(proteinValue) || proteinValue < 0 ||
        isNaN(carbsValue)   || carbsValue < 0 ||
        isNaN(fatValue)     || fatValue < 0) {
      setError("กรุณากรอกแคลอรี, โปรตีน, คาร์บ, และไขมันเป็นตัวเลขที่ถูกต้อง");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("ไม่พบผู้ใช้งาน กรุณาล็อกอินก่อนบันทึก");
      }

      // อัปเดต Object ที่จะ insert
      const newFoodLog = {
        user_id: user.id,
        food_name: foodName,
        calories: caloriesValue,
        protein: proteinValue, // <-- เพิ่ม
        carbs: carbsValue,     // <-- เพิ่ม
        fat: fatValue,         // <-- เพิ่ม
        eaten_on: eatenOn,
      };

      const { error: insertError } = await supabase
        .from("food_log")
        .insert(newFoodLog);

      if (insertError) {
        throw new Error(`Insert Error: ${insertError.message}`);
      }
      
      alert("บันทึกข้อมูลอาหารเรียบร้อย!");
      
      router.push('/Dashboard');

    } catch (err: unknown) {
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* ... (ส่วนเอฟเฟกต์แสง ไม่เปลี่ยนแปลง) ... */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <div className="w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-25"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8">
        
        <h1 className="text-4xl font-bold text-center text-white mb-4">
          SAU <span className="text-blue-500">Add Food</span>
        </h1>
        <p className="text-center text-gray-300 mb-8">
          บันทึกมื้ออาหารของคุณ
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ช่องกรอก ชื่ออาหาร */}
          <div>
            <label
              htmlFor="food_name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              ชื่ออาหาร
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Utensils className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="food_name"
                type="text"
                placeholder="เช่น ข้าวมันไก่"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่องกรอก แคลอรี */}
          <div>
            <label
              htmlFor="calories"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              แคลอรี (kcal)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Flame className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="calories"
                type="number"
                placeholder="เช่น 500"
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
          </div>

          {/* === บล็อกใหม่ที่เพิ่มเข้ามา === */}

          {/* ช่องกรอก โปรตีน */}
          <div>
            <label
              htmlFor="protein"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              โปรตีน (g)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Beef className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="protein"
                type="number"
                placeholder="เช่น 30"
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่องกรอก คาร์โบไฮเดรต */}
          <div>
            <label
              htmlFor="carbs"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              คาร์โบไฮเดรต (g)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Wheat className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="carbs"
                type="number"
                placeholder="เช่น 50"
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่องกรอก ไขมัน */}
          <div>
            <label
              htmlFor="fat"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              ไขมัน (g)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Droplet className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="fat"
                type="number"
                placeholder="เช่น 15"
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* === จบส่วนที่เพิ่ม === */}


          {/* ... (ส่วนที่เหลือ: error, buttons ไม่เปลี่ยนแปลง) ... */}
          {error && (
            <div className="text-red-400 text-center text-sm py-2">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="w-full flex items-center justify-center bg-gray-600 text-white hover:bg-gray-700 font-bold px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {loading ? (
                'กำลังบันทึก...'
              ) : (
                <>
                  บันทึก
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};