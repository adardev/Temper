import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
defineConfig({
  plugins: [
      react(),
      tailwindcss()
  ]
})