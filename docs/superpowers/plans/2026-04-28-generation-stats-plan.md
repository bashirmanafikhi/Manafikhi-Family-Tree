# إحصائيات الأجيال العائلية - خطة التنفيذ

> **للمطورين:** يُنصح باستخدام superpowers:subagent-driven-development أو superpowers:executing-plans لتنفيذ هذه الخطة.

**الهدف:** إضافة إحصائيات الذكور/الإناث لكل جيل في الشجرة العائلية، مع إنشاء جدول إحصائي منفصل للأجيال النزلية.

**النهج:** تعديل ملفات FamilyTree.tsx لإضافة الإحصائيات، وإنشاء component جديد للجدول الإحصائي.

**التقنيات:** React, Next.js, Tailwind CSS

---

## هيكل الملفات

### Web
- تعديل: `components/FamilyTree.tsx` - إضافة إحصائيات الذكور/الإناث
- تعديل: `app/persons/[id]/page.tsx` - إضافة الجدول الإحصائي
- جديد: `components/GenerationStatsTable.tsx` - component الجدول

### viewer
- تعديل: `components/FamilyTree.tsx` - إضافة إحصائيات الذكور/الإناث
- تعديل: `app/persons/[id]/page.tsx` - إضافة الجدول الإحصائي
- جديد: `components/GenerationStatsTable.tsx` - component الجدول

---

## المهمة 1: إضافة دالة حساب الإحصائيات

**الملفات:**
-modify: `Web/components/FamilyTree.tsx`
- Modify: `viewer/components/FamilyTree.tsx`

- [ ] **الخطوة 1: إضافة دالة حساب الذكور والإناث**

أضف هذه الدالة في نهاية الملف قبل `export default`:

```tsx
function getGenderStats(nodes: TreeNode[]): { males: number; females: number } {
  const males = nodes.filter(n => n.person.gender === 'MALE').length;
  const females = nodes.filter(n => n.person.gender === 'FEMALE').length;
  return { males, females };
}
```

- [ ] **الخطوة 2: تحديث تنسيق الجيل للأجداد**

في السطر 345 (approx)، ابحث عن:
```tsx
{generationLabels[gen] || `الأجداد الجيل ${getArabicOrdinal(gen)}`} ({nodes.length})
```

واستبدله بـ:
```tsx
const stats = getGenderStats(nodes);
{generationLabels[gen] || `الأجداد الجيل ${getArabicOrdinal(gen)}`} ({nodes.length} - ذكور {stats.males} ✦ إناث {stats.females})
```

- [ ] **الخطوة 3: تحديث تنسيق الجيل للذرية**

في السطر 392 (approx)، ابحث عن:
```tsx
{generationLabels[gen] || `النسل ${getArabicOrdinal(gen)}`} ({nodes.length})
```

واستبدله بـ:
```tsx
const stats = getGenderStats(nodes);
{generationLabels[gen] || `النسل ${getArabicOrdinal(gen)}`} ({nodes.length} - ذكور {stats.males} ✦ إناث {stats.females})
```

- [ ] **الخطوة 4: تطبيق نفس التغييرات في viewer**

انسخ نفس التعديلات إلى `viewer/components/FamilyTree.tsx`

---

## المهمة 2: إنشاء component الجدول الإحصائي

**الملفات:**
- Create: `Web/components/GenerationStatsTable.tsx`
- Create: `viewer/components/GenerationStatsTable.tsx`

- [ ] **الخطوة 1: كتابة component الجدول**

اكتب الملف `Web/components/GenerationStatsTable.tsx`:

```tsx
'use client';

import { TreeNode } from './FamilyTree';

interface GenerationStatsTableProps {
  descendantGenerations: Array<{ generation: number; nodes: TreeNode[] }>;
}

const generationLabels: Record<number, string> = {
  1: 'الأولاد',
  2: 'الأحفاد',
  3: 'أبناء الأحفاد',
  4: 'أحفاد الأحفاد',
  5: ' أبناء أحفاد الأحفاد',
  6: 'أحفاد أحفاد الأحفاد',
};

function getGenderStats(nodes: TreeNode[]) {
  const males = nodes.filter(n => n.person.gender === 'MALE').length;
  const females = nodes.filter(n => n.person.gender === 'FEMALE').length;
  return { males, females };
}

export default function GenerationStatsTable({ descendantGenerations }: GenerationStatsTableProps) {
  if (descendantGenerations.length === 0) return null;

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
            {descendantGenerations.map(([gen, nodes]) => {
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
        </table>
      </div>
    </div>
  );
}
```

- [ ] **الخطوة 2: إنشاء ملف viewer**

انسخ نفس الملف إلى `viewer/components/GenerationStatsTable.tsx` (مع تعديل المسارات إذا لزم الأمر)

---

## المهمة 3: إضافة الجدول لصفحات التفاصيل

**الملفات:**
- Modify: `Web/app/persons/[id]/page.tsx`
- Modify: `viewer/app/persons/[id]/page.tsx`

- [ ] **الخطوة 1: استيراد الجدول في Web**

أضف الاستيراد في أعلى الملف:
```tsx
import GenerationStatsTable from '@/components/GenerationStatsTable'
```

- [ ] **الخطوة 2: تمرير البيانات للجدول**

في المكون، أضف after `<FamilyTree />`:
```tsx
<GenerationStatsTable descendantGenerations={descendantGenerations} />
```

ملاحظة: تأكد من تصدير `descendantGenerations` من `FamilyTree` أو احسبه في page.tsx

- [ ] **الخطوة 3: تطبيق نفس التغييرات في viewer**

كرر نفس الخطوات في `viewer/app/persons/[id]/page.tsx`

---

## المهمة 4: التحقق

- [ ] **الخطوة 1: تشغيل التطبيق**

```bash
cd Web && npm run dev
```

- [ ] **الخطوة 2: التحقق vizually**

افتح صفحة تفاصيل شخص لديه ذرية:
- الشجرة تعرض: `الأولاد (13 - ذكور 7 ✦ إناث 6)`
- الجدول يظهر تحت الشريطة مع الأعمدة الصحيحة

---

## ملاحظات

- الدالة `getGenderStats` مُضافة في both FamilyTree.tsx files
- الجدول يُظهر stats النزلية فقط (الذرية) وليس الأجداد
- التنسيق العربي: `ذكر` = MALE، `أنثى` = FEMALE