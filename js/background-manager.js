/* ===================================
   BACKGROUND MANAGER
   Handles video, pattern, and image backgrounds
   ================================== */

class BackgroundManager {
  constructor() {
    this.videoObserver = null;
    this.activeVideos = new Map();
    this.init();
  }

  init() {
    // Wait for config to load
    if (typeof SITE_CONTENT === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    this.setupIntersectionObserver();
    this.applyAllBackgrounds();
    this.setupPerformanceOptimizations();
  }

  setupIntersectionObserver() {
    // Optimize video playback based on visibility
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.section-video');
        if (!video) return;

        if (entry.isIntersecting) {
          this.playVideo(video);
        } else {
          this.pauseVideo(video);
        }
      });
    }, options);
  }

applyAllBackgrounds() {
  const { backgrounds } = SITE_CONTENT;
  
  // Map config keys to section selectors
  const sectionMap = {
    hero: '.hero',
    about: '#about', 
    musicVideo: '#music-video',
    documentary: '#documentary', 
    ugc: '#ugc',
    motionDesign: '#motion-design',
    remoose: '#remoose',
    contact: '#contact'
  };

  Object.entries(sectionMap).forEach(([configKey, sectionSelector]) => {
    const config = backgrounds[configKey];
    if (config) {
      setTimeout(() => {
        const section = document.querySelector(sectionSelector);
        if (section) {
          // Pass the actual section element for all cases
          this.applyBackground(configKey, config, section);
        }
      }, 50);
    }
  });
}

  applyBackground(sectionId, config, sectionElement = null) {
    const section = sectionElement || document.getElementById(sectionId);
    if (!section || !config) return;

    // Remove existing background classes
    section.classList.remove('section-bg-video', 'section-bg-pattern', 'section-bg-image');
    
    // Apply new background type
    switch (config.type) {
      case 'video':
        this.setupVideoBackground(section, config);
        break;
      case 'pattern':
        this.setupPatternBackground(section, config);
        break;
      case 'image':
        this.setupImageBackground(section, config);
        break;
    }

    // Apply overlay configuration
    this.setupOverlay(section, config.overlay);
  }

setupVideoBackground(section, config) {
  section.classList.add('section-bg-video');
  
  // Handle random video selection
  let videoSource;
  if (Array.isArray(config.source)) {
    // Random selection from array
    const randomIndex = Math.floor(Math.random() * config.source.length);
    videoSource = config.source[randomIndex];
    console.log(`Selected random video ${randomIndex + 1}/${config.source.length}:`, videoSource);
  } else if (Array.isArray(config.sources)) {
    // Alternative array property name
    const randomIndex = Math.floor(Math.random() * config.sources.length);
    videoSource = config.sources[randomIndex];
    console.log(`Selected random video ${randomIndex + 1}/${config.sources.length}:`, videoSource);
  } else {
    // Single source
    videoSource = config.source || config.sources;
  }
  
  // Create or update video container
  let videoContainer = section.querySelector('.section-video-bg');
  
  if (!videoContainer) {
    videoContainer = document.createElement('div');
    videoContainer.className = 'section-video-bg';
    section.insertBefore(videoContainer, section.firstChild);
  }

  // Create video element with selected source
  const video = document.createElement('video');
  video.className = 'section-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  
  // Add random source
  const source = document.createElement('source');
  source.src = videoSource;
  source.type = 'video/mp4';
  video.appendChild(source);

  // Clear container and add video
  videoContainer.innerHTML = '';
  videoContainer.appendChild(video);

  // Handle video events
  this.setupVideoEvents(video, videoContainer);
  
  // Observe section for performance
  this.videoObserver.observe(section);
  this.activeVideos.set(section.id || 'hero', video);
}

setupHeroVideoBackground(section, config) {
  // Use existing hero-video container
  let heroVideoContainer = section.querySelector('.hero-video');
  
  if (!heroVideoContainer) {
    heroVideoContainer = document.createElement('div');
    heroVideoContainer.className = 'hero-video';
    section.insertBefore(heroVideoContainer, section.firstChild);
  }

  // Create video element
  const video = document.createElement('video');
  video.className = 'hero-webp'; // Use same class as original webp
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  
  // Add source
  const source = document.createElement('source');
  source.src = config.source;
  source.type = 'video/mp4';
  video.appendChild(source);

  // Replace existing content
  heroVideoContainer.innerHTML = '';
  heroVideoContainer.appendChild(video);

  // Handle video events
  this.setupVideoEvents(video, heroVideoContainer);
  
  // Observe section for performance
  this.videoObserver.observe(section);
  this.activeVideos.set('hero', video); // Use 'hero' as key
}

  setupVideoEvents(video, container) {
    video.addEventListener('loadeddata', () => {
      video.play().catch(e => {
        console.log('Video autoplay prevented:', e);
        // Fallback: try to play on user interaction
        document.addEventListener('click', () => {
          video.play().catch(() => {});
        }, { once: true });
      });
      container.classList.add('loaded');
    });

    video.addEventListener('error', (e) => {
      console.error('Video failed to load:', e);
      container.style.background = 'var(--dark-gray)';
    });

    video.addEventListener('canplay', () => {
      video.classList.add('playing');
    });
  }

  setupPatternBackground(section, config) {
    section.classList.add('section-bg-pattern');
    if (config.pattern) {
      section.setAttribute('data-pattern', config.pattern);
    }
    if (config.color) {
      section.setAttribute('data-color', config.color);
    }
  }

  setupImageBackground(section, config) {
    section.classList.add('section-bg-image');
    section.setAttribute('data-bg', config.source);
  }

  setupOverlay(section, overlayConfig) {
    if (!overlayConfig) return;

    let overlay = section.querySelector('.section-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'section-overlay';
      section.appendChild(overlay);
    }

    // Apply overlay styles
    if (overlayConfig.color) {
      overlay.style.background = overlayConfig.color;
    }
    
    if (overlayConfig.opacity !== undefined) {
      overlay.style.opacity = overlayConfig.opacity;
    }
  }

  playVideo(video) {
    if (video && video.paused) {
      video.play().catch(() => {});
      video.classList.remove('paused');
      video.classList.add('playing');
    }
  }

  pauseVideo(video) {
    if (video && !video.paused) {
      video.pause();
      video.classList.add('paused');
      video.classList.remove('playing');
    }
  }

setupPerformanceOptimizations() {
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Pause all videos when page is hidden
  document.addEventListener('visibilitychange', () => {
    this.activeVideos.forEach(video => {
      if (document.hidden) {
        this.pauseVideo(video);
      } else {
        this.playVideo(video);
      }
    });
  });

  // Handle reduced motion preference OR mobile devices
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobile) {
    this.activeVideos.forEach(video => {
      video.style.display = 'none';
    });
  }

  // Optimize for mobile
  if (window.innerWidth <= 768) {
    this.activeVideos.forEach(video => {
      video.style.minWidth = '120%';
      video.style.minHeight = '120%';
    });
  }
}

  // Public method to update a single background
  updateBackground(sectionId, config) {
    this.applyBackground(sectionId, config);
  }

  // Public method to get current background config
  getBackgroundConfig(sectionId) {
    const { backgrounds } = SITE_CONTENT;
    const configMap = {
      'hero': 'hero',
      'about': 'about',
      'music-video': 'musicVideo',
      'documentary': 'documentary',
      'ugc': 'ugc', 
      'motion-design': 'motionDesign',
      'remoose': 'remoose',
      'contact': 'contact'
    };
    
    const configKey = configMap[sectionId];
    return configKey ? backgrounds[configKey] : null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all other scripts are loaded
  setTimeout(() => {
    window.backgroundManager = new BackgroundManager();
  }, 200);
});