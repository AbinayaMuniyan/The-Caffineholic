// ============================================
// The Caffineholic - Interactive JavaScript
// ============================================

// Cart Management
let cart = [];
const TAX_RATE = 0.08;

// Menu Items Database
const menuItems = {
    'espresso': { name: 'Espresso Shot', price: 3.50 },
    'cappuccino': { name: 'Cappuccino', price: 4.75 },
    'caramel-latte': { name: 'Caramel Latte', price: 5.25 },
    'cold-brew': { name: 'Cold Brew', price: 4.50 },
    'macchiato': { name: 'Macchiato', price: 4.25 },
    'mocha': { name: 'Mocha Bliss', price: 5.50 },
    'americano': { name: 'Americano', price: 3.99 },
    'flat-white': { name: 'Flat White', price: 5.00 }
};

// ============================================
// DOM Elements
// ============================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const orderModal = document.getElementById('orderModal');
const closeModalBtn = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');
const cartItemsContainer = document.getElementById('cartItems');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const logo = document.getElementById('logo');
const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
const confirmationModal = document.getElementById('confirmationModal');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const orderMoreBtn = document.getElementById('orderMoreBtn');
const readyTimeBtn = document.getElementById('readyTimeBtn');
const thankYouToast = document.getElementById('thankYouToast');
const closeToastBtn = document.getElementById('closeToastBtn');
const historyLink = document.getElementById('historyLink');
const orderHistoryModal = document.getElementById('orderHistoryModal');
const orderHistoryBody = document.getElementById('orderHistoryBody');
const closeHistoryModalBtn = document.getElementById('closeHistoryModal');

// Back-to-home flow state
let backNavigateTimeout = null;
let backToastVisible = false;

// ============================================
// Mobile Menu Toggle
// ============================================
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenuBtn.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('#mobileMenu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.classList.remove('active');
    });
});

// ============================================
// Order Modal Functionality
// ============================================
document.getElementById('orderBtn').addEventListener('click', openOrderModal);
document.querySelectorAll('button:has(.fa-shopping-bag)').forEach(btn => {
    btn.addEventListener('click', openOrderModal);
});

closeModalBtn.addEventListener('click', closeOrderModal);
orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) closeOrderModal();
});

function openOrderModal() {
    orderModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    orderModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ============================================
// Order Confirmation Modal Functionality
// ============================================
proceedCheckoutBtn.addEventListener('click', handleProceedCheckoutClick);
backToHomeBtn.addEventListener('click', handleBackToHomeClick);
orderMoreBtn.addEventListener('click', orderMore);

// Close confirmation modal when clicking outside
confirmationModal.addEventListener('click', (e) => {
    if (e.target === confirmationModal) {
        confirmationModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});

// ============================================
// Thank You Toast Functionality
// ============================================
let toastTimeout;

// Note: Ready time button should be display-only per requirements.
// Previously the readyTimeBtn triggered the toast; that handler was removed.
closeToastBtn.addEventListener('click', closeThankYouToast);

// Close toast when clicking outside
thankYouToast.addEventListener('click', (e) => {
    if (e.target === thankYouToast) {
        closeThankYouToast();
    }
});

function showThankYouToast() {
    if (toastTimeout) clearTimeout(toastTimeout);
    thankYouToast.classList.remove('hidden');
    // Default duration 3000ms, allow override
    const duration = (arguments.length && typeof arguments[0] === 'number') ? arguments[0] : 3000;
    toastTimeout = setTimeout(() => {
        closeThankYouToast();
    }, duration);
}

function closeThankYouToast() {
    if (toastTimeout) clearTimeout(toastTimeout);
    thankYouToast.classList.add('hidden');
    // If there was a pending navigation scheduled from the Order Confirmed screen, cancel it
    if (backNavigateTimeout) {
        clearTimeout(backNavigateTimeout);
        backNavigateTimeout = null;
    }
    backToastVisible = false;
}

// ============================================
// Green Gradient Toast (shown on Home after navigation)
// ============================================
function showGreenGradientToastIfFlag() {
    try {
        const flag = sessionStorage.getItem('showThanksGradient');
        if (!flag) return;
        // Remove flag immediately so it only shows once
        sessionStorage.removeItem('showThanksGradient');
        showGreenGradientToast();
    } catch (e) {
        // ignore
    }
}

function showGreenGradientToast() {
    const el = document.createElement('div');
    el.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[70] rounded-full px-5 py-3 shadow-lg flex items-center gap-3 text-white font-semibold';
    el.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
    el.style.boxShadow = '0 8px 24px rgba(16,185,129,0.15)';
    el.innerHTML = `<i class="fas fa-check-circle"></i><span>Thanks for your order!</span>`;
    document.body.appendChild(el);

    setTimeout(() => {
        el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(-8px)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function showConfirmationModal() {
    // Close cart modal
    closeOrderModal();
    
    // Show confirmation modal
    confirmationModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Populate confirmation modal with current cart
    populateConfirmationModal();
    
    // Trigger confetti animation
    createConfetti();

    // Save order to history (snapshot of current cart)
    saveOrderToHistory(15);
}

function populateConfirmationModal() {
    const itemsContainer = document.getElementById('confirmationOrderItems');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    // Populate order items
    itemsContainer.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center pb-2 border-b border-caramel/20">
            <div class="flex-1">
                <p class="text-espresso font-semibold text-sm">${item.name}</p>
                <p class="text-dark-brown/60 text-xs">Qty: ${item.quantity}</p>
            </div>
            <p class="text-espresso font-bold text-sm">$${(item.price * item.quantity).toFixed(2)}</p>
        </div>
    `).join('');
    
    // Update totals in confirmation modal
    document.getElementById('confirmSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('confirmTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('confirmTotal').textContent = `$${total.toFixed(2)}`;
}

function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = ''; // Clear previous confetti
    
    // Create light confetti pieces (8-12 pieces for subtle effect)
    const confettiCount = Math.floor(Math.random() * 5) + 8;
    const colors = ['cream', 'green', 'caramel'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = `confetti-piece ${colors[Math.floor(Math.random() * colors.length)]}`;
        
        // Random positioning
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 4 + 4 + 'px'; // 4-8px
        confetti.style.height = confetti.style.width;
        confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation completes
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 3500);
}

function backToHome() {
    // Close confirmation modal
    confirmationModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Clear cart
    clearCart();
    
    // Scroll to home
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
    
    // Show success notification
    showNotification('✓ Order placed successfully! See you soon! ☕');
}

// New handler for modal Home button per requirements:
// - Show the small thank-you toast
// - Close the confirmation modal
// - Smooth-scroll to #home
// - Do NOT reopen the large confirmation modal
function handleBackToHomeClick() {
    // If the beige strip is already visible and navigation is pending, navigate immediately
    if (backToastVisible && backNavigateTimeout) {
        clearTimeout(backNavigateTimeout);
        backNavigateTimeout = null;
        doNavigateToHome();
        return;
    }

    // Show the small thank-you beige strip on the confirmation screen
    showThankYouToast(2500);
    backToastVisible = true;

    // Schedule navigation after a short delay (1s)
    backNavigateTimeout = setTimeout(() => {
        backNavigateTimeout = null;
        doNavigateToHome();
    }, 1000);
}

function doNavigateToHome() {
    // Set flag so Home shows green gradient toast once
    try { sessionStorage.setItem('showThanksGradient', '1'); } catch (e) {}

    // Close confirmation modal and restore scroll
    confirmationModal.classList.add('hidden');
    document.body.style.overflow = 'auto';

    // Smooth scroll to home
    const homeEl = document.getElementById('home');
    if (homeEl) homeEl.scrollIntoView({ behavior: 'smooth' });

    // Reset back-toast state
    backToastVisible = false;

    // On SPA, show the green gradient toast now if flag present
    setTimeout(() => {
        showGreenGradientToastIfFlag();
    }, 300);
}

// =============================
// Order History Persistence
// =============================
let orderHistory = [];

function loadOrderHistoryFromLocalStorage() {
    try {
        const saved = localStorage.getItem('caffineholicOrders');
        orderHistory = saved ? JSON.parse(saved) : [];
    } catch (err) {
        orderHistory = [];
    }
}

function saveOrderHistoryToLocalStorage() {
    localStorage.setItem('caffineholicOrders', JSON.stringify(orderHistory));
}

function saveOrderToHistory(etaMinutes = 15) {
    if (!cart || cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const order = {
        orderId: 'ORD' + Date.now(),
        dateTime: new Date().toISOString(),
        items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        subtotal: +subtotal.toFixed(2),
        tax,
        total,
        etaMinutes
    };

    // Add to the front (latest first)
    orderHistory.unshift(order);
    saveOrderHistoryToLocalStorage();
    renderOrderHistory();
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString();
}

function renderOrderHistory() {
    if (!orderHistoryBody) return;
    if (!orderHistory || orderHistory.length === 0) {
        orderHistoryBody.innerHTML = `
            <div class="p-6 text-center text-dark-brown/70">
                <p class="font-playfair text-lg text-espresso">No orders yet. Start your first coffee ☕</p>
            </div>
        `;
        return;
    }

    // Compact list: each row is a small card/row
    orderHistoryBody.innerHTML = orderHistory.map((order, idx) => `
        <div class="flex items-center justify-between p-3 bg-cream/90 rounded-lg border border-caramel/20">
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-sm text-dark-brown/70 truncate"><span class="font-semibold">${order.orderId}</span> — ${formatDateTime(order.dateTime)}</p>
                        <p class="text-xs text-dark-brown/50">Status: Completed</p>
                    </div>
                    <div class="text-right ml-3">
                        <p class="font-playfair text-lg font-bold text-espresso">$${order.total.toFixed(2)}</p>
                    </div>
                </div>
                <div class="order-row-details mt-2 hidden text-sm text-dark-brown/70">
                    ${order.items.map(it => `<div class="flex justify-between"><span>${it.name} × ${it.qty}</span><span>$${(it.price * it.qty).toFixed(2)}</span></div>`).join('')}
                    <div class="border-t border-caramel/20 pt-2 mt-2">
                        <div class="flex justify-between"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
                        <div class="flex justify-between"><span>Tax</span><span>$${order.tax.toFixed(2)}</span></div>
                        <div class="flex justify-between font-bold"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0 ml-3 flex flex-col gap-2">
                <button data-idx="${idx}" class="view-details-btn btn-secondary py-1 px-2 text-xs">View</button>
                <button data-idx="${idx}" class="reorder-btn btn-primary py-1 px-2 text-xs">Reorder</button>
            </div>
        </div>
    `).join('');

    // Attach event listeners within modal body
    orderHistoryBody.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = +btn.getAttribute('data-idx');
            const row = btn.closest('.flex.items-center');
            const details = row.querySelector('.order-row-details');
            if (details) details.classList.toggle('hidden');
        });
    });

    orderHistoryBody.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = +btn.getAttribute('data-idx');
            reorderFromHistory(idx);
        });
    });
}

function reorderFromHistory(idx) {
    const order = orderHistory[idx];
    if (!order) return;

    // Load items back into cart (replace current cart)
    cart = order.items.map((it, i) => ({ id: Date.now() + i, name: it.name, price: it.price, quantity: it.qty }));
    updateCart();
    showNotification('Order loaded to cart!');
    // Open order modal so user can review
    // Close history modal (if open), then open cart modal
    if (orderHistoryModal) orderHistoryModal.classList.add('hidden');
    openOrderModal();
}

function orderMore() {
    // Close confirmation modal
    confirmationModal.classList.add('hidden');
    
    // Clear cart
    clearCart();
    
    // Open order modal
    document.body.style.overflow = 'hidden';
    orderModal.classList.remove('hidden');
    
    // Show notification
    showNotification('✓ Cart cleared! Ready for your next order ☕');
}

function clearCart() {
    cart = [];
    updateCart();
}

// ============================================
// Add to Cart Functionality
// ============================================
addToCartButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.menu-item-card');
        const itemName = card.querySelector('h3').textContent;
        const itemPriceText = card.querySelector('.text-lg').textContent;
        const itemPrice = parseFloat(itemPriceText.replace('$', ''));
        
        addToCart(itemName, itemPrice);
        
        // Animate button
        const icon = btn.querySelector('i');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-check');
        btn.classList.add('bg-espresso');
        btn.classList.remove('bg-caramel');
        
        setTimeout(() => {
            icon.classList.add('fa-plus');
            icon.classList.remove('fa-check');
            btn.classList.remove('bg-espresso');
            btn.classList.add('bg-caramel');
        }, 2000);
        
        // Show quick notification
        showNotification(`${itemName} added to cart!`);
    });
});

function addToCart(itemName, itemPrice) {
    const existingItem = cart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            name: itemName,
            price: itemPrice,
            quantity: 1
        });
    }
    
    updateCart();
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}

function updateCart() {
    updateCartDisplay();
    saveCartToLocalStorage();
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 gap-3">
                <button id="emptyAddBtn" aria-label="Add items" class="w-10 h-10 rounded-full bg-caramel text-cream flex items-center justify-center hover:scale-105 hover:shadow-md transition-transform" title="Add items">
                    <i class="fas fa-plus"></i>
                </button>
                <p class="text-espresso text-md">Please add items to your order</p>
            </div>
        `;

        // Attach click handler to the + button to close modal and scroll to menu
        const emptyAddBtn = document.getElementById('emptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', () => {
                // Close the cart modal
                closeOrderModal();

                // Smooth scroll to the collections/menu section if present
                const target = document.getElementById('menu') || document.getElementById('collections');
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
                } else {
                    // Fallback: navigate to /collections if separate page (do not reload if same origin)
                    // Only change location if '/collections' differs from current path
                    if (window.location.pathname !== '/collections') {
                        // Do not force reload if the site is single-page; prefer scroll.
                        // If collections is a separate page, uncomment the next line to navigate.
                        // window.location.href = '/collections';
                    }
                }
            });
        }
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="bg-cream/90 rounded-lg p-4 flex justify-between items-center border border-caramel/30">
                <div class="flex-1">
                    <p class="font-playfair font-semibold text-espresso">${item.name}</p>
                    <p class="text-dark-brown/70 text-sm">$${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="decreaseQuantity(${item.id})" class="bg-caramel/30 text-caramel rounded px-2 py-1 hover:bg-caramel/50 transition">−</button>
                    <span class="text-espresso font-semibold w-6 text-center">${item.quantity}</span>
                    <button onclick="increaseQuantity(${item.id})" class="bg-caramel/30 text-caramel rounded px-2 py-1 hover:bg-caramel/50 transition">+</button>
                    <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700 transition ml-2">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateTotals();
}

function increaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1;
        updateCart();
    }
}

function decreaseQuantity(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(itemId);
        }
        updateCart();
    }
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;

    // Disable proceed button when cart is empty or total is zero
    if (typeof proceedCheckoutBtn !== 'undefined' && proceedCheckoutBtn) {
        const disabled = subtotal <= 0 || cart.length === 0;
        proceedCheckoutBtn.disabled = disabled;
        proceedCheckoutBtn.style.opacity = disabled ? '0.5' : '1';
        proceedCheckoutBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
}

// ============================================
// Contact Form Submission
// ============================================
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    // Simulate form submission
    btn.classList.add('loading');
    btn.disabled = true;
    
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        
        // Success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50';
        successMessage.textContent = '✓ Message sent successfully!';
        document.body.appendChild(successMessage);
        
        contactForm.reset();
        
        setTimeout(() => successMessage.remove(), 4000);
    }, 1500);
});

// ============================================
// Smooth Scroll Navigation
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// Scroll Animations
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all stagger items
document.querySelectorAll('.stagger-item, .feature-card, .menu-item-card').forEach(element => {
    element.classList.add('opacity-0');
    observer.observe(element);
});

// ============================================
// Logo Animation on Click
// ============================================
logo.addEventListener('click', () => {
    logo.classList.add('animate-bounce');
    setTimeout(() => logo.classList.remove('animate-bounce'), 600);
    
    // Scroll to home
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
});

// ============================================
// Notification System
// ============================================
function showNotification(message, duration = 2000) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-6 px-8 py-4 rounded-xl shadow-2xl animate-slide-in-right z-50 text-white font-poppins font-semibold text-lg';
    notification.style.background = 'linear-gradient(135deg, #10b981 0%, #f59e0b 100%)';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Handler that prevents opening confirmation modal when cart is empty
function handleProceedCheckoutClick(e) {
    // If button is disabled, ignore clicks
    if (proceedCheckoutBtn.disabled) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (!cart.length || subtotal <= 0) {
        showNotification('Please add items to your order ☕', 2500);
        return;
    }

    // Proceed normally
    showConfirmationModal();
}

// ============================================
// Parallax Effect on Scroll
// ============================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Subtle parallax effect
    const blobs = document.querySelectorAll('.animate-blob');
    blobs.forEach((blob, index) => {
        const speed = (index + 1) * 0.05;
        blob.style.transform = `translateY(${scrollY * speed}px)`;
    });
});

// ============================================
// Dark Mode Toggle (Optional)
// ============================================
function initializeDarkModeToggle() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
        // Optional: Add dark mode class to body
        // document.body.classList.add('dark-mode');
    }
}

// ============================================
// Local Storage Management
// ============================================
function saveCartToLocalStorage() {
    localStorage.setItem('caffineholictcart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('caffineholictcart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

// ============================================
// Performance Metrics
// ============================================
function logPageMetrics() {
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page Load Time: ${pageLoadTime}ms`);
    }
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromLocalStorage();
    initializeDarkModeToggle();
    logPageMetrics();
    
    // Add stagger animation class
    const cards = document.querySelectorAll('.menu-item-card');
    cards.forEach((card, index) => {
        card.classList.add('stagger-item');
    });
    
    // Add smooth transitions to all buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Close modals with Escape
        if (e.key === 'Escape') {
            if (!orderModal.classList.contains('hidden')) {
                closeOrderModal();
            } else if (!confirmationModal.classList.contains('hidden')) {
                confirmationModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }
        
        // Open order modal with 'O' key
        if (e.key === 'o' || e.key === 'O') {
            openOrderModal();
        }
    });
    
    console.log('The Caffineholic loaded successfully! ☕');
    // Load and render order history
    loadOrderHistoryFromLocalStorage();
    renderOrderHistory();

    // History link behavior: render then scroll
    if (historyLink) {
        historyLink.addEventListener('click', function(e) {
            e.preventDefault();
            // open history modal
            renderOrderHistory();
            if (orderHistoryModal) {
                orderHistoryModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    // Close history modal handlers
    if (closeHistoryModalBtn && orderHistoryModal) {
        closeHistoryModalBtn.addEventListener('click', () => {
            orderHistoryModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
        orderHistoryModal.addEventListener('click', (e) => {
            if (e.target === orderHistoryModal) {
                orderHistoryModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    }
    // If a navigation flag is present (e.g., from Order Confirmed), show the green toast on home
    showGreenGradientToastIfFlag();
});

// ============================================
// Utility Functions
// ============================================

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Advanced Features
// ============================================

// Product Filter (optional)
function filterMenuItems(category) {
    const menuCards = document.querySelectorAll('.menu-item-card');
    menuCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
            card.classList.add('animate-scale-up');
        } else {
            card.style.display = 'none';
        }
    });
}

// Search functionality
function searchMenu(query) {
    const menuCards = document.querySelectorAll('.menu-item-card');
    const lowerQuery = query.toLowerCase();
    
    menuCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
            card.style.display = 'block';
            card.classList.add('animate-fade-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// Rating functionality
function addProductRating(productId, rating) {
    console.log(`Product ${productId} rated ${rating} stars`);
    showNotification(`⭐ Thank you for rating!`);
}

// Subscribe to newsletter
function subscribeNewsletter(email) {
    if (email.includes('@')) {
        showNotification('✓ Successfully subscribed!');
        return true;
    } else {
        showNotification('✗ Please enter a valid email');
        return false;
    }
}

// ============================================
// Export Functions for External Use
// ============================================
window.caffineholictApp = {
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    openOrderModal,
    closeOrderModal,
    showConfirmationModal,
    showThankYouToast,
    closeThankYouToast,
    backToHome,
    orderMore,
    clearCart,
    filterMenuItems,
    searchMenu,
    addProductRating,
    subscribeNewsletter,
    formatCurrency
};