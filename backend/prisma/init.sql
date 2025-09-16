-- Create additional databases or users if needed
CREATE DATABASE IF NOT EXISTS tms_db;
CREATE USER IF NOT EXISTS 'tms_user'@'%' IDENTIFIED BY 'tms_password';
GRANT ALL PRIVILEGES ON tms_db.* TO 'tms_user'@'%';
FLUSH PRIVILEGES;