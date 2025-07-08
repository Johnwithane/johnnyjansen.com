// Enhanced section loader with full content management integration
class SectionLoader {
    constructor() {
        this.loadedSections = new Set();
        
        // Check if config is loaded
        if (typeof SITE_CONTENT === 'undefined' || typeof VideoHelpers === 'undefined') {
            console.error('Content config not loaded yet, retrying...');
            setTimeout(() => new SectionLoader(), 200);
            return;
        }
        
        this.content = SITE_CONTENT;
        this.videoHelpers = VideoHelpers;
        this.init();
    }

    init() {
        this.loadAllSections();
        this.setupAnimations();
    }

    loadAllSections() {
        // About section

    // About section  
    const aboutContainer = document.getElementById('about-section');
    if (aboutContainer) {
        aboutContainer.innerHTML = this.getAboutSection();
        this.loadedSections.add('about');
    }

        // Remoose section
        const remooseContainer = document.getElementById('remoose-section');
        if (remooseContainer) {
            remooseContainer.innerHTML = this.getRemooseSection();
            this.loadedSections.add('remoose');
        }

        // Music Video section
        const musicVideoContainer = document.getElementById('music-video-section');
        if (musicVideoContainer) {
            musicVideoContainer.innerHTML = this.getMusicVideoSection();
            this.loadedSections.add('music-video');
        }

        // UGC section
        const ugcContainer = document.getElementById('ugc-section');
        if (ugcContainer) {
            ugcContainer.innerHTML = this.getUGCSection();
            this.loadedSections.add('ugc');
        }

        // Documentary section
        const documentaryContainer = document.getElementById('documentary-section');
        if (documentaryContainer) {
            documentaryContainer.innerHTML = this.getDocumentarySection();
            this.loadedSections.add('documentary');
        }

        // Motion Design section
        const motionContainer = document.getElementById('motion-design-section');
        if (motionContainer) {
            motionContainer.innerHTML = this.getMotionDesignSection();
            this.loadedSections.add('motion-design');
        }

        console.log('All sections loaded with config:', this.loadedSections);
    }

getHeroSection() {
    const { personal } = this.content;
    return `<section class="hero">
        <div class="hero-video">
            <img src="static/hero-animation.webp" alt="Hero Animation" class="hero-webp">
        </div>
        <div class="hero-content">
            <h1>${personal.name}</h1>
            <p>${personal.tagline}</p>
            <a href="#music-video" class="cta-button">Explore My Work</a>
        </div>
    </section>`;
}

    getAboutSection() {
        const { personal } = this.content;
        return `<section id="about" class="section" style="background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);">
            <div class="container">
                <div class="section-header">
                    <h2>About ${personal.name.split(' ')[0]}</h2>
                    <p>The creative vision behind award-winning storytelling</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2xl); align-items: center;">
                    <div>
                        <h3 style="color: var(--white); font-size: var(--font-size-2xl); margin-bottom: var(--space-lg);">From Vision to Recognition</h3>
                        <p style="color: rgba(255,255,255,0.9); font-size: var(--font-size-lg); line-height: 1.7; margin-bottom: var(--space-lg);">
                            ${personal.aboutText}
                        </p>
                        <a href="career.html" class="cta-button">View Full Career Timeline</a>
                    </div>
                    <div style="text-align: center;">
                        <img src="./static/johnny-about.jpg" alt="${personal.name}" style="
                            width: 100%;
                            max-width: 400px;
                            height: auto;
                            border-radius: var(--radius-lg);
                            box-shadow: var(--shadow-lg);
                            border: 2px solid rgba(255, 255, 255, 0.2);
                            transition: all var(--transition-medium);
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    </div>
                </div>
            </div>
        </section>`;
    }

getRemooseSection() {
    const { remoose } = this.content;
    const descriptionParts = remoose.description.split('\n\n');
    return `<section id="remoose" class="section section-bg-remoose">
        <div class="section-overlay"></div>

        <div class="container">
            <!-- Logo Section -->
            <div class="remoose-logo">
                <img src="./static/logo-remoose.png" alt="Remoose Logo" id="remoose-logo">
            </div>

            <!-- Main Content -->
            <div class="remoose-main-content">
                <!-- Left Side Card -->
                <div class="remoose-info-card">
                    <p>${descriptionParts[0] || remoose.description}</p>
                    ${descriptionParts[1] ? `<p>${descriptionParts[1]}</p>` : ''}
                    
                    <div class="bottom-info">
                        <span class="role-badge">${remoose.role}</span>
                    </div>
                </div>

                <!-- Right Side Demo -->
                <div class="remoose-demo">
                    <div class="demo-cta">
                        <h4>Remix This Scene</h4>
                        <p>Join the party and create your own version!</p>
                    </div>
                    <div class="scene-demo" id="demo-scene">
                        <img id="scene-image" src="" alt="Remix this scene">
                        <div class="scene-overlay">
                            <div class="play-button">▶</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Children Grid Section -->
            <div class="remixes-section">
                <div class="remixes-header">
                    <h3>See Your Remix Here</h3>
                    <p>Watch how the community builds on this scene</p>
                </div>
                
                <div id="remixes-loading" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading community remixes...</p>
                </div>

                <div class="remixes-grid" id="remixes-grid" style="display: none;">
                    <!-- Dynamic content will be inserted here -->
                </div>
            </div>
        </div>
    </section>`;
}

    getMusicVideoSection() {
        const { awards, videos } = this.content;
        
        // Generate awards HTML from config
        const awardsHtml = awards.map(award => `
            <div class="award-card">
                <h3>${award.title}</h3>
                <p>${award.description}</p>
                ${award.year ? `<small style="color: rgba(255,255,255,0.7);">${award.year}</small>` : ''}
            </div>
        `).join('');

        // Generate music videos HTML from config
        const videosHtml = videos.musicVideos.map(video => `
            <div class="video-card">
                ${this.videoHelpers.createVideoEmbed(video)}
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.artist || video.description || 'Award-winning visual storytelling'}</p>
                </div>
            </div>
        `).join('');

        return `<section id="music-video" class="section section-bg-image" data-bg="music-video">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Music Video Director</h2>
                    <p>${this.content.personal.heroDescription}</p>
                </div>

                <div class="awards-grid">
                    ${awardsHtml}
                </div>

                <div class="demo-reel">
                    <h3>${videos.demoReel.title}</h3>
                    ${this.videoHelpers.createVideoEmbed(videos.demoReel)}
                    <p>${videos.demoReel.description}</p>
                </div>

                <div class="video-grid">
                    ${videosHtml}
                </div>
            </div>
        </section>`;
    }

    getUGCSection() {
        const { ugcProjects } = this.content;
        
        // Generate UGC projects HTML from config
        const projectsHtml = ugcProjects.map(project => `
            <div class="project-card">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                ${project.videoId ? this.videoHelpers.createVideoEmbed({
                    platform: project.platform || 'vimeo',
                    id: project.videoId
                }) : ''}
                ${project.title.includes('Club Penguin') ? '<a href="#remoose" class="internal-link">→ Learn more about Remoose</a>' : ''}
            </div>
        `).join('');

        return `<section id="ugc" class="section section-bg-pattern" data-pattern="dots">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>UGC Specialist</h2>
                    <p>Expert in user-generated content strategies, community engagement, and interactive storytelling experiences</p>
                </div>

                <div class="ugc-projects">
                    ${projectsHtml}
                </div>
            </div>
        </section>`;
    }

    getDocumentarySection() {
        const { videos } = this.content;
        
        // Generate documentaries HTML from config
        const docsHtml = videos.documentaries.map(doc => `
            <div class="doc-card">
                <div class="doc-status">${doc.status}</div>
                <h3>${doc.title}</h3>
                <p>${doc.description}</p>
                ${this.videoHelpers.createVideoEmbed(doc)}
                <p class="runtime">Runtime: ${doc.runtime} | ${doc.tagline || 'A compelling documentary story'}</p>
            </div>
        `).join('');

        // Generate Ocean Kitchen videos HTML from config
        const oceanVideosHtml = videos.oceanKitchen.map(video => `
            <div class="video-card">
                ${this.videoHelpers.createVideoEmbed(video)}
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.description}</p>
                </div>
            </div>
        `).join('');

        return `<section id="documentary" class="section section-bg-image" data-bg="documentary">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Documentary Filmmaker</h2>
                    <p>Director of compelling feature documentaries exploring human stories and cultural phenomena</p>
                </div>

                <div class="doc-grid">
                    ${docsHtml}
                </div>

                <div class="ocean-kitchen">
                    <h3>Ocean Kitchen</h3>
                    <p>Short-form documentary series for Ocean Wise exploring sustainable seafood and ocean conservation</p>
                    <div class="video-grid">
                        ${oceanVideosHtml}
                    </div>
                </div>
            </div>
        </section>`;
    }

    getMotionDesignSection() {
        const { videos } = this.content;
        
        // For motion design, we'll create placeholder videos since you don't have specific ones yet
        const motionVideosHtml = `
            <div class="video-card">
                <div class="video-embed">
                    <iframe src="https://player.vimeo.com/video/387499815" 
                            frameborder="0" 
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <h4>Brand Campaign</h4>
                    <p>High-end commercial animation for major client</p>
                </div>
            </div>
            <div class="video-card">
                <div class="video-embed">
                    <iframe src="https://player.vimeo.com/video/387499815" 
                            frameborder="0" 
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <h4>Title Sequence</h4>
                    <p>Creative opening sequence design</p>
                </div>
            </div>
        `;

        return `<section id="motion-design" class="section section-bg-pattern" data-pattern="waves">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Motion Designer</h2>
                    <p>Advanced animation and After Effects work for high-level clients, bringing brands to life through dynamic visual storytelling</p>
                </div>

                <div class="demo-reel">
                    <h3>Motion Design Reel</h3>
                    ${this.videoHelpers.createVideoEmbed(videos.demoReel)}
                    <p>Showcase of advanced animation work including brand campaigns, title sequences, and commercial projects</p>
                </div>

                <div class="video-grid">
                    ${motionVideosHtml}
                </div>
            </div>
        </section>`;
    }

    setupAnimations() {
        // Initialize animations for loaded sections
        if (window.ScrollAnimations) {
            setTimeout(() => {
                new ScrollAnimations();
            }, 100);
        }
    }
}

// Initialize section loader when DOM is ready with proper timing
document.addEventListener('DOMContentLoaded', () => {
    // Wait for config to load first, with retries
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInitialize() {
        if (typeof SITE_CONTENT !== 'undefined' && typeof VideoHelpers !== 'undefined') {
            new SectionLoader();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`Waiting for config... attempt ${attempts}`);
            setTimeout(tryInitialize, 200);
        } else {
            console.error('Failed to load content config after maximum attempts');
        }
    }
    
    tryInitialize();
});