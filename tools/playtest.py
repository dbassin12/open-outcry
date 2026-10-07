"""Automated playtest for Open Outcry.

Plays full Class games and full Solo games (practice question, speed round, last question, name, results card,
Review my misses), renders every round in the bank in both modes, checks the money after every step,
counts teacher clicks per Class round, and checks every screen for console errors, layout overflow,
text too small to read, trading words, em dashes, a missing do-this-now line, and more than one main button.
Screenshots go to screenshots/. Run `python3 build.py` first.

Setup:   python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/python -m playwright install chromium
Usage:   .venv/bin/python tools/playtest.py [all|class|solo|cover|tour|story|phone]      (default: all)
           class  full and quick Class games, plus the teacher click count
           solo   full Solo games (long, medium, short) at three screen sizes, with Review my misses
           cover  every round in the bank, in Class mode and in Solo mode
           tour   every Solo and Class screen at 1366x768, 1920x1080 and 390x844, light and dark (screenshots/tour/)
           story  one Solo game, one screenshot per screen, in order (screenshots/story/), for the understanding check
           phone  only the 390x844 checks: the phone tour in light and dark, a Solo game, a Class game, every round
Result:  prints ALL CHECKS PASSED and exits 0 when everything is clean, otherwise lists the problems and exits 1.
Options: OO_PAGE=path/to/page.html tests another copy of the page; OO_SHOTS=folder puts screenshots there.

This was written for the Oct 7, 2026 version (Solo and Class modes). Update it whenever the game flow changes.
"""
import math, os, re, shutil, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PAGE = Path(os.environ.get('OO_PAGE') or ROOT / 'dist' / 'index.html').resolve().as_uri()   # OO_PAGE: test another copy of the page
OUT = Path(os.environ.get('OO_SHOTS') or ROOT / 'screenshots')                               # OO_SHOTS: put screenshots somewhere else
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'
if MODE == 'all':
    shutil.rmtree(OUT, ignore_errors=True)
OUT.mkdir(parents=True, exist_ok=True)
errors, problems, overflow, textprobs, report = [], [], [], [], []
SIZES = [('laptop', 1366, 768), ('projector', 1920, 1080), ('phone', 390, 844)]
BANNED = re.compile(r'\b(calls?|flash(es)?|floor|tickers?|traders?|bailouts?|desks?|sessions?)\b', re.I)
SOLO_BETS = [500, 1000, 2000]
START, BAILOUT, SPEED = 10000, 1000, 500


# ---------------------------------------------------------------- helpers
def new_page(b, w, h, theme, tag):
    phone = w < 600
    ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=theme, device_scale_factor=2 if phone else 1, is_mobile=phone, has_touch=phone)
    page = ctx.new_page()
    page.on('console', lambda m: errors.append(f'[{tag}] console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror: {e}'))
    page.goto(PAGE)
    page.wait_for_timeout(700)
    return ctx, page


def st(page):
    return page.evaluate('() => JSON.parse(JSON.stringify(window.__oo.state))')


def rnd(page):
    return page.evaluate('''() => { const v = window.__oo.view(), r = window.__oo.roundFor(v.seg);
      return r ? {answer: r.answer, desk: r.desk, id: r.id || v.seg.ref, part: r.part || null, visual: r.visual || null, final: !!v.seg.final} : null }''')


def click(page, sel, wait=160):
    """A real click. The game ignores taps for 0.45 s after each step (so a double tap can't skip a screen); tests skip that pause."""
    page.evaluate('() => window.__oo.unlock()')
    page.click(sel)
    page.wait_for_timeout(wait)


def go(page, wait=160):
    click(page, '#bar [data-act=go]', wait)


def shot(page, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(path))


FIT_JS = '''() => {
  const out = { clipped: [] };
  /* On a phone the browser stretches innerWidth to fit content that is too wide, so measure against the real screen width. */
  const vw = document.documentElement.clientWidth;
  out.hscroll = document.documentElement.scrollWidth > vw + 1 || window.innerWidth > vw + 1;
  let off = 0;
  document.querySelectorAll('#bar *, #stage *, .board *').forEach((el) => {
    if (off >= 3 || el.closest('.table-wrap, .lc, [hidden], .vh')) return;
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1) { off++; out.clipped.push('past the right edge: ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' "' + el.textContent.trim().slice(0, 20) + '"'); }
  });
  const stg = document.querySelector('#stage');
  out.stage = stg.scrollHeight - stg.clientHeight;
  out.stageX = stg.scrollWidth - stg.clientWidth;
  const cc = document.querySelector('.callcard'); if (cc) out.callcard = cc.scrollHeight - cc.clientHeight;
  const tk = document.querySelector('.ticket'); if (tk) out.ticket = tk.scrollHeight - tk.clientHeight;
  const g = document.querySelector('.ticket .graph'); if (g) out.graphH = Math.round(g.getBoundingClientRect().height);
  document.querySelectorAll('button, .opt, #do, .rc-name, .headline, .flash-statement, .mode-title, .screen-title, .who, .adj-row, .rank, .rc-stat, .rc-topics th, .rc-topics td, .length, .mode, .tile, .choice, .ss-rule, .tt').forEach((el) => {
    if (el.closest('[hidden], .vh, .table-wrap')) return;
    if (getComputedStyle(el).textOverflow === 'ellipsis') return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    if (el.scrollWidth > el.clientWidth + 1) out.clipped.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' "' + el.textContent.trim().slice(0, 24) + '"');
  });
  document.querySelectorAll('#stage .table-wrap').forEach((el) => { if (el.scrollWidth > el.clientWidth + 1) out.clipped.push('table wider than the screen "' + el.textContent.trim().slice(0, 24) + '"'); });
  const bar = document.querySelector('#bar').getBoundingClientRect(), sr = stg.getBoundingClientRect();
  out.overlap = sr.bottom > bar.top + 1;
  out.barOut = bar.bottom > window.innerHeight + 1;
  return out; }'''

TEXT_JS = '''() => {
  const small = [], seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, txt = node.textContent.trim();
    if (!txt) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest('.tape, .vh, [hidden], script, style')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    let px = parseFloat(getComputedStyle(el).fontSize);
    const svg = el instanceof SVGElement;
    if (svg) { const m = el.getScreenCTM(); if (m) px *= Math.hypot(m.a, m.b); }
    const sub = svg && el.tagName.toLowerCase() === 'tspan';
    if (px < (sub ? 8.5 : svg ? 10 : 11)) small.push(el.tagName.toLowerCase() + '.' + String(el.getAttribute('class') || '').split(' ')[0] + ' "' + txt.slice(0, 18) + '" ' + px.toFixed(1) + 'px');
  }
  const text = document.body.innerText;
  const doline = ((document.querySelector('#do') || {}).textContent || '').trim();
  const primaries = Array.from(document.querySelectorAll('.btn.primary')).filter((b) => { const r = b.getBoundingClientRect(); return r.width && !b.closest('[hidden], #modal, .vh'); }).length;
  return { small, text, doline, primaries }; }'''


# Phones: on a supply and demand question, in the answer step, answer 4 must sit above the bottom tray (px of room, or None).
FOLD_JS = '''() => { const s = window.__oo.state;
  if (s.mode !== 'solo' || s.screen !== 'round' || s.phase !== 'answer' || s.hintShown) return null;
  const v = window.__oo.view(), r = window.__oo.roundFor(v.seg);
  if (!(v.kind === 'practice' || (r && (r.desk === 'news' || r.desk === 'double')))) return null;
  const o = [...document.querySelectorAll('#stage .opt[data-act=answer]')]; if (o.length !== 4) return null;
  let y = o[3].getBoundingClientRect().bottom, e = o[3].parentElement; while (e) { y += e.scrollTop || 0; e = e.parentElement; }
  return Math.round(document.querySelector('#bar').getBoundingClientRect().top - y); }'''


def check(page, label, scroll_ok=False):
    """Layout and wording checks for whatever is on screen now."""
    w = page.viewport_size['width']
    desktop = w >= 1000
    res = page.evaluate(FIT_JS)
    bad = []
    if res['hscroll'] or res['stageX'] > 2:
        bad.append('scrolls sideways')
    if res['clipped']:
        bad.append('clipped ' + ', '.join(res['clipped'][:4]))
    if res['overlap'] or res['barOut']:
        bad.append('bottom tray overlaps or is cut off')
    if desktop and not scroll_ok:
        if res['stage'] > 2:
            bad.append(f"stage overflows by {res['stage']}px")
        for k in ('callcard', 'ticket'):
            if res.get(k, 0) > 2:
                bad.append(f'{k} overflows by {res[k]}px')
        if res.get('graphH') is not None and res['graphH'] < 150:
            bad.append(f"graph only {res['graphH']}px tall")
    if w <= 640:
        room = page.evaluate(FOLD_JS)
        if room is not None and room < 0:
            bad.append(f'answer 4 is {-room}px under the bottom tray')
    if bad:
        overflow.append(f'{label}: ' + '; '.join(bad))
    t = page.evaluate(TEXT_JS)
    for s in t['small'][:3]:
        textprobs.append(f'{label}: text too small {s}')
    hits = sorted(set(m.group(0).lower() for m in BANNED.finditer(t['text'])))
    if hits:
        textprobs.append(f'{label}: trading words on screen: {hits}')
    if '—' in t['text']:
        textprobs.append(f'{label}: em dash on screen')
    if not t['doline']:
        textprobs.append(f'{label}: no do-this-now line')
    elif len(t['doline']) > 95:
        textprobs.append(f'{label}: do-this-now line is long ({len(t["doline"])} chars)')
    if t['primaries'] > 1:
        textprobs.append(f"{label}: {t['primaries']} main buttons")
    return res


def js_round(x):
    return math.floor(x + 0.5)


# ---------------------------------------------------------------- Class mode
def class_value(s, idx):
    seg = s['playlist'][idx]
    if seg.get('final'):
        return 3000
    half = s['halfAfter']
    second = idx > half if half >= 0 else idx >= math.ceil(len(s['playlist']) / 2)
    return 2000 if second else 1000


def class_setup(page, teams, length):
    click(page, '#go-class', 300)
    cur = st(page)['settings']['teamCount']
    while cur != teams:
        click(page, '[data-act="teams%s"]' % ('+' if teams > cur else '-'))
        cur += 1 if teams > cur else -1
    page.click(f'label:has(#len-{length})')
    page.wait_for_timeout(100)


def class_round(page, tag, n_teams, early=True, marks=None, shots=None, name=''):
    """One Class question. Returns the teacher clicks it took (toggle tests excluded)."""
    clicks = 0
    s = st(page)
    if s['phase'] != 'thinking' or not page.evaluate('() => document.querySelector("#clock") !== null'):
        problems.append(f'{tag}: the clock did not start on its own')
    check(page, f'{tag} {name} thinking')
    if shots: shot(page, shots / f'{name}-a-thinking.png')
    if name == 'q02':                                               # the clock controls: Pause, Resume, +15 sec
        click(page, '#bar [data-act=pause]', 400)
        left = page.evaluate('() => document.querySelector("#clock-num").textContent')
        page.wait_for_timeout(1300)
        if page.evaluate('() => document.querySelector("#clock-num").textContent') != left:
            problems.append(f'{tag}: Pause did not stop the clock')
        click(page, '#bar [data-act=pause]', 200)
        before = page.evaluate('() => document.querySelector("#clock-num").textContent')
        click(page, '#bar [data-act=plus]', 200)
        after = page.evaluate('() => document.querySelector("#clock-num").textContent')
        secs = lambda t: int(t.split(':')[0]) * 60 + int(t.split(':')[1])
        if secs(after) < secs(before) + 13:
            problems.append(f'{tag}: +15 sec did not add time ({before} to {after})')
    if early:
        go(page, 250); clicks += 1                                  # Stop the clock
    else:
        page.evaluate('() => window.__oo.timeout()'); page.wait_for_timeout(250)   # the clock runs out by itself
    if st(page)['phase'] != 'hands':
        problems.append(f'{tag}: no Hands up step')
    check(page, f'{tag} {name} hands up')
    if shots: shot(page, shots / f'{name}-b-hands.png')
    before = st(page)
    go(page, 1500); clicks += 1                                     # Show the answer
    s = st(page)
    r = rnd(page)
    if s['phase'] != 'revealed':
        problems.append(f'{tag}: Show the answer did not reveal')
    if [t['cash'] for t in s['teams']] != [t['cash'] for t in before['teams']]:
        problems.append(f'{tag}: money changed before anyone was marked right')
    marks = marks if marks is not None else [i for i in range(n_teams) if i % 3 != 2]
    value = class_value(s, s['idx'])
    shown = page.evaluate('() => (document.querySelector(".worth") || {}).textContent || ""')
    if shown != f'Worth ${value:,}':
        problems.append(f'{tag}: screen says "{shown}" but the question is worth ${value:,}')
    for i in marks:
        click(page, f'#tiles [data-act=tile][data-i="{i}"]', 120); clicks += 1
    if marks:                                                        # tap twice more to test that a tap can be undone
        click(page, f'#tiles [data-act=tile][data-i="{marks[0]}"]', 80)
        click(page, f'#tiles [data-act=tile][data-i="{marks[0]}"]', 120)
    page.wait_for_timeout(500)
    after = st(page)
    for i, t in enumerate(after['teams']):
        exp = before['teams'][i]['cash'] + (value if i in marks else 0)
        if t['cash'] != exp:
            problems.append(f"{tag} q{s['idx'] + 1} team {i}: expected {exp}, got {t['cash']}")
        if t['history'][-1] != t['cash']:
            problems.append(f"{tag} q{s['idx'] + 1} team {i}: chart history out of step")
    check(page, f'{tag} {name} revealed')
    if shots: shot(page, shots / f'{name}-c-revealed.png')
    go(page, 450); clicks += 1                                      # Next
    return clicks


def class_speed(page, tag, n_teams, shots=None):
    s = st(page)
    items = len(s['playlist'][s['idx']]['items'])
    for k in range(items):
        check(page, f'{tag} speed {k + 1}')
        if shots and k == 0: shot(page, shots / 'speed-a.png')
        go(page, 300)                                               # Show the answer
        before = [t['cash'] for t in st(page)['teams']]
        a, b2 = k % n_teams, (k + 1) % n_teams
        click(page, f'#tiles [data-act=tile][data-i="{a}"]')
        if k == 0:                                                  # switch the winner, then switch back
            click(page, f'#tiles [data-act=tile][data-i="{b2}"]')
            mid = [t['cash'] for t in st(page)['teams']]
            if mid[a] != before[a] or mid[b2] != before[b2] + SPEED:
                problems.append(f'{tag}: switching the speed-round winner moved money wrong')
            click(page, f'#tiles [data-act=tile][data-i="{a}"]')
        got = [t['cash'] for t in st(page)['teams']]
        exp = [c + (SPEED if i == a else 0) for i, c in enumerate(before)]
        if got != exp:
            problems.append(f'{tag}: speed sentence {k + 1}: expected {exp}, got {got}')
        check(page, f'{tag} speed {k + 1} shown')
        if shots and k == 0: shot(page, shots / 'speed-b-shown.png')
        go(page, 350)


def class_game(b, tag, w, h, theme, teams, length, shots=None):
    ctx, page = new_page(b, w, h, theme, tag)
    class_setup(page, teams, length)
    check(page, f'{tag} setup')
    if shots: shot(page, shots / 'setup.png')
    click(page, '#bar [data-act=start]', 600)
    n = 0
    for _ in range(80):
        s = st(page)
        scr = s['screen']
        if scr == 'round':
            n += 1
            class_round(page, tag, teams, early=n % 2 == 1, shots=shots if n <= 1 else None, name=f'q{n:02d}')
        elif scr == 'speed':
            class_speed(page, tag, teams, shots)
        elif scr == 'half':
            check(page, f'{tag} halfway')
            if shots: shot(page, shots / 'halfway.png')
            go(page, 500)
        elif scr == 'results':
            page.wait_for_timeout(1200)
            check(page, f'{tag} results')
            if shots: shot(page, shots / 'results.png')
            if st(page)['done'] != len(s['playlist']) - 1:
                problems.append(f'{tag}: game ended early')
            break
    else:
        problems.append(f'{tag}: game did not finish')
    ctx.close()


def teacher_clicks(b):
    """Teacher clicks for one standard Class round: 5 teams, 3 of them right."""
    out = {}
    for early in (True, False):
        ctx, page = new_page(b, 1366, 768, 'light', 'clicks')
        class_setup(page, 5, 'full')
        click(page, '#bar [data-act=start]', 600)
        out[early] = class_round(page, 'clicks', 5, early=early, marks=[0, 1, 3])
        ctx.close()
    report.append(f'Teacher clicks per Class round (5 teams, 3 right): {out[True]} when the teacher stops the clock, {out[False]} when the clock runs out')
    report.append('  Old version, measured the same way on commit faf1082 (5 teams, bets 1,2,3,1,2 fingers): 12 and 11')


# ---------------------------------------------------------------- Solo mode
def solo_bets(s, seg):
    """The usual $500, $1,000, $2,000 (capped at the student's money); on the final question, Bet it all comes first."""
    cash, final = s['solo']['cash'], bool(seg.get('final')) and not s['solo']['practice']
    if s['solo']['practice']:
        cash = START
    out = []
    for a in SOLO_BETS:
        a = max(1, min(a, cash))
        if a not in out:
            out.append(a)
    if final and cash > out[-1]:
        out.insert(0, cash)
    return out


def solo_question(page, tag, k, right=True, bet_k=None, shots=None, name=None, keyboard=False, graph=False):
    """Answer one Solo question and check the money. Returns True if it was answered right."""
    s, r = st(page), rnd(page)
    seg = {'final': r['final']}
    check(page, f'{tag} {name or k} answer')
    if shots: shot(page, shots / f'{name}-a-answer.png')
    pick = r['answer'] if right else (r['answer'] % 4) + 1
    if keyboard:
        page.evaluate('() => window.__oo.unlock()'); page.keyboard.press(str(pick)); page.wait_for_timeout(200)
    elif graph:                                                      # tap the numbered point on the graph itself
        click(page, f'#stage .graph [data-act=answer][data-n="{pick}"]', 200)
        if not page.evaluate(f'() => !!document.querySelector("#stage .graph .g-pt.chosen")'):
            problems.append(f'{tag} {name or k}: the picked point is not marked on the graph')
    else:
        click(page, f'#stage [data-act=answer][data-n="{pick}"]', 200)
    s = st(page)
    if s['phase'] != 'bet' or s['solo']['answer'] != pick:
        problems.append(f'{tag} {name or k}: tapping an answer did not move to the bet step')
    opts = page.evaluate('() => window.__oo.betOptions().map(o => o.amount)')
    exp_opts = solo_bets(s, seg)
    if opts != exp_opts:
        problems.append(f'{tag} {name or k}: bet choices {opts}, expected {exp_opts}')
    check(page, f'{tag} {name or k} bet')
    if shots: shot(page, shots / f'{name}-b-bet.png')
    bk = (len(opts) - 1) if bet_k is None else min(bet_k, len(opts) - 1)
    before = s['solo']['cash']
    if page.evaluate(f'() => !!window.__oo.betOptions()[{bk}].all'):  # Bet it all asks for a second tap
        click(page, f'[data-act=bet][data-k="{bk}"]', 200)
        if st(page)['phase'] != 'bet' or not page.query_selector('#bar .bet.all.yes'):
            problems.append(f'{tag} {name or k}: one tap on Bet it all should only ask to confirm')
        check(page, f'{tag} {name or k} bet it all confirm')
        if shots: shot(page, shots / f'{name}-b2-confirm.png')
    click(page, f'[data-act=bet][data-k="{bk}"]', 1500)
    s2 = st(page)
    bet = opts[bk]
    if s['solo']['practice']:
        exp = before
    else:
        exp = before + bet if right else before - min(bet, before)
        if not r['final'] and exp <= 0:
            exp = BAILOUT
    if s2['solo']['cash'] != exp:
        problems.append(f"{tag} {name or k} ({r['id']}): bet {bet} {'right' if right else 'wrong'}, expected {exp}, got {s2['solo']['cash']}")
    if s2['phase'] != 'revealed':
        problems.append(f'{tag} {name or k}: picking a bet did not show the answer')
    flashed = page.evaluate('() => document.querySelector("#do").className')
    if ('win' if right else 'lose') not in flashed:
        problems.append(f'{tag} {name or k}: the bottom line does not say right or wrong')
    check(page, f'{tag} {name or k} revealed')
    because = page.evaluate('() => [...document.querySelectorAll("#stage .opt .because")].map(e => e.textContent)')
    if len(because) != 4 or sum(x.startswith('Right.') for x in because) != 1:
        problems.append(f'{tag} {name or k}: the reveal should give a reason under each of the 4 answers, one of them Right (got {len(because)})')
    if shots: shot(page, shots / f'{name}-c-revealed.png')
    return right


def solo_speed(page, tag, shots=None, prefix='speed'):
    s = st(page)
    if s['speed']['phase'] != 'intro':
        problems.append(f'{tag}: speed round has no intro')
    check(page, f'{tag} speed intro')
    if shots: shot(page, shots / f'{prefix}-0-intro.png')
    go(page, 300)
    items = st(page)['playlist'][st(page)['idx']]['items']
    for k, iid in enumerate(items):
        ans = page.evaluate(f'() => window.__oo.B.flash.find(f => f.id === "{iid}").answer')
        before = st(page)['solo']['cash']
        check(page, f'{tag} speed {k + 1} ask')
        if shots and k == 0: shot(page, shots / f'{prefix}-1-ask.png')
        if k == 1:
            page.evaluate('() => window.__oo.timeout()'); page.wait_for_timeout(300); exp = before; what = 'timeout'
        elif k == 2:
            wrong = 'SLIDE' if ans == 'SHIFT' else 'SHIFT'
            click(page, f'#stage [data-act=pick][data-v="{wrong}"]', 300); exp = before; what = 'wrong'   # wrong costs nothing in the speed round
        else:
            click(page, f'#stage [data-act=pick][data-v="{ans}"]', 300); exp = before + SPEED; what = 'right'
        if exp <= 0:
            exp = BAILOUT
        got = st(page)['solo']['cash']
        if got != exp:
            problems.append(f'{tag} speed {k + 1} ({what}): expected {exp}, got {got}')
        check(page, f'{tag} speed {k + 1} {what}')
        if shots and k <= 2: shot(page, shots / f'{prefix}-{k + 2}-{what}.png')
        go(page, 300)


def check_card(page, tag, reviewed=None):
    s = st(page)
    log = s['solo']['log']
    q = [e for e in log if e['kind'] == 'q']
    text = page.evaluate('() => document.querySelector("#rcard").innerText')
    flat = ' '.join(text.split())
    want = f"{sum(e['right'] for e in q)} of {len(q)}"
    if want not in flat:
        problems.append(f'{tag}: card should show {want} questions right')
    if f"${s['solo']['cash']:,}" not in flat:
        problems.append(f"{tag}: card does not show the money ${s['solo']['cash']:,}")
    if s['solo']['name'].upper() not in flat.upper():
        problems.append(f'{tag}: card does not show the name')
    topics = {}
    for e in log:
        t = topics.setdefault(e['topic'], [0, 0]); t[1] += 1; t[0] += 1 if e['right'] else 0
    labels = {'news': 'Demand and supply shifts', 'double': 'Double shifts', 'flash': 'Shift or slide (speed round)', 'economy': 'PPC and opportunity cost', 'trade': 'Comparative advantage', 'inventory': 'Shortage and surplus'}
    for key, (rt, tot) in topics.items():
        if f'{labels[key]} {rt} of {tot}' not in flat:
            problems.append(f'{tag}: card topic row should read "{labels[key]} {rt} of {tot}"')
    if reviewed and f'Review my misses (practice): {reviewed[0]} of {reviewed[1]} right' not in flat:
        problems.append(f'{tag}: card should show the review score {reviewed[0]} of {reviewed[1]}')


def solo_end(page, tag, shots=None, skip_after=None):
    """Name screen, then Review my misses (if any), then the results card."""
    if st(page)['screen'] != 'name':
        problems.append(f'{tag}: no name screen at the end'); return
    check(page, f'{tag} name')
    if shots: shot(page, shots / 'end-1-name.png')
    s = st(page)
    misses = [e for e in s['solo']['log'] if not e['right']]
    label = page.evaluate('() => document.querySelector("#nameForm button[type=submit]").textContent')
    if misses and f'({len(misses)})' not in label:
        problems.append(f'{tag}: the name button should lead to the {len(misses)} misses, says "{label}"')
    page.fill('#studentName', '')
    page.wait_for_timeout(150)
    if not page.is_disabled('#nameForm button[type=submit]'):
        problems.append(f'{tag}: the name button works with no name typed')
    check(page, f'{tag} name empty')
    if shots: shot(page, shots / 'end-2-name-empty.png')
    page.fill('#studentName', 'Maya Cohen')
    click(page, '#nameForm button[type=submit]', 600)
    right = 0
    if misses:
        if st(page)['screen'] != 'review':
            problems.append(f'{tag}: the name did not lead to Review my misses'); return
        for k in range(len(misses)):
            s = st(page)
            if s['screen'] != 'review':
                problems.append(f'{tag}: review ended after {k} of {len(misses)}'); break
            if skip_after is not None and k == skip_after:          # Skip to my card partway through
                click(page, '#bar [data-act=skipReview]', 200)
                if st(page)['screen'] != 'review':
                    problems.append(f'{tag}: one tap on Skip should only ask to confirm')
                click(page, '#bar [data-act=skipReview]', 800)
                flat = ' '.join(page.evaluate('() => document.querySelector("#rcard").innerText').split())
                if st(page)['screen'] != 'card' or f'{len(misses) - k} skipped' not in flat:
                    problems.append(f'{tag}: Skip to my card should show the card with {len(misses) - k} skipped')
                check(page, f'{tag} card after skipping')
                check_card(page, tag, (right, len(misses)))
                return
            e = s['solo']['log'][s['solo']['review']['items'][s['solo']['review']['i']]]
            check(page, f'{tag} review {k + 1} answer')
            if shots and k < 2: shot(page, shots / f'review-{k + 1}-a.png')
            ok = k % 2 == 0
            if e['kind'] == 'speed':
                ans = page.evaluate(f'() => window.__oo.B.flash.find(f => f.id === "{e["item"]}").answer')
                v = ans if ok else ('SLIDE' if ans == 'SHIFT' else 'SHIFT')
                click(page, f'#stage [data-act=pick][data-v="{v}"]', 200)
                click(page, '#bar [data-act=check]', 400)
            else:
                a = rnd(page)['answer']
                click(page, f'#stage [data-act=answer][data-n="{(a % 4) + 1}"]', 200)      # pick one, then change it
                if st(page)['phase'] != 'chosen':
                    problems.append(f'{tag}: a review tap should only pick the answer')
                click(page, f'#stage [data-act=answer][data-n="{a if ok else (a % 4) + 1}"]', 200)
                check(page, f'{tag} review {k + 1} picked')
                click(page, '#bar [data-act=check]', 1300)
            right += 1 if ok else 0
            s2 = st(page)
            if s2['phase'] != 'revealed' or s2['solo']['review']['lastRight'] != ok:
                problems.append(f'{tag}: review {k + 1} did not mark the answer right')
            if s2['solo']['cash'] != s['solo']['cash']:
                problems.append(f'{tag}: review changed the money')
            check(page, f'{tag} review {k + 1} revealed')
            if shots and k < 2: shot(page, shots / f'review-{k + 1}-b.png')
            go(page, 600)
    page.wait_for_timeout(400)
    if st(page)['screen'] != 'card':
        problems.append(f'{tag}: no results card at the end'); return
    check(page, f'{tag} card')
    if shots: shot(page, shots / 'end-3-card.png')
    check_card(page, tag, (right, len(misses)) if misses else None)
    if page.query_selector('#bar .btn.primary'):
        problems.append(f'{tag}: the finished card should not have a big button that closes it')


def solo_game(b, tag, w, h, theme, length, shots=None, extras=False):
    ctx, page = new_page(b, w, h, theme, tag)
    check(page, f'{tag} home')
    if shots: shot(page, shots / '00-home.png')
    click(page, '#go-solo', 300)                                    # tap 1
    check(page, f'{tag} solo setup')
    if shots: shot(page, shots / '01-setup.png')
    click(page, f'#solo-{length}', 500)                              # tap 2
    s = st(page)
    if not (s['screen'] == 'round' and s['solo']['practice']):
        problems.append(f'{tag}: two taps did not start the game with the practice question')
    solo_question(page, tag, 0, right=True, bet_k=1, shots=shots, name='02-practice')
    go(page, 500)                                                   # Start the real game
    if st(page)['solo']['practice']:
        problems.append(f'{tag}: practice did not end')
    n = 0
    for _ in range(60):
        s = st(page)
        scr = s['screen']
        if scr == 'round':
            n += 1
            r = rnd(page)
            right = n % 3 != 2
            if extras and n == 1:                                   # double tap: a fast second tap must not skip the answer screen
                click(page, f'#stage [data-act=answer][data-n="{r["answer"]}"]', 150)
                page.click('#bar [data-act=bet][data-k="0"]'); page.click('#bar .actions', position={'x': 5, 'y': 5}, force=True)
                page.keyboard.press('Enter'); page.wait_for_timeout(200)
                if st(page)['idx'] != s['idx'] or st(page)['phase'] != 'revealed':
                    problems.append(f'{tag}: a quick second tap skipped past the answer')
                page.wait_for_timeout(1200); go(page, 400)
                continue
            if extras and n == 3:                                   # reload mid-game, then Keep playing
                page.reload(); page.wait_for_timeout(700)
                if st(page)['screen'] != 'home' or not page.query_selector('[data-act=resume]'):
                    problems.append(f'{tag}: no Keep playing after a reload')
                check(page, f'{tag} resume')
                if shots: shot(page, shots / 'resume.png')
                click(page, '[data-act=resume]', 400)
                if st(page)['idx'] != s['idx'] or st(page)['solo']['cash'] != s['solo']['cash']:
                    problems.append(f'{tag}: Keep playing did not return to the same question and money')
            bet_k = 0 if r['final'] else n % 3                       # the final question bets it all
            solo_question(page, tag, n, right=right, bet_k=bet_k, shots=shots if (shots and (n <= 2 or r['final'])) else None,
                          name=f'q{n:02d}' + ('-last' if r['final'] else ''), keyboard=extras and n == 4)
            go(page, 450)
        elif scr == 'speed':
            solo_speed(page, tag, shots)
        elif scr in ('name', 'card'):
            break
    else:
        problems.append(f'{tag}: Solo game did not finish')
    s = st(page)
    planned = sum(1 for seg in s['playlist'] if seg['kind'] == 'round')
    asked = sum(1 for e in s['solo']['log'] if e['kind'] == 'q')
    if asked != planned:
        problems.append(f'{tag}: {asked} questions answered, {planned} planned')
    solo_end(page, tag, shots, skip_after=1 if extras else None)
    ctx.close()
    return n


# ---------------------------------------------------------------- every round in the bank
ALL_ROUNDS_JS = '''() => {
  const B = window.__oo.B, segs = [];
  B.economy.forEach(n => segs.push({kind:'round', desk:'economy', ref:n.id}));
  B.tradeSets.forEach(t => { segs.push({kind:'round', desk:'trade', part:'specialize', ref:t.id}); segs.push({kind:'round', desk:'trade', part:'terms', ref:t.id}); });
  B.tradeInput.forEach(n => segs.push({kind:'round', desk:'trade', part:'input', ref:n.id}));
  B.inventory.forEach(n => segs.push({kind:'round', desk:'inventory', ref:n.id}));
  B.double.forEach(n => segs.push({kind:'round', desk:'double', ref:n.id}));
  B.news.forEach(n => segs.push({kind:'round', desk:'news', ref:n.id}));
  segs.push({kind:'speed', desk:'flash', items: B.flash.map(f => f.id)});
  return segs; }'''


def coverage_class(b):
    ctx, page = new_page(b, 1366, 768, 'light', 'cover-class')
    class_setup(page, 6, 'full')
    click(page, '#bar [data-act=start]', 500)
    page.evaluate('() => { const s = window.__oo.state; s.playlist = (' + ALL_ROUNDS_JS + ')(); s.halfAfter = -1; window.__oo.enter(0); }')
    page.wait_for_timeout(400)
    for _ in range(80):
        s = st(page)
        if s['screen'] == 'round':
            r = rnd(page)
            name = f"{s['idx'] + 1:02d}-{r['desk']}-{r['id']}" + (f"-{r['part']}" if r['part'] else '')
            shot(page, OUT / 'cover-class' / f'{name}-a.png')
            check(page, f'cover class {name}')
            go(page, 250); go(page, 1500)
            click(page, '#tiles [data-act=tile][data-i="0"]')
            shot(page, OUT / 'cover-class' / f'{name}-b.png')
            check(page, f'cover class {name} revealed')
            go(page, 300)
        elif s['screen'] == 'speed':
            for k in range(len(s['playlist'][s['idx']]['items'])):
                go(page, 250)
                shot(page, OUT / 'cover-class' / f'speed-{k + 1:02d}.png')
                check(page, f'cover class speed {k + 1}')
                go(page, 250)
        elif s['screen'] == 'half':
            go(page, 300)
        else:
            break
    ctx.close()


def coverage_solo(b, w, h, theme, tag):
    ctx, page = new_page(b, w, h, theme, tag)
    click(page, '#go-solo', 300)
    click(page, '#solo-short', 400)
    click(page, '#bar [data-act=skipPractice]', 300)
    page.evaluate('() => { const s = window.__oo.state; s.playlist = (' + ALL_ROUNDS_JS + ')(); window.__oo.enter(0); }')
    page.wait_for_timeout(400)
    k = 0
    for _ in range(80):
        s = st(page)
        if s['screen'] == 'round':
            k += 1
            r = rnd(page)
            name = f"{s['idx'] + 1:02d}-{r['desk']}-{r['id']}" + (f"-{r['part']}" if r['part'] else '')
            right = k % 2 == 0
            solo_question(page, tag, k, right=right, bet_k=k % 3, name=name, graph=r['visual'] == 'ppc-points' or r['part'] == 'terms')
            shot(page, OUT / tag / f'{name}.png')
            go(page, 300)
        elif s['screen'] == 'speed':
            solo_speed(page, tag)
        else:
            break
    ctx.close()


# ---------------------------------------------------------------- screen tour for the visual check
TOUR_SEGS = '''[
    pick('news', n => n.id === 'gas'),
    pick('economy', n => n.visual === 'ppc-points'),
    pick('economy', n => n.visual === 'ppc-choice'),
    pick('economy', n => n.visual === 'ppc-table'),
    pick('economy', n => n.visual === 'ppc-straight'),
    pick('economy', n => n.visual === 'ppc-capital'),
    pick('economy', n => n.visual === 'ppc-trade'),
    pick('economy', n => n.visual === 'choices'),
    {kind:'round', desk:'trade', part:'specialize', ref:'setA'},
    {kind:'round', desk:'trade', part:'terms', ref:'setA'},
    {kind:'round', desk:'trade', part:'input', ref:'upland'},
    {kind:'speed', desk:'flash', items:['f1', 'f2', 'f11']},
    pick('inventory', n => n.id === 'jersey40'),
    pick('double', n => n.id === 'avocados'),
    Object.assign(pick('double', n => n.id === 'laptops'), {final: true})
  ]'''


def tour_playlist(page, half=None):
    """One question of every kind, a speed round, and a last question."""
    page.evaluate('''() => { const s = window.__oo.state, B = window.__oo.B;
      const pick = (desk, test) => { const it = B[desk].find(test); return {kind:'round', desk, ref: it.id}; };
      s.playlist = ''' + TOUR_SEGS + ';' + (f' s.halfAfter = {half};' if half is not None else '') + ' window.__oo.enter(0); }')
    page.wait_for_timeout(400)


def tour(b, size, w, h, theme):
    tag = f'tour {size} {theme}'
    d = OUT / 'tour' / f'{size}-{theme}'
    ctx, page = new_page(b, w, h, theme, tag)
    i = [0]

    def snap(name, scroll_ok=False):
        i[0] += 1
        check(page, f'{tag} {name}', scroll_ok)
        shot(page, d / f'{i[0]:03d}-{name}.png')

    # Solo
    snap('home')
    click(page, '#bar [data-act=rules]', 250); snap('home-help', True); click(page, '#modal button[data-act=close]')
    click(page, '#go-solo', 300); snap('solo-setup')
    click(page, '#solo-short', 400); snap('solo-practice-answer')
    click(page, '#stage [data-act=answer][data-n="1"]', 250); snap('solo-practice-bet')
    click(page, '#bar [data-act=bet][data-k="1"]', 1500); snap('solo-practice-revealed')
    go(page, 400)
    tour_playlist(page)
    n = 0
    for _ in range(40):
        s = st(page)
        if s['screen'] == 'round':
            n += 1
            r = rnd(page)
            name = f"solo-{r['desk']}-{r['visual'] or r['part'] or r['id']}" + ('-last' if r['final'] else '')
            snap(name + '-answer')
            if n == 1:
                click(page, '#bar [data-act=hint]', 250); snap(name + '-hint')
            wrong = n % 2 == 0
            click(page, f'#stage [data-act=answer][data-n="{(r["answer"] % 4) + 1 if wrong else r["answer"]}"]', 250)
            if n in (1, 2) or r['final']:
                snap(name + '-bet')
            opts = page.evaluate('() => window.__oo.betOptions().length')
            click(page, f'#bar [data-act=bet][data-k="{opts - 1}"]', 1500)
            snap(name + ('-wrong' if wrong else '-right'))
            go(page, 400)
        elif s['screen'] == 'speed':
            snap('solo-speed-intro'); go(page, 300)
            snap('solo-speed-ask')
            item = page.evaluate('() => { const s = window.__oo.state; return s.playlist[s.idx].items[s.speed.i]; }')
            ans = page.evaluate(f'() => window.__oo.B.flash.find(f => f.id === "{item}").answer')
            click(page, f'#stage [data-act=pick][data-v="{ans}"]', 300); snap('solo-speed-right'); go(page, 300)
            page.evaluate('() => window.__oo.timeout()'); page.wait_for_timeout(300); snap('solo-speed-timeout'); go(page, 300)
            item = page.evaluate('() => { const s = window.__oo.state; return s.playlist[s.idx].items[s.speed.i]; }')
            ans = page.evaluate(f'() => window.__oo.B.flash.find(f => f.id === "{item}").answer')
            click(page, f'#stage [data-act=pick][data-v="{"SLIDE" if ans == "SHIFT" else "SHIFT"}"]', 300); snap('solo-speed-wrong'); go(page, 300)
        else:
            break
    snap('solo-name')
    page.fill('#studentName', 'Maya Cohen'); page.wait_for_timeout(150); snap('solo-name-typed')
    click(page, '#nameForm button[type=submit]', 600)
    click(page, '#bar [data-act=rules]', 250); snap('solo-help', True); click(page, '#modal button[data-act=close]')
    k = 0
    for _ in range(40):
        s = st(page)
        if s['screen'] != 'review':
            break
        k += 1
        e = s['solo']['log'][s['solo']['review']['items'][s['solo']['review']['i']]]
        if k <= 2 or e['kind'] == 'speed':
            snap(f'solo-review-{k}-answer')
        if e['kind'] == 'speed':
            click(page, '#stage [data-act=pick][data-v="SHIFT"]', 200)
            click(page, '#bar [data-act=check]', 400)
        else:
            click(page, f'#stage [data-act=answer][data-n="{rnd(page)["answer"]}"]', 300)
            if k <= 2: snap(f'solo-review-{k}-picked')
            click(page, '#bar [data-act=check]', 1300)
        if k <= 2 or e['kind'] == 'speed':
            snap(f'solo-review-{k}-revealed')
        go(page, 400)
    snap('solo-card')
    click(page, '#bar [data-act=again]', 200); snap('solo-card-new-game-confirm')
    page.evaluate('() => localStorage.clear()')
    ctx.close()

    # Class
    ctx, page = new_page(b, w, h, theme, tag)
    class_setup(page, 6, 'quick')
    snap('class-setup')
    page.click('#moreOptions summary'); page.wait_for_timeout(150); snap('class-setup-more', True)
    click(page, '#bar [data-act=rules]', 250); snap('class-help', True); click(page, '#modal button[data-act=close]')
    click(page, '#bar [data-act=start]', 600)
    tour_playlist(page, half=4)
    for _ in range(60):
        s = st(page)
        if s['screen'] == 'round':
            r = rnd(page)
            name = f"class-{r['desk']}-{r['visual'] or r['part'] or r['id']}" + ('-last' if r['final'] else '')
            snap(name + '-thinking')
            if s['idx'] == 0:
                click(page, '#bar [data-act=tools]', 250); snap('class-teacher-tools', True); click(page, '#modal button[data-act=close]')
            go(page, 300); snap(name + '-hands')
            go(page, 1500)
            for t in range(0, 6, 2):
                click(page, f'#tiles [data-act=tile][data-i="{t}"]', 80)
            page.wait_for_timeout(600); snap(name + '-revealed')
            go(page, 400)
        elif s['screen'] == 'speed':
            snap('class-speed-ask'); go(page, 300)
            click(page, '#tiles [data-act=tile][data-i="1"]', 300); snap('class-speed-shown')
            for _k in range(len(s['playlist'][s['idx']]['items'])):
                st2 = st(page)
                if st2['screen'] != 'speed':
                    break
                if st2['speed']['phase'] == 'ask':
                    go(page, 250)
                go(page, 250)
        elif s['screen'] == 'half':
            snap('class-halfway'); go(page, 400)
        elif s['screen'] == 'results':
            page.wait_for_timeout(1200); snap('class-results'); break
        else:
            break
    ctx.close()


# ---------------------------------------------------------------- one Solo game for the understanding check
# A complete Short game: the same 8 questions and 4 speed sentences in the Short template's order, fixed so the
# understanding check sees the same screens every time. Every step gets a screenshot, with no gaps.
STORY_SEGS = """[
  {kind:'round', desk:'news', ref:'tacos'}, {kind:'round', desk:'economy', ref:'recession'}, {kind:'round', desk:'news', ref:'sneakers'},
  {kind:'round', desk:'trade', part:'specialize', ref:'setA'}, {kind:'speed', desk:'flash', items:['f1', 'f3', 'f2', 'f8']},
  {kind:'round', desk:'inventory', ref:'jersey40'}, {kind:'round', desk:'news', ref:'ramen'}, {kind:'round', desk:'double', ref:'avocados'},
  {kind:'round', desk:'double', ref:'icecream', final: true}]"""


def story(b):
    d = OUT / 'story'
    shutil.rmtree(d, ignore_errors=True)
    ctx, page = new_page(b, 1366, 768, 'light', 'story')
    i = [0]

    def snap(name, wait=0):
        if wait: page.wait_for_timeout(wait)
        page.mouse.move(2, 2)
        page.wait_for_timeout(250)
        i[0] += 1
        check(page, f'story {name}')
        shot(page, d / f'{i[0]:02d}.png')
        report.append(f'  story {i[0]:02d}.png  {name}')

    def question(name, pick, bet_k, hint=False):
        snap(f'{name}: answer')
        if hint:
            click(page, '#bar [data-act=hint]', 300); snap(f'{name}: hint shown')
        click(page, f'#stage [data-act=answer][data-n="{pick}"]', 300); snap(f'{name}: bet')
        click(page, f'#bar [data-act=bet][data-k="{bet_k}"]', 300)
        right = st(page)['solo']['last']['right']
        snap(f'{name}: {"right" if right else "wrong"}', 1500)
        go(page, 400)

    def speed(name, pick):
        snap(f'{name}: sentence')
        if pick is None:
            page.evaluate('() => window.__oo.timeout()'); page.wait_for_timeout(300)
        else:
            click(page, f'#stage [data-act=pick][data-v="{pick}"]', 300)
        L = st(page)['solo']['last']
        snap(f'{name}: {"out of time" if L["picked"] == "none" else "right" if L["right"] else "wrong"}', 1300)
        go(page, 400)

    snap('home')
    click(page, '#go-solo', 400); snap('solo setup')
    click(page, '#solo-short', 600)
    page.evaluate('() => { const s = window.__oo.state; s.playlist = ' + STORY_SEGS + '; }')
    question('practice', 1, 1)                                     # Start the real game is the go button
    page.wait_for_timeout(300)
    question('question 1', 4, 1, hint=True)
    question('question 2', 1, 0)                                   # wrong: Point 1
    question('question 3', 1, 2)
    question('question 4', 3, 1)
    snap('speed round: intro'); go(page, 400)
    speed('speed 1', 'SLIDE')
    speed('speed 2', None)                                         # out of time
    speed('speed 3', 'SLIDE')                                      # wrong
    speed('speed 4', 'SLIDE')
    question('question 5', 2, 1)
    question('question 6', 1, 1)                                   # wrong: thinks ramen is a normal good
    question('question 7', 1, 2)
    snap('final question: answer')
    click(page, '#stage [data-act=answer][data-n="4"]', 300); snap('final question: bet')
    click(page, '[data-act=bet][data-k="0"]', 300); snap('final question: confirm bet it all')
    click(page, '[data-act=bet][data-k="0"]', 300); snap('final question: right', 1500)
    go(page, 700); snap('name')
    page.fill('#studentName', 'Maya Cohen'); click(page, '#nameForm button[type=submit]', 600)
    for k in range(10):
        s = st(page)
        if s['screen'] != 'review':
            break
        e = s['solo']['log'][s['solo']['review']['items'][s['solo']['review']['i']]]
        snap(f'review {k + 1}: answer')
        if e['kind'] == 'speed':
            ans = page.evaluate(f'() => window.__oo.B.flash.find(f => f.id === "{e["item"]}").answer')
            click(page, f'#stage [data-act=pick][data-v="{ans}"]', 300)
            snap(f'review {k + 1}: picked')
            click(page, '#bar [data-act=check]', 300)
        else:
            click(page, f'#stage [data-act=answer][data-n="{rnd(page)["answer"]}"]', 300)
            snap(f'review {k + 1}: picked')
            click(page, '#bar [data-act=check]', 300)
        snap(f'review {k + 1}: right', 1300)
        go(page, 500)
    snap('results card', 1200)
    ctx.close()


# ---------------------------------------------------------------- run
with sync_playwright() as p:
    b = p.chromium.launch()
    if MODE in ('all', 'class'):
        class_game(b, 'class-full', 1366, 768, 'light', 5, 'full', shots=OUT / 'class-full')
        class_game(b, 'class-quick', 1280, 720, 'dark', 6, 'quick', shots=OUT / 'class-quick')
        class_game(b, 'class-phone', 390, 844, 'light', 4, 'quick')
        teacher_clicks(b)
    if MODE in ('all', 'solo'):
        n1 = solo_game(b, 'solo-long', 1366, 768, 'light', 'long', shots=OUT / 'solo-long', extras=True)
        n2 = solo_game(b, 'solo-medium', 1920, 1080, 'dark', 'medium', shots=OUT / 'solo-medium')
        n3 = solo_game(b, 'solo-short', 390, 844, 'dark', 'short', shots=OUT / 'solo-short')
        report.append(f'Solo games played to the end: long {n1}, medium {n2}, short {n3} questions, each with the practice question, speed round, name, results card and Review my misses')
    if MODE in ('all', 'cover'):
        coverage_class(b)
        coverage_solo(b, 1366, 768, 'light', 'cover-solo-laptop')
        coverage_solo(b, 390, 844, 'dark', 'cover-solo-phone')
    if MODE in ('all', 'tour'):
        for size, w, h in SIZES:
            for theme in ('light', 'dark'):
                tour(b, size, w, h, theme)
        report.append('Screen tour: ' + ', '.join(f'{s} {t}' for s, _, _ in SIZES for t in ('light', 'dark')) + f" ({len(list((OUT / 'tour').rglob('*.png')))} screenshots)")
    if MODE == 'phone':                                            # every phone check on its own (quicker to rerun)
        for theme in ('light', 'dark'):
            tour(b, 'phone', 390, 844, theme)
        solo_game(b, 'solo-short', 390, 844, 'dark', 'short', shots=OUT / 'solo-short')
        class_game(b, 'class-phone', 390, 844, 'light', 4, 'quick')
        coverage_solo(b, 390, 844, 'dark', 'cover-solo-phone')
    if MODE in ('all', 'story'):
        story(b)
    b.close()

for line in report:
    print(line)
print('CONSOLE ERRORS:', len(errors))
for e in errors[:40]: print('  ', e)
print('SCORING OR FLOW PROBLEMS:', len(problems))
for e in problems[:60]: print('  ', e)
print('LAYOUT OVERFLOWS:', len(overflow))
for e in overflow[:80]: print('  ', e)
print('TEXT PROBLEMS (too small, trading words, em dashes, do-line, main buttons):', len(textprobs))
for e in textprobs[:80]: print('  ', e)
print('Screenshots:', OUT)
if errors or problems or overflow or textprobs:
    print('CHECKS FAILED')
    sys.exit(1)
print('ALL CHECKS PASSED')
