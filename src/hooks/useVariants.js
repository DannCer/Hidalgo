import { useState, useCallback, useMemo } from 'react';
import { forceStyleUpdate } from '../utils/layerStyleFactory';

/**
 * Configuración de variantes por capa.
 * Define las opciones disponibles y valores por defecto para cada capa con variantes.
 */
const VARIANT_CONFIG = {
    'Hidalgo:03_drprodfisica': {
        defaultValue: 'Productividad física (Kg/m³)',
        options: [
            'Productividad física (Kg/m³)',
            'Productividad económica ($/m³)',
            'Valor de producción (MDP)'
        ]
    },
    'Hidalgo:03_usoconsuntivo': {
        defaultValue: 'Total SB (hm³)',
        options: [
            'Total SB (hm³)',
            'Agrícola (hm³)',
            'Público urbano (hm³)',
            'Industrial (hm³)'
        ]
    },
    'Hidalgo:04_riesgosmunicipales': {
        defaultValue: 'Sequía',
        options: [
            'Sequía',
            'Inundación',
            'Heladas'
        ]
    }
};

/**
 * Hook personalizado para manejar variantes de visualización de capas.
 * Permite cambiar entre diferentes representaciones de datos para una misma capa.
 * 
 * @returns {Object} Funciones y estado para manejo de variantes
 */
export const useVariants = () => {
    // Estados para cada tipo de variante
    const [productionVariant, setProductionVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_drprodfisica'].defaultValue
    );
    const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_usoconsuntivo'].defaultValue
    );
    const [riesgosVariant, setRiesgosVariant] = useState(
        VARIANT_CONFIG['Hidalgo:04_riesgosmunicipales'].defaultValue
    );

    /**
     * Mapeo de funciones setter por nombre de capa.
     * Permite acceso dinámico a los setters apropiados.
     */
    const variantSetters = useMemo(() => ({
        'Hidalgo:03_drprodfisica': setProductionVariant,
        'Hidalgo:03_usoconsuntivo': setUsoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': setRiesgosVariant
    }), []);

    /**
     * Cambia la variante activa para una capa específica.
     * Actualiza el estado y fuerza la actualización de estilos del mapa.
     * 
     * @param {string} layerName - Nombre de la capa
     * @param {string} variant - Nueva variante seleccionada
     */
    const handleVariantChange = useCallback((layerName, variant) => {
        const setter = variantSetters[layerName];
        if (setter) {
            setter(variant);

            // Forzar actualización de estilos en el próximo frame
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [variantSetters]);

    /**
     * Obtiene la variante actual para una capa específica.
     * 
     * @param {string} layerName - Nombre de la capa
     * @returns {string|null} Variante actual o null si la capa no tiene variantes
     */
    const getVariant = useCallback((layerName) => {
        const variants = {
            'Hidalgo:03_drprodfisica': productionVariant,
            'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
            'Hidalgo:04_riesgosmunicipales': riesgosVariant
        };
        return variants[layerName] || null;
    }, [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    /**
     * Obtiene las opciones disponibles para una capa con variantes.
     * 
     * @param {string} layerName - Nombre de la capa
     * @returns {Array} Lista de opciones de variantes
     */
    const getVariantOptions = useCallback((layerName) => {
        return VARIANT_CONFIG[layerName]?.options || [];
    }, []);

    /**
     * Verifica si una capa tiene variantes configuradas.
     * 
     * @param {string} layerName - Nombre de la capa
     * @returns {boolean} true si la capa tiene variantes
     */
    const hasVariants = useCallback((layerName) => {
        return layerName in VARIANT_CONFIG;
    }, []);

    /**
     * Mapa de variantes actuales por nombre de capa.
     * Útil para componentes que necesitan acceso a múltiples variantes.
     */
    const currentVariants = useMemo(() => ({
        'Hidalgo:03_drprodfisica': productionVariant,
        'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    /**
     * Variantes organizadas por categoría temática.
     * Alternativa a la estructura por nombre de capa.
     */
    const variants = useMemo(() => ({
        production: productionVariant,      // Variante de producción
        usoConsuntivo: usoConsuntivoVariant, // Variante de uso consuntivo
        riesgos: riesgosVariant             // Variante de riesgos
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    return {
        // Versión preferida: acceso por nombre de capa
        currentVariants,

        // Versión alternativa: acceso por categoría
        variants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,

        // Funciones de utilidad
        handleVariantChange,
        getVariant,
        getVariantOptions,
        hasVariants,

        // Configuración completa
        config: VARIANT_CONFIG
    };
};

export default useVariants;