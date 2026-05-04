require('dotenv').config();

const express = require('express');
const fs = require('node:fs');
const path = require('path');
const { randomUUID } = require('node:crypto');
const {
  addFavoriteCarForUser,
  authenticateUser,
  createCar,
  createPasswordResetOtp,
  createSession,
  createUser,
  countAdminUsers,
  deleteCar,
  deleteSession,
  deleteUser,
  employeeRoles,
  getCarById,
  getUserById,
  getUserBySession,
  isFavoriteCarByUser,
  listCars,
  listFavoriteCarsByUser,
  listHomepageTeamMembers,
  listUsers,
  removeFavoriteCarForUser,
  resetPasswordWithOtp,
  updateCar,
  updateUserProfile,
  updateUserSelfProfile,
  updateUserRole,
} = require('./db');
const { sendPasswordResetEmail } = require('./mailer');

const app = express();
const port = process.env.PORT || 3000;
const legacySessionCookieName = 'okxe_session';
const userSessionCookieName = 'okxe_user_session';
const adminSessionCookieName = 'okxe_admin_session';
const rateLimitBuckets = new Map();
const userRoles = new Set(['customer', 'staff', 'admin']);
const manageableCreateRoles = new Set(['staff', 'admin']);
const salesTitles = new Set(['Nhân viên kinh doanh', 'Trưởng phòng kinh doanh']);

const publicPath = path.join(__dirname, 'public');
const imagesPath = path.join(__dirname, 'images');
const uploadsPath = path.join(
  process.env.OKXE_UPLOAD_DIR || path.join(__dirname, 'storage', 'uploads')
);
const carUploadsPath = path.join(uploadsPath, 'cars');
const avatarUploadsPath = path.join(uploadsPath, 'avatars');
const uploadJsonParser = express.json({ limit: '80mb' });
const profileJsonParser = express.json({ limit: '8mb' });
const maxCarImages = 10;
const maxUploadedImageSize = 5 * 1024 * 1024;
const allowedUploadTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, cookiePart) => {
    const [rawName, ...rawValue] = cookiePart.trim().split('=');

    if (!rawName) {
      return cookies;
    }

    try {
      cookies[rawName] = decodeURIComponent(rawValue.join('='));
    } catch (error) {
      return cookies;
    }

    return cookies;
  }, {});

const getSessionToken = (req, cookieName) =>
  parseCookies(req.headers.cookie)[cookieName] || null;

const appendSetCookieHeader = (res, cookieValue) => {
  const existingHeader = res.getHeader('Set-Cookie');

  if (!existingHeader) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  res.setHeader(
    'Set-Cookie',
    Array.isArray(existingHeader)
      ? [...existingHeader, cookieValue]
      : [existingHeader, cookieValue]
  );
};

const setSessionCookie = (res, session, cookieName) => {
  const maxAgeInSeconds = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
  );
  const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  appendSetCookieHeader(
    res,
    `${cookieName}=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeInSeconds}${secureCookie}`
  );
};

const clearSessionCookie = (res, cookieName) => {
  appendSetCookieHeader(
    res,
    `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));

const normalizeBoolean = (value) =>
  value === true || value === 1 || value === '1' || value === 'true';

const normalizeSalesTitle = (title) => {
  const normalizedTitle = String(title || '').trim();

  return salesTitles.has(normalizedTitle)
    ? normalizedTitle
    : 'Nhân viên kinh doanh';
};

const normalizeAdminUserProfilePayload = (payload = {}, role = 'customer') => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const homeDisplayOrder = Number(payload.homeDisplayOrder || 0);

  return {
    phone: String(payload.phone || '').trim(),
    avatarUrl: String(payload.avatarUrl || '').trim(),
    salesTitle: normalizeSalesTitle(payload.salesTitle),
    salesSpecialty: String(payload.salesSpecialty || '').trim().slice(0, 120),
    salesExperience: String(payload.salesExperience || '').trim().slice(0, 80),
    salesBio: String(payload.salesBio || '').trim().slice(0, 220),
    showOnHome: manageableCreateRoles.has(normalizedRole)
      ? normalizeBoolean(payload.showOnHome)
      : false,
    homeDisplayOrder: Number.isFinite(homeDisplayOrder)
      ? Math.max(0, Math.trunc(homeDisplayOrder))
      : 0,
  };
};

const normalizeCarImages = (images, fallbackImage = '') => {
  const imageCandidates = [
    ...(Array.isArray(images) ? images : []),
    fallbackImage,
  ];
  const seenImages = new Set();

  return imageCandidates.reduce((normalizedImages, image) => {
    const normalizedImage = String(image || '').trim();

    if (!normalizedImage || seenImages.has(normalizedImage)) {
      return normalizedImages;
    }

    seenImages.add(normalizedImage);
    normalizedImages.push(normalizedImage);
    return normalizedImages;
  }, []);
};

const getRequestUser = (req) =>
  getUserBySession(getSessionToken(req, userSessionCookieName));

const getRequestAdminUser = (req) =>
  getUserBySession(getSessionToken(req, adminSessionCookieName));

const canAccessAdmin = (user) =>
  employeeRoles.has(String(user?.role || '').trim().toLowerCase());

const canManageUsers = (user) =>
  String(user?.role || '').trim().toLowerCase() === 'admin';

const serializeUserForResponse = (user) =>
  user
    ? {
        ...user,
        isAdmin: canAccessAdmin(user),
      }
    : null;

const requireUser = (req, res, next) => {
  const user = getRequestUser(req);

  if (!user) {
    res.status(401).json({ message: 'Bạn cần đăng nhập để cập nhật thông tin.' });
    return;
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  const user = getRequestAdminUser(req);

  if (!user) {
    res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    return;
  }

  if (!canAccessAdmin(user)) {
    res.status(403).json({ message: 'Tài khoản này không phải tài khoản nhân viên.' });
    return;
  }

  req.user = user;
  next();
};

const requireUserManager = (req, res, next) => {
  const user = getRequestAdminUser(req);

  if (!user) {
    res.status(401).json({ message: 'Bạn cần đăng nhập admin để thực hiện thao tác này.' });
    return;
  }

  if (!canManageUsers(user)) {
    res.status(403).json({ message: 'Chỉ tài khoản admin mới được quản lý tài khoản.' });
    return;
  }

  req.user = user;
  next();
};

const requireAdminPage = (req, res, next) => {
  const user = getRequestAdminUser(req);

  if (!user) {
    res.redirect('/admin-login?login=required');
    return;
  }

  if (!canAccessAdmin(user)) {
    res.redirect('/admin-login?role=required');
    return;
  }

  req.user = user;
  next();
};

const getClientIp = (req) =>
  req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';

const createRateLimiter = ({
  windowMs,
  max,
  keyPrefix,
  getKey = () => '',
  message = 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
}) => (req, res, next) => {
  const now = Date.now();
  const specificKey = String(getKey(req) || '').trim().toLowerCase();
  const bucketKey = [keyPrefix, getClientIp(req), specificKey].join(':');
  const currentBucket = rateLimitBuckets.get(bucketKey);

  if (!currentBucket || currentBucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    next();
    return;
  }

  if (currentBucket.count >= max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((currentBucket.resetAt - now) / 1000)
    );

    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({ message });
    return;
  }

  currentBucket.count += 1;

  if (rateLimitBuckets.size > 1000) {
    for (const [key, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(key);
      }
    }
  }

  next();
};

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: 'auth',
  message: 'Bạn thao tác đăng nhập quá nhiều. Vui lòng thử lại sau.',
});

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: 'login',
  getKey: (req) => req.body?.email,
  message: 'Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau.',
});

const passwordResetRequestRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'forgot-password',
  getKey: (req) => req.body?.email,
  message: 'Bạn yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau.',
});

const passwordResetAttemptRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: 'reset-password',
  getKey: (req) => req.body?.email,
  message: 'Bạn thử mã OTP quá nhiều lần. Vui lòng yêu cầu mã mới sau ít phút.',
});

const sanitizeUploadBaseName = (name, fallbackBaseName = 'car-image') => {
  const baseName = path
    .basename(String(name || fallbackBaseName))
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return baseName || fallbackBaseName;
};

const parseUploadedImage = (file, fallbackBaseName = 'car-image') => {
  const dataUrl = String(file?.dataUrl || '').trim();
  const declaredType = String(file?.type || '').trim().toLowerCase();
  const dataUrlMatch = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  const mimeType = dataUrlMatch
    ? dataUrlMatch[1].toLowerCase()
    : declaredType;
  const base64Payload = (dataUrlMatch ? dataUrlMatch[2] : dataUrl).replace(/\s/g, '');
  const extension = allowedUploadTypes.get(mimeType);

  if (!extension) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.');
  }

  if (!base64Payload || !/^[a-z0-9+/]+={0,2}$/i.test(base64Payload)) {
    throw new Error('Dữ liệu ảnh không hợp lệ.');
  }

  const buffer = Buffer.from(base64Payload, 'base64');

  if (!buffer.length || buffer.length > maxUploadedImageSize) {
    throw new Error('Mỗi ảnh phải có dung lượng tối đa 5MB.');
  }

  return {
    buffer,
    extension,
    baseName: sanitizeUploadBaseName(file?.name, fallbackBaseName),
  };
};

const saveUploadedCarImages = (files) => {
  const parsedImages = files.map(parseUploadedImage);
  fs.mkdirSync(carUploadsPath, { recursive: true });

  return parsedImages.map((parsedImage) => {
    const fileName = `${Date.now()}-${randomUUID()}-${parsedImage.baseName}${parsedImage.extension}`;
    const filePath = path.join(carUploadsPath, fileName);

    fs.writeFileSync(filePath, parsedImage.buffer);

    return `/uploads/cars/${fileName}`;
  });
};

const saveUploadedAvatar = (file) => {
  const parsedImage = parseUploadedImage(file, 'avatar');
  fs.mkdirSync(avatarUploadsPath, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}-${parsedImage.baseName}${parsedImage.extension}`;
  const filePath = path.join(avatarUploadsPath, fileName);

  fs.writeFileSync(filePath, parsedImage.buffer);

  return `/uploads/avatars/${fileName}`;
};

const carOptionFields = {
  category: ['Sedan', 'SUV', 'Thể thao'],
  type: ['Tự động', 'Số sàn'],
  fuel: ['Xăng', 'Diesel', 'Hybrid', 'Điện'],
  seats: ['4 chỗ', '5 chỗ', '7 chỗ', '9 chỗ'],
  gearbox: ['Số Sàn', 'Tự động'],
  origin: ['Nhập khẩu', 'Trong nước'],
  condition: ['Xe mới', 'Xe cũ'],
  actionText: ['Còn xe', 'Xe đã bán'],
};

const carOptionAliases = {
  type: {
    hybrid: 'Tự động',
    san: 'Số sàn',
    'sàn': 'Số sàn',
    'số tự động': 'Tự động',
  },
  fuel: {
    dau: 'Diesel',
    dầu: 'Diesel',
    dien: 'Điện',
  },
  gearbox: {
    san: 'Số Sàn',
    'sàn': 'Số Sàn',
    'số sàn': 'Số Sàn',
    'tự động / tay': 'Tự động',
    'số tự động': 'Tự động',
  },
  actionText: {
    'mua ngay': 'Còn xe',
    'còn hàng': 'Còn xe',
    'het hang': 'Xe đã bán',
    'hết hàng': 'Xe đã bán',
    'het xe': 'Xe đã bán',
    'hết xe': 'Xe đã bán',
    'xe da ban': 'Xe đã bán',
  },
};

const carOptionLabels = {
  category: 'phân khúc',
  type: 'kiểu vận hành',
  fuel: 'nhiên liệu',
  seats: 'số chỗ',
  gearbox: 'hộp số',
  origin: 'xuất xứ',
  condition: 'tình trạng',
  actionText: 'nút hành động',
};

const normalizeOptionText = (value) =>
  String(value || '').trim().replace(/\s+/g, ' ');

const normalizeOptionKey = (value) => normalizeOptionText(value).toLocaleLowerCase('vi-VN');

const normalizeCarOptionField = (fieldName, value) => {
  const normalizedValue = normalizeOptionText(value);

  if (!normalizedValue) {
    return fieldName === 'actionText' ? 'Còn xe' : '';
  }

  const optionKey = normalizeOptionKey(normalizedValue);
  const matchedOption = carOptionFields[fieldName]?.find(
    (option) => normalizeOptionKey(option) === optionKey
  );

  return matchedOption || carOptionAliases[fieldName]?.[optionKey] || normalizedValue;
};

const validateCarPayload = (car = {}) => {
  const images = normalizeCarImages(car.images, car.image);
  const normalizedCar = {
    brand: String(car.brand || '').trim(),
    category: normalizeCarOptionField('category', car.category),
    name: String(car.name || '').trim(),
    description: String(car.description || '').trim(),
    type: normalizeCarOptionField('type', car.type),
    priceText: String(car.priceText || car.price || '').trim(),
    priceValue: Number(car.priceValue || 0),
    image: images[0] || '',
    images,
    year: Number(car.year || 0),
    fuel: normalizeCarOptionField('fuel', car.fuel),
    mileageText: String(car.mileageText || car.mileage || '').trim(),
    mileageValue: Number(car.mileageValue || 0),
    seats: normalizeCarOptionField('seats', car.seats),
    gearbox: normalizeCarOptionField('gearbox', car.gearbox),
    origin: normalizeCarOptionField('origin', car.origin),
    condition: normalizeCarOptionField('condition', car.condition),
    color: String(car.color || '').trim(),
    actionText: normalizeCarOptionField('actionText', car.actionText),
  };

  const requiredFields = [
    ['brand', 'Vui lòng nhập hãng xe.'],
    ['category', 'Vui lòng nhập phân khúc xe.'],
    ['name', 'Vui lòng nhập tên xe.'],
    ['type', 'Vui lòng nhập kiểu vận hành.'],
    ['priceText', 'Vui lòng nhập giá hiển thị.'],
    ['fuel', 'Vui lòng nhập loại nhiên liệu.'],
    ['mileageText', 'Vui lòng nhập số km hiển thị.'],
    ['seats', 'Vui lòng nhập số chỗ.'],
    ['gearbox', 'Vui lòng nhập hộp số.'],
    ['origin', 'Vui lòng nhập xuất xứ.'],
    ['condition', 'Vui lòng nhập tình trạng xe.'],
    ['color', 'Vui lòng nhập màu sắc.'],
  ];

  for (const [field, message] of requiredFields) {
    if (!normalizedCar[field]) {
      return { error: message };
    }
  }

  for (const [field, options] of Object.entries(carOptionFields)) {
    if (!options.includes(normalizedCar[field])) {
      return {
        error: `Giá trị ${carOptionLabels[field]} không hợp lệ. Vui lòng chọn trong danh sách.`,
      };
    }
  }

  if (!normalizedCar.images.length) {
    return { error: 'Vui lòng chọn ít nhất một ảnh xe.' };
  }

  if (normalizedCar.images.length > maxCarImages) {
    return { error: `Mỗi xe chỉ được lưu tối đa ${maxCarImages} ảnh.` };
  }

  if (!Number.isFinite(normalizedCar.priceValue) || normalizedCar.priceValue <= 0) {
    return { error: 'Giá trị giá xe phải là số lớn hơn 0.' };
  }

  if (normalizedCar.description.length > 1500) {
    return { error: 'Mô tả xe không được vượt quá 1500 ký tự.' };
  }

  if (!Number.isFinite(normalizedCar.year) || normalizedCar.year < 1900) {
    return { error: 'Năm sản xuất không hợp lệ.' };
  }

  if (!Number.isFinite(normalizedCar.mileageValue) || normalizedCar.mileageValue < 0) {
    return { error: 'Số km phải là số không âm.' };
  }

  return { car: normalizedCar };
};

const normalizeShortText = (value, maxLength = 120) =>
  String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);

const validateUserProfilePayload = (profile = {}) => {
  const normalizedProfile = {
    phone: normalizeShortText(profile.phone, 30),
    citizenId: String(profile.citizenId || profile.citizenID || profile.cccd || '').trim(),
    birthDate: String(profile.birthDate || '').trim(),
    gender: String(profile.gender || '').trim().toLowerCase(),
    addressProvince: normalizeShortText(profile.addressProvince || profile.province, 120),
    addressDistrict: normalizeShortText(profile.addressDistrict || profile.district, 120),
    addressWard: normalizeShortText(profile.addressWard || profile.ward, 120),
    addressDetail: normalizeShortText(profile.addressDetail, 240),
  };
  const allowedGenders = new Set(['', 'male', 'female', 'other']);

  if (normalizedProfile.phone) {
    const phoneDigits = normalizedProfile.phone.replace(/\D/g, '');
    const hasValidPhoneFormat = /^\+?[0-9\s.-]{8,20}$/.test(normalizedProfile.phone);

    if (!hasValidPhoneFormat || phoneDigits.length < 8 || phoneDigits.length > 15) {
      return { error: 'Số điện thoại không hợp lệ.' };
    }
  }

  if (normalizedProfile.citizenId && !/^\d{12}$/.test(normalizedProfile.citizenId)) {
    return { error: 'Số CCCD phải gồm đúng 12 chữ số.' };
  }

  if (normalizedProfile.birthDate) {
    const [year, month, day] = normalizedProfile.birthDate.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const isInvalidDate =
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedProfile.birthDate) ||
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate > new Date();

    if (isInvalidDate) {
      return { error: 'Ngày sinh không hợp lệ.' };
    }
  }

  if (!allowedGenders.has(normalizedProfile.gender)) {
    return { error: 'Giới tính không hợp lệ.' };
  }

  return { profile: normalizedProfile };
};

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.use('/images', express.static(imagesPath));
app.use('/uploads', express.static(uploadsPath));

app.post('/api/uploads/car-images', requireAdmin, uploadJsonParser, (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [];

  if (!files.length) {
    res.status(400).json({ message: 'Vui lòng chọn ít nhất một ảnh xe.' });
    return;
  }

  if (files.length > maxCarImages) {
    res.status(400).json({ message: `Mỗi lần chỉ được tải lên tối đa ${maxCarImages} ảnh.` });
    return;
  }

  try {
    const images = saveUploadedCarImages(files);

    res.status(201).json({
      message: 'Tải ảnh xe thành công.',
      images,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Không thể tải ảnh xe.' });
  }
});

app.post('/api/uploads/avatar', requireAdmin, profileJsonParser, (req, res) => {
  const file = req.body?.file;

  if (!file) {
    res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện.' });
    return;
  }

  try {
    const avatarUrl = saveUploadedAvatar(file);

    res.status(201).json({
      message: 'Tải ảnh đại diện thành công.',
      avatarUrl,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Không thể tải ảnh đại diện.' });
  }
});

app.patch('/api/auth/profile', requireUser, profileJsonParser, (req, res) => {
  const { profile, error } = validateUserProfilePayload(req.body || {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const avatarUrl = req.body?.avatarFile
      ? saveUploadedAvatar(req.body.avatarFile)
      : req.user.avatarUrl;
    const user = updateUserSelfProfile(req.user.id, {
      ...profile,
      avatarUrl,
    });

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản để cập nhật.' });
      return;
    }

    res.json({
      message: 'Cập nhật thông tin cá nhân thành công.',
      user: serializeUserForResponse(user),
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
      res.status(409).json({ message: 'Email này đã được sử dụng.' });
      return;
    }

    if (String(error.message).includes('Chỉ hỗ trợ ảnh') || String(error.message).includes('ảnh')) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Update customer profile error:', error);
    res.status(500).json({ message: 'Không thể cập nhật thông tin cá nhân lúc này.' });
  }
});

app.use(express.json({ limit: '100kb' }));

app.get(['/admin', '/admin.html'], requireAdminPage, (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

app.get(['/admin-login', '/admin-login.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'admin-login.html'));
});

app.get('/cars/:id', (req, res) => {
  res.sendFile(path.join(publicPath, 'car-detail.html'));
});

app.use(express.static(publicPath));

app.get('/api/cars', (req, res) => {
  res.json({ cars: listCars() });
});

app.get('/api/team-members', (req, res) => {
  res.json({ teamMembers: listHomepageTeamMembers() });
});

app.get('/api/cars/:id', (req, res) => {
  const carId = Number(req.params.id);
  const car = getCarById(carId);

  if (!car) {
    res.status(404).json({ message: 'Không tìm thấy xe.' });
    return;
  }

  res.json({ car });
});

app.get('/api/favorites', requireUser, (req, res) => {
  res.json({ cars: listFavoriteCarsByUser(req.user.id) });
});

app.post('/api/favorites/:carId', requireUser, (req, res) => {
  const carId = Number(req.params.carId);

  if (!Number.isFinite(carId)) {
    res.status(400).json({ message: 'Mã xe không hợp lệ.' });
    return;
  }

  try {
    const wasFavorite = isFavoriteCarByUser(req.user.id, carId);
    const favoriteResult = addFavoriteCarForUser(req.user.id, carId);

    if (!favoriteResult) {
      res.status(404).json({ message: 'Không tìm thấy xe để thêm vào yêu thích.' });
      return;
    }

    res.status(wasFavorite ? 200 : 201).json({
      message: 'Đã thêm xe vào danh sách yêu thích.',
      car: favoriteResult.car,
      cars: favoriteResult.favorites,
    });
  } catch (error) {
    console.error('Add favorite car error:', error);
    res.status(500).json({ message: 'Không thể thêm xe yêu thích lúc này.' });
  }
});

app.delete('/api/favorites/:carId', requireUser, (req, res) => {
  const carId = Number(req.params.carId);

  if (!Number.isFinite(carId)) {
    res.status(400).json({ message: 'Mã xe không hợp lệ.' });
    return;
  }

  try {
    const favoriteResult = removeFavoriteCarForUser(req.user.id, carId);

    if (!favoriteResult) {
      res.status(404).json({ message: 'Không tìm thấy xe để bỏ yêu thích.' });
      return;
    }

    res.json({
      message: 'Đã bỏ xe khỏi danh sách yêu thích.',
      car: favoriteResult.car,
      cars: favoriteResult.favorites,
    });
  } catch (error) {
    console.error('Remove favorite car error:', error);
    res.status(500).json({ message: 'Không thể bỏ yêu thích lúc này.' });
  }
});

app.post('/api/cars', requireAdmin, (req, res) => {
  const { car, error } = validateCarPayload(req.body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const createdCar = createCar(car);
    res.status(201).json({
      message: 'Thêm xe thành công.',
      car: createdCar,
    });
  } catch (dbError) {
    console.error('Create car error:', dbError);
    res.status(500).json({ message: 'Không thể thêm xe lúc này.' });
  }
});

app.put('/api/cars/:id', requireAdmin, (req, res) => {
  const carId = Number(req.params.id);
  const { car, error } = validateCarPayload(req.body);

  if (!Number.isFinite(carId)) {
    res.status(400).json({ message: 'Mã xe không hợp lệ.' });
    return;
  }

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    const updatedCar = updateCar(carId, car);

    if (!updatedCar) {
      res.status(404).json({ message: 'Không tìm thấy xe để cập nhật.' });
      return;
    }

    res.json({
      message: 'Cập nhật xe thành công.',
      car: updatedCar,
    });
  } catch (dbError) {
    console.error('Update car error:', dbError);
    res.status(500).json({ message: 'Không thể cập nhật xe lúc này.' });
  }
});

app.delete('/api/cars/:id', requireAdmin, (req, res) => {
  const carId = Number(req.params.id);

  if (!Number.isFinite(carId)) {
    res.status(400).json({ message: 'Mã xe không hợp lệ.' });
    return;
  }

  try {
    const deletedCar = deleteCar(carId);

    if (!deletedCar) {
      res.status(404).json({ message: 'Không tìm thấy xe để xóa.' });
      return;
    }

    res.json({
      message: 'Xóa xe thành công.',
      car: deletedCar,
    });
  } catch (dbError) {
    console.error('Delete car error:', dbError);
    res.status(500).json({ message: 'Không thể xóa xe lúc này.' });
  }
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = listUsers();

  res.json({
    users: canManageUsers(req.user)
      ? users
      : users.filter((user) => user.role === 'customer'),
  });
});

app.post('/api/admin/users', requireUserManager, (req, res) => {
  const { fullName, email, password, role = 'staff' } = req.body || {};
  const normalizedFullName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || '').trim().toLowerCase();
  const publicProfile = normalizeAdminUserProfilePayload(req.body || {}, normalizedRole);

  if (normalizedFullName.length < 2) {
    res.status(400).json({ message: 'Họ và tên phải có ít nhất 2 ký tự.' });
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email tài khoản không hợp lệ.' });
    return;
  }

  if (String(password || '').length < 6) {
    res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    return;
  }

  if (!manageableCreateRoles.has(normalizedRole)) {
    res.status(400).json({ message: 'Chỉ được tạo tài khoản nhân viên hoặc admin.' });
    return;
  }

  try {
    const user = createUser({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password,
      role: normalizedRole,
      ...publicProfile,
    });

    res.status(201).json({
      message: 'Tạo tài khoản thành công.',
      user,
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
      res.status(409).json({ message: 'Email này đã được sử dụng.' });
      return;
    }

    console.error('Create user error:', error);
    res.status(500).json({ message: 'Không thể tạo tài khoản lúc này.' });
  }
});

app.patch('/api/admin/users/:id', requireUserManager, (req, res) => {
  const userId = Number(req.params.id);
  const { fullName, email, password, role } = req.body || {};
  const normalizedFullName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const publicProfile = normalizeAdminUserProfilePayload(req.body || {}, normalizedRole);

  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: 'Mã tài khoản không hợp lệ.' });
    return;
  }

  if (normalizedFullName.length < 2) {
    res.status(400).json({ message: 'Họ và tên phải có ít nhất 2 ký tự.' });
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email tài khoản không hợp lệ.' });
    return;
  }

  if (!userRoles.has(normalizedRole)) {
    res.status(400).json({ message: 'Vai trò tài khoản không hợp lệ.' });
    return;
  }

  if (normalizedPassword && normalizedPassword.length < 6) {
    res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    return;
  }

  const targetUser = getUserById(userId);

  if (!targetUser) {
    res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    return;
  }

  if (targetUser.id === req.user.id && normalizedRole !== 'admin') {
    res.status(400).json({ message: 'Bạn không thể tự hạ quyền admin của chính mình.' });
    return;
  }

  if (targetUser.role === 'admin' && normalizedRole !== 'admin' && countAdminUsers() <= 1) {
    res.status(400).json({ message: 'Hệ thống phải còn ít nhất một tài khoản admin.' });
    return;
  }

  try {
    const user = updateUserProfile(userId, {
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: normalizedRole,
      ...publicProfile,
    });

    res.json({
      message: 'Cập nhật thông tin tài khoản thành công.',
      user,
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
      res.status(409).json({ message: 'Email này đã được sử dụng.' });
      return;
    }

    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Không thể cập nhật tài khoản lúc này.' });
  }
});

app.patch('/api/admin/users/:id/role', requireUserManager, (req, res) => {
  const userId = Number(req.params.id);
  const normalizedRole = String(req.body?.role || '').trim().toLowerCase();

  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: 'Mã tài khoản không hợp lệ.' });
    return;
  }

  if (!userRoles.has(normalizedRole)) {
    res.status(400).json({ message: 'Vai trò tài khoản không hợp lệ.' });
    return;
  }

  const targetUser = getUserById(userId);

  if (!targetUser) {
    res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    return;
  }

  if (targetUser.id === req.user.id && normalizedRole !== 'admin') {
    res.status(400).json({ message: 'Bạn không thể tự hạ quyền admin của chính mình.' });
    return;
  }

  if (targetUser.role === 'admin' && normalizedRole !== 'admin' && countAdminUsers() <= 1) {
    res.status(400).json({ message: 'Hệ thống phải còn ít nhất một tài khoản admin.' });
    return;
  }

  try {
    const user = updateUserRole(userId, normalizedRole);

    res.json({
      message: 'Cập nhật phân quyền thành công.',
      user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Không thể cập nhật phân quyền lúc này.' });
  }
});

app.delete('/api/admin/users/:id', requireUserManager, (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isFinite(userId)) {
    res.status(400).json({ message: 'Mã tài khoản không hợp lệ.' });
    return;
  }

  const targetUser = getUserById(userId);

  if (!targetUser) {
    res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    return;
  }

  if (targetUser.id === req.user.id) {
    res.status(400).json({ message: 'Bạn không thể xóa tài khoản đang đăng nhập.' });
    return;
  }

  if (targetUser.role === 'admin' && countAdminUsers() <= 1) {
    res.status(400).json({ message: 'Hệ thống phải còn ít nhất một tài khoản admin.' });
    return;
  }

  try {
    const deletedUser = deleteUser(userId);

    res.json({
      message: 'Xóa tài khoản thành công.',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Không thể xóa tài khoản lúc này.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = getRequestUser(req);

  if (!user) {
    res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    return;
  }

  res.json({ user: serializeUserForResponse(user) });
});

app.get('/api/auth/admin-me', (req, res) => {
  const user = getRequestAdminUser(req);

  if (!user || !canAccessAdmin(user)) {
    res.status(401).json({ message: 'Bạn chưa đăng nhập nhân viên.' });
    return;
  }

  res.json({ user: serializeUserForResponse(user) });
});

app.post('/api/auth/signup', authRateLimit, (req, res) => {
  const { fullName, email, password, remember } = req.body || {};
  const normalizedFullName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (normalizedFullName.length < 2) {
    res.status(400).json({ message: 'Họ và tên phải có ít nhất 2 ký tự.' });
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email không hợp lệ.' });
    return;
  }

  if (String(password || '').length < 6) {
    res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    return;
  }

  try {
    const user = createUser({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password,
    });
    const session = createSession(user.id, Boolean(remember));

    setSessionCookie(res, session, userSessionCookieName);
    clearSessionCookie(res, legacySessionCookieName);
    res.status(201).json({
      message: 'Tạo tài khoản thành công.',
      user: serializeUserForResponse(user),
    });
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: users.email')) {
      res.status(409).json({ message: 'Email này đã được sử dụng.' });
      return;
    }

    console.error('Signup error:', error);
    res.status(500).json({ message: 'Không thể tạo tài khoản lúc này.' });
  }
});

app.post('/api/auth/login', loginRateLimit, (req, res) => {
  const { email, password, remember } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email không hợp lệ.' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'Vui lòng nhập mật khẩu.' });
    return;
  }

  const user = authenticateUser(normalizedEmail, password);

  if (!user) {
    res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    return;
  }

  const session = createSession(user.id, Boolean(remember));

  setSessionCookie(res, session, userSessionCookieName);
  clearSessionCookie(res, legacySessionCookieName);
  res.json({
    message: 'Đăng nhập thành công.',
    user: serializeUserForResponse(user),
  });
});

app.post('/api/auth/admin-login', loginRateLimit, (req, res) => {
  const { email, password, remember } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email nhân viên không hợp lệ.' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'Vui lòng nhập mật khẩu.' });
    return;
  }

  const user = authenticateUser(normalizedEmail, password);

  if (!user) {
    res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    return;
  }

  if (!canAccessAdmin(user)) {
    res.status(403).json({ message: 'Tài khoản này không phải tài khoản nhân viên.' });
    return;
  }

  const session = createSession(user.id, Boolean(remember));

  setSessionCookie(res, session, adminSessionCookieName);
  clearSessionCookie(res, legacySessionCookieName);
  res.json({
    message: 'Đăng nhập nhân viên thành công.',
    user: serializeUserForResponse(user),
    redirectUrl: '/admin',
  });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionToken = getSessionToken(req, userSessionCookieName);
  const legacySessionToken = getSessionToken(req, legacySessionCookieName);

  if (sessionToken) {
    deleteSession(sessionToken);
  }
  if (legacySessionToken && legacySessionToken !== sessionToken) {
    deleteSession(legacySessionToken);
  }

  clearSessionCookie(res, userSessionCookieName);
  clearSessionCookie(res, legacySessionCookieName);
  res.json({ message: 'Đăng xuất thành công.' });
});

app.post('/api/auth/admin-logout', (req, res) => {
  const sessionToken = getSessionToken(req, adminSessionCookieName);
  const legacySessionToken = getSessionToken(req, legacySessionCookieName);

  if (sessionToken) {
    deleteSession(sessionToken);
  }
  if (legacySessionToken && legacySessionToken !== sessionToken) {
    deleteSession(legacySessionToken);
  }

  clearSessionCookie(res, adminSessionCookieName);
  clearSessionCookie(res, legacySessionCookieName);
  res.json({ message: 'Đăng xuất trang quản trị thành công.' });
});

app.post('/api/auth/forgot-password', passwordResetRequestRateLimit, async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: 'Email không hợp lệ.' });
    return;
  }

  try {
    const resetRequest = createPasswordResetOtp(normalizedEmail);

    if (resetRequest) {
      const emailResult = await sendPasswordResetEmail({
        to: resetRequest.user.email,
        fullName: resetRequest.user.fullName,
        otpCode: resetRequest.otp,
        expiresInMinutes: 10,
      });

      res.json({
        message: emailResult.smtpFallback
          ? 'SMTP chưa gửi được email. Hệ thống đã lưu email OTP vào file preview để bạn kiểm thử.'
          : 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi mã OTP khôi phục mật khẩu.',
        previewFile: emailResult.previewFilePath || null,
        smtpFallback: Boolean(emailResult.smtpFallback),
        email: normalizedEmail,
      });
      return;
    }

    res.json({
      message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi mã OTP khôi phục mật khẩu.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Không thể gửi mã OTP lúc này.' });
  }
});

app.post('/api/auth/reset-password', passwordResetAttemptRateLimit, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email)) {
    res.status(400).json({ message: 'Email không hợp lệ.' });
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    res.status(400).json({ message: 'Mã OTP phải gồm đúng 6 chữ số.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    return;
  }

  const user = resetPasswordWithOtp(email, otp, password);

  if (!user) {
    res.status(400).json({ message: 'Email hoặc mã OTP không đúng, hoặc mã đã hết hạn.' });
    return;
  }

  res.json({
    message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    user: serializeUserForResponse(user),
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Dữ liệu gửi lên quá lớn.' });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    res.status(400).json({ message: 'JSON gửi lên không hợp lệ.' });
    return;
  }

  next(error);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
