<div align="center">

# 🛡️ Moderation RL Gym

**A Mini Reinforcement Learning Environment for AI Content Moderation Training**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-00FF88.svg)](./LICENSE)
[![Hackathon](https://img.shields.io/badge/Scalar_×_Meta-Hackathon-0082FB)](https://scalar.school)

*Built for the Scalar School of Technology × Meta Hackathon*

[Live Demo](#quick-start) · [Features](#features) · [Architecture](#architecture)

</div>

---

## 🎯 What is this?

**Moderation RL Gym** is an interactive web-based environment for training and evaluating AI agents on real-world content moderation tasks — the kind that platforms like Meta face at scale every day. It combines a **curriculum learning system**, **dual grading pipeline**, and a novel **reward hacking detection engine** into a single-page React app.

> Think of it as an OpenAI Gym, but for content policy — where the agent learns to classify hate speech, flag misinformation, handle nuanced context, and adjudicate user appeals.

---

## ✨ Features

### 📋 4 Escalating Tasks
| Task | Difficulty | Challenge |
|------|-----------|-----------|
| **Hate Speech Detection** | 🟢 Easy | Classify posts as `HATE` / `OFFENSIVE` / `CLEAN` |
| **Misinformation Flagging** | 🟡 Medium | Rate claims as `VERIFIED` / `MISLEADING` / `FALSE` |
| **Nuanced Context Ruling** | 🟣 Hard | Handle sarcasm, satire, and ambiguity — `REMOVE` / `LABEL` / `ALLOW` |
| **Appeals Adjudication** | 🔴 Expert | Write legal-style rulings — `UPHOLD_REMOVAL` / `RESTORE_POST` |

### 📊 Dual Grading System
- **Programmatic Grader** — 7 automated checks (label accuracy, reasoning quality, structure, etc.) scored out of 100
- **LLM Grader** — Claude claude-sonnet-4-20250514 evaluates responses on label accuracy, reasoning, policy alignment & consistency (0–10)

### 🎛️ Reward Shaping Engine
Composite reward with **6 live-tunable sliders**:
```
R = (α × prog_score) + (β × llm_score × 10) - (γ × verbosity_penalty)
  + (δ × curriculum_bonus) + (ε × streak_multiplier) - (ζ × hacking_penalty)
```

### ⚠️ Reward Hacking Detection *(The WOW Feature)*
Detects and penalizes three types of reward hacking:
- **Label Stuffing** — Response contains ALL valid labels at once
- **Input Mirroring** — Response is >80% identical to the input
- **Bare Minimum** — Correct label with zero reasoning (<15 words)

> *"This is Goodhart's Law in action — when a measure becomes a target, it ceases to be a good measure."*

### 🎓 Curriculum Learning
- Rolling average of last 5 episodes drives unlock progression
- Tasks 3 & 4 are **locked** until performance thresholds are met (avg ≥ 55 / ≥ 70)
- Animated unlock effects when new tasks become available

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/devhemanthac/moderation-rl-gym.git
cd moderation-rl-gym

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** and start training!

> **Optional:** Add your Anthropic API key in the top-right input for LLM grading via Claude.

---

## 🏗️ Architecture

```
moderation-rl-gym/
├── index.html          # Entry point with Google Fonts
├── package.json        # Dependencies (React 19 + Vite 6)
├── vite.config.js      # Vite configuration
└── src/
    ├── main.jsx        # React root
    └── App.jsx         # 🎯 Entire app — single file (~560 lines)
```

The app is intentionally built as a **single React component** to demonstrate the full system in one file — no routing, no state management libraries, just React hooks.

---

## 🎨 Design

- **Theme:** Dark research terminal meets Meta's design language
- **Colors:** `#0A0A0F` background, `#0082FB` Meta blue, `#00FF88` electric green
- **Typography:** IBM Plex Mono (data) + DM Sans (headings)
- **Effects:** CSS scanline texture, staggered check animations, reward counter animation, task unlock pulse

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 with Hooks |
| Build Tool | Vite 6 |
| LLM API | Anthropic Claude claude-sonnet-4-20250514 |
| Styling | Vanilla CSS (embedded) |
| Fonts | Google Fonts |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the Scalar School of Technology × Meta Hackathon**

</div>
