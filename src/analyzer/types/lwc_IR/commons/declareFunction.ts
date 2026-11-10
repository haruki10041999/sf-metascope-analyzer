import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareFunction, type DeclareFunction } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    flowPredicateVisitorEvaluatePairs,
    type FlowPredicateTypeClass,
} from '../flowPredicateVisitor';
import { IdentifierTypeClass } from './identifier';

export type DeclareFunctionFields = TypeField<'declareFunction'> & {
    id: IdentifierTypeClass;
    predicate: FlowPredicateTypeClass | null;
};

export class DeclareFunctionTypeClass extends LwcCommonTypeClass<
    'declareFunction',
    DeclareFunctionFields
> {
    private constructor(value: FieldsOf<DeclareFunctionFields>, sourceSpan: SourceSpan) {
        super('declareFunction', value, sourceSpan);
    }

    static create(target: DeclareFunction, originalSource: string): DeclareFunctionTypeClass {
        return new DeclareFunctionTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                predicate: visitOptionalNode(
                    target.predicate,
                    originalSource,
                    flowPredicateVisitorEvaluatePairs(),
                    'FlowPredicateVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareFunctionFields['id'] {
        return this.getFields().id;
    }

    getPredicate(): DeclareFunctionFields['predicate'] {
        return this.getFields().predicate;
    }
}

export const declareFunctionTypePair: EvaluatePair<DeclareFunction, DeclareFunctionTypeClass> =
    makeEvaluatePair(isDeclareFunction, (target, originalSource) =>
        DeclareFunctionTypeClass.create(target, originalSource),
    );

export const isDeclareFunctionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareFunctionTypeClass => target instanceof DeclareFunctionTypeClass;
