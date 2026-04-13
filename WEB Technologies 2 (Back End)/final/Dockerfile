# Use official Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose the application port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
