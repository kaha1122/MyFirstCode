import React, { useState } from 'react';
import { Languages, Sparkles } from 'lucide-react';
import TranslationCard from './components/TranslationCard';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [translations, setTranslations] = useState({
    en: '',
    ja: '',
    zh: ''
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);

    try {
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
    } catch (error) {
      console.error("Translation failed:", error);
      alert("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
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
            disabled={isTranslating}
          >
            {isTranslating ? (
              '번역 중...'
            ) : (
              <>
                <Sparkles size={18} />
                번역하기
              </>
            )}
          </button>
        </div>
      </div>

      <div className="cards-grid">
        <TranslationCard
          language="English"
          text={translations.en}
          fullLanguage="ENGLISH"
          learningTip="'~라면'에 해당하는 if it were 구문과 '더더욱'에 해당하는 even better 표현에 주목하세요."
          badgeColor="var(--badge-en)"
          badgeTextColor="var(--badge-en-text)"
          onSpeak={() => handleSpeak(translations.en, 'en-US')}
        />
        <TranslationCard
          language="Japanese"
          text={translations.ja}
          fullLanguage="日本語"
          learningTip="'오늘'은 今日(きょう), '~이라면'은 ~なら를 사용합니다. '더더욱'은 なおさら(尚更)로 표현합니다."
          badgeColor="var(--badge-ja)"
          badgeTextColor="var(--badge-ja-text)"
          onSpeak={() => handleSpeak(translations.ja, 'ja-JP')}
        />
        <TranslationCard
          language="Chinese"
          text={translations.zh}
          fullLanguage="中文"
          learningTip="'오늘라면'은 如果今天로 표현합니다. 就更好 구조는 바람이나 예측을 나타냅니다."
          badgeColor="var(--badge-zh)"
          badgeTextColor="var(--badge-zh-text)"
          onSpeak={() => handleSpeak(translations.zh, 'zh-CN')}
        />
      </div>
    </div>
  );
}

export default App;
