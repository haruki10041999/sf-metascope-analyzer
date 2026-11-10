// Apex / メタデータ / LWC で共通の型と部品 (JsonType・ソース位置・XML → JSON)
export * from './commons';

// メタデータ (オブジェクト): XML → JSON 生成層
export * from './metadata';

// Apex: JSON 生成層 (IR → JSON)
export * from './apex';

// LWC: JSON 生成層 (IR → JSON)
export * from './lwc';

// Apex の IR: 各 isXxxType が ./apex の JSON の判定関数と衝突するため、名前空間で公開する
export * as apexIR from './apex_IR';

// LWC の IR
export * as lwcIR from './lwc_IR';
