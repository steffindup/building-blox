import './build-challenger.mjs';
import{start}from'../tests/devserver.mjs';
process.env.PREVIEW_DIST='1';
await start(Number(process.env.PORT)||8788);
console.log(`Full challenger: http://localhost:${process.env.PORT||8788}/challenger/`);
