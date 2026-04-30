'use client'

import { useState } from 'react'
import { ExcalidrawExporter, ExcalidrawExportOptions } from '@/lib/excalidrawExporter'

export function ExcalidrawModal({ person, allPersons }: { person: any, allPersons: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ExcalidrawExportOptions>({
    layout: 'vertical',
    maxGenerations: 5,
    useRectangles: true,
    includeDates: true,
    textAngle: 0,
    compactSpacing: false,
    lineStyle: 'solid',
    lineSharpness: 'round',
    direction: 'rtl',
    strokeWidth: 1,
    linkOpacity: 100,
    generationSpacing: 250,
    endArrowhead: 'arrow', // القيمة الجديدة للتحكم في الأسهم
  })

  const handleExport = () => {
    const json = ExcalidrawExporter.generateJson(person, allPersons, options)
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tree-${person.firstName}-${person.lastName || ''}.excalidraw`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  return (
    <>
      {/* زر التفعيل الرئيسي */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-outline flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-slate-50"
        style={{ borderColor: '#4a9d7c', color: '#4a9d7c' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        تصدير لـ Excalidraw
      </button>

      {/* النافذة المنبثقة (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[95vh]" dir="rtl">

            {/* الرأس */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold" style={{ color: '#2d2926' }}>إعدادات التصدير الاحترافية</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* شبكة الإعدادات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8 text-right">

              {/* التخطيط */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">تخطيط الشجرة</label>
                <select
                  className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#4a9d7c] outline-none"
                  value={options.layout}
                  onChange={e => setOptions({ ...options, layout: e.target.value as any })}
                >
                  <option value="vertical">عمودي (Vertical)</option>
                  <option value="horizontal">أفقي (Horizontal)</option>
                  <option value="radial">دائري (Radial)</option>
                </select>
              </div>

              {/* رؤوس الأسهم */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">رأس السهم (Arrowhead)</label>
                <select
                  className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#4a9d7c] outline-none"
                  value={options.endArrowhead || 'none'}
                  onChange={e => setOptions({ ...options, endArrowhead: e.target.value === 'none' ? null : e.target.value as any })}
                >
                  <option value="arrow">سهم كلاسيكي</option>
                  <option value="triangle">مثلث ممتلئ</option>
                  <option value="dot">نقطة دائري</option>
                  <option value="bar">خط عرضي (T-shape)</option>
                  <option value="none">بدون رأس سهم</option>
                </select>
              </div>

              {/* عدد الأجيال */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">أقصى عدد للأجيال</label>
                <input
                  type="number" className="w-full p-2 border rounded-md bg-gray-50"
                  min="1" max="20" value={options.maxGenerations}
                  onChange={e => setOptions({ ...options, maxGenerations: Number(e.target.value) })}
                />
              </div>

              {/* المسافة */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">المباعدة بين الأجيال ({options.generationSpacing}px)</label>
                <input
                  type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4a9d7c]"
                  min="100" max="800" step="50" value={options.generationSpacing}
                  onChange={e => setOptions({ ...options, generationSpacing: Number(e.target.value) })}
                />
              </div>

              {/* نمط الخطوط */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">نمط الروابط</label>
                <select
                  className="w-full p-2 border rounded-md bg-gray-50"
                  value={options.lineStyle} onChange={e => setOptions({ ...options, lineStyle: e.target.value as any })}
                >
                  <option value="solid">خط متصل</option>
                  <option value="dashed">خط مقطع</option>
                  <option value="dotted">خط منقط</option>
                </select>
              </div>

              {/* زوايا الخطوط */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">انحناء الزوايا</label>
                <select
                  className="w-full p-2 border rounded-md bg-gray-50"
                  value={options.lineSharpness} onChange={e => setOptions({ ...options, lineSharpness: e.target.value as any })}
                >
                  <option value="round">منحني (Round)</option>
                  <option value="sharp">حاد (Sharp)</option>
                </select>
              </div>

              {/* سماكة الخط */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">سماكة الخط ({options.strokeWidth}px)</label>
                <input
                  type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-[#4a9d7c]"
                  min="1" max="4" step="1" value={options.strokeWidth}
                  onChange={e => setOptions({ ...options, strokeWidth: Number(e.target.value) })}
                />
              </div>

              {/* الشفافية */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">شفافية الروابط ({options.linkOpacity}%)</label>
                <input
                  type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-[#4a9d7c]"
                  min="10" max="100" step="10" value={options.linkOpacity}
                  onChange={e => setOptions({ ...options, linkOpacity: Number(e.target.value) })}
                />
              </div>

              {/* خيارات إضافية (Checkboxes) */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6 mt-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox" checked={options.useRectangles}
                    onChange={e => setOptions({ ...options, useRectangles: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#4a9d7c] focus:ring-[#4a9d7c]"
                  />
                  <span className="text-sm font-medium text-gray-700">استخدام بطاقات الأسماء</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox" checked={options.includeDates}
                    onChange={e => setOptions({ ...options, includeDates: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#4a9d7c] focus:ring-[#4a9d7c]"
                  />
                  <span className="text-sm font-medium text-gray-700">إظهار التواريخ</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox" checked={options.compactSpacing}
                    onChange={e => setOptions({ ...options, compactSpacing: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#4a9d7c] focus:ring-[#4a9d7c]"
                  />
                  <span className="text-sm font-medium text-gray-700">وضع مكثف (Compact)</span>
                </label>
              </div>
            </div>

            {/* أزرار التحكم السفلى */}
            <div className="flex gap-4 justify-end border-t pt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleExport}
                className="px-10 py-2.5 rounded-lg text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: '#4a9d7c' }}
              >
                إنشاء الملف وتنزيله
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}