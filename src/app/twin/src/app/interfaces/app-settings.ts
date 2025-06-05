export interface IAppSettings {
    env: {
        name: string;
    };
    logging: {
        console: boolean;
        appInsights: boolean;
    };
    wsServer: {
        uri: {
            thetwin: string,
            mcs: string,
            admin: string
        };
    };
    xdrop: {
        uri: string;
        uriAttribute: string;
    };
    tasks: {
        uri: string;
    };
    bags: {
        uri: string;
    };
    apiUrl: string;
}
