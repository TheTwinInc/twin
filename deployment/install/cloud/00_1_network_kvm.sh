sudo apt-get install qemu-kvm libvirt-daemon-system \
   libvirt-clients virtinst bridge-utils

virsh list --all

sudo nano /etc/sysctl.d/bridge.conf

net.bridge.bridge-nf-call-ip6tables=0
net.bridge.bridge-nf-call-iptables=0
net.bridge.bridge-nf-call-arptables=0

sudo nano /etc/udev/rules.d/99-bridge.rules

ACTION=="add", SUBSYSTEM=="module", KERNEL=="br_netfilter", RUN+="/sbin/sysctl -p /etc/sysctl.d/bridge.conf"

ip link

virsh net-destroy default
virsh net-undefine default

suod ip link delete virbr1 type brigde
sudo ip link delete virbr1-nic

sudo nano /etc/netplan/00-installer-config.yaml

network:
   version: 2
   ethernets:
      ens9:
         dhcp4: yes
         nameservers:
            addresses: [8.8.8.8]
      enp1s0f0:
         dhcp4: false
         dhcp6: false
   bridges:
      br0:
         interfaces: [ enp1s0f0 ]
         addresses: [192.168.1.21/24]
         gateway4: 192.168.1.1
         mtu: 1500
         nameservers:
            addresses: [8.8.8.8,8.8.4.4]
         parameters:
            stp: true
            forward-delay: 4
         dhcp4: no
         dhcp6: no
   


network:
   version: 2
   ethernets:
      ens9:
         addresses: [192.168.12.239/24]
         gateway4: 192.168.12.1
         mtu: 1500
         nameservers:
            addresses: [8.8.8.8]
         #dhcp4: false
         #nameservers:
         #   addresses: [8.8.8.8]
      enp1s0f0:
         dhcp4: false
         dhcp6: false
      #addresses: [192.168.201.239/24]
      #gateway4: 192.168.201.1
      #mtu: 1500
      #nameservers:
      #  addresses: [8.8.8.8]
   bridges:
      br0:
         interfaces: [ enp1s0f0 ]
         addresses: [192.168.1.21/24]
         gateway4: 192.168.1.1
         mtu: 1500
         nameservers:
            addresses: [8.8.8.8,8.8.4.4]
         parameters:
            stp: true
            forward-delay: 4
         dhcp4: no
         dhcp6: no
   wifis:
      wlp2s0:
         optional: true
         access-points:
         "XXX":
            password: "PASSWORD"
         dhcp4: true


sudo netplan apply

sudo netplan generate
sudo netplan --debug apply

cd /etc/libvirt/qemu/networks/

sudo nano host-bridge.xml

<network>
  <name>host-bridge</name>
  <forward mode="bridge"/>
  <bridge name="br0"/>
</network>



virsh net-define host-bridge.xml
virsh net-start host-bridge
virsh net-autostart host-bridge

virsh edit <GUEST1>

   <interface type='network'>
      <source network='host-bridge'/>
      <model type='virtio'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/>
   </interface>
   <interface type='network'>
      <mac address='52:54:00:60:4b:e9'/>
      <source network='bhsc'/>
      <model type='rtl8139'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/>
    </interface>
