import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptDecoder } from '../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';

await MeshoptDecoder.ready;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(__dirname, '..', '.cache_bodyparts3d');
const modelsDir = path.join(__dirname, '..', 'public', 'models');

const atlasJson = JSON.parse(fs.readFileSync(path.join(cacheDir, 'atlas.json'), 'utf8'));

// Load all 15 BodyParts3D binary chunks into memory
const chunks = [];
for (let i = 0; i < atlasJson.chunks.length; i++) {
  chunks.push(fs.readFileSync(path.join(cacheDir, `body-${i}.bin`)));
}

// Coordinate transform from BodyParts3D (meters, Y=0..1.73) to Studio space (Y=-1.60..+2.58)
const SCALE = 2.42;
const Y_OFFSET = -1.60;

function transformPos(x, y, z) {
  return [x * SCALE, y * SCALE + Y_OFFSET, z * SCALE];
}

// Classify BodyParts3D part into { structureId, subMeshId, subMeshName, latinName }
function classifyPart(p) {
  const n = p.name;
  const sys = p.system;

  // Exclude skin/hair/mesentery/intercostal sheets that obscure the internal skeleton & organs
  if (/^(skin|hair of head|pubic hair|eyebrow|lip)$/i.test(n)) return null;
  if (/mesentery of small intestine|intercostal muscle|transversus thoracis|rotator|gingiva/i.test(n)) return null;
  if (/set of (dorsal|plantar) digital|tributary of.*hepatic|palatopharyngeus|stylopharyngeus|salpingopharyngeus|pharyngeal constrictor|aryepiglottic|corona ciliaris|sclera|choroid|check ligament/i.test(n)) return null;

  // ==================== 1. HEPATOVENOUS SEGMENTS -> LIVER ====================
  if (/hepatovenous segment|caudate lobe of liver/i.test(n)) {
    const isRight = /segment (V|VI|VII|VIII)\b/i.test(n);
    const isLeft = /segment (II|III|IV)\b/i.test(n);
    if (isRight) {
      return {
        structureId: 'liver',
        subMeshId: 'liver_right_lobe',
        subMeshName: 'Lobo Hepático Direito (Segmentos V–VIII)',
        latinName: 'Lobus hepatis dexter (Segmenta V–VIII)',
      };
    }
    if (isLeft) {
      return {
        structureId: 'liver',
        subMeshId: 'liver_left_lobe',
        subMeshName: 'Lobo Hepático Esquerdo (Segmentos II–IV)',
        latinName: 'Lobus hepatis sinister (Segmenta II–IV)',
      };
    }
    return {
      structureId: 'liver',
      subMeshId: 'liver_caudate_lobe',
      subMeshName: 'Lobo Caudado do Fígado (Segmento I/IX)',
      latinName: 'Lobus caudatus hepatis',
    };
  }
  if (/gallbladder|cystic duct|common hepatic duct|left hepatic duct|right hepatic duct|biliary tree/i.test(n)) {
    return {
      structureId: 'liver',
      subMeshId: 'gallbladder_biliary',
      subMeshName: 'Vesícula Biliar e Vias Biliares',
      latinName: 'Vesica biliaris et Ductus biliferi',
    };
  }

  // ==================== 2. BRAIN VENTRICLES (in cardiac by mistake) ====================
  if (/third ventricle|fourth ventricle|lateral ventricle|interventricular foramen/i.test(n)) {
    return {
      structureId: 'cerebrum',
      subMeshId: 'brain_ventricles',
      subMeshName: 'Sistema Ventricular Encefálico (Ventrículos Laterais, III e IV)',
      latinName: 'Ventriculi encephali',
    };
  }

  // ==================== 3. SKELETAL SYSTEM (plus misclassified muscles) ====================
  if (sys === 'skeletal') {
    // Check if it's actually a muscle placed in skeletal
    if (/subscapularis/i.test(n)) {
      return {
        structureId: 'deltoid',
        subMeshId: 'rotator_cuff_subscapularis',
        subMeshName: 'Músculo Subescapular (Manguito Rotador)',
        latinName: 'Musculus subscapularis',
      };
    }
    if (/levator scapulae/i.test(n)) {
      return {
        structureId: 'trapezius_dorsal',
        subMeshId: 'levator_scapulae',
        subMeshName: 'Músculo Levantador da Escápula',
        latinName: 'Musculus levator scapulae',
      };
    }
    if (/tibialis|fibularis|iliotibial/i.test(n)) {
      return {
        structureId: 'lower_limb_muscles',
        subMeshId: 'leg_compartment_muscles',
        subMeshName: 'Músculos Tibiais, Fibulares e Trato Iliotibial',
        latinName: 'Musculi cruris et Tractus iliotibialis',
      };
    }

    // Cranium & Upper Teeth
    if (/frontal bone/i.test(n)) {
      return { structureId: 'cranium', subMeshId: 'cranium_frontal', subMeshName: 'Osso Frontal', latinName: 'Os frontale' };
    }
    if (/parietal bone/i.test(n)) {
      const side = /left/i.test(n) ? 'left' : 'right';
      return {
        structureId: 'cranium',
        subMeshId: `cranium_parietal_${side}`,
        subMeshName: side === 'left' ? 'Osso Parietal Esquerdo' : 'Osso Parietal Direito',
        latinName: 'Os parietale',
      };
    }
    if (/occipital bone/i.test(n)) {
      return { structureId: 'cranium', subMeshId: 'cranium_occipital', subMeshName: 'Osso Occipital', latinName: 'Os occipitale' };
    }
    if (/temporal bone/i.test(n)) {
      const side = /left/i.test(n) ? 'left' : 'right';
      return {
        structureId: 'cranium',
        subMeshId: `cranium_temporal_${side}`,
        subMeshName: side === 'left' ? 'Osso Temporal Esquerdo' : 'Osso Temporal Direito',
        latinName: 'Os temporale',
      };
    }
    if (/sphenoid|ethmoid/i.test(n)) {
      return {
        structureId: 'cranium',
        subMeshId: 'cranium_sphenoid_ethmoid',
        subMeshName: 'Ossos Esfenoide e Etmoide (Base do Crânio)',
        latinName: 'Os sphenoidale et Os ethmoidale',
      };
    }
    if (/maxilla|zygomatic|nasal|lacrimal|palatine|vomer/i.test(n)) {
      return {
        structureId: 'cranium',
        subMeshId: 'cranium_viscerocranium',
        subMeshName: 'Maxilas, Zigomáticos e Ossos da Face',
        latinName: 'Viscerocranium (Maxilla, Os zygomaticum, Os nasale)',
      };
    }
    if (/upper.*tooth/i.test(n)) {
      return {
        structureId: 'cranium',
        subMeshId: 'cranium_upper_teeth',
        subMeshName: 'Arcada Dentária Superior',
        latinName: 'Arcus dentalis superior',
      };
    }

    // Mandible & Lower Teeth
    if (/mandible/i.test(n)) {
      return { structureId: 'mandible', subMeshId: 'mandible_bone', subMeshName: 'Corpo e Ramos da Mandíbula', latinName: 'Mandibula' };
    }
    if (/lower.*tooth/i.test(n)) {
      return { structureId: 'mandible', subMeshId: 'mandible_lower_teeth', subMeshName: 'Arcada Dentária Inferior', latinName: 'Arcus dentalis inferior' };
    }

    // Cervical Spine
    if (/^atlas$/i.test(n)) {
      return { structureId: 'cervical_spine', subMeshId: 'cervical_c1_atlas', subMeshName: 'Atlas (Vértebra C1)', latinName: 'Atlas [CI]' };
    }
    if (/^axis$/i.test(n)) {
      return { structureId: 'cervical_spine', subMeshId: 'cervical_c2_axis', subMeshName: 'Áxis (Vértebra C2)', latinName: 'Axis [CII]' };
    }
    if (/cervical vertebra|hyoid|disk of.*cervical|disk of axis/i.test(n)) {
      return {
        structureId: 'cervical_spine',
        subMeshId: 'cervical_c3_c7',
        subMeshName: 'Vértebras Cervicais (C3–C7), Discos e Osso Hioide',
        latinName: 'Vertebrae cervicales [CIII–CVII] et Os hyoideum',
      };
    }

    // Thoracic Spine
    if (/thoracic vertebra|disk of.*thoracic/i.test(n)) {
      const isDisk = /disk/i.test(n);
      return {
        structureId: 'thoracic_spine',
        subMeshId: isDisk ? 'thoracic_disks' : 'thoracic_vertebrae',
        subMeshName: isDisk ? 'Discos Intervertebrais Torácicos' : 'Corpos e Arcos Vertebrais Torácicos (T1–T12)',
        latinName: isDisk ? 'Disci intervertebrales thoracici' : 'Vertebrae thoracicae [TI–TXII]',
      };
    }

    // Lumbar Spine
    if (/lumbar vertebra|disk of.*lumbar|^intervertebral disk$/i.test(n)) {
      const isDisk = /disk/i.test(n);
      return {
        structureId: 'lumbar_spine',
        subMeshId: isDisk ? 'lumbar_disks' : 'lumbar_vertebrae',
        subMeshName: isDisk ? 'Discos Intervertebrais Lombares' : 'Vértebras Lombares (L1–L5)',
        latinName: isDisk ? 'Disci intervertebrales lumbales' : 'Vertebrae lumbales [LI–LV]',
      };
    }

    // Sternum
    if (/sternum|manubrium|xiphoid/i.test(n)) {
      return {
        structureId: 'sternum',
        subMeshId: /manubrium/i.test(n) ? 'sternum_manubrium' : /xiphoid/i.test(n) ? 'sternum_xiphoid' : 'sternum_body',
        subMeshName: /manubrium/i.test(n) ? 'Manúbrio do Esterno' : /xiphoid/i.test(n) ? 'Processo Xifoide' : 'Corpo do Esterno',
        latinName: 'Sternum',
      };
    }

    // Rib cage
    if (/rib|costal cartilage/i.test(n)) {
      const isLeft = /left/i.test(n);
      const isUpper = /(first|second|third|fourth|fifth|sixth|seventh) rib/i.test(n);
      if (isLeft) {
        return {
          structureId: 'rib_cage',
          subMeshId: isUpper ? 'ribs_left_true' : 'ribs_left_false',
          subMeshName: isUpper ? 'Costelas Verdadeiras Esquerdas (I–VII)' : 'Costelas Falsas e Flutuantes Esquerdas (VIII–XII)',
          latinName: 'Costae sinistrae',
        };
      }
      return {
        structureId: 'rib_cage',
        subMeshId: isUpper ? 'ribs_right_true' : 'ribs_right_false',
        subMeshName: isUpper ? 'Costelas Verdadeiras Direitas (I–VII)' : 'Costelas Falsas e Flutuantes Direitas (VIII–XII)',
        latinName: 'Costae dextrae',
      };
    }

    // Clavicles
    if (/clavicle/i.test(n)) {
      const isLeft = /left/i.test(n);
      return {
        structureId: 'clavicles',
        subMeshId: isLeft ? 'clavicle_left' : 'clavicle_right',
        subMeshName: isLeft ? 'Clavícula Esquerda' : 'Clavícula Direita',
        latinName: 'Clavicula',
      };
    }

    // Scapulae
    if (/scapula/i.test(n)) {
      const isLeft = /left/i.test(n);
      return {
        structureId: 'scapulae',
        subMeshId: isLeft ? 'scapula_left' : 'scapula_right',
        subMeshName: isLeft ? 'Escápula Esquerda' : 'Escápula Direita',
        latinName: 'Scapula',
      };
    }

    // Sacrum & Pelvis
    if (/sacrum|coccyx|hip bone|ilium|ischium|pubis|pubic symphysis/i.test(n)) {
      if (/sacrum|coccyx/i.test(n)) {
        return {
          structureId: 'pelvis_sacrum',
          subMeshId: 'pelvis_sacrum_coccyx',
          subMeshName: 'Osso Sacro e Cóccix',
          latinName: 'Os sacrum et Os coccygis',
        };
      }
      const isLeft = /left/i.test(n);
      return {
        structureId: 'pelvis_sacrum',
        subMeshId: isLeft ? 'pelvis_hip_left' : 'pelvis_hip_right',
        subMeshName: isLeft ? 'Osso Coxal Esquerdo (Ílio, Ísquio e Púbis)' : 'Osso Coxal Direito (Ílio, Ísquio e Púbis)',
        latinName: 'Os coxae',
      };
    }

    // Humeri
    if (/humerus/i.test(n)) {
      const isLeft = /left/i.test(n);
      return {
        structureId: 'humeri',
        subMeshId: isLeft ? 'humerus_left' : 'humerus_right',
        subMeshName: isLeft ? 'Úmero Esquerdo' : 'Úmero Direito',
        latinName: 'Humerus',
      };
    }

    // Forearm & Hand bones
    if (/radius|ulna|metacarpal|carpal|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|finger|thumb/i.test(n)) {
      if (/radius|ulna/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'forearm_hand',
          subMeshId: isLeft ? 'forearm_left' : 'forearm_right',
          subMeshName: isLeft ? 'Rádio e Ulna Esquerdos' : 'Rádio e Ulna Direitos',
          latinName: 'Radius et Ulna',
        };
      }
      const isLeft = /left/i.test(n);
      return {
        structureId: 'forearm_hand',
        subMeshId: isLeft ? 'hand_bones_left' : 'hand_bones_right',
        subMeshName: isLeft ? 'Ossos da Mão Esquerda (Carpo, Metacarpo e Falanges)' : 'Ossos da Mão Direita (Carpo, Metacarpo e Falanges)',
        latinName: 'Ossa manus (Carpi, Metacarpi et Phalanges)',
      };
    }

    // Femora
    if (/femur/i.test(n)) {
      const isLeft = /left/i.test(n);
      return {
        structureId: 'femora',
        subMeshId: isLeft ? 'femur_left' : 'femur_right',
        subMeshName: isLeft ? 'Fêmur Esquerdo' : 'Fêmur Direito',
        latinName: 'Femur',
      };
    }

    // Tibia, Fibula, Patella & Foot bones
    if (/tibia|fibula|patella|metatarsal|tarsal|calcaneus|talus|navicular|cuboid|cuneiform|toe|foot/i.test(n)) {
      if (/tibia|fibula|patella/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'tibia_fibula_foot',
          subMeshId: isLeft ? 'crus_bones_left' : 'crus_bones_right',
          subMeshName: isLeft ? 'Patela, Tíbia e Fíbula Esquerdas' : 'Patela, Tíbia e Fíbula Direitas',
          latinName: 'Patella, Tibia et Fibula',
        };
      }
      const isLeft = /left/i.test(n);
      return {
        structureId: 'tibia_fibula_foot',
        subMeshId: isLeft ? 'foot_bones_left' : 'foot_bones_right',
        subMeshName: isLeft ? 'Ossos do Pé Esquerdo (Tarso, Metatarso e Falanges)' : 'Ossos do Pé Direito (Tarso, Metatarso e Falanges)',
        latinName: 'Ossa pedis (Tarsi, Metatarsi et Phalanges)',
      };
    }
  }

  // ==================== 4. NERVOUS SYSTEM ====================
  if (sys === 'nervous') {
    if (/cerebellum|tentorium cerebelli/i.test(n)) {
      return {
        structureId: 'cerebellum',
        subMeshId: /tentorium/i.test(n) ? 'cerebellum_tentorium' : 'cerebellum_hemispheres',
        subMeshName: /tentorium/i.test(n) ? 'Tentório do Cerebelo' : 'Hemisférios Cerebelares e Vérmis',
        latinName: 'Cerebellum',
      };
    }
    if (/pons|medulla|spinal cord|midbrain|cerebral peduncle|optic|oculomotor|trochlear|trigeminal|abducens|facial|vagus|nerve|ganglion/i.test(n)) {
      const isNerve = /nerve|ganglion/i.test(n);
      return {
        structureId: 'brainstem_spinal_cord',
        subMeshId: isNerve ? 'cranial_nerves' : 'brainstem_pons_medulla',
        subMeshName: isNerve ? 'Nervos Cranianos e Ópticos' : 'Tronco Encefálico (Mesencéfalo, Ponte e Bulbo)',
        latinName: isNerve ? 'Nervi craniales' : 'Truncus encephali',
      };
    }
    // Telencephalon / Diencephalon
    if (/corpus callosum|fornix|septum|thalamus|hippocampus|caudate|putamen|pallidus|amygdala/i.test(n)) {
      return {
        structureId: 'cerebrum',
        subMeshId: 'cerebrum_deep_nuclei_callosum',
        subMeshName: 'Corpo Caloso, Tálamo, Hipocampo e Núcleos da Base',
        latinName: 'Corpus callosum, Diencephalon et Nuclei basales',
      };
    }
    const isLeft = /left/i.test(n);
    return {
      structureId: 'cerebrum',
      subMeshId: isLeft ? 'cerebrum_left_hemisphere' : 'cerebrum_right_hemisphere',
      subMeshName: isLeft ? 'Hemisfério Cerebral Esquerdo (Córtex e Substância Branca)' : 'Hemisfério Cerebral Direito (Córtex e Substância Branca)',
      latinName: isLeft ? 'Hemispherium cerebri sinistrum' : 'Hemispherium cerebri dextrum',
    };
  }

  // ==================== 5. CARDIOVASCULAR SYSTEM ====================
  if (sys === 'cardiac') {
    if (/ventricle/i.test(n)) {
      return {
        structureId: 'heart',
        subMeshId: 'heart_ventricles',
        subMeshName: 'Miocárdio e Câmaras Ventriculares (Direita e Esquerda)',
        latinName: 'Ventriculi cordis (Dexter et Sinister)',
      };
    }
    if (/atrium/i.test(n)) {
      const isLeft = /left/i.test(n);
      return {
        structureId: 'heart',
        subMeshId: isLeft ? 'heart_left_atrium' : 'heart_right_atrium',
        subMeshName: isLeft ? 'Átrio Esquerdo' : 'Átrio Direito',
        latinName: isLeft ? 'Atrium cordis sinistrum' : 'Atrium cordis dextrum',
      };
    }
    return {
      structureId: 'heart',
      subMeshId: 'heart_valves',
      subMeshName: 'Valvas Cardíacas (Mitral, Tricúspide, Aórtica e Pulmonar)',
      latinName: 'Valvae cordis',
    };
  }

  if (sys === 'arterial') {
    if (/papillary muscle/i.test(n)) {
      return {
        structureId: 'heart',
        subMeshId: 'heart_papillary',
        subMeshName: 'Músculos Papilares Cardíacos',
        latinName: 'Musculi papillares',
      };
    }
    if (/aorta|aortic|brachiocephalic|coronary/i.test(n)) {
      return {
        structureId: 'aorta',
        subMeshId: 'aorta_trunk_arch',
        subMeshName: 'Aorta Ascendente, Arco Aórtico, Aorta Torácica e Abdominal',
        latinName: 'Aorta ascendens, Arcus aortae et Aorta descendens',
      };
    }
    if (/carotid|cerebral|vertebral|basilar|subclavian|axillary|brachial|radial|ulnar/i.test(n)) {
      return {
        structureId: 'aorta',
        subMeshId: 'arteries_upper_head',
        subMeshName: 'Artérias Cervicocefálicas e do Membro Superior',
        latinName: 'Arteriae capitis, colli et membri superioris',
      };
    }
    if (/celiac|hepatic|splenic|gastric|mesenteric|renal|iliac|femoral|popliteal|tibial|fibular/i.test(n)) {
      return {
        structureId: 'aorta',
        subMeshId: 'arteries_visceral_lower',
        subMeshName: 'Ramos Viscerais Abdominais, Ilíacos e Femorotibiais',
        latinName: 'Arteriae abdominis, pelvis et membri inferioris',
      };
    }
    return null;
  }

  if (sys === 'venous') {
    if (/vena cava|brachiocephalic vein|azygos|jugular|subclavian vein/i.test(n)) {
      return {
        structureId: 'venae_cavae',
        subMeshId: 'venae_cavae_central',
        subMeshName: 'Veias Cavas Superior e Inferior, Jugulares e Sistema Ázigos',
        latinName: 'Vena cava superior, Vena cava inferior et Vena azygos',
      };
    }
    if (/portal vein|hepatic vein|renal vein|splenic vein|mesenteric vein/i.test(n)) {
      return {
        structureId: 'venae_cavae',
        subMeshId: 'venae_portal_renal_hepatic',
        subMeshName: 'Sistema Porta Hepático, Veias Hepáticas e Veias Renais',
        latinName: 'Vena portae hepatis, Venae hepaticae et Venae renales',
      };
    }
    if (/cephalic|basilic|brachial vein|ulnar vein|radial vein|iliac vein|femoral vein|saphenous|popliteal vein|tibial vein/i.test(n)) {
      return {
        structureId: 'venae_cavae',
        subMeshId: 'venae_limbs',
        subMeshName: 'Rede Venosa Superficial e Profunda dos Membros',
        latinName: 'Venae membri superioris et inferioris',
      };
    }
    return null;
  }

  // ==================== 6. RESPIRATORY SYSTEM ====================
  if (sys === 'respiratory') {
    if (/trachea|main bronchus|epiglottis|nasal cartilage|thyroid cartilage|cricoid/i.test(n)) {
      return {
        structureId: 'trachea_bronchi',
        subMeshId: /main bronchus/i.test(n) ? 'main_bronchi_carina' : 'trachea_larynx',
        subMeshName: /main bronchus/i.test(n) ? 'Brônquios Principais Direito e Esquerdo' : 'Laringe, Epiglote e Traqueia',
        latinName: 'Larynx, Trachea et Bronchi principales',
      };
    }
    if (/right.*bronchial tree|^lateral segmental bronchial|^medial segmental bronchial/i.test(n)) {
      return {
        structureId: 'right_lung',
        subMeshId: 'right_bronchial_tree',
        subMeshName: 'Árvore Brônquica Segmentar Direita',
        latinName: 'Arbor bronchialis dextra',
      };
    }
    if (/left.*bronchial tree|lingular bronchial tree/i.test(n)) {
      return {
        structureId: 'left_lung',
        subMeshId: 'left_bronchial_tree',
        subMeshName: 'Árvore Brônquica Segmentar Esquerda',
        latinName: 'Arbor bronchialis sinistra',
      };
    }
    return null;
  }

  // ==================== 7. DIGESTIVE & URINARY SYSTEM ====================
  if (sys === 'digestive' || sys === 'lymphatic') {
    if (/stomach|esophagus/i.test(n)) {
      return {
        structureId: 'stomach',
        subMeshId: /esophagus/i.test(n) ? 'esophagus_tube' : 'stomach_body',
        subMeshName: /esophagus/i.test(n) ? 'Esôfago Torácico e Abdominal' : 'Estômago (Fundo, Corpo e Antro Pilórico)',
        latinName: /esophagus/i.test(n) ? 'Oesophagus' : 'Gaster (Ventriculus)',
      };
    }
    if (/spleen/i.test(n)) {
      return {
        structureId: 'stomach',
        subMeshId: 'spleen_organ',
        subMeshName: 'Baço (Órgão Linfoide Esplênico)',
        latinName: 'Splen (Lien)',
      };
    }
    if (/pancreas|pancreatic/i.test(n)) {
      return {
        structureId: 'intestines_colon',
        subMeshId: 'pancreas_organ',
        subMeshName: 'Pâncreas e Ducto Pancreático Principal',
        latinName: 'Pancreas et Ductus pancreaticus',
      };
    }
    if (/duodenum|jejunum|ileum/i.test(n)) {
      return {
        structureId: 'intestines_colon',
        subMeshId: 'small_intestine',
        subMeshName: 'Intestino Delgado (Duodeno, Jejuno e Íleo)',
        latinName: 'Intestinum tenue (Duodenum, Jejunum et Ileum)',
      };
    }
    if (/colon|rectum|appendix|taenia|ileocecal/i.test(n)) {
      return {
        structureId: 'intestines_colon',
        subMeshId: 'large_intestine_colon',
        subMeshName: 'Intestino Grosso (Ceco, Cólon Ascendente, Transverso, Descendente e Reto)',
        latinName: 'Intestinum crassum (Colon et Rectum)',
      };
    }
    return null;
  }

  if (sys === 'urinary' || sys === 'endocrine') {
    if (/kidney|adrenal|ureter|bladder|urethra/i.test(n)) {
      if (/kidney|adrenal/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'kidneys',
          subMeshId: isLeft ? 'kidney_left' : 'kidney_right',
          subMeshName: isLeft ? 'Rim Esquerdo e Glândula Suprarrenal Esquerda' : 'Rim Direito e Glândula Suprarrenal Direita',
          latinName: isLeft ? 'Ren sinister et Glandula suprarenalis' : 'Ren dexter et Glandula suprarenalis',
        };
      }
      return {
        structureId: 'kidneys',
        subMeshId: 'ureters_bladder',
        subMeshName: 'Ureteres, Bexiga Urinária e Uretra',
        latinName: 'Ureteres et Vesica urinaria',
      };
    }
    return null;
  }

  // ==================== 8. MUSCULAR SYSTEM ====================
  if (sys === 'muscular') {
    if (/papillary muscle/i.test(n)) {
      return {
        structureId: 'heart',
        subMeshId: 'heart_papillary',
        subMeshName: 'Músculos Papilares Cardíacos',
        latinName: 'Musculi papillares',
      };
    }
    // Pectoralis Major & Minor & Serratus Anterior
    if (/pectoralis major|pectoralis minor|serratus anterior|subclavius/i.test(n)) {
      if (/pectoralis major/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'pectoralis_major',
          subMeshId: isLeft ? 'pectoralis_major_left' : 'pectoralis_major_right',
          subMeshName: isLeft ? 'Músculo Peitoral Maior Esquerdo' : 'Músculo Peitoral Maior Direito',
          latinName: 'Musculus pectoralis major',
        };
      }
      return {
        structureId: 'pectoralis_major',
        subMeshId: 'pectoralis_minor_serratus',
        subMeshName: 'Músculos Peitoral Menor e Serrátil Anterior',
        latinName: 'Musculus pectoralis minor et Musculus serratus anterior',
      };
    }

    // Deltoid & Rotator Cuff
    if (/deltoid|supraspinatus|infraspinatus|teres minor|teres major/i.test(n)) {
      if (/deltoid/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'deltoid',
          subMeshId: isLeft ? 'deltoid_left' : 'deltoid_right',
          subMeshName: isLeft ? 'Músculo Deltoide Esquerdo (Clavicular, Acromial e Espinhal)' : 'Músculo Deltoide Direito (Clavicular, Acromial e Espinhal)',
          latinName: 'Musculus deltoideus',
        };
      }
      return {
        structureId: 'deltoid',
        subMeshId: 'rotator_cuff_posterior',
        subMeshName: 'Manguito Rotador Posterior (Supraespinhal, Infraespinhal e Redondos)',
        latinName: 'Musculi supraspinatus, infraspinatus et teres',
      };
    }

    // Biceps, Triceps & Upper Limb Muscles
    if (/biceps brachii|triceps brachii|brachialis|coracobrachialis|brachioradialis|pronator|supinator|flexor carpi|extensor carpi|flexor digitorum|extensor digitorum|palmaris/i.test(n)) {
      if (/biceps brachii|brachialis|coracobrachialis/i.test(n)) {
        const isLeft = /left/i.test(n);
        return {
          structureId: 'biceps_brachii',
          subMeshId: isLeft ? 'biceps_left' : 'biceps_right',
          subMeshName: isLeft ? 'Bíceps Braquial e Braquial Esquerdos' : 'Bíceps Braquial e Braquial Direitos',
          latinName: 'Musculus biceps brachii et Musculus brachialis',
        };
      }
      if (/triceps brachii/i.test(n)) {
        return {
          structureId: 'biceps_brachii',
          subMeshId: 'triceps_brachii',
          subMeshName: 'Músculo Tríceps Braquial (Cabeças Longa, Lateral e Medial)',
          latinName: 'Musculus triceps brachii',
        };
      }
      return {
        structureId: 'biceps_brachii',
        subMeshId: 'forearm_muscles',
        subMeshName: 'Músculos Flexores, Extensores e Pronadores do Antebraço',
        latinName: 'Musculi antebrachii',
      };
    }

    // Diaphragm & Abdominal Wall
    if (/diaphragm|external oblique|internal oblique|transversus abdominis|rectus abdominis|quadratus lumborum|psoas|iliacus/i.test(n)) {
      if (/diaphragm/i.test(n)) {
        return {
          structureId: 'diaphragm_abdominal',
          subMeshId: 'diaphragm_dome',
          subMeshName: 'Diafragma Toracoabdominal',
          latinName: 'Diaphragma',
        };
      }
      return {
        structureId: 'diaphragm_abdominal',
        subMeshId: 'abdominal_wall_muscles',
        subMeshName: 'Músculos Reto Abdominal, Oblíquos e Iliopsoas',
        latinName: 'Musculi abdominis et Musculus iliopsoas',
      };
    }

    // Trapezius, Back & Neck Muscles
    if (/trapezius|latissimus dorsi|rhomboid|longissimus|iliocostalis|spinalis|semispinalis|splenius|sternocleidomastoid|scalene|masseter|temporalis/i.test(n)) {
      if (/trapezius|sternocleidomastoid/i.test(n)) {
        return {
          structureId: 'trapezius_dorsal',
          subMeshId: 'trapezius_scm',
          subMeshName: 'Músculos Trapézio e Esternocleidomastoideo',
          latinName: 'Musculus trapezius et Musculus sternocleidomastoideus',
        };
      }
      return {
        structureId: 'trapezius_dorsal',
        subMeshId: 'latissimus_erector_spinae',
        subMeshName: 'Grande Dorsal, Romboides e Eretores da Espinha',
        latinName: 'Musculus latissimus dorsi et Musculus erector spinae',
      };
    }

    // Lower Limb Muscles (Gluteal, Thigh, Leg)
    if (/gluteus|piriformis|obturator|gemellus|quadratus femoris|tensor fasciae|sartorius|rectus femoris|vastus|gracilis|adductor|pectineus|biceps femoris|semitendinosus|semimembranosus|gastrocnemius|soleus|plantaris|popliteus|tibialis|extensor hallucis|flexor hallucis/i.test(n)) {
      if (/gluteus|piriformis|obturator|gemellus|quadratus femoris|tensor fasciae/i.test(n)) {
        return {
          structureId: 'lower_limb_muscles',
          subMeshId: 'gluteal_pelvic_muscles',
          subMeshName: 'Músculos Glúteos (Máximo, Médio, Mínimo) e Pelvitrocantéricos',
          latinName: 'Musculi glutei et pelvitrochanterici',
        };
      }
      if (/rectus femoris|vastus|sartorius|adductor|gracilis|pectineus|biceps femoris|semitendinosus|semimembranosus/i.test(n)) {
        return {
          structureId: 'lower_limb_muscles',
          subMeshId: 'thigh_quadriceps_hamstrings',
          subMeshName: 'Quadríceps Femoral, Sartório, Adutores e Isquiotibiais',
          latinName: 'Musculus quadriceps femoris, Adductores et Ischiocrurales',
        };
      }
      return {
        structureId: 'lower_limb_muscles',
        subMeshId: 'calf_gastrocnemius_soleus',
        subMeshName: 'Tríceps Sural (Gastrocnêmio e Sóleo)',
        latinName: 'Musculus triceps surae (Gastrocnemius et Soleus)',
      };
    }
  }

  return null;
}

// Extract and decimate Right & Left Lung outer parenchymal lobes from public/models/lungs.glb
function extractLungParenchymaMeshes() {
  const buf = fs.readFileSync(path.join(modelsDir, 'lungs.glb'));
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const bin = buf.subarray(20 + jsonLen + 8);

  function decodeBV(bvIdx) {
    const bv = json.bufferViews[bvIdx];
    const ext = bv.extensions.EXT_meshopt_compression;
    const src = new Uint8Array(bin.buffer, bin.byteOffset + ext.byteOffset, ext.byteLength);
    const dst = new Uint8Array(ext.count * ext.byteStride);
    MeshoptDecoder.decodeGltfBuffer(dst, ext.count, ext.byteStride, src, ext.mode, ext.filter);
    return dst;
  }

  const indices = new Uint32Array(decodeBV(3).buffer);
  const normI8 = new Int8Array(decodeBV(4).buffer);
  const posI16 = new Int16Array(decodeBV(5).buffer);
  const totalVerts = posI16.length / 4;

  // Target studio bounding boxes matching the BodyParts3D thoracic cavity & bronchial trees
  // Right lung in anatomical space: x in [-0.305, -0.042], y in [1.28, 1.88], z in [-0.19, 0.14]
  // Left lung in anatomical space:  x in [0.042, 0.310],   y in [1.28, 1.88], z in [-0.19, 0.14]
  function buildSide(isRight, targetBounds) {
    const step = 1250;
    const cellMap = new Map();
    const vRemap = new Int32Array(totalVerts).fill(-1);
    const cells = [];

    for (let i = 0; i < totalVerts; i++) {
      const x = posI16[i * 4];
      const y = posI16[i * 4 + 1];
      const z = posI16[i * 4 + 2];
      if (isRight ? x > -2400 : x < 2400) continue;
      if (y > 17500) continue;
      const gk = `${Math.round(x / step)},${Math.round(y / step)},${Math.round(z / step)}`;
      let cid = cellMap.get(gk);
      if (cid === undefined) {
        cid = cells.length;
        cellMap.set(gk, cid);
        cells.push({ sx: 0, sy: 0, sz: 0, nx: 0, ny: 0, nz: 0, c: 0 });
      }
      const cell = cells[cid];
      cell.sx += x;
      cell.sy += y;
      cell.sz += z;
      cell.nx += normI8[i * 4];
      cell.ny += normI8[i * 4 + 1];
      cell.nz += normI8[i * 4 + 2];
      cell.c++;
      vRemap[i] = cid;
    }

    let rawMin = [Infinity, Infinity, Infinity];
    let rawMax = [-Infinity, -Infinity, -Infinity];
    for (const cell of cells) {
      cell.sx /= cell.c;
      cell.sy /= cell.c;
      cell.sz /= cell.c;
      if (cell.sx < rawMin[0]) rawMin[0] = cell.sx;
      if (cell.sy < rawMin[1]) rawMin[1] = cell.sy;
      if (cell.sz < rawMin[2]) rawMin[2] = cell.sz;
      if (cell.sx > rawMax[0]) rawMax[0] = cell.sx;
      if (cell.sy > rawMax[1]) rawMax[1] = cell.sy;
      if (cell.sz > rawMax[2]) rawMax[2] = cell.sz;
    }

    const posArr = new Float32Array(cells.length * 3);
    const normArr = new Float32Array(cells.length * 3);
    let minPos = [Infinity, Infinity, Infinity];
    let maxPos = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const tx = (c.sx - rawMin[0]) / Math.max(1, rawMax[0] - rawMin[0]);
      const ty = (c.sy - rawMin[1]) / Math.max(1, rawMax[1] - rawMin[1]);
      const tz = (c.sz - rawMin[2]) / Math.max(1, rawMax[2] - rawMin[2]);

      const px = targetBounds.min[0] + tx * (targetBounds.max[0] - targetBounds.min[0]);
      const py = targetBounds.min[1] + ty * (targetBounds.max[1] - targetBounds.min[1]);
      const pz = targetBounds.min[2] + tz * (targetBounds.max[2] - targetBounds.min[2]);

      posArr[i * 3] = px;
      posArr[i * 3 + 1] = py;
      posArr[i * 3 + 2] = pz;

      if (px < minPos[0]) minPos[0] = px;
      if (py < minPos[1]) minPos[1] = py;
      if (pz < minPos[2]) minPos[2] = pz;
      if (px > maxPos[0]) maxPos[0] = px;
      if (py > maxPos[1]) maxPos[1] = py;
      if (pz > maxPos[2]) maxPos[2] = pz;

      const nl = Math.hypot(c.nx, c.ny, c.nz) || 1;
      normArr[i * 3] = c.nx / nl;
      normArr[i * 3 + 1] = c.ny / nl;
      normArr[i * 3 + 2] = c.nz / nl;
    }

    const outIdx = [];
    for (let t = 0; t < indices.length; t += 3) {
      const a = vRemap[indices[t]];
      const b = vRemap[indices[t + 1]];
      const c = vRemap[indices[t + 2]];
      if (a >= 0 && b >= 0 && c >= 0 && a !== b && b !== c && a !== c) {
        outIdx.push(a, b, c);
      }
    }

    return {
      positions: posArr,
      normals: normArr,
      indices: new Uint32Array(outIdx),
      minPos,
      maxPos,
    };
  }

  const rightLungMesh = buildSide(true, {
    min: [-0.305, 1.30, -0.195],
    max: [-0.042, 1.87, 0.135],
  });
  const leftLungMesh = buildSide(false, {
    min: [0.042, 1.30, -0.195],
    max: [0.308, 1.87, 0.135],
  });

  return { rightLungMesh, leftLungMesh };
}

// Group classified BodyParts3D parts by subMeshId
const subMeshBuckets = new Map();

for (const part of atlasJson.parts) {
  const info = classifyPart(part);
  if (!info) continue;

  let bucket = subMeshBuckets.get(info.subMeshId);
  if (!bucket) {
    bucket = {
      ...info,
      parts: [],
    };
    subMeshBuckets.set(info.subMeshId, bucket);
  }
  bucket.parts.push(part);
}

// Decimate overly dense individual sub-meshes (e.g., > 12,000 vertices) using spatial grid clustering
function mergeAndOptimizeBucket(bucket) {
  let totalVerts = 0;
  let totalIdx = 0;
  for (const p of bucket.parts) {
    totalVerts += p.vertexCount;
    totalIdx += p.indexCount;
  }

  const rawPos = new Float32Array(totalVerts * 3);
  const rawNorm = new Float32Array(totalVerts * 3);
  const rawIdx = new Uint32Array(totalIdx);

  let vOffset = 0;
  let iOffset = 0;

  for (const p of bucket.parts) {
    const chunkBuf = chunks[p.chunk];
    const pPos = new Float32Array(
      chunkBuf.buffer,
      chunkBuf.byteOffset + p.positions,
      p.vertexCount * 3
    );
    const pNorm = new Int16Array(
      chunkBuf.buffer,
      chunkBuf.byteOffset + p.normals,
      p.vertexCount * 3
    );
    const pIdx = new Uint32Array(
      chunkBuf.buffer,
      chunkBuf.byteOffset + p.indices,
      p.indexCount
    );

    for (let i = 0; i < p.vertexCount; i++) {
      const [tx, ty, tz] = transformPos(pPos[i * 3], pPos[i * 3 + 1], pPos[i * 3 + 2]);
      rawPos[(vOffset + i) * 3] = tx;
      rawPos[(vOffset + i) * 3 + 1] = ty;
      rawPos[(vOffset + i) * 3 + 2] = tz;

      const nx = pNorm[i * 3] / 32767.0;
      const ny = pNorm[i * 3 + 1] / 32767.0;
      const nz = pNorm[i * 3 + 2] / 32767.0;
      const nl = Math.hypot(nx, ny, nz) || 1.0;
      rawNorm[(vOffset + i) * 3] = nx / nl;
      rawNorm[(vOffset + i) * 3 + 1] = ny / nl;
      rawNorm[(vOffset + i) * 3 + 2] = nz / nl;
    }

    for (let i = 0; i < p.indexCount; i++) {
      rawIdx[iOffset + i] = pIdx[i] + vOffset;
    }

    vOffset += p.vertexCount;
    iOffset += p.indexCount;
  }

  // If totalVerts > 10000, gently cluster vertices onto a high-res spatial grid to keep the GLB nimble
  let finalPos = rawPos;
  let finalNorm = rawNorm;
  let finalIdx = rawIdx;

  if (totalVerts > 10000) {
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < totalVerts; i++) {
      for (let a = 0; a < 3; a++) {
        const val = rawPos[i * 3 + a];
        if (val < min[a]) min[a] = val;
        if (val > max[a]) max[a] = val;
      }
    }
    const maxExtent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 0.01);
    const step = maxExtent / 95;
    const cellMap = new Map();
    const vRemap = new Uint32Array(totalVerts);
    const cells = [];

    for (let i = 0; i < totalVerts; i++) {
      const x = rawPos[i * 3];
      const y = rawPos[i * 3 + 1];
      const z = rawPos[i * 3 + 2];
      const gk = `${Math.round(x / step)},${Math.round(y / step)},${Math.round(z / step)}`;
      let cid = cellMap.get(gk);
      if (cid === undefined) {
        cid = cells.length;
        cellMap.set(gk, cid);
        cells.push({ sx: 0, sy: 0, sz: 0, nx: 0, ny: 0, nz: 0, c: 0 });
      }
      const cell = cells[cid];
      cell.sx += x;
      cell.sy += y;
      cell.sz += z;
      cell.nx += rawNorm[i * 3];
      cell.ny += rawNorm[i * 3 + 1];
      cell.nz += rawNorm[i * 3 + 2];
      cell.c++;
      vRemap[i] = cid;
    }

    finalPos = new Float32Array(cells.length * 3);
    finalNorm = new Float32Array(cells.length * 3);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      finalPos[i * 3] = c.sx / c.c;
      finalPos[i * 3 + 1] = c.sy / c.c;
      finalPos[i * 3 + 2] = c.sz / c.c;
      const nl = Math.hypot(c.nx, c.ny, c.nz) || 1;
      finalNorm[i * 3] = c.nx / nl;
      finalNorm[i * 3 + 1] = c.ny / nl;
      finalNorm[i * 3 + 2] = c.nz / nl;
    }

    const outIdx = [];
    for (let t = 0; t < rawIdx.length; t += 3) {
      const a = vRemap[rawIdx[t]];
      const b = vRemap[rawIdx[t + 1]];
      const c = vRemap[rawIdx[t + 2]];
      if (a !== b && b !== c && a !== c) {
        outIdx.push(a, b, c);
      }
    }
    finalIdx = new Uint32Array(outIdx);
  }

  let minPos = [Infinity, Infinity, Infinity];
  let maxPos = [-Infinity, -Infinity, -Infinity];
  const vCount = finalPos.length / 3;
  for (let i = 0; i < vCount; i++) {
    for (let a = 0; a < 3; a++) {
      const val = finalPos[i * 3 + a];
      if (val < minPos[a]) minPos[a] = val;
      if (val > maxPos[a]) maxPos[a] = val;
    }
  }

  return {
    positions: finalPos,
    normals: finalNorm,
    indices: finalIdx,
    minPos,
    maxPos,
  };
}

// Assemble all sub-meshes
const compiledSubMeshes = [];

for (const bucket of subMeshBuckets.values()) {
  const geom = mergeAndOptimizeBucket(bucket);
  if (geom.indices.length === 0) continue;
  compiledSubMeshes.push({
    structureId: bucket.structureId,
    subMeshId: bucket.subMeshId,
    subMeshName: bucket.subMeshName,
    latinName: bucket.latinName,
    ...geom,
  });
}

// Also add the outer Right and Left Lung parenchymal surfaces from public/models/lungs.glb
const { rightLungMesh, leftLungMesh } = extractLungParenchymaMeshes();
compiledSubMeshes.push({
  structureId: 'right_lung',
  subMeshId: 'right_lung_parenchyma',
  subMeshName: 'Parênquima Pulmonar Direito (Lobos Superior, Médio e Inferior)',
  latinName: 'Pulmo dexter (Lobi superior, medius et inferior)',
  ...rightLungMesh,
});
compiledSubMeshes.push({
  structureId: 'left_lung',
  subMeshId: 'left_lung_parenchyma',
  subMeshName: 'Parênquima Pulmonar Esquerdo (Lobo Superior, Língula e Lobo Inferior)',
  latinName: 'Pulmo sinister (Lobi superior et inferior)',
  ...leftLungMesh,
});

// Build binary GLB 2.0
const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];
const binSegments = [];
let binByteLength = 0;

function appendBin(typedArray) {
  const pad = (4 - (binByteLength % 4)) % 4;
  if (pad > 0) {
    binSegments.push(Buffer.alloc(pad));
    binByteLength += pad;
  }
  const byteOffset = binByteLength;
  const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  binSegments.push(buf);
  binByteLength += buf.length;
  return { byteOffset, byteLength: buf.length };
}

// Group sub-meshes by structureId
const byStructure = new Map();
for (const sm of compiledSubMeshes) {
  let list = byStructure.get(sm.structureId);
  if (!list) {
    list = [];
    byStructure.set(sm.structureId, list);
  }
  list.push(sm);
}

const rootChildNodeIndices = [];
const metadataByStructure = {};

for (const [structureId, smList] of byStructure.entries()) {
  const childNodeIndices = [];
  let structMin = [Infinity, Infinity, Infinity];
  let structMax = [-Infinity, -Infinity, -Infinity];
  const subMeshMetaList = [];

  for (const sm of smList) {
    for (let a = 0; a < 3; a++) {
      if (sm.minPos[a] < structMin[a]) structMin[a] = sm.minPos[a];
      if (sm.maxPos[a] > structMax[a]) structMax[a] = sm.maxPos[a];
    }

    const posSlice = appendBin(sm.positions);
    const posBV = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: posSlice.byteOffset,
      byteLength: posSlice.byteLength,
      target: 34962,
    });
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posBV,
      byteOffset: 0,
      componentType: 5126,
      count: sm.positions.length / 3,
      type: 'VEC3',
      min: sm.minPos,
      max: sm.maxPos,
    });

    const normSlice = appendBin(sm.normals);
    const normBV = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: normSlice.byteOffset,
      byteLength: normSlice.byteLength,
      target: 34962,
    });
    const normAcc = accessors.length;
    accessors.push({
      bufferView: normBV,
      byteOffset: 0,
      componentType: 5126,
      count: sm.normals.length / 3,
      type: 'VEC3',
    });

    const idxSlice = appendBin(sm.indices);
    const idxBV = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: idxSlice.byteOffset,
      byteLength: idxSlice.byteLength,
      target: 34963,
    });
    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxBV,
      byteOffset: 0,
      componentType: 5125,
      count: sm.indices.length,
      type: 'SCALAR',
    });

    const meshIdx = meshes.length;
    meshes.push({
      name: sm.subMeshName,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
          },
          indices: idxAcc,
          mode: 4,
        },
      ],
    });

    const smCenter = [
      Number(((sm.minPos[0] + sm.maxPos[0]) / 2).toFixed(3)),
      Number(((sm.minPos[1] + sm.maxPos[1]) / 2).toFixed(3)),
      Number(((sm.minPos[2] + sm.maxPos[2]) / 2).toFixed(3)),
    ];

    const nodeIdx = nodes.length;
    nodes.push({
      name: sm.subMeshId,
      mesh: meshIdx,
      extras: {
        structureId: sm.structureId,
        subMeshId: sm.subMeshId,
        subMeshName: sm.subMeshName,
        latinName: sm.latinName,
        center: smCenter,
        vertexCount: sm.positions.length / 3,
        triangleCount: sm.indices.length / 3,
      },
    });
    childNodeIndices.push(nodeIdx);

    subMeshMetaList.push({
      id: sm.subMeshId,
      name: sm.subMeshName,
      latinName: sm.latinName,
      structureId: sm.structureId,
      center: smCenter,
      vertexCount: sm.positions.length / 3,
      triangleCount: sm.indices.length / 3,
    });
  }

  const structCenter = [
    Number(((structMin[0] + structMax[0]) / 2).toFixed(3)),
    Number(((structMin[1] + structMax[1]) / 2).toFixed(3)),
    Number(((structMin[2] + structMax[2]) / 2).toFixed(3)),
  ];

  const parentNodeIdx = nodes.length;
  nodes.push({
    name: structureId,
    children: childNodeIndices,
    extras: {
      isStructureGroup: true,
      structureId,
      center: structCenter,
    },
  });
  rootChildNodeIndices.push(parentNodeIdx);

  metadataByStructure[structureId] = {
    center: structCenter,
    min: structMin.map((n) => Number(n.toFixed(3))),
    max: structMax.map((n) => Number(n.toFixed(3))),
    subMeshes: subMeshMetaList,
  };
}

// Pad BIN buffer to 4-byte alignment
const binPad = (4 - (binByteLength % 4)) % 4;
if (binPad > 0) {
  binSegments.push(Buffer.alloc(binPad));
  binByteLength += binPad;
}
const binChunkData = Buffer.concat(binSegments);

const gltfJson = {
  asset: {
    version: '2.0',
    generator: 'Anatomia3D Studio BodyParts3D + OpenSource GLB Compiler',
    copyright: 'BodyParts3D (DBCLS, CC BY-SA 2.1 JP) & Open-Source Anatomical GLB Models',
  },
  scene: 0,
  scenes: [
    {
      name: 'Human_Anatomy_Atlas_BodyParts3D',
      nodes: rootChildNodeIndices,
    },
  ],
  nodes,
  meshes,
  accessors,
  bufferViews,
  buffers: [
    {
      byteLength: binChunkData.length,
    },
  ],
};

let jsonStr = JSON.stringify(gltfJson);
const jsonPad = (4 - (Buffer.byteLength(jsonStr, 'utf8') % 4)) % 4;
if (jsonPad > 0) {
  jsonStr += ' '.repeat(jsonPad);
}
const jsonChunkData = Buffer.from(jsonStr, 'utf8');

const totalLength = 12 + 8 + jsonChunkData.length + 8 + binChunkData.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // 'glTF'
header.writeUInt32LE(2, 4); // version 2
header.writeUInt32LE(totalLength, 8);

const jsonChunkHeader = Buffer.alloc(8);
jsonChunkHeader.writeUInt32LE(jsonChunkData.length, 0);
jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

const binChunkHeader = Buffer.alloc(8);
binChunkHeader.writeUInt32LE(binChunkData.length, 0);
binChunkHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

const glbOutPath = path.join(modelsDir, 'human_anatomy_atlas.glb');
fs.writeFileSync(
  glbOutPath,
  Buffer.concat([header, jsonChunkHeader, jsonChunkData, binChunkHeader, binChunkData])
);

const metaOutPath = path.join(modelsDir, 'atlas_metadata.json');
fs.writeFileSync(metaOutPath, JSON.stringify(metadataByStructure, null, 2));

const totalVerts = compiledSubMeshes.reduce((s, m) => s + m.positions.length / 3, 0);
const totalTris = compiledSubMeshes.reduce((s, m) => s + m.indices.length / 3, 0);

console.log(
  JSON.stringify(
    {
      glbFile: 'public/models/human_anatomy_atlas.glb',
      sizeMB: Number((totalLength / 1024 / 1024).toFixed(2)),
      structures: byStructure.size,
      subMeshes: compiledSubMeshes.length,
      totalVertices: totalVerts,
      totalTriangles: totalTris,
    },
    null,
    2
  )
);
