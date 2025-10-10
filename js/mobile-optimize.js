// js/mobile-optimize.js - Add this new file and include it FIRST in index.html

(function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (!isMobile) return; // Skip all optimizations on desktop
    
    // 1. AGGRESSIVE IFRAME LAZY LOADING
    const iframeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const iframe = entry.target;
                const src = iframe.getAttribute('data-src');
                
                if (src && !iframe.src) {
                    iframe.src = src;
                }
            } else {
                // Unload iframes that scroll out of view to free memory
                const iframe = entry.target;
                if (iframe.src) {
                    iframe.setAttribute('data-src', iframe.src);
                    iframe.src = '';
                }
            }
        });
    }, {
        rootMargin: '200px', // Load slightly before visible
        threshold: 0.1
    });
    
    // Convert all iframes to lazy load on mobile
    document.addEventListener('DOMContentLoaded', () => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src) {
                iframe.setAttribute('data-src', src);
                iframe.removeAttribute('src'); // Remove src completely
                iframeObserver.observe(iframe);
            }
        });
        
        // 2. DISABLE ANIMATIONS ON MOBILE
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .orb { display: none !important; }
                .noise-overlay { display: none !important; }
                .hero-grid { display: none !important; }
                * { animation: none !important; transition: none !important; }
            }
        `;
        document.head.appendChild(style);
        
        // 3. REDUCE VIDEO SERIES TO SHOW FEWER ITEMS
        const seriesScrolls = document.querySelectorAll('.series-scroll');
        seriesScrolls.forEach(scroll => {
            const items = scroll.querySelectorAll('.series-video-item');
            // Only keep first 3 videos visible, remove rest from DOM
            items.forEach((item, index) => {
                if (index > 2) {
                    item.remove();
                }
            });
        });
        
        // 4. SIMPLIFY GRID RENDERING
        const sampleVideos = document.querySelectorAll('.sample-videos');
        sampleVideos.forEach(grid => {
            grid.style.gridTemplateColumns = '1fr'; // Force single column
        });
        
        // 5. DISABLE PARALLAX AND TRANSFORMS
        window.addEventListener('scroll', (e) => {
            e.stopPropagation();
        }, { passive: true, capture: true });
    });
    
    // 6. MEMORY CLEANUP
    let cleanupInterval = setInterval(() => {
        const iframes = document.querySelectorAll('iframe[src=""]');
        if (iframes.length > 5) {
            // Force garbage collection hint
            if (window.gc) window.gc();
        }
    }, 10000); // Every 10 seconds
    
})();