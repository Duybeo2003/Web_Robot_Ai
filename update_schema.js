const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace(/provider\s*=\s*"mysql"/, 'provider = "postgresql"');
c = c.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
c = c.replace(/@db\.Text/g, '');
c = c.replace(/@db\.LongText/g, '');
fs.writeFileSync('prisma/schema.prisma', c);
