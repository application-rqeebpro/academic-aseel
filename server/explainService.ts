import { GoogleGenAI } from '@google/genai';
import { ExplainLessonResult, ExplainLevel, ExplainSourceType } from '../src/types';

// Helper to initialize Gemini safely
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ExplainRequestParams {
  mode: ExplainSourceType;
  prompt?: string;
  fileData?: string;
  mimeType?: string;
  fileName?: string;
  explanationLevel?: ExplainLevel;
  specificPart?: string;
  actionType?: 'full_explain' | 'simplify_more' | 'did_not_understand' | 'solve_example' | 'generate_cheat_sheet' | 'test_me';
  studentUniversity?: string;
  studentMajor?: string;
  studentId?: string;
}

export async function processExplainLesson(params: ExplainRequestParams): Promise<ExplainLessonResult> {
  const {
    mode,
    prompt = '',
    fileData,
    mimeType,
    fileName,
    explanationLevel = 'simple',
    specificPart = '',
    actionType = 'full_explain',
    studentUniversity = 'الجامعة الإماراتية الدولية – صنعاء',
    studentMajor = 'هندسة الميكاترونكس',
  } = params;

  const client = getGeminiClient();

  if (client) {
    try {
      const parts: any[] = [];

      // If a file / image / pdf / video is provided
      if (fileData) {
        const cleanBase64 = fileData.replace(/^data:[\w\/\-\.]+;base64,/, '');
        const actualMime = mimeType || (mode === 'pdf' ? 'application/pdf' : 'image/jpeg');

        // Gemini handles image/* and application/pdf and audio/video
        parts.push({
          inlineData: {
            mimeType: actualMime,
            data: cleanBase64,
          },
        });
      }

      const levelDescriptions: Record<ExplainLevel, string> = {
        simple: 'شرح مبسط جداً من الصفر مع تشبيهات من الواقع والسيارات والروبوتات كأن الطالب يتعلم المفهوم لأول مرة',
        medium: 'شرح بمستوى طالب جامعي سنة أولى ميكاترونكس متوازن بين النظرية والتطبيق',
        advanced: 'شرح هندسي متقدم مع معادلات تفصيلية وتطبيقات صناعية في الأتمتة والميكاترونكس',
        short: 'ملخص مكثف وسريع جداً في نقاط مباشرة ليلة الامتحان',
      };

      const actionInstructions: Record<string, string> = {
        full_explain: 'تحليل المحتوى التعليمي كاملاً وشرحه وفق القالب الهندسي المعتمد',
        simplify_more: 'التركيز على تبسيط الشرح بأقصى درجة ممكنة مع أمثلة شديدة البساطة',
        did_not_understand: 'الطالب ضغط "لم أفهم"؛ أعد الشرح بأسلوب مغاير تماماً وتشبيه يومي عملي جداً',
        solve_example: 'ركز على تقديم مسألة ومثال محلول إضافي خطوة بخطوة بالتفصيل مع المعطيات والقوانين',
        generate_cheat_sheet: 'قم بإعداد ورقة مذاكرة شاملة جداً وجاهزة للطباعة والمراجعة السريعة',
        test_me: 'أنشئ بنك أسئلة واختبار تدريبي مفصل مع الإجابات والتفسير الدقيق',
      };

      const userInstructionPrompt = `
أنت مدرس جامعي متخصص في الميكاترونكس والهندسة، ومهمتك مساعدة طالب سنة أولى في الجامعات اليمنية (${studentUniversity}) في تخصص (${studentMajor}) على فهم المحتوى الذي يرفعه.

المعطيات:
- نوع المحتوى المرفوع: ${mode}
${fileName ? `- اسم الملف: ${fileName}` : ''}
${prompt ? `- استفسار أو نص الطالب: "${prompt}"` : ''}
${specificPart ? `- الطالب حدد هذا الجزء للتركيز عليه: "${specificPart}"` : ''}
- مستوى الشرح المطلوب: ${levelDescriptions[explanationLevel] || levelDescriptions.simple}
- الإجراء المطلوب: ${actionInstructions[actionType] || actionInstructions.full_explain}

القواعد الصارمة للشرح:
1. لا تكتفِ بإعادة صياغة المحتوى أو نسخه. افهم المحتوى أولاً، ثم اشرحه بطريقة عربية سهلة ومختصرة وممتعة.
2. حافظ على القوانين والمعلومات المهمة؛ وإذا وجدت قانوناً، اشرح كل رمز ووحدته الدولية.
3. إذا كان القانون فيزيائياً، قم بتحليل أبعاده [M, L, T, I] واشرح معناها الفيزيائي بطريقة سهلة.
4. إذا وجدت مسألة أو قانوناً، اشرح طريقة الحل خطوة بخطوة (المعطيات، المطلوب، القانون، التعويض، الناتج بوحدته).
5. فرّق بوضوح في حقل isGenerated في المثال المحلول بين ما إذا كان مستخرجاً من ملف الطالب أو مثالاً إضافياً تعليمياً أنشأته أنت.
6. إذا كانت الصورة لدائرة كهربائية، استخرج عناصر الدائرة (مقاومات، مصادر جهد، تيارات، توصيلات، قيم).
7. إذا كانت الصورة غير واضحة أو الرموز باهتة بحيث يتعذر قراءة بعض الأرقام بدقة، اذكر في clarificationNotice: "الصورة غير واضحة بما يكفي لقراءة بعض القيم، يرجى رفع صورة أوضح" ولا تخمن القيم غير المقروءة.
8. إذا كان الملف فيديو، لا تدعِ أنك شاهدت الفيديو كاملاً إذا لم تتمكن من معالجته بالكامل، ولخص ما تمكنت من تحليله بصدق علمي.
9. اقترح الأداة المناسبة في المنصة من بين:
   - circuits: مختبر الدوائر الكهربائية (لأي موضوع كهربائي أو أوم أو كيرشوف)
   - math: المساعد الرياضي (للمتجهات والتفاضل والتكامل والمصفوفات)
   - formulas: محلل القوانين (للقوانين الفيزيائية والميكانيكية)
   - units: محلل ومحول الوحدات (للتحويلات والوحدات الدولية)
   - torque: حاسبة عزم المحرك (للعزم والمحركات وقوانين الدوران)
   - gears: حاسبة التروس (لنسب السرعات والتروس)
   - oee: حاسبة الكفاءة الصناعية OEE
   - robot: محاكي الذراع الروبوتية

أخرج الناتج فقط بصيغة كائن JSON صالح وبدون أي علامات أو كتل نصية خارج الـ JSON:
{
  "lessonTitle": "اسم الدرس المستخرج بدقة",
  "subjectName": "اسم المادة (فيزياء 1 / دوائر كهربائية 1 / تفاضل وتكامل 1 / ميكانيكا هندسية / كيمياء هندسية / مقدمة ميكاترونكس)",
  "simpleIdea": "الفكرة الأساسية للدرس في 3 إلى 5 أسطر بأسلوب شيق وبسيط مع تشبيه عملي ملموس",
  "coreTakeaways": [
    "النقطة الأساسية 1",
    "النقطة الأساسية 2",
    "النقطة الأساسية 3",
    "النقطة الأساسية 4"
  ],
  "terms": [
    {
      "term": "المصطلح بالعربية",
      "englishTerm": "English Name",
      "meaning": "معنى مبسط للمصطلح",
      "practicalAnalogy": "تشبيه عملي ملموس"
    }
  ],
  "formulas": [
    {
      "equation": "صيغة القانون (مثال: V = I * R)",
      "meaning": "شرح معنى القانون والغرض منه ومتى نستخدمه",
      "symbols": [
        { "symbol": "الرمز", "name": "اسم الكمية", "unit": "الوحدة الدولية", "dimension": "الأبعاد الفيزيائية" }
      ]
    }
  ],
  "units": [
    { "quantity": "اسم الكمية", "unitName": "اسم الوحدة", "unitSymbol": "رمز الوحدة" }
  ],
  "dimensions": [
    {
      "quantity": "اسم الكمية",
      "formula": "صيغة القانون",
      "dimensionStr": "[X] = M L T^-2",
      "explanation": "شرح معنى الأبعاد للمهندس"
    }
  ],
  "solvedExample": {
    "problem": "نص المسألة بوضوح",
    "given": ["المعطى 1", "المعطى 2"],
    "required": "المطلوب إيجاده",
    "formulaUsed": "القانون المستخدم",
    "steps": [
      "الخطوة 1...",
      "الخطوة 2...",
      "الخطوة 3..."
    ],
    "finalAnswer": "الناتج النهائي مع الوحدة",
    "isGenerated": false,
    "note": "نصيحة هندسية للحل في الامتحان"
  },
  "commonMistakes": [
    {
      "mistake": "الخطأ الشائع",
      "correction": "التصحيح السليم",
      "why": "السبب العلمي"
    }
  ],
  "summaryPoints": [
    "الخلاصة 1",
    "الخلاصة 2",
    "الخلاصة 3"
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "نص السؤال",
      "type": "mcq",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "correctAnswer": "خيار 1",
      "explanation": "تفسير الإجابة الصحيحة"
    },
    {
      "id": "q2",
      "question": "سؤال صح أو خطأ أو حسابي",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswer": "صح",
      "explanation": "تفسير واضح"
    },
    {
      "id": "q3",
      "question": "مسألة سريعة أو سؤال مفاهيمي",
      "type": "conceptual",
      "options": ["خيار أ", "خيار ب", "خيار ج"],
      "correctAnswer": "خيار أ",
      "explanation": "شرح المفتاح الهندسي"
    }
  ],
  "suggestedTools": [
    {
      "toolId": "circuits",
      "title": "⚡ افتح مختبر الدوائر الكهربائية",
      "subtitle": "حسابات المقاومات وقوانين كيرشوف ومحاكاة التوصيل",
      "icon": "circuits",
      "reason": "لتجربة القوانين عملياً ومحاكاة التوصيل"
    }
  ],
  "circuitAnalysis": {
    "hasCircuit": false,
    "circuitType": "",
    "components": [],
    "analysisSummary": ""
  },
  "isImageBlurry": false,
  "clarificationNotice": "",
  "studySheetMarkdown": "ورقة مذاكرة مركزة تضم ملخص المفاهيم، جدول القوانين والوحدات، والأخطاء الواجب تجنبها ليلة الاختبار."
}
`;

      parts.push({ text: userInstructionPrompt });

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        // Parse JSON response
        const parsed = JSON.parse(responseText);

        return {
          id: 'expl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          studentId: params.studentId,
          lessonTitle: parsed.lessonTitle || 'درس هندسي متخصص',
          subjectName: parsed.subjectName || 'هندسة الميكاترونكس 1',
          sourceType: mode,
          fileName: fileName,
          createdAt: new Date().toISOString(),
          explanationLevel,
          simpleIdea: parsed.simpleIdea || 'فكرة الدرس الأساسية تم تلخيصها بأسلوب مبسط.',
          coreTakeaways: Array.isArray(parsed.coreTakeaways) ? parsed.coreTakeaways : ['فهم المفاهيم الأساسية وتطبيقاتها'],
          terms: Array.isArray(parsed.terms) ? parsed.terms : [],
          formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
          units: Array.isArray(parsed.units) ? parsed.units : [],
          dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
          solvedExample: parsed.solvedExample || {
            problem: 'مسألة تدريبية',
            given: [],
            required: 'الحل',
            formulaUsed: '',
            steps: [],
            finalAnswer: '',
            isGenerated: true,
          },
          commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
          summaryPoints: Array.isArray(parsed.summaryPoints) ? parsed.summaryPoints : [],
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          suggestedTools: Array.isArray(parsed.suggestedTools) ? parsed.suggestedTools : [],
          circuitAnalysis: parsed.circuitAnalysis,
          clarificationNotice: parsed.clarificationNotice,
          isImageBlurry: Boolean(parsed.isImageBlurry),
          studySheetMarkdown: parsed.studySheetMarkdown,
        };
      }
    } catch (err: any) {
      console.warn('Gemini generateContent error or json parse failed, using smart educational fallback:', err?.message);
    }
  }

  // Smart fallback generator when API key is not present or API call fails
  return generateFallbackExplainedLesson(params);
}

// Rich Mechatronics Curriculum Fallback Generator
export function generateFallbackExplainedLesson(params: ExplainRequestParams): ExplainLessonResult {
  const textSample = (params.prompt || params.fileName || '').toLowerCase();
  const level = params.explanationLevel || 'simple';

  // Topic detection
  const isCircuits = textSample.includes('أوم') || textSample.includes('ohm') || textSample.includes('جهد') || textSample.includes('تيار') || textSample.includes('دائر') || textSample.includes('circuit') || textSample.includes('مقاوم') || textSample.includes('كيرشوف');
  const isMechanics = textSample.includes('نيوتن') || textSample.includes('newton') || textSample.includes('قوة') || textSample.includes('force') || textSample.includes('تسارع') || textSample.includes('كتلة') || textSample.includes('حركة');
  const isTorque = textSample.includes('عزم') || textSample.includes('torque') || textSample.includes('محرك') || textSample.includes('دوران');
  const isMath = textSample.includes('تفاضل') || textSample.includes('تكامل') || textSample.includes('متجهات') || textSample.includes('vector') || textSample.includes('مصفوف');

  if (isCircuits) {
    return {
      id: 'expl-' + Date.now(),
      lessonTitle: 'قانون أوم وتحليل الدوائر الكهربائية البسيطة',
      subjectName: 'دوائر كهربائية 1 (Electric Circuits I)',
      sourceType: params.mode,
      fileName: params.fileName,
      createdAt: new Date().toISOString(),
      explanationLevel: level,
      simpleIdea: level === 'short'
        ? 'الجهد يسبب تدفق التيار، والمقاومة تعيقه: V = I × R.'
        : 'تخيل أن الكهرباء مثل شبكة مياه منزلية: مضخة الماء هي مصدر الجهد (Voltage) تدفع الماء، وكمية الماء المتدفقة في الأنبوب هي التيار (Current)، بينما أي تضيق أو محبس في الأنبوب هو المقاومة (Resistance). كلما زادت قوة المضخة زاد التدفق، وكلما ضاق الأنبوب قل التدفق.',
      coreTakeaways: [
        'فرق الجهد (V) هو الشغل اللازم لنقل شحنة كهربائية بين نقطتين، ويقاس بالفولت (V).',
        'شدة التيار (I) هي معدل تدفق الشحنات عبر مقطع الموصل بالزمن، وتقاس بالأمبير (A).',
        'المقاومة (R) هي خاصية المادة لإعاقة مرور التيار الكهربائي، وتقاس بالأوم (Ω).',
        'العلاقة طردية بين الجهد والتيار عند ثبوت المقاومة ودرجة الحرارة.',
      ],
      terms: [
        {
          term: 'فرق الجهد الكهربائي',
          englishTerm: 'Voltage / Potential Difference (V)',
          meaning: 'طاقة الدفع الكهربائية التي تحرك الإلكترونات عبر الدائرة.',
          practicalAnalogy: 'يشبه ضغط الماء العالي في خزان أعلى المنزل.',
        },
        {
          term: 'شدة التيار الكهربائي',
          englishTerm: 'Electric Current (I)',
          meaning: 'كمية الشحنة الكهربائية التي تعبر نقطة في الدائرة خلال ثانية واحدة.',
          practicalAnalogy: 'يشبه سرعة وحجم تدفق الماء داخل الخرطوم.',
        },
        {
          term: 'المقاومة الكهربائية',
          englishTerm: 'Electrical Resistance (R)',
          meaning: 'ممانعة المادة لسريان الإلكترونات داخلها وتحويل جزء من طاقتها لحرارة.',
          practicalAnalogy: 'يشبه الصخور والعوائق داخل مجرى النهر التي تبطئ جريانه.',
        },
      ],
      formulas: [
        {
          equation: 'V = I × R',
          meaning: 'قانون أوم الأساسي: فرق الجهد بين طرفي مقاومة يساوي حاصل ضرب شدة التيار المار فيها في قيمة المقاومة.',
          symbols: [
            { symbol: 'V', name: 'فرق الجهد (Voltage)', unit: 'Volt (V)', dimension: 'M L² T⁻³ I⁻¹' },
            { symbol: 'I', name: 'شدة التيار (Current)', unit: 'Ampere (A)', dimension: 'I' },
            { symbol: 'R', name: 'المقاومة (Resistance)', unit: 'Ohm (Ω)', dimension: 'M L² T⁻³ I⁻²' },
          ],
        },
        {
          equation: 'P = V × I = I² × R',
          meaning: 'القدرة الكهربائية المستهلكة في المقاومة على شكل حرارة أو طاقة مفيدة.',
          symbols: [
            { symbol: 'P', name: 'القدرة الكهربائية (Power)', unit: 'Watt (W)', dimension: 'M L² T⁻³' },
          ],
        },
      ],
      units: [
        { quantity: 'فرق الجهد', unitName: 'فولت', unitSymbol: 'V' },
        { quantity: 'شدة التيار', unitName: 'أمبير', unitSymbol: 'A' },
        { quantity: 'المقاومة', unitName: 'أوم', unitSymbol: 'Ω' },
        { quantity: 'القدرة', unitName: 'واط', unitSymbol: 'W' },
      ],
      dimensions: [
        {
          quantity: 'المقاومة الكهربائية (R)',
          formula: 'R = V / I = (W / Q) / I',
          dimensionStr: '[R] = M L² T⁻³ I⁻²',
          explanation: 'كتلة × مسافة مربعة ÷ (مكعب الزمن × مربع شدة التيار). يساعدك فحص الأبعاد على التأكد من صحة القوانين في اختبارات الدوائر.',
        },
      ],
      solvedExample: {
        problem: 'دائرة إلكترونية بسيطة لتشغيل دايود ضوئي (LED) في مشروع ميكاترونكس يعمل بجهد 2V وتيار 20mA، والمصدر المتاح بطارية 9V. احسب المقاومة الواجب وضعها على التوالي لحماية الـ LED.',
        given: [
          'جهد المصدر: V_source = 9 V',
          'جهد عمل الدايود: V_led = 2 V',
          'تيار الدائرة: I = 20 mA = 20 × 10⁻³ A = 0.02 A',
        ],
        required: 'قيمة المقاومة المطلوبة R وقدرتها P_resistor لحمايتها من الاحتراق.',
        formulaUsed: 'R = (V_source - V_led) / I',
        steps: [
          'الخطوة 1: حساب فرق الجهد الذي يجب أن يسقط على المقاومة: V_R = 9V - 2V = 7V.',
          'الخطوة 2: تحويل التيار إلى الوحدة الدولية (SI): 20mA = 0.02A.',
          'الخطوة 3: تطبيق قانون أوم لحساب المقاومة: R = 7 / 0.02 = 350 Ω.',
          'الخطوة 4: حساب القدرة المبددة: P = V_R × I = 7 × 0.02 = 0.14 W (نختار مقاومة ربع واط 0.25W بأمان).',
        ],
        finalAnswer: 'R = 350 Ω (أو أقرب قيمة قياسية تجارية 360 Ω أو 390 Ω)، بقدرة 0.25 Watt.',
        isGenerated: true,
        note: 'خطأ معتاد في امتحانات العملي: نسيان تحويل الملي أمبير (mA) إلى أمبير (A) بالقسمة على 1000 يؤدي إلى مقاومة خاطئة تماماً!',
      },
      commonMistakes: [
        {
          mistake: 'قسمة الجهد الكلي مباشرة على التيار دون طرح هبوط جهد العناصر الأخرى كالليدات.',
          correction: 'احسب الجهد الفعلي الواقع على المقاومة وحدها أولاً: V_resistor = V_total - V_components.',
          why: 'لأن الجهد في توصيل التوالي يتوزع على العناصر المختلفة، ولا يسقط بالكامل على عنصر واحد.',
        },
        {
          mistake: 'نسيان تحويل الوحدات: تعويض التيار بوحدة mA أو kΩ دون التوحيد.',
          correction: 'حوّل دائماً إلى الوحدات الأساسية الدولية (Amperes, Ohms, Volts) قبل الحساب.',
          why: 'قانون أوم متوازن رياضياً فقط عند استخدام وحدات النظام الدولي الأساسية.',
        },
      ],
      summaryPoints: [
        'V = I × R هو حجر الأساس في هندسة الدوائر والإلكترونيات.',
        'لزيادة التيار في دائرة ميكاترونكس، إما أن ترفع الجهد أو تقلل المقاومة.',
        'القدرة الكهربائية تعبر عن السخونة أو الطاقة المستهلكة ويجب ألا تتجاوز قدرة المقاومة الفيزيائية.',
      ],
      quiz: [
        {
          id: 'q1',
          question: 'إذا تضاعف فرق الجهد المطبق على مقاومة ثابتة القيمة بمقدار مرتين، فماذا يحدث لشدة التيار؟',
          type: 'mcq',
          options: ['يتضاعف مرتين', 'يقل للنصف', 'يبقى ثابتاً', 'يتضاعف أربع مرات'],
          correctAnswer: 'يتضاعف مرتين',
          explanation: 'طبقاً لقانون أوم V = I × R، العلاقة بين الجهد والتيار علاقة خطية طردية عند ثبوت المقاومة.',
        },
        {
          id: 'q2',
          question: 'وحدة قياس المقاومة الكهربائية هي الأوم، وتكافئ فولت لكل أمبير (V/A).',
          type: 'true_false',
          options: ['صح', 'خطأ'],
          correctAnswer: 'صح',
          explanation: 'من العلاقة R = V / I، تكون وحدة الأوم Ω = V / A.',
        },
        {
          id: 'q3',
          question: 'مقاومة قيمتها 100 Ω يمر بها تيار 0.5 A. ما هو هبوط الجهد عبر طرفيها؟',
          type: 'calculation',
          options: ['50 V', '200 V', '20 V', '5 V'],
          correctAnswer: '50 V',
          explanation: 'V = I × R = 0.5 A × 100 Ω = 50 V.',
        },
      ],
      suggestedTools: [
        {
          toolId: 'circuits',
          title: '⚡ افتح مختبر الدوائر الكهربائية',
          subtitle: 'احسب مقاومات التوالي والتوازي وقانون أوم تفاعلياً',
          icon: 'circuits',
          reason: 'يمكنك محاكاة هذه الدائرة وحساب التيارات وهبوط الجهد فورياً.',
        },
        {
          toolId: 'units',
          title: '📏 افتح محول الوحدات',
          subtitle: 'تحويل وحدات الجهد والتيار والمقاومة والقدرة',
          icon: 'units',
          reason: 'للتحويل الدقيق بين mA و A و kΩ و MΩ دون الوقوع في أخطاء.',
        },
      ],
      circuitAnalysis: {
        hasCircuit: true,
        circuitType: 'دائرة تيار مستمر DC بسيطة (توالي)',
        components: [
          { type: 'مصدر جهد', value: '9V DC', label: 'V_source' },
          { type: 'مقاومة حماية', value: '350 Ω', label: 'R1' },
          { type: 'دايود ضوئي', value: '2V / 20mA', label: 'LED1' },
        ],
        analysisSummary: 'المسار مغلق، والتيار يمر من القطب الموجب عبر المقاومة ثم الدايود ويعود للقطب السالب. المقاومة تمتص 7 فولت والدايود يمتص 2 فولت.',
      },
      studySheetMarkdown: `# ورقة مذاكرة ليلة الاختبار: قانون أوم والدوائر الكهربائية ⚡
**المادة:** دوائر كهربائية 1 | **المستوى:** السنة الأولى هندسة ميكاترونكس

---
### 📌 1. المفاهيم الذهبية
- **الجهد (V):** طاقة الدفع (فولت).
- **التيار (I):** معدل تدفق الشحنات (أمبير).
- **المقاومة (R):** ممانعة السريان (أوم).

### 📐 2. جدول القوانين ووحدات القياس
| الكمية | الرمز | القانون | الوحدة الدولية (SI) | الأبعاد الفيزيائية |
| :--- | :--- | :--- | :--- | :--- |
| الجهد | $V$ | $V = I \\times R$ | Volt (V) | $[M L^2 T^{-3} I^{-1}]$ |
| التيار | $I$ | $I = V / R$ | Ampere (A) | $[I]$ |
| المقاومة | $R$ | $R = V / I$ | Ohm ($\\Omega$) | $[M L^2 T^{-3} I^{-2}]$ |
| القدرة | $P$ | $P = V \\times I = I^2 R$ | Watt (W) | $[M L^2 T^{-3}]$ |

### ⚠️ 3. فخاخ الامتحانات الجامعية:
1. إياك والتعويض بـ $mA$ مباشرة! اقسم على $1000$ لتصبح $A$.
2. في التوالي: التيار متساوٍ والجهد يتجزأ ($V_{total} = V_1 + V_2$).
3. في التوازي: الجهد متساوٍ والتيار يتجزأ ($I_{total} = I_1 + I_2$).
`,
    };
  }

  // Default Mechanics & Newton's Law
  return {
    id: 'expl-' + Date.now(),
    lessonTitle: isTorque ? 'العزم الدوراني وتطبيقات محركات الميكاترونكس' : 'قوانين نيوتن للحركة وتطبيقات القوة والتسارع',
    subjectName: 'فيزياء عامة 1 (General Physics I - Mechanics)',
    sourceType: params.mode,
    fileName: params.fileName,
    createdAt: new Date().toISOString(),
    explanationLevel: level,
    simpleIdea: level === 'short'
      ? 'القوة المحصلة تساوي الكتلة مضروبة في التسارع: F = m × a.'
      : 'تخيل أنك تدفع عربة يد في ورشة الميكاترونكس: إذا كانت العربة فارغة (كتلتها خفيفة)، دفعة بسيطة تجعلها تتسارع بسرعة كبيرة. لكن إذا كانت محملة بمحركات ثقيلة (كتلة كبيرة)، فستحتاج إلى قوة عضلية جبارة لإعطائها نفس التسارع. هذا هو جوهر قانون نيوتن الثاني: القوة تزيد التسارع، والكتلة تعاند وتعارض هذا التسارع.',
    coreTakeaways: [
      'القوة (F) كمية متجهة (لها مقدار واتجاه)، وهي المؤثر الخارجي المسبب لتغير حالة حركة الجسم.',
      'القصور الذاتي هو ميل الجسم لمقاومة أي تغير في سرعته أو اتجاهه، ومقياسه هو الكتلة (m).',
      'التسارع (a) يتناسب طردياً مع القوة المحصلة وعكسياً مع الكتلة: a = F_net / m.',
      'في الروبوتات والمركبات الذكية: نحسب F لتحديد حجم المحرك وقدرته لمنع احتراقه تحت الحمل.',
    ],
    terms: [
      {
        term: 'القوة المحصلة',
        englishTerm: 'Net Force (F_net)',
        meaning: 'المجموع الاتجاهي لجميع القوى المؤثرة على الجسم في نفس اللحظة.',
        practicalAnalogy: 'مثل فريقين يشدان حبلاً، المحصلة هي الفرق بين قوة الفريقين في اتجاه الأقوى.',
      },
      {
        term: 'الكتلة والقصور الذاتي',
        englishTerm: 'Mass & Inertia (m)',
        meaning: 'خاصية فيزيائية للمادة تمثل ممانعتها لتغيير سرعتها الانتقالية.',
        practicalAnalogy: 'صعوبة إيقاف قطار مسرع مقارنة بدراجة هوائية بنفس السرعة.',
      },
      {
        term: 'التسارع الخطي',
        englishTerm: 'Linear Acceleration (a)',
        meaning: 'معدل التغير اللحظي في السرعة المتجهة مع الزمن.',
        practicalAnalogy: 'انطلاق سيارة سريعة من السكون إلى 100 كم/ساعة في ثوانٍ معدودة.',
      },
    ],
    formulas: [
      {
        equation: 'F = m × a',
        meaning: 'قانون نيوتن الثاني للحركة الانتقالية: القوة المحصلة تساوي حاصل ضرب الكتلة في التسارع الخطي.',
        symbols: [
          { symbol: 'F', name: 'القوة المحصلة (Net Force)', unit: 'Newton (N)', dimension: 'M L T⁻²' },
          { symbol: 'm', name: 'الكتلة (Mass)', unit: 'Kilogram (kg)', dimension: 'M' },
          { symbol: 'a', name: 'التسارع الخطي (Acceleration)', unit: 'm/s²', dimension: 'L T⁻²' },
        ],
      },
      {
        equation: 'W = m × g',
        meaning: 'قوة الوزن الجاذبية المؤثرة رأسياً للأسفل على أي جسم على سطح الأرض.',
        symbols: [
          { symbol: 'W', name: 'الوزن (Weight)', unit: 'Newton (N)', dimension: 'M L T⁻²' },
          { symbol: 'g', name: 'عجلة الجاذبية الأرضية', unit: 'm/s² (≈ 9.81)', dimension: 'L T⁻²' },
        ],
      },
    ],
    units: [
      { quantity: 'القوة والوزن', unitName: 'نيوتن', unitSymbol: 'N' },
      { quantity: 'الكتلة', unitName: 'كيلوجرام', unitSymbol: 'kg' },
      { quantity: 'التسارع', unitName: 'متر لكل ثانية مربعة', unitSymbol: 'm/s²' },
      { quantity: 'السرعة', unitName: 'متر لكل ثانية', unitSymbol: 'm/s' },
    ],
    dimensions: [
      {
        quantity: 'القوة (F)',
        formula: 'F = m × a = M × (L / T²)',
        dimensionStr: '[F] = M L T⁻²',
        explanation: 'كتلة [M] مضروبة في طول [L] مقسومة على مربع الزمن [T²]. 1 نيوتن يعادل فيزيائياً 1 kg·m/s².',
      },
    ],
    solvedExample: {
      problem: 'عربة فحص روبوتية (AGV) في مصنع أتمتة كتلتها 15 kg، يراد تسريعها من السكون (v₀ = 0) إلى سرعة 3 m/s خلال زمن قدره 1.5 ثانية. بفرض إهمال الاحتكاك، احسب القوة الأفقية التي يجب أن تولدها العجلات لدفع العربة.',
      given: [
        'كتلة العربة: m = 15 kg',
        'السرعة الابتدائية: v₀ = 0 m/s',
        'السرعة النهائية: v = 3 m/s',
        'الزمن المستغرق: t = 1.5 s',
      ],
      required: 'القوة الأفقية الدافعة F بالنيوتن.',
      formulaUsed: 'a = (v - v₀) / t ثم F = m × a',
      steps: [
        'الخطوة 1: حساب التسارع الخطي المطلوب للعربة: a = (3 - 0) / 1.5 = 2 m/s².',
        'الخطوة 2: تطبيق قانون نيوتن الثاني: F = m × a = 15 kg × 2 m/s².',
        'الخطوة 3: حساب الناتج النهائي والتحقق من الوحدة: F = 30 N.',
      ],
      finalAnswer: 'F = 30 Newton (N) في اتجاه حركة العربة.',
      isGenerated: true,
      note: 'في التطبيق العملي لمشاريع التخرج: نضيف 20% كعامل أمان لمقاومة احتكاك الأرضية وعزم بدء المحرك.',
    },
    commonMistakes: [
      {
        mistake: 'الخلط بين الكتلة (Mass) بالكيلوجرام والوزن (Weight) بالنيوتن.',
        correction: 'الكتلة كمية قياسية ثابتة m، بينما الوزن قوة جذب W = m × g تتغير بتغير المكان.',
        why: 'الكتلة تقيس كمية المادة والقصور الذاتي، أما الوزن فهو قوة تتطلب ضرب الكتلة في تسارع الجاذبية.',
      },
      {
        mistake: 'نسيان تحويل السرعة من km/h إلى m/s قبل حساب التسارع.',
        correction: 'اضرب السرعة في (1000 / 3600) أو اقسم على 3.6 للتحويل إلى m/s.',
        why: 'معادلات الحركة تتطلب وحدة النظام الدولي m/s للحصول على تسارع بوحدة m/s² وقوة بالنيوتن.',
      },
    ],
    summaryPoints: [
      'القوة المحصلة تسبب تسارعاً ولا تسبب سرعة فقط: إذا انعدمت القوة المحصلة، تظل السرعة ثابتة (قانون نيوتن الأول).',
      'F = m × a هو القانون الأساسي في ديناميكا الروبوتات والآليات والمحركات.',
      'الأبعاد المتجانسة: [F] = M L T⁻² أساسية للتحقق من صحة القوانين في اختبارات الفيزياء.',
    ],
    quiz: [
      {
        id: 'q1',
        question: 'إذا أثرت قوة محصلة مقدارها 20 N على جسم كتلته 4 kg، فما هو تسارعه؟',
        type: 'calculation',
        options: ['5 m/s²', '80 m/s²', '0.2 m/s²', '16 m/s²'],
        correctAnswer: '5 m/s²',
        explanation: 'التسارع a = F / m = 20 / 4 = 5 m/s².',
      },
      {
        id: 'q2',
        question: 'جسم يتحرك بسرعة متجهة ثابتة في خط مستقيم تكون القوة المحصلة المؤثرة عليه مساوية للصفر.',
        type: 'true_false',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        explanation: 'طبقا لقانون نيوتن الأول، إذا كانت السرعة ثابتة فالتسارع a = 0 وبالتالي القوة المحصلة F_net = 0.',
      },
      {
        id: 'q3',
        question: 'أي من الوحدات التالية تكافئ وحدة النيوتن (N) في النظام الدولي؟',
        type: 'mcq',
        options: ['kg · m / s²', 'kg · m² / s²', 'kg / (m · s)', 'J · s'],
        correctAnswer: 'kg · m / s²',
        explanation: 'من F = m × a، وحدة الكتلة kg والتسارع m/s²، فتكون kg·m/s².',
      },
    ],
    suggestedTools: [
      {
        toolId: 'formulas',
        title: '📐 افتح محلل القوانين',
        subtitle: 'تحليل أبعاد قانون نيوتن والعزم وقوانين الحركة',
        icon: 'formulas',
        reason: 'لفهم عميق للأبعاد الفيزيائية والتطبيقات الهندسية.',
      },
      {
        toolId: 'torque',
        title: '🛠️ افتح حاسبة عزم المحرك',
        subtitle: 'حساب العزم والقوة لاختيار محركات الميكاترونكس',
        icon: 'torque',
        reason: 'لتطبيق حسابات القوة والتسارع في اختيار محركات الروبوتات.',
      },
      {
        toolId: 'units',
        title: '📏 افتح محول الوحدات',
        subtitle: 'تحويل وحدات القوة (N, dyn, lbf, kgf)',
        icon: 'units',
        reason: 'لضمان الدقة في تحويل وحدات القوة والكتلة.',
      },
    ],
    studySheetMarkdown: `# ورقة مذاكرة ليلة الاختبار: قوانين نيوتن والميكانيكا 🚀
**المادة:** فيزياء عامة 1 | **المستوى:** السنة الأولى هندسة ميكاترونكس

---
### 📌 1. المفاهيم الأساسية
- **قانون نيوتن 1:** الجسم الساكن يظل ساكناً والمتحرك يظل متحركاً ما لم تؤثر عليه قوة محصلة ($F_{net} = 0 \\implies a = 0$).
- **قانون نيوتن 2:** القوة المحصلة تكسب الجسم تسارعاً في اتجاهها ($F_{net} = m \\cdot a$).
- **قانون نيوتن 3:** لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه.

### 📐 2. جدول القوانين والأبعاد
| الكمية | الرمز | القانون | الوحدة الدولية (SI) | الأبعاد الفيزيائية |
| :--- | :--- | :--- | :--- | :--- |
| القوة | $F$ | $F = m \\cdot a$ | Newton (N) | $[M L T^{-2}]$ |
| الوزن | $W$ | $W = m \\cdot g$ | Newton (N) | $[M L T^{-2}]$ |
| التسارع | $a$ | $a = \\Delta v / \\Delta t$ | $m/s^2$ | $[L T^{-2}]$ |
| كمية الحركة | $p$ | $p = m \\cdot v$ | $kg \\cdot m/s$ | $[M L T^{-1}]$ |

### ⚠️ 3. نصائح الامتحان:
1. ارسم مخطط الجسم الحر (Free Body Diagram) دائماً قبل البدء بحساب القوى.
2. اتجاه الحركة هو الاتجاه الموجب $(+)$.
3. تأكد أن الكتلة بالكيلوجرام ($kg$) وليس بالجرام ($g$).
`,
  };
}
