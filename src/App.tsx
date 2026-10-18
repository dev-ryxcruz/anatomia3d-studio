import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import {
  ANATOMICAL_REGIONS,
  ANATOMICAL_STRUCTURES,
  ANATOMICAL_SYSTEMS,
  BUILTIN_GLB_MODELS,
  LEGAL_MODEL_SOURCES,
  RegionId,
  SystemId,
} from './data/anatomyCatalog';
import {
  CameraPreset,
  GlbSubMeshItem,
  ImportedMeshItem,
  SliceAxis,
  Viewer3D,
  parseGlbFileToMeshes,
} from './components/Viewer3D';
import {
  Activity,
  Award,
  BookOpen,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Crosshair,
  Database,
  Download,
  Expand,
  Eye,
  EyeOff,
  FileUp,
  Filter,
  Focus,
  Ghost,
  Info,
  Layers,
  Menu,
  MoreVertical,
  Redo2,
  RotateCcw,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Undo2,
  X,
  XCircle,
} from 'lucide-react';

interface DissectionSnapshot {
  selectedId: string | null;
  selectedSubMeshId: string | null;
  hiddenIds: string[];
  xrayIds: string[];
  hiddenSystems: SystemId[];
  xraySystems: SystemId[];
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseInitialUrlParams() {
  if (typeof window === 'undefined') {
    return {
      part: 'heart' as string | null,
      sub: null as string | null,
      xray: [] as string[],
      xsys: [] as SystemId[],
      hidden: [] as string[],
      hsys: [] as SystemId[],
      slice: 'none' as SliceAxis,
      offset: 1.25,
      explode: 0,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const partParam = params.get('part');
  const defaultPart = window.innerWidth < 768 ? null : 'heart';
  const part =
    partParam === 'none'
      ? null
      : partParam && ANATOMICAL_STRUCTURES.some((s) => s.id === partParam)
      ? partParam
      : defaultPart;

  const sub = params.get('sub') || null;
  const xray = (params.get('xray') || '').split(',').filter(Boolean);
  const xsys = (params.get('xsys') || '')
    .split(',')
    .filter((s): s is SystemId =>
      ANATOMICAL_SYSTEMS.some((sys) => sys.id === s)
    );
  const hidden = (params.get('hidden') || '').split(',').filter(Boolean);
  const hsys = (params.get('hsys') || '')
    .split(',')
    .filter((s): s is SystemId =>
      ANATOMICAL_SYSTEMS.some((sys) => sys.id === s)
    );

  const rawSlice = params.get('slice');
  const slice: SliceAxis =
    rawSlice === 'axial' || rawSlice === 'sagittal' || rawSlice === 'coronal'
      ? rawSlice
      : 'none';
  const rawOffset = parseFloat(params.get('offset') || '');
  const offset = Number.isFinite(rawOffset) ? rawOffset : 1.25;
  const rawExplode = parseFloat(params.get('explode') || '');
  const explode = Number.isFinite(rawExplode)
    ? Math.max(0, Math.min(1, rawExplode / 100))
    : 0;

  return { part, sub, xray, xsys, hidden, hsys, slice, offset, explode };
}

export function App() {
  const initialUrlState = useMemo(() => parseInitialUrlParams(), []);

  // Active built-in GLB model from public/models/
  const [activeGlbUrl, setActiveGlbUrl] = useState<string>(
    BUILTIN_GLB_MODELS[0].url
  );

  // Selection & hover state (supports both Structure ID and individual GLB Sub-Mesh ID)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialUrlState.part
  );
  const [selectedSubMeshId, setSelectedSubMeshId] = useState<string | null>(
    initialUrlState.sub
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredSubMeshId, setHoveredSubMeshId] = useState<string | null>(null);

  // Loaded sub-meshes from human_anatomy_atlas.glb
  const [atlasSubMeshes, setAtlasSubMeshes] = useState<GlbSubMeshItem[]>([]);

  // Visibility & X-ray state (stores both structure IDs and sub-mesh IDs)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(
    () => new Set(initialUrlState.hidden)
  );
  const [xrayIds, setXrayIds] = useState<Set<string>>(
    () => new Set(initialUrlState.xray)
  );
  const [hiddenSystems, setHiddenSystems] = useState<Set<SystemId>>(
    () => new Set(initialUrlState.hsys)
  );
  const [xraySystems, setXraySystems] = useState<Set<SystemId>>(
    () => new Set(initialUrlState.xsys)
  );

  // 3D Exploded View state (0 = 0%, 1 = 100%)
  const [explodeFactor, setExplodeFactor] = useState<number>(
    initialUrlState.explode
  );

  // Share link feedback state
  const [linkCopied, setLinkCopied] = useState(false);

  // Dissection Undo / Redo History Stack
  const [historyState, setHistoryState] = useState<{
    stack: DissectionSnapshot[];
    index: number;
  }>(() => ({
    stack: [
      {
        selectedId: initialUrlState.part,
        selectedSubMeshId: initialUrlState.sub,
        hiddenIds: initialUrlState.hidden,
        xrayIds: initialUrlState.xray,
        hiddenSystems: initialUrlState.hsys,
        xraySystems: initialUrlState.xsys,
      },
    ],
    index: 0,
  }));
  const isRestoringHistoryRef = useRef(false);

  // Record dissection changes into history stack
  useEffect(() => {
    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      return;
    }
    const snapshot: DissectionSnapshot = {
      selectedId,
      selectedSubMeshId,
      hiddenIds: Array.from(hiddenIds).sort(),
      xrayIds: Array.from(xrayIds).sort(),
      hiddenSystems: Array.from(hiddenSystems).sort(),
      xraySystems: Array.from(xraySystems).sort(),
    };

    setHistoryState((prev) => {
      const current = prev.stack[prev.index];
      if (
        current &&
        current.selectedId === snapshot.selectedId &&
        current.selectedSubMeshId === snapshot.selectedSubMeshId &&
        current.hiddenIds.join(',') === snapshot.hiddenIds.join(',') &&
        current.xrayIds.join(',') === snapshot.xrayIds.join(',') &&
        current.hiddenSystems.join(',') === snapshot.hiddenSystems.join(',') &&
        current.xraySystems.join(',') === snapshot.xraySystems.join(',')
      ) {
        return prev;
      }
      const nextStack = prev.stack.slice(0, prev.index + 1);
      nextStack.push(snapshot);
      if (nextStack.length > 50) {
        nextStack.shift();
      }
      return {
        stack: nextStack,
        index: nextStack.length - 1,
      };
    });
  }, [
    selectedId,
    selectedSubMeshId,
    hiddenIds,
    xrayIds,
    hiddenSystems,
    xraySystems,
  ]);

  const canUndo = historyState.index > 0;
  const canRedo = historyState.index < historyState.stack.length - 1;

  const handleUndo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      const targetIdx = prev.index - 1;
      const snap = prev.stack[targetIdx];
      isRestoringHistoryRef.current = true;
      setSelectedId(snap.selectedId);
      setSelectedSubMeshId(snap.selectedSubMeshId);
      setHiddenIds(new Set(snap.hiddenIds));
      setXrayIds(new Set(snap.xrayIds));
      setHiddenSystems(new Set(snap.hiddenSystems));
      setXraySystems(new Set(snap.xraySystems));
      return { ...prev, index: targetIdx };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index >= prev.stack.length - 1) return prev;
      const targetIdx = prev.index + 1;
      const snap = prev.stack[targetIdx];
      isRestoringHistoryRef.current = true;
      setSelectedId(snap.selectedId);
      setSelectedSubMeshId(snap.selectedSubMeshId);
      setHiddenIds(new Set(snap.hiddenIds));
      setXrayIds(new Set(snap.xrayIds));
      setHiddenSystems(new Set(snap.hiddenSystems));
      setXraySystems(new Set(snap.xraySystems));
      return { ...prev, index: targetIdx };
    });
  }, []);

  // Desktop keyboard shortcuts: Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Navigation & filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegionFilter, setActiveRegionFilter] = useState<
    RegionId | 'all'
  >('all');
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(
    () => new Set(ANATOMICAL_SYSTEMS.map((s) => s.id))
  );
  const [expandedStructures, setExpandedStructures] = useState<Set<string>>(
    () => new Set(['cranium', 'heart'])
  );
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [mobileSidebarExpanded, setMobileSidebarExpanded] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileDockPopover, setMobileDockPopover] = useState<
    'slice' | 'views' | null
  >(null);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);

  // 3D Controls state: floating 3D labels disabled by default to avoid initial visual clutter
  const [showLabels, setShowLabels] = useState(false);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>(initialUrlState.slice);
  const [sliceOffset, setSliceOffset] = useState<number>(
    initialUrlState.offset
  );
  const [sliceInvert, setSliceInvert] = useState<boolean>(false);
  const [cameraRequest, setCameraRequest] = useState<{
    preset: CameraPreset;
    timestamp: number;
  } | null>(null);

  // Synchronize main dissection state with URL query string (?part=...&xray=...&slice=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedId) params.set('part', selectedId);
    if (selectedSubMeshId) params.set('sub', selectedSubMeshId);
    if (xrayIds.size > 0) params.set('xray', Array.from(xrayIds).join(','));
    if (xraySystems.size > 0)
      params.set('xsys', Array.from(xraySystems).join(','));
    if (hiddenIds.size > 0)
      params.set('hidden', Array.from(hiddenIds).join(','));
    if (hiddenSystems.size > 0)
      params.set('hsys', Array.from(hiddenSystems).join(','));
    if (sliceAxis !== 'none') {
      params.set('slice', sliceAxis);
      params.set('offset', sliceOffset.toFixed(2));
    }
    if (explodeFactor > 0.01) {
      params.set('explode', String(Math.round(explodeFactor * 100)));
    }
    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [
    selectedId,
    selectedSubMeshId,
    xrayIds,
    xraySystems,
    hiddenIds,
    hiddenSystems,
    sliceAxis,
    sliceOffset,
    explodeFactor,
  ]);

  const handleShareView = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2400);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2400);
    }
  };

  // External GLB/GLTF imported meshes
  const [importedMeshes, setImportedMeshes] = useState<ImportedMeshItem[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modals: Legal sources & Quiz Mode
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizTargetId, setQuizTargetId] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({
    correct: 0,
    total: 0,
    streak: 0,
  });
  const [quizFeedback, setQuizFeedback] = useState<{
    status: 'correct' | 'wrong' | null;
    message: string;
  }>({ status: null, message: '' });

  // Group atlas sub-meshes by parent structureId
  const subMeshesByStructure = useMemo(() => {
    const map = new Map<string, GlbSubMeshItem[]>();
    for (const sm of atlasSubMeshes) {
      let list = map.get(sm.structureId);
      if (!list) {
        list = [];
        map.set(sm.structureId, list);
      }
      list.push(sm);
    }
    return map;
  }, [atlasSubMeshes]);

  // Selected item resolution
  const selectedStructure = useMemo(
    () => ANATOMICAL_STRUCTURES.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );

  const selectedSubMesh = useMemo(
    () => atlasSubMeshes.find((sm) => sm.id === selectedSubMeshId) ?? null,
    [atlasSubMeshes, selectedSubMeshId]
  );

  const selectedImported = useMemo(
    () => importedMeshes.find((m) => m.id === selectedId) ?? null,
    [importedMeshes, selectedId]
  );

  const hoveredSubMesh = useMemo(
    () => atlasSubMeshes.find((sm) => sm.id === hoveredSubMeshId) ?? null,
    [atlasSubMeshes, hoveredSubMeshId]
  );

  const hoveredStructure = useMemo(
    () =>
      ANATOMICAL_STRUCTURES.find((s) => s.id === hoveredId) ??
      importedMeshes.find((m) => m.id === hoveredId) ??
      null,
    [hoveredId, importedMeshes]
  );

  // Accent-tolerant & order-independent multi-token search across structures, TA98 codes, and 102 sub-meshes
  const filteredStructures = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim());
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return ANATOMICAL_STRUCTURES.filter((s) => {
      const matchesRegion =
        activeRegionFilter === 'all' || s.region === activeRegionFilter;
      if (!matchesRegion) return false;
      if (tokens.length === 0) return true;

      const smList = subMeshesByStructure.get(s.id) ?? [];
      const subMeshCorpus = smList
        .map((sm) => `${sm.name} ${sm.latinName} ${sm.id}`)
        .join(' ');
      const fullHaystack = normalizeSearchText(
        `${s.name} ${s.latinName} ${s.ta98Code} ${s.summary} ${s.id} ${subMeshCorpus}`
      );

      return tokens.every((token) => fullHaystack.includes(token));
    });
  }, [searchQuery, activeRegionFilter, subMeshesByStructure]);

  const triggerCamera = (preset: CameraPreset) => {
    setCameraRequest({ preset, timestamp: Date.now() });
  };

  // Visibility & X-ray toggles (work for both structureId and subMeshId)
  const toggleStructureHidden = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStructureXray = (id: string) => {
    setXrayIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSystemHidden = (sysId: SystemId) => {
    setHiddenSystems((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  };

  const toggleSystemXray = (sysId: SystemId) => {
    setXraySystems((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  };

  const focusOnStructure = (
    targetStructureId: string,
    targetSubMeshId: string | null = null
  ) => {
    setSelectedId(targetStructureId);
    setSelectedSubMeshId(targetSubMeshId);
    setMobileSheetExpanded(false);
    setTimeout(() => triggerCamera('focus'), 40);
  };

  const isolateStructure = (targetStructureId: string) => {
    const allOtherIds = [
      ...ANATOMICAL_STRUCTURES.map((s) => s.id),
      ...importedMeshes.map((m) => m.id),
    ].filter((id) => id !== targetStructureId);

    setHiddenSystems(new Set());
    setHiddenIds(new Set(allOtherIds));
    setXrayIds((prev) => {
      const next = new Set(prev);
      next.delete(targetStructureId);
      return next;
    });
    setSelectedId(targetStructureId);
    setSelectedSubMeshId(null);
    setMobileSheetExpanded(false);
    setTimeout(() => triggerCamera('focus'), 40);
  };

  const isolateSubMesh = (parentStructureId: string, targetSubMeshId: string) => {
    const otherStructureIds = ANATOMICAL_STRUCTURES.map((s) => s.id).filter(
      (id) => id !== parentStructureId
    );
    const siblingSubMeshIds = (
      subMeshesByStructure.get(parentStructureId) ?? []
    )
      .map((sm) => sm.id)
      .filter((id) => id !== targetSubMeshId);

    setHiddenSystems(new Set());
    setHiddenIds(
      new Set([
        ...otherStructureIds,
        ...siblingSubMeshIds,
        ...importedMeshes.map((m) => m.id),
      ])
    );
    setXrayIds((prev) => {
      const next = new Set(prev);
      next.delete(parentStructureId);
      next.delete(targetSubMeshId);
      return next;
    });
    setSelectedId(parentStructureId);
    setSelectedSubMeshId(targetSubMeshId);
    setMobileSheetExpanded(false);
    setTimeout(() => triggerCamera('focus'), 40);
  };

  const resetAllVisibility = () => {
    setHiddenIds(new Set());
    setXrayIds(new Set());
    setHiddenSystems(new Set());
    setXraySystems(new Set());
    setSliceAxis('none');
    setExplodeFactor(0);
    triggerCamera('reset');
  };

  // Quiz Mode logic
  const pickNextQuizQuestion = (excludeId?: string | null) => {
    const visiblePool = ANATOMICAL_STRUCTURES.filter(
      (s) => !hiddenIds.has(s.id) && !hiddenSystems.has(s.system)
    );
    const pool = visiblePool.length >= 3 ? visiblePool : ANATOMICAL_STRUCTURES;
    const candidates = pool.filter((s) => s.id !== excludeId);
    const chosen =
      candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
    setQuizTargetId(chosen.id);
    setQuizFeedback({ status: null, message: '' });
  };

  const startQuiz = () => {
    setActiveGlbUrl(BUILTIN_GLB_MODELS[0].url);
    setHiddenIds(new Set());
    setHiddenSystems(new Set());
    setXrayIds(
      new Set(['rib_cage', 'pectoralis_major', 'diaphragm_abdominal'])
    );
    setQuizActive(true);
    setQuizScore({ correct: 0, total: 0, streak: 0 });
    pickNextQuizQuestion(null);
  };

  const stopQuiz = () => {
    setQuizActive(false);
    setQuizTargetId(null);
    setQuizFeedback({ status: null, message: '' });
  };

  const handleSelectInViewport = (
    structureId: string | null,
    subMeshId?: string | null
  ) => {
    setSelectedId(structureId);
    setSelectedSubMeshId(subMeshId ?? null);
    setMobileSheetExpanded(false);
    setMobileDockPopover(null);
    if (structureId) {
      setExpandedStructures((prev) => new Set([...prev, structureId]));
    }

    if (!quizActive || !structureId || !quizTargetId) return;

    const clickedStructure = ANATOMICAL_STRUCTURES.find(
      (s) => s.id === structureId
    );
    const targetStructure = ANATOMICAL_STRUCTURES.find(
      (s) => s.id === quizTargetId
    );
    if (!clickedStructure || !targetStructure) return;

    if (structureId === quizTargetId) {
      setQuizScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
        streak: prev.streak + 1,
      }));
      setQuizFeedback({
        status: 'correct',
        message: `Correto! Você identificou: ${targetStructure.name} (${targetStructure.latinName}).`,
      });
      setTimeout(() => {
        pickNextQuizQuestion(structureId);
      }, 1500);
    } else {
      setQuizScore((prev) => ({
        ...prev,
        total: prev.total + 1,
        streak: 0,
      }));
      setQuizFeedback({
        status: 'wrong',
        message: `Você clicou em "${clickedStructure.name}". Procure por: ${targetStructure.name} (${targetStructure.latinName}).`,
      });
    }
  };

  // Screenshot capture
  const handleDownloadScreenshot = () => {
    const canvas = document.querySelector(
      '.viewer-canvas-wrapper canvas'
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `anatomia3d-captura-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // GLB/GLTF Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const meshes = await parseGlbFileToMeshes(file);
      if (meshes.length === 0) {
        setImportError(
          'O arquivo GLB/GLTF não contém malhas 3D (Mesh) válidas.'
        );
        return;
      }
      setImportedMeshes((prev) => [...prev, ...meshes]);
      setSelectedId(meshes[0].id);
      setSelectedSubMeshId(null);
      setExpandedSystems((prev) => new Set([...prev, 'imported']));
      setTimeout(() => triggerCamera('focus'), 80);
    } catch (err: any) {
      setImportError(
        `Erro ao ler modelo 3D: ${err?.message || 'Formato GLB/GLTF inválido'}`
      );
    } finally {
      e.target.value = '';
    }
  };

  // Export selected real anatomical sub-mesh as standalone .GLB
  const handleExportSelectedGlb = () => {
    const group = new THREE.Group();
    const targetSm =
      selectedSubMesh ??
      (selectedStructure
        ? (subMeshesByStructure.get(selectedStructure.id) ?? [])[0]
        : null);

    if (targetSm) {
      group.name = targetSm.id;
      const mesh = new THREE.Mesh(
        targetSm.geometry.clone(),
        new THREE.MeshStandardMaterial({
          color: selectedStructure?.color ?? '#e8dcc8',
          roughness: 0.42,
        })
      );
      mesh.name = targetSm.name;
      group.add(mesh);
    } else {
      return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${group.name}.glb`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      },
      (err) => console.error('Erro ao exportar GLB:', err),
      { binary: true }
    );
  };

  const handleAxisChange = (axis: SliceAxis) => {
    setSliceAxis(axis);
    if (axis === 'axial') setSliceOffset(1.35);
    else if (axis === 'sagittal') setSliceOffset(0.0);
    else if (axis === 'coronal') setSliceOffset(0.02);
  };

  const quizTargetStructure = useMemo(
    () => ANATOMICAL_STRUCTURES.find((s) => s.id === quizTargetId) ?? null,
    [quizTargetId]
  );

  const visibleSubMeshCount = useMemo(
    () =>
      atlasSubMeshes.filter((sm) => {
        const st = ANATOMICAL_STRUCTURES.find((s) => s.id === sm.structureId);
        if (!st) return false;
        return (
          !hiddenIds.has(sm.id) &&
          !hiddenIds.has(st.id) &&
          !hiddenSystems.has(st.system)
        );
      }).length + importedMeshes.filter((m) => !hiddenIds.has(m.id)).length,
    [atlasSubMeshes, hiddenIds, hiddenSystems, importedMeshes]
  );

  return (
    <div className="app-shell">
      {/* ==================== TOP HEADER BAR ==================== */}
      <header className="top-navbar">
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <div className="brand-group">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => {
              setSidebarOpenMobile((v) => !v);
              setMobileToolsOpen(false);
              setMobileDockPopover(null);
            }}
            aria-label="Alternar menu de sistemas"
          >
            <Menu size={20} />
          </button>
          <div className="brand-logo">
            <Activity size={19} className="brand-icon" />
          </div>
          <div>
            <h1 className="brand-title">
              Anatomia3D<span className="brand-title-studio"> Studio</span>
            </h1>
            <span className="brand-subtitle">
              Malhas 3D Reais (.GLB BodyParts3D) • Padrão TA98 / IFAA
            </span>
          </div>
        </div>

        {/* Desktop Camera & Viewport Controls (>= 768px) */}
        <div className="top-actions">
          <div
            className="action-pill-group"
            role="group"
            aria-label="Vistas Anatômicas"
          >
            <span className="pill-group-label">
              <Compass size={14} /> Vista:
            </span>
            <button
              type="button"
              className="btn-chip"
              onClick={() => triggerCamera('anterior')}
              title="Vista Anterior (Frontal)"
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => triggerCamera('posterior')}
              title="Vista Posterior (Dorsal)"
            >
              Posterior
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => triggerCamera('right')}
              title="Vista Lateral Direita"
            >
              Lat. Dir.
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => triggerCamera('left')}
              title="Vista Lateral Esquerda"
            >
              Lat. Esq.
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => triggerCamera('superior')}
              title="Vista Superior (Cranial)"
            >
              Superior
            </button>
          </div>

          <div
            className="action-pill-group undo-redo-pill-group"
            role="group"
            aria-label="Histórico de Dissecação"
          >
            <button
              type="button"
              className="btn-chip"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Desfazer última ação de dissecação (Ctrl+Z)"
            >
              <Undo2 size={14} />
              <span>Desfazer</span>
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Refazer ação de dissecação (Ctrl+Y)"
            >
              <Redo2 size={14} />
              <span>Refazer</span>
            </button>
          </div>

          <button
            type="button"
            className={`btn-Action ${showLabels ? 'btn-active' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
            title="Por padrão, exibe etiqueta apenas no hover/seleção. Clique para exibir todas as etiquetas simultaneamente."
          >
            <Tag size={15} />
            <span>{showLabels ? 'Todas Etiquetas' : 'Etiquetas: Seleção'}</span>
          </button>

          <button
            type="button"
            className={`btn-Action ${quizActive ? 'btn-quiz-active' : ''}`}
            onClick={() => (quizActive ? stopQuiz() : startQuiz())}
            title="Iniciar/encerrar Modo Quiz de Identificação Anatômica"
          >
            <Award size={15} />
            <span>{quizActive ? 'Sair do Quiz' : 'Modo Quiz'}</span>
          </button>

          <button
            type="button"
            className={`btn-Action ${linkCopied ? 'btn-share-copied' : ''}`}
            onClick={handleShareView}
            title="Copiar link direto com o estado atual da dissecação (?part=...&xray=...&slice=...)"
          >
            {linkCopied ? <Check size={15} /> : <Share2 size={15} />}
            <span>{linkCopied ? 'Link copiado!' : 'Compartilhar Visão'}</span>
          </button>

          <button
            type="button"
            className="btn-Action"
            onClick={() => fileInputRef.current?.click()}
            title="Importar modelo 3D externo compatível (.glb ou .gltf)"
          >
            <FileUp size={15} />
            <span>Importar .GLB</span>
          </button>

          <button
            type="button"
            className="btn-Action"
            onClick={handleDownloadScreenshot}
            title="Exportar captura de tela PNG da cena 3D"
          >
            <Camera size={15} />
            <span>Capturar PNG</span>
          </button>

          <button
            type="button"
            className="btn-Action"
            onClick={resetAllVisibility}
            title="Restaurar todas as estruturas, sub-malhas, transparências e câmera"
          >
            <RotateCcw size={15} />
            <span>Resetar</span>
          </button>

          <button
            type="button"
            className="btn-Action btn-legal"
            onClick={() => setShowLegalModal(true)}
            title="Fontes de modelos 3D, licenças abertas e referências bibliográficas"
          >
            <ShieldCheck size={15} />
            <span>Fontes & Licenças</span>
          </button>
        </div>

        {/* Ultra-Compact Mobile Header Actions (< 768px) */}
        <div className="mobile-header-actions">
          <div className="mobile-undo-redo-group">
            <button
              type="button"
              className="mobile-icon-btn"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Desfazer (Undo)"
              aria-label="Desfazer dissecação"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              className="mobile-icon-btn"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Refazer (Redo)"
              aria-label="Refazer dissecação"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <button
            type="button"
            className={`mobile-quiz-btn ${quizActive ? 'btn-quiz-active' : ''}`}
            onClick={() => {
              setMobileToolsOpen(false);
              quizActive ? stopQuiz() : startQuiz();
            }}
            title="Alternar Modo Quiz"
          >
            <Award size={15} />
            <span>{quizActive ? 'Sair' : 'Quiz'}</span>
          </button>

          <div className="mobile-tools-wrapper">
            <button
              type="button"
              className={`mobile-more-btn ${
                mobileToolsOpen ? 'btn-active' : ''
              }`}
              onClick={() => {
                setMobileToolsOpen((v) => !v);
                setMobileDockPopover(null);
              }}
              aria-label="Mais ferramentas"
              title="Mais / Ferramentas"
            >
              <MoreVertical size={18} />
            </button>

            {mobileToolsOpen && (
              <>
                <div
                  className="mobile-dropdown-backdrop"
                  onClick={() => setMobileToolsOpen(false)}
                />
                <div className="mobile-tools-dropdown" role="menu">
                  <div className="mobile-dropdown-section">
                    <span className="mobile-dropdown-label">
                      <Database size={13} className="text-cyan" /> Modelo / Dataset .GLB
                    </span>
                    <select
                      value={activeGlbUrl}
                      onChange={(e) => {
                        setActiveGlbUrl(e.target.value);
                        setMobileToolsOpen(false);
                        setTimeout(() => triggerCamera('reset'), 80);
                      }}
                      className="mobile-dropdown-select"
                      aria-label="Selecionar modelo GLB"
                    >
                      {BUILTIN_GLB_MODELS.map((m) => (
                        <option key={m.id} value={m.url}>
                          {m.name} ({m.sizeMB})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mobile-dropdown-divider" />
                  <button
                    type="button"
                    className={`mobile-dropdown-item ${
                      linkCopied ? 'mobile-dropdown-item-copied' : ''
                    }`}
                    onClick={() => {
                      handleShareView();
                    }}
                  >
                    {linkCopied ? (
                      <Check size={16} className="text-cyan" />
                    ) : (
                      <Share2 size={16} className="text-cyan" />
                    )}
                    <span>
                      {linkCopied ? 'Link copiado!' : 'Compartilhar Visão'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mobile-dropdown-item"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <FileUp size={16} />
                    <span>Importar .GLB</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-dropdown-item"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      handleExportSelectedGlb();
                    }}
                  >
                    <Download size={16} />
                    <span>Exportar Peça .GLB</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-dropdown-item"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      handleDownloadScreenshot();
                    }}
                  >
                    <Camera size={16} />
                    <span>Capturar PNG</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-dropdown-item"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      setShowLegalModal(true);
                    }}
                  >
                    <ShieldCheck size={16} className="text-cyan" />
                    <span>Fontes & Licenças</span>
                  </button>
                  <div className="mobile-dropdown-divider" />
                  <button
                    type="button"
                    className="mobile-dropdown-item"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      resetAllVisibility();
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Resetar Cena</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <div className="workspace-grid">
        {sidebarOpenMobile && (
          <div
            className="mobile-sidebar-backdrop"
            onClick={() => setSidebarOpenMobile(false)}
          />
        )}
        {/* LEFT SIDEBAR (Desktop) / HALF-SCREEN BOTTOM SHEET (Mobile < 768px) */}
        <aside
          className={`sidebar-panel ${sidebarOpenMobile ? 'sidebar-open' : ''} ${
            mobileSidebarExpanded ? 'sidebar-sheet-expanded' : ''
          }`}
        >
          {/* Mobile Half-Screen Sheet Top Bar */}
          <div className="mobile-sidebar-sheet-header">
            <div
              className="mobile-sheet-handle"
              onClick={() => setMobileSidebarExpanded((v) => !v)}
            />
            <div className="mobile-sidebar-title-row">
              <span className="mobile-sidebar-sheet-title">
                <Layers size={14} className="text-cyan" /> Sistemas & Estruturas
                <span className="mobile-active-count">
                  {visibleSubMeshCount} ativas
                </span>
              </span>
              <div className="mobile-sidebar-sheet-controls">
                <button
                  type="button"
                  className="mobile-sheet-size-btn"
                  onClick={() => setMobileSidebarExpanded((v) => !v)}
                >
                  {mobileSidebarExpanded ? (
                    <>
                      <ChevronDown size={13} /> 50%
                    </>
                  ) : (
                    <>
                      <ChevronUp size={13} /> Expandir
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="info-close-btn"
                  onClick={() => setSidebarOpenMobile(false)}
                  aria-label="Fechar painel de sistemas"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="sidebar-header">
            {/* Built-in GLB Model Switcher (Desktop only; on mobile moved to ⋮ menu) */}
            <div
              className="region-filter-row sidebar-dataset-row"
              title="Selecionar arquivo .GLB em public/models/"
            >
              <Database size={13} className="region-filter-icon" />
              <select
                value={activeGlbUrl}
                onChange={(e) => {
                  setActiveGlbUrl(e.target.value);
                  setTimeout(() => triggerCamera('reset'), 80);
                }}
                className="region-select"
                aria-label="Selecionar modelo GLB de public/models/"
              >
                {BUILTIN_GLB_MODELS.map((m) => (
                  <option key={m.id} value={m.url}>
                    {m.name} ({m.sizeMB})
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-search-filter-grid">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar osso, órgão, TA98..."
                  aria-label="Buscar estrutura ou sub-malha anatômica"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Region Filter Tabs */}
              <div className="region-filter-row">
                <Filter size={13} className="region-filter-icon" />
                <select
                  value={activeRegionFilter}
                  onChange={(e) =>
                    setActiveRegionFilter(e.target.value as RegionId | 'all')
                  }
                  className="region-select"
                  aria-label="Filtrar por região anatômica"
                >
                  <option value="all">
                    Todas as Regiões ({ANATOMICAL_STRUCTURES.length})
                  </option>
                  {ANATOMICAL_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.latinName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Dissection Presets */}
            <div className="preset-bar">
              <button
                type="button"
                className="preset-chip"
                onClick={() => {
                  setHiddenSystems(new Set(['muscular']));
                  setHiddenIds(new Set());
                  setXraySystems(new Set());
                }}
                title="Ocultar camada muscular para exibir o esqueleto completo e órgãos"
              >
                <Layers size={13} /> Esqueleto + Órgãos
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => {
                  setHiddenSystems(new Set());
                  setHiddenIds(new Set());
                  setXraySystems(new Set(['skeletal', 'muscular']));
                }}
                title="Deixar esqueleto e músculos translúcidos para visualizar órgãos internos"
              >
                <Ghost size={13} /> Raio-X Visceral
              </button>
            </div>
          </div>

          {/* Systems, Structures & Sub-Meshes Tree */}
          <div className="systems-tree">
            {ANATOMICAL_SYSTEMS.map((sys) => {
              const items = filteredStructures.filter(
                (s) => s.system === sys.id
              );
              if (items.length === 0) return null;
              const isExpanded = expandedSystems.has(sys.id);
              const isSysHidden = hiddenSystems.has(sys.id);
              const isSysXray = xraySystems.has(sys.id);

              return (
                <div key={sys.id} className="system-group">
                  <div className="system-group-header">
                    <button
                      type="button"
                      className="system-expand-btn"
                      onClick={() =>
                        setExpandedSystems((prev) => {
                          const next = new Set(prev);
                          if (next.has(sys.id)) next.delete(sys.id);
                          else next.add(sys.id);
                          return next;
                        })
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                      <span
                        className="system-swatch"
                        style={{ backgroundColor: sys.color }}
                      />
                      <span className="system-name">{sys.name}</span>
                      <span className="system-count">{items.length}</span>
                    </button>

                    <div className="system-controls">
                      <button
                        type="button"
                        className={`icon-btn ${
                          isSysXray ? 'icon-btn-active' : ''
                        }`}
                        onClick={() => toggleSystemXray(sys.id)}
                        title={`Alternar modo Raio-X (transparência) para ${sys.name}`}
                      >
                        <Ghost size={14} />
                      </button>
                      <button
                        type="button"
                        className={`icon-btn ${
                          isSysHidden ? 'icon-btn-muted' : ''
                        }`}
                        onClick={() => toggleSystemHidden(sys.id)}
                        title={
                          isSysHidden
                            ? `Mostrar ${sys.name}`
                            : `Ocultar todo o ${sys.name}`
                        }
                      >
                        {isSysHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <ul className="structure-list">
                      {items.map((st) => {
                        const isHidden = hiddenIds.has(st.id) || isSysHidden;
                        const isXray = xrayIds.has(st.id) || isSysXray;
                        const isSelected = selectedId === st.id;
                        const subMeshes = subMeshesByStructure.get(st.id) ?? [];
                        const isStructExpanded =
                          expandedStructures.has(st.id) ||
                          (searchQuery.trim().length > 0 && subMeshes.length > 0);

                        return (
                          <li key={st.id} className="structure-item-block">
                            <div
                              className={`structure-row ${
                                isSelected && !selectedSubMeshId
                                  ? 'structure-row-selected'
                                  : ''
                              } ${isHidden ? 'structure-row-hidden' : ''}`}
                            >
                              {subMeshes.length > 1 && (
                                <button
                                  type="button"
                                  className="submesh-toggle-btn"
                                  onClick={() =>
                                    setExpandedStructures((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(st.id)) next.delete(st.id);
                                      else next.add(st.id);
                                      return next;
                                    })
                                  }
                                  title="Expandir/recolher sub-malhas (.GLB)"
                                >
                                  {isStructExpanded ? (
                                    <ChevronDown size={13} />
                                  ) : (
                                    <ChevronRight size={13} />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                className="structure-select-btn"
                                onClick={() => {
                                  setSelectedId(st.id);
                                  setSelectedSubMeshId(null);
                                  setExpandedStructures(
                                    (prev) => new Set([...prev, st.id])
                                  );
                                  if (hiddenIds.has(st.id)) {
                                    toggleStructureHidden(st.id);
                                  }
                                  setTimeout(() => triggerCamera('focus'), 40);
                                }}
                                onMouseEnter={() => {
                                  setHoveredId(st.id);
                                  setHoveredSubMeshId(null);
                                }}
                                onMouseLeave={() => {
                                  setHoveredId(null);
                                  setHoveredSubMeshId(null);
                                }}
                              >
                                <span className="structure-title">
                                  {st.name}
                                  {subMeshes.length > 1 && (
                                    <span className="submesh-badge">
                                      {subMeshes.length} malhas
                                    </span>
                                  )}
                                  {isXray && (
                                    <span
                                      className="row-status-badge row-status-xray"
                                      title="Em modo Raio-X"
                                    >
                                      <Ghost size={10} /> Raio-X
                                    </span>
                                  )}
                                </span>
                                <span className="structure-latin">
                                  {st.latinName}
                                </span>
                              </button>

                              <div className="structure-row-actions">
                                <div className="desktop-row-actions">
                                  <button
                                    type="button"
                                    className="icon-btn-sm"
                                    onClick={() => focusOnStructure(st.id)}
                                    title="Focar câmera nesta estrutura"
                                  >
                                    <Focus size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`icon-btn-sm ${
                                      isXray ? 'icon-btn-active' : ''
                                    }`}
                                    onClick={() => toggleStructureXray(st.id)}
                                    title="Alternar transparência (Raio-X)"
                                  >
                                    <Ghost size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn-sm"
                                    onClick={() => isolateStructure(st.id)}
                                    title="Isolar apenas esta estrutura"
                                  >
                                    <Crosshair size={13} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className={`icon-btn-sm row-visibility-btn ${
                                    isHidden ? 'icon-btn-muted' : ''
                                  }`}
                                  onClick={() => toggleStructureHidden(st.id)}
                                  title={
                                    isHidden
                                      ? 'Mostrar estrutura'
                                      : 'Ocultar estrutura'
                                  }
                                >
                                  {isHidden ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Progressive Disclosure Action Bar when Structure is selected */}
                            {isSelected && !selectedSubMeshId && (
                              <div className="progressive-action-bar">
                                <button
                                  type="button"
                                  className="prog-action-btn"
                                  onClick={() => focusOnStructure(st.id)}
                                >
                                  <Focus size={12} />
                                  <span>Focar</span>
                                </button>
                                <button
                                  type="button"
                                  className="prog-action-btn"
                                  onClick={() => isolateStructure(st.id)}
                                >
                                  <Crosshair size={12} />
                                  <span>Isolar</span>
                                </button>
                                <button
                                  type="button"
                                  className={`prog-action-btn ${
                                    isXray ? 'prog-action-btn-active' : ''
                                  }`}
                                  onClick={() => toggleStructureXray(st.id)}
                                >
                                  <Ghost size={12} />
                                  <span>Raio-X</span>
                                </button>
                                <button
                                  type="button"
                                  className={`prog-action-btn ${
                                    isHidden ? 'prog-action-btn-active' : ''
                                  }`}
                                  onClick={() => toggleStructureHidden(st.id)}
                                >
                                  {isHidden ? (
                                    <Eye size={12} />
                                  ) : (
                                    <EyeOff size={12} />
                                  )}
                                  <span>{isHidden ? 'Mostrar' : 'Ocultar'}</span>
                                </button>
                                <button
                                  type="button"
                                  className="prog-action-btn prog-action-btn-clinical"
                                  onClick={() => {
                                    setSidebarOpenMobile(false);
                                    setMobileSheetExpanded(false);
                                  }}
                                >
                                  <BookOpen size={12} />
                                  <span>Detalhes Clínicos</span>
                                </button>
                              </div>
                            )}

                            {/* Child Sub-Meshes mapped directly from .GLB */}
                            {isStructExpanded && subMeshes.length > 1 && (
                              <ul className="submesh-tree-list">
                                {subMeshes.map((sm) => {
                                  const isSmHidden =
                                    isHidden || hiddenIds.has(sm.id);
                                  const isSmXray =
                                    isXray || xrayIds.has(sm.id);
                                  const isSmSelected =
                                    selectedSubMeshId === sm.id;

                                  return (
                                    <li
                                      key={sm.id}
                                      className="submesh-item-wrapper"
                                    >
                                      <div
                                        className={`submesh-row ${
                                          isSmSelected
                                            ? 'submesh-row-selected'
                                            : ''
                                        } ${
                                          isSmHidden
                                            ? 'structure-row-hidden'
                                            : ''
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          className="submesh-select-btn"
                                          onClick={() => {
                                            setSelectedId(st.id);
                                            setSelectedSubMeshId(sm.id);
                                            if (hiddenIds.has(sm.id)) {
                                              toggleStructureHidden(sm.id);
                                            }
                                            setTimeout(
                                              () => triggerCamera('focus'),
                                              40
                                            );
                                          }}
                                          onMouseEnter={() => {
                                            setHoveredId(st.id);
                                            setHoveredSubMeshId(sm.id);
                                          }}
                                          onMouseLeave={() => {
                                            setHoveredId(null);
                                            setHoveredSubMeshId(null);
                                          }}
                                        >
                                          <span className="submesh-name">
                                            ↳ {sm.name}
                                            {isSmXray && (
                                              <span className="row-status-badge row-status-xray">
                                                <Ghost size={9} />
                                              </span>
                                            )}
                                          </span>
                                          <span className="submesh-meta">
                                            {sm.latinName} • {sm.vertexCount}{' '}
                                            vért.
                                          </span>
                                        </button>
                                        <div className="structure-row-actions">
                                          <div className="desktop-row-actions">
                                            <button
                                              type="button"
                                              className="icon-btn-sm"
                                              onClick={() =>
                                                focusOnStructure(st.id, sm.id)
                                              }
                                              title="Focar câmera nesta sub-malha"
                                            >
                                              <Focus size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`icon-btn-sm ${
                                                isSmXray
                                                  ? 'icon-btn-active'
                                                  : ''
                                              }`}
                                              onClick={() =>
                                                toggleStructureXray(sm.id)
                                              }
                                              title="Raio-X nesta sub-malha"
                                            >
                                              <Ghost size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              className="icon-btn-sm"
                                              onClick={() =>
                                                isolateSubMesh(st.id, sm.id)
                                              }
                                              title="Isolar apenas esta sub-malha"
                                            >
                                              <Crosshair size={12} />
                                            </button>
                                          </div>
                                          <button
                                            type="button"
                                            className={`icon-btn-sm row-visibility-btn ${
                                              isSmHidden ? 'icon-btn-muted' : ''
                                            }`}
                                            onClick={() =>
                                              toggleStructureHidden(sm.id)
                                            }
                                            title={
                                              isSmHidden
                                                ? 'Mostrar sub-malha'
                                                : 'Ocultar sub-malha'
                                            }
                                          >
                                            {isSmHidden ? (
                                              <EyeOff size={13} />
                                            ) : (
                                              <Eye size={13} />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Progressive Disclosure Action Bar for Selected Sub-Mesh */}
                                      {isSmSelected && (
                                        <div className="progressive-action-bar">
                                          <button
                                            type="button"
                                            className="prog-action-btn"
                                            onClick={() =>
                                              focusOnStructure(st.id, sm.id)
                                            }
                                          >
                                            <Focus size={12} />
                                            <span>Focar</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="prog-action-btn"
                                            onClick={() =>
                                              isolateSubMesh(st.id, sm.id)
                                            }
                                          >
                                            <Crosshair size={12} />
                                            <span>Isolar</span>
                                          </button>
                                          <button
                                            type="button"
                                            className={`prog-action-btn ${
                                              isSmXray
                                                ? 'prog-action-btn-active'
                                                : ''
                                            }`}
                                            onClick={() =>
                                              toggleStructureXray(sm.id)
                                            }
                                          >
                                            <Ghost size={12} />
                                            <span>Raio-X</span>
                                          </button>
                                          <button
                                            type="button"
                                            className={`prog-action-btn ${
                                              isSmHidden
                                                ? 'prog-action-btn-active'
                                                : ''
                                            }`}
                                            onClick={() =>
                                              toggleStructureHidden(sm.id)
                                            }
                                          >
                                            {isSmHidden ? (
                                              <Eye size={12} />
                                            ) : (
                                              <EyeOff size={12} />
                                            )}
                                            <span>
                                              {isSmHidden
                                                ? 'Mostrar'
                                                : 'Ocultar'}
                                            </span>
                                          </button>
                                          <button
                                            type="button"
                                            className="prog-action-btn prog-action-btn-clinical"
                                            onClick={() => {
                                              setSidebarOpenMobile(false);
                                              setMobileSheetExpanded(false);
                                            }}
                                          >
                                            <BookOpen size={12} />
                                            <span>Detalhes Clínicos</span>
                                          </button>
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* Imported External GLB Models Section */}
            {importedMeshes.length > 0 && (
              <div className="system-group">
                <div className="system-group-header">
                  <button
                    type="button"
                    className="system-expand-btn"
                    onClick={() =>
                      setExpandedSystems((prev) => {
                        const next = new Set(prev);
                        if (next.has('imported')) next.delete('imported');
                        else next.add('imported');
                        return next;
                      })
                    }
                  >
                    <ChevronDown size={15} />
                    <span
                      className="system-swatch"
                      style={{ backgroundColor: '#38bdf8' }}
                    />
                    <span className="system-name">Modelos .GLB Importados</span>
                    <span className="system-count">
                      {importedMeshes.length}
                    </span>
                  </button>
                </div>
                {expandedSystems.has('imported') && (
                  <ul className="structure-list">
                    {importedMeshes.map((m) => {
                      const isHidden = hiddenIds.has(m.id);
                      const isXray = xrayIds.has(m.id);
                      const isSelected = selectedId === m.id;
                      return (
                        <li key={m.id} className="structure-item-block">
                          <div
                            className={`structure-row ${
                              isSelected ? 'structure-row-selected' : ''
                            } ${isHidden ? 'structure-row-hidden' : ''}`}
                          >
                            <button
                              type="button"
                              className="structure-select-btn"
                              onClick={() => {
                                setSelectedId(m.id);
                                setSelectedSubMeshId(null);
                                if (hiddenIds.has(m.id)) {
                                  toggleStructureHidden(m.id);
                                }
                                setTimeout(() => triggerCamera('focus'), 40);
                              }}
                            >
                              <span className="structure-title">
                                {m.name}
                                {isXray && (
                                  <span className="row-status-badge row-status-xray">
                                    <Ghost size={10} /> Raio-X
                                  </span>
                                )}
                              </span>
                              <span className="structure-latin">
                                {m.vertexCount} vértices • {m.triangleCount}{' '}
                                triâng.
                              </span>
                            </button>
                            <div className="structure-row-actions">
                              <div className="desktop-row-actions">
                                <button
                                  type="button"
                                  className="icon-btn-sm"
                                  onClick={() => focusOnStructure(m.id)}
                                  title="Focar peça"
                                >
                                  <Focus size={13} />
                                </button>
                                <button
                                  type="button"
                                  className={`icon-btn-sm ${
                                    isXray ? 'icon-btn-active' : ''
                                  }`}
                                  onClick={() => toggleStructureXray(m.id)}
                                  title="Alternar Raio-X"
                                >
                                  <Ghost size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn-sm"
                                  onClick={() => isolateStructure(m.id)}
                                  title="Isolar peça"
                                >
                                  <Crosshair size={13} />
                                </button>
                              </div>
                              <button
                                type="button"
                                className={`icon-btn-sm row-visibility-btn ${
                                  isHidden ? 'icon-btn-muted' : ''
                                }`}
                                onClick={() => toggleStructureHidden(m.id)}
                                title={isHidden ? 'Mostrar' : 'Ocultar'}
                              >
                                {isHidden ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="progressive-action-bar">
                              <button
                                type="button"
                                className="prog-action-btn"
                                onClick={() => focusOnStructure(m.id)}
                              >
                                <Focus size={12} />
                                <span>Focar</span>
                              </button>
                              <button
                                type="button"
                                className="prog-action-btn"
                                onClick={() => isolateStructure(m.id)}
                              >
                                <Crosshair size={12} />
                                <span>Isolar</span>
                              </button>
                              <button
                                type="button"
                                className={`prog-action-btn ${
                                  isXray ? 'prog-action-btn-active' : ''
                                }`}
                                onClick={() => toggleStructureXray(m.id)}
                              >
                                <Ghost size={12} />
                                <span>Raio-X</span>
                              </button>
                              <button
                                type="button"
                                className={`prog-action-btn ${
                                  isHidden ? 'prog-action-btn-active' : ''
                                }`}
                                onClick={() => toggleStructureHidden(m.id)}
                              >
                                {isHidden ? (
                                  <Eye size={12} />
                                ) : (
                                  <EyeOff size={12} />
                                )}
                                <span>{isHidden ? 'Mostrar' : 'Ocultar'}</span>
                              </button>
                              <button
                                type="button"
                                className="prog-action-btn prog-action-btn-clinical"
                                onClick={() => {
                                  setSidebarOpenMobile(false);
                                  setMobileSheetExpanded(false);
                                }}
                              >
                                <BookOpen size={12} />
                                <span>Detalhes Clínicos</span>
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <span>
              Sub-malhas .GLB ativas: <strong>{visibleSubMeshCount}</strong>
            </span>
            <button
              type="button"
              className="link-btn"
              onClick={handleExportSelectedGlb}
              title="Exportar a sub-malha anatômica selecionada como arquivo .GLB independente"
            >
              <Download size={13} /> Exportar Peça .GLB
            </button>
          </div>
        </aside>

        {/* CENTER 3D VIEWPORT */}
        <main className="viewport-area">
          {/* Quiz Banner Overlay */}
          {quizActive && quizTargetStructure && (
            <div className="quiz-overlay-card">
              <div className="quiz-header-row">
                <span className="quiz-badge">
                  <Sparkles size={14} /> MODO QUIZ ANATÔMICO (.GLB REAL)
                </span>
                <div className="quiz-stats">
                  <span>
                    Acertos: <strong>{quizScore.correct}</strong>/
                    {quizScore.total}
                  </span>
                  <span>
                    Sequência: <strong>{quizScore.streak}🔥</strong>
                  </span>
                  <button
                    type="button"
                    className="quiz-skip-btn"
                    onClick={() => pickNextQuizQuestion(quizTargetId)}
                  >
                    Pular
                  </button>
                </div>
              </div>
              <div className="quiz-prompt">
                Clique no modelo 3D sobre a estrutura:{' '}
                <strong>{quizTargetStructure.name}</strong>{' '}
                <em>({quizTargetStructure.latinName})</em>
              </div>
              {quizFeedback.status && (
                <div
                  className={`quiz-feedback ${
                    quizFeedback.status === 'correct'
                      ? 'quiz-feedback-ok'
                      : 'quiz-feedback-err'
                  }`}
                >
                  {quizFeedback.status === 'correct' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>{quizFeedback.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Import error toast */}
          {importError && (
            <div className="error-toast">
              <span>{importError}</span>
              <button type="button" onClick={() => setImportError(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Hover HUD Pill */}
          {(hoveredSubMesh || hoveredStructure) && !quizActive && (
            <div className="hover-hud-pill">
              <span className="hover-hud-name">
                {hoveredSubMesh
                  ? hoveredSubMesh.name
                  : hoveredStructure?.name}
              </span>
              <span className="hover-hud-latin">
                {hoveredSubMesh
                  ? `${hoveredSubMesh.latinName} • ${hoveredStructure?.name ?? ''}`
                  : hoveredStructure && 'latinName' in hoveredStructure
                  ? hoveredStructure.latinName
                  : ''}
              </span>
            </div>
          )}

          <Viewer3D
            structures={ANATOMICAL_STRUCTURES}
            activeGlbUrl={activeGlbUrl}
            selectedId={selectedId}
            selectedSubMeshId={selectedSubMeshId}
            hoveredId={hoveredId}
            hoveredSubMeshId={hoveredSubMeshId}
            hiddenIds={hiddenIds}
            xrayIds={xrayIds}
            hiddenSystems={hiddenSystems}
            xraySystems={xraySystems}
            showLabels={showLabels}
            sliceAxis={sliceAxis}
            sliceOffset={sliceOffset}
            sliceInvert={sliceInvert}
            explodeFactor={explodeFactor}
            cameraRequest={cameraRequest}
            importedMeshes={importedMeshes}
            onSelectStructure={handleSelectInViewport}
            onHoverStructure={(stId, smId) => {
              setHoveredId(stId);
              setHoveredSubMeshId(smId ?? null);
            }}
            onAtlasSubMeshesLoaded={setAtlasSubMeshes}
            quizActive={quizActive}
          />

          {/* Desktop Bottom Floating Cross-Section / Slice Control Bar (>= 768px) */}
          <div className="bottom-slice-bar">
            <div className="slice-bar-title">
              <Scissors size={15} className="text-cyan" />
              <span>Plano de Corte (Cross-Section):</span>
            </div>

            <div className="slice-axis-buttons">
              {(
                [
                  { id: 'none', label: 'Desativado' },
                  { id: 'axial', label: 'Axial (Transversal)' },
                  { id: 'sagittal', label: 'Sagital (Mediano)' },
                  { id: 'coronal', label: 'Coronal (Frontal)' },
                ] as { id: SliceAxis; label: string }[]
              ).map((ax) => (
                <button
                  key={ax.id}
                  type="button"
                  className={`btn-chip ${
                    sliceAxis === ax.id ? 'btn-chip-active' : ''
                  }`}
                  onClick={() => handleAxisChange(ax.id)}
                >
                  {ax.label}
                </button>
              ))}
            </div>

            {sliceAxis !== 'none' && (
              <div className="slice-slider-group">
                <input
                  type="range"
                  min={sliceAxis === 'axial' ? -1.55 : -0.85}
                  max={sliceAxis === 'axial' ? 2.6 : 0.85}
                  step={0.02}
                  value={sliceOffset}
                  onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
                  aria-label="Posição do plano de corte"
                />
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => setSliceInvert((v) => !v)}
                  title="Inverter sentido do corte anatômico"
                >
                  Inverter Lado
                </button>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL / MOBILE BOTTOM SHEET: ANATOMICAL DETAILS & DISSECTION ACTIONS */}
        <aside
          className={`info-panel ${
            selectedStructure || selectedImported
              ? 'info-panel-has-selection'
              : 'info-panel-empty-state'
          } ${mobileSheetExpanded ? 'info-panel-sheet-expanded' : ''} ${
            sidebarOpenMobile ? 'info-panel-suppressed-mobile' : ''
          }`}
        >
          {selectedStructure ? (
            <div className="info-content">
              <div className="info-sticky-header">
                <div
                  className="mobile-sheet-handle"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                />
                <div className="info-badges">
                  <span
                    className="system-pill"
                    style={{
                      backgroundColor:
                        ANATOMICAL_SYSTEMS.find(
                          (s) => s.id === selectedStructure.system
                        )?.color ?? '#38bdf8',
                    }}
                  >
                    {
                      ANATOMICAL_SYSTEMS.find(
                        (s) => s.id === selectedStructure.system
                      )?.name
                    }
                  </span>
                  <span className="ta98-pill">
                    TA98: {selectedStructure.ta98Code}
                  </span>
                  <button
                    type="button"
                    className="info-close-btn"
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedSubMeshId(null);
                      setMobileSheetExpanded(false);
                    }}
                    title="Fechar painel de informações"
                    aria-label="Fechar painel de informações"
                  >
                    <X size={16} />
                  </button>
                </div>

                <h2 className="info-title">{selectedStructure.name}</h2>
                <p className="info-latin">{selectedStructure.latinName}</p>

                {/* Dissection Action Buttons for Selected Structure */}
                <div className="dissection-toolbar">
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() => {
                      setSidebarOpenMobile(false);
                      triggerCamera('focus');
                    }}
                  >
                    <Focus size={15} />
                    <span>Focar</span>
                  </button>
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() =>
                      selectedSubMesh
                        ? isolateSubMesh(selectedStructure.id, selectedSubMesh.id)
                        : isolateStructure(selectedStructure.id)
                    }
                  >
                    <Crosshair size={15} />
                    <span>
                      {selectedSubMesh ? 'Isolar Peça' : 'Isolar'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`dissect-btn ${
                      xrayIds.has(selectedSubMesh?.id ?? selectedStructure.id)
                        ? 'dissect-btn-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleStructureXray(
                        selectedSubMesh?.id ?? selectedStructure.id
                      )
                    }
                  >
                    <Ghost size={15} />
                    <span>Raio-X</span>
                  </button>
                  <button
                    type="button"
                    className={`dissect-btn ${
                      hiddenIds.has(selectedSubMesh?.id ?? selectedStructure.id)
                        ? 'dissect-btn-active'
                        : ''
                    }`}
                    onClick={() =>
                      toggleStructureHidden(
                        selectedSubMesh?.id ?? selectedStructure.id
                      )
                    }
                  >
                    {hiddenIds.has(
                      selectedSubMesh?.id ?? selectedStructure.id
                    ) ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff size={15} />
                    )}
                    <span>
                      {hiddenIds.has(selectedSubMesh?.id ?? selectedStructure.id)
                        ? 'Mostrar'
                        : 'Ocultar'}
                    </span>
                  </button>
                </div>

                {/* 3D Exploded View Slider (0% to 100%) */}
                <div className="explode-control-box">
                  <div className="explode-control-header">
                    <span className="explode-control-label">
                      <Expand size={13} className="text-cyan" />
                      Explodir Estrutura / Camadas
                    </span>
                    <div className="explode-control-meta">
                      <span className="explode-percent-badge">
                        {Math.round(explodeFactor * 100)}%
                      </span>
                      {explodeFactor > 0 && (
                        <button
                          type="button"
                          className="explode-reset-btn"
                          onClick={() => setExplodeFactor(0)}
                          title="Retornar sub-malhas à posição anatômica original (0%)"
                        >
                          0%
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(explodeFactor * 100)}
                    onChange={(e) =>
                      setExplodeFactor(Number(e.target.value) / 100)
                    }
                    className="explode-range-slider"
                    aria-label="Explodir Estrutura / Camadas (0% a 100%)"
                  />
                </div>

                <button
                  type="button"
                  className="mobile-sheet-expand-btn"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                >
                  {mobileSheetExpanded ? (
                    <>
                      <ChevronDown size={15} />
                      <span>Recolher detalhes</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={15} />
                      <span>Expandir / Ver detalhes clínicos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Active GLB Sub-Mesh Card & Sub-Mesh List */}
              {(subMeshesByStructure.get(selectedStructure.id) ?? []).length >
                0 && (
                <div className="info-section submesh-inspector-box">
                  <h3>
                    <Box size={14} /> Sub-Malhas 3D (.GLB BodyParts3D)
                  </h3>
                  {selectedSubMesh && (
                    <div className="active-submesh-banner">
                      <div>
                        <strong>Peça clicada:</strong> {selectedSubMesh.name}
                        <div className="active-submesh-latin">
                          {selectedSubMesh.latinName} •{' '}
                          {selectedSubMesh.vertexCount.toLocaleString('pt-BR')}{' '}
                          vértices /{' '}
                          {selectedSubMesh.triangleCount.toLocaleString('pt-BR')}{' '}
                          triângulos
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="relations-tags">
                    {(
                      subMeshesByStructure.get(selectedStructure.id) ?? []
                    ).map((sm) => {
                      const isActive = selectedSubMeshId === sm.id;
                      const isSmHidden = hiddenIds.has(sm.id);
                      return (
                        <button
                          key={sm.id}
                          type="button"
                          className={`relation-chip ${
                            isActive ? 'relation-chip-active' : ''
                          } ${isSmHidden ? 'relation-chip-hidden' : ''}`}
                          onClick={() => {
                            setSelectedSubMeshId(isActive ? null : sm.id);
                            setTimeout(() => triggerCamera('focus'), 40);
                          }}
                          title={`${sm.name} (${sm.latinName}) — ${sm.vertexCount} vértices`}
                        >
                          {sm.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="info-section">
                <h3>
                  <Info size={14} /> Síntese Morfofuncional
                </h3>
                <p className="info-summary">{selectedStructure.summary}</p>
                <p className="info-body">{selectedStructure.description}</p>
              </div>

              <div className="info-section clinical-box">
                <h3>
                  <Activity size={14} /> Correlação Clínica & Cirúrgica
                </h3>
                <p>{selectedStructure.clinicalNotes}</p>
              </div>

              <div className="info-section">
                <h3>
                  <Layers size={14} /> Relações Topográficas Diretas
                </h3>
                <div className="relations-tags">
                  {selectedStructure.relations.map((relName) => {
                    const target = ANATOMICAL_STRUCTURES.find(
                      (s) => s.name === relName
                    );
                    return (
                      <button
                        key={relName}
                        type="button"
                        className="relation-chip"
                        onClick={() => {
                          if (target) {
                            setSelectedId(target.id);
                            setSelectedSubMeshId(null);
                          }
                        }}
                      >
                        {relName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : selectedImported ? (
            <div className="info-content">
              <div className="info-sticky-header">
                <div
                  className="mobile-sheet-handle"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                />
                <div className="info-badges">
                  <span
                    className="system-pill"
                    style={{ backgroundColor: '#38bdf8' }}
                  >
                    Malha .GLB / .GLTF Inspecionada
                  </span>
                  <button
                    type="button"
                    className="info-close-btn"
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedSubMeshId(null);
                      setMobileSheetExpanded(false);
                    }}
                    title="Fechar painel de informações"
                    aria-label="Fechar painel de informações"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h2 className="info-title">{selectedImported.name}</h2>
                <p className="info-latin">
                  Sub-malha 3D mapeada via Raycasting
                </p>

                <div className="dissection-toolbar">
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() => {
                      setSidebarOpenMobile(false);
                      triggerCamera('focus');
                    }}
                  >
                    <Focus size={15} />
                    <span>Focar</span>
                  </button>
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() => isolateStructure(selectedImported.id)}
                  >
                    <Crosshair size={15} />
                    <span>Isolar</span>
                  </button>
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() => toggleStructureXray(selectedImported.id)}
                  >
                    <Ghost size={15} />
                    <span>Raio-X</span>
                  </button>
                  <button
                    type="button"
                    className="dissect-btn"
                    onClick={() => toggleStructureHidden(selectedImported.id)}
                  >
                    <EyeOff size={15} />
                    <span>Ocultar</span>
                  </button>
                </div>

                {/* 3D Exploded View Slider (0% to 100%) */}
                <div className="explode-control-box">
                  <div className="explode-control-header">
                    <span className="explode-control-label">
                      <Expand size={13} className="text-cyan" />
                      Explodir Estrutura / Camadas
                    </span>
                    <div className="explode-control-meta">
                      <span className="explode-percent-badge">
                        {Math.round(explodeFactor * 100)}%
                      </span>
                      {explodeFactor > 0 && (
                        <button
                          type="button"
                          className="explode-reset-btn"
                          onClick={() => setExplodeFactor(0)}
                          title="Retornar sub-malhas à posição original (0%)"
                        >
                          0%
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(explodeFactor * 100)}
                    onChange={(e) =>
                      setExplodeFactor(Number(e.target.value) / 100)
                    }
                    className="explode-range-slider"
                    aria-label="Explodir Estrutura / Camadas (0% a 100%)"
                  />
                </div>

                <button
                  type="button"
                  className="mobile-sheet-expand-btn"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                >
                  {mobileSheetExpanded ? (
                    <>
                      <ChevronDown size={15} />
                      <span>Recolher detalhes</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={15} />
                      <span>Expandir / Ver detalhes clínicos</span>
                    </>
                  )}
                </button>
              </div>

              <div className="info-section">
                <h3>
                  <Box size={14} /> Metadados da Geometria .GLB
                </h3>
                <p className="info-body">
                  Vértices:{' '}
                  <strong>
                    {selectedImported.vertexCount.toLocaleString('pt-BR')}
                  </strong>
                  <br />
                  Triângulos:{' '}
                  <strong>
                    {selectedImported.triangleCount.toLocaleString('pt-BR')}
                  </strong>
                  <br />
                  Centro Espacial Normalizado:{' '}
                  <code>
                    [
                    {selectedImported.worldCenter
                      .map((n) => n.toFixed(2))
                      .join(', ')}
                    ]
                  </code>
                </p>
              </div>
            </div>
          ) : (
            <div className="info-empty">
              <BookOpen size={36} className="empty-icon" />
              <h3>Nenhuma Estrutura Selecionada</h3>
              <p>
                Clique diretamente sobre qualquer osso, músculo, vaso ou órgão
                no visualizador 3D (ou expanda as sub-malhas `.GLB` na árvore à
                esquerda) para inspecionar sua terminologia internacional TA98,
                descrição anatômica, notas clínicas e controles de dissecação.
              </p>
              <div className="controls-guide">
                <div>
                  <strong>Botão Esquerdo + Arrastar:</strong> Rotação Orbital
                  360°
                </div>
                <div>
                  <strong>Botão Direito + Arrastar:</strong> Panorâmica (Pan)
                </div>
                <div>
                  <strong>Scroll / Pinça:</strong> Zoom Progressivo
                </div>
                <div>
                  <strong>Clique na Sub-Malha 3D:</strong> Selecionar Peça
                  Anatômica
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ==================== UNIFIED MOBILE BOTTOM DOCK (< 768px) ==================== */}
      <nav className="mobile-bottom-dock" aria-label="Controles 3D Mobile">
        {/* Popover: Plano de Corte */}
        {mobileDockPopover === 'slice' && (
          <div className="mobile-dock-popover" role="dialog" aria-label="Plano de Corte">
            <div className="mobile-popover-header">
              <span>
                <Scissors size={14} className="text-cyan" /> Plano de Corte Anatômico
              </span>
              <button
                type="button"
                className="icon-btn-sm"
                onClick={() => setMobileDockPopover(null)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="mobile-popover-pills">
              {(
                [
                  { id: 'none', label: 'Desativado' },
                  { id: 'axial', label: 'Axial' },
                  { id: 'sagittal', label: 'Sagital' },
                  { id: 'coronal', label: 'Coronal' },
                ] as { id: SliceAxis; label: string }[]
              ).map((ax) => (
                <button
                  key={ax.id}
                  type="button"
                  className={`btn-chip ${
                    sliceAxis === ax.id ? 'btn-chip-active' : ''
                  }`}
                  onClick={() => handleAxisChange(ax.id)}
                >
                  {ax.label}
                </button>
              ))}
            </div>
            {sliceAxis !== 'none' && (
              <div className="mobile-popover-slider-row">
                <input
                  type="range"
                  min={sliceAxis === 'axial' ? -1.55 : -0.85}
                  max={sliceAxis === 'axial' ? 2.6 : 0.85}
                  step={0.02}
                  value={sliceOffset}
                  onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
                  aria-label="Posição do plano de corte"
                />
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => setSliceInvert((v) => !v)}
                >
                  Inverter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Popover: Vistas Rápidas */}
        {mobileDockPopover === 'views' && (
          <div className="mobile-dock-popover" role="dialog" aria-label="Vistas da Câmera">
            <div className="mobile-popover-header">
              <span>
                <Compass size={14} className="text-cyan" /> Vistas Anatômicas
              </span>
              <button
                type="button"
                className="icon-btn-sm"
                onClick={() => setMobileDockPopover(null)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="mobile-popover-pills">
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  triggerCamera('anterior');
                  setMobileDockPopover(null);
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  triggerCamera('posterior');
                  setMobileDockPopover(null);
                }}
              >
                Posterior
              </button>
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  triggerCamera('right');
                  setMobileDockPopover(null);
                }}
              >
                Lateral
              </button>
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  triggerCamera('superior');
                  setMobileDockPopover(null);
                }}
              >
                Superior
              </button>
              <button
                type="button"
                className="btn-chip"
                onClick={() => {
                  triggerCamera('reset');
                  setMobileDockPopover(null);
                }}
              >
                Resetar
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`mobile-dock-btn ${
            sidebarOpenMobile ? 'mobile-dock-btn-active' : ''
          }`}
          onClick={() => {
            setMobileDockPopover(null);
            setMobileToolsOpen(false);
            setSidebarOpenMobile((v) => !v);
          }}
        >
          <Search size={18} />
          <span>Sistemas/Busca</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${
            mobileDockPopover === 'slice' || sliceAxis !== 'none'
              ? 'mobile-dock-btn-active'
              : ''
          }`}
          onClick={() => {
            setSidebarOpenMobile(false);
            setMobileToolsOpen(false);
            setMobileDockPopover((v) => (v === 'slice' ? null : 'slice'));
          }}
        >
          <Scissors size={18} />
          <span>Plano de Corte</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${
            mobileDockPopover === 'views' ? 'mobile-dock-btn-active' : ''
          }`}
          onClick={() => {
            setSidebarOpenMobile(false);
            setMobileToolsOpen(false);
            setMobileDockPopover((v) => (v === 'views' ? null : 'views'));
          }}
        >
          <Compass size={18} />
          <span>Vistas</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${
            showLabels ? 'mobile-dock-btn-active' : ''
          }`}
          onClick={() => {
            setMobileDockPopover(null);
            setShowLabels((v) => !v);
          }}
        >
          <Tag size={18} />
          <span>Etiquetas 3D</span>
        </button>
      </nav>

      {/* ==================== MODAL: LEGAL SOURCES & LICENSES ==================== */}
      {showLegalModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowLegalModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <ShieldCheck size={20} className="text-cyan" />
                <h2>Fontes de Modelos 3D (.GLB), Licenças e Conformidade</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowLegalModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-intro">
                O <strong>Anatomia3D Studio</strong> utiliza malhas anatômicas
                3D reais (`.glb`) provenientes de bases científicas abertas (
                <em>BodyParts3D / DBCLS</em>, <em>NIH 3D</em> e repositórios
                públicos sob licença Creative Commons / MIT) armazenadas em{' '}
                <code>public/models/</code>.
              </p>

              <div className="sources-grid">
                {LEGAL_MODEL_SOURCES.map((src) => (
                  <div key={src.id} className="source-card">
                    <div className="source-card-top">
                      <h3>{src.title}</h3>
                      <span className="license-badge">{src.license}</span>
                    </div>
                    <p className="source-org">{src.organization}</p>
                    <p className="source-usage">{src.usageInApp}</p>
                    <div className="source-links">
                      {src.sourceUrl.startsWith('http') && (
                        <a
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Acessar Repositório Oficial ↗
                        </a>
                      )}
                      <a
                        href={src.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Texto da Licença ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
