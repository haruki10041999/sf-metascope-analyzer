import { isDeclareModule, type DeclareModule } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const declareModuleIdPairs = lazyPairs(() => [identifierTypePair, stringLiteralTypePair] as const);
const declareModuleBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type DeclareModuleFields = {
    id: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
    kind: NonNullable<DeclareModule['kind']> | null;
};

export class DeclareModuleTypeClass extends LwcCommonTypeClass<'declareModule'> {
    private readonly value: DeclareModuleFields;

    private constructor(value: DeclareModuleFields) {
        super('declareModule');
        this.value = value;
    }

    static create(target: DeclareModule, originalSource: string): DeclareModuleTypeClass {
        return new DeclareModuleTypeClass({
            id: visitNode(target.id, originalSource, declareModuleIdPairs(), 'DeclareModule.id'),
            body: visitNode(
                target.body,
                originalSource,
                declareModuleBodyPairs(),
                'DeclareModule.body',
            ),
            kind: target.kind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareModuleFields {
        return this.value;
    }

    getId(): DeclareModuleFields['id'] {
        return this.value.id;
    }

    getBody(): DeclareModuleFields['body'] {
        return this.value.body;
    }

    getKind(): DeclareModuleFields['kind'] {
        return this.value.kind;
    }
}

export const declareModuleTypePair: EvaluatePair<DeclareModule, DeclareModuleTypeClass> =
    makeEvaluatePair(isDeclareModule, (target, originalSource) =>
        DeclareModuleTypeClass.create(target, originalSource),
    );

export const isDeclareModuleType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareModuleTypeClass => target instanceof DeclareModuleTypeClass;
