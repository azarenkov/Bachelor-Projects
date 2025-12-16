$(document).ready(function() {
    initCopyToClipboard();
    setTimeout(initCopyToClipboard, 500);
    setTimeout(initCopyToClipboard, 1000);
    setTimeout(initCopyToClipboard, 2000);
});

$(window).on('load', function() {
    setTimeout(initCopyToClipboard, 500);
});

function initCopyToClipboard() {
    const $productTitle = $('#product-title');
    
    if ($productTitle.length && !$productTitle.find('.copy-btn').length) {
        console.log('Adding copy button to product title');
        
        $productTitle.css({
            'position': 'relative',
            'display': 'inline-block',
            'padding-right': '45px'
        });
        
        const $copyBtn = $('<button class="copy-btn" title="Copy product name"><i class="fas fa-copy"></i></button>');
        $productTitle.append($copyBtn);
        
        console.log('Copy button added successfully');
    }
    
    if (!$(document).data('copy-handler-set')) {
        $(document).on('click', '.copy-btn', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const $btn = $(this);
            const $parent = $btn.parent();
            const text = $parent.clone().find('.copy-btn').remove().end().text().trim();
            
            console.log('Copying text:', text);
            
            navigator.clipboard.writeText(text).then(function() {
                $btn.html('<i class="fas fa-check"></i>');
                $btn.attr('title', 'Copied to clipboard!');
                
                if (typeof showNotification === 'function') {
                    showNotification('Product name copied to clipboard!', 'success');
                }
                
                setTimeout(function() {
                    $btn.html('<i class="fas fa-copy"></i>');
                    $btn.attr('title', 'Copy product name');
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy:', err);
                if (typeof showNotification === 'function') {
                    showNotification('Failed to copy!', 'error');
                }
            });
        });
        
        $(document).data('copy-handler-set', true);
    }
}
