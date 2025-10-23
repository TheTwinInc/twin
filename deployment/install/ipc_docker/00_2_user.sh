# Add user
user=kis-admin
sudo adduser $user

sudo usermod -aG sudo $user

sudo visudo

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

# Remove user
# sudo deluser --remove-home $user

# Only for admin account


# At the end of the /etc/sudoers file add this line: 
ubuntu          ALL=(ALL) NOPASSWD:ALL
kis-admin        ALL=(ALL) NOPASSWD:ALL
# Replace username with your account username, of course. Save the file and exit with <ESC>wq

# Disable root login and password based login
sudo nano /etc/ssh/sshd_config

# Find PasswordAuthentication set to no too:
PasswordAuthentication no

# Find ChallengeResponseAuthentication and set to no:
ChallengeResponseAuthentication no

# Search for UsePAM and set to no, too:
UsePAM no

# Finally look for PermitRootLogin and set it to no too:
PermitRootLogin no
PermitRootLogin prohibit-password

sudo systemctl reload ssh