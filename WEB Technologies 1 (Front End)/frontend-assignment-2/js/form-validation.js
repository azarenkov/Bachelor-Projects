function validateContactForm(event) {
    event.preventDefault();
    
    let isValid = true;
    const form = event.target;
    
    const fullName = form.querySelector('#fullName');
    const email = form.querySelector('#email');
    const subject = form.querySelector('#subject');
    const message = form.querySelector('#message');
    
    clearErrors(form);
    
    if (!fullName.value.trim()) {
        showError(fullName, 'Full name is required');
        isValid = false;
    } else if (fullName.value.trim().length < 2) {
        showError(fullName, 'Full name must be at least 2 characters');
        isValid = false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        showError(email, 'Email address is required');
        isValid = false;
    } else if (!emailPattern.test(email.value)) {
        showError(email, 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!subject.value) {
        showError(subject, 'Please select a subject');
        isValid = false;
    }
    
    if (!message.value.trim()) {
        showError(message, 'Message is required');
        isValid = false;
    } else if (message.value.trim().length < 10) {
        showError(message, 'Message must be at least 10 characters');
        isValid = false;
    }
    
    if (isValid) {
        showSuccessMessage('Thank you! Your message has been sent successfully.');
        form.reset();
    }
    
    return isValid;
}

function validateCheckoutForm(event) {
    event.preventDefault();
    
    let isValid = true;
    const form = event.target;
    
    const firstName = form.querySelector('#firstName');
    const lastName = form.querySelector('#lastName');
    const emailAddress = form.querySelector('#emailAddress');
    const phoneNumber = form.querySelector('#phoneNumber');
    const address = form.querySelector('#address');
    const city = form.querySelector('#city');
    const region = form.querySelector('#region');
    const zipCode = form.querySelector('#zipCode');
    const cardNumber = form.querySelector('#cardNumber');
    const expiryDate = form.querySelector('#expiryDate');
    const cvv = form.querySelector('#cvv');
    const cardName = form.querySelector('#cardName');
    
    clearErrors(form);
    
    if (!firstName.value.trim()) {
        showError(firstName, 'First name is required');
        isValid = false;
    }
    
    if (!lastName.value.trim()) {
        showError(lastName, 'Last name is required');
        isValid = false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.value.trim()) {
        showError(emailAddress, 'Email address is required');
        isValid = false;
    } else if (!emailPattern.test(emailAddress.value)) {
        showError(emailAddress, 'Please enter a valid email address');
        isValid = false;
    }
    
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    if (!phoneNumber.value.trim()) {
        showError(phoneNumber, 'Phone number is required');
        isValid = false;
    } else if (!phonePattern.test(phoneNumber.value) || phoneNumber.value.replace(/\D/g, '').length < 10) {
        showError(phoneNumber, 'Please enter a valid phone number (at least 10 digits)');
        isValid = false;
    }
    
    if (!address.value.trim()) {
        showError(address, 'Street address is required');
        isValid = false;
    }
    
    if (!city.value.trim()) {
        showError(city, 'City is required');
        isValid = false;
    }
    
    if (!region.value.trim()) {
        showError(region, 'Region is required');
        isValid = false;
    }
    
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!zipCode.value.trim()) {
        showError(zipCode, 'ZIP code is required');
        isValid = false;
    } else if (!zipPattern.test(zipCode.value)) {
        showError(zipCode, 'Please enter a valid ZIP code');
        isValid = false;
    }
    
    const cardPattern = /^\d{13,19}$/;
    const cardOnly = cardNumber.value.replace(/\s/g, '');
    if (!cardNumber.value.trim()) {
        showError(cardNumber, 'Card number is required');
        isValid = false;
    } else if (!cardPattern.test(cardOnly)) {
        showError(cardNumber, 'Please enter a valid card number (13-19 digits)');
        isValid = false;
    }
    
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryDate.value.trim()) {
        showError(expiryDate, 'Expiry date is required');
        isValid = false;
    } else if (!expiryPattern.test(expiryDate.value)) {
        showError(expiryDate, 'Please enter valid expiry date (MM/YY)');
        isValid = false;
    }
    
    const cvvPattern = /^\d{3,4}$/;
    if (!cvv.value.trim()) {
        showError(cvv, 'CVV is required');
        isValid = false;
    } else if (!cvvPattern.test(cvv.value)) {
        showError(cvv, 'Please enter a valid CVV (3-4 digits)');
        isValid = false;
    }
    
    if (!cardName.value.trim()) {
        showError(cardName, 'Name on card is required');
        isValid = false;
    }
    
    if (isValid) {
        showSuccessMessage('Order placed successfully! Thank you for your purchase.');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
    
    return isValid;
}

function showError(element, message) {
    element.classList.add('is-invalid');
    element.classList.remove('is-valid');
    
    let errorDiv = element.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        element.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearErrors(form) {
    const invalidInputs = form.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    const errorMessages = form.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(msg => {
        msg.style.display = 'none';
    });
}

function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <strong>Success!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', validateContactForm);
    }
    
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', validateCheckoutForm);
    }
});
