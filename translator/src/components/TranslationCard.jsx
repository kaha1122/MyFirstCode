import React from 'react';
import { Volume2 } from 'lucide-react';
import './TranslationCard.css';

const TranslationCard = ({
    language,
    fullLanguage,
    text,
    learningTip,
    badgeColor,
    badgeTextColor,
    onSpeak
}) => {
    return (
        <div className="translation-card">
            <div className="card-header">
                <span
                    className="language-badge"
                    style={{ backgroundColor: badgeColor, color: badgeTextColor }}
                >
                    {fullLanguage || language}
                </span>
                <button className="speak-button" onClick={onSpeak} title="Listen">
                    <Volume2 size={16} />
                </button>
            </div>

            <div className="card-body">
                <p className="translated-text">{text || '...'}</p>
                {/* Phonetic guide could go here if available */}
            </div>

            <div className="card-footer">
                <span className="tip-label">LEARNING TIP</span>
                <p className="tip-content">{learningTip}</p>
            </div>
        </div>
    );
};

export default TranslationCard;
