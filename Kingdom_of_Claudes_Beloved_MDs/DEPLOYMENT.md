# פריסה ובדיקות

## מה הרכיב עושה

כל push ל-`main` מריץ את בדיקות היחידה, ואם הן עוברות - יוצר את `src/config.js` מ-repository Variables ומפרסם את `src/` ל-GitHub Pages.

## קבצים

- `.github/workflows/deploy-pages.yml`
- `supabase/schema.sql` - מורץ פעם אחת בפרויקט ה-Supabase
- `src/config.example.js` - תבנית ל-`config.js`
- `package.json` - `npm test`, `npm run serve`
- `tests/` - בדיקות `node:test`

## ה-workflow

| שלב | job | מה קורה |
|-----|-----|---------|
| 1 | `test` | checkout, Node 22, `npm test` |
| 2 | `deploy` (תלוי ב-test) | יצירת `config.js` מ-`vars.SUPABASE_URL` ו-`vars.SUPABASE_ANON_KEY` (מצוטטים עם `JSON.stringify`), configure-pages, העלאת `src/`, deploy-pages |

מופעל ב-push ל-`main` כשמשתנים `src/**`, `tests/**`, `package.json` או קובץ ה-workflow, וגם ידנית (`workflow_dispatch`). הרשאות: ברירת מחדל `contents: read`; רק ל-job הפריסה יש `pages: write` ו-`id-token: write`. בלי ה-Variables נוצר `config.js` ריק, והאתר עובד במצב מקומי בלבד.

## חיבור ל-Supabase (פעם אחת)

1. **פרויקט**: יצירת פרויקט חדש ב-Supabase.
2. **סכמה**: SQL Editor -> New query -> להדביק את `supabase/schema.sql` -> Run (אפשר להריץ שוב בבטחה).
3. **כתובות חזרה**: Authentication -> URL Configuration -> Site URL: `https://tzudbadichi.github.io/task-manager/`, ולהוסיף אותה (ואת `http://localhost:8080/` לפיתוח) ל-Redirect URLs.
4. **Variables בריפו**: מהדאשבורד של Supabase (Project Settings -> API) להעתיק את ה-Project URL ואת ה-publishable key, ולהגדיר:
   ```
   gh variable set SUPABASE_URL -R tzudbadichi/task-manager
   gh variable set SUPABASE_ANON_KEY -R tzudbadichi/task-manager
   ```
   (כל פקודה מבקשת את הערך בטרמינל.) אחר כך `gh workflow run deploy-pages.yml -R tzudbadichi/task-manager` לפריסה מחדש.
5. **הרשמה**: באתר -> "אין לי חשבון - הרשמה", ואישור המייל אם הפרויקט דורש אישור.

## הגדרה ראשונית של הריפו (בוצעה)

ריפו ציבורי `tzudbadichi/task-manager`, Pages במצב GitHub Actions (`gh api -X POST repos/tzudbadichi/task-manager/pages -f build_type=workflow`). הכתובת: `https://tzudbadichi.github.io/task-manager/`. בחשבון GitHub חינמי Pages עובד רק על ריפו ציבורי; הריפו מכיל קוד בלבד - המשימות נמצאות בדפדפן ובחשבון ה-Supabase, ו-`config.js` וקבצי גיבוי חסומים ב-`.gitignore`.

## עדכון

`git push` ל-`main` -> מעקב: `gh run watch` או לשונית Actions. GitHub Pages שומר קבצים במטמון עד כ-10 דקות; אם גרסה חדשה לא מופיעה - רענון קשיח (Ctrl+F5).

## הרצה ובדיקה מקומית

- מצב מקומי: `npm run serve` -> `http://localhost:8080` (משתמש ב-Python; כל שרת סטטי שמגיש `.js` כ-`text/javascript` מתאים).
- מצב ענן מקומית: להעתיק `src/config.example.js` ל-`src/config.js` ולמלא את שני הערכים.
- `npm test` - בדיקות ל-reducer, נרמול והסבה, store, selectors, מנוע הסנכרון (מול remote מדומה), ה-adapter של Supabase (מול client מדומה), utils והעדפות תצוגה.
- פתיחת `index.html` ישירות מהדיסק לא תעבוד (מודולי ES דורשים HTTP).
