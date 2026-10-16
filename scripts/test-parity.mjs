import './build-challenger.mjs';
import{spawnSync}from'node:child_process';
const r=spawnSync(process.execPath,['--test','tests/browser.test.mjs'],{stdio:'inherit',env:{...process.env,GAME_VARIANT:'challenger',PREVIEW_DIST:'1'}});
process.exit(r.status??1);
