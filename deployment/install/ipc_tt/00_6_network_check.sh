mkdir -p /home/$USER/service/network

nic_name="$(ip route get 1.1.1.1 | head -n1 | cut -d' ' -f5)"
log_file="/home/$USER/log/netcheck.log"

sudo bash -c "cat > /home/$USER/service/network/network_check.sh" << EOF
#!/bin/bash
gateway_ips='1.1.1.1 8.8.8.8'
network_check_threshold=20
network_check_tries=0
reboot_server=false
reboot_cycle=10
nic=$nic_name
logfile=$log_file
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
last_bootfile=\${SCRIPT_DIR}/.last_net_autoboot

echo "last_net_autoboot location is: \${SCRIPT_DIR}"

function date_log {
    echo "\$(date +'%Y-%m-%d %T') \$1" >> \$logfile
}

function check_gateways {
    for ip in \$gateway_ips; do
        ping -c 1 \$ip > /dev/null 2>&1
        if [[ \$? == 0 ]]; then
            return 0
        fi
    done
    return 1
}

function restart_network {
    /sbin/ip link set "\$nic" down
    sleep 5
    /sbin/ip link set "\$nic" up
    sleep 10

    if ! check_gateways; then
        # If there's no last boot file or it's older than reboot_cycle.
        if [[ ! -f \$last_bootfile || \$(find \$last_bootfile -mmin +\$reboot_cycle -print) ]]; then
            touch \$last_bootfile
            date_log "Network is still not working, rebooting"
            /sbin/reboot
        else
            date_log "Last auto reboot was less than \$reboot_cycle minutes old"
        fi
    fi
}

while [ \$network_check_tries -lt \$network_check_threshold ]; do
    network_check_tries=\$((network_check_tries+1))

    if check_gateways; then
        date_log "Network is working correctly" && exit 0
    else
        date_log "Network is down, failed check number \$network_check_tries of \$network_check_threshold"
    fi

    if [ \$network_check_tries -ge \$network_check_threshold ]; then
        restart_network
    fi
    sleep 5
done
EOF

sudo chmod +x /home/$USER/service/network/network_check.sh

sudo bash -c "cat > /lib/systemd/system/network_check.service" << EOF
[Unit]
Description=Network maintenance service
ConditionPathExists=/home/$USER/service/network/network_check.sh
ConditionPathExists=/home/$USER/log
Wants=network_check.timer

[Service]
Type=oneshot
ExecStart=/bin/bash /home/$USER/service/network/network_check.sh
WorkingDirectory=/home/$USER/service/network
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 /lib/systemd/system/network_check.service

sudo bash -c "cat > /lib/systemd/system/network_check.timer" << EOF
[Unit]
Description=Network maintenance timer
Requires=network_check.service

[Timer]
OnCalendar=*-*-* *:0/10:00
Unit=network_check.service

[Install]
WantedBy=timers.target
EOF

sudo chmod 644 /lib/systemd/system/network_check.timer

# Configure systemd
sudo systemctl daemon-reload
# Enable service
sudo systemctl enable --now network_check.service
sudo systemctl enable --now network_check.timer

# Check status of your service and repeat
sudo systemctl restart network_check.timer
sudo systemctl status network_check.timer
sudo systemctl stop network_check.timer

# { sudo crontab -l -u root 2>/dev/null; sudo echo "*/10 * * * * /home/$USER/service/network/network_check.sh >> /var/log/netcheck.log 2>&1"; } | sudo crontab -u root -

# if [[ ! -f $last_bootfile || $(find $last_bootfile -mmin +$reboot_cycle -print) ]]; then

# systemd-analyze calendar *-*-* *:*:00
# Explaination	Systemd timer
# Every Minute	*-*-* *:*:00
# Every 2 minute	*-*-* *:*/2:00
# Every 5 minutes	*-*-* *:*/5:00
# Every 15 minutes	*-*-* *:*/15:00
# Every quarter hour	*-*-* *:*/15:00
# Every 30 minutes	*-*-* *:*/30:00
# Every half an hour	*-*-* *:*/30:00
# Every 60 minutes	*-*-* */1:00:00
# Every 1 hour	*-*-* *:00:00
# Every 2 hour	*-*-* */2:00:00
# Every 3 hour	*-*-* */3:00:00
# Every other hour	*-*-* */2:00:00
# Every 6 hour	*-*-* */6:00:00
# Every 12 hour	*-*-* */12:00:00
# Hour Range	*-*-* 9-17:00:00
# Between certain hours	*-*-* 9-17:00:00
# Every day	*-*-* 00:00:00
# Daily	*-*-* 00:00:00
# Once A day	*-*-* 00:00:00
# Every Night	*-*-* 01:00:00
# Every Day at 1am	*-*-* 01:00:00
# Every day at 2am	*-*-* 02:00:00
# Every morning	*-*-* 07:00:00
# Every midnight	*-*-* 00:00:00
# Every day at midnight	*-*-* 00:00:00
# Every night at midnight	*-*-* 00:00:00
# Every sunday	Sun *-*-* 00:00:00
# Every friday	Fri *-*-* 01:00:00
# Every friday at midnight	Fri *-*-* 00:00:00
# Every saturday	Sat *-*-* 00:00:00
# Every weekday	Mon...Fri *-*-* 00:00:00
# weekdays only	Mon...Fri *-*-* 00:00:00
# monday to friday	Mon...Fri *-*-* 00:00:00
# Every weekend	Sat,Sun *-*-* 00:00:00
# weekends only	Sat,Sun *-*-* 00:00:00
# Every 7 days	* *-*-* 00:00:00
# Every week	Sun *-*-* 00:00:00
# weekly	Sun *-*-* 00:00:00
# once a week	Sun *-*-* 00:00:00
# Every month	* *-*-01 00:00:00
# monthly	* *-*-01 00:00:00
# once a month	* *-*-01 00:00:00
# Every quarter	* *-01,04,07,10-01 00:00:00
# Every 6 months	* *-01,07-01 00:00:00
# Every year	* *-01-01 00:00:00