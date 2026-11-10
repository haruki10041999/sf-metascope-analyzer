import {
    ConvertKeys,
    CustomFieldJson,
    CustomFieldTranslationJson,
    CustomObjectJson,
    CustomObjectTranslationJson,
    TranslationMemberJson,
} from '../../types';

// 方針: docs/object-translation.md 4 章
// 翻訳だけでは判断できないので、同じ時点のオブジェクトと突き合わせる。Diff には依存しない
// (古い翻訳は before / after の 2 時点を見るが、Diff の結果ではなく JSON 同士を比べる)

/** 翻訳の対象の種類 */
export type TranslationItemKind =
    | 'fieldLabel'
    | 'fieldHelp'
    | 'relationshipLabel'
    | 'picklistValue'
    | 'validationRule'
    | 'recordType'
    | 'webLink'
    | 'fieldSet';

/**
 * 翻訳の状態。
 * - translated: 翻訳がある / missing: 翻訳がない
 * - sameAsSource: 翻訳が翻訳元と同じ (翻訳し忘れの候補)
 * - orphan: オブジェクトにないもの (削除された項目・値など) を指す翻訳
 * - outdated: 翻訳元が変わったのに翻訳が変わっていない (before / after を渡したときだけ)
 */
export type TranslationStatus = 'translated' | 'missing' | 'sameAsSource' | 'orphan' | 'outdated';

export type TranslationCoverageItem = {
    kind: TranslationItemKind;
    /** 項目は API 名、選択リスト値は `<項目>.<値の API 名>`、それ以外は fullName */
    name: string;
    status: TranslationStatus;
    /** 翻訳元 (オブジェクト側の文言) */
    source?: string;
    translation?: string;
    /** 元のノードの sourceKeys (表示でソースの位置を引く) */
    sourceKeys: { object?: ConvertKeys; translation?: ConvertKeys };
};

export type TranslationCoverage = {
    /** <オブジェクト>-<言語> */
    id: string;
    objectApiName: string;
    locale: string;
    /** 同じ時点にオブジェクトがあったか。ないときは、カスタムオブジェクトの翻訳はすべて orphan にする */
    objectFound: boolean;
    items: TranslationCoverageItem[];
    counts: Record<TranslationStatus, number>;
};

type Entry = { source?: string; sourceKeys?: ConvertKeys };
type Translated = { translation?: string; sourceKeys?: ConvertKeys };

/** オブジェクト側の翻訳元 (kind:name → 文言) */
const collectSources = (
    object: CustomObjectJson,
): Map<string, Entry & { kind: TranslationItemKind; name: string }> => {
    const sources = new Map<string, Entry & { kind: TranslationItemKind; name: string }>();
    const add = (
        kind: TranslationItemKind,
        name: string,
        source: string | undefined,
        sourceKeys: ConvertKeys,
    ) => {
        if (source !== undefined && source !== '') {
            sources.set(`${kind}:${name}`, { kind, name, source, sourceKeys });
        }
    };

    (object.fields ?? []).forEach((field) => {
        add('fieldLabel', field.apiName, field.label, field.sourceKeys);
        add('fieldHelp', field.apiName, field.inlineHelpText, field.sourceKeys);
        add('relationshipLabel', field.apiName, field.relationshipLabel, field.sourceKeys);
        (field.valueSet?.values ?? []).forEach((value) => {
            add(
                'picklistValue',
                `${field.apiName}.${value.fullName}`,
                value.label ?? value.fullName,
                value.sourceKeys,
            );
        });
    });
    const named = (
        kind: TranslationItemKind,
        members: { fullName: string; sourceKeys: ConvertKeys }[] | undefined,
        textKey: string,
    ) =>
        (members ?? []).forEach((member) => {
            const text = (member as unknown as Record<string, unknown>)[textKey];
            add(
                kind,
                member.fullName,
                typeof text === 'string' ? text : undefined,
                member.sourceKeys,
            );
        });
    named('validationRule', object.validationRules, 'errorMessage');
    named('recordType', object.recordTypes, 'label');
    named('webLink', object.webLinks, 'masterLabel');
    named('fieldSet', object.fieldSets, 'label');
    return sources;
};

/**
 * 翻訳側の文言 (kind:name → 翻訳)。選択リスト値は masterLabel (翻訳元のラベル) で書かれているので、
 * オブジェクトの値の API 名に読み替える (読み替えられないものは masterLabel のまま)
 */
const collectTranslations = (
    translation: CustomObjectTranslationJson,
    object: CustomObjectJson | undefined,
): Map<string, Translated & { kind: TranslationItemKind; name: string }> => {
    const translations = new Map<
        string,
        Translated & { kind: TranslationItemKind; name: string }
    >();
    const add = (
        kind: TranslationItemKind,
        name: string,
        text: string | undefined,
        sourceKeys: ConvertKeys,
    ) =>
        translations.set(`${kind}:${name}`, {
            kind,
            name,
            ...(text !== undefined ? { translation: text } : {}),
            sourceKeys,
        });

    const objectFields = new Map(
        (object?.fields ?? []).map((field): [string, CustomFieldJson] => [field.apiName, field]),
    );

    (translation.fields ?? []).forEach((field) => {
        const fieldTranslation: CustomFieldTranslationJson = field;
        const name = fieldTranslation.name;
        add('fieldLabel', name, fieldTranslation.label, fieldTranslation.sourceKeys);
        if (fieldTranslation.help !== undefined) {
            add('fieldHelp', name, fieldTranslation.help, fieldTranslation.sourceKeys);
        }
        if (fieldTranslation.relationshipLabel !== undefined) {
            add(
                'relationshipLabel',
                name,
                fieldTranslation.relationshipLabel,
                fieldTranslation.sourceKeys,
            );
        }
        const values: { fullName: string; label?: string }[] =
            objectFields.get(name)?.valueSet?.values ?? [];
        (fieldTranslation.picklistValues ?? []).forEach((value) => {
            const matched = values.find(
                (v) =>
                    (v.label ?? v.fullName) === value.masterLabel ||
                    v.fullName === value.masterLabel,
            );
            add(
                'picklistValue',
                `${name}.${matched?.fullName ?? value.masterLabel}`,
                value.translation,
                value.sourceKeys,
            );
        });
    });

    const named = (
        kind: TranslationItemKind,
        members: TranslationMemberJson[] | undefined,
        text: (member: Record<string, unknown>) => unknown,
    ) =>
        (members ?? []).forEach((member) => {
            const value = text(member as unknown as Record<string, unknown>);
            add(
                kind,
                (member as unknown as { name: string }).name,
                typeof value === 'string' ? value : undefined,
                member.sourceKeys,
            );
        });
    named('validationRule', translation.validationRules, (m) => m.errorMessage);
    named('recordType', translation.recordTypes, (m) => m.label);
    named('webLink', translation.webLinks, (m) => m.label);
    named('fieldSet', translation.fieldSets, (m) => m.label);
    return translations;
};

/** オブジェクトに定義がないと言える名前か (標準項目などは、オブジェクトのファイルがなくても存在する) */
const isCustomName = (kind: TranslationItemKind, name: string): boolean => {
    const fieldName = kind === 'picklistValue' ? name.split('.')[0]! : name;
    return kind === 'fieldLabel' ||
        kind === 'fieldHelp' ||
        kind === 'relationshipLabel' ||
        kind === 'picklistValue'
        ? fieldName.endsWith('__c')
        : true;
};

const ORDER: TranslationItemKind[] = [
    'fieldLabel',
    'fieldHelp',
    'relationshipLabel',
    'picklistValue',
    'validationRule',
    'recordType',
    'webLink',
    'fieldSet',
];

const emptyCounts = (): Record<TranslationStatus, number> => ({
    translated: 0,
    missing: 0,
    sameAsSource: 0,
    orphan: 0,
    outdated: 0,
});

export type TranslationCoverageOptions = {
    /** 古い翻訳 (outdated) を見るときの、前の時点のオブジェクトと翻訳 */
    before?: { object?: CustomObjectJson; translation?: CustomObjectTranslationJson };
};

/** 1 つの言語の翻訳の網羅。object は同じ時点の、翻訳先のオブジェクト (ないときは undefined) */
export const analyzeTranslationCoverage = (
    translation: CustomObjectTranslationJson,
    object: CustomObjectJson | undefined,
    options: TranslationCoverageOptions = {},
): TranslationCoverage => {
    const sources = object ? collectSources(object) : new Map<string, never>();
    const translations = collectTranslations(translation, object);

    const beforeSources = options.before?.object
        ? collectSources(options.before.object)
        : undefined;
    const beforeTranslations = options.before?.translation
        ? collectTranslations(options.before.translation, options.before.object)
        : undefined;

    const keys = [...new Set([...sources.keys(), ...translations.keys()])];
    const items = keys.map((key): TranslationCoverageItem => {
        const source = sources.get(key);
        const translated = translations.get(key);
        const { kind, name } = (source ?? translated)!;
        const text = translated?.translation;
        const sourceKeys = {
            ...(source?.sourceKeys ? { object: source.sourceKeys } : {}),
            ...(translated?.sourceKeys ? { translation: translated.sourceKeys } : {}),
        };
        const base = {
            kind,
            name,
            ...(source?.source !== undefined ? { source: source.source } : {}),
            ...(text !== undefined ? { translation: text } : {}),
            sourceKeys,
        };

        if (!source) {
            // オブジェクトにない。オブジェクトがない標準オブジェクトや標準項目は、存在しないとは言えない
            const unknown = !object && !translation.objectApiName.includes('__');
            return {
                ...base,
                status: unknown || !isCustomName(kind, name) ? 'translated' : 'orphan',
            };
        }
        if (text === undefined || text === '') {
            return { ...base, status: 'missing' };
        }
        const beforeSource = beforeSources?.get(key)?.source;
        const beforeText = beforeTranslations?.get(key)?.translation;
        if (
            beforeSource !== undefined &&
            beforeText !== undefined &&
            beforeSource !== source.source &&
            beforeText === text
        ) {
            return { ...base, status: 'outdated' };
        }
        return { ...base, status: text === source.source ? 'sameAsSource' : 'translated' };
    });

    items.sort(
        (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.name.localeCompare(b.name),
    );
    const counts = emptyCounts();
    items.forEach((item) => counts[item.status]++);

    return {
        id: `${translation.objectApiName}-${translation.locale}`,
        objectApiName: translation.objectApiName,
        locale: translation.locale,
        objectFound: object !== undefined,
        items,
        counts,
    };
};

/**
 * 翻訳の一覧の網羅。objects は同じ時点のオブジェクト。before を渡すと、前の時点との比較で古い翻訳も見る
 */
export const analyzeTranslationCoverages = (
    translations: CustomObjectTranslationJson[],
    objects: CustomObjectJson[],
    before?: { translations: CustomObjectTranslationJson[]; objects: CustomObjectJson[] },
): TranslationCoverage[] => {
    const objectByName = new Map(objects.map((object) => [object.apiName, object]));
    const beforeObjectByName = new Map(
        (before?.objects ?? []).map((object) => [object.apiName, object]),
    );
    const beforeTranslationById = new Map(
        (before?.translations ?? []).map((t) => [`${t.objectApiName}-${t.locale}`, t]),
    );
    return translations
        .map((translation) => {
            const beforeObject = beforeObjectByName.get(translation.objectApiName);
            const beforeTranslation = beforeTranslationById.get(
                `${translation.objectApiName}-${translation.locale}`,
            );
            return analyzeTranslationCoverage(
                translation,
                objectByName.get(translation.objectApiName),
                before
                    ? {
                          before: {
                              ...(beforeObject ? { object: beforeObject } : {}),
                              ...(beforeTranslation ? { translation: beforeTranslation } : {}),
                          },
                      }
                    : {},
            );
        })
        .sort((a, b) => a.id.localeCompare(b.id));
};
