# The project

A todo application made of four small Node.js pieces that run in Kubernetes.

| Component | What it does |
|---|---|
| `todo-app` | Web frontend. Serves the page, the cached hourly image and the todo form. |
| `todo-backend` | REST API for creating and listing todos, stored in Postgres. |
| `todo-cron` | Hourly CronJob that creates a todo asking to read a random Wikipedia article. |
| Postgres | StatefulSet with a persistent volume. |

The manifests are in [manifests](./manifests) and are tied together by [kustomization.yaml](./kustomization.yaml).

## DBaaS vs DIY

The database can be a managed service (Google Cloud SQL) or a Postgres that we run ourselves in the cluster with a StatefulSet and a PersistentVolumeClaim, which is what this project does.

| | DBaaS (Cloud SQL) | DIY (Postgres in the cluster) |
|---|---|---|
| **Work to initialize** | Create the instance and the database, then connect from the pods through the Cloud SQL Auth Proxy (a sidecar) or a private IP. This needs a service account and IAM permissions, so there is more cloud setup, but nothing to know about running Postgres. | A Service, a StatefulSet, a Secret and a volume claim. A few YAML files and it runs in minutes, the same way on k3d and on GKE. A production-grade setup with replication and failover needs an operator such as CloudNativePG, which adds real work. |
| **Cost** | Billed for the instance (vCPU and memory) every hour it exists, plus storage, backups and network egress. Even the smallest instance costs tens of dollars a month, and high availability roughly doubles it. It is billed even when idle. | Only the disk, which is cents per GB per month, plus the CPU and memory it takes from nodes we already pay for. Cheap in money, expensive in people's time. |
| **Maintenance** | Google patches the engine and the operating system in a maintenance window, grows storage automatically, monitors the instance and handles failover when high availability is on. Upgrading the major version is a supported operation. | We do all of it: updating the image, planning major upgrades with `pg_upgrade`, tuning, monitoring and expanding the volume. With a single replica any node upgrade or crash means downtime, and the disk is tied to one zone. |
| **Backups** | Automated daily backups and point-in-time recovery, restorable with one command or click, plus on-demand backups and clones. Restoring can be tested in minutes. | Nothing by default. We must build it: a `pg_dump` CronJob that uploads to Cloud Storage (exercise 3.10) is simple, but it only recovers to the last dump, so up to a day of data can be lost, and restoring is a manual `psql` procedure that someone must rehearse. Volume snapshots or WAL archiving with pgBackRest or Barman give better recovery, but they are more machinery to run and to test. |
| **Control and portability** | Limited: some extensions and settings are not allowed, there is no superuser, and the service is specific to one cloud (although it is standard Postgres). | Full control over version, extensions and configuration, and the same setup runs anywhere, including a laptop, so development matches production. |

### Which one for this project

For a course project with throwaway data, running Postgres ourselves is the sensible choice: it costs almost nothing, it is the same everywhere, and the daily dump to Cloud Storage covers the risk that matters here.

For a real product with customer data the balance changes. The tested restore, point-in-time recovery, patching and failover that Cloud SQL includes are exactly what a small team is least able to build and keep working, and their price is usually lower than the cost of one serious data loss. The middle road is a Postgres operator in the cluster, which gives replication and continuous backups but still leaves the operating work with us.
