@include('reports.partials.styles')
@php
    $fmt = fn($n) => 'S/ ' . number_format((float)$n, 2, '.', ',');
    $maxField = max(array_column($data['topFields'] ?? [], 'total_revenue') ?: [1]);
    $statusColors = ['completed'=>'status-completed','confirmed'=>'status-confirmed','pending'=>'status-pending','cancelled'=>'status-cancelled'];
    $statusLabels = ['completed'=>'Completada','confirmed'=>'Confirmada','pending'=>'Pendiente','cancelled'=>'Cancelada'];
@endphp
<body>

<div class="pdf-header">
    <div class="header-row">
        <div>
            <div class="company">{{ $tenantName }}</div>
            <div class="report-title">Reporte de Reservaciones</div>
            <div class="meta">Periodo: {{ $period['start'] }} al {{ $period['end'] }}</div>
        </div>
        <div class="badge">RESERVACIONES</div>
    </div>
</div>

<div class="content">

{{-- KPIs --}}
<div class="kpi-grid" style="margin-top:18px;">
    <div class="kpi-card kpi-blue">
        <div class="kpi-label">Total Reservaciones</div>
        <div class="kpi-value text-blue">{{ number_format($data['totalCount']) }}</div>
    </div>
    <div class="kpi-card kpi-green">
        <div class="kpi-label">Ingreso por Reservas</div>
        <div class="kpi-value text-green">{{ $fmt($data['totalRevenue']) }}</div>
        <div class="kpi-sub">Confirmadas + Completadas</div>
    </div>
    <div class="kpi-card kpi-blue">
        <div class="kpi-label">Completadas</div>
        <div class="kpi-value text-blue">{{ $data['completedCount'] }}</div>
    </div>
    <div class="kpi-card kpi-amber">
        <div class="kpi-label">Pendientes</div>
        <div class="kpi-value text-amber">{{ $data['pendingCount'] }}</div>
    </div>
    <div class="kpi-card kpi-red">
        <div class="kpi-label">Tasa Cancelación</div>
        <div class="kpi-value text-red">{{ $data['cancellationRate'] }}%</div>
        <div class="kpi-sub">{{ $data['cancelledCount'] }} canceladas</div>
    </div>
</div>

{{-- Status Distribution + Top Fields --}}
<div class="two-col">
<div class="col-half no-break">
<div class="section-title">Distribución por Estado</div>
<div class="bar-chart">
@foreach($data['byStatus'] as $s)
<div class="bar-row">
    <div class="bar-label">{{ $s['label'] }}</div>
    <div class="bar-track">
        <div class="bar-fill" style="width:{{ $s['pct'] }}%; background:{{ $s['color'] }};"></div>
    </div>
    <div class="bar-value" style="color:{{ $s['color'] }}">{{ $s['count'] }} ({{ $s['pct'] }}%)</div>
</div>
@endforeach
</div>
</div>

<div class="col-half no-break">
<div class="section-title">Ranking de Canchas</div>
@if(count($data['topFields']) === 0)
    <p style="font-size:10px; color:#9ca3af; font-style:italic;">Sin datos.</p>
@else
<div class="bar-chart">
@foreach($data['topFields'] as $i => $f)
@php $f = (object)$f; $barPct = $maxField > 0 ? round($f->total_revenue/$maxField*100) : 0; @endphp
<div class="bar-row">
    <div class="bar-label">{{ \Illuminate\Support\Str::limit($f->name, 12) }}</div>
    <div class="bar-track"><div class="bar-fill" style="width:{{ $barPct }}%; background:#2563eb;"></div></div>
    <div class="bar-value text-blue" style="font-size:8px;">{{ $fmt($f->total_revenue) }}</div>
</div>
@endforeach
</div>
@endif
</div>
</div>

{{-- Top Clients Table --}}
@if(count($data['topClients']) > 0)
<div class="section-title">Top Clientes por Gasto</div>
<table class="no-break">
    <thead><tr>
        <th>#</th><th>Cliente</th>
        <th class="text-right">Reservaciones</th>
        <th class="text-right">Gasto Total (S/)</th>
    </tr></thead>
    <tbody>
    @foreach($data['topClients'] as $i => $c)
    @php $c = (object)$c; @endphp
    <tr>
        <td class="rank">{{ $i+1 }}</td>
        <td>{{ $c->name }}</td>
        <td class="text-right">{{ $c->total_reservations }}</td>
        <td class="text-right" style="color:#7c3aed; font-weight:bold;">{{ $fmt($c->total_spent) }}</td>
    </tr>
    @endforeach
    </tbody>
</table>
@endif

{{-- Reservations Detail --}}
<div class="section-title" style="page-break-before:always;">Detalle de Reservaciones</div>
<table>
    <thead><tr>
        <th>Código</th>
        <th>Fecha</th>
        <th>Cancha</th>
        <th>Cliente</th>
        <th>Horario</th>
        <th class="text-right">Monto (S/)</th>
        <th>Estado</th>
    </tr></thead>
    <tbody>
    @forelse($data['reservations'] as $r)
    <tr>
        <td style="font-weight:bold; font-size:9px; font-family:monospace;">{{ $r->code }}</td>
        <td>{{ \Carbon\Carbon::parse($r->date)->format('d/m/Y') }}</td>
        <td>{{ $r->field_name ?? '—' }}</td>
        <td>{{ \Illuminate\Support\Str::limit($r->client_name ?? 'Sin cliente', 20) }}</td>
        <td style="font-size:9px; color:#6b7280; white-space:nowrap;">
            {{ substr($r->start_time,0,5) }} – {{ substr($r->end_time,0,5) }}
        </td>
        <td class="text-right" style="font-weight:bold; color:#15803d;">{{ $fmt($r->amount) }}</td>
        <td>
            <span class="cat-badge {{ $statusColors[$r->status] ?? 'cat-gray' }}">
                {{ $statusLabels[$r->status] ?? $r->status }}
            </span>
        </td>
    </tr>
    @empty
    <tr><td colspan="7" style="text-align:center; color:#9ca3af; font-style:italic;">Sin reservaciones en este periodo.</td></tr>
    @endforelse
    </tbody>
</table>

</div>

@include('reports.partials.footer')
</body>
</html>
