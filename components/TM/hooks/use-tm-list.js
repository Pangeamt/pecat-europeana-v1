import { useCallback, useEffect, useState } from "react";
import { fetchTMRequest } from "@/services/tm.services";

export function useTmList(userEmail) {
  const [tms, setTms] = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchTm = useCallback(
    async (email, options = {}) => {
      const { withLoading = true } = options;
      if (!email) return;
      try {
        if (withLoading) setFetching(true);
        const data = await fetchTMRequest(email);
        const processedData = (data.docs || []).map((item, index) => ({
          ...item,
          key: item.id || `tm-${index}`,
        }));
        setTms(processedData);
      } finally {
        if (withLoading) setFetching(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!userEmail) return;
    void fetchTm(userEmail, { withLoading: false });
  }, [userEmail, fetchTm]);

  const refetch = useCallback(
    () => fetchTm(userEmail),
    [userEmail, fetchTm],
  );

  return { tms, fetching, refetch };
}
