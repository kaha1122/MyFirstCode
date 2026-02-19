import React from 'react';
import { Play } from 'lucide-react';
import './TranslationCard.css';

const TranslationCard = ({
    language,
    fullLanguage,
    text,
    pronunciation,
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
            </div>

            <div className="card-body">
                <p className={`translated-text font-${language.toLowerCase()}`}>
                    {text || '...'}
                </p>
                {pronunciation && (
                    <p className={`pronunciation-text font-${language.toLowerCase()}`}>
                        {pronunciation}
                    </p>
                )}
            </div>

            <div className="card-footer">
                <span className="tip-label">LEARNING TIP</span>
                <div className="tip-content-wrapper">
                    {typeof learningTip === 'string' ? (
                        <p className="tip-content">{learningTip}</p>
                    ) : (
                        learningTip && learningTip.map((tip, index) => (
                            <p key={index} className="tip-content">
                                • {tip}
                            </p>
                        ))
                    )}
                </div>
            </div>
            <button className="speak-button" onClick={onSpeak} title="Listen">
                <Play size={25} fill="white" />
            </button>
        </div>
    );
};

export default TranslationCard;
