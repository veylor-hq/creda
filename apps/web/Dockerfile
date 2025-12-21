FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install deps
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

# Copy source
COPY . .

# Build for production
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000

# Start production server
CMD ["pnpm", "start"]
