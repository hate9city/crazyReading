# Supabase 设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - 组织名称：你的组织名
   - 项目名称：touch-read-app
   - 数据库密码：设置一个强密码
   - 地区：选择靠近用户的地区（如 East US (North Virginia) 或 Southeast Asia (Singapore)）

## 2. 获取项目配置

项目创建完成后，在项目设置中找到：
- **Project URL**：`https://your-project-id.supabase.co`
- **anon public key**：在 `Project API keys` 中的 `anon` `public` key

## 3. 创建数据库表

在 Supabase 的 SQL Editor 中执行以下 SQL：

```sql
-- 创建用户表
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, status)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', 'unknown'), 'pending');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建用户策略
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 创建管理员策略
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.email() = 'admin@example.com');

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (auth.email() = 'admin@example.com');

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
```

## 4. 配置环境变量

1. 复制 `.env.example` 文件为 `.env`：
```bash
cp .env.example .env
```

2. 在 `.env` 文件中填入你的 Supabase 配置：
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_ADMIN_EMAIL=admin@example.com
```

## 5. 创建管理员账户

1. 在 Supabase 控制台的 Authentication 页面
2. 点击 "Create user"
3. 输入管理员邮箱（如 `admin@example.com`）
4. 设置密码
5. 创建账户后，在 SQL Editor 中执行：
```sql
-- 手动创建管理员用户记录
INSERT INTO users (id, email, username, status)
SELECT id, email, 'admin', 'approved'
FROM auth.users 
WHERE email = 'admin@example.com';
```

## 6. 配置邮件设置（可选）

在 Supabase 控制台的 Authentication > Email Configuration 中配置邮件模板，以便在用户注册、批准等操作时发送通知。

## 7. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 在 Vercel 环境变量中设置：
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_ADMIN_EMAIL`

## 安全注意事项

- 定期更新 Supabase 项目密钥
- 监控用户活动和 API 使用情况
- 设置适当的密码策略
- 定期备份数据库
- 监控异常登录行为

## 故障排除

### 常见问题

1. **注册失败**：检查 Supabase 项目中的用户注册是否启用
2. **登录失败**：检查用户状态是否为 'approved'
3. **权限错误**：检查 RLS 策略是否正确配置
4. **CORS 错误**：检查 Supabase 项目中的 CORS 设置

### 调试方法

- 在浏览器开发者工具中查看网络请求
- 检查 Supabase 日志
- 验证环境变量是否正确设置