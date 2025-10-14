// Brand Story Cards - Modal System
(function() {
    const modal = document.getElementById('brand-story-modal');
    
    // Story data with all content
    const stories = {
        lego: {
            logo: './static/logos/logo-lego.png',
            title: 'LEGO: Build Your Own Adventure',
            description: 'Created and produced 2 seasons of interactive UGC storytelling on LEGO Life, where users voted on curated LEGO brick piles and submitted ideas to build characters and advance the story. This pioneering series prototyped custom UGC features for the platform, establishing community-driven narrative experiences.',
            type: 'series',
            videos: [
                'https://player.vimeo.com/video/701158926',
                'https://player.vimeo.com/video/703481238',
                'https://player.vimeo.com/video/706005610',
                'https://player.vimeo.com/video/708561443'
            ]
        },
        brainwaves: {
            logo: './static/logos/logo-oceanwise.png',
            title: 'Ocean Wise: Brain Waves',
            description: 'Created, produced, and directed an educational YouTube series for Ocean Wise and the Vancouver Aquarium. Coordinated directly with marine scientists and the marketing team to develop engaging content that teaches children about marine science topics, ocean conservation, and environmental stewardship.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/cEFN7NadTmc',
                'https://www.youtube.com/embed/PzURXrrjTKY',
                'https://www.youtube.com/embed/ucES9tc5yIM'
                // 'https://www.youtube.com/embed/xCtcHI_IjW0'
            ]
        },
        oceankitchen: {
            logo: './static/logos/logo-oceanwise.png',
            title: 'Ocean Wise: Ocean Kitchen',
            description: 'Coordinated with Ocean Wise Seafood to align brand objectives and produce a cooking show series featuring celebrity chef Ned Bell. The series promoted sustainable seafood practices while reaching over 500K viewers, combining culinary entertainment with ocean conservation messaging.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/yGwrGkqxmBo',
                'https://www.youtube.com/embed/Ajuydxqjc1c',
                'https://www.youtube.com/embed/TkRNrZTxYcc',
                'https://www.youtube.com/embed/W8VUC_1kW0Y',
                'https://www.youtube.com/embed/wB9ywJHeFtw'
            ]
        },
        clubpenguin: {
            logo: './static/logos/logo-disney.png',
            title: 'Club Penguin',
            description: 'Known to the community as "Businesmoose," I served as an in-game influencer producing sneak peeks, event announcements, and exclusive content. Generated over 14 million views on Club Penguin\'s YouTube channel while operating social media channels and producing TVCs that aired on Cartoon Network and Nickelodeon.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/OGDXggAQtHs',
                'https://www.youtube.com/embed/ZhiI33kqpDM',
                'https://www.youtube.com/embed/7xar-hAwIM4',
                `https://www.youtube.com/embed/DS4aaWdQGpU`

            ]
        },
        hippo: {
            logo: './static/logos/logo-hippo.png',
            title: 'Hyper Hippo',
            description: 'Developed and produced a community engagement series featuring Q&A sessions with game developers and studio insights. Created content that bridged the gap between the gaming community and the creative team, building transparency and excitement around the studio\'s development process.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/GHWmSxO5EIE',
                'https://www.youtube.com/embed/mponBHQckuA',
                'https://www.youtube.com/embed/OvAFE9VtwzY'
                // 'https://www.youtube.com/embed/FejHJ9IUubU',
                // 'https://www.youtube.com/embed/85qgSYOsGLQ'
            ]
        },
        wishbone: {
            logo: './static/logos/logo-wishbone.png',
            title: 'Wishbone Site Furnishings',
            description: 'Developed an integrated campaign series that connected print advertising with digital video content. Print ads in Landscape Architect Magazine featured QR codes linking to video profiles celebrating landscape architects, with Wishbone products showcased throughout their featured projects.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/oopMUokWKD8',
                // 'https://www.youtube.com/embed/Z9i4g6y0b5E',
                'https://www.youtube.com/embed/DKAlOmkSlSE',
                'https://www.youtube.com/embed/Z3BdwuZTOJc'
            ]
        },
        brandvideos: {
            logo: './static/logos/logo-vanaqua.png',
            title: 'Brand Videos & Trailers',
            description: 'High-level brand representation and commercial content for major organizations and gaming properties. Work includes promotional videos for Vancouver Aquarium, stop-motion game trailers, virtual world beta announcements, and television commercials for Disney properties.',
            type: 'series',
            videos: [
                'https://www.youtube.com/embed/Ho12PaeLcRI',
                'https://www.youtube.com/embed/e7z6fpcI-1w',
                'https://www.youtube.com/embed/z6981TrLFd0',
                'https://www.youtube.com/embed/JStdx_NO0-g',
                'https://www.youtube.com/embed/FejHJ9IUubU'
                // 'https://player.vimeo.com/video/906944926'
            ]
        }
    };
    
    // Generate modal content
    function openStory(storyKey) {
        const story = stories[storyKey];
        if (!story) return;
        
        let videoContent = '';
        
        if (story.type === 'single') {
            videoContent = `
                <div class="brand-story-modal-video">
                    <div class="video-embed">
                        <iframe src="${story.videos[0]}" loading="lazy" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            `;
        } else {
            const videoItems = story.videos.map(url => `
                <div class="brand-story-modal-video-item">
                    <div class="video-embed">
                        <iframe src="${url}" loading="lazy" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            `).join('');
            
            videoContent = `
                <div class="brand-story-modal-video-series">
                    ${videoItems}
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="brand-story-modal-content">
                <button class="brand-story-modal-close" onclick="document.getElementById('brand-story-modal').classList.remove('active')">&times;</button>
                <div class="brand-story-modal-header">
                    <img src="${story.logo}" alt="${story.title}" class="brand-story-modal-logo">
                    <h3 class="brand-story-modal-title">${story.title}</h3>
                </div>
                <p class="brand-story-modal-description">${story.description}</p>
                ${videoContent}
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    // Attach click handlers to cards
    document.querySelectorAll('.brand-story-card').forEach(card => {
        card.addEventListener('click', function() {
            const storyKey = this.getAttribute('data-story');
            openStory(storyKey);
        });
    });
    
    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
})();