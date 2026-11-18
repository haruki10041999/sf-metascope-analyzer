// 流れの図 (処理フロー・シーケンス図・イベントの流れ) のゴールデン (docs/todo.md 3.2.1 の 7)。
// サンプル (docs/examples/repository/after) の apex.methodFlow・lwc.methodFlow・apex.callFlow・lwc.eventFlow を、
// 手元のパス (filePath) を除いた形で保存し、今の出力と比べる。make-golden.ts が保存し、golden.test.ts が比べる
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { repositoryOf } from '../../docs/examples/paths';
import {
    getApexCallFlows,
    getApexMethodFlows,
    getLwcEventFlow,
    getLwcMethodFlows,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

export const GOLDEN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden');

/** ゴールデンの名前 → 作り方 */
const OUTPUTS = {
    'apex-method-flows': getApexMethodFlows,
    'lwc-method-flows': getLwcMethodFlows,
    'apex-call-flows': getApexCallFlows,
    'lwc-event-flow': getLwcEventFlow,
} as const;

export type GoldenName = keyof typeof OUTPUTS;

export const GOLDEN_NAMES = Object.keys(OUTPUTS) as GoldenName[];

export const goldenFileOf = (name: GoldenName) => path.join(GOLDEN_DIR, `${name}.json`);

/** 手元のパスを除く (ゴールデンは手元のフォルダに依らない) */
const withoutFilePath = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutFilePath);
    if (typeof value !== 'object' || value === null) return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'filePath')
            .map(([key, child]) => [key, withoutFilePath(child)]),
    );
};

export const serializeGolden = (value: unknown) =>
    `${JSON.stringify(withoutFilePath(value), null, 2)}\n`;

/** サンプルの今の出力 (名前 → 値) */
export const goldenOutputs = async (): Promise<Record<GoldenName, unknown>> => {
    const repository = await Repository.load(new WorkingTree(repositoryOf('after')));
    const input = { after: snapshotOf(repository) };
    return Object.fromEntries(
        GOLDEN_NAMES.map((name) => [name, (OUTPUTS[name] as (i: typeof input) => unknown)(input)]),
    ) as Record<GoldenName, unknown>;
};
