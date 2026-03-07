let lastActiveSection = null;

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const navHeight = navbar ? navbar.offsetHeight : 0;
    // always keep the nav "sticky" on manual pages so logo/back-to-top are
    // visible; also guard against missing hero element (manual has none).
    if (navbar && navbar.classList.contains('manual')) {
        navbar.classList.add('sticky');
    } else if (!hero || window.scrollY > hero.offsetHeight) {
        navbar && navbar.classList.add('sticky');
    } else {
        navbar && navbar.classList.remove('sticky');
    }

    // scrollspy: determine which section is currently under the navbar
    const sections = document.querySelectorAll('section[id]');
    let active = null;
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navHeight + 5 && rect.bottom > navHeight + 5) {
            active = section;
        }
    });

    if (active && active !== lastActiveSection) {
        const id = active.getAttribute('id');
        const link = document.querySelector('.nav-links a[href*="#' + id + '"]');
        if (link) {
            // center newly active item (horizontal only)
            scrollNavLinkIntoView(link);
            // update classes
            document.querySelectorAll('.nav-links a.active').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
        // update sidebar TOC visibility/highlight as well
        const tocLink = document.querySelector('#toc a[href*="#' + id + '"]');
        if (tocLink) {
            // ensure the active entry remains in view vertically
            tocLink.scrollIntoView({ block: 'center', behavior: 'smooth' });
            document.querySelectorAll('#toc a.active').forEach(l => l.classList.remove('active'));
            tocLink.classList.add('active');
        }
        lastActiveSection = active;
    }
}

window.addEventListener('scroll', () => {
    handleScroll();
    // recalc padding after sticky state may have changed
    updateNavHeightVar();
});
// run once on load in case the page is already scrolled or a hash is present
window.addEventListener('load', () => {
    handleScroll();
    updateNavHeightVar();
});

// adjust the CSS variables whenever the window size changes, since the
// navbar (and occasionally the search bar) may wrap to a different
// height. this mirrors the behaviour on scroll and ensures fixed elements
// like the manual sidebar stay in the correct position.
window.addEventListener('resize', updateNavHeightVar);

    // the "accept" button only exists on the quickstart page; guard
    // against its absence so the script can run everywhere (otherwise a
    // null reference aborts execution and nav click handlers never get
    // attached).
    const acceptBtn = document.getElementById('accept-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            const quick = document.getElementById('quickstart-content');
            if (quick) quick.style.display = 'block';
            acceptBtn.style.display = 'none';
            // show accepted message and extra warning in disclaimer
            const msg = document.getElementById('accepted-msg');
            const warn = document.getElementById('post-accept-warning');
            if(msg) { msg.style.display = 'inline'; }
            if(warn) { warn.style.display = 'inline'; }
        });
    }

// helper that scrolls the horizontal nav container only, avoiding
// any vertical scroll that can conflict with Firefox's sticky nav
function scrollNavLinkIntoView(link) {
    const container = link.closest('.nav-links');
    if (!container) return;
    const linkRect = link.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const offset = linkRect.left - contRect.left - (contRect.width - linkRect.width) / 2;
    container.scrollBy({ left: offset, behavior: 'smooth' });
}

// update the active link visually; called from scroll/hash handlers
function markActive(href) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href')===href));
    const current = document.querySelector(`.nav-links a[href="${href}"]`);
    if (current) scrollNavLinkIntoView(current);
}

// helper to scroll to a hashed element. sections already have a
// scroll-margin-top rule so the navbar doesn't cover them; this works
// reliably in both Chrome and Firefox. do not use scrollIntoView on the
// page itself because Firefox has exhibited bugs where subsequent
// history.pushState or nav-link scrolling cancels the movement. calculating
// the top coordinate and using window.scrollTo is more predictable. subtract
// navbar height so headers are not hidden behind it. also center the
// element vertically and apply a temporary highlight animation.
function scrollToHash(hash) {
    if (!hash) return;
    // use getElementById since selector syntax can't handle characters like
    // ':' or '@' that appear in the manual's generated IDs
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    const target = document.getElementById(id);
    if (target) {
        const rect = target.getBoundingClientRect();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const searchHeight = document.querySelector('.page-search')?.offsetHeight || 0;
        // add a few pixels so header isn't flush against the bar
        const extra = 10;
        const top = window.scrollY + rect.top - navHeight - searchHeight - extra;
        window.scrollTo({ top, behavior: 'smooth' });
        markActive('#' + id);
        // also update the sidebar active class (scrollspy handles this on
        // scroll but when triggered programmatically we do it here as well)
        const tocLink = document.querySelector('#toc a[href*="#' + id + '"]');
        if (tocLink) {
            document.querySelectorAll('#toc a.active').forEach(l => l.classList.remove('active'));
            tocLink.classList.add('active');
        }
        // flash effect
        target.classList.add('highlighted');
        setTimeout(() => {
            target.classList.remove('highlighted');
        }, 3000); // animation defined to last ~3s total
    }
}

// attach click listeners that directly scroll the target into view.
// this avoids hashchange/offset issues in Firefox, but also guards against
// the navigation being cancelled by our own scrollspy code. we compute a
// raw `top` and call window.scrollTo, then update the hash via history API.
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            const rect = target.getBoundingClientRect();
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const searchHeight = document.querySelector('.page-search')?.offsetHeight || 0;
            const extra = 10; // gap below bars
            const top = window.scrollY + rect.top - navHeight - searchHeight - extra;
            window.scrollTo({ top, behavior: 'smooth' });
            markActive(href);
        }
        if (location.hash !== href) {
            history.pushState(null, '', href);
        }
    });
});

// also handle clicks inside the manual sidebar so anchors respect the
// fixed header/filter height and we can highlight the active entry. the
// default browser behaviour jumps without offset, which caused the issue
// described.
const tocLinks = document.querySelectorAll('#toc a[href^="#"]');
tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        // reuse scrollToHash which already handles offset and highlighting
        scrollToHash(href);
        if (location.hash !== href) {
            history.pushState(null, '', href);
        }
    });
});

// wrap numeric prefixes in manual headings so the number can be
// styled separately (positioned left of the yellow divider).  This
// operates on any h2> a text of the form "<digits> <title>" and is
// safe to run on non‑manual pages where no such pattern exists.
function splitHeadingNumber() {
    const anchors = document.querySelectorAll('h2 > a');
    anchors.forEach(a => {
        const text = a.textContent.trim();
        const m = text.match(/^(\d+)\s+(.*)$/);
        if (m) {
            const num = m[1];
            const title = m[2];
            // avoid doing it twice if script runs again
            if (a.querySelector('.num')) return;
            const span = document.createElement('span');
            span.className = 'num';
            if (num.length === 1) span.classList.add('single');
            else if (num.length > 1) span.classList.add('multi');
            span.textContent = num;
            a.innerHTML = ''; // clear before appending
            a.appendChild(span);
            a.insertAdjacentText('beforeend', ` ${title}`);
        }
    });
}

// adjust the table-of-contents entries in the same way: wrap the numeric
// prefix in its own span so CSS can add a leading zero (or reposition it).
function adjustToc() {
    const items = document.querySelectorAll('#toc li a');
    items.forEach(a => {
        const text = a.textContent.trim();
        const m = text.match(/^(\d+)\s+(.*)$/);
        if (m) {
            const num = m[1];
            const title = m[2];
            if (a.querySelector('.tocnum')) return;
            const spanNum = document.createElement('span');
            spanNum.className = 'tocnum';
            if (num.length === 1) spanNum.classList.add('single');
            else if (num.length > 1) spanNum.classList.add('multi');
            spanNum.textContent = num;
            const spanText = document.createElement('span');
            spanText.className = 'toctext';
            spanText.textContent = ' ' + title;
            a.innerHTML = '';
            a.appendChild(spanNum);
            a.appendChild(spanText);
        }
    });
}

// keep a CSS variable updated with the navbar's height so that the
// page-search element (and body padding) can position itself below the
// fixed header. this runs on load and resize.
function updateNavHeightVar() {
    const nav = document.querySelector('.navbar');
    const search = document.querySelector('.page-search');
    if (!nav) return;
    const navH = nav.offsetHeight;
    document.documentElement.style.setProperty('--nav-height', navH + 'px');
    let total = 0;
    // only add padding when the navbar is fixed (sticky or manual); on the
    // homepage before scrolling we want the hero to start at the top of the
    // page, so no extra offset is needed until the bar pins to the viewport.
    if (nav.classList.contains('sticky') || nav.classList.contains('manual')) {
        total += navH;
    }
    if (search) {
        const searchH = search.offsetHeight;
        document.documentElement.style.setProperty('--search-height', searchH + 'px');
        total += searchH;
    }
    // set body padding so content starts below navbar + search bar when
    // the header is fixed; otherwise remove any padding that might have
    // been applied earlier.
    document.body.style.paddingTop = total + 'px';
}

// compute an absolute base path for the manual. Hugo attempts to
// populate window.MANUAL_BASE via a script tag, but that value may be
// relative to the current page and can be lost on the filter page. we
// also expose `window.ozuRoot` from the layout which reflects the site
// root (including any baseURL prefix such as `/index/ozu`). prefer that
// value if present; otherwise fall back to reconstructing from the
// current pathname just like before.
function getManualBase() {
    if (window.MANUAL_BASE) return window.MANUAL_BASE;
    // use the site root if Hugo provided it
    if (window.ozuRoot) {
        // the value may be an absolute URL or just a path; coerce to a
        // pathname so any host/port are discarded. the trailing slash is
        // removed so we can append `/manual/` consistently.
        let root = window.ozuRoot;
        try {
            const u = new URL(root, window.location.origin);
            root = u.pathname;
        } catch (err) {
            // if URL parsing fails, just treat the string as a path
        }
        root = root.replace(/\/$/, '');
        return root + '/manual/';
    }

    const url = new URL(window.location.href);
    const parts = url.pathname.split('/manual');
    return parts[0].replace(/\/$/, '') + '/manual/';
}

// take you to a results page when the user hits Enter on the search box.
// the results page itself will perform the actual lookup in generated.html.
function handleSearchSubmit(query) {
    if (!query) return;
    const base = getManualBase();
    // always navigate via an absolute path so we don't lose any prefix
    // that might have been stripped by the dev server or the current
    // pathname (e.g. `/manual/filter/` on the results page).
    window.location.href = base + 'filter/?q=' + encodeURIComponent(query);
}

// on the filter page, fetch the generated manual HTML, parse it, and
// build a list of matching elements. the results are placed into
// #search-results container; the manual text itself is never rendered.
function generateSearchResults(query) {
    const container = document.getElementById('search-results');
    if (!container || !query) return;
    // helper: escape a string so it can be used literally in a regex
    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // allow quoted terms for exact-word searching ("red" or 'red')
    let exact = false;
    let term = query;
    if ((term.startsWith('"') && term.endsWith('"')) || (term.startsWith("'") && term.endsWith("'"))) {
        exact = true;
        term = term.slice(1, -1);
    }
    const lc = term.toLowerCase();
    // the header will be filled once we know how many results we found
    container.innerHTML = '';
    // fetch the static manual HTML and parse it
    fetch(getManualBase() + 'generated.html')
        .then(resp => resp.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const elements = doc.querySelectorAll('h2, p');
            let results = [];
            let lastHeading = null;
            elements.forEach(el => {
                if (el.tagName.toLowerCase().startsWith('h')) {
                    lastHeading = el;
                }
                const text = el.textContent.toLowerCase();
                let matched = false;
                if (exact) {
                    // match the term as a standalone word
                    const wordRe = new RegExp('\\b' + escapeRegExp(lc) + '\\b');
                    if (wordRe.test(text)) matched = true;
                } else {
                    if (text.includes(lc)) matched = true;
                }
                if (matched) {
                    results.push({heading: lastHeading, element: el});
                }
            });
            // add header with count, styling term and quotes separately
            const cleaned = term; // query stripped of surrounding quotes
            const prefixHtml = '<span class="search-header-prefix">Search results for</span> ';
            const termHtml = '<span class="search-header-term">' + cleaned + '</span>';
            // outer quotes always black; inner straight quotes yellow if user quoted
            const outerLeft = '<span class="search-header-quote">“</span>';
            const outerRight = '<span class="search-header-quote">”</span>';
            let innerQuote = '';
            if (exact) {
                innerQuote = '<span class="search-header-quote-yellow">"</span>';
            }
            const header = '<h2>' + prefixHtml +
                           outerLeft +
                           innerQuote +
                           termHtml +
                           innerQuote +
                           outerRight +
                           ' <span class="search-header-paren">(</span>' +
                           '<span class="search-header-number">' + results.length + '</span>' +
                           '<span class="search-header-paren">)</span></h2>';
            container.innerHTML = header;
            if (results.length === 0) {
                container.innerHTML += '<p><em>No matches found.</em></p>';
                return;
            }
            results.forEach(r => {
                const div = document.createElement('div');
                const link = document.createElement('a');
                // look for an inner anchor in the element or its heading for href
                let href = null;
                [r.element, r.heading].forEach(el => {
                    if (!href && el) {
                        const a = el.querySelector('a[href^="#"]');
                        if (a) {
                            href = a.getAttribute('href');
                        }
                    }
                });
                if (href) {
                    link.href = getManualBase() + href;
                }
                // use the matched element's own text as the link label (trimmed)
                let label = r.element.textContent.trim();
                if (label.length > 100) {
                    label = label.slice(0, 100) + '…';
                }
                // highlight the query within the label; keep case but wrap
                // matching portion in a red span.
                let highlightRe;
                if (exact) {
                    highlightRe = new RegExp('\\b(' + escapeRegExp(term) + ')\\b', 'gi');
                } else {
                    highlightRe = new RegExp('(' + escapeRegExp(term) + ')', 'gi');
                }
                const highlighted = label.replace(highlightRe, '<span class="highlight-yellow">$1</span>');
                link.innerHTML = highlighted;
                div.appendChild(link);
                container.appendChild(div);
            });
        })
        .catch(err => {
            container.innerHTML += '<p><em>Error loading manual for search.</em></p>';
            console.error('search fetch failed', err);
        });
}

// wire up search input if present
function initPageSearch() {
    const input = document.getElementById('page-search');
    if (!input) return;
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchSubmit(input.value.trim());
        }
    });
}

// perform initial setup when page loads
window.addEventListener('load', () => {
    splitHeadingNumber();
    adjustToc();
    initPageSearch();
    updateNavHeightVar();
    // if we're on the filter page and a query exists, show results
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && document.getElementById('search-results')) {
        generateSearchResults(q);
    }
    scrollToHash(location.hash);
});

// keep nav height variable up to date on resize
window.addEventListener('resize', updateNavHeightVar);