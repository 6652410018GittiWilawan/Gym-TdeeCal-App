"use client";

import React, { useState, useEffect, useRef } from 'react'; 
import { User, Activity, Weight, Calendar, Ruler, Users } from 'lucide-react'; 
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UpdateProfile() {
  const router = useRouter(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ทั้งหมด ---
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [image_file, setImageFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState<string>(""); 
  const [weight, setWeight] = useState<string>(""); 
  const [activityLevel, setActivityLevel] = useState<string>(""); 
  const [createdAt, setCreatedAt] = useState<string>(""); 
  const [age, setAge] = useState<number>(0);
  
  // --- useEffect ดึงข้อมูล ---
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("ไม่พบผู้ใช้ กรุณาล็อกอินใหม่");
        setLoading(false);
        router.push('/Login'); 
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, gender, profile_pic_url, user_height, user_weight, activity_level, created_at, age')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
      } else if (data) {
        setFullName(data.full_name || "");
        setGender(data.gender || "");
        setPreviewImage(data.profile_pic_url || null); 
        setHeight(data.user_height || "");
        setWeight(data.user_weight || "");
        setActivityLevel(data.activity_level || "");
        setAge(data.age || 0);
        
        if (data.created_at) {
          const date = new Date(data.created_at);
          setCreatedAt(date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]); 

  // --- handleImageChange  ---
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

  // --- ฟังก์ชันใหม่สำหรับคลิกที่รูป ---
  const handleImageClick = () => {
    // สั่งให้ file input  ทำงาน
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      //  หา User ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้งาน");

      // --- แยก Object ที่จะอัปเดต ออกมา ---
      // สร้าง Object สำหรับข้อมูล Text
      const updates = {
        full_name: fullName,
        user_height: height,
        user_weight: weight,
        activity_level: activityLevel,
        profile_pic_url: previewImage,
        age: age
      };

      // 2. ตรวจสอบว่ามีการอัปโหลด "รูปใหม่" หรือไม่
      if (image_file) {
        console.log("กำลังอัปโหลดรูปใหม่...");
        const new_image_file_name = `${user.id}-${Date.now()}-${image_file.name}`;
        
        // อัปโหลดรูปใหม่
        const { error: uploadError } = await supabase.storage
          .from("user_avatars") 
          .upload(new_image_file_name, image_file, {
             cacheControl: '3600',
             upsert: true 
          });
          
        if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

        // ถ้ารูปใหม่สำเร็จ ให้เอา URL
        const { data: urlData } = supabase.storage
          .from("user_avatars")
          .getPublicUrl(new_image_file_name);
        
        // --- เพิ่ม field รูป เข้าไปใน updates (จะทำก็ต่อเมื่ออัปโหลดรูปใหม่สำเร็จเท่านั้น)
        updates.profile_pic_url = urlData.publicUrl; 
      
      } else {
         console.log("ไม่ได้เลือกรูปใหม่, จะไม่อัปเดต URL รูป");
      }
      
      //  สั่ง Update ข้อมูล
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq('id', user.id); 

      if (updateError) {
        throw new Error(`Insert Error: ${updateError.message}`);
      }
      
      alert("บันทึกข้อมูลเรียบร้อย!");
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

  // --- handleCancel ---
  const handleCancel = () => {
    router.push('/Dashboard'); 
  };

  // --- JSX (ปรับ Layout) ---
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* เอฟเฟกต์แสง */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <div className="w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-25"></div>
      </div>

      {/* การ์ด */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8">
        
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Update Profile
        </h1>
        
        {loading && (
          <div className="text-center text-blue-400">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            กำลังโหลดข้อมูล...
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/*  รูปโปรไฟล์ */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                รูปโปรไฟล์ (คลิกที่รูปเพื่อเปลี่ยน)
              </label>
              
              {/* เพิ่ม onClick และ cursor-pointer */}
              <div 
                className="relative mx-auto h-32 w-32 overflow-hidden rounded-full border-2 border-gray-600 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleImageClick}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // รูป Default (เผื่อไม่มีรูป)
                  <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-500" />
                  </div>
                )}
              </div>
            
              {/* ซ่อน input นี้ไว้ */}
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef} // <--- ผูก Ref
                className="hidden" // <--- ซ่อน
              />
            </div>

            {/*  ชื่อ (70%) และ เพศ (30%) */}
            <div className="flex space-x-4">
              {/* ชื่อ-สกุล (80%) (เหมือนเดิม) */}
              <div className="w-[70%]">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* เพศ (30%) */}
              <div className="w-[30%]">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  เพศ
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Users className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    // แปลงค่า male/female เป็น ชาย/หญิง
                    value={gender === 'male' ? 'ชาย' : (gender === 'female' ? 'หญิง' : '-')}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg"
                    disabled // <--- ห้ามแก้ไข
                  />
                </div>
              </div>
            </div>

            {/* แถว ส่วนสูง / Activity */}
            <div className="flex space-x-4">
              <div className="w-[30%]">
                <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
                  ส่วนสูง (cm)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Ruler className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="height"
                    type="number"
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-[70%]">
                <label htmlFor="activity" className="block text-sm font-medium text-gray-300 mb-2">
                  Activity Level
                </label>
                <select
                  id="activity"
                  name="activity"
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 h-[46px]"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                >
                  <option value="" disabled>-- เลือกการออกกำลังกาย --</option>
                  <option value="level-0">ไม่ออกเลย</option>
                  <option value="level-1">ออกเบา 1-2 วัน/สัปดาห์</option>
                  <option value="level-2">ปานกลาง 3-4 วัน/สัปดาห์</option>
                  <option value="level-3">ออกหนัก 4-6 วัน/สัปดาห์</option>
                </select>
              </div>
            </div>

            {/* แถว น้ำหนัก / วันที่เข้าใช้ */}
            <div className="flex space-x-4">
              <div className="w-[30%]">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
                  น้ำหนัก (kg)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Weight className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="weight"
                    type="number"
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-[70%]">
                <label htmlFor="createdAt" className="block text-sm font-medium text-gray-300 mb-2">
                  วันที่เข้าร่วม
                </label>
                <div className="relative">
                   <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="createdAt"
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg"
                    value={createdAt}
                    disabled 
                  />
                </div>
              </div>
            </div>
            
            <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
              อายุ
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="age"
                type="number"
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
          </div>
            
            {/* แสดงข้อผิดพลาด */}
            {error && (
              <div className="text-red-400 text-center text-sm">
                {error}
              </div>
            )}

            {/*  ปุ่ม (บันทึก / ยกเลิก) */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button" 
                onClick={handleCancel}
                className="w-full bg-gray-600 text-white hover:bg-gray-700 font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};