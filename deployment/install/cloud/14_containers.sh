sudo apt update

# Install Docker
sudo apt install -y docker.io
sudo nano /lib/systemd/system/docker.service
# Change line
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock --exec-opt native.cgroupdriver=systemd

sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# Install Kubernetes
sudo apt install apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add
sudo apt-add-repository "deb http://apt.kubernetes.io/ kubernetes-xenial main"
sudo apt install kubeadm kubelet kubectl kubernetes-cni -y

sudo swapoff -a
sudo nano /etc/fstab
# Inside this file, comment out the /swapfile

# Optional
sudo hostnamectl set-hostname kubernetes-worker

sudo nano /etc/sysctl.conf
# Add
net.bridge.bridge-nf-call-iptables = 1

# Initilize kubernetes master node
sudo kubeadm init

# To start using your cluster, you need to run the following as a regular user:
# Run on master node
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# You should now deploy a pod network to the cluster.
# Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
#   https://kubernetes.io/docs/concepts/cluster-administration/addons/
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/k8s-manifests/kube-flannel-rbac.yml

kubectl get pods --all-namespaces

# Join the Kubernetes cluster
# Then you can join any number of worker nodes by running the following on each as root:

sudo kubeadm join 192.168.9.121:6443 --token zrfagd.xwsa91ximtpm7f38 \
        --discovery-token-ca-cert-hash sha256:b82ac05b61abb9a891b821ee846bc8dacbe4a4d636abf2c5e4a034aef50d0f07




# Stop kubernetes master node
sudo kubeadm reset