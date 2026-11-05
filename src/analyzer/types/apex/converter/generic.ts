// Apex の converter: apex_IR (TypeClass) → CommonType。LWC の convertLwcTypeClass と同じく 1 つの変換で書く。
// 出力は IR のフィールドをそのまま写したもの ({ type, sourceInfo, ...フィールド })。
// IR のフィールド名と CommonType の名前が違うところ・出力しないところだけを、APEX_CONVERT_OVERRIDES に書く。
// 出力の型 (XxxType) は nodes.ts にまとめてある
import { ApexCommonTypeClass, ApexErrorTypeClass } from '../../apex_IR/commonVisitor';

import type { CommonType, ErrorType } from '../../commons/converter';

import { makeErrorType, makeSourceInfo } from './commons';
import type { AnonymousUnitType, CompilationUnitType, TriggerUnitType } from './nodes';

type ConvertOverride = {
    /** IR のフィールド名 → CommonType の名前 */
    rename?: Readonly<Record<string, string>>;
    /** null のときは出力しないフィールド (分岐によってないフィールド) */
    dropIfNull?: readonly string[];
    /** 出力を直す (rename / dropIfNull のあとに呼ぶ) */
    adjust?: (output: Record<string, unknown>) => void;
};

// FindLiteral（[FIND '...'）/ FindLiteralAlt（[FIND {...}）のトークンから検索語だけを取り出す。
// 形式が想定外のときはトークンの文字列をそのまま返す
const FIND_LITERAL_PATTERN = /^\[\s*FIND\s*(?:'((?:\\.|[^\\'])*)'|\{((?:\\.|[^\\}])*)\})\s*$/i;

export const extractFindSearchTerm = (token: string): string => {
    const match = token.match(FIND_LITERAL_PATTERN);
    return match ? (match[1] ?? match[2] ?? token) : token;
};

/** SOSL の FIND '...' / FIND {...} のトークンから検索語だけにする */
const adjustFindLiteral = (output: Record<string, unknown>) => {
    if (typeof output.value === 'string') {
        output.value = extractFindSearchTerm(output.value);
    }
};

/** IR の type → 変換の調整。ここにない type は、IR のフィールドをそのまま写す */
export const APEX_CONVERT_OVERRIDES: Readonly<Record<string, ConvertOverride>> = {
    variableDeclarator: { rename: { content: 'init' } },
    creator: { rename: { content: 'rest' } },
    triggerCase: { rename: { value: 'timing' } },
    getter: { rename: { value: 'block' } },
    setter: { rename: { value: 'block' } },
    finallyBlock: { rename: { value: 'block' } },
    tryStatement: { rename: { value: 'block' } },
    // if / else if / else の並びは { condition, block } (IR は { value, block })
    ifStatement: {
        adjust: (output) => {
            if (Array.isArray(output.value)) {
                output.value = output.value.map((item: { value: unknown; block: unknown }) => ({
                    condition: item.value,
                    block: item.block,
                }));
            }
        },
    },
    // this(...) / super(...) (メソッド名がない呼び出し) は、value に 'this' / 'super' を入れて reference を持たない
    methodCall: {
        adjust: (output) => {
            if (output.value === null) {
                output.value = output.reference;
                delete output.reference;
            }
        },
    },
    whenValue: { dropIfNull: ['valueType'] },
    // 符号 (operator) は数値 (integer / long) のときだけ持つ
    whenLiteral: {
        adjust: (output) => {
            if (output.valueType !== 'integer' && output.valueType !== 'long') {
                delete output.operator;
            }
        },
    },
    soslWithClause: { dropIfNull: ['content'] },
    withClause: { dropIfNull: ['field'] },
    dateFormula: { dropIfNull: ['param'] },
    soslLiteral: { adjust: adjustFindLiteral },
    soslLiteralAlt: { adjust: adjustFindLiteral },
};

const convertValue = (value: unknown): unknown => {
    if (value instanceof ApexCommonTypeClass) {
        return convertApexTypeClass(value);
    }
    if (Array.isArray(value)) {
        return value.map(convertValue);
    }
    if (value !== null && typeof value === 'object') {
        // { value, block } など、ノードではないオブジェクト
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [key, convertValue(child)]),
        );
    }
    return value;
};

/** apex_IR のノードを CommonType にする (子もすべて)。ApexErrorTypeClass は ErrorType にする */
export const convertApexTypeClass = (
    typeClass: ApexCommonTypeClass<string>,
): CommonType<string> | ErrorType => {
    if (typeClass instanceof ApexErrorTypeClass) {
        return makeErrorType(typeClass);
    }
    const type = typeClass.getType();
    const override = APEX_CONVERT_OVERRIDES[type];
    const output: Record<string, unknown> = { type, sourceInfo: makeSourceInfo(typeClass) };
    // IR の private フィールド (type / span 以外) をそのまま写す
    for (const [key, value] of Object.entries(typeClass)) {
        if (key === 'type' || key === 'span') {
            continue;
        }
        if (value === null && override?.dropIfNull?.includes(key)) {
            continue;
        }
        output[override?.rename?.[key] ?? key] = convertValue(value);
    }
    override?.adjust?.(output);
    return output as CommonType<string>;
};

const UNIT_TYPES = new Set(['compilationUnit', 'triggerUnit', 'anonymousUnit', 'AnalyzerError']);

/** unit の IR → CommonType (parser の入口)。unit 以外が来たら例外 (assignMultiClass の Unsupported type と同じ) */
export const convertApexUnit = (
    unit: ApexCommonTypeClass<string>,
): CompilationUnitType | TriggerUnitType | AnonymousUnitType | ErrorType => {
    if (!(unit instanceof ApexCommonTypeClass) || !UNIT_TYPES.has(unit.getType())) {
        throw new Error(
            `Unsupported type: ${unit instanceof ApexCommonTypeClass ? unit.getType() : typeof unit}`,
        );
    }
    return convertApexTypeClass(unit) as
        CompilationUnitType | TriggerUnitType | AnonymousUnitType | ErrorType;
};
