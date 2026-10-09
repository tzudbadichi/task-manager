// What goes to the agent with each message, and what comes back to the cloud from its answer.
//
// cloudReport "minimal" (the default, meant for work projects - the board's Supabase is a personal
// account): the agent is asked to answer without code, code blocks that slip through are removed, and
// the text is cut short. The full answer always stays in the local log on this machine.

export const SUMMARY_LIMITS = Object.freeze({ full: 8000, minimal: 1500 });
const ERROR_LIMIT = 1000;
const CODE_REMOVED = '[קוד הושמט - הפירוט המלא בלוג המקומי במחשב]';
const CUT_NOTE = '\n...(ההמשך בלוג המקומי במחשב)';

const REPORT_INSTRUCTIONS = [
  'בסיום, כתוב סיכום קצר בעברית: מה עשית, אילו קבצים שינית, ומה נשאר לעשות.',
  'אם אתה צריך החלטה או מידע ממני - סיים בשאלה ברורה אחת.',
  'אל תעשה push, merge או פריסה. העבודה נשארת בענף ובתיקייה הנוכחיים, ואני אעבור עליה.',
].join('\n');
const MINIMAL_REPORT_INSTRUCTION = 'הסיכום עובר לשירות חיצוני: אל תכלול בו קוד, תוכן של קבצים, סודות או פרטים מזהים - רק תיאור במילים.';

/**
 * The text the agent receives. The first message of a conversation also carries the reporting instructions;
 * later messages continue the same conversation, so they go as written.
 */
export function buildAgentPrompt(prompt, { isNewConversation, cloudReport }) {
  if (!isNewConversation) return prompt;
  const instructions = cloudReport === 'minimal' ? `${REPORT_INSTRUCTIONS}\n${MINIMAL_REPORT_INSTRUCTION}` : REPORT_INSTRUCTIONS;
  return `${prompt}\n\n---\n${instructions}`;
}

function cut(text, limit, note) {
  return text.length <= limit ? text : `${text.slice(0, Math.max(0, limit - note.length)).trimEnd()}${note}`;
}

/** The agent's answer as stored in agent_jobs.summary. */
export function shapeSummary(text, cloudReport) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  if (cloudReport === 'full') return cut(value, SUMMARY_LIMITS.full, CUT_NOTE);
  const withoutCode = value
    .replace(/```[\s\S]*?(```|$)/g, CODE_REMOVED) // fenced blocks, including one left open at the end
    .replace(/`[^`\n]{60,}`/g, CODE_REMOVED); // long inline code
  return cut(withoutCode, SUMMARY_LIMITS.minimal, CUT_NOTE);
}

/** An error message as stored in agent_jobs.error (minimal: shorter, no code blocks). */
export function shapeError(message, cloudReport) {
  const value = String(message ?? '').trim() || 'הריצה נכשלה';
  const cleaned = cloudReport === 'full' ? value : value.replace(/```[\s\S]*?(```|$)/g, CODE_REMOVED);
  return cut(cleaned, cloudReport === 'full' ? ERROR_LIMIT : ERROR_LIMIT / 2, '...');
}
