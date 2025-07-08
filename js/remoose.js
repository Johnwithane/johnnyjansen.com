class RemooseOverhaul {
    constructor() {
        this.sceneID = 'nYZTpZddGz2tSCtsocBBT4';
        this.baseUrl = 'https://remoose.com';
        this.sceneData = null;
        this.childrenData = [];
        
        this.init();
    }

    async init() {
        try {
            await this.loadMainScene();
            await this.loadChildrenScenes();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load Remoose data:', error);
            this.showError();
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
            grid.style.display = 'flex'; // Changed to flex for horizontal scroll
            grid.innerHTML = '';

            if (this.childrenData.length === 0) {
                grid.innerHTML = '<p style="color: rgba(255,255,255,0.8); text-align: center; width: 100%;">No remixes yet - be the first!</p>';
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