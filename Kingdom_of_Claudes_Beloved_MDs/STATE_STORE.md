# מודל הנתונים ושמירה

## מה הרכיב עושה

מחזיק את כל מצב האפליקציה, משנה אותו רק דרך reducer טהור, שומר אותו ל-localStorage, ומאפשר ביטול (undo) של מחיקות וייבוא. הקוד לא נוגע ב-DOM ולכן נבדק ב-Node.

## קבצים

- `src/js/store.js` - reducer, נרמול, טעינה, `createStore`
- `src/js/utils.js` - `cleanText`, `clampInt`, `isHexColor`, `toTimestamp`, `createId`
- `src/js/ui-prefs.js` - העדפות תצוגה (נשמרות בנפרד מהנתונים)
- `tests/store.test.js`, `tests/utils-and-prefs.test.js`

## מבנה ה-state

```js
{
  schemaVersion: 2,
  categories: [{ id, name, color }],          // color בפורמט #rrggbb בלבד
  tasks: [{
    id, title, description, categoryId,       // categoryId = null -> "ללא קטגוריה"
    status,                                    // todo | in_progress | waiting | done
    statusChangedAt, createdAt, updatedAt,     // ms epoch
    subtasks: [{ id, title, status, statusChangedAt, createdAt, updatedAt }],
  }],
  settings: { theme, lastExportAt },
}
```

ברירת מחדל: שלוש קטגוריות - פיתוח (`#2563eb`), HR (`#db2777`), אישי (`#16a34a`). משימות חדשות נכנסות לראש הרשימה; תתי משימות מתווספות לסוף.

## פעולות ה-reducer

`reduce(state, action, { now, makeId })` מחזיר את **אותו אובייקט** כשהפעולה לא שינתה כלום - כך ה-store יודע לא לשמור ולא לרנדר.

הפעולות ניתנות להרצה חוזרת (replay) לצורך סנכרון ענן: `store.dispatch` מצמיד id לכל פעולת הוספה (`ID_ACTIONS`: `task/add`, `subtask/add`, `category/add`) לפני ההרצה, והוספה של id שכבר קיים היא no-op. גם שאר הפעולות אידמפוטנטיות (אותו סטטוס, אותו טקסט, מחיקה של מה שכבר נמחק).

| פעולה | שדות | התנהגות |
|-------|------|---------|
| `task/add` | title, description, categoryId, status | כותרת ריקה נדחית; קטגוריה לא קיימת -> null; סטטוס לא חוקי -> todo; עד 2000 משימות |
| `task/update` | taskId, changes{title, description, categoryId} | כותרת ריקה מתעלמת, שאר השדות מתעדכנים |
| `task/setStatus` | taskId, status | מעדכן `statusChangedAt` |
| `task/delete` | taskId | |
| `tasks/reorder` | orderedIds | סדר ידני (גרירה). המשימות שברשימה מחליפות מקומות רק בין המקומות שהן כבר תפסו, וכל משימה שלא ברשימה (מוסתרת בסינון) נשארת במקומה. מזהים לא מוכרים או כפולים מתעלמים |
| `subtask/add` / `update` / `setStatus` / `delete` | taskId, subtaskId, ... | כמו במשימה; עד 300 תתי משימות למשימה; כל שינוי מעדכן את `updatedAt` של משימת האב |
| `category/add` | name, color | שם כפול (ללא תלות באותיות גדולות/קטנות) נדחה; צבע לא חוקי -> `#64748b`; עד 50 קטגוריות |
| `category/update` | categoryId, changes{name, color} | ערכים לא חוקיים מתעלמים |
| `category/delete` | categoryId | המשימות נשארות ועוברות ל"ללא קטגוריה" |
| `settings/update` | changes | עובר `normalizeSettings` (theme חוקי בלבד; מפתחות לא מוכרים נזרקים) |

מגבלות אורך (`LIMITS`): כותרת 200, תיאור 4000, שם קטגוריה 40. טקסט בשורה אחת מכווץ רווחים ושורות; התיאור שומר ירידות שורה.

## נרמול קלט לא אמין

`normalizeState(raw)` רץ על כל מה שנטען מ-localStorage או מיובא מקובץ גיבוי, ובונה את ה-state מחדש שדה אחרי שדה:
- זורק שגיאה (בעברית) אם אין מערכי `tasks` ו-`categories`.
- מזהים כפולים או חסרים מקבלים מזהה חדש (ייחודיות על כל המסמך).
- סטטוס לא חוקי -> todo; הפניה לקטגוריה שלא קיימת -> null; צבע לא חוקי -> צבע ברירת מחדל.
- פריטים בלי כותרת נזרקים; חותמות זמן לא תקינות מוחלפות.
- חותמות זמן עתידיות נחתכות ל-`now` (אחרת "זמן בעבודה" היה שלילי).
- אותן תקרות כמו ב-reducer: עד 2000 משימות ו-300 תתי משימות למשימה, כדי שקובץ חריג לא יתקע את הדף.
- שדות לא מוכרים נזרקים.

## הסבה מגרסה 1

גרסה 1 של הנתונים כללה סטטוסים של קלוד ומיילים ושדה איש קשר. `normalizeState` מסב אותה בכל טעינה או ייבוא:
- סטטוסים: `claude_running` -> `in_progress`; `waiting_email` -> `waiting`; `email_received` -> `todo` (`LEGACY_STATUS_MAP` ב-`statuses.js`).
- איש קשר נשמר כטקסט: במשימה נוסף לתיאור כשורה "איש קשר: ..."; בתת-משימה נוסף לכותרת אחרי מקף.
- `lastCheckedAt` והגדרות הטיימרים וההתראות נזרקים.

כש-`loadState` מזהה גרסה ישנה, ה-store שומר מיד את הנתונים בפורמט החדש, ולפני כן שומר פעם אחת את המקור במפתח `taskManager.state.v1.before-schema-2` (`PRE_MIGRATION_KEY`). שם מפתח הנתונים הראשי (`taskManager.state.v1`) נשאר כדי שנתונים קיימים ימשיכו להיטען.

## ה-store

`createStore({ storage, clock, makeId, onPersistError })`:
- `subscribe(listener)` - מאזיני רינדור: `listener(state, change)`. לא נקראים כש-`notify: false`.
- `onCommit(listener)` - נקרא אחרי **כל** שינוי עם הסיבה: `{ kind: 'action', action, now }`, `{ kind: 'replace', state }` (ייבוא, undo) או `{ kind: 'remote' }`. סנכרון הענן נשען עליו.
- `applyRemote(state)` - מאמץ state שהגיע מהענן (כבר מנורמל), בלי לרשום אותו כשינוי מקומי.
- `dispatch(action, { undoable, notify })` - מחזיר `false` אם לא היה שינוי. `undoable` שומר את המצב הקודם; כל שינוי נוסף מוחק אותו. `notify: false` שומר בלי לרנדר (עריכת טקסט במקום - ראו `USER_INTERFACE.md`).
- `undo()`, `canUndo()`.
- `replaceState(raw, { undoable })` - ייבוא גיבוי; זורק על קלט לא תקין בלי לשנות דבר.
- `reloadFromStorage()` - נקרא מאירוע `storage` כשלשונית אחרת שמרה שינוי. אם הנתונים באחסון נמחקו או פגומים, ה-state הנוכחי נשאר ומוחזרת אזהרה (הלשונית לא מתרוקנת). ב-app.js הטעינה נדחית כל עוד מקלידים בשדה שלא נשמר, ומתבצעת ביציאה מהשדה.
- state חדש לגמרי נשמר מיד, כדי שמזהי הקטגוריות לא ישתנו בין טעינות. גם נתונים שהוסבו מגרסה ישנה נשמרים מיד.

טעינה (`loadState`) לא זורקת לעולם: אם הנתונים השמורים פגומים, הם מועתקים למפתח `taskManager.state.v1.corrupt-<timestamp>`, האפליקציה מתחילה מחדש, ומוצגת אזהרה. כשל בכתיבה (למשל מכסה מלאה) מדווח ל-`onPersistError` ומוצג כ-toast.

## העדפות תצוגה

`ui-prefs.js` שומר במפתח `taskManager.ui.v1`: סינון קטגוריות, סינון סטטוס, הצגת הושלמו ומיון (ברירת מחדל: "הסדר שלי"). טקסט החיפוש לא נשמר בכוונה. ערכים לא חוקיים חוזרים לברירת מחדל.

## גיבוי

- ייצוא: קובץ `task-manager-backup-YYYY-MM-DD.json` עם כל ה-state (+ `app`, `exportedAt`), ועדכון `settings.lastExportAt`.
- ייבוא: עד 5MB, JSON.parse, אישור משתמש, `replaceState` עם אפשרות ביטול.
- `.gitignore` חוסם קבצי `*backup*.json` כדי שגיבויים עם נתוני עבודה לא ייכנסו לריפו.

## מגבלות

- במצב מקומי הנתונים קיימים רק בדפדפן שבו נוצרו. במצב ענן ה-localStorage הוא מטמון של החשבון (ראו `CLOUD_SYNC.md`).
- ניקוי נתוני האתר בדפדפן מוחק את המשימות - לכן יש תזכורת גיבוי (ראו `STATUS_WORKFLOW.md`).
- undo זוכר צעד אחד בלבד.
- שתי לשוניות שעורכות בו-זמנית: השמירה האחרונה גוברת (אין מיזוג).
- `normalizeState` הופך סטטוס לא מוכר ל-`todo`. לכן לשונית שעדיין מריצה גרסה ישנה של האתר (בלי סטטוס חדש) ממירה אותו ל"לביצוע", ובשינוי הבא שלה גם שומרת כך לענן. אחרי עדכון שמוסיף סטטוס צריך לרענן לשוניות פתוחות בכל המכשירים.
