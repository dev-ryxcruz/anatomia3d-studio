# 🩻 Anatomia3D Studio — Atlas Anatômico Interativo WebGL 2 (.GLB / BodyParts3D)

![WebGL 2](https://img.shields.io/badge/WebGL_2.0-Three.js_r170-06b6d4?style=for-the-badge&logo=three.js&logoColor=white)
![React 18](https://img.shields.io/badge/React-18.3-2563eb?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![BodyParts3D](https://img.shields.io/badge/Malhas_3D-BodyParts3D_%2F_DBCLS-10b981?style=for-the-badge)
![TA98 / IFAA](https://img.shields.io/badge/Nomenclatura-TA98_%2F_IFAA-f59e0b?style=for-the-badge)

**Anatomia3D Studio** é uma plataforma web interativa de estudo, dissecação virtual e inspeção de anatomia humana em 3D, executada diretamente no navegador via **WebGL 2.0**, **Three.js** e **React Three Fiber**.

O projeto utiliza **malhas anatômicas 3D reais (`.glb`)** compiladas a partir do acervo científico aberto **BodyParts3D / Anatomography (DBCLS)** e modelos de órgãos em alta densidade, estruturadas sob a **Terminologia Anatômica Internacional (TA98 / TA2 — FIPAT/IFAA)** em Português e Latim.

---

## ✨ Principais Funcionalidades 3D

- **Malhas Anatômicas 3D Reais (`.GLB` BodyParts3D)**:
  - **33 estruturas anatômicas** e **102 sub-malhas 3D reais independentes** (~423.000 vértices / ~790.000 triângulos) em `public/models/human_anatomy_atlas.glb`.
  - Inclui ainda **7 modelos `.GLB` de alta densidade de órgãos isolados** (`heart.glb`, `brain.glb`, `lungs.glb`, `liver.glb`, `kidneys.glb`, `intestine.glb` e `pancreas.glb`) alternáveis em tempo real.
- **Raycasting por Sub-Malha & Dissecação Virtual Multicamadas**:
  - Clique diretamente em qualquer osso, câmara cardíaca, valva, giro cerebral, lobo hepático, segmento brônquico ou ventre muscular na cena 3D ou expanda a hierarquia na árvore lateral.
  - Ações individuais por **Sistema**, **Estrutura** ou **Sub-Malha (`.GLB`)**:
    - 🎯 **Focar Câmera** (interpolação orbital suave para o centroide 3D real da peça)
    - 🔬 **Isolar Peça / Grupo** (oculta todas as demais malhas para estudo focado)
    - 👻 **Modo Raio-X** (transparência seletiva para visualizar órgãos profundos sob a caixa torácica ou musculatura)
    - 👁️ **Ocultar / Exibir** camadas superficiais e profundas
- **Planos de Corte Anatômicos em Tempo Real (*Cross-Section Clipping*)**:
  - Cortes dinâmicos nos eixos **Axial (Transversal)**, **Sagital (Mediano)** e **Coronal (Frontal)** com controle de posição contínua e inversão de hemicorpo.
- **Shaders Físicos (`MeshPhysicalMaterial`) & Iluminação de Estúdio Clínico**:
  - Materiais PBR calibrados para diferentes tecidos biológicos: osso cortical trabecular, esmalte dentário, cartilagem hialina/discos intervertebrais, músculo estriado esquelético e membranas serosas viscerais (pericárdio, pleura e peritônio) com `clearcoat`, `sheen`, `RoomEnvironment` e `ACESFilmicToneMapping`.
- **Etiquetas 3D Inteligentes (*Smart Pin Labels*)**:
  - Desativadas por padrão na visão geral para evitar poluição visual, exibindo automaticamente a etiqueta 3D sobre a peça em *hover* ou selecionada (com opção de ativar todas as etiquetas na barra superior).
- **Modo Quiz Anatômico Interativo**:
  - Avaliação prática de identificação anatômica diretamente sobre o modelo 3D com pontuação, sequência de acertos (*streak*) e feedback imediato.
- **Importação e Exportação `.GLB` / `.GLTF` + Captura PNG**:
  - Importe qualquer arquivo `.glb` ou `.gltf` externo (com normalização automática de escala e mapeamento de sub-malhas no raycasting) ou exporte qualquer peça selecionada como `.glb` independente.

---

## 🛠️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Função no Projeto |
| :--- | :--- | :--- |
| **Motor Gráfico 3D** | `Three.js` (`r170`) + WebGL 2.0 | Renderização PBR, `GLTFLoader`, `MeshoptDecoder`, `GLTFExporter`, `PMREMGenerator` e planos de corte (`THREE.Plane`) |
| **Integração React 3D** | `@react-three/fiber` + `@react-three/drei` | Grafo de cena declarativo, `OrbitControls` com amortecimento, `Html` 3D pins e `ContactShadows` |
| **Interface & Estado** | `React 18.3` + `TypeScript 5.6` | Árvore hierárquica de sistemas/sub-malhas, busca instantânea por nome/Latim/TA98, inspetor clínico e layout responsivo |
| **Ícones & Design** | `Lucide React` + CSS Grid/Glassmorphism | Interface clínica escura de alto contraste responsiva para desktop, tablets e smartphones |
| **Build & Bundler** | `Vite 6` | Servidor de desenvolvimento ultrarrápido e empacotamento otimizado para produção |

---

## 📂 Estrutura de Pastas

```text
Anatomia3D/
├── public/
│   └── models/
│       ├── human_anatomy_atlas.glb   # Atlas corporal completo BodyParts3D (33 estruturas / 102 sub-malhas)
│       ├── atlas_metadata.json       # Metadados espaciais e contagem de vértices/triângulos por sub-malha
│       ├── heart.glb                 # Coração isolado em alta resolução
│       ├── brain.glb                 # Encéfalo isolado em alta resolução
│       ├── lungs.glb                 # Pulmões e árvore traqueobrônquica em alta resolução
│       ├── liver.glb                 # Fígado isolado em alta resolução
│       ├── kidneys.glb               # Rins isolados em alta resolução
│       ├── intestine.glb             # Intestinos em alta resolução
│       └── pancreas.glb              # Pâncreas em alta resolução
├── scripts/
│   ├── download-anatomical-models.ps1 # Script automatizado de download das malhas abertas via curl
│   └── build-atlas-glb.mjs            # Compilador que empacota as malhas BodyParts3D em binário GLB 2.0
├── src/
│   ├── components/
│   │   ├── Viewer3D.tsx              # Canvas WebGL 2, shaders físicos, iluminação de estúdio e raycasting
│   │   └── Viewport3D.tsx            # Re-exportação modular do componente 3D
│   ├── data/
│   │   └── anatomyCatalog.ts         # Catálogo anatômico TA98, notas clínicas e referências de modelos
│   ├── App.tsx                       # Interface principal, árvore de sub-malhas, filtros e Modo Quiz
│   ├── main.tsx                      # Ponto de entrada React
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
