import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  AnatomicalStructure,
  SystemId,
  ANATOMICAL_SYSTEMS,
} from '../data/anatomyCatalog';

export type CameraPreset =
  | 'anterior'
  | 'posterior'
  | 'left'
  | 'right'
  | 'superior'
  | 'focus'
  | 'reset';

export type SliceAxis = 'none' | 'axial' | 'sagittal' | 'coronal';

export interface GlbSubMeshItem {
  id: string;
  name: string;
  latinName: string;
  structureId: string;
  geometry: THREE.BufferGeometry;
  worldCenter: [number, number, number];
  vertexCount: number;
  triangleCount: number;
}

export interface ImportedMeshItem {
  id: string;
  name: string;
  geometry: THREE.BufferGeometry;
  material?: THREE.Material;
  materialColor: string;
  worldCenter: [number, number, number];
  matrixWorld: THREE.Matrix4;
  vertexCount: number;
  triangleCount: number;
}

interface Viewer3DProps {
  structures: AnatomicalStructure[];
  activeGlbUrl: string;
  selectedId: string | null;
  selectedSubMeshId: string | null;
  hoveredId: string | null;
  hoveredSubMeshId: string | null;
  hiddenIds: Set<string>;
  xrayIds: Set<string>;
  hiddenSystems: Set<SystemId>;
  xraySystems: Set<SystemId>;
  showLabels: boolean;
  sliceAxis: SliceAxis;
  sliceOffset: number;
  sliceInvert: boolean;
  cameraRequest: { preset: CameraPreset; timestamp: number } | null;
  importedMeshes: ImportedMeshItem[];
  onSelectStructure: (structureId: string | null, subMeshId?: string | null) => void;
  onHoverStructure: (structureId: string | null, subMeshId?: string | null) => void;
  onAtlasSubMeshesLoaded?: (subMeshes: GlbSubMeshItem[]) => void;
  quizActive: boolean;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.localClippingEnabled = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    if ('environmentIntensity' in scene) {
      (scene as any).environmentIntensity = 0.52;
    }

    return () => {
      envTarget.dispose();
      roomEnv.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  return null;
}

function CameraController({
  cameraRequest,
  focusCenter,
}: {
  cameraRequest: { preset: CameraPreset; timestamp: number } | null;
  focusCenter: [number, number, number] | null;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);
  const isMobilePortrait = size.width < 768;
  const prevMobileRef = useRef<boolean | null>(null);

  // Adjust FOV and initial framing when entering/leaving mobile (< 768px)
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    if ('fov' in persp) {
      const desiredFov = isMobilePortrait ? 48 : 40;
      if (persp.fov !== desiredFov) {
        persp.fov = desiredFov;
        persp.updateProjectionMatrix();
      }
    }

    if (prevMobileRef.current !== isMobilePortrait) {
      prevMobileRef.current = isMobilePortrait;
      const defaultY = isMobilePortrait ? 0.22 : 0.72;
      const camY = isMobilePortrait ? 0.32 : 0.92;
      const dist = isMobilePortrait ? 4.95 : 3.85;
      camera.position.set(0, camY, dist);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, defaultY, 0);
        controlsRef.current.update();
      }
    }
  }, [camera, isMobilePortrait]);

  useEffect(() => {
    if (!cameraRequest) return;
    const preset = cameraRequest.preset;
    const defaultY = isMobilePortrait ? 0.22 : 0.72;
    const camY = isMobilePortrait ? 0.32 : 0.92;
    const dist = isMobilePortrait ? 4.95 : 3.85;
    const defaultTarget = new THREE.Vector3(0, defaultY, 0);

    if (preset === 'focus' && focusCenter) {
      const mobileYOffset = isMobilePortrait ? -0.22 : 0;
      const look = new THREE.Vector3(
        focusCenter[0],
        focusCenter[1] + mobileYOffset,
        focusCenter[2]
      );
      targetLookAt.current = look;
      const focusDist = isMobilePortrait ? 1.55 : 1.15;
      targetPos.current = new THREE.Vector3(
        focusCenter[0] + 0.28,
        focusCenter[1] + 0.12 + mobileYOffset,
        focusCenter[2] + focusDist
      );
      return;
    }

    targetLookAt.current = defaultTarget;
    switch (preset) {
      case 'anterior':
      case 'reset':
        targetPos.current = new THREE.Vector3(0, camY, dist);
        break;
      case 'posterior':
        targetPos.current = new THREE.Vector3(0, camY, -dist);
        break;
      case 'left':
        targetPos.current = new THREE.Vector3(dist, camY, 0);
        break;
      case 'right':
        targetPos.current = new THREE.Vector3(-dist, camY, 0);
        break;
      case 'superior':
        targetPos.current = new THREE.Vector3(0, isMobilePortrait ? 5.2 : 4.45, 0.55);
        break;
    }
  }, [cameraRequest, focusCenter, isMobilePortrait]);

  useFrame((_, delta) => {
    if (!targetPos.current || !targetLookAt.current || !controlsRef.current) return;
    const step = Math.min(1, delta * 6.5);
    camera.position.lerp(targetPos.current, step);
    controlsRef.current.target.lerp(targetLookAt.current, step);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(targetPos.current) < 0.015 &&
      controlsRef.current.target.distanceTo(targetLookAt.current) < 0.015
    ) {
      targetPos.current = null;
      targetLookAt.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, isMobilePortrait ? 0.22 : 0.72, 0]}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.35}
      maxDistance={10.5}
      maxPolarAngle={Math.PI * 0.94}
      makeDefault
    />
  );
}

// Compute realistic sub-mesh tissue material parameters
function getSubMeshMaterialProps(
  structure: AnatomicalStructure,
  subMeshId: string
) {
  // Enamel for teeth
  if (subMeshId.includes('teeth')) {
    return {
      color: '#f8f5ec',
      roughness: 0.18,
      metalness: 0.02,
      clearcoat: 0.78,
      clearcoatRoughness: 0.12,
      sheen: 0.1,
      sheenColor: '#ffffff',
      reflectivity: 0.65,
    };
  }
  // Hyaline cartilage / intervertebral disks
  if (
    subMeshId.includes('disks') ||
    subMeshId.includes('trachea') ||
    subMeshId.includes('bronchi')
  ) {
    return {
      color: subMeshId.includes('disks') ? '#cbd5e1' : structure.color,
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.52,
      clearcoatRoughness: 0.18,
      sheen: 0.35,
      sheenColor: '#e0f2fe',
      reflectivity: 0.5,
    };
  }
  // Gallbladder / biliary tree
  if (subMeshId === 'gallbladder_biliary') {
    return {
      color: '#15803d',
      roughness: 0.25,
      metalness: 0.04,
      clearcoat: 0.65,
      clearcoatRoughness: 0.14,
      sheen: 0.3,
      sheenColor: '#86efac',
      reflectivity: 0.55,
    };
  }
  // Spleen
  if (subMeshId === 'spleen_organ') {
    return {
      color: '#881337',
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.58,
      clearcoatRoughness: 0.16,
      sheen: 0.35,
      sheenColor: '#fda4af',
      reflectivity: 0.52,
    };
  }
  // Pancreas
  if (subMeshId === 'pancreas_organ') {
    return {
      color: '#eab308',
      roughness: 0.34,
      metalness: 0.03,
      clearcoat: 0.46,
      clearcoatRoughness: 0.22,
      sheen: 0.35,
      sheenColor: '#fef08a',
      reflectivity: 0.48,
    };
  }
  // Heart valves
  if (subMeshId === 'heart_valves') {
    return {
      color: '#f1f5f9',
      roughness: 0.26,
      metalness: 0.02,
      clearcoat: 0.6,
      clearcoatRoughness: 0.16,
      sheen: 0.4,
      sheenColor: '#ffe4e6',
      reflectivity: 0.5,
    };
  }
  // Brain ventricles
  if (subMeshId === 'brain_ventricles') {
    return {
      color: '#38bdf8',
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      sheen: 0.3,
      sheenColor: '#bae6fd',
      reflectivity: 0.6,
    };
  }

  // System-specific realistic physical tissue properties
  switch (structure.system) {
    case 'skeletal':
      return {
        color: structure.color,
        roughness: 0.44,
        metalness: 0.02,
        clearcoat: 0.14,
        clearcoatRoughness: 0.48,
        sheen: 0.2,
        sheenColor: '#f5efe0',
        reflectivity: 0.35,
      };
    case 'muscular':
      return {
        color: structure.color,
        roughness: 0.38,
        metalness: 0.03,
        clearcoat: 0.36,
        clearcoatRoughness: 0.26,
        sheen: 0.46,
        sheenRoughness: 0.42,
        sheenColor: '#fca5a5',
        reflectivity: 0.42,
      };
    case 'cardiovascular':
    case 'digestive':
    case 'respiratory':
      return {
        color: structure.color,
        roughness: structure.roughness ?? 0.3,
        metalness: 0.04,
        clearcoat: structure.clearcoat ?? 0.56,
        clearcoatRoughness: structure.clearcoatRoughness ?? 0.16,
        sheen: 0.34,
        sheenColor: '#fecdd3',
        reflectivity: 0.52,
      };
    case 'nervous':
    default:
      return {
        color: structure.color,
        roughness: 0.34,
        metalness: 0.03,
        clearcoat: 0.42,
        clearcoatRoughness: 0.22,
        sheen: 0.35,
        sheenColor: '#fef08a',
        reflectivity: 0.46,
      };
  }
}

function AtlasStructureGroup({
  structure,
  subMeshes,
  selectedId,
  selectedSubMeshId,
  hoveredId,
  hoveredSubMeshId,
  hiddenIds,
  xrayIds,
  isSystemXray,
  clippingPlanes,
  showLabels,
  quizActive,
  onSelect,
  onHover,
}: {
  structure: AnatomicalStructure;
  subMeshes: GlbSubMeshItem[];
  selectedId: string | null;
  selectedSubMeshId: string | null;
  hoveredId: string | null;
  hoveredSubMeshId: string | null;
  hiddenIds: Set<string>;
  xrayIds: Set<string>;
  isSystemXray: boolean;
  clippingPlanes: THREE.Plane[];
  showLabels: boolean;
  quizActive: boolean;
  onSelect: (structureId: string, subMeshId: string) => void;
  onHover: (structureId: string | null, subMeshId?: string | null) => void;
}) {
  const systemMeta = useMemo(
    () => ANATOMICAL_SYSTEMS.find((s) => s.id === structure.system),
    [structure.system]
  );

  const visibleSubMeshes = useMemo(
    () => subMeshes.filter((sm) => !hiddenIds.has(sm.id)),
    [subMeshes, hiddenIds]
  );

  if (visibleSubMeshes.length === 0) return null;

  const isStructSelected = selectedId === structure.id;
  const isStructHovered = hoveredId === structure.id;
  const isStructXray = xrayIds.has(structure.id) || isSystemXray;

  // Floating 3D label logic:
  // By default (showLabels=false), only display the 3D pin on the selected or hovered structure/sub-mesh!
  // When showLabels=true, display pins on all non-xray structures.
  const shouldShowPin =
    !quizActive &&
    ((showLabels && !isStructXray) || isStructSelected || isStructHovered);

  const activeSubMesh =
    visibleSubMeshes.find((sm) => sm.id === hoveredSubMeshId) ??
    visibleSubMeshes.find((sm) => sm.id === selectedSubMeshId) ??
    null;

  const pinPosition: [number, number, number] = activeSubMesh
    ? activeSubMesh.worldCenter
    : structure.labelOffset;

  const pinTitle = activeSubMesh ? activeSubMesh.name : structure.name;

  return (
    <group name={structure.id}>
      {visibleSubMeshes.map((sm) => {
        const isSmSelected =
          selectedSubMeshId === sm.id ||
          (isStructSelected && !selectedSubMeshId);
        const isSmHovered =
          hoveredSubMeshId === sm.id ||
          (isStructHovered && !hoveredSubMeshId);
        const isSmXray = isStructXray || xrayIds.has(sm.id);

        // Give outer lung parenchyma slight translucency if bronchial tree is also visible
        const defaultOp =
          sm.id.endsWith('_lung_parenchyma') && isStructSelected
            ? 0.72
            : structure.defaultOpacity ?? 1.0;
        const opacity = isSmXray ? 0.2 : defaultOp;
        const isTransparent = opacity < 0.99;

        const matProps = getSubMeshMaterialProps(structure, sm.id);

        const emissiveColor = isSmSelected
          ? '#06b6d4'
          : isSmHovered
          ? '#38bdf8'
          : '#000000';
        const emissiveIntensity = isSmSelected ? 0.42 : isSmHovered ? 0.24 : 0;

        return (
          <mesh
            key={sm.id}
            name={sm.id}
            geometry={sm.geometry}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(structure.id, sm.id);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              onHover(structure.id, sm.id);
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              document.body.style.cursor = 'auto';
              onHover(null, null);
            }}
            castShadow={!isTransparent}
            receiveShadow
          >
            <meshPhysicalMaterial
              color={matProps.color}
              roughness={matProps.roughness}
              metalness={matProps.metalness}
              clearcoat={matProps.clearcoat}
              clearcoatRoughness={matProps.clearcoatRoughness}
              sheen={matProps.sheen}
              sheenRoughness={0.45}
              sheenColor={matProps.sheenColor}
              reflectivity={matProps.reflectivity}
              transparent={isTransparent}
              opacity={opacity}
              depthWrite={!isTransparent}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
        );
      })}

      {shouldShowPin && (
        <Html
          position={pinPosition}
          center
          distanceFactor={3.8}
          zIndexRange={[20, 0]}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(
                structure.id,
                activeSubMesh?.id ?? visibleSubMeshes[0].id
              );
            }}
            className={`pin-label ${isStructSelected ? 'pin-label-active' : ''} ${
              isStructHovered ? 'pin-label-hover' : ''
            }`}
            title={`${pinTitle} (${structure.latinName})`}
          >
            <span
              className="pin-dot"
              style={{ backgroundColor: systemMeta?.color ?? structure.color }}
            />
            <span className="pin-text">{pinTitle}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

function ImportedMeshNode({
  item,
  isSelected,
  isHovered,
  isXray,
  clippingPlanes,
  showLabels,
  onSelect,
  onHover,
}: {
  item: ImportedMeshItem;
  isSelected: boolean;
  isHovered: boolean;
  isXray: boolean;
  clippingPlanes: THREE.Plane[];
  showLabels: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const opacity = isXray ? 0.22 : 1.0;
  const isTransparent = opacity < 0.99;

  // Clone original textured material if present, or fall back to physical material
  const customMat = useMemo(() => {
    if (!item.material) return null;
    const cloned = item.material.clone() as THREE.MeshStandardMaterial;
    cloned.side = THREE.DoubleSide;
    cloned.clippingPlanes = clippingPlanes;
    cloned.transparent = isTransparent;
    cloned.opacity = opacity;
    cloned.depthWrite = !isTransparent;
    if ('emissive' in cloned) {
      cloned.emissive = new THREE.Color(
        isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : '#000000'
      );
      cloned.emissiveIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;
    }
    return cloned;
  }, [item.material, clippingPlanes, isTransparent, opacity, isSelected, isHovered]);

  const shouldShowPin = (showLabels && !isXray) || isSelected || isHovered;

  return (
    <group>
      <mesh
        geometry={item.geometry}
        matrixAutoUpdate={false}
        matrix={item.matrixWorld}
        material={customMat ?? undefined}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(item.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          onHover(null);
        }}
        castShadow={!isTransparent}
        receiveShadow
      >
        {!customMat && (
          <meshPhysicalMaterial
            color={item.materialColor}
            roughness={0.34}
            metalness={0.04}
            clearcoat={0.48}
            clearcoatRoughness={0.2}
            sheen={0.35}
            sheenColor="#fecdd3"
            transparent={isTransparent}
            opacity={opacity}
            depthWrite={!isTransparent}
            emissive={isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : '#000000'}
            emissiveIntensity={isSelected ? 0.42 : isHovered ? 0.24 : 0}
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes}
          />
        )}
      </mesh>
      {shouldShowPin && (
        <Html
          position={item.worldCenter}
          center
          distanceFactor={3.8}
          zIndexRange={[20, 0]}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
            className={`pin-label ${isSelected ? 'pin-label-active' : ''} ${
              isHovered ? 'pin-label-hover' : ''
            }`}
          >
            <span className="pin-dot" style={{ backgroundColor: '#38bdf8' }} />
            <span className="pin-text">{item.name}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

function SlicePlaneIndicator({
  sliceAxis,
  sliceOffset,
}: {
  sliceAxis: SliceAxis;
  sliceOffset: number;
}) {
  if (sliceAxis === 'none') return null;

  let position: [number, number, number] = [0, 0.9, 0];
  let rotation: [number, number, number] = [0, 0, 0];

  if (sliceAxis === 'axial') {
    position = [0, sliceOffset, 0];
    rotation = [Math.PI / 2, 0, 0];
  } else if (sliceAxis === 'sagittal') {
    position = [sliceOffset, 0.9, 0];
    rotation = [0, Math.PI / 2, 0];
  } else if (sliceAxis === 'coronal') {
    position = [0, 0.9, sliceOffset];
    rotation = [0, 0, 0];
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.2, 2.2)]} />
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.65} />
      </lineSegments>
    </group>
  );
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  structures,
  activeGlbUrl,
  selectedId,
  selectedSubMeshId,
  hoveredId,
  hoveredSubMeshId,
  hiddenIds,
  xrayIds,
  hiddenSystems,
  xraySystems,
  showLabels,
  sliceAxis,
  sliceOffset,
  sliceInvert,
  cameraRequest,
  importedMeshes,
  onSelectStructure,
  onHoverStructure,
  onAtlasSubMeshesLoaded,
  quizActive,
}) => {
  const [atlasSubMeshes, setAtlasSubMeshes] = useState<GlbSubMeshItem[]>([]);
  const [standaloneOrganMeshes, setStandaloneOrganMeshes] = useState<
    ImportedMeshItem[]
  >([]);
  const [loadingGlb, setLoadingGlb] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isFullAtlas = activeGlbUrl.includes('human_anatomy_atlas.glb');

  // Load real .GLB file from public/models/
  useEffect(() => {
    let cancelled = false;
    setLoadingGlb(true);
    setLoadError(null);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      activeGlbUrl,
      (gltf) => {
        if (cancelled) return;
        const scene = gltf.scene;
        scene.updateMatrixWorld(true);

        if (activeGlbUrl.includes('human_anatomy_atlas.glb')) {
          const extracted: GlbSubMeshItem[] = [];
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const geom = mesh.geometry;
              if (!geom.boundingBox) geom.computeBoundingBox();
              if (!geom.boundingSphere) geom.computeBoundingSphere();

              const extras =
                mesh.userData && Object.keys(mesh.userData).length > 0
                  ? mesh.userData
                  : mesh.parent?.userData ?? {};

              const structureId: string =
                extras.structureId || mesh.parent?.name || 'cranium';
              const subMeshId: string = extras.subMeshId || mesh.name;
              const subMeshName: string =
                extras.subMeshName || mesh.name.replace(/_/g, ' ');
              const latinName: string = extras.latinName || '';

              let center: [number, number, number] = [0, 1.0, 0];
              if (Array.isArray(extras.center) && extras.center.length === 3) {
                center = [extras.center[0], extras.center[1], extras.center[2]];
              } else if (geom.boundingBox) {
                const c = new THREE.Vector3();
                geom.boundingBox.getCenter(c);
                c.applyMatrix4(mesh.matrixWorld);
                center = [c.x, c.y, c.z];
              }

              const vCount =
                extras.vertexCount ?? geom.attributes.position?.count ?? 0;
              const tCount =
                extras.triangleCount ??
                (geom.index ? geom.index.count / 3 : Math.floor(vCount / 3));

              extracted.push({
                id: subMeshId,
                name: subMeshName,
                latinName,
                structureId,
                geometry: geom,
                worldCenter: center,
                vertexCount: vCount,
                triangleCount: tCount,
              });
            }
          });

          setAtlasSubMeshes(extracted);
          setStandaloneOrganMeshes([]);
          onAtlasSubMeshesLoaded?.(extracted);
        } else {
          // Standalone high-res organ .GLB from public/models/
          const items = extractNormalizedMeshesFromScene(
            scene,
            activeGlbUrl.split('/').pop() || 'organ.glb'
          );
          setStandaloneOrganMeshes(items);
        }
        setLoadingGlb(false);
      },
      undefined,
      (err: any) => {
        if (cancelled) return;
        console.error('Erro ao carregar GLB:', err);
        setLoadError(
          `Não foi possível carregar ${activeGlbUrl}: ${
            err?.message || 'Erro de leitura'
          }`
        );
        setLoadingGlb(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [activeGlbUrl]);

  const clippingPlanes = useMemo(() => {
    if (sliceAxis === 'none') return [];
    const sign = sliceInvert ? 1 : -1;
    if (sliceAxis === 'axial') {
      return [new THREE.Plane(new THREE.Vector3(0, sign, 0), -sign * sliceOffset)];
    }
    if (sliceAxis === 'sagittal') {
      return [new THREE.Plane(new THREE.Vector3(sign, 0, 0), -sign * sliceOffset)];
    }
    if (sliceAxis === 'coronal') {
      return [new THREE.Plane(new THREE.Vector3(0, 0, sign), -sign * sliceOffset)];
    }
    return [];
  }, [sliceAxis, sliceOffset, sliceInvert]);

  const subMeshesByStructure = useMemo(() => {
    const map = new Map<string, GlbSubMeshItem[]>();
    for (const sm of atlasSubMeshes) {
      let arr = map.get(sm.structureId);
      if (!arr) {
        arr = [];
        map.set(sm.structureId, arr);
      }
      arr.push(sm);
    }
    return map;
  }, [atlasSubMeshes]);

  const focusCenter = useMemo<[number, number, number] | null>(() => {
    if (selectedSubMeshId) {
      const sm = atlasSubMeshes.find((m) => m.id === selectedSubMeshId);
      if (sm) return sm.worldCenter;
    }
    if (selectedId) {
      const st = structures.find((s) => s.id === selectedId);
      if (st) return st.center;
      const imp = [...standaloneOrganMeshes, ...importedMeshes].find(
        (m) => m.id === selectedId
      );
      if (imp) return imp.worldCenter;
    }
    return [0, 0.72, 0];
  }, [
    selectedId,
    selectedSubMeshId,
    atlasSubMeshes,
    structures,
    standaloneOrganMeshes,
    importedMeshes,
  ]);

  const visibleStructures = useMemo(
    () =>
      structures.filter(
        (s) => !hiddenIds.has(s.id) && !hiddenSystems.has(s.system)
      ),
    [structures, hiddenIds, hiddenSystems]
  );

  const allStandaloneAndImported = useMemo(
    () =>
      [...standaloneOrganMeshes, ...importedMeshes].filter(
        (m) => !hiddenIds.has(m.id)
      ),
    [standaloneOrganMeshes, importedMeshes, hiddenIds]
  );

  return (
    <div className="viewer-canvas-wrapper">
      {loadingGlb && (
        <div className="glb-loading-overlay">
          <div className="glb-spinner" />
          <span>Carregando malhas anatômicas 3D (.GLB)...</span>
        </div>
      )}
      {loadError && (
        <div className="error-toast">
          <span>{loadError}</span>
        </div>
      )}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{
          position:
            typeof window !== 'undefined' && window.innerWidth < 768
              ? [0, 0.32, 4.95]
              : [0, 0.92, 3.85],
          fov:
            typeof window !== 'undefined' && window.innerWidth < 768 ? 48 : 40,
          near: 0.05,
          far: 50,
        }}
        onPointerMissed={() => onSelectStructure(null, null)}
      >
        <StudioEnvironment />
        <color attach="background" args={['#080d16']} />
        <fog attach="fog" args={['#080d16', 7.0, 15.0]} />

        {/* Clinical Studio 3-Point + Rim Lighting */}
        <ambientLight intensity={0.42} />
        <hemisphereLight args={['#f8fafc', '#1e293b', 0.58]} />
        <directionalLight
          position={[3.2, 4.8, 4.2]}
          intensity={1.55}
          color="#fffaf0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-3.6, 2.4, -3.2]}
          intensity={0.85}
          color="#93c5fd"
        />
        <directionalLight
          position={[-2.8, 1.2, 2.8]}
          intensity={0.48}
          color="#e2e8f0"
        />

        <CameraController
          cameraRequest={cameraRequest}
          focusCenter={focusCenter}
        />

        {/* Real Anatomical Atlas Sub-Meshes (.GLB) */}
        {isFullAtlas && (
          <group>
            {visibleStructures.map((structure) => {
              const smList = subMeshesByStructure.get(structure.id) ?? [];
              if (smList.length === 0) return null;
              return (
                <AtlasStructureGroup
                  key={structure.id}
                  structure={structure}
                  subMeshes={smList}
                  selectedId={selectedId}
                  selectedSubMeshId={selectedSubMeshId}
                  hoveredId={hoveredId}
                  hoveredSubMeshId={hoveredSubMeshId}
                  hiddenIds={hiddenIds}
                  xrayIds={xrayIds}
                  isSystemXray={xraySystems.has(structure.system)}
                  clippingPlanes={clippingPlanes}
                  showLabels={showLabels}
                  quizActive={quizActive}
                  onSelect={(stId, smId) => onSelectStructure(stId, smId)}
                  onHover={(stId, smId) => onHoverStructure(stId, smId)}
                />
              );
            })}
          </group>
        )}

        {/* Standalone High-Res Organ GLB or User-Imported GLB Meshes */}
        {allStandaloneAndImported.length > 0 && (
          <group>
            {allStandaloneAndImported.map((item) => (
              <ImportedMeshNode
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                isHovered={hoveredId === item.id}
                isXray={xrayIds.has(item.id)}
                clippingPlanes={clippingPlanes}
                showLabels={showLabels}
                onSelect={(id) => onSelectStructure(id, null)}
                onHover={(id) => onHoverStructure(id, null)}
              />
            ))}
          </group>
        )}

        <SlicePlaneIndicator sliceAxis={sliceAxis} sliceOffset={sliceOffset} />

        {/* Studio Anatomical Floor Grid & Contact Shadows */}
        <Grid
          position={[0, -1.62, 0]}
          args={[8, 8]}
          cellSize={0.25}
          cellThickness={0.5}
          cellColor="#1e293b"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#334155"
          fadeDistance={7.5}
          fadeStrength={1.3}
        />
        <ContactShadows
          position={[0, -1.61, 0]}
          opacity={0.5}
          scale={4.8}
          blur={2.2}
          far={4.2}
        />
      </Canvas>
    </div>
  );
};

function extractNormalizedMeshesFromScene(
  scene: THREE.Group,
  fileName: string
): ImportedMeshItem[] {
  const overallBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  overallBox.getSize(size);
  overallBox.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const targetScale = 1.85 / maxDim;

  const normalizeMatrix = new THREE.Matrix4()
    .makeTranslation(0, 0.85, 0)
    .multiply(new THREE.Matrix4().makeScale(targetScale, targetScale, targetScale))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));

  const items: ImportedMeshItem[] = [];
  let index = 0;
  const baseTitle = fileName.replace(/\.(glb|gltf)$/i, '');

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geom = mesh.geometry.clone();
      if (!geom.attributes.normal) {
        geom.computeVertexNormals();
      }
      geom.computeBoundingBox();

      const finalMatrix = normalizeMatrix.clone().multiply(mesh.matrixWorld);
      const localCenter = new THREE.Vector3();
      if (geom.boundingBox) {
        geom.boundingBox.getCenter(localCenter);
      }
      localCenter.applyMatrix4(finalMatrix);

      let hexColor = '#e2a898';
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat && (mat as THREE.MeshStandardMaterial).color) {
        hexColor = '#' + (mat as THREE.MeshStandardMaterial).color.getHexString();
      }

      const rawName = mesh.name || '';
      const isGenericName =
        !rawName ||
        rawName.startsWith('tripo_') ||
        rawName.startsWith('meshes[');

      const cleanName = !isGenericName
        ? rawName.replace(/_/g, ' ')
        : index === 0
        ? `Malha Anatômica Principal (${baseTitle})`
        : `${baseTitle} — Sub-malha ${index + 1}`;

      const vCount = geom.attributes.position?.count ?? 0;
      const tCount = geom.index
        ? Math.floor(geom.index.count / 3)
        : Math.floor(vCount / 3);

      items.push({
        id: `glb_${baseTitle}_${index}`,
        name: cleanName,
        geometry: geom,
        material: mat,
        materialColor: hexColor,
        worldCenter: [localCenter.x, localCenter.y, localCenter.z],
        matrixWorld: finalMatrix,
        vertexCount: vCount,
        triangleCount: tCount,
      });
      index++;
    }
  });

  return items;
}

export async function parseGlbFileToMeshes(
  file: File
): Promise<ImportedMeshItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  return new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        const scene = gltf.scene;
        scene.updateMatrixWorld(true);
        const items = extractNormalizedMeshesFromScene(scene, file.name);
        resolve(items);
      },
      (err) => reject(err)
    );
  });
}
