import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {adapter} from './lib/adapter';
import {databaseConfig} from './lib/database-config';
export default defineConfig({schema:databaseConfig().provider==='postgresql'?'prisma/schema.postgresql.prisma':'prisma/schema.prisma',experimental:{adapter:true},engine:'js',adapter:async()=>adapter(process.env.DATABASE_URL_UNPOOLED)});
