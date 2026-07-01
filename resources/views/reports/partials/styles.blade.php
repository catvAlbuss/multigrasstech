<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; background: #fff; }

    /* ─── Header ─────────────────────────────── */
    .pdf-header {
        background: linear-gradient(135deg, #15803d 0%, #166534 100%);
        color: white; padding: 22px 28px; margin-bottom: 0;
    }
    .pdf-header .company { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
    .pdf-header .report-title { font-size: 13px; opacity: 0.85; margin-top: 3px; }
    .pdf-header .meta { font-size: 10px; opacity: 0.7; margin-top: 2px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .badge {
        background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
        color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold;
    }

    /* ─── Section Headers ─────────────────────── */
    .section-title {
        font-size: 12px; font-weight: bold; color: #15803d;
        border-bottom: 2px solid #15803d; padding-bottom: 5px;
        margin: 16px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* ─── KPI Cards ───────────────────────────── */
    .kpi-grid { display: flex; gap: 10px; margin: 14px 0; }
    .kpi-card {
        flex: 1; background: #f9fafb; border: 1px solid #e5e7eb;
        border-radius: 8px; padding: 12px 14px;
    }
    .kpi-card .kpi-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .kpi-card .kpi-value { font-size: 16px; font-weight: bold; }
    .kpi-card .kpi-sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }
    .kpi-green  { border-left: 3px solid #16a34a; }
    .kpi-red    { border-left: 3px solid #dc2626; }
    .kpi-blue   { border-left: 3px solid #2563eb; }
    .kpi-purple { border-left: 3px solid #7c3aed; }
    .kpi-amber  { border-left: 3px solid #d97706; }
    .text-green  { color: #16a34a; }
    .text-red    { color: #dc2626; }
    .text-blue   { color: #2563eb; }
    .text-purple { color: #7c3aed; }
    .text-amber  { color: #d97706; }

    /* ─── Tables ──────────────────────────────── */
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
    th {
        background: #15803d; color: white; padding: 7px 10px;
        text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    th.text-right, td.text-right { text-align: right; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:nth-child(even) td { background: #f9fafb; }
    tr:last-child td { border-bottom: none; }
    .rank { color: #9ca3af; font-size: 9px; font-weight: bold; }

    /* ─── Bar Charts (CSS) ────────────────────── */
    .bar-chart { margin: 8px 0; }
    .bar-row { display: flex; align-items: center; margin-bottom: 6px; gap: 8px; }
    .bar-label { width: 90px; font-size: 9px; color: #374151; text-align: right; white-space: nowrap; overflow: hidden; }
    .bar-track { flex: 1; background: #e5e7eb; border-radius: 3px; height: 12px; }
    .bar-fill { height: 12px; border-radius: 3px; }
    .bar-value { width: 70px; font-size: 9px; font-weight: bold; color: #374151; }

    /* ─── Category badges ─────────────────────── */
    .cat-badge {
        display: inline-block; padding: 2px 7px; border-radius: 10px;
        font-size: 8px; font-weight: bold; text-transform: uppercase;
    }
    .cat-green  { background: #dcfce7; color: #15803d; }
    .cat-red    { background: #fee2e2; color: #dc2626; }
    .cat-blue   { background: #dbeafe; color: #1d4ed8; }
    .cat-amber  { background: #fef3c7; color: #92400e; }
    .cat-gray   { background: #f3f4f6; color: #4b5563; }

    /* ─── Status badges ───────────────────────── */
    .status-completed  { background: #dbeafe; color: #1e40af; }
    .status-confirmed  { background: #dcfce7; color: #15803d; }
    .status-pending    { background: #fef3c7; color: #92400e; }
    .status-cancelled  { background: #fee2e2; color: #991b1b; }

    /* ─── Layout ──────────────────────────────── */
    .content { padding: 0 28px 20px 28px; }
    .two-col { display: flex; gap: 16px; }
    .col-half { flex: 1; }
    .col-60 { flex: 1.5; }
    .col-40 { flex: 1; }
    .mt-4 { margin-top: 4px; }
    .mt-8 { margin-top: 8px; }
    .mt-12 { margin-top: 12px; }

    /* ─── Footer ──────────────────────────────── */
    .pdf-footer {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: #f9fafb; border-top: 1px solid #e5e7eb;
        padding: 6px 28px; display: flex; justify-content: space-between;
        font-size: 8px; color: #9ca3af;
    }

    /* ─── Page break ──────────────────────────── */
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
    
    /* ─── Divider ─────────────────────────────── */
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
    
    /* ─── Info box ────────────────────────────── */
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
    .info-box .info-label { font-size: 9px; color: #15803d; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
    .info-box .info-value { font-size: 13px; font-weight: bold; color: #14532d; }
</style>
</head>
