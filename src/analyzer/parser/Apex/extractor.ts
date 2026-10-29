import typia from 'typia';

import {
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
    JsonType,
    MethodDeclarationJson,
    ModifiersJson,
    PropertyDeclarationJson,
    StructureJson,
    TriggerUnitJson,
    MemberStatementJson,
} from '../../types';

type RefPoint = {
    kind: string;
    index: number;
};

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

export type RefPointedDeclaration<
    T extends JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>,
> = {
    path: string;
    refPoint: RefPoint;
    declaration: T;
};

export const isRefPointedDeclaration =
    typia.createIs<
        RefPointedDeclaration<
            JsonType<string> | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
        >
    >();

type ReplacedDeclaration =
    | (FieldDeclarationJson & { modifier: ModifiersJson })
    | (PropertyDeclarationJson & { modifier: ModifiersJson })
    | (EnumDeclarationJson & { modifier: ModifiersJson })
    | (MethodDeclarationJson & { modifier: ModifiersJson })
    | (InterfaceDeclarationJson & { modifier: ModifiersJson })
    | (ConstructorDeclarationJson & { modifier: ModifiersJson })
    | (ReplacedClassDeclaration & { modifier: ModifiersJson })
    | JsonType<'notSet'>;

type OriginalDeclarationReference = RefPointedDeclaration<OriginalDeclaration>;
type ReplacedDeclarationReference = RefPointedDeclaration<ReplacedDeclaration>;

type SourceBlockMember =
    OriginalDeclaration | InitializerBlockJson | MemberStatementJson | ErrorJson;

type AnyReplacedBlockMember =
    | ReplacedCompilationUnitBlockMember
    | ReplacedClassBlockMember
    | ReplacedAnonymousUnitBlockMember
    | ReplacedTriggerUnitBlockMember;

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
        };

        (refPoints[path] ??= []).push(refPoint);
        replacedBlock.push(refPoint);

        declarations.push({
            path,
            refPoint,
            declaration: b,
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
): {
    unit: ReplacedCompilationUnit | ReplacedAnonymousUnit | ReplacedTriggerUnit;
    declarations: ReplacedDeclarationReference[];
} => {
    const refPoints: Record<string, RefPoint[]> = {};
    const replacedBlocks: Record<string, AnyReplacedBlockMember[] | ErrorJson> = {};
    const declarations: OriginalDeclarationReference[] = [];
    const replacedDeclarations: ReplacedDeclarationReference[] = [];

    const { block, ...rest } = target;
    _replaceDeclarationRef(block, '.', refPoints, replacedBlocks, declarations);

    const replacedBaseUnit: ReplacedCompilationUnit | ReplacedAnonymousUnit | ReplacedTriggerUnit =
        {
            ...rest,
            block: (replacedBlocks['.'] ?? []) as
                | ReplacedCompilationUnitBlockMember[]
                | ReplacedAnonymousUnitBlockMember[]
                | ReplacedTriggerUnitBlockMember[]
                | ErrorJson,
        } as ReplacedCompilationUnit | ReplacedAnonymousUnit | ReplacedTriggerUnit;

    declarations.forEach((b) => {
        if (b.declaration.kind !== 'class') {
            replacedDeclarations.push({
                path: b.path,
                refPoint: b.refPoint,
                declaration: b.declaration,
            });
        } else {
            const classPath = `${b.path}/${b.declaration.sourceKeys.base.objectKey}`;

            const { block: _originalBlock, ...rest } = b.declaration;

            const replaced: ReplacedClassDeclaration = {
                ...rest,
                block: (replacedBlocks[classPath] ?? []) as ReplacedClassBlockMember[] | ErrorJson,
            };

            replacedDeclarations.push({
                path: b.path,
                refPoint: b.refPoint,
                declaration: replaced,
            });
        }
    });

    return {
        unit: replacedBaseUnit,
        declarations: replacedDeclarations,
    };
};
