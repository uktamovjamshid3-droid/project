import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {adapter} from './lib/adapter';
export default defineConfig({schema:'prisma/schema.prisma',experimental:{adapter:true},engine:'js',adapter:async()=>adapter()});
