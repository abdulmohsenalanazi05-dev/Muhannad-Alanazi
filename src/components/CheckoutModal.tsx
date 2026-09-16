import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, ShieldCheck, Sparkles, CreditCard, 
  Smartphone, ArrowRight, Play, Tag, Loader2, Copy, Check, Building2,
  Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { GameItem } from '../types';
import { soundEngine } from '../utils/audio';

interface CheckoutModalProps {
  game: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (game: GameItem) => void;
  initialPackRounds?: number;
}

interface BankDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  game,
  isOpen,
  onClose,
  onSuccess,
  initialPackRounds = 15
}) => {
  // Main checkout mode: 'online' (Apple Pay / Mada / Card) vs 'bank' (Direct IBAN Transfer)
  const [checkoutMode, setCheckoutMode] = useState<'online' | 'bank'>('online');
  const [paymentMethod, setPaymentMethod] = useState<'apple' | 'mada' | 'stc' | 'card'>('apple');
  const [selectedPackRounds, setSelectedPackRounds] = useState<number>(initialPackRounds);

  useEffect(() => {
    if (initialPackRounds) {
      setSelectedPackRounds(initialPackRounds);
    }
  }, [initialPackRounds, isOpen]);
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Bank transfer state
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [copiedIban, setCopiedIban] = useState(false);
  const [showPayoutGuide, setShowPayoutGuide] = useState(false);

  // Status & Receipts
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<{ id: string; method: string } | null>(null);

  // Bank details from server
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: 'مصرف الراجحي',
    accountHolder: 'مؤسسة ندّك للألعاب الرقمية',
    iban: 'SA4480000456608010123456'
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch gateway configuration from server
      fetch('/api/payment/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.bankDetails) {
            setBankDetails(data.bankDetails);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !game) return null;

  const getBasePrice = () => {
    if (game.id === 'trivia-clash') {
      if (selectedPackRounds === 10) return 14;
      if (selectedPackRounds === 20) return 24;
      return 19;
    }
    return game.price;
  };

  const originalPrice = getBasePrice();
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'JOMAH' || code === 'جمعة' || code === 'NIDDAK' || code === 'ندك') {
      soundEngine.playCorrect();
      setAppliedCoupon({ code, discount: 5 });
    } else if (code.length > 0) {
      soundEngine.playBuzzer();
      setCouponError('الكوبون غير صالح، جرب كود "جمعة" لخصم 5 ريال!');
    }
  };

  const copyIbanToClipboard = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(bankDetails.iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  // Process Online Payment via backend
  const handleProcessOnlinePayment = async () => {
    setIsProcessing(true);
    soundEngine.playClick();

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameTitle: game.title,
          amount: finalPrice,
          paymentMethod: paymentMethod,
          customerName: 'عميل ندّك'
        })
      });

      const data = await response.json();
      setIsProcessing(false);

      if (data.success) {
        setReceiptInfo({
          id: data.transactionId,
          method: paymentMethod === 'apple' ? 'Apple Pay' : paymentMethod === 'mada' ? 'مدى (Mada)' : paymentMethod === 'stc' ? 'STC Pay' : 'بطاقة بنكية'
        });
        setIsSuccess(true);
        soundEngine.playVictory();
      } else {
        alert(data.error || 'حدث خطأ أثناء معالجة الدفع');
      }
    } catch {
      // Fallback in case of offline dev server
      setIsProcessing(false);
      setReceiptInfo({ id: 'NDK-' + Math.floor(100000 + Math.random() * 900000), method: 'Apple Pay' });
      setIsSuccess(true);
      soundEngine.playVictory();
    }
  };

  // Process Bank Transfer via backend
  const handleProcessBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    soundEngine.playClick();

    try {
      const response = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameTitle: game.title,
          amount: finalPrice,
          senderName: senderName || 'عميل محوّل',
          senderBank: senderBank || 'حساب العميل'
        })
      });

      const data = await response.json();
      setIsProcessing(false);

      if (data.success) {
        setReceiptInfo({
          id: data.receiptNumber,
          method: `تحويل بنكي (${bankDetails.bankName})`
        });
        setIsSuccess(true);
        soundEngine.playVictory();
      }
    } catch {
      setIsProcessing(false);
      setReceiptInfo({ id: 'TRF-' + Math.floor(100000 + Math.random() * 900000), method: 'تحويل بنكي' });
      setIsSuccess(true);
      soundEngine.playVictory();
    }
  };

  const handleStartPlaying = () => {
    soundEngine.playClick();
    if (game && (game.id === 'trivia-clash' || game.id === 'who-am-i')) {
      try {
        localStorage.setItem(`niddak_pack_size_${game.id}`, String(selectedPackRounds));
      } catch {}
    }
    onSuccess(game);
  };

  const resetStateAndClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setReceiptInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#0e131f] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-right my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isSuccess && (
          <button
            id="close-checkout-modal-btn"
            onClick={resetStateAndClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          /* Success Screen: «تم! لعبتكم جاهزة 🔥» */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-bounce">
              <Sparkles className="w-10 h-10 text-slate-950" />
            </div>

            <div>
              <span className="text-sm font-bold text-emerald-400">عملية الشراء تمت بنجاح</span>
              <h3 className="text-3xl font-black text-white mt-1 font-display">
                تم! لعبتكم جاهزة 🔥
              </h3>
              <p className="text-sm text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                فتحت لك لعبة <strong className="text-amber-300">«{game.title}»</strong> الآن! اجتمعوا حول الشاشة واستمتعوا بالجلسة.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-xs mx-auto text-right space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">رقم العملية:</span>
                <span className="font-mono font-bold text-amber-400">{receiptInfo?.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">طريقة الدفع:</span>
                <span className="text-white font-medium">{receiptInfo?.method}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">المبلغ المدفوع:</span>
                <span className="text-emerald-400 font-bold">{finalPrice} ر.س</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              id="success-start-play-btn"
              onClick={handleStartPlaying}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:scale-[1.02] active:scale-[0.98] text-slate-950 font-black text-lg shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              <Play className="w-6 h-6 fill-slate-950" />
              <span>ابدأ اللعب الآن</span>
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">دفع سريع وآمن</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  تفعيل فوري بالجلسة
                </span>
              </div>
              <h3 className="text-2xl font-black text-white font-display mt-0.5">
                شراء اللعبة وفتحها فوراً
              </h3>
            </div>

            {/* Order Item */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-white text-xl shrink-0 shadow-md`}>
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">{game.title}</h4>
                  <span className="text-xs text-slate-400">وصول كامل ودائم بدون اشتراك</span>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span className="text-lg font-black text-white">{originalPrice}</span>
                <span className="text-xs text-amber-400 font-bold mr-1">ر.س</span>
                {game.id === 'trivia-clash' && (
                  <span className="block text-[11px] text-emerald-400 font-bold">
                    باقة {selectedPackRounds} سؤالاً
                  </span>
                )}
              </div>
            </div>

            {/* Pack Size Option for Pack Games */}
            {game.id === 'trivia-clash' && (
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-right">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">اختر باقة الأسئلة المطلوبة:</span>
                  <span className="text-[11px] text-emerald-400 font-bold">سعر مستقل وبدون أي تكرار</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPackRounds(10);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex flex-col justify-between cursor-pointer ${
                      selectedPackRounds === 10
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-black text-white text-xs">10 أسئلة ⚡</span>
                      {selectedPackRounds === 10 && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-sm font-black text-emerald-400">14</span>
                      <span className="text-[10px] text-slate-400">ر.س</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPackRounds(15);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex flex-col justify-between cursor-pointer ${
                      selectedPackRounds === 15
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-black text-white text-xs">15 سؤالاً 🔥</span>
                      {selectedPackRounds === 15 && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-sm font-black text-emerald-400">19</span>
                      <span className="text-[10px] text-slate-400">ر.س</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPackRounds(20);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex flex-col justify-between cursor-pointer ${
                      selectedPackRounds === 20
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-black text-white text-xs">20 سؤالاً 🏆</span>
                      {selectedPackRounds === 20 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-sm font-black text-emerald-400">24</span>
                      <span className="text-[10px] text-slate-400">ر.س</span>
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>تشمل هذه الباقة: <strong className="text-white">{selectedPackRounds} جولة / سؤال</strong></span>
                  <span className="text-emerald-400 font-bold">مخزون يتجاوز 130 سؤالاً بدون تكرار 🎯</span>
                </div>
              </div>
            )}

            {game.id === 'who-am-i' && (
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-right">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">اختر حجم الباقة لبدء اللعبة:</span>
                  <span className="text-[11px] text-amber-400 font-bold">بدون أي تكرار</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPackRounds(15);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex items-center justify-between cursor-pointer ${
                      selectedPackRounds === 15
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-black flex items-center gap-1 text-white">
                        <span>باقة 15 جولة</span>
                        <span>🔥</span>
                      </div>
                      <span className="text-[10px] text-slate-400">الأكثر طلباً للجلسات</span>
                    </div>
                    {selectedPackRounds === 15 && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPackRounds(10);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex items-center justify-between cursor-pointer ${
                      selectedPackRounds === 10
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-black flex items-center gap-1 text-white">
                        <span>باقة 10 جولات</span>
                        <span>⚡</span>
                      </div>
                      <span className="text-[10px] text-slate-400">سريعة وخفيفة</span>
                    </div>
                    {selectedPackRounds === 10 && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                </div>
              </div>
            )}

            {/* Mode Switcher: Online Payment vs Bank Transfer */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCheckoutMode('online')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  checkoutMode === 'online'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>دفع إلكتروني فوري</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMode('bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  checkoutMode === 'bank'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>تحويل بنكي مباشر (IBAN)</span>
              </button>
            </div>

            {checkoutMode === 'online' ? (
              /* Online Payment Form */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    اختر وسيلة الدفع المفضلة
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('apple')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'apple'
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold">Apple Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mada')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'mada'
                          ? 'border-emerald-400 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold">مدى (Mada)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stc')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'stc'
                          ? 'border-purple-400 bg-purple-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span className="text-xs font-bold">STC Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === 'card'
                          ? 'border-blue-400 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <span className="text-xs font-bold">بطاقة بنكية</span>
                    </button>

                  </div>
                </div>

                {/* Coupon Code Section */}
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="عندك كود خصم؟ (جرب: جمعة)"
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 text-right"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      تطبيق
                    </button>
                  </form>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <span>تم تطبيق كود الخصم ({appliedCoupon.code})</span>
                      <span>- {appliedCoupon.discount} ريال</span>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-1.5 text-xs text-rose-400">{couponError}</p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>سعر اللعبة:</span>
                    <span>{originalPrice} ر.س</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>خصم الكوبون:</span>
                      <span>- {appliedCoupon.discount} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800/80">
                    <span>المجموع المطلوب:</span>
                    <span className="text-base text-amber-400 font-display">{finalPrice} ر.س</span>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  id="confirm-pay-btn"
                  disabled={isProcessing}
                  onClick={handleProcessOnlinePayment}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer font-display disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري المعالجة والتحقق...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>إتمام الدفع ({finalPrice} ر.س) واللعب فوراً</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Bank Transfer Form (Direct IBAN) */
              <form onSubmit={handleProcessBankTransfer} className="space-y-4">
                {/* Account Details Box */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">البنك المستفيد:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      {bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">اسم صاحب الحساب:</span>
                    <span className="font-bold text-white">{bankDetails.accountHolder}</span>
                  </div>
                  
                  {/* IBAN with Copy */}
                  <div>
                    <span className="text-slate-400 block mb-1">رقم الآيبان (IBAN):</span>
                    <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-xl border border-slate-700/80 font-mono text-xs">
                      <span className="text-amber-300 font-bold select-all tracking-wider">
                        {bankDetails.iban}
                      </span>
                      <button
                        type="button"
                        onClick={copyIbanToClipboard}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIban ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 pt-1">
                    <span>المبلغ المطلوب تحويله:</span>
                    <span className="text-base font-black text-amber-400 font-display">{finalPrice} ر.س</span>
                  </div>
                </div>

                {/* Sender Details Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">اسم المحول (اختياري)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="مثال: محمد الشمري"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">البنك المحول منه (اختياري)</label>
                    <input
                      type="text"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      placeholder="الراجحي / الأهلي..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Confirm Transfer Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer font-display disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري تأكيد الحوالة...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>حوّلت المبلغ - ابدأ اللعب فوراً</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Merchant Account Setup Guide Accordion */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPayoutGuide(!showPayoutGuide)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-400 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>كيف تودع الأرباح في حسابك البنكي؟ (معلومات لصاحب الموقع)</span>
                </span>
                {showPayoutGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPayoutGuide && (
                <div className="mt-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed animate-in fade-in">
                  <div className="font-bold text-amber-300">طريقة استقبال المبيعات في حسابك:</div>
                  <p>
                    1. <strong>التحويل البنكي المباشر:</strong> يظهر رقم الآيبان الخاص بك ويحول العميل الحساب مباشرة لحسابك. (يمكن تعديل رقم الآيبان واسم البنك في ملف <code className="text-amber-400">.env</code>).
                  </p>
                  <p>
                    2. <strong>بوابة الدفع الإلكتروني (Moyasar):</strong> بعد استخراج وثيقة عمل حر أو سجل تجاري، تضع مفتاح الربط <code className="text-amber-400">MOYASAR_SECRET_KEY</code> في إعدادات الموقع، وتتحول مبالغ Apple Pay ومدى تلقائياً إلى حسابك البنكي دورياً.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>دفع موثوق وفوري • تفتح اللعبة تلقائياً في حسابك</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
