# NestJS Monolithic Template

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, production-ready NestJS monolithic template with authentication, database integration, caching, and more. Perfect for developers who want to jump-start their backend development with a well-structured, scalable foundation.

## 🚀 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with Passport.js
- **Role-based access control** (RBAC) with custom decorators
- **Basic authentication** support
- **Guards** for route protection
- **Password hashing** with bcrypt

### 🗄️ Database Integration
- **TypeORM** for PostgreSQL with auto-loading entities
- **Mongoose** for MongoDB integration
- **Database migrations** and synchronization
- **Entity relationships** and validation

### ⚡ Performance & Caching
- **Redis** integration for caching and session management
- **Rate limiting** with ThrottlerGuard
- **Request/Response logging** with custom interceptors
- **Global exception filtering**

### 📝 API Documentation
- **Swagger/OpenAPI** documentation
- **Auto-generated API docs** at `/api/docs`
- **Bearer token authentication** support
- **Request/Response schemas**

### 🛠️ Development Tools
- **Environment-based configuration** (local, dev, qa, prod)
- **ESLint** and **Prettier** for code formatting
- **Jest** testing framework with coverage
- **E2E testing** setup
- **Hot reload** in development mode

### 📁 File Management
- **Static file serving** for uploads
- **Image processing** capabilities with Sharp
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- MongoDB (optional)
- Redis (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ervikassingh/nestjs-monolithic-template.git
   cd nestjs-monolithic-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create environment files based on your deployment stage:
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

## 🚀 Quick Start

### Development Mode
```bash
# Start with hot reload
npm run start:local:watch

# Start with debug mode
npm run start:local:debug
```

### Production Mode
```bash
# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

## 📚 Available Scripts

### Development
```bash
npm run start:local          # Start local environment
npm run start:local:watch    # Start with file watching
npm run start:local:debug    # Start with debug mode
npm run start:dev           # Start development environment
npm run start:qa            # Start QA environment
```

### Building
```bash
npm run build:local         # Build for local environment
npm run build:dev          # Build for development
npm run build:qa           # Build for QA
npm run build:prod         # Build for production
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
npm run test:e2e:watch     # Run e2e tests in watch mode
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## 🔧 Configuration

### Environment Variables
The application supports multiple environment configurations:
- `local` - Local development
- `dev` - Development environment
- `qa` - Quality assurance
- `prod` - Production environment

### Database Configuration
- **PostgreSQL**: Primary database with TypeORM
- **MongoDB**: Optional NoSQL database with Mongoose
- **Redis**: Caching and session storage

### Security Features
- **Rate Limiting**: Configurable throttling per endpoint
- **CORS**: Cross-origin resource sharing enabled
- **Validation**: Request validation with class-validator
- **Exception Handling**: Global exception filter

## 📖 API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **API Base URL**: `http://localhost:3000/api`

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build the Docker image
docker build -t nestjs-monolithic-template .

# Run the container
docker run -p 3000:3000 nestjs-monolithic-template
```

### Manual Deployment
1. Build the application: `npm run build:prod`
2. Set environment variables
3. Start the application: `npm run start:prod`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🆘 Support

- **Documentation**: [NestJS Docs](https://docs.nestjs.com/)
- **Community**: [NestJS Discord](https://discord.gg/G7Qnnhy)
- **Issues**: [GitHub Issues](https://github.com/nestjs-monolithic-template/issues)
- **Author**: [ervikassingh](https://github.com/ervikassingh)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript and JavaScript
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [Redis](https://redis.io/) - In-memory data structure store

---

**Happy Coding! 🎉**
