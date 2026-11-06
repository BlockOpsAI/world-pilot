import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ExtendedAsset } from './extendedCatalog';
import {
  createOpticalGlassMaterial,
  createChromeMaterial,
  createPBRWoodMaterial,
} from './proceduralMaterials';

type V=[number,number,number];
const P={wood:'#aa754b',dark:'#293839',steel:'#a8b8ba',white:'#e9e3d5',red:'#b64b3c',green:'#568450',blue:'#4b819f',gold:'#c49b44',bread:'#cb8b43',glass:'#a5d9d7',pink:'#dc9292'};
/** Original parametric meshes. Closed primitives, lathed vessel walls and authored assemblies.
 * All assets are fitted to the declared meter dimensions and rest at Y=0.
 */
export function buildExtendedModel(asset:ExtendedAsset,color?:string):T.Group {
  const root=new T.Group();root.name=asset.id;
  const v=asset.variant, accent=color||'#508b87';
  const mats=new Map<string,T.Material>();
  const mat=(c:string)=>{
    if(!mats.has(c)){
      let m: T.Material;
      if (c === P.glass) {
        m = createOpticalGlassMaterial('#eaf6fa');
      } else if (c === P.wood || c === P.bread || c === '#b8834e') {
        m = createPBRWoodMaterial(c === P.bread ? '#cb8b43' : c);
      } else if (c === P.steel) {
        m = createChromeMaterial(true);
      } else if (c === P.gold) {
        const gm = createChromeMaterial(false);
        gm.color.set('#cba358');
        gm.roughness = 0.22;
        gm.metalness = 0.86;
        m = gm;
      } else {
        m = new T.MeshPhysicalMaterial({
          color: c,
          roughness: 0.52,
          clearcoat: 0.32,
          clearcoatRoughness: 0.2,
        });
      }
      mats.set(c, m);
    }
    return mats.get(c)!;
  };
  const mesh=(g:T.BufferGeometry,p:V,c=P.dark,r:V=[0,0,0])=>{const o=new T.Mesh(g,mat(c));o.position.set(...p);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;};
  const b=(s:V,p:V,c=P.wood,r:V=[0,0,0])=>mesh(new RoundedBoxGeometry(...s,1,Math.min(.025,Math.min(...s)*.18)),p,c,r);
  const cy=(radius:number,h:number,p:V,c=P.steel,top=radius,r:V=[0,0,0],sides=28)=>mesh(new T.CylinderGeometry(top,radius,h,sides),p,c,r);
  const ball=(radius:number,p:V,c=accent,s:V=[1,1,1])=>{const m=mesh(new T.SphereGeometry(radius,24,16),p,c);m.scale.set(...s);return m;};
  const ring=(radius:number,t:number,p:V,c=P.steel,r:V=[0,0,0],arc=Math.PI*2)=>mesh(new T.TorusGeometry(radius,t,8,40,arc),p,c,r);
  const rod=(a:V,z:V,r=.02,c=P.steel)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...z),d=bv.clone().sub(av);const o=cy(r,d.length(),av.add(bv).multiplyScalar(.5).toArray() as V,c);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
  const lathe=(points:[number,number][],p:V,c=P.white)=>mesh(new T.LatheGeometry(points.map(a=>new T.Vector2(...a)),32),p,c);
  const shell=(r=.4,h=.4,p:V=[0,0,0],c=P.white)=>lathe([[0,0],[r*.6,0],[r,.1*h],[r,h],[r-.035,h],[r-.04,.12*h],[0,.12*h]],p,c);
  const outline=(points:[number,number][],depth:number,p:V,c=P.steel)=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),p,c);};
  const legs=(w=.8,d=.6,h=.7)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){b([.055,h,.055],[x,h/2,z],P.dark);cy(.032,.015,[x,.008,z],P.dark);}};
  const handle=(p:V,r=.2,c=P.steel)=>ring(r,.03,p,c);
  const wheels=(w=.7,d=.6,y=.12)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])cy(.1,.06,[x,y,z],P.dark,.1,[0,0,Math.PI/2]);};
  const buttons=(n:number,p:V,step=.08)=>{for(let i=0;i<n;i++)ball(.023,[p[0]+i*step,p[1],p[2]],[P.red,P.green,P.blue,P.gold][i%4]);};
  const screen=(w=.7,h=.4,p:V=[0,.6,.26])=>{b([w,h,.035],p,P.dark);b([w*.94,h*.88,.012],[p[0],p[1],p[2]+.02],P.dark);b([w*.9,h*.83,.015],[p[0],p[1],p[2]+.025],'#182830');for(let i=0;i<3;i++)b([w*(.5-i*.09),.018,.008],[p[0]-w*.08,p[1]+h*.22-i*h*.2,p[2]+.035],P.glass);};
  const leaf=(p:V,s:V=[.12,.3,.04],r=0)=>{const o=ball(1,p,P.green,s);o.rotation.z=r;};
  const flower=(p:V,c=P.pink)=>{for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(.08,[p[0]+Math.cos(a)*.1,p[1]+Math.sin(a)*.1,p[2]],c,[1,1,.4]);}ball(.06,[p[0],p[1],p[2]+.035],P.gold);};
  const lid=(r:number,y:number,c=P.steel)=>{cy(r,.04,[0,y,0],c);ball(.06,[0,y+.065,0],P.dark,[1,.65,1]);};
  const bread=(p:V,s:V)=>{ball(.5,p,P.bread,s);for(let i=-1;i<=1;i++)b([s[0]*.14,.01,s[2]*.55],[p[0]+i*s[0]*.22,p[1]+s[1]*.47,p[2]],P.white,[0,-.3,0]);};
  const book=(p:V,s:V,c=accent)=>{b(s,p,c);b([s[0]*.91,s[1]*.7,s[2]*.94],[p[0]+s[0]*.025,p[1],p[2]+.01],P.white);};
  const grid=(w:number,h:number,p:V,vertical=true)=>{for(let i=0;i<=8;i++){const x=-w/2+i*w/8;if(vertical)rod([p[0]+x,p[1]-h/2,p[2]],[p[0]+x,p[1]+h/2,p[2]],.004,P.white);else rod([p[0]+x,p[1],p[2]-h/2],[p[0]+x,p[1],p[2]+h/2],.004,P.white);}for(let i=0;i<=8;i++){const z=-h/2+i*h/8;if(vertical)rod([p[0]-w/2,p[1]+z,p[2]],[p[0]+w/2,p[1]+z,p[2]],.004,P.white);else rod([p[0]-w/2,p[1],p[2]+z],[p[0]+w/2,p[1],p[2]+z],.004,P.white);}};
  switch(asset.recipe){
    case 'pot': {
      if (v === 2) {
        // Cocotte en fonte émaillée française (style Le Creuset / Staub rouge cerise)
        lathe([[0, 0], [0.34, 0], [0.38, 0.06], [0.38, 0.30], [0.35, 0.30], [0.35, 0.05], [0, 0.05]], [0, 0, 0], '#991b1b');
        cy(0.345, 0.01, [0, 0.055, 0], '#fef3c7');
        for (const sx of [-0.42, 0.42]) ring(0.08, 0.02, [sx, 0.24, 0], '#991b1b', [0, 0, 0], Math.PI);
        lathe([[0, 0.30], [0.38, 0.30], [0.37, 0.34], [0.15, 0.38], [0, 0.38]], [0, 0, 0], '#991b1b');
        cy(0.035, 0.04, [0, 0.40, 0], P.gold);
        ball(0.025, [0, 0.42, 0], P.gold);
      } else if (v === 1) {
        shell(0.36, 0.65, [0, 0, 0], P.steel);
        cy(0.37, 0.04, [0, 0.02, 0], P.dark);
        lid(0.37, 0.68, P.steel);
        for (const sx of [-0.44, 0.44]) handle([sx, 0.48, 0], 0.12, P.steel);
      } else {
        shell(0.34, 0.35, [0, 0, 0], P.steel);
        cy(0.35, 0.035, [0, 0.018, 0], P.dark);
        rod([0.34, 0.28, 0], [0.82, 0.34, 0], 0.022, P.steel);
        rod([0.82, 0.34, 0], [0.92, 0.35, 0], 0.016, P.dark);
        ring(0.02, 0.005, [0.92, 0.35, 0], P.steel, [0, Math.PI / 2, 0]);
        b([0.04, 0.02, 0.06], [-0.34, 0.34, 0], P.steel);
      }
      break;
    }
    case 'pan': {
      if (v === 1) {
        lathe([[0, 0], [0.15, 0.02], [0.36, 0.16], [0.44, 0.28], [0.42, 0.28], [0.34, 0.15], [0.14, 0.03], [0, 0.03]], [0, 0, 0], '#27272a');
        rod([0.42, 0.27, 0], [0.88, 0.36, 0], 0.028, P.wood);
        handle([-0.42, 0.24, 0], 0.10, P.steel);
      } else {
        lathe([[0, 0], [0.32, 0], [0.46, 0.09], [0.44, 0.09], [0.30, 0.025], [0, 0.025]], [0, 0, 0], P.steel);
        cy(0.32, 0.02, [0, 0.01, 0], P.dark);
        b([0.08, 0.04, 0.06], [0.42, 0.08, 0], P.steel);
        for (const rz of [-0.02, 0.02]) ball(0.007, [0.40, 0.08, rz], P.steel);
        rod([0.42, 0.08, 0], [0.92, 0.22, 0], 0.022, P.steel);
        ring(0.018, 0.005, [0.92, 0.22, 0], P.steel, [0, Math.PI / 2, 0]);
      }
      break;
    }
    case 'bowl': shell(.45,v===2?.5:.3,[0,0,0],v===3?P.gold:v===1?P.steel:P.white);if(v===1){for(let i=0;i<20;i++){const a=i*Math.PI/10;ball(.022,[.454*Math.cos(a),.2,.454*Math.sin(a)],P.dark);}for(const x of [-.55,.55])handle([x,.24,0],.14);}if(v===3)rod([.5,.03,-.3],[.5,.03,.3],.035,P.wood);break;
    case 'board': {
      b([1.0, 0.06, 0.65], [0, 0.03, 0], P.wood);
      for (const z of [-0.25, 0.25]) b([0.86, 0.006, 0.02], [0, 0.061, z], '#7c5332');
      for (const x of [-0.43, 0.43]) b([0.02, 0.006, 0.52], [x, 0.061, 0], '#7c5332');
      for (const sx of [-0.49, 0.49]) b([0.03, 0.025, 0.20], [sx, 0.03, 0], '#5a3b22');
      break;
    }
    case 'rolling': cy(.12,.65,[0,0,0],P.wood,.12,[0,0,Math.PI/2]);for(const x of [-.46,.46])cy(.055,.24,[x,0,0],P.wood,.055,[0,0,Math.PI/2]);break;
    case 'utensil': rod([0,0,0],[0,.65,0],.035,P.wood);if(v===0){for(let i=0;i<4;i++){const o=ring(.17,.008,[0,.79,0],P.steel,[0,i*Math.PI/4,0]);o.scale.y=1.5;}}else if(v===2){shell(.17,.12,[0,.65,.12],P.steel);}else if(v===4){for(const x of [-.1,.1])rod([0,.55,0],[x,.83,0],.015);b([.2,.04,.015],[0,.83,0],P.steel);}else {b([.23,.3,.025],[0,.77,0],P.steel);if(v===3)for(let i=0;i<4;i++)b([.022,.18,.029],[-.075+i*.05,.78,0],P.dark);}break;
    case 'knife': b([.1,.36,.065],[0,.18,0],P.wood);outline([[-.045,.36],[.13,.36],[.12,.87],[.03,1],[-.04,1]],.025,[0,0,-.012],P.steel);for(const y of [.08,.24])ball(.014,[0,y,.035],P.steel);if(v===1)for(let i=0;i<10;i++)b([.03,.018,.03],[.13,.4+i*.05,0],P.dark);break;
    case 'grater': cy(.35,.75,[0,.4,0],P.steel,.23,[0,Math.PI/4,0],4);handle([0,.92,0],.15);for(let y=0;y<5;y++)for(let x=-1;x<=1;x++)b([.055,.035,.012],[x*.13,.15+y*.12,.26-y*.015],P.dark);break;
    case 'juicer': shell(.4,.15);cy(.2,.3,[0,.25,0],P.gold,.02);for(let i=0;i<10;i++){const a=i*Math.PI/5;rod([.19*Math.cos(a),.1,.19*Math.sin(a)],[.025*Math.cos(a),.4,.025*Math.sin(a)],.012,P.white);}break;
    case 'mortar': shell(.4,.4,[0,0,0],P.white);rod([.15,.15,0],[.45,.7,.08],.075,P.wood);ball(.1,[.15,.15,0],P.wood);break;
    case 'scale': b([1,.15,.75],[0,.08,0],P.steel);cy(.35,.04,[0,.19,-.08]);screen(.35,.1,[0,.09,.385]);break;
    case 'appliance': b([.9,1,.8],[0,.5,0],P.white);if(v===0){for(const y of [.28,.77]){b([.85,.42,.03],[0,y,.42],P.steel);b([.04,.24,.05],[.31,y,.46],P.dark);}}else{b([.75,.64,.025],[-.04,.42,.42],v===3?P.steel:P.dark);if(v!==3)b([.6,.43,.012],[-.04,.42,.44],P.blue);b([.62,.045,.07],[-.04,.77,.46],P.steel);buttons(v===2?2:4,[-.27,.92,.42],.18);}break;
    case 'toaster': b([.9,.6,.6],[0,.3,0],P.steel);for(const z of [-.14,.14])b([.64,.02,.07],[0,.61,z],P.dark);b([.08,.3,.06],[.46,.32,0],P.dark);break;
    case 'kettle': lathe([[0,0],[.3,0],[.35,.15],[.32,.45],[.2,.6],[.18,.6],[.28,.43],[.25,.07],[0,.07]],[0,0,0],v?P.white:P.steel);lid(.21,.61,v?P.white:P.steel);handle([-.34,.35,0],.25,v?P.white:P.dark);rod([.24,.22,0],[.53,.48,0],.07,v?P.white:P.steel);break;
    case 'blender': b([.6,.25,.5],[0,.125,0],P.steel);shell(.23,.5,[0,.26,0],P.glass);lid(.25,.79,P.dark);handle([.29,.55,0],.18,P.dark);buttons(3,[-.15,.15,.26],.15);break;
    case 'mixer': b([.8,.08,.65],[0,.04,0]);b([.2,.65,.45],[-.27,.38,0],accent);b([.7,.18,.4],[0,.7,0],accent);shell(.23,.3,[.12,.1,0],P.steel);rod([.13,.68,0],[.13,.27,0],.025);ring(.12,.009,[.13,.36,0]);break;
    case 'hob': b([1,.08,.8],[0,.04,0],P.dark);for(const x of v===2?[0]:[-.25,.25])for(const z of v===2?[0]:[-.2,.2]){ring(v===2?.35:.16,.012,[x,.088,z],P.steel,[Math.PI/2,0,0]);if(v===1){b([.36,.04,.04],[x,.12,z],P.dark);b([.04,.04,.36],[x,.12,z],P.dark);}}buttons(3,[-.1,.09,.35]);break;
    case 'hood': cy(.7,.35,[0,.2,0],P.steel,.3,[0,Math.PI/4,0],4);b([.35,.6,.3],[0,.65,0],P.steel);for(let i=0;i<6;i++)b([.06,.01,.5],[-.25+i*.1,.02,0],P.dark);break;
    case 'sink': b([1,.04,.7],[0,.3,0],P.steel);shell(.27,.22,[-.12,.12,0],P.steel);ring(.2,.025,[.25,.52,-.23],P.steel,[0,Math.PI/2,0],Math.PI);rod([.25,.3,-.43],[.25,.52,-.43]);break;
    case 'cabinet': b([1,1,.65],[0,.5,0],P.wood);b([1.07,.07,.72],[0,1.03,0],P.white);for(let i=0;i<(v===1?4:2);i++){const y=v===1?.14+i*.24:.5;const x=v===1?0:-.25+i*.5;b([v===1?.92:.46,v===1?.2:.9,.025],[x,y,.34],accent);b([.12,.02,.04],[x,y+.08,.37],P.steel);}if(v===0)legs(.85,.55,.12);break;
    case 'rack': if(v===3){for(const x of [-.45,.45]){rod([x,0,0],[x,1,0]);b([.12,.04,.5],[x,.02,0]);}rod([-.45,1,0],[.45,1,0]);for(let i=0;i<5;i++){const x=-.3+i*.15;rod([x,.85,0],[x-.065,.78,0],.008);rod([x,.85,0],[x+.065,.78,0],.008);rod([x-.065,.78,0],[x+.065,.78,0],.008);}}else if(v===2){for(let i=0;i<4;i++)ring(.2,.02,[-.6+i*.4,.25,0],P.steel,[0,Math.PI/2,0]);rod([-.8,.06,0],[.8,.06,0]);}else{b([1,.05,.65],[0,.025,0]);for(let i=0;i<7;i++){const x=-.42+i*.14;if(v===0){rod([x,.05,-.25],[x,.35,-.25],.012);rod([x,.35,-.25],[x,.35,.25],.012);rod([x,.35,.25],[x,.05,.25],.012);}else{cy(.055,.2,[x,.15,0],P.glass);cy(.06,.03,[x,.27,0],P.dark);}}}break;
    case 'bin': shell(.35,.8,[0,0,0],P.steel);lid(.36,.83);b([.25,.04,.2],[0,.035,.4],P.dark);break;
    case 'cart': wheels(.7,.7);for(const y of v?[.25,.6]:[.2,.65]){b([.8,.04,.7],[0,y,0],P.steel);if(v)for(let i=0;i<9;i++){const x=-.38+i*.095;rod([x,y,-.34],[x,y+.3,-.34],.009);rod([x,y,.34],[x,y+.3,.34],.009);}}for(const x of [-.37,.37])for(const z of [-.32,.32])rod([x,.1,z],[x,.9,z],.022);rod([-.37,.9,.32],[.37,.9,.32],.035,accent);break;
    case 'fruit': {const colors=[P.red,P.green,'#db852b','#e5c243',P.red,P.red,'#614165',P.red,'#dc8233'];if(v===1){ball(.34,[0,.3,0],colors[v]);ball(.21,[0,.64,0],colors[v]);}else if(v===7||v===8){for(let i=0;i<(v===8?8:4);i++){const a=i*Math.PI*2/(v===8?8:4);ball(.33,[Math.cos(a)*.16,.35,Math.sin(a)*.16],colors[v],[.8,v===7?1.2:1,.8]);}}else ball(.4,[0,.4,0],colors[v],[v===3?1.3:1,v===4?.95:v===6?1.7:1,1]);rod([0,v===6?1.02:.76,0],[.06,v===6?1.15:.88,0],.025,P.wood);if(v!==2&&v!==3)leaf([.12,v===6?1.08:.82,0],[.13,.055,.035]);if(v===4)for(let i=0;i<12;i++){const a=i*2.4;ball(.018,[Math.cos(a)*.3,.18+i*.04,.28+Math.sin(a)*.03],P.gold);}break;}
    case 'banana': {const curve=new T.CatmullRomCurve3([new T.Vector3(-.45,.35,0),new T.Vector3(-.25,.05,0),new T.Vector3(.15,.03,0),new T.Vector3(.4,.25,0)]);mesh(new T.TubeGeometry(curve,20,.075,8,false),[0,0,0],'#e5bd45');rod([-.45,.35,0],[-.5,.43,0],.035,P.wood);break;}
    case 'grapes': for(let j=0;j<4;j++)for(let i=0;i<5-j;i++){const a=i*Math.PI*2/(5-j);ball(.12,[Math.cos(a)*(.22-j*.045),.65-j*.18,Math.sin(a)*(.22-j*.045)],'#655185');}rod([0,.65,0],[.08,.94,0],.025,P.wood);leaf([.17,.82,0]);break;
    case 'vegetable': if(v===0){cy(.025,.7,[0,.35,0],'#db8a35',.16);for(let i=0;i<5;i++)leaf([-.12+i*.06,.87,0],[.045,.22,.025],(i-2)*.25);}else if(v===1){cy(.1,.65,[0,.32,0],P.white);for(let i=0;i<6;i++)leaf([Math.sin(i)*.08,.85,Math.cos(i)*.06],[.05,.35,.03],(i-3)*.12);}else{cy(.1,.4,[0,.2,0],P.green,.15);for(let i=0;i<9;i++){const a=i*2.4;ball(.19,[Math.cos(a)*.25,.5+Math.sin(i)*.09,Math.sin(a)*.25],P.green);}}break;
    case 'mushroom': for(let i=0;i<(v?3:1);i++){const x=(i-1)*.3,s=v?1-i*.18:1;cy(.09*s,.4*s,[x,.2*s,0],P.white);ball(.3*s,[x,.43*s,0],v?P.red:P.wood,[1,.45,1]);if(v)for(let j=0;j<5;j++)ball(.025,[x+Math.cos(j)*.16*s,.52*s,Math.sin(j)*.16*s],P.white);}break;
    case 'egg': ball(.32,[0,.45,0],v?P.pink:P.white,[1,1.35,1]);if(v){for(let y=0;y<3;y++)ring(.28,.012,[0,.25+y*.16,0],P.gold,[Math.PI/2,0,0]);}else{shell(.28,.2);cy(.05,.1,[0,-.05,0]);cy(.25,.04,[0,-.12,0]);}break;
    case 'carton': b([.45,.8,.45],[0,.4,0],P.white);cy(.32,.18,[0,.89,0],accent,0,[0,Math.PI/4,0],4);b([.25,.4,.012],[0,.4,.232],accent);cy(.055,.04,[.13,.92,.06],P.white);break;
    case 'bag': if(v===7){ball(.4,[0,.35,0],P.wood,[1,1,.8]);cy(.2,.12,[0,.73,0],P.wood,.3);ring(.2,.02,[0,.71,0],P.gold,[Math.PI/2,0,0]);}else {b([v===4?1:.7,v===4?.3:.8,.32],[0,v===4?.15:.4,0],v===0||v===5?P.bread:accent);if([1,2,3,5,6].includes(v))handle([0,.88,0],.2,P.wood);if(v===1){b([.52,.28,.07],[0,.24,.2],P.dark);for(const x of [-.23,.23])ring(.22,.035,[x,.4,-.2],P.dark,[0,Math.PI/2,0]);}if(v===2||v===6)for(const x of [-.22,.22])b([.08,.3,.03],[x,.46,.19],P.wood);if(v===0)b([.4,.3,.01],[0,.4,.17],P.white);if(v===4)rod([-.4,.3,0],[.4,.3,0],.01,P.gold);}break;
    case 'bottle': {
      lathe([[0,0],[.24,0],[.25,.5],[.12,.67],[.09,.9],[.07,.9],[.08,.68],[.21,.49],[.2,.04],[0,.04]],[0,0,0],v===2?'#828bbe':v===3?'#5b1e2a':v===4?'#243820':P.glass);
      if(v!==1)cy(.105,.1,[0,.92,0],v===2?P.wood:v===4?P.gold:P.gold);
      // Wine bottle capsule (coiffe) and paper chateau label
      if(v===3||v===4){
        cy(.095,.18,[0,.84,0],v===3?'#721e28':'#c5a14d');
        b([.26,.32,.018],[0,.3,.248],P.white);
        b([.20,.03,.005],[0,.38,.258],P.dark);
        b([.16,.015,.005],[0,.33,.258],v===3?'#721e28':P.dark);
      } else if(v===0) {
        b([.28,.3,.018],[0,.3,.245],P.white);
      }
      break;
    }
    case 'jar': shell(.3,.6,[0,0,0],v===1?P.white:v===2?P.white:v===3?'#e5ba35':v===4?P.glass:v===5?'#eae6df':'#c5954d');cy(.32,.08,[0,.64,0],v===2?'#bf3939':v===3?'#2b2b2b':v===4?P.gold:v===5?'#b38753':P.gold);if(v===1)for(let i=0;i<5;i++)ball(.016,[Math.sin(i*2.4)*.13,.687,Math.cos(i*2.4)*.13],P.dark);else if(v===4){for(let i=0;i<4;i++)ball(.07,[Math.cos(i*1.6)*.1,.2+i*.1,Math.sin(i*1.6)*.1],'#395e2c',[1,1.8,1]);}else b([.35,.28,.018],[0,.32,.305],P.white);break;
    case 'bread': {
      if (v === 0) {
        // La baguette de tradition française: tapered crust with 5 diagonal scarifications (grignes)
        for (let i = 0; i < 9; i++) {
          const z = -0.68 + i * 0.17;
          const s = Math.sin((i + 1) * Math.PI / 10);
          ball(0.12 * s + 0.04, [0, 0.08, z], P.bread, [1.1, 0.75, 1.4]);
        }
        for (let i = 0; i < 5; i++) {
          const z = -0.44 + i * 0.22;
          b([0.09, 0.018, 0.14], [0, 0.155, z], '#edd59d', [0, 0.48, 0]);
          b([0.085, 0.007, 0.12], [0, 0.163, z], P.white, [0, 0.48, 0]);
        }
      } else if (v === 1) {
        // Boule de campagne: rustic round sourdough loaf with flour-dusted cross score
        ball(0.42, [0, 0.22, 0], P.bread, [1.2, 0.72, 1.2]);
        ball(0.38, [0, 0.24, 0], '#e8d2a2', [1.18, 0.68, 1.18]);
        b([0.62, 0.03, 0.07], [0, 0.36, 0], '#cca064');
        b([0.07, 0.03, 0.62], [0, 0.36, 0], '#cca064');
        b([0.58, 0.012, 0.04], [0, 0.375, 0], P.white);
        b([0.04, 0.012, 0.58], [0, 0.375, 0], P.white);
      } else if (v === 2) {
        for (let i = 0; i < 7; i++) ball(.2, [-.6 + i * .2, .12, Math.sin(i * Math.PI / 2) * .11], P.bread, [1, .7, 1]);
      } else {
        bread([0, .15, 0], [1, .5, .9]);
      }
      break;
    }
    case 'pastry': {
      if (v === 0) {
        // Le croissant au beurre: curved golden puff-pastry crescent with layered folds
        for (let i = 0; i < 9; i++) {
          const a = (i - 4) * 0.28;
          const rad = 0.32;
          const x = Math.sin(a) * rad;
          const z = (1 - Math.cos(a)) * rad * 0.6;
          const t = 1 - Math.abs(i - 4) / 4.8;
          const r = (0.16 * t + 0.05);
          const m = ball(r, [x, 0.10, z], i % 2 === 0 ? P.bread : '#df963c', [1.1, 0.75, 1.1]);
          m.rotation.y = -a * 1.2;
        }
        for (const sx of [-1, 1]) {
          ball(0.04, [sx * 0.34, 0.06, 0.24], P.bread, [1, 0.6, 1.2]);
        }
      } else if (v === 1) {
        // Pain au chocolat: layered flaky dome with dual dark chocolate bars visible at ends
        b([0.48, 0.24, 0.36], [0, 0.12, 0], P.bread);
        ball(0.26, [0, 0.15, 0], '#df9b42', [1.8, 0.55, 1.3]);
        for (const cz of [-0.08, 0.08]) {
          cy(0.024, 0.488, [0, 0.10, cz], '#24140d', 0.024, [0, 0, Math.PI / 2]);
        }
      } else if (v === 2 || v === 5) {
        // Éclair au chocolat
        ball(.35, [0, .18, 0], v === 5 ? '#714a34' : P.bread, [2, .6, 1]);
        ball(.32, [0, .27, 0], '#2e1910', [2, .22, .9]);
        if (v === 5) for (let i = 0; i < 7; i++) rod([-.6, .3, -.2 + i * .06], [.6, .3, -.2 + i * .06], .007, P.bread);
      } else if (v === 3) {
        // Mille-feuille
        for (let i = 0; i < 5; i++) b([.9, .05, .5], [0, .04 + i * .06, 0], i % 2 ? P.white : P.bread);
      } else if (v === 4) {
        // Chausson aux pommes
        ball(.4, [0, .1, 0], P.bread, [1.3, .4, 1]);
        for (let i = 0; i < 5; i++) rod([-.35, .17, -.15 + i * .075], [.3, .17, -.15 + i * .075], .012, '#dfaa69');
      } else {
        bread([0, .16, 0], [1, .45, .7]);
        for (const x of [-.23, .23]) cy(.04, .73, [x, .12, 0], '#583e32', .04, [Math.PI / 2, 0, 0]);
      }
      break;
    }
    case 'cake': if(v===0){for(const y of [.08,.2])ball(.38,[0,y,0],P.pink,[1,.25,1]);cy(.35,.065,[0,.14,0],P.white);}else if(v===2){ball(.3,[0,.26,0],P.bread);ball(.18,[0,.65,0],P.bread);for(const y of [.46,.79])cy(y>.5?.14:.25,.045,[0,y,0],'#614630');}else if(v===3){ring(.3,.1,[0,.13,0],P.bread,[Math.PI/2,0,0]);ring(.3,.055,[0,.17,0],P.white,[Math.PI/2,0,0]);}else{cy(.45,v===4?.55:.13,[0,v===4?.28:.07,0],v===4?'#895334':P.bread,v===4?.33:.45);if(v===1)for(let i=0;i<14;i++){const a=i*Math.PI/7;ball(.13,[Math.cos(a)*.26,.15,Math.sin(a)*.26],'#e7c88a',[1,.2,.5]);}if(v===4)for(let i=0;i<12;i++){const a=i*Math.PI/6;rod([Math.cos(a)*.44,.02,Math.sin(a)*.44],[Math.cos(a)*.32,.54,Math.sin(a)*.32],.025,P.bread);}if(v===5||v===6)for(let i=-3;i<=3;i++){b([.6,.012,.015],[0,.15,i*.1],P.gold,[0,.6,0]);b([.6,.012,.015],[i*.1,.15,0],P.gold,[0,-.6,0]);}if(v===7){cy(.35,.015,[0,.15,0],'#683e2a');ball(.1,[.15,.21,0],P.white,[1,.5,1]);}}break;
    case 'cheese': {
      if (v === 0) {
        // Camembert de Normandie AOP dans sa boîte en bois de peuplier
        shell(0.38, 0.16, [0, 0, 0], '#c9a87d');
        // Roue de Camembert avec croûte fleurie blanche
        cy(0.35, 0.13, [0, 0.07, 0], '#f4f1e8');
        // Cœur crémeux fondant exposé dans une entaille
        outline([[0, 0], [0.35, 0], [0.28, 0.22]], 0.13, [0, 0.07, 0], '#f8e9b6');
        // Couvercle en bois entrouvert / posé sur le côté avec étiquette normande
        cy(0.385, 0.024, [0.38, 0.14, 0.14], '#c9a87d', 0.385, [0.35, 0.2, 0.4]);
        cy(0.32, 0.006, [0.38, 0.155, 0.14], P.blue, 0.32, [0.35, 0.2, 0.4]);
        cy(0.18, 0.008, [0.38, 0.160, 0.14], P.gold, 0.18, [0.35, 0.2, 0.4]);
      } else {
        // Pointe de Comté affiné: croûte naturelle ambrée et pâte ivoire
        outline([[0, 0], [0.72, 0], [0.55, 0.45], [0, 0]], 0.32, [-0.3, 0, -0.16], '#785f46');
        outline([[0.02, 0.02], [0.68, 0.02], [0.52, 0.42], [0.02, 0.02]], 0.31, [-0.29, 0.005, -0.155], '#edd187');
        for (const p of [[0.1, 0.18, 0.157], [-0.15, 0.35, 0.157]] as V[]) ball(0.035, p, '#dbba67', [1, 1, 0.15]);
      }
      break;
    }
    case 'platter': cy(.6,.03,[0,0,0],P.wood);cy(.18,.12,[-.22,.08,0],P.white);outline([[0,0],[.3,0],[0,.3]],.15,[.05,.06,0],P.gold);for(let i=0;i<7;i++)ball(.045,[.25+Math.cos(i)*.1,.1,.25+Math.sin(i)*.08],'#655185');break;
    case 'plate': {
      // Fine assiette en porcelaine française avec marli plat et anneau de pied
      lathe([[0, 0], [0.24, 0], [0.26, 0.015], [0.42, 0.015], [0.50, 0.048], [0.48, 0.048], [0.40, 0.025], [0.24, 0.025], [0, 0.025]], [0, 0, 0], P.white);
      if (v === 2) ring(0.44, 0.006, [0, 0.035, 0], P.gold, [Math.PI / 2, 0, 0]);
      else ring(0.45, 0.004, [0, 0.035, 0], '#d4d4d8', [Math.PI / 2, 0, 0]);
      ring(0.24, 0.006, [0, 0.004, 0], '#e4e4e7', [Math.PI / 2, 0, 0]);
      break;
    }
    case 'cup': shell(.3,v?.7:.45);handle([.35,v?.38:.24,0],.2,P.white);break;
    case 'glass': {
      if (v === 1 || v === 2) {
        // Verre à vin de dégustation ou flûte à champagne à pied élancé
        cy(0.26, 0.016, [0, 0.008, 0], P.glass);
        rod([0, 0.016, 0], [0, 0.48, 0], 0.014, P.glass);
        ball(0.022, [0, 0.48, 0], P.glass);
        if (v === 2) {
          lathe([[0, 0.48], [0.12, 0.50], [0.16, 0.70], [0.14, 1.05], [0.12, 1.05], [0.14, 0.70], [0.10, 0.52], [0, 0.52]], [0, 0, 0], P.glass);
        } else {
          lathe([[0, 0.48], [0.18, 0.52], [0.32, 0.68], [0.24, 0.98], [0.22, 0.98], [0.30, 0.68], [0.16, 0.54], [0, 0.54]], [0, 0, 0], P.glass);
        }
      } else {
        // Verre de bistrot Duralex Picardie à facettes
        lathe([[0, 0], [0.20, 0], [0.24, 0.15], [0.29, 0.65], [0.27, 0.65], [0.22, 0.15], [0.17, 0.03], [0, 0.03]], [0, 0, 0], P.glass);
        for (let i = 0; i < 9; i++) {
          const a = i * Math.PI * 2 / 9;
          rod([Math.cos(a) * 0.23, 0.12, Math.sin(a) * 0.23], [Math.cos(a) * 0.27, 0.52, Math.sin(a) * 0.27], 0.008, P.glass);
        }
      }
      break;
    }
    case 'cutlery': {
      // Couverts de table en inox poli
      rod([0, 0.04, 0], [0, 0.52, 0], 0.018, P.steel);
      if (v === 1) {
        b([0.035, 0.44, 0.015], [0, 0.24, 0], P.steel);
        outline([[-0.015, 0.46], [0.035, 0.48], [0.035, 0.88], [0.01, 0.96], [-0.015, 0.96]], 0.012, [0, 0, -0.006], P.steel);
      } else if (v === 2) {
        b([0.032, 0.42, 0.015], [0, 0.23, 0], P.steel);
        ball(0.12, [0, 0.72, 0.02], P.steel, [0.85, 1.4, 0.35]);
      } else {
        b([0.032, 0.42, 0.015], [0, 0.23, 0], P.steel);
        b([0.16, 0.12, 0.018], [0, 0.58, 0.01], P.steel);
        for (let i = 0; i < 4; i++) {
          rod([-0.06 + i * 0.04, 0.62, 0.01], [-0.06 + i * 0.04, 0.88, 0.02], 0.008, P.steel);
        }
      }
      break;
    }
    case 'napkin': outline([[-.4,0],[.4,0],[0,.65]],.25,[0,0,-.125],P.white);for(let i=0;i<3;i++)rod([-.3+i*.15,.03,.14],[0,.6,.14],.009,accent);break;
    case 'mill': lathe([[0,0],[.25,0],[.2,.15],[.12,.42],[.22,.65],[.22,.7],[0,.7]],[0,0,0],P.wood);ball(.23,[0,.78,0],P.wood);cy(.035,.03,[0,1.02,0],P.steel);break;
    case 'basket': b([.8,.05,.55],[0,.025,0],v===2?accent:P.wood);for(let i=0;i<7;i++){const y=.06+i*.055;for(const z of [-.28,.28])b([.86,.028,.025],[0,y,z],v===2?accent:P.wood);for(const x of [-.43,.43])b([.025,.028,.55],[x,y,0],v===2?accent:P.wood);}for(const x of [-.4,0,.4])for(const z of [-.28,.28])b([.025,.4,.025],[x,.2,z],P.wood);if(v){const h=ring(.33,.025,[0,.47,0],v===2?P.steel:P.wood);h.scale.x=1.25;}break;
    case 'candle': if(v){shell(.3,.6,[0,0,0],accent);cy(.26,.03,[0,.55,0],P.white);rod([0,.56,0],[0,.65,0],.01,P.dark);}else{cy(.3,.07,[0,.035,0],P.gold);cy(.05,.4,[0,.27,0],P.gold);cy(.16,.04,[0,.5,0],P.gold);cy(.09,.4,[0,.72,0],P.white);ball(.035,[0,.97,0],P.gold,[.7,1.7,.7]);}break;
    case 'crown': for(let i=0;i<10;i++){const a=i*Math.PI/5;const o=outline([[-.12,0],[.12,0],[0,.28]],.025,[Math.cos(a)*.4,.1,Math.sin(a)*.4],P.gold);o.rotation.y=Math.PI/2-a;}ring(.4,.035,[0,.12,0],P.gold,[Math.PI/2,0,0]);break;
    case 'figurine': cy(.25,.04,[0,.02,0],P.wood);cy(.23,.5,[0,.3,0],v?P.bread:P.blue,.13);ball(.13,[0,.68,0],P.white);for(const x of [-.19,.19])rod([x*.65,.5,0],[x,.25,.06],.045,v?P.wood:P.blue);if(v)rod([.3,0,0],[.3,.75,0],.015,P.wood);break;
    case 'bell': lathe([[0,.7],[.08,.7],[.2,.6],[.25,.2],[.4,0],[.36,0],[.2,.2],[.15,.56],[0,.6]],[0,0,0],P.gold);handle([0,.79,0],.08,P.gold);ball(.075,[0,.03,0],P.dark);break;
    case 'flower': cy(.2,.28,[0,.14,0],P.wood,.24);rod([0,.27,0],[0,1,0],.02,P.green);for(const x of [-1,1])leaf([x*.1,.6,0],[.05,.2,.025],x*.6);if(v===0){for(let i=0;i<5;i++){rod([0,.6+i*.08,0],[.1,.64+i*.08,0],.009,P.green);ball(.04,[.12,.62+i*.08,0],P.white);}}else if(v===4){for(let i=0;i<7;i++){const x=(i-3)*.05;rod([0,.3,0],[x,.9,0],.009,P.green);for(let j=0;j<4;j++)ball(.03,[x,.8+j*.05,0],'#8b77ac');}}else flower([0,1,0],v===1?P.gold:v===2?P.red:P.pink);break;
    case 'lantern2': ball(.4,[0,.5,0],P.red,[1,1.1,1]);for(let i=0;i<6;i++)ring(.4*Math.sin((i+1)*Math.PI/7),.012,[0,.12+i*.15,0],P.gold,[Math.PI/2,0,0]);handle([0,1,0],.14,P.dark);break;
    case 'flag': cy(.22,.04,[0,.02,0],P.dark);rod([0,0,0],[0,1.5,0]);for(let i=0;i<3;i++)b([.18,.4,.015],[.12+i*.18,1.23,0],[P.blue,P.white,P.red][i]);break;
    case 'bunting': rod([-.9,.3,0],[.9,.3,0],.006,P.dark);for(let i=0;i<9;i++)outline([[-.09,0],[.09,0],[0,-.22]],.012,[-.8+i*.2,.3,0],[P.blue,P.white,P.red][i%3]);break;
    case 'sportsball': ball(.5,[0,.5,0],v===0?P.steel:v===1?P.wood:v===2?P.white:v===3?'#bb6b30':v===5?'#b8c45c':P.bread,v===4?[1.6,1,1]:[1,1,1]);if(v===2){for(let i=0;i<10;i++){const a=i*2.4;ball(.1,[Math.cos(a)*.4,.3+(i%3)*.2,Math.sin(a)*.4],P.dark);}}else if(v!==1){for(let i=0;i<3;i++)ring(.501,.009,[0,.5,0],v===5?P.white:P.dark,[i*Math.PI/3,0,0]);}break;
    case 'accordion': b([.22,.75,.4],[-.4,.4,0],P.red);b([.22,.75,.4],[.4,.4,0],P.red);for(let i=0;i<9;i++)b([.035,.68,.35],[-.27+i*.067,.4,0],i%2?P.dark:P.wood);for(let i=0;i<10;i++)b([.15,.053,.02],[-.4,.09+i*.067,.215],P.white);buttons(5,[.4,.17,.22],0);break;
    case 'hat': if(v){cy(.38,.9,[0,.45,0],accent,0);ring(.38,.025,[0,.02,0],P.gold,[Math.PI/2,0,0]);ball(.06,[0,.94,0],P.gold);}else {ball(.45,[0,.09,0],'#333d55',[1,.3,1]);cy(.3,.05,[0,0,0],P.dark);rod([0,.2,0],[.02,.27,0],.02,P.dark);}break;
    case 'conifer': cy(.08,.5,[0,.25,0],P.wood);for(let i=0;i<4;i++){const y=.5+i*.3;cy(.55-i*.105,.65,[0,y,0],P.green,0);}if(v){for(let i=0;i<16;i++){const a=i*2.4,y=.3+i*.075,r=.54-y*.28;ball(.045,[Math.cos(a)*r,y,Math.sin(a)*r],i%2?P.red:P.gold);}mesh(new T.OctahedronGeometry(.12),[0,1.76,0],P.gold);}break;
    case 'ornament': ball(.4,[0,.43,0],P.red);cy(.09,.09,[0,.87,0],P.gold);handle([0,.99,0],.075,P.gold);break;
    case 'wreath': ring(.4,.09,[0,.5,0],P.green);for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(.035,[Math.cos(a)*.4,.5+Math.sin(a)*.4,.095],P.red);}b([.3,.1,.06],[0,.14,.11],P.gold);break;
    case 'mask': for(const x of [-.22,.22]){const o=ring(.17,.065,[x,.15,0],accent);o.scale.y=.65;}b([.12,.06,.04],[0,.16,0],P.gold);for(const x of [-.4,.4])leaf([x,.34,0],[.07,.25,.02],x*1.5);break;
    case 'stall': {
      if (v === 0) {
        // Kiosque à journaux parisien (style Davioud en fonte vert sombre et dôme zinc)
        const kioskGreen = '#1e382b';
        cy(1.0, 0.90, [0, 0.45, 0], kioskGreen, 0.96, [0, 0, 0], 8);
        b([1.6, 0.08, 1.1], [0, 0.92, 0], '#182f24');
        for (const sx of [-0.65, 0.65]) {
          rod([sx, 0.92, 0.42], [sx, 1.85, 0.42], 0.035, kioskGreen);
          rod([sx, 0.92, -0.42], [sx, 1.85, -0.42], 0.035, kioskGreen);
        }
        for (let i = 0; i < 5; i++) {
          b([0.24, 0.04, 0.34], [-0.48 + i * 0.24, 0.96, 0.12], i % 2 ? P.white : '#fef08a');
          b([0.22, 0.32, 0.01], [-0.44 + i * 0.22, 1.35, -0.40], [P.red, P.blue, P.gold, P.green, P.pink][i]);
        }
        cy(1.18, 0.14, [0, 1.92, 0], kioskGreen, 1.15, [0, 0, 0], 8);
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          ball(0.04, [Math.cos(a) * 1.16, 1.92, Math.sin(a) * 1.16], P.gold);
        }
        cy(1.15, 0.38, [0, 2.18, 0], '#475569', 0.42, [0, 0, 0], 8);
        ball(0.48, [0, 2.38, 0], '#475569', [1, 0.6, 1]);
        cy(0.08, 0.24, [0, 2.68, 0], kioskGreen);
        ball(0.06, [0, 2.82, 0], P.gold);
      } else {
        // Étal de primeurs / marché avec auvent rayé et cageots inclinés
        legs(1.4, 0.8, 0.85);
        b([1.6, 0.08, 0.95], [0, 0.82, 0], P.wood);
        for (const x of [-0.72, 0.72]) {
          for (const z of [-0.42, 0.42]) rod([x, 0.85, z], [x, 1.85, z], 0.022, P.steel);
        }
        b([1.65, 0.06, 1.1], [0, 1.88, 0], accent, [-0.12, 0, 0]);
        for (let i = 0; i < 9; i++) {
          b([0.16, 0.04, 1.12], [-0.64 + i * 0.16, 1.90, 0], i % 2 ? P.white : accent, [-0.12, 0, 0]);
        }
        for (let c = 0; c < 3; c++) {
          const cx = -0.48 + c * 0.48;
          b([0.42, 0.14, 0.38], [cx, 0.94, 0], P.wood, [0.25, 0, 0]);
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
              ball(0.045, [cx - 0.12 + i * 0.08, 0.98 + j * 0.03, -0.08 + j * 0.08], [P.red, '#eab308', P.green][c]);
            }
          }
        }
      }
      break;
    }
    case 'facade': for(const x of [-.9,.9])b([.12,2,.2],[x,1,0],accent);b([1.9,.35,.22],[0,1.82,0],accent);b([.9,1.2,.035],[-.35,.85,0],P.glass);b([.5,1.55,.08],[.58,.78,0],P.wood);b([.36,.9,.025],[.58,1,.06],P.glass);b([1.1,.08,.3],[-.3,.28,0]);for(let i=0;i<5;i++){if(v)book([-.7+i*.19,.51,.08],[.12,.38,.13],i%2?P.red:P.gold);else bread([-.6+i*.22,.4,.12],[.18,.15,.2]);}break;
    case 'shelter': {
      // Abribus parisien moderne JCDecaux (vitrage trempé, toit courbé, banc chêne et totem plan)
      for (const x of [-0.85, 0.85]) rod([x, 0, -0.38], [x, 2.05, -0.38], 0.035, P.dark);
      b([1.90, 0.06, 1.05], [0, 2.05, 0.08], P.dark, [0.08, 0, 0]);
      b([1.84, 0.015, 0.98], [0, 2.07, 0.08], P.glass, [0.08, 0, 0]);
      b([1.65, 1.55, 0.018], [0, 1.15, -0.38], P.glass);
      b([0.018, 1.55, 0.85], [0.85, 1.15, 0.04], P.glass);
      b([1.65, 0.04, 0.022], [0, 1.15, -0.38], P.white);
      for (let i = 0; i < 3; i++) {
        b([1.35, 0.03, 0.09], [0, 0.48, -0.22 + i * 0.11], P.wood);
      }
      for (const bx of [-0.55, 0.55]) {
        rod([bx, 0, -0.12], [bx, 0.47, -0.12], 0.025, P.dark);
      }
      b([0.48, 1.85, 0.14], [-0.85, 1.0, 0.35], P.dark);
      b([0.42, 1.35, 0.015], [-0.85, 1.1, 0.425], P.white);
      b([0.40, 0.14, 0.018], [-0.85, 1.68, 0.427], P.blue);
      ball(0.04, [-0.85, 1.68, 0.435], P.green);
      break;
    }
    case 'seat': case 'rocking': case 'lounger': {
      if (asset.recipe === 'seat' && v === 0) {
        // Detailed iconic tubular school chair (Chaise scolaire / Mullca design)
        const tubeColor = color || '#384d42';
        const seatWood = '#b8834e';
        const rT = 0.013;
        for (const sx of [-1, 1]) {
          // Front tubular leg (splayed forward)
          rod([sx * 0.18, 0.42, 0.15], [sx * 0.21, 0.015, 0.20], rT, tubeColor);
          // Back tubular leg (splayed backward)
          rod([sx * 0.17, 0.42, -0.15], [sx * 0.20, 0.015, -0.21], rT, tubeColor);
          // Upright backrest support tubes
          rod([sx * 0.17, 0.42, -0.15], [sx * 0.15, 0.76, -0.19], rT, tubeColor);
          // Black rubber protective floor glides
          cy(0.016, 0.022, [sx * 0.21, 0.011, 0.20], P.dark);
          cy(0.016, 0.022, [sx * 0.20, 0.011, -0.21], P.dark);
        }
        // Under-seat tubular perimeter frame
        rod([-0.18, 0.42, 0.15], [0.18, 0.42, 0.15], rT, tubeColor);
        rod([-0.17, 0.42, -0.15], [0.17, 0.42, -0.15], rT, tubeColor);
        rod([-0.18, 0.42, 0.15], [-0.17, 0.42, -0.15], rT, tubeColor);
        rod([0.18, 0.42, 0.15], [0.17, 0.42, -0.15], rT, tubeColor);
        // Stretcher / reinforcement crossbar at the bottom
        rod([-0.195, 0.12, -0.20], [0.195, 0.12, -0.20], 0.01, tubeColor);

        // Beech plywood ergonomic seat with waterfall front edge
        b([0.42, 0.018, 0.38], [0, 0.442, -0.01], seatWood, [0.03, 0, 0]);
        cy(0.015, 0.40, [0, 0.435, 0.178], seatWood, 0.015, [0, 0, Math.PI / 2]);
        // 4 visible flush steel mounting rivets on seat
        for (const rx of [-0.14, 0.14]) {
          for (const rz of [-0.09, 0.09]) {
            ball(0.007, [rx, 0.453, rz], P.steel, [1, 0.3, 1]);
          }
        }

        // Curved beech plywood backrest with 4 steel mounting rivets
        b([0.40, 0.16, 0.016], [0, 0.70, -0.19], seatWood, [-0.12, 0, 0]);
        for (const rx of [-0.15, 0.15]) {
          for (const ry of [0.65, 0.74]) {
            ball(0.006, [rx, ry, -0.182], P.steel, [1, 1, 0.3]);
          }
        }
        break;
      }
      const lounge=asset.recipe==='lounger',rock=asset.recipe==='rocking';
      const h=v===1||v===4?.8:.45;legs(.5,lounge?1.1:.45,h);
      b([.65,.1,lounge?1.35:.6],[0,h,0],accent);
      if(v!==1&&v!==4){b([.65,.65,.08],[0,h+.34,lounge?-.48:-.28],v===3?P.wood:accent,[-.15,0,0]);}
      if(v===2||rock)for(const x of [-.36,.36]){b([.07,.06,.6],[x,h+.24,0]);rod([x,h, .2],[x,h+.24,.2]);}
      if(rock)for(const x of [-.34,.34]){const curve=new T.CatmullRomCurve3([new T.Vector3(x,.18,-.55),new T.Vector3(x,.02,0),new T.Vector3(x,.18,.55)]);mesh(new T.TubeGeometry(curve,12,.03,6,false),[0,0,0],P.wood);}break;
    }
    case 'mailbox': {
      // Authentic French La Poste street mailbox (Modèle Deauville / B118)
      cy(0.18, 0.04, [0, 0.02, 0], P.dark);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ball(0.014, [Math.cos(a) * 0.13, 0.042, Math.sin(a) * 0.13], P.steel);
      }
      cy(0.065, 0.70, [0, 0.38, 0], P.dark, 0.06);
      cy(0.09, 0.03, [0, 0.72, 0], P.dark);

      // Main mailbox housing with curved rain canopy
      b([0.48, 0.52, 0.36], [0, 1.00, 0], '#eab308');
      b([0.50, 0.06, 0.38], [0, 1.27, 0], '#eab308');
      ball(0.25, [0, 1.28, 0], '#eab308', [0.98, 0.16, 0.74]);

      // Double mail slots (Département / Autres Départements & Étranger)
      for (const [sx, labelColor] of [[-0.11, P.blue], [0.11, P.blue]] as [number, string][]) {
        b([0.16, 0.022, 0.015], [sx, 1.14, 0.182], P.dark);
        b([0.17, 0.024, 0.035], [sx, 1.155, 0.19], P.steel, [0.4, 0, 0]);
        b([0.15, 0.020, 0.005], [sx, 1.18, 0.182], labelColor);
      }
      ball(0.016, [0, 1.05, 0.183], P.steel, [1, 1, 0.5]);

      // Collection hours schedule holder (Cadre des heures de levée)
      b([0.28, 0.22, 0.012], [0, 0.88, 0.182], P.steel);
      b([0.26, 0.20, 0.005], [0, 0.88, 0.189], P.white);
      b([0.26, 0.045, 0.006], [0, 0.96, 0.191], P.blue);
      ball(0.012, [0, 0.96, 0.194], P.gold);
      for (let i = 0; i < 3; i++) {
        b([0.20, 0.012, 0.005], [0, 0.91 - i * 0.04, 0.192], P.dark);
      }
      break;
    }
    case 'bollard': cy(.1,.85,[0,.425,0],P.dark);ball(.1,[0,.85,0],P.steel);cy(.16,.05,[0,.025,0],P.dark);break;
    case 'streetlamp': {
      // Parisian Haussmann fluted cast-iron lamp post
      cy(0.24, 0.14, [0, 0.07, 0], P.dark, 0.22, [0, 0, 0], 6);
      cy(0.18, 0.40, [0, 0.32, 0], P.dark, 0.13, [0, 0, 0], 6);
      ring(0.14, 0.022, [0, 0.52, 0], P.dark, [Math.PI / 2, 0, 0]);

      cy(0.08, 1.8, [0, 1.42, 0], P.dark, 0.055, [0, 0, 0], 12);
      ring(0.075, 0.016, [0, 1.10, 0], P.dark, [Math.PI / 2, 0, 0]);
      ring(0.065, 0.016, [0, 1.95, 0], P.dark, [Math.PI / 2, 0, 0]);
      cy(0.09, 0.06, [0, 2.34, 0], P.dark, 0.07);

      rod([0, 2.35, 0], [0.18, 2.52, 0], 0.024, P.dark);
      rod([0.18, 2.52, 0], [0.36, 2.48, 0], 0.022, P.dark);
      ring(0.065, 0.012, [0.16, 2.38, 0], P.dark);

      cy(0.05, 0.04, [0.36, 2.47, 0], P.dark);
      cy(0.16, 0.32, [0.36, 2.26, 0], P.dark, 0.11, [0, 0, 0], 6);
      cy(0.155, 0.30, [0.36, 2.26, 0], P.glass, 0.105, [0, 0, 0], 6);
      ball(0.04, [0.36, 2.26, 0], '#ffe89c', [1, 1.5, 1]);
      cy(0.02, 0.04, [0.36, 2.14, 0], P.gold);
      cy(0.14, 0.12, [0.36, 2.47, 0], '#2c3e35', 0.01, [0, 0, 0], 6);
      ball(0.02, [0.36, 2.54, 0], P.gold);
      break;
    }
    case 'traffic': rod([0,0,0],[0,1.5,0],.035);b([.28,.7,.2],[0,1.3,0],P.dark);for(let i=0;i<3;i++)cy(.085,.025,[0,1.52-i*.22,.12],[P.red,P.gold,P.green][i],.085,[Math.PI/2,0,0]);break;
    case 'sign': cy(.22,.04,[0,.02,0]);rod([0,0,0],[0,1.3,0],.025);if(v===1){for(let i=0;i<3;i++)outline([[-.5,-.1],[.3,-.1],[.45,0],[.3,.1],[-.5,.1]],.035,[i%2?.1:0,1.25-i*.23,0],i%2?P.white:accent);}else{b([.65,v===2?.45:.65,.05],[0,1.3,0],v===2?P.dark:P.blue);for(let i=0;i<3;i++)b([.4-i*.07,.025,.01],[-.03,1.4-i*.1,.033],P.white);}break;
    case 'terminal': b([.55,1.25,.45],[0,.625,0],accent);screen(.37,.3,[0,.98,.24]);b([.3,.025,.02],[0,.58,.24],P.dark);buttons(3,[-.1,.72,.25],.1);if(v===1)b([.4,.12,.12],[0,.48,.27],P.steel);if(v===2)b([.2,.1,.02],[0,.35,.24],P.gold);break;
    case 'booth': for(const x of [-.5,.5])for(const z of [-.5,.5])b([.06,1.8,.06],[x,.9,z],accent);b([1.1,.08,1.1],[0,1.84,0],accent);b([1,.04,1],[0,.02,0],P.dark);for(const x of [-.5,.5])b([.018,1.7,1],[x,.9,0],v===1?P.white:P.glass);b([1,1.7,.025],[0,.9,-.5],v===1?P.white:P.glass);if(v===1)for(let i=0;i<12;i++)cy(.045,1.6,[-.47+i*.085,.95,.49],accent);else if(v===0){b([.3,.45,.12],[0,1,-.4],P.dark);screen(.23,.16,[0,1.1,-.32]);}else b([.7,.04,.35],[0,.72,-.25]);break;
    case 'fountain2': cy(.2,.75,[0,.38,0],P.steel);shell(.32,.14,[0,.76,0],P.steel);rod([.15,.82,0],[.15,1.03,0],.025);rod([.15,1.03,0],[.04,1.03,0],.025);break;
    case 'fence': case 'hurdle': for(const x of [-.65,.65]){b([.05,.9,.05],[x,.45,0],P.steel);b([.25,.05,.4],[x,.025,0],P.dark);}for(const y of asset.recipe==='hurdle'?[.9]:[.3,.85])b([1.4,.07,.05],[0,y,0],v===1?P.red:P.wood);if(asset.recipe==='fence')for(let i=0;i<9;i++)b([.04,.55,.04],[-.6+i*.15,.575,0],v===1?P.white:P.steel);break;
    case 'table2': {
      if (v === 0) {
        // Guéridon de bistrot parisien: round marble top with brass rim and cast-iron claw tripod
        cy(0.38, 0.024, [0, 0.74, 0], P.white, 0.38);
        ring(0.38, 0.014, [0, 0.74, 0], P.gold, [Math.PI / 2, 0, 0]);
        cy(0.14, 0.016, [0, 0.725, 0], P.dark);
        cy(0.038, 0.58, [0, 0.43, 0], P.dark, 0.032);
        ring(0.052, 0.016, [0, 0.22, 0], P.dark, [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI * 2 / 3;
          rod([0, 0.18, 0], [Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26], 0.024, P.dark);
          ball(0.028, [Math.cos(a) * 0.26, 0.025, Math.sin(a) * 0.26], P.dark);
          ring(0.032, 0.008, [Math.cos(a) * 0.15, 0.10, Math.sin(a) * 0.15], P.dark, [0, -a, 0]);
        }
      } else if (v === 2) {
        cy(.7, .06, [0, .75, 0], P.wood, .7, [0, 0, 0], 6);
        legs(.8, .6, .72);
      } else if (v === 5) {
        b([1.6, .07, .45], [0, .75, -.6]);
        for (const x of [-.58, .58]) {
          b([.45, .07, 1.6], [x, .75, 0]);
          for (const z of [-.55, .55]) b([.06, .72, .06], [x, .36, z], P.dark);
        }
      } else {
        b([1, .06, .65], [0, .8, 0]);
        legs(.85, .5, .77);
        if (v === 3) b([.28, .45, .55], [.3, .52, 0], P.white);
        if (v === 1) b([.8, .05, .5], [0, .61, 0]);
        if (v === 4) rod([-.4, .2, 0], [.4, .2, 0]);
      }
      break;
    }
    case 'luggage': b([.7,.9,.4],[0,.52,0],accent);for(let i=0;i<5;i++)b([.025,.7,.02],[-.25+i*.125,.53,.21],P.dark);for(const x of [-.24,.24]){cy(.065,.08,[x,.065,0],P.dark,.065,[0,0,Math.PI/2]);rod([x,1,0],[x,1.3,0],.02);}rod([-.24,1.3,0],[.24,1.3,0],.04,P.dark);break;
    case 'wallet': b([.8,.5,.12],[0,.25,0],P.wood);b([.2,.12,.025],[.27,.25,.075],P.dark);ball(.025,[.28,.25,.095],P.gold);break;
    case 'keys': ring(.18,.018,[0,.7,0],P.steel);for(let i=0;i<3;i++){const x=(i-1)*.14;ring(.06,.02,[x,.55,0],i%2?P.gold:P.steel);b([.045,.34,.025],[x,.32,0],P.steel);for(let j=0;j<2;j++)b([.09,.035,.025],[x+.025,.16+j*.08,0],P.steel);}break;
    case 'umbrella': mesh(new T.SphereGeometry(.6,24,8,0,Math.PI*2,0,Math.PI*.42),[0,.7,0],accent);rod([0,.1,0],[0,1.32,0],.015);ring(.09,.02,[.09,.1,0],P.wood,[0,0,Math.PI],Math.PI);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([0,1.3,0],[Math.cos(a)*.58,.85,Math.sin(a)*.58],.009,P.steel);}break;
    case 'glasses': for(const x of [-.23,.23]){const o=ring(.19,.02,[x,.2,0],v?accent:P.dark);o.scale.y=v?.8:.65;rod([x+Math.sign(x)*.18,.22,0],[x+Math.sign(x)*.18,.22,-.55],.018,P.dark);}rod([-.05,.22,0],[.05,.22,0],.018,P.dark);break;
    case 'watch': b([.3,.04,1.1],[0,.02,0],P.wood);cy(.25,.08,[0,.08,0],P.steel);cy(.22,.012,[0,.129,0],P.white);rod([0,.14,0],[.1,.14,.07],.007,P.dark);rod([0,.14,0],[-.04,.14,-.16],.006,P.dark);break;
    case 'clock2': cy(.4,.12,[0,.5,0],v?P.wood:accent,.4,[Math.PI/2,0,0]);cy(.36,.01,[0,.5,.065],P.white,.36,[Math.PI/2,0,0]);for(let i=0;i<12;i++){const a=i*Math.PI/6;b([.018,.04,.01],[Math.sin(a)*.3,.5+Math.cos(a)*.3,.078],P.dark,[0,0,-a]);}rod([0,.5,.09],[.05,.73,.09],.012,P.dark);rod([0,.5,.09],[.18,.47,.09],.012,P.dark);if(!v)for(const x of [-.25,.25]){ball(.14,[x,.9,0],P.steel,[1,.5,1]);rod([x,.05,0],[x,.25,0],.03);}break;
    case 'device': b([.5,.9,v?.2:.05],[0,.45,0],P.dark);screen(.42,v?.38:.75,[0,v?.62:.46,v?.11:.035]);if(v)for(let j=0;j<3;j++)buttons(3,[-.12,.15+j*.1,.12],.12);break;
    case 'camera': b([.7,.42,.23],[0,.25,0],P.dark);cy(v?.12:.2,.25,[0,.26,.23],P.dark,v?.12:.2,[Math.PI/2,0,0]);cy(v?.08:.16,.012,[0,.26,.36],P.blue,v?.08:.16,[Math.PI/2,0,0]);if(!v){b([.23,.1,.18],[0,.49,0]);ball(.035,[.24,.49,0],P.red);}else b([.3,.08,.35],[0,0,0]);break;
    case 'headphones': ring(.35,.045,[0,.45,0],P.dark,[0,0,0],Math.PI);for(const x of [-.35,.35])b([.14,.3,.25],[x,.4,0],accent);break;
    case 'brush': rod([0,0,0],[0,.65,0],.025,P.wood);b([v?.14:.08,.26,.045],[0,.78,0],v?P.gold:accent);for(let i=0;i<8;i++)rod([-.05+i*.014,.81,.02],[-.05+i*.014,v?1:.81,v?.02:.12],.005,P.white);break;
    case 'tube': cy(.18,.7,[0,.4,0],P.white,.11);b([.26,.05,.07],[0,.78,0],accent);cy(.11,.12,[0,.06,0],accent);b([.22,.3,.02],[0,.4,.18],accent);break;
    case 'soap': b([1,.1,.65],[0,.05,0],P.white);ball(.4,[0,.16,0],P.pink,[1,.25,.6]);break;
    case 'comb': b([.12,1,.04],[0,.5,0],P.wood);for(let i=0;i<18;i++)b([.2,.022,.025],[.14,.08+i*.048,0],P.wood);break;
    case 'hairdryer': cy(.16,.5,[0,.65,0],accent,.2,[0,0,Math.PI/2]);cy(.13,.18,[.34,.65,0],P.dark,.08,[0,0,Math.PI/2]);b([.12,.5,.14],[-.15,.3,0],P.dark,[0,0,-.25]);break;
    case 'shoes': for(const x of [-.23,.23]){ball(.3,[x,.1,0],accent,[.65,.4,1.4]);ball(.19,[x,.18,-.19],P.dark,[.85,.3,1]);}break;
    case 'coatstand': cy(.3,.06,[0,.03,0],P.dark);rod([0,.06,0],[0,1.5,0],.035,P.wood);for(let i=0;i<6;i++){const a=i*Math.PI/3;rod([0,1.1,0],[Math.cos(a)*.3,1.4,Math.sin(a)*.3],.025,P.wood);ball(.045,[Math.cos(a)*.3,1.4,Math.sin(a)*.3],P.wood);}break;
    case 'locker': b([.6,1.5,.5],[0,.75,0],accent);b([.54,1.4,.025],[0,.75,.265],P.white);for(let j=0;j<3;j++)b([.25,.025,.015],[0,1.3-j*.06,.285],P.dark);b([.04,.16,.035],[.2,.75,.29],P.steel);break;
    case 'bookcase': case 'shelves': for(const x of [-.5,.5])b([.05,1.2,.4],[x,.6,0]);for(let j=0;j<4;j++){b([1,.05,.4],[0,j*.38,0]);if(asset.recipe==='bookcase')for(let i=0;i<5;i++)book([-.4+i*.17,j*.38+.16,0],[.12,.27,.23],[P.red,P.blue,P.gold][i%3]);}break;
    case 'easel': for(const x of [-.3,.3])rod([x,0,.2],[x*.5,1.25,0],.025,P.wood);rod([0,1,0],[0,0,-.4],.025,P.wood);b([.8,.6,.045],[0,.9,.025],v===1?P.dark:P.white);b([.85,.045,.12],[0,.58,.06]);if(v===2){ball(.13,[.16,.95,.055],P.gold,[1,1,.1]);b([.6,.1,.008],[0,.7,.055],P.green);}break;
    case 'notebook': if(v===2){b([.7,.08,.7],[0,.04,0],P.gold);}else{for(const x of [-.25,.25])book([x,.03,0],[.48,v===3?.15:.06,.7],v===3?P.wood:accent);if(v===1)for(const z of [-.23,0,.23])ring(.07,.008,[0,.06,z],P.steel);else for(let i=0;i<7;i++)for(const x of [-.25,.25])b([.34,.005,.008],[x,.075,-.24+i*.075],P.wood);if(v===3){for(const x of [-.47,.47])b([.035,.18,.1],[x,.03,0],P.gold);}}break;
    case 'pencilpot': shell(.25,.45,[0,0,0],accent);for(let i=0;i<7;i++){const a=i*2.4;cy(.025,.65,[Math.cos(a)*.13,.48,Math.sin(a)*.13],[P.red,P.gold,P.blue][i%3]);cy(.025,.06,[Math.cos(a)*.13,.84,Math.sin(a)*.13],P.wood,0);}break;
    case 'pencil': cy(.04,.8,[0,.4,0],v?P.dark:P.gold,.04,[0,0,0],v?16:6);cy(.04,.12,[0,.86,0],v?P.gold:P.wood,0);if(v)b([.015,.25,.025],[.04,.2,0],P.gold);else cy(.041,.08,[0,.04,0],P.pink);break;
    case 'eraser': b([1,.3,.45],[0,.15,0],P.white);b([.55,.32,.47],[0,.15,0],P.blue);break;
    case 'sharpener': b([.6,.35,.5],[0,.18,0],P.steel);b([.3,.025,.13],[0,.37,0],P.dark);cy(.1,.02,[0,.18,.26],P.dark,.1,[Math.PI/2,0,0]);ball(.035,[.06,.39,0],P.steel);break;
    case 'scissors': for(const x of [-.12,.12]){ring(.1,.025,[x,.18,0],accent);rod([x,.27,0],[-x,.85,0],.022,P.steel);}ball(.04,[0,.48,.015],P.gold);break;
    case 'triangle': rod([0,0,0],[.7,0,0],.025,accent);rod([.7,0,0],[0,.7,0],.025,accent);rod([0,.7,0],[0,0,0],.025,accent);break;
    case 'protractor': ring(.5,.035,[0,0,0],accent,[0,0,0],Math.PI);rod([-.5,0,0],[.5,0,0],.025,accent);for(let i=0;i<=18;i++){const a=i*Math.PI/18;rod([Math.cos(a)*.43,Math.sin(a)*.43,0],[Math.cos(a)*.49,Math.sin(a)*.49,0],.005,P.dark);}break;
    case 'abacus': for(const x of [-.5,.5])b([.06,.9,.15],[x,.45,0]);for(const y of [0,.9])b([1,.06,.15],[0,y,0]);for(let j=0;j<5;j++){const y=.15+j*.15;rod([-.47,y,0],[.47,y,0],.012);for(let i=0;i<8;i++)ball(.05,[-.4+i*.105,y,0],[P.red,P.gold,P.blue,P.green][j%4]);}break;
    case 'solid': if(v<2)b(v?[1,.5,.4]:[.6,.6,.6],[0,.3,0],accent);else if(v===2)ball(.4,[0,.4,0]);else if(v===3||v===4||v===5)cy(.4,.7,[0,.35,0],accent,v===4?.4:0,[0,0,0],v===5?4:24);else if(v===6)mesh(new T.TetrahedronGeometry(.5),[0,.5,0],accent);else if(v===7)mesh(new T.OctahedronGeometry(.5),[0,.5,0],accent);else if(v===8)mesh(new T.DodecahedronGeometry(.5),[0,.5,0],accent);else if(v===9)mesh(new T.IcosahedronGeometry(.5),[0,.5,0],accent);else if(v===10)ring(.35,.12,[0,.12,0],accent,[Math.PI/2,0,0]);else outline([[-.4,0],[.4,0],[0,.65]],.65,[0,0,-.325],v===12?P.glass:accent);break;
    case 'fractions': for(let i=0;i<v;i++){const a=i*Math.PI*2/v;const o=mesh(new T.CylinderGeometry(.45,.45,.06,24,1,false,a+.035,Math.PI*2/v-.07),[Math.sin(a+Math.PI/v)*.025,.03,Math.cos(a+Math.PI/v)*.025],[P.red,P.blue,P.gold,P.green,P.pink,accent][i%6]);o.name=`fraction-1-${v}`;}break;
    case 'numberbars': for(let i=0;i<5;i++)for(let j=0;j<=i;j++)b([.12,.12,.12],v?[i*.135,j*.135,0]:[j*.135,.06,i*.135],[P.red,P.blue,P.gold,P.green,accent][i]);break;
    case 'axes': for(let i=0;i<3;i++){const end:V=[0,0,0];end[i]=.8;rod([0,0,0],end,.015,[P.red,P.green,P.blue][i]);const cone=cy(.05,.15,end,[P.red,P.green,P.blue][i],0);if(i===0)cone.rotation.z=-Math.PI/2;if(i===2)cone.rotation.x=Math.PI/2;}break;
    case 'compass': for(const x of [-.3,.3]){rod([0,.9,0],[x,.03,0],.025);cy(.025,.1,[x,.03,0],P.dark,0);}ball(.07,[0,.9,0],P.gold);rod([0,.9,0],[0,1.05,0],.035,P.dark);break;
    case 'tangram': {const pieces=[[[0,0],[.5,0],[0,.5]],[[.52,0],[1,0],[1,.5]],[[0,.52],[.25,.27],[.5,.52]],[[.52,.52],[.76,.28],[1,.52]],[[0,.55],[.22,.77],[0,1]],[[.26,.77],[.48,.55],[.7,.77],[.48,.99]],[[.74,.55],[1,.55],[1,.99],[.74,.99]]];pieces.forEach((pts,i)=>{const o=outline(pts as [number,number][],.04,[-.5,.04,-.5],[P.red,P.blue,P.gold,P.green,P.pink,accent,P.wood][i]);o.rotation.x=-Math.PI/2;});break;}
    case 'vessel': if(v===0||v===1||v===4){shell(v===0?.3:.12,v===1?1:.65,[0,0,0],P.glass);if(v===1)cy(.25,.04,[0,.02,0],P.glass);}else lathe([[0,0],[v===2?.4:.15,0],[.4,v===2?.05:.3],[.16,.65],[.13,.85],[.1,.85],[.12,.62],[.34,.3],[.1,.06],[0,.06]],[0,0,0],P.glass);for(let i=0;i<6;i++)b([i%2?.06:.1,.009,.006],[0,.12+i*.08,v===0?.302:v===1||v===4?.122:.3],P.dark);break;
    case 'testrack': for(const y of [.06,.35])b([1,.04,.4],[0,y,0]);for(const x of [-.45,.45])b([.04,.38,.35],[x,.2,0]);for(let i=0;i<5;i++)shell(.06,.5,[-.35+i*.175,.1,0],P.glass);break;
    case 'pipette': cy(.025,.8,[0,.4,0],P.glass,.035);ball(.07,[0,.87,0],P.red,[1,1.7,1]);break;
    case 'funnel': lathe([[.06,0],[.06,.45],[.4,.85],[.38,.85],[.035,.45],[.035,0]],[0,0,0],P.glass);break;
    case 'burner': cy(.3,.06,[0,.03,0],P.dark);cy(.08,.6,[0,.36,0]);cy(.1,.12,[0,.24,0],P.gold);rod([0,.18,0],[.3,.18,0],.035);break;
    case 'labstand': b([.7,.05,.5],[0,.025,0],P.dark);rod([-.2,.05,0],[-.2,1,0]);rod([-.2,.65,0],[.28,.65,0]);ring(.13,.015,[.3,.65,0],P.steel,[Math.PI/2,0,0]);break;
    case 'atom': ball(.13,[0,.5,0],P.red);for(let i=0;i<3;i++){ring(.4,.012,[0,.5,0],P.steel,[i*Math.PI/3,Math.PI/4,0]);ball(.045,[Math.cos(i*2.1)*.4,.5+Math.sin(i*2.1)*.4,0],P.blue);}break;
    case 'dna': for(let i=0;i<16;i++){const a=i*.5,y=i*.07,p:V=[Math.cos(a)*.22,y,Math.sin(a)*.22],q:V=[-p[0],y,-p[2]];ball(.035,p,P.blue);ball(.035,q,P.red);rod(p,q,.012,i%2?P.gold:P.green);if(i){const z=a-.5;rod([Math.cos(z)*.22,y-.07,Math.sin(z)*.22],p,.02,P.blue);rod([-Math.cos(z)*.22,y-.07,-Math.sin(z)*.22],q,.02,P.red);}}break;
    case 'magnet': ring(.3,.07,[0,.4,0],P.red,[0,0,0],Math.PI);for(const x of [-.3,.3]){b([.14,.35,.14],[x,.23,0],P.red);b([.14,.1,.14],[x,.03,0],P.steel);}break;
    case 'circuit': b([1,.04,.6],[0,.02,0],P.wood);cy(.07,.3,[-.28,.13,0],P.dark,.07,[Math.PI/2,0,0]);cy(.1,.08,[.27,.09,0]);ball(.1,[.27,.22,0],P.gold);for(const z of [-.22,.22]){rod([-.28,.08,z],[.27,.08,z],.015,z<0?P.red:P.dark);rod([.27,.08,z],[.27,.12,0],.015,P.dark);rod([-.28,.08,z],[-.28,.13,z<0?-.15:.15],.015,P.red);}break;
    case 'pendulum': for(const x of [-.35,.35]){rod([x,0,0],[x,.9,0]);b([.2,.04,.4],[x,0,0]);}rod([-.35,.9,0],[.35,.9,0]);rod([0,.9,0],[.16,.2,0],.005,P.dark);ball(.085,[.16,.2,0],P.gold);break;
    case 'spring': {const pts=[];for(let i=0;i<=160;i++){const a=i*Math.PI/8;pts.push(new T.Vector3(Math.cos(a)*.2,i*.006,Math.sin(a)*.2));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),160,.02,6,false),[0,0,0],P.steel);break;}
    case 'magnifier': ring(.25,.025,[0,.65,0],P.dark);cy(.23,.008,[0,.65,0],P.glass,.23,[Math.PI/2,0,0]);rod([0,.4,0],[0,0,0],.035,P.wood);break;
    case 'telescope': for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([0,.8,0],[Math.cos(a)*.4,0,Math.sin(a)*.4]);}cy(.12,.8,[0,.94,0],P.white,.15,[0,0,.9]);cy(.095,.1,[.35,.65,0],P.dark,.095,[0,0,.9]);break;
    case 'guitar': ball(.27,[0,.3,0],v===1?P.red:P.wood,[1,1,.3]);ball(.2,[0,.62,0],v===1?P.red:P.wood,[1,1,.35]);b([.09,.6,.06],[0,1,0],P.wood);b([.15,.19,.06],[0,1.39,0]);if(v!==1)cy(.08,.01,[0,.55,.077],P.dark,.08,[Math.PI/2,0,0]);for(let i=0;i<(v===3?4:6);i++)rod([-.035+i*.014,.25,.095],[-.035+i*.014,1.45,.04],.002,P.steel);for(let i=0;i<9;i++)b([.095,.008,.008],[0,.75+i*.058,.035],P.steel);if(v===2)rod([.4,0,0],[.4,1.3,0],.009,P.wood);break;
    case 'piano': b([1.4,v?.12:.75,.5],[0,v?.8:.65,0],P.dark);legs(1.2,.35,v?.75:.3);b([1.35,.06,.3],[0,.65,.36],P.white);for(let i=0;i<24;i++){b([.008,.008,.29],[-.64+i*.055,.687,.36],P.dark);if(i%7!==2&&i%7!==6)b([.025,.025,.15],[-.61+i*.055,.704,.3],P.dark);}break;
    case 'drum': cy(v===2?.2:.4,v===2?.8:.35,[0,.4,0],P.wood,v===2?.4:.4);for(const y of v===2?[0,.8]:[.225,.575]){cy(.41,.02,[0,y,0],P.white);ring(.41,.015,[0,y,0],P.steel,[Math.PI/2,0,0]);}for(let i=0;i<10;i++){const a=i*Math.PI/5;rod([Math.cos(a)*.4,.23,Math.sin(a)*.4],[Math.cos(a)*.4,.57,Math.sin(a)*.4],.008,P.steel);}break;
    case 'cymbal': cy(.45,.025,[0,.9,0],P.gold,.12);rod([0,0,0],[0,1,0]);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([0,.2,0],[Math.cos(a)*.3,0,Math.sin(a)*.3]);}break;
    case 'flute': cy(.055,1,[0,.5,0],P.wood,.04);for(let i=0;i<7;i++)ball(.014,[0,.2+i*.09,.056],P.dark,[1,1,.2]);break;
    case 'trumpet': rod([-.5,.25,0],[.35,.25,0],.035,P.gold);cy(.2,.3,[.5,.25,0],P.gold,.04,[0,0,Math.PI/2]);ring(.15,.035,[-.25,.12,0],P.gold);rod([-.25,-.03,0],[.25,-.03,0],.035,P.gold);for(let i=0;i<3;i++){cy(.035,.25,[-.1+i*.1,.22,0],P.gold);cy(.06,.02,[-.1+i*.1,.36,0],P.white);}break;
    case 'microphone': cy(.25,.04,[0,.02,0],P.dark);rod([0,0,0],[0,1.2,0]);rod([0,1.2,0],[.3,1.4,0]);cy(.05,.2,[.35,1.44,0],P.dark,.05,[0,0,-1]);ball(.065,[.44,1.5,0],P.steel);break;
    case 'palette': ball(.5,[0,.03,0],P.wood,[1,.07,.7]);for(let i=0;i<6;i++){const a=i*.7;ball(.065,[Math.cos(a)*.33,.07,Math.sin(a)*.23],[P.red,P.blue,P.gold,P.white,P.green,P.dark][i],[1,.2,1]);}break;
    case 'frame': for(const x of [-.4,.4])b([.045,1,.05],[x,.5,0],P.wood);for(const y of [0,1])b([.84,.045,.05],[0,y,0],P.wood);b([.78,.96,.02],[0,.5,0],P.white);ball(.16,[.1,.7,.02],P.gold,[1,1,.08]);b([.75,.16,.01],[0,.18,.025],P.green);break;
    case 'potterywheel': b([.8,.12,.8],[0,.6,0],accent);legs(.6,.6,.55);cy(.3,.05,[0,.69,0]);shell(.15,.28,[0,.72,0],P.wood);break;
    case 'vase': lathe([[0,0],[.2,0],[.3,.35],[.14,.65],[.2,.85],[.17,.85],[.11,.65],[.25,.35],[.16,.04],[0,.04]],[0,0,0],accent);if(v)for(let i=0;i<5;i++){const x=(i-2)*.17;rod([0,.5,0],[x,1.5-Math.abs(x),0],.01,P.wood);leaf([x,1.25-Math.abs(x),0],[.04,.15,.02],x);}break;
    case 'hanger': rod([-.45,0,0],[0,.25,0],.012,P.wood);rod([0,.25,0],[.45,0,0],.012,P.wood);rod([-.45,0,0],[.45,0,0],.012,P.wood);ring(.07,.008,[0,.33,0],P.steel,[0,0,0],Math.PI*1.5);break;
    case 'spinner': {
      if (v === 1) {
        // Présentoir à lunettes
        cy(.24, .04, [0, .02, 0]);
        rod([0, 0, 0], [0, 1.2, 0]);
        for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2, x = Math.cos(a) * .22, z = Math.sin(a) * .22;
          rod([0, .3 + j * .3, 0], [x, .3 + j * .3, z]);
          ring(.055, .008, [x - .06, .35 + j * .3, z], P.dark);
          ring(.055, .008, [x + .06, .35 + j * .3, z], P.dark);
        }
      } else {
        // Tourniquet rotatif à cartes postales et plans de Paris
        cy(0.28, 0.04, [0, 0.02, 0], P.steel);
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          cy(0.02, 0.02, [Math.cos(a) * 0.22, 0.01, Math.sin(a) * 0.22], P.dark);
        }
        rod([0, 0.04, 0], [0, 1.65, 0], 0.028, P.steel);
        for (let f = 0; f < 4; f++) {
          const a = f * Math.PI / 2;
          const cos = Math.cos(a), sin = Math.sin(a);
          for (let tier = 0; tier < 4; tier++) {
            const y = 0.55 + tier * 0.26;
            const colors = ['#38bdf8', '#fb7185', '#facc15', '#4ade80'];
            b([0.22, 0.16, 0.012], [cos * 0.20, y, sin * 0.20], colors[(f + tier) % 4], [0, -a, 0]);
            rod([cos * 0.21 - sin * 0.12, y - 0.04, sin * 0.21 + cos * 0.12],
                [cos * 0.21 + sin * 0.12, y - 0.04, sin * 0.21 - cos * 0.12], 0.004, P.steel);
          }
        }
        ball(0.035, [0, 1.68, 0], P.gold);
      }
      break;
    }
    case 'register': b([.8,.18,.6],[0,.09,0],P.dark);b([.65,.28,.4],[0,.3,0],P.steel);screen(.42,.22,[0,.53,-.05]);for(let j=0;j<3;j++)buttons(5,[-.2,.45,.07+j*.09],.1);break;
    case 'scanner': b([.14,.5,.14],[0,.25,0],P.dark,[0,0,-.2]);b([.35,.18,.25],[.05,.57,0],accent);b([.28,.09,.012],[.05,.57,.135],P.red);break;
    case 'gift': b([.7,.5,.6],[0,.25,0],v?P.wood:accent);b([.74,.05,.64],[0,.53,0],v?P.white:P.red);b([.1,.56,.65],[0,.28,0],P.gold);if(!v){for(const x of [-.12,.12])ring(.1,.02,[x,.62,0],P.gold);}break;
    case 'jewelry': b([.65,.05,.4],[0,.025,0]);rod([0,0,0],[0,.85,0],.025,P.gold);rod([-.3,.8,0],[.3,.8,0],.025,P.gold);for(const x of [-.2,.2])ring(.12,.009,[x,.65,0],P.gold);break;
    case 'bust': case 'figure': ball(.3,[0,.5,0],P.white,[1,1.1,.55]);cy(.09,.2,[0,.88,0],P.white);b([.45,.06,.3],[0,.08,0],P.dark);if(asset.recipe==='figure'){ball(.14,[0,1.07,0],P.white);for(const x of [-.15,.15]){rod([x,.28,0],[x,.25,.3],.065,P.white);rod([x,.25,.3],[x,-.2,.3],.055,P.white);rod([x*1.5,.7,0],[x*1.8,.3,.1],.045,P.white);}}else ring(.2,.014,[0,.63,.14],P.gold);break;
    case 'mirror': b([.65,1.3,.06],[0,.8,0],P.wood);b([.57,1.22,.01],[0,.8,.04],P.steel);for(const x of [-.22,.22])rod([x,0,-.3],[x,.8,0],.025,P.wood);break;
    case 'displaycase': b([1.2,.5,.65],[0,.25,0],accent);b([1.2,.03,.65],[0,.8,0],P.steel);for(const x of [-.58,.58])b([.02,.3,.65],[x,.65,0],P.glass);b([1.2,.3,.02],[0,.65,.32],P.glass);for(let i=0;i<4;i++)bread([-.4+i*.27,.55,0],[.2,.12,.25]);break;
    case 'crate': b([1,.06,.7],[0,.03,0],P.wood);for(let j=0;j<4;j++)for(const z of [-.35,.35])b([1,.11,.04],[0,.12+j*.14,z],v===2?P.steel:P.wood);for(const x of [-.48,.48])for(let j=0;j<4;j++)b([.04,.11,.7],[x,.12+j*.14,0],v===2?P.steel:P.wood);for(const x of [-.44,.44])for(const z of [-.31,.31])b([.06,.65,.06],[x,.325,z],v===2?accent:P.wood);if(v===1||v===2)b([1,.05,.7],[0,.62,0],v===2?P.steel:P.wood);if(v===3){b([1.05,.06,.75],[0,.66,0],P.dark);b([.3,.15,.025],[0,.13,.38],P.dark);}break;
    case 'laptop': {
      // Aluminum unibody laptop with chiclet keyboard, precision glass trackpad and angled display
      b([0.96, 0.035, 0.68], [0, 0.018, 0.06], P.steel);
      for (const fx of [-0.42, 0.42]) {
        for (const fz of [-0.22, 0.32]) cy(0.012, 0.005, [fx, 0.002, fz], P.dark);
      }
      b([0.84, 0.006, 0.36], [0, 0.035, -0.04], '#1e2427');
      for (let r = 0; r < 5; r++) {
        const z = -0.17 + r * 0.068;
        if (r === 4) {
          b([0.10, 0.008, 0.052], [-0.34, 0.040, z], P.dark);
          b([0.08, 0.008, 0.052], [-0.23, 0.040, z], P.dark);
          b([0.34, 0.008, 0.052], [0, 0.040, z], P.dark);
          b([0.08, 0.008, 0.052], [0.23, 0.040, z], P.dark);
          b([0.10, 0.008, 0.052], [0.34, 0.040, z], P.dark);
        } else {
          for (let k = 0; k < 12; k++) {
            b([0.056, 0.008, 0.052], [-0.37 + k * 0.067, 0.040, z], P.dark);
          }
        }
      }
      b([0.34, 0.005, 0.22], [0, 0.036, 0.23], '#9ca6a9');
      b([0.12, 0.008, 0.015], [0, 0.032, 0.40], '#242a2d');
      cy(0.014, 0.74, [0, 0.035, -0.26], P.dark, 0.014, [0, 0, Math.PI / 2]);

      b([0.96, 0.66, 0.024], [0, 0.32, -0.38], P.steel, [-0.38, 0, 0]);
      b([0.92, 0.62, 0.008], [0, 0.32, -0.368], P.dark, [-0.38, 0, 0]);
      b([0.86, 0.54, 0.008], [0, 0.32, -0.364], '#122530', [-0.38, 0, 0]);
      b([0.84, 0.035, 0.006], [0, 0.54, -0.278], '#234458', [-0.38, 0, 0]);
      ball(0.008, [0, 0.59, -0.258], P.glass);
      ball(0.004, [0.03, 0.59, -0.258], '#34d399');
      break;
    }
    case 'monitor': {
      // Écran de bureau professionnel sans bordure sur pied en aluminium biseauté
      b([0.42, 0.015, 0.28], [0, 0.008, 0], P.steel);
      for (const fx of [-0.18, 0.18]) for (const fz of [-0.11, 0.11]) cy(0.01, 0.004, [fx, 0.002, fz], P.dark);
      rod([0, 0.015, -0.06], [0, 0.48, -0.06], 0.024, P.steel);
      ring(0.025, 0.006, [0, 0.20, -0.06], P.dark, [0, 0, Math.PI / 2]);
      b([0.14, 0.14, 0.04], [0, 0.48, -0.04], P.dark);
      b([1.0, 0.62, 0.022], [0, 0.48, 0], P.dark);
      b([0.96, 0.58, 0.008], [0, 0.48, 0.01], '#101e28');
      b([0.94, 0.035, 0.005], [0, 0.74, 0.012], '#234458');
      ball(0.004, [0.46, 0.20, 0.012], '#22c55e');
      break;
    }
    case 'keyboard': {
      // Clavier bureautique biseauté en aluminium avec touches chiclet
      b([1.0, 0.025, 0.36], [0, 0.015, 0], P.steel, [-0.08, 0, 0]);
      for (const fx of [-0.46, 0.46]) cy(0.01, 0.006, [fx, 0.004, -0.14], P.dark);
      for (let r = 0; r < 5; r++) {
        const z = -0.12 + r * 0.06;
        if (r === 4) {
          b([0.08, 0.012, 0.048], [-0.38, 0.03, z], P.dark, [-0.08, 0, 0]);
          b([0.38, 0.012, 0.048], [0, 0.03, z], P.dark, [-0.08, 0, 0]);
          b([0.08, 0.012, 0.048], [0.38, 0.03, z], P.dark, [-0.08, 0, 0]);
        } else {
          for (let k = 0; k < 14; k++) {
            b([0.054, 0.012, 0.048], [-0.42 + k * 0.065, 0.03, z], P.dark, [-0.08, 0, 0]);
          }
        }
      }
      break;
    }
    case 'mouse': {
      // Souris optique ergonomique sculptée avec molette crantée
      ball(0.24, [0, 0.08, 0], P.dark, [0.75, 0.55, 1.3]);
      rod([0, 0.16, 0.02], [0, 0.16, 0.26], 0.005, P.steel);
      cy(0.025, 0.018, [0, 0.16, 0.12], P.steel, 0.025, [0, 0, Math.PI / 2]);
      ball(0.12, [-0.14, 0.06, -0.04], P.dark, [0.8, 0.35, 1.1]);
      for (const fz of [-0.20, 0.20]) cy(0.03, 0.005, [0, 0.004, fz], '#0f172a');
      break;
    }
    case 'projector': {
      // Seminar room HD/4K projector with optical glass lens and cooling louvers
      b([0.82, 0.22, 0.62], [0, 0.12, 0], P.white);
      for (const fx of [-0.34, 0.34]) {
        for (const fz of [-0.24, 0.24]) cy(0.032, 0.02, [fx, 0.01, fz], P.dark);
      }
      cy(0.025, 0.03, [0, 0.015, 0.26], P.dark);

      // Large multi-element optical lens with silver focus ring
      cy(0.125, 0.08, [0.22, 0.12, 0.32], P.dark, 0.125, [Math.PI / 2, 0, 0]);
      ring(0.126, 0.012, [0.22, 0.12, 0.32], P.steel, [Math.PI / 2, 0, 0]);
      cy(0.10, 0.02, [0.22, 0.12, 0.36], P.blue, 0.10, [Math.PI / 2, 0, 0]);
      ball(0.065, [0.22, 0.12, 0.365], P.glass, [1, 1, 0.3]);

      // Cooling louvers and vents
      for (let i = 0; i < 7; i++) b([0.24, 0.012, 0.008], [-0.18, 0.06 + i * 0.02, 0.312], P.dark);
      for (let i = 0; i < 9; i++) b([0.008, 0.12, 0.014], [-0.412, 0.12, -0.18 + i * 0.04], P.dark);

      // Top control keypad & status LEDs
      b([0.18, 0.006, 0.18], [0.18, 0.23, -0.08], '#333e44');
      for (const [bx, bz] of [[0, 0], [0.04, 0], [-0.04, 0], [0, 0.04], [0, -0.04]]) ball(0.012, [0.18 + bx, 0.235, -0.08 + bz], P.white);
      ball(0.006, [0.05, 0.233, -0.12], '#22c55e');
      ball(0.006, [0.08, 0.233, -0.12], '#f59e0b');
      ball(0.006, [0.11, 0.233, -0.12], '#ef4444');

      // Rear connectivity panel
      b([0.48, 0.09, 0.015], [0, 0.11, -0.31], P.dark);
      b([0.05, 0.02, 0.01], [-0.12, 0.11, -0.315], P.gold);
      b([0.05, 0.02, 0.01], [-0.04, 0.11, -0.315], P.gold);
      cy(0.025, 0.01, [0.08, 0.11, -0.315], P.blue, 0.025, [Math.PI / 2, 0, 0]);
      break;
    }
    case 'screen': {
      if (v === 1) {
        for (let j = 0; j < 3; j++) {
          const x = -.55 + j * .55;
          for (const dx of [-.25, .25]) b([.04, 1.4, .05], [x + dx, .7, 0]);
          for (let i = 0; i < 9; i++) b([.5, .025, .03], [x, .12 + i * .15, 0]);
        }
      } else {
        // High-definition seminar projection screen on telescopic tripod
        rod([0, 0.05, 0], [0, 1.95, 0], 0.024, P.steel);
        cy(0.035, 0.06, [0, 0.75, 0], P.dark);
        cy(0.035, 0.06, [0, 1.25, 0], P.dark);
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI * 2 / 3;
          rod([0, 0.55, 0], [Math.cos(a) * 0.45, 0.02, Math.sin(a) * 0.45], 0.016, P.dark);
          cy(0.022, 0.03, [Math.cos(a) * 0.45, 0.015, Math.sin(a) * 0.45], P.dark);
        }
        b([1.72, 0.045, 0.045], [0, 1.88, 0.03], P.dark);
        b([1.70, 0.035, 0.035], [0, 1.02, 0.03], P.dark);
        b([1.68, 0.88, 0.008], [0, 1.45, 0.028], P.dark);
        b([1.64, 0.84, 0.012], [0, 1.45, 0.03], P.white);
      }
      break;
    }
    case 'speaker': b([.6,1,.45],[0,.5,0],P.dark);for(const [r,y] of [[.2,.32],[.1,.78]]){cy(r,.025,[0,y,.24],P.steel,r,[Math.PI/2,0,0]);ball(r*.6,[0,y,.255],P.dark,[1,1,.25]);}break;
    case 'conferencephone': {
      // Modern tripartite conference telephone with 3 acoustic microphone pods and backlit LCD
      cy(0.46, 0.05, [0, 0.025, 0], P.dark, 0.42, [0, 0, 0], 3);
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3;
        const cos = Math.cos(a), sin = Math.sin(a);
        rod([cos * 0.15, 0.035, sin * 0.15], [cos * 0.45, 0.025, sin * 0.45], 0.045, P.dark);
        cy(0.04, 0.02, [cos * 0.44, 0.03, sin * 0.44], '#111827');
        ring(0.042, 0.006, [cos * 0.44, 0.04, sin * 0.44], '#10b981', [Math.PI / 2, 0, 0]);
      }
      cy(0.20, 0.025, [0, 0.055, -0.02], '#1f2937');
      for (let r = 1; r <= 3; r++) ring(r * 0.05, 0.005, [0, 0.068, -0.02], '#374151', [Math.PI / 2, 0, 0]);

      b([0.24, 0.12, 0.02], [0, 0.075, 0.14], P.dark, [0.35, 0, 0]);
      b([0.20, 0.08, 0.008], [0, 0.08, 0.145], '#164e63', [0.35, 0, 0]);
      b([0.16, 0.015, 0.005], [0, 0.09, 0.15], '#67e8f9', [0.35, 0, 0]);

      for (let r = 0; r < 4; r++) {
        for (let c = -1; c <= 1; c++) {
          ball(0.009, [c * 0.032, 0.06, 0.22 + r * 0.028], P.white);
        }
      }
      ball(0.014, [-0.08, 0.06, 0.31], '#10b981');
      ball(0.014, [0.08, 0.06, 0.31], '#ef4444');
      break;
    }
    case 'organizer': b([1,.04,.6],[0,.02,0]);for(let i=0;i<3;i++){b([.025,.3,.6],[-.48+i*.32,.18,0],accent);b([.3,.3,.025],[-.32+i*.32,.18,-.29],accent);}shell(.13,.45,[.32,.04,.05],accent);break;
    case 'tray': for(const y of [.06,.3]){b([1,.04,.7],[0,y,0],P.steel);for(const x of [-.49,.49])b([.02,.16,.7],[x,y+.08,0],P.steel);b([1,.16,.025],[0,y+.08,-.34],P.steel);}break;
    case 'badge': b([.45,.6,.03],[0,.3,0],P.white);b([.38,.14,.008],[0,.5,.02],accent);for(const x of [-.17,.17])rod([x,.6,0],[0,1.5,0],.018,accent);ball(.07,[0,.3,.02],P.gold,[1,1,.1]);break;
    case 'sword': outline([[-.045,0],[.045,0],[.065,.65],[0,.85],[-.065,.65]],.025,[0,.3,-.012],P.steel);b([.4,.055,.075],[0,.3,0],P.gold);rod([0,0,0],[0,.3,0],.04,P.wood);ball(.06,[0,0,0],P.gold);break;
    case 'shield': if(v)outline([[-.4,.8],[.4,.8],[.32,.25],[0,0],[-.32,.25]],.06,[0,0,0],accent);else cy(.45,.07,[0,.45,0],P.wood,.45,[Math.PI/2,0,0]);if(!v)ring(.43,.025,[0,.45,.045],P.steel);b([.07,.6,.03],[0,.45,.09],P.gold);b([.5,.07,.03],[0,.55,.09],P.gold);break;
    case 'helmet': mesh(new T.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2),[0,.15,0],v?P.gold:P.steel);if(v)ring(.4,.045,[0,.15,0],P.gold,[Math.PI/2,0,0]);else{b([.55,.3,.07],[0,.16,.3],P.steel);for(let i=0;i<5;i++)b([.025,.15,.012],[-.16+i*.08,.16,.34],P.dark);}break;
    case 'axe': rod([0,0,0],[0,1,0],.035,P.wood);outline([[0,.7],[.35,.55],[.45,1],[0,.94]],.05,[0,0,-.025],P.steel);break;
    case 'bow': {const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.3,.5,0),new T.Vector3(0,1,0)]);mesh(new T.TubeGeometry(curve,20,.025,6,false),[0,0,0],P.wood);rod([0,0,0],[0,1,0],.004,P.white);break;}
    case 'quiver': shell(.18,.65,[0,0,0],P.wood);for(let i=0;i<5;i++){const x=(i-2)*.05;rod([x,.1,0],[x,1+i*.03,0],.009,P.wood);b([.04,.1,.006],[x,.94+i*.03,0],P.red);}break;
    case 'staff': rod([0,0,0],[0,1.3,0],.035,P.wood);ring(.12,.03,[0,1.4,0],P.gold);mesh(new T.OctahedronGeometry(.1),[0,1.4,0],P.blue);break;
    case 'crystal': cy(.23,.65,[0,.325,0],accent,.18,[0,0,0],6);cy(.18,.25,[0,.775,0],accent,0,[0,0,0],6);break;
    case 'torch': rod([0,0,0],[0,.6,0],.045,P.wood);cy(.1,.14,[0,.58,0],P.dark,.13);ball(.1,[0,.77,0],P.gold,[.8,1.8,.8]);b([.1,.3,.04],[0,.25,-.12],P.steel);break;
    case 'brazier': shell(.4,.2,[0,.4,0],P.dark);legs(.5,.5,.4);for(let i=0;i<5;i++)ball(.09,[(i-2)*.12,.66,0],i%2?P.red:P.gold,[.7,1.7,.7]);break;
    case 'barrel': lathe([[0,0],[.3,0],[.4,.4],[.3,.8],[0,.8]],[0,0,0],P.wood);for(const y of [.08,.4,.72])ring(y===.4?.402:.33,.025,[0,y,0],P.steel,[Math.PI/2,0,0]);for(let i=0;i<14;i++){const a=i*Math.PI/7;rod([Math.cos(a)*.31,.03,Math.sin(a)*.31],[Math.cos(a)*.4,.4,Math.sin(a)*.4],.005,P.dark);rod([Math.cos(a)*.4,.4,Math.sin(a)*.4],[Math.cos(a)*.31,.77,Math.sin(a)*.31],.005,P.dark);}break;
    case 'scroll': b([.8,.01,.6],[0,.05,0],P.white);for(const x of [-.42,.42])cy(.06,.7,[x,.06,0],P.bread,.06,[Math.PI/2,0,0]);for(let i=0;i<5;i++)b([.5-i*.04,.008,.012],[0,.06,-.18+i*.08],P.wood);break;
    case 'altar': b([1.1,.12,.6],[0,.75,0],P.white);for(const x of [-.35,.35])b([.22,.7,.45],[x,.35,0],P.white);b([1.2,.08,.7],[0,.04,0],P.dark);break;
    case 'arch': for(const x of [-.5,.5])b([.15,1.3,.3],[x,.65,0],v===1?P.steel:P.white);if(v===1){b([1.15,.18,.3],[0,1.4,0],P.steel);b([.82,1.25,.08],[0,.64,-.1],P.dark);for(const x of [-.4,.4])b([.025,1.2,.025],[x,.65,.16],accent);}else{ring(.5,.085,[0,1.3,0],v===2?P.wood:P.white,[0,0,0],Math.PI);if(v===2)for(let i=0;i<6;i++)leaf([-.5, .2+i*.2,.17],[.12,.1,.04],i*.6);}break;
    case 'wheel': ring(.4,.045,[0,.45,0],P.wood);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([0,.45,0],[Math.cos(a)*.38,.45+Math.sin(a)*.38,0],.025,P.wood);}cy(.08,.15,[0,.45,0],P.gold,.08,[Math.PI/2,0,0]);break;
    case 'arcade': b([.7,.9,.65],[0,.45,0],P.dark);screen(.55,.45,[0,1.16,.13]);b([.7,.15,.2],[0,1.5,.12],accent);b([.72,.06,.4],[0,.9,.24],accent);rod([-.17,.92,.29],[-.17,1.05,.29],.012);ball(.04,[-.17,1.07,.29],P.red);buttons(3,[.03,.95,.29]);break;
    case 'pinball': legs(.55,1,.7);b([.7,.15,1.2],[0,.75,0],P.wood,[-.12,0,0]);b([.62,.02,1.1],[0,.86,0],P.dark,[-.12,0,0]);screen(.65,.4,[0,1.1,-.55]);for(let i=0;i<5;i++)cy(.065,.03,[Math.sin(i*2)*.2,.9,Math.cos(i)*.35],[P.red,P.gold,P.blue][i%3]);break;
    case 'gamepad': b([.65,.12,.3],[0,.12,0],P.dark);for(const x of [-.32,.32])ball(.18,[x,.1,.1],P.dark,[.8,.5,1.5]);b([.15,.018,.04],[-.2,.19,-.03],P.steel);b([.04,.018,.15],[-.2,.19,-.03],P.steel);buttons(3,[.1,.19,0],.06);break;
    case 'joystick': b([.6,.08,.5],[0,.04,0],P.dark);rod([-.1,.08,0],[-.1,.5,0],.03);ball(.1,[-.1,.5,0],P.red);buttons(2,[.15,.1,.15],.1);break;
    case 'vrheadset': b([.7,.3,.3],[0,.25,.12],P.dark);b([.6,.22,.02],[0,.25,.28],accent);ring(.3,.035,[0,.25,-.12],P.dark,[Math.PI/2,0,0]);break;
    case 'vrcontrollers': for(const x of [-.25,.25]){rod([x,0,0],[x,.35,0],.05,P.white);ring(.15,.025,[x,.4,0],P.white,[Math.PI/3,0,0]);ball(.03,[x,.36,.05],P.dark);}break;
    case 'robot': b([.4,.4,v?.65:.28],[0,v?.5:.65,0],P.steel);b([.32,.2,.25],[0,v?.55:.99,v?.42:0],P.white);for(const x of [-.08,.08])ball(.035,[x,v?.58:1,v?.56:.13],P.blue);for(const x of [-.25,.25])for(const z of v?[-.24,.24]:[0]){rod([x*.7,.5,z],[x,.24,z+.08],.035,P.dark);rod([x,.24,z+.08],[x,.04,z],.035,P.steel);b([.13,.07,.2],[x,.035,z+.04],P.dark);}if(!v)for(const x of [-.3,.3])rod([x*.7,.82,0],[x,.5,0],.045,P.steel);break;
    case 'drone': b([.25,.12,.25],[0,.12,0],P.dark);for(const x of [-.3,.3])for(const z of [-.3,.3]){rod([0,.12,0],[x,.12,z],.025,P.steel);cy(.055,.09,[x,.16,z],P.dark);b([.35,.015,.04],[x,.22,z],accent,[0,x*z*9,0]);}break;
    case 'hologram': cy(.4,.15,[0,.075,0],P.dark);cy(.3,.04,[0,.18,0],accent);for(let i=0;i<4;i++)ring(.25-i*.04,.012,[0,.35+i*.14,0],P.blue,[Math.PI/2,0,0]);mesh(new T.OctahedronGeometry(.2),[0,.55,0],P.glass);break;
    case 'capsule': cy(.35,1,[0,.7,0],P.white);ball(.35,[0,1.2,0],P.white);ball(.35,[0,.2,0],P.white);b([.4,.7,.04],[0,.8,.32],P.blue);for(const y of [.3,1.15])ring(.355,.035,[0,y,0],accent,[Math.PI/2,0,0]);break;
    case 'reactor': cy(.35,1,[0,.5,0],P.dark);for(let i=0;i<6;i++)ring(.38,.035,[0,.12+i*.16,0],accent,[Math.PI/2,0,0]);cy(.25,.2,[0,1.08,0],P.gold);break;
    case 'dish': cy(.25,.07,[0,.035,0],P.dark);rod([0,0,0],[0,.8,0],.035);const dish=lathe([[0,0],[.15,.03],[.3,.12],[.5,.3],[.48,.32],[.28,.15],[.12,.06],[0,.03]],[0,.8,0],P.white);dish.rotation.x=Math.PI/3;rod([0,.8,0],[0,1.1,.5],.015);ball(.06,[0,1.1,.5],P.dark);break;
    case 'beacon': cy(.25,.1,[0,.05,0],P.dark);cy(.1,.8,[0,.5,0],P.steel);ball(.15,[0,1,0],accent);ring(.2,.02,[0,.9,0],P.gold,[Math.PI/2,0,0]);break;
    case 'platform': cy(.6,.12,[0,.06,0],P.dark);ring(.52,.025,[0,.13,0],accent,[Math.PI/2,0,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(.03,[Math.cos(a)*.56,.14,Math.sin(a)*.56],P.gold);}break;
    case 'sensor': cy(.25,.06,[0,.03,0],P.dark);rod([0,0,0],[0,.75,0],.055);ball(.22,[0,.9,0],P.steel);cy(.1,.08,[0,.9,.22],P.blue,.1,[Math.PI/2,0,0]);break;
    case 'server': b([.65,1.5,.6],[0,.75,0],P.dark);for(let i=0;i<9;i++){b([.55,.12,.03],[0,.15+i*.15,.32],P.steel);buttons(2,[.13,.15+i*.15,.34],.07);}break;
    case 'trophy': b([.4,.1,.3],[0,.05,0],P.dark);cy(.08,.25,[0,.23,0],P.gold);shell(.25,.4,[0,.35,0],P.gold);for(const x of [-.28,.28])ring(.13,.025,[x,.6,0],P.gold);break;
    case 'racket': {const o=ring(.25,.025,[0,.65,0],v?P.wood:accent);o.scale.y=v?1:1.3;rod([0,0,0],[0,.4,0],.035,P.wood);if(v)cy(.23,.025,[0,.65,0],P.red,.23,[Math.PI/2,0,0]);else grid(.32,.4,[0,.65,0]);break;}
    case 'shuttle': ball(.1,[0,.08,0],P.white);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod([Math.cos(a)*.07,.14,Math.sin(a)*.07],[Math.cos(a)*.25,.5,Math.sin(a)*.25],.012,P.white);}ring(.25,.012,[0,.5,0],P.white,[Math.PI/2,0,0]);break;
    case 'goal': for(const x of [-.7,.7]){rod([x,0,0],[x,.9,0],.035,P.white);rod([x,0,0],[x,0,-.5],.025,P.white);rod([x,0,-.5],[x,.9,0],.02,P.white);}rod([-.7,.9,0],[.7,.9,0],.035,P.white);grid(1.4,.9,[0,.45,-.25]);break;
    case 'basketballhoop': b([.6,.1,.6],[0,.05,0],P.dark);rod([0,0,-.2],[0,1.7,-.2],.04);b([.75,.5,.04],[0,1.6,0],P.white);ring(.2,.02,[0,1.45,.22],P.red,[Math.PI/2,0,0]);for(let i=0;i<10;i++){const a=i*Math.PI/5;rod([Math.cos(a)*.2,1.45,.22+Math.sin(a)*.2],[Math.cos(a)*.14,1.2,.22+Math.sin(a)*.14],.005,P.white);}break;
    case 'cone': b([.6,.04,.6],[0,.02,0],P.dark);cy(.25,.8,[0,.44,0],v?'#df823c':P.gold,.04);cy(.17,.15,[0,.45,0],P.white,.13);break;
    case 'dumbbell': rod([-.45,.2,0],[.45,.2,0],.035);for(const x of [-.32,.32])cy(.2,.15,[x,.2,0],P.dark,.2,[0,0,Math.PI/2]);break;
    case 'mat': b([.7,.03,1.3],[0,.015,0],accent);if(v)for(let i=0;i<5;i++)b([.65,.002,.008],[0,.032,-.45+i*.22],P.white);break;
    case 'bike': cy(.28,.08,[0,.3,.18],P.dark,.28,[0,0,Math.PI/2]);rod([0,.3,.18],[0,.75,-.3],.035);rod([0,.3,.18],[0,.7,.45],.035);b([.25,.06,.22],[0,.79,-.3],P.dark);rod([-.25,.87,.45],[.25,.87,.45],.035,P.dark);for(const z of [-.35,.4])b([.5,.04,.1],[0,.02,z],P.dark);break;
    case 'pingpong': b([1,.06,1.7],[0,.7,0],P.blue);legs(.8,1.4,.67);b([1.05,.15,.01],[0,.81,0],P.white);for(const x of [-.48,0,.48])b([.01,.003,1.66],[x,.733,0],P.white);break;
    case 'chess': b([1,.04,1],[0,.02,0]);for(let x=0;x<8;x++)for(let z=0;z<8;z++){b([.12,.01,.12],[-.4375+x*.125,.046,-.4375+z*.125],(x+z)%2?P.dark:P.white);if((v?(z<3||z>4)&&(x+z)%2===1:z<2||z>5)){const px=-.4375+x*.125,pz=-.4375+z*.125,c=z<4?P.wood:P.white;cy(.04,v?.018:.045,[px,.08,pz],c);if(!v){cy(.018,.06,[px,.125,pz],c);ball(z===0||z===7?.027:.021,[px,.17,pz],c);}}}break;
    case 'dice': b([.6,.6,.6],[0,.3,0],P.white);ball(.04,[0,.3,.304],P.dark,[1,1,.1]);for(const x of [-.15,.15])for(const z of [-.15,.15])ball(.04,[x,.604,z],P.dark,[1,.1,1]);for(const y of [.15,.45])ball(.04,[.304,y,0],P.dark,[.1,1,1]);break;
    case 'domino': for(let j=0;j<4;j++){b([.18,.03,.36],[-.3+j*.2,.02,0],P.white);b([.17,.003,.005],[-.3+j*.2,.038,0],P.dark);for(let i=0;i<=j;i++)ball(.013,[-.35+j*.2+(i%2)*.08,.04,-.1+Math.floor(i/2)*.065],P.dark,[1,.1,1]);}break;
    case 'bowling': for(let j=0;j<3;j++)for(let i=0;i<=j;i++){const x=(i-j/2)*.2,z=j*.2;lathe([[0,0],[.06,0],[.08,.13],[.025,.27],[.045,.32],[0,.36]],[x,0,z],P.white);ring(.03,.008,[x,.26,z],P.red,[Math.PI/2,0,0]);}ball(.12,[.3,.12,-.25],P.blue);break;
    case 'palm': cy(.09,1.3,[0,.65,0],P.wood,.06);for(let i=0;i<8;i++){const a=i*Math.PI/4;leaf([Math.cos(a)*.32,1.35,Math.sin(a)*.32],[.13,.6,.035],Math.PI/2);const l=root.children[root.children.length-1];l.rotation.set(.3, a,Math.PI/2);}break;
    case 'cactus': cy(.14,1,[0,.5,0],P.green);ball(.14,[0,1,0],P.green);for(const x of [-.3,.3]){rod([0,.4,0],[x,.4,0],.085,P.green);rod([x,.4,0],[x,.75,0],.085,P.green);ball(.085,[x,.75,0],P.green);}break;
    case 'bamboo': for(let i=0;i<5;i++){const x=(i-2)*.17,z=Math.sin(i)*.1,h=1.2+(i%3)*.2;cy(.035,h,[x,h/2,z],P.green);for(let j=0;j<5;j++){ring(.036,.007,[x,.15+j*.24,z],P.wood,[Math.PI/2,0,0]);leaf([x+.09,.2+j*.24,z],[.03,.15,.01],-.8);}}break;
    case 'shrub': for(let i=0;i<9;i++){const a=i*2.4;ball(.22,[Math.cos(a)*.3,.28+Math.sin(i)*.12,Math.sin(a)*.23],P.green);if(i%2===0)flower([Math.cos(a)*.35,.4,Math.sin(a)*.27],P.pink);}break;
    case 'waterlily': cy(.45,.018,[0,.01,0],P.green);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(.15,[Math.cos(a)*.12,.06,Math.sin(a)*.12],P.pink,[1,.3,.5]);}ball(.07,[0,.1,0],P.gold);break;
    case 'log': cy(.25,1,[0,v?.5:.25,0],P.wood,.22,v?[0,0,0]:[0,0,Math.PI/2]);for(let i=1;i<5;i++)ring(i*.047,.005,v?[0,1.003,0]:[.503,.25,0],P.dark,v?[Math.PI/2,0,0]:[0,Math.PI/2,0]);if(v)rod([0,.6,0],[.35,.8,0],.07,P.wood);break;
    case 'watering': shell(.28,.5,[0,0,0],accent);handle([-.3,.4,0],.23,accent);rod([.2,.15,0],[.65,.5,0],.045,accent);cy(.13,.04,[.67,.52,0],accent,.13,[0,0,-.8]);break;
    case 'wheelbarrow': shell(.35,.3,[0,.45,0],accent);cy(.18,.1,[0,.2,-.55],P.dark,.18,[0,0,Math.PI/2]);for(const x of [-.3,.3]){rod([0,.2,-.55],[x,.45,.55]);rod([x,.4,0],[x,0,.2]);}break;
    case 'shovel': rod([0,.2,0],[0,1,0],.025,P.wood);outline([[-.15,.32],[.15,.32],[.13,.08],[0,0],[-.13,.08]],.025,[0,0,0],P.steel);handle([0,1.1,0],.1,P.dark);break;
    case 'rake': rod([0,0,0],[0,1,0],.025,P.wood);rod([-.3,.1,0],[.3,.1,0],.025);for(let i=0;i<9;i++)rod([-.28+i*.07,.1,0],[-.28+i*.07,0,.06],.012);break;
    case 'birdhouse': b([.6,.65,.4],[0,.35,0],P.wood);for(const x of [-.19,.19])b([.45,.05,.5],[x,.79,0],P.dark,[0,0,x<0?.6:-.6]);if(v){for(let i=0;i<4;i++)for(let j=0;j<5;j++){cy(.035,.04,[-.2+j*.1,.1+i*.15,.23],P.wood,.035,[Math.PI/2,0,0]);cy(.017,.045,[-.2+j*.1,.1+i*.15,.235],P.dark,.017,[Math.PI/2,0,0]);}}else{cy(.1,.025,[0,.49,.22],P.dark,.1,[Math.PI/2,0,0]);rod([0,.25,.2],[0,.25,.4],.025,P.wood);}break;
    case 'cushion2': if(!v)cy(.45,.25,[0,.13,0],accent);else {const pts:[number,number][]=[];for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.22:.5;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}const o=outline(pts,.12,[0,.12,0],accent);o.rotation.x=-Math.PI/2;}break;
    case 'chime': cy(.3,.04,[0,.8,0],P.wood);for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*.2,z=Math.sin(a)*.2;rod([x,.8,z],[x,.55,z],.003,P.dark);cy(.025,.3+i*.04,[x,.4-i*.02,z],P.steel);}break;
    case 'diffuser': lathe([[0,0],[.3,0],[.35,.25],[.15,.6],[.07,.65],[0,.65]],[0,0,0],P.white);ring(.32,.015,[0,.12,0],accent,[Math.PI/2,0,0]);break;
    case 'hourglass': for(const y of [0,.9])cy(.3,.05,[0,y,0],P.wood);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([Math.cos(a)*.25,0,Math.sin(a)*.25],[Math.cos(a)*.25,.9,Math.sin(a)*.25],.018,P.gold);}lathe([[0,.05],[.2,.05],[.19,.25],[.03,.45],[.19,.65],[.2,.85],[0,.85]],[0,0,0],P.glass);cy(.15,.2,[0,.16,0],P.gold,0);break;
    case 'stonegarden': b([1,.06,.65],[0,.03,0],P.wood);b([.94,.015,.59],[0,.07,0],P.bread);for(let i=0;i<5;i++)ball(.1,[-.3+i*.15,.13,Math.sin(i)*.12],P.white,[1,.45,.8]);break;
    case 'sensory': if(v){b([.6,.6,.6],[0,.3,0],accent);for(let i=0;i<4;i++)for(let j=0;j<4;j++)ball(.035,[-.2+i*.13,.1+j*.13,.31],P.gold);}else {ball(.35,[0,.4,0],accent);for(let i=0;i<60;i++){const y=1-2*(i+.5)/60,r=Math.sqrt(1-y*y),a=i*2.39996;ball(.03,[Math.cos(a)*r*.35,.4+y*.35,Math.sin(a)*r*.35],accent);}}break;
    case 'hammock': for(const x of [-.9,.9]){rod([x,0,0],[x*.8,.9,0],.04,P.wood);b([.2,.06,.6],[x,.03,0]);}rod([-.9,.05,0],[.9,.05,0],.04,P.wood);for(let i=0;i<15;i++){const x=-.65+i*.093,y=.3+x*x; b([.1,.025,.5],[x,y,0],i%2?accent:P.white,[0,0,Math.atan(2*x)]);}break;
    case 'curtain': for(const x of [-.6,.6])rod([x,0,0],[x,1.5,0]);rod([-.6,1.5,0],[.6,1.5,0]);for(let i=0;i<18;i++)cy(.037,1.4,[-.57+i*.067,.75,0],accent);break;
    case 'teatray': b([1,.04,.65],[0,.02,0],P.wood);for(const x of [-.28,.28]){shell(.12,.16,[x,.05,.1]);handle([x+.14,.14,.1],.07,P.white);}ball(.2,[0,.22,-.12],P.white);lid(.12,.4,P.white);break;
    case 'emotionwheel': cy(.25,.03,[0,.02,0]);rod([0,0,0],[0,.45,0]);for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(new T.CylinderGeometry(.4,.4,.03,16,1,false,a,.99),[0,.65,0],[P.red,P.gold,P.green,P.blue,P.pink,accent][i],[Math.PI/2,0,0]);}rod([0,.65,.04],[0,.98,.04],.016,P.dark);break;
    case 'hammer': rod([0,0,0],[0,.75,0],.04,P.wood);b([.4,.17,v?.2:.1],[0,.78,0],v?P.wood:P.steel);break;
    case 'screwdriver': cy(.06,.3,[0,.15,0],accent);rod([0,.3,0],[0,.85,0],.017);b([.035,.09,.008],[0,.87,0],P.steel);break;
    case 'wrench': rod([0,.1,0],[0,.8,0],.035);ring(.1,.025,[0,.88,0],P.steel,[0,0,.4],Math.PI*1.6);ring(.08,.022,[0,.08,0],P.steel);if(v)b([.17,.12,.06],[.04,.74,0],P.steel);break;
    case 'pliers': for(const x of [-.13,.13]){rod([x,0,0],[-x*.5,.6,0],.03,accent);rod([-x*.5,.6,0],[x*.5,.85,0],.025);}ball(.055,[0,.55,0],P.steel);break;
    case 'saw': outline([[-.12,.2],[.18,.2],[.06,.95],[-.1,.95]],.015,[0,0,0],P.steel);ring(.1,.03,[0,.12,0],P.wood);for(let i=0;i<12;i++)outline([[0,0],[.035,.03],[0,.05]],.017,[.18-i*.01,.22+i*.055,0],P.steel);break;
    case 'drill': b([.6,.25,.25],[0,.65,0],accent);b([.17,.45,.18],[-.1,.3,0],P.dark,[0,0,-.12]);b([.35,.1,.26],[-.12,.04,0],accent);rod([.3,.65,0],[.6,.65,0],.025);break;
    case 'vise': b([.65,.1,.5],[0,.05,0],P.steel);for(const x of [-.2,.2])b([.15,.4,.35],[x,.3,0],P.steel);rod([-.4,.2,0],[.4,.2,0],.035);rod([.42,.03,0],[.42,.37,0],.018);break;
    case 'tapemeasure': b([.5,.5,.25],[0,.25,0],P.gold);ring(.15,.02,[0,.25,.14],P.dark);b([.5,.012,.08],[.45,.03,0],P.white);for(let i=0;i<8;i++)b([.008,.008,.04],[.24+i*.06,.04,0],P.dark);break;
    case 'level': b([1,.12,.08],[0,.06,0],P.gold);b([.2,.07,.09],[0,.06,0],P.green);ball(.02,[0,.06,.05],P.white,[1,1,.1]);break;
    case 'vest': outline([[-.4,0],[.4,0],[.4,.55],[.25,.8],[.12,.8],[.08,.6],[-.08,.6],[-.12,.8],[-.25,.8],[-.4,.55]],.035,[0,0,0],P.gold);for(const y of [.15,.3])b([.8,.055,.012],[0,y,.044],P.white);b([.02,.58,.012],[0,.3,.045],P.dark);break;
    case 'toolbox': b([.9,.4,.5],[0,.2,0],P.red);b([.94,.1,.54],[0,.45,0],P.dark);handle([0,.6,0],.15,P.dark);for(const x of [-.25,.25])b([.08,.12,.025],[x,.37,.28],P.steel);break;
    case 'ladder': for(const z of [-1,1])for(const x of [-.25,.25])rod([x,0,z*.4],[x,1.4,0],.025);for(let i=0;i<7;i++)rod([-.25,.1+i*.19,.4-(.1+i*.19)/1.4*.4],[.25,.1+i*.19,.4-(.1+i*.19)/1.4*.4],.022);break;
    case 'handtruck': for(const x of [-.25,.25]){rod([x,.12,0],[x,1.1,0]);cy(.12,.07,[x,.12,.07],P.dark,.12,[0,0,Math.PI/2]);}for(const y of [.3,.6,1.1])rod([-.25,y,0],[.25,y,0]);b([.55,.04,.4],[0,.06,.18],P.steel);break;
    case 'pallet': for(const x of [-.4,0,.4])b([.12,.12,.7],[x,.06,0]);for(let i=0;i<7;i++)b([.13,.035,.8],[-.45+i*.15,.14,0]);break;
    case 'firstaid': b([.8,.5,.3],[0,.25,0],P.white);handle([0,.61,0],.14,P.white);b([.1,.3,.012],[0,.25,.16],P.red);b([.3,.1,.012],[0,.25,.16],P.red);break;
    case 'wall': if(!v)b([1.5,1.6,.12],[0,.8,0],P.white);else{for(const x of [-.56,.56])b([.38,1.6,.12],[x,.8,0],P.white);b([.75,.3,.12],[0,1.45,0],P.white);if(v===1){b([.75,.5,.12],[0,.25,0],P.white);b([.7,.8,.02],[0,.9,0],P.glass);}}break;
    case 'floor': for(let x=0;x<(v?5:10);x++)for(let z=0;z<(v?5:3);z++)b([v?.195:.097,.03,v?.195:.33],[-.45+x*(v?.2:.1),.015,-.4+z*(v?.2:.335)],v===1?(x+z)%2?P.white:P.dark:v===2?['#8e918b','#a4a59b','#b4afa1'][(x+z)%3]:P.wood);break;
    case 'stage': b([1.5,.3,1],[0,.15,0],P.wood);b([1.55,.04,1.05],[0,.32,0],P.dark);break;
    case 'stairs': for(let i=0;i<6;i++)b([.7,(i+1)*.13,.2],[0,(i+1)*.065,-i*.2],P.white);break;
    case 'ramp': {const o=outline([[0,0],[1.4,0],[1.4,.35]],.7,[-.7,0,-.35],P.white);o.rotation.y=Math.PI/2;break;}
    case 'column': if(v)b([.25,1.5,.25],[0,.75,0],P.white);else cy(.15,1.5,[0,.75,0],P.white);for(const y of [.04,1.5])b([.4,.08,.4],[0,y,0],P.white);if(!v)for(let i=0;i<12;i++){const a=i*Math.PI/6;rod([Math.cos(a)*.15,.15,Math.sin(a)*.15],[Math.cos(a)*.15,1.4,Math.sin(a)*.15],.007,P.wood);}break;
    case 'pergola': legs(1.4,1.4,1.5);for(const z of [-.7,.7])b([1.7,.1,.1],[0,1.53,z]);for(let i=0;i<8;i++)b([.06,.09,1.7],[-.75+i*.215,1.62,0]);break;
    case 'window': b([.8,1,.04],[0,.5,0],P.glass);for(const x of [-.43,0,.43])b([.04,1.05,.07],[x,.5,0],P.white);for(const y of [0,.5,1])b([.9,.04,.07],[0,y,0],P.white);for(const x of [-.7,.7]){b([.45,1,.06],[x,.5,0],accent);for(let i=0;i<10;i++)b([.39,.025,.02],[x,.07+i*.095,.04],P.dark);}break;
    case 'door2': for(const x of v?[-.32,.32]:[0]){b([.6,1.3,.06],[x,.65,0],P.wood);b([.48,1.08,.02],[x,.72,.04],P.glass);b([.02,.25,.05],[x+.22,.65,.07],P.steel);}if(v)b([1.35,.05,.08],[0,1.33,0],P.steel);break;
    case 'awning': for(let i=0;i<12;i++){const x=-.7+i*.127;b([.124,.025,.8],[x,.35,0],i%2?P.white:accent,[-.25,0,0]);b([.124,.15,.025],[x,.18,.39],i%2?P.white:accent);}break;
    case 'stepping': cy(.5,.06,[0,.03,0],P.white,.5,[0,.2,0],7);break;
    case 'staple':
      b([.7,.85,.45],[0,.43,0],v===0?'#2b5c8f':v===1?'#df9b32':v===2?'#3c6fa0':v===3?'#2f4838':'#362219');
      if(v===0||v===1){
        b([.4,.35,.01],[0,.38,.23],v===0?'#f0eee6':'#e8c868');
        b([.5,.15,.01],[0,.7,.23],P.white);
      } else if(v===2){
        b([.5,.3,.01],[0,.4,.23],P.white);
      } else if(v===3){
        cy(.35,.06,[0,.87,0],P.gold);
        ring(.35,.015,[0,.86,0],P.gold,[Math.PI/2,0,0]);
      } else if(v===4){
        b([.45,.25,.01],[0,.4,.23],P.gold);
      }
      break;
    case 'tuber':
      if(v===0){
        ball(.35,[0,.32,0],'#c99a63',[1.3,.9,1]);
        for(let i=0;i<4;i++){const a=i*1.6;ball(.025,[Math.cos(a)*.3,.25+i*.04,Math.sin(a)*.25],'#855b32');}
      } else if(v===1){
        ball(.35,[0,.35,0],P.white,[1,1.1,1]);
        ball(.28,[0,.54,0],'#7a2e5c',[1,.6,1]);
        for(let i=-1;i<=1;i++)leaf([i*.04,.82,0],[.03,.2,.02],i*.2);
      } else {
        ball(.25,[0,.3,0],'#d82e5b',[1,1.3,1]);
        ball(.12,[0,.12,0],P.white,[.8,1.2,.8]);
        for(let i=-1;i<=1;i++)leaf([i*.05,.65,0],[.03,.2,.015],i*.3);
      }
      break;
    case 'butter':
      b([.95,.32,.6],[0,.16,0],'#edd079');
      b([.45,.33,.62],[0,.16,0],P.white);
      b([.4,.15,.01],[0,.325,0],'#2b5c8f');
      break;
    case 'allium':
      if(v===0){
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3;
          ball(.16,[Math.cos(a)*.12,.28,Math.sin(a)*.12],'#ece4db',[1,1.2,1]);
        }
        ball(.14,[0,.28,0],'#e2dad0');
        rod([0,.38,0],[0,.55,0],.025,'#c4b79b');
      } else if(v===1){
        ball(.36,[0,.35,0],'#bd7935',[1.1,1,1.1]);
        cy(.08,.05,[0,.02,0],'#8c5828');
        rod([0,.65,0],[.02,.82,0],.03,'#8c5828');
      } else {
        ball(.25,[0,.35,0],'#a55d49',[1,1.7,1]);
        rod([0,.7,0],[0,.9,0],.02,'#7c3f30');
      }
      break;
    case 'can':
      cy(.35,.75,[0,.38,0],P.steel);
      cy(.355,.55,[0,.38,0],'#3a7850');
      ring(.35,.015,[0,.74,0],P.steel,[Math.PI/2,0,0]);
      ring(.35,.015,[0,.02,0],P.steel,[Math.PI/2,0,0]);
      break;
    case 'bar':
      b([.95,.08,.55],[0,.04,0],'#432616');
      b([.65,.085,.56],[-.12,.04,0],P.steel);
      b([.6,.09,.57],[-.15,.04,0],'#8b1e28');
      for(let i=0;i<4;i++)for(let j=0;j<2;j++)b([.16,.02,.18],[.12+i*.18,.085,-.12+j*.24],'#361d0f');
      break;
    case 'sachet':
      b([.7,.9,.05],[0,.45,0],'#f8df8b');
      b([.72,.06,.06],[0,.87,0],P.steel);
      b([.72,.06,.06],[0,.03,0],P.steel);
      b([.5,.4,.01],[0,.45,.03],'#c0392b');
      break;
    case 'herb':
      if(v===0){
        for(let i=0;i<5;i++){
          const a=i*1.2;
          leaf([Math.cos(a)*.12,.25,Math.sin(a)*.12],[.14,.35,.03],(i-2)*.2);
        }
        ring(.15,.02,[0,.25,0],'#aa7850',[Math.PI/2,0,0]);
      } else {
        for(let i=0;i<4;i++){
          const a=(i-1.5)*.18;
          rod([a*.2,0,0],[a*.6,.7,0],.035,'#78a356');
          leaf([a*.6,.82,0],[.08,.25,.03],a);
        }
      }
      break;
    case 'gourd':
      if(v===0){
        cy(.18,.85,[0,.42,0],'#234b28',.15,[0,0,.08]);
        ball(.16,[0,.84,0],'#3a6c38');
        cy(.04,.08,[0,.89,0],P.wood);
      } else {
        cy(.14,.95,[0,.48,0],'#3a6c38',.14);
        for(let i=0;i<6;i++)ball(.02,[Math.sin(i*2)*.14,.2+i*.12,Math.cos(i*2)*.14],'#244d23');
      }
      break;
    case 'lettuce':
      if(v===0){
        ball(.25,[0,.2,0],'#a3d97b');
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4;
          leaf([Math.cos(a)*.18,.25,Math.sin(a)*.18],[.22,.28,.04],a);
        }
      } else {
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3;
          leaf([Math.cos(a)*.14,.22,Math.sin(a)*.14],[.18,.35,.03],a);
        }
      }
      break;
    case 'pod':
      if(v===0){
        for(let i=0;i<6;i++){
          const a=(i-2.5)*.06;
          rod([a,0,0],[a*.8,.85,0],.018,'#4a7b32');
        }
        ring(.12,.015,[0,.42,0],'#aa7850',[Math.PI/2,0,0]);
      } else if(v===1){
        outline([[-.05,0],[.05,0],[.08,.8],[-.08,.8]],.04,[0,.1,0],'#5e9e3e');
        for(let i=0;i<4;i++)ball(.05,[0,.25+i*.15,.02],'#75bb4e');
      } else {
        for(let i=0;i<5;i++){
          const x=-.12+i*.06;
          rod([x,0,0],[x,.8,0],.025,'#dbe7c9');
          cy(.028,.15,[x,.85,0],'#6f8850',.005);
        }
        ring(.16,.015,[0,.4,0],'#aa7850',[Math.PI/2,0,0]);
      }
      break;
    case 'artichoke':
      rod([0,0,0],[0,.25,0],.035,'#3f5e39');
      ball(.32,[0,.45,0],'#3f5e39',[1,1.2,1]);
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;
        leaf([Math.cos(a)*.2,.5,Math.sin(a)*.2],[.08,.16,.03],a);
      }
      break;
    case 'orchard':
      if(v===0){
        ball(.35,[0,.35,0],'#e88349');
        ball(.25,[.08,.38,0],'#d83e3e',[1,1,.8]);
        rod([0,.65,0],[.05,.75,0],.02,P.wood);
        leaf([.1,.7,0],[.1,.04,.02]);
      } else if(v===1){
        ball(.3,[0,.3,0],'#f59b38');
        rod([0,.56,0],[.04,.64,0],.02,P.wood);
      } else if(v===2){
        for(const x of [-.12,.12]){
          ball(.16,[x,.16,0],'#990d24');
          rod([x,.28,0],[0,.75,0],.012,'#5a3518');
        }
        leaf([.08,.68,0],[.1,.04,.02]);
      } else if(v===3){
        ball(.3,[0,.32,0],'#46274f',[1,1.2,1]);
        rod([0,.62,0],[0,.72,0],.018,P.wood);
      } else if(v===4){
        ball(.33,[0,.28,0],'#a7b346');
        ball(.22,[0,.58,0],'#b5c252');
        rod([0,.75,0],[.05,.9,0],.02,P.wood);
      } else if(v===5){
        ball(.3,[0,.26,0],'#4d293d',[1,.9,1]);
        cy(.1,.18,[0,.48,0],'#6f7a38',.05);
      } else {
        for(let j=0;j<3;j++)for(let i=0;i<6-j;i++){
          const a=i*Math.PI*2/(6-j);
          ball(.07,[Math.cos(a)*(.16-j*.04),.15+j*.12,Math.sin(a)*(.16-j*.04)],'#bd1e43');
        }
      }
      break;
    case 'melon':
      ball(.45,[0,.45,0],'#e0b86b');
      for(let i=0;i<6;i++)ring(.455,.015,[0,.45,0],'#3b6534',[0,i*Math.PI/6,0]);
      rod([0,.86,0],[.06,.98,0],.03,P.wood);
      break;
    case 'nut':
      ball(.32,[0,.26,0],'#8c6747',[1,1.25,.85]);
      ring(.33,.015,[0,.26,0],'#6d4e32',[Math.PI/2,0,0]);
      break;
    default: throw new Error(`No construction for ${asset.id}: ${asset.recipe}`);
  }
  root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  if(size.x<=0||size.y<=0||size.z<=0)throw new Error(`Invalid dimensions: ${asset.id}`);
  // Bake scale into a single assembly so export and in-app geometry have identical bounds.
  const assembly=new T.Group();while(root.children.length)assembly.add(root.children[0]);
  assembly.position.set(-center.x,-bounds.min.y,-center.z);
  const fitted=new T.Group();fitted.add(assembly);fitted.scale.set(asset.size[0]/size.x,asset.size[1]/size.y,asset.size[2]/size.z);root.add(fitted);root.updateMatrixWorld(true);
  return root;
}
