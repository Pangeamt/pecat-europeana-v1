import { useCallback, useEffect, useState } from "react";
import { fetchTMRequest } from "@/services/tm.services";

export function useTmList(query = undefined) {
  const [tms, setTms] = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchTm = useCallback(async (options = {}) => {
    const { withLoading = true } = options;
    try {
      if (withLoading) setFetching(true);
      const data = await fetchTMRequest(query);
      const processedData = (data.docs || []).map((item, index) => ({
        ...item,
        key: item.id || `tm-${index}`,
      }));
      setTms(processedData);
    } finally {
      if (withLoading) setFetching(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchTm({ withLoading: false });
  }, [fetchTm]);

  const refetch = useCallback(() => fetchTm(), [fetchTm]);

  return { tms, fetching, refetch };
}
