# 认知界 Cognition World - 重建说明书

  

> 本文档是一份极其详细的重建指南，可直接喂给另一个 AI（如 Cursor 或 Claude）用于完全复刻本项目。

  

---

  

## 【项目总纲】

  

**认知界（Cognition World）** 是一个极简、高 SEO、具备完整通讯功能的个人 MVP 产品。采用手机号认证机制，支持连续性日志系统，并内置 IP 黑名单安全防御。

  

**核心定位**：面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人。

  

**产品 Slogan**："无论你是谁，你值得被世界认知，被世界连接。"

  

---

  

## 【技术栈】

  

| 类别 | 技术 |

|------|------|

| 前端框架 | React 18 + TypeScript |

| 构建工具 | Webpack 5 + Babel |

| 样式方案 | Tailwind CSS 3.3.5 + 自定义 CSS Variables |

| 路由方案 | React Router DOM 6 (HashRouter 模式) |

| 动画库 | Framer Motion 11.16.1 |

| 图标库 | Lucide React 0.294.0 |

| 后端服务 | Meoo Cloud (Supabase) |

| 认证方案 | Supabase Auth (手机号虚拟邮箱) |

| 文件上传 | base64-arraybuffer (必须!) |

  

---

  

## 【页面结构】

  

### 1. 主页 (/)

  

**功能定位**：产品落地页，展示品牌价值和引导注册。

  

**核心元素**：

- **Hero Section**：全屏背景图（山水云雾图）+ 渐变遮罩

- **品牌标题**："认知界" 大标题 + 副标题 "让AI认识每一个具体的普通人"

- **阶段指示器**：胶囊样式，显示"当前阶段：开发阶段"，带琥珀色脉冲动画点

- **三大特性卡片**：

- 全球索引 (Globe icon)

- 透明优先 (Shield icon)

- SEO、GEO (Zap icon)

- **统计数据展示**：用户数、日志数、无限可能

- **引用区块**：品牌 Slogan 展示

- **导航栏**：固定顶部，毛玻璃效果，包含登录/注册按钮或个人中心入口

  

**SEO 结构化数据**：

- WebSite Schema

- Organization Schema

- WebPage Schema

  

**背景图处理**：

```css

backgroundImage: 山水云雾图URL

backgroundPosition: 'center bottom'

渐变遮罩: from-white/30 via-white/60 to-white

```

  

### 2. 用户页 (/:userId)

  

**功能定位**：动态路由，展示用户个人主页。

  

**路由逻辑**：

- 使用 `useParams` 获取 userId

- 自动转换为大写查询数据库

- 如果用户不存在或 isHidden=true，显示"页面不存在"

  

**页面结构**：

- **背景图区域**：顶部 50vh 高度，用户自定义背景或默认银河图

- **渐变过渡**：从透明到白色的渐变遮罩

- **导航栏**：返回首页按钮 + GM 设置按钮（仅管理员可见）+ 分享按钮

- **个人资料卡片**：

- 头像：深色背景圆角方块，显示用户名首字母

- 用户名：2xl 字号，semibold

- 身份标签：灰色小字

- 个人 Slogan：可选显示

- **信息卡片**（glass-card 样式）：

- 位置信息（MapPin icon）

- 加入时间（Calendar icon）

- 公开/私密状态（Eye/EyeOff icon）

- **认知日志发布**（仅管理员）：文本域 + 发布按钮

- **认知日志列表**：时间倒序排列，每条日志显示发布时间和内容

- **页脚**："时空锚点 · 日期 · 位置"

  

**SEO 结构化数据**：

- ProfilePage Schema

- Person Schema

- BlogPosting Schema（日志）

- KnowledgeGraph Data

  

### 3. 注册页 (/register)

  

**表单字段**（全部必填）：

1. **手机号** - 虚拟邮箱生成基础

2. **密码** - 至少6位，带显示/隐藏切换

3. **确认密码** - 二次验证

4. **用户名** - 将作为 URL 后缀，生成 UserId

5. **身份标签** - 职业/身份描述

6. **个人 Slogan** - 选填，影响 SEO

7. **所在地** - 地理位置

8. **公开收录** - Checkbox，控制搜索引擎收录

  

**UserId 生成规则**：

```typescript

generateUserId(username: string): string {

return username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'USER';

}

```

  

**注册流程**：

1. 前端验证密码一致性

2. 调用 `registerWithPhone(phone, password, metadata)`

3. 虚拟邮箱格式：`${phone.replace(/\D/g, '')}@phone.local`

4. 成功后跳转到登录页

  

### 4. 登录页 (/login)

  

**表单字段**：

- 手机号

- 密码（带显示/隐藏切换）

  

**登录流程**：

1. 生成虚拟邮箱

2. 调用 `loginWithPhone(phone, password)`

3. 成功后跳转到 `/me`

  

### 5. 个人中心页 (/me)

  

**功能定位**：已登录用户的个人管理页面。

  

**核心功能**：

- 展示个人资料（同用户页）

- **编辑资料**：展开/收起面板，可修改标签、Slogan、位置

- **背景图设置**：

- 上传背景图（JPG/PNG，最大5MB）

- 图片列表展示（网格布局）

- 状态标签：已通过/审核中/已拒绝

- 设为当前背景 / 删除

- **发布认知日志**：同用户页

- **退出登录**：清除 session

  

### 6. 编辑页 (/edit) - 遗留页面

  

**Token 验证机制**：

- 输入 UserId + 16位 Edit Token

- 验证成功后显示编辑表单

- 可修改：标签、Slogan、位置

  

---

  

## 【核心功能逻辑】

  

### 1. 认证系统

  

**手机号认证流程**：

```typescript

// 注册

const email = generateVirtualEmail(phone); // 手机号@phone.local

await supabase.auth.signUp({ email, password, options: { data: metadata } });

  

// 登录

await supabase.auth.signInWithPassword({ email, password });

```

  

**Session 管理**：

- 使用 Supabase 自动 session 持久化

- `getCurrentSession()` 获取当前会话

- `logout()` 清除会话

  

### 2. 数据库 Schema

  

**users 表**（通过 profiles 表关联 auth.users）：

```sql

- id: UUID PRIMARY KEY (关联 auth.users)

- username: TEXT NOT NULL

- user_id: TEXT UNIQUE NOT NULL (大写URL标识)

- tag: TEXT NOT NULL

- slogan: TEXT

- location: TEXT NOT NULL

- is_public: BOOLEAN DEFAULT true

- is_hidden: BOOLEAN DEFAULT false

- is_admin: BOOLEAN DEFAULT false

- created_at: TIMESTAMP DEFAULT NOW()

```

  

**logs 表**：

```sql

- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()

- user_id: TEXT NOT NULL REFERENCES users(user_id)

- content: TEXT NOT NULL

- created_at: TIMESTAMP DEFAULT NOW()

```

  

**edit_tokens 表**（遗留）：

```sql

- id: UUID PRIMARY KEY

- user_id: TEXT NOT NULL

- token: TEXT NOT NULL (16位随机字符串)

- created_at: TIMESTAMP DEFAULT NOW()

```

  

**ip_blacklist 表**：

```sql

- id: UUID PRIMARY KEY

- cidr: TEXT NOT NULL (CIDR格式，如 "192.168.1.0/24")

- description: TEXT

- created_at: TIMESTAMP DEFAULT NOW()

```

  

**background_images 表**：

```sql

- id: UUID PRIMARY KEY

- user_id: TEXT NOT NULL

- url: TEXT NOT NULL

- status: TEXT DEFAULT 'pending' (pending/approved/rejected)

- is_active: BOOLEAN DEFAULT false

- created_at: TIMESTAMP DEFAULT NOW()

```

  

### 3. IP 黑名单防御

  

**CIDR 匹配算法**：

```typescript

function isIPInCIDR(ip: string, cidr: string): boolean {

const [cidrIP, prefix] = cidr.split('/');

const prefixLen = parseInt(prefix, 10);

const ipParts = ip.split('.').map(Number);

const cidrParts = cidrIP.split('.').map(Number);

const ipBinary = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

const cidrBinary = (cidrParts[0] << 24) | (cidrParts[1] << 16) | (cidrParts[2] << 8) | cidrParts[3];

const mask = -1 << (32 - prefixLen);

return (ipBinary & mask) === (cidrBinary & mask);

}

```

  

**拦截流程**：

1. 获取访问者 IP（通过 ipify API）

2. 查询 ip_blacklist 表

3. 如果匹配，显示拦截页面

  

### 4. 管理员权限

  

**管理员 ID 列表**：

```typescript

const ADMIN_IDS = ['ONE', 'YIYAN', 'ADMIN'];

  

function isAdmin(userId: string): boolean {

return ADMIN_IDS.includes(userId.toUpperCase());

}

```

  

**管理员特权**：

- 在用户页显示"GM"标识

- 可编辑 Slogan 和隐藏状态

- 可发布认知日志

  

### 5. 文件上传（背景图）

  

**必须使用 ArrayBuffer**：

```typescript

import { decode } from 'base64-arraybuffer';

  

const reader = new FileReader();

reader.onload = async (e) => {

const base64 = (e.target?.result as string).split(',')[1];

await supabase.storage

.from('backgrounds')

.upload(fileName, decode(base64), { contentType: file.type });

};

reader.readAsDataURL(file);

```

  

---

  

## 【UI/UX 细节】

  

### 1. 配色方案

  

**CSS Variables**（在 index.css 中定义）：

```css

:root {

--bg-primary: #ffffff;

--bg-secondary: #fafafa;

--bg-tertiary: #f5f5f5;

--text-primary: #1a1a1a;

--text-secondary: #6b7280;

--text-tertiary: #9ca3af;

--border-subtle: rgba(0, 0, 0, 0.06);

--border-light: rgba(0, 0, 0, 0.08);

--accent: #1a1a1a;

--accent-hover: #333333;

--glass-bg: rgba(255, 255, 255, 0.72);

--glass-border: rgba(255, 255, 255, 0.5);

}

```

  

**主色调**：深邃黑 #1a1a1a

**背景色**：纯白 #ffffff / 浅灰 #fafafa

**文字层级**：主文字 #1a1a1a / 次级 #6b7280 / 三级 #9ca3af

  

### 2. 字体栈

  

```css

font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;

```

  

### 3. 毛玻璃效果

  

**导航栏毛玻璃**：

```css

.glass {

background: rgba(255, 255, 255, 0.72);

backdrop-filter: blur(20px) saturate(180%);

-webkit-backdrop-filter: blur(20px) saturate(180%);

border: 1px solid rgba(255, 255, 255, 0.5);

}

```

  

**卡片毛玻璃**：

```css

.glass-card {

background: rgba(255, 255, 255, 0.6);

backdrop-filter: blur(16px) saturate(150%);

-webkit-backdrop-filter: blur(16px) saturate(150%);

border: 1px solid rgba(0, 0, 0, 0.06);

box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

}

```

  

### 4. 动画规范

  

**Framer Motion 标准动画**：

```typescript

// 页面入场

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}

  

// 交错动画

transition={{ duration: 0.5, delay: index * 0.1 }}

  

// 按钮悬停

whileHover={{ scale: 1.02 }}

whileTap={{ scale: 0.98 }}

```

  

### 5. 圆角规范

  

```css

--radius-sm: 8px;

--radius-md: 12px;

--radius-lg: 16px;

--radius-xl: 24px;

```

  

### 6. 阴影规范

  

```css

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);

--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);

--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.08);

```

  

### 7. 时空锚点（页脚）

  

固定格式：

```

时空锚点 · 2026-04-26 · 北京市延庆区

```

  

---

  

## 【SEO 实现细节】

  

### 1. SEOHead 组件

  

动态注入 meta 标签和 JSON-LD：

- title、description、keywords

- Open Graph 标签

- Twitter Card 标签

- Schema.org 结构化数据

  

### 2. 结构化数据类型

  

**WebSite**：

```json

{

"@type": "WebSite",

"name": "认知界",

"url": "https://cognition.world",

"potentialAction": {

"@type": "SearchAction",

"target": "https://cognition.world/search?q={search_term_string}"

}

}

```

  

**Person**（用户页）：

```json

{

"@type": "Person",

"name": username,

"alternateName": userId,

"jobTitle": tag,

"description": slogan,

"url": "https://cognition.world/#/{userId}"

}

```

  

**BlogPosting**（日志）：

```json

{

"@type": "BlogPosting",

"headline": content.slice(0, 60),

"articleBody": content,

"author": { "@type": "Person", "name": username },

"datePublished": createdAt

}

```

  

---

  

## 【项目文件结构】

  

```

/home/project/

├── src/

│ ├── App.tsx # 路由配置

│ ├── index.tsx # 入口文件

│ ├── pages/

│ │ ├── IndexPage.tsx # 主页

│ │ ├── UserPage.tsx # 用户页

│ │ ├── RegisterPage.tsx # 注册页

│ │ ├── LoginPage.tsx # 登录页

│ │ ├── MePage.tsx # 个人中心

│ │ └── EditPage.tsx # 编辑页（遗留）

│ ├── components/

│ │ └── SEOHead.tsx # SEO 组件

│ ├── utils/

│ │ ├── auth.ts # 认证工具

│ │ └── storage.ts # 数据存储

│ ├── types/

│ │ ├── index.ts # 类型定义

│ │ └── user.ts # 用户类型

│ ├── supabase/

│ │ ├── client.ts # Supabase 客户端（自动生成）

│ │ └── types.ts # 数据库类型（自动生成）

│ ├── styles/

│ │ └── index.css # 全局样式

│ └── config/

│ └── index.ts # 配置文件

├── package.json

├── webpack.config.js

├── tailwind.config.js

├── postcss.config.js

├── tsconfig.json

└── index.html

```

  

---

  

## 【关键实现注意事项】

  

1. **必须使用 HashRouter**：`/#/userId` 格式

2. **文件上传必须使用 base64-arraybuffer**：直接使用 File/Blob 会导致 400 错误

3. **Supabase 客户端文件不可修改**：由系统自动生成

4. **IP 黑名单检查**：每次访问用户页时进行

5. **背景图状态管理**：pending/approved/rejected，只有 approved 且 is_active 才显示

6. **UserId 自动大写**：所有查询和显示都转换为大写

  

---

  

## 【重建命令】

  

```bash

# 安装依赖

pnpm install

  

# 开发模式

pnpm dev

  

# 生产构建

pnpm build

```

  

---

  

## 【环境变量与密钥】

  

### 1. 前端环境变量

  

本项目使用 **Meoo Cloud (Supabase)** 作为后端服务，环境变量已硬编码在配置文件中，无需额外的 .env 文件。

  

**Supabase 配置位置**：`src/config/index.ts` 和 `src/supabase/client.ts`

  

```typescript

// src/config/index.ts

export const CONFIG = {

supabase: {

url: typeof window !== 'undefined'

? `${(window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin}/sb-api`

: 'http://localhost:54321',

anonKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc3MTMxNjU0LCJleHAiOjEzMjg3NzcxNjU0fQ.zXlZ6tduNFDLnZYknEtpmx6Gl79_d-TLGlrvlHTxM9Y'

},

app: {

name: '认知界',

nameEn: 'Cognition World',

version: '1.0.0',

geoAnchor: 'Beijing, CN',

timeAnchor: '2026.04.26'

},

security: {

defaultBlacklist: [

'103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',

'104.16.0.0/13', '104.24.0.0/14', '108.162.192.0/18',

'131.0.72.0/22', '141.101.64.0/18', '162.158.0.0/15',

'172.64.0.0/13', '173.245.48.0/20', '188.114.96.0/20',

'190.93.240.0/20', '197.234.240.0/22', '198.41.128.0/17'

]

}

};

```

  

**重要说明**：

- `anonKey` 是 Supabase 匿名密钥，已在代码中硬编码

- 在 Meoo Cloud 环境中，Supabase URL 通过 `window.MEOO_CONFIG.meoo_app_access_url` 动态获取

- 本地开发时回退到 `location.origin`

  

### 2. 第三方服务配置

  

**IP 查询服务**（用于黑名单检测）：

```typescript

// 获取访问者 IP

const ip = await fetch('https://api.ipify.org?format=json')

.then(r => r.json())

.then(d => d.ip)

.catch(() => '');

```

  

**背景图存储**：使用 Supabase Storage，无需额外配置。

  

---

  

## 【数据库迁移方案】

  

### 1. 完整表结构（Schema）

  

#### profiles 表（关联 auth.users）

  

```sql

CREATE TABLE public.profiles (

id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

username TEXT NOT NULL,

user_id TEXT UNIQUE NOT NULL,

tag TEXT NOT NULL,

slogan TEXT,

location TEXT NOT NULL,

is_public BOOLEAN DEFAULT true,

is_hidden BOOLEAN DEFAULT false,

is_admin BOOLEAN DEFAULT false,

created_at TIMESTAMP DEFAULT NOW(),

updated_at TIMESTAMP DEFAULT NOW()

);

  

-- 创建索引

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

CREATE INDEX idx_profiles_username ON public.profiles(username);

```

  

#### logs 表（认知日志）

  

```sql

CREATE TABLE public.logs (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

content TEXT NOT NULL,

created_at TIMESTAMP DEFAULT NOW()

);

  

-- 创建索引

CREATE INDEX idx_logs_user_id ON public.logs(user_id);

CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);

```

  

#### edit_tokens 表（编辑令牌 - 遗留）

  

```sql

CREATE TABLE public.edit_tokens (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id TEXT NOT NULL,

token TEXT NOT NULL,

created_at TIMESTAMP DEFAULT NOW()

);

  

CREATE INDEX idx_edit_tokens_user_id ON public.edit_tokens(user_id);

CREATE INDEX idx_edit_tokens_token ON public.edit_tokens(token);

```

  

#### ip_blacklist 表（IP 黑名单）

  

```sql

CREATE TABLE public.ip_blacklist (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

cidr TEXT NOT NULL,

description TEXT,

created_at TIMESTAMP DEFAULT NOW()

);

  

CREATE INDEX idx_ip_blacklist_cidr ON public.ip_blacklist(cidr);

```

  

#### background_images 表（背景图）

  

```sql

CREATE TABLE public.background_images (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

url TEXT NOT NULL,

status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

is_active BOOLEAN DEFAULT false,

created_at TIMESTAMP DEFAULT NOW()

);

  

CREATE INDEX idx_background_images_user_id ON public.background_images(user_id);

CREATE INDEX idx_background_images_status ON public.background_images(status);

```

  

#### Storage Bucket（背景图存储）

  

```sql

-- 创建 backgrounds 存储桶

INSERT INTO storage.buckets (id, name, public)

VALUES ('backgrounds', 'backgrounds', true);

```

  

### 2. 初始数据（Seed Data）

  

#### 插入默认 IP 黑名单

  

```sql

INSERT INTO public.ip_blacklist (cidr, description) VALUES

('103.21.244.0/22', 'Cloudflare IP Range'),

('103.22.200.0/22', 'Cloudflare IP Range'),

('103.31.4.0/22', 'Cloudflare IP Range'),

('104.16.0.0/13', 'Cloudflare IP Range'),

('104.24.0.0/14', 'Cloudflare IP Range'),

('108.162.192.0/18', 'Cloudflare IP Range'),

('131.0.72.0/22', 'Cloudflare IP Range'),

('141.101.64.0/18', 'Cloudflare IP Range'),

('162.158.0.0/15', 'Cloudflare IP Range'),

('172.64.0.0/13', 'Cloudflare IP Range'),

('173.245.48.0/20', 'Cloudflare IP Range'),

('188.114.96.0/20', 'Cloudflare IP Range'),

('190.93.240.0/20', 'Cloudflare IP Range'),

('197.234.240.0/22', 'Cloudflare IP Range'),

('198.41.128.0/17', 'Cloudflare IP Range');

```

  

#### 创建管理员账号（通过 SQL）

  

```sql

-- 创建管理员 auth 用户

INSERT INTO auth.users (

instance_id, id, aud, role, email,

encrypted_password, email_confirmed_at,

created_at, updated_at,

confirmation_token, recovery_token,

email_change_token_new, email_change,

raw_app_meta_data, raw_user_meta_data,

is_super_admin

) VALUES (

'00000000-0000-0000-0000-000000000000',

gen_random_uuid(),

'authenticated',

'authenticated',

'13800138000@phone.local',

crypt('admin123', gen_salt('bf')),

NOW(),

NOW(),

NOW(),

'',

'',

'',

'',

'{"provider":"email","providers":["email"]}'::jsonb,

'{"username":"一言超人","user_id":"ONE","tag":"认知界创始人","slogan":"致力于构建全球开放的个人黄页索引","location":"北京市延庆区","phone":"13800138000"}'::jsonb,

false

);

  

-- 创建管理员 profile（需要在 auth 用户创建后执行）

-- 注意：实际项目中通过 trigger 自动创建

```

  

### 3. RLS（行级安全策略）

  

#### profiles 表 RLS

  

```sql

-- 启用 RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  

-- 所有人可查看公开资料

CREATE POLICY "所有人可查看公开资料" ON public.profiles

FOR SELECT USING (is_public = true AND is_hidden = false);

  

-- 用户可查看自己的资料

CREATE POLICY "用户可查看自己的资料" ON public.profiles

FOR SELECT USING (auth.uid() = id);

  

-- 用户可更新自己的资料

CREATE POLICY "用户可更新自己的资料" ON public.profiles

FOR UPDATE USING (auth.uid() = id);

  

-- 管理员可查看所有资料

CREATE POLICY "管理员可查看所有资料" ON public.profiles

FOR ALL USING (

EXISTS (

SELECT 1 FROM public.profiles

WHERE id = auth.uid() AND is_admin = true

)

);

```

  

#### logs 表 RLS

  

```sql

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

  

-- 所有人可查看公开用户的日志

CREATE POLICY "所有人可查看公开用户日志" ON public.logs

FOR SELECT USING (

EXISTS (

SELECT 1 FROM public.profiles

WHERE user_id = logs.user_id AND is_public = true AND is_hidden = false

)

);

  

-- 用户可查看自己的日志

CREATE POLICY "用户可查看自己的日志" ON public.logs

FOR SELECT USING (

EXISTS (

SELECT 1 FROM public.profiles

WHERE id = auth.uid() AND user_id = logs.user_id

)

);

  

-- 用户可创建自己的日志

CREATE POLICY "用户可创建自己的日志" ON public.logs

FOR INSERT WITH CHECK (

EXISTS (

SELECT 1 FROM public.profiles

WHERE id = auth.uid() AND user_id = logs.user_id

)

);

```

  

#### background_images 表 RLS

  

```sql

ALTER TABLE public.background_images ENABLE ROW LEVEL SECURITY;

  

-- 所有人可查看已审核通过的背景图

CREATE POLICY "所有人可查看已审核背景图" ON public.background_images

FOR SELECT USING (status = 'approved');

  

-- 用户可管理自己的背景图

CREATE POLICY "用户可管理自己的背景图" ON public.background_images

FOR ALL USING (

EXISTS (

SELECT 1 FROM public.profiles

WHERE id = auth.uid() AND user_id = background_images.user_id

)

);

```

  

#### Storage RLS（背景图存储）

  

```sql

-- 允许所有人查看 backgrounds 桶中的文件

CREATE POLICY "允许查看背景图" ON storage.objects

FOR SELECT USING (bucket_id = 'backgrounds');

  

-- 允许认证用户上传背景图

CREATE POLICY "允许上传背景图" ON storage.objects

FOR INSERT WITH CHECK (

bucket_id = 'backgrounds' AND

auth.role() = 'authenticated'

);

  

-- 允许用户删除自己的文件

CREATE POLICY "允许删除自己的背景图" ON storage.objects

FOR DELETE USING (

bucket_id = 'backgrounds' AND

auth.uid()::text = (storage.foldername(name))[1]

);

```

  

---

  

## 【特殊的构建配置】

  

### 1. Webpack 配置详解

  

**文件位置**：`webpack.config.js`

  

```javascript

const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

  

module.exports = (env, argv) => {

const isDev = argv.mode !== 'production';

  

return {

mode: isDev ? 'development' : 'production',

entry: './src/index.tsx',

output: {

path: path.resolve(__dirname, 'dist'),

filename: 'bundle.js',

publicPath: 'auto'

},

module: {

rules: [

// 处理 .mjs 文件（重要！）

{

test: /\.mjs$/,

include: /node_modules/,

type: 'javascript/auto',

resolve: {

fullySpecified: false,

},

},

// 处理 TS/TSX/JS/JSX

{

test: /\.(ts|tsx|js|jsx)$/,

exclude: /node_modules/,

use: {

loader: 'babel-loader',

options: {

presets: [

['@babel/preset-react', { runtime: 'automatic', development: isDev }],

'@babel/preset-env',

'@babel/preset-typescript'

]

}

}

},

// 处理 CSS（包括 Tailwind）

{

test: /\.css$/,

use: ['style-loader', 'css-loader', 'postcss-loader']

},

// 处理图片资源

{

test: /\.(png|jpe?g|gif|webp|ico|svg)$/i,

type: 'asset',

parser: { dataUrlCondition: { maxSize: 8 * 1024 } }

},

// 处理字体

{

test: /\.(woff2?|eot|ttf|otf)$/i,

type: 'asset/resource'

},

// 兜底规则：其他文件输出为独立资源

{

exclude: /\.(js|jsx|ts|tsx|mjs|css|json|html)$/i,

type: 'asset/resource'

}

]

},

resolve: {

extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx']

},

devServer: {

port: 3266,

allowedHosts: 'all',

historyApiFallback: {

index: '/index.html',

rewrites: [

{ from: /^\/_p\/\d+\//, to: '/index.html' }

]

}

},

plugins: [

new HtmlWebpackPlugin({

template: './index.html',

inject: 'body'

})

]

};

};

```

  

**关键配置说明**：

- `.mjs` 文件处理规则必须放在最前面

- `historyApiFallback` 支持 HashRouter 模式

- `allowedHosts: 'all'` 允许所有 host 访问

- `inject: 'body'` 将 bundle 注入到 body 底部

  

### 2. PostCSS 配置

  

**文件位置**：`postcss.config.js`

  

```javascript

module.exports = {

plugins: {

tailwindcss: {},

autoprefixer: {}

}

};

```

  

### 3. TypeScript 配置

  

**文件位置**：`tsconfig.json`

  

```json

{

"compilerOptions": {

"target": "ES2020",

"lib": ["ES2020", "DOM", "DOM.Iterable"],

"jsx": "react-jsx",

"module": "ESNext",

"moduleResolution": "bundler",

"resolveJsonModule": true,

"allowJs": true,

"checkJs": false,

"declaration": true,

"declarationMap": true,

"sourceMap": true,

"outDir": "./dist",

"removeComments": true,

"esModuleInterop": true,

"forceConsistentCasingInFileNames": true,

"strict": true,

"noUnusedLocals": true,

"noUnusedParameters": true,

"noImplicitReturns": true,

"noFallthroughCasesInSwitch": true,

"skipLibCheck": true

},

"include": ["src/**/*"],

"exclude": ["node_modules", "dist"]

}

```

  

---

  

## 【未写入代码的业务规则】

  

### 1. 管理员权限逻辑（User ID = ONE）

  

**管理员 ID 列表**：`['ONE', 'YIYAN', 'ADMIN']`

  

**权限判断函数**：

```typescript

// src/types/index.ts

export const ADMIN_IDS = ['ONE', 'YIYAN', 'ADMIN'];

  

export function isAdmin(userId: string): boolean {

return ADMIN_IDS.includes(userId.toUpperCase());

}

```

  

**管理员特权**：

1. **GM 标识显示**：在用户页导航栏显示"GM"标签

2. **编辑权限**：可修改任意用户的 Slogan 和隐藏状态

3. **日志发布**：可在任意用户页面发布认知日志

4. **查看隐藏用户**：可访问 is_hidden=true 的用户页面

  

**实现位置**：

- `src/pages/UserPage.tsx`：第 44-47 行，检查当前用户是否为管理员

- `src/pages/UserPage.tsx`：第 197-207 行，显示 GM 设置按钮

  

### 2. IP 黑名单自动检测与拦截逻辑

  

**检测流程**：

```typescript

// src/pages/UserPage.tsx

useEffect(() => {

const init = async () => {

// 1. 获取访问者 IP

const ip = await fetch('https://api.ipify.org?format=json')

.then(r => r.json())

.then(d => d.ip)

.catch(() => '');

  

// 2. 检查 IP 是否在黑名单

const blocked = await checkIPBlocked(ip);

setIsBlocked(blocked);

  

// 3. 如果被拦截，显示拦截页面

if (blocked) {

// 渲染拦截页面

}

};

init();

}, [userId]);

```

  

**CIDR 匹配算法**：

```typescript

// src/types/index.ts

export function isIPInCIDR(ip: string, cidr: string): boolean {

const [cidrIP, prefix] = cidr.split('/');

const prefixLen = parseInt(prefix, 10);

  

const ipParts = ip.split('.').map(Number);

const cidrParts = cidrIP.split('.').map(Number);

  

const ipBinary = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

const cidrBinary = (cidrParts[0] << 24) | (cidrParts[1] << 16) | (cidrParts[2] << 8) | cidrParts[3];

  

const mask = -1 << (32 - prefixLen);

  

return (ipBinary & mask) === (cidrBinary & mask);

}

```

  

**拦截页面样式**：

- 背景色：`#0a0a0a`（深色）

- 警告图标：`AlertTriangle`，白色 40% 透明度

- 标题："访问受限"

- 副标题："您的IP地址已被列入黑名单"

- 返回按钮：白色 10% 透明度背景

  

### 3. 背景图审核状态流转逻辑

  

**状态定义**：

- `pending`：待审核（上传后默认状态）

- `approved`：已通过（可设为当前背景）

- `rejected`：已拒绝（不可使用）

  

**状态流转图**：

```

上传图片 → pending → 管理员审核 → approved/rejected

↓

用户可设为当前背景（仅 approved）

```

  

**前端展示逻辑**：

```typescript

// src/pages/MePage.tsx

const getStatusIcon = (status: string) => {

switch (status) {

case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;

case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;

case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;

}

};

  

const getStatusText = (status: string) => {

switch (status) {

case 'approved': return '已通过';

case 'pending': return '审核中';

case 'rejected': return '已拒绝';

}

};

```

  

**激活逻辑**：

```typescript

// src/utils/storage.ts

export async function setActiveBackgroundImage(userId: string, imageId: string): Promise<boolean> {

// 1. 先将该用户所有背景图设为非激活

await supabase

.from('background_images')

.update({ is_active: false })

.eq('user_id', userId);

  

// 2. 将指定图片设为激活

await supabase

.from('background_images')

.update({ is_active: true })

.eq('id', imageId)

.eq('user_id', userId);

  

return true;

}

```

  

**用户页背景图加载逻辑**：

```typescript

// src/pages/UserPage.tsx

const bgImage = await getActiveBackgroundImage(foundUser.id);

if (bgImage) {

setActiveBackground(bgImage.url);

}

  

// 背景图样式

<div

className="absolute top-0 left-0 right-0 h-[50vh] bg-cover bg-center bg-no-repeat"

style={{

backgroundImage: activeBackground

? `url('${activeBackground}')`

: `url('默认银河图URL')`,

backgroundPosition: 'center top'

}}

/>

```

  

---

  

## 【部署与运维】

  

### 1. Meoo Cloud 部署

  

**自动配置**：

- Supabase URL 和 Anon Key 已硬编码

- 无需手动设置环境变量

- 构建命令：`pnpm build`

- 输出目录：`dist`

  

**数据库迁移**：

使用 `CloudApplyMigration` 工具执行 SQL 迁移，详见上方【数据库迁移方案】章节。

  

### 2. Vercel 部署

  

**配置步骤**：

1. 连接 GitHub 仓库到 Vercel

2. 设置构建命令：`pnpm build`

3. 设置输出目录：`dist`

4. 无需额外环境变量（已硬编码）

  

**vercel.json**（可选）：

```json

{

"rewrites": [

{ "source": "/(.*)", "destination": "/index.html" }

]

}

```

  

### 3. Netlify 部署

  

**配置步骤**：

1. 连接 GitHub 仓库到 Netlify

2. 设置构建命令：`pnpm build`

3. 设置发布目录：`dist`

  

**_redirects 文件**：

```

/* /index.html 200

```

  

### 4. 静态托管部署

  

**构建流程**：

```bash

# 1. 安装依赖

pnpm install

  

# 2. 构建生产版本

pnpm build

  

# 3. 输出目录 dist 包含所有静态文件

# - index.html

# - bundle.js

# - 其他资源文件

```

  

**部署检查清单**：

- [ ] 确认 `dist/index.html` 存在

- [ ] 确认 `dist/bundle.js` 存在

- [ ] 确认所有图片资源已正确打包

- [ ] 测试 HashRouter 路由是否正常（如 `/#/ONE`）

- [ ] 测试 Supabase 连接是否正常

  

### 5. 运维监控

  

**关键指标**：

- 用户注册数

- 日志发布数

- 背景图上传数

- IP 黑名单拦截次数

  

**日志查询**：

```sql

-- 查看用户增长

SELECT DATE(created_at) as date, COUNT(*) as count

FROM public.profiles

GROUP BY DATE(created_at)

ORDER BY date DESC;

  

-- 查看日志发布情况

SELECT user_id, COUNT(*) as log_count

FROM public.logs

GROUP BY user_id

ORDER BY log_count DESC;

  

-- 查看待审核背景图

SELECT * FROM public.background_images

WHERE status = 'pending';

```

  

---

  

## 【重建命令速查】

  

```bash

# 1. 克隆项目后安装依赖

pnpm install

  

# 2. 启动开发服务器

pnpm dev

  

# 3. 构建生产版本

pnpm build

  

# 4. 类型检查

pnpm typecheck

```

  

---

  

*本文档生成于 2026-05-02，包含认知界项目的完整技术细节和运维指南。*