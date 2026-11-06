import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Packr } from 'msgpackr';

import {
    SAVE_FORMAT_VERSION,
    SavedDataVersionError,
    hasCurrentSavedData,
    makeMsgPackSaveData,
    readMsgPack,
    readSavedMsgPacks,
    writeSaveDataInfo,
} from '../../src/analyzer/parser/commons';
import { MetadataParser, isObjectSaveId } from '../../src/analyzer/parser/Metadata/parser';

const OBJECTS = path.join('docs/examples/repository/before/force-app/main/default/objects');

describe('saved data format version', () => {
    let tmp: string;
    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'saved-data-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('reads data saved with the current version', async () => {
        const dir = path.join(tmp, 'current');
        await writeSaveDataInfo([makeMsgPackSaveData('Apex', dir, 'class_A', { value: 1 })]);
        assert.deepEqual(await readMsgPack(dir, 'class_A', 'Apex'), { value: 1 });
        assert.equal(await hasCurrentSavedData(dir), true);
    });

    it('treats data without a version (or with another version) as no saved data', async () => {
        const dir = path.join(tmp, 'old');
        await writeSaveDataInfo([makeMsgPackSaveData('Apex', dir, 'class_A', { value: 1 })]);
        // 版を入れる前の形 (data をそのまま pack したもの)
        const packr = new Packr({ useRecords: true });
        await writeFile(path.join(dir, 'class_B.msgpack'), packr.pack({ value: 2 }));
        await writeFile(
            path.join(dir, 'class_C.msgpack'),
            packr.pack({ formatVersion: SAVE_FORMAT_VERSION + 1, data: { value: 3 } }),
        );

        await assert.rejects(readMsgPack(dir, 'class_B', 'Apex'), SavedDataVersionError);
        await assert.rejects(readMsgPack(dir, 'class_C', 'Apex'), SavedDataVersionError);
        // 1 つでも古ければ全体を保存データなしとする
        const all = await readSavedMsgPacks(
            dir,
            () => true,
            (id) => readMsgPack(dir, id, 'Apex'),
        );
        assert.deepEqual(all, []);
        assert.equal(await hasCurrentSavedData(dir, (id) => id === 'class_B'), false);
        assert.equal(await hasCurrentSavedData(path.join(tmp, 'missing')), false);
    });

    it('saves objects as object_<API name> and reads them by either name', async () => {
        const dir = path.join(tmp, 'objects');
        const account = await MetadataParser.parseObject(path.join(OBJECTS, 'Account'));
        await writeSaveDataInfo(MetadataParser.saveObjectFile(dir, account));
        assert.deepEqual(await readdir(dir), ['object_Account.msgpack']);
        assert.ok(isObjectSaveId('object_Account'));
        assert.equal((await MetadataParser.readObjectMsgPack(dir, 'Account')).result.id, 'Account');
        assert.equal(
            (await MetadataParser.readObjectMsgPack(dir, 'object_Account')).result.id,
            'Account',
        );
        assert.deepEqual(
            (await MetadataParser.readSavedObjects(dir)).map((o) => o.result.id),
            ['Account'],
        );
    });
});
