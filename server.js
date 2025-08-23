import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3579;

// Configurar archivos estáticos
app.use(express.static('public'));

// Función para obtener información del servidor
async function getServerInfo() {
  try {
    // Usar ipapi.co para obtener IP y ubicación
    const response = await axios.get('https://ipapi.co/json/', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Express-Ping-Checker/1.0'
      }
    });
    
    return {
      success: true,
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country_name,
      countryCode: response.data.country_code,
      timezone: response.data.timezone,
      isp: response.data.org,
      latitude: response.data.latitude,
      longitude: response.data.longitude
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      ip: 'No disponible',
      city: 'No disponible',
      region: 'No disponible',
      country: 'No disponible',
      countryCode: 'N/A',
      timezone: 'No disponible',
      isp: 'No disponible',
      latitude: null,
      longitude: null
    };
  }
}

// Endpoint para obtener información del servidor
app.get('/api/server-info', async (req, res) => {
  try {
    const serverInfo = await getServerInfo();
    res.json({
      ...serverInfo,
      timestamp: new Date().toISOString(),
      hostname: req.hostname,
      port: PORT
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Función para hacer ping a una URL
async function pingUrl(url) {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD', // Usamos HEAD para ser más eficiente
      timeout: 10000, // 10 segundos de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      url: url,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Error',
      error: error.message,
      responseTime: 0,
      url: url,
      timestamp: new Date().toISOString()
    };
  }
}

// Endpoint para hacer ping
app.get('/api/ping', async (req, res) => {
  const targetUrl = 'https://icp.administracionelectronica.gob.es/icpplus/index.html';
  
  try {
    const result = await pingUrl(targetUrl);
    
    // Determinar el status HTTP basado en el resultado
    if (result.success) {
      if (result.status >= 200 && result.status < 300) {
        res.status(200).json({
          ...result,
          message: 'Sitio web accesible',
          statusCategory: 'success'
        });
      } else if (result.status >= 300 && result.status < 400) {
        res.status(200).json({
          ...result,
          message: 'Redirección detectada',
          statusCategory: 'redirect'
        });
      } else if (result.status >= 400 && result.status < 500) {
        res.status(200).json({
          ...result,
          message: 'Error del cliente',
          statusCategory: 'client-error'
        });
      } else if (result.status >= 500) {
        res.status(200).json({
          ...result,
          message: 'Error del servidor',
          statusCategory: 'server-error'
        });
      }
    } else {
      res.status(200).json({
        ...result,
        message: 'No se pudo conectar al sitio web',
        statusCategory: 'connection-error'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error interno del servidor',
      statusCategory: 'internal-error',
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Endpoint de ping disponible en: http://localhost:${PORT}/api/ping`);
});