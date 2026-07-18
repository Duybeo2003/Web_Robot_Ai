"use client"

import React from "react"

export function SortForm({ 
  query, 
  typeFilter, 
  minPrice, 
  maxPrice, 
  sortOption 
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
      {minPrice !== undefined && <input type="hidden" name="minPrice" value={minPrice} />}
      {maxPrice !== undefined && <input type="hidden" name="maxPrice" value={maxPrice} />}
      <select 
        name="sort"
        defaultValue={sortOption}
        onChange={(e) => e.target.form?.submit()}
        className="h-10 pl-3 pr-8 text-sm border border-neutral-200 rounded-sm focus:outline-none focus:border-[#FF5722] bg-white appearance-none cursor-pointer hover:bg-neutral-50 transition-colors"
      >
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá: Thấp đến Cao</option>
        <option value="price_desc">Giá: Cao đến Thấp</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </form>
  )
}
