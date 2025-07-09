// Global utility functions and interactive features

// Toast notification system
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="closeToast(this)"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function closeToast(button) {
    const toast = button.closest('.toast');
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
}

// Loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Please wait...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Form validation helper
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
        
        // Email validation
        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                input.classList.add('is-invalid');
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// Image lazy loading
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleSearch, 300));
    });
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchableItems = document.querySelectorAll('.searchable-item');
    
    searchableItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
            highlightSearchTerm(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
}

function highlightSearchTerm(element, term) {
    if (!term) return;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const text = element.innerHTML;
    element.innerHTML = text.replace(regex, '<mark>$1</mark>');
}

// Debounce function
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

// Shopping cart utilities
function updateCartCount(increment = 1) {
    const cartBadge = document.getElementById('cartCountBadge');
    if (cartBadge) {
        let currentCount = parseInt(cartBadge.textContent) || 0;
        currentCount += increment;
        cartBadge.textContent = currentCount;
        
        if (currentCount > 0) {
            cartBadge.classList.remove('d-none');
        } else {
            cartBadge.classList.add('d-none');
        }
    }
}

// Wishlist functionality
function toggleWishlist(productId) {
    const heartIcon = event.target;
    const isWishlisted = heartIcon.classList.contains('fas');
    
    if (isWishlisted) {
        heartIcon.classList.remove('fas', 'text-danger');
        heartIcon.classList.add('far');
        showToast('Removed from wishlist', 'info');
    } else {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas', 'text-danger');
        showToast('Added to wishlist', 'success');
    }
    
    // Here you would typically make an API call to update the wishlist
    // saveWishlistState(productId, !isWishlisted);
}

// Local storage helpers
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

// Performance optimization
function optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
        
        img.addEventListener('error', function() {
            this.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
            this.classList.add('error');
        });
    });
}

// Add scroll progress indicator
function addScrollProgressIndicator() {
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.innerHTML = '<div class="scroll-progress"></div>';
    document.body.appendChild(scrollIndicator);
    
    const scrollProgress = document.querySelector('.scroll-progress');
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });
}

// Fix page loading issues
function initializePageLoading() {
    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'page-loading';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingOverlay);
    
    // Remove loading overlay when page is fully loaded
    const hideLoadingOverlay = () => {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            }, 300);
        }
    };
    
    // Use multiple events to ensure loading is hidden
    if (document.readyState === 'complete') {
        setTimeout(hideLoadingOverlay, 100);
    } else {
        window.addEventListener('load', hideLoadingOverlay);
        document.addEventListener('DOMContentLoaded', hideLoadingOverlay);
    }
}

// Enhanced navigation highlighting
function highlightActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Smooth page transitions with loading spinner
function addPageTransitions() {
    const links = document.querySelectorAll('a[href^="/"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a hash link, external link, or has special attributes
            if (href.startsWith('#') || href.includes('http') || this.hasAttribute('data-no-transition')) {
                return;
            }
            
            // Skip if it's a form submit or has special handlers
            if (this.closest('form') || this.hasAttribute('onclick')) {
                return;
            }
            
            e.preventDefault();
            
            // Show loading spinner
            showNavigationLoading();
            
            // Navigate after animation
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
}

// Show loading spinner for navigation
function showNavigationLoading() {
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'navigationLoader';
    loadingSpinner.className = 'navigation-loading';
    loadingSpinner.innerHTML = `
        <div class="navigation-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    document.body.appendChild(loadingSpinner);
    
    // Auto-hide after 5 seconds (fallback)
    setTimeout(() => {
        const loader = document.getElementById('navigationLoader');
        if (loader) {
            loader.remove();
        }
    }, 5000);
}

// Enhanced cart functionality
function enhanceCartFeatures() {
    const cartBadge = document.getElementById('cartCountBadge');
    
    if (cartBadge) {
        // Add pulse animation when cart count changes
        const originalAddToCart = window.AddToCart;
        window.AddToCart = function(productId) {
            if (originalAddToCart) {
                return originalAddToCart(productId).then(() => {
                    cartBadge.classList.add('animate-pulse');
                    setTimeout(() => {
                        cartBadge.classList.remove('animate-pulse');
                    }, 1000);
                });
            }
        };
    }
}

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize interactive features
    lazyLoadImages();
    initializeSearch();
    optimizeImages();
    
    // Add loading states to buttons
    const buttons = document.querySelectorAll('.btn[data-loading]');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
            this.disabled = true;
            
            // Reset after 3 seconds (adjust based on your needs)
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 3000);
        });
    });
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => observer.observe(card));
    
    // Add ripple effect to buttons
    const rippleButtons = document.querySelectorAll('.btn');
    rippleButtons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Initialize page loading
    initializePageLoading();
    
    // Add scroll progress indicator
    addScrollProgressIndicator();
    
    // Highlight active navigation
    highlightActiveNavigation();
    
    // Add page transitions
    addPageTransitions();
    
    // Enhance cart features
    enhanceCartFeatures();
    
    // Fix common issues
    fixCommonIssues();
    
    // Add fallback for missing functions
    if (typeof showToast === 'undefined') {
        window.showToast = function(message, type = 'info') {
            console.log(`Toast: ${message} (${type})`);
        };
    }
});

// Fix common issues function
function fixCommonIssues() {
    // Fix missing image sources
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.src || img.src.includes('undefined')) {
            img.src = 'https://via.placeholder.com/300x200?text=No+Image';
        }
        
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
        };
    });
    
    // Fix form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            }
        });
    });
    
    // Fix cart badge visibility
    const cartBadge = document.getElementById('cartCountBadge');
    if (cartBadge) {
        const count = parseInt(cartBadge.textContent) || 0;
        if (count <= 0) {
            cartBadge.classList.add('d-none');
        } else {
            cartBadge.classList.remove('d-none');
        }
    }
}

// Ripple effect for buttons
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Easy login function for development
function easyLogin() {
    console.log("Easy login clicked");
    // This would be used for development/testing purposes
    // You can implement actual login logic here
}

// Add CSS for animations and effects
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeIn 0.6s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-out {
        animation: fadeOut 0.3s ease-in-out;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .navigation-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-in-out;
    }
    
    .navigation-spinner {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .loading-spinner {
        text-align: center;
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .loaded {
        opacity: 1;
    }
    
    .error {
        opacity: 0.7;
        filter: grayscale(1);
    }
    
    mark {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 3px;
    }
    
    .animate-pulse {
        animation: pulse 1s ease-in-out;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    .scroll-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(0,0,0,0.1);
        z-index: 1000;
    }
    
    .scroll-progress {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #28a745);
        transition: width 0.3s ease;
    }
`;

document.head.appendChild(style);

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e);
    // You could send this to a logging service
});

// Performance monitoring
function monitorPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }
}

// Initialize performance monitoring
monitorPerformance();