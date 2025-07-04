/* ===================================
   ENHANCED NAVIGATION FUNCTIONALITY
   ================================== */

class Navigation {
  constructor() {
    this.nav = document.querySelector('#main-nav');
    this.navButtons = document.querySelectorAll('.nav-links .nav-button');
    this.sections = document.querySelectorAll('.section');
    this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.isScrolling = false;
    this.isMobileMenuOpen = false;
    
    // Contact form elements
    this.contactForm = document.getElementById('contact-form');
    
    this.init();
  }
  
  init() {
    this.setupSmoothScrolling();
    this.setupScrollEffects();
    this.setupActiveNavigation();
    this.setupMobileMenu();
    this.setupContactForm();
  }
  
  setupContactForm() {
    if (this.contactForm) {
      // Handle form submission
      this.contactForm.addEventListener('submit', (e) => {
        this.handleContactSubmission(e);
      });
      
      // Add form validation effects
      this.setupFormValidation();
    }
  }
  
  setupFormValidation() {
    const inputs = this.contactForm.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
      
      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }
  
  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
      this.showFieldError(field, 'This field is required');
      return false;
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, 'Please enter a valid email address');
        return false;
      }
    }
    
    this.clearFieldError(field);
    return true;
  }
  
  showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    let errorElement = formGroup.querySelector('.field-error');
    
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'field-error';
      formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    field.style.borderColor = '#ff4757';
  }
  
  clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    const errorElement = formGroup.querySelector('.field-error');
    
    if (errorElement) {
      errorElement.remove();
    }
    
    field.style.borderColor = '';
  }
  
  handleContactSubmission(e) {
    e.preventDefault();
    
    // Validate all fields
    const inputs = this.contactForm.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      this.showFormMessage('Please fix the errors above', 'error');
      return;
    }
    
    // Get form data
    const formData = new FormData(this.contactForm);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = this.contactForm.querySelector('.submit-button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Simulate form submission (replace with your actual endpoint)
    this.submitContactForm(data)
      .then(() => {
        this.showFormMessage('Thank you! Your message has been sent successfully.', 'success');
        this.contactForm.reset();
        
        // Scroll to top of contact section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .catch(() => {
        this.showFormMessage('Sorry, there was an error sending your message. Please try again.', 'error');
      })
      .finally(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  }
  
  submitContactForm(data) {
    // Replace this with your actual form submission logic
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful submission
        resolve();
        
        // For real implementation, use:
        // fetch('/your-contact-endpoint', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data)
        // })
        // .then(response => response.json())
        // .then(result => resolve(result))
        // .catch(error => reject(error));
      }, 2000);
    });
  }
  
  showFormMessage(message, type) {
    // Remove existing message
    const existingMessage = this.contactForm.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message-${type}`;
    messageElement.textContent = message;
    
    // Insert at top of form
    this.contactForm.insertBefore(messageElement, this.contactForm.firstChild);
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 5000);
    }
  }
  
  setupMobileMenu() {
    if (this.mobileMenuToggle && this.navMenu) {
      // Toggle mobile menu
      this.mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
      
      // Close menu when clicking on nav links
      this.navButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
          }
        });
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isMobileMenuOpen && 
            !this.navMenu.contains(e.target) && 
            !this.mobileMenuToggle.contains(e.target)) {
          this.closeMobileMenu();
        }
      });
      
      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isMobileMenuOpen) {
          this.closeMobileMenu();
        }
      });
      
      // Handle window resize
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
          this.closeMobileMenu();
        }
      });
    }
  }
  
  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
  
  openMobileMenu() {
    this.isMobileMenuOpen = true;
    this.mobileMenuToggle.classList.add('active');
    this.navMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll behind menu
    
    // Animate menu items
    this.navButtons.forEach((button, index) => {
      button.style.opacity = '0';
      button.style.transform = 'translateX(20px)';
      setTimeout(() => {
        button.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        button.style.opacity = '1';
        button.style.transform = 'translateX(0)';
      }, index * 100 + 100);
    });
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileMenuToggle.classList.remove('active');
    this.navMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
    
    // Reset button animations
    this.navButtons.forEach(button => {
      button.style.transition = '';
      button.style.opacity = '';
      button.style.transform = '';
    });
  }
  
  setupSmoothScrolling() {
    this.navButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get target section from data attribute
        const targetId = button.getAttribute('data-section');
        const target = document.querySelector(`#${targetId}`);
        
        if (target) {
          this.scrollToSection(target);
        }
      });
    });
    
    // Also handle logo click to scroll to top
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        this.scrollToTop();
      });
    }
  }
  
  setupScrollEffects() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  
  handleScroll() {
    const scrollY = window.scrollY;
    
    // Update navigation background opacity based on scroll
    if (scrollY > 100) {
      this.nav.style.background = 'rgba(0, 0, 0, 0.98)';
      this.nav.style.backdropFilter = 'blur(15px)';
    } else {
      this.nav.style.background = 'rgba(0, 0, 0, 0.95)';
      this.nav.style.backdropFilter = 'blur(10px)';
    }
    
    // Update active section
    this.updateActiveSection();
  }
  
  setupActiveNavigation() {
    // Set up intersection observer for active section detection
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-80px 0px -50% 0px'
    };
    
    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveNavButton(entry.target.id);
        }
      });
    }, observerOptions);
    
    // Observe all sections
    this.sections.forEach(section => {
      if (section.id) {
        this.sectionObserver.observe(section);
      }
    });
  }
  
  setActiveNavButton(sectionId) {
    const sectionMap = {
      'music-video': 0,
      'documentary': 1,
      'ugc': 2,
      'motion-design': 3,
      'remoose': 4,
      'contact': 5
    };
    
    const activeIndex = sectionMap[sectionId];
    
    if (activeIndex !== undefined) {
      // Remove active class from all buttons
      this.navButtons.forEach(button => {
        button.classList.remove('active');
      });
      
      // Add active class to current button
      if (this.navButtons[activeIndex]) {
        this.navButtons[activeIndex].classList.add('active');
      }
    }
  }
  
  scrollToSection(target) {
    const offsetTop = target.offsetTop - 80; // Account for fixed nav
    
    this.isScrolling = true;
    
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
    
    // Reset scrolling flag after animation
    setTimeout(() => {
      this.isScrolling = false;
    }, 1000);
  }
  
  scrollToTop() {
    this.isScrolling = true;
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    setTimeout(() => {
      this.isScrolling = false;
    }, 1000);
  }
  
  updateActiveSection() {
    if (this.isScrolling) return;
    
    const scrollPosition = window.scrollY + 100; // Offset for nav height
    
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      if (section.offsetTop <= scrollPosition) {
        this.setActiveNavButton(section.id);
        break;
      }
    }
  }
}

// Enhanced Form Styling
const formStyles = `
  .field-error {
    color: #ff4757;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    display: block;
  }
  
  .form-message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  
  .form-message-success {
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid #2ecc71;
    color: #2ecc71;
  }
  
  .form-message-error {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid #e74c3c;
    color: #e74c3c;
  }
  
  .form-group input:invalid:not(:focus):not(:placeholder-shown),
  .form-group textarea:invalid:not(:focus):not(:placeholder-shown) {
    border-color: #ff4757;
    box-shadow: 0 0 5px rgba(255, 71, 87, 0.3);
  }
  
  .form-group input:valid,
  .form-group textarea:valid {
    border-color: rgba(46, 204, 113, 0.5);
  }
`;

// Add form styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = formStyles;
document.head.appendChild(styleSheet);

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
});