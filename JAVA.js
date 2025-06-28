document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS (GLOBAL) ---
    const pageSelect = document.getElementById('page-select');
    const pages = document.querySelectorAll('.page');

    // --- STATE (GLOBAL) ---
    let gameControls = { zenGarden: {}, bubblePop: {} };

    // --- PAGE NAVIGATION ---
    const showPage = (pageId) => {
        pages.forEach(page => {
            if (page.id === 'page-games' && page.classList.contains('active')) {
                Object.values(gameControls).forEach(controls => {
                    if (controls.deactivate) controls.deactivate();
                });
            }
            page.classList.remove('active');
            if (page.id === `page-${pageId}`) {
                page.classList.add('active');
                if (pageId === 'games') {
                    Object.values(gameControls).forEach(controls => {
                        if (controls.activate) controls.activate();
                    });
                }
            }
        });
    };
    
    // --- AI ANALYSIS MODULE ---
    const analysisModule = () => {
        const backendStatus = document.getElementById('backend-status');
        const analyzeBtn = document.getElementById('analyze-btn');
        const recordBtn = document.getElementById('record-btn');
        const userInput = document.getElementById('user-input');
        const voiceStatus = document.getElementById('voice-status');
        const textControls = document.getElementById('text-controls');
        const voiceControls = document.getElementById('voice-controls');
        const inputMethodSelector = document.getElementById('input-method-selector');
        const analysisResultContainer = document.getElementById('analysis-result-container');
        const toggleRelationBtn = document.getElementById('toggle-relation-mode');
        const relationSelectContainer = document.getElementById('relation-select-container');
        const relationSelect = document.getElementById('relation-select');
        const languageSelect = document.getElementById('language-select');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition;
        let isRecording = false;
        let analysisHistory = [];
        let selectedRelation = '';
        let currentLanguage = 'en-US';

        const languagePacks = {
            'en-US': { ui: { placeholder: "Type a journal entry...", voiceStatus: "Click to start speaking.", analysisTitle: "🧠 Analysis of Your Feelings", inputHeader: "Your Input", emotionLabel: "Emotion", riskLabel: "Risk Level", insightLabel: "Insight", suggestionLabel: "Suggestion" }, analysis: { keywords: { failure: /\b(fail|failed|exam|bad grade|disappointed)\b/i, crisis: /\b(kill myself|end it|hopeless|worthless|no reason to live)\b/i, anxiety: /\b(anxious|worried|stressed|overwhelmed|nervous|panic)\b/i, sadness: /\b(sad|crying|depressed|lonely|empty|heartbroken|lost someone)\b/i, happiness: /\b(happy|great|joyful|excited|amazing|wonderful)\b/i }, responses: { failure: { emotion: 'Disappointed', risk_level: 'Medium', reason: "It sounds like you're feeling down about a recent outcome.", suggestion: "Setbacks like this are tough, but they don't define you. It's just one step on a long journey." }, crisis: { emotion: 'Distressed', risk_level: 'High', reason: 'The words you used suggest you are in a lot of pain and may be in crisis.', suggestion: "Your safety is most important. It sounds like you are going through immense pain, and it's crucial to talk to someone who can help immediately. Please use the crisis support numbers in the sidebar. You are not alone." }, anxiety: { emotion: 'Anxious', risk_level: 'Medium', reason: 'It sounds like you have a lot on your mind and are feeling overwhelmed.', suggestion: "When your thoughts are racing, it can help to ground yourself. Try to focus on the feeling of your feet on the floor, and take one slow, deep breath." }, sadness: { emotion: 'Sad', risk_level: 'Medium', reason: 'It sounds like you are feeling heavy-hearted and sad.', suggestion: "It is completely okay to feel this way. Your feelings are valid. Be gentle with yourself. Maybe listen to a comforting song." }, happiness: { emotion: 'Happy', risk_level: 'Low', reason: 'It sounds like something wonderful has happened!', suggestion: "That's fantastic to hear! Embrace this positive energy. Take a moment to really soak in this feeling." }, neutral: { emotion: 'Neutral', risk_level: 'Low', reason: 'It sounds like things are calm at the moment.', suggestion: "This is a good time to relax or do something you enjoy." } }, relationVoices: { father: "As a father:", mother: "Sweetheart, your mother is here to tell you:", sister: "Hey, from your sister:", brother: "Bro, listen up:", best_friend: "As your bestie, I've got your back! Here's my take:", teacher: "Let's look at this from a learning perspective:", therapist: "Thank you for sharing. Let's gently explore this:", stranger: "Though I'm a stranger, I hear you, and I want to say:" }, stories: { failure: [ { person: "J.K. Rowling", story: "She was rejected by 12 publishers before Harry Potter was accepted." } ], sadness: [ { person: "Dwayne 'The Rock' Johnson", story: "He has openly spoken about his battles with depression, proving vulnerability is a strength." } ], anxiety: [ { person: "Oprah Winfrey", story: "She overcame a traumatic childhood and intense anxiety using mindfulness and gratitude." } ] } } },
            'es-ES': { ui: { placeholder: "Escribe en tu diario...", voiceStatus: "Haz clic para empezar a hablar.", analysisTitle: "🧠 Análisis de Tus Sentimientos", inputHeader: "Tu Entrada", emotionLabel: "Emoción", riskLabel: "Nivel de Riesgo", insightLabel: "Perspectiva", suggestionLabel: "Sugerencia" }, analysis: { keywords: { failure: /\b(fallé|fracaso|examen|mala nota|decepcionado)\b/i, crisis: /\b(matarme|acabar con todo|sin esperanza|inútil|no hay razón para vivir)\b/i, anxiety: /\b(ansioso|preocupado|estresado|abrumado|nervioso|pánico)\b/i, sadness: /\b(triste|llorando|deprimido|solo|vacío|corazón roto)\b/i, happiness: /\b(feliz|genial|alegre|emocionado|increíble|maravilloso)\b/i }, responses: { failure: { emotion: 'Decepcionado', risk_level: 'Medium', reason: "Parece que te sientes mal por un resultado reciente.", suggestion: "Los contratiempos como este son duros, pero no te definen. Es solo un paso en un largo viaje." }, crisis: { emotion: 'Angustiado', risk_level: 'High', reason: 'Las palabras que usaste sugieren que estás sufriendo mucho.', suggestion: "Tu seguridad es lo más importante. Por favor, usa los números de apoyo en crisis de la barra lateral. No estás solo." }, anxiety: { emotion: 'Ansioso', risk_level: 'Medium', reason: 'Parece que tienes mucho en mente y te sientes abrumado.', suggestion: "Cuando tus pensamientos van a toda velocidad, puede ayudar anclarte al presente. Intenta concentrarte en tus pies en el suelo y respira hondo." }, happiness: { emotion: 'Feliz', risk_level: 'Low', reason: '¡Parece que ha ocurrido algo maravilloso!', suggestion: "¡Es fantástico! Aprovecha esta energía positiva." }, neutral: { emotion: 'Neutral', risk_level: 'Low', reason: 'Parece que las cosas están tranquilas.', suggestion: "Es un buen momento para relajarse o hacer algo que disfrutes." } }, relationVoices: { father: "Como padre:", mother: "Cariño, tu madre te dice:", sister: "Oye, de tu hermana:", best_friend: "Como tu mejor amigo:", teacher: "Desde una perspectiva de aprendizaje:", therapist: "Gracias por compartir. Exploremos esto:", stranger: "Aunque soy un extraño, te escucho:" }, stories: { failure: [ { person: "J.K. Rowling", story: "Fue rechazada por 12 editoriales antes de que Harry Potter fuera aceptado." } ], sadness: [ { person: "Dwayne 'The Rock' Johnson", story: "Ha hablado abiertamente de sus batallas contra la depresión, demostrando que la vulnerabilidad es una fortaleza." } ] } } },
            'hi-IN': { ui: { placeholder: "अपनी कोई बात लिखें...", voiceStatus: "बोलने के लिए क्लिक करें।", analysisTitle: "🧠 आपकी भावनाओं का विश्लेषण", inputHeader: "आपका इनपुट", emotionLabel: "भावना", riskLabel: "जोखिम स्तर", insightLabel: "अंतर्दृष्टि", suggestionLabel: "सुझाव" }, analysis: { keywords: { failure: /\b(असफल|विफल|परीक्षा|खराब ग्रेड|निराश)\b/i, crisis: /\b(आत्महत्या|जान दे दूँ|निराश|बेकार)\b/i, anxiety: /\b(चिंतित|घबराहट|तनावग्रस्त|परेशान)\b/i, sadness: /\b(दुखी|रो रहा|उदास|अकेला)\b/i, happiness: /\b(खुश|बहुत अच्छा|आनंदित|उत्साहित)\b/i }, responses: { failure: { emotion: 'निराश', risk_level: 'Medium', reason: "लगता है आप किसी हालिया नतीजे से निराश हैं।", suggestion: "ऐसी असफलताएं कठिन होती हैं, पर वे आपको परिभाषित नहीं करतीं। यह एक लंबी यात्रा का एक कदम है।" }, crisis: { emotion: 'संकट में', risk_level: 'High', reason: 'आपके शब्द बताते हैं कि आप बहुत दर्द में हैं।', suggestion: "आपकी सुरक्षा सबसे महत्वपूर्ण है। कृपया साइडबार में दिए गए संकट सहायता नंबरों का उपयोग करें। आप अकेले नहीं हैं।" }, anxiety: { emotion: 'चिंतित', risk_level: 'Medium', reason: 'लगता है आपके मन में बहुत कुछ चल रहा है।', suggestion: "जब विचार दौड़ें, तो अपने पैरों को फर्श पर महसूस करने की कोशिश करें और एक गहरी सांस लें।" }, happiness: { emotion: 'प्रसन्न', risk_level: 'Low', reason: 'लगता है कुछ बहुत अच्छा हुआ है!', suggestion: "यह शानदार है! इस सकारात्मक ऊर्जा का आनंद लें।" }, neutral: { emotion: 'तटस्थ', risk_level: 'Low', reason: 'अभी सब कुछ शांत लग रहा है।', suggestion: "यह आराम करने या कुछ मनोरंजक करने का अच्छा समय है।" } }, relationVoices: { father: "एक पिता के नाते:", mother: "बेटा/बेटी, तुम्हारी माँ कहती है:", sister: "तुम्हारी बहन की तरफ से:", best_friend: "तुम्हारे सबसे अच्छे दोस्त के नाते:", teacher: "इसे सीखने की दृष्टि से देखें:", therapist: "साझा करने के लिए धन्यवाद:", stranger: "मैं एक अजनबी हूँ, पर मैं सुन रहा हूँ:" }, stories: { failure: [ { person: "जे.के. Rowling", story: "हैरी पॉटर स्वीकार होने से पहले उन्हें 12 प्रकाशकों ने अस्वीकार कर दिया था।" } ], sadness: [ { person: "ड्वेन 'द रॉक' जॉनसन", story: "उन्होंने अवसाद के साथ अपनी लड़ाई के बारे में खुलकर बात की है, यह साबित करते हुए कि भेद्यता एक ताकत है।" } ] } } },
            'ur-PK': { ui: { placeholder: "اپنی کوئی بات لکھیں...", voiceStatus: "بولنے کے لیے کلک کریں۔", analysisTitle: "🧠 آپ کے جذبات کا تجزیہ", inputHeader: "آپ کا ان پٹ", emotionLabel: "جذبہ", riskLabel: "خطرے کی سطح", insightLabel: "بصیرت", suggestionLabel: "تجویز" }, analysis: { keywords: { failure: /\b(ناکام|امتحان|برا گریڈ|مایوس)\b/i, crisis: /\b(خودکشی|ختم کر دوں|ناامید|بیکار)\b/i, anxiety: /\b(پریشان|فکرمند|ذہنی دباؤ|گھبراہٹ)\b/i, sadness: /\b(اداس|رو رہا|غمگین|تنہا)\b/i, happiness: /\b(خوش|بہت اچھا|پرجوش|حیرت انگیز)\b/i }, responses: { failure: { emotion: 'مایوس', risk_level: 'Medium', reason: "ایسا لگتا ہے کہ آپ حالیہ نتیجے سے مایوس ہیں۔", suggestion: "ایسی ناکامیاں مشکل ہوتی ہیں, لیکن یہ آپ کی تعریف نہیں کرتیں۔ یہ ایک لمبے سفر کا صرف ایک قدم ہے۔" }, crisis: { emotion: 'شدید پریشانی', risk_level: 'High', reason: 'آپ کے الفاظ بتاتے ہیں کہ آپ شدید تکلیف میں ہیں۔', suggestion: "آپ کی حفاظت سب سے اہم ہے۔ براہ کرم سائڈبار میں کرائسس سپورٹ نمبرز کا استعمال کریں۔ آپ اکیلے نہیں ہیں۔" }, anxiety: { emotion: 'پریشان', risk_level: 'Medium', reason: 'ایسا لگتا ہے کہ آپ کے ذہن میں بہت کچھ ہے۔', suggestion: "جب خیالات دوڑیں تو اپنے پیروں کو فرش پر محسوس کرنے کی کوشش کریں اور گہری سانس لیں۔" }, happiness: { emotion: 'خوش', risk_level: 'Low', reason: 'ایسا لگتا ہے کہ کچھ شاندار ہوا ہے!', suggestion: "یہ بہت اچھا ہے! اس مثبت توانائی سے لطف اٹھائیں۔" }, neutral: { emotion: 'غیر جانبدار', risk_level: 'Low', reason: 'ابھی حالات پرسکون لگ رہے ہیں۔', suggestion: "یہ آرام کرنے یا کچھ تفریحی करने کا اچھا وقت ہے۔" } }, relationVoices: { father: "ایک باپ کے طور پر:", mother: "بیٹا/بیٹی, تمہاری ماں کہتی ہے:", sister: "تمہاری بہن کی طرف سے:", best_friend: "تمہارے بہترین دوست کے طور پر:", teacher: "آئیے اسے سیکھنے کے نقطہ نظر سے دیکھتے ہیں:", therapist: "شیئر کرنے کا شکریہ:", stranger: "اگرچہ میں اجنبی ہوں, میں سن رہا ہوں:" }, stories: { failure: [ { person: "جے کے رولنگ", story: "ہیری پوٹر قبول ہونے سے پہلے انہیں 12 پبلشرز نے مسترد کر دیا تھا۔" } ], sadness: [ { person: "ڈوین 'دی راک' جانسن", story: "انہوں نے ڈپریشن کے ساتھ اپنی جنگ کے بارے میں کھل کر بات کی ہے, یہ ثابت کرتے ہوئے کہ کمزوری ایک طاقت ہے۔" } ] } } }
        };
        const updateLanguage = (langCode) => { currentLanguage = langCode; const uiPack = languagePacks[langCode].ui; userInput.placeholder = uiPack.placeholder; voiceStatus.textContent = uiPack.voiceStatus; if (recognition) { recognition.lang = langCode; } };
        const mockAnalyzeUserInput = (text, relation, language) => { const langPack = languagePacks[language].analysis; const { keywords, responses, relationVoices, stories } = langPack; const lowerText = text.toLowerCase(); let storyCategory = null; let response = { ...responses.neutral }; if (keywords.failure.test(lowerText)) { storyCategory = 'failure'; response = { ...responses.failure }; } else if (keywords.crisis.test(lowerText)) { response = { ...responses.crisis }; } else if (keywords.anxiety.test(lowerText)) { storyCategory = 'anxiety'; response = { ...responses.anxiety }; } else if (keywords.sadness.test(lowerText)) { storyCategory = 'sadness'; response = { ...responses.sadness }; } else if (keywords.happiness.test(lowerText)) { response = { ...responses.happiness }; } if (relation && relationVoices[relation]) { response.suggestion = `<strong>${relationVoices[relation]}</strong> ${response.suggestion}`; } if (storyCategory && stories[storyCategory]) { const storyOptions = stories[storyCategory]; const story = storyOptions[Math.floor(Math.random() * storyOptions.length)]; const storyTitle = `💡 An Inspiring Story: ${story.person}`; const storyHTML = `<div class="inspirational-story"><h4>${storyTitle}</h4><p>${story.story}</p></div>`; response.suggestion += storyHTML; } return response; };
        const displayAnalysisResult = (result) => { const { llm_result } = result; const riskClass = `risk-${llm_result.risk_level.toLowerCase()}`; const riskEmojis = { "Low": "🟢", "Medium": "🟡", "High": "🔴" }; const uiPack = languagePacks[currentLanguage].ui; analysisResultContainer.innerHTML = `<h3>${uiPack.analysisTitle}</h3><div class="emotion-card ${riskClass}"><h4>${uiPack.inputHeader}</h4><p>"${result.input_text}"</p><div class="result-details"><div>🎭 <strong>${uiPack.emotionLabel}:</strong> ${llm_result.emotion}</div><div>${riskEmojis[llm_result.risk_level]} <strong>${uiPack.riskLabel}:</strong> ${llm_result.risk_level}</div></div><p class="insight">💡 <strong>${uiPack.insightLabel}:</strong> ${llm_result.reason}</p><div class="suggestion"><p>🤖 <strong>${uiPack.suggestionLabel}:</strong> ${llm_result.suggestion}</p></div></div>`; };
        const triggerAnalysis = (text) => { if (!text.trim()) return; analysisResultContainer.innerHTML = `<h3>🧠 Finding helpful insights...</h3>`; const llm_result = mockAnalyzeUserInput(text, selectedRelation, currentLanguage); const result = { input_text: text, method: 'Local AI', llm_result: llm_result }; setTimeout(() => { analysisHistory.push({ timestamp: new Date(), ...result }); displayAnalysisResult(result); }, 500); };
        const init = () => {
            backendStatus.textContent = '✅ AI: Demo Mode';
            backendStatus.classList.replace('status-warning', 'status-online');
            toggleRelationBtn.addEventListener('click', () => { relationSelectContainer.style.display = relationSelectContainer.style.display === 'block' ? 'none' : 'block'; });
            relationSelect.addEventListener('change', (e) => { selectedRelation = e.target.value; });
            analyzeBtn.addEventListener('click', () => triggerAnalysis(userInput.value));
            inputMethodSelector.addEventListener('change', (e) => { textControls.style.display = e.target.value === 'text' ? 'block' : 'none'; voiceControls.style.display = e.target.value === 'voice' ? 'block' : 'none'; if (isRecording && e.target.value === 'text') { recognition.stop(); } });
            languageSelect.addEventListener('change', (e) => updateLanguage(e.target.value));
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                updateLanguage(currentLanguage);
                recordBtn.addEventListener('click', () => { if (isRecording) { recognition.stop(); } else { userInput.value = ''; recognition.start(); } });
                recognition.onstart = () => { isRecording = true; recordBtn.textContent = '🛑 Stop Recording'; recordBtn.classList.add('recording'); voiceStatus.textContent = 'Listening...'; };
                recognition.onend = () => { isRecording = false; recordBtn.textContent = '🎙 Start Recording'; recordBtn.classList.remove('recording'); if (userInput.value.trim()) { voiceStatus.textContent = 'Processing...'; triggerAnalysis(userInput.value); setTimeout(() => { updateLanguage(currentLanguage); }, 2000); } else { voiceStatus.textContent = languagePacks[currentLanguage].ui.voiceStatus; } };
                recognition.onerror = (event) => { console.error('Speech Recognition Error:', event.error); voiceStatus.textContent = `Error: ${event.error}`; isRecording = false; recordBtn.textContent = '🎙 Start Recording'; recordBtn.classList.remove('recording'); };
                recognition.onresult = (event) => { let finalTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { finalTranscript += event.results[i][0].transcript; } userInput.value = finalTranscript; };
            } else {
                document.querySelector('label:has(input[value="voice"])').style.display = 'none';
                voiceControls.style.display = 'none';
                languageSelect.parentElement.style.display = 'none';
            }
        };
        init();
    };

    // --- QUIZ MODULE ---
    const quizModule = () => {
        const quizForm = document.getElementById('quiz-form');
        const quizResultContainer = document.getElementById('quiz-result-container');
        if (!quizForm) return;
        const quizQuestions = [ { q: "Little interest or pleasure in doing things", name: "pleasure" }, { q: "Feeling down, depressed, or hopeless", name: "down" }, { q: "Trouble falling/staying asleep, or sleeping too much", name: "sleep" }, { q: "Feeling tired or having little energy", name: "energy" }, { q: "Poor appetite or overeating", name: "appetite" }, { q: "Feeling bad about yourself or that you’re a failure", name: "selfEsteem" }, { q: "Trouble concentrating on things", name: "concentration" }, { q: "Feeling nervous, anxious, or on edge", name: "anxious" }, { q: "Not being able to stop or control worrying", name: "worry" }, { q: "Becoming easily annoyed or irritable", name: "irritable" } ];
        const quizOptions = [ { text: "Not at all", value: 0 }, { text: "Several days", value: 1 }, { text: "More than half the days", value: 2 }, { text: "Nearly every day", value: 3 } ];
        const generateQuiz = () => { let quizHTML = quizQuestions.map((question, index) => `<div class="quiz-question"><p>${index + 1}. ${question.q}</p><div class="quiz-options">${quizOptions.map(option => `<label><input type="radio" name="${question.name}" value="${option.value}" required> ${option.text}</label>`).join('')}</div></div>`).join(''); quizHTML += `<button type="submit" class="button-primary">📈 See My Results</button>`; quizForm.innerHTML = quizHTML; };
        const displayQuizResults = (score) => { let result = {}; if (score <= 4) { result = { level: "Minimal Concern", class: "risk-low", interpretation: "Your responses suggest minimal or no symptoms of distress.", recommendations: ["Continue positive coping strategies.", "Practice regular self-care.", "Connect with friends and family."] }; } else if (score <= 9) { result = { level: "Mild Concern", class: "risk-low", interpretation: "Your score indicates mild symptoms of distress, often manageable with self-care.", recommendations: ["<strong>Gentle Exercise:</strong> Try a short walk or stretching.", "<strong>Mindfulness:</strong> Spend 5-10 minutes focusing on your breath.", "<strong>Connect:</strong> Reach out to a friend to talk."] }; } else if (score <= 14) { result = { level: "Moderate Concern", class: "risk-medium", interpretation: "Your responses suggest a moderate level of distress that may be impacting your daily life.", recommendations: ["<strong>Establish a Routine:</strong> Consistent sleep and meals can provide stability.", "<strong>Limit Stressors:</strong> Identify and reduce exposure to major stress sources.", "<strong>Consider Professional Support:</strong> Talking to a therapist could provide valuable tools."] }; } else { result = { level: "High Concern", class: "risk-high", interpretation: "Your score indicates significant symptoms of distress. Reaching out for help is a sign of strength.", recommendations: ["<strong>Seek Professional Help:</strong> It is strongly recommended that you speak with a doctor or mental health professional.", "<strong>Talk to Someone You Trust:</strong> Do not go through this alone.", "<strong>Immediate Help:</strong> If you are in crisis, please use the crisis support numbers in the sidebar."] }; } quizResultContainer.innerHTML = `<div class="quiz-result-card ${result.class}"><h3>Your Result: ${result.level} (Score: ${score})</h3><p><strong>Interpretation:</strong> ${result.interpretation}</p><h4><strong>Recommendations:</strong></h4><ul>${result.recommendations.map(r => `<li>${r}</li>`).join('')}</ul><p><small><strong>Disclaimer:</strong> This quiz is not a diagnostic tool. Please consult a healthcare professional for a medical diagnosis.</small></p></div>`; quizResultContainer.scrollIntoView({ behavior: 'smooth' }); };
        generateQuiz();
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(quizForm);
            let totalScore = 0;
            for (let value of formData.values()) {
                totalScore += parseInt(value, 10);
            }
            displayQuizResults(totalScore);
        });
    };

    // --- COMFORT BOX MODULE ---
    const comfortBoxModule = () => {
        const page = document.getElementById('page-comfort-box');
        if (!page) return;

        // Selectors for all interactive elements in the Comfort Box
        const itemTypeSelect = page.querySelector('#itemTypeSelect');
        const itemContentInput = page.querySelector('#itemContentInput');
        const addItemBtn = page.querySelector('#addItemBtn');
        const itemListContainer = page.querySelector('#itemListContainer');
        const shredderInput = page.querySelector('#shredder-input');
        const shredBtn = page.querySelector('#shred-btn');
        const shredderAnimationContainer = page.querySelector('#shredder-animation-container');
        const affirmationRecordBtn = page.querySelector('#affirmation-record-btn');
        const affirmationStopBtn = page.querySelector('#affirmation-stop-btn');
        const affirmationStatus = page.querySelector('#affirmation-status');

        // State management
        const STORAGE_KEY = 'vercelComfortBoxItems';
        let comfortItems = [];
        let mediaRecorder;
        let audioChunks = [];
        // A self-contained, base64-encoded sound for the shredder to avoid extra file requests
        const shredSound = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwESJgAAAAAAAAAAAAAAcGF2YwAAAAgAAAAAAFACgAAA/+kQAgwAAGkHGFxRIgBAgQIAwiQoAJIAaQdY3EcSAgBAgQIAMhTHYBYAiQdYnEcSAgBAgQIAMhTHYBYAiQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdY3EcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdY-");
        
        const loadItems = () => { comfortItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); };
        const saveItems = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(comfortItems)); };
        
        const renderItems = () => {
            itemListContainer.innerHTML = '';
            if (comfortItems.length === 0) {
                itemListContainer.innerHTML = `<p class="input-label" style="text-align:center;">Your comfort box is empty. Add something that brings you joy!</p>`;
            }
            comfortItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'comfort-item';
                let contentHTML = '';
                // Handle rendering different item types, including the new 'Affirmation'
                switch (item.type) {
                    case 'Image URL': contentHTML = `<img src="${item.content}" alt="Comfort image">`; break;
                    case 'Music Link': contentHTML = `<a href="${item.content}" target="_blank" rel="noopener noreferrer">${item.content}</a>`; break;
                    case 'Affirmation': contentHTML = `<audio controls src="${item.content}"></audio>`; break;
                    default: contentHTML = `<p>${item.content}</p>`;
                }
                itemEl.innerHTML = `<strong>${item.type}</strong>${contentHTML}<button class="delete-item-btn" data-id="${item.id}">×</button>`;
                itemListContainer.appendChild(itemEl);
            });
        };

        const handleAddItem = () => {
            const type = itemTypeSelect.value;
            const content = itemContentInput.value.trim();
            if (!content) return;
            // Add new item to the start of the array
            comfortItems.unshift({ id: Date.now(), type, content });
            saveItems();
            renderItems();
            itemContentInput.value = '';
        };

        const handleDeleteItem = (e) => {
            if (e.target.classList.contains('delete-item-btn')) {
                const itemId = parseInt(e.target.dataset.id, 10);
                comfortItems = comfortItems.filter(item => item.id !== itemId);
                saveItems();
                renderItems();
            }
        };

        const handleShredThought = () => {
            const text = shredderInput.value;
            if (!text.trim()) return;
            
            shredSound.currentTime = 0;
            shredSound.play();
            
            shredderAnimationContainer.innerHTML = '';
            shredderInput.style.visibility = 'hidden'; // Hide textarea during animation
            shredBtn.disabled = true;

            const stripCount = 20;
            for (let i = 0; i < stripCount; i++) {
                const strip = document.createElement('div');
                strip.className = 'shred-strip';
                strip.style.left = `${(i / stripCount) * 100}%`;
                strip.style.width = `${100 / stripCount}%`;
                strip.style.animationName = 'shred-fall';
                strip.style.animationDelay = `${Math.random() * 0.3}s`;
                shredderAnimationContainer.appendChild(strip);
            }

            // Reset UI after animation
            setTimeout(() => {
                shredderInput.value = '';
                shredderInput.style.visibility = 'visible';
                shredBtn.disabled = false;
                shredderAnimationContainer.innerHTML = '';
            }, 2000);
        };
        
        const handleStartRecording = async () => {
            try {
                // Request access to the microphone
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                // Update UI to reflect recording state
                affirmationRecordBtn.style.display = 'none';
                affirmationStopBtn.style.display = 'block';
                affirmationRecordBtn.classList.add('recording');
                affirmationStatus.textContent = 'Recording...';

                // Collect audio data
                mediaRecorder.addEventListener('dataavailable', event => { audioChunks.push(event.data); });
                
                // Handle the stop event
                mediaRecorder.addEventListener('stop', () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        // Convert audio to base64 and save to the comfort box
                        const base64Audio = reader.result;
                        comfortItems.unshift({ id: Date.now(), type: 'Affirmation', content: base64Audio });
                        saveItems();
                        renderItems();
                        audioChunks = [];
                    };
                    // Stop the microphone track
                    stream.getTracks().forEach(track => track.stop());
                });
            } catch (err) {
                console.error("Error accessing microphone:", err);
                affirmationStatus.textContent = 'Microphone access denied.';
            }
        };

        const handleStopRecording = () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                
                // Update UI
                affirmationRecordBtn.style.display = 'block';
                affirmationStopBtn.style.display = 'none';
                affirmationRecordBtn.classList.remove('recording');
                affirmationStatus.textContent = 'Recording saved to your box!';
            }
        };

        // Initializer for the module
        const init = () => {
            loadItems();
            renderItems();

            // Add event listeners for all features
            addItemBtn.addEventListener('click', handleAddItem);
            itemListContainer.addEventListener('click', handleDeleteItem);
            shredBtn.addEventListener('click', handleShredThought);

            // Gracefully hide voice features if the browser doesn't support them
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                affirmationRecordBtn.addEventListener('click', handleStartRecording);
                affirmationStopBtn.addEventListener('click', handleStopRecording);
            } else {
                document.getElementById('voice-affirmation-section').style.display = 'none';
            }
        };
        init();
    };

    // --- TASK TRACKER MODULE ---
    const taskTrackerModule = () => {
        const dailyTaskCard = document.getElementById('daily-task-card');
        const happinessGraphCard = document.getElementById('happiness-graph-card');
        const taskModal = document.getElementById('task-modal');
        const graphModal = document.getElementById('graph-modal');
        const closeBtns = document.querySelectorAll('.modal .close-btn');
        const todayDateEl = document.getElementById('today-date');
        const todayTaskTextEl = document.getElementById('today-task-text');
        const todayTaskCheckbox = document.getElementById('today-task-checkbox');
        const taskCompletionMessage = document.getElementById('task-completion-message');
        const taskInput = document.getElementById('task-input');
        const saveTaskBtn = document.getElementById('save-task-btn');
        const weeklyPlannerContainer = document.getElementById('weekly-planner-container');
        const graphYearEl = document.getElementById('graph-year');
        const happinessScoreDetailsEl = document.getElementById('happiness-score-details');
        const graphMonthsContainer = document.querySelector('.graph-months');
        const graphDaysContainer = document.querySelector('.graph-days');
        const graphGridContainer = document.querySelector('.graph-grid');
        const sidebarTaskText = document.getElementById('sidebar-task-text');
        const sidebarHappinessScore = document.getElementById('sidebar-happiness-score');
        if (!dailyTaskCard) return; // Exit if the elements for this module aren't on the page
        const todayTaskLabel = todayTaskCheckbox.closest('label');
        const taskSuggestionsDatalist = document.getElementById('task-suggestions');
        const STORAGE_KEY = 'vercelWellnessData';
        let state = { tasks: {} };
        const TASK_SUGGESTIONS = [ "Take a 10-minute walk outside", "Call an old friend", "Write down three things you're grateful for", "Meditate for 5 minutes", "Listen to a calming playlist", "Stretch your body for 10 minutes", "Read a chapter of a book", "Tidy up one small area of your room", "Do a quick 15-minute workout", "Watch a funny video or show", "Drink a full glass of water", "Spend 15 minutes on a hobby", "Write a short journal entry", "Plan your day tomorrow", "Do a digital detox for an hour" ];
        const getFormattedDate = (date) => date.toISOString().split('T')[0];
        const getTodayKey = () => getFormattedDate(new 'Date'());
        const loadState = () => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) state = JSON.parse(saved); };
        const saveState = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };
        const calculateHappinessScore = () => Object.values(state.tasks).filter(task => task.completed).length;
        const renderAll = () => { const score = calculateHappinessScore(); renderSidebar(score); renderTodayTask(); renderWeeklyPlanner(); renderHappinessGraph(score); };
        const renderSidebar = (score) => { const todayTask = state.tasks[getTodayKey()]; sidebarTaskText.textContent = todayTask?.text || 'No task set'; sidebarHappinessScore.textContent = `${score}/365`; };
        const renderTodayTask = () => { const todayKey = getTodayKey(); const todayTask = state.tasks[todayKey]; todayDateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); if (todayTask?.text) { todayTaskTextEl.textContent = todayTask.text; todayTaskCheckbox.checked = todayTask.completed; todayTaskCheckbox.disabled = todayTask.completed; todayTaskLabel.classList.toggle('completed', todayTask.completed); taskCompletionMessage.textContent = todayTask.completed ? "Great job! You completed your task for today." : ""; taskInput.value = todayTask.text; taskInput.disabled = todayTask.completed; saveTaskBtn.disabled = todayTask.completed; } else { todayTaskTextEl.textContent = "Choose a task below to get started!"; todayTaskCheckbox.checked = false; todayTaskCheckbox.disabled = true; todayTaskLabel.classList.remove('completed'); taskCompletionMessage.textContent = ""; taskInput.value = ''; taskInput.disabled = false; saveTaskBtn.disabled = false; } };
        const renderWeeklyPlanner = () => { weeklyPlannerContainer.innerHTML = ''; const today = new Date(); const dayOfWeek = today.getDay(); const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); for (let i = 0; i < 7; i++) { const day = new Date(startOfWeek); day.setDate(startOfWeek.getDate() + i); const dateKey = getFormattedDate(day); const task = state.tasks[dateKey]; const dayDiv = document.createElement('div'); dayDiv.className = 'day-planner'; dayDiv.innerHTML = `<span>${day.toLocaleDateString('en-US', { weekday: 'short' })}, ${day.getDate()}</span><input type="text" data-date="${dateKey}" value="${task?.text || ''}" placeholder="Plan a task..." ${task?.completed ? 'disabled' : ''}>`; weeklyPlannerContainer.appendChild(dayDiv); } };
        const renderHappinessGraph = (score) => { const year = new Date().getFullYear(); graphYearEl.textContent = year; happinessScoreDetailsEl.textContent = `Happiness Score: ${score}/365`; graphMonthsContainer.innerHTML = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `<span>${m}</span>`).join(''); graphDaysContainer.innerHTML = `<span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span>`; graphGridContainer.innerHTML = ''; const yearStart = new Date(year, 0, 1); let dayOffset = yearStart.getDay() - 1; if (dayOffset < 0) dayOffset = 6; for(let i=0; i < dayOffset; i++) { graphGridContainer.appendChild(document.createElement('div')); } for (let day = new Date(yearStart); day.getFullYear() === year; day.setDate(day.getDate() + 1)) { const dateKey = getFormattedDate(new Date(day)); const dayCell = document.createElement('div'); const task = state.tasks[dateKey]; if (task?.completed) { dayCell.classList.add('completed-1'); dayCell.title = `${dateKey}: ${task.text}`; } else { dayCell.title = dateKey; } graphGridContainer.appendChild(dayCell); } };
        const handleSetTask = () => { const taskText = taskInput.value.trim(); if (!taskText) return; const todayKey = getTodayKey(); if (state.tasks[todayKey] && state.tasks[todayKey].completed) return; if (!state.tasks[todayKey]) state.tasks[todayKey] = { text: '', completed: false }; state.tasks[todayKey].text = taskText; saveState(); renderAll(); };
        const handleMarkCompleted = (e) => { if (!e.target.checked) return; const todayKey = getTodayKey(); if (state.tasks[todayKey] && !state.tasks[todayKey].completed) { state.tasks[todayKey].completed = true; saveState(); renderAll(); } };
        const handleWeeklyPlanInput = (e) => { const dateKey = e.target.dataset.date; const taskText = e.target.value.trim(); if (state.tasks[dateKey] && state.tasks[dateKey].completed) return; if (!state.tasks[dateKey]) state.tasks[dateKey] = { text: '', completed: false }; state.tasks[dateKey].text = taskText; saveState(); if (dateKey === getTodayKey()) renderAll(); };
        const openModal = (modalEl) => modalEl.style.display = 'block';
        const closeModal = (modalEl) => modalEl.style.display = 'none';
        const init = () => { loadState(); taskSuggestionsDatalist.innerHTML = TASK_SUGGESTIONS.map(task => `<option value="${task}"></option>`).join(''); dailyTaskCard.addEventListener('click', () => { renderAll(); openModal(taskModal); }); happinessGraphCard.addEventListener('click', () => { renderAll(); openModal(graphModal); }); closeBtns.forEach(btn => btn.addEventListener('click', e => closeModal(e.target.closest('.modal')))); window.addEventListener('click', e => { if (e.target === taskModal) closeModal(taskModal); if (e.target === graphModal) closeModal(graphModal); }); saveTaskBtn.addEventListener('click', handleSetTask); taskInput.addEventListener('change', handleSetTask); todayTaskCheckbox.addEventListener('change', handleMarkCompleted); weeklyPlannerContainer.addEventListener('change', (e) => { if (e.target.tagName === 'INPUT') handleWeeklyPlanInput(e); }); renderSidebar(calculateHappinessScore()); };
        init();
    };

    // --- CALMING MUSIC PLAYER MODULE ---
    const musicPlayerModule = () => {
        const musicGrid = document.getElementById('music-player-grid');
        if (!musicGrid) return;
        const tracks = [ { title: "Peaceful Serenity", artist: "Calm Tones", audioSrc: "assets/audio/calm-piano.mp3", imgSrc: "assets/images/calm-piano.jpg" }, { title: "Ambient Bliss", artist: "A.I. Composer", audioSrc: "assets/audio/ambient-bliss.mp3", imgSrc: "assets/images/ambient-bliss.jpg" }, { title: "Forest Lullaby", artist: "Nature Sounds", audioSrc: "assets/audio/forest-lullaby.mp3", imgSrc: "assets/images/forest-lullaby.jpg" } ];
        let currentAudio = null;
        const formatTime = (seconds) => { const minutes = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; };
        musicGrid.innerHTML = tracks.map((track, index) => ` <div class="music-card" data-track-index="${index}"> <img src="${track.imgSrc}" alt="${track.title}" class="album-art"> <div class="track-info"> <h5>${track.title}</h5> <p>${track.artist}</p> </div> <div class="player-controls"> <div class="time-display"> <span class="current-time">0:00</span> <span class="total-duration">0:00</span> </div> <input type="range" class="progress-bar" value="0" max="100"> <button class="play-pause-btn" data-state="paused"></button> <audio src="${track.audioSrc}" preload="metadata"></audio> </div> </div> `).join('');
        const musicCards = musicGrid.querySelectorAll('.music-card');
        musicCards.forEach(card => {
            const audio = card.querySelector('audio');
            const playPauseBtn = card.querySelector('.play-pause-btn');
            const progressBar = card.querySelector('.progress-bar');
            const currentTimeEl = card.querySelector('.current-time');
            const totalDurationEl = card.querySelector('.total-duration');
            playPauseBtn.addEventListener('click', () => {
                const isPlaying = playPauseBtn.dataset.state === 'playing';
                if (isPlaying) { audio.pause(); } else { if (currentAudio && currentAudio !== audio) { currentAudio.pause(); } currentAudio = audio; audio.play(); }
            });
            audio.addEventListener('play', () => {
                playPauseBtn.dataset.state = 'playing';
                card.classList.add('playing');
                musicCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('playing');
                        otherCard.querySelector('.play-pause-btn').dataset.state = 'paused';
                    }
                });
            });
            audio.addEventListener('pause', () => { playPauseBtn.dataset.state = 'paused'; card.classList.remove('playing'); });
            audio.addEventListener('loadedmetadata', () => { totalDurationEl.textContent = formatTime(audio.duration); progressBar.max = audio.duration; });
            audio.addEventListener('timeupdate', () => { progressBar.value = audio.currentTime; currentTimeEl.textContent = formatTime(audio.currentTime); });
            progressBar.addEventListener('input', () => { audio.currentTime = progressBar.value; });
        });
    };

    // --- ZEN GARDEN GAME MODULE ---
    const zenGardenModule = () => {
        const canvas = document.getElementById('zenGardenCanvas');
        const clearBtn = document.getElementById('zen-clear-btn');
        const colorBtn = document.getElementById('zen-color-btn');
        if (!canvas || !clearBtn || !colorBtn) return { activate: () => {}, deactivate: () => {} };
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        const sandColors = ['#f4f1ea', '#e8e2d8', '#f9f5ed', '#dcd5c8'];
        let currentColorIndex = 0;
        const draw = (e) => { if (!isDrawing) return; const rect = canvas.getBoundingClientRect(); const x = e.offsetX || e.touches[0].clientX - rect.left; const y = e.offsetY || e.touches[0].clientY - rect.top; ctx.strokeStyle = '#d1c7b8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke();[lastX, lastY] = [x, y]; };
        const startDrawing = (e) => { isDrawing = true; const rect = canvas.getBoundingClientRect();[lastX, lastY] = [e.offsetX || e.touches[0].clientX - rect.left, e.offsetY || e.touches[0].clientY - rect.top]; };
        const stopDrawing = () => isDrawing = false;
        const clearCanvas = () => { ctx.fillStyle = sandColors[currentColorIndex]; ctx.fillRect(0, 0, canvas.width, canvas.height); };
        const changeColor = () => { currentColorIndex = (currentColorIndex + 1) % sandColors.length; clearCanvas(); };
        const activate = () => { canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('mouseout', stopDrawing); canvas.addEventListener('touchstart', startDrawing); canvas.addEventListener('touchmove', draw); canvas.addEventListener('touchend', stopDrawing); clearBtn.addEventListener('click', clearCanvas); colorBtn.addEventListener('click', changeColor); clearCanvas(); };
        const deactivate = () => { canvas.removeEventListener('mousedown', startDrawing); canvas.removeEventListener('mousemove', draw); canvas.removeEventListener('mouseup', stopDrawing); canvas.removeEventListener('mouseout', stopDrawing); canvas.removeEventListener('touchstart', startDrawing); canvas.removeEventListener('touchmove', draw); canvas.removeEventListener('touchend', stopDrawing); clearBtn.removeEventListener('click', clearCanvas); colorBtn.removeEventListener('click', changeColor); };
        return { activate, deactivate };
    };

    // --- BUBBLE POP GAME MODULE ---
    const bubblePopGameModule = () => {
        const container = document.getElementById('bubble-wrap-container');
        const resetBtn = document.getElementById('bubble-reset-btn');
        if (!container || !resetBtn) return { activate: () => {}, deactivate: () => {} };
        const bubbleCount = 100;
        let popSound;
        const createPopSound = () => { const popSoundBase64 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwESJgAAAAAAAAAAAAAAcGF2YwAAAAgAAAAAAFACgAAA/+kQAgwAAGkHGFxRIgBAgQIAwiQoAJIAaQdY3EcSAgBAgQIAMhTHYBYAiQdYnEcSAgBAgQIAMhTHYBYAiQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdY3EcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdYnEcSAgBAgQIAMhTHYBYBCQdY-"; popSound = new Audio(popSoundBase64); popSound.preload = "auto"; };
        const generateBubbles = () => { container.innerHTML = ''; for (let i = 0; i < bubbleCount; i++) { const bubble = document.createElement('div'); bubble.classList.add('bubble'); container.appendChild(bubble); } };
        const handlePop = (e) => { if (e.target.classList.contains('bubble') && !e.target.classList.contains('popped')) { e.target.classList.add('popped'); if (popSound) { popSound.currentTime = 0; popSound.play(); } } };
        const activate = () => { generateBubbles(); createPopSound(); container.addEventListener('click', handlePop); resetBtn.addEventListener('click', generateBubbles); };
        const deactivate = () => { container.innerHTML = ''; };
        return { activate, deactivate };
    };

    // --- COMMUNITY STORIES MODULE ---
    const communityStoriesModule = () => {
        const storiesListContainer = document.getElementById('stories-list-container');
        const shareStoryToggleBtn = document.getElementById('share-story-toggle-btn');
        const storyFormContainer = document.getElementById('story-form-container');
        const storyTitleInput = document.getElementById('story-title-input');
        const storyContentInput = document.getElementById('story-content-input');
        const submitStoryBtn = document.getElementById('submit-story-btn');
        if (!storiesListContainer) return;
        let stories = [];
        let votedStoryIds = new Set();
        const STORIES_KEY = 'vercelCommunityStories';
        const VOTED_IDS_KEY = 'vercelVotedStoryIds';
        const defaultStories = [ { id: 1, title: "I finally reached out", content: "I was feeling so isolated, but today I texted a friend and told them I was having a hard time. They were so supportive. It felt like a huge weight was lifted just by sharing.", votes: 28 }, { id: 2, title: "Took a walk and it helped", content: "My thoughts were racing, so I forced myself to go for a 15-minute walk without my phone. Just focusing on the trees and the sounds around me really calmed my mind. A small win!", votes: 19 }, { id: 3, title: "Passed a test I was scared of", content: "I had so much anxiety about this exam. I studied a little bit every day, focusing on small steps. I passed! It showed me that I'm more capable than my anxiety tells me.", votes: 15 }, ];
        const loadData = () => { const savedStories = localStorage.getItem(STORIES_KEY); const savedVotedIds = localStorage.getItem(VOTED_IDS_KEY); stories = savedStories ? JSON.parse(savedStories) : defaultStories; votedStoryIds = savedVotedIds ? new Set(JSON.parse(savedVotedIds)) : new Set(); };
        const saveData = () => { localStorage.setItem(STORIES_KEY, JSON.stringify(stories)); localStorage.setItem(VOTED_IDS_KEY, JSON.stringify(Array.from(votedStoryIds))); };
        const renderStories = () => { stories.sort((a, b) => b.votes - a.votes); storiesListContainer.innerHTML = ''; if (stories.length === 0) { storiesListContainer.innerHTML = `<p class="input-label" style="text-align:center;">No stories yet. Be the first to share one!</p>`; return; } stories.forEach(story => { const storyCard = document.createElement('div'); storyCard.className = 'story-card'; const hasVoted = votedStoryIds.has(story.id); storyCard.innerHTML = `<h4>${story.title}</h4><p>${story.content}</p><div class="story-voting"><button class="vote-btn" data-id="${story.id}" ${hasVoted ? 'disabled' : ''}>💖 ${hasVoted ? 'Voted' : 'Vote'}</button><span class="vote-count">${story.votes} votes</span></div>`; storiesListContainer.appendChild(storyCard); }); addVoteEventListeners(); };
        const addVoteEventListeners = () => { storiesListContainer.querySelectorAll('.vote-btn').forEach(button => { button.addEventListener('click', handleVote); }); };
        const handleVote = (e) => { const storyId = parseInt(e.target.dataset.id, 10); if (votedStoryIds.has(storyId)) return; const story = stories.find(s => s.id === storyId); if (story) { story.votes++; votedStoryIds.add(storyId); saveData(); renderStories(); } };
        const handleStorySubmit = () => { const title = storyTitleInput.value.trim(); const content = storyContentInput.value.trim(); if (!title || !content) { alert('Please fill out both a title and a story.'); return; } const newStory = { id: Date.now(), title, content, votes: 0 }; stories.unshift(newStory); saveData(); renderStories(); storyTitleInput.value = ''; storyContentInput.value = ''; storyFormContainer.style.display = 'none'; shareStoryToggleBtn.textContent = 'Share Your Inspiring Story'; };
        const init = () => { loadData(); renderStories(); shareStoryToggleBtn.addEventListener('click', () => { const isVisible = storyFormContainer.style.display === 'block'; storyFormContainer.style.display = isVisible ? 'none' : 'block'; shareStoryToggleBtn.textContent = isVisible ? 'Share Your Inspiring Story' : 'Cancel'; }); submitStoryBtn.addEventListener('click', handleStorySubmit); };
        init();
    };

    // --- KINDNESS CACHE MODULE ---
    const kindnessCacheModule = () => {
        const container = document.getElementById('kindness-cache-container');
        if (!container) return;
        const box = document.getElementById('kindness-cache-box');
        const closedBox = document.getElementById('gift-box-closed');
        const complimentText = document.getElementById('compliment-text');
        const newBtn = document.getElementById('new-compliment-btn');
        const closeBtn = document.getElementById('kindness-cache-close-btn');
        const compliments = [ "Your perspective is refreshing.", "You have a wonderful laugh.", "You are a fantastic listener.", "Your kindness is a balm to all who encounter it.", "You're more capable than you know.", "The world is better for having you in it.", "You have a natural talent for making people feel comfortable.", "Your resilience is inspiring.", "You're doing an amazing job, even on hard days.", "You light up the room.", "Your creativity is brilliant.", "You can make incredible things happen.", "Being around you is a joy.", "You are worthy of all good things.", "Your effort does not go unnoticed." ];
        let currentCompliment = '';
        const getNew = () => { let newC; do { newC = compliments[Math.floor(Math.random() * compliments.length)]; } while (newC === currentCompliment); currentCompliment = newC; complimentText.textContent = currentCompliment; };
        const open = () => { getNew(); box.classList.add('is-open'); };
        const hide = () => { container.classList.remove('visible'); setTimeout(() => box.classList.remove('is-open'), 400); };
        const show = () => { if (sessionStorage.getItem('kindnessCacheShown')) return; container.style.display = 'flex'; setTimeout(() => container.classList.add('visible'), 10); sessionStorage.setItem('kindnessCacheShown', 'true'); };
        const init = () => { setTimeout(show, 1500); closedBox.addEventListener('click', open); newBtn.addEventListener('click', getNew); closeBtn.addEventListener('click', hide); container.addEventListener('click', e => { if (e.target === container) hide(); }); };
        init();
    };

    // --- QUICK MOOD MODULE ---
    const quickMoodModule = () => {
        const moodGrid = document.querySelector('.mood-grid');
        const moodLogConfirm = document.getElementById('mood-log-confirm');
        if (!moodGrid || !moodLogConfirm) return;
        moodGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.mood-button');
            if (!button) return;
            const selectedMood = button.dataset.mood;
            moodGrid.querySelectorAll('.mood-button').forEach(btn => {
                btn.classList.remove('active-mood');
            });
            button.classList.add('active-mood');
            moodLogConfirm.textContent = `Thanks for sharing! Mood logged: ${selectedMood}.`;
            setTimeout(() => {
                moodLogConfirm.textContent = '';
            }, 4000);
        });
    };

    // --- MAIN APP INITIALIZER ---
    const initializeApp = () => {
        showPage('analysis');
        pageSelect.addEventListener('change', (e) => showPage(e.target.value));

        // Initialize all feature modules
        analysisModule();
        quizModule();
        comfortBoxModule();
        taskTrackerModule(); 
        musicPlayerModule(); 
        communityStoriesModule();
        kindnessCacheModule();
        quickMoodModule();

        // Initialize game modules
        gameControls.zenGarden = zenGardenModule();
        gameControls.bubblePop = bubblePopGameModule();
    };

    // --- START APP ---
    initializeApp();
});
