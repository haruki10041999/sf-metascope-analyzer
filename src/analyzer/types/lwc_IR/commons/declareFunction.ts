import { isDeclareFunction, type DeclareFunction } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import {
    flowPredicateVisitorEvaluatePairs,
    type FlowPredicateTypeClass,
} from '../flowPredicateVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const declareFunctionIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type DeclareFunctionFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    predicate: FlowPredicateTypeClass | LwcErrorTypeClass | null;
};

export class DeclareFunctionTypeClass extends LwcCommonTypeClass<'declareFunction'> {
    private readonly value: DeclareFunctionFields;

    private constructor(value: DeclareFunctionFields) {
        super('declareFunction');
        this.value = value;
    }

    static create(target: DeclareFunction, originalSource: string): DeclareFunctionTypeClass {
        return new DeclareFunctionTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                declareFunctionIdPairs(),
                'DeclareFunction.id',
            ),
            predicate: visitOptionalNode(
                target.predicate,
                originalSource,
                flowPredicateVisitorEvaluatePairs(),
                'FlowPredicateVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareFunctionFields {
        return this.value;
    }

    getId(): DeclareFunctionFields['id'] {
        return this.value.id;
    }

    getPredicate(): DeclareFunctionFields['predicate'] {
        return this.value.predicate;
    }
}

export const declareFunctionTypePair: EvaluatePair<DeclareFunction, DeclareFunctionTypeClass> =
    makeEvaluatePair(isDeclareFunction, (target, originalSource) =>
        DeclareFunctionTypeClass.create(target, originalSource),
    );

export const isDeclareFunctionType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareFunctionTypeClass => target instanceof DeclareFunctionTypeClass;
