CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  seat_number VARCHAR(20),
  customer_name VARCHAR(100),
  phone VARCHAR(20),
  payment_method ENUM('cash','transfer') DEFAULT 'cash',
  status ENUM('pending','confirmed','preparing','ready','completed','cancelled') DEFAULT 'pending',
  total_amount DECIMAL(12,2),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL
)
