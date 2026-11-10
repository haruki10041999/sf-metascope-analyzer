import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import {
    OBJECT_TRANSLATION_SAVE_PREFIX,
    ObjectTranslationParser,
} from '../../src/analyzer/parser/Metadata/objectTranslation';
import { splitTranslationName } from '../../src/analyzer/types/metadata/objectTranslation';
import { writeSaveDataInfo } from '../../src/analyzer/parser/commons';

/** docs/examples/metadata の翻訳のサンプルを、本番と同じ流れ (ObjectTranslationParser) で読む */

const translationsDir = (side: 'before' | 'after') =>
    path.resolve(`docs/examples/repository/${side}/force-app/main/default/objectTranslations`);

let tmp: string;
before(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'translation-'));
});
after(async () => {
    await rm(tmp, { recursive: true, force: true });
});

const parse = async (name: string, side: 'before' | 'after' = 'after') => {
    const result = await ObjectTranslationParser.parseObjectTranslation(
        path.join(translationsDir(side), name),
    );
    assert.equal(result.dataType, 'objectTranslation');
    return result.dataType === 'objectTranslation' ? result : assert.fail();
};

describe('ObjectTranslationParser', () => {
    it('splits the folder name into the object and the locale', () => {
        assert.deepEqual(splitTranslationName('Invoice__c-en_US'), {
            objectApiName: 'Invoice__c',
            locale: 'en_US',
        });
        assert.deepEqual(splitTranslationName('Account-ja'), {
            objectApiName: 'Account',
            locale: 'ja',
        });
    });

    it('finds translation folders under objectTranslations', async () => {
        const directories = await ObjectTranslationParser.searchObjectTranslationDirectories(
            path.resolve('docs/examples/repository/after'),
        );
        assert.deepEqual(
            directories.map((d) => path.basename(d)),
            ['Account-ja', 'Broken__c-ja', 'Invoice__c-en_US', 'Invoice__c-ja'],
        );
    });

    it('reads the object translation and the field translations in the same folder', async () => {
        const { result } = await parse('Invoice__c-ja');
        const base = result.base;
        assert.equal(result.id, 'Invoice__c-ja');
        assert.equal(base.kind, 'objectTranslation');
        assert.equal(base.objectApiName, 'Invoice__c');
        assert.equal(base.locale, 'ja');
        assert.equal(base.nameFieldLabel, '請求書番号');

        assert.deepEqual(
            base.fields?.map((f) => (f.kind === 'fieldTranslation' ? [f.name, f.label] : [])),
            [
                ['Account__c', '取引先'],
                ['Amount__c', '金額'],
                ['Due_Date__c', 'Due Date'],
                ['Note__c', 'メモ'],
                ['Status__c', '状態'],
            ],
        );
        const status = base.fields?.find(
            (f) => f.kind === 'fieldTranslation' && f.name === 'Status__c',
        );
        assert.ok(status && status.kind === 'fieldTranslation');
        assert.deepEqual(
            status.picklistValues?.map((v) => [v.kind, v.masterLabel, v.translation]),
            [
                ['picklistValueTranslation', 'Draft', '下書き'],
                ['picklistValueTranslation', 'Paid', '支払済み'],
            ],
        );

        assert.deepEqual(
            base.validationRules?.map((r) => [r.kind, r.name, r.errorMessage]),
            [['validationRuleTranslation', 'Amount_Positive', '金額は正の値にしてください。']],
        );
        assert.deepEqual(
            base.layouts?.map((l) => [l.kind, l.layout, l.sections]),
            [
                [
                    'layoutTranslation',
                    'Invoice Layout',
                    [{ section: 'Information', label: '請求情報' }],
                ],
            ],
        );
        // ないものは持たない
        assert.ok(!('quickActions' in base) && !('caseValues' in base) && !('gender' in base));
    });

    it('reads case values as plain values and keeps source positions with the file path', async () => {
        const { result } = await parse('Account-ja');
        assert.deepEqual(result.base.caseValues, [{ value: '取引先', plural: false }]);
        const files = result.sourceObject.flatMap((s) => s.source.map((source) => source.filePath));
        assert.ok(files.includes('Account-ja/Tier__c.fieldTranslation-meta.xml'));
        assert.ok(files.includes('Account-ja/Account-ja.objectTranslation-meta.xml'));
    });

    it('drops unreadable files from the JSON and reports them in resolvedError', async () => {
        const { result, resolvedError } = await parse('Broken__c-ja');
        // 読めない項目の翻訳は JSON に持たない (ほかに項目がないので fields ごと持たない)
        assert.equal(result.base.fields, undefined);
        assert.deepEqual(
            resolvedError.map((e) => [e.code, e.filePath, e.start.line]),
            [['XML_SYNTAX', 'Broken__c-ja/Code__c.fieldTranslation-meta.xml', 3]],
        );
    });

    it('makes the whole translation an error when objectTranslation-meta.xml is broken', async () => {
        const directory = path.join(tmp, 'objectTranslations', 'Foo__c-ja');
        await mkdir(directory, { recursive: true });
        await writeFile(
            path.join(directory, 'Foo__c-ja.objectTranslation-meta.xml'),
            '<CustomObjectTranslation><nameFieldLabel>x</nameField></CustomObjectTranslation>',
        );
        const result = await ObjectTranslationParser.parseObjectTranslation(directory);
        assert.equal(result.dataType, 'error');
        // 中身は持たない (理由は resolvedError)
        assert.equal(result.result.base, null);
        assert.deepEqual(
            result.resolvedError.map((e) => [e.code, e.contextType]),
            [['XML_SYNTAX', 'objectTranslation']],
        );
    });

    it('keeps the keys when only the position or the line endings change', async () => {
        const before = await parse('Invoice__c-en_US', 'before');
        const after = await parse('Invoice__c-en_US', 'after');
        assert.equal(
            before.result.base.sourceKeys.objectKey,
            after.result.base.sourceKeys.objectKey,
        );
        assert.notEqual(
            before.result.base.sourceKeys.sourceKey,
            after.result.base.sourceKeys.sourceKey,
        );

        const directory = path.join(tmp, 'crlf', 'Account-ja');
        await mkdir(directory, { recursive: true });
        for (const name of await readdir(path.join(translationsDir('after'), 'Account-ja'))) {
            const text = await readFile(
                path.join(translationsDir('after'), 'Account-ja', name),
                'utf8',
            );
            await writeFile(path.join(directory, name), text.replace(/\n/g, '\r\n'));
        }
        const lf = await parse('Account-ja');
        const crlf = await ObjectTranslationParser.parseObjectTranslation(directory);
        assert.equal(crlf.dataType, 'objectTranslation');
        assert.deepEqual(crlf.result.base?.sourceKeys, lf.result.base.sourceKeys);
    });

    it('saves translations with a prefix, separately from objects in the same folder', async () => {
        const outDir = path.join(tmp, 'saved');
        const translation = await parse('Invoice__c-ja');
        const object = await MetadataParser.parseObject(
            path.resolve(
                'docs/examples/repository/after/force-app/main/default/objects/Invoice__c',
            ),
        );
        await writeSaveDataInfo([
            ...ObjectTranslationParser.saveObjectTranslationFile(outDir, translation),
            ...MetadataParser.saveObjectFile(outDir, object),
        ]);

        const saved = await ObjectTranslationParser.readSavedObjectTranslations(outDir);
        assert.deepEqual(
            saved.map((t) => t.result.id),
            ['Invoice__c-ja'],
        );
        assert.deepEqual(saved[0], translation);
        // オブジェクトの読み込みは翻訳の保存データを拾わない
        const objects = await MetadataParser.readSavedObjects(outDir);
        assert.deepEqual(
            objects.map((o) => o.result.id),
            ['Invoice__c'],
        );
        // 保存名でもフォルダ名でも読める
        const byName = await ObjectTranslationParser.readObjectTranslationMsgPack(
            outDir,
            'Invoice__c-ja',
        );
        const bySaveId = await ObjectTranslationParser.readObjectTranslationMsgPack(
            outDir,
            `${OBJECT_TRANSLATION_SAVE_PREFIX}Invoice__c-ja`,
        );
        assert.deepEqual(byName, bySaveId);
    });
});
