import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/languageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button 
        className={`language-btn ${language === 'en' ? 'active' : ''}`}
        onClick={toggleLanguage}
      >
        <span className="language-text">
          {language === 'en' ? 'አማርኛ' : 'English'}
        </span>
      </button>
    </div>
  );
};

export default LanguageSwitcher; 