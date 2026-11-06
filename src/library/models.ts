import { extendedById } from './extendedCatalog';
import { buildExtendedModel } from './extendedModels';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { AssetId } from './catalog';
import {
  createOpticalGlassMaterial,
  createChromeMaterial,
  createKnurledMetalMaterial,
  createEnamelMaterial,
  createEmissiveSourceMaterial,
  createPBRWoodMaterial,
} from './proceduralMaterials';

export interface ModelState { active?: boolean; value?: number; text?: string; color?: string; }
const C = { wood: '#aa7850', dark: '#303e40', metal: '#a8b1b0', cream: '#e5dec9', teal: '#548e89', gold: '#bf9957', green: '#729373', red: '#b65846', blue: '#658ba4', glass: '#c0e0dc' };
type V = [number, number, number];

/** Meter-scale, Y-up objects, with their origin on the floor. No external assets. */
export function buildModel(id: AssetId, state: ModelState = {}): T.Group {
  const extended = extendedById.get(id);
  if (extended) return buildExtendedModel(extended, state.color);
  const root = new T.Group(); root.name = id;
  const materials = new Map<string, T.Material>();
  const accent = state.color || C.teal;
  const active = !!state.active;
  const value = Math.max(0, Math.min(100, Number(state.value) || 0));
  const material = (color: string, metal = 0, rough = .55, opacity = 1) => {
    const key = `${color}:${metal}:${rough}:${opacity}`;
    if (!materials.has(key)) {
      let m: T.Material;
      if (color === C.glass || (opacity < 0.6 && opacity > 0)) {
        m = createOpticalGlassMaterial(color === C.glass ? '#eaf6fa' : color);
      } else if (color === C.wood) {
        m = createPBRWoodMaterial(color);
      } else if (color === C.metal) {
        m = createChromeMaterial(true);
      } else if (color === C.gold) {
        const goldMat = createChromeMaterial(false);
        goldMat.color.set('#cba358');
        goldMat.roughness = 0.22;
        goldMat.metalness = 0.86;
        m = goldMat;
      } else {
        m = new T.MeshPhysicalMaterial({
          color,
          metalness: metal,
          roughness: metal ? 0.25 : rough,
          clearcoat: metal ? 0.1 : 0.35,
          clearcoatRoughness: 0.18,
          transparent: opacity < 1,
          opacity,
          depthWrite: opacity === 1,
        });
      }
      materials.set(key, m);
    }
    return materials.get(key)!;
  };
  const mesh = (geometry: T.BufferGeometry, color: string, pos: V, rot: V = [0,0,0], metal = 0, opacity = 1) => {
    const m = new T.Mesh(geometry, material(color, metal, metal ? .28 : .65, opacity));
    m.position.set(...pos); m.rotation.set(...rot); m.castShadow = opacity === 1; m.receiveShadow = true; root.add(m); return m;
  };
  const customMesh = (geometry: T.BufferGeometry, mat: T.Material, pos: V, rot: V = [0,0,0], castShadow = true) => {
    const m = new T.Mesh(geometry, mat);
    m.position.set(...pos); m.rotation.set(...rot); m.castShadow = castShadow; m.receiveShadow = true; root.add(m); return m;
  };
  const box = (size: V, pos: V, color = C.dark, r = .025, rot: V = [0,0,0]) => mesh(new RoundedBoxGeometry(...size, 2, Math.min(r, Math.min(...size)/3)), color, pos, rot, color === C.metal || color === C.gold ? .7 : 0);
  const cyl = (radius: number, h: number, pos: V, color = C.metal, rotOrTop: V | number = [0,0,0], topOrRot: number | V = radius) => {
    const rot: V = Array.isArray(rotOrTop) ? rotOrTop : (Array.isArray(topOrRot) ? topOrRot : [0,0,0]);
    const top: number = typeof rotOrTop === 'number' ? rotOrTop : (typeof topOrRot === 'number' ? topOrRot : radius);
    return mesh(new T.CylinderGeometry(top, radius, h, 32), color, pos, rot, color === C.metal || color === C.gold ? .7 : 0);
  };
  const ball = (r: number, pos: V, color = accent, scale: V = [1,1,1]) => { const m = mesh(new T.SphereGeometry(r, 24, 16), color, pos); m.scale.set(...scale); return m; };
  const torus = (r: number, tube: number, pos: V, color = C.metal, rot: V = [0,0,0], arc = Math.PI*2) => mesh(new T.TorusGeometry(r, tube, 12, 48, arc), color, pos, rot, .5);
  const rod = (a: V,b: V,r=.025,color=C.metal) => {
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av);
    const m=cyl(r,dir.length(),av.clone().add(bv).multiplyScalar(.5).toArray() as V,color);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;
  };
  const legs = (w:number,d:number,h:number,color=C.dark) => {
    for(const x of [-w/2,w/2]) for(const z of [-d/2,d/2]) {
      box([.065,h,.065],[x,h/2,z],color);
      cyl(.036,.02,[x,.01,z],C.dark);
    }
  };
  const base = (w=.7,d=.5) => box([w,.08,d],[0,.04,0],C.dark);
  const panel = (w=1.5,h=.9,y=1.45,color=C.cream) => {
    box([w+.08,h+.08,.1],[0,y,0],C.dark); box([w,h,.012],[0,y,.058],color,.002);
    // Readable editable text is a real texture in the browser; geometry-only fallback for CLI exports.
    if(typeof document !== 'undefined') {
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
      const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle=color===C.dark?'#e8efde':'#293e37';
      ctx.textBaseline='top';ctx.font='500 44px sans-serif';
      const lines=(state.text || id.toUpperCase()).split('\n').flatMap(line => {
        const words=line.split(' '); const out:string[]=[];let current='';
        for(const word of words){if(ctx.measureText(current+' '+word).width>920 && current){out.push(current);current=word;}else current+=(current?' ':'')+word;}out.push(current);return out;
      });
      lines.slice(0,7).forEach((line,i)=>ctx.fillText(line,48,40+i*65,928));
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
      const plane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.8}));plane.position.set(0,y,.066);root.add(plane);
    } else {
      for(let i=0;i<3;i++) box([w*(.65-i*.13),.025,.008],[-w*.07,y+h*.24-i*h*.2,.069],C.teal,.001);
    }
  };
  const stand = (w=1.5,h=.9,y=1.45) => { panel(w,h,y);for(const x of [-w*.35,w*.35]){rod([x,.08,0],[x,y,0]);box([.3,.06,.6],[x,.03,0]);}};
  const kiosk = (color=C.wood) => {base();box([.44,1,.32],[0,.55,0],color);panel(.64,.42,1.2);};
  const shelf = (w=1.5,h=1.8,d=.5,n=4) => {legs(w-.08,d-.08,h);for(let i=0;i<n;i++)box([w,.06,d],[0,.14+i*(h-.2)/(n-1),0],C.wood);};
  const book = (x=0,y=.08,z=0,color=accent) => {box([.55,.025,.4],[x,y-.04,z],color);box([.51,.065,.36],[x,y,z],C.cream,.005);box([.55,.02,.4],[x,y+.045,z],color);for(let i=0;i<4;i++)box([.5,.002,.001],[x,y-.025+i*.016,z+.181],C.wood,0);};
  const plant = (x=0,y=0,z=0,s=1) => {cyl(.22*s,.35*s,[x,y+.175*s,z],C.cream,[0,0,0],.28*s);cyl(.25*s,.02*s,[x,y+.35*s,z],'#504438');for(let i=0;i<7;i++){const a=i*2.4;const end:V=[x+Math.cos(a)*.25*s,y+(.65+(i%3)*.1)*s,z+Math.sin(a)*.22*s];rod([x,y+.35*s,z],end,.012*s,C.green);ball(.15*s,end,C.green,[.5,1.7,.65]);}};
  const mannequin = (pose=false) => {cyl(.28,.06,[0,.03,0],C.dark);rod([-.13,.15,0],[-.13,.85,0],.065,C.cream);rod([.13,.15,0],[.13,.85,0],.065,C.cream);box([.42,.5,.24],[0,1.12,0],C.cream,.09);ball(.14,[0,1.62,0],C.cream,[.85,1.2,.9]);cyl(.06,.1,[0,1.44,0],C.metal);for(const sign of [-1,1]){const end:V=[sign*(pose?.5:.3),pose?1.5:.85,0];ball(.085,[sign*.26,1.3,0],C.metal);rod([sign*.26,1.3,0],end,.055,C.cream);ball(.07,end,C.cream);}};
  const table = (w=1.8,h=.76,d=.8) => {legs(w-.2,d-.2,h-.05);box([w,.09,d],[0,h-.045,0],C.wood,.04);};

  switch(id) {
    case 'objectives': case 'whiteboard': case 'mobile-board': case 'captions': {
      const sw = id === 'captions' ? 1.9 : 1.6;
      const sh = id === 'captions' ? 0.55 : 0.95;
      stand(sw, sh, 1.35);
      for(const x of [-.56,.56])for(const z of [-.22,.22])ball(.055,[x,.055,z],C.dark);
      if (id === 'whiteboard' || id === 'mobile-board') {
        box([sw * 0.75, 0.02, 0.08], [0, 1.35 - sh / 2 - 0.01, 0.09], C.metal);
        box([0.14, 0.035, 0.05], [-sw * 0.22, 1.35 - sh / 2 + 0.02, 0.09], C.dark);
        const markerColors = [C.dark, C.teal, C.red];
        for (let i = 0; i < 3; i++) {
          cyl(0.009, 0.12, [sw * 0.05 + i * 0.035, 1.35 - sh / 2 + 0.015, 0.09], markerColors[i], 0.009, [0, 0, Math.PI / 2]);
        }
      }
      break;
    }
    case 'instructions': case 'help': case 'presentation': case 'lectern': kiosk();
      if(id==='help'){torus(.09,.015,[0,.8,.18],C.gold);box([.02,.08,.02],[0,.66,.18],C.gold);}
      if(id==='lectern'||id==='presentation'){rod([.22,1.28,0],[.25,1.55,.02],.015,C.dark);ball(.035,[.25,1.55,.02],C.dark);}break;
    case 'path': for(let i=0;i<4;i++){cyl(.23,.08,[i*.6-.9,.04,0],i<=Math.floor(value/25)?accent:C.cream);for(let j=0;j<=i;j++)box([.03,.015,.1],[i*.6-.9+(j-i/2)*.06,.087,0],C.gold);if(i<3)rod([i*.6-.65,.05,0],[i*.6-.55,.05,0],.015);}break;
    case 'label':base(.4,.25);rod([0,.08,0],[0,1.1,0]);panel(.8,.35,1.1);break;
    case 'arrow':box([.8,.14,.2],[-.2,.15,0],accent);mesh(new T.ConeGeometry(.24,.4,3),C.gold,[.4,.15,0],[0,0,-Math.PI/2]);break;
    case 'cutaway':base(.9,.9);mesh(new T.CylinderGeometry(.4,.4,1,32,1,true,0,Math.PI*1.45),accent,[0,.6,0]);cyl(.18,.95,[0,.6,0],C.gold);for(const y of [.2,.5,.8,1.1])torus(.27,.025,[0,y,0],C.cream,[Math.PI/2,0,0]);break;
    case 'pump': {
      base(1.5,.8);box([.9,.12,.6],[0,.14,0],C.metal);cyl(.36,.48,[0,.58,0],accent,[Math.PI/2,0,0]);
      const offset=active?.65:0; cyl(.29,.055,[0,.58,.29+offset],C.gold,[Math.PI/2,0,0]);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;box([.17,.045,.07],[Math.cos(a)*.15,.58+Math.sin(a)*.15,.34+offset],C.gold,.005,[0,0,a+.4]);}
      cyl(.37,.065,[0,.58,.4+offset*1.8],C.metal,[Math.PI/2,0,0]);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(.022,.08,[Math.cos(a)*.32,.58+Math.sin(a)*.32,.45+offset*1.8],C.dark,[Math.PI/2,0,0]);}
      cyl(.1,.55,[.45,.75,0],accent,[0,0,Math.PI/2]);cyl(.16,.055,[.73,.75,0],C.metal,[0,0,Math.PI/2]);break;
    }
    case 'instructor':case 'mannequin':mannequin(active);break;
    case 'hands':base(.85,.5);for(const side of [-1,1]){box([.19,.08,.23],[side*.22,.18,0],C.cream,.04);for(let f=0;f<4;f++){const x=side*.22+(f-1.5)*.043;rod([x,.2,-.1],[x,active?.4:.23,-.28],.018,C.cream);ball(.02,[x,.2,-.1],C.gold);}rod([side*.3,.2,0],[side*.38,.22,-.1],.026,C.cream);}break;
    case 'assembly':base(1.5,.8);for(let i=0;i<3;i++){const x=(i-1)*.45;torus(.17,.02,[x,.1,0],C.metal,[Math.PI/2,0,0]);const y=active?.23:.55;if(i===0)box([.25,.25,.25],[x,y,0],accent);else if(i===1)cyl(.13,.25,[x,y,0],C.gold);else mesh(new T.ConeGeometry(.16,.25,3),C.red,[x,y,0]);}break;
    case 'socket':case 'pressure-pad':base(id==='socket'?.8:1.2,id==='socket'?.8:1.2);box([.65,.025,.65],[0,.095,0],accent);torus(.24,.018,[0,.12,0],C.gold,[Math.PI/2,0,0]);break;
    case 'ruler':box([1,.025,.14],[0,.015,0],C.gold,.005);for(let i=0;i<=20;i++)box([.006,.002,i%2===0?.07:.04],[-.48+i*.048,.029,-.025],C.dark,0);break;
    case 'balance':base(.6,.4);rod([0,.08,0],[0,.95,0],.045);{const delta=(value-50)/300;rod([-.5,.8-delta,0],[.5,.8+delta,0],.028,C.gold);for(const sign of [-1,1]){const y=.8+sign*delta;rod([sign*.5,y,0],[sign*.5,y-.4,0],.013);cyl(.2,.04,[sign*.5,y-.42,0],C.metal);if(sign===1)cyl(.065,.12,[.5,y-.34,0],C.gold);}}break;
    case 'timer':box([.8,.5,.18],[0,.28,0],C.dark);panel(.68,.3,.3,C.dark);for(const x of [-.23,.23])cyl(.05,.04,[x,.56,0],x<0?accent:C.red);break;
    case 'thermometer':base(.35,.25);box([.2,1.25,.09],[0,.7,0],C.cream);cyl(.03,.2+value*.008,[0,.2+(.2+value*.008)/2,.065],C.red);ball(.07,[0,.2,.07],C.red);for(let i=0;i<12;i++)box([.045,.008,.012],[.075,.25+i*.085,.06],C.dark,0);break;
    case 'workbench':case 'technical-bench': {
      table(2,.9,.8);
      box([.6,.45,.62],[.55,.55,0],accent);
      for(let i=0;i<3;i++){
        box([.54,.01,.01],[.55,.4+i*.13,.32],C.dark);
        box([.14,.02,.04],[.55,.46+i*.13,.33],C.metal);
      }
      if(id==='workbench'){
        box([2,.8,.07],[0,1.4,-.36],C.wood);
        for(let x=0;x<12;x++) for(let y=0;y<4;y++) ball(.012,[-.88+x*.16,1.12+y*.16,-.32],C.dark);
        // Hanging workshop tools
        // Hammer
        rod([-.5,1.25,-.32],[-.5,1.5,-.32],.016,C.wood);
        box([.14,.05,.05],[-.5,1.52,-.32],C.metal);
        // Wrench
        rod([-.1,1.28,-.32],[-.1,1.52,-.32],.014,C.metal);
        torus(.03,.008,[-.1,1.54,-.32],C.metal);
        // Screwdriver
        rod([.3,1.28,-.32],[.3,1.44,-.32],.01,C.metal);
        cyl(.02,.12,[.3,1.5,-.32],C.red);
        // Heavy metal bench vise on the left
        box([.16,.14,.22],[-.78,.97,.34],C.metal);
        rod([-.78,1.01,.24],[-.78,1.01,.46],.018,C.metal);
        rod([-.86,1.01,.46],[-.7,1.01,.46],.012,C.metal);
      } else {
        box([.42,.26,.26],[-.55,1.03,0],C.dark);
        box([.34,.18,.01],[-.55,1.03,.132],C.teal);
        for(let i=0;i<3;i++) cyl(.018,.016,[-.66+i*.07,.94,.14],C.gold,[Math.PI/2,0,0]);
      }
      break;
    }
    case 'tools':base(.85,.6);rod([-.25,.1,-.2],[-.25,.1,.2],.025);cyl(.05,.18,[-.25,.1,.19],accent,[Math.PI/2,0,0]);rod([0,.1,-.2],[0,.1,.2],.03,C.gold);torus(.065,.025,[0,.1,-.21],C.gold,[Math.PI/2,0,0]);for(const side of [-1,1])rod([.23,.12,-.07],[.23+side*.07,.12,.2],.024,C.red);break;
    case 'cards':for(let i=0;i<3;i++){box([.38,.56,.035],[(i-1)*.46,.31,0],[accent,C.gold,C.red][i]);for(let j=0;j<=i;j++)box([.035,.18,.01],[(i-1)*.46+(j-i/2)*.075,.32,.03],C.cream);}break;
    case 'sorting':for(let i=0;i<3;i++){const x=(i-1)*.58;box([.5,.035,.5],[x,.025,0],C.dark);for(const sign of [-1,1]){box([.5,.45,.035],[x,.25,sign*.24],[accent,C.gold,C.red][i]);box([.035,.45,.5],[x+sign*.24,.25,0],[accent,C.gold,C.red][i]);}}break;
    case 'quiz':case 'control-panel':base(1,.6);box([.85,.8,.4],[0,.45,0],C.dark);panel(.8,.35,.92);for(let i=0;i<3;i++)cyl(.07,.045,[(i-1)*.23,.72,.26],[accent,C.gold,C.red][i],[Math.PI/2,0,0]);break;
    case 'success':base(.4,.4);rod([0,.08,0],[0,1.3,0],.045);for(let i=0;i<3;i++)cyl(.12,.17,[0,.85+i*.2,0],active?C.green:[C.red,C.gold,C.cream][i]);break;
    case 'highlight':for(const x of [-.65,.65])box([.04,1.2,.06],[x,.65,0],active?C.green:C.gold);for(const y of [.05,1.25])box([1.34,.04,.06],[0,y,0],active?C.green:C.gold);base(1.4,.3);break;
    case 'notes':stand(1.4,1,1.2);for(let i=0;i<6;i++)box([.32,.3,.008],[(i%3-1)*.43,1.4-Math.floor(i/3)*.4,.073],[C.gold,C.cream,accent][i%3],.002);break;
    case 'token':cyl(.14,.08,[0,.04,0],C.gold);ball(.1,[0,.25,0],active?C.green:accent);rod([0,.08,0],[0,.2,0],.035,C.gold);torus(.12,.015,[0,.25,0]);break;
    case 'display':for(let i=0;i<3;i++)box([.55,.4+i*.35,.65],[(i-1)*.6,(.4+i*.35)/2,0],i===1?accent:C.wood);break;
    case 'audio':box([.55,.75,.3],[0,.39,0],C.dark,.06);for(const y of [.26,.55]){cyl(y<.4?.15:.09,.03,[0,y,.17],C.metal,[Math.PI/2,0,0]);ball(y<.4?.1:.055,[0,y,.19],C.dark,[1,1,.3]);}break;
    case 'meeting-table':table(2.8,.76,1.2);box([.5,.012,.13],[0,.767,0],C.dark);break;
    case 'office-chair': {
      // 1. Five-star castor base with chrome finish and dual castors
      const hubY = .12;
      cyl(.038, .08, [0, hubY, 0], C.metal);
      for(let i=0; i<5; i++){
        const a = i * Math.PI * 2 / 5;
        const legEnd: V = [Math.cos(a) * .32, .06, Math.sin(a) * .32];
        rod([0, hubY, 0], legEnd, .018, C.metal);
        // Castor wheel assembly
        cyl(.022, .024, [legEnd[0], .025, legEnd[2]], C.dark, .022, [0, a, Math.PI/2]);
        cyl(.012, .02, [legEnd[0], .045, legEnd[2]], C.metal);
      }
      // 2. Heavy-duty telescopic gas lift cylinder
      cyl(.028, .22, [0, .23, 0], C.dark);
      cyl(.022, .18, [0, .36, 0], C.metal);
      box([.16, .035, .16], [0, .44, 0], C.dark);
      rod([.08, .44, .04], [.18, .44, .04], .008, C.metal);

      // 3. Ergonomic contoured seat with waterfall edge
      box([.54, .085, .50], [0, .49, 0], accent, .03);
      cyl(.03, .52, [0, .465, .24], accent, .03, [0, 0, Math.PI/2]);

      // 4. Ergonomic lumbar-supported backrest
      box([.48, .54, .045], [0, .80, -.22], accent, .03, [-.08, 0, 0]);
      box([.38, .14, .035], [0, .68, -.20], C.dark, .02);
      rod([-.12, .48, -.15], [-.12, .65, -.22], .018, C.dark);
      rod([.12, .48, -.15], [.12, .65, -.22], .018, C.dark);

      // 5. Adjustable 3D T-armrests with padded caps
      for(const sx of [-.29, .29]){
        rod([sx, .48, 0], [sx, .66, 0], .016, C.metal);
        box([.085, .028, .28], [sx, .68, .02], C.dark, .01);
      }
      break;
    }
    case 'wall-screen':panel(1.9,1.05,.65,C.dark);box([.25,.65,.15],[0,.4,-.12]);break;
    case 'pedestal':box([1,.8,1],[0,.4,0],C.dark);box([1.02,.025,1.02],[0,.77,0],C.gold);break;
    case 'shelf':shelf();break;
    case 'glass-case':shelf(.95,1.8,.65);for(const x of [-.45,.45])mesh(new T.BoxGeometry(.015,1.6,.6),C.glass,[x,.95,0],[0,0,0],0,.22);mesh(new T.BoxGeometry(.9,1.6,.015),C.glass,[0,.95,.3],[0,0,0],0,.17);break;
    case 'counter':box([2,1,.75],[0,.5,0],C.wood);box([2.05,.06,.8],[0,1.03,0],C.dark);box([.35,.25,.22],[.55,1.2,0],accent);break;
    case 'fountain':cyl(.6,.18,[0,.09,0],C.cream);cyl(.52,.012,[0,.185,0],C.blue);cyl(.13,.85,[0,.55,0],C.cream);for(const y of [.6,1.1]){cyl(y>.8?.25:.4,.1,[0,y,0],C.cream);cyl(y>.8?.22:.37,.015,[0,y+.058,0],C.blue);}for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([Math.cos(a)*.25,1.12,Math.sin(a)*.25],[Math.cos(a)*.35,.65,Math.sin(a)*.35],.012,C.blue);}break;
    case 'sand-garden':base(1.5,1);box([1.4,.06,.9],[0,.09,0],C.cream);for(let i=0;i<12;i++)box([1.3,.003,.007],[0,.124,-.38+i*.065],C.gold,0);ball(.16,[.3,.19,0],C.dark,[1,.5,.8]);rod([-.5,.15,-.3],[-.2,.15,.3],.018,C.wood);box([.24,.035,.06],[-.2,.15,.3],C.wood);break;
    case 'bonsai':cyl(.28,.22,[0,.11,0],C.dark,[0,0,0],.34);rod([0,.2,0],[.07,.65,0],.055,C.wood);for(let i=0;i<5;i++){const a=i*2.4;rod([0,.4,0],[Math.cos(a)*.25,.55+i*.065,Math.sin(a)*.2],.025,C.wood);ball(.2,[Math.cos(a)*.25,.55+i*.065,Math.sin(a)*.2],C.green,[1,.4,1]);}break;
    case 'lantern':base(.5,.5);cyl(.1,.5,[0,.3,0],C.cream);box([.42,.35,.42],[0,.73,0],C.gold);for(const x of [-.21,.21])for(const z of [-.21,.21])box([.045,.45,.045],[x,.73,z],C.dark);mesh(new T.ConeGeometry(.43,.24,4),C.dark,[0,1.02,0],[0,Math.PI/4,0]);break;
    case 'cushion':ball(.35,[0,.13,0],accent,[1,.38,1]);torus(.32,.008,[0,.13,0],C.cream,[Math.PI/2,0,0]);break;
    case 'breathing':base(.7,.7);ball(.3+value*.001,[0,.55,0],accent);torus(.4,.015,[0,.55,0],C.gold);break;
    case 'pebble':ball(.25,[0,.1,0],C.cream,[1,.4,.7]);break;
    case 'emotions':base(.5,.4);rod([0,.05,0],[0,1,0]);for(let i=0;i<6;i++)mesh(new T.CylinderGeometry(.48,.48,.055,12,1,false,i*Math.PI/3,Math.PI/3-.04),[C.gold,C.red,C.blue,C.green,C.teal,'#a27b9d'][i],[0,1,0],[Math.PI/2,0,value*.01]);ball(.05,[0,1,.06],C.gold);break;
    case 'journal':case 'book':book();box([.012,.002,.34],[0,.133,0],C.gold,0);break;
    case 'cocoon':cyl(.25,.18,[0,.09,0],C.metal);ball(.5,[0,.64,0],accent,[1,1.25,.9]);ball(.39,[0,.8,.29],C.cream,[1,1.15,.35]);box([.65,.17,.6],[0,.4,.17],C.cream,.08);break;
    case 'door':for(const x of [-.63,.63])box([.13,2.2,.22],[x,1.1,0]);box([1.4,.14,.22],[0,2.23,0]);{const door=new T.Group();const start=root.children.length;box([1.1,2.05,.1],[0,1.05,0],C.wood);box([.1,.025,.07],[.4,1,.09],C.gold);const parts=root.children.slice(start);for(const part of parts){part.position.x+=.55;door.add(part);}door.position.x=-.55;door.rotation.y=active?-Math.PI/2:0;root.add(door);}break;
    case 'lever':base(.5,.5);ball(.1,[0,.15,0],C.metal);rod([0,.15,0],[active?.28:-.2,.65,0],.04);ball(.075,[active?.28:-.2,.65,0],C.red);break;
    case 'chest': {
      box([1, .45, .65], [0, .25, 0], C.wood);
      const lidY = active ? .82 : .54;
      const lidZ = active ? -.18 : 0;
      const lidRotX = active ? -.65 : 0;
      box([1, .16, .65], [0, lidY, lidZ], C.wood, .08, [lidRotX, 0, 0]);
      for (const x of [-.44, -.15, .15, .44]) {
        box([.05, .46, .67], [x, .25, 0], C.dark);
        box([.05, .17, .67], [x, lidY, lidZ], C.dark, .08, [lidRotX, 0, 0]);
        for (const y of [.1, .25, .4]) {
          ball(.009, [x, y, .34], C.metal);
          ball(.009, [x, y, -.34], C.metal);
        }
      }
      for (const sx of [-1, 1]) {
        torus(.06, .012, [sx * .52, .26, 0], C.dark, [0, Math.PI / 2, 0]);
        box([.02, .06, .08], [sx * .51, .26, 0], C.dark);
      }
      box([.1, .14, .025], [0, .44, .345], C.gold);
      torus(.035, .008, [0, .38, .36], C.gold);
      box([.06, .08, .02], [0, .36, .36], C.gold);
      break;
    }
    case 'key-lock':box([.28,.28,.13],[.15,.15,0],C.gold);torus(.095,.025,[.15,.34,0],C.metal,[0,0,0],Math.PI);torus(.08,.02,[-.2,.1,0],C.gold,[Math.PI/2,0,0]);rod([-.2,.1,0],[-.2,.1,.28],.018,C.gold);box([.07,.035,.04],[-.18,.1,.25],C.gold);break;
    case 'battery':box([.8,.45,.5],[0,.25,0],C.gold);box([.82,.06,.52],[0,.49,0]);for(const x of [-.25,.25])cyl(.05,.07,[x,.55,0],x<0?C.red:C.metal);box([.3,.13,.04],[0,.56,0]);break;
    case 'diagnostic':base(1.2,.8);box([1,.9,.6],[0,.5,0]);panel(.88,.5,1.16,C.dark);for(let i=0;i<5;i++)ball(.03,[-.3+i*.15,.72,.32],i%2?C.gold:accent);break;
    case 'valve':cyl(.15,.9,[0,.32,0],accent,[0,0,Math.PI/2]);for(const x of [-.42,.42])cyl(.24,.08,[x,.32,0],C.metal,[0,0,Math.PI/2]);rod([0,.32,0],[0,.9,0],.06,C.gold);torus(.25,.035,[0,.95,0],C.red,[Math.PI/2,0,active?.8:0]);for(let i=0;i<4;i++){const a=i*Math.PI/2+(active?.8:0);rod([0,.95,0],[Math.cos(a)*.25,.95,Math.sin(a)*.25],.018,C.red);}break;
    case 'extinguisher':cyl(.13,.6,[0,.33,0],C.red);ball(.13,[0,.62,0],C.red,[1,.6,1]);box([.22,.035,.07],[0,.77,0]);rod([.05,.7,0],[.19,.65,0],.022,C.dark);rod([.19,.65,0],[.19,.24,0],.022,C.dark);box([.12,.22,.015],[0,.4,.13],C.cream);break;
    case 'globe':base(.5,.5);rod([0,.05,0],[0,.5,0]);ball(.34,[0,.63,0],C.blue);torus(.39,.018,[0,.63,0],C.gold,[0,0,-.3]);for(let i=0;i<16;i++){const a=i*2.4,b=Math.sin(i*3.1)*.95;ball(.065,[Math.cos(a)*Math.cos(b)*.335,.63+Math.sin(b)*.335,Math.sin(a)*Math.cos(b)*.335],C.green,[1,.8,.5]);}break;
    case 'solar-system':base(2.2,1.8);ball(.2,[0,.45,0],C.gold);for(let i=0;i<8;i++){const r=.32+i*.105,a=i*2.4;torus(r,.004,[0,.45,0],C.metal,[Math.PI/2,0,0]);ball(.025+i*.007,[Math.cos(a)*r,.45,Math.sin(a)*r],[C.red,C.cream,C.blue,C.red,C.gold,C.wood,C.teal,C.blue][i]);}break;
    case 'microscope': {
      const matEnamel = createEnamelMaterial(state.color || '#f0f3f5', 0.85);
      const matDark = createEnamelMaterial('#1e2428', 0.6);
      const matChrome = createChromeMaterial(true);
      const matPolished = createChromeMaterial(false);
      const matKnurl = createKnurledMetalMaterial('#2c3236');
      const matGlass = createOpticalGlassMaterial('#eef8fc');
      const matLight = createEmissiveSourceMaterial('#d8f0ff', 3.2);
      const matSlide = createOpticalGlassMaterial('#e4f0f5');
      const matSpecimen = material('#2da87b', 0, 0.35, 0.85);

      // 1. Stable ergonomic base with beveled corners & rubber feet
      customMesh(new RoundedBoxGeometry(.38, .055, .46, 3, .025), matEnamel, [0, .028, 0]);
      for (const x of [-.15, .15]) {
        for (const z of [-.18, .18]) {
          customMesh(new T.CylinderGeometry(.025, .025, .012, 16), matDark, [x, .006, z]);
        }
      }
      // Light collector housing & built-in LED field illuminator
      customMesh(new T.CylinderGeometry(.082, .092, .022, 28), matChrome, [0, .062, .06]);
      customMesh(new T.CylinderGeometry(.066, .066, .016, 28), matLight, [0, .072, .06]);
      customMesh(new T.TorusGeometry(.082, .007, 10, 32), matKnurl, [0, .072, .06], [Math.PI / 2, 0, 0]);
      customMesh(new T.CylinderGeometry(.022, .022, .014, 16), matKnurl, [.195, .035, .08], [0, 0, Math.PI / 2]);

      // 2. Heavy-duty curved stand / arm with integrated carry grip
      customMesh(new RoundedBoxGeometry(.13, .38, .16, 2, .03), matEnamel, [0, .24, -.14]);
      customMesh(new RoundedBoxGeometry(.12, .17, .25, 2, .03), matEnamel, [0, .47, -.05], [-.35, 0, 0]);
      customMesh(new RoundedBoxGeometry(.08, .05, .12, 2, .02), matDark, [0, .47, -.08]);

      // Coaxial focus knobs (Coarse knurled + fine concentric chrome)
      for (const s of [-1, 1]) {
        customMesh(new T.CylinderGeometry(.046, .046, .024, 24), matKnurl, [s * .082, .22, -.14], [0, 0, Math.PI / 2]);
        customMesh(new T.CylinderGeometry(.026, .026, .018, 24), matPolished, [s * .102, .22, -.14], [0, 0, Math.PI / 2]);
      }
      customMesh(new RoundedBoxGeometry(.04, .28, .018, 1, .005), matChrome, [0, .32, -.05]);

      // 3. Sub-stage Abbe condenser with iris diaphragm
      customMesh(new T.CylinderGeometry(.055, .042, .055, 24), matChrome, [0, .26, .06]);
      customMesh(new T.SphereGeometry(.035, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), matGlass, [0, .288, .06], [0, 0, 0], false);
      rod([0, .26, .06], [.075, .26, .09], .004, C.metal);

      // 4. Precision mechanical stage with X-Y coaxial controls
      customMesh(new RoundedBoxGeometry(.32, .022, .28, 2, .008), matDark, [0, .32, .06]);
      customMesh(new T.TorusGeometry(.034, .003, 8, 24), matChrome, [0, .332, .06], [Math.PI / 2, 0, 0]);
      customMesh(new T.CylinderGeometry(.01, .01, .075, 16), matKnurl, [.13, .26, .14]);

      // Stage clips
      for (const s of [-.09, .09]) {
        customMesh(new RoundedBoxGeometry(.012, .004, .07, 1, .002), matPolished, [s, .335, .04], [0, s < 0 ? .25 : -.25, 0]);
      }

      // Specimen glass slide with cover slip and biological sample
      customMesh(new RoundedBoxGeometry(.14, .003, .045, 1, .001), matSlide, [0, .334, .06], [0, 0, 0], false);
      customMesh(new RoundedBoxGeometry(.034, .0012, .034, 1, .0005), matSlide, [0, .337, .06], [0, 0, 0], false);
      customMesh(new T.CylinderGeometry(.011, .011, .0018, 16), matSpecimen, [0, .336, .06]);

      // 5. Revolving nosepiece with 3 parfocal objectives (DIN standard colors)
      customMesh(new T.CylinderGeometry(.068, .068, .022, 24), matDark, [0, .54, .06]);
      customMesh(new T.CylinderGeometry(.074, .058, .018, 24), matKnurl, [0, .52, .06]);

      // Objective 1: 10x (Active, vertical, DIN Yellow)
      customMesh(new T.CylinderGeometry(.02, .015, .085, 20), matChrome, [0, .452, .06]);
      customMesh(new T.CylinderGeometry(.0205, .0205, .012, 20), material('#e5a900', .1, .35), [0, .47, .06]);
      customMesh(new T.CylinderGeometry(.009, .009, .004, 16), matGlass, [0, .408, .06], [0, 0, 0], false);

      // Objective 2: 4x (Tilted backward-left, DIN Red)
      customMesh(new T.CylinderGeometry(.019, .016, .062, 16), matChrome, [-.045, .47, .02], [.32, 0, .45]);
      customMesh(new T.CylinderGeometry(.0195, .0195, .01, 16), material('#d32f2f', .1, .35), [-.045, .485, .02], [.32, 0, .45]);
      customMesh(new T.CylinderGeometry(.008, .008, .004, 16), matGlass, [-.06, .44, .002], [.32, 0, .45], false);

      // Objective 3: 40x (Tilted backward-right, DIN Blue)
      customMesh(new T.CylinderGeometry(.021, .014, .105, 16), matChrome, [.045, .458, .02], [.32, 0, -.45]);
      customMesh(new T.CylinderGeometry(.0215, .0215, .012, 16), material('#1976d2', .1, .35), [.045, .485, .02], [.32, 0, -.45]);
      customMesh(new T.CylinderGeometry(.007, .007, .004, 16), matGlass, [.06, .41, .002], [.32, 0, -.45], false);

      // 6. Binocular head inclined at 30° with diopter adjustments & optical glass eyepieces
      customMesh(new T.CylinderGeometry(.062, .062, .022, 24), matPolished, [0, .565, .02]);
      customMesh(new RoundedBoxGeometry(.17, .11, .14, 2, .02), matEnamel, [0, .635, .03], [-.52, 0, 0]);

      // Left & Right eyepiece tubes
      for (const side of [-.044, .044]) {
        customMesh(new T.CylinderGeometry(.019, .019, .075, 20), matPolished, [side, .705, .078], [-.52, 0, 0]);
        customMesh(new T.CylinderGeometry(.022, .022, .016, 20), matKnurl, [side, .728, .092], [-.52, 0, 0]);
        customMesh(new T.CylinderGeometry(.023, .02, .022, 20), matDark, [side, .748, .106], [-.52, 0, 0]);
        customMesh(new T.CylinderGeometry(.016, .016, .004, 16), matGlass, [side, .746, .104], [-.52, 0, 0], false);
      }
      break;
    }
    case 'molecule':{const points:V[]=[[0,.5,0],[-.35,.8,.15],[.35,.8,-.15],[-.35,.2,-.15],[.35,.2,.15]];for(let i=1;i<points.length;i++)rod(points[0],points[i],.035,C.metal);points.forEach((p,i)=>ball(i===0?.17:.11,p,i===0?C.dark:i%2?C.red:C.cream));}break;
    case 'sofa':legs(2,.7,.18);box([2.4,.35,.95],[0,.35,0],accent,.1);box([2.4,.5,.2],[0,.65,-.37],accent,.08);for(const x of [-.75,0,.75])box([.7,.18,.7],[x,.58,.07],C.cream,.08);for(const x of [-1.1,1.1])box([.2,.5,.9],[x,.55,0],accent,.07);break;
    case 'coffee-table':table(1.2,.42,.7);break;
    case 'floor-lamp':cyl(.25,.05,[0,.03,0],C.dark);rod([0,.05,0],[0,1.45,0]);rod([0,1.45,0],[.35,1.7,0]);cyl(.23,.22,[.35,1.66,0],C.cream,[0,0,0],.12);break;
    case 'partition':for(const x of [-.55,.55])box([.12,.06,.45],[x,.03,0]);box([1.5,1.7,.1],[0,.92,0],accent,.05);for(let i=0;i<15;i++)box([.003,1.6,.006],[-.7+i*.1,.92,.055],C.green,0);break;
    case 'coffee-machine': {
      // 4 anti-vibration chrome/rubber feet
      for (const fx of [-0.24, 0.24]) {
        for (const fz of [-0.14, 0.14]) {
          cyl(0.025, 0.04, [fx, 0.02, fz], C.metal);
          cyl(0.028, 0.012, [fx, 0.006, fz], C.dark);
        }
      }
      // Main brushed stainless steel chassis
      box([0.62, 0.44, 0.38], [0, 0.26, -0.03], C.metal, 0.02);
      // Contrast side body panels
      for (const sx of [-0.315, 0.315]) {
        box([0.015, 0.38, 0.34], [sx, 0.26, -0.03], accent, 0.01);
      }
      // Top cup warming tray with chrome guardrails
      box([0.58, 0.015, 0.32], [0, 0.485, -0.03], C.metal);
      rod([-0.28, 0.52, 0.12], [0.28, 0.52, 0.12], 0.006, C.metal);
      rod([-0.28, 0.52, -0.18], [0.28, 0.52, -0.18], 0.006, C.metal);
      rod([-0.28, 0.52, -0.18], [-0.28, 0.52, 0.12], 0.006, C.metal);
      rod([0.28, 0.52, -0.18], [0.28, 0.52, 0.12], 0.006, C.metal);
      // Warming ceramic cups on top
      cyl(0.038, 0.045, [-0.14, 0.51, 0.02], C.cream, 0.042);
      cyl(0.038, 0.045, [-0.14, 0.555, 0.02], C.cream, 0.042);
      cyl(0.038, 0.045, [0.14, 0.51, -0.04], C.cream, 0.042);

      // Slanted upper control fascia
      box([0.58, 0.13, 0.14], [0, 0.41, 0.14], C.metal, 0.01);
      // Dual pressure gauges (boiler pressure + extraction bar)
      for (const gx of [-0.21, 0.21]) {
        cyl(0.032, 0.014, [gx, 0.42, 0.215], C.gold, 0.032, [Math.PI / 2, 0, 0]);
        cyl(0.026, 0.016, [gx, 0.42, 0.216], C.cream, 0.026, [Math.PI / 2, 0, 0]);
        box([0.018, 0.003, 0.018], [gx + 0.006, 0.426, 0.226], C.red);
      }
      // Group brewing toggle switches / buttons
      for (let i = 0; i < 4; i++) {
        cyl(0.012, 0.016, [-0.075 + i * 0.05, 0.42, 0.215], C.dark, 0.012, [Math.PI / 2, 0, 0]);
      }

      // Group heads (dual chrome E61 extraction units)
      for (const hx of [-0.11, 0.11]) {
        cyl(0.046, 0.065, [hx, 0.32, 0.17], C.metal);
        torus(0.042, 0.008, [hx, 0.34, 0.17], C.metal, [Math.PI / 2, 0, 0]);
      }
      // Active portafilter locked on right group head
      cyl(0.042, 0.035, [0.11, 0.275, 0.17], C.metal);
      rod([0.11, 0.275, 0.17], [0.22, 0.26, 0.34], 0.014, C.dark);
      ball(0.018, [0.22, 0.26, 0.34], C.metal);
      for (const spx of [0.098, 0.122]) cyl(0.005, 0.02, [spx, 0.25, 0.17], C.metal);

      // Articulated steam wand on the left
      cyl(0.025, 0.03, [-0.25, 0.39, 0.19], C.dark, 0.025, [Math.PI / 2, 0, 0]);
      rod([-0.25, 0.36, 0.18], [-0.24, 0.22, 0.24], 0.009, C.metal);
      cyl(0.007, 0.018, [-0.24, 0.21, 0.24], C.gold);

      // Recessed lower bay & slotted stainless drip tray
      box([0.58, 0.045, 0.22], [0, 0.065, 0.17], C.metal);
      for (let i = 0; i < 9; i++) {
        box([0.54, 0.006, 0.008], [0, 0.089, 0.08 + i * 0.02], C.dark);
      }

      // Porcelain espresso cup catching coffee with crema
      cyl(0.036, 0.05, [0.11, 0.115, 0.17], C.cream, 0.04);
      torus(0.016, 0.005, [0.15, 0.115, 0.17], C.cream, [0, Math.PI / 2, 0]);
      cyl(0.032, 0.004, [0.11, 0.136, 0.17], C.gold);
      break;
    }
    case 'tree':rod([0,0,0],[0,2.5,0],.13,C.wood);for(let i=0;i<9;i++){const a=i*2.4;const p:V=[Math.cos(a)*.65,2+(i%3)*.4,Math.sin(a)*.65];rod([0,1.8,0],p,.05,C.wood);ball(.65,p,i%2?C.green:'#5c7b5d',[1,.8,1]);}break;
    case 'rock':{const m=mesh(new T.IcosahedronGeometry(.65,1),C.cream,[0,.38,0]);m.scale.set(1,.65,.8);m.rotation.set(.2,.4,.1);}break;
    case 'planter':box([1.2,.4,.55],[0,.2,0],C.wood);for(const x of [-.4,0,.4])plant(x,.15,0,.8);break;
    case 'bench':legs(1.5,.4,.45);for(let i=0;i<4;i++)box([1.8,.05,.11],[0,.46,-.2+i*.13],C.wood);for(let i=0;i<3;i++)box([1.8,.11,.04],[0,.64+i*.12,-.24],C.wood);for(const x of [-.7,.7])rod([x,.2,-.24],[x,.95,-.24]);break;
    case 'bridge':for(let i=0;i<16;i++)box([.14,.08,1.4],[-1.12+i*.15,.16,0],C.wood);for(const z of [-.66,.66]){for(const x of [-1.1,0,1.1])box([.08,1,.08],[x,.55,z],C.wood);box([2.4,.07,.09],[0,1.05,z],C.wood);box([2.4,.035,.04],[0,.6,z],C.wood);}break;
    case 'bar-chart':base(1.6,.7);for(let i=0;i<5;i++){const h=.25+((i*17+value)%100)/90;box([.22,h,.35],[(i-2)*.3,.08+h/2,0],i%2?C.gold:accent);}break;
    case 'terrain':base(1.8,1.5);for(let i=0;i<6;i++){const m=cyl(.7-i*.085,.085,[Math.sin(i)*.07,.12+i*.085,0],i%2?C.green:accent);m.scale.z=.8;}break;
    case 'network':{const points:V[]=[[0,.7,0],[-.6,.3,.1],[.5,.2,.3],[.6,1.2,-.2],[-.4,1.3,-.2]];points.forEach((p,i)=>{ball(.1,p,i?accent:C.gold);if(i)rod(points[0],p,.015);});rod(points[1],points[4],.01);rod(points[2],points[3],.01);}break;
    case 'timeline':base(2,.4);rod([-1,.4,0],[1,.4,0],.02);for(let i=0;i<5;i++){rod([(i-2)*.43,.1,0],[(i-2)*.43,.65,0],.015);ball(.065,[(i-2)*.43,.4,0],i%2?C.gold:accent);box([.25,.14,.02],[(i-2)*.43,.7,0],C.cream);}break;
    default: { const unreachable = id; throw new Error(`Missing model: ${unreachable}`); }
  }
  root.updateMatrixWorld(true);
  // Normalize only the floor origin, preserving meter dimensions and all articulated parts.
  const bounds=new T.Box3().setFromObject(root);
  for(const child of root.children) child.position.y -= bounds.min.y;
  root.updateMatrixWorld(true);
  return root;
}

export function disposeModel(root:T.Object3D) {
  const mats=new Set<T.Material>(),geo=new Set<T.BufferGeometry>(),textures=new Set<T.Texture>();
  root.traverse(o=>{
    if(o instanceof T.Mesh){
      geo.add(o.geometry);
      for(const m of Array.isArray(o.material)?o.material:[o.material]){
        mats.add(m);
        if(m instanceof T.MeshStandardMaterial){
          if(m.map)textures.add(m.map);
          if(m.roughnessMap)textures.add(m.roughnessMap);
          if(m.bumpMap)textures.add(m.bumpMap);
        }
      }
    }
  });
  textures.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());geo.forEach(g=>g.dispose());
}
