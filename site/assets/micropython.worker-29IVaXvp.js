import{n as e}from"./rolldown-runtime-CbXtAM7H.js";async function t(t={}){var n;(function(){function e(e){for(var t=(e=e.split(`-`)[0]).split(`.`).slice(0,3);t.length<3;)t.push(`00`);return(t=t.map((e,t,n)=>e.padStart(2,`0`))).join(``)}var t=e=>[e/1e4|0,(e/100|0)%100,e%100].join(`.`),n=typeof process<`u`&&process.versions?.node?e(process.versions.node):2147483647;if(n<16e4)throw Error(`This emscripten-generated code requires node v${t(16e4)} (detected v${t(n)})`);var r=typeof navigator<`u`&&navigator.userAgent;if(r){var i=r.includes(`Safari/`)&&!r.includes(`Chrome/`)&&r.match(/Version\/(\d+\.?\d*\.?\d*)/)?e(r.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]):2147483647;if(i<15e4)throw Error(`This emscripten-generated code requires Safari v${t(15e4)} (detected v${i})`);var a=r.match(/Firefox\/(\d+(?:\.\d+)?)/)?parseFloat(r.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]):2147483647;if(a<79)throw Error(`This emscripten-generated code requires Firefox v79 (detected v${a})`);var o=r.match(/Chrome\/(\d+(?:\.\d+)?)/)?parseFloat(r.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]):2147483647;if(o<85)throw Error(`This emscripten-generated code requires Chrome v85 (detected v${o})`)}})();var i=t,a=!!globalThis.window,c=!!globalThis.WorkerGlobalScope,f=globalThis.process?.versions?.node&&globalThis.process?.type!=`renderer`,p=!a&&!f&&!c;if(f){let{createRequire:t}=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1));var m=t(import.meta.url)}var h,g,_=import.meta.url,v=``;if(f){if(!(globalThis.process?.versions?.node&&globalThis.process?.type!=`renderer`))throw Error(`not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)`);var y=m("node:fs");_.startsWith(`file:`)&&(v=m("node:path").dirname(m("node:url").fileURLToPath(_))+`/`),g=e=>{e=T(e)?new URL(e):e;var t=y.readFileSync(e);return w(Buffer.isBuffer(t)),t},h=async(e,t=!0)=>{e=T(e)?new URL(e):e;var n=y.readFileSync(e,t?void 0:`utf8`);return w(t?Buffer.isBuffer(n):typeof n==`string`),n},process.argv.length>1&&process.argv[1].replace(/\\/g,`/`),process.argv.slice(2)}else if(!p){if(!a&&!c)throw Error(`environment detection error`);try{v=new URL(`.`,_).href}catch{}if(!globalThis.window&&!globalThis.WorkerGlobalScope)throw Error(`not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)`);c&&(g=e=>{var t=new XMLHttpRequest;return t.open(`GET`,e,!1),t.responseType=`arraybuffer`,t.send(null),new Uint8Array(t.response)}),h=async e=>{if(T(e))return new Promise((t,n)=>{var r=new XMLHttpRequest;r.open(`GET`,e,!0),r.responseType=`arraybuffer`,r.onload=()=>{r.status==200||r.status==0&&r.response?t(r.response):n(r.status)},r.onerror=n,r.send(null)});var t=await fetch(e,{credentials:`same-origin`});if(t.ok)return t.arrayBuffer();throw Error(t.status+` : `+t.url)}}var b,x=console.log.bind(console),S=console.error.bind(console);w(!p,"shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable."),globalThis.WebAssembly||S(`no native wasm support detected`);var C=!1;function w(e,t){e||P(`Assertion failed`+(t?`: `+t:``))}var T=e=>e.startsWith(`file://`);function E(){if(!C){var e=Ue();e==0&&(e+=4);var t=A[e>>2],n=A[e+4>>2];t==34821223&&n==2310721022||P(`Stack overflow! Stack cookie has been overwritten at ${xe(e)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${xe(n)} ${xe(t)}`),A[0]!=1668509029&&P(`Runtime error: The application has corrupted its heap memory area (address zero)!`)}}var ee,te,ne,re,D,ie,O,k,A,ae,oe,j;function M(e){Object.getOwnPropertyDescriptor(i,e)||Object.defineProperty(i,e,{configurable:!0,set(){P(`Attempt to set \`Module.${e}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`)}})}function N(e){return()=>w(!1,`call to '${e}' via reference taken before Wasm module initialization`)}function se(e){Object.getOwnPropertyDescriptor(i,e)&&P(`\`Module.${e}\` was supplied but \`${e}\` not included in INCOMING_MODULE_JS_API`)}function ce(e){Object.getOwnPropertyDescriptor(i,e)||Object.defineProperty(i,e,{configurable:!0,get(){var t,n=`'${e}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;((t=e)===`FS_createPath`||t===`FS_createDataFile`||t===`FS_createPreloadedFile`||t===`FS_preloadFile`||t===`FS_unlink`||t===`addRunDependency`||t===`FS_createLazyFile`||t===`FS_createDevice`||t===`removeRunDependency`)&&(n+=`. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you`),P(n)}})}ee=new Int16Array(1),te=new Int8Array(ee.buffer),ee[0]=25459,te[0]===115&&te[1]===99||P(`Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)`);var le,ue=!1;function de(){var e=Je.buffer;D=new Int8Array(e),O=new Int16Array(e),i.HEAPU8=ie=new Uint8Array(e),new Uint16Array(e),k=new Int32Array(e),A=new Uint32Array(e),ae=new Float32Array(e),oe=new Float64Array(e),j=new BigInt64Array(e),new BigUint64Array(e)}function P(e){i.onAbort?.(e),S(e=`Aborted(`+e+`)`),C=!0;var t=new WebAssembly.RuntimeError(e);throw re?.(t),t}function F(e,t){return(...n)=>{w(ue,`native function \`${e}\` called before runtime initialization`);var r=Ze[e];return w(r,`exported native function \`${e}\` not found`),w(n.length<=t,`native function \`${e}\` called with ${n.length} args but expects ${t}`),r(...n)}}function fe(){return i.locateFile?(e=`micropython.wasm`,i.locateFile?i.locateFile(e,v):v+e):new URL(`/ucsbxrp/assets/micropython-DXFUqjrr.wasm`,``+import.meta.url).href;var e}async function pe(e){if(!b)try{var t=await h(e);return new Uint8Array(t)}catch{}return function(e){if(e==le&&b)return new Uint8Array(b);if(g)return g(e);throw`both async and sync fetching of the wasm failed`}(e)}async function me(e,t,n){if(!e&&!T(t)&&!f)try{var r=fetch(t,{credentials:`same-origin`});return await WebAssembly.instantiateStreaming(r,n)}catch(e){S(`wasm streaming compile failed: ${e}`),S(`falling back to ArrayBuffer instantiation`)}return async function(e,t){try{var n=await pe(e);return await WebAssembly.instantiate(n,t)}catch(t){S(`failed to asynchronously prepare wasm: ${t}`),T(e)&&S(`warning: Loading from a file URI (${e}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`),P(t)}}(t,n)}w(globalThis.Int32Array&&globalThis.Float64Array&&Int32Array.prototype.subarray&&Int32Array.prototype.set,`JS engine does not provide full typed array support`);var he=e=>{for(;e.length>0;)e.shift()(i)},ge=[],_e=e=>ge.push(e),ve=[],ye=e=>ve.push(e);function be(e,t=`i8`){switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:case`i8`:return D[e];case`i16`:return O[e>>1];case`i32`:return k[e>>2];case`i64`:return j[e>>3];case`float`:return ae[e>>2];case`double`:return oe[e>>3];case`*`:return A[e>>2];default:P(`invalid type for getValue: ${t}`)}}var xe=e=>(w(typeof e==`number`,`ptrToString expects a number, got `+typeof e),`0x`+(e>>>=0).toString(16).padStart(8,`0`)),I=e=>Ge(e),L=()=>qe(),R=e=>{R.shown||={},R.shown[e]||(R.shown[e]=1,f&&(e=`warning: `+e),S(e))},z={isAbs:e=>e.charAt(0)===`/`,splitPath:e=>/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1),normalizeArray:(e,t)=>{for(var n=0,r=e.length-1;r>=0;r--){var i=e[r];i===`.`?e.splice(r,1):i===`..`?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n;n--)e.unshift(`..`);return e},normalize:e=>{var t=z.isAbs(e),n=e.slice(-1)===`/`;return(e=z.normalizeArray(e.split(`/`).filter(e=>!!e),!t).join(`/`))||t||(e=`.`),e&&n&&(e+=`/`),(t?`/`:``)+e},dirname:e=>{var t=z.splitPath(e),n=t[0],r=t[1];return n||r?(r&&=r.slice(0,-1),n+r):`.`},basename:e=>e&&e.match(/([^\/]+|\/)\/*$/)[1],join:(...e)=>z.normalize(e.join(`/`)),join2:(e,t)=>z.normalize(e+`/`+t)},Se=e=>{(Se=(()=>{if(f){var e=m("node:crypto");return t=>e.randomFillSync(t)}return e=>crypto.getRandomValues(e)})())(e)},B={resolve:(...e)=>{for(var t=``,n=!1,r=e.length-1;r>=-1&&!n;r--){var i=r>=0?e[r]:q.cwd();if(typeof i!=`string`)throw TypeError(`Arguments to path.resolve must be strings`);if(!i)return``;t=i+`/`+t,n=z.isAbs(i)}return(n?`/`:``)+(t=z.normalizeArray(t.split(`/`).filter(e=>!!e),!n).join(`/`))||`.`},relative:(e,t)=>{function n(e){for(var t=0;t<e.length&&e[t]===``;t++);for(var n=e.length-1;n>=0&&e[n]===``;n--);return t>n?[]:e.slice(t,n-t+1)}e=B.resolve(e).slice(1),t=B.resolve(t).slice(1);for(var r=n(e.split(`/`)),i=n(t.split(`/`)),a=Math.min(r.length,i.length),o=a,s=0;s<a;s++)if(r[s]!==i[s]){o=s;break}var c=[];for(s=o;s<r.length;s++)c.push(`..`);return(c=c.concat(i.slice(o))).join(`/`)}},Ce=globalThis.TextDecoder&&new TextDecoder,we=(e,t=0,n,r)=>{var i=((e,t,n,r)=>{var i=t+n;if(r)return i;for(;e[t]&&!(t>=i);)++t;return t})(e,t,n,r);if(i-t>16&&e.buffer&&Ce)return Ce.decode(e.subarray(t,i));for(var a=``;t<i;){var o=e[t++];if(128&o){var s=63&e[t++];if((224&o)!=192){var c=63&e[t++];if((240&o)==224?o=(15&o)<<12|s<<6|c:((248&o)!=240&&R(`Invalid UTF-8 leading byte `+xe(o)+` encountered when deserializing a UTF-8 string in wasm memory to a JS string!`),o=(7&o)<<18|s<<12|c<<6|63&e[t++]),o<65536)a+=String.fromCharCode(o);else{var l=o-65536;a+=String.fromCharCode(55296|l>>10,56320|1023&l)}}else a+=String.fromCharCode((31&o)<<6|s)}else a+=String.fromCharCode(o)}return a},Te=[],Ee=e=>{for(var t=0,n=0;n<e.length;++n){var r=e.charCodeAt(n);r<=127?t++:r<=2047?t+=2:r>=55296&&r<=57343?(t+=4,++n):t+=3}return t},De=(e,t,n,r)=>{if(w(typeof e==`string`,`stringToUTF8Array expects a string (got ${typeof e})`),!(r>0))return 0;for(var i=n,a=n+r-1,o=0;o<e.length;++o){var s=e.codePointAt(o);if(s<=127){if(n>=a)break;t[n++]=s}else if(s<=2047){if(n+1>=a)break;t[n++]=192|s>>6,t[n++]=128|63&s}else if(s<=65535){if(n+2>=a)break;t[n++]=224|s>>12,t[n++]=128|s>>6&63,t[n++]=128|63&s}else{if(n+3>=a)break;s>1114111&&R(`Invalid Unicode code point `+xe(s)+` encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`),t[n++]=240|s>>18,t[n++]=128|s>>12&63,t[n++]=128|s>>6&63,t[n++]=128|63&s,o++}}return t[n]=0,n-i},Oe=(e,t,n)=>{var r=n>0?n:Ee(e)+1,i=Array(r),a=De(e,i,0,i.length);return t&&(i.length=a),i},V={ttys:[],init(){},shutdown(){},register(e,t){V.ttys[e]={input:[],output:[],ops:t},q.registerDevice(e,V.stream_ops)},stream_ops:{open(e){var t=V.ttys[e.node.rdev];if(!t)throw new q.ErrnoError(43);e.tty=t,e.seekable=!1},close(e){e.tty.ops.fsync(e.tty)},fsync(e){e.tty.ops.fsync(e.tty)},read(e,t,n,r,i){if(!e.tty||!e.tty.ops.get_char)throw new q.ErrnoError(60);for(var a=0,o=0;o<r;o++){var s;try{s=e.tty.ops.get_char(e.tty)}catch{throw new q.ErrnoError(29)}if(s===void 0&&a===0)throw new q.ErrnoError(6);if(s==null)break;a++,t[n+o]=s}return a&&(e.node.atime=Date.now()),a},write(e,t,n,r,i){if(!e.tty||!e.tty.ops.put_char)throw new q.ErrnoError(60);try{for(var a=0;a<r;a++)e.tty.ops.put_char(e.tty,t[n+a])}catch{throw new q.ErrnoError(29)}return r&&(e.node.mtime=e.node.ctime=Date.now()),a}},default_tty_ops:{get_char:e=>(()=>{if(!Te.length){var e=null;if(f){var t=Buffer.alloc(256),n=0,r=process.stdin.fd;try{n=y.readSync(r,t,0,256)}catch(e){if(!e.toString().includes(`EOF`))throw e;n=0}n>0&&(e=t.slice(0,n).toString(`utf-8`))}else globalThis.window?.prompt&&(e=window.prompt(`Input: `))!==null&&(e+=`
`);if(!e)return null;Te=Oe(e,!0)}return Te.shift()})(),put_char(e,t){t===null||t===10?(x(we(e.output)),e.output=[]):t!=0&&e.output.push(t)},fsync(e){e.output?.length>0&&(x(we(e.output)),e.output=[])},ioctl_tcgets:e=>({c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}),ioctl_tcsets:(e,t,n)=>0,ioctl_tiocgwinsz:e=>[24,80]},default_tty1_ops:{put_char(e,t){t===null||t===10?(S(we(e.output)),e.output=[]):t!=0&&e.output.push(t)},fsync(e){e.output?.length>0&&(S(we(e.output)),e.output=[])}}},ke=e=>{P("internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported")},H={ops_table:null,mount:e=>H.createNode(null,`/`,16895,0),createNode(e,t,n,r){if(q.isBlkdev(n)||q.isFIFO(n))throw new q.ErrnoError(63);H.ops_table||={dir:{node:{getattr:H.node_ops.getattr,setattr:H.node_ops.setattr,lookup:H.node_ops.lookup,mknod:H.node_ops.mknod,rename:H.node_ops.rename,unlink:H.node_ops.unlink,rmdir:H.node_ops.rmdir,readdir:H.node_ops.readdir,symlink:H.node_ops.symlink},stream:{llseek:H.stream_ops.llseek}},file:{node:{getattr:H.node_ops.getattr,setattr:H.node_ops.setattr},stream:{llseek:H.stream_ops.llseek,read:H.stream_ops.read,write:H.stream_ops.write,mmap:H.stream_ops.mmap,msync:H.stream_ops.msync}},link:{node:{getattr:H.node_ops.getattr,setattr:H.node_ops.setattr,readlink:H.node_ops.readlink},stream:{}},chrdev:{node:{getattr:H.node_ops.getattr,setattr:H.node_ops.setattr},stream:q.chrdev_stream_ops}};var i=q.createNode(e,t,n,r);return q.isDir(i.mode)?(i.node_ops=H.ops_table.dir.node,i.stream_ops=H.ops_table.dir.stream,i.contents={}):q.isFile(i.mode)?(i.node_ops=H.ops_table.file.node,i.stream_ops=H.ops_table.file.stream,i.usedBytes=0,i.contents=null):q.isLink(i.mode)?(i.node_ops=H.ops_table.link.node,i.stream_ops=H.ops_table.link.stream):q.isChrdev(i.mode)&&(i.node_ops=H.ops_table.chrdev.node,i.stream_ops=H.ops_table.chrdev.stream),i.atime=i.mtime=i.ctime=Date.now(),e&&(e.contents[t]=i,e.atime=e.mtime=e.ctime=i.atime),i},getFileDataAsTypedArray:e=>e.contents?e.contents.subarray?e.contents.subarray(0,e.usedBytes):new Uint8Array(e.contents):new Uint8Array,expandFileStorage(e,t){var n=e.contents?e.contents.length:0;if(!(n>=t)){t=Math.max(t,n*(n<1048576?2:1.125)>>>0),n!=0&&(t=Math.max(t,256));var r=e.contents;e.contents=new Uint8Array(t),e.usedBytes>0&&e.contents.set(r.subarray(0,e.usedBytes),0)}},resizeFileStorage(e,t){if(e.usedBytes!=t)if(t==0)e.contents=null,e.usedBytes=0;else{var n=e.contents;e.contents=new Uint8Array(t),n&&e.contents.set(n.subarray(0,Math.min(t,e.usedBytes))),e.usedBytes=t}},node_ops:{getattr(e){var t={};return t.dev=q.isChrdev(e.mode)?e.id:1,t.ino=e.id,t.mode=e.mode,t.nlink=1,t.uid=0,t.gid=0,t.rdev=e.rdev,t.size=q.isDir(e.mode)?4096:q.isFile(e.mode)?e.usedBytes:q.isLink(e.mode)?e.link.length:0,t.atime=new Date(e.atime),t.mtime=new Date(e.mtime),t.ctime=new Date(e.ctime),t.blksize=4096,t.blocks=Math.ceil(t.size/t.blksize),t},setattr(e,t){for(let n of[`mode`,`atime`,`mtime`,`ctime`])t[n]!=null&&(e[n]=t[n]);t.size!==void 0&&H.resizeFileStorage(e,t.size)},lookup(e,t){throw new q.ErrnoError(44)},mknod:(e,t,n,r)=>H.createNode(e,t,n,r),rename(e,t,n){var r;try{r=q.lookupNode(t,n)}catch{}if(r){if(q.isDir(e.mode))for(var i in r.contents)throw new q.ErrnoError(55);q.hashRemoveNode(r)}delete e.parent.contents[e.name],t.contents[n]=e,e.name=n,t.ctime=t.mtime=e.parent.ctime=e.parent.mtime=Date.now()},unlink(e,t){delete e.contents[t],e.ctime=e.mtime=Date.now()},rmdir(e,t){for(var n in q.lookupNode(e,t).contents)throw new q.ErrnoError(55);delete e.contents[t],e.ctime=e.mtime=Date.now()},readdir:e=>[`.`,`..`,...Object.keys(e.contents)],symlink(e,t,n){var r=H.createNode(e,t,41471,0);return r.link=n,r},readlink(e){if(!q.isLink(e.mode))throw new q.ErrnoError(28);return e.link}},stream_ops:{read(e,t,n,r,i){var a=e.node.contents;if(i>=e.node.usedBytes)return 0;var o=Math.min(e.node.usedBytes-i,r);if(w(o>=0),o>8&&a.subarray)t.set(a.subarray(i,i+o),n);else for(var s=0;s<o;s++)t[n+s]=a[i+s];return o},write(e,t,n,r,i,a){if(w(!(t instanceof ArrayBuffer)),t.buffer===D.buffer&&(a=!1),!r)return 0;var o=e.node;if(o.mtime=o.ctime=Date.now(),t.subarray&&(!o.contents||o.contents.subarray)){if(a)return w(i===0,`canOwn must imply no weird position inside the file`),o.contents=t.subarray(n,n+r),o.usedBytes=r,r;if(o.usedBytes===0&&i===0)return o.contents=t.slice(n,n+r),o.usedBytes=r,r;if(i+r<=o.usedBytes)return o.contents.set(t.subarray(n,n+r),i),r}if(H.expandFileStorage(o,i+r),o.contents.subarray&&t.subarray)o.contents.set(t.subarray(n,n+r),i);else for(var s=0;s<r;s++)o.contents[i+s]=t[n+s];return o.usedBytes=Math.max(o.usedBytes,i+r),r},llseek(e,t,n){var r=t;if(n===1?r+=e.position:n===2&&q.isFile(e.node.mode)&&(r+=e.node.usedBytes),r<0)throw new q.ErrnoError(28);return r},mmap(e,t,n,r,i){if(!q.isFile(e.node.mode))throw new q.ErrnoError(43);var a,o,s=e.node.contents;if(2&i||!s||s.buffer!==D.buffer){if(o=!0,!(a=ke()))throw new q.ErrnoError(48);s&&((n>0||n+t<s.length)&&(s=s.subarray?s.subarray(n,n+t):Array.prototype.slice.call(s,n,n+t)),D.set(s,a))}else o=!1,a=s.byteOffset;return{ptr:a,allocated:o}},msync:(e,t,n,r,i)=>(H.stream_ops.write(e,t,0,r,n,!1),0)}},Ae=(e,t)=>{var n=0;return e&&(n|=365),t&&(n|=146),n},U=(e,t,n)=>(w(typeof e==`number`,`UTF8ToString expects a number (got ${typeof e})`),e?we(ie,e,t,n):``),je={EPERM:63,ENOENT:44,ESRCH:71,EINTR:27,EIO:29,ENXIO:60,E2BIG:1,ENOEXEC:45,EBADF:8,ECHILD:12,EAGAIN:6,EWOULDBLOCK:6,ENOMEM:48,EACCES:2,EFAULT:21,ENOTBLK:105,EBUSY:10,EEXIST:20,EXDEV:75,ENODEV:43,ENOTDIR:54,EISDIR:31,EINVAL:28,ENFILE:41,EMFILE:33,ENOTTY:59,ETXTBSY:74,EFBIG:22,ENOSPC:51,ESPIPE:70,EROFS:69,EMLINK:34,EPIPE:64,EDOM:18,ERANGE:68,ENOMSG:49,EIDRM:24,ECHRNG:106,EL2NSYNC:156,EL3HLT:107,EL3RST:108,ELNRNG:109,EUNATCH:110,ENOCSI:111,EL2HLT:112,EDEADLK:16,ENOLCK:46,EBADE:113,EBADR:114,EXFULL:115,ENOANO:104,EBADRQC:103,EBADSLT:102,EDEADLOCK:16,EBFONT:101,ENOSTR:100,ENODATA:116,ETIME:117,ENOSR:118,ENONET:119,ENOPKG:120,EREMOTE:121,ENOLINK:47,EADV:122,ESRMNT:123,ECOMM:124,EPROTO:65,EMULTIHOP:36,EDOTDOT:125,EBADMSG:9,ENOTUNIQ:126,EBADFD:127,EREMCHG:128,ELIBACC:129,ELIBBAD:130,ELIBSCN:131,ELIBMAX:132,ELIBEXEC:133,ENOSYS:52,ENOTEMPTY:55,ENAMETOOLONG:37,ELOOP:32,EOPNOTSUPP:138,EPFNOSUPPORT:139,ECONNRESET:15,ENOBUFS:42,EAFNOSUPPORT:5,EPROTOTYPE:67,ENOTSOCK:57,ENOPROTOOPT:50,ESHUTDOWN:140,ECONNREFUSED:14,EADDRINUSE:3,ECONNABORTED:13,ENETUNREACH:40,ENETDOWN:38,ETIMEDOUT:73,EHOSTDOWN:142,EHOSTUNREACH:23,EINPROGRESS:26,EALREADY:7,EDESTADDRREQ:17,EMSGSIZE:35,EPROTONOSUPPORT:66,ESOCKTNOSUPPORT:137,EADDRNOTAVAIL:4,ENETRESET:39,EISCONN:30,ENOTCONN:53,ETOOMANYREFS:141,EUSERS:136,EDQUOT:19,ESTALE:72,ENOTSUP:138,ENOMEDIUM:148,EILSEQ:25,EOVERFLOW:61,ECANCELED:11,ENOTRECOVERABLE:56,EOWNERDEAD:62,ESTRPIPE:135},W=0,Me=null,G={},K=null,Ne=[],Pe=async(e,t,n,r,a,o,s,c)=>{var l,u=t?B.resolve(z.join2(e,t)):e,d=(e=>{for(var t=e;;){if(!G[e])return e;e=t+Math.random()}})(`cp ${u}`);l=d,W++,i.monitorRunDependencies?.(W),w(l,`addRunDependency requires an ID`),w(!G[l]),G[l]=1,K===null&&globalThis.setInterval&&(K=setInterval(()=>{if(C)return clearInterval(K),void(K=null);var e=!1;for(var t in G)e||(e=!0,S(`still waiting on run dependencies:`)),S(`dependency: ${t}`);e&&S(`(end of list)`)},1e4),K.unref?.());try{var f=n;typeof n==`string`&&(f=await(async e=>{var t=await h(e);return w(t,`Loading data file "${e}" failed (no arrayBuffer).`),new Uint8Array(t)})(n)),f=await(async(e,t)=>{for(var n of(typeof Browser<`u`&&Browser.init(),Ne))if(n.canHandle(t))return w(n.handle.constructor.name===`AsyncFunction`,`Filesystem plugin handlers must be async functions (See #24914)`),n.handle(e,t);return e})(f,u),c?.(),o||((...e)=>{q.createDataFile(...e)})(e,t,f,r,a,s)}finally{(e=>{if(W--,i.monitorRunDependencies?.(W),w(e,`removeRunDependency requires an ID`),w(G[e]),delete G[e],W==0&&(K!==null&&(clearInterval(K),K=null),Me)){var t=Me;Me=null,t()}})(d)}},q={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:`/`,initialized:!1,ignorePermissions:!0,filesystems:null,syncFSRequests:0,ErrnoError:class extends Error{name=`ErrnoError`;constructor(e){for(var t in super(ue?(e=>U(He(e)))(e):``),this.errno=e,je)if(je[t]===e){this.code=t;break}}},FSStream:class{shared={};get object(){return this.node}set object(e){this.node=e}get isRead(){return(2097155&this.flags)!=1}get isWrite(){return!!(2097155&this.flags)}get isAppend(){return 1024&this.flags}get flags(){return this.shared.flags}set flags(e){this.shared.flags=e}get position(){return this.shared.position}set position(e){this.shared.position=e}},FSNode:class{node_ops={};stream_ops={};readMode=365;writeMode=146;mounted=null;constructor(e,t,n,r){e||=this,this.parent=e,this.mount=e.mount,this.id=q.nextInode++,this.name=t,this.mode=n,this.rdev=r,this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(e){e?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(e){e?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return q.isDir(this.mode)}get isDevice(){return q.isChrdev(this.mode)}},lookupPath(e,t={}){if(!e)throw new q.ErrnoError(44);t.follow_mount??=!0,z.isAbs(e)||(e=q.cwd()+`/`+e);linkloop:for(var n=0;n<40;n++){for(var r=e.split(`/`).filter(e=>!!e),i=q.root,a=`/`,o=0;o<r.length;o++){var s=o===r.length-1;if(s&&t.parent)break;if(r[o]!==`.`)if(r[o]!==`..`){a=z.join2(a,r[o]);try{i=q.lookupNode(i,r[o])}catch(e){if(e?.errno===44&&s&&t.noent_okay)return{path:a};throw e}if(!q.isMountpoint(i)||s&&!t.follow_mount||(i=i.mounted.root),q.isLink(i.mode)&&(!s||t.follow)){if(!i.node_ops.readlink)throw new q.ErrnoError(52);var c=i.node_ops.readlink(i);z.isAbs(c)||(c=z.dirname(a)+`/`+c),e=c+`/`+r.slice(o+1).join(`/`);continue linkloop}}else{if(a=z.dirname(a),q.isRoot(i)){e=a+`/`+r.slice(o+1).join(`/`),n--;continue linkloop}i=i.parent}}return{path:a,node:i}}throw new q.ErrnoError(32)},getPath(e){for(var t;;){if(q.isRoot(e)){var n=e.mount.mountpoint;return t?n[n.length-1]===`/`?n+t:`${n}/${t}`:n}t=t?`${e.name}/${t}`:e.name,e=e.parent}},hashName(e,t){for(var n=0,r=0;r<t.length;r++)n=(n<<5)-n+t.charCodeAt(r)|0;return(e+n>>>0)%q.nameTable.length},hashAddNode(e){var t=q.hashName(e.parent.id,e.name);e.name_next=q.nameTable[t],q.nameTable[t]=e},hashRemoveNode(e){var t=q.hashName(e.parent.id,e.name);if(q.nameTable[t]===e)q.nameTable[t]=e.name_next;else for(var n=q.nameTable[t];n;){if(n.name_next===e){n.name_next=e.name_next;break}n=n.name_next}},lookupNode(e,t){var n=q.mayLookup(e);if(n)throw new q.ErrnoError(n);for(var r=q.hashName(e.id,t),i=q.nameTable[r];i;i=i.name_next){var a=i.name;if(i.parent.id===e.id&&a===t)return i}return q.lookup(e,t)},createNode(e,t,n,r){w(typeof e==`object`);var i=new q.FSNode(e,t,n,r);return q.hashAddNode(i),i},destroyNode(e){q.hashRemoveNode(e)},isRoot:e=>e===e.parent,isMountpoint:e=>!!e.mounted,isFile:e=>(61440&e)==32768,isDir:e=>(61440&e)==16384,isLink:e=>(61440&e)==40960,isChrdev:e=>(61440&e)==8192,isBlkdev:e=>(61440&e)==24576,isFIFO:e=>(61440&e)==4096,isSocket:e=>!(49152&~e),flagsToPermissionString(e){var t=[`r`,`w`,`rw`][3&e];return 512&e&&(t+=`w`),t},nodePermissions:(e,t)=>q.ignorePermissions||(!t.includes(`r`)||292&e.mode)&&(!t.includes(`w`)||146&e.mode)&&(!t.includes(`x`)||73&e.mode)?0:2,mayLookup(e){return q.isDir(e.mode)?q.nodePermissions(e,`x`)||(e.node_ops.lookup?0:2):54},mayCreate(e,t){if(!q.isDir(e.mode))return 54;try{return q.lookupNode(e,t),20}catch{}return q.nodePermissions(e,`wx`)},mayDelete(e,t,n){var r;try{r=q.lookupNode(e,t)}catch(e){return e.errno}var i=q.nodePermissions(e,`wx`);if(i)return i;if(n){if(!q.isDir(r.mode))return 54;if(q.isRoot(r)||q.getPath(r)===q.cwd())return 10}else if(q.isDir(r.mode))return 31;return 0},mayOpen(e,t){if(!e)return 44;if(q.isLink(e.mode))return 32;var n=q.flagsToPermissionString(t);return q.isDir(e.mode)&&(n!==`r`||576&t)?31:q.nodePermissions(e,n)},checkOpExists(e,t){if(!e)throw new q.ErrnoError(t);return e},MAX_OPEN_FDS:4096,nextfd(){for(var e=0;e<=q.MAX_OPEN_FDS;e++)if(!q.streams[e])return e;throw new q.ErrnoError(33)},getStreamChecked(e){var t=q.getStream(e);if(!t)throw new q.ErrnoError(8);return t},getStream:e=>q.streams[e],createStream:(e,t=-1)=>(w(t>=-1),e=Object.assign(new q.FSStream,e),t==-1&&(t=q.nextfd()),e.fd=t,q.streams[t]=e,e),closeStream(e){q.streams[e]=null},dupStream(e,t=-1){var n=q.createStream(e,t);return n.stream_ops?.dup?.(n),n},doSetAttr(e,t,n){var r=e?.stream_ops.setattr,i=r?e:t;r??=t.node_ops.setattr,q.checkOpExists(r,63),r(i,n)},chrdev_stream_ops:{open(e){e.stream_ops=q.getDevice(e.node.rdev).stream_ops,e.stream_ops.open?.(e)},llseek(){throw new q.ErrnoError(70)}},major:e=>e>>8,minor:e=>255&e,makedev:(e,t)=>e<<8|t,registerDevice(e,t){q.devices[e]={stream_ops:t}},getDevice:e=>q.devices[e],getMounts(e){for(var t=[],n=[e];n.length;){var r=n.pop();t.push(r),n.push(...r.mounts)}return t},syncfs(e,t){typeof e==`function`&&(t=e,e=!1),q.syncFSRequests++,q.syncFSRequests>1&&S(`warning: ${q.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);var n=q.getMounts(q.root.mount),r=0;function i(e){return w(q.syncFSRequests>0),q.syncFSRequests--,t(e)}function a(e){if(e)return a.errored?void 0:(a.errored=!0,i(e));++r>=n.length&&i(null)}for(var o of n)o.type.syncfs?o.type.syncfs(o,e,a):a(null)},mount(e,t,n){if(typeof e==`string`)throw e;var r,i=n===`/`,a=!n;if(i&&q.root)throw new q.ErrnoError(10);if(!i&&!a){var o=q.lookupPath(n,{follow_mount:!1});if(n=o.path,r=o.node,q.isMountpoint(r))throw new q.ErrnoError(10);if(!q.isDir(r.mode))throw new q.ErrnoError(54)}var s={type:e,opts:t,mountpoint:n,mounts:[]},c=e.mount(s);return c.mount=s,s.root=c,i?q.root=c:r&&(r.mounted=s,r.mount&&r.mount.mounts.push(s)),c},unmount(e){var t=q.lookupPath(e,{follow_mount:!1});if(!q.isMountpoint(t.node))throw new q.ErrnoError(28);var n=t.node,r=n.mounted,i=q.getMounts(r);for(var[a,o]of Object.entries(q.nameTable))for(;o;){var s=o.name_next;i.includes(o.mount)&&q.destroyNode(o),o=s}n.mounted=null;var c=n.mount.mounts.indexOf(r);w(c!==-1),n.mount.mounts.splice(c,1)},lookup:(e,t)=>e.node_ops.lookup(e,t),mknod(e,t,n){var r=q.lookupPath(e,{parent:!0}).node,i=z.basename(e);if(!i)throw new q.ErrnoError(28);if(i===`.`||i===`..`)throw new q.ErrnoError(20);var a=q.mayCreate(r,i);if(a)throw new q.ErrnoError(a);if(!r.node_ops.mknod)throw new q.ErrnoError(63);return r.node_ops.mknod(r,i,t,n)},statfs:e=>q.statfsNode(q.lookupPath(e,{follow:!0}).node),statfsStream:e=>q.statfsNode(e.node),statfsNode(e){var t={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:q.nextInode,ffree:q.nextInode-1,fsid:42,flags:2,namelen:255};return e.node_ops.statfs&&Object.assign(t,e.node_ops.statfs(e.mount.opts.root)),t},create:(e,t=438)=>(t&=4095,t|=32768,q.mknod(e,t,0)),mkdir:(e,t=511)=>(t&=1023,t|=16384,q.mknod(e,t,0)),mkdirTree(e,t){var n=e.split(`/`),r=``;for(var i of n)if(i){(r||z.isAbs(e))&&(r+=`/`),r+=i;try{q.mkdir(r,t)}catch(e){if(e.errno!=20)throw e}}},mkdev:(e,t,n)=>(n===void 0&&(n=t,t=438),t|=8192,q.mknod(e,t,n)),symlink(e,t){if(!B.resolve(e))throw new q.ErrnoError(44);var n=q.lookupPath(t,{parent:!0}).node;if(!n)throw new q.ErrnoError(44);var r=z.basename(t),i=q.mayCreate(n,r);if(i)throw new q.ErrnoError(i);if(!n.node_ops.symlink)throw new q.ErrnoError(63);return n.node_ops.symlink(n,r,e)},rename(e,t){var n,r,i=z.dirname(e),a=z.dirname(t),o=z.basename(e),s=z.basename(t);if(n=q.lookupPath(e,{parent:!0}).node,r=q.lookupPath(t,{parent:!0}).node,!n||!r)throw new q.ErrnoError(44);if(n.mount!==r.mount)throw new q.ErrnoError(75);var c,l=q.lookupNode(n,o),u=B.relative(e,a);if(u.charAt(0)!==`.`)throw new q.ErrnoError(28);if((u=B.relative(t,i)).charAt(0)!==`.`)throw new q.ErrnoError(55);try{c=q.lookupNode(r,s)}catch{}if(l!==c){var d=q.isDir(l.mode),f=q.mayDelete(n,o,d);if(f||=c?q.mayDelete(r,s,d):q.mayCreate(r,s))throw new q.ErrnoError(f);if(!n.node_ops.rename)throw new q.ErrnoError(63);if(q.isMountpoint(l)||c&&q.isMountpoint(c))throw new q.ErrnoError(10);if(r!==n&&(f=q.nodePermissions(n,`w`)))throw new q.ErrnoError(f);q.hashRemoveNode(l);try{n.node_ops.rename(l,r,s),l.parent=r}catch(e){throw e}finally{q.hashAddNode(l)}}},rmdir(e){var t=q.lookupPath(e,{parent:!0}).node,n=z.basename(e),r=q.lookupNode(t,n),i=q.mayDelete(t,n,!0);if(i)throw new q.ErrnoError(i);if(!t.node_ops.rmdir)throw new q.ErrnoError(63);if(q.isMountpoint(r))throw new q.ErrnoError(10);t.node_ops.rmdir(t,n),q.destroyNode(r)},readdir(e){var t=q.lookupPath(e,{follow:!0}).node;return q.checkOpExists(t.node_ops.readdir,54)(t)},unlink(e){var t=q.lookupPath(e,{parent:!0}).node;if(!t)throw new q.ErrnoError(44);var n=z.basename(e),r=q.lookupNode(t,n),i=q.mayDelete(t,n,!1);if(i)throw new q.ErrnoError(i);if(!t.node_ops.unlink)throw new q.ErrnoError(63);if(q.isMountpoint(r))throw new q.ErrnoError(10);t.node_ops.unlink(t,n),q.destroyNode(r)},readlink(e){var t=q.lookupPath(e).node;if(!t)throw new q.ErrnoError(44);if(!t.node_ops.readlink)throw new q.ErrnoError(28);return t.node_ops.readlink(t)},stat(e,t){var n=q.lookupPath(e,{follow:!t}).node;return q.checkOpExists(n.node_ops.getattr,63)(n)},fstat(e){var t=q.getStreamChecked(e),n=t.node,r=t.stream_ops.getattr,i=r?t:n;return r??=n.node_ops.getattr,q.checkOpExists(r,63),r(i)},lstat:e=>q.stat(e,!0),doChmod(e,t,n,r){q.doSetAttr(e,t,{mode:4095&n|-4096&t.mode,ctime:Date.now(),dontFollow:r})},chmod(e,t,n){var r=typeof e==`string`?q.lookupPath(e,{follow:!n}).node:e;q.doChmod(null,r,t,n)},lchmod(e,t){q.chmod(e,t,!0)},fchmod(e,t){var n=q.getStreamChecked(e);q.doChmod(n,n.node,t,!1)},doChown(e,t,n){q.doSetAttr(e,t,{timestamp:Date.now(),dontFollow:n})},chown(e,t,n,r){var i=typeof e==`string`?q.lookupPath(e,{follow:!r}).node:e;q.doChown(null,i,r)},lchown(e,t,n){q.chown(e,t,n,!0)},fchown(e,t,n){var r=q.getStreamChecked(e);q.doChown(r,r.node,!1)},doTruncate(e,t,n){if(q.isDir(t.mode))throw new q.ErrnoError(31);if(!q.isFile(t.mode))throw new q.ErrnoError(28);var r=q.nodePermissions(t,`w`);if(r)throw new q.ErrnoError(r);q.doSetAttr(e,t,{size:n,timestamp:Date.now()})},truncate(e,t){if(t<0)throw new q.ErrnoError(28);var n=typeof e==`string`?q.lookupPath(e,{follow:!0}).node:e;q.doTruncate(null,n,t)},ftruncate(e,t){var n=q.getStreamChecked(e);if(t<0||!(2097155&n.flags))throw new q.ErrnoError(28);q.doTruncate(n,n.node,t)},utime(e,t,n){var r=q.lookupPath(e,{follow:!0}).node;q.checkOpExists(r.node_ops.setattr,63)(r,{atime:t,mtime:n})},open(e,t,n=438){if(e===``)throw new q.ErrnoError(44);var r,i;if(n=64&(t=typeof t==`string`?(e=>{var t={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[e];if(t===void 0)throw Error(`Unknown file open mode: ${e}`);return t})(t):t)?4095&n|32768:0,typeof e==`object`)r=e;else{i=e.endsWith(`/`);var a=q.lookupPath(e,{follow:!(131072&t),noent_okay:!0});r=a.node,e=a.path}var o=!1;if(64&t)if(r){if(128&t)throw new q.ErrnoError(20)}else{if(i)throw new q.ErrnoError(31);r=q.mknod(e,511|n,0),o=!0}if(!r)throw new q.ErrnoError(44);if(q.isChrdev(r.mode)&&(t&=-513),65536&t&&!q.isDir(r.mode))throw new q.ErrnoError(54);if(!o){var s=q.mayOpen(r,t);if(s)throw new q.ErrnoError(s)}512&t&&!o&&q.truncate(r,0),t&=-131713;var c=q.createStream({node:r,path:q.getPath(r),flags:t,seekable:!0,position:0,stream_ops:r.stream_ops,ungotten:[],error:!1});return c.stream_ops.open&&c.stream_ops.open(c),o&&q.chmod(r,511&n),c},close(e){if(q.isClosed(e))throw new q.ErrnoError(8);e.getdents&&=null;try{e.stream_ops.close&&e.stream_ops.close(e)}catch(e){throw e}finally{q.closeStream(e.fd)}e.fd=null},isClosed:e=>e.fd===null,llseek(e,t,n){if(q.isClosed(e))throw new q.ErrnoError(8);if(!e.seekable||!e.stream_ops.llseek)throw new q.ErrnoError(70);if(n!=0&&n!=1&&n!=2)throw new q.ErrnoError(28);return e.position=e.stream_ops.llseek(e,t,n),e.ungotten=[],e.position},read(e,t,n,r,i){if(w(n>=0),r<0||i<0)throw new q.ErrnoError(28);if(q.isClosed(e)||(2097155&e.flags)==1)throw new q.ErrnoError(8);if(q.isDir(e.node.mode))throw new q.ErrnoError(31);if(!e.stream_ops.read)throw new q.ErrnoError(28);var a=i!==void 0;if(a){if(!e.seekable)throw new q.ErrnoError(70)}else i=e.position;var o=e.stream_ops.read(e,t,n,r,i);return a||(e.position+=o),o},write(e,t,n,r,i,a){if(w(n>=0),r<0||i<0)throw new q.ErrnoError(28);if(q.isClosed(e)||!(2097155&e.flags))throw new q.ErrnoError(8);if(q.isDir(e.node.mode))throw new q.ErrnoError(31);if(!e.stream_ops.write)throw new q.ErrnoError(28);e.seekable&&1024&e.flags&&q.llseek(e,0,2);var o=i!==void 0;if(o){if(!e.seekable)throw new q.ErrnoError(70)}else i=e.position;var s=e.stream_ops.write(e,t,n,r,i,a);return o||(e.position+=s),s},mmap(e,t,n,r,i){if(2&r&&!(2&i)&&(2097155&e.flags)!=2||(2097155&e.flags)==1)throw new q.ErrnoError(2);if(!e.stream_ops.mmap)throw new q.ErrnoError(43);if(!t)throw new q.ErrnoError(28);return e.stream_ops.mmap(e,t,n,r,i)},msync:(e,t,n,r,i)=>(w(n>=0),e.stream_ops.msync?e.stream_ops.msync(e,t,n,r,i):0),ioctl(e,t,n){if(!e.stream_ops.ioctl)throw new q.ErrnoError(59);return e.stream_ops.ioctl(e,t,n)},readFile(e,t={}){t.flags=t.flags||0,t.encoding=t.encoding||`binary`,t.encoding!==`utf8`&&t.encoding!==`binary`&&P(`Invalid encoding type "${t.encoding}"`);var n=q.open(e,t.flags),r=q.stat(e).size,i=new Uint8Array(r);return q.read(n,i,0,r,0),t.encoding===`utf8`&&(i=we(i)),q.close(n),i},writeFile(e,t,n={}){n.flags=n.flags||577;var r=q.open(e,n.flags,n.mode);typeof t==`string`&&(t=new Uint8Array(Oe(t,!0))),ArrayBuffer.isView(t)?q.write(r,t,0,t.byteLength,void 0,n.canOwn):P(`Unsupported data type`),q.close(r)},cwd:()=>q.currentPath,chdir(e){var t=q.lookupPath(e,{follow:!0});if(t.node===null)throw new q.ErrnoError(44);if(!q.isDir(t.node.mode))throw new q.ErrnoError(54);var n=q.nodePermissions(t.node,`x`);if(n)throw new q.ErrnoError(n);q.currentPath=t.path},createDefaultDirectories(){q.mkdir(`/tmp`),q.mkdir(`/home`),q.mkdir(`/home/web_user`)},createDefaultDevices(){q.mkdir(`/dev`),q.registerDevice(q.makedev(1,3),{read:()=>0,write:(e,t,n,r,i)=>r,llseek:()=>0}),q.mkdev(`/dev/null`,q.makedev(1,3)),V.register(q.makedev(5,0),V.default_tty_ops),V.register(q.makedev(6,0),V.default_tty1_ops),q.mkdev(`/dev/tty`,q.makedev(5,0)),q.mkdev(`/dev/tty1`,q.makedev(6,0));var e=new Uint8Array(1024),t=0,n=()=>(t===0&&(Se(e),t=e.byteLength),e[--t]);q.createDevice(`/dev`,`random`,n),q.createDevice(`/dev`,`urandom`,n),q.mkdir(`/dev/shm`),q.mkdir(`/dev/shm/tmp`)},createSpecialDirectories(){q.mkdir(`/proc`);var e=q.mkdir(`/proc/self`);q.mkdir(`/proc/self/fd`),q.mount({mount(){var t=q.createNode(e,`fd`,16895,73);return t.stream_ops={llseek:H.stream_ops.llseek},t.node_ops={lookup(e,t){var n=+t,r=q.getStreamChecked(n),i={parent:null,mount:{mountpoint:`fake`},node_ops:{readlink:()=>r.path},id:n+1};return i.parent=i,i},readdir:()=>Array.from(q.streams.entries()).filter(([e,t])=>t).map(([e,t])=>e.toString())},t}},{},`/proc/self/fd`)},createStandardStreams(e,t,n){e?q.createDevice(`/dev`,`stdin`,e):q.symlink(`/dev/tty`,`/dev/stdin`),t?q.createDevice(`/dev`,`stdout`,null,t):q.symlink(`/dev/tty`,`/dev/stdout`),n?q.createDevice(`/dev`,`stderr`,null,n):q.symlink(`/dev/tty1`,`/dev/stderr`);var r=q.open(`/dev/stdin`,0),i=q.open(`/dev/stdout`,1),a=q.open(`/dev/stderr`,1);w(r.fd===0,`invalid handle for stdin (${r.fd})`),w(i.fd===1,`invalid handle for stdout (${i.fd})`),w(a.fd===2,`invalid handle for stderr (${a.fd})`)},staticInit(){q.nameTable=Array(4096),q.mount(H,{},`/`),q.createDefaultDirectories(),q.createDefaultDevices(),q.createSpecialDirectories(),q.filesystems={MEMFS:H}},init(e,t,n){w(!q.initialized,`FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)`),q.initialized=!0,e??=i.stdin,t??=i.stdout,n??=i.stderr,q.createStandardStreams(e,t,n)},quit(){for(var e of(q.initialized=!1,Ve(0),q.streams))e&&q.close(e)},findObject(e,t){var n=q.analyzePath(e,t);return n.exists?n.object:null},analyzePath(e,t){try{e=(r=q.lookupPath(e,{follow:!t})).path}catch{}var n={isRoot:!1,exists:!1,error:0,name:null,path:null,object:null,parentExists:!1,parentPath:null,parentObject:null};try{var r=q.lookupPath(e,{parent:!0});n.parentExists=!0,n.parentPath=r.path,n.parentObject=r.node,n.name=z.basename(e),r=q.lookupPath(e,{follow:!t}),n.exists=!0,n.path=r.path,n.object=r.node,n.name=r.node.name,n.isRoot=r.path===`/`}catch(e){n.error=e.errno}return n},createPath(e,t,n,r){e=typeof e==`string`?e:q.getPath(e);for(var i=t.split(`/`).reverse();i.length;){var a=i.pop();if(a){var o=z.join2(e,a);try{q.mkdir(o)}catch(e){if(e.errno!=20)throw e}e=o}}return o},createFile(e,t,n,r,i){var a=z.join2(typeof e==`string`?e:q.getPath(e),t),o=Ae(r,i);return q.create(a,o)},createDataFile(e,t,n,r,i,a){var o=t;e&&(e=typeof e==`string`?e:q.getPath(e),o=t?z.join2(e,t):e);var s=Ae(r,i),c=q.create(o,s);if(n){if(typeof n==`string`){for(var l=Array(n.length),u=0,d=n.length;u<d;++u)l[u]=n.charCodeAt(u);n=l}q.chmod(c,146|s);var f=q.open(c,577);q.write(f,n,0,n.length,0,a),q.close(f),q.chmod(c,s)}},createDevice(e,t,n,r){var i=z.join2(typeof e==`string`?e:q.getPath(e),t),a=Ae(!!n,!!r);q.createDevice.major??=64;var o=q.makedev(q.createDevice.major++,0);return q.registerDevice(o,{open(e){e.seekable=!1},close(e){r?.buffer?.length&&r(10)},read(e,t,r,i,a){for(var o=0,s=0;s<i;s++){var c;try{c=n()}catch{throw new q.ErrnoError(29)}if(c===void 0&&o===0)throw new q.ErrnoError(6);if(c==null)break;o++,t[r+s]=c}return o&&(e.node.atime=Date.now()),o},write(e,t,n,i,a){for(var o=0;o<i;o++)try{r(t[n+o])}catch{throw new q.ErrnoError(29)}return i&&(e.node.mtime=e.node.ctime=Date.now()),o}}),q.mkdev(i,a,o)},forceLoadFile(e){if(e.isDevice||e.isFolder||e.link||e.contents)return!0;if(globalThis.XMLHttpRequest)P(`Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.`);else try{e.contents=g(e.url)}catch{throw new q.ErrnoError(29)}},createLazyFile(e,t,n,r,i){class a{lengthKnown=!1;chunks=[];get(e){if(!(e>this.length-1||e<0)){var t=e%this.chunkSize,n=e/this.chunkSize|0;return this.getter(n)[t]}}setDataGetter(e){this.getter=e}cacheLength(){var e=new XMLHttpRequest;e.open(`HEAD`,n,!1),e.send(null),e.status>=200&&e.status<300||e.status===304||P(`Couldn't load `+n+`. Status: `+e.status);var t,r=Number(e.getResponseHeader(`Content-length`)),i=(t=e.getResponseHeader(`Accept-Ranges`))&&t===`bytes`,a=(t=e.getResponseHeader(`Content-Encoding`))&&t===`gzip`,o=1048576;i||(o=r);var s=this;s.setDataGetter(e=>{var t=e*o,i=(e+1)*o-1;return i=Math.min(i,r-1),s.chunks[e]===void 0&&(s.chunks[e]=((e,t)=>{e>t&&P(`invalid range (`+e+`, `+t+`) or no bytes requested!`),t>r-1&&P(`only `+r+` bytes available! programmer error!`);var i=new XMLHttpRequest;return i.open(`GET`,n,!1),r!==o&&i.setRequestHeader(`Range`,`bytes=`+e+`-`+t),i.responseType=`arraybuffer`,i.overrideMimeType&&i.overrideMimeType(`text/plain; charset=x-user-defined`),i.send(null),i.status>=200&&i.status<300||i.status===304||P(`Couldn't load `+n+`. Status: `+i.status),i.response===void 0?Oe(i.responseText||``,!0):new Uint8Array(i.response||[])})(t,i)),s.chunks[e]===void 0&&P(`doXHR failed!`),s.chunks[e]}),!a&&r||(o=r=1,r=this.getter(0).length,o=r,x(`LazyFiles on gzip forces download of the whole file when length is accessed`)),this._length=r,this._chunkSize=o,this.lengthKnown=!0}get length(){return this.lengthKnown||this.cacheLength(),this._length}get chunkSize(){return this.lengthKnown||this.cacheLength(),this._chunkSize}}if(globalThis.XMLHttpRequest){c||P(`Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc`);var o={isDevice:!1,contents:new a}}else o={isDevice:!1,url:n};var s=q.createFile(e,t,o,r,i);o.contents?s.contents=o.contents:o.url&&(s.contents=null,s.url=o.url),Object.defineProperties(s,{usedBytes:{get:function(){return this.contents.length}}});var l={};for(let[e,t]of Object.entries(s.stream_ops))l[e]=(...e)=>(q.forceLoadFile(s),t(...e));function u(e,t,n,r,i){var a=e.node.contents;if(i>=a.length)return 0;var o=Math.min(a.length-i,r);if(w(o>=0),a.slice)for(var s=0;s<o;s++)t[n+s]=a[i+s];else for(s=0;s<o;s++)t[n+s]=a.get(i+s);return o}return l.read=(e,t,n,r,i)=>(q.forceLoadFile(s),u(e,t,n,r,i)),l.mmap=(e,t,n,r,i)=>{q.forceLoadFile(s);var a=ke();if(!a)throw new q.ErrnoError(48);return u(e,D,a,t,n),{ptr:a,allocated:!0}},s.stream_ops=l,s},absolutePath(){P(`FS.absolutePath has been removed; use PATH_FS.resolve instead`)},createFolder(){P(`FS.createFolder has been removed; use FS.mkdir instead`)},createLink(){P(`FS.createLink has been removed; use FS.symlink instead`)},joinPath(){P(`FS.joinPath has been removed; use PATH.join instead`)},mmapAlloc(){P(`FS.mmapAlloc has been replaced by the top level function mmapAlloc`)},standardizePath(){P(`FS.standardizePath has been removed; use PATH.normalize instead`)}},J={calculateAt(e,t,n){if(z.isAbs(t))return t;var r=e===-100?q.cwd():J.getStreamFromFD(e).path;if(t.length==0){if(!n)throw new q.ErrnoError(44);return r}return r+`/`+t},writeStat(e,t){A[e>>2]=t.dev,A[e+4>>2]=t.mode,A[e+8>>2]=t.nlink,A[e+12>>2]=t.uid,A[e+16>>2]=t.gid,A[e+20>>2]=t.rdev,j[e+24>>3]=BigInt(t.size),k[e+32>>2]=4096,k[e+36>>2]=t.blocks;var n=t.atime.getTime(),r=t.mtime.getTime(),i=t.ctime.getTime();return j[e+40>>3]=BigInt(Math.floor(n/1e3)),A[e+48>>2]=n%1e3*1e3*1e3,j[e+56>>3]=BigInt(Math.floor(r/1e3)),A[e+64>>2]=r%1e3*1e3*1e3,j[e+72>>3]=BigInt(Math.floor(i/1e3)),A[e+80>>2]=i%1e3*1e3*1e3,j[e+88>>3]=BigInt(t.ino),0},writeStatFs(e,t){A[e+4>>2]=t.bsize,A[e+60>>2]=t.bsize,j[e+8>>3]=BigInt(t.blocks),j[e+16>>3]=BigInt(t.bfree),j[e+24>>3]=BigInt(t.bavail),j[e+32>>3]=BigInt(t.files),j[e+40>>3]=BigInt(t.ffree),A[e+48>>2]=t.fsid,A[e+64>>2]=t.flags,A[e+56>>2]=t.namelen},doMsync(e,t,n,r,i){if(!q.isFile(t.node.mode))throw new q.ErrnoError(43);if(2&r)return 0;var a=ie.slice(e,e+n);q.msync(t,a,i,n,r)},getStreamFromFD:e=>q.getStreamChecked(e),varargs:void 0,getStr:e=>U(e)},Fe=(e,t,n)=>(w(typeof n==`number`,`stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!`),De(e,ie,t,n)),Y=(e,t)=>(w(t,`alignment argument is required`),Math.ceil(e/t)*t),Ie=e=>{var t=Je.buffer.byteLength,n=(e-t+65535)/65536|0;try{return Je.grow(n),de(),1}catch(n){S(`growMemory: Attempted to grow heap from ${t} bytes to ${e} bytes, but got error: ${n}`)}},Le=[],X=e=>{var t=Le[e];return t||(Le[e]=t=Ye.get(e)),w(Ye.get(e)==t,`JavaScript-side Wasm function table mirror is out of date!`),t},Re=e=>Ke(e),ze=(e,t,n,r,a)=>{var o={string:e=>{var t=0;return e!=null&&e!==0&&(t=(e=>{var t=Ee(e)+1,n=Re(t);return Fe(e,n,t),n})(e)),t},array:e=>{var t,n,r=Re(e.length);return n=r,w((t=e).length>=0,`writeArrayToMemory array must have a length (should be an array or typed array)`),D.set(t,n),r}},s=(e=>{var t=i[`_`+e];return w(t,`Cannot call unknown function `+e+`, make sure it is exported`),t})(e),c=[],l=0;if(w(t!==`array`,`Return type should not be "array".`),r)for(var u=0;u<r.length;u++){var d=o[n[u]];d?(l===0&&(l=L()),c[u]=d(r[u])):c[u]=r[u]}var f=s(...c);return f=function(e){return l!==0&&I(l),function(e){return t===`string`?U(e):t===`boolean`?!!e:e}(e)}(f)};q.createPreloadedFile=(e,t,n,r,i,a,o,s,c,l)=>{Pe(e,t,n,r,i,s,c,l).then(a).catch(o)},q.preloadFile=Pe,q.staticInit(),globalThis.crypto===void 0&&(globalThis.crypto=m("crypto"));var Be=Date.now();if(i.noExitRuntime&&i.noExitRuntime,i.preloadPlugins&&(Ne=i.preloadPlugins),i.print&&(x=i.print),i.printErr&&(S=i.printErr),i.wasmBinary&&(b=i.wasmBinary),se(`fetchSettings`),se(`logReadFiles`),se(`loadSplitModule`),i.arguments&&i.arguments,i.thisProgram&&i.thisProgram,w(i.memoryInitializerPrefixURL===void 0,`Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead`),w(i.pthreadMainPrefixURL===void 0,`Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead`),w(i.cdInitializerPrefixURL===void 0,`Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead`),w(i.filePackagePrefixURL===void 0,`Module.filePackagePrefixURL option was removed, use Module.locateFile instead`),w(i.read===void 0,`Module.read option was removed`),w(i.readAsync===void 0,`Module.readAsync option was removed (modify readAsync in JS)`),w(i.readBinary===void 0,`Module.readBinary option was removed (modify readBinary in JS)`),w(i.setWindowTitle===void 0,`Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)`),w(i.TOTAL_MEMORY===void 0,`Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY`),w(i.ENVIRONMENT===void 0,`Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)`),w(i.STACK_SIZE===void 0,`STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time`),w(i.wasmMemory===void 0,"Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally"),w(i.INITIAL_MEMORY===void 0,`Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically`),i.preInit)for(typeof i.preInit==`function`&&(i.preInit=[i.preInit]);i.preInit.length>0;)i.preInit.shift()();M(`preInit`),i.ccall=ze,i.cwrap=(e,t,n,r)=>(...r)=>ze(e,t,n,r),i.setValue=function(e,t,n=`i8`){switch(n.endsWith(`*`)&&(n=`*`),n){case`i1`:case`i8`:D[e]=t;break;case`i16`:O[e>>1]=t;break;case`i32`:k[e>>2]=t;break;case`i64`:j[e>>3]=BigInt(t);break;case`float`:ae[e>>2]=t;break;case`double`:oe[e>>3]=t;break;case`*`:A[e>>2]=t;break;default:P(`invalid type for setValue: ${n}`)}},i.getValue=be,i.PATH=z,i.PATH_FS=B,i.UTF8ToString=U,i.stringToUTF8=Fe,i.lengthBytesUTF8=Ee,i.FS=q,`writeI53ToI64.writeI53ToI64Clamped.writeI53ToI64Signaling.writeI53ToU64Clamped.writeI53ToU64Signaling.readI53FromI64.readI53FromU64.convertI32PairToI53.convertI32PairToI53Checked.convertU32PairToI53.getTempRet0.setTempRet0.createNamedFunction.zeroMemory.exitJS.withStackSave.inetPton4.inetNtop4.inetPton6.inetNtop6.readSockaddr.writeSockaddr.readEmAsmArgs.jstoi_q.getExecutableName.autoResumeAudioContext.getDynCaller.dynCall.handleException.keepRuntimeAlive.runtimeKeepalivePush.runtimeKeepalivePop.callUserCallback.maybeExit.asmjsMangle.HandleAllocator.addOnInit.addOnPostCtor.addOnPreMain.addOnExit.STACK_SIZE.STACK_ALIGN.POINTER_SIZE.ASSERTIONS.convertJsFunctionToWasm.getEmptyTableSlot.updateTableMap.getFunctionAddress.addFunction.removeFunction.intArrayToString.AsciiToString.stringToAscii.UTF16ToString.stringToUTF16.lengthBytesUTF16.UTF32ToString.stringToUTF32.lengthBytesUTF32.stringToNewUTF8.registerKeyEventCallback.maybeCStringToJsString.findEventTarget.getBoundingClientRect.fillMouseEventData.registerMouseEventCallback.registerWheelEventCallback.registerUiEventCallback.registerFocusEventCallback.fillDeviceOrientationEventData.registerDeviceOrientationEventCallback.fillDeviceMotionEventData.registerDeviceMotionEventCallback.screenOrientation.fillOrientationChangeEventData.registerOrientationChangeEventCallback.fillFullscreenChangeEventData.registerFullscreenChangeEventCallback.JSEvents_requestFullscreen.JSEvents_resizeCanvasForFullscreen.registerRestoreOldStyle.hideEverythingExceptGivenElement.restoreHiddenElements.setLetterbox.softFullscreenResizeWebGLRenderTarget.doRequestFullscreen.fillPointerlockChangeEventData.registerPointerlockChangeEventCallback.registerPointerlockErrorEventCallback.requestPointerLock.fillVisibilityChangeEventData.registerVisibilityChangeEventCallback.registerTouchEventCallback.fillGamepadEventData.registerGamepadEventCallback.registerBeforeUnloadEventCallback.fillBatteryEventData.registerBatteryEventCallback.setCanvasElementSize.getCanvasElementSize.jsStackTrace.getCallstack.convertPCtoSourceLocation.getEnvStrings.checkWasiClock.wasiRightsToMuslOFlags.wasiOFlagsToMuslOFlags.safeSetTimeout.setImmediateWrapped.safeRequestAnimationFrame.clearImmediateWrapped.registerPostMainLoop.registerPreMainLoop.getPromise.makePromise.idsToPromises.makePromiseCallback.ExceptionInfo.findMatchingCatch.Browser_asyncPrepareDataCounter.isLeapYear.ydayFromDate.arraySum.addDays.getSocketFromFD.getSocketAddress.FS_mkdirTree._setNetworkCallback.heapObjectForWebGLType.toTypedArrayIndex.webgl_enable_ANGLE_instanced_arrays.webgl_enable_OES_vertex_array_object.webgl_enable_WEBGL_draw_buffers.webgl_enable_WEBGL_multi_draw.webgl_enable_EXT_polygon_offset_clamp.webgl_enable_EXT_clip_control.webgl_enable_WEBGL_polygon_mode.emscriptenWebGLGet.computeUnpackAlignedImageSize.colorChannelsInGlTextureFormat.emscriptenWebGLGetTexPixelData.emscriptenWebGLGetUniform.webglGetUniformLocation.webglPrepareUniformLocationsBeforeFirstUse.webglGetLeftBracePos.emscriptenWebGLGetVertexAttrib.__glGetActiveAttribOrUniform.writeGLArray.registerWebGlEventCallback.runAndAbortIfError.ALLOC_NORMAL.ALLOC_STACK.allocate.writeStringToMemory.writeAsciiToMemory.allocateUTF8.allocateUTF8OnStack.demangle.stackTrace.getNativeTypeSize`.split(`.`).forEach(function(e){ce(e)}),`run.out.err.callMain.abort.wasmExports.HEAPF32.HEAPF64.HEAP8.HEAP16.HEAPU16.HEAP32.HEAPU32.HEAP64.HEAPU64.writeStackCookie.checkStackCookie.INT53_MAX.INT53_MIN.bigintToI53Checked.stackSave.stackRestore.stackAlloc.ptrToString.getHeapMax.growMemory.ENV.ERRNO_CODES.strError.DNS.Protocols.Sockets.timers.warnOnce.readEmAsmArgsArray.asyncLoad.alignMemory.mmapAlloc.wasmTable.wasmMemory.getUniqueRunDependency.noExitRuntime.addRunDependency.removeRunDependency.addOnPreRun.addOnPostRun.freeTableIndexes.functionsInTableMap.UTF8Decoder.UTF8ArrayToString.stringToUTF8Array.intArrayFromString.UTF16Decoder.stringToUTF8OnStack.writeArrayToMemory.JSEvents.specialHTMLTargets.findCanvasEventTarget.currentFullscreenStrategy.restoreOldWindowedStyle.UNWIND_CACHE.ExitStatus.doReadv.doWritev.initRandomFill.randomFill.emSetImmediate.emClearImmediate_deps.emClearImmediate.promiseMap.uncaughtExceptionCount.exceptionLast.exceptionCaught.Browser.requestFullscreen.requestFullScreen.setCanvasSize.getUserMedia.createContext.getPreloadedImageData__data.wget.MONTH_DAYS_REGULAR.MONTH_DAYS_LEAP.MONTH_DAYS_REGULAR_CUMULATIVE.MONTH_DAYS_LEAP_CUMULATIVE.SYSCALLS.preloadPlugins.FS_createPreloadedFile.FS_preloadFile.FS_modeStringToFlags.FS_getMode.FS_stdin_getChar_buffer.FS_stdin_getChar.FS_unlink.FS_createPath.FS_createDevice.FS_readFile.FS_root.FS_mounts.FS_devices.FS_streams.FS_nextInode.FS_nameTable.FS_currentPath.FS_initialized.FS_ignorePermissions.FS_filesystems.FS_syncFSRequests.FS_lookupPath.FS_getPath.FS_hashName.FS_hashAddNode.FS_hashRemoveNode.FS_lookupNode.FS_createNode.FS_destroyNode.FS_isRoot.FS_isMountpoint.FS_isFile.FS_isDir.FS_isLink.FS_isChrdev.FS_isBlkdev.FS_isFIFO.FS_isSocket.FS_flagsToPermissionString.FS_nodePermissions.FS_mayLookup.FS_mayCreate.FS_mayDelete.FS_mayOpen.FS_checkOpExists.FS_nextfd.FS_getStreamChecked.FS_getStream.FS_createStream.FS_closeStream.FS_dupStream.FS_doSetAttr.FS_chrdev_stream_ops.FS_major.FS_minor.FS_makedev.FS_registerDevice.FS_getDevice.FS_getMounts.FS_syncfs.FS_mount.FS_unmount.FS_lookup.FS_mknod.FS_statfs.FS_statfsStream.FS_statfsNode.FS_create.FS_mkdir.FS_mkdev.FS_symlink.FS_rename.FS_rmdir.FS_readdir.FS_readlink.FS_stat.FS_fstat.FS_lstat.FS_doChmod.FS_chmod.FS_lchmod.FS_fchmod.FS_doChown.FS_chown.FS_lchown.FS_fchown.FS_doTruncate.FS_truncate.FS_ftruncate.FS_utime.FS_open.FS_close.FS_isClosed.FS_llseek.FS_read.FS_write.FS_mmap.FS_msync.FS_ioctl.FS_writeFile.FS_cwd.FS_chdir.FS_createDefaultDirectories.FS_createDefaultDevices.FS_createSpecialDirectories.FS_createStandardStreams.FS_staticInit.FS_init.FS_quit.FS_findObject.FS_analyzePath.FS_createFile.FS_createDataFile.FS_forceLoadFile.FS_createLazyFile.FS_absolutePath.FS_createFolder.FS_createLink.FS_joinPath.FS_mmapAlloc.FS_standardizePath.MEMFS.TTY.PIPEFS.SOCKFS.tempFixedLengthArray.miniTempWebGLFloatBuffers.miniTempWebGLIntBuffers.GL.AL.GLUT.EGL.GLEW.IDBStore.SDL.SDL_gfx.print.printErr.jstoi_s`.split(`.`).forEach(ce),i._free=N(`_free`),i._malloc=N(`_malloc`),i._mp_sched_keyboard_interrupt=N(`_mp_sched_keyboard_interrupt`),i._mp_js_init=N(`_mp_js_init`),i._mp_js_register_js_module=N(`_mp_js_register_js_module`),i._mp_js_do_import=N(`_mp_js_do_import`),i._proxy_convert_mp_to_js_obj_cside=N(`_proxy_convert_mp_to_js_obj_cside`),i._mp_js_do_exec=N(`_mp_js_do_exec`),i._mp_js_do_exec_async=N(`_mp_js_do_exec_async`),i._mp_js_repl_init=N(`_mp_js_repl_init`),i._mp_js_repl_process_char=N(`_mp_js_repl_process_char`),i._mp_js_register_romfs=N(`_mp_js_register_romfs`),i._mp_hal_get_interrupt_char=N(`_mp_hal_get_interrupt_char`),i._proxy_c_init=N(`_proxy_c_init`),i._proxy_c_free_obj=N(`_proxy_c_free_obj`),i._proxy_c_to_js_call=N(`_proxy_c_to_js_call`),i._proxy_c_to_js_dir=N(`_proxy_c_to_js_dir`),i._proxy_c_to_js_has_attr=N(`_proxy_c_to_js_has_attr`),i._proxy_c_to_js_lookup_attr=N(`_proxy_c_to_js_lookup_attr`),i._proxy_c_to_js_store_attr=N(`_proxy_c_to_js_store_attr`),i._proxy_c_to_js_delete_attr=N(`_proxy_c_to_js_delete_attr`),i._proxy_c_to_js_get_type=N(`_proxy_c_to_js_get_type`),i._proxy_c_to_js_get_array=N(`_proxy_c_to_js_get_array`),i._proxy_c_to_js_get_dict=N(`_proxy_c_to_js_get_dict`),i._proxy_c_to_js_get_iter=N(`_proxy_c_to_js_get_iter`),i._proxy_c_to_js_iternext=N(`_proxy_c_to_js_iternext`),i._proxy_c_to_js_resume=N(`_proxy_c_to_js_resume`);var Ve=N(`_fflush`),He=N(`_strerror`),Ue=N(`_emscripten_stack_get_end`),Z=N(`_setThrew`),We=N(`_emscripten_stack_init`),Ge=N(`__emscripten_stack_restore`),Ke=N(`__emscripten_stack_alloc`),qe=N(`_emscripten_stack_get_current`),Je=N(`wasmMemory`),Ye=N(`wasmTable`),Xe,Ze,Qe={__syscall_chdir:function(e){try{return e=J.getStr(e),q.chdir(e),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_fstat64:function(e,t){try{return J.writeStat(t,q.fstat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_getcwd:function(e,t){try{if(t===0)return-28;var n=q.cwd(),r=Ee(n)+1;return t<r?-68:(Fe(n,e,t),r)}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_getdents64:function(e,t,n){try{var r=J.getStreamFromFD(e);r.getdents||=q.readdir(r.path);for(var i=0,a=q.llseek(r,0,1),o=Math.floor(a/280),s=Math.min(r.getdents.length,o+Math.floor(n/280)),c=o;c<s;c++){var l,u,d=r.getdents[c];if(d===`.`)l=r.node.id,u=4;else if(d===`..`)l=q.lookupPath(r.path,{parent:!0}).node.id,u=4;else{var f;try{f=q.lookupNode(r.node,d)}catch(e){if(e?.errno===28)continue;throw e}l=f.id,u=q.isChrdev(f.mode)?2:q.isDir(f.mode)?4:q.isLink(f.mode)?10:8}w(l),j[t+i>>3]=BigInt(l),j[t+i+8>>3]=BigInt(280*(c+1)),O[t+i+16>>1]=280,D[t+i+18]=u,Fe(d,t+i+19,256),i+=280}return q.llseek(r,280*c,0),i}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_lstat64:function(e,t){try{return e=J.getStr(e),J.writeStat(t,q.lstat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_mkdirat:function(e,t,n){try{return t=J.getStr(t),t=J.calculateAt(e,t),q.mkdir(t,n,0),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_newfstatat:function(e,t,n,r){try{t=J.getStr(t);var i=256&r,a=4096&r;return w(!(r&=-6401),`unknown flags in __syscall_newfstatat: ${r}`),t=J.calculateAt(e,t,a),J.writeStat(n,i?q.lstat(t):q.stat(t))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_openat:function(e,t,n,r){J.varargs=r;try{t=J.getStr(t),t=J.calculateAt(e,t);var i=r?(()=>{w(J.varargs!=null);var e=k[J.varargs>>2];return J.varargs+=4,e})():0;return q.open(t,n,i).fd}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_poll:function(e,t,n){try{for(var r=0,i=0;i<t;i++){var a=e+8*i,o=k[a>>2],s=O[a+4>>1],c=32,l=q.getStream(o);l&&(c=l.stream_ops.poll?l.stream_ops.poll(l,-1):5),(c&=24|s)&&r++,O[a+6>>1]=c}return r||n==0||R(`non-zero poll() timeout not supported: `+n),r}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_renameat:function(e,t,n,r){try{return t=J.getStr(t),r=J.getStr(r),t=J.calculateAt(e,t),r=J.calculateAt(n,r),q.rename(t,r),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_rmdir:function(e){try{return e=J.getStr(e),q.rmdir(e),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_stat64:function(e,t){try{return e=J.getStr(e),J.writeStat(t,q.stat(e))}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_statfs64:function(e,t,n){try{return w(t===88),J.writeStatFs(n,q.statfs(J.getStr(e))),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},__syscall_unlinkat:function(e,t,n){try{if(t=J.getStr(t),t=J.calculateAt(e,t),n){if(n!==512)return-28;q.rmdir(t)}else q.unlink(t);return 0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return-e.errno}},_abort_js:()=>P(`native code called abort()`),_emscripten_throw_longjmp:()=>{throw 1/0},call0:function(e,t){u((0,proxy_js_ref[e])(),t)},call0_kwarg:function(e,t,n,r,i,a){let o=proxy_js_ref[e],s={};for(let e=0;e<n;++e){let t=U(be(r+4*e,`i32`));s[t]=d(i+3*e*4)}let c;c=t?o.call(s):o(s),u(c,a)},call1:function(e,t,n,r){let i=d(n),a=proxy_js_ref[e],o;o=t?a.call(i):a(i),u(o,r)},call2:function(e,t,n,r,i){let a=d(n),o=d(r),s=proxy_js_ref[e],c;c=t?s.call(a,o):s(a,o),u(c,i)},calln:function(e,t,n,r,i){let a=proxy_js_ref[e],o=[];for(let e=0;e<n;++e){let t=d(r+3*e*4);o.push(t)}let s;s=t?a.call(...o):a(...o),u(s,i)},calln_kwarg:function(e,t,n,r,i,a,o,s){let c=proxy_js_ref[e],l=[];for(let e=0;e<n;++e){let t=d(r+3*e*4);l.push(t)}let f={};for(let e=0;e<i;++e){let t=U(be(a+4*e,`i32`));f[t]=d(o+3*e*4)}let p;p=t?c.call(...l,f):c(...l,f),u(p,s)},create_promise:function(e,t){let n=d(e);u(new Promise(n),t)},emscripten_resize_heap:e=>{var t=ie.length;if(w((e>>>=0)>t),e>2147483648)return S(`Cannot enlarge memory, requested ${e} bytes, but the limit is 2147483648 bytes!`),!1;for(var n=1;n<=4;n*=2){var r=t*(1+.2/n);r=Math.min(r,e+100663296);var i=Math.min(2147483648,Y(Math.max(e,r),65536));if(Ie(i))return!0}return S(`Failed to grow the heap from ${t} bytes to ${i} bytes, not enough memory!`),!1},fd_close:function(e){try{var t=J.getStreamFromFD(e);return q.close(t),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_read:function(e,t,n,r){try{var i=((e,t,n,r)=>{for(var i=0,a=0;a<n;a++){var o=A[t>>2],s=A[t+4>>2];t+=8;var c=q.read(e,D,o,s,r);if(c<0)return-1;if(i+=c,c<s)break;r!==void 0&&(r+=c)}return i})(J.getStreamFromFD(e),t,n);return A[r>>2]=i,0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_seek:function(e,t,n,r){var i;t=(i=t)<-9007199254740992||i>9007199254740992?NaN:Number(i);try{if(isNaN(t))return 61;var a=J.getStreamFromFD(e);return q.llseek(a,t,n),j[r>>3]=BigInt(a.position),a.getdents&&t===0&&n===0&&(a.getdents=null),0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_sync:function(e){try{var t=J.getStreamFromFD(e);return t.stream_ops?.fsync?.(t)}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},fd_write:function(e,t,n,r){try{var i=((e,t,n,r)=>{for(var i=0,a=0;a<n;a++){var o=A[t>>2],s=A[t+4>>2];t+=8;var c=q.write(e,D,o,s,r);if(c<0)return-1;if(i+=c,c<s)break;r!==void 0&&(r+=c)}return i})(J.getStreamFromFD(e),t,n);return A[r>>2]=i,0}catch(e){if(q===void 0||e.name!==`ErrnoError`)throw e;return e.errno}},has_attr:function(e,t){let n=proxy_js_ref[e];return U(t)in n},invoke_i:function(e){var t=L();try{return X(e)()}catch(e){if(I(t),e!==e+0)throw e;Z(1,0)}},invoke_ii:function(e,t){var n=L();try{return X(e)(t)}catch(e){if(I(n),e!==e+0)throw e;Z(1,0)}},invoke_iii:function(e,t,n){var r=L();try{return X(e)(t,n)}catch(e){if(I(r),e!==e+0)throw e;Z(1,0)}},invoke_iiii:function(e,t,n,r){var i=L();try{return X(e)(t,n,r)}catch(e){if(I(i),e!==e+0)throw e;Z(1,0)}},invoke_iiiii:function(e,t,n,r,i){var a=L();try{return X(e)(t,n,r,i)}catch(e){if(I(a),e!==e+0)throw e;Z(1,0)}},invoke_iiiiii:function(e,t,n,r,i,a){var o=L();try{return X(e)(t,n,r,i,a)}catch(e){if(I(o),e!==e+0)throw e;Z(1,0)}},invoke_v:function(e){var t=L();try{X(e)()}catch(e){if(I(t),e!==e+0)throw e;Z(1,0)}},invoke_vi:function(e,t){var n=L();try{X(e)(t)}catch(e){if(I(n),e!==e+0)throw e;Z(1,0)}},invoke_vii:function(e,t,n){var r=L();try{X(e)(t,n)}catch(e){if(I(r),e!==e+0)throw e;Z(1,0)}},invoke_viii:function(e,t,n,r){var i=L();try{X(e)(t,n,r)}catch(e){if(I(i),e!==e+0)throw e;Z(1,0)}},invoke_viiii:function(e,t,n,r,i){var a=L();try{X(e)(t,n,r,i)}catch(e){if(I(a),e!==e+0)throw e;Z(1,0)}},js_check_existing:function(e){return function(e){let t=globalThis.proxy_js_map.get(e)?.deref();if(t===void 0)return-1;for(let e=0;e<globalThis.proxy_js_existing.length;++e)if(globalThis.proxy_js_existing[e]===void 0)return globalThis.proxy_js_existing[e]=t,e;return globalThis.proxy_js_existing.push(t),globalThis.proxy_js_existing.length-1}(e)},js_get_error_info:function(e,t,n){let r=proxy_js_ref[e];u(r.name,t),u(r.message,n)},js_get_iter:function(e,t){u(proxy_js_ref[e][Symbol.iterator](),t)},js_get_proxy_js_ref_info:function(e){let t=0;for(let e of proxy_js_ref)e!==void 0&&++t;i.setValue(e,proxy_js_ref.length,`i32`),i.setValue(e+4,t,`i32`)},js_iter_next:function(e,t){let n=proxy_js_ref[e].next();return!n.done&&(u(n.value,t),!0)},js_reflect_construct:function(e,t,n,r){let i=proxy_js_ref[e],a=[];for(let e=0;e<t;++e)a.push(d(n+3*e*4));u(Reflect.construct(i,a),r)},js_subscr_load:function(e,t,n){let r=proxy_js_ref[e];u(r[function(e,t){let n=t;if(typeof n==`number`&&(n<0&&(n+=e.length),n<0||n>=e.length))throw new s(`IndexError`,`index out of range`);return n}(r,d(t))],n)},js_subscr_store:function(e,t,n){proxy_js_ref[e][d(t)]=d(n)},js_then_continue:function(e,t,n,r,i){let a=d(t),o=d(n),s=d(r);u(proxy_js_ref[e].then(e=>{a(e,null,o,s)},e=>{a(null,e,o,s)}),i)},js_then_reject:function(e,t){let n;try{n=d(e)}catch(e){n=e}d(t)(n)},js_then_resolve:function(e,t){let n=d(e);d(t)(n)},lookup_attr:function(e,t,n){let r=proxy_js_ref[e],i=U(t),a=r[i];return a!==void 0||i in r?(u(a,n),typeof a!=`function`||`_ref`in a?1:2):0},mp_js_random_u32:()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0],mp_js_ticks_ms:()=>Date.now()-Be,mp_js_time_ms:()=>Date.now(),proxy_convert_mp_to_js_then_js_to_js_then_js_to_mp_obj_jsside:function(e){let t=d(e);u(r.toJs(t),e)},proxy_convert_mp_to_js_then_js_to_mp_obj_jsside:function(e){(function(e,t){l(e,t,!1)})(d(e),e)},proxy_js_free_obj:function(e){e>=o&&(proxy_js_ref_map.delete(proxy_js_ref[e]),proxy_js_ref[e]=void 0,e<proxy_js_ref_next&&(proxy_js_ref_next=e))},store_attr:function(e,t,n){let r=U(t),i=d(n);proxy_js_ref[e][r]=i}};function $e(){var e;We(),w(!(3&(e=Ue()))),e==0&&(e+=4),A[e>>2]=34821223,A[e+4>>2]=2310721022,A[0]=1668509029}Ze=await async function(){function e(e,t){return function(e){w(e.free!==void 0,`missing Wasm export: free`),w(e.malloc!==void 0,`missing Wasm export: malloc`),w(e.mp_sched_keyboard_interrupt!==void 0,`missing Wasm export: mp_sched_keyboard_interrupt`),w(e.mp_js_init!==void 0,`missing Wasm export: mp_js_init`),w(e.mp_js_register_js_module!==void 0,`missing Wasm export: mp_js_register_js_module`),w(e.mp_js_do_import!==void 0,`missing Wasm export: mp_js_do_import`),w(e.proxy_convert_mp_to_js_obj_cside!==void 0,`missing Wasm export: proxy_convert_mp_to_js_obj_cside`),w(e.mp_js_do_exec!==void 0,`missing Wasm export: mp_js_do_exec`),w(e.mp_js_do_exec_async!==void 0,`missing Wasm export: mp_js_do_exec_async`),w(e.mp_js_repl_init!==void 0,`missing Wasm export: mp_js_repl_init`),w(e.mp_js_repl_process_char!==void 0,`missing Wasm export: mp_js_repl_process_char`),w(e.mp_js_register_romfs!==void 0,`missing Wasm export: mp_js_register_romfs`),w(e.mp_hal_get_interrupt_char!==void 0,`missing Wasm export: mp_hal_get_interrupt_char`),w(e.proxy_c_init!==void 0,`missing Wasm export: proxy_c_init`),w(e.proxy_c_free_obj!==void 0,`missing Wasm export: proxy_c_free_obj`),w(e.proxy_c_to_js_call!==void 0,`missing Wasm export: proxy_c_to_js_call`),w(e.proxy_c_to_js_dir!==void 0,`missing Wasm export: proxy_c_to_js_dir`),w(e.proxy_c_to_js_has_attr!==void 0,`missing Wasm export: proxy_c_to_js_has_attr`),w(e.proxy_c_to_js_lookup_attr!==void 0,`missing Wasm export: proxy_c_to_js_lookup_attr`),w(e.proxy_c_to_js_store_attr!==void 0,`missing Wasm export: proxy_c_to_js_store_attr`),w(e.proxy_c_to_js_delete_attr!==void 0,`missing Wasm export: proxy_c_to_js_delete_attr`),w(e.proxy_c_to_js_get_type!==void 0,`missing Wasm export: proxy_c_to_js_get_type`),w(e.proxy_c_to_js_get_array!==void 0,`missing Wasm export: proxy_c_to_js_get_array`),w(e.proxy_c_to_js_get_dict!==void 0,`missing Wasm export: proxy_c_to_js_get_dict`),w(e.proxy_c_to_js_get_iter!==void 0,`missing Wasm export: proxy_c_to_js_get_iter`),w(e.proxy_c_to_js_iternext!==void 0,`missing Wasm export: proxy_c_to_js_iternext`),w(e.proxy_c_to_js_resume!==void 0,`missing Wasm export: proxy_c_to_js_resume`),w(e.fflush!==void 0,`missing Wasm export: fflush`),w(e.strerror!==void 0,`missing Wasm export: strerror`),w(e.emscripten_stack_get_end!==void 0,`missing Wasm export: emscripten_stack_get_end`),w(e.emscripten_stack_get_base!==void 0,`missing Wasm export: emscripten_stack_get_base`),w(e.setThrew!==void 0,`missing Wasm export: setThrew`),w(e.emscripten_stack_init!==void 0,`missing Wasm export: emscripten_stack_init`),w(e.emscripten_stack_get_free!==void 0,`missing Wasm export: emscripten_stack_get_free`),w(e._emscripten_stack_restore!==void 0,`missing Wasm export: _emscripten_stack_restore`),w(e._emscripten_stack_alloc!==void 0,`missing Wasm export: _emscripten_stack_alloc`),w(e.emscripten_stack_get_current!==void 0,`missing Wasm export: emscripten_stack_get_current`),w(e.memory!==void 0,`missing Wasm export: memory`),w(e.__indirect_function_table!==void 0,`missing Wasm export: __indirect_function_table`),i._free=F(`free`,1),i._malloc=F(`malloc`,1),i._mp_sched_keyboard_interrupt=F(`mp_sched_keyboard_interrupt`,0),i._mp_js_init=F(`mp_js_init`,2),i._mp_js_register_js_module=F(`mp_js_register_js_module`,2),i._mp_js_do_import=F(`mp_js_do_import`,2),i._proxy_convert_mp_to_js_obj_cside=F(`proxy_convert_mp_to_js_obj_cside`,2),i._mp_js_do_exec=F(`mp_js_do_exec`,3),i._mp_js_do_exec_async=F(`mp_js_do_exec_async`,3),i._mp_js_repl_init=F(`mp_js_repl_init`,0),i._mp_js_repl_process_char=F(`mp_js_repl_process_char`,1),i._mp_js_register_romfs=F(`mp_js_register_romfs`,2),i._mp_hal_get_interrupt_char=F(`mp_hal_get_interrupt_char`,0),i._proxy_c_init=F(`proxy_c_init`,0),i._proxy_c_free_obj=F(`proxy_c_free_obj`,1),i._proxy_c_to_js_call=F(`proxy_c_to_js_call`,4),i._proxy_c_to_js_dir=F(`proxy_c_to_js_dir`,2),i._proxy_c_to_js_has_attr=F(`proxy_c_to_js_has_attr`,2),i._proxy_c_to_js_lookup_attr=F(`proxy_c_to_js_lookup_attr`,3),i._proxy_c_to_js_store_attr=F(`proxy_c_to_js_store_attr`,3),i._proxy_c_to_js_delete_attr=F(`proxy_c_to_js_delete_attr`,2),i._proxy_c_to_js_get_type=F(`proxy_c_to_js_get_type`,1),i._proxy_c_to_js_get_array=F(`proxy_c_to_js_get_array`,2),i._proxy_c_to_js_get_dict=F(`proxy_c_to_js_get_dict`,2),i._proxy_c_to_js_get_iter=F(`proxy_c_to_js_get_iter`,1),i._proxy_c_to_js_iternext=F(`proxy_c_to_js_iternext`,2),i._proxy_c_to_js_resume=F(`proxy_c_to_js_resume`,2),Ve=F(`fflush`,1),He=F(`strerror`,1),Ue=e.emscripten_stack_get_end,e.emscripten_stack_get_base,Z=F(`setThrew`,2),We=e.emscripten_stack_init,e.emscripten_stack_get_free,Ge=e._emscripten_stack_restore,Ke=e._emscripten_stack_alloc,qe=e.emscripten_stack_get_current,Je=e.memory,Ye=e.__indirect_function_table}(Ze=e.exports),de(),Ze}var t=i,n={env:Qe,wasi_snapshot_preview1:Qe};return i.instantiateWasm?new Promise((t,r)=>{try{i.instantiateWasm(n,(n,r)=>{t(e(n))})}catch(e){S(`Module.instantiateWasm callback failed with error: ${e}`),r(e)}}):(le??=fe(),function(n){return w(i===t,`the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?`),t=null,e(n.instance)}(await me(b,le,n)))}(),function e(){function t(){w(!Xe),Xe=!0,i.calledRun=!0,C||(w(!ue),ue=!0,E(),i.noFSInit||q.initialized||q.init(),V.init(),Ze.__wasm_call_ctors(),q.ignorePermissions=!1,ne?.(i),i.onRuntimeInitialized?.(),M(`onRuntimeInitialized`),w(!i._main,`compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]`),function(){if(E(),i.postRun)for(typeof i.postRun==`function`&&(i.postRun=[i.postRun]);i.postRun.length;)_e(i.postRun.shift());M(`postRun`),he(ge)}())}W>0?Me=e:($e(),function(){if(i.preRun)for(typeof i.preRun==`function`&&(i.preRun=[i.preRun]);i.preRun.length;)ye(i.preRun.shift());M(`preRun`),he(ve)}(),W>0?Me=e:(i.setStatus?(i.setStatus(`Running...`),setTimeout(()=>{setTimeout(()=>i.setStatus(``),1),t()},1)):t(),E()))}(),n=ue?i:new Promise((e,t)=>{ne=e,re=t});for(let e of Object.keys(i))e in t||Object.defineProperty(t,e,{configurable:!0,get(){P(`Access to module property ('${e}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)}});return n}async function n(e){let{pystack:n,heapsize:i,url:o,stdin:s,stdout:l,stderr:d,linebuffer:p,romfs:m}=Object.assign({pystack:2048,heapsize:1048576,linebuffer:!0},e),h={locateFile:(e,t)=>o||t+e};h._textDecoder=new TextDecoder,s!==void 0&&(h.stdin=s),l!==void 0&&(p?(h._stdoutBuffer=[],h.stdout=e=>{e===10?(l(h._textDecoder.decode(new Uint8Array(h._stdoutBuffer))),h._stdoutBuffer=[]):h._stdoutBuffer.push(e)}):h.stdout=e=>l(new Uint8Array([e]))),d!==void 0&&(p?(h._stderrBuffer=[],h.stderr=e=>{e===10?(d(h._textDecoder.decode(new Uint8Array(h._stderrBuffer))),h._stderrBuffer=[]):h._stderrBuffer.push(e)}):h.stderr=e=>d(new Uint8Array([e]))),h=await t(h),globalThis.Module=h,c();let g=e=>{let t=h._malloc(12);return h.ccall(`mp_js_do_import`,`null`,[`string`,`pointer`],[e,t]),f(t)};if(m!==void 0){let e=h._malloc(m.length);h.HEAPU8.set(m,e),h.ccall(`mp_js_register_romfs`,`null`,[`pointer`,`number`],[e,m.length])}return h.ccall(`mp_js_init`,`null`,[`number`,`number`],[n,i]),h.ccall(`proxy_c_init`,`null`,[],[]),{_module:h,PyProxy:r,FS:h.FS,globals:{__dict__:g(`__main__`).__dict__,get(e){return this.__dict__[e]},set(e,t){this.__dict__[e]=t},delete(e){delete this.__dict__[e]}},registerJsModule(e,t){let n=h._malloc(12);u(t,n),h.ccall(`mp_js_register_js_module`,`null`,[`string`,`pointer`],[e,n]),h._free(n)},pyimport:g,runPython(e){let t=h.lengthBytesUTF8(e),n=h._malloc(t+1);h.stringToUTF8(e,n,t+1);let r=h._malloc(12);return h.ccall(`mp_js_do_exec`,`number`,[`pointer`,`number`,`pointer`],[n,t,r]),h._free(n),f(r)},runPythonAsync(e){let t=h.lengthBytesUTF8(e),n=h._malloc(t+1);h.stringToUTF8(e,n,t+1);let r=h._malloc(12);h.ccall(`mp_js_do_exec_async`,`number`,[`pointer`,`number`,`pointer`],[n,t,r]),h._free(n);let i=f(r);return i instanceof a?Promise.resolve(i):i},replInit(){h.ccall(`mp_js_repl_init`,`null`,[`null`])},replProcessChar:e=>h.ccall(`mp_js_repl_process_char`,`number`,[`number`],[e]),replProcessCharWithAsyncify:async e=>h.ccall(`mp_js_repl_process_char`,`number`,[`number`],[e],{async:!0})}}if(globalThis.loadMicroPython=n,typeof process==`object`&&typeof process.versions==`object`&&typeof process.versions.node==`string`&&process.argv.length>1){let t=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),r=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),i=t.resolve(r.fileURLToPath(import.meta.url)),a=t.resolve(process.argv[1]);i.includes(a)&&async function(){let t=await import(`./__vite-browser-external-Cn0MOYvd.js`).then(t=>e(t.default,1)),r=131072,i=``,a=!0;for(let e=2;e<process.argv.length;e++)if(process.argv[e]===`-X`&&e<process.argv.length-1){if(process.argv[e+1].includes(`heapsize=`)){r=parseInt(process.argv[e+1].split(`heapsize=`)[1]);let t=process.argv[e+1].substr(-1).toLowerCase();t===`k`?r*=1024:t===`m`&&(r*=1048576),++e}}else i+=t.readFileSync(process.argv[e],`utf8`),a=!1;!1===process.stdin.isTTY&&(i=t.readFileSync(0,`utf8`),a=!1);let o=await n({heapsize:r,stdout:e=>process.stdout.write(e),linebuffer:!1});if(a)o.replInit(),process.stdin.setRawMode(!0),process.stdin.on(`data`,e=>{for(let t=0;t<e.length;t++)o.replProcessCharWithAsyncify(e[t]).then(e=>{e&&process.exit()})});else{if(i.endsWith(`asyncio.run(main())
`)){let e=o.pyimport(`asyncio`);e.run=async t=>{await e.create_task(t)}}try{o.runPython(i)}catch(e){if(e.name!==`PythonError`)throw e;e.type===`SystemExit`||console.error(e.message)}}}()}var r=class e{constructor(e){this._ref=e}static toJs(t){if(!(t instanceof e))return t;let n=Module.ccall(`proxy_c_to_js_get_type`,`number`,[`number`],[t._ref]);if(n===1||n===2){let n=Module._malloc(8),r=Module._malloc(12);Module.ccall(`proxy_c_to_js_get_array`,`null`,[`number`,`pointer`],[t._ref,n]);let i=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`),o=[];for(let t=0;t<i;++t){Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[Module.getValue(a+4*t,`i32`),r]);let n=d(r);o.push(e.toJs(n))}return Module._free(n),Module._free(r),o}if(n===3){let n=Module._malloc(8),r=Module._malloc(12);Module.ccall(`proxy_c_to_js_get_dict`,`null`,[`number`,`pointer`],[t._ref,n]);let i=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`),o={};for(let t=0;t<i;++t){let n=Module.getValue(a+8*t,`i32`);if(n>8){Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[n,r]);let i=d(r),s=Module.getValue(a+8*t+4,`i32`);Module.ccall(`proxy_convert_mp_to_js_obj_cside`,`null`,[`pointer`,`pointer`],[s,r]);let c=d(r);o[i]=e.toJs(c)}}return Module._free(n),Module._free(r),o}return t}};const i={isExtensible:()=>!0,ownKeys(e){let t=Module._malloc(12);Module.ccall(`proxy_c_to_js_dir`,`null`,[`number`,`pointer`],[e._ref,t]);let n=f(t);return r.toJs(n).filter(e=>!e.startsWith(`__`))},getOwnPropertyDescriptor:(e,t)=>({value:e[t],enumerable:!0,writable:!0,configurable:!0}),has:(e,t)=>typeof t==`string`?Module.ccall(`proxy_c_to_js_has_attr`,`number`,[`number`,`string`],[e._ref,t]):t===Symbol.iterator,get(e,t){if(t===`_ref`)return e._ref;if(t===`then`||typeof t!=`string`){if(t===Symbol.iterator){let t=Module.ccall(`proxy_c_to_js_get_iter`,`number`,[`number`],[e._ref]);return function*(){let e=Module._malloc(12);for(;Module.ccall(`proxy_c_to_js_iternext`,`number`,[`number`,`pointer`],[t,e]);)yield d(e);Module._free(e)}}return}let n=Module._malloc(12);return Module.ccall(`proxy_c_to_js_lookup_attr`,`null`,[`number`,`string`,`pointer`],[e._ref,t,n]),f(n)},set(e,t,n){let r=Module._malloc(12);u(n,r);let i=Module.ccall(`proxy_c_to_js_store_attr`,`number`,[`number`,`string`,`number`],[e._ref,t,r]);return Module._free(r),i},deleteProperty:(e,t)=>Module.ccall(`proxy_c_to_js_delete_attr`,`number`,[`number`,`string`],[e._ref,t])};var a=class{constructor(e){this._ref=e}then(e,t){let n=Module._malloc(36);return u(e,n+12),u(t,n+24),Module.ccall(`proxy_c_to_js_resume`,`null`,[`number`,`pointer`],[this._ref,n]),f(n)}};const o=2;var s=class extends Error{constructor(e,t){super(t),this.name=`PythonError`,this.type=e}};function c(){globalThis.proxy_js_ref=[globalThis,void 0],globalThis.proxy_js_ref_next=2,globalThis.proxy_js_ref_map=new Map,globalThis.proxy_js_ref_map.set(globalThis,0),globalThis.proxy_js_map=new Map,globalThis.proxy_js_existing=[void 0],globalThis.pyProxyFinalizationRegistry=new FinalizationRegistry(e=>{globalThis.proxy_js_map.delete(e),Module.ccall(`proxy_c_free_obj`,`null`,[`number`],[e])})}function l(e,t,n){let i;if(e===void 0)i=0;else if(e===null)i=1;else if(typeof e==`boolean`)i=2,Module.setValue(t+4,e,`i32`);else if(typeof e==`number`)if(Number.isInteger(e))i=3,Module.setValue(t+4,e,`i32`);else{i=4;let n=t+4&-8;Module.setValue(n,e,`double`);let r=Module.getValue(n,`i32`),a=Module.getValue(n+4,`i32`);Module.setValue(t+4,r,`i32`),Module.setValue(t+8,a,`i32`)}else if(typeof e==`string`){i=5;let n=Module.lengthBytesUTF8(e),r=Module._malloc(n+1);Module.stringToUTF8(e,r,n+1),Module.setValue(t+4,n,`i32`),Module.setValue(t+8,r,`i32`)}else if(n&&(e instanceof r||typeof e==`function`&&`_ref`in e||e instanceof a))i=8,Module.setValue(t+4,e._ref,`i32`);else{let n,r=proxy_js_ref_map.get(e);r===void 0?(i=7,n=function(e){for(;proxy_js_ref_next<proxy_js_ref.length;){if(proxy_js_ref[proxy_js_ref_next]===void 0){let t=proxy_js_ref_next;return++proxy_js_ref_next,proxy_js_ref[t]=e,proxy_js_ref_map.set(e,t),t}++proxy_js_ref_next}let t=proxy_js_ref.length;return proxy_js_ref[t]=e,proxy_js_ref_next=proxy_js_ref.length,proxy_js_ref_map.set(e,t),t}(e)):(i=6,n=r),Module.setValue(t+4,n,`i32`)}Module.setValue(t+0,i,`i32`)}function u(e,t){l(e,t,!0)}function d(e){let t=Module.getValue(e,`i32`),n;if(t===-1){let t=Module.getValue(e+4,`i32`),n=Module.getValue(e+8,`i32`),r=Module.UTF8ToString(n,t);Module._free(n);let i=r.split(``);throw new s(i[0],i[1])}if(t===0)throw Error(`NULL object`);if(t===1)n=null;else if(t===2)n=!!Module.getValue(e+4,`i32`);else if(t===3)n=Module.getValue(e+4,`i32`);else if(t===4){let t=e+4&-8,r=Module.getValue(e+4,`i32`),i=Module.getValue(e+8,`i32`);Module.setValue(t,r,`i32`),Module.setValue(t+4,i,`i32`),n=Module.getValue(t,`double`)}else if(t===5){let t=Module.getValue(e+4,`i32`),r=Module.getValue(e+8,`i32`);n=Module.UTF8ToString(r,t)}else if(t===9){let t=Module.getValue(e+4,`i32`);n=proxy_js_ref[t]}else if(t===10){let t=Module.getValue(e+4,`i32`);n=globalThis.proxy_js_existing[t],globalThis.proxy_js_existing[t]=void 0}else{let o=Module.getValue(e+4,`i32`);if(t===6)n=(...e)=>function(e,t){let n=0;for(;t.length>0&&t[t.length-1]===void 0;)t.pop();if(t.length>0){n=Module._malloc(3*t.length*4);for(let e in t)u(t[e],n+3*e*4)}let r=Module._malloc(12);Module.ccall(`proxy_c_to_js_call`,`null`,[`number`,`number`,`number`,`pointer`],[e,t.length,n,r]),t.length>0&&Module._free(n);let i=f(r);return i instanceof a?Promise.resolve(i):i}(o,e),n._ref=o;else if(t===7)n=new a(o);else{let e=new r(o);n=new Proxy(e,i)}globalThis.pyProxyFinalizationRegistry.register(n,o),globalThis.proxy_js_map.set(o,new WeakRef(n))}return n}function f(e){let t=d(e);return Module._free(e),t}var p=`/ucsbxrp/assets/micropython-DXFUqjrr.wasm`;const m=Object.freeze({minimumXmm:-1524,minimumYmm:-609.6,maximumXmm:1524,maximumYmm:609.6}),h=m,g={defaultWorldId:`open`,worlds:[{id:`open`,label:`Course arena`,bounds:h,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[],markers:[{type:`start_box`,label:`Start`,minimumXmm:-120,minimumYmm:-120,maximumXmm:120,maximumYmm:120}]},{id:`delivery-gate-blocked`,label:`Delivery gate blocked`,bounds:h,initialPose:{xMm:0,yMm:0,headingRad:0},obstacles:[{type:`block`,label:`Blocked gate`,minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100}],markers:[{type:`start_line`,label:`Start`,x1Mm:0,y1Mm:-140,x2Mm:0,y2Mm:140},{type:`waypoint`,label:`Delivery`,xMm:900,yMm:0}]}]};function _(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`${t} must be an object`);return e}function v(e,t,n){if(!Array.isArray(e)||e.length>n)throw Error(`${t} must be a list with at most ${n} items`);return e}function y(e,t){if(typeof e!=`number`||!Number.isFinite(e))throw Error(`${t} must be a finite number`);return e}function b(e,t){if(typeof e!=`boolean`)throw Error(`${t} must be true or false`);return e}function x(e,t,n=64){if(typeof e!=`string`||!e.trim()||e.length>n)throw Error(`${t} must contain 1 to ${n} characters`);return e.trim()}function S(e,t){return e===void 0?void 0:x(e,t,48)}function C(e,t){let n=x(e,t,32);if(!/^[a-z][a-z0-9_-]*$/.test(n))throw Error(`${t} must use lower-case letters, digits, underscores, and hyphens`);return n}function w(e,t){let n=new Set(t),r=Object.fromEntries(Object.entries(e).filter(([e])=>!n.has(e)));return Object.keys(r).length===0?{}:{additionalProperties:r}}function T(e,t){let n=_(e,t),r={minimumXmm:y(n.minimum_x_mm,`${t}.minimum_x_mm`),minimumYmm:y(n.minimum_y_mm,`${t}.minimum_y_mm`),maximumXmm:y(n.maximum_x_mm,`${t}.maximum_x_mm`),maximumYmm:y(n.maximum_y_mm,`${t}.maximum_y_mm`)};if(r.maximumXmm<=r.minimumXmm||r.maximumYmm<=r.minimumYmm)throw Error(`${t} must have positive width and height`);return r}function E(e,t,n){return t>=e.minimumXmm&&t<=e.maximumXmm&&n>=e.minimumYmm&&n<=e.maximumYmm}function ee(e,t){return t.minimumXmm>=e.minimumXmm&&t.maximumXmm<=e.maximumXmm&&t.minimumYmm>=e.minimumYmm&&t.maximumYmm<=e.maximumYmm}function te(e,t){let n=_(e,`worlds[${t}]`),r=T(n.bounds,`worlds[${t}].bounds`),i=_(n.initial_pose??{x_mm:0,y_mm:0,heading_rad:0},`worlds[${t}].initial_pose`),a={xMm:y(i.x_mm,`worlds[${t}].initial_pose.x_mm`),yMm:y(i.y_mm,`worlds[${t}].initial_pose.y_mm`),headingRad:y(i.heading_rad,`worlds[${t}].initial_pose.heading_rad`)};if(a.xMm<r.minimumXmm||a.xMm>r.maximumXmm||a.yMm<r.minimumYmm||a.yMm>r.maximumYmm)throw Error(`worlds[${t}].initial_pose must be inside the bounds`);let o=v(n.obstacles??[],`worlds[${t}].obstacles`,32).map((e,n)=>{let i=_(e,`worlds[${t}].obstacles[${n}]`);if(i.type!==`block`&&i.type!==`wall`)throw Error(`worlds[${t}].obstacles[${n}].type must be block or wall`);let a=T(i,`worlds[${t}].obstacles[${n}]`);if(!ee(r,a))throw Error(`worlds[${t}].obstacles[${n}] must be inside the world bounds`);return{...a,type:i.type,label:S(i.label,`worlds[${t}].obstacles[${n}].label`),feature:i.feature===void 0?void 0:C(i.feature,`worlds[${t}].obstacles[${n}].feature`)}}),s=o.flatMap(e=>e.feature===void 0?[]:[e.feature]);if(new Set(s).size!==s.length)throw Error(`worlds[${t}] obstacle feature names must be unique`);let c=v(n.tracks??[],`worlds[${t}].tracks`,8).map((e,n)=>{let i=`worlds[${t}].tracks[${n}]`,a=_(e,i);if(a.type!==`line`)throw Error(`${i}.type must be line`);let o=y(a.width_mm,`${i}.width_mm`),s=y(a.darkness,`${i}.darkness`),c=b(a.closed??!1,`${i}.closed`);if(o<=0)throw Error(`${i}.width_mm must be positive`);if(s<0||s>1)throw Error(`${i}.darkness must be within [0, 1]`);let l=v(a.points,`${i}.points`,128).map((e,t)=>{let n=`${i}.points[${t}]`,a=_(e,n),o={xMm:y(a.x_mm,`${n}.x_mm`),yMm:y(a.y_mm,`${n}.y_mm`)};if(!E(r,o.xMm,o.yMm))throw Error(`${n} must be inside the world bounds`);return o});if(l.length<(c?3:2))throw Error(`${i}.points does not define a usable line`);for(let e=1;e<l.length;e+=1){let t=l[e-1],n=l[e];if(t.xMm===n.xMm&&t.yMm===n.yMm)throw Error(`${i}.points must not repeat adjacent points`)}return{type:`line`,name:a.name===void 0?void 0:C(a.name,`${i}.name`),label:S(a.label,`${i}.label`),widthMm:o,darkness:s,closed:c,points:l}}),l=c.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(l).size!==l.length)throw Error(`worlds[${t}] track names must be unique`);let u=v(n.markers??[],`worlds[${t}].markers`,32).map((e,n)=>{let i=`worlds[${t}].markers[${n}]`,a=_(e,i),o=S(a.label,`${i}.label`),s=a.name===void 0?void 0:C(a.name,`${i}.name`);if(a.type===`start_line`||a.type===`finish_line`){let e=y(a.x1_mm,`${i}.x1_mm`),t=y(a.y1_mm,`${i}.y1_mm`),n=y(a.x2_mm,`${i}.x2_mm`),c=y(a.y2_mm,`${i}.y2_mm`);if(e===n&&t===c)throw Error(`${i} must have two different endpoints`);if(!E(r,e,t)||!E(r,n,c))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,x1Mm:e,y1Mm:t,x2Mm:n,y2Mm:c,...w(a,[`type`,`name`,`label`,`x1_mm`,`y1_mm`,`x2_mm`,`y2_mm`])}}if(a.type===`start_box`||a.type===`finish_box`){let e=T(a,i);if(!ee(r,e))throw Error(`${i} must be inside the world bounds`);return{type:a.type,name:s,label:o,...e,...w(a,[`type`,`name`,`label`,`minimum_x_mm`,`minimum_y_mm`,`maximum_x_mm`,`maximum_y_mm`])}}if(a.type===`waypoint`){let e=y(a.x_mm,`${i}.x_mm`),t=y(a.y_mm,`${i}.y_mm`);if(!E(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`waypoint`,name:s,label:o,xMm:e,yMm:t,headingRad:a.heading_rad===void 0?void 0:y(a.heading_rad,`${i}.heading_rad`),...w(a,[`type`,`name`,`label`,`x_mm`,`y_mm`,`heading_rad`])}}if(a.type===`marker`){let e=y(a.x_mm,`${i}.x_mm`),t=y(a.y_mm,`${i}.y_mm`);if(!E(r,e,t))throw Error(`${i} must be inside the world bounds`);return{type:`marker`,name:s,label:o,xMm:e,yMm:t,...w(a,[`type`,`name`,`label`,`x_mm`,`y_mm`])}}throw Error(`${i}.type is not a supported marker`)}),d=u.flatMap(e=>e.name===void 0?[]:[e.name]);if(new Set(d).size!==d.length)throw Error(`worlds[${t}] marker names must be unique`);let f=n.range_sensor===void 0?void 0:_(n.range_sensor,`worlds[${t}].range_sensor`);return{id:C(n.id,`worlds[${t}].id`),label:x(n.label,`worlds[${t}].label`),bounds:r,initialPose:a,obstacles:o,tracks:c,markers:u,...f?.include_arena_boundary===void 0?{}:{includeArenaBoundaryInRange:b(f.include_arena_boundary,`worlds[${t}].range_sensor.include_arena_boundary`)}}}function ne(e){if(e.length>64e3)throw Error(`world.json is too large`);let t;try{t=JSON.parse(e)}catch(e){throw Error(`world.json is not valid JSON: ${e instanceof Error?e.message:String(e)}`)}let n=_(t,`world.json`),r=v(n.worlds,`worlds`,8).map(te);if(r.length===0)throw Error(`worlds must contain at least one world`);if(new Set(r.map(e=>e.id)).size!==r.length)throw Error(`world IDs must be unique`);let i=C(n.default_world,`default_world`);if(!r.some(e=>e.id===i))throw Error(`default_world must name one of the worlds`);return{defaultWorldId:i,worlds:r}}function re(e,t){let n=e.worlds.find(e=>e.id===t);if(!n)throw Error(`Unknown world '${t}'`);return n}const D=Math.PI/12,ie=Object.freeze(Array.from({length:9},(e,t)=>(t/8-.5)*D));function O(e,t=70){return{xMm:e.xMm+t*Math.cos(e.headingRad),yMm:e.yMm+t*Math.sin(e.headingRad)}}function k(e,t=55,n=12){let r=Math.cos(e.headingRad),i=Math.sin(e.headingRad),a=-i,o=r,s=e.xMm+t*r,c=e.yMm+t*i;return{left:{xMm:s+n*a,yMm:c+n*o},right:{xMm:s-n*a,yMm:c-n*o}}}Object.freeze({open:Object.freeze({label:`Course arena`,obstacles:Object.freeze([])}),"delivery-gate-blocked":Object.freeze({label:`Delivery gate blocked`,obstacles:Object.freeze([Object.freeze({minimumXmm:350,minimumYmm:-100,maximumXmm:450,maximumYmm:100})])})});function A(e){return{worldBounds:e.bounds,obstacles:e.obstacles,tracks:e.tracks??[],includeWorldBoundaryInRange:e.includeArenaBoundaryInRange!==!1}}function ae(e=`open`){return re(g,e)}const oe={fixedStepMs:20,wheelDiameterMm:60,trackWidthMm:155,encoderCountsPerRevolution:585,maximumWheelSpeedMmS:Math.PI*60*1.5,motorTimeConstantS:.18,leftStartEffort:.12,rightStartEffort:.13,leftResponseScale:1,rightResponseScale:.97,robotRadiusMm:85,rangeSensorOffsetMm:70,maximumRangeMm:4e3,batteryV:6.2,temperatureC:27,worldBounds:m,obstacles:[],tracks:[],reflectanceSensorForwardOffsetMm:55,reflectanceSensorLateralOffsetMm:12,reflectanceSensorFootprintRadiusMm:4,includeWorldBoundaryInRange:!0},j=.01;function M(e,t,n){return Math.max(t,Math.min(n,e))}function N(e){return((e+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI}function se(e,t,n,r){let i=Math.abs(M(e,-1,1));if(i<=t)return 0;let a=(i-t)/(1-t);return Math.sign(e)*a*n*r}function ce(e){return Number.isFinite(e.minimumXmm)&&Number.isFinite(e.minimumYmm)&&Number.isFinite(e.maximumXmm)&&Number.isFinite(e.maximumYmm)&&e.maximumXmm>e.minimumXmm&&e.maximumYmm>e.minimumYmm}function le(e,t,n,r){return e>=n.minimumXmm-r&&e<=n.maximumXmm+r&&t>=n.minimumYmm-r&&t<=n.maximumYmm+r}function ue(e,t,n,r,i){let a=-1/0,o=1/0,s=[[e,n,i.minimumXmm,i.maximumXmm],[t,r,i.minimumYmm,i.maximumYmm]];for(let[e,t,n,r]of s){if(Math.abs(t)<1e-12){if(e<n||e>r)return null;continue}let i=(n-e)/t,s=(r-e)/t;if(a=Math.max(a,Math.min(i,s)),o=Math.min(o,Math.max(i,s)),o<a)return null}return o<0?null:a>=0?a:o}function de(e,t,n){let r=n.xMm-t.xMm,i=n.yMm-t.yMm,a=r*r+i*i;if(a===0)return Math.hypot(e.xMm-t.xMm,e.yMm-t.yMm);let o=M(((e.xMm-t.xMm)*r+(e.yMm-t.yMm)*i)/a,0,1);return Math.hypot(e.xMm-(t.xMm+o*r),e.yMm-(t.yMm+o*i))}function P(e,t,n){let r=0;for(let i of t){let t=1/0;for(let n=1;n<i.points.length;n+=1)t=Math.min(t,de(e,i.points[n-1],i.points[n]));i.closed&&(t=Math.min(t,de(e,i.points[i.points.length-1],i.points[0])));let a=i.widthMm/2,o=n===0?+(t<=a):M((a+n-t)/(2*n),0,1);r=Math.max(r,o*i.darkness)}return r}var F=class{config;leftDistanceMm=0;rightDistanceMm=0;previousCenterSpeedMmS=0;currentState;constructor(e={}){if(this.config={...oe,...e,worldBounds:{...oe.worldBounds,...e.worldBounds},obstacles:(e.obstacles??oe.obstacles).map(e=>({...e})),tracks:(e.tracks??oe.tracks).map(e=>({...e,points:e.points.map(e=>({...e}))}))},!ce(this.config.worldBounds))throw Error(`Simulator world bounds must form a valid rectangle`);if(this.config.obstacles.some(e=>!ce(e)))throw Error(`Every simulator obstacle must form a valid rectangle`);this.currentState=this.initialState(),this.updateRange(),this.updateReflectance()}get state(){return{...this.currentState,pose:{...this.currentState.pose},accelerationMg:[...this.currentState.accelerationMg],angularRateMdps:[...this.currentState.angularRateMdps]}}reset(e={xMm:0,yMm:0,headingRad:0}){return this.leftDistanceMm=0,this.rightDistanceMm=0,this.previousCenterSpeedMmS=0,this.currentState={...this.initialState(),pose:{...e,headingRad:N(e.headingRad)}},this.updateRange(),this.updateReflectance(),this.state}setMotorEffort(e,t){let n=M(Number.isFinite(t)?t:0,-1,1);e===`left`?this.currentState.leftEffort=n:this.currentState.rightEffort=n}stop(){this.currentState.leftEffort=0,this.currentState.rightEffort=0}step(e=this.config.fixedStepMs){if(!(e>0))throw Error(`Simulator step must be positive`);let t=e/1e3,n=se(this.currentState.leftEffort,this.config.leftStartEffort,this.config.leftResponseScale,this.config.maximumWheelSpeedMmS),r=se(this.currentState.rightEffort,this.config.rightStartEffort,this.config.rightResponseScale,this.config.maximumWheelSpeedMmS),i=1-Math.exp(-t/this.config.motorTimeConstantS),a=this.currentState.leftWheelSpeedMmS+i*(n-this.currentState.leftWheelSpeedMmS),o=this.currentState.rightWheelSpeedMmS+i*(r-this.currentState.rightWheelSpeedMmS);n===0&&Math.abs(a)<j&&(a=0),r===0&&Math.abs(o)<j&&(o=0);let s=a*t,c=o*t;this.leftDistanceMm+=s,this.rightDistanceMm+=c;let l=(s+c)/2,u=(c-s)/this.config.trackWidthMm,d=this.currentState.pose,f=d.xMm,p=d.yMm;if(Math.abs(u)<1e-12)f+=l*Math.cos(d.headingRad),p+=l*Math.sin(d.headingRad);else{let e=l/u,t=d.headingRad+u;f+=e*(Math.sin(t)-Math.sin(d.headingRad)),p-=e*(Math.cos(t)-Math.cos(d.headingRad))}let m={xMm:f,yMm:p,headingRad:N(d.headingRad+u)},h=!this.poseIsFree(m),g=(a+o)/2,_=(g-this.previousCenterSpeedMmS)/t;this.previousCenterSpeedMmS=g;let v=Math.PI*this.config.wheelDiameterMm/this.config.encoderCountsPerRevolution;return this.currentState={...this.currentState,tMs:this.currentState.tMs+e,seq:this.currentState.seq+1,pose:h?d:m,leftWheelSpeedMmS:a,rightWheelSpeedMmS:o,leftEncoderCount:Math.round(this.leftDistanceMm/v),rightEncoderCount:Math.round(this.rightDistanceMm/v),collision:h,accelerationMg:[_/9.80665,0,1e3],angularRateMdps:[0,0,(o-a)/this.config.trackWidthMm*(180/Math.PI)*1e3]},this.updateRange(),this.updateReflectance(),this.state}poseIsFree(e){let t=this.config.worldBounds,n=this.config.robotRadiusMm;return e.xMm<t.minimumXmm+n||e.xMm>t.maximumXmm-n||e.yMm<t.minimumYmm+n||e.yMm>t.maximumYmm-n?!1:!this.config.obstacles.some(t=>le(e.xMm,e.yMm,t,n))}updateRange(){let e=this.currentState.pose,t=O(e,this.config.rangeSensorOffsetMm),n=[];for(let r of ie){let i=e.headingRad+r,a=Math.cos(i),o=Math.sin(i);for(let e of this.config.obstacles){let r=ue(t.xMm,t.yMm,a,o,e);r!==null&&r>=0&&n.push(r)}if(this.config.includeWorldBoundaryInRange){let e=ue(t.xMm,t.yMm,a,o,this.config.worldBounds);e!==null&&e>=0&&n.push(e)}}let r=n.length>0?Math.min(...n):1/0;this.currentState.rangeMm=r<=this.config.maximumRangeMm?r:null}updateReflectance(){let e=k(this.currentState.pose,this.config.reflectanceSensorForwardOffsetMm,this.config.reflectanceSensorLateralOffsetMm);this.currentState.leftReflectance=P(e.left,this.config.tracks,this.config.reflectanceSensorFootprintRadiusMm),this.currentState.rightReflectance=P(e.right,this.config.tracks,this.config.reflectanceSensorFootprintRadiusMm)}initialState(){return{tMs:0,seq:0,pose:{xMm:0,yMm:0,headingRad:0},leftEffort:0,rightEffort:0,leftWheelSpeedMmS:0,rightWheelSpeedMmS:0,leftEncoderCount:0,rightEncoderCount:0,collision:!1,rangeMm:null,leftReflectance:0,rightReflectance:0,buttonPressed:!1,accelerationMg:[0,0,1e3],angularRateMdps:[0,0,0],temperatureC:this.config.temperatureC,batteryV:this.config.batteryV}}},fe=`"""Small, typed course interface shared by the physical and virtual XRP."""

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

__version__ = "0.6.0-dev"

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
`,pe=`"""Course ownership of XRPLib devices; no background motor or IMU reads.

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
`,me=`"""One course-owned ultrasound attempt stream, with no background work."""

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
`,he=`"""Private cooperative stop signal used by the physical XRP service."""


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
`,ge=`"""In-process pose channel shared with the optional browser target service."""

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

# Retain nearly two seconds of the 50 Hz course loop. This covers the brief
# interval in which the browser prioritizes Run or Stop over telemetry polling.
_BUFFER_SIZE = 96
_latest = None
_buffer = [None] * _BUFFER_SIZE
_buffer_write_index = 0
_sample_seq = 0
_sample_time_ms = 0
_last_sample_ticks_ms = None
_hardware_latest = None
_drive_latest = DriveCommand(0.0, 0.0)
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
        values = [None, None, None, None, None]
        for index, key in enumerate(("accelerationMg", "angularRateMdps", "temperatureC", "batteryV", "sensorError")):
            if key in diagnostics:
                value = diagnostics[key]
                values[index] = tuple(value) if index < 2 and value is not None else value
        _diagnostics_latest = tuple(values)
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
    global _latest, _buffer_write_index
    _acquire_snapshot()
    try:
        _latest = snapshot
        _buffer[_buffer_write_index] = snapshot
        _buffer_write_index = (_buffer_write_index + 1) % _BUFFER_SIZE
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
    same encoder, I2C, or GPIO devices concurrently. This whole-dictionary
    replacement lets that service observe current values without a second
    hardware access.
    """
    global _hardware_latest
    if not isinstance(raw_sensors, RawSensors):
        raise TypeError("raw_sensors must be a RawSensors value")
    if not isinstance(range_sampled, bool):
        raise TypeError("range_sampled must be True or False")
    if not isinstance(reflectance_sampled, bool):
        raise TypeError("reflectance_sampled must be True or False")
    _remember_acquisition(raw_sensors, range_sampled, diagnostics, range_seq)
    previous = {} if _hardware_latest is None else _hardware_latest
    snapshot = {
        "leftEncoderCount": raw_sensors.left_encoder_count,
        "rightEncoderCount": raw_sensors.right_encoder_count,
        "rangeMm": (
            raw_sensors.range_mm
            if range_sampled
            else previous.get("rangeMm")
        ),
        "buttonPressed": raw_sensors.button_pressed,
        "leftReflectance": (
            None
            if reflectance_sampled and raw_sensors.reflectance is None
            else (
                raw_sensors.reflectance.left
                if reflectance_sampled
                else previous.get("leftReflectance")
            )
        ),
        "rightReflectance": (
            None
            if reflectance_sampled and raw_sensors.reflectance is None
            else (
                raw_sensors.reflectance.right
                if reflectance_sampled
                else previous.get("rightReflectance")
            )
        ),
        "accelerationMg": previous.get("accelerationMg"),
        "angularRateMdps": previous.get("angularRateMdps"),
        "temperatureC": previous.get("temperatureC"),
        "batteryV": previous.get("batteryV"),
        "sensorError": previous.get("sensorError"),
    }
    if diagnostics is not None:
        for key in (
            "accelerationMg",
            "angularRateMdps",
            "temperatureC",
            "batteryV",
            "sensorError",
        ):
            if key in diagnostics:
                snapshot[key] = diagnostics[key]
    _acquire_snapshot()
    try:
        _hardware_latest = snapshot
    finally:
        _release_snapshot()
    if not _course_samples:
        sequence, elapsed = _next_sample_identity()
        _retain_snapshot({
            "sampleSeq": sequence, "sampleTimeMs": elapsed,
            "poseAvailable": False, "xMm": 0.0, "yMm": 0.0, "headingRad": 0.0,
            "leftWheelSpeedMmS": 0.0, "rightWheelSpeedMmS": 0.0,
            "leftEncoderCount": raw_sensors.left_encoder_count,
            "rightEncoderCount": raw_sensors.right_encoder_count,
            "rangeMm": raw_sensors.range_mm, "buttonPressed": raw_sensors.button_pressed,
            "leftEffort": _drive_latest.left, "rightEffort": _drive_latest.right,
            "plotValues": _plot_sample_snapshot(),
            "timing": _publication_timing("raw"),
            "diagnostics": _diagnostics_latest,
        })
        if _publish_browser_raw is not None:
            try:
                publication = {"timing": _latest["timing"], "diagnostics": _latest["diagnostics"]}
                if _latest["plotValues"]:
                    publication["plots"] = [
                        {"name": name, "label": label, "unit": unit, "value": value}
                        for name, label, unit, value in _latest["plotValues"]
                    ]
                _publish_browser_raw(json.dumps(publication))
            except Exception:
                # A diagnostic bridge failure must not stop sensor acquisition.
                pass


def publish_drive_command(command):
    """Mirror the latest logical motor command without touching hardware."""
    global _drive_latest, _hardware_latest
    if not isinstance(command, DriveCommand):
        raise TypeError("command must be a DriveCommand")
    empty_hardware = None
    if _hardware_latest is None:
        empty_hardware = {
            "leftEncoderCount": 0,
            "rightEncoderCount": 0,
            "rangeMm": None,
            "buttonPressed": False,
            "leftReflectance": None,
            "rightReflectance": None,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": None,
            "batteryV": None,
            "sensorError": None,
        }
    _acquire_snapshot()
    try:
        _drive_latest = command
        if _hardware_latest is None:
            _hardware_latest = empty_hardware
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
    snapshot = dict(hardware)
    snapshot["leftEffort"] = drive.left
    snapshot["rightEffort"] = drive.right
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
):
    global _latest, _buffer_write_index
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
    sample_seq, sample_time_ms = _next_sample_identity()
    snapshot = {
        "sampleSeq": sample_seq,
        "sampleTimeMs": sample_time_ms,
        "xMm": state.pose.x_mm,
        "yMm": state.pose.y_mm,
        "headingRad": state.pose.heading_rad,
        "leftWheelSpeedMmS": state.measurements.left_speed_mm_s,
        "rightWheelSpeedMmS": state.measurements.right_speed_mm_s,
        "leftWheelDistanceMm": state.measurements.left_position_mm,
        "rightWheelDistanceMm": state.measurements.right_position_mm,
        "leftEncoderCount": (
            None if raw_sensors is None else raw_sensors.left_encoder_count
        ),
        "rightEncoderCount": (
            None if raw_sensors is None else raw_sensors.right_encoder_count
        ),
        "rangeMm": state.measurements.range_mm,
        "buttonPressed": state.measurements.button_pressed,
        "leftReflectance": (
            None
            if state.measurements.reflectance is None
            else state.measurements.reflectance.left
        ),
        "rightReflectance": (
            None
            if state.measurements.reflectance is None
            else state.measurements.reflectance.right
        ),
        # The physical-service wire keys remain stable for older app builds.
        "leftEffort": 0.0 if drive_command is None else drive_command.left,
        "rightEffort": 0.0 if drive_command is None else drive_command.right,
        "requestedForwardSpeedMmS": requested_forward,
        "requestedTurnRateRadS": requested_turn,
        "targetLeftWheelSpeedMmS": target_left,
        "targetRightWheelSpeedMmS": target_right,
        "plotValues": _plot_sample_snapshot(),
        "timing": _publication_timing(kind, state.measurements.dt_s * 1000.0, sample_period_ms, overrun_ms),
        "diagnostics": _diagnostics_latest,
    }
    # Each snapshot is replaced as a whole and is never mutated after this
    # point. Publish its pointer under the same short lock used to snapshot
    # the fixed ring, so a reader cannot skip entries added during its scan.
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
                    for name, label, unit, value in snapshot["plotValues"]
                ]),
                json.dumps({"timing": snapshot["timing"], "diagnostics": snapshot["diagnostics"]}),
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
    return None if latest is None else dict(latest)


def buffered_state_snapshots(after_sample_seq=0):
    """Return retained robot samples newer than \`\`after_sample_seq\`\`.

    The returned tuple is ordered by sequence. Its dictionaries are internal
    immutable snapshots; callers must treat them as read-only.
    """
    try:
        after_sample_seq = int(after_sample_seq)
    except (TypeError, ValueError):
        after_sample_seq = 0
    _acquire_snapshot()
    try:
        retained = tuple(_buffer)
    finally:
        _release_snapshot()
    snapshots = []
    for snapshot in retained:
        if snapshot is not None and snapshot["sampleSeq"] > after_sample_seq:
            snapshots.append(snapshot)
    snapshots.sort(key=lambda value: value["sampleSeq"])
    return tuple(snapshots)


def clear_state():
    global _latest, _buffer, _buffer_write_index
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    global _hardware_latest, _drive_latest
    global _clock_ticks_ms, _clock_elapsed_ms, _raw_seq, _last_raw, _raw_timing
    global _range_seq, _range_time_ms, _diagnostics_seq, _diagnostics_time_ms
    global _diagnostics_latest, _course_samples
    global _range_sampled
    begin_range_scope()
    empty_buffer = [None] * _BUFFER_SIZE
    stopped_drive = DriveCommand(0.0, 0.0)
    _acquire_snapshot()
    try:
        _latest = None
        _buffer = empty_buffer
        _buffer_write_index = 0
        _hardware_latest = None
        _drive_latest = stopped_drive
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
`,_e=`"""Small validation helpers shared by the MicroPython course package."""

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

`,ve=`"""Supplied hardware-free checks for course component implementations."""

from math import cos, pi, sin

from .config import NavigationConfig, RobotConfig
from .maps import OccupancyGrid
from .records import (
    DriveCommand,
    GridCell,
    GridPath,
    MotionCommand,
    NavigationGoal,
    Pose,
    RawSensors,
    WheelSpeeds,
)


def _close(label, actual, expected, tolerance=1e-6):
    if abs(actual - expected) > tolerance:
        raise AssertionError(
            "{}: expected {}, received {}".format(label, expected, actual)
        )


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
    _close("reset dt_s", zero.dt_s, 0.0)
    _close("reset left position (mm)", zero.left_position_mm, 0.0)
    _close("reset right position (mm)", zero.right_position_mm, 0.0)
    _close("reset left increment (mm)", zero.left_increment_mm, 0.0)
    _close("reset right increment (mm)", zero.right_increment_mm, 0.0)
    _close("reset left speed (mm/s)", zero.left_speed_mm_s, 0.0)
    _close("reset right speed (mm/s)", zero.right_speed_mm_s, 0.0)
    _close("preserved reset range (mm)", zero.range_mm, 500.0)
    measured = model.update(RawSensors(125, 9, 21, 450.0, True))
    _close("update dt_s from device time", measured.dt_s, 0.025)
    _close("left position (mm)", measured.left_position_mm, pi / 10.0)
    _close("right position (mm)", measured.right_position_mm, pi / 10.0)
    _close("left increment (mm)", measured.left_increment_mm, pi / 10.0)
    _close("right increment (mm)", measured.right_increment_mm, pi / 10.0)
    raw_one_count_speed_mm_s = 4.0 * pi
    if not 0.0 < measured.left_speed_mm_s < raw_one_count_speed_mm_s:
        raise AssertionError(
            (
                "left speed (mm/s): expected a positive estimate based on "
                "recent encoder samples below {}, received {}"
            ).format(
                raw_one_count_speed_mm_s, measured.left_speed_mm_s
            )
        )
    if not 0.0 < measured.right_speed_mm_s < raw_one_count_speed_mm_s:
        raise AssertionError(
            (
                "right speed (mm/s): expected a positive estimate based on "
                "recent encoder samples below {}, received {}"
            ).format(
                raw_one_count_speed_mm_s, measured.right_speed_mm_s
            )
        )
    if not measured.button_pressed:
        raise AssertionError("USER button state was not preserved")
    _close("preserved update range (mm)", measured.range_mm, 450.0)

    next_measured = model.update(RawSensors(165, 7, 23, None, False))
    _close("next dt_s from device time", next_measured.dt_s, 0.04)
    _close("cumulative left position (mm)", next_measured.left_position_mm, 3.0 * pi / 10.0)
    _close("latest left increment (mm)", next_measured.left_increment_mm, 2.0 * pi / 10.0)
    _close("cumulative right position (mm)", next_measured.right_position_mm, 3.0 * pi / 10.0)
    _close("latest right increment (mm)", next_measured.right_increment_mm, 2.0 * pi / 10.0)
    if next_measured.left_speed_mm_s <= measured.left_speed_mm_s:
        raise AssertionError(
            (
                "left speed response (mm/s): expected the estimate to increase "
                "after the faster sample; received first={} next={}"
            ).format(
                measured.left_speed_mm_s,
                next_measured.left_speed_mm_s,
            )
        )
    if next_measured.right_speed_mm_s <= measured.right_speed_mm_s:
        raise AssertionError(
            (
                "right speed response (mm/s): expected the estimate to increase "
                "after the faster sample; received first={} next={}"
            ).format(
                measured.right_speed_mm_s,
                next_measured.right_speed_mm_s,
            )
        )

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
    _close("varied-config preserved range (mm)", varied.range_mm, 525.0)
    if not varied.button_pressed:
        raise AssertionError("varied-config USER button state was not preserved")
    return (
        "dt = {:.3f}/{:.3f} s; positions = {:.3f}/{:.3f} mm; "
        "latest increments = {:.3f}/{:.3f} mm; left speed = {:.3f}->{:.3f} "
        "mm/s; right speed = {:.3f}->{:.3f} mm/s; varied geometry = {:.3f}/{:.3f} mm"
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
        raise AssertionError("update() should return a DriveCommand")
    if close_command.left <= 0.0 or close_command.right >= 0.0:
        raise AssertionError(
            (
                "drive-command signs: expected left positive and right negative, "
                "received left={} right={}"
            ).format(
                close_command.left, close_command.right
            )
        )
    if abs(close_command.left) > 0.6 or abs(close_command.right) > 0.6:
        raise AssertionError("commands should respect max_drive_command")
    controller.reset()
    underspeed_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(20.0, -20.0),
    )
    if underspeed_command.left <= close_command.left:
        raise AssertionError(
            (
                "left speed response: expected more command for the larger "
                "positive speed error; received close={} underspeed={}"
            ).format(
                close_command.left,
                underspeed_command.left,
            )
        )
    if underspeed_command.right >= close_command.right:
        raise AssertionError(
            (
                "right speed response: expected more negative command for the "
                "larger negative speed error; received close={} underspeed={}"
            ).format(
                close_command.right,
                underspeed_command.right,
            )
        )
    if abs(underspeed_command.left) > 0.6 or abs(underspeed_command.right) > 0.6:
        raise AssertionError("commands should respect max_drive_command")
    controller.reset()
    stopped = controller.update(
        WheelSpeeds(0.0, 0.0),
        WheelSpeeds(20.0, -20.0),
    )
    if stopped.left != 0.0 or stopped.right != 0.0:
        raise AssertionError(
            "zero target: expected left=0.0 right=0.0, received left={} right={}".format(
                stopped.left, stopped.right
            )
        )
    controller.reset()
    reverse_and_stop = controller.update(
        WheelSpeeds(-70.0, 0.0),
        WheelSpeeds(-40.0, 35.0),
    )
    if reverse_and_stop.left >= 0.0:
        raise AssertionError(
            "reverse target: expected a negative left command, received {}".format(
                reverse_and_stop.left
            )
        )
    if reverse_and_stop.right != 0.0:
        raise AssertionError(
            "mixed stop: expected right=0.0, received {}".format(
                reverse_and_stop.right
            )
        )
    if abs(reverse_and_stop.left) > 0.6:
        raise AssertionError("reverse command should respect max_drive_command")
    return (
        "target +100/-100 mm/s: measured +80/-80 gave {:.3f}/{:.3f}; "
        "measured +20/-20 gave {:.3f}/{:.3f}; zero target gave 0/0; "
        "mixed reverse/stop gave {:.3f}/0"
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
        raise AssertionError("too few usable readings should return None")
    _close("odd-count median (mm)", model.estimate_range((500.0, 100.0, 300.0), 3), 300.0)
    _close("even-count median (mm)", model.estimate_range((500.0, 100.0, 300.0, 200.0), 4), 250.0)
    try:
        model.estimate_range((100.0,), 0)
    except (TypeError, ValueError):
        pass
    else:
        raise AssertionError("minimum_usable: expected rejection of 0")
    return "mixed median = 250 mm; odd/even medians = 300/250 mm; too few = None"


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
        "straight 80/80; moving turn 0/200; in-place right turn 50/-50; "
        "140 mm track reverse curve -65/5 mm/s"
    )


def _odometry(component_class):
    odometry = component_class(RobotConfig(track_width_mm=100.0))
    initial = odometry.reset(Pose(0.0, 0.0, 0.0))
    if initial != Pose(0.0, 0.0, 0.0) or odometry.pose != initial:
        raise AssertionError("reset() and pose should report the initial pose")
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
        raise AssertionError("pose property: expected the latest returned Pose")

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
        "straight pose = (10.000, 0.000, 0.000); in-place heading = 1.000 rad; "
        "curved pose = ({:.3f}, {:.3f}, {:.3f}); varied start = "
        "({:.3f}, {:.3f}, {:.3f})"
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
        raise AssertionError("an empty route should be complete")
    stopped = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("empty-route forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0)
    _close("empty-route turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0)

    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if not isinstance(command, MotionCommand):
        raise AssertionError("update() should return a MotionCommand")
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("a goal straight ahead should request forward motion")
    if navigation.current_goal() != NavigationGoal(200.0, 0.0):
        raise AssertionError("current_goal() should return the active goal")

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
    _close("side-goal forward speed (mm/s)", side_turn.forward_speed_mm_s, 0.0)
    if side_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            "side-goal turn rate (rad/s): expected a positive left turn, received {}".format(
                side_turn.turn_rate_rad_s
            )
        )

    right_navigation = component_class(config)
    right_navigation.start((NavigationGoal(0.0, -200.0),))
    right_turn = right_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("right-goal forward speed (mm/s)", right_turn.forward_speed_mm_s, 0.0)
    if right_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "right-goal turn rate (rad/s): expected a negative right turn, received {}".format(
                right_turn.turn_rate_rad_s
            )
        )

    wrap_navigation = component_class(config)
    wrap_navigation.start((NavigationGoal(-200.0, -10.0),))
    wrap_turn = wrap_navigation.update(Pose(0.0, 0.0, pi - 0.05))
    _close("wrapped-goal forward speed (mm/s)", wrap_turn.forward_speed_mm_s, 0.0)
    if wrap_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            (
                "wrapped-goal turn rate (rad/s): expected the shorter positive "
                "turn across -pi/pi, received {}"
            ).format(
                wrap_turn.turn_rate_rad_s
            )
        )

    realign_navigation = component_class(config)
    realign_navigation.start((NavigationGoal(200.0, 0.0),))
    driving = realign_navigation.update(Pose(0.0, 0.0, 0.0))
    if driving.forward_speed_mm_s <= 0.0:
        raise AssertionError("an aligned goal should begin with forward motion")
    realign_turn = realign_navigation.update(Pose(0.0, 0.0, 0.4))
    _close(
        "realignment forward speed (mm/s)",
        realign_turn.forward_speed_mm_s,
        0.0,
    )
    if realign_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "realignment turn rate (rad/s): expected a negative correction, received {}".format(
                realign_turn.turn_rate_rad_s
            )
        )

    ordered = component_class(config)
    first_goal = NavigationGoal(0.0, 0.0)
    second_goal = NavigationGoal(200.0, 0.0)
    ordered.start((first_goal, second_goal))
    ordered.update(Pose(0.0, 0.0, 0.0))
    if ordered.current_goal() != second_goal:
        raise AssertionError(
            "ordered route: expected the second goal after reaching the first"
        )

    navigation.start((NavigationGoal(0.0, 0.0, pi / 2.0),))
    turn = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("final-align forward speed (mm/s)", turn.forward_speed_mm_s, 0.0)
    if turn.turn_rate_rad_s <= 0.0:
        raise AssertionError("a positive final-heading error should turn left")
    stopped = navigation.update(Pose(0.0, 0.0, pi / 2.0))
    _close("completed forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0)
    _close("completed turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0)
    if not navigation.is_complete():
        raise AssertionError("the route should complete at its final pose")
    return (
        "forward = {:.1f} mm/s; left/right turns = {:.1f}/{:.1f} rad/s; "
        "wrapped turn = {:.1f} rad/s; realignment = {:.1f} rad/s; route completed"
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
            raise AssertionError("planner should return a GridPath")
        if route.cells[0] != start or route.cells[-1] != goal:
            raise AssertionError("route should begin at start and end at goal")
        for cell in route.cells:
            if grid.is_blocked(cell):
                raise AssertionError("every route cell should be free")
        for first, second in zip(route.cells, route.cells[1:]):
            if second not in grid.neighbors(first):
                raise AssertionError(
                    "successive route cells should share a horizontal or vertical side"
                )

    if direct is None:
        raise AssertionError("planner should connect the unobstructed endpoints")
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
        raise AssertionError("planner did not connect start to goal")
    check_route(grid, start, goal, path)

    if planner.plan(open_grid, None, direct_goal) is not None:
        raise AssertionError("a missing start should return None")
    if planner.plan(open_grid, direct_start, None) is not None:
        raise AssertionError("a missing goal should return None")
    if planner.plan(open_grid, GridCell(9, 9), direct_goal) is not None:
        raise AssertionError("an out-of-grid start should return None")

    blocked_start = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        2,
        1,
        (True, False),
    )
    if planner.plan(blocked_start, GridCell(0, 0), GridCell(1, 0)) is not None:
        raise AssertionError("a blocked endpoint should return None")

    divided = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, True, False),
    )
    if planner.plan(divided, GridCell(0, 0), GridCell(2, 0)) is not None:
        raise AssertionError("a disconnected goal should return None")

    same = planner.plan(open_grid, direct_start, direct_start)
    if same is None or same.cells != (direct_start,):
        raise AssertionError("start equal to goal should return a one-cell path")
    return "direct path = {} cells; detour path = {} cells; invalid/disconnected = None".format(
        len(direct.cells),
        len(path.cells),
    )


_CHECKS = (
    (
        "SensorModel · encoder distance and measured speed",
        "sensor_model",
        (
            "Provides wheel travel to Odometry and measured wheel speed to "
            "WheelSpeedController"
        ),
        (
            "two wheel geometries and encoder-sign conventions; unequal "
            "25/40 ms samples and one 30 ms sample"
        ),
        (
            "device timestamps set dt; encoder signs set forward distance; "
            "positions accumulate; increments remain per-sample; speed responds"
        ),
        _sensor_model,
    ),
    (
        "WheelSpeedController · signed and limited motor command",
        "wheel_speed_controller",
        "Turns requested wheel speeds into the motor commands used by Robot",
        (
            "request +100/-100 mm/s at two measured speeds, then a mixed "
            "reverse/stop request; verify direction, error response, and limits"
        ),
        (
            "a larger speed error produces a stronger command in the requested "
            "direction; limits hold; a zero target gives exact zero"
        ),
        _wheel_speed_controller,
    ),
    (
        "SensorModel · robust ultrasound estimate",
        "range_estimator",
        (
            "Combines stationary range readings before DeliveryMission selects "
            "the map condition"
        ),
        "combine valid, missing, nonfinite, and negative range samples and calculate the median",
        (
            "invalid readings are ignored; enough usable readings produce the "
            "odd/even median; too few produce None"
        ),
        _range_estimator,
    ),
    (
        "DifferentialDrive · body command to wheel targets",
        "differential_drive",
        (
            "Converts one robot-motion request into the two targets used by "
            "wheel control"
        ),
        (
            "check straight, moving-turn, and in-place commands, then change "
            "track width for a reverse curve"
        ),
        (
            "straight motion gives equal wheel targets; turning gives the "
            "wheel-speed difference with the correct sign"
        ),
        _differential_drive,
    ),
    (
        "Odometry · measured wheel increments to pose",
        "odometry",
        "Provides the estimated pose used to end turns and navigate",
        (
            "update pose after equal, equal-and-opposite, and unequal wheel "
            "travel, including a nonzero start and heading wrap"
        ),
        (
            "equal travel advances straight; opposite travel turns in place; "
            "unequal travel gives the corresponding planar arc"
        ),
        _odometry,
    ),
    (
        "NavigationController · goals to motion commands",
        "navigation_controller",
        (
            "Converts route goals and the estimated pose into requests that "
            "Robot can execute"
        ),
        (
            "check empty/ordered routes, forward/left/right goals, angle wrap, "
            "realignment, and a required final heading"
        ),
        (
            "routes advance in order; steering uses the shorter signed turn; "
            "large heading error suspends forward motion; completion stops"
        ),
        _navigation_controller,
    ),
    (
        "GridPlanner · connected route through free cells",
        "grid_planner",
        (
            "Provides the cell route converted to navigation goals before "
            "motion begins"
        ),
        (
            "check unobstructed and detour routes, missing or blocked endpoints, "
            "no-route cases, and start equal to goal"
        ),
        (
            "a returned path joins free side-sharing cells from start to goal; "
            "invalid or disconnected endpoints return None"
        ),
        _grid_planner,
    ),
)

_CLASS_KEYS = {
    "SensorModel": "sensor_model",
    "WheelSpeedController": "wheel_speed_controller",
    "DifferentialDrive": "differential_drive",
    "Odometry": "odometry",
    "NavigationController": "navigation_controller",
    "GridPlanner": "grid_planner",
}


def run_component_checks(*component_classes, **components):
    """Run concrete hardware-free examples for the supplied component classes.

    Classes may be passed directly in course order. The earlier named-keyword
    form remains accepted. Set \`\`include_range=True\`\` in Challenge 5 to check
    the range-estimation portion of \`\`SensorModel\`\` as well.

    Each example reports PASS, NOT IMPLEMENTED, or FAIL. A run with failures
    raises AssertionError after printing the summary. NOT IMPLEMENTED is a
    complete diagnostic result: it tells the student what remains to write,
    rather than reporting that the checker itself failed.
    """
    include_range = components.pop("include_range", False)
    if not isinstance(include_range, bool):
        raise TypeError("include_range must be True or False")
    for component_class in component_classes:
        key = _CLASS_KEYS.get(getattr(component_class, "__name__", ""))
        if key is None:
            raise ValueError(
                "unknown component class: "
                + getattr(component_class, "__name__", str(component_class))
            )
        if key in components:
            raise ValueError("component supplied more than once: " + key)
        components[key] = component_class
    if include_range:
        sensor_model = components.get("sensor_model")
        if sensor_model is None:
            raise ValueError("include_range requires SensorModel")
        components["range_estimator"] = sensor_model

    unknown = set(components).difference(item[1] for item in _CHECKS)
    if unknown:
        raise ValueError("unknown component check: " + sorted(unknown)[0])
    if not components:
        raise ValueError("at least one component class is required")

    passed = 0
    not_implemented = 0
    failed = 0
    print(
        "These checks call your project classes with small examples; "
        "they do not start either robot."
    )
    print(
        "PASS = implemented behavior matched this example; NOT IMPLEMENTED = "
        "method still needs code; FAIL = method ran but this result was incorrect."
    )
    for (
        label,
        key,
        use_description,
        input_description,
        expected,
        check_function,
    ) in _CHECKS:
        component_class = components.get(key)
        if component_class is None:
            continue
        print("CHECK · " + label)
        print("USE · " + use_description)
        print("INPUT · " + input_description)
        print("EXPECT · " + expected)
        try:
            observed = check_function(component_class)
        except NotImplementedError as error:
            not_implemented += 1
            detail = str(error)
            print(
                "NOT IMPLEMENTED · "
                + label
                + ((" · " + detail) if detail else "")
            )
        except Exception as error:
            failed += 1
            print("FAIL · {} · {}".format(label, error))
        else:
            passed += 1
            print("OBSERVED · " + observed)
            print("PASS · " + label)

    print(
        "{} passed · {} not implemented · {} failed".format(
            passed,
            not_implemented,
            failed,
        )
    )
    if failed:
        raise AssertionError("{} component check(s) failed".format(failed))


__all__ = ("run_component_checks",)
`,ye=`"""Validated, immutable configuration values for UCSB-XRP."""

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
        "max_drive_command",
    )

    def __init__(
        self,
        sample_period_ms=20,
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
`,be=`"""Small runtime controls and named watch values for student programs.

Parameters are declared once, then read through their \`\`value\`\` property.
The Monitor may queue a new value while the program runs; \`\`apply_updates\`\`
applies all queued values together at a control-loop boundary. \`\`Robot\`\` does
this automatically after each measured sample.
"""

import json
import math

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
_runtime_json = '{"revision":0,"parameters":[],"watches":[],"plots":[]}'
_snapshot_dirty = False
_sample_plots = ()


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


def _refresh_snapshot():
    global _revision, _runtime_json, _snapshot_dirty
    _revision += 1
    value = {
        "revision": _revision,
        "parameters": [_parameter_record(item) for item in _parameters],
        "watches": [dict(item) for item in _watches],
        "plots": [dict(item) for item in _plots],
    }
    _runtime_json = json.dumps(value, separators=(",", ":"))
    _snapshot_dirty = False
    if _bridge is not None:
        _bridge.publish_runtime_state(_runtime_json)


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


def watch(name, value, unit="", label=None):
    """Stage one named value for publication at the next loop boundary."""
    global _snapshot_dirty
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("watch value must be finite")
    if not isinstance(value, (bool, int, float, str)):
        raise TypeError("watch value must be a number, boolean, or string")
    if isinstance(value, str) and len(value) > 64:
        raise ValueError("watch text may contain at most 64 characters")
    _acquire()
    try:
        existing = _watches_by_name.get(name)
        if existing is None:
            if len(_watches) >= MAX_WATCHES:
                raise ValueError("at most " + str(MAX_WATCHES) + " watches may be published")
            existing = {"name": name, "label": label, "value": value}
            if unit:
                existing["unit"] = unit
            _watches.append(existing)
            _watches_by_name[name] = existing
        else:
            existing["label"] = label
            existing["value"] = value
            if unit:
                existing["unit"] = unit
            else:
                existing.pop("unit", None)
        _snapshot_dirty = True
    finally:
        _release()


def plot(name, value, unit="", label=None):
    """Stage one numeric value for an optional Monitor strip plot."""
    global _snapshot_dirty, _sample_plots
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    value = _finite_number(value, "plot value")
    _acquire()
    try:
        existing = _plots_by_name.get(name)
        if existing is None:
            if len(_plots) >= MAX_PLOTS:
                raise ValueError(
                    "at most " + str(MAX_PLOTS) + " plot values may be published"
                )
            existing = {"name": name, "label": label, "value": value}
            if unit:
                existing["unit"] = unit
            _plots.append(existing)
            _plots_by_name[name] = existing
        else:
            existing["label"] = label
            existing["value"] = value
            if unit:
                existing["unit"] = unit
            else:
                existing.pop("unit", None)
        _snapshot_dirty = True
        # Immutable tuples share descriptor strings without retaining a mutable
        # runtime dictionary in every physical telemetry-ring sample.
        _sample_plots = tuple(
            (item["name"], item["label"], item.get("unit", ""), item["value"])
            for item in _plots
        )
    finally:
        _release()


def apply_updates():
    """Apply the most recent Monitor values as one control-loop update."""
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
        if changed or _snapshot_dirty:
            _refresh_snapshot()
    finally:
        _release()
    return changed


def queue_update(name, value):
    """Queue a validated physical-target update for the next sample boundary."""
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
        _refresh_snapshot()
    finally:
        _release()


def runtime_snapshot_json():
    """Return the immutable runtime snapshot consumed by the target service."""
    return _runtime_json


def _plot_sample_snapshot():
    """Return the immutable values published before this acquisition boundary."""
    return _sample_plots


def clear():
    """Clear state before a new physical project starts."""
    global _revision, _snapshot_dirty, _sample_plots
    _acquire()
    try:
        _parameters[:] = []
        _parameters_by_name.clear()
        _watches[:] = []
        _watches_by_name.clear()
        _plots[:] = []
        _plots_by_name.clear()
        _sample_plots = ()
        _revision = 0
        _snapshot_dirty = False
        _refresh_snapshot()
    finally:
        _release()


__all__ = (
    "LiveParameter",
    "apply_updates",
    "choice",
    "number",
    "plot",
    "toggle",
    "watch",
)
`,xe=`"""Dimensioned arena geometry and occupancy-grid sampling."""

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
`,I=`"""Delivery-task record and supplied Challenge 5 mission sequence."""

from math import sqrt

from ._validation import (
    require_bool,
    require_int,
    require_nonnegative,
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
`,L=`"""Validated value records for the public UCSB-XRP course interface."""

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
        self._left_mm_s = require_number("left_mm_s", left_mm_s)
        self._right_mm_s = require_number("right_mm_s", right_mm_s)

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
# adopted. Both names refer to the same validated value type.
MotorEfforts = DriveCommand


class MotionCommand(_ValueRecord):
    __slots__ = ("_forward_speed_mm_s", "_turn_rate_rad_s")
    _field_names = ("forward_speed_mm_s", "turn_rate_rad_s")

    def __init__(self, forward_speed_mm_s, turn_rate_rad_s):
        self._forward_speed_mm_s = require_number(
            "forward_speed_mm_s", forward_speed_mm_s
        )
        self._turn_rate_rad_s = require_number("turn_rate_rad_s", turn_rate_rad_s)

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
        self._reflectance = reflectance

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
        return WheelSpeeds(self.left_speed_mm_s, self.right_speed_mm_s)


class Pose(_ValueRecord):
    __slots__ = ("_x_mm", "_y_mm", "_heading_rad")
    _field_names = ("x_mm", "y_mm", "heading_rad")

    def __init__(self, x_mm, y_mm, heading_rad):
        self._x_mm = require_number("x_mm", x_mm)
        self._y_mm = require_number("y_mm", y_mm)
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
            final_heading_rad = wrap_angle_rad(final_heading_rad)
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
`,R=`"""The measured sample loop shared by all five course challenges."""

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
from ._validation import require_int, require_positive
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
        if not isinstance(command, MotionCommand):
            raise TypeError("command must be a MotionCommand")
        if not isinstance(read_range, bool):
            raise TypeError("read_range must be True or False")
        if not isinstance(read_reflectance, bool):
            raise TypeError("read_reflectance must be True or False")

        try:
            target = self._differential_drive.wheel_speeds(command)
            drive_command = self._wheel_controller.update(
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
            measurements = self._sensor_model.update(raw)
            pose = self._odometry.update(
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
                return self._bot.read(
                    include_range=include_range,
                    include_reflectance=True,
                )
            # Preserve compatibility with existing test and instructor adapters
            # whose read method predates the optional reflectance argument.
            return self._bot.read(include_range=include_range)
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
`,z=`"""Supplied straight-distance controller used in Challenge 1."""

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
`,Se=`# Measured straight trial with a caller-owned speed decision.

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


def run_straight_trial(robot, initial_pose, target_distance_mm, speed_for_distance):
    # speed_for_distance(remaining_mm) returns a nonnegative speed in mm/s;
    # zero requests the final stop. Manual Stop and exceptions also stop motors.
    # motion_time_s spans first detected motion through first detected rest,
    # excluding the confirmation interval. It is not a floor measurement.
    if not callable(speed_for_distance):
        raise TypeError("speed_for_distance must be callable")
    if not isfinite(target_distance_mm) or target_distance_mm <= 0.0:
        raise ValueError("target_distance_mm must be positive and finite")

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
            speed_mm_s = 0.0 if stopped else speed_for_distance(remaining_mm)
            if isinstance(speed_mm_s, bool) or not isinstance(speed_mm_s, (int, float)):
                raise TypeError("speed_for_distance must return a speed in mm/s")
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
            live.plot("remaining_mm", remaining_mm, unit="mm", label="Remaining distance")
            live.plot("requested_speed_mm_s", command.forward_speed_mm_s, unit="mm/s", label="Requested speed")
            live.watch("motion_time_s", motion_time_s, unit="s", label="Estimated motion time")
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
`,B=`"""Small component interfaces implemented progressively by students."""

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


class SensorModelBase(_ConfiguredComponent):
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


class WheelSpeedControllerBase(_ConfiguredComponent):
    """Convert requested and measured wheel speeds into motor commands.

    \`\`Robot\`\` supplies the requested speeds from \`\`DifferentialDrive\`\` and the
    measured speeds from \`\`SensorModel\`\`.  An implementation may keep
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
    passes the wheel-distance increments returned by \`\`SensorModel\`\` and uses
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
`,Ce=`"""Unit-independent numerical utilities used across course components."""

from math import atan2, pi, sqrt

from ._validation import require_number

try:
    from time import ticks_diff as _ticks_diff
except ImportError:  # CPython interface tests do not wrap their monotonic clock.
    def _ticks_diff(later, earlier):
        return later - earlier


def clamp(value, lower, upper):
    """Return *value* limited to the inclusive interval [lower, upper]."""
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
    if isinstance(later_ms, bool) or not isinstance(later_ms, int):
        raise TypeError("later_ms must be an integer")
    if isinstance(earlier_ms, bool) or not isinstance(earlier_ms, int):
        raise TypeError("earlier_ms must be an integer")
    return _ticks_diff(later_ms, earlier_ms) / 1000.0


def wrap_angle_rad(angle_rad):
    """Return the equivalent heading in the half-open interval [-pi, pi)."""
    angle_rad = require_number("angle_rad", angle_rad)
    wrapped = (angle_rad + pi) % (2.0 * pi) - pi
    # RP2350 MicroPython uses single-precision float arithmetic. At an exact
    # +pi input, the modulo expression can land a few 1e-7 rad below +pi
    # rather than at -pi. Collapse only that representation-scale boundary so
    # CPython and MicroPython keep the same documented half-open convention.
    if wrapped >= pi - 1e-6:
        return -pi
    return wrapped


def distance_to_goal(pose, goal):
    """Return planar distance from a pose to a navigation goal in millimeters."""
    dx = require_number("goal.x_mm", goal.x_mm) - require_number(
        "pose.x_mm", pose.x_mm
    )
    dy = require_number("goal.y_mm", goal.y_mm) - require_number(
        "pose.y_mm", pose.y_mm
    )
    return sqrt(dx * dx + dy * dy)


def bearing_to_goal(pose, goal):
    """Return the wrapped world-frame bearing from a pose to a goal."""
    dx = require_number("goal.x_mm", goal.x_mm) - require_number(
        "pose.x_mm", pose.x_mm
    )
    dy = require_number("goal.y_mm", goal.y_mm) - require_number(
        "pose.y_mm", pose.y_mm
    )
    return wrap_angle_rad(atan2(dy, dx))
`,we=`"""Load the dimensioned world that belongs to a course project."""

try:
    import json
except ImportError:  # pragma: no cover - older MicroPython name
    import ujson as json
import sys

from .maps import ArenaMap
from .records import NavigationGoal, Pose


def _number(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError("{} must be a number".format(name))
    return float(value)


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
`,Te=`"""The sole UCSB-XRP boundary to physical or simulated XRPLib devices."""

from ._validation import isfinite
from ._run_control import check_stop
from ._telemetry import publish_drive_command, publish_raw_sensors
from ._hardware import get_course_motor, get_course_imu, get_course_rangefinder, read_imu_diagnostics
from ._range import RangeAcquisition, range_scope
from .config import RobotConfig
from .records import DriveCommand, RawSensors, ReflectanceReadings
from .utils import clamp

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
    )

    def __init__(self, config, _devices=None, _ticks_ms=None):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._devices = _XRPLibDevices() if _devices is None else _devices
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
        reflectance_device = getattr(self._devices, "reflectance", None)
        if include_reflectance and reflectance_device is not None:
            reflectance = ReflectanceReadings(
                reflectance_device.get_left(),
                reflectance_device.get_right(),
            )

        now_ms = int(self._ticks_ms())
        raw = RawSensors(
            time_ms=now_ms,
            left_encoder_count=_relative_encoder_count(
                self._devices.left_motor.get_position_counts(),
                self._left_encoder_zero,
            ),
            right_encoder_count=_relative_encoder_count(
                self._devices.right_motor.get_position_counts(),
                self._right_encoder_zero,
            ),
            range_mm=range_mm,
            button_pressed=bool(self._devices.board.is_button_pressed()),
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
            self._devices.left_motor.get_position_counts()
        )
        self._right_encoder_zero = int(
            self._devices.right_motor.get_position_counts()
        )

    def wait_for_button(self):
        check_stop()
        self._devices.board.wait_for_button()

    def set_drive(self, command):
        """Apply one normalized command to the left and right motor channels."""
        check_stop()
        if not isinstance(command, DriveCommand):
            self._stop_after_invalid_command()
            raise TypeError("command must be a DriveCommand value")

        left = command.left
        right = command.right
        if (
            isinstance(left, bool)
            or not isinstance(left, (int, float))
            or isinstance(right, bool)
            or not isinstance(right, (int, float))
            or not isfinite(float(left))
            or not isfinite(float(right))
        ):
            self._stop_after_invalid_command()
            raise ValueError("drive commands must be finite real numbers")

        left = float(left)
        right = float(right)

        limit = self._config.max_drive_command
        logical_left = clamp(left, -limit, limit)
        logical_right = clamp(right, -limit, limit)
        left = logical_left * self._config.left_motor_sign
        right = logical_right * self._config.right_motor_sign

        try:
            self._devices.left_motor.set_effort(left)
            self._devices.right_motor.set_effort(right)
            self._publish_drive_safely(DriveCommand(logical_left, logical_right))
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
            self._devices.left_motor.set_effort(0.0)
        except Exception as error:
            first_error = error
        try:
            self._devices.right_motor.set_effort(0.0)
        except Exception as error:
            if first_error is None:
                first_error = error
        self._publish_drive_safely(DriveCommand(0.0, 0.0))
        return first_error

    def _publish_drive_safely(self, command):
        try:
            publish_drive_command(command)
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
        battery_reader = getattr(self._devices.board, "get_battery_voltage", None)
        if callable(battery_reader):
            try:
                diagnostics["batteryV"] = float(battery_reader())
            except Exception as error:
                errors.append("battery: " + type(error).__name__)
        imu = getattr(self._devices, "imu", None)
        if imu is not None:
            try:
                acceleration, angular_rate, temperature = read_imu_diagnostics(imu)
                diagnostics["accelerationMg"] = acceleration
                diagnostics["angularRateMdps"] = angular_rate
                diagnostics["temperatureC"] = temperature
            except Exception as error:
                errors.append("IMU: " + type(error).__name__)
        if diagnostics or errors:
            diagnostics["sensorError"] = "; ".join(errors) if errors else None
        return diagnostics or None
`,Ee=`data:application/octet-stream;base64,TQYAHw0BPHVjc2JfeHJwX3JlZmVyZW5jZS9fX2luaXRfXy5weQAPFlNlbnNvck1vZGVsAChXaGVlbFNwZWVkQ29udHJvbGxlcgAWY2hhbGxlbmdlXzEAIkRpZmZlcmVudGlhbERyaXZlABBPZG9tZXRyeQAWY2hhbGxlbmdlXzIAKE5hdmlnYXRpb25Db250cm9sbGVyABZjaGFsbGVuZ2VfMwAWR3JpZFBsYW5uZXIAFmNoYWxsZW5nZV80AA5fX2FsbF9fAAoGBRFEaWZmZXJlbnRpYWxEcml2ZQAFC0dyaWRQbGFubmVyAAUUTmF2aWdhdGlvbkNvbnRyb2xsZXIABQhPZG9tZXRyeQAFC1NlbnNvck1vZGVsAAUUV2hlZWxTcGVlZENvbnRyb2xsZXIAhFgQDgFAMjIsTECBEAIQAyoCGwQcAhYCHAMWA1mBEAUQBioCGwccBRYFHAYWBlmBEAgqARsJHAgWCFmBEAoqARsLHAoWClkjABYMUWM=`,De=`data:application/octet-stream;base64,TQYAH2QLQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfMS5weQAPBHBpAAhtYXRoABBpc2Zpbml0ZQAWcmVxdWlyZV9pbnQAKHVjc2JfeHJwLl92YWxpZGF0aW9uABhEcml2ZUNvbW1hbmQAGE1lYXN1cmVtZW50cwAUUmF3U2Vuc29ycwAWV2hlZWxTcGVlZHMAIHVjc2JfeHJwLnJlY29yZHMAHlNlbnNvck1vZGVsQmFzZQAwV2hlZWxTcGVlZENvbnRyb2xsZXJCYXNlACh1Y3NiX3hycC5zdHVkZW50X2FwaQAKY2xhbXAAHGVsYXBzZWRfdGltZV9zABx1Y3NiX3hycC51dGlscwAWU2Vuc29yTW9kZWwAKFdoZWVsU3BlZWRDb250cm9sbGVyACMid2hlZWxfZGlhbWV0ZXJfbW0AOmVuY29kZXJfY291bnRzX3Blcl9yZXZvbHV0aW9uACxfbWlsbGltZXRlcnNfcGVyX2NvdW50ACRfb3JpZ2luX2xlZnRfY291bnQAJl9vcmlnaW5fcmlnaHRfY291bnQAKF9wcmV2aW91c19sZWZ0X2NvdW50ACpfcHJldmlvdXNfcmlnaHRfY291bnQAIl9wcmV2aW91c190aW1lX21zABRfZWxhcHNlZF9zABxfc3BlZWRfdGltZXNfcwAwX2xlZnRfc3BlZWRfcG9zaXRpb25zX21tADJfcmlnaHRfc3BlZWRfcG9zaXRpb25zX21tACBzYW1wbGVfcGVyaW9kX21zAEZ3aGVlbF9zcGVlZF9maWx0ZXJfdGltZV9jb25zdGFudF9tcwAeX3NwZWVkX3dpbmRvd19zACBfbGVmdF9zcGVlZF9tbV9zACJfcmlnaHRfc3BlZWRfbW1fcwAUX2hhc19yZXNldAAKcmVzZXQAGF9yZXF1aXJlX3JhdwAkbGVmdF9lbmNvZGVyX2NvdW50ACZyaWdodF9lbmNvZGVyX2NvdW50AA50aW1lX21zABByYW5nZV9tbQAcYnV0dG9uX3ByZXNzZWQAFnJlZmxlY3RhbmNlAII/JF9jb3VudF9kaXN0YW5jZV9tbQAMY29uZmlnACJsZWZ0X2VuY29kZXJfc2lnbgAkcmlnaHRfZW5jb2Rlcl9zaWduAChfc3BlZWRfZmlsdGVyX3dlaWdodAAoX2FwcGVuZF9zcGVlZF9zYW1wbGUAHl9wb3NpdGlvbl9zbG9wZQAcZXN0aW1hdGVfcmFuZ2UAHG1pbmltdW1fdXNhYmxlAA5taW5pbXVtAHmCH4FxHF93aGVlbF9jb21tYW5kABJsZWZ0X21tX3MAJGxlZnRfc3RhcnRfY29tbWFuZAAubGVmdF9zcGVlZF9jb21tYW5kX2dhaW4AFHJpZ2h0X21tX3MAJnJpZ2h0X3N0YXJ0X2NvbW1hbmQAMHJpZ2h0X3NwZWVkX2NvbW1hbmRfZ2FpbgAcd2hlZWxfc3BlZWRfa3AAIm1heF9kcml2ZV9jb21tYW5kAC8tNRJfX3Nsb3RzX18AgikLghOCNQZtYXgABnJhdwBlDnNhbXBsZXMAgUOBPQpmbG9hdAB9gVcYY291bnRfY2hhbmdlABhlbmNvZGVyX3NpZ24ACGR0X3MADHRpbWVfcwAgbGVmdF9wb3NpdGlvbl9tbQAicmlnaHRfcG9zaXRpb25fbW0AGHBvc2l0aW9uc19tbQCCM20MdGFyZ2V0ABBtZWFzdXJlZAAac3RhcnRfY29tbWFuZAAkc3BlZWRfY29tbWFuZF9nYWluAAoOBRZfbWlsbGltZXRlcnNfcGVyX2NvdW50AAUSX29yaWdpbl9sZWZ0X2NvdW50AAUTX29yaWdpbl9yaWdodF9jb3VudAAFFF9wcmV2aW91c19sZWZ0X2NvdW50AAUVX3ByZXZpb3VzX3JpZ2h0X2NvdW50AAURX3ByZXZpb3VzX3RpbWVfbXMABQpfZWxhcHNlZF9zAAUOX3NwZWVkX3RpbWVzX3MABRhfbGVmdF9zcGVlZF9wb3NpdGlvbnNfbW0ABRlfcmlnaHRfc3BlZWRfcG9zaXRpb25zX21tAAUPX3NwZWVkX3dpbmRvd19zAAUQX2xlZnRfc3BlZWRfbW1fcwAFEV9yaWdodF9zcGVlZF9tbV9zAAUKX2hhc19yZXNldAAIAzAuMAgDNC4wCAYxMDAwLjAFImNhbGwgcmVzZXQocmF3KSBiZWZvcmUgdXBkYXRlKHJhdykACAMxLjAIAzIuMAUecmF3IG11c3QgYmUgYSBSYXdTZW5zb3JzIHZhbHVlAAUidGFyZ2V0IG11c3QgYmUgYSBXaGVlbFNwZWVkcyB2YWx1ZQAFJG1lYXN1cmVkIG11c3QgYmUgYSBXaGVlbFNwZWVkcyB2YWx1ZQAIBC0xLjCIHCASAUBMMj4ycovWgBACKgEbAxwCFgJZgBAEEAUqAhsGHAQWBBwFFgVZgBAHEAgQCRAKKgQbCxwHFgccCBYIHAkWCRwKFgpZgBAMEA0qAhsOHAwWDBwNFg1ZgBAPEBAqAhsRHA8WDxwQFhBZVDIAEBIRDDQDFhJUMgEQExENNAMWE1FjAoUMEC0SiAtAQIQPhhaEHYRFhBhkhAiEDoQTABFGFkcQEhZIIwAWSbAgAAEWFDIBFicyAhYvMgMWNzIEFjAyBRY0MgYWNTIHFjYRSjIINAEWKLBjCYdoKzAUS0wxgB8rIE0kJCQkJCUlJSUiJiUmJSUSTSUAsRUUsjYBWRICshMV9LITFvexGBeAsRgYgLEYGYCxGBqAsRgbgLEYHCMBsRgdKwCxGB4rALEYHysAsRggEk4jArITIfSyEyI0AiMD97EYIyMBsRgkIwGxGCVQsRgmUWOIYGo8J0xPgDUgJyYmJiYmJScnJyUlJCIjIiIiIiIiIiMjsBQosTYBWbETKbAYGLETKrAYGbETKbAYGrETKrAYG7ETK7AYHCMBsBgdIwErAbAYHiMBKwGwGB8jASsBsBggIwGwGCQjAbAYJVKwGCYSCLETKyMBIwEjASMBIwEjASMBsRMssRMtsRMuNAtjkwCqEGQvTE+AUiAnJUcjJ0gjJ0gjJ0gjJ0hLJiZGJyknJiRGI2ggI0YjRiVKJWxDImhgIyMjI7AUKLE2AVmwEyZDRxJQIwQ0AWWwFDCxEymwExjzsBMxEzI2AsKwFDCxEyqwExnzsBMxEzM2AsOwFDCxEymwExrzsBMxEzI2AsSwFDCxEyqwExvzsBMxEzM2AsUSELETK7ATHDQCxrETKbAYGrETKrAYG7ETK7AYHLYjAdhE3YCwVxMdtuVaGB2wFDS2NgHHtyMF2URKtLb3yLW298lCXbAUNbATHbKzNgNZsBQ2sBMfNgHIsBQ2sBMgNgHJsFcTJLe4sBMk8/TlWhgksFcTJbe5sBMl8/TlWhglQkMjAcYSCLETK7ays7S1sBMksBMlsRMssRMtsRMuNAtjiShrLDdMUTiAlyBsIyUgLSkrRk0pQiYoKyQSBRA4shA5gTSCAsIrAMOxX0s1xBJStBJTElQqAjQCRGUSUrQSVTQCQ1wSBBJUtDQBNAFEUbQjAdhES7MUOhJUtDQBNgFZQgkSVrM0AbLXREJRY7MUOzYAWRJWszQBgvbFElazNAGC+IHZRESztVVjs7WB81WztVXyIwb3Y4EAIwwwTFdYgK+xsvSwExf0Y4IYKhI0TFmAsiBJJiOwEzETIiMD98KyIwHZREMjBWOxsrHy92OGOLgEIDVMWltcgLogKSkpJmIgKSmwEx4UOrE2AVmwEx8UOrI2AVmwEyAUOrM2AVmxsBMj88RCW7ATHhQ8gDYBWbATHxQ8gDYBWbATIBQ8gDYBWRJWsBMeNAGC2ERJsBMegVW02kMRUWOHEHIoNkxdgMggKCUjKigjIyYoIkgvJiMSVrATHjQBwrKC10RDIwFjEl6wEx40AbL3wxJesTQBsvfEIwHFIwHGsoBCXFfHsBMet1Wz88i1uLG3VbTz9OXFtri49OXGgeVYWtdDH1lZtiMB2URDIwFjtbb3Y4FIGQooT4DcKRJSsBIJNAJDRxJfIwc0AWVRY4IkABATiOFARGSEFBFGFkcQExZIKgAWSTIAFicyARYvMgIWPVFjA0AJCCdMgOZRY4ZIUygvTGBhgOkpJylHIyMjJUgjIyMlSBJSsRIKNAJDRxJfIwg0AWUSUrISCjQCQ0cSXyMJNAFlsBQ9sRM+shM+sBMxEz+wEzETQDYEw7AUPbETQbITQbATMRNCsBMxE0M2BMQSB7O0NAJjhGjRBCI9TGBhYmOA/SZDLSAjJEtDJrEjAdlEQyMBY7EjAdhERCMFQkIjCsW1s/SxtPTysBMxE0SxsvP08sYSD7awEzETRdGwEzETRTQDYw==`,Oe=`data:application/octet-stream;base64,TQYAHy0HQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfMi5weQAPBmNvcwAGc2luAAhtYXRoABxyZXF1aXJlX251bWJlcgAodWNzYl94cnAuX3ZhbGlkYXRpb24AGk1vdGlvbkNvbW1hbmQACFBvc2UAFldoZWVsU3BlZWRzACB1Y3NiX3hycC5yZWNvcmRzACpEaWZmZXJlbnRpYWxEcml2ZUJhc2UAGE9kb21ldHJ5QmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAIkRpZmZlcmVudGlhbERyaXZlABBPZG9tZXRyeQAYd2hlZWxfc3BlZWRzAAxjb25maWcAHHRyYWNrX3dpZHRoX21tAB50dXJuX3JhdGVfcmFkX3MAJGZvcndhcmRfc3BlZWRfbW1fcwAjCl9wb3NlAAhwb3NlAApyZXNldACCPyJsZWZ0X2luY3JlbWVudF9tbQAkcmlnaHRfaW5jcmVtZW50X21tABZoZWFkaW5nX3JhZAAIeF9tbQAIeV9tbQAvLTUSX19zbG90c19fABBwcm9wZXJ0eQCCEw5jb21tYW5kAIFDbQuCNWUYaW5pdGlhbF9wb3NlAHMKAQUFX3Bvc2UABR9jb21tYW5kIG11c3QgYmUgYSBNb3Rpb25Db21tYW5kAAgDMi4wBSxjYWxsIHJlc2V0KGluaXRpYWxfcG9zZSkgYmVmb3JlIHJlYWRpbmcgcG9zZQAFG2luaXRpYWxfcG9zZSBtdXN0IGJlIGEgUG9zZQAFJmNhbGwgcmVzZXQoaW5pdGlhbF9wb3NlKSBiZWZvcmUgdXBkYXRlAAgFMWUtMDmGVBgQAUBSLDhyixCAEAIQAyoCGwQcAhYCHAMWA1mAEAUqARsGHAUWBVmAEAcQCBAJKgMbChwHFgccCBYIHAkWCVmAEAsQDCoCGw0cCxYLHAwWDFlUMgAQDhELNAMWDlQyARAPEQw0AxYPUWMCgUwACg6ICkBEER8WIBAOFiEqABYiMgAWEFFjAYNYOhYQJCWADyknKSYiJRImsRIHNAJDRxInIwE0AWWwExETEiMC98KxExOy9MMSCbETFLPzsRMUs/I0AmODFBAXD4gaQERmIGhgZGAAER8WIBAPFiEjABYisCAAARYVESMyATQBFhcyAhYYMgMWGbBjBIFQKw4VKCQRgB8rEiklALEVFbI2AVlRsRgWUWOBUBEMFySAJCcnsBMWUd5ERxIqIwM0AWWwExZjghAiEBgkK4ApKSckEiaxEgg0AkNHEicjBDQBZbGwGBawExZjiyiDECoZJBobgC8nJygoJyomKi5QJCQ0NCywExZR3kRHEiojBTQBZRIFEBqxNALDEgUQG7I0AsSztPIjAvfFtLPzsBMRExL3xrATFhMcxxIstjQBIwbXRF6wExYTHbUSArc0AfTyyLATFhMetRIDtzQB9PLJQnC1tvfKt7byy7ATFhMduhIDuzQBEgO3NAHz9PLIsBMWEx66EgK7NAESArc0AfP088kSCLi5t7byNAOwGBawExZj`,V=`data:application/octet-stream;base64,TQYAHzUGQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfMy5weQAPGk1vdGlvbkNvbW1hbmQAHE5hdmlnYXRpb25Hb2FsAAhQb3NlABhTVE9QX0NPTU1BTkQAIHVjc2JfeHJwLnJlY29yZHMAME5hdmlnYXRpb25Db250cm9sbGVyQmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAHmJlYXJpbmdfdG9fZ29hbAAKY2xhbXAAIGRpc3RhbmNlX3RvX2dvYWwAHHdyYXBfYW5nbGVfcmFkABx1Y3NiX3hycC51dGlscwAoTmF2aWdhdGlvbkNvbnRyb2xsZXIAIwxfZ29hbHMADF9pbmRleAAQY29tcGxldGUACl9tb2RlAIIlCHR1cm4AGGN1cnJlbnRfZ29hbAAWaXNfY29tcGxldGUAgj8MY29uZmlnACpwb3NpdGlvbl90b2xlcmFuY2VfbW0AFmhlYWRpbmdfcmFkACpoZWFkaW5nX3RvbGVyYW5jZV9yYWQACmFsaWduAB50dXJuX3JhdGVfcmFkX3MACmRyaXZlACZyZWFsaWduX2hlYWRpbmdfcmFkAChzbG93ZG93bl9kaXN0YW5jZV9tbQAmYXBwcm9hY2hfc3BlZWRfbW1fcwAiY3J1aXNlX3NwZWVkX21tX3MAEjxnZW5leHByPgAvLTUSX19zbG90c19fAAuCE4I1CmdvYWxzAIFDgjuBWW13gVcIcG9zZQBzCgMFBl9nb2FscwAFBl9pbmRleAAFBV9tb2RlAAUdZ29hbHMgbXVzdCBiZSBhIHR1cGxlIG9yIGxpc3QABS1nb2FscyBtdXN0IGNvbnRhaW4gb25seSBOYXZpZ2F0aW9uR29hbCB2YWx1ZXMABRNwb3NlIG11c3QgYmUgYSBQb3NlAAgDMC4wCAMyLjCFZCAKAUA+LH6AEAIQAxAEEAUqBBsGHAIWAhwDFgMcBBYEHAUWBVmAEAcqARsIHAcWB1mAEAkQChALEAwqBBsNHAkWCRwKFgocCxYLHAwWDFlUMgAQDhEHNAMWDlFjAYMcCBkOiAhARGZghApkQGQAESUWJhAOFicjABYosCAAARYPMgEWFDICFhYyAxYXMgQWGLBjBYIwKxIPKSoZgA0rJSQSKyUAsRUPsjYBWSoAsRgQgLEYERASsRgTUWOFDDIYFCosgBMtJyYsJyQkEi2xEi4SLyoCNAJDRxIwIwE0AWUSLrE0AcISMTIAsl40ATQBREcSMCMCNAFlsrAYEICwGBGyREQQFUJCEBKwGBNRYwGBYMFACCQpgBZTsFNTSw3BEi2xEgM0AtNnWUIxUWOBeBkMFiqAHS0isBMREjKwExA0AdtEQlFjsBMQsBMRVWNwEQgXKoAisBQWNgBR3mOUMFpaGCozgCUpJyAmJSVDJyooLC0lIiJVKSVDLygtJSIiICxJJy0lQiAgMEYiJCZIEi2xEgQ0AkNHEjAjAzQBZbAUFjYAwrJR3kRIEBKwGBMSBWMSC7GyNALDs7ATGRMa2kTQgLITG1He00R3EgyyExuxExvzNAHEEjS0NAGwExkTHNhEXhAdsBgTEgIjBLSA2ERHsBMZEx5CRrATGRMe0TQCY7BXExGB5VoYERAVsBgTQo6BEgwSCbGyNAKxExvzNAHFsBMTEB/cRHISNLU0AbATGRMc2EReEBWwGBMSAiMEtYDYREewExkTHkJGsBMZEx7RNAJjEB+wGBNCVBI0tTQBsBMZEyDbREcQFbAYE0Jxs7ATGRMh2kRHsBMZEyJCRbATGRMjxhIKIwW19LATGRMe0bATGRMeNAPHEgK2tzQCY0L7fVFj`,ke=`data:application/octet-stream;base64,TQYAHxsCQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNC5weQAPGk9jY3VwYW5jeUdyaWQAGnVjc2JfeHJwLm1hcHMAEEdyaWRDZWxsABBHcmlkUGF0aAAgdWNzYl94cnAucmVjb3JkcwAeR3JpZFBsYW5uZXJCYXNlACh1Y3NiX3hycC5zdHVkZW50X2FwaQAWR3JpZFBsYW5uZXIACHBsYW4AFGlzX2Jsb2NrZWQAEm5laWdoYm9ycwB5ggcvLTUSX19zbG90c19fAIITCGdyaWQAgiUIZ29hbACBQ22CO4FXBR1ncmlkIG11c3QgYmUgYW4gT2NjdXBhbmN5R3JpZAAFLnN0YXJ0IGFuZCBnb2FsIG11c3QgYmUgR3JpZENlbGwgdmFsdWVzIG9yIE5vbmUAg3QYCgFALDJsgBACKgEbAxwCFgJZgBAEEAUqAhsGHAQWBBwFFgVZgBAHKgEbCBwHFgdZVDIAEAkRBzQDFglRYwGBTAAKCYgIQEQRDxYQEAkWESoAFhIyABYKUWMBjkCQFEQKExQVFoANKScqIjInMCIlSCQiJiMkJColIiQlJCIyJio0EhexEgI0AkNHEhgjADQBZbJR3kNFs1HeREJRYxIXshIENAJESRIXsxIENAJDRxIYIwE0AWWxFAuyNgFDSLEUC7M2AURCUWOys9lESBIFsioBNAFjsisBxIDFLAFRsmLGQtSAtLVVx7WB5cWxFAy3NgFfS0PIuLbdREJCNre2uFa4s9lEaLMrAclCS7kUDba5f1VVNgFZuX9VstxDLrkUDjYAWRIFEhm5NAE0AWO0FA24NgFZQrt/tRIatDQB10Oif1Fj`,H=`data:application/octet-stream;base64,TQYAHx0GQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNi5weQAPEGlzZmluaXRlAAhzcXJ0AAhtYXRoADJSYW5nZVNhZmV0eUNvbnRyb2xsZXJCYXNlACh1Y3NiX3hycC5zdHVkZW50X2FwaQAqUmFuZ2VTYWZldHlDb250cm9sbGVyAII/KHJlcXVlc3RlZF9zcGVlZF9tbV9zACZtZWFzdXJlZF9zcGVlZF9tbV9zACRtYXhpbXVtX3NwZWVkX21tX3MAHHN0b3BfbWFyZ2luX21tAB5yZXNwb25zZV90aW1lX3MANG1pbmltdW1fZGVjZWxlcmF0aW9uX21tX3MyAC8tNRJfX3Nsb3RzX18AghMQcmFuZ2VfbW0AgUN9gT0KZmxvYXQAbW8GbWluAAZtYXgABRAgbXVzdCBiZSBudW1lcmljAAUPIG11c3QgYmUgZmluaXRlAAgDMC4wBSByYW5nZV9tbSBtdXN0IGJlIG51bWVyaWMgb3IgTm9uZQAFJHJhbmdlX21tIG11c3QgYmUgZmluaXRlIGFuZCBwb3NpdGl2ZQAIAzIuMIMMGAgBQFJsgBACEAMqAhsEHAIWAhwDFgNZgBAFKgEbBhwFFgVZVDIAEAcRBTQDFgdRYwGBTAAKB4gIQEQRDxYQEAcWESoAFhIyABYIUWMBkWCgFEYIEwkKFIANICAlTjYpJyslIzYnLUczJiMsMCAlTCVDJCQhUrEQCSoCshAKKgIqAl9LNTACxMUSFbQSFjQCQ00SFbQSFxIYKgI0AkNJEhm1IwDyNAFlEgK0NAFDSRIatSMB8jQBZUIJs1HeREMjAmMSFbMSFjQCQ00SFbMSFxIYKgI0AkNHEhkjAzQBZRICszQBREazIwLaREcSGiMENAFlEhsSHBIYsTQBIwI0ArATCzQCxrYjAtlEQyMCYxIcEhiyNAEjAjQCxxIcEhizNAGwEwzzIwI0Asi3sBMN9Le39CMFsBMO9Pfyybi52kRDIwJjsBMOyrATDcu6EgO7u/QjBbj0uvfyNAG78/TMEhu2Ehy8IwI0AjQCYw==`,Ae=`data:application/octet-stream;base64,TQYAHy4IQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfNy5weQAPEGlzZmluaXRlAAhtYXRoAAhQb3NlACB1Y3NiX3hycC5yZWNvcmRzACJQb3NlQ29ycmVjdG9yQmFzZQAodWNzYl94cnAuc3R1ZGVudF9hcGkAGlBvc2VDb3JyZWN0b3IAIxhfeF9vZmZzZXRfbW0AGF95X29mZnNldF9tbQAMX3JlYWR5ABpfcmVxdWlyZV9wb3NlABJfZGlzdGFuY2UACnJlc2V0ABxjb3JyZWN0ZWRfcG9zZQAIeF9tbQAIeV9tbQAWaGVhZGluZ19yYWQAEm9ic2VydmVfeAAQcmFuZ2VfbW0AEHBvc2l0aXZlABJ3YWxsX3hfbW0AMHNlbnNvcl9mb3J3YXJkX29mZnNldF9tbQASb2JzZXJ2ZV95ABJ3YWxsX3lfbW0ALy01El9fc2xvdHNfXwCCKYITCHBvc2UAgUNtgkUIbmFtZQB9gT0KZmxvYXQAbxByYXdfcG9zZQBlImZhY2luZ19wb3NpdGl2ZV94ACJmYWNpbmdfcG9zaXRpdmVfeQAKAwUMX3hfb2Zmc2V0X21tAAUMX3lfb2Zmc2V0X21tAAUGX3JlYWR5AAgDMC4wBRdyYXdfcG9zZSBtdXN0IGJlIGEgUG9zZQAFECBtdXN0IGJlIG51bWVyaWMABR0gaXMgb3V0c2lkZSBpdHMgYWxsb3dlZCByYW5nZQAFHHJlc2V0KCkgbXVzdCBiZSBjYWxsZWQgZmlyc3QABSFmYWNpbmdfcG9zaXRpdmVfeCBtdXN0IGJlIEJvb2xlYW4ABSFmYWNpbmdfcG9zaXRpdmVfeSBtdXN0IGJlIEJvb2xlYW4Ag0QYCgFATCxsgBACKgEbAxwCFgJZgBAEKgEbBRwEFgRZgBAGKgEbBxwGFgZZVDIAEAgRBjQDFghRYwGETBAiCIgJQERkYGhAjAmEB4QKhBERGxYcEAgWHSMAFh4yABYJER8yATQBFg0RH1AqAVMzAjQBFg4yAxYPMgQWEDIFFhQyBhYZUWMHghgqEAkgGIAOKSUlEgYUCbCxNgJZIwGwGAojAbAYC1CwGAxRY4FIGQoNIYAVKRIisBIENAJDRxIjIwI0AWVRY4RwswEWDiQlFoAaNikmMCkSIrASJjQCQ00SIrASJxIoKgI0AkNJEiOxIwPyNAFlEiiwNAHAEgKwNAFESbJET7AjAdpESRIpsSME8jQBZbBjghAiEg8gKoAiJyUlJLAUDbE2AVkjAbAYCiMBsBgLUrAYDLFjgzAqFhAgKoApJyUnIicnsBQNsTYBWbATDENHEisjBTQBZRIEsRMRsBMK8rETErATC/KxExM0A2OHCOEEKBQgKhUXLIAzJyUnKSctKSYgSEQosBQNsTYBWbATDENHEisjBTQBZRIitBImNAJDRxIjIwY0AWWwFA6yEBUQFlI2ggLCsBQOsxAXNgLDsrATGPLFtERFs7XzQkOztfLGtrETEfOwGAqwFBCxNgFjhwjhBCgZICoVGi2ARCclJyknLSkmIEhEKLAUDbE2AVmwEwxDRxIrIwU0AWUSIrQSJjQCQ0cSIyMHNAFlsBQOshAVEBZSNoICwrAUDrMQGjYCw7KwExjyxbRERbO180JDs7XyxraxExLzsBgLsBQQsTYBYw==`,U=`data:application/octet-stream;base64,TQYAHyUMQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfOC5weQAPEGlzZmluaXRlAAhtYXRoACpWaXNpdE9yZGVyUGxhbm5lckJhc2UAKHVjc2JfeHJwLnN0dWRlbnRfYXBpACJWaXNpdE9yZGVyUGxhbm5lcgAaX3Blcm11dGF0aW9ucwB5DF9pbmRleAAIcGxhbgAWc3RhcnRfaW5kZXgAGGZpbmlzaF9pbmRleAASPGdlbmV4cHI+AC8tNRJfX3Nsb3RzX18AgimCR4FXgjuCRQhzaXplAAhuYW1lAIFDfYE9bW+CExRjb3N0X3RhYmxlACByZXF1aXJlZF9pbmRpY2VzAIFZCmZsb2F0AIIZCwoBCgAFEyBtdXN0IGJlIGFuIGludGVnZXIABRogaXMgb3V0c2lkZSB0aGUgY29zdCB0YWJsZQAFK2Nvc3RfdGFibGUgbXVzdCBiZSBhIG5vbmVtcHR5IHR1cGxlIG9yIGxpc3QABRljb3N0X3RhYmxlIG11c3QgYmUgc3F1YXJlAAUjcm91dGUgY29zdHMgbXVzdCBiZSBudW1lcmljIG9yIE5vbmUACAMwLjAFKnJvdXRlIGNvc3RzIG11c3QgYmUgZmluaXRlIGFuZCBub25uZWdhdGl2ZQAFKHJlcXVpcmVkX2luZGljZXMgbXVzdCBiZSBhIHR1cGxlIG9yIGxpc3QABSxyZXF1aXJlZF9pbmRpY2VzIG11c3Qgbm90IGNvbnRhaW4gZHVwbGljYXRlcwAFLnJlcXVpcmVkX2luZGljZXMgbXVzdCBleGNsdWRlIHN0YXJ0IGFuZCBmaW5pc2gABQ5yZXF1aXJlZCBpbmRleACCXBgIAUBMbIAQAioBGwMcAhYCWYAQBCoBGwUcBBYEWVQyABAGEQQ0AxYGUWMBgmwIEgaICEBEiAyICBEOFg8QBhYQKgAWERESMgA0ARYHERIyATQBFgkyAhYKUWMDhWB5GAcTgA4jIyMqJDArNrBDQyMAYysAwRIUsDQBgEJwV8KwslXDsFGyLgJVsLKB8lEuAlXyxBIGFAe0NgFfSw7FsRQIsyoBtfI2AVlCMIHlWFrXQwtZWRIVsTQBY4NgKxQJFhcYgBoyKSopEhmwEho0AkNJEhmwEhs0AkNJEhyyIwHyNAFlsIDXQ0WwsdtESRIdsiMC8jQBZbBjnGyBJO4BCh4fCyAMgCEwJycjJjcnIyUlKTYnLUcuLkYsLC0nbzEnKkciIisqJCMtLyYjIjAkIyAlJksiJgAUEhmxEhUSISoCNAJEQ7FDRxIcIwM0AWUSFLE0AScUKwDFsV9LggHGEhm2EhUSISoCNAJEShIUtjQBJRTcREcSHSMENAFlKwDHtl9LTsi4Ud5ESbcUCFE2AVlCfBIZuBIaNAJDTRIZuBIbEiIqAjQCQ0cSHCMFNAFlEgK4NAFERrgjBtdERxIdIwc0AWW3FAgSIrg0ATYBWUKwf7UUCBIVtzQBNgFZQvt+EhW1NAHFJQAUCbIlFBALNgPJJQAUCbQlFBAMNgPKEhmzEhUSISoCNAJDRxIcIwg0AWUSFbAkFCAAArNeNAE0AcsSFBIjuzQBNAESFLs0AdxERxIdIwk0AWW5u91DRbq73URHEh0jCjQBZVHMUc0lABQHuzYBX0tuzrkqAb7yuioB8s8jBiYQUiYREhS/NAGB84BCZlcmErW/JBJVVb8kEoHyVVUmEyQTUd5ERVAmEUJOJBAkE+UmEIHlWFrXQxVZWSQRQ0NCrn+9Ud5DUSQQvddDSyQQvdlESr+810RFv8wkEM1CkH+8YwGCCONADA0kJCSAOlOyU1NLEMMlABQJsyUBIws2A2dZQi5RYw==`,je=`data:application/octet-stream;base64,TQYAHx8JQnVjc2JfeHJwX3JlZmVyZW5jZS9jaGFsbGVuZ2VfOS5weQAPIExpbmVGb2xsb3dlckJhc2UAGk1vdGlvbkNvbW1hbmQAEHVjc2JfeHJwABhMaW5lRm9sbG93ZXIAgj8IbGVmdAAKcmlnaHQAFGxpbmVfZXJyb3IAHGludGVncmFsX2Vycm9yABBzZXR0aW5ncwAUbGFzdF9lcnJvcgAQa3BfcmFkX3MAEmtpX3JhZF9zMgAMa2RfcmFkAC8tNRJfX3Nsb3RzX18AghMWcmVmbGVjdGFuY2UACGR0X3MAb4FDgT0KZmxvYXQAfQZtaW4ABm1heABzBRdyZWZsZWN0YW5jZSBpcyByZXF1aXJlZAAIAzAuMAUYZHRfcyBtdXN0IGJlIG5vbm5lZ2F0aXZlAAUQaW50ZWdyYWxfbGltaXRfcwAFF21heGltdW1fdHVybl9yYXRlX3JhZF9zAAgDMS4wBQ10dXJuX3Nsb3dkb3duAAURY3J1aXNlX3NwZWVkX21tX3MABRJtaW5pbXVtX3NwZWVkX21tX3MAgiQYBgFAcoAQAhADKgIbBBwCFgIcAxYDWVQyABAFEQI0AxYFUWMBgUwACgVoYEBEERAWERAFFhIqABYTMgAWBlFjAY9AYzoGFBUWgAslJyAtKUZHKi0nMTRGICorSictKEopLLFR3kRHEhcjADQBZRIYshIZEhoqAjQCRE8SGLISGzQCQ0ayIwHXREcSFyMCNAFlsRMHsRMI87AYCbBXEwqwEwmy9OVaGAqwEwsjA1XDEhwSHbATCrPRNAKzNAKwGAqyIwHZREQjAUJJsBMJsBMM87L3xLATCbAYDLATCxANVbATCfSwEwsQDlWwEwr08rATCxAPVbT08sWwEwsjBFXGEhwSHbW20TQCtjQCxSMFsBMLIwZVEh61NAG29/Tzx7ATCyMHVbf0yBIduLATCyMIVTQCyBIDuLU0AmM=`;const W=Object.assign({"../../../vendor/current/ucsb_xrp/__init__.py":fe,"../../../vendor/current/ucsb_xrp/_hardware.py":pe,"../../../vendor/current/ucsb_xrp/_range.py":me,"../../../vendor/current/ucsb_xrp/_run_control.py":he,"../../../vendor/current/ucsb_xrp/_telemetry.py":ge,"../../../vendor/current/ucsb_xrp/_validation.py":_e,"../../../vendor/current/ucsb_xrp/component_checks.py":ve,"../../../vendor/current/ucsb_xrp/config.py":ye,"../../../vendor/current/ucsb_xrp/live.py":be,"../../../vendor/current/ucsb_xrp/maps.py":xe,"../../../vendor/current/ucsb_xrp/mission.py":I,"../../../vendor/current/ucsb_xrp/records.py":L,"../../../vendor/current/ucsb_xrp/robot.py":R,"../../../vendor/current/ucsb_xrp/straight_line.py":z,"../../../vendor/current/ucsb_xrp/straight_trial.py":Se,"../../../vendor/current/ucsb_xrp/student_api.py":B,"../../../vendor/current/ucsb_xrp/utils.py":Ce,"../../../vendor/current/ucsb_xrp/world.py":we,"../../../vendor/current/ucsb_xrp/xrpbot.py":Te}),Me=Object.assign({"../../../vendor/current/reference_mpy/ucsb_xrp_reference/__init__.mpy":Ee,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_1.mpy":De,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_2.mpy":Oe,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_3.mpy":V,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_4.mpy":ke,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_6.mpy":H,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_7.mpy":Ae,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_8.mpy":U,"../../../vendor/current/reference_mpy/ucsb_xrp_reference/challenge_9.mpy":je}),G=`../../../vendor/current/`,K=Object.freeze(Object.fromEntries(Object.entries(W).map(([e,t])=>{if(!e.startsWith(G))throw Error(`Unexpected course package source '${e}'`);return[e.slice(24),t]})));if(!(`ucsb_xrp/__init__.py`in K))throw Error(`The canonical ucsb_xrp package was not bundled`);const Ne=Object.freeze(Object.fromEntries(Object.entries(Me).map(([e,t])=>{if(!e.startsWith(G))throw Error(`Unexpected reference artifact '${e}'`);return[e.slice(24),t]})));if(!(`reference_mpy/ucsb_xrp_reference/__init__.mpy`in Ne))throw Error(`The supplied reference package was not bundled`);function Pe(e){let t=e.files[`world.json`];return t===void 0?g:ne(t)}const q=/^[A-Za-z0-9._/-]+$/,J=new TextEncoder;var Fe=class extends Error{code;constructor(e,t){super(t),this.code=e,this.name=`PortableProjectError`}};function Y(e){throw new Fe(`invalid_project`,e)}function Ie(e){throw new Fe(`project_too_large`,e)}function Le(e){typeof e!=`string`&&Y(`Project file paths must be text`);let t=e.replaceAll(`\\`,`/`).replace(/^\/+|\/+$/g,``);return(t.length===0||t.split(`/`).some(e=>e===``||e===`.`||e===`..`))&&Y(`File path '${e}' is invalid. Use named folders without empty, '.' or '..' sections.`),t.length>160&&Y(`File path '${e}' has ${t.length} characters; XRP project paths may use at most 160.`),q.test(t)||Y(`File path '${e}' contains a character the XRP cannot store. Use letters, numbers, '-', '_', '.', and '/'.`),t}function X(e){(typeof e!=`object`||!e)&&Y(`The project is not a valid project object`),(typeof e.files!=`object`||e.files===null||Array.isArray(e.files))&&Y(`The project files are not a valid file collection`);let t=Object.entries(e.files);if(t.length===0&&Y(`This project has no files. Add a Python file, then try again.`),t.length>48){let e=t.length-48;Ie(`This project has ${t.length} files; an XRP project may contain at most 48. Remove or move ${e} file${e===1?``:`s`}, then try again.`)}let n=Le(e.entrypoint);n.endsWith(`.py`)||Y(`The main file must be a Python (.py) file`);let r=[],i=new Set,a=0;for(let[e,n]of t){let t=Le(e);i.has(t)&&Y(`Two project files resolve to '${t}'. Rename one of them, then try again.`),typeof n!=`string`&&Y(`Project file '${t}' must contain text`);let o=J.encode(n).byteLength;o>98304&&Ie(`File '${t}' uses ${o.toLocaleString(`en-US`)} bytes; each XRP project file may use at most ${98304 .toLocaleString(`en-US`)} bytes (96 KiB).`),a+=o,a>262144&&Ie(`The project files use ${a.toLocaleString(`en-US`)} bytes; an XRP project may use at most ${262144 .toLocaleString(`en-US`)} bytes (256 KiB).`),i.add(t),r.push([t,n])}return i.has(n)||Y(`The main file '${n}' is not in the project`),e.name!==void 0&&(typeof e.name!=`string`||e.name.trim().length===0)&&Y(`The project name must contain text`),{entrypoint:n,files:r,pythonPaths:r.map(([e])=>e).filter(e=>e.endsWith(`.py`)),totalBytes:a}}function Re(e){let t=X(e);return Pe(e),t}const ze=1e6,Be=1e6,Ve=/^[A-Za-z0-9._/-]+$/,He=/^\s*File\s+["']([^"']+)["'](?:,\s*line\s+(\d+)(?:,\s*in\s+.*)?)?\s*$/,Ue=/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt)):\s*(.*)$/,Z=/^(.+?\.py):(\d+)(?::(\d+|none|null))?:\s*(.*)$/i,We=/\u001b\[[0-?]*[ -/]*[@-~]/g;function Ge(e,t){if(e===void 0)return;let n=typeof e==`number`?e:Number.parseInt(e,10);if(!(!Number.isFinite(n)||n<1))return Math.min(Math.trunc(n),t)}function Ke(e,t){return e.length<=t?e:`${e.slice(0,Math.max(0,t-13))}… [truncated]`}function qe(e){let t=e.replaceAll(`\r
`,`
`).replaceAll(`\r`,`
`).split(`
`).map(e=>Ke(e,2048));for(;t[0]===``;)t.shift();for(;t.at(-1)===``;)t.pop();if(t.length<=128)return t;let n=t.length-63-64;return[...t.slice(0,63),`… [${n} traceback lines omitted]`,...t.slice(-64)]}function Je(e){let t=e.trim().replaceAll(`\\`,`/`);if(!(t.startsWith(`<`)&&t.endsWith(`>`))){if(t.startsWith(`/project/`))t=t.slice(9);else if(t.startsWith(`project/`))t=t.slice(8);else if(t.startsWith(`./`))t=t.slice(2);else if(t.startsWith(`/`)||/^[A-Za-z]:\//.test(t))return;if(t=t.replace(/^\/+|\/+$/g,``),!(t.length===0||t.length>160||!Ve.test(t)||t.split(`/`).some(e=>e===``||e===`.`||e===`..`)))return t}}function Ye(e){if(!e)return;let t=new Set;for(let n of e){let e=Je(n);e&&t.add(e)}return t}function Xe(e,t){let n=Je(e);if(n&&!(t&&!t.has(n)))return n}function Ze(e){return e.map(e=>e.replace(We,``)).filter(e=>e.trim().length>0)}function Qe(e){return e.split(`
`).filter(e=>!/^\s*File "<stdin>", line \d+(?:, in .*)?\s*$/.test(e)).join(`
`).trim()}function $e(e,t={}){let n=Qe(String(e)),r=qe(n),i=Ze(r);if(i.length===0)return[];let a=Ye(t.projectPaths),o,s,c;for(let e of i){let t=He.exec(e);if(!t)continue;let n=Xe(t[1]??``,a);n&&(o=n,s=Ge(t[2],ze),c=1)}let l=t.code?.trim()||void 0,u=i.at(-1)?.trim()??n,d=Ue.exec(u);d&&(l=d[1],u=d[2]?.trim()||d[1]||u);let f=Z.exec(u);if(f){let e=Xe(f[1]??``,a);e&&(o=e,s=Ge(f[2],ze),c=Ge(f[3],Be)),u=f[4]?.trim()||u}if(o===void 0&&s===void 0&&d===null&&l===void 0)return[];let p=s===void 0?void 0:{line:s,column:c??1},m=p?{line:p.line,column:Math.min(Be,p.column+1)}:void 0;return[{source:`micropython`,phase:t.phase??`compile`,severity:`error`,...l?{code:Ke(l,80)}:{},message:Ke(u||`MicroPython reported an error`,2048),...o?{path:o}:{},...p?{start:p,end:m}:{},raw:r}]}const et=2147483647;Object.freeze({revision:0,parameters:[],watches:[],plots:[]});function tt(e,t){if(e.kind===`number`){if(typeof t!=`number`||!Number.isFinite(t)||e.minimum===void 0||e.maximum===void 0||e.step===void 0||e.step<=0||t<e.minimum||t>e.maximum)throw Error(`${e.label} is outside its declared range`);let n=Math.round((t-e.minimum)/e.step);if(n<0||n>et)throw Error(`${e.label} declares too many steps`);return n}if(e.kind===`toggle`){if(typeof t!=`boolean`)throw Error(`${e.label} must be on or off`);return+!!t}if(typeof t!=`string`||!e.options?.includes(t))throw Error(`${e.label} is not one of its declared choices`);return e.options.indexOf(t)}function nt(e){if(e.length>32768)throw Error(`Student runtime state is malformed`);let t=JSON.parse(e),n=t?.plots??[];if(typeof t!=`object`||!t||!Number.isInteger(t.revision)||(t.revision??-1)<0||!Array.isArray(t.parameters)||!Array.isArray(t.watches)||!Array.isArray(n)||t.parameters.length>16||t.watches.length>16||n.length>16||!t.parameters.every(st)||!t.watches.every(ct)||!n.every(lt)||new Set(t.parameters.map(e=>e.name)).size!==t.parameters.length||new Set(t.watches.map(e=>e.name)).size!==t.watches.length||new Set(n.map(e=>e.name)).size!==n.length)throw Error(`Student runtime state is malformed`);return{...t,plots:n}}function rt(e){return typeof e==`boolean`||typeof e==`string`&&e.length<=64||typeof e==`number`&&Number.isFinite(e)}function it(e){return typeof e==`string`&&e.length>0&&e.length<=80}function at(e){return typeof e==`string`&&e.length>0&&e.length<=32&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)}function ot(e){return e===void 0||typeof e==`string`&&e.length<=24}function st(e){if(typeof e!=`object`||!e)return!1;let t=e;if(!at(t.name)||!it(t.label)||!ot(t.unit)||![`number`,`toggle`,`choice`].includes(t.kind??``)||!rt(t.value)||t.pendingValue!==void 0&&!rt(t.pendingValue)||t.kind===`number`&&(typeof t.minimum!=`number`||!Number.isFinite(t.minimum)||typeof t.maximum!=`number`||!Number.isFinite(t.maximum)||typeof t.step!=`number`||!Number.isFinite(t.step)||t.maximum<=t.minimum||t.step<=0||t.step>t.maximum-t.minimum||Math.round((t.maximum-t.minimum)/t.step)>et)||t.kind===`choice`&&(!Array.isArray(t.options)||t.options.length<2||t.options.length>6||t.options.some(e=>typeof e!=`string`||e.length>24)||new Set(t.options).size!==t.options.length))return!1;try{t.pendingValue!==void 0&&tt(t,t.pendingValue),tt(t,t.value)}catch{return!1}return!0}function ct(e){if(typeof e!=`object`||!e)return!1;let t=e;return at(t.name)&&it(t.label)&&ot(t.unit)&&rt(t.value)}function lt(e){if(typeof e!=`object`||!e)return!1;let t=e;return at(t.name)&&it(t.label)&&ot(t.unit)&&typeof t.value==`number`&&Number.isFinite(t.value)}const ut={"XRPLib/__init__.py":`"""Simulated hardware subset of XRPLib for the UCSB virtual XRP."""
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
`};var dt=class{fixedStepMs;now;originMs;latestMs=0;integratedSteps=0;constructor(e,t=()=>performance.now()){if(this.fixedStepMs=e,this.now=t,!Number.isFinite(e)||e<=0)throw Error(`The simulation step must be positive and finite`);this.originMs=t()}reset(){this.originMs=this.now(),this.latestMs=0,this.integratedSteps=0}elapsedMs(){return this.latestMs=Math.max(this.latestMs,this.now()-this.originMs,0),this.latestMs}advance(e,t=()=>!0){let n=Math.floor(this.elapsedMs()/this.fixedStepMs),r=this.integratedSteps;for(;this.integratedSteps<n;){if(!t())throw Error(`Virtual run cancelled`);let r=Math.min(n,this.integratedSteps+128);for(;this.integratedSteps<r;)e(),this.integratedSteps+=1}return this.integratedSteps-r}},ft=class{send;now;startedMs;lines=[];accepted=0;available=100;replenishedMs;omitted=0;reservedErrors=0;constructor(e,t=()=>performance.now()){this.send=e,this.now=t,this.startedMs=t(),this.replenishedMs=this.startedMs}write(e,t){let n=this.now();if(this.available=Math.min(100,this.available+Math.max(0,n-this.replenishedMs)/5),this.replenishedMs=n,n-this.startedMs>=100&&(this.flush(),this.startedMs=n,this.accepted=0,this.reservedErrors=0),this.available<1)if(e===`stderr`&&this.reservedErrors<4)this.reservedErrors+=1;else{this.omitted+=1;return}else--this.available;this.accepted+=1;let r=t.length>2048?`${t.slice(0,2048)} … [line truncated]`:t;this.lines.push({stream:e,line:r}),(this.accepted===1||e===`stderr`)&&this.flush()}flush(){(this.lines.length||this.omitted)&&this.send(this.lines,this.omitted),this.lines=[],this.omitted=0}};const pt=[`rawDeviceTimeMs`,`acquiredAtMs`,`acquisitionSeq`,`rangeAcquiredAtMs`,`rangeSeq`,`diagnosticsAcquiredAtMs`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`,`rawRangeMm`,`publishedAtMs`,`sampleDtMs`,`samplePeriodMs`,`overrunMs`];function mt(e,t){if(e==null)return;if(!Array.isArray(e)||e.length!==16||t.length>200)throw Error(`Invalid telemetry timing record`);let n={version:1,clockId:t,clockBasis:`first-acquisition`};if(pt.forEach((t,r)=>{let i=e[r];if(i!==null&&(typeof i!=`number`||!Number.isFinite(i)))throw Error(`Invalid timing ${t}`);if(i!==null&&![`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i<0)throw Error(`Negative timing ${t}`);if([`rawDeviceTimeMs`,`acquisitionSeq`,`rangeSeq`,`diagnosticsSeq`,`rawLeftEncoderCount`,`rawRightEncoderCount`].includes(t)&&i!==null&&!Number.isSafeInteger(i))throw Error(`Invalid integer ${t}`);n[t]=i}),![`raw`,`course`,`stop`].includes(e[14]))throw Error(`Invalid timing kind`);if(n.kind=e[14],typeof e[15]!=`boolean`)throw Error(`Invalid range sampling flag`);return n.rangeSampled=e[15],n}function ht(e){if(!Array.isArray(e)||e.length!==5)throw Error(`Invalid telemetry diagnostics`);let t=e=>{if(e===null)return null;if(!Array.isArray(e)||e.length!==3||e.some(e=>typeof e!=`number`||!Number.isFinite(e)))throw Error(`Invalid diagnostics vector`);return[...e]};if(e.slice(2,4).some(e=>e!==null&&(typeof e!=`number`||!Number.isFinite(e))))throw Error(`Invalid diagnostics value`);if(e[4]!==null&&(typeof e[4]!=`string`||e[4].length>512))throw Error(`Invalid diagnostics error`);return{accelerationMg:t(e[0]),angularRateMdps:t(e[1]),temperatureC:e[2],batteryV:e[3],sensorError:e[4]}}function gt(e,t){let n=JSON.parse(String(e));if(!n||typeof n!=`object`||Array.isArray(n))return mt(n,t);let r=n,i=mt(r.timing,t);return i?{...i,diagnostics:ht(r.diagnostics),...i.kind===`raw`?{plots:nt(JSON.stringify({revision:0,parameters:[],watches:[],plots:r.plots??[]})).plots}:{}}:void 0}function _t(e){let t=e?._module?.HEAPU8;if(!(t instanceof Uint8Array)||t.buffer.byteLength<1)throw Error(`Virtual runtime memory accounting is unavailable. Reload the app before running.`);return t.buffer.byteLength}function vt(e){return`Virtual run stopped at its memory limit (${Math.ceil(e/1048576)} MiB in use) to keep the browser responsive. Collected telemetry and notes remain available in the Monitor. Wait for its save status, then export data or start a new run. Use shorter runs or allocate fewer temporary objects.`}var yt=class{bytes;warning;stop;warningBytes;stopBytes;stopped=!1;peakBytes=0;warned=!1;constructor(e,t,n,r=100663296,i=201326592){if(this.bytes=e,this.warning=t,this.stop=n,this.warningBytes=r,this.stopBytes=i,!Number.isFinite(r)||!Number.isFinite(i)||r<=0||i<=r)throw Error(`Invalid virtual memory limits`)}check(){if(this.stopped)throw Error(vt(this.peakBytes));let e=this.bytes();if(!Number.isSafeInteger(e)||e<=0)throw Error(`Invalid virtual memory measurement`);if(this.peakBytes=Math.max(e,this.peakBytes),e>=this.stopBytes)throw this.stopped=!0,this.stop(e),Error(vt(e));!this.warned&&e>=this.warningBytes&&(this.warned=!0,this.warning(e))}};function Q(e){self.postMessage(e)}function bt(e,t,n){let r=t.split(`/`).slice(0,-1),i=``;for(let t of r)i+=`/${t}`,n.has(i)||(e.mkdir(i),n.add(i))}function xt(e){return e instanceof Error?Qe(e.message):Qe(String(e))}function St(e){return e instanceof Error?e.message:String(e)}function Ct(e){if(typeof e!=`object`||!e||!(`type`in e))return;let t=e.type;return typeof t==`string`&&t.trim().length>0?t.trim():void 0}function $(e){if(e==null)return null;let t=Number(e);return Number.isFinite(t)?t:null}self.onmessage=async e=>{let t=new ft((e,t)=>Q({type:`console-batch`,lines:e,omitted:t})),r=e.data.world??ae(e.data.scenario),i=new F(A(r));i.reset(r.initialPose);let a=0,o=0,s=new dt(i.config.fixedStepMs),c=`virtual:${crypto.randomUUID()}`,l=e.data.cancellationBuffer?new Int32Array(e.data.cancellationBuffer):null,u=e.data.liveParameterBuffer!==void 0,d=e.data.liveParameterBuffer?new Int32Array(e.data.liveParameterBuffer):new Int32Array(16),f=(e,t)=>{u?Atomics.store(d,e,t):d[e]=t},m=e=>u?Atomics.load(d,e):d[e],h=new Map,g=!1,_,v=()=>{g&&_?.check()},y=0,b=[],x=(e=`physics`)=>Q({type:`simulator-state`,state:i.state,observationKind:e}),S=()=>(v(),t.flush(),s.advance(()=>i.step(),()=>!l||Atomics.load(l,0)===0)>0&&x(),i.state);try{let r=`unknown`,l=await n({heapsize:2097152,url:p,stdout:n=>(v(),e.data.mode===`run`?t.write(`stdout`,n):Q({type:`console`,stream:`stdout`,line:n})),stderr:n=>(v(),e.data.mode===`run`?t.write(`stderr`,n):Q({type:`console`,stream:`stderr`,line:n}))});_t(l),_=new yt(()=>_t(l),e=>Q({type:`console`,stream:`stderr`,line:`Virtual run memory is ${Math.ceil(e/1024/1024)} MiB and rising. Finish this run and save your results; a new run starts with fresh runtime memory.`}),e=>{i.stop(),x(`stop`),t.flush(),Q({type:`error`,detail:vt(e),stage:`run`,reason:`memory-limit`})}),l.registerJsModule(`xrp_sim_bridge`,{set_motor_effort(e,t){S(),Q({type:`effort`,side:e,effort:t}),i.setMotorEffort(e,t),x(`actuator`)},get_encoder_count(e){let t=S();return e===`left`?t.leftEncoderCount-a:t.rightEncoderCount-o},reset_encoder(e){let t=S();e===`left`?a=t.leftEncoderCount:o=t.rightEncoderCount},get_range_mm(){return S().rangeMm},get_reflectance(e){let t=S();return e===`left`?t.leftReflectance:t.rightReflectance},is_button_pressed(){return S().buttonPressed},get_acceleration_mg(){return S().accelerationMg},get_angular_rate_mdps(){return S().angularRateMdps},get_temperature_c(){return S().temperatureC},get_battery_v(){return S().batteryV},advance_simulator(){S()},program_time_ms(){return v(),s.elapsedMs()},set_runtime_version(e){r=String(e)},register_live_parameter(e,t){let n=JSON.parse(String(e));if(typeof n.name!=`string`)throw Error(`Live parameter descriptor has no name`);let r=h.get(n.name);if(r!==void 0)return r;let i=h.size;if(i>=16)throw Error(`Too many live parameters`);return h.set(n.name,i),f(i,Number(t)),i},read_live_parameter(e){if(e<0||e>=h.size)throw Error(`Live parameter slot is unavailable`);return m(Number(e))},publish_runtime_state(e){Q({type:`runtime-state`,state:nt(String(e)),slots:Object.fromEntries(h)})},publish_course_state(e,t,n,r,i,a,o,l,u,d,f,p,m){let h=$(e),g=$(t),_=$(n),v=$(r),b=$(i),x=$(a),S=$(o);h!==null&&g!==null&&_!==null&&v!==null&&b!==null&&x!==null&&S!==null&&Q({type:`course-state`,state:{publicationSeq:y++,publishedAtMs:s.elapsedMs(),timing:m===void 0?void 0:gt(m,c),estimatedXmm:h,estimatedYmm:g,estimatedHeadingRad:_,measuredLeftWheelSpeedMmS:v,measuredRightWheelSpeedMmS:b,measuredLeftWheelDistanceMm:x,measuredRightWheelDistanceMm:S,requestedForwardSpeedMmS:$(l),requestedTurnRateRadS:$(u),targetLeftWheelSpeedMmS:$(d),targetRightWheelSpeedMmS:$(f),plotValues:p===void 0?[]:nt(`{"revision":0,"parameters":[],"watches":[],"plots":${String(p)}}`).plots}})},publish_sensor_sample(e){let t=gt(e,c);t&&Q({type:`sensor-acquisition`,timing:t})}});let u=new Set([`/`]),d={...ut,...K};for(let[e,t]of Object.entries(d)){let n=e;bt(l.FS,n,u),l.FS.writeFile(`/${n}`,t)}for(let[e,t]of Object.entries(Ne)){let n=e.replace(/^reference_mpy\//,``);bt(l.FS,n,u);let r=await fetch(t);if(!r.ok)throw Error(`Reference artifact could not be loaded: ${n}`);l.FS.writeFile(`/${n}`,new Uint8Array(await r.arrayBuffer()))}l.runPython(`
import xrp_sim_bridge
xrp_sim_bridge.set_runtime_version(
    ".".join(
        str(part)
        for part in __import__("sys").implementation.version[:3]
    )
)
`),Q({type:`runtime-ready`,version:r});let C=Re(e.data.project),w=C.pythonPaths.map(e=>`/project/${e}`);b=C.pythonPaths,l.FS.mkdir(`/project`),u.add(`/project`);for(let[e,t]of C.files)bt(l.FS,`project/${e}`,u),l.FS.writeFile(`/project/${e}`,t);if(l.globals.set(`__ucsb_check_paths`,w),l.runPython(`
for __ucsb_path in __ucsb_check_paths:
    compile(open(__ucsb_path).read(), __ucsb_path, "exec")
`),l.globals.delete(`__ucsb_check_paths`),e.data.mode===`check`){Q({type:`check-complete`,detail:`${w.length} Python file${w.length===1?``:`s`} compiled with MicroPython ${r}`,diagnostics:[]});return}if(e.data.mode===`test`){let e=C.entrypoint;g=!0,l.runPython(`
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
`),Q({type:`test-complete`,detail:`Component checks completed with MicroPython ${r}`});return}Q({type:`compile-complete`,detail:`${w.length} Python file${w.length===1?``:`s`} compiled with MicroPython ${r}`,diagnostics:[]}),x(`initial`),s.reset();let T=C.entrypoint;g=!0,l.runPython(`
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
__ucsb_entrypoint = "/project/${T}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`),S(),i.stop(),x(`stop`),t.flush(),Q({type:`run-complete`})}catch(e){if(t.flush(),i.stop(),x(`stop`),_?.stopped)return;let n=St(e),r=xt(e);Q({type:`error`,detail:r,rawDetail:n,stage:g?`run`:`compile`,diagnostics:$e(r,{phase:g?`runtime`:`compile`,code:Ct(e),projectPaths:b})})}};