# 变更日志

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="../../CHANGELOG.md">
          <img src="https://img.shields.io/badge/English-2563eb?style=for-the-badge&labelColor=1e40af" alt="English"/>
        </a>
      </td>
      <td align="center">
        <a href="../ko/CHANGELOG.md">
          <img src="https://img.shields.io/badge/한국어-16a34a?style=for-the-badge&labelColor=15803d" alt="한국어"/>
        </a>
      </td>
      <td align="center">
        <a href="../ja/CHANGELOG.md">
          <img src="https://img.shields.io/badge/日本語-ea580c?style=for-the-badge&labelColor=c2410c" alt="日本語"/>
        </a>
      </td>
      <td align-center>
        <img src="https://img.shields.io/badge/中文-dc2626?style=for-the-badge&labelColor=b91c1c" alt="中文"/>
      </td>
    </tr>
  </table>
</div>

## [0.4.1] 2025-12-10

### ✨ 改进
- **Caret Provider**: 为配合 `caret.team` 服务的正式上线，稳定了基于 `anyLLM` 的 Caret Provider。包括 API 增强和可靠性提升。

### 修复
- **角色系统**: 增强了角色初始化逻辑，以确保默认头像正确植入。改进了角色图片加载时的异常处理。
- **品牌化**: 将 `.clineignore` 功能的品牌化更正为与 `.caretignore` 一致。
- **构建**: 解决了各种构建和资源位置问题。
- **认证**: 对认证流程进行了小幅修复和检查。

## [0.4.0] 2025-11-28

> **注意**: Caret v0.4.0 基于 Cline v3.38.2。上游发行说明位于 `CHANGELOG-CLINE.md`。

### 🎉 Cline v3.38.2 上游合并
- 合并提交: `8723b386f` (分支: `main_backup_20251128202033`)。

### 新增功能
- **Cline v3.38.2 集成**: 所有上游功能，包括最新的模型支持（Claude Opus 4.5）。
- **双账户系统**: 在 Caret 模式（扩展）和 Cline 模式（原生）之间切换。
- **Caret CLI (测试版)**: 统一的 `caret` CLI，支持增强的身份验证和 LiteLLM。
- **提供商设置**: 为 LiteLLM/BizRouter 自动获取模型，并进行实时健康检查。
- **JSON 提示系统**: 通过 JSON 进行动态系统提示配置。
- **输入历史**: 类似终端的持久化历史导航。
- **快捷键**: 取消（Esc）和恢复（Ctrl+Shift+R）任务。

### 修复的问题
- 在 Linux 上使用 shell 集成时终端挂起的问题。
- 恢复了 UI 和 CLI 的品牌化。
