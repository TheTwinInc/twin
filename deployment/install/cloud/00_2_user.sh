sudo apt install x11-xkb-utils -y
setxkbmap -layout no

# Or
sudo nano /etc/default/keyboard

user=kis-admin

sudo adduser $user

sudo usermod -aG sudo $user

su $user

cd 
mkdir .ssh
echo public_key_string >> ~/.ssh/authorized_keys
echo ssh-rsa ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCn5iMYR6rgmtruGc5t5WuE4noLzpi2PB84rG5c8oM9XbWQhuEzGNsp4W78xJ7lbduHSO/wj4jhFK+WiGji4umzAFOuxz9U+aiHjdoNlF52U3Vmj09heDb6Kxm8YJxd9YVh84ZwCB/SIm9updozbsKuYlX3lNtkJm2LD0ddYHaQUPu/xJ9AB/g/eOxLLajnPs8EWXVjkXAXdZUXrngu6rXLJkJA7h+PJQSj1kHJkcTrmId8KY7ZATVWhWS99aD2TV1u+ALiUSUnXZfP+9MycXMADindPhp+592UelwcAWK721lZOO0kLdUr4YMjsvnGK7u8hT7zY+rb9PozIZ2gVG7n ub-service >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Only for admin account
sudo visudo

# At the end of the /etc/sudoers file add this line: 
kis-admin        ALL=(ALL) NOPASSWD:ALL
ubuntu          ALL=(ALL) NOPASSWD:ALL
# Replace username with your account username, of course. Save the file and exit with <ESC>wq

