// LWC のバンドル 1 つの解析 (docs/lwc-implementation.md)。
// 入力は folder.ts で読んだフォルダの中身だけで、ファイルシステムには触らない。
// JS / TS (module.ts)・js-meta.xml (meta.ts)・HTML (template.ts)・CSS (stylesheet.ts) を読み、
// 最後に同じバンドルの中の突き合わせ (validate/bundle.ts) をする
import {
    hash,
    makeErrorJson,
    type ErrorJson,
    type LwcBundleJson,
    type LwcSourceJson,
} from '../../types';

import type { LwcResolvedError } from './errorListener';
import type { LwcBundleFile, LwcBundleFolder } from './folder';
import { apiVersionOf, parseBundleMeta } from './meta';
import { convertLwcModule, parseLwcModule } from './module';
import { parseStylesheet } from './stylesheet';
import { parseTemplate } from './template';
import { validateBundle } from './validate/bundle';

export type LwcParseOptions = {
    /** 名前空間 (既定は c) */
    namespace?: string;
};

/** バンドルの解析結果 (2.4)。Apex の ApexFileStructureType と同じ形。1 バンドル = 1 つの保存ファイル */
export type LwcBundleStructureType = {
    /** バンドルのフォルダ */
    filePath: string;
    /** バンドルの中のすべてのファイルの診断 (filePath で区別する) */
    resolvedError: LwcResolvedError[];
    dataType: 'lwcBundle';
    result: {
        /** バンドル名 */
        id: string;
        base: LwcBundleJson;
        sourceObject: LwcSourceJson[];
    };
};

/** フォルダが読めない・メインのモジュールがないとき */
export type ErrorLwcBundleStructureType = {
    filePath: string;
    resolvedError: LwcResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: LwcSourceJson[];
    };
};

export type LwcBundleParseResult = LwcBundleStructureType | ErrorLwcBundleStructureType;

/** フォルダが読めない・メインのモジュールがないときの結果 */
export const makeErrorBundleResult = (
    bundleDir: string,
    name: string,
    reason: string,
    resolvedError: LwcResolvedError[] = [],
): ErrorLwcBundleStructureType => ({
    filePath: bundleDir,
    resolvedError,
    dataType: 'error',
    result: {
        id: name,
        base: makeErrorJson(
            { objectKey: `error_${hash(reason)}`, sourceKey: `error_${hash(bundleDir)}` },
            'lwcBundle',
        ),
        sourceObject: [],
    },
});

/** メインのファイル (<バンドル名>.ts / .js / .html) か */
const isMainFile = (file: LwcBundleFile, bundleName: string, extensions: string[]) => {
    const lower = file.fileName.toLowerCase();
    return extensions.some((extension) => lower === `${bundleName.toLowerCase()}${extension}`);
};

/** 読み込んだバンドルのフォルダを解析する */
export const parseLwcBundleFolder = (
    folder: LwcBundleFolder,
    options: LwcParseOptions = {},
): LwcBundleParseResult => {
    const { name, bundleDir } = folder;
    const ofType = (fileType: LwcBundleFile['fileType']) =>
        folder.files.filter((file) => file.fileType === fileType);
    const namespaceOption = options.namespace ? { namespace: options.namespace } : {};

    // JS / TS (メインのモジュールがなければバンドルとして読めない)
    const scripts = ofType('module').map((file) => ({
        file,
        parsed: parseLwcModule(file.filePath, file.source, namespaceOption),
    }));
    const resolvedError: LwcResolvedError[] = scripts.flatMap(({ parsed }) => parsed.resolvedError);
    if (!scripts.some(({ file }) => isMainFile(file, name, ['.js', '.ts']))) {
        return makeErrorBundleResult(bundleDir, name, 'main module not found', resolvedError);
    }

    const sourceObject: LwcSourceJson[] = [];
    const modules: LwcBundleJson['modules'] = scripts.map(({ file, parsed }) => {
        const { module, sourceObjects } = convertLwcModule(parsed);
        sourceObject.push(...sourceObjects);
        return { fileName: file.fileName, main: isMainFile(file, name, ['.js', '.ts']), module };
    });

    // js-meta.xml。apiVersion は HTML / CSS の検証に渡す
    const metaFile = ofType('meta')[0];
    const metaResult = metaFile ? parseBundleMeta(metaFile.filePath, metaFile.source) : undefined;
    if (metaResult) {
        sourceObject.push(...metaResult.sourceObjects);
        resolvedError.push(...metaResult.resolvedError);
    }
    const apiVersion = apiVersionOf(metaResult?.meta);
    const apiVersionOption = apiVersion ? { apiVersion } : {};

    // HTML
    const templates: LwcBundleJson['templates'] = ofType('template').map((file) => {
        const result = parseTemplate(file.filePath, file.source, {
            name,
            ...namespaceOption,
            ...apiVersionOption,
        });
        sourceObject.push(...result.sourceObjects);
        resolvedError.push(...result.resolvedError);
        return {
            fileName: file.fileName,
            main: isMainFile(file, name, ['.html']),
            template: result.template,
        };
    });

    // CSS
    const stylesheets: LwcBundleJson['stylesheets'] = ofType('stylesheet').map((file) => {
        const result = parseStylesheet(file.filePath, file.source, apiVersionOption);
        sourceObject.push(...result.sourceObjects);
        resolvedError.push(...result.resolvedError);
        return { fileName: file.fileName, scoped: result.scoped, stylesheet: result.stylesheet };
    });

    const base: LwcBundleJson = {
        name,
        namespace: options.namespace ?? 'c',
        modules,
        templates,
        stylesheets,
        ...(metaResult ? { meta: metaResult.meta } : {}),
        skippedFiles: folder.skippedFiles,
    };
    // 同じバンドルの中の突き合わせ (テンプレートの式・ハンドラー・lwc:ref と JS。docs/lwc-implementation.md)
    resolvedError.push(...validateBundle(base, sourceObject));

    return {
        filePath: bundleDir,
        resolvedError,
        dataType: 'lwcBundle',
        result: { id: name, base, sourceObject },
    };
};
