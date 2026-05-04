const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const primaryDbPath = path.join(__dirname, 'data', 'rentals.db');
const persistentDbDir = path.join(
  process.env.OKXE_DATA_DIR || process.env.LOCALAPPDATA || os.tmpdir(),
  'okxe',
  'data'
);
const persistentDbPath = path.join(persistentDbDir, 'rentals.db');
const otpHashSecret =
  process.env.OTP_HASH_SECRET ||
  process.env.SESSION_SECRET ||
  'okxe-development-otp-secret';
const userRoles = new Set(['customer', 'staff', 'admin']);
const employeeRoles = new Set(['staff', 'admin']);
const salesTitles = new Set(['Nhân viên kinh doanh', 'Trưởng phòng kinh doanh']);

const normalizeConfiguredEmail = (email) =>
  String(email || '').trim().toLowerCase();

const parseConfiguredEmails = (value) =>
  new Set(
    String(value || '')
      .split(',')
      .map(normalizeConfiguredEmail)
      .filter(Boolean)
  );

const configuredStaffEmails = parseConfiguredEmails(process.env.STAFF_EMAILS);
const configuredAdminEmails = parseConfiguredEmails(process.env.ADMIN_EMAILS);

const normalizeUserRole = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase();

  return userRoles.has(normalizedRole) ? normalizedRole : 'customer';
};

const getConfiguredRoleForEmail = (email) => {
  const normalizedEmail = normalizeConfiguredEmail(email);

  if (configuredAdminEmails.has(normalizedEmail)) {
    return 'admin';
  }

  if (configuredStaffEmails.has(normalizedEmail)) {
    return 'staff';
  }

  return 'customer';
};

const syncConfiguredEmployeeRoles = (database) => {
  const configuredRolesByEmail = new Map();

  configuredStaffEmails.forEach((email) => {
    configuredRolesByEmail.set(email, 'staff');
  });
  configuredAdminEmails.forEach((email) => {
    configuredRolesByEmail.set(email, 'admin');
  });

  if (!configuredRolesByEmail.size) {
    return;
  }

  const updateUserRoleStatement = database.prepare(`
    UPDATE users
    SET role = ?
    WHERE lower(email) = ?
  `);

  configuredRolesByEmail.forEach((role, email) => {
    updateUserRoleStatement.run(role, email);
  });
};

const ensurePersistentDatabaseFile = () => {
  fs.mkdirSync(persistentDbDir, { recursive: true });

  if (fs.existsSync(persistentDbPath)) {
    return;
  }

  try {
    const primaryDbStat = fs.statSync(primaryDbPath, { throwIfNoEntry: false });
    const primaryJournalPath = `${primaryDbPath}-journal`;
    const hasJournal = fs.existsSync(primaryJournalPath);

    if (primaryDbStat?.isFile() && !hasJournal) {
      fs.copyFileSync(primaryDbPath, persistentDbPath);
      return;
    }
  } catch (error) {
    console.warn(
      `Could not migrate SQLite database from ${primaryDbPath}: ${error.message}`
    );
  }

  if (!fs.existsSync(persistentDbPath)) {
    fs.closeSync(fs.openSync(persistentDbPath, 'a'));
  }
};

const openDatabase = () => {
  ensurePersistentDatabaseFile();
  return new DatabaseSync(persistentDbPath);
};

const initializeSchema = (database) => {
  database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    phone TEXT NOT NULL DEFAULT '',
    citizen_id TEXT NOT NULL DEFAULT '',
    birth_date TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    sales_title TEXT NOT NULL DEFAULT 'Nhân viên kinh doanh',
    sales_specialty TEXT NOT NULL DEFAULT '',
    sales_experience TEXT NOT NULL DEFAULT '',
    sales_bio TEXT NOT NULL DEFAULT '',
    show_on_home INTEGER NOT NULL DEFAULT 0,
    home_display_order INTEGER NOT NULL DEFAULT 0,
    address_province TEXT NOT NULL DEFAULT '',
    address_district TEXT NOT NULL DEFAULT '',
    address_ward TEXT NOT NULL DEFAULT '',
    address_detail TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL DEFAULT 'Khác',
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    price_text TEXT NOT NULL,
    price_value INTEGER NOT NULL,
    image TEXT NOT NULL,
    images_json TEXT NOT NULL DEFAULT '[]',
    year INTEGER NOT NULL,
    fuel TEXT NOT NULL,
    mileage_text TEXT NOT NULL,
    mileage_value INTEGER NOT NULL,
    seats TEXT NOT NULL,
    gearbox TEXT NOT NULL,
    origin TEXT NOT NULL,
    condition TEXT NOT NULL,
    color TEXT NOT NULL,
    action_text TEXT NOT NULL DEFAULT 'Còn xe',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_favorite_cars (
    user_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, car_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions (user_id);

  CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
  ON user_sessions (expires_at);

  CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id
  ON password_reset_otps (user_id);

  CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
  ON password_reset_otps (expires_at);

  CREATE INDEX IF NOT EXISTS idx_cars_name
  ON cars (name);

  CREATE INDEX IF NOT EXISTS idx_cars_price_value
  ON cars (price_value);

  CREATE INDEX IF NOT EXISTS idx_user_favorite_cars_user_id
  ON user_favorite_cars (user_id);

  CREATE INDEX IF NOT EXISTS idx_user_favorite_cars_car_id
  ON user_favorite_cars (car_id);
`);

  const userColumns = database.prepare('PRAGMA table_info(users)').all();
  const userColumnNames = new Set(userColumns.map((column) => column.name));
  const hasUserRoleColumn = userColumnNames.has('role');

  if (!hasUserRoleColumn) {
    database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
  }

  const userProfileColumns = [
    ['phone', "ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ''"],
    ['citizen_id', "ALTER TABLE users ADD COLUMN citizen_id TEXT NOT NULL DEFAULT ''"],
    ['birth_date', "ALTER TABLE users ADD COLUMN birth_date TEXT NOT NULL DEFAULT ''"],
    ['gender', "ALTER TABLE users ADD COLUMN gender TEXT NOT NULL DEFAULT ''"],
    ['avatar_url', "ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''"],
    ['sales_title', "ALTER TABLE users ADD COLUMN sales_title TEXT NOT NULL DEFAULT 'Nhân viên kinh doanh'"],
    ['sales_specialty', "ALTER TABLE users ADD COLUMN sales_specialty TEXT NOT NULL DEFAULT ''"],
    ['sales_experience', "ALTER TABLE users ADD COLUMN sales_experience TEXT NOT NULL DEFAULT ''"],
    ['sales_bio', "ALTER TABLE users ADD COLUMN sales_bio TEXT NOT NULL DEFAULT ''"],
    ['show_on_home', 'ALTER TABLE users ADD COLUMN show_on_home INTEGER NOT NULL DEFAULT 0'],
    ['home_display_order', 'ALTER TABLE users ADD COLUMN home_display_order INTEGER NOT NULL DEFAULT 0'],
    ['address_province', "ALTER TABLE users ADD COLUMN address_province TEXT NOT NULL DEFAULT ''"],
    ['address_district', "ALTER TABLE users ADD COLUMN address_district TEXT NOT NULL DEFAULT ''"],
    ['address_ward', "ALTER TABLE users ADD COLUMN address_ward TEXT NOT NULL DEFAULT ''"],
    ['address_detail', "ALTER TABLE users ADD COLUMN address_detail TEXT NOT NULL DEFAULT ''"],
    ['updated_at', 'ALTER TABLE users ADD COLUMN updated_at TEXT'],
  ];

  userProfileColumns.forEach(([columnName, alterStatement]) => {
    if (!userColumnNames.has(columnName)) {
      database.exec(alterStatement);
    }
  });

  database.exec(`
    UPDATE users
    SET role = 'customer'
    WHERE role IS NULL
       OR role = ''
  `);
  database.exec(`
    UPDATE users
    SET updated_at = COALESCE(NULLIF(updated_at, ''), created_at, CURRENT_TIMESTAMP)
    WHERE updated_at IS NULL
       OR updated_at = ''
  `);
  database.exec(`
    UPDATE users
    SET show_on_home = 0
    WHERE role NOT IN ('staff', 'admin')
      AND COALESCE(show_on_home, 0) != 0
  `);
  syncConfiguredEmployeeRoles(database);

  const carColumns = database.prepare('PRAGMA table_info(cars)').all();
  const hasBrandColumn = carColumns.some(
    (column) => column.name === 'brand'
  );
  const hasImagesJsonColumn = carColumns.some(
    (column) => column.name === 'images_json'
  );
  const hasDescriptionColumn = carColumns.some(
    (column) => column.name === 'description'
  );

  if (!hasBrandColumn) {
    database.exec("ALTER TABLE cars ADD COLUMN brand TEXT NOT NULL DEFAULT 'Khác'");
  }

  if (!hasDescriptionColumn) {
    database.exec("ALTER TABLE cars ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  }

  const inferBrandFromName = (name) => {
    const normalizedName = String(name || '').toLowerCase();
    const brandRules = [
      ['mercedes', 'Mercedes-Benz'],
      ['rolls-royce', 'Rolls-Royce'],
      ['porsche', 'Porsche'],
      ['cayenne', 'Porsche'],
      ['macan', 'Porsche'],
      ['audi', 'Audi'],
      ['bmw', 'BMW'],
      ['vinfast', 'VinFast'],
      ['toyota', 'Toyota'],
      ['ford', 'Ford'],
      ['kia', 'Kia'],
      ['hyundai', 'Hyundai'],
      ['mitsubishi', 'Mitsubishi'],
      ['mazda', 'Mazda'],
      ['honda', 'Honda'],
      ['chevrolet', 'Chevrolet'],
    ];
    const matchedRule = brandRules.find(([keyword]) =>
      normalizedName.includes(keyword)
    );

    return matchedRule?.[1] || 'Khác';
  };

  const carsWithoutBrand = database
    .prepare(`
      SELECT id, name, brand
      FROM cars
      WHERE brand IS NULL
         OR brand = ''
         OR brand = 'Khác'
    `)
    .all();

  if (carsWithoutBrand.length) {
    const updateCarBrandStatement = database.prepare(`
      UPDATE cars
      SET brand = ?
      WHERE id = ?
    `);

    carsWithoutBrand.forEach((car) => {
      updateCarBrandStatement.run(inferBrandFromName(car.name), car.id);
    });
  }

  if (!hasImagesJsonColumn) {
    database.exec("ALTER TABLE cars ADD COLUMN images_json TEXT NOT NULL DEFAULT '[]'");
  }

  const carsWithoutImageList = database
    .prepare(`
      SELECT id, image
      FROM cars
      WHERE images_json IS NULL
         OR images_json = ''
         OR images_json = '[]'
    `)
    .all();

  if (carsWithoutImageList.length) {
    const updateCarImagesStatement = database.prepare(`
      UPDATE cars
      SET images_json = ?
      WHERE id = ?
    `);

    carsWithoutImageList.forEach((car) => {
      const image = String(car.image || '').trim();

      if (image) {
        updateCarImagesStatement.run(JSON.stringify([image]), car.id);
      }
    });
  }

  const normalizeCarOptionValue = (columnName, canonicalValue, legacyValues) => {
    if (!legacyValues.length) {
      return;
    }

    const placeholders = legacyValues.map(() => '?').join(', ');
    const updateStatement = database.prepare(`
      UPDATE cars
      SET ${columnName} = ?
      WHERE ${columnName} IN (${placeholders})
    `);

    updateStatement.run(canonicalValue, ...legacyValues);
  };

  [
    ['category', 'SUV', ['suv', 'Suv']],
    ['category', 'Thể thao', ['Thể Thao', 'thể thao', 'Sport', 'sport']],
    ['type', 'Tự động', ['Tự Động', 'Số tự động', 'Số Tự Động', 'Hybrid', 'hybrid']],
    ['type', 'Số sàn', ['Sàn', 'sàn', 'Số Sàn', 'so san']],
    ['fuel', 'Xăng', ['xăng', 'xang', 'XANG']],
    ['fuel', 'Diesel', ['diesel', 'DIESEL', 'Dầu', 'dầu', 'dau', 'Dau']],
    ['fuel', 'Hybrid', ['hybrid', 'HYBRID']],
    ['fuel', 'Điện', ['điện', 'dien', 'Dien']],
    ['seats', '4 chỗ', ['4 Chỗ', '4 cho']],
    ['seats', '5 chỗ', ['5 Chỗ', '5 cho']],
    ['seats', '7 chỗ', ['7 Chỗ', '7 cho']],
    ['seats', '9 chỗ', ['9 Chỗ', '9 cho']],
    ['gearbox', 'Số Sàn', ['Sàn', 'sàn', 'Số sàn', 'so san']],
    ['gearbox', 'Tự động', ['Tự Động', 'Số tự động', 'Số Tự Động', 'Tự động / Tay', 'Tự Động / Tay']],
    ['origin', 'Nhập khẩu', ['nhập khẩu', 'Nhập Khẩu']],
    ['origin', 'Trong nước', ['trong nước', 'Trong Nước']],
    ['condition', 'Xe mới', ['xe mới', 'Xe Mới']],
    ['condition', 'Xe cũ', ['xe cũ', 'Xe Cũ', 'Xe đã qua sử dụng']],
    ['action_text', 'Còn xe', ['mua ngay', 'Mua ngay', 'Mua Ngay', 'còn hàng', 'Còn hàng', 'Còn Hàng']],
    ['action_text', 'Xe đã bán', ['hết hàng', 'Hết hàng', 'Hết Hàng', 'het hang', 'het xe', 'Hết xe', 'hết xe', 'xe da ban']],
  ].forEach(([columnName, canonicalValue, legacyValues]) => {
    normalizeCarOptionValue(columnName, canonicalValue, legacyValues);
  });
};

const db = openDatabase();

initializeSchema(db);

const insertUserStatement = db.prepare(`
  INSERT INTO users (
    full_name, email, password_hash, role, phone, avatar_url,
    sales_title, sales_specialty, sales_experience, sales_bio, show_on_home, home_display_order,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const findUserByIdStatement = db.prepare(`
  SELECT id, full_name, email, role, phone, citizen_id, birth_date, gender, avatar_url,
         sales_title, sales_specialty, sales_experience, sales_bio, show_on_home, home_display_order,
         address_province, address_district, address_ward, address_detail,
         updated_at, created_at
  FROM users
  WHERE id = ?
`);

const findUserWithPasswordByEmailStatement = db.prepare(`
  SELECT id, full_name, email, password_hash, role, phone, citizen_id, birth_date, gender, avatar_url,
         sales_title, sales_specialty, sales_experience, sales_bio, show_on_home, home_display_order,
         address_province, address_district, address_ward, address_detail,
         updated_at, created_at
  FROM users
  WHERE email = ?
`);

const insertSessionStatement = db.prepare(`
  INSERT INTO user_sessions (token, user_id, expires_at)
  VALUES (?, ?, ?)
`);

const findUserBySessionStatement = db.prepare(`
  SELECT users.id, users.full_name, users.email, users.role, users.phone,
         users.citizen_id, users.birth_date, users.gender, users.avatar_url,
         users.sales_title, users.sales_specialty, users.sales_experience, users.sales_bio,
         users.show_on_home, users.home_display_order, users.address_province,
         users.address_district, users.address_ward, users.address_detail,
         users.updated_at, users.created_at
  FROM user_sessions
  INNER JOIN users ON users.id = user_sessions.user_id
  WHERE user_sessions.token = ?
    AND user_sessions.expires_at > ?
`);

const deleteSessionStatement = db.prepare(`
  DELETE FROM user_sessions
  WHERE token = ?
`);

const deleteSessionsByUserStatement = db.prepare(`
  DELETE FROM user_sessions
  WHERE user_id = ?
`);

const deleteExpiredSessionsStatement = db.prepare(`
  DELETE FROM user_sessions
  WHERE expires_at <= ?
`);

const findUserByEmailStatement = db.prepare(`
  SELECT id, full_name, email, role, phone, citizen_id, birth_date, gender, avatar_url,
         sales_title, sales_specialty, sales_experience, sales_bio, show_on_home, home_display_order,
         address_province, address_district, address_ward, address_detail,
         updated_at, created_at
  FROM users
  WHERE email = ?
`);

const listUsersStatement = db.prepare(`
  SELECT id, full_name, email, role, phone, citizen_id, birth_date, gender, avatar_url,
         sales_title, sales_specialty, sales_experience, sales_bio, show_on_home, home_display_order,
         address_province, address_district, address_ward, address_detail,
         updated_at, created_at
  FROM users
  ORDER BY
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'staff' THEN 2
      ELSE 3
    END,
    lower(full_name),
    lower(email)
`);

const listHomepageTeamMembersStatement = db.prepare(`
  SELECT id, full_name, role, phone, avatar_url,
         sales_title, sales_specialty, sales_experience, sales_bio,
         home_display_order, updated_at, created_at
  FROM users
  WHERE show_on_home = 1
    AND role IN ('staff', 'admin')
  ORDER BY
    home_display_order ASC,
    CASE sales_title
      WHEN 'Trưởng phòng kinh doanh' THEN 1
      ELSE 2
    END,
    lower(full_name),
    id
  LIMIT 8
`);

const updateUserRoleStatement = db.prepare(`
  UPDATE users
  SET role = ?,
      show_on_home = CASE WHEN ? IN ('staff', 'admin') THEN show_on_home ELSE 0 END,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const updateUserProfileStatement = db.prepare(`
  UPDATE users
  SET full_name = ?,
      email = ?,
      role = ?,
      phone = ?,
      avatar_url = ?,
      sales_title = ?,
      sales_specialty = ?,
      sales_experience = ?,
      sales_bio = ?,
      show_on_home = ?,
      home_display_order = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const updateUserProfileWithPasswordStatement = db.prepare(`
  UPDATE users
  SET full_name = ?,
      email = ?,
      role = ?,
      phone = ?,
      avatar_url = ?,
      sales_title = ?,
      sales_specialty = ?,
      sales_experience = ?,
      sales_bio = ?,
      show_on_home = ?,
      home_display_order = ?,
      password_hash = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const updateUserSelfProfileStatement = db.prepare(`
  UPDATE users
  SET phone = ?,
      citizen_id = ?,
      birth_date = ?,
      gender = ?,
      avatar_url = ?,
      address_province = ?,
      address_district = ?,
      address_ward = ?,
      address_detail = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const deleteUserStatement = db.prepare(`
  DELETE FROM users
  WHERE id = ?
`);

const countAdminsStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM users
  WHERE role = 'admin'
`);

const invalidateResetOtpsByUserStatement = db.prepare(`
  UPDATE password_reset_otps
  SET used_at = ?
  WHERE user_id = ?
    AND used_at IS NULL
`);

const insertResetOtpStatement = db.prepare(`
  INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
  VALUES (?, ?, ?)
`);

const findResetOtpStatement = db.prepare(`
  SELECT password_reset_otps.id, password_reset_otps.user_id, password_reset_otps.expires_at, password_reset_otps.used_at,
         users.id AS account_id, users.full_name, users.email, users.role, users.created_at
  FROM password_reset_otps
  INNER JOIN users ON users.id = password_reset_otps.user_id
  WHERE users.email = ?
    AND password_reset_otps.otp_hash = ?
`);

const markResetOtpUsedStatement = db.prepare(`
  UPDATE password_reset_otps
  SET used_at = ?
  WHERE id = ?
`);

const updateUserPasswordStatement = db.prepare(`
  UPDATE users
  SET password_hash = ?
  WHERE id = ?
`);

const deleteExpiredResetOtpsStatement = db.prepare(`
  DELETE FROM password_reset_otps
  WHERE expires_at <= ?
     OR used_at IS NOT NULL
`);

const insertCarStatement = db.prepare(`
  INSERT INTO cars (
    brand, category, name, description, type, price_text, price_value, image, images_json, year, fuel,
    mileage_text, mileage_value, seats, gearbox, origin, condition, color, action_text
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateCarStatement = db.prepare(`
  UPDATE cars
  SET brand = ?,
      category = ?,
      name = ?,
      description = ?,
      type = ?,
      price_text = ?,
      price_value = ?,
      image = ?,
      images_json = ?,
      year = ?,
      fuel = ?,
      mileage_text = ?,
      mileage_value = ?,
      seats = ?,
      gearbox = ?,
      origin = ?,
      condition = ?,
      color = ?,
      action_text = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const deleteCarStatement = db.prepare(`
  DELETE FROM cars
  WHERE id = ?
`);

const findCarByIdStatement = db.prepare(`
  SELECT *
  FROM cars
  WHERE id = ?
`);

const countCarsStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM cars
`);

const listCarsStatement = db.prepare(`
  SELECT *
  FROM cars
  ORDER BY datetime(created_at) DESC, id DESC
`);

const listFavoriteCarsByUserStatement = db.prepare(`
  SELECT cars.*
  FROM user_favorite_cars
  INNER JOIN cars ON cars.id = user_favorite_cars.car_id
  WHERE user_favorite_cars.user_id = ?
  ORDER BY datetime(user_favorite_cars.created_at) DESC, cars.id DESC
`);

const findFavoriteCarStatement = db.prepare(`
  SELECT user_id, car_id
  FROM user_favorite_cars
  WHERE user_id = ?
    AND car_id = ?
`);

const insertFavoriteCarStatement = db.prepare(`
  INSERT OR IGNORE INTO user_favorite_cars (user_id, car_id)
  VALUES (?, ?)
`);

const deleteFavoriteCarStatement = db.prepare(`
  DELETE FROM user_favorite_cars
  WHERE user_id = ?
    AND car_id = ?
`);

const seedCars = [
  {
    brand: 'Rolls-Royce',
    category: 'Sedan',
    name: 'Rolls-Royce Phantom',
    type: 'Tự động',
    priceText: '29,9 tỷ VNĐ',
    priceValue: 29900000000,
    image: '../images/rental-1.png',
    year: 2024,
    fuel: 'Xăng',
    mileageText: '12.300 km',
    mileageValue: 12300,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe mới',
    color: 'Đen',
    actionText: 'Còn xe'
  },
  {
    brand: 'Porsche',
    category: 'Sedan',
    name: 'Porsche Macan 4',
    type: 'Tự động',
    priceText: '4,1 tỷ VNĐ',
    priceValue: 4100000000,
    image: '../images/rental-2.png',
    year: 2023,
    fuel: 'Xăng',
    mileageText: '8.900 km',
    mileageValue: 8900,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe mới',
    color: 'Xanh lá',
    actionText: 'Còn xe'
  },
  {
    brand: 'Porsche',
    category: 'Sedan',
    name: 'Cayenne S E-Hybrid',
    type: 'Tự động',
    priceText: '5,3 tỷ VNĐ',
    priceValue: 5300000000,
    image: '../images/rental-3.png',
    year: 2024,
    fuel: 'Hybrid',
    mileageText: '5.200 km',
    mileageValue: 5200,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe mới',
    color: 'Trắng',
    actionText: 'Còn xe'
  },
  {
    brand: 'Audi',
    category: 'Sedan',
    name: 'Audi A7',
    type: 'Tự động',
    priceText: '3,2 tỷ VNĐ',
    priceValue: 3200000000,
    image: '../images/rental-4.png',
    year: 2022,
    fuel: 'Xăng',
    mileageText: '18.000 km',
    mileageValue: 18000,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe cũ',
    color: 'Xanh dương',
    actionText: 'Còn xe'
  },
  {
    brand: 'BMW',
    category: 'Sedan',
    name: 'BMW M4',
    type: 'Tự động',
    priceText: '4,8 tỷ VNĐ',
    priceValue: 4800000000,
    image: '../images/rental-5.png',
    year: 2023,
    fuel: 'Xăng',
    mileageText: '9.800 km',
    mileageValue: 9800,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe mới',
    color: 'Cam',
    actionText: 'Còn xe'
  },
  {
    brand: 'Mercedes-Benz',
    category: 'Sedan',
    name: 'Mercedes-Benz CLA',
    type: 'Tự động',
    priceText: '1,9 tỷ VNĐ',
    priceValue: 1900000000,
    image: '../images/rental-6.png',
    year: 2022,
    fuel: 'Xăng',
    mileageText: '16.200 km',
    mileageValue: 16200,
    seats: '5 chỗ',
    gearbox: 'Tự động',
    origin: 'Nhập khẩu',
    condition: 'Xe cũ',
    color: 'Trắng',
    actionText: 'Còn xe'
  }
];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeFullName = (fullName) =>
  String(fullName || '').trim().replace(/\s+/g, ' ');

const normalizeSalesTitle = (title) => {
  const normalizedTitle = String(title || '').trim();

  return salesTitles.has(normalizedTitle)
    ? normalizedTitle
    : 'Nhân viên kinh doanh';
};

const normalizeBooleanInteger = (value) =>
  value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;

const normalizeSalesProfilePayload = (profile = {}, role = 'customer') => {
  const normalizedRole = normalizeUserRole(role);
  const canShowOnHome = employeeRoles.has(normalizedRole);
  const displayOrder = Number(profile.homeDisplayOrder ?? profile.displayOrder ?? 0);

  return {
    phone: String(profile.phone || '').trim(),
    avatarUrl: String(profile.avatarUrl || '').trim(),
    salesTitle: normalizeSalesTitle(profile.salesTitle),
    salesSpecialty: String(profile.salesSpecialty || '').trim(),
    salesExperience: String(profile.salesExperience || '').trim(),
    salesBio: String(profile.salesBio || '').trim(),
    showOnHome: canShowOnHome ? normalizeBooleanInteger(profile.showOnHome) : 0,
    homeDisplayOrder: Number.isFinite(displayOrder) ? Math.max(0, Math.trunc(displayOrder)) : 0,
  };
};

const sanitizeUser = (userRow) => {
  if (!userRow) {
    return null;
  }

  return {
    id: userRow.id,
    fullName: userRow.full_name,
    email: userRow.email,
    role: normalizeUserRole(userRow.role),
    phone: userRow.phone || '',
    citizenId: userRow.citizen_id || '',
    birthDate: userRow.birth_date || '',
    gender: userRow.gender || '',
    avatarUrl: userRow.avatar_url || '',
    salesTitle: normalizeSalesTitle(userRow.sales_title),
    salesSpecialty: userRow.sales_specialty || '',
    salesExperience: userRow.sales_experience || '',
    salesBio: userRow.sales_bio || '',
    showOnHome: Boolean(userRow.show_on_home),
    homeDisplayOrder: Number(userRow.home_display_order || 0),
    address: {
      province: userRow.address_province || '',
      district: userRow.address_district || '',
      ward: userRow.address_ward || '',
      detail: userRow.address_detail || '',
    },
    updatedAt: userRow.updated_at || '',
    createdAt: userRow.created_at,
  };
};

const sanitizeTeamMember = (userRow) => {
  if (!userRow) {
    return null;
  }

  return {
    id: userRow.id,
    fullName: userRow.full_name,
    role: normalizeUserRole(userRow.role),
    phone: userRow.phone || '',
    avatarUrl: userRow.avatar_url || '',
    salesTitle: normalizeSalesTitle(userRow.sales_title),
    salesSpecialty: userRow.sales_specialty || '',
    salesExperience: userRow.sales_experience || '',
    salesBio: userRow.sales_bio || '',
    homeDisplayOrder: Number(userRow.home_display_order || 0),
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

const parseCarImages = (imagesJson, fallbackImage) => {
  try {
    return normalizeCarImages(JSON.parse(imagesJson || '[]'), fallbackImage);
  } catch (error) {
    return normalizeCarImages([], fallbackImage);
  }
};

const sanitizeCar = (carRow) => {
  if (!carRow) {
    return null;
  }

  const images = parseCarImages(carRow.images_json, carRow.image);

  return {
    id: carRow.id,
    brand: carRow.brand,
    category: carRow.category,
    name: carRow.name,
    description: carRow.description || '',
    type: carRow.type,
    price: carRow.price_text,
    priceValue: carRow.price_value,
    image: images[0] || carRow.image,
    images,
    year: carRow.year,
    fuel: carRow.fuel,
    mileage: carRow.mileage_text,
    mileageValue: carRow.mileage_value,
    seats: carRow.seats,
    gearbox: carRow.gearbox,
    origin: carRow.origin,
    condition: carRow.condition,
    color: carRow.color,
    actionText: carRow.action_text,
    createdAt: carRow.created_at,
    updatedAt: carRow.updated_at
  };
};

const normalizeCarPayload = (car = {}) => {
  const images = normalizeCarImages(car.images, car.image);

  return {
    brand: String(car.brand || '').trim(),
    category: String(car.category || '').trim(),
    name: String(car.name || '').trim(),
    description: String(car.description || '').trim(),
    type: String(car.type || '').trim(),
    priceText: String(car.priceText || car.price || '').trim(),
    priceValue: Number(car.priceValue || 0),
    image: images[0] || String(car.image || '').trim(),
    images,
    year: Number(car.year || 0),
    fuel: String(car.fuel || '').trim(),
    mileageText: String(car.mileageText || car.mileage || '').trim(),
    mileageValue: Number(car.mileageValue || 0),
    seats: String(car.seats || '').trim(),
    gearbox: String(car.gearbox || '').trim(),
    origin: String(car.origin || '').trim(),
    condition: String(car.condition || '').trim(),
    color: String(car.color || '').trim(),
    actionText: String(car.actionText || 'Còn xe').trim() || 'Còn xe'
  };
};

const upsertCar = (car, existingId = null) => {
  const normalizedCar = normalizeCarPayload(car);

  if (existingId) {
    updateCarStatement.run(
      normalizedCar.brand,
      normalizedCar.category,
      normalizedCar.name,
      normalizedCar.description,
      normalizedCar.type,
      normalizedCar.priceText,
      normalizedCar.priceValue,
      normalizedCar.image,
      JSON.stringify(normalizedCar.images),
      normalizedCar.year,
      normalizedCar.fuel,
      normalizedCar.mileageText,
      normalizedCar.mileageValue,
      normalizedCar.seats,
      normalizedCar.gearbox,
      normalizedCar.origin,
      normalizedCar.condition,
      normalizedCar.color,
      normalizedCar.actionText,
      existingId
    );

    return sanitizeCar(findCarByIdStatement.get(existingId));
  }

  const result = insertCarStatement.run(
    normalizedCar.brand,
    normalizedCar.category,
    normalizedCar.name,
    normalizedCar.description,
    normalizedCar.type,
    normalizedCar.priceText,
    normalizedCar.priceValue,
    normalizedCar.image,
    JSON.stringify(normalizedCar.images),
    normalizedCar.year,
    normalizedCar.fuel,
    normalizedCar.mileageText,
    normalizedCar.mileageValue,
    normalizedCar.seats,
    normalizedCar.gearbox,
    normalizedCar.origin,
    normalizedCar.condition,
    normalizedCar.color,
    normalizedCar.actionText
  );

  return sanitizeCar(findCarByIdStatement.get(result.lastInsertRowid));
};

const seedCarsIfEmpty = () => {
  const carCount = countCarsStatement.get().total;

  if (carCount > 0) {
    return;
  }

  seedCars.forEach((car) => {
    upsertCar(car);
  });
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(String(password), salt, 64).toString('hex');

  return `${salt}:${hashedPassword}`;
};

const hashResetOtp = (otp) =>
  createHmac('sha256', otpHashSecret).update(String(otp)).digest('hex');

const verifyPassword = (password, storedHash) => {
  const [salt, storedKey] = String(storedHash || '').split(':');

  if (!salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, 'hex');
  const derivedKey = scryptSync(String(password), salt, storedBuffer.length);

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
};

const cleanupExpiredSessions = () => {
  deleteExpiredSessionsStatement.run(new Date().toISOString());
};

const cleanupPasswordResetOtps = () => {
  deleteExpiredResetOtpsStatement.run(new Date().toISOString());
};

const createUser = ({
  fullName,
  email,
  password,
  role,
  phone,
  avatarUrl,
  salesTitle,
  salesSpecialty,
  salesExperience,
  salesBio,
  showOnHome,
  homeDisplayOrder,
}) => {
  const normalizedFullName = normalizeFullName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);
  const userRole = normalizeUserRole(role || getConfiguredRoleForEmail(normalizedEmail));
  const salesProfile = normalizeSalesProfilePayload(
    {
      phone,
      avatarUrl,
      salesTitle,
      salesSpecialty,
      salesExperience,
      salesBio,
      showOnHome,
      homeDisplayOrder,
    },
    userRole
  );

  const result = insertUserStatement.run(
    normalizedFullName,
    normalizedEmail,
    passwordHash,
    userRole,
    salesProfile.phone,
    salesProfile.avatarUrl,
    salesProfile.salesTitle,
    salesProfile.salesSpecialty,
    salesProfile.salesExperience,
    salesProfile.salesBio,
    salesProfile.showOnHome,
    salesProfile.homeDisplayOrder
  );

  return sanitizeUser(findUserByIdStatement.get(result.lastInsertRowid));
};

const listUsers = () => listUsersStatement.all().map(sanitizeUser);

const listHomepageTeamMembers = () =>
  listHomepageTeamMembersStatement.all().map(sanitizeTeamMember);

const getUserById = (userId) => sanitizeUser(findUserByIdStatement.get(userId));

const countAdminUsers = () => countAdminsStatement.get().total;

const updateUserRole = (userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  const existingUser = getUserById(userId);

  if (!existingUser) {
    return null;
  }

  updateUserRoleStatement.run(normalizedRole, normalizedRole, userId);
  return getUserById(userId);
};

const updateUserProfile = (
  userId,
  {
    fullName,
    email,
    role,
    password,
    phone,
    avatarUrl,
    salesTitle,
    salesSpecialty,
    salesExperience,
    salesBio,
    showOnHome,
    homeDisplayOrder,
  }
) => {
  const existingUser = getUserById(userId);

  if (!existingUser) {
    return null;
  }

  const normalizedFullName = normalizeFullName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeUserRole(role);
  const normalizedPassword = String(password || '');
  const salesProfile = normalizeSalesProfilePayload(
    {
      phone,
      avatarUrl,
      salesTitle,
      salesSpecialty,
      salesExperience,
      salesBio,
      showOnHome,
      homeDisplayOrder,
    },
    normalizedRole
  );

  if (normalizedPassword) {
    updateUserProfileWithPasswordStatement.run(
      normalizedFullName,
      normalizedEmail,
      normalizedRole,
      salesProfile.phone,
      salesProfile.avatarUrl,
      salesProfile.salesTitle,
      salesProfile.salesSpecialty,
      salesProfile.salesExperience,
      salesProfile.salesBio,
      salesProfile.showOnHome,
      salesProfile.homeDisplayOrder,
      hashPassword(normalizedPassword),
      userId
    );
  } else {
    updateUserProfileStatement.run(
      normalizedFullName,
      normalizedEmail,
      normalizedRole,
      salesProfile.phone,
      salesProfile.avatarUrl,
      salesProfile.salesTitle,
      salesProfile.salesSpecialty,
      salesProfile.salesExperience,
      salesProfile.salesBio,
      salesProfile.showOnHome,
      salesProfile.homeDisplayOrder,
      userId
    );
  }

  return getUserById(userId);
};

const updateUserSelfProfile = (
  userId,
  {
    phone,
    citizenId,
    birthDate,
    gender,
    avatarUrl,
    addressProvince,
    addressDistrict,
    addressWard,
    addressDetail,
  }
) => {
  const existingUser = getUserById(userId);

  if (!existingUser) {
    return null;
  }

  updateUserSelfProfileStatement.run(
    String(phone || '').trim(),
    String(citizenId || '').trim(),
    String(birthDate || '').trim(),
    String(gender || '').trim(),
    String(avatarUrl ?? existingUser.avatarUrl ?? '').trim(),
    String(addressProvince || '').trim(),
    String(addressDistrict || '').trim(),
    String(addressWard || '').trim(),
    String(addressDetail || '').trim(),
    userId
  );

  return getUserById(userId);
};

const deleteUser = (userId) => {
  const existingUser = getUserById(userId);

  if (!existingUser) {
    return null;
  }

  deleteUserStatement.run(userId);
  return existingUser;
};

const authenticateUser = (email, password) => {
  const userRow = findUserWithPasswordByEmailStatement.get(normalizeEmail(email));

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    return null;
  }

  return sanitizeUser(userRow);
};

const createSession = (userId, rememberUser = false) => {
  cleanupExpiredSessions();

  const token = randomUUID();
  const expiresAt = new Date(
    Date.now() + (rememberUser ? 30 : 1) * 24 * 60 * 60 * 1000
  ).toISOString();

  insertSessionStatement.run(token, userId, expiresAt);

  return { token, expiresAt };
};

const getUserBySession = (token) => {
  if (!token) {
    return null;
  }

  cleanupExpiredSessions();

  return sanitizeUser(
    findUserBySessionStatement.get(token, new Date().toISOString())
  );
};

const deleteSession = (token) => {
  if (!token) {
    return;
  }

  deleteSessionStatement.run(token);
};

const createPasswordResetOtp = (email) => {
  cleanupPasswordResetOtps();

  const normalizedEmail = normalizeEmail(email);
  const user = findUserByEmailStatement.get(normalizedEmail);

  if (!user) {
    return null;
  }

  const otp = String(randomInt(100000, 1000000));
  const otpHash = hashResetOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.exec('BEGIN IMMEDIATE');

  try {
    invalidateResetOtpsByUserStatement.run(new Date().toISOString(), user.id);
    insertResetOtpStatement.run(user.id, otpHash, expiresAt);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    otp,
    expiresAt,
    user: sanitizeUser(user),
  };
};

const resetPasswordWithOtp = (email, otp, newPassword) => {
  cleanupPasswordResetOtps();

  const otpRecord = findResetOtpStatement.get(
    normalizeEmail(email),
    hashResetOtp(otp)
  );

  if (!otpRecord) {
    return null;
  }

  const isExpired = new Date(otpRecord.expires_at).getTime() <= Date.now();
  const isUsed = Boolean(otpRecord.used_at);

  if (isExpired || isUsed) {
    return null;
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(newPassword);

  db.exec('BEGIN IMMEDIATE');

  try {
    updateUserPasswordStatement.run(passwordHash, otpRecord.user_id);
    markResetOtpUsedStatement.run(now, otpRecord.id);
    deleteSessionsByUserStatement.run(otpRecord.user_id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    id: otpRecord.account_id,
    fullName: otpRecord.full_name,
    email: otpRecord.email,
    role: normalizeUserRole(otpRecord.role),
    createdAt: otpRecord.created_at,
  };
};

const listCars = () => listCarsStatement.all().map(sanitizeCar);

const getCarById = (carId) => sanitizeCar(findCarByIdStatement.get(carId));

const listFavoriteCarsByUser = (userId) =>
  listFavoriteCarsByUserStatement.all(userId).map(sanitizeCar);

const isFavoriteCarByUser = (userId, carId) =>
  Boolean(findFavoriteCarStatement.get(userId, carId));

const addFavoriteCarForUser = (userId, carId) => {
  const existingCar = getCarById(carId);

  if (!existingCar) {
    return null;
  }

  insertFavoriteCarStatement.run(userId, carId);

  return {
    car: existingCar,
    favorites: listFavoriteCarsByUser(userId),
  };
};

const removeFavoriteCarForUser = (userId, carId) => {
  const existingCar = getCarById(carId);

  if (!existingCar) {
    return null;
  }

  deleteFavoriteCarStatement.run(userId, carId);

  return {
    car: existingCar,
    favorites: listFavoriteCarsByUser(userId),
  };
};

const createCar = (car) => upsertCar(car);

const updateCar = (carId, car) => {
  const existingCar = findCarByIdStatement.get(carId);

  if (!existingCar) {
    return null;
  }

  return upsertCar(car, carId);
};

const deleteCar = (carId) => {
  const existingCar = getCarById(carId);

  if (!existingCar) {
    return null;
  }

  deleteCarStatement.run(carId);
  return existingCar;
};

seedCarsIfEmpty();

module.exports = {
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
  getCarById,
  getUserById,
  getUserBySession,
  employeeRoles,
  isFavoriteCarByUser,
  listUsers,
  listHomepageTeamMembers,
  listCars,
  listFavoriteCarsByUser,
  removeFavoriteCarForUser,
  resetPasswordWithOtp,
  updateUserProfile,
  updateUserSelfProfile,
  updateUserRole,
  updateCar,
};
