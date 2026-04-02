'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface WovenCanvasProps {
  isDark: boolean;
  /** 'fixed' for dashboard (scrollable page), 'absolute' for hero (full-screen) */
  position?: 'fixed' | 'absolute';
  opacity?: number;
}

export function WovenCanvas({ isDark, position = 'absolute', opacity = 1 }: WovenCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock  = new THREE.Clock();

    const particleCount = 42000;
    const positions     = new Float32Array(particleCount * 3);
    const origPositions = new Float32Array(particleCount * 3);
    const colors        = new Float32Array(particleCount * 3);
    const velocities    = new Float32Array(particleCount * 3);

    const geometry  = new THREE.BufferGeometry();
    const torusKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32);
    const posAttr   = torusKnot.attributes.position;

    // Purple/indigo palette
    // Dark: bright so additive blending makes them glow
    // Light: deep/saturated so they stay visible on pale background with normal blending
    const palette = isDark
      ? [[0.62, 0.64, 0.98], [0.55, 0.37, 0.88], [0.30, 0.52, 0.94], [0.78, 0.53, 0.99]]
      : [[0.32, 0.34, 0.72], [0.42, 0.18, 0.62], [0.20, 0.28, 0.70], [0.52, 0.22, 0.76]];

    for (let i = 0; i < particleCount; i++) {
      const v = i % posAttr.count;
      const x = posAttr.getX(v), y = posAttr.getY(v), z = posAttr.getZ(v);

      positions[i*3]   = origPositions[i*3]   = x;
      positions[i*3+1] = origPositions[i*3+1] = y;
      positions[i*3+2] = origPositions[i*3+2] = z;

      const c = palette[Math.floor(Math.random() * palette.length)];
      const j = (Math.random() - 0.5) * 0.12;
      colors[i*3]   = Math.max(0, Math.min(1, c[0] + j));
      colors[i*3+1] = Math.max(0, Math.min(1, c[1] + j));
      colors[i*3+2] = Math.max(0, Math.min(1, c[2] + j));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
      size: isDark ? 0.018 : 0.022,
      vertexColors: true,
      // AdditiveBlending = glowing on dark bg, invisible on light bg
      // NormalBlending   = correct colours on both, needed for light mode
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      transparent: true,
      opacity: isDark ? 0.88 : 0.82,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth)  *  2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const mw = new THREE.Vector3(mouse.x * 3, mouse.y * 3, 0);

      for (let i = 0; i < particleCount; i++) {
        const ix = i*3, iy = i*3+1, iz = i*3+2;
        const cur  = new THREE.Vector3(positions[ix],      positions[iy],      positions[iz]);
        const orig = new THREE.Vector3(origPositions[ix],  origPositions[iy],  origPositions[iz]);
        const vel  = new THREE.Vector3(velocities[ix],     velocities[iy],     velocities[iz]);

        const dist = cur.distanceTo(mw);
        if (dist < 1.5) {
          vel.add(cur.clone().sub(mw).normalize().multiplyScalar((1.5 - dist) * 0.011));
        }
        vel.add(orig.clone().sub(cur).multiplyScalar(0.001));
        vel.multiplyScalar(0.95);

        positions[ix]  += vel.x; velocities[ix]  = vel.x;
        positions[iy]  += vel.y; velocities[iy]  = vel.y;
        positions[iz]  += vel.z; velocities[iz]  = vel.z;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.y = elapsed * 0.055;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      className="inset-0 z-0"
      style={{ position, opacity, pointerEvents: 'none' }}
    />
  );
}
