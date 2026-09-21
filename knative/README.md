# Knative Serving

Exercise 5.6. Knative Serving 1.23.0 with Kourier as the network layer and Magic DNS (sslip.io), installed on GKE instead of k3d. The examples of the guides on deploying a service, autoscaling and traffic splitting are in this folder.

## Install

```
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-core.yaml
kubectl apply -f https://github.com/knative-extensions/net-kourier/releases/download/knative-v1.23.0/kourier.yaml
kubectl patch configmap/config-network -n knative-serving --type merge \
  -p '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-default-domain.yaml
```

On GKE Kourier gets a public IP from a load balancer, and Magic DNS turns it into the domain `<ip>.sslip.io`. Services are then reached at `http://<service>.<namespace>.<ip>.sslip.io`, or with the header `Host: <service>.<namespace>.<ip>.sslip.io` sent to the IP. The examples use their own namespace, `knative-demo`.

## What I tried and saw

| Example | File | Result |
|---|---|---|
| Deploy a Knative Service | [hello.yaml](./hello.yaml) | The URL answers `Hello World!` |
| Scale to zero | | With no traffic the pod was removed after 57 seconds, and the next request started it again in about 9 seconds, then 0.5 seconds when warm |
| Autoscaling | [autoscale.yaml](./autoscale.yaml) | 50 concurrent requests, with a target of 10 per pod, took the service from 1 pod to 4, and it went back to 0 when the load stopped |
| Traffic splitting | [hello-split.yaml](./hello-split.yaml) | 75 percent to `hello-v1` and 25 percent to `hello-v2`. 200 requests gave 152 `Hello World!` and 48 `Hello Knative!` |
