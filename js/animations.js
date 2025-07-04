/* ===================================
   SCROLL ANIMATIONS & EFFECTS
   ================================== */

class ScrollAnimations {
  constructor() {
    this.animatedElements = [];
    this.observer = null;
    
    this.init();
  }
  
  init() {
    this.setupIntersectionObserver();
    this.setupAnimatedElements();
    this.setupParallaxEffects();
  }
  
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
        }
      });
    }, observerOptions);
  }
  
  setupAnimatedElements() {
    // Add animation classes to elements
    const elementsToAnimate = [
      { selector: '.award-card', animation: 'fade-in', delay: 0 },
      { selector: '.doc-card', animation: 'slide-in-left', delay: 100 },
      { selector: '.project-card', animation: 'fade-in', delay: 150 },
      { selector: '.video-card', animation: 'fade-in', delay: 50 },
      { selector: '.remoose-embed', animation: 'fade-in', delay: 75 },
      { selector: '.demo-reel', animation: 'slide-in-right', delay: 0 }
    ];
    
    elementsToAnimate.forEach(({ selector, animation, delay }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        element.classList.add(animation);
        element.style.transitionDelay = `${delay + (index * 100)}ms`;
        this.observer.observe(element);
      });
    });
  }
  
  animateElement(element) {
    element.classList.add('in-view');
    
    // Add a subtle bounce effect for cards
    if (element.classList.contains('award-card') || 
        element.classList.contains('video-card') ||
        element.classList.contains('remoose-embed')) {
      setTimeout(() => {
        element.style.transform = 'translateY(-2px)';
        setTimeout(() => {
          element.style.transform = '';
        }, 200);
      }, 300);
    }
  }
  
  setupParallaxEffects() {
    const heroVideo = document.querySelector('.hero-webp');
    
    if (heroVideo) {
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateParallax(heroVideo);
            ticking = false;
          });
          ticking = true;
        }
      });
    }
  }
  
  updateParallax(element) {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    element.style.transform = `translateY(${rate}px)`;
  }
}

/* ===================================
   LOADING ANIMATIONS
   ================================== */

class LoadingAnimations {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupPageLoad();
    this.setupVideoLoading();
  }
  
  setupPageLoad() {
    window.addEventListener('load', () => {
      document.body.classList.add('loaded');
      
      // Animate hero content
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
          heroContent.style.transition = 'opacity 1s ease, transform 1s ease';
          heroContent.style.opacity = '1';
          heroContent.style.transform = 'translateY(0)';
        }, 500);
      }
    });
  }
  
  setupVideoLoading() {
    const videoEmbeds = document.querySelectorAll('.video-embed iframe');
    
    videoEmbeds.forEach(iframe => {
      const container = iframe.closest('.video-embed');
      
      // Add loading state
      container.classList.add('loading');
      
      iframe.addEventListener('load', () => {
        setTimeout(() => {
          container.classList.remove('loading');
        }, 500);
      });
    });
  }
}

/* ===================================
   BUTTON EFFECTS
   ================================== */

class ButtonEffects {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupHoverEffects();
    this.setupClickEffects();
  }
  
  setupHoverEffects() {
    const buttons = document.querySelectorAll('.button');
    
    buttons.forEach(button => {
      const hoverText = button.querySelector('.hover-text');
      
      button.addEventListener('mouseenter', () => {
        this.animateButtonHover(button, hoverText, true);
      });
      
      button.addEventListener('mouseleave', () => {
        this.animateButtonHover(button, hoverText, false);
      });
    });
  }
  
  animateButtonHover(button, hoverText, isHovering) {
    if (isHovering) {
      // Add glow effect
      button.style.filter = 'drop-shadow(0 0 10px rgba(55, 255, 139, 0.3))';
    } else {
      button.style.filter = '';
    }
  }
  
  setupClickEffects() {
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.createRippleEffect(e, button);
      });
    });
  }
  
  createRippleEffect(e, button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

// CSS animation for ripple effect
const rippleCSS = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`;

// Add ripple CSS to document
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ScrollAnimations();
  new LoadingAnimations();
  new ButtonEffects();
});