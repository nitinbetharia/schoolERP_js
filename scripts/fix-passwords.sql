-- Fix password hashes for both system and trust users
UPDATE system_users SET password_hash = '$2a$12$IVB7..bsgGZ.cz5mh11uqut9h5LhU0ZZi5hXLy12mT0QJdO.G7sjW' WHERE email = 'admin@system.local';
UPDATE users SET password_hash = '$2a$12$IVB7..bsgGZ.cz5mh11uqut9h5LhU0ZZi5hXLy12mT0QJdO.G7sjW' WHERE email = 'admin@demo.school';