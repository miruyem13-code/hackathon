import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { seedDemo } from '../src/lib/seed';
seedDemo(process.env.DEMO_PASSWORD!);
const require=createRequire(import.meta.url);
const server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3100'],{stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{server.kill(signal);});
server.on('exit',code=>process.exit(code??0));
