// ===================================
//   CONTENT CONFIGURATION
//   Update all your content here!
// ===================================

const VideoRandomizer = {
  getRandomSource: (sources) => {
    if (Array.isArray(sources)) {
      const randomIndex = Math.floor(Math.random() * sources.length);
      return sources[randomIndex];
    }
    return sources; // Return single source if not array
  }
};

const SITE_CONTENT = {
  // Personal Info
  personal: {
    name: "Johnny Jansen",
    tagline: "Award-Winning Director & Creative Visionary",
    heroDescription: "Award-winning music video director with recognition from Leo Awards, Prism Prize, WCMA, and Juno Award nomination",
    aboutText: `Over a decade of storytelling evolution, from film production assistant to award-winning director. My work spans music videos, documentaries, motion design, and pioneering UGC strategies for global brands.

As Co-founder and Chief Creative Officer of Remoose, I'm building the future of digital communication while continuing to direct compelling narratives that resonate with audiences worldwide.`,
    email: "johnny@johnnyjansen.com",
    phone: "+1 (778) 833-2339",
    location: "Vancouver, BC"
  },

  

  // BACKGROUND SYSTEM - Configure all section backgrounds here
  backgrounds: {
    hero: {
      type: "video", // "video", "pattern", or "image"
      sources: [ // Array instead of single source
        "static/hero-bg-1.mp4"
      ],
      mobileSource: [ // Array instead of single source
        "static/hero-bg-1.webp"
      ],
      overlay: {
        color: "var(--gradient-hero)", // Use CSS variable directly
        opacity: 0.0
      }
    },
    about: {
      type: "video", // "video", "pattern", or "image"
      sources: [ // Array instead of single source
        "static/about-bg-1.mp4",
        "static/about-bg-2.mp4", 
        "static/about-bg-3.mp4"
      ],      
      mobileSource: [ // Array instead of single source
        "static/about-bg-1.webp",
        "static/about-bg-2.webp", 
        "static/about-bg-3.webp"
      ], 
      overlay: {
        color: "var(--gradient-about)", // Use CSS variable directly
        opacity: 0.2
      }
    },
    musicVideo: {
      type: "video",
      sources: [ // Array instead of single source
        "static/music-bg-1.mp4",
        "static/music-bg-2.mp4", 
        "static/music-bg-3.mp4"
      ],      
      mobileSource: [ // Array instead of single source
        "static/music-bg-1.webp",
        "static/music-bg-2.webp", 
        "static/music-bg-3.webp"
      ],   
      overlay: {
        color: "var(--gradient-music)",
        opacity: 0.5
      }
    },
    documentary: {
      type: "video", 
      sources: [ // Array instead of single source
        "static/documentary-bg-1.mp4",
        "static/documentary-bg-2.mp4", 
        "static/documentary-bg-3.mp4"
      ],      
      mobileSource: [ // Array instead of single source
        "static/documentary-bg-1.webp",
        "static/documentary-bg-2.webp", 
        "static/documentary-bg-3.webp"
      ],      
      overlay: {
        color: "var(--gradient-documentary)",
        opacity: 0.75
      }
    },
    ugc: {
      type: "video", 
      source: [ // Array instead of single source
        "static/ugc-bg-1.mp4",
        "static/ugc-bg-2.mp4", 
        "static/ugc-bg-3.mp4"
      ],   
      mobileSource: [ // Array instead of single source
        "static/ugc-bg-1.webp",
        "static/ugc-bg-2.webp", 
        "static/ugc-bg-3.webp"
      ],   
      overlay: {
        color: "var(--gradient-about)", // Use CSS variable directly
        opacity: 0.75
      }
    },
    motionDesign: {
      type: "video",
      source: [ // Array instead of single source
        "static/motion-bg-1.mp4",
        "static/motion-bg-2.mp4", 
        "static/motion-bg-3.mp4"
      ],    
      mobileSource: [ // Array instead of single source
        "static/motion-bg-1.webp",
        "static/motion-bg-2.webp", 
        "static/motion-bg-3.webp"
      ],    
      overlay: {
        color: "var(--gradient-motion)",
        opacity: 0.75
      }
    },
    remoose: {
      type: "video",
      source: [ // Array instead of single source
        "static/remoose-bg-1.mp4",
        "static/remoose-bg-2.mp4", 
        "static/remoose-bg-3.mp4"
      ], 
      mobileSource: [ // Array instead of single source
        "static/remoose-bg-1.webp",
        "static/remoose-bg-2.webp", 
        "static/remoose-bg-3.webp"
      ], 
      overlay: {
        color: "var(--gradient-remoose)",
        opacity: 0.75
      }
    },
    contact: {
      type: "video",
      source: [ // Array instead of single source
        "static/contact-bg-1.mp4",
        "static/contact-bg-2.mp4", 
        "static/contact-bg-3.mp4"
      ],
      mobileSource: [ // Array instead of single source
        "static/contact-bg-1.webp",
        "static/contact-bg-2.webp", 
        "static/contact-bg-3.webp"
      ],
      overlay: {
        color: "var(--gradient-contact)",
        opacity: 0.2
      }
    }
  },

  // Social Media Links
  social: {
    instagram: "https://instagram.com/johnnyjansen",
    twitter: "https://twitter.com/johnnyjansen", 
    youtube: "https://youtube.com/@johnnyjansen",
    linkedin: "https://linkedin.com/in/johnnyjansen",
    vimeo: "https://vimeo.com/johnnyjansen"
  },

  // Awards
  awards: [
    { title: "Leo Award", description: "Outstanding Achievement in Music Videos", year: "2019" },
    { title: "Prism Prize", description: "Canadian Music Video Recognition", year: "2020" },
    { title: "WCMA", description: "Western Canadian Music Awards", year: "2019" },
    { title: "Juno Nomination", description: "Best Music Video 2020", year: "2020" }
  ],

  // Video Content - Just update the IDs here!
  videos: {
    demoReel: {
      platform: "vimeo",
      id: "387499815",
      title: "Demo Reel",
      description: "A showcase of my best music video work featuring dynamic cinematography and creative storytelling"
    },
    
    musicVideos: [
      {
        platform: "youtube",
        id: "vYY0eZHvSGo",
        title: "Record Shop",
        artist: "Artist Name"
      },
      {
        platform: "youtube", 
        id: "vyLOqxbj9uc",
        title: "Music Video 2",
        artist: "Artist Name"
      }
      // Add more videos here
    ],

    documentaries: [
      {
        platform: "vimeo",
        id: "286303683", 
        title: "Most Likely to Become Famous",
        status: "In Post-Production",
        runtime: "90 minutes",
        description: "A meta-documentary about bringing our best friend Kyle Tubbs back to life after his tragic death from a fentanyl overdose at 27."
      },
      {
        platform: "vimeo",
        id: "880652226",
        title: "The Club Penguin Story", 
        status: "In Development",
        runtime: "3 Episodes",
        description: "A three-episode documentary series exploring how Club Penguin became the world's most popular children's computer game."
      }
    ],

    oceanKitchen: [
      {
        platform: "youtube",
        id: "14a1nnW5jgY",
        title: "Sustainable Shrimp Farming",
        description: "Ocean Wise Executive Chef Ned Bell visits a sustainable shrimp farm in Vietnam."
      },
      {
        platform: "youtube", 
        id: "KjebufqRQQg",
        title: "Haida Gwaii Shore Lunch",
        description: "What does sustainability look like for a recreational fisher?"
      },
      {
        platform: "youtube",
        id: "Oe2xJZHGlIk", 
        title: "Geoduck Harvesting in Action",
        description: "Chef Ned Bell joins a Geoduck dive with the Underwater Harvesters Association"
      }
    ]
  },

  // Remoose Configuration
  remoose: {
    sceneID: "nYZTpZddGz2tSCtsocBBT4",
    userID: "03beeeed-f188-4183-ae85-abc09e3cca9e",
    description: `Remoose is a collaborative animation platform that lets creators remix and build on each other's work. It's democratizing animation by making it accessible, social, and fun.

As Co-founder and Chief Creative Officer, I lead front-end development and design for the platform. The project emerged from my experience building UGC systems for Club Penguin and LEGO, where I partnered with Lance Priebe and Nicole Thompson to create this groundbreaking startup.`,
    role: "Co-founder & Chief Creative Officer"
  },

  // UGC Projects
  ugcProjects: [
    {
      title: "LEGO Life - Build Your Own Adventure",
      description: "Created a serialized storytelling experience for LEGO Life community spanning 2 seasons. Each week, the community voted on which bricks to use and commented on story direction.",
      videoId: "YOUR_LEGO_VIDEO", // Replace with actual ID
      platform: "vimeo"
    },
    {
      title: "Club Penguin - Businesmoose", 
      description: "As 'Businesmoose,' created engaging UGC content for the Club Penguin community, moderating the game environment while producing creative and interactive videos.",
      videoId: "YOUR_CP_VIDEO", // Replace with actual ID
      platform: "vimeo"
    },
    {
      title: "UGC Strategy Consulting",
      description: "Developed comprehensive UGC content plans and systems for major brands including LEGO and Disney, focusing on community-driven storytelling and engagement strategies."
    }
  ],

  // Career Timeline (for career.html)
  timeline: [
    {
      year: "April 2024 - Present",
      title: "Co-founder & Chief Creative Officer", 
      company: "Remoose",
      description: "Leading creative vision and product development for next-generation digital communication platform.",
      achievements: [
        "Built and launched revolutionary digital communication platform from concept to company",
        "Lead front-end development and design architecture for complex interactive platform", 
        "Manage development team and establish technical standards and workflows"
      ],
      videoId: "YOUR_REMOOSE_DEMO_VIDEO" // Add when available
    }
    // Add more timeline entries
  ]
};

// Helper Functions
const VideoHelpers = {
  getEmbedUrl: (platform, id) => {
    const urls = {
      youtube: `https://www.youtube.com/embed/${id}`,
      vimeo: `https://player.vimeo.com/video/${id}`
    };
    return urls[platform] || '';
  },

  createVideoEmbed: (video) => {
    return `
      <div class="video-embed">
        <iframe src="${VideoHelpers.getEmbedUrl(video.platform, video.id)}" 
                frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen>
        </iframe>
      </div>
    `;
  }
};

// Background System Helper
const BackgroundHelpers = {
  // Apply background configuration to a section
  applyBackground: (sectionId, config) => {
    const section = document.getElementById(sectionId);
    if (!section || !config) return;

    // Remove existing background classes
    section.classList.remove('section-bg-video', 'section-bg-pattern', 'section-bg-image');
    
    // Apply new background type
    switch (config.type) {
      case 'video':
        section.classList.add('section-bg-video');
        BackgroundHelpers.setupVideoBackground(section, config);
        break;
      case 'pattern':
        section.classList.add('section-bg-pattern');
        section.setAttribute('data-pattern', config.pattern);
        break;
      case 'image':
        section.classList.add('section-bg-image');
        section.setAttribute('data-bg', config.source);
        break;
    }

    // Apply overlay configuration
    if (config.overlay) {
      const overlay = section.querySelector('.section-overlay') || BackgroundHelpers.createOverlay(section);
      overlay.style.background = config.overlay.color;
      overlay.style.opacity = config.overlay.opacity;
    }
  },

  // Setup video background
  setupVideoBackground: (section, config) => {
    let videoContainer = section.querySelector('.section-video-bg');
    
    if (!videoContainer) {
      videoContainer = document.createElement('div');
      videoContainer.className = 'section-video-bg';
      section.insertBefore(videoContainer, section.firstChild);
    }

    videoContainer.innerHTML = `
      <video 
        autoplay 
        muted 
        loop 
        playsinline
        preload="metadata"
        class="section-video">
        <source src="${config.source}" type="video/mp4">
      </video>
    `;

    // Handle video loading
    const video = videoContainer.querySelector('video');
    video.addEventListener('loadeddata', () => {
      video.play().catch(e => console.log('Video autoplay prevented:', e));
    });
  },

  // Create overlay element
  createOverlay: (section) => {
    const overlay = document.createElement('div');
    overlay.className = 'section-overlay';
    section.appendChild(overlay);
    return overlay;
  },

  // Initialize all backgrounds from config
  initAllBackgrounds: () => {
    const { backgrounds } = SITE_CONTENT;
    
    // Map config keys to section IDs
    const sectionMap = {
      hero: 'hero',
      about: 'about', 
      musicVideo: 'music-video',
      documentary: 'documentary', 
      ugc: 'ugc',
      motionDesign: 'motion-design',
      remoose: 'remoose',
      contact: 'contact'
    };

    Object.entries(sectionMap).forEach(([configKey, sectionId]) => {
      const config = backgrounds[configKey];
      if (config) {
        BackgroundHelpers.applyBackground(sectionId, config);
      }
    });
  }
};

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = { SITE_CONTENT, VideoHelpers, BackgroundHelpers };
}