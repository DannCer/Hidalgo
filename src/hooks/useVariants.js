// src/components/observatorio/hooks/useVariants.js
// ============================================
// Hook para manejar las variantes de visualización de capas
// ============================================
import { useState, useCallback, useMemo } from 'react';
import { forceStyleUpdate } from '../utils/layerStyleFactory';

// Configuración de variantes por capa
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
 * Hook que maneja las variantes de visualización de capas
 * @returns {Object} Estado y funciones para manejar variantes
 */
export const useVariants = () => {
    // Estado individual para cada tipo de variante
    const [productionVariant, setProductionVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_drprodfisica'].defaultValue
    );
    const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_usoconsuntivo'].defaultValue
    );
    const [riesgosVariant, setRiesgosVariant] = useState(
        VARIANT_CONFIG['Hidalgo:04_riesgosmunicipales'].defaultValue
    );

    // Mapa de setters para acceso dinámico
    const variantSetters = useMemo(() => ({
        'Hidalgo:03_drprodfisica': setProductionVariant,
        'Hidalgo:03_usoconsuntivo': setUsoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': setRiesgosVariant
    }), []);

    /**
     * Cambia la variante activa para una capa
     * @param {string} layerName - Nombre de la capa
     * @param {string} variant - Nueva variante
     */
    const handleVariantChange = useCallback((layerName, variant) => {
        const setter = variantSetters[layerName];
        if (setter) {
            setter(variant);
            // Forzar actualización de estilos en el siguiente frame
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [variantSetters]);

    /**
     * Obtiene la variante actual para una capa
     * @param {string} layerName - Nombre de la capa
     * @returns {string|null} Variante actual o null
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
     * Obtiene las opciones disponibles para una capa
     * @param {string} layerName - Nombre de la capa
     * @returns {string[]} Array de opciones
     */
    const getVariantOptions = useCallback((layerName) => {
        return VARIANT_CONFIG[layerName]?.options || [];
    }, []);

    /**
     * Verifica si una capa tiene variantes
     * @param {string} layerName - Nombre de la capa
     * @returns {boolean}
     */
    const hasVariants = useCallback((layerName) => {
        return layerName in VARIANT_CONFIG;
    }, []);

    // Mapa de variantes actuales (memoizado)
    const currentVariants = useMemo(() => ({
        'Hidalgo:03_drprodfisica': productionVariant,
        'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    // Valores individuales (para componentes que los necesiten)
    const variants = useMemo(() => ({
        production: productionVariant,
        usoConsuntivo: usoConsuntivoVariant,
        riesgos: riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    return {
        // Mapa completo de variantes
        currentVariants,
        
        // Valores individuales
        variants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        
        // Funciones
        handleVariantChange,
        getVariant,
        getVariantOptions,
        hasVariants,
        
        // Configuración (por si se necesita en UI)
        config: VARIANT_CONFIG
    };
};

export default useVariants;
