(function () {
    'use strict';

    var TASA_COP_USD_FALLBACK = 4000;
    var tasaActual = null;
    var monedaActual = 'COP';
    var btn = document.getElementById('btn-moneda');
    if (!btn) return;

    fetch('https://open.er-api.com/v6/latest/USD')
        .then(function (respuesta) { return respuesta.json(); })
        .then(function (datos) {
            if (datos && datos.rates && datos.rates.COP) {
                tasaActual = datos.rates.COP;
            }
        })
        .catch(function () { });

    function formatearMonto(numero) {
        return '$' + Math.round(numero).toLocaleString('es-CO');
    }

    function aplicarConversion(mostrarUSD) {
        var tasa = tasaActual || TASA_COP_USD_FALLBACK;
        var montos = document.querySelectorAll('.monto-convertible');
        montos.forEach(function (el) {
            var base = parseFloat(el.getAttribute('data-monto-base'));
            var origen = el.getAttribute('data-moneda-origen') || 'cop';
            if (isNaN(base)) return;
            var valor, simbolo;
            if (mostrarUSD) {
                valor = (origen === 'usd') ? base : base / tasa;
                simbolo = 'USD';
            } else {
                valor = (origen === 'cop') ? base : base * tasa;
                simbolo = 'COP';
            }
            var vSpan = el.querySelector('.monto-valor');
            var sSpan = el.querySelector('.monto-simbolo');
            if (vSpan) vSpan.textContent = formatearMonto(valor);
            if (sSpan) sSpan.textContent = simbolo;
        });
    }

    btn.addEventListener('click', function () {
        monedaActual = (monedaActual === 'COP') ? 'USD' : 'COP';
        btn.innerHTML = monedaActual + ' <span class="moneda-triangulo">&#9662;</span>';
        aplicarConversion(monedaActual === 'USD');
    });
})();
