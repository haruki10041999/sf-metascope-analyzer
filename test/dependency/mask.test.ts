import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import { runReportProvider } from '../../src/analyzer/report';
import { MASKED, maskRepository, maskSensitive } from '../../src/analyzer/report/mask';
import { Repository, WorkingTree, dependencyGraphOf } from '../../src/analyzer/unit';

describe('maskSensitive (機密の値を伏せる)', () => {
    it('masks the sensitive properties of the data type at any depth', () => {
        const json = {
            kind: 'namedCredential',
            sourceKeys: { objectKey: 'a', sourceKey: 'b' },
            label: 'Billing API',
            endpoint: 'https://billing.example.com',
            username: 'integration@example.com',
            namedCredentialParameters: [
                {
                    kind: 'namedCredentialParameter',
                    parameterName: 'Url',
                    parameterValue: 'https://x',
                },
            ],
        };
        const masked = maskSensitive('namedCredential', json);
        assert.equal(masked.endpoint, MASKED);
        assert.equal(masked.username, MASKED);
        assert.equal(masked.namedCredentialParameters[0]!.parameterValue, MASKED);
        assert.equal(masked.label, 'Billing API');
        assert.deepEqual(masked.sourceKeys, json.sourceKeys);
        // 元は変えない
        assert.equal(json.endpoint, 'https://billing.example.com');
    });

    it('always masks passwords and leaves other types alone', () => {
        const masked = maskSensitive('customTab', { label: 'Tab', password: 'p' });
        assert.deepEqual(masked, { label: 'Tab', password: MASKED });
    });

    it('masks a repository (values and source text) but keeps the dependency graph', async () => {
        const repository = await Repository.load(new WorkingTree(repositoryOf('after')));
        const masked = maskRepository(repository);
        const [credential] = masked.get('namedCredential');
        const base = credential!.result.base as {
            label?: string;
            namedCredentialParameters: { parameterValue?: string }[];
        };
        // サンプルの URL は parameterValue にある
        assert.equal(base.namedCredentialParameters[0]!.parameterValue, MASKED);
        assert.equal(base.label, 'Billing API');
        assert.ok(
            (credential!.result.sourceObject as { context: string }[]).every(
                (s) => s.context === MASKED,
            ),
        );
        // 元は変えない
        assert.ok(JSON.stringify(repository.get('namedCredential')[0]).includes('https://'));
        assert.ok(!JSON.stringify(credential).includes('https://'));
        // ほかの種類はそのまま
        assert.equal(masked.get('apexClass')[0], repository.get('apexClass')[0]);
        // グラフは伏せる前のもの (メールの本文の項目の参照が残る)
        assert.equal(dependencyGraphOf(masked), dependencyGraphOf(repository));
        const rows = runReportProvider(
            'dependency.dependents',
            { after: repository },
            {
                target: 'field:Invoice__c.Amount__c',
            },
        ) as { id: string }[];
        assert.ok(rows.some((row) => row.id === 'emailTemplate:Invoice_Templates/Invoice_Sent'));
    });
});
