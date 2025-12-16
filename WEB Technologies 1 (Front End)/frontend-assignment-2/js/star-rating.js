function initializeRatingSystem() {
    const ratingContainer = document.querySelector('.product-rating-container');
    if (!ratingContainer) return;

    const stars = document.querySelectorAll('.rating-star');
    let currentRating = 0;
    
    // Get product ID from sessionStorage
    const productData = JSON.parse(sessionStorage.getItem('selectedProduct') || '{}');
    const productId = productData.id || 'default';
    
    // Load saved rating from localStorage
    const savedRating = loadRating(productId);
    if (savedRating) {
        currentRating = savedRating;
        updateStars(stars, currentRating);
        const ratingText = document.querySelector('.user-rating-text');
        if (ratingText) {
            ratingText.textContent = `Your rating: ${currentRating}/5`;
            ratingText.style.color = '#ffc107';
        }
    }

    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            currentRating = index + 1;
            updateStars(stars, currentRating);
            
            saveRating(productId, currentRating);

            const ratingText = document.querySelector('.user-rating-text');
            if (ratingText) {
                ratingText.textContent = `Your rating: ${currentRating}/5`;
                ratingText.style.color = '#ffc107';
            }
        });

        star.addEventListener('mouseenter', function() {
            updateStars(stars, index + 1);
        });
    });

    ratingContainer.addEventListener('mouseleave', function() {
        updateStars(stars, currentRating);
    });
}

function updateStars(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffc107';
            star.style.transform = 'scale(1.2)';
        } else {
            star.style.color = '#ddd';
            star.style.transform = 'scale(1)';
        }
    });
}

// Save rating to localStorage
function saveRating(productId, rating) {
    try {
        const ratings = JSON.parse(localStorage.getItem('productRatings') || '{}');
        ratings[productId] = {
            rating: rating,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('productRatings', JSON.stringify(ratings));
        console.log(`Rating saved for product ${productId}: ${rating} stars`);
    } catch (error) {
        console.error('Error saving rating:', error);
    }
}

// Load rating from localStorage
function loadRating(productId) {
    try {
        const ratings = JSON.parse(localStorage.getItem('productRatings') || '{}');
        return ratings[productId]?.rating || 0;
    } catch (error) {
        console.error('Error loading rating:', error);
        return 0;
    }
}

document.addEventListener('DOMContentLoaded', initializeRatingSystem);
