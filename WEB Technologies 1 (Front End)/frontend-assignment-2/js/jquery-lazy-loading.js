$(document).ready(function() {
    initLazyLoading();
});

function initLazyLoading() {
    $('img').each(function() {
        const $img = $(this);
        
        if ($img.attr('data-lazy-loaded')) return;
        
        const src = $img.attr('src');
        
        $img.attr('data-src', src)
            .attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="Arial" font-size="16"%3ELoading...%3C/text%3E%3C/svg%3E')
            .addClass('lazy-load');
    });
    
    function checkLazyLoad() {
        $('.lazy-load').each(function() {
            const $img = $(this);
            const imgTop = $img.offset().top;
            const scrollTop = $(window).scrollTop() + $(window).height() + 100;
            
            if (scrollTop > imgTop) {
                const dataSrc = $img.attr('data-src');
                
                if (dataSrc) {
                    $img.attr('src', dataSrc)
                        .removeClass('lazy-load')
                        .attr('data-lazy-loaded', 'true')
                        .fadeIn(500);
                }
            }
        });
    }
    
    $(window).on('scroll', checkLazyLoad);
    $(window).on('resize', checkLazyLoad);
    
    checkLazyLoad();
}
