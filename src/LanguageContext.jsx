import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default language is English
    const [currentLanguage, setCurrentLanguage] = useState('en');

    const toggleLanguage = (lang) => {
        setCurrentLanguage(lang);
    };

    // Helper function to safely get translations from the data structure
    const t = (textObj) => {
        if (!textObj) return '';
        if (typeof textObj === 'string') return textObj; // Fallback if data isn't fully migrated yet
        return textObj[currentLanguage] || textObj['en'] || '';
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
