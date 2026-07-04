import { Link } from '@inertiajs/react';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    if (breadcrumbs.length === 0) {
        return null;
    }

    const current = breadcrumbs[breadcrumbs.length - 1];

    if (breadcrumbs.length === 1) {
        return (
            <Breadcrumb>
                <BreadcrumbList className="gap-0">
                    <BreadcrumbItem>
                        <BreadcrumbPage className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-sm font-medium text-emerald-50">
                            <span className="flex size-5 items-center justify-center rounded-sm border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                                <LayoutDashboard className="size-3.5" />
                            </span>
                            <span>{current.title}</span>
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    return (
        <Breadcrumb>
            <BreadcrumbList className="text-sm text-slate-400">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <Fragment key={`${item.title}-${index}`}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-medium text-slate-100">
                                        {item.title}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        asChild
                                        className="transition-colors hover:text-emerald-300"
                                    >
                                        <Link href={item.href}>
                                            {item.title}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && (
                                <BreadcrumbSeparator className="text-slate-600">
                                    <ChevronRight className="size-3.5" />
                                </BreadcrumbSeparator>
                            )}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
