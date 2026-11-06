import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ProjectTree,
    type SourceTree,
    locateUnits,
    makeForceIgnore,
} from '../../src/analyzer/unit';

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
});
