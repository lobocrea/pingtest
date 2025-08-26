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

// Función mejorada para hacer ping usando navegador headless
async function pingUrlWithBrowser(url) {
  let browser = null;
  let page = null;
  
  try {
    // Validar URL
    new URL(url);
    
    const startTime = Date.now();
    
    // Configurar Puppeteer con opciones específicas para sitios gubernamentales
    browser = await puppeteer.launch({
      headless: true, // Cambiado a true para mejor rendimiento
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
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials'
      ]
    });
    
    page = await browser.newPage();
    
    // Configurar página para parecer más real
    await page.evaluateOnNewDocument(() => {
      // Eliminar propiedades que detectan automatización
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Simular plugins del navegador
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Simular idiomas
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es', 'en'],
      });
      
      // Eliminar la detección de Chrome headless
      window.chrome = {
        runtime: {},
      };
      
      // Simular propiedades adicionales del navegador
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
      });
      
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
      
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 0,
      });
      
      // Simular permisos
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Simular WebGL
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter.apply(this, arguments);
      };
      
      // Simular canvas fingerprinting
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const context = originalGetContext.apply(this, [type, ...args]);
        if (type === '2d') {
          const originalFillText = context.fillText;
          context.fillText = function(...args) {
            return originalFillText.apply(this, args);
          };
        }
        return context;
      };
    });
    
    // Configurar User-Agent y viewport más realistas
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Configurar headers adicionales
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });
    
    // Configurar timeout más largo para challenges JavaScript
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    
    // Capturar errores JavaScript en una lista
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.warn('🚨 JavaScript Error:', error.message);
    });
    
    console.log(`🌐 Navegando a: ${url}`);
    
    // Navegar a la URL
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0', // Cambiado a networkidle0 para esperar más
      timeout: 60000 
    });
    
    console.log(`📡 Respuesta inicial recibida: ${response.status()}`);
    
    // Usar setTimeout nativo de Node.js en lugar de page.waitForTimeout
    console.log('⏳ Esperando resolución de challenge JavaScript (15 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Verificar si aún estamos en una página de challenge
    let bodyText = await page.evaluate(() => document.body.textContent || '').catch(() => '');
    let isChallengePage = bodyText.includes('Please enable JavaScript') || 
                         bodyText.includes('support ID is') ||
                         bodyText.includes('challenge') ||
                         bodyText.includes('bobcmn') ||
                         bodyText.includes('Request Rejected');
    
    if (isChallengePage) {
      console.log('🔄 Challenge detectado, aplicando técnicas de evasión avanzadas...');
      
      // Intentar interactuar con la página de manera más realista
      try {
        // Simular movimientos del mouse más naturales
        for (let i = 0; i < 3; i++) {
          await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        }
        
        // Simular scroll natural
        await page.evaluate(() => {
          // Scroll suave hacia abajo
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              window.scrollBy(0, Math.random() * 100 + 50);
            }, i * 200);
          }
          
          // Disparar eventos que el challenge podría esperar
          window.dispatchEvent(new Event('mousemove'));
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('scroll'));
          
          // Simular interacción con elementos de la página
          const elements = document.querySelectorAll('button, input, a');
          if (elements.length > 0) {
            const randomElement = elements[Math.floor(Math.random() * elements.length)];
            if (randomElement) {
              randomElement.dispatchEvent(new Event('mouseover'));
              randomElement.dispatchEvent(new Event('focus'));
            }
          }
        });
        
        // Esperar más tiempo para que el challenge se resuelva
        console.log('⏳ Esperando resolución del challenge (20 segundos)...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        // Verificar nuevamente
        bodyText = await page.evaluate(() => document.body.textContent || '').catch(() => '');
        isChallengePage = bodyText.includes('Please enable JavaScript') || 
                         bodyText.includes('support ID is') ||
                         bodyText.includes('challenge') ||
                         bodyText.includes('bobcmn') ||
                         bodyText.includes('Request Rejected');
        
        // Si aún es challenge, intentar técnicas adicionales
        if (isChallengePage) {
          console.log('🔄 Aplicando técnicas adicionales de evasión...');
          
          // Intentar cambiar el User-Agent dinámicamente
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          // Simular más interacciones
          await page.evaluate(() => {
            // Simular typing en campos de input
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
            inputs.forEach(input => {
              input.focus();
              input.dispatchEvent(new Event('input'));
              input.dispatchEvent(new Event('change'));
            });
            
            // Simular clicks en botones
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
              button.dispatchEvent(new Event('click'));
            });
          });
          
          // Esperar más tiempo
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // Verificar una última vez
          bodyText = await page.evaluate(() => document.body.textContent || '').catch(() => '');
          isChallengePage = bodyText.includes('Please enable JavaScript') || 
                           bodyText.includes('support ID is') ||
                           bodyText.includes('challenge') ||
                           bodyText.includes('bobcmn') ||
                           bodyText.includes('Request Rejected');
        }
        
      } catch (interactionError) {
        console.warn('⚠️ Error en interacción:', interactionError.message);
      }
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Obtener información actualizada de la página
    const title = await page.title().catch(() => 'No disponible');
    const finalUrl = page.url();
    const finalBodyText = await page.evaluate(() => document.body.textContent || '').catch(() => '');
    
    // Obtener el HTML completo de la página para el iframe
    const pageHtml = await page.evaluate(() => document.documentElement.outerHTML).catch(() => '');
    
    // Verificar si el sitio finalmente cargó correctamente
    const challengeKeywords = ['Please enable JavaScript', 'Request Rejected', 'support ID is', 'challenge', 'bobcmn'];
    const hasChallenge = challengeKeywords.some(keyword => finalBodyText.includes(keyword));
    const isWorking = !hasChallenge && finalBodyText.length > 100;
    
    // Información de debug
    console.log(`📊 Contenido length: ${finalBodyText.length}`);
    console.log(`🔍 Challenge detectado: ${hasChallenge}`);
    console.log(`✅ Sitio funcionando: ${isWorking}`);
    
    // Guardar HTML en caché global
    if (!global.pageCache) global.pageCache = {};
    const cacheKey = new Date().toISOString();
    global.pageCache[cacheKey] = pageHtml;
    
    return {
      success: response.status() >= 200 && response.status() < 400,
      status: response.status(),
      statusText: response.statusText(),
      responseTime: responseTime,
      url: url,
      finalUrl: finalUrl,
      title: title,
      redirected: finalUrl !== url,
      jsErrors: jsErrors,
      challengeDetected: hasChallenge,
      contentLength: finalBodyText.length,
      isWorking: isWorking,
      contentPreview: finalBodyText.substring(0, 200) + (finalBodyText.length > 200 ? '...' : ''),
      pageHtml: pageHtml, // HTML completo para el iframe
      cacheKey: cacheKey, // Clave para acceder al HTML
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Error en ping: ${error.message}`);
    
    return {
      success: false,
      status: 0,
      statusText: 'Error',
      error: error.message,
      responseTime: Date.now() - startTime,
      url: url,
      finalUrl: url,
      title: 'No disponible',
      redirected: false,
      jsErrors: [error.message],
      challengeDetected: false,
      contentLength: 0,
      isWorking: false,
      contentPreview: '',
      timestamp: new Date().toISOString()
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.warn('Error cerrando página:', e.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn('Error cerrando navegador:', e.message);
      }
    }
  }
}

// Endpoint para hacer ping
app.get('/api/ping', async (req, res) => {
  const targetUrl = req.query.url || 'https://icp.administracionelectronica.gob.es/icpplus/index.html';
  
  try {
    console.log(`🎯 Iniciando ping a: ${targetUrl}`);
    const result = await pingUrlWithBrowser(targetUrl);
    
    // Determinar el status HTTP basado en el resultado
    if (result.success && result.isWorking) {
      res.status(200).json({
        ...result,
        message: 'Sitio web accesible y funcionando',
        statusCategory: 'success'
      });
    } else if (result.status >= 200 && result.status < 300 && result.challengeDetected) {
      res.status(200).json({
        ...result,
        message: 'Sitio accesible pero con protección anti-bot activa',
        statusCategory: 'challenge-detected'
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
    } else {
      res.status(200).json({
        ...result,
        message: 'No se pudo conectar al sitio web',
        statusCategory: 'connection-error'
      });
    }
  } catch (error) {
    console.error('Error en endpoint ping:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error interno del servidor',
      statusCategory: 'internal-error',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener el HTML de la página capturada
app.get('/api/page-html/:timestamp', async (req, res) => {
  const { timestamp } = req.params;
  
  try {
    // Buscar en el almacenamiento temporal (en producción usar Redis o similar)
    if (global.pageCache && global.pageCache[timestamp]) {
      const html = global.pageCache[timestamp];
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.send(html);
    } else {
      res.status(404).json({ error: 'Página no encontrada en caché' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener HTML de la página' });
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
    console.log(`🎯 Iniciando ping POST a: ${url}`);
    const result = await pingUrlWithBrowser(url);
    
    // Usar la misma lógica que el GET
    if (result.success && result.isWorking) {
      res.status(200).json({
        ...result,
        message: 'Sitio web accesible y funcionando',
        statusCategory: 'success'
      });
    } else if (result.status >= 200 && result.status < 300 && result.challengeDetected) {
      res.status(200).json({
        ...result,
        message: 'Sitio accesible pero con protección anti-bot activa',
        statusCategory: 'challenge-detected'
      });
    } else {
      res.status(200).json({
        ...result,
        message: result.error || 'No se pudo conectar al sitio web',
        statusCategory: 'connection-error'
      });
    }
  } catch (error) {
    console.error('Error en endpoint ping POST:', error);
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

// Función para limpiar caché antiguo
function cleanupOldCache() {
  if (global.pageCache) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora
    
    Object.keys(global.pageCache).forEach(key => {
      try {
        const timestamp = new Date(key);
        if (timestamp < oneHourAgo) {
          delete global.pageCache[key];
          console.log(`🗑️ Caché limpiado para: ${key}`);
        }
      } catch (error) {
        // Si la clave no es una fecha válida, eliminarla
        delete global.pageCache[key];
      }
    });
  }
}

// Limpiar caché cada 30 minutos
setInterval(cleanupOldCache, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Endpoint de ping disponible en: http://localhost:${PORT}/api/ping`);
  console.log(`🌐 URL objetivo por defecto: https://icp.administracionelectronica.gob.es/icpplus/index.html`);
  console.log(`🧹 Limpieza automática de caché cada 30 minutos`);
});