/**
 * sakura.js — 花びら降るアニメーション
 * 使い方: Sakura.init();  または  Sakura.init({ count: 15, minSize: 4, maxSize: 9 });
 */
(function (global) {
  'use strict';

  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max));
  const pick = (arr) => arr[randInt(0, arr.length)];

  class Petal {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.opts = opts;
      this.init(true);
    }

    init(isFirst = false) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.x = rand(0, w);
      this.y = isFirst ? rand(-h, h) : rand(-60, -10);
      this.size = rand(this.opts.minSize, this.opts.maxSize);
      this.color = pick(this.opts.colors);
      this.vy = rand(0.6, 1.8);
      this.vx = rand(-0.4, 0.4);
      this.swayAngle = rand(0, Math.PI * 2);
      this.swaySpeed = rand(0.008, 0.025);
      this.swayAmp   = rand(0.4, 1.4);
      this.angle      = rand(0, Math.PI * 2);
      this.angleSpeed = rand(-0.03, 0.03);
      this.tiltAngle  = rand(0, Math.PI * 2);
      this.tiltSpeed  = rand(0.01, 0.04);
      this.opacity    = rand(0.55, 1.0);
    }

    update() {
      this.swayAngle += this.swaySpeed;
      this.tiltAngle += this.tiltSpeed;
      this.angle     += this.angleSpeed;
      this.x += this.vx + Math.sin(this.swayAngle) * this.swayAmp;
      this.y += this.vy;
      if (this.y > this.canvas.height + 30 || this.x < -60 || this.x > this.canvas.width + 60) {
        this.init(false);
      }
    }

    draw(ctx) {
      const scaleY = Math.abs(Math.cos(this.tiltAngle));
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, scaleY > 0.15 ? scaleY : 0.15);
      ctx.globalAlpha = this.opacity;
      this._drawPetal(ctx, this.size, this.color);
      ctx.restore();
    }

    _drawPetal(ctx, r, color) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo( r * 0.8, -r * 0.8,  r * 1.1,  r * 0.2, 0,  r);
      ctx.bezierCurveTo(-r * 1.1,  r * 0.2, -r * 0.8, -r * 0.8, 0, -r);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(0,  r * 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  const Sakura = {
    canvas: null,
    ctx: null,
    petals: [],
    raf: null,
    running: false,

    init(options = {}) {
      const opts = Object.assign({
        count:   30,
        colors:  ['#ffb7c5', '#ffd1dc', '#f9a8b8', '#ffccd5', '#fce4ec'],
        minSize: 5,
        maxSize: 13,
        zIndex:  '50',
        pointer: false,
      }, options);

      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position:      'fixed',
        top:           '0',
        left:          '0',
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        String(opts.zIndex),
      });
      document.body.appendChild(canvas);
      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');

      this._resize();
      window.addEventListener('resize', () => this._resize());

      this.petals = Array.from({ length: opts.count }, () => new Petal(canvas, opts));

      if (opts.pointer) {
        window.addEventListener('mousemove', (e) => {
          const mx = (e.clientX / window.innerWidth - 0.5) * 1.5;
          this.petals.forEach((p) => (p.vx = mx));
        });
      }

      this.running = true;
      this._loop();
    },

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      if (this.canvas) { this.canvas.remove(); this.canvas = null; }
    },

    _resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    _loop() {
      if (!this.running) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.petals.forEach((p) => { p.update(); p.draw(ctx); });
      this.raf = requestAnimationFrame(() => this._loop());
    },
  };

  global.Sakura = Sakura;
})(window);
