// Hero Grid - Optimized for iOS
(function() {
    const heroGrid = document.getElementById('hero-grid');
    if (!heroGrid) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = window.innerWidth <= 768;
    
    // Disable on iOS or drastically reduce
    if (isIOS || isMobile) {
        // Show only static grid on mobile
        const MOBILE_GRID_SIZE = 12; // Reduced from 20
        const GRID_FOLDER = 'videos/grid/';
        const GRID_PREFIX = 'grid ';
        
        for (let i = 1; i <= MOBILE_GRID_SIZE; i++) {
            const img = document.createElement('img');
            img.src = `${GRID_FOLDER}${GRID_PREFIX}(${i}).webp`;
            img.className = 'hero-grid-item';
            img.loading = 'lazy';
            img.alt = '';
            img.style.opacity = '0.4';
            heroGrid.appendChild(img);
        }
        return; // Exit - no animation on mobile
    }

    // Desktop code (your existing animation logic)
    const GRID_FOLDER = 'videos/grid/';
    const GRID_PREFIX = 'grid ';
    const NUM_IMAGES = 32;
    const CYCLE_INTERVAL = 4000;
    
    function calculateGridSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const cellSize = 200;
        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);
        return Math.min(cols * rows, 50);
    }

    const gridSize = calculateGridSize();
    let currentImages = [];
    let availableImages = [];

    for (let i = 1; i <= NUM_IMAGES; i++) {
        availableImages.push(`${GRID_FOLDER}${GRID_PREFIX}(${i}).webp`);
    }

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function initGrid() {
        heroGrid.innerHTML = '';
        const shuffled = shuffle(availableImages);
        
        for (let i = 0; i < gridSize; i++) {
            const img = document.createElement('img');
            const imageIndex = i % shuffled.length;
            img.src = shuffled[imageIndex];
            img.className = 'hero-grid-item';
            img.loading = 'lazy';
            img.alt = '';
            img.style.opacity = (Math.random() * 0.4 + 0.3).toFixed(2);
            heroGrid.appendChild(img);
            currentImages.push({ element: img, src: shuffled[imageIndex] });
        }
    }

    function cycleRandomCells() {
        const numToChange = Math.floor(Math.random() * 5) + 3;
        const shuffled = shuffle(availableImages);
        
        for (let i = 0; i < numToChange; i++) {
            const randomIndex = Math.floor(Math.random() * currentImages.length);
            const cell = currentImages[randomIndex];
            const newSrc = shuffled[Math.floor(Math.random() * shuffled.length)];
            
            cell.element.classList.add('fade-out');
            
            setTimeout(() => {
                cell.element.src = newSrc;
                cell.src = newSrc;
                cell.element.style.opacity = (Math.random() * 0.4 + 0.3).toFixed(2);
                cell.element.classList.remove('fade-out');
                cell.element.classList.add('fade-in');
                
                setTimeout(() => {
                    cell.element.classList.remove('fade-in');
                }, 500);
            }, 500);
        }
    }

    initGrid();
    setInterval(cycleRandomCells, CYCLE_INTERVAL);
})();

// Parallax (desktop only)
function handleParallax() {
    const heroGrid = document.getElementById('hero-grid');
    if (!heroGrid || window.innerWidth <= 768) return;

    const parallaxSpeed = 0.3;

    function updateParallax() {
        const scrollY = window.scrollY;
        const translateY = scrollY * parallaxSpeed * -1;
        heroGrid.style.transform = `translateY(${translateY}px)`;
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) return;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });

    updateParallax();
}

document.addEventListener('DOMContentLoaded', handleParallax);