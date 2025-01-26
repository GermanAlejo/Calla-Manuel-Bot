# Dockerfile
# --- Etapa de construcción (build) ---
    FROM node:20-alpine AS builder

    WORKDIR /
    
    # Copiar SOLO los archivos necesarios para instalar dependencias
    # Incluye package-lock.json si existe
    COPY package.json package-lock.json* ./  
    COPY tsconfig.json ./
    
    # Instalar dependencias
    RUN npm install
    
    # Copiar el resto del código
    COPY src ./src
    
    # Compilar TypeScript
    RUN npm run build
    
    # Eliminar devDependencies
    RUN npm prune --production
    
    # --- Etapa de ejecución ---
    FROM node:20-alpine
    
    WORKDIR /
    
    # Copiar desde la etapa de construcción
    COPY --from=builder /package*.json ./
    COPY --from=builder /node_modules ./node_modules
    COPY --from=builder /lib ./lib
    COPY .env ./
    
    CMD ["npm", "start"]