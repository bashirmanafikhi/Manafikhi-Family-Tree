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
      <button onClick={() => setIsOpen(true)} className="btn-outline flex items-center gap-2" style={{ borderColor: '#4a9d7c', color: '#4a9d7c' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        تصدير لـ Excalidraw
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* تم تغيير max-w-md إلى max-w-2xl لزيادة العرض */}
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]" dir="rtl">
            <h2 className="text-xl font-bold mb-6 border-b pb-2" style={{ color: '#2d2926' }}>إعدادات التصدير لـ Excalidraw</h2>

            {/* استخدام Grid لتوزيع العناصر على عمودين */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6 text-right">

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>تخطيط الشجرة</label>
                <select
                  className="input-field w-full"
                  value={options.layout}
                  onChange={e => setOptions({ ...options, layout: e.target.value as any })}
                >
                  <option value="vertical">عمودي (Vertical)</option>
                  <option value="horizontal">أفقي (Horizontal)</option>
                  <option value="radial">دائري (Radial)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>عدد الأجيال</label>
                <input
                  type="number"
                  className="input-field w-full"
                  min="1" max="20"
                  value={options.maxGenerations}
                  onChange={e => setOptions({ ...options, maxGenerations: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>زاوية النص</label>
                <select
                  className="input-field w-full"
                  value={options.textAngle}
                  onChange={e => setOptions({ ...options, textAngle: Number(e.target.value) })}
                >
                  <option value={0}>0 (أفقي)</option>
                  <option value={45}>45 درجة</option>
                  <option value={90}>90 درجة (عمودي)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>نمط الخطوط</label>
                <select
                  className="input-field w-full"
                  value={options.lineStyle}
                  onChange={e => setOptions({ ...options, lineStyle: e.target.value as any })}
                >
                  <option value="solid">متصل (Solid)</option>
                  <option value="dashed">متقطع (Dashed)</option>
                  <option value="dotted">منقط (Dotted)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>زوايا الخطوط</label>
                <select
                  className="input-field w-full"
                  value={options.lineSharpness}
                  onChange={e => setOptions({ ...options, lineSharpness: e.target.value as any })}
                >
                  <option value="round">منحني (Round)</option>
                  <option value="sharp">حادة (Sharp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>اتجاه الشجرة</label>
                <select
                  className="input-field w-full"
                  value={options.direction}
                  onChange={e => setOptions({ ...options, direction: e.target.value as any })}
                >
                  <option value="rtl">من اليمين لليسار (RTL)</option>
                  <option value="ltr">من اليسار لليمين (LTR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>المسافة بين الأجيال</label>
                <input
                  type="number"
                  className="input-field w-full"
                  min="50" max="1000" step="10"
                  value={options.generationSpacing}
                  onChange={e => setOptions({ ...options, generationSpacing: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>سماكة الخط ({options.strokeWidth}px)</label>
                <input
                  type="range"
                  className="w-full h-10"
                  min="1" max="4" step="1"
                  value={options.strokeWidth}
                  onChange={e => setOptions({ ...options, strokeWidth: Number(e.target.value) })}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>شفافية الروابط ({options.linkOpacity}%)</label>
                <input
                  type="range"
                  className="w-full h-10"
                  min="10" max="100" step="10"
                  value={options.linkOpacity}
                  onChange={e => setOptions({ ...options, linkOpacity: Number(e.target.value) })}
                />
              </div>

              {/* قسم الخيارات المنطقية (Checkbox) يمتد على العمودين */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2" style={{ borderColor: '#ede8e0' }}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={options.useRectangles}
                    onChange={e => setOptions({ ...options, useRectangles: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0d5c63]"
                  />
                  <span className="text-sm group-hover:text-black">استخدام المربعات</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={options.includeDates}
                    onChange={e => setOptions({ ...options, includeDates: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0d5c63]"
                  />
                  <span className="text-sm group-hover:text-black">تضمين التواريخ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={options.compactSpacing}
                    onChange={e => setOptions({ ...options, compactSpacing: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0d5c63]"
                  />
                  <span className="text-sm group-hover:text-black">تضييق المسافات</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              <button onClick={() => setIsOpen(false)} className="btn-outline px-6">
                إلغاء
              </button>
              <button onClick={handleExport} className="btn-primary px-8" style={{ backgroundColor: '#4a9d7c', color: 'white', border: 'none' }}>
                تصدير الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}