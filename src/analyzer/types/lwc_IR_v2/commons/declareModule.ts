import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareModule, type DeclareModule } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const declareModuleIdPairs = lazyPairs(() => [identifierTypePair, stringLiteralTypePair] as const);

export type DeclareModuleFields = TypeField<'declareModule'> & {
    id: IdentifierTypeClass | StringLiteralTypeClass;
    body: BlockStatementTypeClass;
    kind: NonNullable<DeclareModule['kind']> | null;
};

export class DeclareModuleTypeClass extends LwcCommonTypeClass<
    'declareModule',
    DeclareModuleFields
> {
    private constructor(value: FieldsOf<DeclareModuleFields>, sourceSpan: SourceSpan) {
        super('declareModule', value, sourceSpan);
    }

    static create(target: DeclareModule, originalSource: string): DeclareModuleTypeClass {
        return new DeclareModuleTypeClass(
            {
                id: visitNode(
                    target.id,
                    originalSource,
                    declareModuleIdPairs(),
                    'DeclareModule.id',
                ),
                body: BlockStatementTypeClass.create(target.body, originalSource),
                kind: target.kind ?? null,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareModuleFields['id'] {
        return this.getFields().id;
    }

    getBody(): DeclareModuleFields['body'] {
        return this.getFields().body;
    }

    getKind(): DeclareModuleFields['kind'] {
        return this.getFields().kind;
    }
}

export const declareModuleTypePair: EvaluatePair<DeclareModule, DeclareModuleTypeClass> =
    makeEvaluatePair(isDeclareModule, (target, originalSource) =>
        DeclareModuleTypeClass.create(target, originalSource),
    );

export const isDeclareModuleType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareModuleTypeClass => target instanceof DeclareModuleTypeClass;
