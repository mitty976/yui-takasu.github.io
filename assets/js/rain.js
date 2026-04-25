(function(global){
  const rand=(a,b)=>Math.random()*(b-a)+a;

  class Rain{
    constructor(c){
      this.c=c; this.reset(true);
    }
    reset(first=false){
      this.x=rand(0,this.c.width);
      this.y=first?rand(0,this.c.height):-20;
      this.r=rand(1,3);
      this.vy=rand(1,2);
      this.alpha=rand(0.1,0.3);
    }
    update(){
      this.y+=this.vy;
      if(this.y>this.c.height+20) this.reset();
    }
    draw(ctx){
      ctx.fillStyle=`rgba(180,200,255,${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  const SummerRain={
    init(opts={}){
      const canvas=document.createElement("canvas");
      document.body.appendChild(canvas);
      Object.assign(canvas.style,{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:"50"});
      const ctx=canvas.getContext("2d");
      const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};
      addEventListener("resize",resize);resize();

      const arr=Array.from({length:opts.count||80},()=>new Rain(canvas));

      function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        arr.forEach(r=>{r.update();r.draw(ctx);});
        requestAnimationFrame(loop);
      }
      loop();
    }
  };

  global.SummerRain=SummerRain;
})(window);