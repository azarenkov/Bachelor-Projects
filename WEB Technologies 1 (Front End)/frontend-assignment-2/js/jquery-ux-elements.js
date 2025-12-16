$(document).ready(function() {
    initScrollProgressBar();
    initAnimatedCounter();
    initLoadingSpinner();
});

function initScrollProgressBar() {
    $('body').prepend('<div id="scroll-progress-bar"></div>');
    
    $(window).on('scroll', function() {
        const winScroll = $(this).scrollTop();
        const height = $(document).height() - $(window).height();
        const scrolled = (winScroll / height) * 100;
        
        $('#scroll-progress-bar').css('width', scrolled + '%');
    });
}

function initAnimatedCounter() {
    if ($('.hero').length && !$('#stats-counter').length) {
        const statsHTML = `
            <section class="py-5 bg-light" id="stats-counter">
                <div class="container">
                    <div class="row text-center">
                        <div class="col-md-3 col-6 mb-4">
                            <div class="stat-box">
                                <h3 class="counter" data-target="1000">0</h3>
                                <p>Happy Customers</p>
                            </div>
                        </div>
                        <div class="col-md-3 col-6 mb-4">
                            <div class="stat-box">
                                <h3 class="counter" data-target="500">0</h3>
                                <p>Products Sold</p>
                            </div>
                        </div>
                        <div class="col-md-3 col-6 mb-4">
                            <div class="stat-box">
                                <h3 class="counter" data-target="50">0</h3>
                                <p>5-Star Reviews</p>
                            </div>
                        </div>
                        <div class="col-md-3 col-6 mb-4">
                            <div class="stat-box">
                                <h3 class="counter" data-target="25">0</h3>
                                <p>Awards Won</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;
        $('.features').before(statsHTML);
    }
    
    function animateCounter($counter) {
        const target = parseInt($counter.attr('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            $counter.text(Math.floor(current) + '+');
        }, 16);
    }
    
    let counterAnimated = false;
    $(window).on('scroll', function() {
        const $statsSection = $('#stats-counter');
        if ($statsSection.length && !counterAnimated) {
            const sectionTop = $statsSection.offset().top;
            const scrollTop = $(window).scrollTop() + $(window).height();
            
            if (scrollTop > sectionTop) {
                $('.counter').each(function() {
                    animateCounter($(this));
                });
                counterAnimated = true;
            }
        }
    });
}

function initLoadingSpinner() {
    $('form').on('submit', function(e) {
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');

        if (!$submitBtn.hasClass('loading')) {
            const originalText = $submitBtn.html();
            
            $submitBtn.addClass('loading')
                .prop('disabled', true)
                .html('<span class="spinner-border spinner-border-sm me-2"></span>Please wait...');
            
            setTimeout(function() {
                $submitBtn.removeClass('loading')
                    .prop('disabled', false)
                    .html(originalText);
            }, 3000);
        }
    });
}
