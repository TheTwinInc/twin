# Install snap7
sudo apt install -y p7zip
mkdir install
cd install

wget https://sourceforge.net/projects/snap7/files/1.4.2/snap7-full-1.4.2.7z
p7zip -d snap7-full-1.4.2.7z
cd snap7-full-1.4.2/build/unix

# Choose the right architecture
# O - Raspberypi
make -f arm_v7_linux.mk
# X - Ubuntu/Debian
make -f x86_64_linux.mk

# O - Raspberry copy compiled library to your lib directories
sudo cp ../bin/arm_v7-linux/libsnap7.so /usr/lib/libsnap7.so
sudo cp ../bin/arm_v7-linux/libsnap7.so /usr/local/lib/libsnap7.so

# X - Ubuntu/Debian copy compiled library to your lib directories
sudo cp ../bin/x86_64-linux/libsnap7.so /usr/lib/libsnap7.so
sudo cp ../bin/x86_64-linux/libsnap7.so /usr/local/lib/libsnap7.so

#install python pip if you don't have it:
python3 -m pip install python-snap7
# sudo pip3 install python-snap7

# Add this line to /usr/local/lib/python3.7/dist-packages/snap7/common.py
# sudo nano /usr/local/lib/python3.7/dist-packages/snap7/common.py
# cd ~/.local/lib/python3.7/site-packages/snap7
# Choose python installation
sudo nano ~/.local/lib/python3.8/site-packages/snap7/common.py

# In the view that follows, locate the function "def __init__(self, lib_location=None). Paste in the following code above the line that reads: "self.lib.location = lib_location or self.lib_location or find_library('snap7')"
lib_location='/usr/local/lib/libsnap7.so'

# Test
python

import snap7

ip = '192.168.10.51'
slot = 1
plc = snap7.client.Client()
plc.connect(ip, 0, slot)

plc.disconnect()
exit()