import { isVariableDeclarator, type VariableDeclarator } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from '../commons/arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from '../commons/objectPattern';
import { voidPatternTypePair, type VoidPatternTypeClass } from '../commons/voidPattern';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

const variableDeclaratorIdPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
        ] as const,
);

export type VariableDeclaratorFields = {
    id:
        | IdentifierTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | VoidPatternTypeClass
        | LwcErrorTypeClass;
    definite: NonNullable<VariableDeclarator['definite']> | null;
    init: ExpressionTypeClass | LwcErrorTypeClass | null;
};

export class VariableDeclaratorTypeClass extends LwcCommonTypeClass<'variableDeclarator'> {
    private readonly value: VariableDeclaratorFields;

    private constructor(value: VariableDeclaratorFields) {
        super('variableDeclarator');
        this.value = value;
    }

    static create(target: VariableDeclarator, originalSource: string): VariableDeclaratorTypeClass {
        return new VariableDeclaratorTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                variableDeclaratorIdPairs(),
                'VariableDeclarator.id',
            ),
            definite: target.definite ?? null,
            init: visitOptionalNode(
                target.init,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): VariableDeclaratorFields {
        return this.value;
    }

    getId(): VariableDeclaratorFields['id'] {
        return this.value.id;
    }

    getDefinite(): VariableDeclaratorFields['definite'] {
        return this.value.definite;
    }

    getInit(): VariableDeclaratorFields['init'] {
        return this.value.init;
    }
}

export const variableDeclaratorTypePair: EvaluatePair<
    VariableDeclarator,
    VariableDeclaratorTypeClass
> = makeEvaluatePair(isVariableDeclarator, (target, originalSource) =>
    VariableDeclaratorTypeClass.create(target, originalSource),
);

export const isVariableDeclaratorType = (
    target: LwcCommonTypeClass<string>,
): target is VariableDeclaratorTypeClass => target instanceof VariableDeclaratorTypeClass;
