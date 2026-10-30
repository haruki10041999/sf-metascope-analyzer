/**
 * サンプルを ApexWorker で解析し、本番用 (ApexParser.saveApexFile) で parser-store/<id>.msgpack に保存する。
 * 保存したものを読み戻し、直接解析した結果と一致するかを確認する。
 * 開発者用の JSON 出力は generate-parser-developer-output.ts で行う。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-ir/generate-parser-output.ts [--threads [--concurrency=N]]
 */
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { ApexParser } from '../../../src/analyzer/parser/Apex/parser';
import { ApexWorker } from '../../../src/analyzer/worker';

import { sampleUrl, samples } from './pipeline';

const storeDirectory = fileURLToPath(new URL('./parser-store/', import.meta.url));
const useThreads = process.argv.includes('--threads');
const concurrencyArg = process.argv.find((a) => a.startsWith('--concurrency='));
const concurrency = concurrencyArg ? Number(concurrencyArg.split('=')[1]) : undefined;

// 以前の出力を消しておく (エディタ等で開かれていてもよいよう、ディレクトリ自体は残す)
await mkdir(storeDirectory, { recursive: true });
for (const entry of await readdir(storeDirectory)) {
    await rm(join(storeDirectory, entry), { recursive: true, force: true });
}

const worker = new ApexWorker({
    outDir: storeDirectory,
    useThreads,
    ...(concurrency ? { concurrency } : {}),
});
try {
    const started = performance.now();
    const saved = await Promise.all(
        samples.map(({ file }) => worker.parseAndSave(fileURLToPath(sampleUrl(file)))),
    );
    console.log(
        `parseAndSave (threads=${useThreads}): ${Math.round(performance.now() - started)}ms`,
    );

    const loaded = new Map(
        (await worker.loadAll()).map((r) => {
            if (!r.ok) {
                throw r.error;
            }
            return [r.input, r.result];
        }),
    );

    for (const summary of saved) {
        // 保存したものを読み戻した結果が、直接解析した結果と一致するか
        const parsed = await ApexParser.parseApexClass(summary.filePath);
        const storeOk = isDeepStrictEqual(JSON.parse(JSON.stringify(parsed)), loaded.get(summary.id));

        console.log(
            `${summary.id}: dataType=${summary.dataType}, syntaxErrors=${summary.syntaxErrorCount}, ` +
                `store=${storeOk ? 'ok' : 'MISMATCH'}`,
        );
    }
} finally {
    await worker.close();
}
