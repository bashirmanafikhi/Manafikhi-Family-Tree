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
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-20 bg-gradient-primary" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-10 bg-gradient-gold" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#0d5c63' }}>
              شجرة عائلة <span className="text-gradient">المنافيخي</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-12" style={{ color: '#6b6560' }}>
              تصفح شجرة عائلتك العريقة
            </p>
            
            <Link href="/persons" className="btn-primary text-lg px-8 py-4">
              تصفح أفراد العائلة
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0d5c63' }}>{stats.totalPersons}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>إجمالي Individuals</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
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

            <div className="stat-card">
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

            <div className="stat-card">
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
    </div>
  );
}