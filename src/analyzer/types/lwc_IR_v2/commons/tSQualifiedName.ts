import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSQualifiedName, type TSQualifiedName } from '@babel/types';
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

export type TSQualifiedNameFields = TypeField<'tSQualifiedName'> & {
    left: TSEntityNameTypeClass;
    right: IdentifierTypeClass;
};

export class TSQualifiedNameTypeClass extends LwcCommonTypeClass<
    'tSQualifiedName',
    TSQualifiedNameFields
> {
    private constructor(value: FieldsOf<TSQualifiedNameFields>, sourceSpan: SourceSpan) {
        super('tSQualifiedName', value, sourceSpan);
    }

    static create(target: TSQualifiedName, originalSource: string): TSQualifiedNameTypeClass {
        return new TSQualifiedNameTypeClass(
            {
                left: visitNode(
                    target.left,
                    originalSource,
                    tSEntityNameVisitorEvaluatePairs(),
                    'TSEntityNameVisitor',
                ),
                right: IdentifierTypeClass.create(target.right, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLeft(): TSQualifiedNameFields['left'] {
        return this.getFields().left;
    }

    getRight(): TSQualifiedNameFields['right'] {
        return this.getFields().right;
    }
}

export const tSQualifiedNameTypePair: EvaluatePair<TSQualifiedName, TSQualifiedNameTypeClass> =
    makeEvaluatePair(isTSQualifiedName, (target, originalSource) =>
        TSQualifiedNameTypeClass.create(target, originalSource),
    );

export const isTSQualifiedNameType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSQualifiedNameTypeClass => target instanceof TSQualifiedNameTypeClass;
