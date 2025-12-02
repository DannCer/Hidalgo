
import { useState, useEffect, useRef } from 'react';
import { fetchUniqueValuesCached } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { sortQuincenas } from '../utils/dataUtils';

export const useSequiaData = () => {
  const [sequiaQuincenaList, setSequiaQuincenaList] = useState([]);
  const [sequiaQuincena, setSequiaQuincena] = useState(null);
  const [timelineConfigs, setTimelineConfigs] = useState({});
  const [isLoadingQuincenas, setIsLoadingQuincenas] = useState(true);
  const [error, setError] = useState(null);


  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);




  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);




  useEffect(() => {
    const fetchSequiaQuincenas = async () => {

      if (sequiaQuincenaList.length > 0) return;


      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingQuincenas(true);
      setError(null);

      try {

        const uniqueQuincenas = await fetchUniqueValuesCached(
          SEQUIA_CONFIG.layerName,
          SEQUIA_CONFIG.fieldName,
          10000,
          controller.signal,
          SEQUIA_CONFIG.cacheTimeout
        );


        if (!isMountedRef.current) return;

        if (!uniqueQuincenas || uniqueQuincenas.length === 0) {
          throw new Error('No se encontraron quincenas disponibles');
        }


        const sortedQuincenas = sortQuincenas(uniqueQuincenas, true);

        setSequiaQuincenaList(sortedQuincenas);


        const defaultQuincena = sortedQuincenas[sortedQuincenas.length - 1];
        setSequiaQuincena(defaultQuincena);


        retryCountRef.current = 0;

        if (process.env.NODE_ENV === 'development') {
          logger.log(`✅ Cargadas ${sortedQuincenas.length} quincenas. Última: ${defaultQuincena}`);
        }

      } catch (err) {

        if (!isMountedRef.current || err.name === 'AbortError') return;

        console.error('❌ Error obteniendo quincenas:', err);
        setError(err.message);


        const maxRetries = 3;
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);

          console.warn(`⚠️ Reintentando en ${delay}ms (intento ${retryCountRef.current}/${maxRetries})`);

          setTimeout(() => {
            if (isMountedRef.current) {
              setIsLoadingQuincenas(false);

              setError(null);
            }
          }, delay);
        }

      } finally {
        if (isMountedRef.current) {
          setIsLoadingQuincenas(false);
          abortControllerRef.current = null;
        }
      }
    };

    fetchSequiaQuincenas();
  }, [sequiaQuincenaList.length]);




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






  const refreshQuincenas = () => {
    setSequiaQuincenaList([]);
    retryCountRef.current = 0;
    setError(null);
  };


  const isValidQuincena = (quincena) => {
    return sequiaQuincenaList.includes(quincena);
  };


  const getQuincenaIndex = (quincena) => {
    return sequiaQuincenaList.indexOf(quincena);
  };


  const getPreviousQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex > 0) {
      return sequiaQuincenaList[currentIndex - 1];
    }
    return null;
  };


  const getNextQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex < sequiaQuincenaList.length - 1) {
      return sequiaQuincenaList[currentIndex + 1];
    }
    return null;
  };

  return {

    sequiaQuincenaList,
    setSequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    timelineConfigs,
    setTimelineConfigs,
    isLoadingQuincenas,
    error,


    refreshQuincenas,
    isValidQuincena,
    getQuincenaIndex,
    getPreviousQuincena,
    getNextQuincena,


    totalQuincenas: sequiaQuincenaList.length,
    hasQuincenas: sequiaQuincenaList.length > 0,
    firstQuincena: sequiaQuincenaList[0] || null,
    lastQuincena: sequiaQuincenaList[sequiaQuincenaList.length - 1] || null
  };
};