import React, { useState } from 'react';
import { X, Check, Sparkles, Palette, Eye, ArrowLeft, Type } from 'lucide-react';
import { BrandLogo, LOGO_OPTIONS, LogoDesignId } from './BrandLogo';
import { soundEngine } from '../utils/audio';

interface LogoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLogo: LogoDesignId;
  onSelectLogo: (logoId: LogoDesignId) => void;
}

export const LogoSelectorModal: React.FC<LogoSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedLogo,
  onSelectLogo
}) => {
  const [previewLogo, setPreviewLogo] = useState<LogoDesignId>(selectedLogo);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (id: LogoDesignId) => {
    soundEngine.playCorrect();
    onSelectLogo(id);
    setPreviewLogo(id);
    const chosen = LOGO_OPTIONS.find(o => o.id === id);
    setNotification(`تم اعتماد «${chosen?.name}» كشعار رسمي للمنصة! ✨`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto text-right">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-5 left-5 p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>استوديو التايبوغرافي وشعارات الخط العربي لـ «ندّك»</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            اختر أسلوب التايبوغرافي الأقرب لذوقك ✍️
          </h2>
          <p className="text-sm text-slate-300">
            صممنا لك 4 معالجات تايبوغرافية متباينة بالكامل: من الخط الكوفي الهندسي الصلب، إلى أسلوب ألعاب التحدي المشطوف، والمينيمال المعاصر، والانسيابي الحر.
          </p>
        </div>

        {/* Success alert banner */}
        {notification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Live Top Navbar Preview Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>معاينة حية: كيف يظهر التايبوغرافي المختار في الشريط العلوي (Navbar)</span>
            </span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">تحديث فوري</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0a0d14] border border-slate-800/80 flex items-center justify-between">
            <BrandLogo designId={previewLogo} size="md" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">شاشة واحدة تجمعكم</span>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 font-bold border border-slate-700">
                ألعابي (0)
              </div>
            </div>
          </div>
        </div>

        {/* 4 Typography Logo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {LOGO_OPTIONS.map((option, idx) => {
            const isCurrentActive = selectedLogo === option.id;
            const isHoveredPreview = previewLogo === option.id;

            return (
              <div
                key={option.id}
                onMouseEnter={() => setPreviewLogo(option.id)}
                onClick={() => handleApply(option.id)}
                className={`relative p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrentActive
                    ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.01]'
                    : isHoveredPreview
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Active Choice Ribbon */}
                {isCurrentActive && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                    <Check className="w-3.5 h-3.5" />
                    <span>المعتمد حالياً</span>
                  </div>
                )}

                <div>
                  {/* Badge & Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      النموذج #{idx + 1} • {option.category}
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {option.badge}
                    </span>
                  </div>

                  {/* Logo Display Hero Area */}
                  <div className="py-8 px-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 mb-4 group shadow-inner">
                    <BrandLogo designId={option.id} size="xl" showSubtext={false} />
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-lg font-black text-white font-display flex items-center gap-2">
                    <span>{option.name}</span>
                  </h3>
                  <p className="text-xs text-amber-300 font-semibold mb-2">
                    {option.tagline}
                  </p>

                  {/* Deep Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {option.description}
                  </p>
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                  <span className="text-[11px] text-slate-400">
                    الطابع: {option.vibe}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(option.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>معتمد</span>
                      </>
                    ) : (
                      <>
                        <span>اعتماد هذا التايبوغرافي</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>💡 التايبوغرافي معتمد على رسم فيكتور نقي خالي من أي تشويش ليعمل بدقة عالية على أي شاشة.</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-orange-500/20"
          >
            تأكيد وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
