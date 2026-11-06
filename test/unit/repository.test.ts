import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { REPOSITORY, SIDES, repositoryOf } from '../../docs/examples/paths';
import { ApexParser } from '../../src/analyzer/parser/Apex/parser';
import { LwcParser } from '../../src/analyzer/parser/Lwc/parser';
import { METADATA_FOLDER_PARSERS } from '../../src/analyzer/parser/Metadata/folders';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import { ObjectTranslationParser } from '../../src/analyzer/parser/Metadata/objectTranslation';
import {
    Repository,
    UNIT_TYPES,
    WorkingTree,
    changedUnits,
    diffRepositories,
    findUnitType,
    locateUnits,
    renamedUnits,
    unitName,
    type UnitParseResult,
} from '../../src/analyzer/unit';
import { UnitWorker } from '../../src/analyzer/worker/unitWorker';

/** 今までの parser (種類ごとの入口) で読んだもの */
const parseWithParsers = async (root: string): Promise<Map<string, UnitParseResult[]>> => {
    const apex = await ApexParser.parseApexUnits(root);
    const byApexType = (prefix: string) => apex.filter((r) => r.result.id.startsWith(prefix));
    const map = new Map<string, UnitParseResult[]>([
        ['apexClass', byApexType('class_')],
        ['apexTrigger', byApexType('trigger_')],
        ['anonymousApex', byApexType('anonymous_')],
        ['lwc', await LwcParser.parseLwcBundles(root)],
        ['object', await MetadataParser.parseObjects(root)],
        ['objectTranslation', await ObjectTranslationParser.parseObjectTranslations(root)],
    ] as [string, UnitParseResult[]][]);
    for (const parser of METADATA_FOLDER_PARSERS) {
        map.set(parser.spec.type, (await parser.parseAll(root)) as UnitParseResult[]);
    }
    return map;
};

const byId = (results: UnitParseResult[]) =>
    [...results].sort((a, b) => a.result.id.localeCompare(b.result.id));

describe('Repository (単位の種類の一覧から読む)', () => {
    for (const side of SIDES) {
        it(`reads the same results as the type-specific parsers (${side})`, async () => {
            const root = repositoryOf(side);
            const repository = await Repository.load(new WorkingTree(root));
            const expected = await parseWithParsers(root);
            for (const unitType of UNIT_TYPES) {
                const actual = repository.get(unitType.type);
                const wanted = byId(expected.get(unitType.type) ?? []);
                assert.deepEqual(
                    actual.map((r) => r.result.id),
                    wanted.map((r) => r.result.id),
                    `${side} ${unitType.type}: ids`,
                );
                for (const [index, result] of actual.entries()) {
                    const want = wanted[index]!;
                    assert.deepEqual(
                        { ...result, filePath: path.resolve(result.filePath) },
                        { ...want, filePath: path.resolve(want.filePath) },
                        `${side} ${unitType.type} ${result.result.id}`,
                    );
                }
            }
        });
    }

    it('names units by type', async () => {
        const repository = await Repository.load(new WorkingTree(repositoryOf('before')));
        const names = (type: string) =>
            repository.get(type).map((result) => unitName(type, result));
        assert.ok(names('apexClass').includes('AccountService'));
        assert.ok(names('apexTrigger').includes('AccountTrigger'));
        assert.ok(names('object').includes('Account'));
        assert.ok(names('permissionSet').length > 0);
        assert.ok(names('permissionSet').every((name) => !name.startsWith('permissionSet_')));
    });

    it('maps changed files to units, including companions and renames', () => {
        const files = [
            { status: 'modified' as const, path: 'force-app/main/default/classes/A.cls-meta.xml' },
            {
                status: 'modified' as const,
                path: 'force-app/main/default/objects/Account/fields/Name__c.field-meta.xml',
            },
            { status: 'modified' as const, path: 'force-app/main/default/lwc/hello/hello.html' },
            { status: 'modified' as const, path: 'force-app/main/default/pages/P.page' },
            {
                status: 'renamed' as const,
                oldPath: 'force-app/main/default/classes/Old.cls',
                path: 'force-app/main/default/classes/New.cls',
                similarity: 95,
            },
        ];
        const changed = changedUnits(files);
        assert.deepEqual(changed.get('apexClass'), [
            'force-app/main/default/classes/A.cls',
            'force-app/main/default/classes/New.cls',
            'force-app/main/default/classes/Old.cls',
        ]);
        assert.deepEqual(changed.get('object'), ['force-app/main/default/objects/Account']);
        assert.deepEqual(changed.get('lwc'), ['force-app/main/default/lwc/hello']);
        assert.deepEqual(changed.get('apexPage'), ['force-app/main/default/pages/P.page-meta.xml']);
        assert.deepEqual(
            [...renamedUnits(files).get('apexClass')!],
            [['force-app/main/default/classes/Old.cls', 'force-app/main/default/classes/New.cls']],
        );
        // 種類のフォルダの外・ほかの種類のファイルは単位にならない
        const located = locateUnits(['force-app/main/default/classes/readme.md']);
        assert.ok([...located.values()].every((locations) => locations.length === 0));
    });

    it('diffs repositories with the same unit diffs as before', async () => {
        const [beforeRepo, afterRepo] = await Promise.all(
            SIDES.map((side) => Repository.load(new WorkingTree(repositoryOf(side)))),
        );
        const diffs = diffRepositories(beforeRepo!, afterRepo!);
        const status = (type: string, id: string) =>
            diffs.get(type)!.find((diff) => diff.id === id)?.status;
        assert.equal(status('object', 'Payment__c'), 'added');
        assert.equal(status('object', 'Legacy_Item__c'), 'removed');
        assert.equal(status('apexClass', 'class_Unchanged'), 'unchanged');
        assert.equal(status('apexClass', 'class_NewHelper'), 'added');
    });

    it('pairs renamed units', async () => {
        const [beforeRepo, afterRepo] = await Promise.all(
            SIDES.map((side) =>
                Repository.load(new WorkingTree(repositoryOf(side)), [findUnitType('apexClass')!]),
            ),
        );
        const renames = new Map([
            [
                'apexClass',
                new Map([
                    [
                        'force-app/main/default/classes/OldHelper.cls',
                        'force-app/main/default/classes/NewHelper.cls',
                    ],
                ]),
            ],
        ]);
        const diffs = diffRepositories(beforeRepo!, afterRepo!, {
            types: [findUnitType('apexClass')!],
            renames,
        }).get('apexClass')!;
        const renamed = diffs.find((diff) => diff.id === 'class_NewHelper')!;
        assert.equal(renamed.renamedFrom, 'class_OldHelper');
        assert.notEqual(renamed.status, 'added');
        assert.ok(!diffs.some((diff) => diff.id === 'class_OldHelper'));
    });

    describe('save and update', () => {
        let tmp: string;
        before(async () => {
            tmp = await mkdtemp(path.join(os.tmpdir(), 'repository-'));
        });
        after(async () => {
            await rm(tmp, { recursive: true, force: true });
        });

        it('saves every unit and reads them back', async () => {
            const root = repositoryOf('before');
            const repository = await Repository.load(new WorkingTree(root));
            await repository.save(tmp);
            const saved = await Repository.loadSaved(root, tmp);
            for (const unitType of UNIT_TYPES) {
                assert.deepEqual(
                    saved.get(unitType.type).map((r) => r.result.id),
                    repository.get(unitType.type).map((r) => r.result.id),
                    unitType.type,
                );
            }
        });

        it('reparses only the changed units', async () => {
            const beforeRepo = await Repository.load(new WorkingTree(repositoryOf('before')));
            const afterTree = new WorkingTree(repositoryOf('after'));
            // after の木で、Account だけを読み直す (ほかのオブジェクトは before のまま)
            const updated = await beforeRepo.update(
                afterTree,
                new Map([['object', ['force-app/main/default/objects/Account']]]),
            );
            const afterRepo = await Repository.load(afterTree);
            const account = (repo: Repository) =>
                repo.get('object').find((r) => r.result.id === 'Account')!.result.base;
            assert.deepEqual(account(updated), account(afterRepo));
            assert.ok(updated.get('object').some((r) => r.result.id === 'Legacy_Item__c'));
            assert.ok(REPOSITORY);
        });

        it('parses and saves every unit with one worker', async () => {
            const root = repositoryOf('after');
            const outDir = path.join(tmp, 'worker');
            const worker = new UnitWorker({ outDir, concurrency: 4 });
            const results = await worker.parseAndSaveAll(root);
            assert.ok(results.every((r) => r.ok));
            const loaded = await worker.loadAll(root);
            const parsed = await Repository.load(new WorkingTree(root));
            for (const unitType of UNIT_TYPES) {
                assert.deepEqual(
                    loaded.get(unitType.type).map((r) => r.result.id),
                    parsed.get(unitType.type).map((r) => r.result.id),
                    unitType.type,
                );
            }
            assert.equal(
                results.length,
                UNIT_TYPES.reduce((n, t) => n + parsed.get(t.type).length, 0),
            );
            await worker.close();
        });
    });
});
