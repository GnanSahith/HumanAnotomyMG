import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  // Let Vite handle dependency discovery naturally to avoid 4,000+ unbundled requests overloading the browser
  optimizeDeps: {
    include: ['lucide-react', 'three', '@react-three/fiber', '@react-three/drei']
  }
})
