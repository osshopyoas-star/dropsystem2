// =============================================
// 🧩 SECCIÓN "CoDropX landing" PARA TU TEMA DE SHOPIFY (se instala una sola vez)
// Lee las imágenes que CoDropX guarda en cada producto (metacampos codropx.*) y las pinta en orden.
// Ban page: cada imagen a todo lo ancho, una debajo de otra (como el Constructor DropHouse),
// y encima puedes poner bloques flotantes: botón/GIF (con o sin Releasit) y el formulario de Releasit,
// eligiendo en qué imagen va cada uno y su posición en %.
// Landing normal: imagen con su título y texto al lado.
// v2: los GIF y botones de CADA producto vienen de CoDropX (metacampo codropx.capas): una sola plantilla sirve para todos.
// =============================================
export const ARCHIVO_SECCION = "sections/codropx-landing.liquid";
// Súbelo cada vez que cambie el código de la sección: CoDropX lee la del tema y avisa si quedó vieja
export const VERSION_SECCION = 2;
export const versionDeSeccion = (codigo) => {
  if (!codigo) return null;
  const m = String(codigo).match(/codropx-version:\s*(\d+)/);
  return m ? Number(m[1]) : 1;
};

export const SECCION_LIQUID = `{%- comment -%} CoDropX landing · imágenes publicadas desde codropx.com · codropx-version: ${VERSION_SECCION} {%- endcomment -%}
{%- assign cdx_imgs = product.metafields.codropx.landing.value -%}
{%- assign cdx_capas = product.metafields.codropx.capas.value -%}
{%- assign cdx_textos = product.metafields.codropx.secciones.value -%}
{%- assign cdx_formato = product.metafields.codropx.formato.value | default: 'ban' -%}
{%- if cdx_imgs != blank -%}
  <div class="cdx-landing cdx-{{ cdx_formato }}" style="--cdx-ancho: {{ section.settings.ancho }}px;">
    {%- for img in cdx_imgs -%}
      {%- assign n = forloop.index -%}
      {%- assign t = cdx_textos[forloop.index0] -%}
      {%- if cdx_formato == 'normal' and t.titulo != blank -%}
        <div class="cdx-it">
          <div class="cdx-it-img">{{ img | image_url: width: 1080 | image_tag: loading: 'lazy', widths: '375, 540, 750, 1080', sizes: '(min-width: 750px) 50vw, 100vw', alt: t.titulo }}</div>
          <div class="cdx-it-txt"><h3>{{ t.titulo }}</h3>{%- if t.texto != blank -%}<p>{{ t.texto }}</p>{%- endif -%}</div>
        </div>
      {%- else -%}
        <div class="cdx-banner">
          {%- if forloop.first -%}{%- assign cdx_carga = 'eager' -%}{%- else -%}{%- assign cdx_carga = 'lazy' -%}{%- endif -%}
          {{ img | image_url: width: 1080 | image_tag: loading: cdx_carga, widths: '375, 540, 750, 1080', sizes: '(min-width: 750px) 600px, 100vw', alt: product.title, class: 'cdx-img' }}
          {%- for block in section.blocks -%}
            {%- if block.settings.imagen != n -%}{%- continue -%}{%- endif -%}
            {%- capture cdx_pos -%}top: {{ block.settings.pos_y }}%; {% if block.settings.centrar %}left: 50%; transform: translateX(-50%);{% else %}left: {{ block.settings.pos_x }}%;{% endif %} width: {{ block.settings.ancho }}%;{%- endcapture -%}
            {%- case block.type -%}
              {%- when 'boton' -%}
                {%- if block.settings.imagen_boton != blank -%}
                  {%- if block.settings.releasit -%}
                    <a href="/rsi-btn-overwrite" id="rsi--btn-{{ block.id }}" class="cdx-flota" style="{{ cdx_pos }}" {{ block.shopify_attributes }}>
                      <img src="{{ block.settings.imagen_boton | image_url: width: 800 }}" alt="{{ block.settings.imagen_boton.alt | default: 'Comprar' | escape }}" loading="lazy" style="border-radius: {{ block.settings.redondeo }}px;">
                    </a>
                  {%- elsif block.settings.enlace != blank -%}
                    <a href="{{ block.settings.enlace }}" class="cdx-flota" style="{{ cdx_pos }}" {{ block.shopify_attributes }}>
                      <img src="{{ block.settings.imagen_boton | image_url: width: 800 }}" alt="{{ block.settings.imagen_boton.alt | escape }}" loading="lazy" style="border-radius: {{ block.settings.redondeo }}px;">
                    </a>
                  {%- else -%}
                    <img class="cdx-flota" src="{{ block.settings.imagen_boton | image_url: width: 800 }}" alt="{{ block.settings.imagen_boton.alt | escape }}" loading="lazy" style="{{ cdx_pos }} border-radius: {{ block.settings.redondeo }}px;" {{ block.shopify_attributes }}>
                  {%- endif -%}
                {%- endif -%}
              {%- when 'releasit' -%}
                <div class="cdx-flota cdx-releasit" style="{{ cdx_pos }}" {{ block.shopify_attributes }}>
                  <div class="_rsi-cod-form-is-gempage"></div>
                  <div class="_rsi-cod-form-gempages-button-hook"></div>
                  <div id="_rsi-cod-form-embed-custom-hook"></div>
                </div>
            {%- endcase -%}
          {%- endfor -%}
          {%- comment -%} GIF y botones de este producto (los pones en CoDropX → Publicar) {%- endcomment -%}
          {%- for c in cdx_capas -%}
            {%- if c.n != n -%}{%- continue -%}{%- endif -%}
            {%- capture cdx_cpos -%}top: {{ c.y }}%; {% if c.centrar %}left: 50%; transform: translateX(-50%);{% else %}left: {{ c.x }}%;{% endif %} width: {{ c.ancho }}%;{%- endcapture -%}
            {%- case c.tipo -%}
              {%- when 'boton' -%}
                <a href="/rsi-btn-overwrite" id="rsi--btn-cdx{{ forloop.index }}" class="cdx-flota" style="{{ cdx_cpos }}">
                  <img src="{{ c.url }}" alt="Comprar" loading="lazy" style="border-radius: {{ c.redondeo | default: 0 }}px;">
                </a>
              {%- when 'formulario' -%}
                <div class="cdx-flota cdx-releasit" style="{{ cdx_cpos }}">
                  <div class="_rsi-cod-form-is-gempage"></div>
                  <div class="_rsi-cod-form-gempages-button-hook"></div>
                  <div id="_rsi-cod-form-embed-custom-hook"></div>
                </div>
              {%- else -%}
                <img class="cdx-flota" src="{{ c.url }}" alt="" loading="lazy" style="{{ cdx_cpos }} border-radius: {{ c.redondeo | default: 0 }}px;">
            {%- endcase -%}
          {%- endfor -%}
        </div>
      {%- endif -%}
    {%- endfor -%}
  </div>
  <style>
    .cdx-landing { max-width: var(--cdx-ancho); margin: 0 auto; }
    .cdx-banner { position: relative; width: 100%; line-height: 0; overflow: hidden; }
    .cdx-banner .cdx-img { display: block; width: 100%; height: auto; margin: 0; border: 0; }
    .cdx-flota { position: absolute; display: block; line-height: 0; z-index: 5; }
    .cdx-flota img, img.cdx-flota { width: 100%; height: auto; display: block; }
    .cdx-releasit { z-index: 99; line-height: normal; }
    .cdx-it { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; margin: 0 auto 32px; padding: 0 16px; }
    .cdx-it:nth-child(even) .cdx-it-img { order: 2; }
    .cdx-it img { display: block; width: 100%; height: auto; border-radius: 8px; }
    .cdx-it h3 { margin: 0 0 8px; }
    .cdx-it p { margin: 0; line-height: 1.5; }
    .cdx-landing.cdx-normal { max-width: 1100px; }
    @media (max-width: 749px) { .cdx-it { grid-template-columns: 1fr; gap: 12px; } .cdx-it:nth-child(even) .cdx-it-img { order: 0; } }
    {%- if section.settings.ocultar_encabezado and cdx_formato != 'normal' %}
    header, .header, .shopify-section-group-header-group { display: none !important; }
    {%- endif %}
    {%- if section.settings.ocultar_footer and cdx_formato != 'normal' %}
    footer, .shopify-section-group-footer-group { display: none !important; }
    {%- endif %}
    {%- if section.settings.ocultar_flotante_releasit %}
    ._rsi-buy-now-button-floating { display: none !important; }
    {%- endif %}
  </style>
{%- elsif request.design_mode -%}
  <div style="text-align:center;padding:24px;border:2px dashed #c7c7c7;border-radius:12px;margin:16px;font-family:sans-serif;color:#555">
    <b>CoDropX landing</b><br>Este producto todavía no tiene una landing publicada desde CoDropX. Al publicar, aquí aparecen sus imágenes.
  </div>
{%- endif -%}

{% schema %}
{
  "name": "CoDropX landing",
  "tag": "section",
  "class": "cdx-seccion",
  "settings": [
    { "type": "range", "id": "ancho", "label": "Ancho máximo en computador", "min": 320, "max": 1200, "step": 20, "unit": "px", "default": 600 },
    { "type": "checkbox", "id": "ocultar_encabezado", "label": "Ocultar el encabezado de la tienda (ban page)", "default": true },
    { "type": "checkbox", "id": "ocultar_footer", "label": "Ocultar el pie de página (ban page)", "default": true },
    { "type": "checkbox", "id": "ocultar_flotante_releasit", "label": "Ocultar el botón flotante de Releasit", "default": false }
  ],
  "blocks": [
    {
      "type": "boton",
      "name": "Botón o GIF encima",
      "settings": [
        { "type": "range", "id": "imagen", "label": "En la imagen número", "min": 1, "max": 30, "step": 1, "default": 1 },
        { "type": "image_picker", "id": "imagen_boton", "label": "Imagen o GIF" },
        { "type": "checkbox", "id": "releasit", "label": "Es el botón de Releasit (abre el formulario)", "default": true },
        { "type": "url", "id": "enlace", "label": "Enlace (si no es Releasit)" },
        { "type": "range", "id": "ancho", "label": "Tamaño", "min": 5, "max": 100, "step": 1, "unit": "%", "default": 80 },
        { "type": "range", "id": "pos_y", "label": "Posición vertical", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 85 },
        { "type": "checkbox", "id": "centrar", "label": "Centrar", "default": true },
        { "type": "range", "id": "pos_x", "label": "Posición horizontal (si no está centrado)", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 0 },
        { "type": "range", "id": "redondeo", "label": "Esquinas redondeadas", "min": 0, "max": 50, "step": 1, "unit": "px", "default": 0 }
      ]
    },
    {
      "type": "releasit",
      "name": "Formulario de Releasit",
      "limit": 2,
      "settings": [
        { "type": "range", "id": "imagen", "label": "En la imagen número", "min": 1, "max": 30, "step": 1, "default": 1 },
        { "type": "range", "id": "ancho", "label": "Tamaño", "min": 10, "max": 100, "step": 1, "unit": "%", "default": 80 },
        { "type": "range", "id": "pos_y", "label": "Posición vertical", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 80 },
        { "type": "checkbox", "id": "centrar", "label": "Centrar", "default": true },
        { "type": "range", "id": "pos_x", "label": "Posición horizontal (si no está centrado)", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 0 }
      ]
    }
  ],
  "presets": [{ "name": "CoDropX landing" }],
  "enabled_on": { "templates": ["product"] }
}
{% endschema %}
`;
