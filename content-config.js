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
        opacity: 0.5
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
        color: "var(--gradient-music)", // Use CSS variable directly
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
        opacity: 0.90
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
    { title: "Juno Award Nomination", description: "Best Music Video - 'Record Shop'", year: "2020" },
    { title: "Prism Prize Audience Choice", description: "Un-American by Said the Whale", year: "2019" },
    { title: "Leo Award Winner", description: "Best Music Video - 'Un-American'", year: "2019" },
    { title: "WCMA Video Director", description: "Video Director of the Year", year: "2019" }
  ],

    services: {
    primary: [
      "UGC Strategy & Community Engagement Consulting",
      "High-Concept Music Video Direction", 
      "Motion Design & Explainer Videos",
      "Chief Creative Officer Consulting",
      "Front-End Development & Technical Direction"
    ],
    expertise: [
      "Concept to completion execution",
      "Team leadership & technical management", 
      "Community-driven content systems",
      "Award-winning creative direction",
      "Cross-platform content strategy"
    ]
  },

  // Video Content - Just update the IDs here!
  videos: {
    demoReel: {
      platform: "vimeo",
      id: "387499815", // UPDATE WITH YOUR ACTUAL DEMO REEL ID
      title: "Director Demo Reel",
      description: "Award-winning showcase featuring music videos, commercials, and creative direction across multiple platforms and brands"
    },
    

        musicVideos: [
      {
        platform: "youtube", // UPDATE PLATFORM & ID
        id: "vYY0eZHvSGo",
        title: "Record Shop",
        artist: "Said the Whale",
        description: "Juno Award nominated music video (2020)"
      },
      {
        platform: "youtube", // UPDATE PLATFORM & ID
        id: "vyLOqxbj9uc", 
        title: "Un-American",
        artist: "Said the Whale",
        description: "Leo Award winner, WCMA Video Director of the Year, Prism Prize Audience Choice"
      },
      {
        platform: "youtube", // ADD MORE AS NEEDED
        id: "YOUR_VIDEO_ID_3",
        title: "Music Video Title",
        artist: "Artist Name",
        description: "Video description"
      }
    ],

    documentaries: [
      {
        platform: "vimeo",
        id: "286303683", // UPDATE IF NEEDED
        title: "Most Likely to Become Famous",
        status: "Post-Production (On Creative Hold)", 
        runtime: "90 minutes",
        description: "Feature documentary funded by Blumhouse Productions. A meta-documentary exploring friendship, loss, and the creative process through the story of bringing our best friend back to life after his tragic death.",
        role: "Director/Producer"
      },
      {
        platform: "vimeo", 
        id: "880652226", // UPDATE IF NEEDED
        title: "The Club Penguin Story",
        status: "Development/Seeking Investment",
        runtime: "3 Episodes", 
        description: "Documentary series exploring how Club Penguin became the world's most popular children's computer game. Co-directed with RocketSnail Games team.",
        role: "Co-Director/Producer"
      }
    ],

    oceanKitchen: [
      {
        platform: "youtube",
        id: "14a1nnW5jgY", // UPDATE IF NEEDED
        title: "Sustainable Shrimp Farming",
        description: "Ocean Wise Executive Chef Ned Bell visits a sustainable shrimp farm in Vietnam."
      },
      {
        platform: "youtube", 
        id: "KjebufqRQQg", // UPDATE IF NEEDED
        title: "Haida Gwaii Shore Lunch",
        description: "Exploring sustainability practices for recreational fishing with Chef Ned Bell."
      },
      {
        platform: "youtube",
        id: "Oe2xJZHGlIk", // UPDATE IF NEEDED
        title: "Geoduck Harvesting in Action",
        description: "Chef Ned Bell joins a Geoduck dive with the Underwater Harvesters Association"
      }
    ]
  },

  // Remoose Configuration
  remoose: {
    sceneID: "nYZTpZddGz2tSCtsocBBT4",
    userID: "03beeeed-f188-4183-ae85-abc09e3cca9e",
    description: `Remoose emerged from years of pioneering UGC work at Club Penguin and LEGO. Starting as a prototype in 2022, we officially launched as a company in March 2024 to solve a fundamental question: how can communities collaborate in the content creation and storytelling process?

Our revolutionary platform enables creators to build modular, remixable content that branches and evolves through community collaboration. Think modular storytelling where every piece can become the foundation for someone else's creative vision.

As Co-founder and Chief Creative Officer, I lead both the creative vision and technical execution, handling front-end development while directing our development team. We've just soft-launched our first product after years of development.`,
    role: "Co-founder & Chief Creative Officer",
    timeline: "Prototype: 2022 | Company Founded: March 2024 | Soft Launch: 2024"
  },
  // UGC Projects
  ugcProjects: [
    {
      title: "LEGO Life - Build Your Own Adventure", 
      description: "As UGC Specialist at LEGO Group, created a serialized storytelling experience spanning 2 seasons where the community voted on story direction and brick choices each week. Managed the entire content pipeline from concept to execution.",
      achievement: "Successfully engaged millions in collaborative storytelling",
      videoId: "YOUR_LEGO_VIDEO_ID", // ADD WHEN AVAILABLE
      platform: "vimeo"
    },
    {
      title: "Club Penguin - Businesmoose Era",
      description: "Pioneer of influencer marketing in children's gaming. As 'Businesmoose,' generated over 14 million views through community engagement and UGC content creation, while moderating a platform of 5+ million users.",
      achievement: "Generated 14M+ views across 61 videos"
    },
    {
      title: "UGC Systems Development", 
      description: "Developed comprehensive UGC frameworks and community engagement strategies for major brands including Disney Interactive, LEGO Group, and RocketSnail Games. Specialized in creating systems that turn community participation into high-quality branded content.",
      achievement: "Multi-million dollar content strategies"
    }
  ],

  // Career Timeline (for career.html)
  // Career Timeline
timeline: [
  {
    year: "March 2024 - Present",
    title: "Co-founder & Chief Creative Officer", 
    company: "Remoose",
    description: "Leading creative vision and technical execution for revolutionary collaborative content platform. Built from prototype to company launch, handling front-end development and team management.",
    achievements: [
      "Co-founded company with Nicole Thompson and Lance Priebe",
      "Led front-end development and design architecture", 
      "Managed development team through prototype to soft launch",
      "Pioneered modular, remixable content creation system",
      "Established product strategy and user experience design"
    ]
  },
  {
    year: "2021 - 2024",
    title: "Senior Content Director", 
    company: "RocketSnail Games",
    description: "Oversaw all content strategy while incubating Remoose. Produced game trailers, managed content pipeline, and co-directed Club Penguin documentary series.",
    achievements: [
      "Directed comprehensive content strategy for gaming properties",
      "Co-directed and produced 'The Club Penguin Story' documentary series",
      "Managed all promotional and marketing content creation",
      "Developed Remoose prototype within company incubator",
      "Established content creation workflows and team management systems"
    ]
  },
  {
    year: "2021 - 2022", 
    title: "UGC Consultant",
    company: "LEGO Group", 
    description: "Specialized consultant for user-generated content systems and community engagement strategies for LEGO Life platform.",
    achievements: [
      "Developed 'Build Your Own Adventure' serialized content series", 
      "Created community voting systems for story direction",
      "Managed multi-season interactive storytelling campaigns",
      "Established UGC frameworks for millions of users",
      "Consulted on community-driven content strategies"
    ]
  },
  {
    year: "2019 - 2021",
    title: "Feature Film Director/Producer",
    company: "Independent (Blumhouse Funded)",
    description: "Directed and produced feature documentary 'Most Likely to Become Famous' with funding from Blumhouse Productions. Completed rough cut while maintaining freelance music video career.",
    achievements: [
      "Secured funding from Blumhouse Productions for feature documentary",
      "Directed and produced 90-minute documentary film", 
      "Delivered completed rough cut to production partners",
      "Continued award-winning music video directing career",
      "Managed full production pipeline from concept to post"
    ]
  },
  {
    year: "2017 - 2019",
    title: "Senior Content Producer & Motion Designer",
    company: "Ocean Wise / Vancouver Aquarium", 
    description: "High-level creative director for environmental content. Created original series and managed all video content for interactive exhibits.",
    achievements: [
      "Created and directed 'Ocean Kitchen' series with Chef Ned Bell",
      "Launched 'Brainwaves' science education series",
      "Produced animated content for interactive aquarium exhibits", 
      "Managed content strategy for 4D theater and digital displays",
      "Developed sustainable storytelling content frameworks"
    ]
  },
  {
    year: "2014 - Present",
    title: "Freelance Director & Motion Designer",
    company: "Self-Employed",
    description: "Award-winning freelance career spanning music videos, commercials, and motion design. Clients include CBC, Disney, and various music artists.",
    achievements: [
      "Juno Award nomination for Best Music Video (2020)",
      "Leo Award winner for Best Music Video (2019)", 
      "WCMA Video Director of the Year (2019)",
      "Prism Prize Audience Choice Award (2019)",
      "Directed content for CBC, Disney, and major music artists",
      "Developed signature visual style in music video directing"
    ]
  },
  {
    year: "2013 - 2014", 
    title: "Community Manager & Videographer",
    company: "Hyper Hippo Entertainment",
    description: "Managed community engagement and video content creation for game launches. Pioneered studio vlog format and community-driven marketing.",
    achievements: [
      "Successfully launched AdVenture Capitalist with video marketing campaign",
      "Created game trailers and promotional content",
      "Established studio vlog series (ahead of industry trend)", 
      "Managed social media channels and community outreach",
      "Developed community engagement strategies for game launches"
    ]
  },
  {
    year: "2010 - 2013",
    title: "Online Community Videographer", 
    company: "Disney Interactive (Club Penguin)",
    description: "Pioneer of children's gaming content creation. As 'Businesmoose,' became early influencer while producing content for millions of users.",
    achievements: [
      "Generated over 14 million views across Club Penguin YouTube channel",
      "Co-launched Club Penguin's social media presence (YouTube, Twitter)",
      "Produced TV commercials that aired on Disney Channel and Nickelodeon",
      "Established 'Businesmoose' brand as widely recognized gaming personality", 
      "Created viral in-game content and community engagement videos",
      "Managed online community of 5+ million active users"
    ]
  },
  {
    year: "2007 - 2010",
    title: "Player Support Representative", 
    company: "Disney Interactive (Club Penguin)",
    description: "Community moderation and player support while developing content creation skills. Worked up from support to content creator role.",
    achievements: [
      "Excelled in community moderation for children's platform",
      "Developed expertise in online safety and content moderation",
      "Created internal training videos and company content",
      "Built reputation for exceptional community engagement",
      "Transitioned from support role to content creation through proven skills"
    ]
  }
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