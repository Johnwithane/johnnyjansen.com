/* ===================================
   CONTENT MANAGER - AUTO-POPULATE FROM CONFIG
   ================================== */

class ContentManager {
  constructor() {
    this.content = SITE_CONTENT;
    this.videoHelpers = VideoHelpers;
    this.init();
  }

  init() {
    this.populatePersonalInfo();
    this.populateAwards();
    this.populateVideos();
    this.populateSocials();
    this.setupFormEmailTarget();
  }

  populatePersonalInfo() {
    const { personal } = this.content;
    
    // Update hero section
    const heroTitle = document.querySelector('.hero h1');
    const heroTagline = document.querySelector('.hero p');
    if (heroTitle) heroTitle.textContent = personal.name;
    if (heroTagline) heroTagline.textContent = personal.tagline;

    // Update navigation logo text
    const logoText = document.querySelector('.logo-text');
    if (logoText) logoText.textContent = personal.name;

    // Update about section
    const aboutText = document.querySelector('#about .about-text p');
    if (aboutText) aboutText.textContent = personal.aboutText;
  }

  populateAwards() {
    const awardsGrid = document.querySelector('.awards-grid');
    if (!awardsGrid) return;

    awardsGrid.innerHTML = this.content.awards.map(award => `
      <div class="award-card">
        <h3>${award.title}</h3>
        <p>${award.description}</p>
        ${award.year ? `<small>${award.year}</small>` : ''}
      </div>
    `).join('');
  }

  populateVideos() {
    this.populateDemoReel();
    this.populateMusicVideos();
    this.populateDocumentaries();
    this.populateOceanKitchen();
  }

  populateDemoReel() {
    const demoReelContainer = document.querySelector('.demo-reel .video-embed');
    if (!demoReelContainer) return;

    const { demoReel } = this.content.videos;
    demoReelContainer.innerHTML = `
      <iframe src="${this.videoHelpers.getEmbedUrl(demoReel.platform, demoReel.id)}" 
              frameborder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen>
      </iframe>
    `;

    // Update description
    const description = document.querySelector('.demo-reel p');
    if (description) description.textContent = demoReel.description;
  }

  populateMusicVideos() {
    const videoGrid = document.querySelector('#music-video .video-grid');
    if (!videoGrid) return;

    videoGrid.innerHTML = this.content.videos.musicVideos.map(video => `
      <div class="video-card">
        ${this.videoHelpers.createVideoEmbed(video)}
        <div class="video-info">
          <h4>${video.title}</h4>
          <p>${video.artist || video.description || ''}</p>
        </div>
      </div>
    `).join('');
  }

  populateDocumentaries() {
    const docGrid = document.querySelector('.doc-grid');
    if (!docGrid) return;

    docGrid.innerHTML = this.content.videos.documentaries.map(doc => `
      <div class="doc-card">
        <div class="doc-status">${doc.status}</div>
        <h3>${doc.title}</h3>
        <p>${doc.description}</p>
        ${this.videoHelpers.createVideoEmbed(doc)}
        <p class="runtime">Runtime: ${doc.runtime} | ${doc.tagline || 'A compelling documentary story'}</p>
      </div>
    `).join('');
  }

  populateOceanKitchen() {
    const oceanGrid = document.querySelector('.ocean-kitchen .video-grid');
    if (!oceanGrid) return;

    oceanGrid.innerHTML = this.content.videos.oceanKitchen.map(video => `
      <div class="video-card">
        ${this.videoHelpers.createVideoEmbed(video)}
        <div class="video-info">
          <h4>${video.title}</h4>
          <p>${video.description}</p>
        </div>
      </div>
    `).join('');
  }

  populateSocials() {
    const socialLinks = document.querySelector('.social-links');
    if (!socialLinks) return;

    const socialIcons = {
      instagram: `<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>`,
      twitter: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
      youtube: `<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
      linkedin: `<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`
    };

    socialLinks.innerHTML = Object.entries(this.content.social).map(([platform, url]) => `
      <a href="${url}" target="_blank" class="social-link" aria-label="${platform}">
        <svg viewBox="0 0 24 24" fill="currentColor">
          ${socialIcons[platform] || ''}
        </svg>
      </a>
    `).join('');
  }

  setupFormEmailTarget() {
    // Set the form to send to your email
    const form = document.getElementById('contact-form');
    if (form) {
      form.setAttribute('data-email', this.content.personal.email);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for config to load first
  setTimeout(() => {
    new ContentManager();
  }, 100);
});