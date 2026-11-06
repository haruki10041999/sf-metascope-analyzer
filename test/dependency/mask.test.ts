import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MASKED, maskSensitive } from '../../src/analyzer/report/mask';

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
});
