// Lazy load section background videos
(function() {
    const isMobile = window.innerWidth <= 768;
    
    // Remove desktop-only videos on mobile
    if (isMobile) {
        document.querySelectorAll('[data-desktop-only]').forEach(el => el.remove());
        return;
    }

    const videos = document.querySelectorAll('[data-lazy-video]');
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                const src = video.getAttribute('data-src');
                
                if (src && !video.src) {
                    const source = document.createElement('source');
                    source.src = src;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    video.load();
                    video.play().catch(() => {}); // Silently handle autoplay failures
                }
            } else {
                // Pause video when out of view to save resources
                entry.target.pause();
            }
        });
    }, {
        rootMargin: '100px' // Start loading slightly before in view
    });

    videos.forEach(video => videoObserver.observe(video));
})();