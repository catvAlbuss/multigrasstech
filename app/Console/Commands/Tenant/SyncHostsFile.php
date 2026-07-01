<?php

declare(strict_types=1);

namespace App\Console\Commands\Tenant;

use App\Models\Tenant;
use Illuminate\Console\Command;

class SyncHostsFile extends Command
{
    protected $signature = 'tenant:hosts
                            {action? : sync | add | remove (default: sync)}
                            {slug? : Tenant slug (required for add/remove)}';

    protected $description = 'Sync tenant subdomains with Windows hosts file (dev only)';

    private string $hostsPath = 'C:\Windows\System32\drivers\etc\hosts';

    private string $marker = '#multigrass-tenant';

    public function handle(): int
    {
        if (! app()->isLocal()) {
            $this->error('This command only runs in local environment.');

            return self::FAILURE;
        }

        if (! $this->isWritable()) {
            $this->error('Cannot write to hosts file. Run this command from an Administrator terminal.');
            $this->line('  Right-click on PowerShell/CMD → "Run as administrator"');

            return self::FAILURE;
        }

        $action = $this->argument('action');
        $slug = $this->argument('slug');

        return match ($action) {
            'add' => $this->addEntry($slug),
            'remove' => $this->removeEntry($slug),
            default => $this->syncAll(),
        };
    }

    private function syncAll(): int
    {
        $this->removeAllManagedEntries();

        $tenants = Tenant::all();
        foreach ($tenants as $tenant) {
            $this->appendEntry($tenant->slug);
        }

        $this->info("Synced {$tenants->count()} tenant(s) to hosts file.");
        $this->listManagedEntries();

        return self::SUCCESS;
    }

    private function addEntry(?string $slug): int
    {
        if (! $slug) {
            $this->error('Slug is required. Usage: tenant:hosts add {slug}');

            return self::FAILURE;
        }

        $host = "{$slug}.multigrass.test";

        if (str_contains((string) file_get_contents($this->hostsPath), $host)) {
            $this->warn("{$host} already exists in hosts file.");

            return self::SUCCESS;
        }

        $this->appendEntry($slug);
        $this->info("Added: 127.0.0.1 {$host}");

        return self::SUCCESS;
    }

    private function removeEntry(?string $slug): int
    {
        if (! $slug) {
            $this->error('Slug is required. Usage: tenant:hosts remove {slug}');

            return self::FAILURE;
        }

        $host = "{$slug}.multigrass.test";
        $content = (string) file_get_contents($this->hostsPath);
        $updated = preg_replace("/^127\.0\.0\.1\s+{$host}\s+{$this->marker}.*$/m", '', $content) ?? $content;
        file_put_contents($this->hostsPath, $updated);

        $this->info("Removed: {$host}");

        return self::SUCCESS;
    }

    private function appendEntry(string $slug): void
    {
        $host = "{$slug}.multigrass.test";
        $line = PHP_EOL."127.0.0.1      {$host}      {$this->marker}";
        file_put_contents($this->hostsPath, $line, FILE_APPEND);
    }

    private function removeAllManagedEntries(): void
    {
        $content = (string) file_get_contents($this->hostsPath);
        $updated = preg_replace("/\r?\n127\.0\.0\.1\s+\S+\.multigrass\.test\s+{$this->marker}.*/", '', $content) ?? $content;
        file_put_contents($this->hostsPath, $updated);
    }

    private function isWritable(): bool
    {
        return is_writable($this->hostsPath);
    }

    private function listManagedEntries(): void
    {
        $content = (string) file_get_contents($this->hostsPath);
        preg_match_all('/127\.0\.0\.1\s+(\S+\.multigrass\.test)/', $content, $matches);

        if (! empty($matches[1])) {
            $this->table(['Subdomain resolvable'], array_map(fn ($h) => [$h], $matches[1]));
        }
    }
}
