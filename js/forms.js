// Formspree AJAX Submission
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formMessage = document.getElementById('form-message');
    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'var(--primary-color)';
            formMessage.textContent = 'Thank you for your message! I'll get back to you soon.';
            form.reset();
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        } else {
            throw new Error('Form submission failed');
        }
    })
    .catch(error => {
        formMessage.style.display = 'block';
        formMessage.style.color = '#ff4d4d';
        formMessage.textContent = 'Oops! Something went wrong. Please try again.';
        console.error('Error:', error);
    });
});