# pi-stepfun-provider

[StepFun](https://www.stepfun.com/) model provider for [pi coding agent](https://github.com/earendil-works/pi).

## Features

- 🚀 **Native provider integration** - Models appear in `/model` selector
- 🔑 **API key authentication** - Via `STEPFUN_API_KEY` environment variable
- 🔄 **Dynamic model discovery** - Fetches latest models from StepFun API
- 💰 **Cost tracking** - Input/output/cache token costs displayed
- 🧠 **Reasoning support** - Reasoning models with `reasoning_effort` (low/medium/high)
- 🖼️ **Vision support** - Step 3.7 Flash / Step 5 Preview image understanding

## Installation

**Recommended**: Install via npm for stable access and install statistics.

```bash
# Install directly with pi (recommended)
pi install npm:@marshal/pi-stepfun-provider
```

Or standard npm install:

```bash
npm install -g @marshal/pi-stepfun-provider
```

> Note: `pi install npm:...` registers the extension globally. Plain `npm install -g` only downloads the package without registering it as a pi extension.

**Alternative**: Install from GitHub (for source access or custom modifications).

```bash
# Install from GitHub repo
pi install git:github.com/MarshalW/pi-stepfun-provider
```

> Users in China are encouraged to use the npm method, as GitHub access may be unreliable.

## Configuration

Set your StepFun API key:

```bash
export STEPFUN_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### Step Plan

StepFun's Step Plan subscription uses a separate endpoint. If you subscribed via [Step Plan](https://platform.stepfun.ai/step_plan), set the base URL:

```bash
export STEPFUN_BASE_URL=https://api.stepfun.com/step_plan/v1
```

> Add both environment variables to your shell profile (`.bashrc`, `.zshrc`, etc.) for persistence.

### DNS: force IPv4 (required on some networks)

`api.stepfun.com` publishes both A and AAAA records, but **only IPv4 responds**. Node 20+ may
pick the AAAA record and fail with `DNS lookup failed`, which surfaces as a silently failed
turn rather than an obvious error. If you hit that, force IPv4 name resolution:

```bash
export NODE_OPTIONS=--dns-result-order=ipv4first
```

`curl -4` works while `curl -6` returns `000` is the quickest way to confirm this is your problem.

## Usage

```bash
pi
```

Then use `/model` to select a StepFun model:

- `stepfun/step-5-preview` - 1M-context flagship reasoning model (image understanding; the model itself also accepts video, but pi only exposes `text` + `image` inputs)
- `stepfun/step-3.7-flash` - Multimodal reasoning model (image understanding, same video caveat)
- `stepfun/step-3.5-flash` - Flagship text reasoning model
- `stepfun/step-3.5-flash-2603` - Agent-optimized reasoning model

## Available Models

| Model ID | Name | Reasoning | Vision | Context | Max Output |
|----------|------|-----------|--------|---------|------------|
| `step-5-preview` | Step 5 Preview | ✅ | ✅ | 1M | 64k |
| `step-3.7-flash` | Step 3.7 Flash | ✅ | ✅ | 256k | 64k |
| `step-3.5-flash` | Step 3.5 Flash | ✅ | ❌ | 256k | 64k |
| `step-3.5-flash-2603` | Step 3.5 Flash 2603 | ✅ | ❌ | 256k | 64k |

*Specs verified against the [official docs](https://platform.stepfun.com/docs/zh/guides/models/overview); `cost` values are **USD** per 1M tokens from the [English pricing page](https://platform.stepfun.com/docs/en/guides/pricing/details) (the Chinese page quotes CNY).*

Model ids that are not in the curated table above are discovered dynamically from `GET /v1/models` and built from the
API-reported metadata (`max_input_tokens`, `enable_vision_input`, `enable_reason`,
`reasoning_effort_support_list`) instead of hard-coded defaults — so a brand-new model id reports its real context
window and its real thinking levels on first sight. Unknown pricing is reported as `0` rather than as a guessed value.

`GET /v1/models` also lists speech models (TTS / ASR / realtime). They are not callable through chat completions
(they answer `{"type":"model_invalid"}`), so they are filtered out via `supported_protocols` / `model_type` and never
show up in `/model`. If a response contains no chat models at all, the static catalog is kept instead of replacing the
model list with an empty one.

## Refreshing Models

Models are fetched from StepFun API on:
- Startup (if API key configured)
- Running `/model` command
- Running `pi update --models`

## Development

```bash
# Clone and install dependencies
git clone https://github.com/MarshalW/pi-stepfun-provider
cd pi-stepfun-provider
pnpm install

# Test locally without installing globally
pi install -l .
```

## Package Structure

```
pi-stepfun-provider/
├── package.json          # Package manifest with pi config
├── src/
│   ├── index.ts          # Extension entry point
│   ├── models.ts         # Model definitions + dynamic fetching
│   └── streaming.ts      # Custom streaming (delegates to OpenAI compat)
├── README.md
└── LICENSE
```

## License

MIT
