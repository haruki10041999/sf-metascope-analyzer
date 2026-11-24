// LWC の JSON の「形」を比べるテストの補助 (docs/plan.md 4.3 の 4)。
// P1 (すべて JsonType にする) で、kind を持たなかった入れ物・入れ子の型・宣言の名前の位置もノードになった。
// 形のテストは構造 (プロパティと値) を確かめるもので、ノードかどうかは test/converter/json-node-coverage.test.ts が
// 確かめるので、ここでは P1 で足したものを除いて比べる

/** P1 でノードにした入れ物の kind (形のテストでは除く) */
export const P1_CONTAINER_KINDS: ReadonlySet<string> = new Set([
    'jsIfBranch',
    'jsSwitchCase',
    'jsTryClause',
    'jsForControl',
    'lwcModifiers',
    'lwcFunction',
    'lwcAccessor',
    'lwcWire',
    'lwcApexRef',
    'lwcSchemaRef',
    'lwcTypeMember',
    'lwcTypeIndexer',
    'lwcTypeParam',
    'lwcModule',
    'lwcExpression',
    'lwcValue',
    'lwcComponentRef',
    'lwcMetadataRef',
    'cssDeclaration',
    // メタデータ (metadata 8・object 7・objectTranslation 2)
    'criterionValue',
    'flexiPageVisibilityRule',
    'flowEdge',
    'layoutPosition',
    'fieldSetItem',
    'objectNameField',
    'objectSearchLayouts',
    'valueSet',
    'picklistValueSetting',
    'lookupFilter',
    'layoutSectionTranslation',
    'caseValue',
    'markupAttribute',
    'auraJavascript',
]);

/** 入れ子の型 (型の中の型・メンバーの型など)。P1 から lwcType のノード */
const NESTED_TYPE_KEYS: ReadonlySet<string> = new Set([
    'generic',
    'elementType',
    'elementTypes',
    'types',
    'memberType',
    'keyType',
    'valueType',
    'paramType',
    'returnType',
    'spreads',
    'checkType',
    'extendsType',
    'trueType',
    'falseType',
    'constraint',
    'nameType',
    'objectType',
    'indexType',
    'argument',
    'typeArguments',
    'predicateType',
    'supertype',
]);

/**
 * 位置 (sourceKeys)・名前の位置 (nameRef) と、P1 で足した kind を除いた形。
 * omitKeys はほかに除くプロパティ (text など)
 */
export const lwcShape = (
    value: unknown,
    omitKeys: ReadonlySet<string> = new Set(),
    parentKey?: string,
    insideType = false,
): unknown => {
    if (Array.isArray(value))
        return value.map((item) => lwcShape(item, omitKeys, parentKey, insideType));
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    // 型と、型の中の部品 (メンバー・インデックス・関数の型の引数)。この中の入れ子の型は P1 まで kind を持たなかった
    const isType =
        record.kind === 'lwcType' ||
        record.kind === 'lwcTypeMember' ||
        record.kind === 'lwcTypeIndexer' ||
        record.kind === 'lwcTypeParam';
    const dropKind =
        (typeof record.kind === 'string' && P1_CONTAINER_KINDS.has(record.kind)) ||
        (record.kind === 'lwcType' &&
            insideType &&
            parentKey !== undefined &&
            NESTED_TYPE_KEYS.has(parentKey));
    return Object.fromEntries(
        Object.entries(record)
            .filter(
                ([key]) =>
                    key !== 'sourceKeys' &&
                    key !== 'nameRef' &&
                    !omitKeys.has(key) &&
                    !(key === 'kind' && dropKind),
            )
            .map(([key, child]) => [key, lwcShape(child, omitKeys, key, insideType || isType)]),
    );
};

/** LWC 以外 (メタデータなど) のテストからも使う名前 */
export const p1Shape = lwcShape;
