CREATE TABLE IF NOT EXISTS seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seat_number INT NOT NULL UNIQUE,
  status ENUM('available','locked','occupied') DEFAULT 'available',
  locked_session_id INT NULL,
  locked_at DATETIME NULL
)
