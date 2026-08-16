// ==========================================
// FIREBASE WEB APP CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBdQTvvvu2AhL9iIntzhHHTJ_Ru33MW-Lk",
    authDomain: "ghosh-technology.firebaseapp.com",
    projectId: "ghosh-technology",
    storageBucket: "ghosh-technology.firebasestorage.app",
    messagingSenderId: "205502617306",
    appId: "1:205502617306:web:9042b9f106130e24f8f7e3"
};

// Fallback Sample Products (Used if offline or if Firestore is empty)
const sampleProducts = [
    { id: "1", name: "Normal Rice", price: 60, weight: "1", unit: "kg", category: "Grains", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300" },
    { id: "2", name: "Basmati Rice", price: 90, weight: "1", unit: "kg", category: "Grains", image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300" },
    { id: "3", name: "Wheat Flour", price: 50, weight: "1", unit: "kg", category: "Grains", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300" },
    { id: "4", name: "Sugar", price: 45, weight: "1", unit: "kg", category: "Pantry", image: "https://images.unsplash.com/photo-1581441363689-1f3c3c342617?w=300" },
    { id: "5", name: "Biscuits", price: 20, weight: "1", unit: "pack", category: "Snacks", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
    { id: "6", name: "Tea", price: 120, weight: "250", unit: "g", category: "Snacks", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300" }
];

// App State
let products = [...sampleProducts];
let cart = JSON.parse(localStorage.getItem('ghosh_shop_cart')) || [];
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const searchInput = document.getElementById('search-input');
const categoryFilters = document.getElementById('category-filters');
const checkoutForm = document.getElementById('checkout-form');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to load products from Firebase Firestore
    await loadProductsFromFirebase();

    renderProducts();
    updateCartUI();

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderProducts();
    });

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            renderProducts();
        }
    });

    cartBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.add('hidden');
    });

    checkoutForm.addEventListener('submit', handleWhatsAppCheckout);
});

// Load Products from Firestore "Products" Collection
async function loadProductsFromFirebase() {
    try {
        // Import Firebase modules dynamically using CDN ESM builds
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getFirestore, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        const querySnapshot = await getDocs(collection(db, "Products"));
        const firebaseProducts = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            firebaseProducts.push({
                id: docSnap.id,
                name: data.name || "Unnamed Product",
                price: Number(data.price) || 0,
                weight: data.weight || "1",
                unit: data.unit || "unit",
                category: data.category || "Pantry",
                image: data.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"
            });
        });

        if (firebaseProducts.length > 0) {
            products = firebaseProducts;
            console.log("Successfully loaded products from Firestore!");
        }
    } catch (error) {
        console.warn("Could not load from Firebase, falling back to sample products:", error);
    }
}

// Render Products based on filters
function renderProducts() {
    productGrid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6B7280; padding: 2rem;">No products found.</p>';
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            <div>
                <div class="product-name">${product.name}</div>
                <div class="product-weight">${product.weight} ${product.unit}</div>
            </div>
            <div class="product-footer">
                <span class="product-price">₹${product.price}</span>
                <button class="add-btn" onclick="addToCart('${product.id}')">Add</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// Cart Management
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveAndRefreshCart();
}

window.updateQty = function(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }

    saveAndRefreshCart();
}

function saveAndRefreshCart() {
    localStorage.setItem('ghosh_shop_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalCount;

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #6B7280; margin-top: 2rem;">Your cart is empty.</p>';
        cartTotal.textContent = '₹0';
        return;
    }

    let totalPrice = 0;
    cart.forEach(item => {
        totalPrice += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price} × ${item.qty}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotal.textContent = `₹${totalPrice}`;
}

// WhatsApp Checkout
function handleWhatsAppCheckout(e) {
    e.preventDefault();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    let message = `🛒 *New Order - Ghosh Shop*\n\n`;
    message += `*Customer:* ${name}\n`;
    message += `*Phone:* ${phone}\n`;
    message += `*Address:* ${address}\n\n`;
    message += `*Items:*\n`;

    let total = 0;
    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        message += `- ${item.name} (${item.weight} ${item.unit}) x ${item.qty} = ₹${subtotal}\n`;
    });

    message += `\n*Total Amount:* ₹${total}`;

    const shopWhatsAppNumber = "917866029593"; 
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${shopWhatsAppNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}
