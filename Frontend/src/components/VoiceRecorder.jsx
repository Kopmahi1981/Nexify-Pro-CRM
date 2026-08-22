import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';

// Endpoint contract (integration target: /api/sarvam/stt):
//   POST multipart/form-data { file: Blob(audio), language_code: string }
//   -> 200 { status: 'success', transcript: string, language: string }
// The backend stub must accept the multipart `file` field and return `transcript`.
const STT_ENDPOINT = '/api/sarvam/stt';

// Sarvam REST STT (saaras:v3) has a 30-second synchronous audio limit.
const MAX_RECORDING_SEC = 30;

export default function VoiceRecorder({ language = 'en', onTranscript, disabled = false }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const maxAgeRef = useRef(null);

  const mediaSupported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  // Clean up timer, mic tracks, and object URL on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxAgeRef.current) clearTimeout(maxAgeRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError('');
    if (!mediaSupported) {
      setError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = window.MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = mimeType
        ? new window.MediaRecorder(stream, { mimeType })
        : new window.MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      };

      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      // Enforce Sarvam's 30s REST limit: auto-stop the recording at MAX_RECORDING_SEC.
      maxAgeRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && recording) {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, MAX_RECORDING_SEC * 1000);
    } catch (err) {
      console.error(err);
      setError('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setError('');
  };

  // Send the recorded audio Blob to /api/sarvam/stt and surface the transcript.
  const sendToAI = async () => {
    if (!audioBlob) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav';
      formData.append('file', audioBlob, `recording.${ext}`);
      formData.append('language_code', language);

      const res = await fetch(STT_ENDPOINT, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Speech-to-text request failed.');
      }
      const transcript = (data.transcript || '').trim();
      if (transcript && typeof onTranscript === 'function') {
        onTranscript(transcript);
        deleteRecording();
      } else {
        setError('No transcript was returned by the service.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send recording to the AI service.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div
      className="voice-recorder glass-card"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', marginTop: '8px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Voice Recording</span>
        {recording && (
          <span className="status-indicator-badge online" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            REC {formatTime(elapsed)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!recording ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startRecording}
            disabled={disabled || sending || !mediaSupported}
          >
            <Mic size={16} /> Start Recording
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={stopRecording} disabled={sending}>
            <Square size={16} /> Stop Recording
          </button>
        )}

        {audioBlob && !recording && (
          <>
            <button type="button" className="btn btn-secondary" onClick={deleteRecording} disabled={sending}>
              <Trash2 size={16} /> Delete
            </button>
            <button type="button" className="btn btn-primary" onClick={sendToAI} disabled={sending}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send to AI
            </button>
          </>
        )}
      </div>

      {audioUrl && !recording && <audio controls src={audioUrl} style={{ width: '100%' }} />}

      {error && <div className="form-error-alert" style={{ fontSize: '0.8rem' }}>{error}</div>}
    </div>
  );
}
