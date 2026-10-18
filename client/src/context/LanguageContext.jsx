import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Default to Hindi ('hi') to match the official government portal reference
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('civicpulse_lang') || 'hi';
  });

  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1, 0, +1

  useEffect(() => {
    localStorage.setItem('civicpulse_lang', language);
    if (language === 'hi') {
      document.documentElement.lang = 'hi';
    } else {
      document.documentElement.lang = 'en';
    }
  }, [language]);

  const changeFontSize = (delta) => {
    if (delta === 0) {
      setFontSizeLevel(0);
      document.documentElement.style.fontSize = '16px';
    } else {
      const newLevel = Math.max(-1, Math.min(2, fontSizeLevel + delta));
      setFontSizeLevel(newLevel);
      const sizes = { '-1': '14px', '0': '16px', '1': '17.5px', '2': '19px' };
      document.documentElement.style.fontSize = sizes[newLevel] || '16px';
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, fontSizeLevel, changeFontSize, isHindi: language === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'hi', setLanguage: () => {}, isHindi: true, fontSizeLevel: 0, changeFontSize: () => {} };
  }
  return context;
};
