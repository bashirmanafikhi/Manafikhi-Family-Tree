import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "شجرة عائلة المنافيخي",
  description: "تصفح شجرة العائلة - Manafikhi Family Tree",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-[#ede8e0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-primary">
                  ع
                </div>
                <span className="font-bold text-lg hidden sm:block text-[#0d5c63]">
                  عائلة المنافيخي
                </span>
              </Link>
              
              <div className="flex items-center gap-2">
                <Link href="/" className="nav-link">
                  الرئيسية
                </Link>
                <Link href="/persons" className="nav-link">
                  الأفراد
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="border-t border-[#ede8e0] mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm" style={{ color: '#6b6560' }}>
            <p>شجرة عائلة المنافيخي - Manafikhi Family Tree</p>
          </div>
        </footer>
      </body>
    </html>
  );
}