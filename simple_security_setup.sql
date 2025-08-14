-- 简化的安全设置 - 仅保留注册限制功能

-- 1. 注册限制表（记录IP注册频率）
CREATE TABLE IF NOT EXISTS registration_limits (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    email VARCHAR(255) NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 安全日志表
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    ip_address INET,
    user_agent TEXT,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    success BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_registration_limits_ip ON registration_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_limits_email ON registration_limits(email);
CREATE INDEX IF NOT EXISTS idx_registration_limits_last_attempt ON registration_limits(last_attempt);

-- 创建检查注册限制的函数
CREATE OR REPLACE FUNCTION check_registration_limit(p_ip_address INET, p_email VARCHAR)
RETURNS TABLE(is_allowed BOOLEAN, reason TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    attempt_count INTEGER;
    last_attempt TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN;
    time_since_last_attempt INTERVAL;
BEGIN
    -- 检查IP是否被阻止
    SELECT is_blocked, last_attempt, attempt_count
    INTO is_blocked, last_attempt, attempt_count
    FROM registration_limits
    WHERE ip_address = p_ip_address
    ORDER BY last_attempt DESC
    LIMIT 1;
    
    IF is_blocked THEN
        RETURN QUERY SELECT FALSE, 'IP地址已被阻止'::TEXT;
        RETURN;
    END IF;
    
    -- 检查同一邮箱的注册尝试
    SELECT COUNT(*)
    INTO attempt_count
    FROM registration_limits
    WHERE email = p_email
    AND created_at > NOW() - INTERVAL '24 hours';
    
    IF attempt_count >= 3 THEN
        RETURN QUERY SELECT FALSE, '该邮箱24小时内注册次数过多'::TEXT;
        RETURN;
    END IF;
    
    -- 检查IP的注册频率
    IF last_attempt IS NOT NULL THEN
        time_since_last_attempt := NOW() - last_attempt;
        
        -- 如果1分钟内尝试超过5次，阻止该IP
        SELECT COUNT(*)
        INTO attempt_count
        FROM registration_limits
        WHERE ip_address = p_ip_address
        AND last_attempt > NOW() - INTERVAL '1 minute';
        
        IF attempt_count >= 5 THEN
            -- 阻止IP 1小时
            UPDATE registration_limits
            SET is_blocked = TRUE,
                updated_at = NOW()
            WHERE ip_address = p_ip_address
            ORDER BY last_attempt DESC
            LIMIT 1;
            
            RETURN QUERY SELECT FALSE, '注册频率过高，IP已被临时阻止'::TEXT;
            RETURN;
        END IF;
        
        -- 如果15分钟内尝试超过10次，阻止该IP
        SELECT COUNT(*)
        INTO attempt_count
        FROM registration_limits
        WHERE ip_address = p_ip_address
        AND last_attempt > NOW() - INTERVAL '15 minutes';
        
        IF attempt_count >= 10 THEN
            -- 阻止IP 24小时
            UPDATE registration_limits
            SET is_blocked = TRUE,
                updated_at = NOW()
            WHERE ip_address = p_ip_address
            ORDER BY last_attempt DESC
            LIMIT 1;
            
            RETURN QUERY SELECT FALSE, '注册频率过高，IP已被临时阻止'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT TRUE, '允许注册'::TEXT;
END;
$$;

-- 创建记录注册尝试的函数
CREATE OR REPLACE FUNCTION record_registration_attempt(p_ip_address INET, p_email VARCHAR, p_success BOOLEAN)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 更新或插入注册限制记录
    INSERT INTO registration_limits (ip_address, email, attempt_count, last_attempt)
    VALUES (p_ip_address, p_email, 1, NOW())
    ON CONFLICT (ip_address, email) 
    DO UPDATE SET 
        attempt_count = registration_limits.attempt_count + 1,
        last_attempt = NOW(),
        updated_at = NOW();
    
    -- 记录安全日志
    INSERT INTO security_logs (ip_address, action, details, success)
    VALUES (p_ip_address, 'registration_attempt', 
            jsonb_build_object('email', p_email, 'success', p_success), 
            p_success);
END;
$$;