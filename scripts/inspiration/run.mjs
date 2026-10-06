// Reuse this project's Vite host, client and crawl data. Never deploy this owner service to Pages.
import { createServer } from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:Number(process.env.INSPIRATION_PORT || 5173)}});
await server.listen();server.printUrls();
