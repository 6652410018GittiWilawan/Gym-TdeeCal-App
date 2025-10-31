"use client";

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
// [เพิ่ม] Import Supabase Client
import { supabase } from '../../lib/supabaseClient'; // ⚠️ ตรวจสอบว่า Path นี้ถูกต้องนะครับ

export default function Login() {
  // ใช้ State เพื่อเก็บค่า email และ password (เหมือนเดิม)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // สำหรับแสดงข้อผิดพลาด
  const [loading, setLoading] = useState(false); // สำหรับสถานะกำลังโหลด

  // [แก้ไข] ฟังก์ชันนี้ถูกเปลี่ยนเป็น async และเชื่อมต่อ Supabase
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // ป้องกันหน้าเว็บโหลดใหม่
    setLoading(true);
    setError('');

    // --- [แก้ไข] เริ่มส่วนเชื่อมต่อ Supabase Database ---
    try {
      // ใช้ Supabase เพื่อล็อกอินด้วย email และ password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // 1. ตรวจสอบว่ามี Error จากการ Auth หรือไม่
      if (authError) {  
        // ถ้ามี Error (เช่น ใส่รหัสผิด) ให้โยน Error ไปที่ catch
        throw new Error(authError.message);
      }

      // 2. ตรวจสอบว่าได้ข้อมูล User กลับมาหรือไม่
      if (authData.user) {
        console.log("Login successful (Supabase)");
        alert("เข้าสู่ระบบสำเร็จ!");
        
        // พาไปหน้าหลักหลังล็อกอิน
        window.location.href = '/Dashboard'; // <--- พาไปหน้าหลัก
      } else {
        // กันเหนียว กรณีที่ไม่น่าจะเกิดขึ้น
        throw new Error("ไม่พบข้อมูลผู้ใช้หลังการล็อกอิน");
      }

    } catch (err: unknown) {
      let errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"; // ข้อความเริ่มต้น

      if (err instanceof Error) {
        // Supabase มักจะคืนค่า "Invalid login credentials"
        if (err.message.includes("Invalid login credentials")) {
          errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        } else {
          errorMessage = err.message; // แสดง Error อื่นๆ ถ้ามี
        }
      }
      
      console.error("Login Error:", errorMessage);
      setError(errorMessage); // แสดง Error บนหน้าจอ

    } finally {
      setLoading(false); // หยุด Loading เสมอ
    }
  };

  return (
    // 1. พื้นหลังหลัก สีนี้แหละกิตติชอบ
    <div
      className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* 2. เอฟเฟกต์แสงสีน้ำเงินฟุ้งๆ อันนี้ให้bot เจนแล้วมันโดนใจ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <div className="w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-25"></div>
      </div>

      {/* 3. ไอกรอบๆ Login อะ ปุมาณนั้นๆ  */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8">
        
        {/* หัวข้อแบบเท่ๆเลยอันนี้ใส่มั่วๆแม่งเท่เฉยมีคำคงคำคมนึกว่าสุนทรภู่54353455445545*/}
        <h1 className="text-4xl font-bold text-center text-white mb-4">
          SAU <span className="text-blue-500">Gymbro</span>
        </h1>
        <p className="text-center text-gray-300 mb-8">
          เข้าสู่ระบบเพื่อเริ่มต้นเส้นทางของคุณ
        </p>

        {/* ฟอร์ม Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ช่องกรอก Email */}
          <div className="relative">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              อีเมล
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />{/* {ไอคอนอีเมล} */}
              </span>
              <input
                id="email"
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่อง Password */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                รหัสผ่าน
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" /> {/* {ไอคอนล็อก} */}
              </span>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* แสดงข้อผิดพลาด (ถ้ามี) */}
          {error && (
            <div className="text-red-400 text-center text-sm">
              {error}
            </div>
          )}

          {/* ปุ่ม Login */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
            </button>
          </div>

          {/* ปุ่ม Return (เพิ่มเข้ามา) */}
          <div className="mt-3">
           <Link href="/" passHref>
              <button
                type="button" // กลับไปหน้าหลัก
                className="block w-full text-center text-gray-300 bg-transparent border border-gray-600 hover:bg-gray-700 font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300"
              >
                กลับหน้าหลัก
              </button>
            </Link>
          </div>
          
        </form>
            
        
        {/* ไปหน้าสมัครสมาชิก */}
        <p className="text-center text-gray-400 text-sm mt-8">
          ยังไม่มีบัญชี?{' '}
          <a
            href="/Register"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            สมัครสมาชิกที่นี่
          </a>
        </p>
        
      </div>
      
    </div>
  );
};