"use client";

import React, { useState } from 'react';
// ไอคอน
import { Mail, Lock, User, } from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';

export default function Register() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [image_file, setImageFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ฟังก์ชันจัดการการเปลี่ยนแปลงรูปภาพ (คงเดิม)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    } else {
      setPreviewImage(null);
    }
  };

  //  handleSubmit 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. สร้างบัญชีผู้ใช้ใน Supabase 
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        throw new Error(`Auth Error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("ไม่สามารถสร้างบัญชีผู้ใช้ได้");
      }

      // --- 2. บันทึกรูปภาพไปยัง Supabase Storage ---
      let image_url = "";
      if (image_file) {
        const new_image_file_name = `${authData.user.id}-${Date.now()}-${image_file.name}`;

        // อัปโหลดรูปภาพไปยัง Supabase Storage ชื่อ bucket "user_avatars"
        const { error: uploadError } = await supabase.storage
          .from("user_avatars") //  ตรวจสอบว่าชื่อ bucket นี้ถูกต้อง
          .upload(new_image_file_name, image_file);
        
        if (uploadError) {
          throw new Error(`Upload Error: ${uploadError.message}`);
        } else {
          // get url ของรูปภาพที่อัปโหลด
          const { data } = supabase.storage
            .from("user_avatars")
            .getPublicUrl(new_image_file_name);
          image_url = data.publicUrl;
        }
      }
      // --- สิ้นสุดส่วน Database (Storage) ---

      
      // --- 3. บันทึกข้อมูลลงในตาราง 'profiles' (ตาม schema ที่ให้มา) ---
      const { error: insertError } = await supabase.from("profiles").insert({
        id: authData.user.id,        // <-- [สำคัญ] เชื่อมโยงกับ auth.users.id
        full_name: fullName,       // <-- [แก้ไข] ตรงกับ schema
        gender: gender,            // <-- ตรงกับ schema
        profile_pic_url: image_url, // <-- [แก้ไข] ตรงกับ schema
      });

      if (insertError) {
        throw new Error(`Insert Error: ${insertError.message}`);
      }
      // --- สิ้นสุดส่วน Database (Table) ---
      
      alert("ลงทะเบียนและบันทึกข้อมูลเรียบร้อย!");
      
      // รีเซ็ตฟอร์ม (ย้ายไปไว้ใน try หลังสุด)
      setFullName("");
      setEmail("");
      setPassword("");
      setGender("");
      setPreviewImage(null);
      setImageFile(null);
      
      // เปลี่ยนหน้าไป /login
      window.location.href = '/Login'; 

    // --- ⬇️ [แก้ไข] ตรงนี้ ---
    } catch (err: unknown) { // 1. เปลี่ยนจาก any เป็น unknown
      
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด"; // 2. สร้างข้อความ error เริ่มต้น

      // 3. ตรวจสอบว่า err เป็น Error object จริงๆ หรือไม่
      if (err instanceof Error) {
        errorMessage = err.message; // 4. ถ้าใช่, ก็ใช้ message จาก error นั้น
      }
      
      console.error(errorMessage);
      setError(errorMessage); // 5. แสดง errorMessage ที่ปลอดภัยแล้ว
      
    // --- ⬆️ [แก้ไข] สิ้นสุดส่วนที่แก้ ---
    } finally {
      setLoading(false); // หยุด loading ไม่ว่าจะสำเร็จหรือล้มเหลว
    }
  };
  // --- ⬆️ [แก้ไข] สิ้นสุดส่วน handleSubmit ⬆️ ---

  return (
    // ... ส่วนของ JSX (HTML) ทั้งหมดไม่ต้องแก้ไข ...
    // (เนื้อหา JSX ของคุณเหมือนเดิม)
    // 1. พื้นหลังหลัก (สไตล์เดียวกับหน้า Login)
    <div
      className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* 2. เอฟเฟกต์แสงสีน้ำเงินฟุ้งๆ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <div className="w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-25"></div>
      </div>

      {/* 3. การ์ดสำหรับ Register (ธีมเดียวกับ Login) */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8">
        
        {/* หัวข้อ */}
        <h1 className="text-4xl font-bold text-center text-white mb-4">
          SAU <span className="text-blue-500">Register</span>
        </h1>
        <p className="text-center text-gray-300 mb-8">
          สร้างบัญชีใหม่เพื่อเริ่มต้นเส้นทางของคุณ
        </p>

        {/* ฟอร์ม Register (ปรับสไตล์) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ช่องกรอก ชื่อ-สกุล */}
          <div className="relative">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              ชื่อ-สกุล
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="name"
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

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
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่องกรอก Password */}
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              รหัสผ่าน
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="password"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ช่องเลือกเพศ */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              เพศ
            </label>
            <div className="flex space-x-6">
              <label className="inline-flex items-center text-gray-300">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  className="text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-600"
                  onChange={(e) => setGender(e.target.value)}
                />
                <span className="ml-2">ชาย</span>
              </label>
              <label className="inline-flex items-center text-gray-300">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  className="text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-600"
                  onChange={(e) => setGender(e.target.value)}
                />
                <span className="ml-2">หญิง</span>
              </label>
            </div>
          </div>

          {/* ช่องอัปโหลดรูปโปรไฟล์ */}
          <div>
            <label
              htmlFor="profileImage"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              รูปโปรไฟล์
            </label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          {/* แสดงรูปตัวอย่าง */}
          {previewImage && (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Image Preview</p>
              <div className="relative mx-auto mt-2 h-32 w-32 overflow-hidden rounded-full border-2 border-gray-600 shadow-md">
                {/* เปลี่ยนจาก <Image> เป็น <img> */}
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="h-full w-full object-cover" // ใช้ Tailwind แทน layout="fill" objectFit="cover"
                />  
              </div>
            </div>
          )}

          {/* แสดงข้อผิดพลาด (ถ้ามี) */}
          {error && (
            <div className="text-red-400 text-center text-sm">
              {error}
            </div>
          )}

          {/* ปุ่ม Register */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังสร้างบัญชี...' : 'ลงทะเบียน'}
            </button>
          </div>
        </form>

        {/* ลิงก์ไปหน้า Login */}
        <p className="text-center text-gray-400 text-sm mt-8">
          มีบัญชีอยู่แล้ว?{' '}
          {/* เปลี่ยนจาก <Link> เป็น <a> */}
          <a
            href="/Login" // ใช้ href สำหรับ <a>
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            เข้าสู่ระบบที่นี่
          </a>
        </p>
      </div>
    </div>
  );
};