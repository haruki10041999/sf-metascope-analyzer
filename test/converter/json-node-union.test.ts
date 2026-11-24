import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// 系統ごとのノードの共用体 (src/analyzer/types/<系統>/node.ts) と、JsonType の型の確認の一覧
// (json-type-assertions.ts) に、JsonType で始まる型がすべて載っていることを、ソースの文字で確かめる。
// 名前が …Json で終わらない型 (FlowEdge など) も、`= JsonType<'…'>` などの形から見つける。
// 型の上の確かめ (kind が string に広がらないこと) は json-node-union-check.ts (npm run typecheck)

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../src/analyzer/types');
const LINEAGES = ['apex', 'lwc', 'metadata'] as const;

/** 中身だけの型 (ノードに展開して使う。木の中に単独では置かれない) */
const CONTENT_ONLY = /ContentJson$/;

const filesOf = (dir: string): string[] =>
    fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
            entry.isDirectory()
                ? filesOf(path.join(dir, entry.name))
                : entry.name.endsWith('.ts')
                  ? [path.join(dir, entry.name)]
                  : [],
        );

/** `export type X = JsonType<'…'>` / `= DeclarationJsonType<'…'>` などの形で宣言した型の名前 */
const jsonTypeNamesOf = (lineage: string): string[] =>
    filesOf(path.join(root, lineage))
        .filter((file) => path.basename(file) !== 'node.ts')
        .flatMap((file) => [
            ...fs.readFileSync(file, 'utf8').matchAll(/export type (\w+)\s*=\s*\w*JsonType<'/g),
        ])
        .map((match) => match[1] ?? '')
        .filter((name) => !CONTENT_ONLY.test(name));

const unionMembersOf = (lineage: string): Set<string> =>
    new Set(
        [
            ...fs
                .readFileSync(path.join(root, lineage, 'node.ts'), 'utf8')
                .matchAll(/\| J\.(\w+)/g),
        ].map((match) => match[1] ?? ''),
    );

const assertedNames = new Set(
    [
        ...fs
            .readFileSync(path.join(here, 'json-type-assertions.ts'), 'utf8')
            .matchAll(/AssertJsonType<T\.(\w+)>/g),
    ].map((match) => match[1] ?? ''),
);

describe('系統ごとのノードの共用体', () => {
    for (const lineage of LINEAGES) {
        it(`${lineage}: JsonType で始まる型がすべて node.ts と確認の一覧に載っている`, () => {
            const names = jsonTypeNamesOf(lineage);
            assert.ok(names.length > 0, `${lineage} の型が見つからない`);
            const members = unionMembersOf(lineage);
            assert.deepEqual(
                names.filter((name) => !members.has(name)),
                [],
                `types/${lineage}/node.ts の共用体にない型`,
            );
            assert.deepEqual(
                names.filter((name) => !assertedNames.has(name)),
                [],
                'json-type-assertions.ts にない型',
            );
        });

        it(`${lineage}: 共用体の型は確認の一覧に載っている`, () => {
            assert.deepEqual(
                [...unionMembersOf(lineage)].filter((name) => !assertedNames.has(name)),
                [],
            );
        });
    }
});
