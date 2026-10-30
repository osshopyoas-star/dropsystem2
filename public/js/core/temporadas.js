// =============================================
// 📅 TEMPORADAS: las fechas fuertes de venta en Colombia y Ecuador
// Las fechas que cambian cada año (Día de la Madre, Amor y Amistad, Semana Santa, Black Friday) se calculan.
// "testear" = cuántos días antes empezar a testear para llegar con un ganador.
// Sin DOM: se usa en Inicio.
// =============================================

const iso = (d) => d.toISOString().slice(0, 10);
const fecha = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12));
// n-ésimo día de la semana del mes (dia: 0 domingo … 6 sábado); n = -1 → el último
function enesimo(y, m, dia, n) {
  if (n === -1) {
    const d = fecha(y, m + 1, 0);
    while (d.getUTCDay() !== dia) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }
  const d = fecha(y, m, 1);
  while (d.getUTCDay() !== dia) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() + 7 * (n - 1));
  return d;
}
// Domingo de Pascua (algoritmo anónimo gregoriano)
function pascua(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return fecha(y, mes, dia);
}
const mas = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

// paises: en cuáles aplica · cuando(y) → Date · testear: días antes · ideas: qué empujar
const TEMPORADAS = [
  { id: "reyes", nombre: "Regreso a clases (calendario A)", paises: ["CO"], cuando: (y) => fecha(y, 1, 20), testear: 21, aprox: true,
    ideas: "Morrales, loncheras, termos, organizadores, lámparas de escritorio, cosas para el cuarto del niño." },
  { id: "decimo4_costa", nombre: "Décimo cuarto sueldo (Costa y Galápagos)", paises: ["EC"], cuando: (y) => fecha(y, 3, 15), testear: 21,
    ideas: "La gente tiene plata extra: hogar, cocina, belleza y regalos con buen ticket." },
  { id: "sanvalentin", nombre: "San Valentín", paises: ["EC"], cuando: (y) => fecha(y, 2, 14), testear: 21,
    ideas: "Regalos de pareja: peluches, lámparas y letreros LED, joyería, perfumes, lencería (sin lenguaje sugestivo en los anuncios)." },
  { id: "mujer", nombre: "Día de la Mujer", paises: ["CO", "EC"], cuando: (y) => fecha(y, 3, 8), testear: 14,
    ideas: "Belleza, cuidado personal, accesorios y detalles para regalar." },
  { id: "semanasanta", nombre: "Semana Santa", paises: ["CO", "EC"], cuando: (y) => mas(pascua(y), -7), testear: 14,
    ideas: "Viajes y paseos: bolsos, termos, accesorios de carro, playa y piscina. Ojo: esa semana la logística va más lenta." },
  { id: "nino_co", nombre: "Día del Niño", paises: ["CO"], cuando: (y) => enesimo(y, 4, 6, -1), testear: 21,
    ideas: "Juguetes, peluches, carros y animales a control remoto (los avatares son los papás que compran)." },
  { id: "madre", nombre: "Día de la Madre", paises: ["CO", "EC"], cuando: (y) => enesimo(y, 5, 0, 2), testear: 30,
    ideas: "La fecha más fuerte del primer semestre: cocina, hogar, belleza, masajeadores, joyería, lámparas y letreros con mensaje." },
  { id: "nino_ec", nombre: "Día del Niño", paises: ["EC"], cuando: (y) => fecha(y, 6, 1), testear: 21,
    ideas: "Juguetes, peluches y control remoto (los avatares son los papás que compran)." },
  { id: "padre", nombre: "Día del Padre", paises: ["CO", "EC"], cuando: (y) => enesimo(y, 6, 0, 3), testear: 30,
    ideas: "Herramientas, accesorios de carro, tecnología, barbería, camisetas de fútbol y gadgets." },
  { id: "prima_jun", nombre: "Prima de mitad de año", paises: ["CO"], cuando: (y) => fecha(y, 6, 30), testear: 21,
    ideas: "Plata extra: buen momento para productos de ticket alto y paquetes." },
  { id: "decimo4_sierra", nombre: "Décimo cuarto sueldo (Sierra y Amazonía)", paises: ["EC"], cuando: (y) => fecha(y, 8, 15), testear: 21,
    ideas: "Plata extra en la Sierra: regreso a clases, hogar y tecnología." },
  { id: "clases_sierra", nombre: "Regreso a clases (Sierra y Amazonía)", paises: ["EC"], cuando: (y) => fecha(y, 9, 1), testear: 21, aprox: true,
    ideas: "Morrales, loncheras, termos, organizadores y lámparas de escritorio." },
  { id: "amoramistad", nombre: "Amor y Amistad", paises: ["CO"], cuando: (y) => enesimo(y, 9, 6, 3), testear: 30,
    ideas: "Regalos de pareja y de amigo secreto: peluches, lámparas y letreros LED, joyería, perfumes, detalles personalizados." },
  { id: "halloween", nombre: "Halloween", paises: ["CO", "EC"], cuando: (y) => fecha(y, 10, 31), testear: 21,
    ideas: "Decoración, disfraces, luces y calabazas." },
  { id: "blackfriday", nombre: "Black Friday", paises: ["CO", "EC"], cuando: (y) => mas(enesimo(y, 11, 4, 4), 1), testear: 21,
    ideas: "La gente busca descuento: paquetes 2x1 y 3x2 de tus ganadores. Los anuncios se encarecen esa semana." },
  { id: "navidad", nombre: "Navidad", paises: ["CO", "EC"], cuando: (y) => fecha(y, 12, 24), testear: 45,
    ideas: "La temporada más fuerte del año: regalos, juguetes, decoración, luces, cocina. Despacha temprano: después del 20 la logística se satura." },
  { id: "prima_dic", nombre: "Prima de diciembre", paises: ["CO"], cuando: (y) => fecha(y, 12, 20), testear: 30,
    ideas: "Plata extra justo antes de Navidad: ticket alto, paquetes y regalos." },
  { id: "decimo3", nombre: "Décimo tercer sueldo", paises: ["EC"], cuando: (y) => fecha(y, 12, 24), testear: 30,
    ideas: "Plata extra justo antes de Navidad: ticket alto, paquetes y regalos." }
];

// Próximas temporadas de un país desde hoy (incluye las que ya están en ventana de testeo)
export function proximasTemporadas(pais = "CO", hoyIso = iso(new Date()), cuantas = 4) {
  const hoy = new Date(hoyIso + "T12:00:00Z");
  const y = hoy.getUTCFullYear();
  const lista = [];
  for (const t of TEMPORADAS) {
    if (!t.paises.includes(pais)) continue;
    for (const anio of [y, y + 1]) {
      const d = t.cuando(anio);
      const faltan = Math.round((d - hoy) / 864e5);
      if (faltan < 0) continue;
      const desde = mas(d, -t.testear);
      lista.push({
        id: t.id, nombre: t.nombre, ideas: t.ideas, aprox: !!t.aprox, fecha: iso(d), faltan,
        testearDesde: iso(desde), yaTestear: hoy >= desde, testear: t.testear
      });
      break;
    }
  }
  return lista.sort((a, b) => a.faltan - b.faltan).slice(0, cuantas);
}
