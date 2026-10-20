import { mkdir, cp, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js', 'icon.svg', 'mahdi-alam-resume.pdf']) await copyFile(file, `dist/${file}`);
await cp('projects/search-lab/dist', 'dist/search-lab', { recursive: true });

await cp('projects/roadframe/wwwroot', 'dist/roadframe', { recursive: true });

await cp('projects/model-lab/wwwroot', 'dist/model-lab', { recursive: true });
await cp('projects/order-pipeline/wwwroot', 'dist/order-pipeline', { recursive: true });
