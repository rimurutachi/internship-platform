FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Typescript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]