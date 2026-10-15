import { mkdir, cp, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js', 'icon.svg', 'mahdi-alam-resume.pdf']) await copyFile(file, `dist/${file}`);
await cp('projects/search-lab/dist', 'dist/search-lab', { recursive: true });

await cp('projects/roadframe/wwwroot', 'dist/roadframe', { recursive: true });
