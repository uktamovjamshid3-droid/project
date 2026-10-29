import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',workers:1,
 use:{baseURL:'http://localhost:3100',headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}},
 webServer:{command:'node scripts/reset-test-db.mjs && npm run db:push && npm run db:seed && npm run start -- --port 3100',url:'http://localhost:3100/api/products',reuseExistingServer:false,timeout:120000,env:{DATABASE_URL:'file:./e2e.db',APP_URL:'http://localhost:3100',GOOGLE_API_KEY:'',SMTP_URL:'',MAIL_FROM:''}}
});
