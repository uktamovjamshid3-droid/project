import {rmSync} from 'node:fs';
for(const suffix of ['', '-journal', '-wal', '-shm'])rmSync(new URL('../prisma/e2e.db'+suffix,import.meta.url),{force:true});
