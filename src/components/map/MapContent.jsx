

import React, { memo, useMemo } from 'react';
import { ScaleControl, GeoJSON, ZoomControl } from "react-leaflet";
import PropTypes from 'prop-types';

import MapClickHandler from './MapClickHandler';
import KeepPopupInView from './KeepPopupInView';
import GeoJsonLayers from './GeoJsonLayers';
import BaseLayerControls from './BaseLayerControls';
import ControlSidebarWrapper from './ControlSidebarWrapper';
import HighlightLayer from './HighlightLayer';

import { getLayerOptions } from '../../utils/layerStyleFactory';
import { BASE_LAYERS } from '../../config/env';

const MapContent = memo(({

    baseLayerData,
    activeLayers,
    highlightData,
    popupData,


    productionVariant,
    usoConsuntivoVariant,
    riesgosVariant,
    sequiaQuincena,


    setPopupData,
    setHighlightData,
    handleClosePopup
}) => {

    const geoJsonLayersProps = useMemo(() => ({
        activeLayers,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        sequiaQuincena
    }), [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, sequiaQuincena]);

    return (
        <>
            {}
            <ZoomControl
                position="topright"
                zoomInTitle="Acercar"
                zoomOutTitle="Alejar"
            />

            {}
            <ScaleControl
                maxWidth="150"
                position="bottomright"
                imperial={false}
            />

            {}
            <BaseLayerControls />

            {}
            <MapClickHandler
                activeLayers={activeLayers}
                setPopupData={setPopupData}
                baseLayerData={baseLayerData}
                sequiaQuincena={sequiaQuincena}
                setHighlightData={setHighlightData}
            />

            {}
            <KeepPopupInView />

            {}
            <ControlSidebarWrapper
                popupData={popupData}
                setPopupData={handleClosePopup}
            />

            {}
            <HighlightLayer data={highlightData} />

            {}
            {baseLayerData && (
                <GeoJSON
                    key={`${BASE_LAYERS.ESTADO}-base`}
                    data={baseLayerData}
                    {...getLayerOptions(BASE_LAYERS.ESTADO)}
                />
            )}

            {}
            <GeoJsonLayers {...geoJsonLayersProps} />
        </>
    );
});

MapContent.displayName = 'MapContent';

MapContent.propTypes = {
    baseLayerData: PropTypes.object,
    activeLayers: PropTypes.object.isRequired,
    highlightData: PropTypes.array.isRequired,
    popupData: PropTypes.object,
    productionVariant: PropTypes.string.isRequired,
    usoConsuntivoVariant: PropTypes.string.isRequired,
    riesgosVariant: PropTypes.string.isRequired,
    sequiaQuincena: PropTypes.string,
    setPopupData: PropTypes.func.isRequired,
    setHighlightData: PropTypes.func.isRequired,
    handleClosePopup: PropTypes.func.isRequired
};

export default MapContent;
