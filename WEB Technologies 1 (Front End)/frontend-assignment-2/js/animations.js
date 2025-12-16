function addAnimationStyles() {
    if (document.getElementById('advanced-animations')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'advanced-animations';
    styleElement.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                max-height: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                max-height: 500px;
                transform: translateY(0);
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        .fadeIn {
            animation: fadeIn 0.5s ease-out;
        }

        .slideDown {
            animation: slideDown 0.5s ease-out;
        }

        .pulse {
            animation: pulse 0.3s ease-in-out;
        }

        .shake {
            animation: shake 0.3s ease-in-out;
        }

        /* Smooth transitions for all interactive elements */
        .btn, .nav-link, .product-card, .rating-star {
            transition: all 0.3s ease;
        }

        .rating-star {
            cursor: pointer;
            font-size: 1.5rem;
            transition: transform 0.2s, color 0.2s;
        }

        .filter-btn {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .filter-btn.active {
            background-color: #0d6efd;
            color: white;
            border-color: #0d6efd;
        }
    `;
    document.head.appendChild(styleElement);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        addAnimationStyles();
        document.documentElement.style.scrollBehavior = 'smooth';
    });
} else {
    addAnimationStyles();
    document.documentElement.style.scrollBehavior = 'smooth';
}
