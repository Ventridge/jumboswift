# Jumboswift Payment Gateway API

Multi-provider payment gateway service supporting cards and mobile money payments.

## Tech Stack
- Node.js 21
- Express
- MongoDB
- Yarn

## Quick Start

### Docker Setup
```bash
# Clone repository
git clone https://github.com/Ventridge/jumboswift.git
cd jumboswift

# Create .env file
cp .env.example .env

# Start services
docker-compose up -d
```

### Environment Variables
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://mongodb:27017/jumboswift
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-byte-encryption-key
ADMIN_API_KEY=admin-api-key
ADMIN_API_SECRET=admin-api-secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=email-password
EMAIL_FROM=noreply@example.com
WEBHOOK_BASE_URL=https://api.example.com
```

## Development

```bash
# Install dependencies
yarn install

# Run in development
yarn start

# Build for production
yarn build

# Run production build
yarn serve
```

## Docker Commands

```bash
# Build image
docker build -t jumboswift .

# Run container
docker run -p 8000:8000 jumboswift

# Development mode
docker-compose -f docker-compose.dev.yml up
```

## API Documentation

Available at `/api-docs` in development mode.

### Key Endpoints

#### Payments
- `POST /api/v1/payments/process` - Process payment
- `POST /api/v1/payments/stk-push` - MPesa STK Push
- `GET /api/v1/payments/{id}/status` - Payment status

#### Invoices
- `POST /api/v1/invoices/create` - Create invoice
- `GET /api/v1/invoices/{id}` - Get invoice

#### Refunds
- `POST /api/v1/refunds/process` - Process refund
- `GET /api/v1/refunds/{id}` - Get refund

## Authentication

Required headers:
```
X-API-Key: your_api_key
X-API-Secret: your_api_secret
```

## Features

- Multi-provider payments (Cards, MPesa)
- Secure credential encryption
- Webhooks
- Scheduled payments
- Invoicing
- Refunds
- Transaction reporting
- Rate limiting
- IP whitelisting

## Security

- AES-256-CBC encryption
- PBKDF2 key derivation
- Request signing
- MongoDB sanitization
- XSS protection

## License

[MIT License](LICENSE)