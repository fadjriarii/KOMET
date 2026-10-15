import { formatNumber } from '@komet/shared/formatters';

export function getPaginationMeta({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  currentCount = 0,
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min((currentPage - 1) * pageSize + currentCount, totalItems);
  return {
    currentPage,
    totalPages,
    isFirstPage: currentPage <= 1,
    isLastPage: currentPage >= totalPages,
    rangeLabel: `${start}-${end}`,
    totalLabel: formatNumber(totalItems),
  };
}
export function getPaginationItems(currentPage = 1, totalPages = 1, siblingCount = 1) {
  if (totalPages <= 1) return [1];
  const pages = new Set([1, totalPages]);
  for (
    let page = Math.max(1, currentPage - siblingCount);
    page <= Math.min(totalPages, currentPage + siblingCount);
    page += 1
  )
    pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`);
    result.push(page);
  });
  return result;
}
