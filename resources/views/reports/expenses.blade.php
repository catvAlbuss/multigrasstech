@include('reports.partials.styles')
@php
    $fmt = fn($n) => 'S/ ' . number_format((float)$n, 2, '.', ',');
    $maxCat = count($data['byCategory']) > 0 ? max(array_column($data['byCategory'], 'total')) : 1;
    $maxWeek = count($data['weeks']) > 0 ? max(array_column($data['weeks'], 'total')) : 1;
    $catColorList = ['#ef4444','#f97316','#eab308','#8b5cf6','#06b6d4','#ec4899','#10b981','#6366f1'];
@endphp
<body>

<div class="pdf-header">
    <div class="header-row">
        <div>
            <div class="company">{{ $tenantName }}</div>
            <div class="report-title">Reporte de Gastos</div>
            <div class="meta">Periodo: {{ $period['start'] }} al {{ $period['end'] }}</div>
        </div>
        <div class="badge">EGRESOS</div>
    </div>
</div>

<div class="content">

{{-- KPIs --}}
<div class="kpi-grid" style="margin-top:18px;">
    <div class="kpi-card kpi-red">
        <div class="kpi-label">Total Gastos</div>
        <div class="kpi-value text-red">{{ $fmt($data['totalAmount']) }}</div>
        <div class="kpi-sub">Total de egresos del periodo</div>
    </div>
    <div class="kpi-card kpi-amber">
        <div class="kpi-label">Nº Transacciones</div>
        <div class="kpi-value text-amber">{{ number_format($data['totalCount']) }}</div>
    </div>
    <div class="kpi-card kpi-purple">
        <div class="kpi-label">Gasto Promedio</div>
        <div class="kpi-value text-purple">{{ $fmt($data['avgAmount']) }}</div>
        <div class="kpi-sub">Por transacción</div>
    </div>
</div>

{{-- Category + Weekly Breakdown --}}
<div class="two-col">
<div class="col-half no-break">
<div class="section-title">Gastos por Categoría</div>
<div class="bar-chart">
@foreach($data['byCategory'] as $i => $cat)
@php $cat = (object)$cat; $barPct = $maxCat > 0 ? round($cat->total/$maxCat*100) : 0; $color = $catColorList[$i % count($catColorList)]; @endphp
<div class="bar-row">
    <div class="bar-label">{{ ucfirst($cat->category) }}</div>
    <div class="bar-track"><div class="bar-fill" style="width:{{ $barPct }}%; background:{{ $color }};"></div></div>
    <div class="bar-value" style="color:{{ $color }}; font-size:8px;">{{ $fmt($cat->total) }}</div>
</div>
@endforeach
</div>
</div>

<div class="col-half no-break">
<div class="section-title">Gasto Semanal</div>
@foreach($data['weeks'] as $w)
@php $barPct = $maxWeek > 0 ? round($w['total']/$maxWeek*100) : 0; @endphp
<div style="margin-bottom: 6px;">
    <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px;">
        <span style="color:#6b7280;">{{ $w['label'] }}</span>
        <span style="color:#ef4444; font-weight:bold;">{{ $fmt($w['total']) }}</span>
    </div>
    <div class="bar-track" style="height:10px;">
        <div class="bar-fill" style="width:{{ $barPct }}%; background:#ef4444; height:10px;"></div>
    </div>
</div>
@endforeach
</div>
</div>

{{-- Category Summary Table --}}
<div class="section-title" style="margin-top:14px;">Resumen por Categoría</div>
<table class="no-break">
    <thead><tr>
        <th>Categoría</th>
        <th class="text-right">Transacciones</th>
        <th class="text-right">Total (S/)</th>
        <th class="text-right">% del Total</th>
    </tr></thead>
    <tbody>
    @foreach($data['byCategory'] as $i => $cat)
    @php $cat = (object)$cat; $color = $catColorList[$i % count($catColorList)]; @endphp
    <tr>
        <td>
            <span class="cat-badge" style="background:{{ $color }}22; color:{{ $color }};">
                {{ ucfirst($cat->category) }}
            </span>
        </td>
        <td class="text-right">{{ $cat->count }}</td>
        <td class="text-right" style="font-weight:bold;">{{ $fmt($cat->total) }}</td>
        <td class="text-right" style="color:#6b7280;">{{ $cat->pct }}%</td>
    </tr>
    @endforeach
    <tr style="background:#fef2f2;">
        <td style="font-weight:bold; color:#dc2626;">TOTAL</td>
        <td class="text-right" style="font-weight:bold;">{{ $data['totalCount'] }}</td>
        <td class="text-right" style="font-weight:bold; color:#dc2626; font-size:12px;">{{ $fmt($data['totalAmount']) }}</td>
        <td class="text-right" style="font-weight:bold;">100%</td>
    </tr>
    </tbody>
</table>

{{-- Expenses Detail --}}
<div class="section-title" style="page-break-before:always;">Detalle de Gastos</div>
<table>
    <thead><tr>
        <th>Fecha</th>
        <th>Categoría</th>
        <th>Descripción</th>
        <th class="text-right">Monto (S/)</th>
        <th>Notas</th>
    </tr></thead>
    <tbody>
    @forelse($data['expenses'] as $expense)
    <tr>
        <td style="white-space:nowrap;">{{ \Carbon\Carbon::parse($expense->date)->format('d/m/Y') }}</td>
        <td>
            <span class="cat-badge cat-red">{{ ucfirst($expense->category) }}</span>
        </td>
        <td>{{ \Illuminate\Support\Str::limit($expense->description, 40) }}</td>
        <td class="text-right" style="color:#dc2626; font-weight:bold;">{{ $fmt($expense->amount) }}</td>
        <td style="font-size:9px; color:#9ca3af;">{{ \Illuminate\Support\Str::limit($expense->notes ?? '', 30) }}</td>
    </tr>
    @empty
    <tr><td colspan="5" style="text-align:center; color:#9ca3af; font-style:italic;">Sin gastos registrados en este periodo.</td></tr>
    @endforelse
    </tbody>
</table>

</div>

@include('reports.partials.footer')
</body>
</html>
