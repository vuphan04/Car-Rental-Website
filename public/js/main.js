const cars = [
    {
        category: 'Sedan',
        name: 'Rolls-Royce Phantom',
        type: 'Tự động',
        price: '29,9 tỷ VNĐ',
        image: '../images/rental-1.png',
        year: '2024',
        fuel: 'Xăng',
        mileage: '12.300 km',
        seats: '5 chỗ',
        gearbox: 'Tự động',
        origin: 'Nhập khẩu',
        condition: 'Xe mới',
        color: 'Đen',
        actionText: 'Mua ngay'
    },
    {
        category: 'Sedan',
        name: 'Porsche Macan 4',
        type: 'Tự động',
        price: '4,1 tỷ VNĐ',
        image: '../images/rental-2.png',
        year: '2023',
        fuel: 'Xăng',
        mileage: '8.900 km',
        seats: '5 chỗ',
        gearbox: 'Tự động',
        origin: 'Nhập khẩu',
        condition: 'Xe mới',
        color: 'Xanh lá',
        actionText: 'Mua ngay'
    },
    {
        category: 'Sedan',
        name: 'Cayenne S E-Hybrid',
        type: 'Hybrid',
        price: '5,3 tỷ VNĐ',
        image: '../images/rental-3.png',
        year: '2024',
        fuel: 'Hybrid',
        mileage: '5.200 km',
        seats: '5 chỗ',
        gearbox: 'Tự động / Tay',
        origin: 'Nhập khẩu',
        condition: 'Xe mới',
        color: 'Trắng',
        actionText: 'Mua ngay'
    },
    {
        category: 'Sedan',
        name: 'Audi A7',
        type: 'Tự động',
        price: '3,2 tỷ VNĐ',
        image: '../images/rental-4.png',
        year: '2022',
        fuel: 'Xăng',
        mileage: '18.000 km',
        seats: '5 chỗ',
        gearbox: 'Tự động',
        origin: 'Nhập khẩu',
        condition: 'Xe cũ',
        color: 'Xanh dương',
        actionText: 'Mua ngay'
    },
    {
        category: 'Sedan',
        name: 'BMW M4',
        type: 'Tự động',
        price: '4,8 tỷ VNĐ',
        image: '../images/rental-5.png',
        year: '2023',
        fuel: 'Xăng',
        mileage: '9.800 km',
        seats: '5 chỗ',
        gearbox: 'Tự động',
        origin: 'Nhập khẩu',
        condition: 'Xe mới',
        color: 'Cam',
        actionText: 'Mua ngay'
    },
    {
        category: 'Sedan',
        name: 'Mercedes-Benz CLA',
        type: 'Tự động',
        price: '1,9 tỷ VNĐ',
        image: '../images/rental-6.png',
        year: '2022',
        fuel: 'Xăng',
        mileage: '16.200 km',
        seats: '5 chỗ',
        gearbox: 'Tự động',
        origin: 'Nhập khẩu',
        condition: 'Xe cũ',
        color: 'Trắng',
        actionText: 'Mua ngay'
    }
];

const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const rightNav = document.querySelector('.right-nav');
const searchToggle = document.querySelector('.search-toggle');

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

if (searchToggle && rightNav) {
    searchToggle.addEventListener('click', () => {
        rightNav.classList.toggle('search-open');
    });
}

// Hien thi tu danh sach tren javascript len html 
const rentalContainer = document.querySelector('.rental-container');

if (rentalContainer) {
    rentalContainer.innerHTML = cars.map(car => `
        <article class="rental-card">
            <img src="${car.image}" alt="${car.name}">
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
                <a href="#" class="rent-link">${car.actionText}</a>
            </div>
        </article>
    `).join('');
}

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
    if (window.innerWidth > 640) {
        closeMobileMenu();

        if (rightNav) {
            rightNav.classList.remove('search-open');
        }
    }

    const activeItem = document.querySelector('.accordion-item.active');

    if (activeItem) {
        const activeContent = activeItem.querySelector('.accordion-content');

        if (activeContent) {
            activeContent.style.maxHeight = `${activeContent.scrollHeight}px`;
        }
    }
});



