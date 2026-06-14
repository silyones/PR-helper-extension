# PR Helper

> AI-powered Chrome extension that auto-generates GitHub PR titles, descriptions, and testing checklists from your diff.

## Demo

[add GIF here]

## Features

- Reads your GitHub PR diff automatically
- Generates PR title, description, and testing checklist
- Generates conventional commit message
- One-click fill into GitHub PR form
- Free to use with Groq API (no cost)
- Works on Chrome, Brave, and Edge

## Installation

### From source (developer mode)

1. Clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/PR-helper.git
```

2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select this repository folder
5. The extension icon will appear in your toolbar

## Setup

1. Get a free Groq API key at [console.groq.com](https://console.groq.com)
2. Click the PR Helper extension icon
3. Paste your API key and click Save

## Usage

1. Go to any GitHub repository
2. Open a Pull Request or create a new one
3. Click the PR Helper extension icon
4. Click **Generate PR Description**
5. Your PR title and description are auto-filled — review and submit

## Tech stack

- Vanilla JavaScript
- Chrome Extension Manifest V3
- Groq API (Llama 3.3 70B)
- GitHub DOM API

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
