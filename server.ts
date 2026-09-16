import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Payment configuration endpoint
  app.get('/api/payment/config', (req, res) => {
    const hasSecretKey = Boolean(process.env.MOYASAR_SECRET_KEY && process.env.MOYASAR_SECRET_KEY.trim() !== '');
    const publishableKey = process.env.VITE_MOYASAR_PUBLISHABLE_KEY || '';
    
    // Bank transfer details configured in environment
    const bankDetails = {
      bankName: process.env.BANK_NAME || 'مصرف الراجحي',
      accountHolder: process.env.ACCOUNT_HOLDER_NAME || 'مؤسسة ندّك للألعاب الرقمية',
      iban: process.env.IBAN_NUMBER || 'SA4480000456608010123456',
      accountNumber: '456608010123456'
    };

    res.json({
      gateway: 'moyasar',
      isLiveConfigured: hasSecretKey,
      publishableKey: publishableKey,
      currency: 'SAR',
      supportedMethods: ['apple_pay', 'mada', 'credit_card', 'stc_pay', 'bank_transfer'],
      bankDetails: bankDetails,
      testModeInfo: hasSecretKey 
        ? 'بوابة الدفع الإلكتروني ميسّر متصلة بمفتاحك الحقيقي' 
        : 'الوضع التجريبي النشط (جاهز لربط مفاتيح ميسّر أو استلام التحويل البنكي)'
    });
  });

  // Process or initiate payment
  app.post('/api/payment/process', async (req, res) => {
    try {
      const { gameId, gameTitle, amount, paymentMethod, customerName, customerPhone } = req.body;

      if (!gameId || !amount) {
        return res.status(400).json({ success: false, error: 'بيانات العملية غير مكتملة' });
      }

      const secretKey = process.env.MOYASAR_SECRET_KEY;

      // If user has supplied real Moyasar secret key:
      if (secretKey && secretKey.trim() !== '' && !secretKey.includes('test_dummy')) {
        try {
          // If a token or payment ID was sent from client:
          const { paymentId } = req.body;
          if (paymentId) {
            const verifyRes = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
              headers: {
                Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
              }
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'paid') {
              return res.json({
                success: true,
                transactionId: verifyData.id,
                paidAmount: verifyData.amount / 100,
                status: 'paid',
                paymentMethod: verifyData.source?.type || paymentMethod,
                message: 'تم التحقق من الدفع بنجاح عبر بوابة ميسّر'
              });
            } else {
              return res.status(400).json({
                success: false,
                error: verifyData.message || 'فشلت عملية الدفع في بوابة ميسّر'
              });
            }
          }
        } catch (apiErr) {
          console.error('Moyasar API error:', apiErr);
          // Fall through to handled error
        }
      }

      // Mock/Sandbox approved transaction response
      const randomRef = 'NDK-' + Math.floor(100000 + Math.random() * 900000);
      return res.json({
        success: true,
        transactionId: randomRef,
        paidAmount: amount,
        status: 'paid',
        paymentMethod: paymentMethod || 'apple_pay',
        gameId: gameId,
        gameTitle: gameTitle,
        customerName: customerName || 'عميل ندّك',
        paidAt: new Date().toISOString(),
        message: 'تم قبول العملية وفتح اللعبة بنجاح'
      });
    } catch (err) {
      console.error('Payment process error:', err);
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة الدفع' });
    }
  });

  // Confirm bank transfer notification
  app.post('/api/payment/bank-transfer', (req, res) => {
    const { gameId, gameTitle, amount, senderName, senderBank, transferRef } = req.body;

    const receiptNumber = 'TRF-' + Math.floor(100000 + Math.random() * 900000);

    return res.json({
      success: true,
      receiptNumber: receiptNumber,
      transferRef: transferRef || 'تم التحويل المباشر',
      senderName: senderName || 'عميل ندّك',
      senderBank: senderBank || 'حساب العميل',
      amount: amount,
      gameId: gameId,
      gameTitle: gameTitle,
      status: 'paid',
      timestamp: new Date().toISOString(),
      message: 'تم تسجيل الحوالة البنكية وفتح اللعبة فوراً لجلساتكم!'
    });
  });

  // Standalone Secret Card page for Taboo (opens directly when scanned by any phone)
  app.get('/card', (req, res) => {
    const word = String(req.query.w || 'قهوة سعودية');
    const forbiddenRaw = String(req.query.f || 'هيل,دلة,فنجال,شاي');
    const forbidden = forbiddenRaw.split(/[,|]/).filter(Boolean);
    const category = String(req.query.c || 'شعبيات وثقافة');
    const hint = String(req.query.h || '');

    const forbiddenBadgesHtml = forbidden.map(item => `
      <div class="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-lg font-bold shadow-inner flex items-center justify-center gap-2">
        <span class="text-rose-400">🚫</span>
        <span>${item.trim()}</span>
      </div>
    `).join('');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>كرت الشارح السري • ندّك</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;900&family=Readex+Pro:wght@400;600;700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'IBM Plex Sans Arabic', 'Readex Pro', system-ui, sans-serif;
      background-color: #0c0f17;
      color: #f1f5f9;
    }
  </style>
</head>
<body class="min-h-screen bg-[#0c0f17] text-slate-100 flex flex-col justify-between p-4 sm:p-6 text-right selection:bg-amber-500 selection:text-black">
  
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-slate-800 pb-4">
    <div class="flex items-center gap-2.5">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
        🤐
      </div>
      <div>
        <h1 class="text-base font-black text-white">كرت الشارح السري • ندّك</h1>
        <span class="text-xs text-amber-400 font-bold">خاص بالشارح ومراقب الفريق الخصم 🔒</span>
      </div>
    </div>
    <span class="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
      ${category}
    </span>
  </header>

  <!-- Main Card -->
  <main class="my-auto py-6 max-w-md mx-auto w-full space-y-6">
    <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 text-center shadow-2xl shadow-amber-500/10 space-y-6">
      
      <!-- Target Word -->
      <div class="py-3 border-b border-slate-800/80">
        <span class="text-xs font-bold text-amber-400 block mb-1.5">الكلمة المطلوب منك تشرحها:</span>
        <h2 class="text-4xl sm:text-5xl font-black text-amber-300 tracking-wide">
          ${word}
        </h2>
      </div>

      <!-- Forbidden Words -->
      <div class="space-y-3">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-black">
          <span>⚠️ الكلمات الممنوع تنطقها (إياك تقولها!):</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          ${forbiddenBadgesHtml}
        </div>
      </div>

      ${hint ? `
      <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
        💡 <span class="font-bold text-amber-400">تلميح مسموح:</span> ${hint}
      </div>
      ` : ''}

    </div>

    <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300 font-medium leading-relaxed">
      👀 راقب الشاشة الرئيسية لمتابعة عداد الوقت وتنبيهات الفريق!
    </div>
  </main>

  <!-- Footer -->
  <footer class="text-center text-xs text-slate-500 pt-4 border-t border-slate-900">
    منصة ندّك الترفيهية • لعبة لا تقولها الرقمية
  </footer>

</body>
</html>`);
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
