function initializeReadMore() {
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.getElementById(targetId);
            
            if (content) {
                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    animateElement(content, 'slideDown');
                    this.innerHTML = '<i class="fas fa-chevron-up me-2"></i>Read Less';
                } else {
                    content.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-chevron-down me-2"></i>Read More';
                }
            }
        });
    });
}

function animateElement(element, animationType) {
    element.classList.remove('fadeIn', 'slideDown', 'pulse', 'shake');
    
    element.classList.add(animationType);
    
    setTimeout(() => {
        element.classList.remove(animationType);
    }, 600);
}

document.addEventListener('DOMContentLoaded', initializeReadMore);
