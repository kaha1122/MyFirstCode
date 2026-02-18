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
        </div>
    );
};

export default TranslationCard;
