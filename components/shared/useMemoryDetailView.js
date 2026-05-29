"use client";

import { useCallback, useEffect, useReducer } from "react";

const createInitialState = () => ({
  resource: null,
  entries: [],
  total: 0,
  page: 1,
  pageSize: 100,
  searchInput: "",
  searchQuery: null,
  loading: true,
  tableLoading: true,
  error: null,
  entriesError: null,
});

function reducer(state, action) {
  switch (action.type) {
    case "meta/start":
      return { ...state, loading: true, error: null };
    case "meta/success":
      return { ...state, resource: action.payload, loading: false };
    case "meta/error":
      return { ...state, error: action.payload, loading: false };
    case "entries/start":
      return { ...state, tableLoading: true, entriesError: null };
    case "entries/success":
      return {
        ...state,
        entries: action.payload.docs,
        total: action.payload.total,
        tableLoading: false,
      };
    case "entries/error":
      return { ...state, entriesError: action.payload, tableLoading: false };
    case "search/input":
      return { ...state, searchInput: action.payload };
    case "search/submit":
      return {
        ...state,
        searchQuery: action.payload,
        page: 1,
      };
    case "search/clear":
      return {
        ...state,
        searchInput: "",
        searchQuery: null,
        page: 1,
        entriesError: null,
      };
    case "pagination":
      return {
        ...state,
        page: action.payload.page,
        pageSize: action.payload.pageSize ?? state.pageSize,
      };
    default:
      return state;
  }
}

export function useMemoryDetailView({
  resourceId,
  fetchResource,
  fetchEntries,
}) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const isSearchMode = Boolean(state.searchQuery);

  useEffect(() => {
    if (!resourceId) return undefined;

    let isMounted = true;

    const loadResource = async () => {
      dispatch({ type: "meta/start" });
      try {
        const resource = await fetchResource(resourceId);
        if (!isMounted) return;
        dispatch({ type: "meta/success", payload: resource });
      } catch (fetchError) {
        if (!isMounted) return;
        console.error(fetchError);
        dispatch({
          type: "meta/error",
          payload:
            fetchError?.response?.data?.message ||
            "Error loading resource",
        });
      }
    };

    void loadResource();

    return () => {
      isMounted = false;
    };
  }, [resourceId, fetchResource]);

  const loadEntries = useCallback(
    async (nextPage, nextPageSize, filter) => {
      if (!resourceId) return;

      dispatch({ type: "entries/start" });
      try {
        const entriesData = await fetchEntries(resourceId, {
          page: nextPage,
          size: nextPageSize,
          filter,
        });
        dispatch({
          type: "entries/success",
          payload: {
            docs: entriesData?.docs ?? [],
            total: entriesData?.total ?? 0,
          },
        });
      } catch (fetchError) {
        console.error(fetchError);
        dispatch({
          type: "entries/error",
          payload:
            fetchError?.response?.data?.message ||
            "Error loading entries",
        });
      }
    },
    [resourceId, fetchEntries],
  );

  useEffect(() => {
    if (!resourceId) return undefined;

    void loadEntries(
      state.page,
      state.pageSize,
      isSearchMode ? state.searchQuery : undefined,
    );

    return undefined;
  }, [
    resourceId,
    state.page,
    state.pageSize,
    isSearchMode,
    state.searchQuery,
    loadEntries,
  ]);

  const handleSearch = () => {
    const trimmed = state.searchInput.trim();
    if (!trimmed) return;
    dispatch({ type: "search/submit", payload: trimmed });
  };

  const handleClearSearch = () => {
    dispatch({ type: "search/clear" });
  };

  const handleSearchInputChange = (value) => {
    dispatch({ type: "search/input", payload: value });
  };

  const handlePaginationChange = (page, pageSize) => {
    if (isSearchMode) return;
    dispatch({ type: "pagination", payload: { page, pageSize } });
  };

  return {
    state,
    isSearchMode,
    handleSearch,
    handleClearSearch,
    handleSearchInputChange,
    handlePaginationChange,
  };
}
