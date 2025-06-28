#!/bin/bash

# Production deployment script for bitespeed-backend

echo "🚀 Starting production deployment..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🔨 Building application..."
npm run build

# Start the server
echo "🌟 Starting server..."
npm start 