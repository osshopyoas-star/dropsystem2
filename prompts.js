// =============================================
// 🧠 PROMPTS DE IA DE CoDropX
// Viven en el servidor: el navegador solo envía los datos (producto, país...).
// Así nadie puede ver ni copiar tu "receta" desde el navegador.
// Para mejorar un prompt, edítalo aquí.
// =============================================

// Recorta textos que vienen del navegador para evitar abusos
const limpio = (v, max = 2000) => String(v ?? "").slice(0, max).trim();

// ---------- Desarrollo de producto: avatares, ángulos, guiones, creativos ----------
export const TIPOS_DESARROLLO = ["completo", "avatar", "angulos", "guiones", "creativos"];

export function promptDesarrollo(datos = {}) {
  const producto = limpio(datos.producto, 500);
  const info = limpio(datos.info, 3000);
  const tipo = TIPOS_DESARROLLO.includes(datos.tipo) ? datos.tipo : "completo";

  return `
Eres un estratega senior de ecommerce y marketing de respuesta directa.

CONTEXTO:
PRODUCTO / PROBLEMA / MECANISMO:
${producto || "No se escribió texto. Analiza la imagen."}

INFO ADICIONAL:
${info || "Sin info adicional"}

IMPORTANTE:
Si se adjunta una imagen, primero analízala y determina:
- qué producto es
- qué problema resuelve
- beneficios visibles o inferidos
- tipo de cliente ideal
- mecanismo o promesa principal

Si NO hay imagen, usa solo el texto.
Si HAY imagen, prioriza la imagen sobre el texto.

TIPO DE SALIDA:
${tipo}

Si el tipo es "completo", Devuelve EXACTAMENTE con estos títulos en MAYÚSCULA:

AVATARES:
ÁNGULOS:
GUIONES DE VIDEO:
CREATIVOS DE IMAGEN:
RECOMENDACIÓN FINAL:

1. AVATARES
- Crea 3 avatares diferentes
- Cada avatar debe incluir:
  - nombre
  - dolor principal
  - deseo
  - objeción
  - trigger de compra

2. ÁNGULOS
- Para CADA avatar crea exactamente 5 ángulos de venta
- No mezcles ángulos entre avatares
- Cada ángulo debe ser distinto y útil para una landing page diferente

3. GUIONES DE VIDEO
- Para CADA avatar crea exactamente 3 guiones
- Cada guión debe estar basado en uno de los ángulos de ese avatar
- Cada guión debe ser de 25 a 30 segundos
- Usa estructura AIDA:
  - Atención
  - Interés
  - Deseo
  - Acción
- Cada guión debe cerrar con CTA fuerte de compra
- Los guiones deben ser agresivos, claros y orientados a conversión

4. CREATIVOS DE IMAGEN
- Para CADA avatar crea exactamente 2 ideas de imagen
- Cada idea debe estar basada en los ángulos de venta de ese avatar
- Cada idea debe incluir:
  - qué mostrar
  - texto principal
  - emoción
  - CTA sugerido

IMPORTANTE:
Devuelve la información organizada EXACTAMENTE así:

AVATAR 1:
Nombre:
Dolor principal:
Deseo:
Objeción:
Trigger de compra:

ÁNGULOS AVATAR 1:
1.
2.
3.
4.
5.

GUIONES AVATAR 1:
GUION 1:
A:
I:
D:
A:

GUION 2:
A:
I:
D:
A:

GUION 3:
A:
I:
D:
A:

IDEAS AVATAR 1:
IDEA 1:
- Qué mostrar:
- Texto principal:
- Emoción:
- CTA:

IDEA 2:
- Qué mostrar:
- Texto principal:
- Emoción:
- CTA:

AVATAR 2:
...
(repite exactamente la misma estructura)

AVATAR 3:
...
(repite exactamente la misma estructura)

RECOMENDACIÓN FINAL:
- cómo usar cada avatar en una landing distinta
- cómo usar sus ángulos en anuncios
- cómo usar los guiones y creativos
`;
}

// ---------- Análisis de tendencia / oportunidad (devuelve JSON) ----------
export function promptTendencia(datos = {}) {
  const texto = limpio(datos.texto, 500);
  const pais = limpio(datos.pais, 10) || "ALL";

  return `




Responde SOLO en JSON válido, sin explicación fuera del JSON.

Actúa como un estratega senior de ecommerce DTC, experto en productos virales, Ads Library y comportamiento de compra.

Analiza esta oportunidad:
"${texto}"

País prioritario: "${pais}"

NO respondas superficial.
Quiero insights accionables, específicos y con lógica de negocio real.

---

1. MERCADO (nivel PRO)
- intención de compra (no genérica, explica el por qué compran)
- países donde realmente escalaría (no obvio)
- audiencias detalladas (edad, mindset, situación)
- búsquedas reales tipo Ads Library (no genéricas)

---

2. MASLOW (psicología profunda de compra)

- nivel dominante (elige uno claro)
- explicación profunda (mínimo 3 líneas)
- deseo oculto real (qué quiere en el fondo)
- trigger de compra (qué lo hace actuar ya)
- pensamiento interno del cliente (como si fuera él hablando)

NO seas superficial.
Esto debe ayudar a crear copies de venta.
---

3. PROBLEMA (deep pain)
- dolor principal real (emocional + físico)
- dolores secundarios (situaciones específicas)
- emociones (miedo, frustración, vergüenza, etc.)

---

4. SOLUCIÓN (transformación)
- transformación real que promete
- beneficios tangibles
- tipo de producto ideal (formato ganador)

---

5. MECANISMO (clave para vender)
- mecanismo principal creíble
- mecanismos alternativos usados en ads
- creencias que hacen que el producto convierta

---

6. MARKETING (nivel creativo)
- ángulos que realmente escalan
- hooks tipo UGC (copy corto realista)
- formato ganador (UGC, testimonial, antes/después, etc.)

---

7. VALIDACIÓN REAL (NUEVO 🔥)
- qué señales buscar en Ads Library
- cómo saber si está saturado o no
- qué indicaría oportunidad escondida

---

8. DECISIÓN (estratégica)
- oportunidad real (no genérica)
- recomendación concreta (qué hacer exactamente)
- riesgos reales de negocio

---
9. SCORE (OBLIGATORIO)
Calcula un score de 0 a 100 con esta lógica:

- +25 si el dolor es frecuente y claro
- +20 si tiene compra impulsiva o urgente
- +15 si el mercado permite hooks visuales fuertes
- +15 si hay varios ángulos de marketing
- +10 si se puede vender en formato simple ecommerce
- +10 si hay posibilidad de repetición o recompra
- -10 si tiene alta complejidad regulatoria
- -10 si requiere demasiada educación para vender
- -15 si está muy saturado sin diferenciación

Reglas del score:
- 80 a 100 = oportunidad fuerte
- 60 a 79 = buena oportunidad testable
- 40 a 59 = oportunidad media
- 0 a 39 = débil

NO pongas scores absurdamente bajos si hay dolor, demanda y ángulos claros.
El score debe ser coherente con la oportunidad y con la decisión final.
---

Reglas:
- máximo 5-6 items por lista
- lenguaje directo (no académico)
- evita frases vacías
- todo debe ser accionable para vender
- oportunidad y recomendación deben tener máximo 2 frases
- riesgos deben ser cortos
- no uses signos como < o >; escribe "menos de 14 días" en vez de "<14 días"
- no uses markdown
- no uses comillas innecesarias
---

Devuelve exactamente este JSON:

{
  "tema_central": "",
  "score": 0,
  "direccion": "subiendo/estable/bajando",
  "senal_general": "fuerte/media/debil",
  "etapa_mercado": "nuevo/creciendo/competido/saturado",
  "estacionalidad": "",

 "maslow": {
  "nivel": "",
  "explicacion": "",
  "deseo_oculto": "",
  "trigger_compra": "",
  "pensamiento_cliente": ""
},

  "mercado": {
    "intencion_busqueda": "",
    "paises_recomendados": [],
    "audiencias": [],
    "busquedas_relacionadas": []
  },

  "problema": {
    "dolor_principal": "",
    "dolores_relacionados": [],
    "emociones": []
  },

  "solucion": {
    "solucion_principal": "",
    "beneficios_relacionados": [],
    "productos_relacionados": []
  },

  "mecanismo": {
    "mecanismo_principal": "",
    "mecanismos_secundarios": [],
    "creencias_venta": []
  },

  "marketing": {
    "angulos_marketing": [],
    "formato_ganador": "",
    "hooks": []
  },

  "validacion": {
    "senales_ads": [],
    "indicadores_saturacion": [],
    "oportunidad_oculta": []
  },

  "decision": {
    "oportunidad": "",
    "recomendacion": "",
    "riesgos": []
  }
}
`;
}

// ---------- Palabras clave tipo problema (pirámide de Maslow) ----------
export function promptKeywordsMaslow(datos = {}) {
  const pais = limpio(datos.pais, 10) || "ALL";

  return `
Responde SOLO en JSON válido.

Actúa como estratega de ecommerce y psicología del consumidor.

Genera una lista de palabras clave tipo problema, basadas en la pirámide de Maslow.
Quiero ideas amplias, no una sola categoría.
Deben ser problemas reales que la gente buscaría o compraría para resolver.

País prioritario: "${pais}"

Devuelve EXACTAMENTE este JSON:
{
  "keywords": []
}

Reglas:
- devuelve entre 20 y 30 keywords
- NO repitas ejemplos genéricos
- NO copies siempre las mismas palabras
- mezcla problemas físicos, emocionales, estéticos, energéticos, sueño, dolor, seguridad, autoestima y atracción
- deben ser búsquedas que una persona sí escribiría
- frases cortas, directas y vendibles
- evita categorías; quiero keywords concretas
- devuelve solo el JSON
`;
}
