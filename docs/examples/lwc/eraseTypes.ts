// TS の型を空白にする処理は src/analyzer/parser/Lwc/validate/eraseTypes.ts に移した (docs/lwc-parse-plan.md 3.2)。
// 検証スクリプト (verify-erase-types.ts) と使用例 (run-library-parse.ts) のために、ここから再 export する
export * from '../../../src/analyzer/parser/Lwc/validate/eraseTypes';
