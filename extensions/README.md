# CodeForge Extensions Directory 🧩

Welcome to the **Extensions Folder** for CodeForge Online Code Compiler!

This directory stores downloadable and uploadable extensions that users can install directly inside the compiler using the **Extensions Marketplace** panel (`Ctrl+Shift+X` or the 🧩 icon in the Activity Bar).

---

## 🚀 How Extensions Work

1. **AntiGravity AI Copilot (Built-in & Custom)**:
   - Detects code context and predicts the next lines as you type.
   - Shows a subtle inline ghost text prediction right beside the cursor.
   - Press **`Tab`** to instantly accept and apply the suggested code (just like Anti Gravity).
   - Press **`Esc`** to dismiss.

2. **Smart Auto-Correct & Linter**:
   - Detects common typos (`prnit` ➔ `print`, `cosnt` ➔ `const`, `fucntion` ➔ `function`).
   - Detects missing colons in Python (`if`, `for`, `while`, `def`, `class`).
   - Click the **`🪄 Auto-Fix`** button in the editor toolbar to fix all issues in one click.

3. **Bracket Pair Colorizer Pro**:
   - Rainbow brackets, braces, and parentheses for deep nesting clarity.

4. **LeetCode & DSA Algorithm Snippets**:
   - Boilerplates for Binary Search, BFS/DFS, Dijkstra, Two Pointers, and Dynamic Programming.

---

## 📦 How to Upload or Install an Extension

1. Open the compiler web app (`http://localhost:8443/`).
2. Click the **🧩 Extensions** icon in the left Activity Bar.
3. Click the **`+ Add Extension`** button at the top of the Extensions Marketplace.
4. Either:
   - **Upload a JSON file**: Select one of the sample JSON files in this folder (e.g. `sample-ai-copilot-extension.json` or `sample-autocorrect-rules.json`).
   - **Create via Form**: Type your extension name, trigger word, and replacement code directly in the UI.
5. Your custom extension will immediately be installed, activated, and saved in your local workspace!

---

## 📝 Extension JSON Format

```json
{
  "name": "My Custom AI Extension",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Custom code predictions and shortcuts.",
  "category": "ai",
  "icon": "⚡",
  "tags": ["ai", "copilot", "snippets"],
  "completions": [
    {
      "trigger": "my_function_name",
      "prediction": "def my_function_name():\n    return 'Hello from extension!'",
      "description": "Inserts starter function",
      "languages": ["python"]
    }
  ],
  "linterRules": [
    {
      "pattern": "\\btypoWord\\b",
      "replacement": "correctWord",
      "message": "Corrected typoWord to correctWord",
      "languages": ["python", "javascript"]
    }
  ]
}
```
