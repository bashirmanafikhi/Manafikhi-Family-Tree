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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" dir="rtl">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2d2926' }}>إعدادات التصدير لـ Excalidraw</h2>
            
            <div className="space-y-4 mb-6 text-right">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>تخطيط الشجرة</label>
                <select 
                  className="input-field w-full" 
                  value={options.layout} 
                  onChange={e => setOptions({...options, layout: e.target.value as any})}
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
                  onChange={e => setOptions({...options, maxGenerations: Number(e.target.value)})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>زاوية النص</label>
                <select 
                  className="input-field w-full" 
                  value={options.textAngle} 
                  onChange={e => setOptions({...options, textAngle: Number(e.target.value)})}
                >
                  <option value={0}>0 (أفقي)</option>
                  <option value={45}>45 درجة</option>
                  <option value={90}>90 درجة (عمودي)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>نمط الخطوط (Line Style)</label>
                <select 
                  className="input-field w-full" 
                  value={options.lineStyle} 
                  onChange={e => setOptions({...options, lineStyle: e.target.value as any})}
                >
                  <option value="solid">متصل (Solid)</option>
                  <option value="dashed">متقطع (Dashed)</option>
                  <option value="dotted">منقط (Dotted)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b6560' }}>زوايا الخطوط (Line Sharpness)</label>
                <select 
                  className="input-field w-full" 
                  value={options.lineSharpness} 
                  onChange={e => setOptions({...options, lineSharpness: e.target.value as any})}
                >
                  <option value="round">منحني (Round / Curved)</option>
                  <option value="sharp">حادة (Sharp)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: '#ede8e0' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={options.useRectangles} 
                    onChange={e => setOptions({...options, useRectangles: e.target.checked})}
                    className="w-4 h-4 text-[#0d5c63]"
                  />
                  <span className="text-sm">استخدام المربعات (إلغاء التحديد لاستخدام نقاط)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={options.includeDates} 
                    onChange={e => setOptions({...options, includeDates: e.target.checked})}
                    className="w-4 h-4 text-[#0d5c63]"
                  />
                  <span className="text-sm">تضمين تواريخ الميلاد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={options.compactSpacing} 
                    onChange={e => setOptions({...options, compactSpacing: e.target.checked})}
                    className="w-4 h-4 text-[#0d5c63]"
                  />
                  <span className="text-sm">تضييق المسافات (Compact Spacing)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsOpen(false)} className="btn-outline">
                إلغاء
              </button>
              <button onClick={handleExport} className="btn-primary" style={{ backgroundColor: '#4a9d7c', color: 'white', border: 'none' }}>
                تصدير
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
