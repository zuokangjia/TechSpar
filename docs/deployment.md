# 部署说明

这页只写当前仓库真实可用的启动方式。

### 环境要求

* Python `3.11+`
* Node.js `18+`
* 一个可用的 **OpenAI 兼容 LLM 接口**
* 一个可用的 **Embedding 接口**，或者本地 Embedding 模型

录音上传转写不是必需功能；如果你要用它，再额外配置语音相关环境变量。

### 1. 复制环境变量

```bash
cp .env.example .env
```

至少要补齐这几项：

```env
API_BASE=
API_KEY=
MODEL=
EMBEDDING_BACKEND=api
EMBEDDING_API_BASE=
EMBEDDING_API_KEY=
EMBEDDING_API_MODEL=
```

如果你使用官方 OpenAI Embedding，`EMBEDDING_API_BASE` 可以留空。

默认认证配置如下；如果不改，启动后可以直接登录：

```env
DEFAULT_EMAIL=admin@techspar.local
DEFAULT_PASSWORD=admin123
ALLOW_REGISTRATION=false
```

### 2. 本地手动启动

后端：

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

如果你要使用本地 Embedding，再额外安装：

```bash
pip install -r requirements.local-embedding.txt
```

前端：

```bash
cd frontend
npm install
npm run dev
```

启动后访问：

```text
http://localhost:5173
```

### 3. Docker 启动

```bash
docker compose up --build
```

启动后访问：

```text
http://localhost
```

### 4. 录音转写的额外配置

如果你要使用“上传录音 -> 自动转写”这条链路，还需要补齐：

```env
DASHSCOPE_API_KEY=
QINIU_ACCESS_KEY=
QINIU_SECRET_KEY=
QINIU_BUCKET=
QINIU_DOMAIN=
```

如果这些没配，也不影响主要训练流程；录音复盘可以直接粘贴逐字稿文本。

### 5. 线上部署注意事项

* 手动开发模式下，前端默认是 `5173`，后端是 `8000`。
* Docker 模式下，前端默认对外暴露 `80` 端口。
* 如果你在线上要使用麦克风或录音相关能力，建议启用 HTTPS；浏览器对非 `localhost` 的音频权限更严格。
