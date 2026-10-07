# Open Outcry

A review game for AP Macroeconomics Unit 1 (scarcity, opportunity cost and the PPC, comparative advantage and terms of trade, supply and demand, shortage and surplus). It was built for David Bassin's AP Macro class at DRS: seniors, one section of about 18 students, 38-minute periods.

The first screen offers two ways to play:

- **Play on my own (Solo).** Each student plays on their own laptop, Chromebook, or phone with no help from the teacher. Two taps start a game: "Play on my own", then a length (Short 8 questions, about 10 min; Medium 12, about 15 min; Long 18, about 25 min). A first-time player gets one practice question that teaches the controls and does not count (its bet step draws a dashed box around the bet buttons). For each question the student taps an answer (or the numbered point on a PPC or deal graph), then a bet ($500, $1,000 or $2,000; the bet buttons are visible but greyed until an answer is picked, and the bet locks in the answer), and right away sees right or wrong, the animated graph, and a short explanation, with one short line under every answer saying why it is right or wrong (Solo and Review my misses; Class leaves it to the teacher so the projector view stays short). On a double shift the reveal draws both cases side by side ("if demand shifts more", "if supply shifts more") so the graph shows why one of price or quantity can't be told. Every question has a free hint. The middle of the game has a Shift or Slide speed round (20 seconds per sentence and one tap locks it in; right +$500, wrong or out of time no change, so there is no reason to stall). On the final question a fourth button, "Bet it all", sits at the end of the bet bar and takes two taps (Yes / Cancel); the usual three bets never move. After the last question the student types their name, answers every miss again with no money (Review my misses: pick an answer or Shift/Slide, then Check my answer, which shows greyed until a pick, like the bets; the do-line names the pick; skipping takes two taps and the card counts what was skipped), and then sees the results card once: name, date, money, questions right (first tries), speed round score, score by topic, and the second-try score. Nothing is sent anywhere: the card tells the student to take a screenshot, then show the card to the teacher or upload the screenshot to Schoology if the teacher asks. The finished card is also saved on that device's start screen ("See my last results card"), so the card's Home button (two taps) can't lose it.
- **Play as a class (Class).** The teacher projects one screen. Teams of 3 or 4 each start with $10,000. The clock starts by itself. When time is up, teams hold up 1 to 4 fingers (one hand, the answer only). The teacher taps Show the answer, then taps each team on the scoreboard at the top that showed the right answer. A right answer wins the money shown on the question: $1,000 in the first half, $2,000 after the halfway check, $3,000 on the last question. The speed round is shouted: the teacher taps the team that shouted the right answer first (+$500). Teacher clicks per round (5 teams, 3 right): 6 if the teacher stops the clock, 5 if it runs out. The Oct 7 version needed 12 and 11.

The Solo rules, as shown before a game:

1. You start with $10,000 in play money.
2. Tap an answer. Then bet $500, $1,000, or $2,000 on it.
3. Right: you win your bet. Wrong: you lose your bet.
4. Your results card shows your money and your questions right.

Under the rules, a "Good to know" box previews the speed round, the bet-it-all final question, and the end (answer misses again, screenshot the card, show the teacher). The game names two scores only, everywhere: money and questions right.

Every screen has one line in the bottom tray that says what to do right now, and at most one main button. Action words are plain: answer, bet, next. No trading words for actions (call, flash, floor, ticker, trader, desk, session, bailout). The dark price board with flip digits keeps the trading-floor look. The scrolling ticker tape was removed from the first screen because a blind test read it as something to click.

## Files

- `src/bank.js`: every question, plus the Solo `practice` question. News Desk, Double Shock, and practice answers are computed in app.js from the `shift` / `shifts` data, so change that data, never a hard-coded answer. Every other round has `options`, an `answer` from 1 to 4, and `whyEach` (one reason per option, shown under each answer after the reveal; keep each under about 60 characters so it fits on one line on a laptop, keep it in step with the options, and recheck its numbers). The supply and demand reasons are computed in app.js (`reasonsFor`), the same way their answers are.
- `src/app.js`: the game engine, every screen for both modes, the SVG graphs (supply and demand, PPC, deal zone, line chart), scoring, and sound (Web Audio, no files). Sections: constants and templates (`TEMPLATES.class` and `TEMPLATES.solo` set the order of each game; `'|'` is the Class halfway check, `'speed:n'` a speed round), state, playlist, graphs, board, screens, bottom tray (`barSpec()` holds every do-this-now line), Class flow, Solo flow, events, boot.
- `src/style.css`: all styling. Every color is a token on `:root` with light and dark values. The team colors `--t1` to `--t6` are in a fixed order that was checked for color-blind separation, so keep that order.
- `src/shell.html`: the page skeleton. build.py fills in the CSS and JS.
- `index.html` (repo root): sends visitors of the GitHub Pages address on to `dist/`.
- Hosting: GitHub Pages from `main` of `dbassin12/open-outcry`. Students use https://dbassin12.github.io/open-outcry/ (it opens `dist/index.html`). A push to `main` updates the live game in about a minute.
- `build.py`: run `python3 build.py`. It writes `dist/index.html` (the complete page: open it in a browser or host it as is) and `dist/artifact.html` (the same page without the html and head tags, for a claude.ai artifact).
- `tools/playtest.py`: automated playthrough with Playwright. See the docstring for setup and modes. It plays full Class and Solo games (Solo includes the practice question, speed round, last question, name, results card and Review my misses), renders every bank round in both modes, tours every screen at 1366x768, 1920x1080 and 390x844 in light and dark, and checks money math, console errors, overflow, text under 11px (10px in graphs), trading words, em dashes, the do-this-now line, more than one main button, and (on phones) the four answers of a supply and demand question sitting above the tray. It prints ALL CHECKS PASSED and exits 0 when clean. `phone` mode reruns only the 390x844 checks, and `OO_PAGE=...` / `OO_SHOTS=...` point it at another copy of the page or another screenshot folder. Screenshots go to `screenshots/`; `screenshots/story/` is one complete Short Solo game, every step in order (54 screens).
- Understanding check: give a fresh subagent that has never seen the code only `screenshots/story/*.png`, in order, and ask what each screen wants and what it would tap next. Re-run it after any change to a Solo screen.
- `window.__oo` in app.js is a test hook the playtest uses (`state`, `roundFor`, `view`, `enter`, `betOptions`, `timeout`, `unlock`). Keep it working.

## Game rules worth knowing before you change them

- Solo bets are capped at the student's money. If a wrong answer takes them to $0 before the final question, they get $1,000 to keep playing (a note next to the explanation says so). The final question keeps the usual three bets and adds Bet it all as the last button in the bet bar. It needs a second tap: the bar turns into Yes, bet it all / Cancel, with Cancel where the first tap landed, and taps are ignored for 0.45 seconds, so a double tap can't bet everything.
- Taps are ignored for 0.45 seconds after each step so a double tap can't skip the answer screen.
- First-time detection uses localStorage (`open-outcry:practiced`). If storage is blocked, every game starts with the practice question, and it has a Skip practice button.
- Saved games (`open-outcry:v2`) come back as a Keep playing banner on the first screen. Old v1 saves are ignored, but their team names and settings carry over.

## Content rules

- The answer keys were checked by an independent AP Macro review on Oct 7, 2026. If you add or change a question, recompute the answer and the explanation yourself, and make sure no wrong option is also defensible.
- Use AP Macro terms: determinants of demand and supply, change in demand vs. change in quantity demanded, normal and inferior goods, substitutes and complements, indeterminate, absolute and comparative advantage, opportunity cost.
- Writing: plain, direct teacher voice and short sentences. No em dashes anywhere, in on-screen text or in docs.

## Page rules

- One self-contained HTML page. No backend, no accounts, no frameworks, no build tools beyond build.py. The only outside requests are Google Fonts.
- It must also run inside a claude.ai artifact frame. So: no alert(), confirm(), prompt() or window.print(), and localStorage can be blocked, so every use goes through the `store` helper and the game works without it.
- It must read well on a classroom projector (big type) and work at 390px phone width with no sideways scrolling, in light and dark mode. On phones the four answers should be visible without scrolling on a supply and demand question; the playtest checks this, and on phones the plain starting graph waits for the reveal to make room.
- Respect prefers-reduced-motion. Keep keyboard support: the right arrow, Space or Enter goes on (a presentation clicker works in Class mode), and in Solo the keys 1 to 4 pick an answer.

## Teacher feedback

- Oct 7, 2026: "The game is not intuitive," and students should be able to play it alone in class. Answered the same day with Solo mode, the first screen, the do-this-now line, the practice question, and the one-hand Class flow with scoreboard tapping.
