import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {adapter} from './lib/adapter';
import {databaseConfig} from './lib/database-config';
const config=databaseConfig();
export default defineConfig(config.provider==='postgresql'
 ? {schema:'prisma/schema.postgresql.prisma',engine:'classic',datasource:{url:process.env.DATABASE_URL_UNPOOLED||config.url}}
 : {schema:'prisma/schema.prisma',experimental:{adapter:true},engine:'js',adapter:async()=>adapter()});
