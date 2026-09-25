import{t as e}from"./project_catalog-BeH83WxD.js";function t(e){let t=new TextEncoder,n=t.encode(e),r=t.encode(`${n.byteLength}:`),i=new Uint8Array(r.byteLength+n.byteLength+1);return i.set(r,0),i.set(n,r.byteLength),i[i.byteLength-1]=59,i}function n(e){let n=[t(e.entrypoint)];for(let[r,i]of Object.entries(e.files).sort(([e],[t])=>e<t?-1:+(e>t)))n.push(t(r),t(i));let r=n.reduce((e,t)=>e+t.byteLength,0),i=new Uint8Array(r),a=0;for(let e of n)i.set(e,a),a+=e.byteLength;return i}function r(e){return Array.from(new Uint8Array(e),e=>e.toString(16).padStart(2,`0`)).join(``)}async function i(e){if(!globalThis.crypto?.subtle)throw Error(`This browser cannot calculate a project revision`);let t=n(e);return r(await globalThis.crypto.subtle.digest(`SHA-256`,t.buffer))}async function a(e){let t=e.entrypoint.split(`/`).at(-1)??`XRP project`;return{name:(e.name?.trim()||t).slice(0,80),entrypoint:e.entrypoint,revision:await i(e),stale:!1}}var o=`__ucsbXrpPageDepartureV1`;function s(){return typeof window>`u`?void 0:window}function c(e){return e[o]}function l(e,t){try{return t.parent===e&&t.location.origin===e.location.origin}catch{return!1}}function u(e){try{let t=e.scope.parent;if(t===e.scope||!l(t,e.scope))return e;let n=c(t);if(n?.children?.().includes(e.scope))return n}catch{}return e}function d(e){if(e.dispatching)return!0;e.dispatching=!0;let t=!1;try{let n=new Set([e]);try{for(let t of e.children?.()??[]){if(!l(e.scope,t))continue;let r=c(t);r&&n.add(r)}}catch{t=!0}let r=[...n].flatMap(e=>[...e.participants]);for(let e of r)try{e.needsProtection?.()&&(t=!0)}catch{t=!0}for(let e of r)try{e.cancel?.()}catch{t=!0}return t}finally{e.dispatching=!1}}function f(e){let t=c(e);if(t)return t;let n={scope:e,participants:new Set,dispatching:!1,beforeUnload:e=>{d(u(n))&&(e.preventDefault(),e.returnValue=``)}};return Object.defineProperty(e,o,{configurable:!0,value:n}),e.addEventListener(`beforeunload`,n.beforeUnload),n}function p(e){e.participants.size>0||e.children||(e.scope.removeEventListener(`beforeunload`,e.beforeUnload),c(e.scope)===e&&Reflect.deleteProperty(e.scope,o))}function m(e,t=s()){if(!t)return()=>void 0;let n=f(t);return n.participants.add(e),()=>{n.participants.delete(e),p(n)}}async function ee(e=s()){if(!e)return;let t=c(e);if(!t)return;let n=u(t),r=new Set([n]);for(let e of n.children?.()??[]){if(!l(n.scope,e))continue;let t=c(e);if(!t)throw Error(`The workspace is still opening. Try the link again when it is ready.`);r.add(t)}for(let e of r)for(let t of e.participants)await t.prepareNavigation?.()}function te(e,t=s()){if(!t)return()=>void 0;let n=f(t);return n.children=e,()=>{n.children===e&&(n.children=void 0),p(n)}}var ne=Object.freeze({minimumXmm:-1524,minimumYmm:-609.6,maximumXmm:1524,maximumYmm:609.6}),re=ne,ie={defaultWorldId:`open`,worlds:[{id:`open`,label:`Course arena`,bounds:re,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[],markers:[{type:`start_box`,label:`Start`,minimumXmm:-120,minimumYmm:-120,maximumXmm:120,maximumYmm:120}]},{id:`delivery-gate-blocked`,label:`Delivery gate blocked`,bounds:re,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[{type:`block`,label:`Blocked gate`,minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100}],markers:[{type:`start_line`,label:`Start`,x1Mm:0,y1Mm:-140,x2Mm:0,y2Mm:140},{type:`waypoint`,label:`Delivery`,xMm:900,yMm:0}]}]};function h(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`${t} must be an object`);return e}function g(e,t,n){if(!Array.isArray(e)||e.length>n)throw Error(`${t} must be a list with at most ${n} items`);return e}function _(e,t){if(typeof e!=`number`||!Number.isFinite(e))throw Error(`${t} must be a finite number`);return e}function ae(e,t){if(typeof e!=`boolean`)throw Error(`${t} must be true or false`);return e}function oe(e,t,n=64){if(typeof e!=`string`||!e.trim()||e.length>n)throw Error(`${t} must contain 1 to ${n} characters`);return e.trim()}function se(e,t){return e===void 0?void 0:oe(e,t,48)}function v(e,t){let n=oe(e,t,32);if(!/^[a-z][a-z0-9_-]*$/.test(n))throw Error(`${t} must use lower-case letters, digits, underscores, and hyphens`);return n}function y(e,t){let n=new Set(t),r=Object.fromEntries(Object.entries(e).filter(([e])=>!n.has(e)));return Object.keys(r).length===0?{}:{additionalProperties:r}}function b(e,t){let n=h(e,t),r={minimumXmm:_(n.minimum_x_mm,`${t}.minimum_x_mm`),minimumYmm:_(n.minimum_y_mm,`${t}.minimum_y_mm`),maximumXmm:_(n.maximum_x_mm,`${t}.maximum_x_mm`),maximumYmm:_(n.maximum_y_mm,`${t}.maximum_y_mm`)};if(r.maximumXmm<=r.minimumXmm||r.maximumYmm<=r.minimumYmm)throw Error(`${t} must have positive width and height`);return r}function x(e,t,n){return t>=e.minimumXmm&&t<=e.maximumXmm&&n>=e.minimumYmm&&n<=e.maximumYmm}function ce(e,t){return t.minimumXmm>=e.minimumXmm&&t.maximumXmm<=e.maximumXmm&&t.minimumYmm>=e.minimumYmm&&t.maximumYmm<=e.maximumYmm}function le(e,t){let n=h(e,`worlds[${t}]`),r=b(n.bounds,`worlds[${t}].bounds`),i=h(n.initial_pose??{x_mm:0,y_mm:0,heading_rad:0},`worlds[${t}].initial_pose`),a={xMm:_(i.x_mm,`worlds[${t}].initial_pose.x_mm`),yMm:_(i.y_mm,`worlds[${t}].initial_pose.y_mm`),headingRad:_(i.heading_rad,`worlds[${t}].initial_pose.heading_rad`)};if(a.xMm<r.minimumXmm||a.xMm>r.maximumXmm||a.yMm<r.minimumYmm||a.yMm>r.maximumYmm)throw Error(`worlds[${t}].initial_pose must be inside the bounds`);let o=g(n.obstacles??[],`worlds[${t}].obstacles`,32).map((e,n)=>{let i=h(e,`worlds[${t}].obstacles[${n}]`);if(i.type!==`block`&&i.type!==`wall`)throw Error(`worlds[${t}].obstacles[${n}].type must be block or wall`);let a=b(i,`worlds[${t}].obstacles[${n}]`);if(!ce(r,a))throw Error(`worlds[${t}].obstacles[${n}] must be inside the world bounds`);return{...a,type:i.type,label:se(i.label,`worlds[${t}].obstacles[${n}].label`),feature:i.feature===void 0?void 0:v(i.feature,`worlds[${t}].obstacles[${n}].feature`)}}),s=o.flatMap(e=>e.feature===void 0?[]:[e.feature]);if(new Set(s).size!==s.length)throw Error(`worlds[${t}] obstacle feature names must be unique`);let c=g(n.tracks??[],`worlds[${t}].tracks`,8).map((e,n)=>{let i=`worlds[${t}].tracks[${n}]`,a=h(e,i);if(a.type!==`line`)throw Error(`${i}.type must be line`);let o=_(a.width_mm,`${i}.width_mm`),s=_(a.darkness,`${i}.darkness`),c=ae(a.closed??!1,`${i}.closed`);if(o<=0)throw Error(`${i}.width_mm must be positive`);if(s<0||s>1)throw Error(`${i}.darkness must be within [0, 1]`);let l=g(a.points,`${i}.points`,128).map((e,t)=>{let n=`${i}.points[${t}]`,a=h(e,n),o={xMm:_(a.x_mm,`${n}.x_mm`),yMm:_(a.y_mm,`${n}.y_mm`)};if(!x(r,o.xMm,o.yMm))throw Error(`${n} must be inside the world bounds`);return o});if(l.length<(c?3:2))throw Error(`${i}.points does not define a usable line`);for(let e=1;e<l.length;e+=1){let t=l[e-1],n=l[e];if(t.xMm===n.xMm&&t.yMm===n.yMm)throw Error(`${i}.points must not repeat adjacent points`)}return{type:`line`,name:a.name===void 0?void 0:v(a.name,`${i}.name`),label:se(a.label,`${i}.label`),widthMm:o,darkness:s,closed:c,points:l}}),l=c.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(l).size!==l.length)throw Error(`worlds[${t}] track names must be unique`);let u=g(n.markers??[],`worlds[${t}].markers`,32).map((e,n)=>{let i=`worlds[${t}].markers[${n}]`,a=h(e,i),o=se(a.label,`${i}.label`),s=a.name===void 0?void 0:v(a.name,`${i}.name`);if(a.type===`start_line`||a.type===`finish_line`){let e=_(a.x1_mm,`${i}.x1_mm`),t=_(a.y1_mm,`${i}.y1_mm`),n=_(a.x2_mm,`${i}.x2_mm`),c=_(a.y2_mm,`${i}.y2_mm`);if(e===n&&t===c)throw Error(`${i} must have two different endpoints`);if(!x(r,e,t)||!x(r,n,c))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,x1Mm:e,y1Mm:t,x2Mm:n,y2Mm:c,...y(a,[`type`,`name`,`label`,`x1_mm`,`y1_mm`,`x2_mm`,`y2_mm`])}}if(a.type===`start_box`||a.type===`finish_box`){let e=b(a,i);if(!ce(r,e))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,...e,...y(a,[`type`,`name`,`label`,`minimum_x_mm`,`minimum_y_mm`,`maximum_x_mm`,`maximum_y_mm`])}}if(a.type===`waypoint`){let e=_(a.x_mm,`${i}.x_mm`),t=_(a.y_mm,`${i}.y_mm`);if(!x(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`waypoint`,name:s,label:o,xMm:e,yMm:t,headingRad:a.heading_rad===void 0?void 0:_(a.heading_rad,`${i}.heading_rad`),...y(a,[`type`,`name`,`label`,`x_mm`,`y_mm`,`heading_rad`])}}if(a.type===`marker`){let e=_(a.x_mm,`${i}.x_mm`),t=_(a.y_mm,`${i}.y_mm`);if(!x(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`marker`,name:s,label:o,xMm:e,yMm:t,...y(a,[`type`,`name`,`label`,`x_mm`,`y_mm`])}}throw Error(`${i}.type is not a supported marker`)}),d=u.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(d).size!==d.length)throw Error(`worlds[${t}] marker names must be unique`);let f=n.range_sensor===void 0?void 0:h(n.range_sensor,`worlds[${t}].range_sensor`);return{id:v(n.id,`worlds[${t}].id`),label:oe(n.label,`worlds[${t}].label`),bounds:r,initialPose:a,obstacles:o,tracks:c,markers:u,...f?.include_arena_boundary===void 0?{}:{includeArenaBoundaryInRange:ae(f.include_arena_boundary,`worlds[${t}].range_sensor.include_arena_boundary`)}}}function ue(e){if(e.length>64e3)throw Error(`world.json is too large`);let t;try{t=JSON.parse(e)}catch(e){throw Error(`world.json is not valid JSON: ${e instanceof Error?e.message:String(e)}`)}let n=h(t,`world.json`),r=g(n.worlds,`worlds`,8).map(le);if(r.length===0)throw Error(`worlds must contain at least one world`);if(new Set(r.map(e=>e.id)).size!==r.length)throw Error(`world IDs must be unique`);let i=v(n.default_world,`default_world`);if(!r.some(e=>e.id===i))throw Error(`default_world must name one of the worlds`);return{defaultWorldId:i,worlds:r}}var de=192.5,fe=Math.PI/12;Object.freeze(Array.from({length:9},(e,t)=>(t/8-.5)*fe));function pe(e,t=70){return{xMm:e.xMm+t*Math.cos(e.headingRad),yMm:e.yMm+t*Math.sin(e.headingRad)}}Object.freeze({open:Object.freeze({label:`Course arena`,obstacles:Object.freeze([])}),"delivery-gate-blocked":Object.freeze({label:`Delivery gate blocked`,obstacles:Object.freeze([Object.freeze({minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100})])})}),Math.PI*60*1.5;var me=`world.json`;function S(e){let t=e.files[me];return t===void 0?ie:ue(t)}function he(e,t){let n=e.files[me];if(n===void 0)return e;let r=S(e);if(!r.worlds.some(e=>e.id===t))throw Error(`Unknown world '${t}'`);if(r.defaultWorldId===t)return e;let i=JSON.parse(n);return{...e,files:{...e.files,[me]:`${JSON.stringify({...i,default_world:t},null,2)}\n`}}}var ge=262144,_e=98304,ve=/^[A-Za-z0-9._/-]+$/,ye=new TextEncoder,be=class extends Error{code;constructor(e,t){super(t),this.code=e,this.name=`PortableProjectError`}};function C(e){throw new be(`invalid_project`,e)}function xe(e){throw new be(`project_too_large`,e)}function Se(e){typeof e!=`string`&&C(`Project file paths must be text`);let t=e.replaceAll(`\\`,`/`).replace(/^\/+|\/+$/g,``);return(t.length===0||t.split(`/`).some(e=>e===``||e===`.`||e===`..`))&&C(`File path '${e}' is invalid. Use named folders without empty, '.' or '..' sections.`),t.length>160&&C(`File path '${e}' has ${t.length} characters; XRP project paths may use at most 160.`),ve.test(t)||C(`File path '${e}' contains a character the XRP cannot store. Use letters, numbers, '-', '_', '.', and '/'.`),t}function w(e){(typeof e!=`object`||!e)&&C(`The project is not a valid project object`),(typeof e.files!=`object`||e.files===null||Array.isArray(e.files))&&C(`The project files are not a valid file collection`);let t=Object.entries(e.files);if(t.length===0&&C(`This project has no files. Add a Python file, then try again.`),t.length>48){let e=t.length-48;xe(`This project has ${t.length} files; an XRP project may contain at most 48. Remove or move ${e} file${e===1?``:`s`}, then try again.`)}let n=Se(e.entrypoint);n.endsWith(`.py`)||C(`The main file must be a Python (.py) file`);let r=[],i=new Set,a=0;for(let[e,n]of t){let t=Se(e);i.has(t)&&C(`Two project files resolve to '${t}'. Rename one of them, then try again.`),typeof n!=`string`&&C(`Project file '${t}' must contain text`);let o=ye.encode(n).byteLength;o>98304&&xe(`File '${t}' uses ${o.toLocaleString(`en-US`)} bytes; each XRP project file may use at most ${_e.toLocaleString(`en-US`)} bytes (96 KiB).`),a+=o,a>262144&&xe(`The project files use ${a.toLocaleString(`en-US`)} bytes; an XRP project may use at most ${ge.toLocaleString(`en-US`)} bytes (256 KiB).`),i.add(t),r.push([t,n])}return i.has(n)||C(`The main file '${n}' is not in the project`),e.name!==void 0&&(typeof e.name!=`string`||e.name.trim().length===0)&&C(`The project name must contain text`),{entrypoint:n,files:r,pythonPaths:r.map(([e])=>e).filter(e=>e.endsWith(`.py`)),totalBytes:a}}function T(e){try{return w(e),null}catch(e){if(e instanceof be)return e;throw e}}var Ce=1e6,we=1e6,Te=2048,Ee=2048,De=80,Oe=/^[A-Za-z0-9._/-]+$/,ke=/^\s*File\s+["']([^"']+)["'](?:,\s*line\s+(\d+)(?:,\s*in\s+.*)?)?\s*$/,Ae=/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt)):\s*(.*)$/,je=/^(.+?\.py):(\d+)(?::(\d+|none|null))?:\s*(.*)$/i,Me=/\u001b\[[0-?]*[ -/]*[@-~]/g;function Ne(e,t){if(e===void 0)return;let n=typeof e==`number`?e:Number.parseInt(e,10);if(!(!Number.isFinite(n)||n<1))return Math.min(Math.trunc(n),t)}function Pe(e,t){return e.length<=t?e:`${e.slice(0,Math.max(0,t-13))}… [truncated]`}function Fe(e){let t=e.replaceAll(`\r
`,`
`).replaceAll(`\r`,`
`).split(`
`).map(e=>Pe(e,Ee));for(;t[0]===``;)t.shift();for(;t.at(-1)===``;)t.pop();if(t.length<=128)return t;let n=t.length-63-64;return[...t.slice(0,63),`… [${n} traceback lines omitted]`,...t.slice(-64)]}function Ie(e){let t=e.trim().replaceAll(`\\`,`/`);if(!(t.startsWith(`<`)&&t.endsWith(`>`))){if(t.startsWith(`/project/`))t=t.slice(9);else if(t.startsWith(`project/`))t=t.slice(8);else if(t.startsWith(`./`))t=t.slice(2);else if(t.startsWith(`/`)||/^[A-Za-z]:\//.test(t))return;if(t=t.replace(/^\/+|\/+$/g,``),!(t.length===0||t.length>160||!Oe.test(t)||t.split(`/`).some(e=>e===``||e===`.`||e===`..`)))return t}}function Le(e){if(!e)return;let t=new Set;for(let n of e){let e=Ie(n);e&&t.add(e)}return t}function Re(e,t){let n=Ie(e);if(n&&!(t&&!t.has(n)))return n}function ze(e){return e.map(e=>e.replace(Me,``)).filter(e=>e.trim().length>0)}function Be(e){return e.split(`
`).filter(e=>!/^\s*File "<stdin>", line \d+(?:, in .*)?\s*$/.test(e)).join(`
`).trim()}function E(e,t={}){let n=Be(String(e)),r=Fe(n),i=ze(r);if(i.length===0)return[];let a=Le(t.projectPaths),o,s,c;for(let e of i){let t=ke.exec(e);if(!t)continue;let n=Re(t[1]??``,a);n&&(o=n,s=Ne(t[2],Ce),c=1)}let l=t.code?.trim()||void 0,u=i.at(-1)?.trim()??n,d=Ae.exec(u);d&&(l=d[1],u=d[2]?.trim()||d[1]||u);let f=je.exec(u);if(f){let e=Re(f[1]??``,a);e&&(o=e,s=Ne(f[2],Ce),c=Ne(f[3],we)),u=f[4]?.trim()||u}if(o===void 0&&s===void 0&&d===null&&l===void 0)return[];let p=s===void 0?void 0:{line:s,column:c??1},m=p?{line:p.line,column:Math.min(we,p.column+1)}:void 0;return[{source:`micropython`,phase:t.phase??`compile`,severity:`error`,...l?{code:Pe(l,De)}:{},message:Pe(u||`MicroPython reported an error`,Te),...o?{path:o}:{},...p?{start:p,end:m}:{},raw:r}]}var Ve=2147483647,He=Object.freeze({revision:0,parameters:[],watches:[],plots:[]});function Ue(e,t){if(e.kind===`number`){if(typeof t!=`number`||!Number.isFinite(t)||e.minimum===void 0||e.maximum===void 0||e.step===void 0||e.step<=0||t<e.minimum||t>e.maximum)throw Error(`${e.label} is outside its declared range`);let n=Math.round((t-e.minimum)/e.step);if(n<0||n>Ve)throw Error(`${e.label} declares too many steps`);return n}if(e.kind===`toggle`){if(typeof t!=`boolean`)throw Error(`${e.label} must be on or off`);return+!!t}if(typeof t!=`string`||!e.options?.includes(t))throw Error(`${e.label} is not one of its declared choices`);return e.options.indexOf(t)}function We(e){if(e.length>32768)throw Error(`Student runtime state is malformed`);let t=JSON.parse(e),n=t?.plots??[];if(typeof t!=`object`||!t||!Number.isInteger(t.revision)||(t.revision??-1)<0||!Array.isArray(t.parameters)||!Array.isArray(t.watches)||!Array.isArray(n)||t.parameters.length>16||t.watches.length>16||n.length>16||!t.parameters.every(Ge)||!t.watches.every(Ke)||!n.every(qe)||new Set(t.parameters.map(e=>e.name)).size!==t.parameters.length||new Set(t.watches.map(e=>e.name)).size!==t.watches.length||new Set(n.map(e=>e.name)).size!==n.length)throw Error(`Student runtime state is malformed`);return{...t,plots:n}}function D(e){return typeof e==`boolean`||typeof e==`string`&&e.length<=64||typeof e==`number`&&Number.isFinite(e)}function O(e){return typeof e==`string`&&e.length>0&&e.length<=80}function k(e){return typeof e==`string`&&e.length>0&&e.length<=32&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)}function A(e){return e===void 0||typeof e==`string`&&e.length<=24}function Ge(e){if(typeof e!=`object`||!e)return!1;let t=e;if(!k(t.name)||!O(t.label)||!A(t.unit)||![`number`,`toggle`,`choice`].includes(t.kind??``)||!D(t.value)||t.pendingValue!==void 0&&!D(t.pendingValue)||t.kind===`number`&&(typeof t.minimum!=`number`||!Number.isFinite(t.minimum)||typeof t.maximum!=`number`||!Number.isFinite(t.maximum)||typeof t.step!=`number`||!Number.isFinite(t.step)||t.maximum<=t.minimum||t.step<=0||t.step>t.maximum-t.minimum||Math.round((t.maximum-t.minimum)/t.step)>Ve)||t.kind===`choice`&&(!Array.isArray(t.options)||t.options.length<2||t.options.length>6||t.options.some(e=>typeof e!=`string`||e.length>24)||new Set(t.options).size!==t.options.length))return!1;try{t.pendingValue!==void 0&&Ue(t,t.pendingValue),Ue(t,t.value)}catch{return!1}return!0}function Ke(e){if(typeof e!=`object`||!e)return!1;let t=e;return k(t.name)&&O(t.label)&&A(t.unit)&&D(t.value)}function qe(e){if(typeof e!=`object`||!e)return!1;let t=e;return k(t.name)&&O(t.label)&&A(t.unit)&&typeof t.value==`number`&&Number.isFinite(t.value)}function j(){throw Error(`Sample plot values or descriptors are malformed`)}function M(e){return We(JSON.stringify({revision:0,parameters:[],watches:[],plots:e})).plots}function Je(e,t,n){if(e===void 0||e===null&&n===0)return null;(!Array.isArray(e)||e.length!==n)&&j();let r=null;return t!==void 0&&((!Array.isArray(t)||t.length>256)&&j(),r=t.map(e=>((!e||typeof e!=`object`||Array.isArray(e))&&j(),M([{...e,value:0}])[0]))),e.map(e=>e===null?[]:((!Array.isArray(e)||e.length>16)&&j(),r!==null&&e.every(Array.isArray)?M(e.map(e=>((e.length!==2||!Number.isSafeInteger(e[0])||e[0]<0||e[0]>=r.length||typeof e[1]!=`number`||!Number.isFinite(e[1]))&&j(),{...r[e[0]],value:e[1]}))):M(e)))}var Ye=[`rawDeviceTimeMs`,`acquiredAtMs`,`acquisitionSeq`,`rangeAcquiredAtMs`,`rangeSeq`,`diagnosticsAcquiredAtMs`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`,`rawRangeMm`,`publishedAtMs`,`sampleDtMs`,`samplePeriodMs`,`overrunMs`];function N(e,t){if(e==null)return;if(!Array.isArray(e)||e.length!==16||t.length>200)throw Error(`Invalid telemetry timing record`);let n={version:1,clockId:t,clockBasis:`first-acquisition`};if(Ye.forEach((t,r)=>{let i=e[r];if(i!==null&&(typeof i!=`number`||!Number.isFinite(i)))throw Error(`Invalid timing ${t}`);if(i!==null&&![`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i<0)throw Error(`Negative timing ${t}`);if([`rawDeviceTimeMs`,`acquisitionSeq`,`rangeSeq`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i!==null&&!Number.isSafeInteger(i))throw Error(`Invalid integer ${t}`);n[t]=i}),![`raw`,`course`,`stop`].includes(e[14]))throw Error(`Invalid timing kind`);if(n.kind=e[14],typeof e[15]!=`boolean`)throw Error(`Invalid range sampling flag`);return n.rangeSampled=e[15],n}function Xe(e,t,n,r){if(t!==void 0&&(!Array.isArray(t)||t.length!==e.length))throw Error(`Unaligned telemetry timing`);if(n!==void 0&&(!Array.isArray(n)||n.length!==e.length))throw Error(`Unaligned telemetry diagnostics`);return e.map((e,i)=>{let a=Array.isArray(t)?N(t[i],r):e.timing,o=Array.isArray(n)?n[i]:void 0;return o==null?{...e,...a?{timing:a}:{}}:{...e,...a?{timing:a}:{},...Ze(o)}})}function Ze(e){if(!Array.isArray(e)||e.length!==5)throw Error(`Invalid telemetry diagnostics`);let t=e=>{if(e===null)return null;if(!Array.isArray(e)||e.length!==3||e.some(e=>typeof e!=`number`||!Number.isFinite(e)))throw Error(`Invalid diagnostics vector`);return[...e]};if(e.slice(2,4).some(e=>e!==null&&(typeof e!=`number`||!Number.isFinite(e))))throw Error(`Invalid diagnostics value`);if(e[4]!==null&&(typeof e[4]!=`string`||e[4].length>512))throw Error(`Invalid diagnostics error`);return{accelerationMg:t(e[0]),angularRateMdps:t(e[1]),temperatureC:e[2],batteryV:e[3],sensorError:e[4]}}var Qe=5e3,P={schema_version:2,release_id:`2026.09-dev.54`,release_sequence:54,status:`development`,application_version:`0.1.0`,course_api_revision:`0.6-draft`,service:{version:`0.1.0`,protocol_version:1,protocol_revision:5,bootstrap_version:1},compatibility:{minimum_robot_release_sequence:54},controller:{id:`sparkfun-xrp-controller-rp2350`,usb_vid:`0x1B4F`,usb_pid:`0x0046`},micropython:{version:`1.29.0`,board:`SPARKFUN_XRP_CONTROLLER`,asset:`SPARKFUN_XRP_CONTROLLER-20260824-v1.29.0.uf2`,source_url:`https://micropython.org/resources/firmware/SPARKFUN_XRP_CONTROLLER-20260824-v1.29.0.uf2`,byte_size:1787904,sha256:`8a1547159764a9f3a0a94ba078f64b21124f540571a6004ce19981dcda6dc590`,git_blob_sha1:`957fbeb69d0450d34dfa86dabfefa6aa1656387a`},xrplib:{version:`2026.07.1`,tag:`V2026.07.1`,source_commit:`55abed4e219e061d32dd190199bc42d9a1b45366`},upstream_manifest:{repository:`Open-STEM/XRP_Firmware`,commit:`1914fd636d1d06425cdbec88ae4b998844d1501a`},ucsb_xrp:{version:`0.6.0-dev`,source_hash_algorithm:`sha256-file-manifest-v1`,source_file_count:19,source_sha256:`4ffd4b8b79949d3154423388be4d208193ea9a7f30eef5de0d37a587f50a8254`,reference_compiler:{commit:`e0e9fbb17ed6fd06bb76e266ae554784c9c80804`,portable_abi:774,repository:`micropython/micropython`,tag:`v1.28.0`,version_output:`MicroPython v1.28.0; mpy-cross emitting mpy v6.3`},reference_artifacts:[{byte_size:383,path:`reference_mpy/ucsb_xrp_reference/__init__.mpy`,sha256:`658e3c0f1d6f8da4c75821c1775d6ea4a141933d4101c4b30b2b6250534dca77`,source:`reference_source/ucsb_xrp_reference/__init__.py`,source_sha256:`86cac2729c7191b197f4ff8d1a984f04607c6bec03b919bdf758e8c03c99daee`},{byte_size:3298,path:`reference_mpy/ucsb_xrp_reference/challenge_1.mpy`,sha256:`a79724a39bc13f8abd6243c6726f888c61956b58fea2b88ebdd868a8d1480b51`,source:`reference_source/ucsb_xrp_reference/challenge_1.py`,source_sha256:`3c7c7c2a0dfd200c293939b8ea3e0b4a0127aefdbb645f004d1b32af36eea375`},{byte_size:1155,path:`reference_mpy/ucsb_xrp_reference/challenge_2.mpy`,sha256:`6c019f49d85c454e03c3fd4daf66837140e5b20de32a057dbbd6cc18fed480aa`,source:`reference_source/ucsb_xrp_reference/challenge_2.py`,source_sha256:`429e94f49aa21b5aad471ba621d96d6b3c84189c59337f457382ec3ae9154d8b`},{byte_size:1380,path:`reference_mpy/ucsb_xrp_reference/challenge_3.mpy`,sha256:`a0fa0e3ffa7296e4378cd315d6cd173caa1deb31ead87957b0421153200f54ea`,source:`reference_source/ucsb_xrp_reference/challenge_3.py`,source_sha256:`f55234c0679cefb34865bf236d5097f3c7e6673be40ebfff136d004512b99008`},{byte_size:639,path:`reference_mpy/ucsb_xrp_reference/challenge_4.mpy`,sha256:`6498a5593c1f96741e37fb5acabdae0e6623e52da0d5495c2ff9843be3eb69eb`,source:`reference_source/ucsb_xrp_reference/challenge_4.py`,source_sha256:`db710b214816df7dc91861e8734043c4b3600bd6cfcac3a53ea645d0e9d7e4fd`},{byte_size:799,path:`reference_mpy/ucsb_xrp_reference/challenge_6.mpy`,sha256:`0f938c29af9916d0d09cc695b2c00c4bbb9a91eaf8fd7f2b2fbfabbfec94681f`,source:`reference_source/ucsb_xrp_reference/challenge_6.py`,source_sha256:`f196c5d18050b05b553a00c977408b14db361c6272c4f27ef406bf78481e0653`},{byte_size:1261,path:`reference_mpy/ucsb_xrp_reference/challenge_7.mpy`,sha256:`4a0d3956290f81d7e7db80bdbe77e2025e20218a630bfd4462fd8d5c267552be`,source:`reference_source/ucsb_xrp_reference/challenge_7.py`,source_sha256:`f0ac35b3271f3784b7e5c10c986ec26e098b449f55b1f438826b4ccc3e587ea3`},{byte_size:1399,path:`reference_mpy/ucsb_xrp_reference/challenge_8.mpy`,sha256:`b8fe42140d4716526179402017446dadb54fc626725f145c12c17c8fddbb0c0f`,source:`reference_source/ucsb_xrp_reference/challenge_8.py`,source_sha256:`b0834141908c190ff6a624c47f4a23abe2e1684bf6049d280e46b620a90a8e49`},{byte_size:734,path:`reference_mpy/ucsb_xrp_reference/challenge_9.mpy`,sha256:`163c222e31dd0482998d15ed3f95a2b77963c0b219a83d6bfe71b6be8dff5406`,source:`reference_source/ucsb_xrp_reference/challenge_9.py`,source_sha256:`16867f0c79fc2c017ceef2a6ef428cb6f3a5bcf77e4cddf7a9bace4081d4c590`}]}},$e=P.release_id;P.release_sequence;var et=P.compatibility.minimum_robot_release_sequence,tt=P.service.protocol_version,nt=P.service.protocol_revision,rt=P.course_api_revision,it=P.service.version,F=class extends Error{code;context;constructor(e,t,n={}){super(t),this.code=e,this.context=n,this.name=`PhysicalTargetError`}};function at(e,t){let n=e=>e instanceof F?e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`?1:e.code===`network_error`||e.code===`timeout`?0:2:0;return n(t)>=n(e)?t:e}function I(e){let t=/^https?:\/\//i.test(e.trim())?e.trim():`http://${e.trim()}`,n=new URL(t);if(n.protocol!==`http:`&&n.protocol!==`https:`)throw Error(`Physical XRP address must use HTTP or HTTPS`);return n.pathname=n.pathname.replace(/\/+$/,``),n.search=``,n.hash=``,n.toString().replace(/\/$/,``)}function L(e,t,n=globalThis.location===void 0?void 0:globalThis.location.protocol){return n===`https:`&&new URL(e).protocol===`http:`?{...t,targetAddressSpace:`local`}:{...t}}function R(e){return e instanceof Error?e.message:String(e)}function z(){return typeof globalThis.performance?.now==`function`?globalThis.performance.now():Date.now()}function B(e){return`Run and telemetry use Wi-Fi. The computer and XRP must use the network selected during First robot setup. If they are already on that network, select Reconnect. Browser detail: ${e} was not reachable; Chrome must be allowed to access devices on the local network.`}var ot=500,st=18e3,ct=2,lt=900,ut=20,dt=`row-v1`,ft=24,V=`packed-v1`,pt=24,mt=8,ht=36,gt=2048,_t=65536,vt=75,yt=[85,88,84,49];function H(e){throw new F(`invalid_telemetry`,`XRP returned invalid compact telemetry: ${e}`)}function U(e,t){return(typeof e!=`number`||!Number.isFinite(e))&&H(`${t} is not a finite number`),e}function W(e,t){return e===null?null:U(e,t)}function bt(e,t){return e===null?null:((!Array.isArray(e)||e.length!==3)&&H(`${t} is not a three-axis vector`),[U(e[0],`${t}[0]`),U(e[1],`${t}[1]`),U(e[2],`${t}[2]`)])}function xt(e,t){(!Array.isArray(e)||e.length!==20)&&H(`row-v1 requires exactly 20 row values`),(!Array.isArray(t)||t.length!==5)&&H(`row-v1 requires exactly five shared values`);let n=e[2],r=e[19],i=t[4];typeof n!=`boolean`&&H(`poseAvailable is not boolean`),typeof r!=`boolean`&&H(`buttonPressed is not boolean`),i!==null&&typeof i!=`string`&&H(`sensorError is not text or null`);let a=U(e[3],`xMm`),o=U(e[4],`yMm`),s=U(e[5],`headingRad`),c=U(e[1],`seq`);return(!Number.isSafeInteger(c)||c<0)&&H(`seq is not a nonnegative safe integer`),{tMs:U(e[0],`tMs`),seq:c,source:`physical`,poseAvailable:n,xMm:a,yMm:o,headingRad:s,estimatedPoseAvailable:n,estimatedXmm:n?a:null,estimatedYmm:n?o:null,estimatedHeadingRad:n?s:null,groundTruthPoseAvailable:!1,groundTruthXmm:null,groundTruthYmm:null,groundTruthHeadingRad:null,requestedForwardSpeedMmS:W(e[6],`requestedForwardSpeedMmS`),requestedTurnRateRadS:W(e[7],`requestedTurnRateRadS`),targetLeftWheelSpeedMmS:W(e[8],`targetLeftWheelSpeedMmS`),targetRightWheelSpeedMmS:W(e[9],`targetRightWheelSpeedMmS`),leftEffort:U(e[10],`leftEffort`),rightEffort:U(e[11],`rightEffort`),leftWheelSpeedMmS:U(e[12],`leftWheelSpeedMmS`),rightWheelSpeedMmS:U(e[13],`rightWheelSpeedMmS`),leftWheelDistanceMm:W(e[14],`leftWheelDistanceMm`),rightWheelDistanceMm:W(e[15],`rightWheelDistanceMm`),leftEncoderCount:U(e[16],`leftEncoderCount`),rightEncoderCount:U(e[17],`rightEncoderCount`),collision:!1,rangeMm:W(e[18],`rangeMm`),buttonPressed:r,accelerationMg:bt(t[0],`accelerationMg`),angularRateMdps:bt(t[1],`angularRateMdps`),temperatureC:W(t[2],`temperatureC`),batteryV:W(t[3],`batteryV`),sensorError:i}}function St(e,t,n){let r=e.getUint8(t);return r!==0&&r!==1&&H(`${n} is not boolean`),r===1}function G(e,t,n,r){return t&1<<n?(e!==0&&H(`${r} null sentinel is not canonical`),null):e}function Ct(e){let t=new Uint8Array(e);t.byteLength<mt&&H(`packed-v1 header is truncated`);for(let e=0;e<yt.length;e+=1)t[e]!==yt[e]&&H(`packed-v1 magic is invalid`);let n=new DataView(e),r=n.getUint32(4,!0);r>_t&&H(`packed-v1 metadata is too large`);let i=mt+r;i>t.byteLength&&H(`packed-v1 metadata is truncated`);let a;try{a=JSON.parse(new TextDecoder(`utf-8`,{fatal:!0}).decode(t.subarray(mt,i)))}catch{H(`packed-v1 metadata is not valid JSON`)}(typeof a!=`object`||!a||Array.isArray(a))&&H(`packed-v1 metadata is not an object`);let o=a;o.sampleEncoding!==void 0&&o.sampleEncoding!==V&&H(`packed-v1 metadata has the wrong encoding`),o.sampleCount!==void 0&&o.n!==void 0&&o.sampleCount!==o.n&&H(`packed-v1 sample counts disagree`);let s=o.sampleCount??o.n;if((!Number.isSafeInteger(s)||s<0||s>pt)&&H(`packed-v1 sampleCount must be 0 to ${pt}`),o.m!==void 0&&(o.m!==0&&o.m!==1&&H(`packed-v1 more-samples flag is invalid`),o.moreSamples!==void 0&&o.moreSamples!==(o.m===1)&&H(`packed-v1 more-samples values disagree`),o.moreSamples=o.m===1),o.s!==void 0){let e=[`ready`,`loading`,`running`,`error`];(!Number.isSafeInteger(o.s)||e[o.s]===void 0)&&H(`packed-v1 state code is invalid`),o.state!==void 0&&o.state!==e[o.s]&&H(`packed-v1 state values disagree`),o.state=e[o.s]}o.r!==void 0&&((!Number.isSafeInteger(o.r)||o.r<0)&&H(`packed-v1 run ID is invalid`),o.runId!==void 0&&o.runId!==o.r&&H(`packed-v1 run IDs disagree`),o.runId=o.r);let c=i,l;if(s>0){t.byteLength<c+ht&&H(`packed-v1 shared diagnostics are truncated`);let e=n.getUint16(c,!0);e&-512&&H(`packed-v1 shared null mask has unsupported bits`);let r=e&7,i=e&56;r!==0&&r!==7&&H(`packed-v1 acceleration null mask is partial`),i!==0&&i!==56&&H(`packed-v1 angular-rate null mask is partial`);let a=Array.from({length:8},(t,r)=>G(n.getFloat32(c+2+r*4,!0),e,r,`shared[${r}]`)),o=n.getUint16(c+34,!0);o>gt&&H(`packed-v1 sensor error is too large`);let s=c+ht,u=s+o;u>t.byteLength&&H(`packed-v1 sensor error is truncated`);let d=!!(e&256);d&&o!==0&&H(`packed-v1 null sensor error has text`);let f=null;if(!d)try{f=new TextDecoder(`utf-8`,{fatal:!0}).decode(t.subarray(s,u))}catch{H(`packed-v1 sensor error is not valid UTF-8`)}l=[r===0?[a[0],a[1],a[2]]:null,i===0?[a[3],a[4],a[5]]:null,a[6],a[7],f],c=u}let u=c+s*vt;t.byteLength!==u&&H(`packed-v1 row bytes do not match sampleCount`);let d=[];for(let t=0;t<s;t+=1){let n=c+t*vt,r=new DataView(e,n,vt),i=r.getUint8(9);i&128&&H(`packed-v1 null mask has unsupported bits`);let a=Array.from({length:13},(e,t)=>r.getFloat32(10+t*4,!0));d.push(xt([r.getUint32(0,!0),r.getUint32(4,!0),St(r,8,`poseAvailable`),a[0],a[1],a[2],G(a[3],i,0,`requestedForwardSpeedMmS`),G(a[4],i,1,`requestedTurnRateRadS`),G(a[5],i,2,`targetLeftWheelSpeedMmS`),G(a[6],i,3,`targetRightWheelSpeedMmS`),a[7],a[8],a[9],a[10],G(a[11],i,4,`leftWheelDistanceMm`),G(a[12],i,5,`rightWheelDistanceMm`),r.getInt32(62,!0),r.getInt32(66,!0),G(r.getFloat32(70,!0),i,6,`rangeMm`),St(r,74,`buttonPressed`)],l))}for(let e=1;e<d.length;e+=1)d[e].seq<=d[e-1].seq&&H(`packed-v1 sequence values are not strictly increasing`);let f=o;return f.sampleEncoding=V,f.sampleCount=s,f.sampleShared=l,f.samples=d,f}function wt(e){let t=e.firmware;if(t?.implementation!==`micropython`||t.version!==P.micropython.version||t.board!==`SparkFun XRP Controller with RP2350`)throw new F(`firmware_required`,`This XRP needs the course MicroPython ${P.micropython.version} firmware for its RP2350 controller. Open First robot setup and update the robot over USB, then reconnect.`)}function Tt(e){if(e.protocol!==tt)throw new F(`protocol_mismatch`,`XRP protocol ${e.protocol} is not supported by this app`);if(typeof e.runtimeReleaseSequence!=`number`&&typeof e.courseApiRevision!=`string`&&typeof e.protocolRevision!=`number`){if(e.courseRelease===$e&&(e.serviceVersion===$e||e.serviceVersion===it)){wt(e);return}throw new F(`release_mismatch`,`This XRP has course release ${e.courseRelease} and service ${e.serviceVersion}; this web app requires ${$e}. Open First robot setup, update the robot, then reconnect.`)}if(typeof e.protocolRevision!=`number`||e.protocolRevision<nt)throw new F(`protocol_mismatch`,`This XRP reports protocol revision ${String(e.protocolRevision)}; this app requires revision ${nt} or later. Open First robot setup, update the robot, then reconnect.`);if(e.courseApiRevision!==rt)throw new F(`release_mismatch`,`This XRP uses course API ${String(e.courseApiRevision)}; this app uses ${rt}. Open First robot setup, update the robot, then reconnect.`);if(typeof e.runtimeReleaseSequence!=`number`||e.runtimeReleaseSequence<et)throw new F(`release_mismatch`,`This XRP has runtime ${e.runtimeRelease??e.courseRelease}; this app requires robot update ${et} or later. Open First robot setup, update the robot, then reconnect.`);wt(e)}function Et(e){return e?.trim().toLocaleLowerCase()||void 0}function K(e,t){let n=Et(t);if(!n)return;let r=Et(e.robotId);if(!r)throw new F(`robot_identity_missing`,`This XRP service cannot prove that it is the robot selected during setup. Open First robot setup, then reconnect.`);if(r!==n)throw new F(`robot_identity_mismatch`,`The reachable XRP is ${r}, but this browser is configured for ${n}. Select the intended robot or run First robot setup.`)}function Dt(e,t){K(e,t),Tt(e);let n=[`project.check`,`project.prepare`,`program.run`,`program.stop`,`target.reset`,`telemetry.poll`].filter(t=>!e.capabilities?.includes(t));if(n.length>0)throw new F(`capability_mismatch`,`XRP service is missing ${n.join(`, `)}`)}var Ot=class{kind=`physical`;endpoint;fetchImplementation;activePollIntervalMs;pollIntervalMs;requestTimeoutMs;connectTimeoutMs;expectedRobotId;pollCoordinatorGeneration;pollOwnerId;pollDrivenByVisibleClient;listeners=new Set;pollTimer=null;pollDueAtMs=null;pollInFlight=null;pollAbortController=null;pollGeneration=0;pollingPaused=!1;connected=!1;reconnecting=!1;pollConnectionFailed=!1;consecutivePollFailures=0;lastPackedUpdatesAtMs=null;connectGeneration=0;nextRequest=1;nextEvent=1;eventSession=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;lastLogSeq=0;lastLogDeviceRunId;lastSampleSeq=0;bootId=null;lastRunId=0;currentProject=null;stagedProject=null;stagedProjectId=null;projectStateKnown=!1;info=null;lastRuntimeJson=``;runtimeState=He;lastWorldJson=``;currentState=`disconnected`;currentDetail=`Physical XRP disconnected`;projectRunProvider=null;commandEpoch=0;controlSessionId=`browser-${typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;control=null;currentRun=null;runOutputIdentity=null;pendingRunOutputIdentity=null;stagedRunDescriptor=null;unsettledLaunch=!1;pendingSnapshotCancels=new Set;pendingCommandCancels=new Set;commandsInFlight=new Set;pendingStop=null;collectingStoppedRun=!1;assertRunDataCollected(){if(this.collectingStoppedRun)throw new F(`run_data_pending`,`The program has stopped. Wait for its final run data to finish collecting before starting or preparing another project.`)}assertRunTelemetrySupported(){if(!this.connected)throw new F(`not_connected`,`Physical XRP is not connected`);if(this.info?.bootId!==this.bootId)throw new F(`boot_changed`,`The XRP restarted. Select Reconnect so UCSBXRP can check its current software before Run.`);if(!this.info?.capabilities.includes(`telemetry.packed-v1`))throw new F(`capability_mismatch`,`This XRP needs the current course software before Run can record data reliably. Open First robot setup, update the XRP over USB, then reconnect.`)}interruptPendingCommands(){this.commandEpoch+=1;for(let e of this.pendingSnapshotCancels)e();for(let e of this.pendingCommandCancels)e()}waitForCommand(e,t){return new Promise((n,r)=>{let i=!1,a=e=>{i||(i=!0,this.pendingCommandCancels.delete(o),e())},o=()=>a(()=>r(new F(`operation_cancelled`,`Operation cancelled by Stop, Reset, or disconnection`)));this.pendingCommandCancels.add(o),e.then(e=>a(()=>n(e)),e=>a(()=>r(e))),(t!==this.commandEpoch||!this.connected)&&o()})}assertCommandEpoch(e){if(e!==this.commandEpoch||!this.connected)throw new F(`operation_cancelled`,`Operation cancelled by Stop, Reset, or disconnection`)}async claimControl(){let e=this.commandEpoch;await this.pausePollingForCommand();try{this.assertCommandEpoch(e),await this.acquireControl(!0)}finally{this.resumePollingAfterCommand(0,e)}}async acquireControl(e){if(!this.info?.capabilities.includes(`control.session-v1`))return;let t=await this.command(`control`,{bootId:this.bootId,sessionId:this.controlSessionId,takeover:e});this.consumeControl(t.control)}consumeControl(e){e&&(this.control=e,this.publishControl())}publishControl(){if(!this.info?.capabilities.includes(`control.session-v1`))return;let e=this.control?.sessionId===this.controlSessionId,t=this.control?.sessionId!=null,n=this.currentState===`ready`||this.currentState===`error`;this.emit({type:`control`,owned:e,ownerPresent:t,canTakeover:!e&&n,detail:e?`This browser controls ${this.info.robotName}`:t?`Observing ${this.info.robotName}; another browser has control. Stop remains available.`:`${this.info.robotName} is available to control.`})}constructor(e,t={}){this.endpoint=I(e),this.fetchImplementation=t.fetch??((e,t)=>globalThis.fetch(e,t)),this.pollIntervalMs=t.pollIntervalMs??250,this.activePollIntervalMs=t.activePollIntervalMs??t.pollIntervalMs??ut,this.requestTimeoutMs=t.requestTimeoutMs??3e3,this.connectTimeoutMs=t.discoveryTimeoutMs??this.requestTimeoutMs,this.pollDrivenByVisibleClient=t.pollDrivenByVisibleClient===!0,this.expectedRobotId=Et(t.expectedRobotId);let n=t.pollCoordinatorGeneration;if(Number.isSafeInteger(n)&&n>0){this.pollCoordinatorGeneration=n;let e=t.pollOwnerId?.trim();this.pollOwnerId=(e||this.eventSession).slice(0,64)}}async connect(){if(this.connected)return;let e=this.connectGeneration+1;this.connectGeneration=e;let t=`connect-${e}`;this.emitConsole(`system`,`Connecting to ${this.endpoint}`,{action:`connect`,phase:`request`,requestId:t}),this.emitStatus(`connecting`,`Connecting to ${this.endpoint}`);let n;try{n=await this.getJson(`/api/v1/info`,this.connectTimeoutMs),Dt(n,this.expectedRobotId)}catch(n){if(e===this.connectGeneration){let e=R(n);this.emitConsole(`system`,`Connection failed · ${e}`,{action:`connect`,phase:`error`,requestId:t}),this.emitStatus(`error`,e)}throw n}if(e!==this.connectGeneration)return;this.reconcileReconnectedRun(n);let r=(this.collectingStoppedRun||this.currentRun!==null&&this.currentRun.finishedAtMs===void 0)&&this.bootId===n.bootId&&(n.runId===void 0||this.lastRunId===n.runId);this.info=n,this.bootId=n.bootId,this.lastRunId=n.runId??0,this.connected=!0,this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeProjectManifest(n.project),this.consumeRuntimeState(n.runtimeJson),this.consumeControl(n.control);let i=r?null:await this.readInitialState(n);if(e!==this.connectGeneration)return;try{await this.acquireControl(!1)}catch(e){if(!(e instanceof F)||e.code!==`control_owned`)throw e}if(e!==this.connectGeneration)return;this.emitStatus(r?`loading`:i?.state??`ready`,r?this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Reconnected; checking the program and collecting its remaining data…`:i?.detail??`${n.robotName} · ${this.connectionDescription(n)} · course ${n.courseRelease}`),this.emitConsole(`system`,`Connected to ${n.robotName} · ${this.connectionDescription(n)}`,{action:`connect`,phase:`result`,requestId:t}),this.emit({type:`project-provider`,active:this.projectRunProvider!==null,available:this.projectRunProvider!==null});let a=n.network?.mode,o=n.network?.address??n.address;(a===`access_point`||a===`station`)&&o&&this.emit({type:`physical-network`,mode:a,address:I(o),ssid:n.network?.ssid,...n.network?.requested_mode?{requestedMode:n.network.requested_mode}:{},...typeof n.network?.fallback==`boolean`?{fallback:n.network.fallback}:{},...n.robotId?{robotId:n.robotId}:{},...n.robotName?{hostname:n.robotName}:{}}),this.schedulePoll(0)}async readInitialState(e){if(!e.capabilities.includes(`logs.poll`)&&!e.capabilities.includes(`control.session-v1`))return null;try{let t=await this.getJson(`/api/v1/state?afterLogSeq=0`,Math.min(this.connectTimeoutMs,1500));if(t.bootId!==e.bootId)return null;let n=t.logs.reduce((e,t)=>Number.isSafeInteger(t.seq)&&(e===void 0||t.seq>e.seq)?t:e,void 0);this.lastLogSeq=n?.seq??0,this.lastLogDeviceRunId=Number.isSafeInteger(n?.runId)&&n?.runId>=0?n?.runId:void 0,this.lastRunId=t.runId;let r=t.sample??t.samples?.at(-1);return r&&Number.isSafeInteger(r.seq)&&(this.lastSampleSeq=r.seq,this.emitTelemetry(r)),this.consumeProjectManifest(t.project),this.consumeRuntimeState(t.runtimeJson),t}catch{return null}}disconnect(){this.interruptPendingCommands(),this.connectGeneration+=1,this.connected=!1,this.pollGeneration+=1,this.stopPolling(),this.abortActivePoll(),this.lastPackedUpdatesAtMs=null,this.emitStatus(`disconnected`,`Physical XRP disconnected`)}connectionDescription(e){let t=e.network?.mode,n=e.network?.ssid;if(t===`access_point`){let t=e.network?.fallback?` fallback`:``;return`${n??`robot hotspot`}${t} · ${e.address}`}return t===`station`?`${n??`existing Wi-Fi`} · ${e.address}`:e.address}async check(e){let t=this.commandEpoch,n=e.name?.trim()||e.entrypoint,r=T(e);if(r){let e=`web-${Date.now()}-${this.nextRequest++}`;return this.emitConsole(`system`,`Compile requested · ${n}`,{action:`validate`,phase:`request`,requestId:e}),this.emitConsole(`system`,`Compilation failed · ${r.message}`,{action:`validate`,phase:`error`,requestId:e}),{ok:!1,detail:r.message,compilerOutput:[r.message]}}await this.pausePollingForCommand();try{this.assertCommandEpoch(t);let r=await this.command(`check`,{project:e},{action:`validate`,label:`Compile`,detail:n});return{ok:!0,detail:r.detail,compilerOutput:[r.detail]}}catch(t){if(t instanceof F&&t.code===`syntax_error`)return{ok:!1,detail:t.message,compilerOutput:[t.message],diagnostics:E(t.message,{phase:`compile`,code:`syntax_error`,projectPaths:Object.keys(e.files)})};throw t}finally{this.resumePollingAfterCommand(0,t)}}async synchronize(e,t){this.assertRunDataCollected();let n=this.commandEpoch;if(this.currentState===`loading`||this.currentState===`running`)throw new F(`program_active`,`Stop the current run before preparing a Project.`);let r=T(e);if(r)throw this.emitConsole(`system`,`Prepare failed · ${r.message}`,{action:`prepare`,phase:`error`}),r;await this.pausePollingForCommand();try{this.assertCommandEpoch(n),await this.prepareWhilePollingPaused(e,{...await a(e),...t?{projectId:t}:{}}),this.stagedProjectId=t??null}finally{this.resumePollingAfterCommand(0,n)}}async run(e,t){this.assertRunDataCollected();let n=this.commandEpoch;w(e),this.assertRunTelemetrySupported();let r=t!==void 0&&t!==this.stagedProjectId;if(r&&(this.currentState===`loading`||this.currentState===`running`))throw new F(`program_active`,`Stop the current run before running a different Project.`);this.stagedProject=e,this.stagedProjectId=t??null;let i={...await a(e),...t?{projectId:t}:{}};this.assertCommandEpoch(n),this.stagedRunDescriptor={...i,...t?{projectId:t}:{}};let o=!1;await this.pausePollingForCommand();try{if(this.assertCommandEpoch(n),!this.currentProject||this.currentProject.stale||i.revision!==this.currentProject.revision||i.name!==this.currentProject.name||i.entrypoint!==this.currentProject.entrypoint){if(!this.info?.capabilities.includes(`project.run`))throw new F(`capability_mismatch`,`This XRP needs the current course software before it can run edited projects reliably. Open First robot setup, update the XRP, then reconnect.`);o=await this.prepareAndStartWhilePollingPaused(e,i)}else{if(this.setCurrentProject(i),r){let t=S(e);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}o=await this.startCurrentProjectWhilePollingPaused()}o&&this.emit({type:`compile-result`,projectId:t,projectRevision:i.revision,result:{ok:!0,detail:`The Project compiled on the physical XRP.`,compilerOutput:[`The Project compiled on the physical XRP.`],diagnostics:[]}})}catch(n){throw n instanceof F&&n.code===`syntax_error`&&this.emit({type:`compile-result`,projectId:t,projectRevision:i.revision,runId:n.context.requestId,result:{ok:!1,detail:n.message,compilerOutput:[n.message],diagnostics:E(n.message,{phase:`compile`,code:`syntax_error`,projectPaths:Object.keys(e.files)})}}),n}finally{this.resumePollingAfterCommand(o?ot:0,n)}}async runCurrent(){this.assertRunDataCollected(),this.assertRunTelemetrySupported();let e=this.commandEpoch;if(this.projectRunProvider){let t=this.projectRunProvider,n=await new Promise((e,n)=>{let r=!1,i=e=>{r||(r=!0,clearTimeout(o),this.pendingSnapshotCancels.delete(a),e())},a=()=>i(()=>n(Error(`Run cancelled before the IDE supplied its project.`))),o=setTimeout(()=>i(()=>n(Error(`The active IDE has not replied yet. Let its current operation finish, then try Run again. Its project remains selected.`))),Qe);this.pendingSnapshotCancels.add(a),Promise.resolve().then(t).then(t=>i(()=>e(t)),e=>i(()=>n(e)))});this.assertCommandEpoch(e),await this.run(n.project,n.projectId);return}if(this.stagedProject&&(!this.currentProject||this.currentProject.stale)){await this.run(this.stagedProject,this.stagedProjectId??void 0);return}if(!this.currentProject){let e=new F(`no_project`,`No project is ready. Run or prepare a project in the IDE first.`);throw this.emitConsole(`system`,`Run failed · ${e.message}`,{action:`run`,phase:`error`}),e}if(this.currentProject.stale){let e=new F(`stale_project`,`The IDE project has changed. Run or prepare it in the IDE first.`);throw this.emitConsole(`system`,`Run failed · ${e.message}`,{action:`run`,phase:`error`}),e}if(this.currentState===`loading`||this.currentState===`running`){this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`});return}let t=!1;await this.pausePollingForCommand();try{this.assertCommandEpoch(e),this.stagedRunDescriptor=this.currentProject,t=await this.startCurrentProjectWhilePollingPaused()}finally{this.resumePollingAfterCommand(t?ot:0,e)}}async prepareWhilePollingPaused(e,t){this.assertRunDataCollected();let n=this.commandEpoch,r=t??await a(e);this.assertCommandEpoch(n);let i=S(e),o;try{if(o=await this.command(`prepare`,{project:e},{action:`prepare`,label:`Prepare`,detail:r.name},void 0,!0),o.project?.revision!==r.revision||o.project.lifetime!==`boot`)throw new F(`project_revision_mismatch`,`The XRP prepared a different project revision`)}catch(e){if(!(e instanceof F&&(e.code===`network_error`||e.code===`timeout`)))throw e;let t=await this.getJson(`/api/v1/info`,1500);if(this.assertCommandEpoch(n),Tt(t),K(t,this.expectedRobotId),t.bootId!==this.bootId)throw new F(`boot_changed`,`The XRP restarted while preparing. Reconnect before trying again.`);if(t.project?.revision!==r.revision)throw e;o={detail:`Project prepared`,project:{...t.project,revision:r.revision,lifetime:`boot`}},this.emitConsole(`system`,`Prepare verified · ${r.name} is ready in XRP memory`,{action:`prepare`,phase:`result`})}this.setCurrentProject({...r,revision:o.project.revision,name:o.project.name??r.name,entrypoint:o.project.entrypoint??r.entrypoint,stale:!1}),this.emitStatus(`ready`,o.detail),this.stagedProject=e,this.emit({type:`world`,catalog:i,selectedWorldId:i.defaultWorldId})}async startCurrentProjectWhilePollingPaused(){if(this.assertRunDataCollected(),!this.currentProject)throw new F(`no_project`,`No project is ready. Run or prepare a project in the IDE first.`);if(this.currentProject.stale)throw new F(`stale_project`,`The IDE project has changed. Run or prepare it in the IDE first.`);if(this.currentState===`loading`||this.currentState===`running`)return this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`}),!1;let e=this.currentState;this.emitStatus(`loading`,`Starting ${this.currentProject.entrypoint}…`);try{let e=await this.command(`run`,{},{action:`run`,label:`Run`,detail:this.currentProject.name},void 0,!0);return e.runId!==this.lastRunId&&(this.lastSampleSeq=0),this.lastRunId=e.runId,this.bindRunOutputIdentity(e),this.unsettledLaunch=!1,this.emitStatus(`loading`,e.detail),!0}catch(t){throw t instanceof F&&t.code===`operation_cancelled`||(t instanceof F&&(t.code===`network_error`||t.code===`timeout`)?this.emitStatus(`error`,t.message):this.emitStatus(e,`Run failed · ${R(t)}`)),t}}async prepareAndStartWhilePollingPaused(e,t){if(this.assertRunDataCollected(),this.currentState===`loading`||this.currentState===`running`)return this.emitConsole(`system`,`Run request ignored · program already active`,{action:`run`,phase:`result`}),!1;let n=this.currentState;this.emitStatus(`loading`,`Compiling and starting ${t.entrypoint}…`);try{let n=await this.command(`run`,{project:e},{action:`run`,label:`Run`,detail:t.name},void 0,!0);if(n.project?.revision!==t.revision||n.project.lifetime!==`boot`)throw new F(`project_revision_mismatch`,`The XRP started a different project revision`);this.setCurrentProject({...t,revision:n.project.revision,name:n.project.name??t.name,entrypoint:n.project.entrypoint??t.entrypoint,stale:!1}),this.stagedProject=e;let r=S(e);return this.emit({type:`world`,catalog:r,selectedWorldId:r.defaultWorldId}),n.runId!==this.lastRunId&&(this.lastSampleSeq=0),this.lastRunId=n.runId,this.bindRunOutputIdentity(n),this.unsettledLaunch=!1,this.emitStatus(`loading`,`Starting ${t.entrypoint}`),!0}catch(e){throw e instanceof F&&e.code===`operation_cancelled`||(e instanceof F&&(e.code===`network_error`||e.code===`timeout`)?this.emitStatus(`error`,e.message):this.emitStatus(n,`Run failed · ${R(e)}`)),e}}async markProjectStale(e,t){let n=await a(e),r=this.currentProject?.stale===!1&&this.currentProject.revision===n.revision&&this.currentProject.name===n.name&&this.currentProject.entrypoint===n.entrypoint,i=t!==void 0&&t!==this.stagedProjectId,o=this.stagedProject===null||this.stagedProject.files[`world.json`]!==e.files[`world.json`]||i;if(o&&(this.currentState===`loading`||this.currentState===`running`))throw new F(`program_active`,`Stop the current run before opening a different Project or world.`);if(this.stagedProject=e,this.stagedProjectId=t??null,this.setCurrentProject({...n,...t?{projectId:t}:{},stale:!r}),o){let t=S(e);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}}setProjectRunProvider(e,t){this.projectRunProvider=e,this.connected&&this.emit({type:`project-provider`,active:e!==null,available:e!==null})}markProjectChanged(e){if((this.currentState===`loading`||this.currentState===`running`)&&(this.stagedProjectId===null||e.projectId!==this.stagedProjectId))return;let t=`ide:${e.projectId}:`;this.currentProject?.stale&&this.currentProject.revision===`${t}${e.revision}`&&this.currentProject.name===e.name&&this.currentProject.entrypoint===e.entrypoint||this.setCurrentProject({projectId:e.projectId,name:e.name,entrypoint:e.entrypoint,revision:`${t}${e.revision}`,stale:!0})}stop(){return this.pendingStop||=this.performStop().finally(()=>{this.pendingStop=null}),this.pendingStop}async performStop(){this.interruptPendingCommands();let e=this.commandEpoch;this.emitStatus(`loading`,this.unsettledLaunch?`Stop requested; resolving the pending Run…`:`Stop requested; checking the XRP…`),this.reconnecting=!0,await this.pausePollingForCommand(!1);try{await Promise.allSettled([...this.commandsInFlight]),await this.resolveUnsettledLaunch();let e=await this.command(`stop`,{},{action:`stop`,label:`Stop`},void 0,!0);e.reconnecting?(this.emitStatus(`connecting`,`${e.detail}; reconnecting…`),await this.reconnectAfterReset()):e.detail===`Program already stopped`&&this.lastRunId===0&&!this.currentRun?this.emitStatus(`ready`,e.detail):(this.emitStatus(`loading`,e.detail),await this.waitForProgramStop())}catch(t){if(e!==this.commandEpoch||!this.connected)throw t;if(t instanceof F&&(t.code===`network_error`||t.code===`timeout`)){this.emitConsole(`system`,`Stop reply was interrupted · checking XRP state`,{action:`stop`,phase:`error`}),this.emitStatus(`connecting`,`Stop reply was interrupted; checking the XRP…`);try{await this.recoverAfterInterruptedStop();return}catch(n){if(e!==this.commandEpoch||!this.connected)throw n;t=n}}throw this.emitConsole(`system`,`Stop recovery failed · ${R(t)}`,{action:`stop`,phase:`error`}),this.emitStatus(this.collectingStoppedRun?`loading`:`error`,R(t)),t}finally{e===this.commandEpoch&&(this.reconnecting=!1),this.resumePollingAfterCommand(0,e)}}async reset(){this.interruptPendingCommands();let e=this.commandEpoch;this.emitStatus(`loading`,this.commandsInFlight.size>0?`Reset requested; waiting for the pending XRP request to settle…`:`Reset requested; checking the XRP…`),this.reconnecting=!0,await this.pausePollingForCommand();try{await Promise.allSettled([...this.commandsInFlight]),await this.resolveUnsettledLaunch(),await this.acquireControl(!1),(this.lastRunId>0||this.currentRun&&this.currentRun.finishedAtMs===void 0)&&(this.emitStatus(`loading`,`Stopping the program and collecting final run data before Reset…`),(await this.command(`stop`,{},{action:`stop`,label:`Stop before Reset`},void 0,!0)).reconnecting?await this.reconnectAfterReset():await this.waitForProgramStop());let e=await this.command(`reset`,{},{action:`reset`,label:`Reset`});e.reconnecting?(this.emitStatus(`connecting`,`${e.detail}; reconnecting…`),await this.reconnectAfterReset()):(e.detail===`Program state reset`?this.emitStatus(`ready`,e.detail):(this.emitStatus(`loading`,e.detail),await this.waitForProgramStop()),this.lastSampleSeq=0)}catch(t){throw e!==this.commandEpoch||!this.connected?t:(this.emitConsole(`system`,`Reset recovery failed · ${R(t)}`,{action:`reset`,phase:`error`}),this.emitStatus(this.collectingStoppedRun?`loading`:`error`,R(t)),t)}finally{e===this.commandEpoch&&(this.reconnecting=!1),this.resumePollingAfterCommand(0,e)}}async setRuntimeParameter(e,t){let n=this.commandEpoch;if(!this.info?.capabilities.includes(`runtime.parameters`))throw new F(`capability_mismatch`,`This XRP service does not yet support live parameters`);await this.pausePollingForCommand();try{this.assertCommandEpoch(n);let r=await this.command(`parameter`,{name:e,value:t},{action:`parameter`,label:`Live parameter`,detail:e});this.consumeRuntimeState(r.runtimeJson)}finally{this.resumePollingAfterCommand(0,n)}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}command(e,t,n,r,i=!1){let a=this.performCommand(e,t,n,r,i);return this.commandsInFlight.add(a),a.finally(()=>this.commandsInFlight.delete(a))}async performCommand(e,t,n,r,i=!1){let a=this.commandEpoch;if(!this.connected)throw new F(`not_connected`,`Physical XRP is not connected`);e!==`control`&&e!==`stop`&&e!==`check`&&(await this.acquireControl(!1),this.assertCommandEpoch(a)),e===`run`&&this.assertRunTelemetrySupported();let o=`web-${this.eventSession}-${this.nextRequest++}`,s=this.bootId;n&&this.emitConsole(`system`,`${n.label} requested${n.detail?` · ${n.detail}`:``}`,{action:n.action,phase:`request`,requestId:o});try{let c=this.info?.capabilities.includes(`control.session-v1`)&&e!==`control`?{bootId:this.bootId,sessionId:this.controlSessionId,controlGeneration:this.control?.generation,runId:this.lastRunId,...e===`run`&&!t.project?{expectedProjectRevision:this.currentProject?.revision}:{}}:{},l=JSON.stringify({...t,...c,requestId:o}),u=this.info?.limits?.maxWorldBytes,d=t.project?.files[`world.json`];if(u!==void 0&&d!==void 0&&new TextEncoder().encode(d).byteLength>u)throw new F(`project_too_large`,`world.json exceeds this XRP's ${u}-byte limit. Simplify the world before running.`);let f=this.info?.limits?.maxRequestBodyBytes;if(f!==void 0&&new TextEncoder().encode(l).byteLength>f)throw new F(`project_too_large`,`This request exceeds the XRP's ${f}-byte limit. Remove unnecessary project files before running.`);let p=null;e===`run`&&(this.unsettledLaunch=!0);for(let t=0;t<(i?2:1);t+=1){this.assertCommandEpoch(a),e===`run`&&this.assertRunTelemetrySupported();try{let t=this.fetchJson(`/api/v1/${e}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:l},this.requestTimeoutMs,r);p=e===`run`?await t:await this.waitForCommand(t,a),this.assertCommandEpoch(a);break}catch(e){if(this.assertCommandEpoch(a),!(e instanceof F&&(e.code===`network_error`||e.code===`timeout`))||!i||t>0)throw e;n&&this.emitConsole(`system`,`${n.label} reply interrupted · retrying the same request`,{action:n.action,phase:`request`,requestId:o})}}if(!p)throw new F(`network_error`,`The XRP did not return a ${e} reply`);if(p.requestId!==o)throw new F(`uncorrelated_reply`,`The XRP returned a reply for a different request`);if(!p.ok||!p.result)throw new F(p.error?.code??`target_error`,p.error?.detail??`The XRP rejected the request`,{requestId:o});if(e===`run`&&s&&`bootId`in c&&c.bootId===s&&this.bootId===s){let e=p.result;Number.isSafeInteger(e.runId)&&e.runId>0&&(this.pendingRunOutputIdentity={bootId:s,deviceRunId:e.runId,requestId:o,result:e,commandEpoch:a})}if(n){let e=p.result,t=typeof e.detail==`string`?e.detail:`accepted`;this.emitConsole(`system`,`${n.label} · ${t}`,{action:n.action,phase:`result`,requestId:o})}return p.result}catch(t){throw e===`run`&&t instanceof F&&t.code===`syntax_error`&&t.context.requestId!==o&&(t=new F(`uncorrelated_reply`,`The XRP returned a compiler result for an unknown or different request. Run the selected Project again.`)),n&&this.emitConsole(`system`,`${n.label} failed · ${R(t)}`,{action:n.action,phase:`error`,requestId:o}),t}}bindRunOutputIdentity(e){let t=this.pendingRunOutputIdentity;if(this.pendingRunOutputIdentity=null,t?.result===e&&t.commandEpoch===this.commandEpoch&&t.bootId===this.bootId&&t.requestId===this.currentRun?.runId){this.runOutputIdentity={bootId:t.bootId,deviceRunId:t.deviceRunId,requestId:t.requestId};let e={source:`physical`,clockId:`physical:${t.bootId}:${t.deviceRunId}`,firstSequence:1};this.currentRun={...this.currentRun,telemetryOrigin:e},this.emit({type:`telemetry-origin`,runId:t.requestId,origin:e})}}async getJson(e,t=this.requestTimeoutMs,n){return this.fetchJson(e,{method:`GET`},t,n)}async fetchJson(e,t,n=this.requestTimeoutMs,r){let i=r??new AbortController,a=setTimeout(()=>i.abort(),n);try{let n=await this.fetchImplementation(this.endpoint+e,{...L(this.endpoint,t),cache:`no-store`,signal:i.signal}),r=await n.json();if(!n.ok){let e=r,t=e?.error;throw new F(t?.code??`http_${n.status}`,t?.detail??`XRP request failed with HTTP ${n.status}`,typeof e.requestId==`string`?{requestId:e.requestId}:{})}return r}catch(e){throw e instanceof F?e:e instanceof DOMException&&e.name===`AbortError`?new F(`timeout`,`XRP did not reply within ${n/1e3} seconds. ${B(this.endpoint)}`):new F(`network_error`,`Cannot reach ${this.endpoint}: ${R(e)}. ${B(this.endpoint)}`)}finally{clearTimeout(a)}}schedulePoll(e=this.pollIntervalMs){if(this.stopPolling(),!this.connected||this.pollingPaused)return;let t=Math.max(0,e);if(this.pollDueAtMs=z()+t,this.pollDrivenByVisibleClient)return;let n=setTimeout(()=>{this.pollTimer===n&&(this.pollTimer=null,this.startScheduledPoll())},t);this.pollTimer=n}requestPollIfDue(){this.pollDueAtMs===null||z()<this.pollDueAtMs||this.startScheduledPoll()}startScheduledPoll(){if(!this.connected||this.pollingPaused||this.reconnecting||this.pollInFlight)return;this.stopPolling();let e=this.poll();this.pollInFlight=e,e.then(()=>{this.pollInFlight===e&&(this.pollInFlight=null)},()=>{this.pollInFlight===e&&(this.pollInFlight=null)})}stopPolling(){this.pollTimer!==null&&(clearTimeout(this.pollTimer),this.pollTimer=null),this.pollDueAtMs=null}abortActivePoll(){this.pollAbortController?.abort(),this.pollAbortController=null}async pausePollingForCommand(e=!0){let t=this.commandEpoch;this.pollingPaused=!0,this.pollGeneration+=1,this.stopPolling();let n=this.pollInFlight;n&&e&&await this.waitForCommand(n.catch(()=>void 0),t)}resumePollingAfterCommand(e=0,t=this.commandEpoch){t===this.commandEpoch&&(this.pollingPaused=!1,this.schedulePoll(e))}async poll(){if(!this.connected||this.reconnecting)return;let e=z(),t=this.pollGeneration,n=new AbortController;this.pollAbortController=n;try{let r=await this.readRecoverableState(this.requestTimeoutMs,()=>{if(!this.connected||this.reconnecting||t!==this.pollGeneration)throw new F(`operation_cancelled`,`An obsolete telemetry poll was cancelled`)},n);if(!this.connected||this.reconnecting||t!==this.pollGeneration)return;this.pollConnectionFailed&&(this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.emitConsole(`system`,`XRP connection restored`,{action:`telemetry`,phase:`result`})),this.consecutivePollFailures=0,this.consumeState(r);let i=r.moreLogs===!0||r.moreSamples===!0,a=r.state===`running`?this.activePollIntervalMs:this.pollIntervalMs,o=Math.max(0,z()-e);this.schedulePoll(i?0:Math.max(0,a-o))}catch(e){if(this.connected&&!this.reconnecting&&!this.pollingPaused&&t===this.pollGeneration){if(e instanceof F&&e.code===`telemetry_owner_active`){if(e.context.ownerGeneration===this.pollCoordinatorGeneration&&typeof e.context.leaseRemainingMs==`number`){let t=Math.max(0,e.context.leaseRemainingMs);this.pollConnectionFailed=!0,this.emitConsole(`system`,`A previous UCSBXRP page still owns telemetry; retrying automatically in at most ${t} ms`,{action:`telemetry`,phase:`error`}),this.emitStatus(`connecting`,`Waiting briefly for the previous page to release XRP telemetry…`),this.schedulePoll(t);return}this.pollConnectionFailed=!0,this.consecutivePollFailures=ct,this.emitConsole(`system`,`Telemetry paused · ${e.message}`,{action:`telemetry`,phase:`error`}),this.emitStatus(`error`,e.message);return}this.consecutivePollFailures+=1,this.pollConnectionFailed||(this.pollConnectionFailed=!0,this.emitConsole(`system`,`Telemetry connection interrupted · ${R(e)}`,{action:`telemetry`,phase:`error`})),this.consecutivePollFailures>=ct?this.emitStatus(this.collectingStoppedRun?`loading`:`error`,this.collectingStoppedRun?`Program stopped; final run data is still incomplete. Check the XRP connection and select Stop to retry collection.`:R(e)):(this.emitStatus(this.collectingStoppedRun?`loading`:`connecting`,this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Telemetry was interrupted; reconnecting to the XRP…`),this.schedulePoll(lt))}}finally{this.pollAbortController===n&&(this.pollAbortController=null)}}telemetryPath(e,t,n){let r=`/api/v1/telemetry?afterLogSeq=${e}&afterSampleSeq=${t}`;if(n!==void 0&&(r+=`&runId=${n}`),this.info?.capabilities.includes(`telemetry.packed-v1`)){r+=`&sampleEncoding=${V}`;let e=z(),t=this.lastPackedUpdatesAtMs===null||e-this.lastPackedUpdatesAtMs>=this.pollIntervalMs;r+=`&includeUpdates=${t?`1`:`0`}`,t&&(this.lastPackedUpdatesAtMs=e)}else this.info?.capabilities.includes(`telemetry.compact-v1`)&&(r+=`&sampleEncoding=${dt}`);return this.pollCoordinatorGeneration!==void 0&&this.pollOwnerId!==void 0&&(r+=`&pollGeneration=${this.pollCoordinatorGeneration}`,r+=`&pollOwner=${encodeURIComponent(this.pollOwnerId)}`),this.info?.capabilities.includes(`control.session-v1`)&&(n===void 0&&(r+=`&runId=${this.lastRunId}`),r+=`&bootId=${encodeURIComponent(this.bootId??``)}&sessionId=${encodeURIComponent(this.controlSessionId)}&controlGeneration=${this.control?.generation??0}`),r}async readTelemetry(e,t,n){let r=this.info?.capabilities.includes(`telemetry.packed-v1`)?await this.getPackedTelemetry(e,t,n):await this.getJson(e,t,n);if(r.pollOwnership?.accepted===!1){let e=r.pollOwnership.ownerGeneration,t=r.pollOwnership.leaseRemainingMs;throw new F(`telemetry_owner_active`,`Another UCSBXRP page is coordinating this robot${e===null?``:` (poll generation ${e})`}. Close or reload older UCSBXRP pages, then select Reconnect${typeof t==`number`?`; takeover is available in at most ${t} ms`:``}.`,{ownerGeneration:e,...typeof t==`number`?{leaseRemainingMs:t}:{}})}let i=r;if(i.sampleEncoding===V){let t=r;if(!(typeof t.bootId==`string`&&(t.state===`ready`||t.state===`loading`||t.state===`running`||t.state===`error`)&&typeof t.detail==`string`&&Number.isSafeInteger(t.runId)&&t.runId>=0&&Array.isArray(t.logs))){let n=this.bootId??this.info?.bootId;(!e.includes(`includeUpdates=0`)||!n||t.state!==`running`||!Number.isSafeInteger(t.runId)||t.runId<1)&&H(`packed-v1 state metadata is incomplete`),i={...t,bootId:n,state:`running`,detail:this.currentState===`running`?this.currentDetail:`Program running`,runId:t.runId,logs:[]}}}if(i.sampleEncoding===dt){Array.isArray(i.sampleRows)||H(`encoding or rows are unsupported`),i.sampleRows.length>ft&&H(`row-v1 exceeds the ${ft}-row page limit`),i.sampleRows.length>0&&i.sampleShared===void 0&&H(`shared values are missing`);let e=i.sampleRows.map(e=>xt(e,i.sampleShared));for(let t=1;t<e.length;t+=1)e[t].seq<=e[t-1].seq&&H(`row-v1 sequence values are not strictly increasing`);i.samples=e}else i.sampleEncoding!==void 0&&i.sampleEncoding!==V&&H(`encoding is unsupported`);try{let e=Je(i.samplePlots,i.samplePlotDescriptors,i.samples?.length??0);e&&(i.samples=i.samples?.map((t,n)=>({...t,plotValues:e[n]})))}catch{H(`samplePlots contains invalid or unaligned plot values`)}try{let e=`physical:${i.bootId}:${i.runId}`;if(i.samples){let t=i.sampleTiming??i.samples.map(e=>e.timingValues??null);i.samples=Xe(i.samples,t,i.sampleDiagnostics,e)}if(i.sample){let t=N(i.sample.timingValues,e);t&&(i.sample={...i.sample,timing:t})}}catch{H(`sample timing or diagnostics are invalid or unaligned`)}return i}async getPackedTelemetry(e,t,n){let r=n??new AbortController,i=setTimeout(()=>r.abort(),t);try{let t=await this.fetchImplementation(this.endpoint+e,{...L(this.endpoint,{method:`GET`}),cache:`no-store`,signal:r.signal});if(!t.ok){let e={};try{e=await t.json()}catch{}throw new F(e.error?.code??`http_${t.status}`,e.error?.detail??`XRP request failed with HTTP ${t.status}`)}let n=Ct(await t.arrayBuffer());return typeof n.bootId==`string`&&(this.lastPackedUpdatesAtMs=z()),n}catch(e){throw e instanceof F?e:e instanceof DOMException&&e.name===`AbortError`?new F(`timeout`,`XRP did not reply within ${t/1e3} seconds. ${B(this.endpoint)}`):new F(`network_error`,`Cannot reach ${this.endpoint}: ${R(e)}. ${B(this.endpoint)}`)}finally{clearTimeout(i)}}consumeState(e,t=!0){let n=e.bootId!==this.bootId,r=e.runId!==this.lastRunId;(n||r)&&this.lastRunId>0&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.emitStatus(`error`,`${n?`The XRP restarted`:`The XRP changed runs`} before its remaining data could be collected. This recording is incomplete.`,!0),this.runOutputIdentity&&(this.runOutputIdentity.bootId!==e.bootId||this.runOutputIdentity.deviceRunId!==e.runId)&&(this.runOutputIdentity=null),n&&(this.bootId=e.bootId,this.lastLogSeq=0,this.lastLogDeviceRunId=void 0),(n||r)&&(this.lastSampleSeq=0,this.collectingStoppedRun=!1),this.lastRunId=e.runId,this.consumeControl(e.control),this.consumeProjectManifest(e.project),this.consumeRuntimeState(e.runtimeJson);let i=e.state===`error`&&e.detail.toLowerCase().includes(`program stopped after an exception`),a=i?`ready`:e.state,o=e.samples!==void 0&&e.moreSamples===!1&&(a===`ready`||a===`error`),s=[];e.samples===void 0?e.sample&&(t&&this.emitTelemetry(e.sample),this.lastSampleSeq=e.sample.seq):(s=[...e.samples].sort((e,t)=>e.seq-t.seq),o||this.publishBatchedSamples(e.bootId,s,a===`running`||e.moreSamples===!0,t,(a===`ready`||a===`error`)&&e.moreSamples===!0));let c=[...e.logs].sort((e,t)=>e.seq-t.seq);for(let t of c){if(!Number.isSafeInteger(t.seq)||t.seq<=this.lastLogSeq)continue;let n=Number.isSafeInteger(t.runId)&&t.runId>=0?t.runId:void 0,r=this.runOutputIdentity;if(t.seq>this.lastLogSeq+1){let i=this.lastLogSeq+1,a=t.seq-1,o=a-i+1,s=r?.bootId===e.bootId&&r.deviceRunId===n&&this.lastLogDeviceRunId===n?r.requestId:void 0;s!==void 0&&this.currentRun?.runId===s&&this.currentRun.finishedAtMs===void 0&&(this.currentRun={...this.currentRun,droppedOutputLines:(this.currentRun.droppedOutputLines??0)+o}),this.emitConsole(`system`,`XRP log gap · ${o} line${a===i?``:`s`} unavailable`,{action:`telemetry`,phase:`error`,omittedOutputLines:o,eventId:`${e.bootId}:log-gap:${i}-${a}`,requestId:s,deviceBootId:e.bootId,deviceRunId:n})}this.lastLogSeq=t.seq,this.lastLogDeviceRunId=n,this.emitConsole(t.stream,t.line,{phase:t.stream===`system`?`result`:`output`,eventId:`${e.bootId}:log:${t.seq}`,targetTimeMs:t.tMs,targetClockId:`physical:${e.bootId}:service-uptime`,deviceBootId:e.bootId,deviceRunId:n,requestId:r&&n===r.deviceRunId&&r.requestId===this.currentRun?.runId?r.requestId:void 0})}a===`ready`&&e.moreLogs!==!0&&e.samples===void 0&&e.sample===void 0&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.info?.capabilities.includes(`control.session-v1`)&&this.control?.sessionId!==this.controlSessionId&&(this.collectingStoppedRun=!1,this.emitStatus(`error`,`The program stopped, but its final telemetry could not be collected after this browser lost control of the XRP. This recording is incomplete.`,!0));let l=(this.currentRun!==null&&this.currentRun.finishedAtMs===void 0||e.samples!==void 0||e.sample!==void 0)&&(a===`ready`||a===`error`)&&(e.moreLogs===!0||e.moreSamples===!0||this.collectingStoppedRun&&e.samples===void 0&&e.sample===void 0);if(this.collectingStoppedRun=a===`ready`&&l,this.collectingStoppedRun&&this.emitStatus(`loading`,`Program stopped; collecting final run data…`),!l)this.emitStatus(a,e.detail,a===`error`,i?`program`:void 0),o&&this.publishBatchedSamples(e.bootId,s,!1,t);else if(o){let e=s.at(-1)?.seq;e!==void 0&&Number.isSafeInteger(e)&&e>this.lastSampleSeq&&(this.lastSampleSeq=e)}}publishBatchedSamples(e,t,n,r=!0,i=!1){for(let a of t)if(!(!Number.isSafeInteger(a.seq)||a.seq<=this.lastSampleSeq)){if(r&&n&&a.seq>this.lastSampleSeq+1){let t=this.lastSampleSeq+1,n=a.seq-1,r=this.runOutputIdentity,i=r?.bootId===e&&r.deviceRunId===this.lastRunId?r.requestId:void 0;this.emitConsole(`system`,`Telemetry gap · ${n-t+1} sample${n===t?``:`s`} unavailable`,{action:`telemetry`,phase:`error`,eventId:`${e}:run:${this.lastRunId}:sample-gap:${t}-${n}`,requestId:i,deviceBootId:e,deviceRunId:this.lastRunId})}r&&this.emitTelemetry(a,i),this.lastSampleSeq=a.seq}}emitTelemetry(e,t=!1){this.emit({type:`telemetry`,replayed:t,sample:{...e,plotValues:e.plotValues?.map(e=>({...e}))??[]}})}async reconnectAfterReset(){let e=this.commandEpoch,t=this.bootId;this.stopPolling();let n=performance.now()+st,r=null;for(;performance.now()<n&&this.connected;){await new Promise(e=>setTimeout(e,450));try{let n=await this.getJson(`/api/v1/info`,1500);if(this.assertCommandEpoch(e),Tt(n),K(n,this.expectedRobotId),n.bootId===t){r=new F(`restart_pending`,`The XRP has not restarted yet`),this.emitStatus(`connecting`,`Waiting for the XRP to finish restarting…`);continue}this.reconcileReconnectedRun(n),this.info=n,this.bootId=n.bootId,this.lastRunId=n.runId??0,this.control=n.control??null,this.lastLogSeq=0,this.lastLogDeviceRunId=void 0,this.lastSampleSeq=0,this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeProjectManifest(n.project),this.consumeRuntimeState(n.runtimeJson);let i=await this.readInitialState(n);this.assertCommandEpoch(e);try{await this.acquireControl(!1)}catch(e){if(!(e instanceof F)||e.code!==`control_owned`)throw e}this.assertCommandEpoch(e),this.emitStatus(i?.state??`ready`,i?.detail??`${n.robotName} · ${n.address} · course ${n.courseRelease}`),this.emitConsole(`system`,`${n.robotName} reconnected and ready`,{action:`connect`,phase:`result`});let a=n.network?.mode,o=n.network?.address??n.address;(a===`access_point`||a===`station`)&&o&&this.emit({type:`physical-network`,mode:a,address:I(o),ssid:n.network?.ssid,...n.network?.requested_mode?{requestedMode:n.network.requested_mode}:{},...typeof n.network?.fallback==`boolean`?{fallback:n.network.fallback}:{},...n.robotId?{robotId:n.robotId}:{},...n.robotName?{hostname:n.robotName}:{}});return}catch(e){if(e instanceof F&&(e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`||e.code===`firmware_required`||e.code===`release_mismatch`||e.code===`protocol_mismatch`||e.code===`operation_cancelled`))throw e;r=e}}throw new F(`reconnect_failed`,`Physical XRP did not return after reset: ${R(r)}`)}reconcileReconnectedRun(e){let t=this.bootId!==null&&this.bootId!==e.bootId,n=e.runId!==void 0&&this.lastRunId>0&&this.lastRunId!==e.runId;!t&&!n||(this.currentRun&&this.currentRun.finishedAtMs===void 0&&this.emitStatus(`error`,`${t?`The XRP restarted`:`The XRP changed runs`} before its remaining data could be collected. This recording is incomplete.`,!0),t&&(this.lastLogSeq=0,this.lastLogDeviceRunId=void 0),this.lastSampleSeq=0,this.collectingStoppedRun=!1,this.runOutputIdentity=null,this.pendingRunOutputIdentity=null)}async resolveUnsettledLaunch(){if(!this.unsettledLaunch||!this.info?.capabilities.includes(`control.session-v1`))return;let e=await this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`);this.consumeState(e,!1),this.unsettledLaunch=!1}async readRecoverableState(e,t,n){let r=this.commandEpoch,i=t??(()=>this.assertCommandEpoch(r)),a=async()=>{let t=await this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`,e,n);if(i(),t.bootId===this.info?.bootId&&t.bootId===this.bootId&&t.runId===this.lastRunId&&(t.state===`ready`||t.state===`error`&&t.detail.toLowerCase().includes(`stopped after an exception`))&&t.control?.sessionId===null){this.consumeControl(t.control);try{return await this.acquireControl(!1),i(),await this.readTelemetry(this.telemetryPath(this.lastLogSeq,this.lastSampleSeq,this.lastRunId>0?this.lastRunId:void 0),e,n)}catch(t){if(i(),t instanceof F&&t.code===`control_owned`)return this.getJson(`/api/v1/state?afterLogSeq=${this.lastLogSeq}`,e,n);throw t}}return t};if(this.info?.capabilities.includes(`control.session-v1`)&&this.control?.sessionId!==this.controlSessionId)return a();try{return await this.readTelemetry(this.telemetryPath(this.lastLogSeq,this.lastSampleSeq,this.lastRunId>0?this.lastRunId:void 0),e,n)}catch(e){if(e instanceof F&&[`control_required`,`boot_changed`,`stale_run`].includes(e.code))return a();throw e}}async waitForProgramStop(e=!0){let t=this.commandEpoch,n=performance.now()+2e3,r=null,i=0;for(;performance.now()<n&&this.connected;){i>0&&await new Promise(e=>setTimeout(e,i)),this.assertCommandEpoch(t);try{let n=this.lastLogSeq,a=this.lastSampleSeq,o=await this.readRecoverableState(1e3);if(this.assertCommandEpoch(t),this.consumeState(o,e),i=(o.moreLogs===!0||o.moreSamples===!0)&&(this.lastLogSeq>n||this.lastSampleSeq>a)?0:100,(o.state===`ready`||o.state===`error`&&o.detail.toLowerCase().includes(`stopped after an exception`))&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun)return;if(o.state===`error`&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun){r=new F(`target_error`,o.detail);break}}catch(e){this.assertCommandEpoch(t),r=e;break}}this.assertCommandEpoch(t),this.emitStatus(this.collectingStoppedRun?`loading`:`connecting`,this.collectingStoppedRun?`Program stopped; recovering final run data…`:`Checking program stop…`);try{await this.recoverAfterInterruptedStop(e)}catch(e){throw this.collectingStoppedRun?e:r??e}}async recoverAfterInterruptedStop(e=!0){let t=this.commandEpoch;this.stopPolling();let n=performance.now()+st,r=null,i=0;for(;performance.now()<n&&this.connected;){i>0&&await new Promise(e=>setTimeout(e,i)),this.assertCommandEpoch(t),i=450;try{let n=this.lastLogSeq,a=this.lastSampleSeq,o=await this.readRecoverableState(1500);if(this.assertCommandEpoch(t),this.pollConnectionFailed=!1,this.consecutivePollFailures=0,this.consumeState(o,e),(o.moreLogs===!0||o.moreSamples===!0)&&(this.lastLogSeq>n||this.lastSampleSeq>a)&&(i=0),(o.state===`ready`||o.state===`error`&&o.detail.toLowerCase().includes(`stopped after an exception`))&&o.moreLogs!==!0&&o.moreSamples!==!0&&!this.collectingStoppedRun){this.emitConsole(`system`,`XRP stop state verified`,{action:`stop`,phase:`result`});return}o.state===`error`&&(r=new F(`target_error`,o.detail))}catch(e){this.assertCommandEpoch(t),r=e}}throw this.assertCommandEpoch(t),this.collectingStoppedRun?new F(`run_data_incomplete`,`The program stopped, but its remaining run data could not be collected. Check your connection to the XRP and select Stop to retry collection. A new run must wait to preserve this recording.`):new F(`reconnect_failed`,`Could not verify that the physical XRP stopped: ${R(r)}`)}emitStatus(e,t,n=!1,r){(this.currentState!==e||this.currentDetail!==t)&&(this.currentState=e,this.currentDetail=t,(e===`ready`||n)&&this.currentRun&&this.currentRun.finishedAtMs===void 0&&(this.currentRun={...this.currentRun,state:e,detail:t,...r?{failureDomain:r}:{},finishedAtMs:Date.now()},this.emit({...this.currentRun,type:`run`,phase:`end`})),this.emit({type:`status`,state:e,detail:t,timestampMs:Date.now()}),this.publishControl())}emitConsole(e,t,n={}){let r=n.eventId??this.nextConsoleEventId();if(n.action===`run`&&n.phase===`request`&&this.currentRun?.runId!==n.requestId){this.runOutputIdentity=null,this.pendingRunOutputIdentity=null;let e=this.stagedRunDescriptor??this.currentProject;this.currentRun={runId:n.requestId??r,startedAtMs:n.timestampMs??Date.now(),state:`loading`,detail:t,projectId:e?.projectId,projectName:e?.name,projectRevision:e?.revision,entrypoint:e?.entrypoint},this.emit({...this.currentRun,type:`run`,phase:`begin`})}this.emit({type:`console`,stream:e,line:t,...n,eventId:r,timestampMs:n.timestampMs??Date.now()})}nextConsoleEventId(){let e=`physical-${this.eventSession}-${this.nextEvent}`;return this.nextEvent+=1,e}consumeProjectManifest(e){if(e===void 0)return;if(e===null){if(this.currentProject?.stale)return;this.setCurrentProject(null);return}if(!e.revision){this.projectStateKnown||this.setCurrentProject(null);return}if(this.currentProject?.stale&&this.currentProject.revision!==e.revision)return;let t=e.name||e.entrypoint,n=this.currentProject?.revision===e.revision&&this.currentProject.name===t&&this.currentProject.entrypoint===e.entrypoint?this.currentProject.projectId:void 0;if(this.setCurrentProject({...n?{projectId:n}:{},name:t,entrypoint:e.entrypoint,revision:e.revision,stale:!1}),typeof e.worldJson==`string`&&e.worldJson!==this.lastWorldJson){this.lastWorldJson=e.worldJson;try{let t=ue(e.worldJson);this.emit({type:`world`,catalog:t,selectedWorldId:t.defaultWorldId})}catch(e){this.emitConsole(`system`,`The XRP project has an invalid world.json: ${R(e)}`,{phase:`error`})}}}setCurrentProject(e){this.projectStateKnown&&this.currentProject?.revision===e?.revision&&this.currentProject?.projectId===e?.projectId&&this.currentProject?.stale===e?.stale&&this.currentProject?.name===e?.name&&this.currentProject?.entrypoint===e?.entrypoint||(this.projectStateKnown=!0,this.currentProject=e,this.emit({type:`project`,project:e}))}consumeRuntimeState(e){if(e!==void 0&&e!==this.lastRuntimeJson){this.lastRuntimeJson=e;try{this.runtimeState=We(e)}catch{this.runtimeState=He}this.emit({type:`runtime`,state:this.runtimeState})}}emit(e){for(let t of this.listeners)t(e)}},kt=class{kind=`physical`;endpoint;options;direct=null;worker=null;listeners=new Set;pending=new Map;seenConsoleEventIds=new Set;consoleEventOrder=[];nextRequest=1;localNetworkPermissionPrimed=!1;pageLifecycleObserved=!1;releaseDepartureParticipant=null;pageWasHidden=!1;pageCacheSuspended=!1;visiblePollFrame=null;candidateEndpoints;discoveryTimeoutMs;directMode;directPollOwnerId=`page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;projectRunProvider=null;telemetryEnabled=!1;directRunAttempt=null;directState=`disconnected`;directControlOwned=!0;directDepartureStop=null;constructor(e,t={}){this.endpoint=I(e),this.options=t,this.candidateEndpoints=[...new Set([this.endpoint,...(t.candidateEndpoints??[]).map(I)])],this.discoveryTimeoutMs=t.discoveryTimeoutMs??1e3,this.directMode=!!t.fetch||!(`SharedWorker`in globalThis)}async connect(){if(this.observePageLifecycle(),this.directMode||this.direct){if(this.directDepartureStop&&await this.directDepartureStop,this.direct){await this.direct.connect(),this.startVisiblePollDriver();return}await this.connectDirectCandidate(),this.startVisiblePollDriver();return}if(!this.worker)try{this.worker=new SharedWorker(new URL(`/ucsbxrp/assets/physical-target.shared-worker-C9hXaU3M.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-physical-target-v19-${import.meta.url}`}),this.worker.port.onmessage=e=>this.handleWorkerMessage(e.data),this.worker.onerror=e=>{e.preventDefault(),this.releaseWorker(e.message?`Physical target worker failed: ${e.message}`:`Physical target worker failed`)},this.worker.port.start(),this.worker.port.postMessage({type:`set-role`,role:this.deliveryRole()})}catch(e){this.releaseWorker(R(e)),await this.useDirectClient().connect(),this.startVisiblePollDriver();return}let e=e=>this.request({type:`connect`,endpoints:e,discoveryTimeoutMs:this.discoveryTimeoutMs,expectedRobotId:this.options.expectedRobotId,providesProject:this.projectRunProvider!==null,role:this.deliveryRole()});try{await e(this.candidateEndpoints),this.startVisiblePollDriver();return}catch(e){if(!this.shouldPrimeLocalNetworkPermission(e))throw e}let t=await this.primeLocalNetworkPermission();await e(t?[t,...this.candidateEndpoints.filter(e=>e!==t)]:this.candidateEndpoints),this.startVisiblePollDriver()}disconnect(){if(this.pageCacheSuspended=!1,this.stopVisiblePollDriver(),this.stopObservingPageLifecycle(),this.direct){this.releaseDirectAfterDeparture();return}this.releaseWorker(`Physical target disconnected`)}async check(e){return this.direct?this.direct.check(e):await this.request({type:`check`,project:e})}async synchronize(e,t){if(this.direct){await this.direct.synchronize(e,t);return}await this.request({type:`prepare`,project:e,...t?{projectId:t}:{}})}async run(e,t){if(this.direct){await this.runDirect(()=>this.direct.run(e,t));return}await this.request({type:`run`,project:e,...t?{projectId:t}:{}})}async runCurrent(){if(this.direct){await this.runDirect(()=>this.direct.runCurrent());return}await this.request({type:`run-current`,requireCallerProvider:this.projectRunProvider!==null})}async markProjectStale(e,t){if(this.direct){await this.direct.markProjectStale(e,t);return}await this.request({type:`mark-project-stale`,project:e,...t?{projectId:t}:{}})}setProjectRunProvider(e,t){this.projectRunProvider=e,this.direct?.setProjectRunProvider(e,t),this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()}),this.worker?.port.postMessage({type:`set-project-run-provider`,providesProject:e!==null,takeover:t?.takeover===!0})}setTelemetryEnabled(e){this.telemetryEnabled=e,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()})}deliveryRole(){return this.telemetryEnabled||this.projectRunProvider===null?`monitor`:`ide`}markProjectChanged(e){if(this.direct){this.direct.markProjectChanged(e);return}this.worker?.port.postMessage({type:`mark-project-changed`,project:e})}async stop(){if(this.direct){await this.direct.stop();return}await this.request({type:`stop`})}async reset(){if(this.direct){await this.direct.reset();return}await this.request({type:`reset`})}async setRuntimeParameter(e,t){if(this.direct){await this.direct.setRuntimeParameter(e,t);return}await this.request({type:`set-runtime-parameter`,name:e,value:t})}async claimControl(){if(this.direct)return this.direct.claimControl();await this.request({type:`claim-control`})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}async runDirect(e){let t=this.directState===`running`||this.directState===`loading`?null:{pending:!0};t&&(this.directRunAttempt=t);try{await e()}finally{t&&(t.pending=!1,this.directRunAttempt===t&&this.directState===`ready`&&(this.directRunAttempt=null))}}releaseDirectAfterDeparture(){let e=this.direct;e&&(this.stopOnBeforeUnload(),this.directDepartureStop?this.directDepartureStop.then(()=>e.disconnect()):e.disconnect())}useDirectClient(){return this.direct||(this.direct=new Ot(this.endpoint,this.directTargetOptions()),this.direct.setProjectRunProvider(this.projectRunProvider),this.direct.subscribe(e=>this.emit(e))),this.direct}directTargetOptions(){return this.options.fetch||this.options.pollCoordinatorGeneration!==void 0?this.options:{...this.options,pollCoordinatorGeneration:19,pollOwnerId:this.directPollOwnerId}}async connectDirectCandidate(){let e=Error(`No XRP address is available`);for(let t of this.candidateEndpoints){let n=new Ot(t,{...this.directTargetOptions(),discoveryTimeoutMs:this.discoveryTimeoutMs,candidateEndpoints:void 0});n.setProjectRunProvider(this.projectRunProvider);let r=[],i=n.subscribe(e=>r.push(e));try{await n.connect(),i(),this.direct=n,n.subscribe(e=>this.emit(e));for(let e of r)this.emit(e);return}catch(t){i(),n.disconnect(),e=at(e,t)}}throw e}async primeLocalNetworkPermission(){if(this.localNetworkPermissionPrimed||typeof window>`u`||window.location.protocol!==`https:`||new URL(this.endpoint).protocol!==`http:`)return null;let e=Error(`No XRP address is available`);for(let t of this.candidateEndpoints){let n=new AbortController,r=setTimeout(()=>n.abort(),this.discoveryTimeoutMs);try{let e=await globalThis.fetch(`${t}/api/v1/info`,L(t,{cache:`no-store`,method:`GET`,signal:n.signal},window.location.protocol));if(!e.ok)throw Error(`XRP returned HTTP ${e.status}`);return this.options.expectedRobotId&&K(await e.json(),this.options.expectedRobotId),this.localNetworkPermissionPrimed=!0,t}catch(t){e=at(e,t)}finally{clearTimeout(r)}}throw e instanceof F&&(e.code===`robot_identity_mismatch`||e.code===`robot_identity_missing`)?e:new F(`network_error`,`${e instanceof DOMException&&e.name===`AbortError`?`Known XRP addresses did not reply within ${this.discoveryTimeoutMs/1e3} second per address`:`Cannot reach a known XRP address: ${R(e)}`}. ${B(this.endpoint)}`)}shouldPrimeLocalNetworkPermission(e){return e instanceof F&&(e.code===`network_error`||e.code===`timeout`)&&!this.localNetworkPermissionPrimed&&typeof window<`u`&&window.location.protocol===`https:`&&this.candidateEndpoints.some(e=>new URL(e).protocol===`http:`)}request(e){if(!this.worker)return Promise.reject(Error(`Physical target is not connected`));let t=`physical-${this.nextRequest}`;return this.nextRequest+=1,new Promise((n,r)=>{this.pending.set(t,{resolve:n,reject:r}),this.worker?.port.postMessage({...e,requestId:t})})}handleWorkerMessage(e){if(e.type===`project-run-snapshot-request`){let t=this.worker,n=this.projectRunProvider;Promise.resolve().then(()=>{if(!n)throw Error(`The IDE is not ready to provide its current project.`);return n()}).then(n=>{t&&t===this.worker&&t.port.postMessage({type:`project-run-snapshot`,requestId:e.requestId,snapshot:n})},n=>{t&&t===this.worker&&t.port.postMessage({type:`project-run-snapshot`,requestId:e.requestId,error:R(n)})});return}if(e.type===`telemetry-batch`){for(let t of e.events)this.emit({...t,replayed:e.replayed||t.replayed===!0});return}if(e.type===`event`){this.emit(e.event);return}let t=this.pending.get(e.requestId);t&&(this.pending.delete(e.requestId),e.ok?t.resolve(e.result):t.reject(new F(e.errorCode??`worker_request_failed`,e.error)))}releaseWorker(e){this.stopVisiblePollDriver();let t=this.worker;if(this.worker=null,this.rejectPending(e),t)try{t.port.postMessage({type:`disconnect`})}catch{}finally{setTimeout(()=>t.port.close(),100)}}releaseOnPageHide=e=>{if(!e.persisted){this.disconnect();return}this.pageCacheSuspended=!0,this.stopVisiblePollDriver(),this.direct?this.releaseDirectAfterDeparture():this.releaseWorker(`Physical target suspended in browser history`)};stopOnBeforeUnload=()=>{if(this.direct){if(!this.directRunAttempt||this.directDepartureStop)return;if(!this.directControlOwned){this.directRunAttempt.pending&&this.direct.interruptPendingCommands();return}this.directDepartureStop=this.direct.stop().catch(()=>void 0).finally(()=>{this.directDepartureStop=null});return}this.worker?.port.postMessage({type:`stop-owned-run`})};resumeOnPageShow=e=>{if(e.persisted){if(!this.pageCacheSuspended){this.requestResumeRecovery(`pageshow`);return}this.pageCacheSuspended=!1,this.connect().catch(e=>{this.emit({type:`status`,state:`error`,detail:R(e)})})}};resumeOnVisibilityChange=()=>{if(document.visibilityState===`hidden`){this.stopVisiblePollDriver(),this.pageWasHidden=!0;return}this.startVisiblePollDriver(),this.pageWasHidden&&(this.pageWasHidden=!1,this.requestResumeRecovery(`visibilitychange`))};resumeOnOnline=()=>{this.pageIsVisible()&&this.requestResumeRecovery(`online`)};resumeOnFocus=()=>{this.pageIsVisible()&&this.requestResumeRecovery(`focus`)};pageIsVisible(){return typeof document>`u`||document.visibilityState!==`hidden`}driveVisiblePoll=()=>{this.visiblePollFrame=null,!(!this.pageIsVisible()||this.pageCacheSuspended)&&(this.direct?this.direct.requestPollIfDue():this.worker?.port.postMessage({type:`poll-frame`}),this.startVisiblePollDriver())};startVisiblePollDriver(){this.visiblePollFrame!==null||!this.worker&&!this.direct||!this.pageIsVisible()||typeof window>`u`||typeof window.requestAnimationFrame!=`function`||(this.visiblePollFrame=window.requestAnimationFrame(this.driveVisiblePoll))}stopVisiblePollDriver(){if(this.visiblePollFrame===null||typeof window>`u`||typeof window.cancelAnimationFrame!=`function`){this.visiblePollFrame=null;return}window.cancelAnimationFrame(this.visiblePollFrame),this.visiblePollFrame=null}requestResumeRecovery(e){!this.worker||typeof navigator<`u`&&navigator.onLine===!1||this.worker.port.postMessage({type:`resume`,reason:e})}observePageLifecycle(){this.pageLifecycleObserved||typeof window>`u`||typeof window.addEventListener!=`function`||(window.addEventListener(`pagehide`,this.releaseOnPageHide),this.releaseDepartureParticipant=m({cancel:this.stopOnBeforeUnload}),window.addEventListener(`pageshow`,this.resumeOnPageShow),window.addEventListener(`online`,this.resumeOnOnline),window.addEventListener(`focus`,this.resumeOnFocus),typeof document<`u`&&typeof document.addEventListener==`function`&&(this.pageWasHidden=document.visibilityState===`hidden`,document.addEventListener(`visibilitychange`,this.resumeOnVisibilityChange)),this.pageLifecycleObserved=!0)}stopObservingPageLifecycle(){!this.pageLifecycleObserved||typeof window>`u`||typeof window.removeEventListener!=`function`||(window.removeEventListener(`pagehide`,this.releaseOnPageHide),this.releaseDepartureParticipant?.(),this.releaseDepartureParticipant=null,window.removeEventListener(`pageshow`,this.resumeOnPageShow),window.removeEventListener(`online`,this.resumeOnOnline),window.removeEventListener(`focus`,this.resumeOnFocus),typeof document<`u`&&typeof document.removeEventListener==`function`&&document.removeEventListener(`visibilitychange`,this.resumeOnVisibilityChange),this.pageWasHidden=!1,this.pageLifecycleObserved=!1)}rejectPending(e){for(let t of this.pending.values())t.reject(Error(e));this.pending.clear()}emit(e){if(this.direct&&(e.type===`status`?(this.directState=e.state,e.state===`ready`&&!this.directRunAttempt?.pending&&(this.directRunAttempt=null)):e.type===`run`&&e.phase===`end`?this.directRunAttempt=null:e.type===`control`&&(this.directControlOwned=e.owned,!e.owned&&!this.directRunAttempt?.pending&&(this.directRunAttempt=null))),e.type===`console`&&e.eventId){if(this.seenConsoleEventIds.has(e.eventId))return;if(this.seenConsoleEventIds.add(e.eventId),this.consoleEventOrder.push(e.eventId),this.consoleEventOrder.length>4e3){let e=this.consoleEventOrder.shift();e&&this.seenConsoleEventIds.delete(e)}}for(let t of this.listeners)t(e)}},q=2500,J=15e3,At=2e3;function jt(){return new Worker(new URL(`/ucsbxrp/assets/micropython.worker-29IVaXvp.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-micropython-syntax-check`})}function Mt(e,t,n){if(e.diagnostics!==void 0)return e.diagnostics;let r={phase:e.stage===`run`?`runtime`:`compile`,projectPaths:Object.keys(n.files)},i=E(e.detail,r),a=E(t.join(`
`),r);return a[0]?.path&&!i.some(e=>e.path)?a:i.length>0?i:a}function Nt(e){let t=T(e);if(t)return{result:Promise.resolve({ok:!1,detail:t.message,compilerOutput:[t.message],diagnostics:[{source:`project`,phase:`compile`,severity:`error`,code:t.code,message:t.message,raw:[t.message]}]}),cancel(){}};let n=null,r=null,i=!1,a=!1,o=null,s=[],c=()=>{r!==null&&clearTimeout(r),r=null,n?.terminate(),n=null};return{result:new Promise((t,l)=>{o=l;let u=e=>{i||(i=!0,c(),t(e))},d=e=>{i||(i=!0,c(),l(e))};try{n=jt()}catch(e){d(Error(e instanceof Error?e.message:`MicroPython project checker could not start`));return}r=setTimeout(()=>{d(Error(`MicroPython runtime did not finish loading within ${J/1e3} seconds. Check the connection or offline setup, then try Compile again.`))},J),n.onmessage=t=>{let n=t.data;if(n.type===`runtime-ready`&&!a){a=!0,r!==null&&clearTimeout(r),r=setTimeout(()=>d(Error(`MicroPython project check timed out after ${q/1e3} seconds`)),q);return}if(n.type===`console`){s.length<At&&s.push(n.line);return}if(n.type===`check-complete`){let e=n.diagnostics??[];u({ok:!0,detail:n.detail,compilerOutput:[...s,n.detail],...e.length>0?{diagnostics:e}:{},...s.length>0?{output:s}:{}});return}if(n.type===`error`){let t=Mt(n,s,e),r=n.rawDetail??n.detail;u({ok:!1,detail:n.detail,compilerOutput:[...s,r],...t.length>0?{diagnostics:t}:{},...s.length>0?{output:s}:{}})}},n.onerror=e=>{d(Error(e.message||`MicroPython project checker failed`))},n.onmessageerror=()=>{d(Error(`MicroPython project checker returned invalid data`))};try{n.postMessage({mode:`check`,project:e})}catch(e){d(Error(e instanceof Error?e.message:`MicroPython project checker could not receive the project`))}}),cancel(e=`MicroPython project check was cancelled`){i||(i=!0,c(),o?.(Error(e)))}}}function Pt(e){return Nt(e).result}function Y(e){return e instanceof Error?e.message:String(e)}async function Ft(e){let t=T(e);return t?{ok:!1,detail:t.message,output:[]}:new Promise((t,n)=>{let r=new Worker(new URL(`/ucsbxrp/assets/micropython.worker-29IVaXvp.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-component-checks`}),i=[],a=()=>{clearTimeout(s),r.terminate()},o=!1,s=setTimeout(()=>{a(),n(Error(`MicroPython runtime did not finish loading. Check the connection or offline setup, then try component checks again.`))},J);r.onmessage=e=>{let r=e.data;if(r.type===`runtime-ready`&&!o)o=!0,clearTimeout(s),s=setTimeout(()=>{a(),n(Error(`Component checks timed out`))},q);else if(r.type===`console`)i.length<2e3&&i.push(r.line);else if(r.type===`test-complete`)a(),t({ok:!0,detail:r.detail,output:i});else if(r.type===`error`){let e=r.diagnostics??[];a(),t({ok:!1,detail:r.detail,...e.length>0?{diagnostics:e}:{},output:i})}},r.onerror=e=>{a(),n(Error(e.message||`Component checker failed`))},r.postMessage({mode:`test`,project:e})})}var It=class{kind=`virtual`;worker=null;runtimeWorker=null;activeRunId=null;syntaxChecks=new Set;listeners=new Set;pending=new Map;clientId=crypto.randomUUID();nextRequest=1;nextAction=1;runHeartbeat=null;liveValues=null;projectRunProvider=null;telemetryEnabled=!1;pageLifecycleObserved=!1;pageCacheSuspended=!1;releaseDepartureParticipant=null;operationEpoch=0;cancellation=null;runtimeStartupTimeout=null;async connect(){if(this.observePageLifecycle(),this.worker)return;if(!(`SharedWorker`in globalThis))throw Error(`This browser does not support the virtual target worker`);let e=new SharedWorker(new URL(`/ucsbxrp/assets/virtual-target.shared-worker-OLuf5TJc.js`,``+import.meta.url),{type:`module`,name:`ucsb-xrp-virtual-target-v6-${import.meta.url}`});this.worker=e,e.port.onmessage=t=>{this.worker===e&&this.handleMessage(t.data)},e.port.start(),await this.request({type:`connect`,providesProject:this.projectRunProvider!==null,role:this.deliveryRole()})}disconnect(){this.pageCacheSuspended=!1,this.stopObservingPageLifecycle(),this.releaseConnection(`Virtual target disconnected`)}releaseConnection(e){this.operationEpoch+=1;let t=this.worker;t&&this.runtimeWorker&&t.port.postMessage({type:`stop`,requestId:`disconnect-${this.nextRequest}`}),this.terminateRuntime();for(let t of this.syntaxChecks)t.cancel(e);this.syntaxChecks.clear(),this.worker=null;for(let t of this.pending.values())clearTimeout(t.timeout),t.reject(Error(e));if(this.pending.clear(),t)try{t.port.postMessage({type:`disconnect`})}finally{setTimeout(()=>t.port.close(),100)}}releaseOnPageHide=e=>{if(!e.persisted){this.disconnect();return}this.pageCacheSuspended=!0,this.releaseConnection(`Virtual target suspended in browser history`)};resumeOnPageShow=e=>{if(!e.persisted||!this.pageCacheSuspended)return;this.pageCacheSuspended=!1;let t=this.operationEpoch;this.connect().catch(e=>{this.operationEpoch===t&&this.emit({type:`status`,state:`error`,detail:Y(e)})})};stopOnBeforeUnload=()=>{this.operationEpoch+=1,this.terminateRuntime(),this.worker?.port.postMessage({type:`stop-owned-run`})};observePageLifecycle(){this.pageLifecycleObserved||typeof window>`u`||typeof window.addEventListener!=`function`||(window.addEventListener(`pagehide`,this.releaseOnPageHide),window.addEventListener(`pageshow`,this.resumeOnPageShow),this.releaseDepartureParticipant=m({cancel:this.stopOnBeforeUnload}),this.pageLifecycleObserved=!0)}stopObservingPageLifecycle(){!this.pageLifecycleObserved||typeof window>`u`||typeof window.removeEventListener!=`function`||(window.removeEventListener(`pagehide`,this.releaseOnPageHide),window.removeEventListener(`pageshow`,this.resumeOnPageShow),this.releaseDepartureParticipant?.(),this.releaseDepartureParticipant=null,this.pageLifecycleObserved=!1)}async check(e){let t=e.name?.trim()||e.entrypoint,n=`virtual-validate-${this.clientId}-${this.nextAction++}`;this.publishConsole({type:`console`,stream:`system`,line:`Compile requested · ${t}`,action:`validate`,phase:`request`,requestId:n});let r=T(e);if(r){let e={ok:!1,detail:r.message};return this.publishConsole({type:`console`,stream:`system`,line:`Compilation failed · ${e.detail}`,action:`validate`,phase:`error`,requestId:n}),e}try{let t=Nt(e);this.syntaxChecks.add(t);let r;try{r=await t.result}finally{this.syntaxChecks.delete(t)}return this.publishConsole({type:`console`,stream:`system`,line:`${r.ok?`Compilation passed`:`Compilation failed`} · ${r.detail}`,action:`validate`,phase:r.ok?`result`:`error`,requestId:n}),r}catch(e){throw this.publishConsole({type:`console`,stream:`system`,line:`Compilation could not finish · ${Y(e)}`,action:`validate`,phase:`error`,requestId:n}),e}}async run(e,t){w(e),await this.withRunReservation(async(n,r)=>{let i=await a(e);this.assertOperation(r),await this.startRun({type:`prepare-run`,operationEpoch:n,project:e,descriptor:i,...t?{projectId:t}:{}},r)})}async runCurrent(){await this.withRunReservation(async(e,t)=>{let n=await this.request({type:`get-project`,requireCallerProvider:this.projectRunProvider!==null});if(!n.project||!n.descriptor)throw Error(`No project is ready. Open a project in the IDE first.`);w(n.project);let r=await a(n.project);if(this.assertOperation(t),!(n.projectId===n.storedProjectId&&!n.descriptor.stale&&n.descriptor.revision===r.revision&&n.descriptor.name===r.name&&n.descriptor.entrypoint===r.entrypoint)){await this.startRun({type:`prepare-run`,operationEpoch:e,project:n.project,descriptor:r,...n.projectId?{projectId:n.projectId}:{}},t);return}await this.startRun({type:`prepare-run`,operationEpoch:e},t)})}assertOperation(e){if(e!==this.operationEpoch||!this.worker)throw Error(`Run cancelled`)}async withRunReservation(e){let t=++this.operationEpoch,n=await this.request({type:`reserve-run`});try{this.assertOperation(t),await e(n.operationEpoch,t)}catch(e){throw this.worker&&await this.request({type:`cancel-run`,operationEpoch:n.operationEpoch}).catch(()=>void 0),e}}setProjectRunProvider(e,t){this.projectRunProvider=e,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()}),this.worker?.port.postMessage({type:`set-project-run-provider`,providesProject:e!==null,takeover:t?.takeover===!0})}setTelemetryEnabled(e){this.telemetryEnabled=e,this.worker?.port.postMessage({type:`set-role`,role:this.deliveryRole()})}deliveryRole(){return this.telemetryEnabled||this.projectRunProvider===null?`monitor`:`ide`}markProjectChanged(e){this.worker?.port.postMessage({type:`mark-project-changed`,project:e})}async startRun(e,t=this.operationEpoch){this.terminateRuntime();let{runId:n,scenario:r,world:i,project:a}=await this.request(e);this.assertOperation(t);let o;try{o=this.createMicroPythonWorker(`ucsb-xrp-micropython-runtime`)}catch(e){throw this.forwardRuntimeMessage(n,{type:`error`,detail:Y(e)}),e}this.runtimeWorker=o,this.activeRunId=n,typeof SharedArrayBuffer==`function`&&globalThis.crossOriginIsolated?(this.liveValues=new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*16)),this.cancellation=new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT))):this.liveValues=null,this.startRunHeartbeat(n);let s=!1,c=(e,t)=>{this.clearRuntimeStartupDeadline(),this.runtimeStartupTimeout=setTimeout(()=>{o===this.runtimeWorker&&(this.forwardRuntimeMessage(n,{type:`error`,stage:`compile`,detail:t}),this.terminateRuntime(n))},e)};c(J,`MicroPython runtime did not finish loading within 15 seconds. Check the connection or offline setup, then try Run again.`),o.onmessage=e=>{if(o!==this.runtimeWorker)return;let t=e.data;t.type===`runtime-ready`&&!s?(s=!0,c(q,`MicroPython compilation timed out after 2.5 seconds. Check the project, then try Run again.`)):t.type===`compile-complete`&&this.clearRuntimeStartupDeadline(),this.forwardRuntimeMessage(n,t),(t.type===`run-complete`||t.type===`error`)&&this.terminateRuntime(n)},o.onerror=e=>{o===this.runtimeWorker&&(this.forwardRuntimeMessage(n,{type:`error`,detail:e.message||`MicroPython runtime worker failed`}),this.terminateRuntime(n))};try{o.postMessage({mode:`run`,project:he(a,r),scenario:r,world:i,liveParameterBuffer:this.liveValues?.buffer,cancellationBuffer:this.cancellation?.buffer})}catch(e){throw this.forwardRuntimeMessage(n,{type:`error`,stage:`compile`,detail:Y(e)}),this.terminateRuntime(n),e}}async synchronize(e,t){let n=await this.check(e);if(!n.ok)throw Error(n.detail);let r=await a(e);await this.request({type:`store-project`,project:e,descriptor:r,...t?{projectId:t}:{}}),this.publishConsole({type:`console`,stream:`system`,line:`Project prepared for the virtual XRP`,action:`flash`,phase:`result`})}async markProjectStale(e,t){let n=await a(e);await this.request({type:`mark-project-stale`,project:e,descriptor:n,...t?{projectId:t}:{}})}async stop(){this.operationEpoch+=1,this.terminateRuntime(),await this.request({type:`stop`})}async reset(){this.operationEpoch+=1,this.terminateRuntime(),await this.request({type:`reset`})}async setRuntimeParameter(e,t){await this.request({type:`set-runtime-parameter`,name:e,value:t})}async setSimulationScenario(e){await this.request({type:`set-scenario`,scenario:e})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}request(e){if(!this.worker)return Promise.reject(Error(`Virtual target is not connected`));let t=`request-${this.nextRequest}`;return this.nextRequest+=1,new Promise((n,r)=>{let i=setTimeout(()=>{this.pending.delete(t),r(Error(`Virtual target ${e.type} timed out`))},15e3);this.pending.set(t,{resolve:n,reject:r,timeout:i}),this.worker?.port.postMessage({...e,requestId:t})})}handleMessage(e){if(e.type===`project-run-snapshot-request`){let t=this.worker,n=this.projectRunProvider;Promise.resolve().then(()=>{if(!n)throw Error(`The IDE is not ready to provide its current project.`);return n()}).then(n=>{t&&t===this.worker&&t.port.postMessage({type:`project-run-snapshot`,requestId:e.requestId,snapshot:n})},n=>{t&&t===this.worker&&t.port.postMessage({type:`project-run-snapshot`,requestId:e.requestId,error:Y(n)})});return}if(e.type===`telemetry-batch`){for(let t of e.events)this.emit({...t,replayed:!0});return}if(e.type===`event`){for(let t of this.listeners)t(e.event);return}if(e.type===`terminate-runtime`){this.terminateRuntime(e.runId);return}if(e.type===`apply-runtime-parameter`){e.runId===this.activeRunId&&this.liveValues&&e.slot>=0&&e.slot<this.liveValues.length&&Atomics.store(this.liveValues,e.slot,e.encoded);return}let t=this.pending.get(e.requestId);t&&(clearTimeout(t.timeout),this.pending.delete(e.requestId),e.ok?t.resolve(e.result):t.reject(Error(e.error)))}createMicroPythonWorker(e){return new Worker(new URL(`/ucsbxrp/assets/micropython.worker-29IVaXvp.js`,``+import.meta.url),{type:`module`,name:e})}forwardRuntimeMessage(e,t){this.worker?.port.postMessage({type:`runtime-message`,runId:e,message:t})}startRunHeartbeat(e){this.stopRunHeartbeat();let t=()=>{this.activeRunId===e&&this.worker?.port.postMessage({type:`run-owner-heartbeat`,runId:e})};t(),this.runHeartbeat=setInterval(t,400)}stopRunHeartbeat(){this.runHeartbeat!==null&&(clearInterval(this.runHeartbeat),this.runHeartbeat=null)}emit(e){for(let t of this.listeners)t(e)}publishConsole(e){if(this.worker){this.worker.port.postMessage({type:`publish-console`,event:e});return}this.emit({...e,eventId:e.eventId??`virtual-client-${this.clientId}-${this.nextAction++}`,timestampMs:e.timestampMs??Date.now()})}terminateRuntime(e){(e===void 0||this.activeRunId===null||e===this.activeRunId)&&(this.clearRuntimeStartupDeadline(),this.stopRunHeartbeat(),this.cancellation&&Atomics.store(this.cancellation,0,1),this.runtimeWorker?.terminate(),this.runtimeWorker=null,this.activeRunId=null,this.liveValues=null,this.cancellation=null)}clearRuntimeStartupDeadline(){this.runtimeStartupTimeout!==null&&clearTimeout(this.runtimeStartupTimeout),this.runtimeStartupTimeout=null}},Lt=`# Values that define this Straight Run task.

from ucsb_xrp import distance_to_goal, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, WORLD.waypoint("finish"))
TARGET_TIME_S = 8.0

# If measured travel never reaches the finish, stop rather than leaving a
# mistaken sensor or controller implementation commanding the motors forever.
MAX_RUN_TIME_S = 20.0
`,Rt=`# Test the Challenge 1 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(SensorModel, WheelSpeedController)
`,zt=`# Select either the supplied reference class or the class in each project file.

from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelController,
)
from wheel_speed_controller import WheelSpeedController as StudentWheelController


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelController(config)
    return SuppliedWheelController(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Bt=`# Challenge 1: drive the requested straight-line distance.

from challenge import (
    INITIAL_POSE,
    MAX_RUN_TIME_S,
    TARGET_TIME_S,
    TRAVEL_DISTANCE_MM,
)
from course_setup import make_robot
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController, elapsed_time_s, wrap_angle_rad


def run_challenge():
    # Run the measured straight-line task and return the final RobotState.
    robot = make_robot(ROBOT_CONFIG)
    straight = StraightLineController(STRAIGHT_CONFIG)
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        start_time_ms = state.measurements.time_ms
        straight.start(state.measurements, TRAVEL_DISTANCE_MM)
        maximum_steps = max(1, int(MAX_RUN_TIME_S * 1000.0 / ROBOT_CONFIG.sample_period_ms))
        step_count = 0

        # Continue from measured wheel travel until the distance controller completes.
        while not straight.is_complete():
            if step_count >= maximum_steps:
                message = (
                    "Challenge 1 stopped: measured travel did not reach the "
                    "finish within {} s"
                ).format(MAX_RUN_TIME_S)
                print(message)
                raise RuntimeError(message)
            state = robot.step(straight.update(state.measurements))
            step_count += 1

        measured_elapsed_time_s = elapsed_time_s(state.measurements.time_ms, start_time_ms)
        mean_wheel_travel_mm = (
            state.measurements.left_position_mm
            + state.measurements.right_position_mm
        ) / 2.0

        print("Challenge 1 complete")
        print("target_distance_mm:", TRAVEL_DISTANCE_MM)
        print("mean_wheel_travel_mm:", mean_wheel_travel_mm)
        print("distance_error_mm:", mean_wheel_travel_mm - TRAVEL_DISTANCE_MM)
        print("estimated_final_pose:", state.pose)
        print("estimated_lateral_error_mm:", state.pose.y_mm - INITIAL_POSE.y_mm)
        print(
            "estimated_heading_error_rad:",
            wrap_angle_rad(state.pose.heading_rad - INITIAL_POSE.heading_rad),
        )
        print("target_time_s:", TARGET_TIME_S)
        print("measured_elapsed_time_s:", measured_elapsed_time_s)
        time_error_s = measured_elapsed_time_s - TARGET_TIME_S
        print("time_error_s:", time_error_s)
        if time_error_s < 0.0:
            print("timed_result: early (does not satisfy the challenge rule)")
        else:
            print("timed_result: valid (not early)")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,Vt=`# Settings shared by Challenge 1 programs for one XRP robot.

from ucsb_xrp import NavigationConfig, RobotConfig


# Nominal values match the virtual XRP. Tune signs and gains from measurements
# when a physical course robot differs.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# These named values make units visible and can be tuned from measured runs.
STRAIGHT_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,
    approach_speed_mm_s=96.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=1.0,
    position_tolerance_mm=10.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,Ht=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Ut=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,Wt=`# Values derived from this project's Turn and Return world.

from ucsb_xrp import distance_to_goal, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
TURN_GOAL = WORLD.waypoint("turn")
OUTBOUND_DISTANCE_MM = distance_to_goal(INITIAL_POSE, TURN_GOAL)
TURN_HEADING_RAD = TURN_GOAL.heading_rad
RETURN_DISTANCE_MM = OUTBOUND_DISTANCE_MM
FINAL_HEADING_RAD = INITIAL_POSE.heading_rad

# These visible phase limits stop a mistaken component from commanding motion
# indefinitely. They are diagnostic bounds, not hidden changes to commands.
MAX_STRAIGHT_TIME_S = 12.0
MAX_TURN_TIME_S = 8.0
`,Gt=`# Test the Challenge 2 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
)
`,Kt=`# Choose one implementation of each component and assemble the Challenge 2 robot.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )
`,qt=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,Jt=`# Challenge 2: drive out, turn around, and return.

from math import sqrt

from challenge import (
    FINAL_HEADING_RAD,
    INITIAL_POSE,
    MAX_STRAIGHT_TIME_S,
    MAX_TURN_TIME_S,
    OUTBOUND_DISTANCE_MM,
    RETURN_DISTANCE_MM,
    TURN_HEADING_RAD,
)
from course_setup import make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, StraightLineController, wrap_angle_rad


def maximum_steps(duration_s):
    return max(1, int(duration_s * 1000.0 / ROBOT_CONFIG.sample_period_ms))


def drive_straight(robot, state, distance_mm, phase_name):
    # Drive one measured distance and return the updated RobotState.
    print("Phase started:", phase_name)
    controller = StraightLineController(NAVIGATION_CONFIG)
    controller.start(state.measurements, distance_mm)
    step_count = 0
    # Continue until this phase reaches its measured travel target.
    while not controller.is_complete():
        if step_count >= maximum_steps(MAX_STRAIGHT_TIME_S):
            message = "Challenge 2 stopped: {} did not complete within {} s".format(
                phase_name,
                MAX_STRAIGHT_TIME_S,
            )
            print(message)
            raise RuntimeError(message)
        state = robot.step(controller.update(state.measurements))
        step_count += 1
    print("Phase complete:", phase_name)
    return state


def turn_to_heading(robot, state, target_heading_rad, phase_name):
    # Turn in place toward one world heading and return the updated state.
    print("Phase started:", phase_name)
    heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    step_count = 0
    # Recheck heading after each turn sample instead of assuming a fixed turn duration.
    while abs(heading_error) > NAVIGATION_CONFIG.heading_tolerance_rad:
        if step_count >= maximum_steps(MAX_TURN_TIME_S):
            message = "Challenge 2 stopped: {} did not complete within {} s".format(
                phase_name,
                MAX_TURN_TIME_S,
            )
            print(message)
            raise RuntimeError(message)
        turn_rate = (
            NAVIGATION_CONFIG.turn_rate_rad_s
            if heading_error > 0
            else -NAVIGATION_CONFIG.turn_rate_rad_s
        )
        state = robot.step(MotionCommand(0.0, turn_rate))
        step_count += 1
        heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    print("Phase complete:", phase_name)
    return state


def run_challenge():
    # Run the out-turn-return sequence and return the final RobotState.
    robot = make_robot(ROBOT_CONFIG)
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        state = drive_straight(robot, state, OUTBOUND_DISTANCE_MM, "outbound travel")
        state = turn_to_heading(robot, state, TURN_HEADING_RAD, "turnaround")
        state = drive_straight(robot, state, RETURN_DISTANCE_MM, "return travel")
        state = turn_to_heading(robot, state, FINAL_HEADING_RAD, "final heading")
        x_error_mm = state.pose.x_mm - INITIAL_POSE.x_mm
        y_error_mm = state.pose.y_mm - INITIAL_POSE.y_mm
        print("Challenge 2 complete")
        print("final_pose:", state.pose)
        print("estimated_return_position_error_mm:", sqrt(x_error_mm * x_error_mm + y_error_mm * y_error_mm))
        print(
            "estimated_return_heading_error_rad:",
            wrap_angle_rad(state.pose.heading_rad - FINAL_HEADING_RAD),
        )
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,Yt=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,Xt=`# Robot and navigation settings shared by Challenge 2 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,Zt=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Qt=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,$t=`# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
`,en=`# Test the Challenge 3 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
)
`,tn=`# Choose one implementation of each component and assemble Challenge 3.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)
`,nn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,rn=`# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
from course_setup import make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import distance_to_goal, wrap_angle_rad


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def count_reached_goals(pose, route, reached_count):
    # Advance only through goals observed at their assigned position in order.
    while reached_count < len(route) and goal_is_reached(pose, route[reached_count]):
        reached_count += 1
    return reached_count


def run_challenge():
    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    step_count = 0
    reached_count = 0
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count)
        navigation.start(ROUTE)
        # Recompute one motion request from each newly estimated pose.
        while not navigation.is_complete():
            state = robot.step(navigation.update(state.pose))
            step_count += 1
            reached_count = count_reached_goals(state.pose, ROUTE, reached_count)

        result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
        print(
            "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
            "final_pose={}".format(
                result, reached_count, len(ROUTE), step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError("Navigation finished before every waypoint was observed in order")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,an=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,on=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,sn=`# Robot and navigation settings shared by Challenge 3 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,cn=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,ln=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,un=`# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
# 85 mm collision radius plus 65 mm for the supplied controller's turning
# transient. Grid-cell clearance alone is not a tracking-error guarantee.
CLEARANCE_MM = 150.0
`,dn=`# Test the Challenge 4 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
)
`,fn=`# Choose one implementation of each component and assemble Challenge 4.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
`,pn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,mn=`# Find a connected route through free grid cells.

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
`,hn=`# Challenge 4: plan and follow a route around known obstacles.

from challenge import (
    ARENA_MAP,
    CLEARANCE_MM,
    DESTINATION,
    GRID_RESOLUTION_MM,
    INITIAL_POSE,
)
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import GridPath, OccupancyGrid, distance_to_goal, wrap_angle_rad


def path_error(grid, start, goal, path):
    # Return a readable reason when a planned path is unsafe to execute.
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


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    # Plan and follow the mapped route, or report that no route exists.
    # The occupancy grid accounts for the robot clearance around each obstacle.
    # Convert arena geometry to clearance-aware cells before planning.
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)
    goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
    path = make_grid_planner().plan(grid, start, goal)
    if path is None:
        print("Challenge 4: result=no_path")
        return None
    invalid_reason = path_error(grid, start, goal, path)
    if invalid_reason is not None:
        print("Challenge 4: result=invalid_path reason={}".format(invalid_reason))
        return None

    # Convert the checked cell path back to world-coordinate goals.
    goals = list(path.to_goals(grid))
    goals[-1] = DESTINATION

    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    step_count = 0
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        navigation.start(goals)
        # Recompute one motion request from each newly estimated pose.
        while not navigation.is_complete():
            state = robot.step(navigation.update(state.pose))
            step_count += 1

        result = (
            "complete"
            if goal_is_reached(state.pose, DESTINATION)
            else "destination_not_reached"
        )
        print(
            "Challenge 4: result={} path_cells={} navigation_steps={} "
            "final_pose={}".format(
                result, len(path.cells), step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError("Navigation finished before the destination was reached")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,gn=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,_n=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,vn=`# Robot and navigation settings shared by Challenge 4 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,yn=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,bn=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,xn=`# Observation and delivery task for Challenge 5.

from ucsb_xrp import DeliveryTask, load_world


# WORLD is the case selected in the Monitor. It determines the virtual range
# measurement and the start and destination shown to the student.
# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()

# Both cases use one dimensioned mission map. The gate-blocked entry defines
# the location and name of the changeable gate. DeliveryMission then marks that
# gate open or blocked from the measured range; it does not assume the selected
# virtual case is the answer.
MISSION_MAP_WORLD_ID = "gate-blocked"
MISSION_MAP_WORLD = load_world(world_id=MISSION_MAP_WORLD_ID)

DELIVERY_TASK = DeliveryTask(
    initial_pose=WORLD.initial_pose,
    arena=MISSION_MAP_WORLD.arena_map(),
    grid_resolution_mm=100.0,
    # 85 mm virtual collision radius plus 10 mm planning margin.
    clearance_mm=95.0,
    destination=WORLD.waypoint("destination"),
    observed_feature_name="center_gate",
    range_sample_count=7,
    minimum_usable_range_count=4,
    blocked_range_threshold_mm=500.0,
    assume_blocked_without_range=True,
)
`,Sn=`# Test the Challenge 5 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result, including range examples.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)
`,Cn=`# Choose one implementation of each component and assemble Challenge 5.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
`,wn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,Tn=`# Find a connected route through free grid cells.

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
`,En=`# Challenge 5: observe the gate, plan, and complete the delivery.

from challenge import DELIVERY_TASK
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import DeliveryMission


def run_challenge():
    # DeliveryMission owns the observation, map update, route plan, and stop.
    mission = DeliveryMission(
        DELIVERY_TASK,
        make_navigation_controller(NAVIGATION_CONFIG),
        make_grid_planner(),
    )
    state = mission.run(make_robot(ROBOT_CONFIG))
    path_cells = (
        None
        if mission.planned_path is None
        else len(getattr(mission.planned_path, "cells", ()))
    )
    # Keep unavailable range distinct from a measured open gate in the report.
    if mission.feature_blocked is None:
        map_decision = "unknown"
    elif mission.feature_blocked:
        map_decision = "blocked"
    else:
        map_decision = "open"
    print(
        "Challenge 5: result={} range_mm={} feature={}={} path_cells={} "
        "navigation_steps={} final_pose={}".format(
            mission.result,
            mission.range_estimate_mm,
            DELIVERY_TASK.observed_feature_name,
            map_decision,
            path_cells,
            mission.navigation_step_count,
            state.pose,
        )
    )
    if mission.result in ("invalid_path", "destination_not_reached"):
        raise RuntimeError("Delivery did not produce valid destination evidence")
    return state


run_challenge()
`,Dn=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,On=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,kn=`# Robot and navigation settings shared by Challenge 5 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,An=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,jn=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,Mn=`# Values for Challenge 6: Range-Constrained Stopping.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose

NOMINAL_FORWARD_SPEEDS_MM_S = {
    "near-wall": 120.0,
    "far-wall": 100.0,
    "no-range": 120.0,
}
NOMINAL_FORWARD_SPEED_MM_S = NOMINAL_FORWARD_SPEEDS_MM_S[WORLD.id]
MAXIMUM_SAFE_SPEED_MM_S = 180.0
# Admit observations up to 0.25 s old, plus 0.15 s for control/command response.
# These are provisional timing allowances; qualify them again on the robot.
MAXIMUM_RANGE_SAMPLE_AGE_S = 0.25
RESPONSE_TIME_S = MAXIMUM_RANGE_SAMPLE_AGE_S + 0.15
MINIMUM_DECELERATION_MM_S2 = 300.0
STOP_MARGIN_MM = 220.0
SUCCESS_MINIMUM_RANGE_MM = 220.0
SUCCESS_MAXIMUM_RANGE_MM = 380.0

RANGE_WINDOW_SIZE = 3
MINIMUM_USABLE_RANGE_COUNT = 3
INITIAL_RANGE_SAMPLE_COUNT = 3
STOPPED_SPEED_MM_S = 5.0
`,Nn=`# Test Challenge 6 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from range_safety_controller import RangeSafetyController
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import RangeSafetyControllerBase


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_range_safety_controller():
    print("RangeSafetyController.update")
    print("USE request, measured speed, range, and every configured setting")
    try:
        controller = RangeSafetyController(0.20, 400.0, 120.0, 250.0)
        if not isinstance(controller, RangeSafetyControllerBase):
            print("FAIL RangeSafetyController must extend RangeSafetyControllerBase")
            return
        far = controller.update(220.0, 0.0, 1000.0)
        missing = controller.update(220.0, 0.0, None)
        zero = controller.update(0.0, 80.0, 1000.0)
        reverse = controller.update(-40.0, 0.0, 1000.0)
        bounded = controller.update(400.0, 0.0, 1000.0)

        # The same range is safe at a low measured speed but not after the
        # robot has accumulated substantially more kinetic energy.
        same_range_slow = controller.update(200.0, 60.0, 210.0)
        same_range_fast = controller.update(200.0, 220.0, 210.0)

        quick_response = RangeSafetyController(0.10, 300.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        delayed_response = RangeSafetyController(0.45, 300.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        weak_braking = RangeSafetyController(0.20, 200.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        strong_braking = RangeSafetyController(0.20, 800.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        small_margin = RangeSafetyController(0.20, 300.0, 80.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        large_margin = RangeSafetyController(0.20, 300.0, 180.0, 300.0).update(
            260.0, 0.0, 240.0
        )

        observations = (
            ("far range moves", 0.0 < far <= 220.0, far),
            ("missing range stops", missing == 0.0, missing),
            ("zero request stops", zero == 0.0, zero),
            ("reverse request stops", reverse == 0.0, reverse),
            ("maximum speed bounds", 0.0 < bounded <= 250.0, bounded),
            ("slow at shared range moves", same_range_slow > 0.0, same_range_slow),
            ("fast at shared range stops", same_range_fast == 0.0, same_range_fast),
            (
                "response delay reduces speed",
                0.0 < delayed_response < quick_response,
                (quick_response, delayed_response),
            ),
            (
                "stronger braking permits more speed",
                0.0 < weak_braking < strong_braking,
                (weak_braking, strong_braking),
            ),
            (
                "larger margin reduces speed",
                0.0 < large_margin < small_margin,
                (small_margin, large_margin),
            ),
        )
        for label, passed, observed in observations:
            print("OBSERVED", label, observed)
            if not passed:
                print("FAIL RangeSafetyController.update", label)
                return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL RangeSafetyController.update", type(error).__name__, error)
        return
    print("PASS RangeSafetyController.update")


check_range_safety_controller()
`,Pn=`# Choose one implementation of each component and assemble Challenge 6.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from range_safety_controller import (
    RangeSafetyController as StudentRangeSafetyController,
)
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from ucsb_xrp_reference.challenge_6 import (
    RangeSafetyController as SuppliedRangeSafetyController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False
USE_STUDENT_RANGE_SAFETY_CONTROLLER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()


def make_range_safety_controller(*settings):
    if USE_STUDENT_RANGE_SAFETY_CONTROLLER:
        return StudentRangeSafetyController(*settings)
    return SuppliedRangeSafetyController(*settings)
`,Fn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,In=`# Find a connected route through free grid cells.

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
`,Ln=`# Publish the current range decision for the Monitor.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_range_decision(estimate_mm, speed_mm_s):
    live.watch(
        "range_estimate_mm",
        estimate_mm if estimate_mm is not None else "—",
        unit="mm",
        label="Filtered range",
    )
    live.watch("student_speed_mm_s", speed_mm_s, unit="mm/s", label="Student controller output")
    live.plot("student_speed_mm_s", speed_mm_s, unit="mm/s", label="Student controller output")
`,Rn=`# Challenge 6: approach a wall using the student's range-speed controller.

from math import isfinite

from challenge import (
    INITIAL_POSE,
    INITIAL_RANGE_SAMPLE_COUNT,
    MAXIMUM_SAFE_SPEED_MM_S,
    MAXIMUM_RANGE_SAMPLE_AGE_S,
    MINIMUM_DECELERATION_MM_S2,
    MINIMUM_USABLE_RANGE_COUNT,
    NOMINAL_FORWARD_SPEED_MM_S,
    RANGE_WINDOW_SIZE,
    RESPONSE_TIME_S,
    STOP_MARGIN_MM,
    STOPPED_SPEED_MM_S,
    SUCCESS_MAXIMUM_RANGE_MM,
    SUCCESS_MINIMUM_RANGE_MM,
)
from course_setup import make_range_safety_controller, make_robot
from live_variables import publish_range_decision
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s


def mean_forward_speed(state):
    return (
        state.measurements.left_speed_mm_s
        + state.measurements.right_speed_mm_s
    ) / 2.0


def wheels_are_stopped(state):
    return (
        abs(state.measurements.left_speed_mm_s) <= STOPPED_SPEED_MM_S
        and abs(state.measurements.right_speed_mm_s) <= STOPPED_SPEED_MM_S
    )


def valid_student_speed(
    value,
    requested_speed_mm_s,
    maximum_speed_mm_s,
    range_mm,
):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not isfinite(value)
    ):
        raise RuntimeError("RangeSafetyController must return a finite number")
    speed_mm_s = float(value)
    if speed_mm_s < 0.0:
        raise RuntimeError("RangeSafetyController must not command reverse motion")
    if speed_mm_s > requested_speed_mm_s or speed_mm_s > maximum_speed_mm_s:
        raise RuntimeError("RangeSafetyController exceeded the request or configured maximum")
    if range_mm is None and speed_mm_s != 0.0:
        raise RuntimeError("RangeSafetyController must stop when range is unavailable")
    return speed_mm_s


def remember_range(robot, state, observations, previous_seq):
    sequence = robot.range_sample_seq
    if sequence is not None and sequence != previous_seq:
        # Keep the actual attempt's age; repeated control steps are not samples.
        observations.append((state.measurements.range_mm, state.measurements.time_ms, robot.range_sample_age_s))
        del observations[:-RANGE_WINDOW_SIZE]
    return sequence


def current_range_estimate(robot, state, observations):
    latest_age_s = robot.range_sample_age_s
    if state.measurements.range_mm is None or latest_age_s is None or latest_age_s > MAXIMUM_RANGE_SAMPLE_AGE_S:
        return None  # A missing or stale latest reading cannot authorize motion.
    current = []
    for distance_mm, observed_ms, initial_age_s in observations:
        age_s = initial_age_s + elapsed_time_s(state.measurements.time_ms, observed_ms)
        if age_s <= MAXIMUM_RANGE_SAMPLE_AGE_S:
            current.append(distance_mm)
    return robot.estimate_range(current, MINIMUM_USABLE_RANGE_COUNT)


def run_challenge():
    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    controller = make_range_safety_controller(
        RESPONSE_TIME_S,
        MINIMUM_DECELERATION_MM_S2,
        STOP_MARGIN_MM,
        MAXIMUM_SAFE_SPEED_MM_S,
    )
    observations = []
    previous_seq = None
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        for _ in range(INITIAL_RANGE_SAMPLE_COUNT):
            robot.collect_range_samples(1)
            state = robot.state
            previous_seq = remember_range(robot, state, observations, previous_seq)

        # Reassess fresh range and measured speed before every forward command.
        while True:
            estimate = current_range_estimate(robot, state, observations)
            speed_mm_s = valid_student_speed(
                controller.update(NOMINAL_FORWARD_SPEED_MM_S, mean_forward_speed(state), estimate),
                NOMINAL_FORWARD_SPEED_MM_S,
                MAXIMUM_SAFE_SPEED_MM_S,
                estimate,
            )
            publish_range_decision(estimate, speed_mm_s)
            if speed_mm_s == 0.0:
                break
            state = robot.step(MotionCommand(speed_mm_s, 0.0), read_range=True)
            previous_seq = remember_range(robot, state, observations, previous_seq)

        while not wheels_are_stopped(state):
            state = robot.step(STOP_COMMAND, read_range=True)
            previous_seq = remember_range(robot, state, observations, previous_seq)

        # Grade stationary observations, not a median retained from the approach.
        final_samples = robot.collect_range_samples(INITIAL_RANGE_SAMPLE_COUNT)
        state = robot.state
        final_range_mm = robot.estimate_range(final_samples, MINIMUM_USABLE_RANGE_COUNT)
        if final_range_mm is None:
            result = "range_unavailable"
        elif final_range_mm > SUCCESS_MAXIMUM_RANGE_MM:
            result = "early_stop"
        elif final_range_mm < SUCCESS_MINIMUM_RANGE_MM:
            result = "stopped_too_close"
        else:
            result = "complete"
        print(
            "Challenge 6: result={} final_range_mm={} final_pose={}".format(
                result, final_range_mm, state.pose
            )
        )
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,zn=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,Bn=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,Vn=`# Limit forward speed from measured speed and available forward range.

from ucsb_xrp.student_api import RangeSafetyControllerBase

# RangeSafetyController — Limit forward motion using measured speed and available range.
# Called by: Range-constrained stopping loop.
# Methods: update().
# Inputs: Requested and measured forward speed (mm/s); range (mm or None).
# State: Inherited response time, minimum deceleration, margin, speed limit; no history.
# Returns: Nonnegative forward-speed request (mm/s).

class RangeSafetyController(RangeSafetyControllerBase):
    # RangeSafetyControllerBase validates and stores the four settings.

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        # requested_speed_mm_s is the desired forward speed; measured_speed_mm_s
        # is the current forward speed. range_mm is clearance ahead in mm or
        # None when unavailable. Return a nonnegative speed in mm/s no greater
        # than the request or self.maximum_speed_mm_s. Return zero if range is
        # unavailable or stopping cannot leave self.stop_margin_mm of clearance.
        raise NotImplementedError("Complete RangeSafetyController.update")
`,Hn=`# Robot and navigation settings shared by Challenge 6 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,Un=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Wn=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,Gn=`# Values for Challenge 7: Wall-Range Pose Correction.

from math import pi

from ucsb_xrp import Pose, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
PHYSICAL_INITIAL_POSE = WORLD.initial_pose
ODOMETRY_INITIAL_POSE = Pose(
    PHYSICAL_INITIAL_POSE.x_mm + 80.0,
    PHYSICAL_INITIAL_POSE.y_mm - 60.0,
    PHYSICAL_INITIAL_POSE.heading_rad,
)
DESTINATION = WORLD.waypoint("destination")

X_WALL_MM = 900.0
Y_WALL_MM = 500.0
X_WALL_IS_POSITIVE = True
Y_WALL_IS_POSITIVE = True
SENSOR_FORWARD_OFFSET_MM = 70.0
X_SCAN_HEADING_RAD = 0.0
Y_SCAN_HEADING_RAD = pi / 2.0
WALL_OBSERVATION_HEADING_TOLERANCE_RAD = 0.10

RANGE_SAMPLE_COUNT = 7
MINIMUM_USABLE_RANGE_COUNT = 4
STOPPED_SPEED_MM_S = 5.0
`,Kn=`# Test Challenge 7 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from pose_corrector import PoseCorrector
from sensor_model import SensorModel
from ucsb_xrp import Pose
from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import PoseCorrectorBase
from wheel_speed_controller import WheelSpeedController


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_pose_corrector():
    print("PoseCorrector varied wall observations")
    try:
        corrector = PoseCorrector(50.0)
        if not isinstance(corrector, PoseCorrectorBase):
            print("FAIL PoseCorrector must extend PoseCorrectorBase")
            return
        raw = Pose(120.0, -75.0, 0.31)
        corrector.reset(raw)
        after_x = corrector.observe_x(raw, 780.0, 1000.0, True)
        after_y = corrector.observe_y(raw, 275.0, -600.0, False)
        later = corrector.corrected_pose(Pose(145.0, -50.0, -0.60))

        reset_pose = Pose(-40.0, 30.0, 1.20)
        after_reset = corrector.reset(reset_pose)
        after_negative_x = corrector.observe_x(
            reset_pose, 200.0, -500.0, False
        )
        after_positive_y = corrector.observe_y(
            reset_pose, 300.0, 800.0, True
        )

        second = PoseCorrector(25.0)
        second_raw = Pose(40.0, 60.0, -1.10)
        second.reset(second_raw)
        second_x = second.observe_x(second_raw, 500.0, 600.0, True)
        second_xy = second.observe_y(second_raw, 200.0, -400.0, False)

        observations = (
            (
                "positive-x correction preserves y and heading",
                abs(after_x.x_mm - 170.0) < 1e-9
                and abs(after_x.y_mm + 75.0) < 1e-9
                and abs(after_x.heading_rad - 0.31) < 1e-9,
                after_x,
            ),
            (
                "negative-y correction retains x correction",
                abs(after_y.x_mm - 170.0) < 1e-9
                and abs(after_y.y_mm + 275.0) < 1e-9,
                after_y,
            ),
            (
                "translation follows later odometry and preserves heading",
                abs(later.x_mm - 195.0) < 1e-9
                and abs(later.y_mm + 250.0) < 1e-9
                and abs(later.heading_rad + 0.60) < 1e-9,
                later,
            ),
            (
                "reset clears both corrections",
                after_reset == reset_pose,
                after_reset,
            ),
            (
                "negative-x wall side",
                abs(after_negative_x.x_mm + 250.0) < 1e-9
                and abs(after_negative_x.y_mm - 30.0) < 1e-9,
                after_negative_x,
            ),
            (
                "positive-y follows negative-x",
                abs(after_positive_y.x_mm + 250.0) < 1e-9
                and abs(after_positive_y.y_mm - 450.0) < 1e-9,
                after_positive_y,
            ),
            (
                "second sensor offset and positive-x wall",
                abs(second_x.x_mm - 75.0) < 1e-9
                and abs(second_x.y_mm - 60.0) < 1e-9,
                second_x,
            ),
            (
                "second sensor offset and negative-y wall",
                abs(second_xy.x_mm - 75.0) < 1e-9
                and abs(second_xy.y_mm + 175.0) < 1e-9,
                second_xy,
            ),
        )
        for label, passed, observed in observations:
            print("OBSERVED", label, observed)
            if not passed:
                print("FAIL PoseCorrector", label)
                return
        try:
            corrector.observe_x(reset_pose, 0.0, 900.0, True)
        except ValueError:
            pass
        else:
            print("FAIL PoseCorrector accepted zero range")
            return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL PoseCorrector", type(error).__name__, error)
        return
    print("PASS PoseCorrector")


check_pose_corrector()
`,qn=`# Choose one implementation of each component and assemble Challenge 7.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from pose_corrector import PoseCorrector as StudentPoseCorrector
from range_safety_controller import (
    RangeSafetyController as StudentRangeSafetyController,
)
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from ucsb_xrp_reference.challenge_6 import (
    RangeSafetyController as SuppliedRangeSafetyController,
)
from ucsb_xrp_reference.challenge_7 import (
    PoseCorrector as SuppliedPoseCorrector,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False
USE_STUDENT_RANGE_SAFETY_CONTROLLER = False
USE_STUDENT_POSE_CORRECTOR = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()


def make_range_safety_controller(*settings):
    if USE_STUDENT_RANGE_SAFETY_CONTROLLER:
        return StudentRangeSafetyController(*settings)
    return SuppliedRangeSafetyController(*settings)


def make_pose_corrector(sensor_forward_offset_mm):
    if USE_STUDENT_POSE_CORRECTOR:
        return StudentPoseCorrector(sensor_forward_offset_mm)
    return SuppliedPoseCorrector(sensor_forward_offset_mm)
`,Jn=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,Yn=`# Find a connected route through free grid cells.

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
`,Xn=`# Challenge 7: correct planar position with two known-wall range observations.

from challenge import (
    DESTINATION,
    MINIMUM_USABLE_RANGE_COUNT,
    ODOMETRY_INITIAL_POSE,
    RANGE_SAMPLE_COUNT,
    SENSOR_FORWARD_OFFSET_MM,
    STOPPED_SPEED_MM_S,
    WALL_OBSERVATION_HEADING_TOLERANCE_RAD,
    X_SCAN_HEADING_RAD,
    X_WALL_IS_POSITIVE,
    X_WALL_MM,
    Y_SCAN_HEADING_RAD,
    Y_WALL_IS_POSITIVE,
    Y_WALL_MM,
)
from course_setup import make_navigation_controller, make_pose_corrector, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import (
    MotionCommand,
    STOP_COMMAND,
    distance_to_goal,
    wrap_angle_rad,
)


def wheels_are_stopped(state):
    return (
        abs(state.measurements.left_speed_mm_s) <= STOPPED_SPEED_MM_S
        and abs(state.measurements.right_speed_mm_s) <= STOPPED_SPEED_MM_S
    )


def require_cardinal_observation(state, expected_heading_rad):
    if not wheels_are_stopped(state):
        raise RuntimeError("Wall observation rejected: both wheel speeds must be stationary")
    heading_error = wrap_angle_rad(expected_heading_rad - state.pose.heading_rad)
    if abs(heading_error) > WALL_OBSERVATION_HEADING_TOLERANCE_RAD:
        raise RuntimeError("Wall observation rejected: heading is outside the cardinal tolerance")


def collect_stationary_range(robot, state, expected_heading_rad):
    samples = []
    require_cardinal_observation(state, expected_heading_rad)
    for _ in range(RANGE_SAMPLE_COUNT):
        samples.extend(robot.collect_range_samples(1))  # One new attempt, including a missing echo.
        state = robot.state
        require_cardinal_observation(state, expected_heading_rad)
    return state, robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)


def turn_to_heading(robot, state, target_heading_rad):
    # Recheck estimated heading after every zero-forward command; stop once
    # heading tolerance is reached before making wall observations.
    while True:
        error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
        if abs(error) <= NAVIGATION_CONFIG.heading_tolerance_rad:
            return state
        direction = 1.0 if error > 0.0 else -1.0
        state = robot.step(MotionCommand(0.0, direction * NAVIGATION_CONFIG.turn_rate_rad_s))


def settle(robot, state):
    while not wheels_are_stopped(state):
        state = robot.step(STOP_COMMAND)
    return state


def destination_is_reached(corrected_pose, raw_pose):
    if (
        distance_to_goal(corrected_pose, DESTINATION)
        > NAVIGATION_CONFIG.position_tolerance_mm
    ):
        return False
    if DESTINATION.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(DESTINATION.heading_rad - raw_pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    corrector = make_pose_corrector(SENSOR_FORWARD_OFFSET_MM)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(ODOMETRY_INITIAL_POSE)
        corrector.reset(state.pose)

        state = turn_to_heading(robot, state, X_SCAN_HEADING_RAD)
        state = settle(robot, state)
        state, x_range_mm = collect_stationary_range(robot, state, X_SCAN_HEADING_RAD)
        if x_range_mm is None:
            raise RuntimeError("No usable x-wall range observation")
        corrector.observe_x(state.pose, x_range_mm, X_WALL_MM, X_WALL_IS_POSITIVE)

        state = turn_to_heading(robot, state, Y_SCAN_HEADING_RAD)
        state = settle(robot, state)
        state, y_range_mm = collect_stationary_range(robot, state, Y_SCAN_HEADING_RAD)
        if y_range_mm is None:
            raise RuntimeError("No usable y-wall range observation")
        corrector.observe_y(state.pose, y_range_mm, Y_WALL_MM, Y_WALL_IS_POSITIVE)

        navigation.start((DESTINATION,))
        # Recompute one motion request from each newly estimated pose.
        while not navigation.is_complete():
            corrected = corrector.corrected_pose(state.pose)
            state = robot.step(navigation.update(corrected))

        corrected_final_pose = corrector.corrected_pose(state.pose)
        result = (
            "complete"
            if destination_is_reached(corrected_final_pose, state.pose)
            else "destination_not_reached"
        )
        print(
            "Challenge 7: result={} x_range_mm={} y_range_mm={} "
            "corrected_residual_mm={} raw_final_pose={} "
            "corrected_final_pose={}".format(
                result,
                x_range_mm,
                y_range_mm,
                distance_to_goal(corrected_final_pose, DESTINATION),
                state.pose,
                corrected_final_pose,
            )
        )
        if result != "complete":
            raise RuntimeError("Corrected navigation did not reach the destination")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,Zn=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,Qn=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,$n=`# Correct odometry position from stationary observations of known walls.

from ucsb_xrp.student_api import PoseCorrectorBase

# PoseCorrector — Correct estimated position from known-wall range observations.
# Called by: Wall-range pose correction task.
# Methods: reset(), corrected_pose(), observe_x(), observe_y().
# Inputs: Pose and wall-range measurements (mm).
# State: Retained x/y translation offsets; inherited sensor forward offset (mm).
# Returns: Corrected Pose (mm, rad).

class PoseCorrector(PoseCorrectorBase):
    # PoseCorrectorBase validates and stores sensor_forward_offset_mm.

    def reset(self, raw_pose):
        # raw_pose is the current odometry Pose in arena-frame mm and radians.
        # Clear retained x/y translation offsets and return raw_pose unchanged.
        raise NotImplementedError("Complete PoseCorrector.reset")

    def corrected_pose(self, raw_pose):
        # Add the retained x/y translation offsets (mm) to raw_pose.x_mm and
        # raw_pose.y_mm; preserve raw_pose.heading_rad. reset() must establish
        # the offsets before this method applies them.
        raise NotImplementedError("Complete PoseCorrector.corrected_pose")

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena x axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_x_mm is that wall's fixed arena x coordinate in mm.
        # facing_positive_x is True toward increasing x, False toward decreasing
        # x. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained x correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_x")

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena y axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_y_mm is that wall's fixed arena y coordinate in mm.
        # facing_positive_y is True toward increasing y, False toward decreasing
        # y. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained y correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_y")
`,er=`# Limit forward speed from measured speed and available forward range.

from ucsb_xrp.student_api import RangeSafetyControllerBase

# RangeSafetyController — Limit forward motion using measured speed and available range.
# Called by: Range-constrained stopping loop.
# Methods: update().
# Inputs: Requested and measured forward speed (mm/s); range (mm or None).
# State: Inherited response time, minimum deceleration, margin, speed limit; no history.
# Returns: Nonnegative forward-speed request (mm/s).

class RangeSafetyController(RangeSafetyControllerBase):
    # RangeSafetyControllerBase validates and stores the four settings.

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        # requested_speed_mm_s is the desired forward speed; measured_speed_mm_s
        # is the current forward speed. range_mm is clearance ahead in mm or
        # None when unavailable. Return a nonnegative speed in mm/s no greater
        # than the request or self.maximum_speed_mm_s. Return zero if range is
        # unavailable or stopping cannot leave self.stop_margin_mm of clearance.
        raise NotImplementedError("Complete RangeSafetyController.update")
`,tr=`# Robot and navigation settings shared by Challenge 7 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,
    approach_speed_mm_s=96.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.7,
    position_tolerance_mm=15.0,
    heading_tolerance_rad=0.07,
    realign_heading_rad=0.25,
)
`,nr=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,rr=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,ir=`# Values for Challenge 8: Multi-Stop Route Planning.

from ucsb_xrp import NavigationGoal, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
SERVICE_STOPS = (
    WORLD.waypoint("stop_a"),
    WORLD.waypoint("stop_b"),
    WORLD.waypoint("stop_c"),
)
NODE_GOALS = (
    NavigationGoal(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm, INITIAL_POSE.heading_rad),
) + SERVICE_STOPS
NODE_NAMES = ("depot", "stop_a", "stop_b", "stop_c")
START_NODE_INDEX = 0
REQUIRED_NODE_INDICES = (1, 2, 3)
FINISH_NODE_INDEX = 0
ARENA_MAP = WORLD.arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
`,ar=`# Test Challenge 8 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from visit_order_planner import VisitOrderPlanner
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import VisitOrderPlannerBase


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_visit_order_planner():
    print("VisitOrderPlanner.plan")
    asymmetric = (
        (0, 9, 1, 8, 7),
        (6, 0, 5, 7, 4),
        (9, 2, 0, 8, 8),
        (1, 9, 9, 0, 5),
        (8, 9, 9, 1, 0),
    )
    one_reachable_order = (
        (0, None, None, 1, None),
        (None, 0, None, None, None),
        (None, None, 0, None, 1),
        (None, None, None, 0, None),
        (1, None, None, None, 0),
    )
    all_ties = (
        (0, 1, 1, 1, 1),
        (1, 0, 1, 1, 1),
        (1, 1, 0, 1, 1),
        (1, 1, 1, 0, 1),
        (1, 1, 1, 1, 0),
    )
    no_complete_order = (
        (0, 1, None, None),
        (None, 0, 1, None),
        (None, None, 0, None),
        (None, None, None, 0),
    )
    planner = VisitOrderPlanner()
    try:
        if not isinstance(planner, VisitOrderPlannerBase):
            print("FAIL VisitOrderPlanner does not implement its required Base")
            return

        observed = planner.plan(asymmetric, 4, (2, 0, 3), 1)
        print("OBSERVED asymmetric", observed)
        if observed != (4, 3, 0, 2, 1):
            print("FAIL VisitOrderPlanner directed costs or nonzero finish")
            return

        observed = planner.plan(one_reachable_order, 2, (0, 4), 3)
        print("OBSERVED missing segments", observed)
        if observed != (2, 4, 0, 3):
            print("FAIL VisitOrderPlanner skipped the only reachable order")
            return

        observed = planner.plan(all_ties, 4, (3, 1, 2), 0)
        print("OBSERVED tied orders", observed)
        if observed != (4, 1, 2, 3, 0):
            print("FAIL VisitOrderPlanner lexicographic tie break")
            return

        observed = planner.plan(no_complete_order, 0, (1, 2), 3)
        print("OBSERVED disconnected", observed)
        if observed is not None:
            print("FAIL VisitOrderPlanner disconnected result")
            return

        try:
            planner.plan(asymmetric, 4, (2, 2, 3), 1)
        except ValueError:
            pass
        else:
            print("FAIL VisitOrderPlanner accepted duplicate stops")
            return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL VisitOrderPlanner", type(error).__name__, error)
        return
    print("PASS VisitOrderPlanner")


check_visit_order_planner()
`,or=`# Choose one implementation of each component and assemble Challenge 8.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from pose_corrector import PoseCorrector as StudentPoseCorrector
from range_safety_controller import (
    RangeSafetyController as StudentRangeSafetyController,
)
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from ucsb_xrp_reference.challenge_6 import (
    RangeSafetyController as SuppliedRangeSafetyController,
)
from ucsb_xrp_reference.challenge_7 import (
    PoseCorrector as SuppliedPoseCorrector,
)
from ucsb_xrp_reference.challenge_8 import (
    VisitOrderPlanner as SuppliedVisitOrderPlanner,
)
from visit_order_planner import VisitOrderPlanner as StudentVisitOrderPlanner
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False
USE_STUDENT_RANGE_SAFETY_CONTROLLER = False
USE_STUDENT_POSE_CORRECTOR = False
USE_STUDENT_VISIT_ORDER_PLANNER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()


def make_route_cost_grid_planner():
    # Challenge 8 assesses VisitOrderPlanner. Use the supplied shortest-path
    # implementation so a carried GridPlanner cannot change its cost table.
    return SuppliedGridPlanner()


def make_range_safety_controller(*settings):
    if USE_STUDENT_RANGE_SAFETY_CONTROLLER:
        return StudentRangeSafetyController(*settings)
    return SuppliedRangeSafetyController(*settings)


def make_pose_corrector(sensor_forward_offset_mm):
    if USE_STUDENT_POSE_CORRECTOR:
        return StudentPoseCorrector(sensor_forward_offset_mm)
    return SuppliedPoseCorrector(sensor_forward_offset_mm)


def make_visit_order_planner():
    if USE_STUDENT_VISIT_ORDER_PLANNER:
        return StudentVisitOrderPlanner()
    return SuppliedVisitOrderPlanner()
`,sr=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,cr=`# Find a connected route through free grid cells.

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
`,lr=`# Challenge 8: choose and execute a least-cost multi-stop service route.

from challenge import (
    ARENA_MAP,
    CLEARANCE_MM,
    FINISH_NODE_INDEX,
    GRID_RESOLUTION_MM,
    INITIAL_POSE,
    NODE_GOALS,
    NODE_NAMES,
    REQUIRED_NODE_INDICES,
    START_NODE_INDEX,
)
from course_setup import (
    make_navigation_controller,
    make_robot,
    make_route_cost_grid_planner,
    make_visit_order_planner,
)
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import OccupancyGrid, distance_to_goal, wrap_angle_rad


def build_pairwise_paths(grid):
    planner = make_route_cost_grid_planner()
    cells = tuple(
        grid.world_to_cell(goal.x_mm, goal.y_mm) for goal in NODE_GOALS
    )
    paths = {}
    costs = []
    for start_index in range(len(NODE_GOALS)):
        row = []
        for finish_index in range(len(NODE_GOALS)):
            path = planner.plan(grid, cells[start_index], cells[finish_index])
            paths[(start_index, finish_index)] = path
            row.append(None if path is None else len(path.cells) - 1)
        costs.append(tuple(row))
    return tuple(costs), paths


def validate_order(order):
    if not isinstance(order, (tuple, list)):
        raise RuntimeError("VisitOrderPlanner must return a tuple, list, or None")
    order = tuple(order)
    if len(order) != len(REQUIRED_NODE_INDICES) + 2:
        raise RuntimeError("VisitOrderPlanner returned the wrong number of nodes")
    if order[0] != START_NODE_INDEX or order[-1] != FINISH_NODE_INDEX:
        raise RuntimeError("VisitOrderPlanner changed the start or finish node")
    services = order[1:-1]
    if len(set(services)) != len(services) or set(services) != set(REQUIRED_NODE_INDICES):
        raise RuntimeError("VisitOrderPlanner must include each required stop once")
    return order


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    # Convert arena geometry to clearance-aware cells before planning.
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    cost_table, paths = build_pairwise_paths(grid)
    order = make_visit_order_planner().plan(
        cost_table,
        START_NODE_INDEX,
        REQUIRED_NODE_INDICES,
        FINISH_NODE_INDEX,
    )
    if order is None:
        print("Challenge 8: result=no_complete_route")
        return None
    order = validate_order(order)

    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    serviced = []
    planned_transitions = 0
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE)
        for start_index, finish_index in zip(order, order[1:]):
            path = paths[(start_index, finish_index)]
            if path is None:
                raise RuntimeError("Selected order contains a disconnected segment")
            planned_transitions += len(path.cells) - 1
            # Convert the checked cell path back to world-coordinate goals.
            goals = list(path.to_goals(grid))
            goals[-1] = NODE_GOALS[finish_index]
            navigation.start(goals)
            # Recompute one motion request from each newly estimated pose.
            while not navigation.is_complete():
                state = robot.step(navigation.update(state.pose))

            if not goal_is_reached(state.pose, NODE_GOALS[finish_index]):
                print(
                    "Challenge 8: result=endpoint_not_reached endpoint={} "
                    "final_pose={}".format(
                        NODE_NAMES[finish_index], state.pose
                    )
                )
                raise RuntimeError("Navigation finished before the route endpoint was reached")
            if finish_index in REQUIRED_NODE_INDICES:
                serviced.append(NODE_NAMES[finish_index])

        expected_services = tuple(NODE_NAMES[index] for index in order[1:-1])
        if tuple(serviced) != expected_services:
            raise RuntimeError("Recorded service stops do not match the planned order")
        print(
            "Challenge 8: result=complete visit_order={} serviced={} "
            "planned_cell_transitions={} final_pose={}".format(
                tuple(NODE_NAMES[index] for index in order),
                tuple(serviced),
                planned_transitions,
                state.pose,
            )
        )
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
`,ur=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,dr=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,fr=`# Correct odometry position from stationary observations of known walls.

from ucsb_xrp.student_api import PoseCorrectorBase

# PoseCorrector — Correct estimated position from known-wall range observations.
# Called by: Wall-range pose correction task.
# Methods: reset(), corrected_pose(), observe_x(), observe_y().
# Inputs: Pose and wall-range measurements (mm).
# State: Retained x/y translation offsets; inherited sensor forward offset (mm).
# Returns: Corrected Pose (mm, rad).

class PoseCorrector(PoseCorrectorBase):
    # PoseCorrectorBase validates and stores sensor_forward_offset_mm.

    def reset(self, raw_pose):
        # raw_pose is the current odometry Pose in arena-frame mm and radians.
        # Clear retained x/y translation offsets and return raw_pose unchanged.
        raise NotImplementedError("Complete PoseCorrector.reset")

    def corrected_pose(self, raw_pose):
        # Add the retained x/y translation offsets (mm) to raw_pose.x_mm and
        # raw_pose.y_mm; preserve raw_pose.heading_rad. reset() must establish
        # the offsets before this method applies them.
        raise NotImplementedError("Complete PoseCorrector.corrected_pose")

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena x axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_x_mm is that wall's fixed arena x coordinate in mm.
        # facing_positive_x is True toward increasing x, False toward decreasing
        # x. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained x correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_x")

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena y axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_y_mm is that wall's fixed arena y coordinate in mm.
        # facing_positive_y is True toward increasing y, False toward decreasing
        # y. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained y correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_y")
`,pr=`# Limit forward speed from measured speed and available forward range.

from ucsb_xrp.student_api import RangeSafetyControllerBase

# RangeSafetyController — Limit forward motion using measured speed and available range.
# Called by: Range-constrained stopping loop.
# Methods: update().
# Inputs: Requested and measured forward speed (mm/s); range (mm or None).
# State: Inherited response time, minimum deceleration, margin, speed limit; no history.
# Returns: Nonnegative forward-speed request (mm/s).

class RangeSafetyController(RangeSafetyControllerBase):
    # RangeSafetyControllerBase validates and stores the four settings.

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        # requested_speed_mm_s is the desired forward speed; measured_speed_mm_s
        # is the current forward speed. range_mm is clearance ahead in mm or
        # None when unavailable. Return a nonnegative speed in mm/s no greater
        # than the request or self.maximum_speed_mm_s. Return zero if range is
        # unavailable or stopping cannot leave self.stop_margin_mm of clearance.
        raise NotImplementedError("Complete RangeSafetyController.update")
`,mr=`# Robot and navigation settings shared by Challenge 8 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,
    approach_speed_mm_s=96.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.7,
    position_tolerance_mm=15.0,
    heading_tolerance_rad=0.07,
    realign_heading_rad=0.25,
)
`,hr=`# Convert encoder, time and optional sensors into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,gr=`# Choose the least-cost order for a bounded set of required service stops.

from ucsb_xrp.student_api import VisitOrderPlannerBase

# VisitOrderPlanner — Select an order for a fixed set of required stops.
# Called by: Multi-stop route planning task.
# Methods: plan().
# Inputs: Directed cost table and integer start/required/finish node indices.
# State: Search data local to one plan() call.
# Returns: Tuple of node indices in visit order, or None.

class VisitOrderPlanner(VisitOrderPlannerBase):
    def plan(self, cost_table, start_index, required_indices, finish_index):
        # cost_table[a][b] is the directed cost from node a to b, or None when
        # that segment is unavailable. The indices identify the start, required
        # intermediate stops, and finish in that table.
        # Return a tuple containing start, every required index exactly once,
        # and finish. Return None when every complete order uses an unavailable
        # cost. Break equal-cost ties lexicographically.
        raise NotImplementedError("Complete VisitOrderPlanner.plan")
`,_r=`# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,vr=`from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
`,yr=`# Exercise the student file directly, independently of the Run selector.
from line_follower import LineFollower
from robot_config import LINE_FOLLOWER_SETTINGS
from ucsb_xrp import MotionCommand, ReflectanceReadings

def check_line_follower():
    follower = LineFollower(LINE_FOLLOWER_SETTINGS)
    try:
        # Reset between opposite offsets so retained derivative state does not
        # reverse the sign expected from the current sensor pair.
        follower.reset()
        centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
        left = follower.update(ReflectanceReadings(0.8, 0.2), 0.04)
        follower.reset()
        right = follower.update(ReflectanceReadings(0.2, 0.8), 0.04)
        for command in (centered, left, right):
            assert isinstance(command, MotionCommand), "update must return MotionCommand"
            assert 0 <= command.forward_speed_mm_s <= LINE_FOLLOWER_SETTINGS["cruise_speed_mm_s"], "forward speed is outside its bounds"
            assert abs(command.turn_rate_rad_s) <= LINE_FOLLOWER_SETTINGS["maximum_turn_rate_rad_s"], "turn rate is outside its bounds"
        assert centered.turn_rate_rad_s == 0, "equal readings must request no turn after reset"
        assert left.turn_rate_rad_s > 0 and right.turn_rate_rad_s < 0, "turn toward the darker sensor"
        follower.reset()
        assert follower.update(ReflectanceReadings(0.6, 0.6), 0.02).turn_rate_rad_s == 0, "reset must clear controller history"
    except NotImplementedError as error:
        print("NOT IMPLEMENTED · LineFollower:", error)
        return
    except (AssertionError, ValueError, TypeError) as error:
        print("FAIL · LineFollower:", error)
        raise AssertionError("LineFollower student checks failed")
    print("PASS · LineFollower: student centered, left, right, bounds and reset examples")

check_line_follower()
`,br=`# Challenge 9 reuses supplied drive components and makes LineFollower editable.

from line_follower import LineFollower as StudentLineFollower
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower


USE_STUDENT_LINE_FOLLOWER = False


# Wheel and odometry components remain supplied; line steering is selected below.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Local line steering is selected independently of wheel-speed control.
def make_line_follower(settings):
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)
`,xr=`# Ordered odometry checkpoints qualify the finish-bar detector.
from math import sqrt

CHECKPOINTS_MM = ((700.0, -200.0), (700.0, 200.0), (-700.0, 200.0), (-700.0, -200.0))
CHECKPOINT_TOLERANCE_MM = 240.0

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: Estimated Pose, finish-bar detection, confirmation samples.
# State: Checkpoint index, left-start flag, finish sample count.
# Returns: True only after the ordered lap is complete.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False
        self.finish_samples = 0

    def update(self, pose, on_finish, confirm_samples):
        if self.checkpoints_reached < len(CHECKPOINTS_MM):
            x_mm, y_mm = CHECKPOINTS_MM[self.checkpoints_reached]
            distance_mm = sqrt((pose.x_mm - x_mm) ** 2 + (pose.y_mm - y_mm) ** 2)
            if distance_mm <= CHECKPOINT_TOLERANCE_MM:
                self.checkpoints_reached += 1
        # The first finish reading is only the starting bar; completion waits
        # for departure, ordered checkpoints, and confirmed return.
        if not on_finish:
            self.left_start = True
            self.finish_samples = 0
        elif self.left_start and self.checkpoints_reached == len(CHECKPOINTS_MM):
            self.finish_samples += 1
        return self.finish_samples >= confirm_samples
`,Sr=`# Use two normalized reflectance readings to follow the line locally.

from ucsb_xrp import LineFollowerBase

# LineFollower — Convert paired floor readings into local steering.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: ReflectanceReadings (0 light to 1 dark), elapsed time (s).
# State: Feedback error history cleared by reset().
# Returns: MotionCommand (mm/s, rad/s).

class LineFollower(LineFollowerBase):
    def update(self, reflectance, dt_s):
        # Return MotionCommand(forward_speed_mm_s, turn_rate_rad_s).
        # reflectance.left and .right are 0 on a light floor and 1 on a dark line.
        raise NotImplementedError("Complete LineFollower.update")
`,Cr=`# Publish line tracking signals for the Monitor.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_line_values(readings, line_error, checkpoints_reached, line_lost):
    live.plot("reflectance_left", readings.left)
    live.plot("reflectance_right", readings.right)
    live.plot("line_error", line_error)
    live.watch("checkpoints_reached", checkpoints_reached)
    live.watch("phase", "line_lost_stopping" if line_lost else "following")
`,wr=`# Follow one qualified circuit; stop with an explicit result if the line is lost.
from challenge import INITIAL_POSE
from course_setup import make_line_follower, make_robot
from lap_progress import LapProgress
from live_variables import publish_line_values
from robot_config import (
    FINISH_CONFIRM_SAMPLES,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
)
from ucsb_xrp import MotionCommand, elapsed_time_s

# Keep a physical trial bounded if line following never reaches the finish.
MAXIMUM_RUN_TIME_S = 100.0
MAXIMUM_LOST_LINE_S = 0.4

def run_challenge():
    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
    follower.reset()
    lap = LapProgress()
    lost_line_s = 0.0
    result = "timeout"
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(INITIAL_POSE, read_reflectance=True)
        start_ms = state.measurements.time_ms
        while elapsed_time_s(state.measurements.time_ms, start_ms) < MAXIMUM_RUN_TIME_S:
            readings = state.measurements.reflectance
            if readings is None:
                result = "reflectance_unavailable"
                break
            on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD
            if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
                result = "complete"
                break
            if max(readings.left, readings.right) < LINE_VISIBLE_THRESHOLD:
                command = MotionCommand(0.0, 0.0)
                lost_line_s += state.measurements.dt_s
                if lost_line_s >= MAXIMUM_LOST_LINE_S:
                    result = "line_lost"
                    break
            else:
                command = follower.update(readings, state.measurements.dt_s)
                lost_line_s = 0.0
            publish_line_values(readings, follower.line_error, lap.checkpoints_reached, lost_line_s > 0.0)
            state = robot.step(command, read_reflectance=True)
        print("Line circuit: result={} checkpoints={}/4 elapsed_s={}".format(result, lap.checkpoints_reached, elapsed_time_s(state.measurements.time_ms, start_ms)))
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_challenge()
`,Tr=`from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# The supplied defaults use PD. Set ki = kd = 0 for a P-only comparison.
# Steering limits and gains are read by LineFollower on each sample.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": 100.0,
    "minimum_speed_mm_s": 45.0,
    "kp_rad_s": 1.8,
    "ki_rad_s2": 0.0,
    "kd_rad": 0.025,
    "integral_limit_s": 0.5,
    "maximum_turn_rate_rad_s": 1.4,
    "turn_slowdown": 0.45,
}

# Physical values depend on the floor, tape, sensor height, and ambient light.
LINE_VISIBLE_THRESHOLD = 0.12
FINISH_THRESHOLD = 0.80
FINISH_CONFIRM_SAMPLES = 4
`,Er=`# Robot Curling target in the selected world.

from ucsb_xrp import distance_to_goal, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
FINISH = WORLD.waypoint("finish")
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)
`,Dr=`# Test the Challenge 1 component classes without starting either robot.
# In the IDE, select Test functions. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(SensorModel, WheelSpeedController)
`,Or=`# Select either the supplied reference class or the class in each project file.

from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelController,
)
from wheel_speed_controller import WheelSpeedController as StudentWheelController


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelController
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
`,kr=`# Monitor controls for the distance-based stopping decision.
# Read each control's current .value when choosing the next speed.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED_MM_S = live.number("cruise_speed_mm_s", 120.0, 0.0, 240.0, 5.0, unit="mm/s", label="Cruise speed")
SLOWDOWN_DISTANCE_MM = live.number("slowdown_distance_mm", 120.0, 0.0, 1000.0, 10.0, unit="mm", label="Slowing distance")
`,Ar=`# Robot Curling: measure travel and call the distance-based stopping rule.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from stopping_controller import speed_for_distance
from ucsb_xrp import run_straight_trial


# The world supplies the start pose and target distance; the selected robot
# components supply measurements and wheel control. The callback alone chooses
# forward speed from remaining measured travel. The runner records and stops.
run_straight_trial(make_robot(ROBOT_CONFIG), INITIAL_POSE, TRAVEL_DISTANCE_MM, speed_for_distance)
`,jr=`# Settings shared by Challenge 1 programs for one XRP robot.

from ucsb_xrp import RobotConfig


# Example virtual settings; measure these quantities for a physical XRP.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.00315,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
`,Mr=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Nr=`# Purpose: choose forward speed from measured remaining distance.
# Called by: the supplied straight trial after each robot sample.
# Inputs: remaining_mm in mm; live cruise speed and slowing distance.
# State: none; live values are read on each call.
# Returns: forward speed in mm/s; zero requests a stop.

from live_variables import CRUISE_SPEED_MM_S, SLOWDOWN_DISTANCE_MM


def speed_for_distance(remaining_mm):
    # remaining_mm is measured wheel travel left to the target, in mm.
    # Read both live .value controls. Return a forward request in mm/s;
    # zero ends the trial.
    raise NotImplementedError("Choose speed from measured remaining distance")
`,Pr=`# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,Fr=`from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose

CHECKPOINTS_MM = tuple((goal.x_mm, goal.y_mm) for goal in WORLD.waypoints())
CHECKPOINT_TOLERANCE_MM = 150.0
MAXIMUM_LOST_LINE_S = 0.4
`,Ir=`from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController
from differential_drive import DifferentialDrive
from ucsb_xrp.component_checks import run_component_checks
from robot_config import ROBOT_CONFIG
from ucsb_xrp import RawSensors, ReflectanceReadings

# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(SensorModel, WheelSpeedController, DifferentialDrive)


def check_reflectance_preservation():
    # An earlier wheel-only model must retain the newly requested sensors.
    model = SensorModel(ROBOT_CONFIG)
    readings = ReflectanceReadings(0.2, 0.8)
    try:
        first = model.reset(RawSensors(0, 0, 0, None, False, readings))
        later = model.update(RawSensors(20, 0, 0, None, False, readings))
        if first.reflectance != readings or later.reflectance != readings:
            raise AssertionError("Preserve raw.reflectance in both Measurements results")
    except NotImplementedError as error:
        print("NOT IMPLEMENTED · SensorModel reflectance:", error)
        return
    print("PASS · SensorModel: reset and update preserve reflectance")


check_reflectance_preservation()

# Exercise the student file directly, independently of the Run selector.
from line_follower import LineFollower
from robot_config import LINE_FOLLOWER_SETTINGS
from ucsb_xrp import MotionCommand, ReflectanceReadings

def check_line_follower():
    follower = LineFollower(LINE_FOLLOWER_SETTINGS)
    try:
        follower.reset()
        centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
        left = follower.update(ReflectanceReadings(0.8, 0.2), 0.04)
        follower.reset()
        right = follower.update(ReflectanceReadings(0.2, 0.8), 0.04)
        for command in (centered, left, right):
            assert isinstance(command, MotionCommand), "update must return MotionCommand"
            assert 0 <= command.forward_speed_mm_s <= LINE_FOLLOWER_SETTINGS["cruise_speed_mm_s"], "forward speed is outside its bounds"
            assert abs(command.turn_rate_rad_s) <= LINE_FOLLOWER_SETTINGS["maximum_turn_rate_rad_s"], "turn rate is outside its bounds"
        assert centered.turn_rate_rad_s == 0, "equal readings must request no turn after reset"
        assert left.turn_rate_rad_s > 0 and right.turn_rate_rad_s < 0, "turn toward the darker sensor"
        follower.reset()
        assert follower.update(ReflectanceReadings(0.6, 0.6), 0.02).turn_rate_rad_s == 0, "reset must clear controller history"
    except NotImplementedError as error:
        print("NOT IMPLEMENTED · LineFollower:", error)
        return
    except (AssertionError, ValueError, TypeError) as error:
        print("FAIL · LineFollower:", error)
        raise AssertionError("LineFollower student checks failed")
    print("PASS · LineFollower: student centered, left, right, bounds and reset examples")

check_line_follower()
`,Lr=`# Choose one implementation of each component and assemble the line circuit.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from line_follower import LineFollower as StudentLineFollower
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), SuppliedOdometry(config))

# Local line steering is selected independently of wheel-speed control.
def make_line_follower(settings):
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)
`,Rr=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,zr=`# Count a lap only after passing the four marked checkpoints in order.
from math import sqrt

from challenge import CHECKPOINTS_MM, CHECKPOINT_TOLERANCE_MM

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: observe_line(), update().
# Inputs: Paired reflectance, elapsed seconds, estimated Pose, finish detection.
# State: Checkpoint index, line-loss interval, finish sample count.
# Returns: Line visibility and completed-lap status.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False
        self.finish_samples = 0
        self.lost_line_s = 0.0

    def observe_line(self, readings, dt_s, visible_threshold):
        # Return True when either normalized sensor reads above the threshold.
        # Otherwise add dt_s (seconds) to retained lost_line_s.
        visible = max(readings.left, readings.right) >= visible_threshold
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s
        return visible

    def update(self, pose, on_finish, confirm_samples):
        # Return True after the estimated Pose visits each checkpoint in order
        # and on_finish is observed for confirm_samples after leaving the start.
        if self.checkpoints_reached < len(CHECKPOINTS_MM):
            x_mm, y_mm = CHECKPOINTS_MM[self.checkpoints_reached]
            distance_mm = sqrt((pose.x_mm - x_mm) ** 2 + (pose.y_mm - y_mm) ** 2)
            if distance_mm <= CHECKPOINT_TOLERANCE_MM:
                self.checkpoints_reached += 1
        # Finish detection requires leaving the bar, passing all checkpoints,
        # and returning to the bar for consecutive confirmed readings.
        if not on_finish:
            self.left_start = True
            self.finish_samples = 0
        elif self.left_start and self.checkpoints_reached == len(CHECKPOINTS_MM):
            self.finish_samples += 1
        return self.finish_samples >= confirm_samples
`,Br=`# Use two normalized reflectance readings to follow the line locally.

from ucsb_xrp import LineFollowerBase

# LineFollower — Convert paired floor readings into local steering.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: ReflectanceReadings (0 light to 1 dark), elapsed time (s).
# State: Feedback error history cleared by reset().
# Returns: MotionCommand (mm/s, rad/s).

class LineFollower(LineFollowerBase):
    def update(self, reflectance, dt_s):
        # Return MotionCommand(forward_speed_mm_s, turn_rate_rad_s).
        # reflectance.left and .right range from 0 (light) to 1 (dark).
        # A darker left reading should request a positive (left) turn;
        # a darker right reading should request a negative (right) turn.
        # dt_s is elapsed seconds since the preceding floor reading. Use the
        # gain and speed entries in self.settings; bound forward speed by
        # minimum_speed_mm_s and cruise_speed_mm_s and turning by
        # maximum_turn_rate_rad_s. reset() clears retained error history.
        raise NotImplementedError("Complete LineFollower.update")
`,Vr=`# Publish the measurements and control state for one line-circuit sample.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 100.0
DEFAULT_P_GAIN_RAD_S = 1.8
# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED = live.number("cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S, 50.0, 180.0, 5.0, label="Cruise speed", unit="mm/s")
P_GAIN = live.number("line_gain", DEFAULT_P_GAIN_RAD_S, 0.0, 5.0, 0.1, label="P gain", unit="rad/s")


# Publish observed values for inspection without changing the motion decision.
def publish_line_values(readings, command, line_error, checkpoints_reached, phase):
    # Plot normalized left/right reflectance, their signed difference, and
    # command.turn_rate_rad_s (rad/s). Watch the reached-checkpoint count and
    # phase label for this sample. Return None.
    live.plot("reflectance_left", readings.left)
    live.plot("reflectance_right", readings.right)
    live.plot("line_error", line_error)
    live.plot("turn_rate_rad_s", command.turn_rate_rad_s, unit="rad/s", label="Requested turn rate")
    live.watch("checkpoints_reached", checkpoints_reached)
    live.watch("phase", phase)
`,Hr=`# Follow the dark line for one lap; stop if the line is lost.
from challenge import CHECKPOINTS_MM, INITIAL_POSE, MAXIMUM_LOST_LINE_S
from course_setup import make_line_follower, make_robot
from lap_progress import LapProgress
from live_variables import publish_line_values
from robot_config import (
    FINISH_CONFIRM_SAMPLES,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
    apply_line_controls,
)
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


# Assemble selected wheel and sensing components separately from local steering.
robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
follower.reset()
lap = LapProgress()  # Track ordered checkpoints and return to the finish bar.
try:
    # Establish encoder/time origins and request floor readings on every step.
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:  # Read sensors and request motion until lap completion or line loss.
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        # Both sensors must see the wide bar; pose supplies ordered checkpoints.
        on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD
        if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
            result = "complete"
            break
        # An unseen line requests zero motion while the loss duration accumulates.
        if not lap.observe_line(readings, state.measurements.dt_s, LINE_VISIBLE_THRESHOLD):
            command = STOP_COMMAND
            if lap.lost_line_s >= MAXIMUM_LOST_LINE_S:
                result = "line_lost"
                break
        else:
            command = follower.update(readings, state.measurements.dt_s)
        # Publish the decision made from this sample before acquiring the next.
        publish_line_values(
            readings, command, follower.line_error, lap.checkpoints_reached,
            "line_lost_stopping" if lap.lost_line_s else "following",
        )
        state = robot.step(command, read_reflectance=True)
    print("Line circuit: result={} checkpoints={}/{} elapsed_s={}".format(
        result, lap.checkpoints_reached, len(CHECKPOINTS_MM),
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:  # Stop the motors when the loop finishes or raises an error.
    robot.stop()
`,Ur=`# Print ten stationary pairs of floor-sensor readings.

from challenge import INITIAL_POSE
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import STOP_COMMAND


robot = make_robot(ROBOT_CONFIG)
try:
    # Enable floor sensing at the configured pose without requesting motion.
    robot.start(INITIAL_POSE, read_reflectance=True)
    # Repeated stationary pairs show sensor variability at one placement.
    for _ in range(10):
        state = robot.step(STOP_COMMAND, read_reflectance=True)
        print(state.measurements.reflectance)
finally:
    # Leave the motors at zero if sensing or printing raises an exception.
    robot.stop()
`,Wr=`from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_P_GAIN_RAD_S, P_GAIN
from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# The supplied defaults use PD. Set ki = kd = 0 for a P-only comparison.
# Steering limits and gains are read by LineFollower on each sample.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": DEFAULT_CRUISE_SPEED_MM_S,
    "minimum_speed_mm_s": 45.0,
    "kp_rad_s": DEFAULT_P_GAIN_RAD_S,
    "ki_rad_s2": 0.0,
    "kd_rad": 0.025,
    "integral_limit_s": 0.5,
    "maximum_turn_rate_rad_s": 1.4,
    "turn_slowdown": 0.45,
}

# Apply changed Monitor values at the next measured control-loop boundary.
# Input: active LineFollower; effect: update its mutable settings for this sample.
def apply_line_controls(follower):
    follower.settings["cruise_speed_mm_s"] = CRUISE_SPEED.value
    follower.settings["kp_rad_s"] = P_GAIN.value

# Physical values depend on the floor, tape, sensor height, and ambient light.
LINE_VISIBLE_THRESHOLD = 0.12
FINISH_THRESHOLD = 0.80
FINISH_CONFIRM_SAMPLES = 4
`,Gr=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Kr=`# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,qr=`# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
`,Jr=`# Test the Challenge 3 component classes without starting either robot.
# In the IDE, select Test functions. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
)
`,Yr=`# Choose one implementation of each component and assemble Challenge 3.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)
`,Xr=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,Zr=`# Publish the current waypoint count and estimated heading.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Publish observed values for inspection without changing the motion decision.
def publish_goal_count(reached_count):
    # Show the integer number of NavigationGoal targets accepted so far.
    live.watch("goals_reached", reached_count)


def publish_heading(pose):
    # Plot pose.heading_rad, the estimated arena-frame heading in radians.
    live.plot("heading_rad", pose.heading_rad, unit="rad", label="Estimated heading")
`,Qr=`# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
from course_setup import make_navigation_controller, make_robot
from live_variables import publish_goal_count, publish_heading
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_progress import count_reached_goals


# Keep robot sampling/odometry and route decisions in their selected components.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
step_count = 0
reached_count = 0
try:
    # The world pose initializes odometry; observed goal count starts there.
    state = robot.start(INITIAL_POSE)
    reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)
    navigation.start(ROUTE)
    # One measured pose produces one navigation request and one robot sample.
    while not navigation.is_complete():
        publish_goal_count(reached_count)
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))
        publish_heading(state.pose)
        step_count += 1
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)

    # Controller completion alone does not establish that each goal was observed.
    result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
    print(
        "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
        "final_pose={}".format(
            result, reached_count, len(ROUTE), step_count, state.pose
        )
    )
    if result != "complete":
        raise RuntimeError("Navigation finished before every waypoint was observed in order")
finally:  # Stop the motors after normal completion or a Python exception.
    robot.stop()
`,$r=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,ei=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,ti=`# Robot and navigation settings shared by Challenge 3 programs.

from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_TURN_RATE_RAD_S, TURN_RATE
from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Live controls are applied after each Robot sample, without resetting route progress.
# Input: active NavigationController; effect: update changed motion settings.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value
    turn_rate_rad_s = TURN_RATE.value
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,ni=`# Check observed waypoint arrival independently of the navigation controller.
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
    # Advance only through goals observed at their assigned position in order.
    while reached_count < len(route) and goal_is_reached(pose, route[reached_count], config):
        reached_count += 1
    return reached_count
`,ri=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,ii=`# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,ai=`# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
# Obstacle expansion for robot size and path-following error.
CLEARANCE_MM = 150.0

# Motion selection and planner memory limit.
EXECUTE_ROUTE = False
MAXIMUM_GRID_CELLS = 1024
`,oi=`# Test the Challenge 4 component classes without starting either robot.
# In the IDE, select Test functions. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
)
`,si=`# Choose one implementation of each component and assemble Challenge 4.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
`,ci=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,li=`# Print the cells used by the mapped-route planner.

from ucsb_xrp import GridCell


def print_grid(grid, start, goal, path=None):
    # Show clearance, endpoints, and any validated route in grid coordinates.
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
    # Print high rows first so positive arena y appears upward on the page.
    path_cells = path.cells if path is not None else ()
    for row in range(grid.row_count - 1, -1, -1):
        symbols = []
        for column in range(grid.column_count):
            cell = GridCell(column, row)
            # Endpoint symbols take precedence; blocked status is printed above.
            if cell == start:
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
`,ui=`# Find a connected route through free grid cells.

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
`,di=`# Publish the route follower's current progress.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Publish observed values for inspection without changing the motion decision.
def publish_navigation_steps(step_count):
    # Show the number of Robot.step() calls completed so far.
    live.watch("navigation_steps", step_count)
`,fi=`# Challenge 4: plan and follow a route around known obstacles.

from challenge import WORLD, ARENA_MAP, INITIAL_POSE, DESTINATION
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from challenge import EXECUTE_ROUTE
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from grid_display import print_grid
from live_variables import publish_navigation_steps
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_validation import goal_is_reached, path_error
from ucsb_xrp import OccupancyGrid


print("World:", WORLD.label)
# Convert arena geometry to clearance-aware cells before planning.
grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
    raise ValueError("The map exceeds {} cells. Increase GRID_RESOLUTION_MM in challenge.py.".format(MAXIMUM_GRID_CELLS))
# Planner endpoints are cells; the route execution later uses world coordinates.
start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)
goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
path = make_grid_planner().plan(grid, start, goal)
if path is None:
    print_grid(grid, start, goal)
    print("Challenge 4: result=no_path")
else:
    # Reject an unconnected, blocked, or misplaced path before motion is enabled.
    invalid_reason = path_error(grid, start, goal, path)
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
            # Use cell centers along the route but the exact destination marker.
            goals = list(path.to_goals(grid))
            goals[-1] = DESTINATION

            # Construct the robot from this project's configured components.
            robot = make_robot(ROBOT_CONFIG)
            navigation = make_navigation_controller(NAVIGATION_CONFIG)
            step_count = 0
            try:
                # Start establishes the initial pose and encoder/time measurement origins.
                state = robot.start(INITIAL_POSE)
                navigation.start(goals)
                # Recompute the motion request from each new odometry pose.
                while not navigation.is_complete():
                    publish_navigation_steps(step_count)
                    apply_navigation_controls(navigation)
                    state = robot.step(navigation.update(state.pose))
                    step_count += 1

                # Verify destination tolerance separately from controller status.
                result = (
                    "complete"
                    if goal_is_reached(state.pose, DESTINATION, navigation.config)
                    else "destination_not_reached"
                )
                print(
                    "Challenge 4: result={} path_cells={} navigation_steps={} "
                    "final_pose={}".format(
                        result, len(path.cells), step_count, state.pose
                    )
                )
                if result != "complete":
                    raise RuntimeError("Navigation finished before the destination was reached")
            finally:  # Stop the motors whenever route execution exits.
                robot.stop()
`,pi=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,mi=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,hi=`# Robot and navigation settings shared by Challenge 4 programs.

from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_TURN_RATE_RAD_S, TURN_RATE
from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Live controls are applied after each Robot sample, without resetting route progress.
# Input: active NavigationController; effect: update changed motion settings.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value
    turn_rate_rad_s = TURN_RATE.value
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,gi=`# Validate a planned grid route before constructing or moving the robot.
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
`,_i=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,vi=`# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,yi=`# Geometry is known; only the named gate's occupancy is uncertain.
from ucsb_xrp import load_world
from robot_config import ROBOT_CONFIG

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_ROUTE = tuple(WORLD.waypoint(name) for name in ("outbound_1", "outbound_2", "observation"))
HOME = WORLD.waypoint("home")
# Use one map definition in both virtual cases; never read the selected
# world's obstacle list to infer the hidden gate state.
MISSION_MAP = load_world(world_id="gate-blocked").arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
RANGE_SAMPLE_COUNT = 7
MINIMUM_USABLE_RANGE_COUNT = 4
BLOCKED_RANGE_THRESHOLD_MM = 550.0
GATE_FEATURE = "center_gate"

# Stopped-wheel criteria and planner memory limit.
STATIONARY_DURATION_S = 0.3
STATIONARY_SPEED_MM_S = 5.0
MAXIMUM_STOP_WAIT_S = 3.0
MAXIMUM_GRID_CELLS = 1024
# Allow each distinct ultrasound attempt two control periods plus two 70 ms
# acquisition intervals; retain a 2 s minimum for scheduler variation.
RANGE_COLLECTION_TIMEOUT_S = max(2.0, RANGE_SAMPLE_COUNT * (2 * ROBOT_CONFIG.sample_period_ms + 140) / 1000.0)
`,bi=`# Test the Challenge 5 component classes without starting either robot.
# In the IDE, select Test functions. Each check names the class and method,
# example input, required result, and observed result, including range examples.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)
`,xi=`# Choose one implementation of each component and assemble Challenge 5.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
`,Si=`# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
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
`,Ci=`# Find a connected route through free grid cells.

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
`,wi=`# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Publish observed values for inspection without changing the motion decision.
def publish_phase(phase):
    # Show the current mission phase label, such as outbound or return.
    live.watch("mission_phase", phase)


def publish_result(result):
    # Show the result label reported when the mission stops or finishes.
    live.watch("mission_result", result)


def publish_goals_reached(count):
    # Show how many ordered NavigationGoal targets were accepted.
    live.watch("goals_reached", count)


def publish_return_path_cells(count):
    # Show the number of GridCell entries in the planned return path.
    live.watch("return_path_cells", count)
`,Ti=`# Follow a known outbound corridor, observe, then plan the return.
from challenge import INITIAL_POSE, OUTBOUND_ROUTE, HOME
from challenge import STATIONARY_DURATION_S, STATIONARY_SPEED_MM_S, MAXIMUM_STOP_WAIT_S
from challenge import RANGE_SAMPLE_COUNT, MINIMUM_USABLE_RANGE_COUNT, RANGE_COLLECTION_TIMEOUT_S
from challenge import BLOCKED_RANGE_THRESHOLD_MM, GATE_FEATURE
from challenge import MISSION_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from live_variables import publish_phase, publish_result, publish_return_path_cells
from mission_policy import observed_gate
from mission_steps import follow_route, valid_path
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import OccupancyGrid, STOP_COMMAND, elapsed_time_s

# Report each route or observation result through one named output path.
def report(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)


# The same selected sensing, navigation, and planning components serve both legs.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:
    # World pose initializes odometry; the outbound route is known in advance.
    state = robot.start(INITIAL_POSE)
    publish_phase("outbound")
    state, result = follow_route(robot, navigation, state, OUTBOUND_ROUTE)
    robot.stop()
    if result != "arrived":
        report("outbound_" + result)
    else:
        publish_phase("stopping")
        # Require continuous low wheel speed before taking a range observation.
        stationary_s = 0.0
        waiting_for_stop_start_ms = state.measurements.time_ms
        while stationary_s < STATIONARY_DURATION_S and elapsed_time_s(
            state.measurements.time_ms, waiting_for_stop_start_ms
        ) <= MAXIMUM_STOP_WAIT_S:
            state = robot.step(STOP_COMMAND)
            speeds = state.measurements.wheel_speeds
            if max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) <= STATIONARY_SPEED_MM_S:
                stationary_s += state.measurements.dt_s
            else:
                stationary_s = 0.0
        if stationary_s < STATIONARY_DURATION_S:
            report("failed_stationary_check")
        else:
            publish_phase("observe")
            # Distinct range attempts are combined only after the robot stops.
            samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
            state = robot.state
            estimate_mm = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
            blocked = observed_gate(estimate_mm, BLOCKED_RANGE_THRESHOLD_MM)
            print("stationary_range_samples_mm:", samples)
            print("range_estimate_mm:", estimate_mm)
            if blocked is None:
                report("unusable_range")
            else:
                publish_phase("plan_return")
                robot.stop()
                # Only the named gate changes in the known return map.
                arena = MISSION_MAP.with_feature_blocked(GATE_FEATURE, blocked)
                # Convert arena geometry to clearance-aware cells before planning.
                grid = OccupancyGrid.from_arena(arena, GRID_RESOLUTION_MM, CLEARANCE_MM)
                if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
                    raise ValueError("Use at most {} cells for the return map".format(MAXIMUM_GRID_CELLS))
                # Plan from the estimated stopped pose to the fixed home marker.
                start = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
                goal = grid.world_to_cell(HOME.x_mm, HOME.y_mm)
                path = make_grid_planner().plan(grid, start, goal)
                if path is None:
                    report("no_route")
                elif not valid_path(grid, start, goal, path):
                    report("invalid_path")
                else:
                    print("gate_blocked:", blocked, "return_path_cells:", len(path.cells))
                    publish_return_path_cells(len(path.cells))
                    # Replace the last cell center with the exact home goal.
                    goals = list(path.to_goals(grid))
                    goals[-1] = HOME
                    publish_phase("return")
                    return_start_ms = state.measurements.time_ms
                    state, result = follow_route(robot, navigation, state, goals)
                    robot.stop()
                    report("complete" if result == "arrived" else "return_" + result)
                    print("return_time_s:", elapsed_time_s(state.measurements.time_ms, return_start_ms))
                    print("estimated_final_pose:", state.pose)
finally:  # Stop the motors on completion, a Python error, or cooperative Stop.
    robot.stop()
`,Ei=`# Inputs: estimated range and gate threshold in mm; estimate may be None.
# Returns: True for a blocked gate, False for an open gate, None without range.
def observed_gate(estimate_mm, threshold_mm):
    # Missing range leaves the map decision unknown rather than declaring open.
    if estimate_mm is None:
        return None
    return estimate_mm <= threshold_mm
`,Di=`# Follow ordered route goals and check paths before driving.

from live_variables import publish_goals_reached
from robot_config import apply_navigation_controls
from ucsb_xrp import GridPath, distance_to_goal, wrap_angle_rad

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
    navigation.start(goals)
    reached_count = 0
    # A measured pose advances the independent arrival count before the next
    # navigation command; controller completion exits the loop.
    while True:
        while reached_count < len(goals) and reached(
            state.pose, goals[reached_count], navigation.config,
        ):
            reached_count += 1
        publish_goals_reached(reached_count)
        # Compare observed arrivals with controller completion at the same pose.
        if navigation.is_complete():
            return state, "arrived" if reached_count == len(goals) else "failed_arrival"
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))

# Inputs: OccupancyGrid, endpoint GridCell values, proposed GridPath.
# Returns: True only for free, adjacent cells from start through goal.
def valid_path(grid, start, goal, path):
    if not isinstance(path, GridPath) or path.cells[0] != start or path.cells[-1] != goal:
        return False
    if any(grid.is_blocked(cell) for cell in path.cells):
        return False
    return all(second in grid.neighbors(first) for first, second in zip(path.cells, path.cells[1:]))
`,Oi=`# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

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
        # Save this route and discard previous progress. If goals is empty,
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
`,ki=`# Estimate planar robot position and heading from measured wheel travel.

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
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
`,Ai=`# Print one raw range batch while the robot remains stopped.

from challenge import OUTBOUND_ROUTE, RANGE_COLLECTION_TIMEOUT_S, RANGE_SAMPLE_COUNT
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import Pose


point = OUTBOUND_ROUTE[-1]
robot = make_robot(ROBOT_CONFIG)
try:
    # The observation waypoint supplies the stationary sensor pose.
    robot.start(Pose(point.x_mm, point.y_mm, point.heading_rad))
    # Collect distinct ultrasound attempts, including missing echoes as None.
    samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
    print(samples)
finally:
    # Range acquisition never requires nonzero wheel effort.
    robot.stop()
`,ji=`# Robot and navigation settings shared by Challenge 5 programs.

from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_TURN_RATE_RAD_S, TURN_RATE
from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Live controls are applied after each Robot sample, without resetting route progress.
# Input: active NavigationController; effect: update changed motion settings.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value
    turn_rate_rad_s = TURN_RATE.value
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
`,Mi=`# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
`,Ni=`# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
`,Pi="# Challenge 1: Straight Run\n\n## The challenge\n\nDrive from the start line to the finish marker and use measured wheel travel to\nstop. First make the stopping distance repeatable. Then finish as close as\npossible to the assigned target time without finishing early.\n\nThe task values have one source:\n\n- [`world.json`](world.json) defines the initial pose and finish marker.\n- [`challenge.py`](challenge.py) loads `INITIAL_POSE`, calculates\n  `TRAVEL_DISTANCE_MM`, and defines `TARGET_TIME_S` and the\n  `MAX_RUN_TIME_S` run-step limit.\n\nUse these names in your program. Do not copy their current numerical values\ninto another file. Record robot-specific calibration in\n[`robot_config.py`](robot_config.py).\n\n## What you implement\n\nImplement two classes:\n\n- [`sensor_model.py`](sensor_model.py): `SensorModel.reset()` establishes the\n  encoder and time origins. `SensorModel.update()` converts each later raw\n  sample into wheel position, newest wheel travel, elapsed time, and wheel-speed\n  estimates. Use the encoder signs, wheel geometry, and speed-estimator setting\n  in `self.config`.\n- [`wheel_speed_controller.py`](wheel_speed_controller.py):\n  `WheelSpeedController.update()` compares requested and measured wheel speeds\n  and returns a limited `DriveCommand`. A zero speed request must produce an\n  exact zero command for that wheel. Use the calibration, feedback gain, and\n  command limit in `self.config`.\n\nLeave `SensorModel.estimate_range()` unfinished; Challenge 5 introduces it.\n\n## Project modules\n\n| File | Role |\n| --- | --- |\n| [`sensor_model.py`](sensor_model.py) | Defines `SensorModel`, which converts encoder counts and time to physical measurements. |\n| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Defines `WheelSpeedController`, which converts wheel-speed error to a `DriveCommand`. |\n| [`robot_config.py`](robot_config.py) | Measured and tuned settings for your XRP. |\n| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |\n| [`main.py`](main.py) | Runs the straight-distance task and reports distance and elapsed time. |\n| [`component_checks.py`](component_checks.py) | Calls the required `SensorModel` and `WheelSpeedController` methods without starting a robot. |\n\n## Provided files and tools\n\n- `StraightLineController` requests cruise speed, reduces speed near the\n  finish, and stops at the assigned travel distance.\n- The supplied `DifferentialDrive` and `Odometry` complete the robot loop until\n  Challenge 2.\n- `Robot` maintains the measured control cycle. `XRPBot` applies motor commands\n  and reads the hardware or simulator.\n\n## How the program runs\n\n```text\nfinish distance + measured wheel travel\n                 -> StraightLineController -> requested forward speed\n                 -> DifferentialDrive       -> wheel-speed targets\nencoder readings -> SensorModel             -> measured wheel speeds\ntargets + measured speeds\n                 -> WheelSpeedController     -> motor commands\n```\n\nThe loop ends when measured travel reaches `TRAVEL_DISTANCE_MM`. `main.py`\nconverts `MAX_RUN_TIME_S` to a maximum step count using the nominal sample\nperiod. If the distance has not been reached by then, it reports the failure\nand raises an error. The `finally` block in `main.py` calls\n`robot.stop()` after normal completion or a Python exception. The target runtime\nhandles the IDE's **Stop** separately; forced termination can bypass Python cleanup.\n\n## Check each component\n\nSelect **Test functions** in the IDE. The checks load `SensorModel` from\n`sensor_model.py` and `WheelSpeedController` from\n`wheel_speed_controller.py`; they do not move either robot. For each class,\nread its `USE`,\n`INPUT`, and `EXPECT` lines before the result:\n\n- `PASS` means the implemented behavior matched the stated examples.\n- `NOT IMPLEMENTED` means the named method still needs to be written.\n- `FAIL` means the method ran, but its result did not meet the stated\n  requirement.\n\nFix every `NOT IMPLEMENTED` and `FAIL`, then run **Test functions** again. Set\nthe matching `USE_STUDENT_*` flag in `course_setup.py` to `True` only after that\nclass passes its checks.\n\n## Complete the challenge\n\n1. Run the supplied classes on the virtual XRP. Locate requested wheel\n   speed, measured wheel speed, drive command, and wheel travel in Monitor.\n2. Select the `SensorModel` defined in `sensor_model.py`. Verify that\n   forward position increases, each\n   increment contains only the newest wheel travel, and the speed estimate\n   follows changes without reporting each encoder-count step as a speed spike.\n3. Select the `WheelSpeedController` defined in\n   `wheel_speed_controller.py`. Verify command limits and an exact zero command\n   at the finish.\n4. Compare repeated virtual runs using the reported distance, lateral,\n   heading, and time errors. `timed_result` states explicitly whether a run\n   finished early or satisfied the no-earlier-than-target rule.\n5. For the physical XRP, first check wheel direction and Stop with the wheels\n   clear. Then run the marked lane and record distance, elapsed time, requested\n   and measured speed, and drive command.\n\n## Reuse work in another challenge\n\nChoose **Reuse code in a new project…** in the IDE. Review **Preserve**,\n**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,\nand **Leave in the source project** (if shown) before creating the separate\nProject. The current Project remains unchanged.\n",Fi="# Challenge 2: Turn and Return\n\n## The challenge\n\nDrive to the turn marker, rotate to its assigned heading, return to the marked\nstart region, and recover the initial heading. Compare the final pose estimated\nfrom wheel travel with the robot's measured position and heading.\n\n[`world.json`](world.json) defines the initial pose and turn marker.\n[`challenge.py`](challenge.py) derives `INITIAL_POSE`,\n`OUTBOUND_DISTANCE_MM`, `TURN_HEADING_RAD`, `RETURN_DISTANCE_MM`, and\n`FINAL_HEADING_RAD`. It also names `MAX_STRAIGHT_TIME_S` and `MAX_TURN_TIME_S`,\nwhich bound steps for an unfinished phase using the nominal sample period.\nUse these names; do not repeat the current distances or headings elsewhere.\n\n## Reuse work in another challenge\n\nChoose **Reuse code in a new project…** in the IDE. Review **Preserve**,\n**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,\nand **Leave in the source project** (if shown) before creating the separate\nProject. The current Project remains unchanged.\n\n## What you implement\n\nImplement two new classes:\n\n- [`differential_drive.py`](differential_drive.py):\n  `DifferentialDrive.wheel_speeds()` converts requested forward speed and\n  counterclockwise turn rate into left and right wheel-speed targets. It uses\n  `self.config.track_width_mm` and does not need history from earlier calls.\n- [`odometry.py`](odometry.py): `Odometry.reset()` stores the initial world\n  `Pose`; `Odometry.update()` advances it from measured left and right wheel\n  increments; `pose` returns the latest estimate. Use measured wheel travel,\n  not requested speeds, motor commands, or simulator ground truth.\n\nIf turn-and-return results expose a measurement or control problem, revise\n`sensor_model.py` or `wheel_speed_controller.py` as needed. Keep the effective\ntrack width and other robot-specific values in\n[`robot_config.py`](robot_config.py).\n\n## Project modules\n\n| File | Role |\n| --- | --- |\n| [`sensor_model.py`](sensor_model.py) | Measures wheel travel and speed from encoder samples. |\n| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Converts wheel-speed error to limited motor commands. |\n| [`differential_drive.py`](differential_drive.py) | Converts robot motion to two wheel-speed targets. |\n| [`odometry.py`](odometry.py) | Estimates world position and heading from wheel travel. |\n| [`robot_config.py`](robot_config.py) | Stores measured geometry, calibration, gains, and motion settings. |\n| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |\n| [`component_checks.py`](component_checks.py) | Calls the required methods of `SensorModel`, `WheelSpeedController`, `DifferentialDrive`, and `Odometry` without starting a robot. |\n\n## Provided files and tools\n\n- [`main.py`](main.py) runs outward travel, turnaround, return travel, and final\n  heading recovery.\n- `StraightLineController` controls each measured straight segment.\n- `Robot` carries body-motion requests through wheel control, sensing, and\n  odometry at each sample.\n\n## How the program runs\n\n```text\nrequested forward speed and turn rate\n                 -> DifferentialDrive -> wheel-speed targets\n                 -> wheel control     -> motor commands\nencoder readings -> SensorModel       -> wheel increments\nwheel increments -> Odometry          -> estimated Pose\n```\n\n`main.py` names each phase in Program output and uses the estimated pose to end\neach turn. A phase that exceeds its visible time limit reports which motion did\nnot complete. Its `finally` block calls `robot.stop()` after normal completion\nor a Python exception. The target runtime handles the IDE's **Stop** separately;\nforced termination can bypass Python cleanup.\n\n## Check each component\n\nSelect **Test functions**. The checks load all four classes from their named\nproject files and do not move either robot. Read each class's `USE`,\n`INPUT`, and `EXPECT` lines before its result:\n\n- `PASS` means the implemented behavior matched the examples.\n- `NOT IMPLEMENTED` means the named method still needs to be written.\n- `FAIL` means the method ran but returned an incorrect value or behavior.\n\nThe new checks cover straight, curved, and in-place wheel relationships, plus\nodometry reset, translation, rotation, and curved travel. Fix every unfinished\nor failing result, repeat **Test functions**, and then set the matching\n`USE_STUDENT_*` flag to `True`.\n\n## Complete the challenge\n\n1. Run the supplied `DifferentialDrive` and `Odometry` on the virtual XRP and\n   identify the outward, turnaround, return, and final-alignment phases.\n2. Select the `DifferentialDrive` defined in `differential_drive.py`; compare\n   each body-motion request with its two wheel-speed targets.\n3. Select the `Odometry` defined in `odometry.py`; compare its pose with\n   virtual ground truth. The program uses odometry, not ground truth.\n4. Run the classes from all four component project files together and inspect\n   final pose, wheel increments, requested turn rate, and the reported return\n   position and heading errors.\n5. On the physical course, record the estimated final pose and wheel travel,\n   then measure final position and heading independently.\n",Ii="# Challenge 3: Waypoint Courier\n\n## The challenge\n\nVisit the waypoint markers in their assigned order and finish with the heading\nrequested by the final marker. Navigation receives the newest odometry `Pose`\nat each sample and returns one requested forward speed and turn rate.\n\n[`world.json`](world.json) defines the route. [`challenge.py`](challenge.py)\nloads `INITIAL_POSE` and the ordered `ROUTE`. Use these names rather than\ncopying the current coordinates, order, or headings into another file.\n\n## Reuse work in another challenge\n\nChoose **Reuse code in a new project…** in the IDE. Review **Preserve**,\n**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,\nand **Leave in the source project** (if shown) before creating the separate\nProject. The current Project remains unchanged.\n\n## What you implement\n\nImplement `NavigationController` in\n[`navigation_controller.py`](navigation_controller.py):\n\n- `start(goals)` stores a new ordered route; an empty route is complete.\n- `current_goal()` returns the active goal or `None` after completion.\n- `is_complete()` reports whether all required positions and headings are\n  complete.\n- `update(pose)` returns the next `MotionCommand` from the latest odometry pose.\n\nVisit goals in order. Turn toward a destination before driving, use the\nconfigured approach speed near it, return to turning when the heading error is\ntoo large, and align to a requested final heading. Return `STOP_COMMAND` after\nthe route is complete. Use `NAVIGATION_CONFIG` and the supplied\n`distance_to_goal()`, `bearing_to_goal()`, and `wrap_angle_rad()` functions.\n\nThe configuration separates the decisions: `position_tolerance_mm` sets the\naccepted distance from a goal, `heading_tolerance_rad` sets the allowable\nheading error before driving and at a required final heading,\n`realign_heading_rad` returns an excessive heading error to turning, and\n`slowdown_distance_mm` selects approach rather than cruise speed.\nKeep an active-goal index and a small explicit mode such as `turn`, `drive`, or\n`align`. Each mode describes motion toward the current goal.\n\n## Project modules\n\n| File | Role |\n| --- | --- |\n| [`sensor_model.py`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples. |\n| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |\n| [`differential_drive.py`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |\n| [`odometry.py`](odometry.py) | Updates the estimated `Pose` from measured wheel travel. |\n| [`navigation_controller.py`](navigation_controller.py) | Selects the next `MotionCommand` from the active route goal and pose. |\n| [`robot_config.py`](robot_config.py) | Stores robot calibration and `NAVIGATION_CONFIG`. |\n| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |\n\n**Test functions always loads the classes from the five component project\nfiles**, regardless of which classes are selected for a complete robot run.\n\n## Provided files and tools\n\n- [`main.py`](main.py) starts the route, passes each new pose to navigation,\n  records each assigned waypoint observed in order, and stops the robot on\n  completion or error.\n- [`component_checks.py`](component_checks.py) calls the required\n  `NavigationController` methods and the methods of the other selected classes\n  without starting a robot.\n- `Robot` executes each `MotionCommand` through the selected wheel, sensing,\n  and odometry components.\n\n## How the program runs\n\n```text\nROUTE + estimated Pose -> NavigationController -> MotionCommand\nMotionCommand          -> Robot                -> new estimated Pose\n```\n\nThe cycle repeats until navigation completes the final position and any\nrequested final heading.\n\n## Check the component\n\nSelect **Test functions**. Read `USE`, `INPUT`, and `EXPECT` before each\nresult. The navigation checks cover an empty route, goals ahead and to either\nside, ordered goals, approach speed, realignment, angle wrap, and a required\nfinal heading.\n\n- `PASS` means the implemented behavior matched the examples.\n- `NOT IMPLEMENTED` means the named method still needs to be written.\n- `FAIL` means the method ran but returned an incorrect command or route state.\n\nFix every unfinished or failing result, repeat **Test functions**, and then\nset `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` in `course_setup.py`.\n\n## Complete the challenge\n\n1. Run the supplied navigator on the virtual XRP. Identify each waypoint\n   approach, the reduced approach speed, and the final heading adjustment.\n2. Select the `NavigationController` defined in\n   `navigation_controller.py`. Verify waypoint order and zero requested motion\n   after completion. The final estimated pose must satisfy the assigned final\n   position and heading within navigation tolerances.\n3. Select the classes from all five component project files. Compare odometry\n   with virtual ground truth to separate pose-estimation error from navigation\n   behavior.\n4. Record estimated pose, requested forward speed, turn rate, and the driven\n   path. Use the assigned values in `ROUTE` for your analysis.\n5. On the physical course, record the same program evidence and measure the\n   final position and heading independently.\n",Li=`# Challenge 4: Mapped Route

## The challenge

Plan a route from the initial pose to the destination without entering known
obstacles, then follow it. Planning finishes before motion begins. When the
destination cannot be reached, report that result and keep the robot stopped.

The current task is defined in two files:

- [\`world.json\`](world.json) defines the arena, obstacles, initial pose, and
  destination.
- [\`challenge.py\`](challenge.py) loads \`ARENA_MAP\`, \`INITIAL_POSE\`, and
  \`DESTINATION\`, and defines \`GRID_RESOLUTION_MM\` and \`CLEARANCE_MM\`.

Use these names. Do not copy the current geometry or grid values into your
planner. \`CLEARANCE_MM\` is the required distance from a candidate cell center
to blocked geometry or the arena boundary; it is not the grid spacing. The
virtual value includes the 85 mm XRP collision radius and a 10 mm planning
margin. For a physical course, confirm the robot footprint and tracking margin
before motion rather than treating the virtual value as a calibration.

## Project worlds

Select each case from the Monitor **World** menu before a virtual run:

- \`mapped-route\`: start and destination are connected around the center block.
- \`destination-blocked\`: the destination cell is unavailable.
- \`no-connection\`: both endpoints are available, but a wall separates them.

The last two cases must end without robot motion.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement \`GridPlanner.plan(grid, start, goal)\` in
[\`grid_planner.py\`](grid_planner.py). Return:

- a \`GridPath\` that starts at \`start\`, ends at \`goal\`, contains only free cells,
  and moves between cells that share a horizontal or vertical side; or
- \`None\` when an endpoint is unavailable or blocked, or when no connected route
  exists.

If \`start\` and \`goal\` are the same free cell, return a one-cell path. Any route
that satisfies these conditions is accepted. The class does not need to retain
information between \`plan()\` calls.

## Project modules

| File | Role |
| --- | --- |
| [\`sensor_model.py\`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples. |
| [\`wheel_speed_controller.py\`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |
| [\`differential_drive.py\`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |
| [\`odometry.py\`](odometry.py) | Updates the estimated \`Pose\` from measured wheel travel. |
| [\`navigation_controller.py\`](navigation_controller.py) | Selects the next \`MotionCommand\` from the active route goal and pose. |
| [\`grid_planner.py\`](grid_planner.py) | Connects the requested start and goal through free grid cells. |
| [\`robot_config.py\`](robot_config.py) | Stores robot calibration and navigation settings. |
| [\`course_setup.py\`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |

**Test functions always loads the classes from the six component project
files**, regardless of which classes are selected for a complete robot run.

## Provided files and tools

- [\`main.py\`](main.py) constructs the grid, requests and validates a path,
  converts a successful path to navigation goals, and only then constructs the
  robot. The final navigation goal uses the exact assigned destination rather
  than merely its grid-cell center, and the estimated final pose is checked
  before completion is reported.
- [\`component_checks.py\`](component_checks.py) checks direct, detour, one-cell,
  invalid-endpoint, and disconnected cases without starting a robot.
- \`OccupancyGrid\` supplies coordinate conversion, blocked-cell tests, and the
  free cells sharing a side with a given cell.
- \`GridPath.to_goals()\` converts the cell path into the world-coordinate goals
  used by the selected \`NavigationController\`.

## How the program runs

\`\`\`text
ARENA_MAP -> OccupancyGrid -> GridPlanner -> GridPath
GridPath  -> navigation goals -> NavigationController -> Robot motion
\`\`\`

A \`None\` path stops after planning. A valid path is converted to navigation
goals at turns and at the destination.

## Check the component

Select **Test functions**. The checks call \`GridPlanner.plan()\` from
\`grid_planner.py\` with small software grids and do not move either robot. Read
\`USE\`, \`INPUT\`, and \`EXPECT\` before each result:

- \`PASS\` means the returned path met the stated requirements.
- \`NOT IMPLEMENTED\` means \`plan()\` still needs to be written.
- \`FAIL\` means the method ran but returned an invalid path or incorrect \`None\`.

Fix every unfinished or failing result, repeat **Test functions**, and then
set \`USE_STUDENT_GRID_PLANNER\` to \`True\` in \`course_setup.py\`.

## Complete the challenge

1. Run the supplied planner in each virtual world and compare the obstacle
   layout and reported result. In the reachable world, also compare the driven
   route and final pose.
2. Select the \`GridPlanner\` defined in \`grid_planner.py\`. For every returned
   path, verify free cells, side-sharing steps, and the requested endpoints.
   The program performs the same check before it permits motion.
3. Confirm separately that an unavailable endpoint and a disconnected map
   return \`None\` without motion.
4. Repeat the valid route with the classes from the other component project
   files selected; assess path validity separately from navigation and
   pose-estimation performance.
5. For the physical run, match the arena to \`world.json\`, start at the marked
   pose, and compare the planned route, estimated trajectory, and observed path.
`,Ri=`# Challenge 5: Delivery Mission

## The challenge

Begin at the observation pose, collect repeated forward-range readings, decide
whether the named map feature is blocked, and deliver by an available route.
The program reports \`"delivered"\` only after validating the planned path and
checking the estimated pose against the destination tolerances. It reports
\`"no_path"\`, \`"invalid_path"\`, or \`"destination_not_reached"\` otherwise.

[\`world.json\`](world.json) defines the virtual observation cases, common map,
start, destination, and changeable feature. [\`challenge.py\`](challenge.py)
constructs \`DELIVERY_TASK\`, which supplies the range-sample requirements,
decision threshold, missing-range behavior, grid settings, geometry, initial
pose, and destination. Use these names; do not repeat their current numerical
values or obstacle coordinates elsewhere.

The virtual gate opening is 300 mm wide. The task clearance includes the
simulator's 85 mm XRP collision radius and a 10 mm planning margin. Before a
physical run, measure the assembled robot footprint and verify that the course
gate and route provide at least the assigned clearance.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement \`SensorModel.estimate_range(samples, minimum_usable)\` in
[\`sensor_model.py\`](sensor_model.py). For the supplied sequence:

- ignore missing values, Booleans, and numeric values that are not finite and
  positive;
- return \`None\` when fewer than \`minimum_usable\` readings remain; and
- otherwise return the median usable distance in millimeters.

This method must not change the wheel-measurement state. \`None\` means that no
estimate was available; it does not represent zero distance.

## Project modules

| File | Role |
| --- | --- |
| [\`sensor_model.py\`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples; now also combines range readings. |
| [\`wheel_speed_controller.py\`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |
| [\`differential_drive.py\`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |
| [\`odometry.py\`](odometry.py) | Updates the estimated \`Pose\` from measured wheel travel. |
| [\`navigation_controller.py\`](navigation_controller.py) | Selects the next \`MotionCommand\` from the active route goal and pose. |
| [\`grid_planner.py\`](grid_planner.py) | Connects the requested start and goal through free grid cells. |
| [\`robot_config.py\`](robot_config.py) | Stores robot calibration and navigation settings. |
| [\`course_setup.py\`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |

**Test functions always loads the classes from the six component project
files**, regardless of which classes are selected for a complete robot run.

## Provided files and tools

- \`DeliveryMission\` keeps the robot stopped during observation, evaluates the
  named feature, builds the selected grid, validates the returned path,
  navigates to the named destination, checks the estimated terminal position
  and heading, retains its evidence, and requests motor stop in its \`finally\`
  cleanup after normal completion or a Python exception. The target runtime
  handles the IDE's **Stop** separately; forced termination can bypass Python cleanup.
- [\`main.py\`](main.py) constructs the mission services, runs the mission, and
  prints one result summary.
- [\`component_checks.py\`](component_checks.py) calls
  \`SensorModel.estimate_range()\` and the required methods of the other selected
  classes without starting a robot.
- \`ArenaMap\`, \`OccupancyGrid\`, and \`GridPath.to_goals()\` connect the observed
  map condition to planning and navigation.

## How the program runs

\`\`\`text
stationary range samples -> SensorModel.estimate_range()
                         -> open/blocked named feature
                         -> OccupancyGrid -> GridPlanner -> route or no_path
route                    -> NavigationController -> delivery motion
\`\`\`

The observed distance, not the virtual case label, determines the selected map
condition. Use the IDE's visible **Stop** control to interrupt a run that does
not converge.

## Check the component

Select **Test functions**. The checks do not start either robot. Read \`USE\`,
\`INPUT\`, and \`EXPECT\` before each result. Range checks include odd and even
medians, mixed unusable readings, too few usable readings, and invalid
\`minimum_usable\` input.

- \`PASS\` means the implemented behavior matched the examples.
- \`NOT IMPLEMENTED\` means the named method still needs to be written.
- \`FAIL\` means the method ran but returned an incorrect estimate or error.

Fix every unfinished or failing result, repeat **Test functions**, and then
select the \`SensorModel\` defined in \`sensor_model.py\` in \`course_setup.py\`.

## Complete the challenge

1. Run each virtual observation case with the supplied estimator. Record the
   stationary range readings, map decision, path-cell count, mission result,
   and estimated final pose.
2. Calculate the median of the usable readings and compare it with the reported
   estimate.
3. Select the \`SensorModel\` defined in \`sensor_model.py\` and repeat every
   case. Verify that range determines the map condition.
4. Select the classes from all six component project files to distinguish
   sensing, planning, navigation, odometry, and wheel-control results.
5. Before physical motion, inspect stationary range values and sensor
   direction. Then run the matched arena from its marked start and record the
   readings, observed route, result, and estimated final pose.
`,zi=`# Challenge 6: Range-Constrained Stopping

## The challenge

Approach the stationary wall and stop without crossing the marked exclusion
line. Use measured forward speed and filtered forward range to reduce the
requested speed as the available stopping distance decreases. Missing range
must produce a stopped command.

The ultrasonic measurement is the distance from the sensor origin to the
nearest reflecting surface along its forward cone. The virtual sensor origin
is 70 mm forward of the axle-center pose. \`STOP_MARGIN_MM\` and the assigned
220--380 mm success band are therefore sensor-to-wall clearances, not
axle-center distances. The one-dimensional stopping model assumes a stationary
wall, an approximately cardinal straight approach, and a conservative lower
bound on braking deceleration; measure those quantities again before physical
use.

[\`world.json\`](world.json) defines the initial pose, wall, and stop markings in
three virtual cases. [\`challenge.py\`](challenge.py) defines the nominal speed,
stopping model, range window, and success band. Use those names rather than
copying their current values.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement \`RangeSafetyController.update()\` in
[\`range_safety_controller.py\`](range_safety_controller.py). It receives:

- nominal requested forward speed in mm/s;
- measured forward speed in mm/s; and
- filtered forward range in mm, or \`None\`.

Return a nonnegative safe forward speed no greater than either the nominal
request or the configured speed limit. Return zero when no range estimate is
available or when the remaining range does not support continued motion.

One suitable stopping envelope is

\`margin + speed * response_time + speed**2 / (2 * minimum_deceleration)\`.

The required behavior, not this particular formula, defines the component.
\`RangeSafetyControllerBase\` validates and stores the four constructor settings
and states these requirements; your class implements only \`update()\`. Import
the base from \`ucsb_xrp.student_api\` as shown in the starter.

The supplied moving window contains three distinct ultrasound attempts, not
three control-loop iterations. Attempts are at least 70 ms apart; at a normal
20 ms control period, new readings usually arrive about every 80 ms. A missing
latest echo stops the approach immediately. Observations older than 0.25 s are
excluded; fewer than three usable current observations also require a stopped
command. The 0.4 s response allowance comprises that 0.25 s admitted age plus
0.15 s for control and command response. These are provisional teaching values,
not measured physical guarantees. A slower control period can leave too few
current observations, in which case the program stops; do not simply increase
the age limit without reconsidering the response allowance and stopping model.

## Provided files and tools

- [\`main.py\`](main.py) collects stationary range samples before motion, runs a
  sampled approach, applies the controller's output only when it satisfies the
  documented output requirements, sends stopped commands while the drivetrain
  settles, and calls \`robot.stop()\` in \`finally\` after normal completion or a
  Python exception. The target runtime handles the IDE's **Stop** separately;
  forced termination can bypass Python cleanup. It does not clamp the
  output, impose a second stopping envelope, or convert a controller stop into
  success. Program output distinguishes \`complete\`, \`early_stop\`,
  \`stopped_too_close\`, and \`range_unavailable\` from the final measured range.
  Final classification uses a fresh stationary collection after settling,
  rather than the distance window retained from the approach. Collection has
  a two-second elapsed limit; missing echoes count as completed attempts.
- [\`live_variables.py\`](live_variables.py) publishes the filtered range and
  requested speed in Monitor.
- \`Robot\`, the selected robot components, and \`SensorModel.estimate_range()\`
  provide measurement and motion services.
- [\`component_checks.py\`](component_checks.py) tests the same range at different
  measured speeds, several response times, decelerations and margins, command
  bounds, and missing range without moving either robot.
- [\`world.json\`](world.json) provides **Near wall**, **Far wall**, and
  **No usable range** cases. The near and far cases request 120 mm/s and
  100 mm/s respectively, so a fixed range threshold does not solve both.

## How the program runs

\`\`\`text
range samples -> range estimate
requested speed + measured speed + range estimate
              -> RangeSafetyController -> safe forward speed
              -> Robot -> new Measurements and Pose
\`\`\`

## Complete the challenge

1. Select **Test functions** and make every RangeSafetyController case pass.
2. Run the supplied controller in all three virtual worlds. The no-range case
   must remain stopped.
3. Select your controller and compare range, measured speed, safe speed, final
   range, and final pose. Success requires a final filtered range from 220 mm
   through 380 mm, inclusive.
4. Before physical motion, verify stationary range and motor direction. Keep
   **Stop** available and use the assigned speeds and course distances.
   Confirm the sensor origin, usable cone, wall face, stopping deceleration,
   and end-to-end response time; the virtual values are reference assumptions,
   not a physical calibration.
5. Report clearance and repeatability before elapsed time.
`,Bi=`# Challenge 7: Wall-Range Pose Correction

## The challenge

At the localization station, collect one stationary range estimate while
facing the known x wall and one while facing the known y wall. Use those two
scalar observations to correct x and y in the odometry pose, then navigate to
the destination. Heading remains the odometry heading.

Here a wall coordinate denotes its near planar face in the world frame. Range
starts at the forward ultrasonic sensor origin, modeled 70 mm ahead of the
axle-center pose. \`facing_positive_x\` and \`facing_positive_y\` identify which
wall normal was deliberately selected; the scalar range does not infer that
identity. Supplied mission code accepts a sample only when both absolute wheel
speeds are at most 5 mm/s and the odometry heading lies within 0.10 rad
(approximately 5.7 degrees) of the independently commanded cardinal heading.

The virtual task deliberately initializes odometry with a translated position
error while the robot begins at the marked physical pose. [\`world.json\`](world.json)
defines the walls, start, scan marker, and destination. [\`challenge.py\`](challenge.py)
defines the odometry initial pose, wall coordinates, sensor offset, scan
headings, wall sides, observation settings, and terminal tolerances.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement \`PoseCorrector\` in [\`pose_corrector.py\`](pose_corrector.py):

- \`reset(raw_pose)\` clears prior corrections;
- \`observe_x(...)\` uses a range to a known x-normal wall to correct x only;
- \`observe_y(...)\` uses a range to a known y-normal wall to correct y only; and
- \`corrected_pose(raw_pose)\` applies the retained translation while preserving
  the raw heading.

Wall identity, scan direction, and sensor offset are supplied. A wall-range
sample does not identify a landmark, estimate heading, or determine a complete
pose by itself.
\`PoseCorrectorBase\` validates the sensor offset and states the four required
methods; your class retains only the translation state. Import the base from
\`ucsb_xrp.student_api\` as shown in the starter.

## Provided files and tools

- [\`main.py\`](main.py) commands and verifies the known x and y cardinal
  headings, requires each wheel independently to settle, rejects observations
  outside the stated heading tolerance, applies the two corrections, navigates
  using corrected poses, verifies the corrected terminal position and raw
  odometry heading, and calls \`robot.stop()\` in \`finally\` after normal completion
  or a Python exception. The target runtime handles the IDE's **Stop** separately;
  forced termination can bypass Python cleanup.
- The robot components and \`NavigationController\` are selected independently
  in \`course_setup.py\`.
- [\`component_checks.py\`](component_checks.py) varies sensor offsets, wall
  coordinates and wall sides, exercises sequential x/y corrections and reset,
  verifies retained translation and heading, and rejects invalid range.
- [\`world.json\`](world.json) provides a complete localization station and a
  missing-y-reference failure case. The failure case stops before destination
  motion. Both cases retain the full course arena. Their explicit
  \`range_sensor.include_arena_boundary: false\` setting makes only the drawn
  known-wall obstacles ultrasonic references; the arena edge remains a
  collision boundary but cannot masquerade as the deliberately removed y wall.

## How the program runs

\`\`\`text
raw odometry Pose + known-wall range -> PoseCorrector -> corrected Pose
corrected Pose + destination         -> NavigationController -> Robot motion
\`\`\`

## Complete the challenge

1. Pass the PoseCorrector component checks without moving either robot.
2. Run the supplied corrector in **Localization station** and compare raw and
   corrected poses before navigation. Program output reports the corrected
   residual and both terminal poses.
3. Confirm that **Missing y reference** reports an unavailable observation and
   stops.
4. Select your corrector and repeat the complete virtual route.
5. For an odometry-only comparison, temporarily change the
   \`navigation.update(corrected)\` call in \`main.py\` to
   \`navigation.update(state.pose)\`. Repeat the virtual case, compare terminal
   residuals, then restore \`navigation.update(corrected)\` before further runs.
6. Before a physical run, measure the ultrasonic origin and wall coordinates,
   verify both stationary ranges and cardinal alignments, and keep **Stop**
   available. The virtual wall faces and sensor offset are reference
   assumptions, not a physical calibration.
`,Vi=`# Challenge 8: Multi-Stop Route Planning

## The challenge

Start at the depot, visit three named service stops exactly once, and return to
the depot. Use map-derived directed grid-route costs to choose the visit order
before motion begins. Crossing a stop's grid cell incidentally is not service;
the estimated pose must reach the named endpoint within navigation tolerances
before that stop is recorded.

[\`world.json\`](world.json) defines the depot, stops, obstacles, and a
disconnected case. [\`challenge.py\`](challenge.py) loads those goals and defines
their indices, grid resolution, and clearance.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement \`VisitOrderPlanner.plan()\` in
[\`visit_order_planner.py\`](visit_order_planner.py). Inputs are:

- a square pairwise route-cost table; \`None\` means that pair is disconnected;
- a start index;
- the distinct required-stop indices; and
- a finish index, which may equal the start index.

Return the least-cost tuple containing start, every required stop exactly once,
and finish, or \`None\` when no complete order is reachable. Costs are directed:
the cost from A to B need not equal the cost from B to A. Use deterministic
lexicographic tie-breaking. The challenge contains three required stops, so a
clear exhaustive search is sufficient and makes correctness inspectable.
\`VisitOrderPlannerBase\` is imported from \`ucsb_xrp.student_api\`; it defines the
method boundary without supplying the planning algorithm.

## Provided files and tools

- [\`main.py\`](main.py) uses the supplied \`GridPlanner\` to build deterministic
  pairwise shortest paths, so this challenge assesses \`VisitOrderPlanner\`
  independently of the selected project \`GridPlanner\`. It follows each selected
  path, replaces the final cell-center goal with the exact named endpoint, and
  checks the estimated pose before recording service.
- \`OccupancyGrid\`, the supplied \`GridPlanner\`, \`GridPath\`, and the selected
  navigation and robot components provide path and motion services.
- [\`component_checks.py\`](component_checks.py) varies node indices and finish
  nodes, uses asymmetric costs and missing directed paths, tests multiple equal
  optima, and rejects invalid duplicate stops without moving either robot.
- [\`world.json\`](world.json) provides **All stops reachable** and
  **Stop C disconnected**. The disconnected case must report no complete route
  without robot motion.

## How the program runs

\`\`\`text
world map -> pairwise GridPaths -> route-cost table
route-cost table -> VisitOrderPlanner -> stop order
selected paths -> NavigationController -> verified endpoint arrivals
\`\`\`

## Complete the challenge

1. Pass the VisitOrderPlanner component checks.
2. Run the supplied planner in both virtual worlds and confirm that the
   disconnected case never constructs or moves a robot.
3. In the reachable world, compare every candidate order's directed planned
   cost with the selected order and explain the deterministic tie rule.
4. Select your planner and execute the complete route with supplied supporting
   components before substituting other project implementations.
5. Confirm the recorded service sequence contains each required stop exactly
   once and that every record follows an estimated-pose endpoint arrival.
6. Report service-stop completion and planned route cost; use elapsed time as
   a secondary comparison.
`,Hi=`# Experimental Challenge 9 · Arena Circuit

This is a standalone experimental challenge. It assumes familiarity with the
sampled \`Robot\` loop, \`MotionCommand\`, and the supplied wheel/drive components.
It introduces local reflectance feedback and does not depend on the optional
range, mapping, localization-correction, or multi-stop extensions.

## The challenge

Use the left and right reflectance sensors to follow the dark closed circuit for
one continuous lap. Keep the line under the robot; lap time is secondary.

\`LineFollower.update(reflectance, dt_s)\` must return a \`MotionCommand\`. The
readings are normalized: 0 is a light floor and 1 is a dark line. A positive
left-minus-right error should turn the robot left. Begin with proportional
control, then use evidence from the plotted error to decide whether derivative
or integral action helps.

\`main.py\` only assembles the components, recognizes the visible finish bar, and
runs the sampled loop. It contains no stored trajectory or mission step limit.
\`LapProgress\` accepts a finish crossing only after four ordered checkpoints
from the estimated odometry pose. Reflectance readings steer the robot and
detect the finish bar; they do not by themselves establish a completed lap.
If neither sensor reaches the line-visible threshold, \`main.py\` requests zero
motion while it waits for the line to reappear.

## What you implement

Implement the challenge-local \`LineFollower.update\` method. Keep it reactive:
each command uses only the current reflectance pair, the sample interval, and
the controller state needed for P, PD, or PID feedback.

## Provided files and tools

- \`line_follower.py\` contains the only component to implement.
- \`robot_config.py\` holds readable gains, speed, and finish thresholds.
- \`component_checks.py\` checks centered, line-left, and line-right responses
  without starting either robot.
- \`live_variables.py\` publishes reflectance, error, checkpoints, and phase in Monitor.
- \`world.json\` contains the closed virtual track and transverse finish bar.

## How the program runs

\`\`\`text
left/right reflectance -> LineFollower -> MotionCommand -> Robot
estimated Pose -> LapProgress ordered checkpoints
finish-bar reflectance + checkpoints -> completed lap
\`\`\`

Missing reflectance reports \`reflectance_unavailable\`. Loss of both line
signals requests zero motion immediately and reports \`line_lost\` after 0.4 s.
The run has a 100 s limit. The \`component_checks.py\` examples load
\`LineFollower\` from \`line_follower.py\` independently of its Run selector and
check steering signs, command limits, and reset behavior.

## Complete the challenge

1. Run **Test functions**. An unfinished \`LineFollower\` reports \`NOT IMPLEMENTED\`.
2. Implement \`LineFollower.update\` in \`line_follower.py\`.
3. Set \`USE_STUDENT_LINE_FOLLOWER = True\` in \`course_setup.py\` and rerun the check.
4. Run virtually and compare left/right reflectance and line error in Monitor.
5. Complete one continuous lap without losing the line. Use lap time only as a
   secondary comparison after reliable retention.

## Virtual and physical setup

\`world.json\` defines an 18 mm dark centerline and a 50 mm transverse finish
bar, entirely within the standard 3048 mm by 1219.2 mm arena. The simulated
sensors are provisionally 55 mm forward and 12 mm left/right of robot center.

A physical run assumes two downward-facing reflectance sensors mounted ahead of
the axle and a continuous dark tape circuit on a light matte floor. Measure the
light and dark responses, sensor spacing and height, then adjust the thresholds
and controller gains in \`robot_config.py\`. The virtual geometry is a useful
starting point, not evidence of physical calibration.

Success is one confirmed return across the finish bar without losing the line.
Immediate back-and-forth crossings do not count as a circuit. Physical lap
judging independently verifies the route because estimated pose is not ground
truth. Change the checkpoints in \`lap_progress.py\` when changing circuit
geometry in \`world.json\`. Reposition only after **Stop**.
`,Ui=`# Challenge 1 · Robot Curling

## Task

Drive 1000 mm along the lane and stop the front center of the robot as close
to the target as possible, in the least time. Align that same point with the
start mark. Develop wheel measurements, wheel-speed feedback, and a
stopping rule based on measured distance. Complete the measurements and
method checks before target trials. The supplied \`main.py\` runs the trial; it
does not choose when to slow or stop.

## 1. Measure the wheels

1. **Measure motor response.** Determine how each wheel’s speed depends on
   motor command. Open the **Motor Characterization**
   demonstration. Use the Virtual XRP to inspect it if useful, then measure
   the physical robot. Record motor command, steady left and right wheel
   speed, battery condition, and whether the wheels were raised or on the
   floor.
2. **Calibrate each wheel.** Obtain a starting estimate of the command needed
   for a requested wheel speed. Plot steady speed against command for each wheel.
   Estimate the command needed to start motion and the additional command per
   mm/s. Enter the separate left/right start commands and speed gains in
   \`robot_config.py\`; its initial numbers are example virtual settings.
3. **Implement wheel measurements.** Convert encoder readings into distances
   and speeds for feedback and odometry. In \`sensor_model.py\`, implement
   \`SensorModel.reset(raw)\` and \`SensorModel.update(raw)\`. Use encoder counts,
   configured signs, wheel diameter, counts per revolution, and timestamps
   to return a \`Measurements\` record with wheel positions and latest increments
   in mm, speed estimates in
   mm/s, and \`dt_s\` in seconds. Reset establishes zero travel and speed.
   Keep increments unsmoothed, estimate speed from recent samples, and
   preserve the raw range, button, and reflectance fields. \`estimate_range\`
   is for a later challenge.
4. **Check encoder outputs.** Select **Test functions** to run defined
   input/output examples for each component method. Compare calculated travel
   with a measured wheel rotation and compare single-sample and averaged
   speed estimates. Check forward and reverse counts. Set
   \`USE_STUDENT_SENSOR_MODEL = True\` in \`course_setup.py\` to use this class
   during a run.

## 2. Control wheel speed

1. **Implement motor feedback.** Correct differences between requested and
   measured wheel speeds. In \`wheel_speed_controller.py\`, implement
   \`WheelSpeedController.update(target, measured)\`. For each wheel, use its
   requested and measured speed to return a normalized \`DriveCommand\`. Use
   the motor calibration in \`robot_config.py\`, return zero command for a zero
   target, and respect \`max_drive_command\`. If your controller retains history,
   clear it in \`reset()\`.
2. **Check command outputs.** Use the corresponding **Test functions** examples
   for positive, negative, and zero speed requests. Check that increasing
   speed error changes the command as intended without exceeding the limit.
   Set \`USE_STUDENT_WHEEL_SPEED_CONTROLLER = True\` in \`course_setup.py\` to
   use this class during a run.

## 3. Develop and test the stopping rule

1. **Implement the stopping rule.** Choose the speed needed to approach the
   target and stop. In \`stopping_controller.py\`, implement
   \`speed_for_distance(remaining_mm)\`. The input is target distance minus
   measured mean wheel travel, in mm. Return a finite, nonnegative next
   forward-speed request in mm/s; zero makes the final stop request. Decide
   how speed depends on remaining distance and when to request zero.
2. **Connect the live controls.** Make the speed and slowing distance adjustable
   while observing the run. The Monitor **Cruise speed** control sets
   \`CRUISE_SPEED_MM_S.value\` in \`live_variables.py\`, in mm/s. Use it in your
   function as the chosen upper travel speed. **Slowing distance** sets
   \`SLOWDOWN_DISTANCE_MM.value\`, in mm; use it to define where your rule
   changes its speed request. Both values are read when the function is
   called, so a slider change affects the next decision. Their starting
   values are adjustable defaults, not measured stopping distances.
3. **Compare feedback settings.** Assess how feedback changes speed error and
   oscillation. With the same calibration and stopping
   rule, compare requested and measured wheel speeds in repeated runs of
   \`main.py\`.
   Change \`wheel_speed_kp\` in \`robot_config.py\` to compare feedback settings;
   zero removes its proportional correction. Record speed error, oscillation,
   and sustained command limiting to justify the value you use.
4. **Inspect the approach.** During these preparation runs, inspect plotted
   remaining distance and requested speed as the robot approaches the target.
   The Virtual XRP can help you revise the rule before floor runs. Change one
   setting at a time. Check where the rule requests slowing and zero, and
   whether wheel speed continues after the zero request.

## 4. Run the challenge

1. **Compare floor runs.** Run the selected rule on the floor. Keep starting
   position and alignment consistent, change one setting at a time, and
   retain runs that stop short, overshoot, or fail to move.
2. **Measure the outcome.** For each run, record settings, stopping reason,
   estimated motion time, signed encoder \`remaining_mm\`, front-center
   distance from the target (short or beyond), and final heading. Compare
   repeated results before choosing a change intended to improve accuracy
   and time.

## Your report

Submit one report per pair with both names and the robot used. Distinguish
virtual from physical results.

1. **Preliminary lab work:** show encoder conversion and motor calibration
   measurements, the implemented feedback and stopping decisions, and the
   evidence used to choose calibration and settings.
2. **Challenge data:** provide labeled speed and remaining-distance plots and
   a table of settings, stopping reason, motion time, signed floor error, and
   final heading for the runs compared.
3. **Challenge performance:** identify the run that best balances target
   accuracy, time, and repeatability, using measured values.
4. **Reflection:** explain differences between encoder remaining distance and
   floor position, and how speed estimation, wheel-speed feedback, or the
   stopping rule affected the outcome. Justify a specific improvement from
   your data.

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
\`main.py\` is supplied and normally unchanged; a controlled experiment may
still edit it. **Test functions** checks the project files regardless of the
\`USE_STUDENT_*\` flags. **Run** uses the classes selected in \`course_setup.py\`;
\`speed_for_distance\` is called directly and has no selector.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs the straight trial using your stopping rule and records the result. |
| <strong class="student-file"><code>sensor_model.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains later range estimation. |
| <strong class="student-file"><code>wheel_speed_controller.py</code> *</strong> | Calculates left and right motor commands from target and measured wheel speeds. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping rule. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Cruise speed and Slowing distance controls and their starting values. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and controller settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Reads the start and target from \`world.json\` and calculates travel distance. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations and creates the robot. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and markers. |

</div>

## Parameters and functions

Keep the method names and arguments in the templates. The API Reference gives
the full field definitions; the Guide explains project-file selection.

![SensorModel template open in the IDE.](course-assets/method-template.jpg)

*Figure. \`sensor_model.py\` is selected in the IDE Project file list, with its
class and unfinished method bodies open in the editor.*

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| Cruise speed | Monitor control declared in \`live_variables.py\`; mm/s | Chosen upper travel speed available to \`speed_for_distance\`. |
| Slowing distance | Monitor control declared in \`live_variables.py\`; mm | Chosen distance at which the stopping rule can begin reducing speed. |
| \`wheel_speed_kp\` | \`robot_config.py\`; s/mm | Proportional motor-command change per mm/s of wheel-speed error; zero removes that correction. |
| Left/right start commands and speed gains | \`robot_config.py\`; dimensionless and s/mm | Map each requested wheel speed to its calibrated motor command. |
| \`max_drive_command\` | \`robot_config.py\`; dimensionless | Limits the absolute command sent to either wheel. |

Live controls show their applied values. Keep a setting fixed during a
recorded comparison; \`speed_for_distance\` reads the controls through \`.value\`.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| \`SensorModel.reset(raw)\` | First \`RawSensors\` sample: encoder counts and ms | \`Measurements\` with zero travel, speed, and interval. |
| \`SensorModel.update(raw)\` | Next chronological \`RawSensors\` sample | \`Measurements\` with wheel position/increment in mm, speed in mm/s, and interval in s. |
| \`WheelSpeedController.reset()\` | None | Clears retained feedback state. |
| \`WheelSpeedController.update(target, measured)\` | Two \`WheelSpeeds\` values in mm/s | Bounded normalized left/right \`DriveCommand\`. |
| \`speed_for_distance(remaining_mm)\` | Measured remaining distance in mm | Forward speed in mm/s; zero requests the final stop. |
`,Wi=`# Challenge 2 · Arena Line Circuit

## Task

Follow the dark tape line for one counterclockwise lap, pass four checkpoints
in order, and stop at the start/finish bar. Use the two floor sensors for local
steering and the wheel measurements and speed control developed in Robot
Curling. Complete the sensor measurements and method checks before lap trials.
\`main.py\` manages the lap and stops after completion or persistent line loss;
your controller chooses the motion on each sensor sample.

![Tape circuit with start and finish bar, four checkpoints, and travel direction.](course-assets/arena-line-circuit.svg)

*Figure. Circuit 1 in the 3048 × 1219.2 mm arena. The dark loop is the floor
track and the wide crossbar is the start/finish bar. The blue region and dot
mark the start and axle pose; numbered dots mark the ordered checkpoint
regions; arrows show counterclockwise travel. Monitor's World menu offers
seven other circuits, also defined in \`world.json\`.*

## 1. Measure the floor sensors

1. **Measure reflectance.** Establish how the two sensors distinguish the floor,
   line, and finish bar. In the file list, open **Actions for
   reflectance_readout.py → Make main**, then **Compile** and **Run** with the
   robot stationary at its normal sensor height. Selecting a file in the
   editor alone does not change what Run executes. The readout prints ten left/right reading
   pairs. Place the sensors over bare floor, centered on the narrow tape,
   displaced to either side, and over the wide finish bar. Repeat placements
   and record the range of both readings. Values near 0 indicate a light
   surface; values near 1 indicate a dark surface.
2. **Set detection thresholds.** Use the paired readings to choose
   \`LINE_VISIBLE_THRESHOLD\` and \`FINISH_THRESHOLD\` in \`robot_config.py\`.
   The first is compared with the darker of the two sensors; the second is
   compared with the lighter sensor when recognizing the wide bar. Check
   whether the observed line, lost-line,
   and finish-bar cases separate under those comparisons. If they overlap,
   inspect sensor height, tape width, and lighting before choosing thresholds.
   The supplied values are starting defaults for a particular setup.

## 2. Convert motion requests to wheel speeds

1. **Implement wheel-speed conversion.** Calculate wheel-speed targets for a
   requested forward speed and turn rate. In \`differential_drive.py\`, implement
   \`DifferentialDrive.wheel_speeds(command)\`. Read axle-center forward speed
   in mm/s, counterclockwise turn rate in rad/s, and
   \`self.config.track_width_mm\`; return left/right \`WheelSpeeds\` in mm/s.
   Measure the center-to-center spacing of the driven wheels at the floor
   as an initial \`track_width_mm\` estimate in \`robot_config.py\`.
   Account for straight motion, rotation in place, and simultaneous forward
   motion and turning. A positive turn rate requires the right target speed
   to exceed the left.
2. **Check motion cases.** Use **Test functions** to run defined input/output
   examples for straight, in-place, and combined motion. Set
   \`USE_STUDENT_DIFFERENTIAL_DRIVE = True\` in \`course_setup.py\` to use your
   class during a run.
3. **Reuse wheel control.** Copy the completed \`sensor_model.py\` and
   \`wheel_speed_controller.py\` from Robot Curling into the files of the same
   names in this project. Copy your measured calibration values into
   \`robot_config.py\`, keeping the line-following settings. Select the two
   classes with their matching flags in \`course_setup.py\`.
   \`component_checks.py\` also checks that \`SensorModel\` preserves floor readings
   in \`Measurements\`.

## 3. Build local line following

1. **Implement line following.** Use differences in the floor readings to
   correct the robot’s displacement from the line. In \`line_follower.py\`, implement
   \`LineFollower.update(reflectance, dt_s)\`. Read normalized
   \`reflectance.left\` and \`.right\` and interval \`dt_s\`; return a
   \`MotionCommand\` with forward speed in mm/s and turn rate in rad/s. Record
   left minus right as \`self.line_error\`. A darker left reading needs a positive
   turn request; a darker right reading needs a negative one.
2. **Apply follower settings.** Use \`self.settings\` for your chosen feedback
   law. While following, keep speed between \`minimum_speed_mm_s\` and
   \`cruise_speed_mm_s\`; bound turn rate by \`maximum_turn_rate_rad_s\`. The
   inherited \`reset()\` clears feedback history before a run.
3. **Connect the live controls.** Adjust travel speed and steering response
   without rewriting the controller. The Monitor **Cruise speed** control is a
   forward-speed setting in mm/s. **P gain** is \`kp_rad_s\`, the proportional
   coefficient that converts dimensionless left-minus-right sensor error
   into a turn-rate contribution
   in rad/s. \`live_variables.py\` declares both controls;
   \`apply_line_controls()\` in \`robot_config.py\` copies their current values
   into \`follower.settings\` before each sensor update. Make your controller
   use those entries so changes affect the next motion request. The supplied
   settings also contain a derivative term; P gain changes only the
   proportional term. Choose whether additional terms or turn-dependent speed
   reduction improve tracking. The initial values are adjustable defaults.
4. **Check steering responses.** Use the corresponding **Test functions**
   examples to check centered, left-dark, and right-dark readings, output
   bounds, and reset behavior. Then select
   \`USE_STUDENT_LINE_FOLLOWER = True\` in \`course_setup.py\`. Restore **Actions for
   main.py → Make main**, then **Compile** and **Run**. Inspect sensor readings, \`line_error\`,
   and requested turn rate through a straight segment and a bend, using the
   Virtual XRP if useful. Revise the controller if it oscillates, cuts a bend,
   or loses the line.

## 4. Run the challenge

1. **Compare lap settings.** Determine how speed and steering gain affect lap
   completion and time. Start consistently in the marked start region.
   Compare settings by changing one of Cruise speed or P gain at a time.
   Record incomplete runs as well as full laps. Observe where the robot
   crosses each physical checkpoint and whether it stops at the bar or after
   losing the line.
2. **Record lap outcomes.** Record each run's settings, elapsed time, stopping
   reason, and reported checkpoint count. The count comes from estimated
   position entering ordered regions, while the finish bar is detected by
   both floor sensors. Compare the reported count with observations on the
   floor; a count mismatch
   and a tracking failure need different explanations.

## Your report

Submit one report per pair with both names and the robot used. Distinguish
virtual from physical results.

1. **Preliminary lab work:** tabulate paired floor readings at each placement,
   justify the detection thresholds, give the wheel-speed conversion and the
   implemented line-following rule, and show the checks used to select them.
2. **Challenge data:** include labeled sensor and requested-turn plots through
   a bend and a table of settings, completion or stopping reason, observed and
   reported checkpoints, and elapsed time for the compared laps.
3. **Challenge performance:** compare reliable completion and speed across
   the recorded trials; if no lap completed, identify where runs ended.
4. **Reflection:** explain any line loss, overshoot, or checkpoint-count
   mismatch from the measurements, and justify one specific improvement.

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
\`main.py\` is supplied and normally unchanged; a controlled experiment may
still edit it. **Test functions** checks project files regardless of the
\`USE_STUDENT_*\` flags. **Run** uses the classes selected in \`course_setup.py\`;
turn on and check each new class separately.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs line following and stops at lap completion or persistent line loss. |
| <strong class="student-file"><code>differential_drive.py</code> *</strong> | Converts forward speed and turn rate into left/right wheel-speed targets. |
| <strong class="student-file"><code>line_follower.py</code> *</strong> | Uses paired floor readings to request forward speed and turn rate. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Completed wheel measurement component; preserves floor readings. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Completed wheel-speed feedback component. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration, line thresholds, follower settings, and live control application. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads course geometry and holds checkpoint and line-loss settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations and creates the robot and follower. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <span class="supplied-file"><code>lap_progress.py</code> S</span> | Counts ordered checkpoints from estimated position and confirms the finish bar. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares controls and publishes sensor, steering, and lap values. |
| <span class="supplied-file"><code>reflectance_readout.py</code> S</span> | Prints ten stationary left/right floor-sensor pairs. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and markers. |

</div>

## Parameters and functions

Keep the method names and arguments in the templates. The API Reference gives
full field definitions; the Guide explains project-file selection.

### Parameters

| Setting | Location and units | Use |
| --- | --- | --- |
| Cruise speed | \`live_variables.py\`; mm/s | Copied to \`follower.settings["cruise_speed_mm_s"]\` each sample. |
| P gain | \`live_variables.py\`; rad/s per unit reflectance difference | Copied to \`follower.settings["kp_rad_s"]\` each sample. |
| \`maximum_turn_rate_rad_s\` | \`robot_config.py\`; rad/s | Limits requested turning. |
| \`LINE_VISIBLE_THRESHOLD\` | \`robot_config.py\`; normalized reflectance | Minimum reading at either sensor for visible line. |
| \`FINISH_THRESHOLD\` | \`robot_config.py\`; normalized reflectance | Minimum reading at both sensors for the wide bar. |
| \`CHECKPOINT_TOLERANCE_MM\` | \`challenge.py\`; mm | Radius of each ordered estimated-position region. |
| \`MAXIMUM_LOST_LINE_S\` | \`challenge.py\`; s | Stops a run after persistent line loss; the robot requests zero motion during that interval. |

Live controls show their applied values. Keep a setting fixed during a
recorded comparison; \`apply_line_controls()\` copies slider values to the
follower settings at each sample boundary.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| \`DifferentialDrive.wheel_speeds(command)\` | \`MotionCommand\` in mm/s and rad/s | Left/right \`WheelSpeeds\` in mm/s. |
| \`LineFollower.update(reflectance, dt_s)\` | Paired \`ReflectanceReadings\`, interval in s | \`MotionCommand\` in mm/s and rad/s. |
| \`LineFollower.reset()\` | None | Clears retained error state; inherited from \`LineFollowerBase\`. |
| \`LapProgress.observe_line(readings, dt_s, threshold)\` | Paired readings, interval, threshold | Visibility Boolean; updates retained line-loss duration. |
| \`LapProgress.update(pose, on_finish, confirm_samples)\` | Estimated \`Pose\`, finish detection, sample count | \`True\` after four ordered checkpoints and confirmed finish-bar return. |
`,Gi='# Challenge 3 · Waypoint Courier\n\n## Task\n\nVisit the three destinations in order and finish facing the indicated direction. Use measured wheel travel to estimate the robot\'s axle-midpoint position and heading, then navigate from that estimate. Compare the reported final pose with an independent floor measurement.\n\n![Starting pose, three destinations in visit order, and final heading.](course-assets/waypoint-courier.svg)\n\n*Figure. The blue S dot and arrow indicate the starting axle pose and +x heading. Numbered orange dots show the three destinations in visit order; the left-pointing arrow at goal 3 shows its required final heading. No measured or planned trajectory is drawn. Coordinates come from `world.json` in millimeters.*\n\n## 1. Implement and measure odometry\n\n1. **Initialize pose.** Establish the estimate at a known starting pose. In `odometry.py`, implement `Odometry.reset(initial_pose)` to store and return that `Pose`. Make the `pose` property return the latest estimate. Position is the drive-axle midpoint in world millimeters; heading is positive counterclockwise from +x, in radians.\n2. **Integrate wheel travel.** Convert each measured wheel increment into a change in pose. Implement `Odometry.update(left_increment_mm, right_increment_mm)` using signed travel since the previous sample and `self.config.track_width_mm`. Return and retain the new `Pose`. Unequal travel follows the wheel paths\' exact constant-curvature arc; wrap heading to `[-π, π)`.\n3. **Check known motions.** Run **Test functions** (`component_checks.py`) without driving. For its straight, in-place turn, and arc inputs, record the wheel increments, predicted change in pose, and returned `Pose`. Compare the direction, units, and heading wrap. A square is an optional additional accumulation check; the route run below supplies the independent floor-pose comparison.\n\n## 2. Implement and test ordered navigation\n\n1. **Track goals.** Retain which destination is active across samples. In `navigation_controller.py`, implement `NavigationController.start(goals)` to save the ordered sequence and reset progress. Make `current_goal()` report the active goal or `None`, and `is_complete()` report whether every required position and heading has been reached. An empty route is complete immediately.\n2. **Choose motion.** Turn pose error into the next motion request. Implement `update(pose)` to return a `MotionCommand` from the estimated `Pose`. Decide how to turn toward, approach, and accept each goal. `heading_rad=None` requires position only; the last goal also requires heading. Use `NavigationConfig` tolerances and motion settings. Return `STOP_COMMAND` after completion.\n3. **Check and select.** Use **Test functions** to examine distant, near, and wrong-final-heading poses. In `course_setup.py`, set `USE_STUDENT_ODOMETRY` and `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` after their checks pass. Reuse your completed sensing, wheel-speed control, and differential-drive files from Arena Line Circuit, along with the measured robot settings. Set their matching flags to `True`; `False` selects the supplied versions.\n\n## 3. Run and measure the courier route\n\n1. **Set motion controls.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changed values to the active controller after the next robot sample; approach speed follows cruise speed at 80%. Slider endpoints are configured control limits, not activity targets. Record values used; adjust other navigation settings in `robot_config.py` when measurements support a change.\n2. **Check the virtual route.** Inspect the start and ordered goals in `world.json`; `challenge.py` loads them as `INITIAL_POSE` and `ROUTE`. Run `main.py` on the Virtual XRP. Use the route trace, estimated heading, `goals_reached`, and Program output to locate overshoot, missed goals, or repeated turns. Revise the controller and repeat as needed before physical trials.\n3. **Measure the physical result.** Run from the marked starting axle pose. Record visit order, missed destinations or contact, and final orientation. Measure final axle-midpoint position and heading on the floor, including reading precision, and compare them with `final_pose` in Program output. If using a front-center mark, measure its axle offset and account for heading. Repeat as needed to assess consistency.\n\n## Your report\n\nSubmit one report per pair with both names, robot identification, selected components, world, and trial settings. Label virtual results separately from physical measurements.\n\n1. **Preliminary lab work:** give the odometry model, straight/turn/arc input-output checks, navigation checks, and reasoning behind calibration and controller choices. Include a square check if performed.\n2. **Challenge data:** show the route trace and estimated heading, and tabulate requested, estimated, and measured final position and heading for physical runs. Include visit order and relevant settings.\n3. **Challenge performance:** state which goals and final-heading requirement were reached, and quantify final position and heading errors using the axle midpoint.\n4. **Reflection:** use the preliminary and route data to distinguish pose-estimation error from controller behavior. Identify one supported improvement and the measurement that would test it.\n\n## Project files\n\n<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class="project-file-table">\n\n| File | What it does |\n| --- | --- |\n| <span class="supplied-file"><code>main.py</code> S</span> | Runs navigation and reports independently counted arrivals and final pose. |\n| <span class="supplied-file"><code>route_progress.py</code> S</span> | Checks estimated-pose arrival at ordered goals using current tolerances. |\n| <strong class="student-file"><code>odometry.py</code> *</strong> | Accumulates wheel increments to estimate position and heading. |\n| <strong class="student-file"><code>navigation_controller.py</code> *</strong> | Uses estimated pose to reach ordered destinations. |\n| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |\n| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |\n| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |\n| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the start pose and ordered goals. |\n| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |\n| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and publishes progress and estimated heading. |\n| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, and markers shared by the robot and Monitor. |\n\n</div>\n\n## Parameters and functions\n\nThese are the settings and interfaces used above; see the API reference for full type and error behavior.\n\n### Parameters\n\n| Setting | Source and units | Effect |\n| --- | --- | --- |\n| `track_width_mm` | `robot_config.py`; mm | Effective wheel spacing used to convert unequal wheel travel into heading change. |\n| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Live forward and turning requests, applied by `robot_config.py` after the next sample. |\n| `approach_speed_mm_s`, `slowdown_distance_mm` | `robot_config.py`; mm/s, mm | Near-goal speed and distance at which slowing starts; this starter sets approach speed to 80% of cruise speed. |\n| `position_tolerance_mm`, `heading_tolerance_rad` | `robot_config.py`; mm, rad | Estimated position and heading errors accepted at a goal. |\n| `realign_heading_rad` | `robot_config.py`; rad | Heading error above which forward travel pauses for turning. |\n\n### Functions and methods\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `Odometry.reset(initial_pose)` | Known `Pose` in mm and rad | Stores and returns starting `Pose`. |\n| `Odometry.update(left_increment_mm, right_increment_mm)` | Signed wheel increments in mm | Updated estimated `Pose`. |\n| `Odometry.pose` | Property read after reset | Latest estimated `Pose`. |\n| `NavigationController.start(goals)` | Ordered `NavigationGoal` values | Starts at first goal; an empty route is complete. |\n| `NavigationController.set_config(config)` | Complete `NavigationConfig` | Inherited method changes settings without restarting the route. |\n| `NavigationController.update(pose)` | Estimated `Pose` | Next `MotionCommand` in mm/s and rad/s. |\n| `NavigationController.current_goal()` | None | Active goal or `None`. |\n| `NavigationController.is_complete()` | None | Boolean route-completion status. |\n| `count_reached_goals(pose, route, reached_count, config)` | Estimated pose, ordered goals, previous count, current settings | Updated independently observed arrival count. |\n',Ki='# Challenge 4 · Mapped Route\n\n## Task\n\nPlan a connected route around known obstacles, then have the Virtual XRP follow it. Account for the robot\'s footprint and path-following error when assessing clearance.\n\n![Start, destination, and central obstacle in the reachable map.](course-assets/mapped-route.svg)\n\n*Figure. The blue S dot and arrow show the starting axle pose and heading; the orange G dot marks the destination. The dark filled rectangle is the known central obstacle at its map dimensions. No grid cells or computed route are shown; `world.json` supplies the geometry in millimeters.*\n\n## 1. Inspect the map and predict outcomes\n\n1. **Predict each world.** Inspect **Mapped route**, **Destination blocked**, and **No connecting route** in `world.json`. Mark start, destination, obstacles, and boundary; predict whether a free-cell route exists in each.\n2. **Inspect grid settings.** Determine which locations the robot can plan through. In `challenge.py`, `GRID_RESOLUTION_MM` sets cell width and `CLEARANCE_MM` expands obstacles and boundaries for robot size and tracking margin. `main.py` passes them and `ARENA_MAP` to supplied `OccupancyGrid.from_arena()`. The 100 mm/cell and 150 mm starting values are adjustable settings. Predict how a change could alter free cells.\n3. **Read the grid.** With `EXECUTE_ROUTE = False` in `challenge.py`, run `main.py`. Compare the Program-output grid with the Monitor world. Explain a location that appears clear geometrically but is blocked after sampling and clearance.\n\n## 2. Implement and check grid search\n\n1. **Implement search.** Find a connected sequence of free cells. In `grid_planner.py`, implement `GridPlanner.plan(grid, start, goal)`. Return a `GridPath` that includes both free endpoints and crosses one horizontal or vertical cell edge per step. Return `None` for a `None` or blocked endpoint or no connecting route. Choose and explain your search and path-recovery method; shortest path is not required.\n2. **Check cases.** Test how the search handles endpoints and disconnection before motion. Use **Test functions** (`component_checks.py`) without driving. Check a free start equal to goal, a blocked endpoint, and a disconnected map. `grid.is_blocked(cell)` and `grid.neighbors(cell)` expose the same grid rules as the route check.\n3. **Compare worlds.** Set `USE_STUDENT_GRID_PLANNER = True` in `course_setup.py` after checking the planner. Reuse the completed component files and measured robot settings from Waypoint Courier, and set their matching flags to `True`; `False` selects supplied versions. With **Virtual XRP** selected and `EXECUTE_ROUTE = False`, choose each named case in **Monitor → World** and run it. Compare predictions with Program output and inspect each returned path\'s endpoints, free cells, and steps. `main.py` reports `valid_path`, `no_path`, or `invalid_path`.\n\n## 3. Run and assess the route\n\n1. **Record motion settings.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changes after the next robot sample; approach speed remains 80% of selected cruise speed. Slider endpoints are configured control limits. Record values used; `robot_config.py` also holds slowing distance and pose tolerances.\n2. **Follow the virtual path.** For **Mapped route**, set `EXECUTE_ROUTE = True` in `challenge.py` and run the Virtual XRP. Supplied `main.py` converts the checked `GridPath` into goals for the selected `NavigationController`. Compare the printed path with the trajectory, obstacle clearance, contact, and final pose. If the robot contacts an obstacle or misses the destination, compare the planned clearance with its path and adjust clearance or navigation settings based on the discrepancy.\n3. **Measure a physical route if performed.** A physical trial is optional. First compare floor geometry and robot dimensions with `world.json`. Record closest obstacle gap and measurement method, contact, and final axle-midpoint pose. Distinguish measurements from estimated pose and virtual trajectory.\n\n## Your report\n\nSubmit one report per pair with both names, selected components, worlds, grid settings, and navigation settings. Label virtual observations and any physical measurements.\n\n1. **Preliminary lab work:** show the predicted outcome for each world, your search and path-recovery approach, component-check evidence, and why the selected cell size and clearance are appropriate.\n2. **Challenge data:** show the reachable world\'s grid and path, tabulate predicted and returned outcomes for all three worlds, and include the planned path and virtual trajectory with relevant settings.\n3. **Challenge performance:** report path validity, destination arrival, obstacle contact, and clearance observations. Include measured gap and final pose if a physical trial was performed.\n4. **Reflection:** explain any difference between a valid cell path and the robot\'s motion using evidence from the map, path, and trajectory. Identify a justified adjustment and how to test it.\n\n## Project files\n\n<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class="project-file-table">\n\n| File | What it does |\n| --- | --- |\n| <span class="supplied-file"><code>main.py</code> S</span> | Runs search, prints the grid and path, and optionally drives the route. |\n| <span class="supplied-file"><code>route_validation.py</code> S</span> | Checks path traversability and final estimated-pose arrival. |\n| <strong class="student-file"><code>grid_planner.py</code> *</strong> | Searches the occupancy grid for a connected free-cell path. |\n| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |\n| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |\n| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |\n| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |\n| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |\n| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads geometry and sets grid resolution, clearance, memory limit, and motion selection. |\n| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |\n| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor motion controls and publishes navigation progress. |\n| <span class="supplied-file"><code>grid_display.py</code> S</span> | Prints the grid, endpoints, and path. |\n| <strong class="config-file"><code>world.json</code> †</strong> | Defines the selectable worlds, geometry, start pose, and destination. |\n\n</div>\n\n## Parameters and functions\n\nThese are the settings and interfaces used above; see the API reference for full type and error behavior.\n\n### Parameters\n\n| Setting | Source and units | Effect |\n| --- | --- | --- |\n| `GRID_RESOLUTION_MM` | `challenge.py`; mm/cell | Cell width and height in the sampled map. |\n| `CLEARANCE_MM` | `challenge.py`; mm | Expands obstacles and arena edges for robot footprint and tracking margin. |\n| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Memory/work limit checked by `main.py` before planning. |\n| `EXECUTE_ROUTE` | `challenge.py`; Boolean | `False` plans without motion; `True` follows a valid path. |\n| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Route motion settings, applied by `robot_config.py` after the next sample. |\n| Approach speed, slowing distance, pose tolerances | `robot_config.py`; mm/s, mm, rad | Near-goal speed, slowing point, and accepted pose errors. |\n\n### Functions and methods\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm)` | `ArenaMap`, resolution and clearance in mm | Sampled free/blocked grid. |\n| `GridPlanner.plan(grid, start, goal)` | `OccupancyGrid`, two `GridCell` endpoints or `None` | Connected `GridPath` including endpoints, or `None`. |\n| `GridPath.to_goals(grid)` | Grid used for planning | World-coordinate navigation goals at turns and destination. |\n| `path_error(grid, start, goal, path)` | Grid, endpoints, proposed path | `None` for valid path or reason it cannot be followed. |\n| `goal_is_reached(pose, goal, config)` | Estimated final pose, destination, navigation settings | Boolean arrival within position and heading tolerances. |\n',qi='# Challenge 5 · Out-and-Back\n\n## Task\n\nFollow the assigned outbound route, stop at the observation pose, determine whether the center gate is blocked, and plan a return home. The gate is the only unknown map feature; the robot measures it while stationary.\n\n![Assigned outbound route, home, observation point, and center gate.](course-assets/out-and-back.svg)\n\n*Figure. Blue H, 1, and 2 markers show home and the ordered outbound stops; the orange O marker and left-pointing arrow show the stationary observation pose and heading. The dashed teal line is the assigned outbound route. Dark filled rectangles mark the fixed upper/lower walls and far reflector; the orange dashed rectangle is the center gate whose occupancy is observed. No return route is drawn. Dimensions come from `world.json` in millimeters.*\n\n## 1. Measure the gate before mission trials\n\n1. **Collect stationary readings.** Measure how range changes with the gate state. At the physical observation pose, aim the stopped robot toward the gate. In the file list, choose **Actions for range_readout.py → Make main**, then **Compile** and **Run**. Selecting a file in the editor alone does not change what Run executes. Collect repeated batches with the gate blocked and open without changing position or aim. The readout prints raw attempts, including `None` for an unavailable echo. `RANGE_SAMPLE_COUNT` in `challenge.py` initially requests seven attempts per batch; the count is adjustable.\n2. **Compare conditions.** Record each batch and count its positive, finite readings. Calculate their median by hand; mark the result unavailable when the count is below `MINIMUM_USABLE_RANGE_COUNT`. Compare the blocked and open medians and their variation across batches. If they overlap, inspect aim and reflecting surfaces and collect further measurements.\n3. **Choose a threshold.** Set `BLOCKED_RANGE_THRESHOLD_MM` in `challenge.py` between the groups of blocked and open medians. Supplied `observed_gate()` in `mission_policy.py` reports blocked at or below that range. Record the measurement basis; the 550 mm starter value is a default.\n\n## 2. Implement and check the range estimate\n\n1. **Implement the estimate.** Reduce a batch of raw attempts to one range value. In `sensor_model.py`, implement `SensorModel.estimate_range(samples, minimum_usable)`. Keep positive finite numeric readings in millimeters; reject `None`, Boolean, zero, negative, and nonfinite values. Return their median, or `None` when fewer than `minimum_usable` remain. An unavailable estimate cannot mean open gate.\n2. **Check sample batches.** Use **Test functions** (`component_checks.py`) to compare the method with supplied examples that include missing readings and an unusually large reading. These checks use fixed inputs, not your collected batches. `MINIMUM_USABLE_RANGE_COUNT` in `challenge.py` currently passes four; it is a configurable decision setting.\n3. **Select the component.** In `course_setup.py`, set `USE_STUDENT_SENSOR_MODEL = True` after checking it. Keep the wheel-measurement methods completed in Robot Curling and reuse the other completed component files and robot settings from Mapped Route. Set their matching flags to `True`; `False` selects supplied versions. Supplied `main.py`, `mission_policy.py`, and `mission_steps.py` handle stopping, classification, path checks, and route sequencing.\n\n## 3. Compare return routes and physical runs\n\n1. **Compare virtual decisions.** Check whether the two observations lead to different return plans. Restore **Actions for main.py → Make main**, then **Compile**. With **Virtual XRP** selected, choose **Center gate blocked** and then **Center gate open** in **Monitor → World**, running each case. `world.json` defines the simulated obstacles; `main.py` infers the gate state from range samples. Calculate the median of the printed `stationary_range_samples_mm` and compare it with `range_estimate_mm`. Record `gate_blocked`, return path length, result, and return time when available. The outbound route is the same in both worlds.\n2. **Record map settings.** `GRID_RESOLUTION_MM` and `CLEARANCE_MM` in `challenge.py` set the return grid and obstacle expansion; their defaults are 100 mm/cell and 95 mm. `main.py` changes the known map\'s `center_gate` feature from the range decision before calling the selected `GridPlanner`. Record these settings with the threshold; change them to test a stated reason.\n3. **Run physical conditions.** Run with gate blocked and open, fixed during each run. The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changes after the next robot sample; approach speed is 80% of cruise speed. Slider endpoints are configured limits. Use the same motion settings for a blocked/open comparison.\n4. **Measure arrival.** Record the stop at observation, gate decision, return route, and arrival home. Measure final axle-midpoint position and heading against the home mark, or record an early stopping location. If using a front-center mark, account for its axle offset and final heading. Repeat as needed to assess variation and record measurement precision.\n\n## Your report\n\nSubmit one report per pair with both names, robot identification, selected components, worlds, and trial settings. Label virtual output separately from physical measurements.\n\n1. **Preliminary lab work:** tabulate the stationary blocked/open range batches and usable counts, show the median checks, and justify the chosen threshold and any changed map or navigation settings.\n2. **Challenge data:** show the virtual and physical range estimates, gate decisions, return paths, results, return times when available, and measured final home poses for physical runs.\n3. **Challenge performance:** state whether the outbound stops, observation, gate decision, planned return, and home arrival succeeded in each gate condition. Quantify measured home error where a run completed.\n4. **Reflection:** use the readings and run records to locate any failure in measurement, decision, path, or motion. Identify one supported improvement and how another measurement or trial would test it.\n\n## Project files\n\n<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.\n\n<div class="project-file-table">\n\n| File | What it does |\n| --- | --- |\n| <span class="supplied-file"><code>main.py</code> S</span> | Runs outbound route, measures the gate, and plans and follows the return. |\n| <strong class="student-file"><code>sensor_model.py</code> *</strong> | Estimates range from a batch; also contains earlier wheel measurements. |\n| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |\n| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |\n| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |\n| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |\n| <span class="supplied-file"><code>grid_planner.py</code> S</span> | Searches the occupancy grid for a connected free-cell path. |\n| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |\n| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads geometry and sets range, map, and run settings. |\n| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |\n| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |\n| <span class="supplied-file"><code>mission_policy.py</code> S</span> | Classifies an available range as blocked or open. |\n| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and publishes mission progress and result. |\n| <span class="supplied-file"><code>mission_steps.py</code> S</span> | Follows routes and checks arrivals and cell paths. |\n| <span class="supplied-file"><code>range_readout.py</code> S</span> | Prints raw stationary range attempts. |\n| <strong class="config-file"><code>world.json</code> †</strong> | Defines gate worlds, geometry, start pose, and markers. |\n\n</div>\n\n## Parameters and functions\n\nThese are the settings and interfaces used above; see the API reference for full type and error behavior.\n\n### Parameters\n\n| Setting | Source and units | Effect |\n| --- | --- | --- |\n| `RANGE_SAMPLE_COUNT`, `MINIMUM_USABLE_RANGE_COUNT` | `challenge.py`; attempts, usable readings | Current defaults request seven attempts and require four usable readings; both are adjustable. |\n| `BLOCKED_RANGE_THRESHOLD_MM` | `challenge.py`; mm | Estimated range at or below which the named gate is classified blocked. |\n| `STATIONARY_SPEED_MM_S`, `STATIONARY_DURATION_S` | `challenge.py`; mm/s, s | Measured near-zero wheel-speed requirement before range collection. |\n| `GRID_RESOLUTION_MM`, `CLEARANCE_MM` | `challenge.py`; mm/cell, mm | Sample return map and expand obstacles for clearance. |\n| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Planner memory/work limit checked by `main.py`. |\n| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Outbound and return motion, applied by `robot_config.py` after the next sample. |\n| Approach speed, slowing distance, pose tolerances | `robot_config.py`; mm/s, mm, rad | Near-goal speed, slowing point, and accepted pose errors. |\n\n### Functions and methods\n\n| Function or method | Input | Return or effect |\n| --- | --- | --- |\n| `SensorModel.estimate_range(samples, minimum_usable)` | Range attempts in mm or `None`, usable-count setting | Median usable range in mm, or `None`. |\n| `observed_gate(estimate_mm, threshold_mm)` | Estimated range and threshold in mm | `True` blocked, `False` open, `None` unavailable. |\n| `follow_route(robot, navigation, state, goals)` | Robot, navigation, current state, ordered goals | Latest state and arrival or stop reason. |\n| `GridPlanner.plan(grid, start, goal)` | Return grid and two `GridCell` endpoints | Connected `GridPath`, or `None`. |\n',Ji=`{
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
`,Yi=`{
  "default_world": "turn-and-return",
  "worlds": [
    {
      "id": "turn-and-return",
      "label": "Turn and return",
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
          "minimum_x_mm": -100,
          "minimum_y_mm": -100,
          "maximum_x_mm": 100,
          "maximum_y_mm": 100,
          "label": "Start and finish"
        },
        {
          "type": "waypoint",
          "name": "turn",
          "x_mm": 500,
          "y_mm": 0,
          "heading_rad": 3.141592653589793,
          "label": "Turn"
        }
      ]
    }
  ]
}
`,Xi=`{
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
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -80,
          "minimum_y_mm": -80,
          "maximum_x_mm": 80,
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
`,Zi=`{
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
      "initial_pose": { "x_mm": -500, "y_mm": -300, "heading_rad": 0 },
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
          "minimum_x_mm": -570,
          "minimum_y_mm": -370,
          "maximum_x_mm": -430,
          "maximum_y_mm": -230,
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
      "initial_pose": { "x_mm": -500, "y_mm": -300, "heading_rad": 0 },
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
          "minimum_x_mm": -570,
          "minimum_y_mm": -370,
          "maximum_x_mm": -430,
          "maximum_y_mm": -230,
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
      "initial_pose": { "x_mm": -500, "y_mm": 0, "heading_rad": 0 },
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
          "minimum_x_mm": -570,
          "minimum_y_mm": -70,
          "maximum_x_mm": -430,
          "maximum_y_mm": 70,
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
`,Qi=`{
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
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": -350,
          "maximum_x_mm": 450,
          "maximum_y_mm": -150,
          "label": "Lower wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": 150,
          "maximum_x_mm": 450,
          "maximum_y_mm": 350,
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
        }
      ],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -140,
          "x2_mm": 0,
          "y2_mm": 140,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 900,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Delivery"
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
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": -350,
          "maximum_x_mm": 450,
          "maximum_y_mm": -150,
          "label": "Lower wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": 150,
          "maximum_x_mm": 450,
          "maximum_y_mm": 350,
          "label": "Upper wall"
        }
      ],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -140,
          "x2_mm": 0,
          "y2_mm": 140,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 900,
          "y_mm": 0,
          "heading_rad": 0,
          "label": "Delivery"
        }
      ]
    }
  ]
}
`,$i=`{
  "default_world": "near-wall",
  "worlds": [
    {
      "id": "near-wall",
      "label": "Near wall",
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
          "minimum_x_mm": 900,
          "minimum_y_mm": -400,
          "maximum_x_mm": 950,
          "maximum_y_mm": 400,
          "label": "Approach wall"
        }
      ],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -140,
          "x2_mm": 0,
          "y2_mm": 140,
          "label": "Start"
        },
        {
          "type": "finish_box",
          "minimum_x_mm": 450,
          "minimum_y_mm": -140,
          "maximum_x_mm": 620,
          "maximum_y_mm": 140,
          "label": "Safe stop band"
        },
        {
          "type": "finish_line",
          "x1_mm": 680,
          "y1_mm": -180,
          "x2_mm": 680,
          "y2_mm": 180,
          "label": "Exclusion line"
        }
      ]
    },
    {
      "id": "far-wall",
      "label": "Far wall",
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
          "minimum_x_mm": 1400,
          "minimum_y_mm": -400,
          "maximum_x_mm": 1450,
          "maximum_y_mm": 400,
          "label": "Approach wall"
        }
      ],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": 0,
          "y1_mm": -140,
          "x2_mm": 0,
          "y2_mm": 140,
          "label": "Start"
        },
        {
          "type": "finish_box",
          "minimum_x_mm": 950,
          "minimum_y_mm": -140,
          "maximum_x_mm": 1120,
          "maximum_y_mm": 140,
          "label": "Safe stop band"
        },
        {
          "type": "finish_line",
          "x1_mm": 1180,
          "y1_mm": -180,
          "x2_mm": 1180,
          "y2_mm": 180,
          "label": "Exclusion line"
        }
      ]
    },
    {
      "id": "no-range",
      "label": "No usable range",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "range_sensor": { "include_arena_boundary": false },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -100,
          "minimum_y_mm": -100,
          "maximum_x_mm": 100,
          "maximum_y_mm": 100,
          "label": "Remain stopped"
        }
      ]
    }
  ]
}
`,ea=`{
  "default_world": "localization-station",
  "worlds": [
    {
      "id": "localization-station",
      "label": "Localization station",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "range_sensor": { "include_arena_boundary": false },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 900,
          "minimum_y_mm": -400,
          "maximum_x_mm": 950,
          "maximum_y_mm": 520,
          "label": "Known x wall"
        },
        {
          "type": "wall",
          "minimum_x_mm": -400,
          "minimum_y_mm": 500,
          "maximum_x_mm": 900,
          "maximum_y_mm": 550,
          "label": "Known y wall"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -90,
          "minimum_y_mm": -90,
          "maximum_x_mm": 90,
          "maximum_y_mm": 90,
          "label": "Localization station"
        },
        {
          "type": "marker",
          "name": "scan_x",
          "x_mm": 0,
          "y_mm": 0,
          "label": "x scan"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 500,
          "y_mm": 350,
          "heading_rad": 0,
          "label": "Destination"
        },
        {
          "type": "finish_box",
          "minimum_x_mm": 440,
          "minimum_y_mm": 290,
          "maximum_x_mm": 560,
          "maximum_y_mm": 410,
          "label": "Finish"
        }
      ]
    },
    {
      "id": "missing-y-reference",
      "label": "Missing y reference",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "range_sensor": { "include_arena_boundary": false },
      "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 900,
          "minimum_y_mm": -400,
          "maximum_x_mm": 950,
          "maximum_y_mm": 520,
          "label": "Known x wall"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -90,
          "minimum_y_mm": -90,
          "maximum_x_mm": 90,
          "maximum_y_mm": 90,
          "label": "Localization station"
        },
        {
          "type": "waypoint",
          "name": "destination",
          "x_mm": 500,
          "y_mm": 350,
          "heading_rad": 0,
          "label": "Destination"
        }
      ]
    }
  ]
}
`,ta=`{
  "default_world": "all-stops-reachable",
  "worlds": [
    {
      "id": "all-stops-reachable",
      "label": "All stops reachable",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": -550, "y_mm": -350, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "block",
          "minimum_x_mm": -150,
          "minimum_y_mm": -150,
          "maximum_x_mm": 150,
          "maximum_y_mm": 150,
          "label": "Center storage block"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -620,
          "minimum_y_mm": -420,
          "maximum_x_mm": -480,
          "maximum_y_mm": -280,
          "label": "Depot"
        },
        {
          "type": "finish_box",
          "minimum_x_mm": -620,
          "minimum_y_mm": -420,
          "maximum_x_mm": -480,
          "maximum_y_mm": -280,
          "label": "Return to depot"
        },
        {
          "type": "waypoint",
          "name": "stop_a",
          "x_mm": -550,
          "y_mm": 350,
          "label": "Stop A"
        },
        {
          "type": "waypoint",
          "name": "stop_b",
          "x_mm": 150,
          "y_mm": 350,
          "label": "Stop B"
        },
        {
          "type": "waypoint",
          "name": "stop_c",
          "x_mm": 550,
          "y_mm": -350,
          "label": "Stop C"
        }
      ]
    },
    {
      "id": "stop-c-disconnected",
      "label": "Stop C disconnected",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": -550, "y_mm": -350, "heading_rad": 0 },
      "obstacles": [
        {
          "type": "wall",
          "minimum_x_mm": 350,
          "minimum_y_mm": -600,
          "maximum_x_mm": 450,
          "maximum_y_mm": 600,
          "label": "Dividing wall"
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -620,
          "minimum_y_mm": -420,
          "maximum_x_mm": -480,
          "maximum_y_mm": -280,
          "label": "Depot"
        },
        {
          "type": "waypoint",
          "name": "stop_a",
          "x_mm": -550,
          "y_mm": 350,
          "label": "Stop A"
        },
        {
          "type": "waypoint",
          "name": "stop_b",
          "x_mm": 150,
          "y_mm": 350,
          "label": "Stop B"
        },
        {
          "type": "waypoint",
          "name": "stop_c",
          "x_mm": 550,
          "y_mm": -350,
          "label": "Stop C"
        }
      ]
    }
  ]
}
`,na=`{
  "default_world": "arena-circuit",
  "worlds": [
    {
      "id": "arena-circuit",
      "label": "Arena circuit",
      "bounds": {
        "minimum_x_mm": -1524,
        "minimum_y_mm": -609.6,
        "maximum_x_mm": 1524,
        "maximum_y_mm": 609.6
      },
      "initial_pose": { "x_mm": -555, "y_mm": -300, "heading_rad": 0 },
      "obstacles": [],
      "tracks": [
        {
          "type": "line",
          "name": "arena_circuit",
          "label": "Arena circuit",
          "width_mm": 18,
          "darkness": 1,
          "closed": true,
          "points": [
            { "x_mm": -500, "y_mm": -300 },
            { "x_mm": 500, "y_mm": -300 },
            { "x_mm": 750, "y_mm": -220 },
            { "x_mm": 900, "y_mm": 0 },
            { "x_mm": 750, "y_mm": 220 },
            { "x_mm": 500, "y_mm": 300 },
            { "x_mm": -500, "y_mm": 300 },
            { "x_mm": -750, "y_mm": 220 },
            { "x_mm": -900, "y_mm": 0 },
            { "x_mm": -750, "y_mm": -220 }
          ]
        },
        {
          "type": "line",
          "name": "finish",
          "label": "Start and finish bar",
          "width_mm": 50,
          "darkness": 1,
          "closed": false,
          "points": [
            { "x_mm": -500, "y_mm": -365 },
            { "x_mm": -500, "y_mm": -235 }
          ]
        }
      ],
      "markers": [
        {
          "type": "start_box",
          "minimum_x_mm": -600,
          "minimum_y_mm": -390,
          "maximum_x_mm": -470,
          "maximum_y_mm": -210,
          "label": "Start on finish bar"
        }
      ]
    }
  ]
}
`,ra=`{
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
        "x_mm": -1224,
        "y_mm": 0,
        "heading_rad": 0
      },
      "obstacles": [],
      "markers": [
        {
          "type": "start_line",
          "x1_mm": -1224,
          "y1_mm": -150,
          "x2_mm": -1224,
          "y2_mm": 150,
          "label": "Start"
        },
        {
          "type": "waypoint",
          "name": "finish",
          "x_mm": -224,
          "y_mm": 0,
          "label": "Finish"
        }
      ]
    }
  ]
}
`,ia=`{
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 900,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1100,
          "y_mm": 300
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -1100,
          "y_mm": 350
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1320,
          "y_mm": 175
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 810,
          "y_mm": -310
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1120,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -810,
          "y_mm": 310
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1120,
          "y_mm": 0
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 710,
          "y_mm": -390
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1100,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -710,
          "y_mm": 390
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1100,
          "y_mm": 0
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 980,
          "y_mm": -260
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1240,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -980,
          "y_mm": 260
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1240,
          "y_mm": 0
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 730,
          "y_mm": -310
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1060,
          "y_mm": 20
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -870,
          "y_mm": 350
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1200,
          "y_mm": 20
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 830,
          "y_mm": -330
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1160,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -830,
          "y_mm": 330
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1160,
          "y_mm": 0
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 930,
          "y_mm": -390
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1200,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -930,
          "y_mm": 390
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1200,
          "y_mm": 0
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
          "width_mm": 18,
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
          "width_mm": 50,
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
          "label": "Checkpoint 1",
          "x_mm": 1020,
          "y_mm": -370
        },
        {
          "type": "waypoint",
          "name": "checkpoint_2",
          "label": "Checkpoint 2",
          "x_mm": 1250,
          "y_mm": 0
        },
        {
          "type": "waypoint",
          "name": "checkpoint_3",
          "label": "Checkpoint 3",
          "x_mm": -1020,
          "y_mm": 370
        },
        {
          "type": "waypoint",
          "name": "checkpoint_4",
          "label": "Checkpoint 4",
          "x_mm": -1250,
          "y_mm": 0
        }
      ]
    }
  ]
}
`,aa=`{
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
`,oa=`{
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
`,sa=`{
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
`,ca=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,la=`# Monitor controls for manual driving; each Run starts from zero effort.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
FORWARD_SPEED = live.number("manual_forward_mm_s", 0.0, -120.0, 120.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE = live.number("manual_turn_rad_s", 0.0, -1.0, 1.0, 0.1, unit="rad/s", label="Turn rate")
`,ua=`# Drive with Monitor sliders. Each Run starts with both commands at zero.

from course_setup import make_robot
from live_variables import FORWARD_SPEED, TURN_RATE
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, load_world


WORLD = load_world()
# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
try:
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
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
`,da=`# Nominal robot settings shared by virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,fa=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
TURN_TOLERANCE_RAD = 0.06
TURN_TIMEOUT_S = 8.0
`,pa=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,ma=`# Publish obstacle-turn range and current phase.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
CLOSE_RANGE_MM = live.number("close_range_mm", 400.0, minimum=200.0, maximum=900.0, step=25.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("forward_speed_mm_s", 150.0, minimum=40.0, maximum=180.0, step=10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("turn_rate_rad_s", 1.3, minimum=0.4, maximum=1.8, step=0.1, unit="rad/s", label="Turn rate")
TURN_DIRECTION = live.choice("turn_direction", "left", options=("left", "right"), label="Turn direction")
SECOND_APPROACH = live.toggle("second_approach", True, label="Drive after turn")


# Publish observed values for inspection without changing the motion decision.
def publish_range(range_mm):
    live.watch("range_mm", range_mm if range_mm is not None else "No echo", unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)


def publish_heading_error(error_rad):
    live.watch("heading_error_rad", error_rad, unit="rad")
`,ha=`# Drive to an obstacle, turn left, then drive to the next obstacle.

from math import pi

from challenge import WORLD, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from course_setup import make_robot
from live_variables import CLOSE_RANGE_MM, FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, TURN_DIRECTION, SECOND_APPROACH, publish_heading_error, publish_phase, publish_range
from robot_config import ROBOT_CONFIG
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
    direction = 1.0 if TURN_DIRECTION.value == "left" else -1.0
    target_heading = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
    started_ms = state.measurements.time_ms
    publish_phase("turning " + TURN_DIRECTION.value)
    # Recheck estimated heading until the turn tolerance or timeout ends the phase.
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


# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
try:  # The finally block stops the motors when this sequence exits.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    state = drive_until_close(robot, state)
    state = turn_quarter_turn(robot, state)
    if SECOND_APPROACH.value:
        state = drive_until_close(robot, state)
    publish_phase("complete")
    print("Obstacle-turn demo complete")
    print("final_pose:", state.pose)
finally:  # Runs after normal completion, a Python error, or cooperative Stop.
    robot.stop()
`,ga=`# Measured robot and controller settings for the obstacle-turn demo.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,_a=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
RANDOM_SEED = 0x5A17
SEGMENT_COUNT = 12
TURN_TOLERANCE_RAD = 0.05
TURN_TIMEOUT_S = 8.0
SEGMENT_TIMEOUT_S = 30.0
MINIMUM_SEGMENT_TRAVEL_MM = 100.0
MAXIMUM_SEGMENT_TRAVEL_MM = 180.0
`,va=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,ya=`# Publish the segment, phase, and estimated distance travelled.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
FORWARD_SPEED_MM_S = live.number("snake_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("snake_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Publish observed values for inspection without changing the motion decision.
def publish_segment(number):
    live.watch("segment", number)


def publish_phase(phase):
    live.watch("phase", phase)


def publish_travel(travel_mm):
    live.watch("travel_mm", travel_mm, unit="mm")
`,ba=`# Trace a reproducible sequence of straight runs and random quarter turns.

from math import pi

from challenge import WORLD, RANDOM_SEED, SEGMENT_COUNT, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S, SEGMENT_TIMEOUT_S, MINIMUM_SEGMENT_TRAVEL_MM, MAXIMUM_SEGMENT_TRAVEL_MM
from course_setup import make_robot
from live_variables import FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, publish_phase, publish_segment, publish_travel
from robot_config import ROBOT_CONFIG
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
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0

    def uniform(self, minimum, maximum):
        return minimum + (maximum - minimum) * self.unit()


def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Run finally below when this block finishes or raises a Python error.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    total_travel_mm = 0.0

    for segment_index in range(SEGMENT_COUNT):
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
        # Recheck heading after each turning sample, with a timeout for stalled progress.
        while True:
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                break
            if elapsed_time_s(state.measurements.time_ms, started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            direction = -1.0 if error_rad < 0.0 else 1.0
            turn_rate = direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad))
            state = robot.step(MotionCommand(0.0, turn_rate))
            total_travel_mm += body_travel_mm(state)

        publish_travel(total_travel_mm)

    publish_phase("complete")
    print("Random-snake route complete")
    print("seed:", RANDOM_SEED)
    print("final_pose:", state.pose)
finally:  # Stop the motors after normal completion or a Python exception.
    robot.stop()
`,xa=`# Nominal robot settings shared by virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,Sa=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
RANDOM_SEED = 0xC0FFEE
REVERSE_TIME_S = 0.4
MINIMUM_TURN_ANGLE_DEG = 70.0
MAXIMUM_TURN_ANGLE_DEG = 160.0
TURN_TOLERANCE_RAD = 0.06
TURN_TIMEOUT_S = 8.0  # End the run if a wheel or encoder prevents the rotation.
`,Ca=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,wa=`# Publish the latest range, phase, and avoidance count.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
OBSTACLE_DISTANCE_MM = live.number("obstacle_distance_mm", 240.0, 150.0, 700.0, 10.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("roomba_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
REVERSE_SPEED_MM_S = live.number("roomba_reverse_speed_mm_s", -120.0, -180.0, -60.0, 10.0, unit="mm/s", label="Reverse speed")
TURN_RATE_RAD_S = live.number("roomba_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Publish observed values for inspection without changing the motion decision.
def publish_range(range_mm):
    live.watch("range_mm", range_mm if range_mm is not None else "No echo", unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)


def publish_avoidance_count(count):
    live.watch("avoidances", count)
`,Ta=`# Drive forward, reverse from nearby obstacles, and choose a new heading.

from math import pi

from challenge import WORLD, RANDOM_SEED, REVERSE_TIME_S, MINIMUM_TURN_ANGLE_DEG, MAXIMUM_TURN_ANGLE_DEG, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from course_setup import make_robot
from live_variables import OBSTACLE_DISTANCE_MM, FORWARD_SPEED_MM_S, REVERSE_SPEED_MM_S, TURN_RATE_RAD_S, publish_avoidance_count, publish_phase, publish_range
from robot_config import ROBOT_CONFIG
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
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Run finally below when this block finishes or raises a Python error.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    state = robot.step(STOP_COMMAND, read_range=True)
    phase = "forward"
    phase_started_ms = state.measurements.time_ms
    target_heading_rad = state.pose.heading_rad
    avoidance_count = 0

    # Alternate range-checked travel and bounded turning until Stop.
    while True:  # Press Stop when you have observed enough of the route.
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        phase_time_s = elapsed_time_s(state.measurements.time_ms, phase_started_ms)

        if phase == "forward" and range_mm is not None and range_mm <= OBSTACLE_DISTANCE_MM.value:
            phase = "reverse"
            phase_started_ms = state.measurements.time_ms
        elif phase == "reverse" and phase_time_s >= REVERSE_TIME_S:
            direction = 1.0 if random.unit() < 0.5 else -1.0
            angle_deg = MINIMUM_TURN_ANGLE_DEG + random.unit() * (MAXIMUM_TURN_ANGLE_DEG - MINIMUM_TURN_ANGLE_DEG)
            target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * angle_deg * pi / 180.0)
            phase = "turn"
            phase_started_ms = state.measurements.time_ms
            avoidance_count += 1
            publish_avoidance_count(avoidance_count)

        if phase == "turn":
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                phase = "forward"
                # Take a stopped sample before starting the next approach.
                state = robot.step(STOP_COMMAND, read_range=True)
                continue
            if elapsed_time_s(state.measurements.time_ms, phase_started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            turn_direction = 1.0 if error_rad > 0.0 else -1.0
            command = MotionCommand(0.0, turn_direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad)))
        elif phase == "reverse":
            command = MotionCommand(REVERSE_SPEED_MM_S.value, 0.0)
        else:
            # No echo or a distant obstacle allows the supervised demo to continue.
            command = MotionCommand(FORWARD_SPEED_MM_S.value, 0.0)

        publish_phase(phase)
        state = robot.step(command, read_range=True)
finally:  # Runs after a return, Python error, or the IDE's cooperative Stop.
    robot.stop()
`,Ea=`# Nominal robot settings shared by virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,Da=`# SnakeGame settings shared by the virtual and physical XRP.

from ucsb_xrp import load_world

try:
    import xrp_sim_bridge  # Available only in the browser's virtual XRP.
    # Read selected-world markers and geometry from the same source as the simulator.
    WORLD = load_world()
except ImportError:
    WORLD = load_world(world_id="snake-physical")
`,Oa=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    return NavigationController(config)
`,ka=`# Monitor sliders and game readings.

from ucsb_xrp import live
from snake_config import CONFIG


growth = CONFIG["controls"]["growth_mm"]
speed = CONFIG["controls"]["speed_mm_s"]
# Motion code reads the current .value when it applies these Monitor controls.
GROWTH_MM = live.number("snake_growth_mm", growth["default"], growth["minimum"], growth["maximum"], growth["step"], unit="mm", label="Tail growth per food")
SPEED_MM_S = live.number("snake_speed_mm_s", speed["default"], speed["minimum"], speed["maximum"], speed["step"], unit="mm/s", label="Cruise speed")


# Publish observed values for inspection without changing the motion decision.
def publish_game(game):
    # Send the current score, food state, tail length, and stopping reason to Monitor.
    live.watch("snake_score", game.score, label="Score")
    live.watch("snake_food_count", len(game.food), label="Food in arena")
    live.watch("snake_tail_mm", game.tail_mm, unit="mm", label="Tail length")
    live.watch("snake_phase", game.phase, label="Game")


def publish_scene_config(world):
    # Mirror editable project settings in Monitor without a second config file.
    food = CONFIG["food"]
    body = CONFIG["body"]
    seed = food["physical_seed"] if world.id == "snake-physical" else food["virtual_seed"]
    live.watch("snake_scene_seed", seed)
    live.watch("snake_scene_max_food", food["maximum"])
    live.watch("snake_scene_margin", food["edge_margin_mm"])
    live.watch("snake_scene_jitter_x", food["jitter_x_fraction"])
    live.watch("snake_scene_jitter_y", food["jitter_y_fraction"])
    live.watch("snake_scene_head_mm", body["head_diameter_mm"])
    live.watch("snake_scene_tail_mm", body["tail_diameter_mm"])
    live.watch("snake_scene_pellet_mm", body["pellet_radius_mm"])
    live.watch("snake_scene_sample_mm", body["sample_spacing_mm"])
    live.watch("snake_scene_initial_mm", body["initial_tail_mm"])
    live.watch("snake_scene_points", body["maximum_tail_points"])
`,Aa=`# Drive between Cartesian food waypoints; stop on a wall or the finite tail.

from challenge import WORLD
from course_setup import make_navigation_controller, make_robot
from live_variables import GROWTH_MM, SPEED_MM_S, publish_game, publish_scene_config
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, navigation_config_for_speed
from snake_game import SnakeGame


# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
game = SnakeGame(WORLD)
last_speed_mm_s = NAVIGATION_CONFIG.cruise_speed_mm_s

try:
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    publish_scene_config(WORLD)
    publish_game(game)
    # Choose the current food goal until a wall, obstacle, tail, or win ends play.
    while game.phase == "playing":
        goal = game.current_food()
        navigation.start((goal,))
        # Retarget only after this food is reached or a terminal condition occurs.
        while game.phase == "playing" and game.current_food() is goal:
            if SPEED_MM_S.value != last_speed_mm_s:
                last_speed_mm_s = SPEED_MM_S.value
                navigation.set_config(navigation_config_for_speed(last_speed_mm_s))
            state = robot.step(navigation.update(state.pose), read_range=True)
            if game.observe(state.pose, GROWTH_MM.value, state.measurements.range_mm):
                publish_game(game)
finally:
    robot.stop()

print("SnakeGame:", game.phase, "score", game.score, "of", len(game.food))
`,ja=`# Robot calibration and navigation settings for SnakeGame.

from ucsb_xrp import NavigationConfig, RobotConfig
from snake_config import CONFIG


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(**CONFIG["robot"])


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
`,Ma=`# Read the SnakeGame settings used by Python and the arena view.

import json
import sys


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
`,Na=`# Repeatable food positions for both SnakeGame arenas.

from math import floor, sqrt
from snake_config import CONFIG


FOOD = CONFIG["food"]
MAX_FOOD = FOOD["maximum"]


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
`,Pa=`# Finite tail and food rules; no robot or browser dependencies.

from math import cos, sin, sqrt
from ucsb_xrp import NavigationGoal

from snake_food import food_count, food_positions
from snake_config import CONFIG


BODY = CONFIG["body"]
SAMPLE_SPACING_MM = BODY["sample_spacing_mm"]
MAX_TAIL_POINTS = BODY["maximum_tail_points"]
COLLISION_REACH_MM = (BODY["head_diameter_mm"] + BODY["tail_diameter_mm"]) / 2
FOOD_REACH_MM = BODY["head_diameter_mm"] / 2


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
`,Fa=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
INITIAL_POSE = WORLD.initial_pose
OBSTACLE_STOP_MM = 400.0  # Forward distance measured from the ultrasound sensor.
SPIRAL_EXPANSION_MM = 8000.0  # Expand slowly enough to see several circuits inside the arena.
`,Ia=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,La=`# Publish the distance travelled and requested yaw rate for one sample.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
FORWARD_SPEED = live.number("forward_speed_mm_s", 110.0, minimum=60.0, maximum=160.0, step=10.0, unit="mm/s", label="Forward speed")
WINDING_RATE = live.number("spiral_winding_turns_per_m", 0.7, minimum=0.3, maximum=1.4, step=0.1, unit="revolutions/m", label="Spiral winding rate")


# Publish observed values for inspection without changing the motion decision.
def publish_spiral_values(travel_mm, turn_rate_rad_s):
    live.plot("travel_mm", travel_mm, unit="mm", label="Travel")
    live.plot("turn_rate_rad_s", turn_rate_rad_s, unit="rad/s", label="Yaw rate")
`,Ra=`# Drive an expanding spiral and stop before a nearby obstacle.

from math import pi

from challenge import INITIAL_POSE, OBSTACLE_STOP_MM, SPIRAL_EXPANSION_MM
from course_setup import make_robot
from live_variables import FORWARD_SPEED, WINDING_RATE, publish_spiral_values
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND


# Continue until an obstacle is near or the operator presses Stop.
robot = make_robot(ROBOT_CONFIG)
try:  # Run the motion; the finally block below stops it when this block exits.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(INITIAL_POSE)

    # Check the range once before applying a moving command.
    state = robot.step(STOP_COMMAND, read_range=True)
    travel_mm = 0.0

    # Continue the expanding path while the latest range permits motion.
    while True:
        range_mm = state.measurements.range_mm
        # None means no usable echo; it does not mean an obstacle is close.
        if range_mm is not None and range_mm <= OBSTACLE_STOP_MM:
            result = "Obstacle detected; spiral stopped"
            break

        speed_mm_s = FORWARD_SPEED.value
        revolutions_per_mm = WINDING_RATE.value / 1000.0
        expansion = 1.0 + travel_mm / SPIRAL_EXPANSION_MM
        # Convert revolutions per millimeter into yaw rate in radians per second.
        turn_rate_rad_s = 2.0 * pi * speed_mm_s * revolutions_per_mm / expansion

        publish_spiral_values(travel_mm, turn_rate_rad_s)

        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s), read_range=True)
        # The mean signed wheel increment estimates travel of the axle center.
        measurements = state.measurements
        travel_mm += abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)
finally:  # Stop motors whenever this motion block exits.
    robot.stop()
print(result)
print("final_pose:", state.pose)
`,za=`# Nominal robot settings shared by virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,Ba=`# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import live, load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
`,Va=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    return NavigationController(config)
`,Ha=`# Publish route progress as estimated wheel travel and phase.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_travel(travel_mm):
    live.watch("travel_mm", travel_mm, unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)
`,Ua=`# Trace a block-letter UCSB route from ordered world waypoints.

from challenge import WORLD, ROUTE
from course_setup import make_navigation_controller, make_robot
from live_variables import publish_phase, publish_travel
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG



def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


if not ROUTE:
    raise RuntimeError("world.json must define at least one waypoint")

# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:  # The finally block stops the robot whenever the route exits.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    navigation.start(ROUTE)
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
finally:  # Stop the motors after normal completion or a Python exception.
    robot.stop()
`,Wa=`# Nominal robot and navigation settings for the UCSB route.

from ucsb_xrp import NavigationConfig, RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=1.3,
    position_tolerance_mm=18.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
`,Ga=`# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,Ka=`# Small, explicit open-loop effort sweep. Each pair moves together.
EFFORTS = (0.16, 0.22, 0.28)
# Each effort interval is bracketed by a zero-command settling interval.
EFFORT_DURATION_S = 0.7
ZERO_DURATION_S = 0.5
# Abort if the wheel-travel envelope is exceeded across the whole sweep.
MAXIMUM_WHEEL_TRAVEL_MM = 1500.0
`,qa=`# Publish motor command and measured wheel-speed samples.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_motor_values(command, measurements):
    live.plot("effort", command, label="Motor effort")
    live.plot("left_speed_mm_s", measurements.wheel_speeds.left_mm_s, unit="mm/s", label="Left speed")
    live.plot("right_speed_mm_s", measurements.wheel_speeds.right_mm_s, unit="mm/s", label="Right speed")
`,Ja=`# Measure motor effort versus wheel speed without wheel-speed feedback.
from time import sleep_ms
from experiment import (
    EFFORTS,
    EFFORT_DURATION_S,
    MAXIMUM_WHEEL_TRAVEL_MM,
    ZERO_DURATION_S,
)
from robot_config import ROBOT_CONFIG
from live_variables import publish_motor_values
from ucsb_xrp import DriveCommand, XRPBot, elapsed_time_s
from ucsb_xrp_reference import SensorModel

bot = XRPBot(ROBOT_CONFIG)
model = SensorModel(ROBOT_CONFIG)
bot.stop()
try:
    bot.reset_encoders()
    measurements = model.reset(bot.read())
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
                # This program uses XRPBot directly, so it owns sampling;
                # never add this delay to a Robot.step() loop.
                sleep_ms(ROBOT_CONFIG.sample_period_ms)
                measurements = model.update(bot.read())
                wheel_travel_mm = max(
                    abs(measurements.left_position_mm),
                    abs(measurements.right_position_mm),
                )
                if wheel_travel_mm > MAXIMUM_WHEEL_TRAVEL_MM:
                    raise RuntimeError("Characterization travel limit reached")
                publish_motor_values(command, measurements)
            print("effort:", command, "wheel_speeds_mm_s:", measurements.wheel_speeds)
    print("Motor characterization complete")
finally:  # Stop the motors after normal completion or a Python exception.
    bot.stop()
`,Ya=`# Supplied nominal calibration for the motor-characterization demo.
# Replace these defaults with measurements from your robot before physical use.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
`,Xa=`# Check Tutorial 1 functions without starting either robot.

from student_work import (
    average_speed_mm_s,
    range_state,
    route_distance_mm,
    wheel_speed_summary,
)


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


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
    _close(result, 150.0)
    _close(average_speed_mm_s(125.0, 0.5), 250.0)
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
    if result["sample_count"] != 3:
        raise AssertionError("sample_count should be 3")
    _close(result["mean_left_mm_s"], 120.0)
    _close(result["mean_right_mm_s"], 110.0)
    _close(result["mean_difference_mm_s"], 10.0)
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
`,Za=`# Run the Tutorial 1 checks, then print examples from the completed functions.

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
`,Qa=`# Runnable Python examples used by Tutorial 1. This tutorial does not start a robot.


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
        "mean_difference_mm_s": mean_left_mm_s - mean_right_mm_s,
    }
`,$a=`# Assemble the supplied course components used by this tutorial.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,eo=`# Check measured Tutorial 2 segments without starting a robot.

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
`,to=`# Draw a square from measured wheel travel and estimated heading.

from math import pi

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import load_world


SIDE_SPEED_MM_S = 140.0
SIDE_DISTANCE_MM = 180.0
TURN_RATE_RAD_S = 1.5
TURN_ANGLE_RAD = pi / 2.0
MAXIMUM_SEGMENT_SAMPLES = 400  # Fault stop if sensing or motion makes no progress.


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
# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
try:
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(load_world().initial_pose)
    # Each drawing segment ends from measured state, with a sample limit.
    for segment in segments:
        segment_start = state
        for _ in range(MAXIMUM_SEGMENT_SAMPLES):
            if segment.is_complete(segment_start, state):
                break
            state = robot.step(segment.command())
        else:
            raise RuntimeError("No measured completion for " + segment.name)
finally:  # Stop motors whenever this motion block exits.
    robot.stop()
print("Tutorial 2 drawing complete")
print("final_pose:", state.pose)
`,no=`# Nominal settings shared by the virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
`,ro=`# Measured straight and turning segments for a Virtual XRP drawing.

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
`,io=`# Assemble the supplied course components used by this tutorial.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,ao=`# Software checks for the Tutorial 3 RobotState calculation and sampled run.

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
        self.state = _state_for_step(0 if self.frozen else len(self.step_calls))
        return self.state

    def stop(self):
        self.stop_count += 1


def _state_for_step(step):
    left_mm = float(step) * 2.0
    right_mm = float(step) * 2.4
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


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


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
`,oo=`# Construct the Virtual XRP and call the checked Tutorial 3 program.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
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
`,so=`# Nominal settings shared by the virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
`,co=`# Read RobotState and run one straight motion to a measured wheel-travel target.

from ucsb_xrp import MotionCommand, Robot, RobotState, load_world


MAXIMUM_SAMPLES = 400  # Fault stop if a sensor or wheel reports no progress.


def mean_wheel_position_mm(state: RobotState) -> float:
    # The axle midpoint has traveled the mean of the signed wheel positions.
    measurements = state.measurements
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    target_distance_mm: float,
) -> RobotState:
    # Request forward_speed_mm_s until measured wheel travel reaches
    # target_distance_mm. Return the final RobotState; always stop the robot.
    if forward_speed_mm_s <= 0.0 or target_distance_mm <= 0.0:
        raise ValueError("speed and target distance must be positive")
    try:
        state = robot.start(load_world().initial_pose)
        start_position_mm = mean_wheel_position_mm(state)
        command = MotionCommand(forward_speed_mm_s, 0.0)
        for _ in range(MAXIMUM_SAMPLES):
            if mean_wheel_position_mm(state) - start_position_mm >= target_distance_mm:
                return state
            state = robot.step(command)
        raise RuntimeError("Measured wheel travel did not reach the target")
    finally:  # Stop the motors after completion or a Python exception.
        robot.stop()
`,lo=`# Assemble the supplied course components used by this tutorial.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,uo=`# Behavior checks for the Tutorial 4 state, command, and telemetry functions.

import student_work
from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid input should raise ValueError")


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


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
    recorder = _LiveRecorder()
    original_live = student_work.live
    student_work.live = recorder
    try:
        student_work.publish_telemetry(state, student_work.APPROACH)
    finally:
        student_work.live = original_live
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
    _close(plots["heading_rad"][0], 0.4)

    no_range = RobotState(
        Measurements(120, 0.02, 142.0, 162.0, 2.0, 2.0, 100.0, 100.0, None, False),
        Pose(52.0, 20.0, 0.4),
    )
    recorder = _LiveRecorder()
    student_work.live = recorder
    try:
        student_work.publish_telemetry(no_range, student_work.APPROACH)
    finally:
        student_work.live = original_live
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
`,fo=`# Monitor controls for the approach, turn, and stopped phases.
# The behavior reads .value after each robot sample.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
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
`,po=`# Approach a measured wall, turn through an estimated quarter-turn, and stop.

from math import pi

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
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
MAXIMUM_MISSING_RANGE_SAMPLES = 6  # Fault stop if range sensing is unavailable.
MAXIMUM_TURN_TIME_S = 5.0  # Fault stop if heading feedback does not progress.


# Check local examples before reporting results or starting motion.
if not run_exercise_checks():
    print("Restore the runnable example before starting the robot")
else:
    # Construct the robot from this project's configured components.
    robot = make_robot(ROBOT_CONFIG)
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(load_world().initial_pose)
        phase = APPROACH
        start_mean_mm = (
            state.measurements.left_position_mm + state.measurements.right_position_mm
        ) / 2.0
        turn_start_heading_rad = state.pose.heading_rad
        turn_start_ms = state.measurements.time_ms
        missing_range_samples = 0
        # Use range during approach and estimated heading during the turn.
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
                turn_start_heading_rad = state.pose.heading_rad
                turn_start_ms = state.measurements.time_ms

            if phase == APPROACH:
                missing_range_samples = (
                    missing_range_samples + 1
                    if state.measurements.range_mm is None else 0
                )
                mean_mm = (
                    state.measurements.left_position_mm + state.measurements.right_position_mm
                ) / 2.0
                if missing_range_samples >= MAXIMUM_MISSING_RANGE_SAMPLES:
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
    finally:  # Stop motors after completion or a Python exception.
        robot.stop()
    print("Tutorial 4 behavior complete")
    print("final_pose:", state.pose)
`,mo=`# Nominal settings shared by the virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
`,ho=`# Runnable measured behavior and telemetry functions for Tutorial 4.

from live_variables import FORWARD_SPEED, RUN_BEHAVIOR, STOP_DISTANCE, TURN_DIRECTION, TURN_RATE
from ucsb_xrp import MotionCommand, RobotState, live


APPROACH = "approach"
TURN = "turn"
DONE = "done"

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
        direction = 1.0 if turn_direction == "left" else -1.0
        return MotionCommand(0.0, direction * turn_rate_rad_s)
    return MotionCommand(0.0, 0.0)


# Inputs: latest RobotState and phase name; publishes current watch/plot values.
# Returns: None; range may be published as "unavailable".
def publish_telemetry(state: RobotState, phase: str) -> None:
    range_value = state.measurements.range_mm
    if range_value is None:
        range_value = "unavailable"
    live.watch("phase", phase)
    live.watch("range_mm", range_value, unit="mm")
    mean_distance_mm = (
        state.measurements.left_position_mm
        + state.measurements.right_position_mm
    ) / 2.0
    live.plot("wheel_distance_mm", mean_distance_mm, unit="mm")
    live.plot("heading_rad", state.pose.heading_rad, unit="rad")
`,go=`# Assemble the supplied course components used by this tutorial.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
`,_o=`# Check each field of the Tutorial 5 report without starting a robot.

from student_work import preflight_report
from ucsb_xrp import Measurements, Pose, RobotState


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


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
    if report.get("sample_count") != 3:
        raise AssertionError("sample_count: expected 3, received {}".format(report.get("sample_count")))
    try:
        preflight_report(())
    except ValueError:
        return
    raise AssertionError("raise ValueError for an empty collection")


def _check_elapsed_time(report):
    _close(report.get("elapsed_time_s"), 0.04)


def _check_wheel_position(report):
    _close(report.get("maximum_abs_wheel_position_mm"), 0.4)


def _check_range_count(report):
    if report.get("usable_range_count") != 2:
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
`,vo=`# Explicit motion permission for the short physical preflight.

from ucsb_xrp import live


# Stationary checks always run; this control alone permits the motion segment.
ENABLE_SHORT_MOTION = live.toggle("tutorial_enable_short_motion", False, label="Enable short motion")
`,yo=`# Check stationary sensors, then request one short straight motion.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from live_variables import ENABLE_SHORT_MOTION
from robot_config import ROBOT_CONFIG
from student_work import preflight_report
from ucsb_xrp import MotionCommand, STOP_COMMAND, load_world


STATIONARY_SAMPLE_COUNT = 50
MOTION_SAMPLE_COUNT = 25
MOTION_SPEED_MM_S = 60.0

# Input: Robot; returns stationary RobotState samples, including the start.
def collect_stationary_samples(robot):
    # Robot.step maintains the sample schedule; no additional delay is needed.
    states = []
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(load_world().initial_pose)
        states.append(state)
        # Collect repeated stopped samples to expose sensor noise and encoder drift.
        for _ in range(STATIONARY_SAMPLE_COUNT):
            state = robot.step(STOP_COMMAND, read_range=True)
            states.append(state)
        return tuple(states)
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


# Input: Robot; returns start and final RobotState after a short gated motion run.
def run_short_motion(robot):
    # This fixed-sample motion checks motors and encoders; it is not distance control.
    try:
        initial_state = robot.start(load_world().initial_pose)
        state = initial_state
        command = MotionCommand(MOTION_SPEED_MM_S, 0.0)
        # The explicit motion gate permits only this short diagnostic sequence.
        for _ in range(MOTION_SAMPLE_COUNT):
            state = robot.step(command)
        return initial_state, state
    finally:  # Stop the motors after normal completion or a Python exception.
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

    # Construct the robot from this project's configured components.
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

    if not ENABLE_SHORT_MOTION.value:
        print("Short motion disabled; enable it explicitly and Run again")
        return report

    initial_state, final_state = run_short_motion(robot)
    wheel_travel_mm = mean_wheel_position_mm(final_state) - mean_wheel_position_mm(initial_state)
    print("Short motion check complete")
    print("motion_wheel_travel_mm:", wheel_travel_mm)
    print("final_pose:", final_state.pose)
    return report


run_preflight()
`,bo=`# Nominal settings shared by the virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
`,xo=`# Summarize stationary RobotState samples collected during Tutorial 5.


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
        elapsed_time_s += measurements.dt_s
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
`,So=`# Manual driving

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
defines the virtual arena and starting pose. \`course_setup.py\` assembles the
supplied robot components; \`robot_config.py\` holds the robot settings. The
same project can run on a physical XRP, but use a clear floor area, keep the
robot in view, and have **Stop** ready. This demonstration has no automatic
obstacle avoidance; the front range sensor cannot see behind the robot.
`,Co=`# Obstacle turn

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
contains the approach and rotation functions. **robot_config.py** holds robot
geometry and controller settings. **live_variables.py** also publishes range,
phase, and heading-error watches.

For a physical run, arrange broad, firm obstacles as shown in the world and
leave room for the robot to stop. A missing echo allows the approach to
continue; press **Stop** if the path is no longer clear or no obstacle is found.
A rotation that takes more than eight seconds stops with an error.

The \`finally\` block calls \`robot.stop()\` when the sequence ends or a Python
error interrupts it.
`,wo=`# Random-snake route

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
  **robot_config.py** holds robot dimensions and controller settings.

On the physical XRP, place the robot at the configured starting pose in a
clear arena. Wheel slip and robot dimensions affect where the route finishes.
This demonstration does not sense obstacles.

A straight segment stops with an error if it takes more than 30 seconds; a
rotation has eight seconds. These limits help identify a robot that is not
moving as requested. The \`finally\` block calls \`robot.stop()\` when the route
ends or a Python error interrupts it.
`,To=`# Roomba-style obstacle avoidance

The XRP drives toward an obstacle, reverses briefly, turns, and drives forward
again. **Run** starts the demonstration; press **Stop** when finished.

The initial settings stop the approach at a forward ultrasound distance of
240 mm, reverse for 0.4 s, and choose a rotation
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
  **robot_config.py** contains robot-specific settings.

For a physical run, leave space behind the robot for reversing and use broad,
firm obstacles. A missing ultrasound echo allows the approach to continue;
watch the robot and use **Stop** if necessary. The robot has no rear range sensor.

If a turn does not finish within eight seconds, the program stops and reports
the problem. The \`finally\` block calls \`robot.stop()\` when the motion sequence
ends or a Python error interrupts it.
`,Eo=`# SnakeGame

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
\`robot_config.py\` applies the configured calibration and navigation settings.
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
`,Do=`# Expanding spiral

Run this demonstration to see how forward speed and yaw rate shape a curved
path. The robot drives forward while its yaw rate gradually decreases, so the
spiral expands. Watch the path in **Monitor** and press **Stop** when finished.

During the run, **Forward speed** and **Spiral winding rate** appear under
**Live controls**. Winding rate is expressed in revolutions per metre: a larger
value makes a tighter curve. **Travel** and **Yaw rate** are recorded and can be
selected under **Plot signals**.

## Change the experiment

- **world.json** sets the arena, obstacles, and initial position and heading.
  The default **Arena** is 3048 mm long and 1219.2 mm wide, with its origin at
  the centre. Heading zero points along +x; positive angles turn toward +y.
- **challenge.py** sets expansion distance and the obstacle stopping threshold.
  **live_variables.py** declares speed and winding controls; its 0.7 revolutions/m winding default starts
  with a broad curve; increase winding to compare tighter turns.
- **main.py** contains the spiral calculation and the repeated motion commands.
  **live_variables.py** also publishes travel and yaw rate; **robot_config.py**
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
`,Oo=`# UCSB waypoint route

The XRP traces the block letters **UCSB** by following a sequence of positions
in the arena. **Run** starts the route; the robot stops after reaching all 28
waypoints. Press **Stop** to end the run earlier.

**world.json** contains the route and starting pose. The initial position is at
the upper-left of the U, facing down its first stroke. Labels mark the start of
each letter in **Monitor**. Watch the estimated path and the **travel** value
as the robot moves.

## Change the experiment

Edit the waypoint positions in **world.json** to change the drawing. The route
is loaded in marker order. **robot_config.py** contains navigation speeds and
tolerances; **challenge.py** loads the named route. **main.py** passes
the route to the supplied navigation class and repeatedly applies its commands.

For a physical run, mark the starting position and heading in a clear arena.
The program follows its estimated position and does not sense obstacles.
Compare the physical path with the estimated path to see the effect of wheel
slip and robot dimensions.

The \`finally\` block calls \`robot.stop()\` when the route ends or a Python error
interrupts it.
`,ko=`# Demonstration · Motor Characterization

Measure how each wheel's speed changes with motor effort, without wheel-speed
feedback. Use the results to choose separate left and right feedforward settings
for Robot Curling.

Begin with the Virtual XRP. For physical measurements, use the lane and motion
procedure arranged by the instructor. Record the robot, battery condition, and
whether the wheels are raised or driving on the floor; the load affects the
result.

## Run the experiment

Open \`experiment.py\` to inspect the effort levels and intervals. The supplied
program applies efforts 0.16, 0.22, and 0.28, each for 0.7 s, with zero effort
between steps. It limits effort to 0.3, each interval to 1 s, and wheel travel
to 1500 mm over the whole experiment. Compile, Run, and save the effort and
left/right wheel-speed plots.

These short timed inputs measure the motor's response. In the challenges,
measured distance, sensor readings, and pose determine when to turn or stop.
This demonstration uses \`XRPBot\` directly and controls its own sampling;
\`Robot.step()\` already handles sampling in the challenge programs.

## Interpret the measurements

Plot each wheel's speed against effort using portions where speed is approximately constant.
Identify the effort needed to start moving and the range where the relation is
approximately linear. If a step is still accelerating at its end, record that
fact instead of treating its final speed as a steady value.

Estimate a relation \`effort = offset + gain * speed_mm_s\` for each wheel. Enter
its offset and gain as \`left_start_command\` and \`left_speed_command_gain\` in
\`robot_config.py\`, and use the corresponding \`right_\` fields for the right
wheel. Verify these values in the closed-loop Curling run. Keep the plots,
measurement conditions, and fitted values for the preliminary lab-work section
of the pair's Challenge 1 report.
`,Ao='# Tutorial 1: Python essentials\n\nRun four short, complete functions in `student_work.py`. This project does not\nstart either robot. It introduces the Python syntax used in the remaining\ntutorials: values, functions, decisions, loops, and collections.\n\nStart with **Run** and read the results in **Program output**. Keep these\ninstructions beside the editable `student_work.py`; most edits are in that file, with one input-change exercise in\nthe supplied `main.py` below. Make one temporary expression or branch change in `student_work.py`\nand run again. Each Run checks the four functions before printing the examples.\n\n## Reading a function\n\n```python\ndef average_speed_mm_s(distance_mm: float, duration_s: float) -> float:\n    speed_mm_s = distance_mm / duration_s\n    return speed_mm_s\n```\n\n- `def` begins a function.\n- The values inside parentheses are its inputs.\n- `return` sends one result back to the caller.\n- The annotations after `:` and `->` document expected types. MicroPython does\n  not enforce them, so your code must still handle invalid values deliberately.\n- A name ending in `_mm`, `_s`, or `_mm_s` states its physical unit.\n\nIndentation defines which statements belong to the function or to an `if` or\n`for` block. Use four spaces for each indentation level.\n\n## Example 1: calculate average speed\n\nRead `average_speed_mm_s(distance_mm, duration_s)`, trace the supplied call from\n`main.py`, then predict the result for the input below.\n\n```python\naverage_speed_mm_s(600.0, 4.0)  # returns 150.0\n```\n\nReturn distance divided by duration. Reject a negative distance or a duration\nthat is zero or negative with `raise ValueError(...)`. `ValueError` identifies an input that this function does not accept.\n\n## Example 2: choose from measured conditions\n\nRead `range_state(range_mm, stop_distance_mm)` and predict which branch each\nsupplied call below selects.\n\n```python\nrange_state(180.0, 250.0)  # returns "stop"\nrange_state(None, 250.0)   # returns "unavailable"\n```\n\nUse `if`, `elif`, and `else` to return:\n\n- `"unavailable"` when `range_mm is None`;\n- `"stop"` when range is at or below the stop distance; and\n- `"clear"` otherwise.\n\n`None` means that no usable measurement is available. Check it before making a\nnumerical comparison. Reject a stop distance that is zero or negative.\n\n## Example 3: total a route with a loop\n\nRead `route_distance_mm(segment_distances_mm)`, then predict the total if another\nroute segment were added.\n\n```python\nroute_distance_mm([120.0, 80.0, 50.0])  # returns 250.0\n```\n\nA list (`[...]`) and tuple (`(...)`) are ordered collections. Start a total at\n`0.0`, use a `for` loop to visit each distance, and add it to the total. Reject\na negative segment. An empty route has a total distance of `0.0`.\n\n## Example 4: return named results\n\nRead `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`, then predict\nwhich fields would change if one wheel-speed sample changed.\n\n```python\nsummary = wheel_speed_summary([100.0, 120.0], [90.0, 110.0])\nprint(summary["mean_difference_mm_s"])  # 10.0\n```\n\nReject empty inputs or inputs with different lengths. Otherwise return a\ndictionary with these four named results:\n\n- `"sample_count"`;\n- `"mean_left_mm_s"`;\n- `"mean_right_mm_s"`; and\n- `"mean_difference_mm_s"`, calculated as left mean minus right mean.\n\nA dictionary groups related values under descriptive keys. This pattern is\nused later for telemetry summaries.\n\n## Run and observe\n\n1. Select **Run** and read all four results in **Program output**.\n2. Open `student_work.py` beside these instructions and trace one result back\n   through its function.\n3. Make one small expression or branch change in `student_work.py` and predict\n   which check will identify it.\n4. Select **Run** again and compare the result with your prediction.\n5. Restore the supplied behavior before continuing if a check identifies a\n   mismatch.\n\nIf Python reports a syntax error, inspect the stated line and the line above\nit. Check indentation, parentheses, commas, colons, and spelling. A temporary\n`print(...)` can reveal an intermediate value; remove repeated debug prints\nafter the function works.\n\n## From MATLAB to the project files\n\n| Python form | Meaning in this course |\n| --- | --- |\n| `samples[0]` | First sample; indices start at zero. |\n| `range(4)` | Four values: 0, 1, 2, 3; the endpoint is excluded. |\n| `distance_mm ** 2` | Squared value; `^` is not exponentiation. |\n| `[1, 2] + [3]` | List concatenation, not vector addition. |\n| `value is None` | Missing reading; never substitute a physical zero silently. |\n| `if error_mm > tolerance_mm:` | Indentation defines the conditional block. |\n| `self.previous_count = count` | Store state for the next call on this object. |\n| `from robot_config import ROBOT_CONFIG` | Import a named value from a file. |\n\n`=` assigns; `==` compares. Use `and`, `or` and `not` for scalar conditions.\nTwo names assigned the same list refer to the same mutable list; use `list(old)`\nwhen an independent copy is intended. Modules replace a shared interactive\nworkspace: make inputs explicit and keep calibration in its named file. Run\ncreates fresh program objects; saved project files remain. Avoid NumPy-specific\noperations in MicroPython. First change a working function, then one small class;\nbase classes supply an interface but do not implement its missing method.\n\n## A complete edit–predict–check cycle\n\nThe four functions use the same units and missing-value rule that later robot\nprograms use. Work through this small data set before changing code:\n\n| Expression | Calculation or decision | Expected result |\n| --- | --- | --- |\n| `average_speed_mm_s(450.0, 3.0)` | 450 mm ÷ 3 s | 150 mm/s |\n| `range_state(None, 250.0)` | No usable reading | `"unavailable"` |\n| `range_state(250.0, 250.0)` | Equality meets the stop threshold | `"stop"` |\n| `route_distance_mm([80.0, 120.0, 50.0])` | Sum three segments | 250 mm |\n| `wheel_speed_summary([100.0, 120.0], [90.0, 110.0])` | Mean left 110, mean right 100 | Mean difference 10 mm/s |\n\nFor one controlled edit, change `range_state` to use `<` instead of `<=` at\nthe threshold. Predict that the equality case changes from `"stop"` to\n`"clear"`; then Run and locate the second check\'s `INCORRECT` line. Restore\n`<=` and confirm four `PASS` lines. A failed check gives evidence about one\nfunction. It does not mean the Virtual XRP moved: Tutorial 1 never starts a\nrobot.\n\nFor a second edit, change the route example in `main.py` from `[100.0,\n150.0]` to `[100.0, 150.0, 25.0]`. Predict the printed total before Run: it\nshould rise from 250 to 275 mm. This is an experiment with supplied input\ndata; restore the original list afterward. Notice that the independent\n`exercise_checks.py` still tests its own 250 mm example. This separates a\nfunction\'s rule from one particular input.\n\nIf a check fails, read the first `INCORRECT` line and reproduce its specific\ninput. Inspect intermediate values with one temporary `print(...)`, then\nremove it. If a numerical result is wrong, check units and parentheses before\nchanging the expected result. If a `None` case fails, check the missing-value\nbranch before doing arithmetic. Never replace a missing range with zero: zero\nmillimeters would falsely mean an obstacle at the sensor.\n\nContinue with **Tutorial 2: Virtual XRP drawing**. It uses these same units\nand comparisons on readings returned by a sampled robot.\n',jo='# Tutorial 2: draw from measured motion\n\nUse the **Virtual XRP** to draw four straight sides and four left turns. The\nprogram stops each side when measured mean wheel travel reaches its target and\neach corner when estimated heading changes by its target angle. This connects\nTutorial 1\'s arithmetic to a changing `RobotState`. The supplied drawing is\nabout 180 mm on each side; actual corners may round because motors respond\nand samples arrive at discrete intervals.\n\nOpen Monitor beside the IDE. Select **Run** before editing, then read the\nthree `PASS` lines in Program output and inspect the path and final pose. The\nfiles are already runnable so that each later edit has a visible baseline.\n\n## Project files and first edit\n\n| File | Role |\n| --- | --- |\n| `student_work.py` | Edit the segment data classes and `build_drawing(...)` to explore a path. |\n| `main.py` | Supplied entrypoint; sets target dimensions, runs each segment, and stops the robot. |\n| `exercise_checks.py` | Supplied checks for commands, measured completion, and segment order. |\n| `course_setup.py`, `robot_config.py` | Supplied robot assembly and settings. |\n| `world.json` | Supplied arena and initial pose used by the Virtual XRP. |\n\nEach `.py` file is a Python module. `main.py` imports `build_drawing` from\n`student_work.py` and calls it; it does not copy that function\'s code.\n\nAfter the baseline, change `SIDE_DISTANCE_MM` in `main.py` from 180 to 120 mm,\n**Reset** the Virtual XRP, and Run. Predict the change before looking at the\npath: each side should be about 60 mm shorter, so total commanded straight\ntravel falls by about `4 × 60 = 240 mm`. Restore 180 mm, then make the next\nchanges in `student_work.py`. This changes the value passed into `build_drawing()`; the segment methods\nremain in `student_work.py`.\n\n## 1. Read one measurement calculation\n\n`DrawingSegment("side 1", 140.0, 180.0)` stores a forward speed in mm/s and a\ntarget distance in mm. Its `command()` returns\n`MotionCommand(140.0, 0.0)`: forward motion with zero requested turn. A\n`MotionCommand` is a named data record; it is not a duration or a raw motor\nvoltage.\n\n`is_complete(start_state, current_state)` compares two readings:\n\n```python\nleft_mm = current.left_position_mm - start.left_position_mm\nright_mm = current.right_position_mm - start.right_position_mm\ntravel_mm = (left_mm + right_mm) / 2.0\n```\n\nFor starting wheel positions `(30, 34)` mm and current positions `(129, 133)`\nmm, both wheels advanced 99 mm; a 100 mm side is not yet complete. At\n`(131, 135)` mm, both advanced 101 mm and it is complete. Subtracting the\nstarting readings matters: the robot\'s wheel positions do not reset at every\nside.\n\n`__init__` runs when a segment object is created. Its `self.name`,\n`self.forward_speed_mm_s`, and `self.distance_mm` belong to that instance.\n`command()` and `is_complete()` read those same fields later. Python type\nannotations state expected types but do not enforce them by themselves;\nconstructor checks reject a missing name or nonpositive speed or distance.\n\n## 2. Read one turning calculation\n\n`TurnSegment("corner 1", 1.5, pi / 2.0)` requests an in-place left turn at 1.5 rad/s.\nIts `is_complete(...)` compares the current estimated heading with the heading\nat the start of this corner. `pi` is imported from `math`; `pi / 2.0` rad is\n90°. At 1.50 rad of heading change,\nthe corner is short of that target; at 1.60 rad, it has reached it. The code\nuses `wrap_angle_rad` so crossing the `−π`/`π` heading boundary does not make\none ordinary quarter-turn look like a full revolution.\n\nThe segment classes each store a different physical target. `DrawingSegment`\nuses wheel travel in mm; `TurnSegment` uses heading change in rad. Their shared\nmethod names let the short loop in `main.py` run either segment without asking\nwhich kind it received.\n\n## 3. Build and change an ordered path\n\n`build_drawing(side_speed_mm_s, side_distance_mm, turn_rate_rad_s,\nturn_angle_rad)` creates a list alternating side, corner, side, corner, and so\non. Read the `for index in range(4)` loop and predict the first and last\nsegment names. The first item is `side 1`; the eighth is `corner 4`.\n\nChange `build_drawing(...)` to use a shorter distance for sides 2 and 4 while\nleaving sides 1 and 3 at the requested distance. For example, half-length\nsides make a rectangle. Keep the passed-in `side_distance_mm` as the source of\nboth lengths so the function still works with another input. The checks will\nsay the result differs from the expected square sequence; **Run still executes the\ncurrent valid drawing** so you can inspect your rectangle. Restore the square\nbefore continuing.\n\n## 4. Compare prediction with the run\n\n1. Reset, Run, and note the three check results, drawn path, and `final_pose`.\n2. Make one dimension or sequence change. Predict which sides or corners\n   change, in mm or rad, before running again.\n3. Reset and Run. Compare the new path with the prediction. Use Program output\n   to locate a mismatch in a command value, measured completion rule, or\n   segment order.\n4. Restore the baseline; Run once more and confirm three `PASS` lines.\n\nThe inner loop in `main.py` calls `Robot.step(command)` repeatedly **until the\nmeasured target is reached**. It does not use a duration as the drawing\ninstruction. `MAXIMUM_SEGMENT_SAMPLES` is a fault stop if measurements or\nmotion fail to advance; it is not the target for a normal side or corner.\n`Robot.step()` already schedules samples, so do not add `sleep()` inside the\nloop. The `finally` block calls `robot.stop()` when motion finishes or Python\nraises an error. Select **Stop** in the IDE to interrupt a running experiment.\n\nContinue to **Tutorial 3: sampled robot programs** to examine the `RobotState`\nreturned by each sample and one measured straight run.\n',Mo=`# Tutorial 3: a measured robot program

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
| \`course_setup.py\`, \`robot_config.py\` | Supplied robot assembly and settings. |
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
controls the loop. \`MAXIMUM_SAMPLES\` is only a fault stop if the sensor reports
no progress; it is not a maneuver duration.

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
`,No="# Tutorial 4: behavior and live measurements\n\nRun a complete Virtual XRP behavior: approach the marked wall, turn about 90°,\nand stop. Its next command depends on a range reading, a retained phase, and\nestimated heading. You will change one live value while observing the phase\nwatch and two plots, then trace that visible change to a line of Python.\n\nOpen Monitor beside the IDE and **Run the supplied project before editing**.\nProgram output should show three `PASS` checks, then the final pose. The path\nshould approach the wall and turn. Reset before each comparison so both runs\nstart from the same pose. The supplied `main.py` owns the sampled loop and final\nmotor stop; edit `student_work.py` only when exploring a function.\n\n## Project files and the data path\n\n| File | Role |\n| --- | --- |\n| `student_work.py` | Runnable phase, command, and publication functions to read and edit. |\n| `live_variables.py` | Supplied Monitor control declarations for speed, distance, direction, and Run behavior. |\n| `main.py` | Supplied measured approach/turn sequence and motor cleanup. |\n| `exercise_checks.py` | Supplied input/output examples that run before motion. |\n| `course_setup.py`, `robot_config.py` | Supplied robot assembly and settings. |\n| `world.json` | Supplied arena, wall, and start pose shown in Monitor. |\n\n`Robot.step(command, read_range=True)` takes the next sample while approaching.\nThe returned `RobotState` contains `state.measurements.range_mm` and\n`state.pose.heading_rad`. The program passes those values to `next_phase`,\npasses the chosen phase to `command_for_phase`, publishes the same state to\nMonitor, and then requests the next sample. This is the complete\n**measure → decide → command → publish** cycle.\n\n## 1. Predict a phase transition\n\nThere are three phase names: `APPROACH`, `TURN`, and `DONE`. The current phase\nand new readings determine the next one.\n\n| Current phase | New evidence | Next phase |\n| --- | --- | --- |\n| `APPROACH` | Range 300 mm, stop distance 260 mm | `APPROACH` |\n| `APPROACH` | Range 260 mm, stop distance 260 mm | `TURN` |\n| `APPROACH` | Range `None` | `APPROACH` for that one decision |\n| `TURN` | Heading change 1.50 rad, below π/2 | `TURN` |\n| `TURN` | Heading change 1.60 rad, above π/2 | `DONE` |\n| `DONE` | Any later reading | `DONE` |\n\n`None` means no usable range measurement, not zero distance. The function\nchecks `range_mm is not None` before comparing distances. Six consecutive\nunavailable readings cause the supplied runner to stop with a fault, rather\nthan drive toward an unseen wall. `next_phase` itself stays a small,\ninput/output function that can be checked without starting a robot.\n\n`turn_start_heading_rad` is reset when the phase first changes to `TURN`.\nLater heading changes are measured relative to that start, not relative to\nthe original arena heading. The code uses `wrap_angle_rad` for the `−π`/`π`\nboundary. Predict which phase you would choose for a heading change of 1.50\nrad, then compare it with the table before running.\n\n## 2. Predict a motion command\n\n`command_for_phase(...)` returns a `MotionCommand` with named\n`forward_speed_mm_s` and `turn_rate_rad_s` fields.\n\n| Phase | Forward speed | Turn rate |\n| --- | --- | --- |\n| `APPROACH` | Positive live speed | 0 |\n| `TURN`, left | 0 | Positive live turn rate |\n| `TURN`, right | 0 | Negative live turn rate |\n| `DONE` | 0 | 0 |\n\nPositive turn is counterclockwise. At a selected speed of 110 mm/s and turn\nrate of 0.8 rad/s, a left-turn command is `MotionCommand(0.0, 0.8)`, not a\nrequest to drive forward while turning. The function rejects invalid phase,\nspeed, rate, or direction inputs before constructing a command. These are\nrequested robot motions; the supplied wheel controller determines bounded\nmotor effort.\n\n## 3. Change one live control and compare evidence\n\n`live_variables.py` declares speed, stopping distance, turn rate,\ndirection, and a Run behavior toggle. They appear under Monitor controls.\nRead current values through `.value`; the robot applies a changed control at\na sample boundary. Changing a slider during a run does not rewrite the saved\nproject file.\n\n1. Run the baseline with `STOP_DISTANCE = 260 mm`. In Monitor, note the\n   approach path, the range near the phase change, and the final heading.\n2. Reset. Set Stop distance to 340 mm and Run. Predict an earlier turn, farther\n   from the wall, before inspecting the path. Compare the `range_mm` watch at\n   the transition and the two paths. Keep speed and turn rate fixed.\n3. Reset. Restore 260 mm, choose `right`, and Run. Predict the sign of the\n   heading change. Compare the heading plot and final pose with the left run.\n4. Restore `left`. If you change `next_phase` or `command_for_phase` in\n   `student_work.py`, Run again and read the first differing check before\n   interpreting the path.\n\nThe Run behavior toggle can request `DONE` and zero motion at the next sampled\ndecision. The IDE **Stop** action interrupts the run separately.\n\n## 4. Connect telemetry to its source\n\n`publish_telemetry(state, phase)` sends the current `phase` and `range_mm` to\n`live.watch(...)`. A watch shows the latest value; unavailable range appears\nas text. It sends two numerical values to `live.plot(...)`:\n\n- `wheel_distance_mm`: mean left/right wheel position in mm;\n- `heading_rad`: estimated heading in rad.\n\nFor left and right positions 140 and 160 mm, the plotted mean is 150 mm. That\nnumber is a computed wheel-position value, not a separate floor measurement.\nThe plot retains samples in the recorded run; the watch shows current status.\nPublication does not choose a command. Use a `print(...)` for a rare milestone\nor exception, not once per sample.\n\nThe runner stops if approach wheel travel reaches 500 mm without a valid phase\nchange, if six consecutive range readings are unavailable, or if a turn fails\nto reach π/2 within 5 s. Those limits are fault stops; normal approach and turn\nend from range and heading measurements. `robot.stop()` in `finally` covers\nnormal completion and Python exceptions. `Robot.step()` already schedules\nsamples; do not add `sleep()` to the loop. This virtual run does not establish\nphysical stopping distance or sensor calibration.\n\nContinue to **Tutorial 5: Physical XRP deployment** after you can connect a\nvisible path, phase transition, and plotted signal to the source measurements.\n",Po=`# Tutorial 5: Physical XRP deployment

Run one project first on the Virtual XRP and then on a physical XRP. The first
part collects stationary sensor records. The second part requests a short,
low-speed straight motion and confirms that wheel position changes. This tests
project transfer, execution, telemetry, sensors, motors, encoders, and stopping
without solving a course challenge.

The supplied project is immediately runnable. Rehearse it on the Virtual XRP
before editing \`student_work.py\` or selecting the physical target. The
**Enable short motion** toggle in \`live_variables.py\` defaults off; no motor motion follows the
stationary report until you explicitly enable it for a later Run.

## Walkthrough: summarize a sequence of robot states

Read:

\`\`\`python
def preflight_report(states: object) -> dict:
\`\`\`

\`states\` is a nonempty list or tuple of \`RobotState\` records. Use one loop to
return a dictionary containing:

- \`"sample_count"\`: number of states;
- \`"elapsed_time_s"\`: sum of \`state.measurements.dt_s\`;
- \`"maximum_abs_wheel_position_mm"\`: largest absolute left or right wheel
  position;
- \`"usable_range_count"\`: number of control states with range other than \`None\`,
  including retained readings; this is not the number of ultrasound attempts;
- \`"nearest_range_mm"\`: smallest available range, or \`None\` if no range is
  available; and
- \`"button_was_pressed"\`: \`True\` if any state reports a pressed USER button.

Raise \`ValueError\` for an empty collection. Initialize named accumulators before
the loop. Check \`range_mm is not None\` before comparing distances.

Each **Run** checks every report field before interacting with either XRP, so
one incorrect edit does not hide the others and an invalid report prevents
motion.

## Rehearse on the Virtual XRP

1. Select **Virtual XRP**, open Monitor, and select **Compile**.
2. Select **Run** with **Enable short motion** off. The program collects samples
   with \`STOP_COMMAND\`, prints the stationary report, and exits without motion.
3. Set **Enable short motion** on, Reset, and select **Run** again. After the
   stationary report, the program requests 60 mm/s for 25 samples
   (approximately 0.5 seconds), then stops.
4. Press and release the virtual USER button during the stopped portion if you
   want to verify that field.
5. Confirm the stationary report and \`motion_wheel_travel_mm\` in **Program
   output**. Confirm a short straight path and final zero command in Monitor.
6. Set **Enable short motion** off before changing targets.

## Run on a physical XRP

1. For an uncommissioned XRP, use **First robot setup**: switch its power off,
   connect USB-C, then switch it on. For an already configured XRP, use
   **Wi-Fi setup → Test Wi-Fi**. The computer and robot normally use class Wi-Fi.
2. Keep this project open and select **Physical XRP**. The computer and XRP must
   use the network selected during setup.
3. Open Monitor and confirm that the physical XRP is connected and **Enable
   short motion** is off. Select **Run** once to collect only the stationary
   report.
4. Place the robot where a short straight motion is possible. Set **Enable short
   motion** on, then select **Run** deliberately.
5. Confirm changing encoder and wheel-position values, positive
   \`motion_wheel_travel_mm\`, telemetry in Monitor, and a final zero command.
6. Set **Enable short motion** off after the test. A later repetition does not
   require another setup operation, but it does require deliberately enabling
   motion again.

If connection fails, use the current System log message. A Virtual XRP pass
checks the Python project; it does not verify the physical network or hardware.

## Why the loop contains no delay

\`Robot.step(...)\` already waits for the next scheduled sample, applies the
command, reads sensors, updates state, and publishes telemetry. **Do not add
\`sleep()\` or \`sleep_ms()\` inside the loop.** An extra delay slows feedback and changes the time between motion commands.
The measurement timestamps still record the actual elapsed interval.

After both runs complete, you have used the same program structure required by
the course challenges.
`,Fo=`{
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
`,Io=`{
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
`,Lo=`{
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
`,Ro=`{
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
`,zo=`{
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
`,Bo=`{
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
`,Vo=`{
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
`,Ho=`{
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
`,Uo=`{
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
`,Wo=`{
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
`,Go=`{
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
`,Ko=`{
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
`,qo=`{
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
`,Jo=`{
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
`,Yo={...Object.assign({"../../../vendor/current/starters/challenge_1/challenge.py":Lt,"../../../vendor/current/starters/challenge_1/component_checks.py":Rt,"../../../vendor/current/starters/challenge_1/course_setup.py":zt,"../../../vendor/current/starters/challenge_1/main.py":Bt,"../../../vendor/current/starters/challenge_1/robot_config.py":Vt,"../../../vendor/current/starters/challenge_1/sensor_model.py":Ht,"../../../vendor/current/starters/challenge_1/wheel_speed_controller.py":Ut,"../../../vendor/current/starters/challenge_2/challenge.py":Wt,"../../../vendor/current/starters/challenge_2/component_checks.py":Gt,"../../../vendor/current/starters/challenge_2/course_setup.py":Kt,"../../../vendor/current/starters/challenge_2/differential_drive.py":qt,"../../../vendor/current/starters/challenge_2/main.py":Jt,"../../../vendor/current/starters/challenge_2/odometry.py":Yt,"../../../vendor/current/starters/challenge_2/robot_config.py":Xt,"../../../vendor/current/starters/challenge_2/sensor_model.py":Zt,"../../../vendor/current/starters/challenge_2/wheel_speed_controller.py":Qt,"../../../vendor/current/starters/challenge_3/challenge.py":$t,"../../../vendor/current/starters/challenge_3/component_checks.py":en,"../../../vendor/current/starters/challenge_3/course_setup.py":tn,"../../../vendor/current/starters/challenge_3/differential_drive.py":nn,"../../../vendor/current/starters/challenge_3/main.py":rn,"../../../vendor/current/starters/challenge_3/navigation_controller.py":an,"../../../vendor/current/starters/challenge_3/odometry.py":on,"../../../vendor/current/starters/challenge_3/robot_config.py":sn,"../../../vendor/current/starters/challenge_3/sensor_model.py":cn,"../../../vendor/current/starters/challenge_3/wheel_speed_controller.py":ln,"../../../vendor/current/starters/challenge_4/challenge.py":un,"../../../vendor/current/starters/challenge_4/component_checks.py":dn,"../../../vendor/current/starters/challenge_4/course_setup.py":fn,"../../../vendor/current/starters/challenge_4/differential_drive.py":pn,"../../../vendor/current/starters/challenge_4/grid_planner.py":mn,"../../../vendor/current/starters/challenge_4/main.py":hn,"../../../vendor/current/starters/challenge_4/navigation_controller.py":gn,"../../../vendor/current/starters/challenge_4/odometry.py":_n,"../../../vendor/current/starters/challenge_4/robot_config.py":vn,"../../../vendor/current/starters/challenge_4/sensor_model.py":yn,"../../../vendor/current/starters/challenge_4/wheel_speed_controller.py":bn,"../../../vendor/current/starters/challenge_5/challenge.py":xn,"../../../vendor/current/starters/challenge_5/component_checks.py":Sn,"../../../vendor/current/starters/challenge_5/course_setup.py":Cn,"../../../vendor/current/starters/challenge_5/differential_drive.py":wn,"../../../vendor/current/starters/challenge_5/grid_planner.py":Tn,"../../../vendor/current/starters/challenge_5/main.py":En,"../../../vendor/current/starters/challenge_5/navigation_controller.py":Dn,"../../../vendor/current/starters/challenge_5/odometry.py":On,"../../../vendor/current/starters/challenge_5/robot_config.py":kn,"../../../vendor/current/starters/challenge_5/sensor_model.py":An,"../../../vendor/current/starters/challenge_5/wheel_speed_controller.py":jn,"../../../vendor/current/starters/challenge_6/challenge.py":Mn,"../../../vendor/current/starters/challenge_6/component_checks.py":Nn,"../../../vendor/current/starters/challenge_6/course_setup.py":Pn,"../../../vendor/current/starters/challenge_6/differential_drive.py":Fn,"../../../vendor/current/starters/challenge_6/grid_planner.py":In,"../../../vendor/current/starters/challenge_6/live_variables.py":Ln,"../../../vendor/current/starters/challenge_6/main.py":Rn,"../../../vendor/current/starters/challenge_6/navigation_controller.py":zn,"../../../vendor/current/starters/challenge_6/odometry.py":Bn,"../../../vendor/current/starters/challenge_6/range_safety_controller.py":Vn,"../../../vendor/current/starters/challenge_6/robot_config.py":Hn,"../../../vendor/current/starters/challenge_6/sensor_model.py":Un,"../../../vendor/current/starters/challenge_6/wheel_speed_controller.py":Wn,"../../../vendor/current/starters/challenge_7/challenge.py":Gn,"../../../vendor/current/starters/challenge_7/component_checks.py":Kn,"../../../vendor/current/starters/challenge_7/course_setup.py":qn,"../../../vendor/current/starters/challenge_7/differential_drive.py":Jn,"../../../vendor/current/starters/challenge_7/grid_planner.py":Yn,"../../../vendor/current/starters/challenge_7/main.py":Xn,"../../../vendor/current/starters/challenge_7/navigation_controller.py":Zn,"../../../vendor/current/starters/challenge_7/odometry.py":Qn,"../../../vendor/current/starters/challenge_7/pose_corrector.py":$n,"../../../vendor/current/starters/challenge_7/range_safety_controller.py":er,"../../../vendor/current/starters/challenge_7/robot_config.py":tr,"../../../vendor/current/starters/challenge_7/sensor_model.py":nr,"../../../vendor/current/starters/challenge_7/wheel_speed_controller.py":rr,"../../../vendor/current/starters/challenge_8/challenge.py":ir,"../../../vendor/current/starters/challenge_8/component_checks.py":ar,"../../../vendor/current/starters/challenge_8/course_setup.py":or,"../../../vendor/current/starters/challenge_8/differential_drive.py":sr,"../../../vendor/current/starters/challenge_8/grid_planner.py":cr,"../../../vendor/current/starters/challenge_8/main.py":lr,"../../../vendor/current/starters/challenge_8/navigation_controller.py":ur,"../../../vendor/current/starters/challenge_8/odometry.py":dr,"../../../vendor/current/starters/challenge_8/pose_corrector.py":fr,"../../../vendor/current/starters/challenge_8/range_safety_controller.py":pr,"../../../vendor/current/starters/challenge_8/robot_config.py":mr,"../../../vendor/current/starters/challenge_8/sensor_model.py":hr,"../../../vendor/current/starters/challenge_8/visit_order_planner.py":gr,"../../../vendor/current/starters/challenge_8/wheel_speed_controller.py":_r,"../../../vendor/current/starters/challenge_9/challenge.py":vr,"../../../vendor/current/starters/challenge_9/component_checks.py":yr,"../../../vendor/current/starters/challenge_9/course_setup.py":br,"../../../vendor/current/starters/challenge_9/lap_progress.py":xr,"../../../vendor/current/starters/challenge_9/line_follower.py":Sr,"../../../vendor/current/starters/challenge_9/live_variables.py":Cr,"../../../vendor/current/starters/challenge_9/main.py":wr,"../../../vendor/current/starters/challenge_9/robot_config.py":Tr,"../../../vendor/current/starters/new_challenge_1_robot_curling/challenge.py":Er,"../../../vendor/current/starters/new_challenge_1_robot_curling/component_checks.py":Dr,"../../../vendor/current/starters/new_challenge_1_robot_curling/course_setup.py":Or,"../../../vendor/current/starters/new_challenge_1_robot_curling/live_variables.py":kr,"../../../vendor/current/starters/new_challenge_1_robot_curling/main.py":Ar,"../../../vendor/current/starters/new_challenge_1_robot_curling/robot_config.py":jr,"../../../vendor/current/starters/new_challenge_1_robot_curling/sensor_model.py":Mr,"../../../vendor/current/starters/new_challenge_1_robot_curling/stopping_controller.py":Nr,"../../../vendor/current/starters/new_challenge_1_robot_curling/wheel_speed_controller.py":Pr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/challenge.py":Fr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/component_checks.py":Ir,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/course_setup.py":Lr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/differential_drive.py":Rr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/lap_progress.py":zr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/line_follower.py":Br,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/live_variables.py":Vr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/main.py":Hr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/reflectance_readout.py":Ur,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/robot_config.py":Wr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/sensor_model.py":Gr,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/wheel_speed_controller.py":Kr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/challenge.py":qr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/component_checks.py":Jr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/course_setup.py":Yr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/differential_drive.py":Xr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/live_variables.py":Zr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/main.py":Qr,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/navigation_controller.py":$r,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/odometry.py":ei,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/robot_config.py":ti,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/route_progress.py":ni,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/sensor_model.py":ri,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/wheel_speed_controller.py":ii,"../../../vendor/current/starters/new_challenge_4_mapped_route/challenge.py":ai,"../../../vendor/current/starters/new_challenge_4_mapped_route/component_checks.py":oi,"../../../vendor/current/starters/new_challenge_4_mapped_route/course_setup.py":si,"../../../vendor/current/starters/new_challenge_4_mapped_route/differential_drive.py":ci,"../../../vendor/current/starters/new_challenge_4_mapped_route/grid_display.py":li,"../../../vendor/current/starters/new_challenge_4_mapped_route/grid_planner.py":ui,"../../../vendor/current/starters/new_challenge_4_mapped_route/live_variables.py":di,"../../../vendor/current/starters/new_challenge_4_mapped_route/main.py":fi,"../../../vendor/current/starters/new_challenge_4_mapped_route/navigation_controller.py":pi,"../../../vendor/current/starters/new_challenge_4_mapped_route/odometry.py":mi,"../../../vendor/current/starters/new_challenge_4_mapped_route/robot_config.py":hi,"../../../vendor/current/starters/new_challenge_4_mapped_route/route_validation.py":gi,"../../../vendor/current/starters/new_challenge_4_mapped_route/sensor_model.py":_i,"../../../vendor/current/starters/new_challenge_4_mapped_route/wheel_speed_controller.py":vi,"../../../vendor/current/starters/new_challenge_5_out_and_back/challenge.py":yi,"../../../vendor/current/starters/new_challenge_5_out_and_back/component_checks.py":bi,"../../../vendor/current/starters/new_challenge_5_out_and_back/course_setup.py":xi,"../../../vendor/current/starters/new_challenge_5_out_and_back/differential_drive.py":Si,"../../../vendor/current/starters/new_challenge_5_out_and_back/grid_planner.py":Ci,"../../../vendor/current/starters/new_challenge_5_out_and_back/live_variables.py":wi,"../../../vendor/current/starters/new_challenge_5_out_and_back/main.py":Ti,"../../../vendor/current/starters/new_challenge_5_out_and_back/mission_policy.py":Ei,"../../../vendor/current/starters/new_challenge_5_out_and_back/mission_steps.py":Di,"../../../vendor/current/starters/new_challenge_5_out_and_back/navigation_controller.py":Oi,"../../../vendor/current/starters/new_challenge_5_out_and_back/odometry.py":ki,"../../../vendor/current/starters/new_challenge_5_out_and_back/range_readout.py":Ai,"../../../vendor/current/starters/new_challenge_5_out_and_back/robot_config.py":ji,"../../../vendor/current/starters/new_challenge_5_out_and_back/sensor_model.py":Mi,"../../../vendor/current/starters/new_challenge_5_out_and_back/wheel_speed_controller.py":Ni}),...Object.assign({"../../../vendor/current/starters/challenge_1/README.md":Pi,"../../../vendor/current/starters/challenge_2/README.md":Fi,"../../../vendor/current/starters/challenge_3/README.md":Ii,"../../../vendor/current/starters/challenge_4/README.md":Li,"../../../vendor/current/starters/challenge_5/README.md":Ri,"../../../vendor/current/starters/challenge_6/README.md":zi,"../../../vendor/current/starters/challenge_7/README.md":Bi,"../../../vendor/current/starters/challenge_8/README.md":Vi,"../../../vendor/current/starters/challenge_9/README.md":Hi,"../../../vendor/current/starters/new_challenge_1_robot_curling/README.md":Ui,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/README.md":Wi,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/README.md":Gi,"../../../vendor/current/starters/new_challenge_4_mapped_route/README.md":Ki,"../../../vendor/current/starters/new_challenge_5_out_and_back/README.md":qi}),...Object.assign({"../../../vendor/current/starters/challenge_1/world.json":Ji,"../../../vendor/current/starters/challenge_2/world.json":Yi,"../../../vendor/current/starters/challenge_3/world.json":Xi,"../../../vendor/current/starters/challenge_4/world.json":Zi,"../../../vendor/current/starters/challenge_5/world.json":Qi,"../../../vendor/current/starters/challenge_6/world.json":$i,"../../../vendor/current/starters/challenge_7/world.json":ea,"../../../vendor/current/starters/challenge_8/world.json":ta,"../../../vendor/current/starters/challenge_9/world.json":na,"../../../vendor/current/starters/new_challenge_1_robot_curling/world.json":ra,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/world.json":ia,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/world.json":aa,"../../../vendor/current/starters/new_challenge_4_mapped_route/world.json":oa,"../../../vendor/current/starters/new_challenge_5_out_and_back/world.json":sa})},Xo={...Object.assign({"../../../vendor/current/templates/demo_manual_drive/course_setup.py":ca,"../../../vendor/current/templates/demo_manual_drive/live_variables.py":la,"../../../vendor/current/templates/demo_manual_drive/main.py":ua,"../../../vendor/current/templates/demo_manual_drive/robot_config.py":da,"../../../vendor/current/templates/demo_obstacle_turn/challenge.py":fa,"../../../vendor/current/templates/demo_obstacle_turn/course_setup.py":pa,"../../../vendor/current/templates/demo_obstacle_turn/live_variables.py":ma,"../../../vendor/current/templates/demo_obstacle_turn/main.py":ha,"../../../vendor/current/templates/demo_obstacle_turn/robot_config.py":ga,"../../../vendor/current/templates/demo_random_snake/challenge.py":_a,"../../../vendor/current/templates/demo_random_snake/course_setup.py":va,"../../../vendor/current/templates/demo_random_snake/live_variables.py":ya,"../../../vendor/current/templates/demo_random_snake/main.py":ba,"../../../vendor/current/templates/demo_random_snake/robot_config.py":xa,"../../../vendor/current/templates/demo_roomba/challenge.py":Sa,"../../../vendor/current/templates/demo_roomba/course_setup.py":Ca,"../../../vendor/current/templates/demo_roomba/live_variables.py":wa,"../../../vendor/current/templates/demo_roomba/main.py":Ta,"../../../vendor/current/templates/demo_roomba/robot_config.py":Ea,"../../../vendor/current/templates/demo_snake_game/challenge.py":Da,"../../../vendor/current/templates/demo_snake_game/course_setup.py":Oa,"../../../vendor/current/templates/demo_snake_game/live_variables.py":ka,"../../../vendor/current/templates/demo_snake_game/main.py":Aa,"../../../vendor/current/templates/demo_snake_game/robot_config.py":ja,"../../../vendor/current/templates/demo_snake_game/snake_config.py":Ma,"../../../vendor/current/templates/demo_snake_game/snake_food.py":Na,"../../../vendor/current/templates/demo_snake_game/snake_game.py":Pa,"../../../vendor/current/templates/demo_spiral/challenge.py":Fa,"../../../vendor/current/templates/demo_spiral/course_setup.py":Ia,"../../../vendor/current/templates/demo_spiral/live_variables.py":La,"../../../vendor/current/templates/demo_spiral/main.py":Ra,"../../../vendor/current/templates/demo_spiral/robot_config.py":za,"../../../vendor/current/templates/demo_ucsb_logo/challenge.py":Ba,"../../../vendor/current/templates/demo_ucsb_logo/course_setup.py":Va,"../../../vendor/current/templates/demo_ucsb_logo/live_variables.py":Ha,"../../../vendor/current/templates/demo_ucsb_logo/main.py":Ua,"../../../vendor/current/templates/demo_ucsb_logo/robot_config.py":Wa,"../../../vendor/current/templates/new_demo_motor_characterization/course_setup.py":Ga,"../../../vendor/current/templates/new_demo_motor_characterization/experiment.py":Ka,"../../../vendor/current/templates/new_demo_motor_characterization/live_variables.py":qa,"../../../vendor/current/templates/new_demo_motor_characterization/main.py":Ja,"../../../vendor/current/templates/new_demo_motor_characterization/robot_config.py":Ya,"../../../vendor/current/templates/tutorial_1_python_essentials/exercise_checks.py":Xa,"../../../vendor/current/templates/tutorial_1_python_essentials/main.py":Za,"../../../vendor/current/templates/tutorial_1_python_essentials/student_work.py":Qa,"../../../vendor/current/templates/tutorial_2_virtual_drawing/course_setup.py":$a,"../../../vendor/current/templates/tutorial_2_virtual_drawing/exercise_checks.py":eo,"../../../vendor/current/templates/tutorial_2_virtual_drawing/main.py":to,"../../../vendor/current/templates/tutorial_2_virtual_drawing/robot_config.py":no,"../../../vendor/current/templates/tutorial_2_virtual_drawing/student_work.py":ro,"../../../vendor/current/templates/tutorial_3_robot_programs/course_setup.py":io,"../../../vendor/current/templates/tutorial_3_robot_programs/exercise_checks.py":ao,"../../../vendor/current/templates/tutorial_3_robot_programs/main.py":oo,"../../../vendor/current/templates/tutorial_3_robot_programs/robot_config.py":so,"../../../vendor/current/templates/tutorial_3_robot_programs/student_work.py":co,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/course_setup.py":lo,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/exercise_checks.py":uo,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/live_variables.py":fo,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/main.py":po,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/robot_config.py":mo,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/student_work.py":ho,"../../../vendor/current/templates/tutorial_5_physical_preflight/course_setup.py":go,"../../../vendor/current/templates/tutorial_5_physical_preflight/exercise_checks.py":_o,"../../../vendor/current/templates/tutorial_5_physical_preflight/live_variables.py":vo,"../../../vendor/current/templates/tutorial_5_physical_preflight/main.py":yo,"../../../vendor/current/templates/tutorial_5_physical_preflight/robot_config.py":bo,"../../../vendor/current/templates/tutorial_5_physical_preflight/student_work.py":xo}),...Object.assign({"../../../vendor/current/templates/demo_manual_drive/README.md":So,"../../../vendor/current/templates/demo_obstacle_turn/README.md":Co,"../../../vendor/current/templates/demo_random_snake/README.md":wo,"../../../vendor/current/templates/demo_roomba/README.md":To,"../../../vendor/current/templates/demo_snake_game/README.md":Eo,"../../../vendor/current/templates/demo_spiral/README.md":Do,"../../../vendor/current/templates/demo_ucsb_logo/README.md":Oo,"../../../vendor/current/templates/new_demo_motor_characterization/README.md":ko,"../../../vendor/current/templates/tutorial_1_python_essentials/README.md":Ao,"../../../vendor/current/templates/tutorial_2_virtual_drawing/README.md":jo,"../../../vendor/current/templates/tutorial_3_robot_programs/README.md":Mo,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/README.md":No,"../../../vendor/current/templates/tutorial_5_physical_preflight/README.md":Po}),...Object.assign({"../../../vendor/current/templates/demo_manual_drive/world.json":Fo,"../../../vendor/current/templates/demo_obstacle_turn/world.json":Io,"../../../vendor/current/templates/demo_random_snake/world.json":Lo,"../../../vendor/current/templates/demo_roomba/world.json":Ro,"../../../vendor/current/templates/demo_snake_game/snake_config.json":zo,"../../../vendor/current/templates/demo_snake_game/world.json":Bo,"../../../vendor/current/templates/demo_spiral/world.json":Vo,"../../../vendor/current/templates/demo_ucsb_logo/world.json":Ho,"../../../vendor/current/templates/new_demo_motor_characterization/world.json":Uo,"../../../vendor/current/templates/tutorial_1_python_essentials/world.json":Wo,"../../../vendor/current/templates/tutorial_2_virtual_drawing/world.json":Go,"../../../vendor/current/templates/tutorial_3_robot_programs/world.json":Ko,"../../../vendor/current/templates/tutorial_4_behavior_telemetry/world.json":qo,"../../../vendor/current/templates/tutorial_5_physical_preflight/world.json":Jo})},Zo={},X=e.filter(e=>e.published);function Qo(e,t){let n=e.solution_stage;if(!n||n<1||n>5)throw Error(`${e.id} has no current challenge solution`);let r={...t};for(let[e,t]of Object.entries(Zo).sort()){let i=e.match(/\/code\/(\d+)[^/]*\/([^/]+)$/);if(!i||Number(i[1])>n)continue;let a=i[2];(a in r||n===5&&a===`range_estimation.py`)&&(r[a]=t)}return r[`course_setup.py`]=r[`course_setup.py`].replace(/^(USE_STUDENT_[A-Z_]+ = )False$/gm,`$1True`),n===4&&(r[`challenge.py`]=r[`challenge.py`].replace(`EXECUTE_ROUTE = False`,`EXECUTE_ROUTE = True`)),r}function Z(e){let t=`/${e.source}/`,n=e.source.startsWith(`starters/`)?Yo:Xo,r=Object.fromEntries(Object.entries(n).filter(([e])=>e.includes(t)).map(([e,n])=>[e.split(t)[1],n]));if(e.kind===`complete-challenge`&&Object.keys(Zo).length&&(r=Qo(e,r)),!(e.entrypoint in r)||Object.keys(r).length<2)throw Error(`${e.id} must contain a complete project`);return Object.freeze({name:e.short_label,entrypoint:e.entrypoint,files:Object.freeze(r)})}var $o=Object.freeze(X.filter(e=>e.kind===`challenge`).map(e=>Object.freeze({id:e.id,label:e.label,shortLabel:e.short_label,summary:e.summary,project:Z(e)}))),Q=[...X.map(e=>Object.freeze({id:e.id,kind:e.kind,group:e.group??`archived`,label:e.label,shortLabel:e.short_label,summary:e.summary,components:Object.freeze((e.components??[]).map(e=>Object.freeze({name:e.name,file:e.file,selectionFlag:e.selection_flag}))),project:Z(e)}))];function es(e){Zo=e??{};for(let e of X.filter(e=>e.kind===`complete-challenge`)){let t=Q.findIndex(t=>t.id===e.id),n=Q[t];Q[t]=Object.freeze({...n,project:Z(e)})}}$o[0].project;var ts=`demo_spiral`;function $(e){let t=Q.find(t=>t.id===e);if(!t)throw Error(`Unknown course project template '${e}'`);return t}function ns(e,t){if(!/^[A-Z][A-Z0-9_]*$/.test(t))throw Error(`Invalid component selection flag '${t}'`);let n=RegExp(`^(${t}\\s*=\\s*)False(\\s*)$`,`m`);if(!e.match(n))throw Error(`The next challenge does not declare ${t}`);return e.replace(n,`$1True$2`)}function rs(e,t){if(!/^[A-Z][A-Z0-9_]*$/.test(t))throw Error(`Invalid component selection flag '${t}'`);let n=RegExp(`^${t}\\s*=\\s*(True|False)\\s*$`,`m`),r=e.match(n);return r?r[1]===`True`:null}var is=new Set([`README.md`,`main.py`,`challenge.py`,`world.json`,`component_checks.py`]),as=new Set(X.flatMap(e=>e.components??[]).map(e=>e.file));function os(e,t,n){let r=RegExp(`^${t}\\s*=\\s*${n}\\(`,`m`).exec(e);if(!r)return null;let i=e.indexOf(`(`,r.index),a=0;for(let t=i;t<e.length;t+=1)if(e[t]===`(`&&(a+=1),e[t]===`)`&&(--a,a===0))return e.slice(r.index,t+1);throw Error(`${t} has an unterminated ${n}(...) value`)}function ss(e,t){let n=os(e,`ROBOT_CONFIG`,`RobotConfig`),r=os(t,`ROBOT_CONFIG`,`RobotConfig`);return n===null||r===null?t:t.replace(r,n)}function cs(e,t,n){let r=$(e),i=$(t);if(r.components.length===0||i.components.length===0)throw Error(`Project transitions require declared student components in both projects`);if(e===t)throw Error(`Choose a different challenge project`);let a={...i.project.files},o=new Set,s=new Set,c=new Set,l=new Set,u=new Set,d=a[`course_setup.py`],f=n.files[`course_setup.py`];if(d===void 0)throw Error(`${i.label} does not contain course_setup.py`);if(f===void 0)throw Error(`The current challenge does not contain course_setup.py`);let p=new Set(i.components.map(e=>e.file));for(let[e,t]of Object.entries(n.files))if(!(e===`course_setup.py`||is.has(e))){if(as.has(e)&&!p.has(e)){u.add(e);continue}if(e===`robot_config.py`&&a[e]!==void 0){a[e]=ss(t,a[e]),s.add(e);continue}a[e]=t,o.add(e)}for(let e of i.components){let t=n.files[e.file];t!==void 0&&(a[e.file]=t,o.add(e.file)),rs(f,e.selectionFlag)&&(d=ns(d,e.selectionFlag))}a[`course_setup.py`]=d;for(let e of Object.keys(a))o.has(e)||s.has(e)||(e===`course_setup.py`||e in n.files?c.add(e):l.add(e));return{project:{name:i.project.name,entrypoint:i.project.entrypoint,files:a},preserve:Object.freeze([...o].sort()),merge:Object.freeze([...s].sort()),replace:Object.freeze([...c].sort()),add:Object.freeze([...l].sort()),omit:Object.freeze([...u].sort())}}var ls=$(ts).project;export{te as A,fe as C,ue as D,ie as E,ee as O,de as S,ne as T,L as _,cs as a,N as b,oa as c,ra as d,It as f,F as g,kt as h,$ as i,a as j,m as k,aa as l,Pt as m,ls as n,es as o,Ft as p,ts as r,sa as s,Q as t,ia as u,Dt as v,pe as w,E as x,P as y};