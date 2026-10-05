# TECHNICAL - מפת המערכת

מנהל משימות אישי: משימות בריבועים שאפשר לגרור ולסדר, תתי משימות, שלושה סטטוסים (לביצוע / בעבודה / הושלם), קטגוריות צבעוניות, והתחברות עם סנכרון בין מכשירים דרך Supabase. אתר סטטי, נפרס ל-GitHub Pages, מותאם לנייד.

## סקירת ארכיטקטורה

אפליקציית דפדפן סטטית (HTML + CSS + JavaScript מודולרי, בלי build). שני מצבים:
- **מצב ענן** (כש-`config.js` מכיל פרטי Supabase): התחברות באימייל וסיסמה; כל המצב נשמר כמסמך JSON אחד לכל משתמש בטבלה מוגנת RLS, עם סנכרון local-first (עובד גם בלי רשת) ו-realtime בין מכשירים.
- **מצב מקומי** (בלי config): הנתונים רק ב-localStorage, עם ייצוא/ייבוא גיבוי.

```
[index.html] -> app.js (אירועים, דיאלוגים, מצב מקומי / ענן)
                  |-- store.js      (reducer טהור + מטמון localStorage + undo)
                  |-- selectors.js  (סינון, מיון, ספירות לדשבורד)
                  |-- render.js     (גריד ריבועים, פרטי משימה)  -> dom.js, icons.js
                  |-- drag.js       (גרירה לסידור: עכבר + לחיצה ארוכה במגע)
                  |-- ui-prefs.js   (העדפות תצוגה: סינון ומיון)
                  |-- auth-view.js  (מסך התחברות)
                  |-- sync.js       (פעולות ממתינות, שמירה עם version, replay)
                  |-- cloud.js      -> vendor/supabase.js -> [Supabase: Auth + Postgres/RLS + Realtime]
GitHub push -> Actions: בדיקות -> config.js מ-Variables -> GitHub Pages
```

זרימה: פעולת משתמש -> `store.dispatch(action)` -> reducer מחזיר state חדש -> נשמר ב-localStorage -> `render()` בונה מחדש את התצוגה -> (מצב ענן) `sync.js` רושם את הפעולה ושומר אותה בענן.

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
│       ├── app.js                # נקודת כניסה: חיווט, דיאלוגים, התחברות וסנכרון, גיבוי
│       ├── drag.js               # גרירה לסידור הגריד (עכבר + מגע)
│       ├── sync.js               # מנוע סנכרון ענן (ללא DOM)
│       ├── cloud.js              # Supabase: config, client, adapter, שגיאות התחברות
│       ├── auth-view.js          # מסך התחברות / הרשמה / איפוס סיסמה
│       ├── store.js              # reducer, נרמול והסבת נתונים, שמירה, undo
│       ├── selectors.js          # סינון, מיון, ספירות
│       ├── render.js             # דשבורד, סינון, גריד ריבועים, פרטי משימה, מצב סנכרון
│       ├── statuses.js           # שלושת הסטטוסים ומיפוי סטטוסים ישנים
│       ├── ui-prefs.js           # שמירת העדפות תצוגה
│       ├── dom.js                # בונה DOM בטוח (טקסט בלבד, בלי innerHTML)
│       ├── icons.js              # אייקוני SVG
│       └── utils.js              # עזרים טהורים (ניקוי טקסט, זמנים, צבעים)
├── supabase/schema.sql           # טבלת המסמכים, RLS, trigger לגרסה, realtime
├── tests/                        # בדיקות יחידה (node:test)
│   └── fixtures/                 # localStorage מדומה, מחולל מזהים, Supabase מדומה
├── .github/workflows/deploy-pages.yml   # בדיקות + config.js + פריסה ל-GitHub Pages
├── Kingdom_of_Claudes_Beloved_MDs/      # מסמכי פירוט לכל רכיב
├── package.json                  # סקריפטים: test, serve
├── TECHNICAL.md                  # המסמך הזה
└── README.md                     # הוראות שימוש והרצה
```

## רכיבים

**[מודל הנתונים ושמירה]** - מבנה ה-state (קטגוריות, משימות, תתי משימות, הגדרות), כל הפעולות של ה-reducer, נרמול קלט לא אמין, הסבה מגרסה 1, שמירה ל-localStorage, undo וסנכרון בין לשוניות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATE_STORE.md`

**[סטטוסים, סינון ומיון]** - שלושת הסטטוסים, סדר המיון, כללי הסינון, הספירות בדשבורד ותזכורת הגיבוי.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATUS_WORKFLOW.md`

**[ממשק המשתמש]** - גריד הריבועים, גרירה לסידור, חלון פרטי משימה, תצוגת נייד, רינדור והאצלת אירועים, דיאלוגים, ערכות צבע ואבטחת תצוגה (CSP / XSS).
> Detail: `Kingdom_of_Claudes_Beloved_MDs/USER_INTERFACE.md`

**[התחברות וסנכרון ענן]** - Supabase: מודל המסמך והאבטחה (RLS), מנוע הסנכרון (פעולות ממתינות, version, replay, offline, realtime), כניסה ראשונה ומיזוג, התחברות והתנתקות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/CLOUD_SYNC.md`

**[פריסה ובדיקות]** - GitHub Actions ל-GitHub Pages, יצירת config.js מ-Variables, חיבור פרויקט Supabase, הרצה מקומית ובדיקות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/DEPLOYMENT.md`

## קונפיגורציה וסביבה

| פריט | ערך / מיקום | הערה |
|------|-------------|------|
| מפתח הנתונים ב-localStorage | `taskManager.state.v1` | כל ה-state (JSON) |
| מפתח העדפות תצוגה | `taskManager.ui.v1` | סינון ומיון (בלי טקסט החיפוש) |
| מטא-דאטה של סנכרון | `taskManager.sync.v1` | החשבון, הגרסה בענן, פעולות שעוד לא נשמרו |
| עותקים חד-פעמיים | `taskManager.state.v1.before-schema-2`, `taskManager.state.v1.before-login` | לפני הסבה מגרסה 1 / משימות מקומיות שלא נוספו לחשבון |
| `vars.SUPABASE_URL`, `vars.SUPABASE_ANON_KEY` | GitHub repository Variables | הופכים ל-`src/config.js` בפריסה; בלעדיהם - מצב מקומי |
| טבלה בענן | `public.task_manager_documents` | נוצרת מ-`supabase/schema.sql` |
| סודות | אין | מפתח ה-publishable ציבורי מעצם הגדרתו; ההגנה היא RLS |

## הרצה ופקודות

| פעולה | פקודה |
|-------|-------|
| הרצה מקומית | `npm run serve` ואז `http://localhost:8080` (דורש Python; כל שרת סטטי מתאים). למצב ענן: `src/config.js` מתוך `config.example.js` |
| בדיקות יחידה | `npm test` |
| פריסה | `git push` ל-`main` - GitHub Actions מריץ בדיקות ומפרסם |

פתיחת `index.html` ישירות מהדיסק (file://) לא תעבוד - מודולי ES דורשים שרת HTTP.

## תלויות

| חבילה | שימוש |
|-------|-------|
| `@supabase/supabase-js` 2.117.2 | התחברות, גישה לטבלה, realtime. מוגש מקומית מ-`src/vendor/supabase.js` (נטען רק במצב ענן) |
| Node.js 22+ | הרצת הבדיקות (`node:test`) בלבד |
| actions/checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages | פריסה ב-GitHub Actions |
