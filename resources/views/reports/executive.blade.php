@include('reports.partials.styles')
@php
    $fmt = fn($n) => 'S/ ' . number_format((float)$n, 2, '.', ',');
    $pct = fn($n) => number_format((float)$n, 1) . '%';
    $maxWeekIncome = max(array_column($data['weeks'] ?? [], 'income') ?: [1]);
    $maxWeekExpense = max(array_column($data['weeks'] ?? [], 'expense') ?: [1]);
    $maxBar = max($maxWeekIncome, $maxWeekExpense, 1);

    $catColors = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#0891b2'];
    $maxProduct = max(array_column($data['topProducts'] ?? [], 'total_revenue') ?: [1]);
    $maxField   = max(array_column($data['topFields'] ?? [], 'total_revenue') ?: [1]);
    $maxClient  = max(array_column($data['topClients'] ?? [], 'total_spent') ?: [1]);
@endphp
<body>

{{-- ─── HEADER ────────────────────────────────────────────────────────── --}}
<div class="pdf-header">
    <div class="header-row">
        <div>
            <div class="company">{{ $tenantName }}</div>
            <div class="report-title">Reporte Ejecutivo Mensual</div>
            <div class="meta">Periodo: {{ $period['start'] }} al {{ $period['end'] }}</div>
        </div>
        <div class="badge">RESUMEN EJECUTIVO</div>
    </div>
</div>

<div class="content">

{{-- ─── KPI CARDS ───────────────────────────────────────────────────── --}}
<div class="kpi-grid" style="margin-top:18px;">
    <div class="kpi-card kpi-green">
        <div class="kpi-label">Ingresos Totales</div>
        <div class="kpi-value text-green">{{ $fmt($data['totalIncome']) }}</div>
        <div class="kpi-sub">Ventas + Reservas + Otros</div>
    </div>
    <div class="kpi-card kpi-red">
        <div class="kpi-label">Gastos Totales</div>
        <div class="kpi-value text-red">{{ $fmt($data['totalExpenses']) }}</div>
        <div class="kpi-sub">Egresos registrados</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #15803d; background: #f0fdf4;">
        <div class="kpi-label">Balance Neto</div>
        <div class="kpi-value {{ $data['totalBalance'] >= 0 ? 'text-green' : 'text-red' }}">
            {{ $fmt($data['totalBalance']) }}
        </div>
        <div class="kpi-sub">Ingresos − Gastos</div>
    </div>
</div>

<div class="kpi-grid">
    <div class="kpi-card kpi-blue">
        <div class="kpi-label">Ventas (Caja)</div>
        <div class="kpi-value text-blue">{{ $fmt($data['totalSales']) }}</div>
    </div>
    <div class="kpi-card kpi-purple">
        <div class="kpi-label">Reservaciones</div>
        <div class="kpi-value text-purple">{{ $fmt($data['totalResv']) }}</div>
    </div>
    <div class="kpi-card kpi-amber">
        <div class="kpi-label">Clientes Únicos</div>
        <div class="kpi-value text-amber">{{ number_format($data['uniqueClients']) }}</div>
    </div>
</div>

{{-- ─── INCOME DISTRIBUTION ─────────────────────────────────────────── --}}
<div class="two-col" style="margin-top:4px;">
    <div class="col-half no-break">
        <div class="section-title">Distribución de Ingresos</div>
        @foreach($data['catDist'] as $i => $cat)
        <div class="bar-row">
            <div class="bar-label">{{ $cat['label'] }}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width:{{ $cat['pct'] }}%; background:{{ $catColors[$i] }};"></div>
            </div>
            <div class="bar-value" style="color:{{ $catColors[$i] }}">{{ $fmt($cat['amount']) }}</div>
        </div>
        @endforeach
    </div>

    <div class="col-half no-break">
        <div class="section-title">Ingresos vs Gastos (Semanal)</div>
        @foreach($data['weeks'] as $w)
        <div style="margin-bottom: 5px;">
            <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px;">
                <span style="color:#6b7280;">{{ $w['label'] }}</span>
                <span style="color:#16a34a; font-weight:bold;">{{ $fmt($w['income']) }}</span>
            </div>
            <div class="bar-track" style="height:8px; margin-bottom:1px;">
                <div class="bar-fill" style="width:{{ $maxBar > 0 ? round($w['income']/$maxBar*100) : 0 }}%; background:#16a34a; height:8px;"></div>
            </div>
            <div class="bar-track" style="height:8px;">
                <div class="bar-fill" style="width:{{ $maxBar > 0 ? round($w['expense']/$maxBar*100) : 0 }}%; background:#ef4444; height:8px;"></div>
            </div>
        </div>
        @endforeach
    </div>
</div>

{{-- ─── TOP PRODUCTS ────────────────────────────────────────────────── --}}
<div class="section-title" style="margin-top:14px;">Top Productos Vendidos</div>
@if(count($data['topProducts']) === 0)
    <p style="font-size:10px; color:#9ca3af; font-style:italic;">Sin ventas registradas en este periodo.</p>
@else
<table class="no-break">
    <thead><tr>
        <th>#</th>
        <th>Producto</th>
        <th class="text-right">Unidades</th>
        <th class="text-right">Total (S/)</th>
        <th style="width:100px;">Participación</th>
    </tr></thead>
    <tbody>
    @foreach($data['topProducts'] as $i => $p)
    <tr>
        <td class="rank">{{ $i+1 }}</td>
        <td>{{ $p->name }}</td>
        <td class="text-right">{{ number_format($p->total_qty) }}</td>
        <td class="text-right" style="color:#15803d; font-weight:bold;">{{ $fmt($p->total_revenue) }}</td>
        <td>
            <div class="bar-track" style="height:10px; display:inline-block; width:80px; vertical-align:middle;">
                <div class="bar-fill" style="width:{{ $maxProduct > 0 ? round($p->total_revenue/$maxProduct*100) : 0 }}%; background:#16a34a; height:10px;"></div>
            </div>
        </td>
    </tr>
    @endforeach
    </tbody>
</table>
@endif

{{-- ─── TOP FIELDS ──────────────────────────────────────────────────── --}}
<div class="two-col" style="margin-top:4px;">
<div class="col-half no-break">
<div class="section-title">Campos Más Usados</div>
@if(count($data['topFields']) === 0)
    <p style="font-size:10px; color:#9ca3af; font-style:italic;">Sin reservaciones en este periodo.</p>
@else
<table>
    <thead><tr>
        <th>#</th><th>Campo</th>
        <th class="text-right">Reservas</th>
        <th class="text-right">Total (S/)</th>
    </tr></thead>
    <tbody>
    @foreach($data['topFields'] as $i => $f)
    <tr>
        <td class="rank">{{ $i+1 }}</td>
        <td>{{ $f->name }}</td>
        <td class="text-right">{{ $f->total_reservations }}</td>
        <td class="text-right text-blue" style="font-weight:bold;">{{ $fmt($f->total_revenue) }}</td>
    </tr>
    @endforeach
    </tbody>
</table>
@endif
</div>

<div class="col-half no-break">
<div class="section-title">Mejores Clientes</div>
@if(count($data['topClients']) === 0)
    <p style="font-size:10px; color:#9ca3af; font-style:italic;">Sin datos de clientes en este periodo.</p>
@else
<table>
    <thead><tr>
        <th>#</th><th>Cliente</th>
        <th class="text-right">Reservas</th>
        <th class="text-right">Gasto (S/)</th>
    </tr></thead>
    <tbody>
    @foreach($data['topClients'] as $i => $c)
    <tr>
        <td class="rank">{{ $i+1 }}</td>
        <td>{{ $c->name }}</td>
        <td class="text-right">{{ $c->total_reservations }}</td>
        <td class="text-right text-purple" style="font-weight:bold;">{{ $fmt($c->total_spent) }}</td>
    </tr>
    @endforeach
    </tbody>
</table>
@endif
</div>
</div>

{{-- ─── BUSIEST HOURS ───────────────────────────────────────────────── --}}
@php $maxHour = max(array_column($data['hoursData'], 'reservas') ?: [1]); @endphp
<div class="section-title no-break" style="margin-top:14px;">Horas Punta</div>
<div class="no-break" style="display:flex; gap:3px; align-items:flex-end; height:50px; margin:8px 0 4px 0;">
    @foreach($data['hoursData'] as $h)
    @php $barH = $maxHour > 0 ? max(2, round($h['reservas']/$maxHour*44)) : 2; @endphp
    <div style="flex:1; text-align:center;">
        <div style="background:#3b82f6; border-radius:2px 2px 0 0; height:{{ $barH }}px; margin:0 1px;"></div>
        <div style="font-size:7px; color:#6b7280; margin-top:2px; transform:rotate(-45deg); transform-origin:center;">{{ substr($h['name'],0,2) }}</div>
    </div>
    @endforeach
</div>

</div>{{-- /content --}}

@include('reports.partials.footer')
</body>
</html>
