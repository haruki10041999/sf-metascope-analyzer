// プラットフォームが呼ぶ、標準のインターフェースのメソッド (Salesforce の公式情報。リリースのたびに
// .claude/skills/salesforce-release-update で照合する)。使われていないメソッドの判定 (report/apexUnused.ts) で、
// これらを実装したメソッドを「入口」とみなすのに使う。
// 2026-11-26 に Apex Reference Guide (Version 68.0, Winter '27) の各インターフェースの「<名前> Methods」の節で、
// メソッドの名前を確かめた。全件ではない (載っていないインターフェースを実装したクラスは、public のメソッドをすべて入口とみなす)

/** 照合した資料の API バージョン */
export const APEX_STANDARD_INTERFACES_REFERENCE_API_VERSION = 68;

/** インターフェースの完全修飾名 → プラットフォームが呼ぶメソッドの名前 */
export const APEX_PLATFORM_CALLBACKS: Readonly<Record<string, readonly string[]>> = {
    'Auth.RegistrationHandler': ['createUser', 'updateUser'],
    'Database.Batchable': ['execute', 'finish', 'start'],
    'Messaging.InboundEmailHandler': ['handleInboundEmail'],
    'Process.Plugin': ['describe', 'invoke'],
    'System.Callable': ['call'],
    'System.Comparable': ['compareTo'],
    'System.Finalizer': ['execute'],
    'System.InstallHandler': ['onInstall'],
    'System.Queueable': ['execute'],
    'System.Schedulable': ['execute'],
    'System.UninstallHandler': ['onUninstall'],
};

/**
 * 書いた名前 (Database.Batchable・Schedulable・System.Schedulable) の標準のインターフェースの、プラットフォームが
 * 呼ぶメソッドの名前 (小文字)。表にないインターフェースなら undefined
 */
export const apexPlatformCallbacksOf = (name: readonly string[]): string[] | undefined => {
    const written = name.join('.').toLowerCase();
    const entry = Object.entries(APEX_PLATFORM_CALLBACKS).find(([qualified]) => {
        const key = qualified.toLowerCase();
        // 名前空間を書かない System の型 (Schedulable) も当てる
        return key === written || (key.startsWith('system.') && key === `system.${written}`);
    });
    return entry?.[1].map((method) => method.toLowerCase());
};
