# pi-stepfun-provider

[StepFun](https://www.stepfun.com/) model provider for [pi coding agent](https://github.com/earendil-works/pi).

## Features

- 🚀 **Native provider integration** - Models appear in `/model` selector
- 🔑 **API key authentication** - Via `STEPFUN_API_KEY` environment variable
- 🔄 **Dynamic model discovery** - Fetches latest models from StepFun API
- 💰 **Cost tracking** - Input/output/cache token costs displayed
- 🧠 **Reasoning support** - Step-2 and reasoning models supported
- 🖼️ **Vision support** - Step-1v and other vision models

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

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) for persistence.

## Usage

```bash
pi
```

Then use `/model` to select a StepFun model:

- `stepfun/step-1o` - General purpose model
- `stepfun/step-1v` - Vision model
- `stepfun/step-2` - Reasoning model (supports thinking)

## Available Models

| Model ID | Name | Reasoning | Vision | Context | Max Output |
|----------|------|-----------|--------|---------|------------|
| `step-1o` | Step-1o | ❌ | ✅ | 128k | 8k |
| `step-1v` | Step-1v | ❌ | ✅ | 128k | 8k |
| `step-2` | Step-2 | ✅ | ✅ | 200k | 16k |

*Additional models discovered dynamically from StepFun API.*

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
│   ├── streaming.ts      # Custom streaming (delegates to OpenAI compat)
│   └── auth.ts           # OAuth placeholder
├── README.md
└── LICENSE
```

## License

MIT