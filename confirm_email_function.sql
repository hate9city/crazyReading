-- 创建存储过程来确认用户邮箱
CREATE OR REPLACE FUNCTION confirm_user_email(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新 auth.users 表中的 email_confirmed_at 字段
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = user_id;
END;
$$;