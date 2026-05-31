# Bug Report: MD 编辑器选中单行文本无高亮

**日期**: 2026-05-31
**状态**: 未修复

**现象**: 编辑页面的 Markdown 编辑器中，选中单行内部分文字时没有选中高亮；选中跨行文本时有高亮。

**关键线索**:
- 多行选中高亮正常 → CodeMirror 自定义层 `.cm-selectionBackground` 生效
- 单行选中无高亮 → 依赖浏览器原生 `::selection`，不可见
- 项目中无全局 `::selection` / `user-select` CSS 覆盖

**已排除的原因**:
1. ❌ 颜色对比度不足（已尝试调整 `.cm-selectionBackground` 颜色，问题依旧）
2. ❌ 缺少 `drawSelection` 扩展（basicSetup 对象中默认开启，显式添加无效）
3. ❌ 全局 CSS 覆盖 selected 样式

**待排查方向**:
1. 浏览器原生 `::selection` 在某些字体/行高组合下被 CodeMirror contenteditable 行为抑制
2. CodeMirror `editorTheme` 中 `fontSize` / `fontFamily` 相关配置干扰
3. `@uiw/react-codemirror` v4.25 与 `basicSetup` 对象形式的兼容性问题
