import {
    ConvertKeys,
    CustomFieldJson,
    CustomObjectJson,
    ObjectType,
    isErrorJson,
} from '../../types';

// 方針: docs/metadata-json-reference.md 4 章
// 1 つの時点の CustomObjectJson から情報を取り出す。Diff には依存しない (Apex の analysis と同じ分け方)。

/** 項目の値の型。Salesforce の項目の型 (Checkbox / Currency など) を、扱う値の種類にまとめたもの */
export type FieldValueType =
    'Id' | 'String' | 'Double' | 'Integer' | 'Boolean' | 'Date' | 'DateTime' | 'Time' | 'Reference';

export type RelationType = 'Lookup' | 'MasterDetail';

export type ObjectFieldInfo = {
    apiName: string;
    /** implicit はメタデータのファイルがなく、すべてのオブジェクトにある標準項目 (Id / CreatedDate など) */
    origin: 'metadata' | 'implicit';
    valueType: FieldValueType;
    /** Salesforce の項目の型 (メタデータの type)。implicit の項目は持たない */
    fieldType?: string;
    label?: string;
    /** 項目自体が必須 (required、または主従関係)。必須のときだけ持つ */
    required?: true;
    reference?: { objectApiName: string; relationType: RelationType; relationshipName?: string };
    /** 元の field の sourceKeys (implicit の項目は持たない) */
    sourceKeys?: ConvertKeys;
};

export type ObjectInfo = {
    apiName: string;
    objectType: ObjectType;
    label?: string;
    fields: ObjectFieldInfo[];
    sourceKeys: ConvertKeys;
};

/** 参照関係。parent の項目 (Lookup / MasterDetail) が child のオブジェクトを参照する */
export type ObjectDependency = {
    parentObjectApiName: string;
    parentFieldApiName: string;
    childObjectApiName: string;
    type: RelationType;
};

/** Salesforce の項目の型から、値の型を決める */
export const getFieldValueType = (
    field: Pick<CustomFieldJson, 'type' | 'scale'>,
): FieldValueType => {
    switch (field.type) {
        case 'Checkbox':
            return 'Boolean';
        case 'Number':
        case 'Currency':
        case 'Percent':
            return field.scale === 0 ? 'Integer' : 'Double';
        case 'Summary':
            return 'Double';
        case 'Date':
            return 'Date';
        case 'DateTime':
            return 'DateTime';
        case 'Time':
            return 'Time';
        case 'Lookup':
        case 'MasterDetail':
        case 'Hierarchy':
            return 'Reference';
        default:
            return 'String';
    }
};

const userLookup = (apiName: string, relationshipName: string): ObjectFieldInfo => ({
    apiName,
    origin: 'implicit',
    valueType: 'Reference',
    reference: { objectApiName: 'User', relationType: 'Lookup', relationshipName },
});

/** メタデータのファイルを持たないが、どのオブジェクトにもある標準項目 */
export const getImplicitFields = (objectType: ObjectType): ObjectFieldInfo[] => {
    const field = (apiName: string, valueType: FieldValueType): ObjectFieldInfo => ({
        apiName,
        origin: 'implicit',
        valueType,
    });
    return [
        field('Id', 'Id'),
        field('Name', 'String'),
        field('CreatedDate', 'DateTime'),
        userLookup('CreatedById', 'CreatedBy'),
        field('LastModifiedDate', 'DateTime'),
        userLookup('LastModifiedById', 'LastModifiedBy'),
        // カスタムメタデータ型は削除フラグ・システム更新日時を持たない
        ...(objectType === 'customMetadata'
            ? []
            : [field('SystemModstamp', 'DateTime'), field('IsDeleted', 'Boolean')]),
    ];
};

const toFieldInfo = (field: CustomFieldJson): ObjectFieldInfo => {
    const relationType =
        field.type === 'Lookup' || field.type === 'MasterDetail' ? field.type : undefined;
    return {
        apiName: field.apiName,
        origin: 'metadata',
        valueType: getFieldValueType(field),
        ...(field.type !== undefined ? { fieldType: field.type } : {}),
        ...(field.label !== undefined ? { label: field.label } : {}),
        ...(field.required === true || field.type === 'MasterDetail'
            ? { required: true as const }
            : {}),
        ...(relationType && field.referenceTo
            ? {
                  reference: {
                      objectApiName: field.referenceTo,
                      relationType,
                      ...(field.relationshipName !== undefined
                          ? { relationshipName: field.relationshipName }
                          : {}),
                  },
              }
            : {}),
        sourceKeys: field.sourceKeys,
    };
};

/** オブジェクトの項目の一覧。暗黙の標準項目のあとに、メタデータの項目を API 名の順で並べる (読めなかった項目は除く) */
export const analyzeObject = (object: CustomObjectJson): ObjectInfo => {
    const fields = (object.fields ?? []).filter(
        (field) => !isErrorJson(field),
    ) as CustomFieldJson[];
    const defined = new Set(fields.map((field) => field.apiName));
    return {
        apiName: object.apiName,
        objectType: object.objectType,
        ...(object.label !== undefined ? { label: object.label } : {}),
        fields: [
            // 標準オブジェクトで標準項目のファイルがあるときは、ファイルの方を使う
            ...getImplicitFields(object.objectType).filter((field) => !defined.has(field.apiName)),
            ...fields.map(toFieldInfo).sort((a, b) => a.apiName.localeCompare(b.apiName)),
        ],
        sourceKeys: object.sourceKeys,
    };
};

/** 参照関係の一覧 (暗黙の CreatedById → User なども含む) */
export const getObjectDependencies = (objects: ObjectInfo[]): ObjectDependency[] =>
    objects.flatMap((object) =>
        object.fields.flatMap((field) =>
            field.reference
                ? [
                      {
                          parentObjectApiName: object.apiName,
                          parentFieldApiName: field.apiName,
                          childObjectApiName: field.reference.objectApiName,
                          type: field.reference.relationType,
                      },
                  ]
                : [],
        ),
    );

export const getDependencyKey = (dependency: ObjectDependency): string =>
    `${dependency.parentObjectApiName}.${dependency.parentFieldApiName}->${dependency.childObjectApiName}`;

/**
 * targets から参照関係を depth 段たどって届くオブジェクトの API 名 (targets を含む)。
 * parent → child の向き (参照している側から、参照されている側へ) にたどる
 */
export const getRelatedObjectApiNames = (
    dependencies: ObjectDependency[],
    targets: string[],
    depth = 1,
): string[] => {
    if (!Number.isInteger(depth) || depth <= 0) {
        return [];
    }
    const related = new Set(targets);
    let frontier = new Set(targets);
    for (let level = 1; level < depth && frontier.size > 0; level++) {
        const next = new Set<string>();
        dependencies
            .filter((dependency) => frontier.has(dependency.parentObjectApiName))
            .forEach((dependency) => {
                if (!related.has(dependency.childObjectApiName)) {
                    related.add(dependency.childObjectApiName);
                    next.add(dependency.childObjectApiName);
                }
            });
        frontier = next;
    }
    return [...related];
};
