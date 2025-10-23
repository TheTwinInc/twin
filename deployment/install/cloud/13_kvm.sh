# Show vm
virsh list
virsh list --all



# Shutdown Guest
virsh shutdown $VM_ID_OR_NAME

# Start Guest
virsh start $VM_ID_OR_NAME

# Sart rolling
for i in `sudo virsh list | grep running | awk '{print $2}'` do
    sudo virsh shutdown $i

# Edit
sudo EDITOR=nano virsh edit $VM_ID_OR_NAME

# Enable Auto-Start Guest
virsh autostart $VM_ID_OR_NAME

# Disable Auto-Start Guest
virsh autostart --disable $VM_ID_OR_NAME

# Reboot Guest
virsh reboot $VM_ID_OR_NAME

# Destroy a Guest
virsh destroy $VM_ID_OR_NAME

# Suspend a Guest
virsh suspend $VM_ID_OR_NAME

# Resume a Guest
virsh resume $VM_ID_OR_NAME

# Virsh remove vm
sudo virsh destroy $VM_ID_OR_NAME 2> /dev/null
sudo virsh undefine  $VM_ID_OR_NAME
sudo virsh pool-refresh default
sudo virsh vol-delete --pool default $VM_ID_OR_NAME.qcow2

# NETWORK
# Show network
virsh net-list

ls /etc/libvirt/qemu/networks/
ls /etc/libvirt/qemu/networks/autostart/

