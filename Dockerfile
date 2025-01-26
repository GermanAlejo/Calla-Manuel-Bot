# Dockerfile
# --- Etapa de construcción (build) ---
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Copiar archivos de dependencias y configuración
    COPY package*..json ./
    COPY tsconfig.json ./
    
    # Instalar dependencias (incluyendo devDependencies)
    RUN npm install
    
    # Copiar código fuente
    COPY src ./src
    
    # Compilar TypeScript a JavaScript
    RUN npm run build
    
    # Eliminar dependencias de desarrollo (opcional, reduce tamaño)
    RUN npm prune --production
    
    # --- Etapa de ejecución ---
    FROM node:20-alpine
    
    WORKDIR /app
    
    # Copiar solo lo necesario desde la etapa de construcción
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/lib ./lib    
    COPY .env ./
    
    # Comando para iniciar el bot
    CMD ["npm", "start"]