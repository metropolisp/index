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
// navbar height so headers are not hidden behind it.
function scrollToHash(hash) {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target) {
        const rect = target.getBoundingClientRect();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        // add a few pixels so header isn't flush against the bar
        const extra = 10;
        const top = window.scrollY + rect.top - navHeight - extra;
        window.scrollTo({ top, behavior: 'smooth' });
        markActive(hash);
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
            const extra = 10; // gap below navbar
            const top = window.scrollY + rect.top - navHeight - extra;
            window.scrollTo({ top, behavior: 'smooth' });
            markActive(href);
        }
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

// filter page content based on query; hides sections that don't match
function filterPage(query) {
    const lower = query.toLowerCase();
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => {
        const text = sec.textContent.toLowerCase();
        if (text.includes(lower) || query === '') {
            sec.style.display = '';
        } else {
            sec.style.display = 'none';
        }
    });
    // also hide/truncate TOC entries so sidebar stays in sync
    const tocItems = document.querySelectorAll('#toc li');
    tocItems.forEach(li => {
        const text = li.textContent.toLowerCase();
        if (text.includes(lower) || query === '') {
            li.style.display = '';
        } else {
            li.style.display = 'none';
        }
    });
}

// wire up search input if present
function initPageSearch() {
    const input = document.getElementById('page-search');
    if (!input) return;
    input.addEventListener('input', () => {
        filterPage(input.value);
    });
}

// perform initial setup when page loads
window.addEventListener('load', () => {
    splitHeadingNumber();
    adjustToc();
    initPageSearch();
    updateNavHeightVar();
    scrollToHash(location.hash);
});

// keep nav height variable up to date on resize
window.addEventListener('resize', updateNavHeightVar);