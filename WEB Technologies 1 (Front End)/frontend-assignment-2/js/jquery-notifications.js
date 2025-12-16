$(document).ready(function() {
    initNotificationSystem();
});

function initNotificationSystem() {
    if ($('#notification-container').length === 0) {
        $('body').append('<div id="notification-container"></div>');
    }
    
    $('.add-to-cart').on('click', function(e) {
        e.stopPropagation();
        showNotification('Item added to cart!', 'success');
    });
    
    $('.product-card').on('click', function() {
        showNotification('Viewing product details...', 'info');
    });
    
    $('form').on('submit', function(e) {
        setTimeout(function() {
            showNotification('Form submitted successfully!', 'success');
        }, 3100);
    });
}

function showNotification(message, type = 'info') {
    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    const icon = iconMap[type] || iconMap['info'];
    
    const $notification = $(`
        <div class="notification notification-${type}">
            <i class="fas ${icon} me-2"></i>
            <span>${message}</span>
        </div>
    `);
    
    $('#notification-container').append($notification);
    
    $notification.fadeIn(300);
    
    setTimeout(function() {
        $notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}

window.showNotification = showNotification;
