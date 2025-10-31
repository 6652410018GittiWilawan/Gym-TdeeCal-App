import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local"

//Font ที่ กิตติ อยากใช้ 
const MNIceCreamVanillaItalic = localFont({
  src: "./fonts/MN Ice Cream Vanilla Italic.ttf",
  variable: '--font-ice-cream-italic',
});


export const metadata: Metadata = {
  title: "SAU Gymbro",
  description: "เว็บจัดโปรแกรมเพื่อหุ่นที่คุณต้องการ",
  keywords: ["ลดไขมัน", "จัดโปรแกรมออกกำลังกายด้วยตัวเอง", "จัดตารางอาหารด้วยตัวเอง", "ออกกำลังกาย", "เพิ่มกล้าม"],
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${MNIceCreamVanillaItalic.className}`}
      >
        {children}
      </body>
    </html>
  );
}
