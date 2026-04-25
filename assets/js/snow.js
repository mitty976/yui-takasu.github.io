(function(global){
  const rand=(a,b)=>Math.random()*(b-a)+a;

  class Snow{
    constructor(c){this.c=c;this.reset(true);}
    reset(first=false){
      this.x=rand(0,this.c.width);
      this.y=first?rand(-this.c.height,this.c.height):-10;
      this.r=rand(1,3);
      this.vy=rand(0.5,1.2);
      this.vx=rand(-0.2,0.2);
      this.alpha=rand(0.5,1);
    }
    update(){
      this.x+=this.vx;
      this.y+=this.vy;
      if(this.y>this.c.height+10) this.reset();
    }
    draw(ctx){
      ctx.fillStyle=`rgba(255,255,255,${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  const WinterSnow={
    init(opts={}){
      const canvas=document.createElement("canvas");
      document.body.appendChild(canvas);
      Object.assign(canvas.style,{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:"50"});
      const ctx=canvas.getContext("2d");
      const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};
      addEventListener("resize",resize);resize();

      const arr=Array.from({length:opts.count||60},()=>new Snow(canvas));

      function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        arr.forEach(s=>{s.update();s.draw(ctx);});
        requestAnimationFrame(loop);
      }
      loop();
    }
  };

  global.WinterSnow=WinterSnow;
})(window);