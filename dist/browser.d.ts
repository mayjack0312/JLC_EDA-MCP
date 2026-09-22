import { Page } from "playwright";
/** 切换当前活跃浏览器，不关闭旧浏览器 */
export declare function setBrowserPath(p: string | undefined): Promise<boolean>;
export declare function getPage(): Promise<Page>;
export declare function ensureLoggedIn(p: Page): Promise<boolean>;
export declare function navigateToEditor(p: Page): Promise<void>;
