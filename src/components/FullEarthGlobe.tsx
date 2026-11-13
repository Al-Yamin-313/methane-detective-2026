import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, MapPin, Layers, Globe, Compass, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { MethaneSource } from '../types/methane';

interface FullEarthGlobeProps {
  sources: MethaneSource[];
  selectedSourceId: string;
  onSelectSource: (source: MethaneSource) => void;
  onNavigateToTrend: (source: MethaneSource) => void;
  onSwitchToMap: (targetScope?: 'bangladesh' | 'turkiye' | 'all') => void;
  lang: 'en' | 'bn';
  initialTarget?: 'global' | 'bangladesh' | 'turkiye';
}

export const FullEarthGlobe: React.FC<FullEarthGlobeProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onNavigateToTrend,
  onSwitchToMap,
  lang,
  initialTarget = 'global'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bdMarkerRef = useRef<HTMLDivElement | null>(null);
  const trMarkerRef = useRef<HTMLDivElement | null>(null);

  // Globe orientation state (angles in radians)
  // yaw: horizontal rotation (longitude), pitch: vertical tilt (latitude)
  // Default yaw centered around Indian Ocean/South Asia (~80°E = 1.4 rad)
  const orientationRef = useRef<{ yaw: number; pitch: number; zoom: number; targetYaw: number; targetPitch: number; targetZoom: number; isAnimating: boolean }>({
    yaw: 1.4,
    pitch: 0.35,
    zoom: 1.0,
    targetYaw: 1.4,
    targetPitch: 0.35,
    targetZoom: 1.0,
    isAnimating: false,
  });

  const [activePreset, setActivePreset] = useState<'global' | 'bangladesh' | 'turkiye'>('global');
  const [textureLoaded, setTextureLoaded] = useState<boolean>(false);
  const textureImageRef = useRef<HTMLImageElement | null>(null);

  // Selected source
  const selectedSource = sources.find(s => s.id === selectedSourceId) || sources[0];

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera presets
  const flyTo = useCallback((yaw: number, pitch: number, zoom: number, preset: 'global' | 'bangladesh' | 'turkiye') => {
    setActivePreset(preset);
    const o = orientationRef.current;
    o.targetYaw = yaw;
    o.targetPitch = Math.max(-1.4, Math.min(1.4, pitch));
    o.targetZoom = Math.max(0.7, Math.min(3.2, zoom));
    o.isAnimating = true;
  }, []);

  const resetToGlobal = useCallback(() => {
    // 85°E longitude, 20°N latitude, 1.0 zoom (full planet centered with comfortable margins)
    flyTo(1.48, 0.35, 0.95, 'global');
  }, [flyTo]);

  const goToBangladesh = useCallback(() => {
    // 90.35°E, 23.68°N (Bangladesh)
    const yaw = (90.35 * Math.PI) / 180;
    const pitch = (23.68 * Math.PI) / 180;
    flyTo(yaw, pitch, 2.2, 'bangladesh');
    const bd = sources.find(s => s.country === 'Bangladesh');
    if (bd) onSelectSource(bd);
  }, [flyTo, sources, onSelectSource]);

  const goToTurkiye = useCallback(() => {
    // 32.50°E, 37.87°N (Konya Closed Basin, Central Anatolia, Türkiye)
    const yaw = (32.50 * Math.PI) / 180;
    const pitch = (37.87 * Math.PI) / 180;
    flyTo(yaw, pitch, 2.0, 'turkiye');
    const tr = sources.find(s => s.country === 'Türkiye');
    if (tr) onSelectSource(tr);
  }, [flyTo, sources, onSelectSource]);

  // Handle initial target on mount
  useEffect(() => {
    if (initialTarget === 'bangladesh') goToBangladesh();
    else if (initialTarget === 'turkiye') goToTurkiye();
    else resetToGlobal();
  }, [initialTarget, goToBangladesh, goToTurkiye, resetToGlobal]);

  // Load NASA satellite texture
  useEffect(() => {
    const img = new Image();
    img.src = '/earth_nasa_blue_marble.jpg';
    img.onload = () => {
      textureImageRef.current = img;
      setTextureLoaded(true);
    };
    img.onerror = () => {
      // Fallback to MODIS global texture
      const fallbackImg = new Image();
      fallbackImg.src = '/earth_nasa_modis_global.jpg';
      fallbackImg.onload = () => {
        textureImageRef.current = fallbackImg;
        setTextureLoaded(true);
      };
    };
  }, []);

  // Convert lat/lon to 2D screen coordinate for overlays
  const projectToScreen = useCallback((lat: number, lon: number): { x: number; y: number; visible: boolean } | null => {
    const container = containerRef.current;
    if (!container) return null;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const radius = Math.min(w, h) * 0.42 * orientationRef.current.zoom;

    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);
    const cosLon = Math.cos(lonRad);
    const sinLon = Math.sin(lonRad);

    const x0 = cosLat * sinLon;
    const y0 = sinLat;
    const z0 = cosLat * cosLon;

    const cosY = Math.cos(orientationRef.current.yaw);
    const sinY = Math.sin(orientationRef.current.yaw);
    const cosP = Math.cos(orientationRef.current.pitch);
    const sinP = Math.sin(orientationRef.current.pitch);

    // Apply exact Column-Major transformation
    const x2 = x0 * cosY - z0 * sinY;
    const y2 = -x0 * sinY * sinP + y0 * cosP - z0 * cosY * sinP;
    const z2 = x0 * sinY * cosP + y0 * sinP + z0 * cosY * cosP;

    // If z2 > 0.05, it is on the facing hemisphere
    const visible = z2 > 0.05;

    const screenX = w / 2 + x2 * radius;
    const screenY = h / 2 - y2 * radius;

    return { x: screenX, y: screenY, visible };
  }, []);

  // WebGL & Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: false });
    const isWebGL = !!gl;

    // Build WebGL sphere if WebGL is available
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let vertexBuffer: WebGLBuffer | null = null;
    let indexBuffer: WebGLBuffer | null = null;
    let indexCount = 0;

    if (gl) {
      // Shaders
      const vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uMatrix;
        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vViewPos;

        void main() {
          vTexCoord = aTexCoord;
          vNormal = aPosition;
          vec4 pos = uMatrix * vec4(aPosition, 1.0);
          vViewPos = pos.xyz;
          gl_Position = pos;
        }
      `;

      const fsSource = `
        precision mediump float;
        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        uniform sampler2D uSampler;
        uniform float uAtmosphere;

        void main() {
          vec4 texColor = texture2D(uSampler, vTexCoord);
          
          // Realistic directional light from camera/sun
          vec3 lightDir = normalize(vec3(0.4, 0.4, 1.0));
          vec3 normal = normalize(vNormal);
          float diff = max(dot(normal, lightDir), 0.05);

          // Atmospheric limb glow (Fresnel effect)
          vec3 viewDir = normalize(-vViewPos);
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          fresnel = pow(fresnel, 3.0) * 0.45;
          vec3 atmosColor = vec3(0.45, 0.75, 0.95) * fresnel;

          vec3 finalColor = texColor.rgb * (0.35 + 0.65 * diff) + atmosColor;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const createShader = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);
        }
      }

      // Generate Sphere Geometry (64 latitude x 64 longitude bands)
      const latBands = 64;
      const lonBands = 64;
      const vertices: number[] = [];
      const indices: number[] = [];

      for (let lat = 0; lat <= latBands; lat++) {
        const v = lat / latBands;
        const latRad = (0.5 - v) * Math.PI; // +PI/2 (North Pole) to -PI/2 (South Pole)
        const cosLat = Math.cos(latRad);
        const sinLat = Math.sin(latRad);

        for (let lon = 0; lon <= lonBands; lon++) {
          const u = lon / lonBands;
          const lonRad = (u - 0.5) * 2 * Math.PI; // -PI (-180°) to +PI (+180°)
          const cosLon = Math.cos(lonRad);
          const sinLon = Math.sin(lonRad);

          // Standard 3D Cartesian coordinates (Y=up, X=right, Z=front at lon 0)
          const x = cosLat * sinLon;
          const y = sinLat;
          const z = cosLat * cosLon;

          vertices.push(x, y, z, u, v);
        }
      }

      for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < lonBands; lon++) {
          const first = lat * (lonBands + 1) + lon;
          const second = first + lonBands + 1;
          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }

      indexCount = indices.length;

      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Temporary 1x1 navy pixel
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 20, 38, 255]));
    }

    let animationId: number;

    const render = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (gl) gl.viewport(0, 0, width, height);
      }

      const o = orientationRef.current;

      // Smooth camera interpolation easing
      if (o.isAnimating) {
        const ease = 0.08;
        let deltaYaw = o.targetYaw - o.yaw;
        // Shortest spherical angle wrap
        while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
        while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

        o.yaw += deltaYaw * ease;
        o.pitch += (o.targetPitch - o.pitch) * ease;
        o.zoom += (o.targetZoom - o.zoom) * ease;

        if (Math.abs(deltaYaw) < 0.002 && Math.abs(o.targetPitch - o.pitch) < 0.002 && Math.abs(o.targetZoom - o.zoom) < 0.002) {
          o.yaw = o.targetYaw;
          o.pitch = o.targetPitch;
          o.zoom = o.targetZoom;
          o.isAnimating = false;
        }
      } else if (!isDraggingRef.current) {
        // Subtle inertia damping
        o.yaw += velocityRef.current.x;
        o.pitch += velocityRef.current.y;
        o.pitch = Math.max(-1.4, Math.min(1.4, o.pitch));
        velocityRef.current.x *= 0.92;
        velocityRef.current.y *= 0.92;
      }

      // Update texture if loaded
      if (gl && texture && textureImageRef.current && (textureImageRef.current as any)._glUploaded !== true) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImageRef.current);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        (textureImageRef.current as any)._glUploaded = true;
      }

      if (gl && program && vertexBuffer && indexBuffer) {
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.clearColor(0.04, 0.07, 0.13, 1.0); // #080E1A
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // Compute 3D Orthographic / Perspective MVP Matrix
        const aspect = width / height;
        const fov = 35 * (Math.PI / 180);
        const near = 0.1;
        const far = 100.0;
        const f = 1.0 / Math.tan(fov / 2);

        // Distance adjusted by zoom
        const dist = 3.6 / o.zoom;

        // Model-View-Projection Matrix
        // Rotate: Pitch around X-axis, Yaw around Y-axis
        const cosY = Math.cos(o.yaw);
        const sinY = Math.sin(o.yaw);
        const cosP = Math.cos(o.pitch);
        const sinP = Math.sin(o.pitch);

        const m0 = cosY;
        const m1 = sinY * sinP;
        const m2 = -sinY * cosP;

        const m4 = 0;
        const m5 = cosP;
        const m6 = sinP;

        const m8 = sinY;
        const m9 = -cosY * sinP;
        const m10 = cosY * cosP;

        // Combine with perspective
        const p0 = f / aspect;
        const p5 = f;
        const p10 = (far + near) / (near - far);
        const p11 = -1.0;
        const p14 = (2 * far * near) / (near - far);

        const matrix = new Float32Array([
          m0 * p0, m4 * p5, m8 * p10 + m8 * p11 * dist, -m8,
          m1 * p0, m5 * p5, m9 * p10 + m9 * p11 * dist, -m9,
          m2 * p0, m6 * p5, m10 * p10 + m10 * p11 * dist - p14, -m10 - dist,
          0, 0, -dist * p10 + p14, dist
        ]);

        // Correct Column-Major Orthographic MVP matrix matching standard UV spherical projection
        const scale = (Math.min(width, height) * 0.42 * o.zoom) / (width / 2);
        const scaleY = (Math.min(width, height) * 0.42 * o.zoom) / (height / 2);

        const orthoMatrix = new Float32Array([
          cosY * scale, -sinY * sinP * scaleY, sinY * cosP, 0,
          0, cosP * scaleY, sinP, 0,
          -sinY * scale, -cosY * sinP * scaleY, cosY * cosP, 0,
          0, 0, 0, 1
        ]);

        const uMatrixLoc = gl.getUniformLocation(program, 'uMatrix');
        gl.uniformMatrix4fv(uMatrixLoc, false, orthoMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        const aPosLoc = gl.getAttribLocation(program, 'aPosition');
        const aTexLoc = gl.getAttribLocation(program, 'aTexCoord');

        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 20, 0);

        gl.enableVertexAttribArray(aTexLoc);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 20, 12);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      }

      // 60 FPS live update of 3D Hotspot DOM Elements in lockstep with globe rotation
      const bd = projectToScreen(23.685, 90.356);
      const tr = projectToScreen(37.87, 32.50);

      if (bdMarkerRef.current && bd) {
        if (bd.visible) {
          bdMarkerRef.current.style.display = 'block';
          bdMarkerRef.current.style.left = `${bd.x}px`;
          bdMarkerRef.current.style.top = `${bd.y}px`;
        } else {
          bdMarkerRef.current.style.display = 'none';
        }
      }

      if (trMarkerRef.current && tr) {
        if (tr.visible) {
          trMarkerRef.current.style.display = 'block';
          trMarkerRef.current.style.left = `${tr.x}px`;
          trMarkerRef.current.style.top = `${tr.y}px`;
        } else {
          trMarkerRef.current.style.display = 'none';
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      if (gl) {
        if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
        if (indexBuffer) gl.deleteBuffer(indexBuffer);
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
      }
    };
  }, []);

  // Mouse / Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.005 / orientationRef.current.zoom;
    const vx = dx * sensitivity;
    const vy = -dy * sensitivity;

    orientationRef.current.yaw -= vx;
    orientationRef.current.pitch = Math.max(-1.4, Math.min(1.4, orientationRef.current.pitch + vy));
    velocityRef.current = { x: -vx * 0.5, y: vy * 0.5 };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0015;
    const newZoom = Math.max(0.7, Math.min(3.2, orientationRef.current.zoom + zoomDelta));
    orientationRef.current.zoom = newZoom;
    orientationRef.current.targetZoom = newZoom;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#080E1A] overflow-hidden select-none flex flex-col"
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Atmospheric Rim Gradient Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div 
          className="rounded-full shadow-[0_0_80px_rgba(56,189,248,0.18)] border border-sky-400/20"
          style={{
            width: `${Math.min(containerRef.current?.clientWidth || 600, containerRef.current?.clientHeight || 600) * 0.84 * orientationRef.current.zoom}px`,
            height: `${Math.min(containerRef.current?.clientWidth || 600, containerRef.current?.clientHeight || 600) * 0.84 * orientationRef.current.zoom}px`,
          }}
        />
      </div>

      {/* Interactive 3D Hotspot Markers (Bangladesh - 60 FPS Lockstep Animation) */}
      <div
        ref={bdMarkerRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group cursor-pointer"
        style={{ display: 'none' }}
        onClick={goToBangladesh}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full bg-[#FF8A4F]/30 animate-ping" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#FF8A4F] border-2 border-white shadow-[0_0_12px_#FF8A4F]" />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-[#0E1A30]/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#FF8A4F]/70 text-xs font-manrope font-bold text-white shadow-lg whitespace-nowrap flex items-center gap-1.5 transition-transform group-hover:scale-105">
            <span>Bangladesh</span>
            <span className="text-[10px] font-mono text-[#FF8A4F]">EMIT · TROPOMI</span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Hotspot Markers (Türkiye - 60 FPS Lockstep Animation) */}
      <div
        ref={trMarkerRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group cursor-pointer"
        style={{ display: 'none' }}
        onClick={goToTurkiye}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full bg-[#38BDF8]/30 animate-ping" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#38BDF8] border-2 border-white shadow-[0_0_12px_#38BDF8]" />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-[#0E1A30]/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#38BDF8]/70 text-xs font-manrope font-bold text-white shadow-lg whitespace-nowrap flex items-center gap-1.5 transition-transform group-hover:scale-105">
            <span>Türkiye</span>
            <span className="text-[10px] font-mono text-[#38BDF8]">GPM IMERG</span>
          </div>
        </div>
      </div>

      {/* Top Floating Control Bar: Navigation Shortcuts */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-[#080E1A]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#243B66] shadow-lg pointer-events-auto">
          <button
            onClick={resetToGlobal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-manrope font-semibold transition-all ${
              activePreset === 'global'
                ? 'bg-[#FF8A4F] text-black shadow-xs'
                : 'text-[#A8B7D2] hover:text-white hover:bg-[#142240]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সম্পূর্ণ পৃথিবী' : 'Full Earth'}</span>
          </button>

          <button
            onClick={goToBangladesh}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-manrope font-semibold transition-all ${
              activePreset === 'bangladesh'
                ? 'bg-[#FF8A4F] text-black shadow-xs'
                : 'text-[#A8B7D2] hover:text-white hover:bg-[#142240]'
            }`}
          >
            <span>🇧🇩</span>
            <span>{lang === 'bn' ? 'বাংলাদেশ অনুসন্ধান' : 'Explore Bangladesh'}</span>
          </button>

          <button
            onClick={goToTurkiye}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-manrope font-semibold transition-all ${
              activePreset === 'turkiye'
                ? 'bg-[#38BDF8] text-black shadow-xs'
                : 'text-[#A8B7D2] hover:text-white hover:bg-[#142240]'
            }`}
          >
            <span>🇹🇷</span>
            <span>{lang === 'bn' ? 'তুরস্ক (কনিয়া)' : 'Explore Türkiye'}</span>
          </button>
        </div>

        {/* Switch to Detailed Regional GIS Map Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => onSwitchToMap(activePreset === 'turkiye' ? 'turkiye' : activePreset === 'bangladesh' ? 'bangladesh' : 'all')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#142240] hover:bg-[#1A2C50] text-[#7CF0BC] hover:text-white border border-[#7CF0BC]/60 shadow-lg text-xs font-manrope font-bold transition-all"
            title="Switch to High-Resolution GIS Regional Map"
          >
            <Layers className="w-4 h-4 text-[#7CF0BC]" />
            <span>{lang === 'bn' ? 'আঞ্চলিক মানচিত্রে যান' : 'Open Regional Map'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Satellite Imagery Attribution & Interaction Notice */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none hidden sm:block max-w-md">
        <div className="bg-[#080E1A]/90 backdrop-blur-md p-3 rounded-xl border border-[#243B66] shadow-lg text-xs font-inter text-[#DCE6F5] space-y-1">
          <div className="flex items-center gap-2 text-[#7CF0BC] font-manrope font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NASA GIBS Blue Marble & MODIS Satellite Imagery</span>
          </div>
          <p className="text-[11px] text-[#A8B7D2] leading-relaxed">
            {lang === 'bn'
              ? 'বাস্তব উপগ্রহ চিত্রভিত্তিক ত্রিমাত্রিক পৃথিবী। মাউস বা আঙুল দিয়ে ৩৬০° ঘোরান এবং জুম করুন। দেশ নির্বাচন করে নির্দিষ্ট এলাকার তথ্য বিশ্লেষণ করুন।'
              : 'Interactive 3D Earth rendered with authentic NASA satellite imagery. Drag to rotate 360°, scroll to zoom, or select a study region to begin your investigation.'}
          </p>
          <div className="text-[10px] font-mono text-[#7CC4FF] pt-1 border-t border-[#243B66]">
            Visual Context · NASA EOSDIS GIBS · EPSG:4326 WMS Global Composite
          </div>
        </div>
      </div>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto flex flex-col gap-1.5 bg-[#080E1A]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#243B66] shadow-lg">
        <button
          onClick={() => {
            const z = Math.min(3.2, orientationRef.current.zoom + 0.3);
            orientationRef.current.zoom = z;
            orientationRef.current.targetZoom = z;
          }}
          className="w-8 h-8 rounded-lg bg-[#142240] hover:bg-[#1A2C50] text-[#A8B7D2] hover:text-white flex items-center justify-center transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const z = Math.max(0.7, orientationRef.current.zoom - 0.3);
            orientationRef.current.zoom = z;
            orientationRef.current.targetZoom = z;
          }}
          className="w-8 h-8 rounded-lg bg-[#142240] hover:bg-[#1A2C50] text-[#A8B7D2] hover:text-white flex items-center justify-center transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetToGlobal}
          className="w-8 h-8 rounded-lg bg-[#142240] hover:bg-[#1A2C50] text-[#FF8A4F] hover:text-white flex items-center justify-center transition-colors"
          title="Reset Full Earth View"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Active Focus Card (Visible when Bangladesh or Türkiye is focused) */}
      {activePreset !== 'global' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-sm w-full px-4">
          <div className="bg-[#0E1A30]/95 backdrop-blur-md p-3.5 rounded-xl border border-[#243B66] shadow-2xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[#7CF0BC] uppercase block">
                {activePreset === 'bangladesh' ? 'South Asia Study Region' : 'Central Anatolia Basin'}
              </span>
              <div className="text-sm font-manrope font-bold text-white truncate">
                {activePreset === 'bangladesh' ? 'Bangladesh (Surma-Meghna & Jamuna)' : 'Türkiye (Konya Closed Basin)'}
              </div>
              <div className="text-[11px] text-[#A8B7D2] font-inter mt-0.5">
                {activePreset === 'bangladesh' ? 'NASA EMIT, TROPOMI, GPM, SWOT, MODIS' : 'NASA GPM IMERG 5-Year Climatology'}
              </div>
            </div>
            <button
              onClick={() => onSwitchToMap(activePreset === 'turkiye' ? 'turkiye' : 'bangladesh')}
              className="px-3 py-2 rounded-lg bg-[#FF8A4F] hover:bg-[#FF752B] text-black font-manrope font-bold text-xs whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>{lang === 'bn' ? 'মানচিত্রে দেখুন' : 'View on Map'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
