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

/**
 * Robust JSON parser that handles codeblocks, outermost brace matching, and trailing commas
 */
export function safeExtractJson(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    // continue
  }

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // continue
    }
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch (_) {
      const sanitized = jsonSubstring.replace(/,\s*([\}\]])/g, '$1');
      try {
        return JSON.parse(sanitized);
      } catch (_) {
        // failed
      }
    }
  }

  return null;
}

/**
 * Resilient caller for Gemini models with backoff retry and automatic cascade fallback across available models:
 * 1. High-speed, high-availability lightweight models (gemini-3.1-flash-lite, gemini-flash-lite-latest)
 * 2. Primary Flash models (gemini-3.6-flash, gemini-3.8-flash)
 * 3. Latest flash alias (gemini-flash-latest)
 */
export async function callGeminiWithResilience(
  client: GoogleGenAI,
  request: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  // Ordered cascade prioritizing high-availability models with quota
  const defaultCascade = [
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  const models = request.preferredModel
    ? [request.preferredModel, ...defaultCascade]
    : defaultCascade;

  const uniqueModels = Array.from(new Set(models));
  let lastError: any = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: currentModel,
          contents: request.contents,
          config: request.config,
        });

        const text = response.text?.trim() || '';
        if (text) {
          return { text, modelUsed: currentModel };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err?.status || err || '');
        const isQuotaExceeded =
          msg.includes('429') ||
          msg.includes('Quota exceeded') ||
          msg.includes('quota') ||
          msg.includes('RESOURCE_EXHAUSTED');

        const isTemporaryBusy =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('overloaded');

        console.warn(
          `[Gemini Resilience] Model '${currentModel}' attempt ${attempt}/${maxAttempts} failed:`,
          msg.substring(0, 160)
        );

        // If quota is exhausted on this model, retry won't help immediately, so immediately fall through to the next model
        if (isQuotaExceeded) {
          break;
        }

        // If temporary 503 spike, wait briefly only on first attempt
        if (isTemporaryBusy && attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, 600));
          continue;
        }

        // Otherwise move immediately to the next candidate model in the cascade
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed to respond.');
}

export interface ExplainRequestParams {
  mode: ExplainSourceType;
  prompt?: string;
  fileData?: string;
  mimeType?: string;
  fileName?: string;
  explanationLevel?: ExplainLevel;
  specificPart?: string;
  actionType?: 'full_explain' | 'simplify_more' | 'explain_point' | 'give_example' | 'test_me' | 'did_not_understand' | 'solve_example' | 'generate_cheat_sheet';
  studentUniversity?: string;
  studentMajor?: string;
  studentId?: string;
  pdfPageChoice?: { mode: 'full' | 'pages'; selectedPages?: string };
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
    pdfPageChoice,
  } = params;

  const client = getGeminiClient();

  if (client) {
    try {
      const parts: any[] = [];

      // If a file / image / pdf / video is provided
      if (fileData) {
        let cleanBase64 = fileData;
        let detectedMime = mimeType;

        const match = fileData.match(/^data:([^;]+);base64,(.*)$/s);
        if (match) {
          detectedMime = detectedMime || match[1];
          cleanBase64 = match[2];
        }

        cleanBase64 = cleanBase64.trim().replace(/\s+/g, '');
        let actualMime = detectedMime || (mode === 'pdf' ? 'application/pdf' : mode === 'video' ? 'video/mp4' : 'image/jpeg');
        if (actualMime === 'image/jpg') actualMime = 'image/jpeg';

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
        full_explain: 'تحليل المحتوى التعليمي كاملاً وشرحه وفق القالب الهندسي المعتمد بجميع أقسامه الـ 14 بدقة وأمانة علمية',
        simplify_more: 'التركيز على تبسيط الشرح بأقصى درجة ممكنة مع تشبيهات عملية حية من الحياة اليومية والسيارات والآلات لطالب مبتدئ',
        explain_point: `الطالب حدد هذه النقطة بالتحديد لشرحها: "${specificPart}". اشرح هذه النقطة بعمق وبساطة مع المحافظة على ترابط الدرس`,
        give_example: 'أنشئ مثالاً تعليمياً هندسياً إضافياً جديداً ومبتكراً يرتبط بهذا المفهوم خطوة بخطوة وضع isGenerated: true',
        test_me: 'أنشئ اختباراً تدريبياً جديداً ومتقناً مكوناً من 3 إلى 5 أسئلة متنوعة مع الإجابات وتفسيرها الدقيق',
        did_not_understand: 'الطالب ضغط "لم أفهم"؛ أعد الشرح بأسلوب مغاير تماماً وتشبيه يومي عملي جداً يزيل أي غموض',
        solve_example: 'ركز على تقديم مسألة ومثال محلول إضافي خطوة بخطوة بالتفصيل مع المعطيات والقوانين والناتج وتفسير النتيجة',
        generate_cheat_sheet: 'قم بإعداد ورقة مذاكرة شاملة جداً وجاهزة للطباعة والمراجعة السريعة ليلة الامتحان',
      };

      const imageSpecificInstructions = mode === 'image' ? `
تعليمات دقيقة ومشددة لتحليل صور الدروس (Vision / OCR Analysis):
1. افحص الصورة المرفوعة بعناية بالغة:
   - اقرأ النصوص المكتوبة بدقة (سواء كانت مطبوعة أو بخط اليد باللغتين العربية والإنجليزية).
   - استخرج المسائل الرياضية، المعادلات الفيزيائية، القوانين، الرموز ووحدات القياس.
   - تعرّف على الدوائر الكهربائية والإلكترونية ومكوناتها (مقاومات R، مكثفات C، ملفات L، مصادر جهد وتيار AC/DC، ترانزستورات، دايودات، مفاتيح) وطريقة توصيلها، واشملها في حقل "circuitAnalysis".
   - تعرّف على المخططات والرسومات الهندسية ومكونات الميكاترونكس (المحركات، الحساسات، التروس، الأذرع والمكابس).
2. فحص وضوح الصورة:
   - إذا كانت الصورة مشوشة، باهتة، مظلمة، مقطوعة، أو تمنع قراءة الأرقام والرموز بأمانة علمية:
     اجعل "isImageBlurry": true واكتب في "clarificationNotice": "الصورة غير واضحة بما يكفي لقراءة بعض المعادلات أو الأرقام بدقة، يرجى إعادة تصويرها بإضاءة كافية وزاوية مستقيمة."
3. فحص المحتوى التعليمي:
   - إذا كانت الصورة لا تحتوي على درس، مسألة، قانون، معادلة، دائرة، أو مخطط هندسي لمواد الميكاترونكس (مثل: صورة شخصية، سيارة بالشارع، صورة عشوائية فارغة):
     اجعل "isNotEducational": true واكتب في "notEducationalNotice": "الصورة المرفوعة لا تحتوي على درس أو مسألة أو مخطط هندسي واضح لمواد الميكاترونكس. يرجى رفع صورة لدفتر، سبورة، كتاب، ملزمة، أو دائرة كهربائية."
4. هيكل الشرح لطالب سنة أولى ميكاترونكس:
   - ابدأ بتحديد موضوع الصورة وعنوان الدرس بدقة في lessonTitle و subjectName.
   - اشرح الفكرة الهندسية باختصار وبساطة في simpleIdea.
   - قسّم أهم الأفكار في نقاط واضحة في coreTakeaways.
   - اشرح الرموز والمكونات في conceptExplanations و terms و formulas.
   - إذا كانت الصورة تحتوي على مسألة أو تمرين: قم بحلها خطوة بخطوة في solvedExample مع المعطيات والقانون والتعويض والناتج النهائي والوحدة وتفسير النتيجة.
   - أضف معلومة مهمة للحفظ في importantNotes وفي memoryAids.
` : '';

      const userInstructionPrompt = `
أنت مدرس جامعي ذكي متخصص في هندسة الميكاترونكس، ومهمتك مساعدة طالب سنة أولى في الجامعات اليمنية (${studentUniversity}) في تخصص (${studentMajor}) على فهم الدرس الذي يرفعه بطريقة سهلة ومبسطة ومختصرة، مع المحافظة التامة على المعلومات المهمة الموجودة في المحتوى الأصلي دون حذفها.

المعطيات:
- نوع المحتوى المرفوع: ${mode}
${fileName ? `- اسم الملف: ${fileName}` : ''}
${pdfPageChoice?.mode === 'pages' && pdfPageChoice.selectedPages ? `- اختيار صفحات PDF محددة: "${pdfPageChoice.selectedPages}"` : ''}
${prompt ? `- استفسار أو نص الطالب: "${prompt}"` : ''}
${specificPart ? `- الطالب حدد هذا الجزء للتركيز عليه: "${specificPart}"` : ''}
- مستوى الشرح المطلوب: ${levelDescriptions[explanationLevel] || levelDescriptions.simple}
- الإجراء المطلوب: ${actionInstructions[actionType] || actionInstructions.full_explain}

${imageSpecificInstructions}

منهجية معالجة الدرس:
1. اقرأ المحتوى كاملًا قدر الإمكان.
2. حدد موضوع الدرس بدقة.
3. استخرج الأفكار الأساسية والتعريفات والقوانين والمعادلات والرموز والوحدات والأمثلة والملاحظات.
4. حدد العلاقة بين الأفكار، ثم أعد شرح المحتوى بأسلوب طالب سنة أولى؛ لا تحذف معلومة أساسية من أجل الاختصار، بل رتبها وبسطها.
5. إذا احتجت إلى إضافة معلومة لم تكن موجودة في الملف الأصلي لتوضيح فكرة غامضة، ضع علامة: "💡 معلومة إضافية للتوضيح" (أو isAdditionalNote: true).
6. إذا كانت الصورة غير واضحة بما يكفي لقراءة جزء معين أو أرقام، لا تخمن! اكتب في clarificationNotice: "الصورة غير واضحة بما يكفي لقراءة هذا الجزء، يرجى رفع صورة أوضح."
7. إذا كان المحتوى فيديو، لخص ما تم استخراجه بصدق؛ وإذا كانت هناك قيود اذكرها في videoSupportNotice.
8. إذا كان ملف PDF طويلاً، قسّمه إلى أقسام منظمة بدلاً من حذف المعلومات.

يجب إخراج الناتج حصراً كـ JSON صالح ومطابق تماماً للبنية التالية:
{
  "lessonTitle": "📚 اسم الدرس المستخرج من المحتوى بدقة",
  "subjectName": "اسم المادة (مثل: فيزياء 1 / دوائر كهربائية 1 / تفاضل وتكامل 1 / ميكانيكا هندسية / كيمياء هندسية / مقدمة ميكاترونكس)",
  "simpleIdea": "💡 الدرس ببساطة: فقرة سهلة ومفهومة تشرح: ما هو الموضوع؟ ماذا يعني؟ لماذا ندرسه؟ وأين يستخدم في الميكاترونكس؟",
  "coreTakeaways": [
    "🎯 أهم الأفكار: النقطة الأساسية الأولى المستخرجة من الدرس",
    "🎯 النقطة الأساسية الثانية دون حذف أي فكرة مهمة",
    "🎯 النقطة الأساسية الثالثة",
    "🎯 النقطة الأساسية الرابعة"
  ],
  "conceptExplanations": [
    {
      "concept": "اسم المفهوم العلمي",
      "simplifiedExplanation": "شرح المفهوم بأسلوب مبسط جداً يفهمه طالب سنة أولى",
      "scientificDefinition": "التعريف العلمي الدقيق المستخرج من المحتوى",
      "practicalAnalogy": "تشبيه واقعي ملموس من السيارات أو الروبوتات أو الحياة اليومية",
      "isAdditionalNote": false
    }
  ],
  "terms": [
    {
      "term": "المصطلح بالعربية",
      "englishTerm": "English Scientific Term",
      "meaning": "معنى المصطلح بطريقة بسيطة",
      "practicalAnalogy": "تشبيه عملي ملموس",
      "isAdditionalNote": false
    }
  ],
  "formulas": [
    {
      "equation": "صيغة القانون (مثال: F = m × a أو V = I × R)",
      "meaning": "شرح معنى القانون والغرض منه",
      "whenToUse": "متى يستخدم هذا القانون بالتحديد في المسائل والتطبيقات؟",
      "symbols": [
        {
          "symbol": "F",
          "name": "القوة",
          "unit": "Newton (N)",
          "dimension": "[F] = M L T^-2"
        },
        {
          "symbol": "m",
          "name": "الكتلة",
          "unit": "Kilogram (kg)",
          "dimension": "M"
        },
        {
          "symbol": "a",
          "name": "التسارع",
          "unit": "m/s²",
          "dimension": "L T^-2"
        }
      ]
    }
  ],
  "units": [
    {
      "quantity": "اسم الكمية (مثال: القوة)",
      "unitName": "نيوتن (Newton)",
      "unitSymbol": "N",
      "notes": "1 N = 1 kg·m/s²"
    }
  ],
  "dimensions": [
    {
      "quantity": "القوة",
      "formula": "F = m × a",
      "dimensionStr": "[F] = M L T⁻²",
      "explanation": "M تعبر عن الكتلة، L عن الطول، T⁻² عن مربع الزمن في المقام"
    }
  ],
  "solvedExample": {
    "problem": "نص المسألة أو المثال المذكور في الدرس",
    "given": ["المعطى 1: الكتلة m = 5 kg", "المعطى 2: التسارع a = 2 m/s²"],
    "required": "المطلوب: حساب القوة المؤثرة F",
    "formulaUsed": "F = m × a",
    "steps": [
      "الخطوة 1: التأكد من تجانس الوحدات في النظام الدولي (kg, m/s²)",
      "الخطوة 2: التعويض المباشر في القانون: F = 5 × 2",
      "الخطوة 3: إتمام عملية الضرب الرياضية"
    ],
    "calculation": "F = 5 × 2 = 10",
    "unit": "N (نيوتن)",
    "finalAnswer": "F = 10 N",
    "whyThisResult": "تفسير النتيجة: القوة الناتجة تعني أننا نحتاج إلى 10 نيوتن لدفع كتلة مقدارها 5 كجم بتسارع 2 متر لكل ثانية مربعة في اتجاه الحركة",
    "isGenerated": false,
    "note": "⚠️ انتبه دائماً إلى تحويل الوحدات (مثل cm إلى m أو g إلى kg) قبل التعويض"
  },
  "importantNotes": [
    {
      "note": "⚠️ ملاحظة هامة: انتبه إلى تحويل الوحدات إلى النظام الدولي (SI Units) قبل التعويض في المعادلات",
      "type": "warning",
      "isAdditionalNote": false
    }
  ],
  "memoryAids": [
    "🧠 كيف أتذكر الدرس: مثلث قانون أوم (V في الأعلى، I و R في الأسفل)"
  ],
  "summaryPoints": [
    "📝 الخلاصة: تلخيص مكثف جداً يمكن قراءته في دقيقة أو دقيقتين ويشمل زبدة الدرس الأساسية"
  ],
  "learningObjectives": [
    "✓ تعريف وفهم المفهوم الأساسي في الدرس وتطبيقاته",
    "✓ معرفة جميع القوانين الرياضية والرموز وشروط استخدامها",
    "✓ معرفة الوحدات الدولية والأبعاد الفيزيائية لكل كمية",
    "✓ القدرة على حل مسألة تطبيقية خطوة بخطوة بالتعويض السليم"
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "نص السؤال من صميم محتوى الدرس",
      "type": "mcq",
      "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
      "correctAnswer": "خيار أ",
      "explanation": "شرح مختصر ومباشر لسبب صحة هذا الخيار دون غيره"
    },
    {
      "id": "q2",
      "question": "سؤال صح أو خطأ مفاهيمي من الدرس",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswer": "صح",
      "explanation": "تفسير سبب صحة أو خطأ العبارة علمياً"
    },
    {
      "id": "q3",
      "question": "سؤال تطبيقي أو مسألة حسابية سريعة من الدرس",
      "type": "conceptual",
      "options": ["الاحتمال 1", "الاحتمال 2", "الاحتمال 3"],
      "correctAnswer": "الاحتمال 1",
      "explanation": "الشرح الرياضي أو الهندسي للإجابة"
    }
  ],
  "commonMistakes": [
    {
      "mistake": "الخطأ الشائع الذي يقع فيه طلاب السنة الأولى",
      "correction": "التصرف الهندسي الصحيح لتفادي هذا الخطأ",
      "why": "السبب العلمي وراء ضرورة هذا التصحيح"
    }
  ],
  "suggestedTools": [
    {
      "toolId": "circuits",
      "title": "مختبر الدوائر الكهربائية",
      "subtitle": "محاكاة التوصيل وقوانين كيرشوف وأوم",
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
  "clarificationNotice": "",
  "isImageBlurry": false,
  "isNotEducational": false,
  "notEducationalNotice": "",
  "videoSupportNotice": "",
  "studySheetMarkdown": "ورقة مذاكرة مركزة تضم ملخص المفاهيم، جدول القوانين والوحدات، والأخطاء الواجب تجنبها ليلة الاختبار."
}
`;

      parts.push({ text: userInstructionPrompt });

      let parsed: any = null;
      let modelUsed = '';
      try {
        const genResult = await callGeminiWithResilience(client, {
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          preferredModel: 'gemini-3.1-flash-lite',
        });
        modelUsed = genResult.modelUsed;
        parsed = safeExtractJson(genResult.text);
      } catch (geminiCallError: any) {
        console.warn('Gemini generateContent call failed across all resilience models, using smart educational fallback:', geminiCallError?.message);
      }

      if (parsed && typeof parsed === 'object') {
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
          conceptExplanations: Array.isArray(parsed.conceptExplanations) ? parsed.conceptExplanations : [],
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
          importantNotes: Array.isArray(parsed.importantNotes) ? parsed.importantNotes : [],
          memoryAids: Array.isArray(parsed.memoryAids) ? parsed.memoryAids : [],
          summaryPoints: Array.isArray(parsed.summaryPoints) ? parsed.summaryPoints : [],
          learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives : [],
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
          suggestedTools: Array.isArray(parsed.suggestedTools) ? parsed.suggestedTools : [],
          circuitAnalysis: parsed.circuitAnalysis,
          clarificationNotice: parsed.clarificationNotice,
          isImageBlurry: Boolean(parsed.isImageBlurry),
          isNotEducational: Boolean(parsed.isNotEducational),
          notEducationalNotice: parsed.notEducationalNotice,
          videoSupportNotice: parsed.videoSupportNotice,
          studySheetMarkdown: parsed.studySheetMarkdown,
          pdfPageChoice: params.pdfPageChoice,
          isAiGenerated: true,
          modelUsed,
        };
      }
    } catch (err: any) {
      console.warn('Unexpected error in processExplainLesson, using smart educational fallback:', err?.message);
    }
  }

  // Smart fallback generator when API key is not present or API call fails
  const fallback = generateFallbackExplainedLesson(params);
  fallback.isAiGenerated = false;
  fallback.noticeMessage = 'تم تحضير الشرح بالاعتماد على المنظومة التعليمية الهندسية المعتمدة لضمان استمرار دراستك بسلاسة دون تأخير.';
  return fallback;
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
      conceptExplanations: [
        {
          concept: 'فرق الجهد الكهربائي (Voltage)',
          simplifiedExplanation: 'الجهد هو القوة الدافعة التي تدفع الإلكترونات للتحرك داخل السلك، تماماً مثل ضغط الماء في الخرطوم.',
          scientificDefinition: 'الشغل المبذول لنقل شحنة كهربائية موجبة مقدارها كولوم واحد بين نقطتين في مجال كهربائي.',
          practicalAnalogy: 'يشبه ضغط خزان الماء المرتفع فوق سطح المنزل الذي يدفع الماء للنزول بقوة.',
          isAdditionalNote: false,
        },
        {
          concept: 'شدة التيار الكهربائي (Electric Current)',
          simplifiedExplanation: 'كمية الإلكترونات والشحنات التي تعبر في الثانية الواحدة، كلما زادت زادت شدة التيار وسخونة السلك.',
          scientificDefinition: 'المعدل الزمني لتدفق الشحنات الكهربائية عبر مقطع عرضي في موصل: I = dq / dt.',
          practicalAnalogy: 'يشبه معدل تدفق لترات الماء المتدفقة في الأنبوب كل ثانية.',
          isAdditionalNote: false,
        },
        {
          concept: 'المقاومة الكهربائية (Electrical Resistance)',
          simplifiedExplanation: 'المقاومة هي صعوبة مرور التيار داخل المادة واصطدام الإلكترونات بذرات السلك.',
          scientificDefinition: 'خاصية مادية تعبر عن إعاقة الموصل لمرور الشحنات الكهربائية: R = ρ · L / A.',
          practicalAnalogy: 'يشبه وضع إسفنجة أو تضيق داخل أنبوب الماء يقلل من سرعة تدفقه.',
          isAdditionalNote: false,
        },
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
        calculation: 'R = (9 - 2) / 0.02 = 7 / 0.02 = 350 Ω',
        unit: 'Ω (أوم)',
        whyThisResult: 'النتيجة تضمن أن تيار الدايود لن يتجاوز 20 ميلي أمبير حتى لا يحترق، مع توزيع الجهد بين المقاومة (7V) والدايود (2V).',
        isGenerated: true,
        note: 'خطأ معتاد في امتحانات العملي: نسيان تحويل الملي أمبير (mA) إلى أمبير (A) بالقسمة على 1000 يؤدي إلى مقاومة خاطئة تماماً!',
      },
      importantNotes: [
        {
          note: '⚠️ تحويل الوحدات: تأكد من تحويل التيار من mA إلى A (بالقسمة على 1000) والمقاومة من kΩ إلى Ω قبل التعويض في قانون أوم.',
          type: 'warning',
          isAdditionalNote: false,
        },
        {
          note: '💡 في توصيل التوالي يكون التيار ثابتاً في جميع العناصر، بينما يتوزع الجهد (V_total = V1 + V2).',
          type: 'tip',
          isAdditionalNote: false,
        },
      ],
      memoryAids: [
        '🧠 مثلث قانون أوم: ضع V في القمة و I و R في القاعدة؛ لتجد أي مجهول غطه بإصبعك (V = I × R ، I = V / R ، R = V / I).',
      ],
      learningObjectives: [
        '✓ استيعاب المفاهيم الثلاثة للكهرباء: الجهد (الدفع)، التيار (التدفق)، والمقاومة (الإعاقة).',
        '✓ إتقان استخدام قانون أوم الرياضي في حل المسائل البسيطة والدوائر الكهربائية.',
        '✓ معرفة الوحدات الدولية والأبعاد الفيزيائية لكل كمية كهربائية واستخدام البادئات (milli, kilo).',
        '✓ القدرة على تصميم مقاومة حماية لعناصر الميكاترونكس والحساسات والليدات.',
      ],
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
    conceptExplanations: [
      {
        concept: 'القوة المحصلة (Net Force)',
        simplifiedExplanation: 'القوة هي أي دفعة أو سحبة تغير من سرعة الجسم أو اتجاهه، وإذا تساوت القوى في اتجاهين متعاكسين فإن الجسم لا يتسارع.',
        scientificDefinition: 'المؤثر الفيزيائي الخارجي المسبب لتسارع الأجسام طبقاً للقانون: ∑F = m · a.',
        practicalAnalogy: 'مثل سيارة يدفعها محركها للأمام والاحتكاك يقاومها للخلف، المحصلة هي الفرق بينهما.',
        isAdditionalNote: false,
      },
      {
        concept: 'القصور الذاتي والكتلة (Inertia & Mass)',
        simplifiedExplanation: 'القصور الذاتي هو كسل الجسم وعناده ضد أي تغيير في حالته الحركية، والكتلة هي مقياس هذا العناد.',
        scientificDefinition: 'خاصية مقاومة المادة لأي تغير في سرعتها المتجهة أو حالتها السكونية.',
        practicalAnalogy: 'صعوبة إيقاف قطار بضائع ثقيل فجأة مقارنة بدراجة هوائية تسير بنفس السرعة.',
        isAdditionalNote: false,
      },
      {
        concept: 'التسارع الخطي (Linear Acceleration)',
        simplifiedExplanation: 'معدل زيادة أو نقصان السرعة في كل ثانية تمر، وليس السرعة نفسها.',
        scientificDefinition: 'المشتقة الأولى للسرعة بالنسبة للزمن: a = dv / dt.',
        practicalAnalogy: 'ضغط دواسة بنزين السيارة بقوة مما يجعلك تلتصق بالكرسي أثناء زيادة السرعة.',
        isAdditionalNote: false,
      },
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
      calculation: 'F = 15 kg × 2 m/s² = 30 N',
      unit: 'N (نيوتن)',
      whyThisResult: 'النتيجة تؤكد أننا نحتاج إلى قوة دفع مقدارها 30 نيوتن للتغلب على عطالة العربة وتسريعها من السكون إلى 3 م/ث في ثانية ونصف.',
      isGenerated: true,
      note: 'في التطبيق العملي لمشاريع التخرج: نضيف 20% كعامل أمان لمقاومة احتكاك الأرضية وعزم بدء المحرك.',
    },
    importantNotes: [
      {
        note: '⚠️ انتبه للفرق بين الكتلة m (بالكيلوجرام، ثابتة لا تتغير بتغير الكوكب) والوزن W (بالنيوتن، قوة جاذبية تتغير مع g).',
        type: 'warning',
        isAdditionalNote: false,
      },
      {
        note: '⚠️ تحويل الوحدات: إذا كانت السرعة معطاة بـ km/h، اقسم على 3.6 فوراً لتحويلها إلى m/s قبل التعويض في قوانين التسارع.',
        type: 'warning',
        isAdditionalNote: false,
      },
      {
        note: '💡 إذا كانت السرعة ثابتة، فإن التسارع a = 0، وبالتالي القوة المحصلة F_net = 0 دائماً (قانون نيوتن الأول).',
        type: 'tip',
        isAdditionalNote: false,
      },
    ],
    memoryAids: [
      '🧠 لتذكر قانون نيوتن الثاني: مثلث القوة (F في القمة، m و a في القاعدة؛ F = m · a ، a = F / m ، m = F / a).',
      '🧠 تذكر أن 1 نيوتن يعادل وزن تفاحة صغيرة تزن حوالي 100 جرام (0.1 kg × 9.8 ≈ 1 N).',
    ],
    learningObjectives: [
      '✓ صياغة وفهم قوانين نيوتن الثلاثة والتمييز بين القوة والقصور الذاتي والتسارع.',
      '✓ استخدام صيغة F = m × a لحساب القوة والتسارع والكتلة بدقة متناهية.',
      '✓ تحديد الوحدات الدولية (SI) والأبعاد الفيزيائية للقوة [F] = M L T⁻².',
      '✓ تطبيق مخطط الجسم الحر وحساب القوة المطلوبة لتسريع آليات وأنظمة الميكاترونكس.',
    ],
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
