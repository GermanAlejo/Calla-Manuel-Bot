# Usa una imagen base de Node.js compatible con ARM (Raspberry Pi)
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copia el resto de los archivos del proyecto
COPY . .

# Compila el proyecto TypeScript
RUN npm run build

# --- Fase de producción ---
FROM node:20-alpine

WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm ci --only=production

# Copia los archivos compilados desde la fase de construcción
COPY --from=builder /app/lib ./lib

# Variable de entorno para el token del bot (se debe proporcionar al ejecutar)
ENV BOT_TOKEN=your_token_here

# Comando para iniciar el bot
CMD ["npm", "start"]