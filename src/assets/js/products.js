import BasePage from './base-page';
import MobileMenu from 'mmenu-light';

class Products extends BasePage {
    onReady() {
        const productsList = app.element('salla-products-list');
        const urlParams = new URLSearchParams(window.location.search);

        // References to Luz del Sol Filter Elements
        const catFilter = app.element('#lds-cat-filter');
        const concernFilter = app.element('#lds-concern-filter');
        const typeFilter = app.element('#lds-type-filter');
        const ingFilter = app.element('#lds-ing-filter');
        const searchInput = app.element('#lds-search-input');
        const priceSlider = app.element('#lds-price-slider');
        const priceVal = app.element('#lds-price-val');
        const resetBtn = app.element('#lds-reset-btn');
        const noResultsReset = app.element('#lds-no-results-reset');
        const noResultsBox = app.element('#lds-no-results');
        const sortFilter = app.element('#product-filter');
        const mobileToggle = app.element('#lds-mobile-filter-toggle');
        const filtersAside = app.element('#lds-filters-aside');
        const filterChevron = app.element('#lds-filter-chevron');

        // Mobile Filter Accordion Toggle
        if (mobileToggle && filtersAside) {
            mobileToggle.addEventListener('click', () => {
                const isHidden = filtersAside.classList.contains('hidden');
                if (isHidden) {
                    filtersAside.classList.remove('hidden');
                    if (filterChevron) filterChevron.style.transform = 'rotate(180deg)';
                } else {
                    filtersAside.classList.add('hidden');
                    if (filterChevron) filterChevron.style.transform = 'rotate(0deg)';
                }
            });
        }

        // Set Salla Native Sort from URL if present
        if (sortFilter && urlParams.has('sort')) {
            sortFilter.value = urlParams.get('sort');
        }

        // Handle Sort Selection
        if (sortFilter && productsList) {
            app.on('change', '#product-filter', async (event) => {
                const sortVal = event.currentTarget.value;
                window.history.replaceState(null, null, salla.helpers.addParamToUrl('sort', sortVal));
                productsList.sortBy = sortVal;
                await productsList.reload();
                productsList.setAttribute('filters', `{"sort": "${sortVal}"}`);
            });
        }

        // Read query params from URL and initialize filter values
        if (urlParams.has('category') && catFilter) {
            const cat = urlParams.get('category').toLowerCase();
            for (let i = 0; i < catFilter.options.length; i++) {
                if (catFilter.options[i].value.toLowerCase().includes(cat) || cat.includes(catFilter.options[i].value.toLowerCase())) {
                    catFilter.selectedIndex = i;
                    break;
                }
            }
        }

        if (urlParams.has('concern') && concernFilter) {
            const con = urlParams.get('concern').toLowerCase();
            for (let i = 0; i < concernFilter.options.length; i++) {
                if (concernFilter.options[i].value.toLowerCase().includes(con) || con.includes(concernFilter.options[i].value.toLowerCase())) {
                    concernFilter.selectedIndex = i;
                    break;
                }
            }
        }

        if (urlParams.has('ingredient') && ingFilter) {
            const ing = urlParams.get('ingredient').toLowerCase();
            for (let i = 0; i < ingFilter.options.length; i++) {
                if (ingFilter.options[i].value.toLowerCase().includes(ing) || ing.includes(ingFilter.options[i].value.toLowerCase())) {
                    ingFilter.selectedIndex = i;
                    break;
                }
            }
        }

        if (urlParams.has('type') && typeFilter) {
            typeFilter.value = urlParams.get('type');
        }

        if (urlParams.has('q') && searchInput) {
            searchInput.value = urlParams.get('q');
        }

        // Filtering Function
        const applyLuzFilters = () => {
            const selectedCat = catFilter ? catFilter.value.toLowerCase() : '';
            const selectedConcern = concernFilter ? concernFilter.value.toLowerCase() : '';
            const selectedType = typeFilter ? typeFilter.value.toLowerCase() : '';
            const selectedIng = ingFilter ? ingFilter.value.toLowerCase() : '';
            const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const maxPrice = priceSlider ? parseFloat(priceSlider.value) : 999999;

            // Keyword dictionaries for mapping
            const catMap = {
                cleanser: ['منظف', 'غسول', 'cleanser', 'gel'],
                serum: ['سيروم', 'serum'],
                moisturizer: ['مرطب', 'كريم', 'moisturizer', 'cream'],
                sunscreen: ['واقي', 'شمس', 'sunscreen', 'sun']
            };

            const concernMap = {
                acne: ['حبوب', 'حب الشباب', 'انسداد', 'مسام', 'acne', 'blemish'],
                pigmentation: ['تصبغ', 'تصبغات', 'بقع', 'داكنة', 'توحيد', 'pigmentation', 'dark spot'],
                barrier: ['حاجز', 'حساسة', 'تهيج', 'احمرار', 'barrier', 'repair', 'soothing'],
                dryness: ['جفاف', 'ترطيب', 'dry', 'hydrate', 'hydration'],
                oiliness: ['دهون', 'ملمس', 'لمعان', 'oil', 'matte', 'pore'],
                sun: ['شمس', 'حماية', 'sun', 'uv']
            };

            const ingMap = {
                salicylic: ['ساليسيليك', 'سالسليك', 'salicylic', 'bha'],
                niacinamide: ['نياسيناميد', 'niacinamide', 'b3'],
                ceramides: ['سيراميد', 'سيراميدات', 'ceramide'],
                hyaluronic: ['هيالورونيك', 'hyaluronic', 'ha']
            };

            const typeMap = {
                oily: ['دهنية', 'دهني', 'oily'],
                dry: ['جافة', 'جاف', 'dry'],
                combination: ['مختلطة', 'مختلط', 'combination'],
                sensitive: ['حساسة', 'حساس', 'sensitive']
            };

            // Query product elements inside productsList
            const cardSelectors = 'custom-product-card, salla-product-card, .s-product-card-entry, .product-entry, article.card';
            const cards = productsList ? productsList.querySelectorAll(cardSelectors) : [];

            if (!cards.length) return;

            let visibleCount = 0;

            cards.forEach(card => {
                const text = (card.textContent || '').toLowerCase();
                
                // Extract price
                const priceMatch = text.match(/([\d,.]+)\s*(ر\.س|sar)/i);
                let price = 0;
                if (priceMatch && priceMatch[1]) {
                    price = parseFloat(priceMatch[1].replace(/,/g, '')) || 0;
                }

                // Check Category
                let matchCat = true;
                if (selectedCat) {
                    const keywords = catMap[selectedCat] || [selectedCat];
                    matchCat = keywords.some(kw => text.includes(kw));
                }

                // Check Concern
                let matchConcern = true;
                if (selectedConcern) {
                    const keywords = concernMap[selectedConcern] || [selectedConcern];
                    matchConcern = keywords.some(kw => text.includes(kw));
                }

                // Check Ingredient
                let matchIng = true;
                if (selectedIng) {
                    const keywords = ingMap[selectedIng] || [selectedIng];
                    matchIng = keywords.some(kw => text.includes(kw));
                }

                // Check Skin Type
                let matchType = true;
                if (selectedType) {
                    const keywords = typeMap[selectedType] || [selectedType];
                    matchType = keywords.some(kw => text.includes(kw));
                }

                // Check Price
                let matchPrice = true;
                if (price > 0 && priceSlider) {
                    matchPrice = price <= maxPrice;
                }

                // Check Search Query
                let matchQuery = true;
                if (searchQuery) {
                    matchQuery = text.includes(searchQuery);
                }

                if (matchCat && matchConcern && matchIng && matchType && matchPrice && matchQuery) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Toggle No Results Message
            if (noResultsBox) {
                if (visibleCount === 0 && cards.length > 0) {
                    noResultsBox.classList.remove('hidden');
                } else {
                    noResultsBox.classList.add('hidden');
                }
            }
        };

        // Attach Event Listeners to Filter Controls
        if (catFilter) catFilter.addEventListener('change', applyLuzFilters);
        if (concernFilter) concernFilter.addEventListener('change', applyLuzFilters);
        if (typeFilter) typeFilter.addEventListener('change', applyLuzFilters);
        if (ingFilter) ingFilter.addEventListener('change', applyLuzFilters);
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyLuzFilters, 200);
            });
        }

        if (priceSlider && priceVal) {
            priceSlider.addEventListener('input', (e) => {
                priceVal.textContent = `${e.target.value} ر.س`;
                applyLuzFilters();
            });
        }

        // Reset Filters Handler
        const resetAllFilters = () => {
            if (catFilter) catFilter.value = '';
            if (concernFilter) concernFilter.value = '';
            if (typeFilter) typeFilter.value = '';
            if (ingFilter) ingFilter.value = '';
            if (searchInput) searchInput.value = '';
            if (priceSlider) {
                priceSlider.value = priceSlider.max || 600;
                if (priceVal) priceVal.textContent = `${priceSlider.value} ر.س`;
            }
            applyLuzFilters();
        };

        if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
        if (noResultsReset) noResultsReset.addEventListener('click', resetAllFilters);

        // Run filter initially and when Salla fetches products
        salla.event.on('salla-products-list::products.fetched', res => {
            if (res.title && app.element('#page-main-title')) {
                app.element('#page-main-title').innerHTML = res.title;
            }
            setTimeout(applyLuzFilters, 150);
        });

        // Run once after DOM content settles
        setTimeout(applyLuzFilters, 400);

        this.initiateMobileMenu();
    }

    initiateMobileMenu() {
        const filters = app.element("#filters-menu");
        const trigger = app.element("a[href='#filters-menu']");
        const close = app.element("button.close-filters");

        if (!filters || !trigger) {
            return;
        }
        const mobileFilters = new MobileMenu(filters, "(max-width: 1024px)", "( slidingSubmenus: false)");
        const drawer = mobileFilters.offcanvas({ position: salla.config.get('theme.is_rtl') ? "right" : 'left' });
        trigger.addEventListener('click', event => {
            document.body.classList.add('filters-opened');
            event.preventDefault() || drawer.close() || drawer.open();
        });
        if (close) {
            close.addEventListener('click', event => {
                document.body.classList.remove('filters-opened');
                event.preventDefault() || drawer.close();
            });
        }
        salla.event.on('salla-filters::changed', filters => {
            if (!Object.entries(filters).length) return;
            document.body.classList.remove('filters-opened');
            drawer.close();
        });
    }
}

Products.initiateWhenReady([
    'product.index',
    'product.index.latest',
    'product.index.offers',
    'product.index.search',
    'product.index.tag',
]);
