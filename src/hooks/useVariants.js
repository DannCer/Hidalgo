

import { useState, useCallback, useMemo } from 'react';
import { forceStyleUpdate } from '../utils/layerStyleFactory';

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

export const useVariants = () => {

    const [productionVariant, setProductionVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_drprodfisica'].defaultValue
    );
    const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState(
        VARIANT_CONFIG['Hidalgo:03_usoconsuntivo'].defaultValue
    );
    const [riesgosVariant, setRiesgosVariant] = useState(
        VARIANT_CONFIG['Hidalgo:04_riesgosmunicipales'].defaultValue
    );


    const variantSetters = useMemo(() => ({
        'Hidalgo:03_drprodfisica': setProductionVariant,
        'Hidalgo:03_usoconsuntivo': setUsoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': setRiesgosVariant
    }), []);


    const handleVariantChange = useCallback((layerName, variant) => {
        const setter = variantSetters[layerName];
        if (setter) {
            setter(variant);

            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [variantSetters]);


    const getVariant = useCallback((layerName) => {
        const variants = {
            'Hidalgo:03_drprodfisica': productionVariant,
            'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
            'Hidalgo:04_riesgosmunicipales': riesgosVariant
        };
        return variants[layerName] || null;
    }, [productionVariant, usoConsuntivoVariant, riesgosVariant]);


    const getVariantOptions = useCallback((layerName) => {
        return VARIANT_CONFIG[layerName]?.options || [];
    }, []);


    const hasVariants = useCallback((layerName) => {
        return layerName in VARIANT_CONFIG;
    }, []);


    const currentVariants = useMemo(() => ({
        'Hidalgo:03_drprodfisica': productionVariant,
        'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);


    const variants = useMemo(() => ({
        production: productionVariant,
        usoConsuntivo: usoConsuntivoVariant,
        riesgos: riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    return {

        currentVariants,


        variants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,


        handleVariantChange,
        getVariant,
        getVariantOptions,
        hasVariants,


        config: VARIANT_CONFIG
    };
};

export default useVariants;
