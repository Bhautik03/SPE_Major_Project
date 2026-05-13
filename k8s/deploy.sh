#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
#  Healthcare K8s Deployment Script (Minikube)
#  Usage: chmod +x k8s/deploy.sh && ./k8s/deploy.sh
# ──────────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Healthcare Management System — Minikube Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Start Minikube ───────────────────────────
echo ""
echo "▶ Starting Minikube..."
minikube start --driver=docker --memory=4096 --cpus=4
minikube addons enable ingress
minikube addons enable metrics-server

# ── Step 2: Pull images from Docker Hub ─────────────
echo ""
echo "▶ Pulling Docker images from Docker Hub..."
docker pull bhautik03/healthcare-auth:latest
docker pull bhautik03/healthcare-patient:latest
docker pull bhautik03/healthcare-frontend:latest

# ── Step 3: Load images into Minikube ───────────────
echo ""
echo "▶ Loading images into Minikube..."
minikube image load bhautik03/healthcare-auth:latest
minikube image load bhautik03/healthcare-patient:latest
minikube image load bhautik03/healthcare-frontend:latest

# ── Step 4: Apply namespaces ─────────────────────────
echo ""
echo "▶ Creating namespaces..."
kubectl apply -f "$SCRIPT_DIR/00-namespaces.yml"
sleep 2

# ── Step 5: Apply secrets ────────────────────────────
echo ""
echo "▶ Applying secrets..."
kubectl apply -f "$SCRIPT_DIR/01-secrets.yml"

# ── Step 6: Deploy database ──────────────────────────
echo ""
echo "▶ Deploying MongoDB..."
kubectl apply -f "$SCRIPT_DIR/deployment/mongodb-deployment.yml"
kubectl apply -f "$SCRIPT_DIR/service/mongodb-service.yml"
echo "   Waiting for MongoDB to be ready..."
kubectl wait --namespace=database \
  --for=condition=available deployment/mongodb \
  --timeout=120s

# ── Step 7: Deploy microservices (Deployments) ───────
echo ""
echo "▶ Deploying microservices..."
kubectl apply -f "$SCRIPT_DIR/deployment/auth-deployment.yml"
kubectl apply -f "$SCRIPT_DIR/deployment/patient-deployment.yml"
kubectl apply -f "$SCRIPT_DIR/deployment/frontend-deployment.yml"

# ── Step 8: Expose microservices (Services) ──────────
echo ""
echo "▶ Exposing microservices..."
kubectl apply -f "$SCRIPT_DIR/service/auth-service.yml"
kubectl apply -f "$SCRIPT_DIR/service/patient-service.yml"
kubectl apply -f "$SCRIPT_DIR/service/frontend-service.yml"

# ── Step 9: Apply ingress ────────────────────────────
echo ""
echo "▶ Applying Ingress routes..."
kubectl apply -f "$SCRIPT_DIR/02-ingress.yml"

# ── Step 10: Deploy monitoring stack ─────────────────
echo ""
echo "▶ Deploying monitoring stack (ELK + Prometheus + Grafana)..."
kubectl apply -f "$SCRIPT_DIR/03-monitoring.yml"

# ── Step 11: Update /etc/hosts ───────────────────────
echo ""
echo "▶ Updating /etc/hosts for healthcare.local..."
MINIKUBE_IP=$(minikube ip)
if grep -q "healthcare.local" /etc/hosts; then
  sudo sed -i "s/.*healthcare.local/$MINIKUBE_IP healthcare.local/" /etc/hosts
else
  echo "$MINIKUBE_IP healthcare.local" | sudo tee -a /etc/hosts
fi

# ── Done ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo ""
echo "  Service Access URLs (via Ingress):"
echo "  Frontend   → http://healthcare.local"
echo "  Auth API   → http://healthcare.local/auth"
echo "  Patient API→ http://healthcare.local/patients"
echo ""
echo "  NodePort URLs (direct access):"
echo "  Frontend   → http://$MINIKUBE_IP:30000"
echo "  Auth       → http://$MINIKUBE_IP:30001"
echo "  Patient    → http://$MINIKUBE_IP:30002"
echo "  Kibana     → http://$MINIKUBE_IP:30601"
echo "  Prometheus → http://$MINIKUBE_IP:30090"
echo "  Grafana    → http://$MINIKUBE_IP:30030 (admin/admin123)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Status check ─────────────────────────────────────
echo ""
echo "▶ Pod status across all namespaces:"
kubectl get pods --all-namespaces
