// =============================================
// 🧩 SECCIÓN "CoDropX landing" PARA TU TEMA DE SHOPIFY (se instala una sola vez)
// Lee las imágenes que CoDropX guarda en cada producto (metacampos codropx.*)
// y las pinta en orden: ban page = una debajo de otra sin espacios;
// landing normal = imagen con su título y texto al lado.
// Tú la pones en tu plantilla de producto donde quieras y agregas alrededor tus botones y GIF.
// =============================================
export const ARCHIVO_SECCION = "sections/codropx-landing.liquid";

export const SECCION_LIQUID = `{%- comment -%} CoDropX landing · imágenes de la landing publicadas desde codropx.com {%- endcomment -%}
{%- assign cdx_imgs = product.metafields.codropx.landing.value -%}
{%- assign cdx_textos = product.metafields.codropx.secciones.value -%}
{%- assign cdx_formato = product.metafields.codropx.formato.value | default: 'ban' -%}
{%- if cdx_imgs != blank -%}
  <div class="cdx-landing cdx-{{ cdx_formato }}" style="--cdx-ancho: {{ section.settings.ancho }}px; padding-top: {{ section.settings.margen_arriba }}px; padding-bottom: {{ section.settings.margen_abajo }}px;">
    {%- for img in cdx_imgs -%}
      {%- assign t = cdx_textos[forloop.index0] -%}
      {%- if cdx_formato == 'normal' and t.titulo != blank -%}
        <div class="cdx-it">
          <div class="cdx-it-img">{{ img | image_url: width: 1080 | image_tag: loading: 'lazy', widths: '375, 540, 750, 1080', sizes: '(min-width: 750px) 50vw, 100vw', alt: t.titulo }}</div>
          <div class="cdx-it-txt"><h3>{{ t.titulo }}</h3>{%- if t.texto != blank -%}<p>{{ t.texto }}</p>{%- endif -%}</div>
        </div>
      {%- else -%}
        {%- if forloop.first -%}{%- assign cdx_carga = 'eager' -%}{%- else -%}{%- assign cdx_carga = 'lazy' -%}{%- endif -%}
        {{ img | image_url: width: 1080 | image_tag: loading: cdx_carga, widths: '375, 540, 750, 1080', sizes: '(min-width: 750px) 600px, 100vw', alt: product.title, class: 'cdx-img' }}
      {%- endif -%}
    {%- endfor -%}
  </div>
  <style>
    .cdx-landing { max-width: var(--cdx-ancho); margin: 0 auto; }
    .cdx-landing.cdx-ban { line-height: 0; }
    .cdx-landing .cdx-img { display: block; width: 100%; height: auto; margin: 0; border: 0; }
    .cdx-it { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; margin: 0 auto 32px; padding: 0 16px; }
    .cdx-it:nth-child(even) .cdx-it-img { order: 2; }
    .cdx-it img { display: block; width: 100%; height: auto; border-radius: 8px; }
    .cdx-it h3 { margin: 0 0 8px; }
    .cdx-it p { margin: 0; line-height: 1.5; }
    .cdx-landing.cdx-normal { max-width: 1100px; }
    @media (max-width: 749px) { .cdx-it { grid-template-columns: 1fr; gap: 12px; } .cdx-it:nth-child(even) .cdx-it-img { order: 0; } }
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
    { "type": "range", "id": "ancho", "label": "Ancho máximo (ban page)", "min": 320, "max": 1200, "step": 20, "unit": "px", "default": 600 },
    { "type": "range", "id": "margen_arriba", "label": "Espacio arriba", "min": 0, "max": 100, "step": 4, "unit": "px", "default": 0 },
    { "type": "range", "id": "margen_abajo", "label": "Espacio abajo", "min": 0, "max": 100, "step": 4, "unit": "px", "default": 0 }
  ],
  "presets": [{ "name": "CoDropX landing" }],
  "enabled_on": { "templates": ["product"] }
}
{% endschema %}
`;
