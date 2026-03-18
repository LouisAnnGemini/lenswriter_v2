# LensWriter 叙事剪辑与客观时间线架构设计 (V4: 客观事件驱动模型)

## 1. 核心哲学：客观现实 vs 主观叙事
您提出了一个极其深刻的写作软件架构理念：**将“客观发生的事实”与“主观叙事的重组”彻底剥离。**

*   **客观现实 (TimelineEvent - 事件卡片)**：在故事的宇宙中，无论作者怎么写，事件是客观存在的。在某个时间、某个地点，特定的人物做了特定的动作。**人物的行为描述是客观事实，属于事件卡片。**
*   **主观叙事 (Scene - 场景/正文)**：作者的“剪辑台”。作者决定在这一章、这一节里，向读者展示哪些客观事件。场景本身不产生新的人物客观行为，它只是**“挂载”**和**“重组”**客观事件的容器。

## 2. 数据结构重构 (彻底剥离 Scene 的角色笔记)

根据您的需求，我们将删除 `Scene` 中现有的角色行为描述，将其转移到 `TimelineEvent` 中。

### 2.1 升级 TimelineEvent (客观事件卡片)
事件卡片现在是包含时间、地点、以及**所有参与人物客观行为**的超级节点。
```typescript
export type TimelineEvent = {
  id: string;
  workId: string;
  title: string;          // 事件名称 (如：玄武门之变)
  timestamp: string;      // 客观发生时间
  locationId?: string;    // 发生地点 (关联 Location 实体)
  description?: string;   // 事件的全局客观描述
  
  // 【核心变更】人物的客观行为描述转移到这里
  // Record<characterId, actionDescription>
  // 例如: { "char_1": "射杀李建成", "char_2": "被射杀" }
  characterActions: Record<string, string>; 
};
```

### 2.2 瘦身 Scene (主观叙事容器)
Scene 不再拥有 `characterNotes`，它只负责记录正文内容和它所“引用”的客观事件。
```typescript
export type Scene = {
  id: string;
  title: string;
  content: string;
  chapterId: string;
  order: number;
  
  // 【核心变更】删除 characterNotes
  // 增加引用的事件卡片 ID 列表
  linkedEventIds: string[]; 
};
```

### 2.3 新增 Location (地点实体)
为了完善客观世界，增加地点管理。
```typescript
export type Location = {
  id: string;
  workId: string;
  name: string;
  description: string;
};
```

## 3. 场景组合逻辑 (The Aggregation Logic)

当您在写作（编辑 Scene）时，系统会根据 `linkedEventIds` 自动为您**聚合**客观参考信息：

### 场景 A：1 个 Scene 对应多个 Event (时间跨度大 / 蒙太奇)
假设 `Scene 2-1` 关联了 `Event X (密谋)` 和 `Event Y (刺杀)`。
在编辑器侧边栏的“参考面板”中，系统会自动组合呈现：
*   **人物 A**:
    *   *(来自 Event X)*: 在密室中策划了行动路线。
    *   *(来自 Event Y)*: 在巷口负责接应。
*   **人物 B**:
    *   *(来自 Event X)*: 准备了毒药。
    *   *(来自 Event Y)*: 执行了刺杀。

### 场景 B：多个 Scene 对应 1 个 Event (多视角 / 罗生门)
假设 `Scene 1-1 (杀手视角)` 和 `Scene 5-1 (受害者视角)` 都关联了 `Event Z (酒馆下毒)`。
无论您在写哪一个 Scene，侧边栏里关于 `Event Z` 的人物客观行为描述都是**绝对一致**的。这保证了您在多视角写作时，底层逻辑和客观事实不会发生冲突和吃书。

## 4. UI/UX 视图设计

### 4.1 卡片池与编年史 (The Database & Chronology)
*   **地点与人物管理**：独立的 Tab，用于构建世界观。
*   **事件卡片编辑器**：在这里创建 `TimelineEvent`。选择参与的人物，并填写每个人物在这个事件中**客观做了什么**。
*   **编年史视图**：按时间顺序排列所有事件卡片，支持按人物、地点过滤。

### 4.2 剪辑台视图 (The Montage Board)
*   **主轨道 (叙事流)**：按章节和场景顺序排列的空白插槽。
*   **副轨道 (事件流)**：您可以从“事件卡片池”中，将卡片**拖拽**到主轨道的场景下方。一个场景可以拖入多张卡片，一张卡片也可以被拖入多个场景。

### 4.3 沉浸式编辑器 (The Writing Panel)
*   **正文区**：您进行主观创作的地方。
*   **客观参考区 (原角色笔记区)**：变为**只读（或快捷编辑）的聚合面板**。它会自动读取当前场景挂载的所有事件卡片，并按人物分类，列出他们在这个场景涵盖的事件中，客观上做了什么。

## 5. 实施路线图

1.  **第一步：数据结构大换血**
    *   清理 `StoreState`，移除 `Scene.characterNotes`。
    *   引入 `Location` 和 `TimelineEvent` 实体，包含 `characterActions`。
2.  **第二步：构建“客观世界”UI**
    *   实现地点管理面板。
    *   实现事件卡片池（Event Pool）UI，允许在事件中添加人物并编写客观行为。
3.  **第三步：改造编辑器侧边栏**
    *   在 `EditorPanel` 中添加“关联事件”的下拉/拖拽选择器。
    *   将侧边栏的角色笔记区重构为“基于关联事件的客观行为聚合展示区”。
4.  **第四步：剪辑台与编年史视图**
    *   实现完整的 NLE（非线性剪辑）拖拽排版视图和按时间排序的全局时间线。
