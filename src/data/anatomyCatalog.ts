export type SystemId =
  | 'skeletal'
  | 'muscular'
  | 'cardiovascular'
  | 'nervous'
  | 'respiratory'
  | 'digestive';

export type RegionId =
  | 'head_neck'
  | 'thorax'
  | 'abdomen_pelvis'
  | 'upper_limb'
  | 'lower_limb';

export interface AnatomicalSystem {
  id: SystemId;
  name: string;
  latinName: string;
  color: string;
  description: string;
}

export interface AnatomicalRegion {
  id: RegionId;
  name: string;
  latinName: string;
}

export interface AnatomicalStructure {
  id: string;
  name: string;
  latinName: string;
  ta98Code: string;
  system: SystemId;
  region: RegionId;
  summary: string;
  description: string;
  clinicalNotes: string;
  relations: string[];
  color: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  sheenColor?: string;
  defaultOpacity?: number;
  center: [number, number, number];
  labelOffset: [number, number, number];
}

export interface BuiltinGlbModelInfo {
  id: string;
  name: string;
  latinName: string;
  url: string;
  sizeMB: string;
  description: string;
}

export interface LegalModelSource {
  id: string;
  title: string;
  organization: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  usageInApp: string;
}

export const BUILTIN_GLB_MODELS: BuiltinGlbModelInfo[] = [
  {
    id: 'atlas_full',
    name: 'Corpo Humano Completo (BodyParts3D Atlas)',
    latinName: 'Corpus humanum completum (102 sub-malhas)',
    url: '/models/human_anatomy_atlas.glb',
    sizeMB: '18.8 MB',
    description:
      'Atlas anatômico 3D completo compilado a partir do BodyParts3D (DBCLS) com 33 estruturas e 102 sub-malhas anatômicas reais separadas.',
  },
  {
    id: 'heart_hires',
    name: 'Coração Isolado Alta Resolução (.GLB)',
    latinName: 'Cor (High-Res GLB)',
    url: '/models/heart.glb',
    sizeMB: '3.2 MB',
    description: 'Malha 3D isolada de alta densidade do coração e vasos da base.',
  },
  {
    id: 'brain_hires',
    name: 'Encéfalo Isolado Alta Resolução (.GLB)',
    latinName: 'Encephalon (High-Res GLB)',
    url: '/models/brain.glb',
    sizeMB: '2.5 MB',
    description: 'Malha 3D detalhada dos giros corticais, cerebelo e tronco encefálico.',
  },
  {
    id: 'lungs_hires',
    name: 'Pulmões e Traqueia Alta Resolução (.GLB)',
    latinName: 'Pulmones et Trachea (High-Res GLB)',
    url: '/models/lungs.glb',
    sizeMB: '4.3 MB',
    description: 'Malha 3D de alta resolução dos pulmões direito e esquerdo com árvore traqueobrônquica.',
  },
  {
    id: 'liver_hires',
    name: 'Fígado Isolado Alta Resolução (.GLB)',
    latinName: 'Hepar (High-Res GLB)',
    url: '/models/liver.glb',
    sizeMB: '2.5 MB',
    description: 'Malha 3D detalhada dos lobos hepáticos e hilo portal.',
  },
  {
    id: 'kidneys_hires',
    name: 'Rins Isolados Alta Resolução (.GLB)',
    latinName: 'Renes (High-Res GLB)',
    url: '/models/kidneys.glb',
    sizeMB: '2.1 MB',
    description: 'Malha 3D detalhada dos rins e pedículos renais.',
  },
  {
    id: 'intestine_hires',
    name: 'Intestinos Alta Resolução (.GLB)',
    latinName: 'Intestinum (High-Res GLB)',
    url: '/models/intestine.glb',
    sizeMB: '1.9 MB',
    description: 'Malha 3D detalhada das alças intestinais e cólon.',
  },
  {
    id: 'pancreas_hires',
    name: 'Pâncreas Alta Resolução (.GLB)',
    latinName: 'Pancreas (High-Res GLB)',
    url: '/models/pancreas.glb',
    sizeMB: '4.6 MB',
    description: 'Malha 3D detalhada da cabeça, corpo, cauda e ducto pancreático.',
  },
];

export const ANATOMICAL_SYSTEMS: AnatomicalSystem[] = [
  {
    id: 'skeletal',
    name: 'Sistema Esquelético',
    latinName: 'Systema skeletale',
    color: '#e8dcc8',
    description:
      'Arcabouço osteocartilaginoso real (BodyParts3D) responsável pela sustentação mecânica, proteção visceral, alavanca articular e hematopoiese.',
  },
  {
    id: 'muscular',
    name: 'Sistema Muscular',
    latinName: 'Systema musculare',
    color: '#c94a4a',
    description:
      'Conjunto de músculos estriados esqueléticos responsáveis pela locomoção, postura, estabilização articular e termogênese.',
  },
  {
    id: 'cardiovascular',
    name: 'Sistema Cardiovascular',
    latinName: 'Systema cardiovasculare',
    color: '#e11d48',
    description:
      'Coração (câmaras e aparelho valvar) e grandes árvores arteriais e venosas que asseguram a circulação sistêmica e pulmonar.',
  },
  {
    id: 'nervous',
    name: 'Sistema Nervoso',
    latinName: 'Systema nervosum',
    color: '#f59e0b',
    description:
      'Hemisférios cerebrais, núcleos profundos, sistema ventricular, cerebelo, tronco encefálico e nervos cranianos.',
  },
  {
    id: 'respiratory',
    name: 'Sistema Respiratório',
    latinName: 'Systema respiratorium',
    color: '#f472b6',
    description:
      'Laringe, traqueia, brônquios principais, árvore brônquica segmentar e parênquima pulmonar direito e esquerdo.',
  },
  {
    id: 'digestive',
    name: 'Sistema Digestório e Urinário',
    latinName: 'Systema digestorium et urinarium',
    color: '#d97706',
    description:
      'Vísceras abdominais, segmentos hepáticos de Couinaud, vias biliares, pâncreas, baço, tubo digestório e sistema renal.',
  },
];

export const ANATOMICAL_REGIONS: AnatomicalRegion[] = [
  { id: 'head_neck', name: 'Cabeça e Pescoço', latinName: 'Caput et Collum' },
  { id: 'thorax', name: 'Tórax e Mediastino', latinName: 'Thorax' },
  { id: 'abdomen_pelvis', name: 'Abdome e Pelve', latinName: 'Abdomen et Pelvis' },
  { id: 'upper_limb', name: 'Membro Superior', latinName: 'Membrum superius' },
  { id: 'lower_limb', name: 'Membro Inferior', latinName: 'Membrum inferius' },
];

export const LEGAL_MODEL_SOURCES: LegalModelSource[] = [
  {
    id: 'bodyparts3d',
    title: 'BodyParts3D / Anatomography (Malhas 3D Reais Ativas)',
    organization: 'Database Center for Life Science (DBCLS, Tóquio, Japão)',
    license: 'CC BY-SA 2.1 Japan (Creative Commons Attribution-ShareAlike 2.1 JP)',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
    sourceUrl: 'https://lifesciencedb.jp/bp3d/',
    usageInApp:
      'Malhas anatômicas 3D reais compiladas em public/models/human_anatomy_atlas.glb (33 estruturas e 102 sub-malhas anatômicas selecionáveis).',
  },
  {
    id: 'opensource-organs-glb',
    title: 'Open-Source High-Res Organ GLB Models (TA2)',
    organization: 'Repositório Público GitHub (thebuggeddev/anatomy & ashemag/human-atlas)',
    license: 'CC BY-SA / MIT Open Source',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://github.com/ashemag/human-atlas',
    usageInApp:
      'Modelos .GLB reais baixados em public/models/ (heart.glb, brain.glb, lungs.glb, liver.glb, kidneys.glb, intestine.glb, pancreas.glb).',
  },
  {
    id: 'z-anatomy',
    title: 'Z-Anatomy Open Source Atlas',
    organization: 'Z-Anatomy Project (Comunidade Open Source)',
    license: 'CC BY-SA 4.0 International',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://www.z-anatomy.com/',
    usageInApp:
      'Organização hierárquica por sistemas/regiões e compatibilidade direta com exportações GLTF/GLB no módulo de importação.',
  },
  {
    id: 'nih-3d',
    title: 'NIH 3D / Human Reference Atlas (HuBMAP)',
    organization: 'National Institutes of Health (NIAID / NIH)',
    license: 'CC BY 4.0 / CC0 Public Domain',
    licenseUrl: 'https://3d.nih.gov/terms',
    sourceUrl: 'https://3d.nih.gov/',
    usageInApp:
      'Referência anatômica aberta de órgãos torácicos e abdominais e fonte compatível para importação direta de arquivos .GLB.',
  },
  {
    id: 'ta98-ifaa',
    title: 'Terminologia Anatomica (TA98 / TA2)',
    organization: 'Federative International Programme for Anatomical Terminology (FIPAT / IFAA)',
    license: 'Padrão Científico Internacional Aberto',
    licenseUrl: 'https://fipat.library.dal.ca/',
    sourceUrl: 'https://fipat.library.dal.ca/ta2/',
    usageInApp:
      'Códigos oficiais TA98 e nomenclatura anatômica internacional em Latim e Português.',
  },
];

export const ANATOMICAL_STRUCTURES: AnatomicalStructure[] = [
  // ==================== SISTEMA ESQUELÉTICO ====================
  {
    id: 'cranium',
    name: 'Crânio (Neurocrânio e Viscerocrânio)',
    latinName: 'Cranium (Neurocranium et Viscerocranium)',
    ta98Code: 'A02.1.00.001',
    system: 'skeletal',
    region: 'head_neck',
    summary: 'Conjunto ósseo do neurocrânio (frontal, parietais, temporais, occipital, esfenoide, etmoide) e esqueleto facial superior.',
    description:
      'Malha anatômica real subdividida nos ossos frontal, parietais direito e esquerdo, temporais direito e esquerdo, occipital, esfenoide, etmoide, maxilas, zigomáticos, ossos próprios do nariz e arcada dentária superior.',
    clinicalNotes:
      'O pterion (junção fronto-parieto-temporo-esfenoidal) recobre o ramo anterior da artéria meníngea média; fraturas nessa região podem causar hematoma epidural agudo.',
    relations: ['Mandíbula', 'Cérebro (Telencéfalo)', 'Cerebelo', 'Coluna Cervical (C1–C7)'],
    color: '#ede3ce',
    roughness: 0.44,
    metalness: 0.02,
    clearcoat: 0.14,
    clearcoatRoughness: 0.48,
    center: [-0.002, 2.325, -0.033],
    labelOffset: [0, 2.58, 0.08],
  },
  {
    id: 'mandible',
    name: 'Mandíbula',
    latinName: 'Mandibula',
    ta98Code: 'A02.1.15.001',
    system: 'skeletal',
    region: 'head_neck',
    summary: 'Único osso móvel do crânio, articulado na ATM e portador da arcada dentária inferior.',
    description:
      'Composta pelo corpo mandibular em ferradura, ramos ascendentes direito e esquerdo com processos condilar e coronoide, além da arcada dentária inferior completa.',
    clinicalNotes:
      'O canal da mandíbula conduz o feixe vasculonervoso alveolar inferior até o forame mentual; referência essencial para bloqueios anestésicos odontológicos e bucomaxilofaciais.',
    relations: ['Crânio (Neurocrânio e Viscerocrânio)', 'Coluna Cervical (C1–C7)'],
    color: '#e8dec8',
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 0.15,
    clearcoatRoughness: 0.45,
    center: [-0.002, 2.132, 0.083],
    labelOffset: [0.18, 2.12, 0.18],
  },
  {
    id: 'cervical_spine',
    name: 'Coluna Cervical (C1–C7)',
    latinName: 'Vertebrae cervicales [CI–CVII]',
    ta98Code: 'A02.2.02.001',
    system: 'skeletal',
    region: 'head_neck',
    summary: 'Segmento superior da coluna vertebral contendo o Atlas (C1), o Áxis (C2), as vértebras C3–C7 e o osso hioide.',
    description:
      'Subdividida nas malhas reais do Atlas (C1), Áxis (C2 com dente/processo odontoide), vértebras cervicais C3 a C7 com forames transversários, discos intervertebrais cervicais e osso hioide.',
    clinicalNotes:
      'Os forames transversários de C6 a C1 conduzem as artérias vertebrais rumo ao forame magno para formar a artéria basilar.',
    relations: ['Crânio (Neurocrânio e Viscerocrânio)', 'Coluna Torácica (T1–T12)', 'Tronco Encefálico e Nervos Cranianos'],
    color: '#e6dbc4',
    roughness: 0.46,
    metalness: 0.02,
    center: [-0.001, 2.027, -0.06],
    labelOffset: [-0.18, 2.03, -0.06],
  },
  {
    id: 'sternum',
    name: 'Esterno',
    latinName: 'Sternum (Manubrium, Corpus et Processus xiphoideus)',
    ta98Code: 'A02.3.03.001',
    system: 'skeletal',
    region: 'thorax',
    summary: 'Osso plano mediano anterior do tórax subdividido em manúbrio, corpo esternal e processo xifoide.',
    description:
      'Articula-se superiormente com as clavículas e lateralmente com as cartilagens costais das costelas verdadeiras (I–VII). O ângulo esternal (de Louis) marca a 2ª cartilagem costal.',
    clinicalNotes:
      'Via de acesso cirúrgico ao mediastino (esternotomia mediana) e ponto de referência para compressões torácicas na reanimação cardiopulmonar.',
    relations: ['Caixa Torácica (Costelas)', 'Clavículas (Cintura Escapular)', 'Coração', 'Músculos Peitorais e Serrátil'],
    color: '#ece2cf',
    roughness: 0.44,
    metalness: 0.02,
    center: [0, 1.601, 0.175],
    labelOffset: [0, 1.66, 0.24],
  },
  {
    id: 'rib_cage',
    name: 'Caixa Torácica (Costelas)',
    latinName: 'Costae [I–XII] et Cartilagines costales',
    ta98Code: 'A02.3.01.001',
    system: 'skeletal',
    region: 'thorax',
    summary: 'Doze pares de costelas e cartilagens costais que formam o arcabouço protetor do tórax.',
    description:
      'Subdividida nas costelas verdadeiras direitas e esquerdas (I–VII) e nas costelas falsas e flutuantes direitas e esquerdas (VIII–XII). Protege os pulmões, o coração, os grandes vasos e os órgãos do andar supramesocólico.',
    clinicalNotes:
      'O feixe vasculonervoso intercostal percorre o sulco costal na borda inferior de cada costela; punções pleurais devem ser feitas na borda superior da costela inferior.',
    relations: ['Esterno', 'Coluna Torácica (T1–T12)', 'Pulmão Direito', 'Pulmão Esquerdo', 'Fígado e Vias Biliares'],
    color: '#e5dac3',
    roughness: 0.46,
    metalness: 0.02,
    center: [-0.002, 1.467, 0.02],
    labelOffset: [-0.36, 1.50, 0.14],
  },
  {
    id: 'clavicles',
    name: 'Clavículas (Cintura Escapular)',
    latinName: 'Clavicula dextra et sinistra',
    ta98Code: 'A02.4.02.001',
    system: 'skeletal',
    region: 'upper_limb',
    summary: 'Ossos longos em dupla curvatura que conectam o manúbrio esternal ao acrômio de cada escápula.',
    description:
      'Contém as malhas anatômicas reais da clavícula direita e da clavícula esquerda, estabelecendo a única conexão óssea direta entre o esqueleto apendicular superior e o esqueleto axial.',
    clinicalNotes:
      'O terço médio da clavícula é o ponto mais frequente de fraturas devido à transição de curvatura e menor cobertura muscular.',
    relations: ['Esterno', 'Escápulas', 'Músculo Deltoide e Manguito Rotador', 'Músculos Peitorais e Serrátil'],
    color: '#ede3d0',
    roughness: 0.42,
    metalness: 0.02,
    center: [-0.002, 1.812, 0.002],
    labelOffset: [0.22, 1.86, 0.12],
  },
  {
    id: 'scapulae',
    name: 'Escápulas',
    latinName: 'Scapula dextra et sinistra',
    ta98Code: 'A02.4.01.001',
    system: 'skeletal',
    region: 'upper_limb',
    summary: 'Ossos planos triangulares póstero-laterais do tórax que formam a cavidade glenoide do ombro.',
    description:
      'Subdividida nas malhas reais da escápula direita e esquerda, exibindo a espinha da escápula, o acrômio, o processo coracoide, as fossas supraespinhal, infraespinhal e subescapular, e a cavidade glenoide.',
    clinicalNotes:
      'A lesão do nervo torácico longo paralisa o músculo serrátil anterior e provoca a "escápula alada" (protrusão da borda medial da escápula).',
    relations: ['Clavículas (Cintura Escapular)', 'Úmeros (Direito e Esquerdo)', 'Músculo Deltoide e Manguito Rotador'],
    color: '#e3d7c0',
    roughness: 0.46,
    metalness: 0.02,
    center: [0, 1.655, -0.124],
    labelOffset: [-0.32, 1.68, -0.18],
  },
  {
    id: 'thoracic_spine',
    name: 'Coluna Torácica (T1–T12)',
    latinName: 'Vertebrae thoracicae [TI–TXII]',
    ta98Code: 'A02.2.03.001',
    system: 'skeletal',
    region: 'thorax',
    summary: 'Doze vértebras torácicas e seus discos intervertebrais articulados com os pares de costelas.',
    description:
      'Subdividida nos corpos e arcos vertebrais torácicos (T1–T12) e nos discos intervertebrais torácicos. Apresenta processos espinhosos longos e oblíquos e fóveas costais para as articulações costovertebrais.',
    clinicalNotes:
      'Forma a cifose torácica fisiológica e protege a medula espinhal torácica no canal vertebral.',
    relations: ['Caixa Torácica (Costelas)', 'Coluna Cervical (C1–C7)', 'Coluna Lombar (L1–L5)', 'Aorta e Árvore Arterial'],
    color: '#e2d6be',
    roughness: 0.48,
    metalness: 0.02,
    center: [-0.001, 1.526, -0.119],
    labelOffset: [0.20, 1.53, -0.18],
  },
  {
    id: 'lumbar_spine',
    name: 'Coluna Lombar (L1–L5)',
    latinName: 'Vertebrae lumbales [LI–LV]',
    ta98Code: 'A02.2.04.001',
    system: 'skeletal',
    region: 'abdomen_pelvis',
    summary: 'Cinco vértebras lombares volumosas e discos intervertebrais que sustentam o peso do tronco.',
    description:
      'Subdividida nas vértebras lombares L1–L5 e nos discos intervertebrais lombares. Seus corpos vertebrais maciços transmitem a carga axial ao sacro na transição lombossacral (L5–S1).',
    clinicalNotes:
      'Os níveis L4–L5 e L5–S1 concentram mais de 90% das hérnias discais lombares. A punção liquórica lombar é realizada com segurança nos espaços L3–L4 ou L4–L5.',
    relations: ['Coluna Torácica (T1–T12)', 'Sacro e Pelve Óssea', 'Rins, Ureteres e Bexiga', 'Aorta e Árvore Arterial'],
    color: '#e5dac3',
    roughness: 0.46,
    metalness: 0.02,
    center: [-0.002, 0.977, -0.08],
    labelOffset: [-0.20, 0.98, -0.14],
  },
  {
    id: 'pelvis_sacrum',
    name: 'Sacro e Pelve Óssea',
    latinName: 'Os sacrum, Os coccygis et Cingulum pelvicum (Os coxae)',
    ta98Code: 'A02.5.01.001',
    system: 'skeletal',
    region: 'abdomen_pelvis',
    summary: 'Anel pélvico formado pelos ossos coxais direito e esquerdo (ílio, ísquio e púbis), sacro e cóccix.',
    description:
      'Subdividida em Osso Coxal Direito, Osso Coxal Esquerdo e Sacro/Cóccix. Transmite as forças da coluna vertebral às cabeças femorais através das articulações sacroilíacas e dos acetábulos.',
    clinicalNotes:
      'Delimita a cavidade pélvica que aloja a bexiga urinária, o reto e os órgãos reprodutores internos.',
    relations: ['Coluna Lombar (L1–L5)', 'Fêmures (Direito e Esquerdo)', 'Músculos Glúteos, Coxa e Perna'],
    color: '#e7dcc6',
    roughness: 0.46,
    metalness: 0.02,
    center: [0, 0.658, -0.083],
    labelOffset: [0.34, 0.70, 0.06],
  },
  {
    id: 'humeri',
    name: 'Úmeros (Direito e Esquerdo)',
    latinName: 'Humerus dexter et sinister',
    ta98Code: 'A02.4.04.001',
    system: 'skeletal',
    region: 'upper_limb',
    summary: 'Ossos longos do braço articulados na cavidade glenoide da escápula e no cotovelo.',
    description:
      'Subdividida em Úmero Direito e Úmero Esquerdo. Apresenta cabeça esférica, tubérculos maior e menor, sulco intertubercular, diáfise com sulco do nervo radial e epífise distal com tróclea e capítulo.',
    clinicalNotes:
      'Fraturas do colo cirúrgico relacionam-se com o nervo axilar; fraturas do terço médio da diáfise com o nervo radial.',
    relations: ['Escápulas', 'Rádio, Ulna e Ossos da Mão', 'Músculo Deltoide e Manguito Rotador', 'Músculos do Braço e Antebraço'],
    color: '#ebe0cc',
    roughness: 0.44,
    metalness: 0.02,
    center: [0, 1.452, -0.059],
    labelOffset: [-0.46, 1.45, 0.02],
  },
  {
    id: 'forearm_hand',
    name: 'Rádio, Ulna e Ossos da Mão',
    latinName: 'Radius, Ulna et Ossa manus (Carpi, Metacarpi, Phalanges)',
    ta98Code: 'A02.4.05.001',
    system: 'skeletal',
    region: 'upper_limb',
    summary: 'Esqueleto completo do antebraço (rádio e ulna) e das mãos (carpo, metacarpo e falanges).',
    description:
      'Subdividida em Rádio e Ulna Direitos/Esquerdos e Ossos da Mão Direita/Esquerda (8 ossos do carpo, 5 metacarpos e 14 falanges de cada mão). Permite a pronossupinação radioulnar e a preensão fina.',
    clinicalNotes:
      'A fratura da extremidade distal do rádio (fratura de Colles) e a fratura do escafoide são as lesões ósseas mais frequentes em quedas sobre a mão espalmada.',
    relations: ['Úmeros (Direito e Esquerdo)', 'Músculos do Braço e Antebraço'],
    color: '#e9dec9',
    roughness: 0.44,
    metalness: 0.02,
    center: [0, 0.653, 0.048],
    labelOffset: [-0.62, 0.72, 0.08],
  },
  {
    id: 'femora',
    name: 'Fêmures (Direito e Esquerdo)',
    latinName: 'Femur (Os femoris)',
    ta98Code: 'A02.5.04.001',
    system: 'skeletal',
    region: 'lower_limb',
    summary: 'Osso mais longo, volumoso e resistente do esqueleto humano, formando o eixo da coxa.',
    description:
      'Subdividida nas malhas reais do Fêmur Direito e Fêmur Esquerdo, compreendendo cabeça femoral, colo anatômico, trocânteres maior e menor, diáfise femoral e côndilos medial e lateral.',
    clinicalNotes:
      'Fraturas intracapsulares do colo femoral comprometem os ramos retinaculares da artéria circunflexa femoral medial, com risco de necrose avascular da cabeça do fêmur.',
    relations: ['Sacro e Pelve Óssea', 'Patela, Tíbia, Fíbula e Ossos do Pé', 'Músculos Glúteos, Coxa e Perna'],
    color: '#ebe0cc',
    roughness: 0.44,
    metalness: 0.02,
    center: [0, 0.043, -0.046],
    labelOffset: [-0.30, 0.08, 0.08],
  },
  {
    id: 'tibia_fibula_foot',
    name: 'Patela, Tíbia, Fíbula e Ossos do Pé',
    latinName: 'Patella, Tibia, Fibula et Ossa pedis',
    ta98Code: 'A02.5.06.001',
    system: 'skeletal',
    region: 'lower_limb',
    summary: 'Esqueleto da perna (patela, tíbia e fíbula) e do pé (tarso, metatarso e falanges).',
    description:
      'Subdividida em Patela/Tíbia/Fíbula Direitas e Esquerdas e Ossos do Pé Direito e Esquerdo (tálus, calcâneo, navicular, cuboide, cuneiformes, metatarsos e falanges).',
    clinicalNotes:
      'A tíbia suporta cerca de 85% da carga axial da perna, transmitindo-a à tróclea do tálus na articulação talocrural (tornozelo).',
    relations: ['Fêmures (Direito e Esquerdo)', 'Músculos Glúteos, Coxa e Perna'],
    color: '#e8ddc8',
    roughness: 0.45,
    metalness: 0.02,
    center: [0, -0.95, 0.04],
    labelOffset: [-0.28, -0.95, 0.12],
  },

  // ==================== SISTEMA NERVOSO ====================
  {
    id: 'cerebrum',
    name: 'Cérebro (Telencéfalo e Diencéfalo)',
    latinName: 'Telencephalon et Diencephalon (Cerebrum)',
    ta98Code: 'A14.1.09.001',
    system: 'nervous',
    region: 'head_neck',
    summary: 'Hemisférios cerebrais direito e esquerdo, corpo caloso, tálamo, núcleos da base e sistema ventricular.',
    description:
      'Subdividida em Hemisfério Cerebral Direito, Hemisfério Cerebral Esquerdo, Corpo Caloso/Tálamo/Hipocampo/Núcleos da Base e Sistema Ventricular Encefálico (ventrículos laterais, III e IV ventrículos).',
    clinicalNotes:
      'Irrigado pelos sistemas carotídeo interno e vertebrobasilar anastomosados no polígono de Willis. O giro pré-central sedia o córtex motor primário.',
    relations: ['Crânio (Neurocrânio e Viscerocrânio)', 'Cerebelo', 'Tronco Encefálico e Nervos Cranianos'],
    color: '#f59e0b',
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.42,
    clearcoatRoughness: 0.22,
    center: [-0.002, 2.366, -0.049],
    labelOffset: [-0.24, 2.46, 0.06],
  },
  {
    id: 'cerebellum',
    name: 'Cerebelo',
    latinName: 'Cerebellum et Tentorium cerebelli',
    ta98Code: 'A14.1.07.001',
    system: 'nervous',
    region: 'head_neck',
    summary: 'Órgão da fossa craniana posterior responsável pela coordenação motora, equilíbrio e tônus muscular.',
    description:
      'Subdividida nos Hemisférios Cerebelares e Vérmis e no Tentório do Cerebelo. Possui córtex pregueado em folhas cerebelares e conexões através dos pedúnculos cerebelares superior, médio e inferior.',
    clinicalNotes:
      'Lesões hemisféricas cerebelares provocam ataxia, dismetria, disdiadococinesia e tremor intencional ipsilaterais.',
    relations: ['Cérebro (Telencéfalo e Diencéfalo)', 'Tronco Encefálico e Nervos Cranianos', 'Crânio (Neurocrânio e Viscerocrânio)'],
    color: '#d97706',
    roughness: 0.36,
    metalness: 0.04,
    clearcoat: 0.38,
    clearcoatRoughness: 0.25,
    center: [-0.013, 2.254, -0.122],
    labelOffset: [0.22, 2.24, -0.18],
  },
  {
    id: 'brainstem_spinal_cord',
    name: 'Tronco Encefálico e Nervos Cranianos',
    latinName: 'Truncus encephali et Nervi craniales',
    ta98Code: 'A14.1.03.001',
    system: 'nervous',
    region: 'head_neck',
    summary: 'Mesencéfalo, ponte, bulbo e ramos dos nervos cranianos e ópticos.',
    description:
      'Subdividida em Tronco Encefálico (Mesencéfalo, Ponte e Bulbo) e Nervos Cranianos/Ópticos. Contém os núcleos dos pares cranianos e os tratos ascendentes e descendentes que comunicam o cérebro à medula espinhal.',
    clinicalNotes:
      'Sedia os centros vitais de controle cardiovascular e respiratório na formação reticular pontobulbar.',
    relations: ['Cérebro (Telencéfalo e Diencéfalo)', 'Cerebelo', 'Coluna Cervical (C1–C7)'],
    color: '#fbbf24',
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.40,
    clearcoatRoughness: 0.22,
    center: [-0.002, 2.243, 0.044],
    labelOffset: [0.20, 2.20, 0.08],
  },

  // ==================== SISTEMA CARDIOVASCULAR ====================
  {
    id: 'heart',
    name: 'Coração',
    latinName: 'Cor (Atria, Ventriculi et Valvae cordis)',
    ta98Code: 'A12.1.00.001',
    system: 'cardiovascular',
    region: 'thorax',
    summary: 'Bomba muscular tetracavitária no mediastino médio com câmaras atrioventriculares e aparelho valvar completo.',
    description:
      'Subdividida em 5 sub-malhas anatômicas reais: Câmaras Ventriculares (Direita e Esquerda), Átrio Direito, Átrio Esquerdo, Valvas Cardíacas (Mitral, Tricúspide, Aórtica e Pulmonar) e Músculos Papilares.',
    clinicalNotes:
      'Irrigado pelas artérias coronárias direita e esquerda originadas nos seios de Valsalva da aorta ascendente.',
    relations: ['Aorta e Árvore Arterial', 'Veias Cavas e Árvore Venosa', 'Pulmão Direito', 'Pulmão Esquerdo', 'Esterno'],
    color: '#dc2626',
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.58,
    clearcoatRoughness: 0.16,
    center: [0.052, 1.558, 0.057],
    labelOffset: [0.18, 1.56, 0.22],
  },
  {
    id: 'aorta',
    name: 'Aorta e Árvore Arterial',
    latinName: 'Aorta et Systema arteriale',
    ta98Code: 'A12.2.01.001',
    system: 'cardiovascular',
    region: 'thorax',
    summary: 'Aorta ascendente, arco aórtico, aorta descendente e principais troncos arteriais sistêmicos.',
    description:
      'Subdividida em Aorta (Ascendente, Arco e Descendente), Artérias Cervicocefálicas e do Membro Superior, e Ramos Viscerais Abdominais, Ilíacos e Femorotibiais.',
    clinicalNotes:
      'O arco aórtico origina o tronco braquiocefálico, a artéria carótida comum esquerda e a artéria subclávia esquerda; a aorta abdominal bifurca-se ao nível de L4.',
    relations: ['Coração', 'Veias Cavas e Árvore Venosa', 'Rins, Ureteres e Bexiga', 'Coluna Torácica (T1–T12)'],
    color: '#ef4444',
    roughness: 0.28,
    metalness: 0.06,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    center: [0, 1.15, -0.02],
    labelOffset: [0.16, 1.72, 0.12],
  },
  {
    id: 'venae_cavae',
    name: 'Veias Cavas e Árvore Venosa',
    latinName: 'Venae cavae, Vena portae et Systema venosum',
    ta98Code: 'A12.3.03.001',
    system: 'cardiovascular',
    region: 'thorax',
    summary: 'Veias cavas superior e inferior, sistema porta hepático, veias renais e drenagem venosa dos membros.',
    description:
      'Subdividida em Veias Cavas Central/Jugulares/Ázigos, Sistema Porta Hepático/Veias Hepáticas/Renais, e Rede Venosa Superficial e Profunda dos Membros (cefálica, basílica, safenas, femorais).',
    clinicalNotes:
      'A veia porta hepática conduz o sangue venoso esplâncnico do trato gastrointestinal e do baço para os sinusoides hepáticos.',
    relations: ['Coração', 'Aorta e Árvore Arterial', 'Fígado e Vias Biliares', 'Rins, Ureteres e Bexiga'],
    color: '#2563eb',
    roughness: 0.30,
    metalness: 0.06,
    clearcoat: 0.52,
    clearcoatRoughness: 0.18,
    center: [-0.04, 1.18, -0.02],
    labelOffset: [-0.18, 1.70, 0.12],
  },

  // ==================== SISTEMA RESPIRATÓRIO ====================
  {
    id: 'trachea_bronchi',
    name: 'Laringe, Traqueia e Brônquios Principais',
    latinName: 'Larynx, Trachea et Bronchi principales',
    ta98Code: 'A06.3.01.001',
    system: 'respiratory',
    region: 'thorax',
    summary: 'Via aérea condutora formada pelas cartilagens laríngeas, epiglote, traqueia e carina brônquica.',
    description:
      'Subdividida em Laringe/Epiglote/Traqueia e Brônquios Principais Direito e Esquerdo. O brônquio principal direito é mais vertical, curto e calibroso que o esquerdo.',
    clinicalNotes:
      'A bifurcação traqueal (carina) situa-se ao nível do ângulo esternal (T4–T5).',
    relations: ['Pulmão Direito', 'Pulmão Esquerdo', 'Aorta e Árvore Arterial'],
    color: '#38bdf8',
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.45,
    clearcoatRoughness: 0.20,
    center: [0.027, 1.877, 0.084],
    labelOffset: [0, 1.92, 0.16],
  },
  {
    id: 'right_lung',
    name: 'Pulmão Direito',
    latinName: 'Pulmo dexter et Arbor bronchialis dextra',
    ta98Code: 'A06.5.01.002',
    system: 'respiratory',
    region: 'thorax',
    summary: 'Parênquima pulmonar direito (lobos superior, médio e inferior) e árvore brônquica segmentar direita.',
    description:
      'Subdividida no Parênquima Pulmonar Direito externo e na Árvore Brônquica Segmentar Direita interna (10 segmentos broncopulmonares). Ao ocultar ou aplicar Raio-X no parênquima, visualiza-se toda a árvore brônquica interna.',
    clinicalNotes:
      'Possui duas fissuras (oblíqua e horizontal) que delimitam três lobos pulmonares.',
    relations: ['Pulmão Esquerdo', 'Laringe, Traqueia e Brônquios Principais', 'Coração', 'Caixa Torácica (Costelas)', 'Diafragma e Parede Abdominal'],
    color: '#f472b6',
    roughness: 0.36,
    metalness: 0.03,
    clearcoat: 0.42,
    clearcoatRoughness: 0.24,
    center: [-0.163, 1.585, -0.008],
    labelOffset: [-0.32, 1.62, 0.16],
  },
  {
    id: 'left_lung',
    name: 'Pulmão Esquerdo',
    latinName: 'Pulmo sinister et Arbor bronchialis sinistra',
    ta98Code: 'A06.5.01.003',
    system: 'respiratory',
    region: 'thorax',
    summary: 'Parênquima pulmonar esquerdo (lobo superior com língula e lobo inferior) e árvore brônquica esquerda.',
    description:
      'Subdividida no Parênquima Pulmonar Esquerdo externo e na Árvore Brônquica Segmentar Esquerda interna. Exibe a incisura cardíaca na borda anterior do lobo superior para acomodar o coração.',
    clinicalNotes:
      'Dividido pela fissura oblíqua nos lobos superior (que inclui os segmentos lingulares superior e inferior) e inferior.',
    relations: ['Pulmão Direito', 'Laringe, Traqueia e Brônquios Principais', 'Coração', 'Caixa Torácica (Costelas)', 'Diafragma e Parede Abdominal'],
    color: '#ec4899',
    roughness: 0.36,
    metalness: 0.03,
    clearcoat: 0.42,
    clearcoatRoughness: 0.24,
    center: [0.175, 1.585, -0.003],
    labelOffset: [0.32, 1.62, 0.16],
  },

  // ==================== SISTEMA DIGESTÓRIO E URINÁRIO ====================
  {
    id: 'liver',
    name: 'Fígado e Vias Biliares',
    latinName: 'Hepar (Segmenta I–VIII) et Vesica biliaris',
    ta98Code: 'A05.8.01.001',
    system: 'digestive',
    region: 'abdomen_pelvis',
    summary: 'Maior glândula do corpo humano subdividida nos lobos hepáticos de Couinaud, lobo caudado e vesícula biliar.',
    description:
      'Subdividida em 4 sub-malhas anatômicas reais: Lobo Hepático Direito (Segmentos V–VIII), Lobo Hepático Esquerdo (Segmentos II–IV), Lobo Caudado (Segmento I) e Vesícula Biliar/Ductos Biliares.',
    clinicalNotes:
      'A segmentação funcional de Couinaud baseia-se na distribuição intra-hepática da tríade portal e das três veias hepáticas, permitindo hepatectomias regradas.',
    relations: ['Esôfago, Estômago e Baço', 'Intestino Delgado, Cólon e Pâncreas', 'Diafragma e Parede Abdominal', 'Veias Cavas e Árvore Venosa'],
    color: '#9a3412',
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.56,
    clearcoatRoughness: 0.16,
    center: [-0.025, 1.254, 0.055],
    labelOffset: [-0.24, 1.26, 0.18],
  },
  {
    id: 'stomach',
    name: 'Esôfago, Estômago e Baço',
    latinName: 'Oesophagus, Gaster et Splen (Lien)',
    ta98Code: 'A05.5.01.001',
    system: 'digestive',
    region: 'abdomen_pelvis',
    summary: 'Tubo esofágico, câmara gástrica (cárdia, fundo, corpo e piloro) e baço no hipocôndrio esquerdo.',
    description:
      'Subdividida em Estômago, Esôfago e Baço. O estômago recebe o bolo alimentar do esôfago através da cárdia e esvazia o quimo no bulbo duodenal através do esfíncter pilórico.',
    clinicalNotes:
      'Irrigado pelos três ramos do tronco celíaco (artérias gástrica esquerda, esplênica e hepática comum). O baço situa-se posterolateralmente ao fundo gástrico, protegido pela 9ª à 11ª costelas esquerdas.',
    relations: ['Fígado e Vias Biliares', 'Intestino Delgado, Cólon e Pâncreas', 'Diafragma e Parede Abdominal'],
    color: '#ea580c',
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.50,
    clearcoatRoughness: 0.18,
    center: [0.103, 1.22, 0.049],
    labelOffset: [0.24, 1.22, 0.16],
  },
  {
    id: 'intestines_colon',
    name: 'Intestino Delgado, Cólon e Pâncreas',
    latinName: 'Intestinum tenue, Intestinum crassum et Pancreas',
    ta98Code: 'A05.6.01.001',
    system: 'digestive',
    region: 'abdomen_pelvis',
    summary: 'Pâncreas, duodeno, jejuno, íleo, ceco, apêndice, cólon (ascendente, transverso, descendente) e reto.',
    description:
      'Subdividida em Pâncreas e Ducto Pancreático, Intestino Delgado (Duodeno, Jejuno e Íleo) e Intestino Grosso (Ceco, Apêndice, Cólon Ascendente, Transverso, Descendente, Tênias e Reto).',
    clinicalNotes:
      'A cabeça do pâncreas é abraçada pelo arco duodenal em "C" e recebe o ducto colédoco na ampola hepatopancreática (de Vater).',
    relations: ['Esôfago, Estômago e Baço', 'Fígado e Vias Biliares', 'Rins, Ureteres e Bexiga'],
    color: '#d97706',
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.48,
    clearcoatRoughness: 0.20,
    center: [-0.012, 0.81, 0.01],
    labelOffset: [0.24, 0.84, 0.16],
  },
  {
    id: 'kidneys',
    name: 'Rins, Ureteres e Bexiga',
    latinName: 'Renes, Glandulae suprarenales, Ureteres et Vesica urinaria',
    ta98Code: 'A08.1.01.001',
    system: 'digestive',
    region: 'abdomen_pelvis',
    summary: 'Sistema urinário retroperitoneal e pélvico: rins direito e esquerdo, suprarrenais, ureteres e bexiga urinária.',
    description:
      'Subdividida em Rim e Glândula Suprarrenal Direitos, Rim e Glândula Suprarrenal Esquerdos, e Ureteres/Bexiga Urinária/Uretra.',
    clinicalNotes:
      'Os ureteres descem sobre o músculo psoas maior e cruzam anteriormente a bifurcação das artérias ilíacas comuns ao entrar na pelve.',
    relations: ['Aorta e Árvore Arterial', 'Veias Cavas e Árvore Venosa', 'Coluna Lombar (L1–L5)', 'Fígado e Vias Biliares'],
    color: '#b91c1c',
    roughness: 0.30,
    metalness: 0.05,
    clearcoat: 0.54,
    clearcoatRoughness: 0.18,
    center: [0.003, 0.92, -0.03],
    labelOffset: [-0.24, 1.02, -0.02],
  },

  // ==================== SISTEMA MUSCULAR ====================
  {
    id: 'pectoralis_major',
    name: 'Músculos Peitorais e Serrátil',
    latinName: 'Musculus pectoralis major, pectoralis minor et serratus anterior',
    ta98Code: 'A04.4.01.002',
    system: 'muscular',
    region: 'thorax',
    summary: 'Musculatura toracoapendicular anterior: peitoral maior (direito e esquerdo), peitoral menor e serrátil anterior.',
    description:
      'Subdividida em Músculo Peitoral Maior Direito, Músculo Peitoral Maior Esquerdo e Músculos Peitoral Menor/Serrátil Anterior. Atuam na adução, flexão e rotação medial do úmero e na estabilização da escápula contra a parede torácica.',
    clinicalNotes:
      'Ao aplicar Raio-X ou ocultar o peitoral maior, expõe-se o peitoral menor (inserido no processo coracoide) e o gradeado costal subjacente.',
    relations: ['Esterno', 'Clavículas (Cintura Escapular)', 'Caixa Torácica (Costelas)', 'Músculo Deltoide e Manguito Rotador'],
    color: '#be123c',
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    center: [0, 1.526, 0.017],
    labelOffset: [-0.28, 1.58, 0.18],
  },
  {
    id: 'deltoid',
    name: 'Músculo Deltoide e Manguito Rotador',
    latinName: 'Musculus deltoideus et Musculi cuffiae rotatoriae',
    ta98Code: 'A04.6.02.002',
    system: 'muscular',
    region: 'upper_limb',
    summary: 'Músculo deltoide (porções clavicular, acromial e espinhal) e manguito rotador (supraespinhal, infraespinhal, redondo menor e subescapular).',
    description:
      'Subdividida em Deltoide Direito, Deltoide Esquerdo, Manguito Rotador Posterior (supraespinhal, infraespinhal e redondos) e Músculo Subescapular.',
    clinicalNotes:
      'O supraespinhal inicia a abdução do ombro nos primeiros 15°, enquanto o deltoide é o abdução principal de 15° a 90°. O tendão do supraespinhal é o mais acometido na síndrome do impacto subacromial.',
    relations: ['Clavículas (Cintura Escapular)', 'Escápulas', 'Úmeros (Direito e Esquerdo)', 'Músculos do Braço e Antebraço'],
    color: '#9f1239',
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    center: [0, 1.666, -0.1],
    labelOffset: [0.38, 1.70, 0.02],
  },
  {
    id: 'biceps_brachii',
    name: 'Músculos do Braço e Antebraço',
    latinName: 'Musculus biceps brachii, brachialis, triceps brachii et Musculi antebrachii',
    ta98Code: 'A04.6.02.013',
    system: 'muscular',
    region: 'upper_limb',
    summary: 'Compartimentos anterior e posterior do braço (bíceps, braquial e tríceps) e musculatura do antebraço.',
    description:
      'Subdividida em Bíceps Braquial e Braquial Direitos, Bíceps Braquial e Braquial Esquerdos, Tríceps Braquial, e Músculos Flexores/Extensores do Antebraço.',
    clinicalNotes:
      'O compartimento anterior do braço é inervado pelo nervo musculocutâneo; o compartimento posterior (tríceps) e os extensores do antebraço pelo nervo radial.',
    relations: ['Úmeros (Direito e Esquerdo)', 'Rádio, Ulna e Ossos da Mão', 'Músculo Deltoide e Manguito Rotador'],
    color: '#be123c',
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    center: [0, 1.25, 0.02],
    labelOffset: [0.42, 1.32, 0.08],
  },
  {
    id: 'trapezius_dorsal',
    name: 'Músculos Trapézio, Cervical e Dorso',
    latinName: 'Musculus trapezius, sternocleidomastoideus, latissimus dorsi et erector spinae',
    ta98Code: 'A04.3.01.001',
    system: 'muscular',
    region: 'thorax',
    summary: 'Trapézio, esternocleidomastoideo, levantador da escápula, grande dorsal e eretores da espinha.',
    description:
      'Subdividida em Trapézio e Esternocleidomastoideo, Grande Dorsal e Eretores da Espinha (longuíssimo e iliocostal), e Levantador da Escápula.',
    clinicalNotes:
      'O músculo trapézio e o esternocleidomastoideo recebem inervação motora do nervo acessório (XI par craniano).',
    relations: ['Escápulas', 'Coluna Cervical (C1–C7)', 'Coluna Torácica (T1–T12)', 'Coluna Lombar (L1–L5)'],
    color: '#a21caf',
    roughness: 0.40,
    metalness: 0.03,
    clearcoat: 0.34,
    clearcoatRoughness: 0.28,
    center: [0, 1.417, -0.082],
    labelOffset: [-0.30, 1.62, -0.16],
  },
  {
    id: 'diaphragm_abdominal',
    name: 'Diafragma e Parede Abdominal',
    latinName: 'Diaphragma, Musculi abdominis et Musculus iliopsoas',
    ta98Code: 'A04.4.02.001',
    system: 'muscular',
    region: 'abdomen_pelvis',
    summary: 'Cúpula diafragmática toracoabdominal, músculos oblíquos, reto abdominal e iliopsoas.',
    description:
      'Subdividida no Diafragma Toracoabdominal (principal músculo da inspiração) e nos Músculos da Parede Abdominal e Iliopsoas.',
    clinicalNotes:
      'O diafragma é inervado pelos nervos frênicos (C3–C5) e apresenta três hiatos principais: forame da veia cava (T8), hiato esofágico (T10) e hiato aórtico (T12).',
    relations: ['Caixa Torácica (Costelas)', 'Pulmão Direito', 'Pulmão Esquerdo', 'Fígado e Vias Biliares', 'Esôfago, Estômago e Baço'],
    color: '#b91c1c',
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    center: [0, 1.12, 0.04],
    labelOffset: [-0.28, 1.15, 0.16],
  },
  {
    id: 'lower_limb_muscles',
    name: 'Músculos Glúteos, Coxa e Perna',
    latinName: 'Musculi membri inferioris (Glutei, Quadriceps, Ischiocrurales et Triceps surae)',
    ta98Code: 'A04.7.02.001',
    system: 'muscular',
    region: 'lower_limb',
    summary: 'Musculatura glútea, quadríceps femoral, adutores, isquiotibiais, gastrocnêmio, sóleo e compartimentos da perna.',
    description:
      'Subdividida em 4 grupos de sub-malhas: Músculos Glúteos (Máximo, Médio, Mínimo e Pelvitrocantéricos), Quadríceps Femoral/Sartório/Adutores/Isquiotibiais, Tríceps Sural (Gastrocnêmio e Sóleo) e Músculos Tibiais/Fibulares.',
    clinicalNotes:
      'O quadríceps femoral (inervado pelo nervo femoral, L2–L4) é o principal extensor do joelho; o tríceps sural (nervo tibial, S1–S2) realiza a flexão plantar do tornozelo através do tendão calcâneo (de Aquiles).',
    relations: ['Sacro e Pelve Óssea', 'Fêmures (Direito e Esquerdo)', 'Patela, Tíbia, Fíbula e Ossos do Pé'],
    color: '#be123c',
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    center: [0, -0.346, 0.003],
    labelOffset: [0.34, -0.25, 0.12],
  },
];
