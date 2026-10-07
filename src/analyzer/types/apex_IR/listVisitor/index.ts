import {
    ExpressionListContext,
    FieldNameListContext,
    FormalParameterListContext,
    TypeListContext,
    ValueListContext,
    UpdateListContext,
    NetworkListContext,
    FromNameListContext,
    FieldGroupByListContext,
    FieldOrderListContext,
    SelectListContext,
    SubFieldListContext,
    FieldListContext,
    FieldSpecListContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ListTypeClass } from './base';

import { TypeListTypeClass } from './typeList';
import { ExpressionListTypeClass } from './expressionList';
import { FieldNameListTypeClass } from './fieldNameList';
import { FormalParameterListTypeClass } from './formalParameterList';
import { ValueListTypeClass } from './valueList';
import { UpdateListTypeClass } from './updateList';
import { NetworkListTypeClass } from './networkList';
import { FromNameListTypeClass } from './fromNameList';
import { FieldGroupByListTypeClass } from './fieldGroupByList';
import { FieldOrderListTypeClass } from './fieldOrderList';
import { SelectListTypeClass } from './selectList';
import { SubFieldListTypeClass } from './subFieldList';
import { FieldListTypeClass } from './fieldList';
import { FieldSpecListTypeClass } from './fieldSpecList';

import { CommonVisitor } from '../commonVisitor';

export { isTypeListType, TypeListTypeClass } from './typeList';
export { isFormalParameterListType, FormalParameterListTypeClass } from './formalParameterList';
export { isValueListType, ValueListTypeClass } from './valueList';
export { isExpressionListType, ExpressionListTypeClass } from './expressionList';
export { isFieldNameListType, FieldNameListTypeClass } from './fieldNameList';
export {
    isFromNameListType,
    FromNameListTypeClass,
    isFromNameType,
    FromNameTypeClass,
} from './fromNameList';
export { isFieldGroupByListType, FieldGroupByListTypeClass } from './fieldGroupByList';
export { isFieldOrderListType, FieldOrderListTypeClass } from './fieldOrderList';
export { isUpdateListType, UpdateListTypeClass } from './updateList';
export { isNetworkListType, NetworkListTypeClass } from './networkList';
export { isSelectListType, SelectListTypeClass } from './selectList';
export { isSubFieldListType, SubFieldListTypeClass } from './subFieldList';
export {
    isFieldListType,
    FieldListTypeClass,
    isSoslFieldType,
    SoslFieldTypeClass,
} from './fieldList';
export { isFieldSpecListType, FieldSpecListTypeClass } from './fieldSpecList';

export class ListVisitor extends CommonVisitor<ListTypeClass<unknown>> {
    visitTypeList(ctx: TypeListContext) {
        return TypeListTypeClass.create(ctx);
    }
    visitExpressionList(ctx: ExpressionListContext) {
        return ExpressionListTypeClass.create(ctx);
    }

    visitFormalParameterList(ctx: FormalParameterListContext) {
        return FormalParameterListTypeClass.create(ctx);
    }

    visitValueList(ctx: ValueListContext) {
        return ValueListTypeClass.create(ctx);
    }

    visitFieldNameList(ctx: FieldNameListContext) {
        return FieldNameListTypeClass.create(ctx);
    }

    visitUpdateList(ctx: UpdateListContext) {
        return UpdateListTypeClass.create(ctx);
    }

    visitNetworkList(ctx: NetworkListContext) {
        return NetworkListTypeClass.create(ctx);
    }

    visitFromNameList(ctx: FromNameListContext) {
        return FromNameListTypeClass.create(ctx);
    }

    visitFieldGroupByList(ctx: FieldGroupByListContext) {
        return FieldGroupByListTypeClass.create(ctx);
    }

    visitFieldOrderList(ctx: FieldOrderListContext) {
        return FieldOrderListTypeClass.create(ctx);
    }

    visitSelectList(ctx: SelectListContext) {
        return SelectListTypeClass.create(ctx);
    }

    visitSubFieldList(ctx: SubFieldListContext) {
        return SubFieldListTypeClass.create(ctx);
    }

    visitFieldList(ctx: FieldListContext) {
        return FieldListTypeClass.create(ctx);
    }

    visitFieldSpecList(ctx: FieldSpecListContext) {
        return FieldSpecListTypeClass.create(ctx);
    }
}
