import { writeFileSync } from 'fs';
import { join } from 'path';
import { ERDBuilder } from 'typeorm-erd';
import { AppDataSource } from '../datasource/app.datasource';

const cleanPostgresTypes = (mermaid: string): string => {
  return mermaid
    .replace(/character varying/g, 'varchar')
    .replace(/timestamp without time zone/g, 'timestamp')
    .replace(/timestamp with time zone/g, 'timestamptz')
    .replace(/double precision/g, 'float8')
    .replace(/integer/g, 'int')
    .replace(/bigint/g, 'int8')
    .replace(/smallint/g, 'int2')
    .replace(/boolean/g, 'bool')
    .replace(/text/g, 'text');
};

const main = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const erd = new ERDBuilder('mermaid', AppDataSource);
  await erd.initialize();
  const mermaidErd = await erd.render();
  const cleanedErd = cleanPostgresTypes(mermaidErd);

  const readmeContent = `# Server

## Database ERD

\`\`\`mermaid
${cleanedErd}
\`\`\`
`;

  writeFileSync(join(process.cwd(), 'DB_ERD.md'), readmeContent);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
