# Express Ping Checker

Un servidor Express.js que verifica el estado de sitios web mediante ping HTTP y presenta los resultados en una interfaz web moderna.

## Características

- ✅ Verificación de estado HTTP de sitios web
- ⏱️ Medición de tiempo de respuesta
- 🎨 Interfaz web moderna y responsive
- 🐳 Containerizado con Docker
- 🔄 Verificación automática al cargar la página

## Instalación Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## Despliegue con Docker

### Opción 1: Docker Compose (Recomendado)

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 2: Docker manual

```bash
# Construir imagen
docker build -t ping-checker .

# Ejecutar contenedor
docker run -d -p 3579:3579 --name ping-checker ping-checker
```

## Despliegue en VPS

1. **Clonar el repositorio en tu VPS:**
```bash
git clone <tu-repositorio>
cd express-ping-checker
```

2. **Ejecutar con Docker Compose:**
```bash
docker-compose up -d
```

3. **Configurar proxy reverso (opcional):**
Si usas Nginx, puedes configurar un proxy reverso:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3579;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## API Endpoints

- `GET /` - Interfaz web principal
- `GET /api/ping` - Endpoint que realiza el ping y devuelve el resultado en JSON

## Configuración

El servidor utiliza las siguientes variables de entorno:

- `PORT` - Puerto del servidor (por defecto: 3000)
- `NODE_ENV` - Entorno de ejecución (development/production)

## Monitoreo

El contenedor incluye un healthcheck que verifica el estado cada 30 segundos:

```bash
# Ver estado del healthcheck
docker-compose ps
```

## Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f ping-checker
```