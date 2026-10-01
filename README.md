# ⚡ CodeForge - Cloud Code Editor & Compiler

> Next-generation cloud-based code editor & compiler. Write, compile, debug, and execute code in 40+ programming languages with Monaco Editor, Live Server, Git integration, and an intelligent assistant.

[![Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new)
[![Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 Key Features

- 🖥️ **Full-Featured Monaco Editor**: Industry-standard code editor with fluid cursor animations, bracket pair colorization, indentation guides, code folding, and smart snippet suggestions.
- ⚡ **Multi-Language Compiler**: Fast, zero-failure compilation & execution for Python, C++, C, Java, JavaScript, TypeScript, Go, Rust, and 30+ other languages powered by Judge0 CE and intelligent client-side fallback engines.
- 📡 **HTML Live Server**: Built-in Live Server on port 5500 with instant hot-reloading for previewing HTML/CSS/JS web projects.
- 🐙 **GitHub Integration**: Connect with GitHub via device activation, clone repositories, create commits, and push code directly from the web IDE.
- 🎨 **Aesthetic Themes**: Curated collection of high-contrast themes (VS Code Dark+, Monokai Pro, One Dark, Dracula, GitHub Dark, Tokyo Night, Cobalt2, etc.).
- 🤖 **Intelligent Code Assistant**: Instant bug fixes, code reviews, algorithmic explanations, and complexity analysis.
- 💾 **Local Persistence & Export**: Auto-saves your workspaces and tabs to `localStorage`. One-click download as single files or full project `.zip` archives.

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/codeforge.git
cd codeforge
```

### 2. Install dependencies
```bash
npm install
# or
pnpm install
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:8443](http://localhost:8443) (or the port shown in terminal) in your browser.

### 4. Build for production
```bash
npm run build
```
The optimized production bundle will be created in the `dist/` directory.

---

## 🌐 Deploy to Vercel (Recommended)

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/new).
3. Import your `codeforge` repository.
4. Framework Preset will be automatically detected as **Vite**.
5. Click **Deploy**!

`vercel.json` is pre-configured with client-side SPA routing rewrites.

---

## ☁️ Deploy to Render

1. Create a new **Static Site** on [Render](https://dashboard.render.com/).
2. Connect your GitHub repository.
3. Set the following settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Click **Create Static Site**!

`render.yaml` is also included in the repository for Blueprint deployment.

---

## 📁 Project Structure

```
├── public/                 # Static assets (logo, favicon)
├── src/
│   ├── assets/             # Images and branding assets
│   ├── components/         # React UI components (Editor, Terminal, AI Panel, etc.)
│   ├── engine/             # Execution and debugging engine
│   ├── lib/                # Compiler utilities, themes, languages, storage
│   ├── App.tsx             # Main IDE application component
│   ├── index.css           # Global design tokens and Tailwind CSS
│   └── main.tsx            # React DOM entrypoint
├── index.html              # HTML5 shell
├── package.json            # Project dependencies and build scripts
├── vite.config.ts          # Vite build and Live Server configuration
├── vercel.json             # Vercel deployment configuration
├── render.yaml             # Render deployment configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
