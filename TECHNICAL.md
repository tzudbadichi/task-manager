# TECHNICAL - מפת המערכת

מנהל משימות אישי: משימות בריבועים שאפשר לגרור ולסדר (או כדמויות מונפשות שחיות במשרד משותף), לכל משימה תתי משימות, ארבעה סטטוסים (לביצוע / בעבודה אצלי / ממתין לתגובה / הושלם) שנקבעים לתתי המשימות - והסטטוס של המשימה נגזר מהן, קטגוריות צבעוניות, "היום שלי", "מה עכשיו?", דוח מצב, חגיגות, אבק על משימות נטושות, ערכות חג לפי הלוח העברי, הכתבה קולית, והתחברות עם סנכרון בין מכשירים דרך Supabase. חוות אייג'נטים: תת-משימה של משימת פיתוח נשלחת לאייג'נט (Claude Code לעבודה, Codex לאישי) שרץ על מחשב הפיתוח דרך ראנר מקומי, והוא מדווח בחזרה ללוח. אתר סטטי, נפרס ל-GitHub Pages, מותאם לנייד.

## סקירת ארכיטקטורה

אפליקציית דפדפן סטטית (HTML + CSS + JavaScript מודולרי, בלי build). שני מצבים:
- **מצב ענן** (כש-`config.js` מכיל פרטי Supabase): התחברות באימייל וסיסמה; כל המצב נשמר כמסמך JSON אחד לכל משתמש בטבלה מוגנת RLS, עם סנכרון local-first (עובד גם בלי רשת) ו-realtime בין מכשירים.
- **מצב מקומי** (בלי config): הנתונים רק ב-localStorage, עם ייצוא/ייבוא גיבוי.

```
[index.html] -> app.js (אירועים, דיאלוגים, מצב מקומי / ענן, חגיגות, הכתבה)
                  |-- store.js      (reducer טהור + מטמון localStorage + undo)
                  |-- selectors.js  (סינון, מיון, ספירות, אבק, היום שלי, מועמדים ל"מה עכשיו?")
                  |-- render.js     (גריד ריבועים, פרטי משימה, פס היום שלי, "מה עכשיו?")  -> dom.js, icons.js
                  |-- people-view.js (המשרד: תנועה, שגרה, שיחות) -> people-model.js (מי, מה עושים ואומרים), world-layout.js (גיאומטריה), art.js (SVG)
                  |-- report.js     (טקסט דוח המצב)
                  |-- seasons.js    (ערכת חג לפי הלוח העברי, Intl)
                  |-- celebrate.js  (קונפטי וצליל)       voice.js (הכתבה, Web Speech API)
                  |-- drag.js       (גרירה לסידור: עכבר + לחיצה ארוכה במגע)
                  |-- ui-prefs.js   (העדפות המכשיר: סינון, מיון, תצוגה, ערכה, מתגים)
                  |-- auth-view.js  (מסך התחברות)
                  |-- sync.js       (פעולות ממתינות, שמירה עם version, replay)
                  |-- agent-hub.js  (מחשבים ועבודות אייג'נט: טעינה, realtime, שליחה) -> agent-model.js (כללים טהורים)
                  |-- cloud.js      -> vendor/supabase.js -> [Supabase: Auth + Postgres/RLS + Realtime]
                                                                    ^ agent_runners, agent_jobs (תור)
runner/ (Node, על מחשב הפיתוח) -> תופס עבודות -> claude -p / codex exec ב-worktree -> מדווח לתור
GitHub push -> Actions: בדיקות -> config.js מ-Variables -> GitHub Pages
```

זרימה: פעולת משתמש -> `store.dispatch(action)` -> reducer מחזיר state חדש -> נשמר ב-localStorage -> `render()` בונה מחדש את התצוגה -> (מצב ענן) `sync.js` רושם את הפעולה ושומר אותה בענן.

זרימת אייג'נט: שליחה מחלון האייג'נט -> שורה ב-`agent_jobs` -> הראנר במחשב הנבחר מריץ את האייג'נט ומעדכן את השורה -> realtime -> `subtask/agentSync` מעדכן את תת-המשימה במסמך (ממתין לתגובה בזמן עבודה, בעבודה אצלי כשסיים).

## מבנה הקבצים

```
project-root/
├── src/                          # האתר עצמו - זה מה שנפרס ל-GitHub Pages
│   ├── index.html                # מעטפת RTL, דיאלוגים סטטיים, CSP קשיח
│   ├── favicon.svg               # לוגו
│   ├── manifest.webmanifest      # הוספה למסך הבית בנייד
│   ├── config.example.js         # תבנית לפרטי Supabase (config.js נוצר ב-CI, לא בגיט)
│   ├── css/styles.css            # עיצוב, גריד ריבועים, ערכות בהירה/כהה, תצוגת נייד
│   ├── vendor/                   # supabase.js (עותק נעול של supabase-js) + LICENSES.txt
│   └── js/
│       ├── app.js                # נקודת כניסה: חיווט, דיאלוגים, התחברות וסנכרון, גיבוי, חגיגות, הכתבה
│       ├── drag.js               # גרירה לסידור הגריד (עכבר + מגע)
│       ├── sync.js               # מנוע סנכרון ענן (ללא DOM)
│       ├── cloud.js              # Supabase: config, client, adapter למסמך ולטבלאות האייג'נטים, שגיאות התחברות
│       ├── agent-hub.js          # חוות אייג'נטים בדפדפן: מחשבים ועבודות, realtime, שליחה וביטול (ללא DOM)
│       ├── agent-model.js        # חוות אייג'נטים: כללים טהורים - מיפוי סטטוסים, נרמול, בחירת מחשב, ניסוח הודעה
│       ├── auth-view.js          # מסך התחברות / הרשמה / איפוס סיסמה
│       ├── store.js              # reducer, נרמול והסבת נתונים, שמירה, undo
│       ├── selectors.js          # סינון, מיון, ספירות, אבק, היום שלי, מועמדים ל"מה עכשיו?"
│       ├── render.js             # דשבורד, פס היום שלי, סינון, גריד ריבועים, פרטי משימה, "מה עכשיו?", תג חג, מצב סנכרון
│       ├── people-model.js       # תצוגת הדמויות: מראה, פעילות, מצב רוח, התנהגות ומשפטי שיחה (טהור)
│       ├── people-view.js        # תצוגת הדמויות: מנוע המשרד - תנועה בכל פריים, כניסה/יציאה, שיחות
│       ├── world-layout.js       # תצוגת הדמויות: גיאומטריית המשרד - קיר, שולחנות, טרקלין, נקודות יעד (טהור)
│       ├── art.js                # SVG: דמויות (12 סוגים ועשרות תכונות), שולחנות, ריהוט, סמלי חגים
│       ├── report.js             # טקסט דוח המצב (טהור)
│       ├── seasons.js            # ערכות חג לפי הלוח העברי (טהור)
│       ├── celebrate.js          # קונפטי (canvas) וצליל (Web Audio)
│       ├── voice.js              # הכתבה קולית בעברית (Web Speech API)
│       ├── statuses.js           # ארבעת הסטטוסים, גזירת סטטוס משימה מתתי המשימות, מיפוי סטטוסים ישנים
│       ├── ui-prefs.js           # העדפות המכשיר: סינון, מיון, תצוגה, ערכה עונתית, מתגים
│       ├── dom.js                # בונה DOM בטוח (טקסט בלבד, בלי innerHTML)
│       ├── icons.js              # אייקוני SVG
│       └── utils.js              # עזרים טהורים (ניקוי טקסט, זמנים, תאריכים, צבעים, hash)
├── runner/                       # ראנר האייג'נטים - תוכנית Node שרצה על מחשב הפיתוח (לא נפרס)
│   ├── runner.js                 # הפקודות start / login / logout / check
│   ├── config.js                 # בדיקת runner.config.json ואכיפת ההפרדה בין פרופילים (עבודה / אישי)
│   ├── worker.js                 # הלולאה: heartbeat, תור, הרצה, דיווח
│   ├── engines.js                # claude -p / codex exec: שורות פקודה, הרצת תהליך, פענוח תשובה
│   ├── git.js                    # worktree וענף לכל משימה, ספירת קבצים שהשתנו
│   ├── outcome.js                # הנחיות דיווח לאייג'נט, סיכום minimal / full לענן
│   ├── remote.js                 # גישה לטבלאות התור (מסונן לפי המחשב)
│   ├── local-state.js            # state.json מקומי: מזהה המחשב והשיחה של כל משימה
│   ├── supabase-node.js          # supabase-js ב-Node, התחברות שמורה בקובץ
│   ├── console-log.js, paths.js  # פלט צבעוני באנגלית + לוג; עזרי נתיבים
│   └── runner.config.example.json  # תבנית ההגדרות (runner.config.json לא בגיט)
├── supabase/schema.sql           # טבלת המסמכים, טבלאות האייג'נטים, RLS, triggers, realtime
├── tests/                        # בדיקות יחידה (node:test), כולל הראנר
│   └── fixtures/                 # localStorage מדומה, מחולל מזהים, Supabase מדומה, client שאילתות מדומה
├── html/agent-farm-setup-guide.html     # מדריך התקנה לחוות האייג'נטים (עם צ'קבוקסים)
├── html/agent-farm-architecture.html    # דיאגרמת הארכיטקטורה: לוח, Supabase, ראנרים, מנועים, ומה עובר בכל חץ
├── .github/workflows/deploy-pages.yml   # בדיקות + config.js + פריסה ל-GitHub Pages
├── Kingdom_of_Claudes_Beloved_MDs/      # מסמכי פירוט לכל רכיב
├── package.json                  # סקריפטים: test, serve, runner, runner:login, runner:check
├── TECHNICAL.md                  # המסמך הזה
└── README.md                     # הוראות שימוש והרצה
```

## רכיבים

**[מודל הנתונים ושמירה]** - מבנה ה-state (קטגוריות, משימות, תתי משימות, הגדרות), כל הפעולות של ה-reducer, נרמול קלט לא אמין, הסבה מגרסאות 1 ו-2, שמירה ל-localStorage, undo וסנכרון בין לשוניות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATE_STORE.md`

**[סטטוסים, סינון ומיון]** - ארבעת הסטטוסים ("בעבודה" מתפצל ל"אצלי" ול"ממתין לתגובה"), הכלל שגוזר את סטטוס המשימה מתתי המשימות, הצבעים, סדר המיון, כללי הסינון, הספירות בדשבורד ותזכורת הגיבוי.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATUS_WORKFLOW.md`

**[ממשק המשתמש]** - מבנה המסך, גריד הריבועים (פס עליון לפי קטגוריה, רקע לפי סטטוס, כפתור סטטוס קטן ליד כל תת-משימה), גרירה לסידור, חלון פרטי משימה, ניהול קטגוריות, הגדרות, תצוגת נייד, רינדור והאצלת אירועים, דיאלוגים, ערכות צבע ואבטחת תצוגה (CSP / XSS).
> Detail: `Kingdom_of_Claudes_Beloved_MDs/USER_INTERFACE.md`

**[תצוגת הדמויות]** - חלופה לגריד (בהגדרות): משרד משותף שבו כל משימה היא דמות מונפשת ושונה (בני אדם, חיות, רובוטים, חייזרים). כל דמות עובדת בשולחן שלה כשהמשימה בעבודה, ובשאר הזמן משוטטת, יוצאת להפסקות, יושבת על הספה ורוקדת כשהמשימה הושלמה. הדמויות ניגשות זו לזו ומדברות, נכנסות ויוצאות בדלת, ויש מסך מלא.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/PEOPLE_VIEW.md`

**["היום שלי" ו"מה עכשיו?"]** - עד 3 תתי משימות פתוחות להיום (שדה `myDay`, מתאפס לבד למחרת), והגרלה משוקללת של תת-משימה לעבוד עליה, עם אנימציית מכונת מזל.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/MY_DAY_AND_NEXT.md`

**[דוח מצב]** - טקסט פשוט של מה בעבודה, ממתין והושלם בתקופה, להעתקה, לשיתוף, לווטסאפ או למייל.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATUS_REPORT.md`

**[אבק על משימות נטושות]** - משימה פתוחה שלא נגעו בה 14/30/60 יום דוהה, מתאבקת ומעלה קורי עכביש. אפשר "לנער" (`task/touch`) או "לסגור את כולה" (`task/complete`).
> Detail: `Kingdom_of_Claudes_Beloved_MDs/DUST.md`

**[חגיגה]** - קונפטי (canvas), צליל אופציונלי והודעת עידוד כשמשימה הושלמה; פרץ קטן לתת-משימה.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/CELEBRATION.md`

**[ערכות עונתיות]** - צבע, דגלונים, סמל וברכה סביב חגים לפי הלוח העברי (`Intl`), כולל כללי הדחייה של יום העצמאות. גם הדמויות מתלבשות לחג.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/SEASONAL_THEMES.md`

**[הכתבה קולית]** - כפתור מיקרופון ליד שדות הטקסט (Web Speech API, `he-IL`), עם הודעת פרטיות חד-פעמית.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/VOICE_INPUT.md`

**[התחברות וסנכרון ענן]** - Supabase: מודל המסמך והאבטחה (RLS), מנוע הסנכרון (פעולות ממתינות, version, replay, offline, realtime), כניסה ראשונה ומיזוג, התחברות והתנתקות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/CLOUD_SYNC.md`

**[חוות אייג'נטים]** - משימה משויכת לפרויקט; כל תת-משימה נשלחת לאייג'נט דרך תור בענן (`agent_jobs`), והראנר במחשב הפיתוח מריץ את Claude Code או Codex ב-worktree משלה ומדווח בחזרה. ההפרדה בין חשבון העבודה לחשבון האישי נאכפת בהגדרות של הראנר, ובפרויקטים של העבודה עולה לענן רק סיכום מצומצם, בלי קוד.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/AGENT_FARM.md`

**[פריסה ובדיקות]** - GitHub Actions ל-GitHub Pages, יצירת config.js מ-Variables, חיבור פרויקט Supabase, הרצה מקומית ובדיקות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/DEPLOYMENT.md`

## קונפיגורציה וסביבה

| פריט | ערך / מיקום | הערה |
|------|-------------|------|
| מפתח הנתונים ב-localStorage | `taskManager.state.v1` | כל ה-state (JSON) |
| מפתח העדפות המכשיר | `taskManager.ui.v1` | סינון ומיון (בלי טקסט החיפוש), ותצוגה: ריבועים/דמויות, ערכה עונתית, מתגי חגיגה/צליל/שיחות/היום שלי/הכתבה. לא מסונכרן |
| מטא-דאטה של סנכרון | `taskManager.sync.v1` | החשבון, הגרסה בענן, פעולות שעוד לא נשמרו |
| עותקים חד-פעמיים | `taskManager.state.v1.before-schema-3`, `taskManager.state.v1.before-login` | לפני הסבה מגרסה ישנה / משימות מקומיות שלא נוספו לחשבון |
| `vars.SUPABASE_URL`, `vars.SUPABASE_ANON_KEY` | GitHub repository Variables | הופכים ל-`src/config.js` בפריסה; בלעדיהם - מצב מקומי |
| טבלאות בענן | `public.task_manager_documents`, `public.agent_runners`, `public.agent_jobs` | נוצרות מ-`supabase/schema.sql` (מריצים שוב אחרי עדכון - הקובץ אידמפוטנטי) |
| הגדרות הראנר | `runner/runner.config.json` | פרופילים (מנוע, חשבון, תיקיות מותרות), פרויקטים. לא בגיט; תבנית ב-`runner.config.example.json` |
| תיקיית המצב של הראנר | `%LOCALAPPDATA%\task-manager-runner` | `auth.json` (session), `state.json`, `runner.log`, `logs/`, `worktrees/` |
| חשבון לכל פרופיל | `CLAUDE_CONFIG_DIR` / `CODEX_HOME` | נקבעים מהשדות `claudeConfigDir` / `codexHome` של הפרופיל |
| סודות | `auth.json` של הראנר בלבד | מפתח ה-publishable ציבורי מעצם הגדרתו (ההגנה היא RLS); ה-refresh token של הראנר נשמר רק בפרופיל המשתמש במחשב |

## הרצה ופקודות

| פעולה | פקודה |
|-------|-------|
| הרצה מקומית | `npm run serve` ואז `http://localhost:8080` (דורש Python; כל שרת סטטי מתאים). למצב ענן: `src/config.js` מתוך `config.example.js` |
| בדיקות יחידה | `npm test` |
| פריסה | `git push` ל-`main` - GitHub Actions מריץ בדיקות ומפרסם |
| ראנר האייג'נטים | `npm run runner:login` (פעם אחת), `npm run runner:check`, `npm run runner`. מדריך: `html/agent-farm-setup-guide.html` |

פתיחת `index.html` ישירות מהדיסק (file://) לא תעבוד - מודולי ES דורשים שרת HTTP.

## תלויות

| חבילה | שימוש |
|-------|-------|
| `@supabase/supabase-js` 2.117.2 | התחברות, גישה לטבלאות, realtime. מוגש מקומית מ-`src/vendor/supabase.js` (נטען רק במצב ענן); הראנר טוען את אותו קובץ ב-Node |
| Node.js 22+ | הבדיקות (`node:test`) והראנר (fetch ו-WebSocket מובנים) |
| Claude Code CLI / Codex CLI / git | במחשב שהראנר רץ עליו: המנועים של האייג'נטים, ו-worktrees |
| actions/checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages | פריסה ב-GitHub Actions |
