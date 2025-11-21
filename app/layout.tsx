import type { Metadata } from "next";
import "./globals.css";
import { Kanit } from "next/font/google";

//Font Kanit
const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
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
        className={`${kanit.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
