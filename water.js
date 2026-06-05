/* Shiny dark water that ripples where the cursor moves */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var canvas=document.getElementById('water');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  var SCALE=2;                 // simulation runs at half resolution for performance
  var W,H,sw,sh,cur,prev,src,out,off,offCtx,particles=[],occ=[],foam=[];
  var pcolors=['rgba(255,255,255,','rgba(150,111,255,','rgba(28,174,255,','rgba(217,70,194,'];
  function initParticles(){
    var n=Math.round(W*H/26000);
    particles=[];
    for(var i=0;i<n;i++){
      particles.push({x:Math.random()*W,y:Math.random()*H,
        vx:(Math.random()-0.5)*0.12,vy:(Math.random()-0.5)*0.12,
        r:Math.random()*1.6+0.6,a:Math.random()*0.4+0.35,
        col:pcolors[Math.floor(Math.random()*pcolors.length)]});
    }
  }

  function buildSource(){
    off=document.createElement('canvas');off.width=sw;off.height=sh;
    offCtx=off.getContext('2d');
    var g=offCtx.createLinearGradient(0,0,0,sh);
    g.addColorStop(0,'#002a52');
    g.addColorStop(0.5,'#001631');
    g.addColorStop(1,'#000c1d');
    offCtx.fillStyle=g;offCtx.fillRect(0,0,sw,sh);
    function sheen(x,y,r,col,a){
      var rg=offCtx.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');
      offCtx.globalAlpha=a;offCtx.fillStyle=rg;offCtx.fillRect(0,0,sw,sh);
    }
    sheen(sw*0.22,sh*0.18,sw*0.40,'#1CAEFF',0.18);
    sheen(sw*0.80,sh*0.30,sw*0.42,'#986FC9',0.16);
    sheen(sw*0.55,sh*0.78,sw*0.46,'#D946C2',0.12);
    sheen(sw*0.10,sh*0.85,sw*0.34,'#1CAEFF',0.10);
    offCtx.globalAlpha=1;
    src=offCtx.getImageData(0,0,sw,sh).data;
    out=ctx.createImageData(sw,sh);
  }

  function size(){
    W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    sw=Math.ceil(W/SCALE);sh=Math.ceil(H/SCALE);
    cur=new Float32Array(sw*sh);prev=new Float32Array(sw*sh);
    buildSource();initParticles();
  }

  function drawParticles(){
    for(var i=0;i<particles.length;i++){var p=particles[i];
      if(!reduce){p.x+=p.vx;p.y+=p.vy;}
      if(p.x<-4)p.x=W+4;else if(p.x>W+4)p.x=-4;
      if(p.y<-4)p.y=H+4;else if(p.y>H+4)p.y=-4;
      var sx=Math.round(p.x/SCALE),sy=Math.round(p.y/SCALE),ox=0,oy=0;
      if(sx>1&&sy>1&&sx<sw-1&&sy<sh-1){var i2=sy*sw+sx;
        ox=(prev[i2-1]-prev[i2+1])*0.6;oy=(prev[i2-sw]-prev[i2+sw])*0.6;}
      ctx.beginPath();
      ctx.fillStyle=p.col+p.a+')';
      ctx.shadowColor=p.col+'1)';ctx.shadowBlur=6;
      ctx.arc(p.x+ox,p.y+oy,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  function drawFoam(){
    ctx.lineCap='round';
    for(var i=0;i<foam.length;i++){var f=foam[i];
      f.life-=0.03;
      if(f.life<=0){foam.splice(i,1);i--;continue;}
      var hx=Math.cos(f.ang)*f.len*0.5, hy=Math.sin(f.ang)*f.len*0.5;
      ctx.globalAlpha=Math.max(0,f.life)*0.85;
      ctx.strokeStyle='#e6f4ff';ctx.lineWidth=f.w;
      ctx.shadowColor='rgba(255,255,255,.8)';ctx.shadowBlur=4;
      ctx.beginPath();ctx.moveTo(f.x-hx,f.y-hy);ctx.lineTo(f.x+hx,f.y+hy);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  }

  function drop(x,y,power,radius,width){
    x=Math.round(x/SCALE);y=Math.round(y/SCALE);
    radius=radius||10;width=width||1.6;
    var rr=Math.ceil(radius+width+1);
    if(x<rr+1||y<rr+1||x>=sw-rr-1||y>=sh-rr-1)return;
    for(var dy=-rr;dy<=rr;dy++){
      for(var dx=-rr;dx<=rr;dx++){
        var dist=Math.sqrt(dx*dx+dy*dy);
        var o=Math.abs(dist-radius);
        if(o>width)continue;
        var f=Math.cos(o/width*Math.PI*0.5);
        prev[(y+dy)*sw+(x+dx)]-=power*f;
      }
    }
  }

  // let other scripts create ripples in this water (screen-pixel coords)
  window.WaterFX={
    ripple:function(cx,cy,screenR,power,width){
      drop(cx,cy,power||9,Math.max(0.25,screenR/SCALE),width||2.4);
    },
    // depress the element's whole rectangular footprint: the wave forms at the
    // border and travels OUTWARD only (inward stays hidden under the element).
    rippleFill:function(L,T,W,H,power){
      var p=power||22;
      var l=Math.round(L/SCALE),t=Math.round(T/SCALE),
          rt=Math.round((L+W)/SCALE),bt=Math.round((T+H)/SCALE);
      if(l<2)l=2;if(t<2)t=2;if(rt>sw-3)rt=sw-3;if(bt>sh-3)bt=sh-3;
      if(rt<=l||bt<=t)return;
      for(var y=t;y<=bt;y++){var row=y*sw;for(var x=l;x<=rt;x++){prev[row+x]-=p;}}
    },
    // a bright, thick ripple stamped on the element's border; combined with the
    // occluder under it, the wave can only travel OUTWARD toward the page edges
    rippleBorder:function(L,T,W,H,power,thick){
      var p=power||40;thick=thick||3;
      var l=Math.round(L/SCALE),t=Math.round(T/SCALE),
          rt=Math.round((L+W)/SCALE),bt=Math.round((T+H)/SCALE);
      if(l<2)l=2;if(t<2)t=2;if(rt>sw-3)rt=sw-3;if(bt>sh-3)bt=sh-3;
      if(rt<=l||bt<=t)return;
      function set(x,y,w){if(x>0&&y>0&&x<sw-1&&y<sh-1)prev[y*sw+x]-=p*w;}
      for(var x=l;x<=rt;x++){for(var d=-thick;d<=thick;d++){var w=Math.cos(d/thick*1.2);set(x,t+d,w);set(x,bt+d,w);}}
      for(var y=t;y<=bt;y++){for(var d2=-thick;d2<=thick;d2++){var w2=Math.cos(d2/thick*1.2);set(l+d2,y,w2);set(rt+d2,y,w2);}}
    },
    // a foam streak (short white line) lying along a wave crest, at angle ang
    foamStreak:function(x,y,ang,len){
      foam.push({x:x,y:y,ang:ang,len:len,w:1.4+Math.random()*1.2,life:0.7+Math.random()*0.45});
      if(foam.length>500)foam.shift();
    },
    // mark element footprints as solid so waves don't pass under them (screen-px rects)
    setOccluders:function(list){
      var a=[];
      for(var i=0;i<list.length;i++){var o=list[i];
        var l=Math.round(o.l/SCALE),t=Math.round(o.t/SCALE),
            r=Math.round(o.r/SCALE),b=Math.round(o.b/SCALE);
        if(l<1)l=1;if(t<1)t=1;if(r>sw-2)r=sw-2;if(b>sh-2)b=sh-2;
        if(r>l&&b>t)a.push({l:l,t:t,r:r,b:b});
      }
      occ=a;
    },
    // disturb a horizontal line just outside the trailing edge — called each frame as the
    // element moves, the trail of these line-disturbances fans out into a boat-like wake
    wakeLine:function(L,R,Y,power){
      var y=Math.round(Y/SCALE);
      if(y<1||y>sh-2)return;
      var x0=Math.round(L/SCALE),x1=Math.round(R/SCALE);
      if(x0<1)x0=1;if(x1>sw-2)x1=sw-2;
      var row=y*sw;
      for(var x=x0;x<=x1;x++){prev[row+x]-=power;}
    },
    // trace a light disturbance along the element's border — call every frame while it
    // moves to leave a wake that follows the content as it scrolls (like the cursor's)
    wake:function(L,T,W,H,power){
      if(power<=0)return;
      var l=Math.round(L/SCALE),t=Math.round(T/SCALE),
          rt=Math.round((L+W)/SCALE),bt=Math.round((T+H)/SCALE);
      if(l<1)l=1;if(t<1)t=1;if(rt>sw-2)rt=sw-2;if(bt>sh-2)bt=sh-2;
      if(rt<=l||bt<=t)return;
      var st=3;
      for(var x=l;x<=rt;x+=st){prev[t*sw+x]-=power;prev[bt*sw+x]-=power;}
      for(var y=t;y<=bt;y+=st){prev[y*sw+l]-=power;prev[y*sw+rt]-=power;}
    }
  };

  var lastx=-1,lasty=-1,lastT=0,held=0;
  window.addEventListener('mousemove',function(e){
    var now=performance.now(),gap=now-lastT;lastT=now;
    var dx=e.clientX-lastx,dy=e.clientY-lasty;
    var speed=Math.min(60,Math.hypot(dx,dy));
    if(gap>140){held=0;}else{held=Math.min(held+1,18);}
    var t=held/18;
    var width=0.9+t*1.6;
    var power=(20+speed*0.85)*(1-0.6*t);
    drop(e.clientX,e.clientY,power,11,width);
    lastx=e.clientX;lasty=e.clientY;
  },{passive:true});

  // touch ripples for mobile (no cursor): a crisp ripple on tap, a trailing one on drag
  window.addEventListener('touchstart',function(e){
    var tch=e.touches[0];if(!tch)return;
    lastx=tch.clientX;lasty=tch.clientY;lastT=performance.now();held=0;
    drop(tch.clientX,tch.clientY,26,14,1.4);
  },{passive:true});
  window.addEventListener('touchmove',function(e){
    var tch=e.touches[0];if(!tch)return;
    var now=performance.now(),gap=now-lastT;lastT=now;
    var dx=tch.clientX-lastx,dy=tch.clientY-lasty;
    var speed=Math.min(60,Math.hypot(dx,dy));
    if(gap>140){held=0;}else{held=Math.min(held+1,18);}
    var t=held/18, width=1.2+t*3.2, power=(20+speed*0.85)*(1-0.6*t);
    drop(tch.clientX,tch.clientY,power,14,width);
    lastx=tch.clientX;lasty=tch.clientY;
  },{passive:true});

  var damping=0.972;
  function step(){
    for(var y=1;y<sh-1;y++){
      var row=y*sw;
      for(var x=1;x<sw-1;x++){
        var i=row+x;
        var v=(prev[i-1]+prev[i+1]+prev[i-sw]+prev[i+sw])*0.5-cur[i];
        cur[i]=v*damping;
      }
    }
    var tmp=prev;prev=cur;cur=tmp;
    // hold the water still under each surfaced element so waves can't pass through it
    // (the element behaves like a solid object floating on the surface)
    for(var k=0;k<occ.length;k++){var o=occ[k];
      for(var yy=o.t;yy<=o.b;yy++){var rr=yy*sw;
        for(var xx=o.l;xx<=o.r;xx++){cur[rr+xx]=0;prev[rr+xx]=0;}
      }
    }
  }

  function render(){
    var d=out.data,s=src,wt=reduce?0:frame*0.007;
    for(var y=1;y<sh-1;y++){
      var row=y*sw;
      for(var x=1;x<sw-1;x++){
        var i=row+x;
        var swell=Math.sin(x*0.011+y*0.008+wt)*3.4+Math.sin(x*0.006-y*0.013+wt*0.7)*2.6;
        var rx=(prev[i-1]-prev[i+1]),ry=(prev[i-sw]-prev[i+sw]);
        var xo=rx+swell,yo=ry+swell*0.7;
        var sx=x+(xo|0),sy=y+(yo|0);
        if(sx<0)sx=0;else if(sx>=sw)sx=sw-1;
        if(sy<0)sy=0;else if(sy>=sh)sy=sh-1;
        var si=(sy*sw+sx)*4,di=i*4;
        var spec=Math.abs(rx+ry)*1.4;
        var spec2=spec*spec*0.012;
        var swh=Math.abs(swell)*2.4;
        var hi=spec+spec2+swh;
        d[di]  =Math.min(255,s[si]  +hi*0.55);
        d[di+1]=Math.min(255,s[si+1]+hi*0.32);
        d[di+2]=Math.min(255,s[si+2]+hi*1.00);
        d[di+3]=255;
      }
    }
    for(var ex=0;ex<sw;ex++){
      var top=(sw+ex)*4,t0=ex*4,bot=((sh-2)*sw+ex)*4,b0=((sh-1)*sw+ex)*4;
      d[t0]=d[top];d[t0+1]=d[top+1];d[t0+2]=d[top+2];d[t0+3]=255;
      d[b0]=d[bot];d[b0+1]=d[bot+1];d[b0+2]=d[bot+2];d[b0+3]=255;
    }
    for(var ey=0;ey<sh;ey++){
      var lf=(ey*sw+1)*4,l0=(ey*sw)*4,rt=(ey*sw+sw-2)*4,r0=(ey*sw+sw-1)*4;
      d[l0]=d[lf];d[l0+1]=d[lf+1];d[l0+2]=d[lf+2];d[l0+3]=255;
      d[r0]=d[rt];d[r0+1]=d[rt+1];d[r0+2]=d[rt+2];d[r0+3]=255;
    }
    offCtx.putImageData(out,0,0);
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(off,0,0,sw,sh,0,0,W,H);
  }

  var frame=0;
  function loop(){
    if(!reduce && frame%70===0){drop(Math.random()*W,Math.random()*H,12,16,1.6);}
    step();render();drawParticles();frame++;
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize',size);
  size();
  if(reduce){render();drawParticles();}else{requestAnimationFrame(loop);}
})();

/* Opaque nav background once the page is scrolled */
(function(){
  var h=document.querySelector('header');
  if(!h)return;
  function onScroll(){h.classList.toggle('scrolled',window.scrollY>40);}
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();

/* Content rises from the depths as you scroll it toward the surface */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var sel=['.sec-head','.card','.work-item','.addon','.step',
           '.quote','.tcard','.cta-band','.about-grid>div','.about-side',
           '.contact-info','form.contact'];
  var els=[].slice.call(document.querySelectorAll(sel.join(',')));
  if(!els.length||reduce||!('requestAnimationFrame' in window))return;
  function isSolid(e){
    var cs=getComputedStyle(e);
    if(cs.backgroundImage&&cs.backgroundImage!=='none')return true;
    var c=cs.backgroundColor;
    if(!c||c==='transparent')return false;
    var m=c.match(/rgba?\(([^)]+)\)/);
    if(!m)return true;
    var p=m[1].split(',');
    return p.length<4||parseFloat(p[3])>0.1;   // opaque background
  }
  els.forEach(function(e){
    e.style.willChange='transform,opacity,filter';e.__doff=0;
    e.__solid=isSolid(e);   // only solid panels disturb the water
  });

  // stagger items within a grid so they surface one after another
  ['.cards','.work-grid','.tgrid','.steps','.addons'].forEach(function(gs){
    [].forEach.call(document.querySelectorAll(gs),function(grid){
      [].forEach.call(grid.children,function(ch,i){
        if(els.indexOf(ch)>-1)ch.__doff=i*60;   // later items need a bit more scroll to surface
      });
    });
  });

  // Kelvin-style planing wake: ONE wide V whose two arms start at the trailing corners
  // and diverge at 19.5 deg. We stamp fading points along each arm (re-stamped every frame
  // at the object's current position, so it trails the plate as it planes).
  var TAN = Math.tan(30*Math.PI/180);   // divergent half-angle -> ~60 deg V
  function planeWake(L, R, leadY, trailY, dir, spd){
    if(!window.WaterFX)return;
    var pw=Math.min(spd,40);
    var len=140+pw*7, N=13, gap=2;         // longer arm/tail; grows with speed
    // V arms swept from a set of corners (origin Y), brightness scaled by sc
    function arms(oy,sc){
      for(var k=1;k<=N;k++){
        var f=k/N, back=gap+len*Math.pow(f,1.7), lat=back*TAN, y=oy+dir*back;  // points cluster near the source
        var rad=0.3+f*1.4;                   // tighter at the source, larger as it diffuses
        var amp=(34+pw*1.4)*sc*(1-0.82*f)*(1-0.82*f); // bright source, fades along a longer tail
        var wd=0.6+(1-f)*1.9;                // thick right at the object, tapering out
        window.WaterFX.ripple(L-lat, y, rad, amp, wd);
        window.WaterFX.ripple(R+lat, y, rad, amp, wd);
      }
    }
    // bow line and bow arms share the same front position so they connect at the corners
    var bowY=leadY-dir*16;
    window.WaterFX.wakeLine(L, R, bowY, 32+pw*1.6);   // transverse crest across the front
    arms(bowY, 1.0);                                  // arms sweep back from the line's two ends
    // frictional/churning zone: the dragged boundary layer detaches at the back and shears
    // against still water. Lots of small chaotic ripples right behind the plate -> where they
    // collide the sim's specular naturally brightens, reading as a boiling, turbulent belt.
    var cn=Math.min(46, 18+Math.round(Math.min(spd,30)*2.4));
    for(var c=0;c<cn;c++){
      var cxp=L+Math.random()*(R-L);                 // anywhere across the width
      var d=Math.random()*Math.random();             // skewed toward 0 -> most points hug the edge
      var cyp=trailY+dir*(d*14);                      // start right at the back edge
      var near=1-d;                                   // closeness to the object
      var rad=0.2+d*1.1;                              // very tight at the edge, larger farther back
      var amp=(22+pw*0.7)*near*near;                   // softer churn, steep falloff
      window.WaterFX.ripple(cxp,cyp,rad,amp,0.5+near*1.1);  // tight right at the object
    }
  }

  var lastScroll=window.scrollY, mobileCleared=false;
  function update(){
    // On phones (smaller than tablet) we drop only the visual "surfacing" transform — objects
    // just glide into view normally — but KEEP the wake ripples in the water.
    var mobile=window.innerWidth<768;
    if(mobile&&!mobileCleared){
      els.forEach(function(e){e.style.transform='';e.style.opacity='';e.style.filter='';});
      mobileCleared=true;
    }else if(!mobile){mobileCleared=false;}
    var vh=window.innerHeight;
    var base=vh*0.98, end=vh*0.5;          // all content fully clear once its top reaches 50%
    var span=base-end;
    var sy=window.scrollY, dy=sy-lastScroll; lastScroll=sy;
    var spd=Math.min(Math.abs(dy),34);     // wake strength scales with scroll speed (like the cursor)
    var occList=[];
    for(var i=0;i<els.length;i++){
      var r=els[i].getBoundingClientRect();
      var off=Math.min(els[i].__doff||0,span*0.5);  // stagger the START; everything still finishes by 50%
      var start=base-off;
      var t=(start-r.top)/(start-end);
      if(t<0)t=0;else if(t>1)t=1;
      var e=t*t*(3-2*t);              // smoothstep easing
      if(mobile){
        e=1;                         // treat as fully surfaced: no rise/blur, but wake still fires
      }else{
        els[i].style.transform='translateY('+((1-e)*80).toFixed(1)+'px) scale('+(0.965+0.035*e).toFixed(3)+')';
        els[i].style.opacity=(0.08+0.92*e).toFixed(3);
        els[i].style.filter='blur('+((1-e)*5).toFixed(2)+'px)';
      }
      if(window.WaterFX&&els[i].__solid){
        var onScreen=r.bottom>0&&r.top<vh;
        // treat surfaced, on-screen elements as solid plates planing on the surface
        if(e>0.9&&onScreen)occList.push({l:r.left+3,t:r.top+3,r:r.right-3,b:r.bottom-3});  // inset so wake can hug the edge
        // shed a Kelvin-style wake from the trailing edge while the plate moves
        if(spd>0.6&&e>0.94&&onScreen){
          var dir=dy>0?1:-1;                       // +1 = rising (wake below), -1 = sinking (wake above)
          var trailY=(dir>0?r.bottom:r.top)+dir*1;
          var leadY=(dir>0?r.top:r.bottom)-dir*1;  // front edge
          planeWake(r.left, r.right, leadY, trailY, dir, spd);
        }
      }
    }
    if(window.WaterFX&&window.WaterFX.setOccluders)window.WaterFX.setOccluders(occList);
  }
  var ticking=false;
  function onScroll(){
    if(!ticking){ticking=true;requestAnimationFrame(function(){update();ticking=false;});}
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  window.addEventListener('load',function(){lastScroll=window.scrollY;onScroll();});
  lastScroll=window.scrollY;update();
})();

/* Mobile hamburger menu */
(function(){
  var btn=document.querySelector('.nav-toggle'),menu=document.querySelector('.nav ul');
  if(!btn||!menu)return;
  function setOpen(open){
    btn.classList.toggle('open',open);
    menu.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
  btn.addEventListener('click',function(){setOpen(!menu.classList.contains('open'));});
  menu.addEventListener('click',function(e){if(e.target.tagName==='A')setOpen(false);});
})();
