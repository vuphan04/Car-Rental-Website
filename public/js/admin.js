const carForm = document.querySelector('#car-form');
const carIdInput = document.querySelector('#car-id');
const formTitle = document.querySelector('#form-title');
const submitButton = document.querySelector('#submit-button');
const resetFormButton = document.querySelector('#reset-form-button');
const feedbackElement = document.querySelector('#admin-feedback');
const searchInput = document.querySelector('#car-search');
const refreshListButton = document.querySelector('#refresh-list-button');
const carTableBody = document.querySelector('#car-table-body');
const editorPanel = document.querySelector('#editor-panel');
const openFormButton = document.querySelector('#open-form-button');
const closeFormButton = document.querySelector('#close-form-button');
const toastStack = document.querySelector('#toast-stack');
const chooseImagesButton = document.querySelector('#choose-images-button');
const carImagesInput = document.querySelector('#car-images-input');
const imagePreviewList = document.querySelector('#image-preview-list');
const adminNavLinks = document.querySelectorAll('[data-admin-nav]');
const adminViews = document.querySelectorAll('[data-admin-view]');
const adminOnlyElements = document.querySelectorAll('[data-requires-admin]');
const adminLogoutButton = document.querySelector('#admin-logout-button');

const employeeForm = document.querySelector('#employee-form');
const employeeFormCard = document.querySelector('#employee-form-card');
const employeeIdInput = document.querySelector('#employee-id');
const employeeViewEyebrow = document.querySelector('#employee-view-eyebrow');
const employeeViewTitle = document.querySelector('#employee-view-title');
const employeeViewDescription = document.querySelector('#employee-view-description');
const employeeFormEyebrow = document.querySelector('#employee-form-eyebrow');
const employeeFormTitle = document.querySelector('#employee-form-title');
const employeeListEyebrow = document.querySelector('#employee-list-eyebrow');
const employeeListTitle = document.querySelector('#employee-list-title');
const employeeSubmitButton = document.querySelector('#employee-submit-button');
const employeeRefreshButton = document.querySelector('#employee-refresh-button');
const employeeResetButton = document.querySelector('#employee-reset-button');
const employeeFeedback = document.querySelector('#employee-feedback');
const employeeSearchInput = document.querySelector('#employee-search');
const employeeTableBody = document.querySelector('#employee-table-body');
const chooseEmployeeAvatarButton = document.querySelector('#choose-employee-avatar-button');
const employeeAvatarInput = document.querySelector('#employee-avatar-input');
const employeeAvatarPreview = document.querySelector('#employee-avatar-preview');
const employeeAvatarFileName = document.querySelector('#employee-avatar-file-name');
const customerDetailPanel = document.querySelector('#customer-detail-panel');
const customerDetailBody = document.querySelector('#customer-detail-body');
const customerDetailCloseButtons = document.querySelectorAll('[data-close-customer-detail]');

const totalCarsElement = document.querySelector('#stat-total-cars');
const averagePriceElement = document.querySelector('#stat-average-price');
const newCarsElement = document.querySelector('#stat-new-cars');

let cars = [];
let employees = [];
let currentAdminUser = null;
let editingEmployeeId = null;
let activeAccountView = 'staff';
let selectedCarImages = [];
let toastId = 0;
let modalCloseTimer = null;
let customerDetailCloseTimer = null;

const currencyFormatter = new Intl.NumberFormat('vi-VN');
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});
const maxCarImages = 10;
const maxUploadedImageSize = 5 * 1024 * 1024;
const roleLabels = {
    admin: 'Admin',
    staff: 'Nhân viên',
    customer: 'Khách hàng'
};
const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác'
};
const accountViews = {
    customers: {
        role: 'customer',
        eyebrow: 'Khách hàng',
        title: 'Quản lý khách hàng',
        description: 'Theo dõi tài khoản khách hàng đã đăng ký, thông tin liên hệ, ảnh đại diện và địa chỉ khách đã cập nhật.',
        formEyebrow: 'Thông tin khách hàng',
        createTitle: 'Khách hàng',
        createLabel: 'khách hàng',
        listEyebrow: 'Danh sách khách hàng',
        listTitle: 'Khách hàng',
        emptyMessage: 'Chưa có tài khoản khách hàng phù hợp.',
        searchPlaceholder: 'Tìm khách hàng theo tên hoặc email',
        canCreate: false
    },
    staff: {
        role: 'staff',
        eyebrow: 'Nhân viên',
        title: 'Quản lý nhân viên',
        description: 'Tạo tài khoản nhân viên, chỉnh sửa thông tin, đổi quyền và xóa tài khoản không còn sử dụng.',
        formEyebrow: 'Tài khoản nhân viên',
        createTitle: 'Nhân viên mới',
        createLabel: 'nhân viên',
        listEyebrow: 'Danh sách nhân viên',
        listTitle: 'Nhân viên',
        emptyMessage: 'Chưa có tài khoản nhân viên phù hợp.',
        searchPlaceholder: 'Tìm nhân viên theo tên hoặc email',
        canCreate: true
    },
    admins: {
        role: 'admin',
        eyebrow: 'Admin',
        title: 'Quản lý admin',
        description: 'Tạo tài khoản admin, chỉnh sửa thông tin, đổi quyền và bảo vệ hệ thống luôn còn ít nhất một admin.',
        formEyebrow: 'Tài khoản admin',
        createTitle: 'Admin mới',
        createLabel: 'admin',
        listEyebrow: 'Danh sách admin',
        listTitle: 'Admin',
        emptyMessage: 'Chưa có tài khoản admin phù hợp.',
        searchPlaceholder: 'Tìm admin theo tên hoặc email',
        canCreate: true
    }
};

const carSelectOptions = {
    category: ['Sedan', 'SUV', 'Thể thao'],
    type: ['Tự động', 'Số sàn'],
    fuel: ['Xăng', 'Diesel', 'Hybrid', 'Điện'],
    seats: ['4 chỗ', '5 chỗ', '7 chỗ', '9 chỗ'],
    gearbox: ['Số Sàn', 'Tự động'],
    origin: ['Nhập khẩu', 'Trong nước'],
    condition: ['Xe mới', 'Xe cũ'],
    actionText: ['Còn xe', 'Xe đã bán']
};
const carSelectAliases = {
    type: {
        hybrid: 'Tự động',
        'số tự động': 'Tự động',
        san: 'Số sàn',
        'sàn': 'Số sàn'
    },
    fuel: {
        dau: 'Diesel',
        dầu: 'Diesel',
        dien: 'Điện'
    },
    gearbox: {
        'số sàn': 'Số Sàn',
        san: 'Số Sàn',
        'sàn': 'Số Sàn',
        'tự động / tay': 'Tự động',
        'số tự động': 'Tự động'
    },
    actionText: {
        'mua ngay': 'Còn xe',
        'còn hàng': 'Còn xe',
        'het hang': 'Xe đã bán',
        'hết hàng': 'Xe đã bán',
        'het xe': 'Xe đã bán',
        'hết xe': 'Xe đã bán',
        'xe da ban': 'Xe đã bán'
    }
};
const carSelectDefaults = {
    actionText: 'Còn xe'
};

const normalizeOptionKey = (value) =>
    String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');

const getCanonicalCarSelectValue = (fieldName, value) => {
    const normalizedValue = String(value || '').trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
        return carSelectDefaults[fieldName] || '';
    }

    const optionKey = normalizeOptionKey(normalizedValue);
    const matchedOption = carSelectOptions[fieldName]?.find(
        (option) => normalizeOptionKey(option) === optionKey
    );

    return matchedOption || carSelectAliases[fieldName]?.[optionKey] || normalizedValue;
};

const setCarFormValue = (fieldName, value) => {
    const formField = carForm?.elements[fieldName];

    if (!formField) {
        return;
    }

    const fieldValue = carSelectOptions[fieldName]
        ? getCanonicalCarSelectValue(fieldName, value)
        : value ?? '';

    formField.value = fieldValue;

    if (formField.tagName === 'SELECT' && formField.value !== fieldValue) {
        formField.value = carSelectDefaults[fieldName] || '';
    }
};

const isAccountView = (viewName) => Object.prototype.hasOwnProperty.call(accountViews, viewName);
const getActiveAccountConfig = () => accountViews[activeAccountView] || accountViews.staff;
const canViewAccountView = (viewName) =>
    viewName === 'customers' ? Boolean(currentAdminUser?.isAdmin) : isCurrentUserAdmin();
const getCreateAccountButtonHtml = () => {
    const config = getActiveAccountConfig();
    return `<i class="bx bx-user-plus"></i><span>Tạo ${config.createLabel}</span>`;
};

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));

const formatCompactPrice = (value) => {
    const numericValue = Number(value || 0);

    if (numericValue >= 1000000000) {
        return `${(numericValue / 1000000000).toLocaleString('vi-VN', {
            maximumFractionDigits: 1
        })} tỷ VNĐ`;
    }

    if (numericValue >= 1000000) {
        return `${Math.round(numericValue / 1000000).toLocaleString('vi-VN')} triệu VNĐ`;
    }

    return `${currencyFormatter.format(numericValue)} VNĐ`;
};

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
            'Không thể kết nối tới server. Hãy mở trang qua http://localhost:3000/admin hoặc chạy backend trước.'
        );
    }

    const data = await response.json().catch(() => ({}));

    return { response, data };
};

const isCurrentUserAdmin = () => currentAdminUser?.role === 'admin';

const syncAccountViewContent = () => {
    const config = getActiveAccountConfig();

    if (employeeViewEyebrow) {
        employeeViewEyebrow.textContent = config.eyebrow;
    }
    if (employeeViewTitle) {
        employeeViewTitle.textContent = config.title;
    }
    if (employeeViewDescription) {
        employeeViewDescription.textContent = config.description;
    }
    if (employeeFormEyebrow) {
        employeeFormEyebrow.textContent = config.formEyebrow;
    }
    if (employeeListEyebrow) {
        employeeListEyebrow.textContent = config.listEyebrow;
    }
    if (employeeListTitle) {
        employeeListTitle.textContent = config.listTitle;
    }
    if (employeeSearchInput) {
        employeeSearchInput.placeholder = config.searchPlaceholder;
    }
    if (!editingEmployeeId && employeeFormTitle) {
        employeeFormTitle.textContent = config.createTitle;
    }
    if (!editingEmployeeId && employeeSubmitButton) {
        employeeSubmitButton.innerHTML = getCreateAccountButtonHtml();
    }
    if (!editingEmployeeId && employeeForm?.elements.role && config.canCreate) {
        employeeForm.elements.role.value = config.role;
    }
    if (employeeFormCard) {
        employeeFormCard.hidden = !isCurrentUserAdmin() || (!editingEmployeeId && !config.canCreate);
    }
};

const switchAdminView = (viewName) => {
    const selectedViewName = isAccountView(viewName) ? 'employees' : viewName;

    if (isAccountView(viewName)) {
        activeAccountView = viewName;
        if (employeeSearchInput) {
            employeeSearchInput.value = '';
        }
        resetEmployeeForm();
        syncAccountViewContent();
    }

    adminViews.forEach((view) => {
        const isActive = view.dataset.adminView === selectedViewName;

        view.hidden = !isActive;
        view.classList.toggle('is-active', isActive);
    });

    adminNavLinks.forEach((link) => {
        const isActive = link.dataset.adminNav === viewName;

        link.classList.toggle('is-active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    if (isAccountView(viewName) && canViewAccountView(viewName)) {
        loadEmployees();
    }
};

const syncCurrentAdminUser = async () => {
    try {
        const { response, data } = await requestJson('/api/auth/admin-me');

        if (!response.ok || !data.user?.isAdmin) {
            window.location.replace('/admin-login?login=required');
            return false;
        }

        currentAdminUser = data.user;

        if (isCurrentUserAdmin()) {
            adminOnlyElements.forEach((element) => {
                element.hidden = false;
            });
        }

        return true;
    } catch (error) {
        window.location.replace('/admin-login?login=required');
        return false;
    }
};

const setFeedback = (message, type = 'success') => {
    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = message || '';
    feedbackElement.className = 'admin-feedback';

    if (message) {
        feedbackElement.classList.add(type === 'success' ? 'is-success' : 'is-error');
    }
};

const setEmployeeFeedback = (message, type = 'success') => {
    if (!employeeFeedback) {
        return;
    }

    employeeFeedback.textContent = message || '';
    employeeFeedback.className = 'admin-feedback';

    if (message) {
        employeeFeedback.classList.add(type === 'success' ? 'is-success' : 'is-error');
    }
};

const showToast = (message, type = 'success', title) => {
    if (!toastStack || !message) {
        return;
    }

    const toast = document.createElement('article');
    const currentToastId = `toast-${Date.now()}-${toastId += 1}`;
    const toastTitle = title || (type === 'success' ? 'Thành công' : 'Có lỗi xảy ra');

    toast.className = `toast toast--${type}`;
    toast.dataset.toastId = currentToastId;
    toast.innerHTML = `
        <span class="toast__icon">
            <i class="bx ${type === 'success' ? 'bx-check' : 'bx-x'}"></i>
        </span>
        <div class="toast__content">
            <strong class="toast__title">${toastTitle}</strong>
            <p class="toast__message">${message}</p>
        </div>
        <button type="button" class="toast__close" aria-label="Đóng thông báo">
            <i class="bx bx-x"></i>
        </button>
    `;

    const removeToast = () => {
        toast.classList.remove('is-visible');
        toast.classList.add('is-closing');
        window.setTimeout(() => {
            toast.remove();
        }, 220);
    };

    toast.querySelector('.toast__close')?.addEventListener('click', removeToast);
    toastStack.appendChild(toast);
    window.requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });
    window.setTimeout(removeToast, 3200);
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

const syncImageInput = () => {
    if (carForm?.elements.image) {
        carForm.elements.image.value = selectedCarImages[0] || '';
    }
};

const renderImagePreviews = () => {
    if (!imagePreviewList) {
        return;
    }

    if (!selectedCarImages.length) {
        imagePreviewList.innerHTML = '<p class="image-preview-empty">Chưa có ảnh xe nào được chọn.</p>';
        syncImageInput();
        return;
    }

    imagePreviewList.innerHTML = selectedCarImages.map((image, index) => `
        <article class="image-preview-item">
            <img src="${image}" alt="Ảnh xe ${index + 1}">
            ${index === 0 ? '<span class="image-preview-item__badge">Ảnh chính</span>' : ''}
            <button type="button" class="image-preview-item__remove" data-remove-image="${index}" aria-label="Xóa ảnh ${index + 1}">
                <i class="bx bx-x"></i>
            </button>
        </article>
    `).join('');

    syncImageInput();
};

const setCarImages = (images = []) => {
    selectedCarImages = images
        .map((image) => String(image || '').trim())
        .filter(Boolean)
        .filter((image, index, imageList) => imageList.indexOf(image) === index)
        .slice(0, maxCarImages);

    renderImagePreviews();
};

const setEmployeeAvatarPreview = (avatarUrl = '', fileName = '') => {
    if (employeeAvatarPreview) {
        const normalizedAvatarUrl = String(avatarUrl || '').trim();

        employeeAvatarPreview.innerHTML = normalizedAvatarUrl
            ? `<img src="${escapeHtml(normalizedAvatarUrl)}" alt="Ảnh đại diện nhân viên">`
            : '<i class="bx bx-user"></i>';
    }

    if (employeeAvatarFileName) {
        employeeAvatarFileName.textContent = fileName || (avatarUrl ? 'Đã chọn ảnh đại diện' : 'Chưa chọn ảnh');
    }
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error(`Không thể đọc file ${file.name}.`)));
    reader.readAsDataURL(file);
});

const uploadEmployeeAvatar = async (file) => {
    if (!file.type.startsWith('image/')) {
        throw new Error('Chỉ được chọn file ảnh.');
    }

    if (file.size > maxUploadedImageSize) {
        throw new Error(`Ảnh "${file.name}" vượt quá 5MB.`);
    }

    const { response, data } = await requestJson('/api/uploads/avatar', {
        method: 'POST',
        body: JSON.stringify({
            file: {
                name: file.name,
                type: file.type,
                dataUrl: await readFileAsDataUrl(file)
            }
        })
    });

    if (!response.ok) {
        throw new Error(data.message || 'Không thể tải ảnh đại diện lúc này.');
    }

    return data.avatarUrl || '';
};

const uploadCarImages = async (files) => {
    const invalidTypeFile = files.find((file) => !file.type.startsWith('image/'));

    if (invalidTypeFile) {
        throw new Error('Chỉ được chọn file ảnh.');
    }

    const oversizedFile = files.find((file) => file.size > maxUploadedImageSize);

    if (oversizedFile) {
        throw new Error(`Ảnh "${oversizedFile.name}" vượt quá 5MB.`);
    }

    const payloadFiles = await Promise.all(files.map(async (file) => ({
        name: file.name,
        type: file.type,
        dataUrl: await readFileAsDataUrl(file)
    })));
    const { response, data } = await requestJson('/api/uploads/car-images', {
        method: 'POST',
        body: JSON.stringify({ files: payloadFiles })
    });

    if (!response.ok) {
        throw new Error(data.message || 'Không thể tải ảnh xe lúc này.');
    }

    return data.images || [];
};

const openEditor = () => {
    if (editorPanel) {
        window.clearTimeout(modalCloseTimer);
        editorPanel.hidden = false;
        editorPanel.classList.remove('is-closing');
        editorPanel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.requestAnimationFrame(() => {
            editorPanel.classList.add('is-visible');
        });
    }
};

const closeEditor = () => {
    if (editorPanel) {
        editorPanel.classList.remove('is-visible');
        editorPanel.classList.add('is-closing');
        editorPanel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        window.clearTimeout(modalCloseTimer);
        modalCloseTimer = window.setTimeout(() => {
            editorPanel.hidden = true;
            editorPanel.classList.remove('is-closing');
        }, 280);
    }
};

const resetFormState = (shouldClose = true) => {
    if (!carForm) {
        return;
    }

    carForm.reset();
    carIdInput.value = '';
    setCarImages([]);
    if (carImagesInput) {
        carImagesInput.value = '';
    }
    submitButton.textContent = 'Thêm xe';
    formTitle.textContent = 'Thêm xe mới';
    setFeedback('');

    if (shouldClose) {
        closeEditor();
    }
};

const fillForm = (car) => {
    if (!carForm) {
        return;
    }

    carIdInput.value = car.id;
    carForm.elements.brand.value = car.brand || '';
    setCarFormValue('category', car.category);
    carForm.elements.name.value = car.name;
    carForm.elements.description.value = car.description || '';
    setCarFormValue('type', car.type);
    carForm.elements.priceText.value = car.price;
    carForm.elements.priceValue.value = car.priceValue;
    setCarImages(getCarImages(car));
    carForm.elements.year.value = car.year;
    setCarFormValue('fuel', car.fuel);
    carForm.elements.mileageText.value = car.mileage;
    carForm.elements.mileageValue.value = car.mileageValue;
    setCarFormValue('seats', car.seats);
    setCarFormValue('gearbox', car.gearbox);
    setCarFormValue('origin', car.origin);
    setCarFormValue('condition', car.condition);
    carForm.elements.color.value = car.color;
    setCarFormValue('actionText', car.actionText);

    submitButton.textContent = 'Cập nhật xe';
    formTitle.textContent = `Chỉnh sửa: ${car.name}`;
    openEditor();
    carForm.elements.name.focus();
};

const updateStats = (items) => {
    const totalCars = items.length;
    const totalPrice = items.reduce((sum, car) => sum + Number(car.priceValue || 0), 0);
    const averagePrice = totalCars ? Math.round(totalPrice / totalCars) : 0;
    const newCars = items.filter((car) => String(car.condition).toLowerCase().includes('mới')).length;

    totalCarsElement.textContent = String(totalCars);
    averagePriceElement.textContent = formatCompactPrice(averagePrice);
    newCarsElement.textContent = String(newCars);
};

const getFilteredCars = () => {
    const keyword = String(searchInput?.value || '').trim().toLowerCase();

    if (!keyword) {
        return cars;
    }

    return cars.filter((car) =>
        [car.name, car.brand, car.category, car.type, car.condition, car.origin]
            .join(' ')
            .toLowerCase()
            .includes(keyword)
    );
};

const renderCars = () => {
    if (!carTableBody) {
        return;
    }

    const filteredCars = getFilteredCars();
    updateStats(filteredCars);

    if (!filteredCars.length) {
        carTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">Không tìm thấy xe phù hợp với bộ lọc hiện tại.</td>
            </tr>
        `;
        return;
    }

    carTableBody.innerHTML = filteredCars.map((car) => {
        const images = getCarImages(car);
        const imageCount = images.length;

        return `
            <tr>
                <td>
                    <div class="car-image-stack">
                        <img src="${images[0] || car.image}" alt="${car.name}" class="car-image">
                        ${imageCount > 1 ? `<span class="car-image-count">+${imageCount - 1}</span>` : ''}
                    </div>
                </td>
                <td>
                <div class="car-name">
                    <strong>${car.name}</strong>
                    <span>${car.brand || 'Chưa có hãng'} • ${car.year} • ${car.fuel} • ${car.condition}</span>
                    ${car.description ? `<small>${escapeHtml(car.description)}</small>` : ''}
                </div>
                </td>
                <td>
                    <span class="pill pill--category">${car.category}</span>
                </td>
                <td>
                    <span class="pill pill--gearbox">${car.gearbox}</span>
                </td>
                <td>
                    <div class="price-stack">
                        <strong>${car.price}</strong>
                        <span class="price-note">${currencyFormatter.format(car.priceValue)} VNĐ</span>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="icon-btn icon-btn--edit" data-edit-car="${car.id}" aria-label="Sửa ${car.name}">
                            <i class="bx bx-pencil"></i>
                        </button>
                        <button type="button" class="icon-btn icon-btn--delete" data-delete-car="${car.id}" aria-label="Xóa ${car.name}">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

const loadCars = async () => {
    setFeedback('');

    try {
        const { response, data } = await requestJson('/api/cars');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải danh sách xe.');
        }

        cars = data.cars || [];
        renderCars();
    } catch (error) {
        setFeedback(error.message || 'Không thể tải danh sách xe.', 'error');
        carTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">Không thể tải dữ liệu xe từ hệ thống.</td>
            </tr>
        `;
    }
};

const getUserAddressText = (user) => {
    const address = user?.address || {};

    return [
        address.detail,
        address.ward,
        address.district,
        address.province
    ].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
};

const getUserProfileDate = (value) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : dateFormatter.format(date);
};

const getCustomerDetailValue = (value, fallback = 'Chưa cập nhật') => {
    const normalizedValue = String(value || '').trim();

    return normalizedValue || fallback;
};

const closeCustomerDetail = () => {
    if (!customerDetailPanel) {
        return;
    }

    customerDetailPanel.classList.remove('is-visible');
    customerDetailPanel.classList.add('is-closing');
    customerDetailPanel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    window.clearTimeout(customerDetailCloseTimer);
    customerDetailCloseTimer = window.setTimeout(() => {
        customerDetailPanel.hidden = true;
        customerDetailPanel.classList.remove('is-closing');
    }, 280);
};

const openCustomerDetail = (user) => {
    if (!customerDetailPanel || !customerDetailBody || !user) {
        return;
    }

    const createdDate = user.createdAt
        ? dateFormatter.format(new Date(user.createdAt))
        : 'Chưa rõ';
    const updatedDate = user.updatedAt
        ? dateFormatter.format(new Date(user.updatedAt))
        : 'Chưa rõ';
    const avatarHtml = user.avatarUrl
        ? `<img src="${escapeHtml(user.avatarUrl)}" alt="Ảnh đại diện ${escapeHtml(user.fullName || user.email)}">`
        : '<i class="bx bx-user"></i>';
    const addressText = getUserAddressText(user) || 'Chưa cập nhật';
    const genderText = genderLabels[user.gender] || 'Chưa cập nhật';
    const birthDateText = getUserProfileDate(user.birthDate);

    customerDetailBody.innerHTML = `
        <div class="customer-detail__profile">
            <span class="customer-detail__avatar">${avatarHtml}</span>
            <div>
                <h4>${escapeHtml(user.fullName || 'Chưa có tên')}</h4>
                <p>ID: ${user.id} · ${escapeHtml(roleLabels[user.role] || user.role || 'Khách hàng')}</p>
            </div>
        </div>
        <div class="customer-detail__grid">
            <div class="customer-detail__item">
                <span>Email</span>
                <strong>${escapeHtml(getCustomerDetailValue(user.email))}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Số điện thoại</span>
                <strong>${escapeHtml(getCustomerDetailValue(user.phone))}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Số CCCD</span>
                <strong>${escapeHtml(getCustomerDetailValue(user.citizenId, 'Chưa cập nhật CCCD'))}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Ngày sinh</span>
                <strong>${escapeHtml(birthDateText)}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Giới tính</span>
                <strong>${escapeHtml(genderText)}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Ngày tạo</span>
                <strong>${escapeHtml(createdDate)}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Cập nhật</span>
                <strong>${escapeHtml(updatedDate)}</strong>
            </div>
            <div class="customer-detail__item">
                <span>Vai trò</span>
                <strong>${escapeHtml(roleLabels[user.role] || user.role || 'Khách hàng')}</strong>
            </div>
            <div class="customer-detail__item customer-detail__item--wide">
                <span>Địa chỉ liên hệ</span>
                <strong>${escapeHtml(addressText)}</strong>
            </div>
        </div>
    `;

    customerDetailPanel.hidden = false;
    customerDetailPanel.setAttribute('aria-hidden', 'false');
    customerDetailPanel.classList.remove('is-closing');
    document.body.classList.add('modal-open');
    window.clearTimeout(customerDetailCloseTimer);
    window.requestAnimationFrame(() => {
        customerDetailPanel.classList.add('is-visible');
    });
};

const getFilteredEmployees = () => {
    const keyword = String(employeeSearchInput?.value || '').trim().toLowerCase();
    const config = getActiveAccountConfig();
    const usersInActiveRole = employees.filter((user) => user.role === config.role);

    if (!keyword) {
        return usersInActiveRole;
    }

    return usersInActiveRole.filter((user) =>
        [
            user.fullName,
            user.email,
            user.phone,
            user.citizenId,
            user.birthDate,
            genderLabels[user.gender] || user.gender,
            user.salesTitle,
            user.salesExperience,
            user.salesBio,
            getUserAddressText(user),
            roleLabels[user.role] || user.role
        ]
            .join(' ')
            .toLowerCase()
            .includes(keyword)
    );
};

const renderEmployees = () => {
    if (!employeeTableBody) {
        return;
    }

    const filteredEmployees = getFilteredEmployees();
    const config = getActiveAccountConfig();

    if (!filteredEmployees.length) {
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty">${config.emptyMessage}</td>
            </tr>
        `;
        return;
    }

    employeeTableBody.innerHTML = filteredEmployees.map((user) => {
        const isSelf = currentAdminUser?.id === user.id;
        const createdDate = user.createdAt
            ? dateFormatter.format(new Date(user.createdAt))
            : 'Chưa rõ';
        const updatedDate = user.updatedAt
            ? dateFormatter.format(new Date(user.updatedAt))
            : 'Chưa rõ';
        const phoneText = user.phone || 'Chưa cập nhật';
        const citizenIdText = user.citizenId || 'Chưa cập nhật CCCD';
        const birthDateText = getUserProfileDate(user.birthDate);
        const genderText = genderLabels[user.gender] || 'Chưa cập nhật';
        const addressText = getUserAddressText(user) || 'Chưa cập nhật';
        const salesTitle = user.salesTitle || 'Nhân viên kinh doanh';
        const salesExperience = user.salesExperience || 'Chưa cập nhật kinh nghiệm';
        const canShowOnHome = ['staff', 'admin'].includes(user.role);
        const avatarHtml = user.avatarUrl
            ? `<img src="${escapeHtml(user.avatarUrl)}" alt="Ảnh đại diện ${escapeHtml(user.fullName || user.email)}">`
            : '<i class="bx bx-user"></i>';

        const roleControl = user.role === 'customer'
            ? '<span class="role-label role-label--customer">Khách hàng</span>'
            : `
                    <select class="role-select" data-user-role="${user.id}" ${isSelf ? 'disabled' : ''}>
                        <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Nhân viên</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                `;
        const homepageControl = canShowOnHome
            ? `
                    <button type="button" class="homepage-toggle${user.showOnHome ? ' is-active' : ''}" data-toggle-home-user="${user.id}" aria-pressed="${user.showOnHome ? 'true' : 'false'}">
                        <i class="bx ${user.showOnHome ? 'bxs-star' : 'bx-star'}" aria-hidden="true"></i>
                        <span>${user.showOnHome ? 'Đang hiển thị' : 'Ẩn'}</span>
                    </button>
                    <small class="homepage-order">Thứ tự: ${Number(user.homeDisplayOrder || 0)}</small>
                `
            : '<span class="readonly-badge">Không áp dụng</span>';
        const profileHtml = canShowOnHome
            ? `
                    <strong>${escapeHtml(salesTitle)}</strong>
                    <span>${escapeHtml(salesExperience)}</span>
                `
            : `
                    <strong>${escapeHtml(birthDateText)}</strong>
                    <span>${escapeHtml(genderText)}</span>
                    <small>Cập nhật ${escapeHtml(updatedDate)}</small>
                `;
        const actionControl = isCurrentUserAdmin()
            ? `
                    <div class="table-actions">
                        ${user.role === 'customer' ? `
                            <button type="button" class="icon-btn icon-btn--neutral" data-view-customer="${user.id}" aria-label="Xem thông tin ${escapeHtml(user.fullName || user.email)}" title="Xem thông tin khách hàng">
                                <i class="bx bx-show"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="icon-btn icon-btn--edit" data-edit-user="${user.id}" aria-label="Sửa ${escapeHtml(user.fullName || user.email)}" title="Chỉnh sửa thông tin">
                            <i class="bx bx-pencil"></i>
                        </button>
                        <button type="button" class="icon-btn icon-btn--delete" data-delete-user="${user.id}" aria-label="Xóa ${escapeHtml(user.fullName || user.email)}" ${isSelf ? 'disabled' : ''}>
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                `
            : '<span class="readonly-badge">Chỉ xem</span>';

        return `
            <tr ${user.role === 'customer' ? `data-view-customer="${user.id}"` : ''}>
                <td>
                    <div class="employee-name">
                        <span class="employee-avatar">${avatarHtml}</span>
                        <span>
                            <strong>${escapeHtml(user.fullName || 'Chưa có tên')}</strong>
                            <small>ID: ${user.id} · Tạo ${createdDate}</small>
                        </span>
                    </div>
                </td>
                <td>
                    <div class="employee-meta">
                        <strong>${escapeHtml(user.email)}</strong>
                        <span>${escapeHtml(phoneText)}</span>
                        <small>CCCD: ${escapeHtml(citizenIdText)}</small>
                    </div>
                </td>
                <td>
                    <div class="employee-meta">
                        ${profileHtml}
                    </div>
                </td>
                <td>
                    <div class="employee-address">${escapeHtml(addressText)}</div>
                </td>
                <td>${roleControl}</td>
                <td>${homepageControl}</td>
                <td>${actionControl}</td>
            </tr>
        `;
    }).join('');
};

const loadEmployees = async () => {
    if (!canViewAccountView(activeAccountView) || !employeeTableBody) {
        return;
    }

    setEmployeeFeedback('');

    try {
        const { response, data } = await requestJson('/api/admin/users');

        if (!response.ok) {
            throw new Error(data.message || 'Không thể tải danh sách tài khoản.');
        }

        employees = data.users || [];
        renderEmployees();
    } catch (error) {
        setEmployeeFeedback(error.message || 'Không thể tải danh sách tài khoản.', 'error');
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">Không thể tải danh sách tài khoản.</td>
            </tr>
        `;
    }
};

const resetEmployeeForm = () => {
    const config = getActiveAccountConfig();

    employeeForm?.reset();
    editingEmployeeId = null;
    if (employeeIdInput) {
        employeeIdInput.value = '';
    }
    if (employeeForm?.elements.role && config.canCreate) {
        employeeForm.elements.role.value = config.role;
    }
    if (employeeFormTitle) {
        employeeFormTitle.textContent = config.createTitle;
    }
    if (employeeSubmitButton) {
        employeeSubmitButton.innerHTML = getCreateAccountButtonHtml();
    }
    if (employeeAvatarInput) {
        employeeAvatarInput.value = '';
    }
    setEmployeeAvatarPreview('');
    syncAccountViewContent();
    setEmployeeFeedback('');
};

const setEmployeeSubmitLoading = (isLoading) => {
    if (!employeeSubmitButton) {
        return;
    }

    employeeSubmitButton.disabled = isLoading;
    employeeSubmitButton.innerHTML = isLoading
        ? '<i class="bx bx-loader-alt bx-spin"></i><span>Đang lưu...</span>'
        : editingEmployeeId
            ? '<i class="bx bx-save"></i><span>Cập nhật tài khoản</span>'
            : getCreateAccountButtonHtml();
};

const setAdminLogoutLoading = (isLoading) => {
    if (!adminLogoutButton) {
        return;
    }

    adminLogoutButton.disabled = isLoading;
    adminLogoutButton.innerHTML = isLoading
        ? '<i class="bx bx-loader-alt bx-spin" aria-hidden="true"></i><span>Đang đăng xuất...</span>'
        : '<i class="bx bx-log-out" aria-hidden="true"></i><span>Đăng xuất</span>';
};

const fillEmployeeForm = (user) => {
    if (!employeeForm || !user) {
        return;
    }

    const config = getActiveAccountConfig();

    editingEmployeeId = user.id;
    if (employeeIdInput) {
        employeeIdInput.value = user.id;
    }
    if (employeeFormCard) {
        employeeFormCard.hidden = false;
    }
    if (employeeFormEyebrow) {
        employeeFormEyebrow.textContent = config.formEyebrow;
    }

    employeeForm.elements.fullName.value = user.fullName || '';
    employeeForm.elements.email.value = user.email || '';
    employeeForm.elements.password.value = '';
    employeeForm.elements.role.value = user.role || 'staff';
    employeeForm.elements.phone.value = user.phone || '';
    employeeForm.elements.avatarUrl.value = user.avatarUrl || '';
    employeeForm.elements.salesTitle.value = user.salesTitle || 'Nhân viên kinh doanh';
    employeeForm.elements.salesExperience.value = user.salesExperience || '';
    employeeForm.elements.salesBio.value = user.salesBio || '';
    employeeForm.elements.homeDisplayOrder.value = Number(user.homeDisplayOrder || 0);
    employeeForm.elements.showOnHome.checked = Boolean(user.showOnHome);
    if (employeeAvatarInput) {
        employeeAvatarInput.value = '';
    }
    setEmployeeAvatarPreview(user.avatarUrl || '');

    if (employeeFormTitle) {
        employeeFormTitle.textContent = `Chỉnh sửa: ${user.fullName || user.email}`;
    }
    if (employeeSubmitButton) {
        employeeSubmitButton.innerHTML = '<i class="bx bx-save"></i><span>Cập nhật tài khoản</span>';
    }

    employeeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    employeeForm.elements.fullName.focus();
};

const buildUserUpdatePayload = (user, overrides = {}) => ({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    salesTitle: user.salesTitle || 'Nhân viên kinh doanh',
    salesExperience: user.salesExperience || '',
    salesBio: user.salesBio || '',
    showOnHome: Boolean(user.showOnHome),
    homeDisplayOrder: Number(user.homeDisplayOrder || 0),
    password: '',
    ...overrides
});

adminNavLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const viewName = link.dataset.adminNav;

        if (isAccountView(viewName) && !canViewAccountView(viewName)) {
            showToast('Bạn không có quyền mở mục tài khoản này.', 'error');
            return;
        }

        switchAdminView(viewName);
    });
});

employeeRefreshButton?.addEventListener('click', loadEmployees);
employeeResetButton?.addEventListener('click', resetEmployeeForm);
employeeSearchInput?.addEventListener('input', renderEmployees);
chooseEmployeeAvatarButton?.addEventListener('click', () => {
    employeeAvatarInput?.click();
});

employeeAvatarInput?.addEventListener('change', async () => {
    const file = employeeAvatarInput.files?.[0];

    if (!file || !employeeForm) {
        return;
    }

    setEmployeeFeedback('');
    chooseEmployeeAvatarButton.disabled = true;
    if (employeeAvatarFileName) {
        employeeAvatarFileName.textContent = 'Đang tải ảnh...';
    }

    try {
        const avatarUrl = await uploadEmployeeAvatar(file);

        employeeForm.elements.avatarUrl.value = avatarUrl;
        setEmployeeAvatarPreview(avatarUrl, file.name);
        showToast('Tải ảnh đại diện thành công.', 'success', 'Đã tải ảnh');
    } catch (error) {
        employeeAvatarInput.value = '';
        setEmployeeAvatarPreview(employeeForm.elements.avatarUrl.value || '');
        setEmployeeFeedback(error.message || 'Không thể tải ảnh đại diện.', 'error');
        showToast(error.message || 'Không thể tải ảnh đại diện.', 'error');
    } finally {
        chooseEmployeeAvatarButton.disabled = false;
    }
});

adminLogoutButton?.addEventListener('click', async () => {
    setAdminLogoutLoading(true);

    try {
        await requestJson('/api/auth/admin-logout', { method: 'POST' });
    } finally {
        window.location.replace('/admin-login?logout=success');
    }
});

employeeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setEmployeeFeedback('');

    if (!isCurrentUserAdmin()) {
        setEmployeeFeedback('Chỉ tài khoản admin mới được quản lý tài khoản.', 'error');
        return;
    }

    const formData = new FormData(employeeForm);
    const password = String(formData.get('password') || '');
    const selectedRole = String(formData.get('role') || '');
    const isEditingEmployee = Boolean(editingEmployeeId);
    const config = getActiveAccountConfig();

    if (!isEditingEmployee && password.length < 6) {
        setEmployeeFeedback('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
        return;
    }

    if (!isEditingEmployee && !config.canCreate) {
        setEmployeeFeedback('Mục khách hàng chỉ dùng để xem và chỉnh sửa tài khoản đã đăng ký.', 'error');
        return;
    }

    if (!isEditingEmployee && !['staff', 'admin'].includes(selectedRole)) {
        setEmployeeFeedback('Chỉ được tạo tài khoản nhân viên hoặc admin từ dashboard này.', 'error');
        return;
    }

    if (!isEditingEmployee && selectedRole !== config.role) {
        setEmployeeFeedback(`Hãy tạo tài khoản ${config.createLabel} trong đúng mục ${config.listTitle}.`, 'error');
        return;
    }

    setEmployeeSubmitLoading(true);

    try {
        const payload = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            role: formData.get('role'),
            phone: formData.get('phone'),
            avatarUrl: formData.get('avatarUrl'),
            salesTitle: formData.get('salesTitle'),
            salesExperience: formData.get('salesExperience'),
            salesBio: formData.get('salesBio'),
            showOnHome: formData.get('showOnHome') === '1',
            homeDisplayOrder: Number(formData.get('homeDisplayOrder') || 0)
        };

        if (password) {
            payload.password = password;
        }

        const { response, data } = await requestJson(isEditingEmployee ? `/api/admin/users/${editingEmployeeId}` : '/api/admin/users', {
            method: isEditingEmployee ? 'PATCH' : 'POST',
            body: JSON.stringify({
                ...payload,
                password: isEditingEmployee ? payload.password || '' : password
            })
        });

        if (!response.ok) {
            throw new Error(data.message || 'Không thể lưu tài khoản lúc này.');
        }

        resetEmployeeForm();
        await loadEmployees();
        showToast(data.message || 'Lưu tài khoản thành công.', 'success', isEditingEmployee ? 'Đã cập nhật' : 'Đã tạo tài khoản');
    } catch (error) {
        setEmployeeFeedback(error.message || 'Không thể lưu tài khoản lúc này.', 'error');
        showToast(error.message || 'Không thể lưu tài khoản lúc này.', 'error');
    } finally {
        setEmployeeSubmitLoading(false);
    }
});

employeeTableBody?.addEventListener('change', async (event) => {
    const roleSelect = event.target.closest('[data-user-role]');

    if (!roleSelect) {
        return;
    }

    const userId = Number(roleSelect.dataset.userRole);
    const nextRole = roleSelect.value;
    const previousUser = employees.find((user) => user.id === userId);
    const previousRole = previousUser?.role;

    roleSelect.disabled = true;

    try {
        const { response, data } = await requestJson(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: nextRole })
        });

        if (!response.ok) {
            throw new Error(data.message || 'Không thể cập nhật phân quyền.');
        }

        await loadEmployees();
        showToast(data.message || 'Cập nhật phân quyền thành công.', 'success', 'Đã cập nhật');
    } catch (error) {
        roleSelect.value = previousRole || 'staff';
        roleSelect.disabled = false;
        showToast(error.message || 'Không thể cập nhật phân quyền.', 'error');
    }
});

employeeTableBody?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-user]');
    const deleteButton = event.target.closest('[data-delete-user]');
    const homeToggleButton = event.target.closest('[data-toggle-home-user]');
    const viewCustomerTarget = event.target.closest('[data-view-customer]');

    if (editButton) {
        const userId = Number(editButton.dataset.editUser);
        const user = employees.find((item) => item.id === userId);

        fillEmployeeForm(user);
        return;
    }

    if (deleteButton) {
        const userId = Number(deleteButton.dataset.deleteUser);
        const user = employees.find((item) => item.id === userId);

        if (!user) {
            return;
        }

        const isConfirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản "${user.fullName || user.email}"?`);

        if (!isConfirmed) {
            return;
        }

        deleteButton.disabled = true;

        try {
            const { response, data } = await requestJson(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể xóa tài khoản.');
            }

            await loadEmployees();
            showToast(data.message || 'Xóa tài khoản thành công.', 'success', 'Đã xóa tài khoản');
        } catch (error) {
            deleteButton.disabled = false;
            showToast(error.message || 'Không thể xóa tài khoản.', 'error');
        }
        return;
    }

    if (homeToggleButton) {
        const userId = Number(homeToggleButton.dataset.toggleHomeUser);
        const user = employees.find((item) => item.id === userId);

        if (!user || !['staff', 'admin'].includes(user.role)) {
            return;
        }

        homeToggleButton.disabled = true;

        try {
            const { response, data } = await requestJson(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(buildUserUpdatePayload(user, {
                    showOnHome: !user.showOnHome
                }))
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể cập nhật hiển thị trang chủ.');
            }

            await loadEmployees();
            showToast(
                data.message || 'Cập nhật hiển thị trang chủ thành công.',
                'success',
                user.showOnHome ? 'Đã ẩn khỏi trang chủ' : 'Đã hiển thị trang chủ'
            );
        } catch (error) {
            homeToggleButton.disabled = false;
            showToast(error.message || 'Không thể cập nhật hiển thị trang chủ.', 'error');
        }
        return;
    }

    if (!viewCustomerTarget) {
        return;
    }

    if (event.target.closest('button, select, a') && !event.target.closest('[data-view-customer]')) {
        return;
    }

    const userId = Number(viewCustomerTarget.dataset.viewCustomer);
    const user = employees.find((item) => item.id === userId && item.role === 'customer');

    if (user) {
        openCustomerDetail(user);
    }
});

if (carForm) {
    carForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFeedback('');

        if (!selectedCarImages.length) {
            setFeedback('Vui lòng chọn ít nhất một ảnh xe.', 'error');
            return;
        }

        const formData = new FormData(carForm);
        const payload = {
            brand: formData.get('brand'),
            category: formData.get('category'),
            name: formData.get('name'),
            description: formData.get('description'),
            type: formData.get('type'),
            priceText: formData.get('priceText'),
            priceValue: Number(formData.get('priceValue') || 0),
            image: selectedCarImages[0],
            images: selectedCarImages,
            year: Number(formData.get('year') || 0),
            fuel: formData.get('fuel'),
            mileageText: formData.get('mileageText'),
            mileageValue: Number(formData.get('mileageValue') || 0),
            seats: formData.get('seats'),
            gearbox: formData.get('gearbox'),
            origin: formData.get('origin'),
            condition: formData.get('condition'),
            color: formData.get('color'),
            actionText: formData.get('actionText')
        };

        const editingCarId = carIdInput.value;
        const isEditing = Boolean(editingCarId);

        submitButton.disabled = true;
        submitButton.textContent = isEditing ? 'Đang cập nhật...' : 'Đang thêm...';

        try {
            const { response, data } = await requestJson(
                isEditing ? `/api/cars/${editingCarId}` : '/api/cars',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                throw new Error(data.message || 'Không thể lưu xe lúc này.');
            }

            setFeedback(data.message || 'Lưu xe thành công.');
            resetFormState();
            await loadCars();
            showToast(
                data.message || (isEditing ? 'Cập nhật xe thành công.' : 'Thêm xe thành công.'),
                'success',
                isEditing ? 'Đã cập nhật xe' : 'Đã thêm xe'
            );
        } catch (error) {
            setFeedback(error.message || 'Không thể lưu xe lúc này.', 'error');
            showToast(error.message || 'Không thể lưu xe lúc này.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = carIdInput.value ? 'Cập nhật xe' : 'Thêm xe';
        }
    });
}

chooseImagesButton?.addEventListener('click', () => {
    carImagesInput?.click();
});

carImagesInput?.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
        return;
    }

    const availableSlots = maxCarImages - selectedCarImages.length;

    if (availableSlots <= 0) {
        showToast(`Mỗi xe chỉ được lưu tối đa ${maxCarImages} ảnh.`, 'error');
        carImagesInput.value = '';
        return;
    }

    const uploadFiles = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
        showToast(`Chỉ tải thêm ${availableSlots} ảnh để không vượt quá ${maxCarImages} ảnh mỗi xe.`, 'error');
    }

    const defaultButtonHtml = chooseImagesButton?.innerHTML || '';

    if (chooseImagesButton) {
        chooseImagesButton.disabled = true;
        chooseImagesButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i><span>Đang tải...</span>';
    }

    try {
        const uploadedImages = await uploadCarImages(uploadFiles);

        setCarImages([...selectedCarImages, ...uploadedImages]);
        showToast('Ảnh xe đã được tải lên.', 'success', 'Đã thêm ảnh');
    } catch (error) {
        showToast(error.message || 'Không thể tải ảnh xe lúc này.', 'error');
    } finally {
        if (chooseImagesButton) {
            chooseImagesButton.disabled = false;
            chooseImagesButton.innerHTML = defaultButtonHtml;
        }
        carImagesInput.value = '';
    }
});

imagePreviewList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-image]');

    if (!removeButton) {
        return;
    }

    const imageIndex = Number(removeButton.dataset.removeImage);

    if (!Number.isInteger(imageIndex)) {
        return;
    }

    setCarImages(selectedCarImages.filter((image, index) => index !== imageIndex));
});

openFormButton?.addEventListener('click', () => {
    resetFormState(false);
    openEditor();
    carForm?.elements.name?.focus();
});

closeFormButton?.addEventListener('click', resetFormState);
resetFormButton?.addEventListener('click', () => resetFormState(false));
refreshListButton?.addEventListener('click', loadCars);
searchInput?.addEventListener('input', renderCars);

editorPanel?.addEventListener('click', (event) => {
    if (event.target === editorPanel) {
        resetFormState();
    }
});

customerDetailCloseButtons.forEach((button) => {
    button.addEventListener('click', closeCustomerDetail);
});

customerDetailPanel?.addEventListener('click', (event) => {
    if (event.target === customerDetailPanel) {
        closeCustomerDetail();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !editorPanel?.hidden) {
        resetFormState();
        return;
    }

    if (event.key === 'Escape' && !customerDetailPanel?.hidden) {
        closeCustomerDetail();
    }
});

carTableBody?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-car]');
    const deleteButton = event.target.closest('[data-delete-car]');

    if (editButton) {
        const carId = Number(editButton.dataset.editCar);
        const car = cars.find((item) => item.id === carId);

        if (car) {
            fillForm(car);
        }

        return;
    }

    if (deleteButton) {
        const carId = Number(deleteButton.dataset.deleteCar);
        const car = cars.find((item) => item.id === carId);

        if (!car) {
            return;
        }

        const isConfirmed = window.confirm(`Bạn có chắc muốn xóa xe "${car.name}"?`);

        if (!isConfirmed) {
            return;
        }

        try {
            const { response, data } = await requestJson(`/api/cars/${carId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(data.message || 'Không thể xóa xe lúc này.');
            }

            setFeedback(data.message || 'Xóa xe thành công.');
            if (String(carIdInput.value) === String(carId)) {
                resetFormState();
            }
            await loadCars();
            showToast(data.message || 'Xóa xe thành công.', 'success', 'Đã xóa xe');
        } catch (error) {
            setFeedback(error.message || 'Không thể xóa xe lúc này.', 'error');
            showToast(error.message || 'Không thể xóa xe lúc này.', 'error');
        }
    }
});

const initializeAdminPage = async () => {
    const canUseAdmin = await syncCurrentAdminUser();

    if (!canUseAdmin) {
        return;
    }

    await loadCars();
};

initializeAdminPage();
