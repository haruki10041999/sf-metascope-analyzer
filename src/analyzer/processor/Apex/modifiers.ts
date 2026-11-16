import type { AnnotationJson, ModifierJson, ModifiersJson } from '../../types';

// 修飾子・アノテーションの分類 (docs/json-redesign-plan.md の段階 A5、決めたこと 5)。
// 分類は名前で決まる派生の情報なので JSON に持たず、ここで出す。名前の大文字・小文字は区別しない

/** 修飾子の分類 */
export type ApexModifierCategory =
    'access' | 'declaration' | 'webService' | 'test' | 'sharing' | 'other';

/** アノテーションの分類 */
export type ApexAnnotationCategory =
    | 'lwcAnnotation'
    | 'flowAnnotation'
    | 'asyncAnnotation'
    | 'testAnnotation'
    | 'restAnnotation'
    | 'visualforceAnnotation'
    | 'accessAnnotation'
    | 'serializeAnnotation'
    | 'executionAnnotation'
    | 'compatibilityAnnotation'
    | 'otherAnnotation';

const MODIFIER_CATEGORIES: Readonly<Record<string, ApexModifierCategory>> = {
    public: 'access',
    private: 'access',
    protected: 'access',
    global: 'access',
    static: 'declaration',
    final: 'declaration',
    abstract: 'declaration',
    virtual: 'declaration',
    override: 'declaration',
    webservice: 'webService',
    testmethod: 'test',
    with_sharing: 'sharing',
    without_sharing: 'sharing',
    inherited_sharing: 'sharing',
};

const ANNOTATION_CATEGORIES: Readonly<Record<string, ApexAnnotationCategory>> = {
    auraenabled: 'lwcAnnotation',
    invocablemethod: 'flowAnnotation',
    invocablevariable: 'flowAnnotation',
    future: 'asyncAnnotation',
    istest: 'testAnnotation',
    testsetup: 'testAnnotation',
    testvisible: 'testAnnotation',
    restresource: 'restAnnotation',
    httpdelete: 'restAnnotation',
    httpget: 'restAnnotation',
    httppatch: 'restAnnotation',
    httppost: 'restAnnotation',
    httpput: 'restAnnotation',
    remoteaction: 'visualforceAnnotation',
    namespaceaccessible: 'accessAnnotation',
    jsonaccess: 'serializeAnnotation',
    readonly: 'executionAnnotation',
    deprecated: 'compatibilityAnnotation',
    suppresswarnings: 'compatibilityAnnotation',
};

/** 修飾子・アノテーション 1 つの分類 (TRANSIENT などどれにも当たらないものは other / otherAnnotation) */
export const apexModifierCategoryOf = (
    item: ModifierJson | AnnotationJson,
): ApexModifierCategory | ApexAnnotationCategory =>
    item.kind === 'modifier'
        ? (MODIFIER_CATEGORIES[item.name.toLowerCase()] ?? 'other')
        : (ANNOTATION_CATEGORIES[item.name.toLowerCase()] ?? 'otherAnnotation');

/** 修飾子とアノテーションを、書いた順 (修飾子、アノテーションの順) に 1 つの並びにする */
export const apexModifierItemsOf = (
    modifiers: ModifiersJson | undefined,
): (ModifierJson | AnnotationJson)[] => [
    ...(modifiers?.keyword ?? []),
    ...(modifiers?.annotation ?? []),
];

/** アノテーションを持つか (名前の大文字・小文字は区別しない) */
export const hasApexAnnotation = (modifiers: ModifiersJson | undefined, name: string): boolean =>
    (modifiers?.annotation ?? []).some((a) => a.name.toLowerCase() === name.toLowerCase());
