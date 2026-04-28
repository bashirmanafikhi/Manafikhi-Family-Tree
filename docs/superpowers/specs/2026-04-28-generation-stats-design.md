# مواصفات إحصائيات الأجيال العائلية

## الملخص

إضافة إحصائيات الجنسين (ذكور/إناث) لكل جيل في الشجرة العائلية، مع إنشاء جدول إحصائي منفصل للأجيال النزلية.

## التغييرات

### 1️⃣ تعديل الشجرة الحالية

**الملفات:**
- `Web/components/FamilyTree.tsx`
- `viewer/components/FamilyTree.tsx`

**التغيير:** تحديث labels الأجيال لعرض إحصائيات الذكور/الإناث بجانب العدد

**التنسيق:**
```
{generationLabel} ({total} - ذكور {males} ✦ إناث {females})
```

**أمثلة:**
- `الوالدان (2 - ذكور 1 ✦ إناث 1)`
- `الأولاد (13 - ذكور 7 ✦ إناث 6)`
- `الأحفاد (25 - ذكور 12 ✦ إناث 13)`

**المنطق:**
- لكل جيل، حساب عدد الذكور (gender === 'MALE')
- حساب عدد الإناث (gender === 'FEMALE')
- عرض الأرقام بجانب اسم الجيل
- يشمل الأجداد والأحفاد (جميع الأجيال)

---

### 2️⃣ component جدول إحصائي جديد

**اسم الملف:** `components/GenerationStatsTable.tsx` (في كلا المشروعين)

**الموقع:** `Web/components/GenerationStatsTable.tsx` و `viewer/components/GenerationStatsTable.tsx`

**الواجهة:**

```tsx
interface GenerationStats {
  label: string;
  total: number;
  males: number;
  females: number;
}

interface GenerationStatsTableProps {
  descendantGenerations: Array<{ generation: number; nodes: TreeNode[] }>;
}
```

**هيكل الجدول:**

| الجيل | العدد الكلي | عدد الذكور | عدد الإناث |
|-------|-------------|-----------|-----------|
| الأولاد | 13 | 7 (54%) | 6 (46%) |
| الأحفاد | 25 | 12 (48%) | 13 (52%) |
| ... | ... | ... | ... |

**الأيقونات:**
-ذكور: أيقونة ذكر (👨 أو ▲)
- إناث: أيقونة أنثى (👩 أو ▼)

**الخصائص:**
- يظهر فقط الأجيال النزلية (الذرية)، وليس الأجداد
- يُضاف تحت الشجرة في صفحة تفاصيل الشخص
- قابل للطي/توسيع كالشجرة

---

## الملفات المعدلة

### Web

1. `components/FamilyTree.tsx` - إضافة إحصائيات الذكور/الإناث للأجيال
2. `app/persons/[id]/page.tsx` - استيراد وإضافة GenerationStatsTable

### viewer

1. `components/FamilyTree.tsx` - إضافة إحصائيات الذكور/الإناث للأجيال
2. `app/persons/[id]/page.tsx` - استيراد وإضافة GenerationStatsTable

## ملفات جديدة

1. `Web/components/GenerationStatsTable.tsx`
2. `viewer/components/GenerationStatsTable.tsx`

---

## التحقق

- [ ] الشجرة تعرض الأرقام بالتنسيق الصحيح
- [ ] الجدول يظهر فقط الأجيال النزلية
- [ ] الأرقام صحيحة (مجموع الذكور + الإناث =总数)
- [ ] يعمل في كل من Web и viewer