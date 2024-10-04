### SRC BUILD STAGE
FROM node:18-alpine AS src_builder

WORKDIR /app

# Copy early on to prevent reinstalling dependencies when code (and not dependency config) changes
COPY ./package*.json ./
COPY ./tsconfig.json ./

RUN npm ci

# Copy entire project, including source code
COPY . .

# Generate Prisma model source
# Compile .ts code to .js
RUN npm run db:generate \
  && npm run pre:build \
  && npm run build

### FINAL STAGE
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /app

# Copy package json files and install prod dependencies only
COPY ./package*.json ./

# Remove prepare script (to skip husky hook install)
RUN npm pkg delete scripts.prepare
RUN npm ci --omit=dev

# Copy required files from src_builder stage
COPY --from=src_builder /app/dist /app
COPY --from=src_builder /app/prisma /app/prisma

# Install Prisma client and run script to generate model files
RUN npm install prisma -g \
  && npm run db:generate

CMD ["node", "./src/index.js"]