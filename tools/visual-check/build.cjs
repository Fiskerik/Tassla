const esbuild = require(process.env.TASSLA_UI_TOOLS + '/node_modules/esbuild');
const fs = require('fs');
const path = require('path');
const root=path.resolve(__dirname, '../..');
const output=process.env.TASSLA_UI_OUTPUT || '/tmp/tassla-preview/site';
const toolRoot=process.env.TASSLA_UI_TOOLS;
const entry=process.env.TASSLA_UI_ENTRY ? path.resolve(root,process.env.TASSLA_UI_ENTRY) : path.join(__dirname,'app.tsx');
const defines={global:'globalThis',__DEV__:'true','process.env.NODE_ENV':'"development"'};
if(process.env.TASSLA_UI_REVIEW==='true') defines['process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT']='"true"';
const reactNativeWeb=toolRoot+'/node_modules/react-native-web/dist/index.js';
const reactNativeShim=path.join(output,'react-native-web-shim.js');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(reactNativeShim,`export * from ${JSON.stringify(reactNativeWeb)};\nimport * as ReactNativeWeb from ${JSON.stringify(reactNativeWeb)};\nexport const Alert = { ...ReactNativeWeb.Alert, alert(title, message, buttons = []) { globalThis.__tasslaAlertOptions = buttons.map(({ text }) => text); const queued = globalThis.__tasslaAlertActions ?? []; const choice = queued.shift(); globalThis.__tasslaAlertActions = queued; const selected = buttons.find(({ text }) => text === choice) ?? buttons[0]; selected?.onPress?.(); } };\n`);
esbuild.build({entryPoints:[entry],bundle:true,outdir:output,loader:{'.png':'file','.ttf':'file'},jsx:'automatic',platform:'browser',define:defines,nodePaths:[root+'/node_modules',toolRoot+'/node_modules'],alias:{'react-native':reactNativeShim,'react':root+'/node_modules/react','react-dom':toolRoot+'/node_modules/react-dom','@expo/vector-icons':path.join(__dirname,'icons.jsx'),'@expo/vector-icons/Ionicons':path.join(__dirname,'icons.jsx'),'expo-font':path.join(__dirname,'native.jsx'),'react-native-safe-area-context':path.join(__dirname,'native.jsx'),'expo-file-system':path.join(__dirname,'native.jsx'),'expo-crypto':path.join(__dirname,'native.jsx'),'expo-print':path.join(__dirname,'native.jsx'),'expo-sharing':path.join(__dirname,'native.jsx'),'expo-secure-store':path.join(__dirname,'native.jsx')}}).then(()=>{
 fs.copyFileSync(root+'/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf',path.join(output,'Ionicons.ttf'));
 const scriptName=path.basename(entry).replace(/\.[^.]+$/,'.js');
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Ionicons;src:url(Ionicons.ttf)}html,body,#root{margin:0;height:100%;background:#F7F1E7}body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}#root{display:flex;flex-direction:column}</style></head><body><div id="root"></div><script src="${scriptName}"></script></body></html>`);
});
