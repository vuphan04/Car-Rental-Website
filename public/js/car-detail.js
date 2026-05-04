const detailRoot = document.querySelector('#car-detail-root');
let currentUser = null;
let favoriteCarIds = new Set();
let currentCar = null;
let galleryAutoplayTimer = null;
const GALLERY_AUTOPLAY_DELAY = 5000;

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);

const getCarIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');

    if (queryId) {
        return queryId;
    }

    const [, carsSegment, carId] = window.location.pathname.split('/');

    return carsSegment === 'cars' ? carId : '';
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

const isFavoriteCar = (carId) => favoriteCarIds.has(String(carId));

const setFavoriteCars = (cars = []) => {
    favoriteCarIds = new Set(
        (Array.isArray(cars) ? cars : []).map((car) => String(car.id))
    );
};

const getCarStatusClass = (status) => {
    const normalizedStatus = String(status || '').trim().toLocaleLowerCase('vi-VN');

    return ['xe đã bán', 'hết xe', 'hết hàng'].includes(normalizedStatus)
        ? 'is-sold'
        : 'is-available';
};

const syncFavoriteButton = (carId) => {
    const normalizedCarId = String(carId || '');
    const button = document.querySelector(`[data-favorite-car="${CSS.escape(normalizedCarId)}"]`);

    if (!button) {
        return;
    }

    const isActive = isFavoriteCar(normalizedCarId);
    const icon = button.querySelector('i');

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('aria-label', `${isActive ? 'Bỏ yêu thích' : 'Yêu thích'} ${currentCar?.name || 'xe này'}`);

    if (icon) {
        icon.className = `bx ${isActive ? 'bxs-heart' : 'bx-heart'}`;
    }
};

const renderError = (message) => {
    if (!detailRoot) {
        return;
    }

    detailRoot.innerHTML = `
        <article class="detail-error">
            <i class="bx bx-error-circle"></i>
            <div>
                <h1>Không thể mở chi tiết xe</h1>
                <p>${escapeHtml(message)}</p>
            </div>
            <a href="/#rentals">Quay lại danh sách xe</a>
        </article>
    `;
};

const renderSpecs = (car) => {
    const specs = [
        ['Hãng xe', car.brand],
        ['Phân khúc', car.category],
        ['Kiểu vận hành', car.type],
        ['Năm sản xuất', car.year],
        ['Nhiên liệu', car.fuel],
        ['Số km', car.mileage],
        ['Số chỗ', car.seats],
        ['Hộp số', car.gearbox],
        ['Xuất xứ', car.origin],
        ['Tình trạng', car.condition],
        ['Màu sắc', car.color],
        ['Trạng thái', car.actionText]
    ];

    return specs.map(([label, value]) => `
        <div class="spec-item">
            <span>${escapeHtml(label)}</span>
            <strong${label === 'Trạng thái' ? ` class="detail-status ${getCarStatusClass(value)}"` : ''}>${escapeHtml(value || 'Chưa cập nhật')}</strong>
        </div>
    `).join('');
};

const renderRelatedCars = (currentCar, cars) => {
    const relatedCars = cars
        .filter((car) => car.id !== currentCar.id && car.category === currentCar.category)
        .slice(0, 3);

    if (!relatedCars.length) {
        return '';
    }

    return `
        <section class="detail-card">
            <h2><i class="bx bx-category"></i>Xe cùng phân khúc</h2>
            <div class="related-grid">
                ${relatedCars.map((car) => {
                    const image = getCarImages(car)[0] || car.image;

                    return `
                        <a class="related-card" href="/cars/${car.id}">
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(car.name)}">
                            <span>${escapeHtml(car.category)}</span>
                            <strong>${escapeHtml(car.name)}</strong>
                            <small>${escapeHtml(car.price)}</small>
                        </a>
                    `;
                }).join('')}
            </div>
        </section>
    `;
};

const renderCarDetail = (car, cars) => {
    if (!detailRoot) {
        return;
    }

    const images = getCarImages(car);
    const primaryImage = images[0] || car.image || '';
    const galleryImages = images.length ? images : [primaryImage];
    const description = car.description || 'Xe đang được cập nhật mô tả chi tiết. Vui lòng liên hệ OkXe để nhận tư vấn tình trạng xe, hồ sơ và lịch xem xe.';
    const isFavorite = isFavoriteCar(car.id);

    document.title = `${car.name} - OkXe`;
    detailRoot.innerHTML = `
        <section class="detail-hero">
            <div class="detail-gallery">
                <button type="button" class="favorite-car-btn detail-favorite-btn${isFavorite ? ' is-active' : ''}" data-favorite-car="${escapeHtml(car.id)}" aria-pressed="${isFavorite}" aria-label="${isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${escapeHtml(car.name)}">
                    <i class="bx ${isFavorite ? 'bxs-heart' : 'bx-heart'}" aria-hidden="true"></i>
                </button>
                <div class="detail-carousel" id="detail-carousel" data-active-index="0">
                    <div class="detail-carousel-track" id="detail-carousel-track">
                        ${galleryImages.map((image, index) => `
                            <div class="detail-carousel-slide${index === 0 ? ' is-active' : ''}" data-carousel-slide="${index}">
                                <img src="${escapeHtml(image)}" alt="${escapeHtml(car.name)} - ảnh ${index + 1}" class="detail-main-image">
                            </div>
                        `).join('')}
                    </div>
                    <div class="detail-zoom-hint" aria-hidden="true">
                        <i class="bx bx-zoom-in"></i>
                        <span>Zoom ảnh</span>
                    </div>
                    ${galleryImages.length > 1 ? `
                        <button type="button" class="detail-carousel-btn detail-carousel-btn--prev" data-gallery-direction="-1" aria-label="Xem ảnh trước">
                            <i class="bx bx-chevron-left" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="detail-carousel-btn detail-carousel-btn--next" data-gallery-direction="1" aria-label="Xem ảnh tiếp theo">
                            <i class="bx bx-chevron-right" aria-hidden="true"></i>
                        </button>
                    ` : ''}
                </div>
                ${galleryImages.length > 1 ? `
                    <div class="detail-thumbs">
                        ${galleryImages.map((image, index) => `
                            <button class="detail-thumb${index === 0 ? ' is-active' : ''}" type="button" data-detail-image="${escapeHtml(image)}" data-detail-index="${index}" aria-label="Xem ảnh ${index + 1} của ${escapeHtml(car.name)}">
                                <img src="${escapeHtml(image)}" alt="Ảnh ${index + 1} của ${escapeHtml(car.name)}">
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <aside class="detail-summary">
                <span class="detail-brand">${escapeHtml(car.brand || car.category)}</span>
                <h1>${escapeHtml(car.name)}</h1>
                <div class="detail-price">${escapeHtml(car.price)}</div>
                <p class="detail-description">${escapeHtml(description)}</p>
                <div class="detail-actions">
                    <a class="detail-action detail-action--primary" href="/#footer">
                        <i class="bx bx-phone-call"></i>
                        <span>Liên hệ tư vấn</span>
                    </a>
                    <a class="detail-action detail-action--soft" href="/#rentals">
                        <i class="bx bx-left-arrow-alt"></i>
                        <span>Xem xe khác</span>
                    </a>
                </div>
                <div class="detail-contact-panel" aria-label="Tùy chọn liên hệ nhanh">
                    <a class="detail-contact-button detail-contact-button--quote" href="/#footer">
                        <span class="detail-contact-button__icon">
                            <i class="bx bx-dollar" aria-hidden="true"></i>
                        </span>
                        <span class="detail-contact-button__text">
                            <strong>Yêu cầu báo giá</strong>
                        </span>
                    </a>
                    <a class="detail-contact-button" href="/#footer">
                        <span class="detail-contact-button__icon">
                            <svg class="detail-contact-button__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <circle cx="12" cy="12" r="8.5"></circle>
                                <path d="M4.2 10.5h15.6"></path>
                                <path d="M12 12v7.8"></path>
                                <path d="M8.6 14.8l-3.1 2.8"></path>
                                <path d="M15.4 14.8l3.1 2.8"></path>
                            </svg>
                        </span>
                        <span class="detail-contact-button__text">
                            <strong>Đăng ký lái thử</strong>
                        </span>
                    </a>
                    <a class="detail-contact-button" href="/#footer">
                        <span class="detail-contact-button__icon">
                            <i class="bx bx-calculator" aria-hidden="true"></i>
                        </span>
                        <span class="detail-contact-button__text">
                            <strong>Chi phí lăn bánh</strong>
                        </span>
                    </a>
                </div>
            </aside>
        </section>

        <section class="detail-card">
            <h2><i class="bx bx-list-check"></i>Thông số kỹ thuật</h2>
            <div class="spec-grid">
                ${renderSpecs(car)}
            </div>
        </section>

        ${renderRelatedCars(car, cars)}
    `;
};

const bindGalleryEvents = () => {
    if (galleryAutoplayTimer) {
        window.clearInterval(galleryAutoplayTimer);
        galleryAutoplayTimer = null;
    }

    const carousel = document.querySelector('#detail-carousel');
    const track = document.querySelector('#detail-carousel-track');
    const slides = Array.from(document.querySelectorAll('[data-carousel-slide]'));
    const thumbnails = Array.from(document.querySelectorAll('[data-detail-image]'));
    const imageCount = slides.length;

    const updateGalleryImage = (nextIndex) => {
        if (!carousel || !track || !imageCount) {
            return;
        }

        const normalizedIndex = (nextIndex + imageCount) % imageCount;

        carousel.dataset.activeIndex = String(normalizedIndex);
        track.style.transform = `translateX(-${normalizedIndex * 100}%)`;
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === normalizedIndex);
        });
        thumbnails.forEach((item, index) => {
            item.classList.toggle('is-active', index === normalizedIndex);
        });
    };

    const getActiveIndex = () => Number(carousel?.dataset.activeIndex || 0);

    const showNextImage = (direction = 1) => {
        updateGalleryImage(getActiveIndex() + direction);
    };

    const startAutoplay = () => {
        if (imageCount <= 1 || galleryAutoplayTimer) {
            return;
        }

        galleryAutoplayTimer = window.setInterval(() => {
            showNextImage(1);
        }, GALLERY_AUTOPLAY_DELAY);
    };

    const stopAutoplay = () => {
        if (!galleryAutoplayTimer) {
            return;
        }

        window.clearInterval(galleryAutoplayTimer);
        galleryAutoplayTimer = null;
    };

    thumbnails.forEach((button) => {
        button.addEventListener('click', () => {
            updateGalleryImage(Number(button.dataset.detailIndex || 0));
            stopAutoplay();
            startAutoplay();
        });
    });

    document.querySelectorAll('[data-gallery-direction]').forEach((button) => {
        button.addEventListener('click', () => {
            showNextImage(Number(button.dataset.galleryDirection || 1));
            stopAutoplay();
            startAutoplay();
        });
    });

    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', () => {
            carousel.querySelectorAll('.detail-main-image').forEach((image) => {
                image.style.transformOrigin = '';
            });
            startAutoplay();
        });
        carousel.addEventListener('mousemove', (event) => {
            const bounds = carousel.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 100;
            const y = ((event.clientY - bounds.top) / bounds.height) * 100;
            const activeImage = carousel.querySelector('.detail-carousel-slide.is-active .detail-main-image');

            if (activeImage) {
                activeImage.style.transformOrigin = `${x}% ${y}%`;
            }
        });
    }

    startAutoplay();
};

const bindFavoriteEvents = () => {
    document.querySelectorAll('[data-favorite-car]').forEach((button) => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();

            const carId = String(button.dataset.favoriteCar || '');

            if (!carId) {
                return;
            }

            if (!currentUser) {
                window.alert('Vui lòng đăng nhập ở trang chủ để lưu xe yêu thích.');
                return;
            }

            const shouldRemoveFavorite = isFavoriteCar(carId);
            button.disabled = true;

            try {
                const { response, data } = await requestJson(`/api/favorites/${encodeURIComponent(carId)}`, {
                    method: shouldRemoveFavorite ? 'DELETE' : 'POST'
                });

                if (!response.ok) {
                    throw new Error(data.message || 'Không thể cập nhật xe yêu thích lúc này.');
                }

                setFavoriteCars(data.cars || []);
                syncFavoriteButton(carId);
            } catch (error) {
                window.alert(error.message || 'Không thể cập nhật xe yêu thích lúc này.');
            } finally {
                button.disabled = false;
            }
        });
    });
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

const loadCarDetail = async () => {
    const carId = getCarIdFromUrl();

    if (!carId) {
        renderError('Đường dẫn chi tiết xe không hợp lệ.');
        return;
    }

    try {
        const [carResponse, carsResponse] = await Promise.all([
            fetch(`/api/cars/${encodeURIComponent(carId)}`),
            fetch('/api/cars')
        ]);
        const carData = await carResponse.json().catch(() => ({}));
        const carsData = await carsResponse.json().catch(() => ({}));

        if (!carResponse.ok) {
            throw new Error(carData.message || 'Không tìm thấy xe.');
        }

        currentCar = carData.car;
        await syncCurrentUserAndFavorites();
        renderCarDetail(carData.car, Array.isArray(carsData.cars) ? carsData.cars : []);
        bindGalleryEvents();
        bindFavoriteEvents();
    } catch (error) {
        renderError(error.message || 'Không thể tải thông tin xe lúc này.');
    }
};

loadCarDetail();
