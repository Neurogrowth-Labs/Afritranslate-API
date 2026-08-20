# AfriTranslate API - Deployment Considerations

A comprehensive guide covering deployment challenges, server resources, open-source translation engine integration, API key management, and monetization strategies for the AfriTranslate Translation API Platform.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Deployment Challenges](#deployment-challenges)
3. [Server Resources & Infrastructure](#server-resources--infrastructure)
4. [LibreTranslate Self-Hosted Deployment](#libretranslate-self-hosted-deployment)
5. [API Key Management](#api-key-management)
6. [Monetization Models](#monetization-models)
7. [Security Considerations](#security-considerations)
8. [Scaling Strategies](#scaling-strategies)
9. [Cost Analysis](#cost-analysis)

---

## Project Overview

AfriTranslate is a translation API wrapper designed to simplify enterprise integration with multiple translation engines:

- **Gemini AI** (Default, production-grade)
- **Google Cloud Translation API**
- **DeepL API**
- **LibreTranslate** (Open-source, self-hostable)
- **Offline fallback dictionary**

The platform provides:
- REST API for translation services
- Webhook integrations (WhatsApp, Telegram, Generic)
- User authentication & API key management
- Translation history & analytics
- AI Playground with multiple Gemini models

---

## Deployment Challenges

### 1. Multi-Engine Architecture Complexity

**Challenge**: Managing multiple translation engines with different authentication methods, rate limits, and response formats.

**Solutions**:
- Implement a unified adapter pattern for all translation engines
- Use environment-based configuration for engine selection
- Implement circuit breaker patterns for engine failover

### 2. Real-Time Performance Requirements

**Challenge**: Low-latency translation is critical for chat/messaging integrations.

**Solutions**:
- Deploy in multiple regions close to users
- Implement response caching for frequently translated phrases
- Use connection pooling for external API calls
- Consider edge deployment for webhook handlers

### 3. State Management

**Challenge**: Current implementation uses file-based JSON database (`db.json`), not suitable for production.

**Migration Required**:
```
Current: db.json (file-based)
Target:  PostgreSQL / MySQL / MongoDB
```

**Why**:
- File locks cause race conditions under load
- No query optimization or indexing
- No backup/replication support
- Data loss risk on server failure

### 4. Secret Management

**Challenge**: Multiple API keys for different services need secure storage.

**Required Secrets**:
| Secret | Purpose |
|--------|---------|
| `SECRET_KEY` | JWT signing for user authentication |
| `GEMINI_API_KEY` | Google Gemini AI access |
| `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation |
| `DEEPL_API_KEY` | DeepL translation service |
| `LIBRETRANSLATE_API_KEY` | Self-hosted LibreTranslate |

**Solutions**:
- Use AWS Secrets Manager / HashiCorp Vault
- Vercel/Railway environment variables for PaaS
- Never commit secrets to git

---

## Server Resources & Infrastructure

### Minimum Requirements (Development/Testing)

| Resource | Specification |
|----------|--------------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Storage | 20 GB SSD |
| Network | 100 Mbps |

### Recommended Production Setup

| Component | Specification | Purpose |
|-----------|--------------|---------|
| **API Server** | 4 vCPU, 8 GB RAM | Node.js Express server |
| **Database** | 2 vCPU, 4 GB RAM, 100 GB SSD | PostgreSQL/MySQL |
| **LibreTranslate** | 4-8 vCPU, 16-32 GB RAM, GPU optional | ML translation models |
| **Cache** | 2 GB RAM | Redis for session/cache |
| **Load Balancer** | - | nginx/ALB |

### AWS EC2 Instance Recommendations

| Workload | Instance Type | Monthly Cost (approx.) |
|----------|--------------|----------------------|
| Development | t3.medium | $30-40 |
| Small Production | t3.large | $60-80 |
| Medium Production | m5.xlarge | $140-180 |
| LibreTranslate (CPU) | c5.2xlarge | $250-300 |
| LibreTranslate (GPU) | g4dn.xlarge | $380-450 |

---

## LibreTranslate Self-Hosted Deployment

### Why Self-Host LibreTranslate?

1. **No per-character costs** - Pay only for infrastructure
2. **Data privacy** - Translations never leave your servers
3. **No rate limits** - Scale based on your infrastructure
4. **Offline capability** - Works without internet after setup
5. **Customization** - Add custom language models

### EC2 Deployment Guide

#### Step 1: Launch EC2 Instance

```bash
# Recommended: Ubuntu 22.04 LTS
# Instance: c5.2xlarge (8 vCPU, 16 GB RAM) for production
# Storage: 50 GB gp3 SSD
# Security Group: Allow ports 22 (SSH), 5000 (LibreTranslate)
```

#### Step 2: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y
```

#### Step 3: Deploy LibreTranslate

**Option A: Basic Deployment**
```bash
docker run -d \
  --name libretranslate \
  -p 5000:5000 \
  --restart unless-stopped \
  libretranslate/libretranslate:latest
```

**Option B: Production with Persistence**
```yaml
# docker-compose.yml
version: '3.8'

services:
  libretranslate:
    image: libretranslate/libretranslate:latest
    container_name: libretranslate
    restart: always
    ports:
      - "5000:5000"
    environment:
      - LT_LOAD_ONLY=en,fr,sw,yo,zu,ha,am,ar  # African languages
      - LT_API_KEYS=true
      - LT_REQUIRE_API_KEY_ORIGIN=true
      - LT_SUGGESTIONS=true
      - LT_DISABLE_WEB_UI=false
      - LT_CHAR_LIMIT=5000
      - LT_REQ_LIMIT=100
      - LT_REQ_LIMIT_STORAGE=memory
    volumes:
      - lt-data:/home/libretranslate/.local
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/languages"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  lt-data:
```

```bash
docker compose up -d
```

#### Step 4: Configure nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/libretranslate
server {
    listen 80;
    server_name translate.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # For long translation requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

#### Step 5: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d translate.yourdomain.com
```

#### Step 6: Connect to AfriTranslate

1. In AfriTranslate dashboard, go to Settings > Translation Engines
2. Set LibreTranslate URL: `https://translate.yourdomain.com`
3. Add API key if configured
4. Test connection

Or via API:
```bash
curl -X POST http://your-afritranslate-api/api/v1/libretranslate/config \
  -H "Content-Type: application/json" \
  -d '{
    "api_url": "https://translate.yourdomain.com",
    "api_key": "your-lt-api-key"
  }'
```

### LibreTranslate Language Support

Currently supported African languages in LibreTranslate:
- Swahili (sw)
- Arabic (ar)
- French (fr) - widely used in Africa

**Note**: Many African languages (Yoruba, Hausa, Zulu, Amharic) are not natively supported by LibreTranslate. For these, you should:
1. Fall back to Gemini AI or Google Translate
2. Consider training custom Argos Translate models
3. Use the offline dictionary fallback

---

## API Key Management

### Current Implementation

The platform supports three API key environments:
- **Production** (`afri_live_*`)
- **Development** (`afri_dev_*`)
- **Test** (`afri_test_*`)

### Key Features

| Feature | Status |
|---------|--------|
| Key generation | Implemented |
| Key hashing (SHA-256) | Implemented |
| Usage tracking | Implemented |
| Rate limiting per key | Not implemented |
| Key rotation | Not implemented |
| Scope/permissions | Basic |

### Recommended Enhancements

#### 1. Rate Limiting per API Key

```typescript
interface RateLimitConfig {
  key_id: number;
  requests_per_minute: number;
  requests_per_day: number;
  characters_per_month: number;
}
```

#### 2. Usage Quotas by Plan

```typescript
const PLANS = {
  free: {
    characters_per_month: 100_000,
    requests_per_minute: 10,
    engines: ['demo']
  },
  starter: {
    characters_per_month: 1_000_000,
    requests_per_minute: 60,
    engines: ['gemini', 'libretranslate']
  },
  business: {
    characters_per_month: 10_000_000,
    requests_per_minute: 300,
    engines: ['gemini', 'google', 'deepl', 'libretranslate']
  },
  enterprise: {
    characters_per_month: -1, // unlimited
    requests_per_minute: 1000,
    engines: ['all'],
    dedicated_support: true
  }
};
```

#### 3. Key Rotation Policy

- Automatically expire keys after 90 days
- Generate new keys without downtime
- Maintain old key validity for 7 days after rotation
- Audit log for all key operations

---

## Monetization Models

### Model 1: Freemium + Pay-Per-Use

| Tier | Price | Included | Overage |
|------|-------|----------|---------|
| Free | $0/mo | 100K chars | N/A |
| Starter | $29/mo | 1M chars | $0.05/1K chars |
| Business | $99/mo | 10M chars | $0.03/1K chars |
| Enterprise | Custom | Unlimited | N/A |

**Pros**: Low barrier to entry, scales with usage
**Cons**: Unpredictable revenue, requires usage monitoring

### Model 2: Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/mo | 100K chars, 1 API key, community support |
| Pro | $49/mo | 5M chars, 5 API keys, email support, analytics |
| Team | $199/mo | 25M chars, 20 API keys, priority support, webhooks |
| Enterprise | $999/mo | Unlimited, custom SLA, dedicated instance |

**Pros**: Predictable revenue, simpler billing
**Cons**: May deter light users

### Model 3: White-Label / Self-Hosted License

| Option | Price | Includes |
|--------|-------|----------|
| Cloud API | Per-use | Hosted solution |
| On-Premise License | $5,000/year | Self-hosted, updates included |
| Enterprise License | $25,000/year | Multi-tenant, custom branding |

**Pros**: High-value enterprise deals
**Cons**: Requires sales team, support overhead

### Model 4: Marketplace Integration Fees

Charge a percentage for integrations:
- WhatsApp Business: 2% of translation volume
- Telegram Bot: 2% of translation volume
- Custom Webhooks: 1.5% of translation volume

### Recommended Strategy

**Hybrid approach** combining Models 1 and 3:

1. **Free tier** - Attract developers, 100K chars/month
2. **Pay-as-you-go** - $0.00004 per character (~$40/1M chars)
3. **Volume discounts** - Lower rates at scale
4. **Enterprise self-hosted** - Annual license for data-sensitive customers

---

## Security Considerations

### Authentication & Authorization

- [x] JWT-based authentication
- [x] Password hashing (PBKDF2)
- [ ] Multi-factor authentication (MFA)
- [ ] OAuth2 / Social login
- [ ] Role-based access control (RBAC)

### API Security

- [x] CORS headers
- [ ] Request signing
- [ ] IP allowlisting per API key
- [ ] Webhook signature verification
- [ ] Rate limiting (global and per-key)

### Data Protection

- [ ] Encrypt sensitive data at rest
- [ ] TLS 1.3 for all connections
- [ ] PII data retention policies
- [ ] GDPR compliance features
- [ ] Audit logging

### Infrastructure Security

- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] VPC network isolation
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

---

## Scaling Strategies

### Horizontal Scaling

```
                    Load Balancer (ALB/nginx)
                           |
        +------------------+------------------+
        |                  |                  |
   API Server 1       API Server 2       API Server N
        |                  |                  |
        +------------------+------------------+
                           |
                      Redis Cluster
                           |
                   PostgreSQL (Primary)
                           |
                   PostgreSQL (Replicas)
```

### Caching Strategy

1. **Translation Cache** (Redis)
   - Key: `hash(source_text + source_lang + target_lang + engine)`
   - TTL: 24 hours
   - Hit rate target: 30-50% for common phrases

2. **Session Cache** (Redis)
   - User sessions
   - Rate limit counters
   - TTL: 1 hour

3. **API Response Cache** (CDN)
   - Language list
   - Static configuration
   - TTL: 1 hour

### Auto-Scaling Rules

```yaml
# AWS Auto Scaling Policy
scaling_policies:
  scale_up:
    metric: CPUUtilization
    threshold: 70%
    period: 300  # 5 minutes
    action: add 2 instances

  scale_down:
    metric: CPUUtilization
    threshold: 30%
    period: 600  # 10 minutes
    action: remove 1 instance

  min_instances: 2
  max_instances: 10
```

---

## Cost Analysis

### Monthly Cost Breakdown (Medium Scale: 10M chars/month)

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| API Servers | 2x t3.large | $120 |
| Database | RDS PostgreSQL db.t3.medium | $60 |
| LibreTranslate | 1x c5.xlarge | $150 |
| Redis Cache | ElastiCache t3.micro | $15 |
| Load Balancer | ALB | $25 |
| Storage | 100 GB EBS | $10 |
| Data Transfer | 500 GB | $45 |
| **Total Infrastructure** | | **$425** |

### Translation Engine Costs

| Engine | Cost per 1M chars | 10M chars/month |
|--------|------------------|-----------------|
| Gemini AI | ~$0.40 | $4 |
| Google Cloud | $20 | $200 |
| DeepL | $20 | $200 |
| LibreTranslate (self-hosted) | $0 (infra only) | $0 |

### Revenue Target

At 10M characters/month with tiered pricing:
- 5 Free users: 500K chars = $0
- 10 Starter ($29/mo): 10M chars = $290
- 2 Business ($99/mo): 20M chars = $198
- Total revenue: ~$488/month

**Break-even requires**: 15-20 paid subscribers at starter tier or above.

---

## Next Steps

1. **Phase 1: Database Migration**
   - Migrate from JSON file to PostgreSQL
   - Implement proper connection pooling
   - Add database backups

2. **Phase 2: Security Hardening**
   - Add rate limiting
   - Implement API key scoping
   - Add request logging/audit trail

3. **Phase 3: LibreTranslate Integration**
   - Deploy LibreTranslate on EC2
   - Configure engine failover
   - Test African language support

4. **Phase 4: Monetization**
   - Integrate Stripe for billing
   - Implement usage metering
   - Build admin dashboard

5. **Phase 5: Scale**
   - Set up CI/CD pipeline
   - Configure auto-scaling
   - Implement CDN caching

---

## References

- [LibreTranslate Documentation](https://github.com/LibreTranslate/LibreTranslate)
- [AWS EC2 Pricing](https://aws.amazon.com/ec2/pricing/)
- [Google Cloud Translation Pricing](https://cloud.google.com/translate/pricing)
- [DeepL API Documentation](https://www.deepl.com/docs-api)
- [Gemini API Documentation](https://ai.google.dev/)
