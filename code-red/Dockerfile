FROM node:20-alpine

WORKDIR /app

# Copy workspace root + both workspace package.json files first for caching
COPY package.json package-lock.json* ./
COPY server/package.json server/
COPY client/package.json client/

RUN npm install

# Copy everything else
COPY . .

# Build the React client
RUN npm run build

# Expose the server port
EXPOSE 5000

# Start Express (serves API + client/dist in production)
ENV NODE_ENV=production
CMD ["npm", "start"]
