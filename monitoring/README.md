# Monitoring

Helm values for the monitoring stack (Prometheus, Loki, Grafana) used in exercise 2.10, and the Prometheus query for exercise 4.3.

## Exercise 4.3: Prometheus query

Prometheus is installed with Helm in the `prometheus` namespace. Pushgateway and the node exporter are turned off to save memory on small nodes, and Alertmanager, which is a StatefulSet, stays on.

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install prometheus prometheus-community/prometheus \
  --namespace prometheus --create-namespace \
  --set prometheus-pushgateway.enabled=false \
  --set prometheus-node-exporter.enabled=false
```

The GUI is reached with a port-forward through the service, then opening http://localhost:9090:

```
kubectl port-forward svc/prometheus-server -n prometheus 9090:80
```

The query that shows the number of pods created by StatefulSets in the `prometheus` namespace is:

```
count(kube_pod_info{created_by_kind="StatefulSet", namespace="prometheus"})
```

`kube_pod_info` has one series per pod, and its `created_by_kind` label tells what kind of object created the pod, so filtering by `StatefulSet` and the namespace and counting the series gives the answer. In this installation the value is **1**, the pod `prometheus-alertmanager-0`. The number depends on what is installed: a setup with more StatefulSets in that namespace returns a larger value.
