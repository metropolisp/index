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

window.addEventListener('scroll', handleScroll);
// run once on load in case the page is already scrolled or a hash is present
window.addEventListener('load', handleScroll);

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
// the top coordinate and using window.scrollTo is more predictable.
function scrollToHash(hash) {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target) {
        const rect = target.getBoundingClientRect();
        const top = window.scrollY + rect.top;
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
            const top = window.scrollY + rect.top;
            window.scrollTo({ top, behavior: 'smooth' });
            markActive(href);
        }
        if (location.hash !== href) {
            history.pushState(null, '', href);
        }
    });
});

// perform initial scroll if page loads with a hash
window.addEventListener('load', () => scrollToHash(location.hash));