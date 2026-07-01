<div class="pdf-footer">
    <span>{{ $tenantName }} — {{ $periodLabel }}</span>
    <span>Reporte generado el {{ $generatedAt }} | CONFIDENCIAL</span>
    <script type="text/php">
        if (isset($pdf)) {
            $text = "Pág. {PAGE_NUM} de {PAGE_COUNT}";
            $font = $fontMetrics->get_font("Helvetica");
            $size = 7;
            $color = [0.6, 0.6, 0.6];
            $pdf->page_text(560, 826, $text, $font, $size, $color);
        }
    </script>
</div>
