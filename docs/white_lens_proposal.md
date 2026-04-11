# 可行性方案：Stash 机制与白色 Lens 深度重构

## 1. 核心设计原则与状态机定义

本次重构确立了 LensWriter 中关于“暂存（Stash）”与“透镜（Lens）”的严格状态机。

### 1.1 等价原则 (Stash = White Lens)
“被暂存的块（Stashed Block）”和“白色透镜（White Lens）”在概念和物理存储上完全等价。
*   **任何 Block**（无论是普通文本还是彩色 Lens），只要执行了 `Stash` 操作，其状态将被强制重置为：`isStashed: true`, `isLens: true`, `lensColor: 'white'`。
*   **颜色遗忘机制**：系统不记忆 Block 被 Stash 前的颜色或状态。

### 1.2 强制升维原则 (Promote = Red Lens)
*   当一个白色 Lens（Stashed Block）执行 `Promote`（插入正文）操作时，它将强制脱离暂存态，并统一转化为默认的**红色 Lens**。
*   其状态将被强制重置为：`isStashed: false`, `lensColor: 'red'`。
*   **结论**：从 Stash 中出来的任何内容，必定是彩色 Lens，不再是普通文本。

### 1.3 主次倒置原则 (Inverted Priority)
所有的 Lens（彩色和白色）都拥有 `content`（正文草稿）和 `notes`（私有笔记/灵感）两个核心字段。
*   **彩色 Lens（在正文编辑器中）**：以 `content` 为主显示区，`notes` 作为辅助信息（通常在侧边栏或悬浮菜单中编辑）。
*   **白色 Lens（在 Stash 面板中）**：以 `notes` 为主显示区（灵感提示），`content` 作为次要区域（正文草稿，可能为空）。两者在 Stash 面板中均需提供直接的编辑入口。

### 1.4 全局链接原则 (Universal Linking)
白色 Lens 本质上依然是 Lens，因此它必须完全继承 Lens 的双向链接（Linked Lenses）能力。
*   白色 Lens 可以链接到正文中的彩色 Lens。
*   彩色 Lens 可以链接到 Stash 中的白色 Lens。
*   白色 Lens 之间可以互相链接。

---

## 2. 改造方案设计 (Refactoring Plan)

### 2.1 数据层与状态转化逻辑 (Store Actions)
*   **修改 `BlockHoverMenu` 和 `BlockRightActions` 中的 Stash 逻辑**：
    *   当点击“Stash”时，不仅设置 `isStashed: true`，还必须强制设置 `isLens: true` 和 `lensColor: 'white'`。
*   **修改 `StashTab` 中的 Promote 逻辑**：
    *   当点击“Insert into Editor (Promote)”时，不仅设置 `isStashed: false` 和 `documentId`，还必须强制设置 `lensColor: 'red'`。
*   **清理冗余**：
    *   从 `EditorPanel.tsx` 的颜色选择器中彻底移除 `white` 选项，确保正文区域只能选择彩色 Lens。

### 2.2 视图层：Stash 面板重构 (StashTab.tsx)
这是本次重构的重点，需要彻底改变 Stash 卡片的 UI 布局。
*   **双输入区 UI**：每个白色 Lens 卡片将分为上下两部分。
    *   **上半部分 (Notes/Inspiration)**：显示为带有明显标识（如 `💡 灵感`）的文本区。点击即可进入编辑模式，修改 `notes` 字段。
    *   **下半部分 (Content/Draft)**：显示为正文草稿区。如果为空，显示占位符（如“在此处撰写正文草稿...”）。点击即可进入编辑模式，修改 `content` 字段。
*   **新建逻辑更新**：在 Stash 面板顶部新建块时，输入框输入的内容默认存入 `notes` 字段，而 `content` 留空。
*   **引入链接 UI (Linked Lenses)**：
    *   在每个白色 Lens 卡片的底部或操作栏，增加与 `LensesPanel` 类似的“链接管理”UI。
    *   允许用户在 Stash 面板中直接查看、添加或移除该白色 Lens 与其他 Lens（彩色或白色）的链接关系。

### 2.3 视图层：编辑器面板 (EditorPanel.tsx)
*   由于状态机的严格控制（正文必定无白色，Stash 必定全白色），正文渲染逻辑无需大幅修改。
*   只需确保 `LENS_COLORS` 常量中不包含 `white`，防止用户在正文中手动将 Lens 切换为白色。

---

## 3. 风险评估与注意事项

1.  **历史数据兼容性**：
    *   目前数据库中可能存在 `isStashed: true` 但 `isLens: false` 的普通块。
    *   在渲染 Stash 面板时，需要做兼容处理，或者在应用启动时运行一次轻量级的迁移脚本，将所有 `isStashed: true` 的块强制刷为 `isLens: true, lensColor: 'white'`。
2.  **链接选择器的过滤逻辑**：
    *   在实现“白色 Lens 互相链接”时，需要确保链接选择器（如下拉菜单或搜索框）能够同时检索到正文中的彩色 Lens 和 Stash 中的白色 Lens。现有的 `LensesPanel` 可能只检索了当前 Scene 的 Lens，需要扩展其检索范围。
3.  **UI 空间占用**：
    *   Stash 面板的宽度有限（通常在右侧 Sidebar）。同时展示 `notes`、`content` 和 `linked lenses` 可能会导致单个卡片过高。需要精心设计 UI，例如使用折叠面板（Accordion）或紧凑的排版来优化视觉体验。

---
*此方案已确认，随时可以开始代码实施。*
