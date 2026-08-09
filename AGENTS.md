<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-defined-rules -->
# Database Deployment Rule
Whenever changes are made to prisma/schema.prisma in this project, remember to instruct the user to run `docker compose exec web npx prisma db push` to apply database schema changes in their production environment.
<!-- END:user-defined-rules -->
