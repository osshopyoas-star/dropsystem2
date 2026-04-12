export function renderBusqueda() {
  return `

<h3 style="margin-bottom:10px;">
🔍 Motor de Validación
</h3>

<p class="info">
Valida demanda, revisa competidores y confirma si el producto ya se vende
</p>

    
  <div class="grid-3">

    <!-- 🔵 IMPORTACIÓN -->
    <div class="panel">
      <h4><i data-lucide="globe" style=" width: 18px; height: 16px;"></i> BUSQUEDA DE IMPORTACIÓN O LABORATORIO</h4>

      <select id="pais-import" onchange="updateImport()">
        <option value="US">USA</option>
         <option value="CA">Canadá</option>
          <option value="GB">Reino Unido</option>
          <option value="AU">Australia</option>
        <option value="FR">Francia</option>
        <option value="DE">Alemania</option>
        <option value="IT">Italia</option>
        <option value="JP">Japón</option>
        <option value="ES">España</option>
        <option value="BR">Brasil</option>
       <option value="PT">Portugal</option>
      </select>

     <select id="tipo-import" onchange="renderKeywordsImport()">
  <option value="problema">Problema</option>
  <option value="mecanismo">Mecanismo</option>
  <option value="beneficio">Beneficio</option>
  <option value="busqueda">Búsqueda</option>
  <option value="safe">Safe</option>
  <option value="producto">Producto</option>
  <option value="sexuales">Sexuales</option>
  <option value="feromonas">Feromonas</option>
</select>

      <div id="keywords-import" class="keywords-box"></div>
       <h3>Bibliotecas de Busqueda</h3>
     <button onclick="buscarImport()">Meta</button>
<button onclick="buscarEnTikTok()">TikTok</button>
    </div>



  
    <!-- 🟣 INVESTIGACIÓN PRODUCTO -->
    <div class="panel center">
      <h4><i data-lucide="search" style=" width: 18px; height: 16px;"></i> INVESTIGACIÓN DE MERCADO </h4>

    <div style="position:relative; padding:6px;">

    <button onclick="toggleDropiMenu()" class="btn-dropi">
    <i data-lucide="bot-message-square" style=" width: 19px; height: 14px;"></i>  
       Buscar en Dropi ▾
    </button>

    <div id="dropi-menu" class="dropi-menu">
      <div onclick="abrirDropiPais('CO')">🇨🇴 Colombia</div>
      <div onclick="abrirDropiPais('EC')">🇪🇨 Ecuador</div>
    </div>

  </div>

       <h4><i data-lucide="store" style=" width: 19px; height: 14px;"></i> ANALIZAR TIENDA EN META</h4>
    

<div class="block">
  <label> <i data-lucide="search" style=" width: 18px; height: 16px;"></i> Dominio</label>
   <input id="tiendaInput" placeholder="Pegar URL de tienda (ej: mitienda.com)">
</div>

<div class="block">
  <label><i data-lucide="globe" style=" width: 18px; height: 16px;"></i> País</label>
  <select id="pais-meta-tienda">
  <option value="ALL">Todos</option>
   <option value="CO">Colombia</option>
  <option value="MX">México</option>
  <option value="ES">España</option>
    <option value="PE">Peru</option>
    <option value="CL">Chile</option>
        <option value="AR">Argentina</option>
        <option value="EC">Ecuador</option> 
        <option value="PY">Paraguay</option>
        <option value="PA">Panamá</option>
    <option value="US">USA</option>
    <option value="CA">Canadá</option>
          <option value="GB">Reino Unido</option>
          <option value="AU">Australia</option>
        <option value="FR">Francia</option>
        <option value="DE">Alemania</option>
        <option value="IT">Italia</option>
        <option value="JP">Japón</option>
        <option value="ES">España</option>
        <option value="BR">Brasil</option>
       <option value="PT">Portugal</option>

</select>
</div>
  
    <button class="primary" onclick="analizarTiendaMeta()">
  Analizar Anuncios
</button>


 <input id="productoInput" placeholder="Buscar producto">
      <button onclick="buscarProducto('aliexpress')">AliExpress</button>
      <button onclick="buscarProducto('alibaba')">Alibaba</button>
      <button onclick="buscarProducto('ml')">Mercado Libre</button>

      <p class="info">
        Validar si se vende en LATAM antes de importar
      </p>

    
    </div>


    <!-- 🟡 CATÁLOGO -->
    <div class="panel">
      <h4><i data-lucide="box" style=" width: 18px; height: 16px;"></i> BUSQUEDA EN CATÁLOGO PUBLICO</h4>

      <p class="info">
        Productos ya existentes en LATAM (Dropi)
      </p>

      <select id="pais-cat" onchange="renderKeywordsCat()">
        <option value="CO">Colombia</option>
        <option value="MX">México</option>
        <option value="CL">Chile</option>
        <option value="PE">Perú</option>
        <option value="AR">Argentina</option>
        <option value="EC">Ecuador</option> 
        <option value="PY">Paraguay</option>
        <option value="PA">Panamá</option>

      </select>

      <select id="tipo-cat" onchange="renderKeywordsCat()">
        <option value="problema">Problema</option>
  <option value="mecanismo">Mecanismo</option>
  <option value="beneficio">Beneficio</option>
  <option value="busqueda">Búsqueda</option>
  <option value="safe">Safe</option>
  <option value="producto">Producto</option>
  <option value="sexuales">Sexuales</option>
  <option value="feromonas">Feromonas</option>
      </select>

      <div id="keywords-cat" class="keywords-box"></div>
      <h3>Bibliotecas de Busqueda</h3>
      <button onclick="buscarImport()">Meta</button>
<button onclick="buscarEnTikTok()">TikTok</button>
    </div>

  </div>
  `;
}