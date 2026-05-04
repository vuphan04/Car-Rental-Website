const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const teamContainer = document.querySelector('#team-container');

const closeMobileMenu = () => {
    if (!nav || !menuToggle) {
        return;
    }

    nav.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<i class="bx bx-menu"></i>';
};

if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');

        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.innerHTML = isOpen
            ? '<i class="bx bx-x"></i>'
            : '<i class="bx bx-menu"></i>';
    });
}

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 640) {
            closeMobileMenu();
        }
    });
});

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);

const rentalContainer = document.querySelector('.rental-container');
const rentalViewAllButton = document.querySelector('#rental-view-all-button');
const rentalSliderPrevButton = document.querySelector('#rental-slider-prev');
const rentalSliderNextButton = document.querySelector('#rental-slider-next');
const homeSearchForm = document.querySelector('#home-search-form');
const homeSearchControls = {
    brand: document.querySelector('#home-search-brand'),
    category: document.querySelector('#home-search-category'),
    yearFrom: document.querySelector('#home-search-year-from'),
    yearTo: document.querySelector('#home-search-year-to'),
    priceRange: document.querySelector('#home-search-price-range'),
    condition: document.querySelector('#home-search-condition'),
    mileageRange: document.querySelector('#home-search-mileage'),
    fuel: document.querySelector('#home-search-fuel'),
    gearbox: document.querySelector('#home-search-gearbox'),
    origin: document.querySelector('#home-search-origin'),
    color: document.querySelector('#home-search-color'),
    seats: document.querySelector('#home-search-seats')
};
const allCarsModal = document.querySelector('#all-cars-modal');
const allCarsGrid = document.querySelector('#all-cars-grid');
const allCarsSearchInput = document.querySelector('#all-cars-search');
const allCarsCloseButtons = document.querySelectorAll('[data-close-all-cars]');
const searchResultsModal = document.querySelector('#search-results-modal');
const searchResultsGrid = document.querySelector('#search-results-grid');
const searchResultsSummary = document.querySelector('#search-results-summary');
const searchResultsCloseButtons = document.querySelectorAll('[data-close-search-results]');
const favoriteCarsModal = document.querySelector('#favorite-cars-modal');
const favoriteCarsGrid = document.querySelector('#favorite-cars-grid');
const favoriteCarsCloseButtons = document.querySelectorAll('[data-close-favorites]');
const notificationsModal = document.querySelector('#notifications-modal');
const notificationsCloseButtons = document.querySelectorAll('[data-close-notifications]');
const featuredRentalLimit = 10;
let rentalCars = [];
let favoriteCars = [];
let favoriteCarIds = new Set();

const isFavoriteCar = (carId) => favoriteCarIds.has(String(carId));
const getCarDetailUrl = (carId) => `/cars/${encodeURIComponent(carId)}`;
const getCarStatusClass = (status) => {
    const normalizedStatus = String(status || '').trim().toLocaleLowerCase('vi-VN');

    return ['xe đã bán', 'hết xe', 'hết hàng'].includes(normalizedStatus)
        ? 'is-sold'
        : 'is-available';
};

const updateRentalSliderControls = () => {
    if (!rentalContainer || !rentalSliderPrevButton || !rentalSliderNextButton) {
        return;
    }

    const maxScrollLeft = rentalContainer.scrollWidth - rentalContainer.clientWidth;
    const canScroll = maxScrollLeft > 1;

    rentalSliderPrevButton.disabled = !canScroll || rentalContainer.scrollLeft <= 1;
    rentalSliderNextButton.disabled = !canScroll || rentalContainer.scrollLeft >= maxScrollLeft - 1;
};

const scrollRentalSlider = (direction) => {
    if (!rentalContainer) {
        return;
    }

    const firstCard = rentalContainer.querySelector('.rental-card');
    const containerStyles = window.getComputedStyle(rentalContainer);
    const gap = parseFloat(containerStyles.columnGap || containerStyles.gap) || 24;
    const cardWidth = firstCard?.getBoundingClientRect().width || rentalContainer.clientWidth;

    rentalContainer.scrollBy({
        left: direction * (cardWidth + gap),
        behavior: 'smooth'
    });

    window.setTimeout(updateRentalSliderControls, 360);
};

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

const renderCarMedia = (car) => {
    const images = getCarImages(car);
    const primaryImage = images[0] || car.image;
    const thumbnails = images.slice(1, 5);
    const remainingImages = Math.max(0, images.length - 5);

    return `
        <div class="rental-card__media">
            <img src="${primaryImage}" alt="${car.name}" class="rental-card__image">
            ${images.length > 1 ? `
                <div class="rental-card__thumbs" aria-label="Ảnh khác của ${car.name}">
                    ${thumbnails.map((image, index) => `
                        <img src="${image}" alt="Ảnh ${index + 2} của ${car.name}">
                    `).join('')}
                    ${remainingImages ? `<span class="rental-card__thumb-count">+${remainingImages}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `;
};

const renderCarCard = (car) => `
    <article class="rental-card" data-car-detail-url="${getCarDetailUrl(car.id)}" role="link" tabindex="0" aria-label="Xem chi tiết ${car.name}">
        <button type="button" class="favorite-car-btn${isFavoriteCar(car.id) ? ' is-active' : ''}" data-favorite-car="${car.id}" aria-pressed="${isFavoriteCar(car.id)}" aria-label="${isFavoriteCar(car.id) ? 'Bỏ yêu thích' : 'Yêu thích'} ${car.name}">
            <i class="bx ${isFavoriteCar(car.id) ? 'bxs-heart' : 'bx-heart'}" aria-hidden="true"></i>
        </button>
        ${renderCarMedia(car)}
        <span class="rental-category">${car.category}</span>
        <h3>${car.name}</h3>
        <p>${car.type}</p>
        <div class="rental-details">
            <span>${car.year}</span>
            <span>${car.fuel}</span>
            <span>${car.mileage}</span>
            <span>${car.seats}</span>
        </div>
        <div class="rental-extra">
            <span>${car.gearbox}</span>
            <span>${car.origin}</span>
            <span>${car.condition}</span>
            <span>${car.color}</span>
        </div>
        <div class="rental-meta">
            <span class="price">${car.price}</span>
            <a href="${getCarDetailUrl(car.id)}" class="rent-link ${getCarStatusClass(car.actionText)}">${car.actionText}</a>
        </div>
    </article>
`;

const renderFavoriteCarListItem = (car) => {
    const images = getCarImages(car);
    const primaryImage = images[0] || car.image;

    return `
        <article class="favorite-car-item" data-car-detail-url="${getCarDetailUrl(car.id)}" role="link" tabindex="0" aria-label="Xem chi tiết ${car.name}">
            <img src="${primaryImage}" alt="${car.name}" class="favorite-car-item__image">
            <div class="favorite-car-item__body">
                <div>
                    <span class="favorite-car-item__category">${car.category}</span>
                    <h3>${car.name}</h3>
                    <p>${car.type}</p>
                </div>
                <div class="favorite-car-item__chips">
                    <span>${car.year}</span>
                    <span>${car.fuel}</span>
                    <span>${car.mileage}</span>
                    <span>${car.seats}</span>
                </div>
            </div>
            <div class="favorite-car-item__side">
                <strong>${car.price}</strong>
                <button type="button" class="favorite-car-item__remove" data-favorite-car="${car.id}" aria-pressed="true" aria-label="Bỏ yêu thích ${car.name}">
                    <i class="bx bxs-heart" aria-hidden="true"></i>
                    <span>Bỏ yêu thích</span>
                </button>
            </div>
        </article>
    `;
};

const normalizeSearchValue = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

const appendMissingSelectOptions = (select, values) => {
    if (!select) {
        return;
    }

    const existingOptions = new Set(
        Array.from(select.options).map((option) =>
            normalizeSearchValue(option.value || option.textContent)
        )
    );

    values.forEach((value) => {
        const optionValue = String(value || '').trim();
        const normalizedValue = normalizeSearchValue(optionValue);

        if (!optionValue || existingOptions.has(normalizedValue)) {
            return;
        }

        select.append(new Option(optionValue, optionValue));
        existingOptions.add(normalizedValue);
    });
};

const getUniqueCarValues = (fieldName) =>
    [...new Set(rentalCars.map((car) => String(car[fieldName] || '').trim()).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second, 'vi'));

const populateHomeSearchOptions = () => {
    appendMissingSelectOptions(homeSearchControls.brand, getUniqueCarValues('brand'));
    appendMissingSelectOptions(homeSearchControls.category, getUniqueCarValues('category'));
    appendMissingSelectOptions(homeSearchControls.condition, getUniqueCarValues('condition'));
    appendMissingSelectOptions(homeSearchControls.fuel, getUniqueCarValues('fuel'));
    appendMissingSelectOptions(homeSearchControls.gearbox, getUniqueCarValues('gearbox'));
    appendMissingSelectOptions(homeSearchControls.origin, getUniqueCarValues('origin'));
    appendMissingSelectOptions(homeSearchControls.color, getUniqueCarValues('color'));
    appendMissingSelectOptions(homeSearchControls.seats, getUniqueCarValues('seats'));
};

const parseRangeValue = (rangeValue) => {
    const [minValue, maxValue] = String(rangeValue || '').split('-');

    return {
        min: minValue ? Number(minValue) : 0,
        max: maxValue ? Number(maxValue) : Infinity
    };
};

const isWithinSearchRange = (value, rangeValue) => {
    if (!rangeValue) {
        return true;
    }

    const { min, max } = parseRangeValue(rangeValue);

    return Number(value || 0) >= min && Number(value || 0) <= max;
};

const isWithinYearRange = (year, yearFrom, yearTo) => {
    const carYear = Number(year);
    const minYear = Number(yearFrom || 0);
    const maxYear = Number(yearTo || 0);

    if (!Number.isFinite(carYear)) {
        return false;
    }

    if (minYear && carYear < minYear) {
        return false;
    }

    if (maxYear && carYear > maxYear) {
        return false;
    }

    return true;
};

const parseDisplayPrice = (priceText) => {
    const normalizedPriceText = normalizeSearchValue(priceText).replace(/\./g, '').replace(',', '.');
    const numberMatch = normalizedPriceText.match(/\d+(?:\.\d+)?/);

    if (!numberMatch) {
        return 0;
    }

    const priceNumber = Number(numberMatch[0]);

    if (normalizedPriceText.includes('ty')) {
        return priceNumber * 1000000000;
    }

    if (normalizedPriceText.includes('trieu')) {
        return priceNumber * 1000000;
    }

    return priceNumber;
};

const getCarPriceValue = (car) => {
    const priceValue = Number(car?.priceValue);

    if (Number.isFinite(priceValue) && priceValue > 0) {
        return priceValue;
    }

    return parseDisplayPrice(car?.price);
};

const getCarMileageValue = (car) => {
    const mileageValue = Number(car?.mileageValue);

    if (Number.isFinite(mileageValue)) {
        return mileageValue;
    }

    return Number(String(car?.mileage || '').replace(/[^\d]/g, '') || 0);
};

const getHomeSearchFilters = () => {
    if (!homeSearchForm) {
        return {};
    }

    const formData = new FormData(homeSearchForm);

    return {
        brand: normalizeSearchValue(formData.get('brand')),
        category: normalizeSearchValue(formData.get('category')),
        yearFrom: String(formData.get('yearFrom') || '').trim(),
        yearTo: String(formData.get('yearTo') || '').trim(),
        priceRange: String(formData.get('priceRange') || ''),
        condition: normalizeSearchValue(formData.get('condition')),
        mileageRange: String(formData.get('mileageRange') || ''),
        fuel: normalizeSearchValue(formData.get('fuel')),
        gearbox: normalizeSearchValue(formData.get('gearbox')),
        origin: normalizeSearchValue(formData.get('origin')),
        color: normalizeSearchValue(formData.get('color')),
        seats: normalizeSearchValue(formData.get('seats'))
    };
};

const matchesSearchValue = (carValue, filterValue) =>
    !filterValue || normalizeSearchValue(carValue) === filterValue;

const commonHomeSearchColors = ['den', 'trang', 'do', 'xam'];

const matchesSearchColor = (carColor, colorFilter) => {
    if (!colorFilter) {
        return true;
    }

    const normalizedColor = normalizeSearchValue(carColor);

    if (colorFilter === 'other') {
        return normalizedColor && !commonHomeSearchColors.includes(normalizedColor);
    }

    return normalizedColor === colorFilter;
};

const getFilteredHomeSearchCars = () => {
    const filters = getHomeSearchFilters();

    return rentalCars.filter((car) =>
        matchesSearchValue(car.brand, filters.brand)
        && matchesSearchValue(car.category, filters.category)
        && isWithinYearRange(car.year, filters.yearFrom, filters.yearTo)
        && isWithinSearchRange(getCarPriceValue(car), filters.priceRange)
        && matchesSearchValue(car.condition, filters.condition)
        && isWithinSearchRange(getCarMileageValue(car), filters.mileageRange)
        && matchesSearchValue(car.fuel, filters.fuel)
        && matchesSearchValue(car.gearbox, filters.gearbox)
        && matchesSearchValue(car.origin, filters.origin)
        && matchesSearchColor(car.color, filters.color)
        && matchesSearchValue(car.seats, filters.seats)
    );
};

const getHomeSearchCriteriaText = () => {
    if (!homeSearchForm) {
        return 'Bạn chưa chọn tiêu chí, hệ thống đang hiển thị tất cả xe đang bán.';
    }

    const criteria = Array.from(homeSearchForm.elements)
        .filter((element) => ['SELECT', 'INPUT'].includes(element.tagName))
        .map((element) => {
            const value = String(element.value || '').trim();

            if (!value) {
                return '';
            }

            if (element.tagName === 'SELECT') {
                return element.selectedOptions?.[0]?.textContent.trim() || value;
            }

            if (element.name === 'yearFrom') {
                return `Từ năm ${value}`;
            }

            if (element.name === 'yearTo') {
                return `Đến năm ${value}`;
            }

            return value;
        })
        .filter(Boolean);

    if (!criteria.length) {
        return 'Bạn chưa chọn tiêu chí, hệ thống đang hiển thị tất cả xe đang bán.';
    }

    return `Tiêu chí: ${criteria.join(', ')}.`;
};

const getFilteredAllCars = () => {
    const keyword = normalizeSearchValue(allCarsSearchInput?.value);

    if (!keyword) {
        return rentalCars;
    }

    return rentalCars.filter((car) =>
        normalizeSearchValue(car.name).includes(keyword)
    );
};

const renderAllCarsGrid = () => {
    if (!allCarsGrid) {
        return;
    }

    const filteredCars = getFilteredAllCars();

    if (!filteredCars.length) {
        allCarsGrid.innerHTML = `
            <article class="all-cars-empty">
                <p>Không tìm thấy xe phù hợp với tên bạn nhập.</p>
            </article>
        `;
        return;
    }

    allCarsGrid.innerHTML = filteredCars.map(renderCarCard).join('');
};

const renderSearchResultsGrid = (cars = []) => {
    if (!searchResultsGrid) {
        return;
    }

    const criteriaText = getHomeSearchCriteriaText();

    if (searchResultsSummary) {
        searchResultsSummary.textContent = cars.length
            ? `Tìm thấy ${cars.length} xe phù hợp. ${criteriaText} Nhấn vào xe để xem chi tiết.`
            : `Không tìm thấy xe phù hợp. ${criteriaText}`;
    }

    if (!cars.length) {
        searchResultsGrid.innerHTML = `
            <article class="search-results-empty">
                <i class="bx bx-search-alt" aria-hidden="true"></i>
                <strong>Không tìm thấy xe theo tiêu chí đã chọn</strong>
                <p>Hãy thử chọn ít tiêu chí hơn, nới khoảng giá hoặc thay đổi số km để xem thêm xe phù hợp.</p>
            </article>
        `;
        return;
    }

    searchResultsGrid.innerHTML = cars.map(renderCarCard).join('');
};

const renderFavoriteCarsGrid = () => {
    if (!favoriteCarsGrid) {
        return;
    }

    if (!currentUser) {
        favoriteCarsGrid.innerHTML = `
            <article class="all-cars-empty">
                <p>Vui lòng đăng nhập để xem danh sách xe yêu thích.</p>
            </article>
        `;
        return;
    }

    if (!favoriteCars.length) {
        favoriteCarsGrid.innerHTML = `
            <article class="all-cars-empty">
                <p>Bạn chưa có xe yêu thích nào.</p>
            </article>
        `;
        return;
    }

    favoriteCarsGrid.innerHTML = favoriteCars.map(renderFavoriteCarListItem).join('');
};

const renderCars = (cars = []) => {
    if (!rentalContainer) {
        return;
    }

    rentalCars = cars;
    populateHomeSearchOptions();
    renderVisibleCars();
};

const updateRentalViewAllButton = () => {
    if (!rentalViewAllButton) {
        return;
    }

    const hasMoreCars = rentalCars.length > 0;

    rentalViewAllButton.hidden = !hasMoreCars;
    rentalViewAllButton.textContent = 'XEM TẤT CẢ +';

    if (rentalViewAllButton.matches('a[href]')) {
        rentalViewAllButton.removeAttribute('aria-expanded');
        return;
    }

    rentalViewAllButton.setAttribute(
        'aria-expanded',
        String(allCarsModal?.classList.contains('is-open'))
    );
};

const renderVisibleCars = () => {
    if (!rentalContainer) {
        return;
    }

    if (!rentalCars.length) {
        rentalContainer.innerHTML = `
            <article class="rental-card">
                <h3>Chưa có dữ liệu xe</h3>
                <p>Danh sách xe sẽ hiển thị ở đây ngay khi có dữ liệu từ hệ thống.</p>
            </article>
        `;
        updateRentalViewAllButton();
        updateRentalSliderControls();
        return;
    }

    rentalContainer.innerHTML = rentalCars
        .slice(0, featuredRentalLimit)
        .map(renderCarCard)
        .join('');
    rentalContainer.scrollLeft = 0;

    updateRentalViewAllButton();
    window.requestAnimationFrame(updateRentalSliderControls);
};

const renderCarsError = (message) => {
    if (!rentalContainer) {
        return;
    }

    rentalCars = [];
    rentalContainer.innerHTML = `
        <article class="rental-card">
            <h3>Không thể tải dữ liệu xe</h3>
            <p>${message}</p>
        </article>
    `;
    updateRentalViewAllButton();
    updateRentalSliderControls();
};

const syncFavoriteButtons = (carId) => {
    const normalizedCarId = String(carId);
    const isActive = isFavoriteCar(normalizedCarId);

    document.querySelectorAll(`[data-favorite-car="${CSS.escape(normalizedCarId)}"]`).forEach((button) => {
        const icon = button.querySelector('i');
        const car = rentalCars.find((item) => String(item.id) === normalizedCarId);

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.setAttribute('aria-label', `${isActive ? 'Bỏ yêu thích' : 'Yêu thích'} ${car?.name || 'xe này'}`);

        if (icon) {
            icon.className = `bx ${isActive ? 'bxs-heart' : 'bx-heart'}`;
        }
    });
};

const setFavoriteCars = (cars = []) => {
    favoriteCars = Array.isArray(cars) ? cars : [];
    favoriteCarIds = new Set(favoriteCars.map((car) => String(car.id)));
};

const refreshFavoriteUi = () => {
    document.querySelectorAll('[data-favorite-car]').forEach((button) => {
        syncFavoriteButtons(button.dataset.favoriteCar);
    });
    renderFavoriteCarsGrid();
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
        setFormFeedback(loginFeedback, 'Vui lòng đăng nhập để lưu xe yêu thích.');
        openLoginModal();
        return;
    }

    const shouldRemoveFavorite = isFavoriteCar(carId);

    favoriteButton.disabled = true;

    try {
        const { response, data } = await requestJson(`/api/favorites/${carId}`, {
            method: shouldRemoveFavorite ? 'DELETE' : 'POST',
        });

        if (!response.ok) {
            throw new Error(data.message || 'Không thể cập nhật xe yêu thích lúc này.');
        }

        setFavoriteCars(data.cars || []);
        refreshFavoriteUi();
    } catch (error) {
        window.alert(error.message || 'Không thể cập nhật xe yêu thích lúc này.');
    } finally {
        favoriteButton.disabled = false;
    }
};

const openCarDetailFromCard = (card) => {
    const detailUrl = card?.dataset.carDetailUrl;

    if (detailUrl) {
        window.location.href = detailUrl;
    }
};

const handleCarCardClick = (event) => {
    if (event.target.closest('a, button, input, select, textarea')) {
        return;
    }

    openCarDetailFromCard(event.target.closest('[data-car-detail-url]'));
};

const handleCarCardKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const card = event.target.closest('[data-car-detail-url]');

    if (!card || event.target !== card) {
        return;
    }

    event.preventDefault();
    openCarDetailFromCard(card);
};

const openAllCarsModal = () => {
    if (!allCarsModal || !allCarsGrid) {
        return;
    }

    if (allCarsSearchInput) {
        allCarsSearchInput.value = '';
    }

    renderAllCarsGrid();
    allCarsModal.classList.add('is-open');
    allCarsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('all-cars-modal-open');
    window.setTimeout(() => {
        allCarsSearchInput?.focus();
    }, 80);
    updateRentalViewAllButton();
};

const closeAllCarsModal = () => {
    if (!allCarsModal) {
        return;
    }

    allCarsModal.classList.remove('is-open');
    allCarsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('all-cars-modal-open');
    updateRentalViewAllButton();
};

const openSearchResultsModal = () => {
    if (!searchResultsModal) {
        return;
    }

    searchResultsModal.classList.add('is-open');
    searchResultsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-results-modal-open');
    window.setTimeout(() => {
        searchResultsModal.querySelector('[data-close-search-results]')?.focus();
    }, 80);
};

const closeSearchResultsModal = () => {
    if (!searchResultsModal) {
        return;
    }

    searchResultsModal.classList.remove('is-open');
    searchResultsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-results-modal-open');
};

const openFavoriteCarsModal = async () => {
    if (!favoriteCarsModal || !favoriteCarsGrid) {
        return;
    }

    if (!currentUser) {
        closeAccountMenu();
        setFormFeedback(loginFeedback, 'Vui lòng đăng nhập để xem xe yêu thích.');
        openLoginModal();
        return;
    }

    await syncFavoriteCars();
    renderFavoriteCarsGrid();
    favoriteCarsModal.classList.add('is-open');
    favoriteCarsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('favorite-cars-modal-open');
};

const closeFavoriteCarsModal = () => {
    if (!favoriteCarsModal) {
        return;
    }

    favoriteCarsModal.classList.remove('is-open');
    favoriteCarsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('favorite-cars-modal-open');
};

const openNotificationsModal = () => {
    if (!notificationsModal) {
        return;
    }

    if (!currentUser) {
        closeAccountMenu();
        setFormFeedback(loginFeedback, 'Vui lòng đăng nhập để xem thông báo.');
        openLoginModal();
        return;
    }

    notificationsModal.classList.add('is-open');
    notificationsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('notifications-modal-open');
};

const closeNotificationsModal = () => {
    if (!notificationsModal) {
        return;
    }

    notificationsModal.classList.remove('is-open');
    notificationsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('notifications-modal-open');
};

rentalViewAllButton?.addEventListener('click', (event) => {
    if (event.currentTarget.matches('a[href]')) {
        return;
    }

    openAllCarsModal();
});
rentalSliderPrevButton?.addEventListener('click', () => scrollRentalSlider(-1));
rentalSliderNextButton?.addEventListener('click', () => scrollRentalSlider(1));
rentalContainer?.addEventListener('scroll', updateRentalSliderControls, { passive: true });
rentalContainer?.addEventListener('click', handleFavoriteButtonClick);
rentalContainer?.addEventListener('click', handleCarCardClick);
rentalContainer?.addEventListener('keydown', handleCarCardKeydown);
allCarsGrid?.addEventListener('click', handleFavoriteButtonClick);
allCarsGrid?.addEventListener('click', handleCarCardClick);
allCarsGrid?.addEventListener('keydown', handleCarCardKeydown);
searchResultsGrid?.addEventListener('click', handleFavoriteButtonClick);
searchResultsGrid?.addEventListener('click', handleCarCardClick);
searchResultsGrid?.addEventListener('keydown', handleCarCardKeydown);
favoriteCarsGrid?.addEventListener('click', handleFavoriteButtonClick);
favoriteCarsGrid?.addEventListener('click', handleCarCardClick);
favoriteCarsGrid?.addEventListener('keydown', handleCarCardKeydown);
allCarsSearchInput?.addEventListener('input', renderAllCarsGrid);
allCarsCloseButtons.forEach((button) => {
    button.addEventListener('click', closeAllCarsModal);
});
searchResultsCloseButtons.forEach((button) => {
    button.addEventListener('click', closeSearchResultsModal);
});
favoriteCarsCloseButtons.forEach((button) => {
    button.addEventListener('click', closeFavoriteCarsModal);
});
notificationsCloseButtons.forEach((button) => {
    button.addEventListener('click', closeNotificationsModal);
});

homeSearchForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!rentalCars.length) {
        await syncCars();
    }

    renderSearchResultsGrid(getFilteredHomeSearchCars());
    openSearchResultsModal();
});

const getTeamMemberImage = (member) =>
    String(member?.avatarUrl || '').trim() || '../images/sale1.png';

const renderTeamMembers = (teamMembers = []) => {
    if (!teamContainer) {
        return;
    }

    if (!teamMembers.length) {
        teamContainer.innerHTML = `
            <article class="team-empty">
                <i class="bx bx-user-voice" aria-hidden="true"></i>
                <p>Admin chưa chọn nhân viên kinh doanh nổi bật để hiển thị trên trang chủ.</p>
            </article>
        `;
        return;
    }

    teamContainer.innerHTML = teamMembers.map((member) => {
        const phone = String(member.phone || '').trim();
        const phoneHref = phone.replace(/[^\d+]/g, '');

        return `
            <article class="team-box">
                <img src="${escapeHtml(getTeamMemberImage(member))}" alt="${escapeHtml(member.fullName || 'Nhân viên kinh doanh OkXe')}" class="team-img">
                <div class="team-data">
                    <span class="team-role">${escapeHtml(member.salesTitle || 'Nhân viên kinh doanh')}</span>
                    <h3>${escapeHtml(member.fullName || 'Nhân viên OkXe')}</h3>
                    <p>${escapeHtml(member.salesExperience || 'Tư vấn xe cũ chuyên nghiệp')}</p>
                    ${member.salesBio ? `<em>${escapeHtml(member.salesBio)}</em>` : ''}
                    ${phone ? `
                        <a class="team-contact" href="tel:${escapeHtml(phoneHref)}">
                            <i class="bx bx-phone-call" aria-hidden="true"></i>
                            <span>${escapeHtml(phone)}</span>
                        </a>
                    ` : ''}
                </div>
            </article>
        `;
    }).join('');
};

const syncTeamMembers = async () => {
    if (!teamContainer) {
        return;
    }

    try {
        const { response, data } = await requestJson('/api/team-members');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải đội ngũ nhân viên.');
        }

        renderTeamMembers(data.teamMembers || []);
    } catch (error) {
        teamContainer.innerHTML = `
            <article class="team-empty">
                <i class="bx bx-error-circle" aria-hidden="true"></i>
                <p>Không thể tải đội ngũ nhân viên lúc này.</p>
            </article>
        `;
    }
};

const syncCars = async () => {
    if (!rentalContainer) {
        return;
    }

    try {
        const { response, data } = await requestJson('/api/cars');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải danh sách xe.');
        }

        renderCars(data.cars || []);
    } catch (error) {
        renderCarsError(error.message || 'Không thể tải danh sách xe.');
    }
};

const accordionItems = document.querySelectorAll('.accordion-item');

const closeAccordionItem = (item) => {
    const content = item.querySelector('.accordion-content');
    const icon = item.querySelector('.accordion-icon');

    item.classList.remove('active');

    if (content) {
        content.style.maxHeight = '0px';
    }

    if (icon) {
        icon.classList.remove('bx-minus');
        icon.classList.add('bx-plus');
    }
};

const openAccordionItem = (item) => {
    const content = item.querySelector('.accordion-content');
    const icon = item.querySelector('.accordion-icon');

    item.classList.add('active');

    if (content) {
        content.style.maxHeight = `${content.scrollHeight}px`;
    }

    if (icon) {
        icon.classList.remove('bx-plus');
        icon.classList.add('bx-minus');
    }
};

accordionItems.forEach((item, index) => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');

    if (!header || !content) {
        return;
    }

    closeAccordionItem(item);

    if (index === 0) {
        openAccordionItem(item);
    }

    header.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        accordionItems.forEach((otherItem) => closeAccordionItem(otherItem));

        if (!isOpen) {
            openAccordionItem(item);
        }
    });
});

window.addEventListener('resize', () => {
    updateRentalSliderControls();

    if (window.innerWidth > 640) {
        closeMobileMenu();
    }

    const activeItem = document.querySelector('.accordion-item.active');

    if (activeItem) {
        const activeContent = activeItem.querySelector('.accordion-content');

        if (activeContent) {
            activeContent.style.maxHeight = `${activeContent.scrollHeight}px`;
        }
    }
});

const loginButton = document.querySelector('#open-login-modal') || document.querySelector('.login-btn');
const loginModal = document.querySelector('#login-modal');
const loginCloseButtons = document.querySelectorAll('[data-close-login]');
const loginForm = document.querySelector('.login-form');
const loginFeedback = document.querySelector('#login-feedback');

const signupButton = document.querySelector('#open-signup-modal') || document.querySelector('.sign-up-btn');
const signupModal = document.querySelector('#signup-modal');
const signupCloseButtons = document.querySelectorAll('[data-close-signup]');
const signupPasswordToggles = document.querySelectorAll('[data-toggle-password]');
const signupForm = document.querySelector('.signup-form');
const signupFeedback = document.querySelector('#signup-feedback');

const forgotPasswordLink = document.querySelector('#open-forgot-password-modal');
const forgotPasswordModal = document.querySelector('#forgot-password-modal');
const forgotPasswordCloseButtons = document.querySelectorAll('[data-close-forgot-password]');
const forgotPasswordForm = document.querySelector('.forgot-password-form');
const forgotPasswordFeedback = document.querySelector('#forgot-password-feedback');
const openResetPasswordButton = document.querySelector('#open-reset-password-modal');

const resetPasswordModal = document.querySelector('#reset-password-modal');
const resetPasswordCloseButtons = document.querySelectorAll('[data-close-reset-password]');
const resetPasswordForm = document.querySelector('.reset-password-form');
const resetPasswordFeedback = document.querySelector('#reset-password-feedback');
const resetPasswordSubtitle = document.querySelector('#reset-password-subtitle');
const resetPasswordToggles = document.querySelectorAll('[data-toggle-reset-password]');

const authState = document.querySelector('#auth-state');
const authUserName = document.querySelector('#auth-user-name');
const logoutButton = document.querySelector('#logout-button');
const accountMenu = document.querySelector('#account-menu');
const accountMenuTrigger = document.querySelector('#account-menu-trigger');
const accountMenuItems = document.querySelectorAll('.account-menu__item');
const profileOpenButtons = document.querySelectorAll('[data-open-profile]');
const favoriteOpenButtons = document.querySelectorAll('[data-open-favorites]');
const notificationOpenButtons = document.querySelectorAll('[data-open-notifications]');
const profileModal = document.querySelector('#profile-modal');
const profileCloseButtons = document.querySelectorAll('[data-close-profile]');
const profileForm = document.querySelector('.profile-form');
const profileFeedback = document.querySelector('#profile-feedback');
const profileAvatarInput = document.querySelector('#profile-avatar-input');
const profileAvatarPreview = document.querySelector('#profile-avatar-preview');
const chooseAvatarButton = document.querySelector('#choose-avatar-button');
const switchToSignupLink = document.querySelector('#switch-to-signup');
const switchToLoginLink = document.querySelector('#switch-to-login');
const maxProfileAvatarSize = 5 * 1024 * 1024;

let currentUser = null;
let selectedProfileAvatarFile = null;
let selectedProfileAvatarDataUrl = '';

const setFormFeedback = (element, message, type = 'error') => {
    if (!element) {
        return;
    }

    element.textContent = message || '';
    element.className = 'form-feedback';

    if (message) {
        element.classList.add(type === 'success' ? 'is-success' : 'is-error');
    }
};

const setBodyModalClass = (className, isOpen) => {
    document.body.classList.toggle(className, isOpen);
};

const setResetPasswordEmail = (email) => {
    if (!resetPasswordForm) {
        return;
    }

    const emailInput = resetPasswordForm.querySelector('input[name="email"]');

    if (emailInput) {
        emailInput.value = email || '';
    }
};

const closeLoginModal = () => {
    if (!loginModal) {
        return;
    }

    loginModal.classList.remove('is-open');
    loginModal.setAttribute('aria-hidden', 'true');
    setBodyModalClass('login-modal-open', false);
    setFormFeedback(loginFeedback, '');
};

const openLoginModal = () => {
    if (!loginModal) {
        return;
    }

    loginModal.classList.add('is-open');
    loginModal.setAttribute('aria-hidden', 'false');
    setBodyModalClass('login-modal-open', true);
    const firstInput = loginModal.querySelector('input');

    if (firstInput) {
        firstInput.focus();
    }
};

const closeSignupModal = () => {
    if (!signupModal) {
        return;
    }

    signupModal.classList.remove('is-open');
    signupModal.setAttribute('aria-hidden', 'true');
    setBodyModalClass('signup-modal-open', false);
    setFormFeedback(signupFeedback, '');
};

const openSignupModal = () => {
    if (!signupModal) {
        return;
    }

    signupModal.classList.add('is-open');
    signupModal.setAttribute('aria-hidden', 'false');
    setBodyModalClass('signup-modal-open', true);
    const firstInput = signupModal.querySelector('input');

    if (firstInput) {
        firstInput.focus();
    }
};

const closeForgotPasswordModal = () => {
    if (!forgotPasswordModal) {
        return;
    }

    forgotPasswordModal.classList.remove('is-open');
    forgotPasswordModal.setAttribute('aria-hidden', 'true');
    setBodyModalClass('forgot-password-modal-open', false);
    setFormFeedback(forgotPasswordFeedback, '');
};

const openForgotPasswordModal = () => {
    if (!forgotPasswordModal) {
        return;
    }

    forgotPasswordModal.classList.add('is-open');
    forgotPasswordModal.setAttribute('aria-hidden', 'false');
    setBodyModalClass('forgot-password-modal-open', true);
    const firstInput = forgotPasswordModal.querySelector('input');

    if (firstInput) {
        firstInput.focus();
    }
};

const closeResetPasswordModal = () => {
    if (!resetPasswordModal) {
        return;
    }

    resetPasswordModal.classList.remove('is-open');
    resetPasswordModal.setAttribute('aria-hidden', 'true');
    setBodyModalClass('reset-password-modal-open', false);
    setFormFeedback(resetPasswordFeedback, '');
};

const openResetPasswordModal = () => {
    if (!resetPasswordModal) {
        return;
    }

    resetPasswordModal.classList.add('is-open');
    resetPasswordModal.setAttribute('aria-hidden', 'false');
    setBodyModalClass('reset-password-modal-open', true);
    const firstInput = resetPasswordModal.querySelector('input');

    if (firstInput) {
        firstInput.focus();
    }
};

const setProfileAvatarPreview = (imageUrl = '') => {
    if (!profileAvatarPreview) {
        return;
    }

    profileAvatarPreview.innerHTML = imageUrl
        ? `<img src="${imageUrl}" alt="Ảnh đại diện">`
        : '<i class="bx bx-user"></i>';
};

const fillProfileForm = (user) => {
    if (!profileForm || !user) {
        return;
    }

    const address = user.address || {};

    profileForm.elements.fullName.value = user.fullName || '';
    profileForm.elements.phone.value = user.phone || '';
    profileForm.elements.citizenId.value = user.citizenId || '';
    profileForm.elements.email.value = user.email || '';
    profileForm.elements.birthDate.value = user.birthDate || '';
    profileForm.elements.gender.value = user.gender || '';
    profileForm.elements.addressProvince.value = address.province || '';
    profileForm.elements.addressDistrict.value = address.district || '';
    profileForm.elements.addressWard.value = address.ward || '';
    profileForm.elements.addressDetail.value = address.detail || '';
    selectedProfileAvatarFile = null;
    selectedProfileAvatarDataUrl = '';
    if (profileAvatarInput) {
        profileAvatarInput.value = '';
    }
    setProfileAvatarPreview(user.avatarUrl || '');
};

const closeProfileModal = () => {
    if (!profileModal) {
        return;
    }

    profileModal.classList.remove('is-open');
    profileModal.setAttribute('aria-hidden', 'true');
    setBodyModalClass('profile-modal-open', false);
    setFormFeedback(profileFeedback, '');
};

const openProfileModal = () => {
    if (!profileModal) {
        return;
    }

    if (!currentUser) {
        openLoginModal();
        return;
    }

    fillProfileForm(currentUser);
    profileModal.classList.add('is-open');
    profileModal.setAttribute('aria-hidden', 'false');
    setBodyModalClass('profile-modal-open', true);

    const firstInput = profileModal.querySelector('input');

    if (firstInput) {
        firstInput.focus();
    }
};

const setButtonLoading = (button, isLoading, defaultText) => {
    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? 'Đang xử lý...' : defaultText;
};

const setAccountMenuOpen = (isOpen) => {
    if (!accountMenu || !accountMenuTrigger) {
        return;
    }

    accountMenu.classList.toggle('is-open', isOpen);
    accountMenuTrigger.setAttribute('aria-expanded', String(isOpen));
};

const closeAccountMenu = () => {
    setAccountMenuOpen(false);
};

const updateAuthUi = (user) => {
    const isLoggedIn = Boolean(user);
    currentUser = user || null;

    if (authState) {
        authState.hidden = !isLoggedIn;
    }

    if (authUserName) {
        authUserName.textContent = user?.fullName || 'bạn';
    }

    if (loginButton) {
        loginButton.classList.toggle('is-hidden', isLoggedIn);
    }

    if (signupButton) {
        signupButton.classList.toggle('is-hidden', isLoggedIn);
    }

    if (!isLoggedIn) {
        closeAccountMenu();
    }
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error(`Không thể đọc file ${file.name}.`)));
    reader.readAsDataURL(file);
});

const requestJson = async (url, options = {}) => {
    const resolvedUrl = (() => {
        if (/^https?:\/\//i.test(url)) {
            return url;
        }

        if (window.location.protocol === 'file:') {
            return `http://localhost:3000${url}`;
        }

        return url;
    })();

    const requestOptions = {
        method: options.method || 'GET',
        headers: { ...(options.headers || {}) }
    };

    if (options.body) {
        requestOptions.body = options.body;
        requestOptions.headers['Content-Type'] = 'application/json';
    }

    let response;

    try {
        response = await fetch(resolvedUrl, requestOptions);
    } catch (error) {
        throw new Error(
            'Không thể kết nối tới server. Hãy mở trang qua http://localhost:3000 hoặc chạy backend trước.'
        );
    }

    const data = await response.json().catch(() => ({}));

    return { response, data };
};

const syncFavoriteCars = async () => {
    if (!currentUser) {
        setFavoriteCars([]);
        refreshFavoriteUi();
        return;
    }

    try {
        const { response, data } = await requestJson('/api/favorites');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải xe yêu thích.');
        }

        setFavoriteCars(data.cars || []);
    } catch (error) {
        setFavoriteCars([]);
    }

    refreshFavoriteUi();
};

const syncCurrentUser = async () => {
    try {
        const { response, data } = await requestJson('/api/auth/me');

        if (!response.ok || !data.user) {
            updateAuthUi(null);
            await syncFavoriteCars();
            return;
        }

        updateAuthUi(data.user);
        await syncFavoriteCars();
    } catch (error) {
        updateAuthUi(null);
        await syncFavoriteCars();
    }
};

const handleEscapeKey = (event) => {
    if (event.key !== 'Escape') {
        return;
    }

    if (accountMenu?.classList.contains('is-open')) {
        closeAccountMenu();
    } else if (allCarsModal?.classList.contains('is-open')) {
        closeAllCarsModal();
    } else if (searchResultsModal?.classList.contains('is-open')) {
        closeSearchResultsModal();
    } else if (favoriteCarsModal?.classList.contains('is-open')) {
        closeFavoriteCarsModal();
    } else if (notificationsModal?.classList.contains('is-open')) {
        closeNotificationsModal();
    } else if (profileModal?.classList.contains('is-open')) {
        closeProfileModal();
    } else if (resetPasswordModal?.classList.contains('is-open')) {
        closeResetPasswordModal();
    } else if (forgotPasswordModal?.classList.contains('is-open')) {
        closeForgotPasswordModal();
    } else if (signupModal?.classList.contains('is-open')) {
        closeSignupModal();
    } else if (loginModal?.classList.contains('is-open')) {
        closeLoginModal();
    }
};

document.addEventListener('keydown', handleEscapeKey);

if (accountMenu && accountMenuTrigger) {
    accountMenu.addEventListener('mouseenter', () => {
        setAccountMenuOpen(true);
    });

    accountMenu.addEventListener('mouseleave', closeAccountMenu);

    accountMenuTrigger.addEventListener('click', () => {
        if (window.matchMedia?.('(hover: hover)').matches) {
            setAccountMenuOpen(true);
            return;
        }

        setAccountMenuOpen(!accountMenu.classList.contains('is-open'));
    });

    accountMenuItems.forEach((item) => {
        item.addEventListener('click', closeAccountMenu);
    });

    document.addEventListener('click', (event) => {
        if (!accountMenu.contains(event.target)) {
            closeAccountMenu();
        }
    });
}

if (loginButton && loginModal) {
    loginButton.addEventListener('click', (event) => {
        event.preventDefault();
        openLoginModal();
    });

    loginCloseButtons.forEach((button) => {
        button.addEventListener('click', closeLoginModal);
    });

    loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            closeLoginModal();
        }
    });
}

if (signupButton && signupModal) {
    signupButton.addEventListener('click', (event) => {
        event.preventDefault();
        openSignupModal();
    });

    signupCloseButtons.forEach((button) => {
        button.addEventListener('click', closeSignupModal);
    });

    signupModal.addEventListener('click', (event) => {
        if (event.target === signupModal) {
            closeSignupModal();
        }
    });
}

profileOpenButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        closeAccountMenu();
        openProfileModal();
    });
});

favoriteOpenButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        closeAccountMenu();
        openFavoriteCarsModal();
    });
});

notificationOpenButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        closeAccountMenu();
        openNotificationsModal();
    });
});

if (profileModal) {
    profileCloseButtons.forEach((button) => {
        button.addEventListener('click', closeProfileModal);
    });

    profileModal.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            closeProfileModal();
        }
    });
}

if (notificationsModal) {
    notificationsModal.addEventListener('click', (event) => {
        if (event.target === notificationsModal) {
            closeNotificationsModal();
        }
    });
}

chooseAvatarButton?.addEventListener('click', () => {
    profileAvatarInput?.click();
});

profileAvatarInput?.addEventListener('change', async () => {
    const file = profileAvatarInput.files?.[0];

    setFormFeedback(profileFeedback, '');

    if (!file) {
        selectedProfileAvatarFile = null;
        selectedProfileAvatarDataUrl = '';
        setProfileAvatarPreview(currentUser?.avatarUrl || '');
        return;
    }

    if (!file.type.startsWith('image/')) {
        profileAvatarInput.value = '';
        setFormFeedback(profileFeedback, 'Chỉ được chọn file ảnh.');
        return;
    }

    if (file.size > maxProfileAvatarSize) {
        profileAvatarInput.value = '';
        setFormFeedback(profileFeedback, 'Ảnh đại diện tối đa 5MB.');
        return;
    }

    try {
        selectedProfileAvatarFile = file;
        selectedProfileAvatarDataUrl = await readFileAsDataUrl(file);
        setProfileAvatarPreview(selectedProfileAvatarDataUrl);
    } catch (error) {
        selectedProfileAvatarFile = null;
        selectedProfileAvatarDataUrl = '';
        setFormFeedback(profileFeedback, error.message || 'Không thể đọc ảnh đại diện.');
    }
});

if (forgotPasswordLink && forgotPasswordModal) {
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        closeLoginModal();
        openForgotPasswordModal();
    });

    forgotPasswordCloseButtons.forEach((button) => {
        button.addEventListener('click', closeForgotPasswordModal);
    });

    forgotPasswordModal.addEventListener('click', (event) => {
        if (event.target === forgotPasswordModal) {
            closeForgotPasswordModal();
        }
    });
}

if (openResetPasswordButton) {
    openResetPasswordButton.addEventListener('click', () => {
        const emailInput = forgotPasswordForm?.querySelector('input[name="email"]');

        setResetPasswordEmail(emailInput?.value || '');
        closeForgotPasswordModal();
        openResetPasswordModal();
    });
}

if (resetPasswordModal) {
    resetPasswordCloseButtons.forEach((button) => {
        button.addEventListener('click', closeResetPasswordModal);
    });

    resetPasswordModal.addEventListener('click', (event) => {
        if (event.target === resetPasswordModal) {
            closeResetPasswordModal();
        }
    });
}

signupPasswordToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');

        if (!input || !icon) {
            return;
        }

        const isPassword = input.type === 'password';

        input.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'bx bx-show' : 'bx bx-hide';
    });
});

resetPasswordToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');

        if (!input || !icon) {
            return;
        }

        const isPassword = input.type === 'password';

        input.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'bx bx-show' : 'bx bx-hide';
    });
});

if (switchToSignupLink) {
    switchToSignupLink.addEventListener('click', (event) => {
        event.preventDefault();
        closeLoginModal();
        openSignupModal();
    });
}

if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        closeSignupModal();
        openLoginModal();
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormFeedback(loginFeedback, '');

        const formData = new FormData(loginForm);
        const submitButton = loginForm.querySelector('.login-form__submit');

        setButtonLoading(submitButton, true, 'Đăng nhập');

        try {
            const { response, data } = await requestJson('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                    remember: formData.get('remember') === 'on'
                })
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể đăng nhập lúc này.');
            }

            updateAuthUi(data.user);
            await syncFavoriteCars();
            setFormFeedback(loginFeedback, data.message || 'Đăng nhập thành công.', 'success');
            loginForm.reset();

            window.setTimeout(() => {
                closeLoginModal();
            }, 900);
        } catch (error) {
            setFormFeedback(loginFeedback, error.message || 'Không thể đăng nhập lúc này.');
        } finally {
            setButtonLoading(submitButton, false, 'Đăng nhập');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormFeedback(signupFeedback, '');

        const formData = new FormData(signupForm);
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');
        const submitButton = signupForm.querySelector('.signup-form__submit');

        if (password !== confirmPassword) {
            setFormFeedback(signupFeedback, 'Mật khẩu xác nhận không khớp.');
            return;
        }

        setButtonLoading(submitButton, true, 'Tạo tài khoản');

        try {
            const { response, data } = await requestJson('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    password
                })
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể tạo tài khoản lúc này.');
            }

            updateAuthUi(data.user);
            await syncFavoriteCars();
            setFormFeedback(signupFeedback, data.message || 'Tạo tài khoản thành công.', 'success');
            signupForm.reset();

            window.setTimeout(() => {
                closeSignupModal();
            }, 900);
        } catch (error) {
            setFormFeedback(signupFeedback, error.message || 'Không thể tạo tài khoản lúc này.');
        } finally {
            setButtonLoading(submitButton, false, 'Tạo tài khoản');
        }
    });
}

if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormFeedback(profileFeedback, '');

        const formData = new FormData(profileForm);
        const submitButton = profileForm.querySelector('.profile-form__submit');
        const payload = {
            phone: formData.get('phone'),
            citizenId: formData.get('citizenId'),
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            addressProvince: formData.get('addressProvince'),
            addressDistrict: formData.get('addressDistrict'),
            addressWard: formData.get('addressWard'),
            addressDetail: formData.get('addressDetail')
        };

        if (selectedProfileAvatarFile && selectedProfileAvatarDataUrl) {
            payload.avatarFile = {
                name: selectedProfileAvatarFile.name,
                type: selectedProfileAvatarFile.type,
                dataUrl: selectedProfileAvatarDataUrl
            };
        }

        setButtonLoading(submitButton, true, 'Cập nhật thông tin');

        try {
            const { response, data } = await requestJson('/api/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể cập nhật thông tin lúc này.');
            }

            updateAuthUi(data.user);
            setFormFeedback(profileFeedback, data.message || 'Cập nhật thông tin thành công.', 'success');

            window.setTimeout(() => {
                closeProfileModal();
            }, 900);
        } catch (error) {
            setFormFeedback(profileFeedback, error.message || 'Không thể cập nhật thông tin lúc này.');
        } finally {
            setButtonLoading(submitButton, false, 'Cập nhật thông tin');
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormFeedback(forgotPasswordFeedback, '');

        const formData = new FormData(forgotPasswordForm);
        const email = String(formData.get('email') || '').trim();
        const submitButton = forgotPasswordForm.querySelector('.forgot-password-form__submit');

        setButtonLoading(submitButton, true, 'Gửi mã OTP');

        try {
            const { response, data } = await requestJson('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể gửi mã OTP lúc này.');
            }

            const hasPreviewFile = Boolean(data.previewFile);
            let successMessage = data.message || 'Mã OTP đã được gửi.';

            if (hasPreviewFile) {
                successMessage += ` Mở file này để lấy mã OTP: ${data.previewFile}`;
            }

            setFormFeedback(forgotPasswordFeedback, successMessage, 'success');
            setResetPasswordEmail(data.email || email);

            window.setTimeout(() => {
                closeForgotPasswordModal();
                if (resetPasswordSubtitle) {
                    resetPasswordSubtitle.textContent = hasPreviewFile
                        ? 'Mở file preview email để lấy mã OTP 6 số, rồi nhập mã và mật khẩu mới để hoàn tất khôi phục tài khoản.'
                        : 'Nhập email, mã OTP 6 số vừa nhận được và mật khẩu mới để hoàn tất khôi phục tài khoản.';
                }
                openResetPasswordModal();
            }, hasPreviewFile ? 2200 : 900);
        } catch (error) {
            setFormFeedback(forgotPasswordFeedback, error.message || 'Không thể gửi mã OTP lúc này.');
        } finally {
            setButtonLoading(submitButton, false, 'Gửi mã OTP');
        }
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormFeedback(resetPasswordFeedback, '');

        const formData = new FormData(resetPasswordForm);
        const email = String(formData.get('email') || '').trim();
        const otp = String(formData.get('otp') || '').trim();
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');
        const submitButton = resetPasswordForm.querySelector('.reset-password-form__submit');

        if (password !== confirmPassword) {
            setFormFeedback(resetPasswordFeedback, 'Mật khẩu xác nhận không khớp.');
            return;
        }

        setButtonLoading(submitButton, true, 'Cập nhật mật khẩu');

        try {
            const { response, data } = await requestJson('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    otp,
                    password
                })
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể đặt lại mật khẩu lúc này.');
            }

            setFormFeedback(resetPasswordFeedback, data.message || 'Đặt lại mật khẩu thành công.', 'success');
            resetPasswordForm.reset();

            window.setTimeout(() => {
                closeResetPasswordModal();
                openLoginModal();
            }, 1000);
        } catch (error) {
            setFormFeedback(resetPasswordFeedback, error.message || 'Không thể đặt lại mật khẩu lúc này.');
        } finally {
            setButtonLoading(submitButton, false, 'Cập nhật mật khẩu');
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        setButtonLoading(logoutButton, true, 'Đăng xuất');

        try {
            await requestJson('/api/auth/logout', { method: 'POST' });
        } finally {
            updateAuthUi(null);
            await syncFavoriteCars();
            setButtonLoading(logoutButton, false, 'Đăng xuất');
        }
    });
}

syncCars();
syncTeamMembers();
syncCurrentUser();
