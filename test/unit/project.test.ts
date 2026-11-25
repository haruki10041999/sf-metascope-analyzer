import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ProjectTree,
    Repository,
    type SourceTree,
    UNIT_TYPES,
    locateUnits,
    makeForceIgnore,
} from '../../src/analyzer/unit';
import { getMetadataFindings } from '../../src/analyzer/report/crossRef';

/** メモリ上の木 */
const memoryTree = (files: Record<string, string>): SourceTree => ({
    root: '/repo',
    label: 'memory',
    listFiles: async () => Object.keys(files).sort(),
    readFile: async (filePath) => files[filePath],
});

describe('sfdx project scope (packageDirectories・.forceignore)', () => {
    it('matches .forceignore patterns like gitignore', () => {
        const ignored = makeForceIgnore(
            [
                '# comment',
                '**/jsconfig.json',
                '**/__tests__/**',
                '/force-app/main/default/profiles/',
                '*.bak',
                '!keep.bak',
            ].join('\n'),
        );
        assert.equal(ignored('force-app/main/default/lwc/jsconfig.json'), true);
        assert.equal(ignored('force-app/main/default/lwc/hello/__tests__/hello.test.js'), true);
        assert.equal(ignored('force-app/main/default/profiles/Admin.profile-meta.xml'), true);
        assert.equal(
            ignored('other/force-app/main/default/profiles/Admin.profile-meta.xml'),
            false,
        );
        assert.equal(ignored('force-app/main/default/classes/A.cls.bak'), true);
        assert.equal(ignored('force-app/keep.bak'), false);
        assert.equal(ignored('force-app/main/default/classes/A.cls'), false);
    });

    it('reads only the package directories and skips ignored files', async () => {
        const tree = new ProjectTree(
            memoryTree({
                'sfdx-project.json': JSON.stringify({
                    packageDirectories: [
                        { path: 'force-app', default: true },
                        { path: './pkg-b/' },
                    ],
                }),
                '.forceignore': '**/profiles/**\n',
                'force-app/main/default/classes/A.cls': 'public class A {}',
                'force-app/main/default/profiles/Admin.profile-meta.xml': '<Profile/>',
                'pkg-b/main/default/classes/B.cls': 'public class B {}',
                'scripts/apex/hello.apex': "System.debug('x');",
            }),
        );
        assert.deepEqual(await tree.listFiles(), [
            'force-app/main/default/classes/A.cls',
            'pkg-b/main/default/classes/B.cls',
        ]);
        const located = locateUnits(await tree.listFiles());
        assert.deepEqual(located.get('apexClass'), [
            'force-app/main/default/classes/A.cls',
            'pkg-b/main/default/classes/B.cls',
        ]);
        assert.deepEqual(located.get('anonymousApex'), []);
        assert.deepEqual(located.get('profile'), []);
    });

    it('reads everything when there is no sfdx-project.json', async () => {
        const tree = new ProjectTree(memoryTree({ 'classes/A.cls': '', 'scripts/a.apex': '' }));
        assert.deepEqual(await tree.listFiles(), ['classes/A.cls', 'scripts/a.apex']);
    });

    it('uses one unit of the same type and name in two package directories, in packageDirectories order (P3)', async () => {
        const apexClass = UNIT_TYPES.filter((t) => t.type === 'apexClass');
        const files: Record<string, string> = {
            // 名前の順 (force-app が先) と packageDirectories の順 (pkg-b が先) を逆にする
            'sfdx-project.json': JSON.stringify({
                packageDirectories: [{ path: 'pkg-b' }, { path: 'force-app', default: true }],
            }),
            'force-app/main/default/classes/Shared.cls': 'public class Shared { void a() {} }',
            'force-app/main/default/classes/Only.cls': 'public class Only {}',
            'pkg-b/main/default/classes/Shared.cls': 'public class Shared { void b() {} }',
        };
        const repository = await Repository.load(new ProjectTree(memoryTree(files)), apexClass);
        assert.deepEqual(
            repository.get('apexClass').map((r) => repository.locationOf(r)),
            // id の順 (class_Only・class_Shared)
            ['force-app/main/default/classes/Only.cls', 'pkg-b/main/default/classes/Shared.cls'],
        );
        assert.deepEqual(repository.overlaps, [
            {
                type: 'apexClass',
                id: 'class_Shared',
                kept: 'pkg-b/main/default/classes/Shared.cls',
                skipped: ['force-app/main/default/classes/Shared.cls'],
            },
        ]);

        // metadata.findings に警告を出す (黙って片方を捨てない)
        const duplicates = getMetadataFindings({ after: repository }).filter(
            (f) => f.code === 'DUPLICATE_UNIT',
        );
        assert.deepEqual(
            duplicates.map((f) => [f.source, f.severity, f.unit, f.target]),
            [['repository', 'warning', 'class_Shared', 'apexClass:class_Shared']],
        );

        // 使っていた方を消すと、もう一方を使う (重なりはなくなる)
        delete files['pkg-b/main/default/classes/Shared.cls'];
        const updated = await repository.update(
            new ProjectTree(memoryTree(files)),
            new Map([['apexClass', ['pkg-b/main/default/classes/Shared.cls']]]),
            apexClass,
        );
        assert.deepEqual(
            updated.get('apexClass').map((r) => updated.locationOf(r)),
            [
                'force-app/main/default/classes/Only.cls',
                'force-app/main/default/classes/Shared.cls',
            ],
        );
        assert.deepEqual(updated.overlaps, []);
    });
});
