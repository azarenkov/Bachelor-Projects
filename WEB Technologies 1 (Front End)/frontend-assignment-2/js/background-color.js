const colors = [
    '#ffffff', // White
    '#ffcdd2', // Light Red
    '#f8bbd0', // Light Pink
    '#e1bee7', // Light Purple
    '#c5cae9', // Light Indigo
    '#bbdefb', // Light Blue
    '#b2dfdb', // Light Teal
    '#c8e6c9', // Light Green
    '#fff9c4', // Light Yellow
    '#ffe0b2'  // Light Orange
];

let currentColorIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const colorButton = document.getElementById('color-change-btn');
    
    if (colorButton) {
        colorButton.addEventListener('click', function() {
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            
            document.body.style.transition = 'background-color 0.5s ease';
            document.body.style.backgroundColor = colors[currentColorIndex];
            
            colorButton.style.transform = 'scale(1.1)';
            setTimeout(() => {
                colorButton.style.transform = 'scale(1)';
            }, 200);
            
            console.log('Background color changed to:', colors[currentColorIndex]);
        });
        
        colorButton.style.transition = 'transform 0.2s ease';
    }
});
