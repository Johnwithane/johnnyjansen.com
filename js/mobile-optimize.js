// js/mobile-optimize.js - Aggressive iframe lazy loading for mobile

(function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (!isMobile) return; // Desktop doesn't need this optimization
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
        
        // 1. CONVERT ALL IFRAMES TO LAZY LOAD
        const iframes = document.querySelectorAll('iframe[src]');
        iframes.forEach(iframe => {
            const src = iframe.getAttribute('src');
            iframe.setAttribute('data-src', src);
            iframe.removeAttribute('src'); // Critical: remove src completely
        });
        
        // 2. INTERSECTION OBSERVER - only load when scrolling near
        const iframeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const iframe = entry.target;
                
                if (entry.isIntersecting) {
                    // Load iframe when it comes into view
                    const src = iframe.getAttribute('data-src');
                    if (src && !iframe.src) {
                        iframe.src = src;
                    }
                } else {
                    // CRITICAL FOR MEMORY: Unload iframe when it scrolls far away
                    if (iframe.src && entry.intersectionRatio === 0) {
                        // Only unload if completely out of view
                        const rect = iframe.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        
                        // If more than 2 viewports away, unload it
                        if (Math.abs(rect.top) > viewportHeight * 2) {
                            iframe.setAttribute('data-src', iframe.src);
                            iframe.src = '';
                        }
                    }
                }
            });
        }, {
            rootMargin: '300px', // Start loading 300px before visible
            threshold: 0
        });
        
        // Observe all iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            iframeObserver.observe(iframe);
        });
        
        // 3. REDUCE VIDEO SERIES TO 3 ITEMS ON MOBILE (optional but recommended)
        const seriesScrolls = document.querySelectorAll('.series-scroll');
        seriesScrolls.forEach(scroll => {
            const items = scroll.querySelectorAll('.series-video-item');
            if (items.length > 3) {
                items.forEach((item, index) => {
                    if (index > 2) {
                        item.remove(); // Remove excess items from DOM completely
                    }
                });
            }
        });
        
        console.log('Mobile optimizations applied - iframes will lazy load');
    });
    
})();