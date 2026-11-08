import {PrismaBetterSQLite3} from '@prisma/adapter-better-sqlite3';
import {PrismaPg} from '@prisma/adapter-pg';
import {databaseConfig} from './database-config';
export const adapter = (url?:string) => {
 const config=databaseConfig({...process.env,DATABASE_URL:url||process.env.DATABASE_URL});
 return config.provider==='postgresql'
  ? new PrismaPg({connectionString:config.url,max:3})
  : new PrismaBetterSQLite3({url:config.url});
};
