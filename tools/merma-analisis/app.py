# ============================================================
# app.py - Analisis de Merma en Poscosecha de Banano
# Streamlit + Pandas + Plotly
# ============================================================

import streamlit as st
import pandas as pd
import plotly.express as px

# ============================================================
# 1. CONFIGURACION DE LA PAGINA
# ============================================================
st.set_page_config(
    page_title="Analisis de Merma - Poscosecha Banano",
    page_icon="🍌",
    layout="wide",
)

# ============================================================
# 2. CATEGORIAS DE DEFECTOS
# Cinco grupos principales sin desglose de sub-defectos
# ============================================================
CATEGORIAS_DEFECTOS = [
    "Defecto de Campo",
    "Defecto de Empacadora",
    "Defecto Fisiologico",
    "Defecto por Microorganismos",
    "Defectos por Insectos",
]

# ============================================================
# 3. FUNCIONES AUXILIARES
# ============================================================

def obtener_categorias():
    """Devuelve la lista de categorias de defectos."""
    return CATEGORIAS_DEFECTOS


def inicializar_sesion():
    """Crea las variables en session_state si no existen."""
    if "datos" not in st.session_state:
        st.session_state["datos"] = []


# ============================================================
# 4. INICIALIZAR LA SESION
# ============================================================
inicializar_sesion()

# ============================================================
# 5. BARRA LATERAL (SIDEBAR)
# ============================================================
with st.sidebar:
    st.title("📋 Panel de Entrada")
    st.markdown("---")

    st.subheader("➕ Agregar defecto")

    with st.form(key="formulario_defecto", clear_on_submit=True):
        categoria_seleccionada = st.selectbox(
            "Categoria del defecto:",
            options=obtener_categorias(),
        )
        observacion = st.text_input(
            "Observacion (opcional):",
            placeholder="Ej: corte de cuchillo, golpe profundo...",
        )
        kilos = st.number_input(
            "Kilogramos (Kg):",
            min_value=0.0,
            step=0.1,
            format="%.2f",
        )
        boton_agregar = st.form_submit_button("Agregar a la muestra")

    if boton_agregar:
        if kilos > 0:
            nuevo_registro = {
                "Categoria": categoria_seleccionada,
                "Observacion": observacion.strip() if observacion.strip() else "-",
                "Kg": kilos,
            }
            st.session_state["datos"].append(nuevo_registro)
            st.success(f"Agregado: {categoria_seleccionada} - {kilos:.2f} Kg")
        else:
            st.warning("Ingresa un valor de Kg mayor a 0.")

    if st.button("🗑️ Limpiar todos los datos"):
        st.session_state["datos"] = []
        st.rerun()

    st.markdown("---")
    st.subheader("📊 Datos acumulados")
    if len(st.session_state["datos"]) > 0:
        df_acumulado = pd.DataFrame(st.session_state["datos"])
        st.dataframe(df_acumulado, use_container_width=True, hide_index=True)
        st.caption(f"Total de registros: {len(st.session_state['datos'])}")
    else:
        st.info("No hay datos ingresados aun.")


# ============================================================
# 6. PANTALLA PRINCIPAL
# ============================================================
st.title("🍌 Análisis de Merma en Poscosecha de Banano")
st.markdown("---")

# Si no hay datos, mostrar mensaje de bienvenida
if len(st.session_state["datos"]) == 0:
    st.info(
        "👈 Comienza ingresando datos en la barra lateral."
    )
else:
    # Convertir los datos a un DataFrame de pandas
    df = pd.DataFrame(st.session_state["datos"])

    # ----- METRICA PRINCIPAL -----
    total_kg = df["Kg"].sum()
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.metric(
            label="Total de Muestra Analizada",
            value=f"{total_kg:,.2f} Kg",
        )

    st.markdown("---")

    # ----- AGRUPAR POR CATEGORIA -----
    # Agrupar los Kg por categoria y sumarlos
    df_agrupado = df.groupby("Categoria")["Kg"].sum().reset_index()
    df_agrupado = df_agrupado.rename(columns={"Kg": "Total_Kg"})

    # Calcular el porcentaje de cada categoria
    lista_porcentajes = []
    for indice, fila in df_agrupado.iterrows():
        porcentaje = (fila["Total_Kg"] / total_kg) * 100
        lista_porcentajes.append(porcentaje)
    df_agrupado["Porcentaje"] = lista_porcentajes

    # Redondear los valores para mostrar
    df_agrupado["Total_Kg"] = df_agrupado["Total_Kg"].round(2)
    df_agrupado["Porcentaje"] = df_agrupado["Porcentaje"].round(1)

    # ----- GRAFICO DE PASTEL Y TABLA (lado a lado) -----
    col_izq, col_der = st.columns([1, 1])

    with col_izq:
        st.subheader("📈 Distribución por Categoría")

        # Crear grafico de pastel con Plotly
        fig = px.pie(
            df_agrupado,
            names="Categoria",
            values="Total_Kg",
            color="Categoria",
            color_discrete_sequence=px.colors.qualitative.Bold,
        )

        # Personalizar el grafico
        fig.update_traces(
            textposition="inside",
            textinfo="percent+label",
            hovertemplate="<b>%{label}</b><br>%{value:,.2f} Kg<br>%{percent}",
        )
        fig.update_layout(
            showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=-0.2),
            margin=dict(t=10, b=10, l=10, r=10),
        )

        st.plotly_chart(fig, use_container_width=True)

    with col_der:
        st.subheader("📋 Tabla Resumen")

        # Crear tabla con formato
        df_tabla = df_agrupado[["Categoria", "Total_Kg", "Porcentaje"]].copy()
        df_tabla = df_tabla.rename(
            columns={
                "Categoria": "Categoría",
                "Total_Kg": "Kg Totales",
                "Porcentaje": "% del Total",
            }
        )

        # Agregar el simbolo de porcentaje
        lista_pct_formato = []
        for valor in df_tabla["% del Total"]:
            lista_pct_formato.append(f"{valor}%")
        df_tabla["% del Total"] = lista_pct_formato

        st.dataframe(df_tabla, use_container_width=True, hide_index=True)

    # ----- INSIGHT AUTOMATICO -----
    st.markdown("---")
    st.subheader("💡 Insight Automático")

    # Encontrar la categoria con mayor porcentaje
    indice_maximo = 0
    for i in range(len(df_agrupado)):
        if df_agrupado["Porcentaje"].iloc[i] > df_agrupado["Porcentaje"].iloc[indice_maximo]:
            indice_maximo = i

    categoria_top = df_agrupado["Categoria"].iloc[indice_maximo]
    porcentaje_top = df_agrupado["Porcentaje"].iloc[indice_maximo]

    # Mensajes de recomendacion segun la categoria
    mensajes_recomendacion = {
        "Defecto de Campo": "Se recomienda capacitar al personal en tecnicas de corte, manejo de la fruta durante la cosecha y revisar las labores culturales de precosecha.",
        "Defecto de Empacadora": "Se recomienda calibrar los equipos de la empacadora, revisar los materiales de embalaje y los tiempos de procesamiento.",
        "Defecto Fisiologico": "Se recomienda revisar las condiciones de temperatura, humedad y manejo durante el transporte y almacenamiento.",
        "Defecto por Microorganismos": "Se recomienda revisar el programa de fungicidas y bactericidas, y mejorar la ventilacion en almacenamiento y transporte.",
        "Defectos por Insectos": "Se recomienda revisar el manejo integrado de plagas, monitoreo de trampas y condiciones sanitarias del cultivo.",
    }

    mensaje = mensajes_recomendacion.get(
        categoria_top,
        f"Se recomienda investigar las causas de la merma en la categoria {categoria_top}.",
    )

    st.warning(
        f"⚠️ El mayor foco de merma se presenta en la categoria **{categoria_top}** "
        f"con un **{porcentaje_top}%** del total. {mensaje}"
    )
