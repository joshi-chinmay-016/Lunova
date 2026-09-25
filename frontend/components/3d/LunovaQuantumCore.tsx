'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCw, ZoomIn, ZoomOut, Sparkles, Layers, Activity } from 'lucide-react';

interface QuantumCoreProps {
  isProcessing?: boolean;
  activeStage?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export default function LunovaQuantumCore({
  isProcessing = false,
  activeStage = 'idle',
  selectedNodeId,
  onSelectNode,
}: QuantumCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'core' | 'galaxy'>('core');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const galaxyNodesRef = useRef<{ mesh: THREE.Mesh; id: string; label: string; group: string }[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // SCENE
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a13, 0.02);
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 4, 50);
    pointLight1.position.set(10, 15, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 4, 50);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    const pointLightCenter = new THREE.PointLight(0xa855f7, 3, 20);
    pointLightCenter.position.set(0, 0, 0);
    scene.add(pointLightCenter);

    // CORE GROUP
    const coreGroup = new THREE.Group();
    coreGroupRef.current = coreGroup;
    scene.add(coreGroup);

    // 1. CENTRAL GLOWING ICOSAHEDRON (NEURAL BRAIN)
    const icoGeo = new THREE.IcosahedronGeometry(2.8, 2);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(icosahedron);

    // Inner pulsating core
    const innerGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerSphere);

    // 2. ORBITAL GYROSCOPIC RINGS
    const ringMaterials = [
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4,
        metalness: 0.9,
        roughness: 0.1,
      }),
    ];

    const ringRadii = [4.2, 5.4, 6.6];
    const rings: THREE.Mesh[] = [];

    ringRadii.forEach((radius, idx) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.08, 16, 100);
      const ringMesh = new THREE.Mesh(ringGeo, ringMaterials[idx]);
      ringMesh.rotation.x = Math.PI / (idx + 1.8);
      ringMesh.rotation.y = Math.PI / (idx + 2.2);
      coreGroup.add(ringMesh);
      rings.push(ringMesh);
    });
    ringsRef.current = rings;

    // 3. BACKGROUND / VECTOR GALAXY PARTICLES
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x6366f1),
      new THREE.Color(0x06b6d4),
      new THREE.Color(0x10b981),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < particleCount; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const r = THREE.MathUtils.randFloat(10, 45);

      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(theta);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 4. KNOWLEDGE & AGENT SATELLITE NODES
    const clusterNodes = [
      { id: 'kb-arch', label: 'Arch & Standards', color: 0x06b6d4, pos: [-7, 3, 2], group: 'knowledge' },
      { id: 'kb-sec', label: 'OAuth2 & Security', color: 0x10b981, pos: [6, 4, -3], group: 'knowledge' },
      { id: 'kb-data', label: 'Tenant Isolation', color: 0x3b82f6, pos: [-5, -5, 3], group: 'knowledge' },
      { id: 'kb-compliance', label: 'SLA & Audit Trail', color: 0x8b5cf6, pos: [7, -4, 2], group: 'knowledge' },
      { id: 'agent-extract', label: 'Gemini Extractor', color: 0xf59e0b, pos: [0, 8, -2], group: 'agent' },
      { id: 'agent-rag', label: 'Vector RAG Engine', color: 0x14b8a6, pos: [-8, 0, -4], group: 'agent' },
      { id: 'agent-guard', label: 'Grounding Guardrail', color: 0xef4444, pos: [8, 0, 4], group: 'agent' },
    ];

    const galaxyNodesList: { mesh: THREE.Mesh; id: string; label: string; group: string }[] = [];

    // Line material for neural synapses
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.25,
    });

    clusterNodes.forEach((node) => {
      const nodeGeo = new THREE.SphereGeometry(0.55, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(node.pos[0], node.pos[1], node.pos[2]);
      coreGroup.add(nodeMesh);

      // Synapse line connecting node to central core
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(node.pos[0], node.pos[1], node.pos[2]),
      ]);
      const synapseLine = new THREE.Line(lineGeo, lineMat);
      coreGroup.add(synapseLine);

      galaxyNodesList.push({
        mesh: nodeMesh,
        id: node.id,
        label: node.label,
        group: node.group,
      });
    });

    galaxyNodesRef.current = galaxyNodesList;

    // MOUSE INTERACTION (DRAGGING TO ROTATE)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting for hover
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const interactiveMeshes = galaxyNodesList.map((n) => n.mesh);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const found = galaxyNodesList.find((n) => n.mesh === intersects[0].object);
        if (found) {
          setHoveredNode(found.label);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredNode(null);
        container.style.cursor = isDragging ? 'grabbing' : 'default';
      }

      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'default';
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const interactiveMeshes = galaxyNodesList.map((n) => n.mesh);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const found = galaxyNodesList.find((n) => n.mesh === intersects[0].object);
        if (found && onSelectNode) {
          onSelectNode(found.id);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const speedMultiplier = isProcessing ? 2.8 : 1.0;

      // Pulsing central brain
      const scale = 1 + Math.sin(elapsedTime * 2.5 * speedMultiplier) * 0.08;
      icosahedron.scale.set(scale, scale, scale);
      innerSphere.scale.set(scale * 0.95, scale * 0.95, scale * 0.95);

      // Rotate gyroscopic rings at varied speeds
      if (rings[0]) rings[0].rotation.z += 0.012 * speedMultiplier;
      if (rings[1]) rings[1].rotation.x += 0.015 * speedMultiplier;
      if (rings[2]) rings[2].rotation.y += 0.01 * speedMultiplier;

      // Gentle auto-rotation
      if (isRotating) {
        coreGroup.rotation.y += 0.003 * speedMultiplier;
        coreGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.1;
      }

      // Smooth mouse rotation dampening
      coreGroup.rotation.y += (targetRotationY - coreGroup.rotation.y) * 0.1;
      coreGroup.rotation.x += (targetRotationX - coreGroup.rotation.x) * 0.1;

      // Drift background starfield
      if (particles) {
        particles.rotation.y = elapsedTime * 0.02;
        particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05;
      }

      // Satellite node pulsing
      galaxyNodesList.forEach((node, i) => {
        const nodeScale = 1 + Math.sin(elapsedTime * 3 + i) * 0.15;
        node.mesh.scale.set(nodeScale, nodeScale, nodeScale);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      renderer.dispose();
      scene.clear();
    };
  }, [isProcessing, isRotating]);

  // Handle Zoom
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = Math.min(Math.max(cameraRef.current.position.z + delta, 12), 40);
    cameraRef.current.position.z = newZ;
    setZoomLevel(Math.round((24 / newZ) * 100) / 100);
  };

  // Toggle View Mode (Center Core vs Exploded Galaxy)
  const toggleViewMode = () => {
    const nextMode = viewMode === 'core' ? 'galaxy' : 'core';
    setViewMode(nextMode);

    if (cameraRef.current && coreGroupRef.current) {
      if (nextMode === 'galaxy') {
        cameraRef.current.position.set(0, 8, 30);
      } else {
        cameraRef.current.position.set(0, 0, 24);
      }
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-b from-slate-950/80 via-[#0a0f24]/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Futuristic HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            {isProcessing ? 'SYNAPSES ACTIVE // PARSING' : 'LUNOVA QUANTUM NEURAL CORE'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>TENANT: <strong className="text-indigo-300">LUNETRON (ISOLATED)</strong></span>
          <span>•</span>
          <span>DIM: <strong className="text-emerald-300">1536 VECTOR</strong></span>
        </div>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md text-xs font-mono text-cyan-300 shadow-lg pointer-events-none animate-bounce">
          ✦ Focus Node: {hoveredNode} (Click to inspect)
        </div>
      )}

      {/* Processing State Flare Banner */}
      {isProcessing && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-xs font-mono text-indigo-300 flex items-center gap-2 animate-pulse">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Stage: {activeStage.toUpperCase()}</span>
        </div>
      )}

      {/* Floating 3D Control Pad */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
        <button
          onClick={toggleViewMode}
          title="Toggle Galaxy / Core View"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/30 transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{viewMode === 'core' ? 'Core' : 'Galaxy'}</span>
        </button>

        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={() => setIsRotating(!isRotating)}
          title="Toggle Auto Rotation"
          className={`p-2 rounded-lg transition-colors ${
            isRotating ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(-3)}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(3)}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Status Ticker */}
      <div className="absolute bottom-3 left-4 z-10 text-[10px] font-mono text-slate-500 flex items-center gap-3 pointer-events-none">
        <span>FPS: 60</span>
        <span>•</span>
        <span>WebGL 2.0 (Three.js ACES)</span>
        <span>•</span>
        <span>Vectors: 1,284 Active</span>
      </div>
    </div>
  );
}
