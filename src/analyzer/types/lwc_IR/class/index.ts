import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { ClassExpressionTypeClass, classExpressionTypePair } from '../commons/classExpression';
import { ClassDeclarationTypeClass, classDeclarationTypePair } from '../commons/classDeclaration';

export {
    ClassExpressionTypeClass,
    classExpressionTypePair,
    isClassExpressionType,
} from '../commons/classExpression';
export {
    ClassDeclarationTypeClass,
    classDeclarationTypePair,
    isClassDeclarationType,
} from '../commons/classDeclaration';

const classVisitorEvaluatePairs = [classExpressionTypePair, classDeclarationTypePair] as const;

export class ClassVisitor extends LwcCommonVisitor<(typeof classVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = classVisitorEvaluatePairs;
}

export type ClassTypeClass = ClassExpressionTypeClass | ClassDeclarationTypeClass;

export const isClassType = (target: LwcCommonTypeClass<string>): target is ClassTypeClass => {
    return (
        target instanceof ClassExpressionTypeClass || target instanceof ClassDeclarationTypeClass
    );
};
