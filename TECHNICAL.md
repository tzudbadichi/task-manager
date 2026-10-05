# TECHNICAL - מפת המערכת

מנהל משימות אישי: משימות כלליות עם תתי משימות, סטטוסים של "קלוד רץ" / "ממתין למייל" / "התקבל מייל", וקטגוריות צבעוניות. אתר סטטי ללא שרת, נפרס ל-GitHub Pages.

## סקירת ארכיטקטורה

אפליקציית דפדפן סטטית (HTML + CSS + JavaScript מודולרי, בלי build ובלי תלויות חיצוניות). כל הנתונים נשמרים ב-localStorage של הדפדפן ולא נשלחים לשום שרת; גיבוי והעברה בין מחשבים נעשים בייצוא/ייבוא קובץ JSON.

```
[index.html] -> app.js (אירועים, טיימר, דיאלוגים)
                  |-- store.js      (reducer טהור + שמירה ל-localStorage + undo)
                  |-- selectors.js  (דחיפות, סינון, מיון, ספירות לדשבורד)
                  |-- render.js     (בניית DOM מה-state)  -> dom.js, icons.js
                  |-- ui-prefs.js   (העדפות תצוגה: סינון, מיון, כרטיסים פתוחים)
GitHub push -> GitHub Actions: בדיקות יחידה -> פרסום src/ ל-GitHub Pages
```

זרימה: פעולת משתמש -> `store.dispatch(action)` -> reducer מחזיר state חדש -> נשמר ל-localStorage -> `render()` בונה מחדש את התצוגה.

## מבנה הקבצים

```
project-root/
├── src/                          # האתר עצמו - זה מה שנפרס ל-GitHub Pages
│   ├── index.html                # מעטפת RTL, דיאלוגים סטטיים, CSP קשיח
│   ├── favicon.svg               # לוגו
│   ├── css/styles.css            # עיצוב, ערכות בהירה/כהה, צבעי סטטוסים, רספונסיבי
│   └── js/
│       ├── app.js                # נקודת כניסה: חיווט אירועים, טיימר, התראות, גיבוי
│       ├── store.js              # reducer, נרמול נתונים, שמירה, undo
│       ├── selectors.js          # רמות דחיפות, סינון, מיון, ספירות
│       ├── render.js             # בניית הדשבורד, הסינון, כרטיסי המשימות והדיאלוגים
│       ├── statuses.js           # קטלוג הסטטוסים
│       ├── ui-prefs.js           # שמירת העדפות תצוגה
│       ├── dom.js                # בונה DOM בטוח (טקסט בלבד, בלי innerHTML)
│       ├── icons.js              # אייקוני SVG
│       └── utils.js              # עזרים טהורים (ניקוי טקסט, זמנים, צבעים)
├── tests/                        # בדיקות יחידה (node:test)
│   └── fixtures/                 # localStorage מדומה ומחולל מזהים
├── .github/workflows/deploy-pages.yml   # בדיקות + פריסה ל-GitHub Pages
├── Kingdom_of_Claudes_Beloved_MDs/      # מסמכי פירוט לכל רכיב
├── package.json                  # סקריפטים: test, serve
├── TECHNICAL.md                  # המסמך הזה
└── README.md                     # הוראות שימוש והרצה
```

## רכיבים

**[מודל הנתונים ושמירה]** - מבנה ה-state (קטגוריות, משימות, תתי משימות, הגדרות), כל הפעולות של ה-reducer, נרמול קלט לא אמין, שמירה ל-localStorage, undo וסנכרון בין לשוניות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATE_STORE.md`

**[סטטוסים ודחיפות]** - ששת הסטטוסים, הטיימרים של "קלוד רץ" ו"ממתין למייל", רמות הדחיפות, סדר המיון, הספירות בדשבורד והתראות הדפדפן.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/STATUS_WORKFLOW.md`

**[ממשק המשתמש]** - מבנה המסך, רינדור והאצלת אירועים, שמירת פוקוס, דיאלוגים, הודעות toast, ערכות צבע, קיצורי מקלדת ואבטחת תצוגה (CSP / XSS).
> Detail: `Kingdom_of_Claudes_Beloved_MDs/USER_INTERFACE.md`

**[פריסה ובדיקות]** - GitHub Actions ל-GitHub Pages, הגדרה ראשונית של הריפו, הרצה מקומית ובדיקות.
> Detail: `Kingdom_of_Claudes_Beloved_MDs/DEPLOYMENT.md`

## קונפיגורציה וסביבה

| פריט | ערך / מיקום | הערה |
|------|-------------|------|
| מפתח הנתונים ב-localStorage | `taskManager.state.v1` | כל ה-state (JSON) |
| מפתח העדפות תצוגה | `taskManager.ui.v1` | סינון, מיון, כרטיסים פתוחים (בלי טקסט החיפוש) |
| זמן עד "לבדוק את קלוד" | הגדרות באפליקציה, ברירת מחדל 15 דקות | 1-1440 |
| זמן עד "כדאי לתזכר" | הגדרות באפליקציה, ברירת מחדל 3 ימים | 1-90 |
| משתני סביבה / סודות | אין | האתר לא מתחבר לשום שירות חיצוני |

## הרצה ופקודות

| פעולה | פקודה |
|-------|-------|
| הרצה מקומית | `npm run serve` ואז `http://localhost:8080` (דורש Python; כל שרת סטטי מתאים) |
| בדיקות יחידה | `npm test` |
| פריסה | `git push` ל-`main` - GitHub Actions מריץ בדיקות ומפרסם |

פתיחת `index.html` ישירות מהדיסק (file://) לא תעבוד - מודולי ES דורשים שרת HTTP.

## תלויות

| חבילה | שימוש |
|-------|-------|
| אין תלויות runtime | האתר הוא JavaScript נקי |
| Node.js 22+ | הרצת הבדיקות (`node:test`) בלבד |
| actions/checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages | פריסה ב-GitHub Actions |
