/* --- Source: f7230208.txt --- */
(function () {
    'use strict';

    function abrirModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        document.body.style.overflow = 'hidden';
        modal.classList.add('activo');
        var primerFoco = modal.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (primerFoco) primerFoco.focus();
    }

    function cerrarModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        document.body.style.overflow = '';
        modal.classList.remove('activo');
    }

    window.abrirModal = abrirModal;
    window.cerrarModal = cerrarModal;

    window.addEventListener('click', function (e) {
        document.querySelectorAll('.modal-fondo.activo').forEach(function (m) {
            if (e.target === m) cerrarModal(m.id);
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-fondo.activo').forEach(function (m) {
                cerrarModal(m.id);
            });
        }
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.hasAttribute('data-modal')) {
            e.preventDefault();
            abrirModal(document.activeElement.getAttribute('data-modal'));
        }
    });

    function cambiarPestanaModal(modalPrefijo, tabName) {
        var contenidos = document.querySelectorAll('.' + modalPrefijo + '-tab-panel');
        contenidos.forEach(function (panel) {
            panel.classList.remove('activo');
        });

        var panelActivo = document.getElementById(modalPrefijo + '-' + tabName);
        if (panelActivo) {
            panelActivo.classList.add('activo');
        }

        var botones = document.querySelectorAll('.' + modalPrefijo + '-tab-btn');
        botones.forEach(function (btn) {
            btn.classList.remove('activo');
        });

        var btnActivo = document.getElementById(modalPrefijo + '-btn-' + tabName);
        if (btnActivo) {
            btnActivo.classList.add('activo');
        }
    }

    window.cambiarPestanaModal = cambiarPestanaModal;

    function initScrollReveal() {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.revelar, .revelar-izquierda, .revelar-derecha, .revelar-escala').forEach(function (el) {
            observer.observe(el);
        });
    }

    function initContadores() {
        var contadores = document.querySelectorAll('.contador');
        if (!contadores.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseFloat(el.getAttribute('data-target'));
                    var suffix = el.getAttribute('data-suffix') || '';
                    var prefix = el.getAttribute('data-prefix') || '';
                    var duration = parseInt(el.getAttribute('data-duracion')) || 2000;
                    var decimals = target % 1 === 0 ? 0 : 1;
                    animarContador(el, target, prefix, suffix, duration, decimals);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        contadores.forEach(function (el) {
            observer.observe(el);
        });
    }

    function animarContador(el, target, prefix, suffix, duration, decimals) {
        var startTime = performance.now();
        var startValue = 0;

        function actualizar(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = startValue + (target - startValue) * eased;
            el.textContent = prefix + Number(current.toFixed(decimals)).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

            if (progress < 1) {
                requestAnimationFrame(actualizar);
            } else {
                el.textContent = prefix + Number(target.toFixed(decimals)).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
            }
        }

        requestAnimationFrame(actualizar);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initScrollReveal();
        initContadores();
    });
})();


/* --- Source: f7230464.txt --- */
(function () {
    'use strict';

    var filtroEstadoActual = 'todos';
    var filtroEjeActual = 'todos';

    function initFiltros() {
        var botonesEstado = document.querySelectorAll('.filtro-btn[data-filtro-estado]');
        var botonesEje = document.querySelectorAll('.filtro-btn[data-filtro-eje]');

        botonesEstado.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filtroEstadoActual = btn.getAttribute('data-filtro-estado');
                botonesEstado.forEach(function (b) { b.classList.remove('activo'); });
                btn.classList.add('activo');
                aplicarFiltros();
            });
        });

        botonesEje.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filtroEjeActual = btn.getAttribute('data-filtro-eje');
                botonesEje.forEach(function (b) { b.classList.remove('activo'); });
                btn.classList.add('activo');
                aplicarFiltros();
            });
        });
    }

    function aplicarFiltros() {
        var proyectos = document.querySelectorAll('.proyecto-card');

        proyectos.forEach(function (proyecto) {
            var estado = proyecto.getAttribute('data-estado');
            var eje = proyecto.getAttribute('data-eje');

            var coincideEstado = filtroEstadoActual === 'todos' || filtroEstadoActual === estado;
            var coincideEje = filtroEjeActual === 'todos' || filtroEjeActual === eje;

            if (coincideEstado && coincideEje) {
                proyecto.style.display = '';
                proyecto.classList.add('revelar', 'visible');
            } else {
                proyecto.style.display = 'none';
            }
        });

        var vacio = document.getElementById('sin-resultados');
        if (vacio) {
            var algunVisible = false;
            proyectos.forEach(function (p) { if (p.style.display !== 'none') algunVisible = true; });
            vacio.style.display = algunVisible ? 'none' : '';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.querySelector('.sistema-filtros')) {
            initFiltros();
        }
    });
})();


/* --- Source: f7230720.txt --- */
(function () {
    'use strict';

    function initLazyYouTube() {
        var embeds = document.querySelectorAll('.youtube-lazy');
        if (!embeds.length) return;

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        var src = el.getAttribute('data-src');
                        if (src) {
                            el.src = src;
                            el.removeAttribute('data-src');
                            el.classList.remove('youtube-lazy');
                        }
                        observer.unobserve(el);
                    }
                });
            }, { rootMargin: '200px' });

            embeds.forEach(function (el) {
                observer.observe(el);
            });
        } else {
            embeds.forEach(function (el) {
                var src = el.getAttribute('data-src');
                if (src) {
                    el.src = src;
                    el.removeAttribute('data-src');
                    el.classList.remove('youtube-lazy');
                }
            });
        }
    }

    function initNavegacionModulos() {
        var botones = document.querySelectorAll('.modulo-nav-btn');
        if (!botones.length) return;

        botones.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var moduloId = btn.getAttribute('data-modulo');

                botones.forEach(function (b) { b.classList.remove('activo'); });
                btn.classList.add('activo');

                document.querySelectorAll('.modulo-panel').forEach(function (panel) {
                    panel.classList.remove('activo');
                });

                var panel = document.getElementById('modulo-' + moduloId);
                if (panel) {
                    panel.classList.add('activo');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initLazyYouTube();
        initNavegacionModulos();
    });
})();


/* --- Source: f7230976.txt --- */
(function () {
    'use strict';

    var filtroRol = 'todos';
    var filtroDisciplina = 'todos';
    var criterioOrden = 'fecha-desc';

    function init() {
        var container = document.querySelector('.sistema-filtros');
        if (!container) return;

        document.querySelectorAll('[data-filtro-rol]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                filtroRol = btn.getAttribute('data-filtro-rol');
                document.querySelectorAll('[data-filtro-rol]').forEach(function (b) { b.classList.remove('activo'); });
                btn.classList.add('activo');
                aplicar();
            });
        });

        document.querySelectorAll('[data-filtro-disciplina]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                filtroDisciplina = btn.getAttribute('data-filtro-disciplina');
                document.querySelectorAll('[data-filtro-disciplina]').forEach(function (b) { b.classList.remove('activo'); });
                btn.classList.add('activo');
                aplicar();
            });
        });

        var sortSelect = document.getElementById('sort-orden');
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                criterioOrden = sortSelect.value;
                aplicar();
            });
        }
    }

    function obtenerProyectos() {
        var nodos = document.querySelectorAll('#grid-proyectos .proyecto-card');
        var lista = [];
        nodos.forEach(function (n) { lista.push(n); });
        return lista;
    }

    function filtrar(proyectos) {
        return proyectos.filter(function (p) {
            var rol = p.getAttribute('data-rol');
            var disciplina = p.getAttribute('data-disciplina');
            var okRol = filtroRol === 'todos' || rol.split(' ').indexOf(filtroRol) !== -1;
            var okDisc = filtroDisciplina === 'todos' || filtroDisciplina === disciplina;
            return okRol && okDisc;
        });
    }

    function comparar(a, b) {
        switch (criterioOrden) {
            case 'fecha-desc': {
                var fa = parseInt(a.getAttribute('data-fecha')) || 0;
                var fb = parseInt(b.getAttribute('data-fecha')) || 0;
                return fb - fa;
            }
            case 'monto-desc': {
                var ma = parseFloat(a.getAttribute('data-monto')) || 0;
                var mb = parseFloat(b.getAttribute('data-monto')) || 0;
                return mb - ma;
            }
            case 'titulo-asc': {
                var ta = (a.getAttribute('data-titulo') || '').trim();
                var tb = (b.getAttribute('data-titulo') || '').trim();
                return ta.localeCompare(tb, 'es');
            }
            default:
                return 0;
        }
    }

    function aplicar() {
        var grid = document.getElementById('grid-proyectos');
        if (!grid) return;

        var todos = obtenerProyectos();
        var visibles = filtrar(todos);

        visibles.sort(comparar);

        var vacio = document.getElementById('sin-resultados');

        if (visibles.length === 0) {
            todos.forEach(function (p) { p.style.display = 'none'; });
            if (vacio) vacio.style.display = '';
            return;
        }

        if (vacio) vacio.style.display = 'none';

        var mapaVisibles = {};
        visibles.forEach(function (p) { mapaVisibles[p.getAttribute('data-titulo') + p.getAttribute('data-fecha')] = true; });

        todos.forEach(function (p) {
            var key = p.getAttribute('data-titulo') + p.getAttribute('data-fecha');
            if (mapaVisibles[key]) {
                p.style.display = '';
            } else {
                p.style.display = 'none';
            }
        });

        visibles.forEach(function (p) {
            grid.appendChild(p);
        });
    }

    function aplicarOrdenamiento() {
        aplicar();
    }

    window.aplicarOrdenamiento = aplicarOrdenamiento;

    document.addEventListener('DOMContentLoaded', function () {
        if (document.querySelector('.sistema-filtros')) {
            init();
        }
    });
})();


