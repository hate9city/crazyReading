-- 创建安全相关的表来防止恶意注册

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

-- 2. 邮箱域名白名单表
CREATE TABLE IF NOT EXISTS allowed_email_domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. 安全日志表
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    ip_address INET,
    user_agent TEXT,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    success BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'registration', 'password_reset'
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_registration_limits_ip ON registration_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_limits_email ON registration_limits(email);
CREATE INDEX IF NOT EXISTS idx_registration_limits_last_attempt ON registration_limits(last_attempt);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 插入常用的邮箱域名到白名单
INSERT INTO allowed_email_domains (domain) VALUES 
('qq.com'),
('163.com'),
('126.com'),
('gmail.com'),
('outlook.com'),
('hotmail.com'),
('sina.com'),
('sohu.com'),
('foxmail.com'),
('139.com')
ON CONFLICT (domain) DO NOTHING;

-- 创建清理过期记录的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() OR is_used = TRUE;
END;
$$;

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
    
    -- 检查邮箱域名是否在白名单中
    SELECT COUNT(*)
    INTO attempt_count
    FROM allowed_email_domains
    WHERE domain = SPLIT_PART(p_email, '@', 2)
    AND is_active = TRUE;
    
    IF attempt_count = 0 THEN
        RETURN QUERY SELECT FALSE, '邮箱域名不在允许的列表中'::TEXT;
        RETURN;
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

-- 创建生成验证码的函数
CREATE OR REPLACE FUNCTION generate_verification_code(p_email VARCHAR, p_type VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_code VARCHAR(6);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 生成6位随机验证码
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- 清理该邮箱的旧验证码
    DELETE FROM verification_codes 
    WHERE email = p_email AND type = p_type;
    
    -- 插入新验证码
    INSERT INTO verification_codes (email, code, type, expires_at)
    VALUES (p_email, v_code, p_type, v_expires_at);
    
    RETURN v_code;
END;
$$;

-- 创建验证验证码的函数
CREATE OR REPLACE FUNCTION verify_code(p_email VARCHAR, p_code VARCHAR, p_type VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_valid BOOLEAN;
BEGIN
    -- 检查验证码是否有效
    SELECT EXISTS(
        SELECT 1 FROM verification_codes 
        WHERE email = p_email 
        AND code = p_code 
        AND type = p_type 
        AND is_used = FALSE 
        AND expires_at > NOW()
    ) INTO v_is_valid;
    
    IF v_is_valid THEN
        -- 标记验证码为已使用
        UPDATE verification_codes 
        SET is_used = TRUE 
        WHERE email = p_email 
        AND code = p_code 
        AND type = p_type;
    END IF;
    
    RETURN v_is_valid;
END;
$$;