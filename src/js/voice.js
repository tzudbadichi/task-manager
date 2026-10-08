// Hebrew voice dictation with the browser's Web Speech API (Chrome, Edge, Safari; not Firefox).
// The browser runs the recognition itself - in Chrome and Edge the audio is sent to the vendor's
// speech service - so app.js shows a one-time notice before the first use.

const RecognitionClass = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;

const ERROR_MESSAGES = Object.freeze({
  'not-allowed': 'אין הרשאה למיקרופון. אפשר לאשר אותה בהגדרות האתר בדפדפן.',
  'service-not-allowed': 'הדפדפן לא מאפשר זיהוי דיבור באתר הזה.',
  'audio-capture': 'לא נמצא מיקרופון.',
  network: 'אין חיבור לשירות זיהוי הדיבור של הדפדפן.',
  'no-speech': 'לא נשמע דיבור. אפשר לנסות שוב.',
  'language-not-supported': 'הדפדפן לא תומך בזיהוי דיבור בעברית.',
});

export function isVoiceSupported() {
  return Boolean(RecognitionClass);
}

export function voiceErrorMessage(code) {
  return ERROR_MESSAGES[code] ?? 'ההכתבה נעצרה בגלל תקלה. אפשר לנסות שוב.';
}

/**
 * Starts listening once (until a pause). onInterim(text) gets the words heard so far, onFinal(text) the final
 * phrase, onEnd() is always called last, onError(code) on failure ('aborted' - a deliberate stop - is not reported).
 * Returns { stop } or null when the browser has no speech recognition.
 */
export function startDictation({ lang = 'he-IL', onInterim, onFinal, onEnd, onError }) {
  if (!RecognitionClass) return null;
  const recognition = new RecognitionClass();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener('result', event => {
    let finalText = '';
    let interimText = '';
    for (const result of event.results) {
      if (result.isFinal) finalText += result[0].transcript;
      else interimText += result[0].transcript;
    }
    if (finalText) onFinal?.(finalText.trim());
    else onInterim?.(interimText.trim());
  });
  recognition.addEventListener('error', event => {
    if (event.error !== 'aborted') onError?.(event.error);
  });
  recognition.addEventListener('end', () => onEnd?.());

  try {
    recognition.start();
  } catch {
    onError?.('start-failed');
    onEnd?.();
    return null;
  }
  return { stop: () => recognition.stop() };
}
