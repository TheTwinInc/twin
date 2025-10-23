# ===============================================
# 3. Installing the Elo Touchscreen USB Driver 
# ===============================================

# Important:
# ==========
# a.) Must have root or administrator access rights on the Linux machine to 
#     install the Elo Touchscreen USB Driver. 
 
# b.) Ensure all earlier Elo drivers are uninstalled from the system.
#     Follow the uninstallation steps from the old driver's readme.txt
#     file to remove the old driver completely.

# c.) The Elo Touchscreen driver components require libusb-1.0 library support 
#     (older libusb-0.1 library will not work). Most Linux distributions have 
#     started shipping this library (update to the popular libusb-0.1 library) as 
#     a part of their standard release. Customers can also download and compile 
#     the libusb-1.0 library from source (requires gcc v4.0.0 or later) available 
#     at libusb website. 

# d.) Do not extract the downloaded binary package on a Windows system. 

# e.) Motif 3.0 (libXm.so.3) library is required to use the Graphic User Interface 
#     (GUI) based control panel (/etc/opt/elo-mt-usb/cpl). Openmotif or lesstif 
#     installation packages provide the required libXm.so.3 library.

# sudo apt install -y libxm4

wget https://assets.ctfassets.net/of6pv6scuh5x/1cg5cbjd2Ee9o4zP629xhH/80953373430d4daf25dc4d835d1b7933/SW602884_Elo_Linux_MT_USB_Driver_v4.2.0.0_aarch64.tar

tar -xvf SW602884_Elo_Linux_MT_USB_Driver_v4.2.0.0_aarch64.tar

sudo cp -r ./bin-mt-usb/  /etc/opt/elo-mt-usb

cd /etc/opt/elo-mt-usb
sudo chmod 777 *
sudo chmod 444 *.txt

sudo cp /etc/opt/elo-mt-usb/99-elotouch.rules /etc/udev/rules.d

# # List your current kernel version
# uname -r
# #   List the kernel module name that contains the kernel version
# ls -l /etc/opt/elo-mt-usb/*.ko

# cd /etc/opt/elo-mt-usb/elo_mt_input_mod_src
# make

# make install
# #   (or)
# cp ./elo_mt_input_mod.ko ../elo_mt_input_mod_`uname -r`.ko

# Check for active systemd init process.

ps -eaf | grep [s]ystemd
ps -eaf | grep init
ls -l /sbin/init


# If systemd init system is active, copy and enable the elo.service systemd script 
# to load the elo driver at startup. Proceed to Step IV of the installation.

sudo cp /etc/opt/elo-mt-usb/elo.service /etc/systemd/system/
sudo systemctl enable elo.service
sudo systemctl status elo.service


# Plug in the USB touchscreen and reboot the system to complete the driver installation process.
sudo shutdown -r now

# cd /etc/opt/elo-mt-usb
# sudo ./elova --videoscreen=1


