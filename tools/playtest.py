"""Automated playtest for Open Outcry.

Plays a full game and a quick game in Class mode, renders every round in the bank (question and answer),
checks the money math after every reveal, and checks for console errors and layout overflow.
Screenshots go to screenshots/. Run `python3 build.py` first.

Setup:   python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/python -m playwright install chromium
Usage:   .venv/bin/python tools/playtest.py [all|flow|cover|phone|big]      (default: all)
Result:  prints ALL CHECKS PASSED and exits 0 when everything is clean, otherwise lists the problems and exits 1.

This was written for the Oct 7, 2026 version (Class mode only). Update it whenever the game flow changes.
"""
import math, shutil, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PAGE = (ROOT / 'dist' / 'index.html').as_uri()
OUT = ROOT / 'screenshots'
shutil.rmtree(OUT, ignore_errors=True)
OUT.mkdir(parents=True, exist_ok=True)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'
errors, problems, overflow = [], [], []


def attach(page, tag):
    page.on('console', lambda m: errors.append(f'[{tag}] console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror: {e}'))


def st(page):
    return page.evaluate('() => JSON.parse(JSON.stringify(window.__oo.state))')


def rnd(page):
    return page.evaluate('''() => { const s = window.__oo.state; const seg = s.playlist[s.idx];
      const r = window.__oo.roundFor(seg); return r ? {answer: r.answer, desk: r.desk, id: r.id || seg.ref, part: r.part || null,
      final: !!seg.final, event: seg.event || null} : null }''')


def press(page, wait=300):
    page.keyboard.press('ArrowRight')
    page.wait_for_timeout(wait)


def shot(page, name):
    page.screenshot(path=str(OUT / f'{name}.png'))


def check_fit(page, label, page_can_scroll=False):
    res = page.evaluate('''() => {
      const out = {};
      out.hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
      const cc = document.querySelector('.callcard'); if (cc) out.callcardOverflow = cc.scrollHeight - cc.clientHeight;
      const stg = document.querySelector('#stage'); out.stageOverflow = stg.scrollHeight - stg.clientHeight;
      const tk = document.querySelector('.ticket'); if (tk) out.ticketOverflow = tk.scrollHeight - tk.clientHeight;
      const g = document.querySelector('.ticket .graph'); if (g) out.graphH = Math.round(g.getBoundingClientRect().height);
      return out; }''')
    if page_can_scroll:
        res.pop('stageOverflow', None)
    bad = res.get('hscroll') or res.get('callcardOverflow', 0) > 2 or res.get('stageOverflow', 0) > 2 or res.get('ticketOverflow', 0) > 2 or (res.get('graphH') is not None and res['graphH'] < 150)
    if bad:
        overflow.append(f'{label}: {res}')


def js_round(x):
    return math.floor(x + 0.5)


def check_money(before, after, r):
    seg = before['playlist'][before['idx']]
    final = bool(seg.get('final'))
    ev = None if final else seg.get('event')
    upd, idx = before['updateAfter'], before['idx']
    afternoon = idx > upd if upd >= 0 else idx >= math.ceil(len(before['playlist']) / 2)
    chips = [1000, 2000, 4000] if afternoon else [500, 1000, 2000]
    mincash = min(t['cash'] for t in before['teams'])
    for i, t in enumerate(before['teams']):
        e, cash = before['entries'][i], t['cash']
        if not e['call']:
            exp = cash
        else:
            if final:
                risk = js_round(cash * [0, 25, 50, 75, 100][e['bet'] if e['bet'] is not None else 0] / 100 / 100) * 100
            else:
                risk = min(chips[(e['bet'] or 1) - 1], cash)
            if e['call'] == r['answer']:
                m = 2 if ev in ('bull', 'risky') else 1
                if ev == 'underdog' and cash == mincash:
                    m = 3
                exp = cash + risk * m
            else:
                exp = cash - min(risk * (2 if ev == 'risky' else 1), cash)
            if not final and exp <= 0:
                exp = 1000
        got = after['teams'][i]['cash']
        if got != exp:
            problems.append(f"round {idx + 1} {r['id']} team {i}: expected {exp}, got {got} (call {e['call']}, bet {e['bet']}, answer {r['answer']}, event {ev})")
        if after['teams'][i]['history'][-1] != got:
            problems.append(f'history mismatch round {idx + 1} team {i}')


def play_game(page, tag, length='full', teams=None, every_shot=False):
    page.goto(PAGE)
    page.wait_for_timeout(700)
    if teams:
        cur = st(page)['settings']['teamCount']
        while cur != teams:
            page.click('[data-act="teams%s"]' % ('+' if teams > cur else '-'))
            cur += 1 if teams > cur else -1
    if length == 'quick':
        page.click('#len-quick')
    shot(page, f'{tag}-00-lobby')
    check_fit(page, f'{tag} lobby', page_can_scroll=True)
    page.click('#setup button[type=submit]')
    page.wait_for_timeout(500)
    steps = 0
    while steps < 400:
        steps += 1
        s = st(page)
        scr = s['screen']
        if scr == 'round':
            seg, r = s['playlist'][s['idx']], rnd(page)
            name = f"{tag}-{s['idx'] + 1:02d}-{r['desk']}-{r['id']}"
            if every_shot or s['idx'] < 2 or r['final']:
                shot(page, name + '-a-intro')
            check_fit(page, name + ' intro')
            press(page, 600)                      # start the clock
            if s['idx'] == 0:
                shot(page, name + '-a2-clock')
            press(page, 1900)                     # flash now -> overlay -> sheet
            n = len(s['teams'])
            for i in range(n):
                if i == n - 1 and n >= 4 and not r['final']:
                    continue                      # last team skips (no trade)
                call = r['answer'] if i % 3 != 2 else (r['answer'] % 4) + 1
                page.click(f'#sheet [data-act=call][data-i="{i}"][data-n="{call}"]')
                bet = [0, 1, 2, 3, 4][i % 5] if r['final'] else (i % 3) + 1
                page.click(f'#sheet [data-act=bet][data-i="{i}"][data-n="{bet}"]')
            if every_shot or s['idx'] < 1 or r['final']:
                shot(page, name + '-b-entry')
            before = st(page)
            press(page, 1700)                     # reveal
            after = st(page)
            check_money(before, after, r)
            shot(page, name + '-c-revealed')
            check_fit(page, name + ' revealed')
            if r['desk'] == 'double':
                page.click('[data-act=case][data-n="1"]')
                page.wait_for_timeout(1500)
                shot(page, name + '-d-case2')
            press(page, 450)
        elif scr == 'flash':
            k = s['flash']['i']
            name = f"{tag}-{s['idx'] + 1:02d}-flash-{k + 1}"
            if not s['flash']['revealed']:
                if k == 0:
                    shot(page, name + '-a')
                check_fit(page, name)
                a = k % len(s['teams'])
                before = st(page)['teams'][a]['cash']
                page.click(f'[data-act=fl][data-i="{a}"][data-n="1"]')
                page.wait_for_timeout(250)
                if st(page)['teams'][a]['cash'] != before + 500:
                    problems.append(f'flash award wrong for team {a}')
                press(page, 450)
                if k < 2:
                    shot(page, name + '-b-revealed')
                check_fit(page, name + ' revealed')
            else:
                press(page, 350)
        elif scr == 'update':
            shot(page, f'{tag}-update')
            check_fit(page, f'{tag} update')
            press(page, 500)
        elif scr == 'bellIntro':
            shot(page, f'{tag}-bell')
            check_fit(page, f'{tag} bell')
            press(page, 500)
        elif scr == 'results':
            page.wait_for_timeout(1200)
            shot(page, f'{tag}-zz-results')
            break
    else:
        problems.append(f'{tag}: game did not finish')


def coverage(page, tag):
    """Render every round in the bank: intro and revealed."""
    page.goto(PAGE)
    page.wait_for_timeout(600)
    page.click('#setup button[type=submit]')
    page.wait_for_timeout(400)
    page.evaluate('''() => {
      const s = window.__oo.state, B = window.__oo.B, segs = [];
      B.economy.forEach(n => segs.push({kind:'round', desk:'economy', ref:n.id}));
      B.tradeSets.forEach(t => { segs.push({kind:'round', desk:'trade', part:'specialize', ref:t.id}); segs.push({kind:'round', desk:'trade', part:'terms', ref:t.id}); });
      B.tradeInput.forEach(n => segs.push({kind:'round', desk:'trade', part:'input', ref:n.id}));
      B.inventory.forEach(n => segs.push({kind:'round', desk:'inventory', ref:n.id}));
      B.double.forEach(n => segs.push({kind:'round', desk:'double', ref:n.id}));
      B.news.forEach(n => segs.push({kind:'round', desk:'news', ref:n.id}));
      segs.push({kind:'flash', desk:'flash', items: B.flash.map(f => f.id)});
      segs[1].event = 'insider'; segs[2].event = 'bull'; segs[9].event = 'underdog';
      s.playlist = segs; s.updateAfter = -1;
      window.__oo.enter(0);
    }''')
    page.wait_for_timeout(400)
    while True:
        s = st(page)
        if s['screen'] == 'round':
            r = rnd(page)
            name = f"{tag}-{s['idx'] + 1:02d}-{r['desk']}-{r['id']}" + (f"-{r['part']}" if r['part'] else '')
            shot(page, name + '-a-intro')
            check_fit(page, name + ' intro')
            press(page, 300)
            press(page, 1800)
            page.click(f'#sheet [data-act=call][data-i="0"][data-n="{r["answer"]}"]')
            page.click(f'#sheet [data-act=call][data-i="1"][data-n="{(r["answer"] % 4) + 1}"]')
            press(page, 1700)
            shot(page, name + '-c-revealed')
            check_fit(page, name + ' revealed')
            press(page, 400)
        elif s['screen'] == 'flash':
            k = s['flash']['i']
            if not s['flash']['revealed']:
                press(page, 400)
                shot(page, f"{tag}-flash-{s['flash']['i'] + 1:02d}")
                check_fit(page, f"{tag} flash {k + 1}")
            else:
                press(page, 300)
        elif s['screen'] in ('update', 'bellIntro'):
            press(page, 400)
        else:
            break


with sync_playwright() as p:
    b = p.chromium.launch()
    if MODE in ('all', 'flow'):
        ctx = b.new_context(viewport={'width': 1366, 'height': 768}, color_scheme='light')
        page = ctx.new_page(); attach(page, 'flow-full')
        play_game(page, 'full', 'full', teams=5)
        ctx.close()
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}, color_scheme='dark')
        page = ctx.new_page(); attach(page, 'flow-quick')
        play_game(page, 'quick', 'quick', teams=6)
        ctx.close()
    if MODE in ('all', 'cover'):
        ctx = b.new_context(viewport={'width': 1366, 'height': 768}, color_scheme='light')
        page = ctx.new_page(); attach(page, 'cover')
        coverage(page, 'cov')
        ctx.close()
    if MODE in ('all', 'phone'):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme='light', device_scale_factor=2, is_mobile=True, has_touch=True)
        page = ctx.new_page(); attach(page, 'phone')
        page.goto(PAGE); page.wait_for_timeout(700)
        shot(page, 'phone-lobby')
        page.screenshot(path=str(OUT / 'phone-lobby-full.png'), full_page=True)
        page.click('#setup button[type=submit]'); page.wait_for_timeout(500)
        shot(page, 'phone-round-intro')
        press(page, 300); press(page, 1800)
        shot(page, 'phone-entry')
        page.click('#sheet [data-act=call][data-i="0"][data-n="1"]')
        press(page, 1700)
        shot(page, 'phone-revealed')
        hs = page.evaluate('() => document.documentElement.scrollWidth > window.innerWidth + 1')
        if hs: overflow.append('phone: horizontal scroll')
        ctx.close()
    if MODE in ('all', 'big'):
        ctx = b.new_context(viewport={'width': 1920, 'height': 1080}, color_scheme='dark')
        page = ctx.new_page(); attach(page, 'big')
        page.goto(PAGE); page.wait_for_timeout(700)
        shot(page, 'big-lobby')
        page.click('#setup button[type=submit]'); page.wait_for_timeout(500)
        press(page, 300); press(page, 1800)
        page.click('#sheet [data-act=call][data-i="0"][data-n="1"]')
        press(page, 1700)
        shot(page, 'big-revealed')
        ctx.close()
    b.close()

print('CONSOLE ERRORS:', len(errors))
for e in errors[:40]: print('  ', e)
print('SCORING OR FLOW PROBLEMS:', len(problems))
for e in problems[:40]: print('  ', e)
print('LAYOUT OVERFLOWS:', len(overflow))
for e in overflow[:80]: print('  ', e)
print('Screenshots:', OUT)
if errors or problems or overflow:
    print('CHECKS FAILED')
    sys.exit(1)
print('ALL CHECKS PASSED')
