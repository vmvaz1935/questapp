import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Plugin para ignorar erros de importação do Firebase quando não instalado
const ignoreFirebasePlugin = () => {
  // Verificar se Firebase está instalado
  const firebasePath = path.resolve(process.cwd(), 'node_modules', 'firebase');
  const isFirebaseInstalled = fs.existsSync(firebasePath);
  
  return {
    name: 'ignore-firebase-imports',
    resolveId(id: string, importer?: string) {
      // Se tentar importar Firebase e não estiver instalado, retornar um módulo virtual vazio
      if ((id.startsWith('firebase/') || id === 'firebase')) {
        if (!isFirebaseInstalled) {
          return { id: `\0virtual:firebase-empty-${id}`, moduleSideEffects: false };
        }
        // Se estiver instalado, deixar o Vite resolver normalmente
        return null;
      }
      return null;
    },
    load(id: string) {
      // Retornar módulo vazio para imports do Firebase quando não instalado
      if (id.startsWith('\0virtual:firebase-empty-')) {
        const moduleName = id.replace('\0virtual:firebase-empty-', '');
        
        // Retornar exports apropriados dependendo do módulo
        if (moduleName === 'firebase/firestore') {
          return `
            export const doc = () => ({});
            export const getDoc = () => Promise.resolve({ exists: () => false, data: () => ({}) });
            export const setDoc = () => Promise.resolve();
            export const updateDoc = () => Promise.resolve();
            export const getFirestore = () => null;
            export default {};
          `;
        } else if (moduleName === 'firebase/auth') {
          return `
            export const signInWithPopup = () => Promise.reject(new Error('Firebase não instalado'));
            export const signOut = () => Promise.reject(new Error('Firebase não instalado'));
            export const onAuthStateChanged = () => () => {};
            export const GoogleAuthProvider = class {};
            export const getAuth = () => null;
            export default {};
          `;
        } else if (moduleName === 'firebase/app') {
          return `
            export const initializeApp = () => ({});
            export default {};
          `;
        }
        return `export default {};`;
      }
      return null;
    }
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
            plugins: [
              react(),
              ignoreFirebasePlugin(),
              VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
                manifest: {
                  name: 'FisioQ Beta - Questionários Clínicos',
                  short_name: 'FisioQ',
                  description: 'Gerencie pacientes, aplique questionários validados e acompanhe a evolução do tratamento',
                  theme_color: '#2563eb',
                  background_color: '#ffffff',
                  display: 'standalone',
                  orientation: 'portrait-primary',
                  scope: '/',
                  start_url: '/',
                  icons: [
                    {
                      src: '/icon-192.png',
                      sizes: '192x192',
                      type: 'image/png',
                      purpose: 'any maskable'
                    },
                    {
                      src: '/icon-512.png',
                      sizes: '512x512',
                      type: 'image/png',
                      purpose: 'any maskable'
                    }
                  ],
                  shortcuts: [
                    {
                      name: 'Pacientes',
                      short_name: 'Pacientes',
                      description: 'Gerenciar pacientes',
                      url: '/patients',
                      icons: [{ src: '/icon-192.png', sizes: '192x192' }]
                    },
                    {
                      name: 'Questionários',
                      short_name: 'Questionários',
                      description: 'Aplicar questionários',
                      url: '/questionnaires',
                      icons: [{ src: '/icon-192.png', sizes: '192x192' }]
                    }
                  ]
                },
                workbox: {
                  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                  runtimeCaching: [
                    {
                      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
                      handler: 'CacheFirst',
                      options: {
                        cacheName: 'google-fonts-stylesheets',
                        expiration: {
                          maxEntries: 10,
                          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                        }
                      }
                    },
                    {
                      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
                      handler: 'CacheFirst',
                      options: {
                        cacheName: 'google-fonts-webfonts',
                        expiration: {
                          maxEntries: 10,
                          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                        }
                      }
                    },
                    {
                      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                      handler: 'CacheFirst',
                      options: {
                        cacheName: 'images',
                        expiration: {
                          maxEntries: 60,
                          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                        }
                      }
                    }
                  ]
                },
                devOptions: {
                  enabled: false // Desabilitar em dev para evitar conflitos
                }
              })
            ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        // Incluir Firebase nas dependências otimizadas
        include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'jspdf']
      }
    };
});
