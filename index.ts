import { $ } from 'bun';
import html from 'bun-plugin-html';

await $`rm -rf ./build`;

await Bun.build({
    entrypoints: ['./src/index.html'],
    outdir: './build',
    plugins: [
        html(),
    ],
});