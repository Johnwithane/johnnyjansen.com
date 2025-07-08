/* ===================================
   MAIN APPLICATION LOGIC
   ================================== */

class PortfolioApp {
  constructor() {
    this.isLoaded = false;
    this.currentSection = null;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupPerformanceOptimizations();
    this.setupErrorHandling();
  }
  
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
    
    // Handle scroll for performance tracking
    window.addEventListener('scroll', this.throttle(() => {
      this.updateScrollPosition();
    }, 16)); // ~60fps
    
    // Handle visibility change for video pause/play
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }
  
  
  setupPerformanceOptimizations() {
    // Lazy load videos when they come into view
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target.querySelector('iframe');
          if (iframe && !iframe.src) {
            const dataSrc = iframe.getAttribute('data-src');
            if (dataSrc) {
              iframe.src = dataSrc;
            }
          }
        }
      });
    }, { threshold: 0.1 });
    
    // Observe video containers
    document.querySelectorAll('.video-embed').forEach(container => {
      videoObserver.observe(container);
    });
  }
  
  setupErrorHandling() {
    // Global error handler for iframe loading issues
    window.addEventListener('error', (e) => {
      if (e.target.tagName === 'IFRAME') {
        const container = e.target.closest('.video-embed, .remoose-embed');
        if (container) {
          container.classList.add('error');
          console.warn('Failed to load embedded content:', e.target.src);
        }
      }
    }, true);
  }
  
  handleResize() {
    // Recalculate video aspect ratios if needed
    this.updateVideoAspectRatios();
    
    // Update navigation if mobile menu is involved
    this.updateMobileNavigation();
  }
  
  updateScrollPosition() {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    // Update progress indicator if you want to add one
    document.documentElement.style.setProperty('--scroll-progress', `${scrollPercent}%`);
  }
  
  handleVisibilityChange() {
    const iframes = document.querySelectorAll('iframe');
    
    if (document.hidden) {
      // Pause videos when tab is not visible
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
          // Ignore cross-origin errors
        }
      });
    }
  }
  
  handleKeyboardNavigation(e) {
    // Arrow key navigation between sections
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateWithKeyboard(e.key === 'ArrowDown' ? 'next' : 'prev');
    }
    
    // Escape key to scroll to top
    if (e.key === 'Escape') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  navigateWithKeyboard(direction) {
    const sections = Array.from(document.querySelectorAll('.section[id]'));
    const currentScrollPosition = window.scrollY + 100;
    
    let currentIndex = 0;
    
    // Find current section
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= currentScrollPosition) {
        currentIndex = i;
      }
    }
    
    // Navigate to next/previous section
    if (direction === 'next' && currentIndex < sections.length - 1) {
      const targetSection = sections[currentIndex + 1];
      window.scrollTo({
        top: targetSection.offsetTop - 80,
        behavior: 'smooth'
      });
    } else if (direction === 'prev' && currentIndex > 0) {
      const targetSection = sections[currentIndex - 1];
      window.scrollTo({
        top: targetSection.offsetTop - 80,
        behavior: 'smooth'
      });
    } else if (direction === 'prev' && currentIndex === 0) {
      // Go to top if at first section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  updateVideoAspectRatios() {
    const videoEmbeds = document.querySelectorAll('.video-embed');
    
    videoEmbeds.forEach(embed => {
      const iframe = embed.querySelector('iframe');
      if (iframe) {
        // Maintain 16:9 aspect ratio
        const width = embed.offsetWidth;
        const height = width * (9 / 16);
        embed.style.height = `${height}px`;
      }
    });
  }
  
  updateMobileNavigation() {
    const nav = document.querySelector('#main-nav');
    const navLinks = document.querySelector('.nav-links');
    
    if (window.innerWidth <= 768) {
      // Mobile: hide nav links
      if (navLinks) {
        navLinks.style.display = 'none';
      }
    } else {
      // Desktop: show nav links
      if (navLinks) {
        navLinks.style.display = 'flex';
      }
    }
  }
  
  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
}

/* ===================================
   UTILITY FUNCTIONS
   ================================== */

// Smooth scroll polyfill for older browsers
function smoothScrollPolyfill() {
  if (!('scrollBehavior' in document.documentElement.style)) {
    import('https://cdn.jsdelivr.net/npm/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js')
      .then(module => {
        window.__forceSmoothScrollPolyfill__ = true;
        module.polyfill();
      });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  smoothScrollPolyfill();
  new PortfolioApp();
  
  // Add loaded class to body after a short delay
  setTimeout(() => {
    document.body.classList.add('app-loaded');
  }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  // Clean up any running animations or timers
  document.body.classList.add('app-unloading');
});