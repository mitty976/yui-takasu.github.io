import * as THREE from "https://cdn.skypack.dev/three@0.158.0";

/* ======================
   🌊 流体背景（Simplex Noise）
====================== */
const canvas = document.getElementById("bg");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  u_time: { value: 0 },
  u_resolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
  }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec2 u_resolution;

    vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.2113,0.3660,-0.5773,0.02439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);

      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;

      i = mod289(i);
      vec3 p = permute(
        permute(i.y + vec3(0.0,i1.y,1.0))
        + i.x + vec3(0.0,i1.x,1.0)
      );

      vec3 m = max(0.5 - vec3(
        dot(x0,x0),
        dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)
      ), 0.0);

      m = m*m;
      m = m*m;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

      m *= 1.79 - 0.85 * (a0*a0 + h*h);

      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;

      return 130.0 * dot(m, g);
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float t = u_time * 0.035;

      float n = snoise(uv * 2.5 + t);
      n += snoise(uv * 5.0 - t) * 0.5;
      n += snoise(uv * 10.0 + t * 0.5) * 0.25;

      vec3 color = mix(
        vec3(0.94, 0.97, 1.0),
        vec3(0.75, 0.88, 1.0),
        n * 0.5 + 0.5
      );

      color += 0.04 * sin(uv.y * 8.0 + t);
      color += 0.02 * sin(uv.x * 6.0 - t);

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  material
);

scene.add(mesh);

function animate(time){
  uniforms.u_time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});