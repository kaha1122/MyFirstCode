import React, { useState } from 'react';
import { Languages, Sparkles } from 'lucide-react';
import TranslationCard from './components/TranslationCard';
import './App.css';

function App() {
  // API Key from Environment Variable
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 정밀 진단 로그
  console.log('--- System Diagnostic Start ---');
  console.log('Build Version: Feb-20-v6');
  console.log('Current VITE_GEMINI_API_KEY:', envApiKey ? 'Exists (Key Found!)' : 'None (Key Not Found)');

  // VITE_로 시작하는 모든 환경 변수 키 목록 확인 (오타 방지용)
  const allViteKeys = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
  console.log('Detected VITE_ keys:', allViteKeys);
  console.log('--- System Diagnostic End ---');

  const [geminiApiKey, setGeminiApiKey] = useState(envApiKey || '');

  // Load initial states from localStorage (Lazy Initial State)
  const [inputText, setInputText] = useState(() => localStorage.getItem('inputText') || '');
  const [translations, setTranslations] = useState(() => {
    const saved = localStorage.getItem('translations');
    return saved ? JSON.parse(saved) : { en: '', ja: '', zh: '' };
  });
  const [learningTips, setLearningTips] = useState(() => {
    const saved = localStorage.getItem('learningTips');
    return saved ? JSON.parse(saved) : {
      en: "Translation learning tips will appear here.",
      ja: "Translation learning tips will appear here.",
      zh: "Translation learning tips will appear here."
    };
  });
  const [pronunciations, setPronunciations] = useState(() => {
    const saved = localStorage.getItem('pronunciations');
    return saved ? JSON.parse(saved) : { en: '', ja: '', zh: '' };
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);

  // Persistence: Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('inputText', inputText);
    localStorage.setItem('translations', JSON.stringify(translations));
    localStorage.setItem('learningTips', JSON.stringify(learningTips));
    localStorage.setItem('pronunciations', JSON.stringify(pronunciations));
  }, [inputText, translations, learningTips, pronunciations]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setIsGeneratingTips(true);

    try {
      // 1. Translate
      const fetchTranslation = async (text, targetLang) => {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${targetLang}`
        );
        const data = await response.json();
        return data.responseData.translatedText;
      };

      const [en, ja, zh] = await Promise.all([
        fetchTranslation(inputText, 'en'),
        fetchTranslation(inputText, 'ja'),
        fetchTranslation(inputText, 'zh-CN')
      ]);

      setTranslations({ en, ja, zh });

      // 2. Generate Tips with Gemini (if API Key is present)
      if (geminiApiKey) {
        generateGeminiTips(inputText, { en, ja, zh });
      } else {
        setLearningTips({
          en: "Gemini API Key를 입력하면 AI 팁을 볼 수 있습니다.",
          ja: "Gemini API Key를 입력하면 AI 팁을 볼 수 있습니다.",
          zh: "Gemini API Key를 입력하면 AI 팁을 볼 수 있습니다."
        });
        setIsGeneratingTips(false);
      }

    } catch (error) {
      console.error("Translation failed:", error);
      alert("Translation failed. Please try again.");
      setIsGeneratingTips(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const generateGeminiTips = async (original, translated, retryCount = 0) => {
    try {
      const prompt = `
        You are a language tutor. Provide a helpful learning tip AND a pronunciation guide for each of the following translations of the Korean sentence: "${original}".
        
        Translations:
        1. English: "${translated.en}"
        2. Japanese: "${translated.ja}"
        3. Chinese: "${translated.zh}"

        Requirements for Pronunciation Guides:
        1. English (en): Provide the IPA (International Phonetic Alphabet) pronunciation guide.
        2. Japanese (ja): Provide the full Hiragana (ひらがな) transcription for the entire sentence, including any Kanji.
        3. Chinese (zh): Provide the Pinyin (한어병음) with tone marks.

        Important: Provide all learning tips in Korean (한국어로 작성).
        Return the response in strictly valid JSON format with keys "tips" and "pronunciations".
        Each of those should have sub-keys "en", "ja", "zh".
        Inside "tips", each value should be an array of 2-3 short strings in Korean.
        Inside "pronunciations", each value should be a single string (the guide).

        Example Format:
        {
          "tips": { "en": ["...", "..."], "ja": [...], "zh": [...] },
          "pronunciations": { "en": "/.../", "ja": "...", "zh": "..." }
        }
        Do not use Markdown code blocks. Just raw JSON.
      `;

      // Use Gemini 2.0 Flash as requested by user
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        // 429 Error Retry Logic (1 attempt after 2 seconds)
        if (response.status === 429 && retryCount < 1) {
          console.warn("Retrying Gemini API due to quota limit...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return generateGeminiTips(original, translated, retryCount + 1);
        }

        console.error("Gemini API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorData
        });

        let errorMessage = `API 오류 (${response.status})`;
        if (response.status === 404) errorMessage = "모델을 찾을 수 없습니다.";
        if (response.status === 429) errorMessage = "요청 한도가 초과되었습니다. (잠시 후 다시 시도해주세요)";
        if (response.status === 400 || response.status === 403) errorMessage = "API 키가 유효하지 않거나 권한이 없습니다.";

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;

      // Clean up markdown code blocks if present
      const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonString);

      setLearningTips(result.tips);
      setPronunciations(result.pronunciations);
    } catch (error) {
      console.error("Full Error Object:", error);
      setLearningTips({
        en: [`${error.message}`],
        ja: [`${error.message}`],
        zh: [`${error.message}`]
      });
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const handleSpeak = (text, lang) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    synth.speak(utterance);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="daily-tag">Daily Study</span>
        <h1 className="app-title">오늘의 문장 학습</h1>
      </header>

      <div className="primary-sentence-container">
        <span className="primary-label">Primary Sentence</span>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="오늘이라면 더더욱 좋겠어."
          className="text-input"
        />
        <div className="translate-btn-container">
          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={isTranslating || isGeneratingTips}
          >
            {isTranslating || isGeneratingTips ? (
              '처리 중...'
            ) : (
              <>
                <Sparkles size={18} />
                번역하기
              </>
            )}
          </button>
        </div>

        {/* API Key Input (Only show if not set in environment) */}
        {!envApiKey && (
          <div className="api-key-section">
            <input
              type="password"
              placeholder="Google Gemini API Key 입력"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="api-key-input"
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="api-key-link">
              키 발급받기 &rarr;
            </a>
          </div>
        )}
      </div>

      <div className="cards-grid">
        <TranslationCard
          language="English"
          text={translations.en}
          fullLanguage="ENGLISH"
          pronunciation={pronunciations.en}
          learningTip={learningTips.en}
          badgeColor="var(--badge-en)"
          badgeTextColor="var(--badge-en-text)"
          onSpeak={() => handleSpeak(translations.en, 'en-US')}
        />
        <TranslationCard
          language="Japanese"
          text={translations.ja}
          fullLanguage="日本語"
          pronunciation={pronunciations.ja}
          learningTip={learningTips.ja}
          badgeColor="var(--badge-ja)"
          badgeTextColor="var(--badge-ja-text)"
          onSpeak={() => handleSpeak(translations.ja, 'ja-JP')}
        />
        <TranslationCard
          language="Chinese"
          text={translations.zh}
          fullLanguage="中文"
          pronunciation={pronunciations.zh}
          learningTip={learningTips.zh}
          badgeColor="var(--badge-zh)"
          badgeTextColor="var(--badge-zh-text)"
          onSpeak={() => handleSpeak(translations.zh, 'zh-CN')}
        />
      </div>
    </div>
  );
}

export default App;
