export declare class EasyEdaBridge {
    private server;
    private clients;
    private pending;
    private activeWindowId;
    private port;
    private startPromise;
    start(): Promise<number>;
    private startInternal;
    private isPortUsed;
    private listen;
    private onConnection;
    status(): {
        service: string;
        port: number | null;
        activeWindowId: string | null;
        count: number;
        windows: {
            windowId: string;
            connected: boolean;
            active: boolean;
        }[];
    };
    selectWindow(windowId: string): void;
    execute(code: string, windowId?: string): Promise<unknown>;
}
export declare const easyEdaBridge: EasyEdaBridge;
