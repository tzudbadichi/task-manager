# פריסה ובדיקות

## מה הרכיב עושה

כל push ל-`main` מריץ את בדיקות היחידה, ואם הן עוברות - מפרסם את תיקיית `src/` ל-GitHub Pages. אין build, אין סודות ואין משתני סביבה.

## קבצים

- `.github/workflows/deploy-pages.yml`
- `package.json` - `npm test`, `npm run serve`
- `tests/` - בדיקות `node:test`

## ה-workflow

| שלב | job | מה קורה |
|-----|-----|---------|
| 1 | `test` | checkout, Node 22, `npm test` |
| 2 | `deploy` (תלוי ב-test) | configure-pages, העלאת `src/` כ-artifact, deploy-pages |

מופעל ב-push ל-`main` כשמשתנים `src/**`, `tests/**`, `package.json` או קובץ ה-workflow, וגם ידנית (`workflow_dispatch`). הרשאות: ברירת מחדל `contents: read`; רק ל-job הפריסה יש `pages: write` ו-`id-token: write`.

## הגדרה ראשונית (פעם אחת)

1. יצירת ריפו בחשבון GitHub האישי: `gh repo create tzudbadichi/task-manager --public --source . --remote origin`
2. הפעלת Pages במצב GitHub Actions: `gh api -X POST repos/tzudbadichi/task-manager/pages -f build_type=workflow`
3. `git push -u origin main`
4. הכתובת: `https://tzudbadichi.github.io/task-manager/`

בחשבון GitHub חינמי, Pages עובד רק על ריפו ציבורי. הריפו מכיל קוד בלבד - המשימות עצמן נשמרות בדפדפן ולא נכנסות לגיט (וקבצי גיבוי חסומים ב-`.gitignore`).

## עדכון

`git push` ל-`main` -> מעקב: `gh run watch` או לשונית Actions. GitHub Pages שומר קבצים במטמון עד כ-10 דקות; אם גרסה חדשה לא מופיעה - רענון קשיח (Ctrl+F5).

## הרצה ובדיקה מקומית

- `npm run serve` -> `http://localhost:8080` (משתמש ב-Python; כל שרת סטטי שמגיש `.js` כ-`text/javascript` מתאים).
- `npm test` - בדיקות ל-reducer, נרמול, store, selectors, utils והעדפות תצוגה.
- פתיחת `index.html` ישירות מהדיסק לא תעבוד (מודולי ES דורשים HTTP).
