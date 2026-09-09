"use client";

import React from "react";

export function SortForm({
  query,
  typeFilter,
  minPrice,
  maxPrice,
  sortOption,
}: {
  query?: string;
  typeFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  sortOption: string;
}) {
  return (
    <form action="/shop" method="GET" className="relative">
      {query && <input type="hidden" name="q" value={query} />}
      {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
      {minPrice !== undefined && (
        <input type="hidden" name="minPrice" value={minPrice} />
      )}
      {maxPrice !== undefined && (
        <input type="hidden" name="maxPrice" value={maxPrice} />
      )}
      <select
        name="sort"
        defaultValue={sortOption}
        onChange={(e) => e.target.form?.submit()}
        aria-label="Sắp xếp sản phẩm"
        className="h-10 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white pl-3 pr-9 text-sm font-medium outline-none transition-colors hover:bg-neutral-50 focus:border-primary focus:ring-3 focus:ring-primary/10"
      >
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá: thấp đến cao</option>
        <option value="price_desc">Giá: cao đến thấp</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </form>
  );
}
