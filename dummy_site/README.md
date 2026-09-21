# DummySite

A custom resource that makes a copy of a website. Creating a `DummySite` with a `website_url` makes the controller create a Deployment and a Service. The Deployment runs nginx, and an init container downloads the page for it to serve. The resources are owned by the `DummySite`, so deleting it deletes them too.

Apply the files in this order:

```
kubectl apply -f manifests/resourcedefinition.yaml
kubectl apply -f manifests/serviceaccount.yaml -f manifests/clusterrole.yaml -f manifests/clusterrolebinding.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/dummysite.yaml
```

The controller is in [controller](./controller). It watches `/apis/stable.dwk/v1/dummysites` and talks to the API server directly with its service account.
