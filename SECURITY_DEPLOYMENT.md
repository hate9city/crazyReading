# 安全注册系统部署说明

## 概述

已为您的注册系统添加了多层安全防护机制，有效防止恶意注册攻击。

## 新增安全功能

### 1. IP地址限制机制
- **1分钟内**：同一IP最多尝试5次注册，超过则阻止1小时
- **15分钟内**：同一IP最多尝试10次注册，超过则阻止24小时
- **被阻止的IP**：无法进行注册操作

### 2. 邮箱域名白名单
- 只允许常用邮箱域名注册
- 默认包含：qq.com, 163.com, 126.com, gmail.com, outlook.com, hotmail.com, sina.com, sohu.com, foxmail.com, 139.com
- 管理员可通过数据库添加更多域名

### 3. 验证码系统
- 注册前必须验证邮箱
- 验证码有效期10分钟
- 每个验证码只能使用一次
- 自动清理过期验证码

### 4. 注册频率限制
- **同一邮箱**：24小时内最多注册3次
- **同一IP**：根据频率动态调整限制

### 5. 密码强度要求
- 至少8位字符
- 必须包含大小写字母
- 必须包含数字
- 必须包含特殊字符
- 禁止常见弱密码

### 6. 用户名格式验证
- 长度3-20位
- 可包含中文、字母、数字、下划线
- 不能全是数字

### 7. 安全日志记录
- 记录所有注册尝试
- 记录验证码发送
- 记录成功/失败的注册
- 包含IP地址和用户代理信息

## 部署步骤

### 1. 数据库设置

在 Supabase SQL Editor 中执行以下命令：

```sql
-- 执行安全设置脚本
-- 复制 security_setup.sql 文件的内容到 Supabase SQL Editor 中执行
```

### 2. 验证功能

1. **测试正常注册流程**：
   - 输入有效邮箱
   - 点击"发送验证码"
   - 输入验证码
   - 填写用户名和密码
   - 提交注册

2. **测试安全限制**：
   - 尝试使用同一邮箱多次注册
   - 尝试使用弱密码
   - 尝试使用无效用户名

### 3. 管理员监控

管理员可以通过以下方式监控注册活动：

```sql
-- 查看最近的注册尝试
SELECT * FROM security_logs 
WHERE action = 'registration_attempt' 
ORDER BY created_at DESC 
LIMIT 100;

-- 查看被阻止的IP
SELECT ip_address, COUNT(*) as block_count 
FROM registration_limits 
WHERE is_blocked = TRUE 
GROUP BY ip_address;

-- 查看验证码使用情况
SELECT email, code, is_used, expires_at 
FROM verification_codes 
ORDER BY created_at DESC 
LIMIT 50;
```

## 安全配置建议

### 1. 生产环境配置

```typescript
// 在生产环境中，应该从服务器端获取真实IP
// 修改 securityService.ts 中的 getClientIP 函数
const getClientIP = async (): Promise<string> => {
  // 生产环境中应该从服务器端获取
  // 使用代理服务器的真实IP头信息
  return '从服务器端获取的真实IP';
};
```

### 2. 邮箱服务配置

建议配置真实的邮箱服务来发送验证码：

1. **Supabase Email 配置**：
   - 在 Supabase 控制台中配置 SMTP 设置
   - 启用邮件发送功能

2. **第三方邮件服务**：
   - SendGrid
   - Mailgun
   - AWS SES

### 3. 监控和告警

建议设置以下监控：

```sql
-- 创建定期监控视图
CREATE VIEW registration_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN success = TRUE THEN 1 END) as successful_registrations,
  COUNT(CASE WHEN success = FALSE THEN 1 END) as failed_attempts
FROM security_logs 
WHERE action = 'registration_attempt'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 维护任务

### 1. 定期清理

```sql
-- 清理30天前的安全日志
DELETE FROM security_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 清理过期的注册限制记录
DELETE FROM registration_limits 
WHERE updated_at < NOW() - INTERVAL '7 days' AND is_blocked = FALSE;
```

### 2. 性能优化

```sql
-- 定期更新统计信息
ANALYZE security_logs;
ANALYZE registration_limits;
ANALYZE verification_codes;
```

## 故障排除

### 1. 常见问题

**问题**：用户无法收到验证码
**解决**：
- 检查 Supabase 邮件配置
- 验证邮箱域名是否在白名单中
- 检查邮件服务状态

**问题**：IP被误阻止
**解决**：
```sql
-- 手动解除IP阻止
UPDATE registration_limits 
SET is_blocked = FALSE, updated_at = NOW()
WHERE ip_address = '被阻止的IP地址';
```

**问题**：验证码过期
**解决**：
- 验证码有效期为10分钟
- 用户需要重新获取验证码

### 2. 调试模式

在开发环境中，可以启用调试模式：

```typescript
// 在 securityService.ts 中添加调试日志
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Security Event:', action, details);
}
```

## 总结

您的注册系统现在具备了企业级的安全防护能力：

✅ **多层安全防护**：IP限制、邮箱验证、域名白名单
✅ **智能频率控制**：动态调整注册限制
✅ **完整审计日志**：所有操作都有记录
✅ **用户友好**：清晰的错误提示和指导
✅ **可扩展性**：易于添加新的安全规则

这套系统能有效防止恶意注册，同时保证正常用户的注册体验。