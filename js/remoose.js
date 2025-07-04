class RemooseOverhaul {
    constructor() {
        this.sceneID = 'nYZTpZddGz2tSCtsocBBT4';
        this.baseUrl = 'https://remoose.com';
        this.sceneData = null;
        this.childrenData = [];
        this.backgroundApiUrl = 'https://remoose.com/api/scene/recent?filter_by_user=true&username=03beeeed-f188-4183-ae85-abc09e3cca9e&page=1';
        this.backgroundScenes = [];
        
        this.init();
    }

    async init() {
        try {
            await this.loadBackgroundScenes();
            await this.loadMainScene();
            await this.loadChildrenScenes();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load Remoose data:', error);
            this.showError();
        }
    }

    async loadBackgroundScenes() {
        try {
            const response = await fetch(this.backgroundApiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.backgroundScenes = await response.json();
            this.renderBackgroundGrid();
        } catch (error) {
            console.error('Failed to load background scenes:', error);
        }
    }

    renderBackgroundGrid() {
        const backgroundGrid = document.getElementById('background-grid');
        if (!backgroundGrid || this.backgroundScenes.length === 0) return;
        
        backgroundGrid.innerHTML = '';

        // Calculate how many items we need to fill the screen
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const itemSize = 120; // Smaller items for better coverage
        const itemsNeeded = Math.ceil((screenWidth / itemSize) * (screenHeight / itemSize)) + 50; // More items
        
        for (let i = 0; i < itemsNeeded; i++) {
            const scene = this.backgroundScenes[i % this.backgroundScenes.length];
            
            const bgItem = document.createElement('a');
            bgItem.className = 'remoose-bg-item';
            bgItem.href = `${this.baseUrl}${scene.sceneURL}`;
            bgItem.target = '_blank';
            bgItem.rel = 'noopener noreferrer';
            
            const img = document.createElement('img');
            img.src = scene.thumbnail || scene.webpURL || scene.pngURL;
            img.alt = `Remoose Scene ${scene.id}`;
            img.loading = 'lazy';
            
            img.onerror = () => {
                img.src = scene.webpURL || scene.pngURL;
            };
            
            bgItem.appendChild(img);
            backgroundGrid.appendChild(bgItem);
        }
    }

    async loadMainScene() {
        try {
            const response = await fetch(`https://remoose.com/api/scene/get/${this.sceneID}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.sceneData = await response.json();
            
            const sceneImage = document.getElementById('scene-image');
            if (sceneImage && this.sceneData.webpURL) {
                sceneImage.src = this.sceneData.webpURL;
                sceneImage.alt = 'Remix this scene';
            }
        } catch (error) {
            console.error('Failed to load main scene:', error);
        }
    }

    async loadChildrenScenes() {
        try {
            const response = await fetch(`https://remoose.com/api/scene/children/${this.sceneID}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.childrenData = await response.json();
            this.renderChildrenGrid();
        } catch (error) {
            console.error('Failed to load children scenes:', error);
            this.showError();
        }
    }

    renderChildrenGrid() {
        const loading = document.getElementById('remixes-loading');
        const grid = document.getElementById('remixes-grid');
        
        if (loading) loading.style.display = 'none';
        if (grid) {
            grid.style.display = 'grid';
            grid.innerHTML = '';

            if (this.childrenData.length === 0) {
                grid.innerHTML = '<p style="color: rgba(255,255,255,0.8); text-align: center; grid-column: 1/-1;">No remixes yet - be the first!</p>';
                return;
            }

            this.childrenData.forEach(scene => {
                const remixItem = document.createElement('a');
                remixItem.className = 'remix-item';
                remixItem.href = `${this.baseUrl}${scene.sceneURL}`;
                remixItem.target = '_blank';
                remixItem.rel = 'noopener noreferrer';
                
                const img = document.createElement('img');
                img.src = scene.webpURL || scene.thumbnail || scene.pngURL;
                img.alt = `Remix by ${scene.username || 'Unknown'}`;
                img.loading = 'lazy';
                
                img.onerror = () => {
                    img.src = scene.thumbnail || scene.pngURL;
                };
                
                remixItem.appendChild(img);
                grid.appendChild(remixItem);
            });
        }
    }

    setupEventListeners() {
        const demoScene = document.getElementById('demo-scene');
        if (demoScene) {
            demoScene.addEventListener('click', () => {
                // Updated to use the specific replies URL format
                window.open(`${this.baseUrl}/${this.sceneID}/replies`, '_blank');
            });
        }
    }

    showError() {
        const loading = document.getElementById('remixes-loading');
        if (loading) {
            loading.innerHTML = '<p style="color: #FF6B6B;">Failed to load remixes. Please try again later.</p>';
        }
    }
}

// Initialize the Remoose overhaul when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new RemooseOverhaul();
    }, 1000);
});