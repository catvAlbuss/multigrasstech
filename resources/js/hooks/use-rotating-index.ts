import { useEffect, useState } from 'react';

export function useRotatingIndex(total: number, intervalMs = 5000) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (total <= 1) {
return;
}

        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % total);
        }, intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs, total]);

    function previous() {
        setIndex((current) => (current === 0 ? total - 1 : current - 1));
    }

    function next() {
        setIndex((current) => (current + 1) % total);
    }

    return { index, setIndex, previous, next };
}
