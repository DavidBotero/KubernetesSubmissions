# Istio ambient mode

Exercise 5.2. I followed the ambient getting started guide with the Bookinfo sample app, on GKE instead of k3d, with Istio 1.31.1 and the steps up to Clean up.

## Setup

1. `istioctl` from the Istio release. GKE needs a quota that allows the critical `ztunnel` pods, in [resourcequota.yaml](./resourcequota.yaml).
2. Ambient profile for GKE. The default `istiod` asks for 2 GB of memory, which does not fit on `e2-medium` nodes, so the requests are lowered:

   ```
   istioctl install --set profile=ambient --set values.global.platform=gke \
     --set values.pilot.resources.requests.cpu=100m --set values.pilot.resources.requests.memory=256Mi \
     --set values.ztunnel.resources.requests.cpu=50m --set values.ztunnel.resources.requests.memory=128Mi
   ```
3. Prometheus in the `monitoring` namespace with the values of exercise 2.10, and Kiali from `samples/addons/kiali.yaml` with the Prometheus address added:

   ```
   external_services:
     prometheus:
       enabled: true
       url: http://prom-prometheus-server.monitoring:80
   ```

## What I did and saw

| Step | Result |
|---|---|
| Deploy Bookinfo and the `curl` pod, with the Gateway as `ClusterIP` | `productpage` answers 200 |
| Label the namespace `istio.io/dataplane-mode=ambient` | `ztunnel` lists every workload with protocol `HBONE` |
| Kiali graph after generating traffic | `curl` to `productpage`, then `details` and `reviews` v1, v2 and v3, and `reviews` v2 and v3 to `ratings` |
| L4 policy [productpage-viewer-l4.yaml](./productpage-viewer-l4.yaml) | `curl` gets the connection cut (exit 56), the gateway still gets 200 |
| Waypoint (`istioctl waypoint apply --enroll-namespace`) and L7 policy [productpage-viewer-l7.yaml](./productpage-viewer-l7.yaml) | `GET` from `curl` is 200, `DELETE` is `403 RBAC: access denied` |
| Traffic split with `route-reviews-90-10.yaml` | 100 requests to `productpage` went 91 to `reviews-v1` and 9 to `reviews-v2` |
