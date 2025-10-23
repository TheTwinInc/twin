# Add user
user=kis-admin
sudo adduser $user

# As root
su -
user=kis-admin
usermod -aG sudo $user
echo 'kis-admin        ALL=(ALL) NOPASSWD:ALL' | EDITOR='tee -a' visudo
exit

su $user

cd
mkdir ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
# echo public_key_string >> ~/.ssh/authorized_keys
echo ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCn5iMYR6rgmtruGc5t5WuE4noLzpi2PB84rG5c8oM9XbWQhuEzGNsp4W78xJ7lbduHSO/wj4jhFK+WiGji4umzAFOuxz9U+aiHjdoNlF52U3Vmj09heDb6Kxm8YJxd9YVh84ZwCB/SIm9updozbsKuYlX3lNtkJm2LD0ddYHaQUPu/xJ9AB/g/eOxLLajnPs8EWXVjkXAXdZUXrngu6rXLJkJA7h+PJQSj1kHJkcTrmId8KY7ZATVWhWS99aD2TV1u+ALiUSUnXZfP+9MycXMADindPhp+592UelwcAWK721lZOO0kLdUr4YMjsvnGK7u8hT7zY+rb9PozIZ2gVG7n ub-service >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Hardening SSH

# Disable root login and password based login
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

sudo sed -i "s/^#\{0,1\}PasswordAuthentication yes/PasswordAuthentication no/g" /etc/ssh/sshd_config

sudo sed -i "s/^#\{0,1\}PermitEmptyPasswords.*/PermitEmptyPasswords no/g" /etc/ssh/sshd_config

sudo sed -i "s/^#\{0,1\}ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/g" /etc/ssh/sshd_config

sudo sed -i "s/^#\{0,1\}UsePAM.*/UsePAM no/g" /etc/ssh/sshd_config

sudo sed -i "/PermitRootLogin prohibit-password/s/^#//g" /etc/ssh/sshd_config
sudo sed -i "/PermitRootLogin.*/iPermitRootLogin no" /etc/ssh/sshd_config

sudo sed -i "s/^#\{0,1\}ClientAliveInterval.*/ClientAliveInterval 300/g" /etc/ssh/sshd_config
sudo sed -i "s/^#\{0,1\}ClientAliveCountMax.*/ClientAliveCountMax 0/g" /etc/ssh/sshd_config

sudo sed -i "s/^#\{0,1\}IgnoreRhosts.*/IgnoreRhosts yes/g" /etc/ssh/sshd_config

sudo sed -i "/HostKey \/etc\/ssh\/ssh_host_rsa_key/s/^#//g" /etc/ssh/sshd_config

NEW_LINE="HostKeyAlgorithms ssh-ed25519,ssh-ed25519-cert-v01@openssh.com,sk-ssh-ed25519@openssh.com,sk-ssh-ed25519-cert-v01@openssh.com,rsa-sha2-256,rsa-sha2-512,rsa-sha2-256-cert-v01@openssh.com,rsa-sha2-512-cert-v01@openssh.com"
# Raspbian
# NEW_LINE="HostKeyAlgorithms ssh-ed25519,ssh-ed25519-cert-v01@openssh.com"
sudo sed -i "/HostKey \/etc\/ssh\/ssh_host_ed25519_key/a$NEW_LINE" /etc/ssh/sshd_config

NEW_LINE="KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,diffie-hellman-group-exchange-sha256,diffie-hellman-group14-sha256"
sudo sed -i "/HostKeyAlgorithms/a$NEW_LINE" /etc/ssh/sshd_config

NEW_LINE="Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr"
sudo sed -i "/KexAlgorithms/a$NEW_LINE" /etc/ssh/sshd_config

NEW_LINE="MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,umac-128-etm@openssh.com"
sudo sed -i "/Ciphers chacha20/a$NEW_LINE" /etc/ssh/sshd_config

# LogLevel VERBOSE logs user's key fingerprint on login. Needed to have a clear audit track of which key was using to log in.
NEW_LINE="LogLevel VERBOSE"
sudo sed -i "s/^#\{0,1\}LogLevel.*/$NEW_LINE/g" /etc/ssh/sshd_config
# LogLevel VERBOSE
 
# Log sftp level file access (read/write/etc.) that would not be easily logged otherwise.
NEW_LINE="Subsystem sftp \/usr\/lib\/openssh\/sftp-server -f AUTHPRIV -l INFO"
sudo sed -i "s/^#\{0,1\}Subsystem.*sftp.*/$NEW_LINE/g" /etc/ssh/sshd_config

# CTRL+S CTRL+X

# Add keys
sudo rm /etc/ssh/ssh_host_*

sudo ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N ""

sudo ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""

# # Rpi
# # Remove small Diffie-Hellman moduli
# sudo awk '$5 >= 3071' /etc/ssh/moduli > /etc/ssh/moduli.safe
# sudo mv /etc/ssh/moduli.safe /etc/ssh/moduli

# You can grab list of cipher and alog supported by your OpenSSH server using the following commands:
ssh -Q cipher
ssh -Q cipher-auth
ssh -Q mac
ssh -Q kex
ssh -Q key

# How do I test sshd_config file and restart/reload my SSH server?
sudo sshd -t
# Extended test mode:
sudo sshd -T

# How to audit SSH server and client config on Linux/Unix
sudo apt install -y python3 python3-pip
sudo python -m pip install ssh-audit
ssh-audit localhost
# ssh-audit -L
# ssh-audit -P  'Hardened OpenSSH Server v8.4 (version 1)' localhost

# Restart ssh
sudo systemctl reload ssh

