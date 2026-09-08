<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

class ManifestProvenanceTest extends TestCase
{
    public function testProvenanceMetadataMatchesEmbeddedManifestBytes(): void
    {
        $root = dirname(__DIR__);
        $manifestPath = $root . '/resources/navigation-runtime-manifest.json';
        $provenancePath = $root . '/resources/navigation-runtime-manifest.provenance.json';

        $this->assertFileExists($manifestPath);
        $this->assertFileExists($provenancePath);

        $sha256 = hash('sha256', (string) file_get_contents($manifestPath));
        $provenance = json_decode((string) file_get_contents($provenancePath), true);

        $this->assertIsArray($provenance);
        $this->assertSame('mrkcntrmn/flatrate-wiki', $provenance['CONTROL_REPO'] ?? null);
        $this->assertSame(
            'configs/forum/navigation-runtime-manifest.json',
            $provenance['MANIFEST_SOURCE_PATH'] ?? null
        );
        $this->assertSame($sha256, $provenance['SOURCE_MANIFEST_SHA256'] ?? null);
    }

    public function testValidateManifestScriptPasses(): void
    {
        $script = dirname(__DIR__) . '/scripts/validate-manifest.php';
        $this->assertFileExists($script);

        $output = [];
        $code = 0;
        exec('php ' . escapeshellarg($script) . ' 2>&1', $output, $code);

        $this->assertSame(0, $code, implode("\n", $output));
        $this->assertContains('MANIFEST_VALIDATE=PASS', $output);
    }
}
