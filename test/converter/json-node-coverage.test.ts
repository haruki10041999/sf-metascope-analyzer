import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { SIDES, repositoryOf } from '../../docs/examples/paths';
import { ProjectTree, Repository, WorkingTree } from '../../src/analyzer/unit';

// すべての JSON の型を JsonType (kind と sourceKeys を持つノード) にそろえる作業の進み具合 (docs/plan.md 4 章の P1)。
// サンプルのリポジトリ (before / after) の解析結果をたどり、kind を持たないオブジェクトの場所を
// 「単位の種類: 親の kind.プロパティ」の形で集め、json-node-coverage.json の「残り」と比べる。
// - 新しい場所が出たら失敗 (JsonType でない型を足した)
// - 一覧にあるのに出なくなったら失敗 (変換したら一覧から消す)
// 一覧を今の結果で書き直すときは UPDATE_JSON_NODE_COVERAGE=1 を付けて実行する

const here = path.dirname(fileURLToPath(import.meta.url));
const LIST_FILE = path.join(here, 'json-node-coverage.json');

type Coverage = {
    /** kind を持たないオブジェクトの場所 */
    withoutKind: string[];
    /** kind はあるが sourceKeys を持たないオブジェクトの場所 */
    withoutSourceKeys: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** 位置 (sourceKeys) を除いた中身の文字列 (キーを並べ替える)。objectKey の一致と中身の一致を比べるため */
const contentOf = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(contentOf).join(',')}]`;
    if (!isRecord(value)) return JSON.stringify(value) ?? 'undefined';
    return `{${Object.keys(value)
        .filter((key) => key !== 'sourceKeys')
        .sort()
        .map((key) => `${JSON.stringify(key)}:${contentOf(value[key])}`)
        .join(',')}}`;
};

/** 同じ objectKey なのに中身が違うノード (単位の種類 → kind: objectKey の一覧) */
const objectKeyConflicts = new Map<string, Set<string>>();

const collect = async (): Promise<Coverage> => {
    const withoutKind = new Set<string>();
    const withoutSourceKeys = new Set<string>();
    for (const side of SIDES) {
        const repository = await Repository.load(
            new ProjectTree(new WorkingTree(repositoryOf(side))),
        );
        for (const [type, results] of repository.entries()) {
            for (const result of results) {
                // objectKey → 中身 (単位の中で、同じ objectKey のノードは中身も同じはず)
                const contents = new Map<string, string>();
                const visit = (value: unknown, owner: string, property: string): void => {
                    if (Array.isArray(value)) {
                        value.forEach((item) => visit(item, owner, `${property}[]`));
                        return;
                    }
                    if (!isRecord(value)) return;
                    if (typeof value.kind === 'string') {
                        if (!isRecord(value.sourceKeys)) {
                            withoutSourceKeys.add(`${type}: ${owner}.${property} (${value.kind})`);
                        } else if (typeof value.sourceKeys.objectKey === 'string') {
                            const objectKey = value.sourceKeys.objectKey;
                            const content = contentOf(value);
                            const seen = contents.get(objectKey);
                            if (seen === undefined) contents.set(objectKey, content);
                            else if (seen !== content) {
                                const keys = objectKeyConflicts.get(type) ?? new Set<string>();
                                objectKeyConflicts.set(
                                    type,
                                    keys.add(`${value.kind}: ${objectKey}`),
                                );
                            }
                        }
                        for (const [key, child] of Object.entries(value)) {
                            if (key !== 'sourceKeys') visit(child, value.kind, key);
                        }
                        return;
                    }
                    withoutKind.add(`${type}: ${owner}.${property}`);
                    for (const [key, child] of Object.entries(value)) {
                        visit(child, owner, `${property}.${key}`);
                    }
                };
                visit(result.result.base, '(unit)', 'base');
            }
        }
    }
    return {
        withoutKind: [...withoutKind].sort(),
        withoutSourceKeys: [...withoutSourceKeys].sort(),
    };
};

/**
 * kind を持たないまま残すもの (docs/plan.md 4.2。2026-11-24 に決めた)。
 * - valueTrees: XML の値の木 (types/commons/valueTree.ts)。種類ごとに形を決めない汎用の表現で、子の要素ごとにノードにしない
 * - dictionaries: 名前 → 値の辞書 (Record<string, string>。属性・プロパティ)。キーが XML の要素名ではなくデータなので、値として扱う
 * それ以外の、kind を持たないオブジェクトは 0 にする (P1 の終わり)
 */
type KeptValues = { valueTrees: string[]; dictionaries: string[]; withoutSourceKeys: string[] };

/** 書き直すときの振り分け: attributes で終わる場所 (attributes・rootAttributes・templateAttributes) は辞書 */
const isDictionary = (place: string) => /[aA]ttributes$/.test(place);

describe('JSON のノードの網羅 (すべて JsonType にする。docs/plan.md の P1)', () => {
    let actual: Coverage;
    before(async () => {
        actual = await collect();
        if (process.env.UPDATE_JSON_NODE_COVERAGE === '1') {
            const kept: KeptValues = {
                valueTrees: actual.withoutKind.filter((place) => !isDictionary(place)),
                dictionaries: actual.withoutKind.filter(isDictionary),
                withoutSourceKeys: actual.withoutSourceKeys,
            };
            fs.writeFileSync(LIST_FILE, `${JSON.stringify(kept, null, 4)}\n`);
        }
    });

    const expected = (): KeptValues => JSON.parse(fs.readFileSync(LIST_FILE, 'utf8')) as KeptValues;

    const compare = (found: readonly string[], listed: readonly string[]) => {
        const listedSet = new Set(listed);
        const foundSet = new Set(found);
        assert.deepEqual(
            {
                new: found.filter((place) => !listedSet.has(place)),
                removed: listed.filter((place) => !foundSet.has(place)),
            },
            { new: [], removed: [] },
        );
    };

    it('kind-less objects are only the value trees and dictionaries in the list', () => {
        const { valueTrees, dictionaries } = expected();
        compare(actual.withoutKind, [...valueTrees, ...dictionaries]);
    });

    it('every node with kind has sourceKeys (except the listed ones)', () => {
        compare(actual.withoutSourceKeys, expected().withoutSourceKeys);
    });

    it('lists only dictionaries as dictionaries', () => {
        assert.deepEqual(
            expected().dictionaries.filter((place) => !isDictionary(place)),
            [],
        );
    });

    it('gives different objectKeys to nodes with different contents', () => {
        // objectKey は位置を除いた中身の hash。同じなら部分木も同じ (Diff・GumTree はこれを前提に比べる)
        assert.deepEqual(
            Object.fromEntries(
                [...objectKeyConflicts].map(([type, keys]) => [type, [...keys].sort()]),
            ),
            {},
        );
    });
});
