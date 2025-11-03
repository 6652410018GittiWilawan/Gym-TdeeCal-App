"use client";



import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

//  เปลี่ยนไอคอน

import { Utensils, Flame, Calendar, } from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';



export default function Addfood() {

  const router = useRouter();



  // เปลี่ยน State ให้ตรงกับฟอร์ม

  const [foodName, setFoodName] = useState("");

  const [calories, setCalories] = useState("");

 

  // ตั้งค่า default วันที่ เป็น วันนี้

  const [eatenOn, setEatenOn] = useState(new Date().toISOString().split('T')[0]);

 

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');



  // ฟังก์ชันสำหรับปุ่ม ยกเลิก

  const handleCancel = () => {

    router.push('/Dashboard'); // กลับไปหน้า Dashboard

  };



  // ฟังก์ชันสำหรับปุ่ม บันทึก

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

   

    // ตรวจสอบข้อมูลเบื้องต้น

    if (!foodName || !calories || !eatenOn) {

      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");

      return;

    }

   

    const caloriesValue = parseInt(calories, 10);

    if (isNaN(caloriesValue) || caloriesValue < 0) {

      setError("กรุณากรอกแคลอรีเป็นตัวเลขที่ถูกต้อง");

      return;

    }



    setLoading(true);

    setError('');



    try {

      // ดึงข้อมูล User ที่กำลังล็อกอิน

      const { data: { user }, error: authError } = await supabase.auth.getUser();



      if (authError || !user) {

        throw new Error("ไม่พบผู้ใช้งาน กรุณาล็อกอินก่อนบันทึก");

      }



      // เตรียมข้อมูลที่จะ insert

      const newFoodLog = {

        user_id: user.id, // เชื่อมโยงกับ user

        food_name: foodName,

        calories: caloriesValue,

        eaten_on: eatenOn,

      };



      // บันทึกข้อมูลลงตาราง food_log

      const { error: insertError } = await supabase

        .from("food_log")

        .insert(newFoodLog);



      if (insertError) {

        throw new Error(`Insert Error: ${insertError.message}`);

      }

     

      alert("บันทึกข้อมูลอาหารเรียบร้อย!");

     

      // กลับไปหน้า Dashboard

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

      {/* เอฟเฟกต์แสง */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">

        <div className="w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-25"></div>

      </div>



      {/* การ์ดสำหรับ Add Food */}

      <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8">

       

        {/* หัวข้อ */}

        <h1 className="text-4xl font-bold text-center text-white mb-4">

          SAU <span className="text-blue-500">Add Food</span>

        </h1>

        <p className="text-center text-gray-300 mb-8">

          บันทึกมื้ออาหารของคุณ

        </p>



        {/* ฟอร์ม Add Food */}

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



          {/* ช่องเลือก วันที่กิน */}

          <div>

            <label

              htmlFor="eaten_on"

              className="block text-sm font-medium text-gray-300 mb-2"

            >

              วันที่กิน

            </label>

            <div className="relative">

              <span className="absolute inset-y-0 left-0 flex items-center pl-3">

                <Calendar className="h-5 w-5 text-gray-400" />

              </span>

              <input

                id="eaten_on"

                type="date"

                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"

                value={eatenOn}

                onChange={(e) => setEatenOn(e.target.value)}

                required

              />

            </div>

          </div>



          {/* แสดงข้อผิดพลาด (ถ้ามี) */}

          {error && (

            <div className="text-red-400 text-center text-sm py-2">

              {error}

            </div>

          )}



          {/*  ปุ่ม 2 ปุ่ม */}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">

            {/* ปุ่มยกเลิก */}

            <button

              type="button"

              onClick={handleCancel}

              disabled={loading}

              className="w-full flex items-center justify-center bg-gray-600 text-white hover:bg-gray-700 font-bold px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"

            >

              ยกเลิก

            </button>



            {/* ปุ่มบันทึก */}

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