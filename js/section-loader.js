// Section loader functionality - Load sections immediately since they're inline
class SectionLoader {
    constructor() {
        this.loadedSections = new Set();
        this.init();
    }

    init() {
        // Load all sections immediately since we're not using external files
        this.loadAllSections();
        this.setupAnimations();
    }

    loadAllSections() {
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

        console.log('All sections loaded:', this.loadedSections);
    }

    getAboutSection() {
        return `<section id="about" class="section" style="background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);">
            <div class="container">
                <div class="section-header">
                    <h2>About Johnny</h2>
                    <p>The creative vision behind award-winning storytelling</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2xl); align-items: center;">
                    <div>
                        <h3 style="color: var(--white); font-size: var(--font-size-2xl); margin-bottom: var(--space-lg);">From Vision to Recognition</h3>
                        <p style="color: rgba(255,255,255,0.9); font-size: var(--font-size-lg); line-height: 1.7; margin-bottom: var(--space-md);">
                            Over a decade of storytelling evolution, from film production assistant to award-winning director. My work spans music videos, documentaries, motion design, and pioneering UGC strategies for global brands.
                        </p>
                        <p style="color: rgba(255,255,255,0.9); font-size: var(--font-size-lg); line-height: 1.7; margin-bottom: var(--space-lg);">
                            As Co-founder and Chief Creative Officer of Remoose, I'm building the future of digital communication while continuing to direct compelling narratives that resonate with audiences worldwide.
                        </p>
                        <a href="career.html" class="cta-button">View Full Career Timeline</a>
                    </div>
                    <div style="text-align: center;">
                        <img src="./static/johnny-about.jpg" alt="Johnny Jansen" style="
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
        return `<section id="remoose" class="remoose-section">
            <!-- Background Grid -->
            <div class="remoose-background-grid" id="background-grid"></div>
            <div class="remoose-overlay"></div>

            <div class="container">
                <!-- Logo Section -->
                <div class="remoose-logo">
                    <img src="./static/logo-remoose.png" alt="Remoose Logo" id="remoose-logo">
                </div>

                <!-- Description Card -->
                <div class="remoose-description-card">
                    <p>Remoose is a collaborative animation platform that lets creators remix and build on each other's work. It's democratizing animation by making it accessible, social, and fun.</p>
                    <span class="role-badge">Co-founder & Chief Creative Officer</span>
                </div>

                <!-- Remix Section -->
                <div class="remix-interaction-section">
                    <!-- Left: Call to Action -->
                    <div class="remix-cta">
                        <h3>Remix This Scene</h3>
                        <p>Join the party and create your own version!</p>
                    </div>

                    <!-- Right: Main Scene -->
                    <div class="main-scene-container">
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
        return `<section id="music-video" class="section section-bg-image" data-bg="music-video">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Music Video Director</h2>
                    <p>Award-winning music video director with recognition from Leo Awards, Prism Prize, WCMA, and Juno Award nomination</p>
                </div>

                <div class="awards-grid">
                    <div class="award-card">
                        <h3>Leo Award</h3>
                        <p>Outstanding Achievement in Music Videos</p>
                    </div>
                    <div class="award-card">
                        <h3>Prism Prize</h3>
                        <p>Canadian Music Video Recognition</p>
                    </div>
                    <div class="award-card">
                        <h3>WCMA</h3>
                        <p>Western Canadian Music Awards</p>
                    </div>
                    <div class="award-card">
                        <h3>Juno Nomination</h3>
                        <p>Best Music Video 2020</p>
                    </div>
                </div>

                <div class="demo-reel">
                    <h3>Demo Reel</h3>
                    <div class="video-embed">
                        <iframe src="https://player.vimeo.com/video/387499815" 
                                frameborder="0" 
                                allow="autoplay; fullscreen; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    </div>
                    <p>A showcase of my best music video work featuring dynamic cinematography and creative storytelling</p>
                </div>

                <div class="video-grid">
                    <div class="video-card">
                        <div class="video-embed">
                            <iframe src="https://www.youtube.com/embed/vYY0eZHvSGo" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <div class="video-info">
                            <h4>Record Shop</h4>
                            <p>Dynamic storytelling with creative cinematography</p>
                        </div>
                    </div>
                    <div class="video-card">
                        <div class="video-embed">
                            <iframe src="https://www.youtube.com/embed/vyLOqxbj9uc" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <div class="video-info">
                            <h4>Featured Music Video</h4>
                            <p>Award-winning visual storytelling</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    }

    getUGCSection() {
        return `<section id="ugc" class="section section-bg-pattern" data-pattern="dots">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>UGC Specialist</h2>
                    <p>Expert in user-generated content strategies, community engagement, and interactive storytelling experiences</p>
                </div>

                <div class="ugc-projects">
                    <div class="project-card">
                        <h3>LEGO Life - Build Your Own Adventure</h3>
                        <p>Created a serialized storytelling experience for LEGO Life community spanning 2 seasons. Each week, the community voted on which bricks to use and commented on story direction.</p>
                        <div class="video-embed">
                            <iframe src="https://player.vimeo.com/video/YOUR_LEGO_VIDEO" 
                                    frameborder="0" 
                                    allow="autoplay; fullscreen; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                    </div>

                    <div class="project-card">
                        <h3>Club Penguin - Businesmoose</h3>
                        <p>As "Businesmoose," created engaging UGC content for the Club Penguin community, moderating the game environment while producing creative and interactive videos.</p>
                        <div class="video-embed">
                            <iframe src="https://player.vimeo.com/video/880652226" 
                                    frameborder="0" 
                                    allow="autoplay; fullscreen; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <a href="#remoose" class="internal-link">→ Learn more about Remoose</a>
                    </div>

                    <div class="project-card">
                        <h3>UGC Strategy Consulting</h3>
                        <p>Developed comprehensive UGC content plans and systems for major brands including LEGO and Disney, focusing on community-driven storytelling and engagement strategies.</p>
                    </div>
                </div>
            </div>
        </section>`;
    }

    getDocumentarySection() {
        return `<section id="documentary" class="section section-bg-image" data-bg="documentary">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Documentary Filmmaker</h2>
                    <p>Director of compelling feature documentaries exploring human stories and cultural phenomena</p>
                </div>

                <div class="doc-grid">
                    <div class="doc-card">
                        <div class="doc-status">In Post-Production</div>
                        <h3>Most Likely to Become Famous</h3>
                        <p>A meta-documentary about bringing our best friend Kyle Tubbs back to life after his tragic death from a fentanyl overdose at 27. The film blurs reality and fiction, exploring grief, artistry, and the opioid epidemic through the lens of friendship and creative collaboration.</p>
                        <div class="video-embed">
                            <iframe src="https://player.vimeo.com/video/286303683" 
                                    frameborder="0" 
                                    allow="autoplay; fullscreen; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <p class="runtime">Runtime: 90 minutes | A story of resurrection through art</p>
                    </div>

                    <div class="doc-card">
                        <div class="doc-status">In Development</div>
                        <h3>The Club Penguin Story</h3>
                        <p>A three-episode documentary series exploring how Club Penguin, created by a few dads in a small Canadian town, became the world's most popular children's computer game before selling to Disney for $350 million.</p>
                        <div class="video-embed">
                            <iframe src="https://player.vimeo.com/video/880652226" 
                                    frameborder="0" 
                                    allow="autoplay; fullscreen; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                        <p class="runtime">3 Episodes | The rise and fall of a digital phenomenon</p>
                    </div>
                </div>

                <div class="ocean-kitchen">
                    <h3>Ocean Kitchen</h3>
                    <p>Short-form documentary series for Ocean Wise exploring sustainable seafood and ocean conservation</p>
                    <div class="video-grid">
                        <div class="video-card">
                            <div class="video-embed">
                                <iframe src="https://www.youtube.com/embed/14a1nnW5jgY" 
                                        frameborder="0" 
                                        allow="autoplay; fullscreen; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                            <div class="video-info">
                                <h4>Sustainable Shrimp Farming</h4>
                                <p>Ocean Wise Executive Chef Ned Bell visits a sustainable shrimp farm in Vietnam and cooks on location.</p>
                            </div>
                        </div>
                        <div class="video-card">
                            <div class="video-embed">
                                <iframe src="https://www.youtube.com/embed/KjebufqRQQg" 
                                        frameborder="0" 
                                        allow="autoplay; fullscreen; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                            <div class="video-info">
                                <h4>Haida Gwaii Shore Lunch</h4>
                                <p>What does sustainability look like for a recreational fisher?</p>
                            </div>
                        </div>
                        <div class="video-card">
                            <div class="video-embed">
                                <iframe src="https://www.youtube.com/embed/Oe2xJZHGlIk" 
                                        frameborder="0" 
                                        allow="autoplay; fullscreen; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                            <div class="video-info">
                                <h4>Geoduck Harvesting in Action</h4>
                                <p>Chef Ned Bell joins a Geoduck dive with the Underwater Harvesters Association</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    }

    getMotionDesignSection() {
        return `<section id="motion-design" class="section section-bg-pattern" data-pattern="waves">
            <div class="section-overlay"></div>
            <div class="container">
                <div class="section-header">
                    <h2>Motion Designer</h2>
                    <p>Advanced animation and After Effects work for high-level clients, bringing brands to life through dynamic visual storytelling</p>
                </div>

                <div class="demo-reel">
                    <h3>Motion Design Reel</h3>
                    <div class="video-embed">
                        <iframe src="https://player.vimeo.com/video/387499815" 
                                frameborder="0" 
                                allow="autoplay; fullscreen; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    </div>
                    <p>Showcase of advanced animation work including brand campaigns, title sequences, and commercial projects</p>
                </div>

                <div class="video-grid">
                    <div class="video-card">
                        <div class="video-embed">
                            <iframe src="https://player.vimeo.com/video/YOUR_MOTION_1" 
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
                            <iframe src="https://player.vimeo.com/video/YOUR_MOTION_2" 
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

// Initialize section loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SectionLoader();
});