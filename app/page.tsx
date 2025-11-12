import React from 'react';
// Import ไอคอนจาก lucide-react สำหรับการใช้งานในส่วนต่างๆ ของหน้าเว็บ
import { Dumbbell, Calendar, HandFist , Mail, Target, HeartPulse } from 'lucide-react';  //npm install lucide-react อันนี้ดีถามGPT มา เว็บIconต่างๆชื่อ lucide.dev ของดี อย่าลืม import ก่อนเอามาใช้้
import hopic from './Images/hopic.png'
import Image from 'next/image'

//  1. Navbar Component โหดๆ ตอนแรกไม่รู้จะใส่อะไรแต่คิดว่าปกติเว็บเรามันเป็นแนวจัดโปรแกรมเองมากกว่า 
// แล้วการที่มีการวัดตัว ค่าTDEEอะไรพวกนี้มันต้องหลังจากล็อกอิน เลยใส่ Navbar ธรรมดาๆ ไปก่อน 
const Navbar: React.FC = () => {
  return (
    <nav className="bg-black bg-opacity-80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="#" className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <span className="text-white text-2xl font-bold">SAU Gymbro</span>
            </a>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <a href="#" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">หน้าแรก</a>
              <a href="#about" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">เกี่ยวกับ</a>
              <a href="#schedule" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">ตารางออกกำลังกาย</a>
              <a href="#contact" className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200">ติดต่อ</a>
            </div>
          </div>

         {/* Link to Login kub */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <a
                href="/Login"
                className="text-gray-300 hover:text-white border border-gray-500 hover:border-white font-semibold px-5 py-2 rounded-full transition-all duration-200"
              >
                Login
              </a>
              <a
                href="/Register"
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-5 py-2 rounded-full transition-transform duration-200 transform hover:scale-105"
              >
                Register
              </a>
            </div>
          </div>

          {/* TODO: Mobile Menu Button (Hamburger) สามารถเพิ่มทีหลังได้ */}
        </div>
      </div>
    </nav>
  );
};

// --- 2. Hero Section (ส่วนต้อนรับหลัก) ---
const Hero: React.FC = () => {
  return (
    <section 
      className="relative h-[85vh] min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden"
      style={{
        // ใช้พื้นหลังสีดำเข้ม
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* เอฟเฟกต์แสงสีน้ำเงินด้านหลัง */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[800px] h-[800px] bg-blue-900 rounded-full blur-[200px] opacity-30"></div>
      </div>

      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          สร้าง<span className="text-blue-500">ตัวตนที่ดีที่สุด</span>ของคุณ
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-8">
          เข้าร่วม SAU Gymbro เพื่อเป้าหมายสุขภาพและรูปร่างของคุณ
        </p>
        <a
          href="/Login"
          className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg shadow-blue-500/30"
        >
          Get Started
        </a>
      </div>
    </section>
  );
};

// --- 3. About Section (เกี่ยวกับเรา) ---
const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              เกี่ยวกับ <span className="text-blue-500">SAU Gymbro</span>
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              SAU Gymbro คือ เว็บที่จะช่วยคุณให้ไปตามเป้าหมายของคุณ พวกเราไม่ใช่ยอดมนุษย์พวกเราเป็นมนุษย์ธรรมดาที่อยากให้ทุกคนมีสุขภาพที่ดีขึ้น เราหวังว่าคุณจะใช้งานเว็บของเราเพื่อบรรลุเป้าหมายสุขภาพของคุณ
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500 mr-4" />
                <span className="text-white text-xl">เป้าหมายที่ชัดเจนมาจากความต่อเนื่องของคุณ</span>
              </div>
              <div className="flex items-center">
                <HandFist className="h-8 w-8 text-blue-500 mr-4" />
                <span className="text-white text-xl">จงลงมือทำถึงแม้จะเพิ่มมาแค่1%ก็ถือว่าเป็นการพัฒนา</span>
              </div>
              <div className="flex items-center">
                <HeartPulse className="h-8 w-8 text-blue-500 mr-4" />
                <span className="text-white text-xl">สุขภาพที่ดีขึ้นเพราะการกินของคุณ</span>
              </div>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            {/* ใส่รูปโหดๆ */}
            <Image
              className="rounded-lg shadow-xl w-full h-full object-cover" 
              src={hopic}
              alt="Gym Progess"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 4. Workout Schedule Section (ตารางออกกำลังกาย) ---
// สร้าง Interface สำหรับตาราง (TypeScript)
interface ScheduleItem {
  day: string;
  focus: string;
  time: string;
}

const Schedule: React.FC = () => {
  /*
    DATABASE COMMENT (ส่วนฐานข้อมูล):
    ข้อมูล 'scheduleData' นี้ควรถูกดึงมาจากฐานข้อมูล
    เพื่อให้แอดมินสามารถอัปเดตตารางโปรแกรมแนะนำได้ง่ายๆ
  */
  const scheduleData: ScheduleItem[] = [
    { day: "จันทร์", focus: "Upper Body (อก, ไหล่, หลังแขน)", time: "17:00 - 19:00" },
    { day: "อังคาร", focus: "Lower Body (ขา, ก้น)", time: "17:00 - 19:00" },
    { day: "พุธ", focus: "Cardio & Abs (คาร์ดิโอ และ หน้าท้อง)", time: "18:00 - 19:00" },
    { day: "พฤหัสบดี", focus: "Upper Body (หลัง, หน้าแขน)", time: "17:00 - 19:00" },
    { day: "ศุกร์", focus: "Full Body Workout", time: "17:00 - 18:30" },
    { day: "เสาร์ - อาทิตย์", focus: "Active Rest or Free Play", time: "ตลอดวัน" },
  ];

  return (
    <section id="schedule" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-white mb-12">
          ตารางออกกำลังกายแนะนำ
        </h2>
        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700">
          <ul className="divide-y divide-gray-700">
            {scheduleData.map((item, index) => (
              <li key={index} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-800 transition-colors duration-200">
                <div>
                  <span className="text-blue-400 font-semibold text-lg">{item.day}</span>
                  <h3 className="text-white text-2xl font-bold ml-0 md:ml-4 md:inline-block">{item.focus}</h3>
                </div>
                <div className="flex items-center space-x-4 mt-2 md:mt-0">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 text-lg">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center text-gray-400 mt-8">
          <p>*นี่คือตารางแนะนำเบื้องต้น คุณสามารถจัดโปรแกรมส่วนตัวเพื่อติดตามProgessของคุณได้</p>
        </div>
      </div>
    </section>
  );
};


// --- 5. Footer (ส่วนท้าย) ---
const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gray-950 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">SAU Gymbro</h3>
          <p className="mb-4">
            เป้าหมายของเราแค่ต้องการให้คุณมีสุขภาพที่ดีขึ้น 
            ด้วยคำแนะนำจากคนที่เคยอ้วนเหมือนคุณ และอยากให้คุณได้มีสุขภาพที่ดีขึ้นเหมือนเรา   
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">ลิงก์ด่วน</h3>
          <ul className="space-y-2">
            <li><a href="#about" className="hover:text-blue-400">เกี่ยวกับ</a></li>
            <li><a href="#schedule" className="hover:text-blue-400">ตารางออกกำลังกาย</a></li>
            <li><a href="#" className="hover:text-blue-400">สมัครสมาชิก</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">ติดต่อเรา</h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Kitti Wilawan</span>/<span>s6652410018@sau.ac.th</span>
            </li>
             <li className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Chanachon Pimpan</span>/<span>s6652410005@sau.ac.th</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-12 border-t border-gray-800 pt-8">
        <p>&copy; {new Date().getFullYear()} SAU Gymbro. สงวนลิขสิทธิ์.</p>
      </div>
    </footer>
  );
}


// --- Main App Component (ไฟล์หลัก) ---
const App: React.FC = () => {
  return (
    // ใช้ Inter font ที่สบายตา และพื้นหลังสีดำ/เทาเข้ม
    <div className="font-inter bg-black text-gray-200">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Schedule />
      </main>
      <Footer />
    </div>
  );
};

export default App;


