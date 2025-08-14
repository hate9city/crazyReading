# Netlify 部署指南

## 🚀 部署步骤

### 1. 准备工作

确保您的代码已经推送到 GitHub 仓库，并且所有依赖都已安装。

### 2. 连接 Netlify

#### 方法一：通过 GitHub 连接（推荐）

1. **登录 Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 使用 GitHub 账户登录

2. **创建新站点**
   - 点击 "New site from Git"
   - 选择 "GitHub" 作为提供者
   - 授权 Netlify 访问您的 GitHub 仓库

3. **选择仓库**
   - 找到您的项目仓库
   - 点击选择

4. **配置构建设置**
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: `20` 或更高

5. **环境变量设置**
   - 在 "Environment variables" 部分添加：
   ```
   REACT_APP_SUPABASE_URL = 您的 Supabase 项目 URL
   REACT_APP_SUPABASE_ANON_KEY = 您的 Supabase 匿名密钥
   REACT_APP_ADMIN_EMAIL = 您的管理员邮箱
   ```

6. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

#### 方法二：通过拖拽部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **压缩构建文件**
   ```bash
   cd build
   zip -r ../build.zip .
   ```

3. **上传到 Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽 `build.zip` 文件到部署区域

### 3. 环境变量配置

在 Netlify 控制台中设置以下环境变量：

1. **进入站点设置**
   - 点击您的站点
   - 选择 "Site settings"
   - 选择 "Environment variables"

2. **添加变量**
   ```
   REACT_APP_SUPABASE_URL = https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   REACT_APP_ADMIN_EMAIL = admin@yourdomain.com
   ```

### 4. 自定义域名（可选）

1. **进入域名设置**
   - Site settings → Domain management

2. **添加自定义域名**
   - 输入您的域名
   - 按照 Netlify 的说明配置 DNS

### 5. 启用 HTTPS（推荐）

Netlify 默认为所有站点提供 HTTPS，无需额外配置。

## 📋 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] package.json 中的构建命令正确
- [ ] netlify.toml 配置文件已创建
- [ ] 环境变量已正确设置
- [ ] 音频文件 (.mp3) 在 public/books 目录中
- [ ] PDF 文件在 public 目录中
- [ ] 构建成功且无错误

## 🔧 故障排除

### 构建失败

1. **检查 Node.js 版本**
   - 确保 Node.js 版本 >= 20
   - 在 netlify.toml 中指定版本

2. **检查依赖**
   - 确保 package.json 中的所有依赖都正确
   - 删除 node_modules 并重新安装

3. **检查环境变量**
   - 确保所有必需的环境变量都已设置
   - 检查变量名称是否正确

### 路由问题

如果刷新页面后出现 404 错误：

1. **检查 netlify.toml**
   - 确保包含重定向规则：
   ```toml
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

### 静态资源问题

如果音频文件或图片无法加载：

1. **检查文件路径**
   - 确保文件在正确的目录中
   - 检查文件名大小写

2. **检查缓存设置**
   - 确保 netlify.toml 中包含正确的缓存头

## 🌐 部署后的测试

1. **测试基本功能**
   - 访问首页
   - 测试登录/注册
   - 测试书架功能

2. **测试音频功能**
   - 播放音频文件
   - 检查音频控制

3. **测试 PDF 功能**
   - 打开 PDF 文件
   - 测试翻页功能

4. **测试响应式设计**
   - 在不同设备上测试
   - 检查移动端适配

## 📊 监控和分析

Netlify 提供内置的分析功能：

1. **访问分析**
   - Site settings → Analytics
   - 查看访问量和用户行为

2. **构建日志**
   - 查看构建历史
   - 监控构建失败

3. **表单提交**
   - 如果有联系表单，可以查看提交记录

## 🔄 持续部署

设置 GitHub 集成后，每次推送到主分支都会自动部署：

1. **推送更改**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **自动部署**
   - Netlify 会自动检测更改
   - 开始构建和部署过程

## 💡 最佳实践

1. **使用分支部署**
   - 为功能开发创建分支
   - 在合并前预览更改

2. **优化构建速度**
   - 使用缓存
   - 优化依赖

3. **安全性**
   - 定期更新依赖
   - 使用 HTTPS
   - 设置适当的安全头

4. **性能优化**
   - 压缩资源
   - 使用 CDN
   - 优化图片

完成这些步骤后，您的应用将成功部署到 Netlify 并可供全球用户访问！