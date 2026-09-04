// Diagnostic Index Database
  const diagnosticDatabase = {
    cbc: {
      code: "CBC",
      title: "صورة الدم الكاملة (Complete Blood Count)",
      desc: "تحليل رئيسي للكشف عن فقر الدم (الأنيميا)، والاطمئنان على المناعة ومستوى الصفائح الدموية ومتابعة الحالات العامة.",
      price: "90 ج.م",
      fasting: "لا يشترط الصيام المسبق، يمكن إجراؤه في أي وقت طوال اليوم.",
      duration: "خلال ساعتين إلى 3 ساعات في نفس اليوم.",
      sample: "عينة دم وريدي في أنبوبة مخصصة ومعقمة.",
      points: [
        "الشعور بالدوخة والإرهاق السريع وشحوب الوجه",
        "متابعة الأنيميا ونقص الحديد لدى الأطفال والحوامل",
        "الاطمئنان عند تكرار نزلات البرد أو الاشتباه في وجود التهاب",
        "الفحص الروتيني الشامل قبل التدخلات الجراحية"
      ],
      whatsappText: "تحليل صورة الدم الكاملة CBC"
    },
    liver: {
      code: "LFTs",
      title: "وظائف الكبد والمرارة الكاملة",
      desc: "تقييم كفاءة إنزيمات الكبد (ALT و AST) ومستوى الصفراء الكلية والمباشرة والألبومين في الدم.",
      price: "180 ج.م",
      fasting: "يُفضل صيام من 6 إلى 8 ساعات لتفادي تأثر قراءة الصفراء.",
      duration: "في نفس اليوم خلال 3 إلى 4 ساعات.",
      sample: "عينة مصل دم نقي.",
      points: [
        "الشعور بالخمول أو اصفرار بياض العينين والجلد",
        "المتابعة الدورية لمستخدمي أدوية الضغط أو الدهون",
        "الاطمئنان في حالات الكبد الدهني والتهابات المرارة",
        "تقييم الحالة الغذائية العامة ومستوى البروتين"
      ],
      whatsappText: "تحليل وظائف الكبد"
    },
    kidney: {
      code: "RFTs",
      title: "وظائف الكلى والأملاح (Creatinine & Uric Acid)",
      desc: "قياس تركيز الكرياتينين والبولينا لتقييم كفاءة الكليتين، مع فحص حمض اليوريك لتشخيص النقرس وآلام المفاصل.",
      price: "140 ج.م",
      fasting: "لا يشترط الصيام التام، لكن يُنصح بالاعتدال في اللحوم قبل الفحص.",
      duration: "خلال ساعتين إلى 3 ساعات.",
      sample: "عينة دم مصلية.",
      points: [
        "متابعة دورية أساسية لمرضى السكري وارتفاع ضغط الدم",
        "آلام المفاصل خصوصاً في إصبع القدم أو القدمين (النقرس)",
        "الشعور بآلام في الجانبين أو تغير في التبول",
        "الاطمئنان على الكليتين عند تناول مسكنات لفترات طويلة"
      ],
      whatsappText: "تحليل وظائف الكلى والنقرس"
    },
    sugar: {
      code: "HbA1c & Glucose",
      title: "السكر والتراكمي (HbA1c & Glucose)",
      desc: "يقيس السكر التراكمي متوسط نسبة السكر بالدم خلال الأشهر الثلاثة السابقة، وهو الأساس لتقييم انتظام العلاج.",
      price: "110 ج.م",
      fasting: "التراكمي لا يحتاج صيام. أما سكر الصائم فيحتاج صيام 8 ساعات.",
      duration: "نفس اليوم خلال ساعتين.",
      sample: "عينة دم وريدي.",
      points: [
        "المتابعة الدورية لمرضى السكر كل 3 أشهر لتجنب أي مضاعفات",
        "الشعور بالعطش الشديد أو كثرة التبول وفقدان الوزن غير المبرر",
        "فحص السكر العشوائي وفحص ما بعد الأكل بساعتين",
        "الاطمئنان لمن لديهم تاريخ عائلي لمرض السكري"
      ],
      whatsappText: "تحليل السكر التراكمي وسكر الدم"
    },
    lipids: {
      code: "Lipids",
      title: "الدهون والكوليسترول الكامل",
      desc: "قياس الكوليسترول الكلي والدهون الثلاثية والكوليسترول النافع والضار لحماية صحة القلب والشرايين.",
      price: "170 ج.م",
      fasting: "صيام ضروري من 10 إلى 12 ساعة (يُسمح بشرب الماء فقط).",
      duration: "خلال 3 ساعات في نفس اليوم.",
      sample: "مصل دم صائم.",
      points: [
        "فحص وقائي دوري لمن هم فوق الأربعين أو لمن يعانون من السمنة",
        "متابعة تأثير أدوية خفض الكوليسترول",
        "الحفاظ على سلامة الشرايين التاجية وضغط الدم",
        "متابعة منتظمة لمرضى السكر والضغط"
      ],
      whatsappText: "تحليل الدهون والكوليسترول الكامل"
    },
    thyroid: {
      code: "Thyroid",
      title: "هرمونات الغدة الدرقية (TSH, FT3, FT4)",
      desc: "التحليل الأهم لتشخيص خمول أو نشاط الغدة الدرقية ومعرفة أسباب بطء الحرق أو خفقان القلب السريع.",
      price: "130 ج.م",
      fasting: "لا يشترط الصيام المسبق، ويفضل أخذ العينة صباحاً.",
      duration: "في نفس اليوم.",
      sample: "عينة مصل دم.",
      points: [
        "الخمول الشديد وزيادة الوزن غير المبررة أو تساقط الشعر",
        "التوتر ونوبات ضربات القلب السريعة ونزول الوزن المفاجئ",
        "ضبط الجرعة الصحيحة لعلاج الثيروكسين",
        "فحص ضروري لمتابعة انتظام الدورة الشهرية"
      ],
      whatsappText: "تحليل هرمونات الغدة الدرقية"
    },
    vitamins: {
      code: "Vit-D & Ferritin",
      title: "فيتامين د ومخزون الحديد (Vitamin D & Ferritin)",
      desc: "فحص مستوى فيتامين د3 لصحة العظام والمناعة، ومخزون الحديد لمعرفة سبب الأنيميا المستمرة وضعف الشعر.",
      price: "290 ج.م",
      fasting: "لا يشترط الصيام.",
      duration: "في نفس اليوم أو خلال 24 ساعة كحد أقصى.",
      sample: "عينة مصل دم نقي.",
      points: [
        "آلام العظام والمفاصل وضعف النشاط البدني العام",
        "تساقط الشعر الشديد وضعف الأظافر عند السيدات",
        "تحديد الجرعة العلاجية الدقيقة لمكملات فيتامين د والحديد",
        "الاطمئنان على كفاءة امتصاص الجسم للعناصر الأساسية"
      ],
      whatsappText: "تحليل فيتامين د ومخزون الحديد"
    }
  };

  function selectCategory(catKey, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.className = "cat-btn w-full flex items-center justify-between p-3.5 rounded-xl text-right transition-all hover:bg-surface-container-low text-slate-700 font-medium";
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.className = "material-symbols-outlined text-[20px] text-secondary";
    });

    btnElement.className = "cat-btn w-full flex items-center justify-between p-3.5 rounded-xl text-right transition-all bg-primary-container text-white font-semibold";
    const activeIcon = btnElement.querySelector('.material-symbols-outlined');
    if (activeIcon) activeIcon.className = "material-symbols-outlined text-[20px] text-teal-soft";

    const data = diagnosticDatabase[catKey];
    if (!data) return;

    document.getElementById('active-test-code').textContent = data.code;
    document.getElementById('active-test-title').textContent = data.title;
    document.getElementById('active-test-desc').textContent = data.desc;
    document.getElementById('active-test-price').textContent = data.price;
    document.getElementById('active-test-fasting').textContent = data.fasting;
    document.getElementById('active-test-duration').textContent = data.duration;
    document.getElementById('active-test-sample').textContent = data.sample;

    const pointsContainer = document.getElementById('active-test-points');
    pointsContainer.innerHTML = '';
    data.points.forEach(pt => {
      const li = document.createElement('li');
      li.className = "flex items-center gap-2";
      li.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span><span>${pt}</span>`;
      pointsContainer.appendChild(li);
    });

    const waLink = document.getElementById('active-test-whatsapp');
    waLink.href = `https://wa.me/201038879791?text=${encodeURIComponent('السلام عليكم معمل الحياه بالقرشيه، أرغب في الاستفسار وحجز ' + data.whatsappText)}`;
  }

  function liveFilterTests(term) {
    const q = term.trim().toLowerCase();
    if (!q) return;

    for (const [key, item] of Object.entries(diagnosticDatabase)) {
      if (item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
        const btn = document.querySelector(`button[onclick*="'${key}'"]`);
        if (btn) {
          selectCategory(key, btn);
          break;
        }
      }
    }
  }

  // Real Contextual WhatsApp Result Dispatch
  function handleResultWhatsAppSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('res-name').value.trim();
    const phone = document.getElementById('res-phone').value.trim();
    const orderNo = document.getElementById('res-order-no').value.trim();
    const testName = document.getElementById('res-test-name').value.trim();

    const message = `السلام عليكم معمل الحياه للتحليل الطبيه بالقرشيه،
أرغب في استلام نتيجة التحليل:
- اسم المريض: ${name}
- رقم الهاتف المسجل: ${phone}
- رقم الإيصال / الطلب: ${orderNo}
- التحليل المطلوب: ${testName}`;

    window.open(`https://wa.me/201038879791?text=${encodeURIComponent(message)}`, '_blank');
  }

  // Home sample booking dispatch to WhatsApp
  function handleHomeOrderSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('home-name').value.trim();
    const phone = document.getElementById('home-phone').value.trim();
    const address = document.getElementById('home-address').value.trim();
    const tests = document.getElementById('home-tests').value.trim() || 'طلب فحص منزلي';

    const message = `السلام عليكم معمل الحياه بالقرشيه،
أرغب في حجز زيارة سحب منزلي:
- الاسم: ${name}
- رقم التليفون: ${phone}
- العنوان داخل القرشيه: ${address}
- التحاليل المطلوبة: ${tests}`;

    window.open(`https://wa.me/201038879791?text=${encodeURIComponent(message)}`, '_blank');
  }
