/**
 * サンプルのリポジトリ (before / after) から保存の置き場 (SQLite の metascope.db) を作り、表の中身を JSON に書き出す
 * (docs/plan.md 10 章 P3 の「サンプルのコードから SQLite の生成物を作る」)。
 *
 * 表の中身を目で確かめる材料と、保存の形のゴールデン (test/unit/store-golden.test.ts) に使う。
 * 単位の番号 (unit.id) は読み込みの順で変わるので、単位は「種類:場所」で表す。表の形を変えたら作り直す:
 *
 *   npx ttsx --noCheck docs/examples/analysis/scripts/store.ts
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RepositoryProcessor, closeAllStoreBackends } from '../../../../src/analyzer/unit';
import type { SqliteStoreBackend } from '../../../../src/analyzer/unit/storeSqlite';
import { SIDES, type Side, repositoryOf } from '../../paths';

const here = path.dirname(fileURLToPath(import.meta.url));

/** 書き出すファイル */
export const storeDumpFileOf = (side: Side): string =>
    path.join(here, '..', 'output', `store-${side}.json`);

export type StoreDump = {
    /** 表ごとの行の数 */
    counts: Record<string, number>;
    /** 単位 (種類:場所) → ノードの種類ごとの数 */
    nodeKinds: Record<string, Record<string, number>>;
    /** 定義の行 (単位・種類・名前・宣言の位置があるか) */
    symbols: string[];
    /** 本体ごとのメトリクス (<単位> | <本体> <名前>=<値> ...) */
    metrics: string[];
    /** 参照の行 (単位・member・種類・参照先・via) */
    references: string[];
};

type Row = Record<string, unknown>;

/** 置き場のデータベースの中身 */
export const storeDumpOf = (backend: SqliteStoreBackend): StoreDump => {
    const db = backend.db;
    const all = (sql: string) => db.prepare(sql).all() as Row[];
    // 単位の番号 → 種類:場所 (目録から)
    const manifest = JSON.parse(
        (db.prepare("SELECT manifest FROM snapshot WHERE name = 'before'").get() as Row)
            .manifest as string,
    ) as { units: { type: string; location: string; key: string }[] };
    const locationOf = new Map(manifest.units.map((u) => [u.key, `${u.type}:${u.location}`]));
    const unitOf = new Map(
        all('SELECT id, key FROM unit').map((r) => [
            r.id as number,
            locationOf.get(r.key as string)!,
        ]),
    );
    const counts = Object.fromEntries(
        [
            'unit',
            'unit_file',
            'source',
            'node',
            'span',
            'derived',
            'symbol',
            'reference',
            'metric',
        ].map((table) => [
            table,
            (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as Row).n as number,
        ]),
    );
    const nodeKinds: Record<string, Record<string, number>> = {};
    for (const row of all('SELECT unit_id, kind, count(*) AS n FROM node GROUP BY unit_id, kind')) {
        const unit = unitOf.get(row.unit_id as number)!;
        (nodeKinds[unit] ??= {})[row.kind as string] = row.n as number;
    }
    const sortedRecord = <T>(record: Record<string, T>) =>
        Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
    return {
        counts,
        nodeKinds: sortedRecord(
            Object.fromEntries(
                Object.entries(nodeKinds).map(([unit, kinds]) => [unit, sortedRecord(kinds)]),
            ),
        ),
        symbols: all('SELECT unit_id, kind, name, source_key FROM symbol ORDER BY unit_id, seq')
            .map(
                (r) =>
                    `${unitOf.get(r.unit_id as number)} | ${r.kind} ${r.name}${r.source_key ? '' : ' (位置なし)'}`,
            )
            .sort(),
        metrics: Object.entries(
            all(
                'SELECT unit_id, seq, body, name, value FROM metric ORDER BY unit_id, seq, name',
            ).reduce<Record<string, string[]>>((acc, r) => {
                const key = `${unitOf.get(r.unit_id as number)} | ${r.body as string}#${r.seq as number}`;
                (acc[key] ??= []).push(`${r.name as string}=${r.value as number}`);
                return acc;
            }, {}),
        )
            .map(([key, values]) => `${key.replace(/#\d+$/, '')} ${values.join(' ')}`)
            .sort(),
        references: [
            ...new Set(
                all(
                    'SELECT unit_id, member, kind, target_type, target, via FROM reference ORDER BY unit_id, seq',
                ).map(
                    (r) =>
                        `${unitOf.get(r.unit_id as number)} | ${r.member ?? ''} --${r.kind}--> ${r.target_type}:${r.target} (${r.via})`,
                ),
            ),
        ].sort(),
    };
};

/** サンプルのリポジトリの片方を一時の置き場に保存し、中身を返す */
export const currentStoreDumpOf = async (side: Side): Promise<StoreDump> => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'store-dump-'));
    try {
        const processor = await RepositoryProcessor.create(tmp, repositoryOf(side));
        await processor.save();
        const dump = storeDumpOf(processor.store.backend as SqliteStoreBackend);
        processor.store.close();
        return dump;
    } finally {
        closeAllStoreBackends();
        await fs.rm(tmp, { recursive: true, force: true });
    }
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    for (const side of SIDES) {
        const dump = await currentStoreDumpOf(side);
        await fs.writeFile(storeDumpFileOf(side), `${JSON.stringify(dump, null, 4)}\n`);
        console.log(`${side}: ${JSON.stringify(dump.counts)}`);
    }
}
