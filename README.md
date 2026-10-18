# 🩻 Anatomia3D Studio — Atlas Anatômico Interativo WebGL 2 (.GLB / BodyParts3D)

![WebGL 2](https://img.shields.io/badge/WebGL_2.0-Three.js_r170-06b6d4?style=for-the-badge&logo=three.js&logoColor=white)
![React 18](https://img.shields.io/badge/React-18.3-2563eb?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![BodyParts3D](https://img.shields.io/badge/Malhas_3D-BodyParts3D_%2F_DBCLS-10b981?style=for-the-badge)
![TA98 / IFAA](https://img.shields.io/badge/Nomenclatura-TA98_%2F_IFAA-f59e0b?style=for-the-badge)
![PWA Ready](https://img.shields.io/badge/PWA-Offline_.GLB_Cache-8b5cf6?style=for-the-badge)

**Anatomia3D Studio** é uma plataforma web e PWA instalável de estudo, dissecação virtual e inspeção de anatomia humana em 3D, executada diretamente no navegador via **WebGL 2.0**, **Three.js** e **React Three Fiber**.

O projeto utiliza **malhas anatômicas 3D reais (`.glb`)** compiladas a partir do acervo científico aberto **BodyParts3D / Anatomography (DBCLS)** e modelos de órgãos em alta densidade, estruturadas sob a **Terminologia Anatômica Internacional (TA98 / TA2 — FIPAT/IFAA)** em Português e Latim.

---

## ✨ Principais Funcionalidades 3D & Engenharia

- **Malhas Anatômicas 3D Reais (`.GLB` BodyParts3D)**:
  - **33 estruturas anatômicas** e **102 sub-malhas 3D reais independentes** (~423.000 vértices / ~790.000 triângulos) em `public/models/human_anatomy_atlas.glb`.
  - Inclui ainda **7 modelos `.GLB` de alta densidade de órgãos isolados** (`heart.glb`, `brain.glb`, `lungs.glb`, `liver.glb`, `kidneys.glb`, `intestine.glb` e `pancreas.glb`) alternáveis em tempo real.
- **Raycasting Acelerado por BVH (`<Bvh firstHitOnly>`)**:
  - Todas as 102 sub-malhas `.GLB` utilizam estruturas espaciais *Bounding Volume Hierarchy* (`three-mesh-bvh` via `@react-three/drei`) para detecção instantânea de clique e *hover* tanto no desktop quanto em smartphones.
- **Vista Explodida 3D (*Exploded View* 0% a 100%)**:
  - Controle deslizante **Explodir Estrutura / Camadas (0% a 100%)** que afasta radialmente as sub-malhas a partir do centro geométrico da estrutura selecionada, permitindo inspecionar partes internas (como valvas e câmaras cardíacas ou ventrículos encefálicos) separadas no espaço 3D e retornar suavemente à posição original em `0%`.
- **Histórico Desfazer / Refazer de Dissecação (*Undo / Redo*)**:
  - Pilha de histórico de dissecação para ações de visibilidade (ocultar, mostrar, isolar, raio-X e seleção) com botões **Desfazer** e **Refazer** na barra superior e suporte aos atalhos `Ctrl+Z` e `Ctrl+Y` (`Ctrl+Shift+Z`).
- **Busca Tolerante a Acentos + Deep Linking via URL**:
  - Busca normalizada (`NFD`) multi-termo fora de ordem que localiza qualquer osso, músculo, órgão, sub-malha ou código `TA98` mesmo sem acentuação.
  - Sincronização automática do estado da dissecação com a URL (`?part=...&sub=...&xray=...&hidden=...&slice=...&explode=...`) e botão **Compartilhar Visão** com cópia instantânea do link direto.
- **Planos de Corte Anatômicos em Tempo Real (*Cross-Section Clipping*)**:
  - Cortes dinâmicos nos eixos **Axial (Transversal)**, **Sagital (Mediano)** e **Coronal (Frontal)** com controle de posição contínua e inversão de hemicorpo.
- **Modo Quiz Anatômico com Estatísticas de Domínio & Favoritos (`localStorage`)**:
  - Avaliação prática de identificação anatômica diretamente sobre o modelo 3D com persistência em `localStorage` do **Recorde (High Score)**, **Melhor Sequência (Streak)** e **Taxa de Acerto por Sistema Anatômico**, além de marcação de estruturas **★ Favoritas**.
- **PWA Instalável & Cache Offline de Modelos `.GLB`**:
  - Configurado com `public/manifest.webmanifest` e Service Worker (`public/sw.js`) com estratégia *Cache-First* para os modelos `.glb` em `public/models/`, permitindo instalar o aplicativo na tela inicial do celular ou desktop e carregar as malhas instantaneamente.
- **UX Mobile Nativa (*Half-Screen Bottom Sheets* & *Progressive Disclosure*)**:
  - Em telas `< 768px`, a árvore de sistemas e o inspetor clínico operam como *Bottom Sheets* de meia tela (`50dvh` / `42vh` expansíveis), preservando o modelo 3D visível e interativo na metade superior da tela.

---

## 🛠️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Função no Projeto |
| :--- | :--- | :--- |
| **Motor Gráfico 3D** | `Three.js` (`r170`) + WebGL 2.0 | Renderização PBR, `GLTFLoader`, `MeshoptDecoder`, `GLTFExporter`, `PMREMGenerator` e planos de corte (`THREE.Plane`) |
| **Integração React 3D & BVH** | `@react-three/fiber` + `@react-three/drei` | Grafo de cena declarativo, `<Bvh firstHitOnly>`, `OrbitControls`, `Html` 3D pins e `ContactShadows` |
| **Interface, Hooks & Persistência** | `React 18.3` + `TypeScript 5.6` | Hooks modulares (`useDissectionHistory`, `useQuizAndFavorites`), sincronização de URL e persistência em `localStorage` |
| **PWA & Offline** | Web App Manifest + Service Worker | Instalação nativa mobile/desktop e cache persistente das malhas `.GLB` (`CacheStorage`) |
| **Build & Bundler** | `Vite 6` | Servidor de desenvolvimento ultrarrápido e empacotamento otimizado para produção |

---

## 📂 Estrutura de Pastas

```text
Anatomia3D/
├── public/
│   ├── models/
│   │   ├── human_anatomy_atlas.glb   # Atlas corporal completo BodyParts3D (33 estruturas / 102 sub-malhas)
│   │   ├── atlas_metadata.json       # Metadados espaciais e contagem de vértices/triângulos por sub-malha
│   │   ├── heart.glb                 # Coração isolado em alta resolução
│   │   ├── brain.glb                 # Encéfalo isolado em alta resolução
│   │   ├── lungs.glb                 # Pulmões e árvore traqueobrônquica em alta resolução
│   │   ├── liver.glb                 # Fígado isolado em alta resolução
│   │   ├── kidneys.glb               # Rins isolados em alta resolução
│   │   ├── intestine.glb             # Intestinos em alta resolução
│   │   └── pancreas.glb              # Pâncreas em alta resolução
│   ├── icon.svg                      # Ícone vetorial clínico do aplicativo / PWA
│   ├── manifest.webmanifest          # Manifesto PWA instalável (standalone, tema clínico escuro)
│   └── sw.js                         # Service Worker para cache offline das malhas .GLB e app shell
├── scripts/
│   ├── download-anatomical-models.ps1 # Script automatizado de download das malhas abertas via curl
│   └── build-atlas-glb.mjs            # Compilador que empacota as malhas BodyParts3D em binário GLB 2.0
├── src/
│   ├── components/
│   │   ├── Viewer3D.tsx              # Canvas WebGL 2, BVH raycasting, Vista Explodida 3D e shaders PBR
│   │   ├── Viewport3D.tsx            # Re-exportação modular do componente 3D
│   │   ├── QuizOverlayCard.tsx       # Painel do Modo Quiz com estatísticas de domínio por sistema
│   │   ├── MobileBottomDock.tsx      # Dock inferior unificado e popovers de corte/vistas para mobile
│   │   └── LegalSourcesModal.tsx     # Modal de conformidade, fontes científicas e licenças abertas
│   ├── hooks/
│   │   ├── useDissectionHistory.ts   # Histórico Undo/Redo (Ctrl+Z/Ctrl+Y), Deep Linking URL e busca NFD
│   │   └── useQuizAndFavorites.ts    # Persistência em localStorage de recordes do Quiz e Favoritos
│   ├── data/
│   │   └── anatomyCatalog.ts         # Catálogo anatômico TA98, notas clínicas e referências de modelos
│   ├── App.tsx                       # Orquestração da interface, árvore de sistemas e inspetor clínico
│   ├── main.tsx                      # Ponto de entrada React e registro do Service Worker PWA
│   └── styles.css                    # Sistema de estilos responsivo (Desktop, Tablet e Mobile)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** `18+` (ou `20+`) e **npm** instalados.

### Passo a Passo

```bash
# 1. Instale as dependências do projeto
npm install

# 2. (Opcional) Re-executar o download e compilação dos modelos .GLB em public/models/
powershell -ExecutionPolicy Bypass -File scripts/download-anatomical-models.ps1

# 3. Inicie o servidor de desenvolvimento Vite
npm run dev
```

Para gerar a versão otimizada de produção:

```bash
npm run build
npm run preview
```

---

## 📜 Créditos Científicos, Fontes de Modelos 3D e Licenças

1. **BodyParts3D / Anatomography (DBCLS — Database Center for Life Science, Japão)**
   - **Licença**: [Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)
   - **Uso**: Geometrias anatômicas tridimensionais dos sistemas esquelético, muscular, nervoso, cardiovascular, respiratório, digestório e urinário compiladas em `public/models/human_anatomy_atlas.glb`.
2. **Open-Source High-Resolution Organ Models (`thebuggeddev/anatomy` & `ashemag/human-atlas`)**
   - **Licença**: CC BY-SA 4.0 / MIT Open Source
   - **Uso**: Modelos `.glb` isolados de órgãos em `public/models/`.
3. **Terminologia Anatomica (TA98 / TA2 — FIPAT / IFAA)**
   - **Organização**: *Federative International Programme for Anatomical Terminology*
   - **Uso**: Códigos internacionais `TA98` e nomenclatura oficial em Latim e Português.
