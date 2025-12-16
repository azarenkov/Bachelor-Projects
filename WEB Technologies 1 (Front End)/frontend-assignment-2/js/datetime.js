function updateDateTime() {
    const dateTimeElement = document.getElementById('current-datetime');
    
    if (dateTimeElement) {
        const now = new Date();
        
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        const formattedDateTime = now.toLocaleString('en-US', options);
        dateTimeElement.textContent = formattedDateTime;
        
        dateTimeElement.style.opacity = '0.7';
        setTimeout(() => {
            dateTimeElement.style.opacity = '1';
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000); 
    
    const dateTimeElement = document.getElementById('current-datetime');
    if (dateTimeElement) {
        dateTimeElement.style.transition = 'opacity 0.3s ease';
    }
});
