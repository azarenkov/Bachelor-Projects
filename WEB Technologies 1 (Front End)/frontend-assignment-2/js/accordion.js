document.addEventListener('DOMContentLoaded', function() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        
        if (header && content) {
            content.style.maxHeight = '0';
            content.style.overflow = 'hidden';
            content.style.transition = 'max-height 0.3s ease';
            
            header.addEventListener('click', function() {
                const isOpen = item.classList.contains('active');
                
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.accordion-content');
                        const otherIcon = otherItem.querySelector('.accordion-icon');
                        otherContent.style.maxHeight = '0';
                        if (otherIcon) {
                            otherIcon.textContent = '+';
                        }
                    }
                });
                
                if (isOpen) {
                    item.classList.remove('active');
                    content.style.maxHeight = '0';
                    if (icon) {
                        icon.textContent = '+';
                    }
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                    if (icon) {
                        icon.textContent = '−';
                    }
                }
            });
        }
    });
});
