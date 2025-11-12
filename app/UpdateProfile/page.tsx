"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User, Activity, Weight, Calendar, Ruler, Users, Utensils, Zap, Feather, Soup } from 'lucide-react'; // เพิ่มไอคอนที่เกี่ยวข้อง
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

// กำหนดอัตราส่วน Macros (ตัวอย่าง: 45% Carb, 30% Protein, 25% Fat)
const MACROS_RATIO = {
    CARB: 0.45,
    PROTEIN: 0.30,
    FAT: 0.25,
};

// ข้อมูลแคลอรี่ต่อกรัม
const CALORIES_PER_GRAM = {
    CARB: 4,
    PROTEIN: 4,
    FAT: 9,
};

// กำหนด Type สำหรับ Macros
type Macros = {
    carb: number | null;
    protein: number | null;
    fat: number | null;
};

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
    const [tdee, setTdee] = useState<number | null>(null);
    // เพิ่ม State สำหรับ Macros
    const [macros, setMacros] = useState<Macros>({ carb: null, protein: null, fat: null }); 
    const [carbRatio, setCarbRatio] = useState(0); // Default 45%
    const [proteinRatio, setProteinRatio] = useState(0); // Default 30%
    const [fatRatio, setFatRatio] = useState(0); // Default 25%
    const [totalRatio, setTotalRatio] = useState(100); // State สำหรับผลรวม

    // --- Activity Multipliers (ตัวคูณระดับกิจกรรม) ---
    const activityMultipliers: { [key: string]: number } = {
        "level-0": 1.2,   
        "level-1": 1.375, 
        "level-2": 1.55,  
        "level-3": 1.725, 
    };

    // --- ฟังก์ชันคำนวณ BMR และ TDEE (Mifflin-St Jeor) ---
    const calculateTDEE = (
        gender: string,
        weightKg: number,
        heightCm: number,
        ageYears: number,
        activityLevel: string
        
    ): number | null => {
        if (!weightKg || !heightCm || !ageYears || !activityLevel) {
            return null;
        }

        let bmr: number;
        if (gender === 'male') {
            // BMR ผู้ชาย = (10 * น้ำหนัก) + (6.25 * ส่วนสูง) - (5 * อายุ) + 5
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5;
        } else if (gender === 'female') {
            // BMR ผู้หญิง = (10 * น้ำหนัก) + (6.25 * ส่วนสูง) - (5 * อายุ) - 161
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161;
        } else {
            return null;
        }

        const multiplier = activityMultipliers[activityLevel];
        if (multiplier) {
            const tdeeResult = Math.round(bmr * multiplier);
            return tdeeResult;
        }

        return null;
    };
    
    // --- ฟังก์ชันคำนวณ Macros ---
     const calculateMacros = (tdee: number): Macros => {
        
        // แปลง % (เช่น 45) เป็นทศนิยม (เช่น 0.45)
        const carbDecimal = Number(carbRatio) / 100;
        const proteinDecimal = Number(proteinRatio) / 100;
        const fatDecimal = Number(fatRatio) / 100;

        // Carb (4 Kcal/g)
        const carbKcal = tdee * carbDecimal; // <--- CHANGED
        const carbGram = Math.round(carbKcal / CALORIES_PER_GRAM.CARB);
        
        // Protein (4 Kcal/g)
        const proteinKcal = tdee * proteinDecimal; // <--- CHANGED
        const proteinGram = Math.round(proteinKcal / CALORIES_PER_GRAM.PROTEIN);
        
        // Fat (9 Kcal/g)
        const fatKcal = tdee * fatDecimal; // <--- CHANGED
        const fatGram = Math.round(fatKcal / CALORIES_PER_GRAM.FAT);

        return {
            carb: carbGram,
            protein: proteinGram,
            fat: fatGram,
        };
    };


    useEffect(() => {
        // ใช้ Number() เพื่อแปลงค่าเผื่อเป็น string จาก input
        setTotalRatio(Number(carbRatio) + Number(proteinRatio) + Number(fatRatio));
    }, [carbRatio, proteinRatio, fatRatio]);
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

            // สมมติว่าในตาราง profiles มีคอลัมน์สำหรับเก็บ Macros ด้วย (เช่น carb_g, protein_g, fat_g)
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, gender, profile_pic_url, user_height, user_weight, activity_level, created_at, age, tdee, carb_g, protein_g, fat_g') 
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
                setTdee(data.tdee || null);
                
                // ดึงค่า Macros เดิมมาแสดง
                setMacros({
                    carb: data.carb_g || null,
                    protein: data.protein_g || null,
                    fat: data.fat_g || null,
                });

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

    // --- handleImageChange  ---
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
            setImageFile(null); 
        }
    };

    // --- ฟังก์ชันใหม่สำหรับคลิกที่รูป ---
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ไม่พบผู้ใช้งาน");

            // --- 1. คำนวณ TDEE ใหม่ ---
            const weightKg = Number(weight);
            const heightCm = Number(height);
            const calculatedTDEE = calculateTDEE(gender, weightKg, heightCm, age, activityLevel);
            
            let calculatedMacros: Macros = { carb: null, protein: null, fat: null };
            if (calculatedTDEE) {
                // --- 2. คำนวณ Macros ใหม่ ---
                calculatedMacros = calculateMacros(calculatedTDEE);
                setMacros(calculatedMacros);
            } else {
                console.warn("ไม่สามารถคำนวณ TDEE และ Macros ได้เนื่องจากข้อมูลไม่สมบูรณ์");
            }

            // --- 3. แยก Object ที่จะอัปเดต ออกมา ---
            const updates: { [key: string]: any } = {
                full_name: fullName,
                user_height: height,
                user_weight: weight,
                activity_level: activityLevel,
                profile_pic_url: previewImage,
                age: age,
                tdee: calculatedTDEE,
                // เพิ่ม Macros ที่คำนวณได้สำหรับการบันทึก
                carb_g: calculatedMacros.carb,
                protein_g: calculatedMacros.protein,
                fat_g: calculatedMacros.fat,
                 carb_ratio: carbRatio,
                protein_ratio: proteinRatio,
                fat_ratio: fatRatio,
            };

            // 4. จัดการอัปโหลดรูป
            if (image_file) {
                console.log("กำลังอัปโหลดรูปใหม่...");
                const new_image_file_name = `${user.id}-${Date.now()}-${image_file.name}`;
                
                const { error: uploadError } = await supabase.storage
                    .from("user_avatars") 
                    .upload(new_image_file_name, image_file, {
                        cacheControl: '3600',
                        upsert: true 
                    });
                    
                if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

                const { data: urlData } = supabase.storage
                    .from("user_avatars")
                    .getPublicUrl(new_image_file_name);
                
                updates.profile_pic_url = urlData.publicUrl; 
            }
            
            //  5. สั่ง Update ข้อมูล
            const { error: updateError } = await supabase
                .from("profiles")
                .update(updates)
                .eq('id', user.id); 

            if (updateError) {
                throw new Error(`Insert Error: ${updateError.message}`);
            }
            
            alert(`บันทึกข้อมูลเรียบร้อย! TDEE ของคุณ: ${calculatedTDEE ? calculatedTDEE.toLocaleString() + ' Kcal' : 'ไม่สามารถคำนวณได้'}`);
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
                    Update <span className='text-blue-500'>Profile</span>
                </h1>
                
                {loading && (
                    <div className="text-center text-blue-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        กำลังโหลดข้อมูล...
                    </div>
                )}

                {!loading && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/*  รูปโปรไฟล์ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                รูปโปรไฟล์ (คลิกที่รูปเพื่อเปลี่ยน)
                            </label>
                            
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
                                    <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                                        <User className="h-16 w-16 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        
                            <input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef} 
                                className="hidden" 
                            />
                        </div>

                        {/*  ชื่อ และ เพศ (อ่านอย่างเดียว) */}
                        <div className="flex space-x-4">
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
                            
                            {/* เพศ (อ่านอย่างเดียว) */}
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

                        {/* แถว ส่วนสูง / น้ำหนัก */}
                        <div className="flex space-x-4">
                            <div className="w-1/2">
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
                                        required
                                    />
                                </div>
                            </div>
                            <div className="w-1/2">
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
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* แถว อายุ / Activity Level */}
                        <div className="flex space-x-4">
                            <div className="w-1/2">
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
                                        required
                                    />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <label htmlFor="activity" className="block text-sm font-medium text-gray-300 mb-2">
                                    Activity Level
                                </label>
                                <select
                                    id="activity"
                                    name="activity"
                                    className="w-full px-3 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 h-[46px]"
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- เลือกการออกกำลังกาย --</option>
                                    <option value="level-0">ไม่ออกเลย</option>
                                    <option value="level-1">ออกเบา 1-2 วัน/สัปดาห์</option>
                                    <option value="level-2">ปานกลาง 3-5 วัน/สัปดาห์</option>
                                    <option value="level-3">ออกหนัก 6-7 วัน/สัปดาห์</option>
                                </select>
                            </div>
                        </div>
                          <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    ตั้งค่าสัดส่วน Macros (รวมต้องได้ 100%)
                                </label>
                                <div className="flex space-x-2">
                                    {/* Carb Input */}
                                    <div className="w-1/3">
                                        <label htmlFor="carbRatio" className="block text-xs text-yellow-400 mb-1">คาร์บ (%)</label>
                                        <input
                                            id="carbRatio"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                                            value={carbRatio}
                                            onChange={(e) => setCarbRatio(Number(e.target.value))}
                                        />
                                    </div>
                                    {/* Protein Input */}
                                    <div className="w-1/3">
                                        <label htmlFor="proteinRatio" className="block text-xs text-red-400 mb-1">โปรตีน (%)</label>
                                        <input
                                            id="proteinRatio"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
                                            value={proteinRatio}
                                            onChange={(e) => setProteinRatio(Number(e.target.value))}
                                        />
                                    </div>
                                    {/* Fat Input */}
                                    <div className="w-1/3">
                                        <label htmlFor="fatRatio" className="block text-xs text-pink-400 mb-1">ไขมัน (%)</label>
                                        <input
                                            id="fatRatio"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                            value={fatRatio}
                                            onChange={(e) => setFatRatio(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                {/*  Display Total Ratio */}
                                <div className={`text-center text-sm mt-2 ${totalRatio === 100 ? 'text-green-500' : 'text-red-500'}`}>
                                    ผลรวม: {totalRatio}%
                                    {totalRatio !== 100 && <span className="ml-2">(ต้องเป็น 100%)</span>}
                                </div>
                            </div>  

                        {/* แถว TDEE (เต็มบรรทัด) */}
                        <div>
                            <label htmlFor="tdee" className="block text-sm font-medium text-gray-300 mb-2">
                                TDEE (แคลอรี่ที่ควรบริโภคต่อวัน) 
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Activity className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    id="tdee"
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-green-400 font-bold rounded-lg"
                                    value={tdee ? tdee.toLocaleString() + ' Kcal' : 'คำนวณหลังบันทึก'}
                                    disabled 
                                />
                            </div>
                        </div>
                        
                        {/* แถว MACROS (คาร์บ โปรตีน ไขมัน) <--- ส่วนที่เพิ่มเข้ามา */}
                        <div className="pt-2">
                             <label className="block text-sm font-medium text-gray-300 mb-2">
                                <Utensils className="h-4 w-4 inline mr-1" />
                                สารอาหารหลักที่แนะนำต่อวัน (Macros)
                             </label>
                             <div className="flex space-x-2 text-center">
                                 {/* Carb */}
                                 <div className="w-1/3 bg-gray-800/80 p-3 rounded-lg border border-gray-700">
                                     <Zap className="h-5 w-5 text-yellow-400 mx-auto" />
                                     <p className="text-sm text-gray-400">คาร์บ</p>
                                     <p className="text-lg font-bold text-yellow-300">
                                         {macros.carb ? macros.carb + 'g' : '-'}
                                     </p>
                                     <p className="text-xs text-gray-500">({MACROS_RATIO.CARB * 100}%)</p>
                                 </div>
                                 {/* Protein */}
                                 <div className="w-1/3 bg-gray-800/80 p-3 rounded-lg border border-gray-700">
                                     <Soup className="h-5 w-5 text-red-400 mx-auto" />
                                     <p className="text-sm text-gray-400">โปรตีน</p>
                                     <p className="text-lg font-bold text-red-300">
                                         {macros.protein ? macros.protein + 'g' : '-'}
                                     </p>
                                     <p className="text-xs text-gray-500">({MACROS_RATIO.PROTEIN * 100}%)</p>
                                 </div>
                                 {/* Fat */}
                                 <div className="w-1/3 bg-gray-800/80 p-3 rounded-lg border border-gray-700">
                                     <Feather className="h-5 w-5 text-pink-400 mx-auto" />
                                     <p className="text-sm text-gray-400">ไขมัน</p>
                                     <p className="text-lg font-bold text-pink-300">
                                         {macros.fat ? macros.fat + 'g' : '-'}
                                     </p>
                                     <p className="text-xs text-gray-500">({MACROS_RATIO.FAT * 100}%)</p>
                                 </div>
                             </div>
                        </div>
                        
                        {/* แถว วันที่เข้าใช้ (เต็มบรรทัด) */}
                        <div>
                            <label htmlFor="createdAt" className="block text-sm font-medium text-gray-300 mb-2">
                                เข้าร่วม
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
                        
                        {/* แสดงข้อผิดพลาด */}
                        {error && (
                            <div className="text-red-400 text-center text-sm">
                                {error}
                            </div>
                        )}

                        {/*  ปุ่ม (บันทึก / ยกเลิก) */}
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