import{copyFileSync,writeFileSync,existsSync}from'node:fs';import{resolve}from'node:path';
const root=resolve(import.meta.dirname,'..'),icons=resolve(root,'mobile-challenger/ios/App/App/Assets.xcassets/AppIcon.appiconset');
if(!existsSync(icons))throw Error('Create the separate challenger iOS project with cap add ios first.');
copyFileSync(resolve(root,'public/full/icon.png'),resolve(icons,'AppIcon-512@2x.png'));
writeFileSync(resolve(icons,'Contents.json'),JSON.stringify({images:[{filename:'AppIcon-512@2x.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2));
console.log('Installed the original challenger icon in its own iOS project.');
