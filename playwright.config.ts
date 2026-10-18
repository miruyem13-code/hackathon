import { defineConfig } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
process.env.ILMORA_E2E_PASSWORD ||= randomBytes(18).toString('base64url');
process.env.ILMORA_E2E_DATABASE ||= `./data/e2e-${randomUUID()}.sqlite`;
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:false,workers:1,timeout:90000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:3100',headless:true,viewport:{width:1440,height:1000},launchOptions:existsSync(chrome)?{executablePath:chrome}:{},screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:{command:'node --import tsx scripts/e2e-server.ts',url:'http://127.0.0.1:3100',reuseExistingServer:false,timeout:60000,env:{DATABASE_PATH:process.env.ILMORA_E2E_DATABASE,DEMO_PASSWORD:process.env.ILMORA_E2E_PASSWORD,APP_ORIGIN:'http://127.0.0.1:3100',NODE_ENV:'test',NODE_OPTIONS:'--require=./scripts/os-userinfo-fallback.cjs'}}
});
