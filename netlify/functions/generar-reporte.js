// ═══════════════════════════════════════════════════════════════════
//  PupCare — Netlify Function: generar-reporte.js
//  Analiza la foto mensual del cachorro con Gemini 2.5 Flash
//  y devuelve un reporte de desarrollo personalizado.
//
//  Endpoint: POST /.netlify/functions/generar-reporte
//  Body:     { mes, datosExtra, fotoBase64 }
// ═══════════════════════════════════════════════════════════════════

// Cabeceras CORS — permiten peticiones desde cualquier origen Netlify/local
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type":                 "application/json",
};

// Modelo a usar — Gemini 2.5 Flash (multimodal, rápido y económico)
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Handler principal ────────────────────────────────────────────────────────
exports.handler = async (event) => {

  // Pre-flight CORS (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // Solo aceptamos POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Método no permitido. Usa POST." }),
    };
  }

  // ── Validar API Key ────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY no configurada en las variables de entorno.");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Configuración del servidor incompleta." }),
    };
  }

  // ── Parsear el body ────────────────────────────────────────────────────────
  let mes, datosExtra, fotoBase64;
  try {
    ({ mes, datosExtra, fotoBase64 } = JSON.parse(event.body || "{}"));
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "JSON inválido en el body de la petición." }),
    };
  }

  // Validar campos requeridos
  if (!mes || !fotoBase64) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Faltan campos requeridos: mes y fotoBase64." }),
    };
  }

  // ── Construir el prompt para Gemini ───────────────────────────────────────
  const prompt = `
Eres un experto veterinario y criador profesional especializado en la raza American Bully 
y perros de tipo Molosoide/Bull. Tienes más de 20 años de experiencia analizando el 
desarrollo físico, muscular y óseo de cachorros de esta raza mes a mes.

Se te proporciona:
- La foto del cachorro en su mes: ${mes}
- Datos adicionales del registro: ${datosExtra || "No especificados"}

Analiza la imagen con atención a:
• Desarrollo muscular (especialmente cuello, hombros y cuartos traseros)
• Proporciones óseas y estructura corporal para la edad indicada
• Condición corporal general (ni muy delgado ni obeso)
• Desarrollo del cráneo y maseteros (característica clave de la raza)
• Postura, aplomo y ángulos articulares

Responde ÚNICAMENTE con este formato HTML exacto, sin texto adicional antes ni después,
sin bloques de código markdown, sin \`\`\`html:

<div class="reporte-seccion">
  <span class="reporte-icono">🚀</span>
  <div>
    <strong class="reporte-titulo">Cambio Significativo</strong>
    <p class="reporte-texto">[Tu análisis visual del desarrollo para el ${mes}. Máximo 2 oraciones claras y específicas para esta raza.]</p>
  </div>
</div>
<div class="reporte-seccion">
  <span class="reporte-icono">🦴</span>
  <div>
    <strong class="reporte-titulo">Consejo de Cuidado</strong>
    <p class="reporte-texto">[Un tip concreto y accionable de nutrición, ejercicio o salud específico para el ${mes} en un American Bully. Máximo 2 oraciones.]</p>
  </div>
</div>
`.trim();

  // ── Construir el payload para Gemini ──────────────────────────────────────
  // Extraer el mimeType del base64 si viene con prefijo data:image/...
  let mimeType = "image/jpeg"; // fallback
  let imageData = fotoBase64;

  if (fotoBase64.startsWith("data:")) {
    const match = fotoBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType  = match[1];
      imageData = match[2];
    }
  }

  const geminiPayload = {
    contents: [
      {
        parts: [
          // Parte 1: texto del prompt
          { text: prompt },
          // Parte 2: imagen en base64 (multimodal)
          {
            inline_data: {
              mime_type: mimeType,
              data:      imageData,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature:     0.4,   // respuestas consistentes, no demasiado creativas
      maxOutputTokens: 512,   // suficiente para el reporte corto
      topP:            0.9,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_NONE" },
    ],
  };

  // ── Llamar a la API de Gemini ──────────────────────────────────────────────
  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("❌ Error de Gemini API:", geminiRes.status, errText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Error de la API de Gemini (${geminiRes.status}). Intenta de nuevo.`,
        }),
      };
    }

    const geminiData = await geminiRes.json();

    // Extraer el texto generado
    const reporte =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!reporte.trim()) {
      console.warn("⚠️ Gemini devolvió una respuesta vacía:", JSON.stringify(geminiData));
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          reporte: `<div class="reporte-seccion">
            <span class="reporte-icono">⚠️</span>
            <div>
              <strong class="reporte-titulo">Sin análisis disponible</strong>
              <p class="reporte-texto">No se pudo generar el análisis esta vez. Intenta de nuevo al guardar.</p>
            </div>
          </div>`,
        }),
      };
    }

    // ── Éxito: devolver el reporte HTML ──────────────────────────────────────
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reporte: reporte.trim() }),
    };

  } catch (err) {
    console.error("❌ Error inesperado en generar-reporte:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Error interno del servidor. Revisa los logs de Netlify.",
      }),
    };
  }
};
