import React from 'react';
import { Sparkles, Globe } from 'lucide-react';

export default function LanguageSelector({ onSelectLanguage }) {
  const languages = [
    { code: 'en', name: 'English', desc: 'Agency business consultant' },
    { code: 'hi', name: 'हिन्दी (Hindi)', desc: 'व्यावसायिक विकास सहायक' },
    { code: 'te', name: 'తెలుగు (Telugu)', desc: 'వ్యాపార వృద్ధి సలహాదారు' },
    { code: 'mr', name: 'मराठी (Marathi)', desc: 'व्यवसाय विकास मार्गदर्शक' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      width: '100%',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
        border: '1px solid rgba(139, 92, 246, 0.25)'
      }}>
        <div className="logo-icon" style={{ margin: '0 auto 20px auto', width: '50px', height: '50px', borderRadius: '12px' }}>
          <Sparkles size={26} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #fff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          NEXIFY PRO Voice Lab
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '30px' }}>
          Select your preferred language to begin the AI Lead Qualification simulator
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              className="btn btn-secondary"
              onClick={() => onSelectLanguage(lang.code)}
              style={{
                justifyContent: 'flex-start',
                padding: '16px 20px',
                width: '100%',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <Globe size={18} color="var(--primary)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff' }}>{lang.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{lang.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
