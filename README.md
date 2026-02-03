# FoodONtracks 🍔

A full-stack food delivery platform built with Next.js, featuring real-time order tracking, restaurant management, and comprehensive delivery logistics.

## 🚀 Features

- **User Authentication**: Secure signup/login with role-based access control (RBAC)
- **Restaurant Management**: Browse restaurants, view menus, and manage restaurant data
- **Shopping Cart**: Add items to cart with real-time updates
- **Order Management**: Place orders and track delivery status
- **Delivery System**: Delivery agent assignment and tracking
- **Payment Integration**: Secure checkout process
- **Reviews & Ratings**: Restaurant and order reviews
- **Address Management**: Multiple delivery addresses support
- **Real-time Notifications**: Order status updates
- **Admin Dashboard**: Comprehensive admin panel for management
- **Image Uploads**: Cloudinary integration for menu items and restaurant images
- **Monitoring**: Azure Monitor and AWS CloudWatch integration
- **Responsive Design**: Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SWR** - Data fetching and caching
- **Context API** - State management

### Backend
- **Next.js API Routes** - Serverless API
- **MongoDB** - Primary database
- **Prisma** - ORM (optional/hybrid setup)
- **Mongoose** - MongoDB object modeling

### Cloud & DevOps
- **AWS ECS** - Container orchestration
- **Azure Monitor** - Application monitoring
- **CloudWatch** - Logging and monitoring
- **Docker** - Containerization
- **Cloudinary** - Image management
- **Vercel** - Deployment platform

### Development Tools
- **ESLint** - Code linting
- **Bruno** - API testing
- **TypeScript** - Type checking

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)
- Cloudinary account
- AWS account (for deployment)
- Azure account (for monitoring)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd S86-1225-TeamTrio-Full-Stack-With-NextjsAnd-AWS-Azure-FoodONtracks
   ```

2. **Install dependencies**
   ```bash
   cd foodontracks
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the `foodontracks` directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/foodontracks
   
   # Authentication
   JWT_SECRET=your-jwt-secret
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # AWS (optional)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   
   # Azure (optional)
   AZURE_MONITOR_CONNECTION_STRING=your-connection-string
   
   # Prisma (if used)
   DATABASE_URL=your-database-url
   ```

4. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode

```bash
cd foodontracks
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Using Docker

```bash
# From the root directory
docker-compose up
```

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
foodontracks/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── cart/         # Shopping cart
│   │   ├── checkout/     # Checkout flow
│   │   ├── dashboard/    # Admin dashboard
│   │   ├── orders/       # Order management
│   │   └── restaurants/  # Restaurant pages
│   ├── components/       # Reusable React components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── middleware/       # API middleware
│   ├── models/           # MongoDB models
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── scripts/              # Database and utility scripts
├── public/               # Static assets
└── docs/                 # Documentation
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `node scripts/seed-mongodb.js` - Seed MongoDB with sample data
- `node scripts/quick-seed-users.cjs` - Seed users quickly
- `node scripts/db_counts.js` - Check database counts
- `node scripts/check-prisma-migration.js` - Check Prisma migration status

### Utilities
- `node check-menu-items.cjs` - Verify menu items
- `node add-image-to-menu.cjs` - Add images to menu
- `node test-mongo-connection.cjs` - Test MongoDB connection

## 🔐 Role-Based Access Control (RBAC)

The application supports multiple user roles:
- **Admin**: Full system access
- **Restaurant Owner**: Manage own restaurants
- **Delivery Agent**: Manage deliveries
- **Customer**: Browse and order food

Roles are configured in [src/config/roles.ts](foodontracks/src/config/roles.ts)

## 🧪 Testing

API testing is available using Bruno:
```bash
# Navigate to the bruno collection
cd foodontracks/foodontracks
# Open with Bruno client
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### AWS ECS
The project includes an ECS task definition:
```bash
# Build and push Docker image
docker build -t foodontracks .
docker tag foodontracks:latest <ecr-repo>:latest
docker push <ecr-repo>:latest

# Deploy using the task definition
aws ecs update-service --cluster <cluster> --service <service> --task-definition foodontracks
```

### Docker Compose
```bash
docker-compose up -d
```

## 📊 Monitoring & Logging

- **Azure Monitor**: Application insights and performance monitoring
- **AWS CloudWatch**: Log aggregation and metrics
- **Custom Logger**: Integrated logging middleware in [src/lib/logger.ts](foodontracks/src/lib/logger.ts)

## 🔒 Security Features

- JWT authentication
- CORS headers configuration
- Security headers middleware
- Input validation and sanitization
- Environment variable validation
- Request logging and audit trails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of the Kalvium S86-1225 curriculum.

## 👥 Team

**Team Trio** - Full Stack Development Team

## 📧 Support

For support and queries, please contact the development team.

---

**Built with ❤️ by Team Trio**
