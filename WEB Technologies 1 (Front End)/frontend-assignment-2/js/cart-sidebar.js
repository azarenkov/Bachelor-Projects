function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-badge');
    
    if (badge) {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        
        if (sidebar.classList.contains('open')) {
            renderCartItems();
        }
    }
}

function closeCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
}

function updateQuantity(productId, change) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        saveCart(cart);
    }
}

function removeFromCart(productId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== productId);
    saveCart(filteredCart);
}

function calculateTotals() {
    const cart = getCart();
    
    const subtotal = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 0 ? 10 : 0; // $10 flat shipping
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
}

function formatCartPrice(price) {
    if (typeof window.formatPrice === 'function') {
        return window.formatPrice(price);
    }
    return `$${price.toFixed(2)}`;
}

function renderCartItems() {
    const cart = getCart();
    const cartBody = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartFooter = document.querySelector('.cart-footer');
    
    if (!cartBody) return;
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartBody.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartBody.style.display = 'block';
    if (cartFooter) cartFooter.style.display = 'block';
    
    // Determine if we're in pages folder or root
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    
    cartBody.innerHTML = cart.map(item => {
        // Adjust image path based on current page location
        let imagePath = item.image;
        if (!isInPagesFolder && imagePath.startsWith('../')) {
            // We're in root, but image path is from pages folder
            imagePath = imagePath.replace('../', '');
        } else if (isInPagesFolder && !imagePath.startsWith('../')) {
            // We're in pages folder, but image path is from root
            imagePath = '../' + imagePath;
        }
        
        return `
        <div class="cart-item">
            <img src="${imagePath}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price" data-original-price="${item.price}">
                    ${formatCartPrice(item.price)}
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    updateCartTotals();
}

function updateCartTotals() {
    const { subtotal, tax, shipping, total } = calculateTotals();
    
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) {
        subtotalEl.setAttribute('data-original-price', subtotal.toFixed(2));
        subtotalEl.textContent = formatCartPrice(subtotal);
    }
    if (taxEl) {
        taxEl.setAttribute('data-original-price', tax.toFixed(2));
        taxEl.textContent = formatCartPrice(tax);
    }
    if (shippingEl) {
        shippingEl.setAttribute('data-original-price', shipping.toFixed(2));
        shippingEl.textContent = formatCartPrice(shipping);
    }
    if (totalEl) {
        totalEl.setAttribute('data-original-price', total.toFixed(2));
        totalEl.textContent = formatCartPrice(total);
    }
}

function goToCheckout() {
    const cart = getCart();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const checkoutPath = isInPagesFolder ? 'checkout.html' : 'pages/checkout.html';
    
    window.location.href = checkoutPath;
}

function initCartSidebar() {
    if (!document.getElementById('cart-sidebar')) {
        const cartHTML = `
            <div id="cart-overlay" class="cart-overlay" onclick="closeCart()"></div>
            <div id="cart-sidebar" class="cart-sidebar">
                <div class="cart-header">
                    <h3><i class="fas fa-shopping-cart me-2"></i>Your Cart</h3>
                    <button class="cart-close" onclick="closeCart()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cart-body">
                    <div id="cart-empty" class="cart-empty">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your cart is empty</p>
                    </div>
                    <div id="cart-items" style="display: none;"></div>
                </div>
                <div class="cart-footer" style="display: none;">
                    <div class="cart-summary">
                        <div class="cart-summary-row">
                            <span class="cart-summary-label">Subtotal:</span>
                            <span class="cart-summary-value" id="cart-subtotal">$0.00</span>
                        </div>
                        <div class="cart-summary-row">
                            <span class="cart-summary-label">Tax (10%):</span>
                            <span class="cart-summary-value" id="cart-tax">$0.00</span>
                        </div>
                        <div class="cart-summary-row">
                            <span class="cart-summary-label">Shipping:</span>
                            <span class="cart-summary-value" id="cart-shipping">$0.00</span>
                        </div>
                        <div class="cart-summary-row total">
                            <span class="cart-summary-label">Total:</span>
                            <span class="cart-summary-value" id="cart-total">$0.00</span>
                        </div>
                    </div>
                    <button class="cart-checkout-btn" onclick="goToCheckout()">
                        <i class="fas fa-credit-card me-2"></i>Proceed to Checkout
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }
    
    updateCartBadge();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
        }
    });
}

window.addEventListener('load', function() {
    initCartSidebar();
    
    if (typeof window.getCurrentCurrency === 'function') {
        const observer = new MutationObserver(function() {
            if (document.getElementById('cart-sidebar')?.classList.contains('open')) {
                renderCartItems();
            }
        });
        
        const currencySelector = document.querySelector('.currency-selector');
        if (currencySelector) {
            observer.observe(currencySelector, { childList: true, subtree: true });
        }
    }
});

window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.goToCheckout = goToCheckout;
