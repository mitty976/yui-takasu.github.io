(function(global){
  const rand=(a,b)=>Math.random()*(b-a)+a;
  const colors=["#d2691e","#ff8c00","#b22222","#daa520"];

  class Leaf{
    constructor(c){this.c=c;this.reset(true);}
    reset(first=false){
      this.x=rand(0,this.c.width);
      this.y=first?rand(-this.c.height,this.c.height):-20;
      this.r=rand(6,12);
      this.vy=rand(1,2);
      this.vx=rand(-0.5,0.5);
      this.angle=rand(0,Math.PI*2);
      this.spin=rand(-0.05,0.05);
      this.color=colors[Math.floor(rand(0,colors.length))];
    }
    update(){
      this.x+=this.vx;
      this.y+=this.vy;
      this.angle+=this.spin;
      if(this.y>this.c.height+20) this.reset();
    }
    draw(ctx){
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.moveTo(0,-this.r);
      ctx.lineTo(this.r,0);
      ctx.lineTo(0,this.r);
      ctx.lineTo(-this.r,0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const AutumnLeaves={
    init(opts={}){
      const canvas=document.createElement("canvas");
      document.body.appendChild(canvas);
      Object.assign(canvas.style,{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:"50"});
      const ctx=canvas.getContext("2d");
      const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};
      addEventListener("resize",resize);resize();

      const arr=Array.from({length:opts.count||25},()=>new Leaf(canvas));

      function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        arr.forEach(l=>{l.update();l.draw(ctx);});
        requestAnimationFrame(loop);
      }
      loop();
    }
  };

  global.AutumnLeaves=AutumnLeaves;
})(window);