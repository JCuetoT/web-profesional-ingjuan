(function () {
    'use strict';

    function initDarkMode() {
        var stored = localStorage.getItem('tema-oscuro');
        if (stored === 'true') {
            document.documentElement.classList.add('tema-oscuro');
        } else if (stored === 'false') {
            document.documentElement.classList.remove('tema-oscuro');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('tema-oscuro');
        }
        actualizarIconoTema();

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (localStorage.getItem('tema-oscuro') === null) {
                if (e.matches) {
                    document.documentElement.classList.add('tema-oscuro');
                } else {
                    document.documentElement.classList.remove('tema-oscuro');
                }
                actualizarIconoTema();
            }
        });
    }

    function toggleDarkMode() {
        document.documentElement.classList.add('transicion-tema');
        var esOscuro = document.documentElement.classList.toggle('tema-oscuro');
        localStorage.setItem('tema-oscuro', esOscuro);
        actualizarIconoTema();
        setTimeout(function () {
            document.documentElement.classList.remove('transicion-tema');
        }, 400);
    }

    function actualizarIconoTema() {
        var iconos = document.querySelectorAll('.icono-tema-sol, .icono-tema-luna');
        var esOscuro = document.documentElement.classList.contains('tema-oscuro');
        iconos.forEach(function (icono) {
            icono.style.display = 'none';
        });
        if (esOscuro) {
            iconos = document.querySelectorAll('.icono-tema-sol');
        } else {
            iconos = document.querySelectorAll('.icono-tema-luna');
        }
        iconos.forEach(function (icono) {
            icono.style.display = '';
        });
    }

    function initScrollSpy() {
        var secciones = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-link');
        if (!secciones.length || !navLinks.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.getAttribute('id');
                    navLinks.forEach(function (link) {
                        link.classList.remove('activo');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('activo');
                        }
                    });
                }
            });
        }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

        secciones.forEach(function (seccion) {
            observer.observe(seccion);
        });
    }

    function initProgressBar() {
        var bar = document.getElementById('barra-progreso-pagina');
        if (!bar) return;

        window.addEventListener('scroll', function () {
            var scrollTop = window.scrollY;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = Math.min(progress, 100) + '%';
        }, { passive: true });
    }

    function initMenuMovil() {
        var btnAbrir = document.getElementById('btn-menu-movil');
        var btnCerrar = document.getElementById('btn-cerrar-menu');
        var menu = document.getElementById('menu-movil');
        if (!btnAbrir || !menu) return;

        btnAbrir.addEventListener('click', function () {
            menu.classList.add('abierto');
            document.body.style.overflow = 'hidden';
            setTimeout(function () {
                var primerFoco = btnCerrar || menu.querySelector('a');
                if (primerFoco) primerFoco.focus();
            }, 100);
        });

        function cerrarMenu() {
            menu.classList.remove('abierto');
            document.body.style.overflow = '';
            btnAbrir.focus();
        }

        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarMenu);
        }

        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.classList.remove('abierto');
                document.body.style.overflow = '';
            });
        });

        menu.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrarMenu();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initDarkMode();
        initScrollSpy();
        initProgressBar();
        initMenuMovil();
    });

    window.toggleDarkMode = toggleDarkMode;

    function actualizarAnioFooter() {
        var el = document.getElementById('anio-footer');
        if (el) el.textContent = new Date().getFullYear();
    }

    document.addEventListener('DOMContentLoaded', actualizarAnioFooter);
})();
