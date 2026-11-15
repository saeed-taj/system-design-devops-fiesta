# Kubernetes Autoscaling & Monitoring Lab

A hands-on Kubernetes and system design project demonstrating horizontal pod autoscaling, traffic management, load testing, and observability using a containerized FastAPI application.

The project deploys a FastAPI application on a local Kubernetes cluster created with **kind**. It uses Kubernetes Horizontal Pod Autoscaler (HPA) to scale application replicas from 1 to 5 based on CPU utilization under increasing workloads.

NGINX Ingress Controller handles external HTTP routing, while Prometheus and Grafana provide monitoring and visualization of cluster and application performance.

## Architecture

```text
                   Load Generator
                         |
                        k6
                         |
                         v
                NGINX Ingress Controller
                         |
                         v
                  Kubernetes Service
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
          FastAPI      FastAPI     FastAPI
           Pod 1        Pod 2       Pod N
             |           |           |
             +-----------+-----------+
                         |
                  Kubernetes HPA
                         |
                 Metrics Server
                         |
                 CPU Utilization

        Prometheus  --->  Grafana
        Metrics collection   Dashboards
```

## Features

- **Containerization:** Dockerized FastAPI application deployed to Kubernetes.
- **Kubernetes orchestration:** Deployment and Service resources manage application instances and internal traffic distribution.
- **Horizontal Pod Autoscaling:** Automatically scales replicas between 1 and 5 based on CPU utilization.
- **Metrics Server:** Supplies CPU and memory resource metrics to Kubernetes HPA.
- **Load testing:** k6 generates increasing workloads to evaluate application performance and trigger autoscaling.
- **Ingress routing:** NGINX Ingress Controller provides external HTTP routing into the cluster.
- **Monitoring:** Prometheus collects metrics and Grafana visualizes system performance.
- **Scale-down validation:** Observes replica reduction after load generation stops.

## Technology Stack

| Technology | Purpose |
|---|---|
| Kubernetes | Container orchestration |
| kind | Local Kubernetes cluster |
| Docker | Application containerization |
| FastAPI | Backend application |
| Metrics Server | CPU and memory metrics for HPA |
| HPA | Automatic Pod scaling |
| NGINX Ingress Controller | External HTTP routing |
| k6 | Load generation |
| Prometheus | Metrics collection |
| Grafana | Monitoring dashboards |

## Prerequisites

Install the following tools before starting:

1. **Docker** – Container runtime and image building.
2. **kubectl** – Kubernetes command-line tool.
3. **kind** – Local Kubernetes cluster management.
4. **Metrics Server** – Required for CPU-based HPA.
5. **Helm** – Recommended for installing the monitoring stack.
6. **k6** – Load-testing tool.

The cluster must have Metrics Server, NGINX Ingress Controller, and the Prometheus/Grafana monitoring stack installed and configured.

Verify your installations:

```bash
docker --version
kubectl version --client
kind version
helm version
k6 version
```

## 1. Create the Kubernetes Cluster

Create a local Kubernetes cluster using kind:

```bash
kind create cluster --name autoscaling-lab
```

Verify that the cluster is accessible:

```bash
kubectl cluster-info
kubectl get nodes
```

Check that the node is ready:

```bash
kubectl get nodes
```

## 2. Build and Load the Application Image

Build the FastAPI Docker image from your application directory:

```bash
docker build -t fastapi-hpa:latest .
```

Load the image into the kind cluster:

```bash
kind load docker-image fastapi-hpa:latest --name autoscaling-lab
```

Verify that the image is available:

```bash
docker images
```

> Make sure the image name in your Kubernetes Deployment matches the image you build. For a locally loaded image, configure an appropriate `imagePullPolicy`, such as `IfNotPresent`.

## 3. Verify Metrics Server

Metrics Server provides resource usage information to Kubernetes, allowing HPA to make CPU-based scaling decisions.

Verify that Metrics Server is running:

```bash
kubectl get pods -n kube-system
```

Check node metrics:

```bash
kubectl top nodes
```

Check Pod metrics:

```bash
kubectl top pods
```

If these commands return CPU and memory usage, the resource metrics pipeline is working.

## 4. Deploy the Application

Apply the FastAPI Deployment:

```bash
kubectl apply -f deployment.yaml
```

Apply the Kubernetes Service:

```bash
kubectl apply -f service.yml
```

Check the deployed resources:

```bash
kubectl get deployments
kubectl get services
kubectl get pods
```

Wait until the application Pods become ready.

## 5. Configure Horizontal Pod Autoscaling

Apply the HPA configuration:

```bash
kubectl apply -f hpa.yaml
```

The HPA is configured to:

- Maintain at least 1 application replica.
- Scale up to a maximum of 5 replicas.
- Target average CPU utilization of 50%.

Verify the HPA:

```bash
kubectl get hpa
```

Inspect detailed autoscaling information:

```bash
kubectl describe hpa
```

The HPA uses CPU utilization relative to the CPU requests configured in the Deployment.

## 6. Configure External Traffic Routing

The NGINX Ingress Controller routes incoming HTTP traffic to the Kubernetes Service.

Verify the Ingress Controller:

```bash
kubectl get pods -A
```

Check your Ingress resource:

```bash
kubectl get ingress
```

Inspect its configuration:

```bash
kubectl describe ingress
```

Make sure the Ingress host, paths, and backend Service match your application configuration.

> If you are using a custom kind cluster configuration, ensure the necessary host port mappings and Ingress networking configuration are in place.

## 7. Run Load Tests Using k6

The project uses k6 to generate concurrent traffic against the FastAPI application.

Run the load test:

```bash
k6 run loadtest.js
```

The test gradually increases workload to observe how the application and Kubernetes cluster respond.

Monitor autoscaling in separate terminals.

**Watch HPA changes:**

```bash
kubectl get hpa -w
```

**Watch Pod creation and termination:**

```bash
kubectl get pods -w
```

**Monitor live CPU and memory consumption:**

```bash
kubectl top pods
```

Observe the following behaviour:

1. The application initially runs with one replica.
2. Increasing workload raises CPU utilization.
3. HPA detects CPU utilization above the configured target.
4. Kubernetes increases the desired replica count.
5. The Deployment controller creates additional Pods.
6. After load generation stops, HPA gradually reduces the replica count.

The maximum replica count is configured as five.

## 8. Access Grafana

The monitoring stack provides Grafana dashboards for visualizing Kubernetes and application metrics.

Forward the Grafana service to your local machine:

```bash
kubectl port-forward svc/monitoring-stack-grafana 3000:80 -n monitoring
```

Open Grafana:

```text
http://localhost:3000
```

Retrieve the Grafana admin password from the Kubernetes Secret:

```bash
kubectl --namespace monitoring get secret monitoring-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

If your installation uses a different Secret name, first identify the available Grafana secrets:

```bash
kubectl get secrets -n monitoring
```

Use the configured Grafana admin username and retrieve the password from the Secret rather than storing credentials in this repository.

### What to Monitor

Use Grafana dashboards to observe:

- CPU utilization across application Pods.
- Memory consumption.
- Kubernetes Pod and Deployment status.
- HPA desired and current replica counts, if the relevant metrics are available.
- Application request rate and response latency, if application metrics are exposed and scraped by Prometheus.

> Prometheus needs appropriate scrape targets and exporters or application instrumentation. Metrics Server and Prometheus serve different purposes; installing Metrics Server alone does not automatically expose every application metric to Grafana.

## 9. Useful Kubernetes Commands

| Command | Purpose |
|---|---|
| `kubectl get nodes` | List cluster nodes |
| `kubectl get pods -A` | List Pods across namespaces |
| `kubectl get deployments` | View Deployments |
| `kubectl get services` | View Services |
| `kubectl get hpa` | View autoscaling configuration |
| `kubectl describe hpa` | Inspect HPA events and metrics |
| `kubectl top nodes` | View node resource usage |
| `kubectl top pods` | View Pod resource usage |
| `kubectl get ingress` | View Ingress resources |

## 10. Cleanup

Delete the deployed application resources:

```bash
kubectl delete -f hpa.yaml
kubectl delete -f service.yml
kubectl delete -f deployment.yaml
```

Delete the kind cluster when finished:

```bash
kind delete cluster --name autoscaling-lab
```

## Learning Outcomes

This project provides practical experience with:

- Kubernetes Deployments, Services, Pods, and Ingress.
- Horizontal Pod Autoscaling and resource requests.
- Kubernetes resource metrics and Metrics Server.
- Container image management with Docker and kind.
- Load testing and performance evaluation with k6.
- Prometheus-based metrics collection and Grafana dashboards.
- Understanding scaling behaviour, resource utilization, and application bottlenecks.

## Important Notes

- This is a local Kubernetes learning and benchmarking environment, not a production deployment.
- The maximum replica count is five, as configured in the HPA.
- Actual throughput depends on the application workload, CPU and memory allocation, cluster resources, and load generator capacity.
- A high request count or test iteration count should not be interpreted as requests per second.
- Production-scale deployments require additional considerations, including node provisioning, database scaling, caching, resilience, networking, and capacity planning.