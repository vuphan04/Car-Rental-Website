const inventoryGrid = document.querySelector('#inventory-grid');
const resultCount = document.querySelector('#inventory-result-count');
const searchForm = document.querySelector('#inventory-search-form');
const searchInput = document.querySelector('#inventory-search-input');
const popularTags = document.querySelector('#inventory-popular-tags');
const sortSelect = document.querySelector('#inventory-sort');
const filterApplyButton = document.querySelector('#inventory-filter-apply');
const filterResetButton = document.querySelector('#inventory-filter-reset');
const filterControls = {
    brand: document.querySelector('#filter-brand'),
    category: document.querySelector('#filter-category'),
    condition: document.querySelector('#filter-condition'),
    price: document.querySelector('#filter-price'),
    mileage: document.querySelector('#filter-mileage'),
    year: document.querySelector('#filter-year'),
    fuel: document.querySelector('#filter-fuel'),
    status: document.querySelector('#filter-status')
};

let cars = [];
let filteredCars = [];
let currentUser = null;
let favoriteCarIds = new Set();

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);

const normalizeText = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

const requestJson = async (url, options = {}) => {
    const requestOptions = {
        method: options.method || 'GET',
        headers: { ...(options.headers || {}) }
    };

    if (options.body) {
        requestOptions.body = options.body;
        requestOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, requestOptions);
    const data = await response.json().catch(() => ({}));

    return { response, data };
};

const getCarDetailUrl = (carId) => `/cars/${encodeURIComponent(carId)}`;

const getCarImages = (car) => {
    const images = Array.isArray(car?.images) ? car.images : [];
    const fallbackImage = car?.image ? [car.image] : [];

    return [...images, ...fallbackImage].reduce((normalizedImages, image) => {
        const normalizedImage = String(image || '').trim();

        if (normalizedImage && !normalizedImages.includes(normalizedImage)) {
            normalizedImages.push(normalizedImage);
        }

        return normalizedImages;
    }, []);
};

const getStatusClass = (status) => {
    const normalizedStatus = normalizeText(status);

    return ['xe da ban', 'het xe', 'het hang'].includes(normalizedStatus)
        ? 'is-sold'
        : 'is-available';
};

const isSoldCar = (car) => getStatusClass(car.actionText) === 'is-sold';

const parsePriceValue = (car) => {
    if (Number.isFinite(Number(car.priceValue))) {
        return Number(car.priceValue);
    }

    const priceText = normalizeText(car.price || '');
    const normalizedPriceText = priceText.replace(/\./g, '').replace(',', '.');
    const numberMatch = normalizedPriceText.match(/\d+(?:\.\d+)?/);

    if (!numberMatch) {
        return 0;
    }

    const value = Number(numberMatch[0]);

    if (priceText.includes('ty')) {
        return value * 1000000000;
    }

    if (priceText.includes('trieu')) {
        return value * 1000000;
    }

    return value;
};

const parseMileageValue = (mileage) => {
    const digits = String(mileage || '').replace(/[^\d]/g, '');

    return Number(digits || 0);
};

const parseRange = (rangeValue) => {
    const [minValue, maxValue] = String(rangeValue || '').split('-');

    return {
        min: minValue ? Number(minValue) : 0,
        max: maxValue ? Number(maxValue) : Infinity
    };
};

const isWithinRange = (value, rangeValue) => {
    if (!rangeValue) {
        return true;
    }

    const { min, max } = parseRange(rangeValue);

    return value >= min && value <= max;
};

const getUniqueValues = (fieldName) =>
    [...new Set(cars.map((car) => String(car[fieldName] || '').trim()).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second, 'vi'));

const setSelectOptions = (select, placeholder, values) => {
    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">${escapeHtml(placeholder)}</option>
        ${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}
    `;
};

const renderFilterOptions = () => {
    setSelectOptions(filterControls.brand, 'Tất cả thương hiệu', getUniqueValues('brand'));
    setSelectOptions(filterControls.category, 'Tất cả phân khúc', getUniqueValues('category'));
    setSelectOptions(filterControls.condition, 'Tất cả tình trạng', getUniqueValues('condition'));
    setSelectOptions(filterControls.fuel, 'Tất cả nhiên liệu', getUniqueValues('fuel'));

    const years = getUniqueValues('year').sort((first, second) => Number(second) - Number(first));
    setSelectOptions(filterControls.year, 'Tất cả năm', years);
};

const renderPopularTags = () => {
    if (!popularTags) {
        return;
    }

    const tags = getUniqueValues('brand').slice(0, 6);

    popularTags.innerHTML = tags.map((tag) => `
        <button type="button" data-popular-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
    `).join('');
};

const isFavoriteCar = (carId) => favoriteCarIds.has(String(carId));

const renderInventoryCard = (car) => {
    const image = getCarImages(car)[0] || '../images/rental-1.png';
    const statusText = car.actionText || 'Còn xe';
    const statusClass = getStatusClass(statusText);

    return `
        <article class="inventory-card" data-car-url="${getCarDetailUrl(car.id)}" role="link" tabindex="0" aria-label="Xem chi tiết ${escapeHtml(car.name)}">
            <button type="button" class="inventory-card__favorite${isFavoriteCar(car.id) ? ' is-active' : ''}" data-favorite-car="${escapeHtml(car.id)}" aria-pressed="${isFavoriteCar(car.id)}" aria-label="${isFavoriteCar(car.id) ? 'Bỏ yêu thích' : 'Yêu thích'} ${escapeHtml(car.name)}">
                <i class="bx ${isFavoriteCar(car.id) ? 'bxs-heart' : 'bx-heart'}" aria-hidden="true"></i>
            </button>
            <div class="inventory-card__media">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(car.name)}">
            </div>
            <div class="inventory-card__body">
                <span class="inventory-card__category">${escapeHtml(car.category || 'Chưa cập nhật')}</span>
                <h3>${escapeHtml(car.name || 'Xe chưa có tên')}</h3>
                <p class="inventory-card__type">${escapeHtml(car.type || 'Chưa cập nhật')}</p>
                <div class="inventory-card__specs">
                    <span>${escapeHtml(car.year || 'Năm')}</span>
                    <span>${escapeHtml(car.fuel || 'Nhiên liệu')}</span>
                    <span>${escapeHtml(car.mileage || 'Số km')}</span>
                    <span>${escapeHtml(car.seats || 'Số chỗ')}</span>
                    <span>${escapeHtml(car.gearbox || 'Hộp số')}</span>
                    <span>${escapeHtml(car.origin || 'Xuất xứ')}</span>
                    <span>${escapeHtml(car.condition || 'Tình trạng')}</span>
                    <span>${escapeHtml(car.color || 'Màu sắc')}</span>
                </div>
                <div class="inventory-card__footer">
                    <strong class="inventory-card__price">${escapeHtml(car.price || 'Liên hệ')}</strong>
                    <span class="inventory-card__status ${statusClass}">${escapeHtml(statusText)}</span>
                </div>
                <div class="inventory-card__actions">
                    <a class="inventory-card__detail" href="${getCarDetailUrl(car.id)}">Xem chi tiết</a>
                    <a class="inventory-card__compare" href="${getCarDetailUrl(car.id)}" aria-label="Xem nhanh ${escapeHtml(car.name)}">
                        <i class="bx bx-show" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </article>
    `;
};

const renderEmptyState = (title, message) => {
    if (!inventoryGrid) {
        return;
    }

    inventoryGrid.innerHTML = `
        <article class="inventory-empty">
            <div>
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(message)}</p>
            </div>
        </article>
    `;
};

const getSelectedFilters = () => ({
    keyword: normalizeText(searchInput?.value),
    brand: normalizeText(filterControls.brand?.value),
    category: normalizeText(filterControls.category?.value),
    condition: normalizeText(filterControls.condition?.value),
    price: filterControls.price?.value || '',
    mileage: filterControls.mileage?.value || '',
    year: normalizeText(filterControls.year?.value),
    fuel: normalizeText(filterControls.fuel?.value),
    status: filterControls.status?.value || ''
});

const sortCars = (carList) => {
    const sortValue = sortSelect?.value || 'newest';
    const sortedCars = [...carList];

    if (sortValue === 'price-asc') {
        return sortedCars.sort((first, second) => parsePriceValue(first) - parsePriceValue(second));
    }

    if (sortValue === 'price-desc') {
        return sortedCars.sort((first, second) => parsePriceValue(second) - parsePriceValue(first));
    }

    if (sortValue === 'name') {
        return sortedCars.sort((first, second) => String(first.name || '').localeCompare(String(second.name || ''), 'vi'));
    }

    return sortedCars.sort((first, second) => Number(second.id || 0) - Number(first.id || 0));
};

const applyFilters = () => {
    const filters = getSelectedFilters();

    filteredCars = cars.filter((car) => {
        const searchableText = normalizeText([
            car.name,
            car.brand,
            car.category,
            car.type,
            car.fuel,
            car.color,
            car.condition
        ].join(' '));
        const matchesKeyword = !filters.keyword || searchableText.includes(filters.keyword);
        const matchesBrand = !filters.brand || normalizeText(car.brand) === filters.brand;
        const matchesCategory = !filters.category || normalizeText(car.category) === filters.category;
        const matchesCondition = !filters.condition || normalizeText(car.condition) === filters.condition;
        const matchesYear = !filters.year || normalizeText(car.year) === filters.year;
        const matchesFuel = !filters.fuel || normalizeText(car.fuel) === filters.fuel;
        const matchesPrice = isWithinRange(parsePriceValue(car), filters.price);
        const matchesMileage = isWithinRange(parseMileageValue(car.mileage), filters.mileage);
        const matchesStatus = !filters.status
            || (filters.status === 'sold' ? isSoldCar(car) : !isSoldCar(car));

        return matchesKeyword
            && matchesBrand
            && matchesCategory
            && matchesCondition
            && matchesYear
            && matchesFuel
            && matchesPrice
            && matchesMileage
            && matchesStatus;
    });

    renderInventoryGrid();
};

const renderInventoryGrid = () => {
    if (!inventoryGrid) {
        return;
    }

    const visibleCars = sortCars(filteredCars);

    if (resultCount) {
        resultCount.textContent = `${visibleCars.length} xe phù hợp`;
    }

    if (!visibleCars.length) {
        renderEmptyState('Không tìm thấy xe phù hợp', 'Hãy thử đổi từ khóa tìm kiếm hoặc giảm bớt bộ lọc.');
        return;
    }

    inventoryGrid.innerHTML = visibleCars.map(renderInventoryCard).join('');
};

const syncFavoriteButtons = (carId) => {
    const normalizedCarId = String(carId || '');
    const isActive = isFavoriteCar(normalizedCarId);
    const car = cars.find((item) => String(item.id) === normalizedCarId);

    document.querySelectorAll(`[data-favorite-car="${CSS.escape(normalizedCarId)}"]`).forEach((button) => {
        const icon = button.querySelector('i');

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.setAttribute('aria-label', `${isActive ? 'Bỏ yêu thích' : 'Yêu thích'} ${car?.name || 'xe này'}`);

        if (icon) {
            icon.className = `bx ${isActive ? 'bxs-heart' : 'bx-heart'}`;
        }
    });
};

const setFavoriteCars = (favoriteCars = []) => {
    favoriteCarIds = new Set(
        (Array.isArray(favoriteCars) ? favoriteCars : []).map((car) => String(car.id))
    );
};

const syncCurrentUserAndFavorites = async () => {
    try {
        const { response, data } = await requestJson('/api/auth/me');

        currentUser = response.ok && data.user ? data.user : null;
    } catch (error) {
        currentUser = null;
    }

    if (!currentUser) {
        setFavoriteCars([]);
        return;
    }

    try {
        const { response, data } = await requestJson('/api/favorites');

        if (response.ok) {
            setFavoriteCars(data.cars || []);
        }
    } catch (error) {
        setFavoriteCars([]);
    }
};

const handleFavoriteButtonClick = async (event) => {
    const favoriteButton = event.target.closest('[data-favorite-car]');

    if (!favoriteButton) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const carId = String(favoriteButton.dataset.favoriteCar || '');

    if (!carId) {
        return;
    }

    if (!currentUser) {
        window.alert('Vui lòng đăng nhập ở trang chủ để lưu xe yêu thích.');
        return;
    }

    const shouldRemoveFavorite = isFavoriteCar(carId);
    favoriteButton.disabled = true;

    try {
        const { response, data } = await requestJson(`/api/favorites/${encodeURIComponent(carId)}`, {
            method: shouldRemoveFavorite ? 'DELETE' : 'POST'
        });

        if (!response.ok) {
            throw new Error(data.message || 'Không thể cập nhật xe yêu thích lúc này.');
        }

        setFavoriteCars(data.cars || []);
        syncFavoriteButtons(carId);
    } catch (error) {
        window.alert(error.message || 'Không thể cập nhật xe yêu thích lúc này.');
    } finally {
        favoriteButton.disabled = false;
    }
};

const openCarDetailFromCard = (card) => {
    const carUrl = card?.dataset.carUrl;

    if (carUrl) {
        window.location.href = carUrl;
    }
};

const resetFilters = () => {
    if (searchInput) {
        searchInput.value = '';
    }

    Object.values(filterControls).forEach((control) => {
        if (control) {
            control.value = '';
        }
    });

    if (sortSelect) {
        sortSelect.value = 'newest';
    }

    applyFilters();
};

const bindEvents = () => {
    searchForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
    });
    searchInput?.addEventListener('input', applyFilters);
    sortSelect?.addEventListener('change', renderInventoryGrid);
    filterApplyButton?.addEventListener('click', applyFilters);
    filterResetButton?.addEventListener('click', resetFilters);

    Object.values(filterControls).forEach((control) => {
        control?.addEventListener('change', applyFilters);
    });

    popularTags?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-popular-tag]');

        if (!button || !searchInput) {
            return;
        }

        searchInput.value = button.dataset.popularTag || '';
        applyFilters();
    });

    inventoryGrid?.addEventListener('click', handleFavoriteButtonClick);
    inventoryGrid?.addEventListener('click', (event) => {
        if (event.target.closest('a, button, input, select, textarea')) {
            return;
        }

        openCarDetailFromCard(event.target.closest('[data-car-url]'));
    });
    inventoryGrid?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        const card = event.target.closest('[data-car-url]');

        if (!card || event.target !== card) {
            return;
        }

        event.preventDefault();
        openCarDetailFromCard(card);
    });
};

const loadInventory = async () => {
    renderEmptyState('Đang tải danh sách xe', 'Vui lòng chờ trong giây lát.');

    try {
        const { response, data } = await requestJson('/api/cars');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải danh sách xe.');
        }

        cars = Array.isArray(data.cars) ? data.cars : [];
        await syncCurrentUserAndFavorites();
        renderFilterOptions();
        renderPopularTags();
        applyFilters();
    } catch (error) {
        if (resultCount) {
            resultCount.textContent = 'Không thể tải dữ liệu';
        }

        renderEmptyState('Không thể tải danh sách xe', error.message || 'Vui lòng thử lại sau.');
    }
};

bindEvents();
loadInventory();
