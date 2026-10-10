import{n as e}from"./rolldown-runtime-CbXtAM7H.js";function t(e){try{let t=typeof e==`string`?e:JSON.stringify(e);if(!t||t.length>512e3)return null;let n=JSON.parse(t);if(n?.schema_version!==1||typeof n.complete!=`boolean`||![`running`,`passed`,`failed`,`not_implemented`,`setup_error`].includes(n.status)||!Array.isArray(n.cases)||n.cases.length>100||![n.last_started_case,n.last_completed_case].every(e=>e===null||typeof e==`string`)||!n.counts||![`passed`,`failed`,`not_implemented`,`not_run`].every(e=>{let t=n.counts[e];return Number.isSafeInteger(t)&&t>=0}))return null;let r=new Set;for(let e of n.cases){if(!e||typeof e.id!=`string`||r.has(e.id)||typeof e.contract!=`string`||![`running`,`passed`,`failed`,`not_implemented`,`not_run`].includes(e.status)||typeof e.source?.file!=`string`||typeof e.source.method!=`string`||typeof e.role!=`string`||typeof e.message!=`string`||!Array.isArray(e.inputs)||!Array.isArray(e.observations))return null;r.add(e.id)}if(n.complete&&n.status!==`setup_error`){for(let e of[`passed`,`failed`,`not_implemented`,`not_run`])if(n.counts[e]!==n.cases.filter(t=>t.status===e).length)return null;if(n.cases.some(e=>e.status===`running`)||n.counts.not_run>0||n.cases.length===0||n.status!==(n.counts.failed?`failed`:n.counts.not_implemented?`not_implemented`:`passed`))return null}return n}catch{return null}}async function n(t={}){var n;(function(){function e(e){for(var t=(e=e.split(`-`)[0]).split(`.`).slice(0,3);t.length<3;)t.push(`00`);return(t=t.map((e,t,n)=>e.padStart(2,`0`))).join(``)}var t=e=>[e/1e4|0,(e/100|0)%100,e%100].join(`.`),n=typeof process<`u`&&process.versions?.node?e(process.versions.node):2147483647;if(n<16e4)throw Error(`This emscripten-generated code requires node v${t(16e4)} (detected v${t(n)})`);var r=typeof navigator<`u`&&navigator.userAgent;if(r){var i=r.includes(`Safari/`)&&!r.includes(`Chrome/`)&&r.match(/Version\/(\d+\.?\d*\.?\d*)/)?e(r.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]):2147483647;if(i<15e4)throw Error(`This emscripten-generated code requires Safari v${t(15e4)} (detected v${i})`);var a=r.match(/Firefox\/(\d+(?:\.\d+)?)/)?parseFloat(r.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]):2147483647;if(a<79)throw Error(`This emscripten-generated code requires Firefox v79 (detected v${a})`);var o=r.match(/Chrome\/(\d+(?:\.\d+)?)/)?parseFloat(r.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]):2147483647;if(o<85)throw Error(`This emscripten-generated code requires Chrome v85 (detected v${o})`)}})();var r=t,a=!!globalThis.window,o=!!globalThis.WorkerGlobalScope,l=globalThis.process?.versions?.node&&globalThis.process?.type!=`renderer`,p=!a&&!l&&!o;if(l){let{createRequire:t}=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1));var m=t(import.meta.url)}var h,g,_=import.meta.url,v=``;if(l){if(!(globalThis.process?.versions?.node&&globalThis.process?.type!=`renderer`))throw Error(`not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)`);var y=m("node:fs");_.startsWith(`file:`)&&(v=m("node:path").dirname(m("node:url").fileURLToPath(_))+`/`),g=e=>{e=T(e)?new URL(e):e;var t=y.readFileSync(e);return w(Buffer.isBuffer(t)),t},h=async(e,t=!0)=>{e=T(e)?new URL(e):e;var n=y.readFileSync(e,t?void 0:`utf8`);return w(t?Buffer.isBuffer(n):typeof n==`string`),n},process.argv.length>1&&process.argv[1].replace(/\\/g,`/`),process.argv.slice(2)}else if(!p){if(!a&&!o)throw Error(`environment detection error`);try{v=new URL(`.`,_).href}catch{}if(!globalThis.window&&!globalThis.WorkerGlobalScope)throw Error(`not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)`);o&&(g=e=>{var t=new XMLHttpRequest;return t.open(`GET`,e,!1),t.responseType=`arraybuffer`,t.send(null),new Uint8Array(t.response)}),h=async e=>{if(T(e))return new Promise((t,n)=>{var r=new XMLHttpRequest;r.open(`GET`,e,!0),r.responseType=`arraybuffer`,r.onload=()=>{r.status==200||r.status==0&&r.response?t(r.response):n(r.status)},r.onerror=n,r.send(null)});var t=await fetch(e,{credentials:`same-origin`});if(t.ok)return t.arrayBuffer();throw Error(t.status+` : `+t.url)}}var b,x=console.log.bind(console),S=console.error.bind(console);w(!p,"shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable."),globalThis.WebAssembly||S(`no native wasm support detected`);var C=!1;function w(e,t){e||P(`Assertion failed`+(t?`: `+t:``))}var T=e=>e.startsWith(`file://`);function ee(){if(!C){var e=X();e==0&&(e+=4);var t=A[e>>2],n=A[e+4>>2];t==34821223&&n==2310721022||P(`Stack overflow! Stack cookie has been overwritten at ${xe(e)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${xe(n)} ${xe(t)}`),A[0]!=1668509029&&P(`Runtime error: The application has corrupted its heap memory area (address zero)!`)}}var E,te,ne,re,D,ie,O,k,A,ae,oe,j;function se(e){Object.getOwnPropertyDescriptor(r,e)||Object.defineProperty(r,e,{configurable:!0,set(){P(`Attempt to set \`Module.${e}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`)}})}function M(e){return()=>w(!1,`call to '${e}' via reference taken before Wasm module initialization`)}function ce(e){Object.getOwnPropertyDescriptor(r,e)&&P(`\`Module.${e}\` was supplied but \`${e}\` not included in INCOMING_MODULE_JS_API`)}function le(e){Object.getOwnPropertyDescriptor(r,e)||Object.defineProperty(r,e,{configurable:!0,get(){var t,n=`'${e}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;((t=e)===`FS_createPath`||t===`FS_createDataFile`||t===`FS_createPreloadedFile`||t===`FS_preloadFile`||t===`FS_unlink`||t===`addRunDependency`||t===`FS_createLazyFile`||t===`FS_createDevice`||t===`removeRunDependency`)&&(n+=`. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you`),P(n)}})}E=new Int16Array(1),te=new Int8Array(E.buffer),E[0]=25459,te[0]===115&&te[1]===99||P(`Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)`);var ue,N=!1;function de(){var e=Je.buffer;D=new Int8Array(e),O=new Int16Array(e),r.HEAPU8=ie=new Uint8Array(e),new Uint16Array(e),k=new Int32Array(e),A=new Uint32Array(e),ae=new Float32Array(e),oe=new Float64Array(e),j=new BigInt64Array(e),new BigUint64Array(e)}function P(e){r.onAbort?.(e),S(e=`Aborted(`+e+`)`),C=!0;var t=new WebAssembly.RuntimeError(e);throw re?.(t),t}function F(e,t){return(...n)=>{w(N,`native function \`${e}\` called before runtime initialization`);var r=Ze[e];return w(r,`exported native function \`${e}\` not found`),w(n.length<=t,`native function \`${e}\` called with ${n.length} args but expects ${t}`),r(...n)}}function fe(){return r.locateFile?(e=`micropython.wasm`,r.locateFile?r.locateFile(e,v):v+e):new URL(`/ucsbxrp/assets/micropython-DXFUqjrr.wasm`,``+import.meta.url).href;var e}async function pe(e){if(!b)try{var t=await h(e);return new Uint8Array(t)}catch{}return function(e){if(e==ue&&b)return new Uint8Array(b);if(g)return g(e);throw`both async and sync fetching of the wasm failed`}(e)}async function me(e,t,n){if(!e&&!T(t)&&!l)try{var r=fetch(t,{credentials:`same-origin`});return await WebAssembly.instantiateStreaming(r,n)}catch(e){S(`wasm streaming compile failed: ${e}`),S(`falling back to ArrayBuffer instantiation`)}return async function(e,t){try{var n=await pe(e);return await WebAssembly.instantiate(n,t)}catch(t){S(`failed to asynchronously prepare wasm: ${t}`),T(e)&&S(`warning: Loading from a file URI (${e}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`),P(t)}}(t,n)}w(globalThis.Int32Array&&globalThis.Float64Array&&Int32Array.prototype.subarray&&Int32Array.prototype.set,`JS engine does not provide full typed array support`);var he=e=>{for(;e.length>0;)e.shift()(r)},ge=[],_e=e=>ge.push(e),ve=[],ye=e=>ve.push(e);function be(e,t=`i8`){switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:case`i8`:return D[e];case`i16`:return O[e>>1];case`i32`:return k[e>>2];case`i64`:return j[e>>3];case`float`:return ae[e>>2];case`double`:return oe[e>>3];case`*`:return A[e>>2];default:P(`invalid type for getValue: ${t}`)}}var xe=e=>(w(typeof e==`number`,`ptrToString expects a number, got `+typeof e),`0x`+(e>>>=0).toString(16).padStart(8,`0`)),I=e=>Ge(e),L=()=>qe(),R=e=>{R.shown||={},R.shown[e]||(R.shown[e]=1,l&&(e=`warning: `+e),S(e))},z={isAbs:e=>e.charAt(0)===`/`,splitPath:e=>/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1),normalizeArray:(e,t)=>{for(var n=0,r=e.length-1;r>=0;r--){var i=e[r];i===`.`?e.splice(r,1):i===`..`?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n;n--)e.unshift(`..`);return e},normalize:e=>{var t=z.isAbs(e),n=e.slice(-1)===`/`;return(e=z.normalizeArray(e.split(`/`).filter(e=>!!e),!t).join(`/`))||t||(e=`.`),e&&n&&(e+=`/`),(t?`/`:``)+e},dirname:e=>{var t=z.splitPath(e),n=t[0],r=t[1];return n||r?(r&&=r.slice(0,-1),n+r):`.`},basename:e=>e&&e.match(/([^\/]+|\/)\/*$/)[1],join:(...e)=>z.normalize(e.join(`/`)),join2:(e,t)=>z.normalize(e+`/`+t)},Se=e=>{(Se=(()=>{if(l){var e=m("node:crypto");return t=>e.randomFillSync(t)}return e=>crypto.getRandomValues(e)})())(e)},B={resolve:(...e)=>{for(var t=``,n=!1,r=e.length-1;r>=-1&&!n;r--){var i=r>=0?e[r]:q.cwd();if(typeof i!=`string`)throw TypeError(`Arguments to path.resolve must be strings`);if(!i)return``;t=i+`/`+t,n=z.isAbs(i)}return(n?`/`:``)+(t=z.normalizeArray(t.split(`/`).filter(e=>!!e),!n).join(`/`))||`.`},relative:(e,t)=>{function n(e){for(var t=0;t<e.length&&e[t]===``;t++);for(var n=e.length-1;n>=0&&e[n]===``;n--);return t>n?[]:e.slice(t,n-t+1)}e=B.resolve(e).slice(1),t=B.resolve(t).slice(1);for(var r=n(e.split(`/`)),i=n(t.split(`/`)),a=Math.min(r.length,i.length),o=a,s=0;s<a;s++)if(r[s]!==i[s]){o=s;break}var c=[];for(s=o;s<r.length;s++)c.push(`..`);return(c=c.concat(i.slice(o))).join(`/`)}},Ce=globalThis.TextDecoder&&new TextDecoder,V=(e,t=0,n,r)=>{var i=((e,t,n,r)=>{var i=t+n;if(r)return i;for(;e[t]&&!(t>=i);)++t;return t})(e,t,n,r);if(i-t>16&&e.buffer&&Ce)return Ce.decode(e.subarray(t,i));for(var a=``;t<i;){var o=e[t++];if(128&o){var s=63&e[t++];if((224&o)!=192){var c=63&e[t++];if((240&o)==224?o=(15&o)<<12|s<<6|c:((248&o)!=240&&R(`Invalid UTF-8 leading byte `+xe(o)+` encountered when deserializing a UTF-8 string in wasm memory to a JS string!`),o=(7&o)<<18|s<<12|c<<6|63&e[t++]),o<65536)a+=String.fromCharCode(o);else{var l=o-65536;a+=String.fromCharCode(55296|l>>10,56320|1023&l)}}else a+=String.fromCharCode((31&o)<<6|s)}else a+=String.fromCharCode(o)}return a},we=[],Te=e=>{for(var t=0,n=0;n<e.length;++n){var r=e.charCodeAt(n);r<=127?t++:r<=2047?t+=2:r>=55296&&r<=57343?(t+=4,++n):t+=3}return t},Ee=(e,t,n,r)=>{if(w(typeof e==`string`,`stringToUTF8Array expects a string (got ${typeof e})`),!(r>0))return 0;for(var i=n,a=n+r-1,o=0;o<e.length;++o){var s=e.codePointAt(o);if(s<=127){if(n>=a)break;t[n++]=s}else if(s<=2047){if(n+1>=a)break;t[n++]=192|s>>6,t[n++]=128|63&s}else if(s<=65535){if(n+2>=a)break;t[n++]=224|s>>12,t[n++]=128|s>>6&63,t[n++]=128|63&s}else{if(n+3>=a)break;s>1114111&&R(`Invalid Unicode code point `+xe(s)+` encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`),t[n++]=240|s>>18,t[n++]=128|s>>12&63,t[n++]=128|s>>6&63,t[n++]=128|63&s,o++}}return t[n]=0,n-i},De=(e,t,n)=>{var r=n>0?n:Te(e)+1,i=Array(r),a=Ee(e,i,0,i.length);return t&&(i.length=a),i},H={ttys:[],init(){},shutdown(){},register(e,t){H.ttys[e]={input:[],output:[],ops:t},q.registerDevice(e,H.stream_ops)},stream_ops:{open(e){var t=H.ttys[e.node.rdev];if(!t)throw new q.ErrnoError(43);e.tty=t,e.seekable=!1},close(e){e.tty.ops.fsync(e.tty)},fsync(e){e.tty.ops.fsync(e.tty)},read(e,t,n,r,i){if(!e.tty||!e.tty.ops.get_char)throw new q.ErrnoError(60);for(var a=0,o=0;o<r;o++){var s;try{s=e.tty.ops.get_char(e.tty)}catch{throw new q.ErrnoError(29)}if(s===void 0&&a===0)throw new q.ErrnoError(6);if(s==null)break;a++,t[n+o]=s}return a&&(e.node.atime=Date.now()),a},write(e,t,n,r,i){if(!e.tty||!e.tty.ops.put_char)throw new q.ErrnoError(60);try{for(var a=0;a<r;a++)e.tty.ops.put_char(e.tty,t[n+a])}catch{throw new q.ErrnoError(29)}return r&&(e.node.mtime=e.node.ctime=Date.now()),a}},default_tty_ops:{get_char:e=>(()=>{if(!we.length){var e=null;if(l){var t=Buffer.alloc(256),n=0,r=process.stdin.fd;try{n=y.readSync(r,t,0,256)}catch(e){if(!e.toString().includes(`EOF`))throw e;n=0}n>0&&(e=t.slice(0,n).toString(`utf-8`))}else globalThis.window?.prompt&&(e=window.prompt(`Input: `))!==null&&(e+=`
`);if(!e)return null;we=De(e,!0)}return we.shift()})(),put_char(e,t){t===null||t===10?(x(V(e.output)),e.output=[]):t!=0&&e.output.push(t)},fsync(e){e.output?.length>0&&(x(V(e.output)),e.output=[])},ioctl_tcgets:e=>({c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}),ioctl_tcsets:(e,t,n)=>0,ioctl_tiocgwinsz:e=>[24,80]},default_tty1_ops:{put_char(e,t){t===null||t===10?(S(V(e.output)),e.output=[]):t!=0&&e.output.push(t)},fsync(e){e.output?.length>0&&(S(V(e.output)),e.output=[])}}},Oe=e=>{P("internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported")},U={ops_table:null,mount:e=>U.createNode(null,`/`,16895,0),createNode(e,t,n,r){if(q.isBlkdev(n)||q.isFIFO(n))throw new q.ErrnoError(63);U.ops_table||={dir:{node:{getattr:U.node_ops.getattr,setattr:U.node_ops.setattr,lookup:U.node_ops.lookup,mknod:U.node_ops.mknod,rename:U.node_ops.rename,unlink:U.node_ops.unlink,rmdir:U.node_ops.rmdir,readdir:U.node_ops.readdir,symlink:U.node_ops.symlink},stream:{llseek:U.stream_ops.llseek}},file:{node:{getattr:U.node_ops.getattr,setattr:U.node_ops.setattr},stream:{llseek:U.stream_ops.llseek,read:U.stream_ops.read,write:U.stream_ops.write,mmap:U.stream_ops.mmap,msync:U.stream_ops.msync}},link:{node:{getattr:U.node_ops.getattr,setattr:U.node_ops.setattr,readlink:U.node_ops.readlink},stream:{}},chrdev:{node:{getattr:U.node_ops.getattr,setattr:U.node_ops.setattr},stream:q.chrdev_stream_ops}};var i=q.createNode(e,t,n,r);return q.isDir(i.mode)?(i.node_ops=U.ops_table.dir.node,i.stream_ops=U.ops_table.dir.stream,i.contents={}):q.isFile(i.mode)?(i.node_ops=U.ops_table.file.node,i.stream_ops=U.ops_table.file.stream,i.usedBytes=0,i.contents=null):q.isLink(i.mode)?(i.node_ops=U.ops_table.link.node,i.stream_ops=U.ops_table.link.stream):q.isChrdev(i.mode)&&(i.node_ops=U.ops_table.chrdev.node,i.stream_ops=U.ops_table.chrdev.stream),i.atime=i.mtime=i.ctime=Date.now(),e&&(e.contents[t]=i,e.atime=e.mtime=e.ctime=i.atime),i},getFileDataAsTypedArray:e=>e.contents?e.contents.subarray?e.contents.subarray(0,e.usedBytes):new Uint8Array(e.contents):new Uint8Array,expandFileStorage(e,t){var n=e.contents?e.contents.length:0;if(!(n>=t)){t=Math.max(t,n*(n<1048576?2:1.125)>>>0),n!=0&&(t=Math.max(t,256));var r=e.contents;e.contents=new Uint8Array(t),e.usedBytes>0&&e.contents.set(r.subarray(0,e.usedBytes),0)}},resizeFileStorage(e,t){if(e.usedBytes!=t)if(t==0)e.contents=null,e.usedBytes=0;else{var n=e.contents;e.contents=new Uint8Array(t),n&&e.contents.set(n.subarray(0,Math.min(t,e.usedBytes))),e.usedBytes=t}},node_ops:{getattr(e){var t={};return t.dev=q.isChrdev(e.mode)?e.id:1,t.ino=e.id,t.mode=e.mode,t.nlink=1,t.uid=0,t.gid=0,t.rdev=e.rdev,t.size=q.isDir(e.mode)?4096:q.isFile(e.mode)?e.usedBytes:q.isLink(e.mode)?e.link.length:0,t.atime=new Date(e.atime),t.mtime=new Date(e.mtime),t.ctime=new Date(e.ctime),t.blksize=4096,t.blocks=Math.ceil(t.size/t.blksize),t},setattr(e,t){for(let n of[`mode`,`atime`,`mtime`,`ctime`])t[n]!=null&&(e[n]=t[n]);t.size!==void 0&&U.resizeFileStorage(e,t.size)},lookup(e,t){throw new q.ErrnoError(44)},mknod:(e,t,n,r)=>U.createNode(e,t,n,r),rename(e,t,n){var r;try{r=q.lookupNode(t,n)}catch{}if(r){if(q.isDir(e.mode))for(var i in r.contents)throw new q.ErrnoError(55);q.hashRemoveNode(r)}delete e.parent.contents[e.name],t.contents[n]=e,e.name=n,t.ctime=t.mtime=e.parent.ctime=e.parent.mtime=Date.now()},unlink(e,t){delete e.contents[t],e.ctime=e.mtime=Date.now()},rmdir(e,t){for(var n in q.lookupNode(e,t).contents)throw new q.ErrnoError(55);delete e.contents[t],e.ctime=e.mtime=Date.now()},readdir:e=>[`.`,`..`,...Object.keys(e.contents)],symlink(e,t,n){var r=U.createNode(e,t,41471,0);return r.link=n,r},readlink(e){if(!q.isLink(e.mode))throw new q.ErrnoError(28);return e.link}},stream_ops:{read(e,t,n,r,i){var a=e.node.contents;if(i>=e.node.usedBytes)return 0;var o=Math.min(e.node.usedBytes-i,r);if(w(o>=0),o>8&&a.subarray)t.set(a.subarray(i,i+o),n);else for(var s=0;s<o;s++)t[n+s]=a[i+s];return o},write(e,t,n,r,i,a){if(w(!(t instanceof ArrayBuffer)),t.buffer===D.buffer&&(a=!1),!r)return 0;var o=e.node;if(o.mtime=o.ctime=Date.now(),t.subarray&&(!o.contents||o.contents.subarray)){if(a)return w(i===0,`canOwn must imply no weird position inside the file`),o.contents=t.subarray(n,n+r),o.usedBytes=r,r;if(o.usedBytes===0&&i===0)return o.contents=t.slice(n,n+r),o.usedBytes=r,r;if(i+r<=o.usedBytes)return o.contents.set(t.subarray(n,n+r),i),r}if(U.expandFileStorage(o,i+r),o.contents.subarray&&t.subarray)o.contents.set(t.subarray(n,n+r),i);else for(var s=0;s<r;s++)o.contents[i+s]=t[n+s];return o.usedBytes=Math.max(o.usedBytes,i+r),r},llseek(e,t,n){var r=t;if(n===1?r+=e.position:n===2&&q.isFile(e.node.mode)&&(r+=e.node.usedBytes),r<0)throw new q.ErrnoError(28);return r},mmap(e,t,n,r,i){if(!q.isFile(e.node.mode))throw new q.ErrnoError(43);var a,o,s=e.node.contents;if(2&i||!s||s.buffer!==D.buffer){if(o=!0,!(a=Oe()))throw new q.ErrnoError(48);s&&((n>0||n+t<s.length)&&(s=s.subarray?s.subarray(n,n+t):Array.prototype.slice.call(s,n,n+t)),D.set(s,a))}else o=!1,a=s.byteOffset;return{ptr:a,allocated:o}},msync:(e,t,n,r,i)=>(U.stream_ops.write(e,t,0,r,n,!1),0)}},ke=(e,t)=>{var n=0;return e&&(n|=365),t&&(n|=146),n},W=(e,t,n)=>(w(typeof e==`number`,`UTF8ToString expects a number (got ${typeof e})`),e?V(ie,e,t,n):``),Ae={EPERM:63,ENOENT:44,ESRCH:71,EINTR:27,EIO:29,ENXIO:60,E2BIG:1,ENOEXEC:45,EBADF:8,ECHILD:12,EAGAIN:6,EWOULDBLOCK:6,ENOMEM:48,EACCES:2,EFAULT:21,ENOTBLK:105,EBUSY:10,EEXIST:20,EXDEV:75,ENODEV:43,ENOTDIR:54,EISDIR:31,EINVAL:28,ENFILE:41,EMFILE:33,ENOTTY:59,ETXTBSY:74,EFBIG:22,ENOSPC:51,ESPIPE:70,EROFS:69,EMLINK:34,EPIPE:64,EDOM:18,ERANGE:68,ENOMSG:49,EIDRM:24,ECHRNG:106,EL2NSYNC:156,EL3HLT:107,EL3RST:108,ELNRNG:109,EUNATCH:110,ENOCSI:111,EL2HLT:112,EDEADLK:16,ENOLCK:46,EBADE:113,EBADR:114,EXFULL:115,ENOANO:104,EBADRQC:103,EBADSLT:102,EDEADLOCK:16,EBFONT:101,ENOSTR:100,ENODATA:116,ETIME:117,ENOSR:118,ENONET:119,ENOPKG:120,EREMOTE:121,ENOLINK:47,EADV:122,ESRMNT:123,ECOMM:124,EPROTO:65,EMULTIHOP:36,EDOTDOT:125,EBADMSG:9,ENOTUNIQ:126,EBADFD:127,EREMCHG:128,ELIBACC:129,ELIBBAD:130,ELIBSCN:131,ELIBMAX:132,ELIBEXEC:133,ENOSYS:52,ENOTEMPTY:55,ENAMETOOLONG:37,ELOOP:32,EOPNOTSUPP:138,EPFNOSUPPORT:139,ECONNRESET:15,ENOBUFS:42,EAFNOSUPPORT:5,EPROTOTYPE:67,ENOTSOCK:57,ENOPROTOOPT:50,ESHUTDOWN:140,ECONNREFUSED:14,EADDRINUSE:3,ECONNABORTED:13,ENETUNREACH:40,ENETDOWN:38,ETIMEDOUT:73,EHOSTDOWN:142,EHOSTUNREACH:23,EINPROGRESS:26,EALREADY:7,EDESTADDRREQ:17,EMSGSIZE:35,EPROTONOSUPPORT:66,ESOCKTNOSUPPORT:137,EADDRNOTAVAIL:4,ENETRESET:39,EISCONN:30,ENOTCONN:53,ETOOMANYREFS:141,EUSERS:136,EDQUOT:19,ESTALE:72,ENOTSUP:138,ENOMEDIUM:148,EILSEQ:25,EOVERFLOW:61,ECANCELED:11,ENOTRECOVERABLE:56,EOWNERDEAD:62,ESTRPIPE:135},G=0,je=null,Me={},K=null,Ne=[],Pe=async(e,t,n,i,a,o,s,c)=>{var l,u=t?B.resolve(z.join2(e,t)):e,d=(e=>{for(var t=e;;){if(!Me[e])return e;e=t+Math.random()}})(`cp ${u}`);l=d,G++,r.monitorRunDependencies?.(G),w(l,`addRunDependency requires an ID`),w(!Me[l]),Me[l]=1,K===null&&globalThis.setInterval&&(K=setInterval(()=>{if(C)return clearInterval(K),void(K=null);var e=!1;for(var t in Me)e||(e=!0,S(`still waiting on run dependencies:`)),S(`dependency: ${t}`);e&&S(`(end of list)`)},1e4),K.unref?.());try{var f=n;typeof n==`string`&&(f=await(async e=>{var t=await h(e);return w(t,`Loading data file "${e}" failed (no arrayBuffer).`),new Uint8Array(t)})(n)),f=await(async(e,t)=>{for(var n of(typeof Browser<`u`&&Browser.init(),Ne))if(n.canHandle(t))return w(n.handle.constructor.name===`AsyncFunction`,`Filesystem plugin handlers must be async functions (See #24914)`),n.handle(e,t);return e})(f,u),c?.(),o||((...e)=>{q.createDataFile(...e)})(e,t,f,i,a,s)}finally{(e=>{if(G--,r.monitorRunDependencies?.(G),w(e,`removeRunDependency requires an ID`),w(Me[e]),delete Me[e],G==0&&(K!==null&&(clearInterval(K),K=null),je)){var t=je;je=null,t()}})(d)}},q={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:`/`,initialized:!1,ignorePermissions:!0,filesystems:null,syncFSRequests:0,ErrnoError:class extends Error{name=`ErrnoError`;constructor(e){for(var t in super(N?(e=>W(Ue(e)))(e):``),this.errno=e,Ae)if(Ae[t]===e){this.code=t;break}}},FSStream:class{shared={};get object(){return this.node}set object(e){this.node=e}get isRead(){return(2097155&this.flags)!=1}get isWrite(){return!!(2097155&this.flags)}get isAppend(){return 1024&this.flags}get flags(){return this.shared.flags}set flags(e){this.shared.flags=e}get position(){return this.shared.position}set position(e){this.shared.position=e}},FSNode:class{node_ops={};stream_ops={};readMode=365;writeMode=146;mounted=null;constructor(e,t,n,r){e||=this,this.parent=e,this.mount=e.mount,this.id=q.nextInode++,this.name=t,this.mode=n,this.rdev=r,this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(e){e?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(e){e?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return q.isDir(this.mode)}get isDevice(){return q.isChrdev(this.mode)}},lookupPath(e,t={}){if(!e)throw new q.ErrnoError(44);t.follow_mount??=!0,z.isAbs(e)||(e=q.cwd()+`/`+e);linkloop:for(var n=0;n<40;n++){for(var r=e.split(`/`).filter(e=>!!e),i=q.root,a=`/`,o=0;o<r.length;o++){var s=o===r.length-1;if(s&&t.parent)break;if(r[o]!==`.`)if(r[o]!==`..`){a=z.join2(a,r[o]);try{i=q.lookupNode(i,r[o])}catch(e){if(e?.errno===44&&s&&t.noent_okay)return{path:a};throw e}if(!q.isMountpoint(i)||s&&!t.follow_mount||(i=i.mounted.root),q.isLink(i.mode)&&(!s||t.follow)){if(!i.node_ops.readlink)throw new q.ErrnoError(52);var c=i.node_ops.readlink(i);z.isAbs(c)||(c=z.dirname(a)+`/`+c),e=c+`/`+r.slice(o+1).join(`/`);continue linkloop}}else{if(a=z.dirname(a),q.isRoot(i)){e=a+`/`+r.slice(o+1).join(`/`),n--;continue linkloop}i=i.parent}}return{path:a,node:i}}throw new q.ErrnoError(32)},getPath(e){for(var t;;){if(q.isRoot(e)){var n=e.mount.mountpoint;return t?n[n.length-1]===`/`?n+t:`${n}/${t}`:n}t=t?`${e.name}/${t}`:e.name,e=e.parent}},hashName(e,t){for(var n=0,r=0;r<t.length;r++)n=(n<<5)-n+t.charCodeAt(r)|0;return(e+n>>>0)%q.nameTable.length},hashAddNode(e){var t=q.hashName(e.parent.id,e.name);e.name_next=q.nameTable[t],q.nameTable[t]=e},hashRemoveNode(e){var t=q.hashName(e.parent.id,e.name);if(q.nameTable[t]===e)q.nameTable[t]=e.name_next;else for(var n=q.nameTable[t];n;){if(n.name_next===e){n.name_next=e.name_next;break}n=n.name_next}},lookupNode(e,t){var n=q.mayLookup(e);if(n)throw new q.ErrnoError(n);for(var r=q.hashName(e.id,t),i=q.nameTable[r];i;i=i.name_next){var a=i.name;if(i.parent.id===e.id&&a===t)return i}return q.lookup(e,t)},createNode(e,t,n,r){w(typeof e==`object`);var i=new q.FSNode(e,t,n,r);return q.hashAddNode(i),i},destroyNode(e){q.hashRemoveNode(e)},isRoot:e=>e===e.parent,isMountpoint:e=>!!e.mounted,isFile:e=>(61440&e)==32768,isDir:e=>(61440&e)==16384,isLink:e=>(61440&e)==40960,isChrdev:e=>(61440&e)==8192,isBlkdev:e=>(61440&e)==24576,isFIFO:e=>(61440&e)==4096,isSocket:e=>!(49152&~e),flagsToPermissionString(e){var t=[`r`,`w`,`rw`][3&e];return 512&e&&(t+=`w`),t},nodePermissions:(e,t)=>q.ignorePermissions||(!t.includes(`r`)||292&e.mode)&&(!t.includes(`w`)||146&e.mode)&&(!t.includes(`x`)||73&e.mode)?0:2,mayLookup(e){return q.isDir(e.mode)?q.nodePermissions(e,`x`)||(e.node_ops.lookup?0:2):54},mayCreate(e,t){if(!q.isDir(e.mode))return 54;try{return q.lookupNode(e,t),20}catch{}return q.nodePermissions(e,`wx`)},mayDelete(e,t,n){var r;try{r=q.lookupNode(e,t)}catch(e){return e.errno}var i=q.nodePermissions(e,`wx`);if(i)return i;if(n){if(!q.isDir(r.mode))return 54;if(q.isRoot(r)||q.getPath(r)===q.cwd())return 10}else if(q.isDir(r.mode))return 31;return 0},mayOpen(e,t){if(!e)return 44;if(q.isLink(e.mode))return 32;var n=q.flagsToPermissionString(t);return q.isDir(e.mode)&&(n!==`r`||576&t)?31:q.nodePermissions(e,n)},checkOpExists(e,t){if(!e)throw new q.ErrnoError(t);return e},MAX_OPEN_FDS:4096,nextfd(){for(var e=0;e<=q.MAX_OPEN_FDS;e++)if(!q.streams[e])return e;throw new q.ErrnoError(33)},getStreamChecked(e){var t=q.getStream(e);if(!t)throw new q.ErrnoError(8);return t},getStream:e=>q.streams[e],createStream:(e,t=-1)=>(w(t>=-1),e=Object.assign(new q.FSStream,e),t==-1&&(t=q.nextfd()),e.fd=t,q.streams[t]=e,e),closeStream(e){q.streams[e]=null},dupStream(e,t=-1){var n=q.createStream(e,t);return n.stream_ops?.dup?.(n),n},doSetAttr(e,t,n){var r=e?.stream_ops.setattr,i=r?e:t;r??=t.node_ops.setattr,q.checkOpExists(r,63),r(i,n)},chrdev_stream_ops:{open(e){e.stream_ops=q.getDevice(e.node.rdev).stream_ops,e.stream_ops.open?.(e)},llseek(){throw new q.ErrnoError(70)}},major:e=>e>>8,minor:e=>255&e,makedev:(e,t)=>e<<8|t,registerDevice(e,t){q.devices[e]={stream_ops:t}},getDevice:e=>q.devices[e],getMounts(e){for(var t=[],n=[e];n.length;){var r=n.pop();t.push(r),n.push(...r.mounts)}return t},syncfs(e,t){typeof e==`function`&&(t=e,e=!1),q.syncFSRequests++,q.syncFSRequests>1&&S(`warning: ${q.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);var n=q.getMounts(q.root.mount),r=0;function i(e){return w(q.syncFSRequests>0),q.syncFSRequests--,t(e)}function a(e){if(e)return a.errored?void 0:(a.errored=!0,i(e));++r>=n.length&&i(null)}for(var o of n)o.type.syncfs?o.type.syncfs(o,e,a):a(null)},mount(e,t,n){if(typeof e==`string`)throw e;var r,i=n===`/`,a=!n;if(i&&q.root)throw new q.ErrnoError(10);if(!i&&!a){var o=q.lookupPath(n,{follow_mount:!1});if(n=o.path,r=o.node,q.isMountpoint(r))throw new q.ErrnoError(10);if(!q.isDir(r.mode))throw new q.ErrnoError(54)}var s={type:e,opts:t,mountpoint:n,mounts:[]},c=e.mount(s);return c.mount=s,s.root=c,i?q.root=c:r&&(r.mounted=s,r.mount&&r.mount.mounts.push(s)),c},unmount(e){var t=q.lookupPath(e,{follow_mount:!1});if(!q.isMountpoint(t.node))throw new q.ErrnoError(28);var n=t.node,r=n.mounted,i=q.getMounts(r);for(var[a,o]of Object.entries(q.nameTable))for(;o;){var s=o.name_next;i.includes(o.mount)&&q.destroyNode(o),o=s}n.mounted=null;var c=n.mount.mounts.indexOf(r);w(c!==-1),n.mount.mounts.splice(c,1)},lookup:(e,t)=>e.node_ops.lookup(e,t),mknod(e,t,n){var r=q.lookupPath(e,{parent:!0}).node,i=z.basename(e);if(!i)throw new q.ErrnoError(28);if(i===`.`||i===`..`)throw new q.ErrnoError(20);var a=q.mayCreate(r,i);if(a)throw new q.ErrnoError(a);if(!r.node_ops.mknod)throw new q.ErrnoError(63);return r.node_ops.mknod(r,i,t,n)},statfs:e=>q.statfsNode(q.lookupPath(e,{follow:!0}).node),statfsStream:e=>q.statfsNode(e.node),statfsNode(e){var t={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:q.nextInode,ffree:q.nextInode-1,fsid:42,flags:2,namelen:255};return e.node_ops.statfs&&Object.assign(t,e.node_ops.statfs(e.mount.opts.root)),t},create:(e,t=438)=>(t&=4095,t|=32768,q.mknod(e,t,0)),mkdir:(e,t=511)=>(t&=1023,t|=16384,q.mknod(e,t,0)),mkdirTree(e,t){var n=e.split(`/`),r=``;for(var i of n)if(i){(r||z.isAbs(e))&&(r+=`/`),r+=i;try{q.mkdir(r,t)}catch(e){if(e.errno!=20)throw e}}},mkdev:(e,t,n)=>(n===void 0&&(n=t,t=438),t|=8192,q.mknod(e,t,n)),symlink(e,t){if(!B.resolve(e))throw new q.ErrnoError(44);var n=q.lookupPath(t,{parent:!0}).node;if(!n)throw new q.ErrnoError(44);var r=z.basename(t),i=q.mayCreate(n,r);if(i)throw new q.ErrnoError(i);if(!n.node_ops.symlink)throw new q.ErrnoError(63);return n.node_ops.symlink(n,r,e)},rename(e,t){var n,r,i=z.dirname(e),a=z.dirname(t),o=z.basename(e),s=z.basename(t);if(n=q.lookupPath(e,{parent:!0}).node,r=q.lookupPath(t,{parent:!0}).node,!n||!r)throw new q.ErrnoError(44);if(n.mount!==r.mount)throw new q.ErrnoError(75);var c,l=q.lookupNode(n,o),u=B.relative(e,a);if(u.charAt(0)!==`.`)throw new q.ErrnoError(28);if((u=B.relative(t,i)).charAt(0)!==`.`)throw new q.ErrnoError(55);try{c=q.lookupNode(r,s)}catch{}if(l!==c){var d=q.isDir(l.mode),f=q.mayDelete(n,o,d);if(f||=c?q.mayDelete(r,s,d):q.mayCreate(r,s))throw new q.ErrnoError(f);if(!n.node_ops.rename)throw new q.ErrnoError(63);if(q.isMountpoint(l)||c&&q.isMountpoint(c))throw new q.ErrnoError(10);if(r!==n&&(f=q.nodePermissions(n,`w`)))throw new q.ErrnoError(f);q.hashRemoveNode(l);try{n.node_ops.rename(l,r,s),l.parent=r}catch(e){throw e}finally{q.hashAddNode(l)}}},rmdir(e){var t=q.lookupPath(e,{parent:!0}).node,n=z.basename(e),r=q.lookupNode(t,n),i=q.mayDelete(t,n,!0);if(i)throw new q.ErrnoError(i);if(!t.node_ops.rmdir)throw new q.ErrnoError(63);if(q.isMountpoint(r))throw new q.ErrnoError(10);t.node_ops.rmdir(t,n),q.destroyNode(r)},readdir(e){var t=q.lookupPath(e,{follow:!0}).node;return q.checkOpExists(t.node_ops.readdir,54)(t)},unlink(e){var t=q.lookupPath(e,{parent:!0}).node;if(!t)throw new q.ErrnoError(44);var n=z.basename(e),r=q.lookupNode(t,n),i=q.mayDelete(t,n,!1);if(i)throw new q.ErrnoError(i);if(!t.node_ops.unlink)throw new q.ErrnoError(63);if(q.isMountpoint(r))throw new q.ErrnoError(10);t.node_ops.unlink(t,n),q.destroyNode(r)},readlink(e){var t=q.lookupPath(e).node;if(!t)throw new q.ErrnoError(44);if(!t.node_ops.readlink)throw new q.ErrnoError(28);return t.node_ops.readlink(t)},stat(e,t){var n=q.lookupPath(e,{follow:!t}).node;return q.checkOpExists(n.node_ops.getattr,63)(n)},fstat(e){var t=q.getStreamChecked(e),n=t.node,r=t.stream_ops.getattr,i=r?t:n;return r??=n.node_ops.getattr,q.checkOpExists(r,63),r(i)},lstat:e=>q.stat(e,!0),doChmod(e,t,n,r){q.doSetAttr(e,t,{mode:4095&n|-4096&t.mode,ctime:Date.now(),dontFollow:r})},chmod(e,t,n){var r=typeof e==`string`?q.lookupPath(e,{follow:!n}).node:e;q.doChmod(null,r,t,n)},lchmod(e,t){q.chmod(e,t,!0)},fchmod(e,t){var n=q.getStreamChecked(e);q.doChmod(n,n.node,t,!1)},doChown(e,t,n){q.doSetAttr(e,t,{timestamp:Date.now(),dontFollow:n})},chown(e,t,n,r){var i=typeof e==`string`?q.lookupPath(e,{follow:!r}).node:e;q.doChown(null,i,r)},lchown(e,t,n){q.chown(e,t,n,!0)},fchown(e,t,n){var r=q.getStreamChecked(e);q.doChown(r,r.node,!1)},doTruncate(e,t,n){if(q.isDir(t.mode))throw new q.ErrnoError(31);if(!q.isFile(t.mode))throw new q.ErrnoError(28);var r=q.nodePermissions(t,`w`);if(r)throw new q.ErrnoError(r);q.doSetAttr(e,t,{size:n,timestamp:Date.now()})},truncate(e,t){if(t<0)throw new q.ErrnoError(28);var n=typeof e==`string`?q.lookupPath(e,{follow:!0}).node:e;q.doTruncate(null,n,t)},ftruncate(e,t){var n=q.getStreamChecked(e);if(t<0||!(2097155&n.flags))throw new q.ErrnoError(28);q.doTruncate(n,n.node,t)},utime(e,t,n){var r=q.lookupPath(e,{follow:!0}).node;q.checkOpExists(r.node_ops.setattr,63)(r,{atime:t,mtime:n})},open(e,t,n=438){if(e===``)throw new q.ErrnoError(44);var r,i;if(n=64&(t=typeof t==`string`?(e=>{var t={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[e];if(t===void 0)throw Error(`Unknown file open mode: ${e}`);return t})(t):t)?4095&n|32768:0,typeof e==`object`)r=e;else{i=e.endsWith(`/`);var a=q.lookupPath(e,{follow:!(131072&t),noent_okay:!0});r=a.node,e=a.path}var o=!1;if(64&t)if(r){if(128&t)throw new q.ErrnoError(20)}else{if(i)throw new q.ErrnoError(31);r=q.mknod(e,511|n,0),o=!0}if(!r)throw new q.ErrnoError(44);if(q.isChrdev(r.mode)&&(t&=-513),65536&t&&!q.isDir(r.mode))throw new q.ErrnoError(54);if(!o){var s=q.mayOpen(r,t);if(s)throw new q.ErrnoError(s)}512&t&&!o&&q.truncate(r,0),t&=-131713;var c=q.createStream({node:r,path:q.getPath(r),flags:t,seekable:!0,position:0,stream_ops:r.stream_ops,ungotten:[],error:!1});return c.stream_ops.open&&c.stream_ops.open(c),o&&q.chmod(r,511&n),c},close(e){if(q.isClosed(e))throw new q.ErrnoError(8);e.getdents&&=null;try{e.stream_ops.close&&e.stream_ops.close(e)}catch(e){throw e}finally{q.closeStream(e.fd)}e.fd=null},isClosed:e=>e.fd===null,llseek(e,t,n){if(q.isClosed(e))throw new q.ErrnoError(8);if(!e.seekable||!e.stream_ops.llseek)throw new q.ErrnoError(70);if(n!=0&&n!=1&&n!=2)throw new q.ErrnoError(28);return e.position=e.stream_ops.llseek(e,t,n),e.ungotten=[],e.position},read(e,t,n,r,i){if(w(n>=0),r<0||i<0)throw new q.ErrnoError(28);if(q.isClosed(e)||(2097155&e.flags)==1)throw new q.ErrnoError(8);if(q.isDir(e.node.mode))throw new q.ErrnoError(31);if(!e.stream_ops.read)throw new q.ErrnoError(28);var a=i!==void 0;if(a){if(!e.seekable)throw new q.ErrnoError(70)}else i=e.position;var o=e.stream_ops.read(e,t,n,r,i);return a||(e.position+=o),o},write(e,t,n,r,i,a){if(w(n>=0),r<0||i<0)throw new q.ErrnoError(28);if(q.isClosed(e)||!(2097155&e.flags))throw new q.ErrnoError(8);if(q.isDir(e.node.mode))throw new q.ErrnoError(31);if(!e.stream_ops.write)throw new q.ErrnoError(28);e.seekable&&1024&e.flags&&q.llseek(e,0,2);var o=i!==void 0;if(o){if(!e.seekable)throw new q.ErrnoError(70)}else i=e.position;var s=e.stream_ops.write(e,t,n,r,i,a);return o||(e.position+=s),s},mmap(e,t,n,r,i){if(2&r&&!(2&i)&&(2097155&e.flags)!=2||(2097155&e.flags)==1)throw new q.ErrnoError(2);if(!e.stream_ops.mmap)throw new q.ErrnoError(43);if(!t)throw new q.ErrnoError(28);return e.stream_ops.mmap(e,t,n,r,i)},msync:(e,t,n,r,i)=>(w(n>=0),e.stream_ops.msync?e.stream_ops.msync(e,t,n,r,i):0),ioctl(e,t,n){if(!e.stream_ops.ioctl)throw new q.ErrnoError(59);return e.stream_ops.ioctl(e,t,n)},readFile(e,t={}){t.flags=t.flags||0,t.encoding=t.encoding||`binary`,t.encoding!==`utf8`&&t.encoding!==`binary`&&P(`Invalid encoding type "${t.encoding}"`);var n=q.open(e,t.flags),r=q.stat(e).size,i=new Uint8Array(r);return q.read(n,i,0,r,0),t.encoding===`utf8`&&(i=V(i)),q.close(n),i},writeFile(e,t,n={}){n.flags=n.flags||577;var r=q.open(e,n.flags,n.mode);typeof t==`string`&&(t=new Uint8Array(De(t,!0))),ArrayBuffer.isView(t)?q.write(r,t,0,t.byteLength,void 0,n.canOwn):P(`Unsupported data type`),q.close(r)},cwd:()=>q.currentPath,chdir(e){var t=q.lookupPath(e,{follow:!0});if(t.node===null)throw new q.ErrnoError(44);if(!q.isDir(t.node.mode))throw new q.ErrnoError(54);var n=q.nodePermissions(t.node,`x`);if(n)throw new q.ErrnoError(n);q.currentPath=t.path},createDefaultDirectories(){q.mkdir(`/tmp`),q.mkdir(`/home`),q.mkdir(`/home/web_user`)},createDefaultDevices(){q.mkdir(`/dev`),q.registerDevice(q.makedev(1,3),{read:()=>0,write:(e,t,n,r,i)=>r,llseek:()=>0}),q.mkdev(`/dev/null`,q.makedev(1,3)),H.register(q.makedev(5,0),H.default_tty_ops),H.register(q.makedev(6,0),H.default_tty1_ops),q.mkdev(`/dev/tty`,q.makedev(5,0)),q.mkdev(`/dev/tty1`,q.makedev(6,0));var e=new Uint8Array(1024),t=0,n=()=>(t===0&&(Se(e),t=e.byteLength),e[--t]);q.createDevice(`/dev`,`random`,n),q.createDevice(`/dev`,`urandom`,n),q.mkdir(`/dev/shm`),q.mkdir(`/dev/shm/tmp`)},createSpecialDirectories(){q.mkdir(`/proc`);var e=q.mkdir(`/proc/self`);q.mkdir(`/proc/self/fd`),q.mount({mount(){var t=q.createNode(e,`fd`,16895,73);return t.stream_ops={llseek:U.stream_ops.llseek},t.node_ops={lookup(e,t){var n=+t,r=q.getStreamChecked(n),i={parent:null,mount:{mountpoint:`fake`},node_ops:{readlink:()=>r.path},id:n+1};return i.parent=i,i},readdir:()=>Array.from(q.streams.entries()).filter(([e,t])=>t).map(([e,t])=>e.toString())},t}},{},`/proc/self/fd`)},createStandardStreams(e,t,n){e?q.createDevice(`/dev`,`stdin`,e):q.symlink(`/dev/tty`,`/dev/stdin`),t?q.createDevice(`/dev`,`stdout`,null,t):q.symlink(`/dev/tty`,`/dev/stdout`),n?q.createDevice(`/dev`,`stderr`,null,n):q.symlink(`/dev/tty1`,`/dev/stderr`);var r=q.open(`/dev/stdin`,0),i=q.open(`/dev/stdout`,1),a=q.open(`/dev/stderr`,1);w(r.fd===0,`invalid handle for stdin (${r.fd})`),w(i.fd===1,`invalid handle for stdout (${i.fd})`),w(a.fd===2,`invalid handle for stderr (${a.fd})`)},staticInit(){q.nameTable=Array(4096),q.mount(U,{},`/`),q.createDefaultDirectories(),q.createDefaultDevices(),q.createSpecialDirectories(),q.filesystems={MEMFS:U}},init(e,t,n){w(!q.initialized,`FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)`),q.initialized=!0,e??=r.stdin,t??=r.stdout,n??=r.stderr,q.createStandardStreams(e,t,n)},quit(){for(var e of(q.initialized=!1,He(0),q.streams))e&&q.close(e)},findObject(e,t){var n=q.analyzePath(e,t);return n.exists?n.object:null},analyzePath(e,t){try{e=(r=q.lookupPath(e,{follow:!t})).path}catch{}var n={isRoot:!1,exists:!1,error:0,name:null,path:null,object:null,parentExists:!1,parentPath:null,parentObject:null};try{var r=q.lookupPath(e,{parent:!0});n.parentExists=!0,n.parentPath=r.path,n.parentObject=r.node,n.name=z.basename(e),r=q.lookupPath(e,{follow:!t}),n.exists=!0,n.path=r.path,n.object=r.node,n.name=r.node.name,n.isRoot=r.path===`/`}catch(e){n.error=e.errno}return n},createPath(e,t,n,r){e=typeof e==`string`?e:q.getPath(e);for(var i=t.split(`/`).reverse();i.length;){var a=i.pop();if(a){var o=z.join2(e,a);try{q.mkdir(o)}catch(e){if(e.errno!=20)throw e}e=o}}return o},createFile(e,t,n,r,i){var a=z.join2(typeof e==`string`?e:q.getPath(e),t),o=ke(r,i);return q.create(a,o)},createDataFile(e,t,n,r,i,a){var o=t;e&&(e=typeof e==`string`?e:q.getPath(e),o=t?z.join2(e,t):e);var s=ke(r,i),c=q.create(o,s);if(n){if(typeof n==`string`){for(var l=Array(n.length),u=0,d=n.length;u<d;++u)l[u]=n.charCodeAt(u);n=l}q.chmod(c,146|s);var f=q.open(c,577);q.write(f,n,0,n.length,0,a),q.close(f),q.chmod(c,s)}},createDevice(e,t,n,r){var i=z.join2(typeof e==`string`?e:q.getPath(e),t),a=ke(!!n,!!r);q.createDevice.major??=64;var o=q.makedev(q.createDevice.major++,0);return q.registerDevice(o,{open(e){e.seekable=!1},close(e){r?.buffer?.length&&r(10)},read(e,t,r,i,a){for(var o=0,s=0;s<i;s++){var c;try{c=n()}catch{throw new q.ErrnoError(29)}if(c===void 0&&o===0)throw new q.ErrnoError(6);if(c==null)break;o++,t[r+s]=c}return o&&(e.node.atime=Date.now()),o},write(e,t,n,i,a){for(var o=0;o<i;o++)try{r(t[n+o])}catch{throw new q.ErrnoError(29)}return i&&(e.node.mtime=e.node.ctime=Date.now()),o}}),q.mkdev(i,a,o)},forceLoadFile(e){if(e.isDevice||e.isFolder||e.link||e.contents)return!0;if(globalThis.XMLHttpRequest)P(`Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.`);else try{e.contents=g(e.url)}catch{throw new q.ErrnoError(29)}},createLazyFile(e,t,n,r,i){class a{lengthKnown=!1;chunks=[];get(e){if(!(e>this.length-1||e<0)){var t=e%this.chunkSize,n=e/this.chunkSize|0;return this.getter(n)[t]}}setDataGetter(e){this.getter=e}cacheLength(){var e=new XMLHttpRequest;e.open(`HEAD`,n,!1),e.send(null),e.status>=200&&e.status<300||e.status===304||P(`Couldn't load `+n+`. Status: `+e.status);var t,r=Number(e.getResponseHeader(`Content-length`)),i=(t=e.getResponseHeader(`Accept-Ranges`))&&t===`bytes`,a=(t=e.getResponseHeader(`Content-Encoding`))&&t===`gzip`,o=1048576;i||(o=r);var s=this;s.setDataGetter(e=>{var t=e*o,i=(e+1)*o-1;return i=Math.min(i,r-1),s.chunks[e]===void 0&&(s.chunks[e]=((e,t)=>{e>t&&P(`invalid range (`+e+`, `+t+`) or no bytes requested!`),t>r-1&&P(`only `+r+` bytes available! programmer error!`);var i=new XMLHttpRequest;return i.open(`GET`,n,!1),r!==o&&i.setRequestHeader(`Range`,`bytes=`+e+`-`+t),i.responseType=`arraybuffer`,i.overrideMimeType&&i.overrideMimeType(`text/plain; charset=x-user-defined`),i.send(null),i.status>=200&&i.status<300||i.status===304||P(`Couldn't load `+n+`. Status: `+i.status),i.response===void 0?De(i.responseText||``,!0):new Uint8Array(i.response||[])})(t,i)),s.chunks[e]===void 0&&P(`doXHR failed!`),s.chunks[e]}),!a&&r||(o=r=1,r=this.getter(0).length,o=r,x(`LazyFiles on gzip forces download of the whole file when length is accessed`)),this._length=r,this._chunkSize=o,this.lengthKnown=!0}get length(){return this.lengthKnown||this.cacheLength(),this._length}get chunkSize(){return this.lengthKnown||this.cacheLength(),this._chunkSize}}if(globalThis.XMLHttpRequest){o||P(`Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc`);var s={isDevice:!1,contents:new a}}else s={isDevice:!1,url:n};var c=q.createFile(e,t,s,r,i);s.contents?c.contents=s.contents:s.url&&(c.contents=null,c.url=s.url),Object.defineProperties(c,{usedBytes:{get:function(){return this.contents.length}}});var l={};for(let[e,t]of Object.entries(c.stream_ops))l[e]=(...e)=>(q.forceLoadFile(c),t(...e));function u(e,t,n,r,i){var a=e.node.contents;if(i>=a.length)return 0;var o=Math.min(a.length-i,r);if(w(o>=0),a.slice)for(var s=0;s<o;s++)t[n+s]=a[i+s];else for(s=0;s<o;s++)t[n+s]=a.get(i+s);return o}return l.read=(e,t,n,r,i)=>(q.forceLoadFile(c),u(e,t,n,r,i)),l.mmap=(e,t,n,r,i)=>{q.forceLoadFile(c);var a=Oe();if(!a)throw new q.ErrnoError(48);return u(e,D,a,t,n),{ptr:a,allocated:!0}},c.stream_ops=l,c},absolutePath(){P(`FS.absolutePath has been removed; use PATH_FS.resolve instead`)},createFolder(){P(`FS.createFolder has been removed; use FS.mkdir instead`)},createLink(){P(`FS.createLink has been removed; use FS.symlink instead`)},joinPath(){P(`FS.joinPath has been removed; use PATH.join instead`)},mmapAlloc(){P(`FS.mmapAlloc has been replaced by the top level function mmapAlloc`)},standardizePath(){P(`FS.standardizePath has been removed; use PATH.normalize instead`)}},J={calculateAt(e,t,n){if(z.isAbs(t))return t;var r=e===-100?q.cwd():J.getStreamFromFD(e).path;if(t.length==0){if(!n)throw new q.ErrnoError(44);return r}return r+`/`+t},writeStat(e,t){A[e>>2]=t.dev,A[e+4>>2]=t.mode,A[e+8>>2]=t.nlink,A[e+12>>2]=t.uid,A[e+16>>2]=t.gid,A[e+20>>2]=t.rdev,j[e+24>>3]=BigInt(t.size),k[e+32>>2]=4096,k[e+36>>2]=t.blocks;var n=t.atime.getTime(),r=t.mtime.getTime(),i=t.ctime.getTime();return j[e+40>>3]=BigInt(Math.floor(n/1e3)),A[e+48>>2]=n%1e3*1e3*1e3,j[e+56>>3]=BigInt(Math.floor(r/1e3)),A[e+64>>2]=r%1e3*1e3*1e3,j[e+72>>3]=BigInt(Math.floor(i/1e3)),A[e+80>>2]=i%1e3*1e3*1e3,j[e+88>>3]=BigInt(t.ino),0},writeStatFs(e,t){A[e+4>>2]=t.bsize,A[e+60>>2]=t.bsize,j[e+8>>3]=BigInt(t.blocks),j[e+16>>3]=BigInt(t.bfree),j[e+24>>3]=BigInt(t.bavail),j[e+32>>3]=BigInt(t.files),j[e+40>>3]=BigInt(t.ffree),A[e+48>>2]=t.fsid,A[e+64>>2]=t.flags,A[e+56>>2]=t.namelen},doMsync(e,t,n,r,i){if(!q.isFile(t.node.mode))throw new q.ErrnoError(43);if(2&r)return 0;var a=ie.slice(e,e+n);q.msync(t,a,i,n,r)},getStreamFromFD:e=>q.getStreamChecked(e),varargs:void 0,getStr:e=>W(e)},Fe=(e,t,n)=>(w(typeof n==`number`,`stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!`),Ee(e,ie,t,n)),Ie=(e,t)=>(w(t,`alignment argument is required`),Math.ceil(e/t)*t),Le=e=>{var t=Je.buffer.byteLength,n=(e-t+65535)/65536|0;try{return Je.grow(n),de(),1}catch(n){S(`growMemory: Attempted to grow heap from ${t} bytes to ${e} bytes, but got error: ${n}`)}},Re=[],Y=e=>{var t=Re[e];return t||(Re[e]=t=Ye.get(e)),w(Ye.get(e)==t,`JavaScript-side Wasm function table mirror is out of date!`),t},ze=e=>Ke(e),Be=(e,t,n,i,a)=>{var o={string:e=>{var t=0;return e!=null&&e!==0&&(t=(e=>{var t=Te(e)+1,n=ze(t);return Fe(e,n,t),n})(e)),t},array:e=>{var t,n,r=ze(e.length);return n=r,w((t=e).length>=0,`writeArrayToMemory array must have a length (should be an array or typed array)`),D.set(t,n),r}},s=(e=>{var t=r[`_`+e];return w(t,`Cannot call unknown function `+e+`, make sure it is exported`),t})(e),c=[],l=0;if(w(t!==`array`,`Return type should not be "array".`),i)for(var u=0;u<i.length;u++){var d=o[n[u]];d?(l===0&&(l=L()),c[u]=d(i[u])):c[u]=i[u]}var f=s(...c);return f=function(e){return l!==0&&I(l),function(e){return t===`string`?W(e):t===`boolean`?!!e:e}(e)}(f)};q.createPreloadedFile=(e,t,n,r,i,a,o,s,c,l)=>{Pe(e,t,n,r,i,s,c,l).then(a).catch(o)},q.preloadFile=Pe,q.staticInit(),globalThis.crypto===void 0&&(globalThis.crypto=m("crypto"));var Ve=Date.now();if(r.noExitRuntime&&r.noExitRuntime,r.preloadPlugins&&(Ne=r.preloadPlugins),r.print&&(x=r.print),r.printErr&&(S=r.printErr),r.wasmBinary&&(b=r.wasmBinary),ce(`fetchSettings`),ce(`logReadFiles`),ce(`loadSplitModule`),r.arguments&&r.arguments,r.thisProgram&&r.thisProgram,w(r.memoryInitializerPrefixURL===void 0,`Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead`),w(r.pthreadMainPrefixURL===void 0,`Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead`),w(r.cdInitializerPrefixURL===void 0,`Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead`),w(r.filePackagePrefixURL===void 0,`Module.filePackagePrefixURL option was removed, use Module.locateFile instead`),w(r.read===void 0,`Module.read option was removed`),w(r.readAsync===void 0,`Module.readAsync option was removed (modify readAsync in JS)`),w(r.readBinary===void 0,`Module.readBinary option was removed (modify readBinary in JS)`),w(r.setWindowTitle===void 0,`Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)`),w(r.TOTAL_MEMORY===void 0,`Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY`),w(r.ENVIRONMENT===void 0,`Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)`),w(r.STACK_SIZE===void 0,`STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time`),w(r.wasmMemory===void 0,"Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally"),w(r.INITIAL_MEMORY===void 0,`Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically`),r.preInit)for(typeof r.preInit==`function`&&(r.preInit=[r.preInit]);r.preInit.length>0;)r.preInit.shift()();se(`preInit`),r.ccall=Be,r.cwrap=(e,t,n,r)=>(...r)=>Be(e,t,n,r),r.setValue=function(e,t,n=`i8`){switch(n.endsWith(`*`)&&(n=`*`),n){case`i1`:case`i8`:D[e]=t;break;case`i16`:O[e>>1]=t;break;case`i32`:k[e>>2]=t;break;case`i64`:j[e>>3]=BigInt(t);break;case`float`:ae[e>>2]=t;break;case`double`:oe[e>>3]=t;break;case`*`:A[e>>2]=t;break;default:P(`invalid type for setValue: ${n}`)}},r.getValue=be,r.PATH=z,r.PATH_FS=B,r.UTF8ToString=W,r.stringToUTF8=Fe,r.lengthBytesUTF8=Te,r.FS=q,`writeI53ToI64.writeI53ToI64Clamped.writeI53ToI64Signaling.writeI53ToU64Clamped.writeI53ToU64Signaling.readI53FromI64.readI53FromU64.convertI32PairToI53.convertI32PairToI53Checked.convertU32PairToI53.getTempRet0.setTempRet0.createNamedFunction.zeroMemory.exitJS.withStackSave.inetPton4.inetNtop4.inetPton6.inetNtop6.readSockaddr.writeSockaddr.readEmAsmArgs.jstoi_q.getExecutableName.autoResumeAudioContext.getDynCaller.dynCall.handleException.keepRuntimeAlive.runtimeKeepalivePush.runtimeKeepalivePop.callUserCallback.maybeExit.asmjsMangle.HandleAllocator.addOnInit.addOnPostCtor.addOnPreMain.addOnExit.STACK_SIZE.STACK_ALIGN.POINTER_SIZE.ASSERTIONS.convertJsFunctionToWasm.getEmptyTableSlot.updateTableMap.getFunctionAddress.addFunction.removeFunction.intArrayToString.AsciiToString.stringToAscii.UTF16ToString.stringToUTF16.lengthBytesUTF16.UTF32ToString.stringToUTF32.lengthBytesUTF32.stringToNewUTF8.registerKeyEventCallback.maybeCStringToJsString.findEventTarget.getBoundingClientRect.fillMouseEventData.registerMouseEventCallback.registerWheelEventCallback.registerUiEventCallback.registerFocusEventCallback.fillDeviceOrientationEventData.registerDeviceOrientationEventCallback.fillDeviceMotionEventData.registerDeviceMotionEventCallback.screenOrientation.fillOrientationChangeEventData.registerOrientationChangeEventCallback.fillFullscreenChangeEventData.registerFullscreenChangeEventCallback.JSEvents_requestFullscreen.JSEvents_resizeCanvasForFullscreen.registerRestoreOldStyle.hideEverythingExceptGivenElement.restoreHiddenElements.setLetterbox.softFullscreenResizeWebGLRenderTarget.doRequestFullscreen.fillPointerlockChangeEventData.registerPointerlockChangeEventCallback.registerPointerlockErrorEventCallback.requestPointerLock.fillVisibilityChangeEventData.registerVisibilityChangeEventCallback.registerTouchEventCallback.fillGamepadEventData.registerGamepadEventCallback.registerBeforeUnloadEventCallback.fillBatteryEventData.registerBatteryEventCallback.setCanvasElementSize.getCanvasElementSize.jsStackTrace.getCallstack.convertPCtoSourceLocation.getEnvStrings.checkWasiClock.wasiRightsToMuslOFlags.wasiOFlagsToMuslOFlags.safeSetTimeout.setImmediateWrapped.safeRequestAnimationFrame.clearImmediateWrapped.registerPostMainLoop.registerPreMainLoop.getPromise.makePromise.idsToPromises.makePromiseCallback.ExceptionInfo.findMatchingCatch.Browser_asyncPrepareDataCounter.isLeapYear.ydayFromDate.arraySum.addDays.getSocketFromFD.getSocketAddress.FS_mkdirTree._setNetworkCallback.heapObjectForWebGLType.toTypedArrayIndex.webgl_enable_ANGLE_instanced_arrays.webgl_enable_OES_vertex_array_object.webgl_enable_WEBGL_draw_buffers.webgl_enable_WEBGL_multi_draw.webgl_enable_EXT_polygon_offset_clamp.webgl_enable_EXT_clip_control.webgl_enable_WEBGL_polygon_mode.emscriptenWebGLGet.computeUnpackAlignedImageSize.colorChannelsInGlTextureFormat.emscriptenWebGLGetTexPixelData.emscriptenWebGLGetUniform.webglGetUniformLocation.webglPrepareUniformLocationsBeforeFirstUse.webglGetLeftBracePos.emscriptenWebGLGetVertexAttrib.__glGetActiveAttribOrUniform.writeGLArray.registerWebGlEventCallback.runAndAbortIfError.ALLOC_NORMAL.ALLOC_STACK.allocate.writeStringToMemory.writeAsciiToMemory.allocateUTF8.allocateUTF8OnStack.demangle.stackTrace.getNativeTypeSize`.split(`.`).forEach(function(e){le(e)}),`run.out.err.callMain.abort.wasmExports.HEAPF32.HEAPF64.HEAP8.HEAP16.HEAPU16.HEAP32.HEAPU32.HEAP64.HEAPU64.writeStackCookie.checkStackCookie.INT53_MAX.INT53_MIN.bigintToI53Checked.stackSave.stackRestore.stackAlloc.ptrToString.getHeapMax.growMemory.ENV.ERRNO_CODES.strError.DNS.Protocols.Sockets.timers.warnOnce.readEmAsmArgsArray.asyncLoad.alignMemory.mmapAlloc.wasmTable.wasmMemory.getUniqueRunDependency.noExitRuntime.addRunDependency.removeRunDependency.addOnPreRun.addOnPostRun.freeTableIndexes.functionsInTableMap.UTF8Decoder.UTF8ArrayToString.stringToUTF8Array.intArrayFromString.UTF16Decoder.stringToUTF8OnStack.writeArrayToMemory.JSEvents.specialHTMLTargets.findCanvasEventTarget.currentFullscreenStrategy.restoreOldWindowedStyle.UNWIND_CACHE.ExitStatus.doReadv.doWritev.initRandomFill.randomFill.emSetImmediate.emClearImmediate_deps.emClearImmediate.promiseMap.uncaughtExceptionCount.exceptionLast.exceptionCaught.Browser.requestFullscreen.requestFullScreen.setCanvasSize.getUserMedia.createContext.getPreloadedImageData__data.wget.MONTH_DAYS_REGULAR.MONTH_DAYS_LEAP.MONTH_DAYS_REGULAR_CUMULATIVE.MONTH_DAYS_LEAP_CUMULATIVE.SYSCALLS.preloadPlugins.FS_createPreloadedFile.FS_preloadFile.FS_modeStringToFlags.FS_getMode.FS_stdin_getChar_buffer.FS_stdin_getChar.FS_unlink.FS_createPath.FS_createDevice.FS_readFile.FS_root.FS_mounts.FS_devices.FS_streams.FS_nextInode.FS_nameTable.FS_currentPath.FS_initialized.FS_ignorePermissions.FS_filesystems.FS_syncFSRequests.FS_lookupPath.FS_getPath.FS_hashName.FS_hashAddNode.FS_hashRemoveNode.FS_lookupNode.FS_createNode.FS_destroyNode.FS_isRoot.FS_isMountpoint.FS_isFile.FS_isDir.FS_isLink.FS_isChrdev.FS_isBlkdev.FS_isFIFO.FS_isSocket.FS_flagsToPermissionString.FS_nodePermissions.FS_mayLookup.FS_mayCreate.FS_mayDelete.FS_mayOpen.FS_checkOpExists.FS_nextfd.FS_getStreamChecked.FS_getStream.FS_createStream.FS_closeStream.FS_dupStream.FS_doSetAttr.FS_chrdev_stream_ops.FS_major.FS_minor.FS_makedev.FS_registerDevice.FS_getDevice.FS_getMounts.FS_syncfs.FS_mount.FS_unmount.FS_lookup.FS_mknod.FS_statfs.FS_statfsStream.FS_statfsNode.FS_create.FS_mkdir.FS_mkdev.FS_symlink.FS_rename.FS_rmdir.FS_readdir.FS_readlink.FS_stat.FS_fstat.FS_lstat.FS_doChmod.FS_chmod.FS_lchmod.FS_fchmod.FS_doChown.FS_chown.FS_lchown.FS_fchown.FS_doTruncate.FS_truncate.FS_ftruncate.FS_utime.FS_open.FS_close.FS_isClosed.FS_llseek.FS_read.FS_write.FS_mmap.FS_msync.FS_ioctl.FS_writeFile.FS_cwd.FS_chdir.FS_createDefaultDirectories.FS_createDefaultDevices.FS_createSpecialDirectories.FS_createStandardStreams.FS_staticInit.FS_init.FS_quit.FS_findObject.FS_analyzePath.FS_createFile.FS_createDataFile.FS_forceLoadFile.FS_createLazyFile.FS_absolutePath.FS_createFolder.FS_createLink.FS_joinPath.FS_mmapAlloc.FS_standardizePath.MEMFS.TTY.PIPEFS.SOCKFS.tempFixedLengthArray.miniTempWebGLFloatBuffers.miniTempWebGLIntBuffers.GL.AL.GLUT.EGL.GLEW.IDBStore.SDL.SDL_gfx.print.printErr.jstoi_s`.split(`.`).forEach(le),r._free=M(`_free`),r._malloc=M(`_malloc`),r._mp_sched_keyboard_interrupt=M(`_mp_sched_keyboard_interrupt`),r._mp_js_init=M(`_mp_js_init`),r._mp_js_register_js_module=M(`_mp_js_register_js_module`),r._mp_js_do_import=M(`_mp_js_do_import`),r._proxy_convert_mp_to_js_obj_cside=M(`_proxy_convert_mp_to_js_obj_cside`),r._mp_js_do_exec=M(`_mp_js_do_exec`),r._mp_js_do_exec_async=M(`_mp_js_do_exec_async`),r._mp_js_repl_init=M(`_mp_js_repl_init`),r._mp_js_repl_process_char=M(`_mp_js_repl_process_char`),r._mp_js_register_romfs=M(`_mp_js_register_romfs`),r._mp_hal_get_interrupt_char=M(`_mp_hal_get_interrupt_char`),r._proxy_c_init=M(`_proxy_c_init`),r._proxy_c_free_obj=M(`_proxy_c_free_obj`),r._proxy_c_to_js_call=M(`_proxy_c_to_js_call`),r._proxy_c_to_js_dir=M(`_proxy_c_to_js_dir`),r._proxy_c_to_js_has_attr=M(`_proxy_c_to_js_has_attr`),r._proxy_c_to_js_lookup_attr=M(`_proxy_c_to_js_lookup_attr`),r._proxy_c_to_js_store_attr=M(`_proxy_c_to_js_store_attr`),r._proxy_c_to_js_delete_attr=M(`_proxy_c_to_js_delete_attr`),r._proxy_c_to_js_get_type=M(`_proxy_c_to_js_get_type`),r._proxy_c_to_js_get_array=M(`_proxy_c_to_js_get_array`),r._proxy_c_to_js_get_dict=M(`_proxy_c_to_js_get_dict`),r._proxy_c_to_js_get_iter=M(`_proxy_c_to_js_get_iter`),r._proxy_c_to_js_iternext=M(`_proxy_c_to_js_iternext`),r._proxy_c_to_js_resume=M(`_proxy_c_to_js_resume`);var He=M(`_fflush`),Ue=M(`_strerror`),X=M(`_emscripten_stack_get_end`),Z=M(`_setThrew`),We=M(`_emscripten_stack_init`),Ge=M(`__emscripten_stack_restore`),Ke=M(`__emscripten_stack_alloc`),qe=M(`_emscripten_stack_get_current`),Je=M(`wasmMemory`),Ye=M(`wasmTable`),Xe,Ze,Qe={__syscall_chdir:function(e){try{return e=J.getStr(e),q.chdir(e),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_fstat64:function(e,t){try{return J.writeStat(t,q.fstat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_getcwd:function(e,t){try{if(t===0)return-28;var n=q.cwd(),r=Te(n)+1;return t<r?-68:(Fe(n,e,t),r)}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_getdents64:function(e,t,n){try{var r=J.getStreamFromFD(e);r.getdents||=q.readdir(r.path);for(var i=0,a=q.llseek(r,0,1),o=Math.floor(a/280),s=Math.min(r.getdents.length,o+Math.floor(n/280)),c=o;c<s;c++){var l,u,d=r.getdents[c];if(d===`.`)l=r.node.id,u=4;else if(d===`..`)l=q.lookupPath(r.path,{parent:!0}).node.id,u=4;else{var f;try{f=q.lookupNode(r.node,d)}catch(e){if(e?.errno===28)continue;throw e}l=f.id,u=q.isChrdev(f.mode)?2:q.isDir(f.mode)?4:q.isLink(f.mode)?10:8}w(l),j[t+i>>3]=BigInt(l),j[t+i+8>>3]=BigInt(280*(c+1)),O[t+i+16>>1]=280,D[t+i+18]=u,Fe(d,t+i+19,256),i+=280}return q.llseek(r,280*c,0),i}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_lstat64:function(e,t){try{return e=J.getStr(e),J.writeStat(t,q.lstat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_mkdirat:function(e,t,n){try{return t=J.getStr(t),t=J.calculateAt(e,t),q.mkdir(t,n,0),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_newfstatat:function(e,t,n,r){try{t=J.getStr(t);var i=256&r,a=4096&r;return w(!(r&=-6401),`unknown flags in __syscall_newfstatat: ${r}`),t=J.calculateAt(e,t,a),J.writeStat(n,i?q.lstat(t):q.stat(t))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_openat:function(e,t,n,r){J.varargs=r;try{t=J.getStr(t),t=J.calculateAt(e,t);var i=r?(()=>{w(J.varargs!=null);var e=k[J.varargs>>2];return J.varargs+=4,e})():0;return q.open(t,n,i).fd}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_poll:function(e,t,n){try{for(var r=0,i=0;i<t;i++){var a=e+8*i,o=k[a>>2],s=O[a+4>>1],c=32,l=q.getStream(o);l&&(c=l.stream_ops.poll?l.stream_ops.poll(l,-1):5),(c&=24|s)&&r++,O[a+6>>1]=c}return r||n==0||R(`non-zero poll() timeout not supported: `+n),r}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_renameat:function(e,t,n,r){try{return t=J.getStr(t),r=J.getStr(r),t=J.calculateAt(e,t),r=J.calculateAt(n,r),q.rename(t,r),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_rmdir:function(e){try{return e=J.getStr(e),q.rmdir(e),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_stat64:function(e,t){try{return e=J.getStr(e),J.writeStat(t,q.stat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_statfs64:function(e,t,n){try{return w(t===88),J.writeStatFs(n,q.statfs(J.getStr(e))),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_unlinkat:function(e,t,n){try{if(t=J.getStr(t),t=J.calculateAt(e,t),n){if(n!==512)return-28;q.rmdir(t)}else q.unlink(t);return 0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},_abort_js:()=>P(`native code called abort()`),_emscripten_throw_longjmp:()=>{throw 1/0},call0:function(e,t){d((0,proxy_js_ref[e])(),t)},call0_kwarg:function(e,t,n,r,i,a){let o=proxy_js_ref[e],s={};for(let e=0;e<n;++e){let t=W(be(r+4*e,`i32`));s[t]=f(i+3*e*4)}let c;c=t?o.call(s):o(s),d(c,a)},call1:function(e,t,n,r){let i=f(n),a=proxy_js_ref[e],o;o=t?a.call(i):a(i),d(o,r)},call2:function(e,t,n,r,i){let a=f(n),o=f(r),s=proxy_js_ref[e],c;c=t?s.call(a,o):s(a,o),d(c,i)},calln:function(e,t,n,r,i){let a=proxy_js_ref[e],o=[];for(let e=0;e<n;++e){let t=f(r+3*e*4);o.push(t)}let s;s=t?a.call(...o):a(...o),d(s,i)},calln_kwarg:function(e,t,n,r,i,a,o,s){let c=proxy_js_ref[e],l=[];for(let e=0;e<n;++e){let t=f(r+3*e*4);l.push(t)}let u={};for(let e=0;e<i;++e){let t=W(be(a+4*e,`i32`));u[t]=f(o+3*e*4)}let p;p=t?c.call(...l,u):c(...l,u),d(p,s)},create_promise:function(e,t){let n=f(e);d(new Promise(n),t)},emscripten_resize_heap:e=>{var t=ie.length;if(w((e>>>=0)>t),e>2147483648)return S(`Cannot enlarge memory, requested ${e} bytes, but the limit is 2147483648 bytes!`),!1;for(var n=1;n<=4;n*=2){var r=t*(1+.2/n);r=Math.min(r,e+100663296);var i=Math.min(2147483648,Ie(Math.max(e,r),65536));if(Le(i))return!0}return S(`Failed to grow the heap from ${t} bytes to ${i} bytes, not enough memory!`),!1},fd_close:function(e){try{var t=J.getStreamFromFD(e);return q.close(t),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_read:function(e,t,n,r){try{var i=((e,t,n,r)=>{for(var i=0,a=0;a<n;a++){var o=A[t>>2],s=A[t+4>>2];t+=8;var c=q.read(e,D,o,s,r);if(c<0)return-1;if(i+=c,c<s)break;r!==void 0&&(r+=c)}return i})(J.getStreamFromFD(e),t,n);return A[r>>2]=i,0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_seek:function(e,t,n,r){var i;t=(i=t)<-9007199254740992||i>9007199254740992?NaN:Number(i);try{if(isNaN(t))return 61;var a=J.getStreamFromFD(e);return q.llseek(a,t,n),j[r>>3]=BigInt(a.position),a.getdents&&t===0&&n===0&&(a.getdents=null),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_sync:function(e){try{var t=J.getStreamFromFD(e);return t.stream_ops?.fsync?.(t)}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_write:function(e,t,n,r){try{var i=((e,t,n,r)=>{for(var i=0,a=0;a<n;a++){var o=A[t>>2],s=A[t+4>>2];t+=8;var c=q.write(e,D,o,s,r);if(c<0)return-1;if(i+=c,c<s)break;r!==void 0&&(r+=c)}return i})(J.getStreamFromFD(e),t,n);return A[r>>2]=i,0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},has_attr:function(e,t){let n=proxy_js_ref[e];return W(t)in n},invoke_i:function(e){var t=L();try{return Y(e)()}catch(e){if(I(t),e!==e+0)throw e;Z(1,0)}},invoke_ii:function(e,t){var n=L();try{return Y(e)(t)}catch(e){if(I(n),e!==e+0)throw e;Z(1,0)}},invoke_iii:function(e,t,n){var r=L();try{return Y(e)(t,n)}catch(e){if(I(r),e!==e+0)throw e;Z(1,0)}},invoke_iiii:function(e,t,n,r){var i=L();try{return Y(e)(t,n,r)}catch(e){if(I(i),e!==e+0)throw e;Z(1,0)}},invoke_iiiii:function(e,t,n,r,i){var a=L();try{return Y(e)(t,n,r,i)}catch(e){if(I(a),e!==e+0)throw e;Z(1,0)}},invoke_iiiiii:function(e,t,n,r,i,a){var o=L();try{return Y(e)(t,n,r,i,a)}catch(e){if(I(o),e!==e+0)throw e;Z(1,0)}},invoke_v:function(e){var t=L();try{Y(e)()}catch(e){if(I(t),e!==e+0)throw e;Z(1,0)}},invoke_vi:function(e,t){var n=L();try{Y(e)(t)}catch(e){if(I(n),e!==e+0)throw e;Z(1,0)}},invoke_vii:function(e,t,n){var r=L();try{Y(e)(t,n)}catch(e){if(I(r),e!==e+0)throw e;Z(1,0)}},invoke_viii:function(e,t,n,r){var i=L();try{Y(e)(t,n,r)}catch(e){if(I(i),e!==e+0)throw e;Z(1,0)}},invoke_viiii:function(e,t,n,r,i){var a=L();try{Y(e)(t,n,r,i)}catch(e){if(I(a),e!==e+0)throw e;Z(1,0)}},js_check_existing:function(e){return function(e){let t=globalThis.proxy_js_map.get(e)?.deref();if(t===void 0)return-1;for(let e=0;e<globalThis.proxy_js_existing.length;++e)if(globalThis.proxy_js_existing[e]===void 0)return globalThis.proxy_js_existing[e]=t,e;return globalThis.proxy_js_existing.push(t),globalThis.proxy_js_existing.length-1}(e)},js_get_error_info:function(e,t,n){let r=proxy_js_ref[e];d(r.name,t),d(r.message,n)},js_get_iter:function(e,t){d(proxy_js_ref[e][Symbol.iterator](),t)},js_get_proxy_js_ref_info:function(e){let t=0;for(let e of proxy_js_ref)e!==void 0&&++t;r.setValue(e,proxy_js_ref.length,`i32`),r.setValue(e+4,t,`i32`)},js_iter_next:function(e,t){let n=proxy_js_ref[e].next();return!n.done&&(d(n.value,t),!0)},js_reflect_construct:function(e,t,n,r){let i=proxy_js_ref[e],a=[];for(let e=0;e<t;++e)a.push(f(n+3*e*4));d(Reflect.construct(i,a),r)},js_subscr_load:function(e,t,n){let r=proxy_js_ref[e];d(r[function(e,t){let n=t;if(typeof n==`number`&&(n<0&&(n+=e.length),n<0||n>=e.length))throw new c(`IndexError`,`index out of range`);return n}(r,f(t))],n)},js_subscr_store:function(e,t,n){proxy_js_ref[e][f(t)]=f(n)},js_then_continue:function(e,t,n,r,i){let a=f(t),o=f(n),s=f(r);d(proxy_js_ref[e].then(e=>{a(e,null,o,s)},e=>{a(null,e,o,s)}),i)},js_then_reject:function(e,t){let n;try{n=f(e)}catch(e){n=e}f(t)(n)},js_then_resolve:function(e,t){let n=f(e);f(t)(n)},lookup_attr:function(e,t,n){let r=proxy_js_ref[e],i=W(t),a=r[i];return a!==void 0||i in r?(d(a,n),typeof a!=`function`||`_ref`in a?1:2):0},mp_js_random_u32:()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0],mp_js_ticks_ms:()=>Date.now()-Ve,mp_js_time_ms:()=>Date.now(),proxy_convert_mp_to_js_then_js_to_js_then_js_to_mp_obj_jsside:function(e){let t=f(e);d(i.toJs(t),e)},proxy_convert_mp_to_js_then_js_to_mp_obj_jsside:function(e){(function(e,t){u(e,t,!1)})(f(e),e)},proxy_js_free_obj:function(e){e>=s&&(proxy_js_ref_map.delete(proxy_js_ref[e]),proxy_js_ref[e]=void 0,e<proxy_js_ref_next&&(proxy_js_ref_next=e))},store_attr:function(e,t,n){let r=W(t),i=f(n);proxy_js_ref[e][r]=i}};function $e(){var e;We(),w(!(3&(e=X()))),e==0&&(e+=4),A[e>>2]=34821223,A[e+4>>2]=2310721022,A[0]=1668509029}Ze=await async function(){function e(e,t){return function(e){w(e.free!==void 0,`missing Wasm export: free`),w(e.malloc!==void 0,`missing Wasm export: malloc`),w(e.mp_sched_keyboard_interrupt!==void 0,`missing Wasm export: mp_sched_keyboard_interrupt`),w(e.mp_js_init!==void 0,`missing Wasm export: mp_js_init`),w(e.mp_js_register_js_module!==void 0,`missing Wasm export: mp_js_register_js_module`),w(e.mp_js_do_import!==void 0,`missing Wasm export: mp_js_do_import`),w(e.proxy_convert_mp_to_js_obj_cside!==void 0,`missing Wasm export: proxy_convert_mp_to_js_obj_cside`),w(e.mp_js_do_exec!==void 0,`missing Wasm export: mp_js_do_exec`),w(e.mp_js_do_exec_async!==void 0,`missing Wasm export: mp_js_do_exec_async`),w(e.mp_js_repl_init!==void 0,`missing Wasm export: mp_js_repl_init`),w(e.mp_js_repl_process_char!==void 0,`missing Wasm export: mp_js_repl_process_char`),w(e.mp_js_register_romfs!==void 0,`missing Wasm export: mp_js_register_romfs`),w(e.mp_hal_get_interrupt_char!==void 0,`missing Wasm export: mp_hal_get_interrupt_char`),w(e.proxy_c_init!==void 0,`missing Wasm export: proxy_c_init`),w(e.proxy_c_free_obj!==void 0,`missing Wasm export: proxy_c_free_obj`),w(e.proxy_c_to_js_call!==void 0,`missing Wasm export: proxy_c_to_js_call`),w(e.proxy_c_to_js_dir!==void 0,`missing Wasm export: proxy_c_to_js_dir`),w(e.proxy_c_to_js_has_attr!==void 0,`missing Wasm export: proxy_c_to_js_has_attr`),w(e.proxy_c_to_js_lookup_attr!==void 0,`missing Wasm export: proxy_c_to_js_lookup_attr`),w(e.proxy_c_to_js_store_attr!==void 0,`missing Wasm export: proxy_c_to_js_store_attr`),w(e.proxy_c_to_js_delete_attr!==void 0,`missing Wasm export: proxy_c_to_js_delete_attr`),w(e.proxy_c_to_js_get_type!==void 0,`missing Wasm export: proxy_c_to_js_get_type`),w(e.proxy_c_to_js_get_array!==void 0,`missing Wasm export: proxy_c_to_js_get_array`),w(e.proxy_c_to_js_get_dict!==void 0,`missing Wasm export: proxy_c_to_js_get_dict`),w(e.proxy_c_to_js_get_iter!==void 0,`missing Wasm export: proxy_c_to_js_get_iter`),w(e.proxy_c_to_js_iternext!==void 0,`missing Wasm export: proxy_c_to_js_iternext`),w(e.proxy_c_to_js_resume!==void 0,`missing Wasm export: proxy_c_to_js_resume`),w(e.fflush!==void 0,`missing Wasm export: fflush`),w(e.strerror!==void 0,`missing Wasm export: strerror`),w(e.emscripten_stack_get_end!==void 0,`missing Wasm export: emscripten_stack_get_end`),w(e.emscripten_stack_get_base!==void 0,`missing Wasm export: emscripten_stack_get_base`),w(e.setThrew!==void 0,`missing Wasm export: setThrew`),w(e.emscripten_stack_init!==void 0,`missing Wasm export: emscripten_stack_init`),w(e.emscripten_stack_get_free!==void 0,`missing Wasm export: emscripten_stack_get_free`),w(e._emscripten_stack_restore!==void 0,`missing Wasm export: _emscripten_stack_restore`),w(e._emscripten_stack_alloc!==void 0,`missing Wasm export: _emscripten_stack_alloc`),w(e.emscripten_stack_get_current!==void 0,`missing Wasm export: emscripten_stack_get_current`),w(e.memory!==void 0,`missing Wasm export: memory`),w(e.__indirect_function_table!==void 0,`missing Wasm export: __indirect_function_table`),r._free=F(`free`,1),r._malloc=F(`malloc`,1),r._mp_sched_keyboard_interrupt=F(`mp_sched_keyboard_interrupt`,0),r._mp_js_init=F(`mp_js_init`,2),r._mp_js_register_js_module=F(`mp_js_register_js_module`,2),r._mp_js_do_import=F(`mp_js_do_import`,2),r._proxy_convert_mp_to_js_obj_cside=F(`proxy_convert_mp_to_js_obj_cside`,2),r._mp_js_do_exec=F(`mp_js_do_exec`,3),r._mp_js_do_exec_async=F(`mp_js_do_exec_async`,3),r._mp_js_repl_init=F(`mp_js_repl_init`,0),r._mp_js_repl_process_char=F(`mp_js_repl_process_char`,1),r._mp_js_register_romfs=F(`mp_js_register_romfs`,2),r._mp_hal_get_interrupt_char=F(`mp_hal_get_interrupt_char`,0),r._proxy_c_init=F(`proxy_c_init`,0),r._proxy_c_free_obj=F(`proxy_c_free_obj`,1),r._proxy_c_to_js_call=F(`proxy_c_to_js_call`,4),r._proxy_c_to_js_dir=F(`proxy_c_to_js_dir`,2),r._proxy_c_to_js_has_attr=F(`proxy_c_to_js_has_attr`,2),r._proxy_c_to_js_lookup_attr=F(`proxy_c_to_js_lookup_attr`,3),r._proxy_c_to_js_store_attr=F(`proxy_c_to_js_store_attr`,3),r._proxy_c_to_js_delete_attr=F(`proxy_c_to_js_delete_attr`,2),r._proxy_c_to_js_get_type=F(`proxy_c_to_js_get_type`,1),r._proxy_c_to_js_get_array=F(`proxy_c_to_js_get_array`,2),r._proxy_c_to_js_get_dict=F(`proxy_c_to_js_get_dict`,2),r._proxy_c_to_js_get_iter=F(`proxy_c_to_js_get_iter`,1),r._proxy_c_to_js_iternext=F(`proxy_c_to_js_iternext`,2),r._proxy_c_to_js_resume=F(`proxy_c_to_js_resume`,2),He=F(`fflush`,1),Ue=F(`strerror`,1),X=e.emscripten_stack_get_end,e.emscripten_stack_get_base,Z=F(`setThrew`,2),We=e.emscripten_stack_init,e.emscripten_stack_get_free,Ge=e._emscripten_stack_restore,Ke=e._emscripten_stack_alloc,qe=e.emscripten_stack_get_current,Je=e.memory,Ye=e.__indirect_function_table}(Ze=e.exports),de(),Ze}var t=r,n={env:Qe,wasi_snapshot_preview1:Qe};return r.instantiateWasm?new Promise((t,i)=>{try{r.instantiateWasm(n,(n,r)=>{t(e(n))})}catch(e){S(`Module.instantiateWasm callback failed with error: ${e}`),i(e)}}):(ue??=fe(),function(n){return w(r===t,`the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?`),t=null,e(n.instance)}(await me(b,ue,n)))}(),function e(){function t(){w(!Xe),Xe=!0,r.calledRun=!0,C||(w(!N),N=!0,ee(),r.noFSInit||q.initialized||q.init(),H.init(),Ze.__wasm_call_ctors(),q.ignorePermissions=!1,ne?.(r),r.onRuntimeInitialized?.(),se(`onRuntimeInitialized`),w(!r._main,`compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]`),function(){if(ee(),r.postRun)for(typeof r.postRun==`function`&&(r.postRun=[r.postRun]);r.postRun.length;)_e(r.postRun.shift());se(`postRun`),he(ge)}())}G>0?je=e:($e(),function(){if(r.preRun)for(typeof r.preRun==`function`&&(r.preRun=[r.preRun]);r.preRun.length;)ye(r.preRun.shift());se(`preRun`),he(ve)}(),G>0?je=e:(r.setStatus?(r.setStatus(`Running...`),setTimeout(()=>{setTimeout(()=>r.setStatus(``),1),t()},1)):t(),ee()))}(),n=N?r:new Promise((e,t)=>{ne=e,re=t});for(let e of Object.keys(r))e in t||Object.defineProperty(t,e,{configurable:!0,get(){P(`Access to module property ('${e}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)}});return n}async function r(e){let{pystack:t,heapsize:r,url:a,stdin:s,stdout:c,stderr:u,linebuffer:f,romfs:m}=Object.assign({pystack:2048,heapsize:1048576,linebuffer:!0},e),h={locateFile:(e,t)=>a||t+e};h._textDecoder=new TextDecoder,s!==void 0&&(h.stdin=s),c!==void 0&&(f?(h._stdoutBuffer=[],h.stdout=e=>{e===10?(c(h._textDecoder.decode(new Uint8Array(h._stdoutBuffer))),h._stdoutBuffer=[]):h._stdoutBuffer.push(e)}):h.stdout=e=>c(new Uint8Array([e]))),u!==void 0&&(f?(h._stderrBuffer=[],h.stderr=e=>{e===10?(u(h._textDecoder.decode(new Uint8Array(h._stderrBuffer))),h._stderrBuffer=[]):h._stderrBuffer.push(e)}):h.stderr=e=>u(new Uint8Array([e]))),h=await n(h),globalThis.Module=h,l();let g=e=>{let t=h._malloc(12);return h.ccall(`mp_js_do_import`,`null`,[`string`,`pointer`],[e,t]),p(t)};if(m!==void 0){let e=h._malloc(m.length);h.HEAPU8.set(m,e),h.ccall(`mp_js_register_romfs`,`null`,[`pointer`,`number`],[e,m.length])}return h.ccall(`mp_js_init`,`null`,[`number`,`number`],[t,r]),h.ccall(`proxy_c_init`,`null`,[],[]),{_module:h,PyProxy:i,FS:h.FS,globals:{__dict__:g(`__main__`).__dict__,get(e){return this.__dict__[e]},set(e,t){this.__dict__[e]=t},delete(e){delete this.__dict__[e]}},registerJsModule(e,t){let n=h._malloc(12);d(t,n),h.ccall(`mp_js_register_js_module`,`null`,[`string`,`pointer`],[e,n]),h._free(n)},pyimport:g,runPython(e){let t=h.lengthBytesUTF8(e),n=h._malloc(t+1);h.stringToUTF8(e,n,t+1);let r=h._malloc(12);return h.ccall(`mp_js_do_exec`,`number`,[`pointer`,`number`,`pointer`],[n,t,r]),h._free(n),p(r)},runPythonAsync(e){let t=h.lengthBytesUTF8(e),n=h._malloc(t+1);h.stringToUTF8(e,n,t+1);let r=h._malloc(12);h.ccall(`mp_js_do_exec_async`,`number`,[`pointer`,`number`,`pointer`],[n,t,r]),h._free(n);let i=p(r);return i instanceof o?Promise.resolve(i):i},replInit(){h.ccall(`mp_js_repl_init`,`null`,[`null`])},replProcessChar:e=>h.ccall(`mp_js_repl_process_char`,`number`,[`number`],[e]),replProcessCharWithAsyncify:async e=>h.ccall(`mp_js_repl_process_char`,`number`,[`number`],[e],{async:!0})}}if(globalThis.loadMicroPython=r,typeof process==`object`&&typeof process.versions==`object`&&typeof process.versions.node==`string`&&process.argv.length>1){let t=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),n=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),i=t.resolve(n.fileURLToPath(import.meta.url)),a=t.resolve(process.argv[1]);i.includes(a)&&async function(){let t=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),n=131072,i=``,a=!0;for(let e=2;e<process.argv.length;e++)if(process.argv[e]===`-X`&&e<process.argv.length-1){if(process.argv[e+1].includes(`heapsize=`)){n=parseInt(process.argv[e+1].split(`heapsize=`)[1]);let t=process.argv[e+1].substr(-1).toLowerCase();t===`k`?n*=1024:t===`m`&&(n*=1048576),++e}}else i+=t.readFileSync(process.argv[e],`utf8`),a=!1;!1===process.stdin.isTTY&&(i=t.readFileSync(0,`utf8`),a=!1);let o=await r({heapsize:n,stdout:e=>process.stdout.write(e),linebuffer:!1});if(a)o.replInit(),process.stdin.setRawMode(!0),process.stdin.on(`data`,e=>{for(let t=0;t<e.length;t++)o.replProcessCharWithAsyncify(e[t]).then(e=>{e&&process.exit()})});else{if(i.endsWith(`asyncio.run(main())
`)){let e=o.pyimport(`asyncio`);e.run=async t=>{await e.create_task(t)}}try{o.runPython(i)}catch(e){if(e.name!==`PythonError`)throw e;e.type===`SystemExit`||console.error(e.message)}}}()}var i=class e{constructor(e){this._ref=e}static toJs(t){if(!(t instanceof e))return t;let n=Module.ccall(`proxy_c_to_js_get_type`,`number`,[`number`],[t._ref]);if(n===1||n===2){let n=Module._malloc(8),r=Module._malloc(12);Module.ccall(`proxy_c_to_js_get_array`,`null`,[`number`,`pointer`],[t._ref,n]);let i=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`),o=[];for(let t=0;t<i;++t){Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[Module.getValue(a+4*t,`i32`),r]);let n=f(r);o.push(e.toJs(n))}return Module._free(n),Module._free(r),o}if(n===3){let n=Module._malloc(8),r=Module._malloc(12);Module.ccall(`proxy_c_to_js_get_dict`,`null`,[`number`,`pointer`],[t._ref,n]);let i=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`),o={};for(let t=0;t<i;++t){let n=Module.getValue(a+8*t,`i32`);if(n>8){Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[n,r]);let i=f(r),s=Module.getValue(a+8*t+4,`i32`);Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[s,r]);let c=f(r);o[i]=e.toJs(c)}}return Module._free(n),Module._free(r),o}return t}};const a={isExtensible:()=>!0,ownKeys(e){let t=Module._malloc(12);Module.ccall(`proxy_c_to_js_dir`,`null`,[`number`,`pointer`],[e._ref,t]);let n=p(t);return i.toJs(n).filter(e=>!e.startsWith(`__`))},getOwnPropertyDescriptor:(e,t)=>({value:e[t],enumerable:!0,writable:!0,configurable:!0}),has:(e,t)=>typeof t==`string`?Module.ccall(`proxy_c_to_js_has_attr`,`number`,[`number`,`string`],[e._ref,t]):t===Symbol.iterator,get(e,t){if(t===`_ref`)return e._ref;if(t===`then`||typeof t!=`string`){if(t===Symbol.iterator){let t=Module.ccall(`proxy_c_to_js_get_iter`,`number`,[`number`],[e._ref]);return function*(){let e=Module._malloc(12);for(;Module.ccall(`proxy_c_to_js_iternext`,`number`,[`number`,`pointer`],[t,e]);)yield f(e);Module._free(e)}}return}let n=Module._malloc(12);return Module.ccall(`proxy_c_to_js_lookup_attr`,`null`,[`number`,`string`,`pointer`],[e._ref,t,n]),p(n)},set(e,t,n){let r=Module._malloc(12);d(n,r);let i=Module.ccall(`proxy_c_to_js_store_attr`,`number`,[`number`,`string`,`number`],[e._ref,t,r]);return Module._free(r),i},deleteProperty:(e,t)=>Module.ccall(`proxy_c_to_js_delete_attr`,`number`,[`number`,`string`],[e._ref,t])};var o=class{constructor(e){this._ref=e}then(e,t){let n=Module._malloc(36);return d(e,n+12),d(t,n+24),Module.ccall(`proxy_c_to_js_resume`,`null`,[`number`,`pointer`],[this._ref,n]),p(n)}};const s=2;var c=class extends Error{constructor(e,t){super(t),this.name=`PythonError`,this.type=e}};function l(){globalThis.proxy_js_ref=[globalThis,void 0],globalThis.proxy_js_ref_next=2,globalThis.proxy_js_ref_map=new Map,globalThis.proxy_js_ref_map.set(globalThis,0),globalThis.proxy_js_map=new Map,globalThis.proxy_js_existing=[void 0],globalThis.pyProxyFinalizationRegistry=new FinalizationRegistry(e=>{globalThis.proxy_js_map.delete(e),Module.ccall(`proxy_c_free_obj`,`null`,[`number`],[e])})}function u(e,t,n){let r;if(e===void 0)r=0;else if(e===null)r=1;else if(typeof e==`boolean`)r=2,Module.setValue(t+4,e,`i32`);else if(typeof e==`number`)if(Number.isInteger(e))r=3,Module.setValue(t+4,e,`i32`);else{r=4;let n=t+4&-8;Module.setValue(n,e,`double`);let i=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`);Module.setValue(t+4,i,`i32`),Module.setValue(t+8,a,`i32`)}else if(typeof e==`string`){r=5;let n=Module.lengthBytesUTF8(e),i=Module._malloc(n+1);Module.stringToUTF8(e,i,n+1),Module.setValue(t+4,n,`i32`),Module.setValue(t+8,i,`i32`)}else if(n&&(e instanceof i||typeof e==`function`&&`_ref`in e||e instanceof o))r=8,Module.setValue(t+4,e._ref,`i32`);else{let n,i=proxy_js_ref_map.get(e);i===void 0?(r=7,n=function(e){for(;proxy_js_ref_next<proxy_js_ref.length;){if(proxy_js_ref[proxy_js_ref_next]===void 0){let t=proxy_js_ref_next;return++proxy_js_ref_next,proxy_js_ref[t]=e,proxy_js_ref_map.set(e,t),t}++proxy_js_ref_next}let t=proxy_js_ref.length;return proxy_js_ref[t]=e,proxy_js_ref_next=proxy_js_ref.length,proxy_js_ref_map.set(e,t),t}(e)):(r=6,n=i),Module.setValue(t+4,n,`i32`)}Module.setValue(t+0,r,`i32`)}function d(e,t){u(e,t,!0)}function f(e){let t=Module.getValue(e,`i32`),n;if(t===-1){let t=Module.getValue(e+4,`i32`),n=Module.getValue(e+8,`i32`),r=Module.UTF8ToString(n,t);Module._free(n);let i=r.split(``);throw new c(i[0],i[1])}if(t===0)throw Error(`NULL object`);if(t===1)n=null;else if(t===2)n=!!Module.getValue(e+4,`i32`);else if(t===3)n=Module.getValue(e+4,`i32`);else if(t===4){let t=e+4&-8,r=Module.getValue(e+4,`i32`),i=Module.getValue(e+8,`i32`);Module.setValue(t,r,`i32`),Module.setValue(t+4,i,`i32`),n=Module.getValue(t,`double`)}else if(t===5){let t=Module.getValue(e+4,`i32`),r=Module.getValue(e+8,`i32`);n=Module.UTF8ToString(r,t)}else if(t===9){let t=Module.getValue(e+4,`i32`);n=proxy_js_ref[t]}else if(t===10){let t=Module.getValue(e+4,`i32`);n=globalThis.proxy_js_existing[t],globalThis.proxy_js_existing[t]=void 0}else{let r=Module.getValue(e+4,`i32`);if(t===6)n=(...e)=>function(e,t){let n=0;for(;t.length>0&&t[t.length-1]===void 0;)t.pop();if(t.length>0){n=Module._malloc(3*t.length*4);for(let e in t)d(t[e],n+3*e*4)}let r=Module._malloc(12);Module.ccall(`proxy_c_to_js_call`,`null`,[`number`,`number`,`number`,`pointer`],[e,t.length,n,r]),t.length>0&&Module._free(n);let i=p(r);return i instanceof o?Promise.resolve(i):i}(r,e),n._ref=r;else if(t===7)n=new o(r);else{let e=new i(r);n=new Proxy(e,a)}globalThis.pyProxyFinalizationRegistry.register(n,r),globalThis.proxy_js_map.set(r,new WeakRef(n))}return n}function p(e){let t=f(e);return Module._free(e),t}var m=`/ucsbxrp/assets/micropython-DXFUqjrr.wasm`;const h=Object.freeze({minimumXmm:-1524,minimumYmm:-609.6,maximumXmm:1524,maximumYmm:609.6}),g=h,_={defaultWorldId:`open`,worlds:[{id:`open`,label:`Course arena`,bounds:g,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[],markers:[{type:`start_box`,label:`Start`,minimumXmm:-120,minimumYmm:-120,maximumXmm:120,maximumYmm:120}]},{id:`delivery-gate-blocked`,label:`Delivery gate blocked`,bounds:g,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[{type:`block`,label:`Blocked gate`,minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100}],markers:[{type:`start_line`,label:`Start`,x1Mm:0,y1Mm:-140,x2Mm:0,y2Mm:140},{type:`waypoint`,label:`Delivery`,xMm:900,yMm:0}]}]};function v(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`${t} must be an object`);return e}function y(e,t,n){if(!Array.isArray(e)||e.length>n)throw Error(`${t} must be a list with at most ${n} items`);return e}function b(e,t){if(typeof e!=`number`||!Number.isFinite(e))throw Error(`${t} must be a finite number`);return e}function x(e,t){if(typeof e!=`boolean`)throw Error(`${t} must be true or false`);return e}function S(e,t,n=64){if(typeof e!=`string`||!e.trim()||e.length>n)throw Error(`${t} must contain 1 to ${n} characters`);return e.trim()}function C(e,t){return e===void 0?void 0:S(e,t,48)}function w(e,t){let n=S(e,t,32);if(!/^[a-z][a-z0-9_-]*$/.test(n))throw Error(`${t} must use lower-case letters, digits, underscores, and hyphens`);return n}function T(e,t){let n=new Set(t),r=Object.fromEntries(Object.entries(e).filter(([e])=>!n.has(e)));return Object.keys(r).length===0?{}:{additionalProperties:r}}function ee(e,t){let n=v(e,t),r={minimumXmm:b(n.minimum_x_mm,`${t}.minimum_x_mm`),minimumYmm:b(n.minimum_y_mm,`${t}.minimum_y_mm`),maximumXmm:b(n.maximum_x_mm,`${t}.maximum_x_mm`),maximumYmm:b(n.maximum_y_mm,`${t}.maximum_y_mm`)};if(r.maximumXmm<=r.minimumXmm||r.maximumYmm<=r.minimumYmm)throw Error(`${t} must have positive width and height`);return r}function E(e,t,n){return t>=e.minimumXmm&&t<=e.maximumXmm&&n>=e.minimumYmm&&n<=e.maximumYmm}function te(e,t){return t.minimumXmm>=e.minimumXmm&&t.maximumXmm<=e.maximumXmm&&t.minimumYmm>=e.minimumYmm&&t.maximumYmm<=e.maximumYmm}function ne(e,t){let n=v(e,`worlds[${t}]`),r=ee(n.bounds,`worlds[${t}].bounds`),i=v(n.initial_pose??{x_mm:0,y_mm:0,heading_rad:0},`worlds[${t}].initial_pose`),a={xMm:b(i.x_mm,`worlds[${t}].initial_pose.x_mm`),yMm:b(i.y_mm,`worlds[${t}].initial_pose.y_mm`),headingRad:b(i.heading_rad,`worlds[${t}].initial_pose.heading_rad`)};if(a.xMm<r.minimumXmm||a.xMm>r.maximumXmm||a.yMm<r.minimumYmm||a.yMm>r.maximumYmm)throw Error(`worlds[${t}].initial_pose must be inside the bounds`);let o=y(n.obstacles??[],`worlds[${t}].obstacles`,32).map((e,n)=>{let i=v(e,`worlds[${t}].obstacles[${n}]`);if(i.type!==`block`&&i.type!==`wall`)throw Error(`worlds[${t}].obstacles[${n}].type must be block or wall`);let a=ee(i,`worlds[${t}].obstacles[${n}]`);if(!te(r,a))throw Error(`worlds[${t}].obstacles[${n}] must be inside the world bounds`);return{...a,type:i.type,label:C(i.label,`worlds[${t}].obstacles[${n}].label`),feature:i.feature===void 0?void 0:w(i.feature,`worlds[${t}].obstacles[${n}].feature`)}}),s=o.flatMap(e=>e.feature===void 0?[]:[e.feature]);if(new Set(s).size!==s.length)throw Error(`worlds[${t}] obstacle feature names must be unique`);let c=y(n.tracks??[],`worlds[${t}].tracks`,8).map((e,n)=>{let i=`worlds[${t}].tracks[${n}]`,a=v(e,i);if(a.type!==`line`)throw Error(`${i}.type must be line`);let o=b(a.width_mm,`${i}.width_mm`),s=b(a.darkness,`${i}.darkness`),c=x(a.closed??!1,`${i}.closed`);if(o<=0)throw Error(`${i}.width_mm must be positive`);if(s<0||s>1)throw Error(`${i}.darkness must be within [0, 1]`);let l=y(a.points,`${i}.points`,128).map((e,t)=>{let n=`${i}.points[${t}]`,a=v(e,n),o={xMm:b(a.x_mm,`${n}.x_mm`),yMm:b(a.y_mm,`${n}.y_mm`)};if(!E(r,o.xMm,o.yMm))throw Error(`${n} must be inside the world bounds`);return o});if(l.length<(c?3:2))throw Error(`${i}.points does not define a usable line`);for(let e=1;e<l.length;e+=1){let t=l[e-1],n=l[e];if(t.xMm===n.xMm&&t.yMm===n.yMm)throw Error(`${i}.points must not repeat adjacent points`)}return{type:`line`,name:a.name===void 0?void 0:w(a.name,`${i}.name`),label:C(a.label,`${i}.label`),widthMm:o,darkness:s,closed:c,points:l}}),l=c.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(l).size!==l.length)throw Error(`worlds[${t}] track names must be unique`);let u=y(n.markers??[],`worlds[${t}].markers`,32).map((e,n)=>{let i=`worlds[${t}].markers[${n}]`,a=v(e,i),o=C(a.label,`${i}.label`),s=a.name===void 0?void 0:w(a.name,`${i}.name`);if(a.type===`start_line`||a.type===`finish_line`){let e=b(a.x1_mm,`${i}.x1_mm`),t=b(a.y1_mm,`${i}.y1_mm`),n=b(a.x2_mm,`${i}.x2_mm`),c=b(a.y2_mm,`${i}.y2_mm`);if(e===n&&t===c)throw Error(`${i} must have two different endpoints`);if(!E(r,e,t)||!E(r,n,c))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,x1Mm:e,y1Mm:t,x2Mm:n,y2Mm:c,...T(a,[`type`,`name`,`label`,`x1_mm`,`y1_mm`,`x2_mm`,`y2_mm`])}}if(a.type===`start_box`||a.type===`finish_box`){let e=ee(a,i);if(!te(r,e))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,...e,...T(a,[`type`,`name`,`label`,`minimum_x_mm`,`minimum_y_mm`,`maximum_x_mm`,`maximum_y_mm`])}}if(a.type===`waypoint`){let e=b(a.x_mm,`${i}.x_mm`),t=b(a.y_mm,`${i}.y_mm`);if(!E(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`waypoint`,name:s,label:o,xMm:e,yMm:t,headingRad:a.heading_rad===void 0?void 0:b(a.heading_rad,`${i}.heading_rad`),...T(a,[`type`,`name`,`label`,`x_mm`,`y_mm`,`heading_rad`])}}if(a.type===`marker`){let e=b(a.x_mm,`${i}.x_mm`),t=b(a.y_mm,`${i}.y_mm`);if(!E(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`marker`,name:s,label:o,xMm:e,yMm:t,...T(a,[`type`,`name`,`label`,`x_mm`,`y_mm`])}}throw Error(`${i}.type is not a supported marker`)}),d=u.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(d).size!==d.length)throw Error(`worlds[${t}] marker names must be unique`);let f=n.range_sensor===void 0?void 0:v(n.range_sensor,`worlds[${t}].range_sensor`);return{id:w(n.id,`worlds[${t}].id`),label:S(n.label,`worlds[${t}].label`),bounds:r,initialPose:a,obstacles:o,tracks:c,markers:u,...n.boundary_walls===void 0?{}:{boundaryWalls:x(n.boundary_walls,`worlds[${t}].boundary_walls`)},...f?.include_arena_boundary===void 0?{}:{includeArenaBoundaryInRange:x(f.include_arena_boundary,`worlds[${t}].range_sensor.include_arena_boundary`)}}}function re(e){if(e.length>64e3)throw Error(`world.json is too large`);let t;try{t=JSON.parse(e)}catch(e){throw Error(`world.json is not valid JSON: ${e instanceof Error?e.message:String(e)}`)}let n=v(t,`world.json`),r=y(n.worlds,`worlds`,8).map(ne);if(r.length===0)throw Error(`worlds must contain at least one world`);if(new Set(r.map(e=>e.id)).size!==r.length)throw Error(`world IDs must be unique`);let i=w(n.default_world,`default_world`);if(!r.some(e=>e.id===i))throw Error(`default_world must name one of the worlds`);return{defaultWorldId:i,worlds:r}}function D(e,t){let n=e.worlds.find(e=>e.id===t);if(!n)throw Error(`Unknown world '${t}'`);return n}const ie=[{id:`none`,label:`No obstacles`},{id:`divider`,label:`Divider wall`},{id:`square`,label:`200 × 200 mm square`},{id:`squares`,label:`Sparse 100 × 100 mm squares`},{id:`corridor`,label:`Parallel walls`},{id:`corner`,label:`L-shaped wall`},{id:`alcove`,label:`U-shaped alcove`},{id:`slalom`,label:`Staggered short walls`},{id:`gap`,label:`Wall with a 300 mm gap`}];function O(e,t,n,r){return{type:`wall`,minimumXmm:e,minimumYmm:t,maximumXmm:e+n,maximumYmm:t+r}}function k(e,t,n){return[O(e,t,n,8),O(e,t+n-8,n,8),O(e,t,8,n),O(e+n-8,t,8,n)]}function A(e,t){if(t===`none`)return[];let n=e.bounds,r=Math.min(3048,n.maximumXmm-n.minimumXmm),i=Math.min(1219.2,n.maximumYmm-n.minimumYmm),a=Math.max(n.minimumXmm+r/2,Math.min(n.maximumXmm-r/2,e.initialPose.xMm)),o=Math.max(n.minimumYmm+i/2,Math.min(n.maximumYmm-i/2,e.initialPose.yMm)),s=a+r*.22,c=o,l=Math.min(800,i-40),u;switch(t){case`divider`:u=[O(s,n.minimumYmm,12,n.maximumYmm-n.minimumYmm)];break;case`square`:u=k(s-100,c-100,200);break;case`squares`:u=[k(s,c-300,100),k(s-320,c+160,100),k(s+330,c,100)].flat();break;case`corridor`:u=[O(s-380,c-260,760,12),O(s-380,c+248,760,12)];break;case`corner`:u=[O(s,c-250,12,500),O(s-400,c+238,412,12)];break;case`alcove`:u=[O(s,c-250,12,500),O(s-400,c-250,412,12),O(s-400,c+238,412,12)];break;case`slalom`:u=[O(a-650,o-400,12,300),O(a+350,o+100,12,300),O(a+1e3,o-400,12,300)];break;case`gap`:u=[O(s,c-l/2,12,(l-300)/2),O(s,c+150,12,(l-300)/2)]}let d=u.every(e=>e.minimumXmm>=n.minimumXmm&&e.maximumXmm<=n.maximumXmm&&e.minimumYmm>=n.minimumYmm&&e.maximumYmm<=n.maximumYmm&&e.maximumXmm>e.minimumXmm&&e.maximumYmm>e.minimumYmm),f=u.every(t=>e.initialPose.xMm<t.minimumXmm-110||e.initialPose.xMm>t.maximumXmm+110||e.initialPose.yMm<t.minimumYmm-110||e.initialPose.yMm>t.maximumYmm+110);return d&&f?u:null}function ae(e,t){let n=2166136261;for(let t of e)n=Math.imul(n^t.charCodeAt(0),16777619);return`option-${(n>>>0).toString(16)}-${t}`}function oe(e){if(e.worlds.some(e=>e.baseWorldId))return e;let t=e.worlds.find(t=>t.id===e.defaultWorldId)??e.worlds[0],n={...t,id:`open-floor`,label:`Open floor (no walls)`,bounds:{minimumXmm:Math.min(-1e4,t.bounds.minimumXmm),minimumYmm:Math.min(-1e4,t.bounds.minimumYmm),maximumXmm:Math.max(1e4,t.bounds.maximumXmm),maximumYmm:Math.max(1e4,t.bounds.maximumYmm)},obstacles:[],boundaryWalls:!1,mapBounds:t.bounds,includeArenaBoundaryInRange:!1},r=e.worlds.some(e=>e.id===n.id)?e.worlds:[...e.worlds,n],i=r.flatMap(e=>ie.flatMap(t=>{if(t.id===`none`&&e.obstacles.length===0)return[];let n=A(e,t.id);return n===null?[]:[{...e,id:ae(e.id,t.id),baseWorldId:e.id,obstaclePresetId:t.id,obstacles:n}]}));return{...e,worlds:[...r,...i]}}const j=Math.PI/12,se=Object.freeze(Array.from({length:9},(e,t)=>(t/8-.5)*j));function M(e,t=70){return{xMm:e.xMm+t*Math.cos(e.headingRad),yMm:e.yMm+t*Math.sin(e.headingRad)}}function ce(e,t=55,n=12){let r=Math.cos(e.headingRad),i=Math.sin(e.headingRad),a=-i,o=r,s=e.xMm+t*r,c=e.yMm+t*i;return{left:{xMm:s+n*a,yMm:c+n*o},right:{xMm:s-n*a,yMm:c-n*o}}}Object.freeze({open:Object.freeze({label:`Course arena`,obstacles:Object.freeze([])}),"delivery-gate-blocked":Object.freeze({label:`Delivery gate blocked`,obstacles:Object.freeze([Object.freeze({minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100})])})});function le(e){return{worldBounds:e.bounds,obstacles:e.obstacles,tracks:e.tracks??[],includeWorldBoundaryInRange:e.includeArenaBoundaryInRange!==!1,collideWithWorldBoundary:e.boundaryWalls!==!1}}function ue(e=`open`){return D(_,e)}const N={fixedStepMs:20,wheelDiameterMm:60,trackWidthMm:155,encoderCountsPerRevolution:585,maximumWheelSpeedMmS:Math.PI*60*1.5,motorTimeConstantS:.18,leftStartEffort:.12,rightStartEffort:.13,leftResponseScale:1,rightResponseScale:.97,robotRadiusMm:85,rangeSensorOffsetMm:70,maximumRangeMm:4e3,batteryV:6.2,temperatureC:27,worldBounds:h,obstacles:[],tracks:[],reflectanceSensorForwardOffsetMm:55,reflectanceSensorLateralOffsetMm:12,reflectanceSensorFootprintRadiusMm:4,includeWorldBoundaryInRange:!0},de=.01;function P(e,t,n){return Math.max(t,Math.min(n,e))}function F(e){return((e+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI}function fe(e,t,n,r){let i=Math.abs(P(e,-1,1));if(i<=t)return 0;let a=(i-t)/(1-t);return Math.sign(e)*a*n*r}function pe(e){return Number.isFinite(e.minimumXmm)&&Number.isFinite(e.minimumYmm)&&Number.isFinite(e.maximumXmm)&&Number.isFinite(e.maximumYmm)&&e.maximumXmm>e.minimumXmm&&e.maximumYmm>e.minimumYmm}function me(e,t,n,r){return e>=n.minimumXmm-r&&e<=n.maximumXmm+r&&t>=n.minimumYmm-r&&t<=n.maximumYmm+r}function he(e,t,n,r,i){let a=-1/0,o=1/0,s=[[e,n,i.minimumXmm,i.maximumXmm],[t,r,i.minimumYmm,i.maximumYmm]];for(let[e,t,n,r]of s){if(Math.abs(t)<1e-12){if(e<n||e>r)return null;continue}let i=(n-e)/t,s=(r-e)/t;if(a=Math.max(a,Math.min(i,s)),o=Math.min(o,Math.max(i,s)),o<a)return null}return o<0?null:a>=0?a:o}function ge(e,t,n){let r=n.xMm-t.xMm,i=n.yMm-t.yMm,a=r*r+i*i;if(a===0)return Math.hypot(e.xMm-t.xMm,e.yMm-t.yMm);let o=P(((e.xMm-t.xMm)*r+(e.yMm-t.yMm)*i)/a,0,1);return Math.hypot(e.xMm-(t.xMm+o*r),e.yMm-(t.yMm+o*i))}function _e(e,t,n){let r=0;for(let i of t){let t=1/0;for(let n=1;n<i.points.length;n+=1)t=Math.min(t,ge(e,i.points[n-1],i.points[n]));i.closed&&(t=Math.min(t,ge(e,i.points[i.points.length-1],i.points[0])));let a=i.widthMm/2,o=n===0?+(t<=a):P((a+n-t)/(2*n),0,1);r=Math.max(r,o*i.darkness)}return r}var ve=class{config;leftDistanceMm=0;rightDistanceMm=0;previousCenterSpeedMmS=0;currentState;constructor(e={}){if(this.config={...N,...e,worldBounds:{...N.worldBounds,...e.worldBounds},obstacles:(e.obstacles??N.obstacles).map(e=>({...e})),tracks:(e.tracks??N.tracks).map(e=>({...e,points:e.points.map(e=>({...e}))}))},!pe(this.config.worldBounds))throw Error(`Simulator world bounds must form a valid rectangle`);if(this.config.obstacles.some(e=>!pe(e)))throw Error(`Every simulator obstacle must form a valid rectangle`);this.currentState=this.initialState(),this.updateRange(),this.updateReflectance()}get state(){return{...this.currentState,pose:{...this.currentState.pose},accelerationMg:[...this.currentState.accelerationMg],angularRateMdps:[...this.currentState.angularRateMdps]}}reset(e={xMm:0,yMm:0,headingRad:0}){return this.leftDistanceMm=0,this.rightDistanceMm=0,this.previousCenterSpeedMmS=0,this.currentState={...this.initialState(),pose:{...e,headingRad:F(e.headingRad)}},this.updateRange(),this.updateReflectance(),this.state}setMotorEffort(e,t){let n=P(Number.isFinite(t)?t:0,-1,1);e===`left`?this.currentState.leftEffort=n:this.currentState.rightEffort=n}stop(){this.currentState.leftEffort=0,this.currentState.rightEffort=0}step(e=this.config.fixedStepMs){if(!(e>0))throw Error(`Simulator step must be positive`);let t=e/1e3,n=fe(this.currentState.leftEffort,this.config.leftStartEffort,this.config.leftResponseScale,this.config.maximumWheelSpeedMmS),r=fe(this.currentState.rightEffort,this.config.rightStartEffort,this.config.rightResponseScale,this.config.maximumWheelSpeedMmS),i=1-Math.exp(-t/this.config.motorTimeConstantS),a=this.currentState.leftWheelSpeedMmS+i*(n-this.currentState.leftWheelSpeedMmS),o=this.currentState.rightWheelSpeedMmS+i*(r-this.currentState.rightWheelSpeedMmS);n===0&&Math.abs(a)<de&&(a=0),r===0&&Math.abs(o)<de&&(o=0);let s=a*t,c=o*t;this.leftDistanceMm+=s,this.rightDistanceMm+=c;let l=(s+c)/2,u=(c-s)/this.config.trackWidthMm,d=this.currentState.pose,f=d.xMm,p=d.yMm;if(Math.abs(u)<1e-12)f+=l*Math.cos(d.headingRad),p+=l*Math.sin(d.headingRad);else{let e=l/u,t=d.headingRad+u;f+=e*(Math.sin(t)-Math.sin(d.headingRad)),p-=e*(Math.cos(t)-Math.cos(d.headingRad))}let m={xMm:f,yMm:p,headingRad:F(d.headingRad+u)},h=!this.poseIsFree(m),g=(a+o)/2,_=(g-this.previousCenterSpeedMmS)/t;this.previousCenterSpeedMmS=g;let v=Math.PI*this.config.wheelDiameterMm/this.config.encoderCountsPerRevolution;return this.currentState={...this.currentState,tMs:this.currentState.tMs+e,seq:this.currentState.seq+1,pose:h?d:m,leftWheelSpeedMmS:a,rightWheelSpeedMmS:o,leftEncoderCount:Math.round(this.leftDistanceMm/v),rightEncoderCount:Math.round(this.rightDistanceMm/v),collision:h,accelerationMg:[_/9.80665,0,1e3],angularRateMdps:[0,0,(o-a)/this.config.trackWidthMm*(180/Math.PI)*1e3]},this.updateRange(),this.updateReflectance(),this.state}poseIsFree(e){let t=this.config.worldBounds,n=this.config.robotRadiusMm;return this.config.collideWithWorldBoundary!==!1&&(e.xMm<t.minimumXmm+n||e.xMm>t.maximumXmm-n||e.yMm<t.minimumYmm+n||e.yMm>t.maximumYmm-n)?!1:!this.config.obstacles.some(t=>me(e.xMm,e.yMm,t,n))}updateRange(){let e=this.currentState.pose,t=M(e,this.config.rangeSensorOffsetMm),n=[];for(let r of se){let i=e.headingRad+r,a=Math.cos(i),o=Math.sin(i);for(let e of this.config.obstacles){let r=he(t.xMm,t.yMm,a,o,e);r!==null&&r>=0&&n.push(r)}if(this.config.includeWorldBoundaryInRange){let e=he(t.xMm,t.yMm,a,o,this.config.worldBounds);e!==null&&e>=0&&n.push(e)}}let r=n.length>0?Math.min(...n):1/0;this.currentState.rangeMm=r<=this.config.maximumRangeMm?r:null}updateReflectance(){let e=ce(this.currentState.pose,this.config.reflectanceSensorForwardOffsetMm,this.config.reflectanceSensorLateralOffsetMm);this.currentState.leftReflectance=_e(e.left,this.config.tracks,this.config.reflectanceSensorFootprintRadiusMm),this.currentState.rightReflectance=_e(e.right,this.config.tracks,this.config.reflectanceSensorFootprintRadiusMm)}initialState(){return{tMs:0,seq:0,pose:{xMm:0,yMm:0,headingRad:0},leftEffort:0,rightEffort:0,leftWheelSpeedMmS:0,rightWheelSpeedMmS:0,leftEncoderCount:0,rightEncoderCount:0,collision:!1,rangeMm:null,leftReflectance:0,rightReflectance:0,buttonPressed:!1,accelerationMg:[0,0,1e3],angularRateMdps:[0,0,0],temperatureC:this.config.temperatureC,batteryV:this.config.batteryV}}},ye=`"""Small, typed course interface shared by the physical and virtual XRP."""

from .config import NavigationConfig, RobotConfig
from .maps import ArenaMap, OccupancyGrid, Rectangle
from .mission import DeliveryMission, DeliveryTask
from .records import (
    DriveCommand,
    GridCell,
    GridPath,
    Measurements,
    MotionCommand,
    MotorEfforts,
    NavigationGoal,
    Pose,
    RawSensors,
    ReflectanceReadings,
    RobotState,
    STOP_COMMAND,
    WheelSpeeds,
)
from .robot import Robot
from . import live
from .straight_line import StraightLineController
from .straight_trial import StraightTrialResult, run_straight_trial
from .student_api import (
    DifferentialDriveBase,
    GridPlannerBase,
    LineFollowerBase,
    NavigationControllerBase,
    OdometryBase,
    PoseCorrectorBase,
    RangeSafetyControllerBase,
    SensorModelBase,
    SensorProcessorBase,
    VisitOrderPlannerBase,
    WheelSpeedControllerBase,
)
from .utils import (
    bearing_to_goal,
    clamp,
    distance_to_goal,
    elapsed_time_s,
    wrap_angle_rad,
)
from .xrpbot import XRPBot
from .world import ProjectWorld, load_world

__version__ = "0.6.1-dev"

__all__ = (
    "ArenaMap",
    "DeliveryMission",
    "DeliveryTask",
    "DifferentialDriveBase",
    "DriveCommand",
    "GridCell",
    "GridPath",
    "GridPlannerBase",
    "LineFollowerBase",
    "NavigationConfig",
    "NavigationControllerBase",
    "RobotConfig",
    "OccupancyGrid",
    "OdometryBase",
    "PoseCorrectorBase",
    "RangeSafetyControllerBase",
    "Rectangle",
    "Measurements",
    "MotionCommand",
    "MotorEfforts",
    "NavigationGoal",
    "Pose",
    "ProjectWorld",
    "RawSensors",
    "ReflectanceReadings",
    "Robot",
    "RobotState",
    "SensorModelBase",
    "SensorProcessorBase",
    "STOP_COMMAND",
    "StraightLineController",
    "StraightTrialResult",
    "VisitOrderPlannerBase",
    "WheelSpeeds",
    "WheelSpeedControllerBase",
    "XRPBot",
    "bearing_to_goal",
    "clamp",
    "distance_to_goal",
    "elapsed_time_s",
    "wrap_angle_rad",
    "live",
    "load_world",
    "run_straight_trial",
)
`,be=`"""Build-time diagnostics for trusted course values and component operations.

Release builds omit recurring generic validation. A developer debug build sets
this constant to True before packaging; configuration and external admission
remain checked in either build, as does the final motor safety boundary.
"""

DEBUG_VALIDATION = False
`,xe=`"""Course ownership of XRPLib devices; no background motor or IMU reads.

The course provides its own wheel controller and samples devices in one owner
at a time. XRPLib's optional timer-driven speed controller and integrated IMU
angles are therefore unused here. Ordinary XRPLib programs remain unchanged
unless they acquire devices through this private course adapter.
"""

_course_imu = None
_imu_attempted = False
_imu_error = None
_course_rangefinder = None


def get_course_rangefinder():
    """Share ultrasound timing across idle reads and all course robot objects."""
    global _course_rangefinder
    if _course_rangefinder is None:
        from XRPLib.rangefinder import Rangefinder
        from ._range import RangeAcquisition

        _course_rangefinder = RangeAcquisition(Rangefinder.get_default_rangefinder())
    return _course_rangefinder


def _ignore_timer(*_args):
    pass


def get_course_motor(index):
    from XRPLib.encoded_motor import EncodedMotor

    motor = EncodedMotor.get_default_encoded_motor(index=index)
    timer = getattr(motor, "updateTimer", None)
    if timer is not None:
        # The timer lambda looks up _update when it executes. Retire that hook
        # too, so a callback queued before deinit cannot read the encoder later.
        motor.target_speed = None
        motor._update = _ignore_timer
        timer.deinit()
    return motor


def _retire_imu_timer(imu):
    timer = getattr(imu, "update_timer", None)
    if timer is not None:
        imu._update_imu_readings = _ignore_timer
        # XRPLib reset/calibrate/gyro_rate otherwise restart the same timer.
        imu._start_timer = _ignore_timer
        timer.deinit()


def get_course_imu(retry=False):
    """Return the optional IMU; retry failed initialization only on Reset."""
    global _course_imu, _imu_attempted, _imu_error
    if _imu_attempted and (_course_imu is not None or not retry):
        return _course_imu
    previous_error = _imu_error
    _imu_attempted = True
    imu_class = None
    try:
        from XRPLib.imu import IMU

        imu_class = IMU
        if previous_error is not None and hasattr(IMU, "_DEFAULT_IMU_INSTANCE"):
            # XRPLib publishes its singleton before calibration completes.
            # An explicit retry must initialize and calibrate a fresh device.
            IMU._DEFAULT_IMU_INSTANCE = None
        imu = IMU.get_default_imu()
        _retire_imu_timer(imu)
    except Exception as error:
        _imu_error = error
        # Failed calibration can leave a partially initialized singleton.
        # Retire any remaining timer without obscuring the original failure.
        try:
            _retire_imu_timer(getattr(imu_class, "_DEFAULT_IMU_INSTANCE", None))
        except Exception:
            pass
        _course_imu = None
        return None
    _imu_error = None
    _course_imu = imu
    return imu


def course_imu_error():
    return _imu_error


def read_imu_diagnostics(imu):
    """Acquire fresh vectors on the caller's core, never in a timer callback."""
    combined = getattr(imu, "get_acc_gyro_rates", None)
    if callable(combined):
        acceleration, angular_rate = combined()
    else:
        # The virtual driver exposes the same measurements as separate reads.
        acceleration = imu.get_acc_rates()
        angular_rate = imu.get_gyro_rates()
    return list(acceleration), list(angular_rate), float(imu.temperature())
`,I=`"""One course-owned ultrasound attempt stream, with no background work."""

from ._validation import isfinite

try:
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _ticks_ms():
        return int(monotonic() * 1000.0)

    def _ticks_diff(newer, older):
        return newer - older


# The HC-SR04-33 supplier recommends more than 60 ms between triggers.
# This interval is shared by physical and virtual course programs.
RANGE_INTERVAL_MS = 70
MAXIMUM_RANGE_MM = 4000.0
_scope = 0


def range_scope():
    return _scope


def begin_range_scope():
    """Discard previous-run identity without cancelling the acoustic cooldown."""
    global _scope
    _scope += 1


class RangeAcquisition:
    """Retain one completed attempt, including a missing echo, during cooldown."""

    __slots__ = ("_device", "_ticks_ms", "_ticks_diff", "_started_ms", "_error", "snapshot")

    def __init__(self, device, ticks_ms=None, ticks_diff=None):
        self._device = device
        self._ticks_ms = _ticks_ms if ticks_ms is None else ticks_ms
        self._ticks_diff = _ticks_diff if ticks_diff is None else ticks_diff
        self._started_ms = None
        self._error = None
        # Sequence, actual completion ticks, and millimetres or None.
        self.snapshot = (0, None, None)

    def read(self):
        now_ms = self._ticks_ms()
        if self._started_ms is not None:
            age_ms = self._ticks_diff(now_ms, self._started_ms)
            if 0 <= age_ms < RANGE_INTERVAL_MS:
                if self._error is not None:
                    raise self._error
                return self.snapshot

        self._started_ms = now_ms
        sequence = self.snapshot[0] + 1
        distance_mm = None
        self._error = None
        try:
            distance_cm = self._device.distance()
            if (
                isinstance(distance_cm, (int, float))
                and not isinstance(distance_cm, bool)
                and isfinite(float(distance_cm))
                and 0.0 < distance_cm <= MAXIMUM_RANGE_MM / 10.0
            ):
                distance_mm = float(distance_cm) * 10.0
        except Exception as error:
            self._error = error
            raise
        finally:
            # Faults also retire the old value and obey the trigger interval.
            # Unexpected hardware exceptions still propagate to stop the run.
            self.snapshot = (sequence, self._ticks_ms(), distance_mm)
        return self.snapshot
`,L=`"""Private cooperative stop signal used by the physical XRP service."""


class ProgramStopped(BaseException):
    """End a managed student program without reporting a program error."""


_stop_requested = False


def request_stop():
    global _stop_requested
    _stop_requested = True


def clear_stop():
    global _stop_requested
    _stop_requested = False


def check_stop():
    if _stop_requested:
        raise ProgramStopped()
`,R=`"""In-process pose channel shared with the optional browser target service."""

try:
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _ticks_ms():
        return int(monotonic() * 1000.0)

    def _ticks_diff(newer, older):
        return newer - older

import json
from .records import DriveCommand, RawSensors, RobotState
from ._build_config import DEBUG_VALIDATION
from ._range import begin_range_scope
from .live import _plot_sample_snapshot

try:
    import _thread
    _snapshot_lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _snapshot_lock = None

try:
    import xrp_sim_bridge as _browser_bridge
except ImportError:
    _browser_bridge = None

_publish_browser_state = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_course_state", None)
)
_publish_browser_raw = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_sensor_sample", None)
)

# Retain nearly two seconds of the 100 Hz course loop. This covers the brief
# interval in which the browser prioritizes Run or Stop over telemetry polling.
_BUFFER_SIZE = 192
_latest = None
_buffer = [None] * _BUFFER_SIZE
_buffer_write_index = 0
_buffer_count = 0
_sample_seq = 0
_sample_time_ms = 0
_last_sample_ticks_ms = None
_hardware_latest = None
_drive_latest = (0.0, 0.0)
_clock_ticks_ms = None
_clock_elapsed_ms = 0
_raw_seq = 0
_last_raw = None
_raw_timing = None
_range_seq = 0
_range_time_ms = None
_diagnostics_seq = 0
_diagnostics_time_ms = None
_diagnostics_latest = (None, None, None, None, None)
_course_samples = False
_range_sampled = False

# Producer frames contain values only. Names are expanded by the consumer after
# releasing the publication lock; frames and their nested sample tuples remain
# immutable even when the ring wraps or a new run resets its storage.
_COURSE_FIELDS = (
    "sampleSeq", "sampleTimeMs", "xMm", "yMm", "headingRad",
    "leftWheelSpeedMmS", "rightWheelSpeedMmS", "leftWheelDistanceMm",
    "rightWheelDistanceMm", "leftEncoderCount", "rightEncoderCount",
    "rangeMm", "buttonPressed", "leftReflectance", "rightReflectance",
    "leftEffort", "rightEffort", "requestedForwardSpeedMmS",
    "requestedTurnRateRadS", "targetLeftWheelSpeedMmS", "targetRightWheelSpeedMmS",
    "plotValues", "timing", "diagnostics",
)
_RAW_FIELDS = (
    "sampleSeq", "sampleTimeMs", "poseAvailable", "xMm", "yMm", "headingRad",
    "leftWheelSpeedMmS", "rightWheelSpeedMmS", "leftEncoderCount",
    "rightEncoderCount", "rangeMm", "buttonPressed", "leftEffort",
    "rightEffort", "plotValues", "timing", "diagnostics",
)
_HARDWARE_FIELDS = (
    "leftEncoderCount", "rightEncoderCount", "rangeMm", "buttonPressed",
    "leftReflectance", "rightReflectance", "accelerationMg", "angularRateMdps",
    "temperatureC", "batteryV", "sensorError",
)
_EMPTY_HARDWARE = (0, 0, None, False, None, None, None, None, None, None, None)


def _expand_frame(frame):
    fields = _COURSE_FIELDS if len(frame) == len(_COURSE_FIELDS) else _RAW_FIELDS
    return dict(zip(fields, frame))


def _acquire_snapshot():
    if _snapshot_lock is not None:
        _snapshot_lock.acquire()


def _release_snapshot():
    if _snapshot_lock is not None:
        _snapshot_lock.release()


def _elapsed_at(ticks_ms):
    """Unwrap nearby acquisition/publication ticks from the first acquisition."""
    global _clock_ticks_ms, _clock_elapsed_ms
    if _clock_ticks_ms is None:
        _clock_ticks_ms = ticks_ms
        return 0
    delta = _ticks_diff(ticks_ms, _clock_ticks_ms)
    elapsed = _clock_elapsed_ms + delta
    if delta >= 0:
        _clock_ticks_ms = ticks_ms
        _clock_elapsed_ms = elapsed
    return elapsed


def begin_course_samples():
    """Suppress a raw publication while Robot performs its current sensor read."""
    global _course_samples
    _course_samples = True


def end_course_samples():
    global _course_samples
    _course_samples = False


def _remember_acquisition(raw, range_sampled=False, diagnostics=None, range_seq=None):
    global _raw_seq, _last_raw, _raw_timing
    global _range_seq, _range_time_ms
    global _diagnostics_seq, _diagnostics_time_ms, _diagnostics_latest
    global _range_sampled
    if raw is _last_raw:
        return
    acquired_ms = _elapsed_at(raw.time_ms)
    _raw_seq += 1
    _last_raw = raw
    _range_sampled = range_sampled
    if range_sampled and range_seq is not None and range_seq != _range_seq:
        _range_seq = range_seq
        # The optional range read precedes the encoder timestamp. This is its
        # acquisition-completion upper bound, not a simultaneous sensor claim.
        # Requests during cooldown retain this attempt's identity and time.
        _range_time_ms = acquired_ms
    if diagnostics is not None:
        _diagnostics_seq += 1
        _diagnostics_time_ms = _elapsed_at(_ticks_ms())
        acceleration = diagnostics.get("accelerationMg")
        angular_rate = diagnostics.get("angularRateMdps")
        _diagnostics_latest = (
            None if acceleration is None else tuple(acceleration),
            None if angular_rate is None else tuple(angular_rate),
            diagnostics.get("temperatureC"), diagnostics.get("batteryV"),
            diagnostics.get("sensorError"),
        )
    _raw_timing = (
        raw.time_ms, acquired_ms, _raw_seq,
        _range_time_ms, _range_seq or None,
        _diagnostics_time_ms, _diagnostics_seq or None,
        raw.left_encoder_count, raw.right_encoder_count, raw.range_mm,
    )


def _publication_timing(kind, dt_ms=None, period_ms=None, overrun_ms=None):
    if _raw_timing is None:
        return None
    return _raw_timing + (_elapsed_at(_ticks_ms()), dt_ms, period_ms, overrun_ms, kind, _range_sampled)


def _retain_snapshot(snapshot):
    global _latest, _buffer_write_index, _buffer_count
    _acquire_snapshot()
    try:
        _latest = snapshot
        _buffer[_buffer_write_index] = snapshot
        _buffer_write_index = (_buffer_write_index + 1) % _BUFFER_SIZE
        if _buffer_count < _BUFFER_SIZE:
            _buffer_count += 1
    finally:
        _release_snapshot()


def publish_raw_sensors(
    raw_sensors,
    range_sampled=False,
    diagnostics=None,
    reflectance_sampled=False,
    range_seq=None,
):
    """Mirror hardware values already read by the student program.

    The browser service runs on the other RP2350 core and must not read the
    same encoder, I2C, or GPIO devices concurrently. Whole-tuple replacement
    lets the service observe current values without a second hardware access;
    only consumers expand it into the established dictionary schema.
    """
    global _hardware_latest
    if DEBUG_VALIDATION:
        if not isinstance(raw_sensors, RawSensors):
            raise TypeError("raw_sensors must be a RawSensors value")
        if not isinstance(range_sampled, bool):
            raise TypeError("range_sampled must be True or False")
        if not isinstance(reflectance_sampled, bool):
            raise TypeError("reflectance_sampled must be True or False")
    _remember_acquisition(raw_sensors, range_sampled, diagnostics, range_seq)
    previous = _EMPTY_HARDWARE if _hardware_latest is None else _hardware_latest
    reflectance = raw_sensors.reflectance
    acceleration = previous[6]
    angular_rate = previous[7]
    temperature = previous[8]
    battery = previous[9]
    error = previous[10]
    if diagnostics is not None:
        acceleration = diagnostics.get("accelerationMg", acceleration)
        angular_rate = diagnostics.get("angularRateMdps", angular_rate)
        temperature = diagnostics.get("temperatureC", temperature)
        battery = diagnostics.get("batteryV", battery)
        error = diagnostics.get("sensorError", error)
        # Freeze caller-owned vector lists before retaining them across cores.
        if acceleration is not None:
            acceleration = tuple(acceleration)
        if angular_rate is not None:
            angular_rate = tuple(angular_rate)
    snapshot = (
        raw_sensors.left_encoder_count, raw_sensors.right_encoder_count,
        raw_sensors.range_mm if range_sampled else previous[2],
        raw_sensors.button_pressed,
        (None if reflectance is None else reflectance.left) if reflectance_sampled else previous[4],
        (None if reflectance is None else reflectance.right) if reflectance_sampled else previous[5],
        acceleration, angular_rate, temperature, battery, error,
    )
    _acquire_snapshot()
    try:
        _hardware_latest = snapshot
    finally:
        _release_snapshot()
    if not _course_samples:
        sequence, elapsed = _next_sample_identity()
        drive = _drive_latest
        plots = _plot_sample_snapshot()
        timing = _publication_timing("raw")
        _retain_snapshot((
            sequence, elapsed, False, 0.0, 0.0, 0.0, 0.0, 0.0,
            raw_sensors.left_encoder_count, raw_sensors.right_encoder_count,
            raw_sensors.range_mm, raw_sensors.button_pressed,
            drive[0], drive[1], plots, timing, _diagnostics_latest,
        ))
        if _publish_browser_raw is not None:
            try:
                publication = {"timing": timing, "diagnostics": _diagnostics_latest}
                if plots:
                    publication["plots"] = [
                        {"name": name, "label": label, "unit": unit, "value": value}
                        for name, label, unit, value in plots
                    ]
                _publish_browser_raw(json.dumps(publication))
            except Exception:
                # A diagnostic bridge failure must not stop sensor acquisition.
                pass


def publish_drive_command(command):
    """Mirror the latest logical motor command without touching hardware."""
    if DEBUG_VALIDATION and not isinstance(command, DriveCommand):
        raise TypeError("command must be a DriveCommand")
    publish_drive_values(command.left, command.right)


def publish_drive_values(left, right):
    """Mirror scalar logical efforts already checked by the motor boundary."""
    global _drive_latest, _hardware_latest
    drive = (left, right)
    _acquire_snapshot()
    try:
        _drive_latest = drive
        if _hardware_latest is None:
            _hardware_latest = _EMPTY_HARDWARE
    finally:
        _release_snapshot()


def hardware_snapshot():
    """Return the latest student-thread hardware mirror for the service."""
    _acquire_snapshot()
    try:
        hardware, drive = _hardware_latest, _drive_latest
    finally:
        _release_snapshot()
    if hardware is None:
        return None
    snapshot = dict(zip(_HARDWARE_FIELDS, hardware))
    snapshot["leftEffort"] = drive[0]
    snapshot["rightEffort"] = drive[1]
    return snapshot


def _next_sample_identity():
    """Return a sequence and elapsed time for one published robot sample."""
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    now = _ticks_ms()
    if _last_sample_ticks_ms is not None:
        elapsed = _ticks_diff(now, _last_sample_ticks_ms)
        if elapsed > 0:
            _sample_time_ms += elapsed
    _last_sample_ticks_ms = now
    _sample_seq += 1
    return _sample_seq, _sample_time_ms


def publish_state(
    state,
    drive_command=None,
    motion_command=None,
    target_wheel_speeds=None,
    raw_sensors=None,
    sample_period_ms=None,
    overrun_ms=None,
    kind="course",
    wheel_control_values=None,
):
    if DEBUG_VALIDATION:
        if not isinstance(state, RobotState):
            raise TypeError("state must be a RobotState")
        if drive_command is not None and not isinstance(drive_command, DriveCommand):
            raise TypeError("drive_command must be a DriveCommand value or None")
        if raw_sensors is not None and not isinstance(raw_sensors, RawSensors):
            raise TypeError("raw_sensors must be a RawSensors value or None")
    if raw_sensors is not None:
        _remember_acquisition(raw_sensors)
    requested_forward = (
        None if motion_command is None else motion_command.forward_speed_mm_s
    )
    requested_turn = None if motion_command is None else motion_command.turn_rate_rad_s
    target_left = (
        None if target_wheel_speeds is None else target_wheel_speeds.left_mm_s
    )
    target_right = (
        None if target_wheel_speeds is None else target_wheel_speeds.right_mm_s
    )
    if wheel_control_values is None:
        drive_left = 0.0 if drive_command is None else drive_command.left
        drive_right = 0.0 if drive_command is None else drive_command.right
    else:
        # Copy the prepared control workspace's scalars into this acquisition;
        # the next iteration may reuse the workspace immediately after return.
        target_left, target_right = wheel_control_values[0], wheel_control_values[1]
        drive_left, drive_right = wheel_control_values[2], wheel_control_values[3]
    sample_seq, sample_time_ms = _next_sample_identity()
    measurements = state.measurements
    pose = state.pose
    reflectance = measurements.reflectance
    plots = _plot_sample_snapshot()
    timing = _publication_timing(kind, measurements.dt_s * 1000.0, sample_period_ms, overrun_ms)
    snapshot = (
        sample_seq, sample_time_ms, pose.x_mm, pose.y_mm, pose.heading_rad,
        measurements.left_speed_mm_s, measurements.right_speed_mm_s,
        measurements.left_position_mm, measurements.right_position_mm,
        None if raw_sensors is None else raw_sensors.left_encoder_count,
        None if raw_sensors is None else raw_sensors.right_encoder_count,
        measurements.range_mm, measurements.button_pressed,
        None if reflectance is None else reflectance.left,
        None if reflectance is None else reflectance.right,
        drive_left, drive_right,
        requested_forward, requested_turn, target_left, target_right,
        plots, timing, _diagnostics_latest,
    )
    # A short lock commits the immutable frame and its ordered ring position.
    _retain_snapshot(snapshot)
    if _publish_browser_state is not None:
        try:
            _publish_browser_state(
                state.pose.x_mm,
                state.pose.y_mm,
                state.pose.heading_rad,
                state.measurements.left_speed_mm_s,
                state.measurements.right_speed_mm_s,
                state.measurements.left_position_mm,
                state.measurements.right_position_mm,
                requested_forward,
                requested_turn,
                target_left,
                target_right,
                json.dumps([
                    {"name": name, "label": label, "unit": unit, "value": value}
                    for name, label, unit, value in plots
                ]),
                json.dumps({"timing": timing, "diagnostics": _diagnostics_latest}),
            )
        except Exception:
            # Diagnostics must never stop a student control loop.
            pass


def state_snapshot():
    _acquire_snapshot()
    try:
        latest = _latest
    finally:
        _release_snapshot()
    return None if latest is None else _expand_frame(latest)


def buffered_state_snapshots(after_sample_seq=0):
    """Return retained robot samples newer than \`\`after_sample_seq\`\`.

    Copy only requested committed frame references while holding the lock.
    Expand their established dictionary schema afterward. Returned dictionaries
    are consumer-owned; changing them cannot mutate retained acquisition data.
    """
    try:
        after_sample_seq = int(after_sample_seq)
    except (TypeError, ValueError):
        after_sample_seq = 0
    _acquire_snapshot()
    try:
        if _latest is None:
            retained = ()
        else:
            latest_seq = _latest[0]
            # Sequences normally advance by one. An allocation/bridge-preparation
            # failure can consume a sequence before its frame is committed.
            # The sequence span is an upper bound on the number of new frames;
            # copy that bounded suffix, then filter any older references below.
            count = max(0, min(_buffer_count, latest_seq - after_sample_seq))
            start = (_buffer_write_index - count) % _BUFFER_SIZE
            retained = tuple(_buffer[(start + index) % _BUFFER_SIZE] for index in range(count))
    finally:
        _release_snapshot()
    return tuple(_expand_frame(frame) for frame in retained if frame[0] > after_sample_seq)


def clear_state():
    global _latest, _buffer, _buffer_write_index, _buffer_count
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    global _hardware_latest, _drive_latest
    global _clock_ticks_ms, _clock_elapsed_ms, _raw_seq, _last_raw, _raw_timing
    global _range_seq, _range_time_ms, _diagnostics_seq, _diagnostics_time_ms
    global _diagnostics_latest, _course_samples
    global _range_sampled
    begin_range_scope()
    empty_buffer = [None] * _BUFFER_SIZE
    _acquire_snapshot()
    try:
        _latest = None
        _buffer = empty_buffer
        _buffer_write_index = 0
        _buffer_count = 0
        _hardware_latest = None
        _drive_latest = (0.0, 0.0)
    finally:
        _release_snapshot()
    _sample_seq = 0
    _sample_time_ms = 0
    _last_sample_ticks_ms = None
    _clock_ticks_ms = None
    _clock_elapsed_ms = 0
    _raw_seq = 0
    _last_raw = None
    _raw_timing = None
    _range_seq = 0
    _range_time_ms = None
    _diagnostics_seq = 0
    _diagnostics_time_ms = None
    _diagnostics_latest = (None, None, None, None, None)
    _course_samples = False
    _range_sampled = False
`,z=`"""Small validation helpers shared by the MicroPython course package."""

try:
    from math import isfinite
except ImportError:  # pragma: no cover - retained for minimal MicroPython ports
    def isfinite(value):
        return value == value and value != float("inf") and value != -float("inf")


def require_number(name, value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError("{} must be a real number".format(name))
    value = float(value)
    if not isfinite(value):
        raise ValueError("{} must be finite".format(name))
    return value


def require_nonnegative(name, value):
    value = require_number(name, value)
    if value < 0.0:
        raise ValueError("{} must be nonnegative".format(name))
    return value


def require_positive(name, value):
    value = require_number(name, value)
    if value <= 0.0:
        raise ValueError("{} must be greater than zero".format(name))
    return value


def require_int(name, value, minimum=None):
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError("{} must be an integer".format(name))
    if minimum is not None and value < minimum:
        raise ValueError("{} must be at least {}".format(name, minimum))
    return value


def require_bool(name, value):
    if not isinstance(value, bool):
        raise TypeError("{} must be True or False".format(name))
    return value


def require_sign(name, value):
    value = require_int(name, value)
    if value != -1 and value != 1:
        raise ValueError("{} must be -1 or +1".format(name))
    return value


def require_optional_positive(name, value):
    if value is None:
        return None
    return require_positive(name, value)

`,Se=`"""Finite, quantity-aware comparison helpers for hardware-free student checks."""

_ABSOLUTE = {"mm": 0.001, "mm/s": 0.01, "s": 0.0001,
             "rad": 0.0001, "rad/s": 0.0001, "dimensionless": 0.0001}


def format_number(value):
    if not isinstance(value, (float, int)) or isinstance(value, bool):
        return str(value)
    if value == 0:
        return "0"
    return "{:.3g}".format(value)


def finite_number(label, value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AssertionError("{} must be a finite real number; received {} ({}). Check the returned field, its units, and the return statement.".format(
            label, value, type(value).__name__))
    if value != value or abs(value) == float("inf"):
        raise AssertionError("{} must be finite; received {}. Check division, elapsed time, and intermediate calculations.".format(label, value))
    return value


def comparison(label, actual, expected, units="mm", absolute=None, exact=False):
    finite_number(label, actual)
    finite_number(label + " expected", expected)
    floor = _ABSOLUTE[units] if absolute is None else absolute
    relative = 0.0 if exact else 0.005
    allowed = 0.0 if exact else max(floor, relative * abs(expected))
    difference = actual - expected
    if units == "rad":
        from math import pi
        difference = (difference + pi) % (2 * pi) - pi
    passed = abs(difference) <= allowed
    difference_label = "wrapped angular difference" if units == "rad" else "difference (received minus expected)"
    message = (
        "{}: expected {} {}, received {} {}. The {} "
        "is {} {}; the allowed absolute error is {} {}. "
        "Check the named field, unit conversion, and inputs shown for this method."
    ).format(label, format_number(expected), units, format_number(actual), units,
             difference_label, format_number(difference), units, format_number(allowed), units)
    return {"field": label, "actual": actual, "expected": expected, "units": units,
            "difference": difference, "tolerance": {"absolute": 0.0 if exact else floor,
            "relative": relative, "allowed": allowed}, "passed": passed, "message": message}


def assert_close(actual, expected, units="mm", label="calculated value", absolute=None, exact=False):
    detail = comparison(label, actual, expected, units, absolute, exact)
    if not detail["passed"]:
        raise AssertionError(detail["message"])
`,B=`"""Supplied hardware-free checks for course component implementations."""

from math import cos, pi, sin

from .config import NavigationConfig, RobotConfig
from .maps import OccupancyGrid
from .records import (
    DriveCommand,
    Measurements,
    ReflectanceReadings,
    GridCell,
    GridPath,
    MotionCommand,
    NavigationGoal,
    Pose,
    RawSensors,
    WheelSpeeds,
)


# These bands check software calculations, not physical sensor accuracy.
from .check_support import comparison, finite_number, format_number

_report_callback = None
_report = None
_active_case = None


def get_check_report():
    """Return the latest JSON-safe report; None means no shared checks ran."""
    return _report


def _publish():
    if _report_callback is not None:
        import json
        _report_callback(json.dumps(_report))


def _data(value):
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if value == value and abs(value) != float("inf") else str(value)
    if isinstance(value, (tuple, list)):
        return [_data(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _data(item) for key, item in value.items()}
    fields = getattr(value, "_field_names", ())
    if not fields:
        fields = getattr(value, "__slots__", ())
    if fields:
        return {name.lstrip("_"): _data(getattr(value, name)) for name in fields}
    return str(value)


def _units(label):
    if "mm/s" in label or "speed_mm_s" in label:
        return "mm/s"
    if "rad/s" in label:
        return "rad/s"
    if "rad" in label:
        return "rad"
    if "dt_s" in label or "time_s" in label:
        return "s"
    if "mm" in label:
        return "mm"
    return "dimensionless"


def _close(label, actual, expected, tolerance=None, exact=False):
    units = _units(label)
    detail = comparison(label, actual, expected, units, tolerance, exact)
    if _active_case is not None:
        _active_case["observations"].append(detail)
        _active_case.update({"actual": _data(actual), "units": units,
                             "tolerance": detail["tolerance"]})
    if not detail["passed"]:
        raise AssertionError(detail["message"])


def _change(label, earlier, later, direction, deadband, units, context=None):
    finite_number(label + " earlier", earlier)
    finite_number(label + " later", later)
    delta = later - earlier
    passed = direction * delta > deadband
    earlier_label = context["earlier_label"] if context else "earlier"
    later_label = context["later_label"] if context else "later"
    message = (
        "{}: {} {} {}, {} {} {}; change {} {}. This example requires "
        "{} greater than {} {}. Compare the input samples, elapsed intervals, "
        "and response settings; the signs of the two outputs do not determine "
        "their direction of change."
    ).format(label, earlier_label, format_number(earlier), units,
             later_label, format_number(later), units,
             format_number(delta), units, "an increase" if direction > 0 else "a decrease",
             format_number(deadband), units)
    if _active_case is not None:
        _active_case.update({"actual": later, "units": units, "tolerance": {"deadband": deadband}})
        if context is not None:
            _active_case["comparison_context"] = _data(context)
            _active_case["source"]["method"] = context["method"]
        _active_case["observations"].append({"field": label, "actual": later,
            "earlier": earlier, "difference": delta, "units": units,
            "expected": "increase" if direction > 0 else "decrease",
            "tolerance": {"deadband": deadband}, "passed": passed, "message": message,
            "context": _data(context)})
    if not passed:
        raise AssertionError(message)


def _record(value, expected_type, method):
    if not isinstance(value, expected_type):
        raise AssertionError("{}() must return {}; received {} ({}). Check the return statement and required record fields.".format(
            method, expected_type.__name__, _data(value), type(value).__name__))
    for name in value._field_names:
        field = getattr(value, name)
        if name in ("range_mm", "reflectance") and field is None:
            continue
        if name == "button_pressed":
            if not isinstance(field, bool):
                raise AssertionError("Measurements.button_pressed must be Boolean; its returned type was {}. Preserve raw.button_pressed without converting it to a number.".format(type(field).__name__))
        elif name == "time_ms":
            if isinstance(field, bool) or not isinstance(field, int):
                raise AssertionError("Measurements.time_ms must be an integer timestamp. Preserve raw.time_ms without converting it to seconds.")
        elif name == "reflectance":
            _record(field, ReflectanceReadings, method)
        else:
            finite_number(method + "()." + name, field)
    if expected_type is Pose and not -pi <= value.heading_rad < pi:
        raise AssertionError("Pose.heading_rad must be represented in [-pi, pi); wrap the updated heading.")
    return value


class _CheckedInstance:
    """Capture fixture calls and validate returned records before arithmetic."""
    def __init__(self, instance, contract):
        self.instance = instance
        self.contract = contract
        self.previous_raw = None

    def __getattr__(self, name):
        value = getattr(self.instance, name)
        if not callable(value):
            return value
        def call(*args):
            entry = {"method": name, "args": _data(args)}
            if self.contract in ("sensor_model", "reflectance") and name in ("reset", "update"):
                if name == "update" and self.previous_raw is not None:
                    entry["previous"] = _data(self.previous_raw)
                self.previous_raw = args[0]
            _active_case["source"]["method"] = name
            inputs = _active_case["inputs"]
            inputs.append(entry)
            if len(inputs) > 64:
                inputs.pop(4)
                _active_case["omitted_inputs"] = _active_case.get("omitted_inputs", 0) + 1
            _active_case.pop("comparison_context", None)
            _active_case.update({"actual": None, "units": None, "tolerance": None})
            result = value(*args)
            entry["result"] = _data(result)
            _active_case["actual"] = entry["result"]
            expected_type = None
            if self.contract in ("sensor_model", "reflectance") and name in ("reset", "update"):
                expected_type = Measurements
            elif self.contract in ("odometry", "pose_corrector") and name in ("reset", "update", "observe_x", "observe_y", "corrected_pose"):
                expected_type = Pose
            elif self.contract == "differential_drive" and name == "wheel_speeds":
                expected_type = WheelSpeeds
            elif self.contract == "wheel_speed_controller" and name == "update":
                expected_type = DriveCommand
            elif self.contract in ("navigation_controller", "line_follower") and name == "update":
                expected_type = MotionCommand
            if expected_type is not None:
                _record(result, expected_type, name)
            elif self.contract == "range_safety_controller" and name == "update":
                finite_number("update() result (mm/s)", result)
            elif self.contract == "range_estimator" and name == "estimate_range" and result is not None:
                finite_number("estimate_range() result (mm)", result)
            elif name == "is_complete" and not isinstance(result, bool):
                raise AssertionError("NavigationController.is_complete() must return a Boolean. Return True when the route is complete and False otherwise.")
            return result
        return call


def _factory(component_class, contract):
    def construct(*args):
        _active_case["configuration"] = _data(args)
        _active_case["inputs"].append({"method": "__init__", "args": _data(args)})
        instance = component_class(*args)
        if contract in ("range_safety_controller", "pose_corrector", "visit_order_planner"):
            from .student_api import RangeSafetyControllerBase, PoseCorrectorBase, VisitOrderPlannerBase
            base = {"range_safety_controller": RangeSafetyControllerBase,
                    "pose_corrector": PoseCorrectorBase, "visit_order_planner": VisitOrderPlannerBase}[contract]
            if not isinstance(instance, base):
                raise AssertionError("The component class must extend " + base.__name__ + ".")
        return _CheckedInstance(instance, contract)
    return construct


def _sensor_model(component_class):
    config = RobotConfig(
        sample_period_ms=20,
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=600.0,
        left_encoder_sign=-1,
        right_encoder_sign=1,
        wheel_speed_filter_time_constant_ms=80.0,
    )
    model = component_class(config)
    zero = model.reset(RawSensors(100, 10, 20, 500.0, False))
    _close("reset dt_s", zero.dt_s, 0.0, exact=True)
    _close("reset left position (mm)", zero.left_position_mm, 0.0, exact=True)
    _close("reset right position (mm)", zero.right_position_mm, 0.0, exact=True)
    _close("reset left increment (mm)", zero.left_increment_mm, 0.0, exact=True)
    _close("reset right increment (mm)", zero.right_increment_mm, 0.0, exact=True)
    _close("reset left speed (mm/s)", zero.left_speed_mm_s, 0.0, exact=True)
    _close("reset right speed (mm/s)", zero.right_speed_mm_s, 0.0, exact=True)
    _close("preserved reset range (mm)", zero.range_mm, 500.0, exact=True)
    if zero.time_ms != 100 or zero.button_pressed is not False:
        raise AssertionError("reset() must preserve raw.time_ms=100 and raw.button_pressed=False exactly.")
    measured = model.update(RawSensors(125, 9, 21, 450.0, True))
    if measured.time_ms != 125:
        raise AssertionError("update() must preserve raw.time_ms=125 exactly.")
    _close("update dt_s from device time", measured.dt_s, 0.025)
    _close("left position (mm)", measured.left_position_mm, pi / 10.0)
    _close("right position (mm)", measured.right_position_mm, pi / 10.0)
    _close("left increment (mm)", measured.left_increment_mm, pi / 10.0)
    _close("right increment (mm)", measured.right_increment_mm, pi / 10.0)
    if measured.button_pressed is not True:
        raise AssertionError("SensorProcessor.update() did not preserve the USER button state. Return raw.button_pressed in Measurements.button_pressed.")
    _close("preserved update range (mm)", measured.range_mm, 450.0, exact=True)

    next_measured = model.update(RawSensors(165, 7, 23, None, False))
    if next_measured.range_mm is not None or next_measured.button_pressed is not False or next_measured.time_ms != 165:
        raise AssertionError("update() must preserve missing range as None, button False, and timestamp 165 exactly.")
    _close("next dt_s from device time", next_measured.dt_s, 0.04)
    _close("cumulative left position (mm)", next_measured.left_position_mm, 3.0 * pi / 10.0)
    _close("latest left increment (mm)", next_measured.left_increment_mm, 2.0 * pi / 10.0)
    _close("cumulative right position (mm)", next_measured.right_position_mm, 3.0 * pi / 10.0)
    _close("latest right increment (mm)", next_measured.right_increment_mm, 2.0 * pi / 10.0)
    # A second geometry and sign convention makes this a behavior check rather
    # than a fixture whose few numerical answers can be memorized.
    varied_model = component_class(
        RobotConfig(
            sample_period_ms=30,
            wheel_diameter_mm=40.0,
            encoder_counts_per_revolution=400.0,
            left_encoder_sign=1,
            right_encoder_sign=-1,
            wheel_speed_filter_time_constant_ms=60.0,
        )
    )
    varied_model.reset(RawSensors(900, -5, 12, None, False))
    varied = varied_model.update(RawSensors(930, -1, 8, 525.0, True))
    _close("varied-config dt_s", varied.dt_s, 0.03)
    _close("varied-config left position (mm)", varied.left_position_mm, 2.0 * pi / 5.0)
    _close("varied-config right position (mm)", varied.right_position_mm, 2.0 * pi / 5.0)
    _close("varied-config left increment (mm)", varied.left_increment_mm, 2.0 * pi / 5.0)
    _close("varied-config right increment (mm)", varied.right_increment_mm, 2.0 * pi / 5.0)
    _close("varied-config preserved range (mm)", varied.range_mm, 525.0, exact=True)
    if varied.button_pressed is not True:
        raise AssertionError("SensorProcessor.update() did not preserve the USER button state with the second fixture configuration. Return raw.button_pressed in Measurements.button_pressed.")
    _sensor_speed_sequences(component_class)
    return (
        "update() used elapsed intervals of {:.3g} and {:.3g} s. "
        "It returned left/right positions of {:.3g}/{:.3g} mm and latest "
        "increments of {:.3g}/{:.3g} mm. The first two left speed estimates "
        "were {:.3g} and {:.3g} mm/s; the right estimates were {:.3g} and {:.3g} mm/s. "
        "The second geometry produced left/right positions of {:.3g}/{:.3g} mm. "
        "The subsequent warm-up, response, stationary, reversal and reset examples also passed."
    ).format(
        measured.dt_s,
        next_measured.dt_s,
        next_measured.left_position_mm,
        next_measured.right_position_mm,
        next_measured.left_increment_mm,
        next_measured.right_increment_mm,
        measured.left_speed_mm_s,
        next_measured.left_speed_mm_s,
        measured.right_speed_mm_s,
        next_measured.right_speed_mm_s,
        varied.left_position_mm,
        varied.right_position_mm,
    )


def _wheel_speed_controller(component_class):
    config = RobotConfig(
        left_start_command=0.1,
        right_start_command=0.1,
        left_speed_command_gain=0.002,
        right_speed_command_gain=0.002,
        wheel_speed_kp=0.001,
        max_drive_command=0.6,
    )
    controller = component_class(config)
    controller.reset()
    close_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(80.0, -80.0),
    )
    if not isinstance(close_command, DriveCommand):
        raise AssertionError("WheelSpeedController.update() must return a DriveCommand containing the left and right normalized motor commands.")
    if close_command.left <= 0.0 or close_command.right >= 0.0:
        raise AssertionError(
            (
                "For the requested wheel speeds, update() must produce a positive left command and a negative right command. "
                "It returned left={} and right={}. Check each requested-speed sign."
            ).format(
                format_number(close_command.left), format_number(close_command.right)
            )
        )
    if abs(close_command.left) > 0.6 or abs(close_command.right) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a command outside the configured max_drive_command limit. Limit both motor commands in both directions.")
    controller.reset()
    underspeed_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(20.0, -20.0),
    )
    _change("left command response to larger positive speed error", close_command.left,
            underspeed_command.left, 1, 0.0001, "normalized command")
    _change("right command response to larger negative speed error", close_command.right,
            underspeed_command.right, -1, 0.0001, "normalized command")
    if abs(underspeed_command.left) > 0.6 or abs(underspeed_command.right) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a command outside the configured max_drive_command limit. Limit both motor commands in both directions.")
    controller.reset()
    stopped = controller.update(
        WheelSpeeds(0.0, 0.0),
        WheelSpeeds(20.0, -20.0),
    )
    if stopped.left != 0.0 or stopped.right != 0.0:
        raise AssertionError(
            "For zero wheel-speed targets, update() must return left=0.0 and right=0.0. It returned left={} and right={}. Handle a zero target before applying the starting command.".format(
                format_number(stopped.left), format_number(stopped.right)
            )
        )
    controller.reset()
    reverse_and_stop = controller.update(
        WheelSpeeds(-70.0, 0.0),
        WheelSpeeds(-40.0, 35.0),
    )
    if reverse_and_stop.left >= 0.0:
        raise AssertionError(
            "For the reverse left-wheel target, update() must return a negative left command. It returned {}. Check the requested-speed sign.".format(
                format_number(reverse_and_stop.left)
            )
        )
    if reverse_and_stop.right != 0.0:
        raise AssertionError(
            "For the stopped right wheel, update() must return right=0.0 even when the left wheel reverses. It returned {}. Apply the zero-target rule separately to each wheel.".format(
                format_number(reverse_and_stop.right)
            )
        )
    if abs(reverse_and_stop.left) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a reverse command outside max_drive_command. Apply the configured limit to negative as well as positive commands.")
    return (
        "For left/right targets of +100/-100 mm/s, update() returned normalized "
        "commands of {:.3g}/{:.3g} at measured speeds of +80/-80 mm/s and "
        "{:.3g}/{:.3g} at +20/-20 mm/s. Zero targets produced exact zero commands. "
        "The reverse-left/stop-right request produced {:.3g}/0."
    ).format(
        close_command.left,
        close_command.right,
        underspeed_command.left,
        underspeed_command.right,
        reverse_and_stop.left,
    )


def _range_estimator(component_class):
    model = component_class(RobotConfig())
    samples = (
        None,
        True,
        400.0,
        float("nan"),
        float("inf"),
        -2.0,
        100.0,
        300.0,
        200.0,
    )
    _close("mixed-sample median (mm)", model.estimate_range(samples, 3), 250.0)
    if model.estimate_range(samples, 5) is not None:
        raise AssertionError("SensorProcessor.estimate_range() must return None when too few usable readings remain. Count readings after rejecting invalid samples.")
    _close("odd-count median (mm)", model.estimate_range((500.0, 100.0, 300.0), 3), 300.0)
    _close("even-count median (mm)", model.estimate_range((500.0, 100.0, 300.0, 200.0), 4), 250.0)
    try:
        model.estimate_range((100.0,), 0)
    except (TypeError, ValueError):
        pass
    else:
        raise AssertionError("SensorProcessor.estimate_range() must reject minimum_usable=0 with TypeError or ValueError. Validate the minimum count before selecting a median.")
    return "estimate_range() returned 250 mm for the mixed samples and 300/250 mm for the odd/even sample sets. It returned None when too few usable readings remained and rejected a zero minimum count."


def _differential_drive(component_class):
    drive = component_class(RobotConfig(track_width_mm=100.0))
    straight = drive.wheel_speeds(MotionCommand(80.0, 0.0))
    _close("straight left target (mm/s)", straight.left_mm_s, 80.0)
    _close("straight right target (mm/s)", straight.right_mm_s, 80.0)
    speeds = drive.wheel_speeds(MotionCommand(100.0, 2.0))
    _close("moving-turn left target (mm/s)", speeds.left_mm_s, 0.0)
    _close("moving-turn right target (mm/s)", speeds.right_mm_s, 200.0)
    turn = drive.wheel_speeds(MotionCommand(0.0, -1.0))
    _close("right-turn left target (mm/s)", turn.left_mm_s, 50.0)
    _close("right-turn right target (mm/s)", turn.right_mm_s, -50.0)
    wide_drive = component_class(RobotConfig(track_width_mm=140.0))
    reverse_curve = wide_drive.wheel_speeds(MotionCommand(-30.0, 0.5))
    _close("varied-track left target (mm/s)", reverse_curve.left_mm_s, -65.0)
    _close("varied-track right target (mm/s)", reverse_curve.right_mm_s, 5.0)
    return (
        "wheel_speeds() returned left/right targets of 80/80 mm/s for straight "
        "motion, 0/200 mm/s for the moving turn, and 50/-50 mm/s for the in-place "
        "right turn. With a 140 mm track width, the reverse curve produced -65/5 mm/s."
    )


def _odometry(component_class):
    odometry = component_class(RobotConfig(track_width_mm=100.0))
    initial = odometry.reset(Pose(0.0, 0.0, 0.0))
    if initial != Pose(0.0, 0.0, 0.0) or odometry.pose != initial:
        raise AssertionError("Odometry.reset() must return the initial Pose and expose the same value through the pose property. Store the supplied initial pose before integrating increments.")
    pose = odometry.update(10.0, 10.0)
    _close("straight x (mm)", pose.x_mm, 10.0)
    _close("straight y (mm)", pose.y_mm, 0.0)
    _close("straight heading (rad)", pose.heading_rad, 0.0)
    odometry.reset(Pose(0.0, 0.0, 0.0))
    turn = odometry.update(-50.0, 50.0)
    _close("in-place turn x (mm)", turn.x_mm, 0.0)
    _close("in-place turn y (mm)", turn.y_mm, 0.0)
    _close("in-place turn heading (rad)", turn.heading_rad, 1.0)
    odometry.reset(Pose(0.0, 0.0, 0.0))
    curve = odometry.update(0.0, 100.0)
    expected_radius_mm = 50.0
    _close("curved x (mm)", curve.x_mm, expected_radius_mm * sin(1.0), 0.05)
    _close(
        "curved y (mm)",
        curve.y_mm,
        expected_radius_mm * (1.0 - cos(1.0)),
        0.05,
    )
    _close("curved heading (rad)", curve.heading_rad, 1.0)
    if odometry.pose != curve:
        raise AssertionError("Odometry.pose must contain the latest Pose returned by update(). Store the updated estimate as well as returning it.")

    varied_start = Pose(20.0, -30.0, 3.0)
    odometry.reset(varied_start)
    wrapped_curve = odometry.update(-10.0, 20.0)
    heading_change = 0.3
    radius_mm = 5.0 / heading_change
    unwrapped_heading = varied_start.heading_rad + heading_change
    expected_x_mm = varied_start.x_mm + radius_mm * (
        sin(unwrapped_heading) - sin(varied_start.heading_rad)
    )
    expected_y_mm = varied_start.y_mm - radius_mm * (
        cos(unwrapped_heading) - cos(varied_start.heading_rad)
    )
    expected_wrapped = Pose(expected_x_mm, expected_y_mm, unwrapped_heading)
    _close("varied-start curved x (mm)", wrapped_curve.x_mm, expected_wrapped.x_mm)
    _close("varied-start curved y (mm)", wrapped_curve.y_mm, expected_wrapped.y_mm)
    _close(
        "varied-start wrapped heading (rad)",
        wrapped_curve.heading_rad,
        expected_wrapped.heading_rad,
    )
    return (
        "update() placed the robot at x=10 mm, y=0 mm, heading=0 rad after "
        "straight travel and produced a 1 rad heading after the in-place turn. "
        "The curved motion produced x={:.3g} mm, y={:.3g} mm, heading={:.3g} rad. "
        "From the nonzero initial pose, it produced x={:.3g} mm, y={:.3g} mm, "
        "heading={:.3g} rad."
    ).format(
        curve.x_mm,
        curve.y_mm,
        curve.heading_rad,
        wrapped_curve.x_mm,
        wrapped_curve.y_mm,
        wrapped_curve.heading_rad,
    )


def _navigation_controller(component_class):
    config = NavigationConfig(
        cruise_speed_mm_s=120.0,
        approach_speed_mm_s=50.0,
        slowdown_distance_mm=150.0,
        turn_rate_rad_s=0.8,
        position_tolerance_mm=10.0,
        heading_tolerance_rad=0.08,
        realign_heading_rad=0.25,
    )
    navigation = component_class(config)
    navigation.start(())
    if not navigation.is_complete() or navigation.current_goal() is not None:
        raise AssertionError("After start() receives an empty route, is_complete() must return True and current_goal() must return None. Handle the empty route before selecting a goal.")
    stopped = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("empty-route forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0, exact=True)
    _close("empty-route turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0, exact=True)

    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if not isinstance(command, MotionCommand):
        raise AssertionError("NavigationController.update() must return a MotionCommand containing forward_speed_mm_s and turn_rate_rad_s.")
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("NavigationController.update() must request positive forward speed for this goal straight ahead. Check the position and heading errors before choosing a motion command.")
    if navigation.current_goal() != NavigationGoal(200.0, 0.0):
        raise AssertionError("NavigationController.current_goal() must return the active NavigationGoal. Keep the current route index consistent with start() and update().")

    near_navigation = component_class(config)
    near_navigation.start((NavigationGoal(100.0, 0.0),))
    near_command = near_navigation.update(Pose(0.0, 0.0, 0.0))
    _close(
        "near-goal forward speed (mm/s)",
        near_command.forward_speed_mm_s,
        config.approach_speed_mm_s,
    )

    side_navigation = component_class(config)
    side_navigation.start((NavigationGoal(0.0, 200.0),))
    side_turn = side_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("side-goal forward speed (mm/s)", side_turn.forward_speed_mm_s, 0.0, exact=True)
    if side_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            "For the goal on the left, update() must request a positive turn_rate_rad_s. It returned {} rad/s. Check the bearing-minus-heading error and its sign.".format(
                format_number(side_turn.turn_rate_rad_s)
            )
        )

    right_navigation = component_class(config)
    right_navigation.start((NavigationGoal(0.0, -200.0),))
    right_turn = right_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("right-goal forward speed (mm/s)", right_turn.forward_speed_mm_s, 0.0, exact=True)
    if right_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "For the goal on the right, update() must request a negative turn_rate_rad_s. It returned {} rad/s. Check the bearing-minus-heading error and its sign.".format(
                format_number(right_turn.turn_rate_rad_s)
            )
        )

    wrap_navigation = component_class(config)
    wrap_navigation.start((NavigationGoal(-200.0, -10.0),))
    wrap_turn = wrap_navigation.update(Pose(0.0, 0.0, pi - 0.05))
    _close("wrapped-goal forward speed (mm/s)", wrap_turn.forward_speed_mm_s, 0.0, exact=True)
    if wrap_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            (
                "For the heading-boundary example, update() must request the shorter positive "
                "turn across -pi/pi. It returned {} rad/s. Wrap the heading error before choosing the turn direction."
            ).format(
                format_number(wrap_turn.turn_rate_rad_s)
            )
        )

    realign_navigation = component_class(config)
    realign_navigation.start((NavigationGoal(200.0, 0.0),))
    driving = realign_navigation.update(Pose(0.0, 0.0, 0.0))
    if driving.forward_speed_mm_s <= 0.0:
        raise AssertionError("NavigationController.update() must begin with positive forward speed when the goal is aligned and outside the position tolerance. Check the heading and distance conditions.")
    realign_turn = realign_navigation.update(Pose(0.0, 0.0, 0.4))
    _close(
        "realignment forward speed (mm/s)",
        realign_turn.forward_speed_mm_s,
        0.0,
        exact=True,
    )
    if realign_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "For this realignment example, update() must request a negative turn_rate_rad_s. It returned {} rad/s. Recompute the signed heading error from the current pose.".format(
                format_number(realign_turn.turn_rate_rad_s)
            )
        )

    ordered = component_class(config)
    first_goal = NavigationGoal(0.0, 0.0)
    second_goal = NavigationGoal(200.0, 0.0)
    ordered.start((first_goal, second_goal))
    ordered.update(Pose(0.0, 0.0, 0.0))
    if ordered.current_goal() != second_goal:
        raise AssertionError(
            "After update() reaches the first goal, current_goal() must return the second goal. Advance the route index while preserving the supplied goal order."
        )

    navigation.start((NavigationGoal(0.0, 0.0, pi / 2.0),))
    turn = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("final-align forward speed (mm/s)", turn.forward_speed_mm_s, 0.0, exact=True)
    if turn.turn_rate_rad_s <= 0.0:
        raise AssertionError("NavigationController.update() must turn left for a positive final-heading error. Check the final heading even when the goal position has been reached.")
    stopped = navigation.update(Pose(0.0, 0.0, pi / 2.0))
    _close("completed forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0, exact=True)
    _close("completed turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0, exact=True)
    if not navigation.is_complete():
        raise AssertionError("NavigationController.is_complete() must return True at the final required pose. Mark the route complete after both position and final-heading conditions are satisfied.")
    return (
        "update() requested {:.3g} mm/s toward the goal ahead and "
        "{:.3g}/{:.3g} rad/s toward the left/right goals. The heading-wrap "
        "example requested {:.3g} rad/s, and realignment requested {:.3g} rad/s. "
        "The completed route produced an exact stop."
    ).format(
        command.forward_speed_mm_s,
        side_turn.turn_rate_rad_s,
        right_turn.turn_rate_rad_s,
        wrap_turn.turn_rate_rad_s,
        realign_turn.turn_rate_rad_s,
    )


def _grid_planner(component_class):
    planner = component_class()
    open_grid = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, False, False, False, False, False),
    )
    direct_start = GridCell(0, 0)
    direct_goal = GridCell(2, 0)
    direct = planner.plan(open_grid, direct_start, direct_goal)

    def check_route(grid, start, goal, route):
        if not isinstance(route, GridPath):
            raise AssertionError("GridPlanner.plan() must return a GridPath when it finds a route. Place the ordered GridCell values in that record.")
        if not route.cells or route.cells[0] != start or route.cells[-1] != goal:
            raise AssertionError("The GridPath returned by plan() must begin at the start cell and end at the goal cell. Check the endpoints when reconstructing the route.")
        for cell in route.cells:
            if not isinstance(cell, GridCell) or any(isinstance(v, bool) or not isinstance(v, int) for v in (cell.column, cell.row)):
                raise AssertionError("Each route cell must contain integer column and row indices.")
            if grid.is_blocked(cell):
                raise AssertionError("Every cell in the GridPath returned by plan() must be free. Exclude blocked cells during search and path reconstruction.")
        for first, second in zip(route.cells, route.cells[1:]):
            if second not in grid.neighbors(first):
                raise AssertionError(
                    "Successive cells in the GridPath returned by plan() must share a horizontal or vertical side. Reconstruct the path from connected neighbors, without diagonal steps or gaps."
                )

    if direct is None:
        raise AssertionError("GridPlanner.plan() must connect the unobstructed start and goal cells in this example. Check neighbor expansion and goal detection before returning None.")
    check_route(open_grid, direct_start, direct_goal, direct)

    grid = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, False, False),
    )
    start = GridCell(0, 0)
    goal = GridCell(2, 0)
    path = planner.plan(grid, start, goal)
    if path is None:
        raise AssertionError("GridPlanner.plan() returned no route even though the start and goal are connected around the obstacle. Explore the available detour before returning None.")
    check_route(grid, start, goal, path)

    if planner.plan(open_grid, None, direct_goal) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the start is missing. Validate the endpoints before beginning the search.")
    if planner.plan(open_grid, direct_start, None) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the goal is missing. Validate the endpoints before beginning the search.")
    if planner.plan(open_grid, GridCell(9, 9), direct_goal) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the start lies outside the grid. Check the start column and row against the grid dimensions.")

    blocked_start = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        2,
        1,
        (True, False),
    )
    if planner.plan(blocked_start, GridCell(0, 0), GridCell(1, 0)) is not None:
        raise AssertionError("GridPlanner.plan() must return None when an endpoint is blocked. Check endpoint occupancy before beginning the search.")

    divided = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, True, False),
    )
    if planner.plan(divided, GridCell(0, 0), GridCell(2, 0)) is not None:
        raise AssertionError("GridPlanner.plan() must return None when no free-cell route reaches the goal. Return None after exhausting reachable cells.")

    same = planner.plan(open_grid, direct_start, direct_start)
    if same is None or same.cells != (direct_start,):
        raise AssertionError("GridPlanner.plan() must return a one-cell GridPath when the start equals the goal. Include the start cell even when no travel is required.")
    return "plan() returned a {}-cell route on the open grid and a {}-cell route around the obstacle. Both routes used free, side-sharing cells. Invalid or disconnected endpoints returned None, and identical endpoints produced a one-cell route.".format(
        len(direct.cells),
        len(path.cells),
    )


def _sensor_speed_sequences(component_class):
    # Contract examples allow 1.2 s warm-up (at least 7.5 response constants).
    # They constrain steady scaling and smoothing, not the first filter output.
    histories = []
    for tau_ms in (80.0, 160.0):
        config = RobotConfig(wheel_diameter_mm=60.0, encoder_counts_per_revolution=600.0,
                             left_encoder_sign=1, right_encoder_sign=1,
                             sample_period_ms=20, wheel_speed_filter_time_constant_ms=tau_ms)
        model = component_class(config)
        model.reset(RawSensors(0, 0, 0, None, False))
        time_ms = 0
        count = 0
        for index in range(30):
            time_ms += 40
            count += 1
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        for side in ("left", "right"):
            _close("settled " + side + " speed (mm/s)", getattr(measured, side + "_speed_mm_s"),
                   pi / 0.4, 0.1 * pi / 0.4)
        earlier = measured
        transition = []
        right_transition = []
        for index in range(12):
            time_ms += 40
            count += 3
            measured = model.update(RawSensors(time_ms, count, count, None, False))
            transition.append(measured.left_speed_mm_s)
            right_transition.append(measured.right_speed_mm_s)
        _change("speed response after three counts per 40 ms", earlier.left_speed_mm_s,
                measured.left_speed_mm_s, 1, 1.0, "mm/s")
        histories.append((transition, right_transition))
        # Quantized constant travel: alternating 0/2 counts over 40 ms.
        samples = []
        right_samples = []
        for index in range(30):
            time_ms += 40
            count += 0 if index % 2 == 0 else 2
            measured = model.update(RawSensors(time_ms, count, count, None, False))
            if index >= 22:
                samples.append(measured.left_speed_mm_s)
                right_samples.append(measured.right_speed_mm_s)
        if any(max(values) - min(values) >= 0.8 * (pi / 0.2) for values in (samples, right_samples)):
            raise AssertionError("Wheel speed still follows the raw 0/15.7 mm/s quantization after warm-up. Use recent samples and the configured response time; keep wheel increments unsmoothed.")
        # Stationary and reverse intervals rule out fixed positive answers.
        for index in range(30):
            time_ms += 40
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        _close("settled stationary left speed (mm/s)", measured.left_speed_mm_s, 0.0, 0.3)
        _close("settled stationary right speed (mm/s)", measured.right_speed_mm_s, 0.0, 0.3)
        for index in range(30):
            time_ms += 40
            count -= 1
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        for side in ("left", "right"):
            _close("settled reverse " + side + " speed (mm/s)", getattr(measured, side + "_speed_mm_s"),
                   -pi / 0.4, 0.1 * pi / 0.4)
        reset = model.reset(RawSensors(time_ms, count, count, 350.0, True))
        for field in ("left_speed_mm_s", "right_speed_mm_s", "left_increment_mm", "right_increment_mm", "left_position_mm", "right_position_mm", "dt_s"):
            _close("reset history " + field, getattr(reset, field), 0.0, exact=True)
        no_time = model.update(RawSensors(time_ms, count + 1, count + 1, None, False))
        _close("zero-interval dt_s", no_time.dt_s, 0.0, exact=True)
        _close("zero-interval left increment (mm)", no_time.left_increment_mm, pi / 10.0)
    for side in (0, 1):
        _change("configured {} response (sum of twelve step-response estimates)".format("left" if side == 0 else "right"),
                sum(histories[1][side]), sum(histories[0][side]), 1, 0.5, "mm/s",
                {"kind": "response_configuration", "method": "update",
                 "side": "left" if side == 0 else "right",
                 "earlier_label": "sum with 160 ms response time",
                 "later_label": "sum with 80 ms response time",
                 "earlier_response_ms": 160, "later_response_ms": 80,
                 "sample_interval_ms": 40, "previous_count_increment": 1,
                 "current_count_increment": 3, "sample_count": 12,
                 "earlier_speeds_mm_s": histories[1][side],
                 "later_speeds_mm_s": histories[0][side]})
    # MicroPython's ticks_diff provides wrap-safe time. CPython has no wrapping
    # device clock; the same fixture runs there with chronological timestamps.
    from .utils import elapsed_time_s
    start_ms, end_ms = 1073741814, 10
    if elapsed_time_s(end_ms, start_ms) <= 0:
        start_ms, end_ms = 100, 120
    model = component_class(RobotConfig())
    model.reset(RawSensors(start_ms, 0, 0, None, False))
    wrapped = model.update(RawSensors(end_ms, 1, 1, None, False))
    _close("tick interval dt_s", wrapped.dt_s, 0.02)


def _reflectance(component_class):
    model = component_class(RobotConfig())
    for readings in (ReflectanceReadings(0.2, 0.8), None):
        first = model.reset(RawSensors(0, 0, 0, None, False, readings))
        later = model.update(RawSensors(20, 0, 0, None, False, readings))
        if first.reflectance != readings or later.reflectance != readings:
            raise AssertionError("Preserve raw.reflectance exactly in both reset() and update() Measurements; LineFollower uses these readings to steer.")
    return "reset() and update() preserved the left/right reflectance readings of 0.2/0.8 and preserved None when readings were absent."


def _line_follower(component_class):
    settings = {"cruise_speed_mm_s": 90.0, "minimum_speed_mm_s": 45.0,
                "kp_rad_s": 1.6, "ki_rad_s2": 0.0, "kd_rad": 0.025,
                "integral_limit_s": 0.5, "maximum_turn_rate_rad_s": 1.4,
                "turn_slowdown": 0.45}
    follower = component_class(settings)
    follower.reset()
    centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
    left = follower.update(ReflectanceReadings(0.8, 0.2), 0.04)
    follower.reset()
    right = follower.update(ReflectanceReadings(0.2, 0.8), 0.04)
    for command in (centered, left, right):
        if not 0 <= command.forward_speed_mm_s <= settings["cruise_speed_mm_s"]:
            raise AssertionError("forward_speed_mm_s must remain between 0 and the fixture's 90 mm/s cruise limit.")
        if abs(command.turn_rate_rad_s) > settings["maximum_turn_rate_rad_s"]:
            raise AssertionError("turn_rate_rad_s must remain within the fixture's +/-1.4 rad/s steering limit.")
    _close("centered turn (rad/s)", centered.turn_rate_rad_s, 0.0, exact=True)
    if left.turn_rate_rad_s <= 0 or right.turn_rate_rad_s >= 0:
        raise AssertionError("Steer toward the darker sensor: left=0.8/right=0.2 requires positive turn rate; reversed readings require negative turn rate. Received {} and {} rad/s.".format(format_number(left.turn_rate_rad_s), format_number(right.turn_rate_rad_s)))
    follower.reset()
    _close("reset centered turn (rad/s)", follower.update(ReflectanceReadings(0.6, 0.6), 0.02).turn_rate_rad_s, 0.0, exact=True)
    return "update() returned zero turn for centered readings and turned toward the darker sensor in both directions. Forward speed stayed within 0 to 90 mm/s, turn rate stayed within +/-1.4 rad/s, and reset() cleared the steering history."


def _range_safety_controller(component_class):
    controller = component_class(0.20, 400.0, 120.0, 250.0)
    far = controller.update(220.0, 0.0, 1000.0)
    if not 0 < far <= 220:
        raise AssertionError("For a clear 1000 mm range, RangeSafetyController.update() must allow positive forward speed without exceeding the 220 mm/s request. Check the stopping-distance calculation and request limit.")
    for request, speed, distance in ((220.0, 0.0, None), (0.0, 80.0, 1000.0), (-40.0, 0.0, 1000.0), (200.0, 220.0, 210.0)):
        _close("required safe stop (mm/s)", controller.update(request, speed, distance), 0.0, exact=True)
    bounded = controller.update(400.0, 0.0, 1000.0)
    if not 0 < bounded <= 250:
        raise AssertionError("RangeSafetyController.update() must limit the 400 mm/s request to a positive speed no greater than the configured 250 mm/s maximum. Apply the maximum-speed setting.")
    if controller.update(200.0, 60.0, 210.0) <= 0:
        raise AssertionError("At 210 mm range, 60 mm/s measured speed permits motion; 220 mm/s requires stopping. Include measured speed in braking distance.")
    for label, first, second in (
        ("response delay", (0.10, 300.0, 120.0, 300.0), (0.45, 300.0, 120.0, 300.0)),
        ("weaker braking", (0.20, 800.0, 120.0, 300.0), (0.20, 200.0, 120.0, 300.0)),
        ("larger margin", (0.20, 300.0, 80.0, 300.0), (0.20, 300.0, 180.0, 300.0)),
    ):
        earlier = component_class(*first).update(260.0, 0.0, 240.0)
        later = component_class(*second).update(260.0, 0.0, 240.0)
        if later <= 0:
            raise AssertionError("The setting change, " + label + ", should reduce the allowed speed while still permitting motion in this fixture.")
        _change(label, earlier, later, -1, 0.01, "mm/s")
    return "update() stopped exactly for missing range, nonpositive requests and insufficient stopping distance. Valid forward requests respected the 250 mm/s speed limit, and changes in delay, braking deceleration and margin changed the allowed speed in the required direction."


def _pose_corrector(component_class):
    def check_pose(label, result, expected):
        _close(label + " x (mm)", result.x_mm, expected[0])
        _close(label + " y (mm)", result.y_mm, expected[1])
        # Constructing Pose normalizes heading, so compare geometric roundoff.
        _close(label + " heading (rad)", result.heading_rad, expected[2])
    corrector = component_class(50.0)
    raw = Pose(120.0, -75.0, 0.31)
    corrector.reset(raw)
    check_pose("positive-x wall", corrector.observe_x(raw, 780.0, 1000.0, True), (170.0, -75.0, 0.31))
    check_pose("negative-y wall", corrector.observe_y(raw, 275.0, -600.0, False), (170.0, -275.0, 0.31))
    check_pose("later odometry", corrector.corrected_pose(Pose(145.0, -50.0, -0.60)), (195.0, -250.0, -0.60))
    reset_pose = Pose(-40.0, 30.0, 1.20)
    if corrector.reset(reset_pose) != reset_pose:
        raise AssertionError("reset() must clear both coordinate corrections and return its input Pose.")
    check_pose("negative-x wall", corrector.observe_x(reset_pose, 200.0, -500.0, False), (-250.0, 30.0, 1.20))
    check_pose("positive-y wall", corrector.observe_y(reset_pose, 300.0, 800.0, True), (-250.0, 450.0, 1.20))
    second = component_class(25.0)
    second_raw = Pose(40.0, 60.0, -1.10)
    second.reset(second_raw)
    check_pose("25 mm offset x", second.observe_x(second_raw, 500.0, 600.0, True), (75.0, 60.0, -1.10))
    check_pose("25 mm offset y", second.observe_y(second_raw, 200.0, -400.0, False), (75.0, -175.0, -1.10))
    try:
        corrector.observe_x(reset_pose, 0.0, 900.0, True)
    except ValueError:
        pass
    else:
        raise AssertionError("observe_x() must reject zero range with ValueError.")
    return "The wall observations produced the required x/y corrections for both wall directions and sensor offsets. corrected_pose() retained both translations during later odometry, preserved heading, and reset() cleared the corrections."


def _visit_order_planner(component_class):
    planner = component_class()
    asymmetric = ((0,9,1,8,7),(6,0,5,7,4),(9,2,0,8,8),(1,9,9,0,5),(8,9,9,1,0))
    reachable = ((0,None,None,1,None),(None,0,None,None,None),(None,None,0,None,1),(None,None,None,0,None),(1,None,None,None,0))
    ties = ((0,1,1,1,1),(1,0,1,1,1),(1,1,0,1,1),(1,1,1,0,1),(1,1,1,1,0))
    disconnected = ((0,1,None,None),(None,0,1,None),(None,None,0,None),(None,None,None,0))
    for label, costs, start, stops, finish, expected in (
        ("directed costs", asymmetric, 4, (2,0,3), 1, (4,3,0,2,1)),
        ("missing segments", reachable, 2, (0,4), 3, (2,4,0,3)),
        ("lexicographic tie break", ties, 4, (3,1,2), 0, (4,1,2,3,0)),
        ("disconnected route", disconnected, 0, (1,2), 3, None),
    ):
        result = planner.plan(costs, start, stops, finish)
        if result != expected or (result is not None and any(isinstance(value, bool) or not isinstance(value, int) for value in result)):
            raise AssertionError("For {}, plan() must return the ordered indices {}. It returned {}. Sum directed segment costs and preserve the specified tie-breaking rule.".format(label, expected, result))
    try:
        planner.plan(asymmetric, 4, (2,2,3), 1)
    except ValueError:
        pass
    else:
        raise AssertionError("VisitOrderPlanner.plan() must raise ValueError for duplicate stop indices. Check the supplied stop sequence before comparing visit orders.")
    return "plan() selected the required visit orders using directed costs and chose the lexicographically first order when costs tied. It returned None for a disconnected route and rejected duplicate stop indices."


_CHECKS = (
    (
        "SensorProcessor · encoder distance and measured speed",
        "sensor_model",
        (
            "SensorProcessor.reset() and update() provide wheel travel to Odometry "
            "and measured wheel speed to WheelSpeedController."
        ),
        (
            "The examples use two wheel geometries and encoder-sign conventions, "
            "25/40 ms intervals and a separate 30 ms interval. Speed examples allow "
            "1.2 s of warm-up, then use 40 ms samples with 80/160 ms response settings "
            "to check a speed increase, quantized counts, stationary wheels and reversal."
        ),
        (
            "Device timestamps determine dt_s, and encoder signs determine forward travel. "
            "Positions accumulate at pi * wheel diameter / encoder resolution mm per count. "
            "Wheel increments remain unsmoothed, while speed estimates respond to recent "
            "samples and the configured response time."
        ),
        _sensor_model,
    ),
    (
        "WheelSpeedController · signed and limited motor command",
        "wheel_speed_controller",
        "WheelSpeedController.update() turns requested and measured wheel speeds into the normalized motor commands used by Robot.",
        (
            "The examples request left/right speeds of +100/-100 mm/s at measured "
            "speeds of +80/-80 and +20/-20 mm/s, then request reverse motion on "
            "the left wheel and a stop on the right."
        ),
        (
            "A larger speed error produces a stronger command in the requested "
            "direction. Commands remain within the configured +/-0.6 limit, and "
            "a zero wheel-speed target produces an exact zero command."
        ),
        _wheel_speed_controller,
    ),
    (
        "SensorProcessor · robust ultrasound estimate",
        "range_estimator",
        (
            "SensorProcessor.estimate_range() combines stationary ultrasound "
            "readings before the project interprets the observed map feature."
        ),
        "The sample sets contain valid distances in mm, None, a Boolean, nonfinite values and a negative value. Separate examples exercise odd/even usable counts and minimum-count validation.",
        (
            "The method ignores invalid readings and returns the median when "
            "enough usable readings remain. It returns None when too few remain "
            "and rejects a minimum count of zero."
        ),
        _range_estimator,
    ),
    (
        "DifferentialDrive · body command to wheel targets",
        "differential_drive",
        (
            "DifferentialDrive.wheel_speeds() converts a forward speed in mm/s "
            "and a turn rate in rad/s into the left/right targets used by wheel control."
        ),
        (
            "The examples use a 100 mm track width for straight, moving-turn "
            "and in-place commands, then a 140 mm track width for a reverse curve."
        ),
        (
            "Straight motion produces equal wheel targets. A positive turn rate "
            "makes the right target greater than the left by turn rate * track width; "
            "a negative turn rate reverses that difference."
        ),
        _differential_drive,
    ),
    (
        "Odometry · measured wheel increments to pose",
        "odometry",
        "Odometry.update() converts measured wheel increments into the position and heading used to end turns and navigate.",
        (
            "The examples use equal, equal-and-opposite and unequal wheel travel "
            "with a 100 mm track width. A further example starts at a nonzero "
            "pose and crosses the heading representation boundary."
        ),
        (
            "Equal travel advances the robot straight, equal-and-opposite travel "
            "turns it in place, and unequal travel follows the corresponding planar "
            "arc. Position remains in mm, and heading is wrapped to [-pi, pi) rad."
        ),
        _odometry,
    ),
    (
        "NavigationController · goals to motion commands",
        "navigation_controller",
        (
            "NavigationController.update() converts route goals and the estimated "
            "pose into forward-speed and turn-rate requests that Robot can execute."
        ),
        (
            "The examples use empty and ordered routes, goals ahead and on "
            "either side, a heading-boundary crossing, realignment during travel "
            "and a required final heading."
        ),
        (
            "The controller advances goals in order and uses the shorter signed "
            "turn. A large heading error suspends forward motion; completion "
            "produces exactly zero forward speed and turn rate."
        ),
        _navigation_controller,
    ),
    (
        "GridPlanner · connected route through free cells",
        "grid_planner",
        (
            "GridPlanner.plan() provides the cell route that the project converts "
            "to navigation goals before motion begins."
        ),
        (
            "The examples include an unobstructed route, an obstacle requiring "
            "a detour, missing or blocked endpoints, disconnected regions and "
            "identical start and goal cells."
        ),
        (
            "A returned path connects free cells from start to goal, with each "
            "successive pair sharing a side. Invalid or disconnected endpoints "
            "produce None; identical endpoints produce a one-cell path."
        ),
        _grid_planner,
    ),
)

# Registry entries describe behavior, never challenge titles or worlds.
_CHECKS += (
    ("SensorProcessor · reflectance preservation", "reflectance",
     "SensorProcessor.reset() and update() preserve the paired floor readings that LineFollower uses to steer.",
     "Both methods receive left/right reflectance readings of 0.2/0.8 and, separately, None for absent readings.",
     "Both methods preserve reflectance exactly, including None.", _reflectance),
    ("LineFollower · reflectance to steering", "line_follower",
     "LineFollower.update() converts left-minus-right floor darkness into a bounded MotionCommand for line tracking.",
     "The examples use equal readings, reversed 0.8/0.2 readings, 20/40 ms intervals and fixed controller settings with 90 mm/s and 1.4 rad/s limits.",
     "The controller steers toward the darker sensor, requests zero turn for centered readings after reset, and keeps all commands within the configured bounds.", _line_follower),
    ("RangeSafetyController · braking and range limits", "range_safety_controller",
     "RangeSafetyController.update() limits forward-speed requests using measured speed and available stopping distance.",
     "The examples vary range, measured speed, response delay, braking deceleration, safety margin and maximum speed.",
     "Insufficient or missing range and nonpositive requests produce an exact stop. The allowed forward speed responds to each configured limit.", _range_safety_controller),
    ("PoseCorrector · wall range to translation", "pose_corrector",
     "PoseCorrector.observe_x() and observe_y() correct odometry translation from stationary wall observations while preserving heading.",
     "The examples observe walls in both x/y directions using 50 and 25 mm sensor offsets, then process later odometry and reset the correction.",
     "Each observation applies the sensor offset and wall-facing sign. The corrector retains both coordinate translations, preserves heading and clears the correction on reset.", _pose_corrector),
    ("VisitOrderPlanner · ordered route costs", "visit_order_planner",
     "VisitOrderPlanner.plan() chooses the least-cost visit order before the mission follows its routes.",
     "The examples contain directed segment costs, missing segments, tied route costs, an unreachable finish and duplicate stop indices.",
     "The planner returns the minimum-cost order, choosing the lexicographically first index sequence when costs tie. It returns None when no complete order exists and rejects duplicate stops.", _visit_order_planner),
)

_CONTRACT_KEYS = {
    "sensor_processor.encoder": "sensor_model",
    "sensor_processor.range": "range_estimator",
    "sensor_processor.reflectance": "reflectance",
    "wheel_speed_controller": "wheel_speed_controller",
    "differential_drive": "differential_drive",
    "odometry": "odometry",
    "navigation_controller": "navigation_controller",
    "grid_planner": "grid_planner",
    "line_follower": "line_follower",
    "range_safety_controller": "range_safety_controller",
    "pose_corrector": "pose_corrector",
    "visit_order_planner": "visit_order_planner",
}
CONTRACTS = tuple(_CONTRACT_KEYS)
_CLASS_KEYS = {
    "SensorProcessor": "sensor_model", "SensorModel": "sensor_model",
    "WheelSpeedController": "wheel_speed_controller", "DifferentialDrive": "differential_drive",
    "Odometry": "odometry", "NavigationController": "navigation_controller", "GridPlanner": "grid_planner",
    "LineFollower": "line_follower", "RangeSafetyController": "range_safety_controller",
    "PoseCorrector": "pose_corrector", "VisitOrderPlanner": "visit_order_planner",
}
_SOURCE_FILES = {"sensor_model": "sensor_processor", "range_estimator": "sensor_processor", "reflectance": "sensor_processor"}
_METHODS = {"sensor_model": "reset, update", "range_estimator": "estimate_range", "reflectance": "reset, update",
            "differential_drive": "wheel_speeds", "odometry": "reset, update", "grid_planner": "plan",
            "navigation_controller": "start, current_goal, is_complete, update", "wheel_speed_controller": "reset, update",
            "line_follower": "reset, update", "pose_corrector": "reset, observe_x, observe_y, corrected_pose",
            "visit_order_planner": "plan", "range_safety_controller": "update"}


_INSPECTIONS = {
    "sensor_model": "Check signed count differences and distance per count (pi * wheel_diameter_mm / encoder_counts_per_revolution). Use consecutive device timestamps for dt_s; filter speed using recent samples without smoothing wheel increments.",
    "range_estimator": "Reject missing, Boolean, nonfinite and nonpositive samples before counting usable readings. Sort those readings and calculate the odd/even median.",
    "reflectance": "Pass raw.reflectance through the Measurements returned by both reset() and update(), including None.",
    "wheel_speed_controller": "Inspect the requested-minus-measured speed error and each wheel's sign. Apply max_drive_command to both directions, and return exactly zero for a zero requested wheel speed.",
    "differential_drive": "Check left = forward - turn_rate * track_width / 2 and right = forward + turn_rate * track_width / 2. Keep distance in mm and turn rate in rad/s.",
    "odometry": "Calculate heading change from (right_increment_mm - left_increment_mm) / track_width_mm. Integrate the constant-curvature arc at the previous heading and wrap the updated heading to [-pi, pi).",
    "navigation_controller": "Check the active goal and wrapped heading error before choosing translation or rotation. Advance reached goals in order and request exactly zero motion when complete.",
    "grid_planner": "Inspect endpoint validity, obstacle checks and parent/path reconstruction. Consecutive cells must share a horizontal or vertical side; unreachable goals return None.",
    "line_follower": "Use left-minus-right darkness for the steering sign, include the provided dt_s in controller history, and enforce the fixture's speed and turn limits. reset() must clear previous and accumulated errors.",
    "range_safety_controller": "Check stopping distance from measured speed, response delay and braking deceleration. Include sensor margin and enforce the requested and maximum speed limits; missing range requires an exact stop.",
    "pose_corrector": "Check the wall-facing sign and sensor offset in the observed coordinate. Retain the correction for the other axis, apply both translations to later odometry, and preserve heading.",
    "visit_order_planner": "Sum directed costs along each complete visit order, reject missing segments, and use lexicographic order for ties. Preserve integer stop indices and reject duplicates.",
}

def _readable(value, depth=0):
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return str(value)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return format_number(value)
    if depth >= 3:
        return "(nested values are available in the report details)"
    if isinstance(value, dict):
        return "; ".join(str(key) + "=" + _readable(item, depth + 1) for key, item in value.items())
    if isinstance(value, (list, tuple)):
        displayed = value[:8]
        result = ", ".join(_readable(item, depth + 1) for item in displayed)
        return "[" + result + (", ... (full sequence in report details)" if len(value) > 8 else "") + "]"
    return str(value)


def _failure_context(case):
    comparison_context = case.get("comparison_context")
    if comparison_context is not None:
        context = comparison_context
        return [
            "This comparison uses the {} wheel's saved update() speed estimates from two runs with response times of {} and {} ms.".format(
                context["side"], context["earlier_response_ms"], context["later_response_ms"]),
            "After warm-up at {} encoder count per sample, each run increased to {} counts per sample at {} ms intervals. The comparison sums the first {} speed estimates after that increase.".format(
                context["previous_count_increment"], context["current_count_increment"], context["sample_interval_ms"], context["sample_count"]),
            "Speeds with {} ms response time, in mm/s: [{}].".format(context["earlier_response_ms"],
                ", ".join(format_number(value) for value in context["earlier_speeds_mm_s"])),
            "Speeds with {} ms response time, in mm/s: [{}].".format(context["later_response_ms"],
                ", ".join(format_number(value) for value in context["later_speeds_mm_s"])),
            "The shorter response time should produce a larger sum during this transition. Check that the configured response time affects the estimator.",
        ]
    key = _CONTRACT_KEYS[case["contract"]]
    context = []
    configuration = case.get("configuration", [])
    if key in ("sensor_model", "reflectance") and configuration:
        config = configuration[0]
        context.append("Fixture settings: wheel diameter {} mm; resolution {} counts/revolution; encoder signs left {}, right {}; response time {} ms; nominal sample period {} ms.".format(
            format_number(config["wheel_diameter_mm"]), format_number(config["encoder_counts_per_revolution"]),
            config["left_encoder_sign"], config["right_encoder_sign"],
            format_number(config["wheel_speed_filter_time_constant_ms"]), config["sample_period_ms"]))
    elif configuration:
        fields = {"differential_drive": ("track_width_mm",), "odometry": ("track_width_mm",),
                  "wheel_speed_controller": ("left_start_command", "right_start_command", "left_speed_command_gain", "right_speed_command_gain", "wheel_speed_kp", "max_drive_command")}.get(key)
        config = configuration[0]
        if fields and isinstance(config, dict):
            context.append("Fixture settings: " + _readable({name: config[name] for name in fields}) + ".")
        else:
            context.append("Fixture constructor inputs: " + _readable(configuration) + ".")
    if case["inputs"]:
        call = case["inputs"][-1]
        if "previous" in call:
            previous = call["previous"]
            current = call["args"][0]
            context.append("Previous sample: time {} ms; left count {}; right count {}.".format(
                previous["time_ms"], previous["left_encoder_count"], previous["right_encoder_count"]))
            from .utils import elapsed_time_s
            context.append("Current sample: time {} ms; left count {}; right count {}. Elapsed interval: {} s.".format(
                current["time_ms"], current["left_encoder_count"], current["right_encoder_count"],
                format_number(elapsed_time_s(current["time_ms"], previous["time_ms"]))))
        else:
            context.append("Input to {}(): {}.".format(call["method"], _readable(call["args"])))
    return context


def _selection(component_classes, components):
    include_range = components.pop("include_range", False)
    include_reflectance = components.pop("include_reflectance", False)
    contracts = components.pop("contracts", None)
    for value, name in ((include_range, "include_range"), (include_reflectance, "include_reflectance")):
        if not isinstance(value, bool):
            raise TypeError(name + " must be True or False")
    if "sensor_processor" in components:
        if "sensor_model" in components:
            raise ValueError("component supplied more than once: sensor_processor")
        components["sensor_model"] = components.pop("sensor_processor")
    for component_class in component_classes:
        key = _CLASS_KEYS.get(getattr(component_class, "__name__", ""))
        if key is None:
            raise ValueError("unknown component class; use an explicit named contract: " + getattr(component_class, "__name__", str(component_class)))
        if key in components:
            raise ValueError("component supplied more than once: " + key)
        components[key] = component_class
    for enabled, key in ((include_range, "range_estimator"), (include_reflectance, "reflectance")):
        if enabled:
            if "sensor_model" not in components:
                raise ValueError(key + " requires SensorProcessor")
            if key in components:
                raise ValueError("component supplied more than once: " + key)
            components[key] = components["sensor_model"]
    unknown = set(components).difference(item[1] for item in _CHECKS)
    if unknown:
        raise ValueError("unknown component check: " + sorted(unknown)[0])
    if contracts is not None:
        if not isinstance(contracts, (tuple, list)) or not contracts:
            raise ValueError("contracts must be a nonempty list or tuple of contract IDs")
        selected = {}
        for contract in contracts:
            if contract not in _CONTRACT_KEYS:
                raise ValueError("unknown contract: " + str(contract))
            key = _CONTRACT_KEYS[contract]
            if key in selected:
                raise ValueError("duplicate contract: " + contract)
            component = components.get(key)
            if component is None and key in ("range_estimator", "reflectance"):
                component = components.get("sensor_model")
            if component is None:
                raise ValueError("missing component for contract: " + contract)
            selected[key] = component
        components = selected
    if not components:
        raise ValueError("at least one component class is required")
    for key, component in components.items():
        if not callable(component):
            raise TypeError(key + " must name an imported component class")
    return components


def run_component_checks(*component_classes, **components):
    """Run hardware-free checks selected by component or stable contract ID.

    Existing positional classes, named keys, SensorModel and include_range are
    supported. contracts selects reusable capabilities, for example
    ('sensor_processor.encoder', 'sensor_processor.reflectance'). No mission
    entrypoint is imported. Unimplemented methods are diagnostic outcomes;
    incorrect results raise AssertionError after all independent contracts run.
    """
    global _report, _active_case
    _report = {"schema_version": 1, "complete": False, "status": "running",
               "counts": {"passed": 0, "failed": 0, "not_implemented": 0, "not_run": 0},
               "cases": [], "last_started_case": None, "last_completed_case": None}
    _active_case = None
    try:
        components = _selection(component_classes, components)
    except Exception as error:
        _report.update({"status": "setup_error", "complete": True,
                        "exception": {"type": type(error).__name__, "message": str(error)}})
        _publish()
        raise
    for label, key, role, inputs, expected, check in _CHECKS:
        if key not in components:
            continue
        contract = next(name for name in CONTRACTS if _CONTRACT_KEYS[name] == key)
        module = getattr(components[key], "__module__", "")
        import sys
        file_name = getattr(sys.modules.get(module), "__file__", None)
        if isinstance(file_name, str) and file_name:
            file_name = file_name.replace("\\\\", "/")
            if file_name.startswith("/project/"):
                file_name = file_name[len("/project/"):]
            elif file_name.startswith("project/"):
                file_name = file_name[len("project/"):]
        else:
            file_name = (module.replace(".", "/") if module and module not in ("__main__", "builtins") else _SOURCE_FILES.get(key, key)) + ".py"
        _report["cases"].append({"id": contract, "contract": contract, "status": "not_run",
            "source": {"file": file_name, "method": _METHODS[key]},
            "methods": _METHODS[key], "role": role, "fixture": inputs, "inputs": [],
            "expected": expected, "actual": None, "units": None, "tolerance": None,
            "observations": [], "suggestion": _INSPECTIONS[key], "message": "This contract has not run yet.", "exception": None})
    _report["counts"]["not_run"] = len(_report["cases"])
    print("These checks call your project classes with small examples; they do not start either robot.")
    print("Test calls student components directly. Run follows robot_setup.py selectors. Passing these examples does not validate main.py, a whole mission, or physical robot behavior.")
    print("Fixture settings below are supplied software-test inputs, not measured robot calibration.")
    print("PASS = behavior matched the examples; NOT IMPLEMENTED = a method needs code; FAIL = an incorrect result or exception.")
    for case in _report["cases"]:
        key = _CONTRACT_KEYS[case["contract"]]
        label, _, role, inputs, expected, check = next(item for item in _CHECKS if item[1] == key)
        _active_case = case
        case["status"] = "running"
        _report["last_started_case"] = case["id"]
        _publish()
        print("CHECK · " + label)
        print("SOURCE · {}: methods {}.".format(case["source"]["file"],
              ", ".join(method.strip() + "()" for method in case["methods"].split(","))))
        print("USE · " + role)
        print("INPUT · " + inputs)
        print("EXPECT · " + expected)
        try:
            observed = check(_factory(components[key], key))
        except NotImplementedError as error:
            case.update({"status": "not_implemented", "message": str(error) or "Complete the named method before checking this contract again.",
                         "exception": {"type": "NotImplementedError", "message": str(error)}})
            print("NOT IMPLEMENTED · {} · {}".format(label, case["message"]))
        except Exception as error:
            case.update({"status": "failed", "message": str(error),
                         "exception": {"type": type(error).__name__, "message": str(error)}})
            print("FAIL · {} · {}".format(label, error))
            case["context"] = _failure_context(case)
            for context in case["context"]:
                print("CONTEXT · " + context)
            print("INSPECT · " + case["suggestion"])
            print("COVERAGE · Later dependent examples in this contract were not run; independent components will still be checked.")
            if not isinstance(error, AssertionError):
                import sys
                print_exception = getattr(sys, "print_exception", None)
                if print_exception is not None:
                    print_exception(error, sys.stderr)
        else:
            case.update({"status": "passed", "message": observed})
            print("OBSERVED · " + observed)
            print("PASS · " + label)
        _report["counts"]["not_run"] -= 1
        _report["counts"][case["status"]] += 1
        _report["last_completed_case"] = case["id"]
        _publish()
    _active_case = None
    counts = _report["counts"]
    _report["status"] = "failed" if counts["failed"] else "not_implemented" if counts["not_implemented"] else "passed"
    _report["complete"] = True
    _publish()
    print("{} passed · {} not implemented · {} failed".format(counts["passed"], counts["not_implemented"], counts["failed"]))
    if counts["failed"]:
        raise AssertionError("{} component check(s) failed. Review the reported method, fixture inputs and suggested inspections above.".format(counts["failed"]))


__all__ = ("run_component_checks", "get_check_report", "CONTRACTS")
`,Ce=`"""Validated, immutable configuration values for UCSB-XRP."""

from ._validation import (
    require_int,
    require_nonnegative,
    require_number,
    require_positive,
    require_sign,
)
from .records import _ValueRecord


class RobotConfig(_ValueRecord):
    """Geometry, signs, calibration, estimator setting, gains, and limit."""

    __slots__ = (
        "_sample_period_ms",
        "_wheel_diameter_mm",
        "_encoder_counts_per_revolution",
        "_track_width_mm",
        "_left_motor_sign",
        "_right_motor_sign",
        "_left_encoder_sign",
        "_right_encoder_sign",
        "_left_start_command",
        "_right_start_command",
        "_left_speed_command_gain",
        "_right_speed_command_gain",
        "_wheel_speed_filter_time_constant_ms",
        "_wheel_speed_kp",
        "_wheel_speed_ki",
        "_wheel_speed_kd",
        "_max_drive_command",
    )
    _field_names = (
        "sample_period_ms",
        "wheel_diameter_mm",
        "encoder_counts_per_revolution",
        "track_width_mm",
        "left_motor_sign",
        "right_motor_sign",
        "left_encoder_sign",
        "right_encoder_sign",
        "left_start_command",
        "right_start_command",
        "left_speed_command_gain",
        "right_speed_command_gain",
        "wheel_speed_filter_time_constant_ms",
        "wheel_speed_kp",
        "wheel_speed_ki",
        "wheel_speed_kd",
        "max_drive_command",
    )

    def __init__(
        self,
        sample_period_ms=10,
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=585.0,
        track_width_mm=155.0,
        left_motor_sign=1,
        right_motor_sign=1,
        left_encoder_sign=1,
        right_encoder_sign=1,
        left_start_command=None,
        right_start_command=None,
        left_speed_command_gain=None,
        right_speed_command_gain=None,
        wheel_speed_filter_time_constant_ms=80.0,
        wheel_speed_kp=0.0,
        max_drive_command=None,
        wheel_speed_ki=0.0,
        wheel_speed_kd=0.0,
        **legacy,
    ):
        left_start_command = self._resolve_legacy(
            "left_start_command",
            left_start_command,
            "left_start_effort",
            legacy,
            0.0,
        )
        right_start_command = self._resolve_legacy(
            "right_start_command",
            right_start_command,
            "right_start_effort",
            legacy,
            0.0,
        )
        left_speed_command_gain = self._resolve_legacy(
            "left_speed_command_gain",
            left_speed_command_gain,
            "left_speed_effort_gain",
            legacy,
            0.0,
        )
        right_speed_command_gain = self._resolve_legacy(
            "right_speed_command_gain",
            right_speed_command_gain,
            "right_speed_effort_gain",
            legacy,
            0.0,
        )
        max_drive_command = self._resolve_legacy(
            "max_drive_command",
            max_drive_command,
            "max_effort",
            legacy,
            1.0,
        )
        if legacy:
            name = next(iter(legacy))
            raise TypeError("unexpected RobotConfig argument: {}".format(name))
        self._sample_period_ms = require_int(
            "sample_period_ms", sample_period_ms, minimum=1
        )
        self._wheel_diameter_mm = require_positive(
            "wheel_diameter_mm", wheel_diameter_mm
        )
        self._encoder_counts_per_revolution = require_positive(
            "encoder_counts_per_revolution", encoder_counts_per_revolution
        )
        self._track_width_mm = require_positive("track_width_mm", track_width_mm)
        self._left_motor_sign = require_sign("left_motor_sign", left_motor_sign)
        self._right_motor_sign = require_sign("right_motor_sign", right_motor_sign)
        self._left_encoder_sign = require_sign(
            "left_encoder_sign", left_encoder_sign
        )
        self._right_encoder_sign = require_sign(
            "right_encoder_sign", right_encoder_sign
        )
        self._left_start_command = require_nonnegative(
            "left_start_command", left_start_command
        )
        self._right_start_command = require_nonnegative(
            "right_start_command", right_start_command
        )
        self._left_speed_command_gain = require_nonnegative(
            "left_speed_command_gain", left_speed_command_gain
        )
        self._right_speed_command_gain = require_nonnegative(
            "right_speed_command_gain", right_speed_command_gain
        )
        self._wheel_speed_filter_time_constant_ms = require_nonnegative(
            "wheel_speed_filter_time_constant_ms",
            wheel_speed_filter_time_constant_ms,
        )
        self._wheel_speed_kp = require_nonnegative("wheel_speed_kp", wheel_speed_kp)
        self._wheel_speed_ki = require_nonnegative("wheel_speed_ki", wheel_speed_ki)
        self._wheel_speed_kd = require_nonnegative("wheel_speed_kd", wheel_speed_kd)
        self._max_drive_command = require_number(
            "max_drive_command", max_drive_command
        )
        if self._max_drive_command < 0.0 or self._max_drive_command > 1.0:
            raise ValueError("max_drive_command must be within [0.0, 1.0]")
        if self._left_start_command > self._max_drive_command:
            raise ValueError(
                "left_start_command must not exceed max_drive_command"
            )
        if self._right_start_command > self._max_drive_command:
            raise ValueError(
                "right_start_command must not exceed max_drive_command"
            )

    @staticmethod
    def _resolve_legacy(preferred_name, preferred, legacy_name, legacy, default):
        if legacy_name not in legacy:
            return default if preferred is None else preferred
        legacy_value = legacy.pop(legacy_name)
        if preferred is not None:
            raise TypeError(
                "use either {} or {}, not both".format(
                    preferred_name, legacy_name
                )
            )
        return legacy_value

    @property
    def sample_period_ms(self):
        return self._sample_period_ms

    @property
    def wheel_diameter_mm(self):
        return self._wheel_diameter_mm

    @property
    def encoder_counts_per_revolution(self):
        return self._encoder_counts_per_revolution

    @property
    def track_width_mm(self):
        return self._track_width_mm

    @property
    def left_motor_sign(self):
        return self._left_motor_sign

    @property
    def right_motor_sign(self):
        return self._right_motor_sign

    @property
    def left_encoder_sign(self):
        return self._left_encoder_sign

    @property
    def right_encoder_sign(self):
        return self._right_encoder_sign

    @property
    def left_start_command(self):
        return self._left_start_command

    @property
    def right_start_command(self):
        return self._right_start_command

    @property
    def left_speed_command_gain(self):
        return self._left_speed_command_gain

    @property
    def right_speed_command_gain(self):
        return self._right_speed_command_gain

    @property
    def wheel_speed_filter_time_constant_ms(self):
        """Time constant of the encoder-derived wheel-speed estimate."""
        return self._wheel_speed_filter_time_constant_ms

    @property
    def wheel_speed_kp(self):
        return self._wheel_speed_kp

    @property
    def wheel_speed_ki(self):
        """Reserved integral coefficient; the supplied controller uses P only."""
        return self._wheel_speed_ki

    @property
    def wheel_speed_kd(self):
        """Reserved derivative coefficient; the supplied controller uses P only."""
        return self._wheel_speed_kd

    @property
    def max_drive_command(self):
        return self._max_drive_command

    # Read-only compatibility aliases for course projects created before 0.3.
    @property
    def left_start_effort(self):
        return self.left_start_command

    @property
    def right_start_effort(self):
        return self.right_start_command

    @property
    def left_speed_effort_gain(self):
        return self.left_speed_command_gain

    @property
    def right_speed_effort_gain(self):
        return self.right_speed_command_gain

    @property
    def max_effort(self):
        return self.max_drive_command

class NavigationConfig(_ValueRecord):
    __slots__ = (
        "_cruise_speed_mm_s",
        "_approach_speed_mm_s",
        "_slowdown_distance_mm",
        "_turn_rate_rad_s",
        "_position_tolerance_mm",
        "_heading_tolerance_rad",
        "_realign_heading_rad",
    )
    _field_names = (
        "cruise_speed_mm_s",
        "approach_speed_mm_s",
        "slowdown_distance_mm",
        "turn_rate_rad_s",
        "position_tolerance_mm",
        "heading_tolerance_rad",
        "realign_heading_rad",
    )

    def __init__(
        self,
        cruise_speed_mm_s,
        approach_speed_mm_s,
        slowdown_distance_mm,
        turn_rate_rad_s,
        position_tolerance_mm,
        heading_tolerance_rad,
        realign_heading_rad,
    ):
        self._cruise_speed_mm_s = require_positive(
            "cruise_speed_mm_s", cruise_speed_mm_s
        )
        self._approach_speed_mm_s = require_positive(
            "approach_speed_mm_s", approach_speed_mm_s
        )
        self._slowdown_distance_mm = require_positive(
            "slowdown_distance_mm", slowdown_distance_mm
        )
        self._turn_rate_rad_s = require_positive(
            "turn_rate_rad_s", turn_rate_rad_s
        )
        self._position_tolerance_mm = require_nonnegative(
            "position_tolerance_mm", position_tolerance_mm
        )
        self._heading_tolerance_rad = require_nonnegative(
            "heading_tolerance_rad", heading_tolerance_rad
        )
        self._realign_heading_rad = require_nonnegative(
            "realign_heading_rad", realign_heading_rad
        )
        if self._approach_speed_mm_s > self._cruise_speed_mm_s:
            raise ValueError("approach_speed_mm_s must not exceed cruise_speed_mm_s")
        if self._realign_heading_rad < self._heading_tolerance_rad:
            raise ValueError(
                "realign_heading_rad must not be below heading_tolerance_rad"
            )

    @property
    def cruise_speed_mm_s(self):
        return self._cruise_speed_mm_s

    @property
    def approach_speed_mm_s(self):
        return self._approach_speed_mm_s

    @property
    def slowdown_distance_mm(self):
        return self._slowdown_distance_mm

    @property
    def turn_rate_rad_s(self):
        return self._turn_rate_rad_s

    @property
    def position_tolerance_mm(self):
        return self._position_tolerance_mm

    @property
    def heading_tolerance_rad(self):
        return self._heading_tolerance_rad

    @property
    def realign_heading_rad(self):
        return self._realign_heading_rad
`,V=`"""Small runtime controls and named watch values for student programs.

Parameters are declared once, then read through their \`\`value\`\` property.
The Monitor may queue a new value while the program runs; \`\`apply_updates\`\`
applies all queued values together at a control-loop boundary. \`\`Robot\`\` does
this automatically after each measured sample.
"""

import json
import math
from ._build_config import DEBUG_VALIDATION

try:
    import _thread

    _lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _lock = None

try:
    import xrp_sim_bridge as _bridge
except ImportError:
    _bridge = None


MAX_PARAMETERS = 16
MAX_WATCHES = 16
MAX_PLOTS = 16
MAX_ENCODED_VALUE = 2147483647

_parameters = []
_parameters_by_name = {}
_watches = []
_watches_by_name = {}
_plots = []
_plots_by_name = {}
_revision = 0
_runtime_snapshot = (0, (), (), ())
_runtime_json = '{"revision":0,"parameters":[],"watches":[],"plots":[]}'
_runtime_json_snapshot = _runtime_snapshot
_snapshot_dirty = False
_parameter_snapshot_dirty = False
_sample_plots = ()
_sample_plots_dirty = False
_plot_schema = ()
_watch_schema = ()
_plot_schema_dirty = False
_watch_schema_dirty = False
_parameter_records = ()
_parameter_records_dirty = True


def _acquire():
    if _lock is not None:
        _lock.acquire()


def _release():
    if _lock is not None:
        _lock.release()


def _clean_text(value, field, maximum, identifier=False):
    if not isinstance(value, str):
        raise TypeError(field + " must be a string")
    value = value.strip()
    if not value or len(value) > maximum:
        raise ValueError(field + " must contain 1 to " + str(maximum) + " characters")
    if identifier:
        first = value[0]
        if not (("a" <= first <= "z") or ("A" <= first <= "Z") or first == "_"):
            raise ValueError(field + " must begin with a letter or underscore")
        for character in value[1:]:
            if not (
                ("a" <= character <= "z")
                or ("A" <= character <= "Z")
                or ("0" <= character <= "9")
                or character == "_"
            ):
                raise ValueError(field + " may contain only letters, digits, and underscores")
    return value


def _finite_number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(field + " must be a number")
    value = float(value)
    if not math.isfinite(value):
        raise ValueError(field + " must be finite")
    return value


def _default_label(name):
    value = name.replace("_", " ")
    first = value[0]
    if "a" <= first <= "z":
        first = chr(ord(first) - 32)
    return first + value[1:]


def _same_value(left, right):
    return type(left) is type(right) and left == right


class _ValueFrame:
    """One immutable value vector sharing its registered descriptor schema.

    Iteration expands rows for the service/virtual bridge, never for acquisition.
    """

    __slots__ = ("_schema", "_values")

    def __init__(self, schema, values):
        self._schema = schema
        self._values = values

    @property
    def schema(self):
        return self._schema

    @property
    def values(self):
        return self._values

    def __len__(self):
        return len(self.values)

    def __getitem__(self, index):
        return self.schema[index] + (self.values[index],)

    def __iter__(self):
        for index in range(len(self.values)):
            yield self.schema[index] + (self.values[index],)

    def __eq__(self, other):
        return tuple(self) == tuple(other)


def _watch_value(value):
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("watch value must be finite")
    if not isinstance(value, (bool, int, float, str)):
        raise TypeError("watch value must be a number, boolean, or string")
    if isinstance(value, str) and len(value) > 64:
        raise ValueError("watch text may contain at most 64 characters")
    return value


class LiveValue:
    """A registered plot or watch; assign value from the program's loop."""

    __slots__ = ("_record", "_plot")

    def __init__(self, record, is_plot):
        self._record = record
        self._plot = is_plot

    @property
    def value(self):
        return self._record[3]

    @value.setter
    def value(self, value):
        global _snapshot_dirty, _sample_plots_dirty, _plot_schema_dirty, _watch_schema_dirty
        if DEBUG_VALIDATION:
            value = _finite_number(value, "plot value") if self._plot else _watch_value(value)
        # Staging belongs to the program thread. The service reads only the
        # immutable frame committed at a boundary, not this mutable slot.
        if (self._record[3] is None) != (value is None):
            if self._plot:
                _plot_schema_dirty = True
            else:
                _watch_schema_dirty = True
        self._record[3] = value
        _snapshot_dirty = True
        if self._plot:
            _sample_plots_dirty = True


def _parameter_record(parameter):
    record = {
        "name": parameter.name,
        "label": parameter.label,
        "kind": parameter.kind,
        "value": parameter.value,
    }
    if parameter.unit:
        record["unit"] = parameter.unit
    if parameter.kind == "number":
        record["minimum"] = parameter.minimum
        record["maximum"] = parameter.maximum
        record["step"] = parameter.step
    elif parameter.kind == "choice":
        record["options"] = list(parameter.options)
    if parameter._pending is not None:
        record["pendingValue"] = parameter._pending
    return record


def _value_records(values):
    """Expand compact values for JSON only when a display view is requested."""
    records = []
    for name, label, unit, value in values:
        record = {"name": name, "label": label, "value": value}
        if unit:
            record["unit"] = unit
        records.append(record)
    return records


def _encode_snapshot(snapshot):
    revision, parameters, watches, plots = snapshot
    return json.dumps({
        "revision": revision,
        "parameters": parameters,
        "watches": _value_records(watches),
        "plots": _value_records(plots),
    }, separators=(",", ":"))


def _freeze_sample_plots():
    """Called with the live lock held, before retaining an acquisition."""
    global _sample_plots, _sample_plots_dirty, _plot_schema, _plot_schema_dirty
    if _sample_plots_dirty:
        if _plot_schema_dirty:
            _plot_schema = tuple(tuple(item[:3]) for item in _plots if item[3] is not None)
            _plot_schema_dirty = False
        _sample_plots = _ValueFrame(_plot_schema, tuple(item[3] for item in _plots if item[3] is not None))
        _sample_plots_dirty = False
    return _sample_plots


def _refresh_snapshot(commit_values=True):
    """Freeze a boundary view while the caller holds the live-state lock."""
    global _revision, _runtime_snapshot, _runtime_json, _runtime_json_snapshot
    global _snapshot_dirty, _parameter_snapshot_dirty
    global _parameter_records, _parameter_records_dirty, _watch_schema, _watch_schema_dirty
    _revision += 1
    if _parameter_records_dirty:
        _parameter_records = tuple(_parameter_record(item) for item in _parameters)
        _parameter_records_dirty = False
    if commit_values:
        if _watch_schema_dirty:
            _watch_schema = tuple(tuple(item[:3]) for item in _watches if item[3] is not None)
            _watch_schema_dirty = False
        watches = _ValueFrame(_watch_schema, tuple(item[3] for item in _watches if item[3] is not None))
        plots = _freeze_sample_plots()
    else:
        # A service-side pending-parameter refresh must not read producer slots
        # midway through the next control iteration.
        watches, plots = _runtime_snapshot[2], _runtime_snapshot[3]
    value = (_revision, _parameter_records, watches, plots)
    # These detached records are never mutated. The physical service can encode
    # them after releasing the lock, without delaying parameter/plot updates.
    _runtime_snapshot = value
    if _bridge is not None:
        # The virtual target delivers its boundary view through this bridge;
        # the physical target instead serializes only when a client asks for it.
        _runtime_json = _encode_snapshot(value)
        _runtime_json_snapshot = value
        _bridge.publish_runtime_state(_runtime_json)
    # Clear only after the frame and any required bridge publication succeed;
    # an allocation/encoding failure must leave the next boundary able to retry.
    if commit_values:
        _snapshot_dirty = False
    _parameter_snapshot_dirty = False


class LiveParameter:
    """A value that can be adjusted from the Monitor while a program runs."""

    __slots__ = (
        "name",
        "label",
        "kind",
        "unit",
        "minimum",
        "maximum",
        "step",
        "options",
        "value",
        "_pending",
        "_slot",
        "_encoded",
    )

    def __init__(
        self,
        name,
        label,
        kind,
        value,
        unit="",
        minimum=None,
        maximum=None,
        step=None,
        options=(),
    ):
        self.name = name
        self.label = label
        self.kind = kind
        self.unit = unit
        self.minimum = minimum
        self.maximum = maximum
        self.step = step
        self.options = tuple(options)
        self.value = value
        self._pending = None
        self._slot = -1
        self._encoded = self._encode(value)

    def _encode(self, value):
        if self.kind == "number":
            return int(round((value - self.minimum) / self.step))
        if self.kind == "toggle":
            return 1 if value else 0
        return self.options.index(value)

    def _decode(self, encoded):
        if self.kind == "number":
            maximum_index = int(round((self.maximum - self.minimum) / self.step))
            index = min(maximum_index, max(0, int(encoded)))
            value = self.minimum + index * self.step
            return min(self.maximum, max(self.minimum, value))
        if self.kind == "toggle":
            return bool(encoded)
        index = min(len(self.options) - 1, max(0, int(encoded)))
        return self.options[index]

    def _validate_value(self, value):
        if self.kind == "number":
            value = _finite_number(value, self.name)
            if value < self.minimum or value > self.maximum:
                raise ValueError(
                    self.name
                    + " must be between "
                    + str(self.minimum)
                    + " and "
                    + str(self.maximum)
                )
            encoded = self._encode(value)
            return self._decode(encoded)
        if self.kind == "toggle":
            if not isinstance(value, bool):
                raise TypeError(self.name + " must be True or False")
            return value
        if not isinstance(value, str) or value not in self.options:
            raise ValueError(self.name + " must be one of " + ", ".join(self.options))
        return value


def _declare(parameter):
    global _parameter_records_dirty
    _acquire()
    try:
        if parameter.name in _parameters_by_name:
            raise ValueError("live parameter already exists: " + parameter.name)
        if len(_parameters) >= MAX_PARAMETERS:
            raise ValueError("at most " + str(MAX_PARAMETERS) + " live parameters may be declared")
        if _bridge is not None:
            descriptor = _parameter_record(parameter)
            parameter._slot = int(
                _bridge.register_live_parameter(
                    json.dumps(descriptor, separators=(",", ":")),
                    parameter._encoded,
                )
            )
        _parameters.append(parameter)
        _parameters_by_name[parameter.name] = parameter
        _parameter_records_dirty = True
        _refresh_snapshot()
        return parameter
    finally:
        _release()


def number(name, default, minimum, maximum, step, unit="", label=None):
    """Declare a bounded numeric parameter rendered as a compact slider."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    minimum = _finite_number(minimum, "minimum")
    maximum = _finite_number(maximum, "maximum")
    step = _finite_number(step, "step")
    if maximum <= minimum:
        raise ValueError("maximum must be greater than minimum")
    if step <= 0 or step > maximum - minimum:
        raise ValueError("step must be positive and no larger than the range")
    encoded_maximum = int(round((maximum - minimum) / step))
    if encoded_maximum > MAX_ENCODED_VALUE:
        raise ValueError("numeric parameter declares too many steps")
    parameter = LiveParameter(
        name,
        label,
        "number",
        _finite_number(default, "default"),
        unit=unit,
        minimum=minimum,
        maximum=maximum,
        step=step,
    )
    parameter.value = parameter._validate_value(parameter.value)
    parameter._encoded = parameter._encode(parameter.value)
    return _declare(parameter)


def toggle(name, default, label=None):
    """Declare an on/off parameter rendered as a compact switch."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    if not isinstance(default, bool):
        raise TypeError("default must be True or False")
    return _declare(LiveParameter(name, label, "toggle", default))


def choice(name, default, options, label=None):
    """Declare a short categorical parameter rendered as radio choices."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    if not isinstance(options, (tuple, list)) or not 2 <= len(options) <= 6:
        raise ValueError("options must contain 2 to 6 choices")
    cleaned = tuple(_clean_text(item, "option", 24) for item in options)
    if len(set(cleaned)) != len(cleaned):
        raise ValueError("choice options must be unique")
    if default not in cleaned:
        raise ValueError("default must be one of the choices")
    return _declare(
        LiveParameter(name, label, "choice", default, options=cleaned)
    )


def _stage_value(name, value, unit, label, records, by_name, maximum, kind):
    """Compatibility publisher; new course code uses pre-registered slots."""
    global _plot_schema_dirty, _watch_schema_dirty
    entry = by_name.get(name) if isinstance(name, str) else None
    if (entry is not None and isinstance(unit, str)
            and (label is None or isinstance(label, str))
            and _same_value(entry[1], unit) and _same_value(entry[2], label)):
        record = entry[0]
        if _same_value(record[3], value):
            return False
        if (record[3] is None) != (value is None):
            if records is _plots:
                _plot_schema_dirty = True
            else:
                _watch_schema_dirty = True
        record[3] = value
        return True
    input_unit, input_label = unit, label
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    entry = by_name.get(name)
    if entry is None:
        if len(records) >= maximum:
            raise ValueError("at most " + str(maximum) + " " + kind + " may be published")
        record = [name, label, unit, value]
        records.append(record)
        metadata_changed = changed = True
    else:
        record = entry[0]
        metadata_changed = (record[1] != label or record[2] != unit
                            or (record[3] is None) != (value is None))
        changed = metadata_changed or not _same_value(record[3], value)
        record[1], record[2], record[3] = label, unit, value
    if metadata_changed:
        if records is _plots:
            _plot_schema_dirty = True
        else:
            _watch_schema_dirty = True
    by_name[name] = (record, input_unit, input_label)
    return changed


def watch(name, value, unit="", label=None):
    """Stage a watch; register_watch avoids name lookup in recurring code."""
    global _snapshot_dirty
    if DEBUG_VALIDATION:
        _watch_value(value)
    if _stage_value(name, value, unit, label, _watches, _watches_by_name,
                    MAX_WATCHES, "watches"):
        _snapshot_dirty = True


def plot(name, value, unit="", label=None):
    """Stage a plot; register_plot avoids name lookup in recurring code."""
    global _snapshot_dirty, _sample_plots_dirty
    if DEBUG_VALIDATION:
        value = _finite_number(value, "plot value")
    if _stage_value(name, value, unit, label, _plots, _plots_by_name,
                    MAX_PLOTS, "plot values"):
        _snapshot_dirty = True
        _sample_plots_dirty = True


def register_plot(name, initial=None, unit="", label=None):
    """Register before the loop, then assign the returned signal's value."""
    global _snapshot_dirty, _sample_plots_dirty
    if initial is not None:
        initial = _finite_number(initial, "plot value")
    _stage_value(name, initial, unit, label, _plots, _plots_by_name, MAX_PLOTS, "plot values")
    _snapshot_dirty = _sample_plots_dirty = True
    return LiveValue(_plots_by_name[name.strip()][0], True)


def register_watch(name, initial=None, unit="", label=None):
    """Register before the loop, then assign the returned signal's value."""
    global _snapshot_dirty
    if initial is not None:
        initial = _watch_value(initial)
    _stage_value(name, initial, unit, label, _watches, _watches_by_name, MAX_WATCHES, "watches")
    _snapshot_dirty = True
    return LiveValue(_watches_by_name[name.strip()][0], False)


def apply_updates():
    """Apply the most recent Monitor values as one control-loop update."""
    global _parameter_records_dirty
    changed = False
    _acquire()
    try:
        for parameter in _parameters:
            if _bridge is not None:
                encoded = int(_bridge.read_live_parameter(parameter._slot))
                if encoded != parameter._encoded:
                    parameter.value = parameter._decode(encoded)
                    parameter._encoded = encoded
                    changed = True
            elif parameter._pending is not None:
                parameter.value = parameter._pending
                parameter._encoded = parameter._encode(parameter.value)
                parameter._pending = None
                changed = True
        if changed:
            _parameter_records_dirty = True
        if changed or _snapshot_dirty:
            _refresh_snapshot()
    finally:
        _release()
    return changed


def queue_update(name, value, defer_snapshot=False):
    """Queue a validated update; compact transport can defer its snapshot."""
    global _snapshot_dirty, _parameter_snapshot_dirty, _parameter_records_dirty
    _acquire()
    try:
        parameter = _parameters_by_name.get(name)
        if parameter is None:
            raise ValueError("unknown live parameter: " + str(name))
        value = parameter._validate_value(value)
        if _same_value(value, parameter.value):
            parameter._pending = None
        else:
            parameter._pending = value
        # The physical HTTP handler must not serialize all watches and plots
        # under this cross-core lock for each slider event. Old clients asking
        # for an immediate snapshot materialize it below; otherwise the next
        # course step publishes the applied value.
        _snapshot_dirty = True
        _parameter_records_dirty = True
        if not defer_snapshot:
            _parameter_snapshot_dirty = True
        if _bridge is not None:
            _refresh_snapshot()
        return value
    finally:
        _release()


def runtime_snapshot_json():
    """Encode the latest committed view without holding the control-path lock."""
    global _runtime_json, _runtime_json_snapshot
    _acquire()
    try:
        if _parameter_snapshot_dirty:
            _refresh_snapshot(commit_values=False)
        snapshot = _runtime_snapshot
        if _runtime_json_snapshot is snapshot:
            return _runtime_json
    finally:
        _release()

    encoded = _encode_snapshot(snapshot)
    _acquire()
    try:
        # A control boundary or clear() may have published a new view while
        # encoding. Return this consistent view without replacing a newer cache.
        if _runtime_snapshot is snapshot:
            _runtime_json = encoded
            _runtime_json_snapshot = snapshot
    finally:
        _release()
    return encoded


def _plot_sample_snapshot():
    """Return the immutable values published before this acquisition boundary."""
    _acquire()
    try:
        # Old rows retain their tuples when the next staged values change.
        return _freeze_sample_plots()
    finally:
        _release()


def clear():
    """Clear state before a new physical project starts."""
    global _revision, _snapshot_dirty, _sample_plots, _sample_plots_dirty
    global _plot_schema, _watch_schema, _plot_schema_dirty, _watch_schema_dirty
    global _parameter_records_dirty
    _acquire()
    try:
        _parameters[:] = []
        _parameters_by_name.clear()
        _watches[:] = []
        _watches_by_name.clear()
        _plots[:] = []
        _plots_by_name.clear()
        _plot_schema = _watch_schema = ()
        _plot_schema_dirty = _watch_schema_dirty = False
        _parameter_records_dirty = True
        _sample_plots = ()
        _sample_plots_dirty = False
        _revision = 0
        _snapshot_dirty = False
        _refresh_snapshot()
    finally:
        _release()


__all__ = (
    "LiveParameter",
    "LiveValue",
    "register_plot",
    "register_watch",
    "apply_updates",
    "choice",
    "number",
    "plot",
    "toggle",
    "watch",
)
`,we=`"""Dimensioned arena geometry and occupancy-grid sampling."""

from math import ceil, floor

from ._validation import require_nonnegative, require_number, require_positive
from .records import GridCell, _ValueRecord


class Rectangle(_ValueRecord):
    """Closed axis-aligned rectangle in world millimeters."""

    __slots__ = ("_minimum_x_mm", "_minimum_y_mm", "_maximum_x_mm", "_maximum_y_mm")
    _field_names = (
        "minimum_x_mm",
        "minimum_y_mm",
        "maximum_x_mm",
        "maximum_y_mm",
    )

    def __init__(self, minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm):
        minimum_x_mm = require_number("minimum_x_mm", minimum_x_mm)
        minimum_y_mm = require_number("minimum_y_mm", minimum_y_mm)
        maximum_x_mm = require_number("maximum_x_mm", maximum_x_mm)
        maximum_y_mm = require_number("maximum_y_mm", maximum_y_mm)
        if maximum_x_mm <= minimum_x_mm or maximum_y_mm <= minimum_y_mm:
            raise ValueError("a rectangle must have positive width and height")
        self._minimum_x_mm = minimum_x_mm
        self._minimum_y_mm = minimum_y_mm
        self._maximum_x_mm = maximum_x_mm
        self._maximum_y_mm = maximum_y_mm

    @property
    def minimum_x_mm(self):
        return self._minimum_x_mm

    @property
    def minimum_y_mm(self):
        return self._minimum_y_mm

    @property
    def maximum_x_mm(self):
        return self._maximum_x_mm

    @property
    def maximum_y_mm(self):
        return self._maximum_y_mm

    @property
    def bounds_mm(self):
        return (
            self.minimum_x_mm,
            self.minimum_y_mm,
            self.maximum_x_mm,
            self.maximum_y_mm,
        )

    def contains(self, x_mm, y_mm, margin_mm=0.0):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        margin_mm = require_nonnegative("margin_mm", margin_mm)
        return (
            x_mm >= self.minimum_x_mm - margin_mm
            and x_mm <= self.maximum_x_mm + margin_mm
            and y_mm >= self.minimum_y_mm - margin_mm
            and y_mm <= self.maximum_y_mm + margin_mm
        )


def _rectangle(value, name):
    if isinstance(value, Rectangle):
        return value
    if isinstance(value, (tuple, list)) and len(value) == 4:
        return Rectangle(value[0], value[1], value[2], value[3])
    raise TypeError("{} must be a Rectangle or four-number bounds".format(name))


class ArenaMap:
    """Immutable rectangular arena with fixed obstacles and named features.

    \`\`features\`\` maps a short classroom name to a Rectangle. A feature blocks
    space only when its name is present in \`\`blocked_features\`\`; this keeps the
    one changing part of Challenge 5 explicit in \`\`challenge.py\`\`.
    """

    __slots__ = ("_bounds", "_obstacles", "_features", "_blocked_features")

    def __init__(
        self,
        bounds_mm,
        obstacles=(),
        features=None,
        blocked_features=(),
    ):
        bounds = _rectangle(bounds_mm, "bounds_mm")
        if not isinstance(obstacles, (tuple, list)):
            raise TypeError("obstacles must be a tuple or list")
        obstacle_values = tuple(
            _rectangle(value, "obstacle") for value in obstacles
        )
        if features is None:
            features = {}
        if not isinstance(features, dict):
            raise TypeError("features must map names to rectangles")
        feature_values = {}
        for name, rectangle in features.items():
            if not isinstance(name, str) or not name:
                raise TypeError("feature names must be nonempty strings")
            feature_values[name] = _rectangle(rectangle, "feature " + name)
        blocked = tuple(blocked_features)
        for name in blocked:
            if name not in feature_values:
                raise ValueError("unknown blocked feature: " + str(name))
        self._bounds = bounds
        self._obstacles = obstacle_values
        self._features = feature_values
        self._blocked_features = frozenset(blocked)

    @property
    def bounds_mm(self):
        return self._bounds.bounds_mm

    @property
    def obstacles(self):
        return self._obstacles

    @property
    def feature_names(self):
        return tuple(sorted(self._features.keys()))

    @property
    def blocked_features(self):
        return tuple(
            name for name in self.feature_names if name in self._blocked_features
        )

    def feature_bounds(self, name):
        try:
            return self._features[name].bounds_mm
        except KeyError:
            raise ValueError("unknown map feature: " + str(name))

    def contains(self, x_mm, y_mm):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        return self._bounds.contains(x_mm, y_mm)

    def is_free(self, x_mm, y_mm, clearance_mm=0.0):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        if not (
            x_mm >= self._bounds.minimum_x_mm + clearance_mm
            and x_mm <= self._bounds.maximum_x_mm - clearance_mm
            and y_mm >= self._bounds.minimum_y_mm + clearance_mm
            and y_mm <= self._bounds.maximum_y_mm - clearance_mm
        ):
            return False
        for rectangle in self._obstacles:
            if rectangle.contains(x_mm, y_mm, clearance_mm):
                return False
        for name in self._blocked_features:
            if self._features[name].contains(x_mm, y_mm, clearance_mm):
                return False
        return True

    def with_feature_blocked(self, name, blocked):
        if name not in self._features:
            raise ValueError("unknown map feature: " + str(name))
        if not isinstance(blocked, bool):
            raise TypeError("blocked must be True or False")
        names = set(self._blocked_features)
        if blocked:
            names.add(name)
        else:
            names.discard(name)
        return ArenaMap(
            self._bounds,
            self._obstacles,
            self._features,
            tuple(names),
        )


class OccupancyGrid:
    """Uniform free/blocked sampling of an ArenaMap."""

    __slots__ = (
        "_resolution_mm",
        "_origin_x_mm",
        "_origin_y_mm",
        "_column_count",
        "_row_count",
        "_blocked",
    )

    def __init__(
        self,
        resolution_mm,
        origin_x_mm,
        origin_y_mm,
        column_count,
        row_count,
        blocked,
    ):
        self._resolution_mm = require_positive("resolution_mm", resolution_mm)
        self._origin_x_mm = require_number("origin_x_mm", origin_x_mm)
        self._origin_y_mm = require_number("origin_y_mm", origin_y_mm)
        if not isinstance(column_count, int) or column_count <= 0:
            raise ValueError("column_count must be a positive integer")
        if not isinstance(row_count, int) or row_count <= 0:
            raise ValueError("row_count must be a positive integer")
        blocked = tuple(bool(value) for value in blocked)
        if len(blocked) != column_count * row_count:
            raise ValueError("blocked data size does not match the grid")
        self._column_count = column_count
        self._row_count = row_count
        self._blocked = blocked

    @classmethod
    def from_arena(cls, arena, resolution_mm, clearance_mm=0.0):
        if not isinstance(arena, ArenaMap):
            raise TypeError("arena must be an ArenaMap")
        resolution_mm = require_positive("resolution_mm", resolution_mm)
        clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        minimum_x, minimum_y, maximum_x, maximum_y = arena.bounds_mm
        columns = int(ceil((maximum_x - minimum_x) / resolution_mm))
        rows = int(ceil((maximum_y - minimum_y) / resolution_mm))
        blocked = []
        for row in range(rows):
            for column in range(columns):
                x_mm = minimum_x + (column + 0.5) * resolution_mm
                y_mm = minimum_y + (row + 0.5) * resolution_mm
                blocked.append(not arena.is_free(x_mm, y_mm, clearance_mm))
        return cls(
            resolution_mm,
            minimum_x,
            minimum_y,
            columns,
            rows,
            blocked,
        )

    @property
    def resolution_mm(self):
        return self._resolution_mm

    @property
    def origin_x_mm(self):
        return self._origin_x_mm

    @property
    def origin_y_mm(self):
        return self._origin_y_mm

    @property
    def column_count(self):
        return self._column_count

    @property
    def row_count(self):
        return self._row_count

    def world_to_cell(self, x_mm, y_mm):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        column = int(floor((x_mm - self.origin_x_mm) / self.resolution_mm))
        row = int(floor((y_mm - self.origin_y_mm) / self.resolution_mm))
        cell = GridCell(column, row)
        return cell if self.contains(cell) else None

    def cell_center(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        if not self.contains(cell):
            raise ValueError("cell is outside the grid")
        return (
            self.origin_x_mm + (cell.column + 0.5) * self.resolution_mm,
            self.origin_y_mm + (cell.row + 0.5) * self.resolution_mm,
        )

    def contains(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        return (
            cell.column >= 0
            and cell.column < self.column_count
            and cell.row >= 0
            and cell.row < self.row_count
        )

    def is_blocked(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        if not self.contains(cell):
            return True
        index = cell.row * self.column_count + cell.column
        return self._blocked[index]

    def neighbors(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        values = []
        for column_delta, row_delta in ((1, 0), (0, 1), (-1, 0), (0, -1)):
            candidate = GridCell(
                cell.column + column_delta,
                cell.row + row_delta,
            )
            if not self.is_blocked(candidate):
                values.append(candidate)
        return tuple(values)
`,Te=`"""Delivery-task record and supplied Challenge 5 mission sequence."""

from math import sqrt

from ._validation import (
    require_bool,
    require_int,
    require_nonnegative,
    require_number,
    require_positive,
)
from .maps import ArenaMap, OccupancyGrid
from .records import GridPath, NavigationGoal, Pose, STOP_COMMAND, _ValueRecord
from .utils import wrap_angle_rad


class DeliveryTask(_ValueRecord):
    """All task-specific values needed for one delivery mission."""

    __slots__ = (
        "_initial_pose",
        "_arena",
        "_grid_resolution_mm",
        "_clearance_mm",
        "_destination",
        "_observed_feature_name",
        "_range_sample_count",
        "_minimum_usable_range_count",
        "_blocked_range_threshold_mm",
        "_assume_blocked_without_range",
    )
    _field_names = (
        "initial_pose",
        "arena",
        "grid_resolution_mm",
        "clearance_mm",
        "destination",
        "observed_feature_name",
        "range_sample_count",
        "minimum_usable_range_count",
        "blocked_range_threshold_mm",
        "assume_blocked_without_range",
    )

    def __init__(
        self,
        initial_pose,
        arena,
        grid_resolution_mm,
        clearance_mm,
        destination,
        observed_feature_name,
        range_sample_count,
        minimum_usable_range_count,
        blocked_range_threshold_mm,
        assume_blocked_without_range,
    ):
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        require_number("initial_pose.x_mm", initial_pose.x_mm)
        require_number("initial_pose.y_mm", initial_pose.y_mm)
        require_number("initial_pose.heading_rad", initial_pose.heading_rad)
        if not isinstance(arena, ArenaMap):
            raise TypeError("arena must be an ArenaMap")
        if not isinstance(destination, NavigationGoal):
            raise TypeError("destination must be a NavigationGoal")
        if (
            not isinstance(observed_feature_name, str)
            or observed_feature_name not in arena.feature_names
        ):
            raise ValueError("observed_feature_name must name an arena feature")
        range_sample_count = require_int(
            "range_sample_count", range_sample_count, minimum=1
        )
        minimum_usable_range_count = require_int(
            "minimum_usable_range_count",
            minimum_usable_range_count,
            minimum=1,
        )
        if minimum_usable_range_count > range_sample_count:
            raise ValueError(
                "minimum_usable_range_count must not exceed range_sample_count"
            )
        self._initial_pose = initial_pose
        self._arena = arena
        self._grid_resolution_mm = require_positive(
            "grid_resolution_mm", grid_resolution_mm
        )
        self._clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        self._destination = destination
        self._observed_feature_name = observed_feature_name
        self._range_sample_count = range_sample_count
        self._minimum_usable_range_count = minimum_usable_range_count
        self._blocked_range_threshold_mm = require_positive(
            "blocked_range_threshold_mm", blocked_range_threshold_mm
        )
        self._assume_blocked_without_range = require_bool(
            "assume_blocked_without_range", assume_blocked_without_range
        )

    @property
    def initial_pose(self):
        return self._initial_pose

    @property
    def arena(self):
        return self._arena

    @property
    def grid_resolution_mm(self):
        return self._grid_resolution_mm

    @property
    def clearance_mm(self):
        return self._clearance_mm

    @property
    def destination(self):
        return self._destination

    @property
    def observed_feature_name(self):
        return self._observed_feature_name

    @property
    def range_sample_count(self):
        return self._range_sample_count

    @property
    def minimum_usable_range_count(self):
        return self._minimum_usable_range_count

    @property
    def blocked_range_threshold_mm(self):
        return self._blocked_range_threshold_mm

    @property
    def assume_blocked_without_range(self):
        return self._assume_blocked_without_range


class DeliveryMission:
    """Observe the route, plan it, follow it, and verify delivery."""

    __slots__ = (
        "_task",
        "_navigation",
        "_planner",
        "_range_estimate_mm",
        "_feature_blocked",
        "_planned_path",
        "_navigation_step_count",
        "_result",
    )

    def __init__(self, task, navigation, planner):
        if not isinstance(task, DeliveryTask):
            raise TypeError("task must be a DeliveryTask")
        if not all(
            callable(getattr(navigation, name, None))
            for name in ("start", "update", "is_complete")
        ):
            raise TypeError(
                "navigation must implement the NavigationController interface"
            )
        if getattr(navigation, "config", None) is None:
            raise TypeError("navigation must expose its NavigationConfig as config")
        if not callable(getattr(planner, "plan", None)):
            raise TypeError("planner must implement the GridPlanner interface")
        self._task = task
        self._navigation = navigation
        self._planner = planner
        self._range_estimate_mm = None
        self._feature_blocked = None
        self._planned_path = None
        self._navigation_step_count = 0
        self._result = None

    @property
    def task(self):
        return self._task

    @property
    def result(self):
        return self._result

    @property
    def range_estimate_mm(self):
        return self._range_estimate_mm

    @property
    def feature_blocked(self):
        return self._feature_blocked

    @property
    def planned_path(self):
        return self._planned_path

    @property
    def navigation_step_count(self):
        return self._navigation_step_count

    @staticmethod
    def _path_is_valid(path, grid, start, goal):
        if not isinstance(path, GridPath):
            return False
        if path.cells[0] != start or path.cells[-1] != goal:
            return False
        for cell in path.cells:
            if grid.is_blocked(cell):
                return False
        for first, second in zip(path.cells, path.cells[1:]):
            if second not in grid.neighbors(first):
                return False
        return True

    def _destination_is_reached(self, pose):
        destination = self.task.destination
        position_error_mm = sqrt(
            (pose.x_mm - destination.x_mm) ** 2
            + (pose.y_mm - destination.y_mm) ** 2
        )
        if position_error_mm > self._navigation.config.position_tolerance_mm:
            return False
        if destination.heading_rad is None:
            return True
        heading_error_rad = wrap_angle_rad(
            pose.heading_rad - destination.heading_rad
        )
        return abs(heading_error_rad) <= self._navigation.config.heading_tolerance_rad

    def run(self, robot):
        self._range_estimate_mm = None
        self._feature_blocked = None
        self._planned_path = None
        self._navigation_step_count = 0
        self._result = None
        state = None
        try:
            state = robot.start(self.task.initial_pose)
            # Allow larger collections and slower configured control periods.
            timeout_s = max(2.0, self.task.range_sample_count * (2 * robot.config.sample_period_ms + 140) / 1000.0)
            samples = robot.collect_range_samples(self.task.range_sample_count, timeout_s=timeout_s)
            state = robot.state
            estimate = robot.estimate_range(
                samples,
                self.task.minimum_usable_range_count,
            )
            self._range_estimate_mm = estimate
            blocked = (
                self.task.assume_blocked_without_range
                if estimate is None
                else estimate <= self.task.blocked_range_threshold_mm
            )
            self._feature_blocked = blocked
            arena = self.task.arena.with_feature_blocked(
                self.task.observed_feature_name,
                blocked,
            )
            grid = OccupancyGrid.from_arena(
                arena,
                self.task.grid_resolution_mm,
                self.task.clearance_mm,
            )
            start = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
            goal = grid.world_to_cell(
                self.task.destination.x_mm,
                self.task.destination.y_mm,
            )
            if (
                start is None
                or goal is None
                or grid.is_blocked(start)
                or grid.is_blocked(goal)
            ):
                self._result = "no_path"
                return state
            path = self._planner.plan(grid, start, goal)
            self._planned_path = path
            if path is None:
                self._result = "no_path"
                return state
            if not self._path_is_valid(path, grid, start, goal):
                self._result = "invalid_path"
                return state

            goals = list(path.to_goals(grid))
            goals[-1] = self.task.destination
            self._navigation.start(goals)
            steps = 0
            while not self._navigation.is_complete():
                state = robot.step(self._navigation.update(state.pose))
                steps += 1
                self._navigation_step_count = steps
            self._result = (
                "delivered"
                if self._destination_is_reached(state.pose)
                else "destination_not_reached"
            )
            return state
        finally:
            robot.stop()
`,Ee=`"""Read-only course values, with recurring validation in debug builds."""

from ._build_config import DEBUG_VALIDATION
from ._validation import (
    require_bool,
    require_int,
    require_nonnegative,
    require_number,
    require_optional_positive,
)
from .utils import wrap_angle_rad


class _ValueRecord:
    __slots__ = ()
    _field_names = ()

    def __repr__(self):
        values = []
        for name in self._field_names:
            values.append("{}={!r}".format(name, getattr(self, name)))
        return "{}({})".format(type(self).__name__, ", ".join(values))

    def __eq__(self, other):
        if type(self) is not type(other):
            return False
        for name in self._field_names:
            if getattr(self, name) != getattr(other, name):
                return False
        return True

    def __ne__(self, other):
        return not self == other


class ReflectanceReadings(_ValueRecord):
    """Normalized left and right floor reflectance: 0 light, 1 dark."""

    __slots__ = ("_left", "_right")
    _field_names = ("left", "right")

    def __init__(self, left, right):
        if DEBUG_VALIDATION:
            left = require_number("left", left)
            right = require_number("right", right)
            if not 0.0 <= left <= 1.0 or not 0.0 <= right <= 1.0:
                raise ValueError("reflectance readings must be within [0.0, 1.0]")
        self._left = left
        self._right = right

    @property
    def left(self):
        return self._left

    @property
    def right(self):
        return self._right


class RawSensors(_ValueRecord):
    __slots__ = (
        "_time_ms",
        "_left_encoder_count",
        "_right_encoder_count",
        "_range_mm",
        "_button_pressed",
        "_reflectance",
    )
    _field_names = (
        "time_ms",
        "left_encoder_count",
        "right_encoder_count",
        "range_mm",
        "button_pressed",
        "reflectance",
    )

    def __init__(
        self,
        time_ms,
        left_encoder_count,
        right_encoder_count,
        range_mm,
        button_pressed,
        reflectance=None,
    ):
        if DEBUG_VALIDATION:
            self._time_ms = require_int("time_ms", time_ms, minimum=0)
            self._left_encoder_count = require_int(
                "left_encoder_count", left_encoder_count
            )
            self._right_encoder_count = require_int(
                "right_encoder_count", right_encoder_count
            )
            self._range_mm = require_optional_positive("range_mm", range_mm)
            self._button_pressed = require_bool("button_pressed", button_pressed)
            if reflectance is not None and not isinstance(
                reflectance, ReflectanceReadings
            ):
                raise TypeError("reflectance must be ReflectanceReadings or None")
        else:
            self._time_ms = time_ms
            self._left_encoder_count = left_encoder_count
            self._right_encoder_count = right_encoder_count
            self._range_mm = range_mm
            self._button_pressed = button_pressed
        self._reflectance = reflectance

    @property
    def time_ms(self):
        return self._time_ms

    @property
    def left_encoder_count(self):
        return self._left_encoder_count

    @property
    def right_encoder_count(self):
        return self._right_encoder_count

    @property
    def range_mm(self):
        return self._range_mm

    @property
    def button_pressed(self):
        return self._button_pressed

    @property
    def reflectance(self):
        return self._reflectance


class WheelSpeeds(_ValueRecord):
    __slots__ = ("_left_mm_s", "_right_mm_s")
    _field_names = ("left_mm_s", "right_mm_s")

    def __init__(self, left_mm_s, right_mm_s):
        if DEBUG_VALIDATION:
            self._left_mm_s = require_number("left_mm_s", left_mm_s)
            self._right_mm_s = require_number("right_mm_s", right_mm_s)
        else:
            self._left_mm_s = left_mm_s
            self._right_mm_s = right_mm_s

    @property
    def left_mm_s(self):
        return self._left_mm_s

    @property
    def right_mm_s(self):
        return self._right_mm_s


class DriveCommand(_ValueRecord):
    """Normalized left and right motor commands before sign conversion."""

    __slots__ = ("_left", "_right")
    _field_names = ("left", "right")

    def __init__(self, left, right):
        if DEBUG_VALIDATION:
            left = require_number("left", left)
            right = require_number("right", right)
            if abs(left) > 1.0 or abs(right) > 1.0:
                raise ValueError("drive commands must be within [-1.0, 1.0]")
        self._left = left
        self._right = right

    @property
    def left(self):
        return self._left

    @property
    def right(self):
        return self._right


# Compatibility for projects created before the drive-command terminology was
# adopted. Both names refer to the same read-only value type.
MotorEfforts = DriveCommand


class MotionCommand(_ValueRecord):
    __slots__ = ("_forward_speed_mm_s", "_turn_rate_rad_s")
    _field_names = ("forward_speed_mm_s", "turn_rate_rad_s")

    def __init__(self, forward_speed_mm_s, turn_rate_rad_s):
        if DEBUG_VALIDATION:
            self._forward_speed_mm_s = require_number(
                "forward_speed_mm_s", forward_speed_mm_s
            )
            self._turn_rate_rad_s = require_number("turn_rate_rad_s", turn_rate_rad_s)
        else:
            self._forward_speed_mm_s = forward_speed_mm_s
            self._turn_rate_rad_s = turn_rate_rad_s

    @property
    def forward_speed_mm_s(self):
        return self._forward_speed_mm_s

    @property
    def turn_rate_rad_s(self):
        return self._turn_rate_rad_s


class Measurements(_ValueRecord):
    __slots__ = (
        "_time_ms",
        "_dt_s",
        "_left_position_mm",
        "_right_position_mm",
        "_left_increment_mm",
        "_right_increment_mm",
        "_left_speed_mm_s",
        "_right_speed_mm_s",
        "_range_mm",
        "_button_pressed",
        "_reflectance",
        "_wheel_speeds",
    )
    _field_names = (
        "time_ms",
        "dt_s",
        "left_position_mm",
        "right_position_mm",
        "left_increment_mm",
        "right_increment_mm",
        "left_speed_mm_s",
        "right_speed_mm_s",
        "range_mm",
        "button_pressed",
        "reflectance",
    )

    def __init__(
        self,
        time_ms,
        dt_s,
        left_position_mm,
        right_position_mm,
        left_increment_mm,
        right_increment_mm,
        left_speed_mm_s,
        right_speed_mm_s,
        range_mm,
        button_pressed,
        reflectance=None,
    ):
        if DEBUG_VALIDATION:
            self._time_ms = require_int("time_ms", time_ms, minimum=0)
            self._dt_s = require_nonnegative("dt_s", dt_s)
            self._left_position_mm = require_number(
                "left_position_mm", left_position_mm
            )
            self._right_position_mm = require_number(
                "right_position_mm", right_position_mm
            )
            self._left_increment_mm = require_number(
                "left_increment_mm", left_increment_mm
            )
            self._right_increment_mm = require_number(
                "right_increment_mm", right_increment_mm
            )
            self._left_speed_mm_s = require_number("left_speed_mm_s", left_speed_mm_s)
            self._right_speed_mm_s = require_number(
                "right_speed_mm_s", right_speed_mm_s
            )
            self._range_mm = require_optional_positive("range_mm", range_mm)
            self._button_pressed = require_bool("button_pressed", button_pressed)
            if reflectance is not None and not isinstance(
                reflectance, ReflectanceReadings
            ):
                raise TypeError("reflectance must be ReflectanceReadings or None")
        else:
            self._time_ms = time_ms
            self._dt_s = dt_s
            self._left_position_mm = left_position_mm
            self._right_position_mm = right_position_mm
            self._left_increment_mm = left_increment_mm
            self._right_increment_mm = right_increment_mm
            self._left_speed_mm_s = left_speed_mm_s
            self._right_speed_mm_s = right_speed_mm_s
            self._range_mm = range_mm
            self._button_pressed = button_pressed
        self._reflectance = reflectance
        self._wheel_speeds = None

    @property
    def time_ms(self):
        return self._time_ms

    @property
    def dt_s(self):
        return self._dt_s

    @property
    def left_position_mm(self):
        return self._left_position_mm

    @property
    def right_position_mm(self):
        return self._right_position_mm

    @property
    def left_increment_mm(self):
        return self._left_increment_mm

    @property
    def right_increment_mm(self):
        return self._right_increment_mm

    @property
    def left_speed_mm_s(self):
        return self._left_speed_mm_s

    @property
    def right_speed_mm_s(self):
        return self._right_speed_mm_s

    @property
    def range_mm(self):
        return self._range_mm

    @property
    def button_pressed(self):
        return self._button_pressed

    @property
    def reflectance(self):
        return self._reflectance

    @property
    def wheel_speeds(self):
        if self._wheel_speeds is None:
            self._wheel_speeds = WheelSpeeds(
                self._left_speed_mm_s, self._right_speed_mm_s
            )
        return self._wheel_speeds


class Pose(_ValueRecord):
    __slots__ = ("_x_mm", "_y_mm", "_heading_rad")
    _field_names = ("x_mm", "y_mm", "heading_rad")

    def __init__(self, x_mm, y_mm, heading_rad):
        if DEBUG_VALIDATION:
            self._x_mm = require_number("x_mm", x_mm)
            self._y_mm = require_number("y_mm", y_mm)
            heading_rad = require_number("heading_rad", heading_rad)
        else:
            self._x_mm = x_mm
            self._y_mm = y_mm
        self._heading_rad = wrap_angle_rad(heading_rad)

    @property
    def x_mm(self):
        return self._x_mm

    @property
    def y_mm(self):
        return self._y_mm

    @property
    def heading_rad(self):
        return self._heading_rad


class RobotState(_ValueRecord):
    __slots__ = ("_measurements", "_pose")
    _field_names = ("measurements", "pose")

    def __init__(self, measurements, pose):
        if DEBUG_VALIDATION:
            if not isinstance(measurements, Measurements):
                raise TypeError("measurements must be a Measurements value")
            if not isinstance(pose, Pose):
                raise TypeError("pose must be a Pose value")
        self._measurements = measurements
        self._pose = pose

    @property
    def measurements(self):
        return self._measurements

    @property
    def pose(self):
        return self._pose


class NavigationGoal(_ValueRecord):
    __slots__ = ("_x_mm", "_y_mm", "_heading_rad")
    _field_names = ("x_mm", "y_mm", "heading_rad")

    def __init__(self, x_mm, y_mm, heading_rad=None):
        self._x_mm = require_number("x_mm", x_mm)
        self._y_mm = require_number("y_mm", y_mm)
        if heading_rad is None:
            self._heading_rad = None
        else:
            self._heading_rad = wrap_angle_rad(
                require_number("heading_rad", heading_rad)
            )

    @property
    def x_mm(self):
        return self._x_mm

    @property
    def y_mm(self):
        return self._y_mm

    @property
    def heading_rad(self):
        return self._heading_rad


class GridCell(_ValueRecord):
    """Integer occupancy-grid coordinate."""

    __slots__ = ("_column", "_row")
    _field_names = ("column", "row")

    def __init__(self, column, row):
        self._column = require_int("column", column)
        self._row = require_int("row", row)

    @property
    def column(self):
        return self._column

    @property
    def row(self):
        return self._row

    def __hash__(self):
        return hash((self.column, self.row))


class GridPath(_ValueRecord):
    """Ordered cells joined by horizontal or vertical steps."""

    __slots__ = ("_cells",)
    _field_names = ("cells",)

    def __init__(self, cells):
        if not isinstance(cells, (tuple, list)):
            raise TypeError("cells must be a tuple or list of GridCell values")
        cells = tuple(cells)
        if not cells:
            raise ValueError("cells must contain at least one GridCell")
        previous = None
        for cell in cells:
            if not isinstance(cell, GridCell):
                raise TypeError("cells must contain only GridCell values")
            if previous is not None:
                step = abs(cell.column - previous.column) + abs(cell.row - previous.row)
                if step != 1:
                    raise ValueError(
                        "successive path cells must share a horizontal or vertical side"
                    )
            previous = cell
        self._cells = cells

    @property
    def cells(self):
        return self._cells

    def to_goals(self, grid, final_heading_rad=None):
        if final_heading_rad is not None:
            final_heading_rad = wrap_angle_rad(
                require_number("final_heading_rad", final_heading_rad)
            )
        selected = []
        if len(self.cells) == 1:
            selected.append(self.cells[0])
        else:
            for index in range(1, len(self.cells) - 1):
                previous = self.cells[index - 1]
                current = self.cells[index]
                following = self.cells[index + 1]
                before = (
                    current.column - previous.column,
                    current.row - previous.row,
                )
                after = (
                    following.column - current.column,
                    following.row - current.row,
                )
                if before != after:
                    selected.append(current)
            selected.append(self.cells[-1])

        goals = []
        for index, cell in enumerate(selected):
            x_mm, y_mm = grid.cell_center(cell)
            heading = final_heading_rad if index == len(selected) - 1 else None
            goals.append(NavigationGoal(x_mm, y_mm, heading))
        return tuple(goals)


STOP_COMMAND = MotionCommand(0.0, 0.0)
`,De=`"""The measured sample loop shared by all five course challenges."""

try:
    from time import sleep_ms as _default_sleep_ms
    from time import ticks_add as _default_ticks_add
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _default_ticks_ms
except ImportError:  # CPython tests
    from time import monotonic, sleep

    def _default_sleep_ms(duration_ms):
        sleep(duration_ms / 1000.0)

    def _default_ticks_ms():
        return int(monotonic() * 1000.0)

    def _default_ticks_add(value, delta):
        return value + delta

    def _ticks_diff(newer, older):
        return newer - older

from .config import RobotConfig
from ._build_config import DEBUG_VALIDATION
from ._validation import require_int, require_number, require_positive
from ._telemetry import begin_course_samples, end_course_samples, publish_state
from .records import DriveCommand, MotionCommand, Pose, RobotState, STOP_COMMAND
from .live import apply_updates


_managed_start = False


def _set_managed_start(enabled):
    """Let a course runtime start immediately after its Run command."""
    global _managed_start
    _managed_start = bool(enabled)


class Robot:
    """Assemble selected components into one explicit measure/control loop."""

    __slots__ = (
        "_config",
        "_bot",
        "_sensor_model",
        "_wheel_controller",
        "_differential_drive",
        "_odometry",
        "_set_drive",
        "_read",
        "_sensor_update",
        "_wheel_update",
        "_wheel_speeds",
        "_odometry_update",
        "_wheel_control_values",
        "_scalar_targets",
        "_scalar_wheel_update",
        "_scalar_set_drive",
        "_sleep_ms",
        "_ticks_add",
        "_ticks_diff",
        "_ticks_ms",
        "_next_sample_ms",
        "_state",
        "_last_overrun_ms",
    )

    def __init__(
        self,
        config,
        bot,
        sensor_model,
        wheel_controller,
        differential_drive,
        odometry,
        _sleep_ms=None,
        _ticks_add=None,
        _ticks_diff_fn=None,
        _ticks_ms=None,
    ):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        required = (
            (bot, ("read", "reset_encoders", "wait_for_button", "stop")),
            (sensor_model, ("reset", "update", "estimate_range")),
            (wheel_controller, ("reset", "update")),
            (differential_drive, ("wheel_speeds",)),
            (odometry, ("reset", "update")),
        )
        for component, methods in required:
            if any(not callable(getattr(component, name, None)) for name in methods):
                raise TypeError("robot component does not implement " + ", ".join(methods))
        set_drive = getattr(bot, "set_drive", None)
        if not callable(set_drive):
            set_drive = getattr(bot, "set_efforts", None)
        if not callable(set_drive):
            raise TypeError("robot component does not implement set_drive")
        self._config = config
        self._bot = bot
        self._sensor_model = sensor_model
        self._wheel_controller = wheel_controller
        self._differential_drive = differential_drive
        self._odometry = odometry
        self._set_drive = set_drive
        # Bind the selected graph once; student methods remain the chosen path.
        self._read = bot.read
        self._sensor_update = sensor_model.update
        self._wheel_update = wheel_controller.update
        self._wheel_speeds = differential_drive.wheel_speeds
        self._odometry_update = odometry.update
        self._wheel_control_values = None
        self._scalar_targets = None
        self._scalar_wheel_update = None
        self._scalar_set_drive = None
        if not DEBUG_VALIDATION:
            prepare_targets = getattr(differential_drive, "_prepare_scalar_targets", None)
            prepare_update = getattr(wheel_controller, "_prepare_scalar_update", None)
            prepare_drive = getattr(bot, "_prepare_scalar_drive", None)
            if callable(prepare_targets) and callable(prepare_update) and callable(prepare_drive):
                values = [0.0, 0.0, 0.0, 0.0]
                scalar_targets = prepare_targets(values)
                scalar_update = prepare_update(values, sensor_model)
                scalar_drive = prepare_drive()
                if callable(scalar_targets) and callable(scalar_update) and callable(scalar_drive):
                    self._wheel_control_values = values
                    self._scalar_targets = scalar_targets
                    self._scalar_wheel_update = scalar_update
                    self._scalar_set_drive = scalar_drive
        self._sleep_ms = _default_sleep_ms if _sleep_ms is None else _sleep_ms
        self._ticks_add = _default_ticks_add if _ticks_add is None else _ticks_add
        self._ticks_diff = _ticks_diff if _ticks_diff_fn is None else _ticks_diff_fn
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self._next_sample_ms = None
        self._state = None
        self._last_overrun_ms = 0

    @property
    def config(self):
        return self._config

    @property
    def state(self):
        if self._state is None:
            raise RuntimeError("call start(initial_pose) before reading state")
        return self._state

    @property
    def last_overrun_ms(self):
        """Latest pre-wait lateness after applying drive, before the sensor read."""
        return self._last_overrun_ms

    @property
    def range_sample_seq(self):
        """Identity of the latest ultrasound attempt, including a missing echo."""
        return getattr(self._bot, "range_sample_seq", None)

    @property
    def range_sample_age_s(self):
        """Age of that attempt in seconds, or None before the first attempt."""
        return getattr(self._bot, "range_sample_age_s", None)

    def start(self, initial_pose, read_reflectance=False):
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        require_number("initial_pose.x_mm", initial_pose.x_mm)
        require_number("initial_pose.y_mm", initial_pose.y_mm)
        require_number("initial_pose.heading_rad", initial_pose.heading_rad)
        if not isinstance(read_reflectance, bool):
            raise TypeError("read_reflectance must be True or False")
        if not _managed_start:
            self._bot.wait_for_button()
        self._bot.reset_encoders()
        raw = self._read_sensors(False, read_reflectance)
        measurements = self._sensor_model.reset(raw)
        self._wheel_controller.reset()
        pose = self._odometry.reset(initial_pose)
        self._state = RobotState(measurements, pose)
        publish_state(self._state, raw_sensors=raw, sample_period_ms=self.config.sample_period_ms)
        apply_updates()
        self._last_overrun_ms = 0
        self._next_sample_ms = self._ticks_add(
            self._ticks_ms(), self.config.sample_period_ms
        )
        return self._state

    def step(self, command, read_range=False, read_reflectance=False):
        if self._state is None:
            raise RuntimeError("call start(initial_pose) before step(command)")
        if DEBUG_VALIDATION:
            if not isinstance(command, MotionCommand):
                raise TypeError("command must be a MotionCommand")
            if not isinstance(read_range, bool):
                raise TypeError("read_range must be True or False")
            if not isinstance(read_reflectance, bool):
                raise TypeError("read_reflectance must be True or False")

        try:
            control_values = self._wheel_control_values
            if control_values is not None and not DEBUG_VALIDATION:
                self._scalar_targets(command)
                self._scalar_wheel_update(self._state.measurements)
                self._scalar_set_drive(control_values[2], control_values[3])
                target = None
                drive_command = None
            else:
                control_values = None
                target = self._wheel_speeds(command)
                drive_command = self._wheel_update(
                    target,
                    self._state.measurements.wheel_speeds,
                )
                self._set_drive(drive_command)
            now_ms = self._ticks_ms()
            remaining_ms = self._ticks_diff(self._next_sample_ms, now_ms)
            self._last_overrun_ms = max(0, -remaining_ms)
            if remaining_ms > 0:
                self._sleep_ms(remaining_ms)
            raw = self._read_sensors(read_range, read_reflectance)
            measurements = self._sensor_update(raw)
            pose = self._odometry_update(
                measurements.left_increment_mm,
                measurements.right_increment_mm,
            )
            self._state = RobotState(measurements, pose)
            publish_state(
                self._state,
                drive_command,
                command,
                target,
                raw_sensors=raw,
                sample_period_ms=self.config.sample_period_ms,
                overrun_ms=self._last_overrun_ms,
                wheel_control_values=control_values,
            )
            apply_updates()
            self._advance_deadline()
            return self._state
        except Exception:
            self._bot.stop()
            raise

    def collect_range_samples(self, count, timeout_s=2.0):
        """Collect distinct attempts while requesting stopped motion.

        Call after the robot has settled. Missing echoes count as None; cached
        reads do not count. The latest stopped-control state remains in state.
        Larger collections or slower control periods may need a longer timeout.
        """
        count = require_int("count", count, minimum=1)
        timeout_s = require_positive("timeout_s", timeout_s)
        if self._state is None:
            raise RuntimeError("call start(initial_pose) before collecting range")
        started_ms = self._ticks_ms()
        previous_seq = self.range_sample_seq
        samples = []
        try:
            while len(samples) < count:
                if self._ticks_diff(self._ticks_ms(), started_ms) >= timeout_s * 1000.0:
                    raise RuntimeError("Ultrasound collection timed out before enough new readings arrived")
                state = self.step(STOP_COMMAND, read_range=True)
                if self._ticks_diff(self._ticks_ms(), started_ms) >= timeout_s * 1000.0:
                    raise RuntimeError("Ultrasound collection timed out before enough new readings arrived")
                sequence = self.range_sample_seq
                if sequence is not None and sequence != previous_seq:
                    samples.append(state.measurements.range_mm)
                    previous_seq = sequence
            return samples
        except BaseException:
            self.stop()
            raise

    def estimate_range(self, samples, minimum_usable):
        minimum_usable = require_int(
            "minimum_usable", minimum_usable, minimum=1
        )
        try:
            samples = tuple(samples)
        except TypeError:
            raise TypeError("samples must be an iterable of numbers or None")
        for index, value in enumerate(samples):
            if value is not None and (
                isinstance(value, bool) or not isinstance(value, (int, float))
            ):
                raise TypeError(
                    "range sample {} must be a number or None; received {}".format(
                        index,
                        type(value).__name__,
                    )
                )
        return self._sensor_model.estimate_range(samples, minimum_usable)

    def stop(self):
        self._bot.stop()
        apply_updates()
        if self._state is not None:
            publish_state(self._state, DriveCommand(0.0, 0.0), sample_period_ms=self.config.sample_period_ms, kind="stop")

    def _read_sensors(self, include_range, include_reflectance):
        begin_course_samples()
        try:
            if include_reflectance:
                return self._read(
                    include_range=include_range,
                    include_reflectance=True,
                )
            # Preserve compatibility with existing test and instructor adapters
            # whose read method predates the optional reflectance argument.
            return self._read(include_range=include_range)
        finally:
            end_course_samples()

    def _advance_deadline(self):
        """Advance one or more absolute periods without catch-up bursts."""
        now_ms = self._ticks_ms()
        self._next_sample_ms = self._ticks_add(
            self._next_sample_ms, self.config.sample_period_ms
        )
        lateness_ms = -self._ticks_diff(self._next_sample_ms, now_ms)
        if lateness_ms >= 0:
            missed_periods = lateness_ms // self.config.sample_period_ms + 1
            self._next_sample_ms = self._ticks_add(
                self._next_sample_ms,
                missed_periods * self.config.sample_period_ms,
            )
`,H=`"""Supplied straight-distance controller used in Challenge 1."""

from ._validation import require_nonnegative
from .config import NavigationConfig
from .records import Measurements, MotionCommand, STOP_COMMAND


class StraightLineController:
    """Choose a forward-speed command from measured wheel travel.

    The controller deliberately has no hardware access. \`\`start\`\` records the
    current mean wheel position. Successive calls to \`\`update\`\` use the mean
    left/right travel to select cruise speed, approach speed, or a stop.
    """

    __slots__ = (
        "_config",
        "_start_position_mm",
        "_distance_mm",
        "_started",
        "_complete",
    )

    def __init__(self, config):
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config
        self._start_position_mm = 0.0
        self._distance_mm = 0.0
        self._started = False
        self._complete = False

    def start(self, measurements, distance_mm):
        """Start a forward move of \`\`distance_mm\`\` from \`\`measurements\`\`."""
        if not isinstance(measurements, Measurements):
            raise TypeError("measurements must be a Measurements value")

        self._distance_mm = require_nonnegative("distance_mm", distance_mm)
        self._start_position_mm = self._mean_position_mm(measurements)
        self._started = True
        self._complete = (
            self._distance_mm <= self._config.position_tolerance_mm
        )

    def update(self, measurements):
        """Return the next straight command from the newest measurements."""
        if not self._started:
            raise RuntimeError("call start() before update()")
        if not isinstance(measurements, Measurements):
            raise TypeError("measurements must be a Measurements value")
        if self._complete:
            return STOP_COMMAND

        travel_mm = self._mean_position_mm(measurements) - self._start_position_mm
        remaining_mm = self._distance_mm - travel_mm

        if remaining_mm <= self._config.position_tolerance_mm:
            self._complete = True
            return STOP_COMMAND

        if remaining_mm <= self._config.slowdown_distance_mm:
            speed_mm_s = self._config.approach_speed_mm_s
        else:
            speed_mm_s = self._config.cruise_speed_mm_s

        return MotionCommand(speed_mm_s, 0.0)

    def is_complete(self):
        return self._complete

    @staticmethod
    def _mean_position_mm(measurements):
        return (
            measurements.left_position_mm + measurements.right_position_mm
        ) / 2.0
`,Oe=`# Measured straight trial with a caller-owned speed decision.

from math import isfinite

from . import live
from .records import MotionCommand, STOP_COMMAND
from .utils import elapsed_time_s


class StraightTrialResult:
    # Final measured state and software estimate of time in motion.

    __slots__ = ("reason", "state", "remaining_mm", "motion_time_s")

    def __init__(self, reason, state, remaining_mm, motion_time_s):
        self.reason = reason
        self.state = state
        self.remaining_mm = remaining_mm
        self.motion_time_s = motion_time_s


def _mean_position_mm(measurements):
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_straight_trial(robot, initial_pose, target_distance_mm, stopping_controller):
    # stopping_controller(remaining_mm) returns a nonnegative speed in mm/s;
    # zero requests the final stop. Manual Stop and exceptions also stop motors.
    # motion_time_s spans first detected motion through first detected rest,
    # excluding the confirmation interval. It is not a floor measurement.
    if not callable(stopping_controller):
        raise TypeError("stopping_controller must be callable")
    if not isfinite(target_distance_mm) or target_distance_mm <= 0.0:
        raise ValueError("target_distance_mm must be positive and finite")

    remaining_plot = live.register_plot("remaining_mm", unit="mm", label="Remaining distance")
    speed_plot = live.register_plot("requested_speed_mm_s", unit="mm/s", label="Requested speed")
    motion_watch = live.register_watch("motion_time_s", unit="s", label="Estimated motion time")

    stationary_speed_mm_s = 5.0
    stationary_duration_s = 0.3
    stopped = False
    stationary_s = 0.0
    first_motion_s = None
    motion_end_s = 0.0
    was_moving = False
    try:
        state = robot.start(initial_pose)
        initial_position_mm = _mean_position_mm(state.measurements)
        start_ms = state.measurements.time_ms
        remaining_mm = target_distance_mm
        while True:
            travel_mm = _mean_position_mm(state.measurements) - initial_position_mm
            remaining_mm = target_distance_mm - travel_mm
            speed_mm_s = 0.0 if stopped else stopping_controller(remaining_mm)
            if isinstance(speed_mm_s, bool) or not isinstance(speed_mm_s, (int, float)):
                raise TypeError("stopping_controller must return a speed in mm/s")
            if not isfinite(speed_mm_s) or speed_mm_s < 0.0:
                raise ValueError("requested forward speed must be finite and nonnegative")
            if speed_mm_s == 0.0:
                stopped = True
            command = STOP_COMMAND if stopped else MotionCommand(speed_mm_s, 0.0)
            state = robot.step(command)
            elapsed_s = elapsed_time_s(state.measurements.time_ms, start_ms)
            travel_mm = _mean_position_mm(state.measurements) - initial_position_mm
            remaining_mm = target_distance_mm - travel_mm
            speeds = state.measurements.wheel_speeds
            moving = max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) > stationary_speed_mm_s
            if moving:
                if first_motion_s is None:
                    first_motion_s = max(0.0, elapsed_s - state.measurements.dt_s)
                motion_end_s = elapsed_s
            elif was_moving:
                motion_end_s = elapsed_s
            was_moving = moving
            stationary_s = stationary_s + state.measurements.dt_s if stopped and not moving else 0.0
            motion_time_s = 0.0 if first_motion_s is None else motion_end_s - first_motion_s
            remaining_plot.value = remaining_mm
            speed_plot.value = command.forward_speed_mm_s
            motion_watch.value = motion_time_s
            if stationary_s >= stationary_duration_s:
                reason = "stationary" if first_motion_s is not None else "no_motion"
                break

        motion_time_s = 0.0 if first_motion_s is None else motion_end_s - first_motion_s
        result = StraightTrialResult(reason, state, remaining_mm, motion_time_s)
        print("Straight trial: result={} motion_time_s={:.2f} remaining_mm={:.1f}".format(
            reason, motion_time_s, remaining_mm,
        ))
        return result
    finally:
        robot.stop()
`,U=`"""Small component interfaces implemented progressively by students."""

from math import isfinite

from .config import NavigationConfig, RobotConfig


class _ConfiguredComponent:
    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config

    @property
    def config(self):
        return self._config


class SensorProcessorBase(_ConfiguredComponent):
    """Convert raw sensor readings into measured robot motion and range.

    A sensor model keeps the encoder and time origins established by
    :meth:\`reset\`, plus any state required to estimate wheel speed.  Its
    :meth:\`update\` method returns the wheel distances, increments, and speeds
    used by the wheel controller, odometry, and mission code.
    """

    __slots__ = ()

    def reset(self, raw):
        """Set the RawSensors count/time origin; return zero-travel Measurements."""
        raise NotImplementedError

    def update(self, raw):
        """Convert the next RawSensors sample into elapsed time, wheel travel,
        wheel speeds, and preserved range, button, and reflectance fields.
        """
        raise NotImplementedError

    def estimate_range(self, samples, minimum_usable):
        """Return median usable range in mm, or None below minimum_usable."""
        raise NotImplementedError


# Existing projects may still import the earlier component name.
SensorModelBase = SensorProcessorBase


class WheelSpeedControllerBase(_ConfiguredComponent):
    """Convert requested and measured wheel speeds into motor commands.

    \`\`Robot\`\` supplies the requested speeds from \`\`DifferentialDrive\`\` and the
    measured speeds from \`\`SensorProcessor\`\`.  An implementation may keep
    controller state between calls and must return a bounded \`\`DriveCommand\`\`.
    """

    __slots__ = ()

    def reset(self):
        """Clear controller state before a run."""
        raise NotImplementedError

    def update(self, target, measured):
        """Return normalized DriveCommand from target and measured WheelSpeeds.

        Both speed inputs use mm/s. A zero target must give zero effort on that
        wheel; reset() clears any feedback history before a run.
        """
        raise NotImplementedError


class DifferentialDriveBase(_ConfiguredComponent):
    """Convert a requested body motion into left and right wheel speeds.

    The calculation uses the robot track width from \`\`RobotConfig\`\`.  Each call
    is independent; an implementation need not retain information from an
    earlier call.  \`\`Robot\`\` sends the returned speeds to the wheel controller.
    """

    __slots__ = ()

    def wheel_speeds(self, command):
        """Return left/right WheelSpeeds in mm/s for one MotionCommand.

        Use forward speed, counterclockwise turn rate, and configured track
        width; this conversion does not depend on earlier calls.
        """
        raise NotImplementedError


class OdometryBase(_ConfiguredComponent):
    """Estimate robot pose from measured left and right wheel travel.

    After :meth:\`reset\`, an implementation keeps the latest \`\`Pose\`\`. \`\`Robot\`\`
    passes the wheel-distance increments returned by \`\`SensorProcessor\`\` and uses
    the updated pose for navigation, mission logic, and telemetry.  Simulator
    ground truth is never an input to this component.
    """

    __slots__ = ()

    def reset(self, initial_pose):
        """Establish and return the pose for a new run."""
        raise NotImplementedError

    def update(self, left_increment_mm, right_increment_mm):
        """Integrate signed wheel-travel increments in mm; return new Pose."""
        raise NotImplementedError

    @property
    def pose(self):
        """Return the latest Pose after reset()."""
        raise NotImplementedError


class NavigationControllerBase:
    """Generate motion commands for an ordered sequence of navigation goals.

    An implementation keeps the goal sequence, the active goal, and any
    internal navigation mode. Mission code supplies the latest odometry
    \`\`Pose\`\` and sends the returned \`\`MotionCommand\`\` to \`\`Robot\`\`.
    """

    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config

    def set_config(self, config):
        """Replace travel settings without clearing the active goal or mode."""
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config

    @property
    def config(self):
        return self._config

    def start(self, goals):
        """Store an ordered navigation-goal sequence and begin it."""
        raise NotImplementedError

    def update(self, pose):
        """Return the next MotionCommand from odometry Pose, or stop when done."""
        raise NotImplementedError

    def current_goal(self):
        """Return the active NavigationGoal, or None after completion."""
        raise NotImplementedError

    def is_complete(self):
        """Return whether every required position and heading is complete."""
        raise NotImplementedError


class GridPlannerBase:
    """Find a connected route through free occupancy-grid cells.

    Search data may remain local to :meth:\`plan\`. Mission code converts the
    returned \`\`GridPath\`\` to navigation goals before the measured robot loop
    follows them.
    """

    __slots__ = ()

    def plan(self, grid, start, goal):
        """Route between start and goal GridCells through free grid cells.

        Either endpoint may be None, in which case return None. Otherwise
        return a GridPath with both endpoints and edge-adjacent steps, or None
        when no connected route exists.
        """
        raise NotImplementedError


class LineFollowerBase:
    """Convert two floor-reflectance readings into local robot motion.

    Reflectance is normalized from 0 (light) to 1 (dark). Positive line error
    means the line is nearer the left sensor and therefore requests a positive
    (counterclockwise) turn rate. Implementations may retain feedback state
    between calls; :meth:\`reset\` clears it before each run.
    """

    __slots__ = ("settings", "last_error", "integral_error", "line_error")

    def __init__(self, settings):
        if not isinstance(settings, dict):
            raise TypeError("settings must be a dict")
        self.settings = settings
        self.reset()

    def reset(self):
        """Clear retained feedback state before a run."""
        self.last_error = 0.0
        self.integral_error = 0.0
        self.line_error = 0.0

    def update(self, reflectance, dt_s):
        """Return a MotionCommand from the latest reflectance sample."""
        raise NotImplementedError


class RangeSafetyControllerBase:
    """Interface for a forward-range speed limiter.

    Inputs and outputs use millimeters and seconds. \`\`update\`\` must return a
    finite, nonnegative forward speed no greater than the requested speed or
    configured maximum. Missing range must return zero.
    """

    __slots__ = (
        "response_time_s",
        "minimum_deceleration_mm_s2",
        "stop_margin_mm",
        "maximum_speed_mm_s",
    )

    def __init__(
        self,
        response_time_s,
        minimum_deceleration_mm_s2,
        stop_margin_mm,
        maximum_speed_mm_s,
    ):
        values = (
            response_time_s,
            minimum_deceleration_mm_s2,
            stop_margin_mm,
            maximum_speed_mm_s,
        )
        if any(
            isinstance(value, bool) or not isinstance(value, (int, float))
            for value in values
        ):
            raise TypeError("range-safety settings must be numeric")
        values = tuple(float(value) for value in values)
        if any(not isfinite(value) for value in values):
            raise ValueError("range-safety settings must be finite")
        if (
            values[0] < 0.0
            or values[1] <= 0.0
            or values[2] < 0.0
            or values[3] <= 0.0
        ):
            raise ValueError("range-safety settings are outside their allowed range")
        self.response_time_s = values[0]
        self.minimum_deceleration_mm_s2 = values[1]
        self.stop_margin_mm = values[2]
        self.maximum_speed_mm_s = values[3]

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        """Limit requested forward speed using measured speed and range.

        Return a nonnegative speed in mm/s no greater than the request or
        configured maximum. range_mm is forward clearance in mm or None;
        return zero when it is missing or cannot preserve the stopping margin.
        """
        raise NotImplementedError


class PoseCorrectorBase:
    """Interface for retained known-wall translation corrections.

    Mission code accepts observations only while the robot is stationary and
    aligned with the stated wall normal. Implementations correct position only
    and preserve the raw odometry heading.
    """

    __slots__ = ("sensor_forward_offset_mm",)

    def __init__(self, sensor_forward_offset_mm):
        if isinstance(sensor_forward_offset_mm, bool) or not isinstance(
            sensor_forward_offset_mm, (int, float)
        ):
            raise TypeError("sensor_forward_offset_mm must be numeric")
        if not isfinite(sensor_forward_offset_mm) or sensor_forward_offset_mm < 0.0:
            raise ValueError("sensor_forward_offset_mm must be finite and nonnegative")
        self.sensor_forward_offset_mm = float(sensor_forward_offset_mm)

    def reset(self, raw_pose):
        """Clear retained x/y offsets and return the initial raw Pose."""
        raise NotImplementedError

    def corrected_pose(self, raw_pose):
        """Apply retained x/y offsets to raw_pose; preserve its heading."""
        raise NotImplementedError

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        """Update x offset from a stationary wall observation; return Pose.

        range_mm is measured from the forward sensor, wall_x_mm locates the
        wall in world coordinates, and facing_positive_x gives its direction.
        """
        raise NotImplementedError

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        """Update y offset from a stationary wall observation; return Pose.

        range_mm is measured from the forward sensor, wall_y_mm locates the
        wall in world coordinates, and facing_positive_y gives its direction.
        """
        raise NotImplementedError


class VisitOrderPlannerBase:
    """Interface for a bounded, directed visit-order optimization."""

    __slots__ = ()

    def plan(self, cost_table, start_index, required_indices, finish_index):
        """Return the least-cost complete route, or None when none exists.

        \`\`cost_table[a][b]\`\` is the directed cost from node \`\`a\`\` to node
        \`\`b\`\`; \`\`None\`\` marks an unavailable directed segment. The result
        starts at \`\`start_index\`\`, contains each required index exactly once,
        and ends at \`\`finish_index\`\`. Equal-cost routes use lexicographic tuple
        order.
        """
        raise NotImplementedError
`,ke=`"""Unit-independent numerical utilities used across course components."""

from math import atan2, pi, sqrt

from ._build_config import DEBUG_VALIDATION
from ._validation import require_number

_TWO_PI = 2.0 * pi
_POSITIVE_PI_BOUNDARY = pi - 1e-6

try:
    from time import ticks_diff as _ticks_diff
except ImportError:  # CPython interface tests do not wrap their monotonic clock.
    def _ticks_diff(later, earlier):
        return later - earlier


def clamp(value, lower, upper):
    """Return *value* limited to the inclusive interval [lower, upper]."""
    if DEBUG_VALIDATION:
        value = require_number("value", value)
        lower = require_number("lower", lower)
        upper = require_number("upper", upper)
        if lower > upper:
            raise ValueError("lower must not exceed upper")
    if value < lower:
        return lower
    if value > upper:
        return upper
    return value


def elapsed_time_s(later_ms, earlier_ms):
    """Return a MicroPython-tick-safe elapsed interval in seconds."""
    if DEBUG_VALIDATION:
        if isinstance(later_ms, bool) or not isinstance(later_ms, int):
            raise TypeError("later_ms must be an integer")
        if isinstance(earlier_ms, bool) or not isinstance(earlier_ms, int):
            raise TypeError("earlier_ms must be an integer")
    return _ticks_diff(later_ms, earlier_ms) / 1000.0


def wrap_angle_rad(angle_rad):
    """Return the equivalent heading in the half-open interval [-pi, pi)."""
    if DEBUG_VALIDATION:
        angle_rad = require_number("angle_rad", angle_rad)
    wrapped = (angle_rad + pi) % _TWO_PI - pi
    # RP2350 MicroPython uses single-precision float arithmetic. At an exact
    # +pi input, the modulo expression can land a few 1e-7 rad below +pi
    # rather than at -pi. Collapse only that representation-scale boundary so
    # CPython and MicroPython keep the same documented half-open convention.
    if wrapped >= _POSITIVE_PI_BOUNDARY:
        return -pi
    return wrapped


def distance_to_goal(pose, goal):
    """Return planar distance from a pose to a navigation goal in millimeters."""
    if DEBUG_VALIDATION:
        dx = require_number("goal.x_mm", goal.x_mm) - require_number(
            "pose.x_mm", pose.x_mm
        )
        dy = require_number("goal.y_mm", goal.y_mm) - require_number(
            "pose.y_mm", pose.y_mm
        )
    else:
        dx = goal.x_mm - pose.x_mm
        dy = goal.y_mm - pose.y_mm
    return sqrt(dx * dx + dy * dy)


def bearing_to_goal(pose, goal):
    """Return the wrapped world-frame bearing from a pose to a goal."""
    if DEBUG_VALIDATION:
        dx = require_number("goal.x_mm", goal.x_mm) - require_number(
            "pose.x_mm", pose.x_mm
        )
        dy = require_number("goal.y_mm", goal.y_mm) - require_number(
            "pose.y_mm", pose.y_mm
        )
    else:
        dx = goal.x_mm - pose.x_mm
        dy = goal.y_mm - pose.y_mm
    return wrap_angle_rad(atan2(dy, dx))
`,W=`"""Load the dimensioned world that belongs to a course project."""

try:
    import json
except ImportError:  # pragma: no cover - older MicroPython name
    import ujson as json
import sys

from ._validation import require_number
from .maps import ArenaMap
from .records import NavigationGoal, Pose


def _number(value, name):
    return require_number(name, value)


def _bounds(item, name):
    try:
        bounds = (
            _number(item["minimum_x_mm"], name + ".minimum_x_mm"),
            _number(item["minimum_y_mm"], name + ".minimum_y_mm"),
            _number(item["maximum_x_mm"], name + ".maximum_x_mm"),
            _number(item["maximum_y_mm"], name + ".maximum_y_mm"),
        )
    except (KeyError, TypeError):
        raise ValueError("{} must define four millimeter bounds".format(name))
    if bounds[2] <= bounds[0] or bounds[3] <= bounds[1]:
        raise ValueError("{} must have positive width and height".format(name))
    return bounds


class ProjectWorld:
    """One named world loaded from the project's \`\`world.json\`\` file."""

    __slots__ = (
        "_id",
        "_label",
        "_bounds_mm",
        "_initial_pose",
        "_obstacles",
        "_features",
        "_markers",
    )

    def __init__(self, item):
        if not isinstance(item, dict):
            raise TypeError("a world must be a JSON object")
        self._id = item.get("id")
        self._label = item.get("label")
        if not isinstance(self._id, str) or not self._id:
            raise ValueError("a world must have an id")
        if not isinstance(self._label, str) or not self._label:
            raise ValueError("a world must have a label")
        self._bounds_mm = _bounds(item.get("bounds"), "bounds")

        pose = item.get("initial_pose", {})
        if not isinstance(pose, dict):
            raise TypeError("initial_pose must be a JSON object")
        self._initial_pose = Pose(
            _number(pose.get("x_mm", 0.0), "initial_pose.x_mm"),
            _number(pose.get("y_mm", 0.0), "initial_pose.y_mm"),
            _number(pose.get("heading_rad", 0.0), "initial_pose.heading_rad"),
        )

        obstacles = []
        features = {}
        for index, obstacle in enumerate(item.get("obstacles", ())):
            if not isinstance(obstacle, dict):
                raise TypeError("obstacles[{}] must be a JSON object".format(index))
            rectangle = _bounds(obstacle, "obstacles[{}]".format(index))
            feature = obstacle.get("feature")
            if feature is None:
                obstacles.append(rectangle)
            elif isinstance(feature, str) and feature:
                features[feature] = rectangle
            else:
                raise ValueError("an obstacle feature must have a nonempty name")
        self._obstacles = tuple(obstacles)
        self._features = features

        markers = item.get("markers", ())
        if not isinstance(markers, (tuple, list)):
            raise TypeError("markers must be a list")
        self._markers = tuple(markers)

    @property
    def id(self):
        return self._id

    @property
    def label(self):
        return self._label

    @property
    def bounds_mm(self):
        return self._bounds_mm

    @property
    def initial_pose(self):
        return self._initial_pose

    @property
    def feature_names(self):
        return tuple(sorted(self._features.keys()))

    def arena_map(self, blocked_features=()):
        """Return an \`\`ArenaMap\`\` using this world's bounds and obstacles."""

        return ArenaMap(
            self.bounds_mm,
            obstacles=self._obstacles,
            features=self._features,
            blocked_features=blocked_features,
        )

    def waypoint(self, name):
        """Return the named waypoint marker as a \`\`NavigationGoal\`\`."""

        for marker in self._markers:
            if marker.get("type") == "waypoint" and marker.get("name") == name:
                heading = marker.get("heading_rad")
                return NavigationGoal(
                    _number(marker.get("x_mm"), name + ".x_mm"),
                    _number(marker.get("y_mm"), name + ".y_mm"),
                    None if heading is None else _number(heading, name + ".heading_rad"),
                )
        raise ValueError("world '{}' has no waypoint '{}'".format(self.id, name))

    def waypoints(self):
        """Return all waypoint markers in their file order."""

        values = []
        for marker in self._markers:
            if marker.get("type") != "waypoint":
                continue
            heading = marker.get("heading_rad")
            values.append(
                NavigationGoal(
                    _number(marker.get("x_mm"), "waypoint.x_mm"),
                    _number(marker.get("y_mm"), "waypoint.y_mm"),
                    None
                    if heading is None
                    else _number(heading, "waypoint.heading_rad"),
                )
            )
        return tuple(values)


def load_world(path="world.json", world_id=None):
    """Read \`\`path\`\` and return its default world or the requested world."""

    source = None
    try:
        source = open(path, "r")
    except OSError as first_error:
        if path.startswith("/"):
            raise first_error
        for root in sys.path:
            if not root:
                continue
            try:
                source = open(root.rstrip("/") + "/" + path, "r")
                break
            except OSError:
                pass
        if source is None:
            raise first_error
    try:
        catalog = json.loads(source.read())
    finally:
        source.close()
    if not isinstance(catalog, dict) or not isinstance(catalog.get("worlds"), list):
        raise ValueError("world.json must contain a worlds list")
    selected_id = catalog.get("default_world") if world_id is None else world_id
    for item in catalog["worlds"]:
        if isinstance(item, dict) and item.get("id") == selected_id:
            return ProjectWorld(item)
    raise ValueError("world.json has no world '{}'".format(selected_id))
`,Ae=`"""The sole UCSB-XRP boundary to physical or simulated XRPLib devices."""

from ._validation import isfinite
from ._build_config import DEBUG_VALIDATION
from ._run_control import check_stop
from ._telemetry import publish_drive_values, publish_raw_sensors
from ._hardware import get_course_motor, get_course_imu, get_course_rangefinder, read_imu_diagnostics
from ._range import RangeAcquisition, range_scope
from .config import RobotConfig
from .records import DriveCommand, RawSensors, ReflectanceReadings

try:
    from time import ticks_diff as _default_ticks_diff
    from time import ticks_ms as _default_ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _default_ticks_ms():
        return int(monotonic() * 1000.0)

    def _default_ticks_diff(newer, older):
        return newer - older


_DIAGNOSTIC_PERIOD_MS = 250
_ENCODER_COUNTER_MODULUS = 1 << 32
_ENCODER_COUNTER_HALF_RANGE = 1 << 31


def _relative_encoder_count(count, zero):
    """Return a signed count relative to \`\`zero\`\`, including 32-bit wrap."""
    return (
        (int(count) - int(zero) + _ENCODER_COUNTER_HALF_RANGE)
        % _ENCODER_COUNTER_MODULUS
    ) - _ENCODER_COUNTER_HALF_RANGE


class _XRPLibDevices:
    """Lazy adapter around only the upstream devices the course uses."""

    __slots__ = (
        "left_motor",
        "right_motor",
        "board",
        "rangefinder",
        "reflectance",
        "imu",
    )

    def __init__(self):
        from XRPLib.board import Board

        self.left_motor = get_course_motor(1)
        self.right_motor = get_course_motor(2)
        self.board = Board.get_default_board()
        self.rangefinder = get_course_rangefinder()
        try:
            from XRPLib.reflectance import Reflectance

            self.reflectance = Reflectance.get_default_reflectance()
        except Exception:
            # Older course runtimes remain usable for challenges that do not
            # request reflectance. Challenge 9 reports an unavailable reading.
            self.reflectance = None
        try:
            self.imu = get_course_imu()
        except Exception:
            # Motion and encoder feedback remain usable if optional IMU
            # diagnostics are unavailable.
            self.imu = None


class XRPBot:
    """Read XRP hardware and apply a bounded, signed drive command.

    \`\`_devices\`\` and \`\`_ticks_ms\`\` are private seams for the virtual XRP and
    interface tests. Student programs construct \`\`XRPBot(config)\`\`.
    """

    __slots__ = (
        "_config",
        "_devices",
        "_ticks_ms",
        "_last_diagnostics_ms",
        "_left_encoder_zero",
        "_right_encoder_zero",
        "_range",
        "_range_baseline",
        "_range_snapshot",
        "_range_scope",
        "_left_counts",
        "_right_counts",
        "_left_effort",
        "_right_effort",
        "_button_pressed",
        "_reflectance_left",
        "_reflectance_right",
        "_battery_reader",
        "_imu",
        "_drive_limit",
        "_minimum_drive",
        "_left_motor_sign",
        "_right_motor_sign",
    )

    def __init__(self, config, _devices=None, _ticks_ms=None):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._devices = _XRPLibDevices() if _devices is None else _devices
        self._left_counts = self._devices.left_motor.get_position_counts
        self._right_counts = self._devices.right_motor.get_position_counts
        self._left_effort = self._devices.left_motor.set_effort
        self._right_effort = self._devices.right_motor.set_effort
        self._button_pressed = self._devices.board.is_button_pressed
        reflectance = getattr(self._devices, "reflectance", None)
        self._reflectance_left = None if reflectance is None else reflectance.get_left
        self._reflectance_right = None if reflectance is None else reflectance.get_right
        battery_reader = getattr(self._devices.board, "get_battery_voltage", None)
        self._battery_reader = battery_reader if callable(battery_reader) else None
        self._imu = getattr(self._devices, "imu", None)
        self._drive_limit = config.max_drive_command
        self._minimum_drive = -config.max_drive_command
        self._left_motor_sign = config.left_motor_sign
        self._right_motor_sign = config.right_motor_sign
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self._range = self._devices.rangefinder
        if not isinstance(self._range, RangeAcquisition):
            # Private instructor/test adapters may still provide a raw driver.
            self._range = RangeAcquisition(self._range, ticks_ms=self._ticks_ms)
        self._reset_range_sample()
        self._last_diagnostics_ms = None
        self._left_encoder_zero = 0
        self._right_encoder_zero = 0
        self.stop()

    @property
    def config(self):
        return self._config

    def _reset_range_sample(self):
        self._range_baseline = self._range.snapshot[0]
        self._range_snapshot = None
        self._range_scope = range_scope()

    def _check_range_scope(self):
        if self._range_scope != range_scope():
            self._reset_range_sample()

    @property
    def range_sample_seq(self):
        """Latest requested ultrasound attempt identity, or None in a new run."""
        self._check_range_scope()
        return None if self._range_snapshot is None else self._range_snapshot[0]

    @property
    def range_sample_age_s(self):
        """Seconds since that attempt completed; a missing echo has an age too."""
        self._check_range_scope()
        if self._range_snapshot is None:
            return None
        return max(0, _default_ticks_diff(self._ticks_ms(), self._range_snapshot[1])) / 1000.0

    def read(self, include_range=False, include_reflectance=False):
        check_stop()
        if DEBUG_VALIDATION:
            if not isinstance(include_range, bool):
                raise TypeError("include_range must be True or False")
            if not isinstance(include_reflectance, bool):
                raise TypeError("include_reflectance must be True or False")

        range_mm = None
        if include_range:
            self._check_range_scope()
            snapshot = self._range.read()
            check_stop()  # A Stop request may have arrived during the echo wait.
            if snapshot[0] > self._range_baseline:
                self._range_snapshot = snapshot
                range_mm = snapshot[2]

        reflectance = None
        if include_reflectance and self._reflectance_left is not None:
            reflectance = ReflectanceReadings(
                self._reflectance_left(),
                self._reflectance_right(),
            )

        now_ms = int(self._ticks_ms())
        raw = RawSensors(
            time_ms=now_ms,
            left_encoder_count=_relative_encoder_count(
                self._left_counts(),
                self._left_encoder_zero,
            ),
            right_encoder_count=_relative_encoder_count(
                self._right_counts(),
                self._right_encoder_zero,
            ),
            range_mm=range_mm,
            button_pressed=bool(self._button_pressed()),
            reflectance=reflectance,
        )
        try:
            publish_raw_sensors(
                raw,
                range_sampled=include_range,
                range_seq=self.range_sample_seq if include_range else None,
                reflectance_sampled=include_reflectance,
                # Range is part of the control decision. Keep optional
                # battery/IMU I2C reads out of that critical path; their last
                # snapshot remains available and the next non-range read
                # refreshes it immediately when due.
                diagnostics=(
                    None
                    if include_range or include_reflectance
                    else self._read_diagnostics(now_ms)
                ),
            )
        except Exception:
            # Browser diagnostics must never interrupt a student program.
            pass
        return raw

    def reset_encoders(self):
        """Use the current hardware counts as zero for this robot session.

        XRPLib's physical reset executes a dynamically assembled PIO
        instruction. A software offset gives the course API the same relative
        counts without disturbing encoder state machines that are already
        running.
        """
        check_stop()
        self._reset_range_sample()
        self._left_encoder_zero = int(
            self._left_counts()
        )
        self._right_encoder_zero = int(
            self._right_counts()
        )

    def wait_for_button(self):
        check_stop()
        self._devices.board.wait_for_button()

    def set_drive(self, command):
        """Apply one normalized command to the left and right motor channels."""
        if not isinstance(command, DriveCommand):
            check_stop()
            self._stop_after_invalid_command()
            raise TypeError("command must be a DriveCommand value")
        self._set_drive_values(command.left, command.right)

    _supplied_set_drive = set_drive

    def _prepare_scalar_drive(self):
        """Use the shared actuator guard only for the unchanged XRPBot API."""
        if (
            DEBUG_VALIDATION
            or type(self) is not XRPBot
            or self.set_drive != self._supplied_set_drive
        ):
            return None
        return self._set_drive_values

    def _set_drive_values(self, left, right):
        """Apply scalar efforts through the same final fail-closed boundary."""
        check_stop()
        if (
            isinstance(left, bool)
            or not isinstance(left, (int, float))
            or isinstance(right, bool)
            or not isinstance(right, (int, float))
        ):
            self._stop_after_invalid_command()
            raise ValueError("drive commands must be finite real numbers")

        try:
            left = float(left)
            right = float(right)
        except (OverflowError, ValueError, TypeError):
            self._stop_after_invalid_command()
            raise ValueError("drive commands must be finite real numbers")
        if not isfinite(left) or not isfinite(right):
            self._stop_after_invalid_command()
            raise ValueError("drive commands must be finite real numbers")

        limit = self._drive_limit
        minimum = self._minimum_drive
        logical_left = minimum if left < minimum else limit if left > limit else left
        logical_right = minimum if right < minimum else limit if right > limit else right
        left = logical_left * self._left_motor_sign
        right = logical_right * self._right_motor_sign

        try:
            self._left_effort(left)
            self._right_effort(right)
            self._publish_drive_safely(logical_left, logical_right)
        except Exception:
            self._best_effort_stop()
            raise

    def set_efforts(self, efforts):
        """Compatibility alias for :meth:\`set_drive\`."""
        self.set_drive(efforts)

    def stop(self):
        error = self._best_effort_stop()
        if error is not None:
            raise error

    def _stop_after_invalid_command(self):
        error = self._best_effort_stop()
        if error is not None:
            raise error

    def _best_effort_stop(self):
        first_error = None
        try:
            self._left_effort(0.0)
        except Exception as error:
            first_error = error
        try:
            self._right_effort(0.0)
        except Exception as error:
            if first_error is None:
                first_error = error
        self._publish_drive_safely(0.0, 0.0)
        return first_error

    def _publish_drive_safely(self, left, right):
        try:
            publish_drive_values(left, right)
        except Exception:
            pass

    def _read_diagnostics(self, now_ms):
        if (
            self._last_diagnostics_ms is not None
            and _default_ticks_diff(now_ms, self._last_diagnostics_ms)
            < _DIAGNOSTIC_PERIOD_MS
        ):
            return None
        self._last_diagnostics_ms = now_ms
        diagnostics = {}
        errors = []
        if self._battery_reader is not None:
            try:
                diagnostics["batteryV"] = float(self._battery_reader())
            except Exception as error:
                errors.append("battery: " + type(error).__name__)
        if self._imu is not None:
            try:
                acceleration, angular_rate, temperature = read_imu_diagnostics(self._imu)
                diagnostics["accelerationMg"] = acceleration
                diagnostics["angularRateMdps"] = angular_rate
                diagnostics["temperatureC"] = temperature
            except Exception as error:
                errors.append("IMU: " + type(error).__name__)
        if diagnostics or errors:
            diagnostics["sensorError"] = "; ".join(errors) if errors else None
        return diagnostics or None
`,G=`data:application/octet-stream;base64,TQYAHw4BPHVjc2JfeHJwX3JlZmVyZW5jZS9fX2luaXRfXy5weQAPFlNlbnNvck1vZGVsAB5TZW5zb3JQcm9jZXNzb3IAKFdoZWVsU3BlZWRDb250cm9sbGVyABZjaGFsbGVuZ2VfMQAiRGlmZmVyZW50aWFsRHJpdmUAEE9kb21ldHJ5ABZjaGFsbGVuZ2VfMgAoTmF2aWdhdGlvbkNvbnRyb2xsZXIAFmNoYWxsZW5nZV8zABZHcmlkUGxhbm5lcgAWY2hhbGxlbmdlXzQADl9fYWxsX18ACgcFEURpZmZlcmVudGlhbERyaXZlAAULR3JpZFBsYW5uZXIABRROYXZpZ2F0aW9uQ29udHJvbGxlcgAFCE9kb21ldHJ5AAULU2Vuc29yTW9kZWwABQ9TZW5zb3JQcm9jZXNzb3IABRRXaGVlbFNwZWVkQ29udHJvbGxlcgCFCBgOAUA4MixMQIEQAhADEAQqAxsFHAIWAhwDFgMcBBYEWYEQBhAHKgIbCBwGFgYcBxYHWYEQCSoBGwocCRYJWYEQCyoBGwwcCxYLWSMAFg1RYw==`,je=`/ucsbxrp/assets/challenge_1-ep5zaMOI.mpy`,Me=`data:application/octet-stream;base64,TQYAHzYLQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfMi5weQAPBmNvcwAGc2luAAhtYXRoACBERUJVR19WQUxJREFUSU9OACx1Y3NiX3hycC5fYnVpbGRfY29uZmlnABxyZXF1aXJlX251bWJlcgAodWNzYl94cnAuX3ZhbGlkYXRpb24AGk1vdGlvbkNvbW1hbmQACFBvc2UAFldoZWVsU3BlZWRzACB1Y3NiX3hycC5yZWNvcmRzACpEaWZmZXJlbnRpYWxEcml2ZUJhc2UAGE9kb21ldHJ5QmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAIkRpZmZlcmVudGlhbERyaXZlABBPZG9tZXRyeQAjHHRyYWNrX3dpZHRoX21tABxfaGFsZl90cmFja19tbQAYd2hlZWxfc3BlZWRzAB50dXJuX3JhdGVfcmFkX3MAJGZvcndhcmRfc3BlZWRfbW1fcwAuX3ByZXBhcmVfc2NhbGFyX3RhcmdldHMALF9zdXBwbGllZF93aGVlbF9zcGVlZHMAHl90cmFja193aWR0aF9tbQAKX3Bvc2UACHBvc2UACnJlc2V0AAh4X21tAAh5X21tABZoZWFkaW5nX3JhZACCPyJsZWZ0X2luY3JlbWVudF9tbQAkcmlnaHRfaW5jcmVtZW50X21tABp3cml0ZV90YXJnZXRzAC8tNRJfX3Nsb3RzX18AEHByb3BlcnR5AAuCEwxjb25maWcAgjUOY29tbWFuZACBQ22CR4I9ZRhpbml0aWFsX3Bvc2UAcwoBBQ5faGFsZl90cmFja19tbQAKAgUFX3Bvc2UABQ9fdHJhY2tfd2lkdGhfbW0ACAMyLjAFH2NvbW1hbmQgbXVzdCBiZSBhIE1vdGlvbkNvbW1hbmQABSxjYWxsIHJlc2V0KGluaXRpYWxfcG9zZSkgYmVmb3JlIHJlYWRpbmcgcG9zZQAFG2luaXRpYWxfcG9zZSBtdXN0IGJlIGEgUG9zZQAFEWluaXRpYWxfcG9zZS54X21tAAURaW5pdGlhbF9wb3NlLnlfbW0ABRhpbml0aWFsX3Bvc2UuaGVhZGluZ19yYWQABSZjYWxsIHJlc2V0KGluaXRpYWxfcG9zZSkgYmVmb3JlIHVwZGF0ZQAIBTFlLTA5hzwYEgFAUiwsOHKLJoAQAhADKgIbBBwCFgIcAxYDWYAQBSoBGwYcBRYFWYAQByoBGwgcBxYHWYAQCRAKEAsqAxsMHAkWCRwKFgocCxYLWYAQDRAOKgIbDxwNFg0cDhYOWVQyABAQEQ00AxYQVDIBEBERDjQDFhFRYwKCbAgVEIgLQERmIIQJRAARJRYmEBAWJyMAFiiwIAABFhIyARYVERUWGTICFhiwYwOBeCsOEiorLIAQKxItJQCxFRKyNgFZshMTIwL3sRgUUWODODIUFSsugBQtJygiJRIFRFASL7ESCTQCQ0cSMCMDNAFlsRMWsBMU9MISC7ETF7LzsRMXsvI0AmODTCqaARgrMYAfIEQrSSJFZkABAxIFQ1QSMrA0ARIQ3tNDSbATFbATGdxEQlFjsBMUJwOxsyAAAsKyYwGCKDMQJCoqLoApJymyExYlAfTDshMXs/MlAIBWshMXs/IlAIFWUWODFBAXEYgxQERmQGhghAkAESUWJhARFicjARYosCAAARYSESkyATQBFhwyAhYdMgMWIbBjBIIIKxASKissgDYrJhItJQCxFRKyNgFZshMTsRgaUbEYG1FjgVARDBwrgDwnJ7ATG1HeREcSMyMENAFlsBMbY4QYIhYdKzSAQSknKioqJBIvsRIKNAJDRxIwIwU0AWUSByMGsRMeNAJZEgcjB7ETHzQCWRIHIwixEyA0AlmxsBgbsBMbY4wAgxAwISsiI4BKJyckKEoiIicoJiouUCQkNDQssBMbUd5ERxIzIwk0AWUSBURSEgcQIrE0AsMSBxAjsjQCxEJEscOyxLO08iMC98W0s/OwExr3xrATGxMgxxI1tjQBIwrXRF6wExsTHrUSArc0AfTyyLATGxMftRIDtzQB9PLJQnC1tvfKt7byy7ATGxMeuhIDuzQBEgO3NAHz9PLIsBMbEx+6EgK7NAESArc0AfP088kSCri5t7byNAOwGBuwExtj`,K=`data:application/octet-stream;base64,TQYAH0EGQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfMy5weQAPIERFQlVHX1ZBTElEQVRJT04ALHVjc2JfeHJwLl9idWlsZF9jb25maWcAGk1vdGlvbkNvbW1hbmQAHE5hdmlnYXRpb25Hb2FsAAhQb3NlABhTVE9QX0NPTU1BTkQAIHVjc2JfeHJwLnJlY29yZHMAME5hdmlnYXRpb25Db250cm9sbGVyQmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAHmJlYXJpbmdfdG9fZ29hbAAKY2xhbXAAIGRpc3RhbmNlX3RvX2dvYWwAHHdyYXBfYW5nbGVfcmFkABx1Y3NiX3hycC51dGlscwAoTmF2aWdhdGlvbkNvbnRyb2xsZXIAIx5fcHJlcGFyZV9jb25maWcADF9nb2FscwAMX2luZGV4ABBjb21wbGV0ZQAKX21vZGUAFHNldF9jb25maWcAImNydWlzZV9zcGVlZF9tbV9zACRfY3J1aXNlX3NwZWVkX21tX3MAJmFwcHJvYWNoX3NwZWVkX21tX3MAKF9hcHByb2FjaF9zcGVlZF9tbV9zAChzbG93ZG93bl9kaXN0YW5jZV9tbQAqX3Nsb3dkb3duX2Rpc3RhbmNlX21tAB50dXJuX3JhdGVfcmFkX3MAIF90dXJuX3JhdGVfcmFkX3MAMl9uZWdhdGl2ZV90dXJuX3JhdGVfcmFkX3MAKnBvc2l0aW9uX3RvbGVyYW5jZV9tbQAsX3Bvc2l0aW9uX3RvbGVyYW5jZV9tbQAqaGVhZGluZ190b2xlcmFuY2VfcmFkACxfaGVhZGluZ190b2xlcmFuY2VfcmFkACZyZWFsaWduX2hlYWRpbmdfcmFkAChfcmVhbGlnbl9oZWFkaW5nX3JhZACCJQh0dXJuABhjdXJyZW50X2dvYWwAFmlzX2NvbXBsZXRlAII/FmhlYWRpbmdfcmFkAAphbGlnbgAKZHJpdmUAEjxnZW5leHByPgAvLTUSX19zbG90c19fAAuCEwxjb25maWcAgjUKZ29hbHMAgUOCO4FZbXeBVwhwb3NlAHMKCwUGX2dvYWxzAAUGX2luZGV4AAUFX21vZGUABRJfY3J1aXNlX3NwZWVkX21tX3MABRRfYXBwcm9hY2hfc3BlZWRfbW1fcwAFFV9zbG93ZG93bl9kaXN0YW5jZV9tbQAFEF90dXJuX3JhdGVfcmFkX3MABRlfbmVnYXRpdmVfdHVybl9yYXRlX3JhZF9zAAUWX3Bvc2l0aW9uX3RvbGVyYW5jZV9tbQAFFl9oZWFkaW5nX3RvbGVyYW5jZV9yYWQABRRfcmVhbGlnbl9oZWFkaW5nX3JhZAAFHWdvYWxzIG11c3QgYmUgYSB0dXBsZSBvciBsaXN0AAUtZ29hbHMgbXVzdCBjb250YWluIG9ubHkgTmF2aWdhdGlvbkdvYWwgdmFsdWVzAAUTcG9zZSBtdXN0IGJlIGEgUG9zZQAIAzAuMAgDMi4whkwgDAFALD4sfoAQAioBGwMcAhYCWYAQBBAFEAYQByoEGwgcBBYEHAUWBRwGFgYcBxYHWYAQCSoBGwocCRYJWYAQCxAMEA0QDioEGw8cCxYLHAwWDBwNFg0cDhYOWVQyABAQEQk0AxYQUWMBhBwIJRCICUAghAuGB2ZAhAqECmRAZAARMBYxEBAWMiMAFjOwIAABFhGwIAEBFhcyAhYSMgMWJzIEFikyBRYqMgYWK7BjB4JwKxQRNDU2gBgrJyUkEjclALEVEbI2AVmxFBKyNgFZKgCxGBOAsRgUEBWxGBZRY4FwKxAXNDU2gB8gKxI3JQCxFReyNgFZsRQSsjYBWVFjhAgaGBI1NoAkJiYmJicmJrETGLAYGbETGrAYG7ETHLAYHbETHrAYH7ETHtGwGCCxEyGwGCKxEyOwGCSxEyWwGCZRY4UMMhgnNTiALi0nJiwnJCQSObESOhI7KgI0AkNHEjwjATQBZRI6sTQBwhI9MgCyXjQBNAFERxI8IwI0AWWysBgTgLAYFLJERBAoQkIQFbAYFlFjAYFgwUAILzSAMVOwU1NLDcESObESBTQC02dZQjFRY4F4GQwpNYA4LSKwExQSPrATEzQB20RCUWOwExOwExRVY3ARCCo1gD2wFCk2AFHeY5JoWlorNT+AQC0nICYlJUMnKCgsKyUiIlApJUMvKCslIiIgKkYnKyVCICAsRCIkI0YSAkRQEjmxEgY0AkNHEjwjAzQBZbAUKTYAwrJR3kRIEBWwGBYSB2MSDbGyNALDs7ATItpEyYCyEyxR3tNEcBIOshMssRMs8zQBxBJAtDQBsBMk2ERZEC2wGBYSBCMEtIDYREWwEx9CQ7ATIDQCY7BXExSB5VoYFBAosBgWQvqAEg4SC7GyNAKxEyzzNAHFsBMWEC7cRGsSQLU0AbATJNhEWRAosBgWEgQjBLWA2ERFsBMfQkOwEyA0AmMQLrAYFkJSEkC1NAGwEybbREcQKLAYFkJms7ATHdpERbATG0JDsBMZxhIMIwW19LATILATHzQDxxIEtrc0AmNCmH5RYw==`,Ne=`data:application/octet-stream;base64,TQYAHxsCQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNC5weQAPGk9jY3VwYW5jeUdyaWQAGnVjc2JfeHJwLm1hcHMAEEdyaWRDZWxsABBHcmlkUGF0aAAgdWNzYl94cnAucmVjb3JkcwAeR3JpZFBsYW5uZXJCYXNlACh1Y3NiX3hycC5zdHVkZW50X2FwaQAWR3JpZFBsYW5uZXIACHBsYW4AFGlzX2Jsb2NrZWQAEm5laWdoYm9ycwB5ggcvLTUSX19zbG90c19fAIITCGdyaWQAgiUIZ29hbACBQ22CO4FXBR1ncmlkIG11c3QgYmUgYW4gT2NjdXBhbmN5R3JpZAAFLnN0YXJ0IGFuZCBnb2FsIG11c3QgYmUgR3JpZENlbGwgdmFsdWVzIG9yIE5vbmUAg3QYCgFALDJsgBACKgEbAxwCFgJZgBAEEAUqAhsGHAQWBBwFFgVZgBAHKgEbCBwHFgdZVDIAEAkRBzQDFglRYwGBTAAKCYgIQEQRDxYQEAkWESoAFhIyABYKUWMBjkCQFEQKExQVFoANKScqIjInMCIlSCQiJiMkJColIiQlJCIyJio0EhexEgI0AkNHEhgjADQBZbJR3kNFs1HeREJRYxIXshIENAJESRIXsxIENAJDRxIYIwE0AWWxFAuyNgFDSLEUC7M2AURCUWOys9lESBIFsioBNAFjsisBxIDFLAFRsmLGQtSAtLVVx7WB5cWxFAy3NgFfS0PIuLbdREJCNre2uFa4s9lEaLMrAclCS7kUDba5f1VVNgFZuX9VstxDLrkUDjYAWRIFEhm5NAE0AWO0FA24NgFZQrt/tRIatDQB10Oif1Fj`,Pe=`data:application/octet-stream;base64,TQYAHx8GQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNi5weQAPEGlzZmluaXRlAAhzcXJ0AAhtYXRoADJSYW5nZVNhZmV0eUNvbnRyb2xsZXJCYXNlACh1Y3NiX3hycC5zdHVkZW50X2FwaQAgREVCVUdfVkFMSURBVElPTgAsdWNzYl94cnAuX2J1aWxkX2NvbmZpZwAqUmFuZ2VTYWZldHlDb250cm9sbGVyAII/KHJlcXVlc3RlZF9zcGVlZF9tbV9zACZtZWFzdXJlZF9zcGVlZF9tbV9zACRtYXhpbXVtX3NwZWVkX21tX3MAHHN0b3BfbWFyZ2luX21tAB5yZXNwb25zZV90aW1lX3MANG1pbmltdW1fZGVjZWxlcmF0aW9uX21tX3MyAC8tNRJfX3Nsb3RzX18AghMQcmFuZ2VfbW0AgUN9gT0KZmxvYXQAbW8GbWluAAZtYXgABRAgbXVzdCBiZSBudW1lcmljAAUPIG11c3QgYmUgZmluaXRlAAgDMC4wBSByYW5nZV9tbSBtdXN0IGJlIG51bWVyaWMgb3IgTm9uZQAFJHJhbmdlX21tIG11c3QgYmUgZmluaXRlIGFuZCBwb3NpdGl2ZQAIAzIuMIN0GAoBQFIsbIAQAhADKgIbBBwCFgIcAxYDWYAQBSoBGwYcBRYFWYAQByoBGwgcBxYHWVQyABAJEQU0AxYJUWMBgUwACgmICUBEEREWEhAJFhMqABYUMgAWClFjAZFYoBRKChULDBaADiAlICVONiknKyUjJDYnLUcvJiMoLCAlTCVDJCQhUhIHRMSAsRALKgKyEAwqAioCX0s1MALExRIXtBIYNAJDTRIXtBIZEhoqAjQCQ0kSG7UjAPI0AWUSArQ0AUNJEhy1IwHyNAFlQgmzUd5EQyMCYxIHRHESF7MSGDQCQ00SF7MSGRIaKgI0AkNHEhsjAzQBZRICszQBREazIwLaREcSHCMENAFlEh0SHrEjAjQCsBMNNALGtiMC2URDIwJjEh6yIwI0AscSHrOwEw7zIwI0Asi3sBMP9Le39CMFsBMQ9Pfyybi52kRDIwJjsBMQyrATD8u6EgO7u/QjBbj0uvfyNAG78/TMEh22Eh68IwI0AjQCYw==`,q=`data:application/octet-stream;base64,TQYAHzILQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNy5weQAPEGlzZmluaXRlAAhtYXRoAAhQb3NlACB1Y3NiX3hycC5yZWNvcmRzACJQb3NlQ29ycmVjdG9yQmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAIERFQlVHX1ZBTElEQVRJT04ALHVjc2JfeHJwLl9idWlsZF9jb25maWcAHHJlcXVpcmVfbnVtYmVyACh1Y3NiX3hycC5fdmFsaWRhdGlvbgAaUG9zZUNvcnJlY3RvcgAjGF94X29mZnNldF9tbQAYX3lfb2Zmc2V0X21tAAxfcmVhZHkAGl9yZXF1aXJlX3Bvc2UACHhfbW0ACHlfbW0AFmhlYWRpbmdfcmFkABJfZGlzdGFuY2UACnJlc2V0ABxjb3JyZWN0ZWRfcG9zZQASb2JzZXJ2ZV94ABByYW5nZV9tbQAQcG9zaXRpdmUAEndhbGxfeF9tbQAwc2Vuc29yX2ZvcndhcmRfb2Zmc2V0X21tABJvYnNlcnZlX3kAEndhbGxfeV9tbQAvLTUSX19zbG90c19fAIIpghMIcG9zZQCBQ22CRQhuYW1lAH2BPQpmbG9hdABvEHJhd19wb3NlAGUiZmFjaW5nX3Bvc2l0aXZlX3gAImZhY2luZ19wb3NpdGl2ZV95AAoDBQxfeF9vZmZzZXRfbW0ABQxfeV9vZmZzZXRfbW0ABQZfcmVhZHkACAMwLjAFF3Jhd19wb3NlIG11c3QgYmUgYSBQb3NlAAUNcmF3X3Bvc2UueF9tbQAFDXJhd19wb3NlLnlfbW0ABRRyYXdfcG9zZS5oZWFkaW5nX3JhZAAFECBtdXN0IGJlIG51bWVyaWMABR0gaXMgb3V0c2lkZSBpdHMgYWxsb3dlZCByYW5nZQAFHHJlc2V0KCkgbXVzdCBiZSBjYWxsZWQgZmlyc3QABSFmYWNpbmdfcG9zaXRpdmVfeCBtdXN0IGJlIEJvb2xlYW4ABSFmYWNpbmdfcG9zaXRpdmVfeSBtdXN0IGJlIEJvb2xlYW4AhRQYDgFATCwsLGyAEAIqARsDHAIWAlmAEAQqARsFHAQWBFmAEAYqARsHHAYWBlmAEAgqARsJHAgWCFmAEAoqARsLHAoWCllUMgAQDBEGNAMWDFFjAYRMECIMiAtARGRgiAiMCYQHhAuEEREfFiAQDBYhIwAWIjIAFg0RIzIBNAEWEREjUCoBUzMCNAEWFTIDFhYyBBYXMgUWGDIGFh1RYweCGCoQDSQcgBApJSUSBhQNsLE2AlkjAbAYDiMBsBgPULAYEFFjg1AZEBElgBcpJyoqEiawEgQ0AkNHEicjAjQBZRIKIwOwExI0AlkSCiMEsBMTNAJZEgojBbATFDQCWVFjhHCzARYVKCkagB82KSYwKRImsBIqNAJDTRImsBIrEiwqAjQCQ0kSJ7EjBvI0AWUSLLA0AcASArA0AURJskRPsCMB2kRJEi2xIwfyNAFlsGOCECISFiQugCcnJSUksBQRsTYBWSMBsBgOIwGwGA9SsBgQsWODWCoYFyQugC4kJyUnIicnEghER7AUEbE2AVmwExBDRxIvIwg0AWUSBLETErATDvKxExOwEw/ysRMUNANjhwjhBCgYJC4ZGzCAOSclJyknLSkmIEhEKLAUEbE2AVmwExBDRxIvIwg0AWUSJrQSKjQCQ0cSJyMJNAFlsBQVshAZEBpSNoICwrAUFbMQGzYCw7KwExzyxbRERbO180JDs7XyxraxExLzsBgOsBQXsTYBY4cI4QQoHSQuGR4xgEonJScpJy0pJiBIRCiwFBGxNgFZsBMQQ0cSLyMINAFlEia0Eio0AkNHEicjCjQBZbAUFbIQGRAaUjaCAsKwFBWzEB42AsOysBMc8sW0REWztfNCQ7O18sa2sRMT87AYD7AUF7E2AWM=`,J=`data:application/octet-stream;base64,TQYAHyUMQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfOC5weQAPEGlzZmluaXRlAAhtYXRoACpWaXNpdE9yZGVyUGxhbm5lckJhc2UAKHVjc2JfeHJwLnN0dWRlbnRfYXBpACJWaXNpdE9yZGVyUGxhbm5lcgAaX3Blcm11dGF0aW9ucwB5DF9pbmRleAAIcGxhbgAWc3RhcnRfaW5kZXgAGGZpbmlzaF9pbmRleAASPGdlbmV4cHI+AC8tNRJfX3Nsb3RzX18AgimCR4FXgjuCRQhzaXplAAhuYW1lAIFDfYE9bW+CExRjb3N0X3RhYmxlACByZXF1aXJlZF9pbmRpY2VzAIFZCmZsb2F0AIIZCwoBCgAFEyBtdXN0IGJlIGFuIGludGVnZXIABRogaXMgb3V0c2lkZSB0aGUgY29zdCB0YWJsZQAFK2Nvc3RfdGFibGUgbXVzdCBiZSBhIG5vbmVtcHR5IHR1cGxlIG9yIGxpc3QABRljb3N0X3RhYmxlIG11c3QgYmUgc3F1YXJlAAUjcm91dGUgY29zdHMgbXVzdCBiZSBudW1lcmljIG9yIE5vbmUACAMwLjAFKnJvdXRlIGNvc3RzIG11c3QgYmUgZmluaXRlIGFuZCBub25uZWdhdGl2ZQAFKHJlcXVpcmVkX2luZGljZXMgbXVzdCBiZSBhIHR1cGxlIG9yIGxpc3QABSxyZXF1aXJlZF9pbmRpY2VzIG11c3Qgbm90IGNvbnRhaW4gZHVwbGljYXRlcwAFLnJlcXVpcmVkX2luZGljZXMgbXVzdCBleGNsdWRlIHN0YXJ0IGFuZCBmaW5pc2gABQ5yZXF1aXJlZCBpbmRleACCXBgIAUBMbIAQAioBGwMcAhYCWYAQBCoBGwUcBBYEWVQyABAGEQQ0AxYGUWMBgmwIEgaICEBEiAyICBEOFg8QBhYQKgAWERESMgA0ARYHERIyATQBFgkyAhYKUWMDhWB5GAcTgA4jIyMqJDArNrBDQyMAYysAwRIUsDQBgEJwV8KwslXDsFGyLgJVsLKB8lEuAlXyxBIGFAe0NgFfSw7FsRQIsyoBtfI2AVlCMIHlWFrXQwtZWRIVsTQBY4NgKxQJFhcYgBoyKSopEhmwEho0AkNJEhmwEhs0AkNJEhyyIwHyNAFlsIDXQ0WwsdtESRIdsiMC8jQBZbBjnGyBJO4BCh4fCyAMgCEwJycjJjcnIyUlKTYnLUcuLkYsLC0nbzEnKkciIisqJCMtLyYjIjAkIyAlJksiJgAUEhmxEhUSISoCNAJEQ7FDRxIcIwM0AWUSFLE0AScUKwDFsV9LggHGEhm2EhUSISoCNAJEShIUtjQBJRTcREcSHSMENAFlKwDHtl9LTsi4Ud5ESbcUCFE2AVlCfBIZuBIaNAJDTRIZuBIbEiIqAjQCQ0cSHCMFNAFlEgK4NAFERrgjBtdERxIdIwc0AWW3FAgSIrg0ATYBWUKwf7UUCBIVtzQBNgFZQvt+EhW1NAHFJQAUCbIlFBALNgPJJQAUCbQlFBAMNgPKEhmzEhUSISoCNAJDRxIcIwg0AWUSFbAkFCAAArNeNAE0AcsSFBIjuzQBNAESFLs0AdxERxIdIwk0AWW5u91DRbq73URHEh0jCjQBZVHMUc0lABQHuzYBX0tuzrkqAb7yuioB8s8jBiYQUiYREhS/NAGB84BCZlcmErW/JBJVVb8kEoHyVVUmEyQTUd5ERVAmEUJOJBAkE+UmEIHlWFrXQxVZWSQRQ0NCrn+9Ud5DUSQQvddDSyQQvdlESr+810RFv8wkEM1CkH+8YwGCCONADA0kJCSAOlOyU1NLEMMlABQJsyUBIws2A2dZQi5RYw==`,Fe=`data:application/octet-stream;base64,TQYAHyMJQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfOS5weQAPEGlzZmluaXRlAAhtYXRoACBMaW5lRm9sbG93ZXJCYXNlABpNb3Rpb25Db21tYW5kABB1Y3NiX3hycAAgREVCVUdfVkFMSURBVElPTgAsdWNzYl94cnAuX2J1aWxkX2NvbmZpZwAYTGluZUZvbGxvd2VyAII/EHNldHRpbmdzAAhsZWZ0AApyaWdodAAUbGluZV9lcnJvcgAcaW50ZWdyYWxfZXJyb3IAFGxhc3RfZXJyb3IAEGtwX3JhZF9zABJraV9yYWRfczIADGtkX3JhZAAvLTUSX19zbG90c19fAIITFnJlZmxlY3RhbmNlAAhkdF9zAG+BQ4E9CmZsb2F0AH0GbWluAAZtYXgAcwUXcmVmbGVjdGFuY2UgaXMgcmVxdWlyZWQACAMwLjAFI2R0X3MgbXVzdCBiZSBmaW5pdGUgYW5kIG5vbm5lZ2F0aXZlAAUQaW50ZWdyYWxfbGltaXRfcwAFF21heGltdW1fdHVybl9yYXRlX3JhZF9zAAgDMS4wBQ10dXJuX3Nsb3dkb3duAAURY3J1aXNlX3NwZWVkX21tX3MABRJtaW5pbXVtX3NwZWVkX21tX3MAg3QYCgFATDJsgBACKgEbAxwCFgJZgBAEEAUqAhsGHAQWBBwFFgVZgBAHKgEbCBwHFgdZVDIAEAkRBDQDFglRYwGBTAAKCYgJQEQRFBYVEAkWFioAFhcyABYKUWMBj1hrQgoYGRqADiQlJyAtKSdGZyAkKi0lMTRGICgpSCUtJkonKhIHRHaxUd5ERxIbIwA0AWUSHLISHRIeKgI0AkRWEhyyEh80AkNNEgKyNAFERrIjAddERxIbIwI0AWWwEwvDsRMMsRMN87AYDrBXEw+wEw6y9OVaGA+zIwNVxBIgEiGwEw+00TQCtDQCsBgPsiMB2UREIwFCSbATDrATEPOy98WwEw6wGBCzEBFVsBMO9LMQElWwEw/08rMQE1W19PLGsyMEVccSIBIhtrfRNAK3NALGIwWzIwZVEiK2NAG39/TzyLMjB1W49MkSIbmzIwhVNALJEgW5tjQCYw==`;const Ie=Object.assign({"../../../vendor/current/ucsb_xrp/__init__.py":ye,"../../../vendor/current/ucsb_xrp/_build_config.py":be,"../../../vendor/current/ucsb_xrp/_hardware.py":xe,"../../../vendor/current/ucsb_xrp/_range.py":I,"../../../vendor/current/ucsb_xrp/_run_control.py":L,"../../../vendor/current/ucsb_xrp/_telemetry.py":R,"../../../vendor/current/ucsb_xrp/_validation.py":z,"../../../vendor/current/ucsb_xrp/check_support.py":Se,"../../../vendor/current/ucsb_xrp/component_checks.py":B,"../../../vendor/current/ucsb_xrp/config.py":Ce,"../../../vendor/current/ucsb_xrp/live.py":V,"../../../vendor/current/ucsb_xrp/maps.py":we,"../../../vendor/current/ucsb_xrp/mission.py":Te,"../../../vendor/current/ucsb_xrp/records.py":Ee,"../../../vendor/current/ucsb_xrp/robot.py":De,"../../../vendor/current/ucsb_xrp/straight_line.py":H,"../../../vendor/current/ucsb_xrp/straight_trial.py":Oe,"../../../vendor/current/ucsb_xrp/student_api.py":U,"../../../vendor/current/ucsb_xrp/utils.py":ke,"../../../vendor/current/ucsb_xrp/world.py":W,"../../../vendor/current/ucsb_xrp/xrpbot.py":Ae}),Le=Object.assign({"../../../vendor/current/reference_mpy/ucsb_xrp_reference/__init__.mpy":G,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_1.mpy":je,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_2.mpy":Me,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_3.mpy":K,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_4.mpy":Ne,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_6.mpy":Pe,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_7.mpy":q,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_8.mpy":J,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_9.mpy":Fe}),Re=`../../../vendor/current/`,Y=Object.freeze(Object.fromEntries(Object.entries(Ie).map(([e,t])=>{if(!e.startsWith(Re))throw Error(`Unexpected course package source '${e}'`);return[e.slice(24),t]})));if(!(`ucsb_xrp/__init__.py`in Y))throw Error(`The canonical ucsb_xrp package was not bundled`);const ze=Object.freeze(Object.fromEntries(Object.entries(Le).map(([e,t])=>{if(!e.startsWith(Re))throw Error(`Unexpected reference artifact '${e}'`);return[e.slice(24),t]})));if(!(`reference_mpy/ucsb_xrp_reference/__init__.mpy`in ze))throw Error(`The supplied reference package was not bundled`);function Be(e){let t=e.files[`world.json`],n=oe(t===void 0?_:re(t));return e.worldSelection&&n.worlds.some(t=>t.id===e.worldSelection)?{...n,defaultWorldId:e.worldSelection}:n}const Ve=/^[A-Za-z0-9._/-]+$/,He=new TextEncoder;var Ue=class extends Error{code;constructor(e,t){super(t),this.code=e,this.name=`PortableProjectError`}};function X(e){throw new Ue(`invalid_project`,e)}function Z(e){throw new Ue(`project_too_large`,e)}function We(e){typeof e!=`string`&&X(`Project file paths must be text`);let t=e.replaceAll(`\\`,`/`).replace(/^\/+|\/+$/g,``);return(t.length===0||t.split(`/`).some(e=>e===``||e===`.`||e===`..`))&&X(`File path '${e}' is invalid. Use named folders without empty, '.' or '..' sections.`),t.length>160&&X(`File path '${e}' has ${t.length} characters; XRP project paths may use at most 160.`),Ve.test(t)||X(`File path '${e}' contains a character the XRP cannot store. Use letters, numbers, '-', '_', '.', and '/'.`),t}function Ge(e){(typeof e!=`object`||!e)&&X(`The project is not a valid project object`),(typeof e.files!=`object`||e.files===null||Array.isArray(e.files))&&X(`The project files are not a valid file collection`);let t=Object.entries(e.files);if(t.length===0&&X(`This project has no files. Add a Python file, then try again.`),t.length>48){let e=t.length-48;Z(`This project has ${t.length} files; an XRP project may contain at most 48. Remove or move ${e} file${e===1?``:`s`}, then try again.`)}let n=We(e.entrypoint);n.endsWith(`.py`)||X(`The main file must be a Python (.py) file`);let r=[],i=new Set,a=0;for(let[e,n]of t){let t=We(e);i.has(t)&&X(`Two project files resolve to '${t}'. Rename one of them, then try again.`),typeof n!=`string`&&X(`Project file '${t}' must contain text`);let o=He.encode(n).byteLength;o>98304&&Z(`File '${t}' uses ${o.toLocaleString(`en-US`)} bytes; each XRP project file may use at most ${98304 .toLocaleString(`en-US`)} bytes (96 KiB).`),a+=o,a>262144&&Z(`The project files use ${a.toLocaleString(`en-US`)} bytes; an XRP project may use at most ${262144 .toLocaleString(`en-US`)} bytes (256 KiB).`),i.add(t),r.push([t,n])}return i.has(n)||X(`The main file '${n}' is not in the project`),e.name!==void 0&&(typeof e.name!=`string`||e.name.trim().length===0)&&X(`The project name must contain text`),{entrypoint:n,files:r,pythonPaths:r.map(([e])=>e).filter(e=>e.endsWith(`.py`)),totalBytes:a}}function Ke(e){let t=Ge(e);return Be(e),t}const qe=1e6,Je=1e6,Ye=/^[A-Za-z0-9._/-]+$/,Xe=/^\s*File\s+["']([^"']+)["'](?:,\s*line\s+(\d+)(?:,\s*in\s+.*)?)?\s*$/,Ze=/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt)):\s*(.*)$/,Qe=/^(.+?\.py):(\d+)(?::(\d+|none|null))?:\s*(.*)$/i,$e=/\u001b\[[0-?]*[ -/]*[@-~]/g;function et(e,t){if(e===void 0)return;let n=typeof e==`number`?e:Number.parseInt(e,10);if(!(!Number.isFinite(n)||n<1))return Math.min(Math.trunc(n),t)}function tt(e,t){return e.length<=t?e:`${e.slice(0,Math.max(0,t-13))}… [truncated]`}function nt(e){let t=e.replaceAll(`\r
`,`
`).replaceAll(`\r`,`
`).split(`
`).map(e=>tt(e,2048));for(;t[0]===``;)t.shift();for(;t.at(-1)===``;)t.pop();if(t.length<=128)return t;let n=t.length-63-64;return[...t.slice(0,63),`… [${n} traceback lines omitted]`,...t.slice(-64)]}function rt(e){let t=e.trim().replaceAll(`\\`,`/`);if(!(t.startsWith(`<`)&&t.endsWith(`>`))){if(t.startsWith(`/project/`))t=t.slice(9);else if(t.startsWith(`project/`))t=t.slice(8);else if(t.startsWith(`./`))t=t.slice(2);else if(t.startsWith(`/`)||/^[A-Za-z]:\//.test(t))return;if(t=t.replace(/^\/+|\/+$/g,``),!(t.length===0||t.length>160||!Ye.test(t)||t.split(`/`).some(e=>e===``||e===`.`||e===`..`)))return t}}function it(e){if(!e)return;let t=new Set;for(let n of e){let e=rt(n);e&&t.add(e)}return t}function at(e,t){let n=rt(e);if(n&&!(t&&!t.has(n)))return n}function ot(e){return e.map(e=>e.replace($e,``)).filter(e=>e.trim().length>0)}function st(e){return e.split(`
`).filter(e=>!/^\s*File "<stdin>", line \d+(?:, in .*)?\s*$/.test(e)).join(`
`).trim()}function ct(e,t={}){let n=st(String(e)),r=nt(n),i=ot(r);if(i.length===0)return[];let a=it(t.projectPaths),o,s,c;for(let e of i){let t=Xe.exec(e);if(!t)continue;let n=at(t[1]??``,a);n&&(o=n,s=et(t[2],qe),c=1)}let l=t.code?.trim()||void 0,u=i.at(-1)?.trim()??n,d=Ze.exec(u);d&&(l=d[1],u=d[2]?.trim()||d[1]||u);let f=Qe.exec(u);if(f){let e=at(f[1]??``,a);e&&(o=e,s=et(f[2],qe),c=et(f[3],Je)),u=f[4]?.trim()||u}if(o===void 0&&s===void 0&&d===null&&l===void 0)return[];let p=s===void 0?void 0:{line:s,column:c??1},m=p?{line:p.line,column:Math.min(Je,p.column+1)}:void 0;return[{source:`micropython`,phase:t.phase??`compile`,severity:`error`,...l?{code:tt(l,80)}:{},message:tt(u||`MicroPython reported an error`,2048),...o?{path:o}:{},...p?{start:p,end:m}:{},raw:r}]}const lt=2147483647;Object.freeze({revision:0,parameters:[],watches:[],plots:[]});function ut(e,t){if(e.kind===`number`){if(typeof t!=`number`||!Number.isFinite(t)||e.minimum===void 0||e.maximum===void 0||e.step===void 0||e.step<=0||t<e.minimum||t>e.maximum)throw Error(`${e.label} is outside its declared range`);let n=Math.round((t-e.minimum)/e.step);if(n<0||n>lt)throw Error(`${e.label} declares too many steps`);return n}if(e.kind===`toggle`){if(typeof t!=`boolean`)throw Error(`${e.label} must be on or off`);return+!!t}if(typeof t!=`string`||!e.options?.includes(t))throw Error(`${e.label} is not one of its declared choices`);return e.options.indexOf(t)}function dt(e){if(e.length>32768)throw Error(`Student runtime state is malformed`);let t=JSON.parse(e),n=t?.plots??[];if(typeof t!=`object`||!t||!Number.isInteger(t.revision)||(t.revision??-1)<0||!Array.isArray(t.parameters)||!Array.isArray(t.watches)||!Array.isArray(n)||t.parameters.length>16||t.watches.length>16||n.length>16||!t.parameters.every(gt)||!t.watches.every(_t)||!n.every(vt)||new Set(t.parameters.map(e=>e.name)).size!==t.parameters.length||new Set(t.watches.map(e=>e.name)).size!==t.watches.length||new Set(n.map(e=>e.name)).size!==n.length)throw Error(`Student runtime state is malformed`);return{...t,plots:n}}function ft(e){return typeof e==`boolean`||typeof e==`string`&&e.length<=64||typeof e==`number`&&Number.isFinite(e)}function pt(e){return typeof e==`string`&&e.length>0&&e.length<=80}function mt(e){return typeof e==`string`&&e.length>0&&e.length<=32&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)}function ht(e){return e===void 0||typeof e==`string`&&e.length<=24}function gt(e){if(typeof e!=`object`||!e)return!1;let t=e;if(!mt(t.name)||!pt(t.label)||!ht(t.unit)||![`number`,`toggle`,`choice`].includes(t.kind??``)||!ft(t.value)||t.pendingValue!==void 0&&!ft(t.pendingValue)||t.kind===`number`&&(typeof t.minimum!=`number`||!Number.isFinite(t.minimum)||typeof t.maximum!=`number`||!Number.isFinite(t.maximum)||typeof t.step!=`number`||!Number.isFinite(t.step)||t.maximum<=t.minimum||t.step<=0||t.step>t.maximum-t.minimum||Math.round((t.maximum-t.minimum)/t.step)>lt)||t.kind===`choice`&&(!Array.isArray(t.options)||t.options.length<2||t.options.length>6||t.options.some(e=>typeof e!=`string`||e.length>24)||new Set(t.options).size!==t.options.length))return!1;try{t.pendingValue!==void 0&&ut(t,t.pendingValue),ut(t,t.value)}catch{return!1}return!0}function _t(e){if(typeof e!=`object`||!e)return!1;let t=e;return mt(t.name)&&pt(t.label)&&ht(t.unit)&&ft(t.value)}function vt(e){if(typeof e!=`object`||!e)return!1;let t=e;return mt(t.name)&&pt(t.label)&&ht(t.unit)&&typeof t.value==`number`&&Number.isFinite(t.value)}const yt={"XRPLib/__init__.py":`"""Simulated hardware subset of XRPLib for the UCSB virtual XRP."""
`,"XRPLib/encoded_motor.py":`import xrp_sim_bridge


def _bounded_effort(value):
    return max(-1.0, min(1.0, float(value)))


class EncodedMotor:
    _instances = {}

    def __init__(self, side):
        self.side = side

    @classmethod
    def get_default_encoded_motor(cls, index=1):
        if index not in (1, 2):
            raise ValueError("virtual XRP supports encoded motor 1 or 2")
        if index not in cls._instances:
            cls._instances[index] = cls("left" if index == 1 else "right")
        return cls._instances[index]

    def set_effort(self, effort):
        xrp_sim_bridge.set_motor_effort(
            self.side,
            _bounded_effort(effort),
        )

    def coast(self):
        self.set_effort(0.0)

    def brake(self):
        self.set_effort(0.0)

    def get_position_counts(self):
        return int(xrp_sim_bridge.get_encoder_count(self.side))

    def reset_encoder_position(self):
        xrp_sim_bridge.reset_encoder(self.side)


`,"XRPLib/board.py":`import xrp_sim_bridge


class Board:
    _instance = None

    @classmethod
    def get_default_board(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_button_pressed(self):
        return bool(xrp_sim_bridge.is_button_pressed())

    def wait_for_button(self):
        return None

    def get_battery_voltage(self):
        return float(xrp_sim_bridge.get_battery_v())


`,"XRPLib/rangefinder.py":`import xrp_sim_bridge


class Rangefinder:
    _instance = None

    @classmethod
    def get_default_rangefinder(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def distance(self):
        # The shared course RangeAcquisition adapter supplies cadence and age.
        # This ideal geometry read does not emulate a physical echo timeout.
        distance_mm = xrp_sim_bridge.get_range_mm()
        return 65535 if distance_mm is None else float(distance_mm) / 10.0
`,"XRPLib/reflectance.py":`import xrp_sim_bridge


class Reflectance:
    _instance = None

    @classmethod
    def get_default_reflectance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_left(self):
        return float(xrp_sim_bridge.get_reflectance("left"))

    def get_right(self):
        return float(xrp_sim_bridge.get_reflectance("right"))
`,"XRPLib/imu.py":`import xrp_sim_bridge


class IMU:
    _instance = None

    @classmethod
    def get_default_imu(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_acc_rates(self):
        return tuple(xrp_sim_bridge.get_acceleration_mg())

    def get_gyro_rates(self):
        return tuple(xrp_sim_bridge.get_angular_rate_mdps())

    def temperature(self):
        return float(xrp_sim_bridge.get_temperature_c())
`};var bt=class{fixedStepMs;now;originMs;latestMs=0;integratedSteps=0;constructor(e,t=()=>performance.now()){if(this.fixedStepMs=e,this.now=t,!Number.isFinite(e)||e<=0)throw Error(`The simulation step must be positive and finite`);this.originMs=t()}reset(){this.originMs=this.now(),this.latestMs=0,this.integratedSteps=0}elapsedMs(){return this.latestMs=Math.max(this.latestMs,this.now()-this.originMs,0),this.latestMs}advance(e,t=()=>!0){let n=Math.floor(this.elapsedMs()/this.fixedStepMs),r=this.integratedSteps;for(;this.integratedSteps<n;){if(!t())throw Error(`Virtual run cancelled`);let r=Math.min(n,this.integratedSteps+128);for(;this.integratedSteps<r;)e(),this.integratedSteps+=1}return this.integratedSteps-r}},xt=class{send;now;startedMs;lines=[];accepted=0;available=100;replenishedMs;omitted=0;reservedErrors=0;constructor(e,t=()=>performance.now()){this.send=e,this.now=t,this.startedMs=t(),this.replenishedMs=this.startedMs}write(e,t){let n=this.now();if(this.available=Math.min(100,this.available+Math.max(0,n-this.replenishedMs)/5),this.replenishedMs=n,n-this.startedMs>=100&&(this.flush(),this.startedMs=n,this.accepted=0,this.reservedErrors=0),this.available<1)if(e===`stderr`&&this.reservedErrors<4)this.reservedErrors+=1;else{this.omitted+=1;return}else--this.available;this.accepted+=1;let r=t.length>2048?`${t.slice(0,2048)} … [line truncated]`:t;this.lines.push({stream:e,line:r}),(this.accepted===1||e===`stderr`)&&this.flush()}flush(){(this.lines.length||this.omitted)&&this.send(this.lines,this.omitted),this.lines=[],this.omitted=0}};const St=[`rawDeviceTimeMs`,`acquiredAtMs`,`acquisitionSeq`,`rangeAcquiredAtMs`,`rangeSeq`,`diagnosticsAcquiredAtMs`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`,`rawRangeMm`,`publishedAtMs`,`sampleDtMs`,`samplePeriodMs`,`overrunMs`];function Ct(e,t){if(e==null)return;if(!Array.isArray(e)||e.length!==16||t.length>200)throw Error(`Invalid telemetry timing record`);let n={version:1,clockId:t,clockBasis:`first-acquisition`};if(St.forEach((t,r)=>{let i=e[r];if(i!==null&&(typeof i!=`number`||!Number.isFinite(i)))throw Error(`Invalid timing ${t}`);if(i!==null&&![`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i<0)throw Error(`Negative timing ${t}`);if([`rawDeviceTimeMs`,`acquisitionSeq`,`rangeSeq`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i!==null&&!Number.isSafeInteger(i))throw Error(`Invalid integer ${t}`);n[t]=i}),![`raw`,`course`,`stop`].includes(e[14]))throw Error(`Invalid timing kind`);if(n.kind=e[14],typeof e[15]!=`boolean`)throw Error(`Invalid range sampling flag`);return n.rangeSampled=e[15],n}function wt(e){if(!Array.isArray(e)||e.length!==5)throw Error(`Invalid telemetry diagnostics`);let t=e=>{if(e===null)return null;if(!Array.isArray(e)||e.length!==3||e.some(e=>typeof e!=`number`||!Number.isFinite(e)))throw Error(`Invalid diagnostics vector`);return[...e]};if(e.slice(2,4).some(e=>e!==null&&(typeof e!=`number`||!Number.isFinite(e))))throw Error(`Invalid diagnostics value`);if(e[4]!==null&&(typeof e[4]!=`string`||e[4].length>512))throw Error(`Invalid diagnostics error`);return{accelerationMg:t(e[0]),angularRateMdps:t(e[1]),temperatureC:e[2],batteryV:e[3],sensorError:e[4]}}function Tt(e,t){let n=JSON.parse(String(e));if(!n||typeof n!=`object`||Array.isArray(n))return Ct(n,t);let r=n,i=Ct(r.timing,t);return i?{...i,diagnostics:wt(r.diagnostics),...i.kind===`raw`?{plots:dt(JSON.stringify({revision:0,parameters:[],watches:[],plots:r.plots??[]})).plots}:{}}:void 0}function Et(e){let t=e?._module?.HEAPU8;if(!(t instanceof Uint8Array)||t.buffer.byteLength<1)throw Error(`Virtual runtime memory accounting is unavailable. Reload the app before running.`);return t.buffer.byteLength}function Dt(e){return`Virtual run stopped at its memory limit (${Math.ceil(e/1048576)} MiB in use) to keep the browser responsive. Collected telemetry and notes remain available in the Monitor. Wait for its save status, then export data or start a new run. Use shorter runs or allocate fewer temporary objects.`}var Ot=class{bytes;warning;stop;warningBytes;stopBytes;stopped=!1;peakBytes=0;warned=!1;constructor(e,t,n,r=100663296,i=201326592){if(this.bytes=e,this.warning=t,this.stop=n,this.warningBytes=r,this.stopBytes=i,!Number.isFinite(r)||!Number.isFinite(i)||r<=0||i<=r)throw Error(`Invalid virtual memory limits`)}check(){if(this.stopped)throw Error(Dt(this.peakBytes));let e=this.bytes();if(!Number.isSafeInteger(e)||e<=0)throw Error(`Invalid virtual memory measurement`);if(this.peakBytes=Math.max(e,this.peakBytes),e>=this.stopBytes)throw this.stopped=!0,this.stop(e),Error(Dt(e));!this.warned&&e>=this.warningBytes&&(this.warned=!0,this.warning(e))}};function Q(e){self.postMessage(e)}function kt(e,t,n){let r=t.split(`/`).slice(0,-1),i=``;for(let t of r)i+=`/${t}`,n.has(i)||(e.mkdir(i),n.add(i))}function At(e){return e instanceof Error?st(e.message):st(String(e))}function jt(e){return e instanceof Error?e.message:String(e)}function Mt(e){if(typeof e!=`object`||!e||!(`type`in e))return;let t=e.type;return typeof t==`string`&&t.trim().length>0?t.trim():void 0}function $(e){if(e==null)return null;let t=Number(e);return Number.isFinite(t)?t:null}self.onmessage=async e=>{let n=new xt((e,t)=>Q({type:`console-batch`,lines:e,omitted:t})),i=e.data.world??ue(e.data.scenario),a=new ve(le(i));a.reset(i.initialPose);let o=0,s=0,c=new bt(a.config.fixedStepMs),l=`virtual:${crypto.randomUUID()}`,u=e.data.cancellationBuffer?new Int32Array(e.data.cancellationBuffer):null,d=e.data.liveParameterBuffer!==void 0,f=e.data.liveParameterBuffer?new Int32Array(e.data.liveParameterBuffer):new Int32Array(16),p=(e,t)=>{d?Atomics.store(f,e,t):f[e]=t},h=e=>d?Atomics.load(f,e):f[e],g=new Map,_=!1,v,y=()=>{_&&v?.check()},b=0,x=[],S=(e=`physics`)=>Q({type:`simulator-state`,state:a.state,observationKind:e}),C=()=>(y(),n.flush(),c.advance(()=>a.step(),()=>!u||Atomics.load(u,0)===0)>0&&S(),a.state);try{let i=`unknown`,u=await r({heapsize:2097152,url:m,stdout:t=>(y(),e.data.mode===`run`?n.write(`stdout`,t):Q({type:`console`,stream:`stdout`,line:t})),stderr:t=>(y(),e.data.mode===`run`?n.write(`stderr`,t):Q({type:`console`,stream:`stderr`,line:t}))});Et(u),v=new Ot(()=>Et(u),e=>Q({type:`console`,stream:`stderr`,line:`Virtual run memory is ${Math.ceil(e/1024/1024)} MiB and rising. Finish this run and save your results; a new run starts with fresh runtime memory.`}),e=>{a.stop(),S(`stop`),n.flush(),Q({type:`error`,detail:Dt(e),stage:`run`,reason:`memory-limit`})}),u.registerJsModule(`xrp_sim_bridge`,{set_motor_effort(e,t){C(),Q({type:`effort`,side:e,effort:t}),a.setMotorEffort(e,t),S(`actuator`)},get_encoder_count(e){let t=C();return e===`left`?t.leftEncoderCount-o:t.rightEncoderCount-s},reset_encoder(e){let t=C();e===`left`?o=t.leftEncoderCount:s=t.rightEncoderCount},get_range_mm(){return C().rangeMm},get_reflectance(e){let t=C();return e===`left`?t.leftReflectance:t.rightReflectance},is_button_pressed(){return C().buttonPressed},get_acceleration_mg(){return C().accelerationMg},get_angular_rate_mdps(){return C().angularRateMdps},get_temperature_c(){return C().temperatureC},get_battery_v(){return C().batteryV},advance_simulator(){C()},program_time_ms(){return y(),c.elapsedMs()},set_runtime_version(e){i=String(e)},register_live_parameter(e,t){let n=JSON.parse(String(e));if(typeof n.name!=`string`)throw Error(`Live parameter descriptor has no name`);let r=g.get(n.name);if(r!==void 0)return r;let i=g.size;if(i>=16)throw Error(`Too many live parameters`);return g.set(n.name,i),p(i,Number(t)),i},read_live_parameter(e){if(e<0||e>=g.size)throw Error(`Live parameter slot is unavailable`);return h(Number(e))},publish_runtime_state(e){Q({type:`runtime-state`,state:dt(String(e)),slots:Object.fromEntries(g)})},publish_course_state(e,t,n,r,i,a,o,s,u,d,f,p,m){let h=$(e),g=$(t),_=$(n),v=$(r),y=$(i),x=$(a),S=$(o);h!==null&&g!==null&&_!==null&&v!==null&&y!==null&&x!==null&&S!==null&&Q({type:`course-state`,state:{publicationSeq:b++,publishedAtMs:c.elapsedMs(),timing:m===void 0?void 0:Tt(m,l),estimatedXmm:h,estimatedYmm:g,estimatedHeadingRad:_,measuredLeftWheelSpeedMmS:v,measuredRightWheelSpeedMmS:y,measuredLeftWheelDistanceMm:x,measuredRightWheelDistanceMm:S,requestedForwardSpeedMmS:$(s),requestedTurnRateRadS:$(u),targetLeftWheelSpeedMmS:$(d),targetRightWheelSpeedMmS:$(f),plotValues:p===void 0?[]:dt(`{"revision":0,"parameters":[],"watches":[],"plots":${String(p)}}`).plots}})},publish_sensor_sample(e){let t=Tt(e,l);t&&Q({type:`sensor-acquisition`,timing:t})}});let d=new Set([`/`]),f={...yt,...Y};for(let[e,t]of Object.entries(f)){let n=e;kt(u.FS,n,d),u.FS.writeFile(`/${n}`,t)}for(let[e,t]of Object.entries(ze)){let n=e.replace(/^reference_mpy\//,``);kt(u.FS,n,d);let r=await fetch(t);if(!r.ok)throw Error(`Reference artifact could not be loaded: ${n}`);u.FS.writeFile(`/${n}`,new Uint8Array(await r.arrayBuffer()))}u.runPython(`
import xrp_sim_bridge
xrp_sim_bridge.set_runtime_version(
    ".".join(
        str(part)
        for part in __import__("sys").implementation.version[:3]
    )
)
`),Q({type:`runtime-ready`,version:i});let w=Ke(e.data.project),T=w.pythonPaths.map(e=>`/project/${e}`);x=w.pythonPaths,u.FS.mkdir(`/project`),d.add(`/project`);for(let[e,t]of w.files)kt(u.FS,`project/${e}`,d),u.FS.writeFile(`/project/${e}`,t);if(u.globals.set(`__ucsb_check_paths`,T),u.runPython(`
for __ucsb_path in __ucsb_check_paths:
    compile(open(__ucsb_path).read(), __ucsb_path, "exec")
`),u.globals.delete(`__ucsb_check_paths`),e.data.mode===`check`){Q({type:`check-complete`,detail:`${T.length} Python file${T.length===1?``:`s`} compiled with MicroPython ${i}`,diagnostics:[]});return}if(e.data.mode===`test`){u.registerJsModule(`xrp_check_bridge`,{report(e){let n=t(e);if(!n)throw Error(`The shared checker produced an invalid report.`);Q({type:`component-check-report`,report:n})}}),u.runPython(`
import ucsb_xrp.component_checks as __ucsb_checks
import xrp_check_bridge
__ucsb_checks._report_callback = xrp_check_bridge.report
`);let e=w.entrypoint;_=!0,u.runPython(`
import sys
import os
sys.path.insert(0, "/project")
sys.path.insert(1, "/")
os.chdir("/project")
__ucsb_entrypoint = "/project/${e}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`),Q({type:`test-complete`,detail:`Component checks completed with MicroPython ${i}`});return}Q({type:`compile-complete`,detail:`${T.length} Python file${T.length===1?``:`s`} compiled with MicroPython ${i}`,diagnostics:[]}),S(`initial`),c.reset();let ee=w.entrypoint;_=!0,u.runPython(`
import sys
import os
import time
import xrp_sim_bridge

__ucsb_original_sleep_ms = time.sleep_ms
__ucsb_tick_period = time.ticks_add(0, -1) + 1
def __ucsb_simulated_sleep_ms(duration_ms):
    if duration_ms < 0:
        return __ucsb_original_sleep_ms(duration_ms)
    __ucsb_deadline = xrp_sim_bridge.program_time_ms() + duration_ms
    while True:
        __ucsb_remaining = __ucsb_deadline - xrp_sim_bridge.program_time_ms()
        if __ucsb_remaining <= 0:
            break
        __ucsb_original_sleep_ms(max(1, min(20, int(__ucsb_remaining))))
        xrp_sim_bridge.advance_simulator()
    xrp_sim_bridge.advance_simulator()
def __ucsb_simulated_sleep(duration_s):
    __ucsb_simulated_sleep_ms(duration_s * 1000.0)
time.sleep_ms = __ucsb_simulated_sleep_ms
time.sleep = __ucsb_simulated_sleep
time.ticks_ms = lambda: int(xrp_sim_bridge.program_time_ms()) % __ucsb_tick_period
time.ticks_us = lambda: int(xrp_sim_bridge.program_time_ms() * 1000) % __ucsb_tick_period

sys.path.insert(0, "/project")
sys.path.insert(1, "/")
os.chdir("/project")
from ucsb_xrp.robot import _set_managed_start
_set_managed_start(True)
__ucsb_entrypoint = "/project/${ee}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`),C(),a.stop(),S(`stop`),n.flush(),Q({type:`run-complete`})}catch(e){if(n.flush(),a.stop(),S(`stop`),v?.stopped)return;let t=jt(e),r=At(e);Q({type:`error`,detail:r,rawDetail:t,stage:_?`run`:`compile`,diagnostics:ct(r,{phase:_?`runtime`:`compile`,code:Mt(e),projectPaths:x})})}};