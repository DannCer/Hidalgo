import { useState, useEffect } from 'react';
import { fetchUniqueValues } from '../../../utils/wfsService';
import { SEQUIA_CONFIG } from '../mapConfig';

export const useSequiaData = () => {
  const [sequiaQuincenaList, setSequiaQuincenaList] = useState([]);
  const [sequiaQuincena, setSequiaQuincena] = useState(null);
  const [timelineConfigs, setTimelineConfigs] = useState({});

  // Cargar lista de quincenas (solo una vez)
  useEffect(() => {
    const fetchSequiaQuincenas = async () => {
      if (sequiaQuincenaList.length === 0) {
        try {
          const uniqueQuincenas = await fetchUniqueValues(
            SEQUIA_CONFIG.layerName, 
            SEQUIA_CONFIG.fieldName, 
            10000
          );
          
          const normalizedQuincenas = uniqueQuincenas.map(q =>
            q.toString()
              .replace('Z', '')
              .replace('T00:00:00.000', '')
              .trim()
          );          
          
          setSequiaQuincenaList(normalizedQuincenas);
          
          if (normalizedQuincenas.length > 0) {
            const defaultQ = normalizedQuincenas[normalizedQuincenas.length - 1];
            setSequiaQuincena(defaultQ);
          }
        } catch (err) {
          console.error('❌ Error obteniendo quincenas:', err);
        }
      }
    };
    
    fetchSequiaQuincenas();
  }, [sequiaQuincenaList.length]);

  // Actualizar timeline config cuando cambian quincenas o la quincena actual
  useEffect(() => {
    if (sequiaQuincenaList.length > 0) {
      const currentValue = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
      
      const cfg = {
        [SEQUIA_CONFIG.layerName]: {
          timePoints: sequiaQuincenaList,
          currentValue: currentValue,
          formatType: 'quincena',
          type: 'discrete'
        }
      };
      
      setTimelineConfigs(cfg);
    }
  }, [sequiaQuincenaList, sequiaQuincena]);

  return {
    sequiaQuincenaList,
    setSequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    timelineConfigs,
    setTimelineConfigs
  };
};