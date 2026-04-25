(function (global) {
  const rand = (a,b)=>Math.random()*(b-a)+a;

  class Flare {
    constructor(canvas){
      this.canvas = canvas;
      this.reset(true);
    }

    reset(first=false){
      this.x = rand(0, this.canvas.width);
      this.y = first ? rand(0, this.canvas.height) : this.canvas.height + 50;
      this.r = rand(30, 100);
      this.vy = rand(0.1, 0.3);
      this.alpha = rand(0.05, 0.2);
    }

    update(){
      this.y -= this.vy;
      if(this.y < -50) this.reset();
    }

    draw(ctx){
      const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r);
      g.addColorStop(0, `rgba(255,255,200,${this.alpha})`);
      g.addColorStop(1, `rgba(255,255,200,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  const SummerFlare = {
    init(opts={}){
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);

      Object.assign(canvas.style,{
        position:"fixed",top:0,left:0,width:"100%",height:"100%",
        pointerEvents:"none",zIndex:"50"
      });

      const ctx = canvas.getContext("2d");
      const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};
      addEventListener("resize",resize); resize();

      const flares = Array.from({length:opts.count||10},()=>new Flare(canvas));

      function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        flares.forEach(f=>{f.update();f.draw(ctx);});
        requestAnimationFrame(loop);
      }
      loop();
    }
  };

  global.SummerFlare = SummerFlare;
})(window);