import { useCallback, useEffect, useState } from "react";
import { fetchTMRequest } from "@/services/tm.services";

export function useTmList() {
  const [tms, setTms] = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchTm = useCallback(async (options = {}) => {
    const { withLoading = true } = options;
    try {
      if (withLoading) setFetching(true);
      const data = await fetchTMRequest();
      const processedData = (data.docs || []).map((item, index) => ({
        ...item,
        key: item.id || `tm-${index}`,
      }));
      setTms(processedData);
    } finally {
      if (withLoading) setFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchTm({ withLoading: false });
  }, [fetchTm]);

  const refetch = useCallback(() => fetchTm(), [fetchTm]);

  return { tms, fetching, refetch };
}
