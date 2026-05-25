# Labbayk — Project Concept & Technical Vision

## المشكلة / The Problem

خلال موسم الحج في منى، يصل ملايين الحجاج إلى مساحة جغرافية ضيقة جداً. في حالات الطوارئ الطبية (النوبات القلبية، الإغماء، الإصابات)، تستغرق سيارات الإسعاف وقتاً طويلاً للوصول بسبب الازدحام الشديد.

During the Hajj season in Mina, millions of pilgrims converge on a small geographic area. In medical emergencies (cardiac events, fainting, injuries), ambulances face severe delays due to extreme congestion.

**الفجوة الحرجة:** الدقائق الأولى بعد توقف القلب تُحدد نسبة النجاة. بدون تدخل فوري، تنخفض فرص البقاء 10% لكل دقيقة.

**The Critical Gap:** Survival odds drop 10% per minute without immediate intervention after cardiac arrest.

## الحل / The Solution

**لبيك** يُحوّل الحجاج المؤهلين طبياً إلى أول المستجيبين في المنطقة.

**Labbayk** converts medically-qualified pilgrims into on-site first responders.

كل عام، يؤدي عشرات الآلاف من الأطباء والممرضين والمسعفين فريضة الحج — هم موجودون فعلاً في المنطقة. المشكلة أنه لا يوجد نظام يوصّلهم بحالات الطوارئ.

Every year, tens of thousands of doctors, nurses, and paramedics perform Hajj — they are already on-site. The gap is the absence of a dispatch system connecting them to emergencies.

## المراحل الستة للنظام / Six System Phases

| # | المرحلة | Phase |
|---|---------|-------|
| 1 | رصد الطارئ من مشغّل الغرفة | Emergency detected by control room operator |
| 2 | تحديد أقرب المتطوعين المؤهلين بالذكاء الاصطناعي | AI identifies nearest qualified volunteers |
| 3 | إرسال تنبيه فوري عبر تطبيق نسك | Instant alert via Nusuk app |
| 4 | المتطوع يقبل ويتنقل بخرائط داخلية | Volunteer accepts and navigates with indoor maps |
| 5 | تقديم الإسعافات الأولية قبل وصول الإسعاف | First aid rendered before ambulance arrival |
| 6 | تسليم المريض للطواقم الطبية | Handover to medical teams on arrival |

## الميزات التنافسية / Competitive Advantages

- **التكامل مع نسك:** لا تطبيق جديد — يعمل مع منصة الحج الرسمية الموجودة
- **التحقق من المؤهلات:** يعتمد على بيانات المهنة المسجلة في نسك
- **الذكاء في الاختيار:** خوارزمية تجمع المسافة + المؤهل + وقت الاستجابة
- **التتبع الحي:** مشغّل الغرفة يرى المتطوعين على الخريطة في الوقت الفعلي
- **لا بنية تحتية إضافية:** يستخدم الأجهزة المحمولة الحالية للحجاج

- **Nusuk Integration:** No new app — works within the official Hajj platform
- **Credential Verification:** Relies on professional data registered in Nusuk
- **Smart Dispatch:** Algorithm weighs distance + qualification + response time
- **Live Tracking:** Operator sees volunteers on real-time map
- **Zero Extra Infrastructure:** Uses pilgrims' existing mobile devices

## الجمهور المستهدف / Target Audience

- **المستخدم الأول:** الحجاج المؤهلون طبياً (أطباء، ممرضون، مسعفون، طلاب الطب)
- **المشغّل:** غرف عمليات الصحة بمنى
- **المستفيد النهائي:** جميع الحجاج في حالات الطوارئ

- **Primary User:** Medically-qualified pilgrims (doctors, nurses, paramedics, med students)
- **Operator:** Health operations rooms in Mina
- **End Beneficiary:** All pilgrims in emergencies

## المخرج التقني للـ MVP / MVP Technical Output

نظام مزدوج الشاشة يُظهر:
- **شاشة المشغّل (iPad):** خريطة منى، قائمة المتطوعين مع درجات التطابق، أزرار الإرسال
- **شاشة المتطوع (موبايل):** تنبيه بالاهتزاز والصوت، خيار القبول/الرفض، خريطة التنقل للموقع

Dual-screen system showing:
- **Operator Screen (iPad):** Mina map, volunteer list with match scores, dispatch controls
- **Volunteer Screen (Mobile):** Vibration + audio alert, accept/decline, navigation map to patient
