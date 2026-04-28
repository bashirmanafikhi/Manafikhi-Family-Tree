'use client';

interface GenerationStatsTableProps {
  descendantGenerations: any;
}

const generationLabels: Record<number, string> = {
  1: 'الأولاد',
  2: 'الأحفاد',
  3: 'أبناء الأحفاد',
  4: 'أحفاد الأحفاد',
  5: 'بناء أحفاد الأحفاد',
  6: 'أحفاد أحفاد الأحفاد',
};

function getGenderStats(nodes: any[]) {
  const males = nodes.filter(n => {
    const gender = n.person ? n.person.gender : n.gender;
    return gender === 'MALE';
  }).length;
  const females = nodes.filter(n => {
    const gender = n.person ? n.person.gender : n.gender;
    return gender === 'FEMALE';
  }).length;
  return { males, females };
}

export default function GenerationStatsTable({ descendantGenerations }: GenerationStatsTableProps) {
  if (!descendantGenerations || descendantGenerations.length === 0) return null;

  const allNodes = descendantGenerations.flatMap((item: [number, any[]]) => item[1]);
  const totalStats = getGenderStats(allNodes);

  return (
    <div className="card p-6 mt-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        إحصائيات الذرية
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e4de]">
              <th className="text-right py-3 px-4 font-semibold" style={{ color: '#2d2926' }}>الجيل</th>
              <th className="text-center py-3 px-4 font-semibold" style={{ color: '#2d2926' }}>العدد الكلي</th>
              <th className="text-center py-3 px-4 font-semibold" style={{ color: '#0d5c63' }}>عدد الذكور</th>
              <th className="text-center py-3 px-4 font-semibold" style={{ color: '#e07a5f' }}>عدد الإناث</th>
            </tr>
          </thead>
          <tbody>
            {descendantGenerations.map((item: [number, any[]]) => {
              const gen = item[0];
              const nodes = item[1];
              const { males, females } = getGenderStats(nodes);
              const total = males + females;
              const malePercent = total > 0 ? Math.round((males / total) * 100) : 0;
              const femalePercent = total > 0 ? Math.round((females / total) * 100) : 0;
              
              return (
                <tr key={gen} className="border-b border-[#e8e4de]/50 hover:bg-[#f8f6f3]">
                  <td className="py-3 px-4 font-medium" style={{ color: '#2d2926' }}>
                    {generationLabels[gen] || `الجيل ${gen}`}
                  </td>
                  <td className="py-3 px-4 text-center font-medium" style={{ color: '#2d2926' }}>
                    {total}
                  </td>
                  <td className="py-3 px-4 text-center" style={{ color: '#0d5c63' }}>
                    <div className="flex items-center justify-center gap-2">
                      <span>{males}</span>
                      <span className="text-xs opacity-70">({malePercent}%)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center" style={{ color: '#e07a5f' }}>
                    <div className="flex items-center justify-center gap-2">
                      <span>{females}</span>
                      <span className="text-xs opacity-70">({femalePercent}%)</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#e8e4de] bg-[#f8f6f3]">
              <td className="py-3 px-4 font-bold" style={{ color: '#2d2926' }}>المجموع الكلي</td>
              <td className="py-3 px-4 text-center font-bold" style={{ color: '#2d2926' }}>{totalStats.males + totalStats.females}</td>
              <td className="py-3 px-4 text-center font-bold" style={{ color: '#0d5c63' }}>
                <div className="flex items-center justify-center gap-2">
                  <span>{totalStats.males}</span>
                  <span className="text-xs opacity-70">({(totalStats.males + totalStats.females) > 0 ? Math.round(totalStats.males / (totalStats.males + totalStats.females) * 100) : 0}%)</span>
                </div>
              </td>
              <td className="py-3 px-4 text-center font-bold" style={{ color: '#e07a5f' }}>
                <div className="flex items-center justify-center gap-2">
                  <span>{totalStats.females}</span>
                  <span className="text-xs opacity-70">({(totalStats.males + totalStats.females) > 0 ? Math.round(totalStats.females / (totalStats.males + totalStats.females) * 100) : 0}%)</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}