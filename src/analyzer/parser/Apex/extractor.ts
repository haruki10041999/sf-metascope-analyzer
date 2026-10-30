import typia from 'typia';

import {
    JsonType,
    isJsonType,
    StructureJson,
    isStructureJson,
    AnonymousUnitJson,
    ClassDeclarationJson,
    CompilationUnitJson,
    ConstructorDeclarationJson,
    ConvertKeys,
    EnumDeclarationJson,
    ErrorJson,
    FieldDeclarationJson,
    InitializerBlockJson,
    InterfaceDeclarationJson,
    isErrorJson,
    MethodDeclarationJson,
    ModifiersJson,
    PropertyDeclarationJson,
    TriggerUnitJson,
    MemberStatementJson,
    TypeJson,
    SoqlJson,
    SoslJson,
    DotMethodCallJson,
    MethodCallJson,
} from '../../types';

type RefPoint = {
    kind: string;
    index: number;
    sourceKey: ConvertKeys;
};

/** 参照先ノードの ConvertKeys (StructureJson は sourceKeys.base、JsonType は sourceKeys そのもの) */
const toConvertKeys = (sourceKeys: ConvertKeys | { base: ConvertKeys }): ConvertKeys =>
    'base' in sourceKeys ? sourceKeys.base : sourceKeys;

type OriginalDeclaration =
    | (FieldDeclarationJson & { modifier: ModifiersJson })
    | (PropertyDeclarationJson & { modifier: ModifiersJson })
    | (EnumDeclarationJson & { modifier: ModifiersJson })
    | (MethodDeclarationJson & { modifier: ModifiersJson })
    | (InterfaceDeclarationJson & { modifier: ModifiersJson })
    | (ConstructorDeclarationJson & { modifier: ModifiersJson })
    | (ClassDeclarationJson & { modifier: ModifiersJson })
    | JsonType<'notSet'>;

type ReplaceDeclarationWithRef<T> = T extends OriginalDeclaration ? RefPoint : T;
type SourceClassBlockMember = ClassDeclarationJson['block'][number];
type SourceUnitBlockMember = Exclude<
    Exclude<AnonymousUnitJson['block'], ErrorJson>[number],
    ErrorJson
>;

export type ReplacedCompilationUnitBlockMember =
    ReplaceDeclarationWithRef<SourceClassBlockMember> | ErrorJson;
export type ReplacedClassBlockMember =
    ReplaceDeclarationWithRef<ClassDeclarationJson['block'][number]> | ErrorJson;
export type ReplacedAnonymousUnitBlockMember =
    ReplaceDeclarationWithRef<SourceUnitBlockMember> | ErrorJson;
export type ReplacedTriggerUnitBlockMember = ReplacedAnonymousUnitBlockMember;

export type ReplacedCompilationUnit = Omit<
    Extract<CompilationUnitJson, { kind: 'class' }>,
    'block'
> & {
    block: ReplacedCompilationUnitBlockMember[] | ErrorJson;
};

export type ReplacedClassDeclaration = Omit<ClassDeclarationJson, 'block'> & {
    block: ReplacedClassBlockMember[] | ErrorJson;
} & { modifier: ModifiersJson };

export type ReplacedAnonymousUnit = Omit<AnonymousUnitJson, 'block'> & {
    block: ReplacedAnonymousUnitBlockMember[] | ErrorJson;
};

export type ReplacedTriggerUnit = Omit<TriggerUnitJson, 'block'> & {
    block: ReplacedTriggerUnitBlockMember[] | ErrorJson;
};

export type RefPointedStructure<
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
> = {
    path: string;
    result: {
        refPoint: RefPoint;
        data: T;
    };
};

export type RefPointedStructureArray<
    TKind extends string,
    T extends JsonType<TKind> | StructureJson<string, Record<TKind, ConvertKeys | ConvertKeys[]>>,
> = {
    kind: TKind;
    path: string;
    result: {
        refPoint: RefPoint;
        data: T;
    }[];
};

export const isRefPointedStructure =
    typia.createIs<
        RefPointedStructure<
            JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
        >
    >();

type ReplacedDeclaration =
    | ReplaceSemanticRef<
          FieldDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          PropertyDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          EnumDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          MethodDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          InterfaceDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          ConstructorDeclarationJson & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | ReplaceSemanticRef<
          ReplacedClassDeclaration & { modifier: ModifiersJson },
          SemanticJson,
          SemanticRefPoint
      >
    | JsonType<'notSet'>;

export type OriginalDeclarationReference = RefPointedStructure<OriginalDeclaration>;
export type ReplacedDeclarationReference = RefPointedStructure<ReplacedDeclaration>;

type SourceBlockMember =
    OriginalDeclaration | InitializerBlockJson | MemberStatementJson | ErrorJson;

type AnyReplacedBlockMember =
    | ReplacedCompilationUnitBlockMember
    | ReplacedClassBlockMember
    | ReplacedAnonymousUnitBlockMember
    | ReplacedTriggerUnitBlockMember;

type SemanticKind = 'type' | 'soql' | 'sosl' | 'memberAccess';
export type SemanticJson = TypeJson | SoqlJson | SoslJson | DotMethodCallJson | MethodCallJson;
export type SemanticRefPoint = {
    kind: SemanticKind;
    index: number;
    sourceKey: ConvertKeys;
};

export type SemanticReplacedCompilationUnit = ReplaceSemanticRef<
    ReplacedCompilationUnit,
    SemanticJson,
    SemanticRefPoint
>;
export type SemanticReplacedAnonymousUnit = ReplaceSemanticRef<
    ReplacedAnonymousUnit,
    SemanticJson,
    SemanticRefPoint
>;
export type SemanticReplacedTriggerUnit = ReplaceSemanticRef<
    ReplacedTriggerUnit,
    SemanticJson,
    SemanticRefPoint
>;

export const isSemanticJson = (target: unknown): target is SemanticJson => {
    return (
        (isJsonType(target) || isStructureJson(target)) &&
        ['type', 'soql', 'sosl', 'memberAccess'].includes(target.kind)
    );
};

const _replaceDeclarationRef = (
    target: SourceBlockMember[] | ErrorJson,
    path: string,
    refPoints: Record<string, RefPoint[]>,
    replacedBlocks: Record<string, AnyReplacedBlockMember[] | ErrorJson>,
    declarations: OriginalDeclarationReference[],
): void => {
    if (isErrorJson(target)) {
        replacedBlocks[path] = target;
        return;
    }

    const replacedBlock: AnyReplacedBlockMember[] = [];
    for (const b of target) {
        if (isErrorJson(b)) {
            replacedBlock.push(b);
            continue;
        }

        if (!('kind' in b) || b.kind === 'statement') {
            replacedBlock.push(b);
            continue;
        }

        const currentRefPoints = refPoints[path] ?? [];
        const index = currentRefPoints.filter((refPoint) => refPoint.kind === b.kind).length + 1;

        const refPoint: RefPoint = {
            kind: b.kind,
            index,
            sourceKey: toConvertKeys(b.sourceKeys),
        };

        (refPoints[path] ??= []).push(refPoint);
        replacedBlock.push(refPoint);

        declarations.push({
            path,
            result: {
                refPoint,
                data: b,
            },
        });

        if (b.kind === 'class') {
            const overridePath = `${path}/${b.sourceKeys.base.objectKey}`;

            _replaceDeclarationRef(b.block, overridePath, refPoints, replacedBlocks, declarations);
        }
    }

    replacedBlocks[path] = replacedBlock;
};

export const replaceDeclarationRef = (
    target: Extract<CompilationUnitJson, { kind: 'class' }> | AnonymousUnitJson | TriggerUnitJson,
    path: string,
): {
    unit:
        | SemanticReplacedCompilationUnit
        | SemanticReplacedAnonymousUnit
        | SemanticReplacedTriggerUnit;
    declarations: ReplacedDeclarationReference[];
    semantic: RefPointedStructureArray<
        'type' | 'soql' | 'sosl' | 'memberAccess',
        TypeJson | SoqlJson | SoslJson | DotMethodCallJson | MethodCallJson
    >[];
} => {
    const refPoints: Record<string, RefPoint[]> = {};
    const replacedBlocks: Record<string, AnyReplacedBlockMember[] | ErrorJson> = {};
    const declarations: OriginalDeclarationReference[] = [];
    const replacedDeclarations: ReplacedDeclarationReference[] = [];
    const extarctSemantics: RefPointedStructureArray<
        'type' | 'soql' | 'sosl' | 'memberAccess',
        TypeJson | SoqlJson | SoslJson | DotMethodCallJson | MethodCallJson
    >[] = [];

    const { block, ...rest } = target;
    _replaceDeclarationRef(block, path, refPoints, replacedBlocks, declarations);

    const replacedBaseUnit: ReplacedCompilationUnit | ReplacedAnonymousUnit | ReplacedTriggerUnit =
        {
            ...rest,
            block: (replacedBlocks[path] ?? []) as
                | ReplacedCompilationUnitBlockMember[]
                | ReplacedAnonymousUnitBlockMember[]
                | ReplacedTriggerUnitBlockMember[]
                | ErrorJson,
        } as ReplacedCompilationUnit | ReplacedAnonymousUnit | ReplacedTriggerUnit;

    // トップレベルの文 (トリガー本体・匿名ブロック等) の semantic はユニット自身の path に付ける
    const { base: semanticReplacedUnit, refPoints: unitRefPoints } = replaceSemanticRef<
        typeof replacedBaseUnit,
        SemanticKind,
        SemanticJson,
        SemanticRefPoint
    >(replacedBaseUnit, path, isSemanticJson);

    extarctSemantics.push(...unitRefPoints.values());

    declarations.forEach((b) => {
        if (b.result.data.kind === 'notSet') {
            replacedDeclarations.push({
                path: b.path,
                result: {
                    refPoint: b.result.refPoint,
                    data: b.result.data,
                },
            });
        } else {
            if (b.result.data.kind !== 'class') {
                // semantic は宣言ごとに番号を振るため、宣言自身の path を付ける
                const sourceKeys = b.result.data.sourceKeys;
                const declarationPath = `${b.path}/${'base' in sourceKeys ? sourceKeys.base.objectKey : sourceKeys.objectKey}`;

                const { base, refPoints: newRefPoints } = replaceSemanticRef<
                    typeof b.result.data,
                    SemanticKind,
                    SemanticJson,
                    SemanticRefPoint
                >(b.result.data, declarationPath, isSemanticJson);

                extarctSemantics.push(...newRefPoints.values());

                replacedDeclarations.push({
                    path: b.path,
                    result: {
                        refPoint: b.result.refPoint,
                        data: base as ReplacedDeclaration,
                    },
                });
            } else {
                const classPath = `${b.path}/${b.result.data.sourceKeys.base.objectKey}`;

                const { block: _originalBlock, ...rest } = b.result.data;

                const replaced: ReplacedClassDeclaration = {
                    ...rest,
                    block: (replacedBlocks[classPath] ?? []) as
                        ReplacedClassBlockMember[] | ErrorJson,
                };

                const { base, refPoints: newRefPoints } = replaceSemanticRef<
                    ReplacedClassDeclaration,
                    SemanticKind,
                    SemanticJson,
                    SemanticRefPoint
                >(replaced, classPath, isSemanticJson);

                extarctSemantics.push(...newRefPoints.values());

                replacedDeclarations.push({
                    path: b.path,
                    result: {
                        refPoint: b.result.refPoint,
                        data: base,
                    },
                });
            }
        }
    });

    return {
        unit: semanticReplacedUnit as
            | SemanticReplacedCompilationUnit
            | SemanticReplacedAnonymousUnit
            | SemanticReplacedTriggerUnit,
        declarations: replacedDeclarations,
        semantic: extarctSemantics,
    };
};

type ReplaceSemanticRefNode<T, Target, ReplaceRef extends RefPoint> = T extends Target
    ? ReplaceRef
    : T extends readonly unknown[]
      ? { [K in keyof T]: ReplaceSemanticRefNode<T[K], Target, ReplaceRef> }
      : T extends object
        ? { [K in keyof T]: ReplaceSemanticRefNode<T[K], Target, ReplaceRef> }
        : T;

export type ReplaceSemanticRef<
    T,
    Target extends
        JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
    ReplaceRef extends RefPoint,
> = ReplaceSemanticRefNode<T, Target, ReplaceRef>;

const _replaceSemanticRef = <
    TKind extends string,
    Target extends
        JsonType<TKind> | StructureJson<TKind, Record<string, ConvertKeys | ConvertKeys[]>>,
    ReplaceRef extends RefPoint,
>(
    target: unknown,
    path: string,
    refPoints: Map<TKind, RefPointedStructureArray<TKind, Target>>,
    isTargetJson: (target: unknown) => target is Target,
): ReplaceSemanticRefNode<unknown, Target, ReplaceRef> => {
    if (Array.isArray(target)) {
        return target.map((t) =>
            _replaceSemanticRef(t, path, refPoints, isTargetJson),
        ) as ReplaceSemanticRefNode<unknown, Target, ReplaceRef>;
    }

    if (target === null || typeof target !== 'object') {
        return target as ReplaceSemanticRefNode<unknown, Target, ReplaceRef>;
    }

    if (isTargetJson(target)) {
        const kind = target.kind;

        let refPointedArray: RefPointedStructureArray<TKind, Target> | undefined =
            refPoints.get(kind);

        if (!refPointedArray) {
            refPointedArray = {
                kind: kind,
                path: path,
                result: [],
            };
            refPoints.set(kind, refPointedArray);
        }

        const index = refPointedArray.result.length + 1;

        const refPoint: RefPoint = {
            kind,
            index,
            sourceKey: toConvertKeys(target.sourceKeys),
        };

        // 外側を先に登録して番号を確保してから、入れ子になった semantic も ref に置き換える
        const entry = { refPoint, data: target };
        refPointedArray.result.push(entry);
        entry.data = _replaceSemanticRefChildren(target, path, refPoints, isTargetJson) as Target;

        return refPoint as ReplaceSemanticRefNode<unknown, Target, ReplaceRef>;
    }

    return _replaceSemanticRefChildren(
        target,
        path,
        refPoints,
        isTargetJson,
    ) as ReplaceSemanticRefNode<unknown, Target, ReplaceRef>;
};

const _replaceSemanticRefChildren = <
    TKind extends string,
    Target extends
        JsonType<TKind> | StructureJson<TKind, Record<string, ConvertKeys | ConvertKeys[]>>,
>(
    target: object,
    path: string,
    refPoints: Map<TKind, RefPointedStructureArray<TKind, Target>>,
    isTargetJson: (target: unknown) => target is Target,
): Record<string, unknown> => {
    return Object.fromEntries(
        Object.entries(target).map(([key, value]) => [
            key,
            _replaceSemanticRef(value, path, refPoints, isTargetJson),
        ]),
    );
};

export const replaceSemanticRef = <
    T,
    TKind extends string,
    Target extends
        JsonType<TKind> | StructureJson<TKind, Record<string, ConvertKeys | ConvertKeys[]>>,
    ReplaceRef extends RefPoint,
>(
    target: T,
    path: string,
    isTargetJson: (target: unknown) => target is Target,
): {
    base: ReplaceSemanticRef<T, Target, ReplaceRef>;
    refPoints: Map<TKind, RefPointedStructureArray<TKind, Target>>;
} => {
    const refPoints: Map<TKind, RefPointedStructureArray<TKind, Target>> = new Map();

    const replaced = _replaceSemanticRef(target, path, refPoints, isTargetJson);

    return {
        base: replaced as ReplaceSemanticRef<T, Target, ReplaceRef>,
        refPoints,
    };
};

