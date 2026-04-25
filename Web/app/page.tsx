import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [totalPersons, aliveCount, deceasedCount, malesCount, femalesCount] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { isAlive: true } }),
    prisma.person.count({ where: { isAlive: false } }),
    prisma.person.count({ where: { gender: "MALE" } }),
    prisma.person.count({ where: { gender: "FEMALE" } }),
  ]);
  
  return { totalPersons, aliveCount, deceasedCount, malesCount, femalesCount };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-20 bg-gradient-primary" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-10 bg-gradient-gold" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up opacity-0" style={{ color: '#0d5c63' }}>
              شجرة عائلة <span className="text-gradient">المنافيخي</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-8 animate-slide-up opacity-0 stagger-1" style={{ color: '#6b6560' }}>
              تطبيق لإدارة وتحليل شجرة عائلتك الكبيرة
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up opacity-0 stagger-2">
              <Link href="/persons/new" className="btn-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
               إضافة فرد جديد
              </Link>
              
<Link href="/persons" className="btn-outline">
                استعراض الأفراد
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Total */}
            <div className="stat-card animate-scale-in opacity-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0d5c63' }}>{stats.totalPersons}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>إجمالي الأفراد</p>
                </div>
              </div>
            </div>

            {/* Alive */}
            <div className="stat-card animate-scale-in opacity-0 stagger-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-teal">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#4a9d7c' }}>{stats.aliveCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>أحياء</p>
                </div>
              </div>
            </div>

            {/* Males */}
            <div className="stat-card animate-scale-in opacity-0 stagger-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0d5c63' }}>{stats.malesCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>ذكور</p>
                </div>
              </div>
            </div>

            {/* Females */}
            <div className="stat-card animate-scale-in opacity-0 stagger-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-accent">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#e07a5f' }}>{stats.femalesCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>إناث</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#2d2926' }}>
            وصول سريع
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/persons/new" className="card p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-primary">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 9v3m0 0v3m0-3h3m-3 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#2d2926' }}>إضافة فرد جديد</h3>
              <p className="text-sm" style={{ color: '#6b6560' }}>أضف فرد جديد إلى الشجرة العائلية</p>
            </Link>

            <Link href="/persons" className="card p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-gold">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#2d2926' }}>قائمة الأفراد</h3>
              <p className="text-sm" style={{ color: '#6b6560' }}>استعرض وابحث في أفراد العائلة</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}