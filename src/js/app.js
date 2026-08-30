document.addEventListener('DOMContentLoaded', () => {
    // ---------- STATE ----------
    function getCart(){
        try {
            return JSON.parse(localStorage.getItem('printlab_cart')) || [];
        } catch(e){
            console.error('Kon winkelwagen niet laden:', e);
            return [];
        }
    }
    
    function saveCart(cart){
        try {
            localStorage.setItem('printlab_cart', JSON.stringify(cart));
        } catch(e){
            console.error('Kon winkelwagen niet opslaan:', e);
        }
    }

    // ---------- QUICK VIEW MODAL ----------
    const pmOverlay = document.getElementById('pmOverlay');
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const pmImage = document.getElementById('pmImage');
    const pmTitle = document.getElementById('pmTitle');
    const pmDesc = document.getElementById('pmDesc');
    const pmPrice = document.getElementById('pmPrice');
    
    // Slider elements
    const pmPrev = document.getElementById('pmPrev');
    const pmNext = document.getElementById('pmNext');
    const pmDots = document.getElementById('pmDots');
    let currentImages = [];
    let currentImageIndex = 0;

    function updatePmImage() {
        if (!currentImages || currentImages.length === 0) {
            pmImage.style.display = 'none';
            pmPrev.style.display = 'none';
            pmNext.style.display = 'none';
            pmDots.innerHTML = '';
            return;
        }
        pmImage.src = currentImages[currentImageIndex];
        pmImage.style.display = 'block';

        if (currentImages.length > 1) {
            pmPrev.style.display = 'block';
            pmNext.style.display = 'block';
            
            let dotsHtml = '';
            currentImages.forEach((_, idx) => {
                const color = idx === currentImageIndex ? 'var(--orange)' : 'var(--line)';
                dotsHtml += `<div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>`;
            });
            pmDots.innerHTML = dotsHtml;
        } else {
            pmPrev.style.display = 'none';
            pmNext.style.display = 'none';
            pmDots.innerHTML = '';
        }
    }

    if (pmPrev) {
        pmPrev.addEventListener('click', () => {
            if (currentImages.length <= 1) return;
            currentImageIndex = (currentImageIndex === 0) ? currentImages.length - 1 : currentImageIndex - 1;
            updatePmImage();
        });
    }
    if (pmNext) {
        pmNext.addEventListener('click', () => {
            if (currentImages.length <= 1) return;
            currentImageIndex = (currentImageIndex === currentImages.length - 1) ? 0 : currentImageIndex + 1;
            updatePmImage();
        });
    }

    function closePM() {
        if(pmOverlay) pmOverlay.classList.remove('open');
        if(productModal) productModal.classList.remove('open');
    }

    if(closeProductModal) closeProductModal.addEventListener('click', closePM);
    if(pmOverlay) pmOverlay.addEventListener('click', closePM);

    document.querySelectorAll('.quick-view-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if(!card) return;
            
            const title = card.querySelector('.card-title').textContent;
            const desc = card.querySelector('.card-desc').textContent;
            const priceText = card.querySelector('.card-price').textContent;

            const cardImgDiv = card.querySelector('.card-img');
            
            if (cardImgDiv) {
                const img1 = cardImgDiv.getAttribute('data-img1');
                const img2 = cardImgDiv.getAttribute('data-img2');
                const img3 = cardImgDiv.getAttribute('data-img3');
                currentImages = [img1, img2, img3].filter(i => i && i !== '');
            } else {
                currentImages = [];
            }
            
            // fallback
            if (currentImages.length === 0) {
                const img = card.querySelector('img');
                if (img) currentImages = [img.src];
            }

            currentImageIndex = 0;
            updatePmImage();

            if (pmTitle) pmTitle.textContent = title;
            if (pmDesc) pmDesc.textContent = desc;
            if (pmPrice) pmPrice.textContent = priceText;

            if (pmOverlay) pmOverlay.classList.add('open');
            if (productModal) productModal.classList.add('open');
        });
    });

    // ---------- ADD TO CART LOGIC ----------
    const addBtns = document.querySelectorAll('.add-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            const pId = btn.getAttribute('data-id');
            const pTitle = btn.getAttribute('data-title');
            const pPrice = parseFloat(btn.getAttribute('data-price'));
            const isPersonalizable = btn.getAttribute('data-is-personalizable') === 'true';

            const colorSelect = card.querySelector('.color-select');
            const color = colorSelect ? colorSelect.value : null;

            const nameInput = card.querySelector('.name-input');
            const naam = nameInput ? nameInput.value.trim() : null;

            if (isPersonalizable && !naam){
                alert('Vul eerst een naam in voor personalisatie.');
                return;
            }

            const cart = getCart();
            cart.push({
                id: pId + '-' + Date.now(), // unique id in cart
                productId: pId,
                title: pTitle,
                price: pPrice,
                color: color,
                personalizedName: naam,
                qty: 1
            });
            saveCart(cart);
            renderCart();
            openDrawer();

            // Visual feedback op de knop
            const originalText = btn.textContent;
            btn.textContent = 'Toegevoegd! ✓';
            btn.style.background = 'var(--blue)';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
            }, 1500);
        });
    });

    // ---------- CART DRAWER & SHIPPING ----------
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const drawerItems = document.getElementById('drawerItems');
    const cartCount = document.getElementById('cartCount');
    const totalAmount = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const drawerFoot = document.getElementById('drawerFoot');
    const successMsg = document.getElementById('successMsg');
    
    const deliveryRadios = document.querySelectorAll('input[name="levering"]');
    const addressField = document.getElementById('addressField');
    const adresInput = document.getElementById('adresInput');
    let isShipping = false;

    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            isShipping = e.target.value === 'Verzenden';
            addressField.style.display = isShipping ? 'block' : 'none';
            adresInput.required = isShipping;
            renderCart();
        });
    });

    function openDrawer(){ drawer.classList.add('open'); overlay.classList.add('open'); }
    function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }

    document.getElementById('cartToggle').addEventListener('click', openDrawer);
    document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    function renderCart(){
        const cart = getCart();
        cartCount.textContent = cart.length;
        drawerItems.innerHTML = '';
        
        if (!cart.length){
            drawerItems.innerHTML = '<p class="empty-msg">Je winkelwagen is leeg.</p>';
            checkoutBtn.disabled = true;
            totalAmount.innerHTML = '€ 0,00';
            return;
        } 
        
        checkoutBtn.disabled = false;
        cart.forEach((item, i) => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            
            const metaBits = [];
            if (item.color) metaBits.push('Kleur: ' + item.color);
            if (item.personalizedName) metaBits.push('Naam: ' + item.personalizedName);
            
            row.innerHTML = `
            <div>
                <div>${item.title}</div>
                ${metaBits.length ? `<div class="meta">${metaBits.join(' · ')}</div>` : ''}
                <button class="remove-btn" data-index="${i}">Verwijderen</button>
            </div>
            <div>€ ${item.price.toFixed(2).replace('.', ',')}</div>
            `;
            drawerItems.appendChild(row);
        });

        drawerItems.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentCart = getCart();
                currentCart.splice(Number(btn.dataset.index), 1);
                saveCart(currentCart);
                renderCart();
            });
        });
        
        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        let shippingCost = 0;
        if (isShipping && subtotal < 50) {
            shippingCost = 6.50;
        }
        
        const finalTotal = subtotal + shippingCost;
        
        let totalHtml = `<span style="font-size:0.9rem; color:var(--ink-dim);">Subtotaal: € ${subtotal.toFixed(2).replace('.', ',')}</span>`;
        if (isShipping) {
            totalHtml += `<br><span style="font-size:0.9rem; color:var(--ink-dim);">Verzendkosten: € ${shippingCost.toFixed(2).replace('.', ',')}</span>`;
        }
        totalHtml += `<br><strong style="color:var(--orange); font-size:1.3rem;">Totaal: € ${finalTotal.toFixed(2).replace('.', ',')}</strong>`;
        
        totalAmount.innerHTML = totalHtml;
        totalAmount.setAttribute('data-final-total', finalTotal.toFixed(2).replace('.', ','));
    }

    // ---------- CHECKOUT ----------
    checkoutBtn.addEventListener('click', () => {
        drawerFoot.style.display = 'none';
        drawerItems.style.display = 'none';
        checkoutForm.classList.add('open');
    });

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = getCart();
        if (!cart.length){
            alert('Je winkelwagen is leeg.');
            return;
        }

        // Kritieke stap: zet volledige winkelwagen als JSON in het hidden veld
        document.getElementById('cartDataField').value = JSON.stringify(cart);

        const formData = new FormData(checkoutForm);
        const submitOrderBtn = checkoutForm.querySelector('.submit-order');
        
        submitOrderBtn.disabled = true;
        submitOrderBtn.textContent = 'Bezig met versturen...';

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                const betalingMethod = formData.get('betaling'); 
                const finalTotalValue = totalAmount.getAttribute('data-final-total');
                const totalAmountStr = '€ ' + finalTotalValue;
                
                saveCart([]);
                renderCart();
                checkoutForm.reset();
                addressField.style.display = 'none';
                isShipping = false;
                checkoutForm.classList.remove('open');
                
                if (betalingMethod === 'Tikkie') {
                    // Tikkie secildiyse ozel mesaj ve Tikkie linki goster
                    successMsg.innerHTML = `
                        ✓ Bedankt voor je bestelling!<br><br>
                        Je hebt gekozen voor Tikkie. Het totaalbedrag is <strong>${totalAmountStr}</strong>.<br><br>
                        <a href="https://tikkie.me/pay/JOUW_TIKKIE_LINK" target="_blank" class="submit-order" style="display:inline-block; text-decoration:none; margin-top:10px;">Nu Betalen via Tikkie</a>
                        <br><br><span style="font-size:0.8rem; color:var(--ink-dim);">Vul het bedrag zelf in bij Tikkie.</span>
                    `;
                    successMsg.classList.add('open');
                } else {
                    // Contant secildiyse normal mesaj
                    successMsg.innerHTML = `✓ Bedankt voor je bestelling!<br>We nemen snel contact met je op.`;
                    successMsg.classList.add('open');
                    
                    setTimeout(() => {
                        successMsg.classList.remove('open');
                        drawerFoot.style.display = '';
                        drawerItems.style.display = '';
                        closeDrawer();
                    }, 3500);
                }
            } else {
                throw new Error('Netwerk antwoord was niet ok.');
            }
        } catch (err) {
            console.error('Versturen mislukt:', err);
            alert('Er ging iets mis bij het versturen. Probeer het opnieuw.');
        } finally {
            submitOrderBtn.disabled = false;
            submitOrderBtn.textContent = 'Bestelling versturen';
        }
    });

    // ---------- INIT ----------
    renderCart();
});
