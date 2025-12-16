$(document).ready(function() {
    initProductSearch();
    initAutocomplete();
    initSearchHighlight();
});

function initProductSearch() {
    const $searchInput = $('#product-search');
    const $productCards = $('.product-card');
    
    if ($searchInput.length && $productCards.length) {
        $searchInput.on('keyup', function() {
            const searchTerm = $(this).val().toLowerCase();
            
            $productCards.each(function() {
                const $card = $(this);
                const productName = $card.find('.card-title').text().toLowerCase();
                const productPrice = $card.find('.price').text().toLowerCase();
                
                if (productName.includes(searchTerm) || productPrice.includes(searchTerm)) {
                    $card.parent().fadeIn(300);
                } else {
                    $card.parent().fadeOut(300);
                }
            });
        });
    }
}

function initAutocomplete() {
    const products = [
        'Premium Smartphone',
        'Gaming Laptop',
        'Pro Tablet',
        'Digital Camera',
        'Wireless Headphones',
        'Smart Watch'
    ];
    
    const $searchInput = $('#product-search');
    
    if ($searchInput.length) {
        $searchInput.after('<ul id="autocomplete-list" class="autocomplete-suggestions"></ul>');
        
        $searchInput.on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            const $autocompleteList = $('#autocomplete-list');
            
            $autocompleteList.empty();
            
            if (searchTerm.length > 0) {
                const matches = products.filter(product => 
                    product.toLowerCase().includes(searchTerm)
                );
                
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const $li = $('<li>').text(match).addClass('autocomplete-item');
                        $li.on('click', function() {
                            $searchInput.val(match);
                            $autocompleteList.empty().hide();
                            $searchInput.trigger('keyup');
                        });
                        $autocompleteList.append($li);
                    });
                    $autocompleteList.show();
                } else {
                    $autocompleteList.hide();
                }
            } else {
                $autocompleteList.hide();
            }
        });
        
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#product-search, #autocomplete-list').length) {
                $('#autocomplete-list').hide();
            }
        });
    }
}

function initSearchHighlight() {
    if ($('.about-hero').length || $('.team-section').length) {
        const searchHTML = `
            <div class="container my-4">
                <div class="row">
                    <div class="col-12 col-md-8 mx-auto">
                        <input type="text" id="highlight-search" class="form-control" 
                            placeholder="Search and highlight text..." />
                        <button id="clear-highlight" class="btn btn-sm btn-secondary mt-2">Clear Highlights</button>
                    </div>
                </div>
            </div>`;
        $('.about-hero, .team-section').first().after(searchHTML);
    }
    
    $('#highlight-search').on('keyup', function() {
        const searchTerm = $(this).val();
        
        $('.highlighted-text').contents().unwrap();
        
        if (searchTerm.length > 2) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            
            $('p, h1, h2, h3, h4, h5, li').each(function() {
                const $element = $(this);
                
                if ($element.find('input, script').length > 0) return;
                
                const html = $element.html();
                const newHtml = html.replace(regex, '<span class="highlighted-text">$1</span>');
                
                if (html !== newHtml) {
                    $element.html(newHtml);
                }
            });
        }
    });
    
    $('#clear-highlight').on('click', function() {
        $('.highlighted-text').contents().unwrap();
        $('#highlight-search').val('');
    });
}
