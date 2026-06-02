-- 将用户 ID 000000000 设为管理员
UPDATE profiles 
SET is_admin = true 
WHERE display_id = 0 OR user_id = '000000000';
