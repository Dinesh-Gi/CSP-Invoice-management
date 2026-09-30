FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeit_csp" AUTH_SECRET="docker-build-only-secret" npx prisma generate

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeit_csp" AUTH_SECRET="docker-build-only-secret" npm run build

EXPOSE 3000

CMD ["npm", "start"]
