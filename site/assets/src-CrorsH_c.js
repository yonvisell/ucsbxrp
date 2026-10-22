var e={schema_version:2,release_id:`2026.10-dev.70`,release_sequence:70,status:`development`,application_version:`0.1.0`,course_api_revision:`0.6.1-draft`,service:{version:`0.1.0`,protocol_version:1,protocol_revision:5,bootstrap_version:1},compatibility:{minimum_robot_release_sequence:67},controller:{id:`sparkfun-xrp-controller-rp2350`,usb_vid:`0x1B4F`,usb_pid:`0x0046`},micropython:{version:`1.29.0`,board:`SPARKFUN_XRP_CONTROLLER`,asset:`UCSBXRP_SPARKFUN_XRP_CONTROLLER-20260930-v1.29.0-gcsync1.uf2`,source_url:`https://github.com/micropython/micropython/tree/0fd6c573ea815774668bbb16b8e197c8822368b2`,byte_size:1789952,sha256:`8512b307d1043bccd9fbff7a5cc203d2c68451a6673b51126e3e4996556d177a`,git_blob_sha1:`48df9fa8dcafa2cb06aa36bff8070119cc1d3566`,build_id:`ucsbxrp-rp2350-1.29.0-gcsync-20260930.1`,patch_source:`scripts/firmware/gcsync-port.patch`,flash_erase:{asset:`nuke_universal.uf2`,source_url:`https://github.com/raspberrypi/pico-sdk-prebuilts/releases/download/v2.3.1-0/nuke_universal.uf2`,byte_size:114688,sha256:`f3c3b6a62d2d7e944f336bc2ec73393f00adfbb56b6fa7440ba7ee3d5ad5b49d`}},xrplib:{version:`2026.07.1`,tag:`V2026.07.1`,source_commit:`55abed4e219e061d32dd190199bc42d9a1b45366`},upstream_manifest:{repository:`Open-STEM/XRP_Firmware`,commit:`1914fd636d1d06425cdbec88ae4b998844d1501a`},ucsb_xrp:{version:`0.6.1-dev`,source_hash_algorithm:`sha256-file-manifest-v1`,source_file_count:21,source_sha256:`af46f263e0e6d029435cd996dc054f5edd8763e1a40ec6fb10948a630b87d256`,reference_compiler:{repository:`micropython/micropython`,tag:`v1.28.0`,commit:`e0e9fbb17ed6fd06bb76e266ae554784c9c80804`,version_output:`MicroPython v1.28.0; mpy-cross emitting mpy v6.3`,portable_abi:774},reference_artifacts:[{path:`reference_mpy/ucsb_xrp_reference/__init__.mpy`,source:`reference_source/ucsb_xrp_reference/__init__.py`,source_sha256:`6ba1397570c949e84cbbe59a9008775069c5d80f227932abe44513d4495345a8`,byte_size:424,sha256:`0ccf0e57073268d47d184f119ba56af333d65f0264485a0db359c415f59deb01`},{path:`reference_mpy/ucsb_xrp_reference/challenge_1.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_1.py`,source_sha256:`52df7e1fcb9d7813368c01b1ebfc58cb7223a4b0c8908306f4677e4a93dbede4`,byte_size:4213,sha256:`ce95c6e5b44d9b0fb26122e32db8f06580d091f76ef3cacc1d0a1deec9904be2`},{path:`reference_mpy/ucsb_xrp_reference/challenge_2.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_2.py`,source_sha256:`fe68477478f24f5eb9c4825463383d72a6332223d4852bf981a84a794a2b12e1`,byte_size:1614,sha256:`7fad35be2bc10044afbdb4357fc71b12ed20e02e5079381d026da37da2b667c6`},{path:`reference_mpy/ucsb_xrp_reference/challenge_3.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_3.py`,source_sha256:`8ba4905123c18b29377cace6ee069ae8ea6f800ba4996eb24840775ae865aa00`,byte_size:1930,sha256:`2a0c300a84786662517d2c4afafe027e6af41caf97e9d3292476fb6ad855f9b3`},{path:`reference_mpy/ucsb_xrp_reference/challenge_4.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_4.py`,source_sha256:`db710b214816df7dc91861e8734043c4b3600bd6cfcac3a53ea645d0e9d7e4fd`,byte_size:639,sha256:`6498a5593c1f96741e37fb5acabdae0e6623e52da0d5495c2ff9843be3eb69eb`},{path:`reference_mpy/ucsb_xrp_reference/challenge_6.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_6.py`,source_sha256:`810a97b5b25b9affd12503b95fc9e655226e3f28b9e249ae14c4aa7e1a280017`,byte_size:853,sha256:`4f8d474266df637e586dbc35f11493e1bea0d2ab83d4ae7169a362480a6eaf89`},{path:`reference_mpy/ucsb_xrp_reference/challenge_7.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_7.py`,source_sha256:`96486ec05b791d10911cf7e12785dda7f6234ea90cf9b9a3959b7f8a95dea46b`,byte_size:1460,sha256:`e1651593c3ddd1ccbc4d41e20e93dd093fcbed0281f13eb4537b2e795af5b097`},{path:`reference_mpy/ucsb_xrp_reference/challenge_8.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_8.py`,source_sha256:`b0834141908c190ff6a624c47f4a23abe2e1684bf6049d280e46b620a90a8e49`,byte_size:1399,sha256:`b8fe42140d4716526179402017446dadb54fc626725f145c12c17c8fddbb0c0f`},{path:`reference_mpy/ucsb_xrp_reference/challenge_9.mpy`,source:`reference_source/ucsb_xrp_reference/challenge_9.py`,source_sha256:`794894d7af10e884c4a2496f3bb2910f4edf0d969937a0dff0d11bbd271c8010`,byte_size:1621,sha256:`40a7e819f7d4b8f08660c10ae9bd6ce004f2407efb0aab4053b9d3380ed38f14`}]}};function t(e){let t=new TextEncoder,n=t.encode(e),r=t.encode(`${n.byteLength}:`),i=new Uint8Array(r.byteLength+n.byteLength+1);return i.set(r,0),i.set(n,r.byteLength),i[i.byteLength-1]=59,i}function n(e){let n=[t(e.entrypoint)];for(let[r,i]of Object.entries(e.files).sort(([e],[t])=>e<t?-1:+(e>t)))n.push(t(r),t(i));let r=n.reduce((e,t)=>e+t.byteLength,0),i=new Uint8Array(r),a=0;for(let e of n)i.set(e,a),a+=e.byteLength;return i}function r(e){return Array.from(new Uint8Array(e),e=>e.toString(16).padStart(2,`0`)).join(``)}async function i(e){if(!globalThis.crypto?.subtle)throw Error(`This browser cannot calculate a project revision`);let t=n(e);return r(await globalThis.crypto.subtle.digest(`SHA-256`,t.buffer))}async function a(e){let t=e.entrypoint.split(`/`).at(-1)??`XRP project`;return{name:(e.name?.trim()||t).slice(0,80),entrypoint:e.entrypoint,revision:await i(e),stale:!1,...e.templateId?{templateId:e.templateId}:{}}}var o;function s(){return o??=new Promise((e,t)=>{let n=indexedDB.open(`ucsb-xrp-live-parameters`,1);n.onupgradeneeded=()=>n.result.createObjectStore(`settings`),n.onsuccess=()=>e(n.result),n.onerror=()=>{o=void 0,t(n.error)}})}async function c(e,t){if(!t||typeof indexedDB>`u`)return[];let n=await s();return new Promise((r,i)=>{let a=n.transaction(`settings`).objectStore(`settings`).get([e,t]);a.onsuccess=()=>r(a.result??[]),a.onerror=()=>i(a.error)})}async function l(e,t,n){let r=await s();return new Promise((i,a)=>{let o=r.transaction(`settings`,`readwrite`);o.objectStore(`settings`).put(n.map(({pendingValue:e,...t})=>t),[e,t]),o.oncomplete=()=>i(),o.onabort=()=>a(o.error),o.onerror=()=>a(o.error)})}async function u(e,t){return Object.fromEntries((await c(e,t)).map(e=>[e.name,e.value]))}function d(e){return e.templateId===`new_challenge_2_arena_line_circuit`||e.templateId===`complete_new_challenge_2_arena_line_circuit`}function f(e,t){return d(e)?{...e,files:{...e.files,"world.json":JSON.stringify({source_revision:t,default_world:`open-space`,worlds:[{id:`open-space`,label:`Open Floor`,bounds:{minimum_x_mm:-1e4,minimum_y_mm:-1e4,maximum_x_mm:1e4,maximum_y_mm:1e4},initial_pose:{x_mm:0,y_mm:0,heading_rad:0},boundary_walls:!1,range_sensor:{include_arena_boundary:!1},obstacles:[],tracks:[],markers:[]}]})}}:e}var p=class{sources=new Map;async execution(e){if(!d(e))return e;let t=await a(e),n=f(e,t.revision);if(n!==e){let e=(await a(n)).revision;this.sources.set(e,t)}return n}sourceRevision(e){return this.sources.get(e)?.revision??e}matchesExecution(e,t){if(!e)return!1;if(!d(t))return e===t.revision;let n=this.sources.get(e);return n?.revision===t.revision&&n.templateId===t.templateId}},m=`__ucsbXrpPageDepartureV1`;function h(){return typeof window>`u`?void 0:window}function g(e){return e[m]}function _(e,t){try{return t.parent===e&&t.location.origin===e.location.origin}catch{return!1}}function ee(e){try{let t=e.scope.parent;if(t===e.scope||!_(t,e.scope))return e;let n=g(t);if(n?.children?.().includes(e.scope))return n}catch{}return e}function te(e){if(e.dispatching)return!0;e.dispatching=!0;let t=!1;try{let n=new Set([e]);try{for(let t of e.children?.()??[]){if(!_(e.scope,t))continue;let r=g(t);r&&n.add(r)}}catch{t=!0}let r=[...n].flatMap(e=>[...e.participants]);for(let e of r)try{e.needsProtection?.()&&(t=!0)}catch{t=!0}for(let e of r)try{e.cancel?.()}catch{t=!0}return t}finally{e.dispatching=!1}}function ne(e){let t=g(e);if(t)return t;let n={scope:e,participants:new Set,dispatching:!1,beforeUnload:e=>{te(ee(n))&&(e.preventDefault(),e.returnValue=``)}};return Object.defineProperty(e,m,{configurable:!0,value:n}),e.addEventListener(`beforeunload`,n.beforeUnload),n}function re(e){e.participants.size>0||e.children||(e.scope.removeEventListener(`beforeunload`,e.beforeUnload),g(e.scope)===e&&Reflect.deleteProperty(e.scope,m))}function ie(e,t=h()){if(!t)return()=>void 0;let n=ne(t);return n.participants.add(e),()=>{n.participants.delete(e),re(n)}}async function ae(e=h()){if(!e)return;let t=g(e);if(!t)return;let n=ee(t),r=new Set([n]);for(let e of n.children?.()??[]){if(!_(n.scope,e))continue;let t=g(e);if(!t)throw Error(`The workspace is still opening. Try the link again when it is ready.`);r.add(t)}for(let e of r)for(let t of e.participants)await t.prepareNavigation?.()}function oe(e,t=h()){if(!t)return()=>void 0;let n=ne(t);return n.children=e,()=>{n.children===e&&(n.children=void 0),re(n)}}var se=class{reader;chunk=new Uint8Array;offset=0;constructor(e){this.reader=e}async fill(e){let t=0;for(;t<e.length;){if(this.offset===this.chunk.length){let e=await this.reader.read();if(e.done)throw Error(`Telemetry stream ended before its next complete frame`);if(this.chunk=e.value,this.offset=0,!this.chunk.length)continue}let n=Math.min(e.length-t,this.chunk.length-this.offset);e.set(this.chunk.subarray(this.offset,this.offset+n),t),this.offset+=n,t+=n}}async read(){let e=new Uint8Array(4);await this.fill(e);let t=new DataView(e.buffer).getUint32(0,!0);if(t<8||t>71680)throw Error(`Telemetry stream frame length is invalid`);let n=new Uint8Array(t);return await this.fill(n),n.buffer}cancel(){this.chunk=new Uint8Array,this.reader.cancel().catch(()=>void 0)}},ce=Object.freeze({minimumXmm:-1524,minimumYmm:-609.6,maximumXmm:1524,maximumYmm:609.6}),le=ce,v={defaultWorldId:`open`,worlds:[{id:`open`,label:`Course arena`,bounds:le,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[],markers:[{type:`start_box`,label:`Start`,minimumXmm:-120,minimumYmm:-120,maximumXmm:120,maximumYmm:120}]},{id:`delivery-gate-blocked`,label:`Delivery gate blocked`,bounds:le,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[{type:`block`,label:`Blocked gate`,minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100}],markers:[{type:`start_line`,label:`Start`,x1Mm:0,y1Mm:-140,x2Mm:0,y2Mm:140},{type:`waypoint`,label:`Delivery`,xMm:900,yMm:0}]}]};function y(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`${t} must be an object`);return e}function b(e,t,n){if(!Array.isArray(e)||e.length>n)throw Error(`${t} must be a list with at most ${n} items`);return e}function x(e,t){if(typeof e!=`number`||!Number.isFinite(e))throw Error(`${t} must be a finite number`);return e}function ue(e,t){if(typeof e!=`boolean`)throw Error(`${t} must be true or false`);return e}function de(e,t,n=64){if(typeof e!=`string`||!e.trim()||e.length>n)throw Error(`${t} must contain 1 to ${n} characters`);return e.trim()}function fe(e,t){return e===void 0?void 0:de(e,t,48)}function S(e,t){let n=de(e,t,32);if(!/^[a-z][a-z0-9_-]*$/.test(n))throw Error(`${t} must use lower-case letters, digits, underscores, and hyphens`);return n}function C(e,t){let n=new Set(t),r=Object.fromEntries(Object.entries(e).filter(([e])=>!n.has(e)));return Object.keys(r).length===0?{}:{additionalProperties:r}}function pe(e,t){let n=y(e,t),r={minimumXmm:x(n.minimum_x_mm,`${t}.minimum_x_mm`),minimumYmm:x(n.minimum_y_mm,`${t}.minimum_y_mm`),maximumXmm:x(n.maximum_x_mm,`${t}.maximum_x_mm`),maximumYmm:x(n.maximum_y_mm,`${t}.maximum_y_mm`)};if(r.maximumXmm<=r.minimumXmm||r.maximumYmm<=r.minimumYmm)throw Error(`${t} must have positive width and height`);return r}function w(e,t,n){return t>=e.minimumXmm&&t<=e.maximumXmm&&n>=e.minimumYmm&&n<=e.maximumYmm}function me(e,t){return t.minimumXmm>=e.minimumXmm&&t.maximumXmm<=e.maximumXmm&&t.minimumYmm>=e.minimumYmm&&t.maximumYmm<=e.maximumYmm}function he(e,t){let n=y(e,`worlds[${t}]`),r=pe(n.bounds,`worlds[${t}].bounds`),i=y(n.initial_pose??{x_mm:0,y_mm:0,heading_rad:0},`worlds[${t}].initial_pose`),a={xMm:x(i.x_mm,`worlds[${t}].initial_pose.x_mm`),yMm:x(i.y_mm,`worlds[${t}].initial_pose.y_mm`),headingRad:x(i.heading_rad,`worlds[${t}].initial_pose.heading_rad`)};if(a.xMm<r.minimumXmm||a.xMm>r.maximumXmm||a.yMm<r.minimumYmm||a.yMm>r.maximumYmm)throw Error(`worlds[${t}].initial_pose must be inside the bounds`);let o=b(n.obstacles??[],`worlds[${t}].obstacles`,32).map((e,n)=>{let i=y(e,`worlds[${t}].obstacles[${n}]`);if(i.type!==`block`&&i.type!==`wall`)throw Error(`worlds[${t}].obstacles[${n}].type must be block or wall`);let a=pe(i,`worlds[${t}].obstacles[${n}]`);if(!me(r,a))throw Error(`worlds[${t}].obstacles[${n}] must be inside the world bounds`);return{...a,type:i.type,label:fe(i.label,`worlds[${t}].obstacles[${n}].label`),feature:i.feature===void 0?void 0:S(i.feature,`worlds[${t}].obstacles[${n}].feature`)}}),s=o.flatMap(e=>e.feature===void 0?[]:[e.feature]);if(new Set(s).size!==s.length)throw Error(`worlds[${t}] obstacle feature names must be unique`);let c=b(n.tracks??[],`worlds[${t}].tracks`,8).map((e,n)=>{let i=`worlds[${t}].tracks[${n}]`,a=y(e,i);if(a.type!==`line`)throw Error(`${i}.type must be line`);let o=x(a.width_mm,`${i}.width_mm`),s=x(a.darkness,`${i}.darkness`),c=ue(a.closed??!1,`${i}.closed`);if(o<=0)throw Error(`${i}.width_mm must be positive`);if(s<0||s>1)throw Error(`${i}.darkness must be within [0, 1]`);let l=b(a.points,`${i}.points`,128).map((e,t)=>{let n=`${i}.points[${t}]`,a=y(e,n),o={xMm:x(a.x_mm,`${n}.x_mm`),yMm:x(a.y_mm,`${n}.y_mm`)};if(!w(r,o.xMm,o.yMm))throw Error(`${n} must be inside the world bounds`);return o});if(l.length<(c?3:2))throw Error(`${i}.points does not define a usable line`);for(let e=1;e<l.length;e+=1){let t=l[e-1],n=l[e];if(t.xMm===n.xMm&&t.yMm===n.yMm)throw Error(`${i}.points must not repeat adjacent points`)}return{type:`line`,name:a.name===void 0?void 0:S(a.name,`${i}.name`),label:fe(a.label,`${i}.label`),widthMm:o,darkness:s,closed:c,points:l}}),l=c.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(l).size!==l.length)throw Error(`worlds[${t}] track names must be unique`);let u=b(n.markers??[],`worlds[${t}].markers`,32).map((e,n)=>{let i=`worlds[${t}].markers[${n}]`,a=y(e,i),o=fe(a.label,`${i}.label`),s=a.name===void 0?void 0:S(a.name,`${i}.name`);if(a.type===`start_line`||a.type===`finish_line`){let e=x(a.x1_mm,`${i}.x1_mm`),t=x(a.y1_mm,`${i}.y1_mm`),n=x(a.x2_mm,`${i}.x2_mm`),c=x(a.y2_mm,`${i}.y2_mm`);if(e===n&&t===c)throw Error(`${i} must have two different endpoints`);if(!w(r,e,t)||!w(r,n,c))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,x1Mm:e,y1Mm:t,x2Mm:n,y2Mm:c,...C(a,[`type`,`name`,`label`,`x1_mm`,`y1_mm`,`x2_mm`,`y2_mm`])}}if(a.type===`start_box`||a.type===`finish_box`){let e=pe(a,i);if(!me(r,e))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,...e,...C(a,[`type`,`name`,`label`,`minimum_x_mm`,`minimum_y_mm`,`maximum_x_mm`,`maximum_y_mm`])}}if(a.type===`waypoint`){let e=x(a.x_mm,`${i}.x_mm`),t=x(a.y_mm,`${i}.y_mm`);if(!w(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`waypoint`,name:s,label:o,xMm:e,yMm:t,headingRad:a.heading_rad===void 0?void 0:x(a.heading_rad,`${i}.heading_rad`),...C(a,[`type`,`name`,`label`,`x_mm`,`y_mm`,`heading_rad`])}}if(a.type===`marker`){let e=x(a.x_mm,`${i}.x_mm`),t=x(a.y_mm,`${i}.y_mm`);if(!w(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`marker`,name:s,label:o,xMm:e,yMm:t,...C(a,[`type`,`name`,`label`,`x_mm`,`y_mm`])}}throw Error(`${i}.type is not a supported marker`)}),d=u.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(d).size!==d.length)throw Error(`worlds[${t}] marker names must be unique`);let f=n.range_sensor===void 0?void 0:y(n.range_sensor,`worlds[${t}].range_sensor`);return{id:S(n.id,`worlds[${t}].id`),label:de(n.label,`worlds[${t}].label`),bounds:r,initialPose:a,obstacles:o,tracks:c,markers:u,...n.boundary_walls===void 0?{}:{boundaryWalls:ue(n.boundary_walls,`worlds[${t}].boundary_walls`)},...f?.include_arena_boundary===void 0?{}:{includeArenaBoundaryInRange:ue(f.include_arena_boundary,`worlds[${t}].range_sensor.include_arena_boundary`)}}}function ge(e){if(e.length>64e3)throw Error(`world.json is too large`);let t;try{t=JSON.parse(e)}catch(e){throw Error(`world.json is not valid JSON: ${e instanceof Error?e.message:String(e)}`)}let n=y(t,`world.json`),r=b(n.worlds,`worlds`,8).map(he);if(r.length===0)throw Error(`worlds must contain at least one world`);if(new Set(r.map(e=>e.id)).size!==r.length)throw Error(`world IDs must be unique`);let i=S(n.default_world,`default_world`);if(!r.some(e=>e.id===i))throw Error(`default_world must name one of the worlds`);return{defaultWorldId:i,worlds:r}}var _e=`open-floor`,ve=[{id:`none`,label:`No obstacles`},{id:`divider`,label:`Divider wall`},{id:`square`,label:`200 × 200 mm square`},{id:`squares`,label:`Sparse 100 × 100 mm squares`},{id:`corridor`,label:`Parallel walls`},{id:`corner`,label:`L-shaped wall`},{id:`alcove`,label:`U-shaped alcove`},{id:`slalom`,label:`Staggered short walls`},{id:`gap`,label:`Wall with a 300 mm gap`}];function T(e,t,n,r){return{type:`wall`,minimumXmm:e,minimumYmm:t,maximumXmm:e+n,maximumYmm:t+r}}function E(e,t,n){return[T(e,t,n,8),T(e,t+n-8,n,8),T(e,t,8,n),T(e+n-8,t,8,n)]}function ye(e,t){if(t===`none`)return[];let n=e.bounds,r=Math.min(3048,n.maximumXmm-n.minimumXmm),i=Math.min(1219.2,n.maximumYmm-n.minimumYmm),a=Math.max(n.minimumXmm+r/2,Math.min(n.maximumXmm-r/2,e.initialPose.xMm)),o=Math.max(n.minimumYmm+i/2,Math.min(n.maximumYmm-i/2,e.initialPose.yMm)),s=a+r*.22,c=o,l=Math.min(800,i-40),u;switch(t){case`divider`:u=[T(s,n.minimumYmm,12,n.maximumYmm-n.minimumYmm)];break;case`square`:u=E(s-100,c-100,200);break;case`squares`:u=[E(s,c-300,100),E(s-320,c+160,100),E(s+330,c,100)].flat();break;case`corridor`:u=[T(s-380,c-260,760,12),T(s-380,c+248,760,12)];break;case`corner`:u=[T(s,c-250,12,500),T(s-400,c+238,412,12)];break;case`alcove`:u=[T(s,c-250,12,500),T(s-400,c-250,412,12),T(s-400,c+238,412,12)];break;case`slalom`:u=[T(a-650,o-400,12,300),T(a+350,o+100,12,300),T(a+1e3,o-400,12,300)];break;case`gap`:u=[T(s,c-l/2,12,(l-300)/2),T(s,c+150,12,(l-300)/2)]}let d=u.every(e=>e.minimumXmm>=n.minimumXmm&&e.maximumXmm<=n.maximumXmm&&e.minimumYmm>=n.minimumYmm&&e.maximumYmm<=n.maximumYmm&&e.maximumXmm>e.minimumXmm&&e.maximumYmm>e.minimumYmm),f=u.every(t=>e.initialPose.xMm<t.minimumXmm-110||e.initialPose.xMm>t.maximumXmm+110||e.initialPose.yMm<t.minimumYmm-110||e.initialPose.yMm>t.maximumYmm+110);return d&&f?u:null}function be(e,t){let n=2166136261;for(let t of e)n=Math.imul(n^t.charCodeAt(0),16777619);return`option-${(n>>>0).toString(16)}-${t}`}function xe(e){if(e.worlds.some(e=>e.baseWorldId))return e;let t=e.worlds.find(t=>t.id===e.defaultWorldId)??e.worlds[0],n={...t,id:_e,label:`Open floor (no walls)`,bounds:{minimumXmm:Math.min(-1e4,t.bounds.minimumXmm),minimumYmm:Math.min(-1e4,t.bounds.minimumYmm),maximumXmm:Math.max(1e4,t.bounds.maximumXmm),maximumYmm:Math.max(1e4,t.bounds.maximumYmm)},obstacles:[],boundaryWalls:!1,mapBounds:t.bounds,includeArenaBoundaryInRange:!1},r=e.worlds.some(e=>e.id===n.id)?e.worlds:[...e.worlds,n],i=r.flatMap(e=>ve.flatMap(t=>{if(t.id===`none`&&e.obstacles.length===0)return[];let n=ye(e,t.id);return n===null?[]:[{...e,id:be(e.id,t.id),baseWorldId:e.id,obstaclePresetId:t.id,obstacles:n}]}));return{...e,worlds:[...r,...i]}}function Se(e,t,n){let r=e.worlds.find(e=>e.id===t);if(!r)return;let i=e.worlds.find(e=>e.id===(r.baseWorldId??r.id));return n===`project`||n===`none`&&i?.obstacles.length===0?i:e.worlds.find(e=>e.baseWorldId===i?.id&&e.obstaclePresetId===n)}var Ce=192.5,we=Math.PI/12;Object.freeze(Array.from({length:9},(e,t)=>(t/8-.5)*we));function Te(e,t=70){return{xMm:e.xMm+t*Math.cos(e.headingRad),yMm:e.yMm+t*Math.sin(e.headingRad)}}Object.freeze({open:Object.freeze({label:`Course arena`,obstacles:Object.freeze([])}),"delivery-gate-blocked":Object.freeze({label:`Delivery gate blocked`,obstacles:Object.freeze([Object.freeze({minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100})])})}),Math.PI*60*1.5;var Ee=`world.json`;function D(e){let t=e.files[Ee],n=xe(t===void 0?v:ge(t));return e.worldSelection&&n.worlds.some(t=>t.id===e.worldSelection)?{...n,defaultWorldId:e.worldSelection}:n}function De(e){return{minimum_x_mm:e.minimumXmm,minimum_y_mm:e.minimumYmm,maximum_x_mm:e.maximumXmm,maximum_y_mm:e.maximumYmm}}function Oe(e){return{id:e.id,label:e.label,bounds:De(e.mapBounds??e.bounds),initial_pose:{x_mm:e.initialPose.xMm,y_mm:e.initialPose.yMm,heading_rad:e.initialPose.headingRad},boundary_walls:e.boundaryWalls!==!1,range_sensor:{include_arena_boundary:e.includeArenaBoundaryInRange!==!1},obstacles:e.obstacles.map(e=>({...De(e),type:e.type,...e.label?{label:e.label}:{},...e.feature?{feature:e.feature}:{}})),tracks:(e.tracks??[]).map(e=>({type:e.type,name:e.name,label:e.label,width_mm:e.widthMm,darkness:e.darkness,closed:e.closed,points:e.points.map(e=>({x_mm:e.xMm,y_mm:e.yMm}))})),markers:e.markers.map(e=>({...e.additionalProperties,type:e.type,name:e.name,label:e.label,...`minimumXmm`in e?De(e):`x1Mm`in e?{x1_mm:e.x1Mm,y1_mm:e.y1Mm,x2_mm:e.x2Mm,y2_mm:e.y2Mm}:{x_mm:e.xMm,y_mm:e.yMm,...`headingRad`in e&&e.headingRad!==void 0?{heading_rad:e.headingRad}:{}}}))}}function ke(e,t){let n=e.files[Ee],r=D(e).worlds.find(e=>e.id===t);if(!r)throw Error(`Unknown world '${t}'`);let i=n===void 0?{default_world:v.defaultWorldId,worlds:v.worlds.map(Oe)}:JSON.parse(n);if(i.default_world===t)return e;let a=i.worlds,o=r.baseWorldId??r.id,s={...a.find(e=>e.id===o),...Oe(r)},c=a.some(e=>e.id===t)?a:[...a,s];return{...e,files:{...e.files,[Ee]:`${JSON.stringify({...i,default_world:t,worlds:c},null,2)}\n`}}}var Ae=262144,je=98304,Me=/^[A-Za-z0-9._/-]+$/,Ne=new TextEncoder,Pe=class extends Error{code;constructor(e,t){super(t),this.code=e,this.name=`PortableProjectError`}};function O(e){throw new Pe(`invalid_project`,e)}function Fe(e){throw new Pe(`project_too_large`,e)}function Ie(e){typeof e!=`string`&&O(`Project file paths must be text`);let t=e.replaceAll(`\\`,`/`).replace(/^\/+|\/+$/g,``);return(t.length===0||t.split(`/`).some(e=>e===``||e===`.`||e===`..`))&&O(`File path '${e}' is invalid. Use named folders without empty, '.' or '..' sections.`),t.length>160&&O(`File path '${e}' has ${t.length} characters; XRP project paths may use at most 160.`),Me.test(t)||O(`File path '${e}' contains a character the XRP cannot store. Use letters, numbers, '-', '_', '.', and '/'.`),t}function k(e){(typeof e!=`object`||!e)&&O(`The project is not a valid project object`),(typeof e.files!=`object`||e.files===null||Array.isArray(e.files))&&O(`The project files are not a valid file collection`);let t=Object.entries(e.files);if(t.length===0&&O(`This project has no files. Add a Python file, then try again.`),t.length>48){let e=t.length-48;Fe(`This project has ${t.length} files; an XRP project may contain at most 48. Remove or move ${e} file${e===1?``:`s`}, then try again.`)}let n=Ie(e.entrypoint);n.endsWith(`.py`)||O(`The main file must be a Python (.py) file`);let r=[],i=new Set,a=0;for(let[e,n]of t){let t=Ie(e);i.has(t)&&O(`Two project files resolve to '${t}'. Rename one of them, then try again.`),typeof n!=`string`&&O(`Project file '${t}' must contain text`);let o=Ne.encode(n).byteLength;o>98304&&Fe(`File '${t}' uses ${o.toLocaleString(`en-US`)} bytes; each XRP project file may use at most ${je.toLocaleString(`en-US`)} bytes (96 KiB).${t.endsWith(`.py`)?``:` Move recordings or other files your program does not read into the Project's exports/ folder; those files remain on disk and are not sent to the XRP.`}`),a+=o,a>262144&&Fe(`The project files use ${a.toLocaleString(`en-US`)} bytes; an XRP project may use at most ${Ae.toLocaleString(`en-US`)} bytes (256 KiB).`),i.add(t),r.push([t,n])}return i.has(n)||O(`The main file '${n}' is not in the project`),e.name!==void 0&&(typeof e.name!=`string`||e.name.trim().length===0)&&O(`The project name must contain text`),{entrypoint:n,files:r,pythonPaths:r.map(([e])=>e).filter(e=>e.endsWith(`.py`)),totalBytes:a}}function A(e){try{return k(e),null}catch(e){if(e instanceof Pe)return e;throw e}}var Le=1e6,Re=1e6,ze=2048,Be=2048,Ve=80,He=/^[A-Za-z0-9._/-]+$/,Ue=/^\s*File\s+["']([^"']+)["'](?:,\s*line\s+(\d+)(?:,\s*in\s+.*)?)?\s*$/,We=/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt)):\s*(.*)$/,Ge=/^(.+?\.py):(\d+)(?::(\d+|none|null))?:\s*(.*)$/i,Ke=/\u001b\[[0-?]*[ -/]*[@-~]/g;function j(e,t){if(e===void 0)return;let n=typeof e==`number`?e:Number.parseInt(e,10);if(!(!Number.isFinite(n)||n<1))return Math.min(Math.trunc(n),t)}function qe(e,t){return e.length<=t?e:`${e.slice(0,Math.max(0,t-13))}… [truncated]`}function Je(e){let t=e.replaceAll(`\r
`,`
`).replaceAll(`\r`,`
`).split(`
`).map(e=>qe(e,Be));for(;t[0]===``;)t.shift();for(;t.at(-1)===``;)t.pop();if(t.length<=128)return t;let n=t.length-63-64;return[...t.slice(0,63),`… [${n} traceback lines omitted]`,...t.slice(-64)]}function Ye(e){let t=e.trim().replaceAll(`\\`,`/`);if(!(t.startsWith(`<`)&&t.endsWith(`>`))){if(t.startsWith(`/project/`))t=t.slice(9);else if(t.startsWith(`project/`))t=t.slice(8);else if(t.startsWith(`./`))t=t.slice(2);else if(t.startsWith(`/`)||/^[A-Za-z]:\//.test(t))return;if(t=t.replace(/^\/+|\/+$/g,``),!(t.length===0||t.length>160||!He.test(t)||t.split(`/`).some(e=>e===``||e===`.`||e===`..`)))return t}}function Xe(e){if(!e)return;let t=new Set;for(let n of e){let e=Ye(n);e&&t.add(e)}return t}function Ze(e,t){let n=Ye(e);if(n&&!(t&&!t.has(n)))return n}function Qe(e){return e.map(e=>e.replace(Ke,``)).filter(e=>e.trim().length>0)}function $e(e){return e.split(`
`).filter(e=>!/^\s*File "<stdin>", line \d+(?:, in .*)?\s*$/.test(e)).join(`
`).trim()}function M(e,t={}){let n=$e(String(e)),r=Je(n),i=Qe(r);if(i.length===0)return[];let a=Xe(t.projectPaths),o,s,c;for(let e of i){let t=Ue.exec(e);if(!t)continue;let n=Ze(t[1]??``,a);n&&(o=n,s=j(t[2],Le),c=1)}let l=t.code?.trim()||void 0,u=i.at(-1)?.trim()??n,d=We.exec(u);d&&(l=d[1],u=d[2]?.trim()||d[1]||u);let f=Ge.exec(u);if(f){let e=Ze(f[1]??``,a);e&&(o=e,s=j(f[2],Le),c=j(f[3],Re)),u=f[4]?.trim()||u}if(o===void 0&&s===void 0&&d===null&&l===void 0)return[];let p=s===void 0?void 0:{line:s,column:c??1},m=p?{line:p.line,column:Math.min(Re,p.column+1)}:void 0;return[{source:`micropython`,phase:t.phase??`compile`,severity:`error`,...l?{code:qe(l,Ve)}:{},message:qe(u||`MicroPython reported an error`,ze),...o?{path:o}:{},...p?{start:p,end:m}:{},raw:r}]}var et=2147483647,tt=Object.freeze({revision:0,parameters:[],watches:[],plots:[]});function nt(e,t){if(e.kind===`number`){if(typeof t!=`number`||!Number.isFinite(t)||e.minimum===void 0||e.maximum===void 0||e.step===void 0||e.step<=0||t<e.minimum||e.maximum!==null&&t>e.maximum)throw Error(`${e.label} is outside its declared range`);if(e.maximum===null){let n=new DataView(new ArrayBuffer(4));if(n.setFloat32(0,t,!0),!Number.isFinite(n.getFloat32(0,!0)))throw Error(`${e.label} must fit a finite 32-bit float`);return n.getInt32(0,!0)}let n=Math.round((t-e.minimum)/e.step);if(n<0||n>et)throw Error(`${e.label} declares too many steps`);return n}if(e.kind===`toggle`){if(typeof t!=`boolean`)throw Error(`${e.label} must be on or off`);return+!!t}if(typeof t!=`string`||!e.options?.includes(t))throw Error(`${e.label} is not one of its declared choices`);return e.options.indexOf(t)}function rt(e){if(e.length>32768)throw Error(`Student runtime state is malformed`);let t=JSON.parse(e),n=t?.plots??[];if(typeof t!=`object`||!t||!Number.isInteger(t.revision)||(t.revision??-1)<0||!Array.isArray(t.parameters)||!Array.isArray(t.watches)||!Array.isArray(n)||t.parameters.length>16||t.watches.length>16||n.length>16||!t.parameters.every(ct)||!t.watches.every(lt)||!n.every(ut)||new Set(t.parameters.map(e=>e.name)).size!==t.parameters.length||new Set(t.watches.map(e=>e.name)).size!==t.watches.length||new Set(n.map(e=>e.name)).size!==n.length)throw Error(`Student runtime state is malformed`);return{...t,plots:n}}function it(e){return typeof e==`boolean`||typeof e==`string`&&e.length<=64||typeof e==`number`&&Number.isFinite(e)}function at(e){return typeof e==`string`&&e.length>0&&e.length<=80}function ot(e){return typeof e==`string`&&e.length>0&&e.length<=32&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)}function st(e){return e===void 0||typeof e==`string`&&e.length<=24}function ct(e){if(typeof e!=`object`||!e)return!1;let t=e;if(!ot(t.name)||!at(t.label)||!st(t.unit)||![`number`,`toggle`,`choice`].includes(t.kind??``)||!it(t.value)||t.pendingValue!==void 0&&!it(t.pendingValue)||t.kind===`number`&&(typeof t.minimum!=`number`||!Number.isFinite(t.minimum)||typeof t.step!=`number`||!Number.isFinite(t.step)||t.step<=0||t.maximum!==null&&(typeof t.maximum!=`number`||!Number.isFinite(t.maximum)||t.maximum<=t.minimum||t.step>t.maximum-t.minimum||Math.round((t.maximum-t.minimum)/t.step)>et))||t.kind===`choice`&&(!Array.isArray(t.options)||t.options.length<2||t.options.length>6||t.options.some(e=>typeof e!=`string`||e.length>24)||new Set(t.options).size!==t.options.length))return!1;try{t.pendingValue!==void 0&&nt(t,t.pendingValue),nt(t,t.value)}catch{return!1}return!0}function lt(e){if(typeof e!=`object`||!e)return!1;let t=e;return ot(t.name)&&at(t.label)&&st(t.unit)&&it(t.value)}function ut(e){if(typeof e!=`object`||!e)return!1;let t=e;return ot(t.name)&&at(t.label)&&st(t.unit)&&typeof t.value==`number`&&Number.isFinite(t.value)}function N(){throw Error(`Sample plot values or descriptors are malformed`)}function dt(e){return rt(JSON.stringify({revision:0,parameters:[],watches:[],plots:e})).plots}function ft(e,t,n){if(e===void 0||e===null&&n===0)return null;(!Array.isArray(e)||e.length!==n)&&N();let r=null;return t!==void 0&&((!Array.isArray(t)||t.length>256)&&N(),r=t.map(e=>((!e||typeof e!=`object`||Array.isArray(e))&&N(),dt([{...e,value:0}])[0]))),e.map(e=>e===null?[]:((!Array.isArray(e)||e.length>16)&&N(),r!==null&&e.every(Array.isArray)?dt(e.map(e=>((e.length!==2||!Number.isSafeInteger(e[0])||e[0]<0||e[0]>=r.length||typeof e[1]!=`number`||!Number.isFinite(e[1]))&&N(),{...r[e[0]],value:e[1]}))):dt(e)))}var pt=[`rawDeviceTimeMs`,`acquiredAtMs`,`acquisitionSeq`,`rangeAcquiredAtMs`,`rangeSeq`,`diagnosticsAcquiredAtMs`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`,`rawRangeMm`,`publishedAtMs`,`sampleDtMs`,`samplePeriodMs`,`overrunMs`];function mt(e,t){if(e==null)return;if(!Array.isArray(e)||e.length!==16||t.length>200)throw Error(`Invalid telemetry timing record`);let n={version:1,clockId:t,clockBasis:`first-acquisition`};if(pt.forEach((t,r)=>{let i=e[r];if(i!==null&&(typeof i!=`number`||!Number.isFinite(i)))throw Error(`Invalid timing ${t}`);if(i!==null&&![`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i<0)throw Error(`Negative timing ${t}`);if([`rawDeviceTimeMs`,`acquisitionSeq`,`rangeSeq`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i!==null&&!Number.isSafeInteger(i))throw Error(`Invalid integer ${t}`);n[t]=i}),![`raw`,`course`,`stop`].includes(e[14]))throw Error(`Invalid timing kind`);if(n.kind=e[14],typeof e[15]!=`boolean`)throw Error(`Invalid range sampling flag`);return n.rangeSampled=e[15],n}function ht(e,t,n,r){if(t!==void 0&&(!Array.isArray(t)||t.length!==e.length))throw Error(`Unaligned telemetry timing`);if(n!==void 0&&(!Array.isArray(n)||n.length!==e.length))throw Error(`Unaligned telemetry diagnostics`);return e.map((e,i)=>{let a=Array.isArray(t)?mt(t[i],r):e.timing,o=Array.isArray(n)?n[i]:void 0;return o==null?{...e,...a?{timing:a}:{}}:{...e,...a?{timing:a}:{},...gt(o)}})}function gt(e){if(!Array.isArray(e)||e.length!==5)throw Error(`Invalid telemetry diagnostics`);let t=e=>{if(e===null)return null;if(!Array.isArray(e)||e.length!==3||e.some(e=>typeof e!=`number`||!Number.isFinite(e)))throw Error(`Invalid diagnostics vector`);return[...e]};if(e.slice(2,4).some(e=>e!==null&&(typeof e!=`number`||!Number.isFinite(e))))throw Error(`Invalid diagnostics value`);if(e[4]!==null&&(typeof e[4]!=`string`||e[4].length>512))throw Error(`Invalid diagnostics error`);return{accelerationMg:t(e[0]),angularRateMdps:t(e[1]),temperatureC:e[2],batteryV:e[3],sensorError:e[4]}}var _t=5e3,vt=3e4,yt=7e4;function bt(e){return typeof e==`string`&&e.trim().slice(0,1e3)||void 0}var xt=class{active=new Map;cancel(e){for(let[t,n]of this.active)(e===void 0||t===e)&&(this.active.delete(t),n.abort())}respond(e,t,n){this.cancel(e.requestId);let r=new AbortController;this.active.set(e.requestId,r);let i,a=()=>!r.signal.aborted&&this.active.get(e.requestId)===r,o=t=>{!a()||i===t||i===`source-verified`||(i=t,n({type:`project-run-snapshot-progress`,requestId:e.requestId,stage:i}))};Promise.resolve().then(()=>{if(a()){if(!t)throw Error(`The IDE is not ready to provide its current project.`);return t({signal:r.signal,sourceReadStarted:()=>o(`reading-source`),sourceVerified:()=>o(`source-verified`)})}}).then(t=>{a()&&n({type:`project-run-snapshot`,requestId:e.requestId,snapshot:t})},t=>{a()&&n({type:`project-run-snapshot`,requestId:e.requestId,error:t instanceof Error?t.message:String(t)})}).finally(()=>{this.active.get(e.requestId)===r&&this.active.delete(e.requestId)})}},St=class{pending=new Map;nextToken=0;generation=0;prepare(e,t){let n={token:`prepared-${++this.nextToken}`,snapshot:structuredClone(t)};return this.pending.set(e,n),structuredClone(n)}take(e,t){let n=this.pending.get(e);if(!n||n.token!==t)throw Error(`Run preparation changed or was cancelled. Select Run again to review the current Project.`);return this.pending.delete(e),n.snapshot}cancel(e,t){(t===void 0||this.pending.get(e)?.token===t)&&this.pending.delete(e)}invalidate(){this.generation+=1,this.pending.clear()}},Ct=e.release_id;e.release_sequence;var wt=e.compatibility.minimum_robot_release_sequence,Tt=e.service.protocol_version,Et=e.service.protocol_revision,Dt=e.course_api_revision,Ot=e.service.version,P=class extends Error{code;context;constructor(e,t,n={}){super(t),this.code=e,this.context=n,this.name=`PhysicalTargetError`}};function kt(e,t){let n=e=>e instanceof P?e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`?1:e.code===`network_error`||e.code===`timeout`?0:2:0;return n(t)>=n(e)?t:e}function F(e){let t=/^https?:\/\//i.test(e.trim())?e.trim():`http://${e.trim()}`,n=new URL(t);if(n.protocol!==`http:`&&n.protocol!==`https:`)throw Error(`Physical XRP address must use HTTP or HTTPS`);return n.pathname=n.pathname.replace(/\/+$/,``),n.search=``,n.hash=``,n.toString().replace(/\/$/,``)}function I(e,t,n=globalThis.location===void 0?void 0:globalThis.location.protocol){return n===`https:`&&new URL(e).protocol===`http:`?{...t,targetAddressSpace:`local`}:{...t}}function L(e){return e instanceof Error?e.message:String(e)}function R(){return typeof globalThis.performance?.now==`function`?globalThis.performance.now():Date.now()}function At(e){return`Run and telemetry use Wi-Fi. The computer and XRP must use the network selected during Robot Setup. If they are already on that network, select Reconnect. Browser detail: ${e} was not reachable; Chrome must be allowed to access devices on the local network.`}var jt=500,Mt=18e3,Nt=2,Pt=900,Ft=20,It=1e3,Lt=`row-v1`,Rt=24,z=`packed-v1`,zt=24,Bt=8,Vt=36,Ht=2048,Ut=65536,Wt=75,Gt=[85,88,84,49];function B(e){throw new P(`invalid_telemetry`,`XRP returned invalid compact telemetry: ${e}`)}function V(e,t){return(typeof e!=`number`||!Number.isFinite(e))&&B(`${t} is not a finite number`),e}function H(e,t){return e===null?null:V(e,t)}function Kt(e,t){return e===null?null:((!Array.isArray(e)||e.length!==3)&&B(`${t} is not a three-axis vector`),[V(e[0],`${t}[0]`),V(e[1],`${t}[1]`),V(e[2],`${t}[2]`)])}function qt(e,t){(!Array.isArray(e)||e.length!==20)&&B(`row-v1 requires exactly 20 row values`),(!Array.isArray(t)||t.length!==5)&&B(`row-v1 requires exactly five shared values`);let n=e[2],r=e[19],i=t[4];typeof n!=`boolean`&&B(`poseAvailable is not boolean`),typeof r!=`boolean`&&B(`buttonPressed is not boolean`),i!==null&&typeof i!=`string`&&B(`sensorError is not text or null`);let a=V(e[3],`xMm`),o=V(e[4],`yMm`),s=V(e[5],`headingRad`),c=V(e[1],`seq`);return(!Number.isSafeInteger(c)||c<0)&&B(`seq is not a nonnegative safe integer`),{tMs:V(e[0],`tMs`),seq:c,source:`physical`,poseAvailable:n,xMm:a,yMm:o,headingRad:s,estimatedPoseAvailable:n,estimatedXmm:n?a:null,estimatedYmm:n?o:null,estimatedHeadingRad:n?s:null,groundTruthPoseAvailable:!1,groundTruthXmm:null,groundTruthYmm:null,groundTruthHeadingRad:null,requestedForwardSpeedMmS:H(e[6],`requestedForwardSpeedMmS`),requestedTurnRateRadS:H(e[7],`requestedTurnRateRadS`),targetLeftWheelSpeedMmS:H(e[8],`targetLeftWheelSpeedMmS`),targetRightWheelSpeedMmS:H(e[9],`targetRightWheelSpeedMmS`),leftEffort:V(e[10],`leftEffort`),rightEffort:V(e[11],`rightEffort`),leftWheelSpeedMmS:V(e[12],`leftWheelSpeedMmS`),rightWheelSpeedMmS:V(e[13],`rightWheelSpeedMmS`),leftWheelDistanceMm:H(e[14],`leftWheelDistanceMm`),rightWheelDistanceMm:H(e[15],`rightWheelDistanceMm`),leftEncoderCount:V(e[16],`leftEncoderCount`),rightEncoderCount:V(e[17],`rightEncoderCount`),collision:!1,rangeMm:H(e[18],`rangeMm`),buttonPressed:r,accelerationMg:Kt(t[0],`accelerationMg`),angularRateMdps:Kt(t[1],`angularRateMdps`),temperatureC:H(t[2],`temperatureC`),batteryV:H(t[3],`batteryV`),sensorError:i}}function Jt(e,t,n){let r=e.getUint8(t);return r!==0&&r!==1&&B(`${n} is not boolean`),r===1}function U(e,t,n,r){return t&1<<n?(e!==0&&B(`${r} null sentinel is not canonical`),null):e}function Yt(e){let t=new Uint8Array(e);t.byteLength<Bt&&B(`packed-v1 header is truncated`);for(let e=0;e<Gt.length;e+=1)t[e]!==Gt[e]&&B(`packed-v1 magic is invalid`);let n=new DataView(e),r=n.getUint32(4,!0);r>Ut&&B(`packed-v1 metadata is too large`);let i=Bt+r;i>t.byteLength&&B(`packed-v1 metadata is truncated`);let a;try{a=JSON.parse(new TextDecoder(`utf-8`,{fatal:!0}).decode(t.subarray(Bt,i)))}catch{B(`packed-v1 metadata is not valid JSON`)}(typeof a!=`object`||!a||Array.isArray(a))&&B(`packed-v1 metadata is not an object`);let o=a;o.sampleEncoding!==void 0&&o.sampleEncoding!==z&&B(`packed-v1 metadata has the wrong encoding`),o.sampleCount!==void 0&&o.n!==void 0&&o.sampleCount!==o.n&&B(`packed-v1 sample counts disagree`);let s=o.sampleCount??o.n;if((!Number.isSafeInteger(s)||s<0||s>zt)&&B(`packed-v1 sampleCount must be 0 to ${zt}`),o.m!==void 0&&(o.m!==0&&o.m!==1&&B(`packed-v1 more-samples flag is invalid`),o.moreSamples!==void 0&&o.moreSamples!==(o.m===1)&&B(`packed-v1 more-samples values disagree`),o.moreSamples=o.m===1),o.s!==void 0){let e=[`ready`,`loading`,`running`,`error`];(!Number.isSafeInteger(o.s)||e[o.s]===void 0)&&B(`packed-v1 state code is invalid`),o.state!==void 0&&o.state!==e[o.s]&&B(`packed-v1 state values disagree`),o.state=e[o.s]}o.r!==void 0&&((!Number.isSafeInteger(o.r)||o.r<0)&&B(`packed-v1 run ID is invalid`),o.runId!==void 0&&o.runId!==o.r&&B(`packed-v1 run IDs disagree`),o.runId=o.r);let c=i,l;if(s>0){t.byteLength<c+Vt&&B(`packed-v1 shared diagnostics are truncated`);let e=n.getUint16(c,!0);e&-512&&B(`packed-v1 shared null mask has unsupported bits`);let r=e&7,i=e&56;r!==0&&r!==7&&B(`packed-v1 acceleration null mask is partial`),i!==0&&i!==56&&B(`packed-v1 angular-rate null mask is partial`);let a=Array.from({length:8},(t,r)=>U(n.getFloat32(c+2+r*4,!0),e,r,`shared[${r}]`)),o=n.getUint16(c+34,!0);o>Ht&&B(`packed-v1 sensor error is too large`);let s=c+Vt,u=s+o;u>t.byteLength&&B(`packed-v1 sensor error is truncated`);let d=!!(e&256);d&&o!==0&&B(`packed-v1 null sensor error has text`);let f=null;if(!d)try{f=new TextDecoder(`utf-8`,{fatal:!0}).decode(t.subarray(s,u))}catch{B(`packed-v1 sensor error is not valid UTF-8`)}l=[r===0?[a[0],a[1],a[2]]:null,i===0?[a[3],a[4],a[5]]:null,a[6],a[7],f],c=u}let u=c+s*Wt;t.byteLength!==u&&B(`packed-v1 row bytes do not match sampleCount`);let d=[];for(let t=0;t<s;t+=1){let n=c+t*Wt,r=new DataView(e,n,Wt),i=r.getUint8(9);i&128&&B(`packed-v1 null mask has unsupported bits`);let a=Array.from({length:13},(e,t)=>r.getFloat32(10+t*4,!0));d.push(qt([r.getUint32(0,!0),r.getUint32(4,!0),Jt(r,8,`poseAvailable`),a[0],a[1],a[2],U(a[3],i,0,`requestedForwardSpeedMmS`),U(a[4],i,1,`requestedTurnRateRadS`),U(a[5],i,2,`targetLeftWheelSpeedMmS`),U(a[6],i,3,`targetRightWheelSpeedMmS`),a[7],a[8],a[9],a[10],U(a[11],i,4,`leftWheelDistanceMm`),U(a[12],i,5,`rightWheelDistanceMm`),r.getInt32(62,!0),r.getInt32(66,!0),U(r.getFloat32(70,!0),i,6,`rangeMm`),Jt(r,74,`buttonPressed`)],l))}for(let e=1;e<d.length;e+=1)d[e].seq<=d[e-1].seq&&B(`packed-v1 sequence values are not strictly increasing`);let f=o;return f.sampleEncoding=z,f.sampleCount=s,f.sampleShared=l,f.samples=d,f}function Xt(t){let n=t.firmware,r=e.micropython.build_id;if(n?.implementation!==`micropython`||n.version!==e.micropython.version||n.board!==`SparkFun XRP Controller with RP2350`||r!==void 0&&n.buildId!==r)throw new P(`firmware_required`,n?.implementation===`micropython`&&n.version===e.micropython.version&&n.board===`SparkFun XRP Controller with RP2350`?`This XRP has MicroPython ${e.micropython.version}, but it needs the course firmware build. Open Robot Setup and install course firmware over USB, then reconnect.`:`This XRP needs the course MicroPython ${e.micropython.version} firmware for its RP2350 controller. Open Robot Setup and update the robot over USB, then reconnect.`)}function Zt(e){if(e.protocol!==Tt)throw new P(`protocol_mismatch`,`XRP protocol ${e.protocol} is not supported by this app`);if(typeof e.runtimeReleaseSequence!=`number`&&typeof e.courseApiRevision!=`string`&&typeof e.protocolRevision!=`number`){if(e.courseRelease===Ct&&(e.serviceVersion===Ct||e.serviceVersion===Ot)){Xt(e);return}throw new P(`release_mismatch`,`This XRP has course release ${e.courseRelease} and service ${e.serviceVersion}; this web app requires ${Ct}. Open Robot Setup, update the robot, then reconnect.`)}if(typeof e.protocolRevision!=`number`||e.protocolRevision<Et)throw new P(`protocol_mismatch`,`This XRP reports protocol revision ${String(e.protocolRevision)}; this app requires revision ${Et} or later. Open Robot Setup, update the robot, then reconnect.`);if(e.courseApiRevision!==Dt)throw new P(`release_mismatch`,`This XRP uses course API ${String(e.courseApiRevision)}; this app uses ${Dt}. Open Robot Setup, update the robot, then reconnect.`);if(typeof e.runtimeReleaseSequence!=`number`||e.runtimeReleaseSequence<wt)throw new P(`release_mismatch`,`This XRP has runtime ${e.runtimeRelease??e.courseRelease}; this app requires robot update ${wt} or later. Open Robot Setup, update the robot, then reconnect.`);Xt(e)}function Qt(e){return e?.trim().toLocaleLowerCase()||void 0}function W(e,t){let n=Qt(t);if(!n)return;let r=Qt(e.robotId);if(!r)throw new P(`robot_identity_missing`,`This XRP service cannot prove that it is the robot selected during setup. Open Robot Setup, then reconnect.`);if(r!==n)throw new P(`robot_identity_mismatch`,`The reachable XRP is ${r}, but this browser is configured for ${n}. Select the intended robot or run Robot Setup.`)}function $t(e,t){W(e,t),Zt(e);let n=[`project.check`,`project.prepare`,`program.run`,`program.stop`,`target.reset`,`telemetry.poll`].filter(t=>!e.capabilities?.includes(t));if(n.length>0)throw new P(`capability_mismatch`,`XRP service is missing ${n.join(`, `)}`)}var en=class{kind=`physical`;endpoint;fetchImplementation;activePollIntervalMs;pollIntervalMs;requestTimeoutMs;projectRequestTimeoutMs;connectTimeoutMs;expectedRobotId;pollCoordinatorGeneration;pollOwnerId;pollDrivenByVisibleClient;listeners=new Set;pollTimer=null;pollDueAtMs=null;pollInFlight=null;pollAbortController=null;pollGeneration=0;pollingPaused=!1;connected=!1;reconnecting=!1;pollConnectionFailed=!1;consecutivePollFailures=0;lastPackedUpdatesAtMs=null;lastVisiblePollAtMs=null;connectGeneration=0;nextRequest=1;nextEvent=1;eventSession=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;lastLogSeq=0;lastLogDeviceRunId;lastSampleSeq=0;bootId=null;lastRunId=0;currentProject=null;currentExecutionRevision;physicalProjectSources=new p;stagedProject=null;stagedProjectId=null;projectStateKnown=!1;info=null;requestStats=new Map;lastRuntimeJson=``;runtimeIdentity=``;acceptedParameterValues=new Map;runtimeRefreshGeneration=0;runtimeRefreshedGeneration=0;runtimeState=tt;lastWorldJson=``;currentState=`disconnected`;currentDetail=`Physical XRP disconnected`;projectRunProvider=null;projectRunBlockedReason;commandEpoch=0;preparedRuns=new St;controlSessionId=`browser-${typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;control=null;publishedControl=null;currentRun=null;runOutputIdentity=null;pendingRunOutputIdentity=null;stagedRunDescriptor=null;unsettledLaunch=!1;pendingSnapshotCancels=new Set;pendingCommandCancels=new Set;commandsInFlight=new Set;pendingStop=null;collectingStoppedRun=!1;telemetryStream=null;streamRunRenewal=!0;assertRunDataCollected(){if(this.collectingStoppedRun)throw new P(`run_data_pending`,`The program has stopped. Wait for its final run data to finish collecting before starting or preparing another project.`)}assertRunTelemetrySupported(){if(!this.connected)throw new P(`not_connected`,`Physical XRP is not connected`);if(this.info?.bootId!==this.bootId)throw new P(`boot_changed`,`The XRP restarted. Select Reconnect so UCSBXRP can check its current software before Run.`);if(!this.info?.capabilities.includes(`telemetry.packed-v1`))throw new P(`capability_mismatch`,`This XRP needs the current course software before Run can record data reliably. Open Robot Setup, update the XRP over USB, then reconnect.`)}interruptPendingCommands(){this.preparedRuns.invalidate(),this.commandEpoch+=1,this.clearPendingParameterFeedback();for(let e of this.pendingSnapshotCancels)e();for(let e of this.pendingCommandCancels)e()}waitForCommand(e,t){return new Promise((n,r)=>{let i=!1,a=e=>{i||(i=!0,this.pendingCommandCancels.delete(o),e())},o=()=>a(()=>r(new P(`operation_cancelled`,`Operation cancelled by Stop, Reset, or disconnection`)));this.pendingCommandCancels.add(o),e.then(e=>a(()=>n(e)),e=>a(()=>r(e))),(t!==this.commandEpoch||!this.connected)&&o()})}assertCommandEpoch(e){if(e!==this.commandEpoch||!this.connected)throw new P(`operation_cancelled`,`Operation cancelled by Stop, Reset, or disconnection`)}async claimControl(){this.preparedRuns.invalidate();let e=this.commandEpoch;await this.pausePollingForCommand();try{this.assertCommandEpoch(e),await this.acquireControl(!0)}finally{this.resumePollingAfterCommand(0,e)}}async acquireControl(e){if(!this.info?.capabilities.includes(`control.session-v1`))return;let t=await this.command(`control`,{bootId:this.bootId,sessionId:this.controlSessionId,takeover:e});this.consumeControl(t.control)}consumeControl(e){e&&(this.control=e,this.publishControl())}publishControl(){if(!this.info?.capabilities.includes(`control.session-v1`))return;let e=this.control?.sessionId===this.controlSessionId,t=this.control?.sessionId!=null,n=this.currentState===`ready`||this.currentState===`error`,r={type:`control`,owned:e,ownerPresent:t,canTakeover:!e&&n,detail:e?`This browser controls ${this.info.robotName}`:t?`Observing ${this.info.robotName}; another browser has control. Stop remains available.`:`${this.info.robotName} is available to control.`},i=this.publishedControl;(i?.owned!==r.owned||i.ownerPresent!==r.ownerPresent||i.canTakeover!==r.canTakeover||i.detail!==r.detail)&&(this.publishedControl=r,this.emit(r))}constructor(e,t={}){this.endpoint=F(e),this.fetchImplementation=t.fetch??((e,t)=>globalThis.fetch(e,t)),this.pollIntervalMs=t.pollIntervalMs??250,this.activePollIntervalMs=t.activePollIntervalMs??t.pollIntervalMs??Ft,this.requestTimeoutMs=t.requestTimeoutMs??3e3,this.projectRequestTimeoutMs=t.requestTimeoutMs??1e4,this.connectTimeoutMs=t.discoveryTimeoutMs??this.requestTimeoutMs,this.pollDrivenByVisibleClient=t.pollDrivenByVisibleClient===!0,this.expectedRobotId=Qt(t.expectedRobotId);let n=t.pollCoordinatorGeneration;if(Number.isSafeInteger(n)&&n>0){this.pollCoordinatorGeneration=n;let e=t.pollOwnerId?.trim();this.pollOwnerId=(e||this.eventSession).slice(0,64)}}async connect(){if(this.connected)return;let e=this.connectGeneration+1;this.connectGeneration=e;let t=`connect-${e}`;this.emitConsole(`system`,`Connecting to ${this.endpoint}`,{action:`connect`,phase:`request`,requestId:t}),this.emitStatus(`connecting`,`Connecting to ${this.endpoint}`);let n;try{n=await this.getJson(`/api/v1/info`,this.connectTimeoutMs),$t(n,this.expectedRobotId)}catch(n){if(e===this.connectGeneration){let e=L(n);this.emitConsole(`system`,`Connection failed · ${e}`,{action:`connect`,phase:`error`,requestId:t}),this.emitStatus(`error`,e)}throw n}if(e!==this.connectGeneration)return;this.reconcileReconnectedRun(n);let r=(this.collectingStoppedRun||this.currentRun!==null&&this.currentRun.finishedAtMs===void 0)&&this.bootId===n.bootId&&(n.runId===void 0||this.lastRunId===n.runId);this.info=n,this.bootId=n.bootId,this.lastRunId=n.runId??0,this.connected=!0,this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeProjectManifest(n.project),this.consumeRuntimeState(n.runtimeJson),this.consumeControl(n.control);let i=r?null:await this.readInitialState(n);if(e!==this.connectGeneration)return;try{await this.acquireControl(!1)}catch(e){if(!(e instanceof P)||e.code!==`control_owned`)throw e}if(e!==this.connectGeneration)return;this.emitStatus(r?`loading`:i?.state??`ready`,r?this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Reconnected; checking the program and collecting its remaining data…`:i?.detail??`${n.robotName} · ${this.connectionDescription(n)} · course ${n.courseRelease}`),this.emitConsole(`system`,`Connected to ${n.robotName} · ${this.connectionDescription(n)}`,{action:`connect`,phase:`result`,requestId:t}),this.emit({type:`project-provider`,active:this.projectRunProvider!==null,available:this.projectRunProvider!==null,...this.projectRunBlockedReason?{blockedReason:this.projectRunBlockedReason}:{}});let a=n.network?.mode,o=n.network?.address??n.address;(a===`access_point`||a===`station`)&&o&&this.emit({type:`physical-network`,mode:a,address:F(o),ssid:n.network?.ssid,...n.network?.requested_mode?{requestedMode:n.network.requested_mode}:{},...typeof n.network?.fallback==`boolean`?{fallback:n.network.fallback}:{},...n.robotId?{robotId:n.robotId}:{},...n.robotName?{hostname:n.robotName}:{}}),this.schedulePoll(0)}async readInitialState(e){if(!e.capabilities.includes(`logs.poll`)&&!e.capabilities.includes(`control.session-v1`))return null;try{let t=await this.getJson(`/api/v1/state?afterLogSeq=0`,Math.min(this.connectTimeoutMs,1500));if(t.bootId!==e.bootId)return null;let n=t.logs.reduce((e,t)=>Number.isSafeInteger(t.seq)&&(e===void 0||t.seq>e.seq)?t:e,void 0),r=Number.isSafeInteger(t.logTailSeq)&&t.logTailSeq>=(n?.seq??0)&&Number.isSafeInteger(t.logTailRunId)&&t.logTailRunId>=0;this.lastLogSeq=r?t.logTailSeq:n?.seq??0,this.lastLogDeviceRunId=r?t.logTailRunId:Number.isSafeInteger(n?.runId)&&n?.runId>=0?n?.runId:void 0,this.lastRunId=t.runId;let i=t.sample??t.samples?.at(-1);return i&&Number.isSafeInteger(i.seq)&&(this.lastSampleSeq=i.seq,this.emitTelemetry(i)),this.consumeProjectManifest(t.project),this.consumeRuntimeState(t.runtimeJson),t}catch{return null}}disconnect(){this.interruptPendingCommands(),this.connectGeneration+=1,this.connected=!1,this.pollGeneration+=1,this.stopPolling(),this.abortActivePoll(),this.lastPackedUpdatesAtMs=null,this.emitStatus(`disconnected`,`Physical XRP disconnected`)}connectionDescription(e){let t=e.network?.mode,n=e.network?.ssid;if(t===`access_point`){let t=e.network?.fallback?` fallback`:``;return`${n??`robot hotspot`}${t} · ${e.address}`}return t===`station`?`${n??`existing Wi-Fi`} · ${e.address}`:e.address}async check(e){if(e=structuredClone(e),this.preparedRuns.invalidate(),this.assertRunDataCollected(),this.currentState===`loading`||this.currentState===`running`)throw new P(`program_active`,`Stop the current run before compiling a Project.`);let t=this.commandEpoch,n=this.currentProject,r=e.name?.trim()||e.entrypoint,i=A(e);if(i){let e=`web-${Date.now()}-${this.nextRequest++}`;return this.emitConsole(`system`,`Compile requested · ${r}`,{action:`validate`,phase:`request`,requestId:e}),this.emitConsole(`system`,`Compilation failed · ${i.message}`,{action:`validate`,phase:`error`,requestId:e}),{ok:!1,detail:i.message,compilerOutput:[i.message]}}await this.pausePollingForCommand();try{this.assertCommandEpoch(t),await this.prepareWhilePollingPaused(e,void 0,{action:`validate`,label:`Compile`,detail:r},n);let i=`The Project compiled on the physical XRP.`;return{ok:!0,detail:i,compilerOutput:[i]}}catch(t){if(t instanceof P&&t.code===`syntax_error`)return{ok:!1,detail:t.message,compilerOutput:[t.message],diagnostics:M(t.message,{phase:`compile`,code:`syntax_error`,projectPaths:Object.keys(e.files)})};throw t}finally{this.resumePollingAfterCommand(0,t)}}async synchronize(e,t){this.preparedRuns.invalidate(),this.assertRunDataCollected();let n=this.commandEpoch;if(this.currentState===`loading`||this.currentState===`running`)throw new P(`program_active`,`Stop the current run before preparing a Project.`);let r=A(e);if(r)throw this.emitConsole(`system`,`Prepare failed · ${r.message}`,{action:`prepare`,phase:`error`}),r;await this.pausePollingForCommand();try{this.assertCommandEpoch(n),await this.prepareWhilePollingPaused(e,{...await a(e),...t?{projectId:t}:{}}),this.stagedProjectId=t??null}finally{this.resumePollingAfterCommand(0,n)}}async run(e,t){this.preparedRuns.invalidate(),this.assertRunDataCollected();let n=this.commandEpoch;k(e),this.assertRunTelemetrySupported();let r=t!==void 0&&t!==this.stagedProjectId;if(r&&(this.currentState===`loading`||this.currentState===`running`))throw new P(`program_active`,`Stop the current run before running a different Project.`);this.stagedProject=e,this.stagedProjectId=t??null;let i={...await a(e),...t?{projectId:t}:{}};this.assertCommandEpoch(n),this.stagedRunDescriptor={...i,...t?{projectId:t}:{}};let o=!1;await this.pausePollingForCommand();try{if(this.assertCommandEpoch(n),!this.currentProject||this.currentProject.stale||i.revision!==this.currentProject.revision||i.templateId!==this.currentProject.templateId||i.name!==this.currentProject.name||i.entrypoint!==this.currentProject.entrypoint||!this.physicalProjectSources.matchesExecution(this.currentExecutionRevision,i)){if(!this.info?.capabilities.includes(`project.run`))throw new P(`capability_mismatch`,`This XRP needs the current course software before it can run edited projects reliably. Open Robot Setup, update the XRP, then reconnect.`);o=await this.prepareAndStartWhilePollingPaused(e,i)}else{if(this.setCurrentProject(i),r){let t=D(e);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}o=await this.startCurrentProjectWhilePollingPaused()}o&&this.emit({type:`compile-result`,projectId:t,projectRevision:i.revision,result:{ok:!0,detail:`The Project compiled on the physical XRP.`,compilerOutput:[`The Project compiled on the physical XRP.`],diagnostics:[]}})}catch(n){throw n instanceof P&&n.code===`syntax_error`&&this.emit({type:`compile-result`,projectId:t,projectRevision:i.revision,runId:n.context.requestId,result:{ok:!1,detail:n.message,compilerOutput:[n.message],diagnostics:M(n.message,{phase:`compile`,code:`syntax_error`,projectPaths:Object.keys(e.files)})}}),n}finally{this.resumePollingAfterCommand(o?jt:0,n)}}async runCurrent(){this.assertRunDataCollected(),this.assertRunTelemetrySupported();let e=this.commandEpoch;if(this.preparedRuns.invalidate(),this.projectRunProvider){let t=await this.requestProjectSnapshot();this.assertCommandEpoch(e),await this.run(t.project,t.projectId);return}if(this.stagedProject&&(!this.currentProject||this.currentProject.stale)){await this.run(this.stagedProject,this.stagedProjectId??void 0);return}if(!this.currentProject){let e=new P(`no_project`,`No project is ready. Run or prepare a project in the IDE first.`);throw this.emitConsole(`system`,`Run failed · ${e.message}`,{action:`run`,phase:`error`}),e}if(this.currentProject.stale){let e=new P(`stale_project`,`The IDE project has changed. Run or prepare it in the IDE first.`);throw this.emitConsole(`system`,`Run failed · ${e.message}`,{action:`run`,phase:`error`}),e}if(this.currentState===`loading`||this.currentState===`running`){this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`});return}let t=!1;await this.pausePollingForCommand();try{this.assertCommandEpoch(e),this.stagedRunDescriptor=this.currentProject,t=await this.startCurrentProjectWhilePollingPaused()}finally{this.resumePollingAfterCommand(t?jt:0,e)}}requestProjectSnapshot(){let e=this.projectRunProvider;return e?new Promise((t,n)=>{let r=!1,i,a=Date.now()+_t,o=new AbortController,s=e=>{r||(r=!0,clearTimeout(u),o.abort(),this.pendingSnapshotCancels.delete(c),e())},c=()=>s(()=>n(Error(`Run cancelled before the IDE supplied its project.`))),l=()=>s(()=>n(Error(i===`source-verified`?`The active IDE could not finish preserving the run source. Return to that IDE and try Run again.`:i===`reading-source`?`The active IDE could not finish reading the Project files. Return to that IDE and try Run again.`:`The active IDE has not replied yet. Let its current operation finish, then try Run again. Its project remains selected.`))),u=setTimeout(l,_t);this.pendingSnapshotCancels.add(c);let d=e=>{if(!(r||i===e||i===`source-verified`)){if(Date.now()>=a){l();return}i=e,a=Date.now()+vt,clearTimeout(u),u=setTimeout(l,vt)}};Promise.resolve().then(()=>(Date.now()>=a&&l(),o.signal.throwIfAborted(),e({signal:o.signal,sourceReadStarted:()=>d(`reading-source`),sourceVerified:()=>d(`source-verified`)}))).then(e=>Date.now()>=a?l():s(()=>t(e)),e=>s(()=>n(e)))}):Promise.reject(Error(`Open the Project in the IDE before Run.`))}async prepareRunStart(e,t){this.assertRunDataCollected(),this.assertRunTelemetrySupported(),this.preparedRuns.invalidate();let n=this.preparedRuns.generation,r=this.commandEpoch,i=e?{project:e,projectId:t??``,revision:0}:await this.requestProjectSnapshot();if(this.assertCommandEpoch(r),n!==this.preparedRuns.generation)throw Error(`Run preparation changed. Select Run again.`);return k(i.project),this.preparedRuns.prepare(this,i)}async startPreparedRun(e){let t=this.preparedRuns.take(this,e);await this.run(t.project,t.projectId||void 0)}cancelPreparedRun(e){this.preparedRuns.cancel(this,e)}async prepareWhilePollingPaused(e,t,n,r=this.currentProject){this.assertRunDataCollected();let i=this.commandEpoch,o=t??await a(e);this.assertCommandEpoch(i);let s=D(e),c;try{if(c=await this.command(`prepare`,{project:e},n??{action:`prepare`,label:`Prepare`,detail:o.name},void 0,!0),c.project?.revision!==o.revision||c.project.lifetime!==`boot`)throw new P(`project_revision_mismatch`,`The XRP prepared a different project revision`)}catch(e){if(!(e instanceof P&&(e.code===`network_error`||e.code===`timeout`)))throw e;let t=await this.getJson(`/api/v1/info`,1500);if(this.assertCommandEpoch(i),Zt(t),W(t,this.expectedRobotId),t.bootId!==this.bootId)throw new P(`boot_changed`,`The XRP restarted while preparing. Reconnect before trying again.`);let n=this.sourceProjectManifest(t.project);if(n?.revision!==o.revision)throw e;c={detail:`Project prepared`,project:{...n,revision:o.revision,lifetime:`boot`}},this.emitConsole(`system`,`Prepare verified · ${o.name} is ready in XRP memory`,{action:`prepare`,phase:`result`})}this.currentExecutionRevision=c.project.executionRevision??c.project.revision,!(this.currentProject!==r&&this.currentProject?.stale)&&(this.setCurrentProject({...r?.revision===o.revision&&r.name===o.name&&r.entrypoint===o.entrypoint&&r.projectId?{projectId:r.projectId}:{},...o,revision:c.project.revision,name:c.project.name??o.name,entrypoint:c.project.entrypoint??o.entrypoint,stale:!1}),this.emitStatus(`ready`,c.detail),this.stagedProject=e,this.emit({type:`world`,catalog:s,selectedWorldId:s.defaultWorldId}))}async initialRunParameters(){let e=this.commandEpoch,t=await u(`physical`,this.stagedProjectId??this.currentProject?.projectId);if(this.assertCommandEpoch(e),Object.keys(t).length===0)return{};if(!this.info?.capabilities.includes(`runtime.initial-parameters`))throw new P(`capability_mismatch`,`Open Robot setup to update the XRP course runtime before using saved live controls.`);return{initialParameters:t}}async startCurrentProjectWhilePollingPaused(){if(this.assertRunDataCollected(),!this.currentProject)throw new P(`no_project`,`No project is ready. Run or prepare a project in the IDE first.`);if(this.currentProject.stale)throw new P(`stale_project`,`The IDE project has changed. Run or prepare it in the IDE first.`);if(this.currentState===`loading`||this.currentState===`running`)return this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`}),!1;let e=this.currentState;this.emitStatus(`loading`,`Starting ${this.currentProject.entrypoint}…`);try{let e=await this.command(`run`,await this.initialRunParameters(),{action:`run`,label:`Run`,detail:this.currentProject.name},void 0,!0);return e.runId!==this.lastRunId&&(this.lastSampleSeq=0),this.lastRunId=e.runId,this.bindRunOutputIdentity(e),this.unsettledLaunch=!1,this.emitStatus(`loading`,e.detail),!0}catch(t){throw t instanceof P&&t.code===`operation_cancelled`||(t instanceof P&&(t.code===`network_error`||t.code===`timeout`)?this.emitStatus(`error`,t.message):this.emitStatus(e,`Run failed · ${L(t)}`)),t}}async prepareAndStartWhilePollingPaused(e,t){if(this.assertRunDataCollected(),this.currentState===`loading`||this.currentState===`running`)return this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`}),!1;let n=this.currentState;this.emitStatus(`loading`,`Compiling and starting ${t.entrypoint}…`);try{let n=await this.command(`run`,{project:e,...await this.initialRunParameters()},{action:`run`,label:`Run`,detail:t.name},void 0,!0);if(n.project?.revision!==t.revision||n.project.lifetime!==`boot`)throw new P(`project_revision_mismatch`,`The XRP started a different project revision`);this.currentExecutionRevision=n.project.executionRevision??n.project.revision,this.setCurrentProject({...t,revision:n.project.revision,name:n.project.name??t.name,entrypoint:n.project.entrypoint??t.entrypoint,stale:!1}),this.stagedProject=e;let r=D(e);return this.emit({type:`world`,catalog:r,selectedWorldId:r.defaultWorldId}),n.runId!==this.lastRunId&&(this.lastSampleSeq=0),this.lastRunId=n.runId,this.bindRunOutputIdentity(n),this.unsettledLaunch=!1,this.emitStatus(`loading`,`Starting ${t.entrypoint}`),!0}catch(e){throw e instanceof P&&e.code===`operation_cancelled`||(e instanceof P&&(e.code===`network_error`||e.code===`timeout`)?this.emitStatus(`error`,e.message):this.emitStatus(n,`Run failed · ${L(e)}`)),e}}async markProjectStale(e,t){this.preparedRuns.invalidate();let n=await a(e),r=this.currentProject?.stale===!1&&this.currentProject.revision===n.revision&&this.currentProject.templateId===n.templateId&&this.currentProject.name===n.name&&this.currentProject.entrypoint===n.entrypoint&&this.physicalProjectSources.matchesExecution(this.currentExecutionRevision,n),i=t!==void 0&&t!==this.stagedProjectId,o=this.stagedProject===null||this.stagedProject.files[`world.json`]!==e.files[`world.json`]||i;if(o&&(this.currentState===`loading`||this.currentState===`running`))throw new P(`program_active`,`Stop the current run before opening a different Project or world.`);if(this.stagedProject=e,this.stagedProjectId=t??null,this.setCurrentProject({...n,...t?{projectId:t}:{},stale:!r}),o){let t=D(e);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}}setProjectRunProvider(e,t){if(this.projectRunProvider!==e){this.preparedRuns.invalidate();for(let e of this.pendingSnapshotCancels)e()}this.projectRunProvider=e,this.projectRunBlockedReason=e?bt(t?.blockedReason):void 0,this.connected&&this.emit({type:`project-provider`,active:e!==null,available:e!==null,...this.projectRunBlockedReason?{blockedReason:this.projectRunBlockedReason}:{}})}markProjectChanged(e){if(this.preparedRuns.invalidate(),(this.currentState===`loading`||this.currentState===`running`)&&(this.stagedProjectId===null||e.projectId!==this.stagedProjectId))return;let t=`ide:${e.projectId}:`;this.currentProject?.stale&&this.currentProject.revision===`${t}${e.revision}`&&this.currentProject.templateId===e.templateId&&this.currentProject.name===e.name&&this.currentProject.entrypoint===e.entrypoint||this.setCurrentProject({projectId:e.projectId,...e.templateId?{templateId:e.templateId}:{},name:e.name,entrypoint:e.entrypoint,revision:`${t}${e.revision}`,stale:!0})}stop(){return this.pendingStop||=this.performStop().finally(()=>{this.pendingStop=null}),this.pendingStop}async performStop(){this.streamRunRenewal=!1,this.interruptPendingCommands();let e=this.commandEpoch;this.emitStatus(`loading`,this.unsettledLaunch?`Stop requested; resolving the pending Run…`:`Stop requested; checking the XRP…`),this.reconnecting=!0,await this.pausePollingForCommand(!1);try{await Promise.allSettled([...this.commandsInFlight]),await this.resolveUnsettledLaunch();let e=await this.command(`stop`,{},{action:`stop`,label:`Stop`},void 0,!0);e.reconnecting?(this.emitStatus(`connecting`,`${e.detail}; reconnecting…`),await this.reconnectAfterReset()):e.detail===`Program already stopped`&&this.lastRunId===0&&!this.currentRun?this.emitStatus(`ready`,e.detail):(this.emitStatus(`loading`,e.detail),await this.waitForProgramStop())}catch(t){if(e!==this.commandEpoch||!this.connected)throw t;if(t instanceof P&&(t.code===`network_error`||t.code===`timeout`)){this.emitConsole(`system`,`Stop reply was interrupted · checking XRP state`,{action:`stop`,phase:`error`}),this.emitStatus(`connecting`,`Stop reply was interrupted; checking the XRP…`);try{await this.recoverAfterInterruptedStop();return}catch(n){if(e!==this.commandEpoch||!this.connected)throw n;t=n}}throw this.emitConsole(`system`,`Stop recovery failed · ${L(t)}`,{action:`stop`,phase:`error`}),this.emitStatus(this.collectingStoppedRun?`loading`:`error`,L(t)),t}finally{e===this.commandEpoch&&(this.reconnecting=!1),this.resumePollingAfterCommand(0,e)}}async reset(){this.streamRunRenewal=!1,this.interruptPendingCommands();let e=this.commandEpoch;this.emitStatus(`loading`,this.commandsInFlight.size>0?`Reset requested; waiting for the pending XRP request to settle…`:`Reset requested; checking the XRP…`),this.reconnecting=!0,await this.pausePollingForCommand();try{await Promise.allSettled([...this.commandsInFlight]),await this.resolveUnsettledLaunch(),await this.acquireControl(!1),(this.lastRunId>0||this.currentRun&&this.currentRun.finishedAtMs===void 0)&&(this.emitStatus(`loading`,`Stopping the program and collecting final run data before Reset…`),(await this.command(`stop`,{},{action:`stop`,label:`Stop before Reset`},void 0,!0)).reconnecting?await this.reconnectAfterReset():await this.waitForProgramStop());let e=await this.command(`reset`,{},{action:`reset`,label:`Reset`});e.reconnecting?(this.emitStatus(`connecting`,`${e.detail}; reconnecting…`),await this.reconnectAfterReset()):(e.detail===`Program state reset`?this.emitStatus(`ready`,e.detail):(this.emitStatus(`loading`,e.detail),await this.waitForProgramStop()),this.lastSampleSeq=0)}catch(t){throw e!==this.commandEpoch||!this.connected?t:(this.emitConsole(`system`,`Reset recovery failed · ${L(t)}`,{action:`reset`,phase:`error`}),this.emitStatus(this.collectingStoppedRun?`loading`:`error`,L(t)),t)}finally{e===this.commandEpoch&&(this.reconnecting=!1),this.resumePollingAfterCommand(0,e)}}async setRuntimeParameter(e,t){this.preparedRuns.invalidate();let n=this.commandEpoch,r=this.bootId,i=this.lastRunId;if(this.clearPendingParameterFeedback(e),!this.info?.capabilities.includes(`runtime.parameters`))throw new P(`capability_mismatch`,`This XRP service does not yet support live parameters`);this.assertCommandEpoch(n);let a=this.info.capabilities.includes(`runtime.parameter-ack-v1`),o=await this.command(`parameter`,{name:e,value:t,...a?{compactAck:!0}:{}});if(this.assertCommandEpoch(n),r!==this.bootId||i!==this.lastRunId)throw new P(`operation_cancelled`,`The run changed before its live-control update completed.`);if(a){if(o.accepted!==!0||o.name!==e||typeof o.value!=typeof t||typeof o.value==`number`&&!Number.isFinite(o.value))throw new P(`invalid_reply`,`The XRP returned an invalid live-control acknowledgement.`);let n=o.value,r=this.runtimeState.parameters.find(t=>t.name===e);r&&nt(r,n),this.acceptedParameterValues.set(e,n),this.runtimeState={...this.runtimeState,parameters:this.runtimeState.parameters.map(t=>t.name===e?{...t,pendingValue:t.value===n?void 0:n}:t)},this.emit({type:`runtime`,state:this.runtimeState}),this.runtimeRefreshGeneration+=1}else this.consumeRuntimeState(o.runtimeJson)}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}command(e,t,n,r,i=!1){let a=this.performCommand(e,t,n,r,i);return this.commandsInFlight.add(a),a.finally(()=>this.commandsInFlight.delete(a))}async performCommand(e,t,n,r,i=!1){let o=this.commandEpoch;if(!this.connected)throw new P(`not_connected`,`Physical XRP is not connected`);e!==`control`&&e!==`stop`&&e!==`check`&&(e!==`parameter`&&e!==`lease`||this.control?.sessionId!==this.controlSessionId)&&(await this.acquireControl(!1),this.assertCommandEpoch(o)),e===`run`&&this.assertRunTelemetrySupported();let s=`web-${this.eventSession}-${this.nextRequest++}`,c=this.bootId;n&&this.emitConsole(`system`,`${n.label} requested${n.detail?` · ${n.detail}`:``}`,{action:n.action,phase:`request`,requestId:s});try{let l;if(t.project){let e=t.project,n=await this.physicalProjectSources.execution(e);n!==e&&(l=(await a(n)).revision),t={...t,project:n},this.assertCommandEpoch(o)}let u=this.info?.capabilities.includes(`control.session-v1`)&&e!==`control`?{bootId:this.bootId,sessionId:this.controlSessionId,controlGeneration:this.control?.generation,runId:this.lastRunId,...e===`run`&&!t.project?{expectedProjectRevision:this.currentExecutionRevision??this.currentProject?.revision}:{}}:{},d=JSON.stringify({...t,...u,requestId:s}),f=this.info?.limits?.maxWorldBytes,p=t.project?.files[`world.json`];if(f!==void 0&&p!==void 0&&new TextEncoder().encode(p).byteLength>f)throw new P(`project_too_large`,`world.json exceeds this XRP's ${f}-byte limit. Simplify the world before running.`);let m=this.info?.limits?.maxRequestBodyBytes;if(m!==void 0&&new TextEncoder().encode(d).byteLength>m)throw new P(`project_too_large`,`This request exceeds the XRP's ${m}-byte limit. Remove unnecessary project files before running.`);let h=t.project&&(e===`check`||e===`prepare`||e===`run`)?this.projectRequestTimeoutMs:this.requestTimeoutMs,g=null;e===`run`&&(this.unsettledLaunch=!0);for(let t=0;t<(i?2:1);t+=1){this.assertCommandEpoch(o),e===`run`&&this.assertRunTelemetrySupported();try{let t=this.fetchJson(`/api/v1/${e}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:d},h,r);g=e===`run`?await t:await this.waitForCommand(t,o),this.assertCommandEpoch(o);break}catch(e){if(this.assertCommandEpoch(o),!(e instanceof P&&(e.code===`network_error`||e.code===`timeout`))||!i||t>0)throw e;n&&this.emitConsole(`system`,`${n.label} reply interrupted · retrying the same request`,{action:n.action,phase:`request`,requestId:s})}}if(!g)throw new P(`network_error`,`The XRP did not return a ${e} reply`);if(g.requestId!==s)throw new P(`uncorrelated_reply`,`The XRP returned a reply for a different request`);if(!g.ok||!g.result)throw new P(g.error?.code??`target_error`,g.error?.detail??`The XRP rejected the request`,{requestId:s});let _=g.result;if(_.project){if(l&&_.project.revision!==l)throw new P(`project_revision_mismatch`,`The XRP returned a different execution project revision`);_.project=this.sourceProjectManifest(_.project)}if(e===`run`&&c&&`bootId`in u&&u.bootId===c&&this.bootId===c){let e=g.result;Number.isSafeInteger(e.runId)&&e.runId>0&&(this.pendingRunOutputIdentity={bootId:c,deviceRunId:e.runId,requestId:s,result:e,commandEpoch:o})}if(n){let e=g.result,t=typeof e.detail==`string`?e.detail:`accepted`;this.emitConsole(`system`,`${n.label} · ${t}`,{action:n.action,phase:`result`,requestId:s})}return g.result}catch(t){throw e===`run`&&t instanceof P&&t.code===`syntax_error`&&t.context.requestId!==s&&(t=new P(`uncorrelated_reply`,`The XRP returned a compiler result for an unknown or different request. Run the selected Project again.`)),n&&this.emitConsole(`system`,`${n.label} failed · ${L(t)}`,{action:n.action,phase:`error`,requestId:s}),t}}bindRunOutputIdentity(e){this.streamRunRenewal=!0;let t=this.pendingRunOutputIdentity;if(this.pendingRunOutputIdentity=null,t?.result===e&&t.commandEpoch===this.commandEpoch&&t.bootId===this.bootId&&t.requestId===this.currentRun?.runId){this.runOutputIdentity={bootId:t.bootId,deviceRunId:t.deviceRunId,requestId:t.requestId};let e={source:`physical`,clockId:`physical:${t.bootId}:${t.deviceRunId}`,firstSequence:1};this.currentRun={...this.currentRun,telemetryOrigin:e},this.emit({type:`telemetry-origin`,runId:t.requestId,origin:e})}}async getJson(e,t=this.requestTimeoutMs,n){return this.fetchJson(e,{method:`GET`},t,n)}async fetchResponse(e,t,n,r,i){let a=r??new AbortController,o=R(),s=!1,c=!1,l=setTimeout(()=>{s=!0,a.abort()},n);try{return await i(await this.fetchImplementation(this.endpoint+e,{...I(this.endpoint,t),cache:t.method===`POST`?`default`:`no-store`,signal:a.signal}))}catch(r){if(c=!0,r instanceof P)throw r;let i=Math.round(R()-o),l=`${t.method??`GET`} ${e.split(`?`)[0]}`;throw a.signal.aborted||r instanceof DOMException&&r.name===`AbortError`?s?new P(`timeout`,`XRP did not reply within ${n/1e3} seconds. ${l} took ${i} ms. ${At(this.endpoint)}`):(c=!1,new P(`operation_cancelled`,`Cancelled ${l} after ${i} ms.`)):new P(`network_error`,`Cannot reach ${this.endpoint}: ${L(r)}. ${l} failed after ${i} ms. ${At(this.endpoint)}`)}finally{clearTimeout(l);let n=`${t.method??`GET`} ${e.split(`?`)[0]}`,r=Math.max(0,R()-o),i=this.requestStats.get(n)??{count:0,failures:0,totalMs:0,maxMs:0};i.count+=1,i.failures+=+!!c,i.totalMs+=r,i.maxMs=Math.max(i.maxMs,r),this.requestStats.set(n,i),c&&this.reportRequestStats()}}reportRequestStats(){if(!this.requestStats.size)return;let e=[...this.requestStats].map(([e,t])=>({request:e,count:t.count,failures:t.failures,meanMs:Math.round(t.totalMs/t.count),maxMs:Math.round(t.maxMs)}));this.requestStats.clear(),this.emitConsole(`system`,`Communication timing · ${JSON.stringify({endpoint:this.endpoint,bootId:this.bootId,runId:this.lastRunId,requests:e})}`,{action:`telemetry`,phase:`result`})}fetchJson(e,t,n=this.requestTimeoutMs,r){return this.fetchResponse(e,t,n,r,async e=>{let t=await e.json();if(!e.ok){let n=t;throw new P(n.error?.code??`http_${e.status}`,n.error?.detail??`XRP request failed with HTTP ${e.status}`,typeof n.requestId==`string`?{requestId:n.requestId}:{})}return t})}schedulePoll(e=this.pollIntervalMs){if(this.stopPolling(),!this.connected||this.pollingPaused)return;let t=Math.max(0,e);this.pollDueAtMs=R()+t;let n=setTimeout(()=>{this.pollTimer===n&&(this.pollTimer=null,!(this.pollDrivenByVisibleClient&&(this.lastVisiblePollAtMs===null||R()-this.lastVisiblePollAtMs>=It))&&this.startScheduledPoll())},t);this.pollTimer=n}requestPollIfDue(){this.lastVisiblePollAtMs=R(),this.telemetryStream&&this.renewStreamHeartbeat(this.telemetryStream),!(this.pollDueAtMs===null||R()<this.pollDueAtMs)&&this.startScheduledPoll()}startScheduledPoll(){if(!this.connected||this.pollingPaused||this.reconnecting||this.pollInFlight)return;this.stopPolling();let e=this.poll();this.pollInFlight=e,e.then(()=>{this.pollInFlight===e&&(this.pollInFlight=null,this.telemetryStream&&this.startScheduledPoll())},()=>{this.pollInFlight===e&&(this.pollInFlight=null)})}stopPolling(){this.pollTimer!==null&&(clearTimeout(this.pollTimer),this.pollTimer=null),this.pollDueAtMs=null}abortActivePoll(){this.closeTelemetryStream(),this.pollAbortController?.abort(),this.pollAbortController=null}async pausePollingForCommand(e=!0){let t=this.commandEpoch;this.pollingPaused=!0,this.pollGeneration+=1,this.stopPolling();let n=this.pollInFlight;n&&e&&await this.waitForCommand(n.catch(()=>void 0),t)}resumePollingAfterCommand(e=0,t=this.commandEpoch){t===this.commandEpoch&&(this.pollingPaused=!1,this.schedulePoll(e))}async poll(){if(!this.connected||this.reconnecting)return;let e=R(),t=this.pollGeneration,n=new AbortController;this.pollAbortController=n;try{let r=await this.readRecoverableState(this.requestTimeoutMs,()=>{if(!this.connected||this.reconnecting||t!==this.pollGeneration)throw new P(`operation_cancelled`,`An obsolete telemetry poll was cancelled`)},n);if(!this.connected||this.reconnecting||t!==this.pollGeneration)return;this.pollConnectionFailed&&(this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.emitConsole(`system`,`XRP connection restored`,{action:`telemetry`,phase:`result`})),this.consecutivePollFailures=0;let i=this.lastLogSeq,a=this.lastSampleSeq;this.consumeState(r);let o=r.moreLogs===!0||r.moreSamples===!0,s=this.lastLogSeq>i||this.lastSampleSeq>a,c=r.state===`running`?this.activePollIntervalMs:this.pollIntervalMs,l=Math.max(0,R()-e);this.telemetryStream||this.schedulePoll(o&&s?0:Math.max(0,c-l))}catch(e){if(this.connected&&!this.reconnecting&&!this.pollingPaused&&t===this.pollGeneration){if(e instanceof P&&e.code===`telemetry_owner_active`){if(e.context.ownerGeneration===this.pollCoordinatorGeneration&&typeof e.context.leaseRemainingMs==`number`){let t=Math.max(0,e.context.leaseRemainingMs);this.pollConnectionFailed=!0,this.emitConsole(`system`,`A previous UCSBXRP page still owns telemetry; retrying automatically in at most ${t} ms`,{action:`telemetry`,phase:`error`}),this.emitStatus(`connecting`,`Waiting briefly for the previous page to release XRP telemetry…`),this.schedulePoll(t);return}this.pollConnectionFailed=!0,this.consecutivePollFailures=Nt,this.emitConsole(`system`,`Telemetry paused · ${e.message}`,{action:`telemetry`,phase:`error`}),this.emitStatus(`error`,e.message);return}this.consecutivePollFailures+=1,this.pollConnectionFailed||(this.pollConnectionFailed=!0,this.emitConsole(`system`,`Telemetry connection interrupted · ${L(e)}`,{action:`telemetry`,phase:`error`})),this.consecutivePollFailures>=Nt?this.emitStatus(this.collectingStoppedRun?`loading`:`error`,this.collectingStoppedRun?`Program stopped; final run data is still incomplete. Check the XRP connection and select Stop to retry collection.`:L(e)):(this.emitStatus(this.collectingStoppedRun?`loading`:`connecting`,this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Telemetry was interrupted; reconnecting to the XRP…`),this.schedulePoll(Pt))}}finally{this.pollAbortController===n&&(this.pollAbortController=null)}}telemetryPath(e,t,n){let r=`/api/v1/telemetry?afterLogSeq=${e}&afterSampleSeq=${t}`;if(n!==void 0&&(r+=`&runId=${n}`),this.info?.capabilities.includes(`telemetry.packed-v1`)){r+=`&sampleEncoding=${z}`;let e=R(),t=this.runtimeRefreshGeneration!==this.runtimeRefreshedGeneration||this.lastPackedUpdatesAtMs===null||e-this.lastPackedUpdatesAtMs>=this.pollIntervalMs;r+=`&includeUpdates=${t?`1`:`0`}`,t&&(this.lastPackedUpdatesAtMs=e)}else this.info?.capabilities.includes(`telemetry.compact-v1`)&&(r+=`&sampleEncoding=${Lt}`);return this.pollCoordinatorGeneration!==void 0&&this.pollOwnerId!==void 0&&(r+=`&pollGeneration=${this.pollCoordinatorGeneration}`,r+=`&pollOwner=${encodeURIComponent(this.pollOwnerId)}`),this.info?.capabilities.includes(`control.session-v1`)&&(n===void 0&&(r+=`&runId=${this.lastRunId}`),r+=`&bootId=${encodeURIComponent(this.bootId??``)}&sessionId=${encodeURIComponent(this.controlSessionId)}&controlGeneration=${this.control?.generation??0}`),r}closeTelemetryStream(){let e=this.telemetryStream;this.telemetryStream=null,e&&(e.heartbeatTimer!==null&&clearTimeout(e.heartbeatTimer),e.heartbeatController?.abort(),e.controller.abort(),e.reader.then(e=>e.cancel(),()=>void 0),this.emitConsole(`system`,`Telemetry stream timing · ${JSON.stringify({identity:e.key,...e.stats,device:e.deviceStats})}`,{action:`telemetry`,phase:`result`}))}armStreamHeartbeat(e){e.heartbeatTimer=setTimeout(()=>{e.heartbeatTimer=null,!(this.telemetryStream!==e||!this.connected)&&(this.renewStreamHeartbeat(e),this.armStreamHeartbeat(e))},1e3)}renewStreamHeartbeat(e){let t=R();if(!(t<e.heartbeatDueAtMs)&&(e.heartbeatDueAtMs=t+1e3,(!this.pollDrivenByVisibleClient||this.lastVisiblePollAtMs!==null&&t-this.lastVisiblePollAtMs<It)&&!e.heartbeatInFlight&&e.lastFrameAtMs!==null&&t-e.lastFrameAtMs<1e3&&this.control?.sessionId===this.controlSessionId)){e.heartbeatInFlight=!0;let t=new AbortController;e.heartbeatController=t,this.performCommand(`lease`,{renewRun:this.streamRunRenewal},void 0,t).catch(t=>{this.telemetryStream===e&&!(t instanceof P&&t.code===`operation_cancelled`)&&this.closeTelemetryStream()}).finally(()=>{t.abort(),e.heartbeatController===t&&(e.heartbeatController=null),e.heartbeatInFlight=!1})}}readStreamTelemetry(e,t){let n=`${this.bootId}:${this.lastRunId}:${this.control?.generation}`;if(this.telemetryStream?.key!==n&&this.closeTelemetryStream(),!this.telemetryStream){let t=new AbortController,r=e.replace(`/api/v1/telemetry?`,`/api/v1/telemetry/stream?`);this.pollCoordinatorGeneration===void 0&&(r+=`&pollGeneration=20&pollOwner=${encodeURIComponent(this.eventSession)}`);let i=this.fetchImplementation(this.endpoint+r,{...I(this.endpoint,{method:`GET`}),cache:`no-store`,signal:t.signal}).then(async e=>{if(!e.ok){let t=await e.json();throw new P(t.error?.code??`http_${e.status}`,t.error?.detail??`XRP telemetry subscription failed`)}if(!e.body)throw new P(`invalid_reply`,`XRP telemetry response has no readable body`);return new se(e.body.getReader())});this.telemetryStream={key:n,controller:t,reader:i,current:null,pending:null,first:!0,lastFrameAtMs:null,heartbeatTimer:null,heartbeatInFlight:!1,heartbeatDueAtMs:R()+1e3,heartbeatController:null,stats:{frames:0,rows:0,bytes:0,backlogFrames:0,receiveGapMaxMs:0,parseMaxMs:0},lastSampleFrameAtMs:null,deviceStats:{}},this.armStreamHeartbeat(this.telemetryStream)}let r=this.telemetryStream;return r.current?Promise.resolve(r.current):(r.pending||=(async()=>{let e=!1,n=setTimeout(()=>{e=!0,r.controller.abort()},t);try{let e=await(await r.reader).read();if(this.telemetryStream!==r)throw new P(`operation_cancelled`,`Obsolete telemetry subscription`);let t=R(),n=Yt(e);typeof n.bootId==`string`&&(this.lastPackedUpdatesAtMs=R(),this.runtimeRefreshedGeneration=this.runtimeRefreshGeneration);let i=this.normalizeTelemetry(n,!r.first);if(i.bootId!==this.bootId||i.runId!==this.lastRunId)throw new P(`stale_run`,`Telemetry subscription identity changed`);r.first=!1,r.lastFrameAtMs=R(),r.stats.frames+=1,r.stats.bytes+=e.byteLength,r.stats.rows+=i.samples?.length??0,r.stats.backlogFrames+=+(i.moreSamples===!0),r.stats.parseMaxMs=Math.max(r.stats.parseMaxMs,r.lastFrameAtMs-t),i.samples?.some(e=>e.seq>this.lastSampleSeq)&&(r.lastSampleFrameAtMs!==null&&(r.stats.receiveGapMaxMs=Math.max(r.stats.receiveGapMaxMs,r.lastFrameAtMs-r.lastSampleFrameAtMs)),r.lastSampleFrameAtMs=r.lastFrameAtMs);for(let e of[`frames`,`rows`,`encodeMaxMs`,`writeMaxMs`]){let t=i.streamDiagnostics?.[e];typeof t==`number`&&Number.isFinite(t)&&t>=0&&(r.deviceStats[e]=t)}return r.current=i,i}catch(n){throw this.telemetryStream===r&&this.closeTelemetryStream(),e?new P(`timeout`,`XRP telemetry stream made no complete-frame progress within ${t/1e3} seconds`):n}finally{clearTimeout(n)}})(),r.pending)}async readTelemetry(e,t,n){if(this.info?.capabilities.includes(`telemetry.stream-v1`)&&this.lastRunId>0&&this.control?.sessionId===this.controlSessionId&&(this.telemetryStream!==null||this.currentState===`running`||this.collectingStoppedRun||this.currentRun!==null&&this.currentRun.finishedAtMs===void 0))return this.readStreamTelemetry(e,t);let r=this.info?.capabilities.includes(`telemetry.packed-v1`)?await this.getPackedTelemetry(e,t,n):await this.getJson(e,t,n);return this.normalizeTelemetry(r,e.includes(`includeUpdates=0`))}normalizeTelemetry(e,t){if(e.pollOwnership?.accepted===!1){let t=e.pollOwnership.ownerGeneration,n=e.pollOwnership.leaseRemainingMs;throw new P(`telemetry_owner_active`,`Another UCSBXRP page is coordinating this robot${t===null?``:` (poll generation ${t})`}. Close or reload older UCSBXRP pages, then select Reconnect${typeof n==`number`?`; takeover is available in at most ${n} ms`:``}.`,{ownerGeneration:t,...typeof n==`number`?{leaseRemainingMs:n}:{}})}let n=e;if(n.sampleEncoding===z){let r=e;if(!(typeof r.bootId==`string`&&(r.state===`ready`||r.state===`loading`||r.state===`running`||r.state===`error`)&&typeof r.detail==`string`&&Number.isSafeInteger(r.runId)&&r.runId>=0&&Array.isArray(r.logs))){let e=this.bootId??this.info?.bootId;(!t||!e||r.state!==`running`||!Number.isSafeInteger(r.runId)||r.runId<1)&&B(`packed-v1 state metadata is incomplete`),n={...r,bootId:e,state:`running`,detail:this.currentState===`running`?this.currentDetail:`Program running`,runId:r.runId,logs:[]}}}if(n.sampleEncoding===Lt){Array.isArray(n.sampleRows)||B(`encoding or rows are unsupported`),n.sampleRows.length>Rt&&B(`row-v1 exceeds the ${Rt}-row page limit`),n.sampleRows.length>0&&n.sampleShared===void 0&&B(`shared values are missing`);let e=n.sampleRows.map(e=>qt(e,n.sampleShared));for(let t=1;t<e.length;t+=1)e[t].seq<=e[t-1].seq&&B(`row-v1 sequence values are not strictly increasing`);n.samples=e}else n.sampleEncoding!==void 0&&n.sampleEncoding!==z&&B(`encoding is unsupported`);try{let e=ft(n.samplePlots,n.samplePlotDescriptors,n.samples?.length??0);e&&(n.samples=n.samples?.map((t,n)=>({...t,plotValues:e[n]})))}catch{B(`samplePlots contains invalid or unaligned plot values`)}try{let e=`physical:${n.bootId}:${n.runId}`;if(n.samples){let t=n.sampleTiming??n.samples.map(e=>e.timingValues??null);n.samples=ht(n.samples,t,n.sampleDiagnostics,e)}if(n.sample){let t=mt(n.sample.timingValues,e);t&&(n.sample={...n.sample,timing:t})}}catch{B(`sample timing or diagnostics are invalid or unaligned`)}return n}getPackedTelemetry(e,t,n){let r=this.runtimeRefreshGeneration;return this.fetchResponse(e,{method:`GET`},t,n,async e=>{if(!e.ok){let t={};try{t=await e.json()}catch{}throw new P(t.error?.code??`http_${e.status}`,t.error?.detail??`XRP request failed with HTTP ${e.status}`)}let t=Yt(await e.arrayBuffer());return typeof t.bootId==`string`&&(this.lastPackedUpdatesAtMs=R(),this.runtimeRefreshedGeneration=r),t})}consumeState(e,t=!0){let n=e.bootId!==this.bootId,r=e.runId!==this.lastRunId;(n||r)&&this.lastRunId>0&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.emitStatus(`error`,`${n?`The XRP restarted`:`The XRP changed runs`} before its remaining data could be collected. This recording is incomplete.`,!0),this.runOutputIdentity&&(this.runOutputIdentity.bootId!==e.bootId||this.runOutputIdentity.deviceRunId!==e.runId)&&(this.runOutputIdentity=null),n&&(this.bootId=e.bootId,this.lastLogSeq=0,this.lastLogDeviceRunId=void 0),(n||r)&&(this.lastSampleSeq=0,this.collectingStoppedRun=!1),this.lastRunId=e.runId,this.consumeControl(e.control),this.consumeProjectManifest(e.project),this.consumeRuntimeState(e.runtimeJson);let i=e.state===`error`&&e.detail.toLowerCase().includes(`program stopped after an exception`),a=i?`ready`:e.state,o=e.samples!==void 0&&e.moreSamples===!1&&(a===`ready`||a===`error`),s=[];e.samples===void 0?e.sample&&(t&&this.emitTelemetry(e.sample),this.lastSampleSeq=e.sample.seq):(s=[...e.samples].sort((e,t)=>e.seq-t.seq),o||this.publishBatchedSamples(e.bootId,s,a===`running`||e.moreSamples===!0,t,(a===`ready`||a===`error`)&&e.moreSamples===!0));let c=[...e.logs].sort((e,t)=>e.seq-t.seq);for(let t of c){if(!Number.isSafeInteger(t.seq)||t.seq<=this.lastLogSeq)continue;let n=Number.isSafeInteger(t.runId)&&t.runId>=0?t.runId:void 0,r=this.runOutputIdentity;if(t.seq>this.lastLogSeq+1){let i=this.lastLogSeq+1,a=t.seq-1,o=a-i+1,s=r?.bootId===e.bootId&&r.deviceRunId===n&&this.lastLogDeviceRunId===n?r.requestId:void 0;s!==void 0&&this.currentRun?.runId===s&&this.currentRun.finishedAtMs===void 0&&(this.currentRun={...this.currentRun,droppedOutputLines:(this.currentRun.droppedOutputLines??0)+o}),this.emitConsole(`system`,`XRP log gap · ${o} line${a===i?``:`s`} unavailable`,{action:`telemetry`,phase:`error`,omittedOutputLines:o,eventId:`${e.bootId}:log-gap:${i}-${a}`,requestId:s,deviceBootId:e.bootId,deviceRunId:n})}this.lastLogSeq=t.seq,this.lastLogDeviceRunId=n,this.emitConsole(t.stream,t.line,{phase:t.stream===`system`?`result`:`output`,eventId:`${e.bootId}:log:${t.seq}`,targetTimeMs:t.tMs,targetClockId:`physical:${e.bootId}:service-uptime`,deviceBootId:e.bootId,deviceRunId:n,requestId:r&&n===r.deviceRunId&&r.requestId===this.currentRun?.runId?r.requestId:void 0})}a===`ready`&&e.moreLogs!==!0&&e.samples===void 0&&e.sample===void 0&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.info?.capabilities.includes(`control.session-v1`)&&this.control?.sessionId!==this.controlSessionId&&(this.collectingStoppedRun=!1,this.emitStatus(`error`,`The program stopped, but its final telemetry could not be collected after this browser lost control of the XRP. This recording is incomplete.`,!0));let l=(this.currentRun!==null&&this.currentRun.finishedAtMs===void 0||e.samples!==void 0||e.sample!==void 0)&&(a===`ready`||a===`error`)&&(e.moreLogs===!0||e.moreSamples===!0||this.collectingStoppedRun&&e.samples===void 0&&e.sample===void 0);if(this.collectingStoppedRun=a===`ready`&&l,this.collectingStoppedRun&&this.emitStatus(`loading`,`Program stopped; collecting final run data…`),!l)(a!==`running`||this.pendingStop===null)&&this.emitStatus(a,e.detail,a===`error`,i?`program`:void 0),o&&this.publishBatchedSamples(e.bootId,s,!1,t);else if(o){let e=s.at(-1)?.seq;e!==void 0&&Number.isSafeInteger(e)&&e>this.lastSampleSeq&&(this.lastSampleSeq=e)}let u=this.telemetryStream;u?.current===e&&(u.current=null,u.pending=null,(a===`ready`||a===`error`)&&!l&&this.closeTelemetryStream())}publishBatchedSamples(e,t,n,r=!0,i=!1){for(let a of t)if(!(!Number.isSafeInteger(a.seq)||a.seq<=this.lastSampleSeq)){if(r&&n&&a.seq>this.lastSampleSeq+1){let t=this.lastSampleSeq+1,n=a.seq-1,r=this.runOutputIdentity,i=r?.bootId===e&&r.deviceRunId===this.lastRunId?r.requestId:void 0;this.emitConsole(`system`,`Telemetry gap · ${n-t+1} sample${n===t?``:`s`} unavailable`,{action:`telemetry`,phase:`error`,eventId:`${e}:run:${this.lastRunId}:sample-gap:${t}-${n}`,requestId:i,deviceBootId:e,deviceRunId:this.lastRunId})}r&&this.emitTelemetry(a,i),this.lastSampleSeq=a.seq}}emitTelemetry(e,t=!1){this.emit({type:`telemetry`,replayed:t,sample:{...e,plotValues:e.plotValues?.map(e=>({...e}))??[]}})}async reconnectAfterReset(){let e=this.commandEpoch,t=this.bootId;this.stopPolling();let n=performance.now()+Mt,r=null;for(;performance.now()<n&&this.connected;){await new Promise(e=>setTimeout(e,450));try{let n=await this.getJson(`/api/v1/info`,1500);if(this.assertCommandEpoch(e),Zt(n),W(n,this.expectedRobotId),n.bootId===t){r=new P(`restart_pending`,`The XRP has not restarted yet`),this.emitStatus(`connecting`,`Waiting for the XRP to finish restarting…`);continue}this.reconcileReconnectedRun(n),this.info=n,this.bootId=n.bootId,this.lastRunId=n.runId??0,this.control=n.control??null,this.lastLogSeq=0,this.lastLogDeviceRunId=void 0,this.lastSampleSeq=0,this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeProjectManifest(n.project),this.consumeRuntimeState(n.runtimeJson);let i=await this.readInitialState(n);this.assertCommandEpoch(e);try{await this.acquireControl(!1)}catch(e){if(!(e instanceof P)||e.code!==`control_owned`)throw e}this.assertCommandEpoch(e),this.emitStatus(i?.state??`ready`,i?.detail??`${n.robotName} · ${n.address} · course ${n.courseRelease}`),this.emitConsole(`system`,`${n.robotName} reconnected and ready`,{action:`connect`,phase:`result`});let a=n.network?.mode,o=n.network?.address??n.address;(a===`access_point`||a===`station`)&&o&&this.emit({type:`physical-network`,mode:a,address:F(o),ssid:n.network?.ssid,...n.network?.requested_mode?{requestedMode:n.network.requested_mode}:{},...typeof n.network?.fallback==`boolean`?{fallback:n.network.fallback}:{},...n.robotId?{robotId:n.robotId}:{},...n.robotName?{hostname:n.robotName}:{}});return}catch(e){if(e instanceof P&&(e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`||e.code===`firmware_required`||e.code===`release_mismatch`||e.code===`protocol_mismatch`||e.code===`operation_cancelled`))throw e;r=e}}throw new P(`reconnect_failed`,`Physical XRP did not return after reset: ${L(r)}`)}reconcileReconnectedRun(e){let t=this.bootId!==null&&this.bootId!==e.bootId,n=e.runId!==void 0&&this.lastRunId>0&&this.lastRunId!==e.runId;!t&&!n||(this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.emitStatus(`error`,`${t?`The XRP restarted`:`The XRP changed runs`} before its remaining data could be collected. This recording is incomplete.`,!0),t&&(this.lastLogSeq=0,this.lastLogDeviceRunId=void 0),this.lastSampleSeq=0,this.collectingStoppedRun=!1,this.runOutputIdentity=null,this.pendingRunOutputIdentity=null)}async resolveUnsettledLaunch(){if(!this.unsettledLaunch||!this.info?.capabilities.includes(`control.session-v1`))return;let e=await this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`);this.consumeState(e,!1),this.unsettledLaunch=!1}async readRecoverableState(e,t,n){let r=this.commandEpoch,i=t??(()=>this.assertCommandEpoch(r)),a=async()=>{let t=await this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`,e,n);if(i(),t.bootId===this.info?.bootId&&t.bootId===this.bootId&&t.runId===this.lastRunId&&(t.state===`ready`||t.state===`error`&&t.detail.toLowerCase().includes(`stopped after an exception`))&&t.control?.sessionId===null){this.consumeControl(t.control);try{return await this.acquireControl(!1),i(),await this.readTelemetry(this.telemetryPath(this.lastLogSeq,this.lastSampleSeq,this.lastRunId>0?this.lastRunId:void 0),e,n)}catch(t){if(i(),t instanceof P&&t.code===`control_owned`)return this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`,e,n);throw t}}return t};if(this.info?.capabilities.includes(`control.session-v1`)&&this.control?.sessionId!==this.controlSessionId)return a();try{return await this.readTelemetry(this.telemetryPath(this.lastLogSeq,this.lastSampleSeq,this.lastRunId>0?this.lastRunId:void 0),e,n)}catch(e){if(e instanceof P&&[`control_required`,`boot_changed`,`stale_run`].includes(e.code))return a();throw e}}async waitForProgramStop(e=!0){let t=this.commandEpoch,n=performance.now()+2e3,r=null,i=0;for(;performance.now()<n&&this.connected;){i>0&&await new Promise(e=>setTimeout(e,i)),this.assertCommandEpoch(t);try{let n=this.lastLogSeq,a=this.lastSampleSeq,o=await this.readRecoverableState(this.requestTimeoutMs);if(this.assertCommandEpoch(t),this.consumeState(o,e),i=this.telemetryStream||(o.moreLogs===!0||o.moreSamples===!0)&&(this.lastLogSeq>n||this.lastSampleSeq>a)?0:100,(o.state===`ready`||o.state===`error`&&o.detail.toLowerCase().includes(`stopped after an exception`))&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun)return;if(o.state===`error`&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun){r=new P(`target_error`,o.detail);break}}catch(e){this.assertCommandEpoch(t),r=e;break}}this.assertCommandEpoch(t),this.emitStatus(this.collectingStoppedRun?`loading`:`connecting`,this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Checking program stop…`);try{await this.recoverAfterInterruptedStop(e)}catch(e){throw this.collectingStoppedRun?e:r??e}}async recoverAfterInterruptedStop(e=!0){let t=this.commandEpoch;this.stopPolling();let n=performance.now()+Mt,r=null,i=0;for(;performance.now()<n&&this.connected;){i>0&&await new Promise(e=>setTimeout(e,i)),this.assertCommandEpoch(t),i=450;try{let n=this.lastLogSeq,a=this.lastSampleSeq,o=await this.readRecoverableState(this.requestTimeoutMs);if(this.assertCommandEpoch(t),this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeState(o,e),(this.telemetryStream||(o.moreLogs===!0||o.moreSamples===!0)&&(this.lastLogSeq>n||this.lastSampleSeq>a))&&(i=0),(o.state===`ready`||o.state===`error`&&o.detail.toLowerCase().includes(`stopped after an exception`))&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun){this.emitConsole(`system`,`XRP stop state verified`,{action:`stop`,phase:`result`});return}o.state===`error`&&(r=new P(`target_error`,o.detail))}catch(e){this.assertCommandEpoch(t),r=e}}throw this.assertCommandEpoch(t),this.collectingStoppedRun?new P(`run_data_incomplete`,`The program stopped, but its remaining run data could not be collected. Check your connection to the XRP and select Stop to retry collection. A new run must wait to preserve this recording.`):new P(`reconnect_failed`,`Could not verify that the physical XRP stopped: ${L(r)}`)}emitStatus(e,t,n=!1,r){(this.currentState!==e||this.currentDetail!==t)&&((e===`ready`||e===`error`)&&(this.reportRequestStats(),this.clearPendingParameterFeedback()),this.currentState=e,this.currentDetail=t,(e===`ready`||n)&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&(this.currentRun={...this.currentRun,state:e,detail:t,...r?{failureDomain:r}:{},finishedAtMs:Date.now()},this.emit({...this.currentRun,type:`run`,phase:`end`})),this.emit({type:`status`,state:e,detail:t,timestampMs:Date.now()}),this.publishControl())}emitConsole(e,t,n={}){let r=n.eventId??this.nextConsoleEventId();if(n.action===`run`&&n.phase===`request`&&this.currentRun?.runId!==n.requestId){this.runOutputIdentity=null,this.pendingRunOutputIdentity=null;let e=this.stagedRunDescriptor??this.currentProject;this.currentRun={runId:n.requestId??r,startedAtMs:n.timestampMs??Date.now(),state:`loading`,detail:t,projectId:e?.projectId,projectName:e?.name,projectRevision:e?.revision,entrypoint:e?.entrypoint,templateId:e?.templateId},this.emit({...this.currentRun,type:`run`,phase:`begin`})}this.emit({type:`console`,stream:e,line:t,...n,eventId:r,timestampMs:n.timestampMs??Date.now()})}nextConsoleEventId(){let e=`physical-${this.eventSession}-${this.nextEvent}`;return this.nextEvent+=1,e}consumeProjectManifest(e){let t=e?.revision;if(e=this.sourceProjectManifest(e),e===void 0)return;if(e===null){if(this.currentProject?.stale)return;this.setCurrentProject(null);return}if(!e.revision){this.projectStateKnown||this.setCurrentProject(null);return}if(this.currentProject?.stale&&(this.currentProject.revision!==e.revision||!this.physicalProjectSources.matchesExecution(t,this.currentProject)))return;let n=e.name||e.entrypoint;this.currentExecutionRevision=t;let r=this.currentProject?.revision===e.revision&&this.currentProject.name===n&&this.currentProject.entrypoint===e.entrypoint&&this.physicalProjectSources.matchesExecution(t,this.currentProject)?this.currentProject:void 0;if(this.setCurrentProject({...r?.projectId?{projectId:r.projectId}:{},...r?.templateId?{templateId:r.templateId}:{},name:n,entrypoint:e.entrypoint,revision:e.revision,stale:!1}),typeof e.worldJson==`string`&&e.worldJson!==this.lastWorldJson){this.lastWorldJson=e.worldJson;try{let t=ge(e.worldJson);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}catch(e){this.emitConsole(`system`,`The XRP project has an invalid world.json: ${L(e)}`,{phase:`error`})}}}sourceProjectManifest(e){return e?.revision?{...e,executionRevision:e.revision,revision:this.physicalProjectSources.sourceRevision(e.revision)}:e}setCurrentProject(e){e||(this.currentExecutionRevision=void 0),!(this.projectStateKnown&&this.currentProject?.revision===e?.revision&&this.currentProject?.projectId===e?.projectId&&this.currentProject?.templateId===e?.templateId&&this.currentProject?.stale===e?.stale&&this.currentProject?.name===e?.name&&this.currentProject?.entrypoint===e?.entrypoint)&&(this.projectStateKnown=!0,this.currentProject=e,this.emit({type:`project`,project:e}))}clearPendingParameterFeedback(e){e===void 0?this.acceptedParameterValues.clear():this.acceptedParameterValues.delete(e);let t=!1,n=this.runtimeState.parameters.map(n=>(e===void 0||n.name===e)&&n.pendingValue!==void 0?(t=!0,{...n,pendingValue:void 0}):n);t&&(this.lastRuntimeJson=``,this.runtimeState={...this.runtimeState,parameters:n},this.emit({type:`runtime`,state:this.runtimeState}))}consumeRuntimeState(e){let t=`${this.bootId}:${this.lastRunId}`;if(t!==this.runtimeIdentity&&(this.runtimeIdentity=t,this.lastRuntimeJson=``,this.runtimeState=tt,this.acceptedParameterValues.clear()),e!==void 0&&e!==this.lastRuntimeJson){try{let t=rt(e);if(t.revision<this.runtimeState.revision)return;this.lastRuntimeJson=e,this.runtimeState={...t,parameters:t.parameters.map(e=>{let t=this.acceptedParameterValues.get(e.name);return t===void 0?e:e.value===t||e.pendingValue===t?(this.acceptedParameterValues.delete(e.name),e):{...e,pendingValue:t}})}}catch{this.runtimeState=tt}this.emit({type:`runtime`,state:this.runtimeState})}}emit(e){for(let t of this.listeners)t(e)}},tn=class{kind=`physical`;endpoint;options;direct=null;worker=null;listeners=new Set;pending=new Map;seenConsoleEventIds=new Set;consoleEventOrder=[];nextRequest=1;localNetworkPermissionPrimed=!1;pageLifecycleObserved=!1;releaseDepartureParticipant=null;pageWasHidden=!1;pageCacheSuspended=!1;visiblePollFrame=null;candidateEndpoints;discoveryTimeoutMs;directMode;directPollOwnerId=`page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;snapshotResponder=new xt;projectRunProvider=null;projectRunBlockedReason;telemetryEnabled=!1;directRunAttempt=null;directState=`disconnected`;directControlOwned=!0;directDepartureStop=null;constructor(e,t={}){this.endpoint=F(e),this.options=t,this.candidateEndpoints=[...new Set([this.endpoint,...(t.candidateEndpoints??[]).map(F)])],this.discoveryTimeoutMs=t.discoveryTimeoutMs??1e3,this.directMode=!!t.fetch||!(`SharedWorker`in globalThis)}async connect(){if(this.observePageLifecycle(),this.directMode||this.direct){if(this.directDepartureStop&&await this.directDepartureStop,this.direct){await this.direct.connect(),this.startVisiblePollDriver();return}await this.connectDirectCandidate(),this.startVisiblePollDriver();return}if(!this.worker)try{this.worker=new SharedWorker(new URL(`/ucsbxrp/assets/physical-target.shared-worker-GlYeSFyp.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-physical-target-v20-${import.meta.url}`}),this.worker.port.onmessage=e=>this.handleWorkerMessage(e.data),this.worker.onerror=e=>{e.preventDefault(),this.releaseWorker(e.message?`Physical target worker failed: ${e.message}`:`Physical target worker failed`)},this.worker.port.start(),this.worker.port.postMessage({type:`set-role`,role:this.deliveryRole()})}catch(e){this.releaseWorker(L(e)),await this.useDirectClient().connect(),this.startVisiblePollDriver();return}let e=e=>this.request({type:`connect`,endpoints:e,discoveryTimeoutMs:this.discoveryTimeoutMs,expectedRobotId:this.options.expectedRobotId,providesProject:this.projectRunProvider!==null,blockedReason:this.projectRunBlockedReason,role:this.deliveryRole()});try{await e(this.candidateEndpoints),this.startVisiblePollDriver();return}catch(e){if(!this.shouldPrimeLocalNetworkPermission(e))throw e}let t=await this.primeLocalNetworkPermission();await e(t?[t,...this.candidateEndpoints.filter(e=>e!==t)]:this.candidateEndpoints),this.startVisiblePollDriver()}disconnect(){if(this.pageCacheSuspended=!1,this.stopVisiblePollDriver(),this.stopObservingPageLifecycle(),this.direct){this.releaseDirectAfterDeparture();return}this.releaseWorker(`Physical target disconnected`)}async check(e){return this.direct?this.direct.check(e):await this.request({type:`check`,project:e})}async synchronize(e,t){if(this.direct){await this.direct.synchronize(e,t);return}await this.request({type:`prepare`,project:e,...t?{projectId:t}:{}})}async run(e,t){if(this.direct){await this.runDirect(()=>this.direct.run(e,t));return}await this.request({type:`run`,project:e,...t?{projectId:t}:{}})}async runCurrent(){if(this.direct){await this.runDirect(()=>this.direct.runCurrent());return}await this.request({type:`run-current`,requireCallerProvider:this.projectRunProvider!==null})}async prepareRunStart(e,t){return this.direct?this.direct.prepareRunStart(e,t):await this.request({type:`prepare-run-start`,project:e,projectId:t,requireCallerProvider:this.projectRunProvider!==null})}async startPreparedRun(e){if(this.direct){await this.runDirect(()=>this.direct.startPreparedRun(e));return}await this.request({type:`start-prepared-run`,token:e})}cancelPreparedRun(e){this.direct?this.direct.cancelPreparedRun(e):this.worker?.port.postMessage({type:`cancel-prepared-run`,token:e})}async markProjectStale(e,t){if(this.direct){await this.direct.markProjectStale(e,t);return}await this.request({type:`mark-project-stale`,project:e,...t?{projectId:t}:{}})}setProjectRunProvider(e,t){this.projectRunProvider!==e&&this.snapshotResponder.cancel(),this.projectRunProvider=e,this.projectRunBlockedReason=e?bt(t?.blockedReason):void 0,this.direct?.setProjectRunProvider(e,t),this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()}),this.worker?.port.postMessage({type:`set-project-run-provider`,providesProject:e!==null,takeover:t?.takeover===!0,blockedReason:this.projectRunBlockedReason})}setTelemetryEnabled(e){this.telemetryEnabled=e,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()})}deliveryRole(){return this.telemetryEnabled||this.projectRunProvider===null?`monitor`:`ide`}markProjectChanged(e){if(this.direct){this.direct.markProjectChanged(e);return}this.worker?.port.postMessage({type:`mark-project-changed`,project:e})}async stop(){if(this.direct){await this.direct.stop();return}await this.request({type:`stop`})}async reset(){if(this.direct){await this.direct.reset();return}await this.request({type:`reset`})}async setRuntimeParameter(e,t){if(this.direct){await this.direct.setRuntimeParameter(e,t);return}await this.request({type:`set-runtime-parameter`,name:e,value:t})}async claimControl(){if(this.direct)return this.direct.claimControl();await this.request({type:`claim-control`})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}async runDirect(e){let t=this.directState===`running`||this.directState===`loading`?null:{pending:!0};t&&(this.directRunAttempt=t);try{await e()}finally{t&&(t.pending=!1,this.directRunAttempt===t&&this.directState===`ready`&&(this.directRunAttempt=null))}}releaseDirectAfterDeparture(){let e=this.direct;e&&(this.stopOnBeforeUnload(),this.directDepartureStop?this.directDepartureStop.then(()=>e.disconnect()):e.disconnect())}useDirectClient(){return this.direct||(this.direct=new en(this.endpoint,this.directTargetOptions()),this.direct.setProjectRunProvider(this.projectRunProvider,{blockedReason:this.projectRunBlockedReason}),this.direct.subscribe(e=>this.emit(e))),this.direct}directTargetOptions(){return this.options.fetch||this.options.pollCoordinatorGeneration!==void 0?this.options:{...this.options,pollDrivenByVisibleClient:!0,pollCoordinatorGeneration:20,pollOwnerId:this.directPollOwnerId}}async connectDirectCandidate(){let e=Error(`No XRP address is available`);for(let t of this.candidateEndpoints){let n=new en(t,{...this.directTargetOptions(),discoveryTimeoutMs:this.discoveryTimeoutMs,candidateEndpoints:void 0});n.setProjectRunProvider(this.projectRunProvider,{blockedReason:this.projectRunBlockedReason});let r=[],i=n.subscribe(e=>r.push(e));try{await n.connect(),i(),this.direct=n,n.subscribe(e=>this.emit(e));for(let e of r)this.emit(e);return}catch(t){i(),n.disconnect(),e=kt(e,t)}}throw e}async primeLocalNetworkPermission(){if(this.localNetworkPermissionPrimed||typeof window>`u`||window.location.protocol!==`https:`||new URL(this.endpoint).protocol!==`http:`)return null;let e=Error(`No XRP address is available`);for(let t of this.candidateEndpoints){let n=new AbortController,r=setTimeout(()=>n.abort(),this.discoveryTimeoutMs);try{let e=await globalThis.fetch(`${t}/api/v1/info`,I(t,{cache:`no-store`,method:`GET`,signal:n.signal},window.location.protocol));if(!e.ok)throw Error(`XRP returned HTTP ${e.status}`);return this.options.expectedRobotId&&W(await e.json(),this.options.expectedRobotId),this.localNetworkPermissionPrimed=!0,t}catch(t){e=kt(e,t)}finally{clearTimeout(r)}}throw e instanceof P&&(e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`)?e:new P(`network_error`,`${e instanceof DOMException&&e.name===`AbortError`?`Known XRP addresses did not reply within ${this.discoveryTimeoutMs/1e3} second per address`:`Cannot reach a known XRP address: ${L(e)}`}. ${At(this.endpoint)}`)}shouldPrimeLocalNetworkPermission(e){return e instanceof P&&(e.code===`network_error`||e.code===`timeout`)&&!this.localNetworkPermissionPrimed&&typeof window<`u`&&window.location.protocol===`https:`&&this.candidateEndpoints.some(e=>new URL(e).protocol===`http:`)}request(e){if(!this.worker)return Promise.reject(Error(`Physical target is not connected`));let t=`physical-${this.nextRequest}`;return this.nextRequest+=1,new Promise((n,r)=>{this.pending.set(t,{resolve:n,reject:r}),this.worker?.port.postMessage({...e,requestId:t})})}handleWorkerMessage(e){if(e.type===`project-run-snapshot-cancel`){this.snapshotResponder.cancel(e.requestId);return}if(e.type===`project-run-snapshot-request`){let t=this.worker;this.snapshotResponder.respond(e,this.projectRunProvider,e=>{t&&t===this.worker&&t.port.postMessage(e)});return}if(e.type===`telemetry-batch`){for(let t of e.events)this.emit({...t,replayed:e.replayed||t.replayed===!0});e.deliveryId!==void 0&&this.worker?.port.postMessage({type:`telemetry-ack`,deliveryId:e.deliveryId});return}if(e.type===`event`){this.emit(e.event),e.deliveryId!==void 0&&this.worker?.port.postMessage({type:`telemetry-ack`,deliveryId:e.deliveryId});return}let t=this.pending.get(e.requestId);t&&(this.pending.delete(e.requestId),e.ok?t.resolve(e.result):t.reject(new P(e.errorCode??`worker_request_failed`,e.error)))}releaseWorker(e){this.snapshotResponder.cancel(),this.stopVisiblePollDriver();let t=this.worker;if(this.worker=null,this.rejectPending(e),t)try{t.port.postMessage({type:`disconnect`})}catch{}finally{setTimeout(()=>t.port.close(),100)}}releaseOnPageHide=e=>{if(!e.persisted){this.disconnect();return}this.pageCacheSuspended=!0,this.stopVisiblePollDriver(),this.direct?this.releaseDirectAfterDeparture():this.releaseWorker(`Physical target suspended in browser history`)};stopOnBeforeUnload=()=>{if(this.direct){if(!this.directRunAttempt||this.directDepartureStop)return;if(!this.directControlOwned){this.directRunAttempt.pending&&this.direct.interruptPendingCommands();return}this.directDepartureStop=this.direct.stop().catch(()=>void 0).finally(()=>{this.directDepartureStop=null});return}this.worker?.port.postMessage({type:`stop-owned-run`})};resumeOnPageShow=e=>{if(e.persisted){if(!this.pageCacheSuspended){this.requestResumeRecovery(`pageshow`);return}this.pageCacheSuspended=!1,this.connect().catch(e=>{this.emit({type:`status`,state:`error`,detail:L(e)})})}};resumeOnVisibilityChange=()=>{if(document.visibilityState===`hidden`){this.stopVisiblePollDriver(),this.pageWasHidden=!0;return}this.startVisiblePollDriver(),this.pageWasHidden&&(this.pageWasHidden=!1,this.requestResumeRecovery(`visibilitychange`))};resumeOnOnline=()=>{this.pageIsVisible()&&this.requestResumeRecovery(`online`)};resumeOnFocus=()=>{this.pageIsVisible()&&this.requestResumeRecovery(`focus`)};pageIsVisible(){return typeof document>`u`||document.visibilityState!==`hidden`}driveVisiblePoll=()=>{this.visiblePollFrame=null,!(!this.pageIsVisible()||this.pageCacheSuspended)&&(this.direct?this.direct.requestPollIfDue():this.worker?.port.postMessage({type:`poll-frame`}),this.startVisiblePollDriver())};startVisiblePollDriver(){this.visiblePollFrame!==null||!this.worker&&!this.direct||!this.pageIsVisible()||typeof window>`u`||typeof window.requestAnimationFrame!=`function`||(this.visiblePollFrame=window.requestAnimationFrame(this.driveVisiblePoll))}stopVisiblePollDriver(){if(this.visiblePollFrame===null||typeof window>`u`||typeof window.cancelAnimationFrame!=`function`){this.visiblePollFrame=null;return}window.cancelAnimationFrame(this.visiblePollFrame),this.visiblePollFrame=null}requestResumeRecovery(e){!this.worker||typeof navigator<`u`&&navigator.onLine===!1||this.worker.port.postMessage({type:`resume`,reason:e})}observePageLifecycle(){this.pageLifecycleObserved||typeof window>`u`||typeof window.addEventListener!=`function`||(window.addEventListener(`pagehide`,this.releaseOnPageHide),this.releaseDepartureParticipant=ie({cancel:this.stopOnBeforeUnload}),window.addEventListener(`pageshow`,this.resumeOnPageShow),window.addEventListener(`online`,this.resumeOnOnline),window.addEventListener(`focus`,this.resumeOnFocus),typeof document<`u`&&typeof document.addEventListener==`function`&&(this.pageWasHidden=document.visibilityState===`hidden`,document.addEventListener(`visibilitychange`,this.resumeOnVisibilityChange)),this.pageLifecycleObserved=!0)}stopObservingPageLifecycle(){!this.pageLifecycleObserved||typeof window>`u`||typeof window.removeEventListener!=`function`||(window.removeEventListener(`pagehide`,this.releaseOnPageHide),this.releaseDepartureParticipant?.(),this.releaseDepartureParticipant=null,window.removeEventListener(`pageshow`,this.resumeOnPageShow),window.removeEventListener(`online`,this.resumeOnOnline),window.removeEventListener(`focus`,this.resumeOnFocus),typeof document<`u`&&typeof document.removeEventListener==`function`&&document.removeEventListener(`visibilitychange`,this.resumeOnVisibilityChange),this.pageWasHidden=!1,this.pageLifecycleObserved=!1)}rejectPending(e){for(let t of this.pending.values())t.reject(Error(e));this.pending.clear()}emit(e){if(this.direct&&(e.type===`status`?(this.directState=e.state,e.state===`ready`&&!this.directRunAttempt?.pending&&(this.directRunAttempt=null)):e.type===`run`&&e.phase===`end`?this.directRunAttempt=null:e.type===`control`&&(this.directControlOwned=e.owned,!e.owned&&!this.directRunAttempt?.pending&&(this.directRunAttempt=null))),e.type===`console`&&e.eventId){if(this.seenConsoleEventIds.has(e.eventId))return;if(this.seenConsoleEventIds.add(e.eventId),this.consoleEventOrder.push(e.eventId),this.consoleEventOrder.length>4e3){let e=this.consoleEventOrder.shift();e&&this.seenConsoleEventIds.delete(e)}}for(let t of this.listeners)t(e)}},G=2500,K=15e3,nn=2e3;function rn(){return new Worker(new URL(`/ucsbxrp/assets/micropython.worker-DHAnFxZj.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-micropython-syntax-check`})}function an(e,t,n){if(e.diagnostics!==void 0)return e.diagnostics;let r={phase:e.stage===`run`?`runtime`:`compile`,projectPaths:Object.keys(n.files)},i=M(e.detail,r),a=M(t.join(`
`),r);return a[0]?.path&&!i.some(e=>e.path)?a:i.length>0?i:a}function on(e){let t=A(e);if(t)return{result:Promise.resolve({ok:!1,detail:t.message,compilerOutput:[t.message],diagnostics:[{source:`project`,phase:`compile`,severity:`error`,code:t.code,message:t.message,raw:[t.message]}]}),cancel(){}};let n=null,r=null,i=!1,a=!1,o=null,s=[],c=()=>{r!==null&&clearTimeout(r),r=null,n?.terminate(),n=null};return{result:new Promise((t,l)=>{o=l;let u=e=>{i||(i=!0,c(),t(e))},d=e=>{i||(i=!0,c(),l(e))};try{n=rn()}catch(e){d(Error(e instanceof Error?e.message:`MicroPython project checker could not start`));return}r=setTimeout(()=>{d(Error(`MicroPython runtime did not finish loading within ${K/1e3} seconds. Check the connection or offline setup, then try Compile again.`))},K),n.onmessage=t=>{let n=t.data;if(n.type===`runtime-ready`&&!a){a=!0,r!==null&&clearTimeout(r),r=setTimeout(()=>d(Error(`MicroPython project check timed out after ${G/1e3} seconds`)),G);return}if(n.type===`console`){s.length<nn&&s.push(n.line);return}if(n.type===`check-complete`){let e=n.diagnostics??[];u({ok:!0,detail:n.detail,compilerOutput:[...s,n.detail],...e.length>0?{diagnostics:e}:{},...s.length>0?{output:s}:{}});return}if(n.type===`error`){let t=an(n,s,e),r=n.rawDetail??n.detail;u({ok:!1,detail:n.detail,compilerOutput:[...s,r],...t.length>0?{diagnostics:t}:{},...s.length>0?{output:s}:{}})}},n.onerror=e=>{d(Error(e.message||`MicroPython project checker failed`))},n.onmessageerror=()=>{d(Error(`MicroPython project checker returned invalid data`))};try{n.postMessage({mode:`check`,project:e})}catch(e){d(Error(e instanceof Error?e.message:`MicroPython project checker could not receive the project`))}}),cancel(e=`MicroPython project check was cancelled`){i||(i=!0,c(),o?.(Error(e)))}}}function sn(e){return on(e).result}function cn(e){try{let t=typeof e==`string`?e:JSON.stringify(e);if(!t||t.length>512e3)return null;let n=JSON.parse(t);if(n?.schema_version!==1||typeof n.complete!=`boolean`||![`running`,`passed`,`failed`,`not_implemented`,`setup_error`].includes(n.status)||!Array.isArray(n.cases)||n.cases.length>100||![n.last_started_case,n.last_completed_case].every(e=>e===null||typeof e==`string`)||!n.counts||![`passed`,`failed`,`not_implemented`,`not_run`].every(e=>{let t=n.counts[e];return Number.isSafeInteger(t)&&t>=0}))return null;let r=new Set;for(let e of n.cases){if(!e||typeof e.id!=`string`||r.has(e.id)||typeof e.contract!=`string`||![`running`,`passed`,`failed`,`not_implemented`,`not_run`].includes(e.status)||typeof e.source?.file!=`string`||typeof e.source.method!=`string`||typeof e.role!=`string`||typeof e.message!=`string`||[e.title,e.methods,e.fixture,e.suggestion].some(e=>e!==void 0&&typeof e!=`string`)||e.context!==void 0&&(!Array.isArray(e.context)||e.context.some(e=>typeof e!=`string`))||!Array.isArray(e.inputs)||!Array.isArray(e.observations))return null;r.add(e.id)}if(n.complete&&n.status!==`setup_error`){for(let e of[`passed`,`failed`,`not_implemented`,`not_run`])if(n.counts[e]!==n.cases.filter(t=>t.status===e).length)return null;if(n.cases.some(e=>e.status===`running`)||n.counts.not_run>0||n.cases.length===0||n.status!==(n.counts.failed?`failed`:n.counts.not_implemented?`not_implemented`:`passed`))return null}return n}catch{return null}}async function ln(e,t={}){let n=A(e);return n?{ok:!1,detail:n.message,output:[],checkOutcome:`setup_error`}:new Promise(n=>{let r=[],i=0,a,o=!1,s,c=!1,l=!1,u=!1,d=!1,f,p,m=(e,t)=>{(!a||a.complete)&&/^\s*(?:FAIL|NOT IMPLEMENTED)\b/.test(t)&&(u=!0),r.length<2e3?r.push({stream:e,line:t.length>16e3?`${t.slice(0,16e3)} [remaining characters omitted]`:t}):i++},h=(e,o,l={})=>{c||(c=!0,clearTimeout(p),f?.terminate(),t.signal?.removeEventListener(`abort`,g),n({ok:e===`passed`||e===`not_implemented`,detail:o,checkOutcome:e,checkRuntimeVersion:s,output:r.map(e=>e.line),checkOutput:r,outputOmitted:i,...a?{componentChecks:a}:{},...l}))},g=()=>h(`cancelled`,`Checks were cancelled before a complete result was available. Partial results and output are retained.`),_=()=>`${a.counts.failed} component ${a.counts.failed===1?`check failed`:`checks failed`}. Review the required behavior, observations and suggested inspection in this output.`;if(t.signal?.aborted){g();return}t.signal?.addEventListener(`abort`,g,{once:!0});try{f=new Worker(new URL(`/ucsbxrp/assets/micropython.worker-DHAnFxZj.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-component-checks`}),p=setTimeout(()=>h(`timeout`,`The MicroPython checker did not finish loading. Check the connection or offline setup, then try again. No complete result is available.`),K),f.onmessage=e=>{if(c)return;let t=e.data;if(t.type===`runtime-ready`&&!o)o=!0,s=t.version,clearTimeout(p),p=setTimeout(()=>h(`timeout`,`Checks timed out${a?.last_started_case?` during ${a.last_started_case}`:``}. Completed results and output are retained; unfinished cases have no result. Check the method for a loop that cannot finish, then try again.`),G);else if(t.type===`console`)m(t.stream,t.line);else if(t.type===`console-batch`)t.lines.forEach(e=>m(e.stream,e.line)),i+=t.omitted;else if(t.type===`component-check-report`){let e=cn(t.report);e?(a?.complete&&!e.complete&&(d=!0),a=e):l=!0}else if(t.type===`test-complete`)!a?.complete||l||u||d?h(`unverified`,`The check script finished, but its complete outcome is not verified. Review the output from this legacy or custom script. Structured results, if present, cover only the listed shared contracts.`):a.status===`setup_error`?h(`setup_error`,`The shared checks could not be set up. Review the reported component names and contracts.`):a.counts.failed?h(`failed`,_()):a.counts.not_implemented?h(`not_implemented`,`${a.counts.passed} component ${a.counts.passed===1?`check passed`:`checks passed`}; ${a.counts.not_implemented} still ${a.counts.not_implemented===1?`needs`:`need`} implementation. Complete the listed methods, then test again.`):h(`passed`,a.counts.passed===1?`1 selected component check passed.`:`All ${a.counts.passed} selected component checks passed.`);else if(t.type===`error`){let e=t.rawDetail||t.detail;r.filter(e=>e.stream===`stderr`).map(e=>e.line).join(`
`).includes(e.trim())||(r.length>=2e3&&(r.pop(),i++),m(`stderr`,e));let n=t.stage===`compile`?`compile_error`:a?.status===`setup_error`?`setup_error`:a?.counts.failed?`failed`:`execution_error`;h(n,n===`compile_error`?`Checks could not start because a Project file did not compile. Review the reported syntax error, correct the source, then run the code tests again.`:n===`setup_error`?`The shared checks could not be set up. Review the reported component names and contracts.`:n===`failed`?_():`The check script stopped with a Python exception. Review the original error and its source context; a complete check result is not available.`,{diagnostics:t.diagnostics??[]})}},f.onerror=e=>h(`worker_error`,`The check worker stopped unexpectedly: ${e.message||`browser worker error`}. Partial output is retained; retry after reviewing the error.`),f.onmessageerror=()=>h(`worker_error`,`The browser could not read a check-worker message. Partial output is retained; try again.`),f.postMessage({mode:`test`,project:e})}catch(e){h(`worker_error`,`The check worker could not start: ${e instanceof Error?e.message:String(e)}`)}})}function q(e){return e instanceof Error?e.message:String(e)}var un=class{kind=`virtual`;worker=null;runtimeWorker=null;activeRunId=null;syntaxChecks=new Set;listeners=new Set;pending=new Map;clientId=crypto.randomUUID();nextRequest=1;nextAction=1;runHeartbeat=null;liveValues=null;snapshotResponder=new xt;projectRunProvider=null;projectRunBlockedReason;telemetryEnabled=!1;pageLifecycleObserved=!1;pageCacheSuspended=!1;releaseDepartureParticipant=null;operationEpoch=0;cancellation=null;runtimeStartupTimeout=null;compiledRevision=null;async connect(){if(this.observePageLifecycle(),this.worker)return;if(!(`SharedWorker`in globalThis))throw Error(`This browser does not support the virtual target worker`);let e=new SharedWorker(new URL(`/ucsbxrp/assets/virtual-target.shared-worker-B06FFY54.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-virtual-target-v6-${import.meta.url}`});this.worker=e,e.port.onmessage=t=>{this.worker===e&&this.handleMessage(t.data)},e.port.start(),await this.request({type:`connect`,providesProject:this.projectRunProvider!==null,blockedReason:this.projectRunBlockedReason,role:this.deliveryRole()}),this.compiledRevision&&e.port.postMessage({type:`remember-compilation`,revision:this.compiledRevision})}disconnect(){this.pageCacheSuspended=!1,this.stopObservingPageLifecycle(),this.releaseConnection(`Virtual target disconnected`)}releaseConnection(e){this.snapshotResponder.cancel(),this.operationEpoch+=1;let t=this.worker;t&&this.runtimeWorker&&t.port.postMessage({type:`stop`,requestId:`disconnect-${this.nextRequest}`}),this.terminateRuntime();for(let t of this.syntaxChecks)t.cancel(e);this.syntaxChecks.clear(),this.worker=null;for(let t of this.pending.values())clearTimeout(t.timeout),t.reject(Error(e));if(this.pending.clear(),t)try{t.port.postMessage({type:`disconnect`})}finally{setTimeout(()=>t.port.close(),100)}}releaseOnPageHide=e=>{if(!e.persisted){this.disconnect();return}this.pageCacheSuspended=!0,this.releaseConnection(`Virtual target suspended in browser history`)};resumeOnPageShow=e=>{if(!e.persisted||!this.pageCacheSuspended)return;this.pageCacheSuspended=!1;let t=this.operationEpoch;this.connect().catch(e=>{this.operationEpoch===t&&this.emit({type:`status`,state:`error`,detail:q(e)})})};stopOnBeforeUnload=()=>{this.operationEpoch+=1,this.terminateRuntime(),this.worker?.port.postMessage({type:`stop-owned-run`})};observePageLifecycle(){this.pageLifecycleObserved||typeof window>`u`||typeof window.addEventListener!=`function`||(window.addEventListener(`pagehide`,this.releaseOnPageHide),window.addEventListener(`pageshow`,this.resumeOnPageShow),this.releaseDepartureParticipant=ie({cancel:this.stopOnBeforeUnload}),this.pageLifecycleObserved=!0)}stopObservingPageLifecycle(){!this.pageLifecycleObserved||typeof window>`u`||typeof window.removeEventListener!=`function`||(window.removeEventListener(`pagehide`,this.releaseOnPageHide),window.removeEventListener(`pageshow`,this.resumeOnPageShow),this.releaseDepartureParticipant?.(),this.releaseDepartureParticipant=null,this.pageLifecycleObserved=!1)}async check(e){let t={...e,files:{...e.files}},n=e.name?.trim()||e.entrypoint,r=`virtual-validate-${this.clientId}-${this.nextAction++}`;this.publishConsole({type:`console`,stream:`system`,line:`Compile requested · ${n}`,action:`validate`,phase:`request`,requestId:r});let i=A(e);if(i){let e={ok:!1,detail:i.message};return this.publishConsole({type:`console`,stream:`system`,line:`Compilation failed · ${e.detail}`,action:`validate`,phase:`error`,requestId:r}),e}try{let e=on(t);this.syntaxChecks.add(e);let n;try{n=await e.result}finally{this.syntaxChecks.delete(e)}return n.ok&&(this.compiledRevision=(await a(t)).revision,this.worker?.port.postMessage({type:`remember-compilation`,revision:this.compiledRevision})),this.publishConsole({type:`console`,stream:`system`,line:`${n.ok?`Compilation passed`:`Compilation failed`} · ${n.detail}`,action:`validate`,phase:n.ok?`result`:`error`,requestId:r}),n}catch(e){throw this.publishConsole({type:`console`,stream:`system`,line:`Compilation could not finish · ${q(e)}`,action:`validate`,phase:`error`,requestId:r}),e}}async run(e,t){k(e),await this.withRunReservation(async(n,r)=>{let i=await a(e);this.assertOperation(r),await this.startRun({type:`prepare-run`,operationEpoch:n,project:e,descriptor:i,...t?{projectId:t}:{}},r)})}async runCurrent(){await this.withRunReservation(async(e,t)=>{let n=await this.request({type:`get-project`,requireCallerProvider:this.projectRunProvider!==null});if(!n.project)throw Error(`No project is ready. Open a project in the IDE first.`);k(n.project);let r=await a(n.project);if(this.assertOperation(t),!(n.descriptor!==void 0&&n.projectId===n.storedProjectId&&!n.descriptor.stale&&n.descriptor.revision===r.revision&&n.descriptor.name===r.name&&n.descriptor.entrypoint===r.entrypoint)){await this.startRun({type:`prepare-run`,operationEpoch:e,project:n.project,descriptor:r,...n.projectId?{projectId:n.projectId}:{}},t);return}await this.startRun({type:`prepare-run`,operationEpoch:e},t)})}assertOperation(e){if(e!==this.operationEpoch||!this.worker)throw Error(`Run cancelled`)}async withRunReservation(e){let t=++this.operationEpoch,n=await this.request({type:`reserve-run`});try{this.assertOperation(t),await e(n.operationEpoch,t)}catch(e){throw this.worker&&await this.request({type:`cancel-run`,operationEpoch:n.operationEpoch}).catch(()=>void 0),e}}setProjectRunProvider(e,t){this.projectRunProvider!==e&&this.snapshotResponder.cancel(),this.projectRunProvider=e,this.projectRunBlockedReason=e?bt(t?.blockedReason):void 0,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()}),this.worker?.port.postMessage({type:`set-project-run-provider`,providesProject:e!==null,takeover:t?.takeover===!0,blockedReason:this.projectRunBlockedReason})}setTelemetryEnabled(e){this.telemetryEnabled=e,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()})}deliveryRole(){return this.telemetryEnabled||this.projectRunProvider===null?`monitor`:`ide`}markProjectChanged(e){this.worker?.port.postMessage({type:`mark-project-changed`,project:e})}async startRun(e,t=this.operationEpoch){this.terminateRuntime();let{runId:n,scenario:r,world:i,project:a,descriptor:o,reuseCompilation:s}=await this.request(e),c=await u(`virtual`,o?.projectId);this.assertOperation(t);let l;try{l=this.createMicroPythonWorker(`ucsb-xrp-micropython-runtime`)}catch(e){throw this.forwardRuntimeMessage(n,{type:`error`,detail:q(e)}),e}this.runtimeWorker=l,this.activeRunId=n,typeof SharedArrayBuffer==`function`&&globalThis.crossOriginIsolated?(this.liveValues=new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*16)),this.cancellation=new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT))):this.liveValues=null,this.startRunHeartbeat(n);let d=performance.now(),f=``,p=!1,m=e=>this.publishConsole({type:`console`,stream:`system`,line:e,action:`run`,phase:`output`,requestId:`virtual-startup-${n}`});m(`Virtual XRP startup: shared memory ${this.liveValues?`available`:`unavailable`}; browser isolation ${globalThis.crossOriginIsolated?`enabled`:`disabled`}.`);let h=!1,g=(e,t)=>{this.clearRuntimeStartupDeadline(),this.runtimeStartupTimeout=setTimeout(()=>{l===this.runtimeWorker&&(this.forwardRuntimeMessage(n,{type:`error`,stage:`compile`,detail:t}),this.terminateRuntime(n))},e)};g(K,`MicroPython runtime did not finish loading within 15 seconds. Check the connection or offline setup, then try Run again.`),l.onmessage=e=>{if(l!==this.runtimeWorker)return;let t=e.data;if(t.type===`runtime-state`){let e=t.state.parameters.map(e=>e.name).join(`, `);e!==f&&(f=e,m(`Virtual XRP controls received after ${Math.round(performance.now()-d)} ms: ${e||`none`}.`))}else!p&&t.type===`sensor-acquisition`&&(p=!0,m(`Virtual XRP first sensor sample received after ${Math.round(performance.now()-d)} ms.`));t.type===`runtime-ready`&&!h?(h=!0,g(G,s?`MicroPython program preparation timed out after 2.5 seconds. Try Run again.`:`MicroPython compilation timed out after 2.5 seconds. Check the project, then try Run again.`)):t.type===`compile-complete`&&this.clearRuntimeStartupDeadline(),this.forwardRuntimeMessage(n,t),(t.type===`run-complete`||t.type===`error`)&&this.terminateRuntime(n)},l.onerror=e=>{l===this.runtimeWorker&&(this.forwardRuntimeMessage(n,{type:`error`,detail:e.message||`MicroPython runtime worker failed`}),this.terminateRuntime(n))};try{l.postMessage({mode:`run`,project:ke(a,r),scenario:r,world:i,liveParameterBuffer:this.liveValues?.buffer,cancellationBuffer:this.cancellation?.buffer,reuseCompilation:s,initialParameters:c})}catch(e){throw this.forwardRuntimeMessage(n,{type:`error`,stage:`compile`,detail:q(e)}),this.terminateRuntime(n),e}}async synchronize(e,t){let n=await this.check(e);if(!n.ok)throw Error(n.detail);let r=await a(e);await this.request({type:`store-project`,project:e,descriptor:r,...t?{projectId:t}:{}}),this.publishConsole({type:`console`,stream:`system`,line:`Project prepared for the virtual XRP`,action:`flash`,phase:`result`})}async markProjectStale(e,t,n){let r=await a(e);await this.request({type:`mark-project-stale`,project:e,descriptor:r,...n?.onlyIfUnbound?{onlyIfUnbound:!0}:{},...t?{projectId:t}:{}})}async stop(){this.operationEpoch+=1,this.terminateRuntime(),await this.request({type:`stop`})}async reset(){this.operationEpoch+=1,this.terminateRuntime(),await this.request({type:`reset`})}async setRuntimeParameter(e,t){if(!globalThis.crossOriginIsolated||typeof SharedArrayBuffer!=`function`)throw Error(`Virtual live controls are unavailable because this page has no shared-memory access. Reload the app before running the program again.`);await this.request({type:`set-runtime-parameter`,name:e,value:t})}async setSimulationScenario(e,t){await this.request({type:`set-scenario`,scenario:e,projectId:t})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}request(e){if(!this.worker)return Promise.reject(Error(`Virtual target is not connected`));let t=`request-${this.nextRequest}`;return this.nextRequest+=1,new Promise((n,r)=>{let i=setTimeout(()=>{this.pending.delete(t),r(Error(`Virtual target ${e.type} timed out`))},e.type===`get-project`?yt:15e3);this.pending.set(t,{resolve:n,reject:r,timeout:i}),this.worker?.port.postMessage({...e,requestId:t})})}handleMessage(e){if(e.type===`project-run-snapshot-cancel`){this.snapshotResponder.cancel(e.requestId);return}if(e.type===`project-run-snapshot-request`){let t=this.worker;this.snapshotResponder.respond(e,this.projectRunProvider,e=>{t&&t===this.worker&&t.port.postMessage(e)});return}if(e.type===`telemetry-batch`){for(let t of e.events)this.emit({...t,replayed:!0});return}if(e.type===`event`){for(let t of this.listeners)t(e.event);return}if(e.type===`terminate-runtime`){this.terminateRuntime(e.runId);return}if(e.type===`apply-runtime-parameter`){e.runId===this.activeRunId&&this.liveValues&&e.slot>=0&&e.slot<this.liveValues.length&&Atomics.store(this.liveValues,e.slot,e.encoded);return}let t=this.pending.get(e.requestId);t&&(clearTimeout(t.timeout),this.pending.delete(e.requestId),e.ok?t.resolve(e.result):t.reject(Error(e.error)))}createMicroPythonWorker(e){return new Worker(new URL(`/ucsbxrp/assets/micropython.worker-DHAnFxZj.js`,``+import.meta.url),{type:`module`,name:e})}forwardRuntimeMessage(e,t){this.worker?.port.postMessage({type:`runtime-message`,runId:e,message:t})}startRunHeartbeat(e){this.stopRunHeartbeat();let t=()=>{this.activeRunId===e&&this.worker?.port.postMessage({type:`run-owner-heartbeat`,runId:e})};t(),this.runHeartbeat=setInterval(t,400)}stopRunHeartbeat(){this.runHeartbeat!==null&&(clearInterval(this.runHeartbeat),this.runHeartbeat=null)}emit(e){for(let t of this.listeners)t(e)}publishConsole(e){if(this.worker){this.worker.port.postMessage({type:`publish-console`,event:e});return}this.emit({...e,eventId:e.eventId??`virtual-client-${this.clientId}-${this.nextAction++}`,timestampMs:e.timestampMs??Date.now()})}terminateRuntime(e){(e===void 0||this.activeRunId===null||e===this.activeRunId)&&(this.clearRuntimeStartupDeadline(),this.stopRunHeartbeat(),this.cancellation&&Atomics.store(this.cancellation,0,1),this.runtimeWorker?.terminate(),this.runtimeWorker=null,this.activeRunId=null,this.liveValues=null,this.cancellation=null)}clearRuntimeStartupDeadline(){this.runtimeStartupTimeout!==null&&clearTimeout(this.runtimeStartupTimeout),this.runtimeStartupTimeout=null}},dn=`# Robot Curling geometry: travel distance d comes from the selected world.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose  # Drive-axle midpoint (mm) and heading (rad).
FINISH = WORLD.waypoint("finish")  # Named target location in world millimeters.
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)  # sqrt(delta_x**2 + delta_y**2), in mm.

# Confirm the final stop from wheel speeds; these values do not choose when to brake.
STATIONARY_SPEED_MM_S = 5.0  # Both absolute wheel speeds must be at or below this value.
STATIONARY_DURATION_S = 0.3  # Consecutive measured seconds below the speed threshold.
MAXIMUM_RUN_TIME_S = 120.0  # End this challenge trial two minutes after robot.start().
if TRAVEL_DISTANCE_MM <= 0.0:
    raise ValueError("The finish marker must be separated from the initial pose")
`,fn=`# Test the Challenge 1 component classes without starting either robot.
# In the IDE, select Run code tests. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


print("COVERAGE · These checks exercise SensorProcessor. They do not check stopping_controller() in stopping_controller.py; evaluate that function through your Virtual XRP stopping trials.")

# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(SensorProcessor)
`,pn=`# Monitor controls for the distance-based stopping decision.

from ucsb_xrp import live


# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED_MM_S = live.number("cruise_speed_mm_s", 120.0, 0.0, 240.0, 5.0, unit="mm/s", label="Cruise speed")
SLOWDOWN_DISTANCE_MM = live.number("slowdown_distance_mm", 120.0, 0.0, 1000.0, 10.0, unit="mm", label="Slowing distance")


# Register signal names and units once; the loop writes only each value.
_PLOT_CURLING_TARGET_DISTANCE_MM = live.register_plot('curling_target_distance_mm', unit="mm", label="Trial target distance")
_PLOT_CURLING_INITIAL_POSITION_MM = live.register_plot('curling_initial_position_mm', unit="mm", label="Trial initial wheel position")
_PLOT_REMAINING_MM = live.register_plot('remaining_mm', unit="mm", label="Remaining distance")
_PLOT_REQUESTED_SPEED_MM_S = live.register_plot('requested_speed_mm_s', unit="mm/s", label="Requested speed")
_WATCH_MOTION_TIME_S = live.register_watch('motion_time_s', unit="s", label="Estimated motion time")
_PLOT_CURLING_TIME_LIMIT_S = live.register_plot('curling_time_limit_s', unit="s", label="Curling time limit")


def publish_curling_trial(target_distance_mm, initial_position_mm):
    # Save the fixed distance and wheel-position origin with this run's samples.
    # The distance CSV uses these values rather than settings edited after Run.
    _PLOT_CURLING_TARGET_DISTANCE_MM.value = target_distance_mm
    _PLOT_CURLING_INITIAL_POSITION_MM.value = initial_position_mm


def publish_curling_values(remaining_mm, requested_speed_mm_s, motion_time_s, timed_out=False):
    _PLOT_REMAINING_MM.value = remaining_mm
    _PLOT_REQUESTED_SPEED_MM_S.value = requested_speed_mm_s
    _WATCH_MOTION_TIME_S.value = motion_time_s
    if timed_out:
        # This final marker fixes the scored time at 120 s in Monitor and saved run summaries.
        _PLOT_CURLING_TIME_LIMIT_S.value = motion_time_s
`,mn=`# Drive distance d using measured wheel travel and your stopping controller.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM, MAXIMUM_RUN_TIME_S
from challenge import STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S
from live_variables import publish_curling_trial, publish_curling_values
from motion_timer import MotionTimer
from robot_setup import ROBOT_CONFIG, make_robot
from stopping_controller import stopping_controller
from ucsb_xrp import MotionCommand, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)  # Assemble the hardware reader and selected component objects.
try:  # Normal completion or a Python exception reaches the motor stop in finally.
    state = robot.start(INITIAL_POSE)  # Set encoder travel and saved component values to zero; set the starting pose.
    first = state.measurements  # A record with named time, position, increment, and speed fields.
    initial_position_mm = (first.left_position_mm + first.right_position_mm) / 2.0
    publish_curling_trial(TRAVEL_DISTANCE_MM, initial_position_mm)  # Save this trial's distance and measurement origin for CSV export.
    timer = MotionTimer(first.time_ms, STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S)
    travel_mm = 0.0
    stop_requested = False

    while True:  # Use the latest measurements to choose the next straight-motion request.
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        speed_mm_s = 0.0 if stop_requested else stopping_controller(remaining_mm)
        command = MotionCommand(speed_mm_s, 0.0)  # Forward mm/s; zero turn rate in rad/s.
        if command.forward_speed_mm_s < 0.0:
            raise ValueError("stopping_controller must return a nonnegative speed")
        stop_requested = stop_requested or speed_mm_s == 0.0  # Keep requesting zero after the first stop decision.
        state = robot.step(command)  # Set motor commands, wait for the sample, then read and process encoders.
        measured = state.measurements
        travel_mm = (measured.left_position_mm + measured.right_position_mm) / 2.0 - initial_position_mm
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        timer.update(measured, stop_requested)  # Estimate motion duration and consecutive time at rest.
        if elapsed_time_s(measured.time_ms, first.time_ms) >= MAXIMUM_RUN_TIME_S:
            robot.stop()  # Remove motor effort immediately at the first sample reaching two minutes.
            timer.motion_time_s = MAXIMUM_RUN_TIME_S  # A timed-out trial reports 120 s, including a stalled trial.
            publish_curling_values(remaining_mm, 0.0, timer.motion_time_s, True)
            reason = "time_limit"  # Retain this sample's distance; do not measure later coasting.
            break
        publish_curling_values(remaining_mm, command.forward_speed_mm_s, timer.motion_time_s)
        if timer.stop_confirmed:
            reason = "stationary" if timer.moved else "no_motion"
            break

    print("Straight trial: result={} motion_time_s={:.2f} remaining_mm={:.1f}".format(
        reason, timer.motion_time_s, remaining_mm,
    ))
finally:
    robot.stop()  # Zero motor effort after completion or a Python exception; IDE Stop also stops through the target service.
`,hn=`# Measure motion duration and confirm rest from recorded wheel speeds.
# This class reads measurements; it neither selects speed nor commands the robot.

from ucsb_xrp import elapsed_time_s


class MotionTimer:
    # Inputs: initial timestamp (ms), stationary speed (mm/s), confirmation time (s).
    # Results: motion_time_s, moved, and stop_confirmed after each update().
    def __init__(self, start_ms, stationary_speed_mm_s, stationary_duration_s):
        self.start_ms = start_ms
        self.stationary_speed_mm_s = stationary_speed_mm_s
        self.stationary_duration_s = stationary_duration_s
        self.first_motion_s = None
        self.motion_end_s = 0.0
        self.was_moving = False
        self.stationary_s = 0.0
        self.motion_time_s = 0.0
        self.moved = False
        self.stop_confirmed = False

    def update(self, measurements, stop_requested):
        elapsed_s = elapsed_time_s(measurements.time_ms, self.start_ms)
        speeds = measurements.wheel_speeds
        moving = max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) > self.stationary_speed_mm_s
        if moving:
            if self.first_motion_s is None:
                self.first_motion_s = max(0.0, elapsed_s - measurements.dt_s)  # Start of the first moving sample.
            self.motion_end_s = elapsed_s
        elif self.was_moving:
            self.motion_end_s = elapsed_s  # First sample at rest after motion.
        self.was_moving = moving
        self.stationary_s = self.stationary_s + measurements.dt_s if stop_requested and not moving else 0.0
        self.moved = self.first_motion_s is not None
        self.motion_time_s = self.motion_end_s - self.first_motion_s if self.moved else 0.0
        self.stop_confirmed = self.stationary_s >= self.stationary_duration_s
`,gn=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.003112,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.003172,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
`,_n=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

# SensorProcessor — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Starting counts, preceding sample, and values used to estimate speed.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store them on self so update() can use them.
        # Return Measurements with zero position, increment, speed, and dt_s.
        # Robot reads this record's named fields. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # raw is the next sensor record: timestamp in ms and encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s. Use preceding estimates or recent samples
        # to reduce jumps from individual counts; use measured elapsed time and
        # wheel_speed_filter_time_constant_ms to set the response time.
        # Keep each latest wheel increment unsmoothed for odometry. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
`,vn=`# Choose forward speed from the target distance minus mean measured wheel travel.
# Called by: main.py before its next motion command.
# Inputs: remaining_mm in mm; live cruise speed and slowing distance.
# Start with proportional distance feedback; other stopping algorithms may also be tested.
# Returns: forward speed in mm/s; the first zero command is final.

from live_variables import CRUISE_SPEED_MM_S, SLOWDOWN_DISTANCE_MM


# Distance-controller gains; these do not change the supplied motor-speed loop.
TARGET_LOCATION_KP = 1.0  # 1/seconds: multiply remaining distance to obtain the initial approach speed.
TARGET_LOCATION_KI = 0.0  # Integral gain; initially zero.
TARGET_LOCATION_KD = 0.0  # Derivative gain; initially zero.
STOP_DISTANCE_MM = 10.0  # Command zero at/below this remaining distance, including overshoot.


def stopping_controller(remaining_mm):
    # Positive means distance remains; negative means measured travel passed the target.
    # Check STOP_DISTANCE_MM before choosing cruise speed or proportional approach speed.
    # Read CRUISE_SPEED_MM_S.value and SLOWDOWN_DISTANCE_MM.value on each call.
    # For the initial proportional controller, multiply by KP and cap at cruise speed.
    # Return a finite, nonnegative speed in mm/s. See README Steps 2.1–2.3.
    raise NotImplementedError("Implement cruise, proportional approach, and distance stop")
`,yn=`# Challenge 2.1: Record both floor sensors with zero motor effort.
# This supplied program is complete; no implementation or tuning is required.

from time import sleep_ms
from ucsb_xrp import RobotConfig, XRPBot, live

SAMPLE_PERIOD_MS = 20  # Wait 20 ms between successive reflectance readings.

left_plot = live.register_plot("reflectance_left", label="Left reflectance")  # Create the left reflectance plot.
right_plot = live.register_plot("reflectance_right", label="Right reflectance")  # Create the right reflectance plot.
bot = XRPBot(RobotConfig(sample_period_ms=SAMPLE_PERIOD_MS))  # Connect to the selected XRP.
try:
    bot.stop()  # Keep both motors stopped.
    while True:  # Record until Stop is pressed.
        raw = bot.read(include_reflectance=True)  # Read both reflectance sensors.
        if raw.reflectance is None:
            raise RuntimeError("Reflectance sensors are unavailable.")
        left_plot.value = raw.reflectance.left  # Plot the raw left reading.
        right_plot.value = raw.reflectance.right  # Plot the raw right reading.
        live.apply_updates()  # Publish both plot values.
        sleep_ms(SAMPLE_PERIOD_MS)  # Wait for the next sample.
finally:
    bot.stop()  # Keep both motors stopped.
`,bn=`# Circle trial settings. Change one diameter or direction at a time.

from math import isfinite
from ucsb_xrp import load_world


CIRCLE_DIAMETER_MM = 400.0  # Diameter of the axle-midpoint path [mm]; test 200, 300, and 400.
FORWARD_SPEED_MM_S = 100.0  # Forward speed [mm/s]; keep fixed across trials.
CLOCKWISE = False  # False turns left (counterclockwise); True turns right (clockwise).

if not isfinite(CIRCLE_DIAMETER_MM) or CIRCLE_DIAMETER_MM <= 0.0:
    raise ValueError("CIRCLE_DIAMETER_MM must be a finite diameter greater than zero")
if not isfinite(FORWARD_SPEED_MM_S) or FORWARD_SPEED_MM_S < 0.0:
    raise ValueError("FORWARD_SPEED_MM_S must be a finite forward speed of zero or greater")

TURN_RATE_RAD_S = (-1.0 if CLOCKWISE else 1.0) * 2.0 * FORWARD_SPEED_MM_S / CIRCLE_DIAMETER_MM  # Steering rate = speed / radius, with the selected sign [rad/s].
INITIAL_POSE = load_world().initial_pose  # Starting pose from world.json.
`,xn=`# Supplied input/output checks exercise your files without moving the robot.

from differential_drive import DifferentialDrive
from sensor_processor import SensorProcessor
from ucsb_xrp.component_checks import run_component_checks


run_component_checks(SensorProcessor, DifferentialDrive)  # Check both student classes, regardless of the selectors used for Run.
`,Sn=`# Convert requested robot motion to left and right wheel speeds.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Task: convert forward speed and steering rate to left and right wheel speeds.
        # Use command.forward_speed_mm_s, command.turn_rate_rad_s and
        # self.config.track_width_mm (wheel separation [mm]).
        # The wheel speeds average to the forward speed; positive steering turns left.
        # Return the two speeds as WheelSpeeds(left_mm_s, right_mm_s).
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds in differential_drive.py")
`,Cn=`# Supplied circle trial. Set diameter and direction in challenge.py.

from math import pi

from challenge import CIRCLE_DIAMETER_MM, FORWARD_SPEED_MM_S, INITIAL_POSE, TURN_RATE_RAD_S
from robot_setup import ROBOT_CONFIG, make_robot
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)  # Assemble the classes selected in robot_setup.py.
command = MotionCommand(FORWARD_SPEED_MM_S, TURN_RATE_RAD_S)  # Hold forward speed and steering rate constant.
travel_mm = 0.0  # Measure axle-midpoint travel [mm].

try:
    robot.start(INITIAL_POSE)  # Reset wheel travel and start the trial.
    while travel_mm < pi * CIRCLE_DIAMETER_MM:  # Stop after one circumference of measured travel.
        state = robot.step(command)  # Read the sensors and update motor commands.
        measurements = state.measurements
        travel_mm += (measurements.left_increment_mm + measurements.right_increment_mm) / 2.0  # Add the mean wheel increment [mm].
finally:
    robot.stop()  # Stop both motors.

print("Circle complete")
print("axle_travel_mm:", travel_mm)
`,wn=`# Select your component classes and enter your physical robot's measured calibration.

from sys import platform
from ucsb_xrp import Robot, RobotConfig, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)


PHYSICAL_ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Request one control sample every 20 ms (50 Hz).
    wheel_diameter_mm=60.0,  # Rolling wheel diameter [mm].
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective drive-wheel separation [mm].
    left_start_command=0.12,  # Left motor starting effort.
    right_start_command=0.13,  # Right motor starting effort.
    left_speed_command_gain=0.0025,  # Replace with your left feedforward gain [s/mm].
    right_speed_command_gain=0.0025,  # Replace with your right feedforward gain [s/mm].
    wheel_speed_kp=0.001,  # Supplied wheel-speed feedback coefficient [s/mm].
    wheel_speed_ki=0.0,  # Unused by supplied wheel control.
    wheel_speed_kd=0.0,  # Unused by supplied wheel control.
    max_drive_command=1.0,  # Maximum motor effort.
)

# Supplied simulation calibration. Physical measurements belong only in PHYSICAL_ROBOT_CONFIG above.
VIRTUAL_ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031124,
    right_speed_command_gain=0.0031722,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=1.0,
)
ROBOT_CONFIG = PHYSICAL_ROBOT_CONFIG if platform == "rp2" else VIRTUAL_ROBOT_CONFIG  # Use the selected target's calibration.

# True uses your Project file; False uses the supplied class for a comparison run.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False


def make_robot(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor
    from differential_drive import DifferentialDrive as StudentDifferentialDrive

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor  # Select the sensor processor.
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive  # Select the differential-drive calculation.
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))  # Assemble the robot components.
`,Tn=`# Reuse your tested SensorProcessor from Robot Curling.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase


class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # Task: establish the encoder and time origins for this run.
        # Store raw.time_ms, raw.left_encoder_count and raw.right_encoder_count.
        # Return Measurements with zero wheel travel, speed and dt_s.
        # Preserve raw.range_mm, raw.button_pressed and raw.reflectance.
        raise NotImplementedError("Reuse your tested SensorProcessor.reset in sensor_processor.py")

    def update(self, raw):
        # Task: convert encoder counts and timestamps to wheel travel and speed.
        # Convert counts to mm using self.config.wheel_diameter_mm and
        # self.config.encoder_counts_per_revolution. Apply left_encoder_sign
        # and right_encoder_sign from self.config so forward travel is positive.
        # Calculate dt_s with elapsed_time_s(); retain your tested speed estimator.
        # Return Measurements with unsmoothed wheel increments for odometry.
        raise NotImplementedError("Reuse your tested SensorProcessor.update in sensor_processor.py")
`,En=`from sys import platform
from ucsb_xrp import Pose, load_world


# Physical runs use a local origin; only virtual runs use the selected track pose.
INITIAL_POSE = Pose(0.0, 0.0, 0.0) if platform == "rp2" else load_world().initial_pose
MAXIMUM_LOST_LINE_S = 0.4  # End the run after neither sensor detects tape for this long [s].
`,Dn=`# Hardware-free checks call student classes directly, regardless of Run selectors.
from line_follower import LineFollower
from ucsb_xrp.component_checks import run_component_checks


def check_line_follower():
    run_component_checks(line_follower=LineFollower)

from sensor_processor import SensorProcessor
from differential_drive import DifferentialDrive


def check_reflectance_preservation():
    run_component_checks(contracts=("sensor_processor.reflectance",), sensor_processor=SensorProcessor)


run_component_checks(SensorProcessor, DifferentialDrive, LineFollower, include_reflectance=True)
`,On=`# Reuse your DifferentialDrive from Challenge 2.2: Circular Driving.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Task: convert forward speed and steering rate to left and right wheel speeds.
        # Use command.forward_speed_mm_s, command.turn_rate_rad_s and
        # self.config.track_width_mm (wheel separation [mm]).
        # The wheel speeds average to the forward speed; positive steering turns left.
        # Return the two speeds as WheelSpeeds(left_mm_s, right_mm_s).
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
`,kn=`# Supplied waypoint counting and stop conditions; no changes required.
from challenge import MAXIMUM_LOST_LINE_S
from supplied_settings import (
    WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD,
    WAYPOINT_CONFIRM_TIME_S, WAYPOINT_TARGET, calibrated_reflectance, line_is_visible,
)
from ucsb_xrp import STOP_COMMAND


class LapProgress:
    # Count each tape bar once, using both reflectance sensors.
    def __init__(self, dark_threshold, clear_threshold, confirm_time_s):
        self.dark_threshold = dark_threshold
        self.clear_threshold = clear_threshold
        self.confirm_time_s = confirm_time_s
        self.waypoints_reached = 0
        self.on_bar = False
        self.transition_time_s = 0.0

    def update(self, readings, dt_s):
        # Count as soon as both sensors read dark. Wait for the bar to clear
        # before allowing another count.
        darkness = min(readings.left, readings.right)
        if not self.on_bar:
            if darkness >= self.dark_threshold:
                self.on_bar = True
                self.waypoints_reached += 1
        elif darkness < self.clear_threshold:
            self.transition_time_s += dt_s
            if self.transition_time_s + 1e-9 >= self.confirm_time_s:
                self.on_bar = False
                self.transition_time_s = 0.0
        else:
            self.transition_time_s = 0.0
        return self.waypoints_reached


class LineCircuit:
    # Combine waypoint counting, line following and the selected stop conditions.
    def __init__(self, follower, stop_on_line_loss=True):
        self.follower = follower
        self.stop_on_line_loss = stop_on_line_loss
        self.progress = LapProgress(
            WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD, WAYPOINT_CONFIRM_TIME_S,
        )
        self.lost_line_s = 0.0
        self.result = None

    @property
    def waypoints_reached(self):
        return self.progress.waypoints_reached

    @property
    def phase(self):
        if self.result is not None:
            return self.result
        if self.stop_on_line_loss and self.lost_line_s:
            return "line_lost_stopping"
        return "following"

    @property
    def should_publish(self):
        # Stop adding plot values after a sensor or line-loss failure.
        return self.result not in ("reflectance_unavailable", "line_lost")

    def update(self, readings, dt_s):
        if self.result is not None:
            return STOP_COMMAND
        if readings is None:
            self.result = "reflectance_unavailable"
            return STOP_COMMAND
        # Count bars from raw readings; stop at the finish before steering again.
        if self.progress.update(readings, dt_s) >= WAYPOINT_TARGET:
            self.result = "complete"
            return STOP_COMMAND

        calibrated = calibrated_reflectance(readings)
        visible = line_is_visible(readings)
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s
        if self.stop_on_line_loss and not visible:
            if self.lost_line_s >= MAXIMUM_LOST_LINE_S:
                self.result = "line_lost"
            return STOP_COMMAND

        # Calculate the next motion command from calibrated reflectance.
        return self.follower.update(calibrated, dt_s)
`,An=`# Calculate forward speed and steering rate from calibrated IR reflectance.
from ucsb_xrp import LineFollowerBase, MotionCommand


class LineFollower(LineFollowerBase):
    def reset(self):
        # Initialize a straight cruise command for the starting bar and any additional history.
        super().reset()  # Clear the current, previous and accumulated reflectance errors.
        self.p = 0.0  # Proportional steering contribution [rad/s].
        self.i = 0.0  # Integral steering contribution [rad/s].
        self.d = 0.0  # Derivative steering contribution [rad/s].

    def update(self, reflectance, dt_s):
        # Task: use calibrated reflectance to calculate forward speed and steering rate.
        # First store reflectance.left - reflectance.right in self.line_error; positive means turn left.
        # Calculate self.p, self.i and self.d with the gains "kp_rad_s", "ki_rad_s2" and "kd_rad" in self.settings.
        # Use self.last_error and dt_s for the derivative; use zero when dt_s is zero.
        # Keep self.i at zero unless you implement the optional accumulated error in self.integral_error.
        # For a bar, both readings reach "waypoint_dark_threshold": continue the preceding trajectory.
        # Hold error history and set p = i = d = 0 on a bar; use zero derivative on the first sample afterward.
        # Limit p + i + d to +/- "maximum_turn_rate_rad_s" and reduce "cruise_speed_mm_s" using "turn_slowdown".
        # Apply "minimum_speed_mm_s" without exceeding cruise; zero cruise stops both speed and steering.
        # Return a MotionCommand containing the resulting forward speed and steering rate.
        raise NotImplementedError("Complete LineFollower.update")
`,jn=`# Supplied controls and telemetry. No student adjustment needed.
# Monitor retains live settings between runs; Restore defaults uses settings.py.
from ucsb_xrp import live
from settings import CRUISE_SPEED_MM_S, P_GAIN_RAD_S

CRUISE_SPEED = live.number("cruise_speed_mm_s", CRUISE_SPEED_MM_S, 0.0, None, 1.0, label="Cruise speed", unit="mm/s")
P_GAIN = live.number("line_gain", P_GAIN_RAD_S, 0.0, None, 0.01, label="P gain", unit="rad/s")

# Register plots once, then update their values after each sample.
_PLOT_REFLECTANCE_LEFT = live.register_plot('reflectance_left')
_PLOT_REFLECTANCE_RIGHT = live.register_plot('reflectance_right')
_PLOT_LINE_ERROR = live.register_plot('line_error')
_PLOT_TURN_RATE_RAD_S = live.register_plot('turn_rate_rad_s', unit="rad/s", label="Requested turn rate")
_PLOT_WAYPOINTS_REACHED = live.register_plot("waypoints_reached", label="Waypoints")
_WATCH_PHASE = live.register_watch('phase')


_PLOT_P_TERM = live.register_plot("line_p_rad_s", unit="rad/s", label="Line P contribution")
_PLOT_I_TERM = live.register_plot("line_i_rad_s", unit="rad/s", label="Line I contribution")
_PLOT_D_TERM = live.register_plot("line_d_rad_s", unit="rad/s", label="Line D contribution")


def publish_line_values(readings, command, follower, waypoints_reached, phase):
    _PLOT_REFLECTANCE_LEFT.value = readings.left  # Plot left reflectance: 0 = light, 1 = dark.
    _PLOT_REFLECTANCE_RIGHT.value = readings.right
    _PLOT_LINE_ERROR.value = follower.line_error  # Plot the steering error calculated by LineFollower.
    _PLOT_TURN_RATE_RAD_S.value = command.turn_rate_rad_s
    _PLOT_WAYPOINTS_REACHED.value = waypoints_reached
    _PLOT_P_TERM.value = follower.p if phase == "following" else 0.0
    _PLOT_I_TERM.value = follower.i if phase == "following" else 0.0
    _PLOT_D_TERM.value = follower.d if phase == "following" else 0.0
    _WATCH_PHASE.value = phase
`,Mn=`# Follow the tape continuously and stop after the final waypoint crossing.
from challenge import INITIAL_POSE, MAXIMUM_LOST_LINE_S
from lap_progress import LineCircuit
from live_variables import publish_line_values
from robot_setup import (
    LINE_FOLLOWER_SETTINGS, ROBOT_CONFIG, STOP_ON_LINE_LOSS,
    apply_line_controls, make_line_follower, make_robot,
)
from supplied_settings import WAYPOINT_TARGET
from ucsb_xrp import elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
circuit = LineCircuit(follower, STOP_ON_LINE_LOSS)
try:
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        command = circuit.update(readings, state.measurements.dt_s)
        if circuit.should_publish:
            publish_line_values(readings, command, follower,
                                circuit.waypoints_reached, circuit.phase)
        if circuit.result is not None:
            break
        state = robot.step(command, read_reflectance=True)
    result = circuit.result
    if result == "complete":
        print("Finished: crossed all {} waypoints, including start and finish.".format(WAYPOINT_TARGET))
    elif result == "line_lost":
        print("Stopped: both IR reflectance sensors remained below their line thresholds for {} s. The motors stopped at the first such reading.".format(
            MAXIMUM_LOST_LINE_S))
    else:
        print("Stopped: floor-sensor readings are unavailable.")
    print("Line circuit: result={} waypoints={}/{} elapsed_s={}".format(
        result, circuit.waypoints_reached, WAYPOINT_TARGET,
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:
    robot.stop()
`,Nn=`# Select student or supplied classes below. Adjust numerical parameters in settings.py.
from ucsb_xrp import Robot, XRPBot
from settings import (
    WHEEL_DIAMETER_MM, ENCODER_COUNTS_PER_REVOLUTION, TRACK_WIDTH_MM,
    CRUISE_SPEED_MM_S, P_GAIN_RAD_S, I_GAIN_RAD_S2, D_GAIN_RAD,
    MAXIMUM_TURN_RATE_RAD_S, MINIMUM_SPEED_MM_S, TURN_SLOWDOWN,
)
from live_variables import CRUISE_SPEED, P_GAIN
from supplied_settings import (
    SAMPLE_PERIOD_MS, INTEGRAL_LIMIT_S, WAYPOINT_DARK_THRESHOLD, make_robot_config,
)
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

ROBOT_DIMENSIONS = dict(
    sample_period_ms=SAMPLE_PERIOD_MS,
    wheel_diameter_mm=WHEEL_DIAMETER_MM,
    encoder_counts_per_revolution=ENCODER_COUNTS_PER_REVOLUTION,
    track_width_mm=TRACK_WIDTH_MM,
)
ROBOT_CONFIG = make_robot_config(ROBOT_DIMENSIONS)
LINE_FOLLOWER_SETTINGS = dict(
    cruise_speed_mm_s=CRUISE_SPEED_MM_S,
    kp_rad_s=P_GAIN_RAD_S,
    ki_rad_s2=I_GAIN_RAD_S2,
    kd_rad=D_GAIN_RAD,
    minimum_speed_mm_s=MINIMUM_SPEED_MM_S,
    integral_limit_s=INTEGRAL_LIMIT_S,
    maximum_turn_rate_rad_s=MAXIMUM_TURN_RATE_RAD_S,
    turn_slowdown=TURN_SLOWDOWN,
    waypoint_dark_threshold=WAYPOINT_DARK_THRESHOLD,
)

# True selects this Project's class; False selects the supplied implementation.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False

# True stops the motors when neither sensor detects tape and ends after 0.4 s.
# Set False when implementing line recovery in LineFollower.
STOP_ON_LINE_LOSS = True


def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), SuppliedOdometry(config))


def make_line_follower(settings):
    from line_follower import LineFollower as StudentLineFollower
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    follower = SuppliedLineFollower(settings)
    if not all(hasattr(follower, name) for name in (
        "p", "i", "d",
    )):
        raise RuntimeError(
            "The supplied LineFollower needs the current course runtime. "
            "Connect by USB and use Robot Setup > Update course runtime. "
            "No firmware reflash is needed."
        )
    return follower


def apply_line_controls(follower):
    follower.settings["cruise_speed_mm_s"] = CRUISE_SPEED.value
    follower.settings["kp_rad_s"] = P_GAIN.value
`,Pn=`# Reuse your SensorProcessor from Robot Curling to measure wheel travel and speed.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase


class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # Task: establish the encoder and time origins for this run.
        # Store raw.time_ms, raw.left_encoder_count and raw.right_encoder_count.
        # Return Measurements with zero wheel travel, speed and dt_s.
        # Copy raw.range_mm, raw.button_pressed and raw.reflectance unchanged.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # Task: convert encoder counts and timestamps to wheel travel and speed.
        # Convert counts to mm using self.config.wheel_diameter_mm and
        # self.config.encoder_counts_per_revolution. Apply left_encoder_sign
        # and right_encoder_sign from self.config so forward travel is positive.
        # Calculate dt_s with elapsed_time_s(); retain your tested speed estimator.
        # Return Measurements with unsmoothed wheel increments for odometry.
        # Copy raw.range_mm, raw.button_pressed and raw.reflectance unchanged.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # Assigned in Challenge 5; no implementation is needed here.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
`,Fn=`# Configure your physical robot from Parts 2.1 and 2.2, then tune line following below.
from sys import platform

# Physical robot measurements; Virtual XRP uses supplied geometry and motor calibration.
WHEEL_DIAMETER_MM = 60.0  # Enter the rolling wheel diameter [mm].
ENCODER_COUNTS_PER_REVOLUTION = 585.0  # Enter encoder counts for one wheel revolution.
TRACK_WIDTH_MM = 155.0  # Enter the effective separation between the drive wheels [mm].
# Starting effort compensates motor friction; its sign follows the requested wheel direction.
LEFT_START_COMMAND = 0.12  # Left effort offset for every nonzero wheel-speed request.
RIGHT_START_COMMAND = 0.13  # Right effort offset for every nonzero wheel-speed request.
LEFT_SPEED_COMMAND_GAIN = 0.0025  # Convert requested left wheel speed to motor effort [s/mm].
RIGHT_SPEED_COMMAND_GAIN = 0.0025  # Convert requested right wheel speed to motor effort [s/mm].

# Physical IR sensors: enter each sensor's white-floor value W and raw threshold T from Part 2.1.
LEFT_FLOOR_REFLECTANCE = 0.0  # Subtract this left white-floor value before calculating steering error.
RIGHT_FLOOR_REFLECTANCE = 0.0  # Subtract this right white-floor value before calculating steering error.
LEFT_LINE_VISIBLE_THRESHOLD = 0.12  # Detect tape when the raw left reading reaches this value.
RIGHT_LINE_VISIBLE_THRESHOLD = 0.12  # Detect tape when the raw right reading reaches this value.

# Steering defaults; Monitor retains live changes until Restore defaults is selected.
if platform == "rp2":
    CRUISE_SPEED_MM_S = 100.0  # Request this forward speed on a straight [mm/s].
    P_GAIN_RAD_S = 0.7  # Multiply the reflectance error by this proportional gain [rad/s].
    I_GAIN_RAD_S2 = 0.0  # Multiply accumulated error by this integral gain [rad/s^2]; begin at zero.
    D_GAIN_RAD = 0.03  # Multiply the error's rate of change by this derivative gain [rad].
else:
    CRUISE_SPEED_MM_S = 100.0
    P_GAIN_RAD_S = 1.8
    I_GAIN_RAD_S2 = 0.0
    D_GAIN_RAD = 0.025

MINIMUM_SPEED_MM_S = 45.0  # Keep at least this forward speed in turns, without exceeding cruise [mm/s].
MAXIMUM_TURN_RATE_RAD_S = 1.4  # Limit the magnitude of the requested steering rate [rad/s].
TURN_SLOWDOWN = 0.45  # Reduce cruise speed by this fraction at the maximum steering rate.
`,In=`# Supplied target configuration, waypoint detection and sensor calibration.
# Student measurements and steering parameters are in settings.py.
from sys import platform
from settings import (
    LEFT_START_COMMAND, RIGHT_START_COMMAND,
    LEFT_SPEED_COMMAND_GAIN, RIGHT_SPEED_COMMAND_GAIN,
    LEFT_FLOOR_REFLECTANCE, RIGHT_FLOOR_REFLECTANCE,
    LEFT_LINE_VISIBLE_THRESHOLD, RIGHT_LINE_VISIBLE_THRESHOLD,
)
from ucsb_xrp import ReflectanceReadings, RobotConfig

IS_PHYSICAL_XRP = platform == "rp2"
SAMPLE_PERIOD_MS = 20  # Schedule one control sample every 20 ms (50 Hz).

PHYSICAL_ROBOT_SETTINGS = dict(
    left_start_command=LEFT_START_COMMAND,
    right_start_command=RIGHT_START_COMMAND,
    left_speed_command_gain=LEFT_SPEED_COMMAND_GAIN,
    right_speed_command_gain=RIGHT_SPEED_COMMAND_GAIN,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=1.0,  # Reduce this value if instructed by the instructor.
)
VIRTUAL_ROBOT_SETTINGS = dict(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=1.0,  # Reduce this value if instructed by the instructor.
)

WAYPOINT_DARK_THRESHOLD = 0.80  # Count a bar when both raw sensor readings reach this value.
WAYPOINT_CLEAR_THRESHOLD = 0.60
WAYPOINT_CONFIRM_TIME_S = 0.04  # Require this time off a bar before counting the next one [s].
WAYPOINT_TARGET = 6  # Number of crossings, including start and finish.
VIRTUAL_LINE_VISIBLE_THRESHOLD = 0.12
INTEGRAL_LIMIT_S = 0.5  # Limit accumulated reflectance error [s].


def make_robot_config(dimensions):
    values = dict(dimensions)
    values.update(PHYSICAL_ROBOT_SETTINGS if IS_PHYSICAL_XRP else VIRTUAL_ROBOT_SETTINGS)
    return RobotConfig(**values)


def line_is_visible(readings):
    if min(readings.left, readings.right) >= WAYPOINT_DARK_THRESHOLD:
        return True  # Keep driving across bars regardless of the ordinary-line thresholds.
    if not IS_PHYSICAL_XRP:
        return max(readings.left, readings.right) >= VIRTUAL_LINE_VISIBLE_THRESHOLD
    return (readings.left >= LEFT_LINE_VISIBLE_THRESHOLD
            or readings.right >= RIGHT_LINE_VISIBLE_THRESHOLD)


def calibrated_reflectance(readings):
    if not IS_PHYSICAL_XRP:
        return readings  # Use virtual readings unchanged.
    if min(readings.left, readings.right) >= WAYPOINT_DARK_THRESHOLD:
        return readings  # Keep both-dark bar readings unchanged.
    left = (readings.left - LEFT_FLOOR_REFLECTANCE) / (1.0 - LEFT_FLOOR_REFLECTANCE)
    right = (readings.right - RIGHT_FLOOR_REFLECTANCE) / (1.0 - RIGHT_FLOOR_REFLECTANCE)
    return ReflectanceReadings(max(0.0, min(1.0, left)), max(0.0, min(1.0, right)))
`,Ln=`# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose  # Starting axle-midpoint position (mm) and heading (rad).
ROUTE = WORLD.waypoints()  # Ordered NavigationGoal records: x_mm, y_mm, optional heading_rad.
`,Rn=`# Test the Challenge 3 component classes without starting either robot.
# In the IDE, select Run code tests. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorProcessor,
    DifferentialDrive,
    Odometry,
    NavigationController,
)
`,zn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: RobotConfig is supplied by the base class; no preceding sample is needed.
# Returns: WheelSpeeds (mm/s).

class DifferentialDrive(DifferentialDriveBase):
    # This calculation uses only the current command and robot geometry.

    def wheel_speeds(self, command):
        # command.forward_speed_mm_s is axle-center speed in mm/s;
        # command.turn_rate_rad_s is counterclockwise turn rate in rad/s.
        # self.config.track_width_mm is left/right wheel separation in mm.
        # Return WheelSpeeds(left_mm_s, right_mm_s). Equal speeds drive
        # straight; a positive turn rate needs a faster right wheel.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
`,Bn=`# Publish the current waypoint count and estimated heading.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0  # Initial forward-speed slider value, mm/s.
DEFAULT_TURN_RATE_RAD_S = 0.8  # Initial magnitude limit for turning, rad/s.
# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Register signal names and units once; the loop writes only each value.
_WATCH_GOALS_REACHED = live.register_watch('goals_reached')
_PLOT_HEADING_RAD = live.register_plot('heading_rad', unit="rad", label="Estimated heading")


def publish_goal_count(reached_count):
    _WATCH_GOALS_REACHED.value = reached_count


def publish_heading(pose):
    _PLOT_HEADING_RAD.value = pose.heading_rad
`,Vn=`# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
from robot_setup import make_navigation_controller, make_robot
from live_variables import publish_goal_count, publish_heading
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_progress import count_reached_goals


robot = make_robot(ROBOT_CONFIG)  # Assemble the selected sensing, wheel-control, drive, and odometry objects.
navigation = make_navigation_controller(NAVIGATION_CONFIG)  # Create a separate navigation object with its own route progress.
step_count = 0
reached_count = 0
try:  # Run this block, then stop the motors in finally.
    state = robot.start(INITIAL_POSE)  # Start wheel travel at zero and set the estimated starting Pose.
    reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)
    navigation.start(ROUTE)  # Load the ordered waypoints and start at the first.
    while not navigation.is_complete():  # Update motion until the controller finishes the route.
        publish_goal_count(reached_count)
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))  # Calculate motion from pose; apply it and read new measurements.
        publish_heading(state.pose)
        step_count += 1
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)

    # Confirm waypoint arrivals independently of controller completion.
    result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
    print(
        "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
        "final_pose={}".format(
            result, reached_count, len(ROUTE), step_count, state.pose
        )
    )
    if result != "complete":
        raise RuntimeError("Navigation finished before every waypoint was observed in order")
finally:
    robot.stop()  # Stop after route completion or an exception.
`,Hn=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

# Optional distance-feedback gains for a forward-speed request (mm/s).
# The supplied controller does not read these; use them only in your own rule.
TARGET_LOCATION_KP = 0.0  # 1/s times distance error (mm).
TARGET_LOCATION_KI = 0.0  # 1/s^2 times accumulated distance error (mm*s).
TARGET_LOCATION_KD = 0.0  # Dimensionless times distance-error rate (mm/s).
# Keep TARGET_LOCATION_KI and TARGET_LOCATION_KD at zero; they are not assigned in this challenge.

class NavigationController(NavigationControllerBase):
    # Keep the active-goal index and whether the robot is turning toward a
    # target, driving to it, or aligning to its requested final heading.
    # config.position_tolerance_mm is the permitted distance from the target;
    # config.heading_tolerance_rad is the permitted final heading error.

    def start(self, goals):
        # goals is an ordered tuple or list of NavigationGoal objects. Each goal's
        # x_mm and y_mm locate a target in the fixed arena coordinate frame.
        # Its heading_rad is the required final angle from the positive x axis,
        # counterclockwise in radians; None means no final-angle requirement.
        # Save this route and the current index on self; update() reads them
        # on later calls. Discard previous progress. If goals is empty,
        # is_complete() returns True and update() returns STOP_COMMAND.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # pose is the latest estimated Pose(x_mm, y_mm, heading_rad) in the
        # fixed arena frame (mm, mm, rad). Use the current goal to choose
        # turning, forward travel, or final-heading alignment; advance when its
        # required position and heading are reached. Return
        # MotionCommand(forward_speed_mm_s, turn_rate_rad_s), with positive
        # turn rate counterclockwise. Return STOP_COMMAND when no goal remains.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the saved NavigationGoal currently being approached, or
        # None when no goal remains.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Return True after every saved goal has been accepted in order.
        # Accept each position within config.position_tolerance_mm and each
        # specified final heading within config.heading_tolerance_rad.
        # Return True immediately for an empty route.
        raise NotImplementedError("Complete NavigationController.is_complete")
`,Un=`# Estimate planar robot position and heading from measured wheel travel.

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase

# Odometry — Update arena-frame position and heading from measured wheel travel.
# Called by: Robot.start() and Robot.step().
# Methods: reset(), update(), pose().
# Inputs: Initial Pose and signed left/right wheel travel since last sample (mm).
# State: Latest estimated Pose in the fixed arena coordinate frame.
# Returns: Pose(x_mm, y_mm, heading_rad), measured in mm, mm, rad.

class Odometry(OdometryBase):
    # Keep the latest Pose between successive update() calls.

    def reset(self, initial_pose):
        # Store and return initial_pose: x_mm and y_mm locate the robot's
        # axle midpoint in the fixed arena frame; heading_rad is its angle
        # from the positive x axis, measured counterclockwise in radians.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # left_increment_mm and right_increment_mm are signed distances
        # traveled by each wheel since the preceding sample. The config's
        # track_width_mm is the distance between the two wheels. Update the
        # retained axle-midpoint x_mm/y_mm in the fixed arena frame and wrap
        # heading_rad in radians; return that Pose. Use measured travel rather
        # than requested commands or simulator ground truth. Each increment
        # already covers the measured interval; do not multiply it by dt again.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,Wn=`# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_TURN_RATE_RAD_S,
    TURN_RATE,
)
from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.0031,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=12.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from odometry import Odometry as StudentOdometry
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Create the selected navigation controller.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)

# Apply Monitor controls to the active controller.
# Apply slider settings without restarting the route.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value  # Read the cruise-speed slider.
    turn_rate_rad_s = TURN_RATE.value  # Read the turn-rate slider.
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return  # Neither slider changed.
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,Gn=`# Check observed waypoint arrival independently of the navigation controller.
# Inputs: estimated Pose, ordered NavigationGoal values, current NavigationConfig.
# Returns: the number of goals reached in order at this sample.

from ucsb_xrp import distance_to_goal, wrap_angle_rad


# Input: estimated Pose, one NavigationGoal, current NavigationConfig.
# Return: whether both required pose errors are within tolerance.
def goal_is_reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= config.heading_tolerance_rad


# Input: estimated Pose, ordered goals, prior count, current configuration.
# Return: updated observed-arrival count; does not read controller progress.
def count_reached_goals(pose, route, reached_count, config):
    while reached_count < len(route) and goal_is_reached(pose, route[reached_count], config):
        reached_count += 1  # Advance to the next waypoint after confirming this one.
    return reached_count
`,Kn=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

# SensorProcessor — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Starting counts, preceding sample, and values used to estimate speed.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store them on self so update() can use them.
        # Return Measurements with zero position, increment, speed, and dt_s.
        # Robot reads this record's named fields. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # raw is the next sensor record: timestamp in ms and encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s. Use preceding estimates or recent samples
        # to reduce jumps from individual counts; use measured elapsed time and
        # wheel_speed_filter_time_constant_ms to set the response time.
        # Keep each latest wheel increment unsmoothed for odometry. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
`,qn=`# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0  # Width and height of each square grid cell.
CLEARANCE_MM = 150.0  # Expand obstacles by the robot radius plus a tracking margin.

EXECUTE_ROUTE = False  # False: print the path. True: also drive it.
MAXIMUM_GRID_CELLS = 1024  # Limit grid memory use on the XRP.
`,Jn=`# Test the Challenge 4 component classes without starting either robot.
# In the IDE, select Run code tests. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorProcessor,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
)
`,Yn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: RobotConfig is supplied by the base class; no preceding sample is needed.
# Returns: WheelSpeeds (mm/s).

class DifferentialDrive(DifferentialDriveBase):
    # This calculation uses only the current command and robot geometry.

    def wheel_speeds(self, command):
        # command.forward_speed_mm_s is axle-center speed in mm/s;
        # command.turn_rate_rad_s is counterclockwise turn rate in rad/s.
        # self.config.track_width_mm is left/right wheel separation in mm.
        # Return WheelSpeeds(left_mm_s, right_mm_s). Equal speeds drive
        # straight; a positive turn rate needs a faster right wheel.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
`,Xn=`# Print the cells used by the mapped-route planner.

from ucsb_xrp import GridCell


def print_grid(grid, start, goal, path=None):
    start_label = None if start is None else (start.column, start.row)
    goal_label = None if goal is None else (goal.column, goal.row)
    print("Grid cells: {} mm".format(grid.resolution_mm))
    print("Lower-left origin: ({}, {}) mm".format(grid.origin_x_mm, grid.origin_y_mm))
    print("Columns +x/right; rows +y/up")
    print("Start cell: {} blocked={}".format(start_label, start is None or grid.is_blocked(start)))
    print("Goal cell:  {} blocked={}".format(goal_label, goal is None or grid.is_blocked(goal)))
    print("S start; G goal; # blocked; o path; . free")
    print("S/G can cover #; see blocked states above")
    print("col tens " + "".join(str(col // 10) for col in range(grid.column_count)))
    print("col ones " + "".join(str(col % 10) for col in range(grid.column_count)))
    path_cells = path.cells if path is not None else ()
    for row in range(grid.row_count - 1, -1, -1):  # Print from top to bottom (+y upward).
        symbols = []
        for column in range(grid.column_count):
            cell = GridCell(column, row)
            if cell == start:  # Draw endpoint symbols over blocked-cell or path symbols.
                symbol = "S"
            elif cell == goal:
                symbol = "G"
            elif grid.is_blocked(cell):
                symbol = "#"
            elif cell in path_cells:
                symbol = "o"
            else:
                symbol = "."
            symbols.append(symbol)
        print("row {:>2}   {}".format(row, "".join(symbols)))
`,Zn=`# Find a connected route through free grid cells.

from ucsb_xrp import GridPath
from ucsb_xrp.student_api import GridPlannerBase

# GridPlanner — Find a connected route through free occupancy-grid cells.
# Called by: Mapped Route or Out-and-Back planning code.
# Methods: plan().
# Inputs: OccupancyGrid and start/goal GridCell values.
# State: Search state for the current plan call.
# Returns: GridPath or None when no path exists.

class GridPlanner(GridPlannerBase):
    # Planning state may remain local to each call to plan().

    def plan(self, grid, start, goal):
        # Return a GridPath from start to goal, or None when no route exists.
        # start and goal are GridCell(column, row) values or None if a
        # requested location could not be placed in the grid. Return None for
        # missing or blocked endpoints or when no route exists. A valid
        # path includes both endpoints, contains only free cells, and moves
        # across one horizontal or vertical cell edge at each step.
        raise NotImplementedError("Complete GridPlanner.plan")
`,Qn=`# Publish the route follower's current progress.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0  # Initial forward-speed slider value, mm/s.
DEFAULT_TURN_RATE_RAD_S = 0.8  # Initial magnitude limit for turning, rad/s.
# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Register signal names and units once; the loop writes only each value.
_WATCH_NAVIGATION_STEPS = live.register_watch('navigation_steps')


def publish_navigation_steps(step_count):
    _WATCH_NAVIGATION_STEPS.value = step_count
`,$n=`# Challenge 4: plan and follow a route around known obstacles.

from challenge import WORLD, ARENA_MAP, INITIAL_POSE, DESTINATION
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from challenge import EXECUTE_ROUTE
from robot_setup import make_grid_planner, make_navigation_controller, make_robot
from grid_display import print_grid
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG
from route_runner import run_route
from route_validation import path_error
from ucsb_xrp import OccupancyGrid


print("World:", WORLD.label)
grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)  # Expand obstacles by clearance and mark the intersecting cells blocked.
if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
    raise ValueError("The map exceeds {} cells. Increase GRID_RESOLUTION_MM in challenge.py.".format(MAXIMUM_GRID_CELLS))
start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)  # Convert position to a grid column and row.
goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
path = make_grid_planner().plan(grid, start, goal)
if path is None:
    print_grid(grid, start, goal)
    print("Challenge 4: result=no_path")
else:
    invalid_reason = path_error(grid, start, goal, path)  # Check endpoints, free cells, and adjacency.
    if invalid_reason is not None:
        print_grid(grid, start, goal)
        print("Challenge 4: result=invalid_path reason={}".format(invalid_reason))
    else:
        print_grid(grid, start, goal, path)
        print("Mapped Route: result=valid_path path_cells={}".format(len(path.cells)))
        print("path:", [(cell.column, cell.row) for cell in path.cells])
        if not EXECUTE_ROUTE:
            print("Path checked. Set EXECUTE_ROUTE = True in challenge.py to drive the route.")
        else:
            goals = list(path.to_goals(grid))  # Each cell center becomes a NavigationGoal(x_mm, y_mm).
            goals[-1] = DESTINATION  # Replace the last cell center with the exact destination.
            robot = make_robot(ROBOT_CONFIG)
            navigation = make_navigation_controller(NAVIGATION_CONFIG)
            run_route(robot, navigation, INITIAL_POSE, goals, DESTINATION, len(path.cells))
`,er=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

# Optional distance-feedback gains for a forward-speed request (mm/s).
# The supplied controller does not read these; use them only in your own rule.
TARGET_LOCATION_KP = 0.0  # 1/s times distance error (mm).
TARGET_LOCATION_KI = 0.0  # 1/s^2 times accumulated distance error (mm*s).
TARGET_LOCATION_KD = 0.0  # Dimensionless times distance-error rate (mm/s).
# Keep TARGET_LOCATION_KI and TARGET_LOCATION_KD at zero; they are not assigned in this challenge.

class NavigationController(NavigationControllerBase):
    # Keep the active-goal index and whether the robot is turning toward a
    # target, driving to it, or aligning to its requested final heading.
    # config.position_tolerance_mm is the permitted distance from the target;
    # config.heading_tolerance_rad is the permitted final heading error.
    # config.realign_heading_rad is the error above which forward travel pauses
    # so the robot can turn toward the target in place.

    def start(self, goals):
        # goals is an ordered tuple or list of NavigationGoal objects. Each goal's
        # x_mm and y_mm locate a target in the fixed arena coordinate frame.
        # Its heading_rad is the required final angle from the positive x axis,
        # counterclockwise in radians; None means no final-angle requirement.
        # Save this route and the current index on self; update() reads them
        # on later calls. Discard previous progress. If goals is empty,
        # is_complete() returns True and update() returns STOP_COMMAND.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # pose is the latest estimated Pose(x_mm, y_mm, heading_rad) in the
        # fixed arena frame (mm, mm, rad). Use the current goal to choose
        # turning, forward travel, or final-heading alignment; advance when its
        # required position and heading are reached. Return
        # MotionCommand(forward_speed_mm_s, turn_rate_rad_s), with positive
        # turn rate counterclockwise. Return STOP_COMMAND when no goal remains.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the saved NavigationGoal currently being approached, or
        # None when no goal remains.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Return True after every saved goal has been accepted in order.
        # Accept each position within config.position_tolerance_mm and each
        # specified final heading within config.heading_tolerance_rad.
        # Return True immediately for an empty route.
        raise NotImplementedError("Complete NavigationController.is_complete")
`,tr=`# Estimate planar robot position and heading from measured wheel travel.

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase

# Odometry — Update arena-frame position and heading from measured wheel travel.
# Called by: Robot.start() and Robot.step().
# Methods: reset(), update(), pose().
# Inputs: Initial Pose and signed left/right wheel travel since last sample (mm).
# State: Latest estimated Pose in the fixed arena coordinate frame.
# Returns: Pose(x_mm, y_mm, heading_rad), measured in mm, mm, rad.

class Odometry(OdometryBase):
    # Keep the latest Pose between successive update() calls.

    def reset(self, initial_pose):
        # Store and return initial_pose: x_mm and y_mm locate the robot's
        # axle midpoint in the fixed arena frame; heading_rad is its angle
        # from the positive x axis, measured counterclockwise in radians.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # left_increment_mm and right_increment_mm are signed distances
        # traveled by each wheel since the preceding sample. The config's
        # track_width_mm is the distance between the two wheels. Update the
        # retained axle-midpoint x_mm/y_mm in the fixed arena frame and wrap
        # heading_rad in radians; return that Pose. Use measured travel rather
        # than requested commands or simulator ground truth. Each increment
        # already covers the measured interval; do not multiply it by dt again.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,nr=`# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_TURN_RATE_RAD_S,
    TURN_RATE,
)
from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.0031,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=12.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from odometry import Odometry as StudentOdometry
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Create the selected navigation controller.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Create the selected grid planner.
def make_grid_planner():
    from grid_planner import GridPlanner as StudentGridPlanner

    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()

# Apply Monitor controls to the active controller.
# Apply slider settings without restarting the route.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value  # Read the cruise-speed slider.
    turn_rate_rad_s = TURN_RATE.value  # Read the turn-rate slider.
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return  # Neither slider changed.
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,rr=`# Follow a checked grid path through navigation goals and report arrival.

from live_variables import publish_navigation_steps
from robot_setup import apply_navigation_controls
from route_validation import goal_is_reached


# Inputs: selected robot and navigator, starting Pose, checked goals,
# destination, and number of planned grid cells.
# Returns: None after reporting the final pose and result; raises on missed arrival.
# Cleanup: stops the robot after normal completion or an exception.
def run_route(robot, navigation, initial_pose, goals, destination, path_cell_count):
    step_count = 0
    try:
        state = robot.start(initial_pose)  # Initialize estimated pose; reset measurements.
        navigation.start(goals)  # Load the route and select its first goal.
        while not navigation.is_complete():  # Update motion until the controller finishes the route.
            publish_navigation_steps(step_count)
            apply_navigation_controls(navigation)
            state = robot.step(navigation.update(state.pose))  # Apply the pose-based motion request; read the next sample.
            step_count += 1

        # Check final position and required heading against their tolerances.
        result = (
            "complete"
            if goal_is_reached(state.pose, destination, navigation.config)
            else "destination_not_reached"
        )
        print(
            "Challenge 4: result={} path_cells={} navigation_steps={} "
            "final_pose={}".format(
                result, path_cell_count, step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError("Navigation finished before the destination was reached")
    finally:
        robot.stop()  # Stop after route completion or an exception.
`,ir=`# Validate a planned grid route before constructing or moving the robot.
# Also check the final estimated pose against the active navigation tolerances.

from ucsb_xrp import GridPath, distance_to_goal, wrap_angle_rad


# Inputs: OccupancyGrid, start/goal GridCell values, proposed GridPath or None.
# Returns: None for a free connected path; otherwise a reason string.
def path_error(grid, start, goal, path):
    if not isinstance(path, GridPath):
        return "GridPlanner must return a GridPath or None"
    if path.cells[0] != start or path.cells[-1] != goal:
        return "path endpoints do not match the requested start and destination"
    for cell in path.cells:
        if grid.is_blocked(cell):
            return "path contains a blocked or out-of-grid cell"
    for first, second in zip(path.cells, path.cells[1:]):
        if second not in grid.neighbors(first):
            return "successive path cells do not share a free side"
    return None


# Inputs: final estimated Pose (mm, rad), NavigationGoal, NavigationConfig.
# Returns: True when position and any required heading meet the tolerances.
def goal_is_reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= config.heading_tolerance_rad
`,ar=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

# SensorProcessor — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Starting counts, preceding sample, and values used to estimate speed.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store them on self so update() can use them.
        # Return Measurements with zero position, increment, speed, and dt_s.
        # Robot reads this record's named fields. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # raw is the next sensor record: timestamp in ms and encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s. Use preceding estimates or recent samples
        # to reduce jumps from individual counts; use measured elapsed time and
        # wheel_speed_filter_time_constant_ms to set the response time.
        # Keep each latest wheel increment unsmoothed for odometry. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
`,or=`# Geometry is known; only the named gate's occupancy is uncertain.
from ucsb_xrp import load_world
from robot_setup import ROBOT_CONFIG

WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_ROUTE = tuple(WORLD.waypoint(name) for name in ("outbound_1", "outbound_2", "observation"))
HOME = WORLD.waypoint("home")
# Use one map definition in both virtual cases; never read the selected
# world's obstacle list to infer the hidden gate state.
MISSION_MAP = load_world(world_id="gate-blocked").arena_map()
GRID_RESOLUTION_MM = 100.0  # Width and height of each square grid cell.
CLEARANCE_MM = 95.0  # Expand obstacles by the robot radius plus a tracking margin.
RANGE_SAMPLE_COUNT = 7  # Number of distinct ultrasound attempts, including missing echoes.
MINIMUM_USABLE_RANGE_COUNT = 4  # Positive finite readings required for an estimate.
BLOCKED_RANGE_THRESHOLD_MM = 550.0  # Estimate at or below this value means blocked; calibrate from stationary batches.
GATE_FEATURE = "center_gate"  # Only this named map feature changes after the observation.

STATIONARY_DURATION_S = 0.3  # Required continuous interval at low wheel speed.
STATIONARY_SPEED_MM_S = 5.0  # Maximum absolute wheel speed counted as stationary.
MAXIMUM_STOP_WAIT_S = 3.0  # Longest wait for the stationary check.
MAXIMUM_GRID_CELLS = 1024  # Limit grid memory use on the XRP.
# Allow each distinct ultrasound attempt two control periods plus two 70 ms
# acquisition intervals; retain a 2 s minimum for scheduler variation.
RANGE_COLLECTION_TIMEOUT_S = max(2.0, RANGE_SAMPLE_COUNT * (2 * ROBOT_CONFIG.sample_period_ms + 140) / 1000.0)
`,sr=`# Test the Challenge 5 component classes without starting either robot.
# In the IDE, select Run code tests. Each check names the class and method,
# example input, required result, and observed result, including range examples.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorProcessor,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)
`,cr=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: RobotConfig is supplied by the base class; no preceding sample is needed.
# Returns: WheelSpeeds (mm/s).

class DifferentialDrive(DifferentialDriveBase):
    # This calculation uses only the current command and robot geometry.

    def wheel_speeds(self, command):
        # command.forward_speed_mm_s is axle-center speed in mm/s;
        # command.turn_rate_rad_s is counterclockwise turn rate in rad/s.
        # self.config.track_width_mm is left/right wheel separation in mm.
        # Return WheelSpeeds(left_mm_s, right_mm_s). Equal speeds drive
        # straight; a positive turn rate needs a faster right wheel.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
`,lr=`# Print one raw range batch while the robot remains stopped.

from challenge import OUTBOUND_ROUTE, RANGE_COLLECTION_TIMEOUT_S, RANGE_SAMPLE_COUNT
from robot_setup import make_robot, ROBOT_CONFIG
from ucsb_xrp import Pose


point = OUTBOUND_ROUTE[-1]
robot = make_robot(ROBOT_CONFIG)
try:  # Run this block, then stop the motors in finally.
    robot.start(Pose(point.x_mm, point.y_mm, point.heading_rad))  # Initialize the estimated observation pose; reset measurements.
    # Collect separate ultrasound readings; a missing echo is None.
    samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
    print(samples)
finally:
    robot.stop()  # Stop after range collection or an exception.
`,ur=`# Find a connected route through free grid cells.

from ucsb_xrp import GridPath
from ucsb_xrp.student_api import GridPlannerBase

# GridPlanner — Find a connected route through free occupancy-grid cells.
# Called by: Mapped Route or Out-and-Back planning code.
# Methods: plan().
# Inputs: OccupancyGrid and start/goal GridCell values.
# State: Search state for the current plan call.
# Returns: GridPath or None when no path exists.

class GridPlanner(GridPlannerBase):
    # Planning state may remain local to each call to plan().

    def plan(self, grid, start, goal):
        # Return a GridPath from start to goal, or None when no route exists.
        # start and goal are GridCell(column, row) values or None if a
        # requested location could not be placed in the grid. Return None for
        # missing or blocked endpoints or when no route exists. A valid path includes
        # both endpoints, stays in free cells, and crosses one horizontal or
        # vertical cell edge at each step.
        raise NotImplementedError("Complete GridPlanner.plan")
`,dr=`# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0  # Initial forward-speed slider value, mm/s.
DEFAULT_TURN_RATE_RAD_S = 0.8  # Initial magnitude limit for turning, rad/s.
# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Register signal names and units once; the loop writes only each value.
_WATCH_MISSION_PHASE = live.register_watch('mission_phase')
_WATCH_MISSION_RESULT = live.register_watch('mission_result')
_WATCH_GOALS_REACHED = live.register_watch('goals_reached')
_WATCH_RETURN_PATH_CELLS = live.register_watch('return_path_cells')


def publish_phase(phase):
    _WATCH_MISSION_PHASE.value = phase


def publish_result(result):
    _WATCH_MISSION_RESULT.value = result


def publish_goals_reached(count):
    _WATCH_GOALS_REACHED.value = count


def publish_return_path_cells(count):
    _WATCH_RETURN_PATH_CELLS.value = count


# Write the result to both Monitor and Program output.
def report_result(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)
`,fr=`# Follow a known outbound corridor, observe, then plan the return.
from challenge import INITIAL_POSE, OUTBOUND_ROUTE
from challenge import RANGE_SAMPLE_COUNT, MINIMUM_USABLE_RANGE_COUNT, RANGE_COLLECTION_TIMEOUT_S
from challenge import BLOCKED_RANGE_THRESHOLD_MM
from robot_setup import make_grid_planner, make_navigation_controller, make_robot
from live_variables import publish_phase, report_result, publish_return_path_cells
from mission_policy import observed_gate
from mission_steps import follow_route
from return_route import plan_return
from stationary_observation import wait_until_stationary
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import elapsed_time_s

robot = make_robot(ROBOT_CONFIG)  # Assemble the selected sensing, wheel-control, drive, and odometry objects.
navigation = make_navigation_controller(NAVIGATION_CONFIG)  # Create a separate navigation object with its own route progress.
try:  # Run this block, then stop the motors in finally.
    state = robot.start(INITIAL_POSE)  # Start wheel travel at zero and set the estimated starting Pose.
    publish_phase("outbound")
    state, result = follow_route(robot, navigation, state, OUTBOUND_ROUTE)
    robot.stop()
    if result != "arrived":
        report_result("outbound_" + result)
    else:
        publish_phase("stopping")
        state, stationary = wait_until_stationary(robot, state)  # Check that both wheel speeds remain near zero.
        if not stationary:
            report_result("failed_stationary_check")
        else:
            publish_phase("observe")
            samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
            state = robot.state  # Collection performed stopped control steps; use their latest measurements and pose.
            estimate_mm = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)  # Call the selected SensorProcessor on distinct attempts, including None.
            blocked = observed_gate(estimate_mm, BLOCKED_RANGE_THRESHOLD_MM)  # Classify the gate as blocked, open, or unknown.
            print("stationary_range_samples_mm:", samples)
            print("range_estimate_mm:", estimate_mm)
            if blocked is None:
                report_result("unusable_range")
            else:
                publish_phase("plan_return")
                robot.stop()
                goals, path_cell_count, path_error = plan_return(make_grid_planner(), state.pose, blocked)
                if path_error is not None:
                    report_result(path_error)
                else:
                    print("gate_blocked:", blocked, "return_path_cells:", path_cell_count)
                    publish_return_path_cells(path_cell_count)
                    publish_phase("return")
                    return_start_ms = state.measurements.time_ms
                    state, result = follow_route(robot, navigation, state, goals)
                    robot.stop()
                    report_result("complete" if result == "arrived" else "return_" + result)
                    print("return_time_s:", elapsed_time_s(state.measurements.time_ms, return_start_ms))
                    print("estimated_final_pose:", state.pose)
finally:
    robot.stop()  # Stop after mission completion or an exception.
`,pr=`# Inputs: estimated range and gate threshold in mm; estimate may be None.
# Returns: True for a blocked gate, False for an open gate, None without range.
def observed_gate(estimate_mm, threshold_mm):
    if estimate_mm is None:
        return None  # No distance estimate: gate state remains unknown.
    return estimate_mm <= threshold_mm
`,mr=`# Follow ordered route goals and count arrivals from estimated position.

from live_variables import publish_goals_reached
from robot_setup import apply_navigation_controls
from ucsb_xrp import distance_to_goal, wrap_angle_rad

# Inputs: estimated Pose, NavigationGoal, NavigationConfig tolerances.
# Returns: True when both required position and heading conditions are met.
def reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error_rad = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error_rad) <= config.heading_tolerance_rad

# Inputs: started Robot, NavigationController, current RobotState, ordered goals.
# Returns: latest RobotState and "arrived" or "failed_arrival"; publishes count.
def follow_route(robot, navigation, state, goals):
    navigation.start(goals)  # Load the route and select its first goal.
    reached_count = 0
    while True:  # Check arrival and update motion at each measured pose.
        while reached_count < len(goals) and reached(
            state.pose, goals[reached_count], navigation.config,
        ):
            reached_count += 1  # Count goals reached in route order.
        publish_goals_reached(reached_count)
        if navigation.is_complete():
            return state, "arrived" if reached_count == len(goals) else "failed_arrival"
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))  # Apply motion and read the next sample.
`,hr=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

# Optional distance-feedback gains for a forward-speed request (mm/s).
# The supplied controller does not read these; use them only in your own rule.
TARGET_LOCATION_KP = 0.0  # 1/s times distance error (mm).
TARGET_LOCATION_KI = 0.0  # 1/s^2 times accumulated distance error (mm*s).
TARGET_LOCATION_KD = 0.0  # Dimensionless times distance-error rate (mm/s).
# Keep TARGET_LOCATION_KI and TARGET_LOCATION_KD at zero; they are not assigned in this challenge.

class NavigationController(NavigationControllerBase):
    # Keep the active-goal index and whether the robot is turning toward a
    # target, driving to it, or aligning to its requested final heading.
    # config.position_tolerance_mm is the permitted distance from the target;
    # config.heading_tolerance_rad is the permitted final heading error.
    # config.realign_heading_rad is the error above which forward travel pauses
    # so the robot can turn toward the target in place.

    def start(self, goals):
        # goals is an ordered tuple or list of NavigationGoal objects. Each goal's
        # x_mm and y_mm locate a target in the fixed arena coordinate frame.
        # Its heading_rad is the required final angle from the positive x axis,
        # counterclockwise in radians; None means no final-angle requirement.
        # Save this route and the current index on self; update() reads them
        # on later calls. Discard previous progress. If goals is empty,
        # is_complete() returns True and update() returns STOP_COMMAND.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # pose is the latest estimated Pose(x_mm, y_mm, heading_rad) in the
        # fixed arena frame (mm, mm, rad). Use the current goal to choose
        # turning, forward travel, or final-heading alignment; advance when its
        # required position and heading are reached. Return
        # MotionCommand(forward_speed_mm_s, turn_rate_rad_s), with positive
        # turn rate counterclockwise. Return STOP_COMMAND when no goal remains.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the saved NavigationGoal currently being approached, or
        # None when no goal remains.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Return True after every saved goal has been accepted in order.
        # Accept each position within config.position_tolerance_mm and each
        # specified final heading within config.heading_tolerance_rad.
        # Return True immediately for an empty route.
        raise NotImplementedError("Complete NavigationController.is_complete")
`,gr=`# Estimate planar robot position and heading from measured wheel travel.

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase

# Odometry — Update arena-frame position and heading from measured wheel travel.
# Called by: Robot.start() and Robot.step().
# Methods: reset(), update(), pose().
# Inputs: Initial Pose and signed left/right wheel travel since last sample (mm).
# State: Latest estimated Pose in the fixed arena coordinate frame.
# Returns: Pose(x_mm, y_mm, heading_rad), measured in mm, mm, rad.

class Odometry(OdometryBase):
    # Keep the latest Pose between successive update() calls.

    def reset(self, initial_pose):
        # Store and return initial_pose: x_mm and y_mm locate the robot's
        # axle midpoint in the fixed arena frame; heading_rad is its angle
        # from the positive x axis, measured counterclockwise in radians.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # left_increment_mm and right_increment_mm are signed distances
        # traveled by each wheel since the preceding sample. The config's
        # track_width_mm is the distance between the two wheels. Update the
        # retained axle-midpoint x_mm/y_mm in the fixed arena frame and wrap
        # heading_rad in radians; return that Pose. Use measured travel rather
        # than requested commands or simulator ground truth. Each increment
        # already covers the measured interval; do not multiply it by dt again.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,_r=`# Construct a return route using the measured gate decision and known map.

from challenge import HOME, GATE_FEATURE, MISSION_MAP
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from ucsb_xrp import GridPath, OccupancyGrid


# Inputs: OccupancyGrid, endpoint GridCell values, proposed GridPath.
# Returns: True only for free, adjacent cells from start through goal.
def valid_path(grid, start, goal, path):
    if not isinstance(path, GridPath) or path.cells[0] != start or path.cells[-1] != goal:
        return False
    if any(grid.is_blocked(cell) for cell in path.cells):
        return False
    return all(second in grid.neighbors(first) for first, second in zip(path.cells, path.cells[1:]))


# Inputs: selected GridPlanner, stopped estimated Pose, Boolean gate decision.
# Returns: ordered goals, path cell count, and error text (None on success).
# On failure, goals is None and the error is "no_route" or "invalid_path".
def plan_return(planner, pose, blocked):
    arena = MISSION_MAP.with_feature_blocked(GATE_FEATURE, blocked)  # Update the gate in a copy of the known map.
    grid = OccupancyGrid.from_arena(arena, GRID_RESOLUTION_MM, CLEARANCE_MM)  # Mark cells blocked by expanded obstacles.
    if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
        raise ValueError("Use at most {} cells for the return map".format(MAXIMUM_GRID_CELLS))
    start = grid.world_to_cell(pose.x_mm, pose.y_mm)
    goal = grid.world_to_cell(HOME.x_mm, HOME.y_mm)
    path = planner.plan(grid, start, goal)
    if path is None:
        return None, 0, "no_route"
    if not valid_path(grid, start, goal, path):
        return None, 0, "invalid_path"
    goals = list(path.to_goals(grid))  # Convert grid-cell centers to navigation goals.
    goals[-1] = HOME  # Finish at the exact home pose, not its grid-cell center.
    return goals, len(path.cells), None
`,vr=`# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_TURN_RATE_RAD_S,
    TURN_RATE,
)
from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.0031,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=12.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from odometry import Odometry as StudentOdometry
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Create the selected navigation controller.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Create the selected grid planner.
def make_grid_planner():
    from grid_planner import GridPlanner as StudentGridPlanner

    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()

# Apply Monitor controls to the active controller.
# Apply slider settings without restarting the route.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value  # Read the cruise-speed slider.
    turn_rate_rad_s = TURN_RATE.value  # Read the turn-rate slider.
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return  # Neither slider changed.
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,yr=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

# SensorProcessor — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Starting counts, preceding sample, and values used to estimate speed.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store them on self so update() can use them.
        # Return Measurements with zero position, increment, speed, and dt_s.
        # Robot reads this record's named fields. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # raw is the next sensor record: timestamp in ms and encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s. Use preceding estimates or recent samples
        # to reduce jumps from individual counts; use measured elapsed time and
        # wheel_speed_filter_time_constant_ms to set the response time.
        # Keep each latest wheel increment unsmoothed for odometry. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
`,br=`# Confirm measured rest before collecting ultrasound readings.

from challenge import STATIONARY_DURATION_S, STATIONARY_SPEED_MM_S, MAXIMUM_STOP_WAIT_S
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


# Inputs: started Robot and its latest RobotState.
# Returns: latest RobotState and True if both wheels remained below the speed
# threshold for the required duration; False if the stopping wait expired.
def wait_until_stationary(robot, state):
    stationary_s = 0.0
    start_ms = state.measurements.time_ms
    while stationary_s < STATIONARY_DURATION_S and elapsed_time_s(
        state.measurements.time_ms, start_ms
    ) <= MAXIMUM_STOP_WAIT_S:  # Wait for low wheel speeds, up to the stop-wait limit.
        state = robot.step(STOP_COMMAND)  # Request zero motion and read wheel speeds.
        speeds = state.measurements.wheel_speeds
        if max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) <= STATIONARY_SPEED_MM_S:
            stationary_s += state.measurements.dt_s  # Accumulate time with both wheel speeds at or below the threshold.
        else:
            stationary_s = 0.0  # The low-speed interval must be continuous.
    return state, stationary_s >= STATIONARY_DURATION_S
`,xr=`# Challenge 1 · Robot Curling

## Task

Drive forward and stop at the target, 1.3–2.3 m ahead along the longer axis
of the arena. The library supplies wheel-speed control. The challenge awards
points for distance and time.

![The robot's front is aligned with the start line; distance d extends to the target.](course-assets/curling-distance-measurement.svg)

The trial / run automatically stops after a maximum time of 2 minutes.

Add brief comments to your code as you write it, to improve readability for instructors and to help you during your individual code review / walkthrough at the Challenge.

## 1. Calculate wheel distance and speed

The stopping controller sets forward speed from the remaining distance.
\`SensorProcessor\` calculates wheel distance and speed from encoder values.
You will complete it in \`sensor_processor.py\`, then implement and tune the
stopping controller in \`stopping_controller.py\`. The steps follow below.
Leave \`estimate_range\` for Challenge 5.

### 1.1. Implement reset in sensor_processor.py to initialize wheel distance

\`raw\` is one \`RawSensors\` record: it contains the sample time, left/right
encoder counts, and any range, button, and floor-sensor readings. For example,
\`raw.time_ms\` is the sample's timestamp.

1. **Add the method and its stored variables.** Inside the \`SensorProcessor\`
   class, replace the existing \`reset\` method, including its
   \`raise NotImplementedError(...)\` line, with this first fragment:

   \`\`\`python
       def reset(self, raw):
           self.initial_raw = raw
           self.previous_raw = raw
           self.left_speed_mm_s = 0.0
           self.right_speed_mm_s = 0.0
   \`\`\`

   \`self.initial_raw\` holds the first sensor record so \`update\` can calculate
   distance from the starting counts. \`self.previous_raw\` holds the preceding
   record so \`update\` can calculate changes between samples. They initially
   refer to the same record. The two speed variables start at zero.
   Variables stored on \`self\` remain available when the next method runs.

2. **Create the initial Measurements record.** Add this continuation immediately
   below the four assignments, at the same indentation as those assignments:

   \`\`\`python
           return Measurements(
               time_ms=raw.time_ms,
               dt_s=0.0,
               left_position_mm=0.0,
               right_position_mm=0.0,
               left_increment_mm=0.0,
               right_increment_mm=0.0,
               left_speed_mm_s=0.0,
               right_speed_mm_s=0.0,
               range_mm=raw.range_mm,
               button_pressed=raw.button_pressed,
               reflectance=raw.reflectance,
           )
   \`\`\`

   \`Measurements\` groups named fields in one record. Each name before \`=\` selects
   a field, and the value after \`=\` supplies its contents. The wheel positions,
   increments, speeds, and time interval start at zero; the other fields retain
   the sensor readings. \`return\` passes this record to \`robot.start()\`, which
   stores it in \`state.measurements\`.

### 1.2. Implement update in sensor_processor.py to update wheel distance

\`update\` receives a new \`raw\` record each time the robot acquires an encoder
sample. Complete the method by incorporating the following calculations in
\`update(raw)\`:

1. **Calculate total wheel distance.** For each wheel, subtract its count in
   \`self.initial_raw\` from its current count. Multiply by its encoder sign
   in \`self.config\`, then convert counts to wheel travel using wheel circumference and
   encoder counts per revolution. Forward rotation must produce positive distance.
2. **Calculate the latest wheel increment.** Repeat the count subtraction using
   \`self.previous_raw\`. These increments describe this interval only; leave them
   unsmoothed because odometry uses them to calculate motion.
3. **Calculate elapsed time.** Import \`elapsed_time_s\` from \`ucsb_xrp\` and call it
   with the current timestamp followed by the preceding timestamp. Store the
   result as \`dt_s\`. Use these measured times, not \`sample_period_ms\`.
4. **Calculate wheel speed.** Divide each increment by \`dt_s\`.
   Combine the result with preceding estimates or recent samples to reduce
   jumps from individual encoder counts. Use
   \`self.config.wheel_speed_filter_time_constant_ms\` to set the response time.
   If \`dt_s\` is not positive, use zero for the interval and retain the preceding
   speed estimates instead of dividing. If you store additional samples, also
   initialize their storage in \`reset\`.
5. **Update the stored variables.** Assign the current \`raw\` to
   \`self.previous_raw\` and retain the new speed estimates on \`self\`.
   Keep \`self.initial_raw\` unchanged.
6. **Create the updated Measurements record.** Use the field names shown in
   \`reset\`, now supplying the calculated interval, wheel positions, increments,
   and speeds. Copy the timestamp, range, button, and reflectance from \`raw\`.
   Pass this record back with \`return Measurements(...)\` so \`robot.step()\` can
   use the new values.

### 1.3. Run the integrated tests to validate your code

In the IDE's **Project** panel, select **Run code tests**. The tests call your
\`SensorProcessor\` with known counts and timestamps without moving either robot.
The IDE opens the **Program output** tab below the editor. Look for the
\`PASS · SensorProcessor\` or \`FAIL · SensorProcessor\` line there; \`NOT IMPLEMENTED\`
means a method still contains its stub. For a failure, use the \`INPUT\`, \`EXPECT\`,
and the error detail on the \`FAIL\` line to locate the error, then edit and run
the tests again.

The checks cover initialization, distance, speed response, unequal sample
intervals, and different wheel dimensions and encoder signs.

### 1.4. Select your SensorProcessor for robot runs

After the tests pass, open \`robot_setup.py\` and change
\`USE_STUDENT_SENSOR_PROCESSOR = False\` to
\`USE_STUDENT_SENSOR_PROCESSOR = True\`. **Run** will then use your calculations
for wheel-speed control and stopping distance. **Run code tests** always checks
your file, regardless of this setting. Keep the supplied wheel-controller settings.

## 2. Implement and tune the stopping controller

Near the target, implement a **PID controller** to minimize the remaining
distance. The key tradeoff is between travel time and stopping accuracy.

### 2.1. Implement stopping_controller

In \`stopping_controller.py\`, replace the stub in
\`stopping_controller(remaining_mm)\`. The input is target distance minus mean
left/right wheel travel. Positive values mean distance remains; negative values
mean the measured travel has passed the target. Return a finite, nonnegative
forward speed. Implement the following stop, cruise, and approach calculations
in that order.

### 2.2. Set the stopping threshold

Set \`STOP_DISTANCE_MM\` above the function. At the start of the function, return
\`0.0\` to command zero speed when \`remaining_mm <= STOP_DISTANCE_MM\`.
\`main.py\` retains the first zero-speed command for the rest of the run.

### 2.3. Calculate cruise and approach speeds

After the stop check, read \`CRUISE_SPEED_MM_S.value\` and
\`SLOWDOWN_DISTANCE_MM.value\`. Return the cruise speed while \`remaining_mm\`
exceeds the slowing distance. Otherwise, calculate the approach speed using
the PID form:

<p><em>v</em> = K<sub>P</sub> <em>e</em> + K<sub>I</sub> ∫ <em>e</em> dt + K<sub>D</sub> d<em>e</em>/dt</p>

Here, \`e\` is \`remaining_mm\`, \`v\` is the speed command, and \`t\` is time.
The terms use current error, accumulated error, and error rate.
For this challenge, initially, start with just the proportional term:

\`speed_mm_s = TARGET_LOCATION_KP * remaining_mm\`

Limit that speed to the interval from zero to \`CRUISE_SPEED_MM_S.value\`, then
return it. Your PID constants may be stored in \`TARGET_LOCATION_KP\`,
\`TARGET_LOCATION_KI\`, and \`TARGET_LOCATION_KD\`. These are the equation's
K<sub>P</sub>, K<sub>I</sub>, and K<sub>D</sub>; the template declares them above
the function. Start with \`TARGET_LOCATION_KP = 1.0\` (1/seconds) and set
\`TARGET_LOCATION_KI\` and \`TARGET_LOCATION_KD\` initially to zero.

You may implement other stopping controller algorithms than are described here.
Ensure you tune and test systematically.

### 2.4. Compare performance for different gain settings

Select several controller configurations to compare: different gain settings,
different stopping algorithms, or both. For the initial proportional controller,
vary \`TARGET_LOCATION_KP\`. A larger gain commands a higher approach speed until
the cruise-speed limit is reached. Compare travel time and final remaining
distance using the plots in Section 4. In your report, give the tuning values
and describe the experiments and their outcomes.

## 3. Run and record stopping trials

1. **Check the start and target.** The Project's \`world.json\` defines the
   **Straight run** world. \`initial_pose\` sets the start, and the marker named
   \`finish\` sets the target. \`challenge.py\` calculates the trial distance from
   these positions. To change the distance for a virtual trial, set the
   \`finish\` marker's \`x_mm\` to the starting \`x_mm\` plus the desired travel
   distance. Keep its \`y_mm\` equal to \`initial_pose.y_mm\`.
2. **Run your controller on Virtual XRP.** Open \`main.py\` in the Project panel
   and choose **Actions for main.py → Make main** if it is not marked **main**.
   Select **Virtual XRP**, then **Compile** and **Run**. In Monitor, select
   **›** at the upper left if its controls are collapsed. Observe **Remaining
   distance** and **Requested speed**. **Virtual distance** shows the simulated
   robot's straight-line distance from its starting position.
3. **Enter the trial settings and stopping result in your trial table.** Assign
   a trial number and list the target distance, controller algorithm, and its
   parameter values. For the proportional controller, include cruise speed,
   slowing distance, \`TARGET_LOCATION_KP\`, and \`STOP_DISTANCE_MM\`. From
   **Program output**, copy the stopping reason, motion time, and \`remaining_mm\`.
   Positive remaining distance means a short stop; negative means the measured
   travel exceeded the target.
4. **Save the trial files.** After **Run saved** appears, select
   **Monitor → Export → Export distance trial as CSV**. The completion message
   gives the saved path. Rename the file \`trial01.csv\`, using the trial number
   from your table. It contains \`time_s\`, \`remaining_mm\`, and
   \`requested_speed_mm_s\`. Also select **Export program output** and export a
   run ZIP with **Include code in ZIP** enabled. Use the same trial number in
   the filenames to associate the data with its code and settings.
5. **Collect trials for comparison.** Record at least three trials for use in
   your reports, including the controller configurations you compare in
   Section 4. Save the files listed above for each trial.
6. **Add floor measurements for physical trials.** Align the robot's front
   with the start line. After the run, use a tape measure to find its final
   longitudinal error—positive beyond the target, negative short—and lateral
   error. Enter these and the final heading in the trial table. Use the front
   center as the distance reference.

## 4. Plot and compare controller performance in MATLAB

### 4.1. Plot remaining distance and requested speed

In MATLAB, set **Current Folder** to the folder containing \`trial01.csv\` and run:

\`\`\`matlab
T = readtable('trial01.csv'); figure;
subplot(2,1,1); plot(T.time_s,T.remaining_mm); yline(0,'--'); grid on; ylabel('Remaining distance (mm)');
subplot(2,1,2); plot(T.time_s,T.requested_speed_mm_s); grid on; ylabel('Requested speed (mm/s)'); xlabel('Time (s)');
exportgraphics(gcf,'trial01.png','Resolution',200);
\`\`\`

Repeat for the other trials, changing the input CSV and output image filenames.
Label each figure with its trial number, controller algorithm, and parameter
values. Use the same axis limits when comparing plots.

### 4.2. Compare stopping controllers

For each controller configuration tested, identify when speed begins to
decrease, when the controller commands zero, and the final remaining distance
on its plot. Compare these with the motion time and stopping result in your
trial table. Explain how the parameter or algorithm changes affected travel
time and stopping accuracy.

## Your report (part of your portfolio)

Submit one report per pair with both names at top. Include these items in order.
See further guidance in syllabus.

1. **Implementation:** explain your encoder-to-distance and speed calculations,
   the variables retained by \`SensorProcessor\`, and each stopping controller
   you tested. Give the expected and observed code-test results.
2. **Figures:** include the MATLAB panels for the controller configurations
   compared in Section 4, labeled with trial numbers and parameter values.
3. **Trial table:** list trial number, virtual/physical target, \`d\`, controller
   algorithm, parameter values, stopping reason, reported time, and final
   encoder remaining distance. Include at least three trials. For physical
   trials, add robot ID, longitudinal/lateral errors, and heading.
4. **Experiments and comparison:** describe your tuning experiments and their
   outcomes. Use the figures and trial table to compare the controllers and
   explain the effect of the changes you made.

Include a descriptive reflection on what your tests showed and how that evidence
informed your controller revision. Attach the CSVs, Program output, MATLAB script,
and code/settings ZIPs. Report actual values, including unsuccessful trials.

## Project files


<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
\`main.py\` is supplied and does not need to be edited. The UCSBXRP library
already incorporates the low-level motor-speed control loop: it adjusts motor
effort so measured wheel speed follows commanded wheel speed. Motor effort is
the motor input; wheel speed is the measured output.

**Run code tests**
checks your measurement methods regardless of the sensing flag; **Run** uses
the selected processor. \`stopping_controller\` is called directly and has no
selector.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Shows the straight control loop, calls your stopping controller, latches the first zero-speed command, prints the measured outcome, ends the trial at 120 s if needed, and stops the motors on exit. |
| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains later range estimation. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping controller.<br>\`TARGET_LOCATION_KP\` — proportional gain.<br>\`TARGET_LOCATION_KI\`, \`TARGET_LOCATION_KD\` — integral/derivative gains; initially zero.<br>\`STOP_DISTANCE_MM\` — remaining distance at which to command zero speed. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | \`CRUISE_SPEED_MM_S\` — Monitor Cruise speed setting; read .value in your stopping controller.<br>\`SLOWDOWN_DISTANCE_MM\` — Monitor Slowing distance setting; read .value in your stopping controller. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | \`sample_period_ms\` — scheduled measurement interval.<br>\`wheel_diameter_mm\` — wheel diameter used to convert encoder counts to travel.<br>\`encoder_counts_per_revolution\` — encoder counts for one wheel revolution.<br>\`track_width_mm\` — wheel spacing used for turning and odometry.<br>\`left_start_command\`, \`right_start_command\` — supplied motor commands for starting each wheel.<br>\`left_speed_command_gain\`, \`right_speed_command_gain\` — supplied motor-command coefficients per requested wheel speed.<br>\`wheel_speed_kp\` — supplied correction per wheel-speed error.<br>\`wheel_speed_ki\`, \`wheel_speed_kd\` — reserved settings; keep zero because the supplied controller does not use them.<br>\`max_drive_command\` — largest permitted absolute motor command.<br>\`USE_STUDENT_SENSOR_PROCESSOR\` — True uses your wheel measurements; False uses supplied measurements. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | \`TRAVEL_DISTANCE_MM\` — requested wheel travel, calculated from the start and finish.<br>\`STATIONARY_SPEED_MM_S\` — maximum absolute wheel speed counted as stopped.<br>\`STATIONARY_DURATION_S\` — consecutive stopped interval required to confirm rest.<br>\`MAXIMUM_RUN_TIME_S\` — maximum trial time; ends the run when reached. |
| <span class="supplied-file"><code>motion_timer.py</code> S</span> | Computes estimated motion time and continuous rest from measured wheel speeds without choosing or applying a command. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | \`default_world\` — world used when none has been selected.<br>\`bounds\` — arena edges.<br>\`initial_pose\` — starting position and heading.<br>\`markers\` — start, target, or waypoint locations. |

</div>


## Functions and methods

Keep the template method names and arguments. The API Reference defines the
record fields used by \`SensorProcessor\`. Keep the stopping-controller gains
and distance threshold together in \`stopping_controller.py\`; they are separate
from the supplied wheel-speed settings in \`robot_setup.py\`.

| Method or function | Input | Return or effect |
| --- | --- | --- |
| \`SensorProcessor.reset(raw)\` | First \`RawSensors\` sample | Zeroed \`Measurements\` and retained count/time origin. |
| \`SensorProcessor.update(raw)\` | Next \`RawSensors\` sample | Wheel positions, increments, speeds, and elapsed interval. |
| \`stopping_controller(remaining_mm)\` | Measured remaining distance | Forward speed; zero commands the final stop. |

<div class="main-walkthrough">

## What is main.py doing?


The supplied file runs the stopping controller in a repeated measurement-and-command loop.
\`main.py\` chooses a speed request and observes the result. The component
objects created by \`make_robot()\` carry out wheel measurement and control.

### A. The imports provide functions, classes, and settings

\`from challenge import ...\` reads the start pose, target distance, stopping
thresholds, and run limit from \`challenge.py\`. That file reads \`world.json\`.
\`from stopping_controller import stopping_controller\` selects your stopping controller. The other imports provide the timer, Monitor signals, robot setup,
and the \`MotionCommand\` record. Importing a name lets this file use a function,
class, or value defined in another file.

![Numbered main.py statements that create the robot and read its first state.](course-assets/curling-main-setup.svg)

*Figure 1. The robot object contains the selected components. The returned state
contains separate measurement and pose records.*

### B. make_robot constructs the robot and its components

\`\`\`python
robot = make_robot(ROBOT_CONFIG)
\`\`\`

\`ROBOT_CONFIG\` is a record of wheel dimensions, sample timing, and motor settings.
\`make_robot()\` in \`robot_setup.py\` constructs \`Robot\` with an \`XRPBot\`, a
\`SensorProcessor\`, a \`WheelSpeedController\`, a \`DifferentialDrive\`, and an
\`Odometry\`. The sensing flag chooses your \`SensorProcessor\` or the supplied processor.
Wheel-speed control, drive conversion, and odometry use supplied library classes.

A **class** defines the operations and saved data for a component. An **object**
is one instance of that class: \`SensorProcessor(ROBOT_CONFIG)\` creates one
processor with its own stored counts and timestamps. \`robot\` refers to the assembled
\`Robot\` object. Calling \`robot.step(command)\` calls that object's \`step\` method.
\`self\` inside a component method refers to that component object; a value stored
as \`self.previous_raw\` remains available at the next call.

### C. robot.start initializes the run and its measurements

\`\`\`python
state = robot.start(INITIAL_POSE)
first = state.measurements
initial_position_mm = (first.left_position_mm + first.right_position_mm) / 2.0
\`\`\`

\`start()\` resets encoders, stored wheel measurements and controller values,
and the estimated pose.
It returns a \`RobotState\` record containing \`measurements\` and \`pose\`.
\`first\` refers to its initial \`Measurements\` record. Records group named values:
\`first.time_ms\` is time, \`first.left_position_mm\` is left wheel position,
and \`state.pose.heading_rad\` is estimated heading. The dot selects
a field. The mean initial wheel position is saved so later travel is measured
relative to the start, even if a processor uses a nonzero position origin.
The next call, \`publish_curling_trial(TRAVEL_DISTANCE_MM, initial_position_mm)\`,
saves this trial's fixed distance and measurement origin for the CSV export.

\`MotionTimer(...)\` creates a separate timer object using that initial timestamp.
\`travel_mm = 0.0\` initializes traveled distance; \`stop_requested = False\` records
that your stopping controller has not yet requested its final stop.

![Numbered main.py statements that choose and apply the next motion request.](course-assets/curling-main-request.svg)

*Figure 2. The student function selects speed; Robot.step applies the request
and returns the next measurements.*

### D. The loop calculates the next speed request

\`\`\`python
remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
speed_mm_s = 0.0 if stop_requested else stopping_controller(remaining_mm)
command = MotionCommand(speed_mm_s, 0.0)
\`\`\`

Each \`while True\` iteration calculates remaining distance and calls your stopping controller.
After the first zero-speed command, the conditional expression keeps speed at zero
without calling your controller again. \`MotionCommand\` stores forward speed
and turn rate; \`0.0\` requests no turn. Its constructor rejects invalid
numeric values. The following check rejects negative speed, and the next line
saves whether any zero-speed command has occurred.

### E. robot.step applies the request and supplies updated measurements

\`\`\`python
state = robot.step(command)
measured = state.measurements
travel_mm = (measured.left_position_mm + measured.right_position_mm) / 2.0 - initial_position_mm
\`\`\`

Inside \`step()\`, \`DifferentialDrive\` converts the motion request to left/right
\`WheelSpeeds\`. \`WheelSpeedController\` compares those targets with the latest
measured speeds and returns a \`DriveCommand\`. \`XRPBot\` applies the command to
the two motors. \`Robot\` waits for the scheduled sample, reads encoder counts,
and passes the new \`RawSensors\` record to \`SensorProcessor.update()\`. The
returned \`Measurements\` contains new positions, increments, speeds, and actual
\`dt_s\`. \`Odometry\` updates \`Pose\` from the increments. \`step()\` returns a new
\`RobotState\` and publishes telemetry to Monitor. The same calls operate on
simulated hardware when **Virtual XRP** is selected.

For each wheel, the supplied controller maps a nonzero target speed to a motor
command using that wheel's starting-command and speed coefficients. It adds
\`wheel_speed_kp * (target_speed - measured_speed)\` and limits the result to
\`max_drive_command\`. A zero target requests zero motor effort. These operations
use the settings in \`robot_setup.py\`; your stopping controller chooses the speed.

\`main.py\` saves this returned state, computes mean wheel travel from it, and
recomputes remaining distance. It does not use the requested speed as a
measurement of distance.

![Numbered main.py statements that measure time and enforce the 120 s limit.](course-assets/curling-main-stop.svg)

*Figure 3. The run-time limit removes motor effort and records the cutoff
outcome. These are source excerpts, with inline comments omitted for fit.*

### F. The timer checks for rest and the loop enforces the run limit

\`timer.update(measured, stop_requested)\` checks both measured wheel speeds.
After your distance threshold commands zero speed, the timer uses
\`STATIONARY_SPEED_MM_S\` and \`STATIONARY_DURATION_S\` from \`challenge.py\` to
confirm that both wheels have stopped. Then \`timer.stop_confirmed\` becomes
\`True\`. These supplied settings govern motion/rest detection and reporting; they do
not set your distance threshold or select the speed command. Renewed movement restarts that rest
interval. The timer reports the interval from first detected motion to the
first rest sample after final movement; it excludes the rest-confirmation wait.

The next \`if\` checks elapsed sample time since \`start()\`. At 120 s it calls
\`robot.stop()\`, fixes the reported time at 120 s, publishes the cutoff values,
and exits the loop with \`reason = "time_limit"\`. Otherwise,
\`publish_curling_values()\` sends remaining distance, requested speed, and motion
time to Monitor. A confirmed normal stop exits with \`stationary\`; a zero-speed command
before detected movement exits with \`no_motion\`.

### G. The program prints the outcome and stops the motors

The final \`print()\` writes the reason, time, and remaining distance to Program
output. On normal completion, the run limit, or a Python exception, \`finally\` calls
\`robot.stop()\` to apply zero motor effort. The IDE **Stop** control interrupts
the running program and requests a stop through the target service; an
interruption may prevent Python from executing \`finally\`. Your stopping
controller chooses the stopping distance.

</div>
`,Sr=`# Challenge 2.1: Reflectance

Measure the left and right floor sensors on white floor and black tape. **No
programming is required.** The supplied program keeps motor effort at zero and
records continuously until you select **Stop**. Black produces larger readings;
white produces smaller readings.

1. Select your target, then **Compile** and **Run**. Open Monitor; only the left
   and right reflectance plots are selected.
2. Keeping the wheels in contact with the arena floor, move the robot by hand
   so both sensors pass across white floor and black tape. Pause on each surface
   for a few seconds. Repeat to capture the variation in each sensor.
3. Select **Stop**. For each sensor separately, identify the highest reading
   during the white intervals, **W**, and the lowest reading during the black
   intervals, **B**.
4. When **B > W**, choose **T = W + 0.1(B − W)**: white plus 10% of the
   measured white-to-black gap. If the ranges overlap, repeat the measurements.
5. Set Monitor's **Time window** to show the white and black intervals, then
   select **Export plots as PNG** or **Export plots as SVG**.

For Virtual XRP, record separate runs with **World → White floor** and
**World → Black patch**.

**Deliverables**

- Exported left and right reflectance plots.
- Written white and black values, W and B, for each sensor.
`,Cr=`# Challenge 2.2: Circular Driving

Implement \`DifferentialDrive.wheel_speeds(command)\` in **differential_drive.py**.
Drive constant-speed circles and compare their measured diameter with the request.
Diameter means the path of the **midpoint between the drive wheels**, not a wheel's path.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 230" width="100%" style="max-width:580px;height:auto" role="img" aria-label="Circular axle-midpoint path, diameter D, and a counterclockwise start tangent">
  <rect width="580" height="230" rx="12" fill="#f5f7fa"/>
  <circle cx="140" cy="110" r="82" fill="none" stroke="#245e98" stroke-width="3"/>
  <line x1="58" y1="110" x2="222" y2="110" stroke="#273646" stroke-width="2"/>
  <path d="M65 106 L58 110 L65 114 M215 106 L222 110 L215 114" fill="none" stroke="#273646" stroke-width="2"/>
  <text x="140" y="101" text-anchor="middle" fill="#182b40" font-family="sans-serif" font-size="17">diameter D</text>
  <path d="M212 148 L216 137 L224 146" fill="none" stroke="#245e98" stroke-width="3"/>
  <circle cx="140" cy="192" r="5" fill="#182b40"/>
  <path d="M147 192 H238 L229 187 M238 192 L229 197" fill="none" stroke="#182b40" stroke-width="2"/>
  <text x="270" y="75" fill="#182b40" font-family="sans-serif" font-size="17">Counterclockwise: turn rate &gt; 0</text>
  <text x="270" y="107" fill="#182b40" font-family="sans-serif" font-size="17">Right wheel travels farther</text>
  <text x="270" y="184" fill="#182b40" font-family="sans-serif" font-size="17">Start: axle midpoint</text>
  <text x="270" y="207" fill="#182b40" font-family="sans-serif" font-size="17">Arrow: initial forward motion</text>
</svg>

1. Copy your tested **sensor_processor.py** into this Project. In **robot_setup.py**,
   copy your physical wheel dimensions and feedforward values into
   \`PHYSICAL_ROBOT_CONFIG\`: \`wheel_diameter_mm\`, \`track_width_mm\`,
   \`left_start_command\`, \`right_start_command\`, \`left_speed_command_gain\`, and
   \`right_speed_command_gain\`. \`VIRTUAL_ROBOT_CONFIG\` is supplied separately.
2. In \`DifferentialDrive.wheel_speeds(command)\`, use the forward speed,
   \`command.forward_speed_mm_s\` [mm/s], turn rate, \`command.turn_rate_rad_s\`
   [rad/s], and wheel separation, \`self.config.track_width_mm\` [mm], to calculate
   left and right speeds. Return \`WheelSpeeds(left_mm_s, right_mm_s)\`.
   Their average must equal the forward speed; their difference must produce
   the requested turn. For a left turn, which wheel must be faster? Are you
   using radians and the distance from the axle midpoint to each wheel?
3. Select **Run code tests**. After both classes pass, set
   \`USE_STUDENT_SENSOR_PROCESSOR = True\` and \`USE_STUDENT_DIFFERENTIAL_DRIVE = True\`
   in **robot_setup.py**. \`False\` selects a supplied comparison implementation.
4. In **challenge.py**, set \`CIRCLE_DIAMETER_MM\` to **200, 300, then 400 mm**:
   approximately 1/6, 1/4, and 1/3 of the 1219.2 mm arena width. For each diameter,
   test \`CLOCKWISE = False\` and \`True\`. Keep \`FORWARD_SPEED_MM_S = 100.0\` for all six
   trials, or record the common speed you choose. **Compile**, then **Run** each trial.
5. Observe the path. Mark the axle midpoint's two opposite extreme positions on
   the floor and measure their separation. The supplied program stops after the
   encoders report one circumference; record if the path does not close.
   Physical measurements determine the actual diameter; the odometry trace is an estimate.
   In Virtual XRP, use the maximum minus minimum of \`ground_truth_x_mm\` or
   \`ground_truth_y_mm\` in the CSV to measure the path span.
6. Select Monitor's **Wheel speeds** plot and a **Time window** covering the trial
   (30 s covers the default runs). Use **Export plots as SVG** and
   **Export run data as CSV** for each run. Compare measured
   \`left_wheel_speed_mm_s\` and \`right_wheel_speed_mm_s\` with
   \`target_left_wheel_speed_mm_s\` and \`target_right_wheel_speed_mm_s\` in the CSV.
   If the diameter is wrong, do the wheel targets have the expected ordering and
   ratio, or do the measured speeds fail to follow them?

**Deliverables:** your **differential_drive.py**, six plot/CSV exports, and a table
of requested diameter, direction, speed, measured diameter, and any drift or failure to close.
`,wr=`# Challenge 2.3 · Arena Line Circuit

## Task

Program the XRP to follow the taped circuit along one counterclockwise lap. The
robot must negotiate the bends, drive through four intermediate waypoints (tape
bars), and stop when it returns to the start. The supplied code counts waypoints
as they are crossed, recording the start as **1**, the intermediate crossings as
**2–5**, and the finish as **6**. A completed lap must cross all six waypoints.
Complete this part (2.3) after completing parts **2.1** and **2.2**.

In part 2.1, you characterized and recorded the response of the left and right
IR reflectance sensors to white (arena floor) and black (tape) regions. Here,
in part 2.3, you implement a line following controller using those sensor data
and the differential drive controller you implemented in part 2.2.

![The XRP follows the circuit counterclockwise from the start through waypoints 2–5 and back to the finish.](course-assets/arena-line-circuit.svg)

*Figure 1. Circuit 1. The start and finish share one tape bar, crossed twice.*

## 1. Preliminaries: Import your components and retain your measurements

Prepare the following:

- Import [sensor_processor.py](sensor_processor.py), which you developed in
  Challenge 1, into this Project. Its \`Measurements.reflectance\` must retain the
  left and right readings from \`raw.reflectance\` in both \`reset()\` and \`update()\`.
- Import [differential_drive.py](differential_drive.py) from part 2.2.
- Have your reflectance data and plots from part 2.1 ready to calibrate the
  sensors for your line follower.
- Have your results and plots from part 2.2 ready. Copy your physical robot's
  wheel dimensions, starting commands, and speed command gains into the named
  constants in [settings.py](settings.py).

The results from parts 2.1 and 2.2 will help you determine whether a tracking
problem originates in sensing, differential drive, or the line following
controller. \`settings.py\` groups the numerical settings you will adjust;
\`robot_setup.py\` selects your component implementations.

## 2. Calculate steering rate ω from reflectance

Implement \`LineFollower.update(reflectance, dt_s)\` in
[line_follower.py](line_follower.py). Each call receives calibrated left and
right reflectance readings and the elapsed sample time, \`dt_s\` [s]. Return
\`MotionCommand(forward_speed_mm_s, turn_rate_rad_s)\`, using forward speed [mm/s]
and counterclockwise steering rate [rad/s]. The class is imported from \`ucsb_xrp\`.
Add brief comments explaining your calculations.

### 2.1 Calibrate the readings and calculate the steering error

For each physical sensor, use the highest white reading **W** and lowest black
reading **B** recorded in part 2.1. In \`settings.py\`:

- Set \`LEFT_FLOOR_REFLECTANCE\` and \`RIGHT_FLOOR_REFLECTANCE\` to the respective W values.
- Set \`LEFT_LINE_VISIBLE_THRESHOLD\` and \`RIGHT_LINE_VISIBLE_THRESHOLD\` to
  **T = W + 0.1(B − W)** for their respective sensors, as in part 2.1.

The supplied code compares each raw reading with its own threshold. It also
subtracts that sensor's floor value and rescales the remaining range before
passing the readings to your controller:

<p><em>r</em> = (<em>r</em><sub>raw</sub> − <em>W</em>)/(1 − <em>W</em>),
limited to 0–1.</p>

Here <em>r</em><sub>raw</sub> is the recorded sensor reading and <em>r</em> is its
calibrated value. White becomes approximately zero; black remains the larger
value. Virtual XRP uses its supplied calibration. Waypoint bars are handled
separately in Section 3.

![Top view of the XRP with tape beneath its left reflectance sensor and arrows showing a left turn.](course-assets/line-follower-steering.svg)

*Figure 2. A darker left sensor calls for a left turn; the right wheel moves faster.*

Calculate and store the dimensionless steering error:

<p><em>e</em> = <em>r</em><sub>L</sub> − <em>r</em><sub>R</sub>.</p>

Here <em>r</em><sub>L</sub> is \`reflectance.left\`, <em>r</em><sub>R</sub> is
\`reflectance.right\`, and <em>e</em> is \`self.line_error\`. Positive error calls
for positive steering rate, a left turn. The error measures the difference
between sensor readings, not distance from the tape. Equal readings alone do
not establish alignment: both sensors might instead be over white floor.

### 2.2 Calculate the PID steering contributions

Calculate the requested steering rate from

<p><em>ω</em> = <em>p</em> + <em>i</em> + <em>d</em>
= <em>K</em><sub>P</sub><em>e</em>
+ <em>K</em><sub>I</sub><em>E</em>
+ <em>K</em><sub>D</sub>(<em>e</em> − <em>e</em><sub>previous</sub>)/Δ<em>t</em>.</p>

Store the three steering contributions in \`self.p\`, \`self.i\`, and \`self.d\`;
all have units of **rad/s**. They appear in Monitor as **Line P contribution**,
**Line I contribution**, and **Line D contribution**. The gains are:

| Gain | Default in settings.py | Value used by your controller |
| --- | --- | --- |
| K<sub>P</sub> [rad/s] | \`P_GAIN_RAD_S\` | \`self.settings["kp_rad_s"]\` |
| K<sub>I</sub> [rad/s²] | \`I_GAIN_RAD_S2\` | \`self.settings["ki_rad_s2"]\` |
| K<sub>D</sub> [rad] | \`D_GAIN_RAD\` | \`self.settings["kd_rad"]\` |

Use \`dt_s\` for Δ<em>t</em> and \`self.last_error\` for the preceding error. Calculate
D before storing the new error in \`self.last_error\`; use D = 0 when \`dt_s\` is zero.
P turns in proportion to the current error. D responds to its rate of change:
when a positive error is decreasing, D opposes P and can reduce overshoot.

Begin with **I = 0** and \`self.i = 0\`; a PD controller is sufficient. If you
implement integral action, update \`self.integral_error\` using
<em>E</em> ← <em>E</em> + <em>e</em>Δ<em>t</em> before calculating I. Keep
<em>E</em> within \`±self.settings["integral_limit_s"]\`, the supplied integral
bound. I can correct persistent bias, but accumulated error can also prolong
an unwanted turn.

Limit the sum of the three contributions to
\`±self.settings["maximum_turn_rate_rad_s"]\`, set by \`MAXIMUM_TURN_RATE_RAD_S\`.
**Requested turn rate** shows this limited result.

### 2.3 Reduce forward speed during strong turns

Use the limited steering rate to calculate forward speed:

<p><em>v</em> = <em>v</em><sub>cruise</sub>
(1 − <em>s</em>|<em>ω</em>|/<em>ω</em><sub>max</sub>).</p>

Here <em>v</em><sub>cruise</sub> is \`self.settings["cruise_speed_mm_s"]\`,
<em>s</em> is \`self.settings["turn_slowdown"]\` (configured by \`TURN_SLOWDOWN\`),
and <em>ω</em><sub>max</sub> is the maximum steering rate above. Apply
\`self.settings["minimum_speed_mm_s"]\` as the minimum speed in a turn, without
exceeding the cruise speed. A zero cruise setting must produce zero speed and
zero steering rate. Return the resulting values in a \`MotionCommand\`.

## 3. Drive through the waypoint bars

Both sensors read dark on a transverse bar, so their difference no longer
indicates which way to steer. Implement the following behavior:

1. In \`LineFollower.reset()\`, call \`super().reset()\` and initialize a straight
   cruise command. The robot begins with its sensors on the starting bar.
2. When both readings reach \`self.settings["waypoint_dark_threshold"]\`, retain
   the preceding speed and steering rate until the bar has passed. Hold the
   integral and set \`self.p\`, \`self.i\`, and \`self.d\` to zero during the crossing.
3. On the first reading after the bar, use D = 0 and store that error for the
   next derivative calculation. Then resume ordinary steering.

Retain the most recent motion command after each steering calculation. If cruise
changes while crossing a bar, scale speed and steering rate together to preserve
the turn radius, respecting the steering limit; zero cruise still stops motion.
The supplied code counts crossings and stops at six.

## 4. Tune the line following controller

Start with the target-specific P and D defaults in \`settings.py\`, I = 0, and a
fixed cruise speed of 100 mm/s. If this Project has saved live settings, select
**Restore defaults** before the initial comparison. Use the measurements from
parts 2.1 and 2.2 to
resolve sensor bias or poor wheel-speed tracking before changing steering gains.

Place the physical robot with both sensors over the start bar, pointing along
the line; use **Reset** for Virtual XRP. Compile changed source, then Run.
Observe a straight section and a bend. In Monitor, compare **Reflectance left**,
**Reflectance right**, **Line error**, **Requested turn rate**, and the P and D
contributions over the interval where tracking deteriorates.

Choose one change supported by the motion and plots:

| Observed motion and supporting data | Change to compare |
| --- | --- |
| The robot runs wide on a bend; tape is visible and steering remains below the limit. | Increase P for a stronger turn. If D is opposing most of P, reduce D instead. |
| The robot repeatedly overshoots the line with smooth alternating error. | Reduce P when the corrections are too large. If their strength is adequate but they persist too long, increase D modestly. |
| Steering changes sharply and D has rapid, large reversals. | Reduce D; check the reflectance traces for abrupt changes that D amplifies. |
| Steering stays at its limit through the failing bend. | Reduce cruise speed or increase \`MAXIMUM_TURN_RATE_RAD_S\` if the wheels can follow the resulting targets. Increasing P cannot raise a saturated steering rate. |
| Measured wheel speeds depart substantially from their targets, or white and black readings overlap. | Revisit the motor settings or sensor measurements from parts 2.2 or 2.1 before tuning PID. |

For a bend of radius <em>R</em> [mm], steering must be approximately
<em>|ω| = v/|R|</em>. At 100 mm/s on a 200 mm bend this is 0.5 rad/s. With I = 0
and small D on a steady bend, P must supply most of that rate, so some nonzero
error is expected. This provides a useful check on whether the chosen P gain
can supply the required turn while the tape remains within sensor range.

Change one parameter at a time, keeping speed and starting placement fixed.
Record the expected effect and compare the same circuit interval. Monitor's
**P gain** and **Cruise speed** controls retain their values between runs without
another Compile; **Restore defaults** selects the source defaults. Record the
actual control values used. Save your selected defaults in \`settings.py\`, then
repeat a successful lap before increasing speed.

The default program stops the motors when both raw sensor readings fall below
their respective visibility thresholds. It ends the run after 0.4 s if neither
sensor detects tape again. At the normal finish, the output reports \`complete\`,
six waypoints, and elapsed time. Confirm that the observed circuit and finish
agree with that result.

## 5. Plot and compare your trials

After each trial, select **Export run data as CSV** in Monitor's **Controls**.
Export the selected sensor and steering plots using **Export plots as SVG** or
**Export plots as PNG**. The image covers the selected **Time window**; the CSV
contains the complete recording.

Use this MATLAB example with your exported filename:

\`\`\`matlab
T = readtable('line_trial_01.csv', 'TextType', 'string');
T = T(T.sample_kind == "course", :);             % Select the program's control samples.
[~, i] = unique(T.acquisition_seq, 'stable');     % Select one row per acquired sample.
T = T(i, :);
t = T.acquired_at_s - T.acquired_at_s(1);         % Time from the first sample [s].

figure;
tiledlayout(3, 1);
nexttile;
plot(t, T.program_reflectance_left, t, T.program_reflectance_right);
ylabel('Reflectance'); legend('Left', 'Right'); grid on;
nexttile;
plot(t, T.program_line_error);
ylabel('Line error'); grid on;
nexttile;
plot(t, T.requested_turn_rate_rad_s);
ylabel('Turn rate [rad/s]'); xlabel('Time [s]'); grid on;
exportgraphics(gcf, 'line_trial_01.png', 'Resolution', 200);
\`\`\`

Reflectance plots show raw readings; \`program_line_error\` uses calibrated
readings. During a line-loss stop it retains the last calculated error, so use
both reflectance traces to interpret that interval. Use
\`program_waypoints_reached\` to locate corresponding parts of different trials.

For steering comparisons, also plot \`program_line_p_rad_s\` and
\`program_line_d_rad_s\`. For wheel-speed comparisons, plot
\`left_wheel_speed_mm_s\` and \`right_wheel_speed_mm_s\` against
\`target_left_wheel_speed_mm_s\` and \`target_right_wheel_speed_mm_s\`.

## Testing Your Code Implementations

**A. Run code tests.** Select **Run code tests** to execute checks of your
component methods without driving the robot. An unfinished \`LineFollower\`
will be reported as needing implementation. These checks use your component
files regardless of the selectors below.

**B. Test one component at a time.** The Project includes supplied implementations
of the sensor processor, differential drive, and line follower. In
[robot_setup.py](robot_setup.py), set one selector to \`True\` and the other two
to \`False\` to run with one of your components at a time. For example:

\`\`\`python
USE_STUDENT_SENSOR_PROCESSOR = True
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False
\`\`\`

\`True\` selects your Project file; \`False\` selects the supplied implementation.
Use this procedure to test your sensor processor and differential drive before
implementing the line follower, and to isolate a component when investigating
poor tracking. **On challenge day, all three selectors must be \`True\`.**

## Your report (part of your portfolio)

Submit one report per pair, including:

1. **Implementation.** Explain your calibrated steering error, PID contributions,
   speed reduction, and waypoint-bar behavior. Include your commented code.
2. **Trials.** Tabulate actual speed and P/I/D settings, observed outcome,
   waypoint count, and elapsed time. Include an initial trial, a comparison
   chosen from the evidence, and a repeat of the selected setting. Retain failed
   trials and identify manually stopped runs. Name the robot, circuit, and target
   mode for each trial.
3. **Plots and interpretation.** Show the sensor and steering plots for the
   compared interval. Explain your prediction, the observed change, and why the
   evidence supports your selected settings. State whether the robot completed
   the circuit repeatably.

Attach the CSV exports, figures, MATLAB script, code-test results, and a Project
ZIP containing your final files. Include both partners' names.

## Project files

<div class="project-file-table">

| File | Purpose |
| --- | --- |
| [line_follower.py](line_follower.py) | Implement steering and motion through waypoint bars. |
| [sensor_processor.py](sensor_processor.py) | Reuse your wheel measurements and paired IR readings from Challenge 1. |
| [differential_drive.py](differential_drive.py) | Reuse your motion-to-wheel-speed conversion from part 2.2. |
| [settings.py](settings.py) | Enter measured calibration and adjust steering defaults. |
| [robot_setup.py](robot_setup.py) | Select student or supplied components and optional recovery behavior. |
| [main.py](main.py), [lap_progress.py](lap_progress.py) | Supplied program, sensor calibration, crossing count, and stop decisions. |
| [supplied_settings.py](supplied_settings.py), [live_variables.py](live_variables.py) | Supplied operating settings, plots, and live controls. |
| [challenge.py](challenge.py), [world.json](world.json), [component_checks.py](component_checks.py) | Supplied circuit definition and component tests. |

</div>

## What is main.py doing?

The supplied [main.py](main.py) reads measurements, applies the live controls,
and asks \`LineCircuit\` in \`lap_progress.py\` for the next motion command.
\`LineCircuit\` calibrates reflectance, counts crossings, calls your line follower,
and decides when the lap ends. \`Robot.step()\` converts the command into wheel
speeds, drives the motors, and returns the next measurements. The program
publishes the plots and stops the motors when the run ends.

For a later extension that searches for the tape after leaving it, set
\`STOP_ON_LINE_LOSS = False\` in \`robot_setup.py\`. Your line follower will then
continue receiving white-floor readings and can choose a recovery motion.
`,Tr="# Challenge 3 · Waypoint Courier\n\n## Task\n\nVisit the three destinations in order and finish facing the indicated direction. Use measured wheel travel to estimate the robot's axle-midpoint position and heading, then navigate from that estimate. Compare the reported final pose with an independent floor measurement.\n\n![Starting pose, three destinations in visit order, and final heading.](course-assets/waypoint-courier.svg)\n\n*Figure. The blue S dot and arrow indicate the starting axle pose and +x heading. Numbered orange dots show the three destinations in visit order; the left-pointing arrow at goal 3 shows its required final heading. No measured or planned trajectory is drawn. Coordinates come from `world.json` in millimeters.*\n\n## 1. Implement and measure odometry\n\n1. **Initialize pose.** Establish the estimate at a known starting pose. In `odometry.py`, implement `Odometry.reset(initial_pose)` to store and return that `Pose`. Make the `pose` property return the latest estimate. Position is the drive-axle midpoint in world millimeters; heading is positive counterclockwise from +x, in radians.\n2. **Integrate wheel travel.** Convert each measured wheel increment into a change in pose. Implement `Odometry.update(left_increment_mm, right_increment_mm)` using signed travel since the previous sample and `self.config.track_width_mm`. Return and retain the new `Pose`. Unequal travel follows the wheel paths' exact constant-curvature arc; wrap heading to `[-π, π)`.\n3. **Check known motions.** Run **Run code tests** (`component_checks.py`) without driving. For its straight, in-place turn, and arc inputs, record the wheel increments, predicted change in pose, and returned `Pose`. Compare the direction, units, and heading wrap. A square is an optional additional accumulation check; the route run below supplies the independent floor-pose comparison.\n\n## 2. Implement and test ordered navigation\n\n1. **Track goals.** Retain which destination is active across samples. In `navigation_controller.py`, implement `NavigationController.start(goals)` to save the ordered sequence and reset progress. Make `current_goal()` report the active goal or `None`, and `is_complete()` report whether every required position and heading has been reached. An empty route is complete immediately.\n2. **Choose motion.** Turn pose error into the next motion request. Implement `update(pose)` to return a `MotionCommand` from the estimated `Pose`. Decide how to turn toward, approach, and accept each goal. `heading_rad=None` requires position only; the last goal also requires heading. Use `NavigationConfig` tolerances and motion settings. Return `STOP_COMMAND` after completion.\n3. **Check and select.** Use **Run code tests** to examine distant, near, and wrong-final-heading poses. In `robot_setup.py`, set `USE_STUDENT_ODOMETRY` and `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` after their checks pass so Run uses your methods. Reuse your completed sensing and differential-drive files from Arena Line Circuit, along with the same robot's measured settings. Set their matching flags to `True`; `False` selects the supplied versions. Wheel-speed control remains supplied by the library.\n\n## 3. Run and measure the courier route\n\n1. **Set motion controls.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changed values to the active controller after the next robot sample; approach speed follows cruise speed at 80%. Slider endpoints are configured control limits, not activity targets. Record values used; adjust other navigation settings in `robot_setup.py` when measurements support a change.\n2. **Check the virtual route.** Inspect the start and ordered goals in `world.json`; `challenge.py` loads them as `INITIAL_POSE` and `ROUTE`. Run `main.py` on the Virtual XRP. Use the route trace, estimated heading, `goals_reached`, and Program output to locate overshoot, missed goals, or repeated turns. Revise the controller and repeat as needed before physical trials.\n3. **Measure the physical result.** Run from the marked starting axle pose. Record visit order, missed destinations or contact, and final orientation. Measure final axle-midpoint position and heading on the floor, including reading precision, and compare them with `final_pose` in Program output. If using a front-center mark, measure its axle offset and account for heading. Repeat the selected motion settings three times to assess consistency.\n\n## Save and plot each trial\n\nIf Monitor’s controls are collapsed, select **›** at its upper left to reach\nthe plot and export settings.\n\n1. Before **Run**, record the world, selected student flags, calibration,\n   sample period, and live-control values. Keep those values fixed during a\n   comparison trial. Number every run, including incomplete runs.\n2. After the run ends, use **Monitor → Export → Export run data as CSV** and\n   **Export program output**. Select **Include code in ZIP** and **Export run\n   data (ZIP)** to retain the code and settings used. Name exports by pair,\n   challenge, target, and trial, for example `pair07_ch3_virtual_trial01.csv`.\n   Wait for export completion and open the saved files to check their contents.\n3. Load the CSV in MATLAB with the commands below. Keep the original CSV;\n   filtering the table selects processed course samples for these plots.\n   Virtual physics observations and raw acquisition rows remain in the file.\n   Use the same axis limits when comparing settings. Put trial number and\n   settings in each figure title or caption.\n\n```matlab\nT = readtable('pair07_ch3_virtual_trial01.csv', ...\n    'VariableNamingRule','preserve');\nvalid = strcmp(string(T.sample_kind),'course') & ...\n    isfinite(T.acquired_at_s) & isfinite(T.acquisition_seq);\nT = T(valid,:);\nassert(~isempty(T), 'No course sensor samples were recorded.');\nclock = string(T.clock_id);\nT = T(clock == clock(1),:);\n[~, rows] = unique(T.acquisition_seq, 'stable');\nT = T(rows,:);\nt = T.acquired_at_s; % Seconds from the first encoder acquisition.\n```\n\n```matlab\nfigure; plot(T.estimated_x_mm,T.estimated_y_mm);\naxis equal; xlabel('Estimated x (mm)'); ylabel('Estimated y (mm)'); grid on;\nhold on;\n% Enter the ordered goal coordinates from this trial's world.json:\ngoal_x_mm = [400; 400; 0];\ngoal_y_mm = [0; 300; 300];\nplot(goal_x_mm,goal_y_mm,'o');\nlegend('Estimated route','Goals','Location','best');\nfigure; plot(t,T.estimated_heading_rad);\nxlabel('Time from first encoder acquisition (s)'); ylabel('Estimated heading (rad)'); grid on;\nexportgraphics(gcf,'trial01_heading.png','Resolution',200);\n```\n\nReplace the example filename and both goal vectors with values from the\nselected world; check their order before plotting. Keep equal x/y scale on\nroute plots. For physical runs, add measured final axle-midpoint x/y and heading\nto the trial table; report position error in mm and wrapped heading error in\nrad. Repeat the selected motion settings three times and include incomplete\nroutes. Do not label estimated pose as a floor measurement.\n\nTo inspect the sample timing, select **Monitor → Plot signals → Control period**.\nThe plot compares the measured interval between sensor samples with the\nconfigured period, both in ms. Use measured elapsed time in calculations;\nthe arrival time of a telemetry message in the browser is not the sample time.\n\n## Reading main.py\n\n1. **Create robot and navigation objects.** `make_robot(ROBOT_CONFIG)`\n   assembles the selected sensing, wheel-speed, drive-conversion, and odometry\n   objects. `make_navigation_controller(NAVIGATION_CONFIG)` creates a\n   separate route controller. The processor saves sensor samples, odometry saves the estimated pose,\n   and navigation saves route progress. The settings records hold wheel\n   dimensions, speed limits, and arrival tolerances.\n2. **Start at the known pose.** `robot.start(INITIAL_POSE)` resets measurements\n   and returns `RobotState(measurements, pose)`. `state.pose` is the estimated\n   axle-midpoint `Pose`, with named x/y positions in mm and heading in rad.\n   `navigation.start(ROUTE)` stores the ordered `NavigationGoal` records and\n   resets its active-goal index.\n3. **Request and apply one motion.** While the controller is incomplete,\n   `apply_navigation_controls()` copies current Monitor settings into it.\n   `navigation.update(state.pose)` selects a `MotionCommand` using the latest\n   estimate. `robot.step(...)` converts it to wheel targets, applies motor\n   feedback, measures wheel travel, and updates odometry. The returned state\n   supplies the next pose. Neither the requested motion nor simulated truth\n   replaces the wheel-derived pose in this loop.\n4. **Check observed arrivals.** `count_reached_goals()` compares each new\n   estimated pose with the next goal using current position/heading tolerances.\n   Its count is separate from the navigation object's completion claim.\n   Monitor receives that count and estimated heading. `step_count` counts\n   updates for debugging; it is not elapsed time.\n5. **Report and stop.** After controller completion, `main.py` checks that\n   every required arrival was observed in order. It prints the count and\n   final estimated pose, raises an error for incomplete arrival, and removes\n   motor effort in `finally` on completion or error.\n\nOptional `TARGET_LOCATION_KP`, `TARGET_LOCATION_KI`, and `TARGET_LOCATION_KD`\nare defined at zero in `navigation_controller.py` for a student distance-to-speed\nfeedback rule. The supplied controller does not read them. The current\n`update(pose)` method receives position and heading, with no time interval.\nKeep `TARGET_LOCATION_KI` and `TARGET_LOCATION_KD` at zero for this challenge.\n\n## Your report\n\nSubmit one report per pair with both names, robot identification, selected components, world, and trial settings. Label virtual results separately from physical measurements.\n\n1. **Preliminary lab work:** give the odometry model, straight/turn/arc input-output checks, navigation checks, and reasoning behind calibration and controller choices. Include a square check if performed.\n2. **Challenge data:** show the route trace and estimated heading, and tabulate requested, estimated, and measured final position and heading for physical runs. Include visit order and relevant settings.\n3. **Challenge performance:** state which goals and final-heading requirement were reached, and quantify final position and heading errors using the axle midpoint.\n4. **Reflection:** use the preliminary and route data to distinguish pose-estimation error from controller behavior. Identify one supported improvement and the measurement that would test it.\n\n## Project files\n\n<strong class=\"student-file\">Blue *</strong>: code to implement. <strong class=\"config-file\">Amber †</strong>: settings to adjust. <span class=\"supplied-file\">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class=\"project-file-table\">\n\n| File | What it does |\n| --- | --- |\n| <span class=\"supplied-file\"><code>main.py</code> S</span> | Runs navigation and reports independently counted arrivals and final pose. |\n| <span class=\"supplied-file\"><code>route_progress.py</code> S</span> | Checks estimated-pose arrival at ordered goals using current tolerances. |\n| <strong class=\"student-file\"><code>odometry.py</code> *</strong> | Accumulates wheel increments to estimate position and heading. |\n| <strong class=\"student-file\"><code>navigation_controller.py</code> *</strong> | Uses estimated pose to reach ordered destinations. |\n| <span class=\"supplied-file\"><code>sensor_processor.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |\n| <span class=\"supplied-file\"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <strong class=\"config-file\"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |\n| <strong class=\"config-file\"><code>challenge.py</code> †</strong> | `INITIAL_POSE` — starting pose read from the world.<br>`ROUTE` — world waypoint sequence in visit order. |\n| <strong class=\"config-file\"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |\n| <span class=\"supplied-file\"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <strong class=\"config-file\"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm. |\n\n</div>\n\n## Functions and methods\n\nKeep the template method names and arguments. Use measured `dt_s` or sample\ntimestamps for calculations involving time. Keep the supplied wheel-controller\nsettings in `robot_setup.py`. The API Reference gives the full record fields\nand method requirements.\n\n\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `Odometry.reset(initial_pose)` | Known `Pose` in mm and rad | Stores and returns starting `Pose`. |\n| `Odometry.update(left_increment_mm, right_increment_mm)` | Signed wheel increments in mm | Updated estimated `Pose`. |\n| `Odometry.pose` | Property read after reset | Latest estimated `Pose`. |\n| `NavigationController.start(goals)` | Ordered `NavigationGoal` values | Starts at first goal; an empty route is complete. |\n| `NavigationController.set_config(config)` | Complete `NavigationConfig` | Inherited method changes settings without restarting the route. |\n| `NavigationController.update(pose)` | Estimated `Pose` | Next `MotionCommand` in mm/s and rad/s. |\n| `NavigationController.current_goal()` | None | Active goal or `None`. |\n| `NavigationController.is_complete()` | None | Boolean route-completion status. |\n| `count_reached_goals(pose, route, reached_count, config)` | Estimated pose, ordered goals, previous count, current settings | Updated independently observed arrival count. |\n",Er='# Challenge 4 · Mapped Route\n\n## Task\n\nPlan a connected route around known obstacles, then have the Virtual XRP follow it. Account for the robot\'s footprint and path-following error when assessing clearance.\n\n![Start, destination, and central obstacle in the reachable map.](course-assets/mapped-route.svg)\n\n*Figure. The blue S dot and arrow show the starting axle pose and heading; the orange G dot marks the destination. The dark filled rectangle is the known central obstacle at its map dimensions. No grid cells or computed route are shown; `world.json` supplies the geometry in millimeters.*\n\n## 1. Inspect the map and predict outcomes\n\n1. **Predict each world.** Inspect **Mapped route**, **Destination blocked**, and **No connecting route** in `world.json`. Mark start, destination, obstacles, and boundary; predict whether a free-cell route exists in each.\n2. **Inspect grid settings.** Determine which locations the robot can plan through. In `challenge.py`, `GRID_RESOLUTION_MM` sets cell width and `CLEARANCE_MM` expands obstacles and boundaries for robot size and tracking margin. `main.py` passes them and `ARENA_MAP` to supplied `OccupancyGrid.from_arena()`. The 100 mm/cell and 150 mm starting values are adjustable settings. Predict how a change could alter free cells.\n3. **Read the grid.** With `EXECUTE_ROUTE = False` in `challenge.py`, run `main.py`. Compare the Program-output grid with the Monitor world. Explain a location that appears clear geometrically but is blocked after sampling and clearance.\n\n## 2. Implement and check grid search\n\n1. **Implement search.** Find a connected sequence of free cells. In `grid_planner.py`, implement `GridPlanner.plan(grid, start, goal)`. Return a `GridPath` that includes both free endpoints and crosses one horizontal or vertical cell edge per step. Return `None` for a `None` or blocked endpoint or no connecting route. Choose and explain your search and path-recovery method; shortest path is not required.\n2. **Check cases.** Test how the search handles endpoints and disconnection before motion. Use **Run code tests** (`component_checks.py`) without driving. Check a free start equal to goal, a blocked endpoint, and a disconnected map. `grid.is_blocked(cell)` and `grid.neighbors(cell)` expose the same grid rules as the route check.\n3. **Compare worlds.** Set `USE_STUDENT_GRID_PLANNER = True` in `robot_setup.py` after checking the planner so Run uses your search. Reuse the completed component files and measured robot settings from Waypoint Courier, and set their matching flags to `True`; `False` selects supplied versions. With **Virtual XRP** selected and `EXECUTE_ROUTE = False`, choose each named case in **Monitor → World** and run it. Compare predictions with Program output and inspect each returned path\'s endpoints, free cells, and steps. `main.py` reports `valid_path`, `no_path`, or `invalid_path`.\n\n## 3. Run and assess the route\n\n1. **Record motion settings.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changes after the next robot sample; approach speed remains 80% of selected cruise speed. Slider endpoints are configured control limits. Record values used; `robot_setup.py` also holds slowing distance and pose tolerances.\n2. **Follow the virtual path.** For **Mapped route**, set `EXECUTE_ROUTE = True` in `challenge.py` and run the Virtual XRP. Supplied `main.py` converts the checked `GridPath` into goals; `route_runner.py` follows them with the selected `NavigationController` and checks arrival. Compare the printed path with the trajectory, obstacle clearance, contact, and final pose. If the robot contacts an obstacle or misses the destination, compare the planned clearance with its path and adjust clearance or navigation settings based on the discrepancy.\n3. **Measure a physical route if performed.** A physical trial is optional. First compare floor geometry and robot dimensions with `world.json`. Record closest obstacle gap and measurement method, contact, and final axle-midpoint pose. Distinguish measurements from estimated pose and virtual trajectory.\n\n## Save and plot each trial\n\nIf Monitor’s controls are collapsed, select **›** at its upper left to reach\nthe plot and export settings.\n\n1. Before **Run**, record the world, selected student flags, calibration,\n   sample period, and live-control values. Keep those values fixed during a\n   comparison trial. Number every run, including incomplete runs.\n2. After the run ends, use **Monitor → Export → Export run data as CSV** and\n   **Export program output**. Select **Include code in ZIP** and **Export run\n   data (ZIP)** to retain the code and settings used. Name exports by pair,\n   challenge, target, and trial, for example `pair07_ch4_virtual_trial01.csv`.\n   Wait for export completion and open the saved files to check their contents.\n3. Load the CSV in MATLAB with the commands below. Keep the original CSV;\n   filtering the table selects processed course samples for these plots.\n   Virtual physics observations and raw acquisition rows remain in the file.\n   Use the same axis limits when comparing settings. Put trial number and\n   settings in each figure title or caption.\n\n```matlab\nT = readtable(\'pair07_ch4_virtual_trial01.csv\', ...\n    \'VariableNamingRule\',\'preserve\');\nvalid = strcmp(string(T.sample_kind),\'course\') & ...\n    isfinite(T.acquired_at_s) & isfinite(T.acquisition_seq);\nT = T(valid,:);\nassert(~isempty(T), \'No course sensor samples were recorded.\');\nclock = string(T.clock_id);\nT = T(clock == clock(1),:);\n[~, rows] = unique(T.acquisition_seq, \'stable\');\nT = T(rows,:);\nt = T.acquired_at_s; % Seconds from the first encoder acquisition.\n```\n\nFor the motion-free checkoff, retain Program output: grid, endpoint cells,\npath cells, and validation result. There is no driven trajectory in that run.\nFor each executed route, load its CSV and plot:\n\n```matlab\nfigure; plot(T.estimated_x_mm,T.estimated_y_mm);\naxis equal; xlabel(\'Estimated x (mm)\'); ylabel(\'Estimated y (mm)\'); grid on;\nfigure;\nsubplot(2,1,1); plot(t,T.requested_forward_speed_mm_s);\nxlabel(\'Time from first encoder acquisition (s)\'); ylabel(\'Requested forward speed (mm/s)\'); grid on;\nsubplot(2,1,2); plot(t,T.requested_turn_rate_rad_s);\nxlabel(\'Time from first encoder acquisition (s)\'); ylabel(\'Requested turn rate (rad/s)\'); grid on;\nexportgraphics(gcf,\'trial01_requests.png\',\'Resolution\',200);\n```\n\nReplace the example filename with the mapped-route trial CSV. In the report,\nshow the printed planned cells and the estimated executed trace as separate\nresults. Tabulate world, grid resolution, clearance, path length in cells,\nvalidation/result, and final estimated/measured pose. Include the required\nblocked-endpoint and no-path checks; retain their outputs.\n\nTo inspect the sample timing, select **Monitor → Plot signals → Control period**.\nThe plot compares the measured interval between sensor samples with the\nconfigured period, both in ms. Use measured elapsed time in calculations;\nthe arrival time of a telemetry message in the browser is not the sample time.\n\n## Reading main.py\n\n1. **Construct the grid before motion.** `challenge.py` loads the map,\n   start, destination, cell size, and clearance.\n   `OccupancyGrid.from_arena(...)` expands obstacles by clearance and marks\n   blocked cells. `main.py` rejects grids exceeding `MAXIMUM_GRID_CELLS`.\n   `world_to_cell()` converts each world-coordinate endpoint into a\n   `GridCell(column, row)` record, or `None` if outside the map.\n2. **Call your planner.** `make_grid_planner().plan(grid, start, goal)` returns\n   a `GridPath` object with its ordered `cells`, or `None`. `path_error()`\n   checks endpoints, free cells, and adjacent horizontal/vertical steps.\n   `print_grid()` prints the map and the accepted path; invalid or absent\n   paths produce a result without driving.\n3. **Keep planning separate from execution.** With `EXECUTE_ROUTE = False`,\n   the program ends after printing a valid path. After the planning checkoff,\n   `True` converts cell centers into `NavigationGoal` records. The last goal\n   is replaced by the exact destination rather than its cell center.\n4. **Assemble and follow.** Only this execution branch calls `make_robot()`\n   and `make_navigation_controller()`. `run_route()` starts the robot,\n   repeatedly requests motion from estimated `Pose`, and applies it through\n   `robot.step()`. It confirms destination position/heading, publishes progress,\n   and stops the motors on completion or error. Planning cells are a proposed\n   route; wheel measurements determine the estimated executed route.\n\nKeep the optional `TARGET_LOCATION_KI` and `TARGET_LOCATION_KD` values in\n`navigation_controller.py` at zero. Its `update(pose)` method receives no\ntime interval.\n\n## Your report\n\nSubmit one report per pair with both names, selected components, worlds, grid settings, and navigation settings. Label virtual observations and any physical measurements.\n\n1. **Preliminary lab work:** show the predicted outcome for each world, your search and path-recovery approach, component-check evidence, and why the selected cell size and clearance are appropriate.\n2. **Challenge data:** show the reachable world\'s grid and path, tabulate predicted and returned outcomes for all three worlds, and include the planned path and virtual trajectory with relevant settings.\n3. **Challenge performance:** report path validity, destination arrival, obstacle contact, and clearance observations. Include measured gap and final pose if a physical trial was performed.\n4. **Reflection:** explain any difference between a valid cell path and the robot\'s motion using evidence from the map, path, and trajectory. Identify a justified adjustment and how to test it.\n\n## Project files\n\n<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class="project-file-table">\n\n| File | What it does |\n| --- | --- |\n| <span class="supplied-file"><code>main.py</code> S</span> | Builds the grid, checks and prints the path, then optionally starts route execution. |\n| <span class="supplied-file"><code>route_runner.py</code> S</span> | Follows validated navigation goals, reports arrival, and stops the robot on exit. |\n| <span class="supplied-file"><code>route_validation.py</code> S</span> | Checks path traversability and final estimated-pose arrival. |\n| <strong class="student-file"><code>grid_planner.py</code> *</strong> | Searches the occupancy grid for a connected free-cell path. |\n| <span class="supplied-file"><code>sensor_processor.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |\n| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |\n| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |\n| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER`, `USE_STUDENT_GRID_PLANNER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |\n| <strong class="config-file"><code>challenge.py</code> †</strong> | `INITIAL_POSE`, `DESTINATION` — starting pose and destination read from the world.<br>`ARENA_MAP` — geometry used to build the occupancy grid.<br>`GRID_RESOLUTION_MM` — square grid-cell width in mm.<br>`CLEARANCE_MM` — distance in mm kept from obstacles and arena edges.<br>`MAXIMUM_GRID_CELLS` — maximum grid-cell count accepted before planning.<br>`EXECUTE_ROUTE` — False prints a checked path; True also drives that path. |\n| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |\n| <span class="supplied-file"><code>grid_display.py</code> S</span> | Prints the grid, endpoints, and path. |\n| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm.<br>`obstacles` — fixed blocked regions in mm. |\n\n</div>\n\n## Functions and methods\n\nKeep the template method names and arguments. Use measured `dt_s` or sample\ntimestamps for calculations involving time. Keep the supplied wheel-controller\nsettings in `robot_setup.py`. The API Reference gives the full record fields\nand method requirements.\n\n\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm)` | `ArenaMap`, resolution and clearance in mm | Sampled free/blocked grid. |\n| `GridPlanner.plan(grid, start, goal)` | `OccupancyGrid`, two `GridCell` endpoints or `None` | Connected `GridPath` including endpoints, or `None`. |\n| `GridPath.to_goals(grid)` | Grid used for planning | World-coordinate navigation goals at turns and destination. |\n| `path_error(grid, start, goal, path)` | Grid, endpoints, proposed path | `None` for valid path or reason it cannot be followed. |\n| `goal_is_reached(pose, goal, config)` | Estimated final pose, destination, navigation settings | Boolean arrival within position and heading tolerances. |\n| `run_route(robot, navigation, initial_pose, goals, destination, path_cell_count)` | Selected robot/controller, starting pose, checked route goals, destination, cell count | Executes route, prints result and final pose, stops robot on exit. |\n',Dr='# Challenge 5 · Out-and-Back\n\n## Task\n\nFollow the assigned outbound route, stop at the observation pose, determine whether the center gate is blocked, and plan a return home. The gate is the only unknown map feature; the robot measures it while stationary.\n\n![Assigned outbound route, home, observation point, and center gate.](course-assets/out-and-back.svg)\n\n*Figure. Blue H, 1, and 2 markers show home and the ordered outbound stops; the orange O marker and left-pointing arrow show the stationary observation pose and heading. The dashed teal line is the assigned outbound route. Dark filled rectangles mark the fixed upper/lower walls and far reflector; the orange dashed rectangle is the center gate whose occupancy is observed. No return route is drawn. Dimensions come from `world.json` in millimeters.*\n\n## 1. Measure the gate before mission trials\n\n1. **Collect stationary readings.** Measure how range changes with the gate state. At the physical observation pose, aim the stopped robot toward the gate. In the file list, choose **Actions for experiment_range_readout.py → Make main**, then **Compile** and **Run**. Selecting a file in the editor alone does not change what Run executes. Collect repeated batches with the gate blocked and open without changing position or aim. The readout prints raw attempts, including `None` for an unavailable echo. `RANGE_SAMPLE_COUNT` in `challenge.py` initially requests seven attempts per batch; the count is adjustable.\n2. **Compare conditions.** Record each batch and count its positive, finite readings. Calculate their median by hand; mark the result unavailable when the count is below `MINIMUM_USABLE_RANGE_COUNT`. Compare the blocked and open medians and their variation across batches. If they overlap, inspect aim and reflecting surfaces and collect further measurements.\n3. **Choose a threshold.** Set `BLOCKED_RANGE_THRESHOLD_MM` in `challenge.py` between the groups of blocked and open medians. Supplied `observed_gate()` in `mission_policy.py` reports blocked at or below that range. Record the measurement basis; the 550 mm starter value is a default.\n\n## 2. Implement and check the range estimate\n\n1. **Implement the estimate.** Reduce a batch of raw attempts to one range value. In `sensor_processor.py`, implement `SensorProcessor.estimate_range(samples, minimum_usable)`. Keep positive finite numeric readings in millimeters; reject `None`, Boolean, zero, negative, and nonfinite values. Return their median, or `None` when fewer than `minimum_usable` remain. An unavailable estimate cannot mean open gate.\n2. **Check sample batches.** Use **Run code tests** (`component_checks.py`) to compare the method with supplied examples that include missing readings and an unusually large reading. These checks use fixed inputs, not your collected batches. `MINIMUM_USABLE_RANGE_COUNT` in `challenge.py` currently passes four; it is a configurable decision setting.\n3. **Select the component.** In `robot_setup.py`, set `USE_STUDENT_SENSOR_PROCESSOR = True` after checking it so Run uses your range estimate. Keep the wheel-measurement methods completed in Robot Curling and reuse the other completed component files and robot settings from Mapped Route. Set their matching flags to `True`; `False` selects supplied versions. The supplied helpers handle route execution, stopping checks, and return-map construction. `main.py` shows their sequence and calls your range estimator; `mission_policy.py` applies the gate threshold.\n\n## 3. Compare return routes and physical runs\n\n1. **Compare virtual decisions.** Check whether the two observations lead to different return plans. Restore **Actions for main.py → Make main**, then **Compile**. With **Virtual XRP** selected, choose **Center gate blocked** and then **Center gate open** in **Monitor → World**, running each case. `world.json` defines the simulated obstacles; `main.py` infers the gate state from range samples. Calculate the median of the printed `stationary_range_samples_mm` and compare it with `range_estimate_mm`. Record `gate_blocked`, return path length, result, and return time when available. The outbound route is the same in both worlds.\n2. **Record map settings.** `GRID_RESOLUTION_MM` and `CLEARANCE_MM` in `challenge.py` set the return grid and obstacle expansion; their defaults are 100 mm/cell and 95 mm. `plan_return()` in `return_route.py` changes the known map\'s `center_gate` feature from the range decision before calling the selected `GridPlanner`. Record these settings with the threshold; change them to test a stated reason.\n3. **Run physical conditions.** Run with gate blocked and open, fixed during each run. The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changes after the next robot sample; approach speed is 80% of cruise speed. Slider endpoints are configured limits. Use the same motion settings for a blocked/open comparison.\n4. **Measure arrival.** Record the stop at observation, gate decision, return route, and arrival home. Measure final axle-midpoint position and heading against the home mark, or record an early stopping location. If using a front-center mark, account for its axle offset and final heading. Repeat the selected condition three times and record measurement precision.\n\n## Save and plot each trial\n\nIf Monitor’s controls are collapsed, select **›** at its upper left to reach\nthe plot and export settings.\n\n1. Before **Run**, record the world, selected student flags, calibration,\n   sample period, and live-control values. Keep those values fixed during a\n   comparison trial. Number every run, including incomplete runs.\n2. After the run ends, use **Monitor → Export → Export run data as CSV** and\n   **Export program output**. Select **Include code in ZIP** and **Export run\n   data (ZIP)** to retain the code and settings used. Name exports by pair,\n   challenge, target, and trial, for example `pair07_ch5_virtual_trial01.csv`.\n   Wait for export completion and open the saved files to check their contents.\n3. Load the CSV in MATLAB with the commands below. Keep the original CSV;\n   filtering the table selects processed course samples for these plots.\n   Virtual physics observations and raw acquisition rows remain in the file.\n   Use the same axis limits when comparing settings. Put trial number and\n   settings in each figure title or caption.\n\n```matlab\nT = readtable(\'pair07_ch5_virtual_trial01.csv\', ...\n    \'VariableNamingRule\',\'preserve\');\nvalid = strcmp(string(T.sample_kind),\'course\') & ...\n    isfinite(T.acquired_at_s) & isfinite(T.acquisition_seq);\nT = T(valid,:);\nassert(~isempty(T), \'No course sensor samples were recorded.\');\nclock = string(T.clock_id);\nT = T(clock == clock(1),:);\n[~, rows] = unique(T.acquisition_seq, \'stable\');\nT = T(rows,:);\nt = T.acquired_at_s; % Seconds from the first encoder acquisition.\n```\n\nPlot estimated outbound and return motion from the exported mission CSV:\n\n```matlab\nfigure; plot(T.estimated_x_mm,T.estimated_y_mm);\naxis equal; xlabel(\'Estimated x (mm)\'); ylabel(\'Estimated y (mm)\'); grid on;\nfigure; plot(t,T.range_mm,\'o\');\nxlabel(\'Time from first encoder acquisition (s)\'); ylabel(\'Recorded forward range (mm)\'); grid on;\nexportgraphics(gcf,\'trial01_range.png\',\'Resolution\',200);\n```\n\nReplace the example filename with the mission CSV. The range plot can include\ncached range values; use printed `stationary_range_samples_mm` as the distinct\nattempts for calculating the median. Copy those attempts into a table,\nretaining `None` as missing, and show usable count, median, threshold, and gate\ndecision. For each gate condition retain the printed return path/result/time\nand final pose. Use the same navigation settings for blocked/open comparisons\nand repeat each selected condition three times.\n\nTo inspect the sample timing, select **Monitor → Plot signals → Control period**.\nThe plot compares the measured interval between sensor samples with the\nconfigured period, both in ms. Use measured elapsed time in calculations;\nthe arrival time of a telemetry message in the browser is not the sample time.\n\n## Reading main.py\n\n1. **Create and start.** Imports name the outbound goals, stationary sampling\n   settings, decision rule, and return-planning helpers. `make_robot()`\n   assembles the reused components; `make_navigation_controller()` creates\n   the route controller. `robot.start(INITIAL_POSE)` returns the first\n   measurements and estimated axle-midpoint pose in a `RobotState` record.\n2. **Follow the outbound route.** `follow_route()` loads the ordered goals,\n   requests motion from successive estimated poses, and applies it through\n   `robot.step()`. It returns the latest state and an arrival/stop reason.\n   `robot.stop()` removes effort before observation. Failed arrival ends\n   the mission with an outbound result.\n3. **Confirm rest and collect distinct attempts.** `wait_until_stationary()`\n   requests zero motion until both measured wheel speeds stay below the\n   threshold for the configured interval. If that check fails, the mission\n   ends. Otherwise `collect_range_samples()` collects distinct ultrasound\n   attempts while requesting zero motion. Missing echoes remain `None`;\n   repeatedly reading one cached echo does not count as new attempts.\n4. **Estimate and decide.** `robot.estimate_range()` calls the selected\n   `SensorProcessor.estimate_range(samples, minimum_usable)`.\n   `observed_gate()` compares that estimate with the threshold and returns\n   blocked, open, or unavailable. An unavailable estimate ends the mission.\n   Program output retains the raw batch and estimate for comparison.\n5. **Plan the return.** `plan_return()` changes only the known map\'s named\n   gate feature, constructs the grid, calls the selected `GridPlanner`,\n   checks its path, and converts cells into homebound goals. A path error\n   ends the mission. A valid path is sent to the route controller.\n6. **Return and report.** A second `follow_route()` call follows those goals\n   using measured wheel travel and odometry. The program prints return time\n   from sample timestamps and final estimated pose, publishes the result,\n   and removes motor effort. `finally` also stops after a Python exception. IDE **Stop** requests\n   a stop through the target service; it may interrupt Python before\n   `finally` executes.\n\nThe optional zero target-feedback gains stay in `navigation_controller.py`.\nOnly the known gate changes after the stationary range observation; this\nmission does not construct a new map from moving measurements.\n\n## Your report\n\nSubmit one report per pair with both names, robot identification, selected components, worlds, and trial settings. Label virtual output separately from physical measurements.\n\n1. **Preliminary lab work:** tabulate the stationary blocked/open range batches and usable counts, show the median checks, and justify the chosen threshold and any changed map or navigation settings.\n2. **Challenge data:** show the virtual and physical range estimates, gate decisions, return paths, results, return times when available, and measured final home poses for physical runs.\n3. **Challenge performance:** state whether the outbound stops, observation, gate decision, planned return, and home arrival succeeded in each gate condition. Quantify measured home error where a run completed.\n4. **Reflection:** use the readings and run records to locate any failure in measurement, decision, path, or motion. Identify one supported improvement and how another measurement or trial would test it.\n\n## Project files\n\n<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class="project-file-table">\n\n| File | What it does |\n| --- | --- |\n| <span class="supplied-file"><code>main.py</code> S</span> | Sequences outbound travel, the stopping check, range estimation, return planning, and return travel. |\n| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Estimates range from a batch; also contains earlier wheel measurements. |\n| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |\n| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |\n| <span class="supplied-file"><code>grid_planner.py</code> S</span> | Searches the occupancy grid for a connected free-cell path. |\n| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER`, `USE_STUDENT_GRID_PLANNER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |\n| <strong class="config-file"><code>challenge.py</code> †</strong> | `OUTBOUND_ROUTE`, `HOME` — ordered observation-route goals and return destination.<br>`GRID_RESOLUTION_MM` — return-grid cell width in mm.<br>`CLEARANCE_MM` — distance in mm kept from obstacles and arena edges.<br>`MAXIMUM_GRID_CELLS` — maximum grid-cell count accepted before return planning.<br>`RANGE_SAMPLE_COUNT` — number of distinct range attempts to collect.<br>`MINIMUM_USABLE_RANGE_COUNT` — usable readings required for an estimate.<br>`BLOCKED_RANGE_THRESHOLD_MM` — range in mm at or below which the gate is classified blocked.<br>`GATE_FEATURE` — name of the map feature changed by that decision.<br>`STATIONARY_SPEED_MM_S` — maximum absolute wheel speed in mm/s counted as stopped.<br>`STATIONARY_DURATION_S` — continuous stopped interval in s before range collection.<br>`MAXIMUM_STOP_WAIT_S` — maximum wait in s for confirming rest.<br>`RANGE_COLLECTION_TIMEOUT_S` — maximum collection time in s before missing attempts are reported. |\n| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <span class="supplied-file"><code>mission_policy.py</code> S</span> | Classifies an available range as blocked or open. |\n| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |\n| <span class="supplied-file"><code>mission_steps.py</code> S</span> | Follows routes and counts estimated arrivals at their goals. |\n| <span class="supplied-file"><code>stationary_observation.py</code> S</span> | Confirms continuously low measured wheel speeds before observation. |\n| <span class="supplied-file"><code>return_route.py</code> S</span> | Updates the gate on the map, calls the planner, checks its path, and creates homebound goals. |\n| <span class="supplied-file"><code>experiment_range_readout.py</code> S</span> | Prints raw stationary range attempts. |\n| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm.<br>`obstacles` — fixed blocked regions in mm.<br>`obstacles[].feature` — name of the gate feature identified by a block. |\n\n</div>\n\n## Functions and methods\n\nKeep the template method names and arguments. Use measured `dt_s` or sample\ntimestamps for calculations involving time. Keep the supplied wheel-controller\nsettings in `robot_setup.py`. The API Reference gives the full record fields\nand method requirements.\n\n\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `SensorProcessor.estimate_range(samples, minimum_usable)` | Range attempts in mm or `None`, usable-count setting | Median usable range in mm, or `None`. |\n| `observed_gate(estimate_mm, threshold_mm)` | Estimated range and threshold in mm | `True` blocked, `False` open, `None` unavailable. |\n| `follow_route(robot, navigation, state, goals)` | Robot, navigation, current state, ordered goals | Latest state and arrival or stop reason. |\n| `GridPlanner.plan(grid, start, goal)` | Return grid and two `GridCell` endpoints | Connected `GridPath`, or `None`. |\n| `wait_until_stationary(robot, state)` | Started robot and latest measured state | Latest state and whether both wheels stayed below the stopping-speed threshold. |\n| `plan_return(planner, pose, blocked)` | Selected planner, stopped pose, gate decision | Ordered return goals, path cell count, and error text (`None` on success). |\n',Or=`{
  "default_world": "straight-run",
  "worlds": [
    {
      "id": "straight-run",
      "label": "Straight run",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1143,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": -1143,
          "y1_mm": -150,
          "x2_mm": -1143,
          "y2_mm": 150,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "finish",
          "x_mm": 1143,
          "y_mm": 0,
          "label": "Finish"
        }
      ]
    }
  ]
}
`,kr=`{
  "default_world": "white-floor",
  "worlds": [
    {
      "id": "white-floor",
      "label": "White floor",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -555,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "black-patch",
          "label": "Black patch",
          "width_mm": 400,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 0,
              "y_mm": -200
            },
            {
              "x_mm": 0,
              "y_mm": 200
            }
          ]
        }
      ],
      "markers": []
    },
    {
      "id": "black-patch",
      "label": "Black patch",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -55,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "black-patch",
          "label": "Black patch",
          "width_mm": 400,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 0,
              "y_mm": -200
            },
            {
              "x_mm": 0,
              "y_mm": 200
            }
          ]
        }
      ],
      "markers": []
    }
  ]
}
`,Ar=`{
  "default_world": "circle-arena",
  "worlds": [
    {
      "id": "circle-arena",
      "label": "Open arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": []
    }
  ]
}
`,jr=`{
  "default_world": "arena-circuit",
  "worlds": [
    {
      "id": "arena-circuit",
      "label": "Circuit 1 \\u00b7 original arena loop",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Arena circuit",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -1169,
              "y_mm": 0
            },
            {
              "x_mm": 900,
              "y_mm": 0
            },
            {
              "x_mm": 1100,
              "y_mm": 50
            },
            {
              "x_mm": 1200,
              "y_mm": 175
            },
            {
              "x_mm": 1100,
              "y_mm": 300
            },
            {
              "x_mm": 900,
              "y_mm": 350
            },
            {
              "x_mm": -1169,
              "y_mm": 350
            },
            {
              "x_mm": -1290,
              "y_mm": 300
            },
            {
              "x_mm": -1340,
              "y_mm": 175
            },
            {
              "x_mm": -1290,
              "y_mm": 50
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -1169,
              "y_mm": -65
            },
            {
              "x_mm": -1169,
              "y_mm": 65
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -713.97,
              "y_mm": 65.0
            },
            {
              "x_mm": -713.97,
              "y_mm": -65.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 651.12,
              "y_mm": 65.0
            },
            {
              "x_mm": 651.12,
              "y_mm": -65.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 651.12,
              "y_mm": 285.0
            },
            {
              "x_mm": 651.12,
              "y_mm": 415.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -713.97,
              "y_mm": 285.0
            },
            {
              "x_mm": -713.97,
              "y_mm": 415.0
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1304,
          "minimum_y_mm": -80,
          "maximum_x_mm": -1144,
          "maximum_y_mm": 80,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -713.97,
          "y_mm": 0.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 651.12,
          "y_mm": 0.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 651.12,
          "y_mm": 350.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -713.97,
          "y_mm": 350.0
        }
      ]
    },
    {
      "id": "circuit-2",
      "label": "Circuit 2 \\u00b7 broad oval",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -745,
        "y_mm": -310,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 2 \\u00b7 broad oval",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -690.0,
              "y_mm": -310
            },
            {
              "x_mm": 810.0,
              "y_mm": -310
            },
            {
              "x_mm": 890.2,
              "y_mm": -299.4
            },
            {
              "x_mm": 965.0,
              "y_mm": -268.5
            },
            {
              "x_mm": 998.7,
              "y_mm": -245.9
            },
            {
              "x_mm": 1029.2,
              "y_mm": -219.2
            },
            {
              "x_mm": 1078.5,
              "y_mm": -155.0
            },
            {
              "x_mm": 1096.4,
              "y_mm": -118.6
            },
            {
              "x_mm": 1117.3,
              "y_mm": -40.5
            },
            {
              "x_mm": 1120.0,
              "y_mm": 0.0
            },
            {
              "x_mm": 1109.4,
              "y_mm": 80.2
            },
            {
              "x_mm": 1078.5,
              "y_mm": 155.0
            },
            {
              "x_mm": 1029.2,
              "y_mm": 219.2
            },
            {
              "x_mm": 965.0,
              "y_mm": 268.5
            },
            {
              "x_mm": 928.6,
              "y_mm": 286.4
            },
            {
              "x_mm": 850.5,
              "y_mm": 307.3
            },
            {
              "x_mm": -810.0,
              "y_mm": 310
            },
            {
              "x_mm": -890.2,
              "y_mm": 299.4
            },
            {
              "x_mm": -965.0,
              "y_mm": 268.5
            },
            {
              "x_mm": -998.7,
              "y_mm": 245.9
            },
            {
              "x_mm": -1029.2,
              "y_mm": 219.2
            },
            {
              "x_mm": -1078.5,
              "y_mm": 155.0
            },
            {
              "x_mm": -1096.4,
              "y_mm": 118.6
            },
            {
              "x_mm": -1117.3,
              "y_mm": 40.5
            },
            {
              "x_mm": -1117.3,
              "y_mm": -40.5
            },
            {
              "x_mm": -1096.4,
              "y_mm": -118.6
            },
            {
              "x_mm": -1078.5,
              "y_mm": -155.0
            },
            {
              "x_mm": -1029.2,
              "y_mm": -219.2
            },
            {
              "x_mm": -965.0,
              "y_mm": -268.5
            },
            {
              "x_mm": -928.6,
              "y_mm": -286.4
            },
            {
              "x_mm": -850.5,
              "y_mm": -307.3
            },
            {
              "x_mm": -810.0,
              "y_mm": -310.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -690,
              "y_mm": -375
            },
            {
              "x_mm": -690,
              "y_mm": -245
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -373.82,
              "y_mm": -245.0
            },
            {
              "x_mm": -373.82,
              "y_mm": -375.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 574.72,
              "y_mm": -245.0
            },
            {
              "x_mm": 574.72,
              "y_mm": -375.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 566.79,
              "y_mm": 242.76
            },
            {
              "x_mm": 567.0,
              "y_mm": 372.76
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -526.55,
              "y_mm": 244.54
            },
            {
              "x_mm": -526.34,
              "y_mm": 374.54
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -825,
          "minimum_y_mm": -390,
          "maximum_x_mm": -665,
          "maximum_y_mm": -230,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -373.82,
          "y_mm": -310.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 574.72,
          "y_mm": -310.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 566.9,
          "y_mm": 307.76
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -526.45,
          "y_mm": 309.54
        }
      ]
    },
    {
      "id": "circuit-3",
      "label": "Circuit 3 \\u00b7 taller oval",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -645,
        "y_mm": -390,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 3 \\u00b7 taller oval",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -590.0,
              "y_mm": -390
            },
            {
              "x_mm": 710.0,
              "y_mm": -390
            },
            {
              "x_mm": 810.9,
              "y_mm": -376.7
            },
            {
              "x_mm": 859.2,
              "y_mm": -360.3
            },
            {
              "x_mm": 947.4,
              "y_mm": -309.4
            },
            {
              "x_mm": 985.8,
              "y_mm": -275.8
            },
            {
              "x_mm": 1047.7,
              "y_mm": -195.0
            },
            {
              "x_mm": 1070.3,
              "y_mm": -149.2
            },
            {
              "x_mm": 1096.7,
              "y_mm": -50.9
            },
            {
              "x_mm": 1096.7,
              "y_mm": 50.9
            },
            {
              "x_mm": 1086.7,
              "y_mm": 100.9
            },
            {
              "x_mm": 1047.7,
              "y_mm": 195.0
            },
            {
              "x_mm": 985.8,
              "y_mm": 275.8
            },
            {
              "x_mm": 947.4,
              "y_mm": 309.4
            },
            {
              "x_mm": 859.2,
              "y_mm": 360.3
            },
            {
              "x_mm": 760.9,
              "y_mm": 386.7
            },
            {
              "x_mm": -710.0,
              "y_mm": 390
            },
            {
              "x_mm": -810.9,
              "y_mm": 376.7
            },
            {
              "x_mm": -859.2,
              "y_mm": 360.3
            },
            {
              "x_mm": -947.4,
              "y_mm": 309.4
            },
            {
              "x_mm": -1019.4,
              "y_mm": 237.4
            },
            {
              "x_mm": -1070.3,
              "y_mm": 149.2
            },
            {
              "x_mm": -1086.7,
              "y_mm": 100.9
            },
            {
              "x_mm": -1096.7,
              "y_mm": 50.9
            },
            {
              "x_mm": -1096.7,
              "y_mm": -50.9
            },
            {
              "x_mm": -1070.3,
              "y_mm": -149.2
            },
            {
              "x_mm": -1019.4,
              "y_mm": -237.4
            },
            {
              "x_mm": -985.8,
              "y_mm": -275.8
            },
            {
              "x_mm": -947.4,
              "y_mm": -309.4
            },
            {
              "x_mm": -859.2,
              "y_mm": -360.3
            },
            {
              "x_mm": -760.9,
              "y_mm": -386.7
            },
            {
              "x_mm": -710.0,
              "y_mm": -390.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -590,
              "y_mm": -455
            },
            {
              "x_mm": -590,
              "y_mm": -325
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -309.65,
              "y_mm": -325.0
            },
            {
              "x_mm": -309.65,
              "y_mm": -455.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 531.42,
              "y_mm": -325.0
            },
            {
              "x_mm": 531.42,
              "y_mm": -455.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 527.65,
              "y_mm": 322.22
            },
            {
              "x_mm": 527.94,
              "y_mm": 452.22
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -477.03,
              "y_mm": 324.48
            },
            {
              "x_mm": -476.74,
              "y_mm": 454.48
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -725,
          "minimum_y_mm": -470,
          "maximum_x_mm": -565,
          "maximum_y_mm": -310,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -309.65,
          "y_mm": -390.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 531.42,
          "y_mm": -390.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 527.79,
          "y_mm": 387.22
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -476.88,
          "y_mm": 389.48
        }
      ]
    },
    {
      "id": "circuit-4",
      "label": "Circuit 4 \\u00b7 long oval",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -915,
        "y_mm": -260,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 4 \\u00b7 long oval",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -860.0,
              "y_mm": -260
            },
            {
              "x_mm": 1013.9,
              "y_mm": -257.8
            },
            {
              "x_mm": 1079.5,
              "y_mm": -240.2
            },
            {
              "x_mm": 1110.0,
              "y_mm": -225.2
            },
            {
              "x_mm": 1138.3,
              "y_mm": -206.3
            },
            {
              "x_mm": 1186.3,
              "y_mm": -158.3
            },
            {
              "x_mm": 1205.2,
              "y_mm": -130.0
            },
            {
              "x_mm": 1231.1,
              "y_mm": -67.3
            },
            {
              "x_mm": 1237.8,
              "y_mm": -33.9
            },
            {
              "x_mm": 1237.8,
              "y_mm": 33.9
            },
            {
              "x_mm": 1220.2,
              "y_mm": 99.5
            },
            {
              "x_mm": 1205.2,
              "y_mm": 130.0
            },
            {
              "x_mm": 1163.8,
              "y_mm": 183.8
            },
            {
              "x_mm": 1110.0,
              "y_mm": 225.2
            },
            {
              "x_mm": 1079.5,
              "y_mm": 240.2
            },
            {
              "x_mm": 1013.9,
              "y_mm": 257.8
            },
            {
              "x_mm": -1013.9,
              "y_mm": 257.8
            },
            {
              "x_mm": -1079.5,
              "y_mm": 240.2
            },
            {
              "x_mm": -1110.0,
              "y_mm": 225.2
            },
            {
              "x_mm": -1138.3,
              "y_mm": 206.3
            },
            {
              "x_mm": -1186.3,
              "y_mm": 158.3
            },
            {
              "x_mm": -1205.2,
              "y_mm": 130.0
            },
            {
              "x_mm": -1231.1,
              "y_mm": 67.3
            },
            {
              "x_mm": -1237.8,
              "y_mm": 33.9
            },
            {
              "x_mm": -1237.8,
              "y_mm": -33.9
            },
            {
              "x_mm": -1220.2,
              "y_mm": -99.5
            },
            {
              "x_mm": -1205.2,
              "y_mm": -130.0
            },
            {
              "x_mm": -1186.3,
              "y_mm": -158.3
            },
            {
              "x_mm": -1138.3,
              "y_mm": -206.3
            },
            {
              "x_mm": -1079.5,
              "y_mm": -240.2
            },
            {
              "x_mm": -1013.9,
              "y_mm": -257.8
            },
            {
              "x_mm": -980.0,
              "y_mm": -260.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -860,
              "y_mm": -325
            },
            {
              "x_mm": -860,
              "y_mm": -195
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -471.71,
              "y_mm": -194.54
            },
            {
              "x_mm": -471.56,
              "y_mm": -324.54
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 693.38,
              "y_mm": -193.18
            },
            {
              "x_mm": 693.53,
              "y_mm": -323.18
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 649.09,
              "y_mm": 192.8
            },
            {
              "x_mm": 649.09,
              "y_mm": 322.8
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -649.09,
              "y_mm": 192.8
            },
            {
              "x_mm": -649.09,
              "y_mm": 322.8
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -995,
          "minimum_y_mm": -340,
          "maximum_x_mm": -835,
          "maximum_y_mm": -180,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -471.64,
          "y_mm": -259.54
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 693.46,
          "y_mm": -258.18
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 649.09,
          "y_mm": 257.8
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -649.09,
          "y_mm": 257.8
        }
      ]
    },
    {
      "id": "circuit-5",
      "label": "Circuit 5 \\u00b7 left-offset oval",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -805,
        "y_mm": -310,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 5 \\u00b7 left-offset oval",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -750.0,
              "y_mm": -310
            },
            {
              "x_mm": 730.0,
              "y_mm": -310
            },
            {
              "x_mm": 815.4,
              "y_mm": -298.8
            },
            {
              "x_mm": 856.3,
              "y_mm": -284.9
            },
            {
              "x_mm": 930.9,
              "y_mm": -241.8
            },
            {
              "x_mm": 991.8,
              "y_mm": -180.9
            },
            {
              "x_mm": 1015.8,
              "y_mm": -145.0
            },
            {
              "x_mm": 1048.8,
              "y_mm": -65.4
            },
            {
              "x_mm": 1057.2,
              "y_mm": -23.1
            },
            {
              "x_mm": 1057.2,
              "y_mm": 63.1
            },
            {
              "x_mm": 1048.8,
              "y_mm": 105.4
            },
            {
              "x_mm": 1015.8,
              "y_mm": 185.0
            },
            {
              "x_mm": 991.8,
              "y_mm": 220.9
            },
            {
              "x_mm": 930.9,
              "y_mm": 281.8
            },
            {
              "x_mm": 856.3,
              "y_mm": 324.9
            },
            {
              "x_mm": 773.1,
              "y_mm": 347.2
            },
            {
              "x_mm": -870.0,
              "y_mm": 350
            },
            {
              "x_mm": -955.4,
              "y_mm": 338.8
            },
            {
              "x_mm": -996.3,
              "y_mm": 324.9
            },
            {
              "x_mm": -1070.9,
              "y_mm": 281.8
            },
            {
              "x_mm": -1131.8,
              "y_mm": 220.9
            },
            {
              "x_mm": -1155.8,
              "y_mm": 185.0
            },
            {
              "x_mm": -1188.8,
              "y_mm": 105.4
            },
            {
              "x_mm": -1197.2,
              "y_mm": 63.1
            },
            {
              "x_mm": -1197.2,
              "y_mm": -23.1
            },
            {
              "x_mm": -1188.8,
              "y_mm": -65.4
            },
            {
              "x_mm": -1155.8,
              "y_mm": -145.0
            },
            {
              "x_mm": -1131.8,
              "y_mm": -180.9
            },
            {
              "x_mm": -1070.9,
              "y_mm": -241.8
            },
            {
              "x_mm": -996.3,
              "y_mm": -284.9
            },
            {
              "x_mm": -955.4,
              "y_mm": -298.8
            },
            {
              "x_mm": -870.0,
              "y_mm": -310.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -750,
              "y_mm": -375
            },
            {
              "x_mm": -750,
              "y_mm": -245
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -436.77,
              "y_mm": -245.0
            },
            {
              "x_mm": -436.77,
              "y_mm": -375.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 502.91,
              "y_mm": -245.0
            },
            {
              "x_mm": 502.91,
              "y_mm": -375.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 496.05,
              "y_mm": 282.67
            },
            {
              "x_mm": 496.27,
              "y_mm": 412.67
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -593.17,
              "y_mm": 284.53
            },
            {
              "x_mm": -592.95,
              "y_mm": 414.53
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -885,
          "minimum_y_mm": -390,
          "maximum_x_mm": -725,
          "maximum_y_mm": -230,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -436.77,
          "y_mm": -310.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 502.91,
          "y_mm": -310.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 496.16,
          "y_mm": 347.67
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -593.06,
          "y_mm": 349.53
        }
      ]
    },
    {
      "id": "circuit-6",
      "label": "Circuit 6 \\u00b7 undulating straights",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -765,
        "y_mm": -330,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 6 \\u00b7 undulating straights",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -710.0,
              "y_mm": -330
            },
            {
              "x_mm": -463.6,
              "y_mm": -326.2
            },
            {
              "x_mm": -278.8,
              "y_mm": -303.5
            },
            {
              "x_mm": -155.6,
              "y_mm": -300.6
            },
            {
              "x_mm": -94.0,
              "y_mm": -308.7
            },
            {
              "x_mm": 90.8,
              "y_mm": -350.8
            },
            {
              "x_mm": 214.0,
              "y_mm": -361.0
            },
            {
              "x_mm": 460.4,
              "y_mm": -334.1
            },
            {
              "x_mm": 830.0,
              "y_mm": -330
            },
            {
              "x_mm": 915.4,
              "y_mm": -318.8
            },
            {
              "x_mm": 956.3,
              "y_mm": -304.9
            },
            {
              "x_mm": 1030.9,
              "y_mm": -261.8
            },
            {
              "x_mm": 1091.8,
              "y_mm": -200.9
            },
            {
              "x_mm": 1115.8,
              "y_mm": -165.0
            },
            {
              "x_mm": 1148.8,
              "y_mm": -85.4
            },
            {
              "x_mm": 1157.2,
              "y_mm": -43.1
            },
            {
              "x_mm": 1157.2,
              "y_mm": 43.1
            },
            {
              "x_mm": 1148.8,
              "y_mm": 85.4
            },
            {
              "x_mm": 1115.8,
              "y_mm": 165.0
            },
            {
              "x_mm": 1091.8,
              "y_mm": 200.9
            },
            {
              "x_mm": 1030.9,
              "y_mm": 261.8
            },
            {
              "x_mm": 956.3,
              "y_mm": 304.9
            },
            {
              "x_mm": 873.1,
              "y_mm": 327.2
            },
            {
              "x_mm": 498.0,
              "y_mm": 331.7
            },
            {
              "x_mm": 232.4,
              "y_mm": 360.3
            },
            {
              "x_mm": 166.0,
              "y_mm": 360.2
            },
            {
              "x_mm": 99.6,
              "y_mm": 352.3
            },
            {
              "x_mm": -99.6,
              "y_mm": 307.7
            },
            {
              "x_mm": -166.0,
              "y_mm": 299.8
            },
            {
              "x_mm": -232.4,
              "y_mm": 299.7
            },
            {
              "x_mm": -498.0,
              "y_mm": 328.3
            },
            {
              "x_mm": -830.0,
              "y_mm": 330
            },
            {
              "x_mm": -915.4,
              "y_mm": 318.8
            },
            {
              "x_mm": -956.3,
              "y_mm": 304.9
            },
            {
              "x_mm": -1030.9,
              "y_mm": 261.8
            },
            {
              "x_mm": -1091.8,
              "y_mm": 200.9
            },
            {
              "x_mm": -1115.8,
              "y_mm": 165.0
            },
            {
              "x_mm": -1148.8,
              "y_mm": 85.4
            },
            {
              "x_mm": -1157.2,
              "y_mm": 43.1
            },
            {
              "x_mm": -1157.2,
              "y_mm": -43.1
            },
            {
              "x_mm": -1148.8,
              "y_mm": -85.4
            },
            {
              "x_mm": -1115.8,
              "y_mm": -165.0
            },
            {
              "x_mm": -1091.8,
              "y_mm": -200.9
            },
            {
              "x_mm": -1030.9,
              "y_mm": -261.8
            },
            {
              "x_mm": -956.3,
              "y_mm": -304.9
            },
            {
              "x_mm": -915.4,
              "y_mm": -318.8
            },
            {
              "x_mm": -830.0,
              "y_mm": -330.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -710,
              "y_mm": -395
            },
            {
              "x_mm": -710,
              "y_mm": -265
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -391.6,
              "y_mm": -251.87
            },
            {
              "x_mm": -375.75,
              "y_mm": -380.9
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 588.47,
              "y_mm": -267.68
            },
            {
              "x_mm": 589.92,
              "y_mm": -397.67
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 581.61,
              "y_mm": 265.69
            },
            {
              "x_mm": 583.17,
              "y_mm": 395.68
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -539.6,
              "y_mm": 263.51
            },
            {
              "x_mm": -538.93,
              "y_mm": 393.51
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -845,
          "minimum_y_mm": -410,
          "maximum_x_mm": -685,
          "maximum_y_mm": -250,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -383.68,
          "y_mm": -316.38
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 589.19,
          "y_mm": -332.67
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 582.39,
          "y_mm": 330.69
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -539.27,
          "y_mm": 328.51
        }
      ]
    },
    {
      "id": "circuit-7",
      "label": "Circuit 7 \\u00b7 rounded rectangle",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -865,
        "y_mm": -390,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 7 \\u00b7 rounded rectangle",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -810.0,
              "y_mm": -390
            },
            {
              "x_mm": 930.0,
              "y_mm": -390
            },
            {
              "x_mm": 999.9,
              "y_mm": -380.8
            },
            {
              "x_mm": 1065.0,
              "y_mm": -353.8
            },
            {
              "x_mm": 1120.9,
              "y_mm": -310.9
            },
            {
              "x_mm": 1163.8,
              "y_mm": -255.0
            },
            {
              "x_mm": 1190.8,
              "y_mm": -189.9
            },
            {
              "x_mm": 1200.0,
              "y_mm": -120.0
            },
            {
              "x_mm": 1200,
              "y_mm": 120
            },
            {
              "x_mm": 1190.8,
              "y_mm": 189.9
            },
            {
              "x_mm": 1163.8,
              "y_mm": 255.0
            },
            {
              "x_mm": 1144.2,
              "y_mm": 284.4
            },
            {
              "x_mm": 1094.4,
              "y_mm": 334.2
            },
            {
              "x_mm": 1033.3,
              "y_mm": 369.4
            },
            {
              "x_mm": 965.2,
              "y_mm": 387.7
            },
            {
              "x_mm": -930.0,
              "y_mm": 390
            },
            {
              "x_mm": -999.9,
              "y_mm": 380.8
            },
            {
              "x_mm": -1065.0,
              "y_mm": 353.8
            },
            {
              "x_mm": -1094.4,
              "y_mm": 334.2
            },
            {
              "x_mm": -1144.2,
              "y_mm": 284.4
            },
            {
              "x_mm": -1179.4,
              "y_mm": 223.3
            },
            {
              "x_mm": -1190.8,
              "y_mm": 189.9
            },
            {
              "x_mm": -1200.0,
              "y_mm": 120.0
            },
            {
              "x_mm": -1197.7,
              "y_mm": -155.2
            },
            {
              "x_mm": -1190.8,
              "y_mm": -189.9
            },
            {
              "x_mm": -1163.8,
              "y_mm": -255.0
            },
            {
              "x_mm": -1144.2,
              "y_mm": -284.4
            },
            {
              "x_mm": -1094.4,
              "y_mm": -334.2
            },
            {
              "x_mm": -1065.0,
              "y_mm": -353.8
            },
            {
              "x_mm": -999.9,
              "y_mm": -380.8
            },
            {
              "x_mm": -930.0,
              "y_mm": -390.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -810,
              "y_mm": -455
            },
            {
              "x_mm": -810,
              "y_mm": -325
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -447.9,
              "y_mm": -325.0
            },
            {
              "x_mm": -447.9,
              "y_mm": -455.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 638.4,
              "y_mm": -325.0
            },
            {
              "x_mm": 638.4,
              "y_mm": -455.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 628.39,
              "y_mm": 323.11
            },
            {
              "x_mm": 628.55,
              "y_mm": 453.11
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -593.34,
              "y_mm": 324.59
            },
            {
              "x_mm": -593.18,
              "y_mm": 454.59
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -945,
          "minimum_y_mm": -470,
          "maximum_x_mm": -785,
          "maximum_y_mm": -310,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -447.9,
          "y_mm": -390.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 638.4,
          "y_mm": -390.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 628.47,
          "y_mm": 388.11
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -593.26,
          "y_mm": 389.59
        }
      ]
    },
    {
      "id": "circuit-8",
      "label": "Circuit 8 \\u00b7 broad square corners",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -955,
        "y_mm": -370,
        "heading_rad": 0
      },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Circuit 8 \\u00b7 broad square corners",
          "width_mm": 19,
          "darkness": 1,
          "closed": true,
          "points": [
            {
              "x_mm": -900.0,
              "y_mm": -370
            },
            {
              "x_mm": 1020.0,
              "y_mm": -370
            },
            {
              "x_mm": 1079.5,
              "y_mm": -362.2
            },
            {
              "x_mm": 1135.0,
              "y_mm": -339.2
            },
            {
              "x_mm": 1182.6,
              "y_mm": -302.6
            },
            {
              "x_mm": 1219.2,
              "y_mm": -255.0
            },
            {
              "x_mm": 1242.2,
              "y_mm": -199.5
            },
            {
              "x_mm": 1250.0,
              "y_mm": -140.0
            },
            {
              "x_mm": 1250,
              "y_mm": 140
            },
            {
              "x_mm": 1242.2,
              "y_mm": 199.5
            },
            {
              "x_mm": 1202.5,
              "y_mm": 280.0
            },
            {
              "x_mm": 1160.0,
              "y_mm": 322.5
            },
            {
              "x_mm": 1108.0,
              "y_mm": 352.5
            },
            {
              "x_mm": 1050.0,
              "y_mm": 368.0
            },
            {
              "x_mm": -1020.0,
              "y_mm": 370
            },
            {
              "x_mm": -1079.5,
              "y_mm": 362.2
            },
            {
              "x_mm": -1135.0,
              "y_mm": 339.2
            },
            {
              "x_mm": -1182.6,
              "y_mm": 302.6
            },
            {
              "x_mm": -1219.2,
              "y_mm": 255.0
            },
            {
              "x_mm": -1242.2,
              "y_mm": 199.5
            },
            {
              "x_mm": -1250.0,
              "y_mm": 140.0
            },
            {
              "x_mm": -1248.0,
              "y_mm": -170.0
            },
            {
              "x_mm": -1219.2,
              "y_mm": -255.0
            },
            {
              "x_mm": -1160.0,
              "y_mm": -322.5
            },
            {
              "x_mm": -1079.5,
              "y_mm": -362.2
            },
            {
              "x_mm": -1020.0,
              "y_mm": -370.0
            }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -900,
              "y_mm": -435
            },
            {
              "x_mm": -900,
              "y_mm": -305
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -504.0,
              "y_mm": -305.0
            },
            {
              "x_mm": -504.0,
              "y_mm": -435.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 684.01,
              "y_mm": -305.0
            },
            {
              "x_mm": 684.01,
              "y_mm": -435.0
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": 671.96,
              "y_mm": 303.37
            },
            {
              "x_mm": 672.09,
              "y_mm": 433.37
            }
          ]
        },
        {
          "type": "line",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "width_mm": 19,
          "darkness": 1,
          "closed": false,
          "points": [
            {
              "x_mm": -642.06,
              "y_mm": 304.63
            },
            {
              "x_mm": -641.94,
              "y_mm": 434.63
            }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1035,
          "minimum_y_mm": -450,
          "maximum_x_mm": -875,
          "maximum_y_mm": -290,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "checkpoint_1",
          "label": "Waypoint 2",
          "x_mm": -504.0,
          "y_mm": -370.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Waypoint 3",
          "x_mm": 684.01,
          "y_mm": -370.0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Waypoint 4",
          "x_mm": 672.03,
          "y_mm": 368.37
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Waypoint 5",
          "x_mm": -642.0,
          "y_mm": 369.63
        }
      ]
    }
  ]
}
`,Mr=`{
  "default_world": "waypoint-route",
  "worlds": [
    {
      "id": "waypoint-route",
      "label": "Waypoint route",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1304,
          "minimum_y_mm": -80,
          "maximum_x_mm": -1144,
          "maximum_y_mm": 80,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "route_1",
          "x_mm": 400,
          "y_mm": 0,
          "label": "1"
        },
        {
          "type": "waypoint",
          "name": "route_2",
          "x_mm": 400,
          "y_mm": 300,
          "label": "2"
        },
        {
          "type": "waypoint",
          "name": "route_3",
          "x_mm": 0,
          "y_mm": 300,
          "heading_rad": 3.141592653589793,
          "label": "3"
        }
      ]
    }
  ]
}
`,Nr=`{
  "default_world": "mapped-route",
  "worlds": [
    {
      "id": "mapped-route",
      "label": "Mapped route",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "block",
          "minimum_x_mm": -150,
          "minimum_y_mm": -200,
          "maximum_x_mm": 150,
          "maximum_y_mm": 200,
          "label": "Center block"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1304,
          "minimum_y_mm": -80,
          "maximum_x_mm": -1144,
          "maximum_y_mm": 80,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 500,
          "y_mm": 300,
          "heading_rad": 0,
          "label": "Destination"
        }
      ]
    },
    {
      "id": "destination-blocked",
      "label": "Destination blocked",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "block",
          "minimum_x_mm": -150,
          "minimum_y_mm": -200,
          "maximum_x_mm": 150,
          "maximum_y_mm": 200,
          "label": "Center block"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1304,
          "minimum_y_mm": -80,
          "maximum_x_mm": -1144,
          "maximum_y_mm": 80,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 0,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Blocked destination"
        }
      ]
    },
    {
      "id": "no-connection",
      "label": "No connecting route",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": -50,
          "minimum_y_mm": -609.6,
          "maximum_x_mm": 50,
          "maximum_y_mm": 609.6,
          "label": "Dividing wall"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1304,
          "minimum_y_mm": -80,
          "maximum_x_mm": -1144,
          "maximum_y_mm": 80,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 500,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Destination"
        }
      ]
    }
  ]
}
`,Pr=`{
  "default_world": "gate-blocked",
  "worlds": [
    {
      "id": "gate-blocked",
      "label": "Center gate blocked",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": -250,
          "maximum_x_mm": 450,
          "maximum_y_mm": -150,
          "label": "Lower wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": 150,
          "maximum_x_mm": 450,
          "maximum_y_mm": 250,
          "label": "Upper wall"
        },
        {
          "type": "block",
          "feature": "center_gate",
          "minimum_x_mm": 350,
          "minimum_y_mm": -150,
          "maximum_x_mm": 450,
          "maximum_y_mm": 150,
          "label": "Center gate"
        },
        {
          "type": "wall",
          "minimum_x_mm": -1490,
          "minimum_y_mm": -300,
          "maximum_x_mm": -1440,
          "maximum_y_mm": 300,
          "label": "Known far reflector behind home"
        }
      ],
      "markers": [
        {
          "type": "waypoint",
          "name": "home",
          "x_mm": -1224,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Home"
        },
        {
          "type": "waypoint",
          "name": "outbound_1",
          "x_mm": -1224,
          "y_mm": -400,
          "label": "Known outbound corridor"
        },
        {
          "type": "waypoint",
          "name": "outbound_2",
          "x_mm": 600,
          "y_mm": -400,
          "label": "Turn toward observation"
        },
        {
          "type": "waypoint",
          "name": "observation",
          "x_mm": 600,
          "y_mm": 0,
          "heading_rad": 3.141592653589793,
          "label": "Stop and observe gate"
        }
      ]
    },
    {
      "id": "gate-open",
      "label": "Center gate open",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": -250,
          "maximum_x_mm": 450,
          "maximum_y_mm": -150,
          "label": "Lower wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": 150,
          "maximum_x_mm": 450,
          "maximum_y_mm": 250,
          "label": "Upper wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": -1490,
          "minimum_y_mm": -300,
          "maximum_x_mm": -1440,
          "maximum_y_mm": 300,
          "label": "Known far reflector behind home"
        }
      ],
      "markers": [
        {
          "type": "waypoint",
          "name": "home",
          "x_mm": -1224,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Home"
        },
        {
          "type": "waypoint",
          "name": "outbound_1",
          "x_mm": -1224,
          "y_mm": -400,
          "label": "Known outbound corridor"
        },
        {
          "type": "waypoint",
          "name": "outbound_2",
          "x_mm": 600,
          "y_mm": -400,
          "label": "Turn toward observation"
        },
        {
          "type": "waypoint",
          "name": "observation",
          "x_mm": 600,
          "y_mm": 0,
          "heading_rad": 3.141592653589793,
          "label": "Stop and observe gate"
        }
      ]
    }
  ]
}
`,Fr=`from ucsb_xrp import load_world


CIRCLE_DIAMETER_MM = 406.4  # One third of the course arena's 1219.2 mm shorter dimension.
FORWARD_SPEED_MM_S = 100.0  # Axle midpoint speed, mm/s; positive turns left (counterclockwise).
INITIAL_POSE = load_world().initial_pose
`,Ir=`# Drive one circle using differential-drive kinematics.

from math import pi

from challenge import CIRCLE_DIAMETER_MM, FORWARD_SPEED_MM_S, INITIAL_POSE
from robot_setup import ROBOT_CONFIG, make_robot
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)
command = MotionCommand(FORWARD_SPEED_MM_S, 2.0 * FORWARD_SPEED_MM_S / CIRCLE_DIAMETER_MM)
travel_mm = 0.0

try:
    state = robot.start(INITIAL_POSE)
    while travel_mm < pi * CIRCLE_DIAMETER_MM:
        state = robot.step(command)
        measurements = state.measurements
        travel_mm += (measurements.left_increment_mm + measurements.right_increment_mm) / 2.0
finally:
    robot.stop()

print("Circle complete")
print("axle_travel_mm:", travel_mm)
`,Lr=`# Supplied robot components and virtual wheel-controller settings.

from ucsb_xrp import Robot, RobotConfig, XRPBot
from ucsb_xrp_reference import DifferentialDrive, Odometry, SensorProcessor, WheelSpeedController


ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031124,
    right_speed_command_gain=0.0031722,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=0.65,
)


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Rr=`# Monitor controls for manual driving; each Run starts from zero effort.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Negative forward speed reverses; positive turn rate rotates counterclockwise.
FORWARD_SPEED = live.number("manual_forward_mm_s", 0.0, -120.0, 120.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE = live.number("manual_turn_rad_s", 0.0, -1.0, 1.0, 0.1, unit="rad/s", label="Turn rate")
`,zr=`# Drive with Monitor sliders. Each Run starts with both commands at zero.

from robot_setup import make_robot
from live_variables import FORWARD_SPEED, TURN_RATE
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, load_world


WORLD = load_world()
robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    # Apply an explicit zero command before reading the first slider values.
    state = robot.step(STOP_COMMAND)
    print("Manual driving ready. Set Forward speed or Turn rate in Monitor.")

    # Apply the latest manual speed and turn controls at each robot sample.
    while True:  # Press Stop in the IDE to end the supervised drive.
        speed_mm_s = FORWARD_SPEED.value
        turn_rate_rad_s = TURN_RATE.value
        # Decimal slider steps can decode zero as a tiny nonzero float. Avoid
        # applying the wheel controller's start effort to that rounding error.
        if abs(speed_mm_s) < 0.5:
            speed_mm_s = 0.0
        if abs(turn_rate_rad_s) < 0.005:
            turn_rate_rad_s = 0.0
        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s))
finally:
    robot.stop()
`,Br=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Vr=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
TURN_TOLERANCE_RAD = 0.06  # Accept the quarter-turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # Stop the run if the turn has not completed within this elapsed time, s.
`,Hr=`# Publish obstacle-turn range and current phase.

from ucsb_xrp import live


# Each number sets an initial value, lower/upper bounds, and step in the stated unit.
# Sensor range at or below the obstacle distance ends an approach.
# Forward speed applies during approach; turn rate limits the quarter-turn's magnitude.
CLOSE_RANGE_MM = live.number("close_range_mm", 400.0, minimum=200.0, maximum=900.0, step=25.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("forward_speed_mm_s", 150.0, minimum=40.0, maximum=180.0, step=10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("turn_rate_rad_s", 1.3, minimum=0.4, maximum=1.8, step=0.1, unit="rad/s", label="Turn rate")
TURN_DIRECTION = live.choice("turn_direction", "left", options=("left", "right"), label="Turn direction")
SECOND_APPROACH = live.toggle("second_approach", True, label="Drive after turn")


# Register signal names and units once; the loop writes only each value.
_WATCH_RANGE_MM = live.register_watch('range_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')
_WATCH_HEADING_ERROR_RAD = live.register_watch('heading_error_rad', unit="rad")


def publish_range(range_mm):
    _WATCH_RANGE_MM.value = range_mm if range_mm is not None else "No echo"


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_heading_error(error_rad):
    _WATCH_HEADING_ERROR_RAD.value = error_rad
`,Ur=`# Approach an obstacle, turn by a measured quarter-turn, and optionally approach again.

from math import pi

from challenge import WORLD, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from robot_setup import make_robot
from live_variables import CLOSE_RANGE_MM, FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, TURN_DIRECTION, SECOND_APPROACH, publish_heading_error, publish_phase, publish_range
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, wrap_angle_rad


def drive_until_close(robot, state):
    # A stopped reading also handles an obstacle already close at the start.
    state = robot.step(STOP_COMMAND, read_range=True)
    publish_phase("driving")
    # Sample range during approach and stop when the obstacle threshold is met.
    while True:
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        if range_mm is not None and range_mm <= CLOSE_RANGE_MM.value:
            return state
        # No usable echo is normal in open space; keep looking for an obstacle.
        state = robot.step(MotionCommand(FORWARD_SPEED_MM_S.value, 0.0), read_range=True)


def turn_quarter_turn(robot, state):
    # Positive heading is counterclockwise; the choice sets the target sign.
    direction = 1.0 if TURN_DIRECTION.value == "left" else -1.0
    target_heading = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
    started_ms = state.measurements.time_ms
    publish_phase("turning " + TURN_DIRECTION.value)
    # The signed wrapped error handles both crossing ±pi and overshooting the target.
    while True:
        error_rad = wrap_angle_rad(target_heading - state.pose.heading_rad)
        publish_heading_error(error_rad)
        if abs(error_rad) <= TURN_TOLERANCE_RAD:
            return state
        if elapsed_time_s(state.measurements.time_ms, started_ms) >= TURN_TIMEOUT_S:
            raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
        direction = 1.0 if error_rad > 0.0 else -1.0
        # Slow near the target; correct either sign of heading error after overshoot.
        turn_rate = direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad))
        state = robot.step(MotionCommand(0.0, turn_rate))


robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    state = drive_until_close(robot, state)
    state = turn_quarter_turn(robot, state)
    if SECOND_APPROACH.value:
        state = drive_until_close(robot, state)
    publish_phase("complete")
    print("Obstacle-turn demo complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
`,Wr=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Gr=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
RANDOM_SEED = 0x5A17  # Integer seed repeats the same distances and left/right choices.
SEGMENT_COUNT = 12  # Number of straight-run/quarter-turn pairs before completion.
TURN_TOLERANCE_RAD = 0.05  # Accept a turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # Stop the run if a turn exceeds this elapsed time, s.
SEGMENT_TIMEOUT_S = 30.0  # Stop the run if a straight segment exceeds this elapsed time, s.
# Random straight-segment targets lie between these axle-center travel limits, mm.
MINIMUM_SEGMENT_TRAVEL_MM = 100.0
MAXIMUM_SEGMENT_TRAVEL_MM = 180.0
`,Kr=`# Publish the segment, phase, and estimated distance travelled.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Forward speed applies to straight segments; turn rate limits either direction's magnitude.
FORWARD_SPEED_MM_S = live.number("snake_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("snake_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Register signal names and units once; the loop writes only each value.
_WATCH_SEGMENT = live.register_watch('segment')
_WATCH_PHASE = live.register_watch('phase')
_WATCH_TRAVEL_MM = live.register_watch('travel_mm', unit="mm")


def publish_segment(number):
    _WATCH_SEGMENT.value = number


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_travel(travel_mm):
    _WATCH_TRAVEL_MM.value = travel_mm
`,qr=`# Trace a reproducible sequence of straight runs and random quarter turns.

from math import pi

from challenge import WORLD, RANDOM_SEED, SEGMENT_COUNT, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S, SEGMENT_TIMEOUT_S, MINIMUM_SEGMENT_TRAVEL_MM, MAXIMUM_SEGMENT_TRAVEL_MM
from robot_setup import make_robot
from live_variables import FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, publish_phase, publish_segment, publish_travel
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, elapsed_time_s, wrap_angle_rad

# SeededRandom — Generate reproducible pseudo-random demo choices.
# Called by: The demonstration route loop.
# Methods: unit(), uniform().
# Inputs: Integer seed; numeric uniform interval.
# State: Current 32-bit generator state.
# Returns: Number in [0, 1) or the requested interval.

class SeededRandom:
    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        # Keep the recurrence in 32 bits, then scale its unsigned state to [0, 1).
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0

    def uniform(self, minimum, maximum):
        return minimum + (maximum - minimum) * self.unit()


def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    total_travel_mm = 0.0

    for segment_index in range(SEGMENT_COUNT):
        # The seeded generator fixes each straight target and left/right turn.
        target_travel_mm = random.uniform(MINIMUM_SEGMENT_TRAVEL_MM, MAXIMUM_SEGMENT_TRAVEL_MM)
        segment_travel_mm = 0.0
        started_ms = state.measurements.time_ms
        publish_segment(segment_index + 1)
        publish_phase("forward")

        while segment_travel_mm < target_travel_mm:
            if elapsed_time_s(state.measurements.time_ms, started_ms) >= SEGMENT_TIMEOUT_S:
                raise RuntimeError("Straight segment did not finish within 30 s; check wheel motion and encoder readings")
            state = robot.step(MotionCommand(FORWARD_SPEED_MM_S.value, 0.0))
            increment_mm = body_travel_mm(state)
            segment_travel_mm += increment_mm
            total_travel_mm += increment_mm

        direction = -1.0 if random.unit() < 0.5 else 1.0
        target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
        started_ms = state.measurements.time_ms
        publish_phase("turn right" if direction < 0.0 else "turn left")
        # Wrapped error remains signed across ±pi and changes sign after overshoot.
        while True:
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                break
            if elapsed_time_s(state.measurements.time_ms, started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            direction = -1.0 if error_rad < 0.0 else 1.0
            # Scale down near the target while limiting yaw rate to the slider setting.
            turn_rate = direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad))
            state = robot.step(MotionCommand(0.0, turn_rate))
            total_travel_mm += body_travel_mm(state)

        publish_travel(total_travel_mm)

    publish_phase("complete")
    print("Random-snake route complete")
    print("seed:", RANDOM_SEED)
    print("final_pose:", state.pose)
finally:
    robot.stop()
`,Jr=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Yr=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
RANDOM_SEED = 0xC0FFEE  # Integer seed repeats the same avoidance angles and left/right choices.
REVERSE_TIME_S = 0.4  # Elapsed reverse-command duration before each avoidance turn, s.
# Each avoidance turn chooses an angle magnitude between these limits, degrees.
MINIMUM_TURN_ANGLE_DEG = 70.0
MAXIMUM_TURN_ANGLE_DEG = 160.0
TURN_TOLERANCE_RAD = 0.06  # Accept a turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # End the run if a wheel or encoder prevents the rotation.
`,Xr=`# Publish the latest range, phase, and avoidance count.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Sensor range at or below the obstacle distance starts reversal; reverse speed is negative.
# Turn rate limits the magnitude of either left or right avoidance rotation.
# A 2 mm step preserves the exact 264 mm initial threshold in the live control.
OBSTACLE_DISTANCE_MM = live.number("obstacle_distance_mm", 264.0, 150.0, 700.0, 2.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("roomba_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
REVERSE_SPEED_MM_S = live.number("roomba_reverse_speed_mm_s", -120.0, -180.0, -60.0, 10.0, unit="mm/s", label="Reverse speed")
TURN_RATE_RAD_S = live.number("roomba_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Register signal names and units once; the loop writes only each value.
_WATCH_RANGE_MM = live.register_watch('range_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')
_WATCH_AVOIDANCES = live.register_watch('avoidances')


def publish_range(range_mm):
    _WATCH_RANGE_MM.value = range_mm if range_mm is not None else "No echo"


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_avoidance_count(count):
    _WATCH_AVOIDANCES.value = count
`,Zr=`# Drive forward, reverse from nearby obstacles, and choose a new heading.

from math import pi

from challenge import WORLD, RANDOM_SEED, REVERSE_TIME_S, MINIMUM_TURN_ANGLE_DEG, MAXIMUM_TURN_ANGLE_DEG, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from robot_setup import make_robot
from live_variables import OBSTACLE_DISTANCE_MM, FORWARD_SPEED_MM_S, REVERSE_SPEED_MM_S, TURN_RATE_RAD_S, publish_avoidance_count, publish_phase, publish_range
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, wrap_angle_rad

# SeededRandom — Generate reproducible pseudo-random demo choices.
# Called by: The demonstration route loop.
# Methods: unit().
# Inputs: Integer seed.
# State: Current 32-bit generator state.
# Returns: Number in [0, 1).

class SeededRandom:
    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        # Keep the recurrence in 32 bits, then scale its unsigned state to [0, 1).
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    state = robot.step(STOP_COMMAND, read_range=True)
    phase = "forward"
    phase_started_ms = state.measurements.time_ms
    target_heading_rad = state.pose.heading_rad
    avoidance_count = 0

    # In the forward phase, only a measured near obstacle initiates reversal.
    while True:  # Press Stop when you have observed enough of the route.
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        phase_time_s = elapsed_time_s(state.measurements.time_ms, phase_started_ms)

        if phase == "forward" and range_mm is not None and range_mm <= OBSTACLE_DISTANCE_MM.value:
            phase = "reverse"
            phase_started_ms = state.measurements.time_ms
        elif phase == "reverse" and phase_time_s >= REVERSE_TIME_S:
            # A seeded sign and angle make each avoidance turn reproducible.
            direction = 1.0 if random.unit() < 0.5 else -1.0
            angle_deg = MINIMUM_TURN_ANGLE_DEG + random.unit() * (MAXIMUM_TURN_ANGLE_DEG - MINIMUM_TURN_ANGLE_DEG)
            target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * angle_deg * pi / 180.0)
            phase = "turn"
            phase_started_ms = state.measurements.time_ms
            avoidance_count += 1
            publish_avoidance_count(avoidance_count)

        if phase == "turn":
            # Wrap error across ±pi so correction follows the shorter direction.
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                phase = "forward"
                # Take a stopped sample before starting the next approach.
                state = robot.step(STOP_COMMAND, read_range=True)
                continue
            if elapsed_time_s(state.measurements.time_ms, phase_started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            turn_direction = 1.0 if error_rad > 0.0 else -1.0
            # Reduce yaw rate near the heading target to limit overshoot.
            command = MotionCommand(0.0, turn_direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad)))
        elif phase == "reverse":
            command = MotionCommand(REVERSE_SPEED_MM_S.value, 0.0)
        else:
            # No echo or a distant obstacle allows the supervised demo to continue.
            command = MotionCommand(FORWARD_SPEED_MM_S.value, 0.0)

        publish_phase(phase)
        state = robot.step(command, read_range=True)
finally:
    robot.stop()
`,Qr=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,$r=`# SnakeGame settings shared by the virtual and physical XRP.

from ucsb_xrp import load_world

try:
    import xrp_sim_bridge  # Available only in the browser's virtual XRP.
    WORLD = load_world()
except ImportError:
    # Physical runs use the bounded physical Snake arena when no browser bridge exists.
    WORLD = load_world(world_id="snake-physical")
`,ei=`# Monitor sliders and game readings.

from ucsb_xrp import live
from snake_config import CONFIG


growth = CONFIG["controls"]["growth_mm"]
speed = CONFIG["controls"]["speed_mm_s"]
GROWTH_MM = live.number("snake_growth_mm", growth["default"], growth["minimum"], growth["maximum"], growth["step"], unit="mm", label="Tail growth per food")
SPEED_MM_S = live.number("snake_speed_mm_s", speed["default"], speed["minimum"], speed["maximum"], speed["step"], unit="mm/s", label="Cruise speed")


# Register signal names and units once; the loop writes only each value.
_WATCH_SNAKE_SCORE = live.register_watch('snake_score', label="Score")
_WATCH_SNAKE_FOOD_COUNT = live.register_watch('snake_food_count', label="Food in arena")
_WATCH_SNAKE_TAIL_MM = live.register_watch('snake_tail_mm', unit="mm", label="Tail length")
_WATCH_SNAKE_PHASE = live.register_watch('snake_phase', label="Game")
_WATCH_SNAKE_SCENE_SEED = live.register_watch('snake_scene_seed')
_WATCH_SNAKE_SCENE_MAX_FOOD = live.register_watch('snake_scene_max_food')
_WATCH_SNAKE_SCENE_MARGIN = live.register_watch('snake_scene_margin')
_WATCH_SNAKE_SCENE_JITTER_X = live.register_watch('snake_scene_jitter_x')
_WATCH_SNAKE_SCENE_JITTER_Y = live.register_watch('snake_scene_jitter_y')
_WATCH_SNAKE_SCENE_HEAD_MM = live.register_watch('snake_scene_head_mm')
_WATCH_SNAKE_SCENE_TAIL_MM = live.register_watch('snake_scene_tail_mm')
_WATCH_SNAKE_SCENE_PELLET_MM = live.register_watch('snake_scene_pellet_mm')
_WATCH_SNAKE_SCENE_SAMPLE_MM = live.register_watch('snake_scene_sample_mm')
_WATCH_SNAKE_SCENE_INITIAL_MM = live.register_watch('snake_scene_initial_mm')
_WATCH_SNAKE_SCENE_POINTS = live.register_watch('snake_scene_points')


def publish_game(game):
    # Send the current score, food state, tail length, and stopping reason to Monitor.
    _WATCH_SNAKE_SCORE.value = game.score
    _WATCH_SNAKE_FOOD_COUNT.value = len(game.food)
    _WATCH_SNAKE_TAIL_MM.value = game.tail_mm
    _WATCH_SNAKE_PHASE.value = game.phase


def publish_scene_config(world):
    # Mirror editable project settings in Monitor without a second config file.
    food = CONFIG["food"]
    body = CONFIG["body"]
    seed = food["physical_seed"] if world.id == "snake-physical" else food["virtual_seed"]
    _WATCH_SNAKE_SCENE_SEED.value = seed
    _WATCH_SNAKE_SCENE_MAX_FOOD.value = food["maximum"]
    _WATCH_SNAKE_SCENE_MARGIN.value = food["edge_margin_mm"]
    _WATCH_SNAKE_SCENE_JITTER_X.value = food["jitter_x_fraction"]
    _WATCH_SNAKE_SCENE_JITTER_Y.value = food["jitter_y_fraction"]
    _WATCH_SNAKE_SCENE_HEAD_MM.value = body["head_diameter_mm"]
    _WATCH_SNAKE_SCENE_TAIL_MM.value = body["tail_diameter_mm"]
    _WATCH_SNAKE_SCENE_PELLET_MM.value = body["pellet_radius_mm"]
    _WATCH_SNAKE_SCENE_SAMPLE_MM.value = body["sample_spacing_mm"]
    _WATCH_SNAKE_SCENE_INITIAL_MM.value = body["initial_tail_mm"]
    _WATCH_SNAKE_SCENE_POINTS.value = body["maximum_tail_points"]
`,ti=`# Drive between Cartesian food waypoints; stop on a wall or the finite tail.

from challenge import WORLD
from robot_setup import make_navigation_controller, make_robot
from live_variables import GROWTH_MM, SPEED_MM_S, publish_game, publish_scene_config
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG, navigation_config_for_speed
from snake_game import SnakeGame


robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
game = SnakeGame(WORLD)
last_speed_mm_s = NAVIGATION_CONFIG.cruise_speed_mm_s

try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    publish_scene_config(WORLD)
    publish_game(game)
    # Choose the current food goal until a wall, obstacle, tail, or win ends play.
    while game.phase == "playing":
        goal = game.current_food()
        navigation.start((goal,))
        # Retarget only after this food is reached or a terminal condition occurs.
        while game.phase == "playing" and game.current_food() is goal:
            if SPEED_MM_S.value != last_speed_mm_s:
                # Rebuild the navigation limits only when the cruise slider changes.
                last_speed_mm_s = SPEED_MM_S.value
                navigation.set_config(navigation_config_for_speed(last_speed_mm_s))
            state = robot.step(navigation.update(state.pose), read_range=True)
            # Evaluate food, tail, and collision from estimated pose and measured range.
            if game.observe(state.pose, GROWTH_MM.value, state.measurements.range_mm):
                publish_game(game)
finally:
    robot.stop()

print("SnakeGame:", game.phase, "score", game.score, "of", len(game.food))
`,ni=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot
from snake_config import CONFIG

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled interval in ms; 50 Hz.
    wheel_speed_ki=0.0,  # I gain (1/mm); unused by the supplied P controller.
    wheel_speed_kd=0.0,  # D gain (s^2/mm); unused by the supplied P controller.
    **CONFIG["robot"],
)


def navigation_config_for_speed(speed_mm_s):
    # Retain most of the requested cruise speed near each food position.
    settings = CONFIG["navigation"]
    return NavigationConfig(
        cruise_speed_mm_s=speed_mm_s,
        approach_speed_mm_s=settings["approach_fraction"] * speed_mm_s,
        slowdown_distance_mm=settings["slowdown_distance_mm"],
        turn_rate_rad_s=settings["turn_rate_rad_s"],
        position_tolerance_mm=settings["position_tolerance_mm"],
        heading_tolerance_rad=settings["heading_tolerance_rad"],
        realign_heading_rad=settings["realign_heading_rad"],
    )


NAVIGATION_CONFIG = navigation_config_for_speed(CONFIG["controls"]["speed_mm_s"]["default"])

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    return NavigationController(config)
`,ri=`# Read the SnakeGame settings used by Python and the arena view.

import json
import sys


# Numeric settings in snake_config.json use these meanings:
# food: per_square_meter is pellet density; maximum caps the count; edge_margin_mm
# keeps generated centers inside the boundary. jitter_x/y_fraction set the maximum
# displacement as a fraction of grid-cell width/height. Seeds repeat each arena's layout.
# body: head/tail_diameter_mm define pickup and collision radii; initial_tail_mm
# sets starting length. sample_spacing_mm and maximum_tail_points bound stored paths.
# neck_clearance_mm excludes the newest tail from collision checks; wall_margin_mm
# and obstacle_stop_mm end play near a boundary or ultrasound echo. pellet_radius_mm
# sets the displayed pellet radius; pickup uses the head radius instead.
# controls: each entry gives default, minimum, maximum, and step for the speed
# (mm/s) or tail-growth (mm per pickup) slider.
# navigation: approach_fraction multiplies cruise speed within slowdown_distance_mm.
# turn_rate_rad_s limits rotation; position_tolerance_mm and heading_tolerance_rad
# qualify a goal. realign_heading_rad triggers turning in place before proceeding.
# robot: starting commands and max_drive_command are dimensionless motor efforts;
# speed_command_gain and wheel_speed_kp convert mm/s to effort (s/mm).

# Use the current project first, then the MicroPython search path, so the
# same JSON settings drive the game and arena view.
for root in (".",) + tuple(sys.path):
    try:
        with open(root.rstrip("/") + "/snake_config.json", "r") as source:
            CONFIG = json.load(source)
        break
    except OSError:
        continue
else:
    raise OSError("snake_config.json was not found in this project")
`,ii=`# Repeatable food positions for both SnakeGame arenas.

from math import floor, sqrt
from snake_config import CONFIG


FOOD = CONFIG["food"]
MAX_FOOD = FOOD["maximum"]  # Limit the generated pellet count in either arena.


def food_count(bounds, density):
    # Bounds are millimeters; convert square millimeters to square meters.
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    return min(MAX_FOOD, max(1, int(width * height * density / 1000000.0 + 0.5)))


def food_positions(world, count):
    # Visit a jittered grid in serpentine order to keep routes navigable.
    bounds = world.bounds_mm
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    columns = max(1, int(sqrt(count * width / height) + 0.5))
    rows = (count + columns - 1) // columns
    margin = FOOD["edge_margin_mm"]
    cell_width = (width - 2 * margin) / columns
    cell_height = (height - 2 * margin) / rows
    jitter_x = int(cell_width * FOOD["jitter_x_fraction"])
    jitter_y = int(cell_height * FOOD["jitter_y_fraction"])
    seed = FOOD["physical_seed"] if world.id == "snake-physical" else FOOD["virtual_seed"]
    result = []
    for row in range(rows):
        for offset in range(columns):
            if len(result) == count:
                return tuple(result)
            column = offset if row % 2 == 0 else columns - 1 - offset
            # Fixed integer recurrence keeps placements repeatable per world.
            seed = (1664525 * seed + 1013904223) % 4294967296
            dx = seed % (2 * jitter_x + 1) - jitter_x
            seed = (1664525 * seed + 1013904223) % 4294967296
            dy = seed % (2 * jitter_y + 1) - jitter_y
            x = bounds[0] + margin + (column + 0.5) * cell_width + dx
            y = bounds[1] + margin + (row + 0.5) * cell_height + dy
            result.append((floor(x + 0.5), floor(y + 0.5)))
    return tuple(result)
`,ai=`# Finite tail and food rules; no robot or browser dependencies.

from math import cos, sin, sqrt
from ucsb_xrp import NavigationGoal

from snake_food import food_count, food_positions
from snake_config import CONFIG


BODY = CONFIG["body"]
SAMPLE_SPACING_MM = BODY["sample_spacing_mm"]  # Minimum head travel before storing another tail point, mm.
MAX_TAIL_POINTS = BODY["maximum_tail_points"]  # Discard oldest points above this bounded count.
COLLISION_REACH_MM = (BODY["head_diameter_mm"] + BODY["tail_diameter_mm"]) / 2  # Head-to-tail centerline separation counted as collision, mm.
FOOD_REACH_MM = BODY["head_diameter_mm"] / 2  # Head-center distance to a pellet center counted as pickup, mm.


def distance(first, second):
    dx = first[0] - second[0]
    dy = first[1] - second[1]
    return sqrt(dx * dx + dy * dy)


def distance_to_segment(point, start, end):
    # Project onto the finite segment, including either endpoint when closest.
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return distance(point, start)
    fraction = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length_squared
    fraction = max(0.0, min(1.0, fraction))
    closest = (start[0] + fraction * dx, start[1] + fraction * dy)
    return distance(point, closest)


class SnakeGame:
    def __init__(self, world, initial_tail_mm=None):
        bounds = world.bounds_mm
        count = food_count(bounds, CONFIG["food"]["per_square_meter"])
        if world.id == "snake-crossing":
            self.food = world.waypoints()[:count]
        else:
            self.food = tuple(
                NavigationGoal(x, y) for x, y in food_positions(world, count)
            )
        if not self.food:
            raise ValueError("world.json needs food waypoints")
        self.bounds = bounds
        self.score = 0
        self.tail_mm = float(BODY["initial_tail_mm"] if initial_tail_mm is None else initial_tail_mm)
        self.phase = "playing"
        pose = world.initial_pose
        self.head = (pose.x_mm, pose.y_mm)
        self.points = [
            (pose.x_mm - self.tail_mm * cos(pose.heading_rad),
             pose.y_mm - self.tail_mm * sin(pose.heading_rad)),
            self.head,
        ]

    def current_food(self):
        return self.food[self.score] if self.score < len(self.food) else None

    def _trim_tail(self):
        # Retain the requested path length within the configured memory bound.
        while len(self.points) > 1:
            length = distance(self.points[-1], self.head)
            for index in range(1, len(self.points)):
                length += distance(self.points[index - 1], self.points[index])
            if length <= self.tail_mm:
                break
            excess = length - self.tail_mm
            first_length = distance(self.points[0], self.points[1])
            if first_length <= excess:
                self.points.pop(0)
            else:
                fraction = excess / first_length
                first = self.points[0]
                second = self.points[1]
                self.points[0] = (
                    first[0] + fraction * (second[0] - first[0]),
                    first[1] + fraction * (second[1] - first[1]),
                )
                break
        while len(self.points) > MAX_TAIL_POINTS:
            self.points.pop(0)

    def _crosses_tail(self):
        # Exclude the near-head neck before checking older tail segments.
        distance_behind = distance(self.points[-1], self.head)
        for index in range(len(self.points) - 1, 0, -1):
            start = self.points[index - 1]
            end = self.points[index]
            segment_length = distance(start, end)
            if distance_behind >= BODY["neck_clearance_mm"]:
                if distance_to_segment(self.head, start, end) <= COLLISION_REACH_MM:
                    return True
            distance_behind += segment_length
        return False

    def observe(self, pose, growth_mm, range_mm=None):
        # Return True when a pellet is eaten or the game ends.
        if self.phase != "playing":
            return False
        self.head = (pose.x_mm, pose.y_mm)
        if distance(self.points[-1], self.head) >= SAMPLE_SPACING_MM:
            self.points.append(self.head)
        self._trim_tail()
        # Terminal hazards are checked before a food pickup at the same pose.
        if range_mm is not None and range_mm <= BODY["obstacle_stop_mm"]:
            self.phase = "obstacle"
            return True
        if (
            self.head[0] < self.bounds[0] + BODY["wall_margin_mm"]
            or self.head[0] > self.bounds[2] - BODY["wall_margin_mm"]
            or self.head[1] < self.bounds[1] + BODY["wall_margin_mm"]
            or self.head[1] > self.bounds[3] - BODY["wall_margin_mm"]
        ):
            self.phase = "wall"
            return True
        if self._crosses_tail():
            self.phase = "collision"
            return True
        goal = self.current_food()
        if goal is not None and distance(self.head, (goal.x_mm, goal.y_mm)) <= FOOD_REACH_MM:
            self.score += 1
            self.tail_mm += float(growth_mm)
            if self.score == len(self.food):
                self.phase = "complete"
            return True
        return False
`,oi=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
INITIAL_POSE = WORLD.initial_pose
OBSTACLE_STOP_MM = 400.0  # Forward distance measured from the ultrasound sensor.
SPIRAL_EXPANSION_MM = 8000.0  # Curvature halves after this axle-center travel at a fixed winding rate, mm.
`,si=`# Publish the distance travelled and requested yaw rate for one sample.

from ucsb_xrp import live


# Each number sets an initial value, lower/upper bounds, and step in the stated unit.
# Winding rate sets initial revolutions per meter; the spiral reduces it as travel grows.
FORWARD_SPEED = live.number("forward_speed_mm_s", 110.0, minimum=60.0, maximum=160.0, step=10.0, unit="mm/s", label="Forward speed")
WINDING_RATE = live.number("spiral_winding_turns_per_m", 0.7, minimum=0.3, maximum=1.4, step=0.1, unit="revolutions/m", label="Spiral winding rate")
IGNORE_OBSTACLES = live.toggle("ignore_obstacles", False, label="Ignore obstacles")


# Register signal names and units once; the loop writes only each value.
_PLOT_TRAVEL_MM = live.register_plot('travel_mm', unit="mm", label="Travel")
_PLOT_TURN_RATE_RAD_S = live.register_plot('turn_rate_rad_s', unit="rad/s", label="Yaw rate")


def publish_spiral_values(travel_mm, turn_rate_rad_s):
    _PLOT_TRAVEL_MM.value = travel_mm
    _PLOT_TURN_RATE_RAD_S.value = turn_rate_rad_s
`,ci=`# Drive an expanding spiral and stop before a nearby obstacle.

from math import pi

from challenge import INITIAL_POSE, OBSTACLE_STOP_MM, SPIRAL_EXPANSION_MM
from robot_setup import make_robot
from live_variables import FORWARD_SPEED, WINDING_RATE, IGNORE_OBSTACLES, publish_spiral_values
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND


robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(INITIAL_POSE)  # Initialize estimated pose; reset measurements.

    state = robot.step(STOP_COMMAND, read_range=True)  # Check range before motion.
    travel_mm = 0.0

    while True:  # Update motion until an obstacle or Stop ends the run.
        range_mm = state.measurements.range_mm
        if not IGNORE_OBSTACLES.value and range_mm is not None and range_mm <= OBSTACLE_STOP_MM:  # Stop for nearby echoes unless disabled.
            result = "Obstacle detected; spiral stopped"
            break

        speed_mm_s = FORWARD_SPEED.value
        revolutions_per_mm = WINDING_RATE.value / 1000.0  # Convert turns/m to turns/mm.
        expansion = 1.0 + travel_mm / SPIRAL_EXPANSION_MM  # Reduce curvature as travel increases.
        turn_rate_rad_s = 2.0 * pi * speed_mm_s * revolutions_per_mm / expansion  # rad/s

        publish_spiral_values(travel_mm, turn_rate_rad_s)

        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s), read_range=True)
        measurements = state.measurements
        travel_mm += abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)  # Axle-center travel.
finally:
    robot.stop()
print(result)
print("final_pose:", state.pose)
`,li=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,ui=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import live, load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
`,di=`# Publish route progress as estimated wheel travel and phase.

from ucsb_xrp import live


# Register signal names and units once; the loop writes only each value.
_WATCH_TRAVEL_MM = live.register_watch('travel_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')


def publish_travel(travel_mm):
    _WATCH_TRAVEL_MM.value = travel_mm


def publish_phase(phase):
    _WATCH_PHASE.value = phase
`,fi=`# Trace a block-letter UCSB route from ordered world waypoints.

from challenge import WORLD, ROUTE
from robot_setup import make_navigation_controller, make_robot
from live_variables import publish_phase, publish_travel
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG



def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


if not ROUTE:
    raise RuntimeError("world.json must define at least one waypoint")

robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    navigation.start(ROUTE)  # Use marker-file waypoint order.
    total_travel_mm = 0.0
    # Recompute one motion request from each newly estimated pose.
    while not navigation.is_complete():
        state = robot.step(navigation.update(state.pose))
        total_travel_mm += body_travel_mm(state)
        publish_travel(total_travel_mm)

    publish_phase("complete")
    print("UCSB logo complete")
    print("waypoints:", len(ROUTE))
    print("final_pose:", state.pose)
finally:
    robot.stop()
`,pi=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=120.0,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=1.3,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=18.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    return NavigationController(config)
`,mi=`# Three motor commands; both wheels receive the same value in each interval.
EFFORTS = (0.16, 0.22, 0.28)  # Dimensionless forward motor commands applied to both wheels in order.
# Apply zero command before and after each nonzero command.
EFFORT_DURATION_S = 0.7  # Elapsed seconds holding each nonzero command.
ZERO_DURATION_S = 0.5  # Elapsed seconds at zero command before and after each effort.
# Stop if either wheel travels farther than this limit during the experiment.
MAXIMUM_WHEEL_TRAVEL_MM = 1500.0  # Maximum absolute wheel position from the starting point, in mm.
`,hi=`# Publish motor command and measured wheel-speed samples.

from ucsb_xrp import elapsed_time_s, live


# Register signal names and units once; the loop writes only each value.
_PLOT_MEASUREMENT_TIME_S = live.register_plot('measurement_time_s', unit="s", label="Measurement time")
_PLOT_MEASURED_INTERVAL_MS = live.register_plot('measured_interval_ms', unit="ms", label="Measured sample interval")
_PLOT_CONFIGURED_PERIOD_MS = live.register_plot('configured_period_ms', unit="ms", label="Configured sample period")
_PLOT_EFFORT = live.register_plot('effort', label="Motor effort")
_PLOT_LEFT_SPEED_MM_S = live.register_plot('left_speed_mm_s', unit="mm/s", label="Left speed")
_PLOT_RIGHT_SPEED_MM_S = live.register_plot('right_speed_mm_s', unit="mm/s", label="Right speed")


def publish_motor_values(command, measurements, start_ms, sample_period_ms):
    # Raw acquisition publishes before speed calculation; this timestamp identifies
    # the measurement used for command, speeds, and intervals on the next raw row.
    _PLOT_MEASUREMENT_TIME_S.value = elapsed_time_s(measurements.time_ms, start_ms)
    _PLOT_MEASURED_INTERVAL_MS.value = measurements.dt_s * 1000.0
    _PLOT_CONFIGURED_PERIOD_MS.value = sample_period_ms
    _PLOT_EFFORT.value = command
    _PLOT_LEFT_SPEED_MM_S.value = measurements.wheel_speeds.left_mm_s
    _PLOT_RIGHT_SPEED_MM_S.value = measurements.wheel_speeds.right_mm_s
`,gi=`# Measure motor effort versus wheel speed without wheel-speed feedback.
from time import sleep_ms, ticks_add, ticks_diff, ticks_ms
from experiment import (
    EFFORTS,
    EFFORT_DURATION_S,
    MAXIMUM_WHEEL_TRAVEL_MM,
    ZERO_DURATION_S,
)
from robot_setup import ROBOT_CONFIG
from live_variables import publish_motor_values
from ucsb_xrp import DriveCommand, XRPBot, elapsed_time_s
from ucsb_xrp_reference import SensorProcessor

# Direct XRPBot commands bypass Robot's wheel-speed feedback.
bot = XRPBot(ROBOT_CONFIG)
model = SensorProcessor(ROBOT_CONFIG)
bot.stop()
try:  # Ensure finally stops motors on exit.
    bot.reset_encoders()
    # Use the first raw reading after encoder reset as the measurement origin.
    measurements = model.reset(bot.read())
    measurement_start_ms = measurements.time_ms
    next_sample_ms = ticks_add(ticks_ms(), ROBOT_CONFIG.sample_period_ms)
    # Repeat zero command, commanded effort, and zero command at each level.
    for effort in EFFORTS:
        if not 0.0 <= effort <= 0.3:
            raise ValueError("Characterization effort must be within [0, 0.3]")
        intervals = (
            (0.0, ZERO_DURATION_S),
            (effort, EFFORT_DURATION_S),
            (0.0, ZERO_DURATION_S),
        )
        for command, duration_s in intervals:
            if duration_s <= 0 or duration_s > 1.0:
                raise ValueError("Each effort interval must be within (0, 1] s")
            start_ms = measurements.time_ms
            bot.set_drive(DriveCommand(command, command))
            while elapsed_time_s(measurements.time_ms, start_ms) < duration_s:
                # Wait until the next scheduled sample, subtracting time spent computing.
                remaining_ms = ticks_diff(next_sample_ms, ticks_ms())
                if remaining_ms > 0:
                    sleep_ms(remaining_ms)
                measurements = model.update(bot.read())
                wheel_travel_mm = max(
                    abs(measurements.left_position_mm),
                    abs(measurements.right_position_mm),
                )
                if wheel_travel_mm > MAXIMUM_WHEEL_TRAVEL_MM:  # Bound either wheel's travel.
                    raise RuntimeError("Characterization travel limit reached")
                publish_motor_values(command, measurements, measurement_start_ms, ROBOT_CONFIG.sample_period_ms)
                next_sample_ms = ticks_add(next_sample_ms, ROBOT_CONFIG.sample_period_ms)
                # Skip missed intervals instead of taking several samples immediately.
                lateness_ms = ticks_diff(ticks_ms(), next_sample_ms)
                if lateness_ms >= 0:
                    missed = lateness_ms // ROBOT_CONFIG.sample_period_ms + 1
                    next_sample_ms = ticks_add(next_sample_ms, missed * ROBOT_CONFIG.sample_period_ms)
            print("effort:", command, "wheel_speeds_mm_s:", measurements.wheel_speeds)
    # Retain the final published measurement in one last stopped raw acquisition.
    bot.stop()
    bot.read()
    print("Motor characterization complete")
finally:
    bot.stop()
`,_i=`# Sampling and supplied robot components for the motor experiment.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# main.py uses the sample interval and sensor settings. It applies motor
# commands directly, so the wheel-feedback settings below are unused here.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless; unused in this experiment.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless; unused in this experiment.
    left_speed_command_gain=0.0031,  # Left motor command per requested speed (s/mm); unused here.
    right_speed_command_gain=0.0031,  # Right motor command per requested speed (s/mm); unused here.
    wheel_speed_kp=0.001,  # Correction per wheel-speed error (s/mm); unused here.
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,vi=`# Check Tutorial 1 functions without starting either robot.

from student_work import (
    average_speed_mm_s,
    range_state,
    route_distance_mm,
    wheel_speed_summary,
)


from ucsb_xrp.check_support import assert_close as _close


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid input should raise ValueError")


def _check_average_speed():
    result = average_speed_mm_s(600.0, 4.0)
    if result is None:
        raise NotImplementedError("average_speed_mm_s returned no result")
    _close(result, 150.0, "mm/s", "average_speed_mm_s")
    _close(average_speed_mm_s(125.0, 0.5), 250.0, "mm/s", "average_speed_mm_s")
    _expect_value_error(average_speed_mm_s, -1.0, 2.0)
    _expect_value_error(average_speed_mm_s, 100.0, 0.0)
    return "600.0 mm / 4.0 s -> {} mm/s (expected 150.0)".format(result)


def _check_range_state():
    results = (
        range_state(None, 250.0),
        range_state(250.0, 250.0),
        range_state(251.0, 250.0),
    )
    expected = ("unavailable", "stop", "clear")
    if results != expected:
        raise AssertionError("expected {}, received {}".format(expected, results))
    _expect_value_error(range_state, 200.0, 0.0)
    return "range 250.0 mm at a 250.0 mm threshold -> stop"


def _check_route_distance():
    result = route_distance_mm([120.0, 80.0, 50.0])
    if result is None:
        raise NotImplementedError("route_distance_mm returned no result")
    _close(result, 250.0)
    _close(route_distance_mm(()), 0.0)
    _expect_value_error(route_distance_mm, (100.0, -5.0))
    return "[120.0, 80.0, 50.0] mm -> {} mm (expected 250.0)".format(result)


def _check_wheel_speed_summary():
    result = wheel_speed_summary(
        [100.0, 120.0, 140.0],
        (90.0, 110.0, 130.0),
    )
    if result is None:
        raise NotImplementedError("wheel_speed_summary returned no result")
    if not isinstance(result, dict):
        raise AssertionError("return a dictionary")
    expected_keys = {
        "sample_count",
        "mean_left_mm_s",
        "mean_right_mm_s",
        "mean_difference_mm_s",
    }
    if set(result) != expected_keys:
        raise AssertionError("expected keys {}".format(sorted(expected_keys)))
    if type(result["sample_count"]) is not int or result["sample_count"] != 3:
        raise AssertionError("sample_count should be 3")
    _close(result["mean_left_mm_s"], 120.0, "mm/s", "mean_left_mm_s")
    _close(result["mean_right_mm_s"], 110.0, "mm/s", "mean_right_mm_s")
    _close(result["mean_difference_mm_s"], 10.0, "mm/s", "mean_difference_mm_s")
    _expect_value_error(wheel_speed_summary, (), ())
    _expect_value_error(wheel_speed_summary, (100.0,), (90.0, 95.0))
    return "three paired samples -> mean difference {} mm/s (expected 10.0)".format(
        result["mean_difference_mm_s"]
    )


# Check the local functions against fixed input/output examples.
def run_exercise_checks():
    checks = (
        (
            "1 · average speed",
            _check_average_speed,
            "Check the inputs and return distance divided by duration.",
        ),
        (
            "2 · range decision",
            _check_range_state,
            "Check None first, then compare range with the stop distance.",
        ),
        (
            "3 · route distance",
            _check_route_distance,
            "Begin at 0.0 and add each nonnegative segment in a for loop.",
        ),
        (
            "4 · wheel-speed summary",
            _check_wheel_speed_summary,
            "Total paired samples, divide by count, and return the named values.",
        ),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check, hint in checks:
        try:
            example = check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
            print("  Next: " + hint)
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
            print("  Next: " + hint)
        else:
            passed += 1
            print("PASS · {} · {}".format(label, example))
    print(
        "Tutorial 1: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
`,yi=`# Run the Tutorial 1 checks, then print examples from the completed functions.

from exercise_checks import run_exercise_checks
from student_work import (
    average_speed_mm_s,
    range_state,
    route_distance_mm,
    wheel_speed_summary,
)


# Check the functions before printing the worked examples.
if run_exercise_checks():
    print("\\nCompleted-function examples")
    print("average speed:", average_speed_mm_s(300.0, 2.0), "mm/s")
    print("range decision:", range_state(220.0, 250.0))
    print("route distance:", route_distance_mm([100.0, 150.0]), "mm")
    print("wheel-speed summary:", wheel_speed_summary([80.0, 100.0], [75.0, 95.0]))
    print("Tutorial 1 complete")
else:
    print("Restore the runnable examples in student_work.py")
`,bi=`# Runnable Python examples used by Tutorial 1. This tutorial does not start a robot.


# Divide nonnegative distance (mm) by positive duration (s); return mm/s.
# Example: average_speed_mm_s(600.0, 4.0) returns 150.0.
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    if distance_mm < 0.0 or duration_s <= 0.0:
        raise ValueError("distance must be nonnegative and duration must be positive")
    return distance_mm / duration_s


# Return "unavailable", "stop", or "clear" from a range in mm or None.
# A missing range is represented by None rather than by zero millimeters.
def range_state(range_mm: object, stop_distance_mm: float) -> str:
    if stop_distance_mm <= 0.0:
        raise ValueError("stop distance must be positive")
    if range_mm is None:
        return "unavailable"
    if range_mm <= stop_distance_mm:
        return "stop"
    return "clear"


# Sum a list or tuple of nonnegative segment distances; return total mm.
def route_distance_mm(segment_distances_mm: object) -> float:
    total_mm = 0.0
    for distance_mm in segment_distances_mm:
        if distance_mm < 0.0:
            raise ValueError("route distances cannot be negative")
        total_mm += distance_mm
    return total_mm


# Read paired wheel-speed samples (mm/s); return their count and means (mm/s).
def wheel_speed_summary(
    left_samples_mm_s: object,
    right_samples_mm_s: object,
) -> dict:
    if not left_samples_mm_s or len(left_samples_mm_s) != len(right_samples_mm_s):
        raise ValueError("paired samples must be nonempty and equal in length")
    sample_count = len(left_samples_mm_s)
    left_total = 0.0
    right_total = 0.0
    for index in range(sample_count):
        left_total += left_samples_mm_s[index]
        right_total += right_samples_mm_s[index]
    mean_left_mm_s = left_total / sample_count
    mean_right_mm_s = right_total / sample_count
    return {
        "sample_count": sample_count,
        "mean_left_mm_s": mean_left_mm_s,
        "mean_right_mm_s": mean_right_mm_s,
        "mean_difference_mm_s": mean_left_mm_s - mean_right_mm_s,  # Positive: left faster.
    }
`,xi=`# Check measured Tutorial 2 segments without starting a robot.

from math import pi

from student_work import DrawingSegment, TurnSegment, build_drawing
from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState


def _state(left_mm, right_mm, heading_rad):
    measurements = Measurements(
        20, 0.02, left_mm, right_mm, 0.0, 0.0, 0.0, 0.0, None, False
    )
    return RobotState(measurements, Pose(0.0, 0.0, heading_rad))


def _expect_value_error(constructor, *arguments):
    try:
        constructor(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid segment values should raise ValueError")


def _check_straight_segment():
    segment = DrawingSegment("side", 120.0, 100.0)
    command = segment.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("command() must return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (120.0, 0.0):
        raise AssertionError("straight segment must request 120 mm/s and zero turn")
    start = _state(30.0, 34.0, 0.0)
    if segment.is_complete(start, _state(129.0, 133.0, 0.0)):
        raise AssertionError("99 mm of mean wheel travel is short of 100 mm")
    if not segment.is_complete(start, _state(131.0, 135.0, 0.0)):
        raise AssertionError("101 mm of mean wheel travel reaches 100 mm")
    _expect_value_error(DrawingSegment, "", 120.0, 100.0)
    _expect_value_error(DrawingSegment, "side", 0.0, 100.0)
    _expect_value_error(DrawingSegment, "side", 120.0, 0.0)


def _check_turn_segment():
    turn = TurnSegment("corner", 0.8, pi / 2.0)
    command = turn.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("command() must return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (0.0, 0.8):
        raise AssertionError("turn segment must request zero forward and 0.8 rad/s")
    start = _state(0.0, 0.0, 0.2)
    if turn.is_complete(start, _state(-60.0, 60.0, 1.7)):
        raise AssertionError("1.5 rad is short of a quarter turn")
    if not turn.is_complete(start, _state(-65.0, 65.0, 1.8)):
        raise AssertionError("1.6 rad completes a quarter turn")
    _expect_value_error(TurnSegment, "", 0.8, pi / 2.0)
    _expect_value_error(TurnSegment, "corner", 0.0, pi / 2.0)
    _expect_value_error(TurnSegment, "corner", 0.8, 0.0)


def _check_drawing():
    for side_mm, angle_rad in ((100.0, pi / 2.0), (180.0, 1.0)):
        segments = build_drawing(120.0, side_mm, 0.8, angle_rad)
        if not isinstance(segments, (list, tuple)) or len(segments) != 8:
            raise AssertionError("build_drawing must return four sides and four corners")
        for index, segment in enumerate(segments):
            if index % 2 == 0:
                if not isinstance(segment, DrawingSegment):
                    raise AssertionError("segment {} should be a straight side".format(index + 1))
                if segment.distance_mm != side_mm:
                    raise AssertionError("straight sides must use the requested distance")
            else:
                if not isinstance(segment, TurnSegment):
                    raise AssertionError("segment {} should be a turn".format(index + 1))
                if segment.angle_rad != angle_rad:
                    raise AssertionError("corners must use the requested angle")


# Fixed examples check the local functions before any robot run.
def run_exercise_checks():
    checks = (
        ("1 · measured straight segment", _check_straight_segment),
        ("2 · measured turn segment", _check_turn_segment),
        ("3 · ordered drawing", _check_drawing),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check in checks:
        try:
            check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print(
        "Tutorial 2: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
`,Si=`# Draw a square from measured wheel travel and estimated heading.

from math import pi

from robot_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_setup import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import elapsed_time_s, load_world


SIDE_SPEED_MM_S = 140.0  # Requested forward speed on each square side, mm/s.
SIDE_DISTANCE_MM = 180.0  # Measured axle-center travel required for each side, mm.
TURN_RATE_RAD_S = 1.5  # Requested counterclockwise turn rate at each corner, rad/s.
TURN_ANGLE_RAD = pi / 2.0  # Estimated heading change required at each corner: 90 degrees.
MAXIMUM_SEGMENT_TIME_S = 8.0  # Stop a segment that has not completed within 8 s.


checks_passed = run_exercise_checks()
# The example check reports differences; the current program still runs.
if not checks_passed:
    print("Example checks differ; running the current virtual drawing")

segments = build_drawing(
    side_speed_mm_s=SIDE_SPEED_MM_S,
    side_distance_mm=SIDE_DISTANCE_MM,
    turn_rate_rad_s=TURN_RATE_RAD_S,
    turn_angle_rad=TURN_ANGLE_RAD,
)
robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
    # Compare each side or turn with its own starting state; bound stalled segments.
    for segment in segments:
        segment_start = state
        while elapsed_time_s(state.measurements.time_ms, segment_start.measurements.time_ms) < MAXIMUM_SEGMENT_TIME_S:
            if segment.is_complete(segment_start, state):
                break
            state = robot.step(segment.command())
        else:
            # This block runs if elapsed time reached the limit before completion.
            raise RuntimeError("No measured completion for " + segment.name)
finally:
    robot.stop()
print("Tutorial 2 drawing complete")
print("final_pose:", state.pose)
`,Ci=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,wi=`# Measured straight and turning segments for a Virtual XRP drawing.

from ucsb_xrp import MotionCommand, RobotState, wrap_angle_rad

# DrawingSegment — request straight motion until measured wheel travel reaches a distance.
# Called by: Tutorial 2 main.py for each side of the drawing.
# Methods: command(), is_complete(start_state, current_state).
# Inputs: forward speed (mm/s), target distance (mm), and RobotState samples.
# State: name, speed, and target distance; no accumulated timer.
# Returns: MotionCommand and a completion Boolean from measured wheel positions.

class DrawingSegment:
    def __init__(self, name: str, forward_speed_mm_s: float, distance_mm: float) -> None:
        if not name or forward_speed_mm_s <= 0.0 or distance_mm <= 0.0:
            raise ValueError("straight segment needs a name, speed, and distance")
        self.name = name
        self.forward_speed_mm_s = forward_speed_mm_s
        self.distance_mm = distance_mm

    def command(self) -> MotionCommand:
        return MotionCommand(self.forward_speed_mm_s, 0.0)

    def is_complete(self, start_state: RobotState, current_state: RobotState) -> bool:
        start = start_state.measurements
        current = current_state.measurements
        # Subtract segment origins; the wheel positions themselves span the whole run.
        left_mm = current.left_position_mm - start.left_position_mm
        right_mm = current.right_position_mm - start.right_position_mm
        return (left_mm + right_mm) / 2.0 >= self.distance_mm


# TurnSegment — request an in-place left turn until estimated heading changes.
# Called by: Tutorial 2 main.py between straight sides.
# Methods: command(), is_complete(start_state, current_state).
# Inputs: turn rate (rad/s), target angle (rad), and RobotState samples.
# State: name, rate, and target angle; no accumulated timer.
# Returns: MotionCommand and a completion Boolean from estimated heading.

class TurnSegment:
    def __init__(self, name: str, turn_rate_rad_s: float, angle_rad: float) -> None:
        if not name or turn_rate_rad_s <= 0.0 or angle_rad <= 0.0:
            raise ValueError("turn segment needs a name, rate, and angle")
        self.name = name
        self.turn_rate_rad_s = turn_rate_rad_s
        self.angle_rad = angle_rad

    def command(self) -> MotionCommand:
        return MotionCommand(0.0, self.turn_rate_rad_s)

    def is_complete(self, start_state: RobotState, current_state: RobotState) -> bool:
        # A wrapped difference measures the commanded left turn across ±pi.
        heading_change_rad = wrap_angle_rad(
            current_state.pose.heading_rad - start_state.pose.heading_rad
        )
        return heading_change_rad >= self.angle_rad


def build_drawing(
    side_speed_mm_s: float,
    side_distance_mm: float,
    turn_rate_rad_s: float,
    turn_angle_rad: float,
) -> list:
    # Alternate four measured sides with four measured left turns.
    segments = []
    for index in range(4):
        segments.append(DrawingSegment("side {}".format(index + 1), side_speed_mm_s, side_distance_mm))
        segments.append(TurnSegment("corner {}".format(index + 1), turn_rate_rad_s, turn_angle_rad))
    return segments
`,Ti=`# Software checks for the Tutorial 3 RobotState calculation and sampled run.

from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState, load_world

from student_work import mean_wheel_position_mm, run_robot_program

# _RecordingRobot — Record Tutorial 3 robot calls for software checks.
# Called by: exercise_checks.py only.
# Methods: start(), step(), stop().
# Inputs: Requested MotionCommand and sample count.
# State: Recorded call sequence.
# Returns: Recorded RobotState values.

class _RecordingRobot:
    # Record Robot method calls without constructing or moving a robot.

    def __init__(self, fail_at_step=None, fail_on_start=False, frozen=False):
        self.start_poses = []
        self.step_calls = []
        self.stop_count = 0
        self.state = None
        self.fail_at_step = fail_at_step
        self.fail_on_start = fail_on_start
        self.frozen = frozen

    def start(self, initial_pose):
        self.start_poses.append(initial_pose)
        if self.fail_on_start:
            raise RuntimeError("injected robot.start failure")
        self.state = _state_for_step(0)
        return self.state

    def step(self, command, read_range=False):
        self.step_calls.append((command, read_range))
        if len(self.step_calls) == self.fail_at_step:
            raise RuntimeError("injected robot.step failure")
        self.state = _state_for_step(len(self.step_calls), frozen=self.frozen)
        return self.state

    def stop(self):
        self.stop_count += 1


def _state_for_step(step, frozen=False):
    left_mm = 0.0 if frozen else float(step) * 2.0
    right_mm = 0.0 if frozen else float(step) * 2.4
    measurements = Measurements(
        step * 20,
        0.02 if step else 0.0,
        left_mm,
        right_mm,
        2.0 if step else 0.0,
        2.4 if step else 0.0,
        100.0 if step else 0.0,
        120.0 if step else 0.0,
        None,
        False,
    )
    return RobotState(measurements, Pose(left_mm, 0.0, 0.0))


from ucsb_xrp.check_support import assert_close as _close, finite_number


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid speed or distance should raise ValueError")


def _check_mean_wheel_position():
    state = _state_for_step(5)
    result = mean_wheel_position_mm(state)
    if result is None:
        raise NotImplementedError("mean_wheel_position_mm returned no result")
    _close(result, 11.0)


def _check_robot_program():
    robot = _RecordingRobot()
    result = run_robot_program(robot, 80.0, 30.0)
    if len(robot.start_poses) != 1:
        raise AssertionError("call robot.start(...) exactly once")
    if robot.start_poses[0] != load_world().initial_pose:
        raise AssertionError("start with the initial pose from world.json")
    if len(robot.step_calls) != 14:
        raise AssertionError(
            "30 mm of measured travel requires 14 software samples; received {}".format(
                len(robot.step_calls)
            )
        )
    if mean_wheel_position_mm(result) < 30.0:
        raise AssertionError("stop only after measured travel reaches 30 mm")
    for index, call in enumerate(robot.step_calls):
        command = call[0]
        if not isinstance(command, MotionCommand):
            raise AssertionError(
                "step {} did not receive a MotionCommand".format(index + 1)
            )
        finite_number("forward_speed_mm_s", command.forward_speed_mm_s)
        finite_number("turn_rate_rad_s", command.turn_rate_rad_s)
        if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (80.0, 0.0):
            raise AssertionError(
                "step {} should request 80.0 mm/s straight motion".format(
                    index + 1
                )
            )
    if result is not robot.state:
        raise AssertionError("return the RobotState from the final robot.step call")
    if robot.stop_count != 1:
        raise AssertionError("call robot.stop() exactly once from finally")

    for speed_mm_s, distance_mm in ((0.0, 30.0), (-1.0, 30.0), (80.0, 0.0), (80.0, -1.0)):
        invalid_robot = _RecordingRobot()
        _expect_value_error(run_robot_program, invalid_robot, speed_mm_s, distance_mm)
        if invalid_robot.start_poses or invalid_robot.stop_count:
            raise AssertionError("validate inputs before starting the robot")

    failing_robot = _RecordingRobot(fail_at_step=3)
    try:
        run_robot_program(failing_robot, 80.0, 30.0)
    except RuntimeError as error:
        if str(error) != "injected robot.step failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.step error")
    if failing_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.step raises")

    failing_start_robot = _RecordingRobot(fail_on_start=True)
    try:
        run_robot_program(failing_start_robot, 80.0, 30.0)
    except RuntimeError as error:
        if str(error) != "injected robot.start failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.start error")
    if failing_start_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.start raises")

    frozen_robot = _RecordingRobot(frozen=True)
    try:
        run_robot_program(frozen_robot, 80.0, 30.0)
    except RuntimeError as error:
        if "did not reach" not in str(error):
            raise
    else:
        raise AssertionError("stop a moving run whose measured travel never advances")
    if frozen_robot.stop_count != 1:
        raise AssertionError("call robot.stop() after a no-progress fault")


# Fixed examples check the local functions before any robot run.
def run_exercise_checks():
    checks = (
        ("1 · mean wheel position", _check_mean_wheel_position),
        ("2 · measured straight program", _check_robot_program),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check in checks:
        try:
            check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print(
        "Tutorial 3: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
`,Ei=`# Construct the Virtual XRP and call the checked Tutorial 3 program.

from robot_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_setup import ROBOT_CONFIG
from student_work import mean_wheel_position_mm, run_robot_program


FORWARD_SPEED_MM_S = 120.0
TARGET_DISTANCE_MM = 300.0


checks_passed = run_exercise_checks()
# The example check reports differences; the current program still runs.
if not checks_passed:
    print("Example checks differ; running the current virtual program")

final_state = run_robot_program(make_robot(ROBOT_CONFIG), FORWARD_SPEED_MM_S, TARGET_DISTANCE_MM)
print("Tutorial 3 run complete")
print("mean_wheel_position_mm:", mean_wheel_position_mm(final_state))
print("final_pose:", final_state.pose)
`,Di=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Oi=`# Read RobotState and run one straight motion to a measured wheel-travel target.

from ucsb_xrp import MotionCommand, Robot, RobotState, elapsed_time_s, load_world


MAXIMUM_RUN_TIME_S = 8.0  # Stop if measured travel has not reached the target in 8 s.


def mean_wheel_position_mm(state: RobotState) -> float:
    # The axle midpoint has traveled the mean of the signed wheel positions.
    measurements = state.measurements
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    target_distance_mm: float,
) -> RobotState:
    # Stop from encoder travel, rather than from elapsed time or a pose estimate.
    if forward_speed_mm_s <= 0.0 or target_distance_mm <= 0.0:
        raise ValueError("speed and target distance must be positive")
    try:  # Ensure finally stops motors on exit.
        state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
        start_position_mm = mean_wheel_position_mm(state)
        command = MotionCommand(forward_speed_mm_s, 0.0)
        start_ms = state.measurements.time_ms
        while elapsed_time_s(state.measurements.time_ms, start_ms) < MAXIMUM_RUN_TIME_S:
            # Subtract the initial axle position so reruns use their own origin.
            if mean_wheel_position_mm(state) - start_position_mm >= target_distance_mm:
                return state
            state = robot.step(command)
        raise RuntimeError("Measured wheel travel did not reach the target")
    finally:
        robot.stop()
`,ki=`# Behavior checks for the Tutorial 4 state, command, and telemetry functions.

import student_work
from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid input should raise ValueError")


from ucsb_xrp.check_support import assert_close as _close, finite_number


def _check_phase_transitions():
    next_phase = student_work.next_phase
    cases = (
        (student_work.APPROACH, None, 250.0, False, student_work.APPROACH),
        (student_work.APPROACH, 251.0, 250.0, False, student_work.APPROACH),
        (student_work.APPROACH, 250.0, 250.0, False, student_work.TURN),
        (student_work.TURN, 200.0, 250.0, False, student_work.TURN),
        (student_work.TURN, 200.0, 250.0, True, student_work.DONE),
        (student_work.DONE, 200.0, 250.0, True, student_work.DONE),
    )
    for phase, range_mm, stop_mm, complete, expected in cases:
        actual = next_phase(phase, range_mm, stop_mm, complete)
        if actual != expected:
            raise AssertionError(
                "phase {} with range {} and turn_complete {}: expected {}, received {}".format(
                    phase, range_mm, complete, expected, actual
                )
            )
    _expect_value_error(next_phase, "unknown", 300.0, 250.0, False)
    _expect_value_error(next_phase, student_work.APPROACH, 300.0, 0.0, False)


def _check_motion_commands():
    command_for = student_work.command_for_phase
    approach = command_for(student_work.APPROACH, 120.0, 0.8, "left")
    left = command_for(student_work.TURN, 120.0, 0.8, "left")
    right = command_for(student_work.TURN, 120.0, 0.8, "right")
    done = command_for(student_work.DONE, 120.0, 0.8, "left")
    for command in (approach, left, right, done):
        if not isinstance(command, MotionCommand):
            raise AssertionError("each phase should return a MotionCommand")
        finite_number("forward_speed_mm_s", command.forward_speed_mm_s)
        finite_number("turn_rate_rad_s", command.turn_rate_rad_s)
    actual = (
        (approach.forward_speed_mm_s, approach.turn_rate_rad_s),
        (left.forward_speed_mm_s, left.turn_rate_rad_s),
        (right.forward_speed_mm_s, right.turn_rate_rad_s),
        (done.forward_speed_mm_s, done.turn_rate_rad_s),
    )
    expected = ((120.0, 0.0), (0.0, 0.8), (0.0, -0.8), (0.0, 0.0))
    if actual != expected:
        raise AssertionError("expected commands {}, received {}".format(expected, actual))
    _expect_value_error(command_for, "unknown", 120.0, 0.8, "left")
    _expect_value_error(command_for, student_work.APPROACH, 0.0, 0.8, "left")
    _expect_value_error(command_for, student_work.TURN, 120.0, 0.0, "left")
    _expect_value_error(command_for, student_work.TURN, 120.0, 0.8, "up")


# _LiveRecorder — Record Tutorial 4 live publications for software checks.
# Called by: exercise_checks.py only.
# Methods: watch(), plot().
# Inputs: Watch or plot names and values.
# State: Recorded publications.
# Returns: Captured values for assertions.

class _LiveRecorder:
    def __init__(self):
        self.watches = []
        self.plots = []

    def watch(self, name, value, unit="", label=None):
        self.watches.append((name, value, unit))

    def plot(self, name, value, unit="", label=None):
        self.plots.append((name, value, unit))


class _RecordedSignal:
    def __init__(self):
        self.value = None


def _capture_telemetry(state):
    recorder = _LiveRecorder()
    signals = (
        ("_PHASE", recorder.watch, "phase", ""),
        ("_RANGE", recorder.watch, "range_mm", "mm"),
        ("_DISTANCE", recorder.plot, "wheel_distance_mm", "mm"),
        ("_HEADING", recorder.plot, "heading_rad", "rad"),
    )
    missing = object()
    original_live = student_work.live
    original_signals = [getattr(student_work, name, missing) for name, _, _, _ in signals]
    captured = [_RecordedSignal() for _ in signals]
    try:
        student_work.live = recorder
        for (name, _, _, _), signal in zip(signals, captured):
            setattr(student_work, name, signal)
        student_work.publish_telemetry(state, student_work.APPROACH)
        for (_, publish, label, unit), signal in zip(signals, captured):
            if signal.value is not None:
                publish(label, signal.value, unit)
    finally:
        student_work.live = original_live
        for (name, _, _, _), original in zip(signals, original_signals):
            if original is missing:
                delattr(student_work, name)
            else:
                setattr(student_work, name, original)
    return recorder


def _check_telemetry():
    measurements = Measurements(
        100,
        0.02,
        140.0,
        160.0,
        2.0,
        2.0,
        100.0,
        100.0,
        275.0,
        False,
    )
    state = RobotState(measurements, Pose(50.0, 20.0, 0.4))
    recorder = _capture_telemetry(state)
    watches = dict((name, (value, unit)) for name, value, unit in recorder.watches)
    plots = dict((name, (value, unit)) for name, value, unit in recorder.plots)
    expected_watches = {
        "phase": (student_work.APPROACH, ""),
        "range_mm": (275.0, "mm"),
    }
    if watches != expected_watches:
        raise AssertionError(
            "expected watch values {}, received {}".format(
                expected_watches, watches
            )
        )
    if set(plots) != {"wheel_distance_mm", "heading_rad"}:
        raise AssertionError(
            "expected wheel_distance_mm and heading_rad plot signals"
        )
    if plots["wheel_distance_mm"][1] != "mm" or plots["heading_rad"][1] != "rad":
        raise AssertionError("plot signals should retain their stated units")
    _close(plots["wheel_distance_mm"][0], 150.0)
    _close(plots["heading_rad"][0], 0.4, "rad", "heading_rad")

    no_range = RobotState(
        Measurements(120, 0.02, 142.0, 162.0, 2.0, 2.0, 100.0, 100.0, None, False),
        Pose(52.0, 20.0, 0.4),
    )
    recorder = _capture_telemetry(no_range)
    watches = dict((name, value) for name, value, _unit in recorder.watches)
    if watches.get("range_mm") != "unavailable":
        raise AssertionError("publish 'unavailable' when no range is available")


# Fixed examples check the local functions before any robot run.
def run_exercise_checks():
    # Run each independent exercise and print a concise outcome.
    checks = (
        ("1 · phase transitions", _check_phase_transitions),
        ("2 · motion commands", _check_motion_commands),
        ("3 · telemetry", _check_telemetry),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check in checks:
        try:
            check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print(
        "Tutorial 4: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
`,Ai=`# Monitor controls for the approach, turn, and stopped phases.
# The behavior reads .value after each robot sample.

from ucsb_xrp import live


# Each number sets an initial value, lower/upper bounds, and step in the stated unit.
# Forward speed applies during approach. A sensor range at or below stop distance
# starts the turn; turn rate sets that rotation's magnitude.
FORWARD_SPEED = live.number(
    "tutorial_forward_speed_mm_s",
    110.0,
    minimum=60.0,
    maximum=130.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
STOP_DISTANCE = live.number(
    "tutorial_stop_distance_mm",
    260.0,
    minimum=180.0,
    maximum=360.0,
    step=10.0,
    unit="mm",
    label="Stop distance",
)
TURN_RATE = live.number(
    "tutorial_turn_rate_rad_s",
    0.8,
    minimum=0.4,
    maximum=1.2,
    step=0.1,
    unit="rad/s",
    label="Turn rate",
)
TURN_DIRECTION = live.choice(
    "tutorial_turn_direction",
    "left",
    options=("left", "right"),
    label="Turn direction",
)
RUN_BEHAVIOR = live.toggle("tutorial_run_behavior", True, label="Run behavior")
`,ji=`# Approach a measured wall, turn through an estimated quarter-turn, and stop.

from math import pi

from robot_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_setup import ROBOT_CONFIG
from student_work import (
    APPROACH,
    DONE,
    FORWARD_SPEED,
    RUN_BEHAVIOR,
    STOP_DISTANCE,
    TURN,
    TURN_DIRECTION,
    TURN_RATE,
    command_for_phase,
    next_phase,
    publish_telemetry,
)
from ucsb_xrp import elapsed_time_s, load_world, wrap_angle_rad


MAXIMUM_APPROACH_TRAVEL_MM = 500.0  # Fault stop before the practice wall.
MAXIMUM_MISSING_RANGE_TIME_S = 0.12  # Stop after 0.12 s without a usable range.
MAXIMUM_TURN_TIME_S = 5.0  # Fault stop if heading feedback does not progress.


# Check local examples before reporting results or starting motion.
if not run_exercise_checks():
    print("Restore the runnable example before starting the robot")
else:
    robot = make_robot(ROBOT_CONFIG)
    try:  # Ensure finally stops motors on exit.
        state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
        phase = APPROACH
        start_mean_mm = (
            state.measurements.left_position_mm + state.measurements.right_position_mm
        ) / 2.0
        turn_start_heading_rad = state.pose.heading_rad
        turn_start_ms = state.measurements.time_ms
        missing_range_s = 0.0
        # Range selects the turn; estimated heading determines when it ends.
        while phase != DONE:
            if not RUN_BEHAVIOR.value:
                phase = DONE

            turned_rad = abs(wrap_angle_rad(state.pose.heading_rad - turn_start_heading_rad))
            previous_phase = phase
            phase = next_phase(
                phase,
                state.measurements.range_mm,
                STOP_DISTANCE.value,
                turned_rad >= pi / 2.0,
            )
            if previous_phase != TURN and phase == TURN:
                # Measure the quarter-turn from the pose at the phase transition.
                turn_start_heading_rad = state.pose.heading_rad
                turn_start_ms = state.measurements.time_ms

            if phase == APPROACH:
                # Consecutive absent echoes and forward wheel travel bound the approach.
                missing_range_s = (
                    missing_range_s + state.measurements.dt_s
                    if state.measurements.range_mm is None else 0
                )
                mean_mm = (
                    state.measurements.left_position_mm + state.measurements.right_position_mm
                ) / 2.0
                if missing_range_s + 1e-9 >= MAXIMUM_MISSING_RANGE_TIME_S:
                    raise RuntimeError("Range sensing unavailable during approach")
                if mean_mm - start_mean_mm >= MAXIMUM_APPROACH_TRAVEL_MM:
                    raise RuntimeError("Approach exceeded the practice-area travel bound")
            if phase == TURN and elapsed_time_s(
                state.measurements.time_ms, turn_start_ms
            ) >= MAXIMUM_TURN_TIME_S:
                raise RuntimeError("Turn heading did not reach the target")

            command = command_for_phase(
                phase, FORWARD_SPEED.value, TURN_RATE.value, TURN_DIRECTION.value
            )
            publish_telemetry(state, phase)
            if phase == DONE:
                break
            state = robot.step(command, read_range=phase == APPROACH)
    finally:
        robot.stop()
    print("Tutorial 4 behavior complete")
    print("final_pose:", state.pose)
`,Mi=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Ni=`# Runnable measured behavior and telemetry functions for Tutorial 4.

from live_variables import FORWARD_SPEED, RUN_BEHAVIOR, STOP_DISTANCE, TURN_DIRECTION, TURN_RATE
from ucsb_xrp import MotionCommand, RobotState, live


APPROACH = "approach"
TURN = "turn"
DONE = "done"

# Register the displayed quantities once; publication assigns their values.
_PHASE = live.register_watch("phase")
_RANGE = live.register_watch("range_mm", unit="mm")
_DISTANCE = live.register_plot("wheel_distance_mm", unit="mm")
_HEADING = live.register_plot("heading_rad", unit="rad")

# Inputs: current phase, range (mm or None), stop distance (mm), turn status.
# Returns: the next phase; a missing range does not request a turn.
def next_phase(
    phase: str,
    range_mm: object,
    stop_distance_mm: float,
    turn_complete: bool,
) -> str:
    if phase not in (APPROACH, TURN, DONE):
        raise ValueError("unknown phase")
    if stop_distance_mm <= 0.0:
        raise ValueError("stop distance must be positive")
    if phase == APPROACH:
        # None is missing data, so it cannot satisfy the stop-distance test.
        if range_mm is not None and range_mm <= stop_distance_mm:
            return TURN
        return APPROACH
    if phase == TURN and turn_complete:
        return DONE
    return phase


# Inputs: phase, forward speed (mm/s), turn rate (rad/s), left/right direction.
# Returns: MotionCommand with forward mm/s and turn rad/s for that phase.
def command_for_phase(
    phase: str,
    forward_speed_mm_s: float,
    turn_rate_rad_s: float,
    turn_direction: str,
) -> MotionCommand:
    if phase not in (APPROACH, TURN, DONE):
        raise ValueError("unknown phase")
    if forward_speed_mm_s <= 0.0 or turn_rate_rad_s <= 0.0:
        raise ValueError("speed and turn rate must be positive")
    if turn_direction not in ("left", "right"):
        raise ValueError("turn direction must be left or right")
    if phase == APPROACH:
        return MotionCommand(forward_speed_mm_s, 0.0)
    if phase == TURN:
        # Left is positive yaw in the course coordinate convention.
        direction = 1.0 if turn_direction == "left" else -1.0
        return MotionCommand(0.0, direction * turn_rate_rad_s)
    return MotionCommand(0.0, 0.0)


# Inputs: latest RobotState and phase name; publishes current watch/plot values.
# Returns: None; range may be published as "unavailable".
def publish_telemetry(state: RobotState, phase: str) -> None:
    range_value = state.measurements.range_mm
    if range_value is None:
        range_value = "unavailable"
    _PHASE.value = phase
    _RANGE.value = range_value
    mean_distance_mm = (
        # Averaging signed wheel positions estimates axle-center travel.
        state.measurements.left_position_mm
        + state.measurements.right_position_mm
    ) / 2.0
    _DISTANCE.value = mean_distance_mm
    _HEADING.value = state.pose.heading_rad
`,Pi=`# Check each field of the Tutorial 5 report without starting a robot.

from student_work import preflight_report
from ucsb_xrp import Measurements, Pose, RobotState


from ucsb_xrp.check_support import assert_close as _close


def _state(
    time_ms,
    dt_s,
    left_position_mm,
    right_position_mm,
    range_mm,
    button_pressed,
):
    measurements = Measurements(
        time_ms,
        dt_s,
        left_position_mm,
        right_position_mm,
        0.0,
        0.0,
        0.0,
        0.0,
        range_mm,
        button_pressed,
    )
    return RobotState(measurements, Pose(0.0, 0.0, 0.0))


SAMPLE_STATES = (
    _state(0, 0.0, 0.0, 0.0, None, False),
    _state(20, 0.02, 0.1, -0.2, 420.0, False),
    _state(40, 0.02, 0.2, -0.4, 380.0, True),
)


def _read_report():
    report = preflight_report(SAMPLE_STATES)
    if report is None:
        raise NotImplementedError("preflight_report returned no result")
    if not isinstance(report, dict):
        raise AssertionError("return a dictionary")
    return report


def _check_sample_count(report):
    if type(report.get("sample_count")) is not int or report.get("sample_count") != 3:
        raise AssertionError("sample_count: expected 3, received {}".format(report.get("sample_count")))
    try:
        preflight_report(())
    except ValueError:
        return
    raise AssertionError("raise ValueError for an empty collection")


def _check_elapsed_time(report):
    _close(report.get("elapsed_time_s"), 0.04, "s", "elapsed_time_s")


def _check_wheel_position(report):
    _close(report.get("maximum_abs_wheel_position_mm"), 0.4)


def _check_range_count(report):
    if type(report.get("usable_range_count")) is not int or report.get("usable_range_count") != 2:
        raise AssertionError("expected 2, received {}".format(report.get("usable_range_count")))


def _check_nearest_range(report):
    _close(report.get("nearest_range_mm"), 380.0)
    no_range = preflight_report(
        (
            _state(0, 0.0, 0.0, 0.0, None, False),
            _state(20, 0.02, 0.0, 0.0, None, False),
        )
    )
    if no_range.get("nearest_range_mm") is not None:
        raise AssertionError("nearest_range_mm should be None without a measurement")


def _check_button(report):
    if report.get("button_was_pressed") is not True:
        raise AssertionError("button_was_pressed should be True")


# Fixed examples check the local functions before any robot run.
def run_exercise_checks():
    try:
        report = _read_report()
    except NotImplementedError as error:
        print("NOT COMPLETED · preflight report · " + str(error))
        print("  Next: initialize the six result values, update them in one loop, and return a dictionary.")
        print("Tutorial 5: 0 passed · 1 not completed · 0 incorrect")
        return False
    except Exception as error:
        print("INCORRECT · preflight report · " + str(error))
        print("Tutorial 5: 0 passed · 0 not completed · 1 incorrect")
        return False

    checks = (
        ("sample count", _check_sample_count),
        ("elapsed time", _check_elapsed_time),
        ("maximum wheel position", _check_wheel_position),
        ("usable range count", _check_range_count),
        ("nearest range", _check_nearest_range),
        ("USER button", _check_button),
    )
    passed = 0
    incorrect = 0
    for label, check in checks:
        try:
            check(report)
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print("Tutorial 5: {} passed · 0 not completed · {} incorrect".format(passed, incorrect))
    return incorrect == 0


if __name__ == "__main__":
    run_exercise_checks()
`,Fi=`# Check stationary sensors, then request one short straight motion.

from robot_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_setup import ROBOT_CONFIG
from student_work import preflight_report
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, load_world


# Set True before Run for the short motion check; restore False afterward.
ENABLE_SHORT_MOTION = False
STATIONARY_DURATION_S = 1.0  # Stopped sensor capture lasts 1 s at any sample rate.
MOTION_DURATION_S = 0.5  # Gated motion lasts at most 0.5 s plus one sample interval.
MOTION_SPEED_MM_S = 60.0  # Requested straight speed in mm/s.

# Input: Robot; returns stationary RobotState samples, including the start.
def collect_stationary_samples(robot):
    # Robot.step maintains the sample schedule; no additional delay is needed.
    states = []
    try:  # Ensure finally stops motors on exit.
        state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
        states.append(state)
        # Collect repeated stopped samples to expose sensor noise and encoder drift.
        start_ms = state.measurements.time_ms
        while elapsed_time_s(state.measurements.time_ms, start_ms) < STATIONARY_DURATION_S:
            state = robot.step(STOP_COMMAND, read_range=True)
            states.append(state)
        return tuple(states)
    finally:
        robot.stop()


# Input: Robot; returns start and final RobotState after a short gated motion run.
def run_short_motion(robot):
    # This timed motion checks motors and encoders; wheel travel does not end the run.
    try:  # Ensure finally stops motors on exit.
        initial_state = robot.start(load_world().initial_pose)
        state = initial_state
        command = MotionCommand(MOTION_SPEED_MM_S, 0.0)
        # The explicit motion gate permits only this short diagnostic sequence.
        start_ms = state.measurements.time_ms
        while elapsed_time_s(state.measurements.time_ms, start_ms) < MOTION_DURATION_S:
            state = robot.step(command)
        return initial_state, state
    finally:
        robot.stop()


# Input: RobotState; returns mean signed left/right wheel position in mm.
def mean_wheel_position_mm(state):
    measurements = state.measurements
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_preflight():
    # Check local examples before reporting results or starting motion.
    if not run_exercise_checks():
        print("Restore the runnable report example before running the XRP")
        return None

    robot = make_robot(ROBOT_CONFIG)
    states = collect_stationary_samples(robot)
    report = preflight_report(states)
    print("Stationary preflight complete")
    for name in (
        "sample_count",
        "elapsed_time_s",
        "maximum_abs_wheel_position_mm",
        "usable_range_count",
        "nearest_range_mm",
        "button_was_pressed",
    ):
        print(name + ":", report[name])

    if not ENABLE_SHORT_MOTION:
        print("Short motion disabled. Set ENABLE_SHORT_MOTION = True in main.py before Run; restore False afterward.")
        return report

    initial_state, final_state = run_short_motion(robot)
    # Compare axle-center wheel position after a fresh start for the motion segment.
    wheel_travel_mm = mean_wheel_position_mm(final_state) - mean_wheel_position_mm(initial_state)
    print("Short motion check complete")
    print("motion_wheel_travel_mm:", wheel_travel_mm)
    print("final_pose:", final_state.pose)
    return report


run_preflight()
`,Ii=`# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Li=`# Summarize stationary RobotState samples collected during Tutorial 5.


# Inputs: nonempty RobotState sequence from the stationary sample run.
# Returns: counts, elapsed seconds, maximum wheel travel, nearest range in
# mm or None, and whether the USER button was pressed.
def preflight_report(states: object) -> dict:
    if not states:
        raise ValueError("states must not be empty")
    elapsed_time_s = 0.0
    maximum_abs_wheel_position_mm = 0.0
    usable_range_count = 0
    nearest_range_mm = None
    button_was_pressed = False
    for state in states:
        measurements = state.measurements
        # dt_s starts at zero on reset, so summing samples gives run duration.
        elapsed_time_s += measurements.dt_s
        # Either wheel drifting from zero can fail a stationary preflight.
        maximum_abs_wheel_position_mm = max(
            maximum_abs_wheel_position_mm,
            abs(measurements.left_position_mm),
            abs(measurements.right_position_mm),
        )
        if measurements.range_mm is not None:
            # Count states with available range; several may share one echo.
            usable_range_count += 1
            if nearest_range_mm is None or measurements.range_mm < nearest_range_mm:
                nearest_range_mm = measurements.range_mm
        button_was_pressed = button_was_pressed or measurements.button_pressed
    return {
        "sample_count": len(states),
        "elapsed_time_s": elapsed_time_s,
        "maximum_abs_wheel_position_mm": maximum_abs_wheel_position_mm,
        "usable_range_count": usable_range_count,
        "nearest_range_mm": nearest_range_mm,
        "button_was_pressed": button_was_pressed,
    }
`,Ri=`# Circle

Drive one counterclockwise circle on open floor, stopping after the measured axle travel reaches one circumference.
Set the axle midpoint's path diameter with \`CIRCLE_DIAMETER_MM\` in **challenge.py**; use **Stop** to end a run early.
`,zi=`# Manual driving

This demonstration lets you steer the XRP with two sliders in **Monitor → Live
controls**. Open the Project in the IDE, choose the **virtual XRP** first, and
press **Compile**, then **Run**. The robot starts stopped. Set **Forward speed** above zero to
drive forward or below zero to reverse. Set **Turn rate** above zero to turn
left or below zero to turn right. The two settings combine to make curves.
Both sliders start at zero on a new run.

To halt during a run, return **both sliders to zero** or press **Stop** in the
IDE. Press Run again to start a fresh, stopped session. The program calls
\`robot.stop()\` when Python exits its loop or raises an exception; the target
runtime also stops motor output when the IDE interrupts execution. Keyboard arrows are not captured, so the IDE's
editor and other controls keep their normal keyboard behavior.

\`live_variables.py\` declares the slider ranges and initial values; \`main.py\` contains the drive loop. \`world.json\`
defines the virtual arena and starting pose. \`robot_setup.py\` assembles the
supplied robot components; \`robot_setup.py\` holds the robot settings. The
same project can run on a physical XRP, but use a clear floor area, keep the
robot in view, and have **Stop** ready. This demonstration has no automatic
obstacle avoidance; the front range sensor cannot see behind the robot.
`,Bi=`# Obstacle turn

Run a three-part motion sequence:

1. Drive toward an obstacle until ultrasound reports 400 mm from the sensor.
2. Rotate left through 90 degrees, using the estimated heading.
3. Drive toward the second obstacle and stop.

The default **World** contains two broad obstacles for this sequence. During
a run, **Live controls** lets you change the speed, obstacle distance, rotation
rate, turn direction and whether to make the second approach. **Program
watches** shows the current phase, distance and heading error.

## Change the experiment

**challenge.py** defines the rotation-failure limit; **live_variables.py** declares the live controls.
**world.json** defines the arena, obstacles and starting pose. **main.py**
contains the approach and rotation functions. **robot_setup.py** holds robot
geometry and controller settings. **live_variables.py** also publishes range,
phase, and heading-error watches.

For a physical run, arrange broad, firm obstacles as shown in the world and
leave room for the robot to stop. A missing echo allows the approach to
continue; press **Stop** if the path is no longer clear or no obstacle is found.
A rotation that takes more than eight seconds stops with an error.

The \`finally\` block calls \`robot.stop()\` when the sequence ends or a Python
error interrupts it.
`,Vi=`# Random-snake route

The XRP drives a short straight segment, rotates 90 degrees left or right,
and repeats this sequence twelve times. **Run** starts the route; the robot
stops after the twelfth segment and rotation. Press **Stop** to end it earlier.

The random seed makes the chosen distances and directions repeat on each run.
Watch **phase**, **segment** and **travel** under **Program watches**. Travel is
estimated motion of the midpoint between the wheels; rotating in place adds
no forward travel.
Use the **Forward speed** and **Turn rate** live sliders to compare two runs;
keep the random seed fixed so the requested segment sequence is comparable.

## Change the experiment

- **challenge.py** sets the random seed, number of segments, and distance range.
- **world.json** sets the arena and initial position and heading. Its finish
  marker shows the expected region for the supplied settings.
- **main.py** runs the sequence; **live_variables.py** declares speed and turn controls and publishes the watches;
  **robot_setup.py** holds robot dimensions and controller settings.

On the physical XRP, place the robot at the configured starting pose in a
clear arena. Wheel slip and robot dimensions affect where the route finishes.
This demonstration does not sense obstacles.

A straight segment stops with an error if it takes more than 30 seconds; a
rotation has eight seconds. These limits help identify a robot that is not
moving as requested. The \`finally\` block calls \`robot.stop()\` when the route
ends or a Python error interrupts it.
`,Hi=`# Roomba-style obstacle avoidance

The XRP drives toward an obstacle, reverses briefly, turns, and drives forward
again. **Run** starts the demonstration; press **Stop** when finished.

The initial settings start reversing when forward ultrasound distance is
264 mm or less, reverse for 0.4 s, and choose a rotation
between 70 and 160 degrees.
A fixed random seed repeats the same sequence of turn choices on each run.
Watch the phase, distance and number of turns under **Program watches**.
The **Live controls** sliders adjust forward and reverse speed, obstacle
distance, and turn rate during the run. Their current values appear in Monitor.

## Change the experiment

- **challenge.py** contains the reverse duration, turn-angle range and random seed.
- **world.json** defines the arena, divider and starting pose.
- **main.py** implements the approach → reverse → turn sequence using the
  supplied robot services. **live_variables.py** declares speed, obstacle distance and turn controls, and publishes the watch values;
  **robot_setup.py** contains robot-specific settings.

For a physical run, leave space behind the robot for reversing and use broad,
firm obstacles. A missing ultrasound echo allows the approach to continue;
watch the robot and use **Stop** if necessary. The robot has no rear range sensor.

If a turn does not finish within eight seconds, the program stops and reports
the problem. The \`finally\` block calls \`robot.stop()\` when the motion sequence
ends or a Python error interrupts it.
`,Ui=`# SnakeGame

Select **Compile**, then **Run**. The robot drives between food pellets in the
arena. Each pellet it reaches disappears, adds one point, and lengthens the
snake. Crossing its tail, reaching the arena edge, or detecting a nearby
obstacle ends the game and stops the robot. **Stop** ends the current run;
**Run** starts again with score zero and all food restored.

The green head marks the robot's position. The curved tail shows only the
recent part of its path, with length determined by the food collected. Watch
the score in World and adjust these sliders in Monitor while the game runs:

| Control | Starting value | Range | Effect |
| --- | --- | --- | --- |
| Cruise speed | 500 mm/s | 60–700 mm/s | Requested speed between targets. Motor effort is limited to 1.0; the XRP may not attain the requested speed. |
| Tail growth per food | 67 mm | 20–300 mm | Length added when the next pellet is collected. |

Change game, control, navigation, calibration, and display settings in
\`snake_config.json\`. \`live_variables.py\` creates the two Monitor sliders from
that file. The default 13.5 pellets/m² gives 50 pellets in the virtual arena
and 201 in the larger physical field. \`snake_food.py\` generates repeatable,
irregular positions from the arena dimensions and the configured seed; the
positions do not need individual entries in \`world.json\`. Food is collected
only when its center lies inside the displayed head. The head is 55 mm across
and the tail is 50 mm across.

\`main.py\` uses the supplied navigation controller to drive between positions.
\`snake_game.py\` tracks food and the tail and detects a crossing.
\`robot_setup.py\` applies the configured calibration and navigation settings.
It requests 80% of the selected cruise speed within 80 mm of each pellet
position. The head follows the robot's estimated position; a pellet is not
collected merely because the robot passed near it.

For a physical run, provide a clear 6096 × 2438 mm area and align the robot with
the displayed starting position and heading. The physical XRP selects this
larger field automatically. Food and the tail exist only in Monitor. Their
positions use wheel-encoder odometry, so slip or a misplaced start can make
the display disagree with the floor path. Begin at a low speed and keep
**Stop** available. The ultrasound sensor may miss obstacles and does not
detect another robot's displayed tail. The narrow displayed body is a game
graphic and does not establish clearance for the physical XRP. The 201-food
tail may use substantially more MicroPython memory than the virtual default;
this larger configuration has not been tested on a physical XRP.
`,Wi=`# Expanding spiral

Run this demonstration to see how forward speed and yaw rate shape a curved
path. The robot drives forward while its yaw rate gradually decreases, so the
spiral expands. Watch the path in **Monitor** and press **Stop** when finished.

During the run, **Forward speed** and **Spiral winding rate** appear under
**Live controls**. Winding rate is expressed in revolutions per metre: a larger
value makes a tighter curve. **Travel** and **Yaw rate** are recorded and can be
selected under **Plot signals**.

**Ignore obstacles** is unchecked by default. Check it for raised-wheel testing
to continue the spiral regardless of ultrasound distance, until you press
**Stop**. Uncheck it to restore obstacle stopping during the run.
If an obstacle makes the program stop immediately at startup, set the
\`ignore_obstacles\` default to \`True\` in **live_variables.py** before compiling.

## Change the experiment

- **world.json** sets the arena, obstacles, and initial position and heading.
  The default **Arena** is 3048 mm long and 1219.2 mm wide, with its origin at
  the centre. Heading zero points along +x; positive angles turn toward +y.
- **challenge.py** sets expansion distance and the obstacle stopping threshold.
  **live_variables.py** declares speed and winding controls; its 0.7 revolutions/m winding default starts
  with a broad curve; increase winding to compare tighter turns.
- **main.py** contains the spiral calculation and the repeated motion commands.
  **live_variables.py** also publishes travel and yaw rate; **robot_setup.py**
  holds the robot dimensions and controller settings.

The **Obstacle ahead** world places a block 1000 mm in front of the starting
position. The spiral curves as it approaches; it is not a straight approach
experiment. Use **Obstacle turn** for that demonstration.

## Run on the physical XRP

Place the robot at the starting pose shown in **world.json**, with room to
move. The program stops when ultrasound reports an obstacle within 400 mm of
the sensor face. A missing echo allows motion to continue, so keep the path in
view and use **Stop** if needed. Broad, firm objects make useful ultrasound
targets.

\`try\` contains the motion sequence. When it ends normally or a Python error
interrupts it, \`finally\` runs \`robot.stop()\` to stop the motors. The IDE also
provides **Stop** during a run.
`,Gi=`# UCSB waypoint route

The XRP traces the block letters **UCSB** by following a sequence of positions
in the arena. **Run** starts the route; the robot stops after reaching all 28
waypoints. Press **Stop** to end the run earlier.

**world.json** contains the route and starting pose. The initial position is at
the upper-left of the U, facing down its first stroke. Labels mark the start of
each letter in **Monitor**. Watch the estimated path and the **travel** value
as the robot moves.

## Change the experiment

Edit the waypoint positions in **world.json** to change the drawing. The route
is loaded in marker order. **robot_setup.py** contains navigation speeds and
tolerances; **challenge.py** loads the named route. **main.py** passes
the route to the supplied navigation class and repeatedly applies its commands.

For a physical run, mark the starting position and heading in a clear arena.
The program follows its estimated position and does not sense obstacles.
Compare the physical path with the estimated path to see the effect of wheel
slip and robot dimensions.

The \`finally\` block calls \`robot.stop()\` when the route ends or a Python error
interrupts it.
`,Ki=`# (Challenge 1) Motor Characterization

Observe how the two wheel speeds change when both motors receive the same
command. This supplied program runs three short motor-command intervals.

## 1. Run the supplied experiment

1. Open this Project from **New Project → Challenges**. Select **Virtual XRP**
   or your connected XRP. For a floor run, place the robot on a level surface
   with 2 m of clear space ahead and keep its wheels on the floor.
2. Open \`experiment.py\` to see the sequence. \`EFFORTS\` contains the motor
   commands \`0.16\`, \`0.22\`, and \`0.28\`. Each lasts 0.7 s, with 0.5 s at zero
   command before and after it. Keep these supplied values for the first run.
3. Select **Compile**, then **Run**. The program finishes after the sequence and
   prints \`Motor characterization complete\` in **Program output**. **Stop**
   ends a run early and removes motor effort.

## 2. Inspect the wheel response

1. Open **Monitor**. If its controls are collapsed, select **›** at the upper
   left. Under **Plot signals**, select **Motor effort**, **Left speed**, and
   **Right speed**. These three program signals show the command and its
   measured response. Motor effort is dimensionless; wheel speed is in mm/s.
2. For each command interval, compare the two wheel speeds near its end.
   Read one speed from each curve at the same time. Note any interval in which
   a wheel stays still or its speed continues to rise.
3. Find where the command returns to zero. Observe how long the wheels continue
   moving before their measured speeds return near zero. This is the response
   your Curling stopping rule must allow for.

## 3. Save the trial

1. Wait until the run shows **Run saved**. In **Monitor → Export**, select
   **Export run data as CSV**, then **Export plots as PNG**. The completion
   message gives each saved path, normally inside the Project's \`exports\`
   folder.
2. Use filenames containing your pair, target and trial, such as
   \`pair07_virtual_motor_trial01\`. Record the three commands and their durations
   with the plot. For a physical trial, also record the robot ID and battery
   condition. Keep virtual and physical trials separately labeled.
3. Record the left/right speed pair from each interval and one observation
   about movement after the zero command.

## Project files

<strong class="config-file">Amber †</strong>: settings for this experiment.
<span class="supplied-file">Gray S</span>: supplied program.

<div class="project-file-table">

| File | Parameters and purpose |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Applies the three command intervals, reads encoders and stops the motors when the sequence ends. |
| <strong class="config-file"><code>experiment.py</code> †</strong> | \`EFFORTS\`: commands sent to both motors, in order.<br>\`EFFORT_DURATION_S\`: time at each nonzero command, in s.<br>\`ZERO_DURATION_S\`: time at zero command before and after each interval, in s.<br>\`MAXIMUM_WHEEL_TRAVEL_MM\`: stops the experiment if either wheel's measured travel exceeds this value. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | \`sample_period_ms\`: interval between encoder readings, in ms.<br>The wheel-controller settings in this file do not affect this experiment, which sends motor commands directly. |
| <span class="supplied-file"><code>live_variables.py</code> S</span> | Publishes the motor command and measured wheel speeds for Monitor. |
| <strong class="config-file"><code>world.json</code> †</strong> | \`initial_pose\`: starting position in mm and heading in rad in Virtual XRP.<br>\`bounds\` and \`obstacles\`: virtual arena edges and objects, in mm. |

</div>

<div class="main-walkthrough">

## What is main.py doing?

1. \`XRPBot(ROBOT_CONFIG)\` creates the object that reads encoders and sends
   commands to the motors. The supplied \`SensorProcessor\` converts those
   encoder readings into wheel travel and speed.
2. \`bot.stop()\` removes motor effort. \`bot.reset_encoders()\` clears the counts.
   \`model.reset(bot.read())\` reads the first sample and establishes zero travel.
3. The outer \`for\` loop takes one value from \`EFFORTS\`. The next loop applies
   zero command, that value, then zero again. \`DriveCommand(command, command)\`
   sends the same value to both wheels. This experiment sends motor commands
   directly, so wheel-speed feedback does not change them.
4. During each interval, the \`while\` loop waits for the next sample, reads
   encoder counts and calls \`model.update()\` to calculate wheel travel and
   speed. \`publish_motor_values()\` sends the calculated values to Monitor.
   Elapsed timestamps determine when the interval ends.
5. The travel check stops the experiment if either wheel exceeds
   \`MAXIMUM_WHEEL_TRAVEL_MM\`. The \`finally\` block removes motor effort on normal
   completion or a Python error. The app also removes motor effort when you
   select **Stop**.

</div>
`,qi='# Tutorial 1: Python essentials\n\nRun four short, complete functions in `student_work.py`. This project does not\nstart either robot. It introduces the Python syntax used in the remaining\ntutorials: values, functions, decisions, loops, and collections.\n\nStart with **Run** and read the results in **Program output**. Keep these\ninstructions beside the editable `student_work.py`; most edits are in that file, with one input-change exercise in\nthe supplied `main.py` below. Make one temporary expression or branch change in `student_work.py`\nand run again. Each Run checks the four functions before printing the examples.\n\n## Reading a function\n\n```python\ndef average_speed_mm_s(distance_mm: float, duration_s: float) -> float:\n    speed_mm_s = distance_mm / duration_s\n    return speed_mm_s\n```\n\n- `def` begins a function.\n- The values inside parentheses are its inputs.\n- `return` sends one result back to the caller.\n- The annotations after `:` and `->` document expected types. MicroPython does\n  not enforce them, so your code must still handle invalid values deliberately.\n- A name ending in `_mm`, `_s`, or `_mm_s` states its physical unit.\n\nIndentation defines which statements belong to the function or to an `if` or\n`for` block. Use four spaces for each indentation level.\n\n## Example 1: calculate average speed\n\nRead `average_speed_mm_s(distance_mm, duration_s)`, trace the supplied call from\n`main.py`, then predict the result for the input below.\n\n```python\naverage_speed_mm_s(600.0, 4.0)  # returns 150.0\n```\n\nReturn distance divided by duration. Reject a negative distance or a duration\nthat is zero or negative with `raise ValueError(...)`. `ValueError` identifies an input that this function does not accept.\n\n## Example 2: choose from measured conditions\n\nRead `range_state(range_mm, stop_distance_mm)` and predict which branch each\nsupplied call below selects.\n\n```python\nrange_state(180.0, 250.0)  # returns "stop"\nrange_state(None, 250.0)   # returns "unavailable"\n```\n\nUse `if`, `elif`, and `else` to return:\n\n- `"unavailable"` when `range_mm is None`;\n- `"stop"` when range is at or below the stop distance; and\n- `"clear"` otherwise.\n\n`None` means that no usable measurement is available. Check it before making a\nnumerical comparison. Reject a stop distance that is zero or negative.\n\n## Example 3: total a route with a loop\n\nRead `route_distance_mm(segment_distances_mm)`, then predict the total if another\nroute segment were added.\n\n```python\nroute_distance_mm([120.0, 80.0, 50.0])  # returns 250.0\n```\n\nA list (`[...]`) and tuple (`(...)`) are ordered collections. Start a total at\n`0.0`, use a `for` loop to visit each distance, and add it to the total. Reject\na negative segment. An empty route has a total distance of `0.0`.\n\n## Example 4: return named results\n\nRead `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`, then predict\nwhich fields would change if one wheel-speed sample changed.\n\n```python\nsummary = wheel_speed_summary([100.0, 120.0], [90.0, 110.0])\nprint(summary["mean_difference_mm_s"])  # 10.0\n```\n\nReject empty inputs or inputs with different lengths. Otherwise return a\ndictionary with these four named results:\n\n- `"sample_count"`;\n- `"mean_left_mm_s"`;\n- `"mean_right_mm_s"`; and\n- `"mean_difference_mm_s"`, calculated as left mean minus right mean.\n\nA dictionary groups related values under descriptive keys. This pattern is\nused later for telemetry summaries.\n\n## Run and observe\n\n1. Select **Run** and read all four results in **Program output**.\n2. Open `student_work.py` beside these instructions and trace one result back\n   through its function.\n3. Make one small expression or branch change in `student_work.py` and predict\n   which check will identify it.\n4. Select **Run** again and compare the result with your prediction.\n5. Restore the supplied behavior before continuing if a check identifies a\n   mismatch.\n\nIf Python reports a syntax error, inspect the stated line and the line above\nit. Check indentation, parentheses, commas, colons, and spelling. A temporary\n`print(...)` can reveal an intermediate value; remove repeated debug prints\nafter the function works.\n\n## From MATLAB to the project files\n\n| Python form | Meaning in this course |\n| --- | --- |\n| `samples[0]` | First sample; indices start at zero. |\n| `range(4)` | Four values: 0, 1, 2, 3; the endpoint is excluded. |\n| `distance_mm ** 2` | Squared value; `^` is not exponentiation. |\n| `[1, 2] + [3]` | List concatenation, not vector addition. |\n| `value is None` | Missing reading; never substitute a physical zero silently. |\n| `if error_mm > tolerance_mm:` | Indentation defines the conditional block. |\n| `self.previous_count = count` | Store state for the next call on this object. |\n| `from robot_setup import ROBOT_CONFIG` | Import a named value from a file. |\n\n`=` assigns; `==` compares. Use `and`, `or` and `not` for scalar conditions.\nTwo names assigned the same list refer to the same mutable list; use `list(old)`\nwhen an independent copy is intended. Modules replace a shared interactive\nworkspace: make inputs explicit and keep calibration in its named file. Run\ncreates fresh program objects; saved project files remain. Avoid NumPy-specific\noperations in MicroPython. First change a working function, then one small class;\nbase classes supply an interface but do not implement its missing method.\n\n## A complete edit–predict–check cycle\n\nThe four functions use the same units and missing-value rule that later robot\nprograms use. Work through this small data set before changing code:\n\n| Expression | Calculation or decision | Expected result |\n| --- | --- | --- |\n| `average_speed_mm_s(450.0, 3.0)` | 450 mm ÷ 3 s | 150 mm/s |\n| `range_state(None, 250.0)` | No usable reading | `"unavailable"` |\n| `range_state(250.0, 250.0)` | Equality meets the stop threshold | `"stop"` |\n| `route_distance_mm([80.0, 120.0, 50.0])` | Sum three segments | 250 mm |\n| `wheel_speed_summary([100.0, 120.0], [90.0, 110.0])` | Mean left 110, mean right 100 | Mean difference 10 mm/s |\n\nFor one controlled edit, change `range_state` to use `<` instead of `<=` at\nthe threshold. Predict that the equality case changes from `"stop"` to\n`"clear"`; then Run and locate the second check\'s `INCORRECT` line. Restore\n`<=` and confirm four `PASS` lines. A failed check gives evidence about one\nfunction. It does not mean the Virtual XRP moved: Tutorial 1 never starts a\nrobot.\n\nFor a second edit, change the route example in `main.py` from `[100.0,\n150.0]` to `[100.0, 150.0, 25.0]`. Predict the printed total before Run: it\nshould rise from 250 to 275 mm. This is an experiment with supplied input\ndata; restore the original list afterward. Notice that the independent\n`exercise_checks.py` still tests its own 250 mm example. This separates a\nfunction\'s rule from one particular input.\n\nIf a check fails, read the first `INCORRECT` line and reproduce its specific\ninput. Inspect intermediate values with one temporary `print(...)`, then\nremove it. If a numerical result is wrong, check units and parentheses before\nchanging the expected result. If a `None` case fails, check the missing-value\nbranch before doing arithmetic. Never replace a missing range with zero: zero\nmillimeters would falsely mean an obstacle at the sensor.\n\nContinue with **Tutorial 2: Virtual XRP drawing**. It uses these same units\nand comparisons on readings returned by a sampled robot.\n',Ji='# Tutorial 2: draw from measured motion\n\nUse the **Virtual XRP** to draw four straight sides and four left turns. The\nprogram stops each side when measured mean wheel travel reaches its target and\neach corner when estimated heading changes by its target angle. This connects\nTutorial 1\'s arithmetic to a changing `RobotState`. The supplied drawing is\nabout 180 mm on each side; actual corners may round because motors respond\nand samples arrive at discrete intervals.\n\nOpen Monitor beside the IDE. Select **Run** before editing, then read the\nthree `PASS` lines in Program output and inspect the path and final pose. The\nfiles are already runnable so that each later edit has a visible baseline.\n\n## Project files and first edit\n\n| File | Role |\n| --- | --- |\n| `student_work.py` | Edit the segment data classes and `build_drawing(...)` to explore a path. |\n| `main.py` | Supplied entrypoint; sets target dimensions, runs each segment, and stops the robot. |\n| `exercise_checks.py` | Supplied checks for commands, measured completion, and segment order. |\n| `robot_setup.py` | Supplied robot assembly and settings. |\n| `world.json` | Supplied arena and initial pose used by the Virtual XRP. |\n\nEach `.py` file is a Python module. `main.py` imports `build_drawing` from\n`student_work.py` and calls it; it does not copy that function\'s code.\n\nAfter the baseline, change `SIDE_DISTANCE_MM` in `main.py` from 180 to 120 mm,\n**Reset** the Virtual XRP, and Run. Predict the change before looking at the\npath: each side should be about 60 mm shorter, so total commanded straight\ntravel falls by about `4 × 60 = 240 mm`. Restore 180 mm, then make the next\nchanges in `student_work.py`. This changes the value passed into `build_drawing()`; the segment methods\nremain in `student_work.py`.\n\n## 1. Read one measurement calculation\n\n`DrawingSegment("side 1", 140.0, 180.0)` stores a forward speed in mm/s and a\ntarget distance in mm. Its `command()` returns\n`MotionCommand(140.0, 0.0)`: forward motion with zero requested turn. A\n`MotionCommand` is a named data record; it is not a duration or a raw motor\nvoltage.\n\n`is_complete(start_state, current_state)` compares two readings:\n\n```python\nleft_mm = current.left_position_mm - start.left_position_mm\nright_mm = current.right_position_mm - start.right_position_mm\ntravel_mm = (left_mm + right_mm) / 2.0\n```\n\nFor starting wheel positions `(30, 34)` mm and current positions `(129, 133)`\nmm, both wheels advanced 99 mm; a 100 mm side is not yet complete. At\n`(131, 135)` mm, both advanced 101 mm and it is complete. Subtracting the\nstarting readings matters: the robot\'s wheel positions do not reset at every\nside.\n\n`__init__` runs when a segment object is created. Its `self.name`,\n`self.forward_speed_mm_s`, and `self.distance_mm` belong to that instance.\n`command()` and `is_complete()` read those same fields later. Python type\nannotations state expected types but do not enforce them by themselves;\nconstructor checks reject a missing name or nonpositive speed or distance.\n\n## 2. Read one turning calculation\n\n`TurnSegment("corner 1", 1.5, pi / 2.0)` requests an in-place left turn at 1.5 rad/s.\nIts `is_complete(...)` compares the current estimated heading with the heading\nat the start of this corner. `pi` is imported from `math`; `pi / 2.0` rad is\n90°. At 1.50 rad of heading change,\nthe corner is short of that target; at 1.60 rad, it has reached it. The code\nuses `wrap_angle_rad` so crossing the `−π`/`π` heading boundary does not make\none ordinary quarter-turn look like a full revolution.\n\nThe segment classes each store a different physical target. `DrawingSegment`\nuses wheel travel in mm; `TurnSegment` uses heading change in rad. Their shared\nmethod names let the short loop in `main.py` run either segment without asking\nwhich kind it received.\n\n## 3. Build and change an ordered path\n\n`build_drawing(side_speed_mm_s, side_distance_mm, turn_rate_rad_s,\nturn_angle_rad)` creates a list alternating side, corner, side, corner, and so\non. Read the `for index in range(4)` loop and predict the first and last\nsegment names. The first item is `side 1`; the eighth is `corner 4`.\n\nChange `build_drawing(...)` to use a shorter distance for sides 2 and 4 while\nleaving sides 1 and 3 at the requested distance. For example, half-length\nsides make a rectangle. Keep the passed-in `side_distance_mm` as the source of\nboth lengths so the function still works with another input. The checks will\nsay the result differs from the expected square sequence; **Run still executes the\ncurrent valid drawing** so you can inspect your rectangle. Restore the square\nbefore continuing.\n\n## 4. Compare prediction with the run\n\n1. Reset, Run, and note the three check results, drawn path, and `final_pose`.\n2. Make one dimension or sequence change. Predict which sides or corners\n   change, in mm or rad, before running again.\n3. Reset and Run. Compare the new path with the prediction. Use Program output\n   to locate a mismatch in a command value, measured completion rule, or\n   segment order.\n4. Restore the baseline; Run once more and confirm three `PASS` lines.\n\nThe inner loop in `main.py` calls `Robot.step(command)` repeatedly **until the\nmeasured target is reached**. It does not use a duration as the drawing\ninstruction. `MAXIMUM_SEGMENT_TIME_S = 8.0` stops a segment if it has not completed\nwithin 8 s of measured sample time. Each normal side or corner still ends\nfrom wheel travel or heading.\n`Robot.step()` already schedules samples, so do not add `sleep()` inside the\nloop. The `finally` block calls `robot.stop()` when motion finishes or Python\nraises an error. Select **Stop** in the IDE to interrupt a running experiment.\n\nContinue to **Tutorial 3: sampled robot programs** to examine the `RobotState`\nreturned by each sample and one measured straight run.\n',Yi=`# Tutorial 3: a measured robot program

This Virtual XRP project runs one straight segment and ends it when measured
wheel travel reaches 300 mm. Tutorial 2 used two kinds of segment; here you
trace the exact \`Robot.start()\` → \`Robot.step()\` → \`Robot.stop()\` data path that
appears in later challenges. The speed is a request in mm/s. Distance, not
elapsed time or a fixed sample count, decides normal completion.

Open the IDE and Monitor side by side. **Run the supplied project once before
editing.** Program output reports two \`PASS\` checks, the final mean wheel
position, and the final estimated pose. Monitor shows the path from the start
line. The runnable example uses supplied robot components; it does not
implement the Challenge 1 sensor or stopping controllers.

## Find the data in the project

| File | Role |
| --- | --- |
| \`student_work.py\` | The measured-position calculation and straight program to read and edit. |
| \`main.py\` | Supplied entrypoint with the 120 mm/s request and 300 mm target. |
| \`exercise_checks.py\` | Supplied software robot that checks returned data and stop behavior without motors. |
| \`robot_setup.py\` | Supplied robot assembly and settings. |
| \`world.json\` | Supplied arena and start pose shared by the Virtual XRP and Monitor. |

Read \`main.py\` first. \`from student_work import ...\` loads the functions from
the neighboring module. \`main.py\` creates the robot; it does not copy their
code. The start pose comes from \`world.json\`, so resetting the Virtual XRP
before each comparison gives both runs the same starting geometry.

## 1. Calculate one RobotState value

A call to \`Robot.step(command)\` returns a \`RobotState\`. Its
\`state.measurements\` contains the new wheel positions, and \`state.pose\`
contains the estimated arena position and heading. Reading either field does
not take a second sample.

\`mean_wheel_position_mm(state)\` computes the axle-midpoint wheel travel:

\`\`\`python
mean_mm = (left_position_mm + right_position_mm) / 2.0
\`\`\`

If left and right positions are 10 and 12 mm, the mean is 11 mm. If the start
sample was already at 40 mm and a later sample is at 90 mm, this segment has
advanced **50 mm**, not 90 mm. The program stores the start mean and subtracts
it from every later mean. Predict the result for starts \`(20, 24)\` and current
\`(70, 76)\` mm: start mean 22 mm, current mean 73 mm, travel 51 mm.

\`RobotState\` and \`Measurements\` are named records. Their fields state units;
a tuple such as \`state[2]\` would hide whether the number is a wheel position,
speed, or time. Python annotations describe the expected record type but do
not validate every method call automatically.

## 2. Trace the sampled loop

\`run_robot_program(robot, forward_speed_mm_s, target_distance_mm)\` performs
these operations in order:

1. Validate positive speed and target distance **before** starting motors.
2. Call \`robot.start(load_world().initial_pose)\` once and retain its state.
3. Save the starting mean wheel position and create
   \`MotionCommand(forward_speed_mm_s, 0.0)\` for straight motion.
4. Compare the latest measured travel with the distance target. If it is
   short, call \`robot.step(command)\` and compare the new state again.
5. Return the state that first meets or exceeds the target. \`finally\` calls
   \`robot.stop()\` on completion and on a Python error.

The last step can exceed the target slightly because the robot moves between
samples. In the software check, left and right positions advance 2.0 and
2.4 mm per sample. Their mean advances 2.2 mm, so a 30 mm target is first met
after 14 samples (\`14 × 2.2 = 30.8 mm\`). The target, not the number 14,
controls the loop. \`MAXIMUM_RUN_TIME_S = 8.0\` stops a run if measured
travel has not reached the target within 8 s. This limit stays the same
when the control sample period changes.

## 3. Make one controlled comparison

1. With the Virtual XRP reset, Run at the supplied 120 mm/s and 300 mm target.
   Record the printed final mean position and compare the path with the
   300 mm start-line scale.
2. In supplied \`main.py\`, temporarily set \`TARGET_DISTANCE_MM = 180.0\`.
   Predict a roughly 120 mm shorter straight path. Reset and Run. The
   software checks still use their own small 30 mm example.
3. Restore 300 mm. In \`student_work.py\`, change the return expression in
   \`mean_wheel_position_mm\` so it uses only the left wheel. Run and read the
   first \`INCORRECT\` check. The straight run can still proceed, but its
   completion estimate has changed. Restore the mean and confirm two \`PASS\`
   checks on the next Run.

The supplied check substitutes a recording robot, so it verifies that
\`start()\` is called once, that commands request straight motion, that a
measured target ends the loop, and that \`stop()\` executes after completion or
an exception. An invalid speed or distance must fail before \`start()\`.

\`Robot.step()\` schedules the sample and publishes telemetry. Do not add
\`sleep()\` inside this loop. The target runtime handles the IDE's **Stop**;
forced termination can bypass Python \`finally\`, so the runtime also releases
motor effort. Use a physical XRP only after its separate setup and safety
instructions; this tutorial's worked comparison is virtual evidence.

Continue to **Tutorial 4: behavior, controls, and telemetry** to make the next
command depend on range and heading measurements.
`,Xi="# Tutorial 4: behavior and live measurements\n\nRun a complete Virtual XRP behavior: approach the marked wall, turn about 90°,\nand stop. Its next command depends on a range reading, a retained phase, and\nestimated heading. You will change one live value while observing the phase\nwatch and two plots, then trace that visible change to a line of Python.\n\nOpen Monitor beside the IDE and **Run the supplied project before editing**.\nProgram output should show three `PASS` checks, then the final pose. The path\nshould approach the wall and turn. Reset before each comparison so both runs\nstart from the same pose. The supplied `main.py` owns the sampled loop and final\nmotor stop; edit `student_work.py` only when exploring a function.\n\n## Project files and the data path\n\n| File | Role |\n| --- | --- |\n| `student_work.py` | Runnable phase, command, and publication functions to read and edit. |\n| `live_variables.py` | Supplied Monitor control declarations for speed, distance, direction, and Run behavior. |\n| `main.py` | Supplied measured approach/turn sequence and motor cleanup. |\n| `exercise_checks.py` | Supplied input/output examples that run before motion. |\n| `robot_setup.py` | Supplied robot assembly and settings. |\n| `world.json` | Supplied arena, wall, and start pose shown in Monitor. |\n\n`Robot.step(command, read_range=True)` takes the next sample while approaching.\nThe returned `RobotState` contains `state.measurements.range_mm` and\n`state.pose.heading_rad`. The program passes those values to `next_phase`,\npasses the chosen phase to `command_for_phase`, publishes the same state to\nMonitor, and then requests the next sample. This is the complete\n**measure → decide → command → publish** cycle.\n\n## 1. Predict a phase transition\n\nThere are three phase names: `APPROACH`, `TURN`, and `DONE`. The current phase\nand new readings determine the next one.\n\n| Current phase | New evidence | Next phase |\n| --- | --- | --- |\n| `APPROACH` | Range 300 mm, stop distance 260 mm | `APPROACH` |\n| `APPROACH` | Range 260 mm, stop distance 260 mm | `TURN` |\n| `APPROACH` | Range `None` | `APPROACH` for that one decision |\n| `TURN` | Heading change 1.50 rad, below π/2 | `TURN` |\n| `TURN` | Heading change 1.60 rad, above π/2 | `DONE` |\n| `DONE` | Any later reading | `DONE` |\n\n`None` means no usable range measurement, not zero distance. The function\nchecks `range_mm is not None` before comparing distances. An uninterrupted\n0.12 s of unavailable range causes the supplied runner to stop with a fault.\nThe runner adds the actual sample intervals, so this limit remains 0.12 s\nwhen the sample rate changes. `next_phase` itself stays a small,\ninput/output function that can be checked without starting a robot.\n\n`turn_start_heading_rad` is reset when the phase first changes to `TURN`.\nLater heading changes are measured relative to that start, not relative to\nthe original arena heading. The code uses `wrap_angle_rad` for the `−π`/`π`\nboundary. Predict which phase you would choose for a heading change of 1.50\nrad, then compare it with the table before running.\n\n## 2. Predict a motion command\n\n`command_for_phase(...)` returns a `MotionCommand` with named\n`forward_speed_mm_s` and `turn_rate_rad_s` fields.\n\n| Phase | Forward speed | Turn rate |\n| --- | --- | --- |\n| `APPROACH` | Positive live speed | 0 |\n| `TURN`, left | 0 | Positive live turn rate |\n| `TURN`, right | 0 | Negative live turn rate |\n| `DONE` | 0 | 0 |\n\nPositive turn is counterclockwise. At a selected speed of 110 mm/s and turn\nrate of 0.8 rad/s, a left-turn command is `MotionCommand(0.0, 0.8)`, not a\nrequest to drive forward while turning. The function rejects invalid phase,\nspeed, rate, or direction inputs before constructing a command. These are\nrequested robot motions; the supplied wheel controller determines bounded\nmotor effort.\n\n## 3. Change one live control and compare evidence\n\n`live_variables.py` declares speed, stopping distance, turn rate,\ndirection, and a Run behavior toggle. They appear under Monitor controls.\nRead current values through `.value`; the robot applies a changed control at\na sample boundary. Changing a slider during a run does not rewrite the saved\nproject file.\n\n1. Run the baseline with `STOP_DISTANCE = 260 mm`. In Monitor, note the\n   approach path, the range near the phase change, and the final heading.\n2. Reset. Set Stop distance to 340 mm and Run. Predict an earlier turn, farther\n   from the wall, before inspecting the path. Compare the `range_mm` watch at\n   the transition and the two paths. Keep speed and turn rate fixed.\n3. Reset. Restore 260 mm, choose `right`, and Run. Predict the sign of the\n   heading change. Compare the heading plot and final pose with the left run.\n4. Restore `left`. If you change `next_phase` or `command_for_phase` in\n   `student_work.py`, Run again and read the first differing check before\n   interpreting the path.\n\nThe Run behavior toggle can request `DONE` and zero motion at the next sampled\ndecision. The IDE **Stop** action interrupts the run separately.\n\n## 4. Connect telemetry to its source\n\n`student_work.py` registers its watches and plots before the run.\n`publish_telemetry(state, phase)` assigns their `.value` fields. The watches show\nthe current `phase` and `range_mm`; unavailable range appears as text. The plots\nrecord these two numerical quantities:\n\n- `wheel_distance_mm`: mean left/right wheel position in mm;\n- `heading_rad`: estimated heading in rad.\n\nFor left and right positions 140 and 160 mm, the plotted mean is 150 mm. That\nnumber is a computed wheel-position value, not a separate floor measurement.\nThe plot retains samples in the recorded run; the watch shows current status.\nPublication does not choose a command. Use a `print(...)` for a rare milestone\nor exception, not once per sample.\n\nThe runner stops if approach wheel travel reaches 500 mm without a valid phase\nchange, if range remains unavailable for 0.12 s, or if a turn fails\nto reach π/2 within 5 s. Those limits are fault stops; normal approach and turn\nend from range and heading measurements. `robot.stop()` in `finally` covers\nnormal completion and Python exceptions. `Robot.step()` already schedules\nsamples; do not add `sleep()` to the loop. This virtual run does not establish\nphysical stopping distance or sensor calibration.\n\nContinue to **Tutorial 5: Physical XRP deployment** after you can connect a\nvisible path, phase transition, and plotted signal to the source measurements.\n",Zi='# Tutorial 5: Physical XRP deployment\n\nRun one project first on the Virtual XRP and then on a physical XRP. The first\npart collects stationary sensor records for 1 s. The second part requests a short,\nlow-speed straight motion and confirms that wheel position changes. This tests\nproject transfer, execution, telemetry, sensors, motors, encoders, and stopping\nwithout solving a course challenge.\n\nThe supplied project is immediately runnable. Rehearse it on the Virtual XRP\nbefore editing `student_work.py` or selecting the physical target. Near the top\nof `main.py`, `ENABLE_SHORT_MOTION = False` selects stationary measurements only.\nSet this constant to `True` before Run to add the short motion check. This is a\nsaved program setting: every Run includes motion while it remains `True`.\nRestore `False` afterward and before changing targets.\n\n## Walkthrough: summarize a sequence of robot states\n\nRead:\n\n```python\ndef preflight_report(states: object) -> dict:\n```\n\n`states` is a nonempty list or tuple of `RobotState` records. Use one loop to\nreturn a dictionary containing:\n\n- `"sample_count"`: number of states;\n- `"elapsed_time_s"`: sum of `state.measurements.dt_s`;\n- `"maximum_abs_wheel_position_mm"`: largest absolute left or right wheel\n  position;\n- `"usable_range_count"`: number of control states with range other than `None`,\n  including retained readings; this is not the number of ultrasound attempts;\n- `"nearest_range_mm"`: smallest available range, or `None` if no range is\n  available; and\n- `"button_was_pressed"`: `True` if any state reports a pressed USER button.\n\nRaise `ValueError` for an empty collection. Initialize named accumulators before\nthe loop. Check `range_mm is not None` before comparing distances.\n\nEach **Run** checks every report field before interacting with either XRP, so\none incorrect edit does not hide the others and an invalid report prevents\nmotion.\n\n## Rehearse on the Virtual XRP\n\n1. Select **Virtual XRP**, open Monitor, and select **Compile**.\n2. Leave `ENABLE_SHORT_MOTION = False` in `main.py` and select **Run**. The program collects samples\n   with `STOP_COMMAND`, prints the stationary report, and exits without motion.\n3. In `main.py`, change the setting to `ENABLE_SHORT_MOTION = True`, select\n   **Reset**, and select **Run** again. After the\n   stationary report, the program requests 60 mm/s for 0.5 s of measured\n   sample time, then stops. The final sample can exceed this limit by one\n   sample interval.\n4. Press and release the virtual USER button during the stopped portion if you\n   want to verify that field.\n5. Confirm the stationary report and `motion_wheel_travel_mm` in **Program\n   output**. Confirm a short straight path and final zero command in Monitor.\n6. Restore `ENABLE_SHORT_MOTION = False` in `main.py`. Run once more and confirm\n   the stationary report without a motion result before changing targets.\n\n## Run on a physical XRP\n\n1. For an uncommissioned XRP, use **Robot Setup**: switch its power off,\n   connect USB-C, then switch it on. For an already configured XRP, use\n   **Wi-Fi setup → Test Wi-Fi**. The computer and robot normally use class Wi-Fi.\n2. Keep this project open and select **Physical XRP**. The computer and XRP must\n   use the network selected during setup.\n3. Open Monitor, confirm that the physical XRP is connected, and check that\n   `main.py` contains `ENABLE_SHORT_MOTION = False`. Select **Run** once to\n   collect only the stationary report.\n4. Place the robot where a short straight motion is possible. In `main.py`, set\n   `ENABLE_SHORT_MOTION = True`, then select **Run**.\n5. Confirm changing encoder and wheel-position values, positive\n   `motion_wheel_travel_mm`, telemetry in Monitor, and a final zero command.\n6. Restore `ENABLE_SHORT_MOTION = False` in `main.py` after the test. A later\n   repetition does not require another setup operation; set the constant to\n   `True` only when you intend another motion run.\n\nIf connection fails, use the current System log message. A Virtual XRP pass\nchecks the Python project; it does not verify the physical network or hardware.\n\n## Trace `main.py`\n\n1. `run_preflight()` runs the report checks. A failed check ends the program\n   before robot construction.\n2. `make_robot(ROBOT_CONFIG)` assembles the supplied sensor, wheel-control,\n   drive, and odometry components. `sample_period_ms=20` schedules 50 Hz.\n3. `collect_stationary_samples(robot)` starts from the selected world\'s pose,\n   saves the first state, and calls `robot.step(STOP_COMMAND, read_range=True)`\n   until 1 s has elapsed. It stops in `finally` and returns the saved states.\n4. `preflight_report(states)` reads that collection and returns six named\n   results. `run_preflight()` prints each result.\n5. When `ENABLE_SHORT_MOTION` is `True`, `run_short_motion(robot)` starts a\n   fresh measurement sequence, requests `MotionCommand(60.0, 0.0)` for 0.5 s,\n   and stops in `finally`. The program subtracts starting wheel position\n   from final wheel position to report this motion\'s travel.\n\nBoth durations use sample timestamps. Changing the control period changes\nhow many states are collected, while retaining the 1 s and 0.5 s limits.\n\n## Why the loop contains no delay\n\n`Robot.step(...)` calculates and applies the wheel commands, waits until\nthe next scheduled sample, reads sensors, updates state, and publishes telemetry. **Do not add\n`sleep()` or `sleep_ms()` inside the loop.** An extra delay slows feedback and changes the time between motion commands.\nThe measurement timestamps still record the actual elapsed interval.\n\nAfter both runs complete, you have used the same program structure required by\nthe course challenges.\n',Qi=`{
  "default_world": "circle-arena",
  "worlds": [
    {
      "id": "circle-arena",
      "label": "Course arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": 0,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": []
    }
  ]
}
`,$i=`{
  "default_world": "open-field",
  "worlds": [
    {
      "id": "open-field",
      "label": "Open arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": 0,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -120,
          "minimum_y_mm": -120,
          "maximum_x_mm": 120,
          "maximum_y_mm": 120,
          "label": "Start"
        }
      ]
    }
  ]
}
`,ea=`{
  "default_world": "two-obstacles",
  "worlds": [
    {
      "id": "two-obstacles",
      "label": "Two obstacles",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -700,
        "y_mm": -350,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 500,
          "minimum_y_mm": -550,
          "maximum_x_mm": 550,
          "maximum_y_mm": 320,
          "label": "First obstacle"
        },
        {
          "type": "wall",
          "minimum_x_mm": -200,
          "minimum_y_mm": 500,
          "maximum_x_mm": 750,
          "maximum_y_mm": 570,
          "label": "Second obstacle"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -780,
          "minimum_y_mm": -430,
          "maximum_x_mm": -620,
          "maximum_y_mm": -270,
          "label": "Start"
        }
      ]
    }
  ]
}
`,ta=`{
  "default_world": "snake-course",
  "worlds": [
    {
      "id": "snake-course",
      "label": "Random-snake course",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": -800, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -860,
          "minimum_y_mm": -60,
          "maximum_x_mm": -740,
          "maximum_y_mm": 60,
          "label": "Start"
        },
        {
          "type": "finish_box",
          "minimum_x_mm": -540,
          "minimum_y_mm": -80,
          "maximum_x_mm": -260,
          "maximum_y_mm": 180,
          "label": "Expected finish"
        }
      ]
    }
  ]
}
`,na=`{
  "default_world": "roomba-room",
  "worlds": [
    {
      "id": "roomba-room",
      "label": "Roomba room",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -850,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": -100,
          "minimum_y_mm": -609.6,
          "maximum_x_mm": -50,
          "maximum_y_mm": 609.6,
          "label": "Divider"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -910,
          "minimum_y_mm": -60,
          "maximum_x_mm": -790,
          "maximum_y_mm": 60,
          "label": "Start"
        }
      ]
    },
    {
      "id": "arena",
      "label": "Arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -850,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -910,
          "minimum_y_mm": -60,
          "maximum_x_mm": -790,
          "maximum_y_mm": 60,
          "label": "Start"
        }
      ]
    }
  ]
}
`,ra=`{
  "food": {
    "per_square_meter": 13.5,
    "maximum": 216,
    "edge_margin_mm": 220,
    "jitter_x_fraction": 0.32,
    "jitter_y_fraction": 0.27,
    "virtual_seed": 240924,
    "physical_seed": 240925
  },
  "body": {
    "tail_diameter_mm": 50,
    "head_diameter_mm": 55,
    "initial_tail_mm": 250,
    "sample_spacing_mm": 65,
    "maximum_tail_points": 1024,
    "neck_clearance_mm": 150,
    "wall_margin_mm": 100,
    "obstacle_stop_mm": 220,
    "pellet_radius_mm": 15
  },
  "controls": {
    "speed_mm_s": { "default": 500, "minimum": 60, "maximum": 700, "step": 20 },
    "growth_mm": { "default": 67, "minimum": 20, "maximum": 300, "step": 1 }
  },
  "navigation": {
    "approach_fraction": 0.8,
    "slowdown_distance_mm": 80,
    "turn_rate_rad_s": 1.6,
    "position_tolerance_mm": 18,
    "heading_tolerance_rad": 0.08,
    "realign_heading_rad": 0.25
  },
  "robot": {
    "left_start_command": 0.12,
    "right_start_command": 0.13,
    "left_speed_command_gain": 0.0031,
    "right_speed_command_gain": 0.0031,
    "wheel_speed_kp": 0.001,
    "max_drive_command": 1.0
  }
}
`,ia=`{
  "default_world": "snake-virtual",
  "worlds": [
    {
      "id": "snake-virtual",
      "label": "SnakeGame \\u00b7 virtual arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1200,
        "y_mm": -260,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1305,
          "minimum_y_mm": -365,
          "maximum_x_mm": -1095,
          "maximum_y_mm": -155,
          "label": "Start"
        }
      ]
    },
    {
      "id": "snake-physical",
      "label": "SnakeGame \\u00b7 physical field",
      "bounds": {
        "minimum_x_mm": -3048,
        "minimum_y_mm": -1219.2,
        "maximum_x_mm": 3048,
        "maximum_y_mm": 1219.2
      },
      "initial_pose": {
        "x_mm": -2650,
        "y_mm": -650,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -2755,
          "minimum_y_mm": -755,
          "maximum_x_mm": -2545,
          "maximum_y_mm": -545,
          "label": "Start"
        }
      ]
    },
    {
      "id": "snake-crossing",
      "label": "SnakeGame \\u00b7 crossing test",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -300,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -405,
          "minimum_y_mm": -105,
          "maximum_x_mm": -195,
          "maximum_y_mm": 105,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "food_01",
          "x_mm": 0,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "food_02",
          "x_mm": 0,
          "y_mm": 200
        },
        {
          "type": "waypoint",
          "name": "food_03",
          "x_mm": -300,
          "y_mm": 200
        },
        {
          "type": "waypoint",
          "name": "food_04",
          "x_mm": -300,
          "y_mm": -100
        }
      ]
    }
  ]
}
`,aa=`{
  "default_world": "open-field",
  "worlds": [
    {
      "id": "open-field",
      "label": "Arena",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": 0,
        "y_mm": -230,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -120,
          "minimum_y_mm": -350,
          "maximum_x_mm": 120,
          "maximum_y_mm": -110,
          "label": "Start"
        }
      ]
    },
    {
      "id": "obstacle-ahead",
      "label": "Obstacle ahead",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": 0,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [
        {
          "type": "block",
          "minimum_x_mm": 1000,
          "minimum_y_mm": -250,
          "maximum_x_mm": 1100,
          "maximum_y_mm": 250,
          "label": "Test obstacle"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -120,
          "minimum_y_mm": -120,
          "maximum_x_mm": 120,
          "maximum_y_mm": 120,
          "label": "Start"
        }
      ]
    },
    {
      "id": "open-space",
      "label": "Open space",
      "bounds": {
        "minimum_x_mm": -10000,
        "minimum_y_mm": -10000,
        "maximum_x_mm": 10000,
        "maximum_y_mm": 10000
      },
      "initial_pose": {
        "x_mm": 0,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -120,
          "minimum_y_mm": -120,
          "maximum_x_mm": 120,
          "maximum_y_mm": 120,
          "label": "Start"
        }
      ]
    }
  ]
}
`,oa=`{
  "default_world": "ucsb-logo",
  "worlds": [
    {
      "id": "ucsb-logo",
      "label": "UCSB waypoint logo",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": {
        "x_mm": -1200,
        "y_mm": 300,
        "heading_rad": -1.5707963267948966
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -1260,
          "minimum_y_mm": 240,
          "maximum_x_mm": -1140,
          "maximum_y_mm": 360,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "u_start",
          "x_mm": -1200,
          "y_mm": 300,
          "label": "U"
        },
        {
          "type": "waypoint",
          "name": "u_left_bottom",
          "x_mm": -1200,
          "y_mm": -220
        },
        {
          "type": "waypoint",
          "name": "u_curve_left",
          "x_mm": -1130,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "u_curve_right",
          "x_mm": -970,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "u_right_bottom",
          "x_mm": -900,
          "y_mm": -220
        },
        {
          "type": "waypoint",
          "name": "u_end",
          "x_mm": -900,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "c_start",
          "x_mm": -250,
          "y_mm": 300,
          "label": "C"
        },
        {
          "type": "waypoint",
          "name": "c_top_left",
          "x_mm": -650,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "c_bottom_left",
          "x_mm": -650,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "c_end",
          "x_mm": -250,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "s_start",
          "x_mm": 0,
          "y_mm": -300,
          "label": "S"
        },
        {
          "type": "waypoint",
          "name": "s_bottom_right",
          "x_mm": 400,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "s_middle_right",
          "x_mm": 400,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "s_middle_left",
          "x_mm": 0,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "s_top_left",
          "x_mm": 0,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "s_end",
          "x_mm": 400,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "b_start",
          "x_mm": 650,
          "y_mm": 300,
          "label": "B"
        },
        {
          "type": "waypoint",
          "name": "b_stem_bottom",
          "x_mm": 650,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "b_bottom_edge",
          "x_mm": 1000,
          "y_mm": -300
        },
        {
          "type": "waypoint",
          "name": "b_lower_round_1",
          "x_mm": 1120,
          "y_mm": -220
        },
        {
          "type": "waypoint",
          "name": "b_lower_round_2",
          "x_mm": 1120,
          "y_mm": -80
        },
        {
          "type": "waypoint",
          "name": "b_middle_right",
          "x_mm": 1000,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "b_middle_left",
          "x_mm": 650,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "b_middle_out",
          "x_mm": 1000,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "b_upper_round_1",
          "x_mm": 1120,
          "y_mm": 80
        },
        {
          "type": "waypoint",
          "name": "b_upper_round_2",
          "x_mm": 1120,
          "y_mm": 220
        },
        {
          "type": "waypoint",
          "name": "b_top_right",
          "x_mm": 1000,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "b_end",
          "x_mm": 650,
          "y_mm": 300,
          "heading_rad": 3.141592653589793
        }
      ]
    }
  ]
}
`,sa=`{
  "default_world": "straight-run",
  "worlds": [
    {
      "id": "straight-run",
      "label": "Straight run",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -150,
          "x2_mm": 0,
          "y2_mm": 150,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "finish",
          "x_mm": 1000,
          "y_mm": 0,
          "label": "Finish"
        }
      ]
    }
  ]
}
`,ca=`{
  "default_world": "python-workbench",
  "worlds": [
    {
      "id": "python-workbench",
      "label": "Python workbench",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": []
    }
  ]
}
`,la=`{
  "default_world": "course-arena-drawing",
  "worlds": [
    {
      "id": "course-arena-drawing",
      "label": "Course arena · drawing",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -70,
          "minimum_y_mm": -70,
          "maximum_x_mm": 70,
          "maximum_y_mm": 70,
          "label": "Start"
        }
      ]
    }
  ]
}
`,ua=`{
  "default_world": "course-arena-straight",
  "worlds": [
    {
      "id": "course-arena-straight",
      "label": "Course arena · straight practice",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -180,
          "x2_mm": 0,
          "y2_mm": 180,
          "label": "Start"
        }
      ]
    }
  ]
}
`,da=`{
  "default_world": "course-arena-behavior",
  "worlds": [
    {
      "id": "course-arena-behavior",
      "label": "Course arena · behavior",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "label": "Range target",
          "minimum_x_mm": 650,
          "minimum_y_mm": -350,
          "maximum_x_mm": 700,
          "maximum_y_mm": 350
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -80,
          "minimum_y_mm": -80,
          "maximum_x_mm": 80,
          "maximum_y_mm": 80,
          "label": "Start"
        }
      ]
    }
  ]
}
`,fa=`{
  "default_world": "preflight-bench",
  "worlds": [
    {
      "id": "preflight-bench",
      "label": "Stationary preflight",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "label": "Range target",
          "minimum_x_mm": 600,
          "minimum_y_mm": -250,
          "maximum_x_mm": 650,
          "maximum_y_mm": 250
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -80,
          "minimum_y_mm": -80,
          "maximum_x_mm": 80,
          "maximum_y_mm": 80,
          "label": "Stationary XRP"
        }
      ]
    }
  ]
}
`,pa=JSON.parse(`[{"id":"demo_obstacle_turn","group":"demonstrations","kind":"demo","source":"templates/demo_obstacle_turn","label":"Demo · Obstacle, Left, Obstacle","short_label":"Obstacle, left, obstacle","summary":"Drive to a nearby obstacle, turn left 90 degrees, then drive to the next obstacle.","entrypoint":"main.py","published":true},{"id":"demo_circle","group":"demonstrations","kind":"demo","source":"templates/demo_circle","label":"Demo · Circle","short_label":"Circle","summary":"Drive one circle of a chosen diameter using differential-drive kinematics.","entrypoint":"main.py","published":true},{"id":"demo_spiral","group":"demonstrations","kind":"demo","source":"templates/demo_spiral","label":"Demo · Expanding Spiral","short_label":"Expanding spiral","summary":"Drive an expanding spiral and stop when the forward range sensor detects a nearby obstacle.","entrypoint":"main.py","published":true},{"id":"demo_random_snake","group":"archived","kind":"demo","source":"templates/demo_random_snake","label":"Demo · Random Snake","short_label":"Random snake","summary":"Drive random-length straight segments separated by reproducible 90-degree left or right turns.","entrypoint":"main.py","published":true},{"id":"demo_snake_game","group":"demonstrations","kind":"demo","source":"templates/demo_snake_game","label":"Demo · SnakeGame","short_label":"SnakeGame","summary":"Drive through food waypoints; each pellet lengthens a finite tail, and crossing that tail ends the game.","entrypoint":"main.py","published":true},{"id":"demo_roomba","group":"demonstrations","kind":"demo","source":"templates/demo_roomba","label":"Demo · Roomba-Style Avoidance","short_label":"Roomba-style avoidance","summary":"Drive until ultrasound detects a nearby obstacle, reverse briefly, turn randomly, and repeat.","entrypoint":"main.py","published":true},{"id":"demo_manual_drive","group":"demonstrations","kind":"demo","source":"templates/demo_manual_drive","label":"Demo · Manual Driving","short_label":"Manual driving","summary":"Steer the XRP with bounded speed and turn sliders in Monitor; Run starts stopped.","entrypoint":"main.py","published":true},{"id":"demo_ucsb_logo","group":"demonstrations","kind":"demo","source":"templates/demo_ucsb_logo","label":"Demo · Draw UCSB","short_label":"Draw UCSB","summary":"Use ordered waypoints to trace block-letter UCSB across the course arena.","entrypoint":"main.py","published":true},{"id":"micropython_tutorial","group":"tutorials","kind":"tutorial","source":"templates/tutorial_1_python_essentials","label":"Tutorial 1 · Python Essentials","short_label":"Tutorial 1 · Python essentials","summary":"Practice Python values, typed functions, conditions, loops, and collections with immediate examples.","entrypoint":"main.py","published":true},{"id":"tutorial_virtual_drawing","group":"tutorials","kind":"tutorial","source":"templates/tutorial_2_virtual_drawing","label":"Tutorial 2 · Virtual XRP Drawing","short_label":"Tutorial 2 · Virtual XRP drawing","summary":"Use modules, records, classes, inheritance, and loops to draw a path with the Virtual XRP.","entrypoint":"main.py","published":true},{"id":"tutorial_robot_programs","group":"tutorials","kind":"tutorial","source":"templates/tutorial_3_robot_programs","label":"Tutorial 3 · Sampled Robot Programs","short_label":"Tutorial 3 · Sampled robot programs","summary":"Read RobotState records and write a finite sampled robot program without an added delay.","entrypoint":"main.py","published":true},{"id":"tutorial_behavior_telemetry","group":"tutorials","kind":"tutorial","source":"templates/tutorial_4_behavior_telemetry","label":"Tutorial 4 · Behavior, Controls, and Telemetry","short_label":"Tutorial 4 · Behavior, controls, and telemetry","summary":"Combine a measured finite-state behavior with live controls, watch values, and plot signals.","entrypoint":"main.py","published":true},{"id":"tutorial_physical_preflight","group":"tutorials","kind":"tutorial","source":"templates/tutorial_5_physical_preflight","label":"Tutorial 5 · Physical XRP Deployment","short_label":"Tutorial 5 · Physical XRP deployment","summary":"Rehearse virtually, then verify sensors, motors, encoders, telemetry, and stopping on a physical XRP.","entrypoint":"main.py","published":true},{"id":"new_challenge_1_robot_curling","group":"newest-challenges","kind":"challenge","source":"starters/challenge_1_robot_curling","label":"1 · Robot Curling","short_label":"1 · Robot Curling","summary":"Travel 2286 mm along the arena and stop close to the target as quickly as possible. Develop wheel measurements and a distance-based stopping rule.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"}],"published":true},{"id":"new_demo_motor_characterization","group":"newest-challenges","kind":"demo","source":"templates/new_demo_motor_characterization","label":"(Challenge 1) Motor Characterization","short_label":"(Challenge 1) Motor Characterization","summary":"Measure separate left/right speed responses to bounded open-loop effort steps.","entrypoint":"main.py","published":true},{"id":"new_challenge_2_1_reflectance","group":"newest-challenges","kind":"demo","source":"starters/challenge_2_1_reflectance","label":"Challenge 2.1: Reflectance","short_label":"Challenge 2.1: Reflectance","summary":"Record left and right floor reflectance on white and black surfaces with zero motor effort. No programming required.","entrypoint":"main.py","published":true},{"id":"new_challenge_2_2_circular_driving","group":"newest-challenges","kind":"challenge","source":"starters/challenge_2_2_circular_driving","label":"Challenge 2.2: Circular Driving","short_label":"Challenge 2.2: Circular Driving","summary":"Implement differential drive and measure constant-speed circles at three diameters in both directions.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"}],"published":true},{"id":"new_challenge_2_arena_line_circuit","group":"newest-challenges","kind":"challenge","source":"starters/challenge_2_arena_line_circuit","label":"Challenge 2.3: Arena Line Circuit","short_label":"Challenge 2.3: Arena Line Circuit","summary":"Use floor sensors to follow the arena line counterclockwise for one lap.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"},{"name":"LineFollower","file":"line_follower.py","selection_flag":"USE_STUDENT_LINE_FOLLOWER"}],"published":true},{"id":"new_challenge_3_waypoint_courier","group":"newest-challenges","kind":"challenge","source":"starters/challenge_3_waypoint_courier","label":"3 · Waypoint Courier","short_label":"3 · Waypoint Courier","summary":"Estimate position from wheel travel and visit the marked waypoints in order.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"},{"name":"Odometry","file":"odometry.py","selection_flag":"USE_STUDENT_ODOMETRY"},{"name":"NavigationController","file":"navigation_controller.py","selection_flag":"USE_STUDENT_NAVIGATION_CONTROLLER"}],"published":true},{"id":"new_challenge_4_mapped_route","group":"newest-challenges","kind":"challenge","source":"starters/challenge_4_mapped_route","label":"4 · Mapped Route","short_label":"4 · Mapped Route","summary":"Find a grid route around mapped obstacles and check its cells before driving.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"},{"name":"Odometry","file":"odometry.py","selection_flag":"USE_STUDENT_ODOMETRY"},{"name":"NavigationController","file":"navigation_controller.py","selection_flag":"USE_STUDENT_NAVIGATION_CONTROLLER"},{"name":"GridPlanner","file":"grid_planner.py","selection_flag":"USE_STUDENT_GRID_PLANNER"}],"published":true},{"id":"new_challenge_5_out_and_back","group":"newest-challenges","kind":"challenge","source":"starters/challenge_5_out_and_back","label":"5 · Out-and-Back","short_label":"5 · Out-and-Back","summary":"Visit outbound waypoints, measure gate range while stopped, and plan a route home.","entrypoint":"main.py","components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"},{"name":"Odometry","file":"odometry.py","selection_flag":"USE_STUDENT_ODOMETRY"},{"name":"NavigationController","file":"navigation_controller.py","selection_flag":"USE_STUDENT_NAVIGATION_CONTROLLER"},{"name":"GridPlanner","file":"grid_planner.py","selection_flag":"USE_STUDENT_GRID_PLANNER"}],"published":true},{"id":"new_demo_odometry_calibration","group":"demonstrations","kind":"demo","source":"templates/new_demo_odometry_calibration","label":"Odometry Calibration","short_label":"Odometry Calibration","summary":"Compare estimated and measured pose through bounded straight, arc, turn and square experiments.","entrypoint":"main.py","published":false,"components":[{"name":"SensorProcessor","file":"sensor_processor.py","selection_flag":"USE_STUDENT_SENSOR_PROCESSOR"},{"name":"DifferentialDrive","file":"differential_drive.py","selection_flag":"USE_STUDENT_DIFFERENTIAL_DRIVE"},{"name":"Odometry","file":"odometry.py","selection_flag":"USE_STUDENT_ODOMETRY"}]},{"id":"new_demo_reflectance_calibration","group":"demonstrations","kind":"demo","source":"templates/new_demo_reflectance_calibration","label":"Reflectance Calibration","short_label":"Reflectance Calibration","summary":"Record two reflectance sensors without motor motion and check floor/tape contrast.","entrypoint":"main.py","published":false},{"id":"new_demo_planning_comparison","group":"demonstrations","kind":"demo","source":"templates/new_demo_planning_comparison","label":"BFS and A* Comparison","short_label":"BFS and A* Comparison","summary":"Compare BFS and heapq A* path cost and expanded cells without starting the robot.","entrypoint":"main.py","published":false},{"id":"complete_new_challenge_1_robot_curling","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_1_robot_curling","label":"Complete 1 · Robot Curling","short_label":"Complete 1 · Robot Curling","summary":"Completed implementation of Robot Curling.","entrypoint":"main.py","solution_stage":1,"published":true},{"id":"complete_new_challenge_2_2_circular_driving","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_2_2_circular_driving","label":"Complete 2.2: Circular Driving","short_label":"Complete 2.2: Circular Driving","summary":"Completed differential-drive circle measurement exercise.","entrypoint":"main.py","solution_stage":2,"published":true},{"id":"complete_new_challenge_2_arena_line_circuit","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_2_arena_line_circuit","label":"Complete 2.3: Arena Line Circuit","short_label":"Complete 2.3: Arena Line Circuit","summary":"Completed implementation of Arena Line Circuit.","entrypoint":"main.py","solution_stage":2,"published":true},{"id":"complete_new_challenge_3_waypoint_courier","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_3_waypoint_courier","label":"Complete 3 · Waypoint Courier","short_label":"Complete 3 · Waypoint Courier","summary":"Completed implementation of Waypoint Courier.","entrypoint":"main.py","solution_stage":3,"published":true},{"id":"complete_new_challenge_4_mapped_route","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_4_mapped_route","label":"Complete 4 · Mapped Route","short_label":"Complete 4 · Mapped Route","summary":"Completed implementation of Mapped Route.","entrypoint":"main.py","solution_stage":4,"published":true},{"id":"complete_new_challenge_5_out_and_back","group":"newest-challenges","kind":"complete-challenge","source":"starters/challenge_5_out_and_back","label":"Complete 5 · Out-and-Back","short_label":"Complete 5 · Out-and-Back","summary":"Completed implementation of Out-and-Back.","entrypoint":"main.py","solution_stage":5,"published":true}]`),ma={...Object.assign({"../../../vendor/current/starters/challenge_1_robot_curling/challenge.py":dn,"../../../vendor/current/starters/challenge_1_robot_curling/component_checks.py":fn,"../../../vendor/current/starters/challenge_1_robot_curling/live_variables.py":pn,"../../../vendor/current/starters/challenge_1_robot_curling/main.py":mn,"../../../vendor/current/starters/challenge_1_robot_curling/motion_timer.py":hn,"../../../vendor/current/starters/challenge_1_robot_curling/robot_setup.py":gn,"../../../vendor/current/starters/challenge_1_robot_curling/sensor_processor.py":_n,"../../../vendor/current/starters/challenge_1_robot_curling/stopping_controller.py":vn,"../../../vendor/current/starters/challenge_2_1_reflectance/main.py":yn,"../../../vendor/current/starters/challenge_2_2_circular_driving/challenge.py":bn,"../../../vendor/current/starters/challenge_2_2_circular_driving/component_checks.py":xn,"../../../vendor/current/starters/challenge_2_2_circular_driving/differential_drive.py":Sn,"../../../vendor/current/starters/challenge_2_2_circular_driving/main.py":Cn,"../../../vendor/current/starters/challenge_2_2_circular_driving/robot_setup.py":wn,"../../../vendor/current/starters/challenge_2_2_circular_driving/sensor_processor.py":Tn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/challenge.py":En,"../../../vendor/current/starters/challenge_2_arena_line_circuit/component_checks.py":Dn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/differential_drive.py":On,"../../../vendor/current/starters/challenge_2_arena_line_circuit/lap_progress.py":kn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/line_follower.py":An,"../../../vendor/current/starters/challenge_2_arena_line_circuit/live_variables.py":jn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/main.py":Mn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/robot_setup.py":Nn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/sensor_processor.py":Pn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/settings.py":Fn,"../../../vendor/current/starters/challenge_2_arena_line_circuit/supplied_settings.py":In,"../../../vendor/current/starters/challenge_3_waypoint_courier/challenge.py":Ln,"../../../vendor/current/starters/challenge_3_waypoint_courier/component_checks.py":Rn,"../../../vendor/current/starters/challenge_3_waypoint_courier/differential_drive.py":zn,"../../../vendor/current/starters/challenge_3_waypoint_courier/live_variables.py":Bn,"../../../vendor/current/starters/challenge_3_waypoint_courier/main.py":Vn,"../../../vendor/current/starters/challenge_3_waypoint_courier/navigation_controller.py":Hn,"../../../vendor/current/starters/challenge_3_waypoint_courier/odometry.py":Un,"../../../vendor/current/starters/challenge_3_waypoint_courier/robot_setup.py":Wn,"../../../vendor/current/starters/challenge_3_waypoint_courier/route_progress.py":Gn,"../../../vendor/current/starters/challenge_3_waypoint_courier/sensor_processor.py":Kn,"../../../vendor/current/starters/challenge_4_mapped_route/challenge.py":qn,"../../../vendor/current/starters/challenge_4_mapped_route/component_checks.py":Jn,"../../../vendor/current/starters/challenge_4_mapped_route/differential_drive.py":Yn,"../../../vendor/current/starters/challenge_4_mapped_route/grid_display.py":Xn,"../../../vendor/current/starters/challenge_4_mapped_route/grid_planner.py":Zn,"../../../vendor/current/starters/challenge_4_mapped_route/live_variables.py":Qn,"../../../vendor/current/starters/challenge_4_mapped_route/main.py":$n,"../../../vendor/current/starters/challenge_4_mapped_route/navigation_controller.py":er,"../../../vendor/current/starters/challenge_4_mapped_route/odometry.py":tr,"../../../vendor/current/starters/challenge_4_mapped_route/robot_setup.py":nr,"../../../vendor/current/starters/challenge_4_mapped_route/route_runner.py":rr,"../../../vendor/current/starters/challenge_4_mapped_route/route_validation.py":ir,"../../../vendor/current/starters/challenge_4_mapped_route/sensor_processor.py":ar,"../../../vendor/current/starters/challenge_5_out_and_back/challenge.py":or,"../../../vendor/current/starters/challenge_5_out_and_back/component_checks.py":sr,"../../../vendor/current/starters/challenge_5_out_and_back/differential_drive.py":cr,"../../../vendor/current/starters/challenge_5_out_and_back/experiment_range_readout.py":lr,"../../../vendor/current/starters/challenge_5_out_and_back/grid_planner.py":ur,"../../../vendor/current/starters/challenge_5_out_and_back/live_variables.py":dr,"../../../vendor/current/starters/challenge_5_out_and_back/main.py":fr,"../../../vendor/current/starters/challenge_5_out_and_back/mission_policy.py":pr,"../../../vendor/current/starters/challenge_5_out_and_back/mission_steps.py":mr,"../../../vendor/current/starters/challenge_5_out_and_back/navigation_controller.py":hr,"../../../vendor/current/starters/challenge_5_out_and_back/odometry.py":gr,"../../../vendor/current/starters/challenge_5_out_and_back/return_route.py":_r,"../../../vendor/current/starters/challenge_5_out_and_back/robot_setup.py":vr,"../../../vendor/current/starters/challenge_5_out_and_back/sensor_processor.py":yr,"../../../vendor/current/starters/challenge_5_out_and_back/stationary_observation.py":br}),...Object.assign({"../../../vendor/current/starters/challenge_1_robot_curling/README.md":xr,"../../../vendor/current/starters/challenge_2_1_reflectance/README.md":Sr,"../../../vendor/current/starters/challenge_2_2_circular_driving/README.md":Cr,"../../../vendor/current/starters/challenge_2_arena_line_circuit/README.md":wr,"../../../vendor/current/starters/challenge_3_waypoint_courier/README.md":Tr,"../../../vendor/current/starters/challenge_4_mapped_route/README.md":Er,"../../../vendor/current/starters/challenge_5_out_and_back/README.md":Dr}),...Object.assign({"../../../vendor/current/starters/challenge_1_robot_curling/world.json":Or,"../../../vendor/current/starters/challenge_2_1_reflectance/world.json":kr,"../../../vendor/current/starters/challenge_2_2_circular_driving/world.json":Ar,"../../../vendor/current/starters/challenge_2_arena_line_circuit/world.json":jr,"../../../vendor/current/starters/challenge_3_waypoint_courier/world.json":Mr,"../../../vendor/current/starters/challenge_4_mapped_route/world.json":Nr,"../../../vendor/current/starters/challenge_5_out_and_back/world.json":Pr})},ha={...Object.assign({"../../../vendor/current/templates/demo_circle/challenge.py":Fr,"../../../vendor/current/templates/demo_circle/main.py":Ir,"../../../vendor/current/templates/demo_circle/robot_setup.py":Lr,"../../../vendor/current/templates/demo_manual_drive/live_variables.py":Rr,"../../../vendor/current/templates/demo_manual_drive/main.py":zr,"../../../vendor/current/templates/demo_manual_drive/robot_setup.py":Br,"../../../vendor/current/templates/demo_obstacle_turn/challenge.py":Vr,"../../../vendor/current/templates/demo_obstacle_turn/live_variables.py":Hr,"../../../vendor/current/templates/demo_obstacle_turn/main.py":Ur,"../../../vendor/current/templates/demo_obstacle_turn/robot_setup.py":Wr,"../../../vendor/current/templates/demo_random_snake/challenge.py":Gr,"../../../vendor/current/templates/demo_random_snake/live_variables.py":Kr,"../../../vendor/current/templates/demo_random_snake/main.py":qr,"../../../vendor/current/templates/demo_random_snake/robot_setup.py":Jr,"../../../vendor/current/templates/demo_roomba/challenge.py":Yr,"../../../vendor/current/templates/demo_roomba/live_variables.py":Xr,"../../../vendor/current/templates/demo_roomba/main.py":Zr,"../../../vendor/current/templates/demo_roomba/robot_setup.py":Qr,"../../../vendor/current/templates/demo_snake_game/challenge.py":$r,"../../../vendor/current/templates/demo_snake_game/live_variables.py":ei,"../../../vendor/current/templates/demo_snake_game/main.py":ti,"../../../vendor/current/templates/demo_snake_game/robot_setup.py":ni,"../../../vendor/current/templates/demo_snake_game/snake_config.py":ri,"../../../vendor/current/templates/demo_snake_game/snake_food.py":ii,"../../../vendor/current/templates/demo_snake_game/snake_game.py":ai,"../../../vendor/current/templates/demo_spiral/challenge.py":oi,"../../../vendor/current/templates/demo_spiral/live_variables.py":si,"../../../vendor/current/templates/demo_spiral/main.py":ci,"../../../vendor/current/templates/demo_spiral/robot_setup.py":li,"../../../vendor/current/templates/demo_ucsb_logo/challenge.py":ui,"../../../vendor/current/templates/demo_ucsb_logo/live_variables.py":di,"../../../vendor/current/templates/demo_ucsb_logo/main.py":fi,"../../../vendor/current/templates/demo_ucsb_logo/robot_setup.py":pi,"../../../vendor/current/templates/new_demo_motor_characterization/experiment.py":mi,"../../../vendor/current/templates/new_demo_motor_characterization/live_variables.py":hi,"../../../vendor/current/templates/new_demo_motor_characterization/main.py":gi,"../../../vendor/current/templates/new_demo_motor_characterization/robot_setup.py":_i,"../../../vendor/current/templates/tutorial_1_python_essentials/exercise_checks.py":vi,"../../../vendor/current/templates/tutorial_1_python_essentials/main.py":yi,"../../../vendor/current/templates/tutorial_1_python_essentials/student_work.py":bi,"../../../vendor/current/templates/tutorial_2_virtual_drawing/exercise_checks.py":xi,"../../../vendor/current/templates/tutorial_2_virtual_drawing/main.py":Si,"../../../vendor/current/templates/tutorial_2_virtual_drawing/robot_setup.py":Ci,"../../../vendor/current/templates/tutorial_2_virtual_drawing/student_work.py":wi,"../../../vendor/current/templates/tutorial_3_robot_programs/exercise_checks.py":Ti,"../../../vendor/current/templates/tutorial_3_robot_programs/main.py":Ei,"../../../vendor/current/templates/tutorial_3_robot_programs/robot_setup.py":Di,"../../../vendor/current/templates/tutorial_3_robot_programs/student_work.py":Oi,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/exercise_checks.py":ki,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/live_variables.py":Ai,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/main.py":ji,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/robot_setup.py":Mi,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/student_work.py":Ni,"../../../vendor/current/templates/tutorial_5_physical_preflight/exercise_checks.py":Pi,"../../../vendor/current/templates/tutorial_5_physical_preflight/main.py":Fi,"../../../vendor/current/templates/tutorial_5_physical_preflight/robot_setup.py":Ii,"../../../vendor/current/templates/tutorial_5_physical_preflight/student_work.py":Li}),...Object.assign({"../../../vendor/current/templates/demo_circle/README.md":Ri,"../../../vendor/current/templates/demo_manual_drive/README.md":zi,"../../../vendor/current/templates/demo_obstacle_turn/README.md":Bi,"../../../vendor/current/templates/demo_random_snake/README.md":Vi,"../../../vendor/current/templates/demo_roomba/README.md":Hi,"../../../vendor/current/templates/demo_snake_game/README.md":Ui,"../../../vendor/current/templates/demo_spiral/README.md":Wi,"../../../vendor/current/templates/demo_ucsb_logo/README.md":Gi,"../../../vendor/current/templates/new_demo_motor_characterization/README.md":Ki,"../../../vendor/current/templates/tutorial_1_python_essentials/README.md":qi,"../../../vendor/current/templates/tutorial_2_virtual_drawing/README.md":Ji,"../../../vendor/current/templates/tutorial_3_robot_programs/README.md":Yi,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/README.md":Xi,"../../../vendor/current/templates/tutorial_5_physical_preflight/README.md":Zi}),...Object.assign({"../../../vendor/current/templates/demo_circle/world.json":Qi,"../../../vendor/current/templates/demo_manual_drive/world.json":$i,"../../../vendor/current/templates/demo_obstacle_turn/world.json":ea,"../../../vendor/current/templates/demo_random_snake/world.json":ta,"../../../vendor/current/templates/demo_roomba/world.json":na,"../../../vendor/current/templates/demo_snake_game/snake_config.json":ra,"../../../vendor/current/templates/demo_snake_game/world.json":ia,"../../../vendor/current/templates/demo_spiral/world.json":aa,"../../../vendor/current/templates/demo_ucsb_logo/world.json":oa,"../../../vendor/current/templates/new_demo_motor_characterization/world.json":sa,"../../../vendor/current/templates/tutorial_1_python_essentials/world.json":ca,"../../../vendor/current/templates/tutorial_2_virtual_drawing/world.json":la,"../../../vendor/current/templates/tutorial_3_robot_programs/world.json":ua,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/world.json":da,"../../../vendor/current/templates/tutorial_5_physical_preflight/world.json":fa})},ga={},J=pa.filter(e=>e.published);function _a(e,t){let n=e.solution_stage;if(!n||n<1||n>5)throw Error(`${e.id} has no current challenge solution`);let r={...t};for(let[e,t]of Object.entries(ga).sort()){let i=e.match(/\/code\/(\d+)[^/]*\/([^/]+)$/);if(!i||Number(i[1])>n)continue;let a=i[2];a in r&&(r[a]=t)}return r[`robot_setup.py`]=r[`robot_setup.py`].replace(/^(USE_STUDENT_[A-Z_]+ = )False$/gm,`$1True`),n===4&&(r[`challenge.py`]=r[`challenge.py`].replace(`EXECUTE_ROUTE = False`,`EXECUTE_ROUTE = True`)),r}function Y(e){let t=`/${e.source}/`,n=e.source.startsWith(`starters/`)?ma:ha,r=Object.fromEntries(Object.entries(n).filter(([e])=>e.includes(t)).map(([e,n])=>[e.split(t)[1],n]));if(e.kind===`complete-challenge`&&Object.keys(ga).length&&(r=_a(e,r)),!(e.entrypoint in r)||Object.keys(r).length<2)throw Error(`${e.id} must contain a complete project`);return Object.freeze({name:e.short_label,entrypoint:e.entrypoint,files:Object.freeze(r)})}var va=Object.freeze(J.filter(e=>e.kind===`challenge`).map(e=>Object.freeze({id:e.id,label:e.label,shortLabel:e.short_label,summary:e.summary,project:Y(e)}))),X=[...J.map(e=>Object.freeze({id:e.id,kind:e.kind,group:e.group??`archived`,label:e.label,shortLabel:e.short_label,summary:e.summary,components:Object.freeze((e.components??[]).map(e=>Object.freeze({name:e.name,file:e.file,selectionFlag:e.selection_flag}))),project:Y(e)}))];function ya(e){ga=e??{};for(let e of J.filter(e=>e.kind===`complete-challenge`)){let t=X.findIndex(t=>t.id===e.id),n=X[t];X[t]=Object.freeze({...n,project:Y(e)})}}va[0].project;var ba=`demo_spiral`;function Z(e){let t=X.find(t=>t.id===e);if(!t)throw Error(`Unknown course project template '${e}'`);return t}function xa(e,t){if(!/^[A-Z][A-Z0-9_]*$/.test(t))throw Error(`Invalid component selection flag '${t}'`);let n=RegExp(`^(${t}\\s*=\\s*)False(\\s*)$`,`m`);if(!e.match(n))throw Error(`The next challenge does not declare ${t}`);return e.replace(n,`$1True$2`)}function Sa(e,t){if(!/^[A-Z][A-Z0-9_]*$/.test(t))throw Error(`Invalid component selection flag '${t}'`);let n=RegExp(`^${t}\\s*=\\s*(True|False)\\s*$`,`m`),r=e.match(n);return r?r[1]===`True`:null}var Ca=new Set([`README.md`,`main.py`,`challenge.py`,`world.json`,`component_checks.py`]),wa=new Set(J.flatMap(e=>e.components??[]).map(e=>e.file).concat(`sensor_model.py`));function Q(e,t,n){let r=RegExp(`^${t}\\s*=\\s*${n}\\(`,`m`).exec(e);if(!r)return null;let i=e.indexOf(`(`,r.index),a=0,o=``,s=!1,c=!1;for(let t=i;t<e.length;t+=1){let n=e[t];if(s){n===`
`&&(s=!1);continue}if(o){c?c=!1:n===`\\`?c=!0:n===o&&(o=``);continue}if(n===`#`){s=!0;continue}if(n===`'`||n===`"`){o=n;continue}if(n===`(`&&(a+=1),n===`)`&&(--a,a===0))return e.slice(r.index,t+1)}throw Error(`${t} has an unterminated ${n}(...) value`)}function $(e){let t=e.slice(e.indexOf(`(`)+1,-1),n=[],r=``,i=0,a=``,o=!1,s=!1;for(let e of t){if(o){e===`
`&&(o=!1,r+=`
`);continue}if(a){r+=e,s?s=!1:e===`\\`?s=!0:e===a&&(a=``);continue}if(e===`#`){o=!0;continue}(e===`'`||e===`"`)&&(a=e),`([{`.includes(e)&&(i+=1),`)]}`.includes(e)&&--i,e===`,`&&i===0?(n.push(r),r=``):r+=e}return r.trim()&&n.push(r),new Map(n.filter(e=>e.trim()).map(e=>{let t=/^\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+?)\s*$/.exec(e);if(!t)throw Error(`Calibration transfer requires named constructor arguments`);return[t[1],t[2]]}))}function Ta(e,t,n){return`${e} = ${t}(\n${[...n].map(([e,t])=>`    ${e}=${t},`).join(`
`)}\n)`}var Ea=new Map([[`wheel_diameter_mm`,`WHEEL_DIAMETER_MM`],[`encoder_counts_per_revolution`,`ENCODER_COUNTS_PER_REVOLUTION`],[`track_width_mm`,`TRACK_WIDTH_MM`],[`left_start_command`,`LEFT_START_COMMAND`],[`right_start_command`,`RIGHT_START_COMMAND`],[`left_speed_command_gain`,`LEFT_SPEED_COMMAND_GAIN`],[`right_speed_command_gain`,`RIGHT_SPEED_COMMAND_GAIN`]]);function Da(e,t){let n=new Map;for(let e of[`settings.py`,`supplied_settings.py`,`robot_config.py`,`robot_setup.py`])for(let r of(t[e]??``).matchAll(/^([A-Za-z_]\w*)[\t ]*=[\t ]*([^\r\n#]+)[\t ]*(?:#.*)?$/gm))n.set(r[1],r[2].trim());let r=new Set([`abs`,`float`,`int`,`max`,`min`,`pow`,`round`,`True`,`False`,`None`]),i=(e,t,a)=>e.replace(/\b[A-Za-z_]\w*\b/g,e=>{if(r.has(e))return e;let o=n.get(e);if(o===void 0||a.includes(e))throw Error(`Cannot transfer ${t}: ${e} is not a standalone numerical constant. Enter its numerical value in the source calibration before creating the next challenge.`);if(o.endsWith(`\\`)||[...`([{`].some((e,t)=>o.split(e).length!==o.split(`)]}`[t]).length))throw Error(`Cannot transfer ${t}: write ${e} as a single-line numerical expression before creating the next challenge.`);let s=i(o,t,[...a,e]);return/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s)?s:`(${s})`});return new Map([...e].map(([e,t])=>[e,i(t,e,[])]))}function Oa(e,t){let n=e[`robot_setup.py`]??e[`robot_config.py`],r=t[`robot_setup.py`];if(n===void 0||r===void 0)return[];let i=e=>{for(let t of[`PHYSICAL_ROBOT_CONFIG`,`ROBOT_CONFIG`]){let n=Q(e,t,`RobotConfig`);if(n!==null)return{variable:t,block:n}}return null},a=e=>{let t=e[`supplied_settings.py`];return t===void 0?null:Q(t,`PHYSICAL_ROBOT_SETTINGS`,`dict`)},o=i(n),s=i(r),c=a(e),l=a(t),u=Q(n,`ROBOT_DIMENSIONS`,`dict`);if(o===null&&c===null||s===null&&l===null)return[];let d;if(u!==null&&c!==null)d=new Map([...$(u),...$(c)]);else if(o!==null)d=$(o.block);else throw Error(`Challenge 2 calibration has no ROBOT_DIMENSIONS value`);if(d=Da(d,e),l!==null){let e=Q(r,`ROBOT_DIMENSIONS`,`dict`);if(e===null)throw Error(`Challenge 2 calibration has no ROBOT_DIMENSIONS value`);let n=$(e),i=$(l),a=t[`settings.py`],o=(e,t)=>{let n=Ea.get(e);if(a===void 0||n===void 0)return!1;let r=RegExp(`^(${n}[\\t ]*=[\\t ]*)[^\\r\\n#]+`,`m`);return r.test(a)?(a=a.replace(r,(e,n)=>`${n}${t} `),!0):!1};for(let e of n.keys()){let t=d.get(e);t!==void 0&&!o(e,t)&&n.set(e,t),d.delete(e)}for(let[e,t]of d)o(e,t)||i.set(e,t);return t[`robot_setup.py`]=r.replace(e,Ta(`ROBOT_DIMENSIONS`,`dict`,n)),t[`supplied_settings.py`]=t[`supplied_settings.py`].replace(l,Ta(`PHYSICAL_ROBOT_SETTINGS`,`dict`,i)),a!==void 0&&(t[`settings.py`]=a),[`robot_setup.py`,`supplied_settings.py`,...a===void 0?[]:[`settings.py`]]}let f=Ta(s.variable===`ROBOT_CONFIG`?`PHYSICAL_ROBOT_CONFIG`:s.variable,`RobotConfig`,d);return t[`robot_setup.py`]=r.replace(s.block,s.variable===`ROBOT_CONFIG`?[`from sys import platform as _calibration_platform`,f,s.block.replace(/^ROBOT_CONFIG/,`VIRTUAL_ROBOT_CONFIG`),`ROBOT_CONFIG = PHYSICAL_ROBOT_CONFIG if _calibration_platform == "rp2" else VIRTUAL_ROBOT_CONFIG`].join(`
`):f),[`robot_setup.py`]}function ka(e,t,n){let r=Z(e),i=Z(t);if(r.components.length===0||i.components.length===0)throw Error(`Project transitions require declared student components in both projects`);if(e===t)throw Error(`Choose a different challenge project`);let a={...i.project.files},o=new Set,s=new Set,c=new Set,l=new Set,u=new Set,d=a[`robot_setup.py`],f=n.files[`robot_setup.py`]??n.files[`course_setup.py`];if(d===void 0)throw Error(`${i.label} does not contain robot_setup.py`);if(f===void 0)throw Error(`The current challenge has no robot_setup.py or earlier course_setup.py`);for(let e of Oa(n.files,a))s.add(e);d=a[`robot_setup.py`];let p=new Set(i.components.map(e=>e.file)),m=new Set([`robot_setup.py`,`course_setup.py`,`robot_config.py`]),h=new Set([`reflectance_readout.py`,`range_readout.py`]);for(let[e,t]of Object.entries(n.files))if(!(m.has(e)||Ca.has(e))){if(wa.has(e)){let t=e===`sensor_model.py`&&p.has(`sensor_processor.py`);!p.has(e)&&!t&&u.add(e);continue}if(!(e in i.project.files)){if(e in r.project.files||h.has(e)){u.add(e);continue}a[e]=t,o.add(e)}}for(let e of i.components){let t=e.file===`sensor_processor.py`&&n.files[e.file]===void 0&&n.files[`sensor_model.py`]!==void 0,r=t?`sensor_model.py`:e.file,i=n.files[r];i!==void 0&&(a[r]=i,o.add(r),t?a[e.file]=`# Use the measurement class completed in the earlier project.
from sensor_model import SensorModel as SensorProcessor
`:a[e.file]=i);let s=Sa(f,e.selectionFlag)??(e.selectionFlag===`USE_STUDENT_SENSOR_PROCESSOR`?Sa(f,`USE_STUDENT_SENSOR_MODEL`):null);i!==void 0&&s&&(d=xa(d,e.selectionFlag))}a[`robot_setup.py`]=d,`robot_setup.py`in n.files||(`robot_config.py`in n.files&&(a[`robot_config.py`]=`# Settings now live in robot_setup.py.
from robot_setup import *
`),a[`course_setup.py`]=`# Setup now lives in robot_setup.py.
from robot_setup import *
`+(i.components.some(e=>e.selectionFlag===`USE_STUDENT_SENSOR_PROCESSOR`)?`USE_STUDENT_SENSOR_MODEL = USE_STUDENT_SENSOR_PROCESSOR
`:``));for(let e of Object.keys(a))o.has(e)||s.has(e)||(e in n.files?c.add(e):l.add(e));return{project:{name:i.project.name,entrypoint:i.project.entrypoint,files:a},preserve:Object.freeze([...o].sort()),merge:Object.freeze([...s].sort()),replace:Object.freeze([...c].sort()),add:Object.freeze([...l].sort()),omit:Object.freeze([...u].sort())}}var Aa=Z(ba).project;export{_e as A,l as B,M as C,we as D,Ce as E,ge as F,i as H,ae as I,ie as L,Se as M,ce as N,Te as O,v as P,oe as R,mt as S,D as T,e as U,a as V,sn as _,ka as a,I as b,Pr as c,jr as d,Ar as f,ln as g,un as h,Z as i,xe as j,ve as k,Nr as l,Or as m,Aa as n,ya as o,kr as p,ba as r,pa as s,X as t,Mr as u,tn as v,k as w,$t as x,P as y,c as z};