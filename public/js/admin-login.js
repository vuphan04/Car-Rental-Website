const adminLoginForm = document.querySelector('#admin-login-form');
const adminLoginSubmit = document.querySelector('#admin-login-submit');
const adminLoginFeedback = document.querySelector('#admin-login-feedback');

const requestJson = async (url, options = {}) => {
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
        response = await fetch(url, requestOptions);
    } catch (error) {
        throw new Error('Không thể kết nối tới server. Vui lòng thử lại sau.');
    }

    const data = await response.json().catch(() => ({}));

    return { response, data };
};

const setFeedback = (message, type = 'error') => {
    if (!adminLoginFeedback) {
        return;
    }

    adminLoginFeedback.textContent = message || '';
    adminLoginFeedback.className = 'admin-login-feedback';

    if (type === 'success') {
        adminLoginFeedback.classList.add('is-success');
    }
};

const setSubmitLoading = (isLoading) => {
    if (!adminLoginSubmit) {
        return;
    }

    adminLoginSubmit.disabled = isLoading;
    adminLoginSubmit.innerHTML = isLoading
        ? '<i class="bx bx-loader-alt bx-spin" aria-hidden="true"></i><span>Đang đăng nhập...</span>'
        : '<i class="bx bx-log-in" aria-hidden="true"></i><span>Đăng nhập</span>';
};

const showInitialLoginNotice = () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('role') === 'required') {
        setFeedback('Vui lòng đăng nhập bằng tài khoản nhân viên.');
        return;
    }

    if (params.get('login') === 'required') {
        setFeedback('Bạn cần đăng nhập nhân viên để vào trang quản trị.');
        return;
    }

    if (params.get('logout') === 'success') {
        setFeedback('Bạn đã đăng xuất khỏi trang quản trị.', 'success');
    }
};

const redirectIfAlreadyEmployee = async () => {
    try {
        const { response, data } = await requestJson('/api/auth/admin-me');

        if (response.ok && data.user?.isAdmin) {
            window.location.replace('/admin');
        }
    } catch (error) {
        setFeedback('');
    }
};

showInitialLoginNotice();

adminLoginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFeedback('');

    const formData = new FormData(adminLoginForm);

    setSubmitLoading(true);

    try {
        const { response, data } = await requestJson('/api/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            })
        });

        if (!response.ok) {
            throw new Error(data.message || 'Không thể đăng nhập nhân viên lúc này.');
        }

        setFeedback(data.message || 'Đăng nhập nhân viên thành công.', 'success');

        window.setTimeout(() => {
            window.location.assign(data.redirectUrl || '/admin');
        }, 350);
    } catch (error) {
        setFeedback(error.message || 'Không thể đăng nhập nhân viên lúc này.');
    } finally {
        setSubmitLoading(false);
    }
});

redirectIfAlreadyEmployee();
