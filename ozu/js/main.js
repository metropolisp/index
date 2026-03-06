let lastActiveSection = null;

function handleScroll() {
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const navHeight = navbar ? navbar.offsetHeight : 0;
    if (window.scrollY > hero.offsetHeight) {
        navbar.classList.add('sticky');
    } else {
        navbar.classList.remove('sticky');
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
            // center newly active item
            link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
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

    document.getElementById('accept-btn').addEventListener('click', () => {
        document.getElementById('quickstart-content').style.display = 'block';
        document.getElementById('accept-btn').style.display = 'none';
        // show accepted message and extra warning in disclaimer
        const msg = document.getElementById('accepted-msg');
        const warn = document.getElementById('post-accept-warning');
        if(msg) { msg.style.display = 'inline'; }
        if(warn) { warn.style.display = 'inline'; }
    });

// ensure nav links scroll the page and themselves correctly on first click
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            // compute vertical position with offset to account for sticky navbar
            const navbar = document.querySelector('.navbar');
            const navHeight = navbar ? navbar.offsetHeight : 0;
            const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight - 10;
            window.scrollTo({ top: targetY, behavior: 'smooth' });
            // update the hash without jumping immediately
            history.pushState(null, '', href);
            // center this link in the horizontal nav container
            this.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
            // mark active immediately
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        }
    });
});