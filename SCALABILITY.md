# TaskFlow — Scalability & Production Readiness Notes

## Current Architecture

```
Client (React SPA)
      │
      ▼
  Express API  ──►  PostgreSQL
      │
      ▼
   Winston Logs
```

This single-server setup handles development and moderate load well. Below is the roadmap to scale each layer.

---

## 1. Horizontal Scaling — Multiple API Instances

The Express app is **stateless by design**:
- No in-memory session state (JWT-based auth)
- Refresh tokens stored in the database, not in-process

This means the API can be scaled horizontally immediately:

```
          ┌─────────────────────┐
Client ──►│   Load Balancer     │  (NGINX / AWS ALB)
          └────────┬────────────┘
          ┌────────┼────────┐
          ▼        ▼        ▼
        API-1    API-2    API-3   (Node.js instances)
          │        │        │
          └────────┴────────┘
                   │
           ┌───────┴───────┐
           ▼               ▼
       PostgreSQL        Redis
      (Primary DB)    (Cache + Sessions)
```

**How to run:**
```bash
# PM2 cluster mode (use all CPU cores)
pm2 start src/server.js -i max --name taskflow-api
```

---

## 2. Caching with Redis

High-read endpoints (task lists, stats) are bottlenecked by DB queries. Redis eliminates repeated reads:

```javascript
// Cache middleware pattern (ready to plug in)
const cacheMiddleware = (ttlSeconds) => async (req, res, next) => {
  const key = `cache:${req.user.id}:${req.originalUrl}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));

  res.sendResponse = res.json.bind(res);
  res.json = (body) => {
    redis.setex(key, ttlSeconds, JSON.stringify(body));
    res.sendResponse(body);
  };
  next();
};

// Usage
router.get('/tasks', authenticate, cacheMiddleware(30), getTasks);
```

**Cache invalidation:** Bust the user's task cache on every create/update/delete.

---

## 3. Database Optimisation

### Indexes already in place:
- `tasks.user_id` — primary filter for user-scoped queries
- `tasks.status`, `tasks.priority`, `tasks.due_date` — filter columns

### Additions for scale:

```sql
-- Full-text search on title + description (replaces ILIKE)
ALTER TABLE tasks ADD COLUMN search_vector tsvector;
CREATE INDEX tasks_search_idx ON tasks USING GIN(search_vector);

-- Partial index for active tasks
CREATE INDEX tasks_active_idx ON tasks(user_id, created_at)
  WHERE status != 'archived';
```

### Read replicas:
Configure Sequelize to route writes to primary and reads to replicas:

```javascript
const sequelize = new Sequelize({
  replication: {
    read: [{ host: 'replica-1' }, { host: 'replica-2' }],
    write: { host: 'primary' }
  }
});
```

---

## 4. Microservices Evolution Path

As the product grows, the monolith splits naturally along domain boundaries:

```
┌─────────────────────────────────────────┐
│           API Gateway (Kong/NGINX)       │
└───┬──────────┬──────────┬───────────────┘
    ▼          ▼          ▼
 Auth         Task      Notification
 Service      Service    Service
    │          │
    └────┬─────┘
         ▼
     Message Bus
    (RabbitMQ / Kafka)
```

**Migration strategy:**
1. Extract auth into its own service first (most standalone)
2. Use the message bus for cross-service events (e.g. `task.completed` triggers notification)
3. Introduce an API gateway for routing, rate limiting, and auth delegation

---

## 5. Docker & Kubernetes Deployment

The included `Dockerfile` uses multi-stage builds for lean production images (~150MB).

**Kubernetes deployment sketch:**

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskflow-api
spec:
  replicas: 3                   # Scale horizontally
  selector:
    matchLabels:
      app: taskflow-api
  template:
    spec:
      containers:
      - name: api
        image: taskflow-api:latest
        resources:
          requests: { cpu: "100m", memory: "128Mi" }
          limits:   { cpu: "500m", memory: "512Mi" }
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: taskflow-secrets
              key: jwt-secret
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: taskflow-api-hpa
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }
```

---

## 6. Observability

| Concern      | Tool                         | Status              |
|--------------|------------------------------|---------------------|
| Logging      | Winston (file + console)     | ✅ Implemented       |
| HTTP logging | Morgan                       | ✅ Implemented       |
| Metrics      | Prometheus + Grafana         | Plug-in ready       |
| Tracing      | OpenTelemetry                | Future              |
| Alerting     | PagerDuty / Grafana Alerts   | Future              |

**Adding Prometheus metrics (5 min):**
```bash
npm install prom-client
```
```javascript
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

---

## 7. Queue-Based Background Jobs

Long-running tasks (email notifications, report generation, bulk imports) should never block the HTTP request cycle:

```
API  ──► BullMQ Queue (Redis) ──► Worker Process
         └─ emailQueue            └─ sends emails async
         └─ reportQueue           └─ generates PDFs
```

---

## Summary

| Concern               | Solution                         |
|-----------------------|----------------------------------|
| Stateless API         | ✅ JWT, no server-side sessions   |
| Horizontal scale      | PM2 cluster / K8s HPA            |
| DB read load          | Read replicas + Redis cache       |
| DB write load         | Connection pooling (configured)  |
| Search performance    | PostgreSQL full-text index        |
| Service decomposition | Microservices + message bus       |
| Deployment            | Docker multi-stage + K8s          |
| Observability         | Winston + Prometheus + OTel       |
| Background work       | BullMQ + Redis                   |
