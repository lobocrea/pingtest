import express from 'express';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3579;

// Middleware para parsear JSON
app.use(express.json());

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

// Función para hacer ping usando navegador headless
async function pingUrlWithBrowser(url) {
  let browser = null;
  let page = null;
  
  try {
    // Validar URL
    new URL(url);
    
    const startTime = Date.now();
    
    // Configurar Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // Ignorar errores de certificados SSL
    await page.setBypassCSP(true);
    
    // Configurar User-Agent y viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Configurar timeout
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    
    // Navegar a la URL
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Obtener información adicional de la página
    const title = await page.title().catch(() => 'No disponible');
    const finalUrl = page.url();
    
    // Verificar si hay JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      url: url,
      finalUrl: finalUrl,
      title: title,
      redirected: finalUrl !== url,
      jsErrors: jsErrors,
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
      finalUrl: url,
      title: 'No disponible',
      redirected: false,
      jsErrors: [],
      timestamp: new Date().toISOString()
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Endpoint para hacer ping
app.get('/api/ping', async (req, res) => {
  const targetUrl = req.query.url || 'https://icp.administracionelectronica.gob.es/icpplus/index.html';
  
  try {
    const result = await pingUrlWithBrowser(targetUrl);
    
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

// Endpoint POST para hacer ping con URL personalizada
app.post('/api/ping', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL es requerida',
      message: 'Debe proporcionar una URL válida',
      statusCategory: 'validation-error',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const result = await pingUrlWithBrowser(url);
    
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