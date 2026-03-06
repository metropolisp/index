window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    if (window.scrollY > hero.offsetHeight) {
        navbar.classList.add('sticky');
    } else {
        navbar.classList.remove('sticky');
    }

    // scrollspy: highlight nav link for current section
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 80; // offset a bit for header height
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector('.nav-links a[href*="#' + id + '"]');
        if (scrollPos >= top && scrollPos < top + height) {
            if (link) link.classList.add('active');
        } else {
            if (link) link.classList.remove('active');
        }
    });
});

    document.getElementById('accept-btn').addEventListener('click', () => {
        document.getElementById('quickstart-content').style.display = 'block';
        document.getElementById('accept-btn').style.display = 'none';
        // show accepted message and extra warning in disclaimer
        const msg = document.getElementById('accepted-msg');
        const warn = document.getElementById('post-accept-warning');
        if(msg) { msg.style.display = 'inline'; }
        if(warn) { warn.style.display = 'inline'; }
    });