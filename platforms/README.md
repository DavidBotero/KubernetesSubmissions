# Rancher vs OpenShift

Exercise 5.5. I picked Rancher as the better one, and this argues for it against OpenShift.

## What they are

- **Rancher** (SUSE) is an open source platform for creating and managing Kubernetes clusters. It manages many clusters from one place, on any cloud or on your own servers, and it can also import clusters made by other tools such as GKE, EKS or AKS. Its own lightweight distributions are K3s and RKE2, and K3s is what k3d runs in this course.
- **OpenShift** (Red Hat) is a complete Kubernetes distribution with many parts already chosen and included: an image registry, image builds, a router, an operator catalog, monitoring, pipelines and GitOps.

## Why Rancher is better

- **It stays close to plain Kubernetes.** A manifest written for Kubernetes works on Rancher as it is. OpenShift adds its own objects, such as Routes, and its own security rules, so things that work elsewhere can need changes there.
- **The defaults do not break ordinary images.** OpenShift runs containers as a random non-root user by default, and many public images that expect to be root fail until someone fixes them. Rancher does not force this, though it can be turned on where wanted.
- **It is much lighter.** K3s runs on a small machine and a cluster starts in minutes, which is why we use it for learning and for edge devices. OpenShift asks for far more memory and CPU per node, so it does not fit on a laptop or a small server.
- **It is free.** Rancher and K3s are open source and support is optional. OpenShift is normally paid per core with a Red Hat subscription, and the free community version, OKD, gets less support.
- **It avoids lock-in.** One Rancher can manage GKE, EKS and on-premises clusters together, so the choice of cloud stays open. OpenShift ties a team to Red Hat's way of doing things and to its release schedule, which follows upstream Kubernetes with a delay.
- **You choose the parts.** With Rancher we pick our own ingress, monitoring and GitOps tool, which is exactly what this course did with Prometheus, Argo CD and Istio. OpenShift includes its own choices, and replacing them is harder.

## What OpenShift does better

- It is one product from one vendor, with a single support contract, so nothing has to be put together.
- Its security defaults are stricter and its updates are handled by the platform.

These are real advantages for a large company that wants one supplier, but a team that values portability, low cost and standard Kubernetes gets more from Rancher.
