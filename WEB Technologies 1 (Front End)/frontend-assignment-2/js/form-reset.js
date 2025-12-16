function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

function initializeFormReset() {
    const resetButton = document.querySelector('.reset-form-btn');
    if (!resetButton) return;

    resetButton.addEventListener('click', function(e) {
        e.preventDefault();

        const inputs = document.querySelectorAll('#checkout-form input, #checkout-form select');

        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
            input.classList.remove('is-valid', 'is-invalid');
        });

        playSound('success');

        const message = document.createElement('div');
        message.className = 'alert alert-success mt-3';
        message.innerHTML = '<i class="fas fa-check-circle me-2"></i>Form has been reset!';
        message.style.animation = 'fadeIn 0.5s';

        const form = document.querySelector('#checkout-form');
        form.parentNode.insertBefore(message, form);

        setTimeout(() => {
            message.style.animation = 'fadeOut 0.5s';
            setTimeout(() => message.remove(), 500);
        }, 3000);
    });
}

document.addEventListener('DOMContentLoaded', initializeFormReset);
