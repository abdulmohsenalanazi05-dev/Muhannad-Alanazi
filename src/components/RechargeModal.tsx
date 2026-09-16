import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, Zap, Loader2, Copy, Check, Sparkles 
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRecharge: (selectedPackCount?: number) => void;
  gameTitle: string;
  gamePrice: number;
  packNumber: number;
  itemLabel?: string; // 'جولات' | 'كروت' | 'أسئلة' | 'ألغاز'
  remainingStockCount: number;
  categoryOrDetails?: string;
  packCount?: number;
  allowCountToggle?: boolean;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onConfirmRecharge,
  gameTitle,
  gamePrice,
  packNumber,
  itemLabel = 'جولات',
  remainingStockCount,
  categoryOrDetails,
  packCount = 10,
  allowCountToggle = true
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'apple' | 'mada' | 'card' | 'bank'>('apple');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [currentCount, setCurrentCount] = useState<number>(packCount);

  // Sync state if prop changes
  useEffect(() => {
    setCurrentCount(packCount);
  }, [packCount]);

  if (!isOpen) return null;

  const handlePay = () => {
    soundEngine.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      soundEngine.playVictory();
      onConfirmRecharge(currentCount);
      onClose();
    }, 1400);
  };

  const copyIban = () => {
    navigator.clipboard.writeText('SA4480000456608010123456');
    setCopiedIban(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedIban(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full text-right space-y-4 shadow-2xl shadow-amber-500/20 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام باقات الـ {currentCount} {itemLabel} 📦</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-display">
            شحن {currentCount} {itemLabel} جديدة 💳
          </h3>
          <p className="text-xs text-slate-300">
            الباقة رقم #{packNumber} في لعبة {gameTitle} - {currentCount} {itemLabel} جديدة كلياً بدون تكرار!
          </p>
        </div>

        {/* Option to toggle pack size */}
        {allowCountToggle && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              اختر حجم باقة الشحن:
            </label>
            {itemLabel === 'أسئلة' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCount(10);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    currentCount === 10
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>10 أسئلة ⚡</span>
                  <span className="text-[10px] text-emerald-400 font-black mt-0.5">14 ر.س</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCount(15);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    currentCount === 15
                      ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-orange-500 text-orange-300 font-black shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>15 سؤالاً 🔥</span>
                  <span className="text-[10px] text-emerald-400 font-black mt-0.5">19 ر.س</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCount(20);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    currentCount === 20
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>20 سؤالاً 🏆</span>
                  <span className="text-[10px] text-emerald-400 font-black mt-0.5">24 ر.س</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCount(10);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    currentCount === 10
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⚡ 10 {itemLabel} (سريعة)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCurrentCount(15);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    currentCount === 15
                      ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-orange-500 text-orange-300 font-black shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🔥 15 {itemLabel} (حماسية)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Package Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          {categoryOrDetails && (
            <div className="flex items-center justify-between text-slate-300">
              <span>القسم / التحديد:</span>
              <strong className="text-white">{categoryOrDetails}</strong>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-300">
            <span>محتوى الباقة:</span>
            <strong className="text-amber-400 font-bold">{currentCount} {itemLabel} جديدة بالكامل</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>المتبقي في المخزون:</span>
            <strong className="text-emerald-400 font-bold">{remainingStockCount} {itemLabel} متاحة</strong>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
            <span className="font-bold text-white">المبلغ الإجمالي:</span>
            <strong className="text-lg font-black text-amber-400 font-display">
              {itemLabel === 'أسئلة' 
                ? (currentCount === 10 ? 14 : currentCount === 20 ? 24 : 19)
                : gamePrice
              } ر.س
            </strong>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 block">اختر وسيلة الدفع:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedPaymentMethod('apple');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedPaymentMethod === 'apple'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span> Pay</span>
              <span>Apple Pay</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedPaymentMethod('mada');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedPaymentMethod === 'mada'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💳</span>
              <span>مدى (Mada)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedPaymentMethod('card');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedPaymentMethod === 'card'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💳</span>
              <span>بطاقة ائتمانية</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedPaymentMethod('bank');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedPaymentMethod === 'bank'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏦</span>
              <span>تحويل بنكي</span>
            </button>
          </div>

          {/* Bank Transfer Details */}
          {selectedPaymentMethod === 'bank' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span>البنك:</span>
                <strong className="text-white">مصرف الراجحي</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>الآيبان (IBAN):</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-[11px] text-amber-300">SA4480000456608010123456</code>
                  <button
                    type="button"
                    onClick={copyIban}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          disabled={isProcessing}
          onClick={handlePay}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-display flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري معالجة الدفع وتفعيل الـ 10 {itemLabel}...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-current" />
              <span>تأكيد الدفع وشحن 10 {itemLabel} ({gamePrice} ر.س)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>دفع آمن 100% ومشفر عبر بوابات الدفع الوطنية المعتمدة</span>
        </div>
      </div>
    </div>
  );
};
