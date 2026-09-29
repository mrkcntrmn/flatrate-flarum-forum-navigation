<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

class CiComposerAdvisoryPolicyAuditTest extends TestCase
{
    public function testAuditGateFixturesPassWithoutNetwork(): void
    {
        $script = dirname(__DIR__) . '/scripts/ci-composer-advisory-policy-fixtures.php';
        $this->assertFileExists($script);

        $output = [];
        $code = 0;
        exec('php ' . escapeshellarg($script), $output, $code);

        $this->assertSame(0, $code, implode("\n", $output));
        $this->assertContains('ADVISORY_POLICY_FIXTURES=PASS', $output);
    }
}
