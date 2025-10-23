cd /var/log

ls -l syslog*
ls -t dpkg*
ls -t daemon*

sudo find . -name 'syslog.*.gz' -delete
sudo find . -name 'dpkg.*.gz' -delete
sudo find . -name 'daemon.*.gz' -delete

sudo truncate -s 0 /var/log/syslog



# sudo nano /etc/rsyslog.conf

sudo sed -i "s/weekly/daily/g" /etc/logrotate.conf
sudo sed -i "s/rotate.*/rotate 2/g" /etc/logrotate.conf
sudo sed -i "s/^#compress/compress/g" /etc/logrotate.conf

sudo nano /etc/logrotate.d/rsyslog

/var/log/daemon.log {
  daily
  size=10M
  rotate 1
  compress
}
/var/log/dpkg.log {
  daily
  size=10M
  rotate 1
  compress
}

sudo logrotate -f /etc/logrotate.d/rsyslog
sudo logrotate -f /etc/logrotate.conf
sudo logrotate -df /etc/logrotate.conf

sudo journalctl --disk-usage
sudo journalctl --vacuum-time=2d
sudo journalctl --vacuum-size=1M

sudo nano /etc/systemd/journald.conf

SystemMaxUse=10M

sudo systemctl kill --kill-who=main --signal=SIGUSR2 systemd-journald.service
sudo systemctl restart systemd-journald.service


sudo who wtmp | sudo tail -10	# show the most recent logins
sudo who wtmp | sudo grep shark	# show recent logins for a particular user
sudo who wtmp | sudo grep "sudo:" auth.log	# see who is using sudo
tail dmesg			# look at kernel messages
tail dpkg.log			# see recently installed and updated packages
more ufw.log			# see firewall activity (i.e., if you are using ufw)

