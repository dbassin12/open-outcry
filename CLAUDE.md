# Open Outcry

A review game for AP Macroeconomics Unit 1 (scarcity, opportunity cost and the PPC, comparative advantage and terms of trade, supply and demand, shortage and surplus). It was built for David Bassin's AP Macro class at DRS: seniors, one section of about 18 students, 38-minute periods.

Right now it has one mode, Class mode. The teacher projects it, teams of 3 or 4 act as trading firms with $10,000 each, read market news, hold up an answer (1 to 4 fingers) and a bet, and the teacher records each team's hands.

## Files

- `src/bank.js`: every question. News Desk and Double Shock answers are computed in app.js from the `shift` / `shifts` data, so change that data, never a hard-coded answer. Every other round has `options` and an `answer` from 1 to 4.
- `src/app.js`: the game engine, every screen, the SVG graphs (supply and demand, PPC, deal zone, line chart), scoring, and sound (Web Audio, no files).
- `src/style.css`: all styling. Every color is a token on `:root` with light and dark values. The team colors `--t1` to `--t6` are in a fixed order that was checked for color-blind separation, so keep that order.
- `src/shell.html`: the page skeleton. build.py fills in the CSS and JS.
- `build.py`: run `python3 build.py`. It writes `dist/index.html` (the complete page: open it in a browser or host it as is) and `dist/artifact.html` (the same page without the html and head tags, for a claude.ai artifact).
- `tools/playtest.py`: automated playthrough with Playwright. See the docstring for setup. It prints ALL CHECKS PASSED and exits 0 when clean, and saves screenshots to `screenshots/`.
- `window.__oo` in app.js is a test hook the playtest uses. Keep it working.

## Content rules

- The answer keys were checked by an independent AP Macro review on Oct 7, 2026. If you add or change a question, recompute the answer and the explanation yourself, and make sure no wrong option is also defensible.
- Use AP Macro terms: determinants of demand and supply, change in demand vs. change in quantity demanded, normal and inferior goods, substitutes and complements, indeterminate, absolute and comparative advantage, opportunity cost.
- Writing: plain, direct teacher voice and short sentences. No em dashes anywhere, in on-screen text or in docs.

## Page rules

- One self-contained HTML page. No backend, no accounts, no frameworks, no build tools beyond build.py. The only outside requests are Google Fonts.
- It must also run inside a claude.ai artifact frame. So: no alert(), confirm(), prompt() or window.print(), and localStorage can be blocked, so wrap every use in try/catch and make the game work without it.
- It must read well on a classroom projector (big type) and work at 390px phone width with no sideways scrolling, in light and dark mode.
- Respect prefers-reduced-motion. Keep keyboard support (arrow keys, space) so a presentation clicker works.

## Teacher feedback

- Oct 7, 2026: "The game is not intuitive," and students should be able to play it alone in class.
