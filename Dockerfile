# Dockerfile
# --- Etapa de construcción (build) ---
    FROM node:20 AS base

    WORKDIR /home/node/app
    
    # Copiar SOLO los archivos necesarios para instalar dependencias
    # Incluye package-lock.json si existe
    COPY package.json ./
    COPY tsconfig.json ./
    
    # Instalar dependencias
    RUN npm install
    
    # Copiar el resto del código
    COPY src ..

    FROM base as production

    ENV NODE_PATH=./build

    RUN npm run build
    
    # Compilar TypeScript
    #RUN npm run build || echo "Advertencia: Hubo errores de compilación, pero continuamos..."
    
    # Eliminar devDependencies
    #RUN npm prune --production
    
    # --- Etapa de ejecución ---
    #FROM node:20-alpine
    
    #WORKDIR /home/node/app
    
    # Copiar desde la etapa de construcción
    #COPY --from=builder /package*.json ./
    #COPY --from=builder /node_modules ./node_modules
    #COPY --from=builder /lib ./lib
    #COPY .env ./
    #
    #CMD ["npm", "start"]