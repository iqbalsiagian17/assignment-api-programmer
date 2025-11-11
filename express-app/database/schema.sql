-- 1️⃣ Create database
CREATE DATABASE nutech_test;

-- 2️⃣ Connect
\c nutech_test;

-- 3️⃣ Utility function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ Function for auto balance
CREATE OR REPLACE FUNCTION initialize_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO balances (user_id, balance)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ Tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_image TEXT DEFAULT 'https://yoururlapi.com/profile.jpeg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    banner_name VARCHAR(100) NOT NULL,
    banner_image TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_icon TEXT NOT NULL,
    service_tariff INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('TOPUP', 'PAYMENT')),
    service_code VARCHAR(50) REFERENCES services(service_code),
    service_name VARCHAR(100),
    total_amount BIGINT NOT NULL,
    description TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6️⃣ Triggers
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at
BEFORE UPDATE ON balances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER create_balance_on_user_registration
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_balance();

-- 7️⃣ Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_banners_active_order ON banners(is_active, display_order);
CREATE INDEX idx_services_code ON services(service_code);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_created_on ON transactions(created_on DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_on DESC);

-- 8️⃣ Dummy Data
INSERT INTO banners (banner_name, banner_image, description, display_order) VALUES
('Banner 1', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 1),
('Banner 2', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 2),
('Banner 3', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 3),
('Banner 4', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 4),
('Banner 5', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 5),
('Banner 6', 'https://nutech-integrasi.app/dummy.jpg', 'Lorem Ipsum Dolor sit amet', 6);

INSERT INTO services (service_code, service_name, service_icon, service_tariff) VALUES
('PAJAK', 'Pajak PBB', 'https://nutech-integrasi.app/dummy.jpg', 40000),
('PLN', 'Listrik', 'https://nutech-integrasi.app/dummy.jpg', 10000),
('PDAM', 'PDAM Berlangganan', 'https://nutech-integrasi.app/dummy.jpg', 40000),
('PULSA', 'Pulsa', 'https://nutech-integrasi.app/dummy.jpg', 40000),
('PGN', 'PGN Berlangganan', 'https://nutech-integrasi.app/dummy.jpg', 50000),
('MUSIK', 'Musik Berlangganan', 'https://nutech-integrasi.app/dummy.jpg', 50000),
('TV', 'TV Berlangganan', 'https://nutech-integrasi.app/dummy.jpg', 50000),
('PAKET_DATA', 'Paket data', 'https://nutech-integrasi.app/dummy.jpg', 50000),
('VOUCHER_GAME', 'Voucher Game', 'https://nutech-integrasi.app/dummy.jpg', 100000),
('VOUCHER_MAKANAN', 'Voucher Makanan', 'https://nutech-integrasi.app/dummy.jpg', 100000),
('QURBAN', 'Qurban', 'https://nutech-integrasi.app/dummy.jpg', 200000),
('ZAKAT', 'Zakat', 'https://nutech-integrasi.app/dummy.jpg', 300000);
