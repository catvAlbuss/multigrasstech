import { useMemo, useState } from 'react';
import type { CajaProduct } from '@/types/caja';

export function useCajaProducts(products: CajaProduct[]) {
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = useMemo(
        () => [...new Set(products.map((product) => product.category))].sort(),
        [products],
    );

    const filteredProducts = useMemo(() => {
        let list = products;

        if (categoryFilter) {
            list = list.filter(
                (product) => product.category === categoryFilter,
            );
        }

        const query = searchQuery.trim().toLowerCase();

        if (query !== '') {
            list = list.filter(
                (product) =>
                    product.name.toLowerCase().includes(query) ||
                    (product.sku &&
                        product.sku.toLowerCase().includes(query)) ||
                    (product.has_variants &&
                        product.variants?.some((variant) =>
                            variant.label.toLowerCase().includes(query),
                        )),
            );
        }

        return list;
    }, [products, categoryFilter, searchQuery]);

    const variantsCount = useMemo(
        () =>
            products.reduce(
                (sum, product) => sum + (product.variants?.length ?? 0),
                0,
            ),
        [products],
    );

    return {
        categories,
        categoryFilter,
        filteredProducts,
        searchQuery,
        setCategoryFilter,
        setSearchQuery,
        variantsCount,
    };
}
