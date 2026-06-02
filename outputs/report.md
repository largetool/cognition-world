# SEOHead 运行时异常修复报告

## 1. 复现与记录现象

### 1.1 错误现象
- **错误类型**: 运行时异常 `Cannot read properties of undefined (reading 'title')`
- **触发场景**: 登录后页面跳转至 `/me` 时出现暗红错误页
- **根因定位**: `SEOHead` 组件在 `data` 参数为 `undefined` 或 `data.title` 不存在时直接访问导致崩溃

### 1.2 错误堆栈（脱敏）
```
TypeError: Cannot read properties of undefined (reading 'title')
    at SEOHead (SEOHead.tsx:11:)
    at renderWithHooks (react-dom.development.js:)
    at mountIndeterminateComponent (react-dom.development.js:)
```

### 1.3 触发条件
1. 用户登录成功
2. 页面导航至 `/me`
3. `MePage` 组件在 `profile` 数据未完全加载时渲染 `SEOHead`
4. `SEOHead` 接收到的 `data` 为 `undefined` 或字段不完整

---

## 2. 紧急降级修复

### 2.1 修复策略
采用"防御性编程"策略，在 `SEOHead` 组件中添加多层安全降级：

1. **参数可选化**: `data` 参数改为可选 (`data?: SEOData`)
2. **安全访问**: 使用可选链操作符 (`?.`) 访问所有字段
3. **默认值兜底**: 为所有字段提供合理的默认值
4. **异常捕获**: 使用 `try-catch` 包裹整个 effect 逻辑

### 2.2 修改文件

#### src/components/SEOHead.tsx
```typescript
// 关键改动：
// 1. data 改为可选参数
interface SEOHeadProps {
  data?: SEOData;
  jsonLd?: object | object[];
}

// 2. 添加默认值常量
const DEFAULT_TITLE = '认知界 - 让AI认识每一个具体的普通人';
const DEFAULT_DESCRIPTION = '面向全球化的个人黄页索引...';

// 3. 安全访问 + 默认值
const safeTitle = data?.title || DEFAULT_TITLE;
const safeDescription = data?.description || DEFAULT_DESCRIPTION;
// ...

// 4. 异常捕获
try {
  // ... 原有逻辑
} catch (error) {
  console.error('[SEOHead] Error:', error);
}
```

#### src/utils/seo.ts
```typescript
// getUserSEO 函数添加空值检查
export function getUserSEO(profile: Profile | null | undefined): SEOData {
  if (!profile) {
    return getDefaultSEO(); // 安全降级
  }
  // ...
}
```

#### src/pages/UserPage.tsx
```typescript
// 调用处添加条件判断
<SEOHead
  data={profile ? getUserSEO(profile) : getDefaultSEO()}
  jsonLd={profile ? { ... } : undefined}
/>
```

#### src/pages/MePage.tsx
```typescript
// 修复 props 传递方式
<SEOHead
  data={{
    title: pageTitle,
    description: pageDescription,
    keywords: [...],
    ogType: 'profile',
    canonicalUrl: pageUrl,
  }}
/>
```

---

## 3. 根因定位

### 3.1 数据来源分析
`SEOHead` 组件依赖的数据来源：

| 页面 | 数据来源 | 风险点 |
|------|----------|--------|
| IndexPage | `getDefaultSEO()` | 无风险，静态数据 |
| UserPage | `getUserSEO(profile)` | profile 可能为 null |
| MePage | 直接构造对象 | 构造时 profile 可能未就绪 |
| AdminPage | `getDefaultSEO()` | 无风险 |
| EditPage | `getDefaultSEO()` | 无风险 |
| ForgotPasswordPage | 直接构造对象 | 无风险 |

### 3.2 根本原因
`MePage` 和 `UserPage` 在异步数据加载完成前渲染 `SEOHead`，导致：
- `profile` 为 `null` 或 `undefined`
- `getUserSEO()` 返回的对象字段不完整
- `SEOHead` 直接访问 `data.title` 抛出异常

---

## 4. 数据层适配

### 4.1 契约稳定化
- `getUserSEO()` 现在接受 `Profile | null | undefined` 类型
- 当 profile 不存在时返回 `getDefaultSEO()` 的完整数据
- 所有字段访问使用安全默认值

### 4.2 调用方保护
- `UserPage`: 添加 `profile ? getUserSEO(profile) : getDefaultSEO()` 条件
- `MePage`: 重构 props 传递方式，确保对象结构完整

---

## 5. 监控与日志

### 5.1 开发环境日志
在 `SEOHead` 组件中添加调试日志：
```typescript
if (process.env.NODE_ENV === 'development' || window.location.hostname.includes('staging')) {
  console.info('[SEOHead] Rendered:', { title: safeTitle, hasData: !!data });
}
```

### 5.2 异常捕获
整个 `useEffect` 被 `try-catch` 包裹，确保任何异常都不会导致页面崩溃。

---

## 6. 测试覆盖

### 6.1 单元测试场景
已添加 `src/components/__tests__/SEOHead.test.tsx` 覆盖：
1. ✅ 完整数据渲染
2. ✅ 部分字段缺失
3. ✅ data 为 undefined
4. ✅ data 为 null
5. ✅ title 字段缺失

### 6.2 验证命令
```bash
# 本地构建验证
pnpm run build

# 单元测试（如配置）
pnpm test

# 开发服务器验证
pnpm run dev
```

---

## 7. 部署与回滚

### 7.1 部署命令
```bash
# 构建生产包
pnpm run build

# 部署到 Meoo 平台
# （通过平台界面或 CLI 上传 dist 目录）
```

### 7.2 验证命令
```bash
# 1. 登录测试
# 访问 /login，输入测试账号登录

# 2. 页面跳转验证
# 登录后应正常跳转至 /me，无暗红错误页

# 3. 控制台检查
# 打开 DevTools，确认无 "Cannot read properties of undefined" 错误

# 4. SEO 检查
# 查看页面 title 和 meta 标签是否正确设置
```

### 7.3 回滚命令
```bash
# 如需回滚，恢复到修复前的 commit
git log --oneline -5  # 查看 commit 历史
git revert <修复-commit-id>  # 或 git reset --hard <修复前-commit-id>

# 重新构建
pnpm run build
```

---

## 8. 变更清单

| 文件路径 | 改动说明 | Commit ID |
|----------|----------|-----------|
| src/components/SEOHead.tsx | 添加安全降级、异常捕获、默认值 | [待填充] |
| src/utils/seo.ts | getUserSEO 添加空值检查 | [待填充] |
| src/pages/UserPage.tsx | 调用处添加条件判断 | [待填充] |
| src/pages/MePage.tsx | 修复 props 传递方式 | [待填充] |
| src/components/__tests__/SEOHead.test.tsx | 新增单元测试 | [待填充] |

---

## 9. 验收标准

- [x] 页面不再出现暗红错误页
- [x] 控制台不再抛出 `Cannot read properties of undefined (reading 'title')`
- [x] 完整数据场景正常渲染
- [x] 部分字段缺失场景安全降级
- [x] 无数据场景使用默认标题
- [x] 构建成功无错误
- [ ] Staging 环境验证通过
- [ ] Meoo 平台部署验证通过

---

## 10. 可选方案

### 方案 A：当前实现（推荐）
- 前端添加安全降级
- 优点：快速修复，无需后端改动
- 缺点：前端需要处理更多边界情况

### 方案 B：后端数据保证
- 后端 API 确保返回完整数据
- 优点：前端逻辑简化
- 缺点：需要后端改动，周期长

---

**报告生成时间**: 2025-01-XX  
**修复版本**: v1.0.1-hotfix  
**负责人**: 开发团队
