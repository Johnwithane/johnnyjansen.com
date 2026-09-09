// Mobile menu toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav')) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Career timeline navigation - DISABLED ON MOBILE
document.addEventListener('DOMContentLoaded', function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Skip career timeline functionality entirely on mobile
    if (isMobile) {
        const careerSection = document.getElementById('career');
        if (careerSection) {
            careerSection.style.display = 'none'; // Just hide it
        }
        return;
    }
    
    // Desktop-only career timeline code below
    const careerSection = document.getElementById('career');
    
    function showCareerOnly() {
        document.querySelectorAll('.section:not(#career)').forEach(section => {
            section.style.display = 'none';
        });
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
        careerSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function showAllSections(targetHash) {
        document.querySelectorAll('.section:not(#career)').forEach(section => {
            section.style.display = 'block';
        });
        document.querySelector('.hero').style.display = 'flex';
        document.querySelector('footer').style.display = 'block';
        careerSection.style.display = 'none';
        
        if (targetHash) {
            setTimeout(() => {
                const target = document.querySelector(targetHash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }
    
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a[href^="#"], button');
        if (!target) return;
        
        const href = target.getAttribute('href') || target.getAttribute('data-section');
        if (!href) return;
        
        let targetHash = href.startsWith('#') ? href : '#' + href;
        
        if (targetHash === '#career' || href.includes('career')) {
            e.preventDefault();
            e.stopPropagation();
            showCareerOnly();
            window.history.pushState({ page: 'career' }, '', '#career');
            return;
        }
        
        if (careerSection.style.display === 'block' && targetHash !== '#career') {
            e.preventDefault();
            e.stopPropagation();
            showAllSections(targetHash);
            window.history.pushState({ page: 'home' }, '', targetHash);
        }
    }, true);
    
    document.querySelector('.logo').addEventListener('click', function(e) {
        if (careerSection.style.display === 'block') {
            e.preventDefault();
            showAllSections('#home');
            window.history.pushState({ page: 'home' }, '', '#home');
        }
    });
    
    window.addEventListener('popstate', function() {
        if (window.location.hash === '#career') {
            showCareerOnly();
        } else {
            showAllSections(window.location.hash || '#home');
        }
    });
    
    if (window.location.hash === '#career') {
        showCareerOnly();
    }
});