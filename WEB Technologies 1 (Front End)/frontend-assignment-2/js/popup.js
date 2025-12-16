document.addEventListener('DOMContentLoaded', function() {
    const subscribeBtn = document.getElementById('subscribe-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupClose = document.getElementById('popup-close');
    const popupForm = document.getElementById('popup-form');
    
    if (subscribeBtn && popupOverlay) {
        subscribeBtn.addEventListener('click', function() {
            popupOverlay.style.display = 'flex';
        });
    }
    
    if (popupClose) {
        popupClose.addEventListener('click', function() {
            closePopup();
        });
    }
    
    if (popupOverlay) {
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                closePopup();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popupOverlay && popupOverlay.style.display === 'flex') {
            closePopup();
        }
    });
    
    if (popupForm) {
        popupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = popupForm.querySelector('#popup-email');
            const name = popupForm.querySelector('#popup-name');
            const terms = popupForm.querySelector('#popup-terms');
            
            let isValid = true;
            
            const errors = popupForm.querySelectorAll('.error-message');
            errors.forEach(err => err.remove());
            
            [name, email].forEach(field => {
                field.classList.remove('is-invalid', 'is-valid');
            });
            
            if (!name.value.trim() || name.value.trim().length < 2) {
                showPopupError(name, 'Name must be at least 2 characters');
                isValid = false;
            } else {
                name.classList.add('is-valid');
            }
            
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.value.trim()) {
                showPopupError(email, 'Email is required');
                isValid = false;
            } else if (!emailPattern.test(email.value)) {
                showPopupError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                email.classList.add('is-valid');
            }
            
            if (!terms.checked) {
                const termsError = document.createElement('div');
                termsError.className = 'error-message text-danger small mt-1';
                termsError.textContent = 'You must agree to receive promotional emails';
                terms.parentNode.appendChild(termsError);
                isValid = false;
            }
            
            if (isValid) {
                const successMsg = document.createElement('div');
                successMsg.className = 'alert alert-success mt-3';
                successMsg.innerHTML = '<strong>Success!</strong> Thank you for subscribing!';
                popupForm.appendChild(successMsg);
                
                setTimeout(() => {
                    popupForm.reset();
                    const success = popupForm.querySelector('.alert-success');
                    if (success) success.remove();
                    closePopup();
                }, 2000);
            }
        });
    }
    
    function closePopup() {
        if (popupOverlay) {
            popupOverlay.style.display = 'none';
            if (popupForm) {
                const errors = popupForm.querySelectorAll('.error-message');
                errors.forEach(err => err.remove());
                const success = popupForm.querySelector('.alert-success');
                if (success) success.remove();
                popupForm.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
                    el.classList.remove('is-invalid', 'is-valid');
                });
            }
        }
    }
    
    function showPopupError(element, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-danger small mt-1';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
        element.classList.add('is-invalid');
    }
});
