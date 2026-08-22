import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, Mic, MicOff, Send, Sparkles, Sliders } from 'lucide-react';
import { translations } from '../services/translations';
import { calculateLeadScore } from '../services/leadScoring';
import { supabaseService } from '../services/supabaseService';
import VoiceRecorder from './VoiceRecorder';

// Parser mapping date inputs dynamically
const parseToYYYYMMDD = (dateStr) => {
  const clean = dateStr.trim().toLowerCase();
  const today = new Date();
  
  if (clean === 'today') {
    return today.toISOString().split('T')[0];
  }
  if (clean === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let weekdayTarget = -1;
  let isNext = false;
  
  if (clean.startsWith('next ')) {
    isNext = true;
    const dayWord = clean.substring(5).trim();
    weekdayTarget = weekdays.indexOf(dayWord);
  } else {
    weekdayTarget = weekdays.indexOf(clean);
  }
  
  if (weekdayTarget !== -1) {
    const currentDay = today.getDay();
    let daysToAdd = weekdayTarget - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    if (isNext && daysToAdd < 7) {
      daysToAdd += 7;
    }
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  }

  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
};

// Time parser
const parseTo24HourTime = (timeStr) => {
  const clean = timeStr.trim().toUpperCase();
  const regex = /^(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)?$/;
  const match = clean.match(regex);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  if (ampm) {
    if (hours > 12) return null;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}:00`;
};

export default function LeadQualificationChat({ language, onFinishQualification, voiceConfig }) {
  const t = translations[language] || translations.en;
  
  const [voiceActive, setVoiceActive] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    business_name: '',
    industry: '',
    service_interest: '',
    budget: '',
    timeline: '',
    appt_date: '',
    appt_time: ''
  });
  
  const [validationError, setValidationError] = useState('');
  const [logIds, setLogIds] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const greeting = t.welcome + " " + t.qName;
    setChatHistory([{ sender: 'agent', text: greeting, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    speak(greeting);
    saveLogEntry('ai', greeting);
  }, [language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const speak = (text) => {
    if (!voiceActive) return;
    try {
      window.speechSynthesis?.cancel();
      const clean = text.replace(/[#*`>]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = voiceConfig.speed || 1.0;
      utterance.pitch = voiceConfig.pitch || 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      const targetLocales = { 
        en: ['en-IN', 'en-US', 'en-GB'], 
        hi: ['hi-IN'], 
        te: ['te-IN'], 
        mr: ['mr-IN'] 
      };
      
      const locales = targetLocales[language] || ['en-US'];
      utterance.lang = locales[0]; // Fallback string representation
      
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        
        // 1. Try finding a voice matching one of the target locales exactly
        let selectedVoice = null;
        for (const loc of locales) {
          selectedVoice = voices.find(v => 
            v.lang.toLowerCase() === loc.toLowerCase() || 
            v.lang.toLowerCase().replace('_', '-') === loc.toLowerCase()
          );
          if (selectedVoice) break;
        }
        
        // 2. If no exact locale matches, fall back to language prefix matching (e.g. "te", "hi", "mr")
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang; // Align utterance target language with the selected voice
          console.log("Selected Voice:", selectedVoice.name, selectedVoice.lang);
        } else {
          console.warn(`[SpeechSynthesis] No specific local voice found in browser engine for language: "${language}". Using fallback locale: ${utterance.lang}`);
        }
      }

      window.speechSynthesis?.speak(utterance);
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const saveLogEntry = async (sender, message) => {
    try {
      const log = await supabaseService.createConversationLog({ sender, message });
      if (log && log.id) setLogIds(prev => [...prev, log.id]);
    } catch (err) {
      console.error(err);
    }
  };

  const speakAndLogResponse = (response) => {
    setChatHistory(prev => [...prev, {
      sender: 'agent',
      text: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    speak(response);
    saveLogEntry('ai', response);
  };

  const handleSendMessage = async (e, forcedText) => {
    if (e) e.preventDefault();
    const val = (forcedText !== undefined ? forcedText : userInput).trim();
    if (!val) return;
    setChatHistory(prev => [...prev, {
      sender: 'user',
      text: val,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    if (forcedText === undefined) setUserInput('');
    setValidationError('');

    saveLogEntry('user', val);

    if (step === 1) {
      setLeadData(prev => ({ ...prev, name: val }));
      setStep(2);
      const nextPrompt = t.qPhone.replace('{name}', val);
      setTimeout(() => speakAndLogResponse(nextPrompt), 1000);
    }
    else if (step === 2) {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) {
        setValidationError(t.validationPhone);
        setTimeout(() => speakAndLogResponse(t.validationPhone), 1000);
        return;
      }
      setLeadData(prev => ({ ...prev, phone: val }));
      setStep(3);
      setTimeout(() => speakAndLogResponse(t.qEmail), 1000);
    }
    else if (step === 3) {
      if (val.toLowerCase() !== 'skip') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          setValidationError(t.validationEmail);
          setTimeout(() => speakAndLogResponse(t.validationEmail), 1000);
          return;
        }
        setLeadData(prev => ({ ...prev, email: val }));
      }
      setStep(4);
      setTimeout(() => speakAndLogResponse(t.qBusiness), 1000);
    }
    else if (step === 4) {
      setLeadData(prev => ({ ...prev, business_name: val }));
      setStep(5);
      setTimeout(() => speakAndLogResponse(t.qIndustry + " (Real Estate, Healthcare, Garments, Education, Finance, Technology, Other)"), 1000);
    }
    else if (step === 5) {
      setLeadData(prev => ({ ...prev, industry: val }));
      setStep(6);
      setTimeout(() => speakAndLogResponse(t.qService + " (AI Voice Agent, CRM Development, Website Development, Marketing Automation, Lead Generation, Custom Software)"), 1000);
    }
    else if (step === 6) {
      setLeadData(prev => ({ ...prev, service_interest: val }));
      setStep(7);
      setTimeout(() => speakAndLogResponse(t.qBudget + " (Below ₹25,000, ₹25,000 – ₹50,000, ₹50,000 – ₹1,00,000, Above ₹1,00,000)"), 1000);
    }
    else if (step === 7) {
      setLeadData(prev => ({ ...prev, budget: val }));
      setStep(8);
      setTimeout(() => speakAndLogResponse(t.qTimeline + " (Immediately, Within 30 Days, Within 3 Months, Just Exploring)"), 1000);
    }
    else if (step === 8) {
      const updated = { ...leadData, timeline: val };
      setLeadData(updated);
      setStep(9);
      setTimeout(() => speakAndLogResponse(t.qBookCall), 1000);
    }
    else if (step === 9) {
      const lower = val.toLowerCase();
      const yesKeywords = ['yes', 'y', 'yeah', 'yep', 'ok', 'okay', 'schedule', 'book', 'होय', 'हाँ'];
      const isAffirmative = yesKeywords.some(k => lower.includes(k));

      if (isAffirmative) {
        setStep(10);
        setTimeout(() => speakAndLogResponse(t.qDate), 1000);
      } else {
        await finalizeQualification(leadData, false);
      }
    }
    else if (step === 10) {
      const parsedDate = parseToYYYYMMDD(val);
      if (!parsedDate) {
        setValidationError(t.validationDate);
        setTimeout(() => speakAndLogResponse(t.validationDate), 1000);
        return;
      }
      // Validate appointment not in the past
      const todayStr = new Date().toISOString().split('T')[0];
      if (parsedDate < todayStr) {
        setValidationError("Strategy call date cannot be in the past.");
        setTimeout(() => speakAndLogResponse("Strategy call date cannot be in the past. Please specify a future date."), 1000);
        return;
      }

      setLeadData(prev => ({ ...prev, appt_date: parsedDate }));
      setStep(11);
      setTimeout(() => speakAndLogResponse(t.qTime), 1000);
    }
    else if (step === 11) {
      const parsedTime = parseTo24HourTime(val);
      if (!parsedTime) {
        setValidationError(t.validationTime);
        setTimeout(() => speakAndLogResponse(t.validationTime), 1000);
        return;
      }
      const finalLead = { ...leadData, appt_time: parsedTime };
      setLeadData(finalLead);
      await finalizeQualification(finalLead, true);
    }
  };

  const finalizeQualification = async (data, hasAppt) => {
    try {
      const scoring = calculateLeadScore(data.budget, data.timeline, data.service_interest, hasAppt);
      const newLead = await supabaseService.createLead({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        business_name: data.business_name,
        industry: data.industry,
        service_interest: data.service_interest,
        budget: data.budget,
        timeline: data.timeline,
        preferred_language: language,
        lead_score: scoring.score,
        lead_status: scoring.status,
        lead_source: 'voice_agent'
      });

      if (newLead && newLead.id) {
        if (logIds.length > 0) {
          await supabaseService.linkLogsToLead(logIds, newLead.id);
        }
        
        if (hasAppt) {
          await supabaseService.createAppointment({
            lead_id: newLead.id,
            appointment_date: data.appt_date,
            appointment_time: data.appt_time,
            status: 'upcoming'
          });
        }
      }

      const confirmMsg = hasAppt 
        ? t.confirmed.replace('{date}', data.appt_date || '').replace('{time}', data.appt_time || '')
        : "Thank you. Your qualified profile has been successfully saved in our CRM system.";
        
      speakAndLogResponse(confirmMsg);
      setTimeout(() => onFinishQualification(), 4000);
    } catch (err) {
      console.error(err);
      speakAndLogResponse("Encountered database synchronization issue. Restarting flow...");
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Dialogue Qualification</h2>
        <span className="status-indicator-badge online">STAGE: {step}</span>
      </div>

      <div className="chat-container">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'agent'}`}>
            <p style={{ margin: 0 }}>{msg.text}</p>
          </div>
        ))}
        {isSpeaking && (
          <div className="chat-bubble agent" style={{ opacity: 0.7 }}>
            <p style={{ margin: 0, fontStyle: 'italic' }}>Streaming voice response...</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder={validationError || "Type reply..."}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!userInput.trim()}><Send size={16} /></button>
      </form>

      <VoiceRecorder
        language={language}
        onTranscript={(text) => handleSendMessage(null, text)}
      />
    </div>
  );
}
