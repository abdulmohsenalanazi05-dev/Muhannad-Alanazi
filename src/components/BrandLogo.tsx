import React from 'react';

export type LogoDesignId = 
  | 'bold-kufic'          // تايبوغرافي كوفي ناري جريء بكتلة صلبة مع شدة ونقطة ألماسة
  | 'modern-athletic'     // تايبوغرافي ألعاب وحماس بتدرج نيون وزوايا مقطوعة مائلة
  | 'minimal-stacked'     // تايبوغرافي مينيمال مونوكروم فاخر مع تشكيل الشدة
  | 'flowing-calligraphy' // تايبوغرافي حر بانحناءات متدفقة وروح شبابية

export interface LogoOption {
  id: LogoDesignId;
  name: string;
  category: string;
  tagline: string;
  description: string;
  badge: string;
  vibe: string;
}

export const LOGO_OPTIONS: LogoOption[] = [
  {
    id: 'bold-kufic',
    name: 'الكوفي الصلب (Bold Geometric Kufic)',
    category: 'تايبوغرافي هندسي فخم',
    tagline: 'حضور قوي، ثبات، وتفاصيل محسوبة بالمللي',
    description: 'رسم تايبوغرافي لـ «ندّك» بخط كوفي عريض وثقيل (Heavy weight). دمج النون مع الدال بحواف حادة، مع كاف مستقيمة وشدّة هندسية بارزة ونقطة ألماسة.',
    badge: 'هيبة وثبات ⚡',
    vibe: 'صلب، واثق، وعصري'
  },
  {
    id: 'modern-athletic',
    name: 'الرياضي التنافسي (Dynamic Gaming Cut)',
    category: 'تايبوغرافي ألعاب وتحدي',
    tagline: 'سرعة، زوايا مائلة، وروح «الند للند»',
    description: 'حروف مائلة للأمام (Forward italic slant) بزوايا مشطوفة ومقطوعة هندسياً مثل شعارات بطولات الألعاب الإلكترونية العالمية، يصرخ بالتحدي والحماس.',
    badge: 'حماسي وتنافسي 🔥',
    vibe: 'سريع، مشحون بالطاقة، وتنافسي'
  },
  {
    id: 'minimal-stacked',
    name: 'المينيمال المعاصر (High-End Tech Minimal)',
    category: 'تايبوغرافي تبسيطي فاخر',
    tagline: 'نقاء بصري، بدون تدرجات معقدة، فخامة مطلقة',
    description: 'تصميم تايبوغرافي صريح ومينيمال بلون أبيض ناصع مع لمسة برتقالية متباينة في الشدة والنقطة. وضوح فوري على الشاشات الكبيرة والموبايل.',
    badge: 'مينيمال وفخم ✨',
    vibe: 'نظيف، مريح للعين، وشديد الاحترافية'
  },
  {
    id: 'flowing-calligraphy',
    name: 'السنبلي المعاصر (Dynamic Neo-Arabic)',
    category: 'تايبوغرافي انسيابي شبابي',
    tagline: 'حركة وانحناءات رشيقة مفعمة بالحياة ولمّة الأصحاب',
    description: 'مزيج بين انسيابية الحروف العربية وطاقة الشارع العصرية، حيث تلتف نقطة النون والشدة في قوس متكامل يعبر عن اللمة والضحك الصافي.',
    badge: 'شبابي وانسيابي 🎯',
    vibe: 'مرح، عفوي، ومتناسق'
  }
];

interface BrandLogoProps {
  designId?: LogoDesignId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  designId = 'bold-kufic',
  size = 'md',
  showSubtext = true,
  className = ''
}) => {
  // Height and scale configuration per size
  const scaleMap = {
    sm: { height: 26, subTextSize: 'text-[10px]' },
    md: { height: 34, subTextSize: 'text-xs' },
    lg: { height: 48, subTextSize: 'text-sm' },
    xl: { height: 70, subTextSize: 'text-base' }
  };

  const current = scaleMap[size];

  // Vector Logotypes for "ندّك"
  const renderLogotype = () => {
    switch (designId) {
      case 'bold-kufic':
        // Modern heavy geometric Kufic wordmark with diamond dot & stylized shaddah
        return (
          <svg
            viewBox="0 0 170 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: current.height, width: 'auto' }}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="kuficGrad" x1="0" y1="20" x2="170" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="0.6" stopColor="#F97316" />
                <stop offset="1" stopColor="#EF4444" />
              </linearGradient>
            </defs>

            {/* Letter Noon (نـ) on the right (RTL: rightmost) */}
            {/* Noon starting tooth */}
            <path
              d="M158 14H144V34H116"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Diamond dot for Noon */}
            <path
              d="M151 2L157 8L151 14L145 8Z"
              fill="url(#kuficGrad)"
            />

            {/* Letter Dal (ـدّ) connected in the middle with heavy base */}
            <path
              d="M116 16V34H68"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Prominent stylized Shaddah (ّ) over the Dal */}
            <path
              d="M106 4V10H98V4M98 10H90V4"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Letter Kaf (ـك) on the left */}
            {/* Kaf upper stem and base */}
            <path
              d="M68 34H26V10"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Upper diagonal arm of Kaf */}
            <path
              d="M26 10L56 10"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="square"
            />
            {/* Inner Hemzah / accent in Kaf */}
            <path
              d="M38 24H50V20H42"
              stroke="url(#kuficGrad)"
              strokeWidth="4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Subtle game corner marker on the end tail */}
            <rect x="12" y="34" width="8" height="10" fill="#F59E0B" />
          </svg>
        );

      case 'modern-athletic':
        // Forward italic slant with chamfered corners & competitive gaming cuts
        return (
          <svg
            viewBox="0 0 175 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: current.height, width: 'auto' }}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="athleticGrad" x1="20" y1="0" x2="160" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#EA580C" />
              </linearGradient>
            </defs>

            <g transform="skewX(-14)">
              {/* Noon (نـ) */}
              <path
                d="M162 14V36H120"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="butt"
                strokeLinejoin="miter"
              />
              {/* Slanted dot of Noon */}
              <polygon
                points="162,1 170,1 164,9 156,9"
                fill="url(#athleticGrad)"
              />

              {/* Dal (ـدّ) with cut edge */}
              <path
                d="M120 16V36H70"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="butt"
                strokeLinejoin="miter"
              />
              {/* Sleek chevron Shaddah */}
              <path
                d="M110 5L103 11L96 5L89 11"
                stroke="#FBBF24"
                strokeWidth="4"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />

              {/* Kaf (ـك) */}
              <path
                d="M70 36H28V8H64"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="butt"
                strokeLinejoin="miter"
              />
              {/* Dynamic neon slice inside Kaf */}
              <line
                x1="36"
                y1="22"
                x2="56"
                y2="22"
                stroke="url(#athleticGrad)"
                strokeWidth="5"
                strokeLinecap="butt"
              />
            </g>
          </svg>
        );

      case 'minimal-stacked':
        // Pristine high-end minimalist font architecture
        return (
          <svg
            viewBox="0 0 160 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: current.height, width: 'auto' }}
            className="overflow-visible"
          >
            {/* Letter Noon (نـ) */}
            <path
              d="M148 18V38H112"
              stroke="#F8FAFC"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Perfect circular dot for Noon in Amber */}
            <circle cx="148" cy="8" r="5" fill="#F59E0B" />

            {/* Letter Dal (ـدّ) */}
            <path
              d="M112 18V38H64"
              stroke="#F8FAFC"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Minimal dual arc Shaddah */}
            <path
              d="M102 8C102 5 97 5 97 8C97 5 92 5 92 8"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Letter Kaf (ـك) */}
            <path
              d="M64 38H24C20 38 18 36 18 32V14"
              stroke="#F8FAFC"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 14C24 14 36 14 56 14"
              stroke="#F8FAFC"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Subtle floating inner sign */}
            <circle cx="38" cy="26" r="3" fill="#F59E0B" />
          </svg>
        );

      case 'flowing-calligraphy':
        // Neo-Arabic fluid and energetic curves with joyful rhythm
        return (
          <svg
            viewBox="0 0 170 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: current.height, width: 'auto' }}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="20" x2="170" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="0.5" stopColor="#FB923C" />
                <stop offset="1" stopColor="#F43F5E" />
              </linearGradient>
            </defs>

            {/* Continuous fluid calligraphic baseline */}
            <path
              d="M154 14C154 26 150 36 138 36C126 36 122 28 116 18C110 28 102 36 86 36C70 36 64 26 56 14C50 28 42 36 22 36"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Kaf sweeping upper stroke */}
            <path
              d="M24 36C18 36 16 30 18 22L28 8C34 6 52 6 62 10"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Flowing floating dot above Noon */}
            <circle cx="150" cy="5" r="4.5" fill="url(#flowGrad)" />

            {/* Fluid energetic wave as Shaddah */}
            <path
              d="M106 8C108 5 112 5 114 8C116 5 120 5 122 8"
              stroke="url(#flowGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Accent smile/dot under the Dal */}
            <path
              d="M74 44C78 46 86 46 90 44"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* The Typographic Wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          {renderLogotype()}
          
          {showSubtext && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap self-center mr-1">
              ألعاب جمعات
            </span>
          )}
        </div>

        {showSubtext && size !== 'sm' && (
          <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-1 hidden sm:block">
            مو بس لعبة… جمعة
          </p>
        )}
      </div>
    </div>
  );
};
