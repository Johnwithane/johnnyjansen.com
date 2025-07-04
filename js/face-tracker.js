// Face tracking functionality
document.addEventListener('DOMContentLoaded', function() {
    const faces = [
        "static/face/cl.png",
        "static/face/tl.png", 
        "static/face/ct.png",
        "static/face/tr.png",
        "static/face/cr.png",
        "static/face/br.png",
        "static/face/bc.png",
        "static/face/bl.png"
    ];

    // Function to update face direction
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
            if (deg < 0) {
                deg += 360;
            }
            const i = Math.round(deg / 45) % faces.length;
            faceElement.src = faces[i];
        }
    }

    // Update faces on mouse move
    document.addEventListener('mousemove', function(e) {
        const navFace = document.getElementById('face');
        const heroFace = document.getElementById('hero-face');
        
        updateFace(navFace, e.clientX, e.clientY);
        updateFace(heroFace, e.clientX, e.clientY);
    });
});