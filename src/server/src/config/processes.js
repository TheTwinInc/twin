(function () {

    const processes = {
        linux : {
            web_server: {
                name: 'web_server',
                serviceName: 'nginx',
                actions: ['restart']
            },
            xdrop_server: {
                name: 'xdrop_server',
                serviceName: 'xdrop@server',
                actions: ['restart']
            },
            kiosk: {
                name: 'kiosk',
                serviceName: 'kiosk',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            scanner_loader: {
                name: 'scanner_loader',
                serviceName: 'scanner@loader',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            scanner_unoader: {
                name: 'scanner_unloader',
                serviceName: 'scanner@unloader',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            status_light: {
                name: 'status_light',
                serviceName: 'elo@status_light',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            db: {
                name: 'db',
                serviceName: 'postgresql@14-main.service',
                actions: ['start', 'stop', 'restart']
            },
            db_maintenace: {
                name: 'db_maintenace',
                serviceName: 'pgagent',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            vpn: {
                name: 'vpn',
                serviceName: 'wg-quick@wg0',
                actions: ['restart']
            },
            vnc: {
                name: 'vnc',
                serviceName: 'x11vnc',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            monitoring: {
                name: 'monitoring',
                serviceName: 'grafana-server',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            share: {
                name: 'share',
                serviceName: 'smbd',
                actions: ['start', 'stop', 'restart', 'disable']
            },
            streamer: {
                name: 'streamer',
                serviceName: 'streamer',
                actions: ['start', 'stop', 'restart', 'enable']
            },
            network_health: {
                name: 'network_health',
                serviceName: 'network_check.timer',
                actions: ['restart']
            }
        },
        win32 : {
        }
    }

    module.exports = processes;
}());
    