# AntiGravity - 3D Human Anatomy Explorer

A high-performance, interactive 3D web application built with React, Three.js, and Vite. This project features stunning glassmorphism aesthetics, advanced 3D physics interactions, and multi-language support.

## 🚀 Key Features

- **Interactive 3D Models**: Explore high-fidelity anatomical models (Skull, Brain, Heart, etc.).
- **Physics-Based Interactions**: Grab and drag 3D parts with real-time spring physics and snap-back behavior.
- **Glassmorphism UI**: Premium Apple Vision Pro-inspired interface with frosted glass effects and smooth transitions.
- **Multi-Language Support**: Fully localized in English, Hindi, and Telugu.
- **Theme Switching**: Seamless Light and Dark mode transitions with optimized contrast.
- **3D Hover Labels**: Dynamic floating tags that identify anatomical parts in real-time.

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **3D Engine**: [Three.js](https://threejs.org/) / [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- **Physics/Gestures**: [@use-gesture/react](https://use-gesture.netlify.app/) & [@react-spring/three](https://www.react-spring.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd AntiGravity
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
npm run build
```
The optimized files will be generated in the `dist` directory.

## 📂 Project Structure

- `src/components`: UI components (Main view, Sidebars, Modals).
- `src/models`: 3D GLB assets.
- `src/LanguageContext.jsx`: Multi-language state management.
- `public/`: Static assets and 3D models.

## 📄 License

Individual/Commercial license pending.
