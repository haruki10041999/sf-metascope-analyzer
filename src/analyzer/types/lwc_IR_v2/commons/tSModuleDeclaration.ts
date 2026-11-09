import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isIdentifier,
    isStringLiteral,
    isTSModuleDeclaration,
    type TSModuleDeclaration,
} from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import { IdentifierTypeClass } from './identifier';
import { StringLiteralTypeClass } from './stringLiteral';
import { TSModuleBlockTypeClass } from './tSModuleBlock';

/**
 * kind ごとに id・body の型が決まる。
 * - global: `declare global { ... }` (id は global という識別子)
 * - module: `declare module 'x' { ... }`。本体のない `declare module 'x';` も書ける (body が null)
 * - namespace: `namespace A.B { ... }`
 */
type TSModuleDeclarationKindFields =
    | { kind: 'global'; id: IdentifierTypeClass; body: TSModuleBlockTypeClass }
    | { kind: 'module'; id: StringLiteralTypeClass; body: TSModuleBlockTypeClass | null }
    | { kind: 'namespace'; id: TSEntityNameTypeClass; body: TSModuleBlockTypeClass };

export type TSModuleDeclarationFields = TypeField<'tSModuleDeclaration'> & {
    declare: boolean;
} & TSModuleDeclarationKindFields;

const createKindFields = (
    target: TSModuleDeclaration,
    originalSource: string,
): TSModuleDeclarationKindFields => {
    // Babel の型では body は必須だが、本体のない `declare module 'x';` では body がない
    const body = (target.body as TSModuleDeclaration['body'] | null | undefined) ?? null;
    const block = body == null ? null : TSModuleBlockTypeClass.create(body, originalSource);
    const requireBlock = (): TSModuleBlockTypeClass =>
        block ??
        failIrBuild(
            'TYPE_MISMATCH',
            target,
            originalSource,
            `${target.kind} の宣言には本体が要ります`,
        );

    switch (target.kind) {
        case 'global':
            return isIdentifier(target.id)
                ? {
                      kind: 'global',
                      id: IdentifierTypeClass.create(target.id, originalSource),
                      body: requireBlock(),
                  }
                : failIrBuild('TYPE_MISMATCH', target, originalSource, 'global の id は識別子です');
        case 'module':
            return isStringLiteral(target.id)
                ? {
                      kind: 'module',
                      id: StringLiteralTypeClass.create(target.id, originalSource),
                      body: block,
                  }
                : failIrBuild(
                      'TYPE_MISMATCH',
                      target,
                      originalSource,
                      'declare module の名前は文字列です',
                  );
        case 'namespace':
            return isStringLiteral(target.id)
                ? failIrBuild(
                      'TYPE_MISMATCH',
                      target,
                      originalSource,
                      'namespace の名前は識別子です',
                  )
                : {
                      kind: 'namespace',
                      id: visitNode(
                          target.id,
                          originalSource,
                          tSEntityNameVisitorEvaluatePairs(),
                          'TSEntityNameVisitor',
                      ),
                      body: requireBlock(),
                  };
    }
};

export class TSModuleDeclarationTypeClass extends LwcCommonTypeClass<
    'tSModuleDeclaration',
    TSModuleDeclarationFields
> {
    private constructor(value: FieldsOf<TSModuleDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSModuleDeclaration', value, sourceSpan);
    }

    static create(
        target: TSModuleDeclaration,
        originalSource: string,
    ): TSModuleDeclarationTypeClass {
        return new TSModuleDeclarationTypeClass(
            {
                declare: target.declare ?? false,
                ...createKindFields(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): TSModuleDeclarationFields['kind'] {
        return this.getFields().kind;
    }

    getDeclare(): TSModuleDeclarationFields['declare'] {
        return this.getFields().declare;
    }

    getId(): TSModuleDeclarationFields['id'] {
        return this.getFields().id;
    }

    getBody(): TSModuleDeclarationFields['body'] {
        return this.getFields().body;
    }
}

export const tSModuleDeclarationTypePair: EvaluatePair<
    TSModuleDeclaration,
    TSModuleDeclarationTypeClass
> = makeEvaluatePair(isTSModuleDeclaration, (target, originalSource) =>
    TSModuleDeclarationTypeClass.create(target, originalSource),
);

export const isTSModuleDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSModuleDeclarationTypeClass => target instanceof TSModuleDeclarationTypeClass;
