import { Head } from '@inertiajs/react';
import AutoMapDemo from '@/components/automap';

export default function N8nPage() {
    return (
        <>
            <Head title="n8n — AutoMap" />
            <div className="space-y-6">
                <AutoMapDemo />
            </div>
        </>
    );
}
