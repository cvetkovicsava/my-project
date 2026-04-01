'use client';

import { useEffect, useRef } from 'react';

// ── Vertex shader ──────────────────────────────────
const VERT = `
  attribute vec2 pos;
  void main(){gl_Position=vec4(pos,0.,1.);}
`;

// ── Fragment shader — purple/indigo plasma ─────────
const FRAG = `
  precision highp float;
  uniform float t;
  uniform vec2 res;

  void main(){
    vec2 uv = gl_FragCoord.xy / res;
    vec2 p  = (uv * 2.0 - 1.0) * vec2(res.x / res.y, 1.0);
    float s = t * 0.18;

    float v  = sin(p.x * 3.2 + s * 1.1);
    v += sin(p.y * 2.8 + s * 0.9);
    v += sin((p.x + p.y) * 2.1 + s);
    v += sin(sqrt(p.x * p.x + p.y * p.y) * 3.8 - s * 1.2);
    v += sin(p.x * 1.4 - p.y * 2.2 + s * 0.8);
    v += sin(length(p) * 2.5 + s * 1.4);

    /* Purple-indigo-violet palette */
    float r = sin(v * 0.6 + 2.0) * 0.2  + 0.18;
    float g = sin(v * 0.8 + 4.2) * 0.08 + 0.04;
    float b = sin(v * 0.7 + 0.8) * 0.3  + 0.52;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

export function Plasma({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Build program
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const tLoc   = gl.getUniformLocation(prog, 't');
    const resLoc = gl.getUniformLocation(prog, 'res');

    // Resize handler
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Render loop
    let raf: number;
    const start = performance.now();
    const render = () => {
      gl.uniform1f(tLoc, (performance.now() - start) / 1000);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
