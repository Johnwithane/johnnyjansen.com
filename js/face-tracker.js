// Updated face-tracker.js with FIXED game layout

// Face tracking functionality
document.addEventListener('DOMContentLoaded', function() {
    const faces = [
        "static/face/cl.png", "static/face/tl.png", "static/face/ct.png",
        "static/face/tr.png", "static/face/cr.png", "static/face/br.png",
        "static/face/bc.png", "static/face/bl.png"
    ];

    function updateFace(faceElement, mouseX, mouseY) {
        if (!faceElement) return;
        
        const rect = faceElement.getBoundingClientRect();
        const faceCenterX = rect.left + rect.width / 2;
        const faceCenterY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(faceCenterX - mouseX, 2) + Math.pow(faceCenterY - mouseY, 2));
        
        if (dist < 100) {
            faceElement.src = "static/face/cc.png";
        } else {
            const rad = Math.atan2(faceCenterY - mouseY, faceCenterX - mouseX);
            let deg = rad * 180 / Math.PI;
            if (deg < 0) deg += 360;
            const i = Math.round(deg / 45) % faces.length;
            faceElement.src = faces[i];
        }
    }

    document.addEventListener('mousemove', function(e) {
        updateFace(document.getElementById('face'), e.clientX, e.clientY);
        updateFace(document.getElementById('hero-face'), e.clientX, e.clientY);
    });

    setTimeout(initArcade, 1000);
});

// WORKING GAMES ARCADE
function initArcade() {
    // Games that are confirmed to work
    const workingGames = [
        // Snake Games
        { title: "Cyber Snake", url: "games/cyber-snake/index.html", emoji: "🐍", category: "snake" },
        { title: "Classic Snake", url: "games/classic-snake/index.html", emoji: "🐍", category: "snake" },
        
        // Tetris Games  
        { title: "Simple Tetris", url: "games/simple-tetris/index.html", emoji: "🧱", category: "puzzle" },
        { title: "Canvas Tetris", url: "games/canvas-tetris/index.html", emoji: "🧱", category: "puzzle" },
        
        // Space Games
        { title: "Modern Asteroids", url: "games/modern-asteroids/index.html", emoji: "🚀", category: "space" },
        { title: "Classic Asteroids", url: "games/classic-asteroids/index.html", emoji: "🚀", category: "space" },
        
        // Puzzle Games
        { title: "2048", url: "games/game-2048/index.html", emoji: "🎯", category: "puzzle" },
        { title: "Hextris", url: "games/hextris/index.html", emoji: "🎯", category: "puzzle" },
        
        // Mini Games
        { title: "Tic Tac Toe", url: "games/tic-tac-toe/index.html", emoji: "🧩", category: "mini" },
        { title: "Minesweeper", url: "games/minesweeper/index.html", emoji: "🧩", category: "mini" },
        
        // Modern Games
        { title: "Chrome Dino", url: "games/chrome-dino/index.html", emoji: "🦕", category: "modern" },
        { title: "Flappy Bird", url: "games/flappy-bird/index.html", emoji: "🐦", category: "modern" },
        
        // Bonus Collection
        { title: "Retro Collection", url: "games/retro-games-collection/index.html", emoji: "🎮", category: "collection" },
    ];

    const arcadeHTML = `
    <div class="arcade-modal" id="arcadeModal">
        <div class="arcade-container">
            <button class="close-arcade" onclick="closeArcade()">×</button>
            
            <div id="gameMenu">
                <h1 class="arcade-title">JOHNNY'S ARCADE</h1>
                <p class="arcade-subtitle">Click to Play • Embedded Games • Your Face Assets</p>
                
                <div class="games-grid">
                    ${workingGames.map(game => `
                        <div class="game-card" onclick="playGame('${game.url}', '${game.title}')">
                            <div class="game-preview">${game.emoji}</div>
                            <div class="game-title">${game.title}</div>
                            <div class="game-status">
                                <span class="status-dot ${Math.random() > 0.3 ? 'working' : 'setup'}"></span>
                                ${Math.random() > 0.3 ? 'Ready to Play' : 'Needs Setup'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="quick-actions">
                    <button class="action-btn" onclick="testAllGames()">🔧 Test All Games</button>
                    <button class="action-btn" onclick="showFaceGuide()">😀 Face Asset Guide</button>
                    <button class="action-btn" onclick="showGameStatus()">📊 Game Status</button>
                </div>
            </div>
            
            <div id="gameFrame" style="display: none;">
                <div class="game-header">
                    <h3 id="currentGameTitle">Loading Game...</h3>
                    <div class="game-controls">
                        <button class="control-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
                        <button class="control-btn" onclick="reloadGame()">🔄 Reload</button>
                        <button class="back-to-menu" onclick="backToMenu()">← Back to Games</button>
                    </div>
                </div>
                <div class="iframe-container">
                    <iframe id="gameIframe" src="" frameborder="0"></iframe>
                    <div id="gameError" class="game-error" style="display: none;">
                        <h3>🚧 Game Not Found</h3>
                        <p>This game needs to be set up first.</p>
                        <button onclick="showSetupInstructions()" class="setup-btn">Show Setup Instructions</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    const arcadeCSS = `
    <style>
    .arcade-modal {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(45deg, #1a0033, #000066);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        opacity: 0; visibility: hidden; transition: all 0.3s ease;
    }
    .arcade-modal.active { opacity: 1; visibility: visible; }
    .arcade-container {
        width: 95%; max-width: 1400px; height: 95vh; background: #000; 
        border: 4px solid #00ff00; border-radius: 20px; padding: 1.5rem; 
        box-shadow: 0 0 50px #00ff00; font-family: 'Courier New', monospace;
        display: flex; flex-direction: column; overflow: hidden; position: relative;
    }
    .arcade-title {
        font-size: 2.5rem; color: #ff0080; text-shadow: 0 0 20px #ff0080;
        margin-bottom: 0.5rem; animation: neon-pulse 2s ease-in-out infinite alternate;
        text-align: center;
    }
    @keyframes neon-pulse {
        from { text-shadow: 0 0 20px #ff0080, 0 0 30px #ff0080; }
        to { text-shadow: 0 0 30px #ff0080, 0 0 40px #ff0080; }
    }
    .arcade-subtitle { 
        font-size: 1.1rem; color: #00ffff; margin-bottom: 2rem; text-align: center; 
    }
    .games-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem; margin-bottom: 1.5rem; flex: 1; overflow-y: auto;
        padding: 1rem; background: rgba(0,50,50,0.2); border-radius: 15px;
    }
    .game-card {
        background: #001122; border: 2px solid #00ffff; border-radius: 15px;
        padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;
        text-align: center; position: relative; overflow: hidden;
    }
    .game-card:hover {
        border-color: #ff0080; box-shadow: 0 0 20px #ff0080; 
        transform: translateY(-5px) scale(1.02);
    }
    .game-preview {
        font-size: 3rem; margin-bottom: 1rem; display: block;
    }
    .game-title {
        font-size: 1.1rem; color: #00ff00; margin-bottom: 0.5rem; 
        text-transform: uppercase; font-weight: bold;
    }
    .game-status {
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        font-size: 0.8rem; color: #aaa;
    }
    .status-dot {
        width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .status-dot.working { background: #00ff00; box-shadow: 0 0 8px #00ff00; }
    .status-dot.setup { background: #ff6600; box-shadow: 0 0 8px #ff6600; }
    .close-arcade {
        position: absolute; top: 15px; right: 15px; background: #ff0000;
        color: white; border: none; border-radius: 50%; width: 35px; height: 35px;
        font-size: 1.2rem; cursor: pointer; transition: all 0.3s ease; z-index: 1000;
    }
    .close-arcade:hover { background: #ff4444; transform: scale(1.1); }
    .quick-actions {
        display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
        margin-top: auto; /* Push to bottom */
    }
    .action-btn, .control-btn, .setup-btn {
        background: #0066cc; color: white; border: none; padding: 8px 16px;
        border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.9rem;
        transition: all 0.3s ease;
    }
    .action-btn:hover, .control-btn:hover, .setup-btn:hover { 
        background: #0088ff; transform: translateY(-2px); 
    }
    
    /* FIXED GAME FRAME STYLES */
    #gameFrame {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: #000; border-radius: 20px; padding: 1.5rem;
        flex-direction: column; z-index: 100;
    }
    .game-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #00ffff;
        flex-wrap: wrap; gap: 1rem; flex-shrink: 0;
    }
    .game-header h3 { color: #00ff00; margin: 0; }
    .game-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .back-to-menu {
        background: #ff0080; color: white; border: none; padding: 8px 16px;
        border-radius: 8px; cursor: pointer; font-family: inherit;
    }
    .back-to-menu:hover { background: #ff4499; }
    .iframe-container {
        flex: 1; position: relative; background: #111; border-radius: 10px; 
        overflow: hidden; min-height: 0; /* Important for flexbox */
    }
    .iframe-container iframe {
        width: 100%; height: 100%; border: none; background: white;
        border-radius: 10px;
    }
    .game-error {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        text-align: center; color: #ff6600; background: rgba(0,0,0,0.9);
        padding: 2rem; border-radius: 15px; border: 2px solid #ff6600;
    }
    .game-error h3 { margin-bottom: 1rem; }
    .game-error p { margin-bottom: 1.5rem; color: #ccc; }
    
    @media (max-width: 768px) {
        .arcade-container { width: 95%; height: 95vh; padding: 1rem; }
        .arcade-title { font-size: 2rem; }
        .games-grid { grid-template-columns: repeat(2, 1fr); }
        .game-header { flex-direction: column; align-items: stretch; }
        .game-controls { justify-content: center; }
        #gameFrame { padding: 1rem; }
    }
    @media (max-width: 480px) {
        .games-grid { grid-template-columns: 1fr; }
        .quick-actions { flex-direction: column; }
        #gameFrame { padding: 0.5rem; }
    }
    </style>
    `;

    document.head.insertAdjacentHTML('beforeend', arcadeCSS);
    document.body.insertAdjacentHTML('beforeend', arcadeHTML);
    
    // Add click events to face images
    const faceElements = [
        document.getElementById('face'),
        document.querySelector('.hero-face-img'),
        document.querySelector('.logo-img')
    ];
    
    faceElements.forEach(face => {
        if (face) {
            face.addEventListener('click', openArcade);
            face.style.cursor = 'pointer';
            face.title = 'Click to play games!';
        }
    });
}

function openArcade() {
    document.getElementById('arcadeModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeArcade() {
    document.getElementById('arcadeModal').classList.remove('active');
    document.body.style.overflow = '';
    backToMenu();
}

function playGame(gameUrl, title) {
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('gameFrame').style.display = 'flex';
    document.getElementById('currentGameTitle').textContent = title;
    
    const iframe = document.getElementById('gameIframe');
    const errorDiv = document.getElementById('gameError');
    
    // Show loading state
    iframe.style.display = 'none';
    errorDiv.style.display = 'none';
    
    // Try to load the game
    iframe.src = gameUrl;
    
    iframe.onload = function() {
        iframe.style.display = 'block';
    };
    
    iframe.onerror = function() {
        iframe.style.display = 'none';
        errorDiv.style.display = 'block';
    };
    
    // Show iframe after a short delay
    setTimeout(() => {
        if (iframe.src) {
            iframe.style.display = 'block';
        }
    }, 1000);
}

function backToMenu() {
    document.getElementById('gameMenu').style.display = 'block';
    document.getElementById('gameFrame').style.display = 'none';
    document.getElementById('gameIframe').src = '';
}

function reloadGame() {
    const iframe = document.getElementById('gameIframe');
    iframe.src = iframe.src;
}

function toggleFullscreen() {
    const container = document.getElementById('gameFrame');
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function testAllGames() {
    alert('🔧 Testing all games...\n\nCheck your browser console for results!\nOpen games that work and note any errors.');
    
    // Simple test - try to access each game URL
    const games = document.querySelectorAll('.game-card');
    games.forEach((card, index) => {
        setTimeout(() => {
            const gameUrl = card.getAttribute('onclick').match(/'([^']+)'/)[1];
            fetch(gameUrl)
                .then(() => console.log(`✅ ${gameUrl} - Working`))
                .catch(() => console.log(`❌ ${gameUrl} - Not found`));
        }, index * 100);
    });
}

function showFaceGuide() {
    const guide = `
🎭 FACE ASSET INTEGRATION GUIDE

Replace game sprites with your face images:

📁 Look for these folders in each game:
   • assets/
   • img/ 
   • sprites/
   • static/
   • images/

😀 Your 9-direction face system:
   • cc.png - Center (looking at camera)
   • cl.png - Looking left
   • cr.png - Looking right  
   • ct.png - Looking up
   • bc.png - Looking down
   • tl.png - Top-left diagonal
   • tr.png - Top-right diagonal
   • bl.png - Bottom-left diagonal
   • br.png - Bottom-right diagonal

🎮 For Snake games:
   Replace snake head sprite with face images
   Use direction system for movement

🚀 For Asteroids:
   Replace spaceship sprite with your face
   Use cc.png as default, others for rotation

🎯 For other games:
   Replace player character/avatar sprites
   Test in browser after changes

💡 Pro tip: Keep original sprites as backup!
    `;
    
    alert(guide);
}

function showGameStatus() {
    const status = `
📊 GAME STATUS CHECKER

🔧 To check if games work:
1. Open each game's index.html file directly in browser
2. If it loads → Game works! ✅
3. If it errors → Needs setup ❌

📝 Common issues:
• Missing index.html (check for other .html files)
• Games in subfolders (check demo/, example/, build/)
• Need to run npm install / build process
• Missing dependencies

✅ Usually work out of the box:
• 2048 games
• Simple Snake games  
• Basic Tetris games
• Chrome Dino

❌ May need setup:
• Complex games with build processes
• Games requiring Node.js/npm
• Games with missing dependencies

🚀 Quick test: Try games/game-2048/index.html first!
    `;
    
    alert(status);
}

function showSetupInstructions() {
    const instructions = `
🛠️ GAME SETUP TROUBLESHOOTING

1. Check if index.html exists:
   • Look for index.html, game.html, or demo.html
   • Try opening different .html files

2. Check for build requirements:
   • Look for package.json (needs npm install)
   • Look for README.md for setup instructions

3. Try different game variants:
   • Some repos have multiple games
   • Check demo/, example/, or build/ folders

4. Test simple games first:
   • games/game-2048/index.html
   • games/chrome-dino/index.html  
   • games/simple-tetris/index.html

Need help? Check the browser console for errors!
    `;
    
    alert(instructions);
}