const FilterState = {
    currentFilter: 'all',
    filterHistory: [],
    
    setFilter: function(category) {
        this.currentFilter = category;
        this.filterHistory.push(category);
    },
    
    getFilter: function() {
        return this.currentFilter;
    },
    
    getHistory: function() {
        return this.filterHistory;
    },
    
    clearHistory: function() {
        this.filterHistory = [];
    }
};

function initializeProductFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length === 0) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            FilterState.setFilter(category);
            filterProducts(category);

            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.transform = 'scale(1)';
            });
            this.classList.add('active');
            this.style.transform = 'scale(1.05)';
        });
    });
}

function filterProducts(category) {
    const productCards = document.querySelectorAll('.product-card');

    switch(category) {
        case 'all':
            productCards.forEach(card => {
                card.parentElement.style.display = 'block';
                animateElement(card, 'fadeIn');
            });
            break;
        case 'smartphones':
            productCards.forEach(card => {
                const productCategory = card.getAttribute('data-category');
                if (productCategory === 'smartphones') {
                    card.parentElement.style.display = 'block';
                    animateElement(card, 'fadeIn');
                } else {
                    card.parentElement.style.display = 'none';
                }
            });
            break;
        case 'laptops':
            productCards.forEach(card => {
                const productCategory = card.getAttribute('data-category');
                if (productCategory === 'laptops') {
                    card.parentElement.style.display = 'block';
                    animateElement(card, 'fadeIn');
                } else {
                    card.parentElement.style.display = 'none';
                }
            });
            break;
        case 'audio':
            productCards.forEach(card => {
                const productCategory = card.getAttribute('data-category');
                if (productCategory === 'audio') {
                    card.parentElement.style.display = 'block';
                    animateElement(card, 'fadeIn');
                } else {
                    card.parentElement.style.display = 'none';
                }
            });
            break;
        case 'wearables':
            productCards.forEach(card => {
                const productCategory = card.getAttribute('data-category');
                if (productCategory === 'wearables') {
                    card.parentElement.style.display = 'block';
                    animateElement(card, 'fadeIn');
                } else {
                    card.parentElement.style.display = 'none';
                }
            });
            break;
        default:
            productCards.forEach(card => {
                card.parentElement.style.display = 'block';
            });
    }
}

function animateElement(element, animationType) {
    element.classList.remove('fadeIn', 'slideDown', 'pulse', 'shake');
    
    element.classList.add(animationType);
    
    setTimeout(() => {
        element.classList.remove(animationType);
    }, 600);
}

document.addEventListener('DOMContentLoaded', initializeProductFilter);
