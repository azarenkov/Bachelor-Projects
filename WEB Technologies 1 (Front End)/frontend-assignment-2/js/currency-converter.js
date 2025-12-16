const EXCHANGE_API_KEY = 'f8e7c6d5b4a39281'; 
const EXCHANGE_API_URL = 'https://v6.exchangerate-api.com/v6/f8e7c6d5b4a39281/latest/USD';

const currencies = {
    USD: { symbol: '$', name: 'US Dollar' },
    KZT: { symbol: '₸', name: 'Tenge' },
    EUR: { symbol: '€', name: 'Euro' }
};

let exchangeRates = {
    USD: 1,
    KZT: 450, 
    EUR: 0.92
};

let currentCurrency = 'USD';

async function fetchExchangeRates() {
    try {
        const response = await fetch(EXCHANGE_API_URL);
        const data = await response.json();
        
        if (data.result === 'success') {
            exchangeRates = {
                USD: 1,
                KZT: data.conversion_rates.KZT,
                EUR: data.conversion_rates.EUR
            };
            console.log('Exchange rates updated:', exchangeRates);
        }
    } catch (error) {
        console.warn('Failed to fetch exchange rates, using fallback values:', error);
    }
}

window.formatPrice = function(price) {
    const rate = exchangeRates[currentCurrency];
    const symbol = currencies[currentCurrency].symbol;
    const convertedPrice = (price * rate).toFixed(currentCurrency === 'KZT' ? 0 : 2);
    return `${symbol}${convertedPrice}`;
};

window.getCurrentCurrency = function() {
    return {
        code: currentCurrency,
        symbol: currencies[currentCurrency].symbol,
        rate: exchangeRates[currentCurrency]
    };
};

function initCurrencyConverter() {
    fetchExchangeRates();
    
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && currencies[savedCurrency]) {
        currentCurrency = savedCurrency;
    }
    
    createCurrencySelector();
    
    setTimeout(() => {
        if (currentCurrency !== 'USD') {
            convertAllPrices(currentCurrency);
        }
    }, 200);
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (currentCurrency !== 'USD') {
                convertAllPrices(currentCurrency);
            }
        }, 100);
    });
}

function createCurrencySelector() {
    const navbar = document.querySelector('.navbar .container');
    if (!navbar) return;
    
    const currencySelector = document.createElement('div');
    currencySelector.className = 'currency-selector ms-3';
    currencySelector.innerHTML = `
        <select id="currency-select" class="form-select form-select-sm" style="width: auto; display: inline-block;">
            <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>$ USD</option>
            <option value="KZT" ${currentCurrency === 'KZT' ? 'selected' : ''}>₸ KZT</option>
            <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>€ EUR</option>
        </select>
    `;
    
    const navbarCollapse = navbar.querySelector('.navbar-collapse');
    if (navbarCollapse) {
        navbarCollapse.appendChild(currencySelector);
    }
    
    const select = document.getElementById('currency-select');
    if (select) {
        select.addEventListener('change', handleCurrencyChange);
    }
}

function handleCurrencyChange(event) {
    const newCurrency = event.target.value;
    currentCurrency = newCurrency;
    
    localStorage.setItem('selectedCurrency', newCurrency);
    
    convertAllPrices(newCurrency);
    
    if (typeof loadCheckoutData === 'function') {
        loadCheckoutData();
    }
}

function convertAllPrices(toCurrency) {
    const rate = exchangeRates[toCurrency];
    const symbol = currencies[toCurrency].symbol;
    
    document.querySelectorAll('.price').forEach(priceElement => {
        convertElement(priceElement, rate, symbol, toCurrency);
    });
    
    document.querySelectorAll('.current-price').forEach(priceElement => {
        convertElement(priceElement, rate, symbol, toCurrency);
    });
    
    document.querySelectorAll('.original-price').forEach(priceElement => {
        convertElement(priceElement, rate, symbol, toCurrency);
    });
    
    const checkoutElements = ['subtotal', 'tax', 'shipping', 'total'];
    checkoutElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            convertElement(element, rate, symbol, toCurrency);
        }
    });
    
    document.querySelectorAll('.item-price').forEach(priceElement => {
        convertElement(priceElement, rate, symbol, toCurrency);
    });
}

function convertElement(element, rate, symbol, toCurrency) {
    const originalPrice = parseFloat(element.getAttribute('data-original-price'));
    if (originalPrice) {
        const convertedPrice = (originalPrice * rate).toFixed(toCurrency === 'KZT' ? 0 : 2);
        element.textContent = `${symbol}${convertedPrice}`;
    } else {
        const currentText = element.textContent.replace(/[$₸€,]/g, '');
        const currentPrice = parseFloat(currentText);
        if (!isNaN(currentPrice)) {
            element.setAttribute('data-original-price', currentPrice);
            const convertedPrice = (currentPrice * rate).toFixed(toCurrency === 'KZT' ? 0 : 2);
            element.textContent = `${symbol}${convertedPrice}`;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrencyConverter);
} else {
    initCurrencyConverter();
}
