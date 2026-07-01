import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronRight,
    FileText,
    Film,
    GitBranch,
    Image as ImageIcon,
    Maximize2,
    Plus,
    Table as TableIcon,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';

type TreeNode = {
    id: string;
    title: string;
    type: 'text' | 'table' | 'image' | 'video';
    color: keyof typeof COLORS;
    status: string;
    content: any;
    children: TreeNode[];
};

type PositionedNode = {
    x: number;
    y: number;
    node: TreeNode;
    parentId: string | null;
    rootId: string;
    hasChildren: boolean;
    expanded: boolean;
};

const seedForest: TreeNode[] = [
    {
        id: 'app-movil',
        title: 'App Móvil — Lanzamiento',
        type: 'text',
        color: 'violet',
        status: 'En curso',
        content: 'Automatización del ciclo de vida: planificación, desarrollo, QA y lanzamiento.',
        children: [
            {
                id: 'plan',
                title: 'Planificación',
                type: 'text',
                color: 'sky',
                status: 'Completo',
                content: 'Definición de alcance, cronograma y recursos del proyecto.',
                children: [
                    {
                        id: 'plan-cronograma',
                        title: 'Cronograma',
                        type: 'table',
                        color: 'sky',
                        status: 'Completo',
                        content: {
                            headers: ['Fase', 'Inicio', 'Fin'],
                            rows: [
                                ['Diseño', '01/06', '15/06'],
                                ['Desarrollo', '16/06', '30/07'],
                                ['QA', '01/08', '10/08'],
                            ],
                        },
                        children: [],
                    },
                    {
                        id: 'plan-equipo',
                        title: 'Asignación de equipo',
                        type: 'text',
                        color: 'sky',
                        status: 'Completo',
                        content: '3 devs frontend, 2 backend, 1 QA, 1 PM. Reunión semanal los lunes.',
                        children: [],
                    },
                ],
            },
            {
                id: 'dev',
                title: 'Desarrollo',
                type: 'text',
                color: 'emerald',
                status: 'En curso',
                content: 'Construcción del producto: frontend, backend e integraciones.',
                children: [
                    {
                        id: 'dev-frontend',
                        title: 'Frontend (React Native)',
                        type: 'image',
                        color: 'emerald',
                        status: 'En curso',
                        content: {
                            url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&q=60',
                            caption: 'Maqueta de la pantalla principal',
                        },
                        children: [
                            {
                                id: 'dev-frontend-onboarding',
                                title: 'Flujo de onboarding',
                                type: 'text',
                                color: 'emerald',
                                status: 'Pendiente',
                                content: '3 pantallas: bienvenida, permisos, registro. Animaciones con Reanimated.',
                                children: [],
                            },
                        ],
                    },
                    {
                        id: 'dev-backend',
                        title: 'Backend (Node + Postgres)',
                        type: 'text',
                        color: 'emerald',
                        status: 'En curso',
                        content: 'API REST con autenticación JWT, websockets para notificaciones en tiempo real.',
                        children: [],
                    },
                ],
            },
            {
                id: 'qa',
                title: 'QA y pruebas',
                type: 'video',
                color: 'amber',
                status: 'Pendiente',
                content: {
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    caption: 'Demo de pruebas E2E automatizadas',
                },
                children: [
                    {
                        id: 'qa-bugs',
                        title: 'Errores críticos',
                        type: 'table',
                        color: 'amber',
                        status: 'En curso',
                        content: {
                            headers: ['ID', 'Severidad', 'Estado'],
                            rows: [
                                ['#102', 'Alta', 'Abierto'],
                                ['#098', 'Media', 'Resuelto'],
                            ],
                        },
                        children: [],
                    },
                ],
            },
            {
                id: 'launch',
                title: 'Lanzamiento',
                type: 'text',
                color: 'rose',
                status: 'Pendiente',
                content: 'Publicación en App Store y Play Store, campaña de marketing coordinada.',
                children: [],
            },
        ],
    },
    {
        id: 'marketing',
        title: 'Campaña de Marketing Q3',
        type: 'text',
        color: 'fuchsia',
        status: 'En curso',
        content: 'Estrategia de adquisición de usuarios para el trimestre, ligada al lanzamiento de la app.',
        children: [
            {
                id: 'mkt-contenido',
                title: 'Contenido en redes',
                type: 'image',
                color: 'fuchsia',
                status: 'En curso',
                content: {
                    url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=60',
                    caption: 'Plan visual de feed Instagram',
                },
                children: [],
            },
            {
                id: 'mkt-presupuesto',
                title: 'Presupuesto de pauta',
                type: 'table',
                color: 'fuchsia',
                status: 'Completo',
                content: {
                    headers: ['Canal', 'Inversión', 'Meta'],
                    rows: [
                        ['Meta Ads', '$3,000', '50k instalaciones'],
                        ['TikTok Ads', '$2,000', '30k instalaciones'],
                    ],
                },
                children: [],
            },
        ],
    },
    {
        id: 'infra',
        title: 'Infraestructura & DevOps',
        type: 'text',
        color: 'cyan',
        status: 'En curso',
        content: 'Pipelines de CI/CD, monitoreo y escalabilidad para soportar el lanzamiento.',
        children: [
            {
                id: 'infra-cicd',
                title: 'Flujo CI/CD',
                type: 'text',
                color: 'cyan',
                status: 'Completo',
                content: 'GitHub Actions: compilación → pruebas → despliegue automático a preproducción en cada PR aprobado.',
                children: [],
            },
            {
                id: 'infra-monitoreo',
                title: 'Monitoreo y alertas',
                type: 'text',
                color: 'cyan',
                status: 'Pendiente',
                content: 'Integración con Datadog, alertas a Slack ante caídas de servicio.',
                children: [],
            },
        ],
    },
];

const COLORS = {
    violet: { bg: 'bg-violet-500', text: 'text-violet-300', border: 'border-violet-400/40', line: '#a78bfa', soft: 'bg-violet-500/10' },
    sky: { bg: 'bg-sky-500', text: 'text-sky-300', border: 'border-sky-400/40', line: '#7dd3fc', soft: 'bg-sky-500/10' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-400/40', line: '#6ee7b7', soft: 'bg-emerald-500/10' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-300', border: 'border-amber-400/40', line: '#fcd34d', soft: 'bg-amber-500/10' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-300', border: 'border-rose-400/40', line: '#fda4af', soft: 'bg-rose-500/10' },
    fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-300', border: 'border-fuchsia-400/40', line: '#f0abfc', soft: 'bg-fuchsia-500/10' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-300', border: 'border-cyan-400/40', line: '#67e8f9', soft: 'bg-cyan-500/10' },
};

const STATUS_DOT: Record<string, string> = {
    Completo: 'bg-emerald-400',
    'En curso': 'bg-amber-400',
    Pendiente: 'bg-zinc-500',
};

const TYPE_ICON = { text: FileText, table: TableIcon, image: ImageIcon, video: Film };
const TYPE_LABEL: Record<TreeNode['type'], string> = {
    text: 'Texto',
    table: 'Tabla',
    image: 'Imagen',
    video: 'Video',
};

const NODE_W = 232;
const NODE_H = 80;
const X_GAP = 96;
const Y_GAP = 28;
const TREE_GAP = 56;

function layoutTree(
    node: TreeNode,
    expanded: Record<string, boolean>,
    depth: number,
    yOffsetRef: { current: number },
    positions: Record<string, PositionedNode>,
    parentId: string | null,
    rootId: string,
): number {
    const isExpanded = expanded[node.id] !== false;
    const kids = isExpanded ? node.children : [];

    if (!kids || kids.length === 0) {
        const y = yOffsetRef.current;
        yOffsetRef.current += NODE_H + Y_GAP;
        positions[node.id] = {
            x: depth * (NODE_W + X_GAP),
            y,
            node,
            parentId,
            rootId,
            hasChildren: node.children && node.children.length > 0,
            expanded: isExpanded,
        };
        return y;
    }

    const childYs: number[] = kids.map((c) => layoutTree(c, expanded, depth + 1, yOffsetRef, positions, node.id, rootId));
    const y: number = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positions[node.id] = {
        x: depth * (NODE_W + X_GAP),
        y,
        node,
        parentId,
        rootId,
        hasChildren: node.children && node.children.length > 0,
        expanded: isExpanded,
    };
    return y;
}

export default function AutoMapDemo() {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selected, setSelected] = useState<TreeNode | null>(null);
    const [scale, setScale] = useState(0.85);
    const [pan, setPan] = useState({ x: 64, y: 48 });
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

    const positions = useMemo<Record<string, PositionedNode>>(() => {
        const pos: Record<string, PositionedNode> = {};
        const yRef = { current: 0 };
        seedForest.forEach((root) => {
            layoutTree(root, expanded, 0, yRef, pos, null, root.id);
            yRef.current += TREE_GAP;
        });
        return pos;
    }, [expanded]);

    const toggle = useCallback((id: string) => {
        setExpanded((e) => ({ ...e, [id]: e[id] === false ? true : false }));
    }, []);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-node]')) return;
        dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
    };

    const onPointerUp = () => {
        dragRef.current = null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            setScale((s) => Math.min(2, Math.max(0.3, s + delta)));
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', onWheel);
        };
    }, []);


    const resetView = () => {
        setScale(0.85);
        setPan({ x: 64, y: 48 });
    };

    const nodeList = Object.values(positions);
    const edges = nodeList.flatMap((p) => {
        if (!p.parentId || !positions[p.parentId]) {
            return [];
        }
        const parent = positions[p.parentId];
        return [{ from: parent, to: p }];
    });

    const maxX = Math.max(...nodeList.map((p) => p.x)) + NODE_W;
    const maxY = Math.max(...nodeList.map((p) => p.y)) + NODE_H;

    return (
        <div className="flex h-[min(820px,calc(100vh-7rem))] min-h-[560px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b0c10] text-zinc-200 shadow-2xl">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#101218] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-sky-500">
                        <GitBranch size={15} className="text-white" />
                    </div>
                    <span className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100">AutoMap</span>
                    <span className="ml-1 text-xs text-zinc-500">— mapa visual de automatizaciones</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button onClick={() => setScale((s) => Math.max(0.3, s - 0.15))} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Alejar">
                        <ZoomOut size={16} />
                    </button>
                    <span className="w-10 text-center text-xs text-zinc-500 tabular-nums">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale((s) => Math.min(2, s + 0.15))} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Acercar">
                        <ZoomIn size={16} />
                    </button>
                    <button onClick={resetView} className="ml-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Centrar vista">
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            <div className="border-b border-white/10 bg-[#101218]/70 px-4 py-2 text-[11px] leading-relaxed text-zinc-500">
                Arrastra para mover el lienzo - usa scroll para acercar o alejar - haz clic en un nodo para ver su contenido - usa la flecha para expandir o contraer ramas - {seedForest.length} proyectos raíz activos
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                    ref={canvasRef}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                        backgroundSize: `${22 * scale}px ${22 * scale}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                    }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                    <div
                        className="absolute left-0 top-0"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', width: maxX, height: maxY, }}>
                        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={maxX} height={maxY}>
                            {edges.map((e, i) => {
                                const x1 = e.from.x + NODE_W;
                                const y1 = e.from.y + NODE_H / 2;
                                const x2 = e.to.x;
                                const y2 = e.to.y + NODE_H / 2;
                                const midX = (x1 + x2) / 2;
                                const c = COLORS[e.from.node.color] || COLORS.violet;
                                return (
                                    <path
                                        key={i}
                                        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                                        stroke={c.line}
                                        strokeOpacity={0.45}
                                        strokeWidth={1.75}
                                        fill="none"
                                    />
                                );
                            })}
                        </svg>

                        {nodeList.map((p) => {
                            const c = COLORS[p.node.color] || COLORS.violet;
                            const Icon = TYPE_ICON[p.node.type] || FileText;
                            const isRoot = p.parentId === null;
                            const isSelected = selected !== null && selected.id === p.node.id;
                            return (
                                <div key={p.node.id} data-node style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }} className="absolute">
                                    <button
                                        onClick={() => setSelected(p.node)}
                                        className={`group relative flex h-full w-full flex-col justify-between rounded-lg border p-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all ${isSelected ? c.border.replace('/40', '/90') : 'border-white/10'} bg-[#13151b] hover:border-white/20 ${isSelected ? `ring-1 ${c.border.replace('border-', 'ring-')}` : ''}`}>
                                        <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${c.bg}`} />

                                        <div className="pl-2.5">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${c.soft}`}>
                                                        <Icon size={11} className={c.text} />
                                                    </span>
                                                    <span className="truncate text-[13px] font-medium leading-tight text-zinc-100">{p.node.title}</span>
                                                </div>
                                                {isRoot && (
                                                    <span className="shrink-0 rounded px-1 py-0.5 border border-white/10 text-[9px] uppercase tracking-wide text-zinc-500">Proyecto</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 pl-0.5">
                                                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[p.node.status] || 'bg-zinc-600'}`} />
                                                <span className="text-[10.5px] text-zinc-500">{p.node.status || '—'}</span>
                                                <span className="text-zinc-700">·</span>
                                                <span className="text-[10.5px] uppercase tracking-wide text-zinc-600">{TYPE_LABEL[p.node.type]}</span>
                                            </div>
                                        </div>

                                        {p.hasChildren && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    toggle(p.node.id);
                                                }}
                                                className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#1a1d27] text-zinc-300 transition-transform hover:scale-110 hover:border-white/30"
                                            >
                                                <ChevronRight size={13} className={`transition-transform ${p.expanded ? 'rotate-180' : ''}`} />
                                            </span>
                                        )}

                                        {!p.hasChildren && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                }}
                                                title="Añadir nodo hijo"
                                                className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-white/15 bg-[#1a1d27] text-zinc-500 opacity-0 transition-colors hover:border-white/30 hover:text-zinc-200 group-hover:opacity-100"
                                            >
                                                <Plus size={12} />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selected && (
                    <aside className="absolute inset-x-0 bottom-0 z-20 max-h-[78%] overflow-y-auto border-t border-white/10 bg-[#101218] p-4 shadow-2xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[min(420px,42vw)] sm:min-w-[340px] sm:border-l sm:border-t-0">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                                {(() => {
                                    const c = COLORS[selected.color] || COLORS.violet;
                                    const Icon = TYPE_ICON[selected.type] || FileText;
                                    return (
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${c.bg}/20`}>
                                            <Icon size={14} className={c.text} />
                                        </span>
                                    );
                                })()}
                                <div className="min-w-0">
                                    <h2 className="break-words text-sm font-semibold leading-snug text-zinc-100">{selected.title}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[selected.status] || 'bg-zinc-600'}`} />
                                        <span className="text-xs text-zinc-400">{selected.status || 'Sin estado'}</span>
                                        <span className="text-zinc-700">-</span>
                                        <span className="text-xs uppercase tracking-wide text-zinc-500">{TYPE_LABEL[selected.type]}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-white/10" aria-label="Cerrar detalle">
                                <X size={16} />
                            </button>
                        </div>

                        {selected.type === 'text' && (
                            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Descripción</p>
                                <p className="break-words text-sm leading-relaxed text-zinc-300">{selected.content}</p>
                            </section>
                        )}

                        {selected.type === 'table' && (
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="bg-white/5">
                                            {selected.content.headers.map((h: string, i: number) => (
                                                <th key={i} className="whitespace-nowrap px-2.5 py-2 text-left font-medium text-zinc-300">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selected.content.rows.map((r: string[], i: number) => (
                                            <tr key={i} className="border-t border-white/5">
                                                {r.map((cell: string, j: number) => (
                                                    <td key={j} className="whitespace-nowrap px-2.5 py-2 text-zinc-400">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selected.type === 'image' && (
                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                                <img src={selected.content.url} alt={selected.content.caption} className="w-full rounded-lg border border-white/10" />
                                <p className="mt-2 break-words text-xs leading-relaxed text-zinc-500">{selected.content.caption}</p>
                            </div>
                        )}

                        {selected.type === 'video' && (
                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                                <video src={selected.content.url} controls className="w-full rounded-lg border border-white/10" />
                                <p className="mt-2 break-words text-xs leading-relaxed text-zinc-500">{selected.content.caption}</p>
                            </div>
                        )}

                        {selected.children && selected.children.length > 0 && (
                            <div className="mt-4 border-t border-white/10 pt-4">
                                <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Subnodos ({selected.children.length})</p>
                                <div className="flex flex-col gap-1.5">
                                    {selected.children.map((ch) => (
                                        <button
                                            key={ch.id}
                                            onClick={() => setSelected(ch)}
                                            className="rounded-md bg-white/5 px-2.5 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            {ch.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2 text-xs text-zinc-400 transition-colors hover:border-white/30 hover:text-zinc-100">
                            <Plus size={13} /> Añadir nodo hijo
                        </button>
                    </aside>
                )}
            </div>
        </div>
    );
}
