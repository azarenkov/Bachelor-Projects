function initializeKeyboardNavigation() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    if (navLinks.length === 0) return;

    let currentIndex = -1;

    navLinks.forEach((link, index) => {
        if (link.classList.contains('active')) {
            currentIndex = index;
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % navLinks.length;
            navLinks[currentIndex].focus();
            animateElement(navLinks[currentIndex], 'pulse');
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + navLinks.length) % navLinks.length;
            navLinks[currentIndex].focus();
            animateElement(navLinks[currentIndex], 'pulse');
        }
        else if (e.key === 'Enter' && document.activeElement.classList.contains('nav-link')) {
            e.preventDefault();
            document.activeElement.click();
        }
    });
}

function animateElement(element, animationType) {
    element.classList.remove('fadeIn', 'slideDown', 'pulse', 'shake');
    
    element.classList.add(animationType);
    
    setTimeout(() => {
        element.classList.remove(animationType);
    }, 600);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Keyboard shortcuts: Left/Right Arrow to navigate menu');
    initializeKeyboardNavigation();
});
