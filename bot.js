const { Telegraf } = require('telegraf');

// =============== التوكن حقك ===============
const BOT_TOKEN = '8817608659:AAF8O-I58x-khZLq4AzY-OWTyfgPIcNEo1M';
const bot = new Telegraf(BOT_TOKEN);

// =============== قاعدة بيانات ===============
const users = new Map(); // id -> { verified, phone, step, target, count, delay }
const activeSpams = new Map(); // id -> { interval, type }

// =============== كلمات التكليش ===============
const TAKLEESH_WORDS = [
    "لحلكك الهالبك طيزمك", "اشيلك بعيري", "عبالك اعوفك؟", "انيجمك علصدرك", "ابن الزانيه",
    "غير انت ابني", "مصمص عيورتي", "اهف اختك بطرف عيري", "اربطك بقياطين قندرتي",
    "اشيل ربك واركعه بلكاع", "ابن الكحبه الستشرافيه", "ابن المراهقه", "امصمص ديوس اختك",
    "ابن بلاعت العيرين", "احط الويسكي بكس اختك", "اتفل بصرمك", "اصابعي تفترسك",
    "ابعبص صريمك", "ابن المتبربكه", "اطحن ضلوعك", "اكهرب طيزك", "احط قضيبي بكس امك",
    "اسوي كسيسمك طشار", "اشكشك ديوسك", "اقتحم نسلك", "اشلع راس اختك", "اطب بين زرورك",
    "ابن الهايته", "ابن الانزلاقيه", "ادحس عيري بكسمك", "ادك كسمك", "اخدر امك",
    "انيج امك الكحبه", "ربك اسمطه", "اعبد زبي", "المخنث", "اصعق صريمك", "احط الدروب بطيزك",
    "اطشر صريمك", "ادحس البنكه بصرمك", "انيج اختك البربوك", "افلشك تفليش", "دمبك العير",
    "اذب تيزاب بكسمك", "افرش كسمك", "انيج رب ربك", "افترس طيزك", "اخدر طيزختك",
    "اضربمك", "انيجمك فرنسي", "اخرمش طيزك", "العب بوبجي بكسمك", "الفيمبوي", "اتنايج وي اهلك"
];

// =============== كلمات التسطير ===============
const TASTEER_WORDS = [
    "القحاب", "يا اخو الشرموطه", "يا ابن الوسيعه", "يا ديوث", "يا ابن القحبه",
    "يا خنيث", "الخنيث", "يا ابن الديوث", "يا ابن الزب", "اصمل بنيك", "عار امك",
    "يا مخنث", "يا ابن الكس", "يا ابن الهايته", "يا حمار", "يا فحل اختك",
    "يا كس امك", "يا زب الكلب", "يا ابن المتناكه", "يا شرمطه", "يا عاهر", "يا خول", "يا قواد"
];

// =============== دوال مساعدة ===============
function isVerified(userId) {
    const user = users.get(userId);
    return user && user.verified === true;
}

function stopSpam(userId) {
    if (activeSpams.has(userId)) {
        clearInterval(activeSpams.get(userId).interval);
        activeSpams.delete(userId);
    }
}

// توليد كود عشوائي
function generateCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// إرسال كود وهمي (لأنه ما في SMS حقيقي)
function sendFakeCode(phone, code) {
    console.log(`📱 كود وهمي مرسل إلى ${phone}: ${code}`);
    return true;
}

// =============== الأوامر ===============
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    if (isVerified(userId)) {
        await ctx.reply('✅ أنت مسجل الدخول بالفعل.\nاستخدم:\n/takleesh - للتكليش\n/tasteer - للتسطير\n/stop - للإيقاف');
    } else {
        await ctx.reply('🔐 مرحبًا بك في بوت فشار.\nاستخدم /login لتسجيل الدخول');
    }
});

// أمر تسجيل الدخول
bot.command('login', async (ctx) => {
    const userId = ctx.from.id;
    if (isVerified(userId)) {
        await ctx.reply('✅ أنت مسجل بالفعل.');
        return;
    }
    
    users.set(userId, { step: 'waiting_phone' });
    await ctx.reply('📱 أرسل رقم هاتفك مع رمز الدولة\nمثال: +9647701234567');
});

// استقبال الرقم
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);
    const text = ctx.message.text;
    
    if (!user) return;
    
    // خطوة استقبال الرقم
    if (user.step === 'waiting_phone' && text.startsWith('+')) {
        const code = generateCode();
        sendFakeCode(text, code);
        
        users.set(userId, { step: 'waiting_code', phone: text, tempCode: code });
        await ctx.reply(`✅ تم إرسال كود التفعيل إلى رقمك: ${text}\nأدخل الكود **بمسافات** بين كل رقم:\nمثال: ${code.split('').join(' ')}`);
        return;
    }
    
    // خطوة استقبال الكود
    if (user.step === 'waiting_code') {
        const enteredCode = text.replace(/\s/g, '');
        if (enteredCode === user.tempCode) {
            users.set(userId, { verified: true, step: null });
            await ctx.reply('✅ تم تسجيل الدخول بنجاح!\nالآن يمكنك استخدام:\n/takleesh - للتكليش\n/tasteer - للتسطير\n/stop - للإيقاف');
        } else {
            await ctx.reply('❌ كود غير صحيح. استخدم /login للمحاولة مجددًا');
            users.delete(userId);
        }
        return;
    }
});

// أمر التكليش
bot.command('takleesh', async (ctx) => {
    const userId = ctx.from.id;
    if (!isVerified(userId)) {
        await ctx.reply('❌ يجب تسجيل الدخول أولاً. استخدم /login');
        return;
    }
    
    if (activeSpams.has(userId)) {
        await ctx.reply('⚠️ يوجد عملية نشطة. استخدم /stop أولاً');
        return;
    }
    
    users.set(userId, { step: 'takleesh_target' });
    await ctx.reply('✍️ أرسل معرف المستخدم المستهدف (@username أو ID):');
});

// أمر التسطير
bot.command('tasteer', async (ctx) => {
    const userId = ctx.from.id;
    if (!isVerified(userId)) {
        await ctx.reply('❌ يجب تسجيل الدخول أولاً. استخدم /login');
        return;
    }
    
    if (activeSpams.has(userId)) {
        await ctx.reply('⚠️ يوجد عملية نشطة. استخدم /stop أولاً');
        return;
    }
    
    users.set(userId, { step: 'tasteer_target' });
    await ctx.reply('🎯 أرسل معرف المستخدم المستهدف (@username أو ID):');
});

// أمر الإيقاف
bot.command('stop', async (ctx) => {
    const userId = ctx.from.id;
    if (activeSpams.has(userId)) {
        stopSpam(userId);
        await ctx.reply('🛑 تم إيقاف التكليش/التسطير.');
    } else {
        await ctx.reply('⚠️ لا توجد عملية نشطة.');
    }
});

// معالجة الخطوات للتكليش والتسطير
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const user = users.get(userId);
    const text = ctx.message.text;
    
    if (!user) return;
    
    // =============== التكليش ===============
    if (user.step === 'takleesh_target') {
        users.set(userId, { step: 'takleesh_count', target: text });
        await ctx.reply('🔢 كم رسالة تريد إرسالها؟ (التطفية التلقائية)');
        return;
    }
    
    if (user.step === 'takleesh_count') {
        const count = parseInt(text);
        if (isNaN(count) || count < 1) {
            await ctx.reply('❌ عدد غير صالح.');
            users.delete(userId);
            return;
        }
        
        const target = user.target;
        await ctx.reply(`⚡ بدء إرسال ${count} كليشة إلى ${target}...`);
        
        let sent = 0;
        const interval = setInterval(async () => {
            if (sent >= count) {
                clearInterval(interval);
                activeSpams.delete(userId);
                await ctx.reply(`✅ تم إرسال ${count} كليشة.`);
                return;
            }
            
            const word = TAKLEESH_WORDS[Math.floor(Math.random() * TAKLEESH_WORDS.length)];
            try {
                await ctx.telegram.sendMessage(target, word);
                sent++;
            } catch (err) {
                clearInterval(interval);
                activeSpams.delete(userId);
                await ctx.reply(`❌ فشل الإرسال إلى ${target}`);
            }
        }, 1000);
        
        activeSpams.set(userId, { interval, type: 'takleesh' });
        users.delete(userId);
        return;
    }
    
    // =============== التسطير ===============
    if (user.step === 'tasteer_target') {
        users.set(userId, { step: 'tasteer_delay', target: text });
        await ctx.reply('⏱️ السرعة بين كل سطر (بالثواني، مثال: 3):');
        return;
    }
    
    if (user.step === 'tasteer_delay') {
        const delay = parseFloat(text);
        if (isNaN(delay) || delay < 0.5) {
            await ctx.reply('❌ سرعة غير صالحة (أقل قيمة 0.5 ثانية).');
            users.delete(userId);
            return;
        }
        
        const target = user.target;
        await ctx.reply(`🚀 سيتم إرسال 3 أسطر إلى ${target} بفاصل ${delay} ثانية.`);
        
        let sent = 0;
        const interval = setInterval(async () => {
            if (sent >= 3) {
                clearInterval(interval);
                activeSpams.delete(userId);
                await ctx.reply('✅ تم الانتهاء من التسطير.');
                return;
            }
            
            const word = TASTEER_WORDS[Math.floor(Math.random() * TASTEER_WORDS.length)];
            try {
                await ctx.telegram.sendMessage(target, word);
                sent++;
            } catch (err) {
                clearInterval(interval);
                activeSpams.delete(userId);
                await ctx.reply(`❌ فشل الإرسال إلى ${target}`);
            }
        }, delay * 1000);
        
        activeSpams.set(userId, { interval, type: 'tasteer' });
        users.delete(userId);
        return;
    }
});

// =============== تشغيل البوت ===============
bot.launch().then(() => {
    console.log('🔥 SHADOW BOT is running...');
    console.log('البوت شغال على التوكن: 8817608659:AAF8O-I58x...');
});

// إبقاء البوت شغال
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
